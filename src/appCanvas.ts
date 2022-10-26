import { CarcassonneMap, Side, Tile } from './collapse';
import controls from './controls';
import { Maze, MazeCell, Wall } from './maze';
import { Direction, getSleepMs, TilemapData } from './utils';

type Highlight = {
    x: number;
    y: number;
    color: string;
    currentDecay: number;
    maxDecay: number;
};

const sideColors = {
    [Side.Startpiece]: '#ff0000',
    [Side.Water]: '#0000ff',
    [Side.Field]: '#00bb55',
    [Side.Road]: '#ffffff',
    [Side.City]: '#cc8833',
};

const appCanvasElement = document.getElementById('app-canvas') as HTMLCanvasElement;
const appCtx = appCanvasElement.getContext('2d')!; // eslint-disable-line @typescript-eslint/no-non-null-assertion

let mazeWallThickness = 0;

let zoomLevel = 50;
const zoomSpeed = 2000;
let cameraPosX = 8;
let cameraPosY = 8;

let lastDrawTime = Date.now();

let shouldDrawMaze = true;
let shouldDrawMap = false;

const mazeHighlights: Highlight[] = [];
const mapHighlights: (
    | {
          type: 'edge';
          x: number;
          y: number;
          color: string;
          currentDecay: number;
          maxDecay: number;
          direction: Direction;
      }
    | {
          type: 'checkTile';
          x: number;
          y: number;
          color: string;
          currentDecay: number;
          maxDecay: number;
      }
)[] = [];

let currentMaze: Maze | undefined = undefined;
let currentPath: MazeCell[] = [];
let currentWalls: Wall[] = [];

let currentTilemap: { image: HTMLImageElement; tilemapData: TilemapData } | undefined = undefined;
let currentCarcassonneMap: CarcassonneMap | undefined = undefined;

const setShouldDrawMaze = (shouldDraw: boolean): void => {
    shouldDrawMaze = shouldDraw;
};

const setShouldDrawMap = (shouldDraw: boolean): void => {
    shouldDrawMap = shouldDraw;
};

const setWallThickness = (width: number): void => {
    mazeWallThickness = width;
};

const setMaze = (maze: Maze): void => {
    currentMaze = maze;
};

const setCurrentPath = (path: { cells: MazeCell[]; walls: Wall[] }): void => {
    currentPath = path.cells;
    currentWalls = path.walls;
};

const setCurrentTilemap = (tilemapImage: HTMLImageElement, tilemapData: TilemapData): void => {
    currentTilemap = {
        image: tilemapImage,
        tilemapData,
    };
};

const setCurrentCarcassonneMap = (carcassonneMap: CarcassonneMap): void => {
    currentCarcassonneMap = carcassonneMap;
};

const highlightMazeCell = (x: number, y: number, decayTime: number): void => {
    mazeHighlights.push({
        x,
        y,
        color: '#00ff00',
        currentDecay: 0,
        maxDecay: decayTime,
    });
};

type CurrentCheckingCell = {
    x: number;
    y: number;
    progress: number;
    checkingTile: Tile;
    checkedSides: {
        [key in Direction]: Side[];
    };
};

let currentCheckingCell: CurrentCheckingCell | undefined = undefined;

const highlightMapCellCheck = (x: number, y: number, direction: Direction, color: string, decayTime: number): void => {
    if (currentCheckingCell === undefined) return;

    mapHighlights.push({
        type: 'edge',
        x,
        y,
        color,
        currentDecay: 0,
        maxDecay: decayTime,
        direction,
    });
};

const checkMapCell = (x: number, y: number, checkingTile: Tile): void => {
    currentCheckingCell = {
        x,
        y,
        progress: 0,
        checkingTile,
        checkedSides: {
            [Direction.Up]: [],
            [Direction.Right]: [],
            [Direction.Down]: [],
            [Direction.Left]: [],
        },
    };
};

const updateCheckingCellTile = (checkingTile: Tile): void => {
    if (currentCheckingCell === undefined) return;

    currentCheckingCell.checkingTile = checkingTile;
    const decayTime = (getSleepMs(controls.animationSpeed, 0.1) - 100) / 1000;
    if (decayTime < 0) return;
    mapHighlights.push({
        type: 'checkTile',
        x: currentCheckingCell.x,
        y: currentCheckingCell.y,
        color: '#34ade0',
        currentDecay: 0,
        maxDecay: decayTime,
    });
};

