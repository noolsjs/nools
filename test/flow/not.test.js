"use strict";
var it = require("it"),
    assert = require("assert"),
    nools = require("../../");

it.describe("not rule", function (it) {

    it.describe("with a single fact", function (it) {
        var called = 0;

        var flow = nools.flow("notRuleSingleFact", function (flow) {
            flow.rule("hello rule", ["not", String, "s", "s == 'hello'"], function (facts) {
                assert.isUndefined(facts.s);
                called++;
            });
        });

        it.should("call when a string that does not equal 'hello'", function () {
            return flow.getSession("world").match().then(function () {
                assert.equal(called, 1);
            });
        });

        it.should(" not call when a string that does equal 'hello'", function () {
            called = 0;
            return flow.getSession("hello").match().then(function () {
                assert.equal(called, 0);
            });
        });

        it.should(" not call when a string that does equal 'hello' and one that does not", function () {
            called = 0;
            return flow.getSession("hello", "world").match().then(function () {
                assert.equal(called, 0);
            });
        });

    });

    it.describe("with multiple facts", function (it) {
        var called = 0, arr = [];
        var flow1 = nools.flow("notRuleMultiFact", function (flow) {
            flow.rule("order rule", [
                [Number, "n1"],
                ["not", Number, "n2", "n1 != n2 && n1 > n2"]
            ], function (facts, flow) {
                arr.push(facts.n1);
                flow.retract(facts.n1);
                called++;
            });
        });

        var flow2 = nools.flow("notRuleMultiFact2", function (flow) {
            flow.rule("order rule reverse", [
                [Number, "n1"],
                ["not", Number, "n2", "n1 < n2"]
            ], function (facts, flow) {
                arr.push(facts.n1);
                flow.retract(facts.n1);
                called++;
            });
        });

        it.should("fire rules in order", function () {
            return flow1.getSession(3, 1, 5, 2, 4).match().then(function () {
                assert.deepEqual(arr, [1, 2, 3, 4, 5]);
                assert.equal(called, 5);
            }).then(function () {
                    arr = [], called = 0;
                    return flow2.getSession(4, 2, 5, 1, 3).match().then(function () {
                        assert.deepEqual(arr, [5, 4, 3, 2, 1]);
                        assert.equal(called, 5);
                    });
                });
        });
    });

    it.describe("modifying facts", function (it) {
        var called = 0, arr = [];

        function Num(num) {
            this.value = num;
        }

        var flow1 = nools.flow("notRuleModifyFact", function (flow) {
            flow.rule("not rule", [
                [Num, "n1"],
                ["not", Num, "n2", "n1 != n2 && n1.value > n2.value"]
            ], function () {
            });
        });

        it.should("handle modifications", function () {
            var num1 = new Num(1),
                num2 = new Num(2),
                num3 = new Num(3),
                num4 = new Num(4),
                num5 = new Num(5);
            var session = flow1.getSession(),
                activationTree = session.agenda.rules["not rule"].tree;

            session.assert(num1);
            session.assert(num2);
            session.assert(num3);
            session.assert(num4);
            session.assert(num5);
            var activations = activationTree.toArray();
            assert.lengthOf(activations, 1);
            assert.equal(activations[0].match.factHash.n1, num1);
            session.modify(num1, function () {
                this.value = 6;
            });
            activations = activationTree.toArray();
            assert.lengthOf(activations, 1);
            assert.equal(activations[0].match.factHash.n1, num2);
            session.modify(num2, function () {
                this.value = 7;
            });
            activations = activationTree.toArray();
            assert.lengthOf(activations, 1);
            assert.equal(activations[0].match.factHash.n1, num3);
            session.modify(num3, function () {
                this.value = 8;
            });
            activations = activationTree.toArray();
            assert.lengthOf(activations, 1);
            assert.equal(activations[0].match.factHash.n1, num4);
            session.modify(num4, function () {
                this.value = 9;
            });
            activations = activationTree.toArray();
            assert.lengthOf(activations, 1);
            assert.equal(activations[0].match.factHash.n1, num5);
            session.modify(num5, function () {
                this.value = 10;
            });
            activations = activationTree.toArray();
            assert.lengthOf(activations, 1);
            assert.equal(activations[0].match.factHash.n1, num1);

            session.retract(num1);
            activations = activationTree.toArray();
            assert.lengthOf(activations, 1);
            assert.equal(activations[0].match.factHash.n1, num2);

            session.retract(num2);
            activations = activationTree.toArray();
            assert.lengthOf(activations, 1);
            assert.equal(activations[0].match.factHash.n1, num3);

            session.retract(num3);
            activations = activationTree.toArray();
            assert.lengthOf(activations, 1);
            assert.equal(activations[0].match.factHash.n1, num4);

            session.retract(num4);
            activations = activationTree.toArray();
            assert.lengthOf(activations, 1);
            assert.equal(activations[0].match.factHash.n1, num5);

            session.retract(num5);
            activations = activationTree.toArray();
            assert.lengthOf(activations, 0);

            session.assert(num5);
            session.assert(num4);
            session.assert(num3);
            session.assert(num2);
            session.assert(num1);
            activations = activationTree.toArray();
            assert.lengthOf(activations, 1);
            assert.equal(activations[0].match.factHash.n1, num1);
            session.retract(num1);
            activations = activationTree.toArray()
            assert.lengthOf(activations, 1);
            assert.equal(activations[0].match.factHash.n1, num2);
            session.assert(num1);
            activations = activationTree.toArray()
            assert.lengthOf(activations, 1);
            assert.equal(activations[0].match.factHash.n1, num1);

        });
    });
});
