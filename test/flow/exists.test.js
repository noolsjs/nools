"use strict";
var it = require("it"),
    assert = require("assert"),
    nools = require("../../");

it.describe("exists rule", function (it) {

    var flow;

    var Count = function () {
        this.called = 0;
    }, called = new Count();

    it.describe("fact assertion", function (it) {
        it.beforeAll(function () {
            flow = nools.flow("exists flow", function () {
                this.rule("exists 1", [
                    ["exists", String, "s1"],
                    [Count, "c"]
                ], function (facts) {
                    facts.c.called++;
                });
            });
        });

        it.beforeEach(function () {
            called.called = 0;
        })

        it.should("only activate once", function () {
            return flow.getSession(called, "hello", "world", "hello world").match(function () {
                assert.equal(called.called, 1);
            });
        });

        it.should("not activate once if the fact does not exists", function () {
            return flow.getSession(called).match(function () {
                assert.equal(called.called, 0);
            });
        });

    });

    it.describe("fact retraction", function (it) {

        function Person(name) {
            this.name = name
        }

        function Str(val) {
            this.val = val;
        }

        it.beforeAll(function () {
            flow = nools.flow("exists retractions flow", function () {
                this.rule("exists 1", [
                    [Person, "p"],
                    ["exists", Str, "s1", "s1.val == p.name"],
                    [Count, "c"]
                ], function (facts) {
                        facts.c.called++;
                    }

                );
            });
        });

        it.beforeEach(function () {
            called.called = 0;
        })

        it.should("should handle fact retractions properly", function () {
            var session = flow.getSession(called);
            var activationTree = session.agenda.rules["exists 1"].tree,
                activations,
                str1 = new Str("Bob Yuko"),
                str2 = new Str("Bob Yukon"),
                person = new Person("Bob Yukon");
            session.assert(person);
            activations = activationTree.toArray();
            assert.lengthOf(activations, 0);
            session.assert(str1);
            activations = activationTree.toArray();
            assert.lengthOf(activations, 0);
            session.retract(str1);
            activations = activationTree.toArray();
            assert.lengthOf(activations, 0);
            session.assert(str2);
            activations = activationTree.toArray();
            assert.lengthOf(activations, 1);
            session.retract(str2);
            activations = activationTree.toArray();
            assert.lengthOf(activations, 0);
            session.assert(str2);
            activations = activationTree.toArray();
            assert.lengthOf(activations, 1);
            session.assert(str1);
            activations = activationTree.toArray()
            assert.lengthOf(activations, 1);
            session.retract(str1);
            activations = activationTree.toArray()
            assert.lengthOf(activations, 1);
            session.retract(str2);
            activations = activationTree.toArray()
            assert.lengthOf(activations, 0);
            session.assert(str2);
            activations = activationTree.toArray()
            assert.lengthOf(activations, 1);
            session.retract(person);
            activations = activationTree.toArray()
            assert.lengthOf(activations, 0);
        });
    });

    it.describe("fact modification", function (it) {
        function Person(name) {
            this.name = name
        }

        function Str(val) {
            this.val = val;
        }

        it.beforeAll(function () {
            flow = nools.flow("exists modification flow", function () {
                this.rule("exists 1", [
                    [Person, "p"],
                    ["exists", Str, "s1", "s1.val == p.name"],
                    [Count, "c"]
                ], function (facts) {
                        facts.c.called++;
                    }

                );
            });
        });

        it.beforeEach(function () {
            called.called = 0;
        })

        it.should("should handle fact modification properly", function () {
            var session = flow.getSession(called);
            var activationTree = session.agenda.rules["exists 1"].tree,
                activations,
                str1 = new Str("Bob Yuko"),
                str2 = new Str("Bobby Yukon"),
                person = new Person("Bob Yukon");
            session.assert(person);
            activations = activationTree.toArray()
            assert.lengthOf(activations, 0);
            session.assert(str1);
            activations = activationTree.toArray()
            assert.lengthOf(activations, 0);
            session.modify(str1, function () {
                this.val = person.name;
            });
            activations = activationTree.toArray()
            assert.lengthOf(activations, 1);
            session.modify(person, function () {
                this.name = "Bobby Yukon";
            });
            activations = activationTree.toArray()
            assert.lengthOf(activations, 0);
            session.assert(str2);
            activations = activationTree.toArray()
            assert.lengthOf(activations, 1);
        });
    });

    it.describe("with from modifier", function (it) {
        function Person(zipcodes) {
            this.zipcodes = zipcodes;
        }

        it.beforeAll(function () {
            flow = nools.flow("exists from flow", function () {
                this.rule("exists 1", [
                    [Person, "p"],
                    ["exists", Number, "zip", "zip == 11111", "from p.zipcodes"],
                    [Count, "c"]
                ], function (facts) {
                        facts.c.called++;
                    }

                );
            });
        });

        it.beforeEach(function () {
            called.called = 0;
        });

        it.describe("assert", function (it) {

            it.should("should handle fact assertion properly", function () {
                var session = flow.getSession(called);
                var activationTree = session.agenda.rules["exists 1"].tree,
                    activations,
                    person1 = new Person([88888, 99999, 77777]),
                    person2 = new Person([66666, 55555, 44444]),
                    person3 = new Person([33333, 22222, 11111]),
                    person4 = new Person([11111, 11111, 11111]);
                session.assert(person1);
                activations = activationTree.toArray()
                assert.lengthOf(activations, 0);
                session.assert(person2);
                activations = activationTree.toArray()
                assert.lengthOf(activations, 0);
                session.assert(person3);
                activations = activationTree.toArray()
                assert.lengthOf(activations, 1);
                session.assert(person4);
                activations = activationTree.toArray()
                assert.lengthOf(activations, 2);
            });
        });

        it.describe("retract", function (it) {

            it.should("should handle fact retraction properly", function () {
                var session = flow.getSession(called);
                var activationTree = session.agenda.rules["exists 1"].tree,
                    activations,
                    person1 = new Person([88888, 99999, 77777]),
                    person2 = new Person([66666, 55555, 44444]),
                    person3 = new Person([33333, 22222, 11111]),
                    person4 = new Person([11111, 11111, 11111]);
                session.assert(person1);
                activations = activationTree.toArray();
                assert.lengthOf(activations, 0);
                session.assert(person2);
                activations = activationTree.toArray();
                assert.lengthOf(activations, 0);
                session.assert(person3);
                activations = activationTree.toArray();
                assert.lengthOf(activations, 1);
                session.assert(person4);
                activations = activationTree.toArray();
                assert.lengthOf(activations, 2);
                session.retract(person3);
                activations = activationTree.toArray();
                assert.lengthOf(activations, 1);
                session.retract(person4);
                activations = activationTree.toArray();
                assert.lengthOf(activations, 0);
            });
        });

        it.describe("modify", function (it) {

            it.should("should handle fact modification properly", function () {
                var session = flow.getSession(called);
                var activationTree = session.agenda.rules["exists 1"].tree,
                    activations,
                    person1 = new Person([88888, 99999, 77777]),
                    person2 = new Person([66666, 55555, 44444]),
                    person3 = new Person([33333, 22222, 11111]),
                    person4 = new Person([11111, 11111, 11111]);
                session.assert(person1);
                activations = activationTree.toArray();
                assert.lengthOf(activations, 0);
                session.assert(person2);
                activations = activationTree.toArray();
                assert.lengthOf(activations, 0);
                session.assert(person3);
                activations = activationTree.toArray();
                assert.lengthOf(activations, 1);
                session.assert(person4);
                activations = activationTree.toArray();
                assert.lengthOf(activations, 2);
                session.modify(person3, function () {
                    this.zipcodes = [11111, 11111];
                });
                activations = activationTree.toArray();
                assert.lengthOf(activations, 2);
                session.modify(person3, function () {
                    this.zipcodes = [88888];
                });
                activations = activationTree.toArray();
                assert.lengthOf(activations, 1);
                session.modify(person4, function () {
                    this.zipcodes = [88888];
                });
                activations = activationTree.toArray();
                assert.lengthOf(activations, 0);

            });
        });
    });
});