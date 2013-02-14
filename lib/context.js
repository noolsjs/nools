"use strict";
var extd = require("./extended"),
    declare = extd.declare,
    merge = extd.merge,
    union = extd.union,
    map = extd.map;

var Match = declare({
    instance: {
        constructor: function (assertable) {
            assertable = assertable || {};
            this.variables = [];
            this.facts = [];
            this.factHash = assertable.factHash || {};
            this.recency = [];
            this.constraints = [];
            this.isMatch = true;
            this.hashCode = "";
            if (assertable instanceof this._static) {
                this.isMatch = assertable.isMatch;
                this.facts = this.facts.concat(assertable.facts);
                this.hashCode = assertable.hashCode;
                this.factHash = merge(this.factHash, assertable.factHash);
                this.recency = union(this.recency, assertable.recency);
            } else {
                var fact = assertable;
                if (fact) {
                    this.facts.push(fact);
                    this.recency.push(fact.recency);
                    this.hashCode += fact.recency;
                }
            }
        },

        merge: function (mr) {
            var ret = new this._static();
            ret.isMatch = mr.isMatch;
            ret.facts = this.facts.concat(mr.facts);
            ret.hashCode = this.hashCode + ":" + mr.hashCode;
            ret.factHash = merge({}, this.factHash, mr.factHash);
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
});

declare({
    instance: {
        match: null,
        factHash: null,
        fact: null,
        hashCode: null,
        paths: null,

        constructor: function (fact, paths, mr) {
            this.fact = fact;
            this.paths = paths || null;
            var match = this.match = mr || new Match(fact);
            this.factHash = match.factHash;
            this.hashCode = match.hashCode;
        },

        "set": function (key, value) {
            this.factHash[key] = value;
            return this;
        },

        isMatch: function (isMatch) {
            this.match.isMatch = isMatch;
            return this;
        }
    }
}).as(module);


