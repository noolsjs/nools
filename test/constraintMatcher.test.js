"use strict";
var it = require("it"),
    assert = require("assert"),
    parser = require("../lib/parser"),
    constraintMatcher = require("../lib/constraintMatcher");

it.describe("constraint matcher", function (it) {

    it.describe("#match", function (it) {
        it.should("check equality", function () {
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a == 'a'"))({a: "a"}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a eq 'a'"))({a: "a"}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a == 10"))({a: 10}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a eq 10"))({a: 10}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a == true"))({a: true}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a eq true"))({a: true}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a == false"))({a: false}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a eq false"))({a: false}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a == 10"))({a: "10"}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a eq 10"))({a: "10"}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a == null"))({a: null}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a ==null"))({a: null}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a eq null"))({a: null}));

            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a == 'a'"))({a: "b"}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a eq 'a'"))({a: "b"}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a == 10"))({a: 11}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a eq 10"))({a: 11}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a == false"))({a: true}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a eq false"))({a: true}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a == true"))({a: false}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a eq true"))({a: false}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a == null"))({a: false}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a ==null"))({a: false}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a eq null"))({a: false}));

        });

        it.should("check strict equality", function () {
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a === 'a'"))({a: "a"}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a seq 'a'"))({a: "a"}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a === 10"))({a: 10}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a seq 10"))({a: 10}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a === true"))({a: true}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a ===true"))({a: true}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a === false"))({a: false}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a ===false"))({a: false}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a seq false"))({a: false}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a === null"))({a: null}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a ===null"))({a: null}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a seq null"))({a: null}));

            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a === 'a'"))({a: "b"}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a seq 'a'"))({a: "b"}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a === 10"))({a: 11}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a seq 10"))({a: 11}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a === 10"))({a: "10"}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a seq 10"))({a: "10"}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a === false"))({a: true}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a ===false"))({a: true}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a seq false"))({a: true}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a === true"))({a: false}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a ===true"))({a: false}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a seq true"))({a: false}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a === null"))({a: false}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a ===null"))({a: false}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a seq null"))({a: false}));

        });

        it.should("check inequality", function () {
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a != 'a'"))({a: "a"}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a neq 'a'"))({a: "a"}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a != 10"))({a: 10}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a neq 10"))({a: 10}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a != true"))({a: true}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a !=true"))({a: true}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a neq true"))({a: true}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a != false"))({a: false}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a !=false"))({a: false}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a neq false"))({a: false}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a != 10"))({a: "10"}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a neq 10"))({a: "10"}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a != null"))({a: null}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a !=null"))({a: null}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a neq null"))({a: null}));

            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a != 'a'"))({a: "b"}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a neq 'a'"))({a: "b"}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a != 10"))({a: 11}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a neq 10"))({a: 11}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a != false"))({a: true}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a !=false"))({a: true}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a neq false"))({a: true}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a != true"))({a: false}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a !=true"))({a: false}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a neq true"))({a: false}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a != null"))({a: false}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a !=null"))({a: false}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a neq null"))({a: false}));

        });

        it.should("check strict inequality", function () {
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a !== 'a'"))({a: "a"}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a sneq 'a'"))({a: "a"}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a !== 10"))({a: 10}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a sneq 10"))({a: 10}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a !== true"))({a: true}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a !==true"))({a: true}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a sneq true"))({a: true}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a !== false"))({a: false}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a !==false"))({a: false}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a sneq false"))({a: false}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a !== null"))({a: null}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a !==null"))({a: null}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a sneq null"))({a: null}));

            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a !== 'a'"))({a: "b"}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a sneq 'a'"))({a: "b"}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a !== 10"))({a: 11}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a sneq 10"))({a: 11}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a !== 10"))({a: "10"}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a sneq 10"))({a: "10"}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a !== false"))({a: true}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a !==false"))({a: true}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a sneq false"))({a: true}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a !== true"))({a: false}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a !==true"))({a: false}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a sneq true"))({a: false}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a !== null"))({a: false}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a !==null"))({a: false}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a sneq null"))({a: false}));
        });

        it.should("check gt operator", function () {
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a > '0'"))({a: "a"}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a gt '0'"))({a: "a"}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a > '0'"))({a: "0"}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a gt '0'"))({a: "0"}));

            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a > 0"))({a: 1}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a gt 0"))({a: 1}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a > 0"))({a: 0}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a gt 0"))({a: 0}));


        });

        it.should("check lt operator", function () {

            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a < 'b'"))({a: "a"}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a lt 'b'"))({a: "a"}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a < '0'"))({a: "0"}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a lt '0'"))({a: "0"}));

            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a < 2"))({a: 1}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a lt 2"))({a: 1}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a < 0"))({a: 0}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a lt 0"))({a: 0}));


        });

        it.should("check gte operator", function () {
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a >= 'a'"))({a: "a"}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a gte 'a'"))({a: "a"}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a >= 'a'"))({a: "0"}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a gte 'a'"))({a: "0"}));

            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a >= 1"))({a: 1}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a gte 1"))({a: 1}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a >= 1"))({a: 0}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a gte 1"))({a: 0}));


        });

        it.should("check lte operator", function () {

            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a <= 'a'"))({a: "a"}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a lte 'a'"))({a: "a"}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a <= -1"))({a: "0"}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a lte -1"))({a: "0"}));

            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a <= 1"))({a: 1}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a lte 1"))({a: 1}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a <= -1"))({a: 0}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a lte -1"))({a: 0}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a <= -1"))({a: -10}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a lte -1"))({a: -10}));


        });

        it.should("check like operator", function () {

            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a =~ /hello/"))({a: "hello"}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a like /hello/"))({a: "hello"}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a =~ /world/"))({a: "hello"}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a like /world/"))({a: "hello"}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a =~ /he\\/llo/ || a =~ /world/"))({a: "he/llo"}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a like /he\\/llo/ || a like /world/"))({a: "he/llo"}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a =~ /he\\/llo/ || a =~ /world/"))({a: "world"}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a like /he\\/llo/ || a like /world/"))({a: "world"}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a =~ /he\\/llo/ || a =~ /world/"))({a: "a"}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a like /he\\/llo/ || a like /world/"))({a: "a"}));

            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a =~ /^hello world$/"))({a: "hello world"}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a like /^hello world$/"))({a: "hello world"}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a =~ /^hello world$/"))({a: "hello world2"}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a like /^hello world$/"))({a: "hello world2"}));

        });

        it.should("check notLike operator", function () {

            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a !=~ /hello/"))({a: "hello"}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a notLike /hello/"))({a: "hello"}));

            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a !=~ /world/"))({a: "hello"}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a notLike /world/"))({a: "hello"}));

            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a !=~ /he\\/llo/ || a =~ /world/"))({a: "he/llo"}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a notLike /he\\/llo/ || a =~ /world/"))({a: "he/llo"}));

            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a !=~ /he\\/llo/ && a !=~ /world/"))({a: "world"}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a notLike /he\\/llo/ && a notLike /world/"))({a: "world"}));

            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a !=~ /he\\/llo/ || a =~ /world/"))({a: "a"}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a notLike /he\\/llo/ || a =~ /world/"))({a: "a"}));

            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a !=~ /^hello world$/"))({a: "hello world"}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a notLike /^hello world$/"))({a: "hello world"}));

            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a !=~ /^hello world$/"))({a: "hello world2"}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a notLike /^hello world$/"))({a: "hello world2"}));

        });

        it.should("check and operator", function () {
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a.hello eq 'hello' and a.world eq 'world'"))({"a": {hello: "hello", world: "world"}}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a.hello eq 'hello' and a.world eq 'world'"))({a: {hello: "world", world: "hello"}}));

        });

        it.should("check or operator", function () {
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a.hello eq 'hello' or a.world eq 'world'"))({a: {hello: "world", world: "world"}}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a.hello eq 'hello' or a.world eq 'world'"))({a: {hello: "world", world: "hello"}}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a.hello eq a.world"))({a: {hello: "hello", world: "hello"}}));


        });

        it.should("check with member operator", function () {
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a.hello eq a.world"))({a: {hello: "hello", world: "hello"}}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a.hello eq a.world"))({a: {hello: "hello", world: "world"}}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a['hello'] eq a['world']"))({a: {hello: "hello", world: "world"}}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a[b] eq a[c]"))({a: {hello: "hello", world: "world"}, b: "hello", c: "world"}));
        });

        it.should("check with in operator", function () {
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a in [1,2,3,4]"))({a: 1}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a in ['a','b','c']"))({a: 1}));
        });

        it.should("check with notIn operator", function () {
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a notIn [1,2,3,4]"))({a: 1}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a notIn ['a','b','c']"))({a: 1}));
        });

        it.should("allow properties with in", function () {
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a.in == 1"))({a: {"in": 1}}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a.innoculated == 1"))({a: {innoculated: 1}}));
        });

        it.should("check with boolean associativity", function () {
            var a = {hello: "hello", world: "world", age: 10, name: "bob"};
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a.hello eq a.world || (a.age >= 10 && a.name eq 'bob')"))({a: a}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("(a.hello eq a.world && a.age >= 10) || a.name eq 'bob'"))({a: a}));

        });

        it.should("check with nested properties", function () {
            var a = {hello: "hello"};
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a.hello.length eq 5"))({a: a}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a.hello.size eq 5"))({a: a}));

        });

        it.should("check with function", function () {
            var a = {
                hello: "hello",
                myFunc: function () {
                    return this.hello + " world";
                }
            };
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a.hello.length eq 5 && a.myFunc() eq 'hello world'"))({a: a}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a.hello.size eq 5 && a.myFunc() eq 'hello world'"))({a: a}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a.hello eq 5 && a.myFunc() eq 'hello'"))({a: a}));
        });

        it.should("check with functions and identifier args", function () {
            var a = {
                hello: "hello",
                myFunc: function () {
                    return this.hello + " world";
                }
            };
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a.hello.length eq 5 && a.myFunc(b) eq 'hello world'"))({a: a, b: 'world'}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a.hello.size eq 5 && a.myFunc(b) eq 'hello world'"))({a: a, b: 'world'}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a.hello eq 5 && a.myFunc(b) eq 'hello'"))({a: a, b: 'world'}));
        });

        it.should("check with functions in a deep property chain and identifier args", function () {
            var a = {
                hello: "hello",
                b: {
                    c: {
                        myFunc: function () {
                            return a.hello + " world";
                        }
                    }
                }
            };
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a.hello.length eq 5 && a.b.c.myFunc(b) eq 'hello world'"))({a: a, b: 'world'}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a.hello.size eq 5 && a.b.c.myFunc(b) eq 'hello world'"))({a: a, b: 'world'}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a.hello eq 5 && a.b.c.myFunc(b) eq 'hello'"))({a: a, b: 'world'}));
        });

        it.should("check with functions in a deep property chain that returns an object and identifier args", function () {
            var a = {
                hello: "hello",
                b: {
                    c: {
                        myFunc: function () {
                            return {
                                d: {
                                    myFunc: function () {
                                        return a.hello + " world";
                                    }
                                }
                            };
                        }
                    }
                }
            };
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a.hello.length eq 5 && a.b.c.myFunc().d.myFunc(b) eq 'hello world'"))({a: a, b: 'world'}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a.hello.size eq 5 && a.b.c.myFunc().d.myFunc(b) eq 'hello world'"))({a: a, b: 'world'}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a.hello eq 5 && a.b.c.myFunc().d.myFunc(b) eq 'hello'"))({a: a, b: 'world'}));
        });

        it.should("have date helpers", function () {
            var a = {myDate: new Date()};
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a.myDate lte now()"))({a: a}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a.myDate lte Date(" + new Date().getFullYear() + ")"))({a: a}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a.myDate gt yearsAgo(10)"))({a: a}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a.myDate lt yearsFromNow(10)"))({a: a}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a.myDate gt monthsAgo(10)"))({a: a}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a.myDate lt monthsFromNow(10)"))({a: a}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a.myDate gt daysAgo(10)"))({a: a}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a.myDate lt daysFromNow(10)"))({a: a}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a.myDate gt hoursAgo(10)"))({a: a}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a.myDate lt hoursFromNow(10)"))({a: a}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a.myDate gt minutesAgo(10)"))({a: a}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a.myDate lt minutesFromNow(10)"))({a: a}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a.myDate gt secondsAgo(10)"))({a: a}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a.myDate lt secondsFromNow(10)"))({a: a}));
        });

        it.should("create have type helpers", function () {
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("isTrue(a)"))({a: true}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("isTrue(a)"))({a: false}));

            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("isFalse(a)"))({a: false}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("isFalse(a)"))({a: true}));

            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("isNumber(a)"))({a: 1}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("isNumber(a)"))({a: false}));

            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("isBoolean(a)"))({a: true}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("isBoolean(a)"))({a: 1}));

            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("isDate(a)"))({a: new Date()}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("isDate(a)"))({a: 1}));

            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("isRegExp(a)"))({a: /a/}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("isRegExp(a)"))({a: "/a/"}));

            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("isDefined(a)"))({a: 1}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("isDefined(a)"))({a: undefined}));

            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("isUndefined(a)"))({a: undefined}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("isUndefined(a)"))({a: false}));

            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("isNotNull(a)"))({a: 1}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("isNotNull(a)"))({a: null}));

            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("isEmpty(a)"))({a: {}}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("isEmpty(a)"))({a: {b: "c"}}));

            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("lengthOf(a, 3)"))({a: [1, 2, 3]}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("lengthOf(a, 3)"))({a: [1]}));

            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("deepEqual(a, b) && deepEqual(c,d) && deepEqual(e, f)"))({
                a: [1, 2, 3],
                b: [1, 2, 3],
                c: new Date(2000, 10, 10, 10, 10, 10),
                d: new Date(2000, 10, 10, 10, 10, 10),
                e: {
                    a: new Date(2000, 10, 10, 10, 10, 10),
                    b: new Date(2000, 10, 10, 10, 10, 10)
                },
                f: {
                    a: new Date(2000, 10, 10, 10, 10, 10),
                    b: new Date(2000, 10, 10, 10, 10, 10)
                }
            }));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("deepEqual(a, b)"))({a: [1], b: new Date()}));
        });

        it.should("check truthy statements", function () {
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a"))({a: "a"}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a"))({a: 10}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a"))({a: true}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("!a"))({a: false}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("a && b"))({a: true, b: true}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("!(a && b)"))({a: false, b: false}));
            assert.isTrue(constraintMatcher.getMatcher(parser.parseConstraint("!(a || b)"))({a: false, b: false}));

            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("!a"))({a: "b"}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("!a == 10"))({a: 11}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("!a == 10"))({a: "10"}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("!a"))({a: true}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("a"))({a: false}));
            assert.isFalse(constraintMatcher.getMatcher(parser.parseConstraint("!(a && b)"))({a: true, b: true}));
        });
    });

    it.describe("#toConstraints", function (it) {

        it.should("create for expressions", function () {
            var atoms = constraintMatcher.toConstraints(parser.parseConstraint("isFalse(a)"), {alias: "a"});
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

        it.should("create correct pattern depending on scope", function () {
            var atoms = constraintMatcher.toConstraints(parser.parseConstraint("isEmail(a)"), {alias: "a", scope: {isEmail: function () {
            }}});
            assert.lengthOf(atoms, 1);
            assert.equal(atoms[0].type, "comparison");

            atoms = constraintMatcher.toConstraints(parser.parseConstraint("isEmail(a)"), {alias: "a"});
            assert.lengthOf(atoms, 1);
            assert.equal(atoms[0].type, "reference");
        });

        it.should("return a custom CustomConstraint if called with a function", function(){
            var atoms = constraintMatcher.toConstraints(function(){
                return true
            });
            assert.lengthOf(atoms, 1);
            assert.equal(atoms[0].type, "custom");
        });

    });

    it.describe("#toJs", function (it) {

        it.should("create js equvalent expression", function () {
            assert.isTrue(constraintMatcher.toJs(parser.parseConstraint("isFalse(a)"))({a: false}));
            assert.isFalse(constraintMatcher.toJs(parser.parseConstraint("isFalse(a)"))({a: true}));

            assert.isTrue(constraintMatcher.toJs(parser.parseConstraint("isTrue(b)"))({b: true}));
            assert.isFalse(constraintMatcher.toJs(parser.parseConstraint("isTrue(b)"))({b: false}));

            assert.isTrue(constraintMatcher.toJs(parser.parseConstraint("isFalse(a) && isTrue(b)"))({a: false, b: true}));
            assert.isFalse(constraintMatcher.toJs(parser.parseConstraint("isFalse(a) && isTrue(b)"))({a: false, b: false}));

            assert.isTrue(constraintMatcher.toJs(parser.parseConstraint("isFalse(a) || isTrue(b)"))({a: true, b: true}));
            assert.isFalse(constraintMatcher.toJs(parser.parseConstraint("isFalse(a) || isTrue(b)"))({a: true, b: false}));

            assert.isTrue(constraintMatcher.toJs(parser.parseConstraint("isNumber(b) || isFalse(a) && b == 1"))({b: 1, a: false}));
            assert.isFalse(constraintMatcher.toJs(parser.parseConstraint("isNumber(b) || isFalse(a) && b == 1"))({b: "a", a: true}));

            assert.isTrue(constraintMatcher.toJs(parser.parseConstraint("(isNumber(b) || isFalse(a)) && b == 1"))({b: 1, a: false}));
            assert.isTrue(constraintMatcher.toJs(parser.parseConstraint("(isNumber(b) || isFalse(a)) && b == 1"))({b: 1, a: true}));

            assert.isTrue(constraintMatcher.toJs(parser.parseConstraint("(isNumber(b) || isFalse(a)) || b == 1"))({b: 1, a: true}));

            assert.isTrue(constraintMatcher.toJs(parser.parseConstraint("(isNumber(b) || isFalse(a)) || b == 1"))({b: 2, a: false}));
        });

    });

    it.describe("#getIdentifiers", function (it) {

        it.should("create the correct atoms for and expressions", function () {
            var identifiers = constraintMatcher.getIdentifiers(parser.parseConstraint("isFalse(a)"), "a");
            assert.lengthOf(identifiers, 2);
            assert.deepEqual(identifiers, ["isFalse", "a"]);

            identifiers = constraintMatcher.getIdentifiers(parser.parseConstraint("a.b.c == false"), "a");
            assert.lengthOf(identifiers, 1);
            assert.deepEqual(identifiers, ["a"]);

            identifiers = constraintMatcher.getIdentifiers(parser.parseConstraint("a.b() == false"), "a");
            assert.lengthOf(identifiers, 1);
            assert.deepEqual(identifiers, ["a"]);

            identifiers = constraintMatcher.getIdentifiers(parser.parseConstraint("b(a) == false"), "a");
            assert.lengthOf(identifiers, 2);
            assert.deepEqual(identifiers, ["b", "a"]);

            identifiers = constraintMatcher.getIdentifiers(parser.parseConstraint("a in [1,b,c]"), "a");
            assert.lengthOf(identifiers, 3);
            assert.deepEqual(identifiers, ["a", "b", "c"]);

            identifiers = constraintMatcher.getIdentifiers(parser.parseConstraint("a.hello.length eq 5 && a.myFunc() eq 'hello world'"), "a");
            assert.lengthOf(identifiers, 1);
            assert.deepEqual(identifiers, ["a"]);
        });

    });

    it.describe("#equals", function (it) {
        it.should("return true when equal", function () {
            assert.isTrue(constraintMatcher.equal(
                parser.parseConstraint("p.soreThroat == true && p.fever in ['mild', 'high']"),
                parser.parseConstraint("p.soreThroat == true && p.fever in ['mild', 'high']")));
            assert.isTrue(constraintMatcher.equal(
                parser.parseConstraint("f.value == -1 && (f.sequence == 1 || f.sequence == 2)"),
                parser.parseConstraint("f.value == -1 && (f.sequence == 1 || f.sequence == 2)")));
            assert.isTrue(constraintMatcher.equal(parser.parseConstraint("a.hello.length eq 5"),
                parser.parseConstraint("a.hello.length eq 5")));
            assert.isTrue(constraintMatcher.equal(parser.parseConstraint("a && b"), parser.parseConstraint("a && b")));
            assert.isTrue(constraintMatcher.equal(parser.parseConstraint("[]"), parser.parseConstraint("[]")));
            assert.isTrue(constraintMatcher.equal(parser.parseConstraint("a.in == [1,2,3]"), parser.parseConstraint("a.in == [1,2,3]")));
            assert.isTrue(constraintMatcher.equal(parser.parseConstraint("a + b"), parser.parseConstraint("a + b")));
            assert.isTrue(constraintMatcher.equal(parser.parseConstraint("a > b"), parser.parseConstraint("a > b")));
            assert.isTrue(constraintMatcher.equal(parser.parseConstraint("a == b"), parser.parseConstraint("a == b")));
            assert.isTrue(constraintMatcher.equal(parser.parseConstraint("a && b || c"), parser.parseConstraint("a && b || c")));
            assert.isTrue(constraintMatcher.equal(parser.parseConstraint("hello()"), parser.parseConstraint("hello()")));
            assert.isTrue(constraintMatcher.equal(parser.parseConstraint("a.hello(a, b)"), parser.parseConstraint("a.hello(a, b)")));
            assert.isTrue(constraintMatcher.equal(parser.parseConstraint("hello(a, b, c, e)"), parser.parseConstraint("hello(a, b, c, e)")));
            assert.isTrue(constraintMatcher.equal(parser.parseConstraint("Date('2001-02-01')"), parser.parseConstraint("Date('2001-02-01')")));
        });

        it.should("return false when not equal", function () {
            assert.isFalse(constraintMatcher.equal(
                parser.parseConstraint("f.value == 1 && (f.sequence == 1 || f.sequence == 2)"),
                parser.parseConstraint("f.value == -1 && (f.sequence == 1 || f.sequence == 2)")
            ));
            assert.isFalse(constraintMatcher.equal(
                parser.parseConstraint("p.soreThroat == true && p.fever in ['mild', 'high']"),
                parser.parseConstraint("f.value == -1 && (f.sequence == 1 || f.sequence == 2)")
            ));
            assert.isFalse(constraintMatcher.equal(
                parser.parseConstraint("f.value == -1 && (f.sequence == 1 || f.sequence == 2)"),
                parser.parseConstraint("p.soreThroat == true && p.fever in ['mild', 'high']")));
            assert.isFalse(constraintMatcher.equal(parser.parseConstraint("a.hello.length eq 5"),
                parser.parseConstraint("a && b")
            ));
            assert.isFalse(constraintMatcher.equal(parser.parseConstraint("a && b"), parser.parseConstraint("a.hello.length eq 5")));
            assert.isFalse(constraintMatcher.equal(parser.parseConstraint("[]"), parser.parseConstraint("a.in == [1,2,3]")));
            assert.isFalse(constraintMatcher.equal(parser.parseConstraint("a.in == [1,2,3]"), parser.parseConstraint("[]")));
            assert.isFalse(constraintMatcher.equal(parser.parseConstraint("a + b"), parser.parseConstraint("a > b")));
            assert.isFalse(constraintMatcher.equal(parser.parseConstraint("a > b"), parser.parseConstraint("a + b")));
            assert.isFalse(constraintMatcher.equal(parser.parseConstraint("a == b"), parser.parseConstraint("a && b || c")));
            assert.isFalse(constraintMatcher.equal(parser.parseConstraint("a && b || c"), parser.parseConstraint("a == b")));
            assert.isFalse(constraintMatcher.equal(parser.parseConstraint("hello()"), parser.parseConstraint("a.hello(a, b)")));
            assert.isFalse(constraintMatcher.equal(parser.parseConstraint("a.hello(a, b)"), parser.parseConstraint("hello()")));
            assert.isFalse(constraintMatcher.equal(parser.parseConstraint("hello(a, b, c, e)"), parser.parseConstraint("Date('2001-02-01')")));
            assert.isFalse(constraintMatcher.equal(parser.parseConstraint("Date('2001-02-01')"), parser.parseConstraint("hello(a, b, c, e)")));
        });
    });

    it.describe(".getIndexableProperties", function (it) {

        it.should("get properties with no functions", function () {

            var operators = ["==", "!=", ">", ">=", "<", "<="], props, op;
            for (var i = 0, l = operators.length; i < l; i++) {
                op = operators[i];
                props = constraintMatcher.getIndexableProperties(parser.parseConstraint("a " + op + " b"), "a");
                assert.deepEqual(props, ["a", "b"]);
                props = constraintMatcher.getIndexableProperties(parser.parseConstraint("a.b " + op + " b"), "a");
                assert.deepEqual(props, ["a.b", "b"]);
                props = constraintMatcher.getIndexableProperties(parser.parseConstraint("a " + op + " b.c"), "a");
                assert.deepEqual(props, ["a", "b.c"]);
                props = constraintMatcher.getIndexableProperties(parser.parseConstraint("a.b.c.d " + op + " b.c.d.e "), "a");
                assert.deepEqual(props, ["a.b.c.d", "b.c.d.e"]);
                props = constraintMatcher.getIndexableProperties(parser.parseConstraint("(a " + op + " b)"), "a");
                assert.deepEqual(props, ["a", "b"]);
            }

        });

        it.should("not get non indexable constraints", function () {
            var props = constraintMatcher.getIndexableProperties(parser.parseConstraint("a.b.c.d == b.c.d.e || a.b.c == b.c.d "), "a");
            assert.deepEqual(props, []);

            props = constraintMatcher.getIndexableProperties(parser.parseConstraint("a.b.c.d == b.c.d.e || a.b.c == b.c.d && c.d.e == d.e.f "), "a");
            assert.deepEqual(props, []);
            props = constraintMatcher.getIndexableProperties(parser.parseConstraint("f3.sequence == s2 + 1"));
            assert.deepEqual(props, []);
        });

        it.should("not get properties with functions", function () {
            var props = constraintMatcher.getIndexableProperties(parser.parseConstraint("a() == b()"), "a");
            assert.deepEqual(props, []);
        });
    });

});