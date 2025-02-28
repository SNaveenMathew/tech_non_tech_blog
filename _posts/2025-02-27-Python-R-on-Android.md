## Running Python or R in Android OS

### Background

Working on R/Python in Android OS may sound like an artificial constraint, but I faced this scenario - I wanted to run a RShiny app, but my personal laptop stopped working and my shinyapps.io account hit the free tier limit. Experts claim Android OS is just a version of Linux, but I'm not an expert in this area. This short article covers how a layman (like me) can run R scripts in Android OS. Similar steps can be followed to install and run Python in Android OS. Clearly, this is not an everyday scenario; not even something someone would try for fun.

### Common Steps

#### Install Termux

DO NOT INSTALL FROM GOOGLE PLAY STORE - the version on Google Play Store was not updated in years, and lacks several basic Linux functionalities like `apt install`

1. Download and install F-Droid - it's free; the APK is available [here](https://f-droid.org/en/)
2. Install Termux using F-Droid

### Failed Effort - using its-pointless to install R

Note: Steps are documented in [this Reddit comment](https://www.reddit.com/r/rstats/comments/ylxv1n/comment/iv43o50/). Some people claimed to be successful. So I'll add a disclaimer - "Your results may vary", but I hit a dead-end after crossing several roadblocks. The high-level steps include

1. Add the its-pointless repo
2. Install the necessary tools/software like gcc, gfortran, etc.
3. Download the source code for R
4. Use `make install` to build and install R

### Successful - using Termux-Ubuntu

1.Follow the instructions in [this README] (https://github.com/Neo-Oli/termux-ubuntu/blob/master/README.md)
2. Run ./start-ubuntu. You're now a root user
3. Follow the normal steps used to install R on Ubuntu (similar steps for Python)

I'm not sure if F-Droid can be uninstalled after this step. I will update this article once I'm in a position to experiment.

### Final Step - running RShiny apps

It's possible to setup Ubuntu like windowing system for Ubuntu in Android OS. Once again, some people claimed to be successful using the steps in this [Reddit post](https://www.reddit.com/r/termux/comments/184kb1c/this_is_just_a_quick_rundown_of_termuxx11/). I tried this, and also tried installing x11 using `apt install`, but neither solution worked for me. So, I'll add another disclaimer - "Your results may vary", but I hit a dead-end.

Instead of setting up a windowing system like x11, I ran the RShiny app using `Rscript` command - this doesn't pop-up a new window with the app, but the app can be opened in any browser by entering "localhost:<port_number>". To avoid randomness in the port number it's  better to run `Rscript -e "shiny::runApp(host='127.0.0.1', port=<any_number_of_your_choice>)"`.

Now we have R (or Python) running in Android OS. Tablet hardware (especially CPUs) are meant to conserve energy, so they may be extremely slow with compilation and program execution (as you might've noticed if you followed along with the installation of tools/software like gcc in Termux-Ubuntu). It's time to tackle some interesting data-driven problems (I'm pursuing one - again, it's not for everyone; more on this soon).