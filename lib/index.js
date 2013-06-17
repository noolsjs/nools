/**
 *
 * @projectName nools
 * @github https://github.com/C2FO/nools
 * @includeDoc [Examples] ../docs-md/examples.md
 * @includeDoc [Change Log] ../History.md
 * @header [../readme.md]
 */




"use strict";
var extd = require("./extended"),
    fs = require("fs"),
    path = require("path"),
    bind = extd.bind,
    forEach = extd.forEach,
    declare = extd.declare,
    Promise = extd.Promise,
    nodes = require("./nodes"),
    EventEmitter = require("events").EventEmitter,
    rule = require("./rule"),
    wm = require("./workingMemory"),
    WorkingMemory = wm.WorkingMemory,
    InitialFact = require("./pattern").InitialFact,
    compile = require("./compile"),
    nextTick = require("./nextTick"),
    AgendaTree = require("./agenda");

var nools = {};


var Flow = declare(EventEmitter, {

    instance: {

        name: null,

        constructor: function (name) {
            this.env = null;
            this.name = name;
            this.__rules = {};
            this.__wmAltered = false;
            this.workingMemory = new WorkingMemory();
            this.agenda = new AgendaTree(this);
            this.agenda.on("fire", bind(this, "emit", "fire"));
            this.agenda.on("focused", bind(this, "emit", "focused"));
            this.rootNode = new nodes.RootNode(this.workingMemory, this.agenda);
        },

        focus: function (focused) {
            this.agenda.setFocus(focused);
            return this;
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
            this.rootNode.assertFact(this.workingMemory.assertFact(fact));
            this.emit("assert", fact);
            return fact;
        },

        // This method is called to remove an existing fact from working memory
        retract: function (fact) {
            //fact = this.workingMemory.getFact(fact);
            this.__wmAltered = true;
            this.rootNode.retractFact(this.workingMemory.retractFact(fact));
            this.emit("retract", fact);
            return fact;
        },

        // This method is called to alter an existing fact.  It is essentially a
        // retract followed by an assert.
        modify: function (fact, cb) {
            //fact = this.workingMemory.getFact(fact);
            this.__wmAltered = true;
            this.rootNode.retractFact(this.workingMemory.retractFact(fact));
            if ("function" === typeof cb) {
                cb.call(fact, fact);
            }
            this.emit("modify", fact);
            this.rootNode.assertFact(this.workingMemory.assertFact(fact));
            return fact;
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
            var ret = new Promise(), rootNode = this.rootNode;
            if (rootNode) {
                rootNode.resetCounter();
                (function fire() {
                    nextTick(function () {
                        looper(ret, fire);
                    });
                })();
            } else {
                ret.callback();
            }
            ret.classic(cb);
            return ret;
        },

        __callNext: function () {
            var rootNode = this.rootNode;
            var next = this.agenda.fireNext();
            if (extd.isPromiseLike(next)) {
                var self = this;
                return next.addCallback(function () {
                    if (self.__wmAltered) {
                        rootNode.incrementCounter();
                        self.__wmAltered = false;
                    }
                });
            } else {
                if (this.__wmAltered) {
                    rootNode.incrementCounter();
                    this.__wmAltered = false;
                }
                return next;
            }
        },


        matchUntilHalt: function (cb) {
            this.__halted = false;
            var self = this;
            return this.__loop(function (ret, fire) {
                if (!self.__halted) {
                    var next = self.__callNext();
                    if (extd.isBoolean(next)) {
                        fire();
                    } else {
                        next.addCallback(fire).addErrback(ret.errback);
                    }
                } else {
                    ret.callback();
                }
            }, cb);
        },

        match: function (cb) {
            var self = this;
            return this.__loop(function (ret, fire) {
                var next = self.__callNext();
                if (extd.isBoolean(next)) {
                    next ? fire() : ret.callback();
                } else {
                    next.addCallback(function (fired) {
                        return fired ? fire() : ret.callback();
                    }).addErrback(ret.errback);
                }
            }, cb);
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
            return this;
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

}).as(nools, "Flow");

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

nools.getFlow = function (name) {
    return flows[name];
};

nools.deleteFlow = function (name) {
    if (extd.instanceOf(name, FlowContainer)) {
        name = name.name;
    }
    delete flows[name];
    return nools;
};


nools.flow = function (name, cb) {
    return new FlowContainer(name, cb);
};

nools.compile = function (file, options, cb) {
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

nools.transpile = function (file, options) {
    options = options || {};
    if (extd.isString(file)) {
        options.name = options.name || (isNoolsFile(file) ? path.basename(file, path.extname(file)) : null);
        file = parse(file);
    }
    return compile.transpile(file, options);
};

nools.parse = parse;

module.exports = nools;