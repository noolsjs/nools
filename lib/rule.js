var comb = require("comb"),
    assert = require("assert"),
    isString = comb.isString,
    parser = require("./parser"),
    pattern = require("./pattern"),
    ObjectPattern = pattern.ObjectPattern,
    NotPattern = pattern.NotPattern,
    CompositePattern = pattern.CompositePattern,
    flatten = comb.array.flatten,
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
            return comb.when(this.cb.apply(flow, [match.factHash, flow]));
        }
    }
}).as(exports, "Rule");


exports.createRule = function (name, options, conditions, cb) {
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

var parsePattern = function (condition) {
    if (condition[0] === "or") {
        condition.shift();
        return flatten(condition.map(function (cond) {
            return parsePattern(cond);
        }));
    } else if (condition[0] === "not") {
        condition.shift();
        return [new NotPattern(getParamType(condition[0]), condition[1] || "m", parser.parse(condition[2] || "true"),
            condition[3] || {})];
    } else {
        return [new ObjectPattern(getParamType(condition[0]), condition[1] || "m", parser.parse(condition[2] || "true"),
            condition[3] || {})]
    }
};

var getParamTypeFromString = function(param){
    var ret;
    switch(param.toLowerCase()){
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
    if(isString(param)){
        ret = getParamTypeFromString(param);
    }else if (comb.isDefined(param)) {
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
