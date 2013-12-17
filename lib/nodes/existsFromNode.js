var FromNotNode = require("./fromNotNode"),
    extd = require("../extended"),
    Context = require("../context"),
    isDefined = extd.isDefined,
    isArray = extd.isArray;

FromNotNode.extend({
    instance: {

        nodeType: "ExistsFromNode",

        retractLeft: function (context) {
            var ctx = this.removeFromLeftMemory(context);
            if (ctx) {
                ctx = ctx.data;
                if (ctx.blocked) {
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
            if (newContextBlocked) {
                if (leftContextBlocked) {
                    this.__propagate("modify", context.clone());
                } else {
                    this.__propagate("assert", context.clone());
                }
            } else if (leftContextBlocked) {
                this.__propagate("retract", context.clone());
            }

        },

        __findMatches: function (context) {
            var fh = context.factHash, o = this.from(fh), isMatch = false;
            if (isArray(o)) {
                for (var i = 0, l = o.length; i < l; i++) {
                    if (this.__isMatch(context, o[i], true)) {
                        context.blocked = true;
                        this.__propagate("assert", context.clone());
                        return;
                    }
                }
            } else if (isDefined(o) && (this.__isMatch(context, o, true))) {
                context.blocked = true;
                this.__propagate("assert", context.clone());
            }
            return isMatch;
        },

        __isMatch: function (oc, o, add) {
            var ret = false;
            if (this.type(o)) {
                var createdFact = this.workingMemory.getFactHandle(o);
                var context = new Context(createdFact, null, null)
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
                    if (eqConstraints[i](fh)) {
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
        }

    }
}).as(module);