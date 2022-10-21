import controls, { disableStartAnimation, enableStartAnimation } from './controls';
import { fullCollapse, printMap, createMap, Side } from './collapse';
import { createTilesFromTilemapData, limitMapToMaze, parseTilemapData } from './utils';
import { createMaze, processMaze, MazeEvent, setSleepMs, cancelProcessingMaze } from './maze';
import { ZodError } from 'zod';
import * as ui from './appCanvas';

let maze = createMaze(controls.width, controls.height);
ui.setMaze(maze);

const mazeProcessingCallback = (event: MazeEvent): void => {
    switch (event.type) {
        case 'event1':
            ui.highlightCell(event.x, event.y, 0.3);
            break;
        case 'event2':
            ui.highlightCell(event.x, event.y, 0.1);
            ui.setCurrentPath(event.currentPath);
            break;
        case 'event3':
            ui.setCurrentPath({ cells: [], walls: [] });
            break;
    }
};

const startAnimation = async (): Promise<void> => {
    await processMaze(maze, mazeProcessingCallback);
};

const getSleepMs = (animationSpeed: number): number => {
    const sleepMs = 691.1 - Math.log(animationSpeed + 1) * 100;
    return sleepMs;
};
setSleepMs(getSleepMs(controls.animationSpeed));

controls.on('startAnimation', async () => {
    disableStartAnimation();
    await cancelProcessingMaze();
    startAnimation();
});

controls.on('resetAnimation', async () => {
    await cancelProcessingMaze();
    enableStartAnimation();
});

controls.on('animationSpeed', (speed: number) => {
    setSleepMs(getSleepMs(speed));
});

controls.on('width', async (width: number) => {
    await cancelProcessingMaze();
    maze = createMaze(width, controls.height);
    ui.setMaze(maze);
    enableStartAnimation();
});

controls.on('height', async (height: number) => {
    await cancelProcessingMaze();
    maze = createMaze(controls.width, height);
    ui.setMaze(maze);
    enableStartAnimation();
});

controls.on('tilemapUpload', (tilemapDataString: string) => {
    let tilemapDataObject;
    try {
        tilemapDataObject = JSON.parse(tilemapDataString);
    } catch (e) {
        console.error(e);
        return;
    }
    let tilemapData;
    try {
        tilemapData = parseTilemapData(tilemapDataObject);
    } catch (err) {
        if (err instanceof ZodError) {
            console.log(err.flatten());
        }
        return;
    }
    const tiles = createTilesFromTilemapData(tilemapData);
});

/*
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

        ui.setMaze(maze);

        console.time('processMaze');
        await processMaze(maze, (event: MazeEvent) => {
            switch (event.type) {
                case 'event1':
                    ui.highlightCell(event.x, event.y, 0.3);
                    break;
                case 'event2':
                    ui.highlightCell(event.x, event.y, 0.1);
                    ui.setCurrentPath(event.currentPath);
                    break;
                case 'event3':
                    ui.setCurrentPath({ cells: [], walls: [] });
                    break;
            }
        });
        console.timeEnd('processMaze');
        printMaze(maze);

        await sleep(5000);
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
*/
