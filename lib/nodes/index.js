var comb = require("comb"),
    define = comb.define,
    isInstanceOf = comb.isInstanceOf,
    pattern = require("../pattern.js"),
    ObjectPattern = pattern.ObjectPattern,
    NotPattern = pattern.NotPattern,
    CompositePattern = pattern.CompositePattern,
    InitialFactPattern = pattern.InitialFactPattern,
    constraints = require("../constraint"),
    HashConstraint = constraints.HashConstraint,
    ReferenceConstraint = constraints.ReferenceConstraint,
    BridgeNode = require("./bridgeNode"),
    JoinNode = require("./joinNode"),
    LeftAdapterNode = require("./leftAdapterNode"),
    RightAdapterNode = require("./rightAdapterNode"),
    NotNode = require("./notNode"),
    PropertyNode = require("./propertyNode"),
    ReferenceNode = require("./referenceNode"),
    EqualityNode = require("equalityNode"),
    TerminalNode = require("./terminalNode"),
    TypeNode = require("./typeNode");


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