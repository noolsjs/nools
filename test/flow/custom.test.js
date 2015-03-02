"use strict";
var it = require("it"),
    assert = require("assert"),
    declare = require("declare.js"),
    nools = require("../../");
it.describe("custom contraint rule", function (it) {

    var called = 0;
    var HelloFact = declare({
        instance: {
            value: true,
            constructor: function (value) {
                this.value = value;
            }
        }
    });

    var flow = nools.flow("custom contraint", function (flow) {
        flow.rule("hello rule", [HelloFact, "h", function (facts) {
            return !!facts.h.value;
        }], function () {
            called++;
        });
    });

    it.should("call hello world rule", function () {
        var session = flow.getSession();
        session.assert(new HelloFact(false));
        session.assert(new HelloFact(true));
        return session.match().then(function () {
            assert.equal(called, 1);
        });
    });

});