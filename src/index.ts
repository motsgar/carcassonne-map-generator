import controls, { disableStartAnimation, enableStartAnimation } from './controls';
import { fullCollapse, printMap, createMap, Side, Tile } from './collapse';
import { createTilesFromTilemapData, limitMapToMaze, parseTilemapData } from './utils';
import { createMaze, processMaze, MazeEvent, setSleepMs, cancelProcessingMaze } from './maze';
import { ZodError } from 'zod';
import * as ui from './appCanvas';

let maze = createMaze(controls.width, controls.height);
ui.setMaze(maze);
let tiles: Tile[] = [];

const mazeProcessingCallback = (event: MazeEvent): void => {
    switch (event.type) {
        case 'event1':
            ui.highlightCell(event.x, event.y, (1010 - controls.animationSpeed) / 1000);
            break;
        case 'event2':
            ui.highlightCell(event.x, event.y, (1010 - controls.animationSpeed) / 1000 / 3);
            ui.setCurrentPath(event.currentPath);
            break;
        case 'event3':
            ui.setCurrentPath({ cells: [], walls: [] });
            break;
    }
};

const startAnimation = async (): Promise<void> => {
    await processMaze(maze, mazeProcessingCallback);
    const map = createMap(controls.width, controls.height, tiles);
    ui.setCurrentCarcassonneMap(map);
    limitMapToMaze(map, maze, {
        sideType: Side.Road,
        allowTilesOutsideWithSide: false,
        allowSideConnections: false,
    });
    fullCollapse(map);
    printMap(map);
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
    maze = createMaze(controls.width, controls.height);
    ui.setMaze(maze);
    enableStartAnimation();
});

controls.on('animationSpeed', (speed) => {
    setSleepMs(getSleepMs(speed));
});

controls.on('width', async (width) => {
    await cancelProcessingMaze();
    maze = createMaze(width, controls.height);
    ui.setMaze(maze);
    enableStartAnimation();
});

controls.on('height', async (height) => {
    await cancelProcessingMaze();
    maze = createMaze(controls.width, height);
    ui.setMaze(maze);
    enableStartAnimation();
});

controls.on('tilemapJsonUpload', (tilemapDataString) => {
    if (tilemapDataString === '') {
        // TODO: load default tilemap
        console.log('tilemap is reset');
        return;
    }
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
    tiles = createTilesFromTilemapData(tilemapData);
    console.log(tiles);
});

controls.on('tilemapImageUpload', (image) => {
    if (image === undefined) {
        // TODO: load default image
        console.log('image is reset');
        return;
    }
    console.log(image);
});

const fetchPromises: [Promise<unknown>, Promise<HTMLImageElement>] = [
    fetch('/defaultTilemap.json').then((res) => res.json()),
    new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = '/defaultTiles.png';
    }),
];

Promise.all(fetchPromises).then(([tilemapDataObject, tilemapImage]) => {
    let tilemapData;
    try {
        tilemapData = parseTilemapData(tilemapDataObject);
    } catch (err) {
        if (err instanceof ZodError) {
            console.log(err.flatten());
        }
        return;
    }
    tiles = createTilesFromTilemapData(tilemapData);

    ui.setCurrentTilemap(tilemapImage, tilemapData);
});
