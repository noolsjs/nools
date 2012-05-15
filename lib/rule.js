var comb = require("comb"),
    assert = require("assert"),
    isString = comb.isString,
    parser = require("./parser"),
    pattern = require("./pattern"),
    ObjectPattern = pattern.ObjectPattern,
    NotPattern = pattern.NotPattern,
    CompositePattern = pattern.CompositePattern,
    array = comb.array,
    flatten = comb.array.flatten,
    removeDuplicates = array.removeDuplicates,
    constraintMatcher = require("./constraintMatcher");


var InitialRule = comb.define(null, {
    instance:{
        constructor:function () {

        }
    }
}).as(exports, "InitialRule");


var Rule = comb.define(InitialRule, {
    instance:{
        constructor:function (name, options, pattern, cb) {
            this.name = name;
            this.pattern = pattern;
            this.cb = cb;
            this.priority = options.priority || options.salience || 0;
        },

        fire:function (flow, match) {
            var ret = new comb.Promise(), cb = this.cb;
            if (cb.length == 3) {
                var classicNext = function (err) {
                    if (err) {
                        ret.errback(err);
                    } else {
                        ret.callback();
                    }
                };
                this.cb.call(flow, match.factHash, flow, classicNext);
            } else {
                return comb.when(this.cb.call(flow, match.factHash, flow));
            }
            return ret;
        }
    }
}).as(exports, "Rule");

exports.createRuleFromObject = function (name, obj, defined) {
    if (comb.isEmpty(obj)) {
        throw new Error("Rule is empty");
    }
    var options = obj.options || {};
    var rules = obj.rules || [], l = rules.length;
    if (!l) {
        throw new Error("no rules defined for rule " + name);
    }
    var action = obj.action;
    if (!action) {
        throw new Error("No action was defined for rule " + name);
    }
    var conditions = [], identifiers = [];
    if (!Array.isArray(rules[0])) {
        rules = [rules];
        l = 1;
    }
    for (var i = 0; i < l; i++) {
        var rule = rules[i], condition = [];
        if (rule.length) {
            var r0 = rule[0];
            if (r0 === "not" || r0 === "or") {
                condition.push(r0);
                rule.shift();
            }
            var definedClass = rule[0], alias = rule[1], constraints = rule[2], refs = rule[3];
            if (definedClass && (definedClass = defined[definedClass]) != null) {
                condition.push(definedClass);
            } else {
                throw new Error("Invalid class " + rule[0] + " for rule " + name);
            }
            condition.push(alias, constraints, refs);
            conditions.push(condition);
            identifiers.push(alias);
            if (constraints) {
                identifiers = identifiers.concat(constraintMatcher.getIdentifiers(parser.parseConstraint(constraints)));
            }
            if (comb.isObject(refs)) {
                for (var j in refs) {
                    identifiers.push(refs[j]);
                }
            }
            identifiers = removeDuplicates(identifiers);
        }
    }
    return createRule(name, options, conditions, parseAction(action, identifiers, defined));
};

var createRule = exports.createRule = function (name, options, conditions, cb) {
    if (comb.isArray(options)) {
        cb = conditions;
        conditions = options;
    } else {
        options = options || {};
    }
    var isRules = conditions.every(function (cond) {
        return Array.isArray(cond);
    });
    if (isRules && conditions.length == 1) {
        conditions = conditions[0];
        isRules = false;
    }
    var rules = [];
    if (isRules) {
        var l = conditions.length, patterns = [];
        for (var i = 0; i < l; i++) {
            var patts = parsePattern(conditions[i]);
            patts.forEach(function (patt, i) {
                if (!patterns[i]) {
                    patterns[i] = i == 0 ? [] : patterns[i - 1].slice();
                    //remove dup
                    i != 0 && patterns[i].pop()
                    patterns[i].push(patt);
                } else {
                    patterns.forEach(function (p) {
                        p.push(patt);
                    });
                }
            });

        }
        rules = patterns.map(function (patterns) {
            var compPat = null;
            for (var i = 0; i < patterns.length; i++) {
                if (compPat == null) {
                    compPat = new CompositePattern(patterns[i++], patterns[i]);
                } else {
                    compPat = new CompositePattern(compPat, patterns[i]);
                }
            }
            return new Rule(name, options, compPat, cb);
        });
    } else {
        rules = parsePattern(conditions).map(function (cond) {
            return new Rule(name, options, cond, cb);
        })
    }
    return rules;
};

var modifiers = ["assert", "modify", "retract"];
var parseAction = function (action, identifiers, defined) {
    if (comb.isArray(action)) {
        action = action.join("\n\t");
    }
    identifiers.forEach(function (i) {
        action = action.replace(new RegExp("\\$(" + i + ")", "g"), "facts.$1");
    });
    var needFlow = false;
    modifiers.forEach(function (i) {
        if (action.indexOf(i) != -1) {
            needFlow = true;
            action = action.replace(new RegExp("\\$(" + i + ")", "g"), "flow.$1");
        }
    });
    var params = ["facts"];
    if (needFlow) {
        params.push("flow");
    }
    if (action.indexOf("next()") != -1) {
        params.push("next");
    }
    action = ["(function(", params.join(","), ")", "{\n\t", action, "\n})"].join("");
    for (var i in defined) {
        if (action.indexOf(i) != -1) {
            action = action.replace(new RegExp("\\$(" + i + ")", "g"), "defined.$1");
        }
    }
    try {
        return eval(action);
    } catch (e) {
        throw new Error("Invalid action : " + action + "\n" + e.message);
    }
};

var parsePattern = function (condition) {
    if (condition[0] === "or") {
        condition.shift();
        return flatten(condition.map(function (cond) {
            return parsePattern(cond);
        }));
    } else if (condition[0] === "not") {
        condition.shift();
        return [new NotPattern(getParamType(condition[0]), condition[1] || "m", parser.parseConstraint(condition[2] || "true"),
            condition[3] || {})];
    } else {
        return [new ObjectPattern(getParamType(condition[0]), condition[1] || "m", parser.parseConstraint(condition[2] || "true"),
            condition[3] || {})]
    }
};

var getParamTypeFromString = function (param) {
    var ret;
    switch (param.toLowerCase()) {
        case "string":
            ret = String;
            break;
        case "date":
            ret = Date;
            break;
        case "array":
            ret = Array;
            break;
        case "boolean":
            ret = Boolean;
            break;
        case "regexp":
            ret = RegExp;
            break;
        case "number":
            ret = Number;
            break;
        case "object":
        case "hash":
            ret = Object;
            break;
        default:
            throw "invalid param type " + param;
    }
    return ret;
}


var getParamType = function (param) {
    var ret;
    if (isString(param)) {
        ret = getParamTypeFromString(param);
    } else if (comb.isDefined(param)) {
        if (param === String) {
            ret = String;
        } else if (param === Array || (comb.isArray(param) && param.length == 0)) {
            ret = Array;
        } else if (param === Date) {
            ret = Date;
        } else if (param === Boolean) {
            ret = Boolean;
        } else if (param === RegExp) {
            ret = RegExp;
        } else if (param === Number) {
            ret = Number;
        } else if ("function" === typeof param) {
            ret = param;
        } else {
            throw "invalid param type " + param;
        }
    }
    return ret;
};


