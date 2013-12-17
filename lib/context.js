"use strict";
var extd = require("./extended"),
    isBoolean = extd.isBoolean,
    declare = extd.declare,
    indexOf = extd.indexOf,
    pPush = Array.prototype.push;

function createContextHash(paths, hashCode) {
    var ret = "",
        i = -1,
        l = paths.length;
    while (++i < l) {
        ret += paths[i].id + ":";
    }
    ret += hashCode;
    return ret;
}

function merge(h1, h2, aliases) {
    var i = -1, l = aliases.length, alias;
    while (++i < l) {
        alias = aliases[i];
        h1[alias] = h2[alias];
    }
}

function unionRecency(arr, arr1, arr2) {
    pPush.apply(arr, arr1);
    var i = -1, l = arr2.length, val, j = arr.length;
    while (++i < l) {
        val = arr2[i];
        if (indexOf(arr, val) === -1) {
            arr[j++] = val;
        }
    }
}

var Match = declare({
    instance: {

        isMatch: true,
        hashCode: "",
        facts: null,
        factIds: null,
        factHash: null,
        recency: null,
        aliases: null,

        constructor: function () {
            this.facts = [];
            this.factIds = [];
            this.factHash = {};
            this.recency = [];
            this.aliases = [];
        },

        addFact: function (assertable) {
            pPush.call(this.facts, assertable);
            pPush.call(this.recency, assertable.recency);
            pPush.call(this.factIds, assertable.id);
            this.hashCode = this.factIds.join(":");
            return this;
        },

        merge: function (mr) {
            var ret = new Match();
            ret.isMatch = mr.isMatch;
            pPush.apply(ret.facts, this.facts);
            pPush.apply(ret.facts, mr.facts);
            pPush.apply(ret.aliases, this.aliases);
            pPush.apply(ret.aliases, mr.aliases);
            ret.hashCode = this.hashCode + ":" + mr.hashCode;
            merge(ret.factHash, this.factHash, this.aliases);
            merge(ret.factHash, mr.factHash, mr.aliases);
            unionRecency(ret.recency, this.recency, mr.recency);
            return ret;
        }
    }
});

var Context = declare({
    instance: {
        match: null,
        factHash: null,
        aliases: null,
        fact: null,
        hashCode: null,
        paths: null,
        pathsHash: null,

        constructor: function (fact, paths, mr) {
            this.fact = fact;
            if (mr) {
                this.match = mr;
            } else {
                this.match = new Match().addFact(fact);
            }
            this.factHash = this.match.factHash;
            this.aliases = this.match.aliases;
            this.hashCode = this.match.hashCode;
            if (paths) {
                this.paths = paths;
                this.pathsHash = createContextHash(paths, this.hashCode);
            } else {
                this.pathsHash = this.hashCode;
            }
        },

        "set": function (key, value) {
            this.factHash[key] = value;
            this.aliases.push(key);
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
            this.aliases = match.aliases;
            return this;
        },

        clone: function (fact, paths, match) {
            return new Context(fact || this.fact, paths || this.path, match || this.match);
        }
    }
}).as(module);


