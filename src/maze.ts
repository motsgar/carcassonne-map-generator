import { sleep } from './utils';

const mazePathProcentage = 0.5;
const randomWallRemoveProcentage = 0.4;

export enum Direction {
    Up,
    Right,
    Down,
    Left,
}

export type Wall = { open: boolean };

export type MazeCell = {
    x: number;
    y: number;
    solverDirection: Direction;
    isMaze: boolean;
    walls: { top: Wall; right: Wall; bottom: Wall; left: Wall };
};

export type Maze = {
    width: number;
    height: number;
    tiles: MazeCell[][];
};

export type MazeEvent =
    | {
          type: 'event1';
          x: number;
          y: number;
      }
    | {
          type: 'event3';
      }
    | {
          type: 'event2';
          x: number;
          y: number;
          currentPath: { cells: MazeCell[]; walls: Wall[] };
      };

export type MazeEventCallback = (event: MazeEvent) => void;

const createMaze = (width: number, height: number): Maze => {
    const mazeCells: MazeCell[][] = Array.from(Array(height), () =>
        new Array(width).fill(undefined).map(() => ({
            x: 0,
            y: 0,
            isMaze: false,
            solverDirection: Direction.Up,
            walls: {
                top: { open: false },
                right: { open: false },
                bottom: { open: false },
                left: { open: false },
            },
        }))
    );

    // set x and y values for each cell
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            mazeCells[y][x].x = x;
            mazeCells[y][x].y = y;
        }
    }

    // create reference based walls so the up wall of one cell references to the same object as the down wall of the cell above it
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (y > 0) {
                mazeCells[y][x].walls.top = mazeCells[y - 1][x].walls.bottom;
            }
            if (x < width - 1) {
                mazeCells[y][x].walls.right = mazeCells[y][x + 1].walls.left;
            }
            if (y < height - 1) {
                mazeCells[y][x].walls.bottom = mazeCells[y + 1][x].walls.top;
            }
            if (x > 0) {
                mazeCells[y][x].walls.left = mazeCells[y][x - 1].walls.right;
            }
        }
    }

    return {
        width,
        height,
        tiles: mazeCells,
    };
};

const printMaze = (maze: Maze): void => {
    let outputString = '';
    outputString += '┏';
    for (let x = 0; x < maze.width - 1; x++) {
        outputString += '━━━━━━';
        if (maze.tiles[0][x].walls.right.open) outputString += '━';
        else outputString += '┳';
    }
    outputString += '━━━━━━┓\n';
    for (let y = 0; y < maze.height; y++) {
        for (let i = 0; i < 3; i++) {
            outputString += '┃';
            for (let x = 0; x < maze.width; x++) {
                if (i === 1) outputString += maze.tiles[y][x].isMaze ? '      ' : '  XX  ';
                else outputString += '      ';
                if (maze.tiles[y][x].walls.right.open && x < maze.width - 1) outputString += ' ';
                else outputString += '┃';
            }
            outputString += '\n';
        }

        if (y < maze.height - 1) {
            if (maze.tiles[y][0].walls.bottom.open) outputString += '┃';
            else outputString += '┣';
            for (let x = 0; x < maze.width; x++) {
                if (maze.tiles[y][x].walls.bottom.open) outputString += '      ';
                else outputString += '━━━━━━';
                if (x < maze.width - 1) {
                    if (maze.tiles[y][x].walls.bottom.open) {
                        // left empty
                        if (maze.tiles[y][x].walls.right.open) {
                            // top empty
                            if (maze.tiles[y][x + 1].walls.bottom.open) {
                                // right empty
                                if (maze.tiles[y + 1][x].walls.right.open) outputString += '▪'; // bottom empty
                                else outputString += '╻'; // bottom wall
                            } else {
                                // right wall
                                if (maze.tiles[y + 1][x].walls.right.open) outputString += '╺'; // bottom empty
                                else outputString += '┏'; // bottom wall
                            }
                        } else {
                            // top wall
                            if (maze.tiles[y][x + 1].walls.bottom.open) {
                                // right empty
                                if (maze.tiles[y + 1][x].walls.right.open) outputString += '╹'; // bottom empty
                                else outputString += '┃'; // bottom wall
                            } else {
                                // right wall
                                if (maze.tiles[y + 1][x].walls.right.open) outputString += '┗'; // bottom empty
                                else outputString += '┣'; // bottom wall
                            }
                        }
                    } else {
                        // left wall
                        if (maze.tiles[y][x].walls.right.open) {
                            // top empty
                            if (maze.tiles[y][x + 1].walls.bottom.open) {
                                // right empty
                                if (maze.tiles[y + 1][x].walls.right.open) outputString += '╸'; // bottom empty
                                else outputString += '┓'; // bottom wall
                            } else {
                                // right wall
                                if (maze.tiles[y + 1][x].walls.right.open) outputString += '━'; // bottom empty
                                else outputString += '┳'; // bottom wall
                            }
                        } else {
                            // top wall
                            if (maze.tiles[y][x + 1].walls.bottom.open) {
                                // right empty
                                if (maze.tiles[y + 1][x].walls.right.open) outputString += '┛'; // bottom empty
                                else outputString += '┫'; // bottom wall
                            } else {
                                // right wall
                                if (maze.tiles[y + 1][x].walls.right.open) outputString += '┻'; // bottom empty
                                else outputString += '╋'; // bottom wall
                            }
                        }
                    }
                } else if (maze.tiles[y][x].walls.bottom.open) outputString += '┃';
                else outputString += '┫';
            }
            outputString += '\n';
        }
    }
    outputString += '┗';
    for (let x = 0; x < maze.width - 1; x++) {
        outputString += '━━━━━━';
        if (maze.tiles[maze.height - 1][x].walls.right.open) outputString += '━';
        else outputString += '┻';
    }
    outputString += '━━━━━━┛';
    console.log(outputString);
};

