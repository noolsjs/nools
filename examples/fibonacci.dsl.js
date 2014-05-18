"use strict";

var nools = require("../index");

var flow = nools.compile(__dirname + "/fibonacci.nools");

var Fibonacci = flow.getDefined("fibonacci"), Result = flow.getDefined("result");

var r1 = new Result(),
    session1 = flow.getSession(new Fibonacci({sequence: 10}), r1),
    s1 = +(new Date());
session1.match().then(function () {

    console.log("%d [%dms]", r1.result, +(new Date()) - s1);
    session1.dispose();
    profiler.pause();
});

var r2 = new Result(),
    session2 = flow.getSession(new Fibonacci({sequence: 150}), r2),
    s2 = +(new Date());
session2.match().then(function () {
    console.log("%d [%dms]", r2.result, +(new Date()) - s2);
    session2.dispose();
});

var r3 = new Result(),
    session3 = flow.getSession(new Fibonacci({sequence: 1000}), r3),
    s3 = +(new Date());
session3.match().then(function () {
    console.log("%d [%dms]", r3.result, +(new Date()) - s3);
    session3.dispose();
});
