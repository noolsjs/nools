"use strict";
var it = require("it"),
    assert = require("assert"),
    nools = require("../../");

it.describe("no-loop", function (it) {
    var fired;

    function Wrapper(n) {
        this.n = n;
    }

    it.should("not loop with option on", function () {
        fired = [];

        return nools
            .flow("noLoop", function () {
                this.rule("ping", { noLoop: true }, [Wrapper, "w", "w.n < 5"], function (facts) {
                    var w = facts.w;
                    w.n++;
                    this.modify(w);
                });
            })
            .getSession(new Wrapper(0))
            .on("fire", function (name) {
                fired.push(name);
            })
            .match()
            .then(function(){
                assert.deepEqual(fired, [ 'ping' ])
            });
    });

    it.should("avoid only self-recursions", function () {
        fired = [];

        return nools
            .flow("noLoop2", function () {
                this.rule("ping", { noLoop: true }, [Wrapper, "w", "w.n < 5"], function (facts) {
                    var w = facts.w;
                    w.n++;
                    this.modify(w);
                });

                this.rule("pong", { noLoop: true }, [Wrapper, "w", "w.n < 5"], function (facts) {
                    var w = facts.w;
                    w.n++;
                    this.modify(w);
                });
            })
            .getSession(new Wrapper(0))
            .on("fire", function (name) {
                fired.push(name);
            })
            .match()
            .then(function(){
                assert.deepEqual(fired, [ 'ping', 'pong', 'ping', 'pong', 'ping' ])
            });
    });

    it.should("mix with noloop", function () {
        fired = [];

        return nools
            .flow("noLoop3", function () {
                this.rule("a", { noLoop: true }, [Wrapper, "w", "w.n < 5"], function (facts) {
                    var w = facts.w;
                    w.n++;
                    this.modify(w);
                });

                this.rule("b", {}, [Wrapper, "w", "w.n < 5"], function (facts) {

                });

                this.rule("c", { noLoop: true }, [Wrapper, "w", "w.n < 5"], function (facts) {
                    var w = facts.w;
                    w.n++;
                    this.modify(w);
                });
            })
            .getSession(new Wrapper(0))
            .on("fire", function (name) {
                fired.push(name);
            })
            .match()
            .then(function(){
                assert.deepEqual(fired, [ 'a', 'b', 'c', 'a', 'b', 'c', 'a'])
            });
    });
});
