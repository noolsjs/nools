"use strict";
var it = require("it"),
    assert = require("assert"),
    nools = require("../../");

it.describe("no-loop", function (it) {
    /*jshint indent*/
    function Message(name) {
        this.name = name;
    }
    var cnt = 0;   
    
    var flow1 = nools.flow("noLoop1", function () {
        
        this.rule("Hello2", { noLoop: true }, [Message, "m", "m.name =~ /Hello/"], function (facts) {
            var m = facts.m;
            m.name = 'Hello World';
            this.modify(m);
        });
    }),
	
        flow2 = nools.flow("noLoop2", function () {
            
            this.rule("Hello1", [Message, "m", "m.name =~ /Hello/"], function (facts) {
                var m = facts.m;
                if (cnt++ < 2) {
                    m.name = 'Hello World';
                    this.modify(m);
                }
            });
        });

    var noolsSource =  "rule 'Hello3' { no-loop: true; when {m: Message m.name =~/Hello/;}then {modify(m, function () { this.name = 'Hello World'; });}}";

    var flow3 = nools.compile(noolsSource, {
        name: 'testDsl'
        ,define: {
            Message: Message
        }
    });
   
    it.should("not loop with option on and loop otherwise", function () {
        var fired1 = [], fired2 = [], fired3 = [];
        var session1 = flow1.getSession(new Message("Hello")).on("fire", function (name) {
            fired1.push(name);
        }),
        session2 = flow2.getSession(new Message("Hello")).on("fire", function (name) {
            fired2.push(name);
        }),
        session3 = flow3.getSession(new Message("Hello")).on("fire", function (name) {
            fired3.push(name);
        });
        return session1.match()
            .then(function () {
        return session2.match().then(function () {
            return session3.match().then(function () {
            })
        })
        })
       .then(function () {
            assert.deepEqual(fired1, ["Hello2"]);
            assert.deepEqual(fired2, ["Hello1", "Hello1", "Hello1"]);
            assert.deepEqual(fired3, ["Hello3"]);
        });
    });

});
