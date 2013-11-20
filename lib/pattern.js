"use strict";
var extd = require("./extended"),
    isEmpty = extd.isEmpty,
    merge = extd.merge,
    forEach = extd.forEach,
    declare = extd.declare,
    constraintMatcher = require("./constraintMatcher"),
    constraint = require("./constraint"),
    EqualityConstraint = constraint.EqualityConstraint,
    FromConstraint = constraint.FromConstraint;

var id = 0;
var Pattern = declare({});

var ObjectPattern = Pattern.extend({
    instance: {
        constructor: function (type, alias, conditions, store, options) {
            options = options || {};
            this.id = id++;
            this.type = type;
            this.alias = alias;
            this.conditions = conditions;
            this.pattern = options.pattern;
            var constraints = [new constraint.ObjectConstraint(type)];
            var constrnts = constraintMatcher.toConstraints(conditions, merge({alias: alias}, options));
            if (constrnts.length) {
                constraints = constraints.concat(constrnts);
            } else {
                var cnstrnt = new constraint.TrueConstraint();
                constraints.push(cnstrnt);
            }
            if (store && !isEmpty(store)) {
                var atm = new constraint.HashConstraint(store);
                constraints.push(atm);
            }

            forEach(constraints, function (constraint) {
                constraint.set("alias", alias);
            });
            this.constraints = constraints;
        },

        getSpecificity: function () {
            var constraints = this.constraints, specificity = 0;
            for (var i = 0, l = constraints.length; i < l; i++) {
                if (constraints[i] instanceof EqualityConstraint) {
                    specificity++;
                }
            }
            return specificity;
        },

        hasConstraint: function (type) {
            return extd.some(this.constraints, function (c) {
                return c instanceof type;
            });
        },

        hashCode: function () {
            return [this.type, this.alias, extd.format("%j", this.conditions)].join(":");
        },

        toString: function () {
            return extd.format("%j", this.constraints);
        }
    }
}).as(exports, "ObjectPattern");

var FromPattern = ObjectPattern.extend({
    instance: {
        constructor: function (type, alias, conditions, store, from, options) {
            this._super([type, alias, conditions, store, options]);
            this.from = new FromConstraint(from, options);
        },

        hasConstraint: function (type) {
            return extd.some(this.constraints, function (c) {
                return c instanceof type;
            });
        },

        getSpecificity: function () {
            return this._super(arguments) + 1;
        },

        hashCode: function () {
            return [this.type, this.alias, extd.format("%j", this.conditions), this.from.from].join(":");
        },

        toString: function () {
            return extd.format("%j from %s", this.constraints, this.from.from);
        }
    }
}).as(exports, "FromPattern");


FromPattern.extend().as(exports, "FromNotPattern");
ObjectPattern.extend().as(exports, "NotPattern");
ObjectPattern.extend().as(exports, "ExistsPattern");
FromPattern.extend().as(exports, "FromExistsPattern");

Pattern.extend({

    instance: {
        constructor: function (left, right) {
            this.id = id++;
            this.leftPattern = left;
            this.rightPattern = right;
        },

        hashCode: function () {
            return [this.leftPattern.hashCode(), this.rightPattern.hashCode()].join(":");
        },

        getSpecificity: function () {
            return this.rightPattern.getSpecificity() + this.leftPattern.getSpecificity();
        },

        getters: {
            constraints: function () {
                return this.leftPattern.constraints.concat(this.rightPattern.constraints);
            }
        }
    }

}).as(exports, "CompositePattern");


var InitialFact = declare({
    instance: {
        constructor: function () {
            this.id = id++;
            this.recency = 0;
        }
    }
}).as(exports, "InitialFact");

ObjectPattern.extend({
    instance: {
        constructor: function () {
            this._super([InitialFact, "__i__", [], {}]);
        },

        assert: function () {
            return true;
        }
    }
}).as(exports, "InitialFactPattern");



