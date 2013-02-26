var Node = require("./joinNode"),
    extd = require("../extended"),
    constraint = require("../constraint"),
    EqualityConstraint = constraint.EqualityConstraint,
    HashConstraint = constraint.HashConstraint,
    ReferenceConstraint = constraint.ReferenceConstraint,
    Context = require("../context"),
    pluck = extd.pluck,
    forEach = extd.forEach,
    isArray = extd.isArray,
    indexOf = extd.indexOf;

var DEFAULT_MATCH = {isMatch: function () {
    return false;
}};
Node.extend({
    instance: {

        constructor: function (pattern, wm) {
            this._super(arguments);
            this.workingMemory = wm;
            this.__fromMemory = {};
            this.pattern = pattern;
            this.type = pattern.get("constraints")[0];
            this.alias = pattern.get("alias");
            this.from = pattern.from;
            var eqConstraints = this.__equalityConstraints = [];
            var vars = [];
            forEach(this.constraints = this.pattern.get("constraints").slice(1), function (c) {
                if (c instanceof EqualityConstraint || c instanceof ReferenceConstraint) {
                    eqConstraints.push(c);
                } else if (c instanceof HashConstraint) {
                    vars = vars.concat(c.get("variables"));
                }
            });
            this.__variables = vars;

        },

        __createMatches: function (context) {
            var fh = context.factHash, o = pluck([fh], this.from)[0], newContext;
            if (isArray(o)) {
                for (var i = 0, l = o.length; i < l; i++) {
                    if ((newContext = this.__createMatch(context, o[i])).isMatch()) {
                        this.__propagate("assert", newContext);
                    }
                }
            } else if ((newContext = this.__createMatch(context, o)).isMatch()) {
                this.__propagate("assert", newContext);
            }
        },

        __createMatch: function (lc, o) {
            if (this.type.assert(o)) {
                var rc = new Context(this.workingMemory.getFactHandle(o))
                    .set(this.alias, o);
                var fh = rc.factHash, lcFh = lc.factHash;
                for (var key in lcFh) {
                    fh[key] = lcFh[key];
                }
                var eqConstraints = this.__equalityConstraints, vars = this.__variables;
                for (var i = 0, l = eqConstraints.length; i < l; i++) {
                    if (!eqConstraints[i].assert(fh)) {
                        return DEFAULT_MATCH;
                    }
                }
                var prop;
                for (i = 0, l = vars.length; i < l; i++) {
                    prop = vars[i];
                    fh[prop] = o[prop];
                }
                return lc.clone(null, null, lc.match.merge(rc.match));
            }
            return DEFAULT_MATCH;
        },

//        retractLeft: function (fact) {
//            var contexts = this.leftMemory[fact.id], tuples = this.leftTuples, i, l, found = false;
//            if (contexts) {
//                found = true;
//                for (i = 0, l = contexts.length; i < l; i++) {
//                    var index = indexOf(tuples, contexts[i]);
//                    tuples.splice(index, 1);
//                    //this.propagateRetract(tuple.fac);
//                }
//                delete this.leftMemory[fact.id];
//            }
//            this.propagateRetract(fact);
//        },
//
        retractRight: function (fact) {
            throw new Error("Shouldnt have gotten here");
        },

        assertLeft: function (context) {
//            this.leftTuples.push(context);
            this.__addToLeftMemory(context);
            this.__createMatches(context);

        },

        assertRight: function (context) {
            throw new Error("Shouldnt have gotten here");
        },


        toString: function () {
            return "FromNode" + this.__count;
        }

    }
}).as(module);