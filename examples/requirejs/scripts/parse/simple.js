define([
    "nools",
    "text!./rules/simple.nools"
], function (nools, simple) {
    return nools.compile(simple, {name: "simple"});
});