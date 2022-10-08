import './appCanvas';
import { collapse, fullCollapse, printMap, tiles, createMap, Side } from './collapse';
import { limitMapToMaze } from './utils';
import { createMaze, processMaze, printMaze } from './maze';

const width = 10;
const height = 6;

const maze = createMaze(width, height);
processMaze(maze);
printMaze(maze);

const map = createMap(width, height);
console.log('empty map:');
printMap(map);

/*
// manually collapse a few tiles for testing purposes
collapse(map, 1, 1, tiles[0]);
collapse(map, 3, 1, tiles[1]);
collapse(map, 5, 1, tiles[2]);
collapse(map, 2, 2, tiles[3]);
collapse(map, 4, 0, tiles[7]);
collapse(map, 0, 1, tiles[6]);
*/
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
