define(null, {
    instance:{
        constructor:function () {
            this.nodes = new HashTable();
            this.parentNodes = [];

        },

        resolve:function (mr1, mr2) {
            var mr1FactHash = mr1.factHash, mr2FactHash = mr2.factHash;
            var fhKeys1 = Object.keys(mr1FactHash),
                fhKeys2 = Object.keys(mr2FactHash);
            var i = fhKeys1.length - 1, j = fhKeys2.length - 1;
            if (i != j) return false;
            fhKeys1.sort();
            fhKeys2.sort();
            for (; i >= 0; i--) {
                var k1 = fhKeys1[i], k2 = fhKeys2[i];
                if (k1 == k2 && mr1FactHash[k1] !== mr2FactHash[k2]) {
                    return false;
                }
            }

            return true;
        },

        print:function (tab) {
            console.log(tab + this.toString());
            this.parentNodes.forEach(function (n) {
                n.print("  " + tab);
            });
        },

        addOutNode:function (outNode, pattern) {
            if (!this.nodes.contains(outNode)) {
                this.nodes.put(outNode, []);
            }
            this.nodes.get(outNode).push(pattern);
        },

        addParentNode:function (n) {
            this.parentNodes.push(n);
        },

        shareable:function () {
            return false;
        },

        __propagate:function (method, assertable, outNodes) {
            outNodes = outNodes || this.nodes;
            var entrySet = outNodes.entrySet, i = entrySet.length - 1;
            for (; i >= 0; i--) {
                var entry = entrySet[i], outNode = entry.key, paths = entry.value;
                if (assertable.paths) {
                    var continuingPaths = intersect(paths, assertable.paths);
                    if (continuingPaths.length) {
                        outNode[method]({fact:assertable.fact, factHash:{}, paths:continuingPaths});
                    }
                } else {
                    outNode[method](assertable);
                }
            }
        },

        dispose:function (assertable) {
            this.propagateDispose(assertable);
        },

        retract:function (assertable) {
            this.propagateRetract(assertable);
        },

        propagateDispose:function (assertable, outNodes) {
            outNodes = outNodes || this.nodes;
            var entrySet = outNodes.entrySet, i = entrySet.length - 1;
            for (; i >= 0; i--) {
                var entry = entrySet[i], outNode = entry.key;
                outNode.dispose(assertable);
            }
        },

        propagateAssert:function (assertable, outNodes) {
            this.__propagate("assert", assertable, outNodes || this.nodes);
        },

        propagateRetract:function (assertable, outNodes) {
            this.__propagate("retract", assertable, outNodes || this.nodes);
        },

        assert:function (assertable) {
            this.propagateAssert(assertable);
        },

        propagateModify:function (assertable, outNodes) {
            this.__propagate("modify", assertable, outNodes || this.nodes);
        }
    }

}).as(module);