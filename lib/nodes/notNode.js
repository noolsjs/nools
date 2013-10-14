var JoinNode = require("./joinNode"),
    LinkedList = require("../linkedList");

JoinNode.extend({
    instance: {

        constructor: function () {
            this._super(arguments);
            this.leftTupleMemory = {};
        },


        toString: function () {
            return "NotNode " + this.__count;
        },


        retractRight: function (context) {
            var ctx = this.removeFromRightMemory(context);
            if (ctx) {
                var rightContext = ctx.data;
                var blocking = rightContext.blocking;
                if (blocking.length) {
                    //if we are blocking left contexts
                    var leftContext, rightTuples = this.rightTuples, thisConstraint = this.constraint, blockingNode = {next: blocking.head}, node, l = rightTuples.length, rc;
                    while ((blockingNode = blockingNode.next)) {
                        leftContext = blockingNode.data;
                        this.removeFromLeftBlockedMemory(leftContext);
                        if (l !== 0) {
                            thisConstraint.setLeftContext(leftContext);
                            node = ctx;
                            while ((node = node.next)) {
                                if (thisConstraint.setRightContext(rc = node.data).isMatch()) {
                                    leftContext.blocker = rc;
                                    this.addToLeftBlockedMemory(rc.blocking.push(leftContext));
                                    leftContext = null;
                                    break;
                                }
                            }
                            thisConstraint.clearContexts();
                        }
                        if (leftContext) {
                            this.__addToLeftMemory(leftContext);
                            this.__propagate("assert", leftContext.clone());
                        }
                    }
                    blocking.clear();
                }
            } else {
                throw new Error();
            }

        },


        retractLeft: function (context) {
            var ctx = this.removeFromLeftMemory(context);
            if (ctx) {
                this.__propagate("retract", ctx.data.clone());
            } else {
                if (!this.removeFromLeftBlockedMemory(context)) {
                    throw new Error();
                }
            }
        },

        assertLeft: function (context) {
            var values = this.rightTuples,
                node,
                thisConstraint = this.constraint, rc;
            if (values.length) {
                node = {next: values.head};
                thisConstraint.setLeftContext(context);
                while ((node = node.next) && context) {
                    if (thisConstraint.setRightContext(rc = node.data).isMatch()) {
                        context.blocker = rc;
                        this.addToLeftBlockedMemory(rc.blocking.push(context));
                        context = null;
                    }
                }
                thisConstraint.clearContexts();
            }
            if (context) {
                this.__addToLeftMemory(context);
                this.__propagate("assert", context.clone());
            }
        },

        assertRight: function (context) {
            this.__addToRightMemory(context);
            context.blocking = new LinkedList();
            var fl = this.leftTuples, leftContext, node, thisConstraint = this.constraint;
            if (fl.length) {
                node = {next: fl.head};
                thisConstraint.setRightContext(context);
                while ((node = node.next)) {
                    leftContext = node.data;
                    if (thisConstraint.setLeftContext(leftContext).isMatch()) {
                        this.__propagate("retract", leftContext.clone());
                        this.removeFromLeftMemory(leftContext);
                        leftContext.blocker = context;
                        this.addToLeftBlockedMemory(context.blocking.push(leftContext));
                    }
                }
                thisConstraint.clearContexts();
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
                rightTuples = this.rightTuples,
                l = rightTuples.length,
                isBlocked = false,
                node, rc, blocker;
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
                }
                if (blocker) {
                    thisConstraint.setLeftContext(context);
                    if (thisConstraint.setRightContext(rc = blocker.data).isMatch()) {
                        //we cant be proagated so retract previous
                        if (!isBlocked) {
                            //we were asserted before so retract
                            this.__propagate("retract", leftContext.clone());
                        }
                        context.blocker = rc;
                        this.addToLeftBlockedMemory(rc.blocking.push(context));
                        context = null;
                    }
                }
                if (context && l) {
                    node = {next: rightTuples.head};
                    //we were propogated before
                    thisConstraint.setLeftContext(context);
                    while ((node = node.next)) {
                        if (thisConstraint.setRightContext(rc = node.data).isMatch()) {
                            //we cant be proagated so retract previous
                            if (!isBlocked) {
                                //we were asserted before so retract
                                this.__propagate("retract", leftContext.clone());
                            }
                            this.addToLeftBlockedMemory(rc.blocking.push(context));
                            context.blocker = rc;
                            context = null;
                            break;
                        }
                    }
                    thisConstraint.clearContexts();
                }
                if (context) {
                    //we can still be propogated
                    this.__addToLeftMemory(context);
                    if (!isBlocked) {
                        //we weren't blocked before so modify
                        this.__propagate("modify", context.clone());
                    } else {
                        //we were blocked before but aren't now
                        this.__propagate("assert", context.clone());
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
                    leftTuples = this.leftTuples,
                    leftTuplesLength = leftTuples.length,
                    leftContext,
                    thisConstraint = this.constraint,
                    node,
                    blocking = rightContext.blocking;
                this.__addToRightMemory(context);
                context.blocking = new LinkedList();
                if (leftTuplesLength || blocking.length) {
                    if (leftTuplesLength) {
                        //check currently left tuples in memory
                        thisConstraint.setRightContext(context);
                        node = {next: leftTuples.head};
                        while ((node = node.next)) {
                            leftContext = node.data;
                            if (thisConstraint.setLeftContext(leftContext).isMatch()) {
                                this.__propagate("retract", leftContext.clone());
                                this.removeFromLeftMemory(leftContext);
                                this.addToLeftBlockedMemory(context.blocking.push(leftContext));
                                leftContext.blocker = context;
                            }
                        }
                    }

                    if (blocking.length) {
                        var rc;
                        //check old blocked contexts
                        //check if the same contexts blocked before are still blocked
                        var blockingNode = {next: blocking.head};
                        while ((blockingNode = blockingNode.next)) {
                            leftContext = blockingNode.data;
                            leftContext.blocker = null;
                            thisConstraint.setRightContext(context);
                            thisConstraint.setLeftContext(leftContext);
                            if (thisConstraint.isMatch()) {
                                leftContext.blocker = context;
                                this.addToLeftBlockedMemory(context.blocking.push(leftContext));
                                leftContext = null;
                                return;
                            } else {
                                //we arent blocked anymore
                                leftContext.blocker = null;
                                node = ctx;
                                while ((node = node.next)) {
                                    if (thisConstraint.setRightContext(rc = node.data).isMatch()) {
                                        leftContext.blocker = rc;
                                        this.addToLeftBlockedMemory(rc.blocking.push(leftContext));
                                        leftContext = null;
                                        break;
                                    }
                                }
                                if (leftContext) {
                                    this.__addToLeftMemory(leftContext);
                                    this.__propagate("assert", leftContext.clone());
                                }
                                thisConstraint.clearContexts();
                            }
                        }
                        thisConstraint.clearContexts();
                    }

                }
            } else {
                throw new Error();
            }


        }
    }
}).as(module);