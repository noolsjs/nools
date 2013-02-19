var AlphaNode = require("./alphaNode");

AlphaNode.extend({
    instance: {

        constructor: function () {
            this._super(arguments);
            this.alias = this.constraint.get("alias");
        },

        assert: function (context) {
            if (this.constraint.assert(context.factHash)) {
                this._super([context]);
            }
        },

        toString: function () {
            return "EqualityNode" + this.__count;
        }
    }
}).as(module);