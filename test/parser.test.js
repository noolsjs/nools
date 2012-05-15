var it = require("it"),
    parser = require("../lib/parser"),
    assert = require("assert");

it.describe("A Parser", function (it) {
    it.should("parse valid string expressions", function () {
        assert.deepEqual(parser.parse("a == 'a'"), [
            ['a', null, 'identifier'],
            ['a', null, 'string'],
            'eq'
        ]);
        assert.deepEqual(parser.parse("a eq 'a'"), [
            ['a', null, 'identifier'],
            ['a', null, 'string'],
            'eq'
        ]);
        assert.deepEqual(parser.parse("a == 'Hello'"), [
            ['a', null, 'identifier'],
            ['Hello', null, 'string'],
            'eq'
        ]);
        assert.deepEqual(parser.parse("a eq 'Hello'"), [
            ['a', null, 'identifier'],
            ['Hello', null, 'string'],
            'eq'
        ]);
        assert.deepEqual(parser.parse("a == 1"), [
            ['a', null, 'identifier'],
            [1, null, 'number'],
            'eq'
        ]);
        assert.deepEqual(parser.parse("a eq 1"), [
            ['a', null, 'identifier'],
            [1, null, 'number'],
            'eq'
        ]);

        assert.deepEqual(parser.parse("a == true"), [
            ['a', null, 'identifier'],
            [true, null, 'boolean'],
            'eq'
        ]);
        assert.deepEqual(parser.parse("a eq true"), [
            ['a', null, 'identifier'],
            [true, null, 'boolean'],
            'eq'
        ]);
        assert.deepEqual(parser.parse("a == false"), [
            ['a', null, 'identifier'],
            [false, null, 'boolean'],
            'eq'
        ]);
        assert.deepEqual(parser.parse("a eq false"), [
            ['a', null, 'identifier'],
            [false, null, 'boolean'],
            'eq'
        ]);

        assert.deepEqual(parser.parse("a eq null"), [
            ['a', null, 'identifier'],
            [null, null, 'null'],
            'eq'
        ]);

        assert.deepEqual(parser.parse("a =~ /hello/"), [
            ['a', null, 'identifier'],
            [/hello/, null, 'regexp'],
            'like'
        ]);
        assert.deepEqual(parser.parse("a like /hello/"), [
            ['a', null, 'identifier'],
            [/hello/, null, 'regexp'],
            'like'
        ]);
        assert.deepEqual(parser.parse("a =~ /^hello$/"), [
            ['a', null, 'identifier'],
            [/hello/, null, 'regexp'],
            'like'
        ]);
        assert.deepEqual(parser.parse("a like /^hello$/"), [
            ['a', null, 'identifier'],
            [/hello/, null, 'regexp'],
            'like'
        ]);

        assert.deepEqual(parser.parse("a > 1"), [
            ['a', null, 'identifier'],
            [1, null, 'number'],
            'gt'
        ]);
        assert.deepEqual(parser.parse("a gt 1"), [
            ['a', null, 'identifier'],
            [1, null, 'number'],
            'gt'
        ]);

        assert.deepEqual(parser.parse("a >= 1"), [
            ['a', null, 'identifier'],
            [1, null, 'number'],
            'gte'
        ]);
        assert.deepEqual(parser.parse("a gte 1"), [
            ['a', null, 'identifier'],
            [1, null, 'number'],
            'gte'
        ]);

        assert.deepEqual(parser.parse("a < 1"), [
            ['a', null, 'identifier'],
            [1, null, 'number'],
            'lt'
        ]);
        assert.deepEqual(parser.parse("a lt 1"), [
            ['a', null, 'identifier'],
            [1, null, 'number'],
            'lt'
        ]);
        assert.deepEqual(parser.parse("a <= 1"), [
            ['a', null, 'identifier'],
            [1, null, 'number'],
            'lte'
        ]);
        assert.deepEqual(parser.parse("a lte 1"), [
            ['a', null, 'identifier'],
            [1, null, 'number'],
            'lte'
        ]);
    });

    it.should("parse valid string expressions with functions", function () {

        assert.deepEqual(parser.parse("Date()"), ["Date", [null, null, "arguments"], "function"]);
        assert.deepEqual(parser.parse("a(b,c,d,e)"), ["a", [
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
        ], "function"]);
        assert.deepEqual(parser.parse("a(b,c)"), ["a",
            [
                ["b", null, "identifier"],
                ["c", null, "identifier"],
                "arguments"
            ], "function"]);
        assert.deepEqual(parser.parse("a(b,c) && e(f,g)"), [
            [
                "a",
                [
                    ["b", null, "identifier"],
                    ["c", null, "identifier"],
                    "arguments"
                ],
                "function"
            ],
            [
                "e",
                [
                    ["f", null, "identifier"],
                    ["g", null, "identifier"],
                    "arguments"
                ],
                "function"
            ],
            "and"
        ]);

    })

    it.should("parse valid string expressions with property access", function () {

        assert.deepEqual(parser.parse("a.flag"), [
            ["a", null, 'identifier'],
            ["flag", null, 'identifier'],
            "prop"
        ]);

        assert.deepEqual(parser.parse("a.name == 'a'"), [
            [
                ["a", null, "identifier"],
                ["name", null, "identifier"],
                "prop"
            ],
            ["a", null, "string"],
            "eq"
        ]);
        assert.deepEqual(parser.parse("a.name eq 'a'"), [
            [
                ["a", null, "identifier"],
                ["name", null, "identifier"],
                "prop"
            ],
            ["a", null, "string"],
            "eq"
        ]);
        assert.deepEqual(parser.parse("a.greeting == 'Hello'"), [
            [
                ["a", null, "identifier"],
                ["greeting", null, "identifier"],
                "prop"
            ],
            ["Hello", null, "string"],
            "eq"
        ]);
        assert.deepEqual(parser.parse("a.greeting eq 'Hello'"), [
            [
                ["a", null, "identifier"],
                ["greeting", null, "identifier"],
                "prop"
            ],
            ["Hello", null, "string"],
            "eq"
        ]);
        assert.deepEqual(parser.parse("a.name.length == 'Hello'"), [
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
        assert.deepEqual(parser.parse("a.name eq 'Hello'"), [
            [
                ["a", null, "identifier"],
                ["name", null, "identifier"],
                "prop"
            ],
            ["Hello", null, "string"],
            "eq"
        ]);
        assert.deepEqual(parser.parse("a.name == 1"), [
            [
                ["a", null, "identifier"],
                ["name", null, "identifier"],
                "prop"
            ],
            [1, null, "number"],
            "eq"
        ]);
        assert.deepEqual(parser.parse("a.name eq 1"), [
            [
                ["a", null, "identifier"],
                ["name", null, "identifier"],
                "prop"
            ],
            [1, null, "number"],
            "eq"
        ]);

        assert.deepEqual(parser.parse("a.name != 'a'"), [
            [
                ["a", null, "identifier"],
                ["name", null, "identifier"],
                "prop"
            ],
            ["a", null, "string"],
            "neq"
        ]);
        assert.deepEqual(parser.parse("a.name neq 'a'"), [
            [
                ["a", null, "identifier"],
                ["name", null, "identifier"],
                "prop"
            ],
            ["a", null, "string"],
            "neq"
        ]);
        assert.deepEqual(parser.parse("a.greeting != 'Hello'"), [
            [
                ["a", null, "identifier"],
                ["greeting", null, "identifier"],
                "prop"
            ],
            ["Hello", null, "string"],
            "neq"
        ]);
        assert.deepEqual(parser.parse("a.greeting neq 'Hello'"), [
            [
                ["a", null, "identifier"],
                ["greeting", null, "identifier"],
                "prop"
            ],
            ["Hello", null, "string"],
            "neq"
        ]);
        assert.deepEqual(parser.parse("a.name.length != 'Hello'"), [
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
        assert.deepEqual(parser.parse("a.name neq 'Hello'"), [
            [
                ["a", null, "identifier"],
                ["name", null, "identifier"],
                "prop"
            ],
            ["Hello", null, "string"],
            "neq"
        ]);
        assert.deepEqual(parser.parse("a.name != 1"), [
            [
                ["a", null, "identifier"],
                ["name", null, "identifier"],
                "prop"
            ],
            [1, null, "number"],
            "neq"
        ]);
        assert.deepEqual(parser.parse("a.name neq 1"), [
            [
                ["a", null, "identifier"],
                ["name", null, "identifier"],
                "prop"
            ],
            [1, null, "number"],
            "neq"
        ]);

        assert.deepEqual(parser.parse("a.flag == true"), [
            [
                ["a", null, "identifier"],
                ["flag", null, "identifier"],
                "prop"
            ],
            [true, null, "boolean"],
            "eq"
        ]);
        assert.deepEqual(parser.parse("a.flag eq true"), [
            [
                ["a", null, "identifier"],
                ["flag", null, "identifier"],
                "prop"
            ],
            [true, null, "boolean"],
            "eq"
        ]);
        assert.deepEqual(parser.parse("a.flag == false"), [
            [
                ["a", null, "identifier"],
                ["flag", null, "identifier"],
                "prop"
            ],
            [false, null, "boolean"],
            "eq"
        ]);
        assert.deepEqual(parser.parse("a.flag eq false"), [
            [
                ["a", null, "identifier"],
                ["flag", null, "identifier"],
                "prop"
            ],
            [false, null, "boolean"],
            "eq"
        ]);

        assert.deepEqual(parser.parse("a.name =~ /hello/"), [
            [
                ["a", null, "identifier"],
                ["name", null, "identifier"],
                "prop"
            ],
            [/hello/, null, "regexp"],
            "like"
        ]);
        assert.deepEqual(parser.parse("a.name like /hello/"), [
            [
                ["a", null, "identifier"],
                ["name", null, "identifier"],
                "prop"
            ],
            [/hello/, null, "regexp"],
            "like"
        ]);
        assert.deepEqual(parser.parse("a.name =~ /^hello$/"), [
            [
                ["a", null, "identifier"],
                ["name", null, "identifier"],
                "prop"
            ],
            [/^hello$/, null, "regexp"],
            "like"
        ]);
        assert.deepEqual(parser.parse("a.name like /^hello$/"), [
            [
                ["a", null, "identifier"],
                ["name", null, "identifier"],
                "prop"
            ],
            [/^hello$/, null, "regexp"],
            "like"
        ]);

        assert.deepEqual(parser.parse("a.age > 1"), [
            [
                ["a", null, "identifier"],
                ["age", null, "identifier"],
                "prop"
            ],
            [1, null, "number"],
            "gt"
        ]);
        assert.deepEqual(parser.parse("a.age gt 1"), [
            [
                ["a", null, "identifier"],
                ["age", null, "identifier"],
                "prop"
            ],
            [1, null, "number"],
            "gt"
        ]);

        assert.deepEqual(parser.parse("a.age >= 1"), [
            [
                ["a", null, "identifier"],
                ["age", null, "identifier"],
                "prop"
            ],
            [1, null, "number"],
            "gte"
        ]);
        assert.deepEqual(parser.parse("a.age gte 1"), [
            [
                ["a", null, "identifier"],
                ["age", null, "identifier"],
                "prop"
            ],
            [1, null, "number"],
            "gte"
        ]);

        assert.deepEqual(parser.parse("a.age < 1"), [
            [
                ["a", null, "identifier"],
                ["age", null, "identifier"],
                "prop"
            ],
            [1, null, "number"],
            "lt"
        ]);
        assert.deepEqual(parser.parse("a.age lt 1"), [
            [
                ["a", null, "identifier"],
                ["age", null, "identifier"],
                "prop"
            ],
            [1, null, "number"],
            "lt"
        ]);
        assert.deepEqual(parser.parse("a.age <= 1"), [
            [
                ["a", null, "identifier"],
                ["age", null, "identifier"],
                "prop"
            ],
            [1, null, "number"],
            "lte"
        ]);
        assert.deepEqual(parser.parse("a.age lte 1"), [
            [
                ["a", null, "identifier"],
                ["age", null, "identifier"],
                "prop"
            ],
            [1, null, "number"],
            "lte"
        ]);

        assert.deepEqual(parser.parse("a.age eq a.num"), [
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
        assert.deepEqual(parser.parse("a.age() eq a.num()"), [
            [
                ["a", null, "identifier"],
                ["age", [null, null, "arguments"], "function"],
                "prop"
            ],
            [
                ["a", null, "identifier"],
                ["num", [null, null, "arguments"], "function"],
                "prop"
            ],
            "eq"
        ]);
    });


    it.should("parse valid string expressions with boolean operators", function () {
        assert.deepEqual(parser.parse("a.name == 'bob' && a.age >= 10"), [
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
        assert.deepEqual(parser.parse("a.name == 'bob' || a.age >= 10"), [
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

        assert.deepEqual(parser.parse("a.name EQ 'bob' AND a.age GTE 10"), [
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
        assert.deepEqual(parser.parse("a.name EQ 'bob' OR a.age GTE 10"), [
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

        assert.deepEqual(parser.parse("a.name eq 'bob' and a.age gte 10"), [
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
        assert.deepEqual(parser.parse("a.name eq 'bob' or a.age gte 10"), [
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
    });

    it.should("handle operator associativity properly", function () {
        assert.deepEqual(parser.parse("a.name == 'a' || a.name == 'bob' && a.age >= 10"), [
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
        assert.deepEqual(parser.parse("a.name == 'a' || (a.name == 'bob' && a.age >= 10)"), [
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
            "or"
        ]);
        assert.deepEqual(parser.parse("(a.name == 'a' && a.name == 'bob') || a.age >= 10"), [
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
        assert.deepEqual(parser.parse("[]"), [null, null, "array"]);
        assert.deepEqual(parser.parse("[1,2]"), [
            [
                [1, null, "number"],
                [2, null, "number"],
                "arguments"
            ],
            null,
            "array"
        ]);
        assert.deepEqual(parser.parse("['a',2, true, false, /hello/, b]"), [
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
                    [/hello/, null, "regexp"],
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
        assert.deepEqual(parser.parse("1 in [1,2,3]"), [
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

    it.run();

});