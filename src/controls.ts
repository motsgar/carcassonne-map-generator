import GUI from 'lil-gui';
import EventEmitter from 'events';

declare interface ControlEvent {
    emit(event: 'startAnimation'): boolean;
    emit(event: 'resetAnimation'): boolean;
    emit(event: 'animationSpeed', speed: number): boolean;
    emit(event: 'width', value: number): boolean;
    emit(event: 'height', value: number): boolean;
    emit(event: 'tilemapUpload', value: string): boolean;

    on(event: 'startAnimation', listener: () => void): this;
    on(event: 'resetAnimation', listener: () => void): this;
    on(event: 'animationSpeed', listener: (speed: number) => void): this;
    on(event: 'width', listener: (value: number) => void): this;
    on(event: 'height', listener: (value: number) => void): this;
    on(event: 'tilemapUpload', listener: (value: string) => void): this;
}

class ControlEvent extends EventEmitter {
    animationSpeed: number;
    width: number;
    height: number;

    constructor() {
        super();

        this.animationSpeed = 800;
        this.width = 60;
        this.height = 50;
    }
}

const controls = new ControlEvent();

const gui = new GUI();
const guiInfo = {
    'Start animation': () => {
        controls.emit('startAnimation');
    },
    'Reset animation': () => {
        controls.emit('resetAnimation');
    },
    'Animation speed': controls.animationSpeed,
    Width: controls.width,
    Height: controls.height,
    'Tilemap upload': () => {
        console.log('tilemap upload');
        // TODO: add file upload
        controls.emit('tilemapUpload', '{}');
    },
};

const startAnimationController = gui.add(guiInfo, 'Start animation');
gui.add(guiInfo, 'Reset animation');
gui.add(guiInfo, 'Animation speed', 1, 1000, 2).onChange((value: number) => {
    controls.animationSpeed = value;
    controls.emit('animationSpeed', value);
});
gui.add(guiInfo, 'Width').onFinishChange((value: number) => {
    controls.width = value;
    controls.emit('width', value);
});
gui.add(guiInfo, 'Height').onFinishChange((value: number) => {
    controls.height = value;
    controls.emit('height', value);
});
gui.add(guiInfo, 'Tilemap upload');

export const disableStartAnimation = (): void => {
    startAnimationController.disable();
};
export const enableStartAnimation = (): void => {
    startAnimationController.enable();
};

export default controls;
