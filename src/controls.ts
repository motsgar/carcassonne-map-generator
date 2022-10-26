import GUI from 'lil-gui';
import EventEmitter from 'events';

const tilemapJsonInputElement = document.getElementById('tilemap-json-input') as HTMLInputElement;
const tilemapImageInputElement = document.getElementById('tilemap-image-input') as HTMLInputElement;

declare interface ControlEvent {
    emit(event: 'startFullAnimation'): boolean;
    emit(event: 'stopFullAnimation'): boolean;
    emit(event: 'resetFullAnimation'): boolean;
    emit(event: 'showMaze'): boolean;
    emit(event: 'showMap'): boolean;
    emit(event: 'animationSpeed', speed: number): boolean;
    emit(event: 'width', width: number): boolean;
    emit(event: 'height', height: number): boolean;
    emit(event: 'wallThickness', width: number): boolean;
    emit(event: 'startMazeAnimation'): boolean;
    emit(event: 'resetMazeAnimation'): boolean;
    emit(event: 'limitCurrentMap'): boolean;
    emit(event: 'startWFCAnimation'): boolean;
    emit(event: 'resetWFCAnimation'): boolean;
    emit(event: 'tilemapJsonUpload', tilemapJson: string): boolean;
    emit(event: 'tilemapImageUpload', image: HTMLImageElement | undefined): boolean;
    emit(event: 'mazePathPercentage', percentage: number): boolean;
    emit(event: 'randomWallRemovePercentage', percentage: number): boolean;

    on(event: 'startFullAnimation', listener: () => void): this;
    on(event: 'stopFullAnimation', listener: () => void): this;
    on(event: 'resetFullAnimation', listener: () => void): this;
    on(event: 'showMaze', listener: () => void): this;
    on(event: 'showMap', listener: () => void): this;
    on(event: 'animationSpeed', listener: (speed: number) => void): this;
    on(event: 'width', listener: (width: number) => void): this;
    on(event: 'height', listener: (height: number) => void): this;
    on(event: 'wallThickness', listener: (width: number) => void): this;
    on(event: 'startMazeAnimation', listener: () => void): this;
    on(event: 'resetMazeAnimation', listener: () => void): this;
    on(event: 'limitCurrentMap', listener: () => void): this;
    on(event: 'startWFCAnimation', listener: () => void): this;
    on(event: 'resetWFCAnimation', listener: () => void): this;
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
        this.width = 8;
        this.height = 7;
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
        controls.emit('startFullAnimation');
    },
    stopFullAnimation: () => {
        controls.emit('stopFullAnimation');
    },
    resetFullAnimation: () => {
        controls.emit('resetFullAnimation');
    },
    showMaze: () => {
        controls.emit('showMaze');
    },
    showMap: () => {
        controls.emit('showMap');
    },
    animationSpeed: controls.animationSpeed,
    width: controls.width,
    height: controls.height,
    wallThickness: controls.wallThickness,

    startMazeAnimation: () => {
        controls.emit('startMazeAnimation');
    },
    resetMazeAnimation: () => {
        controls.emit('resetMazeAnimation');
    },
    limitCurrentMap: () => {
        controls.emit('limitCurrentMap');
    },
    mazePathPercentage: controls.mazePathPercentage,
    mazeWallRemovalPercentage: controls.randomWallRemovePercentage,

    startWFCAnimation: () => {
        controls.emit('startWFCAnimation');
    },
    resetWFCAnimation: () => {
        controls.emit('resetWFCAnimation');
    },
    tilemapJsonUpload: () => {
        tilemapJsonInputElement.click();
    },
    tilemapImageUpload: () => {
        tilemapImageInputElement.click();
    },
};

