import { CarcassonneMap, MapCell } from './collapse';
import { Maze, MazeCell, Wall } from './maze';
import { Direction, TilemapData } from './utils';

type Highlight = {
    x: number;
    y: number;
    color: string;
    currentDecay: number;
    maxDecay: number;
};

const appCanvasElement = document.getElementById('app-canvas') as HTMLCanvasElement;
const appCtx = appCanvasElement.getContext('2d')!; // eslint-disable-line @typescript-eslint/no-non-null-assertion

let mazeWallThickness = 0;

let zoomLevel = 50;
const zoomSpeed = 2000;
let cameraPosX = 8;
let cameraPosY = 8;

let lastDrawTime = Date.now();

const highlights: Highlight[] = [];

let currentMaze: Maze | undefined = undefined;
let currentPath: MazeCell[] = [];
let currentWalls: Wall[] = [];

let currentTilemap: { image: HTMLImageElement; tilemapData: TilemapData } | undefined = undefined;
let currentCarcassonneMap: CarcassonneMap | undefined = undefined;

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

const highlightCell = (x: number, y: number, decayTime: number): void => {
    highlights.push({
        x,
        y,
        color: '#00ff00',
        currentDecay: 0,
        maxDecay: decayTime,
    });
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

const drawCell = (cell: MapCell, x: number, y: number, xoffset: number, yoffset: number): void => {
    if (currentTilemap === undefined) return;

    const cellTile = cell.possibleTiles[0];
    if (cellTile) {
        appCtx.save();
        appCtx.translate(Math.floor(x) + xoffset / 2, Math.floor(y) + yoffset / 2);
        let rotatedXoffset = xoffset;
        let rotatedYoffset = yoffset;
        switch (cellTile.direction) {
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
            (cellTile.tilemapIndex % currentTilemap.tilemapData.width) * currentTilemap.tilemapData.tileSize,
            Math.floor(cellTile.tilemapIndex / currentTilemap.tilemapData.width) * currentTilemap.tilemapData.tileSize,
            currentTilemap.tilemapData.tileSize,
            currentTilemap.tilemapData.tileSize,
            -rotatedXoffset / 2,
            -rotatedYoffset / 2,
            rotatedXoffset,
            rotatedYoffset
        );
        appCtx.restore();
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
                    appCtx.fillStyle = '#ffffff';
                    shouldDrawBackground = true;
                }
                if (shouldDrawBackground)
                    appCtx.fillRect(
                        Math.floor(pos.x) + Math.floor(mazeWallThickness / 2),
                        Math.floor(pos.y) + Math.floor(mazeWallThickness / 2),
                        Math.floor(posOffset.x) - mazeWallThickness,
                        Math.floor(posOffset.y) - mazeWallThickness
                    );

                if (shouldDrawArrow) drawArrow(pos.x + posOffset.x / 2, pos.y + posOffset.y / 2, tile.solverDirection);

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

        for (let i = 0; i < highlights.length; i++) {
            const highlight = highlights[i];
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
                highlights.splice(i, 1);
                i--;
            }
        }
    }

    if (currentCarcassonneMap !== undefined) {
        for (const row of currentCarcassonneMap.cells) {
            for (const cell of row) {
                if (!cell.collapsed) continue;

                const pos = getPosOnCanvas({ x: cell.x, y: cell.y });
                const posOffset = getPosOnCanvas({ x: cell.x + 1, y: cell.y + 1 });
                posOffset.x = Math.floor(posOffset.x) - Math.floor(pos.x);
                posOffset.y = Math.floor(posOffset.y) - Math.floor(pos.y);

                drawCell(cell, pos.x, pos.y, posOffset.x, posOffset.y);
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

export { setMaze, highlightCell, setCurrentPath, setCurrentTilemap, setCurrentCarcassonneMap, setWallThickness };
