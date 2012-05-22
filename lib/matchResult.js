(function () {
    "use strict";
    var comb = require("comb"),
        define = comb.define,
        merge = comb.merge,
        union = comb.array.union;

    define(null, {
        instance:{
            constructor:function (assertable) {
                assertable = assertable || {};
                this.variables = [];
                this.facts = [];
                assertable.fact && this.facts.push(assertable.fact);
                this.factHash = {};
                this.recency = [];
                this.constraints = [];
                this.isMatch = false;
                assertable.fact && this.recency.push(assertable.fact.recency);

            },

            merge:function (mr) {
                var ret = new this._static();
                ret.isMatch = mr.isMatch;
                ret.facts = this.facts.concat(mr.facts);
                merge(ret.factHash, this.factHash, mr.factHash);
                ret.recency = union(this.recency, mr.recency);
                return ret;
            },

            getters:{

                factIds:function () {
                    return this.facts.map(
                        function (fact) {
                            return fact.id;
                        }).sort();
                }
            }

        }
    }).as(module);

})();