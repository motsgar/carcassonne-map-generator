import { createMap, fullCollapse, Side } from './collapse';
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

                    expect(map.cells[dependency.y][dependency.x].dependencies.find((d) => d.x === x && d.y === y)).toBe(
                        dependency.reverse
                    );
                }
            }
        }
    });
});

describe('collapsing a map', () => {
    const mapWidth = 15;
    const mapHeight = 17;

    const possibleTiles = createAllPossibleTiles();
    const map = createMap(mapWidth, mapHeight, possibleTiles);

    it('successfully fully collapses', () => {
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
});
