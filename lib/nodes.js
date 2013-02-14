"use strict";
var extd = require("./extended"),
    bind = extd.bind,
    merge = extd.merge,
    removeDuplicates = extd.removeDuplicates,
    forEach = extd.forEach,
    some = extd.some,
    indexOf = extd.indexOf,
    intersect = extd.intersect,
    declare = extd.declare,
    object = extd.hash,
    values = object.values,
    keys = object.keys,
    HashTable = extd.HashTable,
    Context = require("./context"),
    pattern = require("./pattern.js"),
    ObjectPattern = pattern.ObjectPattern,
    NotPattern = pattern.NotPattern,
    CompositePattern = pattern.CompositePattern,
    InitialFactPattern = pattern.InitialFactPattern,
    constraints = require("./constraint"),
    HashConstraint = constraints.HashConstraint,
    ReferenceConstraint = constraints.ReferenceConstraint;

var count = 0;
var Node = declare({
    instance: {
        constructor: function () {
            this.nodes = new HashTable();
            this.parentNodes = [];
            this.__count = count++;

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
            var entrySet = outNodes.entrySet(), i = entrySet.length - 1, entry, outNode, paths, continuingPaths;
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
            var entrySet = outNodes.entrySet(), i = entrySet.length - 1;
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

});

var AlphaNode = Node.extend({
    instance: {
        constructor: function (constraint) {
            this._super([]);
            this.constraint = constraint;
        },

        toString: function () {
            return "AlphaNode " + this.__count;
        },

        equal: function (constraint) {
            return this.constraint.equal(constraint.constraint);
        }
    }
});

var TypeNode = AlphaNode.extend({
    instance: {

        assert: function (fact) {
            if (this.constraint.assert(fact.object)) {
                this.propagateAssert(fact);
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
            var es = this.nodes.entrySet(), i = es.length - 1;
            for (; i >= 0; i--) {
                var e = es[i], outNode = e.key, paths = e.value;
                outNode.dispose({paths: paths});
            }
        },

        __propagate: function (method, fact, outNodes) {
            var es = (outNodes || this.nodes).entrySet(), i = es.length - 1;
            for (; i >= 0; i--) {
                var e = es[i], outNode = e.key, paths = e.value;
                outNode[method](new Context(fact, paths));
            }
        }
    }
});

var AliasNode = AlphaNode.extend({
    instance: {

        constructor: function () {
            this._super(arguments);
            this.alias = this.constraint.get("alias");
        },

        toString: function () {
            return "AliasNode" + this.__count;
        },

        assert: function (context) {
            return this.propagateAssert(context.set(this.alias, context.fact.object));
        },

        retract: function (assertable) {
            this.propagateRetract(assertable.fact);
        },

        equal: function (other) {
            return other instanceof this._static && this.alias === other.alias;
        }
    }
});

var EqualityNode = AlphaNode.extend({
    instance: {

        constructor: function () {
            this._super(arguments);
            this.alias = this.constraint.get("alias");
        },

        assert: function (context) {
            if (this.constraint.assert(context.factHash)) {
                this._super([context]);
            }
        },

        toString: function () {
            return "EqualityNode" + this.__count;
        }
    }
});

var PropertyNode = AlphaNode.extend({
    instance: {

        constructor: function () {
            this._super(arguments);
            this.alias = this.constraint.get("alias");
            this.variables = this.constraint.get("variables");
        },

        assert: function (context) {
            var c = new Context(context.fact, context.paths);
            var variables = this.variables, o = context.fact.object;
            c.set(this.alias, o);
            for (var i in variables) {
                c.set(variables[i], o[i]);
            }

            this.propagateAssert(c);

        },

        toString: function () {
            return "PropertyNode" + this.__count;
        }
    }
});

var JoinReferenceNode = Node.extend({

    instance: {

        constructor: function () {
            this._super(arguments);
            this.__fh = {};
            this.__lc = this.__rc = this.__hc = null;
        },

        setLeftContext: function (lc) {
            this.__lc = lc;
            var match = lc.match;
            var newFh = match.factHash, fh = this.__fh;
            for (var i in newFh) {
                fh[i] = newFh[i];
            }
            return this;
        },

        setRightContext: function (rc) {
            this.__fh[this.__alias] = (this.__rc = rc).fact.object;
            return this;
        },

        clearContexts: function () {
            this.__fh = {};
            this.__lc = null;
            this.__rc = null;
            this.__hc = "";
            return this;
        },

        clearRightContext: function () {
            this.__rc = null;
            this.__fh[this.__alias] = null;
            return this;
        },

        clearLeftContext: function () {
            this.__lc = null;
            var fh = this.__fh = {}, rc = this.__rc;
            fh[this.__alias] = rc ? rc.fact.object : null;
            return this;
        },

        addConstraint: function (constraint) {
            if (!this.constraint) {
                this.constraint = constraint;
            } else {
                this.constraint = this.constraint.merge(constraint);
            }
            this.__alias = this.constraint.get("alias");
            this.__variables = this.constraint.get("variables");
        },

        equal: function (constraint) {
            if (this.constraint) {
                return this.constraint.equal(constraint.constraint);
            }
        },

        isMatch: function () {
            var constraint = this.constraint;
            if (constraint) {
                return constraint.assert(this.__fh);
            }
            return true;
        },

        match: function () {
            var ret = {isMatch: false}, constraint = this.constraint;
            if (!constraint) {
                ret = this.__lc.match.merge(this.__rc.match);
            } else {
                var rightContext = this.__rc, fh = this.__fh;
                if (constraint.assert(fh)) {
                    ret = this.__lc.match.merge(rightContext.match);
                }
            }
            return ret;
        }

    }

});


var LeftAdapterNode = Node.extend({
    instance: {
        propagateAssert: function (context) {
            this.__propagate("assertLeft", context);
        },

        propagateRetract: function (context) {
            this.__propagate("retractLeft", context);
        },

        propagateResolve: function (context) {
            this.__propagate("retractResolve", context);
        },

        modify: function (context) {
            this.__propagate("modifyLeft", context);
        },

        retractResolve: function (match) {
            this.__propagate("retractResolve", match);
        },

        dispose: function (context) {
            this.propagateDispose(context);
        },

        toString: function () {
            return "LeftAdapterNode " + this.__count;
        }
    }

});

var RightAdapterNode = Node.extend({
    instance: {

        retractResolve: function (match) {
            this.__propagate("retractResolve", match);
        },

        dispose: function (context) {
            this.propagateDispose(context);
        },

        propagateAssert: function (context) {
            this.__propagate("assertRight", context);
        },

        propagateRetract: function (context) {
            this.__propagate("retractRight", context);
        },

        propagateResolve: function (context) {
            this.__propagate("retractResolve", context);
        },

        modify: function (context) {
            this.__propagate("modifyRight", context);
        },

        toString: function () {
            return "RightAdapterNode " + this.__count;
        }
    }
});


var JoinNode = Node.extend({

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
            var es = values(this.leftMemory), j = es.length - 1, leftTuples = this.leftTuples;
            for (; j >= 0; j--) {
                var contexts = es[j], i = contexts.length - 1, context;
                for (; i >= 0; i--) {
                    context = contexts[i];
                    if (this.resolve(context.match, match)) {
                        leftTuples.splice(indexOf(leftTuples, context), 1);
                        contexts.splice(i, 1);
                        return this._propagateRetractResolve(match);
                    }
                }
            }
            this._propagateRetractResolve(match);
        },

        retractLeft: function (fact) {
            var contexts = this.leftMemory[fact.id], tuples = this.leftTuples;
            if (contexts) {
                for (var i = 0, l = contexts.length; i < l; i++) {
                    tuples.splice(indexOf(tuples, contexts[i]), 1);
                }
            }
            delete this.leftMemory[fact.id];
            this.propagateRetract(fact);
        },

        retractRight: function (fact) {
            var context = this.rightMemory[fact.id], tuples = this.rightTuples;
            if (context) {
                tuples.splice(indexOf(tuples, context), 1);
            }
            delete this.rightMemory[fact.id];
            this.propagateRetract(fact);
        },

        assertLeft: function (context) {
            var fact = context.fact;
            this.__addToLeftMemory(context);
            var rm = this.rightTuples, i = rm.length - 1, thisConstraint = this.constraint, mr;
            thisConstraint.setLeftContext(context);
            for (; i >= 0; i--) {
                if ((mr = thisConstraint.setRightContext(rm[i]).match()).isMatch) {
                    this.propagateAssert(new Context(fact, null, mr));
                }
            }
            thisConstraint.clearContexts();
        },

        assertRight: function (context) {
            var fact = context.fact;
            this.rightMemory[fact.id] = context;
            this.rightTuples.push(context);
            var fl = this.leftTuples, i = fl.length - 1, thisConstraint = this.constraint, mr;
            thisConstraint.setRightContext(context);
            for (; i >= 0; i--) {
                if ((mr = thisConstraint.setLeftContext(fl[i]).match()).isMatch) {
                    this.propagateAssert(new Context(fact, null, mr));
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

});


var NotNode = JoinNode.extend({
    instance: {

        constructor: function () {
            this._super(arguments);
            this.leftTupleMemory = {};
        },


        toString: function () {
            return "NotNode " + this.__count;
        },


        retractRight: function (fact) {
            var rightMemory = this.rightMemory;
            var rightContext = rightMemory[fact.id], thisConstraint = this.constraint;
            delete rightMemory[fact.id];
            if (rightContext) {
                var index = indexOf(this.rightTuples, rightContext);
                this.rightTuples.splice(index, 1);
                var fl = rightContext.blocking, leftContext;
                var rValues = this.rightTuples, k = rValues.length, rc, j;
                while ((leftContext = fl.pop())) {
                    leftContext.blocker = null;
                    thisConstraint.setLeftContext(leftContext);
                    for (j = index; j < k; j++) {
                        rc = rValues[j];
                        if (thisConstraint.setRightContext(rc).isMatch()) {
                            leftContext.blocker = rc;
                            rc.blocking.push(leftContext);
                            this.__addToLeftTupleMemory(leftContext);
                            break;
                        }
                    }
                    if (!leftContext.blocker) {
                        this.__removeFromLeftTupleMemory(leftContext);
                        this.__addToLeftMemory(leftContext).propagateAssert(new Context(leftContext.fact, null, leftContext.match));
                    }
                }
                thisConstraint.clearContexts();
            }
        },


        retractLeft: function (fact) {
            var contexts = this.leftMemory[fact.id], i, l;
            if (!contexts) {
                var leftContexts = this.leftTupleMemory[fact.id], leftContext;
                delete this.leftTupleMemory[fact.id];
                if (leftContexts) {
                    for (i = 0, l = leftContexts.length; i < l; i++) {
                        leftContext = leftContexts[i];
                        var blocking = leftContext.blocker.blocking;
                        blocking.splice(indexOf(blocking, leftContext), 1);
                    }
                }
            } else {
                delete this.leftMemory[fact.id];
                var tuples = this.leftTuples;
                for (i = 0, l = contexts.length; i < l; i++) {
                    tuples.splice(indexOf(tuples, contexts[i]), 1);
                }
            }
            this.propagateRetract(fact);
        },

        assertLeft: function (context) {
            var values = this.rightTuples, thisConstraint = this.constraint;
            thisConstraint.setLeftContext(context);
            for (var i = 0, l = values.length; i < l; i++) {
                var rc = values[i];
                if (thisConstraint.setRightContext(rc).isMatch()) {
                    context.blocker = rc;
                    rc.blocking.push(context);
                    this.__addToLeftTupleMemory(context);
                    return;
                }
            }
            thisConstraint.clearContexts();
            this.__addToLeftMemory(context).propagateAssert(new Context(context.fact, null, context.match));
        },

        assertRight: function (context) {
            context.blocking = [];
            this.rightTuples.push(context);
            this.rightMemory[context.fact.id] = context;
            var fl = this.leftTuples, i = fl.length - 1, leftContext, thisConstraint = this.constraint;
            thisConstraint.setRightContext(context);
            for (; i >= 0; i--) {
                leftContext = fl[i];
                if (thisConstraint.setLeftContext(leftContext).isMatch()) {
                    this._propagateRetractResolve(leftContext.match);
                    //blocked so remove from memory
                    this.__removeFromLeftMemory(leftContext);
                    leftContext.blocker = context;
                    context.blocking.push(leftContext);
                    this.__addToLeftTupleMemory(leftContext);
                }
            }
            thisConstraint.clearContexts();
        },

        __removeFromLeftMemory: function (context) {
            var leftMemories = this.leftMemory[context.fact.id], lc, tuples = this.leftTuples;
            for (var i = 0, l = leftMemories.length; i < l; i++) {
                lc = leftMemories[i];
                if (lc === context) {
                    leftMemories.splice(i, 1);
                    tuples.splice(indexOf(tuples, lc), 1);
                    break;
                }
            }
            return this;
        },

        __removeFromLeftTupleMemory: function (context) {
            var leftMemories = this.leftTupleMemory[context.fact.id], lc;
            for (var i = 0, l = leftMemories.length; i < l; i++) {
                lc = leftMemories[i];
                if (lc === context) {
                    leftMemories.splice(i, 1);
                    break;
                }
            }
            return this;
        },

        __addToLeftTupleMemory: function (context) {
            var o = context.fact;
            var lm = this.leftTupleMemory[o.id];
            if (!lm) {
                lm = [];
                this.leftTupleMemory[o.id] = lm;
            }
            lm.push(context);
            return this;
        }
    }
});

var TerminalNode = Node.extend({
    instance: {
        constructor: function (bucket, index, rule, agenda) {
            this._super([]);
            this.rule = rule;
            this.index = index;
            this.name = this.rule.name;
            this.agenda = agenda;
            this.bucket = bucket;
            agenda.register(this);
        },

        __assertModify: function (context) {
            var match = context.match;
            match.recency.sort(
                function (a, b) {
                    return a - b;
                }).reverse();
            match.facts = removeDuplicates(match.facts);
            if (match.isMatch) {
                var rule = this.rule, bucket = this.bucket;
                this.agenda.insert(this, {
                    rule: rule,
                    index: this.index,
                    name: rule.name,
                    recency: bucket.recency++,
                    match: match,
                    counter: bucket.counter
                });
            }
        },

        assert: function (context) {
            this.__assertModify(context);
        },

        modify: function (context) {
            this.__assertModify(context);
        },

        retract: function (fact) {
            this.agenda.removeByFact(this, fact);
        },

        retractRight: function (fact) {
            this.agenda.removeByFact(this, fact);
        },

        retractLeft: function (fact) {
            this.agenda.removeByFact(this, fact);
        },

        assertLeft: function (context) {
            this.__assertModify(context);
        },

        assertRight: function (context) {
            this.__assertModify(context);
        },

        retractResolve: function (match) {
            var resolve = bind(this, this.resolve);
            this.agenda.retract(this, function (v) {
                return resolve(v.match, match);
            });
        },

        toString: function () {
            return "TerminalNode " + this.rule.name;
        }
    }
});

declare({
    instance: {
        constructor: function (wm, agendaTree) {
            this.terminalNodes = [];
            this.joinNodes = [];
            this.nodes = [];
            this.constraints = [];
            this.typeNodes = [];
            this.__ruleCount = 0;
            this.bucket = {
                counter: 0,
                recency: 0
            };
            this.agendaTree = agendaTree;
        },

        assertRule: function (rule) {
            var terminalNode = new TerminalNode(this.bucket, this.__ruleCount++, rule, this.agendaTree);
            this.__addToNetwork(rule.pattern, terminalNode);
            this.__mergeJoinNodes();
            this.terminalNodes.push(terminalNode);
        },

        resetCounter: function () {
            this.bucket.counter = 0;
        },

        incrementCounter: function () {
            this.bucket.counter++;
        },

        assertFact: function (fact) {
            var typeNodes = this.typeNodes, i = typeNodes.length - 1;
            for (; i >= 0; i--) {
                typeNodes[i].assert(fact);
            }
        },

        retractFact: function (fact) {
            var typeNodes = this.typeNodes, i = typeNodes.length - 1;
            for (; i >= 0; i--) {
                typeNodes[i].retract(fact);
            }
        },


        containsRule: function (name) {
            return some(this.terminalNodes, function (n) {
                return n.rule.name === name;
            });
        },

        dispose: function () {
            var typeNodes = this.typeNodes, i = typeNodes.length - 1;
            for (; i >= 0; i--) {
                typeNodes[i].dispose();
            }
        },

        __mergeJoinNodes: function () {
            var joinNodes = this.joinNodes;
            for (var i = 0; i < joinNodes.length; i++) {
                var j1 = joinNodes[i], j2 = joinNodes[i + 1];
                if (j1 && j2 && j1.constraint.equal(j2.constraint)) {
                    j1.merge(j2);
                    joinNodes.splice(i + 1, 1);
                }
            }
        },

        __checkEqual: function (node) {
            var constraints = this.constraints, i = constraints.length - 1;
            for (; i >= 0; i--) {
                var n = constraints[i];
                if (node.equal(n)) {
                    return  n;
                }
            }
            constraints.push(node);
            return node;
        },

        __createTypeNode: function (pattern) {
            var ret = new TypeNode(pattern.get("constraints")[0]);
            var constraints = this.typeNodes, i = constraints.length - 1;
            for (; i >= 0; i--) {
                var n = constraints[i];
                if (ret.equal(n)) {
                    return  n;
                }
            }
            constraints.push(ret);
            return ret;
        },

        __createEqualityNode: function (constraint) {
            return this.__checkEqual(new EqualityNode(constraint));
        },

        __createPropertyNode: function (constraint) {
            return this.__checkEqual(new PropertyNode(constraint));
        },

        __createAliasNode: function (pattern) {
            return this.__checkEqual(new AliasNode(pattern));
        },

        __createAdapterNode: function (side) {
            return side === "left" ? new LeftAdapterNode() : new RightAdapterNode();
        },

        __createJoinNode: function (pattern, outNode, side) {
            var joinNode;
            if (pattern.rightPattern instanceof NotPattern) {
                joinNode = new NotNode();
            } else {
                joinNode = new JoinNode();
                this.joinNodes.push(joinNode);
            }
            var parentNode = joinNode;
            if (outNode instanceof JoinNode) {
                var adapterNode = this.__createAdapterNode(side);
                parentNode.addOutNode(adapterNode, pattern);
                parentNode = adapterNode;
            }
            parentNode.addOutNode(outNode, pattern);
            return joinNode;
        },

        __addToNetwork: function (pattern, outNode, side) {
            if (pattern instanceof ObjectPattern) {
                if (pattern instanceof NotPattern && (!side || side === "left")) {
                    return this.__addToBetaNetwork(new CompositePattern(new InitialFactPattern(), pattern), outNode, side);
                }
                return this.__createAlphaNode(pattern, outNode, side);
            } else if (pattern instanceof CompositePattern) {
                this.__addToBetaNetwork(pattern, outNode, side);
            }
        },

        __addToBetaNetwork: function (pattern, outNode, side) {
            var joinNode = this.__createJoinNode(pattern, outNode, side);
            this.__addToNetwork(pattern.rightPattern, joinNode, "right");
            this.__addToNetwork(pattern.leftPattern, joinNode, "left");
            outNode.addParentNode(joinNode);
            return joinNode;
        },


        __createAlphaNode: function (pattern, outNode, side) {
            var constraints = pattern.get("constraints");
            var typeNode = this.__createTypeNode(pattern);
            var aliasNode = this.__createAliasNode(pattern);
            typeNode.addOutNode(aliasNode, pattern);
            aliasNode.addParentNode(typeNode);
            var parentNode = aliasNode;
            var i = constraints.length - 1;
            for (; i > 0; i--) {
                var constraint = constraints[i], node;
                if (constraint instanceof HashConstraint) {
                    node = this.__createPropertyNode(constraint);
                } else if (constraint instanceof ReferenceConstraint) {
                    outNode.constraint.addConstraint(constraint);
                    continue;
                } else {
                    node = this.__createEqualityNode(constraint);
                }
                parentNode.addOutNode(node, pattern);
                node.addParentNode(parentNode);
                parentNode = node;
            }
            if (outNode instanceof JoinNode) {
                var adapterNode = this.__createAdapterNode(side);
                adapterNode.addParentNode(parentNode);
                parentNode.addOutNode(adapterNode, pattern);
                parentNode = adapterNode;
            }
            outNode.addParentNode(parentNode);
            parentNode.addOutNode(outNode, pattern);
            return typeNode;
        },

        print: function () {
            forEach(this.terminalNodes, function (t) {
                t.print("    ");
            });
        }
    }
}).as(exports, "RootNode");





