"use strict";

var extd = require("./extended"),
    object = extd.hash,
    merge = extd.merge,
    keys = object.keys,
    forEach = extd.forEach,
    instanceOf = extd.instanceOf,
    filter = extd.filter,
    declare = extd.declare,
    constraintMatcher;

var Constraint = declare({

    instance: {
        constructor: function (type, constraint) {
            if (!constraintMatcher) {
                constraintMatcher = require("./constraintMatcher");
            }
            this.type = type;
            this.constraint = constraint;
        },
        "assert": function () {
            throw new Error("not implemented");
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
        constructor: function (type) {
            this._super(["object", type]);
        },

        "assert": function (param) {
            return param instanceof this.constraint || param.constructor === this.constraint;
        },

        equal: function (constraint) {
            return instanceOf(constraint, this._static) && this.constraint === constraint.constraint;
        }
    }
}).as(exports, "ObjectConstraint");

Constraint.extend({

    instance: {
        constructor: function (constraint, options) {
            this._super(["equality", constraint]);
            options = options || {};
            this.pattern = options.pattern;
            this._matcher = constraintMatcher.getMatcher(constraint, options.scope || {});
        },

        "assert": function (values) {
            return this._matcher(values);
        }
    }
}).as(exports, "EqualityConstraint");

Constraint.extend({

    instance: {
        constructor: function () {
            this._super(["equality", [true]]);
        },

        equal: function (constraint) {
            return instanceOf(constraint, this._static) && this.get("alias") === constraint.get("alias");
        },


        "assert": function () {
            return true;
        }
    }
}).as(exports, "TrueConstraint");

Constraint.extend({

    instance: {
        constructor: function (constraint, options) {
            this.cache = {};
            this._super(["reference", constraint]);
            options = options || {};
            this.values = [];
            this.pattern = options.pattern;
            this._options = options;
            this._matcher = constraintMatcher.getMatcher(constraint, options.scope || {});
        },

        "assert": function (values) {
            try {
                return this._matcher(values);
            } catch (e) {
                throw new Error("Error with evaluating pattern " + this.pattern + " " + e.message);
            }

        },

        merge: function (that, type) {
            var ret = this;
            if (that instanceof this._static) {
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


Constraint.extend({
    instance: {
        constructor: function (hash) {
            this._super(["hash", hash]);
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



