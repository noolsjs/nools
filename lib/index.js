/**
 *
 * @projectName nools
 * @github https://github.com/C2FO/nools
 * @includeDoc [Change Log] ../History.md
 * @header [../readme.md]
 */




"use strict";
var extd = require("./extended"),
    fs = require("fs"),
    path = require("path"),
    bind = extd.bind,
    indexOf = extd.indexOf,
    forEach = extd.forEach,
    declare = extd.declare,
    Promise = extd.Promise,
    when = extd.when,
    AVLTree = extd.AVLTree,
    nodes = require("./nodes"),
    EventEmitter = require("events").EventEmitter,
    rule = require("./rule"),
    wm = require("./workingMemory"),
    WorkingMemory = wm.WorkingMemory,
    InitialFact = require("./pattern").InitialFact,
    Fact = wm.Fact,
    compile = require("./compile");


var sortAgenda = function (a, b) {
    if (a === b) {
        return 0;
    }
    var ret;
    var p1 = a.rule.priority, p2 = b.rule.priority;
    if (p1 !== p2) {
        ret = p1 - p2;
    } else if (a.counter !== b.counter) {
        ret = a.counter - b.counter;
    }
    if (!ret) {

        var i = 0;
        var aMatchRecency = a.match.recency,
            bMatchRecency = b.match.recency, aLength = aMatchRecency.length - 1, bLength = bMatchRecency.length - 1;
        while (aMatchRecency[i] === bMatchRecency[i] && i < aLength && i < bLength && i++) {
        }
        ret = aMatchRecency[i] - bMatchRecency[i];
        if (!ret) {
            ret = aLength - bLength;
        }
        //   }
    }
    if (!ret) {
        ret = a.recency - b.recency;
    }
    return ret > 0 ? 1 : -1;
};

var FactHash = declare({
    instance: {
        constructor: function () {
            this.memory = [];
            this.memoryValues = [];
        },

        get: function (k) {
            return this.memoryValues[indexOf(this.memory, k)];
        },

        remove: function (v) {
            var facts = v.match.facts, j = facts.length - 1, mv = this.memoryValues, m = this.memory;
            for (; j >= 0; j--) {
                var i = indexOf(m, facts[j]);
                var arr = mv[i], index = indexOf(arr, v);
                arr.splice(index, 1);
            }
        },

        insert: function (insert) {
            var facts = insert.match.facts, mv = this.memoryValues, m = this.memory;
            var k = facts.length - 1;
            for (; k >= 0; k--) {
                var o = facts[k], i = indexOf(m, o), arr = mv[i];
                if (!arr) {
                    arr = mv[m.push(o) - 1] = [];
                }
                arr.push(insert);
            }
        }
    }

});


var REVERSE_ORDER = AVLTree.REVERSE_ORDER;
var AgendaTree = declare({

    instance: {
        constructor: function () {
            this.masterAgenda = new AVLTree({compare: sortAgenda});
            this.rules = {};
        },

        register: function (node) {
            this.rules[node.name] = {tree: new AVLTree({compare: sortAgenda}), factTable: new FactHash()};
        },

        isEmpty: function () {
            return this.masterAgenda.isEmpty();
        },


        pop: function () {
            var tree = this.masterAgenda, root = tree.__root;
            while (root.right) {
                root = root.right;
            }
            var v = root.data;
            tree.remove(v);
            var rule = this.rules[v.name];
            rule.tree.remove(v);
            rule.factTable.remove(v);
            return v;
        },

        peek: function () {
            var tree = this.masterAgenda, root = tree.__root;
            while (root.right) {
                root = root.right;
            }
            return root.data;
        },

        removeByFact: function (node, fact) {
            var rule = this.rules[node.name], tree = rule.tree, factTable = rule.factTable;
            var ma = this.masterAgenda;
            var remove = factTable.get(fact) || [];
            var i = remove.length - 1;
            for (; i >= 0; i--) {
                var r = remove[i];
                factTable.remove(r);
                tree.remove(r);
                ma.remove(r);
            }
            remove.length = 0;
        },

        retract: function (node, cb) {
            var rule = this.rules[node.name], tree = rule.tree, factTable = rule.factTable;
            var ma = this.masterAgenda;
            tree.traverse(tree.__root, REVERSE_ORDER, function (v) {
                if (cb(v)) {
                    factTable.remove(v);
                    ma.remove(v);
                    tree.remove(v);
                }
            });
        },

        insert: function (node, insert) {
            var rule = this.rules[node.name];
            rule.tree.insert(insert);
            this.masterAgenda.insert(insert);
            rule.factTable.insert(insert);
        },

        dispose: function () {
            this.masterAgenda.clear();
            var rules = this.rules;
            for (var i in rules) {
                if (i in rules) {
                    rules[i].tree.clear();
                }
            }
            this.rules = {};
        }
    }

});


