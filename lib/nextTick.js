/*global setImmediate, window, MessageChannel*/
var extd = require("./extended");
var nextTick;
if (typeof setImmediate === "function") {
    // In IE10, or use https://github.com/NobleJS/setImmediate
    if (typeof window !== "undefined") {
        nextTick = extd.bind(window, setImmediate);
    } else {
        nextTick = setImmediate;
    }
} else if (typeof process !== "undefined") {
    // node
    nextTick = process.nextTick;
} else if (typeof MessageChannel !== "undefined") {
    // modern browsers
    // http://www.nonblocking.io/2011/06/windownexttick.html
    var channel = new MessageChannel();
    // linked list of tasks (single, with head node)
    var head = {}, tail = head;
    channel.port1.onmessage = function () {
        head = head.next;
        var task = head.task;
        delete head.task;
        task();
    };
    nextTick = function (task) {
        tail = tail.next = {task: task};
        channel.port2.postMessage(0);
    };
} else {
    // old browsers
    nextTick = function (task) {
        setTimeout(task, 0);
    };
}

module.exports = nextTick;