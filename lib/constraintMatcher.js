(function () {
    "use strict";

    var comb = require("comb"),
        dt = comb.date, array = comb.array,
        isUndefinedOrNull = comb.isUndefinedOrNull,
        removeDups = array.removeDuplicates,
        intersect = array.intersect,
        atoms = require("./constraint"),
        vm = require("vm");

    var definedFuncs = {
        now:function () {
            return new Date();
        },

        Date:function (y, m, d, h, min, s, ms) {
            var date = new Date();
            if (comb.isNumber(y)) {
                date.setYear(y);
            }
            if (comb.isNumber(m)) {
                date.setMonth(m);
            }
            if (comb.isNumber(d)) {
                date.setDate(d);
            }
            if (comb.isNumber(h)) {
                date.setHours(h);
            }
            if (comb.isNumber(min)) {
                date.setMinutes(min);
            }
            if (comb.isNumber(s)) {
                date.setSeconds(s);
            }
            if (comb.isNumber(ms)) {
                date.setMilliseconds(ms);
            }
            return date;
        },

        lengthOf:function (arr, length) {
            return arr.length === length;
        },

        isTrue:function (val) {
            return val === true;
        },

        isFalse:function (val) {
            return val === false;
        },

        isRegExp:function (val) {
            return comb.isRexExp(val);
        },

        isNull:function (actual) {
            return actual === null;
        },

        isNotNull:function (actual) {
            return actual !== null;
        },

        dateCmp:function (dt1, dt2) {
            return dt.compare(dt1, dt2);
        },

        isEmpty:function (val) {
            return comb.isEmpty(val);
        }
    };

    ["years", "days", "months", "hours", "minutes", "seconds"].forEach(function (k) {
        definedFuncs[k + "FromNow"] = comb[k + "FromNow"];
        definedFuncs[k + "Ago"] = comb[k + "Ago"];
    });


    ["isArray", "isNumber", "isHash", "isObject", "isDate", "isBoolean", "isString",
        "isUndefined", "isDefined", "isUndefinedOrNull", "isPromiseLike", "isFunction", "deepEqual"].forEach(function (k) {
        definedFuncs[k] = function (val) {
            return comb[k].apply(comb, arguments);
        };
    });


    var lang = {

        equal:function (c1, c2) {
            var ret = false;
            if (c1 === c2) {
                ret = true;
            } else {
                if (c1[2] === c2[2]) {
                    if (["string", "number", "boolean", "regexp", "identifier", "null"].indexOf(c1[2]) !== -1) {
                        ret = c1[0] === c2[0];
                    } else if (c1[2] === "unminus") {
                        ret = this.equal(c1[0], c2[0]);
                    } else {
                        ret = this.equal(c1[0], c2[0]) && this.equal(c1[1], c2[1]);
                    }
                }
            }
            return ret;
        },

        getIdentifiers:function (rule) {
            var ret = [];
            var rule2 = rule[2];
            if (rule2 === "identifier") {
                //its an identifier so stop
                return [rule[0]];
            } else if (rule2 === "function") {
                ret.push(rule[0]);
                ret = ret.concat(this.getIdentifiers(rule[1]));
            } else if (rule2 !== "string" &&
                rule2 !== "number" &&
                rule2 !== "boolean" &&
                rule2 !== "regexp" &&
                rule2 !== "unminus") {
                //its an expression so keep going
                if (rule2 === "prop") {
                    return ret.concat(this.getIdentifiers(rule[0]));
                }
                if (rule[0]) {
                    ret = ret.concat(this.getIdentifiers(rule[0]));
                }
                if (rule[1]) {
                    ret = ret.concat(this.getIdentifiers(rule[1]));
                }
            }
            //remove dups and return
            return removeDups(ret);
        },

        toConstraints:function (rule, reference) {
            var ret = [];
            var rule2 = rule[2];
            if (rule2 === "and") {
                ret = ret.concat(this.toConstraints(rule[0], reference)).concat(this.toConstraints(rule[1], reference));
            } else if (rule2 === "or") {
                //we probably shouldnt support this right now
                ret.push(new atoms.EqualityConstraint(rule));
            } else if (rule2 === "lt" ||
                rule2 === "gt" ||
                rule2 === "lte" ||
                rule2 === "gte" ||
                rule2 === "like" ||
                rule2 === "eq" ||
                rule2 === "neq" ||
                rule2 === "in" ||
                rule2 === "function") {
                if (this.getIdentifiers(rule).some(function (i) {
                    return i !== reference && !(i in definedFuncs);
                })) {
                    ret.push(new atoms.ReferenceConstraint(rule));
                } else {
                    ret.push(new atoms.EqualityConstraint(rule));
                }
            }
            return ret;
        },


        parse:function (rule) {
            return this[rule[2]](rule[0], rule[1]);
        },

        and:function (lhs, rhs) {
            return [this.parse(lhs), "&&", this.parse(rhs)].join(" ");
        },

        or:function (lhs, rhs) {
            return [this.parse(lhs), "||", this.parse(rhs)].join(" ");
        },

        prop:function (name, prop) {
            return [this.parse(name), this.parse(prop)].join(".");
        },

        unminus:function (lhs, rhs) {
            return -1 * this.parse(lhs);
        },

        plus:function (lhs, rhs) {
            return [this.parse(lhs), "+", this.parse(rhs)].join(" ");
        },
        minus:function (lhs, rhs) {
            return [this.parse(lhs), "-", this.parse(rhs)].join(" ");
        },

        mult:function (lhs, rhs) {
            return [this.parse(lhs), "*", this.parse(rhs)].join(" ");
        },

        div:function (lhs, rhs) {
            return [this.parse(lhs), "/", this.parse(rhs)].join(" ");
        },

        lt:function (lhs, rhs) {
            return [this.parse(lhs), "<", this.parse(rhs)].join(" ");
        },
        gt:function (lhs, rhs) {
            return [this.parse(lhs), ">", this.parse(rhs)].join(" ");
        },
        lte:function (lhs, rhs) {
            return [this.parse(lhs), "<=", this.parse(rhs)].join(" ");
        },
        gte:function (lhs, rhs) {
            return [this.parse(lhs), ">=", this.parse(rhs)].join(" ");
        },
        like:function (lhs, rhs) {
            return [this.parse(rhs), ".test(", this.parse(lhs), ")"].join("");
        },
        eq:function (lhs, rhs) {
            return [this.parse(lhs), "===", this.parse(rhs)].join(" ");
        },
        neq:function (lhs, rhs) {
            return [this.parse(lhs), "!==", this.parse(rhs)].join(" ");
        },

        "in":function (lhs, rhs) {
            return ["[", this.parse(rhs), "].indexOf(", this.parse(lhs), ") != -1"].join("");
        },

        "arguments":function (lhs, rhs) {
            var ret = [];
            if (lhs) {
                ret.push(this.parse(lhs));
            }
            if (rhs) {
                ret.push(this.parse(rhs));
            }
            return ret.join(",");
        },

        "array":function (lhs, rhs) {
            var args = [];
            if (lhs) {
                args = this.parse(lhs);
                if (Array.isArray(args)) {
                    return args;
                } else {
                    return [args];
                }
            }
            return ["[", args.join(","), "]"].join("");
        },

        "function":function (lhs, rhs) {
            var args = this.parse(rhs), f;
            return [lhs, "(", args, ")"].join("");
        },

        string:function (lhs) {
            return "'" + lhs + "'";
        },

        number:function (lhs) {
            return lhs;
        },

        "boolean":function (lhs) {
            return lhs;
        },

        regexp:function (lhs) {
            return lhs;
        },

        identifier:function (lhs, rhs) {
            return lhs;
        },

        "null":function (lhs) {
            return "null";
        }
    };

    var toJs = exports.toJs = function (rule) {
        var js =  lang.parse(rule);
        var vars = lang.getIdentifiers(rule);
        return ["(function(hash){", vars.map(function(v){
            var ret = ["var ", v, " = "];
            if(definedFuncs.hasOwnProperty(v)){
                ret.push("definedFuncs['", v, "']");
            }else{
                ret.push("hash['", v, "']");
            }
            ret.push(";");
            return ret.join("");
        }).join(""), " return !!(", js, ");", "})"].join("");
    };

    exports.getMatcher = function (rule) {
        return eval(toJs(rule));
    };

    exports.toConstraints = function (constraint, reference) {
        //constraint.split("&&")
        return lang.toConstraints(constraint, reference);
    };

    exports.equal = function (c1, c2) {
        return lang.equal(c1, c2);
    };

    exports.getIdentifiers = function (constraint) {
        return lang.getIdentifiers(constraint);
    };

})();



