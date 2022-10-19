import './maze';
import { createMaze, printMaze, processMaze } from './maze';

describe('when creating a maze', () => {
    const width = 15;
    const height = 17;
    const maze = createMaze(width, height);

    it('has the correct size', () => {
        expect(maze.width).toBe(width);
        expect(maze.height).toBe(height);

        expect(maze.width).toBe(width);
        expect(maze.height).toBe(height);
        expect(maze.tiles).toHaveLength(height);
        expect(maze.tiles[0]).toHaveLength(width);
    });

    it('has correct properties in tiles', () => {
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                expect(maze.tiles[y][x].x).toBe(x);
                expect(maze.tiles[y][x].y).toBe(y);
                expect(maze.tiles[y][x].isMaze).toBe(false);
                expect(maze.tiles[y][x].walls.top.open).toBe(false);
                expect(maze.tiles[y][x].walls.right.open).toBe(false);
                expect(maze.tiles[y][x].walls.bottom.open).toBe(false);
                expect(maze.tiles[y][x].walls.left.open).toBe(false);
            }
        }
    });

    it('has correct reference based walls', () => {
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (x > 0) expect(maze.tiles[y][x].walls.left).toBe(maze.tiles[y][x - 1].walls.right);
                if (y > 0) expect(maze.tiles[y][x].walls.top).toBe(maze.tiles[y - 1][x].walls.bottom);
                if (x < width - 1) expect(maze.tiles[y][x].walls.right).toBe(maze.tiles[y][x + 1].walls.left);
                if (y < height - 1) expect(maze.tiles[y][x].walls.bottom).toBe(maze.tiles[y + 1][x].walls.top);
            }
        }
    });
});

describe('when printing a maze', () => {
    const width = 6;
    const height = 5;

    it('prints correctly a maze with all walls', () => {
        console.log = jest.fn();
        const maze = createMaze(width, height);

        printMaze(maze);

        expect(console.log).toHaveBeenCalledWith(`┏━━━━━━┳━━━━━━┳━━━━━━┳━━━━━━┳━━━━━━┳━━━━━━┓
┃      ┃      ┃      ┃      ┃      ┃      ┃
┃  XX  ┃  XX  ┃  XX  ┃  XX  ┃  XX  ┃  XX  ┃
┃      ┃      ┃      ┃      ┃      ┃      ┃
┣━━━━━━╋━━━━━━╋━━━━━━╋━━━━━━╋━━━━━━╋━━━━━━┫
┃      ┃      ┃      ┃      ┃      ┃      ┃
┃  XX  ┃  XX  ┃  XX  ┃  XX  ┃  XX  ┃  XX  ┃
┃      ┃      ┃      ┃      ┃      ┃      ┃
┣━━━━━━╋━━━━━━╋━━━━━━╋━━━━━━╋━━━━━━╋━━━━━━┫
┃      ┃      ┃      ┃      ┃      ┃      ┃
┃  XX  ┃  XX  ┃  XX  ┃  XX  ┃  XX  ┃  XX  ┃
┃      ┃      ┃      ┃      ┃      ┃      ┃
┣━━━━━━╋━━━━━━╋━━━━━━╋━━━━━━╋━━━━━━╋━━━━━━┫
┃      ┃      ┃      ┃      ┃      ┃      ┃
┃  XX  ┃  XX  ┃  XX  ┃  XX  ┃  XX  ┃  XX  ┃
┃      ┃      ┃      ┃      ┃      ┃      ┃
┣━━━━━━╋━━━━━━╋━━━━━━╋━━━━━━╋━━━━━━╋━━━━━━┫
┃      ┃      ┃      ┃      ┃      ┃      ┃
┃  XX  ┃  XX  ┃  XX  ┃  XX  ┃  XX  ┃  XX  ┃
┃      ┃      ┃      ┃      ┃      ┃      ┃
┗━━━━━━┻━━━━━━┻━━━━━━┻━━━━━━┻━━━━━━┻━━━━━━┛`);
    });

    it('prints correctly a maze with no walls', () => {
        console.log = jest.fn();
        const maze = createMaze(width, height);

        maze.tiles.forEach((row) =>
            row.forEach((tile) => {
                tile.isMaze = true;
                tile.walls.top.open = true;
                tile.walls.right.open = true;
                tile.walls.bottom.open = true;
                tile.walls.left.open = true;
            })
        );

        printMaze(maze);

        expect(console.log).toHaveBeenCalledWith(`┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                                         ┃
┃                                         ┃
┃                                         ┃
┃      ▪      ▪      ▪      ▪      ▪      ┃
┃                                         ┃
┃                                         ┃
┃                                         ┃
┃      ▪      ▪      ▪      ▪      ▪      ┃
┃                                         ┃
┃                                         ┃
┃                                         ┃
┃      ▪      ▪      ▪      ▪      ▪      ┃
┃                                         ┃
┃                                         ┃
┃                                         ┃
┃      ▪      ▪      ▪      ▪      ▪      ┃
┃                                         ┃
┃                                         ┃
┃                                         ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`);
    });

    it('prints correctly a maze with some walls', () => {
        console.log = jest.fn();
        const maze = createMaze(width, height);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                maze.tiles[y][x].isMaze = true;
                if (y % 3 === 1) maze.tiles[y][x].walls.left.open = true;
                if (y % 5 === 2 || x % 2 === 0) maze.tiles[y][x].walls.top.open = true;
            }
        }

        printMaze(maze);

        expect(console.log).toHaveBeenCalledWith(`┏━━━━━━┳━━━━━━┳━━━━━━┳━━━━━━┳━━━━━━┳━━━━━━┓
┃      ┃      ┃      ┃      ┃      ┃      ┃
┃      ┃      ┃      ┃      ┃      ┃      ┃
┃      ┃      ┃      ┃      ┃      ┃      ┃
┃      ┗━━━━━━┛      ┗━━━━━━┛      ┗━━━━━━┫
┃                                         ┃
┃                                         ┃
┃                                         ┃
┃      ╻      ╻      ╻      ╻      ╻      ┃
┃      ┃      ┃      ┃      ┃      ┃      ┃
┃      ┃      ┃      ┃      ┃      ┃      ┃
┃      ┃      ┃      ┃      ┃      ┃      ┃
┃      ┣━━━━━━┫      ┣━━━━━━┫      ┣━━━━━━┫
┃      ┃      ┃      ┃      ┃      ┃      ┃
┃      ┃      ┃      ┃      ┃      ┃      ┃
┃      ┃      ┃      ┃      ┃      ┃      ┃
┃      ┗━━━━━━┛      ┗━━━━━━┛      ┗━━━━━━┫
┃                                         ┃
┃                                         ┃
┃                                         ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`);
    });
});

describe('when processing a maze', () => {
    const width = 15;
    const height = 17;

    it('generates a maze that has more than 0 maze tiles', async () => {
        const maze = createMaze(width, height);

        await processMaze(maze);

        let mazeTilesCount = 0;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (maze.tiles[y][x].isMaze) mazeTilesCount++;
            }
        }

        expect(mazeTilesCount).toBeGreaterThan(0);
    });

    it('generates a maze where non maze tiles have all walls', async () => {
        const maze = createMaze(width, height);

        await processMaze(maze);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (!maze.tiles[y][x].isMaze) {
                    expect(maze.tiles[y][x].walls.top.open).toBe(false);
                    expect(maze.tiles[y][x].walls.right.open).toBe(false);
                    expect(maze.tiles[y][x].walls.bottom.open).toBe(false);
                    expect(maze.tiles[y][x].walls.left.open).toBe(false);
                }
            }
        }
    });
});
