"use strict";
var declare = require("declare.js"),
    LinkedList = require("./linkedList"),
    id = 0;

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
            this.facts = new LinkedList();
        },

        dispose: function () {
            this.facts.clear();
        },

        getFactHandle: function (o) {
            var head = {next: this.facts.head}, ret;
            while ((head = head.next)) {
                var existingFact = head.data;
                if (existingFact.equals(o)) {
                    ret = existingFact;
                    break;
                }
            }
            if (!ret) {
                ret = new Fact(o);
                ret.recency = this.recency++;
                this.facts.push(ret);
            }
            return ret;
        },

        modifyFact: function (fact) {
            var head = {next: this.facts.head};
            while ((head = head.next)) {
                var existingFact = head.data;
                if (existingFact.equals(fact)) {
                    existingFact.recency = this.recency++;
                    return existingFact;
                }
            }
            //if we made it here we did not find the fact
            throw new Error("the fact to modify does not exist");
        },

        assertFact: function (fact) {
            var ret =  this.getFactHandle(fact);
            ret.recency = this.recency++;
            return ret;
//            var head = {next: this.facts.head}, ret;
//            while ((head = head.next)) {
//                var existingFact = head.data;
//                if (existingFact.equals(fact)) {
//                    ret = existingFact;
//                    break;
//                }
//            }
//            if (!ret) {
//                ret = new Fact(fact);
//                ret.recency = this.recency++;
//                this.facts.push(ret);
//            }
//            return ret;
        },

        retractFact: function (fact) {
            var facts = this.facts, head = {next: facts.head};
            while ((head = head.next)) {
                var existingFact = head.data;
                if (existingFact.equals(fact)) {
                    facts.remove(head);
                    return existingFact;
                }
            }
            //if we made it here we did not find the fact
            throw new Error("the fact to remove does not exist");


        }
    }

}).as(exports, "WorkingMemory");

