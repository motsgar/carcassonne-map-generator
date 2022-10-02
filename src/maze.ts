const mazeWidth = 10;
const mazeHeight = 6;
const mazePathProcentage = 0.6;

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
        visited: false,
        direction: Direction.Up,
        walls: {
            /*
            top: { open: false },
            right: { open: false },
            bottom: { open: false },
            left: { open: false },
            */
            top: { open: Math.random() < 0.5 },
            right: { open: Math.random() < 0.5 },
            bottom: { open: Math.random() < 0.5 },
            left: { open: Math.random() < 0.5 },
        },
    }))
);

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
                outputString += '      ';
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

printMaze();
