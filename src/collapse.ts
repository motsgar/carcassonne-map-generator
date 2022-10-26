import { Direction, shuffleArray, sleep } from './utils';

export enum Side {
    Startpiece,
    Water,
    Field,
    Road,
    City,
}

export type Tile = {
    top: Side;
    right: Side;
    bottom: Side;
    left: Side;
    tilemapIndex: number;
    direction: Direction;
};

export type Dependency = {
    reverse: Dependency;
    hasChanged: boolean;
    x: number;
    y: number;
};

export type MapCell = {
    x: number;
    y: number;
    possibleTiles: Tile[];
    collapsed: boolean;
    dependencies: Dependency[];
    sides: {
        [key in Direction]: Side[];
    };
};

export type CellState = {
    collapsed: boolean;
    possibleTiles: Tile[];
};

export type OldCellStates = Map<number, Map<number, CellState>>;

export type LimitationResult = {
    success: boolean;
    oldCellStates: OldCellStates;
};

export type CarcassonneMap = {
    width: number;
    height: number;
    cells: MapCell[][];
};

export type CollapseEvent =
    | {
          type: 'checkSide';
          x: number;
          y: number;
          direction: Direction;
          success: boolean;
      }
    | {
          type: 'setCheckTile';
          x: number;
          y: number;
          tile: Tile;
          progress: number;
      }
    | {
          type: 'successCheckTile';
          x: number;
          y: number;
          tile: Tile;
      }
    | {
          type: 'initCheckTile';
          x: number;
          y: number;
          tile: Tile;
      }
    | {
          type: 'collapse';
          x: number;
          y: number;
      };

export type CollapseEventCallback = (event: CollapseEvent) => void;

const createMap = (width: number, height: number, tiles: Tile[]): CarcassonneMap => {
    // create 2d map of tiles and initialize every position with all possible tiles
    const map: CarcassonneMap = {
        cells: Array.from(Array(height), () =>
            new Array(width).fill(undefined).map(() => ({
                x: 0,
                y: 0,
                possibleTiles: tiles.slice(),
                collapsed: false,
                dependencies: [] as Dependency[],
                sides: {
                    [Direction.Up]: tiles.map((tile) => tile.top).filter((e, i, a) => a.indexOf(e) === i),
                    [Direction.Right]: tiles.map((tile) => tile.right).filter((e, i, a) => a.indexOf(e) === i),
                    [Direction.Down]: tiles.map((tile) => tile.bottom).filter((e, i, a) => a.indexOf(e) === i),
                    [Direction.Left]: tiles.map((tile) => tile.left).filter((e, i, a) => a.indexOf(e) === i),
                },
            }))
        ),
        width,
        height,
    };

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            map.cells[y][x].x = x;
            map.cells[y][x].y = y;
        }
    }

    // fill the dependencies of a tile with all tiles that depend on it (currently only the tiles next to it)
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (x > 0) {
                map.cells[y][x].dependencies.push({ x: x - 1, y, hasChanged: false } as Dependency); // breaking the type system temporarily because reverse has to be set later
            }
            if (x < width - 1) {
                map.cells[y][x].dependencies.push({ x: x + 1, y, hasChanged: false } as Dependency);
            }
            if (y > 0) {
                map.cells[y][x].dependencies.push({ x, y: y - 1, hasChanged: false } as Dependency);
            }
            if (y < height - 1) {
                map.cells[y][x].dependencies.push({ x, y: y + 1, hasChanged: false } as Dependency);
            }
        }
    }
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            for (const dependency of map.cells[y][x].dependencies) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                dependency.reverse = map.cells[dependency.y][dependency.x].dependencies.find(
                    (d) => d.x === x && d.y === y
                )!; // set the reverse dependency that was broken earlier
            }
        }
    }
    return map;
};

const printMap = (map: CarcassonneMap): void => {
    let outputString = '';
    outputString += '┏' + '━━━━━━━┳'.repeat(map.width - 1) + '━━━━━━━┓\n';
    for (let y = 0; y < map.height; y++) {
        outputString += '┃';
        for (let x = 0; x < map.width; x++) {
            const tile = map.cells[y][x];
            if (tile.collapsed) outputString += '  ' + tile.sides[Direction.Up].values().next().value + '    ';
            else outputString += '  -    ';
            outputString += '┃';
        }

        outputString += '\n┃';
        for (let x = 0; x < map.width; x++) {
            const tile = map.cells[y][x];
            if (tile.collapsed)
                outputString +=
                    tile.sides[Direction.Left].values().next().value +
                    ' ' +
                    '# ' +
                    '  ' +
                    tile.sides[Direction.Right].values().next().value;
            else outputString += '- ' + tile.possibleTiles.length.toString().padEnd(3) + ' -';
            outputString += '┃';
        }
        outputString += '\n┃';
        for (let x = 0; x < map.width; x++) {
            const tile = map.cells[y][x];
            if (tile.collapsed) outputString += '  ' + tile.sides[Direction.Down].values().next().value + '    ';
            else outputString += '  -    ';
            outputString += '┃';
        }

        if (y < map.height - 1) outputString += '\n┣' + '━━━━━━━╋'.repeat(map.width - 1) + '━━━━━━━┫\n';
    }
    outputString += '\n┗' + '━━━━━━━┻'.repeat(map.width - 1) + '━━━━━━━┛';
    console.log(outputString);
};