const addCheckedSides = (checkingTile: Tile): void => {
    if (currentCheckingCell === undefined) return;

    const decayTime = (getSleepMs(controls.animationSpeed, 0.1) - 100) / 1000;

    if (!currentCheckingCell.checkedSides[Direction.Up].includes(checkingTile.top)) {
        currentCheckingCell.checkedSides[Direction.Up].push(checkingTile.top);
        currentCheckingCell.checkedSides[Direction.Up].sort();
        highlightMapCellCheck(currentCheckingCell.x, currentCheckingCell.y, Direction.Up, '#34ade0', decayTime);
    }
    if (!currentCheckingCell.checkedSides[Direction.Right].includes(checkingTile.right)) {
        currentCheckingCell.checkedSides[Direction.Right].push(checkingTile.right);
        currentCheckingCell.checkedSides[Direction.Right].sort();
        highlightMapCellCheck(currentCheckingCell.x, currentCheckingCell.y, Direction.Right, '#34ade0', decayTime);
    }
    if (!currentCheckingCell.checkedSides[Direction.Down].includes(checkingTile.bottom)) {
        currentCheckingCell.checkedSides[Direction.Down].push(checkingTile.bottom);
        currentCheckingCell.checkedSides[Direction.Down].sort();
        highlightMapCellCheck(currentCheckingCell.x, currentCheckingCell.y, Direction.Down, '#34ade0', decayTime);
    }
    if (!currentCheckingCell.checkedSides[Direction.Left].includes(checkingTile.left)) {
        currentCheckingCell.checkedSides[Direction.Left].push(checkingTile.left);
        currentCheckingCell.checkedSides[Direction.Left].sort();
        highlightMapCellCheck(currentCheckingCell.x, currentCheckingCell.y, Direction.Left, '#34ade0', decayTime);
    }
};

const updateCheckingCellProgress = (progress: number): void => {
    if (currentCheckingCell === undefined) return;

    currentCheckingCell.progress = progress;

    if (progress === 1) {
        currentCheckingCell = undefined;
    }
};

const getPosOnCanvas = (pos: { x: number; y: number }): { x: number; y: number } => {
    return {
        x: (pos.x - cameraPosX) * zoomLevel + appCanvasElement.width / 2,
        y: (pos.y - cameraPosY) * zoomLevel + appCanvasElement.height / 2,
    };
};

const drawArrow = (x: number, y: number, direction: Direction): void => {
    const oldStyle = appCtx.fillStyle;
    appCtx.fillStyle = '#ff0000';
    switch (direction) {
        case Direction.Up:
            appCtx.beginPath();
            appCtx.moveTo(Math.floor(x), Math.floor(y - zoomLevel / 3));
            appCtx.lineTo(Math.floor(x + zoomLevel / 4), Math.floor(y));
            appCtx.lineTo(Math.floor(x + zoomLevel / 13), Math.floor(y));
            appCtx.lineTo(Math.floor(x + zoomLevel / 13), Math.floor(y + zoomLevel / 3));
            appCtx.lineTo(Math.floor(x - zoomLevel / 13), Math.floor(y + zoomLevel / 3));
            appCtx.lineTo(Math.floor(x - zoomLevel / 13), Math.floor(y));
            appCtx.lineTo(Math.floor(x - zoomLevel / 4), Math.floor(y));
            appCtx.closePath();
            appCtx.fill();
            break;
        case Direction.Right:
            appCtx.beginPath();
            appCtx.moveTo(Math.floor(x + zoomLevel / 3), Math.floor(y));
            appCtx.lineTo(Math.floor(x), Math.floor(y - zoomLevel / 4));
            appCtx.lineTo(Math.floor(x), Math.floor(y - zoomLevel / 13));
            appCtx.lineTo(Math.floor(x - zoomLevel / 3), Math.floor(y - zoomLevel / 13));
            appCtx.lineTo(Math.floor(x - zoomLevel / 3), Math.floor(y + zoomLevel / 13));
            appCtx.lineTo(Math.floor(x), Math.floor(y + zoomLevel / 13));
            appCtx.lineTo(Math.floor(x), Math.floor(y + zoomLevel / 4));
            appCtx.closePath();
            appCtx.fill();
            break;
        case Direction.Down:
            appCtx.beginPath();
            appCtx.moveTo(Math.floor(x), Math.floor(y + zoomLevel / 3));
            appCtx.lineTo(Math.floor(x - zoomLevel / 4), Math.floor(y));
            appCtx.lineTo(Math.floor(x - zoomLevel / 13), Math.floor(y));
            appCtx.lineTo(Math.floor(x - zoomLevel / 13), Math.floor(y - zoomLevel / 3));
            appCtx.lineTo(Math.floor(x + zoomLevel / 13), Math.floor(y - zoomLevel / 3));
            appCtx.lineTo(Math.floor(x + zoomLevel / 13), Math.floor(y));
            appCtx.lineTo(Math.floor(x + zoomLevel / 4), Math.floor(y));
            appCtx.closePath();
            appCtx.fill();
            break;
        case Direction.Left:
            appCtx.beginPath();
            appCtx.moveTo(Math.floor(x - zoomLevel / 3), Math.floor(y));
            appCtx.lineTo(Math.floor(x), Math.floor(y + zoomLevel / 4));
            appCtx.lineTo(Math.floor(x), Math.floor(y + zoomLevel / 13));
            appCtx.lineTo(Math.floor(x + zoomLevel / 3), Math.floor(y + zoomLevel / 13));
            appCtx.lineTo(Math.floor(x + zoomLevel / 3), Math.floor(y - zoomLevel / 13));
            appCtx.lineTo(Math.floor(x), Math.floor(y - zoomLevel / 13));
            appCtx.lineTo(Math.floor(x), Math.floor(y - zoomLevel / 4));
            appCtx.closePath();
            appCtx.fill();
            break;
    }
    appCtx.fillStyle = oldStyle;
};