var Flow = declare(EventEmitter, {

    instance: {

        name: null,

        constructor: function (name) {
            this.env = null;
            this.name = name;
            this.__rules = {};
            this.__wmAltered = false;
            this.workingMemory = new WorkingMemory();
            this.agenda = new AgendaTree();
            this.rootNode = new nodes.RootNode(this.workingMemory, this.agenda);
        },

        halt: function () {
            this.__halted = true;
            return this;
        },

        dispose: function () {
            this.workingMemory.dispose();
            this.agenda.dispose();
            this.rootNode.dispose();
        },

        assert: function (fact) {
            this.__wmAltered = true;
            this.__factHelper(fact, true);
            this.emit("assert", fact);
            return fact;
        },

        // This method is called to remove an existing fact from working memory
        retract: function (fact) {
            //fact = this.workingMemory.getFact(fact);
            this.__wmAltered = true;
            this.__factHelper(fact, false);
            this.emit("retract", fact);
            return fact;
        },

        // This method is called to alter an existing fact.  It is essentially a
        // retract followed by an assert.
        modify: function (fact, cb) {
            //fact = this.workingMemory.getFact(fact);
            var f = this.retract(fact);
            if ("function" === typeof cb) {
                cb.call(fact, fact);
            }
            this.emit("modify", fact);
            return this.assert(f);
        },

        print: function () {
            this.rootNode.print();
        },

        containsRule: function (name) {
            return this.rootNode.containsRule(name);
        },

        rule: function (rule) {
            this.rootNode.assertRule(rule);
        },

        __loop: function (looper, cb) {
            var ret = new Promise(), flow = this, rootNode = this.rootNode;
            if (rootNode) {
                rootNode.resetCounter();
                (function fire() {
                    looper(ret, fire);
                })();
            } else {
                ret.callback();
            }
            ret.classic(cb);
            return ret;
        },

        __callNext: function (cb) {
            var activation = this.agenda.pop(), rootNode = this.rootNode;
            activation.used = true;
            this.emit("fire", activation.rule.name, activation.match.factHash);
            return when(activation.rule.fire(this, activation.match)).then(bind(this, function () {
                if (this.__wmAltered) {
                    rootNode.incrementCounter();
                    this.__wmAltered = false;
                }
            }));
        },


        matchUntilHalt: function (cb) {
            this.__halted = false;
            return this.__loop(bind(this, function (ret, fire) {
                if (!this.agenda.isEmpty() && !this.__halted) {
                    this.__callNext(fire).then(fire, ret.errback);
                } else if (!this.__halted) {
                    process.nextTick(fire);
                } else {
                    ret.callback();
                }
            }), cb);
        },

        match: function (cb) {
            return this.__loop(bind(this, function (ret, fire) {
                if (!this.agenda.isEmpty()) {
                    this.__callNext(fire).then(fire, ret.errback);
                } else {
                    ret.callback();
                }
            }), cb);
        },

        __factHelper: function (object, assert) {
            var f = new Fact(object);
            if (assert) {
                f = this.__assertFact(f);
            } else {
                f = this.__retractFact(f);
            }
            return f;
        },

        __assertFact: function (fact) {
            var wmFact = this.workingMemory.assertFact(fact);
            if (wmFact) {
                this.rootNode.assertFact(wmFact);
            }
            return wmFact;
        },

        __retractFact: function (fact) {
            var wmFact = this.workingMemory.retractFact(fact);
            if (wmFact && this.rootNode) {
                this.rootNode.retractFact(wmFact);
            }
            return wmFact;
        }
    }
});

var flows = {};
var FlowContainer = declare({

    instance: {

        constructor: function (name, cb) {
            this.name = name;
            this.cb = cb;
            this.__rules = [];
            this.__defined = {};
            if (cb) {
                cb.call(this, this);
            }
            if (!flows.hasOwnProperty(name)) {
                flows[name] = this;
            } else {
                throw new Error("Flow with " + name + " already defined");
            }
        },

        getDefined: function (name) {
            var ret = this.__defined[name.toLowerCase()];
            if (!ret) {
                throw new Error(name + " flow class is not defined");
            }
            return ret;
        },

        addDefined: function (name, cls) {
            //normalize
            this.__defined[name.toLowerCase()] = cls;
            return cls;
        },

        rule: function () {
            this.__rules = this.__rules.concat(rule.createRule.apply(rule, arguments));
        },

        getSession: function () {
            var flow = new Flow(this.name);
            forEach(this.__rules, function (rule) {
                flow.rule(rule);
            });
            flow.assert(new InitialFact());
            for (var i = 0, l = arguments.length; i < l; i++) {
                flow.assert(arguments[i]);
            }
            return flow;
        },

        containsRule: function (name) {
            return extd.some(this.__rules, function (rule) {
                return rule.name === name;
            });
        }

    }

}).as(exports, "Flow");

function isNoolsFile(file) {
    return (/\.nools$/).test(file);
}

function parse(source) {
    var ret;
    if (isNoolsFile(source)) {
        ret = compile.parse(fs.readFileSync(source, "utf8"));
    } else {
        ret = compile.parse(source);
    }
    return ret;
}

exports.getFlow = function (name) {
    return flows[name];
};


exports.flow = function (name, cb) {
    return new FlowContainer(name, cb);
};

exports.compile = function (file, options, cb) {
    if (extd.isFunction(options)) {
        cb = options;
        options = {};
    } else {
        options = options || {};
        cb = null;
    }
    if (extd.isString(file)) {
        options.name = options.name || (isNoolsFile(file) ? path.basename(file, path.extname(file)) : null);
        file = parse(file);
    }
    if (!options.name) {
        throw new Error("Name required when compiling nools source");
    }
    return  compile.compile(file, options, cb, FlowContainer);
};

exports.parse = parse;


