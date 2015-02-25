"use strict";

var extd = require("./extended"),
    isArray = extd.isArray,
    forEach = extd.forEach,
    some = extd.some,
    indexOf = extd.indexOf,
    isNumber = extd.isNumber,
    removeDups = extd.removeDuplicates,
    atoms = require("./constraint");

function getProps(val) {
    return extd(val).map(function mapper(val) {
        return isArray(val) ? isArray(val[0]) ? getProps(val).value() : val.reverse().join(".") : val;
    }).flatten().filter(function (v) {
        return !!v;
    });
}

var definedFuncs = {
    indexOf: extd.indexOf,
    now: function () {
        return new Date();
    },

    Date: function (y, m, d, h, min, s, ms) {
        var date = new Date();
        if (isNumber(y)) {
            date.setYear(y);
        }
        if (isNumber(m)) {
            date.setMonth(m);
        }
        if (isNumber(d)) {
            date.setDate(d);
        }
        if (isNumber(h)) {
            date.setHours(h);
        }
        if (isNumber(min)) {
            date.setMinutes(min);
        }
        if (isNumber(s)) {
            date.setSeconds(s);
        }
        if (isNumber(ms)) {
            date.setMilliseconds(ms);
        }
        return date;
    },

    lengthOf: function (arr, length) {
        return arr.length === length;
    },

    isTrue: function (val) {
        return val === true;
    },

    isFalse: function (val) {
        return val === false;
    },

    isNotNull: function (actual) {
        return actual !== null;
    },

    dateCmp: function (dt1, dt2) {
        return extd.compare(dt1, dt2);
    }

};

forEach(["years", "days", "months", "hours", "minutes", "seconds"], function (k) {
    definedFuncs[k + "FromNow"] = extd[k + "FromNow"];
    definedFuncs[k + "Ago"] = extd[k + "Ago"];
});


forEach(["isArray", "isNumber", "isHash", "isObject", "isDate", "isBoolean", "isString", "isRegExp", "isNull", "isEmpty",
    "isUndefined", "isDefined", "isUndefinedOrNull", "isPromiseLike", "isFunction", "deepEqual"], function (k) {
    var m = extd[k];
    definedFuncs[k] = function () {
        return m.apply(extd, arguments);
    };
});