const drawCellImage = (
    x: number,
    y: number,
    xoffset: number,
    yoffset: number,
    direction: Direction,
    tilemapIndex: number
): void => {
    if (currentTilemap === undefined) return;

    appCtx.save();
    appCtx.translate(Math.floor(x) + xoffset / 2, Math.floor(y) + yoffset / 2);
    let rotatedXoffset = xoffset;
    let rotatedYoffset = yoffset;
    switch (direction) {
        case Direction.Up: {
            break;
        }
        case Direction.Right: {
            rotatedXoffset = yoffset;
            rotatedYoffset = xoffset;
            appCtx.rotate((90 * Math.PI) / 180);
            break;
        }
        case Direction.Down: {
            appCtx.rotate((180 * Math.PI) / 180);
            break;
        }
        case Direction.Left: {
            rotatedXoffset = yoffset;
            rotatedYoffset = xoffset;
            appCtx.rotate((270 * Math.PI) / 180);
            break;
        }
    }

    appCtx.drawImage(
        currentTilemap.image,
        (tilemapIndex % currentTilemap.tilemapData.width) * currentTilemap.tilemapData.tileSize,
        Math.floor(tilemapIndex / currentTilemap.tilemapData.width) * currentTilemap.tilemapData.tileSize,
        currentTilemap.tilemapData.tileSize,
        currentTilemap.tilemapData.tileSize,
        -rotatedXoffset / 2,
        -rotatedYoffset / 2,
        rotatedXoffset,
        rotatedYoffset
    );
    appCtx.restore();
};

