"use strict";
var extd = require("./extended"),
    isArray = extd.isArray,
    Promise = extd.Promise,
    when = extd.when,
    declare = extd.declare,
    parser = require("./parser"),
    pattern = require("./pattern"),
    ObjectPattern = pattern.ObjectPattern,
    NotPattern = pattern.NotPattern,
    CompositePattern = pattern.CompositePattern;


var InitialRule = declare({});

var getParamTypeSwitch = extd
    .switcher()
    .isEq("string", function () {
        return String;
    })
    .isEq("date", function () {
        return Date;
    })
    .isEq("array", function () {
        return Array;
    })
    .isEq("boolean", function () {
        return Boolean;
    })
    .isEq("regexp", function () {
        return RegExp;
    })
    .isEq("number", function () {
        return Number;
    })
    .isEq("object", function () {
        return Object;
    })
    .isEq("hash", function () {
        return Object;
    })
    .def(function (param) {
        throw new TypeError("invalid param type " + param);
    })
    .switcher();


var getParamType = extd
    .switcher()
    .isString(function (param) {
        return getParamTypeSwitch(param.toLowerCase());
    })
    .isFunction(function (func) {
        return func;
    })
    .deepEqual([], function () {
        return Array;
    })
    .def(function (param) {
        throw  new Error("invalid param type " + param);
    })
    .switcher();

var parsePattern = extd
    .switcher()
    .contains("or", function (condition) {
        condition.shift();
        return extd(condition).map(function (cond) {
            return parsePattern(cond);
        }).flatten().value();
    })
    .contains("not", function (condition) {
        condition.shift();
        return [
            new NotPattern(
                getParamType(condition[0]),
                condition[1] || "m",
                parser.parseConstraint(condition[2] || "true"),
                condition[3] || {}
            )
        ];
    })
    .def(function (condition) {
        return [
            new ObjectPattern(
                getParamType(condition[0]),
                condition[1] || "m",
                parser.parseConstraint(condition[2] || "true"),
                condition[3] || {}
            )
        ];
    }).switcher();


var Rule = InitialRule.extend({
    instance: {
        constructor: function (name, options, pattern, cb) {
            this.name = name;
            this.pattern = pattern;
            this.cb = cb;
            this.priority = options.priority || options.salience || 0;
        },

        fire: function (flow, match) {
            var ret = new Promise(), cb = this.cb;
            if (cb.length === 3) {
                this.cb.call(flow, match.factHash, flow, ret.classic.bind(ret));
            } else {
                return when(this.cb.call(flow, match.factHash, flow));
            }
            return ret;
        }
    }
});

function createRule(name, options, conditions, cb) {
    if (extd.isArray(options)) {
        cb = conditions;
        conditions = options;
    } else {
        options = options || {};
    }
    var isRules = extd.every(conditions, function (cond) {
        return isArray(cond);
    });
    if (isRules && conditions.length === 1) {
        conditions = conditions[0];
        isRules = false;
    }
    var rules = [];
    if (isRules) {
        var _mergePatterns = function (patt, i) {
            if (!patterns[i]) {
                patterns[i] = i === 0 ? [] : patterns[i - 1].slice();
                //remove dup
                if (i !== 0) {
                    patterns[i].pop();
                }
                patterns[i].push(patt);
            } else {
                extd(patterns).forEach(function (p) {
                    p.push(patt);
                });
            }

        };
        var l = conditions.length, patterns = [];
        for (var i = 0; i < l; i++) {
            extd.forEach(parsePattern(conditions[i]), _mergePatterns);

        }
        rules = extd.map(patterns, function (patterns) {
            var compPat = null;
            for (var i = 0; i < patterns.length; i++) {
                if (compPat === null) {
                    compPat = new CompositePattern(patterns[i++], patterns[i]);
                } else {
                    compPat = new CompositePattern(compPat, patterns[i]);
                }
            }
            return new Rule(name, options, compPat, cb);
        });
    } else {
        rules = extd.map(parsePattern(conditions), function (cond) {
            return new Rule(name, options, cond, cb);
        });
    }
    return rules;
}

exports.createRule = createRule;



