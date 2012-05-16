(function () {
    "use strict";
    var constraintParser = require("./constraint/parser"),
        noolParser = require("./nools/nool.parser.js");

    exports.parseConstraint = function (expression) {
        try {
            return constraintParser.parse(expression);
        } catch (e) {
            throw new Error("Invalid expression '" + expression + "'");
        }
    };

    exports.parseRuleSet = function (source) {
        return noolParser.parse(source);
    };
})();