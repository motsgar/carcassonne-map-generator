import { Direction, Maze, MazeCell, Wall } from './maze';

const appCanvasElement = document.getElementById('app-canvas') as HTMLCanvasElement;
const appCtx = appCanvasElement.getContext('2d')!; // eslint-disable-line @typescript-eslint/no-non-null-assertion

let zoomLevel = 50;
const zoomSpeed = 2000;
let cameraPosX = 8;
let cameraPosY = 8;

const getPosOnCanvas = (pos: { x: number; y: number }): { x: number; y: number } => {
    return {
        x: (pos.x - cameraPosX) * zoomLevel + appCanvasElement.width / 2,
        y: (pos.y - cameraPosY) * zoomLevel + appCanvasElement.height / 2,
    };
};

let _maze: Maze | undefined = undefined;

const setMaze = (maze: Maze): void => {
    _maze = maze;
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

type Highlight = {
    x: number;
    y: number;
    color: string;
    currentDecay: number;
    maxDecay: number;
};

const highlights: Highlight[] = [];

const highlightCell = (x: number, y: number, decayTime: number): void => {
    highlights.push({
        x,
        y,
        color: '#00ff00',
        currentDecay: 0,
        maxDecay: decayTime,
    });
};

let _currentPath: MazeCell[] = [];
let _currentWalls: Wall[] = [];

const setCurrentPath = (path: { cells: MazeCell[]; walls: Wall[] }): void => {
    _currentPath = path.cells;
    _currentWalls = path.walls;
};

let lastDrawTime = Date.now();

const draw = (): void => {
    const currentTime = Date.now();
    const dt = Date.now() - lastDrawTime;
    lastDrawTime = currentTime;

    appCtx.clearRect(0, 0, appCanvasElement.width, appCanvasElement.height);

    appCtx.lineWidth = 1;
    appCtx.strokeStyle = 'black';

    if (_maze) {
        const leftTopPos = getPosOnCanvas({ x: 0, y: 0 });
        const rightBottomPos = getPosOnCanvas({ x: _maze.width, y: _maze.height });

        appCtx.fillStyle = '#999999';
        appCtx.fillRect(leftTopPos.x, leftTopPos.y, rightBottomPos.x - leftTopPos.x, rightBottomPos.y - leftTopPos.y);

        appCtx.fillStyle = '#000000';
        for (let x = 0; x <= _maze.width; x++) {
            const pos = getPosOnCanvas({ x, y: 0 });
            appCtx.fillRect(
                Math.floor(pos.x),
                Math.floor(leftTopPos.y),
                2,
                Math.floor(rightBottomPos.y) - Math.floor(leftTopPos.y) + 2
            );
        }
        for (let y = 0; y <= _maze.height; y++) {
            const pos = getPosOnCanvas({ x: 0, y });
            appCtx.fillRect(
                Math.floor(leftTopPos.x),
                Math.floor(pos.y),
                Math.floor(rightBottomPos.x) - Math.floor(leftTopPos.x) + 2,
                2
            );
        }

        for (const row of _maze.tiles) {
            for (const tile of row) {
                const pos = getPosOnCanvas({ x: tile.x, y: tile.y });
                const posOffset = getPosOnCanvas({ x: tile.x + 1, y: tile.y + 1 });
                posOffset.x = Math.floor(posOffset.x) - Math.floor(pos.x);
                posOffset.y = Math.floor(posOffset.y) - Math.floor(pos.y);

                let shouldDrawArrow = false;
                let shouldDrawBackground = false;
                if (_currentPath.includes(tile)) {
                    if (!tile.isMaze) shouldDrawArrow = true;
                    appCtx.fillStyle = '#aaffaa';
                    shouldDrawBackground = true;
                } else if (tile.isMaze) {
                    appCtx.fillStyle = '#ffffff';
                    shouldDrawBackground = true;
                }
                if (shouldDrawBackground)
                    appCtx.fillRect(
                        Math.floor(pos.x) + 2,
                        Math.floor(pos.y) + 2,
                        Math.floor(posOffset.x) - 2,
                        Math.floor(posOffset.y) - 2
                    );

                if (shouldDrawArrow)
                    drawArrow(pos.x + posOffset.x / 2 + 1, pos.y + posOffset.y / 2 + 1, tile.solverDirection);

                if (tile.walls.right.open || _currentWalls.includes(tile.walls.right)) {
                    appCtx.fillRect(
                        Math.floor(pos.x + posOffset.x),
                        Math.floor(pos.y) + 2,
                        2,
                        Math.floor(posOffset.y) - 2
                    );
                }
                if (tile.walls.bottom.open || _currentWalls.includes(tile.walls.bottom)) {
                    appCtx.fillRect(
                        Math.floor(pos.x) + 2,
                        Math.floor(pos.y + posOffset.y),
                        Math.floor(posOffset.x) - 2,
                        2
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
                Math.floor(pos.x) + 2,
                Math.floor(pos.y) + 2,
                Math.floor(posOffset.x) - 2,
                Math.floor(posOffset.y) - 2
            );

            if (
                _currentWalls.includes(_maze.tiles[highlight.y]?.[highlight.x]?.walls.right) ||
                _maze.tiles[highlight.y]?.[highlight.x]?.walls.right.open
            ) {
                appCtx.fillRect(Math.floor(pos.x + posOffset.x), Math.floor(pos.y) + 2, 2, Math.floor(posOffset.y) - 2);
            }
            if (
                _currentWalls.includes(_maze.tiles[highlight.y]?.[highlight.x]?.walls.bottom) ||
                _maze.tiles[highlight.y]?.[highlight.x]?.walls.bottom.open
            ) {
                appCtx.fillRect(Math.floor(pos.x) + 2, Math.floor(pos.y + posOffset.y), Math.floor(posOffset.x) - 2, 2);
            }

            highlight.currentDecay += dt / 1000;
            if (highlight.currentDecay >= highlight.maxDecay) {
                highlights.splice(i, 1);
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

export { setMaze, highlightCell, setCurrentPath };
