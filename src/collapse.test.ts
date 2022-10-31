import { createMap, fullCollapse, limitTilePossibilities, resetOldCellStates, Side } from './collapse';
import { createAllPossibleTiles, Direction, unique } from './utils';

describe('creating a map', () => {
    const mapWidth = 15;
    const mapHeight = 17;

    const possibleTiles = [
        {
            top: Side.Road,
            right: Side.Road,
            bottom: Side.Road,
            left: Side.Road,
            tilemapIndex: 0,
            direction: Direction.Up,
        },
        {
            top: Side.Field,
            right: Side.Field,
            bottom: Side.Road,
            left: Side.Field,
            tilemapIndex: 1,
            direction: Direction.Up,
        },
    ];
    const map = createMap(mapWidth, mapHeight, possibleTiles);

    it('is has correct size', () => {
        expect(map.width).toBe(mapWidth);
        expect(map.height).toBe(mapHeight);
        expect(map.cells).toHaveLength(mapHeight);
        expect(map.cells[0]).toHaveLength(mapWidth);
    });

    it('has correct coordinates in tiles', () => {
        for (let y = 0; y < mapHeight; y++) {
            for (let x = 0; x < mapWidth; x++) {
                expect(map.cells[y][x].x).toBe(x);
                expect(map.cells[y][x].y).toBe(y);
            }
        }
    });

    it('has correct possible tiles', () => {
        for (let y = 0; y < mapHeight; y++) {
            for (let x = 0; x < mapWidth; x++) {
                expect(map.cells[y][x].possibleTiles).toEqual(possibleTiles);
                expect(map.cells[y][x].possibleTiles).not.toBe(possibleTiles);
            }
        }
    });

    it('has correct possible sides', () => {
        for (let y = 0; y < mapHeight; y++) {
            for (let x = 0; x < mapWidth; x++) {
                expect(map.cells[y][x].sides[Direction.Up]).toEqual([Side.Road, Side.Field]);
                expect(map.cells[y][x].sides[Direction.Right]).toEqual([Side.Road, Side.Field]);
                expect(map.cells[y][x].sides[Direction.Down]).toEqual([Side.Road]);
                expect(map.cells[y][x].sides[Direction.Left]).toEqual([Side.Road, Side.Field]);
            }
        }
    });

    it('is not collapsed', () => {
        for (let y = 0; y < mapHeight; y++) {
            for (let x = 0; x < mapWidth; x++) {
                expect(map.cells[y][x].collapsed).toBe(false);
            }
        }
    });
});

describe('limiting possible tiles', () => {
    const mapWidth = 15;
    const mapHeight = 17;

    const possibleTiles = createAllPossibleTiles();

    it('limits possible tiles correctly', async () => {
        const map = createMap(mapWidth, mapHeight, possibleTiles);
        const limitedTiles = possibleTiles.filter((tile) => tile.top === Side.Road && tile.bottom === Side.Road);

        await limitTilePossibilities(map, 0, 0, limitedTiles);

        expect(map.cells[0][0].possibleTiles).toEqual(limitedTiles);
        expect(map.cells[0][0].possibleTiles).not.toBe(limitedTiles);
        expect(map.cells[0][0].sides[Direction.Up]).toEqual(unique(limitedTiles.map((tile) => tile.top)));
        expect(map.cells[0][0].sides[Direction.Right]).toEqual(unique(limitedTiles.map((tile) => tile.right)));
        expect(map.cells[0][0].sides[Direction.Down]).toEqual(unique(limitedTiles.map((tile) => tile.bottom)));
        expect(map.cells[0][0].sides[Direction.Left]).toEqual(unique(limitedTiles.map((tile) => tile.left)));
    });

    it('collapses a tile correctly', async () => {
        const map = createMap(mapWidth, mapHeight, possibleTiles);
        const tileToCollapseTo = possibleTiles[100];

        await limitTilePossibilities(map, 0, 0, [tileToCollapseTo]);

        expect(map.cells[0][0].possibleTiles).toEqual([tileToCollapseTo]);
        expect(map.cells[0][0].sides[Direction.Up]).toEqual([tileToCollapseTo.top]);
        expect(map.cells[0][0].sides[Direction.Right]).toEqual([tileToCollapseTo.right]);
        expect(map.cells[0][0].sides[Direction.Down]).toEqual([tileToCollapseTo.bottom]);
        expect(map.cells[0][0].sides[Direction.Left]).toEqual([tileToCollapseTo.left]);
        expect(map.cells[0][0].collapsed).toBe(true);
    });
});

