var Node = require("./joinNode"),
    extd = require("../extended"),
    constraint = require("../constraint"),
    EqualityConstraint = constraint.EqualityConstraint,
    HashConstraint = constraint.HashConstraint,
    ReferenceConstraint = constraint.ReferenceConstraint,
    Context = require("../context"),
    plucker = extd.plucker,
    isEmpty = extd.isEmpty,
    forEach = extd.forEach,
    isArray = extd.isArray;

var DEFAULT_MATCH = {
    isMatch: function () {
        return false;
    }
};


Node.extend({
    instance: {

        constructor: function (pattern, wm) {
            this._super(arguments);
            this.workingMemory = wm;
            this.fromMemory = {};
            this.pattern = pattern;
            this.type = pattern.get("constraints")[0];
            this.alias = pattern.get("alias");
            this.plucker = plucker(this.from = pattern.from);
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
            var fh = context.factHash, o = this.plucker(fh);
            if (isArray(o)) {
                for (var i = 0, l = o.length; i < l; i++) {
                    this.__checkMatch(context, o[i], true);
                }
            } else {
                this.__checkMatch(context, o, true);
            }
        },

        __checkMatch: function (context, o, propogate) {
            var newContext;
            if ((newContext = this.__createMatch(context, o)).isMatch() && propogate) {
                this.__propagate("assert", newContext.clone());
            }
            return newContext;
        },

        __createMatch: function (lc, o) {
            if (this.type.assert(o)) {
                var createdFact = this.workingMemory.getFactHandle(o, true),
                    createdContext,
                    rc = new Context(createdFact)
                        .set(this.alias, o),
                    createdFactId = createdFact.id;
                var fh = rc.factHash, lcFh = lc.factHash;
                for (var key in lcFh) {
                    fh[key] = lcFh[key];
                }
                var eqConstraints = this.__equalityConstraints, vars = this.__variables, i = -1, l = eqConstraints.length;
                while (++i < l) {
                    if (!eqConstraints[i].assert(fh)) {
                        createdContext = DEFAULT_MATCH;
                        break;
                    }
                }
                var fm = this.fromMemory[createdFactId];
                if (!fm) {
                    fm = this.fromMemory[createdFactId] = {};
                }
                if (!createdContext) {
                    var prop;
                    i = -1;
                    l = vars.length;
                    while (++i < l) {
                        prop = vars[i];
                        fh[prop] = o[prop];
                    }
                    lc.fromMatches[createdFact.id] = createdContext = rc.clone(createdFact, null, lc.match.merge(rc.match));
                }
                fm[lc.hashCode] = [lc, createdContext];
                return createdContext;
            }
            return DEFAULT_MATCH;
        },

        retractRight: function () {
            throw new Error("Shouldnt have gotten here");
        },

        removeFromFromMemory: function (context) {
            var factId = context.fact.id;
            var fm = this.fromMemory[factId];
            if (fm) {
                var entry;
                for (var i in fm) {
                    entry = fm[i];
                    if (entry[1] === context) {
                        delete fm[i];
                        if (isEmpty(fm)) {
                            delete this.fromMemory[factId];
                        }
                        break;
                    }
                }
            }

        },

        retractLeft: function (context) {
            var ctx = this.removeFromLeftMemory(context);
            if (ctx) {
                ctx = ctx.data;
                var fromMatches = ctx.fromMatches;
                for (var i in fromMatches) {
                    this.removeFromFromMemory(fromMatches[i]);
                    this.__propagate("retract", fromMatches[i].clone());
                }
            }
        },

        modifyLeft: function (context) {
            var ctx = this.removeFromLeftMemory(context), newContext, i, l, factId, fact;
            if (ctx) {
                this.__addToLeftMemory(context);

                var leftContext = ctx.data,
                    fromMatches = (context.fromMatches = {}),
                    rightMatches = leftContext.fromMatches,
                    o = this.plucker(context.factHash);

                if (isArray(o)) {
                    for (i = 0, l = o.length; i < l; i++) {
                        newContext = this.__checkMatch(context, o[i], false);
                        if (newContext.isMatch()) {
                            factId = newContext.fact.id;
                            if (factId in rightMatches) {
                                this.__propagate("modify", newContext.clone());
                            } else {
                                this.__propagate("assert", newContext.clone());
                            }
                        }
                    }
                } else {
                    newContext = this.__checkMatch(context, o, false);
                    if (newContext.isMatch()) {
                        factId = newContext.fact.id;
                        if (factId in rightMatches) {
                            this.__propagate("modify", newContext.clone());
                        } else {
                            this.__propagate("assert", newContext.clone());
                        }
                    }
                }
                for (i in rightMatches) {
                    if (!(i in fromMatches)) {
                        this.removeFromFromMemory(rightMatches[i]);
                        this.__propagate("retract", rightMatches[i].clone());
                    }
                }
            } else {
                this.assertLeft(context);
            }
            fact = context.fact;
            factId = fact.id;
            var fm = this.fromMemory[factId];
            this.fromMemory[factId] = {};
            if (fm) {
                var lc, entry, cc, createdIsMatch, factObject = fact.object;
                for (i in fm) {
                    entry = fm[i];
                    lc = entry[0];
                    cc = entry[1];
                    createdIsMatch = cc.isMatch();
                    if (lc.hashCode !== context.hashCode) {
                        newContext = this.__createMatch(lc, factObject, false);
                        if (createdIsMatch) {
                            this.__propagate("retract", cc.clone());
                        }
                        if (newContext.isMatch()) {
                            this.__propagate(createdIsMatch ? "modify": "assert", newContext.clone());
                        }

                    }
                }
            }
        },

        assertLeft: function (context) {
            this.__addToLeftMemory(context);
            context.fromMatches = {};
            this.__createMatches(context);
        },

        assertRight: function () {
            throw new Error("Shouldnt have gotten here");
        },


        toString: function () {
            return "FromNode" + this.__count;
        }

    }
}).as(module);