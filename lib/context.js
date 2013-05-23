"use strict";
var extd = require("./extended"),
    declare = extd.declare,
    merge = extd.merge,
    union = extd.union;

var Match = declare({
    instance: {
        constructor: function (assertable) {
            assertable = assertable || {};
            this.variables = [];
            this.facts = [];
            this.factIds = [];
            this.factHash = assertable.factHash || {};
            this.recency = [];
            this.constraints = [];
            this.isMatch = true;
            this.hashCode = "";
            if (assertable instanceof this._static) {
                this.isMatch = assertable.isMatch;
                this.facts = this.facts.concat(assertable.facts);
                this.factIds = this.factIds.concat(assertable.factIds);
                this.hashCode = this.factIds.join(":");
                this.factHash = merge(this.factHash, assertable.factHash);
                this.recency = union(this.recency, assertable.recency);
            } else {
                var fact = assertable;
                if (fact) {
                    this.facts.push(fact);
                    this.factIds.push(fact.id);
                    this.recency.push(fact.recency);
                    this.hashCode += this.factIds.join(":");
                }
            }
        },

        merge: function (mr) {
            var ret = new this._static();
            ret.isMatch = mr.isMatch;
            ret.facts = this.facts.concat(mr.facts);
            ret.factIds = this.factIds.concat(mr.factIds);
            ret.hashCode = ret.factIds.join(":");
            ret.factHash = merge({}, this.factHash, mr.factHash);
            ret.recency = union(this.recency, mr.recency);
            return ret;
        }

    }
});

var Context = declare({
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
            this.factIds = match.factIds;
        },

        "set": function (key, value) {
            this.factHash[key] = value;
            return this;
        },

        isMatch: function (isMatch) {
            this.match.isMatch = isMatch;
            return this;
        },

        clone: function (fact, paths, match) {
            return new Context(fact || this.fact, paths || this.path, match || this.match);
        }
    }
}).as(module);


