/**
 *
 * @projectName nools
 * @github https://github.com/C2FO/nools
 * @includeDoc [Change Log] ../History.md
 * @header
 *
 * [![Build Status](https://secure.travis-ci.org/C2FO/nools.png)](http://travis-ci.org/C2FO/nools)
 * #Nools
 *
 * Nools is a rules engine for node based on the [rete](http://en.wikipedia.org/wiki/Rete_algorithm) network.
 *
 * # Installation
 *
 * `npm install nools`
 *
 *
 * #Usage
 *
 *    * Flows
 *     * [Defining A Flow](#flow)
 *     * [Sessions](#session)
 *     * [Facts](#facts)
 *     * [Firing](#firing)
 *     * [Disposing](#disposing)
 *    * [Defining Rules](#defining-rule)
 *       * [Structure](#rule-structure)
 *       * [Constraints](#constraints)
 *       * [Actions](#action)
 *    * [Fibonacci](#fib)
 *
 *
 *
 * To get started with nools the [examples](https://github.com/doug-martin/nools/tree/master/examples) and [tests](https://github.com/doug-martin/nools/tree/master/test) are a
 * great place to get started.
 *
 * <a name="flow"></a>
 * ##Defining a flow
 *
 * When using nools you define a **flow** which acts as a container for rules that can later be used to get
 * an **engine session**
 *
 * ###Pragmatically
 * ```
 * var nools = require("nools");
 *
 * var Message = function (message) {
 *     this.message = message;
 * };
 *
 * var flow = nools.flow("Hello World", function (flow) {
 *
 *     //find any message that start with hello
 *     this.rule("Hello", [Message, "m", "m.message =~ /^hello(\\s*world)?$/"], function (facts) {
 *         facts.m.message = facts.m.message + " goodbye";
 *         this.modify(facts.m);
 *     });
 *
 *     //find all messages then end in goodbye
 *     this.rule("Goodbye", [Message, "m", "m.message =~ /.*goodbye$/"], function (facts) {
 *         console.log(facts.m.message);
 *     });
 * });
 *
 * ```
 *
 * In the above flow definition 2 rules were defined
 *
 *   * Hello
 *     * Requires a Message
 *     * The messages's message must match the regular expression "/^hello(\\s*world)?$/"
 *     * When matched the message's message is modified and then we let the engine know that we modified the message.
 *   * Goodbye
 *     * Requires a Message
 *     * The messages's message must match the regular expression "/.*goodbye$/"(anything that ends in goodbye)
 *     * When matched the resulting message is logged.
 *
 * ###Nools DSL
 *
 * You may also use the `nools` rules language to define your rules
 *
 * ```
 * define Message {
 *     message : '',
 *     constructor : function(message){
 *         this.message = message;
 *     }
 * }
 *
 * rule Hello {
 *     when {
 *         m : Message m.message =~ /^hello(\\s*world)?$/;
 *     }
 *     then {
 *         modify(m, function(){this.message += " goodbye";});
 *     }
 * }
 *
 * rule Goodbye {
 *     when {
 *         m : Message m.message =~ /.*goodbye$/;
 *     }
 *     then {
 *         console.log(m.message);
 *     }
 * }
 * ```
 *
 * To use the flow
 *
 * ```
 * var flow = nools.compile(__dirname + "/helloworld.nools"),
 *     Message = flow.getDefined("message");
 * ```
 *
 *
 *
 * <a name="session"></a>
 * ##Working with a session
 *
 * A session is an instance of the flow that contains a working memory and handles the assertion, modification, and retraction
 * of facts from the engine.
 *
 * To obtain an engine session from the flow invoke the **getSession** method.
 *
 * ```
 * var session = flow.getSession();
 * ```
 *
 *
 * <a name="facts"></a>
 * ##Working with facts
 *
 * Facts are items that the rules should try to match.
 *
 *
 * To add facts to the session use **assert** method.
 *
 * ```
 * session.assert(new Message("hello"));
 * session.assert(new Message("hello world"));
 * session.assert(new Message("goodbye"));
 * ```
 *
 * As a convenience any object passed into **getSession** will also be asserted.
 *
 * ```
 * flow.getSession(new Message("hello"), new Message("hello world"), new Message("goodbye"));
 * ```
 *
 *
 * To retract facts from the session use the **retract** method.
 *
 * ```
 * var m = new Message("hello");
 *
 * //assert the fact into the engine
 * session.assert(m);
 *
 * //remove the fact from the engine
 * session.retract(m);
 *
 * ```
 *
 * To modify a fact use the **modify** method.
 *
 * **Note** modify will not work with immutable objects (i.e. strings).
 *
 * ```
 *
 * var m = new Message("hello");
 *
 * session.assert(m);
 *
 * m.message = "hello goodbye";
 *
 * session.modify(m);
 *
 * ```
 *
 * **assert** is typically used pre engine execution and during the execution of the rules.
 *
 * **modify** and **retract** are typically used during the execution of the rules.
 *
 *
 * <a name="firing"></a>
 * ##Firing the rules
 *
 * When you get a session from a **flow** no rules will be fired until the **match** method is called.
 *
 * ```
 * var session = flow.getSession();
 * //assert your different messages
 * session.assert(new Message("goodbye"));
 * session.assert(new Message("hello"));
 * session.assert(new Message("hello world"));
 *
 * //now fire the rules
 * session.match(function(err){
 *     if(err){
 *         console.error(err);
 *     }else{
 *         console.log("done");
 *     }
 * })
 * ```
 *
 * The **match** method returns a promise that is invoked once there are no more rules to activate.
 *
 * Example of the promise api
 * ```
 * session.match().then(
 *   function(){
 *       console.log("Done");
 *   },
 *   function(err){
 *     //uh oh an error occurred
 *     console.error(err);
 *   });
 * ```
 *
 * <a name="disposing"></a>
 * ##Disposing of the session
 *
 * When working with a lot of facts it is wise to call the **dispose** method which will purge the current session of
 * all facts, this will help prevent the process growing a large memory footprint.
 *
 * ```
 *    session.dispose();
 * ```
 *
 * <a name="defining-rule"></a>
 * #Defining rules
 *
 *
 * <a name="rule structure"></a>
 * ## Rule structure
 *
 * Lets look at the "Calculate" rule in the [Fibonacci](#fib) example
 *
 * ```
 *    //flow.rule(type[String|Function], constraints[Array|Array[[]]], action[Function]);
 *    flow.rule("Calculate", [
 *          //Type     alias  pattern           store sequence to s1
 *         [Fibonacci, "f1",  "f1.value != -1", {sequence:"s1"}],
 *         [Fibonacci, "f2", "f2.value != -1 && f2.sequence == s1 + 1", {sequence:"s2"}],
 *         [Fibonacci, "f3", "f3.value == -1 && f3.sequence == s2 + 1"],
 *         [Result, "r"]
 *     ], function (facts) {
 *         var f3 = facts.f3, f1 = facts.f1, f2 = facts.f2;
 *         var v = f3.value = f1.value + facts.f2.value;
 *         facts.r.result = v;
 *         this.modify(f3);
 *         this.retract(f1);
 *     });
 * ```
 *
 * Or using the nools DSL
 *
 * ```
 * rule Calculate{
 *     when {
 *         f1 : Fibonacci f1.value != -1 {sequence:s1};
 *         f2 : Fibonacci f2.value != -1 && f2.sequence == s1 + 1 {sequence:s2};
 *         f3 : Fibonacci f3.value == -1 && f3.sequence == s2 + 1;
 *     }
 *     then {
 *        modify(f3, function(){
 *             this.value = f1.value + f2.value;
 *        });
 *        retract(f1);
 *     }
 * }
 * ```
 *
 * <a name="constraints"></a>
 * ###Constraints
 *    Constraints define what facts the rule should match. The constraint is a array of either a single constraint (i.e. Bootstrap rule)
 *    or an array of constraints(i.e. Calculate).
 *
 * Prgamatically
 * ```
 * [
 *    //Type     alias  pattern           store sequence to s1
 *   [Fibonacci, "f1", "f1.value != -1", {sequence:"s1"}],
 *   [Fibonacci, "f2", "f2.value != -1 && f2.sequence == s1 + 1", {sequence:"s2"}],
 *   [Fibonacci, "f3", "f3.value == -1 && f3.sequence == s2 + 1"],
 *   [Result, "r"]
 * ]
 * ```
 *
 * Using nools DSL
 * ```
 * when {
 *     f1 : Fibonacci f1.value != -1 {sequence:s1};
 *     f2 : Fibonacci f2.value != -1 && f2.sequence == s1 + 1 {sequence:s2};
 *     f3 : Fibonacci f3.value == -1 && f3.sequence == s2 + 1;
 * }
 * ```
 *
 *    1. Type -  is the Object type the rule should match. The available types are
 *       * `String` - "string", "String", String
 *       * `Number` - "number", "Number", Number
 *       * `Boolean` - "boolean", "Boolean", Boolean
 *       * `Date` - "date", "Date", Date
 *       * `RegExp` - "regexp", "RegExp", RegExp
 *       * `Array` - "array", "Array", [], Array
 *       * `Object` - "object", "Object", "hash", Object
 *       * Custom - any custom type that you define
 *    2. Alias - the name the object should be represented as.
 *    3. Pattern(optional) - The pattern that should evaluate to a boolean, the alias that was used should be used to reference the object in the pattern. Strings should be in single quotes, regular expressions are allowed. Any previously define alias/reference can be used within the pattern. Available operators are.
 *       * `&&`, `AND`, `and`
 *       * `||`, `OR`, `or`
 *       * `>`, `<`, `>=`, `<=`, `gt`, `lt`, `gte`, `lte`
 *       * `==`, `!=`, `=~`, `eq`, `neq`, `like`
 *       * `+`, `-`, `*`, `/`
 *       * `-` (unary minus)
 *       * `.` (member operator)
 *       * `in` (check inclusion in an array)
 *       * Defined helper functions
 *         * `now` - the current date
 *         * `Date(year?, month?, day?, hour?, minute?, second?, ms?)` - creates a new `Date` object
 *         * `lengthOf(arr, length)` - checks the length of an array
 *         * `isTrue(something)` - check if something === true
 *         * `isFalse(something)` - check if something === false
 *         * `isRegExp(something)` - check if something is a `RegExp`
 *         * `isArray(something)` - check if something is an `Array`
 *         * `isNumber(something)` - check if something is an `Number`
 *         * `isHash(something)` - check if something is strictly an `Object`
 *         * `isObject(something)` - check if something is any type of `Object`
 *         * `isDate(something)` - check if something is a `Date`
 *         * `isBoolean(something)` - check if something is a `Boolean`
 *         * `isString(something)` - check if something is a `String`
 *         * `isUndefined(something)` - check if something is a `undefined`
 *         * `isDefined(something)` - check if something is `Defined`
 *         * `isUndefinedOrNull(something)` - check if something is a `undefined` or `null`
 *         * `isPromiseLike(something)` - check if something is a "promise" like (containing `then`, `addCallback`, `addErrback`)
 *         * `isFunction(something)` - check if something is a `Function`
 *         * `isNull(something)` - check if something is `null`
 *         * `isNotNull(something)` - check if something is not null
 *         * `dateCmp(dt1, dt2)` - compares two dates return 1, -1, or 0
 *         * `years|months|days|hours|minutes|seconds``Ago`/`FromNow``(interval)` - adds/subtracts the date unit from the current time
 *
 *    4. Reference(optional) - An object where the keys are properties on the current object, and values are aliases to use. The alias may be used in succeeding patterns.
 *
 * <a name="action"></a>
 * ###Action
 *
 * The action is a function that should be fired when all patterns in the rule match. The action is called in the scope
 * of the engine so you can use **this** to **assert**, **modify**, or **retract** facts. An object containing all facts and
 * references created by the alpha nodes is passed in as the first argument to the action.
 *
 * So calculate's action modifies f3 by adding the value of f1 and f2 together and modifies f3 and retracts f1.
 *
 * ```
 * function (facts) {
 *         var f3 = facts.f3, f1 = facts.f1, f2 = facts.f2;
 *         var v = f3.value = f1.value + facts.f2.value;
 *         facts.r.result = v;
 *         this.modify(f3);
 *         this.retract(f1);
 *     }
 * ```
 *
 * The engine is also passed in as a second argument so alternatively you could do the following.
 *
 * ```
 * function (facts, engine) {
 *         var f3 = facts.f3, f1 = facts.f1, f2 = facts.f2;
 *         var v = f3.value = f1.value + facts.f2.value;
 *         facts.r.result = v;
 *         engine.modify(f3);
 *         engine.retract(f1);
 *     }
 * ```
 *
 * If you have an async action that needs to take place an optional third argument can be passed in which is a function
 * to be called when the action is completed.
 *
 * ```
 * function (facts, engine, next) {
 *         //some async action
 *         process.nextTick(function(){
 *             var f3 = facts.f3, f1 = facts.f1, f2 = facts.f2;
 *             var v = f3.value = f1.value + facts.f2.value;
 *             facts.r.result = v;
 *             engine.modify(f3);
 *             engine.retract(f1);
 *             next();
 *         })
 *     }
 * ```
 * If any arguments are passed into next it is assumed there was an error and the session will error out.
 *
 * To define the action with the nools DSL
 *
 * ```
 * then {
 *     modify(f3, function(){
 *         this.value = f1.value + f2.value;
 *     });
 *     retract(f1);
 * }
 * ```
 *
 * For rules defined using the rules language nools will automatically determine what parameters need to be passed in based on what is referenced in the action.
 *
 *
 *
 * #Examples
 *
 * <a name="fib"></a>
 * ##Fibonacci
 *
 * ```
 * "use strict";
 *
 * var nools = require("nools");
 *
 * var Fibonacci = function (sequence, value) {
 *     this.sequence = sequence;
 *     this.value = value || -1;
 * };
 *
 * var Result = function (result) {
 *     this.result = result || -1;
 * };
 *
 *
 * var flow = nools.flow("Fibonacci Flow", function (flow) {
 *
 *     flow.rule("Recurse", {priority:1}, [
 *         ["not", Fibonacci, "f", "f.sequence == 1"],
 *         [Fibonacci, "f1", "f1.sequence != 1"]
 *     ], function (facts) {
 *         var f2 = new Fibonacci(facts.f1.sequence - 1);
 *         this.assert(f2);
 *     });
 *
 *     flow.rule("Bootstrap", [
 *           Fibonacci, "f", "f.value == -1 && (f.sequence == 1 || f.sequence == 2)"
 *     ], function (facts) {
 *         var f = facts.f;
 *         f.value = 1;
 *         this.modify(f);
 *     });
 *
 *     flow.rule("Calculate", [
 *         [Fibonacci, "f1", "f1.value != -1", {sequence:"s1"}],
 *         [Fibonacci, "f2", "f2.value != -1 && f2.sequence == s1 + 1", {sequence:"s2"}],
 *         [Fibonacci, "f3", "f3.value == -1 && f3.sequence == s2 + 1"],
 *         [Result, "r"]
 *     ], function (facts) {
 *         var f3 = facts.f3, f1 = facts.f1, f2 = facts.f2;
 *         var v = f3.value = f1.value + facts.f2.value;
 *         facts.r.result = v;
 *         this.modify(f3);
 *         this.retract(f1);
 *     });
 * });
 *
 * var r1 = new Result(),
 *     session1 = flow.getSession(new Fibonacci(10), r1),
 *     s1 = new Date;
 * session1.match().then(function () {
 *     console.log("%d [%dms]", r1.result, new Date - s1);
 *     session1.dispose();
 * });
 *
 * var r2 = new Result(),
 *     session2 = flow.getSession(new Fibonacci(150), r2),
 *     s2 = new Date;
 * session2.match().then(function () {
 *     console.log("%d [%dms]", r2.result, new Date - s2);
 *     session2.dispose();
 * });
 *
 * var r3 = new Result(),
 *     session3 = flow.getSession(new Fibonacci(1000), r3),
 *     s3 = new Date;
 * session3.match().then(function () {
 *     console.log("%d [%dms]", r3.result, new Date - s3);
 *     session3.dispose();
 * });
 *
 * ```
 *
 * Output
 *
 * ```
 * 55 [43ms]
 * 9.969216677189305e+30 [383ms]
 * 4.346655768693743e+208 [3580ms]
 * ```
 *
 * Fiboncci with nools DSL
 *
 * ```
 * //Define our object classes, you can
 * //also declare these outside of the nools
 * //file by passing them into the compile method
 * define Fibonacci {
 *     value:-1,
 *     sequence:null
 * }
 * define Result {
 *     value : -1
 * }
 *
 * rule Recurse {
 *     priority:1,
 *     when {
 *         //you can use not or or methods in here
 *         not(f : Fibonacci f.sequence == 1);
 *         //f1 is how you can reference the fact else where
 *         f1 : Fibonacci f1.sequence != 1;
 *     }
 *     then {
 *         assert(new Fibonacci({sequence : f1.sequence - 1}));
 *     }
 * }
 *
 * rule Bootstrap {
 *    when {
 *        f : Fibonacci f.value == -1 && (f.sequence == 1 || f.sequence == 2);
 *    }
 *    then{
 *        modify(f, function(){
 *            this.value = 1;
 *        });
 *    }
 * }
 *
 * rule Calculate {
 *     when {
 *         f1 : Fibonacci f1.value != -1 {sequence : s1};
 *         //here we define constraints along with a hash so you can reference sequence
 *         //as s2 else where
 *         f2 : Fibonacci f2.value != -1 && f2.sequence == s1 + 1 {sequence:s2};
 *         f3 : Fibonacci f3.value == -1 && f3.sequence == s2 + 1;
 *         r : Result
 *     }
 *     then {
 *         modify(f3, function(){
 *             this.value = r.result = f1.value + f2.value;
 *         });
 *         retract(f1);
 *     }
 * }
 *
 * ```
 *
 * And to run
 *
 * ```
 * var flow = nools.compile(__dirname + "/fibonacci.nools");
 *
 * var Fibonacci = flow.getDefined("fibonacci"), Result = flow.getDefined("result");
 * var r1 = new Result(),
 *     session1 = flow.getSession(new Fibonacci({sequence:10}), r1),
 *     s1 = +(new Date());
 * session1.match().then(function () {
 *     console.log("%d [%dms]", r1.result, +(new Date()) - s1);
 *     session1.dispose();
 * });
 *
 * var r2 = new Result(),
 *     session2 = flow.getSession(new Fibonacci({sequence:150}), r2),
 *     s2 = +(new Date());
 * session2.match().then(function () {
 *     console.log("%d [%dms]", r2.result, +(new Date()) - s2);
 *     session2.dispose();
 * });
 *
 * var r3 = new Result(),
 *     session3 = flow.getSession(new Fibonacci({sequence:1000}), r3),
 *     s3 = +(new Date());
 * session3.match().then(function () {
 *     console.log("%d [%dms]", r3.result, +(new Date()) - s3);
 *     session3.dispose();
 * });
 *
 * ```
 *
 * @footer
 *
 * License
 * -------
 *
 * MIT <https://github.com/C2FO/nools/raw/master/LICENSE>
 *
 * Meta
 * ----
 *
 * Code: `git clone git://github.com/C2FO/nools.git`
 *
 */



