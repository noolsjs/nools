var it = require("it"), comb = require("comb"), assert = require("assert"), nools = require("../index");
it.describe("Rule", function (it) {
    it.describe("#getParamType", function (it) {
        var rule = new nools.Rule("test rule", [], function () {
        });
        it.should("extract the param type", function (next) {
            assert.deepEqual(rule.getParamType(String), {type:String, literal:false, optional:false});
            assert.deepEqual(rule.getParamType("string"), {type:String, literal:false, optional:false});
            assert.deepEqual(rule.getParamType("?string"), {type:String, literal:false, optional:true});

            assert.deepEqual(rule.getParamType(Number), {type:Number, literal:false, optional:false});
            assert.deepEqual(rule.getParamType("number"), {type:Number, literal:false, optional:false});
            assert.deepEqual(rule.getParamType("?number"), {type:Number, literal:false, optional:true});

            assert.deepEqual(rule.getParamType(Boolean), {type:Boolean, literal:false, optional:false});
            assert.deepEqual(rule.getParamType("boolean"), {type:Boolean, literal:false, optional:false});
            assert.deepEqual(rule.getParamType("?boolean"), {type:Boolean, literal:false, optional:true});

            assert.deepEqual(rule.getParamType(RegExp), {type:RegExp, literal:false, optional:false});
            assert.deepEqual(rule.getParamType("regexp"), {type:RegExp, literal:false, optional:false});
            assert.deepEqual(rule.getParamType("?regexp"), {type:RegExp, literal:false, optional:true});

            assert.deepEqual(rule.getParamType(Date), {type:Date, literal:false, optional:false});
            assert.deepEqual(rule.getParamType("date"), {type:Date, literal:false, optional:false});
            assert.deepEqual(rule.getParamType("?date"), {type:Date, literal:false, optional:true});

            assert.deepEqual(rule.getParamType("test"), {type:"test", literal:true, optional:false});
            assert.deepEqual(rule.getParamType("?test"), {type:"?test", literal:true, optional:false});
            var d = new Date();
            assert.deepEqual(rule.getParamType(d), {type:d, literal:true, optional:false});
            assert.deepEqual(rule.getParamType(true), {type:true, literal:true, optional:false});
            assert.deepEqual(rule.getParamType(false), {type:false, literal:true, optional:false});
            assert.deepEqual(rule.getParamType(/a$/i), {type:/a$/i, literal:true, optional:false});
            assert.deepEqual(rule.getParamType(nools.Rule), {type:nools.Rule, literal:false, optional:false});
            assert.deepEqual(rule.getParamType({type:nools.Rule, optional:true}), {type:nools.Rule, literal:false, optional:true});


            next();
        });
    });

    it.describe("#checkType", function (it) {
        var rule = new nools.Rule("test rule", [], function () {
        });
        it.should("match string params correctly", function (next) {
            assert.isTrue(rule.checkType("hello", rule.getParamType(String)));
            assert.isTrue(rule.checkType("hello", rule.getParamType("string")));
            assert.isTrue(rule.checkType("hello", rule.getParamType("?string")));
            assert.isTrue(rule.checkType(undefined, rule.getParamType("?string")));

            assert.isFalse(rule.checkType(1, rule.getParamType(String)));
            assert.isFalse(rule.checkType(1, rule.getParamType("string")));
            assert.isFalse(rule.checkType(1, rule.getParamType("?string")));

            assert.isFalse(rule.checkType(new Date(), rule.getParamType(String)));
            assert.isFalse(rule.checkType(new Date(), rule.getParamType("string")));
            assert.isFalse(rule.checkType(new Date(), rule.getParamType("?string")));

            assert.isFalse(rule.checkType(true, rule.getParamType(String)));
            assert.isFalse(rule.checkType(true, rule.getParamType("string")));
            assert.isFalse(rule.checkType(true, rule.getParamType("?string")));

            assert.isFalse(rule.checkType(false, rule.getParamType(String)));
            assert.isFalse(rule.checkType(false, rule.getParamType("string")));
            assert.isFalse(rule.checkType(false, rule.getParamType("?string")));

            assert.isFalse(rule.checkType(/a$/i, rule.getParamType(String)));
            assert.isFalse(rule.checkType(/a$/i, rule.getParamType("string")));
            assert.isFalse(rule.checkType(/a$/i, rule.getParamType("?string")));

            assert.isFalse(rule.checkType({}, rule.getParamType(String)));
            assert.isFalse(rule.checkType({}, rule.getParamType("string")));
            assert.isFalse(rule.checkType({}, rule.getParamType("?string")));

            assert.isFalse(rule.checkType([], rule.getParamType(String)));
            assert.isFalse(rule.checkType([], rule.getParamType("string")));
            assert.isFalse(rule.checkType(Array, rule.getParamType("?string")));


            assert.isFalse(rule.checkType(String, rule.getParamType(String)));
            assert.isFalse(rule.checkType(String, rule.getParamType("string")));
            assert.isFalse(rule.checkType(String, rule.getParamType("?string")));
            next();
        });

        it.should("match number params correctly", function (next) {

            assert.isTrue(rule.checkType(1, rule.getParamType(Number)));
            assert.isTrue(rule.checkType(1, rule.getParamType("number")));
            assert.isTrue(rule.checkType(1, rule.getParamType("?number")));
            assert.isTrue(rule.checkType(undefined, rule.getParamType("?number")));

            assert.isFalse(rule.checkType("hello", rule.getParamType(Number)));
            assert.isFalse(rule.checkType("hello", rule.getParamType("number")));
            assert.isFalse(rule.checkType("hello", rule.getParamType("?number")));

            assert.isFalse(rule.checkType(new Date(), rule.getParamType(Number)));
            assert.isFalse(rule.checkType(new Date(), rule.getParamType("number")));
            assert.isFalse(rule.checkType(new Date(), rule.getParamType("?number")));

            assert.isFalse(rule.checkType(true, rule.getParamType(Number)));
            assert.isFalse(rule.checkType(true, rule.getParamType("number")));
            assert.isFalse(rule.checkType(true, rule.getParamType("?number")));

            assert.isFalse(rule.checkType(false, rule.getParamType(Number)));
            assert.isFalse(rule.checkType(false, rule.getParamType("number")));
            assert.isFalse(rule.checkType(false, rule.getParamType("?number")));

            assert.isFalse(rule.checkType(/a$/i, rule.getParamType(Number)));
            assert.isFalse(rule.checkType(/a$/i, rule.getParamType("number")));
            assert.isFalse(rule.checkType(/a$/i, rule.getParamType("?number")));

            assert.isFalse(rule.checkType({}, rule.getParamType(Number)));
            assert.isFalse(rule.checkType({}, rule.getParamType("number")));
            assert.isFalse(rule.checkType({}, rule.getParamType("?number")));

            assert.isFalse(rule.checkType([], rule.getParamType(Number)));
            assert.isFalse(rule.checkType([], rule.getParamType("number")));
            assert.isFalse(rule.checkType(Array, rule.getParamType("?number")));

            assert.isFalse(rule.checkType(String, rule.getParamType(Number)));
            assert.isFalse(rule.checkType(String, rule.getParamType("number")));
            assert.isFalse(rule.checkType(String, rule.getParamType("?number")));
            next();
        });

        it.should("match boolean params correctly", function (next) {

            assert.isTrue(rule.checkType(true, rule.getParamType(Boolean)));
            assert.isTrue(rule.checkType(true, rule.getParamType("boolean")));
            assert.isTrue(rule.checkType(true, rule.getParamType("?boolean")));
            assert.isTrue(rule.checkType(false, rule.getParamType(Boolean)));
            assert.isTrue(rule.checkType(false, rule.getParamType("boolean")));
            assert.isTrue(rule.checkType(false, rule.getParamType("?boolean")));
            ;
            assert.isTrue(rule.checkType(undefined, rule.getParamType("?boolean")));

            assert.isFalse(rule.checkType(1, rule.getParamType(Boolean)));
            assert.isFalse(rule.checkType(1, rule.getParamType("boolean")));
            assert.isFalse(rule.checkType(1, rule.getParamType("?boolean")));

            assert.isFalse(rule.checkType("hello", rule.getParamType(Boolean)));
            assert.isFalse(rule.checkType("hello", rule.getParamType("boolean")));
            assert.isFalse(rule.checkType("hello", rule.getParamType("?boolean")));

            assert.isFalse(rule.checkType(new Date(), rule.getParamType(Boolean)));
            assert.isFalse(rule.checkType(new Date(), rule.getParamType("boolean")));
            assert.isFalse(rule.checkType(new Date(), rule.getParamType("?boolean")));

            assert.isFalse(rule.checkType(/a$/i, rule.getParamType(Boolean)));
            assert.isFalse(rule.checkType(/a$/i, rule.getParamType("boolean")));
            assert.isFalse(rule.checkType(/a$/i, rule.getParamType("?boolean")));

            assert.isFalse(rule.checkType({}, rule.getParamType(String)));
            assert.isFalse(rule.checkType({}, rule.getParamType("boolean")));
            assert.isFalse(rule.checkType({}, rule.getParamType("?boolean")));

            assert.isFalse(rule.checkType(String, rule.getParamType(String)));
            assert.isFalse(rule.checkType(String, rule.getParamType("boolean")));
            assert.isFalse(rule.checkType(String, rule.getParamType("?boolean")));
            next();
        });

        it.should("match date params correctly", function (next) {

            assert.isTrue(rule.checkType(new Date(), rule.getParamType(Date)));
            assert.isTrue(rule.checkType(new Date(), rule.getParamType("date")));
            assert.isTrue(rule.checkType(new Date(), rule.getParamType("?date")));
            assert.isTrue(rule.checkType(new Date(), rule.getParamType("?date")));
            assert.isTrue(rule.checkType(undefined, rule.getParamType("?date")));

            assert.isFalse(rule.checkType(1, rule.getParamType(Date)));
            assert.isFalse(rule.checkType(1, rule.getParamType("date")));
            assert.isFalse(rule.checkType(1, rule.getParamType("?date")));

            assert.isFalse(rule.checkType("hello", rule.getParamType(Date)));
            assert.isFalse(rule.checkType("hello", rule.getParamType("date")));
            assert.isFalse(rule.checkType("hello", rule.getParamType("?date")));

            assert.isFalse(rule.checkType(true, rule.getParamType(Date)));
            assert.isFalse(rule.checkType(true, rule.getParamType("date")));
            assert.isFalse(rule.checkType(true, rule.getParamType("?date")));

            assert.isFalse(rule.checkType(false, rule.getParamType(Date)));
            assert.isFalse(rule.checkType(false, rule.getParamType("date")));
            assert.isFalse(rule.checkType(false, rule.getParamType("?date")));

            assert.isFalse(rule.checkType(/a$/i, rule.getParamType(Date)));
            assert.isFalse(rule.checkType(/a$/i, rule.getParamType("date")));
            assert.isFalse(rule.checkType(/a$/i, rule.getParamType("?date")));

            assert.isFalse(rule.checkType({}, rule.getParamType(Date)));
            assert.isFalse(rule.checkType({}, rule.getParamType("date")));
            assert.isFalse(rule.checkType({}, rule.getParamType("?date")));

            assert.isFalse(rule.checkType([], rule.getParamType(Date)));
            assert.isFalse(rule.checkType([], rule.getParamType("date")));
            assert.isFalse(rule.checkType(Array, rule.getParamType("?date")));

            assert.isFalse(rule.checkType(String, rule.getParamType(Date)));
            assert.isFalse(rule.checkType(String, rule.getParamType("date")));
            assert.isFalse(rule.checkType(String, rule.getParamType("?date")));
            next();
        });

        it.should("match regexp params correctly", function (next) {
            assert.isTrue(rule.checkType(/a$/i, rule.getParamType(RegExp)));
            assert.isTrue(rule.checkType(/a$/i, rule.getParamType("regexp")));
            assert.isTrue(rule.checkType(/a$/i, rule.getParamType("?regexp")));
            assert.isTrue(rule.checkType(undefined, rule.getParamType("?regexp")));

            assert.isFalse(rule.checkType(new Date(), rule.getParamType(RegExp)));
            assert.isFalse(rule.checkType(new Date(), rule.getParamType("regexp")));
            assert.isFalse(rule.checkType(new Date(), rule.getParamType("?regexp")));
            assert.isFalse(rule.checkType(new Date(), rule.getParamType("?regexp")));

            assert.isFalse(rule.checkType(1, rule.getParamType(RegExp)));
            assert.isFalse(rule.checkType(1, rule.getParamType("regexp")));
            assert.isFalse(rule.checkType(1, rule.getParamType("?regexp")));

            assert.isFalse(rule.checkType("hello", rule.getParamType(RegExp)));
            assert.isFalse(rule.checkType("hello", rule.getParamType("regexp")));
            assert.isFalse(rule.checkType("hello", rule.getParamType("?regexp")));

            assert.isFalse(rule.checkType(true, rule.getParamType(RegExp)));
            assert.isFalse(rule.checkType(true, rule.getParamType("regexp")));
            assert.isFalse(rule.checkType(true, rule.getParamType("?regexp")));

            assert.isFalse(rule.checkType(false, rule.getParamType(RegExp)));
            assert.isFalse(rule.checkType(false, rule.getParamType("regexp")));
            assert.isFalse(rule.checkType(false, rule.getParamType("?regexp")));


            assert.isFalse(rule.checkType({}, rule.getParamType(RegExp)));
            assert.isFalse(rule.checkType({}, rule.getParamType("regexp")));
            assert.isFalse(rule.checkType({}, rule.getParamType("?regexp")));

            assert.isFalse(rule.checkType([], rule.getParamType(RegExp)));
            assert.isFalse(rule.checkType([], rule.getParamType("regexp")));
            assert.isFalse(rule.checkType(Array, rule.getParamType("?regexp")));

            assert.isFalse(rule.checkType(String, rule.getParamType(RegExp)));
            assert.isFalse(rule.checkType(String, rule.getParamType("regexp")));
            assert.isFalse(rule.checkType(String, rule.getParamType("?regexp")));
            next();
        });

        it.should("match array params correctly", function (next) {
            assert.isTrue(rule.checkType([1, 2], rule.getParamType(Array)));
            assert.isTrue(rule.checkType([1, 2], rule.getParamType("array")));
            assert.isTrue(rule.checkType([1, 2], rule.getParamType("?array")));
            assert.isTrue(rule.checkType(undefined, rule.getParamType("?array")));


            assert.isFalse(rule.checkType(/a$/i, rule.getParamType(Array)));
            assert.isFalse(rule.checkType(/a$/i, rule.getParamType("array")));
            assert.isFalse(rule.checkType(/a$/i, rule.getParamType("?array")));

            assert.isFalse(rule.checkType(new Date(), rule.getParamType(Array)));
            assert.isFalse(rule.checkType(new Date(), rule.getParamType("array")));
            assert.isFalse(rule.checkType(new Date(), rule.getParamType("?array")));
            assert.isFalse(rule.checkType(new Date(), rule.getParamType("?array")));

            assert.isFalse(rule.checkType(1, rule.getParamType(Array)));
            assert.isFalse(rule.checkType(1, rule.getParamType("array")));
            assert.isFalse(rule.checkType(1, rule.getParamType("?array")));

            assert.isFalse(rule.checkType("hello", rule.getParamType(Array)));
            assert.isFalse(rule.checkType("hello", rule.getParamType("array")));
            assert.isFalse(rule.checkType("hello", rule.getParamType("?array")));

            assert.isFalse(rule.checkType(true, rule.getParamType(Array)));
            assert.isFalse(rule.checkType(true, rule.getParamType("array")));
            assert.isFalse(rule.checkType(true, rule.getParamType("?array")));

            assert.isFalse(rule.checkType(false, rule.getParamType(Array)));
            assert.isFalse(rule.checkType(false, rule.getParamType("array")));
            assert.isFalse(rule.checkType(false, rule.getParamType("?array")));


            assert.isFalse(rule.checkType({}, rule.getParamType(Array)));
            assert.isFalse(rule.checkType({}, rule.getParamType("array")));
            assert.isFalse(rule.checkType({}, rule.getParamType("?array")));

            assert.isFalse(rule.checkType(String, rule.getParamType(Array)));
            assert.isFalse(rule.checkType(String, rule.getParamType("array")));
            assert.isFalse(rule.checkType(String, rule.getParamType("?array")));
            next();
        });

        it.should("match generic object correctly", function (next) {
            assert.isTrue(rule.checkType(rule, rule.getParamType(nools.Rule)));

            assert.isFalse(rule.checkType(/a$/i, rule.getParamType(nools.Rule)));
            assert.isFalse(rule.checkType(new Date(), rule.getParamType(nools.Rule)));
            assert.isFalse(rule.checkType(1, rule.getParamType(nools.Rule)));
            assert.isFalse(rule.checkType("hello", rule.getParamType(nools.Rule)));
            assert.isFalse(rule.checkType(true, rule.getParamType(nools.Rule)));
            assert.isFalse(rule.checkType(false, rule.getParamType(nools.Rule)));
            assert.isFalse(rule.checkType({}, rule.getParamType(nools.Rule)));
            assert.isFalse(rule.checkType(String, rule.getParamType(nools.Rule)));
            next();
        });

        it.should("match literal params correctly", function (next) {
            assert.isTrue(rule.checkType("hello", rule.getParamType("hello")));
            assert.isFalse(rule.checkType("wolrd", rule.getParamType("hello")));

            assert.isTrue(rule.checkType(true, rule.getParamType(true)));
            assert.isFalse(rule.checkType(false, rule.getParamType(true)));

            assert.isTrue(rule.checkType(false, rule.getParamType(false)));
            assert.isFalse(rule.checkType(true, rule.getParamType(false)));

            var d = new Date(), d2 = comb.daysFromNow(1);
            assert.isTrue(rule.checkType(d, rule.getParamType(d)));
            assert.isFalse(rule.checkType(d2, rule.getParamType(d)));

            assert.isTrue(rule.checkType([1, 2], rule.getParamType([1, 2])));
            assert.isFalse(rule.checkType([1, 2, 3], rule.getParamType([1, 2])));

            next();
        });
    });

    it.describe("#apply", function (it) {

        it.should("apply correct rules", function (next) {
            var count = 0, matched = [];
            var rule = new nools.Rule("test rule", [
                [String, "a", "a eq 'hello' || a == 'world'"],
                [Number, "num", "num >= 10 || num <= 0"],
                [Object, "obj", "obj.name == 'bob' || obj.age >= 10"],
                [String, "str", "str =~ /hello world$/"]
            ], function (env, match) {
                matched.push(match);
               count++;
            });
            assert.isTrue(rule.apply("hello"));
            assert.isTrue(rule.apply("world"));
            assert.isTrue(rule.apply(10));
            assert.isTrue(rule.apply(0));
            assert.isTrue(rule.apply({name : "bob", age : 10}));
            assert.isTrue(rule.apply("hello world"));

            assert.isFalse(rule.apply("hello1"));
            assert.isFalse(rule.apply("world2"));
            assert.isFalse(rule.apply(9));
            assert.isFalse(rule.apply(1));
            assert.isFalse(rule.apply({name : "bobby", age : 9}));
            assert.isFalse(rule.apply(/hello$/));
            assert.equal(count, 6);
            assert.deepEqual(matched, ["a", "a", "num", "num", "obj", "str"]);
            next();
        });

    });
    it.run();
});