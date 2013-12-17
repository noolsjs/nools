var nools = require("../../lib");

var flow = nools.compile(require.resolve("./counter.nools"));

flow.getSession().matchUntilHalt().then(function () {
    //halt finally invoked
    console.log("done");
}, function (err) {
    console.log(err);
});
