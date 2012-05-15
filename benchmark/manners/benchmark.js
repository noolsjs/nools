var flow = require("./manners.flow"), models = require("./model"), data = require("./data");

var session = flow.getSession.apply(flow, data.guests16);
session.assert(new models.Context("start"));
session.assert(new models.Count(1));
var start = new Date();
session.match(function (err) {
    if (err) {
        console.log(err);
    } else {
        console.log("Duration %dms", new Date() - start);
    }
});