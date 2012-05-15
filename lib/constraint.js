(function () {
    "use strict";

    var comb = require("comb"), constraintMatcher;

    var Constraint = comb.define(null, {

        instance:{
            constructor:function (type, constraint) {
                if (!constraintMatcher) {
                    constraintMatcher = require("./constraintMatcher");
                }
                this.type = type;
                this.constraint = constraint;
            },
            assert:function () {
                throw "not implemented";
            },

            equal:function (constraint) {
                return comb.isInstanceOf(constraint, this._static) && this.alias === constraint.alias && constraintMatcher.equal(this.constraint, constraint.constraint);
            },

            getters:{
                variables:function () {
                    return [this.alias];
                }
            }


        }
    });

    comb.define(Constraint, {
        instance:{
            constructor:function (type) {
                this._super(["object", type]);
            },

            assert:function (param) {
                return param instanceof this.constraint || param.constructor === this.constraint;
            },

            equal:function (constraint) {
                return comb.isInstanceOf(constraint, this._static) && this.constraint === constraint.constraint;
            }
        }
    }).as(exports, "ObjectConstraint");

    comb.define(Constraint, {

        instance:{
            constructor:function (constraint) {
                this._super(["equality", constraint]);
                this._matcher = constraintMatcher.getMatcher(constraint);
            },

            assert:function (values) {
                return this._matcher(values);
            }
        }
    }).as(exports, "EqualityConstraint");

    comb.define(Constraint, {

        instance:{
            constructor:function (constraint) {
                this._super(["equality", [true]]);
            },

            equal:function (constraint) {
                return comb.isInstanceOf(constraint, this._static) && this.alias === constraint.alias;
            },


            assert:function (assertable) {
                return true;
            }
        }
    }).as(exports, "TrueConstraint");

    comb.define(Constraint, {

        instance:{
            constructor:function (constraint) {
                this._super(["reference", constraint]);
                this._js  = constraintMatcher.toJs(constraint);
                this._matcher = constraintMatcher.getMatcher(constraint);
            },

            assert:function (values) {
                return this._matcher(values);
            },

            getters:{
                variables:function () {
                    return this.vars;
                },

                alias:function () {
                    return this._alias;
                }
            },

            setters:{
                alias:function (alias) {
                    this._alias = alias;
                    this.vars = constraintMatcher.getIdentifiers(this.constraint).filter(function (v) {
                        return v !== alias;
                    }, this);
                }
            }
        }

    }).as(exports, "ReferenceConstraint");


    comb.define(Constraint, {
        instance:{
            constructor:function (hash) {
                this._super(["hash", hash]);
            },

            equal:function (constraint) {
                return comb.isInstanceOf(constraint, this._static) && this.alias === constraint.alias && JSON.stringify(this.constraint) === JSON.stringify(constraint.constraint);
            },

            assert:function (factHash) {
                var fact = factHash[this.alias];
                Object.keys(this.constraint).forEach(function (k) {
                    var v = this.constraint[k];
                    factHash[v] = fact[k];
                }, this);
                return true;
            },

            getters:{
                variables:function () {
                    return this.constraint;
                }
            }

        }
    }).as(exports, "HashConstraint");

})();

