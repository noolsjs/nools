(function () {
    "use strict";
    var extd = require("./extended"),
        merge = extd.merge,
        forEach = extd.forEach,
        declare = extd.declare,
        constraintMatcher = require("./constraintMatcher"),
        constraint = require("./constraint");


    var Pattern = declare({});

    var ObjectPattern = Pattern.extend({
        instance: {
            constructor: function (type, alias, conditions, store, options) {
                this.type = type;
                this.alias = alias;
                this.conditions = conditions;
                this.constraints = [new constraint.ObjectConstraint(type)];
                var constrnts = constraintMatcher.toConstraints(conditions, merge({alias: alias}, options));
                if (constrnts.length) {
                    this.constraints = this.constraints.concat(constrnts);
                } else {
                    var cnstrnt = new constraint.TrueConstraint();
                    this.constraints.push(cnstrnt);
                }
                if (store && !extd.isEmpty(store)) {
                    var atm = new constraint.HashConstraint(store);
                    this.constraints.push(atm);
                }
                forEach(this.constraints, function (constraint) {
                    constraint.set("alias", alias);
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

    ObjectPattern.extend().as(exports, "NotPattern");

    Pattern.extend({

        instance: {
            constructor: function (left, right) {
                this.leftPattern = left;
                this.rightPattern = right;
            },

            hashCode: function () {
                return [this.leftPattern.hashCode(), this.rightPattern.hashCode()].join(":");
            },

            getters: {
                constraints: function () {
                    return this.leftPattern.constraints.concat(this.rightPattern.constraints);
                }
            }
        }

    }).as(exports, "CompositePattern");


    var InitialFact = declare({}).as(exports, "InitialFact");

    ObjectPattern.extend({
        instance: {
            constructor: function () {
                this._super([InitialFact, "i", [], {}]);
            },

            assert: function () {
                return true;
            }
        }
    }).as(exports, "InitialFactPattern");

})();