describe('resetting old cell states', () => {
    const mapWidth = 15;
    const mapHeight = 17;

    const possibleTiles = createAllPossibleTiles();

    it('resets old cell states correctly', async () => {
        const map = createMap(mapWidth, mapHeight, possibleTiles);
        const limitedTiles = possibleTiles.filter((tile) => tile.top === Side.Road && tile.bottom === Side.Road);

        const limitationResult = await limitTilePossibilities(map, 0, 0, limitedTiles);
        const collapseResult = await limitTilePossibilities(map, 10, 10, [possibleTiles[100]]);

        expect(map.cells[10][10].possibleTiles).toEqual([possibleTiles[100]]);
        expect(map.cells[10][10].sides[Direction.Up]).toEqual([possibleTiles[100].top]);
        expect(map.cells[10][10].sides[Direction.Right]).toEqual([possibleTiles[100].right]);
        expect(map.cells[10][10].sides[Direction.Down]).toEqual([possibleTiles[100].bottom]);
        expect(map.cells[10][10].sides[Direction.Left]).toEqual([possibleTiles[100].left]);
        expect(map.cells[10][10].collapsed).toBe(true);

        expect(map.cells[0][0].possibleTiles).toEqual(unique(unique(limitedTiles)));
        expect(map.cells[0][0].sides[Direction.Up]).toEqual(unique(unique(limitedTiles.map((tile) => tile.top))));
        expect(map.cells[0][0].sides[Direction.Right]).toEqual(unique(limitedTiles.map((tile) => tile.right)));
        expect(map.cells[0][0].sides[Direction.Down]).toEqual(unique(limitedTiles.map((tile) => tile.bottom)));
        expect(map.cells[0][0].sides[Direction.Left]).toEqual(unique(limitedTiles.map((tile) => tile.left)));

        resetOldCellStates(map, collapseResult.oldCellStates);

        expect(map.cells[10][10].possibleTiles).toEqual(unique(possibleTiles));
        expect(map.cells[10][10].sides[Direction.Up]).toEqual(unique(possibleTiles.map((tile) => tile.top)));
        expect(map.cells[10][10].sides[Direction.Right]).toEqual(unique(possibleTiles.map((tile) => tile.right)));
        expect(map.cells[10][10].sides[Direction.Down]).toEqual(unique(possibleTiles.map((tile) => tile.bottom)));
        expect(map.cells[10][10].sides[Direction.Left]).toEqual(unique(possibleTiles.map((tile) => tile.left)));
        expect(map.cells[10][10].collapsed).toBe(false);

        expect(map.cells[0][0].possibleTiles).toEqual(unique(limitedTiles));
        expect(map.cells[0][0].sides[Direction.Up]).toEqual(unique(limitedTiles.map((tile) => tile.top)));
        expect(map.cells[0][0].sides[Direction.Right]).toEqual(unique(limitedTiles.map((tile) => tile.right)));
        expect(map.cells[0][0].sides[Direction.Down]).toEqual(unique(limitedTiles.map((tile) => tile.bottom)));
        expect(map.cells[0][0].sides[Direction.Left]).toEqual(unique(limitedTiles.map((tile) => tile.left)));

        resetOldCellStates(map, limitationResult.oldCellStates);

        expect(map.cells[10][10].possibleTiles).toEqual(unique(possibleTiles));
        expect(map.cells[10][10].sides[Direction.Up]).toEqual(unique(possibleTiles.map((tile) => tile.top)));
        expect(map.cells[10][10].sides[Direction.Right]).toEqual(unique(possibleTiles.map((tile) => tile.right)));
        expect(map.cells[10][10].sides[Direction.Down]).toEqual(unique(possibleTiles.map((tile) => tile.bottom)));
        expect(map.cells[10][10].sides[Direction.Left]).toEqual(unique(possibleTiles.map((tile) => tile.left)));
        expect(map.cells[10][10].collapsed).toBe(false);

        expect(map.cells[0][0].possibleTiles).toEqual(unique(possibleTiles));
        expect(map.cells[0][0].sides[Direction.Up]).toEqual(unique(possibleTiles.map((tile) => tile.top)));
        expect(map.cells[0][0].sides[Direction.Right]).toEqual(unique(possibleTiles.map((tile) => tile.right)));
        expect(map.cells[0][0].sides[Direction.Down]).toEqual(unique(possibleTiles.map((tile) => tile.bottom)));
        expect(map.cells[0][0].sides[Direction.Left]).toEqual(unique(possibleTiles.map((tile) => tile.left)));
    });
});

describe('collapsing a map', () => {
    const mapWidth = 15;
    const mapHeight = 17;

    it('successfully fully collapses', async () => {
        const possibleTiles = createAllPossibleTiles();
        const map = createMap(mapWidth, mapHeight, possibleTiles);

        await fullCollapse(map);

        for (let y = 0; y < mapHeight; y++) {
            for (let x = 0; x < mapWidth; x++) {
                expect(map.cells[y][x].collapsed).toBe(true);
                expect(map.cells[y][x].possibleTiles).toHaveLength(1);

                expect(map.cells[y][x].sides[Direction.Up]).toHaveLength(1);
                expect(map.cells[y][x].sides[Direction.Right]).toHaveLength(1);
                expect(map.cells[y][x].sides[Direction.Down]).toHaveLength(1);
                expect(map.cells[y][x].sides[Direction.Left]).toHaveLength(1);

                if (x > 0) {
                    expect(map.cells[y][x].sides[Direction.Left]).toEqual(map.cells[y][x - 1].sides[Direction.Right]);
                    expect(map.cells[y][x].possibleTiles[0].left).toEqual(map.cells[y][x - 1].possibleTiles[0].right);
                }
                if (y > 0) {
                    expect(map.cells[y][x].sides[Direction.Up]).toEqual(map.cells[y - 1][x].sides[Direction.Down]);
                    expect(map.cells[y][x].possibleTiles[0].top).toEqual(map.cells[y - 1][x].possibleTiles[0].bottom);
                }
                if (x < mapWidth - 1) {
                    expect(map.cells[y][x].sides[Direction.Right]).toEqual(map.cells[y][x + 1].sides[Direction.Left]);
                    expect(map.cells[y][x].possibleTiles[0].right).toEqual(map.cells[y][x + 1].possibleTiles[0].left);
                }
                if (y < mapHeight - 1) {
                    expect(map.cells[y][x].sides[Direction.Down]).toEqual(map.cells[y + 1][x].sides[Direction.Up]);
                    expect(map.cells[y][x].possibleTiles[0].bottom).toEqual(map.cells[y + 1][x].possibleTiles[0].top);
                }
            }
        }
    });

    it('fails to collapse a map when insufficient tiles are available', async () => {
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
        const map = createMap(mapWidth, mapHeight, possibleTiles);

        await expect(fullCollapse(map)).rejects.toThrow();
    });
});
