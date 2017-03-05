function Hexagon(q, r, center, size) {
    var width = size*2;
    var height = Math.round(Math.sqrt(3)/2 * width);

    var blocked = false;

    var vertexes = [];

    for (var i = 0; i < 6; i++) {
        var angle = (i*60).toRad();
        vertexes[i] = new Point(
            Math.round(center.x + size * Math.cos(angle)),
            Math.round(center.y + size * Math.sin(angle))
        );
    }

    this.getQ = function() {
        return q;
    }

    this.getR = function() {
        return r;
    }

    this.getCenter = function() {
        return center;
    }

    this.draw = function(context, style, text) {
        context.strokeStyle = style;
        context.beginPath();
        context.moveTo(vertexes[0].x, vertexes[0].y);
        for(var i = 1; i < 6; i++) {
            context.lineTo(vertexes[i].x, vertexes[i].y);
        }
        context.closePath();
        context.stroke();   
        if (text) {
            context.font = "12px sans-serif";
            context.fillStyle = style;
            context.fillText(text, center.x - size/2, center.y);
        }
    }

    this.distanceTo = function(object) {
        if (object instanceof Point) {
            return center.distanceTo(object);
        } else if (object instanceof Hexagon) {
            return object.getCenter().distanceTo(center);
        }
    }

    this.inContact = function(hex) {
        var dist = this.distanceTo(hex);    
        return (dist < size*2);        
    }

    this.setBlocked = function(state) {
        blocked = state;
    }

    this.isBlocked = function() {
        return blocked;
    }

    this.equal = function(hex) {
        return (q == hex.getQ() && r == hex.getR());
    }
}

function Grid(colums, rows, hexSize) {
    var hexWidth = hexSize*2;
    var hexHeight = Math.round(Math.sqrt(3)/2 * hexWidth);
    var offset = new Point(hexWidth/2, hexHeight/2);
    
    var hexGrid = [];
    
    for (var q = 0; q < colums; q++) {
        hexGrid[q] = [];
        for(var r = 0; r < rows; r++) {
            var center = new Point(
                offset.x + q * 3/4 * hexWidth,
                Math.round(offset.y + r * hexHeight + (q&1) * (hexHeight/2))
            );

            hexGrid[q][r] = new Hexagon(q, r, center, hexSize);
        }
    }

    this.getHex = function(q, r) {
        if (q >= 0 && q < colums && r >= 0 && r < rows)
            return hexGrid[q][r];
    }

    this.draw =  function(context, style) {
        for (var q = 0; q < colums; q++) {
            for(var r = 0; r < rows; r++) {
                hexGrid[q][r].draw(context, style);
            }
        }
    }

    this.findNeighbors = function(hex) {
        var q = hex.getQ();
        var r = hex.getR();

        var hexes = [];

        if (q%2 == 1) {
            hexes = [
                {"q": q, "r": r-1},
                {"q": q-1, "r": r+1},
                {"q": q+1, "r": r},
                {"q": q, "r": r+1},
                {"q": q+1, "r": r+1},
                {"q": q-1, "r": r}
            ];    
        } else {  
            hexes = [
                {"q": q, "r": r-1},
                {"q": q-1, "r": r-1},
                {"q": q-1, "r": r},
                {"q": q, "r": r+1},
                {"q": q+1, "r": r-1},
                {"q": q+1, "r": r}
            ];   
        }

        var hexes2 = [];

        for (var i = 0; i < hexes.length; i++) {
             var hex = this.getHex(hexes[i].q, hexes[i].r);
             if (hex) {
                 hexes2[i] = hex;
             }
        }

        return hexes2;
    }

    this.findHex = function(point) {
        var rectW = hexWidth * 0.75;
        var rectH = hexHeight;
        var q = Math.floor((point.x - 0.125 * rectW) / rectW);
        var r = Math.floor((point.y - 0.5 * rectH * (q&1))/ rectH);
        return this.getHex(q, r);
    }

    this.getBlockedHexes = function() {
        var hexes = [];
        for (var q = 0; q < colums; q++) {
            for(var r = 0; r < rows; r++) {
                var hex = hexGrid[q][r];
                if (hex.isBlocked()) {
                    hexes.push(hex);
                }
            }
        }
        return hexes;
    }

    this.getUnblockedHexes = function() {
        var hexes = [];
        for (var q = 0; q < colums; q++) {
            for(var r = 0; r < rows; r++) {
                var hex = hexGrid[q][r];
                if (!hex.isBlocked()) {
                    hexes.push(hex);
                }
            }
        }
        return hexes;
    } 

    this.pathFind = function(start, finish) {

        var open = [];
        var closed = [];
        var parents = [];

        for (var q = 0; q < colums; q++) {
            closed[q] = [];
            parents[q] = [];
            for(var r = 0; r < rows; r++) {
                closed[q][r] = false;
                parents[q][r] = false;
            }
        }

        var blocked = this.getBlockedHexes();
        for (var i = 0; i < blocked.length; i++) {
            var q = blocked[i].getQ();
            var r = blocked[i].getR();
            closed[q][r] = true;
        }

        open.push(start);

        var finished = false;
        var next = false;
        var k = 0; 

        while(open.length) {
            k++;

            var current;
            if (next) {
                current = next;
                next = false;
            } else {
                current = open.pop();
            }

            var price = current.distanceTo(finish);

            var q = current.getQ();
            var r = current.getR();

            closed[q][r] = true;

            if (current.equal(finish)) {
                finished = true;
                break;
            }

            var neighbors = this.findNeighbors(current);
            var minPrice = price;

            for (var i = 0; i < neighbors.length; i++) {
                var hex = neighbors[i];
                
                if (!hex) continue;

                var q = hex.getQ();
                var r = hex.getR();

                if (hex.isBlocked()) continue;
                if (closed[q][r]) continue;

                var price = hex.distanceTo(finish);  

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
        console.log(k);
        console.log(finished);

        var path = [];

        var j =  0;
        while(true) {
            j++;
            var q = current.getQ();
            var r = current.getR();

            current = parents[q][r];

            if (current.equal(start)) {
                break;
            }
            if (j>500) break;

            path.push(current);
        }

        console.log(path);
        return path;    
    }

}