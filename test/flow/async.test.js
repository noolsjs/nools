"use strict";
var it = require("it"),
    nools = require("../../"),
    assert = require("assert");

it.describe("async actions", function (it) {

    var flow;

    it.timeout(2000);

    function Message(m) {
        this.message = m;
    }


    it.beforeAll(function () {
        flow = nools.flow("async flow", function () {
            this.rule("Hello", [Message, "m", "m.message == 'hello'"], function (facts, engine, next) {
                setTimeout(function () {
                    next();
                }, 500);
            });

            this.rule("Goodbye", [Message, "m", "m.message == 'hello goodbye'"], function (facts, engine, next) {
                setTimeout(function () {
                    next();
                }, 500);
            });

        });
    });

    it.should("fire all rules", function () {
        var fired = [];
        var session = flow.getSession(new Message("hello"), new Message("hello goodbye"))
            .on("fire", function (name) {
                fired.push(name);
            });
        return session.match().then(function () {
            assert.deepEqual(fired, ["Goodbye", "Hello"]);
        })
    });

});