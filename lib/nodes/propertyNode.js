var comb = require("comb"),
    AlphaNode = require("./alphaNode"),
    define = comb.define;

define(AlphaNode, {
    instance:{

        assert:function (assertable) {
            var fh = {}, constraint = this.constraint, o = assertable.fact.object, alias = constraint.alias;
            fh[alias] = o;
            if (constraint.assert(fh)) {
                assertable.factHash[alias] = o;
                this._super([assertable])
            }
        },

        toString:function () {
            return "Property Node" + this._super();
        }
    }
}).as(module);