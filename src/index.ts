import './appCanvas';
import { fullCollapse, printMap, createMap, Side } from './collapse';
import { createAllPossibleTiles, limitMapToMaze, parseTilemapData } from './utils';
import { createMaze, processMaze, printMaze } from './maze';
import { ZodError } from 'zod';

try {
    console.log(
        parseTilemapData(
            JSON.parse(
                '{"width":100,"height":100,"tileSize":10,"tiles":[{"x": 10, "y": 10, "top": "Startpeice", "right": "City", "bottom": "Road", "left": "Csity"}]}'
            )
        )
    );
} catch (err) {
    if (err instanceof ZodError) {
        console.log(err.flatten());
    }
}

const width = 10;
const height = 6;

const maze = createMaze(width, height);
processMaze(maze);
printMaze(maze);

const tiles = createAllPossibleTiles();

const map = createMap(width, height, tiles);

console.log('empty map:');
printMap(map);

console.time('time for maze limiting');
limitMapToMaze(map, maze, {
    sideType: Side.Road,
    allowSideConnections: false,
    allowTilesOutsideWithSide: true,
});
console.timeEnd('time for maze limiting');

console.log('map after maze limit:');
printMap(map);

console.time('time for full collapse');
fullCollapse(map);

console.timeEnd('time for full collapse');
console.log('map after full collapse:');
printMap(map);
