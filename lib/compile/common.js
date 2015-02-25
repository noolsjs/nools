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

    var _createDefined = function (action, defined, scope) {
        if (isString(action)) {
            var declares = [];
            extd(defined).keys().forEach(function (i) {
                if (action.indexOf(i) !== -1) {
                    declares.push("var " + i + "= defined." + i + ";");
                }
            });

            extd(scope).keys().forEach(function (i) {
                if (action.indexOf(i) !== -1) {
                    declares.push("var " + i + "= function(){var prop = scope." + i + "; return __objToStr__.call(prop) === '[object Function]' ? prop.apply(void 0, arguments) : prop;};");
                }
            });
            if (declares.length) {
                declares.unshift("var __objToStr__ = Object.prototype.toString;");
            }
            action = [declares.join(""), "return ", action, ";"].join("");
            action = new Function("defined", "scope", action)(defined, scope);
        }
        var ret = action.hasOwnProperty("constructor") && "function" === typeof action.constructor ? action.constructor : function (opts) {
            opts = opts || {};
            for (var i in opts) {
                if (i in action) {
                    this[i] = opts[i];
                }
            }
        };
        var proto = ret.prototype;
        for (var i in action) {
            proto[i] = action[i];
        }
        return ret;

    };

    return function (options, defined, scope) {
        return _createDefined(options.properties, defined, scope);
    };
})();

exports.createFunction = createFunction;
exports.createDefined = createDefined;