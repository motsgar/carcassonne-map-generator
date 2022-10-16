import {
    collapse,
    createMap,
    fullCollapse,
    limitTilePossibilities,
    printMap,
    resetOldCellStates,
    Side,
} from './collapse';
import { createAllPossibleTiles } from './utils';

describe('creating a map', () => {
    const mapWidth = 15;
    const mapHeight = 17;

    const possibleTiles = [
        { bottom: Side.Road, left: Side.Road, right: Side.Road, top: Side.Road },
        { bottom: Side.Road, left: Side.Field, right: Side.Field, top: Side.Field },
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
                expect(map.cells[y][x].sides.bottom).toEqual(new Set([Side.Road]));
                expect(map.cells[y][x].sides.left).toEqual(new Set([Side.Road, Side.Field]));
                expect(map.cells[y][x].sides.right).toEqual(new Set([Side.Road, Side.Field]));
                expect(map.cells[y][x].sides.top).toEqual(new Set([Side.Road, Side.Field]));
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

    it('has correct reference based dependencies', () => {
        for (let y = 0; y < mapHeight; y++) {
            for (let x = 0; x < mapWidth; x++) {
                for (const dependency of map.cells[y][x].dependencies) {
                    expect(dependency.x).toBeGreaterThanOrEqual(0);
                    expect(dependency.x).toBeLessThanOrEqual(mapWidth - 1);
                    expect(dependency.y).toBeGreaterThanOrEqual(0);
                    expect(dependency.y).toBeLessThanOrEqual(mapHeight - 1);
                    expect(dependency.hasChanged).toBe(false);

                    expect(map.cells[dependency.y][dependency.x].dependencies.find((d) => d.x === x && d.y === y)).toBe(
                        dependency.reverse
                    );
                }
            }
        }
    });
});

describe('when printing map', () => {
    const mapWidth = 6;
    const mapHeight = 5;

    it('prints empty map correctly', () => {
        console.log = jest.fn();
        const map = createMap(mapWidth, mapHeight, createAllPossibleTiles());
        printMap(map);

        expect(console.log).toHaveBeenCalledWith(`┏━━━━━━━┳━━━━━━━┳━━━━━━━┳━━━━━━━┳━━━━━━━┳━━━━━━━┓
┃  -    ┃  -    ┃  -    ┃  -    ┃  -    ┃  -    ┃
┃- 625 -┃- 625 -┃- 625 -┃- 625 -┃- 625 -┃- 625 -┃
┃  -    ┃  -    ┃  -    ┃  -    ┃  -    ┃  -    ┃
┣━━━━━━━╋━━━━━━━╋━━━━━━━╋━━━━━━━╋━━━━━━━╋━━━━━━━┫
┃  -    ┃  -    ┃  -    ┃  -    ┃  -    ┃  -    ┃
┃- 625 -┃- 625 -┃- 625 -┃- 625 -┃- 625 -┃- 625 -┃
┃  -    ┃  -    ┃  -    ┃  -    ┃  -    ┃  -    ┃
┣━━━━━━━╋━━━━━━━╋━━━━━━━╋━━━━━━━╋━━━━━━━╋━━━━━━━┫
┃  -    ┃  -    ┃  -    ┃  -    ┃  -    ┃  -    ┃
┃- 625 -┃- 625 -┃- 625 -┃- 625 -┃- 625 -┃- 625 -┃
┃  -    ┃  -    ┃  -    ┃  -    ┃  -    ┃  -    ┃
┣━━━━━━━╋━━━━━━━╋━━━━━━━╋━━━━━━━╋━━━━━━━╋━━━━━━━┫
┃  -    ┃  -    ┃  -    ┃  -    ┃  -    ┃  -    ┃
┃- 625 -┃- 625 -┃- 625 -┃- 625 -┃- 625 -┃- 625 -┃
┃  -    ┃  -    ┃  -    ┃  -    ┃  -    ┃  -    ┃
┣━━━━━━━╋━━━━━━━╋━━━━━━━╋━━━━━━━╋━━━━━━━╋━━━━━━━┫
┃  -    ┃  -    ┃  -    ┃  -    ┃  -    ┃  -    ┃
┃- 625 -┃- 625 -┃- 625 -┃- 625 -┃- 625 -┃- 625 -┃
┃  -    ┃  -    ┃  -    ┃  -    ┃  -    ┃  -    ┃
┗━━━━━━━┻━━━━━━━┻━━━━━━━┻━━━━━━━┻━━━━━━━┻━━━━━━━┛`);
    });

    it('prints a fully collapsed map correctly', () => {
        console.log = jest.fn();
        const map = createMap(mapWidth, mapHeight, createAllPossibleTiles());
        for (let y = 0; y < mapHeight; y++) {
            for (let x = 0; x < mapWidth; x++) {
                map.cells[y][x].collapsed = true;
            }
        }
        printMap(map);

        expect(console.log).toHaveBeenCalledWith(`┏━━━━━━━┳━━━━━━━┳━━━━━━━┳━━━━━━━┳━━━━━━━┳━━━━━━━┓
┃  0    ┃  0    ┃  0    ┃  0    ┃  0    ┃  0    ┃
┃0 #   0┃0 #   0┃0 #   0┃0 #   0┃0 #   0┃0 #   0┃
┃  0    ┃  0    ┃  0    ┃  0    ┃  0    ┃  0    ┃
┣━━━━━━━╋━━━━━━━╋━━━━━━━╋━━━━━━━╋━━━━━━━╋━━━━━━━┫
┃  0    ┃  0    ┃  0    ┃  0    ┃  0    ┃  0    ┃
┃0 #   0┃0 #   0┃0 #   0┃0 #   0┃0 #   0┃0 #   0┃
┃  0    ┃  0    ┃  0    ┃  0    ┃  0    ┃  0    ┃
┣━━━━━━━╋━━━━━━━╋━━━━━━━╋━━━━━━━╋━━━━━━━╋━━━━━━━┫
┃  0    ┃  0    ┃  0    ┃  0    ┃  0    ┃  0    ┃
┃0 #   0┃0 #   0┃0 #   0┃0 #   0┃0 #   0┃0 #   0┃
┃  0    ┃  0    ┃  0    ┃  0    ┃  0    ┃  0    ┃
┣━━━━━━━╋━━━━━━━╋━━━━━━━╋━━━━━━━╋━━━━━━━╋━━━━━━━┫
┃  0    ┃  0    ┃  0    ┃  0    ┃  0    ┃  0    ┃
┃0 #   0┃0 #   0┃0 #   0┃0 #   0┃0 #   0┃0 #   0┃
┃  0    ┃  0    ┃  0    ┃  0    ┃  0    ┃  0    ┃
┣━━━━━━━╋━━━━━━━╋━━━━━━━╋━━━━━━━╋━━━━━━━╋━━━━━━━┫
┃  0    ┃  0    ┃  0    ┃  0    ┃  0    ┃  0    ┃
┃0 #   0┃0 #   0┃0 #   0┃0 #   0┃0 #   0┃0 #   0┃
┃  0    ┃  0    ┃  0    ┃  0    ┃  0    ┃  0    ┃
┗━━━━━━━┻━━━━━━━┻━━━━━━━┻━━━━━━━┻━━━━━━━┻━━━━━━━┛`);
    });
});

describe('limiting possible tiles', () => {
    const mapWidth = 15;
    const mapHeight = 17;

    const possibleTiles = createAllPossibleTiles();

    it('limits possible tiles correctly', () => {
        const map = createMap(mapWidth, mapHeight, possibleTiles);
        const limitedTiles = possibleTiles.filter((tile) => tile.top === Side.Road && tile.bottom === Side.Road);

        limitTilePossibilities(map, 0, 0, limitedTiles);

        expect(map.cells[0][0].possibleTiles).toEqual(limitedTiles);
        expect(map.cells[0][0].possibleTiles).not.toBe(limitedTiles);
        expect(map.cells[0][0].sides.bottom).toEqual(new Set(limitedTiles.map((tile) => tile.bottom)));
        expect(map.cells[0][0].sides.left).toEqual(new Set(limitedTiles.map((tile) => tile.left)));
        expect(map.cells[0][0].sides.right).toEqual(new Set(limitedTiles.map((tile) => tile.right)));
        expect(map.cells[0][0].sides.top).toEqual(new Set(limitedTiles.map((tile) => tile.top)));
    });

    it('collapses a tile correctly', () => {
        const map = createMap(mapWidth, mapHeight, possibleTiles);
        const tileToCollapseTo = possibleTiles[100];

        collapse(map, 0, 0, tileToCollapseTo);

        expect(map.cells[0][0].possibleTiles).toEqual([tileToCollapseTo]);
        expect(map.cells[0][0].sides.bottom).toEqual(new Set([tileToCollapseTo.bottom]));
        expect(map.cells[0][0].sides.left).toEqual(new Set([tileToCollapseTo.left]));
        expect(map.cells[0][0].sides.right).toEqual(new Set([tileToCollapseTo.right]));
        expect(map.cells[0][0].sides.top).toEqual(new Set([tileToCollapseTo.top]));
        expect(map.cells[0][0].collapsed).toBe(true);
    });

    it('leaves no possibilities left when not limiting using references of original possible tiles', () => {
        const map = createMap(mapWidth, mapHeight, possibleTiles);
        const limitedTiles = [
            { bottom: Side.Road, left: Side.Road, right: Side.Road, top: Side.Road },
            { bottom: Side.Road, left: Side.Field, right: Side.Field, top: Side.Field },
        ];

        limitTilePossibilities(map, 0, 0, limitedTiles);

        expect(map.cells[0][0].possibleTiles).toEqual([]);
        expect(map.cells[0][0].sides.bottom).toEqual(new Set());
        expect(map.cells[0][0].sides.left).toEqual(new Set());
        expect(map.cells[0][0].sides.right).toEqual(new Set());
        expect(map.cells[0][0].sides.top).toEqual(new Set());
    });

    it('leaves no possibilities left when not collapsing using references of original possible tiles', () => {
        const map = createMap(mapWidth, mapHeight, possibleTiles);
        const limitedTiles = { bottom: Side.Road, left: Side.Road, right: Side.Road, top: Side.Road };

        collapse(map, 0, 0, limitedTiles);

        expect(map.cells[0][0].possibleTiles).toEqual([]);
        expect(map.cells[0][0].sides.bottom).toEqual(new Set());
        expect(map.cells[0][0].sides.left).toEqual(new Set());
        expect(map.cells[0][0].sides.right).toEqual(new Set());
        expect(map.cells[0][0].sides.top).toEqual(new Set());
    });
});

describe('resetting old cell states', () => {
    const mapWidth = 15;
    const mapHeight = 17;

    const possibleTiles = createAllPossibleTiles();

    it('resets old cell states correctly', () => {
        const map = createMap(mapWidth, mapHeight, possibleTiles);
        const limitedTiles = possibleTiles.filter((tile) => tile.top === Side.Road && tile.bottom === Side.Road);

        const limitationResult = limitTilePossibilities(map, 0, 0, limitedTiles);
        const collapseResult = collapse(map, 10, 10, possibleTiles[100]);

        expect(map.cells[10][10].possibleTiles).toEqual([possibleTiles[100]]);
        expect(map.cells[10][10].sides.bottom).toEqual(new Set([possibleTiles[100].bottom]));
        expect(map.cells[10][10].sides.left).toEqual(new Set([possibleTiles[100].left]));
        expect(map.cells[10][10].sides.right).toEqual(new Set([possibleTiles[100].right]));
        expect(map.cells[10][10].sides.top).toEqual(new Set([possibleTiles[100].top]));
        expect(map.cells[10][10].collapsed).toBe(true);

        expect(map.cells[0][0].possibleTiles).toEqual(limitedTiles);
        expect(map.cells[0][0].sides.bottom).toEqual(new Set(limitedTiles.map((tile) => tile.bottom)));
        expect(map.cells[0][0].sides.left).toEqual(new Set(limitedTiles.map((tile) => tile.left)));
        expect(map.cells[0][0].sides.right).toEqual(new Set(limitedTiles.map((tile) => tile.right)));
        expect(map.cells[0][0].sides.top).toEqual(new Set(limitedTiles.map((tile) => tile.top)));

        resetOldCellStates(map, collapseResult.oldCellStates);

        expect(map.cells[10][10].possibleTiles).toEqual(possibleTiles);
        expect(map.cells[10][10].sides.bottom).toEqual(new Set(possibleTiles.map((tile) => tile.bottom)));
        expect(map.cells[10][10].sides.left).toEqual(new Set(possibleTiles.map((tile) => tile.left)));
        expect(map.cells[10][10].sides.right).toEqual(new Set(possibleTiles.map((tile) => tile.right)));
        expect(map.cells[10][10].sides.top).toEqual(new Set(possibleTiles.map((tile) => tile.top)));
        expect(map.cells[10][10].collapsed).toBe(false);

        expect(map.cells[0][0].possibleTiles).toEqual(limitedTiles);
        expect(map.cells[0][0].sides.bottom).toEqual(new Set(limitedTiles.map((tile) => tile.bottom)));
        expect(map.cells[0][0].sides.left).toEqual(new Set(limitedTiles.map((tile) => tile.left)));
        expect(map.cells[0][0].sides.right).toEqual(new Set(limitedTiles.map((tile) => tile.right)));
        expect(map.cells[0][0].sides.top).toEqual(new Set(limitedTiles.map((tile) => tile.top)));

        resetOldCellStates(map, limitationResult.oldCellStates);

        expect(map.cells[10][10].possibleTiles).toEqual(possibleTiles);
        expect(map.cells[10][10].sides.bottom).toEqual(new Set(possibleTiles.map((tile) => tile.bottom)));
        expect(map.cells[10][10].sides.left).toEqual(new Set(possibleTiles.map((tile) => tile.left)));
        expect(map.cells[10][10].sides.right).toEqual(new Set(possibleTiles.map((tile) => tile.right)));
        expect(map.cells[10][10].sides.top).toEqual(new Set(possibleTiles.map((tile) => tile.top)));
        expect(map.cells[10][10].collapsed).toBe(false);

        expect(map.cells[0][0].possibleTiles).toEqual(possibleTiles);
        expect(map.cells[0][0].sides.bottom).toEqual(new Set(possibleTiles.map((tile) => tile.bottom)));
        expect(map.cells[0][0].sides.left).toEqual(new Set(possibleTiles.map((tile) => tile.left)));
        expect(map.cells[0][0].sides.right).toEqual(new Set(possibleTiles.map((tile) => tile.right)));
        expect(map.cells[0][0].sides.top).toEqual(new Set(possibleTiles.map((tile) => tile.top)));
    });
});

describe('collapsing a map', () => {
    const mapWidth = 15;
    const mapHeight = 17;

    it('successfully fully collapses', () => {
        const possibleTiles = createAllPossibleTiles();
        const map = createMap(mapWidth, mapHeight, possibleTiles);

        expect(() => {
            fullCollapse(map);
        }).not.toThrow();

        for (let y = 0; y < mapHeight; y++) {
            for (let x = 0; x < mapWidth; x++) {
                expect(map.cells[y][x].collapsed).toBe(true);
                expect(map.cells[y][x].possibleTiles).toHaveLength(1);
                if (x > 0) {
                    expect(map.cells[y][x].sides.left).toEqual(map.cells[y][x - 1].sides.right);
                    expect(map.cells[y][x].possibleTiles[0].left).toEqual(map.cells[y][x - 1].possibleTiles[0].right);
                }
                if (y > 0) {
                    expect(map.cells[y][x].sides.top).toEqual(map.cells[y - 1][x].sides.bottom);
                    expect(map.cells[y][x].possibleTiles[0].top).toEqual(map.cells[y - 1][x].possibleTiles[0].bottom);
                }
                if (x < mapWidth - 1) {
                    expect(map.cells[y][x].sides.right).toEqual(map.cells[y][x + 1].sides.left);
                    expect(map.cells[y][x].possibleTiles[0].right).toEqual(map.cells[y][x + 1].possibleTiles[0].left);
                }
                if (y < mapHeight - 1) {
                    expect(map.cells[y][x].sides.bottom).toEqual(map.cells[y + 1][x].sides.top);
                    expect(map.cells[y][x].possibleTiles[0].bottom).toEqual(map.cells[y + 1][x].possibleTiles[0].top);
                }
            }
        }
    });

    it('fails to collapse a map when insufficient tiles are available', () => {
        const possibleTiles = [{ bottom: Side.Road, left: Side.Road, right: Side.Road, top: Side.Field }];
        const map = createMap(mapWidth, mapHeight, possibleTiles);

        expect(() => {
            fullCollapse(map);
        }).toThrow();
    });
});
