var comb = require("comb"),
    array = comb.array,
    flatten = array.flatten,
    intersect = array.intersect,
    define = comb.define,
    merge = comb.merge,
    isInstanceOf = comb.isInstanceOf,
    HashTable = comb.collections.HashTable,
    pattern = require("./pattern.js"),
    ObjectPattern = pattern.ObjectPattern,
    NotPattern = pattern.NotPattern,
    CompositePattern = pattern.CompositePattern,
    IntialFactPattern = pattern.InitialFactPattern,
    atoms = require("./atoms"),
    HashAtom = atoms.HashAtom,
    ReferenceAtom = atoms.ReferenceAtom,
    rules = require("./rule");


var MatchResult = define(null, {
    instance:{
        constructor:function (assertable) {
            assertable = assertable || {};
            this.variables = [];
            this.facts = [];
            assertable.fact && this.facts.push(assertable.fact);
            this.factHash = {};
            this.recency = [];
            this.isMatch = false;
            assertable.fact && this.recency.push(assertable.fact.recency);

        },

        merge:function (mr) {
            var ret = new this._static();
            ret.isMatch = mr.isMatch;
            ret.facts = this.facts.concat(mr.facts);
            merge(ret.factHash, this.factHash, mr.factHash);
            var recency = this.recency;
            ret.recency = recency.length ? recency : mr.recency;
            return ret;
        },

        getters:{
            factIds:function () {
                return this.facts.map(function (fact) {
                    return fact.id;
                })
            }
        }

    }
});


var NetworkBucket = define(null, {
    instance:{
        counter:0
    }
});

