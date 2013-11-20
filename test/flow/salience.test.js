"use strict";
var it = require("it"),
    assert = require("assert"),
    nools = require("../../");

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