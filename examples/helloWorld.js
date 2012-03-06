var nools = require("../index");

var Message = function (message) {
    this.message = message;
};


var flow = nools.flow("Hello World", function (flow) {

    //find any message that starts with hello
    this.rule("Hello", [String, "s", "s =~ /^hello(\\s*world)?$/"], function (facts) {
        var s = facts.s + " goodbye";
        this.assert(s);
    });

    //find all messages then end in goodbye
    this.rule("Goodbye", [String, "s", "s =~ /.*goodbye$/"], function (facts) {
        console.log(facts.s);
    });
});

var session2 = flow.getSession();
//assert your different messages
session2.assert("goodbye");
session2.assert("hello");
session2.assert("hello world");
session2.match();


//same as above getSession will assert the passed in objects
var session = flow.getSession(
    "goodbye",
    "hello",
    "hello world"
);
session.match();





