import './appCanvas';
import { collapse, fullCollapse, printMap, tiles, map } from './collapse';
console.log('empty map:');
printMap(map);
// manually collapse a few tiles for testing purposes
collapse(1, 1, tiles[0]);
collapse(3, 1, tiles[1]);
collapse(5, 1, tiles[2]);
collapse(2, 2, tiles[3]);
collapse(4, 0, tiles[7]);
collapse(0, 1, tiles[6]);

console.log('map after manual collapses:');
printMap(map);

console.time('time for full collapse');
fullCollapse();

console.timeEnd('time for full collapse');
console.log('map after full collapse:');
printMap(map);
