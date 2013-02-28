"use strict";

var nools = require("../..");

var flow = nools.compile(__dirname + "/rules/validator.nools"),
    Model = flow.getDefined("model");

var models = [
    new Model({id: 1}),
    new Model({id: 2, firstName: "Bob"}),
    new Model({id: 3, firstName: "Bob", lastName: "Yukon"}),
    new Model({id: 4, firstName: "Bob", lastName: "Yukon", dob: new Date(2000, 10, 10)}),
    new Model({id: 5, firstName: "Bob", lastName: "Yukon", dob: new Date(1980, 10, 10)}),
    new Model({id: 6, firstName: "Bob", lastName: "Yukon", dob: new Date(1980, 10, 10), email: "bob"}),
    new Model({id: 7, firstName: "Bob", lastName: "Yukon", dob: new Date(1980, 10, 10), email: "bob@yukon"}),
    new Model({id: 8, firstName: "Bob", lastName: "Yukon", dob: new Date(1980, 10, 10), email: "bob@yukon.com"}),
    new Model({id: 9, firstName: "Bob1", lastName: "Yukon", dob: new Date(1980, 10, 10), email: "bob1@yukon.com"}),
    new Model({id: 10, firstName: "Bob", lastName: "Yukon1", dob: new Date(1980, 10, 10), email: "bob2@yukon.com"}),
    new Model({id: 11, firstName: "Bobalicious", lastName: "Yukon", dob: new Date(1980, 10, 10), email: "bob3@yukon.com"}),
    new Model({id: 12, firstName: "Sally", lastName: "GregorianCalendar", dob: new Date(1980, 10, 10), email: "sally@yukon.com"}),
    new Model({id: 13, firstName: "Sally", lastName: "Yukon", dob: new Date(1980, 10, 10), email: "sally@yukon.com"})
];

var session = flow.getSession.apply(flow, models);
session.match().then(function () {
    models.forEach(function (m) {
        if (m.errors.length) {
            console.log("%s \nerrors : [ \n\t%s \n]", m, m.errors.join(",\n\t"));
        } else {
            console.log("%s is valid!", m);
        }
    });
    session.dispose();
}).addErrback(function (err) {
        console.log(err.stack);
    });