// General
const startAnimationController = gui.add(guiInfo, 'startFullAnimation').name('Start animation');
const stopAnimationController = gui.add(guiInfo, 'stopFullAnimation').name('Stop animation').disable();
const resetAnimationController = gui.add(guiInfo, 'resetFullAnimation').name('Reset all').disable();
const showMazeController = gui.add(guiInfo, 'showMaze').name('Show maze').disable();
const showMapController = gui.add(guiInfo, 'showMap').name('Show map');

gui.add(guiInfo, 'animationSpeed', 1, 1000, 2)
    .name('Animation speed')
    .onChange((value: number) => {
        controls.animationSpeed = value;
        controls.emit('animationSpeed', value);
    });
const widthController = gui
    .add(guiInfo, 'width')
    .name('Width')
    .min(1)
    .onFinishChange((value: number) => {
        controls.width = value;
        controls.emit('width', value);
    });
const heightController = gui
    .add(guiInfo, 'height')
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
        controls.emit('wallThickness', value);
    });

// Maze
const mazeFolder = gui.addFolder('Maze generation');
const startMazeAnimationController = mazeFolder.add(guiInfo, 'startMazeAnimation').name('Start animation');
const resetMazeAnimationController = mazeFolder.add(guiInfo, 'resetMazeAnimation').name('Reset maze').disable();

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
const mapGenerationFolder = gui.addFolder('Map generation');
const startWFCAnimationController = mapGenerationFolder.add(guiInfo, 'startWFCAnimation').name('Start animation');
const resetWFCAnimationController = mapGenerationFolder.add(guiInfo, 'resetWFCAnimation').name('Reset map').disable();
const limitCurrentMapController = mapGenerationFolder
    .add(guiInfo, 'limitCurrentMap')
    .name('Limit current map')
    .disable();

const tilemapJsonUploadController = mapGenerationFolder
    .add(guiInfo, 'tilemapJsonUpload')
    .name('Tilemap JSON upload (default)');
const tilemapImageUploadController = mapGenerationFolder
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
export const startAnimation = (): void => {
    startAnimationController.disable();
    startMazeAnimationController.disable();
    resetMazeAnimationController.disable();
    limitCurrentMapController.disable();
    startWFCAnimationController.disable();
    resetWFCAnimationController.disable();
    stopAnimationController.enable();
    resetAnimationController.disable();

    widthController.disable();
    heightController.disable();
};

export const stopAnimation = (): void => {
    startAnimationController.enable();
    startMazeAnimationController.enable();
    resetMazeAnimationController.enable();
    limitCurrentMapController.enable();
    startWFCAnimationController.enable();
    resetWFCAnimationController.enable();
    stopAnimationController.disable();
    resetAnimationController.enable();

    widthController.enable();
    heightController.enable();
};

export const resetFullAnimation = (): void => {
    startAnimationController.enable();
    resetAnimationController.disable();
    startMazeAnimationController.enable();
    resetMazeAnimationController.disable();
    limitCurrentMapController.disable();
    startWFCAnimationController.enable();
    resetWFCAnimationController.disable();
    stopAnimationController.disable();
    resetAnimationController.disable();

    widthController.enable();
    heightController.enable();
};

export const finishMazeAnimation = (): void => {
    startMazeAnimationController.disable();
};

export const limitMap = (): void => {
    limitCurrentMapController.disable();
};

export const resetWFCAnimation = (): void => {
    startWFCAnimationController.enable();
    resetWFCAnimationController.disable();

    limitCurrentMapController.enable();
};

export const resetMazeAnimation = (): void => {
    startMazeAnimationController.enable();
    resetMazeAnimationController.disable();
};

export const finishWFCAnimation = (): void => {
    startWFCAnimationController.disable();
};

export const showMaze = (): void => {
    showMazeController.disable();
    showMapController.enable();
};

export const showMap = (): void => {
    showMazeController.enable();
    showMapController.disable();
};

export const disableMapReset = (): void => {
    resetWFCAnimationController.disable();
};

export const disableResize = (): void => {
    widthController.disable();
    heightController.disable();
};

export default controls;
