var nools = require("../");

function Message(name) {
    this.name = name;
}

var flow = nools.flow("agenda-group example", function () {
    this.rule("Hello World", {agendaGroup: "ag1"}, [Message, "m", "m.name == 'hello'"], function (facts) {
        this.assert(new Message("goodbye"));
    });

    this.rule("Hello World2", {agendaGroup: "ag2"}, [Message, "m", "m.name == 'hello'"], function (facts) {
        this.assert(new Message("goodbye"));
    });
});
var fired = [], fired2 = [], allFired = [], allfired2 = [];
flow
    .getSession(new Message("hello"))
    .focus("ag1")
    .on("fire", function (ruleName) {
        fired.push(ruleName);
    })
    .match(function () {
        console.log(fired);
    });

flow
    .getSession(new Message("hello"))
    .focus("ag2")
    .on("fire", function (ruleName) {
        fired2.push(ruleName);
    })
    .match(function () {
        console.log(fired2);
    });

flow
    .getSession(new Message("hello"))
    .focus("ag2")
    .focus("ag1")
    .on("fire", function (ruleName) {
        allFired.push(ruleName);
    })
    .match(function () {
        console.log(allFired);
    });

flow
    .getSession(new Message("hello"))
    .focus("ag1")
    .focus("ag2")
    .on("fire", function (ruleName) {
        allfired2.push(ruleName);
    })
    .match(function () {
        console.log(allfired2);
    });