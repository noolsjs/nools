"use strict";
var extd = require("../extended"),
    forEach = extd.forEach,
    some = extd.some,
    declare = extd.declare,
    pattern = require("../pattern.js"),
    ObjectPattern = pattern.ObjectPattern,
    FromPattern = pattern.FromPattern,
    FromNotPattern = pattern.FromNotPattern,
    ExistsPattern = pattern.ExistsPattern,
    FromExistsPattern = pattern.FromExistsPattern,
    NotPattern = pattern.NotPattern,
    CompositePattern = pattern.CompositePattern,
    InitialFactPattern = pattern.InitialFactPattern,
    constraints = require("../constraint"),
    HashConstraint = constraints.HashConstraint,
    ReferenceConstraint = constraints.ReferenceConstraint,
    AliasNode = require("./aliasNode"),
    EqualityNode = require("./equalityNode"),
    JoinNode = require("./joinNode"),
    BetaNode = require("./betaNode"),
    NotNode = require("./notNode"),
    FromNode = require("./fromNode"),
    FromNotNode = require("./fromNotNode"),
    ExistsNode = require("./existsNode"),
    ExistsFromNode = require("./existsFromNode"),
    LeftAdapterNode = require("./leftAdapterNode"),
    RightAdapterNode = require("./rightAdapterNode"),
    TypeNode = require("./typeNode"),
    TerminalNode = require("./terminalNode"),
    PropertyNode = require("./propertyNode");

function hasRefernceConstraints(pattern) {
    return some(pattern.constraints || [], function (c) {
        return c instanceof ReferenceConstraint;
    });
}

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
            this.workingMemory = wm;
        },

        assertRule: function (rule) {
            var terminalNode = new TerminalNode(this.bucket, this.__ruleCount++, rule, this.agendaTree);
            this.__addToNetwork(rule, rule.pattern, terminalNode);
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

        modifyFact: function (fact) {
            var typeNodes = this.typeNodes, i = typeNodes.length - 1;
            for (; i >= 0; i--) {
                typeNodes[i].modify(fact);
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
                if (j1 && j2 && (j1.constraint && j2.constraint && j1.constraint.equal(j2.constraint))) {
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

        __createTypeNode: function (rule, pattern) {
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

        __createEqualityNode: function (rule, constraint) {
            return this.__checkEqual(new EqualityNode(constraint)).addRule(rule);
        },

        __createPropertyNode: function (rule, constraint) {
            return this.__checkEqual(new PropertyNode(constraint)).addRule(rule);
        },

        __createAliasNode: function (rule, pattern) {
            return this.__checkEqual(new AliasNode(pattern)).addRule(rule);
        },

        __createAdapterNode: function (rule, side) {
            return (side === "left" ? new LeftAdapterNode() : new RightAdapterNode()).addRule(rule);
        },

        __createJoinNode: function (rule, pattern, outNode, side) {
            var joinNode;
            if (pattern.rightPattern instanceof NotPattern) {
                joinNode = new NotNode();
            } else if (pattern.rightPattern instanceof FromExistsPattern) {
                joinNode = new ExistsFromNode(pattern.rightPattern, this.workingMemory);
            } else if (pattern.rightPattern instanceof ExistsPattern) {
                joinNode = new ExistsNode();
            } else if (pattern.rightPattern instanceof FromNotPattern) {
                joinNode = new FromNotNode(pattern.rightPattern, this.workingMemory);
            } else if (pattern.rightPattern instanceof FromPattern) {
                joinNode = new FromNode(pattern.rightPattern, this.workingMemory);
            } else if (pattern instanceof CompositePattern && !hasRefernceConstraints(pattern.leftPattern) && !hasRefernceConstraints(pattern.rightPattern)) {
                joinNode = new BetaNode();
                this.joinNodes.push(joinNode);
            } else {
                joinNode = new JoinNode();
                this.joinNodes.push(joinNode);
            }
            joinNode["__rule__"] = rule;
            var parentNode = joinNode;
            if (outNode instanceof BetaNode) {
                var adapterNode = this.__createAdapterNode(rule, side);
                parentNode.addOutNode(adapterNode, pattern);
                parentNode = adapterNode;
            }
            parentNode.addOutNode(outNode, pattern);
            return joinNode.addRule(rule);
        },

        __addToNetwork: function (rule, pattern, outNode, side) {
            if (pattern instanceof ObjectPattern) {
                if (!(pattern instanceof InitialFactPattern) && (!side || side === "left")) {
                    this.__createBetaNode(rule, new CompositePattern(new InitialFactPattern(), pattern), outNode, side);
                } else {
                    this.__createAlphaNode(rule, pattern, outNode, side);
                }
            } else if (pattern instanceof CompositePattern) {
                this.__createBetaNode(rule, pattern, outNode, side);
            }
        },

        __createBetaNode: function (rule, pattern, outNode, side) {
            var joinNode = this.__createJoinNode(rule, pattern, outNode, side);
            this.__addToNetwork(rule, pattern.rightPattern, joinNode, "right");
            this.__addToNetwork(rule, pattern.leftPattern, joinNode, "left");
            outNode.addParentNode(joinNode);
            return joinNode;
        },


        __createAlphaNode: function (rule, pattern, outNode, side) {
            var typeNode, parentNode;
            if (!(pattern instanceof FromPattern)) {

                var constraints = pattern.get("constraints");
                typeNode = this.__createTypeNode(rule, pattern);
                var aliasNode = this.__createAliasNode(rule, pattern);
                typeNode.addOutNode(aliasNode, pattern);
                aliasNode.addParentNode(typeNode);
                parentNode = aliasNode;
                var i = constraints.length - 1;
                for (; i > 0; i--) {
                    var constraint = constraints[i], node;
                    if (constraint instanceof HashConstraint) {
                        node = this.__createPropertyNode(rule, constraint);
                    } else if (constraint instanceof ReferenceConstraint) {
                        outNode.constraint.addConstraint(constraint);
                        continue;
                    } else {
                        node = this.__createEqualityNode(rule, constraint);
                    }
                    parentNode.addOutNode(node, pattern);
                    node.addParentNode(parentNode);
                    parentNode = node;
                }

                if (outNode instanceof BetaNode) {
                    var adapterNode = this.__createAdapterNode(rule, side);
                    adapterNode.addParentNode(parentNode);
                    parentNode.addOutNode(adapterNode, pattern);
                    parentNode = adapterNode;
                }
                outNode.addParentNode(parentNode);
                parentNode.addOutNode(outNode, pattern);
                return typeNode;
            }
        },

        print: function () {
            forEach(this.terminalNodes, function (t) {
                t.print("    ");
            });
        }
    }
}).as(exports, "RootNode");