let processingMap = false;
let shouldProcessMap = true;
let mapProcessingStartTime = 0;
let mapProcessingSleepsHappened = 0;

let sleepMs = 0;

const setSleepMs = (ms: number): void => {
    const timeShouldTaken = sleepMs * mapProcessingSleepsHappened;
    const newTimeShouldTaken = ms * mapProcessingSleepsHappened;
    mapProcessingStartTime += timeShouldTaken - newTimeShouldTaken;
    sleepMs = ms;
};

const cancelProcessingMap = (): Promise<void> => {
    if (processingMap) {
        shouldProcessMap = false;
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                if (!processingMap) {
                    clearInterval(interval);
                    resolve();
                }
            }, 10);
        });
    }
    return Promise.resolve();
};

const advancedSleep = async (): Promise<void> => {
    if (!shouldProcessMap) {
        shouldProcessMap = true;
        processingMap = false;

        throw new Error('Map processing was canceled');
    }
    mapProcessingSleepsHappened++;
    const currentTime = Date.now();
    const timeShouldHavePassed = sleepMs * mapProcessingSleepsHappened;
    const timePassed = currentTime - mapProcessingStartTime;
    if (timePassed < timeShouldHavePassed) {
        await sleep(timeShouldHavePassed - timePassed);
    }
};

type PossibleTiles = { tiles: Tile[]; sides: MapCell['sides'] };

// checks a single coordinate for all possible tiles that fit the given sides
const getPossibleTiles = async (
    map: CarcassonneMap,
    x: number,
    y: number,
    tiles: Tile[],
    collapseEvent?: CollapseEventCallback
): Promise<PossibleTiles> => {
    const filteredTiles: Tile[] = [];
    const sides: MapCell['sides'] = {
        [Direction.Up]: [],
        [Direction.Right]: [],
        [Direction.Down]: [],
        [Direction.Left]: [],
    };
    let tile = tiles[0];

    collapseEvent?.({
        type: 'initCheckTile',
        x,
        y,
        tile: tile,
    });

    for (let i = 0; i < tiles.length; i++) {
        tile = tiles[i];

        if (sleepMs > 0.3)
            collapseEvent?.({
                type: 'setCheckTile',
                x,
                y,
                tile,
                progress: i / tiles.length,
            });

        if (y > 0) {
            await advancedSleep();
            if (!map.cells[y - 1][x].sides[Direction.Down].includes(tile.top)) {
                if (sleepMs > 0.3)
                    collapseEvent?.({
                        type: 'checkSide',
                        x,
                        y,
                        direction: Direction.Up,
                        success: false,
                    });
                await advancedSleep();
                continue;
            } else {
                if (sleepMs > 0.3)
                    collapseEvent?.({
                        type: 'checkSide',
                        x,
                        y,
                        direction: Direction.Up,
                        success: true,
                    });
            }
        }
        if (!sides[Direction.Up].includes(tile.top)) sides[Direction.Up].push(tile.top);

        if (x < map.width - 1) {
            await advancedSleep();
            if (!map.cells[y][x + 1].sides[Direction.Left].includes(tile.right)) {
                if (sleepMs > 0.3)
                    collapseEvent?.({
                        type: 'checkSide',
                        x,
                        y,
                        direction: Direction.Right,
                        success: false,
                    });
                await advancedSleep();
                continue;
            } else {
                if (sleepMs > 0.3)
                    collapseEvent?.({
                        type: 'checkSide',
                        x,
                        y,
                        direction: Direction.Right,
                        success: true,
                    });
            }
        }
        if (!sides[Direction.Right].includes(tile.right)) sides[Direction.Right].push(tile.right);

        if (y < map.height - 1) {
            await advancedSleep();
            if (!map.cells[y + 1][x].sides[Direction.Up].includes(tile.bottom)) {
                if (sleepMs > 0.3)
                    collapseEvent?.({
                        type: 'checkSide',
                        x,
                        y,
                        direction: Direction.Down,
                        success: false,
                    });
                await advancedSleep();
                continue;
            } else {
                if (sleepMs > 0.3)
                    collapseEvent?.({
                        type: 'checkSide',
                        x,
                        y,
                        direction: Direction.Down,
                        success: true,
                    });
            }
        }
        if (!sides[Direction.Down].includes(tile.bottom)) sides[Direction.Down].push(tile.bottom);

        if (x > 0) {
            await advancedSleep();
            if (!map.cells[y][x - 1].sides[Direction.Right].includes(tile.left)) {
                if (sleepMs > 0.3)
                    collapseEvent?.({
                        type: 'checkSide',
                        x,
                        y,
                        direction: Direction.Left,
                        success: false,
                    });
                await advancedSleep();
                continue;
            } else {
                if (sleepMs > 0.3)
                    collapseEvent?.({
                        type: 'checkSide',
                        x,
                        y,
                        direction: Direction.Left,
                        success: true,
                    });
            }
        }
        if (!sides[Direction.Left].includes(tile.left)) sides[Direction.Left].push(tile.left);

        await advancedSleep();

        if (sleepMs > 0.3)
            collapseEvent?.({
                type: 'successCheckTile',
                x,
                y,
                tile,
            });

        filteredTiles.push(tile);
    }

    collapseEvent?.({
        type: 'setCheckTile',
        x,
        y,
        tile,
        progress: 1,
    });

    return { tiles: filteredTiles, sides };
};

