"use strict";
var data = require("./data"),
    nools = require("../../index");

var flow = nools.compile(__dirname + "/manners.nools");
var guests = data.load(flow).manners64;
var session = flow.getSession.apply(flow, guests);
session.assert(new (flow.getDefined("count"))({value: 1}));
var start = new Date();

module.exports = session.match().then(function () {
    console.log("Duration %dms", new Date() - start);
    session.dispose();
}, function (err) {
    session.dispose();
    console.log(err.stack);
});