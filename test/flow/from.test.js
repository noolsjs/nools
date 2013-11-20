"use strict";
var it = require("it"),
    assert = require("assert"),
    declare = require("declare.js"),
    dateExtended = require("date-extended"),
    nools = require("../../");

it.describe("from condition", function (it) {

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
                assert.equal(facts.a.zipcode, 88847);
                assert.equal(facts.first, "bob");
                assert.equal(facts.last, "yukon");
                called++;
            });

            flow.rule("from rule 2", [
                [Person, "p"],
                [Address, "a", "a.zipcode == 88845", "from p.address"],
                [String, "first", "first == 'bob'", "from p.firstName"],
                [String, "last", "last == 'yukon'", "from p.lastName"]
            ], function (facts) {
                assert.equal(facts.a, facts.p.address);
                assert.equal(facts.a.zipcode, 88845);
                assert.equal(facts.first, "bob");
                assert.equal(facts.last, "yukon");
                called++;
            });

            flow.rule("from rule 3", [
                [Person, "p"],
                [Address, "a", "a.zipcode == 88847", "from p.address"],
                [String, "first", "first == 'sally'", "from p.firstName"],
                [String, "last", "last == 'yukon'", "from p.lastName"]
            ], function (facts) {
                assert.equal(facts.a, facts.p.address);
                assert.equal(facts.a.zipcode, 88847);
                assert.equal(facts.first, "sally");
                assert.equal(facts.last, "yukon");
                called++;
            });

            flow.rule("from rule 4", [
                [Person, "p"],
                [Address, "a", "a.zipcode == 88845", "from p.address"],
                [String, "first", "first == 'sally'", "from p.firstName"],
                [String, "last", "last == 'yukons'", "from p.lastName"]
            ], function (facts) {
                assert.equal(facts.a, facts.p.address);
                assert.equal(facts.a.zipcode, 88845);
                assert.equal(facts.first, "sally");
                assert.equal(facts.last, "yukons");
                called++;
            });
        });

        it.should("create the proper match contexts", function () {
            var session = flow.getSession();
            session.assert(new Person("bob", "yukon", new Address(88847)));
            session.assert(new Person("sally", "yukons", new Address(88847)));
            return session.match().then(function () {
                assert.equal(called, 1);
            });
        });

        it.should("propagate modified facts properly", function () {
            var fired = [];
            var session = flow.getSession()
                .on("fire", function (name, rule) {
                    fired.push(name);
                });
            var p = new Person("bob", "yukon", new Address(88847));
            session.assert(p);
            return session.match().then(function () {
                assert.deepEqual(fired, ["from rule 1"]);
                fired.length = 0;
                session.modify(p, function () {
                    this.address = new Address(88845)
                });
                return session.match().then(function () {
                    assert.deepEqual(fired, ["from rule 2"]);
                    fired.length = 0;
                    session.modify(p, function () {
                        this.address = new Address(88847);
                        this.firstName = "sally";
                    });
                    return session.match().then(function () {
                        assert.deepEqual(fired, ["from rule 3"]);
                        fired.length = 0;
                        session.modify(p, function () {
                            this.address = new Address(88845);
                            this.lastName = "yukons"
                        });
                        return session.match().then(function () {
                            assert.deepEqual(fired, ["from rule 4"]);
                            fired.length = 0;
                        });
                    });
                });
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

    it.describe("with js source", function (it) {

        var called = 0;

        function MyValue(n2) {
            this.value = n2;
        }

        var flow = nools.flow("from flow js source", function (flow) {
            flow.rule("from rule 1", [
                [MyValue, "n1"],
                [Number, "n2", "n1.value == n2", "from [1,2,3,4,5]"]
            ], function (facts) {
                assert.equal(facts.n1.value, facts.n2);
                assert.isTrue([1, 2, 3, 4, 5].indexOf(facts.n2) !== -1);
                called++;
            });

            flow.rule("from rule 2", [
                [MyValue, "n1"],
                [String, "n2", "n1.value == n2", "from ['a' ,'b', 'c', 'd', 'e']"]
            ], function (facts) {
                assert.equal(facts.n1.value, facts.n2);
                assert.isTrue(['a' , 'b', 'c', 'd', 'e', 'f'].indexOf(facts.n2) !== -1);
                called++;
            });

            flow.rule("from rule 3 with function", [
                [MyValue, "n1", "isDate(n1.value)"],
                [Date, "n2", "dateCmp(n1.value, n2)", "from daysFromNow(1)"]
            ], function (facts) {
                assert.isDate(facts.n1.value);
                assert.isDate(facts.n2);
                called++;
            });

            flow.rule("from rule 4 with scope function", {
                scope: {
                    myArr: function () {
                        return ["f", "g", "h", "i", "j"]
                    }
                }
            }, [
                [MyValue, "n1"],
                [String, "n2", "n1.value == n2", "from myArr()"]
            ], function (facts) {
                assert.equal(facts.n1.value, facts.n2);
                assert.isTrue(["f", "g", "h", "i", "j"].indexOf(facts.n2) !== -1);
                called++;
            });
        });

        it.should("create the proper match contexts", function () {

            var session = flow.getSession(
                new MyValue(1),
                new MyValue(2),
                new MyValue(3),
                new MyValue(4),
                new MyValue(5),
                new MyValue('a'),
                new MyValue('b'),
                new MyValue('c'),
                new MyValue('d'),
                new MyValue('e'),
                new MyValue(dateExtended.daysFromNow(1)),
                new MyValue('f'),
                new MyValue('g'),
                new MyValue('h'),
                new MyValue('i'),
                new MyValue('j')

            );
            return session.match().then(function () {
                assert.equal(called, 16);
            });
        });

        it.should("propagate modified facts properly", function () {
            var fired = [];
            var session = flow.getSession()
                .on("fire", function (name, rule) {
                    fired.push(name);
                });
            var v = new MyValue(1);
            session.assert(v);
            return session.match().then(function () {
                assert.deepEqual(fired, ["from rule 1"]);
                fired.length = 0;
                session.modify(v, function () {
                    this.value = "a";
                });
                return session.match().then(function () {
                    assert.deepEqual(fired, ["from rule 2"]);
                    fired.length = 0;
                    session.modify(v, function () {
                        this.value = 1;
                    });
                });
            });
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
            var fired = [], names = [];
            var session = flow.getSession()
                .on("fire", function (name, facts) {
                    if (facts.first.match(/^b/)) {
                        assert.equal(name, "from rule 2");
                    } else {
                        assert.equal(name, "from rule 1");
                    }
                    names.push([facts.p.firstName, facts.first]);
                    fired.push(name);
                });
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
                assert.deepEqual(fired, [
                    'from rule 1',
                    'from rule 1',
                    'from rule 2',
                    'from rule 2',
                    'from rule 1',
                    'from rule 1',
                    'from rule 2',
                    'from rule 1',
                    'from rule 2',
                    'from rule 2',
                    'from rule 1',
                    'from rule 2',
                    'from rule 2',
                    'from rule 1',
                    'from rule 1',
                    'from rule 2'
                ]);
                fired.length = 0;
                session.modify(persons[0], function () {
                    this.firstName = "craig";
                });
                session.modify(persons[1], function () {
                    this.firstName = "sally";
                });
                session.modify(persons[2], function () {
                    this.firstName = "thede";
                });
                session.modify(persons[3], function () {
                    this.firstName = "jake";
                });
                session.modify(persons[4], function () {
                    this.firstName = "john";
                });
                return session.match().then(function () {
                    assert.lengthOf(fired, 0);
                    fired.length = 0;
                    names.length = 0;
                    session.modify(persons[0], function () {
                        this.firstName = "bob";
                    });
                    session.modify(persons[1], function () {
                        this.firstName = "bobby";
                    });
                    session.modify(persons[2], function () {
                        this.firstName = "billy";
                    });
                    session.modify(persons[3], function () {
                        this.firstName = "brian";
                    });
                    session.modify(persons[4], function () {
                        this.firstName = "bryan";
                    });
                    return session.match().then(function () {
                        names.sort(function (a, b) {
                            return a[0] === b[0] ? a[1] === b[1] ? 0 : a[1] > b[1] ? 1 : -1 : a[0] > b[0] ? 1 : -1;
                        });
                        assert.deepEqual(names, [
                            [ 'billy', 'bob' ],
                            [ 'billy', 'bobby' ],
                            [ 'billy', 'brian' ],
                            [ 'billy', 'bryan' ],
                            [ 'bob', 'billy' ],
                            [ 'bob', 'bobby' ],
                            [ 'bob', 'brian' ],
                            [ 'bob', 'bryan' ],

                            [ 'bobby', 'billy' ],
                            [ 'bobby', 'bob' ],
                            [ 'bobby', 'brian' ],
                            [ 'bobby', 'bryan' ],

                            [ 'brian', 'billy' ],
                            [ 'brian', 'bob' ],
                            [ 'brian', 'bobby' ],
                            [ 'brian', 'bryan' ],

                            [ 'bryan', 'billy' ],
                            [ 'bryan', 'bob' ],
                            [ 'bryan', 'bobby' ],
                            [ 'bryan', 'brian' ]
                        ]);
                        assert.lengthOf(fired, 20);
                    })
                })

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
            assert.equal(session.agenda.getFocusedAgenda().toArray().length, 16);
            for (i = 0, l = persons.length; i < l; i++) {
                session.retract(persons[i]);
            }
            assert.equal(session.agenda.getFocusedAgenda().toArray().length, 0);
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
                ["not", Person, "friend", "p != friend && friend.lastName != p.lastName", "from p.friends"]
            ], function (facts) {
                assert.isUndefined(facts.friend);
                called1++;
            });

            flow.rule("from not rule 2", [
                [Person, "p"],
                ["not", Person, "friend", "p != friend && friend.lastName == p.lastName", "from p.friends"]
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
//                        if (f !== p) {
                    p.friends.push(f);
//                        }
                }
                session.assert(p);
            }
            return session.match().then(function () {
                assert.equal(called1, 5);
                assert.equal(called2, 0);
                called1 = called2 = 0;
                session.modify(persons[0], function () {
                    this.lastName = "yukon";
                });
                session.modify(persons[1], function () {
                    this.lastName = "yuko";
                });
                session.modify(persons[2], function () {
                    this.lastName = "yuk";
                });
                session.modify(persons[3], function () {
                    this.lastName = "yu";
                });
                session.modify(persons[4], function () {
                    this.lastName = "y";
                });

                return session.match().then(function () {
                    assert.equal(called1, 0);
                    assert.equal(called2, 5);
                    called1 = called2 = 0;
                    session.modify(persons[0], function () {
                        this.lastName = "yukon";
                    });
                    session.modify(persons[1], function () {
                        this.lastName = "yukon";
                    });
                    session.modify(persons[2], function () {
                        this.lastName = "yukon";
                    });
                    session.modify(persons[3], function () {
                        this.lastName = "yukon";
                    });
                    session.modify(persons[4], function () {
                        this.lastName = "yukon";
                    });
                    session.modify(persons[0], function () {
                        this.lastName = "yukon";
                    });
                    session.modify(persons[1], function () {
                        this.lastName = "yuko";
                    });
                    session.modify(persons[2], function () {
                        this.lastName = "yuk";
                    });
                    session.modify(persons[3], function () {
                        this.lastName = "yu";
                    });
                    session.modify(persons[4], function () {
                        this.lastName = "y";
                    });
                    return session.match().then(function () {
                        assert.equal(called1, 0);
                        assert.equal(called2, 5);
                    });
                });
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
                    p.friends.push(f);
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