// this function doesn't check if the limitation leaves a tile without possibilities
const limitTilePossibilities = async (
    map: CarcassonneMap,
    x: number,
    y: number,
    tileList: Tile[] | undefined,
    collapseEvent?: CollapseEventCallback,
    oldCellStatesParam?: OldCellStates
): Promise<LimitationResult> => {
    if (oldCellStatesParam === undefined) {
        processingMap = true;
        mapProcessingStartTime = Date.now();
        mapProcessingSleepsHappened = 0;
    }
    const oldCellStates = oldCellStatesParam ?? new Map<number, Map<number, CellState>>();

    if (!oldCellStates.has(y)) oldCellStates.set(y, new Map<number, CellState>());
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if (!oldCellStates.get(y)!.has(x))
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        oldCellStates.get(y)!.set(x, {
            collapsed: map.cells[y][x].collapsed,
            possibleTiles: map.cells[y][x].possibleTiles.slice(),
        });

    let possibleTiles: PossibleTiles;

    if (tileList !== undefined) possibleTiles = await getPossibleTiles(map, x, y, tileList, collapseEvent);
    else possibleTiles = await getPossibleTiles(map, x, y, map.cells[y][x].possibleTiles, collapseEvent);

    if (possibleTiles.tiles.length === 0) {
        collapseEvent?.({ type: 'collapse', x, y });
        return {
            success: false,
            oldCellStates,
        };
    }

    // check if the tile can be collapsed to the given tile
    map.cells[y][x].possibleTiles = possibleTiles.tiles;

    map.cells[y][x].sides[Direction.Up] = possibleTiles.sides[Direction.Up];
    map.cells[y][x].sides[Direction.Right] = possibleTiles.sides[Direction.Right];
    map.cells[y][x].sides[Direction.Down] = possibleTiles.sides[Direction.Down];
    map.cells[y][x].sides[Direction.Left] = possibleTiles.sides[Direction.Left];

    if (map.cells[y][x].possibleTiles.length === 1) {
        map.cells[y][x].collapsed = true;
        map.cells[y][x].sides[Direction.Up] = [map.cells[y][x].possibleTiles[0].top];
        map.cells[y][x].sides[Direction.Right] = [map.cells[y][x].possibleTiles[0].right];
        map.cells[y][x].sides[Direction.Down] = [map.cells[y][x].possibleTiles[0].bottom];
        map.cells[y][x].sides[Direction.Left] = [map.cells[y][x].possibleTiles[0].left];
    }

    if (
        y > 0 &&
        map.cells[y - 1][x].sides[Direction.Down].length !== possibleTiles.sides[Direction.Up].length &&
        !map.cells[y - 1][x].collapsed
    ) {
        const noTilesLeft = await limitTilePossibilities(map, x, y - 1, undefined, collapseEvent, oldCellStates);
        if (!noTilesLeft.success) return noTilesLeft;
    }
    if (
        x < map.width - 1 &&
        map.cells[y][x + 1].sides[Direction.Left].length !== possibleTiles.sides[Direction.Right].length &&
        !map.cells[y][x + 1].collapsed
    ) {
        const noTilesLeft = await limitTilePossibilities(map, x + 1, y, undefined, collapseEvent, oldCellStates);
        if (!noTilesLeft.success) return noTilesLeft;
    }
    if (
        y < map.height - 1 &&
        map.cells[y + 1][x].sides[Direction.Up].length !== possibleTiles.sides[Direction.Down].length &&
        !map.cells[y + 1][x].collapsed
    ) {
        const noTilesLeft = await limitTilePossibilities(map, x, y + 1, undefined, collapseEvent, oldCellStates);
        if (!noTilesLeft.success) return noTilesLeft;
    }
    if (
        x > 0 &&
        map.cells[y][x - 1].sides[Direction.Right].length !== possibleTiles.sides[Direction.Left].length &&
        !map.cells[y][x - 1].collapsed
    ) {
        const noTilesLeft = await limitTilePossibilities(map, x - 1, y, undefined, collapseEvent, oldCellStates);
        if (!noTilesLeft.success) return noTilesLeft;
    }

    return {
        success: true,
        oldCellStates,
    };
};

