"use strict";
var it = require("it"),
    assert = require("assert"),
    parser = require("../lib/parser"),
    constraintMatcher = require("../lib/constraintMatcher");
debugger;   
it.describe("constraint matcher", function (it) {

	it.should("call the scoped function", function (next) {
debugger;
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

	return;
     
it.should("create for expressions", function () {
debugger;
            var parsed = parser.parseConstraint("isFalse(a)")
				,atoms = constraintMatcher.toConstraints(parsed, {alias: "a"});
            assert.lengthOf(atoms, 1);
            assert.equal(atoms[0].type, "comparison");

            atoms = constraintMatcher.toConstraints(parser.parseConstraint("a == 1"), {alias: "a"});
            assert.lengthOf(atoms, 1);
            assert.equal(atoms[0].type, "equality");

            atoms = constraintMatcher.toConstraints(parser.parseConstraint("a != 1"), {alias: "a"});
            assert.lengthOf(atoms, 1);
            assert.equal(atoms[0].type, "inequality");

            atoms = constraintMatcher.toConstraints(parser.parseConstraint("a > b"), {alias: "a"});
            assert.lengthOf(atoms, 1);
            assert.equal(atoms[0].type, "reference_gt");
            assert.equal(atoms[0].op, "gt");

            atoms = constraintMatcher.toConstraints(parser.parseConstraint("a >= b"), {alias: "a"});
            assert.lengthOf(atoms, 1);
            assert.equal(atoms[0].type, "reference_gte");
            assert.equal(atoms[0].op, "gte");

            atoms = constraintMatcher.toConstraints(parser.parseConstraint("a < b"), {alias: "a"});
            assert.lengthOf(atoms, 1);
            assert.equal(atoms[0].type, "reference_lt");
            assert.equal(atoms[0].op, "lt");

            atoms = constraintMatcher.toConstraints(parser.parseConstraint("a <= b"), {alias: "a"});
            assert.lengthOf(atoms, 1);
            assert.equal(atoms[0].type, "reference_lte");
            assert.equal(atoms[0].op, "lte");


            atoms = constraintMatcher.toConstraints(parser.parseConstraint("a == b"), {alias: "a"});
            assert.lengthOf(atoms, 1);
            assert.equal(atoms[0].type, "reference_equality");
            assert.equal(atoms[0].op, "eq");

            atoms = constraintMatcher.toConstraints(parser.parseConstraint("a != b"), {alias: "a"});
            assert.lengthOf(atoms, 1);
            assert.equal(atoms[0].type, "reference_inequality");

            atoms = constraintMatcher.toConstraints(parser.parseConstraint("isTrue(b)"), {alias: "a"});
            assert.lengthOf(atoms, 1);
            assert.equal(atoms[0].type, "reference");

            atoms = constraintMatcher.toConstraints(parser.parseConstraint("isTrue(b) && isFalse(a)"), {alias: "a"});
            assert.lengthOf(atoms, 2);
            assert.equal(atoms[0].type, "reference");
            assert.equal(atoms[1].type, "comparison");

            atoms = constraintMatcher.toConstraints(parser.parseConstraint("isTrue(b) || isFalse(a)"), {alias: "a"});
            assert.lengthOf(atoms, 1);
            assert.equal(atoms[0].type, "reference");

            atoms = constraintMatcher.toConstraints(parser.parseConstraint("isNumber(b) || isFalse(a) && b == 1"), {alias: "a"});
            assert.lengthOf(atoms, 1);
            assert.equal(atoms[0].type, "reference");

            atoms = constraintMatcher.toConstraints(parser.parseConstraint("(isNumber(b) || isFalse(a)) && b == 1"), {alias: "a"});
            assert.lengthOf(atoms, 2);
            assert.equal(atoms[0].type, "reference");
            assert.equal(atoms[1].type, "reference_equality");

            atoms = constraintMatcher.toConstraints(parser.parseConstraint("a.name == 'bob' && isFalse(a.flag) && b == 1"), {alias: "a"});
            assert.lengthOf(atoms, 3);
            assert.equal(atoms[0].type, "equality");
            assert.equal(atoms[1].type, "comparison");
            assert.equal(atoms[2].type, "reference_equality");

            atoms = constraintMatcher.toConstraints(parser.parseConstraint("a.name == 'bob' && !a.flag && b == 1"), {alias: "a"});
            assert.lengthOf(atoms, 3);
            assert.equal(atoms[0].type, "equality");
            assert.equal(atoms[1].type, "comparison");
            assert.equal(atoms[2].type, "reference_equality");

            atoms = constraintMatcher.toConstraints(parser.parseConstraint("!(a.bool && a.bool2)"), {alias: "a"});
            assert.lengthOf(atoms, 1);
            assert.equal(atoms[0].type, "comparison");
        });
});
it.run();