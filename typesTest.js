"use strict";
var it = require("it"),
    resolve = require("path").resolve,
    assert = require("assert"),
    nools = require("../index.js");

it.describe("extended Fact types", function (it) {
    var Person, Student, LongTermStudent, Count, session1Fired = {}, session1;
    var flow = nools.compile(resolve(__dirname, "../rules/extends.nools"), {
        name: 'extendsTest'
    });
    Person = flow.getDefined('Person');
    Student = flow.getDefined('Student');
    LongTermStudent = flow.getDefined('LongTermStudent');
    
    
    session1 = flow.getSession(new Person('Bob'), new Student('Sue', 'harvard'), new LongTermStudent('Jim', 'princeton', 1)).on('fire', function (name) {
        session1Fired[name] = session1Fired[name] || { cnt: 0 };
        session1Fired[name].cnt++;
    });
    
    it.should(" fire rule(s) correctly according to type", function (next) {
        return session1.match().then(function () {
            assert(session1Fired['PersonTest'].cnt === 3);
            assert(session1Fired['StudentTest'].cnt === 2);
            assert(session1Fired['LongTermStudentTest'].cnt === 1);
        })
    });
});
it.run();
/*
debugger;
function Person(name) {
    this.name = name
}

function Student(name, school) {
    Person.call(this, name);
    this.school = school;
}
Student.prototype = Object.create(Person.prototype);
Student.prototype.constructor = Student;

var stud = new Student('mark', 'UCSC');

if (stud instanceof Person) { 
    debugger;
}
else {
    debugger;
}
 * */

