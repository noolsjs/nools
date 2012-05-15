var comb = require("comb"),
    AlphaNode = require("./alphaNode"),
    define = comb.define,
    MatchResult = require("../matchResult");

define(AlphaNode, {
    instance:{

        //used by NotNode to avoid creating match Result for efficiency
        isMatch:function (leftContext, rightContext) {
            var leftMatch = leftContext.match,
                match = leftMatch.factHash,
                constraint = this.constraint,
                rightFact = rightContext.fact;
            var fh = {};
            fh[constraint.alias] = rightFact.object;
            var vars = constraint.variables, i = vars.length - 1;
            for (; i >= 0; i--) {
                var v = vars[i];
                fh[v] = match[v];
            }
            return constraint.assert(fh);
        },


        match:function (leftContext, rightContext) {
            var leftMatch = leftContext.match, match = leftMatch.factHash, constraint = this.constraint, alias = constraint.alias, rightFact = rightContext.fact;
            var fh = {};
            fh[alias] = rightFact.object;
            var vars = constraint.variables, i = vars.length - 1;
            for (; i >= 0; i--) {
                var v = vars[i];
                fh[v] = match[v];
            }
            var m = constraint.assert(fh);
            if (m) {
                var mr = new MatchResult().merge(leftMatch);
                mr.isMatch = true;
                mr.factHash[alias] = rightFact.object;
                mr.recency.push(rightFact.recency);
                return mr;
            } else {
                return new MatchResult();
            }
        },
        toString:function () {
            return "Reference Node" + this._super();
        }
    }
}).as(module);