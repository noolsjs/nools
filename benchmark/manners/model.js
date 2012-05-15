(function () {

    "use strict";
    var comb = require("comb"), format = comb.string.format;
    comb.define(null, {
        instance:{
            constructor:function (id, guest, hobby) {
                this.id = id;
                this.guestName = guest;
                this.hobby = hobby;
            },

            toString:function () {
                return ["[Chosen : id=", this.id, " name=", this.guestName, " hobby=", this.hobby, "]"].join(" ");
            }
        }
    }).as(exports, "Chosen");

    comb.define(null, {
        instance:{
            constructor:function (state) {
                if (state === "start") {
                    this.state = this._static.START_UP;
                } else {
                    throw new Error(format("context does not exist for state %s", state));
                }
            },

            toString:function () {
                return ["[Context state =", this.stringValue, "]"].join("");
            },

            getters:{
                stringValue:function () {
                    return this._static.STATE_STRINGS[this.state];
                }
            }
        },

        static:{
            START_UP:0,
            ASSIGN_SEATS:1,
            MAKE_PATH:2,
            CHECK_DONE:3,
            PRINT_RESULTS:4,
            STATE_STRINGS:["START_UP", "ASSIGN_SEATS", "MAKE_PATH", "CHECK_DONE", "PRINT_RESULTS"]

        }
    }).as(exports, "Context");


    comb.define(null, {
        instance:{
            constructor:function (value) {
                this.value = value;
            },

            toString:function () {
                return format("[Count value=%d]", this.value);
            }
        }
    }).as(exports, "Count");


    comb.define(null, {
        instance:{
            constructor:function (name, sex, hobby) {
                this.name = name;
                this.sex = sex;
                this.hobby = hobby;
            },

            toString:function () {
                return format("[Guest name={name}, sex={sex}, hobbies={hobby}]", this);
            }
        }
    }).as(exports, "Guest");


    comb.define(null, {
        instance:{
            constructor:function (seat) {
                this.seat = seat;
            },

            toString:function () {
                return format("[LastSeat seat=%s]", this.seat);
            }
        }
    }).as(exports, "LastSeat");


    comb.define(null, {
        instance:{
            constructor:function (id, seat, guestName) {
                this.id = id;
                this.seat = seat;
                this.guestName = guestName;
            },

            toString:function () {
                return ["[Path id=", this.id, " name=", this.guestName, " seat=", this.seat, "]"].join("");
            }
        }
    }).as(exports, "Path");


    comb.define(null, {
        instance:{
            constructor:function (id, pid, path, leftSeat, leftGuestName, rightSeat, rightGuestName) {
                this.id = id;
                this.pid = pid;
                this.path = path;
                this.leftSeat = leftSeat;
                this.leftGuestName = leftGuestName;
                this.rightSeat = rightSeat;
                this.rightGuestName = rightGuestName;
            },

            toString:function () {
                return ["[Seating id=", this.id, " pid=", this.pid, " pathDone=", this.path, " leftSeat=", this.leftSeat,
                    " leftGuestName=", this.leftGuestName, " rightSeat=", this.rightSeat, " rightGuestName=", this.rightGuestName, "]"].join("");
            }
        }
    }).as(exports, "Seating");

})();



