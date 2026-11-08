---
layout: post
date: 2026-11-06 00:00:00 -0500
description: "Individual-flight animation and manual phase labels expose differences hidden by aggregated route views."
---

## Disaggregation - from flight-path templates to individual flights

### Individual flights take different paths

In my [previous post](https://snaveenmathew.github.io/tech_non_tech_blog/2026/10/31/Flight-Path-Templates.html), I grouped ADS-B tracks into route templates. The mean path shows the corridor shared across many flights, but it hides how each aircraft flew through it.

`FlightPathAnalysis` now has an interactive view for individual sessions. I can follow an aircraft along its track, compare its altitude with the estimated flight phase and rotate the view from overhead into 3D.

The animation compares four recorded arrivals to JFK. Their first retained points are within 1.6 km of one another, but their routes differ before they land. Different circumstances may have shaped each flight; the tracks show where they diverge, not why. These four sessions are individual examples, not a summary of all arrivals.

<figure>
  <iframe src="../../../assets/flightpath-jfk-arrivals.html" title="Rotatable animation of four JFK arrival tracks" loading="lazy" style="width: 100%; height: 800px; border: 0;"></iframe>
  <figcaption>Select a flight below the plot, use Follow to keep it centered and toggle Ghosts to view concurrent neighborhood traffic. Drag to rotate and scroll to zoom. Each track starts at its first retained sample. <a href="../../../assets/flightpath-jfk-arrivals.html">Open the comparison in its own page</a>.</figcaption>
</figure>

### Reviewing flight phases

The phase labels are estimates from the ADS-B track, not labels read from a controller's record. To tag the flight phase for each new point, the app looks at that point and recent ones before it. It checks the altitude trend over time and waits for a climb or descent to persist before changing phase, so that one noisy altitude reading will not immediately flip the label (ADS-B tracks are noisy). When an aircraft is descending toward JFK, its distance, height above the airport and rate of approach help distinguish an approach from a descent farther away. A sustained, nearly level track is labeled cruise farther from the airport and level flight nearer to it. The estimate does not use later points in the flight.

Using the newly designed tool the user can select a time range in the animation or timeline, assign a phase, choose a confidence level and leave a note. The predicted and manual labels appear on separate timeline rows, so the user can see where they agree or differ. The report counts agreement across tagged points and lists disagreements with the altitude and evidence behind the estimate. The future plan is to inspect those cases before changing the phase rules and export the tags for expert review (this is not my first crowd-sourcing effort). The manual labels give me a way to check the estimates against the track; they do not make the estimates ground truth - work in progress.

### Neighborhood ghosts and separation

A single track makes an approach look quiet. The reality is crowded. To see what each flight shared the sky with, I built a neighborhood index that pairs sessions overlapping in both time and airspace across the 48-hour collection.

Scanning all 1,828 sessions, the index flags nearby traffic within a 15-nautical-mile bubble. It checks separation against FAA terminal rules, using 3 nautical miles horizontally and 1,000 feet vertically for an alert, or 5 nautical miles and 2,000 feet for caution. Another check tags flights following along the same corridor as in-trail.

In the animation, turning on 'ghosts' shows those concurrent tracks as translucent paths. These markers move in lockstep with the clock, placing neighboring planes where they flew at that exact second. A connector line and readout show real-time distance to the closest traffic, so you can watch two flights merge toward the runway or hold their spacing.

### An interesting case

Things become more interesting when '0c208c · 0c208c_S2 · 38 min' is selected from the bottom and 'ghosts' is turned on. The animation shows the other sessions progressing as usual, but this session had to take a longer route initially to avoid a conflict with a1bc92 that crossed the 'template path' - think of this like car traffic around a multi-way stop sign in North America. However, 0c208c had more than the required separation from a1bc92 - so, 0c208c took a shorter route to intercept the final landing template path.

This visualizations sits in the middle of the transition towards a reinforcement learning formulation that can solve ATC. These subtle discoveries are easy to spot manually. Identifying / labeling these appropriately using raw / processed ADS-B data is still challenging (need to think about scalability as well) - I already started work on the [repo](https://github.com/SNaveenMathew/atc_app), but an efficacious reinforcement learning implementation has to wait.
