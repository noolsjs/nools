(function () {
    /*global $:true*/
    var declare = this.declare,
        arr = this.arrayExtended,
        unique = arr.unique;

    var allNine = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    if (typeof console === 'undefined') {
        console = {
            log: function () {
            }
        };
    }

    var SetOfNine = declare({
        instance: {

            free: null,
            count: 0,

            constructor: function () {
                this.count = (this.free = allNine.slice()).length;
            },

            blockValue: function (value) {
                var index = arr.indexOf(this.free, value);
                if (index !== -1) {
                    this.free.splice(index, 1);
                    this.count = this.free.length;
                }
                return this;
            },

            blockExcept: function (values) {
                this.free = values || [];
                this.count = this.free.length;
                return this;
            },

            freeValue: function () {
                return this.free[0];
            }
        }
    }).as(this, "SetOfNine");

    var CellGroup = SetOfNine.extend({
        instance: {
            cells: null,

            constructor: function () {
                this._super(arguments);
                this.cells = [];
            },

            addCell: function (cell) {
                this.cells.push(cell);
            }
        }
    }).as(this, "CellGroup");


    var CellFile = CellGroup.extend({
        instance: {
            number: null,

            constructor: function (number) {
                this._super(arguments);
                this.number = number;
            },

            toString: function () {
                var ret = [], cells = this.cells;
                for (var i = 0, l = cells.length; i < l; i++) {
                    ret.push(cells[i].toString());
                }
                return ret.join(", ");
            }
        }
    }).as(this, "CellFile");

    var Cell = SetOfNine.extend({
        instance: {
            value: null,
            cellRow: null,
            cellCol: null,
            cellSqr: null,
            exCells: null,
            el: null,

            constructor: function () {
                this._super(arguments);
                this.exCells = [];
            },

            makeReferences: function (cr, col, sqr) {
                this.cellRow = cr;
                this.cellCol = col;
                this.cellSqr = sqr;
                this.colNo = col.number;
                this.rowNo = cr.number;
                this.exCells = unique(this.exCells.concat(cr.cells).concat(col.cells).concat(sqr.cells));
                this.exCells.splice(this.exCells.indexOf(this), 1);
                return this;
            },

            toString: function () {
                return [this.posAsString(), this.valueAsString()].join(": ");
            },

            valueAsString: function () {
                return this.value === null ? " " : this.value;
            },

            posAsString: function () {
                return ["[", this.cellRow.number, ",", this.cellCol.number, "]"].join("");
            }
        }
    }).as(this, "Cell");

    var CellCol = CellFile.extend({
        instance: {
            toString: function () {
                return ["Column ", this.number, ": ", this._super(arguments)];
            }
        }
    }).as(this, "CellCol");


    var CellRow = CellFile.extend({
        instance: {
            toString: function () {
                return ["Row ", this.number, ": ", this._super(arguments)];
            }
        }
    }).as(this, "CellRow");

    var CellSqr = CellGroup.extend({
        instance: {
            constructor: function (cr1, cr2, cr3, cc1, cc2, cc3) {
                this._super(arguments);
                for (var i = cr1.number; i <= cr3.number; i++) {
                    this.addCell(cc1.cells[i]);
                    this.addCell(cc2.cells[i]);
                    this.addCell(cc3.cells[i]);
                }

            }
        }
    }).as(this, "CellSqr");

    var Counter = declare({
        instance: {
            count: 0,
            constructor: function (count) {
                this.count = count;
            }
        }
    }).as(this, "Counter");


    var Setting = declare({
        instance: {
            rowNo: null,
            colNo: null,
            value: null,

            constructor: function (row, col, value) {
                this.rowNo = row;
                this.colNo = col;
                this.value = value;
            },

            toString: function () {
                return "Setting [" + this.rowNo + "," + this.colNo + "] : " + this.value;
            }

        }
    }).as(this, "Setting");


    var Stepping = declare({
        instance: {
            emergency: false
        }
    }).as(this, "Stepping");

    var Sudoku = declare({
        instance: {

            constructor: function (flow, statsListener) {
                this.rows = [];
                this.cols = [];
                this.sqrs = [];
                this.cells = [];
                this.flow = flow;
                this.statsListener = statsListener;
                this.session = null;
                this.stepping = null;
            },

            stop: function () {
                if (this.session) {
                    this.session.halt();
                    this.session.dispose();
                }
                return this;
            },

            clear: function () {
                this.stop();
                this.setCellValues([]);
            },

            step: function () {
                if (!this.invalid) {
                    this.session.modify(this.counter, function () {
                        this.count = 1;
                    });
                    if (!this.stepping) {
                        this.session.assert(new Stepping());
                    }
                    return this.session.matchUntilHalt(function (err) {
                        if (err) {
                            console.log(err);
                        }
                    });
                }
            },

            solve: function () {
                if (!this.invalid) {
                    this.session.modify(this.counter, function () {
                        this.count = Infinity;
                    });
                    if (this.stepping) {
                        this.session.retract(this.stepping);
                    }
                    return this.session.match(function (err) {
                        if (err) {
                            console.log(err);
                        }
                    });
                }
            },

            setCellValue: function setCellValue(cell) {
                cell.el.text(cell.value ? cell.value : "");
                return cell;
            },

            create: function () {
                var grid;
                (grid = $("#grid")).empty();
                var rows = this.rows, cols = this.cols, sqrs = this.sqrs, session = this.session;
                for (var i = 0; i < 9; i++) {
                    session.assert(i + 1);
                    rows[i] = new CellRow(i);
                    cols[i] = new CellCol(i);
                }

                var cells = this.cells = [], iCol;
                for (var iRow = 0; iRow < 9; iRow++) {
                    var rowDom = $("<div/>").addClass("row").appendTo(grid);
                    cells[iRow] = [];
                    for (iCol = 0; iCol < 9; iCol++) {
                        var cell = cells[iRow][iCol] = new Cell();
                        cell.el = $("<div class='col'></div>").appendTo(rowDom);
                        rows[iRow].addCell(cell);
                        cols[iCol].addCell(cell);
                    }
                }

                for (i = 0; i < 3; i++) {
                    sqrs[i] = [];
                    for (var j = 0; j < 3; j++) {
                        sqrs[i][j] = new CellSqr(rows[i * 3], rows[i * 3 + 1], rows[i * 3 + 2],
                            cols[j * 3], cols[j * 3 + 1], cols[j * 3 + 2]);
                    }
                }

                for (iRow = 0; iRow < 9; iRow++) {
                    for (iCol = 0; iCol < 9; iCol++) {
                        session.assert(cells[iRow][iCol].makeReferences(rows[iRow], cols[iCol], sqrs[Math.floor(iRow / 3)][Math.floor(iCol / 3)]));
                    }
                    session.assert(rows[iRow]);
                    session.assert(cols[iRow]);
                    session.assert(sqrs[Math.floor(iRow / 3)][iRow % 3]);
                }
                return this;
            },

            setCellValues: function (cellValues) {
                this.stop();
                var session = (this.session = this.statsListener.listen(this.flow.getSession()))
                    .on("set-value", this.setCellValue);

                var s000 = new Setting(0, 0, 0);
                this.session.assert(s000);
                this.create();

                var initial = 0;
                for (var iRow = 0; iRow < 9; iRow++) {
                    var row = cellValues[iRow] || [];
                    for (var iCol = 0; iCol < 9; iCol++) {
                        var value = row[iCol] || null;
                        if (value) {
                            session.assert(new Setting(iRow, iCol, value));
                            initial++;
                        }
                    }
                }
                var counter = this.counter = new Counter(initial);
                this.session.assert(counter);
                this.session.retract(s000);
                return this.session.matchUntilHalt(function (err) {
                    if (err) {
                        console.log(err);
                    }
                    this.dumpGrid();
                }.bind(this));
            },

            dumpGrid: function () {
                var cells = this.cells;
                var print = ["       "];
                for (var iCol = 0; iCol < 9; iCol++) {
                    print.push("Col: " + iCol + "     ");
                }
                console.log(print.join(""));
                for (var iRow = 0; iRow < 9; iRow++) {
                    print = ["Row " + (iRow) + ": "];
                    for (iCol = 0; iCol < 9; iCol++) {
                        if (cells[iRow][iCol].value !== null) {
                            print.push(" --- " + cells[iRow][iCol].value + " --- ");
                        } else {
                            var perms = cells[iRow][iCol].free, sb = [];
                            for (var i = 1; i <= 9; i++) {
                                if (perms.indexOf(i) !== -1) {
                                    sb.push(i);
                                } else {
                                    sb.push(' ');
                                }
                            }
                            print.push(" %          " + sb.join(""));
                        }
                    }
                    console.log(print.join(""));
                }
            },

            setInvalidCellValue: function setCellValue(cell) {
                this.invalid = true;
                cell.el.addClass("error");
                return cell;
            },

            validate: function () {
                this.invalid = false;
                this.session.assert("validate");
                return this.session.focus("validate")
                    .on("invalid", this.setInvalidCellValue)
                    .matchUntilHalt();
            }

        }
    });

    this.Sudoku = Sudoku;
}).call(this);










