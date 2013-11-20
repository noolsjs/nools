"use strict";
var it = require("it"),
    assert = require("assert"),
    declare = require("declare.js"),
    nools = require("../../");
it.describe("simple rule", function (it) {

    var called = 0;
    var HelloFact = declare({
        instance: {
            value: true
        }
    });

    var flow = nools.flow("hello world flow", function (flow) {
        flow.rule("hello rule", [HelloFact, "h"], function () {
            called++;
        });
    });

    it.should("call hello world rule", function () {
        var session = flow.getSession();
        session.assert(new HelloFact());
        return session.match().then(function () {
            assert.equal(called, 1);
        });
    });

});