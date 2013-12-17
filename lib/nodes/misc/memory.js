var extd = require("../../extended"),
    plucker = extd.plucker,
    declare = extd.declare,
    getMemory = require("./helpers").getMemory,
    Table = require("./table"),
    TupleEntry = require("./tupleEntry");


var id = 0;
declare({

    instance: {
        length: 0,

        constructor: function () {
            this.head = null;
            this.tail = null;
            this.indexes = [];
            this.tables = new TupleEntry(null, new Table(), false);
        },

        push: function (data) {
            var tail = this.tail, head = this.head, node = {data: data, tuples: [], hashCode: id++, prev: tail, next: null};
            if (tail) {
                this.tail.next = node;
            }
            this.tail = node;
            if (!head) {
                this.head = node;
            }
            this.length++;
            this.__index(node);
            this.tables.addNode(node);
            return node;
        },

        remove: function (node) {
            if (node.prev) {
                node.prev.next = node.next;
            } else {
                this.head = node.next;
            }
            if (node.next) {
                node.next.prev = node.prev;
            } else {
                this.tail = node.prev;
            }
            this.tables.removeNode(node);
            this.__removeFromIndex(node);
            this.length--;
        },

        forEach: function (cb) {
            var head = {next: this.head};
            while ((head = head.next)) {
                cb(head.data);
            }
        },

        toArray: function () {
            return this.tables.tuples.slice();
        },

        clear: function () {
            this.head = this.tail = null;
            this.length = 0;
            this.clearIndexes();
        },

        clearIndexes: function () {
            this.tables = {};
            this.indexes.length = 0;
        },

        __index: function (node) {
            var data = node.data,
                factHash = data.factHash,
                indexes = this.indexes,
                entry = this.tables,
                i = -1, l = indexes.length,
                tuples, index, val, path, tables, currEntry, prevLookup;
            while (++i < l) {
                index = indexes[i];
                val = index[2](factHash);
                path = index[0];
                tables = entry.tables;
                if (!(tuples = (currEntry = tables[path] || (tables[path] = new Table())).get(val))) {
                    tuples = new TupleEntry(val, currEntry, true);
                    currEntry.set(val, tuples);
                }
                if (currEntry !== prevLookup) {
                    node.tuples.push(tuples.addNode(node));
                }
                prevLookup = currEntry;
                if (index[4] === "eq") {
                    entry = tuples;
                }
            }
        },

        __removeFromIndex: function (node) {
            var tuples = node.tuples, i = tuples.length;
            while (--i >= 0) {
                tuples[i].removeNode(node);
            }
            node.tuples.length = 0;
        },

        getMemory: function (tuple) {
            var ret;
            if (!this.length) {
                ret = [];
            } else {
                ret = getMemory(this.tables, tuple.factHash, this.indexes);
            }
            return ret;
        },

        __createIndexTree: function () {
            var table = this.tables.tables = {};
            var indexes = this.indexes;
            table[indexes[0][0]] = new Table();
        },


        addIndex: function (primary, lookup, op) {
            this.indexes.push([primary, lookup, plucker(primary), plucker(lookup), op || "eq"]);
            this.indexes.sort(function (a, b) {
                var aOp = a[4], bOp = b[4];
                return aOp === bOp ? 0 : aOp > bOp ? 1 : aOp === bOp ? 0 : -1;
            });
            this.__createIndexTree();

        }

    }

}).as(module);