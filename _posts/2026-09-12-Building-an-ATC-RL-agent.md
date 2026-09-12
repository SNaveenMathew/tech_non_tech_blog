---
layout: post
date: 2026-09-12 00:00:00 -0500
---

## Building an ATC reinforcement-learning agent — going beyond FlightPathAnalysis's pipeline

### Background

In July 2019 I co-invented a US patent at IBM Research — [Traffic Management for Unmanned Aircraft](https://www.researchgate.net/publication/378067675_Traffic_management_for_unmanned_aircraft) (US11830371B2, approved in November 2023). It remains one of the most interesting pieces of work in my career; since then I've been working on it at an open-source line of research: how much of the actual *decision-making* in air traffic control can be handed to a learned policy, and what does it take to trust it enough to watch it work?

In the [FlightPathAnalysis](https://github.com/SNaveenMathew/FlightPathAnalysis) repository I built the supporting layer of the longer project. It's organized as a five-part pipeline, roughly — pull raw ADS-B tracks and airport reference data, clean up the anomalies, infer the phase of flight (climb, cruise, approach, etc.), turn the cleaned tracks into something you can look at and animate, and use all of that to model flight paths well enough to replace a part of the air traffic controller's job (~landing at an airport). The repo was organized into folders - each serving a single purpose — `00-Requirements`, `01-Downloaders`, `02-Preprocessing`, (*more to come*): a real ADS-B ingestion and cleaning pipeline. Anyone who has looked at raw ADS-B knows how much of it is 'jumpy', anomalous, and contains inconsistent phase transitions.

This project (`atc_app`) is not a simple extension of the previous repo. It's a deeper effort — given a wide sector's traffic:
1. Train an agent using reinforcement learning that recommends instructions
2. Use a physics simulator to test it against (with a hook for BlueSky, the real ATM research simulator)
3. Visualize (inspired by flightradar24) and animate flight paths

FlightPathAnalysis's job is *getting the data right and organizing it in the right way*; this project's job starts from *assume the data is right and preprocessed appropriately — now what should the controller do?*.

### The core loop

The environment is represented by a discretized-state inspired by the previous repo. The reward function is defined as shown below:

```
R = R_safety + R_efficiency + R_workload + R_exit

R_safety     = −100 × (# active loss-of-separation conflicts)
             + −10  × (# pairs inside the alert zone, ≤ 1.5× separation minima)

R_efficiency = −0.05 × (# aircraft in sector)     # fuel/time cost per step
R_workload   = −0.5  if a non-HOLD instruction is issued
R_exit       = +5.0  × (# aircraft exiting the sector cleanly)
```

Standard ICAO separation is imposed — 5 NM horizontal, 1,000 ft vertical. The agent is a Dueling Double DQN over a discretized position/altitude/speed/heading state, choosing between heading, altitude, and speed instructions (including an explicit "hold" for each) per aircraft per step.

None of that is unusual for this problem class. The main novelty is the reward function (and the potential improvements to be introduced after some meta analysis to be done in the previous repo).

#### Reinforcement learning: what worked and what didn't

During training the mean reward improved from about −17,600 to a best of around −5,500 for the first ~250 episodes. Then, between episodes 250 and 500 the reward dropped to −24,000 to −38,500, and the DQN's Huber loss climbed roughly 100x. The reward function's shape was not well-suited for a DQN.

*Idea:* keep the reward function's units exactly as-is everywhere they're logged or reported, but divide by a constant — `REWARD_SCALE = 20.0` — only at the point a transition enters the replay buffer. A positive linear rescale of reward won't change the optimal policy; it changes only the numerical scale the network has to represent.

| | Loss (mean, end of training) | Loss (peak) | Reward (mean) | Reward (median) |
|---|---|---|---|---|
| Before | 1,118.95 | 7,901.73 | −17,336 | −8,827 |
| After | 1.66 | 21.77 | −12,606 | −6,533 |

Loss went from diverging by two orders of magnitude to staying flat for the entire run. Reward improved too, though it's still solidly negative and noisy episode-to-episode. However, this is a genuinely hard multi-agent control problem that's far from "solved". There's a problem that still needs to be solved — there's no incentive for each aircraft to take any action. The agent is incentivized to avoid conflicts only when it encountered them. There's no intermediate reward/penalty for every intermediate step that avoided/caused a conflict.

#### Visualizing the trajectories

FlightPathAnalysis's fourth stage was inspired by [flightradar24.com](https://www.flightradar24.com/).

<figure>
  <img src="../../../data/flightradar24_screenshot.png">
  <figcaption>A screenshot from flightradar24.com</figcaption>
</figure>

**Click for detail, color for status at a glance.** Detail boxes only render on click now (reusing a popup component that already existed but had never actually been reachable); the aircraft icon itself is colored red/orange/purple/blue by conflict/alert/congestion/clear status, the same way a real radar display would use symbology instead of text. The right side tab list (Conflicts / Proximity Alerts / Congestion) displays more information on the individual conflicts.

<figure>
  <img src="../../../data/atc_app_screenshot.png">
  <figcaption>A screenshot from the ATC visualizer</figcaption>
</figure>

### Learnings

This project is far from perfect. There's still a real gap between this project and a deployable one: training applies instructions instantly, while the simulator (and BlueSky) apply them at realistic turn/climb rates, so a policy trained under one assumption is evaluated under another. That mismatch is visible in the benchmark numbers and documented in the repo rather than papered over — it's the most promising next thing to fix, not a footnote.

Here are some things I've learned along the way:

- A reward function's *shape* (which term should dominate, which should be marginal) and its *scale* (whether a DQN with a fixed learning rate can represent it without diverging) are separate design decisions. Getting the first one right doesn't automatically make the second one right.
- Rescaling reward by a positive constant at the point it enters the replay buffer keeps benchmark output human-readable while fixing the actual training-stability problem. Two different consumers (the optimizer, the person reading a log) can legitimately want two different units of the same signal.
- Decluttering a live visualization and keeping it live are in tension. The resolution is usually to preserve state across re-renders

#### A short closing note

Every fix in this project — the reward scale, the popup positioning, the Leaflet event-ordering bug — got reverted, re-tested to confirm it reproduces the reported symptom, and restored. A fix that only "looks right" in a code diff isn't verified.

Code is at [github.com/SNaveenMathew/atc_app](https://github.com/SNaveenMathew/atc_app). I'm happy to collaborate on the next steps with anyone who's interested in solving this problem in an open-source way.

---
*Tags: Reinforcement Learning, Air Traffic Control, ADS-B, Deep Q-Networks, Data Visualization*
