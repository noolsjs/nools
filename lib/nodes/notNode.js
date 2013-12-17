var JoinNode = require("./joinNode"),
    LinkedList = require("../linkedList"),
    Context = require("../context"),
    InitialFact = require("../pattern").InitialFact;


JoinNode.extend({
    instance: {

        nodeType: "NotNode",

        constructor: function () {
            this._super(arguments);
            this.leftTupleMemory = {};
            //use this ensure a unique match for and propagated context.
            this.notMatch = new Context(new InitialFact()).match;
        },

        __cloneContext: function (context) {
            return context.clone(null, null, context.match.merge(this.notMatch));
        },


        retractRight: function (context) {
            var ctx = this.removeFromRightMemory(context),
                rightContext = ctx.data,
                blocking = rightContext.blocking;
            if (blocking.length) {
                //if we are blocking left contexts
                var leftContext, thisConstraint = this.constraint, blockingNode = {next: blocking.head}, rc;
                while ((blockingNode = blockingNode.next)) {
                    leftContext = blockingNode.data;
                    this.removeFromLeftBlockedMemory(leftContext);
                    var rm = this.rightTuples.getRightMemory(leftContext), l = rm.length, i;
                    i = -1;
                    while (++i < l) {
                        if (thisConstraint.isMatch(leftContext, rc = rm[i].data)) {
                            this.blockedContext(leftContext, rc);
                            leftContext = null;
                            break;
                        }
                    }
                    if (leftContext) {
                        this.notBlockedContext(leftContext, true);
                    }
                }
                blocking.clear();
            }

        },

        blockedContext: function (leftContext, rightContext, propagate) {
            leftContext.blocker = rightContext;
            this.removeFromLeftMemory(leftContext);
            this.addToLeftBlockedMemory(rightContext.blocking.push(leftContext));
            propagate && this.__propagate("retract", this.__cloneContext(leftContext));
        },

        notBlockedContext: function (leftContext, propagate) {
            this.__addToLeftMemory(leftContext);
            propagate && this.__propagate("assert", this.__cloneContext(leftContext));
        },

        propagateFromLeft: function (leftContext) {
            this.notBlockedContext(leftContext, true);
        },

        propagateFromRight: function (leftContext) {
            this.notBlockedContext(leftContext, true);
        },

        blockFromAssertRight: function (leftContext, rightContext) {
            this.blockedContext(leftContext, rightContext, true);
        },

        blockFromAssertLeft: function (leftContext, rightContext) {
            this.blockedContext(leftContext, rightContext, false);
        },


        retractLeft: function (context) {
            var ctx = this.removeFromLeftMemory(context);
            if (ctx) {
                ctx = ctx.data;
                this.__propagate("retract", this.__cloneContext(ctx));
            } else {
                if (!this.removeFromLeftBlockedMemory(context)) {
                    throw new Error();
                }
            }
        },

        assertLeft: function (context) {
            var values = this.rightTuples.getRightMemory(context),
                thisConstraint = this.constraint, rc, i = -1, l = values.length;
            while (++i < l) {
                if (thisConstraint.isMatch(context, rc = values[i].data)) {
                    this.blockFromAssertLeft(context, rc);
                    context = null;
                    i = l;
                }
            }
            if (context) {
                this.propagateFromLeft(context);
            }
        },

        assertRight: function (context) {
            this.__addToRightMemory(context);
            context.blocking = new LinkedList();
            var fl = this.leftTuples.getLeftMemory(context).slice(),
                i = -1, l = fl.length,
                leftContext, thisConstraint = this.constraint;
            while (++i < l) {
                leftContext = fl[i].data;
                if (thisConstraint.isMatch(leftContext, context)) {
                    this.blockFromAssertRight(leftContext, context);
                }
            }
        },

        addToLeftBlockedMemory: function (context) {
            var data = context.data, hashCode = data.hashCode;
            var ctx = this.leftMemory[hashCode];
            this.leftTupleMemory[hashCode] = context;
            if (ctx) {
                this.leftTuples.remove(ctx);
            }
            return this;
        },

        removeFromLeftBlockedMemory: function (context) {
            var ret = this.leftTupleMemory[context.hashCode] || null;
            if (ret) {
                delete this.leftTupleMemory[context.hashCode];
                ret.data.blocker.blocking.remove(ret);
            }
            return ret;
        },

        modifyLeft: function (context) {
            var ctx = this.removeFromLeftMemory(context),
                leftContext,
                thisConstraint = this.constraint,
                rightTuples = this.rightTuples.getRightMemory(context),
                l = rightTuples.length,
                isBlocked = false,
                i, rc, blocker;
            if (!ctx) {
                //blocked before
                ctx = this.removeFromLeftBlockedMemory(context);
                isBlocked = true;
            }
            if (ctx) {
                leftContext = ctx.data;

                if (leftContext && leftContext.blocker) {
                    //we were blocked before so only check nodes previous to our blocker
                    blocker = this.rightMemory[leftContext.blocker.hashCode];
                    leftContext.blocker = null;
                }
                if (blocker) {
                    if (thisConstraint.isMatch(context, rc = blocker.data)) {
                        //we cant be proagated so retract previous
                        if (!isBlocked) {
                            //we were asserted before so retract
                            this.__propagate("retract", this.__cloneContext(leftContext));
                        }
                        context.blocker = rc;
                        this.addToLeftBlockedMemory(rc.blocking.push(context));
                        context = null;
                    }
                }
                if (context && l) {
                    i = -1;
                    //we were propogated before
                    while (++i < l) {
                        if (thisConstraint.isMatch(context, rc = rightTuples[i].data)) {
                            //we cant be proagated so retract previous
                            if (!isBlocked) {
                                //we were asserted before so retract
                                this.__propagate("retract", this.__cloneContext(leftContext));
                            }
                            this.addToLeftBlockedMemory(rc.blocking.push(context));
                            context.blocker = rc;
                            context = null;
                            break;
                        }
                    }
                }
                if (context) {
                    //we can still be propogated
                    this.__addToLeftMemory(context);
                    if (!isBlocked) {
                        //we weren't blocked before so modify
                        this.__propagate("modify", this.__cloneContext(context));
                    } else {
                        //we were blocked before but aren't now
                        this.__propagate("assert", this.__cloneContext(context));
                    }

                }
            } else {
                throw new Error();
            }

        },

        modifyRight: function (context) {
            var ctx = this.removeFromRightMemory(context);
            if (ctx) {
                var rightContext = ctx.data,
                    leftTuples = this.leftTuples.getLeftMemory(context).slice(),
                    leftTuplesLength = leftTuples.length,
                    leftContext,
                    thisConstraint = this.constraint,
                    i, node,
                    blocking = rightContext.blocking;
                this.__addToRightMemory(context);
                context.blocking = new LinkedList();

                var rc;
                //check old blocked contexts
                //check if the same contexts blocked before are still blocked
                var blockingNode = {next: blocking.head};
                while ((blockingNode = blockingNode.next)) {
                    leftContext = blockingNode.data;
                    leftContext.blocker = null;
                    if (thisConstraint.isMatch(leftContext, context)) {
                        leftContext.blocker = context;
                        this.addToLeftBlockedMemory(context.blocking.push(leftContext));
                        leftContext = null;
                    } else {
                        //we arent blocked anymore
                        leftContext.blocker = null;
                        node = ctx;
                        while ((node = node.next)) {
                            if (thisConstraint.isMatch(leftContext, rc = node.data)) {
                                leftContext.blocker = rc;
                                this.addToLeftBlockedMemory(rc.blocking.push(leftContext));
                                leftContext = null;
                                break;
                            }
                        }
                        if (leftContext) {
                            this.__addToLeftMemory(leftContext);
                            this.__propagate("assert", this.__cloneContext(leftContext));
                        }
                    }
                }
                if (leftTuplesLength) {
                    //check currently left tuples in memory
                    i = -1;
                    while (++i < leftTuplesLength) {
                        leftContext = leftTuples[i].data;
                        if (thisConstraint.isMatch(leftContext, context)) {
                            this.__propagate("retract", this.__cloneContext(leftContext));
                            this.removeFromLeftMemory(leftContext);
                            this.addToLeftBlockedMemory(context.blocking.push(leftContext));
                            leftContext.blocker = context;
                        }
                    }
                }
            } else {
                throw new Error();
            }


        }
    }
}).as(module);