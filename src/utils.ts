import {
    CarcassonneMap,
    Side,
    limitTilePossibilities,
    Tile,
    CollapseEventCallback,
    startProcessingMap,
} from './collapse';
import { Maze } from './maze';
import * as zod from 'zod';

// ----- //
// Types //
// ----- //

export enum Direction {
    Up,
    Right,
    Down,
    Left,
}

export type MazeLimitOptions = {
    sideType: Side;
    allowSideConnections: boolean;
    allowTilesOutsideWithSide: boolean;
};

export type TilemapTile = Tile & {
    x: number;
    y: number;
};

export type TilemapData = {
    width: number;
    height: number;
    tileSize: number;
    tiles: TilemapTile[];
};

// ---------------- //
// Global Variables //
// ---------------- //

// Schema for tilemap data json file
const tilemapSchema = zod
    .object({
        width: zod.number().int().positive(),
        height: zod.number().int().positive(),
        tileSize: zod.number().int().positive(),
        tiles: zod.array(
            zod
                .object({
                    top: zod.string(),
                    right: zod.string(),
                    bottom: zod.string(),
                    left: zod.string(),
                })
                .strict()
        ),
    })
    .strict();

// ------------------------- //
// Animation State Variables //
// ------------------------- //

let unsleptTime = 0;

// ----------------- //
// Utility Functions //
// ----------------- //

/**
 * Parses a tilemap json file and returns the tilemap data or throws an error if the data is invalid
 * @param {unknown} tilemapData - The tilemap data as a javascript object to parse
 * @return {TilemapData} The parsed tilemap data
 */
const parseTilemapData = (tilemapData: unknown): TilemapData => {
    const parsedTilemapData = tilemapSchema.parse(tilemapData);
    const sideKeys = Object.values(Side).filter((e) => typeof e === 'string');

    return {
        width: parsedTilemapData.width,
        height: parsedTilemapData.height,
        tileSize: parsedTilemapData.tileSize,
        tiles: parsedTilemapData.tiles.map((tile, index) => {
            // Make sure all sides are valid side keys
            const zodIssues: zod.ZodIssue[] = [];
            if (!sideKeys.includes(tile.top))
                zodIssues.push({
                    message: 'Tile top side is not a valid side',
                    path: ['tiles', index, 'top'],
                    code: 'invalid_enum_value',
                    options: sideKeys,
                    received: tile.top,
                });
            if (!sideKeys.includes(tile.right))
                zodIssues.push({
                    message: 'Tile right side is not a valid side',
                    path: ['tiles', index, 'right'],
                    code: 'invalid_enum_value',
                    options: sideKeys,
                    received: tile.right,
                });
            if (!sideKeys.includes(tile.bottom))
                zodIssues.push({
                    message: 'Tile bottom side is not a valid side',
                    path: ['tiles', index, 'bottom'],
                    code: 'invalid_enum_value',
                    options: sideKeys,
                    received: tile.bottom,
                });
            if (!sideKeys.includes(tile.left))
                zodIssues.push({
                    message: 'Tile left side is not a valid side',
                    path: ['tiles', index, 'left'],
                    code: 'invalid_enum_value',
                    options: sideKeys,
                    received: tile.left,
                });

            // Throw an error if any of the sides are invalid
            if (zodIssues.length > 0) throw new zod.ZodError(zodIssues);

            return {
                x: index % parsedTilemapData.width,
                y: Math.floor(index / parsedTilemapData.width),
                top: Side[tile.top as keyof typeof Side],
                right: Side[tile.right as keyof typeof Side],
                bottom: Side[tile.bottom as keyof typeof Side],
                left: Side[tile.left as keyof typeof Side],
                direction: Direction.Up,
                tilemapIndex: index,
            };
        }),
    };
};

/**
 * Creates a tile list from tilemap data
 * @param {TilemapData} tilemapData - The tilemap data to generate a tile list from
 * @return {Tile[]} The list of tiles from the tilemap data
 */
const createTilesFromTilemapData = (tilemapData: TilemapData): Tile[] => {
    const tiles: Tile[] = [];

    // For every tile in tilemap data, create a tile in 4 different directions and add it to the list of tiles
    for (const tile of tilemapData.tiles) {
        tiles.push({
            top: tile.top,
            right: tile.right,
            bottom: tile.bottom,
            left: tile.left,
            tilemapIndex: tile.tilemapIndex,
            direction: Direction.Up,
        });
        tiles.push({
            top: tile.right,
            right: tile.bottom,
            bottom: tile.left,
            left: tile.top,
            tilemapIndex: tile.tilemapIndex,
            direction: Direction.Left,
        });
        tiles.push({
            top: tile.bottom,
            right: tile.left,
            bottom: tile.top,
            left: tile.right,
            tilemapIndex: tile.tilemapIndex,
            direction: Direction.Down,
        });
        tiles.push({
            top: tile.left,
            right: tile.top,
            bottom: tile.right,
            left: tile.bottom,
            tilemapIndex: tile.tilemapIndex,
            direction: Direction.Right,
        });
    }
    return tiles;
};

/**
 * Function that limits a map's cells sides according to a maze
 * @param {CarcassonneMap} map - The map to limit the maze to
 * @param {Maze} maze - The maze from which to limit the map
 * @param {MazeLimitOptions} options - Options for how to limit the map
 * @param {CollapseEventCallback | undefined} collapseEvent - A callback function that is called when a event occurs during the limit process
 * @return {Promise<void>} A promise that resolves when the limit process is complete
 */
