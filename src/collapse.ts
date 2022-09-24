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

const tiles: Tile[] = [];
const map: Tile[][] = Array.from(Array(mapWidth), () => new Array(mapHeight));

const getPossibleTiles = (x: number, y: number): Tile[] => {
    if (map[y][x]) return [];

    const filteredTiles = tiles
        .filter((tile) => (y >= 1 ? (map[y - 1][x] !== undefined ? tile.top === map[y - 1][x].bottom : true) : true))
        .filter((tile) =>
            x < map[0].length - 1 ? (map[y][x + 1] !== undefined ? tile.right === map[y][x + 1].left : true) : true
        )
        .filter((tile) =>
            y < map.length - 1 ? (map[y + 1][x] !== undefined ? tile.bottom === map[y + 1][x].top : true) : true
        )
        .filter((tile) => (x >= 1 ? (map[y][x - 1] !== undefined ? tile.left === map[y][x - 1].right : true) : true));
    return filteredTiles;
};

const printMap = (): void => {
    let outputString = '';
    outputString += '┏' + '━━━━━━┳'.repeat(mapWidth - 1) + '━━━━━━┓\n';
    for (let y = 0; y < mapHeight; y++) {
        outputString += '┃';
        for (let x = 0; x < mapWidth; x++) {
            const tile = map[y][x];
            if (tile) outputString += '  ' + tile.top + '   ';
            else outputString += '  -   ';
            outputString += '┃';
        }
        outputString += '\n┃';
        for (let x = 0; x < mapWidth; x++) {
            const tile = map[y][x];
            if (tile) outputString += tile.left + ' ' + '# ' + ' ' + tile.right;
            else outputString += '- ' + getPossibleTiles(x, y).length.toString().padEnd(2) + ' -';
            outputString += '┃';
        }
        outputString += '\n┃';
        for (let x = 0; x < mapWidth; x++) {
            const tile = map[y][x];
            if (tile) outputString += '  ' + tile.bottom + '   ';
            else outputString += '  -   ';
            outputString += '┃';
        }
        if (y < mapHeight - 1) outputString += '\n┣' + '━━━━━━╋'.repeat(mapWidth - 1) + '━━━━━━┫\n';
    }
    outputString += '\n┗' + '━━━━━━┻'.repeat(mapWidth - 1) + '━━━━━━┛';
    console.log(outputString);
};

tiles.push({ top: Side.Field, right: Side.City, bottom: Side.City, left: Side.Road });
tiles.push({ top: Side.Field, right: Side.Field, bottom: Side.Field, left: Side.Field });
tiles.push({ top: Side.City, right: Side.Field, bottom: Side.Road, left: Side.Field });
tiles.push({ top: Side.Road, right: Side.Road, bottom: Side.Road, left: Side.Field });

// create all possible orientations of a tile
const originalTilesLength = tiles.length;
for (let i = 0; i < originalTilesLength; i++) {
    const tile = tiles[i];
    tiles.push({ top: tile.left, right: tile.top, bottom: tile.right, left: tile.bottom });
    tiles.push({ top: tile.bottom, right: tile.left, bottom: tile.top, left: tile.right });
    tiles.push({ top: tile.right, right: tile.bottom, bottom: tile.left, left: tile.top });
}

map[1][1] = tiles[0];
map[1][3] = tiles[1];
map[1][5] = tiles[2];
map[2][2] = tiles[3];

printMap();
