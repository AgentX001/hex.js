'use strict';

const BOTTOM_RIGHT = 0,
      BOTTOM = 1,
      BOTTOM_LEFT = 2, 
      UPPER_LEFT = 3,
      UPPER = 4,
      UPPER_RIGHT = 5;

class HexGrid {
    constructor(columns, rows, hexSize) {
        this.columns = columns;
        this.rows = rows;
        this.hexSize = hexSize;
        this.hexWidth = hexSize * 2;
        this.hexHeight = Math.round(Math.sqrt(3) / 2 * this.hexWidth);
        this.offset = new Point(this.hexWidth / 2, this.hexHeight / 2);
    }

    check(hex) {
        if (!hex) return false;
        if (hex.length != 2) return false;
        if ((typeof hex[0] != 'number' || typeof hex[1] != 'number') ||
            (isNaN(hex[0]) || isNaN(hex[1])) ||
            (hex[0] < 0 || hex[0] > this.columns - 1) ||
            (hex[1] < 0 || hex[1] > this.rows - 1)) {
                return false;
            }
        return true;
    }

    getEmptyMatrix() {
        let matrix = [];
        for (let q = 0; q < this.columns; q++) {
            matrix[q] = [];
            for (let r = 0; r < this.rows; r++) {
                matrix[q][r] = 0;
            }
        }
        
        return matrix;
    }

    getHexCenter(hex) {
        if (!this.check(hex)) return false;

        let q = hex[0],
            r = hex[1];

        let center = new Point(
            Math.round(q * 3/4 * this.hexWidth),
            Math.round(r * this.hexHeight + (q&1) * (this.hexHeight/2))
        );

        center.add(this.offset);

        return center;
    }

    getHexPolygon(hex) {
        if (!this.check(hex)) return false;

        let q = hex[0],
            r = hex[1];

        let center = this.getHexCenter(hex);
        let vertices = [];

        for (let i = 0; i < 6; i++) {
            let angle = (i*60).toRad();
            vertices[i] = new Point(
                Math.round(center.x + this.hexSize * Math.cos(angle)),
                Math.round(center.y + this.hexSize * Math.sin(angle))
            );
        }

        return new Polygon(vertices);
    }

    findHex(point) {
        let rectW = this.hexWidth * 0.75;
        let rectH = this.hexHeight;

        let q = Math.floor((point.x - 0.125 * rectW) / rectW);
        let r = Math.floor((point.y - 0.5 * rectH * (q&1)) / rectH);

        let hex = [q, r];

        if (!this.check(hex)) return false;
        return hex;
    }

    getHexNeighbors(hex) {
        if (!this.check(hex)) return false;

        let neighbors = [];
        let matrix = [];

        if (hex[0]&1) {
            matrix = [
                [1, 1],
                [0, 1],
                [-1, 1],
                [-1, 0],
                [0, -1],
                [1, 0]
            ];
        } else {
            matrix = [
                [1, 0],
                [0, 1],
                [-1, 0],
                [-1, -1],
                [0, -1],
                [1, -1]
            ];
        }

        for (let i = 0; i < 6; i++) {
            let neighbor = [hex[0] + matrix[i][0], hex[1] + matrix[i][1]];
            if (this.check(neighbor)) {
                neighbors[i] = neighbor;
            }
        }

        return neighbors;
    }

    createLine(start, end) {
        if (!this.check(start) || !this.check(end)) return false;

        let line = [];

        let endCenter = this.getHexCenter(end);

        let current = start;

        while(true) {
            line.push(current);

            if (current[0] == end[0] && current[1]== end[1]) return line;

            let angle = (this.getHexCenter(current)).directionTo(endCenter);
            angle = Math.floor(angle.toDeg() / 60);

            let neighbors = this.getHexNeighbors(current);
            let neighbor = neighbors[angle];
            if (!neighbor) {
                neighbor = neighbors[angle + 1];
            }
            if (!neighbor) {
                neighbor = neighbors[angle - 1];
            }
            if (!neighbor) return false;

            current = neighbor;
        }
    }

    createCircle(center, radius) {
        if (!this.check(center)) return false;

        let circle = [[center]];
        for (let i = 0; i < radius; i++) {
            circle[i+1] = [];
            for(let k = 0; k < circle[i].length; k++) {
                let neighbors = this.getHexNeighbors(circle[i][k]);
                if (neighbors.length < 1) continue;
                circle[i+1] = circle[i+1].concat(neighbors);
            }
        }

        let matrix = this.getEmptyMatrix();

        let result = [];
        for (let i = 0; i < circle.length; i++) for (let k = 0; k < circle[i].length; k++) {
            let hex = circle[i][k];
            if (!this.check(hex)) continue;
            if (matrix[hex[0]][hex[1]]) continue;
            matrix[hex[0]][hex[1]] = 1;
            result.push(hex);
        }

        return result;
    }

    findPath(start, finish, matrix) {
        if (!this.check(start) || !this.check(finish)) return false;

        if (start[0] == finish[0] && start[1] == finish[1]) return [start];

        let finishCenter = this.getHexCenter(finish),
            startCenter = this.getHexCenter(start);

        let finished = false;

        let open = [start],
            parents = this.getEmptyMatrix();

        let closed = [];
        for(let q = 0; q < this.columns; q++) {
            closed[q] = [].concat(matrix[q]);
        }

        let next;

        while(open.length) {
            var current;
            if (next) {
                current = next;
                next = false;
            } else {
                current = open.pop();
            }

            let currentCenter = this.getHexCenter(current);
            let price = currentCenter.distanceTo(finishCenter) /*+ currentCenter.distanceTo(startCenter)*/;

            let q = current[0],
                r = current[1];

            closed[q][r] = true;

            if (current[0] == finish[0] && current[1] == finish[1]) {
                finished = true;
                break;
            }

            let neighbors = this.getHexNeighbors(current);
            let minPrice = price;

            for (let i = 0; i < neighbors.length; i++) {
                let hex = neighbors[i];
                
                if (!hex) continue;

                let q = hex[0],
                    r = hex[1];

                if (closed[q][r]) continue;

                let hexCenter = this.getHexCenter(hex);
                let price = hexCenter.distanceTo(finishCenter) /*+ hexCenter.distanceTo(startCenter)*/;

                if (price < minPrice) {
                    minPrice = price;
                    next = hex;
                }

                open.push(hex);

                if (!parents[q][r]) {
                    parents[q][r] = current;
                }
            }
        }

        if (!finished) return false;

        let path = [finish];

        let j = 0;
        while(true) {
            j++;
            let q = current[0],
                r = current[1];

            current = parents[q][r];

            if (current[0] == start[0] && current[1]== start[1]) {
                break;
            }
            if (j>500) break;

            path.push(current);
        }

        path.push(start);

        path.reverse();
        return path;
    }
}
