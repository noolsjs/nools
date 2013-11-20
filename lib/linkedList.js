var declare = require("declare.js");
declare({

    instance: {
        constructor: function () {
            this.head = null;
            this.tail = null;
            this.length = null;
        },

        push: function (data) {
            var tail = this.tail, head = this.head, node = {data: data, prev: tail, next: null};
            if (tail) {
                this.tail.next = node;
            }
            this.tail = node;
            if (!head) {
                this.head = node;
            }
            this.length++;
            return node;
        },

        remove: function (node) {
            if (node.prev) {
                node.prev.next = node.next;
            } else {
                this.head = node.next;
            }
            if (node.next) {
                node.next.prev = node.prev;
            } else {
                this.tail = node.prev;
            }
            //node.data = node.prev = node.next = null;
            this.length--;
        },

        forEach: function (cb) {
            var head = {next: this.head};
            while ((head = head.next)) {
                cb(head.data);
            }
        },

        toArray: function () {
            var head = {next: this.head}, ret = [];
            while ((head = head.next)) {
                ret.push(head);
            }
            return ret;
        },

        removeByData: function (data) {
            var head = {next: this.head};
            while ((head = head.next)) {
                if (head.data === data) {
                    this.remove(head);
                    break;
                }
            }
        },

        getByData: function (data) {
            var head = {next: this.head};
            while ((head = head.next)) {
                if (head.data === data) {
                    return head;
                }
            }
        },

        clear: function () {
            this.head = this.tail = null;
            this.length = 0;
        }

    }

}).as(module);
