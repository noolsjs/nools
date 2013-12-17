var it = require("it"),
    assert = require("assert"),
    Context = require("../../lib/context"),
    WorkingMemory = require("../../lib/workingMemory").WorkingMemory,
    LeftMemory = require("../../lib/nodes/misc/leftMemory");

it.describe("BetaNode LeftMemory", function (it) {

    it.should("add a context to the memory", function () {
        var wm = new WorkingMemory(),
            lm = new LeftMemory(),
            fact = wm.assertFact("s"),
            context = new Context(fact);
        lm.push(context);
        assert.equal(lm.length, 1);

    });

    it.should("remove a context from the memory", function () {
        var wm = new WorkingMemory(),
            lm = new LeftMemory(),
            fact = wm.assertFact("s"),
            context = new Context(fact);
        var node = lm.push(context);
        assert.equal(lm.length, 1);
        lm.remove(node);
        assert.equal(lm.length, 0);
    });

    it.should("addIndexes to the memory", function () {
        var lm = new LeftMemory();
        lm.addIndex("s.a", "a.s");
        assert.lengthOf(lm.indexes, 1);
        var index = lm.indexes[0];
        assert.equal(index[0], "s.a");
        assert.equal(index[1], "a.s");
        assert.isFunction(index[2]);
        assert.isFunction(index[3]);
        assert.equal(index[4], "eq");
        assert.deepEqual(index[2]({s: {a: 1}}), 1);
        assert.deepEqual(index[3]({a: {s: 1}}), 1);
    });

    it.should("add an index and accept an operator", function () {
        var lm = new LeftMemory();
        lm.addIndex("s.a", "a.s", "neq");
        assert.lengthOf(lm.indexes, 1);
        var index = lm.indexes[0];
        assert.equal(index[0], "s.a");
        assert.equal(index[1], "a.s");
        assert.isFunction(index[2]);
        assert.isFunction(index[3]);
        assert.equal(index[4], "neq");
        assert.deepEqual(index[2]({s: {a: 1}}), 1);
        assert.deepEqual(index[3]({a: {s: 1}}), 1);
    });

    it.should("add a context and index it", function () {
        var wm = new WorkingMemory(),
            lm = new LeftMemory(),
            leftFact = wm.assertFact({a: 1}),
            leftContext = new Context(leftFact);
        leftContext.set("s", {a: 1});
        lm.addIndex("s.a", "a.s");
        var node = lm.push(leftContext);
        assert.equal(lm.length, 1);
        assert.isTrue("s.a" in lm.tables.tables);
        assert.isTrue(lm.tables.tables["s.a"].contains(1));
        assert.deepEqual(lm.tables.tables["s.a"].get(1).tuples, [node]);
    });

    it.should("remove a context and unindex it", function () {
        var wm = new WorkingMemory(),
            rm = new LeftMemory(),
            leftFact = wm.assertFact({a: 1}),
            leftContext = new Context(leftFact);
        leftContext.set("s", {a: 1});
        rm.addIndex("s.a", "a.s");
        var node = rm.push(leftContext);
        assert.equal(rm.length, 1);
        rm.remove(node);
        assert.isUndefined(rm.tables.tables["s.a"].get(1));
    });

    it.describe(".getLeftMemory", function (it) {
        it.should("return the correct right memory values", function () {
            var wm = new WorkingMemory(),
                lm = new LeftMemory(),
                rightFact = wm.assertFact({s: 1}),
                leftFact = wm.assertFact({a: 1}),
                rightContext = new Context(rightFact),
                leftContext = new Context(leftFact);
            rightContext.set("a", {s: 1});
            leftContext.set("s", {a: 1});
            lm.addIndex("s.a", "a.s");
            var node = lm.push(leftContext);
            assert.equal(lm.length, 1);
            var nodes = lm.getLeftMemory(rightContext);
            assert.lengthOf(nodes, 1);
            assert.deepEqual(nodes, [node]);
            rightContext.set("a", {s: 2});
            nodes = lm.getLeftMemory(rightContext);
            assert.lengthOf(nodes, 0);
        });

        it.should("return the intersection of all indexes", function () {
            var wm = new WorkingMemory(),
                lm = new LeftMemory(),
                rightContext1 = new Context(wm.assertFact({s: 1})),
                leftContext1 = new Context(wm.assertFact({a: 1})),
                rightContext2 = new Context(wm.assertFact({s: 2})),
                leftContext2 = new Context(wm.assertFact({a: 3}));
            rightContext1.set("a", {s: 1, b: 2, c: 1});
            leftContext1.set("s", {a: 1, b: 2, c: 2});
            rightContext2.set("a", {s: 1, b: 3, c: 3});
            leftContext2.set("s", {a: 1, b: 4, c: 3});
            lm.addIndex("s.c", "a.c", "neq");
            lm.addIndex("s.a", "a.s");
            lm.addIndex("s.b", "a.b");
            var node1 = lm.push(leftContext1);
            lm.push(leftContext2);
            assert.equal(lm.length, 2);
            debugger;
            var nodes = lm.getLeftMemory(rightContext1);
            assert.lengthOf(nodes, 1);
            assert.deepEqual(nodes, [node1]);
            nodes = lm.getLeftMemory(rightContext2);
            assert.lengthOf(nodes, 0);
        });

        it.should("find intersection of multiple neq", function () {
            var wm = new WorkingMemory(),
                rm = new LeftMemory(),
                rightContext1 = new Context(wm.assertFact({s: 1})),
                rightContext2 = new Context(wm.assertFact({s: 1})),
                leftContext1 = new Context(wm.assertFact({a: 1})),
                leftContext2 = new Context(wm.assertFact({a: 3}));
            rightContext1.set("a", {s: 1});
            rightContext2.set("a", {s: 3});
            leftContext1.set("s", {a: 1, b: 2, c: 1});
            leftContext2.set("s", {a: 2, b: 3, c: 4});
            rm.addIndex("s.a", "a.s", "neq");
            rm.addIndex("s.b", "a.s", "neq");
            rm.addIndex("s.c", "a.s", "neq");
            var node1 = rm.push(leftContext1),
                node2 = rm.push(leftContext2);
            assert.equal(rm.length, 2);
            var nodes = rm.getLeftMemory(rightContext1);
            assert.lengthOf(nodes, 1);
            assert.deepEqual(nodes, [node2]);
            nodes = rm.getLeftMemory(rightContext2);
            assert.lengthOf(nodes, 1);
            assert.deepEqual(nodes, [node1]);
        });
    });
});