var lang = {

    equal: function (c1, c2) {
        var ret = false;
        if (c1 === c2) {
            ret = true;
        } else {
            if (c1[2] === c2[2]) {
                if (indexOf(["string", "number", "boolean", "regexp", "identifier", "null"], c1[2]) !== -1) {
                    ret = c1[0] === c2[0];
                } else if (c1[2] === "unary" || c1[2] === "logicalNot") {
                    ret = this.equal(c1[0], c2[0]);
                } else {
                    ret = this.equal(c1[0], c2[0]) && this.equal(c1[1], c2[1]);
                }
            }
        }
        return ret;
    },

    __getProperties: function (rule) {
        var ret = [];
        if (rule) {
            var rule2 = rule[2];
            if (!rule2) {
                return ret;
            }
            if (rule2 !== "prop" &&
                rule2 !== "identifier" &&
                rule2 !== "string" &&
                rule2 !== "number" &&
                rule2 !== "boolean" &&
                rule2 !== "regexp" &&
                rule2 !== "unary" &&
                rule2 !== "unary") {
                ret[0] = this.__getProperties(rule[0]);
                ret[1] = this.__getProperties(rule[1]);
            } else if (rule2 === "identifier") {
                //at the bottom
                ret = [rule[0]];
            } else {
                ret = lang.__getProperties(rule[1]).concat(lang.__getProperties(rule[0]));
            }
        }
        return ret;
    },

    getIndexableProperties: function (rule) {
        if (rule[2] === "composite") {
            return this.getIndexableProperties(rule[0]);
        } else if (/^(\w+(\['[^']*'])*) *([!=]==?|[<>]=?) (\w+(\['[^']*'])*)$/.test(this.parse(rule))) {
            return getProps(this.__getProperties(rule)).flatten().value();
        } else {
            return [];
        }
    },

    getIdentifiers: function (rule) {
        var ret = [];
        var rule2 = rule[2];

        if (rule2 === "identifier") {
            //its an identifier so stop
            return [rule[0]];
        } else if (rule2 === "function") {
            ret = ret.concat(this.getIdentifiers(rule[0])).concat(this.getIdentifiers(rule[1]));
        } else if (rule2 !== "string" &&
            rule2 !== "number" &&
            rule2 !== "boolean" &&
            rule2 !== "regexp" &&
            rule2 !== "unary" &&
            rule2 !== "unary") {
            //its an expression so keep going
            if (rule2 === "prop") {
                ret = ret.concat(this.getIdentifiers(rule[0]));
                if (rule[1]) {
                    var propChain = rule[1];
                    //go through the member variables and collect any identifiers that may be in functions
                    while (isArray(propChain)) {
                        if (propChain[2] === "function") {
                            ret = ret.concat(this.getIdentifiers(propChain[1]));
                            break;
                        } else {
                            propChain = propChain[1];
                        }
                    }
                }

            } else {
                if (rule[0]) {
                    ret = ret.concat(this.getIdentifiers(rule[0]));
                }
                if (rule[1]) {
                    ret = ret.concat(this.getIdentifiers(rule[1]));
                }
            }
        }
        //remove dups and return
        return removeDups(ret);
    },

    toConstraints: function (rule, options) {
        var ret = [],
            alias = options.alias,
            scope = options.scope || {};

        var rule2 = rule[2];


        if (rule2 === "and") {
            ret = ret.concat(this.toConstraints(rule[0], options)).concat(this.toConstraints(rule[1], options));
        } else if (
            rule2 === "composite" ||
            rule2 === "or" ||
            rule2 === "lt" ||
            rule2 === "gt" ||
            rule2 === "lte" ||
            rule2 === "gte" ||
            rule2 === "like" ||
            rule2 === "notLike" ||
            rule2 === "eq" ||
            rule2 === "neq" ||
            rule2 === "seq" ||
            rule2 === "sneq" ||
            rule2 === "in" ||
            rule2 === "notIn" ||
            rule2 === "prop" ||
            rule2 === "propLookup" ||
            rule2 === "function" ||
            rule2 === "logicalNot") {
            var isReference = some(this.getIdentifiers(rule), function (i) {
                return i !== alias && !(i in definedFuncs) && !(i in scope);
            });
            switch (rule2) {
            case "eq":
                ret.push(new atoms[isReference ? "ReferenceEqualityConstraint" : "EqualityConstraint"](rule, options));
                break;
            case "seq":
                ret.push(new atoms[isReference ? "ReferenceEqualityConstraint" : "EqualityConstraint"](rule, options));
                break;
            case "neq":
                ret.push(new atoms[isReference ? "ReferenceInequalityConstraint" : "InequalityConstraint"](rule, options));
                break;
            case "sneq":
                ret.push(new atoms[isReference ? "ReferenceInequalityConstraint" : "InequalityConstraint"](rule, options));
                break;
            case "gt":
                ret.push(new atoms[isReference ? "ReferenceGTConstraint" : "ComparisonConstraint"](rule, options));
                break;
            case "gte":
                ret.push(new atoms[isReference ? "ReferenceGTEConstraint" : "ComparisonConstraint"](rule, options));
                break;
            case "lt":
                ret.push(new atoms[isReference ? "ReferenceLTConstraint" : "ComparisonConstraint"](rule, options));
                break;
            case "lte":
                ret.push(new atoms[isReference ? "ReferenceLTEConstraint" : "ComparisonConstraint"](rule, options));
                break;
            default:
                ret.push(new atoms[isReference ? "ReferenceConstraint" : "ComparisonConstraint"](rule, options));
            }

        }
        return ret;
    },


    parse: function (rule) {
        return this[rule[2]](rule[0], rule[1]);
    },

    composite: function (lhs) {
        return this.parse(lhs);
    },

    and: function (lhs, rhs) {
        return ["(", this.parse(lhs), "&&", this.parse(rhs), ")"].join(" ");
    },

    or: function (lhs, rhs) {
        return ["(", this.parse(lhs), "||", this.parse(rhs), ")"].join(" ");
    },

    prop: function (name, prop) {
        if (prop[2] === "function") {
            return [this.parse(name), this.parse(prop)].join(".");
        } else {
            return [this.parse(name), "['", this.parse(prop), "']"].join("");
        }
    },

    propLookup: function (name, prop) {
        if (prop[2] === "function") {
            return [this.parse(name), this.parse(prop)].join(".");
        } else {
            return [this.parse(name), "[", this.parse(prop), "]"].join("");
        }
    },

    unary: function (lhs) {
        return -1 * this.parse(lhs);
    },

    plus: function (lhs, rhs) {
        return [this.parse(lhs), "+", this.parse(rhs)].join(" ");
    },
    minus: function (lhs, rhs) {
        return [this.parse(lhs), "-", this.parse(rhs)].join(" ");
    },

    mult: function (lhs, rhs) {
        return [this.parse(lhs), "*", this.parse(rhs)].join(" ");
    },

    div: function (lhs, rhs) {
        return [this.parse(lhs), "/", this.parse(rhs)].join(" ");
    },

    mod: function (lhs, rhs) {
        return [this.parse(lhs), "%", this.parse(rhs)].join(" ");
    },

    lt: function (lhs, rhs) {
        return [this.parse(lhs), "<", this.parse(rhs)].join(" ");
    },
    gt: function (lhs, rhs) {
        return [this.parse(lhs), ">", this.parse(rhs)].join(" ");
    },
    lte: function (lhs, rhs) {
        return [this.parse(lhs), "<=", this.parse(rhs)].join(" ");
    },
    gte: function (lhs, rhs) {
        return [this.parse(lhs), ">=", this.parse(rhs)].join(" ");
    },
    like: function (lhs, rhs) {
        return [this.parse(rhs), ".test(", this.parse(lhs), ")"].join("");
    },
    notLike: function (lhs, rhs) {
        return ["!", this.parse(rhs), ".test(", this.parse(lhs), ")"].join("");
    },
    eq: function (lhs, rhs) {
        return [this.parse(lhs), "==", this.parse(rhs)].join(" ");
    },

    seq: function (lhs, rhs) {
        return [this.parse(lhs), "===", this.parse(rhs)].join(" ");
    },

    neq: function (lhs, rhs) {
        return [this.parse(lhs), "!=", this.parse(rhs)].join(" ");
    },

    sneq: function (lhs, rhs) {
        return [this.parse(lhs), "!==", this.parse(rhs)].join(" ");
    },

    "in": function (lhs, rhs) {
        return ["(indexOf(", this.parse(rhs), ",", this.parse(lhs), ")) != -1"].join("");
    },

    "notIn": function (lhs, rhs) {
        return ["(indexOf(", this.parse(rhs), ",", this.parse(lhs), ")) == -1"].join("");
    },

    "arguments": function (lhs, rhs) {
        var ret = [];
        if (lhs) {
            ret.push(this.parse(lhs));
        }
        if (rhs) {
            ret.push(this.parse(rhs));
        }
        return ret.join(",");
    },

    "array": function (lhs) {
        var args = [];
        if (lhs) {
            args = this.parse(lhs);
            if (isArray(args)) {
                return args;
            } else {
                return ["[", args, "]"].join("");
            }
        }
        return ["[", args.join(","), "]"].join("");
    },

    "function": function (lhs, rhs) {
        var args = this.parse(rhs);
        return [this.parse(lhs), "(", args, ")"].join("");
    },

    "string": function (lhs) {
        return "'" + lhs + "'";
    },

    "number": function (lhs) {
        return lhs;
    },

    "boolean": function (lhs) {
        return lhs;
    },

    regexp: function (lhs) {
        return lhs;
    },

    identifier: function (lhs) {
        return lhs;
    },

    "null": function () {
        return "null";
    },

    logicalNot: function (lhs) {
        return ["!(", this.parse(lhs), ")"].join("");
    }
};

