import { shuffleArray } from './utils';

export enum Side {
    Startpeice,
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
        top: Set<Side>;
        right: Set<Side>;
        bottom: Set<Side>;
        left: Set<Side>;
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

export type CollapseEvent = {
    type:
        | 'leftCheckTrue'
        | 'leftCheckFalse'
        | 'rightCheckTrue'
        | 'rightCheckFalse'
        | 'topCheckTrue'
        | 'topCheckFalse'
        | 'bottomCheckTrue'
        | 'bottomCheckFalse'
        | 'collapse';
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
                    top: new Set(tiles.map((tile) => tile.top)),
                    right: new Set(tiles.map((tile) => tile.right)),
                    bottom: new Set(tiles.map((tile) => tile.bottom)),
                    left: new Set(tiles.map((tile) => tile.left)),
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
            if (tile.collapsed) outputString += '  ' + tile.sides.top.values().next().value + '    ';
            else outputString += '  -    ';
            outputString += '┃';
        }

        outputString += '\n┃';
        for (let x = 0; x < map.width; x++) {
            const tile = map.cells[y][x];
            if (tile.collapsed)
                outputString +=
                    tile.sides.left.values().next().value + ' ' + '# ' + '  ' + tile.sides.right.values().next().value;
            else outputString += '- ' + tile.possibleTiles.length.toString().padEnd(3) + ' -';
            outputString += '┃';
        }
        outputString += '\n┃';
        for (let x = 0; x < map.width; x++) {
            const tile = map.cells[y][x];
            if (tile.collapsed) outputString += '  ' + tile.sides.bottom.values().next().value + '    ';
            else outputString += '  -    ';
            outputString += '┃';
        }

        if (y < map.height - 1) outputString += '\n┣' + '━━━━━━━╋'.repeat(map.width - 1) + '━━━━━━━┫\n';
    }
    outputString += '\n┗' + '━━━━━━━┻'.repeat(map.width - 1) + '━━━━━━━┛';
    console.log(outputString);
};

// checks a single coordinate for all possible tiles that fit the given sides
const getPossibleTiles = (
    map: CarcassonneMap,
    x: number,
    y: number,
    tiles: Tile[],
    collapseEvent?: CollapseEventCallback
): Tile[] => {
    const filteredTiles = [];

    for (const tile of tiles) {
        if (x > 0 && !map.cells[y][x - 1].sides.right.has(tile.left)) {
            collapseEvent && collapseEvent({ type: 'leftCheckFalse', x, y });
            continue;
        } else collapseEvent && collapseEvent({ type: 'leftCheckTrue', x, y });
        if (x < map.width - 1 && !map.cells[y][x + 1].sides.left.has(tile.right)) {
            collapseEvent && collapseEvent({ type: 'rightCheckFalse', x, y });
            continue;
        } else collapseEvent && collapseEvent({ type: 'rightCheckTrue', x, y });
        if (y > 0 && !map.cells[y - 1][x].sides.bottom.has(tile.top)) {
            collapseEvent && collapseEvent({ type: 'topCheckFalse', x, y });
            continue;
        } else collapseEvent && collapseEvent({ type: 'topCheckTrue', x, y });
        if (y < map.height - 1 && !map.cells[y + 1][x].sides.top.has(tile.bottom)) {
            collapseEvent && collapseEvent({ type: 'bottomCheckFalse', x, y });
            continue;
        } else collapseEvent && collapseEvent({ type: 'bottomCheckTrue', x, y });

        filteredTiles.push(tile);
    }
    return filteredTiles;
};

