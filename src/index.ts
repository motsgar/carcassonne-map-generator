import controls, * as controlset from './controls';
import {
    fullCollapse,
    createMap,
    Side,
    Tile,
    CollapseEvent,
    setSleepMs as setCollapseSleepMs,
    cancelProcessingMap,
} from './collapse';
import { createTilesFromTilemapData, getSleepMs, limitMapToMaze, parseTilemapData, TilemapData } from './utils';
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

// State variables
let fullAnimationRunning = false;
let mazeGenerationRunning = false;
let mazeLimitingRunning = false;
let collapsingMapRunning = false;
let mazeDone = false;
let mapDone = false;
let mapLimited = false;

let mazeGenerationStarted = false;
let mazeLimitingStarted = false;
let mapGenerationStarted = false;

// Functions

// Callback handlers
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
        case 'successCheckTile':
            ui.addCheckedSides(event.tile);
            break;
        case 'setCheckTile':
            ui.updateCheckingCellTile(event.tile);
            ui.updateCheckingCellProgress(event.progress);
            break;
        case 'checkSide':
            ui.highlightMapCellCheck(
                event.x,
                event.y,
                event.direction,
                event.success ? '#00ff00' : '#ff0000',
                (1010 - controls.animationSpeed) / 1000 / 3
            );

            break;
    }
};

// Utility functions
const initMaze = (): void => {
    mazeDone = false;
    mazeGenerationStarted = false;
    maze = createMaze(controls.width, controls.height);
    ui.setMaze(maze);
};

const initMap = (): void => {
    mapDone = false;
    mapLimited = false;
    mapGenerationStarted = false;
    map = createMap(controls.width, controls.height, tiles);
    ui.setCurrentCarcassonneMap(map);
};

const startMazeGeneration = async (): Promise<void> => {
    ui.setShouldDrawMap(false);
    ui.setShouldDrawMaze(true);
    controlset.showMaze();

    if (mazeDone) return;
    mazeGenerationStarted = true;

    mazeGenerationRunning = true;
    await processMaze(maze, mazeProcessingCallback);
    if (!mazeGenerationRunning) return;
    mazeGenerationRunning = false;
    mazeDone = true;
    mazeGenerationStarted = false;
};

const limitMap = async (): Promise<void> => {
    ui.setShouldDrawMap(true);
    ui.setShouldDrawMaze(false);
    controlset.showMap();

    if (mapLimited) return;
    mazeLimitingStarted = true;

    setCollapseSleepMs(0);

    mazeLimitingRunning = true;
    await limitMapToMaze(map, maze, {
        sideType: Side.Road,
        allowTilesOutsideWithSide: false,
        allowSideConnections: false,
    });
    if (!mazeLimitingRunning) return;
    mazeLimitingRunning = false;
    mapLimited = true;
    mazeLimitingStarted = false;

    setCollapseSleepMs(getSleepMs(controls.animationSpeed, 0.001));
};

const startWFCAnimation = async (): Promise<void> => {
    if (currentTilemap.tilemapData === undefined) return;
    ui.setShouldDrawMap(true);
    ui.setShouldDrawMaze(false);
    controlset.showMap();

    if (mapDone) return;
    mapGenerationStarted = true;

    setCollapseSleepMs(getSleepMs(controls.animationSpeed, 0.001));

    collapsingMapRunning = true;
    await fullCollapse(map, collapsingCallback);
    if (!collapsingMapRunning) return;
    collapsingMapRunning = false;
    mapDone = true;
    mapGenerationStarted = false;
};

const startFullAnimation = async (): Promise<void> => {
    fullAnimationRunning = true;
    if (!mazeDone) await startMazeGeneration();
    if (!fullAnimationRunning) return;

    if (!mapLimited) await limitMap();
    if (!fullAnimationRunning) return;

    setCollapseSleepMs(getSleepMs(controls.animationSpeed, 0.001));
    if (!mapDone) await startWFCAnimation();
};

const stopFullAnimation = async (): Promise<void> => {
    mazeLimitingRunning = false;
    fullAnimationRunning = false;

    if (mazeGenerationRunning) {
        mazeGenerationRunning = false;
        await cancelProcessingMaze();
    }
    // if (mazeLimitingRunning) await cancelLimitingMap();
    if (collapsingMapRunning) {
        collapsingMapRunning = false;
        await cancelProcessingMap();
    }
};

const resetFullAnimation = async (): Promise<void> => {
    await stopFullAnimation();
    initMaze();
    initMap();
};

const resetWFCAnimation = async (): Promise<void> => {
    await stopFullAnimation();
    initMap();
};

// Event listeners
controls.on('startFullAnimation', async () => {
    controlset.startAnimation();
    await startFullAnimation();
    controlset.stopAnimation();
    if (mazeDone) controlset.finishMazeAnimation();
    if (mapLimited || mapDone || mapGenerationStarted || !(mazeGenerationStarted || mazeDone)) controlset.limitMap();
    if (mapDone) controlset.finishWFCAnimation();
    if (mazeGenerationStarted || mapGenerationStarted || mazeDone || mapDone || mapLimited) controlset.disableResize();
});

