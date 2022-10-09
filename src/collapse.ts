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
    possibilities: Tile[];
    collapsed: boolean;
    dependencies: Dependency[];
    sides: {
        top: Set<Side>;
        right: Set<Side>;
        bottom: Set<Side>;
        left: Set<Side>;
    };
};

export type Map = {
    width: number;
    height: number;
    tiles: MapCell[][];
};

export type Event = {
    type: 'event1' | 'event2';
    x: number;
    y: number;
};

export type CallbackEvent = (event: Event) => void;

const createMap = (width: number, height: number, tiles: Tile[]): Map => {
    // create 2d map of tiles and initialize every position with all possible tiles
    const map: Map = {
        tiles: Array.from(Array(height), () =>
            new Array(width).fill(undefined).map(() => ({
                x: 0,
                y: 0,
                possibilities: tiles.slice(),
                collapsed: false,
                entropyChecked: false,
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
            map.tiles[y][x].x = x;
            map.tiles[y][x].y = y;
        }
    }

    // fill the dependencies of a tile with all tiles that depend on it (currently only the tiles next to it)
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (x > 0) {
                map.tiles[y][x].dependencies.push({ x: x - 1, y, hasChanged: false } as Dependency); // breaking the type system temporarily because reverse has to be set later
            }
            if (x < width - 1) {
                map.tiles[y][x].dependencies.push({ x: x + 1, y, hasChanged: false } as Dependency);
            }
            if (y > 0) {
                map.tiles[y][x].dependencies.push({ x, y: y - 1, hasChanged: false } as Dependency);
            }
            if (y < height - 1) {
                map.tiles[y][x].dependencies.push({ x, y: y + 1, hasChanged: false } as Dependency);
            }
        }
    }
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            for (const dependency of map.tiles[y][x].dependencies) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                dependency.reverse = map.tiles[dependency.y][dependency.x].dependencies.find(
                    (d) => d.x === x && d.y === y
                )!; // set the reverse dependency that was broken earlier
            }
        }
    }

    return map;
};

const printMap = (map: Map): void => {
    let outputString = '';
    outputString += '┏' + '━━━━━━┳'.repeat(map.width - 1) + '━━━━━━┓\n';
    for (let y = 0; y < map.height; y++) {
        outputString += '┃';
        for (let x = 0; x < map.width; x++) {
            const tile = map.tiles[y][x];
            if (tile.collapsed) outputString += '  ' + tile.sides.top.values().next().value + '   ';
            else outputString += '  -   ';
            outputString += '┃';
        }

        outputString += '\n┃';
        for (let x = 0; x < map.width; x++) {
            const tile = map.tiles[y][x];
            if (tile.collapsed)
                outputString +=
                    tile.sides.left.values().next().value + ' ' + '# ' + ' ' + tile.sides.right.values().next().value;
            else outputString += '- ' + tile.possibilities.length.toString().padEnd(2) + ' -';
            outputString += '┃';
        }
        outputString += '\n┃';
        for (let x = 0; x < map.width; x++) {
            const tile = map.tiles[y][x];
            if (tile.collapsed) outputString += '  ' + tile.sides.bottom.values().next().value + '   ';
            else outputString += '  -   ';
            outputString += '┃';
        }

        if (y < map.height - 1) outputString += '\n┣' + '━━━━━━╋'.repeat(map.width - 1) + '━━━━━━┫\n';
    }
    outputString += '\n┗' + '━━━━━━┻'.repeat(map.width - 1) + '━━━━━━┛';
    console.log(outputString);
};

// checks a single coordinate for all possible tiles that fit the given sides
const getPossibleTiles = (
    map: Map,
    x: number,
    y: number,
    tileWithPossibilities: MapCell,
    callbackEvent?: CallbackEvent
): Tile[] => {
    const filteredTiles = [];

    for (const tile of tileWithPossibilities.possibilities) {
        if (x > 0 && !map.tiles[y][x - 1].sides.right.has(tile.left)) continue;
        if (x < map.width - 1 && !map.tiles[y][x + 1].sides.left.has(tile.right)) continue;
        if (y > 0 && !map.tiles[y - 1][x].sides.bottom.has(tile.top)) continue;
        if (y < map.height - 1 && !map.tiles[y + 1][x].sides.top.has(tile.bottom)) continue;

        filteredTiles.push(tile);
    }
    callbackEvent && callbackEvent({ type: 'event2', x: -1, y: -1 });
    return filteredTiles;
};

