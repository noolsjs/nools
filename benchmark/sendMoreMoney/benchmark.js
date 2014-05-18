"use strict";

var nools = require("../../index"),
    flow = nools.compile(__dirname + "/sendMoreMoney.nools");

var start = new Date(),
    session;
console.log("starting");
module.exports = (session = flow.getSession(0, 1, 2, 3, 4, 5, 6, 7, 8, 9)).match().then(function () {
    console.log("%dms", +(new Date()) - start);
    session.dispose();
});


