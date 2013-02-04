"use strict";
var extd = require("./extended"),
    bind = extd.bind,
    removeDuplicates = extd.removeDuplicates,
    forEach = extd.forEach,
    some = extd.some,
    indexOf = extd.indexOf,
    intersect = extd.intersect,
    declare = extd.declare,
    object = extd.hash,
    keys = object.keys,
    HashTable = extd.HashTable,
    MatchResult = require("./matchResult"),
    pattern = require("./pattern.js"),
    ObjectPattern = pattern.ObjectPattern,
    NotPattern = pattern.NotPattern,
    CompositePattern = pattern.CompositePattern,
    InitialFactPattern = pattern.InitialFactPattern,
    constraints = require("./constraint"),
    HashConstraint = constraints.HashConstraint,
    ReferenceConstraint = constraints.ReferenceConstraint;

var Node = declare({
    instance: {
        constructor: function () {
            this.nodes = new HashTable();
            this.parentNodes = [];

        },

        resolve: function (mr1, mr2) {
            var mr1FactHash = mr1.factHash, mr2FactHash = mr2.factHash;
            var fhKeys1 = keys(mr1FactHash),
                fhKeys2 = keys(mr2FactHash);
            var i = fhKeys1.length - 1, j = fhKeys2.length - 1;
            if (i !== j) {
                return false;
            }
            fhKeys1.sort();
            fhKeys2.sort();
            for (; i >= 0; i--) {
                var k1 = fhKeys1[i], k2 = fhKeys2[i];
                if (k1 === k2 && mr1FactHash[k1] !== mr2FactHash[k2]) {
                    return false;
                }
            }

            return true;
        },

        print: function (tab) {
            console.log(tab + this.toString());
            forEach(this.parentNodes, function (n) {
                n.print("  " + tab);
            });
        },

        addOutNode: function (outNode, pattern) {
            if (!this.nodes.contains(outNode)) {
                this.nodes.put(outNode, []);
            }
            this.nodes.get(outNode).push(pattern);
        },

        addParentNode: function (n) {
            this.parentNodes.push(n);
        },

        shareable: function () {
            return false;
        },

        __propagate: function (method, assertable, outNodes) {
            outNodes = outNodes || this.nodes;
            var entrySet = outNodes.entrySet(), i = entrySet.length - 1, entry, outNode, paths, continuingPaths;
            for (; i >= 0; i--) {
                entry = entrySet[i];
                outNode = entry.key;
                paths = entry.value;
                if (assertable.paths) {
                    if ((continuingPaths = intersect(paths, assertable.paths)).length) {
                        outNode[method]({fact: assertable.fact, factHash: {}, paths: continuingPaths});
                    }
                } else {
                    outNode[method](assertable);
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
            return extd.format("%j", this.constraint.constraint);
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
                this.propagateAssert({fact: fact});
            }
        },

        retract: function (fact) {
            if (this.constraint.assert(fact.object)) {
                this.propagateRetract({fact: fact});
            }
        },

        toString: function () {
            return "Type Node" + this.constraint.constraint;
        },

        dispose: function () {
            var es = this.nodes.entrySet(), i = es.length - 1;
            for (; i >= 0; i--) {
                var e = es[i], outNode = e.key, paths = e.value;
                outNode.dispose({paths: paths});
            }
        },

        __propagate: function (method, assertion, outNodes) {
            var es = (outNodes || this.nodes).entrySet(), i = es.length - 1;
            for (; i >= 0; i--) {
                var e = es[i], outNode = e.key, paths = e.value;
                assertion.factHash = {};
                assertion.paths = paths;
                outNode[method](assertion);
            }
        }
    }
});

var PropertyNode = AlphaNode.extend({
    instance: {

        constructor: function () {
            this._super(arguments);
            this.alias = this.constraint.get("alias");
        },

        assert: function (assertable) {
            var fh = {}, constraint = this.constraint, o = assertable.fact.object, alias = this.alias;
            fh[alias] = o;
            if (constraint.assert(fh)) {
                assertable.factHash[alias] = o;
                this._super([assertable]);
            }
        },

        toString: function () {
            return "Property Node" + this._super(arguments);
        }
    }
});

var ReferenceNode = AlphaNode.extend({
    instance: {

        constructor: function () {
            this._super(arguments);
            this.__alias = this.constraint.get("alias");
            this.__variables = this.constraint.get("variables");
        },

        //used by NotNode to avoid creating match Result for efficiency
        isMatch: function (leftContext, rightContext) {
            var leftMatch = leftContext.match,
                fh = leftMatch.factHash,
                alias = this.__alias,
                rightFact = rightContext.fact;
            fh[alias] = rightFact.object;
            var ret = this.constraint.assert(fh);
            fh[alias] = null;
            return ret;

        },


        match: function (leftContext, rightContext) {
            var leftMatch = leftContext.match,
                fh = leftMatch.factHash,
                alias = this.__alias,
                rightFact = rightContext.fact,
                ro = fh[alias] = rightFact.object;
            if (this.constraint.assert(fh)) {
                var mr = new MatchResult().merge(leftMatch);
                mr.isMatch = true;
                mr.factHash[alias] = ro;
                mr.recency.push(rightFact.recency);
                return mr;
            }
            fh[alias] = null;
            return new MatchResult();
        },
        toString: function () {
            return "Reference Node" + this._super(arguments);
        }
    }
});


var JoinReferenceNode = Node.extend({

    instance: {

        addConstraint: function (constraint) {
            if (!this.constraint) {
                this.constraint = constraint;
            } else {
                this.constraint = this.constraint.merge(constraint);
            }
            this.__alias = this.constraint.get("alias");
            this.__variables = this.constraint.get("variables");
        },

        isMatch: function (leftContext, rightContext) {
            if (!this.constraint) {
                return true;
            }
            var fh = leftContext.match.factHash,
                alias = this.__alias,
                ret;
            fh[alias] = rightContext.fact.object;
            ret = this.constraint.assert(fh);
            fh[alias] = null;
            return ret;
        },

        match: function (leftContext, rightContext) {
            if (!this.constraint) {
                return leftContext.match.merge(rightContext.match);
            }
            var leftMatch = leftContext.match,
                fh = leftMatch.factHash,
                alias = this.__alias,
                rightFact = rightContext.fact,
                ro = fh[alias] = rightFact.object;
            if (this.constraint.assert(fh)) {
                var mr = rightContext.match.merge(leftMatch);
                mr.isMatch = true;
                mr.factHash[alias] = ro;
                mr.recency.push(rightFact.recency);
                return mr;
            }
            fh[alias] = null;
            return new MatchResult();
        }

    }

});

var EqualityNode = AlphaNode.extend({
    instance: {

        constructor: function () {
            this._super(arguments);
            this.alias = this.constraint.get("alias");
        },

        assert: function (assertable) {
            var fh = {};
            fh[this.alias] = assertable.fact.object;
            if (this.constraint.assert(fh)) {
                this._super([assertable]);
            }
        },

        toString: function () {
            return "Equality Node" + this._super(arguments);
        }
    }
});


var BridgeNode = Node.extend({

    instance: {

        constructor: function (pattern) {
            this._super([]);
            this.pattern = pattern;
            this.constraints = pattern.get("constraints");
            this.alias = pattern.alias;
        },

        toString: function () {
            return "Base Bridge Node " + this.pattern;
        },

        assert: function (assertable) {
            var mr = new MatchResult(assertable), constraints = this.constraints;
            mr.isMatch = true;
            var fact = assertable.fact, o = fact.object, fh = mr.factHash;
            var i = constraints.length - 1;
            fh[this.alias] = o;
            for (; i > 0; i--) {
                var constraint = constraints[i];
                if (constraint instanceof HashConstraint) {
                    var hash = constraint.get("variables");
                    for (var j in hash) {
                        fh[hash[j]] = o[j];
                    }
                }
            }
            this.propagateAssert({match: mr, fact: fact});
        },

        retract: function (assertable) {
            this.propagateRetract(assertable.fact);
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
        }
    }
});


var count = 0;
var JoinNode = Node.extend({

    instance: {
        constructor: function () {
            this._super([]);
            this.constraint = new JoinReferenceNode();
            this.leftMemory = new HashTable();
            this.rightMemory = new HashTable();
            this.leftTuples = [];
            this.rightTuples = [];
            this.__count = count++;
        },

        dispose: function () {
            this.leftMemory.clear();
            this.rightMemory.clear();
        },

        disposeLeft: function (fact) {
            this.leftMemory.clear();
            this.propagateDispose(fact);
        },

        disposeRight: function (fact) {
            this.rightMemory.clear();
            this.propagateDispose(fact);
        },

        hashCode: function () {
            return  "JoinNode " + this.__count;
        },

        toString: function () {
            return "JoinNode " + extd.format("%j", this.leftMemory.values()) + " " + extd.format("%j", this.rightMemory.values());
        },

        retractResolve: function (match) {
            var es = this.leftMemory.values(), j = es.length - 1, leftTuples = this.leftTuples;
            for (; j >= 0; j--) {
                var contexts = es[j], i = contexts.length - 1, context;
                for (; i >= 0; i--) {
                    context = contexts[i];
                    if (this.resolve(context.match, match)) {
                        leftTuples.splice(indexOf(leftTuples, context), 1);
                        contexts.splice(i, 1);
                    }
                }
            }
            this._propagateRetractResolve(match);
        },

        retractLeft: function (fact) {
            var contexts = this.leftMemory.remove(fact), tuples = this.leftTuples;
            if (contexts) {
                for (var i = 0, l = contexts.length; i < l; i++) {
                    tuples.splice(indexOf(tuples, contexts[i]), 1);
                }
            }
            this.propagateRetract(fact);
        },

        retractRight: function (fact) {
            var context = this.rightMemory.remove(fact), tuples = this.rightTuples;
            if (context) {
                tuples.splice(indexOf(tuples, context), 1);
            }
            this.propagateRetract(fact);
        },

        assertLeft: function (context) {
            this.__addToLeftMemory(context);
            var rm = this.rightTuples, i = rm.length - 1, thisConstraint = this.constraint, mr;
            for (; i >= 0; i--) {
                if ((mr = thisConstraint.match(context, rm[i])).isMatch) {
                    this.propagateAssert({fact: context.fact, match: mr});
                }
            }
        },

        assertRight: function (context) {
            this.rightMemory.put(context.fact, context);
            this.rightTuples.push(context);
            var fl = this.leftTuples, i = fl.length - 1, thisConstraint = this.constraint, mr;
            for (; i >= 0; i--) {
                if ((mr = thisConstraint.match(fl[i], context)).isMatch) {
                    this.propagateAssert({fact: context.fact, match: mr});
                }
            }
        },

        _propagateRetractResolve: function (context) {
            this.__propagate("retractResolve", context);
        },

        __addToLeftMemory: function (context) {
            var o = context.fact;
            var lm = this.leftMemory.get(o);
            if (!lm) {
                lm = [];
                this.leftMemory.put(o, lm);
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
            this.leftTupleMemory = new HashTable();
        },


        toString: function () {
            return "NotNode " + extd.format("%j", this.leftMemory.values()) + " " + extd.format("%j", this.rightMemory.values());
        },


        retractRight: function (fact) {
            var rightMemory = this.rightMemory;
            var rightContext = rightMemory.remove(fact);
            if (rightContext) {
                this.rightTuples.splice(indexOf(this.rightTuples, rightContext), 1);
                var fl = rightContext.blocking, leftContext;
                var rValues = rightMemory.values(), k = rValues.length, j, rc;
                while ((leftContext = fl.pop())) {
                    leftContext.blocker = null;
                    for (j = 0; j < k; j++) {
                        rc = rValues[j];
                        if (this.__matchRefNodes(leftContext, rc)) {
                            break;
                        }
                    }
                    if (!leftContext.blocker) {
                        this.__removeFromLeftTupleMemory(leftContext);
                        this.__addToLeftMemory(leftContext).propagateAssert(leftContext);
                    }
                }
            }
        },


        retractLeft: function (fact) {
            var contexts = this.leftMemory.remove(fact), i, l;
            if (!contexts) {
                var leftContexts = this.leftTupleMemory.remove(fact), leftContext;
                if (leftContexts) {
                    for (i = 0, l = leftContexts.length; i < l; i++) {
                        leftContext = leftContexts[i];
                        var blocking = leftContext.blocker.blocking;
                        for (var j = 0, k = blocking.length; j < k; j++) {
                            if (blocking[j] === leftContext) {
                                blocking.splice(j, 1);
                                break;
                            }
                        }
                    }
                }
            } else {
                var tuples = this.leftTuples;
                for (i = 0, l = contexts.length; i < l; i++) {
                    tuples.splice(indexOf(tuples, contexts[i]), 1);
                }
            }
            this.propagateRetract(fact);
        },

        assertLeft: function (context) {
            var values = this.rightTuples;
            for (var i = 0, l = values.length; i < l; i++) {
                if (this.__matchRefNodes(context, values[i])) {
                    //blocked so return
                    return;
                }
            }
            this.__addToLeftMemory(context).propagateAssert(context);
        },

        assertRight: function (context) {
            context.blocking = [];
            this.rightTuples.push(context);
            this.rightMemory.put(context.fact, context);
            var fl = this.leftTuples, i = fl.length - 1, leftContext;
            for (; i >= 0; i--) {
                leftContext = fl[i];
                if (this.__matchRefNodes(leftContext, context)) {
                    this._propagateRetractResolve(leftContext.match);
                    //blocked so remove from memory
                    this.__removeFromLeftMemory(leftContext);


                }
            }
        },

        __removeFromLeftMemory: function (context) {
            var leftMemories = this.leftMemory.get(context.fact), lc, tuples = this.leftTuples;
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
            var leftMemories = this.leftTupleMemory.get(context.fact), lc;
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
            var lm = this.leftTupleMemory.get(o);
            if (!lm) {
                lm = [];
                this.leftTupleMemory.put(o, lm);
            }
            lm.push(context);
            return this;
        },

        __matchRefNodes: function (leftContext, rightContext) {
            if (!this.constraint.isMatch(leftContext, rightContext)) {
                return false;
            }
            leftContext.blocker = rightContext;
            rightContext.blocking.push(leftContext);
            this.__addToLeftTupleMemory(leftContext);
            return true;
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
            var resolve = extd.bind(this, this.resolve);
            this.agenda.retract(this, function (v) {
                return resolve(v.match, match);
            });
        },

        toString: function () {
            return "Terminal Node " + this.rule.name;
        }
    }
});

declare({
    instance: {
        constructor: function (wm, agendaTree) {
            this.terminalNodes = [];
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

        __createReferenceNode: function (constraint) {
            return this.__checkEqual(new ReferenceNode(constraint));
        },

        __createPropertyNode: function (constraint) {
            return this.__checkEqual(new PropertyNode(constraint));
        },

        __createBridgeNode: function (pattern) {
            return new BridgeNode(pattern);
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
                    return this.__addToNetwork(new CompositePattern(new InitialFactPattern(), pattern), outNode, side);
                }
                return this.__createAlphaNode(pattern, outNode, side);
            } else if (pattern instanceof CompositePattern) {
                var joinNode = this.__createJoinNode(pattern, outNode, side);
                this.__addToNetwork(pattern.rightPattern, joinNode, "right");
                this.__addToNetwork(pattern.leftPattern, joinNode, "left");
                outNode.addParentNode(joinNode);
                return joinNode;
            }
        },


        __createAlphaNode: function (pattern, outNode, side) {
            var constraints = pattern.get("constraints");
            var typeNode = this.__createTypeNode(pattern);
            var parentAtom = constraints[0];
            var parentNode = typeNode;
            var i = constraints.length - 1;
            for (; i > 0; i--) {
                var constraint = constraints[i], node;
                if (constraint instanceof HashConstraint) {
                    node = this.__createPropertyNode(constraint);
                } else if (constraint instanceof ReferenceConstraint) {
                    node = this.__createReferenceNode(constraint);
                    outNode.constraint.addConstraint(constraint);
                } else {
                    node = this.__createEqualityNode(constraint);
                }
                parentNode.addOutNode(node, pattern, parentAtom);
                node.parentNodes.push(parentNode);
                parentNode = node;
                parentAtom = constraint;
            }
            var bridgeNode = this.__createBridgeNode(pattern);
            parentNode.addOutNode(bridgeNode, pattern, parentAtom);
            bridgeNode.addParentNode(parentNode);
            parentNode = bridgeNode;
            outNode.addParentNode(parentNode);
            if (outNode instanceof JoinNode) {
                var adapterNode = this.__createAdapterNode(side);
                parentNode.addOutNode(adapterNode, pattern);
                parentNode = adapterNode;
            }
            parentNode.addOutNode(outNode, pattern);
            return typeNode;
        },

        print: function () {
            forEach(this.terminalNodes, function (t) {
                t.print("  ");
            });
        }
    }
}).as(exports, "RootNode");