const limitMapToMaze = async (
    map: CarcassonneMap,
    maze: Maze,
    options: MazeLimitOptions,
    collapseEvent?: CollapseEventCallback
): Promise<void> => {
    startProcessingMap();

    // Disable allowSideConnections if allowTilesOutsideWithSide is false because it doesn't make sense to allow side connections if tiles outside the maze can't have the selected side
    if (!options.allowTilesOutsideWithSide) options.allowSideConnections = false;

    try {
        // Go through every cell in the map and limit its sides according to the maze
        for (let y = 0; y < map.height; y++) {
            for (let x = 0; x < map.width; x++) {
                const mapCell = map.cells[y][x];
                const mazeCell = maze.cells[y][x];

                // If the cell is undefined, skip it because it's outside the maze
                if (mazeCell === undefined) continue;

                // If the cell is part of maze, limit its sides according to the maze. If it's not part of the maze, limit its sides according to the options
                if (mazeCell.isMaze) {
                    const limitationResult = await limitTilePossibilities(
                        map,
                        x,
                        y,
                        mapCell.possibleTiles.filter((tile) => {
                            if (mazeCell.walls.top.open) {
                                if (tile.top !== options.sideType) return false;
                            } else if (!options.allowSideConnections && tile.top === options.sideType) return false;
                            if (mazeCell.walls.right.open) {
                                if (tile.right !== options.sideType) return false;
                            } else if (!options.allowSideConnections && tile.right === options.sideType) return false;
                            if (mazeCell.walls.bottom.open) {
                                if (tile.bottom !== options.sideType) return false;
                            } else if (!options.allowSideConnections && tile.bottom === options.sideType) return false;
                            if (mazeCell.walls.left.open) {
                                if (tile.left !== options.sideType) return false;
                            } else if (!options.allowSideConnections && tile.left === options.sideType) return false;
                            return true;
                        }),
                        collapseEvent
                    );

                    // If the cell has no possible tiles, throw an error
                    if (!limitationResult.success) {
                        throw new Error(`Could not limit tilemap to maze. No possible tiles left at (${x}, ${y})`);
                    }
                } else {
                    if (options.allowTilesOutsideWithSide) continue;

                    const limitationResult = await limitTilePossibilities(
                        map,
                        x,
                        y,
                        mapCell.possibleTiles.filter(
                            (tile) =>
                                tile.bottom !== options.sideType &&
                                tile.top !== options.sideType &&
                                tile.left !== options.sideType &&
                                tile.right !== options.sideType
                        ),
                        collapseEvent
                    );

                    // If the cell has no possible tiles, throw an error
                    if (!limitationResult.success) {
                        throw new Error(`Could not limit tilemap to maze. No possible tiles left at (${x}, ${y})`);
                    }
                }
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

/**
 * Creates all possible tiles with all orientations that can be made from the sides available
 * @return {Tile[]} A list of tiles that can be used to create a maze
 */
const createAllPossibleTiles = (): Tile[] => {
    const tiles: Tile[] = [];
    for (const top of Object.values(Side).filter((e) => typeof e === 'number') as Side[]) {
        for (const right of Object.values(Side).filter((e) => typeof e === 'number') as Side[]) {
            for (const bottom of Object.values(Side).filter((e) => typeof e === 'number') as Side[]) {
                for (const left of Object.values(Side).filter((e) => typeof e === 'number') as Side[]) {
                    tiles.push({ top, right, bottom, left, direction: Direction.Up, tilemapIndex: -1 });
                }
            }
        }
    }
    return tiles;
};

/**
 * Shuffles an array
 * @param {any[]} array - The array to shuffle
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const shuffleArray = (array: any[]): void => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
};

/**
 * Sleeps for a specified amount of time. If time is less than 1, it will add the time to unslept time and if it is greater than 1, it will sleep for the unslept time
 * @param {number} ms - The amount of milliseconds to sleep for
 * @return {Promise<void>} A promise that resolves when the sleep is complete
 */
const sleep = async (ms: number): Promise<void> => {
    unsleptTime += ms;
    if (unsleptTime >= 1) {
        await new Promise((resolve) => setTimeout(resolve, unsleptTime));
        unsleptTime = 0;
    }
};

/**
 * Function to convert from animation speed to milliseconds to sleep for per step
 * @param {number} animationSpeed - The speed of the animation
 * @param {number | undefined} steepness - The steepness of the animation
 * @return {number} The amount of time to sleep for
 */
const getSleepMs = (animationSpeed: number, steepness = 0.005): number => {
    const normalizedSpeed = animationSpeed / 1000;
    return (1.00001 - (Math.pow(steepness, normalizedSpeed) - 1) / (steepness - 1)) * 1000 - 0.009;
};

/**
 * Returns unique values from an array
 * @param {any[]} array - The array to get unique values from
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const unique = (array: any[]): any[] => {
    return array.filter((e, i, a) => a.indexOf(e) === i);
};

export {
    limitMapToMaze,
    createTilesFromTilemapData,
    parseTilemapData,
    shuffleArray,
    sleep,
    getSleepMs,
    createAllPossibleTiles,
    unique,
};
