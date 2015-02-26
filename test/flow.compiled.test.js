"use strict";
var it = require("it"),
    assert = require("assert");

it.describe("Flow compiled", function (it) {

    it.describe("not rule", function (it) {


        var called, flow;
        it.beforeAll(function () {
            flow = require("./rules/notRule-compiled")();
            called = new (flow.getDefined("count"))();
        });


        it.should("call when a string that does not equal 'hello'", function () {
            return flow.getSession("world", called).match().then(function () {
                assert.equal(called.called, 1);
            });
        });

        it.should(" not call when a string that does equal 'hello'", function () {
            called.called = 0;
            return flow.getSession("hello", called).match().then(function () {
                assert.equal(called.called, 0);
            });
        });

        it.should(" not call when a string that does equal 'hello' and one that does not", function () {
            called.called = 0;
            return flow.getSession("hello", "world", called).match().then(function () {
                assert.equal(called.called, 0);
            });
        });

    });

    it.describe("or rule", function (it) {

        var called, flow;
        it.beforeAll(function () {
            flow = require("./rules/orRule-compiled")();
            called = new (flow.getDefined("count"))();
        });


        it.should("call when a string equals 'hello'", function () {
            return flow.getSession("world", called).match().then(function () {
                assert.equal(called.called, 1);
                assert.equal(called.s, "world");
            });
        });

        it.describe("or rule with not conditions", function (it) {
            var flow, count;
            it.beforeAll(function () {
                flow = require("./rules/orRule-notConditions-compiled")();
                var Count = flow.getDefined("count");
                count = new Count();
            });

            it.should("activate for each fact that does not exist", function () {
                return flow.getSession(count).match()
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

    it.describe("exists rule", function (it) {


        var called, flow;
        it.beforeAll(function () {
            flow = require("./rules/existsRule-compiled")();
            called = new (flow.getDefined("count"))();
        });


        it.should("call when a string equals 'hello'", function () {
            return flow.getSession("hello", called).match().then(function () {
                assert.equal(called.called, 1);
            });
        });

        it.should("not call when a string that does not equal 'hello'", function () {
            called.called = 0;
            return flow.getSession("world", called).match().then(function () {
                assert.equal(called.called, 0);
            });
        });

        it.should(" call when a string that does not equal 'hello' and one that does exist", function () {
            called.called = 0;
            return flow.getSession("hello", "world", called).match().then(function () {
                assert.equal(called.called, 1);
            });
        });

    });

    it.describe("scoped functions", function (it) {
        var session, Message;
        it.beforeAll(function () {
            var flow = require("./rules/scope-compiled")();
            Message = flow.getDefined("message");
            session = flow.getSession();
        });

        it.should("call the scoped function", function (next) {
            var m = new Message("hello");
            session.once("assert", function (fact) {
                assert.deepEqual(fact, m);
                next();
            });
            session.assert(m);
        });
    });

    it.describe("events", function (it) {

        it.timeout(1000);
        var flow, Message, session;

        it.beforeAll(function () {
            flow = require("./rules/simple-compiled")();
            Message = flow.getDefined("Message");

        });

        it.beforeEach(function () {
            session = flow.getSession();
        });

        it.should("emit when facts are asserted", function (next) {
            var m = new Message("hello world");
            session.once("assert", function (fact) {
                assert.deepEqual(fact, m);
                next();
            });
            session.assert(m);
        });

        it.should("emit when facts are retracted", function (next) {
            var m = new Message("hello world");
            session.once("retract", function (fact) {
                assert.deepEqual(fact, m);
                next();
            });
            session.assert(m);
            session.retract(m);
        });

        it.should("emit when facts are modified", function (next) {
            var m = new Message("hello world");
            session.once("modify", function (fact) {
                assert.deepEqual(fact, m);
                next();
            });
            session.assert(m);
            session.modify(m);
        });

        it.should("emit when rules are fired", function (next) {
            var m = new Message("hello world");
            var fire = [
                ["Hello", "hello world"],
                ["Goodbye", "hello world goodbye"]
            ], i = 0;
            session.on("fire", function (name, facts) {
                assert.equal(name, fire[i][0]);
                assert.equal(facts.m.message, fire[i++][1]);
            });
            session.assert(m);
            session.match(function () {
                assert.equal(i, 2);
                next();
            });

        });

    });

    it.describe("agenda-groups", function (it) {
        var flow = require("./rules/agenda-group-compiled")(),
            Message = flow.getDefined("message"),
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
        var flow = require("./rules/auto-focus-compiled")(),
            State = flow.getDefined("state"),
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

    it.describe("defined objects", function (it) {

        var flow, Point, Line, session;
        it.beforeAll(function () {
            flow = require("./rules/defined-compiled")();
            Point = flow.getDefined("point");
            Line = flow.getDefined("line");
        });

        it.beforeEach(function () {
            session = flow.getSession();
        });

        it.should("allow creating a new defined object", function () {
            var point = new Point(1, 2);
            assert.equal(point.x, 1);
            assert.equal(point.y, 2);
        });

        it("defined classes should have other classes in scope", function () {
            var line = new Line();
            line.addPointFromDefined(1, 2);
            assert.lengthOf(line.points, 1);
            var point = line.points[0];
            assert.instanceOf(point, Point);
            assert.equal(point.x, 1);
            assert.equal(point.y, 2);
        });

        it("defined classes should have access to functions in scope", function () {
            var line = new Line();
            line.addPointWithScope(1, 2);
            assert.lengthOf(line.points, 1);
            var point = line.points[0];
            assert.instanceOf(point, Point);
            assert.equal(point.x, 1);
            assert.equal(point.y, 2);
        });

    });


    it.describe("fibonacci nools dsl", function (it) {

        var flow, Fibonacci, Result;
        it.beforeAll(function () {
            flow = require("./rules/fibonacci-compiled")();
            Fibonacci = flow.getDefined("fibonacci");
            Result = flow.getDefined("result");
        });

        it.should("calculate fibonacci 3", function () {
            var result = new Result();
            return flow.getSession(new Fibonacci(3), result).match()
                .then(function () {
                    assert.equal(result.value, 2);
                });
        });

        it.should("calculate fibonacci 4", function () {
            var result = new Result();
            return flow.getSession(new Fibonacci(4), result).match().then(function () {
                assert.equal(result.value, 3);
            });
        });

        it.should("calculate fibonacci 5", function () {
            var result = new Result();
            return flow.getSession(new Fibonacci(5), result).match()
                .then(function () {
                    assert.equal(result.value, 5);
                });
        });

        it.should("calculate fibonacci 6", function () {
            var result = new Result();
            return flow.getSession(new Fibonacci(6), result).match()
                .then(function () {
                    assert.equal(result.value, 8);
                });
        });

    });

    it.describe("diagnosis using dsl", function (it) {

        var flow, Patient;

        it.beforeAll(function () {
            flow = require("./rules/diagnosis-compiled")();
            Patient = flow.getDefined("patient");
        });


        it.should("treat properly", function () {
            var session = flow.getSession();
            var results = [];
            session.assert(new Patient({name: "Fred", fever: "none", spots: true, rash: false, soreThroat: false, innoculated: false}));
            session.assert(new Patient({name: "Joe", fever: "high", spots: false, rash: false, soreThroat: true, innoculated: false}));
            session.assert(new Patient({name: "Bob", fever: "high", spots: true, rash: false, soreThroat: false, innoculated: true}));
            session.assert(new Patient({name: "Tom", fever: "none", spots: false, rash: true, soreThroat: false, innoculated: false}));
            session.assert(results);
            //flow.print();
            return session.match().then(function () {
                //session.dispose();
                assert.deepEqual(results, [
                    {"name": "Tom", "treatment": "allergyShot"},
                    {"name": "Bob", "treatment": "penicillin"},
                    {"name": "Joe", "treatment": "bedRest"},
                    {"name": "Fred", "treatment": "allergyShot"}
                ]);
            });
        });

    });

    it.describe("getFacts from action", function (it) {
        var flow;

        it.beforeAll(function () {
            flow = require("./rules/getFacts-compiled")();
        });

        it.should("get all facts", function () {
            var session = flow.getSession().focus("get-facts");
            var facts = [
                {},
                1,
                "hello",
                true,
                new Date()
            ];
            for (var i = 0; i < facts.length; i++) {
                session.assert(facts[i]);
            }
            var called = 0;
            return session.on("get-facts", function (gottenFacts) {
                assert.deepEqual(gottenFacts, facts);
                called++;
            }).match().then(function () {
                assert.equal(called, 1);
            });
        });

        it.should("get facts by type", function () {
            var session = flow.getSession().focus("get-facts-by-type");
            var facts = [
                1,
                "hello",
                true,
                new Date()
            ];
            for (var i = 0; i < facts.length; i++) {
                session.assert(facts[i]);
            }
            var called = 0;
            return session
                .on("get-facts-number", function (fact) {
                    assert.deepEqual(fact, [facts[0]]);
                    called++;
                })
                .on("get-facts-string", function (fact) {
                    assert.deepEqual(fact, [facts[1]]);
                    called++;
                })
                .on("get-facts-boolean", function (fact) {
                    assert.deepEqual(fact, [facts[2]]);
                    called++;
                })
                .on("get-facts-date", function (fact) {
                    assert.deepEqual(fact, [facts[3]]);
                    called++;
                })
                .match().then(function () {
                    assert.equal(called, 4);
                });
        });

    });
});