var extd = require("../../extended"),
    indexOf = extd.indexOf;
//    HashSet = require("./hashSet");


var TUPLE_ID = 0;
extd.declare({

    instance: {
        tuples: null,
        tupleMap: null,
        hashCode: null,
        tables: null,
        entry: null,
        constructor: function (val, entry, canRemove) {
            this.val = val;
            this.canRemove = canRemove;
            this.tuples = [];
            this.tupleMap = {};
            this.hashCode = TUPLE_ID++;
            this.tables = {};
            this.length = 0;
            this.entry = entry;
        },

        addNode: function (node) {
            this.tuples[this.length++] = node;
            if (this.length > 1) {
                this.entry.clearCache();
            }
            return this;
        },

        removeNode: function (node) {
            var tuples = this.tuples, index = indexOf(tuples, node);
            if (index !== -1) {
                tuples.splice(index, 1);
                this.length--;
                this.entry.clearCache();
            }
            if (this.canRemove && !this.length) {
                this.entry.remove(this.val);
            }
        }
    }
}).as(module);