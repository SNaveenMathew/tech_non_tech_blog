---
layout: post
date: 2025-03-20 12:00:00 -0500
---

## Buying a Laptop with a Dedicated GPU

### Background

Based on my previous article on [running Python/R on Android](https://snaveenmathew.github.io/tech_non_tech_blog/2025/02/27/Python-R-on-Android.html), it must be obvious that I started using my Android based tablet for development. Things were going well till I decided to start training/evaluating LLMs locally. The last laptop I purchased in late 2018 was a Lenovo Legion Y530 (or maybe Y730). It a dedicated NVIDIA GeForce GTX 1050-Ti GPU (I used it primarily for training deep learning models; I'm past my gaming days) and cost around USD 1,000 - it was the best price-to-performance laptop for my planned budget. This time my budget was flexible, but the constraint depended on the VRAM needs of LLMs. Unfortunately, the more budget friendly (compared to NVIDIA GPUs) AMD Radeon GPUs aren't the target of most ML/DL frameworks.

After doing some research I narrowed my choices to laptops that have a dedicated RTX 4080 or RTX 4090 GPU. I thought I nailed my laptop needs and decided to be price conscious - to minimize price-to-performance if possible. So I shortlisted a few models, studied their reviews in detail and started looking . But I never expected the wild goose chase that followed (this is coming from someone who followed people who provided stock updates and got on Target/Walmart/Amazon/GameStop/BestBuy websites at 7AM to buy Xbox Series X / Playstation 5).

Note: Unless specified, all prices include Massachusetts sales tax. Price may vary in your state depending on taxes.

### Priorities

I narrowed down to the following configuration:

- NVIDIA RTX 4090 GPU with 16 GB VRAM (>130W) or NVIDIA RTX 4080 GPU with 16 GB VRAM (>115W)
- 32+ GB DDR5 memory
- Intel Core i9-13900HX+ for a 'regular' laptop or Intel Core Ultra 7-155H+ for lightweight, power conserving laptop
- Display size: 16" or lesser (only to minimize weight)
- Should support Linux (apparently some laptops don't, I don't know how they do it) + Windows dual boot
- Decent heat management
- Ideally light weight (preferably less than 5 lbs without the charger)

Clearly, it's impossible to find a laptop that satisfies all the criteria. My priorities in the order of importance: #5, #1, #2, #7, #6, #3, #4

### Entering the Market

I initially planned to buy a laptop with RTX 4070 (8 GB VRAM in laptops), but quickly dropped the idea because:

- Many LLMs won't work locally
- There was a significant jump in performance from RTX 4070 to RTX 4080

After applying some these filters on Best Buy it was clear that the prices were typically USD 2,000+ for RTX 4080 (finding something below USD 1,700 is very rare) and USD 2,500+ for RTX 4090 laptops (finding something below USD 1,900 is very rare). With the entry to RTX 50xx in late February these prices were expected to fall, but they did not (they still haven't dropped). Going from USD 1,000 to USD 2,500 in a span of 7 years was shocking to me. So, I decided to look for alternatives on Google Shopping. After spending a few days on filtering (it's challenging because Google Shopping feels almost exclusively LLM driven), I narrowed down to a few laptop models.

### Problems

Buying a laptops with a dedicated GPU at a fair price isn't easy:

- They typically don't have a standard price - price changes from website to website despite a 'price match guarantee'
- Even if a batch of laptops get released, they usually sell out very quickly (not as quickly as Xbox Series X / Playstation 5, but one should keep the prices in mind for this comparison - USD 2,000+ vs. USD 500)
- Some legal retailers allow ordering even if the laptop is on backorder (Eg: Adorama, CDW, Direct Dial, etc.). They're usually priced lower than Amazon or Best Buy (where you can order instantly), but the price may change before the order ships (they mention how long the price is valid, but usually the laptops won't ship by that date because of supply constraints)

Personally, I've been an 'early visitor' when a new batch was release - not by chance, but because I visit those pages frequently. But I failed to pull the trigger because of the price (Eg: USD 1,750+ for RTX 4080 laptops). Simultaneously, I placed an order on a backordered RTX 4080 laptop for ~USD 1,500 - this order never materialized. Finally, I decided to opt for used laptops as well. Enter Facebook Marketplace and eBay. Maintaining all the informatoin in one place was becoming difficult with increase in number of laptop models, configurations, prices in websites and conditions.

### Solution

I decided to build a structured database to store all the information described above. In addition I decided to the structured database I decided to build an app to enter data manually and a dashboard with plots and filters to meaningfully visualize the data. This gave me an idea about the lowest price I can pay to get a laptop with RTX 4080 or RTX 4090 GPU.

<figure>
  <img src="../../../data/db_design.png">
  <figcaption>Simple structured database design to track laptop prices</figcaption>
</figure>

Link to dashboard repo: https://github.com/SNaveenMathew/laptop_price_tracker

There isn't much to say about the design of the app itself - the whole data entry process was manual, but I only had to add the 'changes'. So, once all the models and sources were listed, I only had to enter data if the price changed. Even with this basic database design (including the uncertainty of transient eBay auction prices) I was able to obtain better price insights than Google Shopping (of course, I was using all the relevant sources from Google Shopping and beyond)!

### Learnings

One will inevitably arrive at a few of the following conclusions:

- Budget laptops don't exist at the higher end of performance
- Laptops at the higher end of performance don't sell at a fair price
- It's possible to buy a high performance laptop at a price that's not abnormally high compared to its fair price
- Performance and weight are opposing forces - heating is the fundamental cause of this issue
- A laptop on backorder that can be purchased (first-come-first-serve) should only be a backup; it should not be a primary choice
- Price war on eBay auctions starts on the last day

<figure>
  <img src="../../../data/laptop_price_tracker.png">
  <figcaption>Simple app to track laptop prices</figcaption>
</figure>

I was alternating between #2, #3 and #5 for a long time. I kept the orders on backordered laptops open as long as the price was fixed even though the orders never shipped - this was just a backup. Since I had the sources, I found a 'Used - Like New' RTX 4090 laptop that was cross listed on Facebook Marketplace (USD 2,025) and eBay auctions (priced USD 1,650 with 2 days left). The seller accepted an offer of ~USD 1,800.

There were some laptops that I missed at the cost of collecting data. For example, one 'Used - Like New' RTX 4080 laptop sold for ~USD 1,400. I don't regret missing those; it is the opportunity cost of obtaining accurate price insights in a corrupt market full of scalpers.

The laptop was in very good shape, and I received some goodies such as a cooling pad a liquid coolant. As of 3/20/2025 I did not find a better price for a laptop with RTX 4090 GPU.

PS: I'm not an expert, but I'm happy to name a few laptop models that amazed me.

Closing notes:

1. I've always been in favor of desktops over laptops; the only 2 reasons for choosing a laptop over a desktop are: 1. laptops can be used anywhere; desktops should remain on the desk, 2. laptops can be light enough to carry (most aren't; I'm not including Macs in the discussion here as price-to-performance isn't good)
2. If performance is the only factor, and if one doesn't mind paying extra for electricity, one should consider desktops over laptops
