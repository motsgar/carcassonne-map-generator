import controls, { disableStartAnimation, enableStartAnimation } from './controls';
import { fullCollapse, createMap, Side, Tile, CollapseEvent, setSleepMs as setCollapseSleepMs } from './collapse';
import { createTilesFromTilemapData, limitMapToMaze, parseTilemapData, TilemapData } from './utils';
import {
    createMaze,
    processMaze,
    MazeEvent,
    setSleepMs as setMazeSleepMs,
    cancelProcessingMaze,
    setPathPercentage,
    setRandomWallRemovePercentage,
} from './maze';
import { ZodError } from 'zod';
import * as ui from './appCanvas';

let maze = createMaze(controls.width, controls.height);
ui.setMaze(maze);

let tiles: Tile[] = [];
let map = createMap(controls.width, controls.height, tiles);
ui.setCurrentCarcassonneMap(map);

let originalTilemapData: TilemapData | undefined = undefined;
let originalTilemapImage: HTMLImageElement | undefined = undefined;
const currentTilemap: { image: HTMLImageElement | undefined; tilemapData: TilemapData | undefined } = {
    image: undefined,
    tilemapData: undefined,
};

const getSleepMs = (animationSpeed: number): number => {
    const sleepMs = 691.1 - Math.log(animationSpeed + 1) * 100;
    return sleepMs;
};

const mazeProcessingCallback = (event: MazeEvent): void => {
    switch (event.type) {
        case 'event1':
            ui.highlightMazeCell(event.x, event.y, (1010 - controls.animationSpeed) / 1000);
            break;
        case 'event2':
            ui.highlightMazeCell(event.x, event.y, (1010 - controls.animationSpeed) / 1000 / 3);
            ui.setCurrentPath(event.currentPath);
            break;
        case 'event3':
            ui.setCurrentPath({ cells: [], walls: [] });
            break;
    }
};

const collapsingCallback = (event: CollapseEvent): void => {
    switch (event.type) {
        case 'initCheckTile':
            ui.checkMapCell(event.x, event.y, event.tile);
            break;
        case 'setCheckTile':
            ui.updateCheckMapCell(event.tile);
            break;
        case 'successTile':
            ui.updateCheckMapCell(event.tile, event.progress);
            break;
        case 'checkSide':
            ui.highlightMapCellCheck(
                event.x,
                event.y,
                event.direction,
                event.success,
                (1010 - controls.animationSpeed) / 1000 / 3
            );

            break;
    }
};

const startAnimation = async (): Promise<void> => {
    await processMaze(maze, mazeProcessingCallback);
    setCollapseSleepMs(0);
    await limitMapToMaze(map, maze, {
        sideType: Side.Road,
        allowTilesOutsideWithSide: false,
        allowSideConnections: false,
    });
    setCollapseSleepMs(getSleepMs(controls.animationSpeed));
    await fullCollapse(map, collapsingCallback);
};

const updateMaze = (): void => {
    maze = createMaze(controls.width, controls.height);
    ui.setMaze(maze);
};

const updateCarassonneMap = (): void => {
    map = createMap(controls.width, controls.height, tiles);
    ui.setCurrentCarcassonneMap(map);
};

controls.on('startAnimation', async () => {
    disableStartAnimation();
    await cancelProcessingMaze();
    startAnimation();
});

controls.on('resetAnimation', async () => {
    await cancelProcessingMaze();
    updateMaze();
    updateCarassonneMap();
    enableStartAnimation();
});

controls.on('animationSpeed', (speed) => {
    const sleepMs = getSleepMs(speed);
    setMazeSleepMs(sleepMs);
    setCollapseSleepMs(sleepMs);
});

controls.on('width', async () => {
    await cancelProcessingMaze();
    updateMaze();
    updateCarassonneMap();
    enableStartAnimation();
});

controls.on('height', async () => {
    await cancelProcessingMaze();
    updateMaze();
    updateCarassonneMap();
    enableStartAnimation();
});

controls.on('mazeWallThickness', async (thickness) => {
    ui.setWallThickness(thickness);
});

controls.on('tilemapJsonUpload', (tilemapDataString) => {
    if (tilemapDataString === '') {
        currentTilemap.tilemapData = originalTilemapData;
        if (originalTilemapData !== undefined) tiles = createTilesFromTilemapData(originalTilemapData);
        if (originalTilemapData !== undefined && currentTilemap.image !== undefined)
            ui.setCurrentTilemap(currentTilemap.image, originalTilemapData);
        return;
    }

    let tilemapDataObject;
    try {
        tilemapDataObject = JSON.parse(tilemapDataString);
    } catch (e) {
        console.error(e);
        return;
    }
    let tilemapData: TilemapData;
    try {
        tilemapData = parseTilemapData(tilemapDataObject);
    } catch (err) {
        if (err instanceof ZodError) {
            console.log(err.flatten());
        }
        return;
    }
    tiles = createTilesFromTilemapData(tilemapData);
    currentTilemap.tilemapData = tilemapData;

    updateCarassonneMap();
    if (currentTilemap.image !== undefined) ui.setCurrentTilemap(currentTilemap.image, tilemapData);
});

controls.on('tilemapImageUpload', (image) => {
    if (image === undefined) {
        currentTilemap.image = originalTilemapImage;
        if (originalTilemapImage !== undefined && currentTilemap.tilemapData !== undefined)
            ui.setCurrentTilemap(originalTilemapImage, currentTilemap.tilemapData);

        return;
    }

    currentTilemap.image = image;
    updateCarassonneMap();
    if (currentTilemap.tilemapData !== undefined) ui.setCurrentTilemap(image, currentTilemap.tilemapData);
});

controls.on('mazePathPercentage', (percentage) => {
    setPathPercentage(percentage);
});

controls.on('randomWallRemovePercentage', (percentage) => {
    setRandomWallRemovePercentage(percentage);
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

    originalTilemapImage = tilemapImage;
    originalTilemapData = tilemapData;
    currentTilemap.image = tilemapImage;
    currentTilemap.tilemapData = tilemapData;

    tiles = createTilesFromTilemapData(tilemapData);

    updateCarassonneMap();
    ui.setCurrentTilemap(tilemapImage, tilemapData);
});

setMazeSleepMs(getSleepMs(controls.animationSpeed));
setPathPercentage(controls.mazePathPercentage);
setRandomWallRemovePercentage(controls.randomWallRemovePercentage);
ui.setWallThickness(controls.mazeWallThickness);
