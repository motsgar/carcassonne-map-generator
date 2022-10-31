import { Direction, sleep } from './utils';

// ----- //
// Types //
// ----- //

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
    cells: MazeCell[][];
};

export type MazePath = { cells: MazeCell[]; walls: Wall[] };

export type MazeEvent =
    | {
          type: 'hightlightCell';
          x: number;
          y: number;
      }
    | {
          type: 'currentPath';
          x: number;
          y: number;
          currentPath: { cells: MazeCell[]; walls: Wall[] };
      }
    | {
          type: 'resetPath';
      };

export type MazeEventCallback = (event: MazeEvent) => void;

// ------------------- //
// Generation Settings //
// ------------------- //

let mazePathPercentage = 0;
let randomWallRemovalPercentage = 0;

// ------------------------- //
// Animation State Variables //
// ------------------------- //

let processingMaze = false;
let shouldStopProcessingMaze = false;
let mazeProcessingStartTime = 0;
let mazeProcessingSleepsHappened = 0;
let sleepMs = 0;

// --------------------------- //
// Generation Settings Setters //
// --------------------------- //

/**
 * Updates maze path percentage to the given percentage
 * @param {number} percentage - The percentage of the maze that should be filled with walls
 */
const setPathPercentage = (percentage: number): void => {
    mazePathPercentage = percentage;
};

/**
 * Updates maze random wall remove percentage to the given percentage
 * @param {number} percentage - The percentage of the walls that should be removed
 */
const setRandomWallRemovePercentage = (percentage: number): void => {
    randomWallRemovalPercentage = percentage;
};

// ------------------- //
// Animation Functions //
// ------------------- //

/**
 * Initializes global maze processing variables to allow slowing down the maze processing animation and canceling it
 */
const startProcessingMaze = (): void => {
    processingMaze = true;
    mazeProcessingStartTime = Date.now();
    mazeProcessingSleepsHappened = 0;
};

/**
 * Updates global maze processing variables to indicate maze processing is done
 */
const stopProcessingMaze = (): void => {
    processingMaze = false;
};

/**
 * Function to cancel the maze generation animation
 * @return {Promise<void>} A promise that resolves when the maze has stopped processing
 */
