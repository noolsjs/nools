"use strict";
var extd = require("../extended"),
    forEach = extd.forEach,
    some = extd.some,
    declare = extd.declare,
    pattern = require("../pattern.js"),
    ObjectPattern = pattern.ObjectPattern,
    NotPattern = pattern.NotPattern,
    CompositePattern = pattern.CompositePattern,
    InitialFactPattern = pattern.InitialFactPattern,
    constraints = require("../constraint"),
    HashConstraint = constraints.HashConstraint,
    ReferenceConstraint = constraints.ReferenceConstraint,
    AliasNode = require("./aliasNode"),
    EqualityNode = require("./equalityNode"),
    JoinNode = require("./joinNode"),
    NotNode = require("./notNode"),
    LeftAdapterNode = require("./leftAdapterNode"),
    RightAdapterNode = require("./rightAdapterNode"),
    TypeNode = require("./typeNode"),
    TerminalNode = require("./terminalNode"),
    PropertyNode = require("./propertyNode");

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
                this.__createAlphaNode(pattern, outNode, side);
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





