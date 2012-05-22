(function () {
    "use strict";
    var nools = require("../index");

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

    var session = flow.getSession();
//assert your different messages
    session.assert("goodbye");
    session.assert("hello");
    session.assert("hello world");
    session.match();


//same as above getSession will assert the passed in objects
    var session2 = flow.getSession(
        "goodbye",
        "hello",
        "hello world"
    );
    session2.match();
})();





