var comb = require("comb"),
    JoinNode = require("./joinNode"),
    array = comb.array,
    flatten = array.flatten,
    HashTable = comb.collections.HashTable,
    define = comb.define;

define(JoinNode, {
    instance:{

        toString:function () {
            return "NotNode " + JSON.stringify(this.leftMemory.values) + " " + JSON.stringify(this.rightMemory.values);
        },


        retractRight:function (fact) {
            var rightMemory = this.rightMemory;
            var rightContext = rightMemory.remove(fact.object);
            if (rightContext && !this.refNodes.length && rightMemory.isEmpty) {
                var fl = flatten(this.leftMemory.values), i = fl.length - 1;
                for (; i >= 0; i--) {
                    var leftContext = fl[i];
                    this.__matchRefNodes(leftContext, rightContext) && this.propagateAssert(leftContext);
                }
            }
        },

        assertLeft:function (context) {
            this.__addToLeftMemory(context);
            var rm = this.rightMemory;
            if (!this.refNodes.length && rm.isEmpty) {
                this.propagateAssert(context);
            } else {
                var values = rm.values, i = values.length - 1;
                for (; i >= 0; i--) {
                    if (this.__matchRefNodes(context, values[i])) {
                        return;
                    }
                }
                this.propagateAssert(context);
            }
        },

        assertRight:function (context) {
            this.rightMemory.put(context.fact.object, context);
            var fl = flatten(this.leftMemory.values), i = fl.length - 1;
            if (!this.refNodes.length) {
                for (; i >= 0; i--) {
                    this._propagateRetractResolve(fl[i].match);
                }
            } else {
                for (; i >= 0; i--) {
                    var leftContext = fl[i];
                    this.__matchRefNodes(leftContext, context) && this._propagateRetractResolve(leftContext.match);
                }
            }
        },

        modifyLeft:function (context) {
            this.leftMemory.put(context.fact.object, [context]);
        },

        __matchRefNodes:function (leftContext, rightContext) {
            var refNodes = this.refNodes, i = refNodes.length - 1;
            for (; i >= 0; i--) {
                if (!refNodes[i].isMatch(leftContext, rightContext)) {
                    return false;
                }
            }
            return true;
        }
    }
}).as(module);