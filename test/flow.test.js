"use strict";
var it = require("it"),
    declare = require("declare.js"),
    assert = require("assert"),
    nools = require("../index");

it.describe("nools", function (it) {
    it.describe("#flow", function (it) {
        it.should("create a flow", function () {
            var flow = nools.flow("nools flow");
            assert.isNotNull(flow);
            assert.instanceOf(flow, nools.Flow);
            assert.equal("nools flow", flow.name);
            assert.equal(nools.getFlow("nools flow"), flow);
        });
    });
});

it.describe("Flow",function (it) {

    //it.timeout(1000);

    it.describe("#rule", function (it) {
        var called = 0;
        var flow = nools.flow("test flow");
        it.should("create a rule", function () {
            flow.rule("test rule", [String, "s", "s == 'hello'"], function () {
                called++;
            });
            assert.isTrue(flow.containsRule("test rule"));
        });

        it.should("create a rule with joins properly", function () {
            flow.rule("test rule2", [
                [String, "s", "s == 'hello'"],
                [String, "s2", "s2 == 'world'"],
                [String, "s3", "s3 == 'Hi'"]
            ], function () {
                called++;
            });
            assert.isTrue(flow.containsRule("test rule2"));
        });

        it.should("create a rules that are dependent on eachother properly", function () {
            flow.rule("test rule3", [
                [String, "s", "s == 'hello'"],
                [String, "s2", "s2 == 'world'"],
                [String, "s3", "s3 == 'Hi'"]
            ], function () {
                called++;
            });
            assert.isTrue(flow.containsRule("test rule3"));

            flow.rule("test rule4", [
                [String, "s1"],
                [String, "s2", "s2 == 'world' && s1 == 'hello' "],
                [String, "s3", "s3 == 'Hi'"],
                [String, "s4", "s4 == 'what'"],
                [String, "s5", "s5 == 'for'"]
            ], function () {
                called++;
            });
            assert.isTrue(flow.containsRule("test rule4"));
        });

    });
    it.describe("simple rule", function (it) {

        var called = 0;
        var HelloFact = declare({
            instance: {
                value: true
            }
        });

        var flow = nools.flow("hello world flow", function (flow) {
            flow.rule("hello rule", [HelloFact, "h"], function () {
                called++;
            });
        });

        it.should("call hello world rule", function () {
            var session = flow.getSession();
            session.assert(new HelloFact());
            session.match();
            assert.equal(called, 1);
        });

    });

    it.describe("rule with from", function (it) {

        it.describe("with non array properties", function (it) {

            var called = 0;
            var Address = declare({
                instance: {
                    constructor: function (zip) {
                        this.zipcode = zip;
                    }
                }
            });
            var Person = declare({
                instance: {
                    constructor: function (first, last, address) {
                        this.firstName = first;
                        this.lastName = last;
                        this.address = address;
                    }
                }
            });

            var flow = nools.flow("from flow", function (flow) {
                flow.rule("from rule 1", [
                    [Person, "p"],
                    [Address, "a", "a.zipcode == 88847", "from p.address"],
                    [String, "first", "first == 'bob'", "from p.firstName"],
                    [String, "last", "last == 'yukon'", "from p.lastName"]
                ], function (facts) {
                    assert.equal(facts.a, facts.p.address);
                    assert.equal(facts.first, "bob");
                    assert.equal(facts.last, "yukon");
                    called++;
                });
            });

            it.should("call create the proper match contexts", function () {
                var session = flow.getSession();
                session.assert(new Person("bob", "yukon", new Address(88847)));
                session.assert(new Person("sally", "yukon", new Address(88847)));
                return session.match().then(function () {
                    assert.equal(called, 1);
                });
            });

            it.should("retract facts properly", function () {
                var session = flow.getSession();
                var p = new Person("bob", "yukon", new Address(88847));
                session.assert(p);
                assert.equal(session.agenda.peek().name, "from rule 1");
                session.retract(p);
                assert.isTrue(session.agenda.isEmpty());
            });
        });

        it.describe("with array properties", function (it) {

            var called = 0;
            var Person = declare({
                instance: {
                    constructor: function (first, last, friends) {
                        this.firstName = first;
                        this.lastName = last;
                        this.friends = friends || [];
                    }
                }
            });

            var flow = nools.flow("from flow with arrays", function (flow) {
                flow.rule("from rule 1", [
                    [Person, "p"],
                    [Person, "friend", "friend.firstName != p.firstName", "from p.friends"],
                    [String, "first", "first =~ /^a/", "from friend.firstName"]
                ], function (facts) {
                    assert.isTrue(/^a/.test(facts.first));
                    called++;
                });

                flow.rule("from rule 2", [
                    [Person, "p"],
                    [Person, "friend", "friend.firstName != p.firstName", "from p.friends"],
                    [String, "first", "first =~ /^b/", "from friend.firstName"]
                ], function (facts) {
                    assert.isTrue(/^b/.test(facts.first));
                    called++;
                });
            });

            it.should("create all cross product matches", function () {
                var session = flow.getSession();
                var persons = [
                    new Person("bob", "yukon"),
                    new Person("andy", "yukon"),
                    new Person("andrew", "yukon"),
                    new Person("billy", "yukon"),
                    new Person("sally", "yukon")
                ];
                //create graph
                for (var i = 0, l = persons.length; i < l; i++) {
                    var p = persons[i], f;
                    for (var j = 0, l2 = persons.length; j < l2; j++) {
                        f = persons[j];
                        if (f !== p) {
                            p.friends.push(f);
                        }
                    }
                    session.assert(p);
                }
                return session.match().then(function () {
                    assert.equal(called, 16);
                });
            });

            it.should("retract all cross product matches", function () {
                var session = flow.getSession();
                var persons = [
                    new Person("bob", "yukon"),
                    new Person("andy", "yukon"),
                    new Person("andrew", "yukon"),
                    new Person("billy", "yukon"),
                    new Person("sally", "yukon")
                ];
                //create graph
                for (var i = 0, l = persons.length; i < l; i++) {
                    var p = persons[i], f;
                    for (var j = 0, l2 = persons.length; j < l2; j++) {
                        f = persons[j];
                        if (f !== p) {
                            p.friends.push(f);
                        }
                    }
                    session.assert(p);
                }
                assert.equal(session.agenda.masterAgenda.toArray().length, 16);
                for (i = 0, l = persons.length; i < l; i++) {
                    session.retract(persons[i]);
                }
                assert.equal(session.agenda.masterAgenda.toArray().length, 0);
            });
        });

        it.describe("with not node", function (it) {

            var called1 = 0, called2 = 0;
            var Person = declare({
                instance: {
                    constructor: function (first, last, friends) {
                        this.firstName = first;
                        this.lastName = last;
                        this.friends = friends || [];
                    }
                }
            });

            var flow = nools.flow("from flow with from and not", function (flow) {
                flow.rule("from not rule 1", [
                    [Person, "p"],
                    ["not", Person, "friend", "friend.lastName != p.lastName", "from p.friends"]
                ], function (facts) {
                    assert.isUndefined(facts.friend);
                    called1++;
                });

                flow.rule("from not rule 2", [
                    [Person, "p"],
                    ["not", Person, "friend", "friend.lastName == p.lastName", "from p.friends"]
                ], function (facts) {
                    assert.isUndefined(facts.friend);
                    called2++;
                });
            });

            it.should("only fullfill if all facts evaluate to false", function () {
                var session = flow.getSession();
                var persons = [
                    new Person("bob", "yukon"),
                    new Person("andy", "yukon"),
                    new Person("andrew", "yukon"),
                    new Person("billy", "yukon"),
                    new Person("sally", "yukon")
                ];
                //create graph
                for (var i = 0, l = persons.length; i < l; i++) {
                    var p = persons[i], f;
                    for (var j = 0, l2 = persons.length; j < l2; j++) {
                        f = persons[j];
                        if (f !== p) {
                            p.friends.push(f);
                        }
                    }
                    session.assert(p);
                }
                return session.match().then(function () {
                    assert.equal(called1, 5);
                    assert.equal(called2, 0);
                });
            });

            it.should("only fullfill if all facts evaluate to false", function () {
                called1 = 0, called2 = 0;
                var session = flow.getSession();
                var persons = [
                    new Person("bob", "yukon"),
                    new Person("andy", "yukon"),
                    new Person("andrew", "yukon"),
                    new Person("billy", "yukon"),
                    new Person("sally", "yukon"),
                    new Person("sally", "yukons")
                ];
                //create graph
                for (var i = 0, l = persons.length; i < l; i++) {
                    var p = persons[i], f;
                    for (var j = 0, l2 = persons.length; j < l2; j++) {
                        f = persons[j];
                        if (f !== p) {
                            p.friends.push(f);
                        }
                    }
                    session.assert(p);
                }
                return session.match().then(function () {
                    assert.equal(called1, 0);
                    assert.equal(called2, 1);
                });
            });
        });

    });

    it.describe("not rule", function (it) {

        it.describe("with a single fact", function (it) {
            var called = 0;

            var flow = nools.flow("notRuleSingleFact", function (flow) {
                flow.rule("hello rule", ["not", String, "s", "s == 'hello'"], function (facts) {
                    assert.isUndefined(facts.s);
                    called++;
                });
            });

            it.should("call when a string that does not equal 'hello'", function () {
                return flow.getSession("world").match().then(function () {
                    assert.equal(called, 1);
                });
            });

            it.should(" not call when a string that does equal 'hello'", function () {
                called = 0;
                return flow.getSession("hello").match().then(function () {
                    assert.equal(called, 0);
                });
            });

            it.should(" not call when a string that does equal 'hello' and one that does not", function () {
                called = 0;
                return flow.getSession("hello", "world").match().then(function () {
                    assert.equal(called, 0);
                });
            });

        });

        it.describe("with multiple facts", function (it) {
            var called = 0, arr = [];
            var flow1 = nools.flow("notRuleMultiFact", function (flow) {
                flow.rule("order rule", [
                    [Number, "n1"],
                    ["not", Number, "n2", "n1 > n2"]
                ], function (facts, flow) {
                    arr.push(facts.n1);
                    flow.retract(facts.n1);
                    called++;
                });
            });

            var flow2 = nools.flow("notRuleMultiFact2", function (flow) {
                flow.rule("order rule reverse", [
                    [Number, "n1"],
                    ["not", Number, "n2", "n1 < n2"]
                ], function (facts, flow) {
                    arr.push(facts.n1);
                    flow.retract(facts.n1);
                    called++;
                });
            });

            it.should("fire rules in order", function () {
                return flow1.getSession(3, 1, 5, 2, 4).match().then(function () {
                    assert.deepEqual(arr, [1, 2, 3, 4, 5]);
                    assert.equal(called, 5);
                }).then(function () {
                        arr = [], called = 0;
                        return flow2.getSession(4, 2, 5, 1, 3).match().then(function () {
                            assert.deepEqual(arr, [5, 4, 3, 2, 1]);
                            assert.equal(called, 5);
                        });
                    });
            });
        });

    });

    it.describe("or rule", function (it) {

        var Count = function () {
            this.called = 0;
        }, called = new Count();

        var flow = nools.flow("hello world flow 3", function (flow) {
            flow.rule("hello rule", [
                ["or",
                    [String, "s", "s == 'hello'"],
                    [String, "s", "s == 'world'"]
                ],
                [Count, "called", null]
            ], function (facts) {
                facts.called.called++;
            });
        });

        it.should("call when a string equals 'hello'", function () {
            return flow.getSession("world", called).match().then(function () {
                assert.equal(called.called, 1);
            });
        });

        it.should("call when a string equals 'world'", function () {
            called = new Count();
            return flow.getSession("hello", called).match().then(function () {
                assert.equal(called.called, 1);
            });
        });

        it.should(" not call when a string that does equal 'hello' or 'world", function () {
            called = new Count();
            return flow.getSession("hello", "world", "test", called).match().then(function () {
                assert.equal(called.called, 2);
            });

        });

    });

    it.describe("scope option", function (it) {

        function isEqualTo(str, eq) {
            return str === eq;
        }

        var Count = function () {
            this.called = 0;
        }, called = new Count();

        var flow = nools.flow("scope test", function (flow) {
            flow.rule("hello rule", {scope: {isEqualTo: isEqualTo}}, [
                ["or",
                    [String, "s", "isEqualTo(s, 'hello')"],
                    [String, "s", "isEqualTo(s, 'world')"]
                ],
                [Count, "called", null]
            ], function (facts) {
                facts.called.called++;
            });
        });

        it.should("call when a string equals 'hello'", function () {
            return flow.getSession("world", called).match().then(function () {
                assert.equal(called.called, 1);
            });
        });

        it.should("call when a string equals 'world'", function () {
            called = new Count();
            return flow.getSession("hello", called).match().then(function () {
                assert.equal(called.called, 1);
            });
        });

        it.should(" not call when a string that does equal 'hello' or 'world", function () {
            called = new Count();
            return flow.getSession("hello", "world", "test", called).match().then(function () {
                assert.equal(called.called, 2);
            });

        });

    });

    it.describe("events", function (it) {

        it.timeout(1000);

        function Message(m) {
            this.message = m;
        }

        var session, flow = nools.flow("Simple", function (flow) {
            flow.rule("Hello", [Message, "m", "m.message =~ /^hello(\\s*world)?$/"], function (facts) {
                this.modify(facts.m, function () {
                    this.message += " goodbye";
                });
            });

            flow.rule("Goodbye", [Message, "m", "m.message =~ /.*goodbye$/"], function () {
            });

        });

        it.beforeEach(function () {
            session = flow.getSession();
        });

        it.should("emit when facts are asserted", function (next) {
            var m = new Message("hello");
            session.once("assert", function (fact) {
                assert.deepEqual(fact, m);
                next();
            });
            session.assert(m);
        });

        it.should("emit when facts are retracted", function (next) {
            var m = new Message("hello");
            session.once("retract", function (fact) {
                assert.deepEqual(fact, m);
                next();
            });
            session.assert(m);
            session.retract(m);
        });

        it.should("emit when facts are modified", function (next) {
            var m = new Message("hello");
            session.once("modify", function (fact) {
                assert.deepEqual(fact, m);
                next();
            });
            session.assert(m);
            session.modify(m);
        });

        it.should("emit when rules are fired", function (next) {
            var m = new Message("hello"), m2 = new Message("hello");
            var fire = [
                ["Hello", "hello"],
                ["Goodbye", "hello goodbye"],
                ["Hello", "hello"],
                ["Goodbye", "hello goodbye"]
            ], i = 0;
            session.on("fire", function (name, facts) {
                assert.equal(name, fire[i][0]);
                assert.equal(facts.m.message, fire[i++][1]);
            });
            session.assert(m);
            session.assert(m2);
            session.match(function () {
                assert.equal(i, fire.length);
                next();
            });

        });

    });

    it.describe("#matchUntilHalt", function (it) {
        function Message(m) {
            this.message = m;
        }

        var session, flow = nools.flow("Halt Flow", function (flow) {
            flow.rule("Hello", [Message, "m", "m.message =~ /^hello(\\s*world)?$/"], function (facts) {
                this.modify(facts.m, function () {
                    this.message += " goodbye";
                });
            });

            flow.rule("Goodbye", [Message, "m", "m.message =~ /.*goodbye$/"], function () {
            });

        });

        it.beforeEach(function () {
            session = flow.getSession();
        });

        it.should("match until halt is called", function () {
            var count = 0, called = 0;
            session.on("fire", function () {
                called++;
            });
            var interval = setInterval(function () {
                if (count++ >= 5) {
                    clearInterval(interval);
                    session.halt();
                } else {
                    session.assert(new Message("hello"));
                }
            }, 100);
            return session.matchUntilHalt(function (err) {
                assert.isNull(err);
                assert.equal(called, 10);
            });

        });
    });

    it.describe("fibonacci", function (it) {

        var Fibonacci = declare({
            instance: {
                constructor: function (sequence, value) {
                    this.sequence = sequence;
                    this.value = value || -1;
                }
            }
        });
        var result = null;
        var flow = nools.flow("Fibonacci Flow", function (flow) {

            flow.rule("Recurse", [
                ["not", Fibonacci, "nf", "nf.sequence == 1"],
                [Fibonacci, "f", "f.value == -1"]
            ], function (facts) {
                var f2 = new Fibonacci(facts.f.sequence - 1);
                this.assert(f2);
            });

            flow.rule("Bootstrap", [Fibonacci, "f", "f.value == -1 && (f.sequence == 1 || f.sequence == 2)"], function (facts) {
                this.modify(facts.f, function () {
                    this.value = 1;
                });
            });

            flow.rule("Calculate", [
                [Fibonacci, "f1", "f1.value != -1", {sequence: "s1"}],
                [Fibonacci, "f2", "f2.value != -1 && f2.sequence == s1 + 1", {sequence: "s2"}],
                [Fibonacci, "f3", "f3.value == -1 && f3.sequence == s2 + 1"]
            ], function (facts) {
                facts.f3.value = facts.f1.value + facts.f2.value;
                result = facts.f3.value;
                this.modify(facts.f3);
            });
        });


        it.afterEach(function () {
            result = [];
        });


        it.should("calculate Fibonacci of 10", function () {
            var session = flow.getSession(new Fibonacci(10));
            return session.match().then(function () {
                session.dispose();
                assert.equal(result, 55);
            });
        });

        it.should("calculate Fibonacci of 150", function () {
            var session = flow.getSession(new Fibonacci(150));
            return session.match().then(function () {
                session.dispose();
                assert.equal(result, 9.969216677189305e+30);
            });
        });

    });


    it.describe("diagnosis", function (it) {

        var Patient = declare({
            instance: {
                constructor: function (name, fever, spots, rash, soreThroat, innoculated) {
                    this.name = name;
                    this.fever = fever;
                    this.spots = spots;
                    this.rash = rash;
                    this.soreThroat = soreThroat;
                    this.innoculated = innoculated;
                }
            }
        });

        var Diagnosis = declare({
            instance: {
                constructor: function (name, diagnosis) {
                    this.name = name;
                    this.diagnosis = diagnosis;
                }
            }
        });

        var Treatment = declare({
            instance: {
                constructor: function (name, treatment) {
                    this.name = name;
                    this.treatment = treatment;
                }
            }
        });

        var results = [];
        var flow = nools.flow("Diagnosis", function (flow) {

            flow.rule("Measels", [
                [Patient, "p", "p.fever == 'high' && p.spots == true && p.innoculated == true", {name: "n"}],
                ["not", Diagnosis, "d", "d.name == n && d.diagnosis == 'allergy'"]
            ],
                function (facts) {
                    var name = facts.n;
                    this.assert(new Diagnosis(name, "measles"));
                });

            flow.rule("Allergy1", [
                [Patient, "p", "p.spots == true", {name: "n"}],
                ["not", Diagnosis, "d", "d.name == n && d.diagnosis == 'measles'"]
            ], function (facts) {
                var name = facts.n;
                this.assert(new Diagnosis(name, "allergy"));
            });

            flow.rule("Allergy2", [Patient, "p", "p.rash == true", {name: "n"}], function (facts) {
                var name = facts.n;
                this.assert(new Diagnosis(name, "allergy"));
            });

            flow.rule("Flu", [Patient, "p", "p.soreThroat == true && p.fever in ['mild', 'high']", {name: "n"}], function (facts) {
                var name = facts.n;
                this.assert(new Diagnosis(name, "flu"));
            });

            flow.rule("Penicillin", [Diagnosis, "d", "d.diagnosis == 'measles'", {name: "n"}], function (facts) {
                var name = facts.n;
                this.assert(new Treatment(name, "penicillin"));
            });

            flow.rule("Allergy Pills", [Diagnosis, "d", "d.diagnosis == 'allergy'", {name: "n"}], function (facts) {
                var name = facts.n;
                this.assert(new Treatment(name, "allegryShot"));
            });

            flow.rule("Bed Rest", [Diagnosis, "d", "d.diagnosis == 'flu'", {name: "n"}], function (facts) {
                var name = facts.n;
                this.assert(new Treatment(name, "bedRest"));
            });

            flow.rule("Collect", [Treatment, "t"], function (facts) {
                results.push(facts.t);
            });

        });

        it.afterEach(function () {
            results = [];
        });

        it.should("treat properly", function () {
            var session = flow.getSession();
            session.assert(new Patient("Fred", "none", true, false, false, false));
            session.assert(new Patient("Joe", "high", false, false, true, false));
            session.assert(new Patient("Bob", "high", true, false, false, true));
            session.assert(new Patient("Tom", "none", false, true, false, false));
            return session.match().then(function () {
                session.dispose();
                assert.deepEqual(results, [
                    {"name": "Tom", "treatment": "allegryShot"},
                    {"name": "Bob", "treatment": "penicillin"},
                    {"name": "Joe", "treatment": "bedRest"},
                    {"name": "Fred", "treatment": "allegryShot"}
                ]);
            });
        });

        it.should("treat properly on consecutive runs", function () {
            var session = flow.getSession();
            session.assert(new Patient("Tom", "none", true, false, false, false));
            session.assert(new Patient("Bob", "high", false, false, true, false));
            session.assert(new Patient("Joe", "high", true, false, false, true));
            session.assert(new Patient("Fred", "none", false, true, false, false));
            return session.match().then(function () {
                session.dispose();
                assert.deepEqual(results, [
                    {"name": "Fred", "treatment": "allegryShot"},
                    {"name": "Joe", "treatment": "penicillin"},
                    {"name": "Bob", "treatment": "bedRest"},
                    {"name": "Tom", "treatment": "allegryShot"}
                ]);
            });
        });
    });

}).as(module);














