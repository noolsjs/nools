"use strict";

var extd = require("./extended"),
    object = extd.hash,
    keys = object.keys,
    forEach = extd.forEach,
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
            return extd.instanceOf(constraint, this._static) && this.get("alias") === constraint.get("alias") && constraintMatcher.equal(this.constraint, constraint.constraint);
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
            return extd.instanceOf(constraint, this._static) && this.constraint === constraint.constraint;
        }
    }
}).as(exports, "ObjectConstraint");

Constraint.extend({

    instance: {
        constructor: function (constraint) {
            this._super(["equality", constraint]);
            this._matcher = constraintMatcher.getMatcher(constraint);
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
            return extd.instanceOf(constraint, this._static) && this.get("alias") === constraint.get("alias");
        },


        "assert": function () {
            return true;
        }
    }
}).as(exports, "TrueConstraint");

Constraint.extend({

    instance: {
        constructor: function (constraint) {
            this._super(["reference", constraint]);
            this._matcher = constraintMatcher.getMatcher(constraint);
        },

        "assert": function (values) {
            return this._matcher(values);
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

        "assert": function (factHash) {
            var fact = factHash[this.get("alias")], constraint = this.constraint;
            forEach(keys(constraint), function (k) {
                var v = constraint[k];
                factHash[v] = fact[k];
            });
            return true;
        },

        getters: {
            variables: function () {
                return this.constraint;
            }
        }

    }
}).as(exports, "HashConstraint");



