(function () {
    "use strict";
    var it = require("it"),
        assert = require("assert"),
        noolsParser = require("../lib/parser/nools/nool.parser.js");

    it.describe("nools dsl parser", function (it) {

        it.describe("parsing define", function (it) {
            it.should("parse a define statement", function () {
                var parsed = noolsParser.parse("define Test {myProp : 'value'}");
                assert.deepEqual(parsed, {
                    define:[
                        {
                            name:"Test",
                            properties:{
                                myProp:"value"
                            }
                        }
                    ],
                    "rules":[]
                });
                parsed = noolsParser.parse("define Test {myFunc : function(){}}");
                //have to test this way because deepEqual cannot include functions
                assert.isFunction(parsed.define[0].properties.myFunc);
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
        });

        it.describe("parsing rules", function (it) {

            it.should("parse rules", function () {
                var parsed = noolsParser.parse("rule TestRule {when {c : Clazz c.name eq 'Test' {test : test}} then {console.log($test);}}");
                assert.deepEqual(parsed, {
                    define:[],
                    rules:[
                        {
                            name:"TestRule",
                            constraints:[
                                ["Clazz", "c", "c.name eq 'Test'", {test:"test"}]
                            ],
                            action:"console.log($test);"
                        }
                    ]
                });
            });

            it.should("throw an error for invalid rule blocks", function () {
                assert.throws(function () {
                    noolsParser.parse("rule TestRule when {c : Clazz c.name eq 'Test' {test : test}} then {console.log($test);}}");
                });
                assert.throws(function () {
                    noolsParser.parse("rule TestRule { when {c : Clazz c.name eq 'Test' {test : test}} then {console.log($test);}");
                });
                assert.throws(function () {
                    noolsParser.parse("rule TestRule : { when {c : Clazz c.name eq 'Test' {test : test}} then {console.log($test);}");
                });
            });

            it.should("throw an error for a missing name", function () {
                assert.throws(function () {
                    noolsParser.parse("rule { when {c : Clazz c.name eq 'Test' {test : test}} then {console.log($test);}");
                });
            });

            it.should("parse when clause predicate conditions", function () {
                var parsed = noolsParser.parse("rule TestRule { when {not(c : Clazz {test : test} c.name eq 'Test')} then {console.log($test);}}");
                assert.deepEqual(parsed, {
                    define:[],
                    rules:[
                        {
                            name:"TestRule",
                            constraints:[
                                ["not", 'Clazz',"c", "c.name eq 'Test'", {test:"test"}]
                            ],
                            action:"console.log($test);"
                        }
                    ]
                });
                var parsed2 = noolsParser.parse("rule TestRule { when { not(c : Clazz c.name eq 'Test' {test : test})} then {console.log($test);}}");
                assert.deepEqual(parsed, parsed2);
            });

            it.should("parse when clause with hash and constraints in any order", function () {
                var parsed = noolsParser.parse("rule TestRule { when { c : Clazz {test : test} c.name eq 'Test'} then {console.log($test);}}");
                assert.deepEqual(parsed, {
                    define:[],
                    rules:[
                        {
                            name:"TestRule",
                            constraints:[
                                ["Clazz", "c", "c.name eq 'Test'", {test:"test"}]
                            ],
                            action:"console.log($test);"
                        }
                    ]
                });
                var parsed2 = noolsParser.parse("rule TestRule { when { c : Clazz c.name eq 'Test' {test : test}} then {console.log($test);}}");
                assert.deepEqual(parsed, parsed2);
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


        it.run();
    });

})();