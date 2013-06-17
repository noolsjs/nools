var extd = require("../extended"),
    values = extd.hash.values,
    indexOf = extd.indexOf,
    Node = require("./node"),
    JoinReferenceNode = require("./joinReferenceNode");

Node.extend({

    instance: {
        constructor: function () {
            this._super([]);
            this.constraint = new JoinReferenceNode();
            this.leftMemory = {};
            this.rightMemory = {};
            this.leftTuples = [];
            this.rightTuples = [];
        },

        dispose: function () {
            this.leftMemory = {};
            this.rightMemory = {};
        },

        disposeLeft: function (fact) {
            this.leftMemory = {};
            this.propagateDispose(fact);
        },

        disposeRight: function (fact) {
            this.rightMemory = {};
            this.propagateDispose(fact);
        },

        hashCode: function () {
            return  "JoinNode " + this.__count;
        },

        toString: function () {
            return "JoinNode " + this.__count;
        },

        retractResolve: function (match) {
            var es = values(this.leftMemory), j = es.length, leftTuples = this.leftTuples;
            while (--j > -1) {
                var contexts = es[j], i = contexts.length, context;
                while (--i > -1) {
                    context = contexts[i];
                    if (this.resolve(context.match, match)) {
                        leftTuples.splice(indexOf(leftTuples, context), 1);
                        contexts.splice(i, 1);
                        break;
                    }
                }
            }
            this._propagateRetractResolve(match);
        },

        retractLeft: function (fact) {
            var contexts = this.leftMemory[fact.id], tuples = this.leftTuples, i, l;
            if (contexts) {
                i = -1;
                l = contexts.length;
                while (++i < l) {
                    tuples.splice(indexOf(tuples, contexts[i]), 1);
                }
                delete this.leftMemory[fact.id];
            } else {
                var tuple;
                for (i = 0; i < tuples.length; i++) {
                    tuple = tuples[i];
                    if (indexOf(tuple.factIds, fact.id) !== -1) {
                        tuples.splice(i, 1);
                    }
                }
            }
            this.propagateRetract(fact);
        },

        retractRight: function (fact) {
            var context = this.rightMemory[fact.id], tuples = this.rightTuples;
            if (context) {
                tuples.splice(indexOf(tuples, context), 1);
                delete this.rightMemory[fact.id];
            } else {
                var tuple;
                for (var i = 0; i < tuples.length; i++) {
                    tuple = tuples[i];
                    if (indexOf(tuple.factIds, fact.id) !== -1) {
                        tuples.splice(i, 1);
                    }
                }
            }
            this.propagateRetract(fact);
        },

        assertLeft: function (context) {
            this.__addToLeftMemory(context);
            var rm = this.rightTuples, i = -1, l = rm.length, thisConstraint = this.constraint, mr;
            thisConstraint.setLeftContext(context);
            while (++i < l) {
                if ((mr = thisConstraint.setRightContext(rm[i]).match()).isMatch) {
                    this.__propagate("assert", context.clone(null, null, mr));
                }
            }
            thisConstraint.clearContexts();
        },

        assertRight: function (context) {
            var fact = context.fact;
            this.rightMemory[fact.id] = context;
            this.rightTuples.push(context);
            var fl = this.leftTuples, i = -1, l = fl.length, thisConstraint = this.constraint, mr;
            thisConstraint.setRightContext(context);
            while (++i < l) {
                if ((mr = thisConstraint.setLeftContext(fl[i]).match()).isMatch) {
                    this.__propagate("assert", context.clone(null, null, mr));
                }
            }
            thisConstraint.clearContexts();
        },

        _propagateRetractResolve: function (context) {
            this.__propagate("retractResolve", context);
        },

        __addToLeftMemory: function (context) {
            var o = context.fact;
            var lm = this.leftMemory[o.id];
            if (!lm) {
                lm = [];
                this.leftMemory[o.id] = lm;
            }
            this.leftTuples.push(context);
            lm.push(context);
            return this;
        }
    }

}).as(module);