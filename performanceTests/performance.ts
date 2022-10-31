import { createMap, fullCollapse } from '../src/collapse';
import { parseTilemapData, createTilesFromTilemapData, sleep } from '../src/utils';
import * as fs from 'fs';

let shouldKeepRunning = true;

process.on('SIGINT', () => {
    shouldKeepRunning = false;
});

const tilemapData = parseTilemapData(JSON.parse(fs.readFileSync('./public/defaultTilemap.json').toString()));
const tiles = createTilesFromTilemapData(tilemapData);

const times = [];

(async () => {
    outer: for (let i = 2; i < 100; i++) {
        const averageValues = [];

        for (let j = 0; j < 4; j++) {
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
        times.push(averageValues.reduce((a, b) => a + b, 0) / averageValues.length);
        console.log(i, times[times.length - 1]);
    }

    let output = 'n,ms\n';
    for (let i = 0; i < times.length; i++) {
        output += `${i + 2},${times[i]}\n`;
    }
    fs.writeFileSync('./performanceTests/performance.csv', output);
})();
