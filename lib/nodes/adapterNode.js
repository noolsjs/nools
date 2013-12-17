var Node = require("./node"),
    intersection = require("../extended").intersection;

Node.extend({
    instance: {

        __propagatePaths: function (method, context) {
            var entrySet = this.__entrySet, i = entrySet.length, entry, outNode, paths, continuingPaths;
            while (--i > -1) {
                entry = entrySet[i];
                outNode = entry.key;
                paths = entry.value;
                if ((continuingPaths = intersection(paths, context.paths)).length) {
                    outNode[method](context.clone(null, continuingPaths, null));
                }
            }
        },

        __propagateNoPaths: function (method, context) {
            var entrySet = this.__entrySet, i = entrySet.length;
            while (--i > -1) {
                entrySet[i].key[method](context);
            }
        },

        __propagate: function (method, context) {
            if (context.paths) {
                this.__propagatePaths(method, context);
            } else {
                this.__propagateNoPaths(method, context);
            }
        }
    }
}).as(module);