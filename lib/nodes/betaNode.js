var extd = require("../extended"),
    keys = extd.hash.keys,
    Node = require("./node"),
    LeftMemory = require("./misc/leftMemory"), RightMemory = require("./misc/rightMemory");

Node.extend({

    instance: {

        nodeType: "BetaNode",

        constructor: function () {
            this._super([]);
            this.leftMemory = {};
            this.rightMemory = {};
            this.leftTuples = new LeftMemory();
            this.rightTuples = new RightMemory();
        },

        __propagate: function (method, context) {
            var entrySet = this.__entrySet, i = entrySet.length, entry, outNode;
            while (--i > -1) {
                entry = entrySet[i];
                outNode = entry.key;
                outNode[method](context);
            }
        },

        dispose: function () {
            this.leftMemory = {};
            this.rightMemory = {};
            this.leftTuples.clear();
            this.rightTuples.clear();
        },

        disposeLeft: function (fact) {
            this.leftMemory = {};
            this.leftTuples.clear();
            this.propagateDispose(fact);
        },

        disposeRight: function (fact) {
            this.rightMemory = {};
            this.rightTuples.clear();
            this.propagateDispose(fact);
        },

        hashCode: function () {
            return  this.nodeType + " " + this.__count;
        },

        toString: function () {
            return this.nodeType + " " + this.__count;
        },

        retractLeft: function (context) {
            context = this.removeFromLeftMemory(context).data;
            var rightMatches = context.rightMatches,
                hashCodes = keys(rightMatches),
                i = -1,
                l = hashCodes.length;
            while (++i < l) {
                this.__propagate("retract", rightMatches[hashCodes[i]].clone());
            }
        },

        retractRight: function (context) {
            context = this.removeFromRightMemory(context).data;
            var leftMatches = context.leftMatches,
                hashCodes = keys(leftMatches),
                i = -1,
                l = hashCodes.length;
            while (++i < l) {
                this.__propagate("retract", leftMatches[hashCodes[i]].clone());
            }
        },

        assertLeft: function (context) {
            this.__addToLeftMemory(context);
            var rm = this.rightTuples.getRightMemory(context), i = -1, l = rm.length;
            while (++i < l) {
                this.propagateFromLeft(context, rm[i].data);
            }
        },

        assertRight: function (context) {
            this.__addToRightMemory(context);
            var lm = this.leftTuples.getLeftMemory(context), i = -1, l = lm.length;
            while (++i < l) {
                this.propagateFromRight(context, lm[i].data);
            }
        },

        modifyLeft: function (context) {
            var previousContext = this.removeFromLeftMemory(context).data;
            this.__addToLeftMemory(context);
            var rm = this.rightTuples.getRightMemory(context), l = rm.length, i = -1, rightMatches;
            if (!l) {
                this.propagateRetractModifyFromLeft(previousContext);
            } else {
                rightMatches = previousContext.rightMatches;
                while (++i < l) {
                    this.propagateAssertModifyFromLeft(context, rightMatches, rm[i].data);
                }

            }
        },

        modifyRight: function (context) {
            var previousContext = this.removeFromRightMemory(context).data;
            this.__addToRightMemory(context);
            var lm = this.leftTuples.getLeftMemory(context);
            if (!lm.length) {
                this.propagateRetractModifyFromRight(previousContext);
            } else {
                var leftMatches = previousContext.leftMatches, i = -1, l = lm.length;
                while (++i < l) {
                    this.propagateAssertModifyFromRight(context, leftMatches, lm[i].data);
                }
            }
        },

        propagateFromLeft: function (context, rc) {
            this.__propagate("assert", this.__addToMemoryMatches(rc, context, context.clone(null, null, context.match.merge(rc.match))));
        },

        propagateFromRight: function (context, lc) {
            this.__propagate("assert", this.__addToMemoryMatches(context, lc, lc.clone(null, null, lc.match.merge(context.match))));
        },

        propagateRetractModifyFromLeft: function (context) {
            var rightMatches = context.rightMatches,
                hashCodes = keys(rightMatches),
                l = hashCodes.length,
                i = -1;
            while (++i < l) {
                this.__propagate("retract", rightMatches[hashCodes[i]].clone());
            }
        },

        propagateRetractModifyFromRight: function (context) {
            var leftMatches = context.leftMatches,
                hashCodes = keys(leftMatches),
                l = hashCodes.length,
                i = -1;
            while (++i < l) {
                this.__propagate("retract", leftMatches[hashCodes[i]].clone());
            }
        },

        propagateAssertModifyFromLeft: function (context, rightMatches, rm) {
            var factId = rm.hashCode;
            if (factId in rightMatches) {
                this.__propagate("modify", this.__addToMemoryMatches(rm, context, context.clone(null, null, context.match.merge(rm.match))));
            } else {
                this.propagateFromLeft(context, rm);
            }
        },

        propagateAssertModifyFromRight: function (context, leftMatches, lm) {
            var factId = lm.hashCode;
            if (factId in leftMatches) {
                this.__propagate("modify", this.__addToMemoryMatches(context, lm, context.clone(null, null, lm.match.merge(context.match))));
            } else {
                this.propagateFromRight(context, lm);
            }
        },

        removeFromRightMemory: function (context) {
            var hashCode = context.hashCode, ret;
            context = this.rightMemory[hashCode] || null;
            var tuples = this.rightTuples;
            if (context) {
                var leftMemory = this.leftMemory;
                ret = context.data;
                var leftMatches = ret.leftMatches;
                tuples.remove(context);
                var hashCodes = keys(leftMatches), i = -1, l = hashCodes.length;
                while (++i < l) {
                    delete leftMemory[hashCodes[i]].data.rightMatches[hashCode];
                }
                delete this.rightMemory[hashCode];
            }
            return context;
        },

        removeFromLeftMemory: function (context) {
            var hashCode = context.hashCode;
            context = this.leftMemory[hashCode] || null;
            if (context) {
                var rightMemory = this.rightMemory;
                var rightMatches = context.data.rightMatches;
                this.leftTuples.remove(context);
                var hashCodes = keys(rightMatches), i = -1, l = hashCodes.length;
                while (++i < l) {
                    delete rightMemory[hashCodes[i]].data.leftMatches[hashCode];
                }
                delete this.leftMemory[hashCode];
            }
            return context;
        },

        getRightMemoryMatches: function (context) {
            var lm = this.leftMemory[context.hashCode], ret = {};
            if (lm) {
                ret = lm.rightMatches;
            }
            return ret;
        },

        __addToMemoryMatches: function (rightContext, leftContext, createdContext) {
            var rightFactId = rightContext.hashCode,
                rm = this.rightMemory[rightFactId],
                lm, leftFactId = leftContext.hashCode;
            if (rm) {
                rm = rm.data;
                if (leftFactId in rm.leftMatches) {
                    throw new Error("Duplicate left fact entry");
                }
                rm.leftMatches[leftFactId] = createdContext;
            }
            lm = this.leftMemory[leftFactId];
            if (lm) {
                lm = lm.data;
                if (rightFactId in lm.rightMatches) {
                    throw new Error("Duplicate right fact entry");
                }
                lm.rightMatches[rightFactId] = createdContext;
            }
            return createdContext;
        },

        __addToRightMemory: function (context) {
            var hashCode = context.hashCode, rm = this.rightMemory;
            if (hashCode in rm) {
                return false;
            }
            rm[hashCode] = this.rightTuples.push(context);
            context.leftMatches = {};
            return true;
        },


        __addToLeftMemory: function (context) {
            var hashCode = context.hashCode, lm = this.leftMemory;
            if (hashCode in lm) {
                return false;
            }
            lm[hashCode] = this.leftTuples.push(context);
            context.rightMatches = {};
            return true;
        }
    }

}).as(module);