/*jshint evil:true*/
"use strict";
var extd = require("../extended"),
    forEach = extd.forEach,
    isString = extd.isString;

exports.modifiers = ["assert", "modify", "retract", "emit", "halt", "focus", "getFacts"];

var createFunction = function (body, defined, scope, scopeNames, definedNames) {
    var declares = [];
    forEach(definedNames, function (i) {
        if (body.indexOf(i) !== -1) {
            declares.push("var " + i + "= defined." + i + ";");
        }
    });

    forEach(scopeNames, function (i) {
        if (body.indexOf(i) !== -1) {
            declares.push("var " + i + "= scope." + i + ";");
        }
    });
    body = ["((function(){", declares.join(""), "\n\treturn ", body, "\n})())"].join("");
    try {
        return eval(body);
    } catch (e) {
        throw new Error("Invalid action : " + body + "\n" + e.message);
    }
};

var createDefined = (function () {

    var _createDefined = function (options) {
        options = isString(options) ? new Function("return " + options + ";")() : options;
        var ret = options.hasOwnProperty("constructor") && "function" === typeof options.constructor ? options.constructor : function (opts) {
            opts = opts || {};
            for (var i in opts) {
                if (i in options) {
                    this[i] = opts[i];
                }
            }
        };
        var proto = ret.prototype;
        for (var i in options) {
            proto[i] = options[i];
        }
        return ret;

    };

    return function (options) {
        return _createDefined(options.properties);
    };
})();

exports.createFunction = createFunction;
exports.createDefined = createDefined;