const getCurrentPath = (
    maze: Maze,
    startTile: MazeCell,
    currentMazeTile: MazeCell
): { cells: MazeCell[]; walls: Wall[] } => {
    const cells: MazeCell[] = [];
    const walls: Wall[] = [];
    let tile = startTile;
    while (true) {
        cells.push(tile);
        if (tile === currentMazeTile) break;
        switch (tile.solverDirection) {
            case Direction.Up:
                tile = maze.tiles[tile.y - 1][tile.x];
                walls.push(tile.walls.bottom);
                break;
            case Direction.Right:
                tile = maze.tiles[tile.y][tile.x + 1];
                walls.push(tile.walls.left);
                break;
            case Direction.Down:
                tile = maze.tiles[tile.y + 1][tile.x];
                walls.push(tile.walls.top);
                break;
            case Direction.Left:
                tile = maze.tiles[tile.y][tile.x - 1];
                walls.push(tile.walls.right);
                break;
        }
    }
    return { cells, walls };
};

let processingMaze = false;
let shouldProcessMaze = true;
let mazeProcessingStartTime = 0;
let mazeProcessingSleepsHappened = 0;

let sleepMs = 0;

const setSleepMs = (ms: number): void => {
    const timeShouldTaken = sleepMs * mazeProcessingSleepsHappened;
    const newTimeShouldTaken = ms * mazeProcessingSleepsHappened;
    mazeProcessingStartTime += timeShouldTaken - newTimeShouldTaken;
    sleepMs = ms;
};

const cancelProcessingMaze = (): Promise<void> => {
    if (processingMaze) {
        shouldProcessMaze = false;
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                if (!processingMaze) {
                    clearInterval(interval);
                    resolve();
                }
            }, 10);
        });
    }
    return Promise.resolve();
};

