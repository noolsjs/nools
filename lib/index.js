(function () {
    "use strict";
    var comb = require("comb"),
        when = comb.when,
        nodes = require("./nodes"),
        rule = require("./rule"),
        AVLTree = comb.collections.AVLTree,
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
        if (a.counter !== b.counter) {
            ret = a.counter - b.counter;
        } else {
            var p1 = a.rule.priority, p2 = b.rule.priority;
            if (p1 !== p2) {
                ret = p1 - p2;
            } else {
                var i = 0;
                var aMatchRecency = a.match.recency,
                    bMatchRecency = b.match.recency, aLength = aMatchRecency.length - 1, bLength = bMatchRecency.length - 1;
                while (aMatchRecency[i] === bMatchRecency[i] && i < aLength && i < bLength && i++) {
                }
                ret = aMatchRecency[i] - bMatchRecency[i];
                if (!ret) {
                    ret = a.recency - b.recency;
                }
            }
        }
        return ret > 0 ? 1 : -1;
    };

    var FactHash = comb.define(null, {

        instance:{
            constructor:function (def) {
                this.memory = [];
                this.memoryValues = [];
            },

            get:function (k) {
                return this.memoryValues[this.memory.indexOf(k)];
            },

            remove:function (v) {
                var facts = v.match.facts, j = facts.length - 1, mv = this.memoryValues, m = this.memory;
                for (; j >= 0; j--) {
                    var i = m.indexOf(facts[j].object);
                    var arr = mv[i], index = arr.indexOf(v);
                    arr.splice(index, 1);
                }
            },

            insert:function (insert) {
                var facts = insert.match.facts, mv = this.memoryValues, m = this.memory;
                var k = facts.length - 1;
                for (; k >= 0; k--) {
                    var o = facts[k].object, i = m.indexOf(o), arr = mv[i];
                    if (!arr) {
                        arr = mv[m.push(o) - 1] = [];
                    }
                    arr.push(insert);
                }
            }
        }

    });


    var REVERSE_ORDER = AVLTree.REVERSE_ORDER, IN_ORDER = AVLTree.IN_ORDER;
    var AgendaTree = comb.define(null, {

        instance:{
            constructor:function () {
                this.masterAgenda = new AVLTree({compare:sortAgenda});
                this.rules = {};
            },

            register:function (node) {
                this.rules[node.name] = {tree:new AVLTree({compare:sortAgenda}), factTable:new FactHash()};
            },

            isEmpty:function () {
                return this.masterAgenda.isEmpty();
            },


            pop:function () {
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

            removeByFact:function (node, fact) {
                var rule = this.rules[node.name], tree = rule.tree, factTable = rule.factTable, obj = fact.object;
                var ma = this.masterAgenda;
                var remove = factTable.get(obj) || [];
                var i = remove.length - 1;
                for (; i >= 0; i--) {
                    var r = remove[i];
                    factTable.remove(r);
                    tree.remove(r);
                    ma.remove(r);
                }
                remove.length = 0;
            },

            retract:function (node, cb) {
                var remove = [], rule = this.rules[node.name], tree = rule.tree, factTable = rule.factTable;
                var ma = this.masterAgenda;
                tree.traverse(tree.__root, REVERSE_ORDER, function (v) {
                    if (cb(v)) {
                        factTable.remove(v);
                        ma.remove(v);
                        tree.remove(v);
                    }
                });
            },

            insert:function (node, insert) {
                var rule = this.rules[node.name];
                rule.tree.insert(insert);
                this.masterAgenda.insert(insert);
                rule.factTable.insert(insert);
            },

            dispose:function () {
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


    var Flow = comb.define(null, {

        instance:{

            name:null,

            constructor:function (name) {
                this.env = null;
                this.name = name;
                this.__rules = {};
                this.__wmAltered = false;
                this.workingMemory = new WorkingMemory();
                this.agenda = new AgendaTree();
                this.rootNode = new nodes.RootNode(this.workingMemory, this.agenda);
            },

            dispose:function () {
                this.workingMemory.dispose();
                this.agenda.dispose();
                this.rootNode.dispose();
            },

            assert:function (fact) {
                this.__wmAltered = true;
                this.__factHelper(fact, true);
                return fact;
            },

            // This method is called to remove an existing fact from working memory
            retract:function (fact) {
                //fact = this.workingMemory.getFact(fact);
                this.__wmAltered = true;
                this.__factHelper(fact, false);
                return fact;
            },

            // This method is called to alter an existing fact.  It is essentially a
            // retract followed by an assert.
            modify:function (fact, cb) {
                //fact = this.workingMemory.getFact(fact);
                this.retract(fact);
                if ("function" === typeof cb) {
                    cb.call(fact, fact);
                }
                return this.assert(fact);
            },

            print:function () {
                this.rootNode.print();
            },

            containsRule:function (name) {
                return this.rootNode.containsRule(name);
            },

            rule:function (rule) {
                this.rootNode.assertRule(rule);
            },

            match:function (cb) {
                var ret = new comb.Promise(), flow = this, rootNode = this.rootNode;
                if (rootNode) {
                    rootNode.resetCounter();
                    var agenda = this.agenda;
                    (function fire() {
                        if (!agenda.isEmpty()) {
                            var activation = agenda.pop();
                            activation.used = true;
                            when(activation.rule.fire(flow, activation.match), function () {
                                if (flow.__wmAltered) {
                                    rootNode.incrementCounter();
                                    flow.__wmAltered = false;
                                }
                                process.nextTick(fire);
                            }, comb.hitch(ret, "errback"));
                        } else {
                            ret.callback();
                        }
                    })();
                } else {
                    ret.callback();
                }
                ret.classic(cb);
                return ret;
            },

            __factHelper:function (object, assert) {
                var f = new Fact(object);
                if (assert) {
                    this.__assertFact(f);
                } else {
                    this.__retractFact(f);
                }
                return f;
            },

            __assertFact:function (fact) {
                var wmFact = this.workingMemory.assertFact(fact);
                if (wmFact) {
                    this.rootNode.assertFact(wmFact);
                }
            },

            __retractFact:function (fact) {
                var wmFact = this.workingMemory.retractFact(fact);
                if (wmFact && this.rootNode) {
                    this.rootNode.retractFact(wmFact);
                }
            }
        }
    });

    var FlowContainer = comb.define(null, {

        instance:{

            constructor:function (name, cb) {
                this.name = name;
                this.cb = cb;
                this.__rules = [];
                this.__defined = {};
                if (cb) {
                    cb.call(this, this);
                }
            },

            getDefined:function (name) {
                var ret = this.__defined[name.toLowerCase()];
                if (!ret) {
                    throw new Error(name + " flow class is not defined");
                }
                return ret;
            },

            addDefined:function (name, cls) {
                //normalize
                this.__defined[name.toLowerCase()] = cls;
                return cls;
            },

            rule:function () {
                this.__rules = this.__rules.concat(rule.createRule.apply(rule, arguments));
            },

            getSession:function () {
                var flow = new Flow(this.name);
                this.__rules.forEach(function (rule) {
                    flow.rule(rule);
                });
                var args = comb.argsToArray(arguments);
                flow.assert(new InitialFact());
                args.forEach(function (arg) {
                    flow.assert(arg);
                });
                return flow;
            },

            containsRule:function (name) {
                return this.__rules.some(function (rule) {
                    return rule.name === name;
                });
            }

        }

    }).as(exports, "Flow");

    exports.flow = function (name, cb) {
        return  new FlowContainer(name, cb);
    };

    exports.compile = function (file, options, cb) {
        return  compile.compile(file, options, cb, FlowContainer);

    };

})();

