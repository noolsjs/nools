"use strict";
var it = require("it"),
    assert = require("assert"),
    nools = require("../index");

it.describe("Flow compiled",function (it) {

    it.describe("not rule", function (it) {


        var called, flow;
        it.beforeAll(function () {
            require("./rules/notRule-compiled");
            flow = nools.getFlow("notRule-compiled");
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
            require("./rules/orRule-compiled");
            flow = nools.getFlow("orRule-compiled");
            called = new (flow.getDefined("count"))();
        });


        it.should("call when a string equals 'hello'", function () {
            flow.getSession("world", called).match().then(function () {
                assert.equal(called.called, 1);
            });
        });

    });

    it.describe("events", function (it) {

        it.timeout(1000);
        var flow, Message, session;

        it.beforeAll(function () {
            require("./rules/simple-compiled");
            flow = nools.getFlow("simple-compiled");
            Message = flow.getDefined("Message");

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
                assert.equal(i, 2);
                next();
            });

        });

    });

    it.describe("fibonacci nools dsl", function (it) {

        var flow, Fibonacci, Result;
        it.beforeAll(function () {
            require("./rules/fibonacci-compiled");
            flow = nools.getFlow("fibonacci-compiled");
            Fibonacci = flow.getDefined("fibonacci");
            Result = flow.getDefined("result");
        });

        it.should("calculate Fibonacci of 10", function () {
            var result = new Result();
            var session = flow.getSession(new Fibonacci(10), result);
            return session.match().then(function () {
                session.dispose();
                assert.equal(result.value, 55);
            });
        });

        it.should("calculate Fibonacci of 150", function () {
            var result = new Result();
            var session = flow.getSession(new Fibonacci(150), result);
            return session.match().then(function () {
                session.dispose();
                assert.equal(result.value, 9.969216677189305e+30);
            });
        });

    });

    it.describe("diagnosis using dsl", function (it) {

        var flow, Patient;

        it.beforeAll(function () {
            require("./rules/diagnosis-compiled");
            flow = nools.getFlow("diagnosis-compiled");
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






