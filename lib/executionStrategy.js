var extd = require("./extended"),
    Promise = extd.Promise,
    nextTick = require("./nextTick"),
    isPromiseLike = extd.isPromiseLike;

Promise.extend({
    instance: {

        looping: false,

        constructor: function (flow, matchUntilHalt) {
            this._super([]);
            this.flow = flow;
            this.agenda = flow.agenda;
            this.rootNode = flow.rootNode;
            this.matchUntilHalt = !!(matchUntilHalt);
            extd.bindAll(this, ["onAlter", "callNext"]);
        },

        halt: function () {
            this.__halted = true;
            if (!this.looping) {
                this.callback();
            }
        },

        onAlter: function () {
            this.flowAltered = true;
            if (!this.looping && this.matchUntilHalt && !this.__halted) {
                this.callNext();
            }
        },

        setup: function () {
            var flow = this.flow;
            this.rootNode.resetCounter();
            flow.on("assert", this.onAlter);
            flow.on("modify", this.onAlter);
            flow.on("retract", this.onAlter);
        },

        tearDown: function () {
            var flow = this.flow;
            flow.removeListener("assert", this.onAlter);
            flow.removeListener("modify", this.onAlter);
            flow.removeListener("retract", this.onAlter);
        },

        __handleAsyncNext: function (next) {
            var self = this, agenda = self.agenda;
            return next.then(function () {
                self.looping = false;
                if (!agenda.isEmpty()) {
                    if (self.flowAltered) {
                        self.rootNode.incrementCounter();
                        self.flowAltered = false;
                    }
                    if (!self.__halted) {
                        self.callNext();
                    } else {
                        self.callback();
                    }
                } else if (!self.matchUntilHalt || self.__halted) {
                    self.callback();
                }
                self = null;
            }, this.errback);
        },

        __handleSyncNext: function (next) {
            this.looping = false;
            if (!this.agenda.isEmpty()) {
                if (this.flowAltered) {
                    this.rootNode.incrementCounter();
                    this.flowAltered = false;
                }
            }
            if (next && !this.__halted) {
                nextTick(this.callNext);
            } else if (!this.matchUntilHalt || this.__halted) {
                this.callback();
            }
            return next;
        },

        callback: function () {
            this.tearDown();
            this._super(arguments);
        },


        callNext: function () {
            this.looping = true;
            var next = this.agenda.fireNext();
            return isPromiseLike(next) ? this.__handleAsyncNext(next) : this.__handleSyncNext(next);
        },

        execute: function () {
            this.setup();
            this.callNext();
            return this;
        }
    }
}).as(module);