var nools = require("../../index");

var flow = nools.compile(__dirname + "/agenda.nools");

var Message = flow.getDefined("message");

var fired1 = [], fired2 = [], fired3 = [];

flow.getSession(new Message("hello"))
    .focus("ag1")
    .on("fire", function (ruleName) {
        fired1.push(ruleName);
    })
    .match(function () {
        console.log("Example 1", fired1);  //[ 'Hello World' ]
    });

flow
    .getSession(new Message("goodbye"))
    .focus("ag1")
    .focus("ag2")
    .on("fire", function (ruleName) {
        fired2.push(ruleName);
    })
    .match(function () {
        console.log("Example 2", fired2); //[ 'Hello World', 'Hello World2' ]
    });
flow
    .getSession(new Message("hello"))
    .focus("ag2")
    .focus("ag1")
    .on("fire", function (ruleName) {
        fired3.push(ruleName);
    })
    .match(function () {
        console.log("Example 3", fired3); //[ 'Hello World', 'Hello World2' ]
    });