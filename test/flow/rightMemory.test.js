var it = require("it"),
    assert = require("assert"),
    Context = require("../../lib/context"),
    WorkingMemory = require("../../lib/workingMemory").WorkingMemory,
    RightMemory = require("../../lib/nodes/misc/rightMemory");

it.describe("BetaNode RightMemory", function (it) {

    it.should("add a context to the memory", function () {
        var wm = new WorkingMemory(),
            rm = new RightMemory(),
            fact = wm.assertFact("s"),
            context = new Context(fact);
        rm.push(context);
        assert.equal(rm.length, 1);

    });

    it.should("remove a context from the memory", function () {
        var wm = new WorkingMemory(),
            rm = new RightMemory(),
            fact = wm.assertFact("s"),
            context = new Context(fact);
        var node = rm.push(context);
        assert.equal(rm.length, 1);
        rm.remove(node);
        assert.equal(rm.length, 0);
    });

    it.should("addIndexes to the memory", function () {
        var rm = new RightMemory();
        rm.addIndex("a.s", "s.a");
        assert.lengthOf(rm.indexes, 1);
        var index = rm.indexes[0];
        assert.equal(index[1], "s.a");
        assert.equal(index[0], "a.s");
        assert.isFunction(index[2]);
        assert.isFunction(index[3]);
        assert.equal(index[4], "eq");
        assert.deepEqual(index[3]({s: {a: 1}}), 1);
        assert.deepEqual(index[2]({a: {s: 1}}), 1);
    });

    it.should("add an index and accept an operator", function () {
        var rm = new RightMemory();
        rm.addIndex("a.s", "s.a", "neq");
        assert.lengthOf(rm.indexes, 1);
        var index = rm.indexes[0];
        assert.equal(index[0], "a.s");
        assert.equal(index[1], "s.a");
        assert.isFunction(index[2]);
        assert.isFunction(index[3]);
        assert.equal(index[4], "neq");
        assert.deepEqual(index[2]({a: {s: 1}}), 1);
        assert.deepEqual(index[3]({s: {a: 1}}), 1);
    });

    it.should("add a context and index it", function () {
        var wm = new WorkingMemory(),
            rm = new RightMemory(),
            rightFact = wm.assertFact({s: 1}),
            rightContext = new Context(rightFact);
        rightContext.set("a", {s: 1});
        rm.addIndex("a.s", "s.a");
        var node = rm.push(rightContext);
        assert.equal(rm.length, 1);
        assert.isTrue("a.s" in rm.tables.tables);
        assert.isTrue(rm.tables.tables["a.s"].contains(1));
        assert.deepEqual(rm.tables.tables["a.s"].get(1).tuples, [node]);
    });

    it.should("remove a context and unindex it", function () {
        var wm = new WorkingMemory(),
            rm = new RightMemory(),
            rightFact = wm.assertFact({s: 1}),
            rightContext = new Context(rightFact);
        rightContext.set("a", {s: 1});
        rm.addIndex("a.s", "s.a");
        var node = rm.push(rightContext);
        assert.equal(rm.length, 1);
        rm.remove(node);
        assert.isUndefined(rm.tables.tables["a.s"].get(1));
    });

    it.describe(".getRightMemory", function (it) {
        it.should("return the correct right memory values", function () {
            var wm = new WorkingMemory(),
                rm = new RightMemory(),
                rightFact = wm.assertFact({s: 1}),
                leftFact = wm.assertFact({a: 1}),
                rightContext = new Context(rightFact),
                leftContext = new Context(leftFact);
            rightContext.set("a", {s: 1});
            leftContext.set("s", {a: 1});
            rm.addIndex("a.s", "s.a");
            var node = rm.push(rightContext);
            assert.equal(rm.length, 1);
            var nodes = rm.getRightMemory(leftContext);
            assert.lengthOf(nodes, 1);
            assert.deepEqual(nodes, [node]);
            leftContext.set("s", {a: 2});
            nodes = rm.getRightMemory(leftContext);
            assert.lengthOf(nodes, 0);
        });

        it.should("return the intersection of all indexes", function () {
            var wm = new WorkingMemory(),
                rm = new RightMemory(),
                rightContext1 = new Context(wm.assertFact({s: 1})),
                leftContext1 = new Context(wm.assertFact({a: 1})),
                rightContext2 = new Context(wm.assertFact({s: 2})),
                leftContext2 = new Context(wm.assertFact({a: 3}));
            rightContext1.set("a", {s: 1, b: 2, c: 2});
            leftContext1.set("s", {a: 1, b: 2, c: 1});
            rightContext2.set("a", {s: 1, b: 3, c: 3});
            leftContext2.set("s", {a: 1, b: 4, c: 3});
            rm.addIndex("a.s", "s.a");
            rm.addIndex("a.b", "s.b");
            rm.addIndex("a.c", "s.c", "neq");
            var node1 = rm.push(rightContext1);
            rm.push(rightContext2);
            assert.equal(rm.length, 2);
            var nodes = rm.getRightMemory(leftContext1);
            assert.lengthOf(nodes, 1);
            assert.deepEqual(nodes, [node1]);
            nodes = rm.getRightMemory(leftContext2);
            assert.lengthOf(nodes, 0);
        });

        it.should("find intersection of multiple neq", function () {
            var wm = new WorkingMemory(),
                rm = new RightMemory(),
                rightContext1 = new Context(wm.assertFact({s: 1})),
                rightContext2 = new Context(wm.assertFact({s: 1})),
                leftContext1 = new Context(wm.assertFact({a: 1})),
                leftContext2 = new Context(wm.assertFact({a: 3}));
            rightContext1.set("a", {s: 1});
            rightContext2.set("a", {s: 3});
            leftContext1.set("s", {a: 1, b: 2, c: 1});
            leftContext2.set("s", {a: 2, b: 3, c: 4});
            rm.addIndex("a.s", "s.a", "neq");
            rm.addIndex("a.s", "s.b", "neq");
            rm.addIndex("a.s", "s.c", "neq");
            var node1 = rm.push(rightContext1),
                node2 = rm.push(rightContext2);
            assert.equal(rm.length, 2);
            var nodes = rm.getRightMemory(leftContext1);
            assert.lengthOf(nodes, 1);
            assert.deepEqual(nodes, [node2]);
            nodes = rm.getRightMemory(leftContext2);
            assert.lengthOf(nodes, 1);
            assert.deepEqual(nodes, [node1]);
        });
    });
});