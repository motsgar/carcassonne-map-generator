import { Direction, shuffleArray, sleep } from './utils';

// ----- //
// Types //
// ----- //

export enum Side {
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

export type MapCell = {
    x: number;
    y: number;
    possibleTiles: Tile[];
    collapsed: boolean;
    sides: {
        [key in Direction]: Side[];
    };
};

export type CarcassonneMap = {
    width: number;
    height: number;
    cells: MapCell[][];
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

export type PossibleTiles = { tiles: Tile[]; sides: MapCell['sides'] };

export type CollapseEvent =
    | {
          type: 'initCheckTile';
          x: number;
          y: number;
          tile: Tile;
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
          type: 'checkSide';
          x: number;
          y: number;
          direction: Direction;
          success: boolean;
      };

export type CollapseEventCallback = (event: CollapseEvent) => void;

// ------------------------- //
// Animation State Variables //
// ------------------------- //

let processingMap = false;
let shouldStopProcessingMap = false;
let mapProcessingStartTime = 0;
let mapProcessingSleepsHappened = 0;
let sleepMs = 0;

// ------------------- //
// Animation Functions //
// ------------------- //

/**
 * Initializes global collapsing variables to allow slowing down the collapsing animation and canceling it
 */
const startProcessingMap = (): void => {
    processingMap = true;
    mapProcessingStartTime = Date.now();
    mapProcessingSleepsHappened = 0;
};

/**
 * Updates global map processing variables to indicate map processing is done
 */
const stopProcessingMap = (): void => {
    processingMap = false;
};

/**
 * Function to cancel the collapsing animation
 * @return {Promise<void>} A promise that resolves when the map has stopped processing
 */
const cancelProcessingMap = (): Promise<void> => {
    // If the map is being processed, set the shouldStopProcessingMap variable to true. Then wait for the map to stop
    // processing and check if the map is being processed by polling the processingMap variable
    if (processingMap) {
        shouldStopProcessingMap = true;
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

/**
 * Updates the time that should be waited between collapsing steps
 * @param {number} ms - The time in milliseconds that should be waited between each step of the collapsing animation
 */
const setSleepMs = (ms: number): void => {
    // Calculate the time that should have passed since the start of the collapsing animation with the new sleep time
    // and shift the start time of the collapsing animation to the time that should have passed
    const timeShouldTaken = sleepMs * mapProcessingSleepsHappened;
    const newTimeShouldTaken = ms * mapProcessingSleepsHappened;
    mapProcessingStartTime += timeShouldTaken - newTimeShouldTaken;
    sleepMs = ms;
};

/**
 * A more advanced sleep function to automatically adjust the time that should be waited between collapsing steps
 * based on the time that has already passed. Also handles the canceling of the collapsing animation
 * @return {Promise<void>} A promise that resolves when the time has passed or the collapsing animation has been canceled
 */
const advancedSleep = async (): Promise<void> => {
    // If the collapsing animation has been canceled, stop the collapsing animation by throwing an error
    if (shouldStopProcessingMap) {
        shouldStopProcessingMap = false;
        processingMap = false;

        throw new Error('Map processing was canceled');
    }

    // If the collapsing animation is not canceled, calculate the time that should have passed since the start of the
    // collapsing animation and wait for the remaining time
    mapProcessingSleepsHappened++;
    const currentTime = Date.now();
    const timeShouldHavePassed = sleepMs * mapProcessingSleepsHappened;
    const timePassed = currentTime - mapProcessingStartTime;
    if (timePassed < timeShouldHavePassed) {
        await sleep(timeShouldHavePassed - timePassed);
    }
};

// ------------------- //
// Algorighm Functions //
// ------------------- //

/**
 * Generates a map with the given width and height and the given tilemap
 * @param {number} width - Width of the map that should be generated
 * @param {number} height - Height of the map that should be generated
 * @param {Tile[]} tiles - Tiles that are used to generate the map
 * @return {CarcassonneMap} A map with the given width and height
 */
const createMap = (width: number, height: number, tiles: Tile[]): CarcassonneMap => {
    const map: CarcassonneMap = {
        width,
        height,
        cells: [],
    };

    // For every cell in the map initialize the cell with initial values and possible tiles
    for (let y = 0; y < height; y++) {
        map.cells[y] = [];
        for (let x = 0; x < width; x++) {
            const cell: MapCell = {
                x,
                y,
                possibleTiles: tiles.slice(),
                collapsed: false,
                sides: {
                    [Direction.Up]: tiles.map((tile) => tile.top).filter((e, i, a) => a.indexOf(e) === i),
                    [Direction.Right]: tiles.map((tile) => tile.right).filter((e, i, a) => a.indexOf(e) === i),
                    [Direction.Down]: tiles.map((tile) => tile.bottom).filter((e, i, a) => a.indexOf(e) === i),
                    [Direction.Left]: tiles.map((tile) => tile.left).filter((e, i, a) => a.indexOf(e) === i),
                },
            };
            map.cells[y][x] = cell;
        }
    }

    return map;
};

/**
 * checks a single coordinate for all possible tiles that fit the given position in the map
 * according to the sides of the tiles next to it
 * @param {CarcassonneMap} map - Map that will be modified
 * @param {number} x - X position in map
 * @param {number} y - Y position in map
 * @param {Tile[]} tiles - Tiles that will be checked
 * @param {CollapseEventCallback | undefined} collapseEvent - Callback for events on checking a tile
 * @return {Promise<PossibleTiles>} Promise that resolves when geting possible tiles is done that contains all possible tiles and sides that fit in the given position
 */
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

    // Go through all tiles and check if they fit in the given position
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
            // check if the bottom side of the cell above includes the top side of the current tile. If not continue with the next tile
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

        if (x < map.width - 1) {
            // check if the left side of the cell to the right includes the right side of the current tile. If not continue with the next tile
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

        if (y < map.height - 1) {
            // check if the top side of the cell below includes the bottom side of the current tile. If not continue with the next tile
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

        if (x > 0) {
            // check if the right side of the cell to the left includes the left side of the current tile. If not continue with the next tile
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

        await advancedSleep();

        if (sleepMs > 0.3)
            collapseEvent?.({
                type: 'successCheckTile',
                x,
                y,
                tile,
            });

        // If the possible side is not already in the list, add it
        if (!sides[Direction.Up].includes(tile.top)) sides[Direction.Up].push(tile.top);
        if (!sides[Direction.Right].includes(tile.right)) sides[Direction.Right].push(tile.right);
        if (!sides[Direction.Down].includes(tile.bottom)) sides[Direction.Down].push(tile.bottom);
        if (!sides[Direction.Left].includes(tile.left)) sides[Direction.Left].push(tile.left);

        // Add the tile to the list of possible tiles
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

/**
 * Checks a single coordinate for all possible tiles that fit the given position in the map according to the sides of the tiles next to it
 * and recursively checks tiles next to it if the sides change
 * @param {CarcassonneMap} map - Map that will be modified
 * @param {number} x - X position to check
 * @param {number} y - Y position to check
 * @param {Tile[]} tileList - List of tiles that the position will be checked and limited against
 * @param {CollapseEventCallback | undefined} collapseEvent - Callback for events on checking a tile
 * @param {OldCellStates | undefined} oldCellStatesParam - Old states of cells that will be used to revert the map if the position can't be filled
 * @return {Promise<LimitationResult>} Promise that resolves when limitation is done that contains the result of the limitation
 */
const limitTilePossibilities = async (
    map: CarcassonneMap,
    x: number,
    y: number,
    tileList: Tile[],
    collapseEvent?: CollapseEventCallback,
    oldCellStatesParam?: OldCellStates
): Promise<LimitationResult> => {
    // If no old cell states are given, create a new one. Otherwise use the given one
    const oldCellStates = oldCellStatesParam ?? new Map<number, Map<number, CellState>>();

    // Get all possible tiles and sides for the given position and if there are no possible tiles, return failed state
    const possibleTiles = await getPossibleTiles(map, x, y, tileList, collapseEvent);
    if (possibleTiles.tiles.length === 0) {
        return {
            success: false,
            oldCellStates,
        };
    }

    // If current coordinate is not in the old cell states, add it. Afterwards, save the current state of the cell
    if (!oldCellStates.has(y)) oldCellStates.set(y, new Map<number, CellState>());
    if (!oldCellStates.get(y)?.has(x)) {
        oldCellStates.get(y)?.set(x, {
            collapsed: map.cells[y][x].collapsed,
            possibleTiles: map.cells[y][x].possibleTiles.slice(),
        });
    }

    // Set the new possible tiles and sides of the current cell
    map.cells[y][x].possibleTiles = possibleTiles.tiles;
    map.cells[y][x].sides[Direction.Up] = possibleTiles.sides[Direction.Up];
    map.cells[y][x].sides[Direction.Right] = possibleTiles.sides[Direction.Right];
    map.cells[y][x].sides[Direction.Down] = possibleTiles.sides[Direction.Down];
    map.cells[y][x].sides[Direction.Left] = possibleTiles.sides[Direction.Left];

    // If there is only one possible tile, collapse the cell.
    if (map.cells[y][x].possibleTiles.length === 1) {
        map.cells[y][x].collapsed = true;

        // Update the sides of the cell to only include the sides of the collapsed tile
        map.cells[y][x].sides[Direction.Up] = [map.cells[y][x].possibleTiles[0].top];
        map.cells[y][x].sides[Direction.Right] = [map.cells[y][x].possibleTiles[0].right];
        map.cells[y][x].sides[Direction.Down] = [map.cells[y][x].possibleTiles[0].bottom];
        map.cells[y][x].sides[Direction.Left] = [map.cells[y][x].possibleTiles[0].left];
    }

    // If the up side of the current cell has changed, check the cell above
    if (
        y > 0 &&
        map.cells[y - 1][x].sides[Direction.Down].length !== possibleTiles.sides[Direction.Up].length &&
        !map.cells[y - 1][x].collapsed
    ) {
        const tileLimitationResult = await limitTilePossibilities(
            map,
            x,
            y - 1,
            map.cells[y - 1][x].possibleTiles,
            collapseEvent,
            oldCellStates
        );
        if (!tileLimitationResult.success) return tileLimitationResult;
    }

    // If the right side of the current cell has changed, check the cell to the right
    if (
        x < map.width - 1 &&
        map.cells[y][x + 1].sides[Direction.Left].length !== possibleTiles.sides[Direction.Right].length &&
        !map.cells[y][x + 1].collapsed
    ) {
        const tileLimitationResult = await limitTilePossibilities(
            map,
            x + 1,
            y,
            map.cells[y][x + 1].possibleTiles,
            collapseEvent,
            oldCellStates
        );
        if (!tileLimitationResult.success) return tileLimitationResult;
    }

    // If the down side of the current cell has changed, check the cell below
    if (
        y < map.height - 1 &&
        map.cells[y + 1][x].sides[Direction.Up].length !== possibleTiles.sides[Direction.Down].length &&
        !map.cells[y + 1][x].collapsed
    ) {
        const tileLimitationResult = await limitTilePossibilities(
            map,
            x,
            y + 1,
            map.cells[y + 1][x].possibleTiles,
            collapseEvent,
            oldCellStates
        );
        if (!tileLimitationResult.success) return tileLimitationResult;
    }

    // If the left side of the current cell has changed, check the cell to the left
    if (
        x > 0 &&
        map.cells[y][x - 1].sides[Direction.Right].length !== possibleTiles.sides[Direction.Left].length &&
        !map.cells[y][x - 1].collapsed
    ) {
        const tileLimitationResult = await limitTilePossibilities(
            map,
            x - 1,
            y,
            map.cells[y][x - 1].possibleTiles,
            collapseEvent,
            oldCellStates
        );
        if (!tileLimitationResult.success) return tileLimitationResult;
    }

    return {
        success: true,
        oldCellStates,
    };
};

/**
 * Applies old cell states to a map to revert the map to a previous state
 * @param {CarcassonneMap} map - Map to apply old cell states to
 * @param {OldCellStates} oldCellStates - Old cell states to revert to
 */
const resetOldCellStates = (map: CarcassonneMap, oldCellStates: OldCellStates): void => {
    // Go through all old cell states and reset the cells to the old state
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

/**
 * Function to fully collapse a map using the wave function collapse algorithm
 * @param {CarcassonneMap} map - The map to collapse
 * @param {CollapseEventCallback | undefined} collapseEvent - Callback for collapsing events
 * @return {Promise<void>} A promise that resolves when the map is fully collapsed
 */
const fullCollapse = async (map: CarcassonneMap, collapseEvent?: CollapseEventCallback): Promise<void> => {
    // Indicate that the map is being collapsed for visual purposes and the ability to cancel processing
    startProcessingMap();

    try {
        let nonCollapsedCells = map.cells.flat();
        const oldCellStates: OldCellStates[] = [];

        let currentPriorityCell: MapCell | undefined = undefined;

        // While there are still non-collapsed tiles left, try and collapse them
        while (true) {
            // Update the list of non-collapsed tiles and sort them by priority
            // Priority is determined by the number of possible tiles left for the cell or if the cell is a priority cell
            nonCollapsedCells = nonCollapsedCells
                .filter((tile) => !tile.collapsed)
                .sort((a, b) => {
                    if (a === currentPriorityCell) return -1;
                    if (b === currentPriorityCell) return 1;
                    return a.possibleTiles.length - b.possibleTiles.length;
                });

            // If there are no more non-collapsed tiles, the map is fully collapsed
            if (nonCollapsedCells.length === 0) break;

            // Get the next cell to collapse
            const tileToCollapse = nonCollapsedCells[0];

            // Shuffle the possible tiles to prevent bias
            shuffleArray(tileToCollapse.possibleTiles);

            // Try and collapse the tile with each possible tile until one works
            let tileIndex = 0;
            while (tileIndex < tileToCollapse.possibleTiles.length) {
                const collapseResult = await limitTilePossibilities(
                    map,
                    tileToCollapse.x,
                    tileToCollapse.y,
                    [tileToCollapse.possibleTiles[tileIndex]],
                    collapseEvent
                );

                if (collapseResult.success) {
                    oldCellStates.push(collapseResult.oldCellStates);

                    break;
                }

                resetOldCellStates(map, collapseResult.oldCellStates);
                tileIndex++;
            }

            // if tileIndex is equal to the number of possible tiles, then no tile worked and the map needs to be reverted to the previous state
            if (tileIndex === tileToCollapse.possibleTiles.length) {
                // Set the current priority cell to the cell that was just collapsed so that it is prioritized next time
                // as it is clearly the cell that is causing issues with collapsing
                currentPriorityCell = tileToCollapse;

                // Get the last set of old cell states and revert the map to that state
                // If there are no old cell states, then the map is unsolvable
                const latestOldCellStates = oldCellStates.pop();
                if (latestOldCellStates === undefined)
                    throw new Error('Impossible to collapse the map, no tiles left to collapse');

                // Revert the map to the previous state and update non collapsed cells
                resetOldCellStates(map, latestOldCellStates);
                nonCollapsedCells = map.cells.flat();
            }
        }
    } catch (e) {
        if (e instanceof Error) {
            if (e.message === 'Map processing was canceled') {
                return;
            }
        }
        throw e;
    } finally {
        stopProcessingMap();
    }
};

export {
    createMap,
    fullCollapse,
    limitTilePossibilities,
    resetOldCellStates,
    startProcessingMap,
    stopProcessingMap,
    cancelProcessingMap,
    setSleepMs,
};
