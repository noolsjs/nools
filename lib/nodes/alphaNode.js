"use strict";
var Node = require("./node");

Node.extend({
    instance: {
        constructor: function (constraint) {
            this._super([]);
            this.constraint = constraint;
            this.constraintAssert = this.constraint.assert;
        },

        toString: function () {
            return "AlphaNode " + this.__count;
        },

        equal: function (constraint) {
            return this.constraint.equal(constraint.constraint);
        }
    }
}).as(module);