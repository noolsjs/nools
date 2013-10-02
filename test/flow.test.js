"use strict";
var it = require("it"),
    declare = require("declare.js"),
    assert = require("assert"),
    nools = require("../index");

it.describe("nools", function (it) {
    it.describe(".flow", function (it) {
        it.should("create a flow", function () {
            var flow = nools.flow("nools flow");
            assert.isNotNull(flow);
            assert.instanceOf(flow, nools.Flow);
            assert.equal("nools flow", flow.name);
            assert.equal(nools.getFlow("nools flow"), flow);
        });
    });

    it.describe(".deleteFlow", function (it) {
        it.should("delete a flow by name", function () {
            var flow = nools.flow("delete nools flow");
            assert.isNotNull(flow);
            assert.instanceOf(flow, nools.Flow);
            assert.equal("delete nools flow", flow.name);
            assert.equal(nools.getFlow("delete nools flow"), flow);

            assert.equal(nools.deleteFlow("delete nools flow"), nools);
            assert.isUndefined(nools.getFlow("delete nools flow"));

        });

        it.should("delete a flow using a Flow instance", function () {
            var flow = nools.flow("delete nools flow");
            assert.isNotNull(flow);
            assert.instanceOf(flow, nools.Flow);
            assert.equal("delete nools flow", flow.name);
            assert.equal(nools.getFlow("delete nools flow"), flow);

            assert.equal(nools.deleteFlow(flow), nools);
            assert.isUndefined(nools.getFlow("delete nools flow"));

        });
    });

    it.describe(".hasFlow", function (it) {

        it.should("return true if the flow exists", function () {
            var name = "has flow",
                flow = nools.flow(name);
            assert.isTrue(nools.hasFlow(name));
        });

        it.should("return false if the flow does not exists", function () {
            assert.isFalse(nools.hasFlow(new Date().toString()));
        });
    });

    it.describe(".deleteFlows", function (it) {

        it.should("deleteAllFlows", function () {
            var name = "delete nools flows";
            nools.flow(name);
            assert.isTrue(nools.hasFlow(name));
            assert.equal(nools.deleteFlows(), nools);
            assert.isFalse(nools.hasFlow(name));
        });

    });
});

