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
  <figcaption>Select a flight below the plot and use Follow to keep it centered. Drag to rotate and scroll to zoom. Each track starts at its first retained sample. <a href="../../../assets/flightpath-jfk-arrivals.html">Open the comparison in its own page</a>.</figcaption>
</figure>

### Reviewing flight phases

The phase labels are estimates from the ADS-B track, not labels read from a controller's record. To tag the flight phase for each new point, the app looks at that point and recent ones before it. It checks the altitude trend over time and waits for a climb or descent to persist before changing phase, so that one noisy altitude reading will not immediately flip the label (ADS-B tracks are noisy). When an aircraft is descending toward JFK, its distance, height above the airport and rate of approach help distinguish an approach from a descent farther away. A sustained, nearly level track is labeled cruise farther from the airport and level flight nearer to it. The estimate does not use later points in the flight.

Using the newly designed tool the user can select a time range in the animation or timeline, assign a phase, choose a confidence level and leave a note. The predicted and manual labels appear on separate timeline rows, so the user can see where they agree or differ. The report counts agreement across tagged points and lists disagreements with the altitude and evidence behind the estimate. The future plan is to inspect those cases before changing the phase rules and export the tags for expert review (this is not my first crowd-sourcing effort). The manual labels give me a way to check the estimates against the track; they do not make the estimates ground truth - work in progress.