var RootNode = define(null, {
    instance:{
        constructor:function (engine, wm) {
            this.terminalNodes = [];
            this.nodes = [];
            this.typeNode = null;
            this.bucket = new NetworkBucket();
        },

        assertRule:function (rule) {
            var terminalNode = new TerminalNode(this.bucket, rule);
            this.__buildNetwork(rule.pattern, terminalNode);
            this.terminalNodes.push(terminalNode);
        },

        resetCounter:function () {
            this.bucket.counter = 0;
        },

        incrementCounter:function () {
            this.bucket.counter++;
        },

        assertFact:function (fact) {
            this.typeNode && this.typeNode.assert(fact);
        },

        retractFact:function (fact) {
            this.typeNode && this.typeNode.retract(fact);
        },


        containsRule:function (name) {
            return this.terminalNodes.some(function (n) {
                return n.rule.name === name;
            });
        },

        matches:function (initial) {
            var agenda = [];
            this.terminalNodes.forEach(function (t) {
                t.activations.values.forEach(function (a) {
                    if (initial) {
                        a.used = false;
                        agenda.push(a);
                    } else if (!a.used) {
                        agenda.push(a);
                    }
                })
            });
            return agenda;
        },

        resolve:function (mr1, mr2) {
            var mr1FactHash = mr1.factHash, mr2FactHash = mr2.factHash;
            var fhKeys1 = Object.keys(mr1FactHash), fhKeys2 = Object.keys(mr2FactHash);
            var l1 = fhKeys1.length, l2 = fhKeys2.length;
            for (var i = 0; i < l1; i++) {
                var k1 = fhKeys1[i];
                for (var j = 0; j < l2; j++) {
                    var k2 = fhKeys2[j];
                    if (k1 == k2 && mr1FactHash[k1] !== mr2FactHash[k2]) {
                        return false;
                    }
                }
            }
            return true;
        },

        __createTypeNode:function (pattern) {
            return this.typeNode || (this.typeNode = new TypeNode(pattern.atoms[0]));
        },

        __createEqualityNode:function (atom) {
            return new EqualityNode(atom);
        },

        __createReferenceNode:function (atom) {
            return new ReferenceNode(atom);
        },

        __createPropertyNode:function (atom) {
            return new PropertyNode(atom);
        },

        __createBridgeNode:function (pattern) {
            return new BridgeNode(pattern);
        },

        __createAdapterNode:function (side) {
            return side == "left" ? new LeftAdapterNode() : new RightAdapterNode();
        },

        __createJoinNode:function (pattern, outNode, side) {
            var joinNode;
            if (isInstanceOf(pattern.rightPattern, NotPattern)) {
                joinNode = new NotNode()
            } else {
                joinNode = new JoinNode()
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

        __buildNetwork:function (pattern, outNode, side) {
            if (isInstanceOf(pattern, ObjectPattern)) {
                if (isInstanceOf(pattern, NotPattern) && (!side || side === "left")) {
                    return this.__buildNetwork(new CompositePattern(new IntialFactPattern(), pattern), outNode, side);
                }
                return this.__createAtomNode(pattern, outNode, side);
            } else if (isInstanceOf(pattern, CompositePattern)) {
                var joinNode = this.__createJoinNode(pattern, outNode, side);
                this.__buildNetwork(pattern.leftPattern, joinNode, "left");
                this.__buildNetwork(pattern.rightPattern, joinNode, "right");
                outNode.parentNodes.push(joinNode);
                return joinNode;
            }
        },


        __createAtomNode:function (pattern, outNode, side) {
            var atoms = pattern.atoms;
            var typeNode = this.__createTypeNode(pattern);
            var parentAtom = atoms[0];
            var parentNode = typeNode;
            atoms.slice(1).forEach(function (atom) {
                var node;
                if (isInstanceOf(atom, HashAtom)) {
                    node = this.__createPropertyNode(atom);
                } else if (isInstanceOf(atom, ReferenceAtom)) {
                    node = this.__createReferenceNode(atom);
                    outNode.refNodes.push(node);
                } else {
                    node = this.__createEqualityNode(atom);
                }
                parentNode.addOutNode(node, pattern, parentAtom);
                parentNode = node;
                parentAtom = atom;
            }, this);
            var bridgeNode = this.__createBridgeNode(pattern);
            parentNode.addOutNode(bridgeNode, pattern, parentAtom);
            bridgeNode.parentNodes.push(parentNode);
            parentNode = bridgeNode;
            outNode.parentNodes.push(parentNode);

            if (isInstanceOf(outNode, JoinNode)) {
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

var Node = define(RootNode, {
    instance:{
        constructor:function (atom, nodes) {
            this.nodes = new HashTable();
            this.parentNodes = [];

        },

        print:function (tab) {
            console.log(tab + this.toString());
            this.parentNodes.forEach(function (n) {
                n.print("  " + tab);
            });
        },

        addOutNode:function (outNode, pattern, atom) {
            if (!this.nodes.contains(outNode)) {
                this.nodes.put(outNode, []);
            }
            this.nodes.get(outNode).push(pattern);
        },

        addParentNode:function (n) {
            this.parentNodes.push(n);
        },

        isDependent:function (n) {
            return n.rule && this.rule.isDependent(n.rule) || n.nodes.some(function (subNode) {
                return this.isDependent(subNode);
            }, this)
        },

        __propagate:function (method, assertable, outNodes) {
            outNodes = outNodes || this.nodes;
            outNodes.forEach(function (entry) {
                var outNode = entry.key, paths = entry.value;
                if (assertable.paths) {
                    var continuingPaths = intersect(paths, assertable.paths);
                    if (continuingPaths.length) {
                        outNode[method]({fact:assertable.fact, factHash:{}, paths:continuingPaths});
                    }
                } else {
                    outNode[method](assertable);
                }
            });

        },

        retract:function (assertable) {
            this.propagateRetract(assertable);
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

var AtomNode = define(Node, {
    instance:{
        constructor:function (atom) {
            this._super([]);
            this.atom = atom;
        },

        toString:function () {
            return JSON.stringify(this.atom.constraint);
        },

        hashCode:function () {
            return JSON.stringify(this.atom.constraint);
        }
    }
});


var HashedNode = define(AtomNode, {
    instance:{
        constructor:function (atom) {
            this._super([atom]);
            this.values = new HashTable();
        },

        hashBy:function (atom) {
            return atom;
        },


        retract:function (assertable) {
            var k = this.factToHash(assertable.fact);
            this.propagateRetract(assertable, this.values.get(k) || new HashTable());
        },

        assert:function (assertable) {
            var k = this.factToHash(assertable.fact);
            this.propagateAssert(assertable, this.values.get(k) || new HashTable());
        },

        factToHash:function (fact) {
            return fact.object;
        },

        addOutNode:function (node, pattern, atom) {
            var k = this.hashBy(atom);
            if (!this.values.contains(k)) {
                this.values.put(k, new HashTable());
            }
            if (!this.values.get(k).contains(node)) {
                this.values.get(k).put(node, [pattern]);
            } else {
                this.values.get(k).get(node).push([pattern]);
            }
        }
    }
});

var TypeNode = define(HashedNode, {
    instance:{
        hashBy:function (atom) {
            return atom.constraint.type;
        },

        factToHash:function (fact) {
            var object = fact.object;
            return object._static || object.constructor;
        },

        retract:function (fact) {
            this._super([
                {fact:fact}
            ]);
        },

        assert:function (fact) {
            this._super([
                {fact:fact}
            ]);
        },

        toString:function () {
            return "Type Node" + this._super();
        },

        __propagate:function (method, assertion, outNodes) {
            (outNodes || this.nodes).forEach(function (e) {
                var outNode = e.key, paths = e.value;
                outNode[method](merge(assertion, {factHash:{}, paths:paths}));
            })
        }
    }
});

var AlphaMemoryNode = define(AtomNode, {

    instance:{

        constructor:function (atom) {
            this._super([atom]);
            this.memory = new HashTable();
        },

        retract:function (assertable) {
            this.forget(assertable);
            this._super(arguments);
        },

        remember:function (assertable) {
            return this.memory.get(assertable.fact.object);
        },

        memorized:function (assertable, value) {
            this.memory.contains(assertable.fact.object);
        },

        memorize:function (assertable, value) {
            this.memory.put(assertable.fact.object, value);
        },

        forget:function (assertable) {
            this.memory.remove(assertable.fact.object);
        }
    }
});

var PropertyNode = define(AlphaMemoryNode, {
    instance:{
        assert:function (assertable) {
            if (!this.memorized(assertable)) {
                var vars = this.atom.variables;
                var hash = {};
                hash[this.atom.alias] = assertable.fact.object;
                var match = this.atom.assert(hash);
                this.memorize(assertable, match);
                if (match) {
                    assertable.factHash[this.atom.alias] = assertable.fact.object;
                    this._super([assertable])
                }
            } else if (this.remember(assertable)) {
                this._super(assertable);
            }

        },

        toString:function () {
            return "Property Node" + this._super();
        }
    }
});

var ReferenceNode = define(AtomNode, {
    instance:{
        match:function (leftContext, rightContext) {
            var match = leftContext.match.factHash;
            var fh = {};
            fh[this.atom.alias] = rightContext.fact.object;
            this.atom.variables.forEach(function (v) {
                fh[v] = match[v];
            });
            var m = this.atom.assert(fh);
            if (m) {
                var mr = new MatchResult().merge(leftContext.match);
                mr.isMatch = true;
                merge(mr.factHash, fh);
                mr.recency.push(rightContext.fact.recency);
                return mr;
            } else {
                return new MatchResult();
            }
        },
        toString:function () {
            return "Reference Node" + this._super();
        }
    }
})


var EqualityNode = define(AtomNode, {
    instance:{
        assert:function (assertable) {
            var fh = {};
            fh[this.atom.alias] = assertable.fact.object;
            var match = this.atom.assert(fh);
            if (match) {
                this._super([assertable])
            }
        },

        hashBy:function (atom) {
            return atom.alias;
        },

        toString:function () {
            return "Equality Node" + this._super();
        }
    }
});

var BaseBridgeNode = define(Node, {
    instance:{
        constructor:function (pattern) {
            this._super([]);
            this.pattern = pattern;
        },

        toString:function () {
            return "Base Bridge Node " + this.pattern;
        },

        assert:function (assertable) {
            this.propagateAssert(assertable.fact);
        },

        retract:function (assertable) {
            this.propagateRetract(assertable.fact);
        }
    }
});

var BridgeNode = define(BaseBridgeNode, {

    instance:{
        assert:function (assertable) {
            var mr = new MatchResult(assertable);
            mr.isMatch = true;
            var head = this.pattern.atoms[0], fact = assertable.fact;
            this.pattern.atoms.forEach(function (atom) {
                if (atom == head) {
                    mr.factHash[atom.alias] = fact.object;
                } else if (isInstanceOf(atom, HashAtom)) {
                    var hash = atom.variables;
                    for (var i in hash) {
                        mr.factHash[hash[i]] = fact.object[i];
                    }
                }
            });
            this.propagateAssert({match:mr, fact:fact});
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
        }
    }

});

var RightAdapterNode = define(Node, {
    instance:{

        retractResolve:function (match) {
            this.__propagate("retractResolve", match);
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


var JoinNode = define(Node, {

    instance:{
        constructor:function (leftNode, rightNode) {
            this._super([]);
            this.leftMemory = new HashTable();
            this.rightMemory = new HashTable();
            this.refNodes = [];
            this.__count = this._static.count++;
        },

        hashCode:function () {
            return  "JoinNode " + this.__count;
        },

        toString:function () {
            return "JoinNode " + JSON.stringify(this.leftMemory.values) + " " + JSON.stringify(this.rightMemory.values);
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
            this.rightMemory.values.forEach(function (rightContext) {
                var mr = this.__matchRefNodes(context, rightContext);
                if (mr.isMatch) {
                    this.propagateAssert({fact:context.fact, match:mr});
                }
            }, this)
        },

        assertRight:function (context) {
            this.rightMemory.put(context.fact.object, context);
            flatten(this.leftMemory.values).forEach(function (leftContext) {
                var mr = this.__matchRefNodes(leftContext, context);
                if (mr.isMatch) {
                    this.propagateAssert({fact:context.fact, match:mr});
                }
            }, this)
        },

        modifyLeft:function (context) {
            this.leftMemory.put(context.fact.object, [context]);
            this.rightMemory.values.forEach(function (rightContext) {
                var mr = this.__matchRefNodes(context, rightContext);
                if (mr.isMatch) {
                    this.propagateModify({fact:context.fact, match:mr});
                }
            }, this)
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
                var l = refNodes.length, rf = rightContext.fact;
                for (var i = 0; i < l; i++) {
                    var refMr = refNodes[i].match(leftContext, rightContext);
                    if (refMr.isMatch) {
                        mr = mr.merge(refMr);
                    } else {
                        mr = new MatchResult();
                        break;
                    }

                }
            }
            return mr;
        },

        __addToLeftMemory:function (context) {
            var lm = this.leftMemory.get(context.fact.object);
            if (!lm) {
                lm = [];
                this.leftMemory.put(context.fact.object, lm);
            }
            lm.push(context);
        }
    },

    static:{
        count:0
    }

});

var NotNode = define(JoinNode, {
    instance:{

        retractRight:function (fact) {
            var rightContext = this.rightMemory.remove(fact.object);
            if (rightContext) {
                flatten(this.leftMemory.values).forEach(function (leftContext) {
                    if (this.__matchRefNodes(leftContext, rightContext)) {
                        this.propagateAssert(leftContext);
                    }
                }, this);
            }
        },

        assertLeft:function (context) {
            this.__addToLeftMemory(context);
            if (!this.refNodes.length && this.rightMemory.isEmpty) {
                this.propagateAssert(context);
            } else {
                var propagate = true, values = this.rightMemory.values, l = values.length;
                for (var i = 0; i < l; i++) {
                    if (this.__matchRefNodes(context, values[i])) {
                        propagate = false;
                        break;
                    }
                }
                propagate && this.propagateAssert(context);
            }
        },

        assertRight:function (context) {
            this.rightMemory.put(context.fact.object, context);
            if (!this.refNodes.length) {
                flatten(this.leftMemory.values).forEach(function (leftContext) {
                    this._propagateRetractResolve(leftContext.match);
                }, this);
            } else {
                flatten(this.leftMemory.values).forEach(function (leftContext) {
                    if (this.__matchRefNodes(leftContext, context)) {
                        this._propagateRetractResolve(leftContext.match);
                    }
                }, this);
            }
        },

        modifyLeft:function (context) {
            this.leftMemory.put(context.fact.object, context);
        },

        __matchRefNodes:function (leftContext, rightContext) {
            var refNodes = this.refNodes, l = refNodes.length, rf = rightContext.fact;
            for (var i = 0; i < l; i++) {
                var refMr = refNodes[i].match(leftContext, rightContext);
                if (!refMr.isMatch) {
                    return false;
                }
            }
            return true;
        }
    }
});

var TerminalNode = define(Node, {
    instance:{
        constructor:function (bucket, rule) {
            this._super([]);
            this.rule = rule;
            this.activations = new HashTable();
            this.bucket = bucket;
        },

        assert:function (context) {
            var match = context.match;
            match.recency.sort().reverse();
            this.activations.put(match.factIds.sort().join(":"), {rule:this.rule, match:match, used:false, counter:this.bucket.counter});

        },

        modify:function (context) {
            var found = false;
            var k = context.match.factIds.sort().join(":");
            if (this.activations.contains(k)) {
                this.activations.get(k).match = context.match;
            } else if (context.isMatch) {
                this.assert(context);
            }
        },

        retract:function (fact) {
            var activations = this.activations;
            activations.forEach(function (es) {
                var key = es.key, v = es.value;
                v.match.facts.forEach(function (f) {
                    if (f.equals(fact.object)) {
                        activations.remove(key);
                    }
                });
            });
        },

        retractResolve:function (match) {
            var activations = this.activations;
            activations.forEach(function (es) {
                var key = es.key, v = es.value;
                if (this.resolve(v.match, match)) {
                    activations.remove(key);
                }
            }, this);
        },

        toString:function () {
            return "Terminal Node " + this.rule.name + " : " + this.activations.entrySet;
        }
    }
});