it.describe("Flow", function (it) {

    it.describe("#rule", function (it) {
        var called = 0;
        var flow = nools.flow("test flow");
        it.should("create a rule", function () {
            flow.rule("test rule", [String, "s", "s == 'hello'"], function () {
                called++;
            });
            assert.isTrue(flow.containsRule("test rule"));
        });

        it.should("create a rule with joins properly", function () {
            flow.rule("test rule2", [
                [String, "s", "s == 'hello'"],
                [String, "s2", "s2 == 'world'"],
                [String, "s3", "s3 == 'Hi'"]
            ], function () {
                called++;
            });
            assert.isTrue(flow.containsRule("test rule2"));
        });

        it.should("create a rules that are dependent on eachother properly", function () {
            flow.rule("test rule3", [
                [String, "s", "s == 'hello'"],
                [String, "s2", "s2 == 'world'"],
                [String, "s3", "s3 == 'Hi'"]
            ], function () {
                called++;
            });
            assert.isTrue(flow.containsRule("test rule3"));

            flow.rule("test rule4", [
                [String, "s1"],
                [String, "s2", "s2 == 'world' && s1 == 'hello' "],
                [String, "s3", "s3 == 'Hi'"],
                [String, "s4", "s4 == 'what'"],
                [String, "s5", "s5 == 'for'"]
            ], function () {
                called++;
            });
            assert.isTrue(flow.containsRule("test rule4"));
        });

    });

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

    it.describe("errors", function (it) {

        var HelloFact = declare({
            instance: {
                value: true
            }
        });

        var flow = nools.flow("error flow", function (flow) {
            flow.rule("hello rule", [HelloFact, "h"], function () {
                throw new Error("thrown error");
            });
        });

        it.should("handle errors", function () {
            var session = flow.getSession();
            session.assert(new HelloFact());
            return session.match().then(assert.fail, function () {
                assert.ok(true);
            });
        });

    });

    it.describe("not rule", function (it) {

        it.describe("with a single fact", function (it) {
            var called = 0;

            var flow = nools.flow("notRuleSingleFact", function (flow) {
                flow.rule("hello rule", ["not", String, "s", "s == 'hello'"], function () {
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
                flow.getSession("hello").match().then(function () {
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
                    ["not", Number, "n2", "n1 > n2"]
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

    });

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

    });

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

    it.describe("agenda-groups", function (it) {

        function Message(name) {
            this.name = name;
        }

        var flow = nools.flow("agendGroups", function () {
                this.rule("Hello World", {agendaGroup: "ag1"}, [Message, "m", "m.name == 'hello'"], function (facts) {
                    this.modify(facts.m, function () {
                        this.name = "goodbye";
                    });
                });

                this.rule("Hello World 2", {agendaGroup: "ag2"}, [Message, "m", "m.name == 'hello'"], function (facts) {
                    this.modify(facts.m, function () {
                        this.name = "goodbye";
                    });
                });

                this.rule("GoodBye", {agendaGroup: "ag1"}, [Message, "m", "m.name == 'goodbye'"], function (facts) {
                    //noop
                });

                this.rule("GoodBye 2", {agendaGroup: "ag2"}, [Message, "m", "m.name == 'goodbye'"], function (facts) {
                    //noop
                });
            }),
            session;

        it.beforeEach(function () {
            session = flow.getSession();
        });

        it.should("only fire events in focused group", function () {
            var events = [];
            session.assert(new Message("hello"));
            session.focus("ag1");
            session.on("fire", function (name) {
                events.push(name);
            });
            return session.match()
                .then(function () {
                    assert.deepEqual(events, ["Hello World", "GoodBye"]);
                    events = [];
                    session = flow.getSession();
                    session.assert(new Message("hello"));
                    session.focus("ag2");
                    session.on("fire", function (name) {
                        events.push(name);
                    });
                    return session.match().then(function () {
                        assert.deepEqual(events, ["Hello World 2", "GoodBye 2"]);
                    });
                });
        });

        it.should("should treat focus like a stack", function () {
            var events = [];
            session.assert(new Message("hello"));
            session.focus("ag2");
            session.focus("ag1");
            session.on("fire", function (name) {
                events.push(name);
            });
            return session.match()
                .then(function () {
                    assert.deepEqual(events, ["Hello World", "GoodBye", "GoodBye 2"]);
                    events = [];
                    session = flow.getSession();
                    session.assert(new Message("hello"));
                    session.focus("ag1");
                    session.focus("ag2");
                    session.on("fire", function (name) {
                        events.push(name);
                    });
                    return session.match().then(function () {
                        assert.deepEqual(events, ["Hello World 2", "GoodBye 2", "GoodBye"]);
                    });
                });
        });
    });

    it.describe("auto-focus", function (it) {
        /*jshint indent*/
        function State(name, state) {
            this.name = name;
            this.state = state;
        }

        var flow = nools.flow("autoFocus", function () {

                this.rule("Bootstrap", [State, "a", "a.name == 'A' && a.state == 'NOT_RUN'"], function (facts) {
                    this.modify(facts.a, function () {
                        this.state = 'FINISHED';
                    });
                });

                this.rule("A to B",
                    [
                        [State, "a", "a.name == 'A' && a.state == 'FINISHED'"],
                        [State, "b", "b.name == 'B' && b.state == 'NOT_RUN'"]
                    ],
                    function (facts) {
                        this.modify(facts.b, function () {
                            this.state = "FINISHED";
                        });
                    });

                this.rule("B to C",
                    {agendaGroup: "B to C", autoFocus: true},
                    [
                        [State, "b", "b.name == 'B' && b.state == 'FINISHED'"],
                        [State, "c", "c.name == 'C' && c.state == 'NOT_RUN'"]
                    ],
                    function (facts) {
                        this.modify(facts.c, function () {
                            this.state = 'FINISHED';
                        });
                        this.focus("B to D");
                    });

                this.rule("B to D",
                    {agendaGroup: "B to D"},
                    [
                        [State, "b", "b.name == 'B' && b.state == 'FINISHED'"],
                        [State, "d", "d.name == 'D' && d.state == 'NOT_RUN'"]
                    ],
                    function (facts) {
                        this.modify(facts.d, function () {
                            this.state = 'FINISHED';
                        });
                    });
            }),
            session;

        it.beforeEach(function () {
            session = flow.getSession();
        });

        it.should("activate agenda groups in proper order", function () {
            session.assert(new State("A", "NOT_RUN"));
            session.assert(new State("B", "NOT_RUN"));
            session.assert(new State("C", "NOT_RUN"));
            session.assert(new State("D", "NOT_RUN"));
            var fired = [];
            session.on("fire", function (name) {
                fired.push(name);
            });
            return session.match().then(function () {
                assert.deepEqual(fired, ["Bootstrap", "A to B", "B to C", "B to D"]);
            });
        });
    });

    it.describe("salience", function (it) {
        /*jshint indent*/
        function Message(name) {
            this.name = name;
        }

        var flow1 = nools.flow("salience1", function () {

                this.rule("Hello4", {salience: 7}, [Message, "m", "m.name == 'Hello'"], function (facts) {
                });

                this.rule("Hello3", {salience: 8}, [Message, "m", "m.name == 'Hello'"], function (facts) {
                });

                this.rule("Hello2", {salience: 9}, [Message, "m", "m.name == 'Hello'"], function (facts) {
                });

                this.rule("Hello1", {salience: 10}, [Message, "m", "m.name == 'Hello'"], function (facts) {
                });
            }),
            flow2 = nools.flow("salience2", function () {

                this.rule("Hello4", {salience: 10}, [Message, "m", "m.name == 'Hello'"], function (facts) {
                });

                this.rule("Hello3", {salience: 9}, [Message, "m", "m.name == 'Hello'"], function (facts) {
                });

                this.rule("Hello2", {salience: 8}, [Message, "m", "m.name == 'Hello'"], function (facts) {
                });

                this.rule("Hello1", {salience: 7}, [Message, "m", "m.name == 'Hello'"], function (facts) {
                });
            });


        it.should("activate in the proper order", function () {
            var fired1 = [], fired2 = [];
            var session1 = flow1.getSession(new Message("Hello")).on("fire", function (name) {
                    fired1.push(name);
                }),
                session2 = flow2.getSession(new Message("Hello")).on("fire", function (name) {
                    fired2.push(name);
                });
            return session1.match()
                .then(function () {
                    return session2.match();
                })
                .then(function () {
                    assert.deepEqual(fired1, ["Hello1", "Hello2", "Hello3", "Hello4"]);
                    assert.deepEqual(fired2, ["Hello4", "Hello3", "Hello2", "Hello1"]);
                });
        });
    });

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
                    debugger;
                    fired.push(name);
                });
            return session.match().then(function () {
                assert.deepEqual(fired, ["Goodbye", "Hello"]);
            })
        });

    });

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

    it.describe("fibonacci", function (it) {

        var Fibonacci = declare({
            instance: {
                constructor: function (sequence, value) {
                    this.sequence = sequence;
                    this.value = value || -1;
                }
            }
        });
        var result = null;
        var flow = nools.flow("Fibonacci Flow", function (flow) {

            flow.rule("Recurse", [
                ["not", Fibonacci, "nf", "nf.sequence == 1"],
                [Fibonacci, "f", "f.value == -1"]
            ], function (facts) {
                var f2 = new Fibonacci(facts.f.sequence - 1);
                this.assert(f2);
            });

            flow.rule("Bootstrap", [Fibonacci, "f", "f.value == -1 && (f.sequence == 1 || f.sequence == 2)"], function (facts, flow) {
                this.modify(facts.f, function () {
                    this.value = 1;
                });
            });

            flow.rule("Calculate", [
                [Fibonacci, "f1", "f1.value != -1", {sequence: "s1"}],
                [Fibonacci, "f2", "f2.value != -1 && f2.sequence == s1 + 1", {sequence: "s2"}],
                [Fibonacci, "f3", "f3.value == -1 && f3.sequence == s2 + 1"]
            ], function (facts) {
                facts.f3.value = facts.f1.value + facts.f2.value;
                result = facts.f3.value;
                this.modify(facts.f3);
            });
        });


        it.afterEach(function () {
            result = [];
        });


        it.should("calculate fibonacci 3", function () {
            return flow.getSession(new Fibonacci(3)).match()
                .then(function () {
                    assert.equal(result, 2);
                });
        });

        it.should("calculate fibonacci 4", function () {
            return flow.getSession(new Fibonacci(4)).match().then(function () {
                assert.equal(result, 3);
            });
        });

        it.should("calculate fibonacci 5", function () {
            return flow.getSession(new Fibonacci(5)).match()
                .then(function () {
                    assert.equal(result, 5);
                });
        });

        it.should("calculate fibonacci 6", function () {
            return flow.getSession(new Fibonacci(6)).match()
                .then(function () {
                    assert.equal(result, 8);
                });
        });

    });

    it.describe("diagnosis", function (it) {

        var Patient = declare({
            instance: {
                constructor: function (name, fever, spots, rash, soreThroat, innoculated) {
                    this.name = name;
                    this.fever = fever;
                    this.spots = spots;
                    this.rash = rash;
                    this.soreThroat = soreThroat;
                    this.innoculated = innoculated;
                }
            }
        });

        var Diagnosis = declare({
            instance: {
                constructor: function (name, diagnosis) {
                    this.name = name;
                    this.diagnosis = diagnosis;
                }
            }
        });

        var Treatment = declare({
            instance: {
                constructor: function (name, treatment) {
                    this.name = name;
                    this.treatment = treatment;
                }
            }
        });

        var results = [];
        var flow = nools.flow("Diagnosis", function (flow) {

            flow.rule("Measels", [
                [Patient, "p", "p.fever == 'high' && p.spots == true && p.innoculated == true", {name: "n"}],
                ["not", Diagnosis, "d", "d.name == n && d.diagnosis == 'allergy'"]
            ],
                function (facts) {
                    var name = facts.n;
                    this.assert(new Diagnosis(name, "measles"));
                });

            flow.rule("Allergy1", [
                [Patient, "p", "p.spots == true", {name: "n"}],
                ["not", Diagnosis, "d", "d.name == n && d.diagnosis == 'measles'"]
            ], function (facts) {
                var name = facts.n;
                this.assert(new Diagnosis(name, "allergy"));
            });

            flow.rule("Allergy2", [Patient, "p", "p.rash == true", {name: "n"}], function (facts) {
                var name = facts.n;
                this.assert(new Diagnosis(name, "allergy"));
            });

            flow.rule("Flu", [Patient, "p", "p.soreThroat == true && p.fever in ['mild', 'high']", {name: "n"}], function (facts) {
                var name = facts.n;
                this.assert(new Diagnosis(name, "flu"));
            });

            flow.rule("Penicillin", [Diagnosis, "d", "d.diagnosis == 'measles'", {name: "n"}], function (facts) {
                var name = facts.n;
                this.assert(new Treatment(name, "penicillin"));
            });

            flow.rule("Allergy Pills", [Diagnosis, "d", "d.diagnosis == 'allergy'", {name: "n"}], function (facts) {
                var name = facts.n;
                this.assert(new Treatment(name, "allegryShot"));
            });

            flow.rule("Bed Rest", [Diagnosis, "d", "d.diagnosis == 'flu'", {name: "n"}], function (facts) {
                var name = facts.n;
                this.assert(new Treatment(name, "bedRest"));
            });

            flow.rule("Collect", [Treatment, "t"], function (facts) {
                results.push(facts.t);
            });

        });

        it.afterEach(function () {
            results = [];
        });

        it.should("treat properly", function () {
            var session = flow.getSession();
            session.assert(new Patient("Fred", "none", true, false, false, false));
            session.assert(new Patient("Joe", "high", false, false, true, false));
            session.assert(new Patient("Bob", "high", true, false, false, true));
            session.assert(new Patient("Tom", "none", false, true, false, false));
            return session.match().then(function () {
                session.dispose();
                assert.deepEqual(results, [
                    {"name": "Tom", "treatment": "allegryShot"},
                    {"name": "Bob", "treatment": "penicillin"},
                    {"name": "Joe", "treatment": "bedRest"},
                    {"name": "Fred", "treatment": "allegryShot"}
                ]);
            });
        });

    });

});