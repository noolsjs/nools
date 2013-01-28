"use strict";

var nools = require("../.."),
    p = require("promise-extended"),
    patterns = require("./patterns");


var flow = nools.compile(__dirname + "/rules/conways.nools"),
    Cell = flow.getDefined("Cell");

var run = (function () {

    var cells = [], rows = 30, cols = 30;

    function print() {
        var str = [];
        console.log("\x1b[2J\x1b[H");
        for (var i = 0; i < rows; i++) {
            var row = [];
            for (var j = 0; j < cols; j++) {
                if (cells[i][j].state === "live") {
                    row.push("#");
                } else {
                    row.push(" ");
                }
            }
            str.push(row.join(" "));
        }
        console.log(str.join("\n"));
    }

    function addCell(row, col, cell) {
        if (!cells[row]) {
            cells[row] = [];
        }
        cells[row][col] = cell;
        return cell;
    }

    function createPattern(pattern) {
        var cell;
        for (var i = 0; i < rows; i++) {
            for (var j = 0; j < cols; j++) {
                cell = addCell(i, j, new Cell());
                if (pattern[i] && pattern[i][j]) {
                    cell.state = "live";
                }
                if (i > 0) {
                    cell.addNeighbor(cells[i - 1][j]);
                    if (j <= (cols - 2)) {
                        // neighbor to the northeast
                        cell.addNeighbor(cells[i - 1][j + 1]);
                    }
                }
                if (j > 0) {
                    // neighbor to the west
                    cell.addNeighbor(cells[i][j - 1]);
                    if (i > 0) {
                        // neighbor to the northwest
                        cell.addNeighbor(cells[i - 1][j - 1]);
                    }
                }
            }
        }
        return cell;
    }

    return function (pattern) {
        createPattern(pattern);
        var session = flow.getSession("populate", cells);
        session.on("evaluate", print);
        return session.match().then(function () {
            print();
            session.dispose();
        });
    };
}());

var pattern = process.argv.slice(2)[0] || "hi";
run(patterns[pattern]).addErrback(function (err) {
    console.log(err.stack);
});

