var flow = require("./manners.flow"), models = require("./model"), data = require("./data");

var session = flow.getSession.apply(flow, data.guests16);
session.assert(new models.Context("start"));
session.assert(new models.Count(1));
var start = new Date();
session.match().both(function () {
    console.log("Duration %dms", new Date() - start);
});