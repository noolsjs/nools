var comb = require("comb"),
    AlphaNode = require("./alphaNode"),
    define = comb.define;

define(AlphaNode, {
    instance:{

        assert:function (assertable) {
            var fh = {}, constraint = this.constraint;
            fh[constraint.alias] = assertable.fact.object;
            if (constraint.assert(fh)) {
                this._super([assertable])
            }
        },

        toString:function () {
            return "Equality Node" + this._super();
        }
    }
}).as(module);