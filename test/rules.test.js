"use strict";
var it = require("it"),
    assert = require("assert"),
    patterns = require("../lib/pattern"),
    constraints = require("../lib/constraint"),
    rules = require("../lib/rule");

var cb = function () {
};

it.describe("Rule", function (it) {
    it.describe("#createRule", function (it) {

        it.describe("with strings", function (it) {
            it.should("create for string", function () {
                var rule = rules.createRule("My Rule", ["String", "s"], cb);
                assert.isNotNull(rule);
                assert.lengthOf(rule, 1);
                rule = rule[0];
                assert.equal(rule.name, "My Rule");
                assert.isNotNull(rule.pattern);
                var pattern = rule.pattern;
                assert.equal(pattern.alias, "s");
                assert.lengthOf(pattern.constraints, 2);
                assert.instanceOf(pattern.constraints[0], constraints.ObjectConstraint);
                assert.equal(pattern.constraints[0].constraint, String);
                assert.instanceOf(pattern.constraints[1], constraints.TrueConstraint);
                assert.strictEqual(rule.cb, cb);
            });

            it.should("create for String", function () {
                var rule = rules.createRule("My Rule", ["string", "s"], cb);
                assert.isNotNull(rule);
                assert.lengthOf(rule, 1);
                rule = rule[0];
                assert.equal(rule.name, "My Rule");
                assert.isNotNull(rule.pattern);
                var pattern = rule.pattern;
                assert.equal(pattern.alias, "s");
                assert.lengthOf(pattern.constraints, 2);
                assert.instanceOf(pattern.constraints[0], constraints.ObjectConstraint);
                assert.equal(pattern.constraints[0].constraint, String);
                assert.instanceOf(pattern.constraints[1], constraints.TrueConstraint);
                assert.strictEqual(rule.cb, cb);
            });


            it.should("create for number", function () {
                var rule = rules.createRule("My Rule", ["number", "s"], cb);
                assert.isNotNull(rule);
                assert.lengthOf(rule, 1);
                rule = rule[0];
                assert.equal(rule.name, "My Rule");
                assert.isNotNull(rule.pattern);
                var pattern = rule.pattern;
                assert.equal(pattern.alias, "s");
                assert.lengthOf(pattern.constraints, 2);
                assert.instanceOf(pattern.constraints[0], constraints.ObjectConstraint);
                assert.equal(pattern.constraints[0].constraint, Number);
                assert.instanceOf(pattern.constraints[1], constraints.TrueConstraint);
                assert.strictEqual(rule.cb, cb);
            });

            it.should("create for Number", function () {
                var rule = rules.createRule("My Rule", ["Number", "s"], cb);
                assert.isNotNull(rule);
                assert.lengthOf(rule, 1);
                rule = rule[0];
                assert.equal(rule.name, "My Rule");
                assert.isNotNull(rule.pattern);
                var pattern = rule.pattern;
                assert.equal(pattern.alias, "s");
                assert.lengthOf(pattern.constraints, 2);
                assert.instanceOf(pattern.constraints[0], constraints.ObjectConstraint);
                assert.equal(pattern.constraints[0].constraint, Number);
                assert.instanceOf(pattern.constraints[1], constraints.TrueConstraint);
                assert.strictEqual(rule.cb, cb);
            });

            it.should("create for date", function () {
                var rule = rules.createRule("My Rule", ["date", "s"], cb);
                assert.isNotNull(rule);
                assert.lengthOf(rule, 1);
                rule = rule[0];
                assert.equal(rule.name, "My Rule");
                assert.isNotNull(rule.pattern);
                var pattern = rule.pattern;
                assert.equal(pattern.alias, "s");
                assert.lengthOf(pattern.constraints, 2);
                assert.instanceOf(pattern.constraints[0], constraints.ObjectConstraint);
                assert.equal(pattern.constraints[0].constraint, Date);
                assert.instanceOf(pattern.constraints[1], constraints.TrueConstraint);
                assert.strictEqual(rule.cb, cb);
            });

            it.should("create for Date", function () {
                var rule = rules.createRule("My Rule", ["Date", "s"], cb);
                assert.isNotNull(rule);
                assert.lengthOf(rule, 1);
                rule = rule[0];
                assert.equal(rule.name, "My Rule");
                assert.isNotNull(rule.pattern);
                var pattern = rule.pattern;
                assert.equal(pattern.alias, "s");
                assert.lengthOf(pattern.constraints, 2);
                assert.instanceOf(pattern.constraints[0], constraints.ObjectConstraint);
                assert.equal(pattern.constraints[0].constraint, Date);
                assert.instanceOf(pattern.constraints[1], constraints.TrueConstraint);
                assert.strictEqual(rule.cb, cb);
            });


            it.should("create for array", function () {
                var rule = rules.createRule("My Rule", ["array", "s"], cb);
                assert.isNotNull(rule);
                assert.lengthOf(rule, 1);
                rule = rule[0];
                assert.equal(rule.name, "My Rule");
                assert.isNotNull(rule.pattern);
                var pattern = rule.pattern;
                assert.equal(pattern.alias, "s");
                assert.lengthOf(pattern.constraints, 2);
                assert.instanceOf(pattern.constraints[0], constraints.ObjectConstraint);
                assert.equal(pattern.constraints[0].constraint, Array);
                assert.instanceOf(pattern.constraints[1], constraints.TrueConstraint);
                assert.strictEqual(rule.cb, cb);
            });

            it.should("create for Array", function () {
                var rule = rules.createRule("My Rule", ["Array", "s"], cb);
                assert.isNotNull(rule);
                assert.lengthOf(rule, 1);
                rule = rule[0];
                assert.equal(rule.name, "My Rule");
                assert.isNotNull(rule.pattern);
                var pattern = rule.pattern;
                assert.equal(pattern.alias, "s");
                assert.lengthOf(pattern.constraints, 2);
                assert.instanceOf(pattern.constraints[0], constraints.ObjectConstraint);
                assert.equal(pattern.constraints[0].constraint, Array);
                assert.instanceOf(pattern.constraints[1], constraints.TrueConstraint);
                assert.strictEqual(rule.cb, cb);
            });

            it.should("create for boolean", function () {
                var rule = rules.createRule("My Rule", ["boolean", "s"], cb);
                assert.isNotNull(rule);
                assert.lengthOf(rule, 1);
                rule = rule[0];
                assert.equal(rule.name, "My Rule");
                assert.isNotNull(rule.pattern);
                var pattern = rule.pattern;
                assert.equal(pattern.alias, "s");
                assert.lengthOf(pattern.constraints, 2);
                assert.instanceOf(pattern.constraints[0], constraints.ObjectConstraint);
                assert.equal(pattern.constraints[0].constraint, Boolean);
                assert.instanceOf(pattern.constraints[1], constraints.TrueConstraint);
                assert.strictEqual(rule.cb, cb);
            });

            it.should("create for Boolean", function () {
                var rule = rules.createRule("My Rule", ["Boolean", "s"], cb);
                assert.isNotNull(rule);
                assert.lengthOf(rule, 1);
                rule = rule[0];
                assert.equal(rule.name, "My Rule");
                assert.isNotNull(rule.pattern);
                var pattern = rule.pattern;
                assert.equal(pattern.alias, "s");
                assert.lengthOf(pattern.constraints, 2);
                assert.instanceOf(pattern.constraints[0], constraints.ObjectConstraint);
                assert.equal(pattern.constraints[0].constraint, Boolean);
                assert.instanceOf(pattern.constraints[1], constraints.TrueConstraint);
                assert.strictEqual(rule.cb, cb);
            });

            it.should("create for regexp", function () {
                var rule = rules.createRule("My Rule", ["regexp", "s"], cb);
                assert.isNotNull(rule);
                assert.lengthOf(rule, 1);
                rule = rule[0];
                assert.equal(rule.name, "My Rule");
                assert.isNotNull(rule.pattern);
                var pattern = rule.pattern;
                assert.equal(pattern.alias, "s");
                assert.lengthOf(pattern.constraints, 2);
                assert.instanceOf(pattern.constraints[0], constraints.ObjectConstraint);
                assert.equal(pattern.constraints[0].constraint, RegExp);
                assert.instanceOf(pattern.constraints[1], constraints.TrueConstraint);
                assert.strictEqual(rule.cb, cb);
            });

            it.should("create for Regexp", function () {
                var rule = rules.createRule("My Rule", ["RegExp", "s"], cb);
                assert.isNotNull(rule);
                assert.lengthOf(rule, 1);
                rule = rule[0];
                assert.equal(rule.name, "My Rule");
                assert.isNotNull(rule.pattern);
                var pattern = rule.pattern;
                assert.equal(pattern.alias, "s");
                assert.lengthOf(pattern.constraints, 2);
                assert.instanceOf(pattern.constraints[0], constraints.ObjectConstraint);
                assert.equal(pattern.constraints[0].constraint, RegExp);
                assert.instanceOf(pattern.constraints[1], constraints.TrueConstraint);
                assert.strictEqual(rule.cb, cb);
            });

            it.should("create for object", function () {
                var rule = rules.createRule("My Rule", ["object", "s"], cb);
                assert.isNotNull(rule);
                assert.lengthOf(rule, 1);
                rule = rule[0];
                assert.equal(rule.name, "My Rule");
                assert.isNotNull(rule.pattern);
                var pattern = rule.pattern;
                assert.equal(pattern.alias, "s");
                assert.lengthOf(pattern.constraints, 2);
                assert.instanceOf(pattern.constraints[0], constraints.ObjectConstraint);
                assert.equal(pattern.constraints[0].constraint, Object);
                assert.instanceOf(pattern.constraints[1], constraints.TrueConstraint);
                assert.strictEqual(rule.cb, cb);
            });

            it.should("create for Object", function () {
                var rule = rules.createRule("My Rule", ["Object", "s"], cb);
                assert.isNotNull(rule);
                assert.lengthOf(rule, 1);
                rule = rule[0];
                assert.equal(rule.name, "My Rule");
                assert.isNotNull(rule.pattern);
                var pattern = rule.pattern;
                assert.equal(pattern.alias, "s");
                assert.lengthOf(pattern.constraints, 2);
                assert.instanceOf(pattern.constraints[0], constraints.ObjectConstraint);
                assert.equal(pattern.constraints[0].constraint, Object);
                assert.instanceOf(pattern.constraints[1], constraints.TrueConstraint);
                assert.strictEqual(rule.cb, cb);
            });

            it.should("create for hash", function () {
                var rule = rules.createRule("My Rule", ["hash", "s"], cb);
                assert.isNotNull(rule);
                assert.lengthOf(rule, 1);
                rule = rule[0];
                assert.equal(rule.name, "My Rule");
                assert.isNotNull(rule.pattern);
                var pattern = rule.pattern;
                assert.equal(pattern.alias, "s");
                assert.lengthOf(pattern.constraints, 2);
                assert.instanceOf(pattern.constraints[0], constraints.ObjectConstraint);
                assert.equal(pattern.constraints[0].constraint, Object);
                assert.instanceOf(pattern.constraints[1], constraints.TrueConstraint);
                assert.strictEqual(rule.cb, cb);
            });

            it.should("create for Hash", function () {
                var rule = rules.createRule("My Rule", ["Hash", "s"], cb);
                assert.isNotNull(rule);
                assert.lengthOf(rule, 1);
                rule = rule[0];
                assert.equal(rule.name, "My Rule");
                assert.isNotNull(rule.pattern);
                var pattern = rule.pattern;
                assert.equal(pattern.alias, "s");
                assert.lengthOf(pattern.constraints, 2);
                assert.instanceOf(pattern.constraints[0], constraints.ObjectConstraint);
                assert.equal(pattern.constraints[0].constraint, Object);
                assert.instanceOf(pattern.constraints[1], constraints.TrueConstraint);
                assert.strictEqual(rule.cb, cb);
            });

        });

        it.describe("with functions", function (it) {

            var MyObject = function () {
                this.name = "hi";
            };

            it.should("create for String function", function () {
                var rule = rules.createRule("My Rule", [String, "s"], cb);
                assert.isNotNull(rule);
                assert.lengthOf(rule, 1);
                rule = rule[0];
                assert.equal(rule.name, "My Rule");
                assert.isNotNull(rule.pattern);
                var pattern = rule.pattern;
                assert.equal(pattern.alias, "s");
                assert.lengthOf(pattern.constraints, 2);
                assert.instanceOf(pattern.constraints[0], constraints.ObjectConstraint);
                assert.equal(pattern.constraints[0].constraint, String);
                assert.instanceOf(pattern.constraints[1], constraints.TrueConstraint);
                assert.strictEqual(rule.cb, cb);
            });

            it.should("create for Number function", function () {
                var rule = rules.createRule("My Rule", [Number, "s"], cb);
                assert.isNotNull(rule);
                assert.lengthOf(rule, 1);
                rule = rule[0];
                assert.equal(rule.name, "My Rule");
                assert.isNotNull(rule.pattern);
                var pattern = rule.pattern;
                assert.equal(pattern.alias, "s");
                assert.lengthOf(pattern.constraints, 2);
                assert.instanceOf(pattern.constraints[0], constraints.ObjectConstraint);
                assert.equal(pattern.constraints[0].constraint, Number);
                assert.instanceOf(pattern.constraints[1], constraints.TrueConstraint);
                assert.strictEqual(rule.cb, cb);
            });

            it.should("create for Date function", function () {
                var rule = rules.createRule("My Rule", [Date, "s"], cb);
                assert.isNotNull(rule);
                assert.lengthOf(rule, 1);
                rule = rule[0];
                assert.equal(rule.name, "My Rule");
                assert.isNotNull(rule.pattern);
                var pattern = rule.pattern;
                assert.equal(pattern.alias, "s");
                assert.lengthOf(pattern.constraints, 2);
                assert.instanceOf(pattern.constraints[0], constraints.ObjectConstraint);
                assert.equal(pattern.constraints[0].constraint, Date);
                assert.instanceOf(pattern.constraints[1], constraints.TrueConstraint);
                assert.strictEqual(rule.cb, cb);
            });

            it.should("create for []", function () {
                var rule = rules.createRule("My Rule", [
                    [],
                    "s"
                ], cb);
                assert.isNotNull(rule);
                assert.lengthOf(rule, 1);
                rule = rule[0];
                assert.equal(rule.name, "My Rule");
                assert.isNotNull(rule.pattern);
                var pattern = rule.pattern;
                assert.equal(pattern.alias, "s");
                assert.lengthOf(pattern.constraints, 2);
                assert.instanceOf(pattern.constraints[0], constraints.ObjectConstraint);
                assert.equal(pattern.constraints[0].constraint, Array);
                assert.instanceOf(pattern.constraints[1], constraints.TrueConstraint);
                assert.strictEqual(rule.cb, cb);
            });

            it.should("create for Array function", function () {
                var rule = rules.createRule("My Rule", [Array, "s"], cb);
                assert.isNotNull(rule);
                assert.lengthOf(rule, 1);
                rule = rule[0];
                assert.equal(rule.name, "My Rule");
                assert.isNotNull(rule.pattern);
                var pattern = rule.pattern;
                assert.equal(pattern.alias, "s");
                assert.lengthOf(pattern.constraints, 2);
                assert.instanceOf(pattern.constraints[0], constraints.ObjectConstraint);
                assert.equal(pattern.constraints[0].constraint, Array);
                assert.instanceOf(pattern.constraints[1], constraints.TrueConstraint);
                assert.strictEqual(rule.cb, cb);
            });


            it.should("create for Boolean function", function () {
                var rule = rules.createRule("My Rule", [Boolean, "s"], cb);
                assert.isNotNull(rule);
                assert.lengthOf(rule, 1);
                rule = rule[0];
                assert.equal(rule.name, "My Rule");
                assert.isNotNull(rule.pattern);
                var pattern = rule.pattern;
                assert.equal(pattern.alias, "s");
                assert.lengthOf(pattern.constraints, 2);
                assert.instanceOf(pattern.constraints[0], constraints.ObjectConstraint);
                assert.equal(pattern.constraints[0].constraint, Boolean);
                assert.instanceOf(pattern.constraints[1], constraints.TrueConstraint);
                assert.strictEqual(rule.cb, cb);
            });

            it.should("create for RegExp function", function () {
                var rule = rules.createRule("My Rule", [RegExp, "s"], cb);
                assert.isNotNull(rule);
                assert.lengthOf(rule, 1);
                rule = rule[0];
                assert.equal(rule.name, "My Rule");
                assert.isNotNull(rule.pattern);
                var pattern = rule.pattern;
                assert.equal(pattern.alias, "s");
                assert.lengthOf(pattern.constraints, 2);
                assert.instanceOf(pattern.constraints[0], constraints.ObjectConstraint);
                assert.equal(pattern.constraints[0].constraint, RegExp);
                assert.instanceOf(pattern.constraints[1], constraints.TrueConstraint);
                assert.strictEqual(rule.cb, cb);
            });


            it.should("create for Object function", function () {
                var rule = rules.createRule("My Rule", [Object, "s"], cb);
                assert.isNotNull(rule);
                assert.lengthOf(rule, 1);
                rule = rule[0];
                assert.equal(rule.name, "My Rule");
                assert.isNotNull(rule.pattern);
                var pattern = rule.pattern;
                assert.equal(pattern.alias, "s");
                assert.lengthOf(pattern.constraints, 2);
                assert.instanceOf(pattern.constraints[0], constraints.ObjectConstraint);
                assert.equal(pattern.constraints[0].constraint, Object);
                assert.instanceOf(pattern.constraints[1], constraints.TrueConstraint);
                assert.strictEqual(rule.cb, cb);
            });

            it.should("create for custom functions", function () {
                var rule = rules.createRule("My Rule", [MyObject, "s"], cb);
                assert.isNotNull(rule);
                assert.lengthOf(rule, 1);
                rule = rule[0];
                assert.equal(rule.name, "My Rule");
                assert.isNotNull(rule.pattern);
                var pattern = rule.pattern;
                assert.equal(pattern.alias, "s");
                assert.lengthOf(pattern.constraints, 2);
                assert.instanceOf(pattern.constraints[0], constraints.ObjectConstraint);
                assert.equal(pattern.constraints[0].constraint, MyObject);
                assert.instanceOf(pattern.constraints[1], constraints.TrueConstraint);
                assert.strictEqual(rule.cb, cb);
            });
        });

        it.describe("custom function as constraints", function (it) {

            function customContraint(fact) {
                return true;
            };

            it.should("create for String function with custom constraint", function () {
                var rule = rules.createRule("My Rule", [String, "s", customContraint], cb);
                assert.isNotNull(rule);
                assert.lengthOf(rule, 1);
                rule = rule[0];
                assert.equal(rule.name, "My Rule");
                assert.isNotNull(rule.pattern);
                var pattern = rule.pattern;
                assert.equal(pattern.alias, "s");
                assert.lengthOf(pattern.constraints, 2);
                assert.instanceOf(pattern.constraints[0], constraints.ObjectConstraint);
                assert.equal(pattern.constraints[0].constraint, String);
                assert.instanceOf(pattern.constraints[1], constraints.CustomConstraint);
                assert.strictEqual(rule.cb, cb);
            });
        });

        it.describe("custom type via scope", function (it) {

            var MyType = function (name) {
                this.name = name;
            };

            it.should("create for String function with custom constraint", function () {
                var rule = rules.createRule("My Rule", {scope: {MyType: MyType}}, ['MyType', "s", "s.name === 'X'"], cb);
                assert.isNotNull(rule);
                assert.lengthOf(rule, 1);
                rule = rule[0];
                assert.equal(rule.name, "My Rule");
                assert.isNotNull(rule.pattern);
                var pattern = rule.pattern;
                assert.equal(pattern.alias, "s");
                assert.lengthOf(pattern.constraints, 2);
                assert.instanceOf(pattern.constraints[0], constraints.ObjectConstraint);
                assert.equal(pattern.constraints[0].constraint, MyType);
                assert.strictEqual(rule.cb, cb);
            });
        });

        it.should("create a composite rule", function () {
            var rule = rules.createRule("My Rule", [
                ["string", "s"],
                ["string", "s2", "s2 == s"]
            ], cb);
            assert.isNotNull(rule);
            assert.lengthOf(rule, 1);
            rule = rule[0];
            assert.equal(rule.name, "My Rule");
            assert.isNotNull(rule.pattern);
            var pattern = rule.pattern;
            assert.instanceOf(pattern, patterns.CompositePattern);
            assert.instanceOf(pattern.leftPattern, patterns.ObjectPattern);
            assert.instanceOf(pattern.rightPattern, patterns.ObjectPattern);
            assert.equal(pattern.leftPattern.alias, "s");
            assert.equal(pattern.rightPattern.alias, "s2");
            var constrnts = pattern.leftPattern.constraints;
            assert.lengthOf(constrnts, 2);
            assert.instanceOf(constrnts[0], constraints.ObjectConstraint);
            assert.instanceOf(constrnts[1], constraints.TrueConstraint);
            constrnts = pattern.rightPattern.constraints;
            assert.lengthOf(constrnts, 2);
            assert.instanceOf(constrnts[0], constraints.ObjectConstraint);
            assert.instanceOf(constrnts[1], constraints.ReferenceConstraint);
            assert.strictEqual(rule.cb, cb);
        });

        it.should("create a not pattern", function () {
            var rule = rules.createRule("My Rule", [
                ["string", "s"],
                ["not", "string", "s2", "s2 == s"]
            ], cb);
            assert.isNotNull(rule);
            assert.lengthOf(rule, 1);
            rule = rule[0];
            assert.equal(rule.name, "My Rule");
            assert.isNotNull(rule.pattern);
            var pattern = rule.pattern;
            assert.instanceOf(pattern, patterns.CompositePattern);
            assert.instanceOf(pattern.leftPattern, patterns.ObjectPattern);
            assert.instanceOf(pattern.rightPattern, patterns.NotPattern);
            assert.equal(pattern.leftPattern.alias, "s");
            assert.equal(pattern.rightPattern.alias, "s2");
            var constrnts = pattern.leftPattern.constraints;
            assert.lengthOf(constrnts, 2);
            assert.instanceOf(constrnts[0], constraints.ObjectConstraint);
            assert.instanceOf(constrnts[1], constraints.TrueConstraint);
            constrnts = pattern.rightPattern.constraints;
            assert.lengthOf(constrnts, 2);
            assert.instanceOf(constrnts[0], constraints.ObjectConstraint);
            assert.instanceOf(constrnts[1], constraints.ReferenceConstraint);
            assert.strictEqual(rule.cb, cb);
        });

        it.should("create a or pattern", function () {
            var ruleArr = rules.createRule("My Rule", [
                ["string", "s"],
                ["or",
                    ["string", "s2", "s2 == s"],
                    ["string", "s2", "s2 == 'world'"]
                ]
            ], cb);
            assert.isNotNull(ruleArr);
            assert.lengthOf(ruleArr, 2);
            for (var i = 0; i < 2; i++) {
                var rule = ruleArr[i];
                assert.equal(rule.name, "My Rule");
                assert.isNotNull(rule.pattern);
                var pattern = rule.pattern;
                assert.instanceOf(pattern, patterns.CompositePattern);
                assert.instanceOf(pattern.leftPattern, patterns.ObjectPattern);
                assert.instanceOf(pattern.rightPattern, patterns.ObjectPattern);
                assert.equal(pattern.leftPattern.alias, "s");
                assert.equal(pattern.rightPattern.alias, "s2");
                var constrnts = pattern.leftPattern.constraints;
                assert.lengthOf(constrnts, 2);
                assert.instanceOf(constrnts[0], constraints.ObjectConstraint);
                assert.instanceOf(constrnts[1], constraints.TrueConstraint);
                constrnts = pattern.rightPattern.constraints;
                assert.lengthOf(constrnts, 2);
                assert.instanceOf(constrnts[0], constraints.ObjectConstraint);
                assert.instanceOf(constrnts[1], constraints[i === 0 ? "ReferenceConstraint" : "EqualityConstraint"]);
                assert.strictEqual(rule.cb, cb);
            }
        });

        it.should("include reference store in constraints", function () {
            var ruleArr = rules.createRule("My Rule", [
                ["Hash", "h", {name: "name"}],
                ["string", "s2", "s2 == name", {length: "length"}]
            ], cb);
            assert.isNotNull(ruleArr);
            assert.lengthOf(ruleArr, 1);

            var rule = ruleArr[0];
            assert.equal(rule.name, "My Rule");
            assert.isNotNull(rule.pattern);
            var pattern = rule.pattern;
            assert.instanceOf(pattern, patterns.CompositePattern);
            assert.instanceOf(pattern.leftPattern, patterns.ObjectPattern);
            assert.instanceOf(pattern.rightPattern, patterns.ObjectPattern);
            assert.equal(pattern.leftPattern.alias, "h");
            assert.equal(pattern.rightPattern.alias, "s2");
            var constrnts = pattern.leftPattern.constraints;
            assert.lengthOf(constrnts, 3);
            assert.instanceOf(constrnts[0], constraints.ObjectConstraint);
            assert.instanceOf(constrnts[1], constraints.TrueConstraint);
            assert.instanceOf(constrnts[2], constraints.HashConstraint);
            constrnts = pattern.rightPattern.constraints;
            assert.lengthOf(constrnts, 3);
            assert.instanceOf(constrnts[0], constraints.ObjectConstraint);
            assert.instanceOf(constrnts[1], constraints.ReferenceConstraint);
            assert.instanceOf(constrnts[2], constraints.HashConstraint);
            assert.strictEqual(rule.cb, cb);
        });

        it.should("should include from constraints", function () {
            var ruleArr = rules.createRule("My Rule", [
                ["Hash", "h", {name: "name"}],
                ["string", "s2", "s2 == name", {length: "length"}, "from name"]
            ], cb);
            assert.isNotNull(ruleArr);
            assert.lengthOf(ruleArr, 1);

            var rule = ruleArr[0];
            assert.equal(rule.name, "My Rule");
            assert.isNotNull(rule.pattern);
            var pattern = rule.pattern;
            assert.instanceOf(pattern, patterns.CompositePattern);
            assert.instanceOf(pattern.leftPattern, patterns.ObjectPattern);
            assert.instanceOf(pattern.rightPattern, patterns.FromPattern);
            assert.equal(pattern.leftPattern.alias, "h");
            assert.equal(pattern.rightPattern.alias, "s2");
            var constrnts = pattern.leftPattern.constraints;
            assert.lengthOf(constrnts, 3);
            assert.instanceOf(constrnts[0], constraints.ObjectConstraint);
            assert.instanceOf(constrnts[1], constraints.TrueConstraint);
            assert.instanceOf(constrnts[2], constraints.HashConstraint);
            constrnts = pattern.rightPattern.constraints;
            assert.lengthOf(constrnts, 3);
            assert.instanceOf(constrnts[0], constraints.ObjectConstraint);
            assert.instanceOf(constrnts[1], constraints.ReferenceConstraint);
            assert.instanceOf(constrnts[2], constraints.HashConstraint);
            assert.instanceOf(pattern.rightPattern.from, constraints.FromConstraint);
        });

        it.should("should include from constraints", function () {
            var ruleArr = rules.createRule("My Rule", [
                ["Hash", "h", {name: "name"}],
                ["string", "s2", "s2 == name", {length: "length"}, "from [1,2,3,4]"]
            ], cb);
            assert.isNotNull(ruleArr);
            assert.lengthOf(ruleArr, 1);

            var rule = ruleArr[0];
            assert.equal(rule.name, "My Rule");
            assert.isNotNull(rule.pattern);
            var pattern = rule.pattern;
            assert.instanceOf(pattern, patterns.CompositePattern);
            assert.instanceOf(pattern.leftPattern, patterns.ObjectPattern);
            assert.instanceOf(pattern.rightPattern, patterns.FromPattern);
            assert.equal(pattern.leftPattern.alias, "h");
            assert.equal(pattern.rightPattern.alias, "s2");
            var constrnts = pattern.leftPattern.constraints;
            assert.lengthOf(constrnts, 3);
            assert.instanceOf(constrnts[0], constraints.ObjectConstraint);
            assert.instanceOf(constrnts[1], constraints.TrueConstraint);
            assert.instanceOf(constrnts[2], constraints.HashConstraint);
            constrnts = pattern.rightPattern.constraints;
            assert.lengthOf(constrnts, 3);
            assert.instanceOf(constrnts[0], constraints.ObjectConstraint);
            assert.instanceOf(constrnts[1], constraints.ReferenceConstraint);
            assert.instanceOf(constrnts[2], constraints.HashConstraint);
            assert.instanceOf(pattern.rightPattern.from, constraints.FromConstraint);
        });

        it.should("should include exists constraints", function () {
            var ruleArr = rules.createRule("My Rule", [
                ["exists", "Hash", "h", {name: "name"}],
                ["exists", "string", "s2", "s2 == name", {length: "length"}, "from [1,2,3,4]"]
            ], cb);
            assert.isNotNull(ruleArr);
            assert.lengthOf(ruleArr, 1);

            var rule = ruleArr[0];
            assert.equal(rule.name, "My Rule");
            assert.isNotNull(rule.pattern);
            var pattern = rule.pattern;
            debugger;
            assert.instanceOf(pattern, patterns.CompositePattern);
            assert.instanceOf(pattern.leftPattern, patterns.ExistsPattern);
            assert.instanceOf(pattern.rightPattern, patterns.FromExistsPattern);
            assert.equal(pattern.leftPattern.alias, "h");
            assert.equal(pattern.rightPattern.alias, "s2");
            var constrnts = pattern.leftPattern.constraints;
            assert.lengthOf(constrnts, 3);
            assert.instanceOf(constrnts[0], constraints.ObjectConstraint);
            assert.instanceOf(constrnts[1], constraints.TrueConstraint);
            assert.instanceOf(constrnts[2], constraints.HashConstraint);
            constrnts = pattern.rightPattern.constraints;
            assert.lengthOf(constrnts, 3);
            assert.instanceOf(constrnts[0], constraints.ObjectConstraint);
            assert.instanceOf(constrnts[1], constraints.ReferenceConstraint);
            assert.instanceOf(constrnts[2], constraints.HashConstraint);
            assert.instanceOf(pattern.rightPattern.from, constraints.FromConstraint);
        });
    });

});