const cancelProcessingMaze = (): Promise<void> => {
    // If the maze is being processed, set the shouldStopProcessingMaze variable to true. Then wait for the maze to stop
    // processing and check if the maze is being processed by polling the processingMaze variable
    if (processingMaze) {
        shouldStopProcessingMaze = true;
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

/**
 * Updates the time that should be waited between each maze processing step
 * @param {number} ms - The time in milliseconds that should be waited between each step of the maze generation animation
 */
const setSleepMs = (ms: number): void => {
    // Calculate the time that should have passed since the start of the maze generation with the new sleep time
    // and shift the start time of the maze generation to the time that should have passed
    const timeShouldTaken = sleepMs * mazeProcessingSleepsHappened;
    const newTimeShouldTaken = ms * mazeProcessingSleepsHappened;
    mazeProcessingStartTime += timeShouldTaken - newTimeShouldTaken;
    sleepMs = ms;
};

/**
 * A more advanced sleep function to automatically adjust the time that should be waited between maze generation steps
 * based on the time that has already passed. Also handles the canceling of the maze generation
 * @return {Promise<void>} A promise that resolves when the time has passed or the maze generation has been canceled
 */
const advancedSleep = async (): Promise<void> => {
    // If the maze generation has been canceled, stop the maze generation by throwing an error
    if (shouldStopProcessingMaze) {
        shouldStopProcessingMaze = false;
        processingMaze = false;

        throw new Error('Maze processing was canceled');
    }

    // If the maze generation is not canceled, calculate the time that should have passed since the start of the
    // maze generation and wait for the remaining time
    mazeProcessingSleepsHappened++;
    const currentTime = Date.now();
    const timeShouldHavePassed = sleepMs * mazeProcessingSleepsHappened;
    const timePassed = currentTime - mazeProcessingStartTime;
    if (timePassed < timeShouldHavePassed) {
        await sleep(timeShouldHavePassed - timePassed);
    }
};

// ---------------------------------- //
// Algorightm Visualization Functions //
// ---------------------------------- //

/**
 *
 * @param {Maze} maze - The maze from where the path should be generated
 * @param {MazeCell} startTile - The cell from where the path should start
 * @param {MazeCell} currentMazeTile - The cell where the path should end
 * @return {MazePath} The path from the start cell to the end cell
 */
const getCurrentPath = (maze: Maze, startTile: MazeCell, currentMazeTile: MazeCell): MazePath => {
    const cells: MazeCell[] = [];
    const walls: Wall[] = [];
    let tile = startTile;
    while (true) {
        cells.push(tile);
        if (tile === currentMazeTile) break;
        switch (tile.solverDirection) {
            case Direction.Up:
                tile = maze.cells[tile.y - 1][tile.x];
                walls.push(tile.walls.bottom);
                break;
            case Direction.Right:
                tile = maze.cells[tile.y][tile.x + 1];
                walls.push(tile.walls.left);
                break;
            case Direction.Down:
                tile = maze.cells[tile.y + 1][tile.x];
                walls.push(tile.walls.top);
                break;
            case Direction.Left:
                tile = maze.cells[tile.y][tile.x - 1];
                walls.push(tile.walls.right);
                break;
        }
    }
    return { cells, walls };
};

// ------------------- //
// Algorighm Functions //
// ------------------- //

/**
 * Generates a maze with the given width and height
 * @param {number} width - Width of the maze that should be generated
 * @param {number} height - Height of the maze that should be generated
 * @return {Maze} Empty maze with the given width and height
 */
const createMaze = (width: number, height: number): Maze => {
    const maze: Maze = {
        width,
        height,
        cells: [],
    };

    // For every cell in the maze create a cell object
    for (let y = 0; y < height; y++) {
        maze.cells[y] = [];
        for (let x = 0; x < width; x++) {
            const cell: MazeCell = {
                x,
                y,
                isMaze: false,
                solverDirection: Direction.Up,
                walls: {
                    top: { open: false },
                    right: { open: false },
                    bottom: { open: false },
                    left: { open: false },
                },
            };
            maze.cells[y][x] = cell;
        }
    }

    // Create reference based walls so the up wall of one cell references to the same object as the down wall of the cell above it
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (y > 0) {
                maze.cells[y][x].walls.top = maze.cells[y - 1][x].walls.bottom;
            }
            if (x < width - 1) {
                maze.cells[y][x].walls.right = maze.cells[y][x + 1].walls.left;
            }
            if (y < height - 1) {
                maze.cells[y][x].walls.bottom = maze.cells[y + 1][x].walls.top;
            }
            if (x > 0) {
                maze.cells[y][x].walls.left = maze.cells[y][x - 1].walls.right;
            }
        }
    }

    return maze;
};

/**
 * Function that generates a maze using wilsons algorithm with maze path percentage and random wall removal percentage
 * @param {Maze} maze - The maze to process
 * @param {MazeEventCallback | undefined} mazeEvent - A callback function that is called when a maze event happens
 * @return {Promise<void>} A promise that resolves when the maze has been processed
 */
