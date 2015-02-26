"use strict";

var extd = require("./extended"),
    deepEqual = extd.deepEqual,
    merge = extd.merge,
    instanceOf = extd.instanceOf,
    filter = extd.filter,
    declare = extd.declare,
    constraintMatcher;

var id = 0;
var Constraint = declare({

    type: null,

    instance: {
        constructor: function (constraint) {
            if (!constraintMatcher) {
                constraintMatcher = require("./constraintMatcher");
            }
            this.id = id++;
            this.constraint = constraint;
            extd.bindAll(this, ["assert"]);
        },
        "assert": function () {
            throw new Error("not implemented");
        },

        getIndexableProperties: function () {
            return [];
        },

        equal: function (constraint) {
            return instanceOf(constraint, this._static) && this.get("alias") === constraint.get("alias") && extd.deepEqual(this.constraint, constraint.constraint);
        },

        getters: {
            variables: function () {
                return [this.get("alias")];
            }
        }


    }
});

Constraint.extend({
    instance: {

        type: "object",

        constructor: function (type) {
            this._super([type]);
        },

        "assert": function (param) {
            return param instanceof this.constraint || param.constructor === this.constraint;
        },

        equal: function (constraint) {
            return instanceOf(constraint, this._static) && this.constraint === constraint.constraint;
        }
    }
}).as(exports, "ObjectConstraint");

var EqualityConstraint = Constraint.extend({

    instance: {

        type: "equality",

        constructor: function (constraint, options) {
            this._super([constraint]);
            options = options || {};
            this.pattern = options.pattern;
            this._matcher = constraintMatcher.getMatcher(constraint, options, true);
        },

        "assert": function (values) {
            return this._matcher(values);
        }
    }
}).as(exports, "EqualityConstraint");

EqualityConstraint.extend({instance: {type: "inequality"}}).as(exports, "InequalityConstraint");
EqualityConstraint.extend({instance: {type: "comparison"}}).as(exports, "ComparisonConstraint");

Constraint.extend({

    instance: {

        type: "equality",

        constructor: function () {
            this._super([
                [true]
            ]);
        },

        equal: function (constraint) {
            return instanceOf(constraint, this._static) && this.get("alias") === constraint.get("alias");
        },


        "assert": function () {
            return true;
        }
    }
}).as(exports, "TrueConstraint");

var ReferenceConstraint = Constraint.extend({

    instance: {

        type: "reference",

        constructor: function (constraint, options) {
            this.cache = {};
            this._super([constraint]);
            options = options || {};
            this.values = [];
            this.pattern = options.pattern;
            this._options = options;
            this._matcher = constraintMatcher.getMatcher(constraint, options, false);
        },

        "assert": function (fact, fh) {
            try {
                return this._matcher(fact, fh);
            } catch (e) {
                throw new Error("Error with evaluating pattern " + this.pattern + " " + e.message);
            }

        },

        merge: function (that) {
            var ret = this;
            if (that instanceof ReferenceConstraint) {
                ret = new this._static([this.constraint, that.constraint, "and"], merge({}, this._options, this._options));
                ret._alias = this._alias || that._alias;
                ret.vars = this.vars.concat(that.vars);
            }
            return ret;
        },

        equal: function (constraint) {
            return instanceOf(constraint, this._static) && extd.deepEqual(this.constraint, constraint.constraint);
        },


        getters: {
            variables: function () {
                return this.vars;
            },

            alias: function () {
                return this._alias;
            }
        },

        setters: {
            alias: function (alias) {
                this._alias = alias;
                this.vars = filter(constraintMatcher.getIdentifiers(this.constraint), function (v) {
                    return v !== alias;
                });
            }
        }
    }

}).as(exports, "ReferenceConstraint");


ReferenceConstraint.extend({
    instance: {
        type: "reference_equality",
        op: "eq",
        getIndexableProperties: function () {
            return constraintMatcher.getIndexableProperties(this.constraint);
        }
    }
}).as(exports, "ReferenceEqualityConstraint")
    .extend({instance: {type: "reference_inequality", op: "neq"}}).as(exports, "ReferenceInequalityConstraint")
    .extend({instance: {type: "reference_gt", op: "gt"}}).as(exports, "ReferenceGTConstraint")
    .extend({instance: {type: "reference_gte", op: "gte"}}).as(exports, "ReferenceGTEConstraint")
    .extend({instance: {type: "reference_lt", op: "lt"}}).as(exports, "ReferenceLTConstraint")
    .extend({instance: {type: "reference_lte", op: "lte"}}).as(exports, "ReferenceLTEConstraint");


Constraint.extend({
    instance: {

        type: "hash",

        constructor: function (hash) {
            this._super([hash]);
        },

        equal: function (constraint) {
            return extd.instanceOf(constraint, this._static) && this.get("alias") === constraint.get("alias") && extd.deepEqual(this.constraint, constraint.constraint);
        },

        "assert": function () {
            return true;
        },

        getters: {
            variables: function () {
                return this.constraint;
            }
        }

    }
}).as(exports, "HashConstraint");

Constraint.extend({
    instance: {
        constructor: function (constraints, options) {
            this.type = "from";
            this.constraints = constraintMatcher.getSourceMatcher(constraints, (options || {}), true);
            extd.bindAll(this, ["assert"]);
        },

        equal: function (constraint) {
            return instanceOf(constraint, this._static) && this.get("alias") === constraint.get("alias") && deepEqual(this.constraints, constraint.constraints);
        },

        "assert": function (fact, fh) {
            return this.constraints(fact, fh);
        },

        getters: {
            variables: function () {
                return this.constraint;
            }
        }

    }
}).as(exports, "FromConstraint");

Constraint.extend({
    instance: {
        constructor: function (func, options) {
            this.type = "custom";
            this.fn = func;
            this.options = options;
            extd.bindAll(this, ["assert"]);
        },

        equal: function (constraint) {
            return instanceOf(constraint, this._static) && this.fn === constraint.constraint;
        },

        "assert": function (fact, fh) {
            return this.fn(fact, fh);
        }
    }
}).as(exports, "CustomConstraint");


