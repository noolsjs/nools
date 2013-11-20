var Memory = require("./memory");

Memory.extend({

    instance: {

        getRightMemory: function (tuple) {
            return this.getMemory(tuple);
        }
    }

}).as(module);