const drawCellSides = (
    x: number,
    y: number,
    xoffset: number,
    yoffset: number,
    sides: CurrentCheckingCell['checkedSides']
): void => {
    const sideThickness = Math.max(Math.floor(zoomLevel / 15), 5);

    const areaWidth = xoffset - mazeWallThickness - sideThickness * 2;
    const areaHeight = yoffset - mazeWallThickness - sideThickness * 2;

    let sideIndex = 0;
    for (const side of sides[Direction.Up]) {
        appCtx.fillStyle = sideColors[side];
        appCtx.fillRect(
            Math.floor(x) +
                Math.floor((areaWidth / sides[Direction.Up].length) * sideIndex) +
                Math.floor(mazeWallThickness / 2) +
                sideThickness,
            Math.floor(y) + Math.floor(mazeWallThickness / 2),
            Math.ceil(areaWidth / sides[Direction.Up].length),
            sideThickness
        );
        sideIndex++;
    }
    sideIndex = 0;
    for (const side of sides[Direction.Right]) {
        appCtx.fillStyle = sideColors[side];
        appCtx.fillRect(
            Math.floor(x) + xoffset - Math.ceil(mazeWallThickness / 2),
            Math.floor(y) +
                Math.floor((areaHeight / sides[Direction.Right].length) * sideIndex) +
                Math.floor(mazeWallThickness / 2) +
                sideThickness,
            -sideThickness,
            Math.ceil(areaHeight / sides[Direction.Right].length)
        );
        sideIndex++;
    }
    sideIndex = 0;
    for (const side of sides[Direction.Down]) {
        appCtx.fillStyle = sideColors[side];
        appCtx.fillRect(
            Math.floor(x) +
                Math.floor((areaWidth / sides[Direction.Down].length) * sideIndex) +
                Math.floor(mazeWallThickness / 2) +
                sideThickness,
            Math.floor(y) + yoffset - Math.ceil(mazeWallThickness / 2),
            Math.ceil(areaWidth / sides[Direction.Down].length),
            -sideThickness
        );
        sideIndex++;
    }
    sideIndex = 0;
    for (const side of sides[Direction.Left]) {
        appCtx.fillStyle = sideColors[side];
        appCtx.fillRect(
            Math.floor(x) + Math.floor(mazeWallThickness / 2),
            Math.floor(y) +
                Math.floor((areaHeight / sides[Direction.Left].length) * sideIndex) +
                Math.floor(mazeWallThickness / 2) +
                sideThickness,
            sideThickness,
            Math.ceil(areaHeight / sides[Direction.Left].length)
        );
        sideIndex++;
    }
};