// collapse a single coordinate to a specific tile
const collapse = async (
    map: CarcassonneMap,
    x: number,
    y: number,
    tile: Tile,
    collapseEvent?: CollapseEventCallback
): Promise<LimitationResult> => {
    return limitTilePossibilities(map, x, y, [tile], collapseEvent);
};

const resetOldCellStates = (map: CarcassonneMap, oldCellStates: OldCellStates): void => {
    for (const [y, xMap] of oldCellStates) {
        for (const [x, cellState] of xMap) {
            map.cells[y][x].possibleTiles = cellState.possibleTiles;
            map.cells[y][x].collapsed = cellState.collapsed;

            map.cells[y][x].sides[Direction.Up] = cellState.possibleTiles
                .map((tile) => tile.top)
                .filter((e, i, a) => a.indexOf(e) === i);
            map.cells[y][x].sides[Direction.Right] = cellState.possibleTiles
                .map((tile) => tile.right)
                .filter((e, i, a) => a.indexOf(e) === i);
            map.cells[y][x].sides[Direction.Down] = cellState.possibleTiles
                .map((tile) => tile.bottom)
                .filter((e, i, a) => a.indexOf(e) === i);
            map.cells[y][x].sides[Direction.Left] = cellState.possibleTiles
                .map((tile) => tile.left)
                .filter((e, i, a) => a.indexOf(e) === i);
        }
    }
};

const fullCollapse = async (map: CarcassonneMap, collapseEvent?: CollapseEventCallback): Promise<void> => {
    try {
        processingMap = true;
        mapProcessingStartTime = Date.now();
        mapProcessingSleepsHappened = 0;

        let nonCollapsedTiles = map.cells.flat();
        const oldCellStates: OldCellStates[] = [];

        let currentPriorityCell: MapCell | undefined = undefined;

        while (true) {
            nonCollapsedTiles = nonCollapsedTiles
                .filter((tile) => !tile.collapsed)
                .sort((a, b) => {
                    if (a === currentPriorityCell) return -1;
                    if (b === currentPriorityCell) return 1;
                    return a.possibleTiles.length - b.possibleTiles.length;
                });

            if (nonCollapsedTiles.length === 0) break;

            const tileToCollapse = nonCollapsedTiles[0];
            const originalPossibilitiesLength = tileToCollapse.possibleTiles.length;

            let tileIndex = 0;
            shuffleArray(tileToCollapse.possibleTiles);

            while (tileIndex < tileToCollapse.possibleTiles.length) {
                const collapseResult = await collapse(
                    map,
                    tileToCollapse.x,
                    tileToCollapse.y,
                    tileToCollapse.possibleTiles[tileIndex],
                    collapseEvent
                );

                if (collapseResult.success) {
                    oldCellStates.push(collapseResult.oldCellStates);

                    break;
                }

                resetOldCellStates(map, collapseResult.oldCellStates);
                tileIndex++;
            }
            if (tileIndex === originalPossibilitiesLength) {
                currentPriorityCell = tileToCollapse;
                const latestOldCellStates = oldCellStates.pop();
                if (latestOldCellStates === undefined)
                    throw new Error('Impossible to collapse the map, no tiles left to collapse');
                resetOldCellStates(map, latestOldCellStates);
                nonCollapsedTiles = map.cells.flat();
            }
        }
    } catch (e) {
        if (e instanceof Error) {
            if (e.message === 'Map processing was canceled') {
                return;
            }
        }
        throw e;
    }
};

export {
    collapse,
    limitTilePossibilities,
    fullCollapse,
    printMap,
    createMap,
    resetOldCellStates,
    setSleepMs,
    cancelProcessingMap,
};
