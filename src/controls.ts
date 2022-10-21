import GUI from 'lil-gui';
import EventEmitter from 'events';

declare interface ControlEvent {
    emit(event: 'animationSpeed', speed: number): boolean;
    emit(event: 'width', value: number): boolean;
    emit(event: 'height', value: number): boolean;
    on(event: 'animationSpeed', listener: (speed: number) => void): this;
    on(event: 'width', listener: (value: number) => void): this;
    on(event: 'height', listener: (value: number) => void): this;
}

class ControlEvent extends EventEmitter {}

const controls = new ControlEvent();

const gui = new GUI();
const guiInfo = {
    'Toggle animation': () => {
        console.log('toggle');
    },
    'Animation speed': 500,
    Reset: () => {
        console.log('reset');
    },
    Width: 15,
    Height: 12,
};

gui.add(guiInfo, 'Toggle animation');
gui.add(guiInfo, 'Animation speed', 1, 1000, 2).onChange((value: number) => {
    controls.emit('animationSpeed', value);
});
gui.add(guiInfo, 'Reset');
gui.add(guiInfo, 'Width').onFinishChange((value: number) => {
    controls.emit('width', value);
});
gui.add(guiInfo, 'Height').onFinishChange((value: number) => {
    controls.emit('height', value);
});

export default controls;
