import './appCanvas';
import { fullCollapse, printMap, createMap, Side } from './collapse';
import { createTilesFromTilemapData, limitMapToMaze, parseTilemapData } from './utils';
import { createMaze, processMaze, printMaze } from './maze';
import { ZodError } from 'zod';

const width = 12;
const height = 7;

fetch('/defaultTilemap.json')
    .then((res) => res.json())
    .then((rawTilemapData) => {
        let tilemapData;
        try {
            tilemapData = parseTilemapData(rawTilemapData);
        } catch (err) {
            if (err instanceof ZodError) {
                console.log(err.flatten());
            }
            return;
        }
        const tiles = createTilesFromTilemapData(tilemapData);

        const maze = createMaze(width, height);
        processMaze(maze);
        printMaze(maze);

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
    });
