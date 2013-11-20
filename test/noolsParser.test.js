"use strict";
var it = require("it"),
    assert = require("assert"),
    noolsParser = require("../lib/parser/nools/nool.parser.js"),
    path = require("path"),
    fs = require("fs");

it.describe("nools dsl parser", function (it) {

    it.describe("define", function (it) {
        it.should("parse a define statement", function () {
            var parsed = noolsParser.parse("define Test {myProp : 'value'}");
            assert.deepEqual(parsed, {
                define: [
                    {
                        name: "Test",
                        properties: "({myProp : 'value'})"
                    }
                ],
                "rules": [],
                "scope": [],
                "loaded": [],
                "file": undefined
            });
            parsed = noolsParser.parse("define Test {myFunc : function(){}}");
            //have to test this way because deepEqual cannot include functions
            assert.deepEqual(parsed, {
                define: [
                    {
                        name: "Test",
                        properties: "({myFunc : function(){}})"
                    }
                ],
                "rules": [],
                "scope": [],
                "loaded": [],
                "file": undefined
            });
        });

        it.should("throw an error when the define block is missing a name", function () {
            assert.throws(function () {
                noolsParser.parse("define {myProp : 'value'");
            });
        });

        it.should("throw an error for invalid define blocks", function () {
            assert.throws(function () {
                noolsParser.parse("define Test {myProp : 'value'");
            });
            assert.throws(function () {
                noolsParser.parse("define Test myProp : 'value'}");
            });
        });

        it.should("throw an error when the global statement is missing a name", function () {
            assert.throws(function () {
                noolsParser.parse("global = require('util');");
            });
        });

        it.should("throw an error when the global statement is missing a ;", function () {
            assert.throws(function () {
                noolsParser.parse("global util = require('util')");
            });
        });
    });

    it.describe("global", function (it) {

        it.should("parse a require call statement", function () {
            var parsed = noolsParser.parse("global util = require('util');");
            assert.equal(parsed.scope[0].name, 'util');
            assert.equal(parsed.scope[0].body, "require('util')");
        });

        it.should("parse a require with a '.' character that is not a relative path", function () {
            var parsed = noolsParser.parse("global util = require('socket.io');");
            assert.equal(parsed.scope[0].name, 'util');
            assert.equal(parsed.scope[0].body, "require('socket.io')");
        });

        it.should("resolve relative require paths", function () {
            var parsed = noolsParser.parse("global util = require('../util');", "./rules/test.nools");
            assert.equal(parsed.scope[0].name, 'util');
            assert.equal(parsed.scope[0].body, "require('" + path.resolve("./rules", "../util") + "')");
        });

        it.should("parse a member look up", function () {
            var parsed = noolsParser.parse("global PI = Math.PI;");
            assert.equal(parsed.scope[0].name, 'PI');
            assert.equal(parsed.scope[0].body, "Math.PI");
        });

        it.should("parse a strings", function () {
            var parsed = noolsParser.parse("global SOME_STRING = 'This is a test';");
            assert.equal(parsed.scope[0].name, 'SOME_STRING');
            assert.equal(parsed.scope[0].body, "'This is a test'");
        });

        it.should("parse a boolean", function () {
            var parsed = noolsParser.parse("global TRUE = true;");
            assert.equal(parsed.scope[0].name, 'TRUE');
            assert.equal(parsed.scope[0].body, "true");
        });

        it.should("parse numbers", function () {
            var parsed = noolsParser.parse("global NUM = 1.23;");
            assert.equal(parsed.scope[0].name, 'NUM');
            assert.equal(parsed.scope[0].body, "1.23");
        });

        it.should("parse a new instantiation", function () {
            var parsed = noolsParser.parse("global NOW = new Date();");
            assert.equal(parsed.scope[0].name, 'NOW');
            assert.equal(parsed.scope[0].body, "new Date()");
        });

    });

    if (typeof window === "undefined") {
        it.describe("import", function (it) {

            var readFileSyncOrig = fs.readFileSync;

            it.afterEach(function () {
                fs.readFileSync = readFileSyncOrig;
            });


            it.should("parse a relative path and default to process.cwd()", function () {
                var called = false;
                fs.readFileSync = function (file, encoding) {
                    assert.equal(file, path.resolve(process.cwd(), './test.nools'));
                    assert.equal(encoding, "utf8");
                    called = true;
                    return "";
                };
                noolsParser.parse('import("./test.nools")');
                assert.isTrue(called);
            });

            it.should("parse a relative path and use the file path", function () {
                var called = false;
                fs.readFileSync = function (file, encoding) {
                    assert.equal(file, path.resolve("./rules", './test.nools'));
                    assert.equal(encoding, "utf8");
                    called = true;
                    return "";
                };
                noolsParser.parse('import("./test.nools")', "./rules/test.nools");
                assert.isTrue(called);
            });

            it.should("parse a absolute path and not change the location ", function () {
                var called = false;
                fs.readFileSync = function (file, encoding) {
                    assert.equal(file, "/rules/test.nools");
                    assert.equal(encoding, "utf8");
                    called = true;
                    return "";
                };
                noolsParser.parse('import("/rules/test.nools")', "./rules/test.nools");
                assert.isTrue(called);
            });

            it.should("should parse import with optional ';'", function () {
                var called = false;
                fs.readFileSync = function (file, encoding) {
                    assert.equal(file, "/rules/test.nools");
                    assert.equal(encoding, "utf8");
                    called = true;
                    return "";
                };
                noolsParser.parse("import('/rules/test.nools');", "./rules/test.nools");
                assert.isTrue(called);
            });

            it.should("merge imported nools file into the current file", function () {
                var source = require.resolve("./rules/import.nools");
                var parsed = noolsParser.parse(fs.readFileSync(require.resolve("./rules/import.nools"), "utf8"), source);
                assert.deepEqual(parsed, {
                    "define": [
                        {
                            "name": "Count",
                            "properties": "({     constructor: function(){         this.called = 0;     } })"
                        }
                    ],
                    "rules": [
                        {
                            "name": "orRule",
                            "options": {},
                            "constraints": [
                                ["or", ["String", "s", "s == 'hello'"], ["String", "s", "s == 'world'"]],
                                ["Count", "count"]
                            ],
                            "action": "count.called++;         count.s = s;     "
                        },
                        {
                            "name": "notRule",
                            "options": {},
                            "constraints": [
                                ["not", "String", "s", "s == 'hello'"],
                                ["Count", "count"]
                            ],
                            "action": "count.called++;     "
                        }
                    ],
                    "scope": [],
                    "loaded": [
                        require.resolve("./rules/import/import1.nools"),
                        require.resolve("./rules/import/import2.nools"),
                        require.resolve("./rules/import/import3.nools")
                    ],
                    "file": source
                });
            });

            it.should("throw an error if the file location contains more than one", function () {
                assert.throws(function () {
                    noolsParser.parse("import('/rules/test.nools', './test.nools')", "./rules/test.nools");
                });
            });

            it.should("throw an error if the first token after import is not a (", function () {
                assert.throws(function () {
                    noolsParser.parse("import '/rules/test.nools'", "./rules/test.nools");
                });
            });
        });
    }

    it.describe("function", function (it) {

        it.should("parse a function statement", function () {
            var parsed = noolsParser.parse("function myFunc(a, b) {return a + b}");
            assert.lengthOf(parsed.rules, 0);
            assert.lengthOf(parsed.define, 0);
            assert.lengthOf(parsed.scope, 1);
            assert.equal(parsed.scope[0].name, "myFunc");
            assert.equal(parsed.scope[0].body, "function(a, b){return a + b}");
        });

        it.should("throw an error when the function block is missing a name", function () {
            assert.throws(function () {
                noolsParser.parse("function(a,b) {return a + b;}");
            });
        });

        it.should("throw an error for invalid define blocks", function () {
            assert.throws(function () {
                noolsParser.parse("function testFunc() {return 'value'");
            });
            assert.throws(function () {
                noolsParser.parse("function testFunc() return 'value'}");
            });

            assert.throws(function () {
                noolsParser.parse("function testFunc {return 'value'}");
            });
        });
    });

    it.describe("rule", function (it) {

        it.should("parse rules", function () {
            var parsed = noolsParser.parse("rule TestRule {when {c : Clazz c.name eq 'Test' {test : test};} then {console.log(test);}}");
            assert.deepEqual(parsed, {
                define: [],
                rules: [
                    {
                        name: "TestRule",
                        constraints: [
                            ["Clazz", "c", "c.name eq 'Test'", {test: "test"}]
                        ],
                        action: "console.log(test);",
                        options: {}
                    }
                ],
                "scope": [],
                "loaded": [],
                "file": undefined
            });

            parsed = noolsParser.parse("rule TestRule {when {$c : Clazz $c.name eq 'Test' {$test : test};} then {console.log($test);}}");
            assert.deepEqual(parsed, {
                define: [],
                rules: [
                    {
                        name: "TestRule",
                        constraints: [
                            ["Clazz", "$c", "$c.name eq 'Test'", {$test: "test"}]
                        ],
                        action: "console.log($test);",
                        options: {}
                    }
                ],
                "scope": [],
                "loaded": [],
                "file": undefined
            });

            parsed = noolsParser.parse("rule TestRule {when {c : Clazz c.name eq 'Test' { test : test };} then {console.log(test);}}");
            assert.deepEqual(parsed, {
                define: [],
                rules: [
                    {
                        name: "TestRule",
                        constraints: [
                            ["Clazz", "c", "c.name eq 'Test'", {test: "test"}]
                        ],
                        action: "console.log(test);",
                        options: {}
                    }
                ],
                "scope": [],
                "loaded": [],
                "file": undefined
            });


            parsed = noolsParser.parse("rule TestRule {when {$c : Clazz $c.name eq 'Test' { $test : test };} then {console.log($test);}}");
            assert.deepEqual(parsed, {
                define: [],
                rules: [
                    {
                        name: "TestRule",
                        constraints: [
                            ["Clazz", "$c", "$c.name eq 'Test'", {$test: "test"}]
                        ],
                        action: "console.log($test);",
                        options: {}
                    }
                ],
                "scope": [],
                "loaded": [],
                "file": undefined
            });
        });

        it.should("throw an error for invalid rule blocks", function () {
            assert.throws(function () {
                //missing starting curly
                noolsParser.parse("rule TestRule when {c : Clazz c.name eq 'Test' {test : test}} then {console.log($test);}}");
            });
            assert.throws(function () {
                //missing end curly
                noolsParser.parse("rule TestRule { when {c : Clazz c.name eq 'Test' {test : test}} then {console.log($test);}");
            });
            //added colon
            assert.throws(function () {
                noolsParser.parse("rule TestRule : { when {c : Clazz c.name eq 'Test' {test : test}} then {console.log($test);}");
            });
        });

        it.should("throw an error for a missing name", function () {
            assert.throws(function () {
                noolsParser.parse("rule { when {c : Clazz c.name eq 'Test' {test : test}} then {console.log($test);}");
            });
        });

        it.should("parse not conditions", function () {
            var parsed = noolsParser.parse("rule TestRule { when {not(c : Clazz {test : test} c.name eq 'Test');} then {console.log($test);}}");
            assert.deepEqual(parsed, {
                define: [],
                rules: [
                    {
                        name: "TestRule",
                        constraints: [
                            ["not", 'Clazz', "c", "c.name eq 'Test'", {test: "test"}]
                        ],
                        action: "console.log($test);",
                        options: {}
                    }
                ],
                "scope": [],
                "loaded": [],
                "file": undefined
            });
            var parsed2 = noolsParser.parse("rule TestRule { when { not(c : Clazz c.name eq 'Test' {test : test})} then {console.log($test);}}");
            assert.deepEqual(parsed, parsed2);

            var parsed3 = noolsParser.parse("rule TestRule { when { not($c : Clazz $c.name eq 'Test' {$test : test})} then {console.log($test);}}");
            assert.deepEqual(parsed3, {
                define: [],
                rules: [
                    {
                        name: "TestRule",
                        constraints: [
                            ["not", 'Clazz', "$c", "$c.name eq 'Test'", {$test: "test"}]
                        ],
                        action: "console.log($test);",
                        options: {}
                    }
                ],
                "scope": [],
                "loaded": [],
                "file": undefined
            });
        });

        it.should("parse or conditions", function () {
            var parsed = noolsParser.parse("rule TestRule { when {or(c : Clazz c.name in ['Test1', 'test2', 'test3'], c : Clazz c.name eq 'Test')} then {console.log($test);}}");
            assert.deepEqual(parsed, {
                "define": [],
                "rules": [
                    {
                        "name": "TestRule",
                        "options": {},
                        "constraints": [
                            [
                                "or",
                                [
                                    "Clazz",
                                    "c",
                                    "c.name in ['Test1', 'test2', 'test3']"
                                ],
                                [
                                    "Clazz",
                                    "c",
                                    "c.name eq 'Test'"
                                ]
                            ]
                        ],
                        "action": "console.log($test);"
                    }
                ],
                "scope": [],
                "loaded": [],
                "file": undefined
            });

            parsed = noolsParser.parse("rule TestRule { when {or($c : Clazz $c.name in ['Test1', 'test2', 'test3'], $c : Clazz $c.name eq 'Test')} then {console.log($test);}}");
            assert.deepEqual(parsed, {
                "define": [],
                "rules": [
                    {
                        "name": "TestRule",
                        "options": {},
                        "constraints": [
                            [
                                "or",
                                [
                                    "Clazz",
                                    "$c",
                                    "$c.name in ['Test1', 'test2', 'test3']"
                                ],
                                [
                                    "Clazz",
                                    "$c",
                                    "$c.name eq 'Test'"
                                ]
                            ]
                        ],
                        "action": "console.log($test);"
                    }
                ],
                "scope": [],
                "loaded": [],
                "file": undefined
            });
            parsed = noolsParser.parse("rule TestRule { when {or($c : Clazz $c.name eq 'test1', $c : Clazz $c.name eq 'test2', $c : Clazz $c.name eq 'test3')} then {console.log($test);}}");
            assert.deepEqual(parsed, {
                "define": [],
                "rules": [
                    {
                        "name": "TestRule",
                        "options": {},
                        "constraints": [
                            [
                                "or",
                                ["Clazz", "$c", "$c.name eq 'test1'"],
                                ["Clazz", "$c", "$c.name eq 'test2'"],
                                ["Clazz", "$c", "$c.name eq 'test3'"]
                            ]
                        ],
                        "action": "console.log($test);"
                    }
                ],
                "scope": [],
                "loaded": [],
                "file": undefined
            });

            parsed = noolsParser.parse("rule TestRule { when {or($c : Clazz $c.name eq 'test1', not($c : Clazz $c.name eq 'test2'), not($c : Clazz $c.name eq 'test3'), $c: Clazz $c.name == 'test4')} then {console.log($test);}}");
            assert.deepEqual(parsed, {
                "define": [],
                "rules": [
                    {
                        "name": "TestRule",
                        "options": {},
                        "constraints": [
                            [
                                "or",
                                ["Clazz", "$c", "$c.name eq 'test1'"],
                                ["not", "Clazz", "$c", "$c.name eq 'test2'"],
                                ["not", "Clazz", "$c", "$c.name eq 'test3'"],
                                ["Clazz", "$c", "$c.name == 'test4'"]
                            ]
                        ],
                        "action": "console.log($test);"
                    }
                ],
                "scope": [],
                "loaded": [],
                "file": undefined
            });

            parsed = noolsParser.parse("rule TestRule { when {or(not($c : Clazz $c.name eq 'test1'), $c : Clazz $c.name eq 'test2', $c : Clazz $c.name eq 'test3', $c: Clazz $c.name == 'test4')} then {console.log($test);}}");
            assert.deepEqual(parsed, {
                "define": [],
                "rules": [
                    {
                        "name": "TestRule",
                        "options": {},
                        "constraints": [
                            [
                                "or",
                                ["not", "Clazz", "$c", "$c.name eq 'test1'"],
                                ["Clazz", "$c", "$c.name eq 'test2'"],
                                ["Clazz", "$c", "$c.name eq 'test3'"],
                                ["Clazz", "$c", "$c.name == 'test4'"]
                            ]
                        ],
                        "action": "console.log($test);"
                    }
                ],
                "scope": [],
                "loaded": [],
                "file": undefined
            });
        });

        it.should("parse when clause with hash and constraints in any order", function () {
            var parsed = noolsParser.parse("rule TestRule { when { c : Clazz {test : test} c.name eq 'Test';} then {console.log($test);}}");
            assert.deepEqual(parsed, {
                define: [],
                rules: [
                    {
                        name: "TestRule",
                        constraints: [
                            ["Clazz", "c", "c.name eq 'Test'", {test: "test"}]
                        ],
                        action: "console.log($test);",
                        options: {}
                    }
                ],
                "scope": [],
                "loaded": [],
                "file": undefined
            });
            var parsed2 = noolsParser.parse("rule TestRule { when { c : Clazz c.name eq 'Test' {test : test}} then {console.log($test);}}");
            assert.deepEqual(parsed, parsed2);
        });

        it.should("parse when clause with from", function () {
            var parsed = noolsParser.parse("rule TestRule { when { p : Person p.name eq 'Test'; a: Address a.zipcode == 88847 from p.address;} then {console.log($test);}}");
            assert.deepEqual(parsed, {
                "define": [],
                "rules": [
                    {
                        "name": "TestRule",
                        "options": {},
                        "constraints": [
                            [
                                "Person",
                                "p",
                                "p.name eq 'Test'"
                            ],
                            [
                                "Address",
                                "a",
                                "a.zipcode == 88847 ",
                                "from p.address"
                            ]
                        ],
                        "action": "console.log($test);"
                    }
                ],
                "scope": [],
                "loaded": [],
                "file": undefined
            });
            parsed = noolsParser.parse("rule TestRule { when { p : Person p.name eq 'Test'; a: Address a.zipcode == 88847 {zipcode: zipCode} from p.address;} then {console.log($test);}}");
            assert.deepEqual(parsed, {
                "define": [],
                "rules": [
                    {
                        "name": "TestRule",
                        "options": {},
                        "constraints": [
                            [
                                "Person",
                                "p",
                                "p.name eq 'Test'"
                            ],
                            [
                                "Address",
                                "a",
                                "a.zipcode == 88847",
                                {
                                    "zipcode": "zipCode"
                                },
                                "from p.address"
                            ]
                        ],
                        "action": "console.log($test);"
                    }
                ],
                "scope": [],
                "loaded": [],
                "file": undefined
            });
        });

        it.should("parse rules with a string name in double quotes", function () {
            var parsed = noolsParser.parse('rule "' + "test rule" + '"' + " { when { c : Clazz {test : test} c.name eq 'Test';} then {console.log($test);}}");
            assert.deepEqual(parsed, {
                define: [],
                rules: [
                    {
                        name: "test rule",
                        constraints: [
                            ["Clazz", "c", "c.name eq 'Test'", {test: "test"}]
                        ],
                        action: "console.log($test);",
                        options: {}
                    }
                ],
                "scope": [],
                "loaded": [],
                "file": undefined
            });
            var parsed2 = noolsParser.parse("rule 'test rule' { when { c : Clazz c.name eq 'Test' {test : test}} then {console.log($test);}}");
            assert.deepEqual(parsed, parsed2);

            var parsed3 = noolsParser.parse("rule 'test \"rule\"' { when { c : Clazz c.name eq 'Test' {test : test}} then {console.log($test);}}");
            assert.deepEqual(parsed3, {
                define: [],
                rules: [
                    {
                        name: 'test "rule"',
                        constraints: [
                            ["Clazz", "c", "c.name eq 'Test'", {test: "test"}]
                        ],
                        action: "console.log($test);",
                        options: {}
                    }
                ],
                "scope": [],
                "loaded": [],
                "file": undefined
            });
        });

        it.should("parse rules with a string name in single quotes", function () {
            var parsed = noolsParser.parse("rule 'test rule' { when { c : Clazz c.name eq 'Test' {test : test}} then {console.log($test);}}");
            assert.deepEqual(parsed, {
                define: [],
                rules: [
                    {
                        name: "test rule",
                        constraints: [
                            ["Clazz", "c", "c.name eq 'Test'", {test: "test"}]
                        ],
                        action: "console.log($test);",
                        options: {}
                    }
                ],
                "scope": [],
                "loaded": [],
                "file": undefined
            });
        });

        it.should("parse rules with a string name with inner strings", function () {
            var parsed3 = noolsParser.parse("rule 'test \"rule\"' { when { c : Clazz c.name eq 'Test' {test : test}} then {console.log($test);}}");
            assert.deepEqual(parsed3, {
                define: [],
                rules: [
                    {
                        name: 'test "rule"',
                        constraints: [
                            ["Clazz", "c", "c.name eq 'Test'", {test: "test"}]
                        ],
                        action: "console.log($test);",
                        options: {}
                    }
                ],
                "scope": [],
                "loaded": [],
                "file": undefined
            });
        });

        it.describe("salience/priority", function (it) {

            it.should("parse rules with a salience", function () {
                var parsed3 = noolsParser.parse("rule 'test \"rule\"' { salience: 10, when { c : Clazz c.name eq 'Test' {test : test}} then {console.log($test);}}");
                assert.deepEqual(parsed3, {
                    define: [],
                    rules: [
                        {
                            name: 'test "rule"',
                            constraints: [
                                ["Clazz", "c", "c.name eq 'Test'", {test: "test"}]
                            ],
                            action: "console.log($test);",
                            options: {priority: 10}
                        }
                    ],
                    "scope": [],
                    "loaded": [],
                    "file": undefined
                });
            });

            it.should("parse rules with a priority", function () {
                var parsed3 = noolsParser.parse("rule 'test \"rule\"' { priority: 10, when { c : Clazz c.name eq 'Test' {test : test}} then {console.log($test);}}");
                assert.deepEqual(parsed3, {
                    define: [],
                    rules: [
                        {
                            name: 'test "rule"',
                            constraints: [
                                ["Clazz", "c", "c.name eq 'Test'", {test: "test"}]
                            ],
                            action: "console.log($test);",
                            options: {priority: 10}
                        }
                    ],
                    "scope": [],
                    "loaded": [],
                    "file": undefined
                });
            });

            it.should("parse rules with a salience with a ;", function () {
                var parsed3 = noolsParser.parse("rule 'test \"rule\"' { salience: 10; when { c : Clazz c.name eq 'Test' {test : test}} then {console.log($test);}}");
                assert.deepEqual(parsed3, {
                    define: [],
                    rules: [
                        {
                            name: 'test "rule"',
                            constraints: [
                                ["Clazz", "c", "c.name eq 'Test'", {test: "test"}]
                            ],
                            action: "console.log($test);",
                            options: {priority: 10}
                        }
                    ],
                    "scope": [],
                    "loaded": [],
                    "file": undefined
                });
            });

            it.should("parse rules with a priority with a ;", function () {
                var parsed3 = noolsParser.parse("rule 'test \"rule\"' { priority: 10; when { c : Clazz c.name eq 'Test' {test : test}} then {console.log($test);}}");
                assert.deepEqual(parsed3, {
                    define: [],
                    rules: [
                        {
                            name: 'test "rule"',
                            constraints: [
                                ["Clazz", "c", "c.name eq 'Test'", {test: "test"}]
                            ],
                            action: "console.log($test);",
                            options: {priority: 10}
                        }
                    ],
                    "scope": [],
                    "loaded": [],
                    "file": undefined
                });
            });

            it.should("throw an error if the salience is not a number", function () {
                assert.throws(function () {
                    noolsParser.parse("rule 'test \"rule\"' { priority: a; when { c : Clazz c.name eq 'Test' {test : test}} then {console.log($test);}}");
                });
                assert.throws(function () {
                    noolsParser.parse("rule 'test \"rule\"' { priority: 'a'; when { c : Clazz c.name eq 'Test' {test : test}} then {console.log($test);}}");
                });

                assert.throws(function () {
                    noolsParser.parse("rule 'test \"rule\"' { priority: true; when { c : Clazz c.name eq 'Test' {test : test}} then {console.log($test);}}");
                });
            });

        });

        it.describe("agenda-group/agendaGroup", function (it) {

            it.should("parse rules with a 'agenda-group'", function () {
                var parsed3 = noolsParser.parse("rule 'test \"rule\"' { agenda-group: group1, when { c : Clazz c.name eq 'Test' {test : test}} then {console.log($test);}}");
                assert.deepEqual(parsed3, {
                    define: [],
                    rules: [
                        {
                            name: 'test "rule"',
                            constraints: [
                                ["Clazz", "c", "c.name eq 'Test'", {test: "test"}]
                            ],
                            action: "console.log($test);",
                            options: {agendaGroup: "group1"}
                        }
                    ],
                    "scope": [],
                    "loaded": [],
                    "file": undefined
                });
            });

            it.should("parse rules with a 'agendaGroup'", function () {
                var parsed3 = noolsParser.parse("rule 'test \"rule\"' { agendaGroup: group1, when { c : Clazz c.name eq 'Test' {test : test}} then {console.log($test);}}");
                assert.deepEqual(parsed3, {
                    define: [],
                    rules: [
                        {
                            name: 'test "rule"',
                            constraints: [
                                ["Clazz", "c", "c.name eq 'Test'", {test: "test"}]
                            ],
                            action: "console.log($test);",
                            options: {agendaGroup: "group1"}
                        }
                    ],
                    "scope": [],
                    "loaded": [],
                    "file": undefined
                });
            });

            it.should("parse rules with a 'agenda-group' with names in '\"\'", function () {
                var parsed3 = noolsParser.parse("rule 'test \"rule\"' { agendaGroup: \"group one\"; when { c : Clazz c.name eq 'Test' {test : test}} then {console.log($test);}}");
                assert.deepEqual(parsed3, {
                    define: [],
                    rules: [
                        {
                            name: 'test "rule"',
                            constraints: [
                                ["Clazz", "c", "c.name eq 'Test'", {test: "test"}]
                            ],
                            action: "console.log($test);",
                            options: {agendaGroup: "group one"}
                        }
                    ],
                    "scope": [],
                    "loaded": [],
                    "file": undefined
                });
            });


            it.should("parse rules with a 'agenda-group' with names in \"'\"", function () {
                var parsed3 = noolsParser.parse("rule 'test \"rule\"' { agenda-group: 'group one'; when { c : Clazz c.name eq 'Test' {test : test}} then {console.log($test);}}");
                assert.deepEqual(parsed3, {
                    define: [],
                    rules: [
                        {
                            name: 'test "rule"',
                            constraints: [
                                ["Clazz", "c", "c.name eq 'Test'", {test: "test"}]
                            ],
                            action: "console.log($test);",
                            options: {agendaGroup: "group one"}
                        }
                    ],
                    "scope": [],
                    "loaded": [],
                    "file": undefined
                });
            });
        });

        it.describe("rules with auto-focus/autoFocus", function (it) {

            it.should("parse rules with a 'auto-focus' as true", function () {
                var parsed3 = noolsParser.parse("rule 'test \"rule\"' { agenda-group: 'group one'; auto-focus: true; when { c : Clazz c.name eq 'Test' {test : test}} then {console.log($test);}}");
                assert.deepEqual(parsed3, {
                    define: [],
                    rules: [
                        {
                            name: 'test "rule"',
                            constraints: [
                                ["Clazz", "c", "c.name eq 'Test'", {test: "test"}]
                            ],
                            action: "console.log($test);",
                            options: {agendaGroup: "group one", autoFocus: true}
                        }
                    ],
                    "scope": [],
                    "loaded": [],
                    "file": undefined
                });
            });

            it.should("parse rules with a 'auto-focus' as false", function () {
                var parsed3 = noolsParser.parse("rule 'test \"rule\"' { agenda-group: 'group one'; auto-focus: false; when { c : Clazz c.name eq 'Test' {test : test}} then {console.log($test);}}");
                assert.deepEqual(parsed3, {
                    define: [],
                    rules: [
                        {
                            name: 'test "rule"',
                            constraints: [
                                ["Clazz", "c", "c.name eq 'Test'", {test: "test"}]
                            ],
                            action: "console.log($test);",
                            options: {agendaGroup: "group one", autoFocus: false}
                        }
                    ],
                    "scope": [],
                    "loaded": [],
                    "file": undefined
                });
            });

            it.should("parse rules with a 'autoFocus' as true", function () {
                var parsed3 = noolsParser.parse("rule 'test \"rule\"' { agendaGroup: 'group one'; autoFocus: true; when { c : Clazz c.name eq 'Test' {test : test}} then {console.log($test);}}");
                assert.deepEqual(parsed3, {
                    define: [],
                    rules: [
                        {
                            name: 'test "rule"',
                            constraints: [
                                ["Clazz", "c", "c.name eq 'Test'", {test: "test"}]
                            ],
                            action: "console.log($test);",
                            options: {agendaGroup: "group one", autoFocus: true}
                        }
                    ],
                    "scope": [],
                    "loaded": [],
                    "file": undefined
                });
            });

            it.should("parse rules with a 'autoFocus' as false", function () {
                var parsed3 = noolsParser.parse("rule 'test \"rule\"' { agendaGroup: 'group one'; autoFocus: false; when { c : Clazz c.name eq 'Test' {test : test}} then {console.log($test);}}");
                assert.deepEqual(parsed3, {
                    define: [],
                    rules: [
                        {
                            name: 'test "rule"',
                            constraints: [
                                ["Clazz", "c", "c.name eq 'Test'", {test: "test"}]
                            ],
                            action: "console.log($test);",
                            options: {agendaGroup: "group one", autoFocus: false}
                        }
                    ],
                    "scope": [],
                    "loaded": [],
                    "file": undefined
                });
            });

            it.should("throw errors for values other than true or false", function () {
                assert.throws(function () {
                    noolsParser.parse("rule 'test \"rule\"' { agendaGroup: 'group one'; autoFocus: h; when { c : Clazz c.name eq 'Test' {test : test}} then {console.log($test);}}");
                });
                assert.throws(function () {
                    noolsParser.parse("rule 'test \"rule\"' { agendaGroup: 'group one'; autoFocus: 1; when { c : Clazz c.name eq 'Test' {test : test}} then {console.log($test);}}");
                });
            });

        });

        it.should("throw an error for invalid when clauses", function () {
            assert.throws(function () {
                //missing colon
                noolsParser.parse("rule TestRule { when {c  Clazz c.name eq 'Test' {test : test}} then {console.log($test);}}");
            });
            assert.throws(function () {
                //missing end curly
                noolsParser.parse("rule TestRule { when {c : Clazz c.name eq 'Test' {test : test} then {console.log($test);}}");
            });
            assert.throws(function () {
                //missing beginning curly
                noolsParser.parse("rule TestRule { when c : Clazz c.name eq 'Test' {test : test}} then {console.log($test);}}");
            });
        });

        it.should("throw an error for invalid then clauses", function () {
            assert.throws(function () {
                //missing start curly
                noolsParser.parse("rule TestRule { when {c : Clazz c.name eq 'Test' {test : test}} then console.log($test);}}");
            });
            assert.throws(function () {
                //missing end curly
                noolsParser.parse("rule TestRule { when {c : Clazz c.name eq 'Test' {test : test}} then {console.log($test);}");
            });
            assert.throws(function () {
                //extra colon
                noolsParser.parse("rule TestRule { when {c : Clazz c.name eq 'Test' {test : test}} then : {console.log($test);}}");
            });
        });

        it.should("parse rules with exists clause", function () {
            var parsed = noolsParser.parse("rule 'test \"rule\"' { when { exists(c : Clazz c.name eq 'Test' {test : test})} then {console.log($test);}}");
            assert.deepEqual(parsed, {
                define: [],
                rules: [
                    {
                        name: 'test "rule"',
                        constraints: [
                            ["exists", "Clazz", "c", "c.name eq 'Test'", {test: "test"}]
                        ],
                        action: "console.log($test);",
                        options: {}
                    }
                ],
                "scope": [],
                "loaded": [],
                "file": undefined
            });
        });

    });
});