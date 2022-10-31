# Carcassonne map generator / WFC visualizer

This is a tool to visualize the process of wave function collapse to generate maps for the board game [Carcassonne](<https://en.wikipedia.org/wiki/Carcassonne_(board_game)>).
The project is available at [https://carcassonne.motsgar.fi](https://carcassonne.motsgar.fi)

---

This project is created as a project for the course Datastructures and algorithms in the [University of Helsinki](https://www.helsinki.fi/en).

# Usage instaructions

On the website it is possible to generate a maze or a map independently. To limit a map to a maze, it is required to first generate a maze and then have a empty map to limit the maze to.

### Uploading a custom tilemap

The tilemap json defines the tiles that are used in the map generation. The tiles are defined in order from top left to bottom right one row at a time. The tilemap json is accompanied by a tilemap image that contains the images for the tiles.

```json
{
    "width": 6, // The width of the tilemap in tiles,
    "height": 5, // The height of the tilemap in tiles,
    "tileSize": 200, // The size of a single tile in pixels,
    "tiles": [ // Array of tile objects
        { // Each side is a string that tells what type of side it is. It can be either "Road", "City", "Field" or "Water"
            "top": "Road",
            "right": "Water",
            "bottom": "Road",
            "left": "Water"
        },
        ...
    ]
}
```

## Running locally

To run the project locally, clone the repository and run `npm install` and `npm start`. The project will be available at [http://localhost:8080](http://localhost:8080)

# Documentation

-   [Definition document](./documentation/definition-document.md)
-   [Testing document](./documentation/testing-document.md)
-   [Implementation document](./documentation/implementation-document.md)

### Week reports

-   [Week report 1](./documentation/week-report-1.md)
-   [Week report 2](./documentation/week-report-2.md)
-   [Week report 3](./documentation/week-report-3.md)
-   [Week report 4](./documentation/week-report-4.md)
-   [Week report 5](./documentation/week-report-5.md)
-   [Week report 6](./documentation/week-report-6.md)

# tile image credits

[https://en.wikipedia.org/wiki/Carcassonne\_(board_game)](<https://en.wikipedia.org/wiki/Carcassonne_(board_game)>)

Default tile images taken from wikipedia ([CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/))
Images made by [Mliu92](https://commons.wikimedia.org/wiki/User:Mliu92)
