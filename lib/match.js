"use strict";
var extd = require("./extended"),
    isBoolean = extd.isBoolean,
    declare = extd.declare,
    indexOf = extd.indexOf,
    pPush = Array.prototype.push;
var _ = require('lodash');


function merge(h1, h2, aliases) {
    var i = -1, l = aliases.length, alias;
    while (++i < l) {
        alias = aliases[i];
        h1[alias] = h2[alias];
    }
}
function accumulate(h1, h2, aliases) {
    var i = -1, l = aliases.length, alias, h1Val;
    while (++i < l) {
        alias = aliases[i];
        h1Val =  h1[alias];
        if( !_.isArray(h1Val) ) {
             h1[alias] = h1Val = [h1Val];
         }
        h1Val.push(h2[alias]);
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
			pPush.apply(ret.factIds, this.factIds);
			 pPush.apply(ret.factIds, mr.factIds);
            pPush.apply(ret.aliases, this.aliases);
            pPush.apply(ret.aliases, mr.aliases);
            ret.hashCode = this.hashCode + ":" + mr.hashCode;
            merge(ret.factHash, this.factHash, this.aliases);
            merge(ret.factHash, mr.factHash, mr.aliases);
            unionRecency(ret.recency, this.recency, mr.recency);
            return ret;
        }
    }
}).as(module);



