"use strict";

var utils = require("./util.js"),
    fs = require("fs"),
    extd = require("../../extended"),
    filter = extd.filter,
    indexOf = extd.indexOf,
    predicates = ["not", "or", "exists"],
    predicateRegExp = new RegExp("^(" + predicates.join("|") + ") *\\((.*)\\)$", "m"),
    predicateBeginExp = new RegExp(" *(" + predicates.join("|") + ") *\\(", "g");

var isWhiteSpace = function (str) {
    return str.replace(/[\s|\n|\r|\t]/g, "").length === 0;
};

var joinFunc = function (m, str) {
    return "; " + str;
};

var splitRuleLineByPredicateExpressions = function (ruleLine) {
    var str = ruleLine.replace(/,\s*(\$?\w+\s*:)/g, joinFunc);
    var parts = filter(str.split(predicateBeginExp), function (str) {
            return str !== "";
        }),
        l = parts.length, ret = [];

    if (l) {
        for (var i = 0; i < l; i++) {
            if (indexOf(predicates, parts[i]) !== -1) {
                ret.push([parts[i], "(", parts[++i].replace(/, *$/, "")].join(""));
            } else {
                ret.push(parts[i].replace(/, *$/, ""));
            }
        }
    } else {
        return str;
    }
    return ret.join(";");
};

