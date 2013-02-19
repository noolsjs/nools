var extd = require("../extended"),
    forEach = extd.forEach,
    indexOf = extd.indexOf,
    intersect = extd.intersect,
    declare = extd.declare,
    HashTable = extd.HashTable,
    Context = require("../context");

var count = 0;
declare({
    instance: {
        constructor: function () {
            this.nodes = new HashTable();
            this.parentNodes = [];
            this.__count = count++;
            this.__entrySet = [];
        },

        merge: function (that) {
            that.nodes.forEach(function (entry) {
                var patterns = entry.value, node = entry.key;
                for (var i = 0, l = patterns.length; i < l; i++) {
                    this.addOutNode(node, patterns[i]);
                }
                that.nodes.remove(node);
            }, this);
            var thatParentNodes = that.parentNodes;
            for (var i = 0, l = that.parentNodes.l; i < l; i++) {
                var parentNode = thatParentNodes[i];
                this.addParentNode(parentNode);
                parentNode.nodes.remove(that);
            }
            return this;
        },

        resolve: function (mr1, mr2) {
            return mr1.hashCode === mr2.hashCode;
        },

        print: function (tab) {
            console.log(tab + this.toString());
            forEach(this.parentNodes, function (n) {
                n.print("    " + tab);
            });
        },

        addOutNode: function (outNode, pattern) {
            if (!this.nodes.contains(outNode)) {
                this.nodes.put(outNode, []);
            }
            this.nodes.get(outNode).push(pattern);
            this.__entrySet = this.nodes.entrySet();
        },

        addParentNode: function (n) {
            if (indexOf(this.parentNodes, n) === -1) {
                this.parentNodes.push(n);
            }
        },

        shareable: function () {
            return false;
        },

        __propagate: function (method, context, outNodes) {
            outNodes = outNodes || this.nodes;
            var entrySet = this.__entrySet, i = entrySet.length - 1, entry, outNode, paths, continuingPaths;
            for (; i >= 0; i--) {
                entry = entrySet[i];
                outNode = entry.key;
                paths = entry.value;
                if (context.paths) {
                    if ((continuingPaths = intersect(paths, context.paths)).length) {
                        outNode[method](new Context(context.fact, continuingPaths, context.match));
                    }
                } else {
                    outNode[method](context);
                }
            }
        },

        dispose: function (assertable) {
            this.propagateDispose(assertable);
        },

        retract: function (assertable) {
            this.propagateRetract(assertable);
        },

        propagateDispose: function (assertable, outNodes) {
            outNodes = outNodes || this.nodes;
            var entrySet = this.__entrySet, i = entrySet.length - 1;
            for (; i >= 0; i--) {
                var entry = entrySet[i], outNode = entry.key;
                outNode.dispose(assertable);
            }
        },

        propagateAssert: function (assertable, outNodes) {
            this.__propagate("assert", assertable, outNodes || this.nodes);
        },

        propagateRetract: function (assertable, outNodes) {
            this.__propagate("retract", assertable, outNodes || this.nodes);
        },

        assert: function (assertable) {
            this.propagateAssert(assertable);
        },

        propagateModify: function (assertable, outNodes) {
            this.__propagate("modify", assertable, outNodes || this.nodes);
        }
    }

}).as(module);
