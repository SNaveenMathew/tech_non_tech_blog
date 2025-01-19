---
layout: post
date: 2019-01-11 12:00:00 -0500
image: /data/multiprocessing.jpg
---

## Speeding-up 'diff' between Consecutive Rows in Python on My Laptop

### Introduction

I'm currently pursuing independent research on large financial data. Data engineering is an integral part of the analysis as financial data is often not in the format required for analysis. Financial data may be provided in the form of transactions/updates or in the form of aggregates. While it is easy to go from transaction level to aggregate level, it is difficult to do the opposite.

My laptop configuration is decent: Ubuntu 18.04, 16 GB DDR4, Intel core i7–8750H (6 + 6 virtual core) @ 2.2 GHz and a GPU (not relevant here). But brute force is not a good idea — code run time was ~ 4 hours for processing one day's data, which is not acceptable.

### Data (samples):

*Without mentioning the type of data, here are few anonymized samples (dy's can be positive or negative):*

<figure>
  <img src="../../../data/example1.jpg">
  <figcaption>Example 1</figcaption>
</figure>

<figure>
  <img src="../../../data/example2.jpg">
  <figcaption>Example 2</figcaption>
</figure>

<figure>
  <img src="../../../data/example3.jpg">
  <figcaption>Example 3</figcaption>
</figure>

*Note: There can be several consecutive rows that look identical.*

### Desired outputs for the examples

*Question:* In example 3 how do we know whether y0 is a new value or it is y1+dy1

*Answer:* Other columns (not shown above) in the data set help in identifying the difference.

<figure>
  <img src="../../../data/desired1.jpg">
  <figcaption>Desired output: Example 1</figcaption>
</figure>

<figure>
  <img src="../../../data/desired2.jpg">
  <figcaption>Desired output: Example 2</figcaption>
</figure>

<figure>
  <img src="../../../data/desired3.jpg">
  <figcaption>Desired output:Example 3</figcaption>
</figure>

*Note: 0 does not appear in diff, but this is not a difference maker. Hence it is ignored in the solutions.*

#### Properties

1. Dataset contains around 1.3 million rows per day.
2. N is fixed for each row. More than 1 column can be 0.
3. It is known that for a data set exactly one of the following will be true:
- y0_id > y1_id > …. > yN_id > 0
- 0 < y0_id < y1_id < …. < yN_id

### Solutions (processing 1 day)

*Note: Codes are illustrative. They are incomplete!*

#### Brute force

I believe this one doesn't require explanation. Sample code:

<figure>
  <img src="../../../data/brute_force.jpg">
  <figcaption>Brute force</figcaption>
</figure>

#### Improvement using pandas

This code is similar to the brute force code.

<figure>
  <img src="../../../data/row_wise_brute_force.jpg">
  <figcaption>Row-wise: still brute force</figcaption>
</figure>

#### Improved 'search' using dictionary

Idea: look for a matching id and use it for finding difference. Lookup should be quick, so a dictionary can be used with the id value as the key.

<figure>
  <img src="../../../data/dictionary.jpg">
  <figcaption>Improved search: dictionary</figcaption>
</figure>

#### Slightly improved 'search': using only 1 loop (both id’s are sorted)

Idea: Since both id's are sorted (assumed as descending order in the code below), a single loop can be used to traverse through both id's.

<figure>
  <img src="../../../data/slightly_improved_search.jpg">
  <figcaption>Slightly improved search</figcaption>
</figure>

Let us iterate through 2 examples:

*Example 1:*

<figure>
  <img src="../../../data/example1.jpg">
  <figcaption>Example 1</figcaption>
</figure>

Iteration 1 (ignore the indexing as Python starts with 0, but column indices start with 1): i=j=0 and the while loop exits at j=0. Id's match and diff is dy1 (non-zero), so 1 row is appended.

Iteration 2: i=1 and while loop exits at j=1. Id's match, but diff=0 — therefore no updates. We're done!

*Example 2:*

<figure>
  <img src="../../../data/example2.jpg">
  <figcaption>Example 2</figcaption>
</figure>

Iteration 1: i=j=0 and the while loop exits at j=0. Id’s don’t match, therefore 1 new row is appended.

Iteration 2: i=1 and the while loop exits at j=0. Id’s match, but diff=0 — therefore no updates. We’re done (kind of, because y2 is not very important in finance \m/)!

#### Ultimatum: multi-processing

<figure>
  <img src="../../../data/multiprocessing.jpg">
  <figcaption>Multiprocessing!</figcaption>
</figure>

#### Run-time Comparison

<figure>
  <img src="../../../data/runtime_comparison.jpg">
  <figcaption>Run-time comparison</figcaption>
</figure>

### Concatenation — An Additional Problem

#### Problem

The result is a pandas series of lists. But my desired output is a structure with timestamp + edit in each row. So I used pd.concat(result), which had an additional run time of 3.5 mins (~ clock time for consecutive diff which is a relatively complicated process). This drove me nuts!

#### Solution

I found that np.concatenate is much faster (~ 40 sec) because of homogeneity. For simplicity I converted timestamp and all col_idx_values to string. The output was written to a CSV file using np.savetxt("file.csv", concat_result, fmt="%s") or using array_name.tofile("file.csv", sep=",", format="%s").

### Learnings

The final solution is a combination of several steps with incremental gains compared to predecessors. Other options such as dask (multiprocessing) were also explored. Ideas related to multi-threading and GPU (CUDA) ended unsuccessfully.

#### Summary

- Algorithm matters! Gains are in algorithm level. This applies to almost every area of programming.
- Data can be cleaner than it looks. Patterns in the data can help in faster processing. Eg: multiple delimiters, sorted rows, etc.
- Multi-threading in Python is usually not in our hands.
- Multi-processing is cool, but leave 1 core out for safety. Also ensure that there is enough memory to hold a copy of the data frame (+ factor of safety).
- Homogeneous data type can leads to faster processing. However, this is not always true.
- There may be better (faster / memory efficient) solutions.