var matcherCount = 0;
var toJs = exports.toJs = function (rule, scope, alias, equality, wrap) {
    /*jshint evil:true*/
    var js = lang.parse(rule);
    scope = scope || {};
    var vars = lang.getIdentifiers(rule);
    var closureVars = ["var indexOf = definedFuncs.indexOf; var hasOwnProperty = Object.prototype.hasOwnProperty;"], funcVars = [];
    extd(vars).filter(function (v) {
        var ret = ["var ", v, " = "];
        if (definedFuncs.hasOwnProperty(v)) {
            ret.push("definedFuncs['", v, "']");
        } else if (scope.hasOwnProperty(v)) {
            ret.push("scope['", v, "']");
        } else {
            return true;
        }
        ret.push(";");
        closureVars.push(ret.join(""));
        return false;
    }).forEach(function (v) {
        var ret = ["var ", v, " = "];
        if (equality || v !== alias) {
            ret.push("fact." + v);
        } else if (v === alias) {
            ret.push("hash.", v, "");
        }
        ret.push(";");
        funcVars.push(ret.join(""));
    });
    var closureBody = closureVars.join("") + "return function matcher" + (matcherCount++) + (!equality ? "(fact, hash){" : "(fact){") + funcVars.join("") + " return " + (wrap ? wrap(js) : js) + ";}";
    var f = new Function("definedFuncs, scope", closureBody)(definedFuncs, scope);
    //console.log(f.toString());
    return f;
};

exports.getMatcher = function (rule, options, equality) {
    options = options || {};
    return toJs(rule, options.scope, options.alias, equality, function (src) {
        return "!!(" + src + ")";
    });
};

exports.getSourceMatcher = function (rule, options, equality) {
    options = options || {};
    return toJs(rule, options.scope, options.alias, equality, function (src) {
        return src;
    });
};

exports.toConstraints = function (constraint, options) {
    if (typeof constraint === 'function') {
        return [new atoms.CustomConstraint(constraint, options)];
    }
    //constraint.split("&&")
    return lang.toConstraints(constraint, options);
};

exports.equal = function (c1, c2) {
    return lang.equal(c1, c2);
};

exports.getIdentifiers = function (constraint) {
    return lang.getIdentifiers(constraint);
};

exports.getIndexableProperties = function (constraint) {
    return lang.getIndexableProperties(constraint);
};