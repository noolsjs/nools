"use strict";
var it = require("it"),
    assert = require("assert"),
    nools = require("../../");

it.describe("events", function (it) {

    it.timeout(1000);

    function Message(m) {
        this.message = m;
    }

    var session, flow = nools.flow("Simple", function (flow) {
        flow.rule("Hello", [Message, "m", "m.message =~ /^hello(\\s*world)?$/"], function (facts) {
            this.modify(facts.m, function () {
                this.message += " goodbye";
            });
        });

        flow.rule("Goodbye", [Message, "m", "m.message =~ /.*goodbye$/"], function () {
        });

    });

    it.beforeEach(function () {
        session = flow.getSession();
    });

    it.should("emit when facts are asserted", function (next) {
        var m = new Message("hello");
        session.once("assert", function (fact) {
            assert.deepEqual(fact, m);
            next();
        });
        session.assert(m);
    });

    it.should("emit when facts are retracted", function (next) {
        var m = new Message("hello");
        session.once("retract", function (fact) {
            assert.deepEqual(fact, m);
            next();
        });
        session.assert(m);
        session.retract(m);
    });

    it.should("emit when facts are modified", function (next) {
        var m = new Message("hello");
        session.once("modify", function (fact) {
            assert.deepEqual(fact, m);
            next();
        });
        session.assert(m);
        session.modify(m);
    });

    it.should("emit when rules are fired", function (next) {
        var m = new Message("hello");
        var fire = [
            ["Hello", "hello"],
            ["Goodbye", "hello goodbye"]
        ], i = 0;
        session.on("fire", function (name, facts) {
            assert.equal(name, fire[i][0]);
            assert.equal(facts.m.message, fire[i++][1]);
        });
        session.assert(m);
        session.match(function () {
            assert.equal(i, fire.length);
            next();
        });

    });

});