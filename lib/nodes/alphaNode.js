var comb = require("comb"),
    Node = require("./node"),
    define = comb.define;

define(Node, {
    instance:{
        constructor:function (constraint) {
            this._super([]);
            this.constraint = constraint;
        },

        toString:function () {
            return JSON.stringify(this.constraint.constraint);
        },

        equal:function (constraint) {
            return this.constraint.equal(constraint.constraint);
        }
    }
}).as(module);