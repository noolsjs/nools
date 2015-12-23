var FromNode = require("./fromNode"),
    extd = require("../extended"),
    constraint = require("../constraint"),
    //EqualityConstraint = constraint.EqualityConstraint,
    //HashConstraint = constraint.HashConstraint,
    //ReferenceConstraint = constraint.ReferenceConstraint,
    Context = require("../context"),
    isDefined = extd.isDefined,
    isEmpty = extd.isEmpty,
    forEach = extd.forEach,
    isArray = extd.isArray;

var DEFAULT_MATCH = {
    isMatch: function () {
        return false;
    }
};

FromNode.extend({
    instance: {

        nodeType: "ParamNode",

        constructor: function (pattern, wm) {
            this._super([pattern, wm]);
        },

        assertLeft: function (context) {
            this.__addToLeftMemory(context);
            context.fromMatches = {};
            this.__createMatches(context);
        },

		assertParam: function(param) {
			var me = this;
			debugger;
		}
    }
}).as(module);