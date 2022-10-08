## Week report 5

I managed to get the maze generation working and also implemented a limiting
function that filters out tiles that don't fit the maze. I also restructured a
bit both the maze generation and map generation files to allow them to be more
easily testable. I didn't manage to yet write the tests but that is something I
will probably start with next week.

I spent maybe 8 hours total this week. Part of it was spent on implementing the
maze generation algorithm (wilsons algorithm) and part to modifying it to add
sparse and imperfect maze generation abilities. It was surprisingly hard to find
a good algorithm for this use case as usually the focus is to generate so called
"perfect mazes" that don't have any loops but fill the whole space.

Next week I will start by figuring out a better way of handling all possible
tiles and next writing tests for the current code. I will also finally create
a non final visual UI for the map generation. I haven't yet started working on
backtracking, but after the UI is somewhat better I will start working on that
and hope to have it done by the end of the week. If not I will continue working
on it next week when I will also finalize the UI.

I'll try to spend more time on the project as until this week the middle of the week
is completely spent on other things.
