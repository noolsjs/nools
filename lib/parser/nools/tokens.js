(function () {
    "use strict";

    var utils = require("./util.js");

    var isWhiteSpace = function (str) {
        return str.replace(/[\s|\n|\r|\t]/g, "").length === 0;
    };


    var ruleTokens = {

        salience:(function () {
            var salienceRegexp = /^(salience|priority)\s*:\s*(\d+)\s*[,;]?/;
            return function (src, context) {
                if (salienceRegexp.test(src)) {
                    var parts = src.match(salienceRegexp),
                        priority = parseInt(parts[2], 10);
                    if(!isNaN(priority)){
                       context.options.priority = priority;
                    }else{
                        throw new Error("Invalid salience/priority " + parts[2]);
                    }
                    return src.replace(parts[0], "");
                } else {
                    throw new Error("invalid format");
                }
            };
        })(),

        priority:function () {
            return this.salience.apply(this, arguments);
        },

        when:(function () {

            var ruleRegExp = /^(\w+) *\: *(\w+)(.*)/;
            var constraintRegExp = /(\{(?:["']?\w+["']?\s*:\s*["']?\w+["']? *(?:, *["']?\w+["']?\s*:\s*["']?\w+["']?)*)+\})/;
            var predicateExp = /^(\w+)\((.*)\)$/;
            var parseRules = function (str) {
                var rules = [];
                str.split(";").forEach(function (ruleLine) {
                    ruleLine = ruleLine.trim();
                    if (!isWhiteSpace(ruleLine)) {
                        var rule = [];
                        if (predicateExp.test(ruleLine)) {
                            var m = ruleLine.match(predicateExp);
                            rule.push(m[1].trim());
                            ruleLine = m[2].trim();
                        }
                        var parts = ruleLine.match(ruleRegExp);
                        if (parts && parts.length) {
                            rule.push(parts[2], parts[1]);
                            var constraints = parts[3].trim();
                            var hashParts = constraints.match(constraintRegExp);
                            if (hashParts) {
                                var hash = hashParts[1], constraint = constraints.replace(hash, "");
                                if (constraint) {
                                    rule.push(constraint.trim());
                                }
                                if (hash) {
                                    rule.push(JSON.parse(hash.replace(/(\w+)\s*:\s*(\w+)/g, '"$1" : "$2"')));
                                }
                            } else if (constraints && !isWhiteSpace(constraints)) {
                                rule.push(constraints);
                            }
                            rules.push(rule);
                        } else {
                            throw new Error("Invalid constraint " + ruleLine);
                        }
                    }
                });
                return rules;
            };

            return function (orig, context, parse) {
                var src = orig.replace(/^when\s*/, "");
                if (utils.findNextToken(src) === "{") {
                    var body = utils.getTokensBetween(src, "{", "}", true).join("");
                    src = src.replace(body, "");
                    context.constraints = parseRules(body.replace(/^\{\s*|\}\s*$/g, ""));
                    return src;
                } else {
                    throw new Error("unexpected token : expected : '{' found : '" + utils.findNextToken(src) + "'");
                }
            };
        })(),

        then:(function () {
            return function (orig, context, parse) {
                if (!context.action) {
                    var src = orig.replace(/^then\s*/, "");
                    if (utils.findNextToken(src) === "{") {
                        var rule = {};
                        var body = utils.getTokensBetween(src, "{", "}", true).join("");
                        src = src.replace(body, "");
                        if (!context.action) {
                            context.action = body.replace(/^\{\s*|\}\s*$/g, "");
                        }
                        if (!isWhiteSpace(src)) {
                            throw new Error("Error parsing then block " + orig);
                        }
                        return src;
                    } else {
                        throw new Error("unexpected token : expected : '{' found : '" + utils.findNextToken(src) + "'");
                    }
                } else {
                    throw new Error("action already defined for rule" + context.name);
                }

            };
        })()
    };

    module.exports = {
        "define":function (orig, context) {
            var src = orig.replace(/^define\s*/, "");
            var ret = {};
            var name = src.match(/^([a-zA-Z_$][0-9a-zA-Z_$]*)/);
            if (name) {
                src = src.replace(name[0], "");
                if (utils.findNextToken(src) === "{") {
                    name = name[1];
                    var body = utils.getTokensBetween(src, "{", "}", true).join("");
                    src = src.replace(body, "");
                    //should
                    context.define.push({name:name, properties:eval("(" + body + ")")});
                    return src;
                } else {
                    throw new Error("unexpected token : expected : '{' found : '" + utils.findNextToken(src) + "'");
                }
            } else {
                throw new Error("missing name");
            }
        },

        "rule":function (orig, context, parse) {
            var src = orig.replace(/^rule\s*/, "");
            var name = src.match(/^([a-zA-Z_$][0-9a-zA-Z_$]*)/);
            if (name) {
                src = src.replace(name[0], "");
                if (utils.findNextToken(src) === "{") {
                    name = name[1];
                    var rule = {name:name, options:{}, constraints:null, action:null};
                    var body = utils.getTokensBetween(src, "{", "}", true).join("");
                    src = src.replace(body, "");
                    parse(body.replace(/^\{\s*|\}\s*$/g, ""), ruleTokens, rule);
                    context.rules.push(rule);
                    return src;
                } else {
                    throw new Error("unexpected token : expected : '{' found : '" + utils.findNextToken(src) + "'");
                }
            } else {
                throw new Error("missing name");
            }

        }
    };

})();