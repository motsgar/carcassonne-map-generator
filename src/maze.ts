const mazeWidth = 30;
const mazeHeight = 20;
const mazePathProcentage = 0.5;
const randomWallRemoveProcentage = 0.4;

enum Direction {
    Up,
    Right,
    Down,
    Left,
}

type MazeCell = {
    x: number;
    y: number;
    direction: Direction;
    isMaze: boolean;
    walls: {
        top: { open: boolean };
        right: { open: boolean };
        bottom: { open: boolean };
        left: { open: boolean };
    };
};

const maze: MazeCell[][] = Array.from(Array(mazeHeight), () =>
    new Array(mazeWidth).fill(undefined).map(() => ({
        x: 0,
        y: 0,
        isMaze: false,
        direction: Direction.Up,
        walls: {
            top: { open: false },
            right: { open: false },
            bottom: { open: false },
            left: { open: false },
        },
    }))
);

const allTiles = maze.flat();

// initialize maze
for (let y = 0; y < mazeHeight; y++) {
    for (let x = 0; x < mazeWidth; x++) {
        maze[y][x].x = x;
        maze[y][x].y = y;
    }
}

// fill maze with walls that are referenced by the maze cells
for (let y = 0; y < mazeHeight; y++) {
    for (let x = 0; x < mazeWidth; x++) {
        if (y > 0) {
            maze[y][x].walls.top = maze[y - 1][x].walls.bottom;
        }
        if (x < mazeWidth - 1) {
            maze[y][x].walls.right = maze[y][x + 1].walls.left;
        }
        if (y < mazeHeight - 1) {
            maze[y][x].walls.bottom = maze[y + 1][x].walls.top;
        }
        if (x > 0) {
            maze[y][x].walls.left = maze[y][x - 1].walls.right;
        }
    }
}

const printMaze = (): void => {
    let outputString = '';
    outputString += '┏';
    for (let x = 0; x < mazeWidth - 1; x++) {
        outputString += '━━━━━━';
        if (maze[0][x].walls.right.open) outputString += '━';
        else outputString += '┳';
    }
    outputString += '━━━━━━┓\n';
    for (let y = 0; y < mazeHeight; y++) {
        for (let i = 0; i < 3; i++) {
            outputString += '┃';
            for (let x = 0; x < mazeWidth; x++) {
                if (i === 1) outputString += maze[y][x].isMaze ? '      ' : '  XX  ';
                else outputString += '      ';
                if (maze[y][x].walls.right.open && x < mazeWidth - 1) outputString += ' ';
                else outputString += '┃';
            }
            outputString += '\n';
        }

        if (y < mazeHeight - 1) {
            if (maze[y][0].walls.bottom.open) outputString += '┃';
            else outputString += '┣';
            for (let x = 0; x < mazeWidth; x++) {
                if (maze[y][x].walls.bottom.open) outputString += '      ';
                else outputString += '━━━━━━';
                if (x < mazeWidth - 1) {
                    if (maze[y][x].walls.bottom.open) {
                        // left empty
                        if (maze[y][x].walls.right.open) {
                            // top empty
                            if (maze[y][x + 1].walls.bottom.open) {
                                // right empty
                                if (maze[y + 1][x].walls.right.open) outputString += '▪'; // bottom empty
                                else outputString += '╻'; // bottom wall
                            } else {
                                // right wall
                                if (maze[y + 1][x].walls.right.open) outputString += '╺'; // bottom empty
                                else outputString += '┏'; // bottom wall
                            }
                        } else {
                            // top wall
                            if (maze[y][x + 1].walls.bottom.open) {
                                // right empty
                                if (maze[y + 1][x].walls.right.open) outputString += '╹'; // bottom empty
                                else outputString += '┃'; // bottom wall
                            } else {
                                // right wall
                                if (maze[y + 1][x].walls.right.open) outputString += '┗'; // bottom empty
                                else outputString += '┣'; // bottom wall
                            }
                        }
                    } else {
                        // left wall
                        if (maze[y][x].walls.right.open) {
                            // top empty
                            if (maze[y][x + 1].walls.bottom.open) {
                                // right empty
                                if (maze[y + 1][x].walls.right.open) outputString += '╸'; // bottom empty
                                else outputString += '┓'; // bottom wall
                            } else {
                                // right wall
                                if (maze[y + 1][x].walls.right.open) outputString += '━'; // bottom empty
                                else outputString += '┳'; // bottom wall
                            }
                        } else {
                            // top wall
                            if (maze[y][x + 1].walls.bottom.open) {
                                // right empty
                                if (maze[y + 1][x].walls.right.open) outputString += '┛'; // bottom empty
                                else outputString += '┫'; // bottom wall
                            } else {
                                // right wall
                                if (maze[y + 1][x].walls.right.open) outputString += '┻'; // bottom empty
                                else outputString += '╋'; // bottom wall
                            }
                        }
                    }
                } else if (maze[y][x].walls.bottom.open) outputString += '┃';
                else outputString += '┫';
            }
            outputString += '\n';
        }
    }
    outputString += '┗';
    for (let x = 0; x < mazeWidth - 1; x++) {
        outputString += '━━━━━━';
        if (maze[mazeHeight - 1][x].walls.right.open) outputString += '━';
        else outputString += '┻';
    }
    outputString += '━━━━━━┛\n';
    console.log(outputString);
};

