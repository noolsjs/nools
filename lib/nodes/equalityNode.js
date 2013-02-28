var AlphaNode = require("./alphaNode");

AlphaNode.extend({
    instance: {

        constructor: function () {
            this._super(arguments);
        },

        assert: function (context) {
            if (this.constraint.assert(context.factHash)) {
                this.__propagate("assert", context);
            }
        },

        toString: function () {
            return "EqualityNode" + this.__count;
        }
    }
}).as(module);