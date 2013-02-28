var AlphaNode = require("./alphaNode"),
    Context = require("../context");

AlphaNode.extend({
    instance: {

        assert: function (fact) {
            if (this.constraint.assert(fact.object)) {
                this.__propagate("assert", fact);
            }
        },

        retract: function (fact) {
            if (this.constraint.assert(fact.object)) {
                this.propagateRetract(fact);
            }
        },

        toString: function () {
            return "TypeNode" + this.__count;
        },

        dispose: function () {
            var es = this.__entrySet, i = es.length - 1;
            for (; i >= 0; i--) {
                var e = es[i], outNode = e.key, paths = e.value;
                outNode.dispose({paths: paths});
            }
        },

        __propagate: function (method, fact, outNodes) {
            var es = this.__entrySet, i = es.length - 1;
            for (; i >= 0; i--) {
                var e = es[i], outNode = e.key, paths = e.value;
                outNode[method](new Context(fact, paths));
            }
        }
    }
}).as(module);