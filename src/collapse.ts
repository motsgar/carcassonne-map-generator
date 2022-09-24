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

const printMap = (): void => {
    console.table(map);
};

const getPossibleTiles = (x: number, y: number): Tile[] => {
    // TMP x and y can't be on the edge of the map array.

    let filteredTiles = [...tiles];

    filteredTiles = filteredTiles
        .filter((tile) => (map[x][y - 1] !== undefined ? tile.top === map[x][y - 1].bottom : true))
        .filter((tile) => (map[x + 1][y] !== undefined ? tile.right === map[x + 1][y].left : true))
        .filter((tile) => (map[x][y + 1] !== undefined ? tile.bottom === map[x][y + 1].top : true))
        .filter((tile) => (map[x - 1][y] !== undefined ? tile.left === map[x - 1][y].right : true));
    return filteredTiles;
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

for (let y = 1; y < mapHeight - 1; y++) {
    for (let x = 1; x < mapWidth - 1; x++) {
        const possibleTiles = getPossibleTiles(x, y);
        console.log(possibleTiles);
    }
}
