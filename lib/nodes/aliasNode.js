var AlphaNode = require("./alphaNode");

AlphaNode.extend({
    instance: {

        constructor: function () {
            this._super(arguments);
            this.alias = this.constraint.get("alias");
        },

        toString: function () {
            return "AliasNode" + this.__count;
        },

        assert: function (context) {
            return this.propagateAssert(context.set(this.alias, context.fact.object));
        },

        retract: function (assertable) {
            this.propagateRetract(assertable.fact);
        },

        equal: function (other) {
            return other instanceof this._static && this.alias === other.alias;
        }
    }
}).as(module);