// function to be called recursively to calculate the possible tiles for a given coordinate
const propagateThroughTiles = (map: Map, x: number, y: number, callbackEvent?: CallbackEvent): void => {
    const mapTiles = map.tiles[y][x];
    const dependencies = mapTiles.dependencies;
    const originalPossibilities = mapTiles.possibilities.length;
    mapTiles.possibilities = getPossibleTiles(map, x, y, mapTiles, callbackEvent);
    mapTiles.sides = {
        top: new Set(mapTiles.possibilities.map((tile) => tile.top)),
        right: new Set(mapTiles.possibilities.map((tile) => tile.right)),
        bottom: new Set(mapTiles.possibilities.map((tile) => tile.bottom)),
        left: new Set(mapTiles.possibilities.map((tile) => tile.left)),
    };

    for (const dependency of dependencies) {
        dependency.hasChanged = false;
        if (originalPossibilities !== mapTiles.possibilities.length) dependency.reverse.hasChanged = true;
    }

    for (const dependency of dependencies) {
        if (map.tiles[dependency.y][dependency.x].collapsed) continue;
        if (!map.tiles[dependency.y][dependency.x].dependencies.reduce((val, cur) => val || cur.hasChanged, false))
            continue;
        propagateThroughTiles(map, dependency.x, dependency.y, callbackEvent);
    }
};

// this function doesn't check if the limitation leaves a tile without possibilities
const limitTilePossibilities = (
    map: Map,
    x: number,
    y: number,
    tileList: Tile[],
    callbackEvent?: CallbackEvent
): void => {
    const possibleTiles = map.tiles[y][x].possibilities;

    // remove all tiles that can't be in this position
    const filteredTileList = tileList.filter((tile) => possibleTiles.find((t) => t === tile));

    // check if the tile can be collapsed to the given tile
    map.tiles[y][x].possibilities = filteredTileList;
    map.tiles[y][x].sides = {
        top: new Set(filteredTileList.map((tile) => tile.top)),
        right: new Set(filteredTileList.map((tile) => tile.right)),
        bottom: new Set(filteredTileList.map((tile) => tile.bottom)),
        left: new Set(filteredTileList.map((tile) => tile.left)),
    };
    if (filteredTileList.length === 1) map.tiles[y][x].collapsed = true;

    for (const dependency of map.tiles[y][x].dependencies) dependency.reverse.hasChanged = true;

    propagateThroughTiles(map, x, y, callbackEvent);
};

// collapse a single coordinate to a specific tile
const collapse = (map: Map, x: number, y: number, tile: Tile, callbackEvent?: CallbackEvent): void => {
    limitTilePossibilities(map, x, y, [tile], callbackEvent);
};

const fullCollapse = (map: Map, callbackEvent?: CallbackEvent): void => {
    while (true) {
        const mapTiles = map.tiles
            .flat()
            .filter((tile) => !tile.collapsed)
            .sort((a, b) => a.possibilities.length - b.possibilities.length);

        if (mapTiles.length === 0) break;
        const tileToCollapse = mapTiles[0];
        if (tileToCollapse.possibilities.length === 0) throw new Error('No possible tiles left');
        collapse(
            map,
            tileToCollapse.x,
            tileToCollapse.y,
            tileToCollapse.possibilities[(Math.random() * tileToCollapse.possibilities.length) | 0],
            callbackEvent
        );
    }
    callbackEvent && callbackEvent({ type: 'event1', x: -1, y: -1 });
};

export { collapse, limitTilePossibilities, fullCollapse, printMap, createMap };
