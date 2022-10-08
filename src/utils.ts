import { Map, Side, limitTilePossibilities } from './collapse';
import { Maze } from './maze';

export type MazeLimitOptions = {
    sideType: Side;
    allowSideConnections: boolean;
    allowTilesOutsideWithSide: boolean;
};

const limitMapToMaze = (map: Map, maze: Maze, options: MazeLimitOptions): void => {
    if (options.allowSideConnections) options.allowTilesOutsideWithSide = true;

    for (let y = 0; y < map.height; y++) {
        for (let x = 0; x < map.width; x++) {
            const mapCell = map.tiles[y][x];
            const mazeCell = maze.tiles[y][x];

            if (mazeCell === undefined) continue;

            if (!mazeCell.isMaze) {
                if (!options.allowTilesOutsideWithSide) {
                    limitTilePossibilities(
                        map,
                        x,
                        y,
                        mapCell.possibilities.filter(
                            (tile) =>
                                tile.bottom !== options.sideType &&
                                tile.top !== options.sideType &&
                                tile.left !== options.sideType &&
                                tile.right !== options.sideType
                        )
                    );
                }
                continue;
            }
        }
    }
};
export { limitMapToMaze };