var ruleTokens = {

    salience: (function () {
        var salienceRegexp = /^(salience|priority)\s*:\s*(-?\d+)\s*[,;]?/;
        return function (src, context) {
            if (salienceRegexp.test(src)) {
                var parts = src.match(salienceRegexp),
                    priority = parseInt(parts[2], 10);
                if (!isNaN(priority)) {
                    context.options.priority = priority;
                } else {
                    throw new Error("Invalid salience/priority " + parts[2]);
                }
                return src.replace(parts[0], "");
            } else {
                throw new Error("invalid format");
            }
        };
    })(),

    agendaGroup: (function () {
        var agendaGroupRegexp = /^(agenda-group|agendaGroup)\s*:\s*([a-zA-Z_$][0-9a-zA-Z_$]*|"[^"]*"|'[^']*')\s*[,;]?/;
        return function (src, context) {
            if (agendaGroupRegexp.test(src)) {
                var parts = src.match(agendaGroupRegexp),
                    agendaGroup = parts[2];
                if (agendaGroup) {
                    context.options.agendaGroup = agendaGroup.replace(/^["']|["']$/g, "");
                } else {
                    throw new Error("Invalid agenda-group " + parts[2]);
                }
                return src.replace(parts[0], "");
            } else {
                throw new Error("invalid format");
            }
        };
    })(),

    autoFocus: (function () {
        var autoFocusRegexp = /^(auto-focus|autoFocus)\s*:\s*(true|false)\s*[,;]?/;
        return function (src, context) {
            if (autoFocusRegexp.test(src)) {
                var parts = src.match(autoFocusRegexp),
                    autoFocus = parts[2];
                if (autoFocus) {
                    context.options.autoFocus = autoFocus === "true" ? true : false;
                } else {
                    throw new Error("Invalid auto-focus " + parts[2]);
                }
                return src.replace(parts[0], "");
            } else {
                throw new Error("invalid format");
            }
        };
    })(),

    "agenda-group": function () {
        return this.agendaGroup.apply(this, arguments);
    },

    "auto-focus": function () {
        return this.autoFocus.apply(this, arguments);
    },

    priority: function () {
        return this.salience.apply(this, arguments);
    },

    when: (function () {
        /*jshint evil:true*/

        var ruleRegExp = /^(\$?\w+) *: *(\w+)(.*)/;

        var constraintRegExp = /(\{ *(?:["']?\$?\w+["']?\s*:\s*["']?\$?\w+["']? *(?:, *["']?\$?\w+["']?\s*:\s*["']?\$?\w+["']?)*)+ *\})/;
        var fromRegExp = /(\bfrom\s+.*)/;
        var parseRules = function (str) {
            var rules = [];
            var ruleLines = str.split(";"), l = ruleLines.length, ruleLine;
            for (var i = 0; i < l && (ruleLine = ruleLines[i].replace(/^\s*|\s*$/g, "").replace(/\n/g, "")); i++) {
                if (!isWhiteSpace(ruleLine)) {
                    var rule = [];
                    if (predicateRegExp.test(ruleLine)) {
                        var m = ruleLine.match(predicateRegExp);
                        var pred = m[1].replace(/^\s*|\s*$/g, "");
                        rule.push(pred);
                        ruleLine = m[2].replace(/^\s*|\s*$/g, "");
                        if (pred === "or") {
                            rule = rule.concat(parseRules(splitRuleLineByPredicateExpressions(ruleLine)));
                            rules.push(rule);
                            continue;
                        }

                    }
                    var parts = ruleLine.match(ruleRegExp);
                    if (parts && parts.length) {
                        rule.push(parts[2], parts[1]);
                        var constraints = parts[3].replace(/^\s*|\s*$/g, "");
                        var hashParts = constraints.match(constraintRegExp), from = null, fromMatch;
                        if (hashParts) {
                            var hash = hashParts[1], constraint = constraints.replace(hash, "");
                            if (fromRegExp.test(constraint)) {
                                fromMatch = constraint.match(fromRegExp);
                                from = fromMatch[0];
                                constraint = constraint.replace(fromMatch[0], "");
                            }
                            if (constraint) {
                                rule.push(constraint.replace(/^\s*|\s*$/g, ""));
                            }
                            if (hash) {
                                rule.push(eval("(" + hash.replace(/(\$?\w+)\s*:\s*(\$?\w+)/g, '"$1" : "$2"') + ")"));
                            }
                        } else if (constraints && !isWhiteSpace(constraints)) {
                            if (fromRegExp.test(constraints)) {
                                fromMatch = constraints.match(fromRegExp);
                                from = fromMatch[0];
                                constraints = constraints.replace(fromMatch[0], "");
                            }
                            rule.push(constraints);
                        }
                        if (from) {
                            rule.push(from);
                        }
                        rules.push(rule);
                    } else {
                        throw new Error("Invalid constraint " + ruleLine);
                    }
                }
            }
            return rules;
        };

        return function (orig, context) {
            var src = orig.replace(/^when\s*/, "").replace(/^\s*|\s*$/g, "");
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

    then: (function () {
        return function (orig, context) {
            if (!context.action) {
                var src = orig.replace(/^then\s*/, "").replace(/^\s*|\s*$/g, "");
                if (utils.findNextToken(src) === "{") {
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

var topLevelTokens = {
    "/": function (orig) {
        if (orig.match(/^\/\*/)) {
            // Block Comment parse
            return orig.replace(/\/\*.*?\*\//, "");
        } else {
            return orig;
        }
    },

    "define": function (orig, context) {
        var src = orig.replace(/^define\s*/, "");
        var name = src.match(/^([a-zA-Z_$][0-9a-zA-Z_$]*)/);
        if (name) {
            src = src.replace(name[0], "").replace(/^\s*|\s*$/g, "");
            if (utils.findNextToken(src) === "{") {
                name = name[1];
                var body = utils.getTokensBetween(src, "{", "}", true).join("");
                src = src.replace(body, "");
                //should
                context.define.push({name: name, properties: "(" + body + ")"});
                return src;
            } else {
                throw new Error("unexpected token : expected : '{' found : '" + utils.findNextToken(src) + "'");
            }
        } else {
            throw new Error("missing name");
        }
    },

    "import": function (orig, context, parse) {
        if (typeof window !== 'undefined') {
            throw new Error("import cannot be used in a browser");
        }
        var src = orig.replace(/^import\s*/, "");
        if (utils.findNextToken(src) === "(") {
            var file = utils.getParamList(src);
            src = src.replace(file, "").replace(/^\s*|\s*$/g, "");
            utils.findNextToken(src) === ";" && (src = src.replace(/\s*;/, ""));
            file = file.replace(/[\(|\)]/g, "").split(",");
            if (file.length === 1) {
                file = utils.resolve(context.file || process.cwd(), file[0].replace(/["|']/g, ""));
                if (indexOf(context.loaded, file) === -1) {
                    var origFile = context.file;
                    context.file = file;
                    parse(fs.readFileSync(file, "utf8"), topLevelTokens, context);
                    context.loaded.push(file);
                    context.file = origFile;
                }
                return src;
            } else {
                throw new Error("import accepts a single file");
            }
        } else {
            throw new Error("unexpected token : expected : '(' found : '" + utils.findNextToken(src) + "'");
        }

    },

    //define a global
    "global": function (orig, context) {
        var src = orig.replace(/^global\s*/, "");
        var name = src.match(/^([a-zA-Z_$][0-9a-zA-Z_$]*\s*)/);
        if (name) {
            src = src.replace(name[0], "").replace(/^\s*|\s*$/g, "");
            if (utils.findNextToken(src) === "=") {
                name = name[1].replace(/^\s+|\s+$/g, '');
                var fullbody = utils.getTokensBetween(src, "=", ";", true).join("");
                var body = fullbody.substring(1, fullbody.length - 1);
                body = body.replace(/^\s+|\s+$/g, '');
                if (/^require\(/.test(body)) {
                    var file = utils.getParamList(body.replace("require")).replace(/[\(|\)]/g, "").split(",");
                    if (file.length === 1) {
                        //handle relative require calls
                        file = file[0].replace(/["|']/g, "");
                        body = ["require('", utils.resolve(context.file || process.cwd(), file) , "')"].join("");
                    }
                }
                context.scope.push({name: name, body: body});
                src = src.replace(fullbody, "");
                return src;
            } else {
                throw new Error("unexpected token : expected : '=' found : '" + utils.findNextToken(src) + "'");
            }
        } else {
            throw new Error("missing name");
        }
    },

    //define a function
    "function": function (orig, context) {
        var src = orig.replace(/^function\s*/, "");
        //parse the function name
        var name = src.match(/^([a-zA-Z_$][0-9a-zA-Z_$]*)\s*/);
        if (name) {
            src = src.replace(name[0], "");
            if (utils.findNextToken(src) === "(") {
                name = name[1];
                var params = utils.getParamList(src);
                src = src.replace(params, "").replace(/^\s*|\s*$/g, "");
                if (utils.findNextToken(src) === "{") {
                    var body = utils.getTokensBetween(src, "{", "}", true).join("");
                    src = src.replace(body, "");
                    //should
                    context.scope.push({name: name, body: "function" + params + body});
                    return src;
                } else {
                    throw new Error("unexpected token : expected : '{' found : '" + utils.findNextToken(src) + "'");
                }
            } else {
                throw new Error("unexpected token : expected : '(' found : '" + utils.findNextToken(src) + "'");
            }
        } else {
            throw new Error("missing name");
        }
    },

    "rule": function (orig, context, parse) {
        var src = orig.replace(/^rule\s*/, "");
        var name = src.match(/^([a-zA-Z_$][0-9a-zA-Z_$]*|"[^"]*"|'[^']*')/);
        if (name) {
            src = src.replace(name[0], "").replace(/^\s*|\s*$/g, "");
            if (utils.findNextToken(src) === "{") {
                name = name[1].replace(/^["']|["']$/g, "");
                var rule = {name: name, options: {}, constraints: null, action: null};
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
module.exports = topLevelTokens;

