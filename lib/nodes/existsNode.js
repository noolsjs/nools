var NotNode = require("./notNode"),
    LinkedList = require("../linkedList");


NotNode.extend({
    instance: {

        nodeType: "ExistsNode",

        blockedContext: function (leftContext, rightContext) {
            leftContext.blocker = rightContext;
            this.removeFromLeftMemory(leftContext);
            this.addToLeftBlockedMemory(rightContext.blocking.push(leftContext));
            this.__propagate("assert", this.__cloneContext(leftContext));
        },

        notBlockedContext: function (leftContext, propagate) {
            this.__addToLeftMemory(leftContext);
            propagate && this.__propagate("retract", this.__cloneContext(leftContext));
        },

        propagateFromLeft: function (leftContext) {
            this.notBlockedContext(leftContext, false);
        },


        retractLeft: function (context) {
            var ctx;
            if (!this.removeFromLeftMemory(context)) {
                if ((ctx = this.removeFromLeftBlockedMemory(context))) {
                    this.__propagate("retract", this.__cloneContext(ctx.data));
                } else {
                    throw new Error();
                }
            }
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
                    if (thisConstraint.isMatch(context, rc = blocker.data)) {
                        //propogate as a modify or assert
                        this.__propagate(!isBlocked ? "assert" : "modify", this.__cloneContext(leftContext));
                        context.blocker = rc;
                        this.addToLeftBlockedMemory(rc.blocking.push(context));
                        context = null;
                    }
                    if (context) {
                        node = {next: blocker.next};
                    }
                } else {
                    node = {next: rightTuples.head};
                }
                if (context && l) {
                    node = {next: rightTuples.head};
                    //we were propagated before
                    while ((node = node.next)) {
                        if (thisConstraint.isMatch(context, rc = node.data)) {
                            //we cant be proagated so retract previous

                            //we were asserted before so retract
                            this.__propagate(!isBlocked ? "assert" : "modify", this.__cloneContext(leftContext));

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
                    if (isBlocked) {
                        //we were blocked so retract
                        this.__propagate("retract", this.__cloneContext(context));
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
                    if (blocking.length) {
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
                                this.__propagate("assert", this.__cloneContext(leftContext));
                                leftContext = null;
                            } else {
                                //we arent blocked anymore
                                leftContext.blocker = null;
                                node = ctx;
                                while ((node = node.next)) {
                                    if (thisConstraint.isMatch(leftContext, rc = node.data)) {
                                        leftContext.blocker = rc;
                                        this.addToLeftBlockedMemory(rc.blocking.push(leftContext));
                                        this.__propagate("assert", this.__cloneContext(leftContext));
                                        leftContext = null;
                                        break;
                                    }
                                }
                                if (leftContext) {
                                    this.__addToLeftMemory(leftContext);
                                }
                            }
                        }
                    }

                    if (leftTuplesLength) {
                        //check currently left tuples in memory
                        node = {next: leftTuples.head};
                        while ((node = node.next)) {
                            leftContext = node.data;
                            if (thisConstraint.isMatch(leftContext, context)) {
                                this.__propagate("assert", this.__cloneContext(leftContext));
                                this.removeFromLeftMemory(leftContext);
                                this.addToLeftBlockedMemory(context.blocking.push(leftContext));
                                leftContext.blocker = context;
                            }
                        }
                    }


                }
            } else {
                throw new Error();
            }


        }
    }
}).as(module);