"use strict";
var it = require("it"),
    assert = require("assert"),
    nools = require("../index"),
    resolve = require("path").resolve;

it.describe("Flow dsl", function (it) {

    it.describe("not rule", function (it) {

        var flow, Count, called;

        it.beforeAll(function () {
            flow = nools.compile(resolve(__dirname, "./rules/notRule.nools"));
            Count = flow.getDefined("count");
            called = new Count();
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
        var flow, Count, called;
        it.beforeAll(function () {
            flow = nools.compile(resolve(__dirname, "./rules/orRule.nools"));
            Count = flow.getDefined("count");
            called = new Count();
        });

        it.should("call when a string equals 'hello'", function () {
            return flow.getSession("world", called).match().then(function () {
                assert.equal(called.called, 1);
                assert.equal(called.s, "world");
                called.called = 0;
                called.s = null;
                return flow.getSession("worldd", called).match().then(function () {
                    assert.equal(called.called, 0);
                    assert.isNull(called.s);
                });

            });
        });

        it.describe("or rule with not conditions", function (it) {
            var flow, count;
            it.beforeAll(function () {
                flow = nools.compile(resolve(__dirname, "./rules/orRule-notConditions.nools"));
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


        var flow, Count, called;
        it.beforeAll(function () {
            flow = nools.compile(resolve(__dirname, "./rules/existsRule.nools"));
            Count = flow.getDefined("count");
            called = new Count();
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
        var flow, Message, session;
        it.beforeAll(function () {
            flow = nools.compile(resolve(__dirname, "./rules/scope.nools"));
            Message = flow.getDefined("Message");
        });

        it.beforeEach(function () {
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

    it.describe("rules with provided scope", function (it) {
        var matches = function (str, regex) {
            return regex.test(str);
        };
        var flow, Message, session;
        it.beforeAll(function () {
            flow = nools.compile(resolve(__dirname, "./rules/provided-scope.nools"), {scope: {doesMatch: matches}});
            Message = flow.getDefined("Message");
        });

        it.beforeEach(function () {
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

    it.describe("externally defined Fact types", function (it) {

        function Message(message) {
            this.message = message;
        }

        var flow, session;
        it.beforeAll(function () {
            flow = nools.compile(resolve(__dirname, "./rules/simple-external-defined.nools"), {
                define: {
                    Message: Message
                }

            });
        });

        it.beforeEach(function () {
            session = flow.getSession();
        });

        it.should("return the externally defined type from getDefined", function () {
            assert.equal(flow.getDefined("message"), Message);
        });

        it.should("allow using externally defined Fact types", function (next) {
            var m = new Message("hello");
            session.once("assert", function (fact) {
                assert.deepEqual(fact, m);
                next();
            });
            session.assert(m);
        });
    });

    it.describe("globals", function (it) {
        var flow, session;

        it.timeout(1000);

        it.beforeAll(function () {
            flow = nools.compile(resolve(__dirname, "./rules/global.nools"));
        });

        it.beforeEach(function () {
            session = flow.getSession();
        });

        it.should("call the scoped function", function (next) {
            session.on("globals", function (globals) {
                try {
                    assert.equal(globals.assert, assert);
                    assert.equal(globals.PI, Math.PI);
                    assert.equal(globals.SOME_STRING, "some string");
                    assert.equal(globals.TRUE, true);
                    assert.equal(globals.NUM, 1.23);
                    assert.isDate(globals.DATE);
                    assert.deepEqual(globals.globalNools, {hello: "world"});
                    next();
                } catch (e) {
                    next(e);
                }
            });
            session.assert("some string");
            session.match();
        });
    });

    it.describe("comments in dsl", function (it) {

        var flow;
        it.beforeAll(function () {
            flow = nools.compile(resolve(__dirname, "./rules/comments.nools"));
        });

        it.should("remove all block comments", function () {
            assert.isFalse(flow.containsRule("Goodbye2"));
            assert.isTrue(flow.containsRule("Goodbye"));
            assert.isTrue(flow.containsRule("Hello"));
        });

    });

    it.describe("events", function (it) {

        it.timeout(1000);

        var flow, Message, session;
        it.beforeAll(function () {
            flow = nools.compile(resolve(__dirname, "./rules/simple.nools"));
            Message = flow.getDefined("Message");
        });

        it.beforeEach(function () {
            session = flow.getSession();
        });

        it.should("emit when facts are asserted", function (next) {
            var m = new Message("hello ");
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
                assert.equal(i, fire.length);
                next();
            });

        });

        it.should("emit events from within the then action", function (next) {
            session.on("found-goodbye", function (message) {
                assert.equal(message.message, "hello world goodbye");
                next();
            });
            session.assert(new Message("hello world"));
            session.match();
        });

    });

    it.describe("agenda-groups", function (it) {
        var flow, Message, session;
        it.beforeAll(function () {
            flow = nools.compile(resolve(__dirname, "./rules/agenda-group.nools"));
            Message = flow.getDefined("message");
        });

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

    it.describe("getFacts from action", function (it) {
        var flow;

        it.beforeAll(function () {
            flow = nools.compile(resolve(__dirname, "./rules/getFacts.nools"));
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

    it.describe("auto-focus", function (it) {

        var flow, State, session;
        it.beforeAll(function () {
            flow = nools.compile(resolve(__dirname, "./rules/auto-focus.nools"));
            State = flow.getDefined("state");
        });

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
            flow = nools.compile(resolve(__dirname, "./rules/defined.nools"));
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
            flow = nools.compile(resolve(__dirname, "./rules/fibonacci.nools"));
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
            flow = nools.compile(resolve(__dirname, "./rules/diagnosis.nools"));
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
            return session.match().then(function () {
                session.dispose();
                assert.deepEqual(results, [
                    {"name": "Tom", "treatment": "allergyShot"},
                    {"name": "Bob", "treatment": "penicillin"},
                    {"name": "Joe", "treatment": "bedRest"},
                    {"name": "Fred", "treatment": "allergyShot"}
                ]);
            });
        });
    });
});