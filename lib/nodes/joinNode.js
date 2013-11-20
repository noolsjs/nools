var BetaNode = require("./betaNode"),
    JoinReferenceNode = require("./joinReferenceNode");

BetaNode.extend({

    instance: {
        constructor: function () {
            this._super(arguments);
            this.constraint = new JoinReferenceNode(this.leftTuples, this.rightTuples);
        },

        nodeType: "JoinNode",

        propagateFromLeft: function (context, rm) {
            var mr;
            if ((mr = this.constraint.match(context, rm)).isMatch) {
                this.__propagate("assert", this.__addToMemoryMatches(rm, context, context.clone(null, null, mr)));
            }
            return this;
        },

        propagateFromRight: function (context, lm) {
            var mr;
            if ((mr = this.constraint.match(lm, context)).isMatch) {
                this.__propagate("assert", this.__addToMemoryMatches(context, lm, context.clone(null, null, mr)));
            }
            return this;
        },

        propagateAssertModifyFromLeft: function (context, rightMatches, rm) {
            var factId = rm.hashCode, mr;
            if (factId in rightMatches) {
                mr = this.constraint.match(context, rm);
                var mrIsMatch = mr.isMatch;
                if (!mrIsMatch) {
                    this.__propagate("retract", rightMatches[factId].clone());
                } else {
                    this.__propagate("modify", this.__addToMemoryMatches(rm, context, context.clone(null, null, mr)));
                }
            } else {
                this.propagateFromLeft(context, rm);
            }
        },

        propagateAssertModifyFromRight: function (context, leftMatches, lm) {
            var factId = lm.hashCode, mr;
            if (factId in leftMatches) {
                mr = this.constraint.match(lm, context);
                var mrIsMatch = mr.isMatch;
                if (!mrIsMatch) {
                    this.__propagate("retract", leftMatches[factId].clone());
                } else {
                    this.__propagate("modify", this.__addToMemoryMatches(context, lm, context.clone(null, null, mr)));
                }
            } else {
                this.propagateFromRight(context, lm);
            }
        }
    }

}).as(module);