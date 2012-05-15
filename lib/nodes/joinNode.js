var comb = require("comb"),
    Node = require("./node"),
    array = comb.array,
    flatten = array.flatten,
    HashTable = comb.collections.HashTable,
    define = comb.define;

var count = 0;
define(Node, {

    instance:{
        constructor:function () {
            this._super([]);
            this.leftMemory = new HashTable();
            this.rightMemory = new HashTable();
            this.refNodes = [];
            this.__count = count++;
        },

        dispose:function () {
            this.leftMemory.clear();
            this.rightMemory.clear();
        },

        disposeLeft:function (fact) {
            this.leftMemory.clear();
            this.propagateDispose(fact);
        },

        disposeRight:function (fact) {
            this.rightMemory.clear();
            this.propagateDispose(fact);
        },

        hashCode:function () {
            return  "JoinNode " + this.__count;
        },

        toString:function () {
            return "JoinNode " + JSON.stringify(this.leftMemory.values) + " " + JSON.stringify(this.rightMemory.values);
        },

        retractResolve:function (match) {
            var es = this.leftMemory.values, j = es.length - 1;
            for (; j >= 0; j--) {
                var contexts = es[j], i = contexts.length - 1;
                for (; i >= 0; i--) {
                    this.resolve(contexts[i].match, match) && contexts.splice(i, 1);
                }
            }
            this._propagateRetractResolve(match);
        },

        retractLeft:function (fact) {
            this.leftMemory.remove(fact.object);
            this.propagateRetract(fact);
        },

        retractRight:function (fact) {
            this.rightMemory.remove(fact.object);
            this.propagateRetract(fact);
        },

        assertLeft:function (context) {
            this.__addToLeftMemory(context);
            var rm = this.rightMemory.values, i = rm.length - 1;
            for (; i >= 0; i--) {
                var rightContext = rm[i];
                var mr = this.__matchRefNodes(context, rightContext);
                mr.isMatch && this.propagateAssert({fact:context.fact, match:mr});
            }
        },

        assertRight:function (context) {
            this.rightMemory.put(context.fact.object, context);
            var fl = flatten(this.leftMemory.values), i = fl.length - 1;
            for (; i >= 0; i--) {
                var leftContext = fl[i];
                var mr = this.__matchRefNodes(leftContext, context);
                mr.isMatch && this.propagateAssert({fact:context.fact, match:mr});
            }
        },

        modifyLeft:function (context) {
            this.leftMemory.put(context.fact.object, [context]);
            var rm = this.rightMemory.values, i = rm.length - 1;
            for (; i >= 0; i--) {
                var rightContext = rm[i];
                var mr = this.__matchRefNodes(context, rightContext);
                mr.isMatch && this.propagateModify({fact:context.fact, match:mr});
            }
        },

        modifyRight:function (context) {
            this.rightMemory.put(context.fact.object, context);
        },

        _propagateRetractResolve:function (match) {
            this.__propagate("retractResolve", match);
        },


        __matchRefNodes:function (leftContext, rightContext) {
            var mr = rightContext.match, refNodes = this.refNodes;
            if (!refNodes.length) {
                return leftContext.match.merge(mr);
            } else {
                var i = refNodes.length - 1;
                for (; i >= 0; i--) {
                    var refMr = refNodes[i].match(leftContext, rightContext);
                    if (refMr.isMatch) {
                        mr = mr.merge(refMr);
                    } else {
                        return refMr;
                    }
                }
            }
            return mr;
        },

        __addToLeftMemory:function (context) {
            var o = context.fact.object;
            var lm = this.leftMemory.get(o);
            if (!lm) {
                lm = [];
                this.leftMemory.put(o, lm);
            }
            lm.push(context);
        }
    }

}).as(module);