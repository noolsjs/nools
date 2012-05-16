(function () {
    "use strict";
    var comb = require("comb"),
        array = comb.array,
        flatten = array.flatten,
        intersect = array.intersect,
        union = array.union,
        define = comb.define,
        merge = comb.merge,
        isInstanceOf = comb.isInstanceOf,
        removeDuplicates = array.removeDuplicates,
        HashTable = comb.collections.HashTable,
        pattern = require("./pattern.js"),
        ObjectPattern = pattern.ObjectPattern,
        NotPattern = pattern.NotPattern,
        CompositePattern = pattern.CompositePattern,
        InitialFactPattern = pattern.InitialFactPattern,
        constraints = require("./constraint"),
        HashConstraint = constraints.HashConstraint,
        ReferenceConstraint = constraints.ReferenceConstraint;


    var MatchResult = define(null, {
        instance:{
            constructor:function (assertable) {
                assertable = assertable || {};
                this.variables = [];
                this.facts = [];
                this.factHash = {};
                this.recency = [];
                this.constraints = [];
                this.isMatch = false;
                var fact = assertable.fact;
                if (fact) {
                    this.facts.push(fact);
                    this.recency.push(fact.recency);
                }

            },

            merge:function (mr) {
                var ret = new this._static();
                ret.isMatch = mr.isMatch;
                ret.facts = this.facts.concat(mr.facts);
                merge(ret.factHash, this.factHash, mr.factHash);
                ret.recency = union(this.recency, mr.recency);
                return ret;
            },

            getters:{

                factIds:function () {
                    return this.facts.map(
                        function (fact) {
                            return fact.id;
                        }).sort();
                }
            }

        }
    });


    define(null, {
        instance:{
            constructor:function (wm, agendaTree) {
                this.terminalNodes = [];
                this.nodes = [];
                this.constraints = [];
                this.typeNodes = [];
                this.bucket = {
                    counter:0,
                    recency:0
                };
                this.agendaTree = agendaTree;
            },

            assertRule:function (rule) {
                var terminalNode = new TerminalNode(this.bucket, rule, this.agendaTree);
                this.__addToNetwork(rule.pattern, terminalNode);
                this.terminalNodes.push(terminalNode);
            },

            resetCounter:function () {
                this.bucket.counter = 0;
            },

            incrementCounter:function () {
                this.bucket.counter++;
            },

            assertFact:function (fact) {
                var typeNodes = this.typeNodes, i = typeNodes.length - 1;
                for (; i >= 0; i--) {
                    typeNodes[i].assert(fact);
                }
            },

            retractFact:function (fact) {
                var typeNodes = this.typeNodes, i = typeNodes.length - 1;
                for (; i >= 0; i--) {
                    typeNodes[i].retract(fact);
                }
            },


            containsRule:function (name) {
                return this.terminalNodes.some(function (n) {
                    return n.rule.name === name;
                });
            },

            dispose:function () {
                var typeNodes = this.typeNodes, i = typeNodes.length - 1;
                for (; i >= 0; i--) {
                    typeNodes[i].dispose();
                }
            },

            __checkEqual:function (node) {
                var constraints = this.constraints, i = constraints.length - 1;
                for (; i >= 0; i--) {
                    var n = constraints[i];
                    if (node.equal(n)) {
                        return  n;
                    }
                }
                this.constraints.push(node);
                return node;
            },

            __createTypeNode:function (pattern) {
                var ret = new TypeNode(pattern.constraints[0]);
                var constraints = this.typeNodes, i = constraints.length - 1;
                for (; i >= 0; i--) {
                    var n = constraints[i];
                    if (ret.equal(n)) {
                        return  n;
                    }
                }
                this.typeNodes.push(ret);
                return ret;
            },

            __createEqualityNode:function (constraint) {
                return this.__checkEqual(new EqualityNode(constraint));
            },

            __createReferenceNode:function (constraint) {
                return this.__checkEqual(new ReferenceNode(constraint));
            },

            __createPropertyNode:function (constraint) {
                return this.__checkEqual(new PropertyNode(constraint));
            },

            __createBridgeNode:function (pattern) {
                return new BridgeNode(pattern);
            },

            __createAdapterNode:function (side) {
                return side === "left" ? new LeftAdapterNode() : new RightAdapterNode();
            },

            __createJoinNode:function (pattern, outNode, side) {
                var joinNode;
                if (isInstanceOf(pattern.rightPattern, NotPattern)) {
                    joinNode = new NotNode();
                } else {
                    joinNode = new JoinNode();
                }
                var parentNode = joinNode;
                if (isInstanceOf(outNode, JoinNode)) {
                    var adapterNode = this.__createAdapterNode(side);
                    parentNode.addOutNode(adapterNode, pattern);
                    parentNode = adapterNode;
                }
                parentNode.addOutNode(outNode, pattern);
                return joinNode;
            },

            __addToNetwork:function (pattern, outNode, side) {
                if (isInstanceOf(pattern, ObjectPattern)) {
                    if (isInstanceOf(pattern, NotPattern) && (!side || side === "left")) {
                        return this.__addToNetwork(new CompositePattern(new InitialFactPattern(), pattern), outNode, side);
                    }
                    return this.__createAlphaNode(pattern, outNode, side);
                } else if (isInstanceOf(pattern, CompositePattern)) {
                    var joinNode = this.__createJoinNode(pattern, outNode, side);
                    this.__addToNetwork(pattern.leftPattern, joinNode, "left");
                    this.__addToNetwork(pattern.rightPattern, joinNode, "right");
                    outNode.addParentNode(joinNode);
                    return joinNode;
                }
            },


            __createAlphaNode:function (pattern, outNode, side) {
                var constraints = pattern.constraints;
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
                        outNode.refNodes.push(node);
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

            print:function () {
                this.terminalNodes.forEach(function (t) {
                    t.print("  ");
                });
            }
        }
    }).as(exports, "RootNode");

    var Node = define(null, {
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

    });

    var AlphaNode = define(Node, {
        instance:{
            constructor:function (constraint) {
                this._super([]);
                this.constraint = constraint;
            },

            toString:function () {
                return JSON.stringify(this.constraint.constraint);
            },

            equal:function (constraint) {
                return this.constraint.equal(constraint.constraint);
            }
        }
    });

    var TypeNode = define(AlphaNode, {
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
    });

    var PropertyNode = define(AlphaNode, {
        instance:{

            assert:function (assertable) {
                var fh = {}, constraint = this.constraint, o = assertable.fact.object, alias = constraint.alias;
                fh[alias] = o;
                if (constraint.assert(fh)) {
                    assertable.factHash[alias] = o;
                    this._super([assertable]);
                }
            },

            toString:function () {
                return "Property Node" + this._super();
            }
        }
    });

    var ReferenceNode = define(AlphaNode, {
        instance:{

            //used by NotNode to avoid creating match Result for efficiency
            isMatch:function (leftContext, rightContext) {
                var leftMatch = leftContext.match,
                    match = leftMatch.factHash,
                    constraint = this.constraint,
                    rightFact = rightContext.fact;
                var fh = {};
                fh[constraint.alias] = rightFact.object;
                var vars = constraint.variables, i = vars.length - 1;
                for (; i >= 0; i--) {
                    var v = vars[i];
                    fh[v] = match[v];
                }
                return constraint.assert(fh);
            },


            match:function (leftContext, rightContext) {
                var leftMatch = leftContext.match, match = leftMatch.factHash, constraint = this.constraint, alias = constraint.alias, rightFact = rightContext.fact;
                var fh = {};
                fh[alias] = rightFact.object;
                var vars = constraint.variables, i = vars.length - 1;
                for (; i >= 0; i--) {
                    var v = vars[i];
                    fh[v] = match[v];
                }
                var m = constraint.assert(fh);
                if (m) {
                    var mr = new MatchResult().merge(leftMatch);
                    mr.isMatch = true;
                    mr.factHash[alias] = rightFact.object;
                    mr.recency.push(rightFact.recency);
                    return mr;
                } else {
                    return new MatchResult();
                }
            },
            toString:function () {
                return "Reference Node" + this._super();
            }
        }
    });


    var EqualityNode = define(AlphaNode, {
        instance:{

            assert:function (assertable) {
                var fh = {}, constraint = this.constraint;
                fh[constraint.alias] = assertable.fact.object;
                if (constraint.assert(fh)) {
                    this._super([assertable]);
                }
            },

            toString:function () {
                return "Equality Node" + this._super();
            }
        }
    });


    var BridgeNode = define(Node, {

        instance:{

            constructor:function (pattern) {
                this._super([]);
                this.pattern = pattern;
            },

            toString:function () {
                return "Base Bridge Node " + this.pattern;
            },

            assert:function (assertable) {
                var mr = new MatchResult(assertable), pattern = this.pattern, constraints = pattern.constraints;
                mr.isMatch = true;
                var fact = assertable.fact, o = fact.object, fh = mr.factHash;
                var i = constraints.length - 1;
                fh[pattern.alias] = o;
                for (; i > 0; i--) {
                    var constraint = constraints[i];
                    if (constraint instanceof HashConstraint) {
                        var hash = constraint.variables;
                        for (var j in hash) {
                            fh[hash[j]] = o[j];
                        }
                    }
                }
                this.propagateAssert({match:mr, fact:fact});
            },

            retract:function (assertable) {
                this.propagateRetract(assertable.fact);
            }
        }

    });

    var LeftAdapterNode = define(Node, {
        instance:{
            propagateAssert:function (context) {
                this.__propagate("assertLeft", context);
            },

            propagateRetract:function (context) {
                this.__propagate("retractLeft", context);
            },

            propagateResolve:function (context) {
                this.__propagate("retractResolve", context);
            },

            modify:function (context) {
                this.__propagate("modifyLeft", context);
            },

            retractResolve:function (match) {
                this.__propagate("retractResolve", match);
            },

            dispose:function (context) {
                this.propagateDispose(context);
            }
        }

    });

    var RightAdapterNode = define(Node, {
        instance:{

            retractResolve:function (match) {
                this.__propagate("retractResolve", match);
            },

            dispose:function (context) {
                this.propagateDispose(context);
            },

            propagateAssert:function (context) {
                this.__propagate("assertRight", context);
            },

            propagateRetract:function (context) {
                this.__propagate("retractRight", context);
            },

            propagateResolve:function (context) {
                this.__propagate("retractResolve", context);
            },

            modify:function (context) {
                this.__propagate("modifyRight", context);
            }
        }
    });


    var count = 0;
    var JoinNode = define(Node, {

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
                        if (this.resolve(contexts[i].match, match)) {
                            contexts.splice(i, 1);
                        }
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
                    if (mr.isMatch) {
                        this.propagateAssert({fact:context.fact, match:mr});
                    }
                }
            },

            assertRight:function (context) {
                this.rightMemory.put(context.fact.object, context);
                var fl = flatten(this.leftMemory.values), i = fl.length - 1;
                for (; i >= 0; i--) {
                    var leftContext = fl[i];
                    var mr = this.__matchRefNodes(leftContext, context);
                    if (mr.isMatch) {
                        this.propagateAssert({fact:context.fact, match:mr});
                    }
                }
            },

            modifyLeft:function (context) {
                this.leftMemory.put(context.fact.object, [context]);
                var rm = this.rightMemory.values, i = rm.length - 1;
                for (; i >= 0; i--) {
                    var rightContext = rm[i];
                    var mr = this.__matchRefNodes(context, rightContext);
                    if (mr.isMatch) {
                        this.propagateModify({fact:context.fact, match:mr});
                    }
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

    });

    var NotNode = define(JoinNode, {
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
                        if (this.__matchRefNodes(leftContext, rightContext)) {
                            this.propagateAssert(leftContext);
                        }
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
                        if (this.__matchRefNodes(leftContext, context)) {
                            this._propagateRetractResolve(leftContext.match);
                        }
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
    });

    var TerminalNode = define(Node, {
        instance:{
            constructor:function (bucket, rule, agenda) {
                this._super([]);
                this.rule = rule;
                this.name = this.rule.name;
                this.agenda = agenda;
                this.bucket = bucket;
                agenda.register(this);
            },

            __assertModify:function (context) {
                var match = context.match;
                match.recency.sort(
                    function (a, b) {
                        return a - b;
                    }).reverse();
                match.facts = removeDuplicates(match.facts);
                if (match.isMatch) {
                    var rule = this.rule, bucket = this.bucket;
                    this.agenda.insert(this, {
                        rule:rule,
                        name:rule.name,
                        recency:bucket.recency++,
                        match:match,
                        counter:bucket.counter
                    });
                }
            },

            assert:function (context) {
                this.__assertModify(context);
            },

            modify:function (context) {
                this.__assertModify(context);
            },

            retract:function (fact) {
                this.agenda.removeByFact(this, fact);
            },

            retractResolve:function (match) {
                var resolve = this.resolve.bind(this);
                this.agenda.retract(this, function (v) {
                    return resolve(v.match, match);
                });
            },

            toString:function () {
                return "Terminal Node " + this.rule.name;
            }
        }
    });

})();



