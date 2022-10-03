import './appCanvas';
import { collapse, fullCollapse, printMap, tiles, createMap } from './collapse';
// import './maze';

const map = createMap(10, 6);
console.log('empty map:');
printMap(map);
// manually collapse a few tiles for testing purposes
collapse(map, 1, 1, tiles[0]);
collapse(map, 3, 1, tiles[1]);
collapse(map, 5, 1, tiles[2]);
collapse(map, 2, 2, tiles[3]);
collapse(map, 4, 0, tiles[7]);
collapse(map, 0, 1, tiles[6]);

console.log('map after manual collapses:');
printMap(map);

console.time('time for full collapse');
fullCollapse(map);

console.timeEnd('time for full collapse');
console.log('map after full collapse:');
printMap(map);
