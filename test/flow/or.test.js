"use strict";
var it = require("it"),
    assert = require("assert"),
    nools = require("../../");

it.describe("or rule", function (it) {

    var Count = function () {
        this.called = 0;
    }, called = new Count();

    it.describe("or rule with two conditions of the same type", function (it) {
        var flow;
        it.beforeAll(function () {
            flow = nools.flow("or condition", function (flow) {
                flow.rule("hello rule", [
                    ["or",
                        [String, "s", "s == 'hello'"],
                        [String, "s", "s == 'world'"]
                    ],
                    [Count, "called", null]
                ], function (facts) {
                    facts.called.called++;
                });
            });
        });

        it.should("should match if one constraints matches", function () {
            return flow.getSession("world", called).match().then(function () {
                assert.equal(called.called, 1);
                called.called = 0;
                return flow.getSession("hello", called).match().then(function () {
                    assert.equal(called.called, 1);
                });
            });
        });

        it.should("not call when a a constraint does not match", function () {
            called.called = 0;
            return flow.getSession("hello", "world", "test", called).match().then(function () {
                assert.equal(called.called, 2);
            });
        });
    });

    it.describe("or rule with three conditions", function (it) {
        var flow;

        it.beforeAll(function () {
            flow = nools.flow("or condition three constraints", function (flow) {
                flow.rule("hello rule", [
                    ["or",
                        [String, "s", "s == 'hello'"],
                        [String, "s", "s == 'world'"],
                        [String, "s", "s == 'hello world'"]
                    ],
                    [Count, "called", null]
                ], function (facts) {
                    facts.called.called++;
                });
            });
        });

        it.should("should match if one constraints matches", function () {
            called.called = 0;
            return flow.getSession("world", called).match().then(function () {
                assert.equal(called.called, 1);
                called.called = 0;
                return flow.getSession("hello", called).match().then(function () {
                    assert.equal(called.called, 1);
                    called.called = 0;
                    return flow.getSession("hello world", called).match().then(function () {
                        assert.equal(called.called, 1);
                    });
                });
            });
        });

        it.should("not call when none constraints match", function () {
            called.called = 0;
            return flow.getSession("hello", "world", "hello world", "test", called).match().then(function () {
                assert.equal(called.called, 3);
            });
        });

    });

    it.describe("or rule with different types", function (it) {
        var flow;

        it.beforeAll(function () {
            flow = nools.flow("or condition different types", function (flow) {
                flow.rule("hello rule", [
                    ["or",
                        [String, "s", "s == 'hello'"],
                        [String, "s", "s == 'world'"],
                        [Number, "n", "n == 1"]
                    ],
                    [Count, "called", null]
                ], function (facts) {
                    facts.called.called++;
                });
            });
        });

        it.should("should match if one constraints matches", function () {
            called.called = 0;
            return flow.getSession("world", called).match().then(function () {
                assert.equal(called.called, 1);
                called.called = 0;
                return flow.getSession("hello", called).match().then(function () {
                    assert.equal(called.called, 1);
                    called.called = 0;
                    return flow.getSession(1, called).match().then(function () {
                        assert.equal(called.called, 1);
                    });
                });
            });
        });

        it.should("not call when none constraints match", function () {
            called.called = 0;
            return flow.getSession("hello", "world", 1, "test", called).match().then(function () {
                assert.equal(called.called, 3);
            });
        });

    });

    it.describe("or with not conditions", function (it) {
        var flow;
        it.beforeAll(function () {
            flow = nools.flow("or condition with not conditions", function (flow) {
                flow.rule("hello rule", [
                    ["or",
                        ["not", Number, "n1", "n1 == 1"],
                        ["not", String, "s1", "s1 == 'hello'"],
                        ["not", Date, "d1", "d1.getDate() == now().getDate()"]
                    ],
                    [Count, "called", null]
                ], function (facts) {
                    facts.called.called++;
                });
            });
        });

        it.should("activate for each fact that does not exist", function () {
            var count = new Count();
            return flow.getSession(count).match(2, 'world')
                .then(function () {
                    assert.equal(count.called, 3);
                    count.called = 0;
                    return flow.getSession(count, 1).match();
                })
                .then(function () {
                    assert.equal(count.called, 2);
                    count.called = 0;
                    return flow.getSession(count, 'hello').match();
                })
                .then(function () {
                    assert.equal(count.called, 2);
                    count.called = 0;
                    return flow.getSession(count, new Date()).match();
                })
                .then(function () {
                    assert.equal(count.called, 2);
                    count.called = 0;
                    return flow.getSession(count, 1, 'hello', new Date()).match();
                })
                .then(function () {
                    assert.equal(count.called, 0);
                });
        });
    });

});