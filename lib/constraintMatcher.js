var comb = require("comb"), array = comb.array, removeDups = array.removeDuplicates, intersect = array.intersect, atoms = require("./atoms");

var lang = {

    getIdentifiers:function (rule) {
        var ret = [];
        if (rule[2] == "identifier") {
            //its an identifier so stop
            return rule[0];
        } else if (["string", "number", "boolean", "regexp", "unminus"].indexOf(rule[2]) == -1) {
            //its an expression so keep going
            if (rule[2] == "prop") {
                return ret.concat(this.getIdentifiers(rule[0]));
            }
            return ret.concat(this.getIdentifiers(rule[0]), this.getIdentifiers(rule[1]));
        }
        //remove dups and return
        return removeDups(ret);
    },

    toAtoms:function (rule, reference) {
        var ret = [];
        if (rule[2] == "and") {
            ret = ret.concat(this.toAtoms(rule[0], reference)).concat(this.toAtoms(rule[1], reference));
        } else if (rule[2] == "or") {
            //we probably shouldnt support this right now
            ret.push(new atoms.EqualityAtom(rule));
        } else if (["lt", "gt", "lte", "gte", "like", "eq", "neq"].indexOf(rule[2]) != -1) {
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

    string:function (lhs, rhs, env) {
        return lhs;
    },

    number:function (lhs, rhs, env) {
        return lhs;
    },

    boolean:function (lhs, rhs, env) {
        return lhs;
    },

    regexp:function (lhs, rhs, env) {
        return lhs;
    },

    identifier:function (lhs, rhs, env) {
        return env ? env[lhs] : undefined;
    },

    null:function (lhs, rhs, env) {
        return null;
    }
};

exports.constraintToAtoms = function (constraint, reference) {
    return lang.toAtoms(constraint, reference);
};


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



