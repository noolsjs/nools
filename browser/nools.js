(function () {
    "use strict";
    var nools = require("../");

    if ("function" === typeof this.define && this.define.amd) {
        define([], function () {
            return nools;
        });
    } else {
        this.nools = nools;
    }
}).call(window);