// function to be called recursively to calculate the possible tiles for a given coordinate
const propagateThroughTiles = (
    map: CarcassonneMap,
    x: number,
    y: number,
    oldCellStates: OldCellStates,
    collapseEvent?: CollapseEventCallback
): boolean => {
    const cell = map.cells[y][x];
    const dependencies = cell.dependencies;
    const originalPossibilities = cell.possibleTiles.length;

    if (!oldCellStates.has(y)) oldCellStates.set(y, new Map<number, CellState>());
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if (!oldCellStates.get(y)!.has(x))
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        oldCellStates.get(y)!.set(x, { possibleTiles: cell.possibleTiles.slice(), collapsed: cell.collapsed });

    cell.possibleTiles = getPossibleTiles(map, x, y, cell.possibleTiles, collapseEvent);
    if (cell.possibleTiles.length === 1) {
        collapseEvent && collapseEvent({ type: 'collapse', x, y });
        cell.collapsed = true;
    } else if (cell.possibleTiles.length === 0) {
        collapseEvent && collapseEvent({ type: 'collapse', x, y });
        return false;
    }
    cell.sides = {
        top: new Set(cell.possibleTiles.map((tile) => tile.top)),
        right: new Set(cell.possibleTiles.map((tile) => tile.right)),
        bottom: new Set(cell.possibleTiles.map((tile) => tile.bottom)),
        left: new Set(cell.possibleTiles.map((tile) => tile.left)),
    };

    for (const dependency of dependencies) {
        dependency.hasChanged = false;
        if (originalPossibilities !== cell.possibleTiles.length) dependency.reverse.hasChanged = true;
    }

    for (const dependency of dependencies) {
        if (map.cells[dependency.y][dependency.x].collapsed) continue;
        if (!map.cells[dependency.y][dependency.x].dependencies.reduce((val, cur) => val || cur.hasChanged, false))
            continue;
        const noTilesLeft = propagateThroughTiles(map, dependency.x, dependency.y, oldCellStates, collapseEvent);
        if (!noTilesLeft) return false;
    }
    return true;
};

// this function doesn't check if the limitation leaves a tile without possibilities
const limitTilePossibilities = (
    map: CarcassonneMap,
    x: number,
    y: number,
    tileList: Tile[],
    collapseEvent?: CollapseEventCallback
): LimitationResult => {
    const oldCellStates: OldCellStates = new Map<number, Map<number, CellState>>();
    oldCellStates.set(y, new Map<number, CellState>());
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    oldCellStates.get(y)!.set(x, {
        collapsed: map.cells[y][x].collapsed,
        possibleTiles: map.cells[y][x].possibleTiles.slice(),
    });

    const possibleTiles = map.cells[y][x].possibleTiles;

    // remove all tiles that can't be in this position
    const filteredTileList = tileList.filter((tile) => possibleTiles.find((t) => t === tile));

    // check if the tile can be collapsed to the given tile
    map.cells[y][x].possibleTiles = filteredTileList;
    map.cells[y][x].sides = {
        top: new Set(filteredTileList.map((tile) => tile.top)),
        right: new Set(filteredTileList.map((tile) => tile.right)),
        bottom: new Set(filteredTileList.map((tile) => tile.bottom)),
        left: new Set(filteredTileList.map((tile) => tile.left)),
    };
    if (filteredTileList.length === 1) map.cells[y][x].collapsed = true;

    for (const dependency of map.cells[y][x].dependencies) dependency.reverse.hasChanged = true;

    const propaganationSuccess = propagateThroughTiles(map, x, y, oldCellStates, collapseEvent);

    return {
        success: propaganationSuccess,
        oldCellStates,
    };
};

// collapse a single coordinate to a specific tile
const collapse = (
    map: CarcassonneMap,
    x: number,
    y: number,
    tile: Tile,
    collapseEvent?: CollapseEventCallback
): LimitationResult => {
    return limitTilePossibilities(map, x, y, [tile], collapseEvent);
};

const resetOldCellStates = (map: CarcassonneMap, oldCellStates: OldCellStates): void => {
    for (const [y, xMap] of oldCellStates) {
        for (const [x, cellState] of xMap) {
            map.cells[y][x].possibleTiles = cellState.possibleTiles;
            map.cells[y][x].collapsed = cellState.collapsed;
            map.cells[y][x].sides = {
                top: new Set(cellState.possibleTiles.map((tile) => tile.top)),
                right: new Set(cellState.possibleTiles.map((tile) => tile.right)),
                bottom: new Set(cellState.possibleTiles.map((tile) => tile.bottom)),
                left: new Set(cellState.possibleTiles.map((tile) => tile.left)),
            };
        }
    }
};

const fullCollapse = (map: CarcassonneMap, collapseEvent?: CollapseEventCallback): void => {
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
            const collapseResult = collapse(
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
        }
    }
};

export { collapse, limitTilePossibilities, fullCollapse, printMap, createMap };
