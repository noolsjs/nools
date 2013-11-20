"use strict";
var it = require("it"),
    assert = require("assert"),
    nools = require("../../");

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