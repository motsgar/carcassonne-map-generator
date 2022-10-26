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
    emit(event: 'mazeWallThickness', width: number): boolean;
    emit(event: 'tilemapJsonUpload', tilemapJson: string): boolean;
    emit(event: 'tilemapImageUpload', image: HTMLImageElement | undefined): boolean;
    emit(event: 'mazePathPercentage', percentage: number): boolean;
    emit(event: 'randomWallRemovePercentage', percentage: number): boolean;

    on(event: 'startAnimation', listener: () => void): this;
    on(event: 'resetAnimation', listener: () => void): this;
    on(event: 'animationSpeed', listener: (speed: number) => void): this;
    on(event: 'width', listener: (width: number) => void): this;
    on(event: 'height', listener: (height: number) => void): this;
    on(event: 'mazeWallThickness', listener: (width: number) => void): this;
    on(event: 'tilemapJsonUpload', listener: (tilemapJson: string) => void): this;
    on(event: 'tilemapImageUpload', listener: (image: HTMLImageElement | undefined) => void): this;
    on(event: 'mazePathPercentage', listener: (percentage: number) => void): this;
    on(event: 'randomWallRemovePercentage', listener: (percentage: number) => void): this;
}

class ControlEvent extends EventEmitter {
    animationSpeed: number;
    width: number;
    height: number;
    wallThickness: number;

    mazePathPercentage: number;
    randomWallRemovePercentage: number;

    constructor() {
        super();

        this.animationSpeed = 800;
        this.width = 20;
        this.height = 18;
        this.wallThickness = 2;

        this.mazePathPercentage = 0.5;
        this.randomWallRemovePercentage = 0.4;
    }
}

const controls = new ControlEvent();

const gui = new GUI({
    width: 300,
});
const guiInfo = {
    startFullAnimation: () => {
        controls.emit('startAnimation');
    },

    resetFullAnimation: () => {
        controls.emit('resetAnimation');
    },
    animationSpeed: controls.animationSpeed,
    width: controls.width,
    height: controls.height,
    wallThickness: controls.wallThickness,
    startMazeAnimation: () => {
        controls.emit('startAnimation');
    },
    mazePathPercentage: controls.mazePathPercentage,
    mazeWallRemovalPercentage: controls.randomWallRemovePercentage,
    tilemapJsonUpload: () => {
        tilemapJsonInputElement.click();
    },
    tilemapImageUpload: () => {
        tilemapImageInputElement.click();
    },
};

// General
const startAnimationController = gui.add(guiInfo, 'startFullAnimation').name('Start animation');
gui.add(guiInfo, 'resetFullAnimation').name('Reset animation');
gui.add(guiInfo, 'animationSpeed', 1, 1000, 2)
    .name('Animation speed')
    .onChange((value: number) => {
        controls.animationSpeed = value;
        controls.emit('animationSpeed', value);
    });
gui.add(guiInfo, 'width')
    .name('Width')
    .min(1)
    .onFinishChange((value: number) => {
        controls.width = value;
        controls.emit('width', value);
    });
gui.add(guiInfo, 'height')
    .name('Height')
    .min(1)
    .onFinishChange((value: number) => {
        controls.height = value;
        controls.emit('height', value);
    });
gui.add(guiInfo, 'wallThickness', 0, 20, 1)
    .name('Wall thickness')
    .onChange((value: number) => {
        controls.wallThickness = value;
        controls.emit('mazeWallThickness', value);
    });

// Maze
const mazeFolder = gui.addFolder('Maze generation');
mazeFolder.add(guiInfo, 'startMazeAnimation').name('Start animation');

mazeFolder
    .add(guiInfo, 'mazePathPercentage', 0, 1, 0.01)
    .name('Path percentage')
    .onChange((value: number) => {
        controls.mazePathPercentage = value;
        controls.emit('mazePathPercentage', value);
    });
mazeFolder
    .add(guiInfo, 'mazeWallRemovalPercentage', 0, 1, 0.01)
    .name('Wall removal percentage')
    .onChange((value: number) => {
        controls.randomWallRemovePercentage = value;
        controls.emit('randomWallRemovePercentage', value);
    });

// Wave function collapse
const waveFunctionCollapseFolder = gui.addFolder('Wave function collapse');
const tilemapJsonUploadController = waveFunctionCollapseFolder
    .add(guiInfo, 'tilemapJsonUpload')
    .name('Tilemap JSON upload (default)');
const tilemapImageUploadController = waveFunctionCollapseFolder
    .add(guiInfo, 'tilemapImageUpload')
    .name('Tilemap image upload (default)');

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

// Functions

export const disableStartAnimation = (): void => {
    startAnimationController.disable();
};
export const enableStartAnimation = (): void => {
    startAnimationController.enable();
};

export default controls;
