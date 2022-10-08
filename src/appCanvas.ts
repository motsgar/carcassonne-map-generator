const appCanvasElement = document.getElementById('app-canvas') as HTMLCanvasElement;
const appCtx = appCanvasElement.getContext('2d')!; // eslint-disable-line @typescript-eslint/no-non-null-assertion

let zoomLevel = 1;
const zoomSpeed = 2000;
let cameraPosX = 0;
let cameraPosY = 0;

const line = {
    x0: 0,
    x1: 0,
    y0: 10,
    y1: 100,
};

const line2 = {
    x0: 10,
    x1: 100,
    y0: 0,
    y1: 0,
};

const getPosOnCanvas = (pos: { x: number; y: number }): { x: number; y: number } => {
    return {
        x: (pos.x - cameraPosX) * zoomLevel + appCanvasElement.width / 2,
        y: appCanvasElement.height - ((pos.y - cameraPosY) * zoomLevel + appCanvasElement.height / 2),
    };
};

const draw = (): void => {
    appCtx.clearRect(0, 0, appCanvasElement.width, appCanvasElement.height);

    appCtx.lineWidth = 2;
    appCtx.strokeStyle = 'black';
    appCtx.beginPath();
    const pos = getPosOnCanvas({ x: line.x0, y: line.y0 });
    const pos2 = getPosOnCanvas({ x: line.x1, y: line.y1 });
    appCtx.moveTo(pos.x, pos.y);
    appCtx.lineTo(pos2.x, pos2.y);
    appCtx.stroke();

    appCtx.beginPath();
    const pos3 = getPosOnCanvas({ x: line2.x0, y: line2.y0 });
    const pos4 = getPosOnCanvas({ x: line2.x1, y: line2.y1 });
    appCtx.moveTo(pos3.x, pos3.y);
    appCtx.lineTo(pos4.x, pos4.y);
    appCtx.stroke();

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
    cameraPosY -= multY;
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
    cameraPosY += deltaY / zoomLevel;
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