(function () {
    "use strict";
    var comb = require("comb"),
        when = comb.when,
        nodes = require("./nodes"),
        EventEmitter = require("events").EventEmitter,
        rule = require("./rule"),
        AVLTree = comb.collections.AVLTree,
        wm = require("./workingMemory"),
        WorkingMemory = wm.WorkingMemory,
        InitialFact = require("./pattern").InitialFact,
        Fact = wm.Fact,
        compile = require("./compile");


    var sortAgenda = function (a, b) {
        if (a === b) {
            return 0;
        }
        var ret;
        if (a.counter !== b.counter) {
            ret = a.counter - b.counter;
        } else {
            var p1 = a.rule.priority, p2 = b.rule.priority;
            if (p1 !== p2) {
                ret = p1 - p2;
            } else {
                var i = 0;
                var aMatchRecency = a.match.recency,
                    bMatchRecency = b.match.recency, aLength = aMatchRecency.length - 1, bLength = bMatchRecency.length - 1;
                while (aMatchRecency[i] === bMatchRecency[i] && i < aLength && i < bLength && i++) {
                }
                ret = aMatchRecency[i] - bMatchRecency[i];
                if (!ret) {
                    ret = aLength - bLength;
                }
                if (!ret) {
                    ret = a.recency - b.recency;
                }
            }
        }
        return ret > 0 ? 1 : -1;
    };

    var FactHash = comb.define(null, {
        instance:{
            constructor:function (def) {
                this.memory = [];
                this.memoryValues = [];
            },

            get:function (k) {
                return this.memoryValues[this.memory.indexOf(k)];
            },

            remove:function (v) {
                var facts = v.match.facts, j = facts.length - 1, mv = this.memoryValues, m = this.memory;
                for (; j >= 0; j--) {
                    var i = m.indexOf(facts[j].object);
                    var arr = mv[i], index = arr.indexOf(v);
                    arr.splice(index, 1);
                }
            },

            insert:function (insert) {
                var facts = insert.match.facts, mv = this.memoryValues, m = this.memory;
                var k = facts.length - 1;
                for (; k >= 0; k--) {
                    var o = facts[k].object, i = m.indexOf(o), arr = mv[i];
                    if (!arr) {
                        arr = mv[m.push(o) - 1] = [];
                    }
                    arr.push(insert);
                }
            }
        }

    });


    var REVERSE_ORDER = AVLTree.REVERSE_ORDER, IN_ORDER = AVLTree.IN_ORDER;
    var AgendaTree = comb.define(null, {

        instance:{
            constructor:function () {
                this.masterAgenda = new AVLTree({compare:sortAgenda});
                this.rules = {};
            },

            register:function (node) {
                this.rules[node.name] = {tree:new AVLTree({compare:sortAgenda}), factTable:new FactHash()};
            },

            isEmpty:function () {
                return this.masterAgenda.isEmpty();
            },


            pop:function () {
                var tree = this.masterAgenda, root = tree.__root;
                while (root.right) {
                    root = root.right;
                }
                var v = root.data;
                tree.remove(v);
                var rule = this.rules[v.name];
                rule.tree.remove(v);
                rule.factTable.remove(v);
                return v;
            },

            removeByFact:function (node, fact) {
                var rule = this.rules[node.name], tree = rule.tree, factTable = rule.factTable, obj = fact.object;
                var ma = this.masterAgenda;
                var remove = factTable.get(obj) || [];
                var i = remove.length - 1;
                for (; i >= 0; i--) {
                    var r = remove[i];
                    factTable.remove(r);
                    tree.remove(r);
                    ma.remove(r);
                }
                remove.length = 0;
            },

            retract:function (node, cb) {
                var remove = [], rule = this.rules[node.name], tree = rule.tree, factTable = rule.factTable;
                var ma = this.masterAgenda;
                tree.traverse(tree.__root, REVERSE_ORDER, function (v) {
                    if (cb(v)) {
                        factTable.remove(v);
                        ma.remove(v);
                        tree.remove(v);
                    }
                });
            },

            insert:function (node, insert) {
                var rule = this.rules[node.name];
                rule.tree.insert(insert);
                this.masterAgenda.insert(insert);
                rule.factTable.insert(insert);
            },

            dispose:function () {
                this.masterAgenda.clear();
                var rules = this.rules;
                for (var i in rules) {
                    if (i in rules) {
                        rules[i].tree.clear();
                    }
                }
                this.rules = {};
            }
        }

    });


    var Flow = comb.define(EventEmitter, {

        instance:{

            name:null,

            constructor:function (name) {
                this.env = null;
                this.name = name;
                this.__rules = {};
                this.__wmAltered = false;
                this.workingMemory = new WorkingMemory();
                this.agenda = new AgendaTree();
                this.rootNode = new nodes.RootNode(this.workingMemory, this.agenda);
            },

            dispose:function () {
                this.workingMemory.dispose();
                this.agenda.dispose();
                this.rootNode.dispose();
            },

            assert:function (fact) {
                this.__wmAltered = true;
                this.__factHelper(fact, true);
                this.emit("assert", fact);
                return fact;
            },

            // This method is called to remove an existing fact from working memory
            retract:function (fact) {
                //fact = this.workingMemory.getFact(fact);
                this.__wmAltered = true;
                this.__factHelper(fact, false);
                this.emit("retract", fact);
                return fact;
            },

            // This method is called to alter an existing fact.  It is essentially a
            // retract followed by an assert.
            modify:function (fact, cb) {
                //fact = this.workingMemory.getFact(fact);
                this.retract(fact);
                if ("function" === typeof cb) {
                    cb.call(fact, fact);
                }
                this.emit("modify", fact);
                return this.assert(fact);
            },

            print:function () {
                this.rootNode.print();
            },

            containsRule:function (name) {
                return this.rootNode.containsRule(name);
            },

            rule:function (rule) {
                this.rootNode.assertRule(rule);
            },

            match:function (cb) {
                var ret = new comb.Promise(), flow = this, rootNode = this.rootNode;
                if (rootNode) {
                    rootNode.resetCounter();
                    var agenda = this.agenda;
                    (function fire() {
                        if (!agenda.isEmpty()) {
                            var activation = agenda.pop();
                            activation.used = true;
                            flow.emit("fire", activation.rule.name, activation.match.factHash);
                            when(activation.rule.fire(flow, activation.match)).then(function () {
                                if (flow.__wmAltered) {
                                    rootNode.incrementCounter();
                                    flow.__wmAltered = false;
                                }
                                process.nextTick(fire);
                            }, ret);
                        } else {
                            ret.callback();
                        }
                    })();
                } else {
                    ret.callback();
                }
                ret.classic(cb);
                return ret;
            },

            __factHelper:function (object, assert) {
                var f = new Fact(object);
                if (assert) {
                    this.__assertFact(f);
                } else {
                    this.__retractFact(f);
                }
                return f;
            },

            __assertFact:function (fact) {
                var wmFact = this.workingMemory.assertFact(fact);
                if (wmFact) {
                    this.rootNode.assertFact(wmFact);
                }
            },

            __retractFact:function (fact) {
                var wmFact = this.workingMemory.retractFact(fact);
                if (wmFact && this.rootNode) {
                    this.rootNode.retractFact(wmFact);
                }
            }
        }
    });

    var FlowContainer = comb.define(null, {

        instance:{

            constructor:function (name, cb) {
                this.name = name;
                this.cb = cb;
                this.__rules = [];
                this.__defined = {};
                if (cb) {
                    cb.call(this, this);
                }
            },

            getDefined:function (name) {
                var ret = this.__defined[name.toLowerCase()];
                if (!ret) {
                    throw new Error(name + " flow class is not defined");
                }
                return ret;
            },

            addDefined:function (name, cls) {
                //normalize
                this.__defined[name.toLowerCase()] = cls;
                return cls;
            },

            rule:function () {
                this.__rules = this.__rules.concat(rule.createRule.apply(rule, arguments));
            },

            getSession:function () {
                var flow = new Flow(this.name);
                this.__rules.forEach(function (rule) {
                    flow.rule(rule);
                });
                var args = comb.argsToArray(arguments);
                flow.assert(new InitialFact());
                args.forEach(function (arg) {
                    flow.assert(arg);
                });
                return flow;
            },

            containsRule:function (name) {
                return this.__rules.some(function (rule) {
                    return rule.name === name;
                });
            }

        }

    }).as(exports, "Flow");

    exports.flow = function (name, cb) {
        return  new FlowContainer(name, cb);
    };

    exports.compile = function (file, options, cb) {
        return  compile.compile(file, options, cb, FlowContainer);

    };

})();

