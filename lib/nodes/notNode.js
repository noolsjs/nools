var JoinNode = require("./joinNode"),
    Context = require("../context"),
    extd = require("../extended"),
    indexOf = extd.indexOf;

JoinNode.extend({
    instance: {

        constructor: function () {
            this._super(arguments);
            this.leftTupleMemory = {};
            this.allTuples = {};
        },


        toString: function () {
            return "NotNode " + this.__count;
        },


        retractRight: function (fact) {
            var rightMemory = this.rightMemory;
            var rightContext = rightMemory[fact.id], thisConstraint = this.constraint;
            delete rightMemory[fact.id];
            if (rightContext) {
                var index = indexOf(this.rightTuples, rightContext);
                this.rightTuples.splice(index, 1);
                var fl = rightContext.blocking, leftContext;
                var rValues = this.rightTuples, k = rValues.length, rc, j;
                while ((leftContext = fl.pop())) {
                    leftContext.blocker = null;
                    thisConstraint.setLeftContext(leftContext);
                    for (j = index; j < k; j++) {
                        rc = rValues[j];
                        thisConstraint.setRightContext(rc);
                        if (thisConstraint.isMatch()) {
                            leftContext.blocker = rc;
                            rc.blocking.push(leftContext);
                            this.__addToLeftTupleMemory(leftContext);
                            break;
                        }
                    }
                    if (!leftContext.blocker) {
                        this.__removeFromLeftTupleMemory(leftContext);
                        this.__addToLeftMemory(leftContext).propagateAssert(new Context(leftContext.fact, null, leftContext.match));
                    }
                }
                thisConstraint.clearContexts();
            }
        },


        retractLeft: function (fact) {
            var factId = fact.id, tuples = this.allTuples[fact.id] || [], context, blocking, blocker;
            while (tuples.length) {
                context = tuples.pop();
                if (indexOf(context.factIds, factId) !== -1) {
                    this.__removeFromAllTupleMemory(context);
                    this.__removeFromLeftMemory(context);
                    this.__removeFromLeftTupleMemory(context);
                    if ((blocker = context.blocker)) {
                        blocking = blocker.blocking;
                        blocking.splice(indexOf(blocking, context), 1);
                        context.blocker = null;
                    }
                }
            }
            delete this.leftMemory[factId];
            delete this.leftTupleMemory[factId];
            this.propagateRetract(fact);

        },

        assertLeft: function (context) {
            var values = this.rightTuples, thisConstraint = this.constraint, i = -1, l = values.length, rc;
            if (l !== 0) {
                thisConstraint.setLeftContext(context);
                while (++i < l) {
                    if (thisConstraint.setRightContext(rc = values[i]).isMatch()) {
                        context.blocker = rc;
                        rc.blocking.push(context);
                        this.__addToLeftTupleMemory(context);
                        context = null;
                        break;
                    }
                }
            }
            if (context) {
                this.__addToLeftMemory(context).propagateAssert(new Context(context.fact, null, context.match));
            }
        },

        assertRight: function (context) {
            context.blocking = [];
            this.rightTuples.push(context);
            this.rightMemory[context.fact.id] = context;
            var fl = this.leftTuples, i = fl.length, leftContext, thisConstraint = this.constraint;
            thisConstraint.setRightContext(context);
            while (--i > -1) {
                leftContext = fl[i];
                if (thisConstraint.setLeftContext(leftContext).isMatch()) {
                    this._propagateRetractResolve(leftContext.match);
                    //blocked so remove from memory
                    this.__removeFromLeftMemory(leftContext);
                    leftContext.blocker = context;
                    context.blocking.push(leftContext);
                    this.__addToLeftTupleMemory(leftContext);
                }
            }
            thisConstraint.clearContexts();
        },

        __removeFromLeftMemory: function (context) {
            var leftMemories = this.leftMemory[context.fact.id] || [], lc, tuples = this.leftTuples;
            for (var i = 0, l = tuples.length; i < l; i++) {
                lc = tuples[i];
                if (lc === context) {
                    tuples.splice(i, 1);
                    leftMemories.splice(indexOf(leftMemories, lc), 1);
                    break;
                }
            }
            return this;
        },

        __removeFromLeftTupleMemory: function (context) {
            var leftMemories = this.leftTupleMemory[context.fact.id] || [], lc;
            for (var i = 0, l = leftMemories.length; i < l; i++) {
                lc = leftMemories[i];
                if (lc === context) {
                    leftMemories.splice(i, 1);
                    break;
                }
            }
            return this;
        },

        __addToAllTupleMemory: function (context) {
            var factIds = context.factIds, i = -1, l = factIds.length, factId, allTuples = this.allTuples, tuples;
            while (++i < l) {
                factId = factIds[i];
                tuples = allTuples[factId] = (allTuples[factId] || []);
                if (indexOf(tuples, context) === -1) {
                    tuples.push(context);
                }
            }
            return this;

        },

        __removeFromAllTupleMemory: function (context) {
            var factIds = context.factIds, i = -1, l = factIds.length, factId, allTuples = this.allTuples, tuples, index;
            while (++i < l) {
                factId = factIds[i];
                tuples = allTuples[factId];
                index = indexOf(tuples, context);
                if (index !== -1) {
                    tuples.splice(i, 1);
                }
            }
            return this;

        },


        __addToLeftMemory: function (context) {
            this._super(arguments);
            this.__addToAllTupleMemory(context);
            return this;
        },

        __addToLeftTupleMemory: function (context) {
            var o = context.fact;
            var lm = this.leftTupleMemory[o.id];
            if (!lm) {
                lm = [];
                this.leftTupleMemory[o.id] = lm;
            }
            lm.push(context);
            this.__addToAllTupleMemory(context);
            return this;
        }
    }
}).as(module);