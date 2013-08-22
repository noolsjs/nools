"use strict";
var it = require("it"),
    assert = require("assert"),
    noolsParser = require("../lib/parser/nools/nool.parser.js");

it.describe("nools dsl parser", function (it) {

    it.describe("parsing define", function (it) {
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
                "scope": []
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
                "scope": []
            });
        });

        it.describe("global", function (it) {

            it.should("parse a function call statement", function () {
                var parsed = noolsParser.parse("global util = require('util');");
                assert.equal(parsed.scope[0].name, 'util');
                assert.equal(parsed.scope[0].body, "require('util')");
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

    it.describe("parsing function", function (it) {

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

    it.describe("parsing rules", function (it) {

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
                "scope": []
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
                "scope": []
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
                "scope": []
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
                "scope": []
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
                "scope": []
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
                "scope": []
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
                "scope": []
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
                "scope": []
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
                "scope": []
            });
            var parsed2 = noolsParser.parse("rule TestRule { when { c : Clazz c.name eq 'Test' {test : test}} then {console.log($test);}}");
            assert.deepEqual(parsed, parsed2);
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
                "scope": []
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
                "scope": []
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
                "scope": []
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
                "scope": []
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
                    "scope": []
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
                    "scope": []
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
                    "scope": []
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
                    "scope": []
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
                    "scope": []
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
                    "scope": []
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
                    "scope": []
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
                    "scope": []
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
                    "scope": []
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
                    "scope": []
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
                    "scope": []
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
                    "scope": []
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

    });
});