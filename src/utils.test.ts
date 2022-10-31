import { createMap, Side } from './collapse';
import { createMaze, processMaze } from './maze';
import {
    createAllPossibleTiles,
    createTilesFromTilemapData,
    Direction,
    limitMapToMaze,
    parseTilemapData,
    shuffleArray,
    TilemapData,
} from './utils';

describe('creating all possible tiles', () => {
    it('there exists the correct amount of tiles', () => {
        expect(createAllPossibleTiles()).toHaveLength(Math.pow(Object.values(Side).length / 2, 4));
    });
});

describe('when parsing tilemap data', () => {
    it('throws an error when the tilemap data is invalid', () => {
        expect(() => parseTilemapData({})).toThrow();
        expect(() => parseTilemapData({ width: 0, height: 0, tileSize: 1, tiles: [] })).toThrow();
        expect(() => parseTilemapData({ width: 1, height: 0, tileSize: 1, tiles: [] })).toThrow();
        expect(() =>
            parseTilemapData({
                width: 1,
                height: 1,
                tileSize: 1,
                tiles: [{ top: 'Roadd', right: 'Roadd', bottom: 'Roadd', left: 'Roadd' }],
            })
        ).toThrow();
        expect(() =>
            parseTilemapData({
                width: 1,
                height: 1,
                tileSize: 1,
                tiles: [
                    { top: 'Road', right: 'Field', bottom: 'Field', left: 'City' },
                    { top: 'Road', right: 'ASDF', bottom: 'Road', left: 'Road' },
                ],
            })
        ).toThrow();
    });

    it('returns parsed tilemap data on correct data', () => {
        expect(
            parseTilemapData({
                width: 2,
                height: 10,
                tileSize: 1,
                tiles: [
                    { top: 'Road', right: 'Field', bottom: 'Field', left: 'City' },
                    { top: 'Road', right: 'City', bottom: 'Road', left: 'Road' },
                    { top: 'Road', right: 'City', bottom: 'Road', left: 'Road' },
                    { top: 'Road', right: 'City', bottom: 'Road', left: 'Road' },
                    { top: 'Road', right: 'City', bottom: 'Road', left: 'Road' },
                ],
            })
        ).toEqual({
            width: 2,
            height: 10,
            tileSize: 1,
            tiles: [
                {
                    x: 0,
                    y: 0,
                    top: Side.Road,
                    right: Side.Field,
                    bottom: Side.Field,
                    left: Side.City,
                    tilemapIndex: 0,
                    direction: Direction.Up,
                },
                {
                    x: 1,
                    y: 0,
                    top: Side.Road,
                    right: Side.City,
                    bottom: Side.Road,
                    left: Side.Road,
                    tilemapIndex: 1,
                    direction: Direction.Up,
                },
                {
                    x: 0,
                    y: 1,
                    top: Side.Road,
                    right: Side.City,
                    bottom: Side.Road,
                    left: Side.Road,
                    tilemapIndex: 2,
                    direction: Direction.Up,
                },
                {
                    x: 1,
                    y: 1,
                    top: Side.Road,
                    right: Side.City,
                    bottom: Side.Road,
                    left: Side.Road,
                    tilemapIndex: 3,
                    direction: Direction.Up,
                },
                {
                    x: 0,
                    y: 2,
                    top: Side.Road,
                    right: Side.City,
                    bottom: Side.Road,
                    left: Side.Road,
                    tilemapIndex: 4,
                    direction: Direction.Up,
                },
            ],
        });
    });
});

describe('creating tiles from tilemap data', () => {
    const tilemapData: TilemapData = {
        width: 2,
        height: 2,
        tileSize: 1,
        tiles: [
            {
                x: 0,
                y: 0,
                top: Side.Road,
                right: Side.Road,
                bottom: Side.Road,
                left: Side.Road,
                tilemapIndex: -1,
                direction: Direction.Up,
            },
            {
                x: 1,
                y: 0,
                top: Side.Road,
                right: Side.Field,
                bottom: Side.Field,
                left: Side.Road,
                tilemapIndex: -1,
                direction: Direction.Up,
            },
        ],
    };

    it('creates the correct amount of tiles', () => {
        expect(createTilesFromTilemapData(tilemapData)).toHaveLength(tilemapData.tiles.length * 4);
    });

    it('creates the correct tiles', () => {
        expect(createTilesFromTilemapData(tilemapData)).toEqual([
            {
                top: Side.Road,
                right: Side.Road,
                bottom: Side.Road,
                left: Side.Road,
                tilemapIndex: -1,
                direction: Direction.Up,
            },
            {
                top: Side.Road,
                right: Side.Road,
                bottom: Side.Road,
                left: Side.Road,
                tilemapIndex: -1,
                direction: Direction.Left,
            },
            {
                top: Side.Road,
                right: Side.Road,
                bottom: Side.Road,
                left: Side.Road,
                tilemapIndex: -1,
                direction: Direction.Down,
            },
            {
                top: Side.Road,
                right: Side.Road,
                bottom: Side.Road,
                left: Side.Road,
                tilemapIndex: -1,
                direction: Direction.Right,
            },
            {
                top: Side.Road,
                right: Side.Field,
                bottom: Side.Field,
                left: Side.Road,
                tilemapIndex: -1,
                direction: Direction.Up,
            },
            {
                top: Side.Field,
                right: Side.Field,
                bottom: Side.Road,
                left: Side.Road,
                tilemapIndex: -1,
                direction: Direction.Left,
            },
            {
                top: Side.Field,
                right: Side.Road,
                bottom: Side.Road,
                left: Side.Field,
                tilemapIndex: -1,
                direction: Direction.Down,
            },
            {
                top: Side.Road,
                right: Side.Road,
                bottom: Side.Field,
                left: Side.Field,
                tilemapIndex: -1,
                direction: Direction.Right,
            },
        ]);
    });
});

describe('when limiting a map to a maze', () => {
    const width = 15;
    const height = 17;

    const maze = createMaze(width, height);
    processMaze(maze);

    it('successfully limits the map', async () => {
        const possibleTiles = createAllPossibleTiles();
        const map = createMap(width, height, possibleTiles);

        await limitMapToMaze(map, maze, {
            sideType: Side.Road,
            allowSideConnections: false,
            allowTilesOutsideWithSide: false,
        });
    });

    it('fails to limit when insufficient tiles are available', async () => {
        const possibleTiles = [
            {
                bottom: Side.Road,
                left: Side.Road,
                right: Side.Road,
                top: Side.Field,
                tilemapIndex: 0,
                direction: Direction.Up,
            },
        ];
        const map = createMap(width, height, possibleTiles);

        await expect(
            limitMapToMaze(map, maze, {
                sideType: Side.Road,
                allowSideConnections: false,
                allowTilesOutsideWithSide: false,
            })
        ).rejects.toThrow();
    });
});

describe('when shuffling array', () => {
    it('returns a different array', () => {
        const array = [1, 2, 3, 4, 5];
        const shuffledArray = array.slice();
        shuffleArray(shuffledArray);
        expect(array).toHaveLength(shuffledArray.length);
        expect(array).not.toEqual(shuffledArray);
    });
});
