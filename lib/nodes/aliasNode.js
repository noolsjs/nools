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
            return this.__propagate("assert", context.set(this.alias, context.fact.object));
        },

        modify: function (context) {
            return this.__propagate("modify", context.set(this.alias, context.fact.object));
        },

        retract: function (context) {
            return this.__propagate("retract", context.set(this.alias, context.fact.object));
        },

        equal: function (other) {
            return other instanceof this._static && this.alias === other.alias;
        }
    }
}).as(module);