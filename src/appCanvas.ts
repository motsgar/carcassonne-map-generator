import { Maze } from './maze';

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

const draw = (): void => {
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
            }
        }
        appCtx.fillStyle = '#000000';

        appCtx.beginPath();
        const startPos = getPosOnCanvas({ x: 0, y: 0 });
        appCtx.fillRect(Math.floor(startPos.x), Math.floor(startPos.y), Math.ceil(zoomLevel * _maze.width), 1);
        appCtx.fillRect(Math.floor(startPos.x), Math.floor(startPos.y), 1, Math.ceil(zoomLevel * _maze.height));
        appCtx.stroke();
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

export { setMaze };
