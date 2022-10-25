import { CarcassonneMap, Side, limitTilePossibilities, Tile } from './collapse';
import { Maze } from './maze';
import * as zod from 'zod';

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

const parseTilemapData = (tilemapData: unknown): TilemapData => {
    const parsedTilemapData = tilemapSchema.parse(tilemapData);
    const sideKeys = Object.values(Side).filter((e) => typeof e === 'string');

    return {
        width: parsedTilemapData.width,
        height: parsedTilemapData.height,
        tileSize: parsedTilemapData.tileSize,
        tiles: parsedTilemapData.tiles.map((tile, index) => {
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

const createTilesFromTilemapData = (tilemapData: TilemapData): Tile[] => {
    const tiles: Tile[] = [];
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

const limitMapToMaze = async (map: CarcassonneMap, maze: Maze, options: MazeLimitOptions): Promise<void> => {
    if (!options.allowTilesOutsideWithSide) options.allowSideConnections = false;

    for (let y = 0; y < map.height; y++) {
        for (let x = 0; x < map.width; x++) {
            const mapCell = map.cells[y][x];
            const mazeCell = maze.tiles[y][x];

            if (mazeCell === undefined) continue;

            if (!mazeCell.isMaze) {
                if (!options.allowTilesOutsideWithSide) {
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
                        )
                    );

                    if (!limitationResult.success) {
                        throw new Error(`Could not limit tilemap to maze. No possible tiles left at (${x}, ${y})`);
                    }
                }
                continue;
            }

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
                })
            );
            if (!limitationResult.success) {
                throw new Error(`Could not limit tilemap to maze. No possible tiles left at (${x}, ${y})`);
            }
        }
    }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const shuffleArray = (array: any[]): void => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
};

let unsleptTime = 0;

const sleep = async (ms: number): Promise<void> => {
    unsleptTime += ms;
    if (unsleptTime >= 1) {
        await new Promise((resolve) => setTimeout(resolve, unsleptTime));
        unsleptTime = 0;
    }
};

export { limitMapToMaze, createAllPossibleTiles, createTilesFromTilemapData, parseTilemapData, shuffleArray, sleep };
