(function () {
    var Cell = this.Cell = function (row, col, colDepth) {
        this.col = col;
        this.row = row;
        this.colDepth = colDepth;
        this.neighbors = [];
    };

    var proto = Cell.prototype;
    proto.state = "dead";
    proto.evaluated = false;
    proto.__queuedState = null;

    proto.numberOfLiveNeighbors = function () {
        var live = 0, neighbors = this.neighbors, neighbor;
        for (var i = 0, l = neighbors.length; i < l; i++) {
            if (neighbors[i].state === "live") {
                live++;
            }
        }
        return live;
    };

    proto.addNeighbor = function (neighbor) {
        if (neighbor !== this && this.neighbors.indexOf(neighbor === -1)) {
            this.neighbors.push(neighbor);
            neighbor.neighbors.push(this);
            return this;
        } else {
            throw new Error("duplicate neighbor");
        }
    };

    proto.queueNextState = function (state) {
        if (this.state !== state) {
            this.__queuedState = state;
        }
    };

    proto.shouldTransition = function () {
        return this.__queuedState !== null;
    };

    proto.transition = function () {
        var ret = false;
        if (this.shouldTransition()) {
            this.state = this.__queuedState;
            this.__queuedState = null;
            ret = true;
        }
        return ret;
    };

    this.loop = function loop(cells, cb) {
        var rows = cells.length, cols = cells[0].length;
        for (var i = 0; i < rows; i++) {
            for (var j = 0; j < cols; j++) {
                cb(cells[i][j], i, j, cells);
            }
        }
    };


}).call(this);