const draw = (): void => {
    const currentTime = Date.now();
    const dt = Date.now() - lastDrawTime;
    lastDrawTime = currentTime;

    appCtx.clearRect(0, 0, appCanvasElement.width, appCanvasElement.height);

    appCtx.lineWidth = 1;
    appCtx.strokeStyle = 'black';

    if (currentMaze !== undefined) {
        const leftTopPos = getPosOnCanvas({ x: 0, y: 0 });
        const rightBottomPos = getPosOnCanvas({ x: currentMaze.width, y: currentMaze.height });

        appCtx.fillStyle = '#999999';
        appCtx.fillRect(
            Math.floor(leftTopPos.x),
            Math.floor(leftTopPos.y),
            Math.floor(rightBottomPos.x) - Math.floor(leftTopPos.x),
            Math.floor(rightBottomPos.y) - Math.floor(leftTopPos.y)
        );

        appCtx.fillStyle = '#000000';
        for (let x = 0; x <= currentMaze.width; x++) {
            const pos = getPosOnCanvas({ x, y: 0 });
            appCtx.fillRect(
                Math.floor(pos.x) - Math.ceil(mazeWallThickness / 2),
                Math.floor(leftTopPos.y) - Math.ceil(mazeWallThickness / 2),
                mazeWallThickness,
                Math.floor(rightBottomPos.y) - Math.floor(leftTopPos.y) + mazeWallThickness
            );
        }
        for (let y = 0; y <= currentMaze.height; y++) {
            const pos = getPosOnCanvas({ x: 0, y });
            appCtx.fillRect(
                Math.floor(leftTopPos.x) - Math.ceil(mazeWallThickness / 2),
                Math.floor(pos.y) - Math.ceil(mazeWallThickness / 2),
                Math.floor(rightBottomPos.x) - Math.floor(leftTopPos.x) + mazeWallThickness,
                mazeWallThickness
            );
        }

        if (shouldDrawMaze) {
            for (const row of currentMaze.tiles) {
                for (const tile of row) {
                    const pos = getPosOnCanvas({ x: tile.x, y: tile.y });
                    const posOffset = getPosOnCanvas({ x: tile.x + 1, y: tile.y + 1 });
                    posOffset.x = Math.floor(posOffset.x) - Math.floor(pos.x);
                    posOffset.y = Math.floor(posOffset.y) - Math.floor(pos.y);

                    let shouldDrawArrow = false;
                    let shouldDrawBackground = false;
                    if (currentPath.includes(tile)) {
                        if (!tile.isMaze) shouldDrawArrow = true;
                        appCtx.fillStyle = '#aaffaa';
                        shouldDrawBackground = true;
                    } else if (tile.isMaze) {
                        appCtx.fillStyle = '#dddddd';
                        shouldDrawBackground = true;
                    }
                    if (shouldDrawBackground)
                        appCtx.fillRect(
                            Math.floor(pos.x) + Math.floor(mazeWallThickness / 2),
                            Math.floor(pos.y) + Math.floor(mazeWallThickness / 2),
                            Math.floor(posOffset.x) - mazeWallThickness,
                            Math.floor(posOffset.y) - mazeWallThickness
                        );

                    if (shouldDrawArrow)
                        drawArrow(pos.x + posOffset.x / 2, pos.y + posOffset.y / 2, tile.solverDirection);

                    if (tile.walls.right.open || currentWalls.includes(tile.walls.right)) {
                        appCtx.fillRect(
                            Math.floor(pos.x + posOffset.x) - Math.ceil(mazeWallThickness / 2),
                            Math.floor(pos.y) + Math.floor(mazeWallThickness / 2),
                            mazeWallThickness,
                            Math.floor(posOffset.y) - mazeWallThickness
                        );
                    }
                    if (tile.walls.bottom.open || currentWalls.includes(tile.walls.bottom)) {
                        appCtx.fillRect(
                            Math.floor(pos.x) + Math.floor(mazeWallThickness / 2),
                            Math.floor(pos.y + posOffset.y) - Math.ceil(mazeWallThickness / 2),
                            Math.floor(posOffset.x) - mazeWallThickness,
                            mazeWallThickness
                        );
                    }
                }
            }

            for (let i = 0; i < mazeHighlights.length; i++) {
                const highlight = mazeHighlights[i];
                const pos = getPosOnCanvas({ x: highlight.x, y: highlight.y });
                const posOffset = getPosOnCanvas({ x: highlight.x + 1, y: highlight.y + 1 });
                posOffset.x = Math.floor(posOffset.x) - Math.floor(pos.x);
                posOffset.y = Math.floor(posOffset.y) - Math.floor(pos.y);

                appCtx.fillStyle =
                    highlight.color +
                    Math.floor((1 - highlight.currentDecay / highlight.maxDecay) * 255)
                        .toString(16)
                        .padStart(2, '0');

                appCtx.fillRect(
                    Math.floor(pos.x) + Math.floor(mazeWallThickness / 2),
                    Math.floor(pos.y) + Math.floor(mazeWallThickness / 2),
                    Math.floor(posOffset.x) - mazeWallThickness,
                    Math.floor(posOffset.y) - mazeWallThickness
                );

                if (
                    currentWalls.includes(currentMaze.tiles[highlight.y]?.[highlight.x]?.walls.right) ||
                    currentMaze.tiles[highlight.y]?.[highlight.x]?.walls.right.open
                ) {
                    appCtx.fillRect(
                        Math.floor(pos.x + posOffset.x) - Math.ceil(mazeWallThickness / 2),
                        Math.floor(pos.y) + Math.floor(mazeWallThickness / 2),
                        Math.ceil(mazeWallThickness / 2),
                        Math.floor(posOffset.y) - mazeWallThickness
                    );
                }
                if (
                    currentWalls.includes(currentMaze.tiles[highlight.y]?.[highlight.x]?.walls.bottom) ||
                    currentMaze.tiles[highlight.y]?.[highlight.x]?.walls.bottom.open
                ) {
                    appCtx.fillRect(
                        Math.floor(pos.x) + Math.floor(mazeWallThickness / 2),
                        Math.floor(pos.y + posOffset.y) - Math.ceil(mazeWallThickness / 2),
                        Math.floor(posOffset.x) - mazeWallThickness,
                        Math.ceil(mazeWallThickness / 2)
                    );
                }
                if (
                    currentWalls.includes(currentMaze.tiles[highlight.y]?.[highlight.x]?.walls.left) ||
                    currentMaze.tiles[highlight.y]?.[highlight.x]?.walls.left.open
                ) {
                    appCtx.fillRect(
                        Math.floor(pos.x),
                        Math.floor(pos.y) + Math.floor(mazeWallThickness / 2),
                        Math.floor(mazeWallThickness / 2),
                        Math.floor(posOffset.y) - mazeWallThickness
                    );
                }
                if (
                    currentWalls.includes(currentMaze.tiles[highlight.y]?.[highlight.x]?.walls.top) ||
                    currentMaze.tiles[highlight.y]?.[highlight.x]?.walls.top.open
                ) {
                    appCtx.fillRect(
                        Math.floor(pos.x) + Math.floor(mazeWallThickness / 2),
                        Math.floor(pos.y),
                        Math.floor(posOffset.x) - mazeWallThickness,
                        Math.floor(mazeWallThickness / 2)
                    );
                }

                highlight.currentDecay += dt / 1000;
                if (highlight.currentDecay >= highlight.maxDecay) {
                    mazeHighlights.splice(i, 1);
                    i--;
                }
            }
        }
    }

    if (currentCarcassonneMap !== undefined && shouldDrawMap) {
        for (const row of currentCarcassonneMap.cells) {
            for (const cell of row) {
                if (cell.x === currentCheckingCell?.x && cell.y === currentCheckingCell?.y) continue;
                const pos = getPosOnCanvas({ x: cell.x, y: cell.y });
                const posOffset = getPosOnCanvas({ x: cell.x + 1, y: cell.y + 1 });
                posOffset.x = Math.floor(posOffset.x) - Math.floor(pos.x);
                posOffset.y = Math.floor(posOffset.y) - Math.floor(pos.y);

                const cellTile = cell.possibleTiles[0];
                if (cell.possibleTiles.length === 1) {
                    drawCellImage(pos.x, pos.y, posOffset.x, posOffset.y, cellTile.direction, cellTile.tilemapIndex);
                } else {
                    drawCellSides(pos.x, pos.y, posOffset.x, posOffset.y, {
                        [Direction.Up]: cell.sides[Direction.Up].sort(),
                        [Direction.Right]: cell.sides[Direction.Right].sort(),
                        [Direction.Down]: cell.sides[Direction.Down].sort(),
                        [Direction.Left]: cell.sides[Direction.Left].sort(),
                    });
                    appCtx.textAlign = 'center';
                    appCtx.textBaseline = 'middle';
                    appCtx.fillStyle = '#000000';
                    appCtx.font = 'bold ' + zoomLevel / 8 + 'px Arial';
                    appCtx.fillText(
                        cell.possibleTiles.length.toString(),
                        pos.x + posOffset.x / 2,
                        pos.y + posOffset.y / 2
                    );
                }
            }
        }

        const sideThickness = Math.max(Math.floor(zoomLevel / 15), 5);

        if (currentCheckingCell !== undefined) {
            const pos = getPosOnCanvas({ x: currentCheckingCell.x, y: currentCheckingCell.y });
            const posOffset = getPosOnCanvas({ x: currentCheckingCell.x + 1, y: currentCheckingCell.y + 1 });
            posOffset.x = Math.floor(posOffset.x) - Math.floor(pos.x);
            posOffset.y = Math.floor(posOffset.y) - Math.floor(pos.y);

            appCtx.fillStyle = '#9c2e1e';
            appCtx.fillRect(
                Math.floor(pos.x) + sideThickness + Math.floor(mazeWallThickness / 2),
                Math.floor(pos.y) + posOffset.y - sideThickness - Math.floor(mazeWallThickness / 2),
                posOffset.x - sideThickness * 2 - mazeWallThickness,
                -(posOffset.y - sideThickness * 2 - mazeWallThickness) * currentCheckingCell.progress
            );

            drawCellImage(
                Math.floor(pos.x) + sideThickness * 2 + Math.floor(mazeWallThickness / 2),
                Math.floor(pos.y) + sideThickness * 2 + Math.floor(mazeWallThickness / 2),
                posOffset.x - sideThickness * 4 - mazeWallThickness,
                posOffset.y - sideThickness * 4 - mazeWallThickness,
                currentCheckingCell.checkingTile.direction,
                currentCheckingCell.checkingTile.tilemapIndex
            );
            drawCellSides(pos.x, pos.y, posOffset.x, posOffset.y, currentCheckingCell.checkedSides);
        }

        for (let i = 0; i < mapHighlights.length; i++) {
            const highlight = mapHighlights[i];
            const pos = getPosOnCanvas({ x: highlight.x, y: highlight.y });
            const posOffset = getPosOnCanvas({ x: highlight.x + 1, y: highlight.y + 1 });
            posOffset.x = Math.floor(posOffset.x) - Math.floor(pos.x);
            posOffset.y = Math.floor(posOffset.y) - Math.floor(pos.y);

            appCtx.fillStyle =
                highlight.color +
                Math.floor((1 - highlight.currentDecay / highlight.maxDecay) * 255)
                    .toString(16)
                    .padStart(2, '0');

            switch (highlight.type) {
                case 'edge': {
                    switch (highlight.direction) {
                        case Direction.Up:
                            appCtx.fillRect(
                                Math.floor(pos.x) + Math.floor(mazeWallThickness / 2),
                                Math.floor(pos.y) + Math.floor(mazeWallThickness / 2),
                                Math.floor(posOffset.x) - mazeWallThickness,
                                sideThickness
                            );
                            break;
                        case Direction.Right:
                            appCtx.fillRect(
                                Math.floor(pos.x) + posOffset.x - Math.ceil(mazeWallThickness / 2),
                                Math.floor(pos.y) + Math.floor(mazeWallThickness / 2),
                                -sideThickness,
                                Math.floor(posOffset.y) - mazeWallThickness
                            );
                            break;
                        case Direction.Down:
                            appCtx.fillRect(
                                Math.floor(pos.x) + Math.floor(mazeWallThickness / 2),
                                Math.floor(pos.y) + posOffset.y - Math.ceil(mazeWallThickness / 2),
                                Math.floor(posOffset.x) - mazeWallThickness,
                                -sideThickness
                            );
                            break;
                        case Direction.Left:
                            appCtx.fillRect(
                                Math.floor(pos.x) + Math.floor(mazeWallThickness / 2),
                                Math.floor(pos.y) + Math.floor(mazeWallThickness / 2),
                                sideThickness,
                                Math.floor(posOffset.y) - mazeWallThickness
                            );
                            break;
                    }
                    break;
                }
                case 'checkTile': {
                    appCtx.fillRect(
                        pos.x + sideThickness * 2,
                        pos.y + sideThickness * 2,
                        posOffset.x - sideThickness * 4,
                        posOffset.y - sideThickness * 4
                    );
                }
            }

            highlight.currentDecay += dt / 1000;
            if (highlight.currentDecay >= highlight.maxDecay) {
                mapHighlights.splice(i, 1);
                i--;
            }
        }
    }

    window.requestAnimationFrame(draw);
};

