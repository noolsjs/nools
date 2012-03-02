var comb = require("comb"), when = comb.when, nodes = require("./nodes"), rule = require("./rule");


var wm = require("./workingMemory");
var WorkingMemory = wm.WorkingMemory;
var Fact = wm.Fact;


var sortAgenda = function (activations) {
    activations.sort(function (a, b) {
        if (a.counter != b.counter) {
            return a.counter - b.counter;
        }
        var p1 = a.rule.priority, p2 = b.rule.priority;
        if (p1 != p2) {
            return p1 - p2;
        }
        var i = 0;
        var aMatchRecency = a.match.recency,
            bMatchRecency = b.match.recency, aLength = aMatchRecency.length - 1, bLength = bMatchRecency.length - 1;
        while (aMatchRecency[i] == bMatchRecency[i] && i < aLength && i < bLength) {
            i++;
        }
        var ret = aMatchRecency[i] - bMatchRecency[i];
        if(!ret){
            ret = a.recency - b.recency;
        }
        return ret;
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

        rule:function (rule) {
            this.rootNode.assertRule(rule);
        },

        match:function () {
            var ret = new comb.Promise(), flow = this, rootNode = this.rootNode;
            if (rootNode) {
                rootNode.resetCounter();
                var agenda = rootNode.matches();
                sortAgenda(agenda);
                (function fire() {
                    if (agenda.length) {
                        var activation = agenda.pop();
                        activation.used = true;
                        when(activation.rule.fire(flow, activation.match), function () {
                            if (flow.__wmAltered) {
                                agenda = rootNode.matches(false);
                                sortAgenda(agenda);
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
});

var FlowContainer = comb.define(null, {

    instance:{

        constructor:function (name, cb) {
            this.name = name;
            this.cb = cb;
            this.__rules = [];
            cb && cb.call(this, this);
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
            args.forEach(function (arg) {
                flow.assert(arg);
            });
            return flow;
        },

        containsRule:function (name) {
            return this.__rules.some(function (rule) {
                return rule.name == name;
            });
        }

    }

}).as(exports, "Flow");
exports.flow = function (name, cb) {
    return  new FlowContainer(name, cb);
};

