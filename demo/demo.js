window.onload = function() {
    this.stop = false;

    this.canvas = document.getElementById("mainCanv");
    this.context = canvas.getContext('2d');    

    this.grid = new Grid(16, 10, 25); 

    this.start = grid.getHex(8, 5);
    this.finish = grid.getHex(14, 8);

    this.pfRes = [];

    this.mouse = new Mouse(canvas);

    canvas.addEventListener("click", function() {
        var hex = grid.findHex(mouse.position);
        if (hex && !stop) {
            hex.setBlocked(!hex.isBlocked());
        }
    });

    addEventListener("keydown", function(evt) {
        stop = !stop;
    });

    step();
}

function step() {
    requestAnimationFrame(step);

    context.fillStyle = "grey";
    context.fillRect(0, 0, 640, 480);

    grid.draw(context, "white");

    var hex = grid.findHex(mouse.position)
    if (hex && !stop) {
        hex.draw(context, "red");
    }

    var blockedHexes = grid.getBlockedHexes();
    if (blockedHexes) {
        blockedHexes.forEach(function(hex) {
            hex.draw(context, "black");
        });
    }

    start.draw(context, "orange");

    if (stop) { 
        if (hex) {
            hex.draw(context, "orange");
            var pfRes = grid.pathFind(start, hex, context);
        }
        
        if (pfRes) {
            pfRes.forEach(function(hex) {
                hex.draw(context, "blue");
            });
        }
    }
}