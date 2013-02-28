"use strict";
var it = require("it"),
    assert = require("assert"),
    nools = require("../index");

it.describe("Flow dsl",function (it) {

    it.describe("not rule", function (it) {

        var flow = nools.compile(__dirname + "/rules/notRule.nools"),
            Count = flow.getDefined("count"),
            called = new Count();


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

        var flow = nools.compile(__dirname + "/rules/orRule.nools"),
            Count = flow.getDefined("count"),
            called = new Count();

        it.should("call when a string equals 'hello'", function () {
            flow.getSession("world", called).match().then(function () {
                assert.equal(called.called, 1);
            });
        });

    });

    it.describe("scoped functions", function (it) {
        var flow = nools.compile(__dirname + "/rules/scope.nools"),
            Message = flow.getDefined("Message"),
            session;

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

    it.describe("events", function (it) {

        it.timeout(1000);

        var flow = nools.compile(__dirname + "/rules/simple.nools"),
            Message = flow.getDefined("Message"),
            session;

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
                assert.equal(i, 2);
                next();
            });

        });

        it.should("emit events from within the then action", function (next) {
            session.on("found-goodbye", function (message) {
                assert.equal(message.message, "hello goodbye");
                next();
            });
            session.assert(new Message("hello"));
            session.match();
        });

    });

    it.describe("fibonacci nools dsl", function (it) {

        var flow = nools.compile(__dirname + "/rules/fibonacci.nools");
        var Fibonacci = flow.getDefined("fibonacci");
        var Result = flow.getDefined("result");

        it.should("calculate fibonacci numbers", function () {
            var result = new Result();
            return flow.getSession(new Fibonacci(3), result).match()
                .then(function () {
                    assert.equal(result.value, 2);
                    return flow.getSession(new Fibonacci(4), result).match();
                })
                .then(function () {
                    assert.equal(result.value, 3);
                    return flow.getSession(new Fibonacci(5), result).match();
                })
                .then(function () {
                    assert.equal(result.value, 5);
                    return flow.getSession(new Fibonacci(6), result).match();
                })
                .then(function () {
                    assert.equal(result.value, 8);
                });
        });

    });

    it.describe("diagnosis using dsl", function (it) {

        var flow = nools.compile(__dirname + "/rules/diagnosis.nools"),
            Patient = flow.getDefined("patient");


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

        it.should("treat properly on consecutive runs", function () {
            var session = flow.getSession();
            var results = [];
            session.assert(new Patient({name: "Tom", fever: "none", spots: true, rash: false, soreThroat: false, innoculated: false}));
            session.assert(new Patient({name: "Bob", fever: "high", spots: false, rash: false, soreThroat: true, innoculated: false}));
            session.assert(new Patient({name: "Joe", fever: "high", spots: true, rash: false, soreThroat: false, innoculated: true}));
            session.assert(new Patient({name: "Fred", fever: "none", spots: false, rash: true, soreThroat: false, innoculated: false}));
            session.assert(results);
            //flow.print();
            return session.match().then(function () {
                session.dispose();
                assert.deepEqual(results, [
                    {"name": "Fred", "treatment": "allergyShot"},
                    {"name": "Joe", "treatment": "penicillin"},
                    {"name": "Bob", "treatment": "bedRest"},
                    {"name": "Tom", "treatment": "allergyShot"}
                ]);
            });
        });
    });
}).as(module);






