"use strict";
var it = require("it"),
    nools = require("../../"),
    assert = require("assert");

it.describe("#matchHalt", function (it) {

    function Count(c) {
        this.count = c;
    }

    var session, flow = nools.flow("Match with halt Flow", function (flow) {

        flow.rule("Stop", [Count, "c", "c.count == 6"], function () {
            this.halt();
        });

        flow.rule("Inc", [Count, "c"], function (facts) {
            facts.c.count++;
            this.modify(facts.c);
        });

    });

    it.beforeEach(function () {
        session = flow.getSession(new Count(0));
    });

    it.should("stop match with halt", function () {
        return session.match().then(function (err) {
            assert.isUndefinedOrNull(err);
            assert.equal(session.getFacts(Count)[0].count, 6);
        });

    });
});