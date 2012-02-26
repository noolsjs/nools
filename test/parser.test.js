var it = require("it"),
    parser = require("../lib/parser"),
    assert = require("assert");

it.describe("A Parser", function (it) {
    it.should("parse valid string expressions", function (next) {
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
        next();
    });

    it.should("parse valid string expressions with property access", function (next) {

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
        next();
    });


    it.should("parse valid string expressions with boolean operators", function (next) {
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
        next();
    });

    it.should("handle operator associativity properly", function (next) {
        assert.deepEqual(parser.parse("a.name == 'a' || a.name == 'bob' && a.age >= 10"), [
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
                "or"
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
        next();
    });


    it.run();
});