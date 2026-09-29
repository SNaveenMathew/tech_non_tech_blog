---
layout: post
date: 2026-09-28 12:00:00 -0400
---

## A living catalog and self-serve data onboarding for the house-hunting agent

In my [last post](https://snaveenmathew.github.io/tech_non_tech_blog/2026/08/23/Sharpening-the-house-hunting-agent.html), I described how introducing Phoenix observability, a query-planning layer, and an expanded evaluation suite helped sharpen the house-hunting agent. By separating semantic query planning from raw SQL generation, the agent stopped attempting to solve every analytical problem in one monolithic prompt.

In earlier versions, adding a dataset meant writing custom Python loaders, hand-coding table definitions and joins in `db/schema_catalog.py`, updating vector embeddings, and restarting the backend server. That approach works for a curated toy dataset, but real estate analysis is inherently fragmented: one buyer cares about school attendance boundaries, another wants EPA walkability indices, historical flood boundaries, zoning variances, or property tax millage rates. If bringing in a new file requires code changes and server restarts, the system remains a developer prototype. To solve this, the app evolved into an extensible system with a **persistent, unified catalog store** and a **self-serve, human-in-the-loop data onboarding pipeline**.

<figure>
  <img src="../../../data/updated_architecture_2026_09_20.png">
  <figcaption>Updated architecture (2026-09-20) - Living catalog store, deterministic discovery, local model drafting assistant, and live agent awareness</figcaption>
</figure>

## The "AI Ingestion" trap vs. deterministic discovery

The instinctive approach for developers is to hand an uploaded file to an LLM and prompt it to figure out the schema and join keys. In practice, this produces silent, catastrophic analytical failures:

- **Hallucinated joins**: LLMs join on similar-sounding column names across incompatible domains.
- **Grain and cardinality confusion**: Models cannot tell by intuition whether a dataset is at the parcel level, Census block group, 11-digit Census tract, or ZIP code, causing runaway row duplication and distorted averages.
- **Loss of verifiable truth**: Inverting the relationship graph at runtime leaves no deterministic ground truth you can inspect, audit, or test.

The core architectural rule remains: **The LLM writes text; either deterministic code or human-in-the-loop decides what is true, what is relevant, and what is allowed.**

Applying that boundary to data onboarding led to a clean division of responsibilities:
- **Type inference and key detection**: Deterministic code identifies candidate entity keys (11-digit Census Tract FIPS, coordinates, addresses). Spatial point-in-polygon joins automatically resolve raw coordinates to Census tracts.
- **Relationship discovery**: Instead of guessing, `services/relationship_discovery.py` runs targeted SQL queries against DuckDB to measure actual row match rates, cardinality (1:1, 1:N, N:N), and fan-out ratios.
- **Metadata drafting**: LLM running under strict grammar constraints drafts table titles, column descriptions, and search synonyms.
- **Human-in-the-loop gate**: The buyer inspects measured match evidence and explicitly approves the table and join paths before publication.

## A unified catalog store in DuckDB

In earlier versions, `db/schema_catalog.py` was a static Python dictionary. Adding a dataset meant committing code. Now the catalog lives directly inside DuckDB across dedicated tables:
- `catalog_tables` and `catalog_columns`: Physical data types, logical roles (measure, dimension, entity ID), units, and descriptions.
- `catalog_relationships`: Source and target tables, join expressions, cardinality, and measured match confidence.
- `catalog_concepts`: Semantic concepts, default aggregations, and declared overrides.
- `catalog_audit` and `catalog_version`: An append-only audit trail and a monotonic counter incremented after every approved change.

`db/schema_catalog.py` was refactored into a lazy, hot-reloading in-memory view over these tables. When a change is approved, the store commits the transaction, increments the version counter, and reloads in place without dropping connections or restarting the server. The store-backed module matched the legacy static catalog identically across 131 verification checks and 417 alias queries, making this a faithful migration.

## Known conflicts and declared overrides

A subtle gotcha emerged during live testing: if a user onboarded an EPA walkability dataset with the alias *"walkability index"*, the semantic planner matched both that new dataset and the existing built-in *"walkability"* concept (`houses.walk_score`). This is not a bug, but a known issue with LLM-based similarity matching. To resolve ambiguity without prompt hacks, the catalog store supports **declared concept overrides**: a specialized concept explicitly states which broader concepts it supersedes during query planning.

```python
Concept(
    concept_key="walkability_index",
    aliases=["walkability index"],
    overrides=["walkability"]  # Suppresses broader houses.walk_score when both match
)
```

This drops the broader concept whenever the specialized one matches. Instead of generating conflicting SQL filters or silently falling back to pre-packaged Walk Scores, the planner deterministically targets the user's newly uploaded dataset.

## Immediate agent awareness without restarts

Approved data is accessible instantly (without server restarts) to the users because agents inspect the live catalog on every turn:
- **General Chat**: The query planner discovers the new table through semantic matching, adds it to the SQL allowlist, and navigates the approved join graph.
- **House Chat**: Instead of dynamically hacking tools into an AST, House Chat uses a single dynamic function (`get_linked_dataset_records`) that traverses join paths from the active house to fetch matching rows.
- **Incremental Vector Search**: ChromaDB embeds only new or modified metadata on version bumps, falling back to lexical search if local embedding models are offline.

<figure>
  <img src="../../../data/data-catalog.png">
  <figcaption>Data catalog schema map</figcaption>
</figure>

## The Data page: schema map and dataset workbench

This pipeline was exposed to the users in a dedicated **Data page** (`/data`):
- **Schema Map**: An interactive visual graph of all active tables, storage origins (`builtin` vs. `user`), row counts, and join edges.
- **Dataset Workbench**: Drag-and-drop file staging for CSV, Excel (`.xlsx`/`.xls`), GeoJSON, and Parquet files.
- **Review Modal**: Inspecting match rates, cardinality, sample row evidence, and drafted column definitions before one-click publishing.

## Takeaways

Relying on LLMs to paper over data engineering shortcomings creates bloated prompts, brittle context, and compounding hallucinations. Better data and agent architecture wins over sophisticated prompts over a weak architecture:
- Establish a **formal semantic catalog** as the single source of truth.
- Use **deterministic code and SQL** to measure join truth and profile data.
- Confine the LLM to **grammar-constrained drafting tasks**.
- Keep a **human in the loop** to review evidence before publishing.

With a living catalog store, the house-hunting agent is no longer tied to a rigid set of pre-baked tables—it is an extensible analytical platform where new data can be onboarded, verified, and queried immediately without explicit code changes or server restarts.

---

Code is on [GitHub](https://github.com/SNaveenMathew/real_estate_app_v1). None of this replaces walking the neighborhood or hiring a home inspector, but having a verifiable, extensible data model makes navigating complex markets far more manageable.