const processMaze = async (maze: Maze, mazeEvent?: MazeEventCallback): Promise<void> => {
    processingMaze = true;
    mazeProcessingStartTime = Date.now();
    mazeProcessingSleepsHappened = 0;
    // randomly pick first cell to be part of maze
    maze.tiles[(Math.random() * maze.height) | 0][(Math.random() * maze.width) | 0].isMaze = true;

    let nonMazeTiles = maze.tiles.flat().slice();

    while (true) {
        nonMazeTiles = nonMazeTiles.filter((tile) => !tile.isMaze);
        if (nonMazeTiles.length < maze.height * maze.width * (1 - mazePathProcentage) || nonMazeTiles.length === 0)
            break;

        const startTile = nonMazeTiles[(Math.random() * nonMazeTiles.length) | 0];
        let currentMazeTile = startTile;

        if (sleepMs > 0) {
            if (!shouldProcessMaze) {
                shouldProcessMaze = true;
                processingMaze = false;

                mazeEvent?.({ type: 'event3' });

                return;
            }
            mazeProcessingSleepsHappened++;
            const currentTime = Date.now();
            const timeShouldHavePassed = sleepMs * mazeProcessingSleepsHappened;
            const timePassed = currentTime - mazeProcessingStartTime;
            if (timePassed < timeShouldHavePassed) {
                await sleep(timeShouldHavePassed - timePassed);
            }
        }

        while (true) {
            if (currentMazeTile.isMaze) break;

            mazeEvent?.({
                type: 'event2',
                x: currentMazeTile.x,
                y: currentMazeTile.y,
                currentPath: getCurrentPath(maze, startTile, currentMazeTile),
            });

            const possibleDirections = [];
            if (currentMazeTile.y > 0) possibleDirections.push(Direction.Up);
            if (currentMazeTile.x < maze.width - 1) possibleDirections.push(Direction.Right);
            if (currentMazeTile.y < maze.height - 1) possibleDirections.push(Direction.Down);
            if (currentMazeTile.x > 0) possibleDirections.push(Direction.Left);
            currentMazeTile.solverDirection = possibleDirections[(Math.random() * possibleDirections.length) | 0];
            switch (currentMazeTile.solverDirection) {
                case Direction.Up:
                    currentMazeTile = maze.tiles[currentMazeTile.y - 1][currentMazeTile.x];
                    break;
                case Direction.Right:
                    currentMazeTile = maze.tiles[currentMazeTile.y][currentMazeTile.x + 1];
                    break;
                case Direction.Down:
                    currentMazeTile = maze.tiles[currentMazeTile.y + 1][currentMazeTile.x];
                    break;
                case Direction.Left:
                    currentMazeTile = maze.tiles[currentMazeTile.y][currentMazeTile.x - 1];
                    break;
            }

            if (sleepMs > 0) {
                if (!shouldProcessMaze) {
                    shouldProcessMaze = true;
                    processingMaze = false;
                    mazeEvent?.({ type: 'event3' });
                    return;
                }
                mazeProcessingSleepsHappened++;
                const currentTime = Date.now();
                const timeShouldHavePassed = sleepMs * mazeProcessingSleepsHappened;
                const timePassed = currentTime - mazeProcessingStartTime;
                if (timePassed < timeShouldHavePassed) {
                    await sleep(timeShouldHavePassed - timePassed);
                }
            }
        }
        currentMazeTile = startTile;

        while (true) {
            mazeEvent?.({
                type: 'event1',
                x: currentMazeTile.x,
                y: currentMazeTile.y,
            });
            if (currentMazeTile.isMaze) break;

            currentMazeTile.isMaze = true;

            switch (currentMazeTile.solverDirection) {
                case Direction.Up:
                    currentMazeTile.walls.top.open = true;
                    currentMazeTile = maze.tiles[currentMazeTile.y - 1][currentMazeTile.x];
                    break;
                case Direction.Right:
                    currentMazeTile.walls.right.open = true;
                    currentMazeTile = maze.tiles[currentMazeTile.y][currentMazeTile.x + 1];
                    break;
                case Direction.Down:
                    currentMazeTile.walls.bottom.open = true;
                    currentMazeTile = maze.tiles[currentMazeTile.y + 1][currentMazeTile.x];
                    break;
                case Direction.Left:
                    currentMazeTile.walls.left.open = true;
                    currentMazeTile = maze.tiles[currentMazeTile.y][currentMazeTile.x - 1];
                    break;
            }
        }
        mazeEvent?.({
            type: 'event3',
        });
    }

    // randomly remove randomWallRemoveProcentage of the walls that connect two maze tiles
    for (let y = 0; y < maze.height; y++) {
        for (let x = 0; x < maze.width; x++) {
            if (
                y < maze.height - 1 &&
                maze.tiles[y][x].isMaze &&
                maze.tiles[y + 1][x].isMaze &&
                Math.random() < randomWallRemoveProcentage
            )
                maze.tiles[y][x].walls.bottom.open = true;
            if (
                x < maze.width - 1 &&
                maze.tiles[y][x].isMaze &&
                maze.tiles[y][x + 1].isMaze &&
                Math.random() < randomWallRemoveProcentage
            )
                maze.tiles[y][x].walls.right.open = true;
        }
    }
    shouldProcessMaze = true;
    processingMaze = false;
};

export { createMaze, printMaze, processMaze, setSleepMs, cancelProcessingMaze };
