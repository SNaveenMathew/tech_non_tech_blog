---
layout: post
date: 2026-10-24 00:00:00 -0400
description: "A custom ROM patcher makes NES Tennis actually trainable. The RL model is not working: early policies refused to serve because that turned out to be the safest strategy. Using an LLM instead would only make things worse."
image: /assets/previews/tennis_point_demo.gif
---

## Teaching an RL agent to play NES Tennis - a work in progress

**TL;DR** - the most useful thing in this project is the infrastructure for emulating NES Tennis, patching the ROM to configure different scenarios, and recording human gameplay in a format designed for model training. The RL model itself is not yet performing well. Replacing the RL model with an LLM or VLM is also a non-starter: both GPT and Claude pointed out why, and the reasoning comes down to latency and timing constraints.

---

### The infrastructure: custom ROM builder and recording pipeline

I'm not an expert in Lua. Claude and Gemini models were used as coding agents to build the infrastructure.

The project is built on top of [MesenCE](https://www.mesen.ca/), a cycle-accurate NES emulator that exposes a Lua scripting API. A custom Lua bridge captures controller state, score signals, and the raw 256x240 framebuffer at roughly 60 decisions per second.

The ROM itself had to be patched before it could be used for training, recording demonstrations, or evaluation. Unmodified NES Tennis starts with a title screen and a level-select menu, and the default serve configuration is hardcoded. For a training loop - where you want to isolate specific scenarios like serving versus receiving, or playing from the deuce side versus the ad side against different CPU difficulties - interactive menus only add friction. The patcher modifies the base game at specific memory offsets to bypass the title screen entirely, skip the level select, set the opponent difficulty directly in RAM, and configure whether the player serves or receives first. The result is a family of patched ROM variants that boot straight into gameplay at the exact difficulty and role needed for a given scenario.

The recording side connects through Mesen's input polling callback. During play, the bridge captures every controller input alongside the corresponding frame, stacks consecutive grayscale observations, and saves structured point-level demonstrations whenever a score change is detected. Winning and losing points are separated into distinct pools. A losing point is not treated as if every single action in it was wrong - the point outcome determines the bucket, not the individual frame actions.

<figure>
  <img src="../../../data/tennis_contact_sheet_page001.png">
  <figcaption>Contact sheet for a single recorded point - four consecutive frames at native 256x240 resolution. The ball is visible near the bottom of the court at the serve.</figcaption>
</figure>

To inspect recorded gameplay visually, the pipeline renders contact sheets and animated replays directly from captured frames:

<figure>
  <img src="../../../data/tennis_point_demo.gif">
  <figcaption>Animated replay of a single recorded point. Each frame is one raw NES frame captured at ~60fps.</figcaption>
</figure>

The core design goal was keeping recording and environment resets friction-free: observations are stored ready for model ingestion, and the patched ROMs allow clean isolation of serve and receive phases without manual menu navigation.

---

### The model: what was tried and why it is not working

The first model was a flat recurrent PPO trained with a simple sparse reward - +1 for winning a point, -1 for losing one, and a small step penalty over time. There are two predictable failure modes with this setup on NES Tennis, and the policy discovered both of them.

The first is the "Do Not Serve" exploit. When the agent serves, it only receives negative rewards on points it loses. If it never hits the serve, the point never starts and the negative outcome never arrives. The policy converged on this exact behavior: it learned to stand at the baseline and do nothing. From a pure reward-maximization standpoint, refusal to play was locally optimal.

The second failure mode appeared after adding a blanket step penalty to force movement. This pushed the policy in the opposite direction - high-entropy random button mashing. NES Tennis requires precise 1-frame shot timing. Swinging and moving wildly during every frame rarely produces a clean hit, so the agent accumulated penalties without ever discovering a reward.

The current architecture uses a learned hierarchy: a recurrent visual encoder feeds a root phase gate that chooses a high-level skill (`serve`, `receive`, `baseline`, `approach_net`, `recover`, `shot`, `wait`), and each skill has its own actor-critic head over 27 movement and button combinations. To improve credit assignment, points are split into `late`, `mid`, and `start` sub-episodes. A reverse curriculum trains the `late` rally phase first and unlocks `start` last - the idea being that the policy should understand how to return balls before learning how to initiate a point.

The serve stall penalty is also targeted rather than indiscriminate: an opening segment that reaches its time horizon without a serve incurs a fault penalty, but only when the scenario metadata confirms the agent is the server. For the receiver, a timeout is treated simply as a truncation.

Offline sanity checks pass - optimizer updates are stable, imitation loss decreases on synthetic tasks, and model checkpoints round-trip properly. But passing programmatic smoke tests is very different from playing competitive tennis: measuring real win rates against the game's built-in AI remains the actual test, and that is where the model currently falls short.

---

### Enhancement efforts: demonstrations and sequence tagging

The current effort focuses on making better use of recorded human gameplay. After collecting demonstrations, each point is tagged with task-level segment labels: identifying which frames correspond to `serve_timing`, `intercept_track`, `hold_cover`, and related actions. The schema uses thirteen independent and mutually exclusive skill labels, each with strict boundary conditions:

| Skill | Phase | Description |
| :--- | :--- | :--- |
| `serve_timing` | Serve | Deliberate positioning and toss timing before the serve stroke starts; excludes ball execution and flight. |
| `serve_placement_power` | Serve | Directional steering and power input during serve execution. |
| `serve_recovery` | Serve | Movement back toward a neutral court position immediately following a serve. |
| `receive_position` | Receive | Anticipatory footwork and court positioning while waiting for the opponent's serve. |
| `return_stroke_timing` | Receive | Triggering and timing the return shot against an incoming serve. |
| `intercept_track` | Rally | Active movement to intercept an incoming live ball; ends before entering the shot-timing window. |
| `hold_cover` | Rally | Deliberately holding a tactical court position to defend open angles while the opponent plays the ball. |
| `recover_reposition` | Rally | Re-centering and returning to a balanced baseline or court position after hitting a rally shot. |
| `approach_net` | Rally | Decisive forward movement toward the net to cut off the ball for a volley. |
| `retreat_lob` | Rally | Backwards tracking and retreating to recover against an overhead lob. |
| `stroke_selector` | Rally | Selecting shot angle and trajectory (e.g. cross-court vs down-the-line) prior to contact. |
| `stroke_timing` | Rally | The critical decision window to swing at the precise contact frame rather than waiting. |
| `transition_wait_reposition` | Transition | Setup and dead-ball positioning between points or before the serve sequence begins. |

A Streamlit annotation app handles this tagging workflow. It presents a video preview rendered from recorded frames, provides an interactive table for setting segment boundaries and labels, and exports the structured sequences for the training pipeline.

<figure>
  <img src="../../../data/tennis_annotation_app.png">
  <figcaption>The annotation app: point playback on the left, task segment table on the right. Segment bounds and labels are reviewed visually before being passed to the training pipeline.</figcaption>
</figure>

Sequence tagging matters because high-level skill supervision cannot be reliably inferred through heuristics. Simple metrics like pixel motion centroids or button press frequencies fail in practice: a cluster of moving pixels in NES Tennis is often court art or shadows rather than the ball, and rapid movement is not always an approach to the net. Without explicit human-verified boundaries, the manager receives no supervisory signal and must rely solely on sparse returns, reintroducing the credit assignment bottleneck.

Demonstrations from winning and losing points are handled differently at the segment level. In a lost point, only the terminal failure segment receives a negative return. Preceding segments - a clean serve or well-placed rally shot - still receive positive continuation credit, allowing the policy to learn viable stroke mechanics without penalizing the entire sequence for a late mistake.

---

### On replacing this with an vision-language model (VLM)

A natural question is whether a modern VLM could simply play the game directly, bypassing reinforcement learning altogether. The answer is no, and both GPT-6 and Claude Sonnet 5 reached the same conclusion.

NES Tennis requires decisions at approximately 60Hz. A VLM call typically takes multiple seconds, and the emulator cannot pause while an external model runs inference. Latency aside, shot execution in NES Tennis relies on single-frame timing windows - an operational mode fundamentally unsuited to token-by-token generation or chain-of-thought prompting. The core challenges of the task - precise timing, credit assignment, and exploration in low-reward spaces - are not solved by switching to a slower model that cannot be trained online or learn from environment feedback.

The infrastructure - emulating the game, patching ROMs for scenario isolation, recording gameplay, and structuring sequence annotations - is the functional foundation. Getting the policy itself to play reliably remains the open challenge. Even though I'm GPU starved (~still using my 16GB Nvidia RTX 4090 Laptop GPU), I strongly believe the solution is not too far away.

Code is at [github.com/SNaveenMathew/tennis_rl_production](https://github.com/SNaveenMathew/tennis_rl_production).

---
*Tags: Reinforcement Learning, NES, Emulation, Imitation Learning, Hierarchical RL*
