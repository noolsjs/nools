var it = require("it"),
    comb = require("comb"),
    assert = require("assert"),
    atom = require("../lib/atoms"),
    rules = require("../lib/rule");

var TestObject = function () {
};

var cb = function () {
}

it.describe("Rule", function (it) {
    it.describe("#createRule", function (it) {
        it.should("should create a simple rule", function (next) {
            var rule = rules.createRule("My Rule", ["String", "s"], cb);
            assert.isNotNull(rule);
            assert.lengthOf(rule, 1);
            rule = rule[0];
            assert.equal(rule.name, "My Rule");
            assert.isNotNull(rule.pattern);
            var pattern = rule.pattern;
            assert.equal(pattern.alias, "s");
            assert.lengthOf(pattern.atoms, 2);
            assert.instanceOf(pattern.atoms[0], atom.ObjectAtom)
            assert.instanceOf(pattern.atoms[1], atom.TrueAtom)
            assert.strictEqual(rule.cb, cb);
            next();
        });

        it.should("should create a complex rule", function (next) {
            var rule = rules.createRule("My Rule", [
                "String", "s",
                "String", "s2", "s2 == s"
            ], cb);
            assert.isNotNull(rule);
            assert.lengthOf(rule, 1);
            rule = rule[0];
            assert.equal(rule.name, "My Rule");
            assert.isNotNull(rule.pattern);
            var pattern = rule.pattern;
            assert.equal(pattern.alias, "s");
            assert.lengthOf(pattern.atoms, 3);
            assert.instanceOf(pattern.atoms[0], atom.ObjectAtom)
            assert.instanceOf(pattern.atoms[1], atom.TrueAtom)
            assert.instanceOf(pattern.atoms[2], atom.TrueAtom)
            assert.strictEqual(rule.cb, cb);
            next();
        });
    });

    it.run();
});