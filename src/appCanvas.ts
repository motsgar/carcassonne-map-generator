import { Direction, Maze } from './maze';

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
};

type Highlight = {
    x: number;
    y: number;
    color: string;
    currentDecay: number;
    maxDecay: number;
};

const highlights: Highlight[] = [];

const highlightCell = (x: number, y: number): void => {
    highlights.push({
        x,
        y,
        color: '#00ff00',
        currentDecay: 0,
        maxDecay: 1,
    });
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
        for (const row of _maze.tiles) {
            for (const tile of row) {
                const pos = getPosOnCanvas({ x: tile.x, y: tile.y });
                if (!tile.isMaze) {
                    appCtx.fillStyle = '#999999';
                    appCtx.fillRect(
                        Math.floor(pos.x + 1),
                        Math.floor(pos.y + 1),
                        Math.floor(zoomLevel),
                        Math.floor(zoomLevel)
                    );
                }
                appCtx.fillStyle = '#000000';

                if (!tile.walls.right.open)
                    appCtx.fillRect(Math.floor(pos.x + zoomLevel), Math.floor(pos.y), 1, Math.ceil(zoomLevel));

                if (!tile.walls.bottom.open)
                    appCtx.fillRect(Math.floor(pos.x), Math.floor(pos.y + zoomLevel), Math.ceil(zoomLevel), 1);

                drawArrow(pos.x + zoomLevel / 2, pos.y + zoomLevel / 2, tile.solverDirection);
            }
        }
        appCtx.fillStyle = '#000000';

        appCtx.beginPath();
        const startPos = getPosOnCanvas({ x: 0, y: 0 });
        appCtx.fillRect(Math.floor(startPos.x), Math.floor(startPos.y), Math.ceil(zoomLevel * _maze.width), 1);
        appCtx.fillRect(Math.floor(startPos.x), Math.floor(startPos.y), 1, Math.ceil(zoomLevel * _maze.height));
        appCtx.stroke();
    }

    for (let i = 0; i < highlights.length; i++) {
        const highlight = highlights[i];
        const pos = getPosOnCanvas({ x: highlight.x, y: highlight.y });
        appCtx.fillStyle =
            highlight.color +
            Math.floor((1 - highlight.currentDecay / highlight.maxDecay) * 255)
                .toString(16)
                .padStart(2, '0');
        appCtx.fillRect(Math.floor(pos.x + 1), Math.floor(pos.y + 1), Math.floor(zoomLevel), Math.floor(zoomLevel));
        highlight.currentDecay += dt / 1000;
        if (highlight.currentDecay >= highlight.maxDecay) {
            highlights.splice(i, 1);
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
    const deltaY = e.deltaY;

    zoomLevel -= (deltaY / zoomSpeed) * zoomLevel;
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

export { setMaze, highlightCell };
