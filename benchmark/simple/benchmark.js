"use strict";
var nools = require("../../"),
    defined = {},
    constraints = [],
    COUNT = 5;

for (var i = 0; i < COUNT; i++) {
    constraints.push([defined["Object" + i] = function (value) {
        this.name = value;
    }, "m" + i]);
}


var start = new Date();

var execCount = 0;

var flow = nools.flow("Performance Test", function () {

    //find any message that starts with hello
    this.rule("Rule1", constraints, function () {

            execCount++;
            console.log("execCount: " + execCount);
        }
    );

});

var session = flow.getSession();

for (var j = 0; j < COUNT; j++) {
    for (var k = 0; k < COUNT; k++) {
        session.assert(new defined["Object" + k](j + " " + k));
    }
}

module.exports = session.match(function (err) {
    if (err) {
        throw err;
    }
    console.log("Duration %dms", new Date() - start);
    session.dispose();
});


