---
layout: post
date: 2019-09-21 12:00:00 -0500
image: ../data/Transit_photometry.gif
---

## Search for Exoplanets - Humans vs. Stars

### Kepler

Kepler telescope was launched in the year 2009 into an Earth-trailing heliocentric orbit. The planned lifetime of the mission was 3.5 years, but the mission continued for almost 10 years. The objective was to scan a portion of the sky to identify Earth-like habitable exoplanets in a region of the sky within the Milky Way galaxy. During its lifetime Kepler scanned the light curves of over 530,000 stars and detected 2,360 exoplanets (updated on 06/16/2020). Finally, Kepler mission was retired in 2018.

### TESS and beyond

Transiting Exoplanet Survey Satellite (TESS) was launched in 2018. It was designed to search for exoplanets using the transit method in an area 400 times larger than that covered by the Kepler mission. TESS will provide candidates for further characterization by the James Webb Space Telescope and other telescopes. Unlike previous surveys which detected giant exoplanets, TESS is expected to find a large number of small planets around the nearest stars in the sky.

The following missions have been proposed to detect exoplanets (not all of these will use the transit method):

- CHEOPS
- JWST (known to many by its abbreviation — James Webb Space Telescope)
- PLATO
- ARIEL
- WFIRST

### Heterogeneity in data sources

Sampling rates of different telescopes may be different. Kepler light curve data set has a sampling time period of ~ 20.4 ms. TESS telescope has a sampling time period of 2 seconds. This difference in sampling time periods leads to difference in amount of data history required for inspecting the transit light curve. Therefore, a *supervised machine learning model trained on Kepler data cannot be applied to TESS light curve*.

### Transit method and 'automation' using splines (statistics)

Transit method is commonly used in astronomy for exoplanet candidate identification. The following image shows the essence of transit method:

<figure>
  <img src="../../../data/Transit_method.gif">
  <figcaption>Transit method for exoplanet candidate identification</figcaption>
</figure>

A cup-like dip in the light curve shows the presence of an exoplanet around a star. This is the theoretical version; an 'ideal' practical version after data augmentation can be found below:

<figure>
  <img src="../../../data/Ideal_transit.jpg">
  <figcaption>Image source: https://www.youtube.com/watch?v=gmVg7MIehd4</figcaption>
</figure>

The data is very noisy even after data augmentation. For people who are familiar with statistical modeling — fitting a histogram regression or any other type of spline on this data requires careful choice of knots, which requires manual supervision — it is not fully automatic. Using automatic knot selection methods such as smoothing spline (+ hyperparameter tuning, cross-validation) may lead to a flattened out estimate even on the augmented light curve. This creates a problem — many candidates will be ignored.

### Other end of the spectrum — manual tagging

<figure>
  <img src="../../../data/Zooniverse.gif">
  <figcaption>Manual tagging on Zooniverse</figcaption>
</figure>

The above animation shows a relatively easy example. There are 2 operations:

1. Multiple brushes on the original image to designate a region
2. Zooming in and refining each region

The manual complexity of this task is O(c * n), where n is the number of transits observed and c is the average number of manual operations (such as brushes, clicks, etc.) per transit. Usually c > n for most light curves. Even for a simple task with n = 3 (as shown above), this takes several minutes per light curve.

### Full scale of the problem

There are billions of stars in the Milky Way galaxy. There are billions of galaxies like the Milky Way, each having billions of stars on an average. However, there are only a few thousand people who support tasks on Zooniverse. Therefore, the project is run in phases; few candidates from each phase are given to other projects for confirmation. NASA states that until now TESS has identified 1913 candidates out of which 51 have been confirmed (updated on 06/16/2020). This is a remarkable achievement in itself.

### Can this task be simplified?

1. Brushing, zooming and refining are time consuming tasks. They are needed because the current set of methods are not robust to 'noisy tagging' — for example: terminating the task after brushing (without zooming and refining) leads to light curve of candidate + default light curve of the host star.
2. Can this be simplified further? Sections of the image can be automatically brushing (using unsupervised learning) and labeled as candidates. This process can be repeated for all light curves. It is alright to have few false positives, but the algorithm should produce much fewer false negatives. Manual taggers only have to click on the 'x' button on each brush or leave the light curve unaltered (approval that the automatic candidate identification is accurate). Brushing, zooming and refining will still be available to taggers, but the hope here is to reduce their usage.

- If a light curve has 'large' number of taggers, their approval and disapproval (+ optional refining) can be used to denoise the zone in which the candidate is present
- If the light curve has 'small' number of taggers, the default set of candidates tagged by the algorithm may be considered

Therefore, unsupervised learning can expedite the process of candidate identification. Eventually each 'zone' of the light curve and each user who tags will be given a credibility score. This score varies with each newly available example of 'modified' manual tagging. Eventually, the most credible candidates can be examined further or can be used to build a supervised learning model.

### Conclusion

I strongly recommend people to support [Planet Hunter TESS](https://www.zooniverse.org/projects/nora-dot-eisner/planet-hunters-tess) and other [Zooniverse](https://www.zooniverse.org/projects) projects. Many projects require support from a large pool of enthusiastic individuals (like the readers who have reached this section). Crowdsourcing in scientific research will grow exponentially and I recommend the readers to be one of the early members of this growing community.

The previous section of article presented the vision for my independent research — unsupervised learning and crowdsourcing for exoplanet candidate identification. I'm currently developing the idea on my own, so progress has been slow. I welcome people to join me.

**Note:** This project will always remain open source.
