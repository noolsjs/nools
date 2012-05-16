(function () {
    "use strict";

    /**
     * Based off of JBoss rules
     * manners.drl
     * https://raw.github.com/droolsjbpm/drools/master/drools-examples/src/main/resources/org/drools/benchmark/manners/manners.drl
     */
    var nools = require("../../index"),
        models = require("./model"),
        Context = models.Context,
        Guest = models.Guest,
        LastSeat = models.LastSeat,
        Path = models.Path,
        Seating = models.Seating,
        Chosen = models.Chosen,
        Count = models.Count;

    module.exports = exports = nools.flow("Manners", function (flow) {

        flow.rule("assignFirstSeat", [
            [Context, "c", "c.state == " + Context.START_UP],
            [Guest, "g"],
            [Count, "count"]
        ], function (facts) {
            var name = facts.g.name, count = facts.count, context = facts.c;
            var seating = new Seating(count.value, 0, true, 1, name, 1, name);
            this.assert(seating);
            var path = new Path(count.value, 1, name);
            this.assert(path);
            ++count.value;
            this.modify(count);
            console.log("assign first seat : " + seating + " : " + path);
            context.state = Context.ASSIGN_SEATS;
            this.modify(context);
        });

        flow.rule("findSeating", [
            [Context, "c", "c.state == " + Context.ASSIGN_SEATS],
            [Seating, "s", "s.path == true", {id:"sid", rightGuestName:"seatingRightGuestName"}],
            [Guest, "g", "g.name == seatingRightGuestName", {sex:"rightGuestSex", hobby:"rightGuestHobby"}],
            [Guest, "lg", "lg.sex != rightGuestSex && lg.hobby == rightGuestHobby", {name:"leftGuestName"}],
            [Count, "count"],
            ["not", Path, "p", "p.id == sid && p.guestName == leftGuestName"],
            ["not", Chosen, "chosen", "chosen.id == sid && chosen.guestName == leftGuestName && chosen.hobby == rightGuestHobby"]
        ], function (facts) {
            var s = facts.s,
                count = facts.count,
                context = facts.c,
                lgn = facts.leftGuestName,
                rightSeat = s.rightSeat,
                seatId = facts.sid, countValue = count.value;
            this.assert(new Seating(countValue, seatId, false, rightSeat, facts.seatingRightGuestName, rightSeat + 1, lgn));
            this.assert(new Path(countValue, rightSeat + 1, lgn));
            this.assert(new Chosen(seatId, lgn, facts.rightGuestHobby));
            this.modify(count, function () {
                this.value++;
            });
            this.modify(context, function () {
                this.state = Context.MAKE_PATH
            });
        });

        flow.rule("makePath", [
            [Context, "c", "c.state == " + Context.MAKE_PATH],
            [Seating, "s" , "s.path == false", {id:"seatingId", pid:"seatingPid"}],
            [Path, "p", "p.id == seatingPid", {guestName:"pathGuestName", seat:"pathSeat"}],
            ["not", Path, "p2", "p2.id == seatingId && p2.guestName == pathGuestName"]
        ], function (facts) {
            this.assert(new Path(facts.seatingId, facts.pathSeat, facts.pathGuestName));
        });

        flow.rule("pathDone", [
            [Context, "c", "c.state == " + Context.MAKE_PATH],
            [Seating, "s", "s.path == false"]
        ], function (facts) {
            var s = facts.s;
            this.modify(s, function () {
                this.path = true;
            });
            this.modify(facts.c, function () {
                this.state = Context.CHECK_DONE;
            });
            console.log("path Done : %s", s);
        });


        flow.rule("areWeDone", [
            [Context, "c", "c.state == " + Context.CHECK_DONE],
            [LastSeat, "ls", "true", {seat:"lastSeat"}],
            [Seating, "s", "s.rightSeat == lastSeat"]
        ], function (facts) {
            this.modify(facts.c, function () {
                this.state = Context.PRINT_RESULTS;
            });
        });


        flow.rule("continue", [Context, "c", "c.state == " + Context.CHECK_DONE],
            function (facts) {
                this.modify(facts.c, function () {
                    this.state = Context.ASSIGN_SEATS;
                });
            });

        flow.rule("allDone", [Context, "c", "c.state == " + Context.PRINT_RESULTS], function () {
            console.log("All Done");
        });

    });

})();

