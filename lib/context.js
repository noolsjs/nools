"use strict";
var extd = require("./extended"),
    isBoolean = extd.isBoolean,
    declare = extd.declare,
    merge = extd.merge,
    union = extd.union,
    pSlice = Array.prototype.slice;

function createContextHash(paths, hashCode) {
    var ret = [],
        i = -1,
        l = paths.length;
    while (++i < l) {
        ret.push(paths[i].id);
    }
    ret.push(hashCode);
    return ret.join(":");
}

var Match = declare({
    instance: {
        constructor: function (assertable) {
            this.isMatch = true;
            if (assertable instanceof this._static) {
                this.isMatch = assertable.isMatch;
                this.facts = pSlice.call(assertable.facts);
                this.factIds = pSlice.call(assertable.factIds);
                this.hashCode = this.factIds.join(":");
                this.factHash = merge({}, assertable.factHash);
                this.recency = pSlice.call(assertable.recency);
            } else if (assertable) {
                this.facts = [assertable];
                this.factIds = [assertable.id];
                this.recency = [assertable.recency];
                this.hashCode = assertable.id + "";
                this.factHash = assertable.factHash || {};
            } else {
                this.facts = [];
                this.factIds = [];
                this.factHash = {};
                this.hashCode = "";
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
            var hashCode = this.hashCode = match.hashCode;
            this.pathsHash = paths ? createContextHash(paths || [], hashCode) : hashCode;
            this.factIds = match.factIds;
        },

        "set": function (key, value) {
            this.factHash[key] = value;
            return this;
        },

        isMatch: function (isMatch) {
            if (isBoolean(isMatch)) {
                this.match.isMatch = isMatch;
            } else {
                return this.match.isMatch;
            }
            return this;
        },

        mergeMatch: function (merge) {
            var match = this.match = this.match.merge(merge);
            this.factHash = match.factHash;
            this.hashCode = match.hashCode;
            this.factIds = match.factIds;
            return this;
        },

        clone: function (fact, paths, match) {
            return new Context(fact || this.fact, paths || this.path, match || this.match);
        }
    }
}).as(module);


