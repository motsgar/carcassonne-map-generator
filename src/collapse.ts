const mapWidth = 10;
const mapHeight = 6;

enum Side {
    Startpeice,
    Water,
    Field,
    Road,
    City,
}

type Tile = {
    top: Side;
    right: Side;
    bottom: Side;
    left: Side;
};

type Dependency = {
    reverse: Dependency;
    hasChanged: boolean;
    x: number;
    y: number;
};

type MapTile = {
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

// temporarily manually create list of possible tiles
const tiles: Tile[] = [];
tiles.push({ top: Side.Field, right: Side.City, bottom: Side.City, left: Side.Road });
tiles.push({ top: Side.Field, right: Side.Field, bottom: Side.Field, left: Side.Field });
tiles.push({ top: Side.City, right: Side.Field, bottom: Side.Road, left: Side.Field });
tiles.push({ top: Side.Road, right: Side.Road, bottom: Side.Road, left: Side.Field });
tiles.push({ top: Side.City, right: Side.Field, bottom: Side.Field, left: Side.Road });

// create all possible orientations of a tile
const originalTilesLength = tiles.length;
for (let i = 0; i < originalTilesLength; i++) {
    const tile = tiles[i];
    tiles.push({ top: tile.left, right: tile.top, bottom: tile.right, left: tile.bottom });
    tiles.push({ top: tile.bottom, right: tile.left, bottom: tile.top, left: tile.right });
    tiles.push({ top: tile.right, right: tile.bottom, bottom: tile.left, left: tile.top });
}

// create 2d map of tiles and initialize every position with all possible tiles
const map: MapTile[][] = Array.from(Array(mapHeight), () =>
    new Array(mapWidth).fill(undefined).map(() => ({
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
);

for (let y = 0; y < mapHeight; y++) {
    for (let x = 0; x < mapWidth; x++) {
        map[y][x].x = x;
        map[y][x].y = y;
    }
}

// fill the dependencies of a tile with all tiles that depend on it (currently only the tiles next to it)
for (let y = 0; y < mapHeight; y++) {
    for (let x = 0; x < mapWidth; x++) {
        if (x > 0) {
            map[y][x].dependencies.push({ x: x - 1, y, hasChanged: false } as Dependency); // breaking the type system temporarily because reverse has to be set later
        }
        if (x < mapWidth - 1) {
            map[y][x].dependencies.push({ x: x + 1, y, hasChanged: false } as Dependency);
        }
        if (y > 0) {
            map[y][x].dependencies.push({ x, y: y - 1, hasChanged: false } as Dependency);
        }
        if (y < mapHeight - 1) {
            map[y][x].dependencies.push({ x, y: y + 1, hasChanged: false } as Dependency);
        }
    }
}
for (let y = 0; y < mapHeight; y++) {
    for (let x = 0; x < mapWidth; x++) {
        for (const dependency of map[y][x].dependencies) {
            dependency.reverse = map[dependency.y][dependency.x].dependencies.find((d) => d.x === x && d.y === y); // set the reverse dependency that was broken earlier
        }
    }
}

const printMap = (mapToPrint: MapTile[][]): void => {
    let outputString = '';
    outputString += '┏' + '━━━━━━┳'.repeat(mapWidth - 1) + '━━━━━━┓\n';
    for (let y = 0; y < mapHeight; y++) {
        outputString += '┃';
        for (let x = 0; x < mapWidth; x++) {
            const tile = mapToPrint[y][x];
            if (tile.collapsed) outputString += '  ' + tile.sides.top.values().next().value + '   ';
            else outputString += '  -   ';
            outputString += '┃';
        }

        outputString += '\n┃';
        for (let x = 0; x < mapWidth; x++) {
            const tile = mapToPrint[y][x];
            if (tile.collapsed)
                outputString +=
                    tile.sides.left.values().next().value + ' ' + '# ' + ' ' + tile.sides.right.values().next().value;
            else outputString += '- ' + tile.possibilities.length.toString().padEnd(2) + ' -';
            outputString += '┃';
        }
        outputString += '\n┃';
        for (let x = 0; x < mapWidth; x++) {
            const tile = mapToPrint[y][x];
            if (tile.collapsed) outputString += '  ' + tile.sides.bottom.values().next().value + '   ';
            else outputString += '  -   ';
            outputString += '┃';
        }

        if (y < mapHeight - 1) outputString += '\n┣' + '━━━━━━╋'.repeat(mapWidth - 1) + '━━━━━━┫\n';
    }
    outputString += '\n┗' + '━━━━━━┻'.repeat(mapWidth - 1) + '━━━━━━┛';
    console.log(outputString);
};

// checks a single coordinate for all possible tiles that fit the given sides
const getPossibleTiles = (x: number, y: number, tileWithPossibilities: MapTile): Tile[] => {
    const filteredTiles = [];

    for (const tile of tileWithPossibilities.possibilities) {
        if (x > 0 && !map[y][x - 1].sides.right.has(tile.left)) continue;
        if (x < mapWidth - 1 && !map[y][x + 1].sides.left.has(tile.right)) continue;
        if (y > 0 && !map[y - 1][x].sides.bottom.has(tile.top)) continue;
        if (y < mapHeight - 1 && !map[y + 1][x].sides.top.has(tile.bottom)) continue;

        filteredTiles.push(tile);
    }

    return filteredTiles;
};

// function to be called recursively to calculate the possible tiles for a given coordinate
const propagateThroughTiles = (x: number, y: number, editableMap: MapTile[][]): void => {
    const mapTile = editableMap[y][x];
    const dependencies = mapTile.dependencies;
    const originalPossibilities = mapTile.possibilities.length;
    mapTile.possibilities = getPossibleTiles(x, y, mapTile);
    mapTile.sides = {
        top: new Set(mapTile.possibilities.map((tile) => tile.top)),
        right: new Set(mapTile.possibilities.map((tile) => tile.right)),
        bottom: new Set(mapTile.possibilities.map((tile) => tile.bottom)),
        left: new Set(mapTile.possibilities.map((tile) => tile.left)),
    };

    for (const dependency of dependencies) {
        dependency.hasChanged = false;
        if (originalPossibilities !== mapTile.possibilities.length) dependency.reverse.hasChanged = true;
    }

    for (const dependency of dependencies) {
        if (map[dependency.y][dependency.x].collapsed) continue;
        if (!map[dependency.y][dependency.x].dependencies.reduce((val, cur) => val || cur.hasChanged, false)) continue;
        propagateThroughTiles(dependency.x, dependency.y, editableMap);
    }
};

// collapse a single coordinate to a specific tile
const collapse = (x: number, y: number, tile: Tile): void => {
    const possibleTiles = map[y][x].possibilities;
    // check if the tile can be collapsed to the given tile
    if (possibleTiles.find((t) => t === tile)) {
        map[y][x].possibilities = [tile];
        map[y][x].sides = {
            top: new Set([tile.top]),
            right: new Set([tile.right]),
            bottom: new Set([tile.bottom]),
            left: new Set([tile.left]),
        };
        map[y][x].collapsed = true;
        for (const dependency of map[y][x].dependencies) dependency.reverse.hasChanged = true;
        propagateThroughTiles(x, y, map);
    }
};
console.log('empty map:');
printMap(map);
// manually collapse a few tiles for testing purposes
collapse(1, 1, tiles[0]);
collapse(3, 1, tiles[1]);
collapse(5, 1, tiles[2]);
collapse(2, 2, tiles[3]);
collapse(4, 0, tiles[7]);
collapse(0, 1, tiles[6]);

console.log('map after manual collapses:');
printMap(map);

console.time('time for full collapse');

while (true) {
    const mapTiles = map
        .flat()
        .filter((tile) => !tile.collapsed)
        .sort((a, b) => a.possibilities.length - b.possibilities.length);

    if (mapTiles.length === 0) break;
    const tileToCollapse = mapTiles[0];
    collapse(
        tileToCollapse.x,
        tileToCollapse.y,
        tileToCollapse.possibilities[(Math.random() * tileToCollapse.possibilities.length) | 0]
    );
}
console.timeEnd('time for full collapse');
console.log('map after full collapse:');
printMap(map);
