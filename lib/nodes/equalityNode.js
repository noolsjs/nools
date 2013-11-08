var AlphaNode = require("./alphaNode");

function createContextHash(context) {
    var ret = [],
        paths = context.paths,
        i = -1,
        l = paths.length;
    while (++i < l) {
        ret.push(paths[i].id);
    }
    ret.push(context.hashCode);
    return ret.join(":");

}

AlphaNode.extend({
    instance: {

        constructor: function () {
            this.memory = {};
            this._super(arguments);
            this.constraintAssert = this.constraint.assert;
        },

        assert: function (context) {
            var hashCode = createContextHash(context);
            if ((this.memory[hashCode] = this.constraintAssert(context.factHash))) {
                this.__propagate("assert", context);
            }
        },

        modify: function (context) {
            var memory = this.memory,
                hashCode = createContextHash(context),
                wasMatch = memory[hashCode];
            if ((memory[hashCode] = this.constraintAssert(context.factHash))) {
                this.__propagate(wasMatch ? "modify" : "assert", context);
            } else if (wasMatch) {
                this.__propagate("retract", context);
            }
        },

        retract: function (context) {
            var hashCode = createContextHash(context),
                memory = this.memory;
            if (memory[hashCode]) {
                this.__propagate("retract", context);
            }
            memory[hashCode] = null;
        },

        toString: function () {
            return "EqualityNode" + this.__count;
        }
    }
}).as(module);