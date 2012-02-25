var comb = require("comb"), assert = require("assert"), nodes = require("./nodes"), rule = require("./rule");


var Rule = rule.Rule;
var wm = require("./workingMemory");
var WorkingMemory = wm.WorkingMemory;
var Fact = wm.Fact;


var sortAgenda = function (activations) {
    activations.sort(function (a, b) {
        if (a.counter != b.counter) {
            return a.counter - b.counter;
        }
        if (a.rule.priority != b.rule.priority) {
            return a.rule.priority - b.rule.priority;
        }
        var i = 0;
        var aMatchRecency = a.match.recency, bMatchRecency = b.match.recency, aLength = aMatchRecency.length - 1, bLength = bMatchRecency.length - 1;
        while (aMatchRecency[i] == bMatchRecency[i] && i < aLength && i < bLength) {
            i++;
        }
        return aMatchRecency[i] - bMatchRecency[i];
    });
}


var Flow = comb.define(null, {

    instance:{

        name:null,

        constructor:function (name) {
            this.env = null;
            this.name = name;
            this.__rules = {};
            this.__wmAltered = false;
            this.workingMemory = new WorkingMemory();
            this.rootNode = new nodes.RootNode(this.workingMemory);
        },

        assert:function (fact) {
            this.__wmAltered = true;
            this.__factHelper(fact, "plus");
            return fact;
        },

        // This method is called to remove an existing fact from working memory
        retract:function (fact) {
            //fact = this.workingMemory.getFact(fact);
            this.__wmAltered = true;
            this.__factHelper(fact, "minus");
            return fact;
        },

        // This method is called to alter an existing fact.  It is essentially a
        // retract followed by an assert.
        modify:function (fact) {
            //fact = this.workingMemory.getFact(fact);
            this.retract(fact);
            return this.assert(fact);
        },

        print:function () {
            this.rootNode.print();
        },

        containsRule:function (name) {
            return this.rootNode.containsRule(name);
        },

        rule:function (name, options, params, cb) {
            this.rootNode.assertRule(rule.createRule(name, options, params, cb));
        },

        match:function (agenda, usedAgenda) {
            var usedAgenda = usedAgenda || [], ret = new comb.Promise(), flow = this, rootNode = this.rootNode;
            if (rootNode) {
                rootNode.resetCounter();
                agenda = agenda || rootNode.matches();
                (function fire() {
                    if (agenda.length > 0) {
                        sortAgenda(agenda);
                        var activation = agenda.pop();
                        usedAgenda.push(activation);
                        activation.used = true;
                        comb.when(activation.rule.fire(flow, activation.match), comb.hitch(this, function () {
                            if (flow.__wmAltered) {
                                agenda = rootNode.matches(false);
                                rootNode.incrementCounter();
                                flow.__wmAltered = false;
                                process.nextTick(fire);
                            } else {
                                process.nextTick(fire);
                            }
                        }), comb.hitch(ret, "errback"));
                    } else {
                        ret.callback();
                    }
                })();
            } else {
                ret.callback();
            }
            return ret;
        },

        __factHelper:function (object, sign) {
            sign = sign || "plus";
            var f = new Fact(object);
            sign == "plus" ? this.__assertFact(f) : this.__retractFact(f);
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
}).as(exports, "Flow");

exports.Rule = Rule;
exports.flow = function (name, cb) {
    var flow = new Flow(name);
    comb.isFunction(cb) && cb.call(cb, flow);
    return flow;
};

