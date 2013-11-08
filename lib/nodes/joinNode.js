var extd = require("../extended"),
    values = extd.hash.values,
    Node = require("./node"),
    JoinReferenceNode = require("./joinReferenceNode"),
    LinkedList = require("../linkedList");

Node.extend({

    instance: {
        constructor: function () {
            this._super([]);
            this.constraint = new JoinReferenceNode();
            this.leftMemory = {};
            this.rightMemory = {};
            this.leftTuples = new LinkedList();
            this.rightTuples = new LinkedList();
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
            return  "JoinNode " + this.__count;
        },

        toString: function () {
            return "JoinNode " + this.__count;
        },

        retractLeft: function (context) {
            context = this.removeFromLeftMemory(context);
            if (context) {
                context = context.data;
                var rightMathces = values(context.rightMatches),
                    i = -1,
                    l = rightMathces.length;
                while (++i < l) {
                    this.__propagate("retract", rightMathces[i]);
                }
            } else {
                throw new Error();
            }
            return this;
        },

        retractRight: function (context) {
            context = this.removeFromRightMemory(context);
            if (context) {
                context = context.data;
                var leftMatches = values(context.leftMatches),
                    i = -1,
                    l = leftMatches.length;
                while (++i < l) {
                    this.__propagate("retract", leftMatches[i]);
                }
            } else {
                throw new Error();
            }
            return this;
        },

        propagateFromLeft: function (context, constraint, rm) {
            var mr;
            if ((mr = constraint.setRightContext(rm).match()).isMatch) {
                this.__propagate("assert", this.__addToMemoryMatches(rm, context, context.clone(null, null, mr)));
            }
            return this;
        },

        propagateFromRight: function (context, constraint, lm) {
            var mr;
            if ((mr = constraint.setLeftContext(lm).match()).isMatch) {
                this.__propagate("assert", this.__addToMemoryMatches(context, lm, context.clone(null, null, mr)));
            }
            return this;
        },

        assertLeft: function (context) {
            if (this.__addToLeftMemory(context)) {
                var rm = this.rightTuples, node = {next: rm.head}, thisConstraint = this.constraint;
                if (rm.length) {
                    thisConstraint.setLeftContext(context);
                    while ((node = node.next)) {
                        this.propagateFromLeft(context, thisConstraint, node.data);
                    }
                    thisConstraint.clearContexts();
                }
            } else {
                this.modifyLeft(context);
            }
        },

        assertRight: function (context) {
            if (this.__addToRightMemory(context)) {
                var lm = this.leftTuples;
                if (lm.length) {
                    var node = {next: lm.head}, thisConstraint = this.constraint;
                    thisConstraint.setRightContext(context);
                    while ((node = node.next)) {
                        this.propagateFromRight(context, thisConstraint, node.data);
                    }
                    thisConstraint.clearContexts();
                }
            } else {
                this.modifyRight(context);
            }
        },

        modifyLeft: function (context) {
            var previousContext;
            if ((previousContext = this.removeFromLeftMemory(context))) {
                previousContext = previousContext.data;
                this.__addToLeftMemory(context);
                var rm = this.rightTuples, l = rm.length;
                if (!l) {
                    this.propagateRetract(context);
                } else {
                    var thisConstraint = this.constraint,
                        node = {next: rm.head},
                        rightMatches = previousContext.rightMatches;
                    thisConstraint.setLeftContext(context);
                    while ((node = node.next)) {
                        this.propagateAssertModifyFromLeft(context, rightMatches, thisConstraint, node.data);
                    }
                    thisConstraint.clearContexts();

                }
            } else {
                throw new Error();
            }

        },

        modifyRight: function (context) {
            var previousContext;
            if ((previousContext = this.removeFromRightMemory(context))) {
                previousContext = previousContext.data;
                this.__addToRightMemory(context);
                var lm = this.leftTuples;
                if (!lm.length) {
                    this.propagateRetract(context);
                } else {
                    var thisConstraint = this.constraint,
                        leftMatches = previousContext.leftMatches,
                        node = {next: lm.head};
                    thisConstraint.setRightContext(context);
                    while ((node = node.next)) {
                        this.propagateAssertModifyFromRight(context, leftMatches, thisConstraint, node.data);
                    }
                    thisConstraint.clearContexts();
                }
            } else {
                throw new Error();
            }

        },

        propagateAssertModifyFromLeft: function (context, rightMatches, constraint, rm) {
            var factId = rm.hashCode, mr;
            if (factId in rightMatches) {
                mr = constraint.setRightContext(rm).match();
                var mrIsMatch = mr.isMatch;
                if (!mrIsMatch) {
                    this.__propagate("retract", rightMatches[factId].clone());
                } else {
                    this.__propagate("modify", this.__addToMemoryMatches(rm, context, context.clone(null, null, mr)));
                }
            } else {
                this.propagateFromLeft(context, constraint, rm);
            }
        },

        propagateAssertModifyFromRight: function (context, leftMatches, constraint, lm) {
            var factId = lm.hashCode, mr;
            if (factId in leftMatches) {
                mr = constraint.setLeftContext(lm).match();
                var mrIsMatch = mr.isMatch;
                if (!mrIsMatch) {
                    this.__propagate("retract", leftMatches[factId].clone());
                } else {
                    this.__propagate("modify", this.__addToMemoryMatches(context, lm, context.clone(null, null, mr)));
                }
            } else {
                this.propagateFromRight(context, constraint, lm);
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
                for (var i in leftMatches) {
                    delete leftMemory[i].data.rightMatches[hashCode];
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
                for (var i in rightMatches) {
                    delete rightMemory[i].data.leftMatches[hashCode];
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