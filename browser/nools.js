(function () {
    "use strict";
    var nools = require("../");

    if (typeof Object.getPrototypeOf !== "function") {
        Object.getPrototypeOf = "".__proto__ === String.prototype
            ? function (object) {
            return object.__proto__;
        }
            : function (object) {
            // May break if the constructor has been tampered with
            return object.constructor.prototype;
        };
    }

    if ("function" === typeof this.define && this.define.amd) {
        define([], function () {
            return nools;
        });
    } else {
        this.nools = nools;
    }
}).call(typeof window !== "undefined" ? window : this);