controls.on('stopFullAnimation', async () => {
    await stopFullAnimation();
    controlset.stopAnimation();
    if (!mapGenerationStarted) controlset.disableMapReset();
    if (mazeDone) controlset.finishMazeAnimation();
    if (mapLimited || mapDone || mapGenerationStarted || !(mazeGenerationStarted || mazeDone)) controlset.limitMap();
    if (mapDone) controlset.finishWFCAnimation();
    if (mazeGenerationStarted || mapGenerationStarted || mazeDone || mapDone || mapLimited) controlset.disableResize();
    if (mapDone || (mapGenerationStarted && (mazeDone || mazeGenerationStarted)))
        controlset.disableMainStartAnimation();
});

controls.on('resetFullAnimation', async () => {
    await resetFullAnimation();
    controlset.resetFullAnimation();
});

controls.on('showMaze', () => {
    ui.setShouldDrawMap(false);
    ui.setShouldDrawMaze(true);
    controlset.showMaze();
});

controls.on('showMap', () => {
    ui.setShouldDrawMap(true);
    ui.setShouldDrawMaze(false);
    controlset.showMap();
});

controls.on('animationSpeed', (speed) => {
    setMazeSleepMs(getSleepMs(speed));
    setCollapseSleepMs(getSleepMs(speed, 0.001));
});

controls.on('width', async () => {
    initMaze();
    initMap();
});

controls.on('height', async () => {
    initMaze();
    initMap();
});

controls.on('wallThickness', async (thickness) => {
    ui.setWallThickness(thickness);
});

controls.on('startMazeAnimation', async () => {
    controlset.startAnimation();
    await startMazeGeneration();
    controlset.stopAnimation();
    if (!mapGenerationStarted && !mapDone) controlset.resetWFCAnimation();
    if (mazeDone) controlset.finishMazeAnimation();
    if (mapLimited || mapDone || mapGenerationStarted || !(mazeGenerationStarted || mazeDone)) controlset.limitMap();
    if (mapDone) controlset.finishWFCAnimation();
    if (mazeGenerationStarted || mapGenerationStarted || mazeDone || mapDone || mapLimited) controlset.disableResize();
    if (mapDone || (mapGenerationStarted && (mazeDone || mazeGenerationStarted)))
        controlset.disableMainStartAnimation();
});

controls.on('resetMazeAnimation', async () => {
    initMaze();
    controlset.stopAnimation();
    if (mapLimited || mapDone || mapGenerationStarted || !(mazeGenerationStarted || mazeDone)) controlset.limitMap();
    if (mapDone) controlset.finishWFCAnimation();
    controlset.resetMazeAnimation();
    if (!mapGenerationStarted && !mapDone) controlset.disableMapReset();
    if (mazeGenerationStarted || mapGenerationStarted || mazeDone || mapDone || mapLimited) controlset.disableResize();
    else controlset.resetFullAnimation();
    if (mapDone || (mapGenerationStarted && (mazeDone || mazeGenerationStarted)))
        controlset.disableMainStartAnimation();
});

controls.on('mazePathPercentage', (percentage) => {
    setPathPercentage(percentage);
});

controls.on('randomWallRemovePercentage', (percentage) => {
    setRandomWallRemovePercentage(percentage);
});

controls.on('startWFCAnimation', async () => {
    controlset.startAnimation();
    await startWFCAnimation();
    controlset.stopAnimation();
    if (mazeDone) controlset.finishMazeAnimation();
    if (mapDone) controlset.finishWFCAnimation();
    if (mapLimited || mapDone || mapGenerationStarted || !(mazeGenerationStarted || mazeDone)) controlset.limitMap();
    if (mazeGenerationStarted || mapGenerationStarted || mazeDone || mapDone || mapLimited) controlset.disableResize();
    if (mapDone || (mapGenerationStarted && (mazeDone || mazeGenerationStarted)))
        controlset.disableMainStartAnimation();
    if (!mazeDone && !mazeGenerationStarted) controlset.resetMazeAnimation();
});

controls.on('resetWFCAnimation', async () => {
    await resetWFCAnimation();
    controlset.resetWFCAnimation();
    if (mapLimited || mapDone || mapGenerationStarted || !(mazeGenerationStarted || mazeDone)) controlset.limitMap();
    if (mazeGenerationStarted || mapGenerationStarted || mazeDone || mapDone || mapLimited) controlset.disableResize();
    else controlset.resetFullAnimation();
    if (mapDone || (mapGenerationStarted && (mazeDone || mazeGenerationStarted)))
        controlset.disableMainStartAnimation();
});

controls.on('limitCurrentMap', async () => {
    controlset.startAnimation();
    await limitMap();
    controlset.stopAnimation();
    if (mapLimited || mapDone || mapGenerationStarted || !(mazeGenerationStarted || mazeDone)) controlset.limitMap();
    if (mazeDone) controlset.finishMazeAnimation();
    if (mazeGenerationStarted || mapGenerationStarted || mazeDone || mapDone || mapLimited) controlset.disableResize();
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

    initMap();
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
    initMap();
    if (currentTilemap.tilemapData !== undefined) ui.setCurrentTilemap(image, currentTilemap.tilemapData);
});

// Init
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

    initMap();
    ui.setCurrentTilemap(tilemapImage, tilemapData);
});

setMazeSleepMs(getSleepMs(controls.animationSpeed));
setCollapseSleepMs(getSleepMs(controls.animationSpeed, 0.001));
setPathPercentage(controls.mazePathPercentage);
setRandomWallRemovePercentage(controls.randomWallRemovePercentage);
ui.setWallThickness(controls.wallThickness);
