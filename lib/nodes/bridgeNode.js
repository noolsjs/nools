var comb = require("comb"),
    Node = require("./node"),
    define = comb.define,
    MatchResult = require("../matchResult");

define(Node, {

    instance:{

        constructor:function (pattern) {
            this._super([]);
            this.pattern = pattern;
        },

        toString:function () {
            return "Base Bridge Node " + this.pattern;
        },

        assert:function (assertable) {
            var mr = new MatchResult(assertable), pattern = this.pattern, constraints = pattern.constraints;
            mr.isMatch = true;
            var fact = assertable.fact, o = fact.object, fh = mr.factHash;
            var i = constraints.length - 1;
            fh[pattern.alias] = o;
            for (; i > 0; i--) {
                var constraint = constraints[i];
                if (constraint instanceof HashConstraint) {
                    var hash = constraint.variables;
                    for (var j in hash) {
                        fh[hash[j]] = o[j];
                    }
                }
            }
            this.propagateAssert({match:mr, fact:fact});
        },

        retract:function (assertable) {
            this.propagateRetract(assertable.fact);
        }
    }

}).as(module);