var comb = require("comb"), HashTable = comb.collections.HashTable;


var id = 0;
var Fact = comb.define(null, {

    instance:{
        constructor:function (obj) {
            this.object = obj;
            this.recency = 0;
            this.id = id++;
        },

        equals:function (fact) {
            if (comb.isInstanceOf(fact, this._static)) {
                return fact != null && fact.object == this.object;
            } else {
                return fact != null && fact == this.object
            }
        }
    }

}).as(exports, "Fact");

comb.define(null, {

    instance:{

        constructor:function () {
            this.recency = 0;
            this.facts = [];
        },

        getFact:function (f) {
            var ret;
            if (!comb.isInstanceOf(f, Fact)) {
                var facts = this.facts, l = this.facts.length;
                for (var i = 0; i < l; i++) {
                    var fact = facts[i];
                    if (fact.object === f) {
                        ret = fact;
                        break;
                    }
                }
            } else {
                ret = f;
            }
            return ret;

        },

        eachFact:function (cb) {
            this.facts.forEach(function (f) {
                cb(f);
            })
        },

        assertFact:function (fact) {
            if (fact.object == null) {
                throw 'The fact asserted cannot be null!';
            }
            fact.recency = this.recency++;
            this.facts.push(fact);
            return fact
        },

        retractFact:function (fact) {
            var facts = this.facts, l = facts.length;
            for (var i = 0; i < l; i++) {
                var existingFact = facts[i];
                if (existingFact.equals(fact)) {
                    this.facts.splice(i, 1);
                    return existingFact;
                }
            }
            //if we made it here we did not find the fact
            throw "the fact to remove does not exist";


        }
    }

}).as(exports, "WorkingMemory");