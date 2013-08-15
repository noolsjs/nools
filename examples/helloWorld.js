(function () {
    "use strict";
    var nools = require("../index");

    var Message = function (message) {
        this.message = message;
    };


    var flow = nools.flow("Hello World", function (flow) {

        //find any message that starts with hello
        this.rule("Hello", [Message, "m", "m.message =~ /^hello(\\s*world)?$/"], function (facts) {
            facts.m.message = facts.m.message + " goodbye";
            this.modify(facts.m);
        });

        //find all messages then end in goodbye
        this.rule("Goodbye", [Message, "m", "m.message =~ /.*goodbye$/"], function (facts) {
            console.log(facts.m.message);
        });
    });

    var session = flow.getSession();
//assert your different messages
    session.assert(new Message("goodbye"));
    session.assert(new Message("hello"));
    session.assert(new Message("hello world"));
    session.match();


//same as above getSession will assert the passed in objects
    var session2 = flow.getSession(
        new Message("goodbye"),
        new Message("hello"),
        new Message("hello world")
    );
    session2.match();

})();




