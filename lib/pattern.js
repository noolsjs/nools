var comb = require("comb"),
    constraintMatcher = require("./constraintMatcher"),
    constraint = require("./constraint");


var Pattern = comb.define(null, {});

var ObjectPattern = comb.define(Pattern, {
    instance:{
        constructor:function (type, alias, conditions, store) {
            this.type = type;
            this.alias = alias;
            this.conditions = conditions;
            this.constraints = [new constraint.ObjectConstraint(type)];
            var constrnts = constraintMatcher.toConstraints(conditions, alias);
            if (constrnts.length) {
                this.constraints = this.constraints.concat(constrnts);
            } else {
                var cnstrnt = new constraint.TrueConstraint();
                this.constraints.push(cnstrnt);
            }
            if (store && !comb.isEmpty(store)) {
                var atm = new constraint.HashConstraint(store);
                this.constraints.push(atm);
            }
            this.constraints.forEach(function (constraint) {
                constraint.alias = alias;
            });
        },

        hashCode : function(){
            return [this.type, this.alias, JSON.stringify(this.conditions), +Date].join(":");
        },

        toString:function () {
            return JSON.stringify(this.constraints);
        }
    }
}).as(exports, "ObjectPattern");

comb.define(ObjectPattern).as(exports, "NotPattern");

var CompositePattern = comb.define(Pattern, {

    instance:{
        constructor:function (left, right) {
            this.leftPattern = left;
            this.rightPattern = right;
        },

        hashCode : function(){
            return [this.leftPattern.hashCode(), this.rightPattern.hashCode()].join(":");
        },

        getters:{
            constraints:function () {
                return this.leftPattern.constraints.concat(this.rightPattern.constraints);
            }
        }
    }

}).as(exports, "CompositePattern");


var InitialFact = comb.define().as(exports, "InitialFact");
comb.define(ObjectPattern, {
    instance:{
        constructor:function () {
            this._super([InitialFact,"i",[],{}]);
        },

        assert : function(){
            return true;
        }
    }
}).as(exports, "InitialFactPattern");

