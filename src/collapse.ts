const mapWidth = 7;
const mapHeight = 5;

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

type TileWithPossibilities = {
    possibilities: Tile[];
    collapsed: boolean;
    possibilitiesChanged: boolean;
    entropyChecked: boolean;
    sides: {
        top: Set<Side>;
        right: Set<Side>;
        bottom: Set<Side>;
        left: Set<Side>;
    };
};

// lookup table for every x and y coordinate of the map to say which tiles are dependent on the tile in that position
// for now it just contains all tiles next to that tile. Might allow for more complex dependencies later
const dependencyList: { x: number; y: number }[][][] = Array.from(Array(mapWidth), () => new Array(mapHeight));

for (let y = 0; y < mapHeight; y++) {
    for (let x = 0; x < mapWidth; x++) {
        dependencyList[y][x] = [];
        if (x > 0) {
            dependencyList[y][x].push({ x: x - 1, y });
        }
        if (x < mapWidth - 1) {
            dependencyList[y][x].push({ x: x + 1, y });
        }
        if (y > 0) {
            dependencyList[y][x].push({ x, y: y - 1 });
        }
        if (y < mapHeight - 1) {
            dependencyList[y][x].push({ x, y: y + 1 });
        }
    }
}

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

const map: TileWithPossibilities[][] = Array.from(Array(mapHeight), () =>
    new Array(mapWidth).fill(undefined).map(() => ({
        possibilities: tiles.slice(),
        possibilitiesChanged: true,
        collapsed: false,
        entropyChecked: false,
        sides: {
            top: new Set(tiles.map((tile) => tile.top)),
            right: new Set(tiles.map((tile) => tile.right)),
            bottom: new Set(tiles.map((tile) => tile.bottom)),
            left: new Set(tiles.map((tile) => tile.left)),
        },
    }))
);

const printMap = (mapToPrint: TileWithPossibilities[][]): void => {
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

const collapse = (x: number, y: number, tile: Tile): void => {
    const possibleTiles = map[y][x].possibilities;
    if (possibleTiles.find((t) => t === tile)) {
        map[y][x].possibilities = [tile];
        map[y][x].possibilitiesChanged = true;
        map[y][x].sides = {
            top: new Set([tile.top]),
            right: new Set([tile.right]),
            bottom: new Set([tile.bottom]),
            left: new Set([tile.left]),
        };
        map[y][x].collapsed = true;
    }
};

const getPossibleTiles = (x: number, y: number, tileWithPossibilities: TileWithPossibilities): Tile[] => {
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

const calculatePossibleTiles = (x: number, y: number, editableMap: TileWithPossibilities[][], depth = 0): Tile[] => {
    console.log(`depth: ${depth} calculatePossibleTiles`, x, y);
    const dependencies = dependencyList[y][x];
    const originalPossibilities = editableMap[y][x].possibilities;
    editableMap[y][x].possibilities = getPossibleTiles(x, y, editableMap[y][x]);
    editableMap[y][x].sides = {
        top: new Set(editableMap[y][x].possibilities.map((tile) => tile.top)),
        right: new Set(editableMap[y][x].possibilities.map((tile) => tile.right)),
        bottom: new Set(editableMap[y][x].possibilities.map((tile) => tile.bottom)),
        left: new Set(editableMap[y][x].possibilities.map((tile) => tile.left)),
    };

    if (originalPossibilities.length !== editableMap[y][x].possibilities.length)
        editableMap[y][x].possibilitiesChanged = true;
    else editableMap[y][x].possibilitiesChanged = false;

    console.log(
        `depth: ${depth} going through dependencies`,
        dependencies.map((dep) => `(${dep.x}, ${dep.y})`)
    );
    for (const dependency of dependencies) {
        if (map[dependency.y][dependency.x].collapsed) continue;
        console.log(`depth: ${depth} checking if dependency (x: ${dependency.x}, y: ${dependency.y}) has changed`);
        if (!editableMap[dependency.y][dependency.x].possibilitiesChanged) continue;
        calculatePossibleTiles(dependency.x, dependency.y, editableMap, depth + 1);
    }
    editableMap[y][x].entropyChecked = true;

    return [];
};

collapse(1, 1, tiles[0]);
collapse(3, 1, tiles[1]);
collapse(5, 1, tiles[2]);
collapse(2, 2, tiles[3]);
collapse(4, 0, tiles[7]);
collapse(0, 1, tiles[6]);

printMap(map);

calculatePossibleTiles(0, 0, map);

/*
for (let y = 0; y < mapHeight; y++) {
    for (let x = 0; x < mapWidth; x++) {
        if (map[y][x].collapsed || map[y][x].entropyChecked) continue;
        calculatePossibleTiles(x, y, map);
    }
}
*/
printMap(map);
