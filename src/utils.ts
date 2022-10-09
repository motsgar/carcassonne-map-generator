import { Map, Side, limitTilePossibilities, Tile } from './collapse';
import { Maze } from './maze';
import * as zod from 'zod';

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
                    x: zod.number().int().nonnegative(),
                    y: zod.number().int().nonnegative(),
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
            if (tile.x + parsedTilemapData.tileSize > parsedTilemapData.width)
                zodIssues.push({
                    message: 'Tile x position is outside of tilemap width',
                    path: ['tiles', index, 'x'],
                    code: 'too_big',
                    type: 'number',
                    maximum: parsedTilemapData.width - parsedTilemapData.tileSize,
                    inclusive: true,
                });
            if (tile.y + parsedTilemapData.tileSize > parsedTilemapData.height)
                zodIssues.push({
                    message: 'Tile y position is outside of tilemap height',
                    path: ['tiles', index, 'y'],
                    code: 'too_big',
                    type: 'number',
                    maximum: parsedTilemapData.height - parsedTilemapData.tileSize,
                    inclusive: true,
                });
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
                x: tile.x,
                y: tile.y,
                top: Side[tile.top as keyof typeof Side],
                right: Side[tile.right as keyof typeof Side],
                bottom: Side[tile.bottom as keyof typeof Side],
                left: Side[tile.left as keyof typeof Side],
            };
        }),
    };
};

const createTilesFromTilemapData = (tilemapData: TilemapData): Tile[] => {
    const tiles: Tile[] = [];
    for (const tile of tilemapData.tiles) {
        tiles.push(tile);
    }
    return tiles;
};

const createAllPossibleTiles = (): Tile[] => {
    const tiles: Tile[] = [];
    for (const top of Object.values(Side).filter((e) => typeof e === 'number') as Side[]) {
        for (const right of Object.values(Side).filter((e) => typeof e === 'number') as Side[]) {
            for (const bottom of Object.values(Side).filter((e) => typeof e === 'number') as Side[]) {
                for (const left of Object.values(Side).filter((e) => typeof e === 'number') as Side[]) {
                    tiles.push({ top, right, bottom, left });
                }
            }
        }
    }
    return tiles;
};

const limitMapToMaze = (map: Map, maze: Maze, options: MazeLimitOptions): void => {
    if (options.allowSideConnections) options.allowTilesOutsideWithSide = true;

    for (let y = 0; y < map.height; y++) {
        for (let x = 0; x < map.width; x++) {
            const mapCell = map.tiles[y][x];
            const mazeCell = maze.tiles[y][x];

            if (mazeCell === undefined) continue;

            if (!mazeCell.isMaze) {
                if (!options.allowTilesOutsideWithSide) {
                    limitTilePossibilities(
                        map,
                        x,
                        y,
                        mapCell.possibilities.filter(
                            (tile) =>
                                tile.bottom !== options.sideType &&
                                tile.top !== options.sideType &&
                                tile.left !== options.sideType &&
                                tile.right !== options.sideType
                        )
                    );
                }
                continue;
            }

            limitTilePossibilities(
                map,
                x,
                y,
                mapCell.possibilities.filter((tile) => {
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
        }
    }
};
export { limitMapToMaze, createAllPossibleTiles, createTilesFromTilemapData, parseTilemapData };
