var constraintParser = require("./constraint/parser"),
    noolParser = require("./nools/nool.parser.js");
// generate source, ready to be written to disk
//var parserSource = parser.generate();

exports.parseConstraint = function (expression) {
    try {
        return constraintParser.parse(expression);
    } catch (e) {
        throw new Error("Invalid expression '" + expression + "'");
    }
};

exports.parseRuleSet = function (source) {
    try {
        return noolParser.parse(source);
    } catch (e) {
        throw new Error("Invalid expression '" + expression + "'");
    }
};