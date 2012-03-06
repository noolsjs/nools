var comb = require("comb"), array = comb.array, removeDups = array.removeDuplicates, intersect = array.intersect, atoms = require("./atoms");

var lang = {

    equal:function (c1, c2) {
        var ret = false;
        if (c1[2] === c2[2]) {
            if (["string", "number", "boolean", "regexp", "identifier", "null"].indexOf(c1[2]) != -1) {
                ret = c1[0] === c2[0];
            }else if (c1[2] == "unminus"){
                ret = this.equal(c1[0], c2[0]);
            } else {
                ret = this.equal(c1[0], c2[0]) && this.equal(c1[1], c2[1]);
            }
        }
        return ret;
    },

    getIdentifiers:function (rule) {
        var ret = [];
        var rule2 = rule[2];
        if (rule2 == "identifier") {
            //its an identifier so stop
            return rule[0];
        } else if (rule2 != "string" && rule2 != "number" && rule2 != "boolean" && rule2 != "regexp" && rule2 != "unminus") {
            //its an expression so keep going
            if (rule2 == "prop") {
                return ret.concat(this.getIdentifiers(rule[0]));
            }
            return ret.concat(this.getIdentifiers(rule[0]), this.getIdentifiers(rule[1]));
        }
        //remove dups and return
        return removeDups(ret);
    },

    toAtoms:function (rule, reference) {
        var ret = [];
        var rule2 = rule[2];
        if (rule2 == "and") {
            ret = ret.concat(this.toAtoms(rule[0], reference)).concat(this.toAtoms(rule[1], reference));
        } else if (rule2 == "or") {
            //we probably shouldnt support this right now
            ret.push(new atoms.EqualityAtom(rule));
        } else if (rule2 == "lt" || rule2 == "gt" || rule2 == "lte" || rule2 == "gte" || rule2 == "like" || rule2 == "eq" || rule2 == "neq") {
            if (this.getIdentifiers(rule).some(function (i) {
                return i != reference
            })) {
                ret.push(new atoms.ReferenceAtom(rule));
            } else {
                ret.push(new atoms.EqualityAtom(rule));
            }
        }
        return ret;
    },

    parse:function (rule, env) {
        return this[rule[2]](rule[0], rule[1], env);
    },

    and:function (lhs, rhs, env) {
        return this.parse(lhs, env) && this.parse(rhs, env);
    },
    or:function (lhs, rhs, env) {
        return this.parse(lhs, env) || this.parse(rhs, env);
    },

    prop:function (name, prop, env) {
        return this.parse(prop, this.parse(name, env));
    },

    plus:function (lhs, rhs, env) {
        return this.parse(lhs, env) + this.parse(rhs, env);
    },
    minus:function (lhs, rhs, env) {
        return this.parse(lhs, env) - this.parse(rhs, env);
    },

    mult:function (lhs, rhs, env) {
        return this.parse(lhs, env) * this.parse(rhs, env);
    },

    unminus:function (lhs, rhs, env) {
        return -1 * this.parse(lhs, env);
    },

    div:function (lhs, rhs, env) {
        return this.parse(lhs, env) / this.parse(rhs, env);
    },
    lt:function (lhs, rhs, env) {
        return this.parse(lhs, env) < this.parse(rhs, env);
    },
    gt:function (lhs, rhs, env) {
        return this.parse(lhs, env) > this.parse(rhs, env);
    },
    lte:function (lhs, rhs, env) {
        return this.parse(lhs, env) <= this.parse(rhs, env);
    },
    gte:function (lhs, rhs, env) {
        return this.parse(lhs, env) >= this.parse(rhs, env);
    },
    like:function (lhs, rhs, env) {
        return ("" + this.parse(lhs, env)).match(this.parse(rhs, env)) != null;
    },
    eq:function (lhs, rhs, env) {
        return this.parse(lhs, env) === this.parse(rhs, env);
    },
    neq:function (lhs, rhs, env) {
        return this.parse(lhs, env) !== this.parse(rhs, env);
    },

    string:function (lhs) {
        return lhs;
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

    identifier:function (lhs, rhs, env) {
        env = env || {};
        return env[lhs];
    },

    "null":function () {
        return null;
    }
};

exports.constraintToAtoms = function (constraint, reference) {
    return lang.toAtoms(constraint, reference);
};

exports.equal = function (c1, c2) {
    return lang.equal(c1, c2);
}


exports.match = function (env, constraint) {
    env = env || {};
    return lang.parse(constraint, env);
};

exports.isDependent = function (keys, constraint) {
    return intersect(keys, lang.getIdentifiers(constraint)).length >= 1;
};

exports.getIdentifiers = function (constraint) {
    return lang.getIdentifiers(constraint);
};



