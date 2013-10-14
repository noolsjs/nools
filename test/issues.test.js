"use strict";
var it = require("it"),
    assert = require("assert"),
    nools = require("../index");

it.describe("issues", function (it) {

    it.describe("62", function (it) {
        it.should("allow rule names with \" character in constraints", function () {
            assert.isTrue(/"s == \\"hello\\""/.test(nools.transpile('rule "issue62" {when {s : String s == "hello";}then {emit("s", s);}}', {name: "issue62"})));
        });
    });

    it.describe("65", function (it) {

        function Thing(step) {
            this.step = step;
        }

        Thing.prototype.world = "world";

        Thing.prototype.hello = function () {
            return "hello";
        };

        var flow = nools.flow("issue65", function () {

            this.rule("issue65",
                [Thing, "$t", "($t.step && isUndefined($t[$t.step]))"],
                function (facts, flow) {
                    flow.emit("thing", facts.$t);
                });
        });

        it.should("allow property lookup using [] instead of . notation", function () {
            var calledWith = [];
            return flow.getSession(new Thing("hello"), new Thing("world"), new Thing("other"), new Thing("other2"))
                .on("thing", function (t) {
                    calledWith.push(t);
                })
                .match().then(function () {
                    assert.lengthOf(calledWith, 2);
                    assert.equal(calledWith[0].step, "other2");
                    assert.equal(calledWith[1].step, "other");
                });
        });

    });

    it.describe("66", function (it) {


        var flow = nools.compile(
                "define Value {id : null,v : null,constructor : function (id, value) {this.id = id;this.v = value;} }" +
                    "rule 'issue66' {when {v4 : Value v4.id =~ /xyz/ && v4.v == 27;}then {emit('v4', v4);}}", {name: "issue66"}),
            Value = flow.getDefined("value");

        it.should("properly evaluate a rule with a regular expressions and equality", function () {
            var called = 0;
            return flow.getSession(new Value("xyz", 27), new Value("xyz", 27))
                .on("v4", function () {
                    called++;
                })
                .match().then(function () {
                    assert.equal(called, 2);
                });
        });
    });

    it.describe("67", function (it) {
        var flow = nools.compile(
                "define Value {id : null,v : null,constructor : function (id, value) {this.id = id;this.v = value;} }" +
                    "rule 'issue67' {when {v4 : Value v4.id =~ /xyz/ && v4.v =~ /abc/;}then {emit('v4', v4);}}", {name: "issue67"}),
            Value = flow.getDefined("value");

        it.should("properly evaluate a rule with multiple regular expressions", function () {
            var called = 0;
            return flow.getSession(new Value("xyz", "abc"), new Value("xyz", "abc"))
                .on("v4", function () {
                    called++;
                })
                .match().then(function () {
                    assert.equal(called, 2);
                });
        });
    });

    it.describe("69", function (it) {
        it.should("allow rule names with unescaped ' values", function () {
            assert.isTrue(/'69\\'s issue'/.test(nools.transpile("rule \"69's issue\" {when {s : String s == 'hello';}then {emit('s', s);}}", {name: "issue69"})));

        });
    });

    it.describe("81", function (it) {

        it.should("allow array references when compiling rules", function () {

            function ActualWeightDomain(values) {
                this.values = values;
            }

            function ActualWeightEnteredValue(value) {
                this.value = value;
            }

            function ActualWeightValue() {

            }

            var src = "rule CheckAndAssertActualWeight {" +
                " when {" +
                "    actualWeight_domain: ActualWeightDomain {values: _domainValues};" +
                "    actualWeight_EnteredValue: ActualWeightEnteredValue" +
                "    (" +
                "        actualWeight_EnteredValue.value >= _domainValues[0] &&" +
                "            actualWeight_EnteredValue.value <= _domainValues[1]" +
                "    ) {value : _entered};" +
                "}" +
                "then {" +
                "    assert( new ActualWeightValue({value:_entered}) );" +
                "}" +
                "}";

            var flow = nools.compile(src, {name: "issue81", define: {
                "ActualWeightDomain": ActualWeightDomain,
                "ActualWeightEnteredValue": ActualWeightEnteredValue,
                ActualWeightValue: ActualWeightValue
            }});
            var fired = [];
            var session = flow.getSession(new ActualWeightEnteredValue(1), new ActualWeightDomain([1, 2])).on("fire", function (name) {
                fired.push(name);
            });
            return session.match().then(function () {
                assert.deepEqual(fired, ["CheckAndAssertActualWeight"]);
                fired.length = 0;
                session = flow.getSession(new ActualWeightEnteredValue(5), new ActualWeightDomain([1, 2])).on("fire", function (name) {
                    fired.push(name);
                });
                return session.match().then(function () {
                    assert.deepEqual(fired, []);
                });
            });

        });

    });

    it.describe("82", function (it) {

        it.should("allow a trailing comment when using the dsl", function () {
            nools.compile("rule 'hello' {when {s: String s == 'hello';}then{console.log(s);}} //test comment ", {name: "issue82"});
        });

    });

});