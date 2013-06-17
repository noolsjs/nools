"use strict";
var declare = require("declare.js");


var id = 0;

var Fact = declare({

    instance: {
        constructor: function (obj) {
            this.object = obj;
            this.recency = 0;
            this.id = id++;
        },

        equals: function (fact) {
            return fact === this.object;
        },

        hashCode: function () {
            return this.id;
        }
    }

});

declare({

    instance: {

        constructor: function () {
            this.recency = 0;
            this.facts = [];
        },

        dispose: function () {
            this.facts.length = 0;
        },

        assertFact: function (fact) {
            fact = new Fact(fact);
            fact.recency = this.recency++;
            this.facts.push(fact);
            return fact;
        },

        retractFact: function (fact) {
            var facts = this.facts, l = facts.length, i = -1, existingFact;
            while (++i < l) {
                existingFact = facts[i];
                if (existingFact.equals(fact)) {
                    this.facts.splice(i, 1);
                    return existingFact;
                }
            }
            //if we made it here we did not find the fact
            throw new Error("the fact to remove does not exist");


        }
    }

}).as(exports, "WorkingMemory");

