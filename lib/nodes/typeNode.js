var comb = require("comb"),
    AlphaNode = require("./alphaNode"),
    define = comb.define;

define(AlphaNode, {
    instance:{

        assert:function (fact) {
            if (this.constraint.assert(fact.object)) {
                this.propagateAssert({fact:fact});
            }
        },

        retract:function (fact) {
            if (this.constraint.assert(fact.object)) {
                this.propagateRetract({fact:fact});
            }
        },

        toString:function () {
            return "Type Node" + this.constraint.constraint;
        },

        dispose:function () {
            var es = this.nodes.entrySet, i = es.length - 1;
            for (; i >= 0; i--) {
                var e = es[i], outNode = e.key, paths = e.value;
                outNode.dispose({paths:paths});
            }
        },

        __propagate:function (method, assertion, outNodes) {
            var es = (outNodes || this.nodes).entrySet, i = es.length - 1;
            for (; i >= 0; i--) {
                var e = es[i], outNode = e.key, paths = e.value;
                assertion.factHash = {};
                assertion.paths = paths;
                outNode[method](assertion);
            }
        }
    }
}).as(module);