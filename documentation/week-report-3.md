## Week report 3

This week I set up codecov reports and started to work on the map generator.
I haven't yet started to write tests or jsdoc comments. I started to implement
a basic UI but decided that I should maybe start with the map generator first
and create a simple console logging based map printing for now.

In the next maybe 3 days I will implement stuff like trying to minimiaze
searching by trying to have sorted and prefiltered lists for different kinds
of lookups. The algorighm itself is a greedy backtracking algorithm where the
tile with the smallest number of possible placements/entropy is collapsed
first. I will also try to implement a way to visualize the map generation in
the graphical UI by finding all possible tiles from somewhere as a image and
then drawing them on the in the current state of the map.
