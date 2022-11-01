import { createMap, fullCollapse } from '../src/collapse';
import { parseTilemapData, createTilesFromTilemapData, sleep } from '../src/utils';
import * as fs from 'fs';
import { createMaze, processMaze, setPathPercentage, setRandomWallRemovePercentage } from '../src/maze';

let shouldKeepRunning = true;

process.on('SIGINT', () => {
    shouldKeepRunning = false;
});

const tilemapData = parseTilemapData(JSON.parse(fs.readFileSync('./public/defaultTilemap.json').toString()));
const tiles = createTilesFromTilemapData(tilemapData);

(async () => {
    console.log('testing different map sizes for collapsing until map size is 100 or ctrl+c is pressed');

    const wfcTimes = new Map<number, number>();

    outer: for (let i = 2; i <= 187; i += Math.ceil(i / 10)) {
        const averageValues = [];

        for (let j = 0; j < 5; j++) {
            const map = createMap(i, i, tiles);
            const start = process.hrtime.bigint();
            await fullCollapse(map);
            await sleep(1);
            const end = process.hrtime.bigint();
            averageValues.push(Number(end - start) / 1000000);
            if (!shouldKeepRunning) {
                break outer;
            }
        }
        wfcTimes.set(i, averageValues.reduce((a, b) => a + b, 0) / averageValues.length);
        console.log(i, wfcTimes.get(i));
    }
    shouldKeepRunning = true;
    let wfcOutput = 'n,ms\n';
    for (const [n, ms] of wfcTimes) {
        wfcOutput += `${n},${ms}\n`;
    }
    fs.writeFileSync('./performanceTests/wfcPerformance.csv', wfcOutput);
    console.log('testing different maze sizes for maze until map size is 100 or ctrl+c is pressed');

    const mazeTimes = new Map<number, number>();
    setPathPercentage(1);
    setRandomWallRemovePercentage(0);

    outer: for (let i = 2; i <= 303; i += Math.ceil(i / 10)) {
        const averageValues = [];

        for (let j = 0; j < 5; j++) {
            const map = createMaze(i, i);
            const start = process.hrtime.bigint();
            await processMaze(map);
            await sleep(1);
            const end = process.hrtime.bigint();
            averageValues.push(Number(end - start) / 1000000);
            if (!shouldKeepRunning) {
                break outer;
            }
        }
        mazeTimes.set(i, averageValues.reduce((a, b) => a + b, 0) / averageValues.length);
        console.log(i, mazeTimes.get(i));
    }

    let mazeOutput = 'n,ms\n';
    for (const [key, value] of mazeTimes) {
        mazeOutput += `${key},${value}\n`;
    }
    fs.writeFileSync('./performanceTests/mazePerformance.csv', mazeOutput);
})();
