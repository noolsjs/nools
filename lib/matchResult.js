(function () {
    "use strict";
    var comb = require("comb"),
        declare = require("declare.js"),
        merge = comb.merge,
        union = comb.array.union;

    declare({
        instance: {
            constructor: function (assertable) {
                assertable = assertable || {};
                this.variables = [];
                this.facts = [];
                this.factHash = {};
                this.recency = [];
                this.constraints = [];
                this.isMatch = false;
                var fact = assertable.fact;
                if (fact) {
                    this.facts.push(fact);
                    this.recency.push(fact.recency);
                }

            },

            merge: function (mr) {
                var ret = new this._static();
                ret.isMatch = mr.isMatch;
                ret.facts = this.facts.concat(mr.facts);
                merge(ret.factHash, this.factHash, mr.factHash);
                ret.recency = union(this.recency, mr.recency);
                return ret;
            },

            getters: {

                factIds: function () {
                    return this.facts.map(
                        function (fact) {
                            return fact.id;
                        }).sort();
                }
            }

        }
    }).as(module);


})();