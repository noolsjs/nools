var Memory = require("./memory");

Memory.extend({

    instance: {

        getLeftMemory: function (tuple) {
            return this.getMemory(tuple);
        }
    }

}).as(module);