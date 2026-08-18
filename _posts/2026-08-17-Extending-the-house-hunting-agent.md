---
layout: post
date: 2026-08-17 12:00:00 -0500
---

## Extending the house-hunting agent - adding datasets without adding code

In my [last post](https://snaveenmathew.github.io/tech_non_tech_blog/2026/08/10/Building-a-house-hunting-agent.html) I listed what was still missing from the new app - crime, walkability, flood boundaries, more sold-home coverage - and closed by saying each new source could just be "Clauded" and added to the respective prompts as needed. In this article I will describe how data on crime and bike infrastructure were added to the data ingestion layer, to the dashboard layer and to the 'General Chat' agent. I will conclude by showing how to add other new data to the app.

## What actually changed

### The metadata catalog

The list of possible tables and joins/relationships was previously defined in the system prompt (independent of the query). This bloated the prompt - the 'agent' was using an extremely long prompt to reason about simple questions; this may cause context rot and lead to inconsistent answers from the agent. Now, **`db/schema_catalog.py`** abstracts out the information about tables and joins — which tables exist, which columns are reliable vs. noisy, which joins are valid, what filters and caveats matter. As a result, the agent reads only the information about necessary tables and joins based on the input query at runtime.

### The data/app layer

The following changes were made to the data/app layer:

- **`db/duckdb_store.py`** is a cleaner abstraction over the actual database instead of connection and query code scattered across services.
- New loaders were added to **`services/data_loader.py`** - one for each new dataset (crime, bike infrastructure).
    - One parser per city for crime defined in **`services/crime_sources.py`** - as seen in the previous app, crime data is heterogeneous across cities. These parsers harmonize incident data into a common taxonomy.
    - A parser for bike infrastructure - bike infrastructure data may also be heterogeneous across cities.
- Map layers were added to **`services/layers.py`** - NRI (existing data, new layer), crime (new), bike infrastructure (new).

New specialized tools were written only for complex segments - Eg: segments that cannot be SQLized. For example, a Dijkstra's shortest path tool was added for the bike infrastructure dataset to look for 'safe' bike routes between two locations that are passed to the agent. None of this touches the stack from last time - same FastAPI backend, same two LangGraph agents, same DuckDB and ChromaDB - core architecture remains the same. Only the prompt was cleaned up as described in the metadata catalog section.

## The only hard dependency

Redfin lets you export your favorites as a CSV with address, lat-lon, price, square footage and a few other fields for free. Currently this app has a hard dependency on Redfin's favorites. However, I'll work on removing that dependency in the future - all that's needed is the address; geocoding and walkscore (see R code from the previous app) APIs will be called on the fly; I'm yet to decide on a way to ingest price, sqft, etc.

This app is close to a blank canvas: it works off bare minimum data about houses, "Claudes" one dataset at a time and "Claudes" one tool at a time. Complex questions are offloaded to the LLM/agent's "planning" phase.

## Wiring up the new datasets with the agent

The current agent design gets rid of dataset-specific tools and prompts. Here's an example in action: once the standardized crime table exists and is added to `schema_catalog.py` (what it joins to, on what key, what the taxonomy column means), the agent doesn't need a crime-specific tool. `get_database_schema` fetches the new table name for the agent's planning phase; `query_database` uses the schema and relationships to build the query (using the LLM). No more "if the user asks about crime" prompt branch!

Ingesting and harmonizing bike routes is a one-time plumbing activity - same as crime. But *routing* over the bike network - actually finding a path across a graph of facilities - isn't a simple 'SQL join'. It may be difficult for the LLM/agent to produce the necessary code - so 'bike routing' got its own tool. 

Note: if the answer can be derived from 'relations' in the 'relational data', `schema_catalog.py` plus `query_database` can handle it with no new code. If the answer requires an algorithm - a route, a distance calculation, etc. - it needs a new tool. Crime turned out to be the first kind. 'Safe' bike routing is the second.

## Adding new datasets - the same recipe

Different people have different needs. Walkability and 'safe' drinking water were a few of my needs. [EPA's Smart Location Database](https://www.epa.gov/smartgrowth/smart-location-mapping#walkability) - neighborhood-scale walkability built on Census block-group geography and [lead service line / water infrastructure data](https://www.arcgis.com/apps/webappviewer/index.html?id=9d7352ef7f694c8eb5f703a3e0955fda) need to be added to meet my goal.

The recipe is the same - the new data can be 'Clauded' as shown below:

- Add the table to `db/duckdb_store.py`.
- Add the join logic to `db/schema_catalog.py` - Eg: walkability links to the same tract/block-group geometry as NRI and census; lead line links using parcel or address (`services/geocoder.py`, the pipeline built for sold-home comps, also solves the same problem).
- Add a loader in `services/data_loader.py`, flag the data's actual granularity - parcel-level vs. service-area estimate - as a caveat in the catalog.
- Let the agent discover it. No new tool. No new prompt branch. No "walkability question" or "lead pipe question" handler.

What's interesting is that the moment both tables and their join keys exist in `schema_catalog.py`, they sit in the same reasoning space as crime, bike infrastructure, NRI, sold-home comps, and census/CBSA context that are already available. Nobody has to write a tool for the combination because the LLM/agent reasons using the schema and relationships!

However, a new tool is needed if a complex algorithm is required to infer the answer from the data. For example, if a public transit network + timing data and a specialized 'planning tool' are available the agent can make a public transit plan between two locations by finding a path over the transit network (shortest path/time depending on the need).

Concretely: once those two tables exist, a question like "which of my favorites are in the top quartile for walkability, have no known lead service line risk, and sit in a tract with below-average crime over the last year" (`query_database` uses the LLM/agent's reasoning to identify the joins across four tables to answer this question; no new tool needed) becomes answerable with zero new Python!

## The actual advantage

The design was not a coincidence. Adding new data to my old app was a challenging task - hand-coding new data loaders and new story-driven layers took time (this was before the LLM coding era). The 'code agent' approach from the last post (`get_database_schema` and `query_database` in place of a tool per question) was a deliberate design choice made specifically so both the ingestion layer and the agent layer could grow without hardcoding or one-off workflows for each new data source. A new dataset only needs a loader and a catalog entry, not a new tool or a new prompt branch. This is the same "metadata in, code out" idea from the previous post, just proven on a harder case and scaled up for more complex scenarios. 

The per-house agent's five tools (comps math, the NRI lookup, and the rest) are still hand-written and not schema-driven - this is a problem for another day.

## A real example to top it all off

**Visuals:**

<figure>
  <img src="../../../data/pittsburgh_biking.png">
  <figcaption>Bike routes in Pittsburgh</figcaption>
</figure>

<figure>
  <img src="../../../data/pittsburgh_crime.png">
  <figcaption>Crime in Pittsburgh</figcaption>
</figure>

**Question to the agent:** Find a bike path between 529 Peebles St, Regent Square, PA 15221 and Highland Park, Pittsburgh that avoids crime prone areas.

**Agent reponse:**

The following bike route from 529 Peebles St, Regent Square to Highland Park, Pittsburgh is supported by the BikePGH infrastructure network.

Route Summary
Distance: 3.42 miles
Estimated Duration: 20.5 minutes
Infrastructure Types: The route utilizes a variety of bike-friendly paths, including Bike Lanes, Sharrows, On Street Bike Routes, and Cautionary Bike Routes.
Safety Note
While the route follows documented bicycle infrastructure, please note that the area contains recorded crime incidents (such as theft, burglary, and vandalism) in the vicinity of the route. This route is selected based on the availability of bike-specific infrastructure and does not guarantee safety.

Turn-by-Turn Directions
Start on BikePGH mapped infrastructure for 0.49 miles.
Turn right and continue on BikePGH mapped infrastructure for 0.07 miles.
Turn left and continue on BikePGH mapped infrastructure for 0.14 miles.
Turn right and continue on BikePGH mapped infrastructure for 0.27 miles.
Turn left and continue on BikePGH mapped infrastructure for 0.07 miles.
Turn right and continue on BikePGH mapped infrastructure for 0.48 miles.
Turn left and continue on BikePGH mapped infrastructure for 0.36 miles.
Turn right and continue on BikePGH mapped infrastructure for 0.32 miles.
Turn left and continue on BikePGH mapped infrastructure for 0.09 miles.
Turn right and continue on BikePGH mapped infrastructure for 0.72 miles.
Turn right and continue on BikePGH mapped infrastructure for 0.23 miles.
Turn left and continue on BikePGH mapped infrastructure for 0.20 miles.

<figure>
  <img src="../../../data/pittsburgh_crime_bike_route.png">
  <figcaption>Agent generated bike route accounting for crime</figcaption>
</figure>

## Pending

- National Walkability Index
- Raw polygons for lead pipes
- FEMA's actual flood hazard polygons
- Zillow's home value and market heat indices
- Sold-home county parsers for additional counties
- Converting the per-house agent to the same schema-driven path as general chat

---

Code's on [GitHub](https://github.com/SNaveenMathew/real_estate_app_v1). Same closing note as last time: none of this replaces an actual realtor, an actual inspection or actually walking the block at 7pm on a Tuesday. It just means better and more relevant data, better inferences, better decisions.
