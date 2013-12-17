var nools = require("../../index.js"),
    sudoku = require("./lib/sudoku");

var flow = nools.compile(require.resolve("./lib/rules/sudoku.nools"), {
    define: {
        CellGroup: sudoku.CellGroup,
        Cell: sudoku.Cell,
        CellCol: sudoku.CellCol,
        CellRow: sudoku.CellCol,
        CellSqr: sudoku.CellSqr,
        Counter: sudoku.Counter,
        Setting: sudoku.Setting,
        Stepping: sudoku.Stepping
    },
    scope: {
        explain: true
    }
});


var simple = [
    [null, 5, 6, 8, null, 1, 9, 4, null],
    [9, null, null, 6, null, 5, null, null, 3],
    [7, null, null, 4, 9, 3, null, null, 8],
    [8, 9, 7, null, 4, null, 6, 3, 5],
    [null, null, 3, 9, null, 6, 8, null, null],
    [4, 6, 5, null, 8, null, 2, 9, 1],
    [5, null, null, 2, 6, 9, null, null, 7],
    [6, null, null, 5, null, 4, null, null, 9],
    [null, 4, 9, 7, null, 8, 3, 5, null]
];

var medium = [
    [8, 4, 7, null, null, null, 2, 5, 6],
    [5, null, null, null, 8, null, null, null, 4],
    [2, null, null, null, 7, null, null, null, 8],
    [null, null, null, 3, null, 8, null, null, null],
    [null, 5, 1, null, null, null, 8, 7, 2],
    [null, null, null, 5, null, 7, null, null, null],
    [4, null, null, null, 5, null, null, null, 7],
    [6, null, null, null, 3, null, null, null, 9],
    [1, 3, 2, null, null, null, 4, 8, 5]
];

var hard1 = [
    [null, null, null, null, 5, 1, null, 8, null],
    [null, 8, null, null, 4, null, null, null, 5],
    [null, null, 3, null, null, null, 2, null, null],
    [null, null, null, null, 6, null, null, null, 9],
    [6, 7, null, 4, null, 9, null, 1, 3],
    [8, null, null, null, 3, null, null, null, null],
    [null, null, 2, null, null, null, 4, null, null],
    [5, null, null, null, 9, null, null, 2, null],
    [null, 9, null, 7, 1, null, null, null, null]
];

var hard2 = [
    [null, null, null, 6, null, null, 1, null, null],
    [null, null, null, null, null, 5, null, null, 6],
    [5, null, 7, null, null, null, 2, 3, null],
    [null, 8, null, 9, null, 7, null, null, null],
    [9, 3, null, null, null, null, null, 6, 7],
    [null, null, null, 4, null, 6, null, 1, null],
    [null, 7, 4, null, null, null, 9, null, 1],
    [8, null, null, 7, null, null, null, null, null],
    [null, null, 3, null, null, 8, null, null, null]
];

var hard3 = [
    [null, 8, null, null, null, 6, null, null, 5],
    [2, null, null, null, null, null, 4, 8, null],
    [null, null, 9, null, null, 8, null, 1, null],
    [null, null, null, null, 8, null, 1, null, 2],
    [null, null, null, 3, null, 1, null, null, null],
    [6, null, 1, null, 9, null, null, null, null],
    [null, 9, null, 4, null, null, 8, null, null],
    [null, 7, 6, null, null, null, null, null, 3],
    [1, null, null, 7, null, null, null, 5, null]
];

var hard4 = [
    [null, null, null, null, null, 4, null, 9, 5],
    [6, 7, null, 5, null, null, null, 1, null],
    [null, null, null, 6, null, 9, null, null, null],
    [null, 2, null, null, null, null, 4, null, null],
    [8, 1, null, null, null, null, null, 7, 2],
    [null, null, 7, null, null, null, null, 8, null],
    [null, null, null, 3, null, 5, null, null, null],
    [null, 6, null, null, null, 1, null, 5, 8],
    [7, 3, null, 9, null, null, null, null, null]
];

var sud = new sudoku.Sudoku(flow);
var repl = require("repl");
sud.setCellValues(hard3).then(function () {
    var sudokuRepl = repl.start("sudoku>>");
    sudokuRepl.context.print = sud.dumpGrid.bind(sud);
    sudokuRepl.context.step = function () {
        sud.step().classic(function (err) {
            if (err) {
                console.log(err.stack);
            } else {
                sud.dumpGrid();
            }
        });
    };
    sudokuRepl.context.solve = function () {
        sud.solve().classic(function (err) {
            if (err) {
                console.log(err.stack);
            } else {
                sud.dumpGrid();
            }
            process.exit();
        });
    };
});




