"use strict";
var it = require("it"),
    assert = require("assert"),
    declare = require("declare.js"),
    nools = require("../../");
it.describe("flow#getFacts", function (it) {

    var called = 0;
    var HelloFact = declare({
        instance: {
            value: true
        }
    });

    var flow = nools.flow("facts() flow", function (flow) {
        flow.rule("hello rule", [
            [HelloFact, "h"],
            [String, "s"],
            [Number, "n"],
            [Object, "o"],
            [Boolean, "b"]
        ], function () {
            called++;
        });
    });

    it.should("get all facts in the session", function () {
        var session = flow.getSession();
        var facts = [new HelloFact(), "Hello", 1, {}, true], i = -1, l = facts.length;
        while (++i < l) {
            session.assert(facts[i]);
        }
        assert.deepEqual(session.getFacts(), facts);
    });

    it.should("get all facts in the session by Type", function () {
        var session = flow.getSession();
        var facts = [new HelloFact(), "Hello", 1, {}, true], i = -1, l = facts.length;
        while (++i < l) {
            session.assert(facts[i]);
        }
        assert.deepEqual(session.getFacts(HelloFact), [facts[0]]);
        assert.deepEqual(session.getFacts(String), [facts[1]]);
        assert.deepEqual(session.getFacts(Number), [facts[2]]);
        assert.deepEqual(session.getFacts(Object), [facts[0], facts[3]]);
        assert.deepEqual(session.getFacts(Boolean), [facts[4]]);
    });

});