const resizeCanvas = (): void => {
    appCanvasElement.width = window.innerWidth;
    appCanvasElement.height = window.innerHeight;
};

const zoomView = (e: WheelEvent): void => {
    e.preventDefault();
    let deltaY = e.deltaY;

    zoomLevel -= (deltaY / zoomSpeed) * zoomLevel;
    if (zoomLevel < 5) {
        deltaY = 0;
        zoomLevel = 5;
    } else if (zoomLevel > 1000) {
        zoomLevel = 1000;
        deltaY = 0;
    }
    const multX = ((e.clientX - appCanvasElement.width / 2) * -(deltaY / zoomSpeed)) / zoomLevel;
    const multY = ((e.clientY - appCanvasElement.height / 2) * -(deltaY / zoomSpeed)) / zoomLevel;

    cameraPosX += multX;
    cameraPosY += multY;
};

let latestX = 0;
let latestY = 0;

const moveView = (e: MouseEvent): void => {
    e.preventDefault();
    const deltaX = e.clientX - latestX;
    const deltaY = e.clientY - latestY;
    latestX = e.clientX;
    latestY = e.clientY;
    cameraPosX -= deltaX / zoomLevel;
    cameraPosY -= deltaY / zoomLevel;
};

const stopMoveView = (e: MouseEvent): void => {
    e.preventDefault();
    window.removeEventListener('mousemove', moveView);
    window.removeEventListener('mouseup', stopMoveView);
};

const initMove = (e: MouseEvent): void => {
    e.preventDefault();
    latestX = e.clientX;
    latestY = e.clientY;
    window.addEventListener('mousemove', moveView);
    window.addEventListener('mouseup', stopMoveView);
};

appCanvasElement.addEventListener('mousedown', initMove);
appCanvasElement.addEventListener('wheel', zoomView);

window.addEventListener('resize', resizeCanvas, false);

resizeCanvas();
draw();

export {
    setMaze,
    highlightMazeCell,
    setCurrentPath,
    setCurrentTilemap,
    setCurrentCarcassonneMap,
    setWallThickness,
    highlightMapCellCheck,
    checkMapCell,
    updateCheckingCellTile,
    updateCheckingCellProgress,
    setShouldDrawMaze,
    setShouldDrawMap,
    addCheckedSides,
};
