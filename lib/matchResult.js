"use strict";
var extd = require("./extended"),
    declare = extd.declare,
    merge = extd.merge,
    union = extd.union,
    map = extd.map;

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
                return map(this.facts,function (fact) {
                    return fact.id;
                }).sort();
            }
        }

    }
}).as(module);


