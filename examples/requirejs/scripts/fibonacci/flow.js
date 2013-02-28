define(["nools"], function (nools) {

    "use strict";
    var Fibonacci = function (sequence, value) {
        this.sequence = sequence;
        this.value = value || -1;
    };

    var Result = function (result) {
        this.result = result || -1;
    };


    return {
        Fibonacci: Fibonacci,
        Result: Result,
        flow: nools.flow("Fibonacci Flow", function (flow) {

            flow.rule("Recurse", {priority: 1}, [
                ["not", Fibonacci, "f", "f.sequence == 1"],
                [Fibonacci, "f1", "f1.sequence != 1"]
            ], function (facts) {
                this.assert(new Fibonacci(facts.f1.sequence - 1));
            });

            flow.rule("Bootstrap", [
                Fibonacci, "f", "f.value == -1 && (f.sequence == 1 || f.sequence == 2)"
            ], function (facts) {
                this.modify(facts.f, function () {
                    this.value = 1;
                });
            });

            flow.rule("Calculate", [
                [Fibonacci, "f1", "f1.value != -1", {sequence: "s1"}],
                [Fibonacci, "f2", "f2.value != -1 && f2.sequence == s1 + 1", {sequence: "s2"}],
                [Fibonacci, "f3", "f3.value == -1 && f3.sequence == s2 + 1"],
                [Result, "r"]
            ], function (facts) {
                var f3 = facts.f3, f1 = facts.f1, f2 = facts.f2;
                var v = f3.value = f1.value + f2.value;
                facts.r.result = v;
                this.modify(f3);
                this.retract(f1);
            });
        })
    };


})
;


