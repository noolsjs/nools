var comb = require("comb"),
    assert = require("assert"),
    parser = require("./parser"),
    pattern = require("./pattern"),
    ObjectPattern = pattern.ObjectPattern,
    NotPattern = pattern.NotPattern,
    CompositePattern = pattern.CompositePattern,
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
            this.priority = options.priority || 0;
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
    }else{
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
            patterns.push(parsePattern(conditions[i]));
        }
        var compPat = null;
        for (var i = 0; i < patterns.length; i++) {
            if (compPat == null) {
                compPat = new CompositePattern(patterns[i++], patterns[i]);
            } else {
                compPat = new CompositePattern(compPat, patterns[i]);
            }
        }
        return new Rule(name, options, compPat, cb);
    } else {
        return new Rule(name, options, parsePattern(conditions), cb);
    }
};

var parsePattern = function(condition){
    if(condition[0] === "not"){
        condition.shift();
        return new NotPattern(getParamType(condition[0]), condition[1] || "m", parser.parse(condition[2] || "true"), condition[3] || {})
    }else{
        return new ObjectPattern(getParamType(condition[0]), condition[1] || "m", parser.parse(condition[2] || "true"), condition[3] || {})
    }
}


var getParamType = function (param) {
    var ret = {type:param, optional:false, literal:false};
    if (comb.isDefined(param)) {
        if (param === String || param === "string" || param === "?string") {
            ret.type = String;
        } else if (param === Array || (comb.isArray(param) && param.length == 0) || param === "array" || param === "?array") {
            ret.type = Array;
        } else if (param === Date || param === "date" || param === "?date") {
            ret.type = Date;
        } else if (param === Boolean || param === "boolean" || param === "?boolean") {
            ret.type = Boolean;
        } else if (param === RegExp || "regexp" === param || param === "?regexp") {
            ret.type = RegExp;
        } else if (param === Number || "number" === param || param === "?number") {
            ret.type = Number;
        } else if (comb.isHash(param)) {
            var type = param;
            if (comb.isDefined(param.type)) {
                ret.type = this.getParamType(param.type).type;
            }
            comb.isDefined(param.optional) && (ret.optional = param.optional);
            comb.isDefined(param.literal) && (ret.optional = param.literal);
        } else {
            ret.literal = true;
            ret.type = param;
            if (!comb.isString(param) && !comb.isDate(param) && !comb.isBoolean(param) && !comb.isRexExp(param) && !comb.isNumber(param) && !comb.isArray(param)) {
                ret.literal = false;
            }
        }
    }
    (!ret.literal && comb.isString(param)) && (ret.optional = param.match(/^\?/) != null);
    return ret;
};
