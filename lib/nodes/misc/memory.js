var extd = require("../../extended"),
    indexOf = extd.indexOf,
    plucker = extd.plucker,
    difference = extd.diffArr,
    pPush = Array.prototype.push,
    declare = extd.declare,
    HashTable = extd.HashTable;
declare({

    instance: {
        constructor: function () {
            this.head = null;
            this.tail = null;
            this.length = null;
            this.indexes = [];
            this.tables = {tuples: [], tables: []};
        },

        inequalityThreshold: 0.5,

        push: function (data) {
            var tail = this.tail, head = this.head, node = {data: data, prev: tail, next: null};
            if (tail) {
                this.tail.next = node;
            }
            this.tail = node;
            if (!head) {
                this.head = node;
            }
            this.length++;
            this.__index(node);
            this.tables.tuples.push(node);
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
            var index = indexOf(this.tables.tuples, node);
            if (index !== -1) {
                this.tables.tuples.splice(index, 1);
            }
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
            var head = {next: this.head}, ret = [];
            while ((head = head.next)) {
                ret.push(head);
            }
            return ret;
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
                currEntry = tables[path];
                if (!currEntry) {
                    currEntry = tables[path] = new HashTable();
                    tuples = {tuples: [node], tables: {}};
                    currEntry.put(val, tuples);
                } else if (!(tuples = currEntry.get(val))) {
                    tuples = {tuples: [node], tables: {}};
                    currEntry.put(val, tuples);
                } else if (prevLookup !== path) {
                    tuples.tuples.push(node);
                }
                prevLookup = path;
                if (index[4] === "eq") {
                    entry = tuples;
                }
            }
        },

        getSimilarMemory: function (tuple) {
            return this.getMemory(tuple, true);
        },

        __removeFromIndex: function (node) {
            var data = node.data,
                factHash = data.factHash,
                indexes = this.indexes,
                entry = this.tables,
                i = -1, l = indexes.length;
            while (++i < l) {
                var index = indexes[i],
                    val = index[2](factHash);
                var currEntry = entry.tables[index[0]];
                if (currEntry) {
                    var tuples = currEntry.get(val);
                    if (tuples) {
                        var currTuples = tuples.tuples, ind = indexOf(currTuples, node);
                        if (ind !== -1) {
                            currTuples.splice(ind, 1);
                        }
                        if (index[4] === "eq") {
                            entry = tuples;
                        }
                    }
                }
            }
        },

        getMemory: function (tuple, usePrimary) {
            var factHash = tuple.factHash,
                indexes = this.indexes,
                entry = this.tables,
                i = -1, l = indexes.length,
                ret = entry.tuples,
                lookup = usePrimary ? 2 : 3,
                inequalityThreshold = this.inequalityThreshold,
                notPossibles = [], npl = 0, rl;

            while (++i < l) {
                var index = indexes[i],
                    val = index[lookup](factHash),
                    currEntry = entry.tables[index[0]];
                if (currEntry) {
                    var nextEntry = currEntry.get(val), tuples, tl;
                    if (index[4] === "neq") {
                        rl = ret.length;
                        if (!nextEntry) {
                            ret = rl ? ret : entry.tuples;
                        } else {
                            tuples = nextEntry.tuples;
                            tl = tuples.length;
                            if (!tl || !rl) {
                                ret = entry.tuples;
                            } else if (tl === entry.tuples.length) {
                                ret = [];
                                i = l;
                            } else if (tl) {
                                pPush.apply(notPossibles, tuples);
                                npl += tl;
                            }
                        }
                    } else if (nextEntry) {
                        tuples = nextEntry.tuples;
                        tl = tuples.length;
                        if (tl) {
                            ret = nextEntry.tuples;
                            entry = nextEntry;
                        } else {
                            i = l;
                            ret = [];
                        }
                    } else {
                        i = l;
                        ret = [];
                    }
                } else {
                    ret = [];
                    i = l;
                }
            }
            rl = ret.length;
            if (npl && rl && (npl / rl) > inequalityThreshold) {
                //console.log(npl);
                ret = difference(ret, notPossibles);
            }
            return ret.slice();
        },

        __createIndexTree: function () {
            var table = this.tables.tables = {};
            var indexes = this.indexes;
            table[indexes[0][0]] = new HashTable();

        },


        addIndex: function (primary, lookup, op) {
            this.indexes.push([primary, lookup, plucker(primary), plucker(lookup), op || "eq"]);
            this.indexes.sort(function (a, b) {
                var aOp = a[4], bOp = b[4];
                return aOp === bOp ? 0 : aOp > bOp ? 1 : -1;
            });
            this.__createIndexTree();
        }

    }

}).as(module);
