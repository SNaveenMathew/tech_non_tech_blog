---
layout: post
date: 2019-08-06 12:00:00 -0500
---

## Lessons from my Internship (and Immediate Aftermath)

### Introduction

Riding on the machine learning wave and the associated business jargon is an easy task. Nowadays the process of 'applied data science' has been limited to importing packages, reading data, preprocessing and using predefined APIs for classification/regression. The objective of this article is to use only the basic terminology associated with reinforcement learning, thereby limiting the target audience to people who are familiar with the underlying difficulties of defining a reinforcement learning problem. Expect a dry article because the details of the problem have been abstracted out.

### Background — Personal

Summer internship can be tiring, but I feel the opposite. In the end, the ‘result’ is a binary flag which currently has a value False. This is one of the short run motivations. The long run motivation is philosophical. I rejected 2 (higher paying) offers to signup for a dream — to accomplish something significant in life. Dreams don't come true in 3 months, but there were significant learnings during Summer.

### Initial Work

The problem (confidential) was framed appropriately to fit into a reinforcement learning framework. The initial experiments were designed using DQN to approximate the Q function. These were immediately ruled out due to the large run time (estimate: ~ 20 days per experiment). Cleverly designed supervised bootstraps were used to instantiate the DQN, but these efforts failed because of the following reasons:

1. Sparsity of actions
2. Low signal-to-noise ratio

Through some exploration it became increasingly clear that the following fixes *cannot* solve the problem:

1. Changing the architecture of the body of DQN
2. Using duck tape solutions such as bootstrapping

### Data Discovery

Reinforcement learning agent is designed to learn a policy that maximizes the expected reward. If the problem is well defined the feasibility of learning depends on the structure of the data and the effectiveness of features / feature engineering. During data exploration it was observed that there were special points of interest during an episode and that the locus of these points across different agents formed an interesting structure. The overall idea can be summarized as:

1. These interesting structures can be used to guide the agent. A small reward can be given once the agent reaches these structures. This also helps in the explainability of the reinforcement learning model.
2. Tweaks to the reward and differential rewards can be used to switch between a guided agent and an exploratory agent.
3. Approximate Q function can be used to avoid path-following behavior. High penalty can be used to apply physical reachability constraints.

### Simpler Solution

If the transition probabilities are known, a model free approximation of the Q function can be computed based on historical data. The agent can be made to act in a greedy way (immediate reward, without exploration) to achieve its goal. However, it should be noted that a set of locally optimal paths is not guaranteed to build a globally optimal path. Therefore, this method is not guaranteed to work in environments that are drastically different from those observed in the past.

### Simpler Solution

If the transition probabilities are known, a model free approximation of the Q function can be computed based on historical data. The agent can be made to act in a greedy way (immediate reward, without exploration) to achieve its goal. However, it should be noted that a set of locally optimal paths is not guaranteed to build a globally optimal path. Therefore, this method is not guaranteed to work in environments that are drastically different from those observed in the past.

### Looking Forward

Knowing the transition matrix of historically successful episodes can simplify the state space drastically. Instead of acting greedily on immediate rewards at each state the agent can be made to act greedily on expected rewards (computed from historical data) at each state. [I have many unrefined ideas in mind, which are beyond the scope of this article]

### Closing Remarks

Transition matrix incorporate knowledge about successful cases from the data. Unfortunately, reinforcement learning is not mature enough to learn high level concepts (such as the ‘locus of points of interest’) from the data. As a result, applying reinforcement learning to real life problems is extremely difficult.

I once again stress on the fact that it is easy to ride on the ML wave; it is extremely difficult to create one. Reinforcement learning community is perfecting Atari games, but lacks test beds for real problems. Once the first real problem is solved using reinforcement learning, this field is expected to dominate the near future. I encourage everyone to be a part of the wave; be the makers; don’t just ride on the wave.

### Update: Oct 17 2024

I recently extended the analysis, but there are several more ideas for 'discretization'.