const createMaze = (): void => {
    // randomly pick first cell to be part of maze
    maze[(Math.random() * mazeHeight) | 0][(Math.random() * mazeWidth) | 0].isMaze = true;

    let nonMazeTiles = allTiles.slice();

    while (true) {
        nonMazeTiles = nonMazeTiles.filter((tile) => !tile.isMaze);
        if (nonMazeTiles.length < allTiles.length * (1 - mazePathProcentage) || nonMazeTiles.length === 0) break;

        const startTile = nonMazeTiles[(Math.random() * nonMazeTiles.length) | 0];
        let currentMazeTile = startTile;

        while (true) {
            if (currentMazeTile.isMaze) break;
            const possibleDirections = [];
            if (currentMazeTile.y > 0) possibleDirections.push(Direction.Up);
            if (currentMazeTile.x < mazeWidth - 1) possibleDirections.push(Direction.Right);
            if (currentMazeTile.y < mazeHeight - 1) possibleDirections.push(Direction.Down);
            if (currentMazeTile.x > 0) possibleDirections.push(Direction.Left);
            currentMazeTile.direction = possibleDirections[(Math.random() * possibleDirections.length) | 0];
            switch (currentMazeTile.direction) {
                case Direction.Up:
                    currentMazeTile = maze[currentMazeTile.y - 1][currentMazeTile.x];
                    break;
                case Direction.Right:
                    currentMazeTile = maze[currentMazeTile.y][currentMazeTile.x + 1];
                    break;
                case Direction.Down:
                    currentMazeTile = maze[currentMazeTile.y + 1][currentMazeTile.x];
                    break;
                case Direction.Left:
                    currentMazeTile = maze[currentMazeTile.y][currentMazeTile.x - 1];
                    break;
            }
        }
        currentMazeTile = startTile;

        while (true) {
            if (currentMazeTile.isMaze) break;

            currentMazeTile.isMaze = true;

            switch (currentMazeTile.direction) {
                case Direction.Up:
                    currentMazeTile.walls.top.open = true;
                    currentMazeTile = maze[currentMazeTile.y - 1][currentMazeTile.x];
                    break;
                case Direction.Right:
                    currentMazeTile.walls.right.open = true;
                    currentMazeTile = maze[currentMazeTile.y][currentMazeTile.x + 1];
                    break;
                case Direction.Down:
                    currentMazeTile.walls.bottom.open = true;
                    currentMazeTile = maze[currentMazeTile.y + 1][currentMazeTile.x];
                    break;
                case Direction.Left:
                    currentMazeTile.walls.left.open = true;
                    currentMazeTile = maze[currentMazeTile.y][currentMazeTile.x - 1];
                    break;
            }
        }
    }

    // randomly remove randomWallRemoveProcentage of the walls that connect two maze tiles
    for (let y = 0; y < mazeHeight; y++) {
        for (let x = 0; x < mazeWidth; x++) {
            if (
                y < mazeHeight - 1 &&
                maze[y][x].isMaze &&
                maze[y + 1][x].isMaze &&
                Math.random() < randomWallRemoveProcentage
            )
                maze[y][x].walls.bottom.open = true;
            if (
                x < mazeWidth - 1 &&
                maze[y][x].isMaze &&
                maze[y][x + 1].isMaze &&
                Math.random() < randomWallRemoveProcentage
            )
                maze[y][x].walls.right.open = true;
        }
    }
};

createMaze();

printMaze();
