"use strict";
var extd = require("./extended"),
    isBoolean = extd.isBoolean,
    declare = extd.declare,
    indexOf = extd.indexOf,
    pPush = Array.prototype.push;

var Match = require('./match.js');

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

function createPathstHash(paths, hashCode) {
    var ret = "",
        i = -1,
        l = paths.length;
    while (++i < l) {
        ret += paths[i].id + ":";
    }
    return ret;
}




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
			if( undefined == key || 'undefined' == key ) {
				throw new Error('invalid context, value has undefined alias');   
			 }
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


