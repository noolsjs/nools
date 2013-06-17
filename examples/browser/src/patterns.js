(function () {
    var patterns = {


        "hi": function (rows, cols) {
            return [
                [true, false, false, false, true, false, false, true, true, true, true, true, true, true],
                [true, false, false, false, true, false, false, false, false, false, true, false, false, false],
                [true, false, false, false, true, false, false, false, false, false, true, false, false, false],
                [true, false, false, false, true, false, false, false, false, false, true, false, false, false],
                [true, true, true, true, true, false, false, false, false, false, true, false, false, false],
                [true, false, false, false, true, false, false, false, false, false, true, false, false, false],
                [true, false, false, false, true, false, false, false, false, false, true, false, false, false],
                [true, false, false, false, true, false, false, false, false, false, true, false, false, false],
                [true, false, false, false, true, false, false, true, true, true, true, true, true, true]
            ];
        },

        "border": function (rows, cols) {
            var ret = [], i, j;
            for (i = 0; i < rows; i++) {
                ret[i] = [];
                for (j = 0; j < cols; j++) {
                    ret[i][j] = (i === 0 || (j === 0) || i === rows - 1 || j === cols - 1);
                }
            }
            return ret;
        },

        "pulsar": function (rows, cols) {
            return [
                [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
                [false, false, false, true, true, true, false, false, false, true, true, true, false, false, false],
                [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
                [false, true, false, false, false, false, true, false, true, false, false, false, false, true, false],
                [false, true, false, false, false, false, true, false, true, false, false, false, false, true, false],
                [false, true, false, false, false, false, true, false, true, false, false, false, false, true, false],
                [false, false, false, true, true, true, false, false, false, true, true, true, false, false, false],
                [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
                [false, false, false, true, true, true, false, false, false, true, true, true, false, false, false],
                [false, true, false, false, false, false, true, false, true, false, false, false, false, true, false],
                [false, true, false, false, false, false, true, false, true, false, false, false, false, true, false],
                [false, true, false, false, false, false, true, false, true, false, false, false, false, true, false],
                [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
                [false, false, false, true, true, true, false, false, false, true, true, true, false, false, false],
                [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false]
            ];
        },

        "glider": function (rows, cols) {
            return [
                [false, false, false, false, false],
                [false, false, true, false, false],
                [false, false, false, true, false],
                [false, true, true, true, false],
                [false, false, false, false, false]
            ];
        },

        "pentadecathalon": function (rows, cols) {
            return [
                [true, true, true, true, true, true, true, true, true]
            ];
        },

        "blinker": function (rows, cols) {
            return [
                [false, true, false],
                [false, true, false],
                [false, true, false]
            ];
        },

        "beacon": function (rows, cols) {
            return [
                [false, true, true, false, false, false],
                [false, true, true, false, false, false],
                [false, false, false, true, true, false],
                [false, false, false, true, true, false]
            ];
        },

        gliderGun: function (rows, cols) {
            return [
                [false],
                [false],
                [false],
                [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false,
                    false, false, false, false, false, false, false, true, true, false, false, false, false, false, false, false, false,
                    false, true, true, false, false],
                [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false,
                    false, false, false, false, false, false, true, false, true, false, false, false, false, false, false, false, false,
                    false, true, true, false, false],
                [ true, true, false, false, false, false, false, false, false, true, true, false, false, false, false, false, false,
                    false, false, false, false, false, true, true, false, false, false, false, false, false, false, false, false, false,
                    false, false, false, false],
                [ true, true, false, false, false, false, false, false, true, false, true, false, false, false, false, false, false,
                    false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false,
                    false, false, false, false, false],
                [false, false, false, false, false, false, false, false, true, true, false, false, false, false, false, false, true,
                    true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false,
                    false, false, false, false, false],
                [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false,
                    true, false, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false,
                    false, false, false, false, false],
                [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false,
                    true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false,
                    false, false, false, false, false, false],
                [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false,
                    false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false,
                    false, false, false, true, true, false],
                [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false,
                    false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false,
                    false, false, false, true, false, true],
                [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false,
                    false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false,
                    false, false, false, true, false, false],
                [false],
                [false],
                [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false,
                    false, false, false, false, false, false, false, false, true, true, true, false, false, false, false, false, false,
                    false, false, false, false, false],
                [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false,
                    false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false,
                    false, false, false, false, false, false],
                [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false,
                    false, false, false, false, false, false, false, false, false, true, false, false, false, false, false, false,
                    false, false, false, false, false, false],
            ];
        },

        random: function (rows, cols) {
            var ret = [], row;
            for (var i = 0; i < rows; i++) {
                row = ret[i] = [];
                for (var j = 0; j < cols; j++) {
                    row[j] = Math.round(Math.random());
                }
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