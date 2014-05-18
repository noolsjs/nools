var nools = require("../../index");

var flow = nools.compile(__dirname + "/auto_focus.nools");

var State = flow.getDefined("state");

var fired = [];
flow
    .getSession(new State("A", "NOT_RUN"), new State("B", "NOT_RUN"), new State("C", "NOT_RUN"), new State("D", "NOT_RUN"))
    .on("fire", function (ruleName) {
        fired.push(ruleName);
    })
    .match(function () {
        console.log("FLOW1", fired); //[ 'Hello World', 'Hello World2' ]
    });