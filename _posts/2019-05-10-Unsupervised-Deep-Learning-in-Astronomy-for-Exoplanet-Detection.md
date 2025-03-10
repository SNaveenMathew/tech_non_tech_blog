---
layout: post
date: 2019-05-10 12:00:00 -0500
image: ../data/Transit_photometry.gif
---

## Unsupervised Deep Learning in Astronomy for Exoplanet Candidate Identification

### Introduction

[Exoplanets](https://en.wikipedia.org/wiki/Exoplanet) are planets that are outside the [Solar System](https://en.wikipedia.org/wiki/Solar_System). There are several types of exoplanets — classified by size and composition as Earth-size, Earth-like, Super-Jupiters, gas giants, rocky worlds the size of Earth, rocky giants, Super-Earths, mini-Neptunes, and gas dwarfs. Also, planets may revolve around a host star (like Earth around the Sun) and may be [rogue planets](https://en.wikipedia.org/wiki/Rogue_planet) that don’t have a companion star. Machine learning can be used in conjunction with astrophysics to automate the process of identifying exoplanet *candidates*. It is extremely difficult to automate the detection of rogue planets because they are very far away from stars and their motion around a given star is not periodic. It is possible to automate the identification of exoplanets that revolve around a host star.

### Astrophysics behind Exoplanet Detection

Light curve tracks the intensity of light of a celestial object vs time. The first candidate for an exoplanet, Gamma Cephei Ab, was proposed in 1988. The first confirmed exoplanet was PSR B1257+12, a planet with approximately the same mass of Earth, orbiting a millisecond pulsar [PSR B1257+12](https://en.wikipedia.org/wiki/PSR_B1257%2B12). Several exoplanets have been detected thereafter.

<figure>
  <img src="../../../data/Transit_photometry.gif">
  <figcaption>Transit photometry</figcaption>
</figure>

[Kepler space telescope](https://science.nasa.gov/mission/kepler) (2009–18) was launched to discover planets that are orbiting other stars. [Transit photometry](https://www.planetary.org/articles/down-in-front-the-transit-photometry-method) (shown above) is used to identify exoplanet candidates. But these detection using transit photometry involves several man-hours of manual supervision by astronomers and enthusiasts.

### Why Unsupervised?

Kepler’s light curve data is [publicly available](https://archive.stsci.edu/kepler/publiclightcurves.html). Machine learning models can be built to identify exoplanet candidates. Several attempts have been made to use supervised machine learning to the problem of exoplanet detection using several thousand tagged examples. However, tagged examples are limited by the number of man-hours for supervision. It is better to use man-hours in a wise way: by filtering as much as the data as possible and providing candidates that can be investigated further. This can be accomplished by unsupervised learning, which does not introduce human biases that are involved in supervision (tagging).

### Machine Learning Problem

#### Definition

The objective is to identify patterns that correspond to drop in intensity of light for a significant amount of time. As an example, if Solar System were to be observed from a different star system, the total transit time of the Earth around the Sun is no more than 0.54 days; only the Sun’s light along with it’s trends and periodic changes (as seen from star system) will be observed during the remaining 364.7 days. Therefore, exoplanet candidate identification can be thought of as identification of periodic anomalies in the light curve.

#### Issues

The magnitude of drop in intensity may not be the same for all transits because the orbit of the planet as viewed from Earth is likely to precess. In other words, the azimuth of transit of the planet with respect to the start (as viewed from Earth) is likely to change between transits.

#### External Motivation

LSTM autoencoders have been used in time series anomaly detection IoT applications. After training, the autoencoder is able to encode-decode the regular signal almost perfectly, but fails to encode-decode the irregular (anomalous) signals with good accuracy. After removing the faults, the model can be incrementally retrained with the data from remaining components. This idea has been applied in industrial IoT with relatively good success. Since exoplanet detection also involves detection of rare, anomalous behavior in light curve, LSTM autoencoder can be used to solve the problem.

#### Initial Results

<img src="../../../data/Initial_results.jpg">

I executed this idea during Spring 2019 semester at UIUC. I could apply it to only 30 light curves because of resource constraints (CPU only training). Initial results suggest that candidate identification is possible without much scope for false negatives. However, detection without astronomy context led to several false positives. This was reduced using phase detection (folding). It was observed that the astronomy context (periodicity of planet transits) provided by phase detection was important for reducing false positives.

### Final Words

This is definitely not the end of the road for this project. I have discussed my ideas for extending the project in this [GitHub page](https://snaveenmathew.github.io/Unsupervised-Exoplanet/).

Astronomy and physics have always fascinated me because the models in these fields go beyond *machine learning* and deal with fundamental problems such as universality, causality and forecast; all within the framework of the scientific method: hypothesize, test, argue why models that fit the data actually work, discard ideas that don’t fit the data, repeat. I hope we eventually identify ways to tackle the problem of reasoning in machine learning. If this happens in the future, machine learning and natural sciences will work together (the movement has already started).
