var comb = require("comb"),
    constraintMatcher = require("./constraintMatcher"),
    atoms = require("./atoms");


var Pattern = comb.define(null, {});

var ObjectPattern = comb.define(Pattern, {
    instance:{
        constructor:function (type, alias, conditions, store) {
            this.type = type;
            this.alias = alias;
            this.conditions = conditions;
            this.atoms = [new atoms.ObjectAtom(type)];
            var atms = constraintMatcher.constraintToAtoms(conditions, alias);
            if (atms.length) {
                this.atoms = this.atoms.concat(atms);
            } else {
                var atm = new atoms.TrueAtom();
                this.atoms.push(atm);
            }
            if (store && !comb.isEmpty(store)) {
                var atm = new atoms.HashAtom(store);
                this.atoms.push(atm);
            }
            this.atoms.forEach(function (atom) {
                atom.alias = alias;
            });
        },

        toString:function () {
            return JSON.stringify(this.atoms);
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

        getters:{
            atoms:function () {
                return this.leftPattern.atoms.concat(this.rightPattern.atoms);
            }
        }
    }

}).as(exports, "CompositePattern");


var InitialFact = comb.define();
comb.define(ObjectPattern, {
    instance:{
        constructor:function () {
            this._super([
                {type:InitialFact},
                "i",
                [],
                {}
            ]);
        }
    }
}).as(exports, "InitialFactPattern");

