"use strict";
var it = require("it"),
    nools = require("../../"),
    assert = require("assert");

it.describe("#matchUntilHalt", function (it) {
    function Message(m) {
        this.message = m;
    }

    function Count(c) {
        this.count = c;
    }

    var session, flow = nools.flow("Halt Flow", function (flow) {

        flow.rule("Stop", [Count, "c", "c.count == 6"], function () {
            this.halt();
        });

        flow.rule("Hello", [
            [Count, "c"],
            [Message, "m", "m.message =~ /^hello(\\s*world)?$/"]
        ], function (facts) {
            this.modify(facts.m, function () {
                this.message += " goodbye";
            });
            this.modify(facts.c, function () {
                this.count++;
            });
        });

        flow.rule("Goodbye", [
            [Count, "c"],
            [Message, "m", "m.message =~ /.*goodbye$/"]
        ], function (facts) {
            this.retract(facts.m);
            this.modify(facts.c, function () {
                this.count++;
            });
        });

    });

    it.beforeEach(function () {
        session = flow.getSession();
    });

    it.should("match until halt is called", function () {
        var count = 0, called = new Count(0);
        var interval = setInterval(function () {
            if (count++ >= 3) {
                clearInterval(interval);
            } else {
                session.assert(new Message("hello"));
            }
        }, 50);
        session.assert(called);
        return session.matchUntilHalt().then(function (err) {
            assert.isUndefinedOrNull(err);
            assert.equal(called.count, 6);
        });

    });
});