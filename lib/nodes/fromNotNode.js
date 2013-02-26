var Node = require("./joinNode"),
    extd = require("../extended"),
    constraint = require("../constraint"),
    EqualityConstraint = constraint.EqualityConstraint,
    HashConstraint = constraint.HashConstraint,
    ReferenceConstraint = constraint.ReferenceConstraint,
    Context = require("../context"),
    pluck = extd.pluck,
    forEach = extd.forEach,
    isArray = extd.isArray;

Node.extend({
    instance: {

        constructor: function (pattern) {
            this._super(arguments);
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

        __findMatches: function (context) {
            var fh = context.factHash, o = pluck([fh], this.from)[0], isMatch = false;
            if (isArray(o)) {
                for (var i = 0, l = o.length; i < l; i++) {
                    if (this.__isMatch(context, o[i])) {
                        return;
                    }
                }
                this.__propagate("assert", context.clone());
            } else if (!this.__isMatch(context, o)) {
                this.__propagate("assert", context);
            }
            return isMatch;
        },

        __isMatch: function (oc, o) {
            if (this.type.assert(o)) {
                var ret = new Context(o, null)
                    .mergeMatch(oc.match)
                    .set(this.alias, o);
                var fh = ret.factHash;
                var eqConstraints = this.__equalityConstraints;
                for (var i = 0, l = eqConstraints.length; i < l; i++) {
                    if (eqConstraints[i].assert(fh)) {
                        return true;
                    }
                }
            }
            return false;
        },

        assertLeft: function (context) {
            this.__findMatches(context);

        },

        assertRight: function () {
            throw new Error("Shouldnt have gotten here");
        },


        toString: function () {
            return "FromNode" + this.__count;
        }

    }
}).as(module);