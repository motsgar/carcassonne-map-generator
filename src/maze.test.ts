import './maze';
import { createMaze, processMaze, setPathPercentage, setRandomWallRemovePercentage } from './maze';

describe('when creating a maze', () => {
    const width = 15;
    const height = 17;
    const maze = createMaze(width, height);

    it('has the correct size', () => {
        expect(maze.width).toBe(width);
        expect(maze.height).toBe(height);

        expect(maze.width).toBe(width);
        expect(maze.height).toBe(height);
        expect(maze.cells).toHaveLength(height);
        expect(maze.cells[0]).toHaveLength(width);
    });

    it('has correct properties in cells', () => {
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                expect(maze.cells[y][x].x).toBe(x);
                expect(maze.cells[y][x].y).toBe(y);
                expect(maze.cells[y][x].isMaze).toBe(false);
                expect(maze.cells[y][x].walls.top.open).toBe(false);
                expect(maze.cells[y][x].walls.right.open).toBe(false);
                expect(maze.cells[y][x].walls.bottom.open).toBe(false);
                expect(maze.cells[y][x].walls.left.open).toBe(false);
            }
        }
    });

    it('has correct reference based walls', () => {
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (x > 0) expect(maze.cells[y][x].walls.left).toBe(maze.cells[y][x - 1].walls.right);
                if (y > 0) expect(maze.cells[y][x].walls.top).toBe(maze.cells[y - 1][x].walls.bottom);
                if (x < width - 1) expect(maze.cells[y][x].walls.right).toBe(maze.cells[y][x + 1].walls.left);
                if (y < height - 1) expect(maze.cells[y][x].walls.bottom).toBe(maze.cells[y + 1][x].walls.top);
            }
        }
    });
});

describe('when processing a maze', () => {
    const width = 15;
    const height = 17;

    setRandomWallRemovePercentage(50);
    setPathPercentage(50);

    it('generates a maze that has more than 0 maze cells', async () => {
        const maze = createMaze(width, height);

        await processMaze(maze);

        let mazecellsCount = 0;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (maze.cells[y][x].isMaze) mazecellsCount++;
            }
        }

        expect((mazecellsCount / (width * height)) * 100).toBeGreaterThanOrEqual(50);
    });

    it('generates a maze where non maze cells have all walls', async () => {
        const maze = createMaze(width, height);

        await processMaze(maze);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (!maze.cells[y][x].isMaze) {
                    expect(maze.cells[y][x].walls.top.open).toBe(false);
                    expect(maze.cells[y][x].walls.right.open).toBe(false);
                    expect(maze.cells[y][x].walls.bottom.open).toBe(false);
                    expect(maze.cells[y][x].walls.left.open).toBe(false);
                }
            }
        }
    });
});
