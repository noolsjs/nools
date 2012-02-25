var it = require("it"),
    assert = require("assert"), parser = require("../lib/parser"), constraintMatcher = require("../lib/constraintMatcher");

it.describe("constraint matcher", function (it) {

    it.describe("#match", function (it) {
        it.should("check equality", function (next) {
            assert.isTrue(constraintMatcher.match({a : "a"}, parser.parse("a == 'a'")));
            assert.isTrue(constraintMatcher.match({a : 10}, parser.parse("a == 10")));
            assert.isTrue(constraintMatcher.match({a : true}, parser.parse("a == true")));
            assert.isTrue(constraintMatcher.match({a : false}, parser.parse("a == false")));

            assert.isFalse(constraintMatcher.match({a : "b"}, parser.parse("a == 'a'")));
            assert.isFalse(constraintMatcher.match({a : 11}, parser.parse("a == 10")));
            assert.isFalse(constraintMatcher.match({a : "10"}, parser.parse("a == 10")));
            assert.isFalse(constraintMatcher.match({a : true}, parser.parse("a == false")));
            assert.isFalse(constraintMatcher.match({a : false}, parser.parse("a == true")));
            next();
        });

        it.should("check inequality", function (next) {
            assert.isFalse(constraintMatcher.match({a : "a"}, parser.parse("a != 'a'")));
            assert.isFalse(constraintMatcher.match({a : 10}, parser.parse("a != 10")));
            assert.isFalse(constraintMatcher.match({a : true}, parser.parse("a != true")));
            assert.isFalse(constraintMatcher.match({a : false}, parser.parse("a != false")));

            assert.isTrue(constraintMatcher.match({a : "b"}, parser.parse("a != 'a'")));
            assert.isTrue(constraintMatcher.match({a : 11}, parser.parse("a != 10")));
            assert.isTrue(constraintMatcher.match({a : "10"}, parser.parse("a != 10")));
            assert.isTrue(constraintMatcher.match({a : true}, parser.parse("a != false")));
            assert.isTrue(constraintMatcher.match({a : false}, parser.parse("a != true")));
            next();
        });

        it.should("check gt operator", function (next) {
            assert.isTrue(constraintMatcher.match({a : "a"}, parser.parse("a > '0'")));
            assert.isFalse(constraintMatcher.match({a : "0"}, parser.parse("a > '0'")));

            assert.isTrue(constraintMatcher.match({a : 1}, parser.parse("a > 0")));
            assert.isFalse(constraintMatcher.match({a : 0}, parser.parse("a > 0")));

            next();
        });

        it.should("check lt operator", function (next) {

            assert.isTrue(constraintMatcher.match({a : "a"}, parser.parse("a < 'b'")));
            assert.isFalse(constraintMatcher.match({a : "0"}, parser.parse("a < '0'")));

            assert.isTrue(constraintMatcher.match({a : 1}, parser.parse("a < 2")));
            assert.isFalse(constraintMatcher.match({a : 0}, parser.parse("a < 0")));

            next();
        });

        it.should("check gte operator", function (next) {
            assert.isTrue(constraintMatcher.match({a : "a"}, parser.parse("a >= 'a'")));
            assert.isFalse(constraintMatcher.match({a : "0"}, parser.parse("a >= 'a'")));

            assert.isTrue(constraintMatcher.match({a : 1}, parser.parse("a >= 1")));
            assert.isFalse(constraintMatcher.match({a : 0}, parser.parse("a >= 1")));

            next();
        });

        it.should("check lte operator", function (next) {

            assert.isTrue(constraintMatcher.match({a : "a"}, parser.parse("a <= 'a'")));
            assert.isFalse(constraintMatcher.match({a : "0"}, parser.parse("a <= -1")));

            assert.isTrue(constraintMatcher.match({a : 1}, parser.parse("a <= 1")));
            assert.isFalse(constraintMatcher.match({a : 0}, parser.parse("a <= -1")));
            assert.isTrue(constraintMatcher.match({a : -10}, parser.parse("a <= -1")));

            next();
        });

        it.should("check lte operator", function (next) {

            assert.isTrue(constraintMatcher.match({a : "a"}, parser.parse("a <= 'a'")));
            assert.isFalse(constraintMatcher.match({a : "0"}, parser.parse("a <= -1")));

            assert.isTrue(constraintMatcher.match({a : 1}, parser.parse("a <= 1")));
            assert.isFalse(constraintMatcher.match({a : 0}, parser.parse("a <= -1")));
            assert.isTrue(constraintMatcher.match({a : -10}, parser.parse("a <= -1")));

            next();
        });

        it.should("check like operator", function (next) {

            assert.isTrue(constraintMatcher.match({a : "hello"}, parser.parse("a =~ /hello/")));
            assert.isFalse(constraintMatcher.match({a : "hello"}, parser.parse("a =~ /world/")));

            assert.isTrue(constraintMatcher.match({a : "hello world"}, parser.parse("a =~ /^hello world$/")));
            assert.isFalse(constraintMatcher.match({a : "hello world2"}, parser.parse("a =~ /^hello world$/")));

            next();
        });

        it.should("check and operator", function (next) {
            assert.isTrue(constraintMatcher.match({"a" : {hello:"hello", world:"world"}}, parser.parse("a.hello eq 'hello' and a.world eq 'world'")));
            assert.isFalse(constraintMatcher.match({a : {hello:"world", world:"hello"}}, parser.parse("a.hello eq 'hello' and a.world eq 'world'")));
            next();
        });

        it.should("check or operator", function (next) {
            assert.isTrue(constraintMatcher.match({a : {hello:"world", world:"world"}}, parser.parse("a.hello eq 'hello' or a.world eq 'world'")));
            assert.isFalse(constraintMatcher.match({a : {hello:"world", world:"hello"}}, parser.parse("a.hello eq 'hello' or a.world eq 'world'")));
            assert.isTrue(constraintMatcher.match({a : {hello:"hello", world:"hello"}}, parser.parse("a.hello eq a.world")));

            next();
        });

        it.should("check with member operator", function (next) {
            assert.isTrue(constraintMatcher.match({a : {hello : "hello", world : "hello"}}, parser.parse("a.hello eq a.world")));
            assert.isFalse(constraintMatcher.match({a : {hello : "hello", world : "world"}}, parser.parse("a.hello eq a.world")));
            next();
        });

        it.should("check with boolean associativity", function (next) {
            var a = {hello : "hello", world : "world", age : 10, name : "bob"};
            assert.isTrue(constraintMatcher.match({a : a}, parser.parse("a.hello eq a.world || (a.age >= 10 && a.name eq 'bob')")));
            assert.isTrue(constraintMatcher.match({a : a}, parser.parse("(a.hello eq a.world && a.age >= 10) || a.name eq 'bob'")));
            next();
        });

        it.should("check with nested properties", function (next) {
            var a = {hello : "hello"};
            assert.isTrue(constraintMatcher.match({a : a}, parser.parse("a.hello.length eq 5")));
            assert.isFalse(constraintMatcher.match({a : a}, parser.parse("a.hello.size eq 5")));
            next();
        });
    });

});

it.run();