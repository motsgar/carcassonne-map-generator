import GUI from 'lil-gui';
import EventEmitter from 'events';

const tilemapJsonInputElement = document.getElementById('tilemap-json-input') as HTMLInputElement;
const tilemapImageInputElement = document.getElementById('tilemap-image-input') as HTMLInputElement;

declare interface ControlEvent {
    emit(event: 'startAnimation'): boolean;
    emit(event: 'resetAnimation'): boolean;
    emit(event: 'animationSpeed', speed: number): boolean;
    emit(event: 'width', width: number): boolean;
    emit(event: 'height', height: number): boolean;
    emit(event: 'tilemapJsonUpload', tilemapJson: string): boolean;
    emit(event: 'tilemapImageUpload', image: HTMLImageElement | undefined): boolean;

    on(event: 'startAnimation', listener: () => void): this;
    on(event: 'resetAnimation', listener: () => void): this;
    on(event: 'animationSpeed', listener: (speed: number) => void): this;
    on(event: 'width', listener: (width: number) => void): this;
    on(event: 'height', listener: (height: number) => void): this;
    on(event: 'tilemapJsonUpload', listener: (tilemapJson: string) => void): this;
    on(event: 'tilemapImageUpload', listener: (image: HTMLImageElement | undefined) => void): this;
}

class ControlEvent extends EventEmitter {
    animationSpeed: number;
    width: number;
    height: number;

    constructor() {
        super();

        this.animationSpeed = 800;
        this.width = 20;
        this.height = 18;
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
    'Tilemap JSON upload': () => {
        tilemapJsonInputElement.click();
    },
    'Tilemap image upload': () => {
        tilemapImageInputElement.click();
    },
};

const startAnimationController = gui.add(guiInfo, 'Start animation');
gui.add(guiInfo, 'Reset animation');
gui.add(guiInfo, 'Animation speed', 1, 1000, 2).onChange((value: number) => {
    controls.animationSpeed = value;
    controls.emit('animationSpeed', value);
});
gui.add(guiInfo, 'Width')
    .min(1)
    .onFinishChange((value: number) => {
        controls.width = value;
        controls.emit('width', value);
    });
gui.add(guiInfo, 'Height')
    .min(1)
    .onFinishChange((value: number) => {
        controls.height = value;
        controls.emit('height', value);
    });
const tilemapJsonUploadController = gui.add(guiInfo, 'Tilemap JSON upload').name('Tilemap JSON upload (default)');
const tilemapImageUploadController = gui.add(guiInfo, 'Tilemap image upload').name('Tilemap image upload (default)');

tilemapJsonInputElement.addEventListener('change', () => {
    const file = tilemapJsonInputElement.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result?.toString();

            if (result) {
                tilemapJsonUploadController.name('Tilemap JSON upload (' + file.name + ')');
                controls.emit('tilemapJsonUpload', result.toString());
            }
        };
        reader.readAsText(file);
    } else {
        tilemapJsonUploadController.name('Tilemap JSON upload (default)');
        controls.emit('tilemapJsonUpload', '');
    }
});

tilemapImageInputElement.addEventListener('change', () => {
    const file = tilemapImageInputElement.files?.[0];
    if (file) {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            tilemapImageUploadController.name('Tilemap image upload (' + file.name + ')');
            controls.emit('tilemapImageUpload', img);
        };
    } else {
        tilemapImageUploadController.name('Tilemap image upload (default)');
        controls.emit('tilemapImageUpload', undefined);
    }
});

export const disableStartAnimation = (): void => {
    startAnimationController.disable();
};
export const enableStartAnimation = (): void => {
    startAnimationController.enable();
};

export default controls;
