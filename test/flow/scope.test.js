"use strict";
var it = require("it"),
    assert = require("assert"),
    nools = require("../../");

it.describe("scope option", function (it) {

    function isEqualTo(str, eq) {
        return str === eq;
    }

    var Count = function () {
        this.called = 0;
    }, called = new Count();

    var flow = nools.flow("scope test", function (flow) {
        flow.rule("hello rule", {scope: {isEqualTo: isEqualTo}}, [
            ["or",
                [String, "s", "isEqualTo(s, 'hello')"],
                [String, "s", "isEqualTo(s, 'world')"]
            ],
            [Count, "called", null]
        ], function (facts) {
            facts.called.called++;
        });
    });

    it.should("call when a string equals 'hello'", function () {
        return flow.getSession("world", called).match().then(function () {
            assert.equal(called.called, 1);
        });
    });

    it.should("call when a string equals 'world'", function () {
        called = new Count();
        return flow.getSession("hello", called).match().then(function () {
            assert.equal(called.called, 1);
        });
    });

    it.should(" not call when a string that does equal 'hello' or 'world", function () {
        called = new Count();
        return flow.getSession("hello", "world", "test", called).match().then(function () {
            assert.equal(called.called, 2);
        });

    });

});