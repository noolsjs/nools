"use strict";
var extd = require("./extended"),
    when = extd.when,
    indexOf = extd.indexOf,
    declare = extd.declare,
    AVLTree = extd.AVLTree,
    EventEmitter = require("events").EventEmitter;

var sortAgenda = function (a, b) {
    /*jshint noempty:false*/
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

        clear: function () {
            this.memory.length = this.memoryValues.length = 0;
        },

        get: function (k) {
            return this.memoryValues[indexOf(this.memory, k)];
        },

        __compact: function () {
            var oldM = this.memory.slice(0),
                oldMv = this.memoryValues.slice(0),
                l = oldMv.length,
                m = this.memory = [],
                mv = this.memoryValues = [],
                oldMemoryValue;
            for (var i = 0; i < l; i++) {
                oldMemoryValue = oldMv[i];
                if (oldMemoryValue.length !== 0) {
                    mv[m.push(oldM[i]) - 1] = oldMemoryValue;
                }
            }
        },

        remove: function (v) {
            var facts = v.match.facts, j = facts.length - 1, mv = this.memoryValues, m = this.memory;
            for (; j >= 0; j--) {
                var i = indexOf(m, facts[j]);
                var arr = mv[i], index = indexOf(arr, v);
                arr.splice(index, 1);
            }
            this.__compact();
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


var REVERSE_ORDER = AVLTree.REVERSE_ORDER, DEFAULT_AGENDA_GROUP = "main";
module.exports = declare(EventEmitter, {

    instance: {
        constructor: function (flow) {
            this.agendaGroups = {};
            this.agendaGroupStack = [DEFAULT_AGENDA_GROUP];
            this.rules = {};
            this.flow = flow;
            this.setFocus(DEFAULT_AGENDA_GROUP).addAgendaGroup(DEFAULT_AGENDA_GROUP);
        },

        addAgendaGroup: function (groupName) {
            if (!extd.has(this.agendaGroups, groupName)) {
                this.agendaGroups[groupName] = new AVLTree({compare: sortAgenda});
            }
        },

        getAgendaGroup: function (groupName) {
            return this.agendaGroups[groupName || DEFAULT_AGENDA_GROUP];
        },

        setFocus: function (agendaGroup) {
            if (agendaGroup !== this.getFocused()) {
                this.agendaGroupStack.push(agendaGroup);
                this.emit("focused", agendaGroup);
            }
            return this;
        },

        getFocused: function () {
            var ags = this.agendaGroupStack;
            return ags[ags.length - 1];
        },

        getFocusedAgenda: function () {
            return this.agendaGroups[this.getFocused()];
        },

        register: function (node) {
            var agendaGroup = node.rule.agendaGroup;
            this.rules[node.name] = {tree: new AVLTree({compare: sortAgenda}), factTable: new FactHash()};
            if (agendaGroup) {
                this.addAgendaGroup(agendaGroup);
            }
        },

        isEmpty: function () {
            var agendaGroupStack = this.agendaGroupStack, changed = false;
            while (this.getFocusedAgenda().isEmpty() && this.getFocused() !== DEFAULT_AGENDA_GROUP) {
                agendaGroupStack.pop();
                changed = true;
            }
            if (changed) {
                this.emit("focused", this.getFocused());
            }
            return this.getFocusedAgenda().isEmpty();
        },

        fireNext: function () {
            var agendaGroupStack = this.agendaGroupStack;
            while (this.getFocusedAgenda().isEmpty() && this.getFocused() !== DEFAULT_AGENDA_GROUP) {
                agendaGroupStack.pop();
            }
            if (!this.getFocusedAgenda().isEmpty()) {
                var activation = this.pop();
                this.emit("fire", activation.rule.name, activation.match.factHash);
                return when(activation.rule.fire(this.flow, activation.match)).then(function () {
                    //return true if an activation fired
                    return true;
                });
            }
            //return false if activation not fired
            return extd.resolve(false);
        },

        pop: function () {
            var tree = this.getFocusedAgenda(), root = tree.__root;
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

        removeByFact: function (node, fact) {
            var rule = this.rules[node.name], tree = rule.tree, factTable = rule.factTable;
            var ma = this.getAgendaGroup(node.rule.agendaGroup);
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
            var ma = this.getAgendaGroup(node.rule.agendaGroup);
            tree.traverse(tree.__root, REVERSE_ORDER, function (v) {
                if (cb(v)) {
                    factTable.remove(v);
                    ma.remove(v);
                    tree.remove(v);
                }
            });
        },

        insert: function (node, insert) {
            var rule = this.rules[node.name], nodeRule = node.rule, agendaGroup = nodeRule.agendaGroup;
            rule.tree.insert(insert);
            this.getAgendaGroup(agendaGroup).insert(insert);
            if (agendaGroup) {
                if (nodeRule.autoFocus) {
                    this.setFocus(agendaGroup);
                }
            }

            rule.factTable.insert(insert);
        },

        dispose: function () {
            for (var i in this.agendaGroups) {
                this.agendaGroups[i].clear();
            }
            var rules = this.rules;
            for (i in rules) {
                if (i in rules) {
                    rules[i].tree.clear();
                    rules[i].factTable.clear();

                }
            }
            this.rules = {};
        }
    }

});