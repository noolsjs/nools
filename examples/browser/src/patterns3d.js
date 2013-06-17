(function () {
    var patterns = {
        none: function (rows, cols, depth) {
            var ret = [], row, col;
            for (var i = 0; i < rows; i++) {
                row = ret[i] = [];
                for (var j = 0; j < cols; j++) {
                    col = row[j] = [];
                    for (var k = 0; k < depth; k++) {
                        col[k] = false;
                    }
                }
            }
            return ret;
        },

        random: function (rows, cols, depth) {
            var ret = [], row, col;
            for (var i = 0; i < rows; i++) {
                row = ret[i] = [];
                for (var j = 0; j < cols; j++) {
                    col = row[j] = [];
                    for (var k = 0; k < depth; k++) {

                        col[k] = Math.floor(Math.random() * 20) === 1;
                    }
                }
            }
            return ret;
        },

        cells: function (rows, cols, depth) {
            var ret = [], row, col;
            for (var i = 0; i < rows; i++) {
                row = ret[i] = [];
                for (var j = 0; j < cols; j++) {
                    col = row[j] = [];
                    for (var k = 0; k < depth; k++) {
                        console.log(Math.abs(Math.sin((k * Math.PI))) * 1e16);
                        col[k] = (k * j) % 4 == 0;
                    }
                }
            }
            return ret;
        },

        posts: function (rows, cols, depth) {
            var ret = [], row, col;
            for (var i = 0; i < rows; i++) {
                row = ret[i] = [];
                for (var j = 0; j < cols; j++) {
                    col = row[j] = [];
                    for (var k = 0; k < depth; k++) {
                        col[k] = (i * j) % 2 == 1;
                    }
                }
            }
            return ret;
        },

        pattern1: function (rows, cols, depth) {
            var ret = [], row, col;
            for (var i = 0; i < rows; i++) {
                row = ret[i] = [];
                for (var j = 0; j < cols; j++) {
                    col = row[j] = [];
                    for (var k = 0; k < depth; k++) {
                        col[k] = Math.round(Math.abs(Math.sin((j * k))) * 1e16) % 4 === 0;
                    }
                }
            }
            return ret;
        },

        pattern2: function (rows, cols, depth) {
            var ret = [], row, col;
            for (var i = 0; i < rows; i++) {
                row = ret[i] = [];
                for (var j = 0; j < cols; j++) {
                    col = row[j] = [];
                    for (var k = 0; k < depth; k++) {
                        col[k] = Math.round(Math.abs(Math.sin((j * k))) * 1e16) % 4 === 1;
                    }
                }
            }
            return ret;
        },

        pattern3: function (rows, cols, depth) {
            var ret = [], row, col;
            for (var i = 0; i < rows; i++) {
                row = ret[i] = [];
                for (var j = 0; j < cols; j++) {
                    col = row[j] = [];
                    for (var k = 0; k < depth; k++) {
                        col[k] = Math.round(Math.abs(Math.sin((j * k))) * 1e16) % 4;
                    }
                }
            }
            return ret;
        },

        pattern4: function (rows, cols, depth) {
            var ret = [], row, col;
            for (var i = 0; i < rows; i++) {
                row = ret[i] = [];
                for (var j = 0; j < cols; j++) {
                    col = row[j] = [];
                    for (var k = 0; k < depth; k++) {
                        col[k] = (k * i) < Math.log(rows * cols);
                    }
                }
            }
            return ret;
        },

        pattern5: function (rows, cols, depth) {
            var ret = [], row, col;
            for (var i = 0; i < rows; i++) {
                row = ret[i] = [];
                for (var j = 0; j < cols; j++) {
                    col = row[j] = [];
                    for (var k = 0; k < depth; k++) {
                        col[k] = (k * i) > Math.log(rows * cols);
                    }
                }
            }
            return ret;
        },


        killLonely: function (rows, cols, depth) {
            var ret = [], row, col;
            for (var i = 0; i < rows; i++) {
                row = ret[i] = [];
                for (var j = 0; j < cols; j++) {
                    col = row[j] = [];
                    for (var k = 0; k < depth; k++) {
                        col[k] = true;
                    }
                }
            }
            return ret;
        },

        border: function (rows, cols, depth) {
            var ret = [], row, col;
            for (var i = 0; i < rows; i++) {
                row = ret[i] = [];
                for (var j = 0; j < cols; j++) {
                    col = row[j] = [];
                    for (var k = 0; k < depth; k++) {
                        if (i === 0 && (j === 0 || j === cols - 1)) {
                            col[k] = true;
                        } else if (i === rows - 1 && (j === 0 || j === cols - 1)) {
                            col[k] = true;
                        } else if ((i === 0 || i === rows - 1) && (k === 0 || k === depth - 1)) {
                            col[k] = true;
                        } else if ((j === 0 || j === rows - 1) && (k === 0 || k === depth - 1)) {
                            col[k] = true;
                        } else {
                            col[k] = false;
                        }
                    }
                }
            }
            return ret;
        },

        box: function (rows, cols, depth) {
            var ret = [], row, col;
            for (var i = 0; i < rows; i++) {
                row = ret[i] = [];
                for (var j = 0; j < cols; j++) {
                    col = row[j] = [];
                    for (var k = 0; k < depth; k++) {
                        if (i === 0 && (j === 0 || j === cols - 1)) {
                            col[k] = true;
                        } else if (i === rows - 1 && (j === 0 || j === cols - 1)) {
                            //col[k] = true;
                        } else if ((i === 0) && (k === 0 || k === depth - 1)) {
                            col[k] = true;
                        }
                    }
                }
            }
            return ret;
        },

        "beacon": function (rows, cols, depth) {
            var beacon1 = [true, true, true, false, false],
                beacon2 = [true, false, true, false, false];
            var base = [
                [
                    [],
                    []
                ],
                [],
                []
            ];
            for (var i = 0; i < cols; i += 3) {
                for (var j = 0; j < depth; j += beacon1.length) {
                    base[0][0] = base[0][0].concat(beacon1);
                    base[0][1] = base[0][1].concat(beacon2);
                }
            }
            var ret = [];
            for (i = 0; i < rows; i += base.length) {
                ret = ret.concat(base);
            }
            return ret;
        }
    };
    if ("undefined" !== typeof exports) {
        if ("undefined" !== typeof module && module.exports) {
            module.exports = patterns;
        }
    } else {
        this.patterns = patterns;
    }

}).call(this);