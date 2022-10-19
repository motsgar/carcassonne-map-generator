import './appCanvas';
import { fullCollapse, printMap, createMap, Side } from './collapse';
import { createTilesFromTilemapData, limitMapToMaze, parseTilemapData } from './utils';
import { createMaze, processMaze, printMaze, MazeEvent, setSleepMs } from './maze';
import { ZodError } from 'zod';
import * as ui from './appCanvas';

const width = 15;
const height = 12;

setSleepMs(30);

fetch('/defaultTilemap.json')
    .then((res) => res.json())
    .then(async (rawTilemapData) => {
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
        ui.setMaze(maze);

        console.time('processMaze');
        await processMaze(maze, (event: MazeEvent) => {
            switch (event.type) {
                case 'event1':
                    ui.highlightCell(event.x, event.y, 0.5);
                    break;
                case 'event2':
                    ui.highlightCell(event.x, event.y, 0.3);
                    ui.setCurrentPath(event.currentPath);
                    break;
                case 'event3':
                    ui.setCurrentPath({ cells: [], walls: [] });
                    break;
            }
        });
        console.timeEnd('processMaze');
        printMaze(maze);

        const map = createMap(width, height, tiles);

        console.log('empty map:');
        printMap(map);

        console.time('time for maze limiting');
        limitMapToMaze(map, maze, {
            sideType: Side.Road,
            allowSideConnections: false,
            allowTilesOutsideWithSide: false,
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
