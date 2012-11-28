(function () {
    "use strict";
    var data = require("./data"),
        nools = require("../../index");

    var flow = nools.compile(__dirname + "/waltzDb.nools");
    var items = data.load(flow).waltzdb4;
    var session = flow.getSession.apply(flow, items);
    session.assert(new (flow.getDefined("stage"))({value: "DUPLICATE"}));
    var start = new Date();
    session.match().both(function () {
        console.log("Duration %dms", new Date() - start);
    });
})();
