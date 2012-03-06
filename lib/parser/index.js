var parser = require("./parser");
// generate source, ready to be written to disk
//var parserSource = parser.generate();

exports.parse = function (expression) {
    try {
        return parser.parse(expression);
    } catch (e) {
        throw new Error("Invalid expression '" + expression + "'");
    }
};