const processMaze = async (maze: Maze, mazeEvent?: MazeEventCallback): Promise<void> => {
    startProcessingMaze();

    try {
        // randomly pick first cell to be part of maze
        maze.cells[(Math.random() * maze.height) | 0][(Math.random() * maze.width) | 0].isMaze = true;

        let nonMazeTiles = maze.cells.flat().slice();

        // While there are still more non-maze tiles than mazePathPercentage, pick a random non-maze tile and do a random walk from that tile until
        // a maze tile is reached. Then connect the non-maze tile to the maze tile by removing the wall between them
        while (true) {
            // Remove all non-maze tiles that are already part of the maze from the nonMazeTiles array
            nonMazeTiles = nonMazeTiles.filter((tile) => !tile.isMaze);

            // If there are less than mazePathPercentage non-maze tiles left, stop the maze processing
            if (nonMazeTiles.length < maze.height * maze.width * (1 - mazePathPercentage) || nonMazeTiles.length === 0)
                break;

            // Pick a random non-maze tile as the start tile for the random walk
            const startTile = nonMazeTiles[(Math.random() * nonMazeTiles.length) | 0];
            let currentMazeTile = startTile;

            await advancedSleep();

            // While the current maze tile is not part of the maze, randomly walk to a neighboring tile and save the direction
            // that was walked in to the current maze tile
            while (!currentMazeTile.isMaze) {
                mazeEvent?.({
                    type: 'currentPath',
                    x: currentMazeTile.x,
                    y: currentMazeTile.y,
                    currentPath: getCurrentPath(maze, startTile, currentMazeTile),
                });

                // Pick a random direction to walk to
                const possibleDirections = [];
                if (currentMazeTile.y > 0) possibleDirections.push(Direction.Up);
                if (currentMazeTile.x < maze.width - 1) possibleDirections.push(Direction.Right);
                if (currentMazeTile.y < maze.height - 1) possibleDirections.push(Direction.Down);
                if (currentMazeTile.x > 0) possibleDirections.push(Direction.Left);

                // Set the direction that was walked to in the current maze tile and update the current maze tile to the tile that was walked to
                currentMazeTile.solverDirection = possibleDirections[(Math.random() * possibleDirections.length) | 0];
                switch (currentMazeTile.solverDirection) {
                    case Direction.Up:
                        currentMazeTile = maze.cells[currentMazeTile.y - 1][currentMazeTile.x];
                        break;
                    case Direction.Right:
                        currentMazeTile = maze.cells[currentMazeTile.y][currentMazeTile.x + 1];
                        break;
                    case Direction.Down:
                        currentMazeTile = maze.cells[currentMazeTile.y + 1][currentMazeTile.x];
                        break;
                    case Direction.Left:
                        currentMazeTile = maze.cells[currentMazeTile.y][currentMazeTile.x - 1];
                        break;
                }

                await advancedSleep();
            }

            // Traverse the path from the start tile to the current maze tile and remove the walls between the tiles
            currentMazeTile = startTile;

            // while the current maze tile is not part of the maze, remove the wall between the current maze tile and the tile that was walked to
            while (true) {
                mazeEvent?.({
                    type: 'hightlightCell',
                    x: currentMazeTile.x,
                    y: currentMazeTile.y,
                });

                if (currentMazeTile.isMaze) break;
                currentMazeTile.isMaze = true;

                // Depending on the direction that was walked to, remove the wall between the current maze tile and the tile that was walked to
                // and update the current maze tile to the tile that was walked to
                switch (currentMazeTile.solverDirection) {
                    case Direction.Up:
                        currentMazeTile.walls.top.open = true;
                        currentMazeTile = maze.cells[currentMazeTile.y - 1][currentMazeTile.x];
                        break;
                    case Direction.Right:
                        currentMazeTile.walls.right.open = true;
                        currentMazeTile = maze.cells[currentMazeTile.y][currentMazeTile.x + 1];
                        break;
                    case Direction.Down:
                        currentMazeTile.walls.bottom.open = true;
                        currentMazeTile = maze.cells[currentMazeTile.y + 1][currentMazeTile.x];
                        break;
                    case Direction.Left:
                        currentMazeTile.walls.left.open = true;
                        currentMazeTile = maze.cells[currentMazeTile.y][currentMazeTile.x - 1];
                        break;
                }
            }
            mazeEvent?.({ type: 'resetPath' });
        }

        // randomly remove randomWallRemoveProcentage of the walls that connect two maze tiles to create loops in the maze
        for (let y = 0; y < maze.height; y++) {
            for (let x = 0; x < maze.width; x++) {
                if (
                    y < maze.height - 1 &&
                    maze.cells[y][x].isMaze &&
                    maze.cells[y + 1][x].isMaze &&
                    Math.random() < randomWallRemovalPercentage
                )
                    maze.cells[y][x].walls.bottom.open = true;
                if (
                    x < maze.width - 1 &&
                    maze.cells[y][x].isMaze &&
                    maze.cells[y][x + 1].isMaze &&
                    Math.random() < randomWallRemovalPercentage
                )
                    maze.cells[y][x].walls.right.open = true;
            }
        }
    } catch (e) {
        if (e instanceof Error) {
            if (e.message === 'Maze processing was canceled') {
                mazeEvent?.({ type: 'resetPath' });
                return;
            }
        }
        throw e;
    } finally {
        stopProcessingMaze();
    }
};

export { createMaze, processMaze, setSleepMs, cancelProcessingMaze, setPathPercentage, setRandomWallRemovePercentage };
