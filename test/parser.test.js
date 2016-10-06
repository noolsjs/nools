"use strict";
var it = require("it"),
    parser = require("../lib/parser"),
    assert = require("assert");

it.describe("A Parser", function (it) {
    it.should("parse valid string expressions", function () {
        assert.deepEqual(parser.parseConstraint("a == 'a'"), [
            ['a', null, 'identifier'],
            ['a', null, 'string'],
            'eq'
        ]);
        assert.deepEqual(parser.parseConstraint("a eq 'a'"), [
            ['a', null, 'identifier'],
            ['a', null, 'string'],
            'eq'
        ]);
        assert.deepEqual(parser.parseConstraint("a == 'Hello'"), [
            ['a', null, 'identifier'],
            ['Hello', null, 'string'],
            'eq'
        ]);
        assert.deepEqual(parser.parseConstraint("a eq 'Hello'"), [
            ['a', null, 'identifier'],
            ['Hello', null, 'string'],
            'eq'
        ]);
        assert.deepEqual(parser.parseConstraint("a == 1"), [
            ['a', null, 'identifier'],
            [1, null, 'number'],
            'eq'
        ]);
        assert.deepEqual(parser.parseConstraint("a eq 1"), [
            ['a', null, 'identifier'],
            [1, null, 'number'],
            'eq'
        ]);

        assert.deepEqual(parser.parseConstraint("a == true"), [
            ['a', null, 'identifier'],
            [true, null, 'boolean'],
            'eq'
        ]);
        assert.deepEqual(parser.parseConstraint("a eq true"), [
            ['a', null, 'identifier'],
            [true, null, 'boolean'],
            'eq'
        ]);
        assert.deepEqual(parser.parseConstraint("a == false"), [
            ['a', null, 'identifier'],
            [false, null, 'boolean'],
            'eq'
        ]);
        assert.deepEqual(parser.parseConstraint("a eq false"), [
            ['a', null, 'identifier'],
            [false, null, 'boolean'],
            'eq'
        ]);

        assert.deepEqual(parser.parseConstraint("a eq null"), [
            ['a', null, 'identifier'],
            [null, null, 'null'],
            'eq'
        ]);

        assert.deepEqual(parser.parseConstraint("a =~ /hello/"), [
            ['a', null, 'identifier'],
            ["/hello/", null, 'regexp'],
            'like'
        ]);
        assert.deepEqual(parser.parseConstraint("a =~ /h\\/ello/"), [
            ['a', null, 'identifier'],
            ["/h\\/ello/", null, 'regexp'],
            'like'
        ]);
        assert.deepEqual(parser.parseConstraint("a like /hello/"), [
            ['a', null, 'identifier'],
            ["/hello/", null, 'regexp'],
            'like'
        ]);
        assert.deepEqual(parser.parseConstraint("a =~ /^hello$/"), [
            ['a', null, 'identifier'],
            ["/^hello$/", null, 'regexp'],
            'like'
        ]);
        assert.deepEqual(parser.parseConstraint("a like /^hello$/"), [
            ['a', null, 'identifier'],
            ["/^hello$/", null, 'regexp'],
            'like'
        ]);

        assert.deepEqual(parser.parseConstraint("a !=~ /hello/"), [
            ['a', null, 'identifier'],
            ["/hello/", null, 'regexp'],
            'notLike'
        ]);
        assert.deepEqual(parser.parseConstraint("a notLike /hello/"), [
            ['a', null, 'identifier'],
            ["/hello/", null, 'regexp'],
            'notLike'
        ]);
        assert.deepEqual(parser.parseConstraint("a !=~ /^hello$/"), [
            ['a', null, 'identifier'],
            ["/^hello$/", null, 'regexp'],
            'notLike'
        ]);
        assert.deepEqual(parser.parseConstraint("a notLike /^hello$/"), [
            ['a', null, 'identifier'],
            ["/^hello$/", null, 'regexp'],
            'notLike'
        ]);

        assert.deepEqual(parser.parseConstraint("a > 1"), [
            ['a', null, 'identifier'],
            [1, null, 'number'],
            'gt'
        ]);
        assert.deepEqual(parser.parseConstraint("a gt 1"), [
            ['a', null, 'identifier'],
            [1, null, 'number'],
            'gt'
        ]);

        assert.deepEqual(parser.parseConstraint("a >= 1"), [
            ['a', null, 'identifier'],
            [1, null, 'number'],
            'gte'
        ]);
        assert.deepEqual(parser.parseConstraint("a gte 1"), [
            ['a', null, 'identifier'],
            [1, null, 'number'],
            'gte'
        ]);

        assert.deepEqual(parser.parseConstraint("a < 1"), [
            ['a', null, 'identifier'],
            [1, null, 'number'],
            'lt'
        ]);
        assert.deepEqual(parser.parseConstraint("a lt 1"), [
            ['a', null, 'identifier'],
            [1, null, 'number'],
            'lt'
        ]);
        assert.deepEqual(parser.parseConstraint("a <= 1"), [
            ['a', null, 'identifier'],
            [1, null, 'number'],
            'lte'
        ]);
        assert.deepEqual(parser.parseConstraint("a lte 1"), [
            ['a', null, 'identifier'],
            [1, null, 'number'],
            'lte'
        ]);
    });

    it.should("parse regexps and not be greedy", function () {
        assert.deepEqual(parser.parseConstraint("a =~ /^\\/((?![\\s=])[^[\\/\\n\\\\]*(?:(?:\\\\[\\s\\S]|\\[[^\\]\\n\\\\]*(?:\\\\[\\s\\S][^\\]\\n\\\\]*)*])[^[\\/\\n\\\\]*)*\\/[imgy]{0,4})(?!\\w)/ && b like /^\\/((?![\\s=])[^[\\/\\n\\\\]*(?:(?:\\\\[\\s\\S]|\\[[^\\]\\n\\\\]*(?:\\\\[\\s\\S][^\\]\\n\\\\]*)*])[^[\\/\\n\\\\]*)*\\/[imgy]{0,4})(?!\\w)/"),
            [
                [
                    ['a', null, 'identifier'],
                    ['/^\\/((?![\\s=])[^[\\/\\n\\\\]*(?:(?:\\\\[\\s\\S]|\\[[^\\]\\n\\\\]*(?:\\\\[\\s\\S][^\\]\\n\\\\]*)*])[^[\\/\\n\\\\]*)*\\/[imgy]{0,4})(?!\\w)/', null, 'regexp'],
                    'like'
                ],
                [
                    ['b', null, 'identifier'],
                    ['/^\\/((?![\\s=])[^[\\/\\n\\\\]*(?:(?:\\\\[\\s\\S]|\\[[^\\]\\n\\\\]*(?:\\\\[\\s\\S][^\\]\\n\\\\]*)*])[^[\\/\\n\\\\]*)*\\/[imgy]{0,4})(?!\\w)/', null, 'regexp'],
                    'like'
                ],
                'and'
            ]
        );
    });

    it.should("parse valid string expressions with functions", function () {

        assert.deepEqual(parser.parseConstraint("Date()"), [
            ["Date", null, "identifier"],
            [null, null, "arguments"],
            "function"
        ]);
        assert.deepEqual(parser.parseConstraint("a(b,c,d,e)"), [
            ["a", null, "identifier"],
            [
                [
                    [
                        ["b", null, "identifier"],
                        ["c", null, "identifier"],
                        "arguments"
                    ],
                    ["d", null, "identifier"],
                    "arguments"
                ],
                ["e", null, "identifier"],
                "arguments"
            ],
            "function"
        ]);
        assert.deepEqual(parser.parseConstraint("a(b,c)"), [
            ["a", null, "identifier"],
            [
                ["b", null, "identifier"],
                ["c", null, "identifier"],
                "arguments"
            ],
            "function"
        ]);
        assert.deepEqual(parser.parseConstraint("a(b,c) && e(f,g)"), [
            [
                ["a", null, "identifier"],
                [
                    ["b", null, "identifier"],
                    ["c", null, "identifier"],
                    "arguments"
                ],
                "function"
            ],
            [
                ["e", null, "identifier"],
                [
                    ["f", null, "identifier"],
                    ["g", null, "identifier"],
                    "arguments"
                ],
                "function"
            ],
            "and"
        ]);

    });

    it.should("parse valid string expressions with property access", function () {

        assert.deepEqual(parser.parseConstraint("a.flag"), [
            ["a", null, 'identifier'],
            ["flag", null, 'identifier'],
            "prop"
        ]);

        assert.deepEqual(parser.parseConstraint("a.name == 'a'"), [
            [
                ["a", null, "identifier"],
                ["name", null, "identifier"],
                "prop"
            ],
            ["a", null, "string"],
            "eq"
        ]);
        assert.deepEqual(parser.parseConstraint("a.name eq 'a'"), [
            [
                ["a", null, "identifier"],
                ["name", null, "identifier"],
                "prop"
            ],
            ["a", null, "string"],
            "eq"
        ]);
        assert.deepEqual(parser.parseConstraint("a.greeting == 'Hello'"), [
            [
                ["a", null, "identifier"],
                ["greeting", null, "identifier"],
                "prop"
            ],
            ["Hello", null, "string"],
            "eq"
        ]);
        assert.deepEqual(parser.parseConstraint("a.greeting eq 'Hello'"), [
            [
                ["a", null, "identifier"],
                ["greeting", null, "identifier"],
                "prop"
            ],
            ["Hello", null, "string"],
            "eq"
        ]);
        assert.deepEqual(parser.parseConstraint("a.name.length == 'Hello'"), [
            [
                [
                    ["a", null, "identifier"],
                    ["name", null, "identifier"],
                    "prop"
                ],
                ["length", null, "identifier"],
                "prop"
            ],
            ["Hello", null, "string"],
            "eq"
        ]);
        assert.deepEqual(parser.parseConstraint("a.name eq 'Hello'"), [
            [
                ["a", null, "identifier"],
                ["name", null, "identifier"],
                "prop"
            ],
            ["Hello", null, "string"],
            "eq"
        ]);
        assert.deepEqual(parser.parseConstraint("a.name == 1"), [
            [
                ["a", null, "identifier"],
                ["name", null, "identifier"],
                "prop"
            ],
            [1, null, "number"],
            "eq"
        ]);
        assert.deepEqual(parser.parseConstraint("a.name eq 1"), [
            [
                ["a", null, "identifier"],
                ["name", null, "identifier"],
                "prop"
            ],
            [1, null, "number"],
            "eq"
        ]);

        assert.deepEqual(parser.parseConstraint("a.name != 'a'"), [
            [
                ["a", null, "identifier"],
                ["name", null, "identifier"],
                "prop"
            ],
            ["a", null, "string"],
            "neq"
        ]);
        assert.deepEqual(parser.parseConstraint("a.name neq 'a'"), [
            [
                ["a", null, "identifier"],
                ["name", null, "identifier"],
                "prop"
            ],
            ["a", null, "string"],
            "neq"
        ]);
        assert.deepEqual(parser.parseConstraint("a.greeting != 'Hello'"), [
            [
                ["a", null, "identifier"],
                ["greeting", null, "identifier"],
                "prop"
            ],
            ["Hello", null, "string"],
            "neq"
        ]);
        assert.deepEqual(parser.parseConstraint("a.greeting neq 'Hello'"), [
            [
                ["a", null, "identifier"],
                ["greeting", null, "identifier"],
                "prop"
            ],
            ["Hello", null, "string"],
            "neq"
        ]);
        assert.deepEqual(parser.parseConstraint("a.name.length != 'Hello'"), [
            [
                [
                    ["a", null, "identifier"],
                    ["name", null, "identifier"],
                    "prop"
                ],
                ["length", null, "identifier"],
                "prop"
            ],
            ["Hello", null, "string"],
            "neq"
        ]);
        assert.deepEqual(parser.parseConstraint("a.name neq 'Hello'"), [
            [
                ["a", null, "identifier"],
                ["name", null, "identifier"],
                "prop"
            ],
            ["Hello", null, "string"],
            "neq"
        ]);
        assert.deepEqual(parser.parseConstraint("a.name != 1"), [
            [
                ["a", null, "identifier"],
                ["name", null, "identifier"],
                "prop"
            ],
            [1, null, "number"],
            "neq"
        ]);
        assert.deepEqual(parser.parseConstraint("a.name neq 1"), [
            [
                ["a", null, "identifier"],
                ["name", null, "identifier"],
                "prop"
            ],
            [1, null, "number"],
            "neq"
        ]);

        assert.deepEqual(parser.parseConstraint("a.flag == true"), [
            [
                ["a", null, "identifier"],
                ["flag", null, "identifier"],
                "prop"
            ],
            [true, null, "boolean"],
            "eq"
        ]);
        assert.deepEqual(parser.parseConstraint("a.flag eq true"), [
            [
                ["a", null, "identifier"],
                ["flag", null, "identifier"],
                "prop"
            ],
            [true, null, "boolean"],
            "eq"
        ]);
        assert.deepEqual(parser.parseConstraint("a.flag == false"), [
            [
                ["a", null, "identifier"],
                ["flag", null, "identifier"],
                "prop"
            ],
            [false, null, "boolean"],
            "eq"
        ]);
        assert.deepEqual(parser.parseConstraint("a.flag eq false"), [
            [
                ["a", null, "identifier"],
                ["flag", null, "identifier"],
                "prop"
            ],
            [false, null, "boolean"],
            "eq"
        ]);

        assert.deepEqual(parser.parseConstraint("a.name =~ /hello/"), [
            [
                ["a", null, "identifier"],
                ["name", null, "identifier"],
                "prop"
            ],
            ["/hello/", null, "regexp"],
            "like"
        ]);
        assert.deepEqual(parser.parseConstraint("a.name like /hello/"), [
            [
                ["a", null, "identifier"],
                ["name", null, "identifier"],
                "prop"
            ],
            ["/hello/", null, "regexp"],
            "like"
        ]);
        assert.deepEqual(parser.parseConstraint("a.name =~ /^hello$/"), [
            [
                ["a", null, "identifier"],
                ["name", null, "identifier"],
                "prop"
            ],
            ["/^hello$/", null, "regexp"],
            "like"
        ]);
        assert.deepEqual(parser.parseConstraint("a.name like /^hello$/"), [
            [
                ["a", null, "identifier"],
                ["name", null, "identifier"],
                "prop"
            ],
            ["/^hello$/", null, "regexp"],
            "like"
        ]);

        assert.deepEqual(parser.parseConstraint("a.age > 1"), [
            [
                ["a", null, "identifier"],
                ["age", null, "identifier"],
                "prop"
            ],
            [1, null, "number"],
            "gt"
        ]);
        assert.deepEqual(parser.parseConstraint("a.age gt 1"), [
            [
                ["a", null, "identifier"],
                ["age", null, "identifier"],
                "prop"
            ],
            [1, null, "number"],
            "gt"
        ]);

        assert.deepEqual(parser.parseConstraint("a.age >= 1"), [
            [
                ["a", null, "identifier"],
                ["age", null, "identifier"],
                "prop"
            ],
            [1, null, "number"],
            "gte"
        ]);
        assert.deepEqual(parser.parseConstraint("a.age gte 1"), [
            [
                ["a", null, "identifier"],
                ["age", null, "identifier"],
                "prop"
            ],
            [1, null, "number"],
            "gte"
        ]);

        assert.deepEqual(parser.parseConstraint("a.age < 1"), [
            [
                ["a", null, "identifier"],
                ["age", null, "identifier"],
                "prop"
            ],
            [1, null, "number"],
            "lt"
        ]);
        assert.deepEqual(parser.parseConstraint("a.age lt 1"), [
            [
                ["a", null, "identifier"],
                ["age", null, "identifier"],
                "prop"
            ],
            [1, null, "number"],
            "lt"
        ]);
        assert.deepEqual(parser.parseConstraint("a.age <= 1"), [
            [
                ["a", null, "identifier"],
                ["age", null, "identifier"],
                "prop"
            ],
            [1, null, "number"],
            "lte"
        ]);
        assert.deepEqual(parser.parseConstraint("a.age lte 1"), [
            [
                ["a", null, "identifier"],
                ["age", null, "identifier"],
                "prop"
            ],
            [1, null, "number"],
            "lte"
        ]);

        assert.deepEqual(parser.parseConstraint("a.age eq a.num"), [
            [
                ["a", null, "identifier"],
                ["age", null, "identifier"],
                "prop"
            ],
            [
                ["a", null, "identifier"],
                ["num", null, "identifier"],
                "prop"
            ],
            "eq"
        ]);
        assert.deepEqual(parser.parseConstraint("a.age() eq a.num()"), [
            [
                [
                    ["a", null, "identifier"],
                    ["age", null, "identifier"],
                    "prop"
                ],
                [null, null, "arguments"],
                "function"
            ],
            [
                [
                    ["a", null, "identifier"],
                    ["num", null, "identifier"],
                    "prop"
                ],
                [null, null, "arguments"],
                "function"
            ],
            "eq"
        ]);


        assert.deepEqual(parser.parseConstraint("a['age']() eq a['num']()"), [
            [
                [
                    ["a", null, "identifier"],
                    ["age", null, "string"],
                    "propLookup"
                ],
                [null, null, "arguments"],
                "function"
            ],
            [
                [
                    ["a", null, "identifier"],
                    ["num", null, "string"],
                    "propLookup"
                ],
                [null, null, "arguments"],
                "function"
            ],
            "eq"
        ]);

        assert.deepEqual(parser.parseConstraint("a[b]() eq a[c]()"), [
            [
                [
                    ["a", null, "identifier"],
                    ["b", null, "identifier"],
                    "propLookup"
                ],
                [null, null, "arguments"],
                "function"
            ],
            [
                [
                    ["a", null, "identifier"],
                    ["c", null, "identifier"],
                    "propLookup"
                ],
                [null, null, "arguments"],
                "function"
            ],
            "eq"
        ]);
        assert.deepEqual(parser.parseConstraint("a[b]().a.c()['a']()()"), [
            [
                [
                    [
                        [
                            [
                                [
                                    [
                                        ["a", null, "identifier"],
                                        ["b", null, "identifier"],
                                        "propLookup"
                                    ],
                                    [null, null, "arguments"],
                                    "function"
                                ],
                                ["a", null, "identifier"],
                                "prop"
                            ],
                            ["c", null, "identifier"],
                            "prop"
                        ],
                        [null, null, "arguments"],
                        "function"
                    ],
                    ["a", null, "string"],
                    "propLookup"
                ],
                [null, null, "arguments"],
                "function"
            ],
            [null, null, "arguments"],
            "function"
        ]);

        assert.deepEqual(parser.parseConstraint("a['flag']"), [
            ["a", null, "identifier"],
            ["flag", null, "string"],
            "propLookup"
        ]);

        assert.deepEqual(parser.parseConstraint("a[b]"), [
            ["a", null, "identifier"],
            ["b", null, "identifier"],
            "propLookup"
        ]);
    });

    it.should("parse valid string expressions with boolean operators", function () {
        assert.deepEqual(parser.parseConstraint("a.name == 'bob' && a.age >= 10"), [
            [
                [
                    ["a", null, "identifier"],
                    ["name", null, "identifier"],
                    "prop"
                ],
                ["bob", null, "string"],
                "eq"
            ],
            [
                [
                    ["a", null, "identifier"],
                    ["age", null, "identifier"],
                    "prop"
                ],
                [10, null, "number"],
                "gte"
            ],
            "and"
        ]);
        assert.deepEqual(parser.parseConstraint("a.name == 'bob' || a.age >= 10"), [
            [
                [
                    ["a", null, "identifier"],
                    ["name", null, "identifier"],
                    "prop"
                ],
                ["bob", null, "string"],
                "eq"
            ],
            [
                [
                    ["a", null, "identifier"],
                    ["age", null, "identifier"],
                    "prop"
                ],
                [10, null, "number"],
                "gte"
            ],
            "or"
        ]);

        assert.deepEqual(parser.parseConstraint("a.name EQ 'bob' AND a.age GTE 10"), [
            [
                [
                    ["a", null, "identifier"],
                    ["name", null, "identifier"],
                    "prop"
                ],
                ["bob", null, "string"],
                "eq"
            ],
            [
                [
                    ["a", null, "identifier"],
                    ["age", null, "identifier"],
                    "prop"
                ],
                [10, null, "number"],
                "gte"
            ],
            "and"
        ]);
        assert.deepEqual(parser.parseConstraint("a.name EQ 'bob' OR a.age GTE 10"), [
            [
                [
                    ["a", null, "identifier"],
                    ["name", null, "identifier"],
                    "prop"
                ],
                ["bob", null, "string"],
                "eq"
            ],
            [
                [
                    ["a", null, "identifier"],
                    ["age", null, "identifier"],
                    "prop"
                ],
                [10, null, "number"],
                "gte"
            ],
            "or"
        ]);

        assert.deepEqual(parser.parseConstraint("a.name eq 'bob' and a.age gte 10"), [
            [
                [
                    ["a", null, "identifier"],
                    ["name", null, "identifier"],
                    "prop"
                ],
                ["bob", null, "string"],
                "eq"
            ],
            [
                [
                    ["a", null, "identifier"],
                    ["age", null, "identifier"],
                    "prop"
                ],
                [10, null, "number"],
                "gte"
            ],
            "and"
        ]);
        assert.deepEqual(parser.parseConstraint("a.name eq 'bob' or a.age gte 10"), [
            [
                [
                    ["a", null, "identifier"],
                    ["name", null, "identifier"],
                    "prop"
                ],
                ["bob", null, "string"],
                "eq"
            ],
            [
                [
                    ["a", null, "identifier"],
                    ["age", null, "identifier"],
                    "prop"
                ],
                [10, null, "number"],
                "gte"
            ],
            "or"
        ]);

        assert.deepEqual(parser.parseConstraint('a.name eq "bob" or a.age gte 10'), [
            [
                [
                    ["a", null, "identifier"],
                    ["name", null, "identifier"],
                    "prop"
                ],
                ["bob", null, "string"],
                "eq"
            ],
            [
                [
                    ["a", null, "identifier"],
                    ["age", null, "identifier"],
                    "prop"
                ],
                [10, null, "number"],
                "gte"
            ],
            "or"
        ]);

        var props = [
            "in",
            "notIn",
            "from",
            "eq",
            "EQ",
            "neq",
            "NEQ",
            "lte",
            "LTE",
            "lt",
            "LT",
            "gt",
            "GT",
            "gte",
            "GTE",
            "like",
            "LIKE",
            "notLike",
            "NOT_LIKE",
            "and",
            "AND",
            "or",
            "OR"
        ];
        for (var i = 0, l = props.length; i < l; i++) {
            assert.deepEqual(parser.parseConstraint('a.name.' + props[i] + '("bob")'), [
                [
                    [
                        ["a", null, "identifier"],
                        ["name", null, "identifier"],
                        "prop"
                    ],
                    [props[i], null, "identifier"],
                    "prop"
                ],
                ["bob", null, "string"],
                "function"
            ]);
        }


    });

    it.should("handle operator associativity properly", function () {
        assert.deepEqual(parser.parseConstraint("a.name == 'a' || a.name == 'bob' && a.age >= 10"), [
            [
                [
                    ["a", null, "identifier"],
                    ["name", null, "identifier"],
                    "prop"
                ],
                ["a", null, "string"],
                "eq"
            ],
            [
                [
                    [
                        ["a", null, "identifier"],
                        ["name", null,
                            "identifier"
                        ],
                        "prop"
                    ],
                    ["bob", null, "string"],
                    "eq"
                ],
                [
                    [
                        ["a", null, "identifier"],
                        ["age", null, "identifier"],
                        "prop"
                    ],
                    [10, null, "number"],
                    "gte"
                ],
                "and"
            ],
            "or"
        ]);
        assert.deepEqual(parser.parseConstraint("a.name == 'a' || (a.name == 'bob' && a.age >= 10)"), [
            [
                [
                    ["a", null, "identifier"],
                    ["name", null, "identifier"],
                    "prop"
                ],
                ["a", null, "string"],
                "eq"
            ],
            [
                [
                    [
                        [
                            ["a", null, "identifier"],
                            ["name", null, "identifier"],
                            "prop"
                        ],
                        ["bob", null, "string"],
                        "eq"
                    ],
                    [
                        [
                            ["a", null, "identifier"],
                            ["age", null, "identifier"],
                            "prop"
                        ],
                        [10, null, "number"],
                        "gte"
                    ],
                    "and"
                ],
                null,
                "composite"
            ],
            "or"
        ]);
        assert.deepEqual(parser.parseConstraint("(a.name == 'a' && a.name == 'bob') || a.age >= 10"), [
            [
                [
                    [
                        [
                            ["a", null, "identifier"],
                            ["name", null, "identifier"],
                            "prop"
                        ],
                        ["a", null, "string"],
                        "eq"
                    ],
                    [
                        [
                            ["a", null, "identifier"],
                            ["name", null, "identifier"],
                            "prop"
                        ],
                        ["bob", null, "string"],
                        "eq"
                    ],
                    "and"
                ],
                null,
                'composite'
            ],
            [
                [
                    ["a", null, "identifier"],
                    ["age", null, "identifier"],
                    "prop"
                ],
                [10, null, "number"],
                "gte"
            ],
            "or"
        ]);
    });

    it.should("parse arrays", function () {
        assert.deepEqual(parser.parseConstraint("[]"), [null, null, "array"]);
        assert.deepEqual(parser.parseConstraint("[1,2]"), [
            [
                [1, null, "number"],
                [2, null, "number"],
                "arguments"
            ],
            null,
            "array"
        ]);
        assert.deepEqual(parser.parseConstraint("['a',2, true, false, /hello/, b]"), [
            [
                [
                    [
                        [
                            [
                                ["a", null, "string"],
                                [2, null, "number"],
                                "arguments"
                            ],
                            [true, null, "boolean"],
                            "arguments"
                        ],
                        [false, null, "boolean"],
                        "arguments"
                    ],
                    ["/hello/", null, "regexp"],
                    "arguments"
                ],
                ["b", null, "identifier"],
                "arguments"
            ],
            null,
            "array"
        ]);
    });

    it.should("parse the in operator", function () {
        assert.deepEqual(parser.parseConstraint("1 in [1,2,3]"), [
            [1, null, "number"],
            [
                [
                    [
                        [1, null, "number"],
                        [2, null, "number"],
                        "arguments"
                    ],
                    [3, null, "number"],
                    "arguments"
                ],
                null,
                "array"
            ],
            "in"
        ]);
    });

    it.should("parse the notIn operator", function () {
        assert.deepEqual(parser.parseConstraint("1 notIn [1,2,3]"), [
            [1, null, "number"],
            [
                [
                    [
                        [1, null, "number"],
                        [2, null, "number"],
                        "arguments"
                    ],
                    [3, null, "number"],
                    "arguments"
                ],
                null,
                "array"
            ],
            "notIn"
        ]);
    });

    it.should("parse truthy statements", function () {
        assert.deepEqual(parser.parseConstraint("a && !b"), [
            ["a", null, "identifier"],
            [
                ["b", null, "identifier"],
                null,
                "logicalNot"
            ],
            "and"
        ]);

        assert.deepEqual(parser.parseConstraint("!(a && b)"), [
            [
                [
                    ["a", null, "identifier"],
                    ["b", null, "identifier"],
                    "and"
                ],
                null,
                "composite"
            ],
            null,
            "logicalNot"
        ]);
    });

});