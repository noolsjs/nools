var data = require("./data"),
    nools = require("../../index");

var flow = nools.parse(__dirname + "/manners.withDefined.json");
var guests = data.load(flow.getDefined("guest"), flow.getDefined("lastSeat")).guests16;
var session = flow.getSession.apply(flow, guests);
session.print();
session.assert(new (flow.getDefined("context"))({state:"start"}));
session.assert(new (flow.getDefined("count"))({value:1}));
var start = new Date();
session.match().both(function () {
    console.log("Duration %dms", new Date() - start);
});

