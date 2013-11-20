var JoinNode = require("./joinNode"),
    extd = require("../extended"),
    constraint = require("../constraint"),
    EqualityConstraint = constraint.EqualityConstraint,
    HashConstraint = constraint.HashConstraint,
    ReferenceConstraint = constraint.ReferenceConstraint,
    Context = require("../context"),
    isDefined = extd.isDefined,
    forEach = extd.forEach,
    isArray = extd.isArray;

JoinNode.extend({
    instance: {

        nodeType: "FromNotNode",

        constructor: function (pattern, workingMemory) {
            this._super(arguments);
            this.workingMemory = workingMemory;
            this.pattern = pattern;
            this.type = pattern.get("constraints")[0].assert;
            this.alias = pattern.get("alias");
            this.from = pattern.from.assert;
            this.fromMemory = {};
            var eqConstraints = this.__equalityConstraints = [];
            var vars = [];
            forEach(this.constraints = this.pattern.get("constraints").slice(1), function (c) {
                if (c instanceof EqualityConstraint || c instanceof ReferenceConstraint) {
                    eqConstraints.push(c.assert);
                } else if (c instanceof HashConstraint) {
                    vars = vars.concat(c.get("variables"));
                }
            });
            this.__variables = vars;

        },

        retractLeft: function (context) {
            var ctx = this.removeFromLeftMemory(context);
            if (ctx) {
                ctx = ctx.data;
                if (!ctx.blocked) {
                    this.__propagate("retract", ctx.clone());
                }
            }
        },

        __modify: function (context, leftContext) {
            var leftContextBlocked = leftContext.blocked;
            var fh = context.factHash, o = this.from(fh);
            if (isArray(o)) {
                for (var i = 0, l = o.length; i < l; i++) {
                    if (this.__isMatch(context, o[i], true)) {
                        context.blocked = true;
                        break;
                    }
                }
            } else if (isDefined(o)) {
                context.blocked = this.__isMatch(context, o, true);
            }
            var newContextBlocked = context.blocked;
            if (!newContextBlocked) {
                if (leftContextBlocked) {
                    this.__propagate("assert", context.clone());
                } else {
                    this.__propagate("modify", context.clone());
                }
            } else if (!leftContextBlocked) {
                this.__propagate("retract", leftContext.clone());
            }

        },

        modifyLeft: function (context) {
            var ctx = this.removeFromLeftMemory(context);
            if (ctx) {
                this.__addToLeftMemory(context);
                this.__modify(context, ctx.data);
            } else {
                throw new Error();
            }
            var fm = this.fromMemory[context.fact.id];
            this.fromMemory[context.fact.id] = {};
            if (fm) {
                for (var i in fm) {
                    // update any contexts associated with this fact
                    if (i !== context.hashCode) {
                        var lc = fm[i];
                        ctx = this.removeFromLeftMemory(lc);
                        if (ctx) {
                            lc = lc.clone();
                            lc.blocked = false;
                            this.__addToLeftMemory(lc);
                            this.__modify(lc, ctx.data);
                        }
                    }
                }
            }
        },

        __findMatches: function (context) {
            var fh = context.factHash, o = this.from(fh), isMatch = false;
            if (isArray(o)) {
                for (var i = 0, l = o.length; i < l; i++) {
                    if (this.__isMatch(context, o[i], true)) {
                        context.blocked = true;
                        return;
                    }
                }
                this.__propagate("assert", context.clone());
            } else if (isDefined(o) && !(context.blocked = this.__isMatch(context, o, true))) {
                this.__propagate("assert", context.clone());
            }
            return isMatch;
        },

        __isMatch: function (oc, o, add) {
            var ret = false;
            if (this.type(o)) {
                var createdFact = this.workingMemory.getFactHandle(o);
                var context = new Context(createdFact, null)
                    .mergeMatch(oc.match)
                    .set(this.alias, o);
                if (add) {
                    var fm = this.fromMemory[createdFact.id];
                    if (!fm) {
                        fm = this.fromMemory[createdFact.id] = {};
                    }
                    fm[oc.hashCode] = oc;
                }
                var fh = context.factHash;
                var eqConstraints = this.__equalityConstraints;
                for (var i = 0, l = eqConstraints.length; i < l; i++) {
                    if (eqConstraints[i](fh, fh)) {
                        ret = true;
                    } else {
                        ret = false;
                        break;
                    }
                }
            }
            return ret;
        },

        assertLeft: function (context) {
            this.__addToLeftMemory(context);
            this.__findMatches(context);
        },

        assertRight: function () {
            throw new Error("Shouldnt have gotten here");
        },

        retractRight: function () {
            throw new Error("Shouldnt have gotten here");
        }

    }
}).as(module);