(function(){
var require = function (file, cwd) {
    var resolved = require.resolve(file, cwd || '/');
    var mod = require.modules[resolved];
    if (!mod) throw new Error(
        'Failed to resolve module ' + file + ', tried ' + resolved
    );
    var cached = require.cache[resolved];
    var res = cached? cached.exports : mod();
    return res;
};

require.paths = [];
require.modules = {};
require.cache = {};
require.extensions = [".js",".coffee",".json"];

require._core = {
    'assert': true,
    'events': true,
    'fs': true,
    'path': true,
    'vm': true
};

require.resolve = (function () {
    return function (x, cwd) {
        if (!cwd) cwd = '/';
        
        if (require._core[x]) return x;
        var path = require.modules.path();
        cwd = path.resolve('/', cwd);
        var y = cwd || '/';
        
        if (x.match(/^(?:\.\.?\/|\/)/)) {
            var m = loadAsFileSync(path.resolve(y, x))
                || loadAsDirectorySync(path.resolve(y, x));
            if (m) return m;
        }
        
        var n = loadNodeModulesSync(x, y);
        if (n) return n;
        
        throw new Error("Cannot find module '" + x + "'");
        
        function loadAsFileSync (x) {
            x = path.normalize(x);
            if (require.modules[x]) {
                return x;
            }
            
            for (var i = 0; i < require.extensions.length; i++) {
                var ext = require.extensions[i];
                if (require.modules[x + ext]) return x + ext;
            }
        }
        
        function loadAsDirectorySync (x) {
            x = x.replace(/\/+$/, '');
            var pkgfile = path.normalize(x + '/package.json');
            if (require.modules[pkgfile]) {
                var pkg = require.modules[pkgfile]();
                var b = pkg.browserify;
                if (typeof b === 'object' && b.main) {
                    var m = loadAsFileSync(path.resolve(x, b.main));
                    if (m) return m;
                }
                else if (typeof b === 'string') {
                    var m = loadAsFileSync(path.resolve(x, b));
                    if (m) return m;
                }
                else if (pkg.main) {
                    var m = loadAsFileSync(path.resolve(x, pkg.main));
                    if (m) return m;
                }
            }
            
            return loadAsFileSync(x + '/index');
        }
        
        function loadNodeModulesSync (x, start) {
            var dirs = nodeModulesPathsSync(start);
            for (var i = 0; i < dirs.length; i++) {
                var dir = dirs[i];
                var m = loadAsFileSync(dir + '/' + x);
                if (m) return m;
                var n = loadAsDirectorySync(dir + '/' + x);
                if (n) return n;
            }
            
            var m = loadAsFileSync(x);
            if (m) return m;
        }
        
        function nodeModulesPathsSync (start) {
            var parts;
            if (start === '/') parts = [ '' ];
            else parts = path.normalize(start).split('/');
            
            var dirs = [];
            for (var i = parts.length - 1; i >= 0; i--) {
                if (parts[i] === 'node_modules') continue;
                var dir = parts.slice(0, i + 1).join('/') + '/node_modules';
                dirs.push(dir);
            }
            
            return dirs;
        }
    };
})();

require.alias = function (from, to) {
    var path = require.modules.path();
    var res = null;
    try {
        res = require.resolve(from + '/package.json', '/');
    }
    catch (err) {
        res = require.resolve(from, '/');
    }
    var basedir = path.dirname(res);
    
    var keys = (Object.keys || function (obj) {
        var res = [];
        for (var key in obj) res.push(key);
        return res;
    })(require.modules);
    
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.slice(0, basedir.length + 1) === basedir + '/') {
            var f = key.slice(basedir.length);
            require.modules[to + f] = require.modules[basedir + f];
        }
        else if (key === basedir) {
            require.modules[to] = require.modules[basedir];
        }
    }
};

(function () {
    var process = {};
    var global = typeof window !== 'undefined' ? window : {};
    var definedProcess = false;
    
    require.define = function (filename, fn) {
        if (!definedProcess && require.modules.__browserify_process) {
            process = require.modules.__browserify_process();
            definedProcess = true;
        }
        
        var dirname = require._core[filename]
            ? ''
            : require.modules.path().dirname(filename)
        ;
        
        var require_ = function (file) {
            var requiredModule = require(file, dirname);
            var cached = require.cache[require.resolve(file, dirname)];

            if (cached && cached.parent === null) {
                cached.parent = module_;
            }

            return requiredModule;
        };
        require_.resolve = function (name) {
            return require.resolve(name, dirname);
        };
        require_.modules = require.modules;
        require_.define = require.define;
        require_.cache = require.cache;
        var module_ = {
            id : filename,
            filename: filename,
            exports : {},
            loaded : false,
            parent: null
        };
        
        require.modules[filename] = function () {
            require.cache[filename] = module_;
            fn.call(
                module_.exports,
                require_,
                module_,
                module_.exports,
                dirname,
                filename,
                process,
                global
            );
            module_.loaded = true;
            return module_.exports;
        };
    };
})();


require.define("path",function(require,module,exports,__dirname,__filename,process,global){function filter (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (fn(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length; i >= 0; i--) {
    var last = parts[i];
    if (last == '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Regex to split a filename into [*, dir, basename, ext]
// posix version
var splitPathRe = /^(.+\/(?!$)|\/)?((?:.+?)?(\.[^.]*)?)$/;

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
var resolvedPath = '',
    resolvedAbsolute = false;

for (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {
  var path = (i >= 0)
      ? arguments[i]
      : process.cwd();

  // Skip empty and invalid entries
  if (typeof path !== 'string' || !path) {
    continue;
  }

  resolvedPath = path + '/' + resolvedPath;
  resolvedAbsolute = path.charAt(0) === '/';
}

// At this point the path should be resolved to a full absolute path, but
// handle relative paths to be safe (might happen when process.cwd() fails)

// Normalize the path
resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
var isAbsolute = path.charAt(0) === '/',
    trailingSlash = path.slice(-1) === '/';

// Normalize the path
path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }
  
  return (isAbsolute ? '/' : '') + path;
};


// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    return p && typeof p === 'string';
  }).join('/'));
};


exports.dirname = function(path) {
  var dir = splitPathRe.exec(path)[1] || '';
  var isWindows = false;
  if (!dir) {
    // No dirname
    return '.';
  } else if (dir.length === 1 ||
      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {
    // It is just a slash or a drive letter with a slash
    return dir;
  } else {
    // It is a full dirname, strip trailing slash
    return dir.substring(0, dir.length - 1);
  }
};


exports.basename = function(path, ext) {
  var f = splitPathRe.exec(path)[2] || '';
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPathRe.exec(path)[3] || '';
};

});

require.define("__browserify_process",function(require,module,exports,__dirname,__filename,process,global){var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
        && window.setImmediate;
    var canPost = typeof window !== 'undefined'
        && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'browserify-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('browserify-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    if (name === 'evals') return (require)('vm')
    else throw new Error('No such module. (Possibly not yet loaded)')
};

(function () {
    var cwd = '/';
    var path;
    process.cwd = function () { return cwd };
    process.chdir = function (dir) {
        if (!path) path = require('path');
        cwd = path.resolve(dir, cwd);
    };
})();

});

require.define("/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {"main":"index.js"}
});

require.define("/index.js",function(require,module,exports,__dirname,__filename,process,global){module.exports = exports = require("./lib");
});

require.define("/lib/index.js",function(require,module,exports,__dirname,__filename,process,global){/**
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




"use strict";
var extd = require("./extended"),
    fs = require("fs"),
    path = require("path"),
    indexOf = extd.indexOf,
    forEach = extd.forEach,
    declare = extd.declare,
    Promise = extd.Promise,
    when = extd.when,
    bind = extd.bind,
    AVLTree = extd.AVLTree,
    nodes = require("./nodes"),
    EventEmitter = require("events").EventEmitter,
    rule = require("./rule"),
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

var FactHash = declare({
    instance: {
        constructor: function () {
            this.memory = [];
            this.memoryValues = [];
        },

        get: function (k) {
            return this.memoryValues[indexOf(this.memory, k)];
        },

        remove: function (v) {
            var facts = v.match.facts, j = facts.length - 1, mv = this.memoryValues, m = this.memory;
            for (; j >= 0; j--) {
                var i = indexOf(m, facts[j].object);
                var arr = mv[i], index = indexOf(arr, v);
                arr.splice(index, 1);
            }
        },

        insert: function (insert) {
            var facts = insert.match.facts, mv = this.memoryValues, m = this.memory;
            var k = facts.length - 1;
            for (; k >= 0; k--) {
                var o = facts[k].object, i = indexOf(m, o), arr = mv[i];
                if (!arr) {
                    arr = mv[m.push(o) - 1] = [];
                }
                arr.push(insert);
            }
        }
    }

});


var REVERSE_ORDER = AVLTree.REVERSE_ORDER;
var AgendaTree = declare({

    instance: {
        constructor: function () {
            this.masterAgenda = new AVLTree({compare: sortAgenda});
            this.rules = {};
        },

        register: function (node) {
            this.rules[node.name] = {tree: new AVLTree({compare: sortAgenda}), factTable: new FactHash()};
        },

        isEmpty: function () {
            return this.masterAgenda.isEmpty();
        },


        pop: function () {
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

        removeByFact: function (node, fact) {
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

        retract: function (node, cb) {
            var rule = this.rules[node.name], tree = rule.tree, factTable = rule.factTable;
            var ma = this.masterAgenda;
            tree.traverse(tree.__root, REVERSE_ORDER, function (v) {
                if (cb(v)) {
                    factTable.remove(v);
                    ma.remove(v);
                    tree.remove(v);
                }
            });
        },

        insert: function (node, insert) {
            var rule = this.rules[node.name];
            rule.tree.insert(insert);
            this.masterAgenda.insert(insert);
            rule.factTable.insert(insert);
        },

        dispose: function () {
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


var Flow = declare(EventEmitter, {

    instance: {

        name: null,

        constructor: function (name) {
            this.env = null;
            this.name = name;
            this.__rules = {};
            this.__wmAltered = false;
            this.workingMemory = new WorkingMemory();
            this.agenda = new AgendaTree();
            this.rootNode = new nodes.RootNode(this.workingMemory, this.agenda);
        },

        dispose: function () {
            this.workingMemory.dispose();
            this.agenda.dispose();
            this.rootNode.dispose();
        },

        assert: function (fact) {
            this.__wmAltered = true;
            this.__factHelper(fact, true);
            this.emit("assert", fact);
            return fact;
        },

        // This method is called to remove an existing fact from working memory
        retract: function (fact) {
            //fact = this.workingMemory.getFact(fact);
            this.__wmAltered = true;
            this.__factHelper(fact, false);
            this.emit("retract", fact);
            return fact;
        },

        // This method is called to alter an existing fact.  It is essentially a
        // retract followed by an assert.
        modify: function (fact, cb) {
            //fact = this.workingMemory.getFact(fact);
            this.retract(fact);
            if ("function" === typeof cb) {
                cb.call(fact, fact);
            }
            this.emit("modify", fact);
            return this.assert(fact);
        },

        print: function () {
            this.rootNode.print();
        },

        containsRule: function (name) {
            return this.rootNode.containsRule(name);
        },

        rule: function (rule) {
            this.rootNode.assertRule(rule);
        },

        match: function (cb) {
            var ret = new Promise(), flow = this, rootNode = this.rootNode;
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
                            fire();
                        }, function (e) {
                            ret.errback(e);
                        });
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

        __factHelper: function (object, assert) {
            var f = new Fact(object);
            if (assert) {
                this.__assertFact(f);
            } else {
                this.__retractFact(f);
            }
            return f;
        },

        __assertFact: function (fact) {
            var wmFact = this.workingMemory.assertFact(fact);
            if (wmFact) {
                this.rootNode.assertFact(wmFact);
            }
        },

        __retractFact: function (fact) {
            var wmFact = this.workingMemory.retractFact(fact);
            if (wmFact && this.rootNode) {
                this.rootNode.retractFact(wmFact);
            }
        }
    }
});

var flows = {};
var FlowContainer = declare({

    instance: {

        constructor: function (name, cb) {
            this.name = name;
            this.cb = cb;
            this.__rules = [];
            this.__defined = {};
            if (cb) {
                cb.call(this, this);
            }
            if (!flows.hasOwnProperty(name)) {
                flows[name] = this;
            } else {
                throw new Error("Flow with " + name + " already defined");
            }
        },

        getDefined: function (name) {
            var ret = this.__defined[name.toLowerCase()];
            if (!ret) {
                throw new Error(name + " flow class is not defined");
            }
            return ret;
        },

        addDefined: function (name, cls) {
            //normalize
            this.__defined[name.toLowerCase()] = cls;
            return cls;
        },

        rule: function () {
            this.__rules = this.__rules.concat(rule.createRule.apply(rule, arguments));
        },

        getSession: function () {
            var flow = new Flow(this.name);
            forEach(this.__rules, function (rule) {
                flow.rule(rule);
            });
            flow.assert(new InitialFact());
            for (var i = 0, l = arguments.length; i < l; i++) {
                flow.assert(arguments[i]);
            }
            return flow;
        },

        containsRule: function (name) {
            return extd.some(this.__rules, function (rule) {
                return rule.name === name;
            });
        }

    }

}).as(exports, "Flow");

function isNoolsFile(file) {
    return (/\.nools$/).test(file);
}

function parse(source) {
    var ret;
    if (isNoolsFile(source)) {
        ret = compile.parse(fs.readFileSync(source, "utf8"));
    } else {
        ret = compile.parse(source);
    }
    return ret;
}

exports.getFlow = function (name) {
    return flows[name];
};


exports.flow = function (name, cb) {
    return new FlowContainer(name, cb);
};

exports.compile = function (file, options, cb) {
    if (extd.isFunction(options)) {
        cb = options;
        options = {};
    } else {
        options = options || {};
        cb = null;
    }
    if (extd.isString(file)) {
        options.name = options.name || (isNoolsFile(file) ? path.basename(file, path.extname(file)) : null);
        file = parse(file);
    }
    if (!options.name) {
        throw new Error("Name required when compiling nools source");
    }
    return  compile.compile(file, options, cb, FlowContainer);
};

exports.parse = parse;



});

require.define("/lib/extended.js",function(require,module,exports,__dirname,__filename,process,global){module.exports = require("extended")()
    .register(require("is-extended"))
    .register(require("array-extended"))
    .register(require("date-extended"))
    .register(require("object-extended"))
    .register(require("string-extended"))
    .register(require("promise-extended"))
    .register(require("function-extended"))
    .register("HashTable", require("ht"))
    .register("declare", require("declare.js"))
    .register(require("leafy"));




});

require.define("/node_modules/extended/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {"main":"index.js"}
});

require.define("/node_modules/extended/index.js",function(require,module,exports,__dirname,__filename,process,global){(function () {
    "use strict";
    /*global extender isa, dateExtended*/

    function defineExtended(extender, require) {


        var merge = (function merger() {
            function _merge(target, source) {
                var name, s;
                for (name in source) {
                    if (source.hasOwnProperty(name)) {
                        s = source[name];
                        if (!(name in target) || (target[name] !== s)) {
                            target[name] = s;
                        }
                    }
                }
                return target;
            }

            return function merge(obj) {
                if (!obj) {
                    obj = {};
                }
                for (var i = 1, l = arguments.length; i < l; i++) {
                    _merge(obj, arguments[i]);
                }
                return obj; // Object
            };
        }());

        function getExtended() {

            var loaded = {};


            //getInitial instance;
            var extended = extender.define();
            extended.expose({
                register: function register(alias, extendWith) {
                    if (!extendWith) {
                        extendWith = alias;
                        alias = null;
                    }
                    var type = typeof extendWith;
                    if (alias) {
                        extended[alias] = extendWith;
                    } else if (extendWith && type === "function") {
                        extended.extend(extendWith);
                    } else if (type === "object") {
                        extended.expose(extendWith);
                    } else {
                        throw new TypeError("extended.register must be called with an extender function");
                    }
                    return extended;
                },

                define: function () {
                    return extender.define.apply(extender, arguments);
                }
            });

            return extended;
        }

        function extended() {
            return getExtended();
        }

        extended.define = function define() {
            return extender.define.apply(extender, arguments);
        };

        return extended;
    }

    if ("undefined" !== typeof exports) {
        if ("undefined" !== typeof module && module.exports) {
            module.exports = defineExtended(require("extender"), require);

        }
    } else if ("function" === typeof define) {
        define(["require"], function (require) {
            return defineExtended(require("extender"), require);
        });
    } else {
        this.extended = defineExtended(this.extender);
    }

}).call(this);







});

require.define("/node_modules/extended/node_modules/extender/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {"main":"index.js"}
});

require.define("/node_modules/extended/node_modules/extender/index.js",function(require,module,exports,__dirname,__filename,process,global){module.exports = require("./extender.js");
});

require.define("/node_modules/extended/node_modules/extender/extender.js",function(require,module,exports,__dirname,__filename,process,global){(function () {
    /*jshint strict:false*/


    /**
     *
     * @projectName extender
     * @github http://github.com/doug-martin/extender
     * @header
     * [![build status](https://secure.travis-ci.org/doug-martin/extender.png)](http://travis-ci.org/doug-martin/extender)
     * # Extender
     *
     * `extender` is a library that helps in making chainable APIs, by creating a function that accepts different values and returns an object decorated with functions based on the type.
     *
     * ## Why Is Extender Different?
     *
     * Extender is different than normal chaining because is does more than return `this`. It decorates your values in a type safe manner.
     *
     * For example if you return an array from a string based method then the returned value will be decorated with array methods and not the string methods. This allow you as the developer to focus on your API and not worrying about how to properly build and connect your API.
     *
     *
     * ## Installation
     *
     * ```
     * npm install extender
     * ```
     *
     * Or [download the source](https://raw.github.com/doug-martin/extender/master/extender.js) ([minified](https://raw.github.com/doug-martin/extender/master/extender-min.js))
     *
     * **Note** `extender` depends on [`declare.js`](http://doug-martin.github.com/declare.js/).
     *
     * ### Requirejs
     *
     * To use with requirejs place the `extend` source in the root scripts directory
     *
     * ```javascript
     *
     * define(["extender"], function(extender){
     * });
     *
     * ```
     *
     *
     * ## Usage
     *
     * **`extender.define(tester, decorations)`**
     *
     * To create your own extender call the `extender.define` function.
     *
     * This function accepts an optional tester which is used to determine a value should be decorated with the specified `decorations`
     *
     * ```javascript
     * function isString(obj) {
     *     return !isUndefinedOrNull(obj) && (typeof obj === "string" || obj instanceof String);
     * }
     *
     *
     * var myExtender = extender.define(isString, {
     *		multiply: function (str, times) {
     *			var ret = str;
     *			for (var i = 1; i < times; i++) {
     *				ret += str;
     *			}
     *			return ret;
     *		},
     *		toArray: function (str, delim) {
     *			delim = delim || "";
     *			return str.split(delim);
     *		}
     *	});
     *
     * myExtender("hello").multiply(2).value(); //hellohello
     *
     * ```
     *
     * If you do not specify a tester function and just pass in an object of `functions` then all values passed in will be decorated with methods.
     *
     * ```javascript
     *
     * function isUndefined(obj) {
     *     var undef;
     *     return obj === undef;
     * }
     *
     * function isUndefinedOrNull(obj) {
     *	var undef;
     *     return obj === undef || obj === null;
     * }
     *
     * function isArray(obj) {
     *     return Object.prototype.toString.call(obj) === "[object Array]";
     * }
     *
     * function isBoolean(obj) {
     *     var undef, type = typeof obj;
     *     return !isUndefinedOrNull(obj) && type === "boolean" || type === "Boolean";
     * }
     *
     * function isString(obj) {
     *     return !isUndefinedOrNull(obj) && (typeof obj === "string" || obj instanceof String);
     * }
     *
     * var myExtender = extender.define({
     *	isUndefined : isUndefined,
     *	isUndefinedOrNull : isUndefinedOrNull,
     *	isArray : isArray,
     *	isBoolean : isBoolean,
     *	isString : isString
     * });
     *
     * ```
     *
     * To use
     *
     * ```
     * var undef;
     * myExtender("hello").isUndefined().value(); //false
     * myExtender(undef).isUndefined().value(); //true
     * ```
     *
     * You can also chain extenders so that they accept multiple types and decorates accordingly.
     *
     * ```javascript
     * myExtender
     *     .define(isArray, {
     *		pluck: function (arr, m) {
     *			var ret = [];
     *			for (var i = 0, l = arr.length; i < l; i++) {
     *				ret.push(arr[i][m]);
     *			}
     *			return ret;
     *		}
     *	})
     *     .define(isBoolean, {
     *		invert: function (val) {
     *			return !val;
     *		}
     *	});
     *
     * myExtender([{a: "a"},{a: "b"},{a: "c"}]).pluck("a").value(); //["a", "b", "c"]
     * myExtender("I love javascript!").toArray(/\s+/).pluck("0"); //["I", "l", "j"]
     *
     * ```
     *
     * Notice that we reuse the same extender as defined above.
     *
     * **Return Values**
     *
     * When creating an extender if you return a value from one of the decoration functions then that value will also be decorated. If you do not return any values then the extender will be returned.
     *
     * **Default decoration methods**
     *
     * By default every value passed into an extender is decorated with the following methods.
     *
     * * `value` : The value this extender represents.
     * * `eq(otherValue)` : Tests strict equality of the currently represented value to the `otherValue`
     * * `neq(oterValue)` : Tests strict inequality of the currently represented value.
     * * `print` : logs the current value to the console.
     *
     * **Extender initialization**
     *
     * When creating an extender you can also specify a constructor which will be invoked with the current value.
     *
     * ```javascript
     * myExtender.define(isString, {
     *	constructor : function(val){
     *     //set our value to the string trimmed
     *		this._value = val.trimRight().trimLeft();
     *	}
     * });
     * ```
     *
     * **`noWrap`**
     *
     * `extender` also allows you to specify methods that should not have the value wrapped providing a cleaner exit function other than `value()`.
     *
     * For example suppose you have an API that allows you to build a validator, rather than forcing the user to invoke the `value` method you could add a method called `validator` which makes more syntactic sense.
     *
     * ```
     *
     * var myValidator = extender.define({
     *     //chainable validation methods
     *     //...
     *     //end chainable validation methods
     *
     *     noWrap : {
     *         validator : function(){
     *             //return your validator
     *         }
     *     }
     * });
     *
     * myValidator().isNotNull().isEmailAddress().validator(); //now you dont need to call .value()
     *
     *
     * ```
     * **`extender.extend(extendr)`**
     *
     * You may also compose extenders through the use of `extender.extend(extender)`, which will return an entirely new extender that is the composition of extenders.
     *
     * Suppose you have the following two extenders.
     *
     * ```javascript
     * var myExtender = extender
     *        .define({
     *            isFunction: is.function,
     *            isNumber: is.number,
     *            isString: is.string,
     *            isDate: is.date,
     *            isArray: is.array,
     *            isBoolean: is.boolean,
     *            isUndefined: is.undefined,
     *            isDefined: is.defined,
     *            isUndefinedOrNull: is.undefinedOrNull,
     *            isNull: is.null,
     *            isArguments: is.arguments,
     *            isInstanceOf: is.instanceOf,
     *            isRegExp: is.regExp
     *        });
     * var myExtender2 = extender.define(is.array, {
     *     pluck: function (arr, m) {
     *         var ret = [];
     *         for (var i = 0, l = arr.length; i < l; i++) {
     *             ret.push(arr[i][m]);
     *         }
     *         return ret;
     *     },
     *
     *     noWrap: {
     *         pluckPlain: function (arr, m) {
     *             var ret = [];
     *             for (var i = 0, l = arr.length; i < l; i++) {
     *                 ret.push(arr[i][m]);
     *             }
     *             return ret;
     *         }
     *     }
     * });
     *
     *
     * ```
     *
     * And you do not want to alter either of them but instead what to create a third that is the union of the two.
     *
     *
     * ```javascript
     * var composed = extender.extend(myExtender).extend(myExtender2);
     * ```
     * So now you can use the new extender with the joined functionality if `myExtender` and `myExtender2`.
     *
     * ```javascript
     * var extended = composed([
     *      {a: "a"},
     *      {a: "b"},
     *      {a: "c"}
     * ]);
     * extended.isArray().value(); //true
     * extended.pluck("a").value(); // ["a", "b", "c"]);
     *
     * ```
     *
     * **Note** `myExtender` and `myExtender2` will **NOT** be altered.
     *
     * **`extender.expose(methods)`**
     *
     * The `expose` method allows you to add methods to your extender that are not wrapped or automatically chained by exposing them on the extender directly.
     *
     * ```
     * var isMethods = {
     *      isFunction: is.function,
     *      isNumber: is.number,
     *      isString: is.string,
     *      isDate: is.date,
     *      isArray: is.array,
     *      isBoolean: is.boolean,
     *      isUndefined: is.undefined,
     *      isDefined: is.defined,
     *      isUndefinedOrNull: is.undefinedOrNull,
     *      isNull: is.null,
     *      isArguments: is.arguments,
     *      isInstanceOf: is.instanceOf,
     *      isRegExp: is.regExp
     * };
     *
     * var myExtender = extender.define(isMethods).expose(isMethods);
     *
     * myExtender.isArray([]); //true
     * myExtender([]).isArray([]).value(); //true
     *
     * ```
     *
     *
     * **Using `instanceof`**
     *
     * When using extenders you can test if a value is an `instanceof` of an extender by using the instanceof operator.
     *
     * ```javascript
     * var str = myExtender("hello");
     *
     * str instanceof myExtender; //true
     * ```
     *
     * ## Examples
     *
     * To see more examples click [here](https://github.com/doug-martin/extender/tree/master/examples)
     */
    function defineExtender(declare) {


        var slice = Array.prototype.slice, undef;

        function indexOf(arr, item) {
            if (arr && arr.length) {
                for (var i = 0, l = arr.length; i < l; i++) {
                    if (arr[i] === item) {
                        return i;
                    }
                }
            }
            return -1;
        }

        function isArray(obj) {
            return Object.prototype.toString.call(obj) === "[object Array]";
        }

        var merge = (function merger() {
            function _merge(target, source, exclude) {
                var name, s;
                for (name in source) {
                    if (source.hasOwnProperty(name) && indexOf(exclude, name) === -1) {
                        s = source[name];
                        if (!(name in target) || (target[name] !== s)) {
                            target[name] = s;
                        }
                    }
                }
                return target;
            }

            return function merge(obj) {
                if (!obj) {
                    obj = {};
                }
                var l = arguments.length;
                var exclude = arguments[arguments.length - 1];
                if (isArray(exclude)) {
                    l--;
                } else {
                    exclude = [];
                }
                for (var i = 1; i < l; i++) {
                    _merge(obj, arguments[i], exclude);
                }
                return obj; // Object
            };
        }());


        function extender(supers) {
            supers = supers || [];
            var Base = declare({
                instance: {
                    constructor: function (value) {
                        this._value = value;
                    },

                    value: function () {
                        return this._value;
                    },

                    eq: function eq(val) {
                        return this["__extender__"](this._value === val);
                    },

                    neq: function neq(other) {
                        return this["__extender__"](this._value !== other);
                    },
                    print: function () {
                        console.log(this._value);
                        return this;
                    }
                }
            }), defined = [];

            function addMethod(proto, name, func) {
                if ("function" !== typeof func) {
                    throw new TypeError("when extending type you must provide a function");
                }
                var extendedMethod;
                if (name === "constructor") {
                    extendedMethod = function () {
                        this._super(arguments);
                        func.apply(this, arguments);
                    };
                } else {
                    extendedMethod = function extendedMethod() {
                        var args = slice.call(arguments);
                        args.unshift(this._value);
                        var ret = func.apply(this, args);
                        return ret !== undef ? this["__extender__"](ret) : this;
                    };
                }
                proto[name] = extendedMethod;
            }

            function addNoWrapMethod(proto, name, func) {
                if ("function" !== typeof func) {
                    throw new TypeError("when extending type you must provide a function");
                }
                var extendedMethod;
                if (name === "constructor") {
                    extendedMethod = function () {
                        this._super(arguments);
                        func.apply(this, arguments);
                    };
                } else {
                    extendedMethod = function extendedMethod() {
                        var args = slice.call(arguments);
                        args.unshift(this._value);
                        return func.apply(this, args);
                    };
                }
                proto[name] = extendedMethod;
            }

            function decorateProto(proto, decoration, nowrap) {
                for (var i in decoration) {
                    if (decoration.hasOwnProperty(i)) {
                        if (i !== "getters" && i !== "setters") {
                            if (i === "noWrap") {
                                decorateProto(proto, decoration[i], true);
                            } else if (nowrap) {
                                addNoWrapMethod(proto, i, decoration[i]);
                            } else {
                                addMethod(proto, i, decoration[i]);
                            }
                        } else {
                            proto[i] = decoration[i];
                        }
                    }
                }
            }

            function _extender(obj) {
                var ret = obj, i, l;
                if (!(obj instanceof Base)) {
                    var OurBase = Base;
                    for (i = 0, l = defined.length; i < l; i++) {
                        var definer = defined[i];
                        if (definer[0](obj)) {
                            OurBase = OurBase.extend({instance: definer[1]});
                        }
                    }
                    ret = new OurBase(obj);
                    ret["__extender__"] = _extender;
                }
                return ret;
            }

            function always() {
                return true;
            }

            function define(tester, decorate) {
                if (arguments.length) {
                    if (typeof tester === "object") {
                        decorate = tester;
                        tester = always;
                    }
                    decorate = decorate || {};
                    var proto = {};
                    decorateProto(proto, decorate);
                    //handle browsers like which skip over the constructor while looping
                    if (!proto.hasOwnProperty("constructor")) {
                        if (decorate.hasOwnProperty("constructor")) {
                            addMethod(proto, "constructor", decorate.constructor);
                        } else {
                            proto.constructor = function () {
                                this._super(arguments);
                            };
                        }
                    }
                    defined.push([tester, proto]);
                }
                return _extender;
            }

            function extend(supr) {
                if (supr && supr.hasOwnProperty("__defined__")) {
                    _extender["__defined__"] = defined = defined.concat(supr["__defined__"]);
                }
                merge(_extender, supr, ["define", "extend", "expose", "__defined__"]);
                return _extender;
            }

            _extender.define = define;
            _extender.extend = extend;
            _extender.expose = function expose() {
                var methods;
                for (var i = 0, l = arguments.length; i < l; i++) {
                    methods = arguments[i];
                    if (typeof methods === "object") {
                        merge(_extender, methods, ["define", "extend", "expose", "__defined__"]);
                    }
                }
                return _extender;
            };
            _extender["__defined__"] = defined;


            return _extender;
        }

        return {
            define: function () {
                return extender().define.apply(extender, arguments);
            },

            extend: function (supr) {
                return extender().define().extend(supr);
            }
        };

    }

    if ("undefined" !== typeof exports) {
        if ("undefined" !== typeof module && module.exports) {
            module.exports = defineExtender(require("declare.js"));

        }
    } else if ("function" === typeof define) {
        define(["require"], function (require) {
            return defineExtender((require("declare.js")));
        });
    } else {
        this.extender = defineExtender(this.declare);
    }

}).call(this);
});

require.define("/node_modules/declare.js/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {"main":"index.js"}
});

require.define("/node_modules/declare.js/index.js",function(require,module,exports,__dirname,__filename,process,global){module.exports = require("./declare.js");
});

require.define("/node_modules/declare.js/declare.js",function(require,module,exports,__dirname,__filename,process,global){(function () {

    /**
     * @projectName declare
     * @github http://github.com/doug-martin/declare.js
     * @header
     *
     * Declare is a library designed to allow writing object oriented code the same way in both the browser and node.js.
     *
     * ##Installation
     *
     * `npm install declare.js`
     *
     * Or [download the source](https://raw.github.com/doug-martin/declare.js/master/declare.js) ([minified](https://raw.github.com/doug-martin/declare.js/master/declare-min.js))
     *
     * ###Requirejs
     *
     * To use with requirejs place the `declare` source in the root scripts directory
     *
     * ```
     *
     * define(["declare"], function(declare){
     *      return declare({
     *          instance : {
     *              hello : function(){
     *                  return "world";
     *              }
     *          }
     *      });
     * });
     *
     * ```
     *
     *
     * ##Usage
     *
     * declare.js provides
     *
     * Class methods
     *
     * * `as(module | object, name)` : exports the object to module or the object with the name
     * * `mixin(mixin)` : mixes in an object but does not inherit directly from the object. **Note** this does not return a new class but changes the original class.
     * * `extend(proto)` : extend a class with the given properties. A shortcut to `declare(Super, {})`;
     *
     * Instance methods
     *
     * * `_super(arguments)`: calls the super of the current method, you can pass in either the argments object or an array with arguments you want passed to super
     * * `_getSuper()`: returns a this methods direct super.
     * * `_static` : use to reference class properties and methods.
     * * `get(prop)` : gets a property invoking the getter if it exists otherwise it just returns the named property on the object.
     * * `set(prop, val)` : sets a property invoking the setter if it exists otherwise it just sets the named property on the object.
     *
     *
     * ###Declaring a new Class
     *
     * Creating a new class with declare is easy!
     *
     * ```
     *
     * var Mammal = declare({
     *      //define your instance methods and properties
     *      instance : {
     *
     *          //will be called whenever a new instance is created
     *          constructor: function(options) {
     *              options = options || {};
     *              this._super(arguments);
     *              this._type = options.type || "mammal";
     *          },
     *
     *          speak : function() {
     *              return  "A mammal of type " + this._type + " sounds like";
     *          },
     *
     *          //Define your getters
     *          getters : {
     *
     *              //can be accessed by using the get method. (mammal.get("type"))
     *              type : function() {
     *                  return this._type;
     *              }
     *          },
     *
     *           //Define your setters
     *          setters : {
     *
     *                //can be accessed by using the set method. (mammal.set("type", "mammalType"))
     *              type : function(t) {
     *                  this._type = t;
     *              }
     *          }
     *      },
     *
     *      //Define your static methods
     *      static : {
     *
     *          //Mammal.soundOff(); //"Im a mammal!!"
     *          soundOff : function() {
     *              return "Im a mammal!!";
     *          }
     *      }
     * });
     *
     *
     * ```
     *
     * You can use Mammal just like you would any other class.
     *
     * ```
     * Mammal.soundOff("Im a mammal!!");
     *
     * var myMammal = new Mammal({type : "mymammal"});
     * myMammal.speak(); // "A mammal of type mymammal sounds like"
     * myMammal.get("type"); //"mymammal"
     * myMammal.set("type", "mammal");
     * myMammal.get("type"); //"mammal"
     *
     *
     * ```
     *
     * ###Extending a class
     *
     * If you want to just extend a single class use the .extend method.
     *
     * ```
     *
     * var Wolf = Mammal.extend({
     *
     *   //define your instance method
     *   instance: {
     *
     *        //You can override super constructors just be sure to call `_super`
     *       constructor: function(options) {
     *          options = options || {};
     *          this._super(arguments); //call our super constructor.
     *          this._sound = "growl";
     *          this._color = options.color || "grey";
     *      },
     *
     *      //override Mammals `speak` method by appending our own data to it.
     *      speak : function() {
     *          return this._super(arguments) + " a " + this._sound;
     *      },
     *
     *      //add new getters for sound and color
     *      getters : {
     *
     *           //new Wolf().get("type")
     *           //notice color is read only as we did not define a setter
     *          color : function() {
     *              return this._color;
     *          },
     *
     *          //new Wolf().get("sound")
     *          sound : function() {
     *              return this._sound;
     *          }
     *      },
     *
     *      setters : {
     *
     *          //new Wolf().set("sound", "howl")
     *          sound : function(s) {
     *              this._sound = s;
     *          }
     *      }
     *
     *  },
     *
     *  static : {
     *
     *      //You can override super static methods also! And you can still use _super
     *      soundOff : function() {
     *          //You can even call super in your statics!!!
     *          //should return "I'm a mammal!! that growls"
     *          return this._super(arguments) + " that growls";
     *      }
     *  }
     * });
     *
     * Wolf.soundOff(); //Im a mammal!! that growls
     *
     * var myWolf = new Wolf();
     * myWolf instanceof Mammal //true
     * myWolf instanceof Wolf //true
     *
     * ```
     *
     * You can also extend a class by using the declare method and just pass in the super class.
     *
     * ```
     * //Typical hierarchical inheritance
     * // Mammal->Wolf->Dog
     * var Dog = declare(Wolf, {
     *    instance: {
     *        constructor: function(options) {
     *            options = options || {};
     *            this._super(arguments);
     *            //override Wolfs initialization of sound to woof.
     *            this._sound = "woof";
     *
     *        },
     *
     *        speak : function() {
     *            //Should return "A mammal of type mammal sounds like a growl thats domesticated"
     *            return this._super(arguments) + " thats domesticated";
     *        }
     *    },
     *
     *    static : {
     *        soundOff : function() {
     *            //should return "I'm a mammal!! that growls but now barks"
     *            return this._super(arguments) + " but now barks";
     *        }
     *    }
     * });
     *
     * Dog.soundOff(); //Im a mammal!! that growls but now barks
     *
     * var myDog = new Dog();
     * myDog instanceof Mammal //true
     * myDog instanceof Wolf //true
     * myDog instanceof Dog //true
     *
     *
     * //Notice you still get the extend method.
     *
     * // Mammal->Wolf->Dog->Breed
     * var Breed = Dog.extend({
     *    instance: {
     *
     *        //initialize outside of constructor
     *        _pitch : "high",
     *
     *        constructor: function(options) {
     *            options = options || {};
     *            this._super(arguments);
     *            this.breed = options.breed || "lab";
     *        },
     *
     *        speak : function() {
     *            //Should return "A mammal of type mammal sounds like a
     *            //growl thats domesticated with a high pitch!"
     *            return this._super(arguments) + " with a " + this._pitch + " pitch!";
     *        },
     *
     *        getters : {
     *            pitch : function() {
     *                return this._pitch;
     *            }
     *        }
     *    },
     *
     *    static : {
     *        soundOff : function() {
     *            //should return "I'M A MAMMAL!! THAT GROWLS BUT NOW BARKS!"
     *            return this._super(arguments).toUpperCase() + "!";
     *        }
     *    }
     * });
     *
     *
     * Breed.soundOff()//"IM A MAMMAL!! THAT GROWLS BUT NOW BARKS!"
     *
     * var myBreed = new Breed({color : "gold", type : "lab"}),
     * myBreed instanceof Dog //true
     * myBreed instanceof Wolf //true
     * myBreed instanceof Mammal //true
     * myBreed.speak() //"A mammal of type lab sounds like a woof thats domesticated with a high pitch!"
     * myBreed.get("type") //"lab"
     * myBreed.get("color") //"gold"
     * myBreed.get("sound")" //"woof"
     * ```
     *
     * ###Multiple Inheritance / Mixins
     *
     * declare also allows the use of multiple super classes.
     * This is useful if you have generic classes that provide functionality but shouldnt be used on their own.
     *
     * Lets declare a mixin that allows us to watch for property changes.
     *
     * ```
     * //Notice that we set up the functions outside of declare because we can reuse them
     *
     * function _set(prop, val) {
     *     //get the old value
     *     var oldVal = this.get(prop);
     *     //call super to actually set the property
     *     var ret = this._super(arguments);
     *     //call our handlers
     *     this.__callHandlers(prop, oldVal, val);
     *     return ret;
     * }
     *
     * function _callHandlers(prop, oldVal, newVal) {
     *    //get our handlers for the property
     *     var handlers = this.__watchers[prop], l;
     *     //if the handlers exist and their length does not equal 0 then we call loop through them
     *     if (handlers && (l = handlers.length) !== 0) {
     *         for (var i = 0; i < l; i++) {
     *             //call the handler
     *             handlers[i].call(null, prop, oldVal, newVal);
     *         }
     *     }
     * }
     *
     *
     * //the watch function
     * function _watch(prop, handler) {
     *     if ("function" !== typeof handler) {
     *         //if its not a function then its an invalid handler
     *         throw new TypeError("Invalid handler.");
     *     }
     *     if (!this.__watchers[prop]) {
     *         //create the watchers if it doesnt exist
     *         this.__watchers[prop] = [handler];
     *     } else {
     *         //otherwise just add it to the handlers array
     *         this.__watchers[prop].push(handler);
     *     }
     * }
     *
     * function _unwatch(prop, handler) {
     *     if ("function" !== typeof handler) {
     *         throw new TypeError("Invalid handler.");
     *     }
     *     var handlers = this.__watchers[prop], index;
     *     if (handlers && (index = handlers.indexOf(handler)) !== -1) {
     *        //remove the handler if it is found
     *         handlers.splice(index, 1);
     *     }
     * }
     *
     * declare({
     *     instance:{
     *         constructor:function () {
     *             this._super(arguments);
     *             //set up our watchers
     *             this.__watchers = {};
     *         },
     *
     *         //override the default set function so we can watch values
     *         "set":_set,
     *         //set up our callhandlers function
     *         __callHandlers:_callHandlers,
     *         //add the watch function
     *         watch:_watch,
     *         //add the unwatch function
     *         unwatch:_unwatch
     *     },
     *
     *     "static":{
     *
     *         init:function () {
     *             this._super(arguments);
     *             this.__watchers = {};
     *         },
     *         //override the default set function so we can watch values
     *         "set":_set,
     *         //set our callHandlers function
     *         __callHandlers:_callHandlers,
     *         //add the watch
     *         watch:_watch,
     *         //add the unwatch function
     *         unwatch:_unwatch
     *     }
     * })
     *
     * ```
     *
     * Now lets use the mixin
     *
     * ```
     * var WatchDog = declare([Dog, WatchMixin]);
     *
     * var watchDog = new WatchDog();
     * //create our handler
     * function watch(id, oldVal, newVal) {
     *     console.log("watchdog's %s was %s, now %s", id, oldVal, newVal);
     * }
     *
     * //watch for property changes
     * watchDog.watch("type", watch);
     * watchDog.watch("color", watch);
     * watchDog.watch("sound", watch);
     *
     * //now set the properties each handler will be called
     * watchDog.set("type", "newDog");
     * watchDog.set("color", "newColor");
     * watchDog.set("sound", "newSound");
     *
     *
     * //unwatch the property changes
     * watchDog.unwatch("type", watch);
     * watchDog.unwatch("color", watch);
     * watchDog.unwatch("sound", watch);
     *
     * //no handlers will be called this time
     * watchDog.set("type", "newDog");
     * watchDog.set("color", "newColor");
     * watchDog.set("sound", "newSound");
     *
     *
     * ```
     *
     * ###Accessing static methods and properties witin an instance.
     *
     * To access static properties on an instance use the `_static` property which is a reference to your constructor.
     *
     * For example if your in your constructor and you want to have configurable default values.
     *
     * ```
     * consturctor : function constructor(opts){
     *     this.opts = opts || {};
     *     this._type = opts.type || this._static.DEFAULT_TYPE;
     * }
     * ```
     *
     *
     *
     * ###Creating a new instance of within an instance.
     *
     * Often times you want to create a new instance of an object within an instance. If your subclassed however you cannot return a new instance of the parent class as it will not be the right sub class. `declare` provides a way around this by setting the `_static` property on each isntance of the class.
     *
     * Lets add a reproduce method `Mammal`
     *
     * ```
     * reproduce : function(options){
     *     return new this._static(options);
     * }
     * ```
     *
     * Now in each subclass you can call reproduce and get the proper type.
     *
     * ```
     * var myDog = new Dog();
     * var myDogsChild = myDog.reproduce();
     *
     * myDogsChild instanceof Dog; //true
     * ```
     *
     * ###Using the `as`
     *
     * `declare` also provides an `as` method which allows you to add your class to an object or if your using node.js you can pass in `module` and the class will be exported as the module.
     *
     * ```
     * var animals = {};
     *
     * Mammal.as(animals, "Dog");
     * Wolf.as(animals, "Wolf");
     * Dog.as(animals, "Dog");
     * Breed.as(animals, "Breed");
     *
     * var myDog = new animals.Dog();
     *
     * ```
     *
     * Or in node
     *
     * ```
     * Mammal.as(exports, "Dog");
     * Wolf.as(exports, "Wolf");
     * Dog.as(exports, "Dog");
     * Breed.as(exports, "Breed");
     *
     * ```
     *
     * To export a class as the `module` in node
     *
     * ```
     * Mammal.as(module);
     * ```
     *
     *
     */
    function createDeclared() {
        var arraySlice = Array.prototype.slice, classCounter = 0, Base, forceNew = new Function();

        function argsToArray(args, slice) {
            slice = slice || 0;
            return arraySlice.call(args, slice);
        }

        function isArray(obj) {
            return Object.prototype.toString.call(obj) === "[object Array]";
        }

        function isObject(obj) {
            var undef;
            return obj !== null && obj !== undef && typeof obj === "object";
        }

        function isHash(obj) {
            var ret = isObject(obj);
            return ret && obj.constructor === Object;
        }

        var isArguments = function _isArguments(object) {
            return Object.prototype.toString.call(object) === '[object Arguments]';
        };

        if (!isArguments(arguments)) {
            isArguments = function _isArguments(obj) {
                return !!(obj && obj.hasOwnProperty("callee"));
            };
        }

        function indexOf(arr, item) {
            if (arr && arr.length) {
                for (var i = 0, l = arr.length; i < l; i++) {
                    if (arr[i] === item) {
                        return i;
                    }
                }
            }
            return -1;
        }

        function merge(target, source, exclude) {
            var name, s;
            for (name in source) {
                if (source.hasOwnProperty(name) && indexOf(exclude, name) === -1) {
                    s = source[name];
                    if (!(name in target) || (target[name] !== s)) {
                        target[name] = s;
                    }
                }
            }
            return target;
        }

        function callSuper(args, a) {
            var meta = this.__meta,
                supers = meta.supers,
                l = supers.length, superMeta = meta.superMeta, pos = superMeta.pos;
            if (l > pos) {
                args = !args ? [] : (!isArguments(args) && !isArray(args)) ? [args] : args;
                var name = superMeta.name, f = superMeta.f, m;
                do {
                    m = supers[pos][name];
                    if ("function" === typeof m && (m = m._f || m) !== f) {
                        superMeta.pos = 1 + pos;
                        return m.apply(this, args);
                    }
                } while (l > ++pos);
            }

            return null;
        }

        function getSuper() {
            var meta = this.__meta,
                supers = meta.supers,
                l = supers.length, superMeta = meta.superMeta, pos = superMeta.pos;
            if (l > pos) {
                var name = superMeta.name, f = superMeta.f, m;
                do {
                    m = supers[pos][name];
                    if ("function" === typeof m && (m = m._f || m) !== f) {
                        superMeta.pos = 1 + pos;
                        return m.bind(this);
                    }
                } while (l > ++pos);
            }
            return null;
        }

        function getter(name) {
            var getters = this.__getters__;
            if (getters.hasOwnProperty(name)) {
                return getters[name].apply(this);
            } else {
                return this[name];
            }
        }

        function setter(name, val) {
            var setters = this.__setters__;
            if (isHash(name)) {
                for (var i in name) {
                    var prop = name[i];
                    if (setters.hasOwnProperty(i)) {
                        setters[name].call(this, prop);
                    } else {
                        this[i] = prop;
                    }
                }
            } else {
                if (setters.hasOwnProperty(name)) {
                    return setters[name].apply(this, argsToArray(arguments, 1));
                } else {
                    return this[name] = val;
                }
            }
        }


        function defaultFunction() {
            var meta = this.__meta || {},
                supers = meta.supers,
                l = supers.length, superMeta = meta.superMeta, pos = superMeta.pos;
            if (l > pos) {
                var name = superMeta.name, f = superMeta.f, m;
                do {
                    m = supers[pos][name];
                    if ("function" === typeof m && (m = m._f || m) !== f) {
                        superMeta.pos = 1 + pos;
                        return m.apply(this, arguments);
                    }
                } while (l > ++pos);
            }
            return null;
        }


        function functionWrapper(f, name) {
            var wrapper = function wrapper() {
                var ret, meta = this.__meta || {};
                var orig = meta.superMeta;
                meta.superMeta = {f: f, pos: 0, name: name};
                ret = f.apply(this, arguments);
                meta.superMeta = orig;
                return ret;
            };
            wrapper._f = f;
            return wrapper;
        }

        function defineMixinProps(child, proto) {

            var operations = proto.setters || {}, __setters = child.__setters__, __getters = child.__getters__;
            for (var i in operations) {
                if (!__setters.hasOwnProperty(i)) {  //make sure that the setter isnt already there
                    __setters[i] = operations[i];
                }
            }
            operations = proto.getters || {};
            for (i in operations) {
                if (!__getters.hasOwnProperty(i)) {  //make sure that the setter isnt already there
                    __getters[i] = operations[i];
                }
            }
            for (var j in proto) {
                if (j !== "getters" && j !== "setters") {
                    var p = proto[j];
                    if ("function" === typeof p) {
                        if (!child.hasOwnProperty(j)) {
                            child[j] = functionWrapper(defaultFunction, j);
                        }
                    } else {
                        child[j] = p;
                    }
                }
            }
        }

        function mixin() {
            var args = argsToArray(arguments), l = args.length;
            var child = this.prototype;
            var childMeta = child.__meta, thisMeta = this.__meta, bases = child.__meta.bases, staticBases = bases.slice(),
                staticSupers = thisMeta.supers || [], supers = childMeta.supers || [];
            for (var i = 0; i < l; i++) {
                var m = args[i], mProto = m.prototype;
                var protoMeta = mProto.__meta, meta = m.__meta;
                !protoMeta && (protoMeta = (mProto.__meta = {proto: mProto || {}}));
                !meta && (meta = (m.__meta = {proto: m.__proto__ || {}}));
                defineMixinProps(child, protoMeta.proto || {});
                defineMixinProps(this, meta.proto || {});
                //copy the bases for static,

                mixinSupers(m.prototype, supers, bases);
                mixinSupers(m, staticSupers, staticBases);
            }
            return this;
        }

        function mixinSupers(sup, arr, bases) {
            var meta = sup.__meta;
            !meta && (meta = (sup.__meta = {}));
            var unique = sup.__meta.unique;
            !unique && (meta.unique = "declare" + ++classCounter);
            //check it we already have this super mixed into our prototype chain
            //if true then we have already looped their supers!
            if (indexOf(bases, unique) === -1) {
                //add their id to our bases
                bases.push(unique);
                var supers = sup.__meta.supers || [], i = supers.length - 1 || 0;
                while (i >= 0) {
                    mixinSupers(supers[i--], arr, bases);
                }
                arr.unshift(sup);
            }
        }

        function defineProps(child, proto) {
            var operations = proto.setters,
                __setters = child.__setters__,
                __getters = child.__getters__;
            if (operations) {
                for (var i in operations) {
                    __setters[i] = operations[i];
                }
            }
            operations = proto.getters || {};
            if (operations) {
                for (i in operations) {
                    __getters[i] = operations[i];
                }
            }
            for (i in proto) {
                if (i != "getters" && i != "setters") {
                    var f = proto[i];
                    if ("function" === typeof f) {
                        var meta = f.__meta || {};
                        if (!meta.isConstructor) {
                            child[i] = functionWrapper(f, i);
                        } else {
                            child[i] = f;
                        }
                    } else {
                        child[i] = f;
                    }
                }
            }

        }

        function _export(obj, name) {
            if (obj && name) {
                obj[name] = this;
            } else {
                obj.exports = obj = this;
            }
            return this;
        }

        function extend(proto) {
            return declare(this, proto);
        }

        function getNew(ctor) {
            // create object with correct prototype using a do-nothing
            // constructor
            forceNew.prototype = ctor.prototype;
            var t = new forceNew();
            forceNew.prototype = null;	// clean up
            return t;
        }


        function __declare(child, sup, proto) {
            var childProto = {}, supers = [];
            var unique = "declare" + ++classCounter, bases = [], staticBases = [];
            var instanceSupers = [], staticSupers = [];
            var meta = {
                supers: instanceSupers,
                unique: unique,
                bases: bases,
                superMeta: {
                    f: null,
                    pos: 0,
                    name: null
                }
            };
            var childMeta = {
                supers: staticSupers,
                unique: unique,
                bases: staticBases,
                isConstructor: true,
                superMeta: {
                    f: null,
                    pos: 0,
                    name: null
                }
            };

            if (isHash(sup) && !proto) {
                proto = sup;
                sup = Base;
            }

            if ("function" === typeof sup || isArray(sup)) {
                supers = isArray(sup) ? sup : [sup];
                sup = supers.shift();
                child.__meta = childMeta;
                childProto = getNew(sup);
                childProto.__meta = meta;
                childProto.__getters__ = merge({}, childProto.__getters__ || {});
                childProto.__setters__ = merge({}, childProto.__setters__ || {});
                child.__getters__ = merge({}, child.__getters__ || {});
                child.__setters__ = merge({}, child.__setters__ || {});
                mixinSupers(sup.prototype, instanceSupers, bases);
                mixinSupers(sup, staticSupers, staticBases);
            } else {
                child.__meta = childMeta;
                childProto.__meta = meta;
                childProto.__getters__ = childProto.__getters__ || {};
                childProto.__setters__ = childProto.__setters__ || {};
                child.__getters__ = child.__getters__ || {};
                child.__setters__ = child.__setters__ || {};
            }
            child.prototype = childProto;
            if (proto) {
                var instance = meta.proto = proto.instance || {};
                var stat = childMeta.proto = proto.static || {};
                stat.init = stat.init || defaultFunction;
                defineProps(childProto, instance);
                defineProps(child, stat);
                if (!instance.hasOwnProperty("constructor")) {
                    childProto.constructor = instance.constructor = functionWrapper(defaultFunction, "constructor");
                } else {
                    childProto.constructor = functionWrapper(instance.constructor, "constructor");
                }
            } else {
                meta.proto = {};
                childMeta.proto = {};
                child.init = functionWrapper(defaultFunction, "init");
                childProto.constructor = functionWrapper(defaultFunction, "constructor");
            }
            if (supers.length) {
                mixin.apply(child, supers);
            }
            if (sup) {
                //do this so we mixin our super methods directly but do not ov
                merge(child, merge(merge({}, sup), child));
            }
            childProto._super = child._super = callSuper;
            childProto._getSuper = child._getSuper = getSuper;
            childProto._static = child;
        }

        function declare(sup, proto) {
            function declared() {
                this.constructor.apply(this, arguments);
            }

            __declare(declared, sup, proto);
            return declared.init() || declared;
        }

        function singleton(sup, proto) {
            var retInstance;

            function declaredSingleton() {
                if (!retInstance) {
                    this.constructor.apply(this, arguments);
                    retInstance = this;
                }
                return retInstance;
            }

            __declare(declaredSingleton, sup, proto);
            return  declaredSingleton.init() || declaredSingleton;
        }

        Base = declare({
            instance: {
                "get": getter,
                "set": setter
            },

            "static": {
                "get": getter,
                "set": setter,
                mixin: mixin,
                extend: extend,
                as: _export
            }
        });

        declare.singleton = singleton;
        return declare;
    }

    if ("undefined" !== typeof exports) {
        if ("undefined" !== typeof module && module.exports) {
            module.exports = createDeclared();
        }
    } else if ("function" === typeof define) {
        define(createDeclared);
    } else {
        this.declare = createDeclared();
    }
}());




});

require.define("/node_modules/is-extended/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {"main":"index.js"}
});

require.define("/node_modules/is-extended/index.js",function(require,module,exports,__dirname,__filename,process,global){(function () {
    "use strict";

    function defineIsa(extended) {

        var undef, pSlice = Array.prototype.slice;

        function argsToArray(args, slice) {
            slice = slice || 0;
            return pSlice.call(args, slice);
        }

        function keys(obj) {
            var ret = [];
            for (var i in obj) {
                if (obj.hasOwnProperty(i)) {
                    ret.push(i);
                }
            }
            return ret;
        }

        //taken from node js assert.js
        //https://github.com/joyent/node/blob/master/lib/assert.js
        function deepEqual(actual, expected) {
            // 7.1. All identical values are equivalent, as determined by ===.
            if (actual === expected) {
                return true;

            } else if (typeof Buffer !== "undefined" && Buffer.isBuffer(actual) && Buffer.isBuffer(expected)) {
                if (actual.length !== expected.length) {
                    return false;
                }

                for (var i = 0; i < actual.length; i++) {
                    if (actual[i] !== expected[i]) {
                        return false;
                    }
                }

                return true;

                // 7.2. If the expected value is a Date object, the actual value is
                // equivalent if it is also a Date object that refers to the same time.
            } else if (actual instanceof Date && expected instanceof Date) {
                return actual.getTime() === expected.getTime();

                // 7.3 If the expected value is a RegExp object, the actual value is
                // equivalent if it is also a RegExp object with the same source and
                // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
            } else if (actual instanceof RegExp && expected instanceof RegExp) {
                return actual.source === expected.source &&
                    actual.global === expected.global &&
                    actual.multiline === expected.multiline &&
                    actual.lastIndex === expected.lastIndex &&
                    actual.ignoreCase === expected.ignoreCase;

                // 7.4. Other pairs that do not both pass typeof value == 'object',
                // equivalence is determined by ==.
            } else if (isString(actual) && isString(expected) && actual !== expected) {
                return false;
            } else if (typeof actual !== 'object' && typeof expected !== 'object') {
                return actual === expected;

                // 7.5 For all other Object pairs, including Array objects, equivalence is
                // determined by having the same number of owned properties (as verified
                // with Object.prototype.hasOwnProperty.call), the same set of keys
                // (although not necessarily the same order), equivalent values for every
                // corresponding key, and an identical 'prototype' property. Note: this
                // accounts for both named and indexed properties on Arrays.
            } else {
                return objEquiv(actual, expected);
            }
        }


        function objEquiv(a, b) {
            var key;
            if (isUndefinedOrNull(a) || isUndefinedOrNull(b)) {
                return false;
            }
            // an identical 'prototype' property.
            if (a.prototype !== b.prototype) {
                return false;
            }
            //~~~I've managed to break Object.keys through screwy arguments passing.
            //   Converting to array solves the problem.
            if (isArguments(a)) {
                if (!isArguments(b)) {
                    return false;
                }
                a = pSlice.call(a);
                b = pSlice.call(b);
                return deepEqual(a, b);
            }
            try {
                var ka = keys(a),
                    kb = keys(b),
                    i;
                // having the same number of owned properties (keys incorporates
                // hasOwnProperty)
                if (ka.length !== kb.length) {
                    return false;
                }
                //the same set of keys (although not necessarily the same order),
                ka.sort();
                kb.sort();
                //~~~cheap key test
                for (i = ka.length - 1; i >= 0; i--) {
                    if (ka[i] !== kb[i]) {
                        return false;
                    }
                }
                //equivalent values for every corresponding key, and
                //~~~possibly expensive deep test
                for (i = ka.length - 1; i >= 0; i--) {
                    key = ka[i];
                    if (!deepEqual(a[key], b[key])) {
                        return false;
                    }
                }
            } catch (e) {//happens when one is a string literal and the other isn't
                return false;
            }
            return true;
        }

        function isFunction(obj) {
            return typeof obj === "function";
        }

        function isObject(obj) {
            var undef;
            return obj !== null && obj !== undef && typeof obj === "object";
        }

        function isHash(obj) {
            var ret = isObject(obj);
            return ret && obj.constructor === Object;
        }

        function isEmpty(object) {
            if (isObject(object)) {
                for (var i in object) {
                    if (object.hasOwnProperty(i)) {
                        return false;
                    }
                }
            } else if (isString(object) && object === "") {
                return true;
            }
            return true;
        }

        function isBoolean(obj) {
            return Object.prototype.toString.call(obj) === "[object Boolean]";
        }

        function isUndefined(obj) {
            return obj !== null && obj === undef;
        }

        function isDefined(obj) {
            return !isUndefined(obj);
        }

        function isUndefinedOrNull(obj) {
            return isUndefined(obj) || isNull(obj);
        }

        function isNull(obj) {
            return obj !== undef && obj === null;
        }


        var isArguments = function _isArguments(object) {
            return !isUndefinedOrNull(object) && Object.prototype.toString.call(object) === '[object Arguments]';
        };

        if (!isArguments(arguments)) {
            isArguments = function _isArguments(obj) {
                return !!(obj && obj.hasOwnProperty("callee"));
            };
        }


        function isInstanceOf(obj, clazz) {
            if (isFunction(clazz)) {
                return obj instanceof clazz;
            } else {
                return false;
            }
        }

        function isRegExp(obj) {
            return !isUndefinedOrNull(obj) && (obj instanceof RegExp);
        }

        function isArray(obj) {
            return Object.prototype.toString.call(obj) === "[object Array]";
        }

        function isDate(obj) {
            return (!isUndefinedOrNull(obj) && typeof obj === "object" && obj instanceof Date);
        }

        function isString(obj) {
            return !isUndefinedOrNull(obj) && (typeof obj === "string" || obj instanceof String);
        }

        function isNumber(obj) {
            return !isUndefinedOrNull(obj) && (typeof obj === "number" || obj instanceof Number);
        }

        function isTrue(obj) {
            return obj === true;
        }

        function isFalse(obj) {
            return obj === false;
        }

        function isNotNull(obj) {
            return !isNull(obj);
        }

        function isEq(obj, obj2) {
            return obj == obj2;
        }

        function isNeq(obj, obj2) {
            /*jshint eqeqeq:false*/
            return obj != obj2;
        }

        function isSeq(obj, obj2) {
            return obj === obj2;
        }

        function isSneq(obj, obj2) {
            return obj !== obj2;
        }

        function isIn(obj, arr) {
            if (isArray(arr)) {
                for (var i = 0, l = arr.length; i < l; i++) {
                    if (isEq(obj, arr[i])) {
                        return true;
                    }
                }
            }
            return false;
        }

        function isNotIn(obj, arr) {
            return !isIn(obj, arr);
        }

        function isLt(obj, obj2) {
            return obj < obj2;
        }

        function isLte(obj, obj2) {
            return obj <= obj2;
        }

        function isGt(obj, obj2) {
            return obj > obj2;
        }

        function isGte(obj, obj2) {
            return obj >= obj2;
        }

        function isLike(obj, reg) {
            if (isString(reg)) {
                reg = new RegExp(reg);
            }
            if (isRegExp(reg)) {
                return reg.test("" + obj);
            }
            return false;
        }

        function isNotLike(obj, reg) {
            return !isLike(obj, reg);
        }

        function contains(arr, obj) {
            return isIn(obj, arr);
        }

        function notContains(arr, obj) {
            return !isIn(obj, arr);
        }

        var isa = {
            isFunction: isFunction,
            isObject: isObject,
            isEmpty: isEmpty,
            isHash: isHash,
            isNumber: isNumber,
            isString: isString,
            isDate: isDate,
            isArray: isArray,
            isBoolean: isBoolean,
            isUndefined: isUndefined,
            isDefined: isDefined,
            isUndefinedOrNull: isUndefinedOrNull,
            isNull: isNull,
            isArguments: isArguments,
            instanceOf: isInstanceOf,
            isRegExp: isRegExp,
            deepEqual: deepEqual,
            isTrue: isTrue,
            isFalse: isFalse,
            isNotNull: isNotNull,
            isEq: isEq,
            isNeq: isNeq,
            isSeq: isSeq,
            isSneq: isSneq,
            isIn: isIn,
            isNotIn: isNotIn,
            isLt: isLt,
            isLte: isLte,
            isGt: isGt,
            isGte: isGte,
            isLike: isLike,
            isNotLike: isNotLike,
            contains: contains,
            notContains: notContains
        };

        var tester = {
            constructor: function () {
                this._testers = [];
            },

            noWrap: {
                tester: function () {
                    var testers = this._testers;
                    return function tester(value) {
                        var isa = false;
                        for (var i = 0, l = testers.length; i < l && !isa; i++) {
                            isa = testers[i](value);
                        }
                        return isa;
                    };
                }
            }
        };

        var switcher = {
            constructor: function () {
                this._cases = [];
                this.__default = null;
            },

            def: function (val, fn) {
                this.__default = fn;
            },

            noWrap: {
                switcher: function () {
                    var testers = this._cases, __default = this.__default;
                    return function tester() {
                        var handled = false, args = argsToArray(arguments), caseRet;
                        for (var i = 0, l = testers.length; i < l && !handled; i++) {
                            caseRet = testers[i](args);
                            if (caseRet.length > 1) {
                                if (caseRet[1] || caseRet[0]) {
                                    return caseRet[1];
                                }
                            }
                        }
                        if (!handled && __default) {
                            return  __default.apply(this, args);
                        }
                    };
                }
            }
        };

        function addToTester(func) {
            tester[func] = function isaTester() {
                this._testers.push(isa[func]);
            };
        }

        function addToSwitcher(func) {
            switcher[func] = function isaTester() {
                var args = argsToArray(arguments, 1), isFunc = isa[func], handler, doBreak = true;
                if (args.length <= isFunc.length - 1) {
                    throw new TypeError("A handler must be defined when calling using switch");
                } else {
                    handler = args.pop();
                    if (isBoolean(handler)) {
                        doBreak = handler;
                        handler = args.pop();
                    }
                }
                if (!isFunction(handler)) {
                    throw new TypeError("handler must be defined");
                }
                this._cases.push(function (testArgs) {
                    if (isFunc.apply(isa, testArgs.concat(args))) {
                        return [doBreak, handler.apply(this, testArgs)];
                    }
                    return [false];
                });
            };
        }

        for (var i in isa) {
            if (isa.hasOwnProperty(i)) {
                addToSwitcher(i);
                addToTester(i);
            }
        }

        var is = extended.define(isa).expose(isa);
        is.tester = extended.define(tester);
        is.switcher = extended.define(switcher);
        return is;

    }

    if ("undefined" !== typeof exports) {
        if ("undefined" !== typeof module && module.exports) {
            module.exports = defineIsa(require("extended"));

        }
    } else if ("function" === typeof define) {
        define(["require"], function (require) {
            return defineIsa((require("extended")));
        });
    } else {
        this.is = defineIsa(this.extended);
    }

}).call(this);
});

require.define("/node_modules/array-extended/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {"main":"index.js"}
});

require.define("/node_modules/array-extended/index.js",function(require,module,exports,__dirname,__filename,process,global){(function () {
    "use strict";

    var arraySlice = Array.prototype.slice;

    function argsToArray(args, slice) {
        slice = slice || 0;
        return arraySlice.call(args, slice);
    }

    function defineArray(extended, is) {

        var isString = is.isString,
            isArray = is.isArray,
            isDate = is.isDate,
            floor = Math.floor,
            abs = Math.abs,
            mathMax = Math.max,
            mathMin = Math.min;


        function cross(num, cros) {
            return reduceRight(cros, function (a, b) {
                if (!isArray(b)) {
                    b = [b];
                }
                b.unshift(num);
                a.unshift(b);
                return a;
            }, []);
        }

        function permute(num, cross, length) {
            var ret = [];
            for (var i = 0; i < cross.length; i++) {
                ret.push([num].concat(rotate(cross, i)).slice(0, length));
            }
            return ret;
        }


        function intersection(a, b) {
            var ret = [], aOne;
            if (isArray(a) && isArray(b) && a.length && b.length) {
                for (var i = 0, l = a.length; i < l; i++) {
                    aOne = a[i];
                    if (indexOf(b, aOne) !== -1) {
                        ret.push(aOne);
                    }
                }
            }
            return ret;
        }


        var _sort = (function () {

            var isAll = function (arr, test) {
                return every(arr, test);
            };

            var defaultCmp = function (a, b) {
                return a - b;
            };

            var dateSort = function (a, b) {
                return a.getTime() - b.getTime();
            };

            return function _sort(arr, property) {
                var ret = [];
                if (isArray(arr)) {
                    ret = arr.slice();
                    if (property) {
                        if (typeof property === "function") {
                            ret.sort(property);
                        } else {
                            ret.sort(function (a, b) {
                                var aProp = a[property], bProp = b[property];
                                if (isString(aProp) && isString(bProp)) {
                                    return aProp > bProp ? 1 : aProp < bProp ? -1 : 0;
                                } else if (isDate(aProp) && isDate(bProp)) {
                                    return aProp.getTime() - bProp.getTime();
                                } else {
                                    return aProp - bProp;
                                }
                            });
                        }
                    } else {
                        if (isAll(ret, isString)) {
                            ret.sort();
                        } else if (isAll(ret, isDate)) {
                            ret.sort(dateSort);
                        } else {
                            ret.sort(defaultCmp);
                        }
                    }
                }
                return ret;
            };

        })();

        function indexOf(arr, searchElement) {
            if (!isArray(arr)) {
                throw new TypeError();
            }
            var t = Object(arr);
            var len = t.length >>> 0;
            if (len === 0) {
                return -1;
            }
            var n = 0;
            if (arguments.length > 2) {
                n = Number(arguments[2]);
                if (n !== n) { // shortcut for verifying if it's NaN
                    n = 0;
                } else if (n !== 0 && n !== Infinity && n !== -Infinity) {
                    n = (n > 0 || -1) * floor(abs(n));
                }
            }
            if (n >= len) {
                return -1;
            }
            var k = n >= 0 ? n : mathMax(len - abs(n), 0);
            for (; k < len; k++) {
                if (k in t && t[k] === searchElement) {
                    return k;
                }
            }
            return -1;
        }

        function lastIndexOf(arr, searchElement) {
            if (!isArray(arr)) {
                throw new TypeError();
            }

            var t = Object(arr);
            var len = t.length >>> 0;
            if (len === 0) {
                return -1;
            }

            var n = len;
            if (arguments.length > 2) {
                n = Number(arguments[2]);
                if (n !== n) {
                    n = 0;
                } else if (n !== 0 && n !== (1 / 0) && n !== -(1 / 0)) {
                    n = (n > 0 || -1) * floor(abs(n));
                }
            }

            var k = n >= 0 ? mathMin(n, len - 1) : len - abs(n);

            for (; k >= 0; k--) {
                if (k in t && t[k] === searchElement) {
                    return k;
                }
            }
            return -1;
        }

        function filter(arr, iterator, scope) {
            if (!isArray(arr) || typeof iterator !== "function") {
                throw new TypeError();
            }

            var t = Object(arr);
            var len = t.length >>> 0;
            var res = [];
            for (var i = 0; i < len; i++) {
                if (i in t) {
                    var val = t[i]; // in case fun mutates this
                    if (iterator.call(scope, val, i, t)) {
                        res.push(val);
                    }
                }
            }
            return res;
        }

        function forEach(arr, iterator, scope) {
            if (!isArray(arr) || typeof iterator !== "function") {
                throw new TypeError();
            }
            for (var i = 0, len = arr.length; i < len; ++i) {
                iterator.call(scope || arr, arr[i], i, arr);
            }
            return arr;
        }

        function every(arr, iterator, scope) {
            if (!isArray(arr) || typeof iterator !== "function") {
                throw new TypeError();
            }
            var t = Object(arr);
            var len = t.length >>> 0;
            for (var i = 0; i < len; i++) {
                if (i in t && !iterator.call(scope, t[i], i, t)) {
                    return false;
                }
            }
            return true;
        }

        function some(arr, iterator, scope) {
            if (!isArray(arr) || typeof iterator !== "function") {
                throw new TypeError();
            }
            var t = Object(arr);
            var len = t.length >>> 0;
            for (var i = 0; i < len; i++) {
                if (i in t && iterator.call(scope, t[i], i, t)) {
                    return true;
                }
            }
            return false;
        }

        function map(arr, iterator, scope) {
            if (!isArray(arr) || typeof iterator !== "function") {
                throw new TypeError();
            }

            var t = Object(arr);
            var len = t.length >>> 0;
            var res = [];
            for (var i = 0; i < len; i++) {
                if (i in t) {
                    res.push(iterator.call(scope, t[i], i, t));
                }
            }
            return res;
        }

        function reduce(arr, accumulator, curr) {
            if (!isArray(arr) || typeof accumulator !== "function") {
                throw new TypeError();
            }
            var i = 0, l = arr.length >> 0;
            if (arguments.length < 3) {
                if (l === 0) {
                    throw new TypeError("Array length is 0 and no second argument");
                }
                curr = arr[0];
                i = 1; // start accumulating at the second element
            } else {
                curr = arguments[2];
            }
            while (i < l) {
                if (i in arr) {
                    curr = accumulator.call(undefined, curr, arr[i], i, arr);
                }
                ++i;
            }
            return curr;
        }

        function reduceRight(arr, accumulator, curr) {
            if (!isArray(arr) || typeof accumulator !== "function") {
                throw new TypeError();
            }

            var t = Object(arr);
            var len = t.length >>> 0;

            // no value to return if no initial value, empty array
            if (len === 0 && arguments.length === 2) {
                throw new TypeError();
            }

            var k = len - 1;
            if (arguments.length >= 3) {
                curr = arguments[2];
            } else {
                do {
                    if (k in arr) {
                        curr = arr[k--];
                        break;
                    }
                }
                while (true);
            }
            while (k >= 0) {
                if (k in t) {
                    curr = accumulator.call(undefined, curr, t[k], k, t);
                }
                k--;
            }
            return curr;
        }


        function toArray(o) {
            var ret = [];
            if (o !== null) {
                var args = argsToArray(arguments);
                if (args.length === 1) {
                    if (isArray(o)) {
                        ret = o;
                    } else if (is.isHash(o)) {
                        for (var i in o) {
                            if (o.hasOwnProperty(i)) {
                                ret.push([i, o[i]]);
                            }
                        }
                    } else {
                        ret.push(o);
                    }
                } else {
                    forEach(args, function (a) {
                        ret = ret.concat(toArray(a));
                    });
                }
            }
            return ret;
        }

        function sum(array) {
            array = array || [];
            if (array.length) {
                return reduce(array, function (a, b) {
                    return a + b;
                });
            } else {
                return 0;
            }
        }

        function avg(arr) {
            arr = arr || [];
            if (arr.length) {
                var total = sum(arr);
                if (is.isNumber(total)) {
                    return  total / arr.length;
                } else {
                    throw new Error("Cannot average an array of non numbers.");
                }
            } else {
                return 0;
            }
        }

        function sort(arr, cmp) {
            return _sort(arr, cmp);
        }

        function min(arr, cmp) {
            return _sort(arr, cmp)[0];
        }

        function max(arr, cmp) {
            return _sort(arr, cmp)[arr.length - 1];
        }

        function difference(arr1) {
            var ret = arr1, args = flatten(argsToArray(arguments, 1));
            if (isArray(arr1)) {
                ret = filter(arr1, function (a) {
                    return indexOf(args, a) === -1;
                });
            }
            return ret;
        }

        function removeDuplicates(arr) {
            var ret = arr;
            if (isArray(arr)) {
                ret = reduce(arr, function (a, b) {
                    if (indexOf(a, b) === -1) {
                        return a.concat(b);
                    } else {
                        return a;
                    }
                }, []);
            }
            return ret;
        }


        function unique(arr) {
            return removeDuplicates(arr);
        }


        function rotate(arr, numberOfTimes) {
            var ret = arr.slice();
            if (typeof numberOfTimes !== "number") {
                numberOfTimes = 1;
            }
            if (numberOfTimes && isArray(arr)) {
                if (numberOfTimes > 0) {
                    ret.push(ret.shift());
                    numberOfTimes--;
                } else {
                    ret.unshift(ret.pop());
                    numberOfTimes++;
                }
                return rotate(ret, numberOfTimes);
            } else {
                return ret;
            }
        }

        function permutations(arr, length) {
            var ret = [];
            if (isArray(arr)) {
                var copy = arr.slice(0);
                if (typeof length !== "number") {
                    length = arr.length;
                }
                if (!length) {
                    ret = [
                        []
                    ];
                } else if (length <= arr.length) {
                    ret = reduce(arr, function (a, b, i) {
                        var ret;
                        if (length > 1) {
                            ret = permute(b, rotate(copy, i).slice(1), length);
                        } else {
                            ret = [
                                [b]
                            ];
                        }
                        return a.concat(ret);
                    }, []);
                }
            }
            return ret;
        }

        function zip() {
            var ret = [];
            var arrs = argsToArray(arguments);
            if (arrs.length > 1) {
                var arr1 = arrs.shift();
                if (isArray(arr1)) {
                    ret = reduce(arr1, function (a, b, i) {
                        var curr = [b];
                        for (var j = 0; j < arrs.length; j++) {
                            var currArr = arrs[j];
                            if (isArray(currArr) && !is.isUndefined(currArr[i])) {
                                curr.push(currArr[i]);
                            } else {
                                curr.push(null);
                            }
                        }
                        a.push(curr);
                        return a;
                    }, []);
                }
            }
            return ret;
        }

        function transpose(arr) {
            var ret = [];
            if (isArray(arr) && arr.length) {
                var last;
                forEach(arr, function (a) {
                    if (isArray(a) && (!last || a.length === last.length)) {
                        forEach(a, function (b, i) {
                            if (!ret[i]) {
                                ret[i] = [];
                            }
                            ret[i].push(b);
                        });
                        last = a;
                    }
                });
            }
            return ret;
        }

        function valuesAt(arr, indexes) {
            var ret = [];
            indexes = argsToArray(arguments);
            arr = indexes.shift();
            if (isArray(arr) && indexes.length) {
                for (var i = 0, l = indexes.length; i < l; i++) {
                    ret.push(arr[indexes[i]] || null);
                }
            }
            return ret;
        }

        function union() {
            var ret = [];
            var arrs = argsToArray(arguments);
            if (arrs.length > 1) {
                ret = removeDuplicates(reduce(arrs, function (a, b) {
                    return a.concat(b);
                }, []));
            }
            return ret;
        }

        function intersect() {
            var collect = [], set;
            var args = argsToArray(arguments);
            if (args.length > 1) {
                //assume we are intersections all the lists in the array
                set = args;
            } else {
                set = args[0];
            }
            if (isArray(set)) {
                var x = set.shift();
                collect = reduce(set, function (a, b) {
                    return intersection(a, b);
                }, x);
            }
            return removeDuplicates(collect);
        }

        function powerSet(arr) {
            var ret = [];
            if (isArray(arr) && arr.length) {
                ret = reduce(arr, function (a, b) {
                    var ret = map(a, function (c) {
                        return c.concat(b);
                    });
                    return a.concat(ret);
                }, [
                    []
                ]);
            }
            return ret;
        }

        function cartesian(a, b) {
            var ret = [];
            if (isArray(a) && isArray(b) && a.length && b.length) {
                ret = cross(a[0], b).concat(cartesian(a.slice(1), b));
            }
            return ret;
        }

        function compact(arr) {
            var ret = [];
            if (isArray(arr) && arr.length) {
                ret = filter(arr, function (item) {
                    return !is.isUndefinedOrNull(item);
                });
            }
            return ret;
        }

        function multiply(arr, times) {
            times = is.isNumber(times) ? times : 1;
            if (!times) {
                //make sure times is greater than zero if it is zero then dont multiply it
                times = 1;
            }
            arr = toArray(arr || []);
            var ret = [], i = 0;
            while (++i <= times) {
                ret = ret.concat(arr);
            }
            return ret;
        }

        function flatten(arr) {
            var set;
            var args = argsToArray(arguments);
            if (args.length > 1) {
                //assume we are intersections all the lists in the array
                set = args;
            } else {
                set = toArray(arr);
            }
            return reduce(set, function (a, b) {
                return a.concat(b);
            }, []);
        }

        function pluck(arr, prop) {
            prop = prop.split(".");
            var result = arr.slice(0);
            forEach(prop, function (prop) {
                var exec = prop.match(/(\w+)\(\)$/);
                result = map(result, function (item) {
                    return exec ? item[exec[1]]() : item[prop];
                });
            });
            return result;
        }

        function invoke(arr, func, args) {
            args = argsToArray(arguments, 2);
            return map(arr, function (item) {
                var exec = isString(func) ? item[func] : func;
                return exec.apply(item, args);
            });
        }


        var array = {
            toArray: toArray,
            sum: sum,
            avg: avg,
            sort: sort,
            min: min,
            max: max,
            difference: difference,
            removeDuplicates: removeDuplicates,
            unique: unique,
            rotate: rotate,
            permutations: permutations,
            zip: zip,
            transpose: transpose,
            valuesAt: valuesAt,
            union: union,
            intersect: intersect,
            powerSet: powerSet,
            cartesian: cartesian,
            compact: compact,
            multiply: multiply,
            flatten: flatten,
            pluck: pluck,
            invoke: invoke,
            forEach: forEach,
            map: map,
            filter: filter,
            reduce: reduce,
            reduceRight: reduceRight,
            some: some,
            every: every,
            indexOf: indexOf,
            lastIndexOf: lastIndexOf
        };

        return extended.define(isArray, array).expose(array);
    }

    if ("undefined" !== typeof exports) {
        if ("undefined" !== typeof module && module.exports) {
            module.exports = defineArray(require("extended"), require("is-extended"));
        }
    } else if ("function" === typeof define) {
        define(["require"], function (require) {
            return defineArray(require("extended"), require("is-extended"));
        });
    } else {
        this.arrayExtended = defineArray(this.extended, this.isExtended);
    }

}).call(this);







});

require.define("/node_modules/date-extended/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {"main":"index.js"}
});

require.define("/node_modules/date-extended/index.js",function(require,module,exports,__dirname,__filename,process,global){(function () {
    "use strict";

    function defineDate(extended, is, array) {

        function _pad(string, length, ch, end) {
            string = "" + string; //check for numbers
            ch = ch || " ";
            var strLen = string.length;
            while (strLen < length) {
                if (end) {
                    string += ch;
                } else {
                    string = ch + string;
                }
                strLen++;
            }
            return string;
        }

        function _truncate(string, length, end) {
            var ret = string;
            if (is.isString(ret)) {
                if (string.length > length) {
                    if (end) {
                        var l = string.length;
                        ret = string.substring(l - length, l);
                    } else {
                        ret = string.substring(0, length);
                    }
                }
            } else {
                ret = _truncate("" + ret, length);
            }
            return ret;
        }

        function every(arr, iterator, scope) {
            if (!is.isArray(arr) || typeof iterator !== "function") {
                throw new TypeError();
            }
            var t = Object(arr);
            var len = t.length >>> 0;
            for (var i = 0; i < len; i++) {
                if (i in t && !iterator.call(scope, t[i], i, t)) {
                    return false;
                }
            }
            return true;
        }


        var transforms = (function () {
                var floor = Math.floor, round = Math.round;

                var addMap = {
                    day: function addDay(date, amount) {
                        return [amount, "Date", false];
                    },
                    weekday: function addWeekday(date, amount) {
                        // Divide the increment time span into weekspans plus leftover days
                        // e.g., 8 days is one 5-day weekspan / and two leftover days
                        // Can't have zero leftover days, so numbers divisible by 5 get
                        // a days value of 5, and the remaining days make up the number of weeks
                        var days, weeks, mod = amount % 5, strt = date.getDay(), adj = 0;
                        if (!mod) {
                            days = (amount > 0) ? 5 : -5;
                            weeks = (amount > 0) ? ((amount - 5) / 5) : ((amount + 5) / 5);
                        } else {
                            days = mod;
                            weeks = parseInt(amount / 5, 10);
                        }
                        if (strt === 6 && amount > 0) {
                            adj = 1;
                        } else if (strt === 0 && amount < 0) {
                            // Orig date is Sun / negative increment
                            // Jump back over Sat
                            adj = -1;
                        }
                        // Get weekday val for the new date
                        var trgt = strt + days;
                        // New date is on Sat or Sun
                        if (trgt === 0 || trgt === 6) {
                            adj = (amount > 0) ? 2 : -2;
                        }
                        // Increment by number of weeks plus leftover days plus
                        // weekend adjustments
                        return [(7 * weeks) + days + adj, "Date", false];
                    },
                    year: function addYear(date, amount) {
                        return [amount, "FullYear", true];
                    },
                    week: function addWeek(date, amount) {
                        return [amount * 7, "Date", false];
                    },
                    quarter: function addYear(date, amount) {
                        return [amount * 3, "Month", true];
                    },
                    month: function addYear(date, amount) {
                        return [amount, "Month", true];
                    }
                };

                function addTransform(interval, date, amount) {
                    interval = interval.replace(/s$/, "");
                    if (addMap.hasOwnProperty(interval)) {
                        return addMap[interval](date, amount);
                    }
                    return [amount, "UTC" + interval.charAt(0).toUpperCase() + interval.substring(1) + "s", false];
                }


                var differenceMap = {
                    "quarter": function quarterDifference(date1, date2, utc) {
                        var yearDiff = date2.getFullYear() - date1.getFullYear();
                        var m1 = date1[utc ? "getUTCMonth" : "getMonth"]();
                        var m2 = date2[utc ? "getUTCMonth" : "getMonth"]();
                        // Figure out which quarter the months are in
                        var q1 = floor(m1 / 3) + 1;
                        var q2 = floor(m2 / 3) + 1;
                        // Add quarters for any year difference between the dates
                        q2 += (yearDiff * 4);
                        return q2 - q1;
                    },

                    "weekday": function weekdayDifference(date1, date2, utc) {
                        var days = differenceTransform("day", date1, date2, utc), weeks;
                        var mod = days % 7;
                        // Even number of weeks
                        if (mod === 0) {
                            days = differenceTransform("week", date1, date2, utc) * 5;
                        } else {
                            // Weeks plus spare change (< 7 days)
                            var adj = 0, aDay = date1[utc ? "getUTCDay" : "getDay"](), bDay = date2[utc ? "getUTCDay" : "getDay"]();
                            weeks = parseInt(days / 7, 10);
                            // Mark the date advanced by the number of
                            // round weeks (may be zero)
                            var dtMark = new Date(+date1);
                            dtMark.setDate(dtMark[utc ? "getUTCDate" : "getDate"]() + (weeks * 7));
                            var dayMark = dtMark[utc ? "getUTCDay" : "getDay"]();

                            // Spare change days -- 6 or less
                            if (days > 0) {
                                if (aDay === 6 || bDay === 6) {
                                    adj = -1;
                                } else if (aDay === 0) {
                                    adj = 0;
                                } else if (bDay === 0 || (dayMark + mod) > 5) {
                                    adj = -2;
                                }
                            } else if (days < 0) {
                                if (aDay === 6) {
                                    adj = 0;
                                } else if (aDay === 0 || bDay === 0) {
                                    adj = 1;
                                } else if (bDay === 6 || (dayMark + mod) < 0) {
                                    adj = 2;
                                }
                            }
                            days += adj;
                            days -= (weeks * 2);
                        }
                        return days;
                    },
                    year: function (date1, date2) {
                        return date2.getFullYear() - date1.getFullYear();
                    },
                    month: function (date1, date2, utc) {
                        var m1 = date1[utc ? "getUTCMonth" : "getMonth"]();
                        var m2 = date2[utc ? "getUTCMonth" : "getMonth"]();
                        return (m2 - m1) + ((date2.getFullYear() - date1.getFullYear()) * 12);
                    },
                    week: function (date1, date2, utc) {
                        return round(differenceTransform("day", date1, date2, utc) / 7);
                    },
                    day: function (date1, date2) {
                        return 1.1574074074074074e-8 * (date2.getTime() - date1.getTime());
                    },
                    hour: function (date1, date2) {
                        return 2.7777777777777776e-7 * (date2.getTime() - date1.getTime());
                    },
                    minute: function (date1, date2) {
                        return 0.000016666666666666667 * (date2.getTime() - date1.getTime());
                    },
                    second: function (date1, date2) {
                        return 0.001 * (date2.getTime() - date1.getTime());
                    },
                    millisecond: function (date1, date2) {
                        return date2.getTime() - date1.getTime();
                    }
                };


                function differenceTransform(interval, date1, date2, utc) {
                    interval = interval.replace(/s$/, "");
                    return round(differenceMap[interval](date1, date2, utc));
                }


                return {
                    addTransform: addTransform,
                    differenceTransform: differenceTransform
                };
            }()),
            addTransform = transforms.addTransform,
            differenceTransform = transforms.differenceTransform;


        /**
         * @ignore
         * Based on DOJO Date Implementation
         *
         * Dojo is available under *either* the terms of the modified BSD license *or* the
         * Academic Free License version 2.1. As a recipient of Dojo, you may choose which
         * license to receive this code under (except as noted in per-module LICENSE
         * files). Some modules may not be the copyright of the Dojo Foundation. These
         * modules contain explicit declarations of copyright in both the LICENSE files in
         * the directories in which they reside and in the code itself. No external
         * contributions are allowed under licenses which are fundamentally incompatible
         * with the AFL or BSD licenses that Dojo is distributed under.
         *
         */

        var floor = Math.floor, round = Math.round, min = Math.min, pow = Math.pow, ceil = Math.ceil, abs = Math.abs;
        var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        var monthAbbr = ["Jan.", "Feb.", "Mar.", "Apr.", "May.", "Jun.", "Jul.", "Aug.", "Sep.", "Oct.", "Nov.", "Dec."];
        var dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        var dayAbbr = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        var eraNames = ["Before Christ", "Anno Domini"];
        var eraAbbr = ["BC", "AD"];


        function getDayOfYear(/*Date*/dateObject, utc) {
            // summary: gets the day of the year as represented by dateObject
            return date.difference(new Date(dateObject.getFullYear(), 0, 1, dateObject.getHours()), dateObject, null, utc) + 1; // Number
        }

        function getWeekOfYear(/*Date*/dateObject, /*Number*/firstDayOfWeek, utc) {
            firstDayOfWeek = firstDayOfWeek || 0;
            var fullYear = dateObject[utc ? "getUTCFullYear" : "getFullYear"]();
            var firstDayOfYear = new Date(fullYear, 0, 1).getDay(),
                adj = (firstDayOfYear - firstDayOfWeek + 7) % 7,
                week = floor((getDayOfYear(dateObject) + adj - 1) / 7);

            // if year starts on the specified day, start counting weeks at 1
            if (firstDayOfYear === firstDayOfWeek) {
                week++;
            }

            return week; // Number
        }

        function getTimezoneName(/*Date*/dateObject) {
            var str = dateObject.toString();
            var tz = '';
            var pos = str.indexOf('(');
            if (pos > -1) {
                tz = str.substring(++pos, str.indexOf(')'));
            }
            return tz; // String
        }


        function buildDateEXP(pattern, tokens) {
            return pattern.replace(/([a-z])\1*/ig,function (match) {
                // Build a simple regexp.  Avoid captures, which would ruin the tokens list
                var s,
                    c = match.charAt(0),
                    l = match.length,
                    p2 = '0?',
                    p3 = '0{0,2}';
                if (c === 'y') {
                    s = '\\d{2,4}';
                } else if (c === "M") {
                    s = (l > 2) ? '\\S+?' : '1[0-2]|' + p2 + '[1-9]';
                } else if (c === "D") {
                    s = '[12][0-9][0-9]|3[0-5][0-9]|36[0-6]|' + p3 + '[1-9][0-9]|' + p2 + '[1-9]';
                } else if (c === "d") {
                    s = '3[01]|[12]\\d|' + p2 + '[1-9]';
                } else if (c === "w") {
                    s = '[1-4][0-9]|5[0-3]|' + p2 + '[1-9]';
                } else if (c === "E") {
                    s = '\\S+';
                } else if (c === "h") {
                    s = '1[0-2]|' + p2 + '[1-9]';
                } else if (c === "K") {
                    s = '1[01]|' + p2 + '\\d';
                } else if (c === "H") {
                    s = '1\\d|2[0-3]|' + p2 + '\\d';
                } else if (c === "k") {
                    s = '1\\d|2[0-4]|' + p2 + '[1-9]';
                } else if (c === "m" || c === "s") {
                    s = '[0-5]\\d';
                } else if (c === "S") {
                    s = '\\d{' + l + '}';
                } else if (c === "a") {
                    var am = 'AM', pm = 'PM';
                    s = am + '|' + pm;
                    if (am !== am.toLowerCase()) {
                        s += '|' + am.toLowerCase();
                    }
                    if (pm !== pm.toLowerCase()) {
                        s += '|' + pm.toLowerCase();
                    }
                    s = s.replace(/\./g, "\\.");
                } else if (c === 'v' || c === 'z' || c === 'Z' || c === 'G' || c === 'q' || c === 'Q') {
                    s = ".*";
                } else {
                    s = c === " " ? "\\s*" : c + "*";
                }
                if (tokens) {
                    tokens.push(match);
                }

                return "(" + s + ")"; // add capture
            }).replace(/[\xa0 ]/g, "[\\s\\xa0]"); // normalize whitespace.  Need explicit handling of \xa0 for IE.
        }


        /**
         * @namespace Utilities for Dates
         */
        var date = {

            /**@lends date*/

            /**
             * Returns the number of days in the month of a date
             *
             * @example
             *
             *  dateExtender.getDaysInMonth(new Date(2006, 1, 1)); //28
             *  dateExtender.getDaysInMonth(new Date(2004, 1, 1)); //29
             *  dateExtender.getDaysInMonth(new Date(2006, 2, 1)); //31
             *  dateExtender.getDaysInMonth(new Date(2006, 3, 1)); //30
             *  dateExtender.getDaysInMonth(new Date(2006, 4, 1)); //31
             *  dateExtender.getDaysInMonth(new Date(2006, 5, 1)); //30
             *  dateExtender.getDaysInMonth(new Date(2006, 6, 1)); //31
             * @param {Date} dateObject the date containing the month
             * @return {Number} the number of days in the month
             */
            getDaysInMonth: function (/*Date*/dateObject) {
                //	summary:
                //		Returns the number of days in the month used by dateObject
                var month = dateObject.getMonth();
                var days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
                if (month === 1 && date.isLeapYear(dateObject)) {
                    return 29;
                } // Number
                return days[month]; // Number
            },

            /**
             * Determines if a date is a leap year
             *
             * @example
             *
             *  dateExtender.isLeapYear(new Date(1600, 0, 1)); //true
             *  dateExtender.isLeapYear(new Date(2004, 0, 1)); //true
             *  dateExtender.isLeapYear(new Date(2000, 0, 1)); //true
             *  dateExtender.isLeapYear(new Date(2006, 0, 1)); //false
             *  dateExtender.isLeapYear(new Date(1900, 0, 1)); //false
             *  dateExtender.isLeapYear(new Date(1800, 0, 1)); //false
             *  dateExtender.isLeapYear(new Date(1700, 0, 1)); //false
             *
             * @param {Date} dateObject
             * @returns {Boolean} true if it is a leap year false otherwise
             */
            isLeapYear: function (/*Date*/dateObject, utc) {
                var year = dateObject[utc ? "getUTCFullYear" : "getFullYear"]();
                return (year % 400 === 0) || (year % 4 === 0 && year % 100 !== 0);

            },

            /**
             * Determines if a date is on a weekend
             *
             * @example
             *
             * var thursday = new Date(2006, 8, 21);
             * var saturday = new Date(2006, 8, 23);
             * var sunday = new Date(2006, 8, 24);
             * var monday = new Date(2006, 8, 25);
             * dateExtender.isWeekend(thursday)); //false
             * dateExtender.isWeekend(saturday); //true
             * dateExtender.isWeekend(sunday); //true
             * dateExtender.isWeekend(monday)); //false
             *
             * @param {Date} dateObject the date to test
             *
             * @returns {Boolean} true if the date is a weekend
             */
            isWeekend: function (/*Date?*/dateObject, utc) {
                // summary:
                //	Determines if the date falls on a weekend, according to local custom.
                var day = (dateObject || new Date())[utc ? "getUTCDay" : "getDay"]();
                return day === 0 || day === 6;
            },

            /**
             * Get the timezone of a date
             *
             * @example
             *  //just setting the strLocal to simulate the toString() of a date
             *  dt.str = 'Sun Sep 17 2006 22:25:51 GMT-0500 (CDT)';
             *  //just setting the strLocal to simulate the locale
             *  dt.strLocale = 'Sun 17 Sep 2006 10:25:51 PM CDT';
             *  dateExtender.getTimezoneName(dt); //'CDT'
             *  dt.str = 'Sun Sep 17 2006 22:57:18 GMT-0500 (CDT)';
             *  dt.strLocale = 'Sun Sep 17 22:57:18 2006';
             *  dateExtender.getTimezoneName(dt); //'CDT'
             * @param dateObject the date to get the timezone from
             *
             * @returns {String} the timezone of the date
             */
            getTimezoneName: getTimezoneName,

            /**
             * Compares two dates
             *
             * @example
             *
             * var d1 = new Date();
             * d1.setHours(0);
             * dateExtender.compare(d1, d1); // 0
             *
             *  var d1 = new Date();
             *  d1.setHours(0);
             *  var d2 = new Date();
             *  d2.setFullYear(2005);
             *  d2.setHours(12);
             *  dateExtender.compare(d1, d2, "date"); // 1
             *  dateExtender.compare(d1, d2, "datetime"); // 1
             *
             *  var d1 = new Date();
             *  d1.setHours(0);
             *  var d2 = new Date();
             *  d2.setFullYear(2005);
             *  d2.setHours(12);
             *  dateExtender.compare(d2, d1, "date"); // -1
             *  dateExtender.compare(d1, d2, "time"); //-1
             *
             * @param {Date|String} date1 the date to comapare
             * @param {Date|String} [date2=new Date()] the date to compare date1 againse
             * @param {"date"|"time"|"datetime"} portion compares the portion specified
             *
             * @returns -1 if date1 is < date2 0 if date1 === date2  1 if date1 > date2
             */
            compare: function (/*Date*/date1, /*Date*/date2, /*String*/portion) {
                date1 = new Date(+date1);
                date2 = new Date(+(date2 || new Date()));

                if (portion === "date") {
                    // Ignore times and compare dates.
                    date1.setHours(0, 0, 0, 0);
                    date2.setHours(0, 0, 0, 0);
                } else if (portion === "time") {
                    // Ignore dates and compare times.
                    date1.setFullYear(0, 0, 0);
                    date2.setFullYear(0, 0, 0);
                }
                return date1 > date2 ? 1 : date1 < date2 ? -1 : 0;
            },


            /**
             * Adds a specified interval and amount to a date
             *
             * @example
             *  var dtA = new Date(2005, 11, 27);
             *  dateExtender.add(dtA, "year", 1); //new Date(2006, 11, 27);
             *  dateExtender.add(dtA, "years", 1); //new Date(2006, 11, 27);
             *
             *  dtA = new Date(2000, 0, 1);
             *  dateExtender.add(dtA, "quarter", 1); //new Date(2000, 3, 1);
             *  dateExtender.add(dtA, "quarters", 1); //new Date(2000, 3, 1);
             *
             *  dtA = new Date(2000, 0, 1);
             *  dateExtender.add(dtA, "month", 1); //new Date(2000, 1, 1);
             *  dateExtender.add(dtA, "months", 1); //new Date(2000, 1, 1);
             *
             *  dtA = new Date(2000, 0, 31);
             *  dateExtender.add(dtA, "month", 1); //new Date(2000, 1, 29);
             *  dateExtender.add(dtA, "months", 1); //new Date(2000, 1, 29);
             *
             *  dtA = new Date(2000, 0, 1);
             *  dateExtender.add(dtA, "week", 1); //new Date(2000, 0, 8);
             *  dateExtender.add(dtA, "weeks", 1); //new Date(2000, 0, 8);
             *
             *  dtA = new Date(2000, 0, 1);
             *  dateExtender.add(dtA, "day", 1); //new Date(2000, 0, 2);
             *
             *  dtA = new Date(2000, 0, 1);
             *  dateExtender.add(dtA, "weekday", 1); //new Date(2000, 0, 3);
             *
             *  dtA = new Date(2000, 0, 1, 11);
             *  dateExtender.add(dtA, "hour", 1); //new Date(2000, 0, 1, 12);
             *
             *  dtA = new Date(2000, 11, 31, 23, 59);
             *  dateExtender.add(dtA, "minute", 1); //new Date(2001, 0, 1, 0, 0);
             *
             *  dtA = new Date(2000, 11, 31, 23, 59, 59);
             *  dateExtender.add(dtA, "second", 1); //new Date(2001, 0, 1, 0, 0, 0);
             *
             *  dtA = new Date(2000, 11, 31, 23, 59, 59, 999);
             *  dateExtender.add(dtA, "millisecond", 1); //new Date(2001, 0, 1, 0, 0, 0, 0);
             *
             * @param {Date} date
             * @param {String} interval the interval to add
             *  <ul>
             *      <li>day | days</li>
             *      <li>weekday | weekdays</li>
             *      <li>year | years</li>
             *      <li>week | weeks</li>
             *      <li>quarter | quarters</li>
             *      <li>months | months</li>
             *      <li>hour | hours</li>
             *      <li>minute | minutes</li>
             *      <li>second | seconds</li>
             *      <li>millisecond | milliseconds</li>
             *  </ul>
             * @param {Number} [amount=0] the amount to add
             */
            add: function (/*Date*/date, /*String*/interval, /*int*/amount) {
                var res = addTransform(interval, date, amount || 0);
                amount = res[0];
                var property = res[1];
                var sum = new Date(+date);
                var fixOvershoot = res[2];
                if (property) {
                    sum["set" + property](sum["get" + property]() + amount);
                }

                if (fixOvershoot && (sum.getDate() < date.getDate())) {
                    sum.setDate(0);
                }

                return sum; // Date
            },

            /**
             * Finds the difference between two dates based on the specified interval
             *
             * @example
             *
             * var dtA, dtB;
             *
             * dtA = new Date(2005, 11, 27);
             * dtB = new Date(2006, 11, 27);
             * dateExtender.difference(dtA, dtB, "year"); //1
             *
             * dtA = new Date(2000, 1, 29);
             * dtB = new Date(2001, 2, 1);
             * dateExtender.difference(dtA, dtB, "quarter"); //4
             * dateExtender.difference(dtA, dtB, "month"); //13
             *
             * dtA = new Date(2000, 1, 1);
             * dtB = new Date(2000, 1, 8);
             * dateExtender.difference(dtA, dtB, "week"); //1
             *
             * dtA = new Date(2000, 1, 29);
             * dtB = new Date(2000, 2, 1);
             * dateExtender.difference(dtA, dtB, "day"); //1
             *
             * dtA = new Date(2006, 7, 3);
             * dtB = new Date(2006, 7, 11);
             * dateExtender.difference(dtA, dtB, "weekday"); //6
             *
             * dtA = new Date(2000, 11, 31, 23);
             * dtB = new Date(2001, 0, 1, 0);
             * dateExtender.difference(dtA, dtB, "hour"); //1
             *
             * dtA = new Date(2000, 11, 31, 23, 59);
             * dtB = new Date(2001, 0, 1, 0, 0);
             * dateExtender.difference(dtA, dtB, "minute"); //1
             *
             * dtA = new Date(2000, 11, 31, 23, 59, 59);
             * dtB = new Date(2001, 0, 1, 0, 0, 0);
             * dateExtender.difference(dtA, dtB, "second"); //1
             *
             * dtA = new Date(2000, 11, 31, 23, 59, 59, 999);
             * dtB = new Date(2001, 0, 1, 0, 0, 0, 0);
             * dateExtender.difference(dtA, dtB, "millisecond"); //1
             *
             *
             * @param {Date} date1
             * @param {Date} [date2 = new Date()]
             * @param {String} [interval = "day"] the intercal to find the difference of.
             *   <ul>
             *      <li>day | days</li>
             *      <li>weekday | weekdays</li>
             *      <li>year | years</li>
             *      <li>week | weeks</li>
             *      <li>quarter | quarters</li>
             *      <li>months | months</li>
             *      <li>hour | hours</li>
             *      <li>minute | minutes</li>
             *      <li>second | seconds</li>
             *      <li>millisecond | milliseconds</li>
             *  </ul>
             */
            difference: function (/*Date*/date1, /*Date?*/date2, /*String*/interval, utc) {
                date2 = date2 || new Date();
                interval = interval || "day";
                return differenceTransform(interval, date1, date2, utc);
            },

            /**
             * Formats a date to the specidifed format string
             *
             * @example
             *
             * var date = new Date(2006, 7, 11, 0, 55, 12, 345);
             * dateExtender.format(date, "EEEE, MMMM dd, yyyy"); //"Friday, August 11, 2006"
             * dateExtender.format(date, "M/dd/yy"); //"8/11/06"
             * dateExtender.format(date, "E"); //"6"
             * dateExtender.format(date, "h:m a"); //"12:55 AM"
             * dateExtender.format(date, 'h:m:s'); //"12:55:12"
             * dateExtender.format(date, 'h:m:s.SS'); //"12:55:12.35"
             * dateExtender.format(date, 'k:m:s.SS'); //"24:55:12.35"
             * dateExtender.format(date, 'H:m:s.SS'); //"0:55:12.35"
             * dateExtender.format(date, "ddMMyyyy"); //"11082006"
             *
             * @param date the date to format
             * @param {String} format the format of the date composed of the following options
             * <ul>
             *                  <li> G    Era designator    Text    AD</li>
             *                  <li> y    Year    Year    1996; 96</li>
             *                  <li> M    Month in year    Month    July; Jul; 07</li>
             *                  <li> w    Week in year    Number    27</li>
             *                  <li> W    Week in month    Number    2</li>
             *                  <li> D    Day in year    Number    189</li>
             *                  <li> d    Day in month    Number    10</li>
             *                  <li> E    Day in week    Text    Tuesday; Tue</li>
             *                  <li> a    Am/pm marker    Text    PM</li>
             *                  <li> H    Hour in day (0-23)    Number    0</li>
             *                  <li> k    Hour in day (1-24)    Number    24</li>
             *                  <li> K    Hour in am/pm (0-11)    Number    0</li>
             *                  <li> h    Hour in am/pm (1-12)    Number    12</li>
             *                  <li> m    Minute in hour    Number    30</li>
             *                  <li> s    Second in minute    Number    55</li>
             *                  <li> S    Millisecond    Number    978</li>
             *                  <li> z    Time zone    General time zone    Pacific Standard Time; PST; GMT-08:00</li>
             *                  <li> Z    Time zone    RFC 822 time zone    -0800 </li>
             * </ul>
             */
            format: function (date, format, utc) {
                utc = utc || false;
                var fullYear, month, day, d, hour, minute, second, millisecond;
                if (utc) {
                    fullYear = date.getUTCFullYear();
                    month = date.getUTCMonth();
                    day = date.getUTCDay();
                    d = date.getUTCDate();
                    hour = date.getUTCHours();
                    minute = date.getUTCMinutes();
                    second = date.getUTCSeconds();
                    millisecond = date.getUTCMilliseconds();
                } else {
                    fullYear = date.getFullYear();
                    month = date.getMonth();
                    d = date.getDate();
                    day = date.getDay();
                    hour = date.getHours();
                    minute = date.getMinutes();
                    second = date.getSeconds();
                    millisecond = date.getMilliseconds();
                }
                return format.replace(/([A-Za-z])\1*/g, function (match) {
                    var s, pad,
                        c = match.charAt(0),
                        l = match.length;
                    if (c === 'd') {
                        s = "" + d;
                        pad = true;
                    } else if (c === "H" && !s) {
                        s = "" + hour;
                        pad = true;
                    } else if (c === 'm' && !s) {
                        s = "" + minute;
                        pad = true;
                    } else if (c === 's') {
                        if (!s) {
                            s = "" + second;
                        }
                        pad = true;
                    } else if (c === "G") {
                        s = ((l < 4) ? eraAbbr : eraNames)[fullYear < 0 ? 0 : 1];
                    } else if (c === "y") {
                        s = fullYear;
                        if (l > 1) {
                            if (l === 2) {
                                s = _truncate("" + s, 2, true);
                            } else {
                                pad = true;
                            }
                        }
                    } else if (c.toUpperCase() === "Q") {
                        s = ceil((month + 1) / 3);
                        pad = true;
                    } else if (c === "M") {
                        if (l < 3) {
                            s = month + 1;
                            pad = true;
                        } else {
                            s = (l === 3 ? monthAbbr : monthNames)[month];
                        }
                    } else if (c === "w") {
                        s = getWeekOfYear(date, 0, utc);
                        pad = true;
                    } else if (c === "D") {
                        s = getDayOfYear(date, utc);
                        pad = true;
                    } else if (c === "E") {
                        if (l < 3) {
                            s = day + 1;
                            pad = true;
                        } else {
                            s = (l === -3 ? dayAbbr : dayNames)[day];
                        }
                    } else if (c === 'a') {
                        s = (hour < 12) ? 'AM' : 'PM';
                    } else if (c === "h") {
                        s = (hour % 12) || 12;
                        pad = true;
                    } else if (c === "K") {
                        s = (hour % 12);
                        pad = true;
                    } else if (c === "k") {
                        s = hour || 24;
                        pad = true;
                    } else if (c === "S") {
                        s = round(millisecond * pow(10, l - 3));
                        pad = true;
                    } else if (c === "z" || c === "v" || c === "Z") {
                        s = getTimezoneName(date);
                        if ((c === "z" || c === "v") && !s) {
                            l = 4;
                        }
                        if (!s || c === "Z") {
                            var offset = date.getTimezoneOffset();
                            var tz = [
                                (offset >= 0 ? "-" : "+"),
                                _pad(floor(abs(offset) / 60), 2, "0"),
                                _pad(abs(offset) % 60, 2, "0")
                            ];
                            if (l === 4) {
                                tz.splice(0, 0, "GMT");
                                tz.splice(3, 0, ":");
                            }
                            s = tz.join("");
                        }
                    } else {
                        s = match;
                    }
                    if (pad) {
                        s = _pad(s, l, '0');
                    }
                    return s;
                });
            }

        };

        var numberDate = {};

        function addInterval(interval) {
            numberDate[interval + "sFromNow"] = function (val) {
                return date.add(new Date(), interval, val);
            };
            numberDate[interval + "sAgo"] = function (val) {
                return date.add(new Date(), interval, -val);
            };
        }

        var intervals = ["year", "month", "day", "hour", "minute", "second"];
        for (var i = 0, l = intervals.length; i < l; i++) {
            addInterval(intervals[i]);
        }

        var stringDate = {

            parseDate: function (dateStr, format) {
                if (!format) {
                    throw new Error('format required when calling dateExtender.parse');
                }
                var tokens = [], regexp = buildDateEXP(format, tokens),
                    re = new RegExp("^" + regexp + "$", "i"),
                    match = re.exec(dateStr);
                if (!match) {
                    return null;
                } // null
                var result = [1970, 0, 1, 0, 0, 0, 0], // will get converted to a Date at the end
                    amPm = "",
                    valid = every(match, function (v, i) {
                        if (i) {
                            var token = tokens[i - 1];
                            var l = token.length, type = token.charAt(0);
                            if (type === 'y') {
                                if (v < 100) {
                                    v = parseInt(v, 10);
                                    //choose century to apply, according to a sliding window
                                    //of 80 years before and 20 years after present year
                                    var year = '' + new Date().getFullYear(),
                                        century = year.substring(0, 2) * 100,
                                        cutoff = min(year.substring(2, 4) + 20, 99);
                                    result[0] = (v < cutoff) ? century + v : century - 100 + v;
                                } else {
                                    result[0] = v;
                                }
                            } else if (type === "M") {
                                if (l > 2) {
                                    var months = monthNames, j, k;
                                    if (l === 3) {
                                        months = monthAbbr;
                                    }
                                    //Tolerate abbreviating period in month part
                                    //Case-insensitive comparison
                                    v = v.replace(".", "").toLowerCase();
                                    var contains = false;
                                    for (j = 0, k = months.length; j < k && !contains; j++) {
                                        var s = months[j].replace(".", "").toLocaleLowerCase();
                                        if (s === v) {
                                            v = j;
                                            contains = true;
                                        }
                                    }
                                    if (!contains) {
                                        return false;
                                    }
                                } else {
                                    v--;
                                }
                                result[1] = v;
                            } else if (type === "E" || type === "e") {
                                var days = dayNames;
                                if (l === 3) {
                                    days = dayAbbr;
                                }
                                //Case-insensitive comparison
                                v = v.toLowerCase();
                                days = array.map(days, function (d) {
                                    return d.toLowerCase();
                                });
                                var d = array.indexOf(days, v);
                                if (d === -1) {
                                    v = parseInt(v, 10);
                                    if (isNaN(v) || v > days.length) {
                                        return false;
                                    }
                                } else {
                                    v = d;
                                }
                            } else if (type === 'D' || type === "d") {
                                if (type === "D") {
                                    result[1] = 0;
                                }
                                result[2] = v;
                            } else if (type === "a") {
                                var am = "am";
                                var pm = "pm";
                                var period = /\./g;
                                v = v.replace(period, '').toLowerCase();
                                // we might not have seen the hours field yet, so store the state and apply hour change later
                                amPm = (v === pm) ? 'p' : (v === am) ? 'a' : '';
                            } else if (type === "k" || type === "h" || type === "H" || type === "K") {
                                if (type === "k" && (+v) === 24) {
                                    v = 0;
                                }
                                result[3] = v;
                            } else if (type === "m") {
                                result[4] = v;
                            } else if (type === "s") {
                                result[5] = v;
                            } else if (type === "S") {
                                result[6] = v;
                            }
                        }
                        return true;
                    });
                if (valid) {
                    var hours = +result[3];
                    //account for am/pm
                    if (amPm === 'p' && hours < 12) {
                        result[3] = hours + 12; //e.g., 3pm -> 15
                    } else if (amPm === 'a' && hours === 12) {
                        result[3] = 0; //12am -> 0
                    }
                    var dateObject = new Date(result[0], result[1], result[2], result[3], result[4], result[5], result[6]); // Date
                    var dateToken = (array.indexOf(tokens, 'd') !== -1),
                        monthToken = (array.indexOf(tokens, 'M') !== -1),
                        month = result[1],
                        day = result[2],
                        dateMonth = dateObject.getMonth(),
                        dateDay = dateObject.getDate();
                    if ((monthToken && dateMonth > month) || (dateToken && dateDay > day)) {
                        return null;
                    }
                    return dateObject; // Date
                } else {
                    return null;
                }
            }
        };


        var ret = extended.define(is.isDate, date).define(is.isString, stringDate).define(is.isNumber, numberDate);
        for (i in date) {
            if (date.hasOwnProperty(i)) {
                ret[i] = date[i];
            }
        }

        for (i in stringDate) {
            if (stringDate.hasOwnProperty(i)) {
                ret[i] = stringDate[i];
            }
        }
        for (i in numberDate) {
            if (numberDate.hasOwnProperty(i)) {
                ret[i] = numberDate[i];
            }
        }
        return ret;
    }

    if ("undefined" !== typeof exports) {
        if ("undefined" !== typeof module && module.exports) {
            module.exports = defineDate(require("extended"), require("is-extended"), require("array-extended"));

        }
    } else if ("function" === typeof define) {
        define(["require"], function (require) {
            return defineDate(require("extended"), require("is-extended"), require("array-extended"));
        });
    } else {
        this.dateExtended = defineDate(this.extended, this.isExtended, this.arrayExtended);
    }

}).call(this);







});

require.define("/node_modules/object-extended/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {"main":"index.js"}
});

require.define("/node_modules/object-extended/index.js",function(require,module,exports,__dirname,__filename,process,global){(function () {
    "use strict";
    /*global extended isExtended*/

    function defineObject(extended, is) {

        var deepEqual = is.deepEqual,
            isHash = is.isHash;

        function _merge(target, source) {
            var name, s;
            for (name in source) {
                if (source.hasOwnProperty(name)) {
                    s = source[name];
                    if (!(name in target) || (target[name] !== s)) {
                        target[name] = s;
                    }
                }
            }
            return target;
        }

        function _deepMerge(target, source) {
            var name, s, t;
            for (name in source) {
                if (source.hasOwnProperty(name)) {
                    s = source[name], t = target[name];
                    if (!deepEqual(t, s)) {
                        if (isHash(t) && isHash(s)) {
                            target[name] = _deepMerge(t, s);
                        } else if (isHash(s)) {
                            target[name] = _deepMerge({}, s);
                        } else {
                            target[name] = s;
                        }
                    }
                }
            }
            return target;
        }


        function merge(obj) {
            if (!obj) {
                obj = {};
            }
            for (var i = 1, l = arguments.length; i < l; i++) {
                _merge(obj, arguments[i]);
            }
            return obj; // Object
        }

        function deepMerge(obj) {
            if (!obj) {
                obj = {};
            }
            for (var i = 1, l = arguments.length; i < l; i++) {
                _deepMerge(obj, arguments[i]);
            }
            return obj; // Object
        }


        function extend(parent, child) {
            var proto = parent.prototype || parent;
            merge(proto, child);
            return parent;
        }

        function forEach(hash, iterator, scope) {
            if (!isHash(hash) || typeof iterator !== "function") {
                throw new TypeError();
            }
            var objKeys = keys(hash), key;
            for (var i = 0, len = objKeys.length; i < len; ++i) {
                key = objKeys[i];
                iterator.call(scope || hash, hash[key], key, hash);
            }
            return hash;
        }

        function filter(hash, iterator, scope) {
            if (!isHash(hash) || typeof iterator !== "function") {
                throw new TypeError();
            }
            var objKeys = keys(hash), key, value, ret = {};
            for (var i = 0, len = objKeys.length; i < len; ++i) {
                key = objKeys[i];
                value = hash[key];
                if (iterator.call(scope || hash, value, key, hash)) {
                    ret[key] = value;
                }
            }
            return ret;
        }

        function values(hash) {
            if (!isHash(hash)) {
                throw new TypeError();
            }
            var objKeys = keys(hash), ret = [];
            for (var i = 0, len = objKeys.length; i < len; ++i) {
                ret.push(hash[objKeys[i]]);
            }
            return ret;
        }


        function keys(hash) {
            if (!isHash(hash)) {
                throw new TypeError();
            }
            var ret = [];
            for (var i in hash) {
                if (hash.hasOwnProperty(i)) {
                    ret.push(i);
                }
            }
            return ret;
        }

        function invert(hash) {
            if (!isHash(hash)) {
                throw new TypeError();
            }
            var objKeys = keys(hash), key, ret = {};
            for (var i = 0, len = objKeys.length; i < len; ++i) {
                key = objKeys[i];
                ret[hash[key]] = key;
            }
            return ret;
        }

        function toArray(hash) {
            if (!isHash(hash)) {
                throw new TypeError();
            }
            var objKeys = keys(hash), key, ret = [];
            for (var i = 0, len = objKeys.length; i < len; ++i) {
                key = objKeys[i];
                ret.push([key, hash[key]]);
            }
            return ret;
        }

        var hash = {
            forEach: forEach,
            filter: filter,
            invert: invert,
            values: values,
            toArray: toArray,
            keys: keys
        };


        var obj = {
            extend: extend,
            merge: merge,
            deepMerge: deepMerge

        };

        var ret = extended.define(is.isObject, obj).define(isHash, hash).define(is.isFunction, {extend: extend}).expose({hash: hash}).expose(obj);
        var orig = ret.extend;
        ret.extend = function __extend() {
            if (arguments.length === 1) {
                return orig.extend.apply(ret, arguments);
            } else {
                extend.apply(null, arguments);
            }
        };
        return ret;

    }

    if ("undefined" !== typeof exports) {
        if ("undefined" !== typeof module && module.exports) {
            module.exports = defineObject(require("extended"), require("is-extended"));

        }
    } else if ("function" === typeof define) {
        define(["require"], function (require) {
            return defineObject(require("extended"), require("is-extended"));
        });
    } else {
        this.objectExtended = defineObject(extended, isExtended);
    }

}).call(this);







});

require.define("/node_modules/string-extended/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {"main":"index.js"}
});

require.define("/node_modules/string-extended/index.js",function(require,module,exports,__dirname,__filename,process,global){(function () {
    "use strict";

    function defineString(extended, is, date) {

        var stringify;
        if (typeof JSON === "undefined") {
            /*
             json2.js
             2012-10-08

             Public Domain.

             NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
             */

            (function () {
                function f(n) {
                    // Format integers to have at least two digits.
                    return n < 10 ? '0' + n : n;
                }

                var isPrimitive = is.tester().isString().isNumber().isBoolean().tester();

                function toJSON(obj) {
                    if (is.isDate(obj)) {
                        return isFinite(obj.valueOf())
                            ? obj.getUTCFullYear() + '-' +
                            f(obj.getUTCMonth() + 1) + '-' +
                            f(obj.getUTCDate()) + 'T' +
                            f(obj.getUTCHours()) + ':' +
                            f(obj.getUTCMinutes()) + ':' +
                            f(obj.getUTCSeconds()) + 'Z'
                            : null;
                    } else if (isPrimitive(obj)) {
                        return obj.valueOf();
                    }
                    return obj;
                }

                var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
                    escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
                    gap,
                    indent,
                    meta = {    // table of character substitutions
                        '\b': '\\b',
                        '\t': '\\t',
                        '\n': '\\n',
                        '\f': '\\f',
                        '\r': '\\r',
                        '"': '\\"',
                        '\\': '\\\\'
                    },
                    rep;


                function quote(string) {
                    escapable.lastIndex = 0;
                    return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
                        var c = meta[a];
                        return typeof c === 'string' ? c : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                    }) + '"' : '"' + string + '"';
                }


                function str(key, holder) {

                    var i, k, v, length, mind = gap, partial, value = holder[key];
                    if (value) {
                        value = toJSON(value);
                    }
                    if (typeof rep === 'function') {
                        value = rep.call(holder, key, value);
                    }
                    switch (typeof value) {
                        case 'string':
                            return quote(value);
                        case 'number':
                            return isFinite(value) ? String(value) : 'null';
                        case 'boolean':
                        case 'null':
                            return String(value);
                        case 'object':
                            if (!value) {
                                return 'null';
                            }
                            gap += indent;
                            partial = [];
                            if (Object.prototype.toString.apply(value) === '[object Array]') {
                                length = value.length;
                                for (i = 0; i < length; i += 1) {
                                    partial[i] = str(i, value) || 'null';
                                }
                                v = partial.length === 0 ? '[]' : gap ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']' : '[' + partial.join(',') + ']';
                                gap = mind;
                                return v;
                            }
                            if (rep && typeof rep === 'object') {
                                length = rep.length;
                                for (i = 0; i < length; i += 1) {
                                    if (typeof rep[i] === 'string') {
                                        k = rep[i];
                                        v = str(k, value);
                                        if (v) {
                                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                                        }
                                    }
                                }
                            } else {
                                for (k in value) {
                                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                                        v = str(k, value);
                                        if (v) {
                                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                                        }
                                    }
                                }
                            }
                            v = partial.length === 0 ? '{}' : gap ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}' : '{' + partial.join(',') + '}';
                            gap = mind;
                            return v;
                    }
                }

                stringify = function (value, replacer, space) {
                    var i;
                    gap = '';
                    indent = '';
                    if (typeof space === 'number') {
                        for (i = 0; i < space; i += 1) {
                            indent += ' ';
                        }
                    } else if (typeof space === 'string') {
                        indent = space;
                    }
                    rep = replacer;
                    if (replacer && typeof replacer !== 'function' &&
                        (typeof replacer !== 'object' ||
                            typeof replacer.length !== 'number')) {
                        throw new Error('JSON.stringify');
                    }
                    return str('', {'': value});
                };
            }());
        }else{
            stringify = JSON.stringify;
        }


        var isHash = is.isHash, aSlice = Array.prototype.slice;

        var FORMAT_REGEX = /%((?:-?\+?.?\d*)?|(?:\[[^\[|\]]*\]))?([sjdDZ])/g;
        var INTERP_REGEX = /\{(?:\[([^\[|\]]*)\])?(\w+)\}/g;
        var STR_FORMAT = /(-?)(\+?)([A-Z|a-z|\W]?)([1-9][0-9]*)?$/;
        var OBJECT_FORMAT = /([1-9][0-9]*)$/g;

        function formatString(string, format) {
            var ret = string;
            if (STR_FORMAT.test(format)) {
                var match = format.match(STR_FORMAT);
                var isLeftJustified = match[1], padChar = match[3], width = match[4];
                if (width) {
                    width = parseInt(width, 10);
                    if (ret.length < width) {
                        ret = pad(ret, width, padChar, isLeftJustified);
                    } else {
                        ret = truncate(ret, width);
                    }
                }
            }
            return ret;
        }

        function formatNumber(number, format) {
            var ret;
            if (is.isNumber(number)) {
                ret = "" + number;
                if (STR_FORMAT.test(format)) {
                    var match = format.match(STR_FORMAT);
                    var isLeftJustified = match[1], signed = match[2], padChar = match[3], width = match[4];
                    if (signed) {
                        ret = (number > 0 ? "+" : "") + ret;
                    }
                    if (width) {
                        width = parseInt(width, 10);
                        if (ret.length < width) {
                            ret = pad(ret, width, padChar || "0", isLeftJustified);
                        } else {
                            ret = truncate(ret, width);
                        }
                    }

                }
            } else {
                throw new Error("stringExtended.format : when using %d the parameter must be a number!");
            }
            return ret;
        }

        function formatObject(object, format) {
            var ret, match = format.match(OBJECT_FORMAT), spacing = 0;
            if (match) {
                spacing = parseInt(match[0], 10);
                if (isNaN(spacing)) {
                    spacing = 0;
                }
            }
            try {
                ret = stringify(object, null, spacing);
            } catch (e) {
                throw new Error("stringExtended.format : Unable to parse json from ", object);
            }
            return ret;
        }


        var styles = {
            //styles
            bold: 1,
            bright: 1,
            italic: 3,
            underline: 4,
            blink: 5,
            inverse: 7,
            crossedOut: 9,

            red: 31,
            green: 32,
            yellow: 33,
            blue: 34,
            magenta: 35,
            cyan: 36,
            white: 37,

            redBackground: 41,
            greenBackground: 42,
            yellowBackground: 43,
            blueBackground: 44,
            magentaBackground: 45,
            cyanBackground: 46,
            whiteBackground: 47,

            encircled: 52,
            overlined: 53,
            grey: 90,
            black: 90
        };

        var characters = {
            SMILEY: "☺",
            SOLID_SMILEY: "☻",
            HEART: "♥",
            DIAMOND: "♦",
            CLOVE: "♣",
            SPADE: "♠",
            DOT: "•",
            SQUARE_CIRCLE: "◘",
            CIRCLE: "○",
            FILLED_SQUARE_CIRCLE: "◙",
            MALE: "♂",
            FEMALE: "♀",
            EIGHT_NOTE: "♪",
            DOUBLE_EIGHTH_NOTE: "♫",
            SUN: "☼",
            PLAY: "►",
            REWIND: "◄",
            UP_DOWN: "↕",
            PILCROW: "¶",
            SECTION: "§",
            THICK_MINUS: "▬",
            SMALL_UP_DOWN: "↨",
            UP_ARROW: "↑",
            DOWN_ARROW: "↓",
            RIGHT_ARROW: "→",
            LEFT_ARROW: "←",
            RIGHT_ANGLE: "∟",
            LEFT_RIGHT_ARROW: "↔",
            TRIANGLE: "▲",
            DOWN_TRIANGLE: "▼",
            HOUSE: "⌂",
            C_CEDILLA: "Ç",
            U_UMLAUT: "ü",
            E_ACCENT: "é",
            A_LOWER_CIRCUMFLEX: "â",
            A_LOWER_UMLAUT: "ä",
            A_LOWER_GRAVE_ACCENT: "à",
            A_LOWER_CIRCLE_OVER: "å",
            C_LOWER_CIRCUMFLEX: "ç",
            E_LOWER_CIRCUMFLEX: "ê",
            E_LOWER_UMLAUT: "ë",
            E_LOWER_GRAVE_ACCENT: "è",
            I_LOWER_UMLAUT: "ï",
            I_LOWER_CIRCUMFLEX: "î",
            I_LOWER_GRAVE_ACCENT: "ì",
            A_UPPER_UMLAUT: "Ä",
            A_UPPER_CIRCLE: "Å",
            E_UPPER_ACCENT: "É",
            A_E_LOWER: "æ",
            A_E_UPPER: "Æ",
            O_LOWER_CIRCUMFLEX: "ô",
            O_LOWER_UMLAUT: "ö",
            O_LOWER_GRAVE_ACCENT: "ò",
            U_LOWER_CIRCUMFLEX: "û",
            U_LOWER_GRAVE_ACCENT: "ù",
            Y_LOWER_UMLAUT: "ÿ",
            O_UPPER_UMLAUT: "Ö",
            U_UPPER_UMLAUT: "Ü",
            CENTS: "¢",
            POUND: "£",
            YEN: "¥",
            CURRENCY: "¤",
            PTS: "₧",
            FUNCTION: "ƒ",
            A_LOWER_ACCENT: "á",
            I_LOWER_ACCENT: "í",
            O_LOWER_ACCENT: "ó",
            U_LOWER_ACCENT: "ú",
            N_LOWER_TILDE: "ñ",
            N_UPPER_TILDE: "Ñ",
            A_SUPER: "ª",
            O_SUPER: "º",
            UPSIDEDOWN_QUESTION: "¿",
            SIDEWAYS_L: "⌐",
            NEGATION: "¬",
            ONE_HALF: "½",
            ONE_FOURTH: "¼",
            UPSIDEDOWN_EXCLAMATION: "¡",
            DOUBLE_LEFT: "«",
            DOUBLE_RIGHT: "»",
            LIGHT_SHADED_BOX: "░",
            MEDIUM_SHADED_BOX: "▒",
            DARK_SHADED_BOX: "▓",
            VERTICAL_LINE: "│",
            MAZE__SINGLE_RIGHT_T: "┤",
            MAZE_SINGLE_RIGHT_TOP: "┐",
            MAZE_SINGLE_RIGHT_BOTTOM_SMALL: "┘",
            MAZE_SINGLE_LEFT_TOP_SMALL: "┌",
            MAZE_SINGLE_LEFT_BOTTOM_SMALL: "└",
            MAZE_SINGLE_LEFT_T: "├",
            MAZE_SINGLE_BOTTOM_T: "┴",
            MAZE_SINGLE_TOP_T: "┬",
            MAZE_SINGLE_CENTER: "┼",
            MAZE_SINGLE_HORIZONTAL_LINE: "─",
            MAZE_SINGLE_RIGHT_DOUBLECENTER_T: "╡",
            MAZE_SINGLE_RIGHT_DOUBLE_BL: "╛",
            MAZE_SINGLE_RIGHT_DOUBLE_T: "╢",
            MAZE_SINGLE_RIGHT_DOUBLEBOTTOM_TOP: "╖",
            MAZE_SINGLE_RIGHT_DOUBLELEFT_TOP: "╕",
            MAZE_SINGLE_LEFT_DOUBLE_T: "╞",
            MAZE_SINGLE_BOTTOM_DOUBLE_T: "╧",
            MAZE_SINGLE_TOP_DOUBLE_T: "╤",
            MAZE_SINGLE_TOP_DOUBLECENTER_T: "╥",
            MAZE_SINGLE_BOTTOM_DOUBLECENTER_T: "╨",
            MAZE_SINGLE_LEFT_DOUBLERIGHT_BOTTOM: "╘",
            MAZE_SINGLE_LEFT_DOUBLERIGHT_TOP: "╒",
            MAZE_SINGLE_LEFT_DOUBLEBOTTOM_TOP: "╓",
            MAZE_SINGLE_LEFT_DOUBLETOP_BOTTOM: "╙",
            MAZE_SINGLE_LEFT_TOP: "Γ",
            MAZE_SINGLE_RIGHT_BOTTOM: "╜",
            MAZE_SINGLE_LEFT_CENTER: "╟",
            MAZE_SINGLE_DOUBLECENTER_CENTER: "╫",
            MAZE_SINGLE_DOUBLECROSS_CENTER: "╪",
            MAZE_DOUBLE_LEFT_CENTER: "╣",
            MAZE_DOUBLE_VERTICAL: "║",
            MAZE_DOUBLE_RIGHT_TOP: "╗",
            MAZE_DOUBLE_RIGHT_BOTTOM: "╝",
            MAZE_DOUBLE_LEFT_BOTTOM: "╚",
            MAZE_DOUBLE_LEFT_TOP: "╔",
            MAZE_DOUBLE_BOTTOM_T: "╩",
            MAZE_DOUBLE_TOP_T: "╦",
            MAZE_DOUBLE_LEFT_T: "╠",
            MAZE_DOUBLE_HORIZONTAL: "═",
            MAZE_DOUBLE_CROSS: "╬",
            SOLID_RECTANGLE: "█",
            THICK_LEFT_VERTICAL: "▌",
            THICK_RIGHT_VERTICAL: "▐",
            SOLID_SMALL_RECTANGLE_BOTTOM: "▄",
            SOLID_SMALL_RECTANGLE_TOP: "▀",
            PHI_UPPER: "Φ",
            INFINITY: "∞",
            INTERSECTION: "∩",
            DEFINITION: "≡",
            PLUS_MINUS: "±",
            GT_EQ: "≥",
            LT_EQ: "≤",
            THEREFORE: "⌠",
            SINCE: "∵",
            DOESNOT_EXIST: "∄",
            EXISTS: "∃",
            FOR_ALL: "∀",
            EXCLUSIVE_OR: "⊕",
            BECAUSE: "⌡",
            DIVIDE: "÷",
            APPROX: "≈",
            DEGREE: "°",
            BOLD_DOT: "∙",
            DOT_SMALL: "·",
            CHECK: "√",
            ITALIC_X: "✗",
            SUPER_N: "ⁿ",
            SQUARED: "²",
            CUBED: "³",
            SOLID_BOX: "■",
            PERMILE: "‰",
            REGISTERED_TM: "®",
            COPYRIGHT: "©",
            TRADEMARK: "™",
            BETA: "β",
            GAMMA: "γ",
            ZETA: "ζ",
            ETA: "η",
            IOTA: "ι",
            KAPPA: "κ",
            LAMBDA: "λ",
            NU: "ν",
            XI: "ξ",
            OMICRON: "ο",
            RHO: "ρ",
            UPSILON: "υ",
            CHI_LOWER: "φ",
            CHI_UPPER: "χ",
            PSI: "ψ",
            ALPHA: "α",
            ESZETT: "ß",
            PI: "π",
            SIGMA_UPPER: "Σ",
            SIGMA_LOWER: "σ",
            MU: "µ",
            TAU: "τ",
            THETA: "Θ",
            OMEGA: "Ω",
            DELTA: "δ",
            PHI_LOWER: "φ",
            EPSILON: "ε"
        };

        function pad(string, length, ch, end) {
            string = "" + string; //check for numbers
            ch = ch || " ";
            var strLen = string.length;
            while (strLen < length) {
                if (end) {
                    string += ch;
                } else {
                    string = ch + string;
                }
                strLen++;
            }
            return string;
        }

        function truncate(string, length, end) {
            var ret = string;
            if (is.isString(ret)) {
                if (string.length > length) {
                    if (end) {
                        var l = string.length;
                        ret = string.substring(l - length, l);
                    } else {
                        ret = string.substring(0, length);
                    }
                }
            } else {
                ret = truncate("" + ret, length);
            }
            return ret;
        }

        function format(str, obj) {
            if (obj instanceof Array) {
                var i = 0, len = obj.length;
                //find the matches
                return str.replace(FORMAT_REGEX, function (m, format, type) {
                    var replacer, ret;
                    if (i < len) {
                        replacer = obj[i++];
                    } else {
                        //we are out of things to replace with so
                        //just return the match?
                        return m;
                    }
                    if (m === "%s" || m === "%d" || m === "%D") {
                        //fast path!
                        ret = replacer + "";
                    } else if (m === "%Z") {
                        ret = replacer.toUTCString();
                    } else if (m === "%j") {
                        try {
                            ret = stringify(replacer);
                        } catch (e) {
                            throw new Error("stringExtended.format : Unable to parse json from ", replacer);
                        }
                    } else {
                        format = format.replace(/^\[|\]$/g, "");
                        switch (type) {
                            case "s":
                                ret = formatString(replacer, format);
                                break;
                            case "d":
                                ret = formatNumber(replacer, format);
                                break;
                            case "j":
                                ret = formatObject(replacer, format);
                                break;
                            case "D":
                                ret = date.format(replacer, format);
                                break;
                            case "Z":
                                ret = date.format(replacer, format, true);
                                break;
                        }
                    }
                    return ret;
                });
            } else if (isHash(obj)) {
                return str.replace(INTERP_REGEX, function (m, format, value) {
                    value = obj[value];
                    if (!is.isUndefined(value)) {
                        if (format) {
                            if (is.isString(value)) {
                                return formatString(value, format);
                            } else if (is.isNumber(value)) {
                                return formatNumber(value, format);
                            } else if (is.isDate(value)) {
                                return date.format(value, format);
                            } else if (is.isObject(value)) {
                                return formatObject(value, format);
                            }
                        } else {
                            return "" + value;
                        }
                    }
                    return m;
                });
            } else {
                var args = aSlice.call(arguments).slice(1);
                return format(str, args);
            }
        }

        function toArray(testStr, delim) {
            var ret = [];
            if (testStr) {
                if (testStr.indexOf(delim) > 0) {
                    ret = testStr.replace(/\s+/g, "").split(delim);
                }
                else {
                    ret.push(testStr);
                }
            }
            return ret;
        }

        function multiply(str, times) {
            var ret = [];
            if (times) {
                for (var i = 0; i < times; i++) {
                    ret.push(str);
                }
            }
            return ret.join("");
        }


        function style(str, options) {
            var ret, i, l;
            if (options) {
                if (is.isArray(str)) {
                    ret = [];
                    for (i = 0, l = str.length; i < l; i++) {
                        ret.push(style(str[i], options));
                    }
                } else if (options instanceof Array) {
                    ret = str;
                    for (i = 0, l = options.length; i < l; i++) {
                        ret = style(ret, options[i]);
                    }
                } else if (options in styles) {
                    ret = '\x1B[' + styles[options] + 'm' + str + '\x1B[0m';
                }
            }
            return ret;
        }


        var string = {
            toArray: toArray,
            pad: pad,
            truncate: truncate,
            multiply: multiply,
            format: format,
            style: style
        };


        var i, ret = extended.define(is.isString, string).define(is.isArray, {style: style});
        for (i in string) {
            if (string.hasOwnProperty(i)) {
                ret[i] = string[i];
            }
        }
        ret.characters = characters;
        return ret;
    }

    if ("undefined" !== typeof exports) {
        if ("undefined" !== typeof module && module.exports) {
            module.exports = defineString(require("extended"), require("is-extended"), require("date-extended"));

        }
    } else if ("function" === typeof define) {
        define(["require"], function (require) {
            return defineString(require("extended"), require("is-extended"), require("date-extended"));
        });
    } else {
        this.stringExtended = defineString(this.extended, this.isExtended, this.dateExtended);
    }

}).call(this);







});

require.define("/node_modules/promise-extended/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {"main":"index.js"}
});

require.define("/node_modules/promise-extended/index.js",function(require,module,exports,__dirname,__filename,process,global){(function () {
    "use strict";
    /*global setImmediate, MessageChannel*/


    var arraySlice = Array.prototype.slice;

    function argsToArray(args, slice) {
        slice = slice || 0;
        return arraySlice.call(args, slice);
    }


    function definePromise(declare, extended, array, is, fn) {

        var forEach = array.forEach,
            isUndefinedOrNull = is.isUndefinedOrNull,
            isArray = is.isArray,
            isFunction = is.isFunction,
            isBoolean = is.isBoolean,
            bind = fn.bind,
            bindIgnore = fn.bindIgnore;

        function createHandler(fn, promise) {
            return function _handler() {
                try {
                    when(fn.apply(null, arguments))
                        .addCallback(promise)
                        .addErrback(promise);
                } catch (e) {
                    promise.errback(e);
                }
            };
        }

        var nextTick;
        if (typeof process !== "undefined") {
            // node
            nextTick = process.nextTick;
        } else if (typeof setImmediate === "function") {
            // In IE10, or use https://github.com/NobleJS/setImmediate
            nextTick = setImmediate;
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


        //noinspection JSHint
        var Promise = declare({
            instance: {
                __fired: false,

                __results: null,

                __error: null,

                __errorCbs: null,

                __cbs: null,

                constructor: function () {
                    this.__errorCbs = [];
                    this.__cbs = [];
                    fn.bindAll(this, ["callback", "errback", "resolve", "classic", "__resolve", "addCallback", "addErrback"]);
                },

                __resolve: function () {
                    if (!this.__fired) {
                        this.__fired = true;
                        var cbs = this.__error ? this.__errorCbs : this.__cbs,
                            len = cbs.length, i,
                            results = this.__error || this.__results;
                        for (i = 0; i < len; i++) {
                            this.__callNextTick(cbs[i], results);
                        }

                    }
                },

                __callNextTick: function (cb, results) {
                    nextTick(function () {
                        cb.apply(this, results);
                    });
                },

                addCallback: function (cb) {
                    if (cb) {
                        if (isPromiseLike(cb) && cb.callback) {
                            cb = cb.callback;
                        }
                        if (this.__fired && this.__results) {
                            this.__callNextTick(cb, this.__results);
                        } else {
                            this.__cbs.push(cb);
                        }
                    }
                    return this;
                },


                addErrback: function (cb) {
                    if (cb) {
                        if (isPromiseLike(cb) && cb.errback) {
                            cb = cb.errback;
                        }
                        if (this.__fired && this.__error) {
                            this.__callNextTick(cb, this.__error);
                        } else {
                            this.__errorCbs.push(cb);
                        }
                    }
                    return this;
                },

                callback: function (args) {
                    if (!this.__fired) {
                        this.__results = arguments;
                        this.__resolve();
                    }
                    return this.promise();
                },

                errback: function (args) {
                    if (!this.__fired) {
                        this.__error = arguments;
                        this.__resolve();
                    }
                    return this.promise();
                },

                resolve: function (err, args) {
                    if (err) {
                        this.errback(err);
                    } else {
                        this.callback.apply(this, argsToArray(arguments, 1));
                    }
                    return this;
                },

                classic: function (cb) {
                    if ("function" === typeof cb) {
                        this.addErrback(function (err) {
                            cb(err);
                        });
                        this.addCallback(function () {
                            cb.apply(this, [null].concat(argsToArray(arguments)));
                        });
                    }
                    return this;
                },

                then: function (callback, errback) {

                    var promise = new Promise(), errorHandler = promise;
                    if (isFunction(errback)) {
                        errorHandler = createHandler(errback, promise);
                    }
                    this.addErrback(errorHandler);
                    if (isFunction(callback)) {
                        this.addCallback(createHandler(callback, promise));
                    } else {
                        this.addCallback(promise);
                    }

                    return promise.promise();
                },

                both: function (callback) {
                    return this.then(callback, callback);
                },

                promise: function () {
                    var ret = {
                        then: bind(this, "then"),
                        both: bind(this, "both"),
                        promise: function () {
                            return ret;
                        }
                    };
                    forEach(["addCallback", "addErrback", "classic"], function (action) {
                        ret[action] = bind(this, function () {
                            this[action].apply(this, arguments);
                            return ret;
                        });
                    }, this);

                    return ret;
                }


            }
        });


        var PromiseList = Promise.extend({
            instance: {

                /*@private*/
                __results: null,

                /*@private*/
                __errors: null,

                /*@private*/
                __promiseLength: 0,

                /*@private*/
                __defLength: 0,

                /*@private*/
                __firedLength: 0,

                normalizeResults: false,

                constructor: function (defs, normalizeResults) {
                    this.__errors = [];
                    this.__results = [];
                    this.normalizeResults = isBoolean(normalizeResults) ? normalizeResults : false;
                    this._super(arguments);
                    if (defs && defs.length) {
                        this.__defLength = defs.length;
                        forEach(defs, this.__addPromise, this);
                    } else {
                        this.__resolve();
                    }
                },

                __addPromise: function (promise, i) {
                    promise.then(
                        bind(this, function () {
                            var args = argsToArray(arguments);
                            args.unshift(i);
                            this.callback.apply(this, args);
                        }),
                        bind(this, function () {
                            var args = argsToArray(arguments);
                            args.unshift(i);
                            this.errback.apply(this, args);
                        })
                    );
                },

                __resolve: function () {
                    if (!this.__fired) {
                        this.__fired = true;
                        var cbs = this.__errors.length ? this.__errorCbs : this.__cbs,
                            len = cbs.length, i,
                            results = this.__errors.length ? this.__errors : this.__results;
                        for (i = 0; i < len; i++) {
                            this.__callNextTick(cbs[i], results);
                        }

                    }
                },

                __callNextTick: function (cb, results) {
                    nextTick(function () {
                        cb.apply(null, [results]);
                    });
                },

                addCallback: function (cb) {
                    if (cb) {
                        if (isPromiseLike(cb) && cb.callback) {
                            cb = bind(cb, "callback");
                        }
                        if (this.__fired && !this.__errors.length) {
                            this.__callNextTick(cb, this.__results);
                        } else {
                            this.__cbs.push(cb);
                        }
                    }
                    return this;
                },

                addErrback: function (cb) {
                    if (cb) {
                        if (isPromiseLike(cb) && cb.errback) {
                            cb = bind(cb, "errback");
                        }
                        if (this.__fired && this.__errors.length) {
                            this.__callNextTick(cb, this.__errors);
                        } else {
                            this.__errorCbs.push(cb);
                        }
                    }
                    return this;
                },


                callback: function (i) {
                    if (this.__fired) {
                        throw new Error("Already fired!");
                    }
                    var args = argsToArray(arguments);
                    if (this.normalizeResults) {
                        args = args.slice(1);
                        args = args.length == 1 ? args.pop() : args;
                    }
                    this.__results[i] = args;
                    this.__firedLength++;
                    if (this.__firedLength == this.__defLength) {
                        this.__resolve();
                    }
                    return this.promise();
                },


                errback: function (i) {
                    if (this.__fired) {
                        throw new Error("Already fired!");
                    }
                    var args = argsToArray(arguments);
                    if (this.normalizeResults) {
                        args = args.slice(1);
                        args = args.length == 1 ? args.pop() : args;
                    }
                    this.__errors[i] = args;
                    this.__firedLength++;
                    if (this.__firedLength == this.__defLength) {
                        this.__resolve();
                    }
                    return this.promise();
                }

            }
        });


        function callNext(list, results, propogate) {
            var ret = new Promise().callback();
            forEach(list, function (listItem) {
                ret = ret.then(propogate ? listItem : bindIgnore(null, listItem));
                if (!propogate) {
                    ret = ret.then(function (res) {
                        results.push(res);
                        return results;
                    });
                }
            });
            return ret;
        }

        function isPromiseLike(obj) {
            return !isUndefinedOrNull(obj) && (isFunction(obj.then));
        }

        function wrapThenPromise(p) {
            var ret = new Promise();
            p.then(bind(ret, "callback"), bind(ret, "errback"));
            return  ret.promise();
        }

        function when(args) {
            var p;
            args = argsToArray(arguments);
            if (!args.length) {
                p = new Promise().callback(args).promise();
            } else if (args.length == 1) {
                args = args.pop();
                if (isPromiseLike(args)) {
                    if (args.addCallback && args.addErrback) {
                        p = args;
                    } else {
                        console.log(args);
                        p = wrapThenPromise(args);
                    }
                } else if (isArray(args) && array.every(args, isPromiseLike)) {
                    p = new PromiseList(args, true).promise();
                } else {
                    p = new Promise().callback(args);
                }
            } else {
                p = new PromiseList(array.map(args, function (a) {
                    return when(a);
                }), true).promise();
            }
            return p;

        }

        function wrap(fn, scope) {
            return function _wrap() {
                var ret = new Promise();
                var args = argsToArray(arguments);
                args.push(ret.resolve);
                fn.apply(scope || this, args);
                return ret.promise();
            };
        }

        function serial(list) {
            if (isArray(list)) {
                return callNext(list, [], false);
            } else {
                throw new Error("When calling promise.serial the first argument must be an array");
            }
        }


        function chain(list) {
            if (isArray(list)) {
                return callNext(list, [], true);
            } else {
                throw new Error("When calling promise.serial the first argument must be an array");
            }
        }


        function wait(args, fn) {
            args = argsToArray(arguments);
            var resolved = false;
            fn = args.pop();
            var p = when(args);
            return function waiter() {
                if (!resolved) {
                    args = arguments;
                    return p.then(bind(this, function doneWaiting() {
                        resolved = true;
                        return fn.apply(this, args);
                    }));
                } else {
                    return when(fn.apply(this, arguments));
                }
            };
        }

        function createPromise() {
            return new Promise();
        }

        function createPromiseList(promises) {
            return new PromiseList(promises, true).promise();
        }

        function createRejected(val) {
            return createPromise().errback(val);
        }

        function createResolved(val) {
            return createPromise().callback(val);
        }


        return extended
            .define({
                isPromiseLike: isPromiseLike
            }).expose({
                isPromiseLike: isPromiseLike,
                when: when,
                wrap: wrap,
                wait: wait,
                serial: serial,
                chain: chain,
                Promise: Promise,
                PromiseList: PromiseList,
                promise: createPromise,
                defer: createPromise,
                deferredList: createPromiseList,
                reject: createRejected,
                resolve: createResolved
            });

    }

    if ("undefined" !== typeof exports) {
        if ("undefined" !== typeof module && module.exports) {
            module.exports = definePromise(require("declare.js"), require("extended"), require("array-extended"), require("is-extended"), require("function-extended"));
        }
    } else if ("function" === typeof define) {
        define(["require"], function (require) {
            return definePromise(require("declare.js"), require("extended"), require("array-extended"), require("is-extended"), require("function-extended"));
        });
    } else {
        this.arrayExtended = definePromise(this.declare, this.extended, this.arrayExtended, this.isExtended, this.functionExtended);
    }

}).call(this);







});

require.define("/node_modules/function-extended/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {"main":"index.js"}
});

require.define("/node_modules/function-extended/index.js",function(require,module,exports,__dirname,__filename,process,global){(function () {
    "use strict";

    function defineFunction(extended, is) {

        var isArray = is.isArray,
            isObject = is.isObject,
            isString = is.isString,
            isFunction = is.isFunction,
            arraySlice = Array.prototype.slice;

        function argsToArray(args, slice) {
            slice = slice || 0;
            return arraySlice.call(args, slice);
        }

        function hitch(scope, method, args) {
            args = argsToArray(arguments, 2);
            if ((isString(method) && !(method in scope))) {
                throw new Error(method + " property not defined in scope");
            } else if (!isString(method) && !isFunction(method)) {
                throw new Error(method + " is not a function");
            }
            if (isString(method)) {
                return function () {
                    var func = scope[method];
                    if (isFunction(func)) {
                        var scopeArgs = args.concat(argsToArray(arguments));
                        return func.apply(scope, scopeArgs);
                    } else {
                        return func;
                    }
                };
            } else {
                if (args.length) {
                    return function () {
                        var scopeArgs = args.concat(argsToArray(arguments));
                        return method.apply(scope, scopeArgs);
                    };
                } else {

                    return function () {
                        return method.apply(scope, arguments);
                    };
                }
            }
        }


        function applyFirst(method, args) {
            args = argsToArray(arguments, 1);
            if (!isString(method) && !isFunction(method)) {
                throw new Error(method + " must be the name of a property or function to execute");
            }
            if (isString(method)) {
                return function () {
                    var scopeArgs = argsToArray(arguments), scope = scopeArgs.shift();
                    var func = scope[method];
                    if (isFunction(func)) {
                        scopeArgs = args.concat(scopeArgs);
                        return func.apply(scope, scopeArgs);
                    } else {
                        return func;
                    }
                };
            } else {
                return function () {
                    var scopeArgs = argsToArray(arguments), scope = scopeArgs.shift();
                    scopeArgs = args.concat(scopeArgs);
                    return method.apply(scope, scopeArgs);
                };
            }
        }


        function hitchIgnore(scope, method, args) {
            args = argsToArray(arguments, 2);
            if ((isString(method) && !(method in scope))) {
                throw new Error(method + " property not defined in scope");
            } else if (!isString(method) && !isFunction(method)) {
                throw new Error(method + " is not a function");
            }
            if (isString(method)) {
                return function () {
                    var func = scope[method];
                    if (isFunction(func)) {
                        return func.apply(scope, args);
                    } else {
                        return func;
                    }
                };
            } else {
                return function () {
                    return method.apply(scope, args);
                };
            }
        }


        function hitchAll(scope) {
            var funcs = argsToArray(arguments, 1);
            if (!isObject(scope) && !isFunction(scope)) {
                throw new TypeError("scope must be an object");
            }
            if (funcs.length === 1 && isArray(funcs[0])) {
                funcs = funcs[0];
            }
            if (!funcs.length) {
                funcs = [];
                for (var k in scope) {
                    if (scope.hasOwnProperty(k) && isFunction(scope[k])) {
                        funcs.push(k);
                    }
                }
            }
            for (var i = 0, l = funcs.length; i < l; i++) {
                scope[funcs[i]] = hitch(scope, scope[funcs[i]]);
            }
            return scope;
        }


        function partial(method, args) {
            args = argsToArray(arguments, 1);
            if (!isString(method) && !isFunction(method)) {
                throw new Error(method + " must be the name of a property or function to execute");
            }
            if (isString(method)) {
                return function () {
                    var func = this[method];
                    if (isFunction(func)) {
                        var scopeArgs = args.concat(argsToArray(arguments));
                        return func.apply(this, scopeArgs);
                    } else {
                        return func;
                    }
                };
            } else {
                return function () {
                    var scopeArgs = args.concat(argsToArray(arguments));
                    return method.apply(this, scopeArgs);
                };
            }
        }

        function curryFunc(f, execute) {
            return function () {
                var args = argsToArray(arguments);
                return execute ? f.apply(this, arguments) : function () {
                    return f.apply(this, args.concat(argsToArray(arguments)));
                };
            };
        }


        function curry(depth, cb, scope) {
            var f;
            if (scope) {
                f = hitch(scope, cb);
            } else {
                f = cb;
            }
            if (depth) {
                var len = depth - 1;
                for (var i = len; i >= 0; i--) {
                    f = curryFunc(f, i === len);
                }
            }
            return f;
        }

        return extended
            .define(isObject, {
                bind: hitch,
                bindAll: hitchAll,
                bindIgnore: hitchIgnore,
                curry: function (scope, depth, fn) {
                    return curry(depth, fn, scope);
                }
            })
            .define(isFunction, {
                bind: function (fn, obj) {
                    return hitch.apply(this, [obj, fn].concat(argsToArray(arguments, 2)));
                },
                bindIgnore: function (fn, obj) {
                    return hitchIgnore.apply(this, [obj, fn].concat(argsToArray(arguments, 2)));
                },
                partial: partial,
                applyFirst: applyFirst,
                curry: function (fn, num, scope) {
                    return curry(num, fn, scope);
                },
                noWrap: {
                    f: function () {
                        return this.value();
                    }
                }
            })
            .define(isString, {
                bind: function (str, scope) {
                    return hitch(scope, str);
                },
                bindIgnore: function (str, scope) {
                    return hitchIgnore(scope, str);
                },
                partial: partial,
                applyFirst: applyFirst,
                curry: function (fn, depth, scope) {
                    return curry(depth, fn, scope);
                }
            })
            .expose({
                bind: hitch,
                bindAll: hitchAll,
                bindIgnore: hitchIgnore,
                partial: partial,
                applyFirst: applyFirst,
                curry: curry
            });

    }

    if ("undefined" !== typeof exports) {
        if ("undefined" !== typeof module && module.exports) {
            module.exports = defineFunction(require("extended"), require("is-extended"));

        }
    } else if ("function" === typeof define) {
        define(["require"], function (require) {
            return defineFunction(require("extended"), require("is-extended"));
        });
    } else {
        this.functionExtended = defineFunction(this.extended, this.isExtended);
    }

}).call(this);







});

require.define("/node_modules/ht/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {"main":"index.js"}
});

require.define("/node_modules/ht/index.js",function(require,module,exports,__dirname,__filename,process,global){(function () {
    "use strict";

    function defineHt(_) {


        var hashFunction = function (key) {
            if (typeof key === "string") {
                return key;
            } else if (typeof key === "object") {
                return  key.hashCode ? key.hashCode() : "" + key;
            } else {
                return "" + key;
            }
        };

        var Bucket = _.declare({

            instance: {

                constructor: function () {
                    this.__entries = [];
                    this.__keys = [];
                    this.__values = [];
                },

                pushValue: function (key, value) {
                    this.__keys.push(key);
                    this.__values.push(value);
                    this.__entries.push({key: key, value: value});
                    return value;
                },

                remove: function (key) {
                    var ret = null, map = this.__entries, val, keys = this.__keys, vals = this.__values;
                    var i = map.length - 1;
                    for (; i >= 0; i--) {
                        if (!!(val = map[i]) && val.key === key) {
                            map.splice(i, 1);
                            keys.splice(i, 1);
                            vals.splice(i, 1);
                            return val.value;
                        }
                    }
                    return ret;
                },

                "set": function (key, value) {
                    var ret = null, map = this.__entries, vals = this.__values;
                    var i = map.length - 1;
                    for (; i >= 0; i--) {
                        var val = map[i];
                        if (val && key === val.key) {
                            vals[i] = value;
                            val.value = value;
                            ret = value;
                            break;
                        }
                    }
                    if (!ret) {
                        map.push({key: key, value: value});
                    }
                    return ret;
                },

                find: function (key) {
                    var ret = null, map = this.__entries, val;
                    var i = map.length - 1;
                    for (; i >= 0; i--) {
                        val = map[i];
                        if (val && key === val.key) {
                            ret = val.value;
                            break;
                        }
                    }
                    return ret;
                },

                getEntrySet: function () {
                    return this.__entries;
                },

                getKeys: function () {
                    return this.__keys;
                },

                getValues: function (arr) {
                    return this.__values;
                }
            }
        });

        return _.declare({

            instance: {

                constructor: function () {
                    this.__map = {};
                },

                entrySet: function () {
                    var ret = [], map = this.__map;
                    for (var i in map) {
                        if (map.hasOwnProperty(i)) {
                            ret = ret.concat(map[i].getEntrySet());
                        }
                    }
                    return ret;
                },

                put: function (key, value) {
                    var hash = hashFunction(key);
                    var bucket = null;
                    if (!(bucket = this.__map[hash])) {
                        bucket = (this.__map[hash] = new Bucket());
                    }
                    bucket.pushValue(key, value);
                    return value;
                },

                remove: function (key) {
                    var hash = hashFunction(key), ret = null;
                    var bucket = this.__map[hash];
                    if (bucket) {
                        ret = bucket.remove(key);
                    }
                    return ret;
                },

                "get": function (key) {
                    var hash = hashFunction(key), ret = null, bucket;
                    if (!!(bucket = this.__map[hash])) {
                        ret = bucket.find(key);
                    }
                    return ret;
                },

                "set": function (key, value) {
                    var hash = hashFunction(key), ret = null, bucket = null, map = this.__map;
                    if (!!(bucket = map[hash])) {
                        ret = bucket.set(key, value);
                    } else {
                        ret = (map[hash] = new Bucket()).pushValue(key, value);
                    }
                    return ret;
                },

                contains: function (key) {
                    var hash = hashFunction(key), ret = false, bucket = null;
                    if (!!(bucket = this.__map[hash])) {
                        ret = !!(bucket.find(key));
                    }
                    return ret;
                },

                concat: function (hashTable) {
                    if (hashTable instanceof this._static) {
                        var ret = new this._static();
                        var otherEntrySet = hashTable.entrySet().concat(this.entrySet());
                        for (var i = otherEntrySet.length - 1; i >= 0; i--) {
                            var e = otherEntrySet[i];
                            ret.put(e.key, e.value);
                        }
                        return ret;
                    } else {
                        throw new TypeError("When joining hashtables the joining arg must be a HashTable");
                    }
                },

                filter: function (cb, scope) {
                    var es = this.entrySet(), ret = new this._static();
                    es = _.filter(es, cb, scope);
                    for (var i = es.length - 1; i >= 0; i--) {
                        var e = es[i];
                        ret.put(e.key, e.value);
                    }
                    return ret;
                },

                forEach: function (cb, scope) {
                    var es = this.entrySet();
                    _.forEach(es, cb, scope);
                },

                every: function (cb, scope) {
                    var es = this.entrySet();
                    return _.every(es, cb, scope);
                },

                map: function (cb, scope) {
                    var es = this.entrySet();
                    return _.map(es, cb, scope);
                },

                some: function (cb, scope) {
                    var es = this.entrySet();
                    return _.some(es, cb, scope);
                },

                reduce: function (cb, scope) {
                    var es = this.entrySet();
                    return _.reduce(es, cb, scope);
                },

                reduceRight: function (cb, scope) {
                    var es = this.entrySet();
                    return _.reduceRight(es, cb, scope);
                },

                clear: function () {
                    this.__map = {};
                },

                keys: function () {
                    var ret = [], map = this.__map;
                    for (var i in map) {
                        //if (map.hasOwnProperty(i)) {
                        ret = ret.concat(map[i].getKeys());
                        //}
                    }
                    return ret;
                },

                values: function () {
                    var ret = [], map = this.__map;
                    for (var i in map) {
                        //if (map.hasOwnProperty(i)) {
                        ret = ret.concat(map[i].getValues());
                        //}
                    }
                    return ret;
                },

                isEmpty: function () {
                    return this.keys().length === 0;
                }
            }

        });


    }

    if ("undefined" !== typeof exports) {
        if ("undefined" !== typeof module && module.exports) {
            module.exports = defineHt(require("extended")().register("declare", require("declare.js")).register(require("is-extended")).register(require("array-extended")));

        }
    } else if ("function" === typeof define) {
        define(["extended", "declare", "is-extended", "array-extended"], function (extended, declare, is, array) {
            return defineHt(extended().register("declare", declare).register(is).register(array));
        });
    } else {
        this.Ht = defineHt(this.extended().register("declare", this.declare).register(this.isExtended).register(this.arrayExtended));
    }

}).call(this);







});

require.define("/node_modules/ht/node_modules/extended/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {"main":"index.js"}
});

require.define("/node_modules/ht/node_modules/extended/index.js",function(require,module,exports,__dirname,__filename,process,global){(function () {
    "use strict";
    /*global extender isa, dateExtended*/

    function defineExtended(extender, require) {


        var merge = (function merger() {
            function _merge(target, source) {
                var name, s;
                for (name in source) {
                    if (source.hasOwnProperty(name)) {
                        s = source[name];
                        if (!(name in target) || (target[name] !== s)) {
                            target[name] = s;
                        }
                    }
                }
                return target;
            }

            return function merge(obj) {
                if (!obj) {
                    obj = {};
                }
                for (var i = 1, l = arguments.length; i < l; i++) {
                    _merge(obj, arguments[i]);
                }
                return obj; // Object
            };
        }());

        function getExtended() {

            var loaded = {};


            //getInitial instance;
            var extended = extender.define();
            extended.expose({
                register: function register(alias, extendWith) {
                    if (!extendWith) {
                        extendWith = alias;
                        alias = null;
                    }
                    var type = typeof extendWith;
                    if (alias) {
                        extended[alias] = extendWith;
                    } else if (extendWith && type === "function") {
                        extended.extend(extendWith);
                    } else if (type === "object") {
                        extended.expose(extendWith);
                    } else {
                        throw new TypeError("extended.register must be called with an extender function");
                    }
                    return extended;
                },

                define: function () {
                    return extender.define.apply(extender, arguments);
                }
            });

            return extended;
        }

        function extended() {
            return getExtended();
        }

        extended.define = function define() {
            return extender.define.apply(extender, arguments);
        };

        return extended;
    }

    if ("undefined" !== typeof exports) {
        if ("undefined" !== typeof module && module.exports) {
            module.exports = defineExtended(require("extender"), require);

        }
    } else if ("function" === typeof define) {
        define(["require"], function (require) {
            return defineExtended(require("extender"), require);
        });
    } else {
        this.extended = defineExtended(this.extender);
    }

}).call(this);







});

require.define("/node_modules/ht/node_modules/extended/node_modules/extender/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {"main":"index.js"}
});

require.define("/node_modules/ht/node_modules/extended/node_modules/extender/index.js",function(require,module,exports,__dirname,__filename,process,global){module.exports = require("./extender.js");
});

require.define("/node_modules/ht/node_modules/extended/node_modules/extender/extender.js",function(require,module,exports,__dirname,__filename,process,global){(function () {
    /*jshint strict:false*/


    /**
     *
     * @projectName extender
     * @github http://github.com/doug-martin/extender
     * @header
     * [![build status](https://secure.travis-ci.org/doug-martin/extender.png)](http://travis-ci.org/doug-martin/extender)
     * # Extender
     *
     * `extender` is a library that helps in making chainable APIs, by creating a function that accepts different values and returns an object decorated with functions based on the type.
     *
     * ## Why Is Extender Different?
     *
     * Extender is different than normal chaining because is does more than return `this`. It decorates your values in a type safe manner.
     *
     * For example if you return an array from a string based method then the returned value will be decorated with array methods and not the string methods. This allow you as the developer to focus on your API and not worrying about how to properly build and connect your API.
     *
     *
     * ## Installation
     *
     * ```
     * npm install extender
     * ```
     *
     * Or [download the source](https://raw.github.com/doug-martin/extender/master/extender.js) ([minified](https://raw.github.com/doug-martin/extender/master/extender-min.js))
     *
     * **Note** `extender` depends on [`declare.js`](http://doug-martin.github.com/declare.js/).
     *
     * ### Requirejs
     *
     * To use with requirejs place the `extend` source in the root scripts directory
     *
     * ```javascript
     *
     * define(["extender"], function(extender){
     * });
     *
     * ```
     *
     *
     * ## Usage
     *
     * **`extender.define(tester, decorations)`**
     *
     * To create your own extender call the `extender.define` function.
     *
     * This function accepts an optional tester which is used to determine a value should be decorated with the specified `decorations`
     *
     * ```javascript
     * function isString(obj) {
     *     return !isUndefinedOrNull(obj) && (typeof obj === "string" || obj instanceof String);
     * }
     *
     *
     * var myExtender = extender.define(isString, {
     *		multiply: function (str, times) {
     *			var ret = str;
     *			for (var i = 1; i < times; i++) {
     *				ret += str;
     *			}
     *			return ret;
     *		},
     *		toArray: function (str, delim) {
     *			delim = delim || "";
     *			return str.split(delim);
     *		}
     *	});
     *
     * myExtender("hello").multiply(2).value(); //hellohello
     *
     * ```
     *
     * If you do not specify a tester function and just pass in an object of `functions` then all values passed in will be decorated with methods.
     *
     * ```javascript
     *
     * function isUndefined(obj) {
     *     var undef;
     *     return obj === undef;
     * }
     *
     * function isUndefinedOrNull(obj) {
     *	var undef;
     *     return obj === undef || obj === null;
     * }
     *
     * function isArray(obj) {
     *     return Object.prototype.toString.call(obj) === "[object Array]";
     * }
     *
     * function isBoolean(obj) {
     *     var undef, type = typeof obj;
     *     return !isUndefinedOrNull(obj) && type === "boolean" || type === "Boolean";
     * }
     *
     * function isString(obj) {
     *     return !isUndefinedOrNull(obj) && (typeof obj === "string" || obj instanceof String);
     * }
     *
     * var myExtender = extender.define({
     *	isUndefined : isUndefined,
     *	isUndefinedOrNull : isUndefinedOrNull,
     *	isArray : isArray,
     *	isBoolean : isBoolean,
     *	isString : isString
     * });
     *
     * ```
     *
     * To use
     *
     * ```
     * var undef;
     * myExtender("hello").isUndefined().value(); //false
     * myExtender(undef).isUndefined().value(); //true
     * ```
     *
     * You can also chain extenders so that they accept multiple types and decorates accordingly.
     *
     * ```javascript
     * myExtender
     *     .define(isArray, {
     *		pluck: function (arr, m) {
     *			var ret = [];
     *			for (var i = 0, l = arr.length; i < l; i++) {
     *				ret.push(arr[i][m]);
     *			}
     *			return ret;
     *		}
     *	})
     *     .define(isBoolean, {
     *		invert: function (val) {
     *			return !val;
     *		}
     *	});
     *
     * myExtender([{a: "a"},{a: "b"},{a: "c"}]).pluck("a").value(); //["a", "b", "c"]
     * myExtender("I love javascript!").toArray(/\s+/).pluck("0"); //["I", "l", "j"]
     *
     * ```
     *
     * Notice that we reuse the same extender as defined above.
     *
     * **Return Values**
     *
     * When creating an extender if you return a value from one of the decoration functions then that value will also be decorated. If you do not return any values then the extender will be returned.
     *
     * **Default decoration methods**
     *
     * By default every value passed into an extender is decorated with the following methods.
     *
     * * `value` : The value this extender represents.
     * * `eq(otherValue)` : Tests strict equality of the currently represented value to the `otherValue`
     * * `neq(oterValue)` : Tests strict inequality of the currently represented value.
     * * `print` : logs the current value to the console.
     *
     * **Extender initialization**
     *
     * When creating an extender you can also specify a constructor which will be invoked with the current value.
     *
     * ```javascript
     * myExtender.define(isString, {
     *	constructor : function(val){
     *     //set our value to the string trimmed
     *		this._value = val.trimRight().trimLeft();
     *	}
     * });
     * ```
     *
     * **`noWrap`**
     *
     * `extender` also allows you to specify methods that should not have the value wrapped providing a cleaner exit function other than `value()`.
     *
     * For example suppose you have an API that allows you to build a validator, rather than forcing the user to invoke the `value` method you could add a method called `validator` which makes more syntactic sense.
     *
     * ```
     *
     * var myValidator = extender.define({
     *     //chainable validation methods
     *     //...
     *     //end chainable validation methods
     *
     *     noWrap : {
     *         validator : function(){
     *             //return your validator
     *         }
     *     }
     * });
     *
     * myValidator().isNotNull().isEmailAddress().validator(); //now you dont need to call .value()
     *
     *
     * ```
     * **`extender.extend(extendr)`**
     *
     * You may also compose extenders through the use of `extender.extend(extender)`, which will return an entirely new extender that is the composition of extenders.
     *
     * Suppose you have the following two extenders.
     *
     * ```javascript
     * var myExtender = extender
     *        .define({
     *            isFunction: is.function,
     *            isNumber: is.number,
     *            isString: is.string,
     *            isDate: is.date,
     *            isArray: is.array,
     *            isBoolean: is.boolean,
     *            isUndefined: is.undefined,
     *            isDefined: is.defined,
     *            isUndefinedOrNull: is.undefinedOrNull,
     *            isNull: is.null,
     *            isArguments: is.arguments,
     *            isInstanceOf: is.instanceOf,
     *            isRegExp: is.regExp
     *        });
     * var myExtender2 = extender.define(is.array, {
     *     pluck: function (arr, m) {
     *         var ret = [];
     *         for (var i = 0, l = arr.length; i < l; i++) {
     *             ret.push(arr[i][m]);
     *         }
     *         return ret;
     *     },
     *
     *     noWrap: {
     *         pluckPlain: function (arr, m) {
     *             var ret = [];
     *             for (var i = 0, l = arr.length; i < l; i++) {
     *                 ret.push(arr[i][m]);
     *             }
     *             return ret;
     *         }
     *     }
     * });
     *
     *
     * ```
     *
     * And you do not want to alter either of them but instead what to create a third that is the union of the two.
     *
     *
     * ```javascript
     * var composed = extender.extend(myExtender).extend(myExtender2);
     * ```
     * So now you can use the new extender with the joined functionality if `myExtender` and `myExtender2`.
     *
     * ```javascript
     * var extended = composed([
     *      {a: "a"},
     *      {a: "b"},
     *      {a: "c"}
     * ]);
     * extended.isArray().value(); //true
     * extended.pluck("a").value(); // ["a", "b", "c"]);
     *
     * ```
     *
     * **Note** `myExtender` and `myExtender2` will **NOT** be altered.
     *
     * **`extender.expose(methods)`**
     *
     * The `expose` method allows you to add methods to your extender that are not wrapped or automatically chained by exposing them on the extender directly.
     *
     * ```
     * var isMethods = {
     *      isFunction: is.function,
     *      isNumber: is.number,
     *      isString: is.string,
     *      isDate: is.date,
     *      isArray: is.array,
     *      isBoolean: is.boolean,
     *      isUndefined: is.undefined,
     *      isDefined: is.defined,
     *      isUndefinedOrNull: is.undefinedOrNull,
     *      isNull: is.null,
     *      isArguments: is.arguments,
     *      isInstanceOf: is.instanceOf,
     *      isRegExp: is.regExp
     * };
     *
     * var myExtender = extender.define(isMethods).expose(isMethods);
     *
     * myExtender.isArray([]); //true
     * myExtender([]).isArray([]).value(); //true
     *
     * ```
     *
     *
     * **Using `instanceof`**
     *
     * When using extenders you can test if a value is an `instanceof` of an extender by using the instanceof operator.
     *
     * ```javascript
     * var str = myExtender("hello");
     *
     * str instanceof myExtender; //true
     * ```
     *
     * ## Examples
     *
     * To see more examples click [here](https://github.com/doug-martin/extender/tree/master/examples)
     */
    function defineExtender(declare) {


        var slice = Array.prototype.slice, undef;

        function indexOf(arr, item) {
            if (arr && arr.length) {
                for (var i = 0, l = arr.length; i < l; i++) {
                    if (arr[i] === item) {
                        return i;
                    }
                }
            }
            return -1;
        }

        function isArray(obj) {
            return Object.prototype.toString.call(obj) === "[object Array]";
        }

        var merge = (function merger() {
            function _merge(target, source, exclude) {
                var name, s;
                for (name in source) {
                    if (source.hasOwnProperty(name) && indexOf(exclude, name) === -1) {
                        s = source[name];
                        if (!(name in target) || (target[name] !== s)) {
                            target[name] = s;
                        }
                    }
                }
                return target;
            }

            return function merge(obj) {
                if (!obj) {
                    obj = {};
                }
                var l = arguments.length;
                var exclude = arguments[arguments.length - 1];
                if (isArray(exclude)) {
                    l--;
                } else {
                    exclude = [];
                }
                for (var i = 1; i < l; i++) {
                    _merge(obj, arguments[i], exclude);
                }
                return obj; // Object
            };
        }());


        function extender(supers) {
            supers = supers || [];
            var Base = declare({
                instance: {
                    constructor: function (value) {
                        this._value = value;
                    },

                    value: function () {
                        return this._value;
                    },

                    eq: function eq(val) {
                        return this["__extender__"](this._value === val);
                    },

                    neq: function neq(other) {
                        return this["__extender__"](this._value !== other);
                    },
                    print: function () {
                        console.log(this._value);
                        return this;
                    }
                }
            }), defined = [];

            function addMethod(proto, name, func) {
                if ("function" !== typeof func) {
                    throw new TypeError("when extending type you must provide a function");
                }
                var extendedMethod;
                if (name === "constructor") {
                    extendedMethod = function () {
                        this._super(arguments);
                        func.apply(this, arguments);
                    };
                } else {
                    extendedMethod = function extendedMethod() {
                        var args = slice.call(arguments);
                        args.unshift(this._value);
                        var ret = func.apply(this, args);
                        return ret !== undef ? this["__extender__"](ret) : this;
                    };
                }
                proto[name] = extendedMethod;
            }

            function addNoWrapMethod(proto, name, func) {
                if ("function" !== typeof func) {
                    throw new TypeError("when extending type you must provide a function");
                }
                var extendedMethod;
                if (name === "constructor") {
                    extendedMethod = function () {
                        this._super(arguments);
                        func.apply(this, arguments);
                    };
                } else {
                    extendedMethod = function extendedMethod() {
                        var args = slice.call(arguments);
                        args.unshift(this._value);
                        return func.apply(this, args);
                    };
                }
                proto[name] = extendedMethod;
            }

            function decorateProto(proto, decoration, nowrap) {
                for (var i in decoration) {
                    if (decoration.hasOwnProperty(i)) {
                        if (i !== "getters" && i !== "setters") {
                            if (i === "noWrap") {
                                decorateProto(proto, decoration[i], true);
                            } else if (nowrap) {
                                addNoWrapMethod(proto, i, decoration[i]);
                            } else {
                                addMethod(proto, i, decoration[i]);
                            }
                        } else {
                            proto[i] = decoration[i];
                        }
                    }
                }
            }

            function _extender(obj) {
                var ret = obj, i, l;
                if (!(obj instanceof Base)) {
                    var OurBase = Base;
                    for (i = 0, l = defined.length; i < l; i++) {
                        var definer = defined[i];
                        if (definer[0](obj)) {
                            OurBase = OurBase.extend({instance: definer[1]});
                        }
                    }
                    ret = new OurBase(obj);
                    ret["__extender__"] = _extender;
                }
                return ret;
            }

            function always() {
                return true;
            }

            function define(tester, decorate) {
                if (arguments.length) {
                    if (typeof tester === "object") {
                        decorate = tester;
                        tester = always;
                    }
                    decorate = decorate || {};
                    var proto = {};
                    decorateProto(proto, decorate);
                    //handle browsers like which skip over the constructor while looping
                    if (!proto.hasOwnProperty("constructor")) {
                        if (decorate.hasOwnProperty("constructor")) {
                            addMethod(proto, "constructor", decorate.constructor);
                        } else {
                            proto.constructor = function () {
                                this._super(arguments);
                            };
                        }
                    }
                    defined.push([tester, proto]);
                }
                return _extender;
            }

            function extend(supr) {
                if (supr && supr.hasOwnProperty("__defined__")) {
                    _extender["__defined__"] = defined = defined.concat(supr["__defined__"]);
                }
                merge(_extender, supr, ["define", "extend", "expose", "__defined__"]);
                return _extender;
            }

            _extender.define = define;
            _extender.extend = extend;
            _extender.expose = function expose() {
                var methods;
                for (var i = 0, l = arguments.length; i < l; i++) {
                    methods = arguments[i];
                    if (typeof methods === "object") {
                        merge(_extender, methods, ["define", "extend", "expose", "__defined__"]);
                    }
                }
                return _extender;
            };
            _extender["__defined__"] = defined;


            return _extender;
        }

        return {
            define: function () {
                return extender().define.apply(extender, arguments);
            },

            extend: function (supr) {
                return extender().define().extend(supr);
            }
        };

    }

    if ("undefined" !== typeof exports) {
        if ("undefined" !== typeof module && module.exports) {
            module.exports = defineExtender(require("declare.js"));

        }
    } else if ("function" === typeof define) {
        define(["require"], function (require) {
            return defineExtender((require("declare.js")));
        });
    } else {
        this.extender = defineExtender(this.declare);
    }

}).call(this);
});

require.define("/node_modules/ht/node_modules/declare.js/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {"main":"index.js"}
});

require.define("/node_modules/ht/node_modules/declare.js/index.js",function(require,module,exports,__dirname,__filename,process,global){module.exports = require("./declare.js");
});

require.define("/node_modules/ht/node_modules/declare.js/declare.js",function(require,module,exports,__dirname,__filename,process,global){(function () {

    /**
     * @projectName declare
     * @github http://github.com/doug-martin/declare.js
     * @header
     *
     * Declare is a library designed to allow writing object oriented code the same way in both the browser and node.js.
     *
     * ##Installation
     *
     * `npm install declare.js`
     *
     * Or [download the source](https://raw.github.com/doug-martin/declare.js/master/declare.js) ([minified](https://raw.github.com/doug-martin/declare.js/master/declare-min.js))
     *
     * ###Requirejs
     *
     * To use with requirejs place the `declare` source in the root scripts directory
     *
     * ```
     *
     * define(["declare"], function(declare){
     *      return declare({
     *          instance : {
     *              hello : function(){
     *                  return "world";
     *              }
     *          }
     *      });
     * });
     *
     * ```
     *
     *
     * ##Usage
     *
     * declare.js provides
     *
     * Class methods
     *
     * * `as(module | object, name)` : exports the object to module or the object with the name
     * * `mixin(mixin)` : mixes in an object but does not inherit directly from the object. **Note** this does not return a new class but changes the original class.
     * * `extend(proto)` : extend a class with the given properties. A shortcut to `declare(Super, {})`;
     *
     * Instance methods
     *
     * * `_super(arguments)`: calls the super of the current method, you can pass in either the argments object or an array with arguments you want passed to super
     * * `_getSuper()`: returns a this methods direct super.
     * * `_static` : use to reference class properties and methods.
     * * `get(prop)` : gets a property invoking the getter if it exists otherwise it just returns the named property on the object.
     * * `set(prop, val)` : sets a property invoking the setter if it exists otherwise it just sets the named property on the object.
     *
     *
     * ###Declaring a new Class
     *
     * Creating a new class with declare is easy!
     *
     * ```
     *
     * var Mammal = declare({
     *      //define your instance methods and properties
     *      instance : {
     *
     *          //will be called whenever a new instance is created
     *          constructor: function(options) {
     *              options = options || {};
     *              this._super(arguments);
     *              this._type = options.type || "mammal";
     *          },
     *
     *          speak : function() {
     *              return  "A mammal of type " + this._type + " sounds like";
     *          },
     *
     *          //Define your getters
     *          getters : {
     *
     *              //can be accessed by using the get method. (mammal.get("type"))
     *              type : function() {
     *                  return this._type;
     *              }
     *          },
     *
     *           //Define your setters
     *          setters : {
     *
     *                //can be accessed by using the set method. (mammal.set("type", "mammalType"))
     *              type : function(t) {
     *                  this._type = t;
     *              }
     *          }
     *      },
     *
     *      //Define your static methods
     *      static : {
     *
     *          //Mammal.soundOff(); //"Im a mammal!!"
     *          soundOff : function() {
     *              return "Im a mammal!!";
     *          }
     *      }
     * });
     *
     *
     * ```
     *
     * You can use Mammal just like you would any other class.
     *
     * ```
     * Mammal.soundOff("Im a mammal!!");
     *
     * var myMammal = new Mammal({type : "mymammal"});
     * myMammal.speak(); // "A mammal of type mymammal sounds like"
     * myMammal.get("type"); //"mymammal"
     * myMammal.set("type", "mammal");
     * myMammal.get("type"); //"mammal"
     *
     *
     * ```
     *
     * ###Extending a class
     *
     * If you want to just extend a single class use the .extend method.
     *
     * ```
     *
     * var Wolf = Mammal.extend({
     *
     *   //define your instance method
     *   instance: {
     *
     *        //You can override super constructors just be sure to call `_super`
     *       constructor: function(options) {
     *          options = options || {};
     *          this._super(arguments); //call our super constructor.
     *          this._sound = "growl";
     *          this._color = options.color || "grey";
     *      },
     *
     *      //override Mammals `speak` method by appending our own data to it.
     *      speak : function() {
     *          return this._super(arguments) + " a " + this._sound;
     *      },
     *
     *      //add new getters for sound and color
     *      getters : {
     *
     *           //new Wolf().get("type")
     *           //notice color is read only as we did not define a setter
     *          color : function() {
     *              return this._color;
     *          },
     *
     *          //new Wolf().get("sound")
     *          sound : function() {
     *              return this._sound;
     *          }
     *      },
     *
     *      setters : {
     *
     *          //new Wolf().set("sound", "howl")
     *          sound : function(s) {
     *              this._sound = s;
     *          }
     *      }
     *
     *  },
     *
     *  static : {
     *
     *      //You can override super static methods also! And you can still use _super
     *      soundOff : function() {
     *          //You can even call super in your statics!!!
     *          //should return "I'm a mammal!! that growls"
     *          return this._super(arguments) + " that growls";
     *      }
     *  }
     * });
     *
     * Wolf.soundOff(); //Im a mammal!! that growls
     *
     * var myWolf = new Wolf();
     * myWolf instanceof Mammal //true
     * myWolf instanceof Wolf //true
     *
     * ```
     *
     * You can also extend a class by using the declare method and just pass in the super class.
     *
     * ```
     * //Typical hierarchical inheritance
     * // Mammal->Wolf->Dog
     * var Dog = declare(Wolf, {
     *    instance: {
     *        constructor: function(options) {
     *            options = options || {};
     *            this._super(arguments);
     *            //override Wolfs initialization of sound to woof.
     *            this._sound = "woof";
     *
     *        },
     *
     *        speak : function() {
     *            //Should return "A mammal of type mammal sounds like a growl thats domesticated"
     *            return this._super(arguments) + " thats domesticated";
     *        }
     *    },
     *
     *    static : {
     *        soundOff : function() {
     *            //should return "I'm a mammal!! that growls but now barks"
     *            return this._super(arguments) + " but now barks";
     *        }
     *    }
     * });
     *
     * Dog.soundOff(); //Im a mammal!! that growls but now barks
     *
     * var myDog = new Dog();
     * myDog instanceof Mammal //true
     * myDog instanceof Wolf //true
     * myDog instanceof Dog //true
     *
     *
     * //Notice you still get the extend method.
     *
     * // Mammal->Wolf->Dog->Breed
     * var Breed = Dog.extend({
     *    instance: {
     *
     *        //initialize outside of constructor
     *        _pitch : "high",
     *
     *        constructor: function(options) {
     *            options = options || {};
     *            this._super(arguments);
     *            this.breed = options.breed || "lab";
     *        },
     *
     *        speak : function() {
     *            //Should return "A mammal of type mammal sounds like a
     *            //growl thats domesticated with a high pitch!"
     *            return this._super(arguments) + " with a " + this._pitch + " pitch!";
     *        },
     *
     *        getters : {
     *            pitch : function() {
     *                return this._pitch;
     *            }
     *        }
     *    },
     *
     *    static : {
     *        soundOff : function() {
     *            //should return "I'M A MAMMAL!! THAT GROWLS BUT NOW BARKS!"
     *            return this._super(arguments).toUpperCase() + "!";
     *        }
     *    }
     * });
     *
     *
     * Breed.soundOff()//"IM A MAMMAL!! THAT GROWLS BUT NOW BARKS!"
     *
     * var myBreed = new Breed({color : "gold", type : "lab"}),
     * myBreed instanceof Dog //true
     * myBreed instanceof Wolf //true
     * myBreed instanceof Mammal //true
     * myBreed.speak() //"A mammal of type lab sounds like a woof thats domesticated with a high pitch!"
     * myBreed.get("type") //"lab"
     * myBreed.get("color") //"gold"
     * myBreed.get("sound")" //"woof"
     * ```
     *
     * ###Multiple Inheritance / Mixins
     *
     * declare also allows the use of multiple super classes.
     * This is useful if you have generic classes that provide functionality but shouldnt be used on their own.
     *
     * Lets declare a mixin that allows us to watch for property changes.
     *
     * ```
     * //Notice that we set up the functions outside of declare because we can reuse them
     *
     * function _set(prop, val) {
     *     //get the old value
     *     var oldVal = this.get(prop);
     *     //call super to actually set the property
     *     var ret = this._super(arguments);
     *     //call our handlers
     *     this.__callHandlers(prop, oldVal, val);
     *     return ret;
     * }
     *
     * function _callHandlers(prop, oldVal, newVal) {
     *    //get our handlers for the property
     *     var handlers = this.__watchers[prop], l;
     *     //if the handlers exist and their length does not equal 0 then we call loop through them
     *     if (handlers && (l = handlers.length) !== 0) {
     *         for (var i = 0; i < l; i++) {
     *             //call the handler
     *             handlers[i].call(null, prop, oldVal, newVal);
     *         }
     *     }
     * }
     *
     *
     * //the watch function
     * function _watch(prop, handler) {
     *     if ("function" !== typeof handler) {
     *         //if its not a function then its an invalid handler
     *         throw new TypeError("Invalid handler.");
     *     }
     *     if (!this.__watchers[prop]) {
     *         //create the watchers if it doesnt exist
     *         this.__watchers[prop] = [handler];
     *     } else {
     *         //otherwise just add it to the handlers array
     *         this.__watchers[prop].push(handler);
     *     }
     * }
     *
     * function _unwatch(prop, handler) {
     *     if ("function" !== typeof handler) {
     *         throw new TypeError("Invalid handler.");
     *     }
     *     var handlers = this.__watchers[prop], index;
     *     if (handlers && (index = handlers.indexOf(handler)) !== -1) {
     *        //remove the handler if it is found
     *         handlers.splice(index, 1);
     *     }
     * }
     *
     * declare({
     *     instance:{
     *         constructor:function () {
     *             this._super(arguments);
     *             //set up our watchers
     *             this.__watchers = {};
     *         },
     *
     *         //override the default set function so we can watch values
     *         "set":_set,
     *         //set up our callhandlers function
     *         __callHandlers:_callHandlers,
     *         //add the watch function
     *         watch:_watch,
     *         //add the unwatch function
     *         unwatch:_unwatch
     *     },
     *
     *     "static":{
     *
     *         init:function () {
     *             this._super(arguments);
     *             this.__watchers = {};
     *         },
     *         //override the default set function so we can watch values
     *         "set":_set,
     *         //set our callHandlers function
     *         __callHandlers:_callHandlers,
     *         //add the watch
     *         watch:_watch,
     *         //add the unwatch function
     *         unwatch:_unwatch
     *     }
     * })
     *
     * ```
     *
     * Now lets use the mixin
     *
     * ```
     * var WatchDog = declare([Dog, WatchMixin]);
     *
     * var watchDog = new WatchDog();
     * //create our handler
     * function watch(id, oldVal, newVal) {
     *     console.log("watchdog's %s was %s, now %s", id, oldVal, newVal);
     * }
     *
     * //watch for property changes
     * watchDog.watch("type", watch);
     * watchDog.watch("color", watch);
     * watchDog.watch("sound", watch);
     *
     * //now set the properties each handler will be called
     * watchDog.set("type", "newDog");
     * watchDog.set("color", "newColor");
     * watchDog.set("sound", "newSound");
     *
     *
     * //unwatch the property changes
     * watchDog.unwatch("type", watch);
     * watchDog.unwatch("color", watch);
     * watchDog.unwatch("sound", watch);
     *
     * //no handlers will be called this time
     * watchDog.set("type", "newDog");
     * watchDog.set("color", "newColor");
     * watchDog.set("sound", "newSound");
     *
     *
     * ```
     *
     * ###Accessing static methods and properties witin an instance.
     *
     * To access static properties on an instance use the `_static` property which is a reference to your constructor.
     *
     * For example if your in your constructor and you want to have configurable default values.
     *
     * ```
     * consturctor : function constructor(opts){
     *     this.opts = opts || {};
     *     this._type = opts.type || this._static.DEFAULT_TYPE;
     * }
     * ```
     *
     *
     *
     * ###Creating a new instance of within an instance.
     *
     * Often times you want to create a new instance of an object within an instance. If your subclassed however you cannot return a new instance of the parent class as it will not be the right sub class. `declare` provides a way around this by setting the `_static` property on each isntance of the class.
     *
     * Lets add a reproduce method `Mammal`
     *
     * ```
     * reproduce : function(options){
     *     return new this._static(options);
     * }
     * ```
     *
     * Now in each subclass you can call reproduce and get the proper type.
     *
     * ```
     * var myDog = new Dog();
     * var myDogsChild = myDog.reproduce();
     *
     * myDogsChild instanceof Dog; //true
     * ```
     *
     * ###Using the `as`
     *
     * `declare` also provides an `as` method which allows you to add your class to an object or if your using node.js you can pass in `module` and the class will be exported as the module.
     *
     * ```
     * var animals = {};
     *
     * Mammal.as(animals, "Dog");
     * Wolf.as(animals, "Wolf");
     * Dog.as(animals, "Dog");
     * Breed.as(animals, "Breed");
     *
     * var myDog = new animals.Dog();
     *
     * ```
     *
     * Or in node
     *
     * ```
     * Mammal.as(exports, "Dog");
     * Wolf.as(exports, "Wolf");
     * Dog.as(exports, "Dog");
     * Breed.as(exports, "Breed");
     *
     * ```
     *
     * To export a class as the `module` in node
     *
     * ```
     * Mammal.as(module);
     * ```
     *
     *
     */
    function createDeclared() {
        var arraySlice = Array.prototype.slice, classCounter = 0, Base, forceNew = new Function();

        function argsToArray(args, slice) {
            slice = slice || 0;
            return arraySlice.call(args, slice);
        }

        function isArray(obj) {
            return Object.prototype.toString.call(obj) === "[object Array]";
        }

        function isObject(obj) {
            var undef;
            return obj !== null && obj !== undef && typeof obj === "object";
        }

        function isHash(obj) {
            var ret = isObject(obj);
            return ret && obj.constructor === Object;
        }

        function indexOf(arr, item) {
            if (arr && arr.length) {
                for (var i = 0, l = arr.length; i < l; i++) {
                    if (arr[i] === item) {
                        return i;
                    }
                }
            }
            return -1;
        }

        function merge(target, source, exclude) {
            var name, s;
            for (name in source) {
                if (source.hasOwnProperty(name) && indexOf(exclude, name) === -1) {
                    s = source[name];
                    if (!(name in target) || (target[name] !== s)) {
                        target[name] = s;
                    }
                }
            }
            return target;
        }

        function callSuper(args, a) {
            var meta = this.__meta,
                supers = meta.supers,
                l = supers.length, superMeta = meta.superMeta, pos = superMeta.pos;
            if (l > pos) {
                a && (args = a);
                var name = superMeta.name, f = superMeta.f, m;
                do {
                    m = supers[pos][name];
                    if ("function" === typeof m && (m = m._f || m) !== f) {
                        superMeta.pos = 1 + pos;
                        return m.apply(this, args);
                    }
                } while (l > ++pos);
            }
            return null;
        }

        function getSuper() {
            var meta = this.__meta,
                supers = meta.supers,
                l = supers.length, superMeta = meta.superMeta, pos = superMeta.pos;
            if (l > pos) {
                var name = superMeta.name, f = superMeta.f, m;
                do {
                    m = supers[pos][name];
                    if ("function" === typeof m && (m = m._f || m) !== f) {
                        superMeta.pos = 1 + pos;
                        return m.bind(this);
                    }
                } while (l > ++pos);
            }
            return null;
        }

        function getter(name) {
            var getters = this.__getters__;
            if (getters.hasOwnProperty(name)) {
                return getters[name].apply(this);
            } else {
                return this[name];
            }
        }

        function setter(name, val) {
            var setters = this.__setters__;
            if (isHash(name)) {
                for (var i in name) {
                    var prop = name[i];
                    if (setters.hasOwnProperty(i)) {
                        setters[name].call(this, prop);
                    } else {
                        this[i] = prop;
                    }
                }
            } else {
                if (setters.hasOwnProperty(name)) {
                    return setters[name].apply(this, argsToArray(arguments, 1));
                } else {
                    return this[name] = val;
                }
            }
        }


        function defaultFunction() {
            var meta = this.__meta || {},
                supers = meta.supers,
                l = supers.length, superMeta = meta.superMeta, pos = superMeta.pos;
            if (l > pos) {
                var name = superMeta.name, f = superMeta.f, m;
                do {
                    m = supers[pos][name];
                    if ("function" === typeof m && (m = m._f || m) !== f) {
                        superMeta.pos = 1 + pos;
                        return m.apply(this, arguments);
                    }
                } while (l > ++pos);
            }
            return null;
        }


        function functionWrapper(f, name) {
            var wrapper = function wrapper() {
                var ret, meta = this.__meta || {};
                var orig = meta.superMeta;
                meta.superMeta = {f: f, pos: 0, name: name};
                ret = f.apply(this, arguments);
                meta.superMeta = orig;
                return ret;
            };
            wrapper._f = f;
            return wrapper;
        }

        function defineMixinProps(child, proto) {

            var operations = proto.setters || {}, __setters = child.__setters__, __getters = child.__getters__;
            for (var i in operations) {
                if (!__setters.hasOwnProperty(i)) {  //make sure that the setter isnt already there
                    __setters[i] = operations[i];
                }
            }
            operations = proto.getters || {};
            for (i in operations) {
                if (!__getters.hasOwnProperty(i)) {  //make sure that the setter isnt already there
                    __getters[i] = operations[i];
                }
            }
            for (var j in proto) {
                if (j != "getters" && j != "setters") {
                    var p = proto[j];
                    if ("function" === typeof p) {
                        if (!child.hasOwnProperty(j)) {
                            child[j] = functionWrapper(defaultFunction, j);
                        }
                    } else {
                        child[j] = p;
                    }
                }
            }
        }

        function mixin() {
            var args = argsToArray(arguments), l = args.length;
            var child = this.prototype;
            var childMeta = child.__meta, thisMeta = this.__meta, bases = child.__meta.bases, staticBases = bases.slice(),
                staticSupers = thisMeta.supers || [], supers = childMeta.supers || [];
            for (var i = 0; i < l; i++) {
                var m = args[i], mProto = m.prototype;
                var protoMeta = mProto.__meta, meta = m.__meta;
                !protoMeta && (protoMeta = (mProto.__meta = {proto: mProto || {}}));
                !meta && (meta = (m.__meta = {proto: m.__proto__ || {}}));
                defineMixinProps(child, protoMeta.proto || {});
                defineMixinProps(this, meta.proto || {});
                //copy the bases for static,

                mixinSupers(m.prototype, supers, bases);
                mixinSupers(m, staticSupers, staticBases);
            }
            return this;
        }

        function mixinSupers(sup, arr, bases) {
            var meta = sup.__meta;
            !meta && (meta = (sup.__meta = {}));
            var unique = sup.__meta.unique;
            !unique && (meta.unique = "declare" + ++classCounter);
            //check it we already have this super mixed into our prototype chain
            //if true then we have already looped their supers!
            if (indexOf(bases, unique) === -1) {
                //add their id to our bases
                bases.push(unique);
                var supers = sup.__meta.supers || [], i = supers.length - 1 || 0;
                while (i >= 0) {
                    mixinSupers(supers[i--], arr, bases);
                }
                arr.unshift(sup);
            }
        }

        function defineProps(child, proto) {
            var operations = proto.setters,
                __setters = child.__setters__,
                __getters = child.__getters__;
            if (operations) {
                for (var i in operations) {
                    __setters[i] = operations[i];
                }
            }
            operations = proto.getters || {};
            if (operations) {
                for (i in operations) {
                    __getters[i] = operations[i];
                }
            }
            for (i in proto) {
                if (i != "getters" && i != "setters") {
                    var f = proto[i];
                    if ("function" === typeof f) {
                        var meta = f.__meta || {};
                        if (!meta.isConstructor) {
                            child[i] = functionWrapper(f, i);
                        } else {
                            child[i] = f;
                        }
                    } else {
                        child[i] = f;
                    }
                }
            }

        }

        function _export(obj, name) {
            if (obj && name) {
                obj[name] = this;
            } else {
                obj.exports = obj = this;
            }
            return this;
        }

        function extend(proto) {
            return declare(this, proto);
        }

        function getNew(ctor) {
            // create object with correct prototype using a do-nothing
            // constructor
            forceNew.prototype = ctor.prototype;
            var t = new forceNew();
            forceNew.prototype = null;	// clean up
            return t;
        }


        function __declare(child, sup, proto) {
            var childProto = {}, supers = [];
            var unique = "declare" + ++classCounter, bases = [], staticBases = [];
            var instanceSupers = [], staticSupers = [];
            var meta = {
                supers: instanceSupers,
                unique: unique,
                bases: bases,
                superMeta: {
                    f: null,
                    pos: 0,
                    name: null
                }
            };
            var childMeta = {
                supers: staticSupers,
                unique: unique,
                bases: staticBases,
                isConstructor: true,
                superMeta: {
                    f: null,
                    pos: 0,
                    name: null
                }
            };

            if (isHash(sup) && !proto) {
                proto = sup;
                sup = Base;
            }

            if ("function" === typeof sup || isArray(sup)) {
                supers = isArray(sup) ? sup : [sup];
                sup = supers.shift();
                child.__meta = childMeta;
                childProto = getNew(sup);
                childProto.__meta = meta;
                childProto.__getters__ = merge({}, childProto.__getters__ || {});
                childProto.__setters__ = merge({}, childProto.__setters__ || {});
                child.__getters__ = merge({}, child.__getters__ || {});
                child.__setters__ = merge({}, child.__setters__ || {});
                mixinSupers(sup.prototype, instanceSupers, bases);
                mixinSupers(sup, staticSupers, staticBases);
            } else {
                child.__meta = childMeta;
                childProto.__meta = meta;
                childProto.__getters__ = childProto.__getters__ || {};
                childProto.__setters__ = childProto.__setters__ || {};
                child.__getters__ = child.__getters__ || {};
                child.__setters__ = child.__setters__ || {};
            }
            child.prototype = childProto;
            if (proto) {
                var instance = meta.proto = proto.instance || {};
                var stat = childMeta.proto = proto.static || {};
                stat.init = stat.init || defaultFunction;
                defineProps(childProto, instance);
                defineProps(child, stat);
                if (!instance.hasOwnProperty("constructor")) {
                    childProto.constructor = instance.constructor = functionWrapper(defaultFunction, "constructor");
                } else {
                    childProto.constructor = functionWrapper(instance.constructor, "constructor");
                }
            } else {
                meta.proto = {};
                childMeta.proto = {};
                child.init = functionWrapper(defaultFunction, "init");
                childProto.constructor = functionWrapper(defaultFunction, "constructor");
            }
            if (supers.length) {
                mixin.apply(child, supers);
            }
            if (sup) {
                //do this so we mixin our super methods directly but do not ov
                merge(child, merge(merge({}, sup), child));
            }
            childProto._super = child._super = callSuper;
            childProto._getSuper = child._getSuper = getSuper;
            childProto._static = child;
        }

        function declare(sup, proto) {
            function declared() {
                this.constructor.apply(this, arguments);
            }

            __declare(declared, sup, proto);
            return declared.init() || declared;
        }

        function singleton(sup, proto) {
            var retInstance;

            function declaredSingleton() {
                if (!retInstance) {
                    this.constructor.apply(this, arguments);
                    retInstance = this;
                }
                return retInstance;
            }

            __declare(declaredSingleton, sup, proto);
            return  declaredSingleton.init() || declaredSingleton;
        }

        Base = declare({
            instance: {
                "get": getter,
                "set": setter
            },

            "static": {
                "get": getter,
                "set": setter,
                mixin: mixin,
                extend: extend,
                as: _export
            }
        });

        declare.singleton = singleton;
        return declare;
    }

    if ("undefined" !== typeof exports) {
        if ("undefined" !== typeof module && module.exports) {
            module.exports = createDeclared();
        }
    } else if ("function" === typeof define) {
        define(createDeclared);
    } else {
        this.declare = createDeclared();
    }
}());




});

require.define("/node_modules/ht/node_modules/is-extended/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {"main":"index.js"}
});

require.define("/node_modules/ht/node_modules/is-extended/index.js",function(require,module,exports,__dirname,__filename,process,global){(function () {
    "use strict";

    function defineIsa(extended) {

        var undef, pSlice = Array.prototype.slice;

        function argsToArray(args, slice) {
            slice = slice || 0;
            return pSlice.call(args, slice);
        }

        function keys(obj) {
            var ret = [];
            for (var i in obj) {
                if (obj.hasOwnProperty(i)) {
                    ret.push(i);
                }
            }
            return ret;
        }

        //taken from node js assert.js
        //https://github.com/joyent/node/blob/master/lib/assert.js
        function deepEqual(actual, expected) {
            // 7.1. All identical values are equivalent, as determined by ===.
            if (actual === expected) {
                return true;

            } else if (typeof Buffer !== "undefined" && Buffer.isBuffer(actual) && Buffer.isBuffer(expected)) {
                if (actual.length !== expected.length) {
                    return false;
                }

                for (var i = 0; i < actual.length; i++) {
                    if (actual[i] !== expected[i]) {
                        return false;
                    }
                }

                return true;

                // 7.2. If the expected value is a Date object, the actual value is
                // equivalent if it is also a Date object that refers to the same time.
            } else if (actual instanceof Date && expected instanceof Date) {
                return actual.getTime() === expected.getTime();

                // 7.3 If the expected value is a RegExp object, the actual value is
                // equivalent if it is also a RegExp object with the same source and
                // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
            } else if (actual instanceof RegExp && expected instanceof RegExp) {
                return actual.source === expected.source &&
                    actual.global === expected.global &&
                    actual.multiline === expected.multiline &&
                    actual.lastIndex === expected.lastIndex &&
                    actual.ignoreCase === expected.ignoreCase;

                // 7.4. Other pairs that do not both pass typeof value == 'object',
                // equivalence is determined by ==.
            } else if (isString(actual) && isString(expected) && actual !== expected) {
                return false;
            } else if (typeof actual !== 'object' && typeof expected !== 'object') {
                return actual === expected;

                // 7.5 For all other Object pairs, including Array objects, equivalence is
                // determined by having the same number of owned properties (as verified
                // with Object.prototype.hasOwnProperty.call), the same set of keys
                // (although not necessarily the same order), equivalent values for every
                // corresponding key, and an identical 'prototype' property. Note: this
                // accounts for both named and indexed properties on Arrays.
            } else {
                return objEquiv(actual, expected);
            }
        }


        function objEquiv(a, b) {
            var key;
            if (isUndefinedOrNull(a) || isUndefinedOrNull(b)) {
                return false;
            }
            // an identical 'prototype' property.
            if (a.prototype !== b.prototype) {
                return false;
            }
            //~~~I've managed to break Object.keys through screwy arguments passing.
            //   Converting to array solves the problem.
            if (isArguments(a)) {
                if (!isArguments(b)) {
                    return false;
                }
                a = pSlice.call(a);
                b = pSlice.call(b);
                return deepEqual(a, b);
            }
            try {
                var ka = keys(a),
                    kb = keys(b),
                    i;
                // having the same number of owned properties (keys incorporates
                // hasOwnProperty)
                if (ka.length !== kb.length) {
                    return false;
                }
                //the same set of keys (although not necessarily the same order),
                ka.sort();
                kb.sort();
                //~~~cheap key test
                for (i = ka.length - 1; i >= 0; i--) {
                    if (ka[i] !== kb[i]) {
                        return false;
                    }
                }
                //equivalent values for every corresponding key, and
                //~~~possibly expensive deep test
                for (i = ka.length - 1; i >= 0; i--) {
                    key = ka[i];
                    if (!deepEqual(a[key], b[key])) {
                        return false;
                    }
                }
            } catch (e) {//happens when one is a string literal and the other isn't
                return false;
            }
            return true;
        }

        function isFunction(obj) {
            return typeof obj === "function";
        }

        function isObject(obj) {
            var undef;
            return obj !== null && obj !== undef && typeof obj === "object";
        }

        function isHash(obj) {
            var ret = isObject(obj);
            return ret && obj.constructor === Object;
        }

        function isEmpty(object) {
            if (isObject(object)) {
                for (var i in object) {
                    if (object.hasOwnProperty(i)) {
                        return false;
                    }
                }
            } else if (isString(object) && object === "") {
                return true;
            }
            return true;
        }

        function isBoolean(obj) {
            return Object.prototype.toString.call(obj) === "[object Boolean]";
        }

        function isUndefined(obj) {
            return obj !== null && obj === undef;
        }

        function isDefined(obj) {
            return !isUndefined(obj);
        }

        function isUndefinedOrNull(obj) {
            return isUndefined(obj) || isNull(obj);
        }

        function isNull(obj) {
            return obj !== undef && obj === null;
        }


        var isArguments = function _isArguments(object) {
            return !isUndefinedOrNull(object) && Object.prototype.toString.call(object) === '[object Arguments]';
        };

        if (!isArguments(arguments)) {
            isArguments = function _isArguments(obj) {
                return !!(obj && obj.hasOwnProperty("callee"));
            };
        }


        function isInstanceOf(obj, clazz) {
            if (isFunction(clazz)) {
                return obj instanceof clazz;
            } else {
                return false;
            }
        }

        function isRegExp(obj) {
            return !isUndefinedOrNull(obj) && (obj instanceof RegExp);
        }

        function isArray(obj) {
            return Object.prototype.toString.call(obj) === "[object Array]";
        }

        function isDate(obj) {
            return (!isUndefinedOrNull(obj) && typeof obj === "object" && obj instanceof Date);
        }

        function isString(obj) {
            return !isUndefinedOrNull(obj) && (typeof obj === "string" || obj instanceof String);
        }

        function isNumber(obj) {
            return !isUndefinedOrNull(obj) && (typeof obj === "number" || obj instanceof Number);
        }

        function isTrue(obj) {
            return obj === true;
        }

        function isFalse(obj) {
            return obj === false;
        }

        function isNotNull(obj) {
            return !isNull(obj);
        }

        function isEq(obj, obj2) {
            return obj == obj2;
        }

        function isNeq(obj, obj2) {
            /*jshint eqeqeq:false*/
            return obj != obj2;
        }

        function isSeq(obj, obj2) {
            return obj === obj2;
        }

        function isSneq(obj, obj2) {
            return obj !== obj2;
        }

        function isIn(obj, arr) {
            if (isArray(arr)) {
                for (var i = 0, l = arr.length; i < l; i++) {
                    if (isEq(obj, arr[i])) {
                        return true;
                    }
                }
            }
            return false;
        }

        function isNotIn(obj, arr) {
            return !isIn(obj, arr);
        }

        function isLt(obj, obj2) {
            return obj < obj2;
        }

        function isLte(obj, obj2) {
            return obj <= obj2;
        }

        function isGt(obj, obj2) {
            return obj > obj2;
        }

        function isGte(obj, obj2) {
            return obj >= obj2;
        }

        function isLike(obj, reg) {
            if (isString(reg)) {
                reg = new RegExp(reg);
            }
            if (isRegExp(reg)) {
                return reg.test("" + obj);
            }
            return false;
        }

        function isNotLike(obj, reg) {
            return !isLike(obj, reg);
        }

        function contains(arr, obj) {
            return isIn(obj, arr);
        }

        function notContains(arr, obj) {
            return !isIn(obj, arr);
        }

        var isa = {
            isFunction: isFunction,
            isObject: isObject,
            isEmpty: isEmpty,
            isHash: isHash,
            isNumber: isNumber,
            isString: isString,
            isDate: isDate,
            isArray: isArray,
            isBoolean: isBoolean,
            isUndefined: isUndefined,
            isDefined: isDefined,
            isUndefinedOrNull: isUndefinedOrNull,
            isNull: isNull,
            isArguments: isArguments,
            instanceOf: isInstanceOf,
            isRegExp: isRegExp,
            deepEqual: deepEqual,
            isTrue: isTrue,
            isFalse: isFalse,
            isNotNull: isNotNull,
            isEq: isEq,
            isNeq: isNeq,
            isSeq: isSeq,
            isSneq: isSneq,
            isIn: isIn,
            isNotIn: isNotIn,
            isLt: isLt,
            isLte: isLte,
            isGt: isGt,
            isGte: isGte,
            isLike: isLike,
            isNotLike: isNotLike,
            contains: contains,
            notContains: notContains
        };

        var tester = {
            constructor: function () {
                this._testers = [];
            },

            noWrap: {
                tester: function () {
                    var testers = this._testers;
                    return function tester(value) {
                        var isa = false;
                        for (var i = 0, l = testers.length; i < l && !isa; i++) {
                            isa = testers[i](value);
                        }
                        return isa;
                    };
                }
            }
        };

        var switcher = {
            constructor: function () {
                this._cases = [];
                this.__default = null;
            },

            def: function (val, fn) {
                this.__default = fn;
            },

            noWrap: {
                switcher: function () {
                    var testers = this._cases, __default = this.__default;
                    return function tester() {
                        var handled = false, args = argsToArray(arguments), caseRet;
                        for (var i = 0, l = testers.length; i < l && !handled; i++) {
                            caseRet = testers[i](args);
                            if (caseRet.length > 1) {
                                if (caseRet[1] || caseRet[0]) {
                                    return caseRet[1];
                                }
                            }
                        }
                        if (!handled && __default) {
                            return  __default.apply(this, args);
                        }
                    };
                }
            }
        };

        function addToTester(func) {
            tester[func] = function isaTester() {
                this._testers.push(isa[func]);
            };
        }

        function addToSwitcher(func) {
            switcher[func] = function isaTester() {
                var args = argsToArray(arguments, 1), isFunc = isa[func], handler, doBreak = true;
                if (args.length <= isFunc.length - 1) {
                    throw new TypeError("A handler must be defined when calling using switch");
                } else {
                    handler = args.pop();
                    if (isBoolean(handler)) {
                        doBreak = handler;
                        handler = args.pop();
                    }
                }
                if (!isFunction(handler)) {
                    throw new TypeError("handler must be defined");
                }
                this._cases.push(function (testArgs) {
                    if (isFunc.apply(isa, testArgs.concat(args))) {
                        return [doBreak, handler.apply(this, testArgs)];
                    }
                    return [false];
                });
            };
        }

        for (var i in isa) {
            if (isa.hasOwnProperty(i)) {
                addToSwitcher(i);
                addToTester(i);
            }
        }

        var is = extended.define(isa).expose(isa);
        is.tester = extended.define(tester);
        is.switcher = extended.define(switcher);
        return is;

    }

    if ("undefined" !== typeof exports) {
        if ("undefined" !== typeof module && module.exports) {
            module.exports = defineIsa(require("extended"));

        }
    } else if ("function" === typeof define) {
        define(["require"], function (require) {
            return defineIsa((require("extended")));
        });
    } else {
        this.is = defineIsa(this.extended);
    }

}).call(this);
});

require.define("/node_modules/ht/node_modules/array-extended/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {"main":"index.js"}
});

require.define("/node_modules/ht/node_modules/array-extended/index.js",function(require,module,exports,__dirname,__filename,process,global){(function () {
    "use strict";

    var arraySlice = Array.prototype.slice;

    function argsToArray(args, slice) {
        slice = slice || 0;
        return arraySlice.call(args, slice);
    }

    function defineArray(extended, is) {

        var isString = is.isString,
            isArray = is.isArray,
            isDate = is.isDate,
            floor = Math.floor,
            abs = Math.abs,
            mathMax = Math.max,
            mathMin = Math.min;


        function cross(num, cros) {
            return reduceRight(cros, function (a, b) {
                if (!isArray(b)) {
                    b = [b];
                }
                b.unshift(num);
                a.unshift(b);
                return a;
            }, []);
        }

        function permute(num, cross, length) {
            var ret = [];
            for (var i = 0; i < cross.length; i++) {
                ret.push([num].concat(rotate(cross, i)).slice(0, length));
            }
            return ret;
        }


        function intersection(a, b) {
            var ret = [], aOne;
            if (isArray(a) && isArray(b) && a.length && b.length) {
                for (var i = 0, l = a.length; i < l; i++) {
                    aOne = a[i];
                    if (indexOf(b, aOne) !== -1) {
                        ret.push(aOne);
                    }
                }
            }
            return ret;
        }


        var _sort = (function () {

            var isAll = function (arr, test) {
                return every(arr, test);
            };

            var defaultCmp = function (a, b) {
                return a - b;
            };

            var dateSort = function (a, b) {
                return a.getTime() - b.getTime();
            };

            return function _sort(arr, property) {
                var ret = [];
                if (isArray(arr)) {
                    ret = arr.slice();
                    if (property) {
                        if (typeof property === "function") {
                            ret.sort(property);
                        } else {
                            ret.sort(function (a, b) {
                                var aProp = a[property], bProp = b[property];
                                if (isString(aProp) && isString(bProp)) {
                                    return aProp > bProp ? 1 : aProp < bProp ? -1 : 0;
                                } else if (isDate(aProp) && isDate(bProp)) {
                                    return aProp.getTime() - bProp.getTime();
                                } else {
                                    return aProp - bProp;
                                }
                            });
                        }
                    } else {
                        if (isAll(ret, isString)) {
                            ret.sort();
                        } else if (isAll(ret, isDate)) {
                            ret.sort(dateSort);
                        } else {
                            ret.sort(defaultCmp);
                        }
                    }
                }
                return ret;
            };

        })();

        function indexOf(arr, searchElement) {
            if (!isArray(arr)) {
                throw new TypeError();
            }
            var t = Object(arr);
            var len = t.length >>> 0;
            if (len === 0) {
                return -1;
            }
            var n = 0;
            if (arguments.length > 2) {
                n = Number(arguments[2]);
                if (n !== n) { // shortcut for verifying if it's NaN
                    n = 0;
                } else if (n !== 0 && n !== Infinity && n !== -Infinity) {
                    n = (n > 0 || -1) * floor(abs(n));
                }
            }
            if (n >= len) {
                return -1;
            }
            var k = n >= 0 ? n : mathMax(len - abs(n), 0);
            for (; k < len; k++) {
                if (k in t && t[k] === searchElement) {
                    return k;
                }
            }
            return -1;
        }

        function lastIndexOf(arr, searchElement) {
            if (!isArray(arr)) {
                throw new TypeError();
            }

            var t = Object(arr);
            var len = t.length >>> 0;
            if (len === 0) {
                return -1;
            }

            var n = len;
            if (arguments.length > 2) {
                n = Number(arguments[2]);
                if (n !== n) {
                    n = 0;
                } else if (n !== 0 && n !== (1 / 0) && n !== -(1 / 0)) {
                    n = (n > 0 || -1) * floor(abs(n));
                }
            }

            var k = n >= 0 ? mathMin(n, len - 1) : len - abs(n);

            for (; k >= 0; k--) {
                if (k in t && t[k] === searchElement) {
                    return k;
                }
            }
            return -1;
        }

        function filter(arr, iterator, scope) {
            if (!isArray(arr) || typeof iterator !== "function") {
                throw new TypeError();
            }

            var t = Object(arr);
            var len = t.length >>> 0;
            var res = [];
            for (var i = 0; i < len; i++) {
                if (i in t) {
                    var val = t[i]; // in case fun mutates this
                    if (iterator.call(scope, val, i, t)) {
                        res.push(val);
                    }
                }
            }
            return res;
        }

        function forEach(arr, iterator, scope) {
            if (!isArray(arr) || typeof iterator !== "function") {
                throw new TypeError();
            }
            for (var i = 0, len = arr.length; i < len; ++i) {
                iterator.call(scope || arr, arr[i], i, arr);
            }
            return arr;
        }

        function every(arr, iterator, scope) {
            if (!isArray(arr) || typeof iterator !== "function") {
                throw new TypeError();
            }
            var t = Object(arr);
            var len = t.length >>> 0;
            for (var i = 0; i < len; i++) {
                if (i in t && !iterator.call(scope, t[i], i, t)) {
                    return false;
                }
            }
            return true;
        }

        function some(arr, iterator, scope) {
            if (!isArray(arr) || typeof iterator !== "function") {
                throw new TypeError();
            }
            var t = Object(arr);
            var len = t.length >>> 0;
            for (var i = 0; i < len; i++) {
                if (i in t && iterator.call(scope, t[i], i, t)) {
                    return true;
                }
            }
            return false;
        }

        function map(arr, iterator, scope) {
            if (!isArray(arr) || typeof iterator !== "function") {
                throw new TypeError();
            }

            var t = Object(arr);
            var len = t.length >>> 0;
            var res = [];
            for (var i = 0; i < len; i++) {
                if (i in t) {
                    res.push(iterator.call(scope, t[i], i, t));
                }
            }
            return res;
        }

        function reduce(arr, accumulator, curr) {
            if (!isArray(arr) || typeof accumulator !== "function") {
                throw new TypeError();
            }
            var i = 0, l = arr.length >> 0;
            if (arguments.length < 3) {
                if (l === 0) {
                    throw new TypeError("Array length is 0 and no second argument");
                }
                curr = arr[0];
                i = 1; // start accumulating at the second element
            } else {
                curr = arguments[2];
            }
            while (i < l) {
                if (i in arr) {
                    curr = accumulator.call(undefined, curr, arr[i], i, arr);
                }
                ++i;
            }
            return curr;
        }

        function reduceRight(arr, accumulator, curr) {
            if (!isArray(arr) || typeof accumulator !== "function") {
                throw new TypeError();
            }

            var t = Object(arr);
            var len = t.length >>> 0;

            // no value to return if no initial value, empty array
            if (len === 0 && arguments.length === 2) {
                throw new TypeError();
            }

            var k = len - 1;
            if (arguments.length >= 3) {
                curr = arguments[2];
            } else {
                do {
                    if (k in arr) {
                        curr = arr[k--];
                        break;
                    }
                }
                while (true);
            }
            while (k >= 0) {
                if (k in t) {
                    curr = accumulator.call(undefined, curr, t[k], k, t);
                }
                k--;
            }
            return curr;
        }


        function toArray(o) {
            var ret = [];
            if (o !== null) {
                var args = argsToArray(arguments);
                if (args.length === 1) {
                    if (isArray(o)) {
                        ret = o;
                    } else if (is.isHash(o)) {
                        for (var i in o) {
                            if (o.hasOwnProperty(i)) {
                                ret.push([i, o[i]]);
                            }
                        }
                    } else {
                        ret.push(o);
                    }
                } else {
                    forEach(args, function (a) {
                        ret = ret.concat(toArray(a));
                    });
                }
            }
            return ret;
        }

        function sum(array) {
            array = array || [];
            if (array.length) {
                return reduce(array, function (a, b) {
                    return a + b;
                });
            } else {
                return 0;
            }
        }

        function avg(arr) {
            arr = arr || [];
            if (arr.length) {
                var total = sum(arr);
                if (is.isNumber(total)) {
                    return  total / arr.length;
                } else {
                    throw new Error("Cannot average an array of non numbers.");
                }
            } else {
                return 0;
            }
        }

        function sort(arr, cmp) {
            return _sort(arr, cmp);
        }

        function min(arr, cmp) {
            return _sort(arr, cmp)[0];
        }

        function max(arr, cmp) {
            return _sort(arr, cmp)[arr.length - 1];
        }

        function difference(arr1) {
            var ret = arr1, args = flatten(argsToArray(arguments, 1));
            if (isArray(arr1)) {
                ret = filter(arr1, function (a) {
                    return indexOf(args, a) === -1;
                });
            }
            return ret;
        }

        function removeDuplicates(arr) {
            var ret = arr;
            if (isArray(arr)) {
                ret = reduce(arr, function (a, b) {
                    if (indexOf(a, b) === -1) {
                        return a.concat(b);
                    } else {
                        return a;
                    }
                }, []);
            }
            return ret;
        }


        function unique(arr) {
            return removeDuplicates(arr);
        }


        function rotate(arr, numberOfTimes) {
            var ret = arr.slice();
            if (typeof numberOfTimes !== "number") {
                numberOfTimes = 1;
            }
            if (numberOfTimes && isArray(arr)) {
                if (numberOfTimes > 0) {
                    ret.push(ret.shift());
                    numberOfTimes--;
                } else {
                    ret.unshift(ret.pop());
                    numberOfTimes++;
                }
                return rotate(ret, numberOfTimes);
            } else {
                return ret;
            }
        }

        function permutations(arr, length) {
            var ret = [];
            if (isArray(arr)) {
                var copy = arr.slice(0);
                if (typeof length !== "number") {
                    length = arr.length;
                }
                if (!length) {
                    ret = [
                        []
                    ];
                } else if (length <= arr.length) {
                    ret = reduce(arr, function (a, b, i) {
                        var ret;
                        if (length > 1) {
                            ret = permute(b, rotate(copy, i).slice(1), length);
                        } else {
                            ret = [
                                [b]
                            ];
                        }
                        return a.concat(ret);
                    }, []);
                }
            }
            return ret;
        }

        function zip() {
            var ret = [];
            var arrs = argsToArray(arguments);
            if (arrs.length > 1) {
                var arr1 = arrs.shift();
                if (isArray(arr1)) {
                    ret = reduce(arr1, function (a, b, i) {
                        var curr = [b];
                        for (var j = 0; j < arrs.length; j++) {
                            var currArr = arrs[j];
                            if (isArray(currArr) && !is.isUndefined(currArr[i])) {
                                curr.push(currArr[i]);
                            } else {
                                curr.push(null);
                            }
                        }
                        a.push(curr);
                        return a;
                    }, []);
                }
            }
            return ret;
        }

        function transpose(arr) {
            var ret = [];
            if (isArray(arr) && arr.length) {
                var last;
                forEach(arr, function (a) {
                    if (isArray(a) && (!last || a.length === last.length)) {
                        forEach(a, function (b, i) {
                            if (!ret[i]) {
                                ret[i] = [];
                            }
                            ret[i].push(b);
                        });
                        last = a;
                    }
                });
            }
            return ret;
        }

        function valuesAt(arr, indexes) {
            var ret = [];
            indexes = argsToArray(arguments);
            arr = indexes.shift();
            if (isArray(arr) && indexes.length) {
                for (var i = 0, l = indexes.length; i < l; i++) {
                    ret.push(arr[indexes[i]] || null);
                }
            }
            return ret;
        }

        function union() {
            var ret = [];
            var arrs = argsToArray(arguments);
            if (arrs.length > 1) {
                ret = removeDuplicates(reduce(arrs, function (a, b) {
                    return a.concat(b);
                }, []));
            }
            return ret;
        }

        function intersect() {
            var collect = [], set;
            var args = argsToArray(arguments);
            if (args.length > 1) {
                //assume we are intersections all the lists in the array
                set = args;
            } else {
                set = args[0];
            }
            if (isArray(set)) {
                var x = set.shift();
                collect = reduce(set, function (a, b) {
                    return intersection(a, b);
                }, x);
            }
            return removeDuplicates(collect);
        }

        function powerSet(arr) {
            var ret = [];
            if (isArray(arr) && arr.length) {
                ret = reduce(arr, function (a, b) {
                    var ret = map(a, function (c) {
                        return c.concat(b);
                    });
                    return a.concat(ret);
                }, [
                    []
                ]);
            }
            return ret;
        }

        function cartesian(a, b) {
            var ret = [];
            if (isArray(a) && isArray(b) && a.length && b.length) {
                ret = cross(a[0], b).concat(cartesian(a.slice(1), b));
            }
            return ret;
        }

        function compact(arr) {
            var ret = [];
            if (isArray(arr) && arr.length) {
                ret = filter(arr, function (item) {
                    return !is.isUndefinedOrNull(item);
                });
            }
            return ret;
        }

        function multiply(arr, times) {
            times = is.isNumber(times) ? times : 1;
            if (!times) {
                //make sure times is greater than zero if it is zero then dont multiply it
                times = 1;
            }
            arr = toArray(arr || []);
            var ret = [], i = 0;
            while (++i <= times) {
                ret = ret.concat(arr);
            }
            return ret;
        }

        function flatten(arr) {
            var set;
            var args = argsToArray(arguments);
            if (args.length > 1) {
                //assume we are intersections all the lists in the array
                set = args;
            } else {
                set = toArray(arr);
            }
            return reduce(set, function (a, b) {
                return a.concat(b);
            }, []);
        }

        function pluck(arr, prop) {
            prop = prop.split(".");
            var result = arr.slice(0);
            forEach(prop, function (prop) {
                var exec = prop.match(/(\w+)\(\)$/);
                result = map(result, function (item) {
                    return exec ? item[exec[1]]() : item[prop];
                });
            });
            return result;
        }

        function invoke(arr, func, args) {
            args = argsToArray(arguments, 2);
            return map(arr, function (item) {
                var exec = isString(func) ? item[func] : func;
                return exec.apply(item, args);
            });
        }


        var array = {
            toArray: toArray,
            sum: sum,
            avg: avg,
            sort: sort,
            min: min,
            max: max,
            difference: difference,
            removeDuplicates: removeDuplicates,
            unique: unique,
            rotate: rotate,
            permutations: permutations,
            zip: zip,
            transpose: transpose,
            valuesAt: valuesAt,
            union: union,
            intersect: intersect,
            powerSet: powerSet,
            cartesian: cartesian,
            compact: compact,
            multiply: multiply,
            flatten: flatten,
            pluck: pluck,
            invoke: invoke,
            forEach: forEach,
            map: map,
            filter: filter,
            reduce: reduce,
            reduceRight: reduceRight,
            some: some,
            every: every,
            indexOf: indexOf,
            lastIndexOf: lastIndexOf
        };

        return extended.define(isArray, array).expose(array);
    }

    if ("undefined" !== typeof exports) {
        if ("undefined" !== typeof module && module.exports) {
            module.exports = defineArray(require("extended"), require("is-extended"));
        }
    } else if ("function" === typeof define) {
        define(["require"], function (require) {
            return defineArray(require("extended"), require("is-extended"));
        });
    } else {
        this.arrayExtended = defineArray(this.extended, this.isExtended);
    }

}).call(this);







});

require.define("/node_modules/leafy/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {"main":"index.js"}
});

require.define("/node_modules/leafy/index.js",function(require,module,exports,__dirname,__filename,process,global){(function () {
    "use strict";

    function defineLeafy(_) {

        function compare(a, b) {
            var ret = 0;
            if (a > b) {
                return 1;
            } else if (a < b) {
                return -1;
            } else if (!b) {
                return 1;
            }
            return ret;
        }

        var multiply = _.multiply;

        var Tree = _.declare({

            instance: {

                /**
                 * Prints a node
                 * @param node node to print
                 * @param level the current level the node is at, Used for formatting
                 */
                __printNode: function (node, level) {
                    //console.log(level);
                    var str = [];
                    if (_.isUndefinedOrNull(node)) {
                        str.push(multiply('\t', level));
                        str.push("~");
                        console.log(str.join(""));
                    } else {
                        this.__printNode(node.right, level + 1);
                        str.push(multiply('\t', level));
                        str.push(node.data + "\n");
                        console.log(str.join(""));
                        this.__printNode(node.left, level + 1);
                    }
                },

                constructor: function (options) {
                    options = options || {};
                    this.compare = options.compare || compare;
                    this.__root = null;
                },

                insert: function () {
                    throw new Error("Not Implemented");
                },

                remove: function () {
                    throw new Error("Not Implemented");
                },

                clear: function () {
                    this.__root = null;
                },

                isEmpty: function () {
                    return !(this.__root);
                },

                traverseWithCondition: function (node, order, callback) {
                    var cont = true;
                    if (node) {
                        order = order || Tree.PRE_ORDER;
                        if (order === Tree.PRE_ORDER) {
                            cont = callback(node.data);
                            if (cont) {
                                cont = this.traverseWithCondition(node.left, order, callback);
                                if (cont) {
                                    cont = this.traverseWithCondition(node.right, order, callback);
                                }

                            }
                        } else if (order === Tree.IN_ORDER) {
                            cont = this.traverseWithCondition(node.left, order, callback);
                            if (cont) {
                                cont = callback(node.data);
                                if (cont) {
                                    cont = this.traverseWithCondition(node.right, order, callback);
                                }
                            }
                        } else if (order === Tree.POST_ORDER) {
                            cont = this.traverseWithCondition(node.left, order, callback);
                            if (cont) {
                                if (cont) {
                                    cont = this.traverseWithCondition(node.right, order, callback);
                                }
                                if (cont) {
                                    cont = callback(node.data);
                                }
                            }
                        } else if (order === Tree.REVERSE_ORDER) {
                            cont = this.traverseWithCondition(node.right, order, callback);
                            if (cont) {
                                cont = callback(node.data);
                                if (cont) {
                                    cont = this.traverseWithCondition(node.left, order, callback);
                                }
                            }
                        }
                    }
                    return cont;
                },

                traverse: function (node, order, callback) {
                    if (node) {
                        order = order || Tree.PRE_ORDER;
                        if (order === Tree.PRE_ORDER) {
                            callback(node.data);
                            this.traverse(node.left, order, callback);
                            this.traverse(node.right, order, callback);
                        } else if (order === Tree.IN_ORDER) {
                            this.traverse(node.left, order, callback);
                            callback(node.data);
                            this.traverse(node.right, order, callback);
                        } else if (order === Tree.POST_ORDER) {
                            this.traverse(node.left, order, callback);
                            this.traverse(node.right, order, callback);
                            callback(node.data);
                        } else if (order === Tree.REVERSE_ORDER) {
                            this.traverse(node.right, order, callback);
                            callback(node.data);
                            this.traverse(node.left, order, callback);

                        }
                    }
                },

                forEach: function (cb, scope, order) {
                    if (typeof cb !== "function") {
                        throw new TypeError();
                    }
                    order = order || Tree.IN_ORDER;
                    scope = scope || this;
                    this.traverse(this.__root, order, function (node) {
                        cb.call(scope, node, this);
                    });
                },

                map: function (cb, scope, order) {
                    if (typeof cb !== "function") {
                        throw new TypeError();
                    }

                    order = order || Tree.IN_ORDER;
                    scope = scope || this;
                    var ret = new this._static();
                    this.traverse(this.__root, order, function (node) {
                        ret.insert(cb.call(scope, node, this));
                    });
                    return ret;
                },

                filter: function (cb, scope, order) {
                    if (typeof cb !== "function") {
                        throw new TypeError();
                    }

                    order = order || Tree.IN_ORDER;
                    scope = scope || this;
                    var ret = new this._static();
                    this.traverse(this.__root, order, function (node) {
                        if (cb.call(scope, node, this)) {
                            ret.insert(node);
                        }
                    });
                    return ret;
                },

                reduce: function (fun, accumulator, order) {
                    var arr = this.toArray(order);
                    var args = [arr, fun];
                    if (!_.isUndefinedOrNull(accumulator)) {
                        args.push(accumulator);
                    }
                    return _.reduce.apply(_, args);
                },

                reduceRight: function (fun, accumulator, order) {
                    var arr = this.toArray(order);
                    var args = [arr, fun];
                    if (!_.isUndefinedOrNull(accumulator)) {
                        args.push(accumulator);
                    }
                    return _.reduceRight.apply(_, args);
                },

                every: function (cb, scope, order) {
                    if (typeof cb !== "function") {
                        throw new TypeError();
                    }
                    order = order || Tree.IN_ORDER;
                    scope = scope || this;
                    var ret = false;
                    this.traverseWithCondition(this.__root, order, function (node) {
                        return (ret = cb.call(scope, node, this));
                    });
                    return ret;
                },

                some: function (cb, scope, order) {
                    if (typeof cb !== "function") {
                        throw new TypeError();
                    }

                    order = order || Tree.IN_ORDER;
                    scope = scope || this;
                    var ret;
                    this.traverseWithCondition(this.__root, order, function (node) {
                        ret = cb.call(scope, node, this);
                        return !ret;
                    });
                    return ret;
                },

                toArray: function (order) {
                    order = order || Tree.IN_ORDER;
                    var arr = [];
                    this.traverse(this.__root, order, function (node) {
                        arr.push(node);
                    });
                    return arr;
                },

                contains: function (value) {
                    var ret = false;
                    var root = this.__root;
                    while (root !== null) {
                        var cmp = this.compare(value, root.data);
                        if (cmp) {
                            root = root[(cmp === -1) ? "left" : "right"];
                        } else {
                            ret = true;
                            root = null;
                        }
                    }
                    return ret;
                },

                find: function (value) {
                    var ret;
                    var root = this.__root;
                    while (root) {
                        var cmp = this.compare(value, root.data);
                        if (cmp) {
                            root = root[(cmp === -1) ? "left" : "right"];
                        } else {
                            ret = root.data;
                            break;
                        }
                    }
                    return ret;
                },

                findLessThan: function (value, exclusive) {
                    //find a better way!!!!
                    var ret = [], compare = this.compare;
                    this.traverseWithCondition(this.__root, Tree.IN_ORDER, function (v) {
                        var cmp = compare(value, v);
                        if ((!exclusive && cmp === 0) || cmp === 1) {
                            ret.push(v);
                            return true;
                        } else {
                            return false;
                        }
                    });
                    return ret;
                },

                findGreaterThan: function (value, exclusive) {
                    //find a better way!!!!
                    var ret = [], compare = this.compare;
                    this.traverse(this.__root, Tree.REVERSE_ORDER, function (v) {
                        var cmp = compare(value, v);
                        if ((!exclusive && cmp === 0) || cmp === -1) {
                            ret.push(v);
                            return true;
                        } else {
                            return false;
                        }
                    });
                    return ret;
                },

                print: function () {
                    this.__printNode(this.__root, 0);
                }
            },

            "static": {
                PRE_ORDER: "pre_order",
                IN_ORDER: "in_order",
                POST_ORDER: "post_order",
                REVERSE_ORDER: "reverse_order"
            }
        });

        var AVLTree = (function () {
            var abs = Math.abs;


            var makeNode = function (data) {
                return {
                    data: data,
                    balance: 0,
                    left: null,
                    right: null
                };
            };

            var rotateSingle = function (root, dir, otherDir) {
                var save = root[otherDir];
                root[otherDir] = save[dir];
                save[dir] = root;
                return save;
            };


            var rotateDouble = function (root, dir, otherDir) {
                root[otherDir] = rotateSingle(root[otherDir], otherDir, dir);
                return rotateSingle(root, dir, otherDir);
            };

            var adjustBalance = function (root, dir, bal) {
                var otherDir = dir === "left" ? "right" : "left";
                var n = root[dir], nn = n[otherDir];
                if (nn.balance === 0) {
                    root.balance = n.balance = 0;
                } else if (nn.balance === bal) {
                    root.balance = -bal;
                    n.balance = 0;
                }
                else { /* nn.balance == -bal */
                    root.balance = 0;
                    n.balance = bal;
                }
                nn.balance = 0;
            };

            var insertAdjustBalance = function (root, dir) {
                var otherDir = dir === "left" ? "right" : "left";

                var n = root[dir];
                var bal = dir === "left" ? -1 : +1;

                if (n.balance === bal) {
                    root.balance = n.balance = 0;
                    root = rotateSingle(root, otherDir, dir);
                }
                else {
                    adjustBalance(root, dir, bal);
                    root = rotateDouble(root, otherDir, dir);
                }

                return root;

            };

            var removeAdjustBalance = function (root, dir, done) {
                var otherDir = dir === "left" ? "right" : "left";
                var n = root[otherDir];
                var bal = dir === "left" ? -1 : 1;
                if (n.balance === -bal) {
                    root.balance = n.balance = 0;
                    root = rotateSingle(root, dir, otherDir);
                }
                else if (n.balance === bal) {
                    adjustBalance(root, otherDir, -bal);
                    root = rotateDouble(root, dir, otherDir);
                }
                else { /* n.balance == 0 */
                    root.balance = -bal;
                    n.balance = bal;
                    root = rotateSingle(root, dir, otherDir);
                    done.done = true;
                }
                return root;
            };

            var insert = function (root, data, done, compare) {
                if (root === null || root === undefined) {
                    root = makeNode(data);
                } else {
                    var dir = compare(data, root.data) === -1 ? "left" : "right";
                    root[dir] = insert(root[dir], data, done, compare);

                    if (!done.done) {
                        /* Update balance factors */
                        root.balance += dir === "left" ? -1 : 1;
                        /* Rebalance as necessary and terminate */
                        if (root.balance === 0) {
                            done.done = true;
                        } else if (abs(root.balance) > 1) {
                            root = insertAdjustBalance(root, dir);
                            done.done = true;
                        }
                    }
                }

                return root;
            };

            var remove = function (root, data, done, compare) {
                var dir, cmp, save, b;
                if (root) {
                    //Remove node
                    cmp = compare(data, root.data);
                    if (cmp === 0) {
                        // Unlink and fix parent
                        var l = root.left, r = root.right;
                        if (!l || !r) {
                            dir = !l ? "right" : "left";
                            save = root[dir];
                            return save;
                        }
                        else {
                            var heir = l;
                            while ((r = heir.right) !== null) {
                                heir = r;
                            }
                            root.data = heir.data;
                            //reset and start searching
                            data = heir.data;
                        }
                    }
                    dir = compare(root.data, data) === -1 ? "right" : "left";
                    root[dir] = remove(root[dir], data, done, compare);
                    if (!done.done) {
                        /* Update balance factors */
                        b = (root.balance += (dir === "left" ? 1 : -1));
                        /* Terminate or rebalance as necessary */
                        var a = abs(b);
                        if (a === 1) {
                            done.done = true;
                        } else if (a > 1) {
                            root = removeAdjustBalance(root, dir, done);
                        }
                    }
                }
                return root;
            };


            return Tree.extend({
                instance: {

                    insert: function (data) {
                        var done = {done: false};
                        this.__root = insert(this.__root, data, done, this.compare);
                    },


                    remove: function (data) {
                        this.__root = remove(this.__root, data, {done: false}, this.compare);
                    },

                    __printNode: function (node, level) {
                        var str = [];
                        if (!node) {
                            str.push(multiply('\t', level));
                            str.push("~");
                            console.log(str.join(""));
                        } else {
                            this.__printNode(node.right, level + 1);
                            str.push(multiply('\t', level));
                            str.push(node.data + ":" + node.balance + "\n");
                            console.log(str.join(""));
                            this.__printNode(node.left, level + 1);
                        }
                    }

                }
            });
        }());

        var AnderssonTree = (function () {

            var nil = {level: 0, data: null};

            function makeNode(data, level) {
                return {
                    data: data,
                    level: level,
                    left: nil,
                    right: nil
                };
            }

            function skew(root) {
                if (root.level !== 0 && root.left.level === root.level) {
                    var save = root.left;
                    root.left = save.right;
                    save.right = root;
                    root = save;
                }
                return root;
            }

            function split(root) {
                if (root.level !== 0 && root.right.right.level === root.level) {
                    var save = root.right;
                    root.right = save.left;
                    save.left = root;
                    root = save;
                    root.level++;
                }
                return root;
            }

            function insert(root, data, compare) {
                if (root === nil) {
                    root = makeNode(data, 1);
                }
                else {
                    var dir = compare(data, root.data) === -1 ? "left" : "right";
                    root[dir] = insert(root[dir], data, compare);
                    root = skew(root);
                    root = split(root);
                }
                return root;
            }

            var remove = function (root, data, compare) {
                var rLeft, rRight;
                if (root !== nil) {
                    var cmp = compare(data, root.data);
                    if (cmp === 0) {
                        rLeft = root.left, rRight = root.right;
                        if (rLeft !== nil && rRight !== nil) {
                            var heir = rLeft;
                            while (heir.right !== nil) {
                                heir = heir.right;
                            }
                            root.data = heir.data;
                            root.left = remove(rLeft, heir.data, compare);
                        } else {
                            root = root[rLeft === nil ? "right" : "left"];
                        }
                    } else {
                        var dir = cmp === -1 ? "left" : "right";
                        root[dir] = remove(root[dir], data, compare);
                    }
                }
                if (root !== nil) {
                    var rLevel = root.level;
                    var rLeftLevel = root.left.level, rRightLevel = root.right.level;
                    if (rLeftLevel < rLevel - 1 || rRightLevel < rLevel - 1) {
                        if (rRightLevel > --root.level) {
                            root.right.level = root.level;
                        }
                        root = skew(root);
                        root = split(root);
                    }
                }
                return root;
            };

            return Tree.extend({

                instance: {

                    isEmpty: function () {
                        return this.__root === nil || this._super(arguments);
                    },

                    insert: function (data) {
                        if (!this.__root) {
                            this.__root = nil;
                        }
                        this.__root = insert(this.__root, data, this.compare);
                    },

                    remove: function (data) {
                        this.__root = remove(this.__root, data, this.compare);
                    },


                    traverseWithCondition: function (node) {
                        var cont = true;
                        if (node !== nil) {
                            return this._super(arguments);
                        }
                        return cont;
                    },


                    traverse: function (node) {
                        if (node !== nil) {
                            this._super(arguments);
                        }
                    },

                    contains: function () {
                        if (this.__root !== nil) {
                            return this._super(arguments);
                        }
                        return false;
                    },

                    __printNode: function (node, level) {
                        var str = [];
                        if (!node || !node.data) {
                            str.push(multiply('\t', level));
                            str.push("~");
                            console.log(str.join(""));
                        } else {
                            this.__printNode(node.right, level + 1);
                            str.push(multiply('\t', level));
                            str.push(node.data + ":" + node.level + "\n");
                            console.log(str.join(""));
                            this.__printNode(node.left, level + 1);
                        }
                    }

                }

            });
        }());

        var BinaryTree = Tree.extend({
            instance: {
                insert: function (data) {
                    if (!this.__root) {
                        return (this.__root = {
                            data: data,
                            parent: null,
                            left: null,
                            right: null
                        });
                    }
                    var compare = this.compare;
                    var root = this.__root;
                    while (root !== null) {
                        var cmp = compare(data, root.data);
                        if (cmp) {
                            var leaf = (cmp === -1) ? "left" : "right";
                            var next = root[leaf];
                            if (!next) {
                                return (root[leaf] = {data: data, parent: root, left: null, right: null});
                            } else {
                                root = next;
                            }
                        } else {
                            return;
                        }
                    }
                },

                remove: function (data) {
                    if (this.__root !== null) {
                        var head = {right: this.__root}, it = head;
                        var p, f = null;
                        var dir = "right";
                        while (it[dir] !== null) {
                            p = it;
                            it = it[dir];
                            var cmp = this.compare(data, it.data);
                            if (!cmp) {
                                f = it;
                            }
                            dir = (cmp === -1 ? "left" : "right");
                        }
                        if (f !== null) {
                            f.data = it.data;
                            p[p.right === it ? "right" : "left"] = it[it.left === null ? "right" : "left"];
                        }
                        this.__root = head.right;
                    }

                }
            }
        });

        var RedBlackTree = (function () {
            var RED = "RED", BLACK = "BLACK";

            var isRed = function (node) {
                return node !== null && node.red;
            };

            var makeNode = function (data) {
                return {
                    data: data,
                    red: true,
                    left: null,
                    right: null
                };
            };

            var insert = function (root, data, compare) {
                if (!root) {
                    return makeNode(data);

                } else {
                    var cmp = compare(data, root.data);
                    if (cmp) {
                        var dir = cmp === -1 ? "left" : "right";
                        var otherDir = dir === "left" ? "right" : "left";
                        root[dir] = insert(root[dir], data, compare);
                        var node = root[dir];

                        if (isRed(node)) {

                            var sibling = root[otherDir];
                            if (isRed(sibling)) {
                                /* Case 1 */
                                root.red = true;
                                node.red = false;
                                sibling.red = false;
                            } else {

                                if (isRed(node[dir])) {

                                    root = rotateSingle(root, otherDir);
                                } else if (isRed(node[otherDir])) {

                                    root = rotateDouble(root, otherDir);
                                }
                            }

                        }
                    }
                }
                return root;
            };

            var rotateSingle = function (root, dir) {
                var otherDir = dir === "left" ? "right" : "left";
                var save = root[otherDir];
                root[otherDir] = save[dir];
                save[dir] = root;
                root.red = true;
                save.red = false;
                return save;
            };

            var rotateDouble = function (root, dir) {
                var otherDir = dir === "left" ? "right" : "left";
                root[otherDir] = rotateSingle(root[otherDir], otherDir);
                return rotateSingle(root, dir);
            };


            var remove = function (root, data, done, compare) {
                if (!root) {
                    done.done = true;
                } else {
                    var dir;
                    if (compare(data, root.data) === 0) {
                        if (!root.left || !root.right) {
                            var save = root[!root.left ? "right" : "left"];
                            /* Case 0 */
                            if (isRed(root)) {
                                done.done = true;
                            } else if (isRed(save)) {
                                save.red = false;
                                done.done = true;
                            }
                            return save;
                        }
                        else {
                            var heir = root.right, p;
                            while (heir.left !== null) {
                                p = heir;
                                heir = heir.left;
                            }
                            if (p) {
                                p.left = null;
                            }
                            root.data = heir.data;
                            data = heir.data;
                        }
                    }
                    dir = compare(data, root.data) === -1 ? "left" : "right";
                    root[dir] = remove(root[dir], data, done, compare);
                    if (!done.done) {
                        root = removeBalance(root, dir, done);
                    }
                }
                return root;
            };

            var removeBalance = function (root, dir, done) {
                var notDir = dir === "left" ? "right" : "left";
                var p = root, s = p[notDir];
                if (isRed(s)) {
                    root = rotateSingle(root, dir);
                    s = p[notDir];
                }
                if (s !== null) {
                    if (!isRed(s.left) && !isRed(s.right)) {
                        if (isRed(p)) {
                            done.done = true;
                        }
                        p.red = 0;
                        s.red = 1;
                    } else {
                        var save = p.red, newRoot = ( root === p );
                        p = (isRed(s[notDir]) ? rotateSingle : rotateDouble)(p, dir);
                        p.red = save;
                        p.left.red = p.right.red = 0;
                        if (newRoot) {
                            root = p;
                        } else {
                            root[dir] = p;
                        }
                        done.done = true;
                    }
                }
                return root;
            };

            return Tree.extend({
                instance: {
                    insert: function (data) {
                        this.__root = insert(this.__root, data, this.compare);
                        this.__root.red = false;
                    },

                    remove: function (data) {
                        var done = {done: false};
                        var root = remove(this.__root, data, done, this.compare);
                        if (root !== null) {
                            root.red = 0;
                        }
                        this.__root = root;
                        return data;
                    },


                    __printNode: function (node, level) {
                        var str = [];
                        if (!node) {
                            str.push(multiply('\t', level));
                            str.push("~");
                            console.log(str.join(""));
                        } else {
                            this.__printNode(node.right, level + 1);
                            str.push(multiply('\t', level));
                            str.push((node.red ? RED : BLACK) + ":" + node.data + "\n");
                            console.log(str.join(""));
                            this.__printNode(node.left, level + 1);
                        }
                    }

                }
            });

        }());


        return {
            Tree: Tree,
            AVLTree: AVLTree,
            AnderssonTree: AnderssonTree,
            BinaryTree: BinaryTree,
            RedBlackTree: RedBlackTree,
            IN_ORDER: Tree.IN_ORDER,
            PRE_ORDER: Tree.PRE_ORDER,
            POST_ORDER: Tree.POST_ORDER,
            REVERSE_ORDER: Tree.REVERSE_ORDER

        };
    }

    if ("undefined" !== typeof exports) {
        if ("undefined" !== typeof module && module.exports) {
            module.exports = defineLeafy(require("extended")()
                .register("declare", require("declare.js"))
                .register(require("is-extended"))
                .register(require("array-extended"))
                .register(require("string-extended"))
            );

        }
    } else if ("function" === typeof define) {
        define(["extended", "declare.js", "is-extended", "array-extended", "string-extended"], function (extended, declare, is, array, string) {
            return defineLeafy(extended()
                .register("declare", declare)
                .register(is)
                .register(array)
                .register(string)
            );
        });
    } else {
        this.leafy = defineLeafy(this.extended()
            .register("declare", this.declare)
            .register(this.isExtended)
            .register(this.arrayExtended)
            .register(this.stringExtended));
    }

}).call(this);







});

require.define("/node_modules/leafy/node_modules/extended/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {"main":"index.js"}
});

require.define("/node_modules/leafy/node_modules/extended/index.js",function(require,module,exports,__dirname,__filename,process,global){(function () {
    "use strict";
    /*global extender isa, dateExtended*/

    function defineExtended(extender, require) {


        var merge = (function merger() {
            function _merge(target, source) {
                var name, s;
                for (name in source) {
                    if (source.hasOwnProperty(name)) {
                        s = source[name];
                        if (!(name in target) || (target[name] !== s)) {
                            target[name] = s;
                        }
                    }
                }
                return target;
            }

            return function merge(obj) {
                if (!obj) {
                    obj = {};
                }
                for (var i = 1, l = arguments.length; i < l; i++) {
                    _merge(obj, arguments[i]);
                }
                return obj; // Object
            };
        }());

        function getExtended() {

            var loaded = {};


            //getInitial instance;
            var extended = extender.define();
            extended.expose({
                register: function register(alias, extendWith) {
                    if (!extendWith) {
                        extendWith = alias;
                        alias = null;
                    }
                    var type = typeof extendWith;
                    if (alias) {
                        extended[alias] = extendWith;
                    } else if (extendWith && type === "function") {
                        extended.extend(extendWith);
                    } else if (type === "object") {
                        extended.expose(extendWith);
                    } else {
                        throw new TypeError("extended.register must be called with an extender function");
                    }
                    return extended;
                },

                define: function () {
                    return extender.define.apply(extender, arguments);
                }
            });

            return extended;
        }

        function extended() {
            return getExtended();
        }

        extended.define = function define() {
            return extender.define.apply(extender, arguments);
        };

        return extended;
    }

    if ("undefined" !== typeof exports) {
        if ("undefined" !== typeof module && module.exports) {
            module.exports = defineExtended(require("extender"), require);

        }
    } else if ("function" === typeof define) {
        define(["require"], function (require) {
            return defineExtended(require("extender"), require);
        });
    } else {
        this.extended = defineExtended(this.extender);
    }

}).call(this);







});

require.define("/node_modules/leafy/node_modules/extended/node_modules/extender/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {"main":"index.js"}
});

require.define("/node_modules/leafy/node_modules/extended/node_modules/extender/index.js",function(require,module,exports,__dirname,__filename,process,global){module.exports = require("./extender.js");
});

require.define("/node_modules/leafy/node_modules/extended/node_modules/extender/extender.js",function(require,module,exports,__dirname,__filename,process,global){(function () {
    /*jshint strict:false*/


    /**
     *
     * @projectName extender
     * @github http://github.com/doug-martin/extender
     * @header
     * [![build status](https://secure.travis-ci.org/doug-martin/extender.png)](http://travis-ci.org/doug-martin/extender)
     * # Extender
     *
     * `extender` is a library that helps in making chainable APIs, by creating a function that accepts different values and returns an object decorated with functions based on the type.
     *
     * ## Why Is Extender Different?
     *
     * Extender is different than normal chaining because is does more than return `this`. It decorates your values in a type safe manner.
     *
     * For example if you return an array from a string based method then the returned value will be decorated with array methods and not the string methods. This allow you as the developer to focus on your API and not worrying about how to properly build and connect your API.
     *
     *
     * ## Installation
     *
     * ```
     * npm install extender
     * ```
     *
     * Or [download the source](https://raw.github.com/doug-martin/extender/master/extender.js) ([minified](https://raw.github.com/doug-martin/extender/master/extender-min.js))
     *
     * **Note** `extender` depends on [`declare.js`](http://doug-martin.github.com/declare.js/).
     *
     * ### Requirejs
     *
     * To use with requirejs place the `extend` source in the root scripts directory
     *
     * ```javascript
     *
     * define(["extender"], function(extender){
     * });
     *
     * ```
     *
     *
     * ## Usage
     *
     * **`extender.define(tester, decorations)`**
     *
     * To create your own extender call the `extender.define` function.
     *
     * This function accepts an optional tester which is used to determine a value should be decorated with the specified `decorations`
     *
     * ```javascript
     * function isString(obj) {
     *     return !isUndefinedOrNull(obj) && (typeof obj === "string" || obj instanceof String);
     * }
     *
     *
     * var myExtender = extender.define(isString, {
     *		multiply: function (str, times) {
     *			var ret = str;
     *			for (var i = 1; i < times; i++) {
     *				ret += str;
     *			}
     *			return ret;
     *		},
     *		toArray: function (str, delim) {
     *			delim = delim || "";
     *			return str.split(delim);
     *		}
     *	});
     *
     * myExtender("hello").multiply(2).value(); //hellohello
     *
     * ```
     *
     * If you do not specify a tester function and just pass in an object of `functions` then all values passed in will be decorated with methods.
     *
     * ```javascript
     *
     * function isUndefined(obj) {
     *     var undef;
     *     return obj === undef;
     * }
     *
     * function isUndefinedOrNull(obj) {
     *	var undef;
     *     return obj === undef || obj === null;
     * }
     *
     * function isArray(obj) {
     *     return Object.prototype.toString.call(obj) === "[object Array]";
     * }
     *
     * function isBoolean(obj) {
     *     var undef, type = typeof obj;
     *     return !isUndefinedOrNull(obj) && type === "boolean" || type === "Boolean";
     * }
     *
     * function isString(obj) {
     *     return !isUndefinedOrNull(obj) && (typeof obj === "string" || obj instanceof String);
     * }
     *
     * var myExtender = extender.define({
     *	isUndefined : isUndefined,
     *	isUndefinedOrNull : isUndefinedOrNull,
     *	isArray : isArray,
     *	isBoolean : isBoolean,
     *	isString : isString
     * });
     *
     * ```
     *
     * To use
     *
     * ```
     * var undef;
     * myExtender("hello").isUndefined().value(); //false
     * myExtender(undef).isUndefined().value(); //true
     * ```
     *
     * You can also chain extenders so that they accept multiple types and decorates accordingly.
     *
     * ```javascript
     * myExtender
     *     .define(isArray, {
     *		pluck: function (arr, m) {
     *			var ret = [];
     *			for (var i = 0, l = arr.length; i < l; i++) {
     *				ret.push(arr[i][m]);
     *			}
     *			return ret;
     *		}
     *	})
     *     .define(isBoolean, {
     *		invert: function (val) {
     *			return !val;
     *		}
     *	});
     *
     * myExtender([{a: "a"},{a: "b"},{a: "c"}]).pluck("a").value(); //["a", "b", "c"]
     * myExtender("I love javascript!").toArray(/\s+/).pluck("0"); //["I", "l", "j"]
     *
     * ```
     *
     * Notice that we reuse the same extender as defined above.
     *
     * **Return Values**
     *
     * When creating an extender if you return a value from one of the decoration functions then that value will also be decorated. If you do not return any values then the extender will be returned.
     *
     * **Default decoration methods**
     *
     * By default every value passed into an extender is decorated with the following methods.
     *
     * * `value` : The value this extender represents.
     * * `eq(otherValue)` : Tests strict equality of the currently represented value to the `otherValue`
     * * `neq(oterValue)` : Tests strict inequality of the currently represented value.
     * * `print` : logs the current value to the console.
     *
     * **Extender initialization**
     *
     * When creating an extender you can also specify a constructor which will be invoked with the current value.
     *
     * ```javascript
     * myExtender.define(isString, {
     *	constructor : function(val){
     *     //set our value to the string trimmed
     *		this._value = val.trimRight().trimLeft();
     *	}
     * });
     * ```
     *
     * **`noWrap`**
     *
     * `extender` also allows you to specify methods that should not have the value wrapped providing a cleaner exit function other than `value()`.
     *
     * For example suppose you have an API that allows you to build a validator, rather than forcing the user to invoke the `value` method you could add a method called `validator` which makes more syntactic sense.
     *
     * ```
     *
     * var myValidator = extender.define({
     *     //chainable validation methods
     *     //...
     *     //end chainable validation methods
     *
     *     noWrap : {
     *         validator : function(){
     *             //return your validator
     *         }
     *     }
     * });
     *
     * myValidator().isNotNull().isEmailAddress().validator(); //now you dont need to call .value()
     *
     *
     * ```
     * **`extender.extend(extendr)`**
     *
     * You may also compose extenders through the use of `extender.extend(extender)`, which will return an entirely new extender that is the composition of extenders.
     *
     * Suppose you have the following two extenders.
     *
     * ```javascript
     * var myExtender = extender
     *        .define({
     *            isFunction: is.function,
     *            isNumber: is.number,
     *            isString: is.string,
     *            isDate: is.date,
     *            isArray: is.array,
     *            isBoolean: is.boolean,
     *            isUndefined: is.undefined,
     *            isDefined: is.defined,
     *            isUndefinedOrNull: is.undefinedOrNull,
     *            isNull: is.null,
     *            isArguments: is.arguments,
     *            isInstanceOf: is.instanceOf,
     *            isRegExp: is.regExp
     *        });
     * var myExtender2 = extender.define(is.array, {
     *     pluck: function (arr, m) {
     *         var ret = [];
     *         for (var i = 0, l = arr.length; i < l; i++) {
     *             ret.push(arr[i][m]);
     *         }
     *         return ret;
     *     },
     *
     *     noWrap: {
     *         pluckPlain: function (arr, m) {
     *             var ret = [];
     *             for (var i = 0, l = arr.length; i < l; i++) {
     *                 ret.push(arr[i][m]);
     *             }
     *             return ret;
     *         }
     *     }
     * });
     *
     *
     * ```
     *
     * And you do not want to alter either of them but instead what to create a third that is the union of the two.
     *
     *
     * ```javascript
     * var composed = extender.extend(myExtender).extend(myExtender2);
     * ```
     * So now you can use the new extender with the joined functionality if `myExtender` and `myExtender2`.
     *
     * ```javascript
     * var extended = composed([
     *      {a: "a"},
     *      {a: "b"},
     *      {a: "c"}
     * ]);
     * extended.isArray().value(); //true
     * extended.pluck("a").value(); // ["a", "b", "c"]);
     *
     * ```
     *
     * **Note** `myExtender` and `myExtender2` will **NOT** be altered.
     *
     * **`extender.expose(methods)`**
     *
     * The `expose` method allows you to add methods to your extender that are not wrapped or automatically chained by exposing them on the extender directly.
     *
     * ```
     * var isMethods = {
     *      isFunction: is.function,
     *      isNumber: is.number,
     *      isString: is.string,
     *      isDate: is.date,
     *      isArray: is.array,
     *      isBoolean: is.boolean,
     *      isUndefined: is.undefined,
     *      isDefined: is.defined,
     *      isUndefinedOrNull: is.undefinedOrNull,
     *      isNull: is.null,
     *      isArguments: is.arguments,
     *      isInstanceOf: is.instanceOf,
     *      isRegExp: is.regExp
     * };
     *
     * var myExtender = extender.define(isMethods).expose(isMethods);
     *
     * myExtender.isArray([]); //true
     * myExtender([]).isArray([]).value(); //true
     *
     * ```
     *
     *
     * **Using `instanceof`**
     *
     * When using extenders you can test if a value is an `instanceof` of an extender by using the instanceof operator.
     *
     * ```javascript
     * var str = myExtender("hello");
     *
     * str instanceof myExtender; //true
     * ```
     *
     * ## Examples
     *
     * To see more examples click [here](https://github.com/doug-martin/extender/tree/master/examples)
     */
    function defineExtender(declare) {


        var slice = Array.prototype.slice, undef;

        function indexOf(arr, item) {
            if (arr && arr.length) {
                for (var i = 0, l = arr.length; i < l; i++) {
                    if (arr[i] === item) {
                        return i;
                    }
                }
            }
            return -1;
        }

        function isArray(obj) {
            return Object.prototype.toString.call(obj) === "[object Array]";
        }

        var merge = (function merger() {
            function _merge(target, source, exclude) {
                var name, s;
                for (name in source) {
                    if (source.hasOwnProperty(name) && indexOf(exclude, name) === -1) {
                        s = source[name];
                        if (!(name in target) || (target[name] !== s)) {
                            target[name] = s;
                        }
                    }
                }
                return target;
            }

            return function merge(obj) {
                if (!obj) {
                    obj = {};
                }
                var l = arguments.length;
                var exclude = arguments[arguments.length - 1];
                if (isArray(exclude)) {
                    l--;
                } else {
                    exclude = [];
                }
                for (var i = 1; i < l; i++) {
                    _merge(obj, arguments[i], exclude);
                }
                return obj; // Object
            };
        }());


        function extender(supers) {
            supers = supers || [];
            var Base = declare({
                instance: {
                    constructor: function (value) {
                        this._value = value;
                    },

                    value: function () {
                        return this._value;
                    },

                    eq: function eq(val) {
                        return this["__extender__"](this._value === val);
                    },

                    neq: function neq(other) {
                        return this["__extender__"](this._value !== other);
                    },
                    print: function () {
                        console.log(this._value);
                        return this;
                    }
                }
            }), defined = [];

            function addMethod(proto, name, func) {
                if ("function" !== typeof func) {
                    throw new TypeError("when extending type you must provide a function");
                }
                var extendedMethod;
                if (name === "constructor") {
                    extendedMethod = function () {
                        this._super(arguments);
                        func.apply(this, arguments);
                    };
                } else {
                    extendedMethod = function extendedMethod() {
                        var args = slice.call(arguments);
                        args.unshift(this._value);
                        var ret = func.apply(this, args);
                        return ret !== undef ? this["__extender__"](ret) : this;
                    };
                }
                proto[name] = extendedMethod;
            }

            function addNoWrapMethod(proto, name, func) {
                if ("function" !== typeof func) {
                    throw new TypeError("when extending type you must provide a function");
                }
                var extendedMethod;
                if (name === "constructor") {
                    extendedMethod = function () {
                        this._super(arguments);
                        func.apply(this, arguments);
                    };
                } else {
                    extendedMethod = function extendedMethod() {
                        var args = slice.call(arguments);
                        args.unshift(this._value);
                        return func.apply(this, args);
                    };
                }
                proto[name] = extendedMethod;
            }

            function decorateProto(proto, decoration, nowrap) {
                for (var i in decoration) {
                    if (decoration.hasOwnProperty(i)) {
                        if (i !== "getters" && i !== "setters") {
                            if (i === "noWrap") {
                                decorateProto(proto, decoration[i], true);
                            } else if (nowrap) {
                                addNoWrapMethod(proto, i, decoration[i]);
                            } else {
                                addMethod(proto, i, decoration[i]);
                            }
                        } else {
                            proto[i] = decoration[i];
                        }
                    }
                }
            }

            function _extender(obj) {
                var ret = obj, i, l;
                if (!(obj instanceof Base)) {
                    var OurBase = Base;
                    for (i = 0, l = defined.length; i < l; i++) {
                        var definer = defined[i];
                        if (definer[0](obj)) {
                            OurBase = OurBase.extend({instance: definer[1]});
                        }
                    }
                    ret = new OurBase(obj);
                    ret["__extender__"] = _extender;
                }
                return ret;
            }

            function always() {
                return true;
            }

            function define(tester, decorate) {
                if (arguments.length) {
                    if (typeof tester === "object") {
                        decorate = tester;
                        tester = always;
                    }
                    decorate = decorate || {};
                    var proto = {};
                    decorateProto(proto, decorate);
                    //handle browsers like which skip over the constructor while looping
                    if (!proto.hasOwnProperty("constructor")) {
                        if (decorate.hasOwnProperty("constructor")) {
                            addMethod(proto, "constructor", decorate.constructor);
                        } else {
                            proto.constructor = function () {
                                this._super(arguments);
                            };
                        }
                    }
                    defined.push([tester, proto]);
                }
                return _extender;
            }

            function extend(supr) {
                if (supr && supr.hasOwnProperty("__defined__")) {
                    _extender["__defined__"] = defined = defined.concat(supr["__defined__"]);
                }
                merge(_extender, supr, ["define", "extend", "expose", "__defined__"]);
                return _extender;
            }

            _extender.define = define;
            _extender.extend = extend;
            _extender.expose = function expose() {
                var methods;
                for (var i = 0, l = arguments.length; i < l; i++) {
                    methods = arguments[i];
                    if (typeof methods === "object") {
                        merge(_extender, methods, ["define", "extend", "expose", "__defined__"]);
                    }
                }
                return _extender;
            };
            _extender["__defined__"] = defined;


            return _extender;
        }

        return {
            define: function () {
                return extender().define.apply(extender, arguments);
            },

            extend: function (supr) {
                return extender().define().extend(supr);
            }
        };

    }

    if ("undefined" !== typeof exports) {
        if ("undefined" !== typeof module && module.exports) {
            module.exports = defineExtender(require("declare.js"));

        }
    } else if ("function" === typeof define) {
        define(["require"], function (require) {
            return defineExtender((require("declare.js")));
        });
    } else {
        this.extender = defineExtender(this.declare);
    }

}).call(this);
});

require.define("/node_modules/leafy/node_modules/declare.js/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {"main":"index.js"}
});

require.define("/node_modules/leafy/node_modules/declare.js/index.js",function(require,module,exports,__dirname,__filename,process,global){module.exports = require("./declare.js");
});

require.define("/node_modules/leafy/node_modules/declare.js/declare.js",function(require,module,exports,__dirname,__filename,process,global){(function () {

    /**
     * @projectName declare
     * @github http://github.com/doug-martin/declare.js
     * @header
     *
     * Declare is a library designed to allow writing object oriented code the same way in both the browser and node.js.
     *
     * ##Installation
     *
     * `npm install declare.js`
     *
     * Or [download the source](https://raw.github.com/doug-martin/declare.js/master/declare.js) ([minified](https://raw.github.com/doug-martin/declare.js/master/declare-min.js))
     *
     * ###Requirejs
     *
     * To use with requirejs place the `declare` source in the root scripts directory
     *
     * ```
     *
     * define(["declare"], function(declare){
     *      return declare({
     *          instance : {
     *              hello : function(){
     *                  return "world";
     *              }
     *          }
     *      });
     * });
     *
     * ```
     *
     *
     * ##Usage
     *
     * declare.js provides
     *
     * Class methods
     *
     * * `as(module | object, name)` : exports the object to module or the object with the name
     * * `mixin(mixin)` : mixes in an object but does not inherit directly from the object. **Note** this does not return a new class but changes the original class.
     * * `extend(proto)` : extend a class with the given properties. A shortcut to `declare(Super, {})`;
     *
     * Instance methods
     *
     * * `_super(arguments)`: calls the super of the current method, you can pass in either the argments object or an array with arguments you want passed to super
     * * `_getSuper()`: returns a this methods direct super.
     * * `_static` : use to reference class properties and methods.
     * * `get(prop)` : gets a property invoking the getter if it exists otherwise it just returns the named property on the object.
     * * `set(prop, val)` : sets a property invoking the setter if it exists otherwise it just sets the named property on the object.
     *
     *
     * ###Declaring a new Class
     *
     * Creating a new class with declare is easy!
     *
     * ```
     *
     * var Mammal = declare({
     *      //define your instance methods and properties
     *      instance : {
     *
     *          //will be called whenever a new instance is created
     *          constructor: function(options) {
     *              options = options || {};
     *              this._super(arguments);
     *              this._type = options.type || "mammal";
     *          },
     *
     *          speak : function() {
     *              return  "A mammal of type " + this._type + " sounds like";
     *          },
     *
     *          //Define your getters
     *          getters : {
     *
     *              //can be accessed by using the get method. (mammal.get("type"))
     *              type : function() {
     *                  return this._type;
     *              }
     *          },
     *
     *           //Define your setters
     *          setters : {
     *
     *                //can be accessed by using the set method. (mammal.set("type", "mammalType"))
     *              type : function(t) {
     *                  this._type = t;
     *              }
     *          }
     *      },
     *
     *      //Define your static methods
     *      static : {
     *
     *          //Mammal.soundOff(); //"Im a mammal!!"
     *          soundOff : function() {
     *              return "Im a mammal!!";
     *          }
     *      }
     * });
     *
     *
     * ```
     *
     * You can use Mammal just like you would any other class.
     *
     * ```
     * Mammal.soundOff("Im a mammal!!");
     *
     * var myMammal = new Mammal({type : "mymammal"});
     * myMammal.speak(); // "A mammal of type mymammal sounds like"
     * myMammal.get("type"); //"mymammal"
     * myMammal.set("type", "mammal");
     * myMammal.get("type"); //"mammal"
     *
     *
     * ```
     *
     * ###Extending a class
     *
     * If you want to just extend a single class use the .extend method.
     *
     * ```
     *
     * var Wolf = Mammal.extend({
     *
     *   //define your instance method
     *   instance: {
     *
     *        //You can override super constructors just be sure to call `_super`
     *       constructor: function(options) {
     *          options = options || {};
     *          this._super(arguments); //call our super constructor.
     *          this._sound = "growl";
     *          this._color = options.color || "grey";
     *      },
     *
     *      //override Mammals `speak` method by appending our own data to it.
     *      speak : function() {
     *          return this._super(arguments) + " a " + this._sound;
     *      },
     *
     *      //add new getters for sound and color
     *      getters : {
     *
     *           //new Wolf().get("type")
     *           //notice color is read only as we did not define a setter
     *          color : function() {
     *              return this._color;
     *          },
     *
     *          //new Wolf().get("sound")
     *          sound : function() {
     *              return this._sound;
     *          }
     *      },
     *
     *      setters : {
     *
     *          //new Wolf().set("sound", "howl")
     *          sound : function(s) {
     *              this._sound = s;
     *          }
     *      }
     *
     *  },
     *
     *  static : {
     *
     *      //You can override super static methods also! And you can still use _super
     *      soundOff : function() {
     *          //You can even call super in your statics!!!
     *          //should return "I'm a mammal!! that growls"
     *          return this._super(arguments) + " that growls";
     *      }
     *  }
     * });
     *
     * Wolf.soundOff(); //Im a mammal!! that growls
     *
     * var myWolf = new Wolf();
     * myWolf instanceof Mammal //true
     * myWolf instanceof Wolf //true
     *
     * ```
     *
     * You can also extend a class by using the declare method and just pass in the super class.
     *
     * ```
     * //Typical hierarchical inheritance
     * // Mammal->Wolf->Dog
     * var Dog = declare(Wolf, {
     *    instance: {
     *        constructor: function(options) {
     *            options = options || {};
     *            this._super(arguments);
     *            //override Wolfs initialization of sound to woof.
     *            this._sound = "woof";
     *
     *        },
     *
     *        speak : function() {
     *            //Should return "A mammal of type mammal sounds like a growl thats domesticated"
     *            return this._super(arguments) + " thats domesticated";
     *        }
     *    },
     *
     *    static : {
     *        soundOff : function() {
     *            //should return "I'm a mammal!! that growls but now barks"
     *            return this._super(arguments) + " but now barks";
     *        }
     *    }
     * });
     *
     * Dog.soundOff(); //Im a mammal!! that growls but now barks
     *
     * var myDog = new Dog();
     * myDog instanceof Mammal //true
     * myDog instanceof Wolf //true
     * myDog instanceof Dog //true
     *
     *
     * //Notice you still get the extend method.
     *
     * // Mammal->Wolf->Dog->Breed
     * var Breed = Dog.extend({
     *    instance: {
     *
     *        //initialize outside of constructor
     *        _pitch : "high",
     *
     *        constructor: function(options) {
     *            options = options || {};
     *            this._super(arguments);
     *            this.breed = options.breed || "lab";
     *        },
     *
     *        speak : function() {
     *            //Should return "A mammal of type mammal sounds like a
     *            //growl thats domesticated with a high pitch!"
     *            return this._super(arguments) + " with a " + this._pitch + " pitch!";
     *        },
     *
     *        getters : {
     *            pitch : function() {
     *                return this._pitch;
     *            }
     *        }
     *    },
     *
     *    static : {
     *        soundOff : function() {
     *            //should return "I'M A MAMMAL!! THAT GROWLS BUT NOW BARKS!"
     *            return this._super(arguments).toUpperCase() + "!";
     *        }
     *    }
     * });
     *
     *
     * Breed.soundOff()//"IM A MAMMAL!! THAT GROWLS BUT NOW BARKS!"
     *
     * var myBreed = new Breed({color : "gold", type : "lab"}),
     * myBreed instanceof Dog //true
     * myBreed instanceof Wolf //true
     * myBreed instanceof Mammal //true
     * myBreed.speak() //"A mammal of type lab sounds like a woof thats domesticated with a high pitch!"
     * myBreed.get("type") //"lab"
     * myBreed.get("color") //"gold"
     * myBreed.get("sound")" //"woof"
     * ```
     *
     * ###Multiple Inheritance / Mixins
     *
     * declare also allows the use of multiple super classes.
     * This is useful if you have generic classes that provide functionality but shouldnt be used on their own.
     *
     * Lets declare a mixin that allows us to watch for property changes.
     *
     * ```
     * //Notice that we set up the functions outside of declare because we can reuse them
     *
     * function _set(prop, val) {
     *     //get the old value
     *     var oldVal = this.get(prop);
     *     //call super to actually set the property
     *     var ret = this._super(arguments);
     *     //call our handlers
     *     this.__callHandlers(prop, oldVal, val);
     *     return ret;
     * }
     *
     * function _callHandlers(prop, oldVal, newVal) {
     *    //get our handlers for the property
     *     var handlers = this.__watchers[prop], l;
     *     //if the handlers exist and their length does not equal 0 then we call loop through them
     *     if (handlers && (l = handlers.length) !== 0) {
     *         for (var i = 0; i < l; i++) {
     *             //call the handler
     *             handlers[i].call(null, prop, oldVal, newVal);
     *         }
     *     }
     * }
     *
     *
     * //the watch function
     * function _watch(prop, handler) {
     *     if ("function" !== typeof handler) {
     *         //if its not a function then its an invalid handler
     *         throw new TypeError("Invalid handler.");
     *     }
     *     if (!this.__watchers[prop]) {
     *         //create the watchers if it doesnt exist
     *         this.__watchers[prop] = [handler];
     *     } else {
     *         //otherwise just add it to the handlers array
     *         this.__watchers[prop].push(handler);
     *     }
     * }
     *
     * function _unwatch(prop, handler) {
     *     if ("function" !== typeof handler) {
     *         throw new TypeError("Invalid handler.");
     *     }
     *     var handlers = this.__watchers[prop], index;
     *     if (handlers && (index = handlers.indexOf(handler)) !== -1) {
     *        //remove the handler if it is found
     *         handlers.splice(index, 1);
     *     }
     * }
     *
     * declare({
     *     instance:{
     *         constructor:function () {
     *             this._super(arguments);
     *             //set up our watchers
     *             this.__watchers = {};
     *         },
     *
     *         //override the default set function so we can watch values
     *         "set":_set,
     *         //set up our callhandlers function
     *         __callHandlers:_callHandlers,
     *         //add the watch function
     *         watch:_watch,
     *         //add the unwatch function
     *         unwatch:_unwatch
     *     },
     *
     *     "static":{
     *
     *         init:function () {
     *             this._super(arguments);
     *             this.__watchers = {};
     *         },
     *         //override the default set function so we can watch values
     *         "set":_set,
     *         //set our callHandlers function
     *         __callHandlers:_callHandlers,
     *         //add the watch
     *         watch:_watch,
     *         //add the unwatch function
     *         unwatch:_unwatch
     *     }
     * })
     *
     * ```
     *
     * Now lets use the mixin
     *
     * ```
     * var WatchDog = declare([Dog, WatchMixin]);
     *
     * var watchDog = new WatchDog();
     * //create our handler
     * function watch(id, oldVal, newVal) {
     *     console.log("watchdog's %s was %s, now %s", id, oldVal, newVal);
     * }
     *
     * //watch for property changes
     * watchDog.watch("type", watch);
     * watchDog.watch("color", watch);
     * watchDog.watch("sound", watch);
     *
     * //now set the properties each handler will be called
     * watchDog.set("type", "newDog");
     * watchDog.set("color", "newColor");
     * watchDog.set("sound", "newSound");
     *
     *
     * //unwatch the property changes
     * watchDog.unwatch("type", watch);
     * watchDog.unwatch("color", watch);
     * watchDog.unwatch("sound", watch);
     *
     * //no handlers will be called this time
     * watchDog.set("type", "newDog");
     * watchDog.set("color", "newColor");
     * watchDog.set("sound", "newSound");
     *
     *
     * ```
     *
     * ###Accessing static methods and properties witin an instance.
     *
     * To access static properties on an instance use the `_static` property which is a reference to your constructor.
     *
     * For example if your in your constructor and you want to have configurable default values.
     *
     * ```
     * consturctor : function constructor(opts){
     *     this.opts = opts || {};
     *     this._type = opts.type || this._static.DEFAULT_TYPE;
     * }
     * ```
     *
     *
     *
     * ###Creating a new instance of within an instance.
     *
     * Often times you want to create a new instance of an object within an instance. If your subclassed however you cannot return a new instance of the parent class as it will not be the right sub class. `declare` provides a way around this by setting the `_static` property on each isntance of the class.
     *
     * Lets add a reproduce method `Mammal`
     *
     * ```
     * reproduce : function(options){
     *     return new this._static(options);
     * }
     * ```
     *
     * Now in each subclass you can call reproduce and get the proper type.
     *
     * ```
     * var myDog = new Dog();
     * var myDogsChild = myDog.reproduce();
     *
     * myDogsChild instanceof Dog; //true
     * ```
     *
     * ###Using the `as`
     *
     * `declare` also provides an `as` method which allows you to add your class to an object or if your using node.js you can pass in `module` and the class will be exported as the module.
     *
     * ```
     * var animals = {};
     *
     * Mammal.as(animals, "Dog");
     * Wolf.as(animals, "Wolf");
     * Dog.as(animals, "Dog");
     * Breed.as(animals, "Breed");
     *
     * var myDog = new animals.Dog();
     *
     * ```
     *
     * Or in node
     *
     * ```
     * Mammal.as(exports, "Dog");
     * Wolf.as(exports, "Wolf");
     * Dog.as(exports, "Dog");
     * Breed.as(exports, "Breed");
     *
     * ```
     *
     * To export a class as the `module` in node
     *
     * ```
     * Mammal.as(module);
     * ```
     *
     *
     */
    function createDeclared() {
        var arraySlice = Array.prototype.slice, classCounter = 0, Base, forceNew = new Function();

        function argsToArray(args, slice) {
            slice = slice || 0;
            return arraySlice.call(args, slice);
        }

        function isArray(obj) {
            return Object.prototype.toString.call(obj) === "[object Array]";
        }

        function isObject(obj) {
            var undef;
            return obj !== null && obj !== undef && typeof obj === "object";
        }

        function isHash(obj) {
            var ret = isObject(obj);
            return ret && obj.constructor === Object;
        }

        function indexOf(arr, item) {
            if (arr && arr.length) {
                for (var i = 0, l = arr.length; i < l; i++) {
                    if (arr[i] === item) {
                        return i;
                    }
                }
            }
            return -1;
        }

        function merge(target, source, exclude) {
            var name, s;
            for (name in source) {
                if (source.hasOwnProperty(name) && indexOf(exclude, name) === -1) {
                    s = source[name];
                    if (!(name in target) || (target[name] !== s)) {
                        target[name] = s;
                    }
                }
            }
            return target;
        }

        function callSuper(args, a) {
            var meta = this.__meta,
                supers = meta.supers,
                l = supers.length, superMeta = meta.superMeta, pos = superMeta.pos;
            if (l > pos) {
                a && (args = a);
                var name = superMeta.name, f = superMeta.f, m;
                do {
                    m = supers[pos][name];
                    if ("function" === typeof m && (m = m._f || m) !== f) {
                        superMeta.pos = 1 + pos;
                        return m.apply(this, args);
                    }
                } while (l > ++pos);
            }
            return null;
        }

        function getSuper() {
            var meta = this.__meta,
                supers = meta.supers,
                l = supers.length, superMeta = meta.superMeta, pos = superMeta.pos;
            if (l > pos) {
                var name = superMeta.name, f = superMeta.f, m;
                do {
                    m = supers[pos][name];
                    if ("function" === typeof m && (m = m._f || m) !== f) {
                        superMeta.pos = 1 + pos;
                        return m.bind(this);
                    }
                } while (l > ++pos);
            }
            return null;
        }

        function getter(name) {
            var getters = this.__getters__;
            if (getters.hasOwnProperty(name)) {
                return getters[name].apply(this);
            } else {
                return this[name];
            }
        }

        function setter(name, val) {
            var setters = this.__setters__;
            if (isHash(name)) {
                for (var i in name) {
                    var prop = name[i];
                    if (setters.hasOwnProperty(i)) {
                        setters[name].call(this, prop);
                    } else {
                        this[i] = prop;
                    }
                }
            } else {
                if (setters.hasOwnProperty(name)) {
                    return setters[name].apply(this, argsToArray(arguments, 1));
                } else {
                    return this[name] = val;
                }
            }
        }


        function defaultFunction() {
            var meta = this.__meta || {},
                supers = meta.supers,
                l = supers.length, superMeta = meta.superMeta, pos = superMeta.pos;
            if (l > pos) {
                var name = superMeta.name, f = superMeta.f, m;
                do {
                    m = supers[pos][name];
                    if ("function" === typeof m && (m = m._f || m) !== f) {
                        superMeta.pos = 1 + pos;
                        return m.apply(this, arguments);
                    }
                } while (l > ++pos);
            }
            return null;
        }


        function functionWrapper(f, name) {
            var wrapper = function wrapper() {
                var ret, meta = this.__meta || {};
                var orig = meta.superMeta;
                meta.superMeta = {f: f, pos: 0, name: name};
                ret = f.apply(this, arguments);
                meta.superMeta = orig;
                return ret;
            };
            wrapper._f = f;
            return wrapper;
        }

        function defineMixinProps(child, proto) {

            var operations = proto.setters || {}, __setters = child.__setters__, __getters = child.__getters__;
            for (var i in operations) {
                if (!__setters.hasOwnProperty(i)) {  //make sure that the setter isnt already there
                    __setters[i] = operations[i];
                }
            }
            operations = proto.getters || {};
            for (i in operations) {
                if (!__getters.hasOwnProperty(i)) {  //make sure that the setter isnt already there
                    __getters[i] = operations[i];
                }
            }
            for (var j in proto) {
                if (j != "getters" && j != "setters") {
                    var p = proto[j];
                    if ("function" === typeof p) {
                        if (!child.hasOwnProperty(j)) {
                            child[j] = functionWrapper(defaultFunction, j);
                        }
                    } else {
                        child[j] = p;
                    }
                }
            }
        }

        function mixin() {
            var args = argsToArray(arguments), l = args.length;
            var child = this.prototype;
            var childMeta = child.__meta, thisMeta = this.__meta, bases = child.__meta.bases, staticBases = bases.slice(),
                staticSupers = thisMeta.supers || [], supers = childMeta.supers || [];
            for (var i = 0; i < l; i++) {
                var m = args[i], mProto = m.prototype;
                var protoMeta = mProto.__meta, meta = m.__meta;
                !protoMeta && (protoMeta = (mProto.__meta = {proto: mProto || {}}));
                !meta && (meta = (m.__meta = {proto: m.__proto__ || {}}));
                defineMixinProps(child, protoMeta.proto || {});
                defineMixinProps(this, meta.proto || {});
                //copy the bases for static,

                mixinSupers(m.prototype, supers, bases);
                mixinSupers(m, staticSupers, staticBases);
            }
            return this;
        }

        function mixinSupers(sup, arr, bases) {
            var meta = sup.__meta;
            !meta && (meta = (sup.__meta = {}));
            var unique = sup.__meta.unique;
            !unique && (meta.unique = "declare" + ++classCounter);
            //check it we already have this super mixed into our prototype chain
            //if true then we have already looped their supers!
            if (indexOf(bases, unique) === -1) {
                //add their id to our bases
                bases.push(unique);
                var supers = sup.__meta.supers || [], i = supers.length - 1 || 0;
                while (i >= 0) {
                    mixinSupers(supers[i--], arr, bases);
                }
                arr.unshift(sup);
            }
        }

        function defineProps(child, proto) {
            var operations = proto.setters,
                __setters = child.__setters__,
                __getters = child.__getters__;
            if (operations) {
                for (var i in operations) {
                    __setters[i] = operations[i];
                }
            }
            operations = proto.getters || {};
            if (operations) {
                for (i in operations) {
                    __getters[i] = operations[i];
                }
            }
            for (i in proto) {
                if (i != "getters" && i != "setters") {
                    var f = proto[i];
                    if ("function" === typeof f) {
                        var meta = f.__meta || {};
                        if (!meta.isConstructor) {
                            child[i] = functionWrapper(f, i);
                        } else {
                            child[i] = f;
                        }
                    } else {
                        child[i] = f;
                    }
                }
            }

        }

        function _export(obj, name) {
            if (obj && name) {
                obj[name] = this;
            } else {
                obj.exports = obj = this;
            }
            return this;
        }

        function extend(proto) {
            return declare(this, proto);
        }

        function getNew(ctor) {
            // create object with correct prototype using a do-nothing
            // constructor
            forceNew.prototype = ctor.prototype;
            var t = new forceNew();
            forceNew.prototype = null;	// clean up
            return t;
        }


        function __declare(child, sup, proto) {
            var childProto = {}, supers = [];
            var unique = "declare" + ++classCounter, bases = [], staticBases = [];
            var instanceSupers = [], staticSupers = [];
            var meta = {
                supers: instanceSupers,
                unique: unique,
                bases: bases,
                superMeta: {
                    f: null,
                    pos: 0,
                    name: null
                }
            };
            var childMeta = {
                supers: staticSupers,
                unique: unique,
                bases: staticBases,
                isConstructor: true,
                superMeta: {
                    f: null,
                    pos: 0,
                    name: null
                }
            };

            if (isHash(sup) && !proto) {
                proto = sup;
                sup = Base;
            }

            if ("function" === typeof sup || isArray(sup)) {
                supers = isArray(sup) ? sup : [sup];
                sup = supers.shift();
                child.__meta = childMeta;
                childProto = getNew(sup);
                childProto.__meta = meta;
                childProto.__getters__ = merge({}, childProto.__getters__ || {});
                childProto.__setters__ = merge({}, childProto.__setters__ || {});
                child.__getters__ = merge({}, child.__getters__ || {});
                child.__setters__ = merge({}, child.__setters__ || {});
                mixinSupers(sup.prototype, instanceSupers, bases);
                mixinSupers(sup, staticSupers, staticBases);
            } else {
                child.__meta = childMeta;
                childProto.__meta = meta;
                childProto.__getters__ = childProto.__getters__ || {};
                childProto.__setters__ = childProto.__setters__ || {};
                child.__getters__ = child.__getters__ || {};
                child.__setters__ = child.__setters__ || {};
            }
            child.prototype = childProto;
            if (proto) {
                var instance = meta.proto = proto.instance || {};
                var stat = childMeta.proto = proto.static || {};
                stat.init = stat.init || defaultFunction;
                defineProps(childProto, instance);
                defineProps(child, stat);
                if (!instance.hasOwnProperty("constructor")) {
                    childProto.constructor = instance.constructor = functionWrapper(defaultFunction, "constructor");
                } else {
                    childProto.constructor = functionWrapper(instance.constructor, "constructor");
                }
            } else {
                meta.proto = {};
                childMeta.proto = {};
                child.init = functionWrapper(defaultFunction, "init");
                childProto.constructor = functionWrapper(defaultFunction, "constructor");
            }
            if (supers.length) {
                mixin.apply(child, supers);
            }
            if (sup) {
                //do this so we mixin our super methods directly but do not ov
                merge(child, merge(merge({}, sup), child));
            }
            childProto._super = child._super = callSuper;
            childProto._getSuper = child._getSuper = getSuper;
            childProto._static = child;
        }

        function declare(sup, proto) {
            function declared() {
                this.constructor.apply(this, arguments);
            }

            __declare(declared, sup, proto);
            return declared.init() || declared;
        }

        function singleton(sup, proto) {
            var retInstance;

            function declaredSingleton() {
                if (!retInstance) {
                    this.constructor.apply(this, arguments);
                    retInstance = this;
                }
                return retInstance;
            }

            __declare(declaredSingleton, sup, proto);
            return  declaredSingleton.init() || declaredSingleton;
        }

        Base = declare({
            instance: {
                "get": getter,
                "set": setter
            },

            "static": {
                "get": getter,
                "set": setter,
                mixin: mixin,
                extend: extend,
                as: _export
            }
        });

        declare.singleton = singleton;
        return declare;
    }

    if ("undefined" !== typeof exports) {
        if ("undefined" !== typeof module && module.exports) {
            module.exports = createDeclared();
        }
    } else if ("function" === typeof define) {
        define(createDeclared);
    } else {
        this.declare = createDeclared();
    }
}());




});

require.define("/node_modules/leafy/node_modules/is-extended/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {"main":"index.js"}
});

require.define("/node_modules/leafy/node_modules/is-extended/index.js",function(require,module,exports,__dirname,__filename,process,global){(function () {
    "use strict";

    function defineIsa(extended) {

        var undef, pSlice = Array.prototype.slice;

        function argsToArray(args, slice) {
            slice = slice || 0;
            return pSlice.call(args, slice);
        }

        function keys(obj) {
            var ret = [];
            for (var i in obj) {
                if (obj.hasOwnProperty(i)) {
                    ret.push(i);
                }
            }
            return ret;
        }

        //taken from node js assert.js
        //https://github.com/joyent/node/blob/master/lib/assert.js
        function deepEqual(actual, expected) {
            // 7.1. All identical values are equivalent, as determined by ===.
            if (actual === expected) {
                return true;

            } else if (typeof Buffer !== "undefined" && Buffer.isBuffer(actual) && Buffer.isBuffer(expected)) {
                if (actual.length !== expected.length) {
                    return false;
                }

                for (var i = 0; i < actual.length; i++) {
                    if (actual[i] !== expected[i]) {
                        return false;
                    }
                }

                return true;

                // 7.2. If the expected value is a Date object, the actual value is
                // equivalent if it is also a Date object that refers to the same time.
            } else if (actual instanceof Date && expected instanceof Date) {
                return actual.getTime() === expected.getTime();

                // 7.3 If the expected value is a RegExp object, the actual value is
                // equivalent if it is also a RegExp object with the same source and
                // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
            } else if (actual instanceof RegExp && expected instanceof RegExp) {
                return actual.source === expected.source &&
                    actual.global === expected.global &&
                    actual.multiline === expected.multiline &&
                    actual.lastIndex === expected.lastIndex &&
                    actual.ignoreCase === expected.ignoreCase;

                // 7.4. Other pairs that do not both pass typeof value == 'object',
                // equivalence is determined by ==.
            } else if (isString(actual) && isString(expected) && actual !== expected) {
                return false;
            } else if (typeof actual !== 'object' && typeof expected !== 'object') {
                return actual === expected;

                // 7.5 For all other Object pairs, including Array objects, equivalence is
                // determined by having the same number of owned properties (as verified
                // with Object.prototype.hasOwnProperty.call), the same set of keys
                // (although not necessarily the same order), equivalent values for every
                // corresponding key, and an identical 'prototype' property. Note: this
                // accounts for both named and indexed properties on Arrays.
            } else {
                return objEquiv(actual, expected);
            }
        }


        function objEquiv(a, b) {
            var key;
            if (isUndefinedOrNull(a) || isUndefinedOrNull(b)) {
                return false;
            }
            // an identical 'prototype' property.
            if (a.prototype !== b.prototype) {
                return false;
            }
            //~~~I've managed to break Object.keys through screwy arguments passing.
            //   Converting to array solves the problem.
            if (isArguments(a)) {
                if (!isArguments(b)) {
                    return false;
                }
                a = pSlice.call(a);
                b = pSlice.call(b);
                return deepEqual(a, b);
            }
            try {
                var ka = keys(a),
                    kb = keys(b),
                    i;
                // having the same number of owned properties (keys incorporates
                // hasOwnProperty)
                if (ka.length !== kb.length) {
                    return false;
                }
                //the same set of keys (although not necessarily the same order),
                ka.sort();
                kb.sort();
                //~~~cheap key test
                for (i = ka.length - 1; i >= 0; i--) {
                    if (ka[i] !== kb[i]) {
                        return false;
                    }
                }
                //equivalent values for every corresponding key, and
                //~~~possibly expensive deep test
                for (i = ka.length - 1; i >= 0; i--) {
                    key = ka[i];
                    if (!deepEqual(a[key], b[key])) {
                        return false;
                    }
                }
            } catch (e) {//happens when one is a string literal and the other isn't
                return false;
            }
            return true;
        }

        function isFunction(obj) {
            return typeof obj === "function";
        }

        function isObject(obj) {
            var undef;
            return obj !== null && obj !== undef && typeof obj === "object";
        }

        function isHash(obj) {
            var ret = isObject(obj);
            return ret && obj.constructor === Object;
        }

        function isEmpty(object) {
            if (isObject(object)) {
                for (var i in object) {
                    if (object.hasOwnProperty(i)) {
                        return false;
                    }
                }
            } else if (isString(object) && object === "") {
                return true;
            }
            return true;
        }

        function isBoolean(obj) {
            return Object.prototype.toString.call(obj) === "[object Boolean]";
        }

        function isUndefined(obj) {
            return obj !== null && obj === undef;
        }

        function isDefined(obj) {
            return !isUndefined(obj);
        }

        function isUndefinedOrNull(obj) {
            return isUndefined(obj) || isNull(obj);
        }

        function isNull(obj) {
            return obj !== undef && obj === null;
        }


        var isArguments = function _isArguments(object) {
            return !isUndefinedOrNull(object) && Object.prototype.toString.call(object) === '[object Arguments]';
        };

        if (!isArguments(arguments)) {
            isArguments = function _isArguments(obj) {
                return !!(obj && obj.hasOwnProperty("callee"));
            };
        }


        function isInstanceOf(obj, clazz) {
            if (isFunction(clazz)) {
                return obj instanceof clazz;
            } else {
                return false;
            }
        }

        function isRegExp(obj) {
            return !isUndefinedOrNull(obj) && (obj instanceof RegExp);
        }

        function isArray(obj) {
            return Object.prototype.toString.call(obj) === "[object Array]";
        }

        function isDate(obj) {
            return (!isUndefinedOrNull(obj) && typeof obj === "object" && obj instanceof Date);
        }

        function isString(obj) {
            return !isUndefinedOrNull(obj) && (typeof obj === "string" || obj instanceof String);
        }

        function isNumber(obj) {
            return !isUndefinedOrNull(obj) && (typeof obj === "number" || obj instanceof Number);
        }

        function isTrue(obj) {
            return obj === true;
        }

        function isFalse(obj) {
            return obj === false;
        }

        function isNotNull(obj) {
            return !isNull(obj);
        }

        function isEq(obj, obj2) {
            return obj == obj2;
        }

        function isNeq(obj, obj2) {
            /*jshint eqeqeq:false*/
            return obj != obj2;
        }

        function isSeq(obj, obj2) {
            return obj === obj2;
        }

        function isSneq(obj, obj2) {
            return obj !== obj2;
        }

        function isIn(obj, arr) {
            if (isArray(arr)) {
                for (var i = 0, l = arr.length; i < l; i++) {
                    if (isEq(obj, arr[i])) {
                        return true;
                    }
                }
            }
            return false;
        }

        function isNotIn(obj, arr) {
            return !isIn(obj, arr);
        }

        function isLt(obj, obj2) {
            return obj < obj2;
        }

        function isLte(obj, obj2) {
            return obj <= obj2;
        }

        function isGt(obj, obj2) {
            return obj > obj2;
        }

        function isGte(obj, obj2) {
            return obj >= obj2;
        }

        function isLike(obj, reg) {
            if (isString(reg)) {
                reg = new RegExp(reg);
            }
            if (isRegExp(reg)) {
                return reg.test("" + obj);
            }
            return false;
        }

        function isNotLike(obj, reg) {
            return !isLike(obj, reg);
        }

        function contains(arr, obj) {
            return isIn(obj, arr);
        }

        function notContains(arr, obj) {
            return !isIn(obj, arr);
        }

        var isa = {
            isFunction: isFunction,
            isObject: isObject,
            isEmpty: isEmpty,
            isHash: isHash,
            isNumber: isNumber,
            isString: isString,
            isDate: isDate,
            isArray: isArray,
            isBoolean: isBoolean,
            isUndefined: isUndefined,
            isDefined: isDefined,
            isUndefinedOrNull: isUndefinedOrNull,
            isNull: isNull,
            isArguments: isArguments,
            instanceOf: isInstanceOf,
            isRegExp: isRegExp,
            deepEqual: deepEqual,
            isTrue: isTrue,
            isFalse: isFalse,
            isNotNull: isNotNull,
            isEq: isEq,
            isNeq: isNeq,
            isSeq: isSeq,
            isSneq: isSneq,
            isIn: isIn,
            isNotIn: isNotIn,
            isLt: isLt,
            isLte: isLte,
            isGt: isGt,
            isGte: isGte,
            isLike: isLike,
            isNotLike: isNotLike,
            contains: contains,
            notContains: notContains
        };

        var tester = {
            constructor: function () {
                this._testers = [];
            },

            noWrap: {
                tester: function () {
                    var testers = this._testers;
                    return function tester(value) {
                        var isa = false;
                        for (var i = 0, l = testers.length; i < l && !isa; i++) {
                            isa = testers[i](value);
                        }
                        return isa;
                    };
                }
            }
        };

        var switcher = {
            constructor: function () {
                this._cases = [];
                this.__default = null;
            },

            def: function (val, fn) {
                this.__default = fn;
            },

            noWrap: {
                switcher: function () {
                    var testers = this._cases, __default = this.__default;
                    return function tester() {
                        var handled = false, args = argsToArray(arguments), caseRet;
                        for (var i = 0, l = testers.length; i < l && !handled; i++) {
                            caseRet = testers[i](args);
                            if (caseRet.length > 1) {
                                if (caseRet[1] || caseRet[0]) {
                                    return caseRet[1];
                                }
                            }
                        }
                        if (!handled && __default) {
                            return  __default.apply(this, args);
                        }
                    };
                }
            }
        };

        function addToTester(func) {
            tester[func] = function isaTester() {
                this._testers.push(isa[func]);
            };
        }

        function addToSwitcher(func) {
            switcher[func] = function isaTester() {
                var args = argsToArray(arguments, 1), isFunc = isa[func], handler, doBreak = true;
                if (args.length <= isFunc.length - 1) {
                    throw new TypeError("A handler must be defined when calling using switch");
                } else {
                    handler = args.pop();
                    if (isBoolean(handler)) {
                        doBreak = handler;
                        handler = args.pop();
                    }
                }
                if (!isFunction(handler)) {
                    throw new TypeError("handler must be defined");
                }
                this._cases.push(function (testArgs) {
                    if (isFunc.apply(isa, testArgs.concat(args))) {
                        return [doBreak, handler.apply(this, testArgs)];
                    }
                    return [false];
                });
            };
        }

        for (var i in isa) {
            if (isa.hasOwnProperty(i)) {
                addToSwitcher(i);
                addToTester(i);
            }
        }

        var is = extended.define(isa).expose(isa);
        is.tester = extended.define(tester);
        is.switcher = extended.define(switcher);
        return is;

    }

    if ("undefined" !== typeof exports) {
        if ("undefined" !== typeof module && module.exports) {
            module.exports = defineIsa(require("extended"));

        }
    } else if ("function" === typeof define) {
        define(["require"], function (require) {
            return defineIsa((require("extended")));
        });
    } else {
        this.is = defineIsa(this.extended);
    }

}).call(this);
});

require.define("/node_modules/leafy/node_modules/array-extended/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {"main":"index.js"}
});

require.define("/node_modules/leafy/node_modules/array-extended/index.js",function(require,module,exports,__dirname,__filename,process,global){(function () {
    "use strict";

    var arraySlice = Array.prototype.slice;

    function argsToArray(args, slice) {
        slice = slice || 0;
        return arraySlice.call(args, slice);
    }

    function defineArray(extended, is) {

        var isString = is.isString,
            isArray = is.isArray,
            isDate = is.isDate,
            floor = Math.floor,
            abs = Math.abs,
            mathMax = Math.max,
            mathMin = Math.min;


        function cross(num, cros) {
            return reduceRight(cros, function (a, b) {
                if (!isArray(b)) {
                    b = [b];
                }
                b.unshift(num);
                a.unshift(b);
                return a;
            }, []);
        }

        function permute(num, cross, length) {
            var ret = [];
            for (var i = 0; i < cross.length; i++) {
                ret.push([num].concat(rotate(cross, i)).slice(0, length));
            }
            return ret;
        }


        function intersection(a, b) {
            var ret = [], aOne;
            if (isArray(a) && isArray(b) && a.length && b.length) {
                for (var i = 0, l = a.length; i < l; i++) {
                    aOne = a[i];
                    if (indexOf(b, aOne) !== -1) {
                        ret.push(aOne);
                    }
                }
            }
            return ret;
        }


        var _sort = (function () {

            var isAll = function (arr, test) {
                return every(arr, test);
            };

            var defaultCmp = function (a, b) {
                return a - b;
            };

            var dateSort = function (a, b) {
                return a.getTime() - b.getTime();
            };

            return function _sort(arr, property) {
                var ret = [];
                if (isArray(arr)) {
                    ret = arr.slice();
                    if (property) {
                        if (typeof property === "function") {
                            ret.sort(property);
                        } else {
                            ret.sort(function (a, b) {
                                var aProp = a[property], bProp = b[property];
                                if (isString(aProp) && isString(bProp)) {
                                    return aProp > bProp ? 1 : aProp < bProp ? -1 : 0;
                                } else if (isDate(aProp) && isDate(bProp)) {
                                    return aProp.getTime() - bProp.getTime();
                                } else {
                                    return aProp - bProp;
                                }
                            });
                        }
                    } else {
                        if (isAll(ret, isString)) {
                            ret.sort();
                        } else if (isAll(ret, isDate)) {
                            ret.sort(dateSort);
                        } else {
                            ret.sort(defaultCmp);
                        }
                    }
                }
                return ret;
            };

        })();

        function indexOf(arr, searchElement) {
            if (!isArray(arr)) {
                throw new TypeError();
            }
            var t = Object(arr);
            var len = t.length >>> 0;
            if (len === 0) {
                return -1;
            }
            var n = 0;
            if (arguments.length > 2) {
                n = Number(arguments[2]);
                if (n !== n) { // shortcut for verifying if it's NaN
                    n = 0;
                } else if (n !== 0 && n !== Infinity && n !== -Infinity) {
                    n = (n > 0 || -1) * floor(abs(n));
                }
            }
            if (n >= len) {
                return -1;
            }
            var k = n >= 0 ? n : mathMax(len - abs(n), 0);
            for (; k < len; k++) {
                if (k in t && t[k] === searchElement) {
                    return k;
                }
            }
            return -1;
        }

        function lastIndexOf(arr, searchElement) {
            if (!isArray(arr)) {
                throw new TypeError();
            }

            var t = Object(arr);
            var len = t.length >>> 0;
            if (len === 0) {
                return -1;
            }

            var n = len;
            if (arguments.length > 2) {
                n = Number(arguments[2]);
                if (n !== n) {
                    n = 0;
                } else if (n !== 0 && n !== (1 / 0) && n !== -(1 / 0)) {
                    n = (n > 0 || -1) * floor(abs(n));
                }
            }

            var k = n >= 0 ? mathMin(n, len - 1) : len - abs(n);

            for (; k >= 0; k--) {
                if (k in t && t[k] === searchElement) {
                    return k;
                }
            }
            return -1;
        }

        function filter(arr, iterator, scope) {
            if (!isArray(arr) || typeof iterator !== "function") {
                throw new TypeError();
            }

            var t = Object(arr);
            var len = t.length >>> 0;
            var res = [];
            for (var i = 0; i < len; i++) {
                if (i in t) {
                    var val = t[i]; // in case fun mutates this
                    if (iterator.call(scope, val, i, t)) {
                        res.push(val);
                    }
                }
            }
            return res;
        }

        function forEach(arr, iterator, scope) {
            if (!isArray(arr) || typeof iterator !== "function") {
                throw new TypeError();
            }
            for (var i = 0, len = arr.length; i < len; ++i) {
                iterator.call(scope || arr, arr[i], i, arr);
            }
            return arr;
        }

        function every(arr, iterator, scope) {
            if (!isArray(arr) || typeof iterator !== "function") {
                throw new TypeError();
            }
            var t = Object(arr);
            var len = t.length >>> 0;
            for (var i = 0; i < len; i++) {
                if (i in t && !iterator.call(scope, t[i], i, t)) {
                    return false;
                }
            }
            return true;
        }

        function some(arr, iterator, scope) {
            if (!isArray(arr) || typeof iterator !== "function") {
                throw new TypeError();
            }
            var t = Object(arr);
            var len = t.length >>> 0;
            for (var i = 0; i < len; i++) {
                if (i in t && iterator.call(scope, t[i], i, t)) {
                    return true;
                }
            }
            return false;
        }

        function map(arr, iterator, scope) {
            if (!isArray(arr) || typeof iterator !== "function") {
                throw new TypeError();
            }

            var t = Object(arr);
            var len = t.length >>> 0;
            var res = [];
            for (var i = 0; i < len; i++) {
                if (i in t) {
                    res.push(iterator.call(scope, t[i], i, t));
                }
            }
            return res;
        }

        function reduce(arr, accumulator, curr) {
            if (!isArray(arr) || typeof accumulator !== "function") {
                throw new TypeError();
            }
            var i = 0, l = arr.length >> 0;
            if (arguments.length < 3) {
                if (l === 0) {
                    throw new TypeError("Array length is 0 and no second argument");
                }
                curr = arr[0];
                i = 1; // start accumulating at the second element
            } else {
                curr = arguments[2];
            }
            while (i < l) {
                if (i in arr) {
                    curr = accumulator.call(undefined, curr, arr[i], i, arr);
                }
                ++i;
            }
            return curr;
        }

        function reduceRight(arr, accumulator, curr) {
            if (!isArray(arr) || typeof accumulator !== "function") {
                throw new TypeError();
            }

            var t = Object(arr);
            var len = t.length >>> 0;

            // no value to return if no initial value, empty array
            if (len === 0 && arguments.length === 2) {
                throw new TypeError();
            }

            var k = len - 1;
            if (arguments.length >= 3) {
                curr = arguments[2];
            } else {
                do {
                    if (k in arr) {
                        curr = arr[k--];
                        break;
                    }
                }
                while (true);
            }
            while (k >= 0) {
                if (k in t) {
                    curr = accumulator.call(undefined, curr, t[k], k, t);
                }
                k--;
            }
            return curr;
        }


        function toArray(o) {
            var ret = [];
            if (o !== null) {
                var args = argsToArray(arguments);
                if (args.length === 1) {
                    if (isArray(o)) {
                        ret = o;
                    } else if (is.isHash(o)) {
                        for (var i in o) {
                            if (o.hasOwnProperty(i)) {
                                ret.push([i, o[i]]);
                            }
                        }
                    } else {
                        ret.push(o);
                    }
                } else {
                    forEach(args, function (a) {
                        ret = ret.concat(toArray(a));
                    });
                }
            }
            return ret;
        }

        function sum(array) {
            array = array || [];
            if (array.length) {
                return reduce(array, function (a, b) {
                    return a + b;
                });
            } else {
                return 0;
            }
        }

        function avg(arr) {
            arr = arr || [];
            if (arr.length) {
                var total = sum(arr);
                if (is.isNumber(total)) {
                    return  total / arr.length;
                } else {
                    throw new Error("Cannot average an array of non numbers.");
                }
            } else {
                return 0;
            }
        }

        function sort(arr, cmp) {
            return _sort(arr, cmp);
        }

        function min(arr, cmp) {
            return _sort(arr, cmp)[0];
        }

        function max(arr, cmp) {
            return _sort(arr, cmp)[arr.length - 1];
        }

        function difference(arr1) {
            var ret = arr1, args = flatten(argsToArray(arguments, 1));
            if (isArray(arr1)) {
                ret = filter(arr1, function (a) {
                    return indexOf(args, a) === -1;
                });
            }
            return ret;
        }

        function removeDuplicates(arr) {
            var ret = arr;
            if (isArray(arr)) {
                ret = reduce(arr, function (a, b) {
                    if (indexOf(a, b) === -1) {
                        return a.concat(b);
                    } else {
                        return a;
                    }
                }, []);
            }
            return ret;
        }


        function unique(arr) {
            return removeDuplicates(arr);
        }


        function rotate(arr, numberOfTimes) {
            var ret = arr.slice();
            if (typeof numberOfTimes !== "number") {
                numberOfTimes = 1;
            }
            if (numberOfTimes && isArray(arr)) {
                if (numberOfTimes > 0) {
                    ret.push(ret.shift());
                    numberOfTimes--;
                } else {
                    ret.unshift(ret.pop());
                    numberOfTimes++;
                }
                return rotate(ret, numberOfTimes);
            } else {
                return ret;
            }
        }

        function permutations(arr, length) {
            var ret = [];
            if (isArray(arr)) {
                var copy = arr.slice(0);
                if (typeof length !== "number") {
                    length = arr.length;
                }
                if (!length) {
                    ret = [
                        []
                    ];
                } else if (length <= arr.length) {
                    ret = reduce(arr, function (a, b, i) {
                        var ret;
                        if (length > 1) {
                            ret = permute(b, rotate(copy, i).slice(1), length);
                        } else {
                            ret = [
                                [b]
                            ];
                        }
                        return a.concat(ret);
                    }, []);
                }
            }
            return ret;
        }

        function zip() {
            var ret = [];
            var arrs = argsToArray(arguments);
            if (arrs.length > 1) {
                var arr1 = arrs.shift();
                if (isArray(arr1)) {
                    ret = reduce(arr1, function (a, b, i) {
                        var curr = [b];
                        for (var j = 0; j < arrs.length; j++) {
                            var currArr = arrs[j];
                            if (isArray(currArr) && !is.isUndefined(currArr[i])) {
                                curr.push(currArr[i]);
                            } else {
                                curr.push(null);
                            }
                        }
                        a.push(curr);
                        return a;
                    }, []);
                }
            }
            return ret;
        }

        function transpose(arr) {
            var ret = [];
            if (isArray(arr) && arr.length) {
                var last;
                forEach(arr, function (a) {
                    if (isArray(a) && (!last || a.length === last.length)) {
                        forEach(a, function (b, i) {
                            if (!ret[i]) {
                                ret[i] = [];
                            }
                            ret[i].push(b);
                        });
                        last = a;
                    }
                });
            }
            return ret;
        }

        function valuesAt(arr, indexes) {
            var ret = [];
            indexes = argsToArray(arguments);
            arr = indexes.shift();
            if (isArray(arr) && indexes.length) {
                for (var i = 0, l = indexes.length; i < l; i++) {
                    ret.push(arr[indexes[i]] || null);
                }
            }
            return ret;
        }

        function union() {
            var ret = [];
            var arrs = argsToArray(arguments);
            if (arrs.length > 1) {
                ret = removeDuplicates(reduce(arrs, function (a, b) {
                    return a.concat(b);
                }, []));
            }
            return ret;
        }

        function intersect() {
            var collect = [], set;
            var args = argsToArray(arguments);
            if (args.length > 1) {
                //assume we are intersections all the lists in the array
                set = args;
            } else {
                set = args[0];
            }
            if (isArray(set)) {
                var x = set.shift();
                collect = reduce(set, function (a, b) {
                    return intersection(a, b);
                }, x);
            }
            return removeDuplicates(collect);
        }

        function powerSet(arr) {
            var ret = [];
            if (isArray(arr) && arr.length) {
                ret = reduce(arr, function (a, b) {
                    var ret = map(a, function (c) {
                        return c.concat(b);
                    });
                    return a.concat(ret);
                }, [
                    []
                ]);
            }
            return ret;
        }

        function cartesian(a, b) {
            var ret = [];
            if (isArray(a) && isArray(b) && a.length && b.length) {
                ret = cross(a[0], b).concat(cartesian(a.slice(1), b));
            }
            return ret;
        }

        function compact(arr) {
            var ret = [];
            if (isArray(arr) && arr.length) {
                ret = filter(arr, function (item) {
                    return !is.isUndefinedOrNull(item);
                });
            }
            return ret;
        }

        function multiply(arr, times) {
            times = is.isNumber(times) ? times : 1;
            if (!times) {
                //make sure times is greater than zero if it is zero then dont multiply it
                times = 1;
            }
            arr = toArray(arr || []);
            var ret = [], i = 0;
            while (++i <= times) {
                ret = ret.concat(arr);
            }
            return ret;
        }

        function flatten(arr) {
            var set;
            var args = argsToArray(arguments);
            if (args.length > 1) {
                //assume we are intersections all the lists in the array
                set = args;
            } else {
                set = toArray(arr);
            }
            return reduce(set, function (a, b) {
                return a.concat(b);
            }, []);
        }

        function pluck(arr, prop) {
            prop = prop.split(".");
            var result = arr.slice(0);
            forEach(prop, function (prop) {
                var exec = prop.match(/(\w+)\(\)$/);
                result = map(result, function (item) {
                    return exec ? item[exec[1]]() : item[prop];
                });
            });
            return result;
        }

        function invoke(arr, func, args) {
            args = argsToArray(arguments, 2);
            return map(arr, function (item) {
                var exec = isString(func) ? item[func] : func;
                return exec.apply(item, args);
            });
        }


        var array = {
            toArray: toArray,
            sum: sum,
            avg: avg,
            sort: sort,
            min: min,
            max: max,
            difference: difference,
            removeDuplicates: removeDuplicates,
            unique: unique,
            rotate: rotate,
            permutations: permutations,
            zip: zip,
            transpose: transpose,
            valuesAt: valuesAt,
            union: union,
            intersect: intersect,
            powerSet: powerSet,
            cartesian: cartesian,
            compact: compact,
            multiply: multiply,
            flatten: flatten,
            pluck: pluck,
            invoke: invoke,
            forEach: forEach,
            map: map,
            filter: filter,
            reduce: reduce,
            reduceRight: reduceRight,
            some: some,
            every: every,
            indexOf: indexOf,
            lastIndexOf: lastIndexOf
        };

        return extended.define(isArray, array).expose(array);
    }

    if ("undefined" !== typeof exports) {
        if ("undefined" !== typeof module && module.exports) {
            module.exports = defineArray(require("extended"), require("is-extended"));
        }
    } else if ("function" === typeof define) {
        define(["require"], function (require) {
            return defineArray(require("extended"), require("is-extended"));
        });
    } else {
        this.arrayExtended = defineArray(this.extended, this.isExtended);
    }

}).call(this);







});

require.define("/node_modules/leafy/node_modules/string-extended/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {"main":"index.js"}
});

require.define("/node_modules/leafy/node_modules/string-extended/index.js",function(require,module,exports,__dirname,__filename,process,global){(function () {
    "use strict";

    function defineString(extended, is, date) {

        var stringify;
        if (typeof JSON === "undefined") {
            /*
             json2.js
             2012-10-08

             Public Domain.

             NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
             */

            (function () {
                function f(n) {
                    // Format integers to have at least two digits.
                    return n < 10 ? '0' + n : n;
                }

                var isPrimitive = is.tester().isString().isNumber().isBoolean().tester();

                function toJSON(obj) {
                    if (is.isDate(obj)) {
                        return isFinite(obj.valueOf())
                            ? obj.getUTCFullYear() + '-' +
                            f(obj.getUTCMonth() + 1) + '-' +
                            f(obj.getUTCDate()) + 'T' +
                            f(obj.getUTCHours()) + ':' +
                            f(obj.getUTCMinutes()) + ':' +
                            f(obj.getUTCSeconds()) + 'Z'
                            : null;
                    } else if (isPrimitive(obj)) {
                        return obj.valueOf();
                    }
                    return obj;
                }

                var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
                    escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
                    gap,
                    indent,
                    meta = {    // table of character substitutions
                        '\b': '\\b',
                        '\t': '\\t',
                        '\n': '\\n',
                        '\f': '\\f',
                        '\r': '\\r',
                        '"': '\\"',
                        '\\': '\\\\'
                    },
                    rep;


                function quote(string) {
                    escapable.lastIndex = 0;
                    return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
                        var c = meta[a];
                        return typeof c === 'string' ? c : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                    }) + '"' : '"' + string + '"';
                }


                function str(key, holder) {

                    var i, k, v, length, mind = gap, partial, value = holder[key];
                    if (value) {
                        value = toJSON(value);
                    }
                    if (typeof rep === 'function') {
                        value = rep.call(holder, key, value);
                    }
                    switch (typeof value) {
                        case 'string':
                            return quote(value);
                        case 'number':
                            return isFinite(value) ? String(value) : 'null';
                        case 'boolean':
                        case 'null':
                            return String(value);
                        case 'object':
                            if (!value) {
                                return 'null';
                            }
                            gap += indent;
                            partial = [];
                            if (Object.prototype.toString.apply(value) === '[object Array]') {
                                length = value.length;
                                for (i = 0; i < length; i += 1) {
                                    partial[i] = str(i, value) || 'null';
                                }
                                v = partial.length === 0 ? '[]' : gap ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']' : '[' + partial.join(',') + ']';
                                gap = mind;
                                return v;
                            }
                            if (rep && typeof rep === 'object') {
                                length = rep.length;
                                for (i = 0; i < length; i += 1) {
                                    if (typeof rep[i] === 'string') {
                                        k = rep[i];
                                        v = str(k, value);
                                        if (v) {
                                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                                        }
                                    }
                                }
                            } else {
                                for (k in value) {
                                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                                        v = str(k, value);
                                        if (v) {
                                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                                        }
                                    }
                                }
                            }
                            v = partial.length === 0 ? '{}' : gap ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}' : '{' + partial.join(',') + '}';
                            gap = mind;
                            return v;
                    }
                }

                stringify = function (value, replacer, space) {
                    var i;
                    gap = '';
                    indent = '';
                    if (typeof space === 'number') {
                        for (i = 0; i < space; i += 1) {
                            indent += ' ';
                        }
                    } else if (typeof space === 'string') {
                        indent = space;
                    }
                    rep = replacer;
                    if (replacer && typeof replacer !== 'function' &&
                        (typeof replacer !== 'object' ||
                            typeof replacer.length !== 'number')) {
                        throw new Error('JSON.stringify');
                    }
                    return str('', {'': value});
                };
            }());
        }else{
            stringify = JSON.stringify;
        }


        var isHash = is.isHash, aSlice = Array.prototype.slice;

        var FORMAT_REGEX = /%((?:-?\+?.?\d*)?|(?:\[[^\[|\]]*\]))?([sjdDZ])/g;
        var INTERP_REGEX = /\{(?:\[([^\[|\]]*)\])?(\w+)\}/g;
        var STR_FORMAT = /(-?)(\+?)([A-Z|a-z|\W]?)([1-9][0-9]*)?$/;
        var OBJECT_FORMAT = /([1-9][0-9]*)$/g;

        function formatString(string, format) {
            var ret = string;
            if (STR_FORMAT.test(format)) {
                var match = format.match(STR_FORMAT);
                var isLeftJustified = match[1], padChar = match[3], width = match[4];
                if (width) {
                    width = parseInt(width, 10);
                    if (ret.length < width) {
                        ret = pad(ret, width, padChar, isLeftJustified);
                    } else {
                        ret = truncate(ret, width);
                    }
                }
            }
            return ret;
        }

        function formatNumber(number, format) {
            var ret;
            if (is.isNumber(number)) {
                ret = "" + number;
                if (STR_FORMAT.test(format)) {
                    var match = format.match(STR_FORMAT);
                    var isLeftJustified = match[1], signed = match[2], padChar = match[3], width = match[4];
                    if (signed) {
                        ret = (number > 0 ? "+" : "") + ret;
                    }
                    if (width) {
                        width = parseInt(width, 10);
                        if (ret.length < width) {
                            ret = pad(ret, width, padChar || "0", isLeftJustified);
                        } else {
                            ret = truncate(ret, width);
                        }
                    }

                }
            } else {
                throw new Error("stringExtended.format : when using %d the parameter must be a number!");
            }
            return ret;
        }

        function formatObject(object, format) {
            var ret, match = format.match(OBJECT_FORMAT), spacing = 0;
            if (match) {
                spacing = parseInt(match[0], 10);
                if (isNaN(spacing)) {
                    spacing = 0;
                }
            }
            try {
                ret = stringify(object, null, spacing);
            } catch (e) {
                throw new Error("stringExtended.format : Unable to parse json from ", object);
            }
            return ret;
        }


        var styles = {
            //styles
            bold: 1,
            bright: 1,
            italic: 3,
            underline: 4,
            blink: 5,
            inverse: 7,
            crossedOut: 9,

            red: 31,
            green: 32,
            yellow: 33,
            blue: 34,
            magenta: 35,
            cyan: 36,
            white: 37,

            redBackground: 41,
            greenBackground: 42,
            yellowBackground: 43,
            blueBackground: 44,
            magentaBackground: 45,
            cyanBackground: 46,
            whiteBackground: 47,

            encircled: 52,
            overlined: 53,
            grey: 90,
            black: 90
        };

        var characters = {
            SMILEY: "☺",
            SOLID_SMILEY: "☻",
            HEART: "♥",
            DIAMOND: "♦",
            CLOVE: "♣",
            SPADE: "♠",
            DOT: "•",
            SQUARE_CIRCLE: "◘",
            CIRCLE: "○",
            FILLED_SQUARE_CIRCLE: "◙",
            MALE: "♂",
            FEMALE: "♀",
            EIGHT_NOTE: "♪",
            DOUBLE_EIGHTH_NOTE: "♫",
            SUN: "☼",
            PLAY: "►",
            REWIND: "◄",
            UP_DOWN: "↕",
            PILCROW: "¶",
            SECTION: "§",
            THICK_MINUS: "▬",
            SMALL_UP_DOWN: "↨",
            UP_ARROW: "↑",
            DOWN_ARROW: "↓",
            RIGHT_ARROW: "→",
            LEFT_ARROW: "←",
            RIGHT_ANGLE: "∟",
            LEFT_RIGHT_ARROW: "↔",
            TRIANGLE: "▲",
            DOWN_TRIANGLE: "▼",
            HOUSE: "⌂",
            C_CEDILLA: "Ç",
            U_UMLAUT: "ü",
            E_ACCENT: "é",
            A_LOWER_CIRCUMFLEX: "â",
            A_LOWER_UMLAUT: "ä",
            A_LOWER_GRAVE_ACCENT: "à",
            A_LOWER_CIRCLE_OVER: "å",
            C_LOWER_CIRCUMFLEX: "ç",
            E_LOWER_CIRCUMFLEX: "ê",
            E_LOWER_UMLAUT: "ë",
            E_LOWER_GRAVE_ACCENT: "è",
            I_LOWER_UMLAUT: "ï",
            I_LOWER_CIRCUMFLEX: "î",
            I_LOWER_GRAVE_ACCENT: "ì",
            A_UPPER_UMLAUT: "Ä",
            A_UPPER_CIRCLE: "Å",
            E_UPPER_ACCENT: "É",
            A_E_LOWER: "æ",
            A_E_UPPER: "Æ",
            O_LOWER_CIRCUMFLEX: "ô",
            O_LOWER_UMLAUT: "ö",
            O_LOWER_GRAVE_ACCENT: "ò",
            U_LOWER_CIRCUMFLEX: "û",
            U_LOWER_GRAVE_ACCENT: "ù",
            Y_LOWER_UMLAUT: "ÿ",
            O_UPPER_UMLAUT: "Ö",
            U_UPPER_UMLAUT: "Ü",
            CENTS: "¢",
            POUND: "£",
            YEN: "¥",
            CURRENCY: "¤",
            PTS: "₧",
            FUNCTION: "ƒ",
            A_LOWER_ACCENT: "á",
            I_LOWER_ACCENT: "í",
            O_LOWER_ACCENT: "ó",
            U_LOWER_ACCENT: "ú",
            N_LOWER_TILDE: "ñ",
            N_UPPER_TILDE: "Ñ",
            A_SUPER: "ª",
            O_SUPER: "º",
            UPSIDEDOWN_QUESTION: "¿",
            SIDEWAYS_L: "⌐",
            NEGATION: "¬",
            ONE_HALF: "½",
            ONE_FOURTH: "¼",
            UPSIDEDOWN_EXCLAMATION: "¡",
            DOUBLE_LEFT: "«",
            DOUBLE_RIGHT: "»",
            LIGHT_SHADED_BOX: "░",
            MEDIUM_SHADED_BOX: "▒",
            DARK_SHADED_BOX: "▓",
            VERTICAL_LINE: "│",
            MAZE__SINGLE_RIGHT_T: "┤",
            MAZE_SINGLE_RIGHT_TOP: "┐",
            MAZE_SINGLE_RIGHT_BOTTOM_SMALL: "┘",
            MAZE_SINGLE_LEFT_TOP_SMALL: "┌",
            MAZE_SINGLE_LEFT_BOTTOM_SMALL: "└",
            MAZE_SINGLE_LEFT_T: "├",
            MAZE_SINGLE_BOTTOM_T: "┴",
            MAZE_SINGLE_TOP_T: "┬",
            MAZE_SINGLE_CENTER: "┼",
            MAZE_SINGLE_HORIZONTAL_LINE: "─",
            MAZE_SINGLE_RIGHT_DOUBLECENTER_T: "╡",
            MAZE_SINGLE_RIGHT_DOUBLE_BL: "╛",
            MAZE_SINGLE_RIGHT_DOUBLE_T: "╢",
            MAZE_SINGLE_RIGHT_DOUBLEBOTTOM_TOP: "╖",
            MAZE_SINGLE_RIGHT_DOUBLELEFT_TOP: "╕",
            MAZE_SINGLE_LEFT_DOUBLE_T: "╞",
            MAZE_SINGLE_BOTTOM_DOUBLE_T: "╧",
            MAZE_SINGLE_TOP_DOUBLE_T: "╤",
            MAZE_SINGLE_TOP_DOUBLECENTER_T: "╥",
            MAZE_SINGLE_BOTTOM_DOUBLECENTER_T: "╨",
            MAZE_SINGLE_LEFT_DOUBLERIGHT_BOTTOM: "╘",
            MAZE_SINGLE_LEFT_DOUBLERIGHT_TOP: "╒",
            MAZE_SINGLE_LEFT_DOUBLEBOTTOM_TOP: "╓",
            MAZE_SINGLE_LEFT_DOUBLETOP_BOTTOM: "╙",
            MAZE_SINGLE_LEFT_TOP: "Γ",
            MAZE_SINGLE_RIGHT_BOTTOM: "╜",
            MAZE_SINGLE_LEFT_CENTER: "╟",
            MAZE_SINGLE_DOUBLECENTER_CENTER: "╫",
            MAZE_SINGLE_DOUBLECROSS_CENTER: "╪",
            MAZE_DOUBLE_LEFT_CENTER: "╣",
            MAZE_DOUBLE_VERTICAL: "║",
            MAZE_DOUBLE_RIGHT_TOP: "╗",
            MAZE_DOUBLE_RIGHT_BOTTOM: "╝",
            MAZE_DOUBLE_LEFT_BOTTOM: "╚",
            MAZE_DOUBLE_LEFT_TOP: "╔",
            MAZE_DOUBLE_BOTTOM_T: "╩",
            MAZE_DOUBLE_TOP_T: "╦",
            MAZE_DOUBLE_LEFT_T: "╠",
            MAZE_DOUBLE_HORIZONTAL: "═",
            MAZE_DOUBLE_CROSS: "╬",
            SOLID_RECTANGLE: "█",
            THICK_LEFT_VERTICAL: "▌",
            THICK_RIGHT_VERTICAL: "▐",
            SOLID_SMALL_RECTANGLE_BOTTOM: "▄",
            SOLID_SMALL_RECTANGLE_TOP: "▀",
            PHI_UPPER: "Φ",
            INFINITY: "∞",
            INTERSECTION: "∩",
            DEFINITION: "≡",
            PLUS_MINUS: "±",
            GT_EQ: "≥",
            LT_EQ: "≤",
            THEREFORE: "⌠",
            SINCE: "∵",
            DOESNOT_EXIST: "∄",
            EXISTS: "∃",
            FOR_ALL: "∀",
            EXCLUSIVE_OR: "⊕",
            BECAUSE: "⌡",
            DIVIDE: "÷",
            APPROX: "≈",
            DEGREE: "°",
            BOLD_DOT: "∙",
            DOT_SMALL: "·",
            CHECK: "√",
            ITALIC_X: "✗",
            SUPER_N: "ⁿ",
            SQUARED: "²",
            CUBED: "³",
            SOLID_BOX: "■",
            PERMILE: "‰",
            REGISTERED_TM: "®",
            COPYRIGHT: "©",
            TRADEMARK: "™",
            BETA: "β",
            GAMMA: "γ",
            ZETA: "ζ",
            ETA: "η",
            IOTA: "ι",
            KAPPA: "κ",
            LAMBDA: "λ",
            NU: "ν",
            XI: "ξ",
            OMICRON: "ο",
            RHO: "ρ",
            UPSILON: "υ",
            CHI_LOWER: "φ",
            CHI_UPPER: "χ",
            PSI: "ψ",
            ALPHA: "α",
            ESZETT: "ß",
            PI: "π",
            SIGMA_UPPER: "Σ",
            SIGMA_LOWER: "σ",
            MU: "µ",
            TAU: "τ",
            THETA: "Θ",
            OMEGA: "Ω",
            DELTA: "δ",
            PHI_LOWER: "φ",
            EPSILON: "ε"
        };

        function pad(string, length, ch, end) {
            string = "" + string; //check for numbers
            ch = ch || " ";
            var strLen = string.length;
            while (strLen < length) {
                if (end) {
                    string += ch;
                } else {
                    string = ch + string;
                }
                strLen++;
            }
            return string;
        }

        function truncate(string, length, end) {
            var ret = string;
            if (is.isString(ret)) {
                if (string.length > length) {
                    if (end) {
                        var l = string.length;
                        ret = string.substring(l - length, l);
                    } else {
                        ret = string.substring(0, length);
                    }
                }
            } else {
                ret = truncate("" + ret, length);
            }
            return ret;
        }

        function format(str, obj) {
            if (obj instanceof Array) {
                var i = 0, len = obj.length;
                //find the matches
                return str.replace(FORMAT_REGEX, function (m, format, type) {
                    var replacer, ret;
                    if (i < len) {
                        replacer = obj[i++];
                    } else {
                        //we are out of things to replace with so
                        //just return the match?
                        return m;
                    }
                    if (m === "%s" || m === "%d" || m === "%D") {
                        //fast path!
                        ret = replacer + "";
                    } else if (m === "%Z") {
                        ret = replacer.toUTCString();
                    } else if (m === "%j") {
                        try {
                            ret = stringify(replacer);
                        } catch (e) {
                            throw new Error("stringExtended.format : Unable to parse json from ", replacer);
                        }
                    } else {
                        format = format.replace(/^\[|\]$/g, "");
                        switch (type) {
                            case "s":
                                ret = formatString(replacer, format);
                                break;
                            case "d":
                                ret = formatNumber(replacer, format);
                                break;
                            case "j":
                                ret = formatObject(replacer, format);
                                break;
                            case "D":
                                ret = date.format(replacer, format);
                                break;
                            case "Z":
                                ret = date.format(replacer, format, true);
                                break;
                        }
                    }
                    return ret;
                });
            } else if (isHash(obj)) {
                return str.replace(INTERP_REGEX, function (m, format, value) {
                    value = obj[value];
                    if (!is.isUndefined(value)) {
                        if (format) {
                            if (is.isString(value)) {
                                return formatString(value, format);
                            } else if (is.isNumber(value)) {
                                return formatNumber(value, format);
                            } else if (is.isDate(value)) {
                                return date.format(value, format);
                            } else if (is.isObject(value)) {
                                return formatObject(value, format);
                            }
                        } else {
                            return "" + value;
                        }
                    }
                    return m;
                });
            } else {
                var args = aSlice.call(arguments).slice(1);
                return format(str, args);
            }
        }

        function toArray(testStr, delim) {
            var ret = [];
            if (testStr) {
                if (testStr.indexOf(delim) > 0) {
                    ret = testStr.replace(/\s+/g, "").split(delim);
                }
                else {
                    ret.push(testStr);
                }
            }
            return ret;
        }

        function multiply(str, times) {
            var ret = [];
            if (times) {
                for (var i = 0; i < times; i++) {
                    ret.push(str);
                }
            }
            return ret.join("");
        }


        function style(str, options) {
            var ret, i, l;
            if (options) {
                if (is.isArray(str)) {
                    ret = [];
                    for (i = 0, l = str.length; i < l; i++) {
                        ret.push(style(str[i], options));
                    }
                } else if (options instanceof Array) {
                    ret = str;
                    for (i = 0, l = options.length; i < l; i++) {
                        ret = style(ret, options[i]);
                    }
                } else if (options in styles) {
                    ret = '\x1B[' + styles[options] + 'm' + str + '\x1B[0m';
                }
            }
            return ret;
        }


        var string = {
            toArray: toArray,
            pad: pad,
            truncate: truncate,
            multiply: multiply,
            format: format,
            style: style
        };


        var i, ret = extended.define(is.isString, string).define(is.isArray, {style: style});
        for (i in string) {
            if (string.hasOwnProperty(i)) {
                ret[i] = string[i];
            }
        }
        ret.characters = characters;
        return ret;
    }

    if ("undefined" !== typeof exports) {
        if ("undefined" !== typeof module && module.exports) {
            module.exports = defineString(require("extended"), require("is-extended"), require("date-extended"));

        }
    } else if ("function" === typeof define) {
        define(["require"], function (require) {
            return defineString(require("extended"), require("is-extended"), require("date-extended"));
        });
    } else {
        this.stringExtended = defineString(this.extended, this.isExtended, this.dateExtended);
    }

}).call(this);







});

require.define("/node_modules/leafy/node_modules/string-extended/node_modules/date-extended/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {"main":"index.js"}
});

require.define("/node_modules/leafy/node_modules/string-extended/node_modules/date-extended/index.js",function(require,module,exports,__dirname,__filename,process,global){(function () {
    "use strict";

    function defineDate(extended, is, array) {

        function _pad(string, length, ch, end) {
            string = "" + string; //check for numbers
            ch = ch || " ";
            var strLen = string.length;
            while (strLen < length) {
                if (end) {
                    string += ch;
                } else {
                    string = ch + string;
                }
                strLen++;
            }
            return string;
        }

        function _truncate(string, length, end) {
            var ret = string;
            if (is.isString(ret)) {
                if (string.length > length) {
                    if (end) {
                        var l = string.length;
                        ret = string.substring(l - length, l);
                    } else {
                        ret = string.substring(0, length);
                    }
                }
            } else {
                ret = _truncate("" + ret, length);
            }
            return ret;
        }

        function every(arr, iterator, scope) {
            if (!is.isArray(arr) || typeof iterator !== "function") {
                throw new TypeError();
            }
            var t = Object(arr);
            var len = t.length >>> 0;
            for (var i = 0; i < len; i++) {
                if (i in t && !iterator.call(scope, t[i], i, t)) {
                    return false;
                }
            }
            return true;
        }


        var transforms = (function () {
                var floor = Math.floor, round = Math.round;

                var addMap = {
                    day: function addDay(date, amount) {
                        return [amount, "Date", false];
                    },
                    weekday: function addWeekday(date, amount) {
                        // Divide the increment time span into weekspans plus leftover days
                        // e.g., 8 days is one 5-day weekspan / and two leftover days
                        // Can't have zero leftover days, so numbers divisible by 5 get
                        // a days value of 5, and the remaining days make up the number of weeks
                        var days, weeks, mod = amount % 5, strt = date.getDay(), adj = 0;
                        if (!mod) {
                            days = (amount > 0) ? 5 : -5;
                            weeks = (amount > 0) ? ((amount - 5) / 5) : ((amount + 5) / 5);
                        } else {
                            days = mod;
                            weeks = parseInt(amount / 5, 10);
                        }
                        if (strt === 6 && amount > 0) {
                            adj = 1;
                        } else if (strt === 0 && amount < 0) {
                            // Orig date is Sun / negative increment
                            // Jump back over Sat
                            adj = -1;
                        }
                        // Get weekday val for the new date
                        var trgt = strt + days;
                        // New date is on Sat or Sun
                        if (trgt === 0 || trgt === 6) {
                            adj = (amount > 0) ? 2 : -2;
                        }
                        // Increment by number of weeks plus leftover days plus
                        // weekend adjustments
                        return [(7 * weeks) + days + adj, "Date", false];
                    },
                    year: function addYear(date, amount) {
                        return [amount, "FullYear", true];
                    },
                    week: function addWeek(date, amount) {
                        return [amount * 7, "Date", false];
                    },
                    quarter: function addYear(date, amount) {
                        return [amount * 3, "Month", true];
                    },
                    month: function addYear(date, amount) {
                        return [amount, "Month", true];
                    }
                };

                function addTransform(interval, date, amount) {
                    interval = interval.replace(/s$/, "");
                    if (addMap.hasOwnProperty(interval)) {
                        return addMap[interval](date, amount);
                    }
                    return [amount, "UTC" + interval.charAt(0).toUpperCase() + interval.substring(1) + "s", false];
                }


                var differenceMap = {
                    "quarter": function quarterDifference(date1, date2, utc) {
                        var yearDiff = date2.getFullYear() - date1.getFullYear();
                        var m1 = date1[utc ? "getUTCMonth" : "getMonth"]();
                        var m2 = date2[utc ? "getUTCMonth" : "getMonth"]();
                        // Figure out which quarter the months are in
                        var q1 = floor(m1 / 3) + 1;
                        var q2 = floor(m2 / 3) + 1;
                        // Add quarters for any year difference between the dates
                        q2 += (yearDiff * 4);
                        return q2 - q1;
                    },

                    "weekday": function weekdayDifference(date1, date2, utc) {
                        var days = differenceTransform("day", date1, date2, utc), weeks;
                        var mod = days % 7;
                        // Even number of weeks
                        if (mod === 0) {
                            days = differenceTransform("week", date1, date2, utc) * 5;
                        } else {
                            // Weeks plus spare change (< 7 days)
                            var adj = 0, aDay = date1[utc ? "getUTCDay" : "getDay"](), bDay = date2[utc ? "getUTCDay" : "getDay"]();
                            weeks = parseInt(days / 7, 10);
                            // Mark the date advanced by the number of
                            // round weeks (may be zero)
                            var dtMark = new Date(+date1);
                            dtMark.setDate(dtMark[utc ? "getUTCDate" : "getDate"]() + (weeks * 7));
                            var dayMark = dtMark[utc ? "getUTCDay" : "getDay"]();

                            // Spare change days -- 6 or less
                            if (days > 0) {
                                if (aDay === 6 || bDay === 6) {
                                    adj = -1;
                                } else if (aDay === 0) {
                                    adj = 0;
                                } else if (bDay === 0 || (dayMark + mod) > 5) {
                                    adj = -2;
                                }
                            } else if (days < 0) {
                                if (aDay === 6) {
                                    adj = 0;
                                } else if (aDay === 0 || bDay === 0) {
                                    adj = 1;
                                } else if (bDay === 6 || (dayMark + mod) < 0) {
                                    adj = 2;
                                }
                            }
                            days += adj;
                            days -= (weeks * 2);
                        }
                        return days;
                    },
                    year: function (date1, date2) {
                        return date2.getFullYear() - date1.getFullYear();
                    },
                    month: function (date1, date2, utc) {
                        var m1 = date1[utc ? "getUTCMonth" : "getMonth"]();
                        var m2 = date2[utc ? "getUTCMonth" : "getMonth"]();
                        return (m2 - m1) + ((date2.getFullYear() - date1.getFullYear()) * 12);
                    },
                    week: function (date1, date2, utc) {
                        return round(differenceTransform("day", date1, date2, utc) / 7);
                    },
                    day: function (date1, date2) {
                        return 1.1574074074074074e-8 * (date2.getTime() - date1.getTime());
                    },
                    hour: function (date1, date2) {
                        return 2.7777777777777776e-7 * (date2.getTime() - date1.getTime());
                    },
                    minute: function (date1, date2) {
                        return 0.000016666666666666667 * (date2.getTime() - date1.getTime());
                    },
                    second: function (date1, date2) {
                        return 0.001 * (date2.getTime() - date1.getTime());
                    },
                    millisecond: function (date1, date2) {
                        return date2.getTime() - date1.getTime();
                    }
                };


                function differenceTransform(interval, date1, date2, utc) {
                    interval = interval.replace(/s$/, "");
                    return round(differenceMap[interval](date1, date2, utc));
                }


                return {
                    addTransform: addTransform,
                    differenceTransform: differenceTransform
                };
            }()),
            addTransform = transforms.addTransform,
            differenceTransform = transforms.differenceTransform;


        /**
         * @ignore
         * Based on DOJO Date Implementation
         *
         * Dojo is available under *either* the terms of the modified BSD license *or* the
         * Academic Free License version 2.1. As a recipient of Dojo, you may choose which
         * license to receive this code under (except as noted in per-module LICENSE
         * files). Some modules may not be the copyright of the Dojo Foundation. These
         * modules contain explicit declarations of copyright in both the LICENSE files in
         * the directories in which they reside and in the code itself. No external
         * contributions are allowed under licenses which are fundamentally incompatible
         * with the AFL or BSD licenses that Dojo is distributed under.
         *
         */

        var floor = Math.floor, round = Math.round, min = Math.min, pow = Math.pow, ceil = Math.ceil, abs = Math.abs;
        var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        var monthAbbr = ["Jan.", "Feb.", "Mar.", "Apr.", "May.", "Jun.", "Jul.", "Aug.", "Sep.", "Oct.", "Nov.", "Dec."];
        var dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        var dayAbbr = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        var eraNames = ["Before Christ", "Anno Domini"];
        var eraAbbr = ["BC", "AD"];


        function getDayOfYear(/*Date*/dateObject, utc) {
            // summary: gets the day of the year as represented by dateObject
            return date.difference(new Date(dateObject.getFullYear(), 0, 1, dateObject.getHours()), dateObject, null, utc) + 1; // Number
        }

        function getWeekOfYear(/*Date*/dateObject, /*Number*/firstDayOfWeek, utc) {
            firstDayOfWeek = firstDayOfWeek || 0;
            var fullYear = dateObject[utc ? "getUTCFullYear" : "getFullYear"]();
            var firstDayOfYear = new Date(fullYear, 0, 1).getDay(),
                adj = (firstDayOfYear - firstDayOfWeek + 7) % 7,
                week = floor((getDayOfYear(dateObject) + adj - 1) / 7);

            // if year starts on the specified day, start counting weeks at 1
            if (firstDayOfYear === firstDayOfWeek) {
                week++;
            }

            return week; // Number
        }

        function getTimezoneName(/*Date*/dateObject) {
            var str = dateObject.toString();
            var tz = '';
            var pos = str.indexOf('(');
            if (pos > -1) {
                tz = str.substring(++pos, str.indexOf(')'));
            }
            return tz; // String
        }


        function buildDateEXP(pattern, tokens) {
            return pattern.replace(/([a-z])\1*/ig,function (match) {
                // Build a simple regexp.  Avoid captures, which would ruin the tokens list
                var s,
                    c = match.charAt(0),
                    l = match.length,
                    p2 = '0?',
                    p3 = '0{0,2}';
                if (c === 'y') {
                    s = '\\d{2,4}';
                } else if (c === "M") {
                    s = (l > 2) ? '\\S+?' : '1[0-2]|' + p2 + '[1-9]';
                } else if (c === "D") {
                    s = '[12][0-9][0-9]|3[0-5][0-9]|36[0-6]|' + p3 + '[1-9][0-9]|' + p2 + '[1-9]';
                } else if (c === "d") {
                    s = '3[01]|[12]\\d|' + p2 + '[1-9]';
                } else if (c === "w") {
                    s = '[1-4][0-9]|5[0-3]|' + p2 + '[1-9]';
                } else if (c === "E") {
                    s = '\\S+';
                } else if (c === "h") {
                    s = '1[0-2]|' + p2 + '[1-9]';
                } else if (c === "K") {
                    s = '1[01]|' + p2 + '\\d';
                } else if (c === "H") {
                    s = '1\\d|2[0-3]|' + p2 + '\\d';
                } else if (c === "k") {
                    s = '1\\d|2[0-4]|' + p2 + '[1-9]';
                } else if (c === "m" || c === "s") {
                    s = '[0-5]\\d';
                } else if (c === "S") {
                    s = '\\d{' + l + '}';
                } else if (c === "a") {
                    var am = 'AM', pm = 'PM';
                    s = am + '|' + pm;
                    if (am !== am.toLowerCase()) {
                        s += '|' + am.toLowerCase();
                    }
                    if (pm !== pm.toLowerCase()) {
                        s += '|' + pm.toLowerCase();
                    }
                    s = s.replace(/\./g, "\\.");
                } else if (c === 'v' || c === 'z' || c === 'Z' || c === 'G' || c === 'q' || c === 'Q') {
                    s = ".*";
                } else {
                    s = c === " " ? "\\s*" : c + "*";
                }
                if (tokens) {
                    tokens.push(match);
                }

                return "(" + s + ")"; // add capture
            }).replace(/[\xa0 ]/g, "[\\s\\xa0]"); // normalize whitespace.  Need explicit handling of \xa0 for IE.
        }


        /**
         * @namespace Utilities for Dates
         */
        var date = {

            /**@lends date*/

            /**
             * Returns the number of days in the month of a date
             *
             * @example
             *
             *  dateExtender.getDaysInMonth(new Date(2006, 1, 1)); //28
             *  dateExtender.getDaysInMonth(new Date(2004, 1, 1)); //29
             *  dateExtender.getDaysInMonth(new Date(2006, 2, 1)); //31
             *  dateExtender.getDaysInMonth(new Date(2006, 3, 1)); //30
             *  dateExtender.getDaysInMonth(new Date(2006, 4, 1)); //31
             *  dateExtender.getDaysInMonth(new Date(2006, 5, 1)); //30
             *  dateExtender.getDaysInMonth(new Date(2006, 6, 1)); //31
             * @param {Date} dateObject the date containing the month
             * @return {Number} the number of days in the month
             */
            getDaysInMonth: function (/*Date*/dateObject) {
                //	summary:
                //		Returns the number of days in the month used by dateObject
                var month = dateObject.getMonth();
                var days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
                if (month === 1 && date.isLeapYear(dateObject)) {
                    return 29;
                } // Number
                return days[month]; // Number
            },

            /**
             * Determines if a date is a leap year
             *
             * @example
             *
             *  dateExtender.isLeapYear(new Date(1600, 0, 1)); //true
             *  dateExtender.isLeapYear(new Date(2004, 0, 1)); //true
             *  dateExtender.isLeapYear(new Date(2000, 0, 1)); //true
             *  dateExtender.isLeapYear(new Date(2006, 0, 1)); //false
             *  dateExtender.isLeapYear(new Date(1900, 0, 1)); //false
             *  dateExtender.isLeapYear(new Date(1800, 0, 1)); //false
             *  dateExtender.isLeapYear(new Date(1700, 0, 1)); //false
             *
             * @param {Date} dateObject
             * @returns {Boolean} true if it is a leap year false otherwise
             */
            isLeapYear: function (/*Date*/dateObject, utc) {
                var year = dateObject[utc ? "getUTCFullYear" : "getFullYear"]();
                return (year % 400 === 0) || (year % 4 === 0 && year % 100 !== 0);

            },

            /**
             * Determines if a date is on a weekend
             *
             * @example
             *
             * var thursday = new Date(2006, 8, 21);
             * var saturday = new Date(2006, 8, 23);
             * var sunday = new Date(2006, 8, 24);
             * var monday = new Date(2006, 8, 25);
             * dateExtender.isWeekend(thursday)); //false
             * dateExtender.isWeekend(saturday); //true
             * dateExtender.isWeekend(sunday); //true
             * dateExtender.isWeekend(monday)); //false
             *
             * @param {Date} dateObject the date to test
             *
             * @returns {Boolean} true if the date is a weekend
             */
            isWeekend: function (/*Date?*/dateObject, utc) {
                // summary:
                //	Determines if the date falls on a weekend, according to local custom.
                var day = (dateObject || new Date())[utc ? "getUTCDay" : "getDay"]();
                return day === 0 || day === 6;
            },

            /**
             * Get the timezone of a date
             *
             * @example
             *  //just setting the strLocal to simulate the toString() of a date
             *  dt.str = 'Sun Sep 17 2006 22:25:51 GMT-0500 (CDT)';
             *  //just setting the strLocal to simulate the locale
             *  dt.strLocale = 'Sun 17 Sep 2006 10:25:51 PM CDT';
             *  dateExtender.getTimezoneName(dt); //'CDT'
             *  dt.str = 'Sun Sep 17 2006 22:57:18 GMT-0500 (CDT)';
             *  dt.strLocale = 'Sun Sep 17 22:57:18 2006';
             *  dateExtender.getTimezoneName(dt); //'CDT'
             * @param dateObject the date to get the timezone from
             *
             * @returns {String} the timezone of the date
             */
            getTimezoneName: getTimezoneName,

            /**
             * Compares two dates
             *
             * @example
             *
             * var d1 = new Date();
             * d1.setHours(0);
             * dateExtender.compare(d1, d1); // 0
             *
             *  var d1 = new Date();
             *  d1.setHours(0);
             *  var d2 = new Date();
             *  d2.setFullYear(2005);
             *  d2.setHours(12);
             *  dateExtender.compare(d1, d2, "date"); // 1
             *  dateExtender.compare(d1, d2, "datetime"); // 1
             *
             *  var d1 = new Date();
             *  d1.setHours(0);
             *  var d2 = new Date();
             *  d2.setFullYear(2005);
             *  d2.setHours(12);
             *  dateExtender.compare(d2, d1, "date"); // -1
             *  dateExtender.compare(d1, d2, "time"); //-1
             *
             * @param {Date|String} date1 the date to comapare
             * @param {Date|String} [date2=new Date()] the date to compare date1 againse
             * @param {"date"|"time"|"datetime"} portion compares the portion specified
             *
             * @returns -1 if date1 is < date2 0 if date1 === date2  1 if date1 > date2
             */
            compare: function (/*Date*/date1, /*Date*/date2, /*String*/portion) {
                date1 = new Date(+date1);
                date2 = new Date(+(date2 || new Date()));

                if (portion === "date") {
                    // Ignore times and compare dates.
                    date1.setHours(0, 0, 0, 0);
                    date2.setHours(0, 0, 0, 0);
                } else if (portion === "time") {
                    // Ignore dates and compare times.
                    date1.setFullYear(0, 0, 0);
                    date2.setFullYear(0, 0, 0);
                }
                return date1 > date2 ? 1 : date1 < date2 ? -1 : 0;
            },


            /**
             * Adds a specified interval and amount to a date
             *
             * @example
             *  var dtA = new Date(2005, 11, 27);
             *  dateExtender.add(dtA, "year", 1); //new Date(2006, 11, 27);
             *  dateExtender.add(dtA, "years", 1); //new Date(2006, 11, 27);
             *
             *  dtA = new Date(2000, 0, 1);
             *  dateExtender.add(dtA, "quarter", 1); //new Date(2000, 3, 1);
             *  dateExtender.add(dtA, "quarters", 1); //new Date(2000, 3, 1);
             *
             *  dtA = new Date(2000, 0, 1);
             *  dateExtender.add(dtA, "month", 1); //new Date(2000, 1, 1);
             *  dateExtender.add(dtA, "months", 1); //new Date(2000, 1, 1);
             *
             *  dtA = new Date(2000, 0, 31);
             *  dateExtender.add(dtA, "month", 1); //new Date(2000, 1, 29);
             *  dateExtender.add(dtA, "months", 1); //new Date(2000, 1, 29);
             *
             *  dtA = new Date(2000, 0, 1);
             *  dateExtender.add(dtA, "week", 1); //new Date(2000, 0, 8);
             *  dateExtender.add(dtA, "weeks", 1); //new Date(2000, 0, 8);
             *
             *  dtA = new Date(2000, 0, 1);
             *  dateExtender.add(dtA, "day", 1); //new Date(2000, 0, 2);
             *
             *  dtA = new Date(2000, 0, 1);
             *  dateExtender.add(dtA, "weekday", 1); //new Date(2000, 0, 3);
             *
             *  dtA = new Date(2000, 0, 1, 11);
             *  dateExtender.add(dtA, "hour", 1); //new Date(2000, 0, 1, 12);
             *
             *  dtA = new Date(2000, 11, 31, 23, 59);
             *  dateExtender.add(dtA, "minute", 1); //new Date(2001, 0, 1, 0, 0);
             *
             *  dtA = new Date(2000, 11, 31, 23, 59, 59);
             *  dateExtender.add(dtA, "second", 1); //new Date(2001, 0, 1, 0, 0, 0);
             *
             *  dtA = new Date(2000, 11, 31, 23, 59, 59, 999);
             *  dateExtender.add(dtA, "millisecond", 1); //new Date(2001, 0, 1, 0, 0, 0, 0);
             *
             * @param {Date} date
             * @param {String} interval the interval to add
             *  <ul>
             *      <li>day | days</li>
             *      <li>weekday | weekdays</li>
             *      <li>year | years</li>
             *      <li>week | weeks</li>
             *      <li>quarter | quarters</li>
             *      <li>months | months</li>
             *      <li>hour | hours</li>
             *      <li>minute | minutes</li>
             *      <li>second | seconds</li>
             *      <li>millisecond | milliseconds</li>
             *  </ul>
             * @param {Number} [amount=0] the amount to add
             */
            add: function (/*Date*/date, /*String*/interval, /*int*/amount) {
                var res = addTransform(interval, date, amount || 0);
                amount = res[0];
                var property = res[1];
                var sum = new Date(+date);
                var fixOvershoot = res[2];
                if (property) {
                    sum["set" + property](sum["get" + property]() + amount);
                }

                if (fixOvershoot && (sum.getDate() < date.getDate())) {
                    sum.setDate(0);
                }

                return sum; // Date
            },

            /**
             * Finds the difference between two dates based on the specified interval
             *
             * @example
             *
             * var dtA, dtB;
             *
             * dtA = new Date(2005, 11, 27);
             * dtB = new Date(2006, 11, 27);
             * dateExtender.difference(dtA, dtB, "year"); //1
             *
             * dtA = new Date(2000, 1, 29);
             * dtB = new Date(2001, 2, 1);
             * dateExtender.difference(dtA, dtB, "quarter"); //4
             * dateExtender.difference(dtA, dtB, "month"); //13
             *
             * dtA = new Date(2000, 1, 1);
             * dtB = new Date(2000, 1, 8);
             * dateExtender.difference(dtA, dtB, "week"); //1
             *
             * dtA = new Date(2000, 1, 29);
             * dtB = new Date(2000, 2, 1);
             * dateExtender.difference(dtA, dtB, "day"); //1
             *
             * dtA = new Date(2006, 7, 3);
             * dtB = new Date(2006, 7, 11);
             * dateExtender.difference(dtA, dtB, "weekday"); //6
             *
             * dtA = new Date(2000, 11, 31, 23);
             * dtB = new Date(2001, 0, 1, 0);
             * dateExtender.difference(dtA, dtB, "hour"); //1
             *
             * dtA = new Date(2000, 11, 31, 23, 59);
             * dtB = new Date(2001, 0, 1, 0, 0);
             * dateExtender.difference(dtA, dtB, "minute"); //1
             *
             * dtA = new Date(2000, 11, 31, 23, 59, 59);
             * dtB = new Date(2001, 0, 1, 0, 0, 0);
             * dateExtender.difference(dtA, dtB, "second"); //1
             *
             * dtA = new Date(2000, 11, 31, 23, 59, 59, 999);
             * dtB = new Date(2001, 0, 1, 0, 0, 0, 0);
             * dateExtender.difference(dtA, dtB, "millisecond"); //1
             *
             *
             * @param {Date} date1
             * @param {Date} [date2 = new Date()]
             * @param {String} [interval = "day"] the intercal to find the difference of.
             *   <ul>
             *      <li>day | days</li>
             *      <li>weekday | weekdays</li>
             *      <li>year | years</li>
             *      <li>week | weeks</li>
             *      <li>quarter | quarters</li>
             *      <li>months | months</li>
             *      <li>hour | hours</li>
             *      <li>minute | minutes</li>
             *      <li>second | seconds</li>
             *      <li>millisecond | milliseconds</li>
             *  </ul>
             */
            difference: function (/*Date*/date1, /*Date?*/date2, /*String*/interval, utc) {
                date2 = date2 || new Date();
                interval = interval || "day";
                return differenceTransform(interval, date1, date2, utc);
            },

            /**
             * Formats a date to the specidifed format string
             *
             * @example
             *
             * var date = new Date(2006, 7, 11, 0, 55, 12, 345);
             * dateExtender.format(date, "EEEE, MMMM dd, yyyy"); //"Friday, August 11, 2006"
             * dateExtender.format(date, "M/dd/yy"); //"8/11/06"
             * dateExtender.format(date, "E"); //"6"
             * dateExtender.format(date, "h:m a"); //"12:55 AM"
             * dateExtender.format(date, 'h:m:s'); //"12:55:12"
             * dateExtender.format(date, 'h:m:s.SS'); //"12:55:12.35"
             * dateExtender.format(date, 'k:m:s.SS'); //"24:55:12.35"
             * dateExtender.format(date, 'H:m:s.SS'); //"0:55:12.35"
             * dateExtender.format(date, "ddMMyyyy"); //"11082006"
             *
             * @param date the date to format
             * @param {String} format the format of the date composed of the following options
             * <ul>
             *                  <li> G    Era designator    Text    AD</li>
             *                  <li> y    Year    Year    1996; 96</li>
             *                  <li> M    Month in year    Month    July; Jul; 07</li>
             *                  <li> w    Week in year    Number    27</li>
             *                  <li> W    Week in month    Number    2</li>
             *                  <li> D    Day in year    Number    189</li>
             *                  <li> d    Day in month    Number    10</li>
             *                  <li> E    Day in week    Text    Tuesday; Tue</li>
             *                  <li> a    Am/pm marker    Text    PM</li>
             *                  <li> H    Hour in day (0-23)    Number    0</li>
             *                  <li> k    Hour in day (1-24)    Number    24</li>
             *                  <li> K    Hour in am/pm (0-11)    Number    0</li>
             *                  <li> h    Hour in am/pm (1-12)    Number    12</li>
             *                  <li> m    Minute in hour    Number    30</li>
             *                  <li> s    Second in minute    Number    55</li>
             *                  <li> S    Millisecond    Number    978</li>
             *                  <li> z    Time zone    General time zone    Pacific Standard Time; PST; GMT-08:00</li>
             *                  <li> Z    Time zone    RFC 822 time zone    -0800 </li>
             * </ul>
             */
            format: function (date, format, utc) {
                utc = utc || false;
                var fullYear, month, day, d, hour, minute, second, millisecond;
                if (utc) {
                    fullYear = date.getUTCFullYear();
                    month = date.getUTCMonth();
                    day = date.getUTCDay();
                    d = date.getUTCDate();
                    hour = date.getUTCHours();
                    minute = date.getUTCMinutes();
                    second = date.getUTCSeconds();
                    millisecond = date.getUTCMilliseconds();
                } else {
                    fullYear = date.getFullYear();
                    month = date.getMonth();
                    d = date.getDate();
                    day = date.getDay();
                    hour = date.getHours();
                    minute = date.getMinutes();
                    second = date.getSeconds();
                    millisecond = date.getMilliseconds();
                }
                return format.replace(/([A-Za-z])\1*/g, function (match) {
                    var s, pad,
                        c = match.charAt(0),
                        l = match.length;
                    if (c === 'd') {
                        s = "" + d;
                        pad = true;
                    } else if (c === "H" && !s) {
                        s = "" + hour;
                        pad = true;
                    } else if (c === 'm' && !s) {
                        s = "" + minute;
                        pad = true;
                    } else if (c === 's') {
                        if (!s) {
                            s = "" + second;
                        }
                        pad = true;
                    } else if (c === "G") {
                        s = ((l < 4) ? eraAbbr : eraNames)[fullYear < 0 ? 0 : 1];
                    } else if (c === "y") {
                        s = fullYear;
                        if (l > 1) {
                            if (l === 2) {
                                s = _truncate("" + s, 2, true);
                            } else {
                                pad = true;
                            }
                        }
                    } else if (c.toUpperCase() === "Q") {
                        s = ceil((month + 1) / 3);
                        pad = true;
                    } else if (c === "M") {
                        if (l < 3) {
                            s = month + 1;
                            pad = true;
                        } else {
                            s = (l === 3 ? monthAbbr : monthNames)[month];
                        }
                    } else if (c === "w") {
                        s = getWeekOfYear(date, 0, utc);
                        pad = true;
                    } else if (c === "D") {
                        s = getDayOfYear(date, utc);
                        pad = true;
                    } else if (c === "E") {
                        if (l < 3) {
                            s = day + 1;
                            pad = true;
                        } else {
                            s = (l === -3 ? dayAbbr : dayNames)[day];
                        }
                    } else if (c === 'a') {
                        s = (hour < 12) ? 'AM' : 'PM';
                    } else if (c === "h") {
                        s = (hour % 12) || 12;
                        pad = true;
                    } else if (c === "K") {
                        s = (hour % 12);
                        pad = true;
                    } else if (c === "k") {
                        s = hour || 24;
                        pad = true;
                    } else if (c === "S") {
                        s = round(millisecond * pow(10, l - 3));
                        pad = true;
                    } else if (c === "z" || c === "v" || c === "Z") {
                        s = getTimezoneName(date);
                        if ((c === "z" || c === "v") && !s) {
                            l = 4;
                        }
                        if (!s || c === "Z") {
                            var offset = date.getTimezoneOffset();
                            var tz = [
                                (offset >= 0 ? "-" : "+"),
                                _pad(floor(abs(offset) / 60), 2, "0"),
                                _pad(abs(offset) % 60, 2, "0")
                            ];
                            if (l === 4) {
                                tz.splice(0, 0, "GMT");
                                tz.splice(3, 0, ":");
                            }
                            s = tz.join("");
                        }
                    } else {
                        s = match;
                    }
                    if (pad) {
                        s = _pad(s, l, '0');
                    }
                    return s;
                });
            }

        };

        var numberDate = {};

        function addInterval(interval) {
            numberDate[interval + "sFromNow"] = function (val) {
                return date.add(new Date(), interval, val);
            };
            numberDate[interval + "sAgo"] = function (val) {
                return date.add(new Date(), interval, -val);
            };
        }

        var intervals = ["year", "month", "day", "hour", "minute", "second"];
        for (var i = 0, l = intervals.length; i < l; i++) {
            addInterval(intervals[i]);
        }

        var stringDate = {

            parseDate: function (dateStr, format) {
                if (!format) {
                    throw new Error('format required when calling dateExtender.parse');
                }
                var tokens = [], regexp = buildDateEXP(format, tokens),
                    re = new RegExp("^" + regexp + "$", "i"),
                    match = re.exec(dateStr);
                if (!match) {
                    return null;
                } // null
                var result = [1970, 0, 1, 0, 0, 0, 0], // will get converted to a Date at the end
                    amPm = "",
                    valid = every(match, function (v, i) {
                        if (i) {
                            var token = tokens[i - 1];
                            var l = token.length, type = token.charAt(0);
                            if (type === 'y') {
                                if (v < 100) {
                                    v = parseInt(v, 10);
                                    //choose century to apply, according to a sliding window
                                    //of 80 years before and 20 years after present year
                                    var year = '' + new Date().getFullYear(),
                                        century = year.substring(0, 2) * 100,
                                        cutoff = min(year.substring(2, 4) + 20, 99);
                                    result[0] = (v < cutoff) ? century + v : century - 100 + v;
                                } else {
                                    result[0] = v;
                                }
                            } else if (type === "M") {
                                if (l > 2) {
                                    var months = monthNames, j, k;
                                    if (l === 3) {
                                        months = monthAbbr;
                                    }
                                    //Tolerate abbreviating period in month part
                                    //Case-insensitive comparison
                                    v = v.replace(".", "").toLowerCase();
                                    var contains = false;
                                    for (j = 0, k = months.length; j < k && !contains; j++) {
                                        var s = months[j].replace(".", "").toLocaleLowerCase();
                                        if (s === v) {
                                            v = j;
                                            contains = true;
                                        }
                                    }
                                    if (!contains) {
                                        return false;
                                    }
                                } else {
                                    v--;
                                }
                                result[1] = v;
                            } else if (type === "E" || type === "e") {
                                var days = dayNames;
                                if (l === 3) {
                                    days = dayAbbr;
                                }
                                //Case-insensitive comparison
                                v = v.toLowerCase();
                                days = array.map(days, function (d) {
                                    return d.toLowerCase();
                                });
                                var d = array.indexOf(days, v);
                                if (d === -1) {
                                    v = parseInt(v, 10);
                                    if (isNaN(v) || v > days.length) {
                                        return false;
                                    }
                                } else {
                                    v = d;
                                }
                            } else if (type === 'D' || type === "d") {
                                if (type === "D") {
                                    result[1] = 0;
                                }
                                result[2] = v;
                            } else if (type === "a") {
                                var am = "am";
                                var pm = "pm";
                                var period = /\./g;
                                v = v.replace(period, '').toLowerCase();
                                // we might not have seen the hours field yet, so store the state and apply hour change later
                                amPm = (v === pm) ? 'p' : (v === am) ? 'a' : '';
                            } else if (type === "k" || type === "h" || type === "H" || type === "K") {
                                if (type === "k" && (+v) === 24) {
                                    v = 0;
                                }
                                result[3] = v;
                            } else if (type === "m") {
                                result[4] = v;
                            } else if (type === "s") {
                                result[5] = v;
                            } else if (type === "S") {
                                result[6] = v;
                            }
                        }
                        return true;
                    });
                if (valid) {
                    var hours = +result[3];
                    //account for am/pm
                    if (amPm === 'p' && hours < 12) {
                        result[3] = hours + 12; //e.g., 3pm -> 15
                    } else if (amPm === 'a' && hours === 12) {
                        result[3] = 0; //12am -> 0
                    }
                    var dateObject = new Date(result[0], result[1], result[2], result[3], result[4], result[5], result[6]); // Date
                    var dateToken = (array.indexOf(tokens, 'd') !== -1),
                        monthToken = (array.indexOf(tokens, 'M') !== -1),
                        month = result[1],
                        day = result[2],
                        dateMonth = dateObject.getMonth(),
                        dateDay = dateObject.getDate();
                    if ((monthToken && dateMonth > month) || (dateToken && dateDay > day)) {
                        return null;
                    }
                    return dateObject; // Date
                } else {
                    return null;
                }
            }
        };


        var ret = extended.define(is.isDate, date).define(is.isString, stringDate).define(is.isNumber, numberDate);
        for (i in date) {
            if (date.hasOwnProperty(i)) {
                ret[i] = date[i];
            }
        }

        for (i in stringDate) {
            if (stringDate.hasOwnProperty(i)) {
                ret[i] = stringDate[i];
            }
        }
        for (i in numberDate) {
            if (numberDate.hasOwnProperty(i)) {
                ret[i] = numberDate[i];
            }
        }
        return ret;
    }

    if ("undefined" !== typeof exports) {
        if ("undefined" !== typeof module && module.exports) {
            module.exports = defineDate(require("extended"), require("is-extended"), require("array-extended"));

        }
    } else if ("function" === typeof define) {
        define(["require"], function (require) {
            return defineDate(require("extended"), require("is-extended"), require("array-extended"));
        });
    } else {
        this.dateExtended = defineDate(this.extended, this.isExtended, this.arrayExtended);
    }

}).call(this);







});

require.define("fs",function(require,module,exports,__dirname,__filename,process,global){// nothing to see here... no file methods for the browser

});

require.define("/lib/nodes.js",function(require,module,exports,__dirname,__filename,process,global){"use strict";
var extd = require("./extended"),
    bind = extd.bind,
    merge = extd.merge,
    removeDuplicates = extd.removeDuplicates,
    forEach = extd.forEach,
    some = extd.some,
    indexOf = extd.indexOf,
    intersect = extd.intersect,
    declare = extd.declare,
    object = extd.hash,
    values = object.values,
    keys = object.keys,
    HashTable = extd.HashTable,
    MatchResult = require("./matchResult"),
    pattern = require("./pattern.js"),
    ObjectPattern = pattern.ObjectPattern,
    NotPattern = pattern.NotPattern,
    CompositePattern = pattern.CompositePattern,
    InitialFactPattern = pattern.InitialFactPattern,
    constraints = require("./constraint"),
    HashConstraint = constraints.HashConstraint,
    ReferenceConstraint = constraints.ReferenceConstraint;

var Node = declare({
    instance: {
        constructor: function () {
            this.nodes = new HashTable();
            this.parentNodes = [];

        },

        merge: function (that) {
            that.nodes.forEach(function (entry) {
                var patterns = entry.value, node = entry.key;
                for (var i = 0, l = patterns.length; i < l; i++) {
                    this.addOutNode(node, patterns[i]);
                }
                that.nodes.remove(node);
            }, this);
            var thatParentNodes = that.parentNodes;
            for (var i = 0, l = that.parentNodes.l; i < l; i++) {
                var parentNode = thatParentNodes[i];
                this.addParentNode(parentNode);
                parentNode.nodes.remove(that);
            }
            return this;
        },

        resolve: function (mr1, mr2) {
            var mr1FactHash = mr1.factHash, mr2FactHash = mr2.factHash;
            var fhKeys1 = keys(mr1FactHash),
                fhKeys2 = keys(mr2FactHash);
            var i = fhKeys1.length - 1, j = fhKeys2.length - 1;
            if (i !== j) {
                return false;
            }
            fhKeys1.sort();
            fhKeys2.sort();
            for (; i >= 0; i--) {
                var k1 = fhKeys1[i], k2 = fhKeys2[i];
                if (k1 === k2 && mr1FactHash[k1] !== mr2FactHash[k2]) {
                    return false;
                }
            }

            return true;
        },

        print: function (tab) {
            console.log(tab + this.toString());
            forEach(this.parentNodes, function (n) {
                n.print("  " + tab);
            });
        },

        addOutNode: function (outNode, pattern) {
            if (!this.nodes.contains(outNode)) {
                this.nodes.put(outNode, []);
            }
            this.nodes.get(outNode).push(pattern);
        },

        addParentNode: function (n) {
            if (indexOf(this.parentNodes, n) === -1) {
                this.parentNodes.push(n);
            }
        },

        shareable: function () {
            return false;
        },

        __propagate: function (method, assertable, outNodes) {
            outNodes = outNodes || this.nodes;
            var entrySet = outNodes.entrySet(), i = entrySet.length - 1, entry, outNode, paths, continuingPaths;
            for (; i >= 0; i--) {
                entry = entrySet[i];
                outNode = entry.key;
                paths = entry.value;
                if (assertable.paths) {
                    if ((continuingPaths = intersect(paths, assertable.paths)).length) {
                        outNode[method]({fact: assertable.fact, factHash: {}, paths: continuingPaths});
                    }
                } else {
                    outNode[method](assertable);
                }
            }
        },

        dispose: function (assertable) {
            this.propagateDispose(assertable);
        },

        retract: function (assertable) {
            this.propagateRetract(assertable);
        },

        propagateDispose: function (assertable, outNodes) {
            outNodes = outNodes || this.nodes;
            var entrySet = outNodes.entrySet(), i = entrySet.length - 1;
            for (; i >= 0; i--) {
                var entry = entrySet[i], outNode = entry.key;
                outNode.dispose(assertable);
            }
        },

        propagateAssert: function (assertable, outNodes) {
            this.__propagate("assert", assertable, outNodes || this.nodes);
        },

        propagateRetract: function (assertable, outNodes) {
            this.__propagate("retract", assertable, outNodes || this.nodes);
        },

        assert: function (assertable) {
            this.propagateAssert(assertable);
        },

        propagateModify: function (assertable, outNodes) {
            this.__propagate("modify", assertable, outNodes || this.nodes);
        }
    }

});

var AlphaNode = Node.extend({
    instance: {
        constructor: function (constraint) {
            this._super([]);
            this.constraint = constraint;
        },

        toString: function () {
            return extd.format("%j", this.constraint.constraint);
        },

        equal: function (constraint) {
            return this.constraint.equal(constraint.constraint);
        }
    }
});

var TypeNode = AlphaNode.extend({
    instance: {

        assert: function (fact) {
            if (this.constraint.assert(fact.object)) {
                this.propagateAssert({fact: fact});
            }
        },

        retract: function (fact) {
            if (this.constraint.assert(fact.object)) {
                this.propagateRetract({fact: fact});
            }
        },

        toString: function () {
            return "Type Node" + this.constraint.constraint;
        },

        dispose: function () {
            var es = this.nodes.entrySet(), i = es.length - 1;
            for (; i >= 0; i--) {
                var e = es[i], outNode = e.key, paths = e.value;
                outNode.dispose({paths: paths});
            }
        },

        __propagate: function (method, assertion, outNodes) {
            var es = (outNodes || this.nodes).entrySet(), i = es.length - 1;
            for (; i >= 0; i--) {
                var e = es[i], outNode = e.key, paths = e.value;
                assertion.factHash = {};
                assertion.paths = paths;
                outNode[method](assertion);
            }
        }
    }
});

var PropertyNode = AlphaNode.extend({
    instance: {

        constructor: function () {
            this._super(arguments);
            this.alias = this.constraint.get("alias");
        },

        assert: function (assertable) {
            var fh = {}, constraint = this.constraint, o = assertable.fact.object, alias = this.alias;
            fh[alias] = o;
            if (constraint.assert(fh)) {
                assertable.factHash[alias] = o;
                this._super([assertable]);
            }
        },

        toString: function () {
            return "Property Node" + this._super(arguments);
        }
    }
});

var ReferenceNode = AlphaNode.extend({
    instance: {

        constructor: function () {
            this._super(arguments);
            this.__alias = this.constraint.get("alias");
            this.__variables = this.constraint.get("variables");
        },

        //used by NotNode to avoid creating match Result for efficiency
        isMatch: function (leftContext, rightContext) {
            var leftMatch = leftContext.match,
                fh = leftMatch.factHash,
                alias = this.__alias,
                rightFact = rightContext.fact;
            fh[alias] = rightFact.object;
            var ret = this.constraint.assert(fh);
            fh[alias] = null;
            return ret;

        },


        match: function (leftContext, rightContext) {
            var leftMatch = leftContext.match,
                fh = leftMatch.factHash,
                alias = this.__alias,
                rightFact = rightContext.fact,
                ro = fh[alias] = rightFact.object;
            if (this.constraint.assert(fh)) {
                var mr = new MatchResult().merge(leftMatch);
                mr.isMatch = true;
                mr.factHash[alias] = ro;
                mr.recency.push(rightFact.recency);
                return mr;
            }
            fh[alias] = null;
            return new MatchResult();
        },
        toString: function () {
            return "Reference Node" + this._super(arguments);
        }
    }
});

var called = 0
var JoinReferenceNode = Node.extend({

    instance: {

        constructor: function () {
            this._super(arguments);
            this._cache = {};
        },

        addConstraint: function (constraint) {
            if (!this.constraint) {
                this.constraint = constraint;
            } else {
                this.constraint = this.constraint.merge(constraint);
            }
            this.__alias = this.constraint.get("alias");
            this.__variables = this.constraint.get("variables");
        },

        equal: function (constraint) {
            if (this.constraint) {
                return this.constraint.equal(constraint.constraint);
            }
        },

        isMatch: function (leftContext, rightContext) {
            if (!this.constraint) {
                return false;
            }
            var fh = leftContext.match.factHash,
                alias = this.__alias,
                ret;
            fh[alias] = rightContext.fact.object;
            ret = !this.constraint.assert(fh);
            fh[alias] = null;
            return ret;

        },

        match: function (leftContext, rightContext) {
            if (!this.constraint) {
                return leftContext.match.merge(rightContext.match);
            }
            var leftMatch = leftContext.match,
                fh = leftMatch.factHash,
                alias = this.__alias,
                rightFact = rightContext.fact,
                ro = fh[alias] = rightFact.object;
            if (this.constraint.assert(fh)) {
                var mr = rightContext.match.merge(leftMatch);
                mr.isMatch = true;
                mr.factHash[alias] = ro;
                mr.recency.push(rightFact.recency);
                return mr;
            }
            fh[alias] = null;
            return new MatchResult();
        }

    }

});

var EqualityNode = AlphaNode.extend({
    instance: {

        constructor: function () {
            this._super(arguments);
            this.alias = this.constraint.get("alias");
        },

        assert: function (assertable) {
            var fh = {};
            fh[this.alias] = assertable.fact.object;
            if (this.constraint.assert(fh)) {
                this._super([assertable]);
            }
        },

        toString: function () {
            return "Equality Node" + this._super(arguments);
        }
    }
});


var BridgeNode = Node.extend({

    instance: {

        constructor: function (pattern) {
            this._super([]);
            this.pattern = pattern;
            var variables = this.variables = {};
            //this.constraints = pattern.get("constraints");
            extd(pattern.get("constraints")).filter(function (c) {
                return c instanceof HashConstraint;
            }).forEach(function (c) {
                    merge(variables, extd.hash.invert(c.get("variables")));
                });
            this.alias = pattern.alias;
        },

        toString: function () {
            return "Base Bridge Node " + this.pattern;
        },

        assert: function (assertable) {
            var mr = new MatchResult(assertable), constraints = this.constraints;
            mr.isMatch = true;
            var fact = assertable.fact, o = fact.object, fh = mr.factHash, variables = this.variables;
            fh[this.alias] = o;
            for (var i in variables) {
                fh[i] = o[variables[i]];
            }
            this.propagateAssert({match: mr, fact: fact});
        },

        retract: function (assertable) {
            this.propagateRetract(assertable.fact);
        }
    }

});

var LeftAdapterNode = Node.extend({
    instance: {
        propagateAssert: function (context) {
            this.__propagate("assertLeft", context);
        },

        propagateRetract: function (context) {
            this.__propagate("retractLeft", context);
        },

        propagateResolve: function (context) {
            this.__propagate("retractResolve", context);
        },

        modify: function (context) {
            this.__propagate("modifyLeft", context);
        },

        retractResolve: function (match) {
            this.__propagate("retractResolve", match);
        },

        dispose: function (context) {
            this.propagateDispose(context);
        }
    }

});

var RightAdapterNode = Node.extend({
    instance: {

        retractResolve: function (match) {
            this.__propagate("retractResolve", match);
        },

        dispose: function (context) {
            this.propagateDispose(context);
        },

        propagateAssert: function (context) {
            this.__propagate("assertRight", context);
        },

        propagateRetract: function (context) {
            this.__propagate("retractRight", context);
        },

        propagateResolve: function (context) {
            this.__propagate("retractResolve", context);
        },

        modify: function (context) {
            this.__propagate("modifyRight", context);
        }
    }
});


var count = 0;
var JoinNode = Node.extend({

    instance: {
        constructor: function () {
            this._super([]);
            this.constraint = new JoinReferenceNode();
            this.leftMemory = {};
            this.rightMemory = {};
            this.leftTuples = [];
            this.rightTuples = [];
            this.__count = count++;
        },

        dispose: function () {
            this.leftMemory = {};
            this.rightMemory = {};
        },

        disposeLeft: function (fact) {
            this.leftMemory = {};
            this.propagateDispose(fact);
        },

        disposeRight: function (fact) {
            this.rightMemory = {};
            this.propagateDispose(fact);
        },

        hashCode: function () {
            return  "JoinNode " + this.__count;
        },

        toString: function () {
            return "JoinNode " + extd.format("%j", this.leftMemory) + " " + extd.format("%j", this.rightMemory);
        },

        retractResolve: function (match) {
            var es = values(this.leftMemory), j = es.length - 1, leftTuples = this.leftTuples;
            for (; j >= 0; j--) {
                var contexts = es[j], i = contexts.length - 1, context;
                for (; i >= 0; i--) {
                    context = contexts[i];
                    if (this.resolve(context.match, match)) {
                        leftTuples.splice(indexOf(leftTuples, context), 1);
                        contexts.splice(i, 1);
                        return this._propagateRetractResolve(match);
                    }
                }
            }
            this._propagateRetractResolve(match);
        },

        retractLeft: function (fact) {
            var contexts = this.leftMemory[fact.id], tuples = this.leftTuples;
            if (contexts) {
                for (var i = 0, l = contexts.length; i < l; i++) {
                    tuples.splice(indexOf(tuples, contexts[i]), 1);
                }
            }
            delete this.leftMemory[fact.id];
            this.propagateRetract(fact);
        },

        retractRight: function (fact) {
            var context = this.rightMemory[fact.id], tuples = this.rightTuples;
            if (context) {
                tuples.splice(indexOf(tuples, context), 1);
            }
            delete this.rightMemory[fact.id];
            this.propagateRetract(fact);
        },

        assertLeft: function (context) {
            var fact = context.fact;
            this.__addToLeftMemory(context);
            var rm = this.rightTuples, i = rm.length - 1, thisConstraint = this.constraint, mr;
            for (; i >= 0; i--) {
                if ((mr = thisConstraint.match(context, rm[i])).isMatch) {
                    this.propagateAssert({fact: fact, match: mr});
                }
            }
        },

        assertRight: function (context) {
            var fact = context.fact;
            this.rightMemory[fact.id] = context;
            this.rightTuples.push(context);
            var fl = this.leftTuples, i = fl.length - 1, thisConstraint = this.constraint, mr;
            for (; i >= 0; i--) {
                if ((mr = thisConstraint.match(fl[i], context)).isMatch) {
                    this.propagateAssert({fact: fact, match: mr});
                }
            }
        },

        _propagateRetractResolve: function (context) {
            this.__propagate("retractResolve", context);
        },

        __addToLeftMemory: function (context) {
            var o = context.fact;
            var lm = this.leftMemory[o.id];
            if (!lm) {
                lm = [];
                this.leftMemory[o.id] = lm;
            }
            this.leftTuples.push(context);
            lm.push(context);
            return this;
        }
    }

});


var NotNode = JoinNode.extend({
    instance: {

        constructor: function () {
            this._super(arguments);
            this.leftTupleMemory = {};
        },


        toString: function () {
            return "NotNode " + extd.format("%j", this.leftMemory) + " " + extd.format("%j", this.rightMemory);
        },


        retractRight: function (fact) {
            var rightMemory = this.rightMemory;
            var rightContext = rightMemory[fact.id];
            delete rightMemory[fact.id];
            if (rightContext) {
                var index = indexOf(this.rightTuples, rightContext);
                this.rightTuples.splice(index, 1);
                var fl = rightContext.blocking, leftContext;
                var rValues = this.rightTuples, k = rValues.length, rc, j;
                while ((leftContext = fl.pop())) {
                    leftContext.blocker = null;
                    for (j = index; j < k; j++) {
                        rc = rValues[j];
                        if (this.__matchRefNodes(leftContext, rc)) {
                            break;
                        }
                    }
                    if (!leftContext.blocker) {
                        this.__removeFromLeftTupleMemory(leftContext);
                        this.__addToLeftMemory(leftContext).propagateAssert({match: leftContext.match, fact: leftContext.fact});
                    }
                }
            }
        },


        retractLeft: function (fact) {
            var contexts = this.leftMemory[fact.id], i, l;
            if (!contexts) {
                var leftContexts = this.leftTupleMemory[fact.id], leftContext;
                delete this.leftTupleMemory[fact.id];
                if (leftContexts) {
                    for (i = 0, l = leftContexts.length; i < l; i++) {
                        leftContext = leftContexts[i];
                        var blocking = leftContext.blocker.blocking;
                        blocking.splice(indexOf(blocking, leftContext), 1);
                    }
                }
            } else {
                delete this.leftMemory[fact.id];
                var tuples = this.leftTuples;
                for (i = 0, l = contexts.length; i < l; i++) {
                    tuples.splice(indexOf(tuples, contexts[i]), 1);
                }
            }
            this.propagateRetract(fact);
        },

        assertLeft: function (context) {
            var values = this.rightTuples;
            for (var i = 0, l = values.length; i < l; i++) {
                if (this.__matchRefNodes(context, values[i])) {
                    //blocked so return
                    return;
                }
            }
            this.__addToLeftMemory(context).propagateAssert({match: context.match, fact: context.fact});
        },

        assertRight: function (context) {
            context.blocking = [];
            this.rightTuples.push(context);
            this.rightMemory[context.fact.id] = context;
            var fl = this.leftTuples, i = fl.length - 1, leftContext;
            for (; i >= 0; i--) {
                leftContext = fl[i];
                if (this.__matchRefNodes(leftContext, context)) {
                    this._propagateRetractResolve(leftContext.match);
                    //blocked so remove from memory
                    this.__removeFromLeftMemory(leftContext);


                }
            }
        },

        __removeFromLeftMemory: function (context) {
            var leftMemories = this.leftMemory[context.fact.id], lc, tuples = this.leftTuples;
            for (var i = 0, l = leftMemories.length; i < l; i++) {
                lc = leftMemories[i];
                if (lc === context) {
                    leftMemories.splice(i, 1);
                    tuples.splice(indexOf(tuples, lc), 1);
                    break;
                }
            }
            return this;
        },

        __removeFromLeftTupleMemory: function (context) {
            var leftMemories = this.leftTupleMemory[context.fact.id], lc;
            for (var i = 0, l = leftMemories.length; i < l; i++) {
                lc = leftMemories[i];
                if (lc === context) {
                    leftMemories.splice(i, 1);
                    break;
                }
            }
            return this;
        },

        __addToLeftTupleMemory: function (context) {
            var o = context.fact;
            var lm = this.leftTupleMemory[o.id];
            if (!lm) {
                lm = [];
                this.leftTupleMemory[o.id] = lm;
            }
            lm.push(context);
            return this;
        },

        __matchRefNodes: function (leftContext, rightContext) {
            var ret;
            if (this.constraint.isMatch(leftContext, rightContext)) {
                ret = false;
            } else {
                leftContext.blocker = rightContext;
                rightContext.blocking.push(leftContext);
                this.__addToLeftTupleMemory(leftContext);
                ret = true;
            }
            return ret;
        }
    }
});

var TerminalNode = Node.extend({
    instance: {
        constructor: function (bucket, index, rule, agenda) {
            this._super([]);
            this.rule = rule;
            this.index = index;
            this.name = this.rule.name;
            this.agenda = agenda;
            this.bucket = bucket;
            agenda.register(this);
        },

        __assertModify: function (context) {
            var match = context.match;
            match.recency.sort(
                function (a, b) {
                    return a - b;
                }).reverse();
            match.facts = removeDuplicates(match.facts);
            if (match.isMatch) {
                var rule = this.rule, bucket = this.bucket;
                this.agenda.insert(this, {
                    rule: rule,
                    index: this.index,
                    name: rule.name,
                    recency: bucket.recency++,
                    match: match,
                    counter: bucket.counter
                });
            }
        },

        assert: function (context) {
            this.__assertModify(context);
        },

        modify: function (context) {
            this.__assertModify(context);
        },

        retract: function (fact) {
            this.agenda.removeByFact(this, fact);
        },

        retractRight: function (fact) {
            this.agenda.removeByFact(this, fact);
        },

        retractLeft: function (fact) {
            this.agenda.removeByFact(this, fact);
        },

        assertLeft: function (context) {
            this.__assertModify(context);
        },

        assertRight: function (context) {
            this.__assertModify(context);
        },

        retractResolve: function (match) {
            var resolve = extd.bind(this, this.resolve);
            this.agenda.retract(this, function (v) {
                return resolve(v.match, match);
            });
        },

        toString: function () {
            return "Terminal Node " + this.rule.name;
        }
    }
});

declare({
    instance: {
        constructor: function (wm, agendaTree) {
            this.terminalNodes = [];
            this.joinNodes = [];
            this.nodes = [];
            this.constraints = [];
            this.typeNodes = [];
            this.__ruleCount = 0;
            this.bucket = {
                counter: 0,
                recency: 0
            };
            this.agendaTree = agendaTree;
        },

        assertRule: function (rule) {
            var terminalNode = new TerminalNode(this.bucket, this.__ruleCount++, rule, this.agendaTree);
            this.__addToNetwork(rule.pattern, terminalNode);
            this.__mergeJoinNodes();
            this.terminalNodes.push(terminalNode);
        },

        resetCounter: function () {
            this.bucket.counter = 0;
        },

        incrementCounter: function () {
            this.bucket.counter++;
        },

        assertFact: function (fact) {
            var typeNodes = this.typeNodes, i = typeNodes.length - 1;
            for (; i >= 0; i--) {
                typeNodes[i].assert(fact);
            }
        },

        retractFact: function (fact) {
            var typeNodes = this.typeNodes, i = typeNodes.length - 1;
            for (; i >= 0; i--) {
                typeNodes[i].retract(fact);
            }
        },


        containsRule: function (name) {
            return some(this.terminalNodes, function (n) {
                return n.rule.name === name;
            });
        },

        dispose: function () {
            var typeNodes = this.typeNodes, i = typeNodes.length - 1;
            for (; i >= 0; i--) {
                typeNodes[i].dispose();
            }
        },

        __mergeJoinNodes: function () {
            var joinNodes = this.joinNodes;
            for (var i = 0; i < joinNodes.length; i++) {
                var j1 = joinNodes[i], j2 = joinNodes[i + 1];
                if (j1 && j2 && j1.constraint.equal(j2.constraint)) {
                    j1.merge(j2);
                    joinNodes.splice(i + 1, 1);
                }
            }
        },

        __checkEqual: function (node) {
            var constraints = this.constraints, i = constraints.length - 1;
            for (; i >= 0; i--) {
                var n = constraints[i];
                if (node.equal(n)) {
                    return  n;
                }
            }
            constraints.push(node);
            return node;
        },

        __createTypeNode: function (pattern) {
            var ret = new TypeNode(pattern.get("constraints")[0]);
            var constraints = this.typeNodes, i = constraints.length - 1;
            for (; i >= 0; i--) {
                var n = constraints[i];
                if (ret.equal(n)) {
                    return  n;
                }
            }
            constraints.push(ret);
            return ret;
        },

        __createEqualityNode: function (constraint) {
            return this.__checkEqual(new EqualityNode(constraint));
        },

        __createReferenceNode: function (constraint) {
            return this.__checkEqual(new ReferenceNode(constraint));
        },

        __createPropertyNode: function (constraint) {
            return this.__checkEqual(new PropertyNode(constraint));
        },

        __createBridgeNode: function (pattern) {
            return new BridgeNode(pattern);
        },

        __createAdapterNode: function (side) {
            return side === "left" ? new LeftAdapterNode() : new RightAdapterNode();
        },

        __createJoinNode: function (pattern, outNode, side) {
            var joinNode;
            if (pattern.rightPattern instanceof NotPattern) {
                joinNode = new NotNode();
            } else {
                joinNode = new JoinNode();
                this.joinNodes.push(joinNode);
            }
            var parentNode = joinNode;
            if (outNode instanceof JoinNode) {
                var adapterNode = this.__createAdapterNode(side);
                parentNode.addOutNode(adapterNode, pattern);
                parentNode = adapterNode;
            }
            parentNode.addOutNode(outNode, pattern);
            return joinNode;
        },

        __addToNetwork: function (pattern, outNode, side) {
            if (pattern instanceof ObjectPattern) {
                if (pattern instanceof NotPattern && (!side || side === "left")) {
                    return this.__addToNetwork(new CompositePattern(new InitialFactPattern(), pattern), outNode, side);
                }
                return this.__createAlphaNode(pattern, outNode, side);
            } else if (pattern instanceof CompositePattern) {
                var joinNode = this.__createJoinNode(pattern, outNode, side);
                this.__addToNetwork(pattern.rightPattern, joinNode, "right");
                this.__addToNetwork(pattern.leftPattern, joinNode, "left");
                outNode.addParentNode(joinNode);
                return joinNode;
            }
        },


        __createAlphaNode: function (pattern, outNode, side) {
            var constraints = pattern.get("constraints");
            var typeNode = this.__createTypeNode(pattern);
            var parentAtom = constraints[0];
            var parentNode = typeNode;
            var i = constraints.length - 1;
            for (; i > 0; i--) {
                var constraint = constraints[i], node;
                if (constraint instanceof HashConstraint) {
                    node = this.__createPropertyNode(constraint);
                } else if (constraint instanceof ReferenceConstraint) {
                    node = this.__createReferenceNode(constraint);
                    outNode.constraint.addConstraint(constraint);
                } else {
                    node = this.__createEqualityNode(constraint);
                }
                parentNode.addOutNode(node, pattern, parentAtom);
                node.parentNodes.push(parentNode);
                parentNode = node;
                parentAtom = constraint;
            }
            var bridgeNode = this.__createBridgeNode(pattern);
            parentNode.addOutNode(bridgeNode, pattern, parentAtom);
            bridgeNode.addParentNode(parentNode);
            parentNode = bridgeNode;
            outNode.addParentNode(parentNode);
            if (outNode instanceof JoinNode) {
                var adapterNode = this.__createAdapterNode(side);
                parentNode.addOutNode(adapterNode, pattern);
                parentNode = adapterNode;
            }
            parentNode.addOutNode(outNode, pattern);
            return typeNode;
        },

        print: function () {
            forEach(this.terminalNodes, function (t) {
                t.print("  ");
            });
        }
    }
}).as(exports, "RootNode");






});

require.define("/lib/matchResult.js",function(require,module,exports,__dirname,__filename,process,global){"use strict";
var extd = require("./extended"),
    declare = extd.declare,
    merge = extd.merge,
    union = extd.union,
    map = extd.map;

declare({
    instance: {
        constructor: function (assertable) {
            assertable = assertable || {};
            this.variables = [];
            this.facts = [];
            this.factHash = {};
            this.recency = [];
            this.constraints = [];
            this.isMatch = false;
            var fact = assertable.fact;
            if (fact) {
                this.facts.push(fact);
                this.recency.push(fact.recency);
            }

        },

        merge: function (mr) {
            var ret = new this._static();
            ret.isMatch = mr.isMatch;
            ret.facts = this.facts.concat(mr.facts);
            merge(ret.factHash, this.factHash, mr.factHash);
            ret.recency = union(this.recency, mr.recency);
            return ret;
        },

        getters: {

            factIds: function () {
                return map(this.facts,function (fact) {
                    return fact.id;
                }).sort();
            }
        }

    }
}).as(module);



});

require.define("/lib/pattern.js",function(require,module,exports,__dirname,__filename,process,global){(function () {
    "use strict";
    var extd = require("./extended"),
        merge = extd.merge,
        forEach = extd.forEach,
        declare = extd.declare,
        constraintMatcher = require("./constraintMatcher"),
        constraint = require("./constraint");


    var Pattern = declare({});

    var ObjectPattern = Pattern.extend({
        instance: {
            constructor: function (type, alias, conditions, store, options) {
                this.type = type;
                this.alias = alias;
                this.conditions = conditions;
                this.constraints = [new constraint.ObjectConstraint(type)];
                var constrnts = constraintMatcher.toConstraints(conditions, merge({alias: alias}, options));
                if (constrnts.length) {
                    this.constraints = this.constraints.concat(constrnts);
                } else {
                    var cnstrnt = new constraint.TrueConstraint();
                    this.constraints.push(cnstrnt);
                }
                if (store && !extd.isEmpty(store)) {
                    var atm = new constraint.HashConstraint(store);
                    this.constraints.push(atm);
                }
                forEach(this.constraints, function (constraint) {
                    constraint.set("alias", alias);
                });
            },

            hashCode: function () {
                return [this.type, this.alias, extd.format("%j", this.conditions)].join(":");
            },

            toString: function () {
                return extd.format("%j", this.constraints);
            }
        }
    }).as(exports, "ObjectPattern");

    ObjectPattern.extend().as(exports, "NotPattern");

    Pattern.extend({

        instance: {
            constructor: function (left, right) {
                this.leftPattern = left;
                this.rightPattern = right;
            },

            hashCode: function () {
                return [this.leftPattern.hashCode(), this.rightPattern.hashCode()].join(":");
            },

            getters: {
                constraints: function () {
                    return this.leftPattern.constraints.concat(this.rightPattern.constraints);
                }
            }
        }

    }).as(exports, "CompositePattern");


    var InitialFact = declare({}).as(exports, "InitialFact");

    ObjectPattern.extend({
        instance: {
            constructor: function () {
                this._super([InitialFact, "i", [], {}]);
            },

            assert: function () {
                return true;
            }
        }
    }).as(exports, "InitialFactPattern");

})();


});

require.define("/lib/constraintMatcher.js",function(require,module,exports,__dirname,__filename,process,global){"use strict";

var extd = require("./extended"),
    isArray = extd.isArray,
    forEach = extd.forEach,
    some = extd.some,
    map = extd.map,
    indexOf = extd.indexOf,
    isNumber = extd.isNumber,
    removeDups = extd.removeDuplicates,
    atoms = require("./constraint");

var definedFuncs = {
    now: function () {
        return new Date();
    },

    Date: function (y, m, d, h, min, s, ms) {
        var date = new Date();
        if (isNumber(y)) {
            date.setYear(y);
        }
        if (isNumber(m)) {
            date.setMonth(m);
        }
        if (isNumber(d)) {
            date.setDate(d);
        }
        if (isNumber(h)) {
            date.setHours(h);
        }
        if (isNumber(min)) {
            date.setMinutes(min);
        }
        if (isNumber(s)) {
            date.setSeconds(s);
        }
        if (isNumber(ms)) {
            date.setMilliseconds(ms);
        }
        return date;
    },

    lengthOf: function (arr, length) {
        return arr.length === length;
    },

    isTrue: function (val) {
        return val === true;
    },

    isFalse: function (val) {
        return val === false;
    },

    isNotNull: function (actual) {
        return actual !== null;
    },

    dateCmp: function (dt1, dt2) {
        return extd.compare(dt1, dt2);
    }

};

forEach(["years", "days", "months", "hours", "minutes", "seconds"], function (k) {
    definedFuncs[k + "FromNow"] = extd[k + "FromNow"];
    definedFuncs[k + "Ago"] = extd[k + "Ago"];
});


forEach(["isArray", "isNumber", "isHash", "isObject", "isDate", "isBoolean", "isString", "isRegExp", "isNull", "isEmpty",
    "isUndefined", "isDefined", "isUndefinedOrNull", "isPromiseLike", "isFunction", "deepEqual"], function (k) {
    var m = extd[k];
    definedFuncs[k] = function () {
        return m.apply(extd, arguments);
    };
});


var lang = {

    equal: function (c1, c2) {
        var ret = false;
        if (c1 === c2) {
            ret = true;
        } else {
            if (c1[2] === c2[2]) {
                if (indexOf(["string", "number", "boolean", "regexp", "identifier", "null"], c1[2]) !== -1) {
                    ret = c1[0] === c2[0];
                } else if (c1[2] === "unminus") {
                    ret = this.equal(c1[0], c2[0]);
                } else {
                    ret = this.equal(c1[0], c2[0]) && this.equal(c1[1], c2[1]);
                }
            }
        }
        return ret;
    },

    getIdentifiers: function (rule) {
        var ret = [];
        var rule2 = rule[2];

        if (rule2 === "identifier") {
            //its an identifier so stop
            return [rule[0]];
        } else if (rule2 === "function") {
            ret.push(rule[0]);
            ret = ret.concat(this.getIdentifiers(rule[1]));
        } else if (rule2 !== "string" &&
            rule2 !== "number" &&
            rule2 !== "boolean" &&
            rule2 !== "regexp" &&
            rule2 !== "unminus") {
            //its an expression so keep going
            if (rule2 === "prop") {
                ret = ret.concat(this.getIdentifiers(rule[0]));
                if (rule[1]) {
                    var propChain = rule[1];
                    //go through the member variables and collect any identifiers that may be in functions
                    while (isArray(propChain)) {
                        if (propChain[2] === "function") {
                            ret = ret.concat(this.getIdentifiers(propChain[1]));
                            break;
                        } else {
                            propChain = propChain[1];
                        }
                    }
                }

            } else {
                if (rule[0]) {
                    ret = ret.concat(this.getIdentifiers(rule[0]));
                }
                if (rule[1]) {
                    ret = ret.concat(this.getIdentifiers(rule[1]));
                }
            }
        }
        //remove dups and return
        return removeDups(ret);
    },

    toConstraints: function (rule, options) {
        var ret = [],
            alias = options.alias,
            scope = options.scope || {};

        var rule2 = rule[2];
        if (rule2 === "composite") {
            ret.push(new atoms.EqualityConstraint(rule[0], options));
        } else if (rule2 === "and") {
            ret = ret.concat(this.toConstraints(rule[0], options)).concat(this.toConstraints(rule[1], options));
        } else if (rule2 === "or") {
            //we probably shouldnt support this right now
            ret.push(new atoms.EqualityConstraint(rule, options));
        } else if (rule2 === "lt" ||
            rule2 === "gt" ||
            rule2 === "lte" ||
            rule2 === "gte" ||
            rule2 === "like" ||
            rule2 === "notLike" ||
            rule2 === "eq" ||
            rule2 === "neq" ||
            rule2 === "in" ||
            rule2 === "notIn" ||
            rule2 === "function") {
            if (some(this.getIdentifiers(rule), function (i) {
                return i !== alias && !(i in definedFuncs) && !(i in scope);
            })) {
                ret.push(new atoms.ReferenceConstraint(rule, options));
            } else {
                ret.push(new atoms.EqualityConstraint(rule, options));
            }
        }
        return ret;
    },


    parse: function (rule) {
        return this[rule[2]](rule[0], rule[1]);
    },

    composite: function (lhs) {
        return this.parse(lhs);
    },

    and: function (lhs, rhs) {
        return [this.parse(lhs), "&&", this.parse(rhs)].join(" ");
    },

    or: function (lhs, rhs) {
        return [this.parse(lhs), "||", this.parse(rhs)].join(" ");
    },

    prop: function (name, prop) {
        if (prop[2] === "function") {
            return [this.parse(name), this.parse(prop)].join(".");
        } else {
            return [this.parse(name), "['", this.parse(prop), "']"].join("");
        }
    },

    unminus: function (lhs) {
        return -1 * this.parse(lhs);
    },

    plus: function (lhs, rhs) {
        return [this.parse(lhs), "+", this.parse(rhs)].join(" ");
    },
    minus: function (lhs, rhs) {
        return [this.parse(lhs), "-", this.parse(rhs)].join(" ");
    },

    mult: function (lhs, rhs) {
        return [this.parse(lhs), "*", this.parse(rhs)].join(" ");
    },

    div: function (lhs, rhs) {
        return [this.parse(lhs), "/", this.parse(rhs)].join(" ");
    },

    lt: function (lhs, rhs) {
        return [this.parse(lhs), "<", this.parse(rhs)].join(" ");
    },
    gt: function (lhs, rhs) {
        return [this.parse(lhs), ">", this.parse(rhs)].join(" ");
    },
    lte: function (lhs, rhs) {
        return [this.parse(lhs), "<=", this.parse(rhs)].join(" ");
    },
    gte: function (lhs, rhs) {
        return [this.parse(lhs), ">=", this.parse(rhs)].join(" ");
    },
    like: function (lhs, rhs) {
        return [this.parse(rhs), ".test(", this.parse(lhs), ")"].join("");
    },
    notLike: function (lhs, rhs) {
        return ["!", this.parse(rhs), ".test(", this.parse(lhs), ")"].join("");
    },
    eq: function (lhs, rhs) {
        return [this.parse(lhs), "===", this.parse(rhs)].join(" ");
    },
    neq: function (lhs, rhs) {
        return [this.parse(lhs), "!==", this.parse(rhs)].join(" ");
    },

    "in": function (lhs, rhs) {
        return ["(", indexOf.toString().replace(/\/\/(.*)/ig, "").replace(/\s+/ig, " "), "(", "[", this.parse(rhs), "],", this.parse(lhs), ")) != -1"].join("");
    },

    "notIn": function (lhs, rhs) {
        return ["(", indexOf.toString().replace(/\/\/(.*)/ig, "").replace(/\s+/ig, " "), "(", "[", this.parse(rhs), "],", this.parse(lhs), ")) == -1"].join("");
    },

    "arguments": function (lhs, rhs) {
        var ret = [];
        if (lhs) {
            ret.push(this.parse(lhs));
        }
        if (rhs) {
            ret.push(this.parse(rhs));
        }
        return ret.join(",");
    },

    "array": function (lhs) {
        var args = [];
        if (lhs) {
            args = this.parse(lhs);
            if (isArray(args)) {
                return args;
            } else {
                return [args];
            }
        }
        return ["[", args.join(","), "]"].join("");
    },

    "function": function (lhs, rhs) {
        var args = this.parse(rhs);
        return [lhs, "(", args, ")"].join("");
    },

    "string": function (lhs) {
        return "'" + lhs + "'";
    },

    "number": function (lhs) {
        return lhs;
    },

    "boolean": function (lhs) {
        return lhs;
    },

    regexp: function (lhs) {
        return lhs;
    },

    identifier: function (lhs) {
        return lhs;
    },

    "null": function () {
        return "null";
    }
};


var toJs = exports.toJs = function (rule, scope) {
    var js = lang.parse(rule);
    scope = scope || {};
    var vars = lang.getIdentifiers(rule);
    return ["(function(){ return function jsMatcher(hash){", map(vars,function (v) {
        var ret = ["var ", v, " = "];
        if (definedFuncs.hasOwnProperty(v)) {
            ret.push("definedFuncs['", v, "']");
        } else if (scope.hasOwnProperty(v)) {
            ret.push("scope['", v, "']");
        } else {
            ret.push("hash['", v, "']");
        }
        ret.push(";");
        return ret.join("");
    }).join(""), " return !!(", js, ");};})()"].join("");
};

exports.getMatcher = function (rule, scope) {
    var js = toJs(rule, scope);
    return eval(js);
};

exports.toConstraints = function (constraint, options) {
    //constraint.split("&&")
    return lang.toConstraints(constraint, options);
};

exports.equal = function (c1, c2) {
    return lang.equal(c1, c2);
};

exports.getIdentifiers = function (constraint) {
    return lang.getIdentifiers(constraint);
};



});

require.define("/lib/constraint.js",function(require,module,exports,__dirname,__filename,process,global){"use strict";

var extd = require("./extended"),
    object = extd.hash,
    merge = extd.merge,
    keys = object.keys,
    forEach = extd.forEach,
    instanceOf = extd.instanceOf,
    filter = extd.filter,
    declare = extd.declare,
    constraintMatcher;

var Constraint = declare({

    instance: {
        constructor: function (type, constraint) {
            if (!constraintMatcher) {
                constraintMatcher = require("./constraintMatcher");
            }
            this.type = type;
            this.constraint = constraint;
        },
        "assert": function () {
            throw new Error("not implemented");
        },

        equal: function (constraint) {
            return instanceOf(constraint, this._static) && this.get("alias") === constraint.get("alias") && extd.deepEqual(this.constraint, constraint.constraint);
        },

        getters: {
            variables: function () {
                return [this.get("alias")];
            }
        }


    }
});

Constraint.extend({
    instance: {
        constructor: function (type) {
            this._super(["object", type]);
        },

        "assert": function (param) {
            return param instanceof this.constraint || param.constructor === this.constraint;
        },

        equal: function (constraint) {
            return instanceOf(constraint, this._static) && this.constraint === constraint.constraint;
        }
    }
}).as(exports, "ObjectConstraint");

Constraint.extend({

    instance: {
        constructor: function (constraint, options) {
            this._super(["equality", constraint]);
            options = options || {};
            this._matcher = constraintMatcher.getMatcher(constraint, options.scope || {});
        },

        "assert": function (values) {
            return this._matcher(values);
        }
    }
}).as(exports, "EqualityConstraint");

Constraint.extend({

    instance: {
        constructor: function () {
            this._super(["equality", [true]]);
        },

        equal: function (constraint) {
            return instanceOf(constraint, this._static) && this.get("alias") === constraint.get("alias");
        },


        "assert": function () {
            return true;
        }
    }
}).as(exports, "TrueConstraint");

Constraint.extend({

    instance: {
        constructor: function (constraint, options) {
            this.cache = {};
            this._super(["reference", constraint]);
            options = options || {};
            this.values = [];
            this._options = options;
            this._matcher = constraintMatcher.getMatcher(constraint, options.scope || {});
        },

        "assert": function (values) {
            return this._matcher(values);

        },

        merge: function (that, type) {
            var ret = this;
            if (that instanceof this._static) {
                ret = new this._static([this.constraint, that.constraint, "and"], merge({}, this._options, this._options));
                ret._alias = this._alias || that._alias;
                ret.vars = this.vars.concat(that.vars);
            }
            return ret;
        },

        equal: function (constraint) {
            return instanceOf(constraint, this._static) && extd.deepEqual(this.constraint, constraint.constraint);
        },


        getters: {
            variables: function () {
                return this.vars;
            },

            alias: function () {
                return this._alias;
            }
        },

        setters: {
            alias: function (alias) {
                this._alias = alias;
                this.vars = filter(constraintMatcher.getIdentifiers(this.constraint), function (v) {
                    return v !== alias;
                });
            }
        }
    }

}).as(exports, "ReferenceConstraint");


Constraint.extend({
    instance: {
        constructor: function (hash) {
            this._super(["hash", hash]);
        },

        equal: function (constraint) {
            return extd.instanceOf(constraint, this._static) && this.get("alias") === constraint.get("alias") && extd.deepEqual(this.constraint, constraint.constraint);
        },

        "assert": function () {
            return true;
        },

        getters: {
            variables: function () {
                return this.constraint;
            }
        }

    }
}).as(exports, "HashConstraint");




});

require.define("events",function(require,module,exports,__dirname,__filename,process,global){if (!process.EventEmitter) process.EventEmitter = function () {};

var EventEmitter = exports.EventEmitter = process.EventEmitter;
var isArray = typeof Array.isArray === 'function'
    ? Array.isArray
    : function (xs) {
        return Object.prototype.toString.call(xs) === '[object Array]'
    }
;
function indexOf (xs, x) {
    if (xs.indexOf) return xs.indexOf(x);
    for (var i = 0; i < xs.length; i++) {
        if (x === xs[i]) return i;
    }
    return -1;
}

// By default EventEmitters will print a warning if more than
// 10 listeners are added to it. This is a useful default which
// helps finding memory leaks.
//
// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
var defaultMaxListeners = 10;
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!this._events) this._events = {};
  this._events.maxListeners = n;
};


EventEmitter.prototype.emit = function(type) {
  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events || !this._events.error ||
        (isArray(this._events.error) && !this._events.error.length))
    {
      if (arguments[1] instanceof Error) {
        throw arguments[1]; // Unhandled 'error' event
      } else {
        throw new Error("Uncaught, unspecified 'error' event.");
      }
      return false;
    }
  }

  if (!this._events) return false;
  var handler = this._events[type];
  if (!handler) return false;

  if (typeof handler == 'function') {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        var args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
    return true;

  } else if (isArray(handler)) {
    var args = Array.prototype.slice.call(arguments, 1);

    var listeners = handler.slice();
    for (var i = 0, l = listeners.length; i < l; i++) {
      listeners[i].apply(this, args);
    }
    return true;

  } else {
    return false;
  }
};

// EventEmitter is defined in src/node_events.cc
// EventEmitter.prototype.emit() is also defined there.
EventEmitter.prototype.addListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('addListener only takes instances of Function');
  }

  if (!this._events) this._events = {};

  // To avoid recursion in the case that type == "newListeners"! Before
  // adding it to the listeners, first emit "newListeners".
  this.emit('newListener', type, listener);

  if (!this._events[type]) {
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  } else if (isArray(this._events[type])) {

    // Check for listener leak
    if (!this._events[type].warned) {
      var m;
      if (this._events.maxListeners !== undefined) {
        m = this._events.maxListeners;
      } else {
        m = defaultMaxListeners;
      }

      if (m && m > 0 && this._events[type].length > m) {
        this._events[type].warned = true;
        console.error('(node) warning: possible EventEmitter memory ' +
                      'leak detected. %d listeners added. ' +
                      'Use emitter.setMaxListeners() to increase limit.',
                      this._events[type].length);
        console.trace();
      }
    }

    // If we've already got an array, just append.
    this._events[type].push(listener);
  } else {
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  var self = this;
  self.on(type, function g() {
    self.removeListener(type, g);
    listener.apply(this, arguments);
  });

  return this;
};

EventEmitter.prototype.removeListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('removeListener only takes instances of Function');
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (!this._events || !this._events[type]) return this;

  var list = this._events[type];

  if (isArray(list)) {
    var i = indexOf(list, listener);
    if (i < 0) return this;
    list.splice(i, 1);
    if (list.length == 0)
      delete this._events[type];
  } else if (this._events[type] === listener) {
    delete this._events[type];
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  // does not use listeners(), so no side effect of creating _events[type]
  if (type && this._events && this._events[type]) this._events[type] = null;
  return this;
};

EventEmitter.prototype.listeners = function(type) {
  if (!this._events) this._events = {};
  if (!this._events[type]) this._events[type] = [];
  if (!isArray(this._events[type])) {
    this._events[type] = [this._events[type]];
  }
  return this._events[type];
};

});

require.define("/lib/rule.js",function(require,module,exports,__dirname,__filename,process,global){"use strict";
var extd = require("./extended"),
    isArray = extd.isArray,
    Promise = extd.Promise,
    when = extd.when,
    declare = extd.declare,
    parser = require("./parser"),
    pattern = require("./pattern"),
    ObjectPattern = pattern.ObjectPattern,
    NotPattern = pattern.NotPattern,
    CompositePattern = pattern.CompositePattern;


var InitialRule = declare({});

var getParamTypeSwitch = extd
    .switcher()
    .isEq("string", function () {
        return String;
    })
    .isEq("date", function () {
        return Date;
    })
    .isEq("array", function () {
        return Array;
    })
    .isEq("boolean", function () {
        return Boolean;
    })
    .isEq("regexp", function () {
        return RegExp;
    })
    .isEq("number", function () {
        return Number;
    })
    .isEq("object", function () {
        return Object;
    })
    .isEq("hash", function () {
        return Object;
    })
    .def(function (param) {
        throw new TypeError("invalid param type " + param);
    })
    .switcher();


var getParamType = extd
    .switcher()
    .isString(function (param) {
        return getParamTypeSwitch(param.toLowerCase());
    })
    .isFunction(function (func) {
        return func;
    })
    .deepEqual([], function () {
        return Array;
    })
    .def(function (param) {
        throw  new Error("invalid param type " + param);
    })
    .switcher();

var parsePattern = extd
    .switcher()
    .contains("or", function (condition) {
        condition.shift();
        return extd(condition).map(function (cond) {
            cond.scope = condition.scope;
            return parsePattern(cond);
        }).flatten().value();
    })
    .contains("not", function (condition) {
        condition.shift();
        return [
            new NotPattern(
                getParamType(condition[0]),
                condition[1] || "m",
                parser.parseConstraint(condition[2] || "true"),
                condition[3] || {},
                {scope: condition.scope}
            )
        ];
    })
    .def(function (condition) {
        return [
            new ObjectPattern(
                getParamType(condition[0]),
                condition[1] || "m",
                parser.parseConstraint(condition[2] || "true"),
                condition[3] || {},
                {scope: condition.scope}
            )
        ];
    }).switcher();


var Rule = InitialRule.extend({
    instance: {
        constructor: function (name, options, pattern, cb) {
            this.name = name;
            this.pattern = pattern;
            this.cb = cb;
            this.priority = options.priority || options.salience || 0;
        },

        fire: function (flow, match) {
            var ret = new Promise(), cb = this.cb;
            try {
                if (cb.length === 3) {
                    this.cb.call(flow, match.factHash, flow, ret.classic);
                } else {
                    when(this.cb.call(flow, match.factHash, flow)).then(ret.callback, ret.errback);
                }
            } catch (e) {
                ret.errback(e);
            }
            return ret;
        }
    }
});

function createRule(name, options, conditions, cb) {
    if (extd.isArray(options)) {
        cb = conditions;
        conditions = options;
    } else {
        options = options || {};
    }
    var isRules = extd.every(conditions, function (cond) {
        return isArray(cond);
    });
    if (isRules && conditions.length === 1) {
        conditions = conditions[0];
        isRules = false;
    }
    var rules = [];
    var scope = options.scope || {};
    conditions.scope = scope;
    if (isRules) {
        var _mergePatterns = function (patt, i) {
            if (!patterns[i]) {
                patterns[i] = i === 0 ? [] : patterns[i - 1].slice();
                //remove dup
                if (i !== 0) {
                    patterns[i].pop();
                }
                patterns[i].push(patt);
            } else {
                extd(patterns).forEach(function (p) {
                    p.push(patt);
                });
            }

        };
        var l = conditions.length, patterns = [], condition;
        for (var i = 0; i < l; i++) {
            condition = conditions[i];
            condition.scope = scope;
            extd.forEach(parsePattern(condition), _mergePatterns);

        }
        rules = extd.map(patterns, function (patterns) {
            var compPat = null;
            for (var i = 0; i < patterns.length; i++) {
                if (compPat === null) {
                    compPat = new CompositePattern(patterns[i++], patterns[i]);
                } else {
                    compPat = new CompositePattern(compPat, patterns[i]);
                }
            }
            return new Rule(name, options, compPat, cb);
        });
    } else {
        rules = extd.map(parsePattern(conditions), function (cond) {
            return new Rule(name, options, cond, cb);
        });
    }
    return rules;
}

exports.createRule = createRule;




});

require.define("/lib/parser/index.js",function(require,module,exports,__dirname,__filename,process,global){(function () {
    "use strict";
    var constraintParser = require("./constraint/parser"),
        noolParser = require("./nools/nool.parser");

    exports.parseConstraint = function (expression) {
        try {
            return constraintParser.parse(expression);
        } catch (e) {
            throw new Error("Invalid expression '" + expression + "'");
        }
    };

    exports.parseRuleSet = function (source) {
        return noolParser.parse(source);
    };
})();
});

require.define("/lib/parser/constraint/parser.js",function(require,module,exports,__dirname,__filename,process,global){/* Jison generated parser */
var parser = (function () {
    var parser = {trace: function trace() {
    },
        yy: {},
        symbols_: {"error": 2, "expressions": 3, "EXPRESSION": 4, "EOF": 5, "UNARY_EXPRESSION": 6, "LITERAL_EXPRESSION": 7, "-": 8, "MULTIPLICATIVE_EXPRESSION": 9, "*": 10, "/": 11, "ADDITIVE_EXPRESSION": 12, "+": 13, "EXPONENT_EXPRESSION": 14, "^": 15, "RELATIONAL_EXPRESSION": 16, "<": 17, ">": 18, "<=": 19, ">=": 20, "EQUALITY_EXPRESSION": 21, "==": 22, "!=": 23, "=~": 24, "!=~": 25, "IN_EXPRESSION": 26, "in": 27, "ARRAY_EXPRESSION": 28, "notIn": 29, "AND_EXPRESSION": 30, "&&": 31, "OR_EXPRESSION": 32, "||": 33, "ARGUMENT_LIST": 34, ",": 35, "FUNCTION": 36, "IDENTIFIER": 37, "(": 38, ")": 39, "OBJECT_EXPRESSION": 40, "IDENTIFIER_EXPRESSION": 41, ".": 42, "STRING_EXPRESSION": 43, "STRING": 44, "NUMBER_EXPRESSION": 45, "NUMBER": 46, "REGEXP_EXPRESSION": 47, "REGEXP": 48, "BOOLEAN_EXPRESSION": 49, "BOOLEAN": 50, "NULL_EXPRESSION": 51, "NULL": 52, "[": 53, "]": 54, "$accept": 0, "$end": 1},
        terminals_: {2: "error", 5: "EOF", 8: "-", 10: "*", 11: "/", 13: "+", 15: "^", 17: "<", 18: ">", 19: "<=", 20: ">=", 22: "==", 23: "!=", 24: "=~", 25: "!=~", 27: "in", 29: "notIn", 31: "&&", 33: "||", 35: ",", 37: "IDENTIFIER", 38: "(", 39: ")", 42: ".", 44: "STRING", 46: "NUMBER", 48: "REGEXP", 50: "BOOLEAN", 52: "NULL", 53: "[", 54: "]"},
        productions_: [0, [3, 2], [6, 1], [6, 2], [9, 1], [9, 3], [9, 3], [12, 1], [12, 3], [12, 3], [14, 1], [14, 3], [16, 1], [16, 3], [16, 3], [16, 3], [16, 3], [21, 1], [21, 3], [21, 3], [21, 3], [21, 3], [26, 1], [26, 3], [26, 3], [30, 1], [30, 3], [32, 1], [32, 3], [34, 1], [34, 3], [36, 3], [36, 4], [40, 1], [40, 3], [40, 3], [41, 1], [43, 1], [45, 1], [47, 1], [49, 1], [51, 1], [28, 2], [28, 3], [7, 1], [7, 1], [7, 1], [7, 1], [7, 1], [7, 1], [7, 1], [7, 1], [7, 3], [4, 1]],
        performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$) {

            var $0 = $$.length - 1;
            switch (yystate) {
                case 1:
                    return $$[$0 - 1];
                    break;
                case 3:
                    this.$ = [$$[$0], null, 'unminus'];
                    break;
                case 5:
                    this.$ = [$$[$0 - 2], $$[$0], 'mult'];
                    break;
                case 6:
                    this.$ = [$$[$0 - 2], $$[$0], 'div'];
                    break;
                case 8:
                    this.$ = [$$[$0 - 2], $$[$0], 'plus'];
                    break;
                case 9:
                    this.$ = [$$[$0 - 2], $$[$0], 'minus'];
                    break;
                case 11:
                    this.$ = [$$[$0 - 2], $$[$0], 'pow'];
                    break;
                case 13:
                    this.$ = [$$[$0 - 2], $$[$0], 'lt'];
                    break;
                case 14:
                    this.$ = [$$[$0 - 2], $$[$0], 'gt'];
                    break;
                case 15:
                    this.$ = [$$[$0 - 2], $$[$0], 'lte'];
                    break;
                case 16:
                    this.$ = [$$[$0 - 2], $$[$0], 'gte'];
                    break;
                case 18:
                    this.$ = [$$[$0 - 2], $$[$0], 'eq'];
                    break;
                case 19:
                    this.$ = [$$[$0 - 2], $$[$0], 'neq'];
                    break;
                case 20:
                    this.$ = [$$[$0 - 2], $$[$0], 'like'];
                    break;
                case 21:
                    this.$ = [$$[$0 - 2], $$[$0], 'notLike'];
                    break;
                case 23:
                    this.$ = [$$[$0 - 2], $$[$0], 'in'];
                    break;
                case 24:
                    this.$ = [$$[$0 - 2], $$[$0], 'notIn'];
                    break;
                case 26:
                    this.$ = [$$[$0 - 2], $$[$0], 'and'];
                    break;
                case 28:
                    this.$ = [$$[$0 - 2], $$[$0], 'or'];
                    break;
                case 30:
                    this.$ = [$$[$0 - 2], $$[$0], 'arguments']
                    break;
                case 31:
                    this.$ = [$$[$0 - 2], [null, null, 'arguments'], 'function']
                    break;
                case 32:
                    this.$ = [$$[$0 - 3], $$[$0 - 1], 'function']
                    break;
                case 34:
                    this.$ = [$$[$0 - 2], $$[$0], 'prop'];
                    break;
                case 35:
                    this.$ = [$$[$0 - 2], $$[$0], 'prop'];
                    break;
                case 36:
                    this.$ = [String(yytext), null, 'identifier'];
                    break;
                case 37:
                    this.$ = [String(yytext.replace(/^'|'$/g, '')), null, 'string'];
                    break;
                case 38:
                    this.$ = [Number(yytext), null, 'number'];
                    break;
                case 39:
                    this.$ = [RegExp(yytext.replace(/^\/|\/$/g, '')), null, 'regexp'];
                    break;
                case 40:
                    this.$ = [yytext == 'true', null, 'boolean'];
                    break;
                case 41:
                    this.$ = [null, null, 'null'];
                    break;
                case 42:
                    this.$ = [null, null, 'array'];
                    break;
                case 43:
                    this.$ = [$$[$0 - 1], null, 'array'];
                    break;
                case 52:
                    this.$ = [$$[$0 - 1], null, 'composite']
                    break;
            }
        },
        table: [
            {3: 1, 4: 2, 6: 29, 7: 7, 8: [1, 30], 9: 28, 12: 27, 14: 18, 16: 8, 21: 6, 26: 5, 28: 15, 30: 4, 32: 3, 36: 14, 37: [1, 24], 38: [1, 17], 40: 16, 41: 26, 43: 9, 44: [1, 19], 45: 10, 46: [1, 20], 47: 11, 48: [1, 21], 49: 12, 50: [1, 22], 51: 13, 52: [1, 23], 53: [1, 25]},
            {1: [3]},
            {5: [1, 31]},
            {5: [2, 53], 33: [1, 32], 39: [2, 53]},
            {5: [2, 27], 31: [1, 33], 33: [2, 27], 39: [2, 27]},
            {5: [2, 25], 31: [2, 25], 33: [2, 25], 39: [2, 25]},
            {5: [2, 22], 22: [1, 34], 23: [1, 35], 24: [1, 36], 25: [1, 37], 31: [2, 22], 33: [2, 22], 39: [2, 22]},
            {5: [2, 2], 8: [2, 2], 10: [2, 2], 11: [2, 2], 13: [2, 2], 15: [2, 2], 17: [2, 2], 18: [2, 2], 19: [2, 2], 20: [2, 2], 22: [2, 2], 23: [2, 2], 24: [2, 2], 25: [2, 2], 27: [1, 38], 29: [1, 39], 31: [2, 2], 33: [2, 2], 39: [2, 2]},
            {5: [2, 17], 17: [1, 40], 18: [1, 41], 19: [1, 42], 20: [1, 43], 22: [2, 17], 23: [2, 17], 24: [2, 17], 25: [2, 17], 31: [2, 17], 33: [2, 17], 39: [2, 17]},
            {5: [2, 44], 8: [2, 44], 10: [2, 44], 11: [2, 44], 13: [2, 44], 15: [2, 44], 17: [2, 44], 18: [2, 44], 19: [2, 44], 20: [2, 44], 22: [2, 44], 23: [2, 44], 24: [2, 44], 25: [2, 44], 27: [2, 44], 29: [2, 44], 31: [2, 44], 33: [2, 44], 35: [2, 44], 39: [2, 44], 54: [2, 44]},
            {5: [2, 45], 8: [2, 45], 10: [2, 45], 11: [2, 45], 13: [2, 45], 15: [2, 45], 17: [2, 45], 18: [2, 45], 19: [2, 45], 20: [2, 45], 22: [2, 45], 23: [2, 45], 24: [2, 45], 25: [2, 45], 27: [2, 45], 29: [2, 45], 31: [2, 45], 33: [2, 45], 35: [2, 45], 39: [2, 45], 54: [2, 45]},
            {5: [2, 46], 8: [2, 46], 10: [2, 46], 11: [2, 46], 13: [2, 46], 15: [2, 46], 17: [2, 46], 18: [2, 46], 19: [2, 46], 20: [2, 46], 22: [2, 46], 23: [2, 46], 24: [2, 46], 25: [2, 46], 27: [2, 46], 29: [2, 46], 31: [2, 46], 33: [2, 46], 35: [2, 46], 39: [2, 46], 54: [2, 46]},
            {5: [2, 47], 8: [2, 47], 10: [2, 47], 11: [2, 47], 13: [2, 47], 15: [2, 47], 17: [2, 47], 18: [2, 47], 19: [2, 47], 20: [2, 47], 22: [2, 47], 23: [2, 47], 24: [2, 47], 25: [2, 47], 27: [2, 47], 29: [2, 47], 31: [2, 47], 33: [2, 47], 35: [2, 47], 39: [2, 47], 54: [2, 47]},
            {5: [2, 48], 8: [2, 48], 10: [2, 48], 11: [2, 48], 13: [2, 48], 15: [2, 48], 17: [2, 48], 18: [2, 48], 19: [2, 48], 20: [2, 48], 22: [2, 48], 23: [2, 48], 24: [2, 48], 25: [2, 48], 27: [2, 48], 29: [2, 48], 31: [2, 48], 33: [2, 48], 35: [2, 48], 39: [2, 48], 54: [2, 48]},
            {5: [2, 49], 8: [2, 49], 10: [2, 49], 11: [2, 49], 13: [2, 49], 15: [2, 49], 17: [2, 49], 18: [2, 49], 19: [2, 49], 20: [2, 49], 22: [2, 49], 23: [2, 49], 24: [2, 49], 25: [2, 49], 27: [2, 49], 29: [2, 49], 31: [2, 49], 33: [2, 49], 35: [2, 49], 39: [2, 49], 54: [2, 49]},
            {5: [2, 50], 8: [2, 50], 10: [2, 50], 11: [2, 50], 13: [2, 50], 15: [2, 50], 17: [2, 50], 18: [2, 50], 19: [2, 50], 20: [2, 50], 22: [2, 50], 23: [2, 50], 24: [2, 50], 25: [2, 50], 27: [2, 50], 29: [2, 50], 31: [2, 50], 33: [2, 50], 35: [2, 50], 39: [2, 50], 54: [2, 50]},
            {5: [2, 51], 8: [2, 51], 10: [2, 51], 11: [2, 51], 13: [2, 51], 15: [2, 51], 17: [2, 51], 18: [2, 51], 19: [2, 51], 20: [2, 51], 22: [2, 51], 23: [2, 51], 24: [2, 51], 25: [2, 51], 27: [2, 51], 29: [2, 51], 31: [2, 51], 33: [2, 51], 35: [2, 51], 39: [2, 51], 42: [1, 44], 54: [2, 51]},
            {4: 45, 6: 29, 7: 7, 8: [1, 30], 9: 28, 12: 27, 14: 18, 16: 8, 21: 6, 26: 5, 28: 15, 30: 4, 32: 3, 36: 14, 37: [1, 24], 38: [1, 17], 40: 16, 41: 26, 43: 9, 44: [1, 19], 45: 10, 46: [1, 20], 47: 11, 48: [1, 21], 49: 12, 50: [1, 22], 51: 13, 52: [1, 23], 53: [1, 25]},
            {5: [2, 12], 15: [1, 46], 17: [2, 12], 18: [2, 12], 19: [2, 12], 20: [2, 12], 22: [2, 12], 23: [2, 12], 24: [2, 12], 25: [2, 12], 31: [2, 12], 33: [2, 12], 39: [2, 12]},
            {5: [2, 37], 8: [2, 37], 10: [2, 37], 11: [2, 37], 13: [2, 37], 15: [2, 37], 17: [2, 37], 18: [2, 37], 19: [2, 37], 20: [2, 37], 22: [2, 37], 23: [2, 37], 24: [2, 37], 25: [2, 37], 27: [2, 37], 29: [2, 37], 31: [2, 37], 33: [2, 37], 35: [2, 37], 39: [2, 37], 54: [2, 37]},
            {5: [2, 38], 8: [2, 38], 10: [2, 38], 11: [2, 38], 13: [2, 38], 15: [2, 38], 17: [2, 38], 18: [2, 38], 19: [2, 38], 20: [2, 38], 22: [2, 38], 23: [2, 38], 24: [2, 38], 25: [2, 38], 27: [2, 38], 29: [2, 38], 31: [2, 38], 33: [2, 38], 35: [2, 38], 39: [2, 38], 54: [2, 38]},
            {5: [2, 39], 8: [2, 39], 10: [2, 39], 11: [2, 39], 13: [2, 39], 15: [2, 39], 17: [2, 39], 18: [2, 39], 19: [2, 39], 20: [2, 39], 22: [2, 39], 23: [2, 39], 24: [2, 39], 25: [2, 39], 27: [2, 39], 29: [2, 39], 31: [2, 39], 33: [2, 39], 35: [2, 39], 39: [2, 39], 54: [2, 39]},
            {5: [2, 40], 8: [2, 40], 10: [2, 40], 11: [2, 40], 13: [2, 40], 15: [2, 40], 17: [2, 40], 18: [2, 40], 19: [2, 40], 20: [2, 40], 22: [2, 40], 23: [2, 40], 24: [2, 40], 25: [2, 40], 27: [2, 40], 29: [2, 40], 31: [2, 40], 33: [2, 40], 35: [2, 40], 39: [2, 40], 54: [2, 40]},
            {5: [2, 41], 8: [2, 41], 10: [2, 41], 11: [2, 41], 13: [2, 41], 15: [2, 41], 17: [2, 41], 18: [2, 41], 19: [2, 41], 20: [2, 41], 22: [2, 41], 23: [2, 41], 24: [2, 41], 25: [2, 41], 27: [2, 41], 29: [2, 41], 31: [2, 41], 33: [2, 41], 35: [2, 41], 39: [2, 41], 54: [2, 41]},
            {5: [2, 36], 8: [2, 36], 10: [2, 36], 11: [2, 36], 13: [2, 36], 15: [2, 36], 17: [2, 36], 18: [2, 36], 19: [2, 36], 20: [2, 36], 22: [2, 36], 23: [2, 36], 24: [2, 36], 25: [2, 36], 27: [2, 36], 29: [2, 36], 31: [2, 36], 33: [2, 36], 35: [2, 36], 38: [1, 47], 39: [2, 36], 42: [2, 36], 54: [2, 36]},
            {7: 50, 28: 15, 34: 49, 36: 14, 37: [1, 24], 38: [1, 17], 40: 16, 41: 26, 43: 9, 44: [1, 19], 45: 10, 46: [1, 20], 47: 11, 48: [1, 21], 49: 12, 50: [1, 22], 51: 13, 52: [1, 23], 53: [1, 25], 54: [1, 48]},
            {5: [2, 33], 8: [2, 33], 10: [2, 33], 11: [2, 33], 13: [2, 33], 15: [2, 33], 17: [2, 33], 18: [2, 33], 19: [2, 33], 20: [2, 33], 22: [2, 33], 23: [2, 33], 24: [2, 33], 25: [2, 33], 27: [2, 33], 29: [2, 33], 31: [2, 33], 33: [2, 33], 35: [2, 33], 39: [2, 33], 42: [2, 33], 54: [2, 33]},
            {5: [2, 10], 8: [1, 52], 13: [1, 51], 15: [2, 10], 17: [2, 10], 18: [2, 10], 19: [2, 10], 20: [2, 10], 22: [2, 10], 23: [2, 10], 24: [2, 10], 25: [2, 10], 31: [2, 10], 33: [2, 10], 39: [2, 10]},
            {5: [2, 7], 8: [2, 7], 10: [1, 53], 11: [1, 54], 13: [2, 7], 15: [2, 7], 17: [2, 7], 18: [2, 7], 19: [2, 7], 20: [2, 7], 22: [2, 7], 23: [2, 7], 24: [2, 7], 25: [2, 7], 31: [2, 7], 33: [2, 7], 39: [2, 7]},
            {5: [2, 4], 8: [2, 4], 10: [2, 4], 11: [2, 4], 13: [2, 4], 15: [2, 4], 17: [2, 4], 18: [2, 4], 19: [2, 4], 20: [2, 4], 22: [2, 4], 23: [2, 4], 24: [2, 4], 25: [2, 4], 31: [2, 4], 33: [2, 4], 39: [2, 4]},
            {6: 55, 7: 56, 8: [1, 30], 28: 15, 36: 14, 37: [1, 24], 38: [1, 17], 40: 16, 41: 26, 43: 9, 44: [1, 19], 45: 10, 46: [1, 20], 47: 11, 48: [1, 21], 49: 12, 50: [1, 22], 51: 13, 52: [1, 23], 53: [1, 25]},
            {1: [2, 1]},
            {6: 29, 7: 7, 8: [1, 30], 9: 28, 12: 27, 14: 18, 16: 8, 21: 6, 26: 5, 28: 15, 30: 57, 36: 14, 37: [1, 24], 38: [1, 17], 40: 16, 41: 26, 43: 9, 44: [1, 19], 45: 10, 46: [1, 20], 47: 11, 48: [1, 21], 49: 12, 50: [1, 22], 51: 13, 52: [1, 23], 53: [1, 25]},
            {6: 29, 7: 7, 8: [1, 30], 9: 28, 12: 27, 14: 18, 16: 8, 21: 6, 26: 58, 28: 15, 36: 14, 37: [1, 24], 38: [1, 17], 40: 16, 41: 26, 43: 9, 44: [1, 19], 45: 10, 46: [1, 20], 47: 11, 48: [1, 21], 49: 12, 50: [1, 22], 51: 13, 52: [1, 23], 53: [1, 25]},
            {6: 29, 7: 56, 8: [1, 30], 9: 28, 12: 27, 14: 18, 16: 59, 28: 15, 36: 14, 37: [1, 24], 38: [1, 17], 40: 16, 41: 26, 43: 9, 44: [1, 19], 45: 10, 46: [1, 20], 47: 11, 48: [1, 21], 49: 12, 50: [1, 22], 51: 13, 52: [1, 23], 53: [1, 25]},
            {6: 29, 7: 56, 8: [1, 30], 9: 28, 12: 27, 14: 18, 16: 60, 28: 15, 36: 14, 37: [1, 24], 38: [1, 17], 40: 16, 41: 26, 43: 9, 44: [1, 19], 45: 10, 46: [1, 20], 47: 11, 48: [1, 21], 49: 12, 50: [1, 22], 51: 13, 52: [1, 23], 53: [1, 25]},
            {6: 29, 7: 56, 8: [1, 30], 9: 28, 12: 27, 14: 18, 16: 61, 28: 15, 36: 14, 37: [1, 24], 38: [1, 17], 40: 16, 41: 26, 43: 9, 44: [1, 19], 45: 10, 46: [1, 20], 47: 11, 48: [1, 21], 49: 12, 50: [1, 22], 51: 13, 52: [1, 23], 53: [1, 25]},
            {6: 29, 7: 56, 8: [1, 30], 9: 28, 12: 27, 14: 18, 16: 62, 28: 15, 36: 14, 37: [1, 24], 38: [1, 17], 40: 16, 41: 26, 43: 9, 44: [1, 19], 45: 10, 46: [1, 20], 47: 11, 48: [1, 21], 49: 12, 50: [1, 22], 51: 13, 52: [1, 23], 53: [1, 25]},
            {28: 63, 53: [1, 25]},
            {28: 64, 53: [1, 25]},
            {6: 29, 7: 56, 8: [1, 30], 9: 28, 12: 27, 14: 65, 28: 15, 36: 14, 37: [1, 24], 38: [1, 17], 40: 16, 41: 26, 43: 9, 44: [1, 19], 45: 10, 46: [1, 20], 47: 11, 48: [1, 21], 49: 12, 50: [1, 22], 51: 13, 52: [1, 23], 53: [1, 25]},
            {6: 29, 7: 56, 8: [1, 30], 9: 28, 12: 27, 14: 66, 28: 15, 36: 14, 37: [1, 24], 38: [1, 17], 40: 16, 41: 26, 43: 9, 44: [1, 19], 45: 10, 46: [1, 20], 47: 11, 48: [1, 21], 49: 12, 50: [1, 22], 51: 13, 52: [1, 23], 53: [1, 25]},
            {6: 29, 7: 56, 8: [1, 30], 9: 28, 12: 27, 14: 67, 28: 15, 36: 14, 37: [1, 24], 38: [1, 17], 40: 16, 41: 26, 43: 9, 44: [1, 19], 45: 10, 46: [1, 20], 47: 11, 48: [1, 21], 49: 12, 50: [1, 22], 51: 13, 52: [1, 23], 53: [1, 25]},
            {6: 29, 7: 56, 8: [1, 30], 9: 28, 12: 27, 14: 68, 28: 15, 36: 14, 37: [1, 24], 38: [1, 17], 40: 16, 41: 26, 43: 9, 44: [1, 19], 45: 10, 46: [1, 20], 47: 11, 48: [1, 21], 49: 12, 50: [1, 22], 51: 13, 52: [1, 23], 53: [1, 25]},
            {36: 70, 37: [1, 24], 41: 69},
            {39: [1, 71]},
            {6: 29, 7: 56, 8: [1, 30], 9: 28, 12: 72, 28: 15, 36: 14, 37: [1, 24], 38: [1, 17], 40: 16, 41: 26, 43: 9, 44: [1, 19], 45: 10, 46: [1, 20], 47: 11, 48: [1, 21], 49: 12, 50: [1, 22], 51: 13, 52: [1, 23], 53: [1, 25]},
            {7: 50, 28: 15, 34: 74, 36: 14, 37: [1, 24], 38: [1, 17], 39: [1, 73], 40: 16, 41: 26, 43: 9, 44: [1, 19], 45: 10, 46: [1, 20], 47: 11, 48: [1, 21], 49: 12, 50: [1, 22], 51: 13, 52: [1, 23], 53: [1, 25]},
            {5: [2, 42], 8: [2, 42], 10: [2, 42], 11: [2, 42], 13: [2, 42], 15: [2, 42], 17: [2, 42], 18: [2, 42], 19: [2, 42], 20: [2, 42], 22: [2, 42], 23: [2, 42], 24: [2, 42], 25: [2, 42], 27: [2, 42], 29: [2, 42], 31: [2, 42], 33: [2, 42], 35: [2, 42], 39: [2, 42], 54: [2, 42]},
            {35: [1, 76], 54: [1, 75]},
            {35: [2, 29], 39: [2, 29], 54: [2, 29]},
            {6: 29, 7: 56, 8: [1, 30], 9: 77, 28: 15, 36: 14, 37: [1, 24], 38: [1, 17], 40: 16, 41: 26, 43: 9, 44: [1, 19], 45: 10, 46: [1, 20], 47: 11, 48: [1, 21], 49: 12, 50: [1, 22], 51: 13, 52: [1, 23], 53: [1, 25]},
            {6: 29, 7: 56, 8: [1, 30], 9: 78, 28: 15, 36: 14, 37: [1, 24], 38: [1, 17], 40: 16, 41: 26, 43: 9, 44: [1, 19], 45: 10, 46: [1, 20], 47: 11, 48: [1, 21], 49: 12, 50: [1, 22], 51: 13, 52: [1, 23], 53: [1, 25]},
            {6: 79, 7: 56, 8: [1, 30], 28: 15, 36: 14, 37: [1, 24], 38: [1, 17], 40: 16, 41: 26, 43: 9, 44: [1, 19], 45: 10, 46: [1, 20], 47: 11, 48: [1, 21], 49: 12, 50: [1, 22], 51: 13, 52: [1, 23], 53: [1, 25]},
            {6: 80, 7: 56, 8: [1, 30], 28: 15, 36: 14, 37: [1, 24], 38: [1, 17], 40: 16, 41: 26, 43: 9, 44: [1, 19], 45: 10, 46: [1, 20], 47: 11, 48: [1, 21], 49: 12, 50: [1, 22], 51: 13, 52: [1, 23], 53: [1, 25]},
            {5: [2, 3], 8: [2, 3], 10: [2, 3], 11: [2, 3], 13: [2, 3], 15: [2, 3], 17: [2, 3], 18: [2, 3], 19: [2, 3], 20: [2, 3], 22: [2, 3], 23: [2, 3], 24: [2, 3], 25: [2, 3], 31: [2, 3], 33: [2, 3], 39: [2, 3]},
            {5: [2, 2], 8: [2, 2], 10: [2, 2], 11: [2, 2], 13: [2, 2], 15: [2, 2], 17: [2, 2], 18: [2, 2], 19: [2, 2], 20: [2, 2], 22: [2, 2], 23: [2, 2], 24: [2, 2], 25: [2, 2], 31: [2, 2], 33: [2, 2], 39: [2, 2]},
            {5: [2, 28], 31: [1, 33], 33: [2, 28], 39: [2, 28]},
            {5: [2, 26], 31: [2, 26], 33: [2, 26], 39: [2, 26]},
            {5: [2, 18], 17: [1, 40], 18: [1, 41], 19: [1, 42], 20: [1, 43], 22: [2, 18], 23: [2, 18], 24: [2, 18], 25: [2, 18], 31: [2, 18], 33: [2, 18], 39: [2, 18]},
            {5: [2, 19], 17: [1, 40], 18: [1, 41], 19: [1, 42], 20: [1, 43], 22: [2, 19], 23: [2, 19], 24: [2, 19], 25: [2, 19], 31: [2, 19], 33: [2, 19], 39: [2, 19]},
            {5: [2, 20], 17: [1, 40], 18: [1, 41], 19: [1, 42], 20: [1, 43], 22: [2, 20], 23: [2, 20], 24: [2, 20], 25: [2, 20], 31: [2, 20], 33: [2, 20], 39: [2, 20]},
            {5: [2, 21], 17: [1, 40], 18: [1, 41], 19: [1, 42], 20: [1, 43], 22: [2, 21], 23: [2, 21], 24: [2, 21], 25: [2, 21], 31: [2, 21], 33: [2, 21], 39: [2, 21]},
            {5: [2, 23], 31: [2, 23], 33: [2, 23], 39: [2, 23]},
            {5: [2, 24], 31: [2, 24], 33: [2, 24], 39: [2, 24]},
            {5: [2, 13], 15: [1, 46], 17: [2, 13], 18: [2, 13], 19: [2, 13], 20: [2, 13], 22: [2, 13], 23: [2, 13], 24: [2, 13], 25: [2, 13], 31: [2, 13], 33: [2, 13], 39: [2, 13]},
            {5: [2, 14], 15: [1, 46], 17: [2, 14], 18: [2, 14], 19: [2, 14], 20: [2, 14], 22: [2, 14], 23: [2, 14], 24: [2, 14], 25: [2, 14], 31: [2, 14], 33: [2, 14], 39: [2, 14]},
            {5: [2, 15], 15: [1, 46], 17: [2, 15], 18: [2, 15], 19: [2, 15], 20: [2, 15], 22: [2, 15], 23: [2, 15], 24: [2, 15], 25: [2, 15], 31: [2, 15], 33: [2, 15], 39: [2, 15]},
            {5: [2, 16], 15: [1, 46], 17: [2, 16], 18: [2, 16], 19: [2, 16], 20: [2, 16], 22: [2, 16], 23: [2, 16], 24: [2, 16], 25: [2, 16], 31: [2, 16], 33: [2, 16], 39: [2, 16]},
            {5: [2, 34], 8: [2, 34], 10: [2, 34], 11: [2, 34], 13: [2, 34], 15: [2, 34], 17: [2, 34], 18: [2, 34], 19: [2, 34], 20: [2, 34], 22: [2, 34], 23: [2, 34], 24: [2, 34], 25: [2, 34], 27: [2, 34], 29: [2, 34], 31: [2, 34], 33: [2, 34], 35: [2, 34], 39: [2, 34], 42: [2, 34], 54: [2, 34]},
            {5: [2, 35], 8: [2, 35], 10: [2, 35], 11: [2, 35], 13: [2, 35], 15: [2, 35], 17: [2, 35], 18: [2, 35], 19: [2, 35], 20: [2, 35], 22: [2, 35], 23: [2, 35], 24: [2, 35], 25: [2, 35], 27: [2, 35], 29: [2, 35], 31: [2, 35], 33: [2, 35], 35: [2, 35], 39: [2, 35], 42: [2, 35], 54: [2, 35]},
            {5: [2, 52], 8: [2, 52], 10: [2, 52], 11: [2, 52], 13: [2, 52], 15: [2, 52], 17: [2, 52], 18: [2, 52], 19: [2, 52], 20: [2, 52], 22: [2, 52], 23: [2, 52], 24: [2, 52], 25: [2, 52], 27: [2, 52], 29: [2, 52], 31: [2, 52], 33: [2, 52], 35: [2, 52], 39: [2, 52], 54: [2, 52]},
            {5: [2, 11], 8: [1, 52], 13: [1, 51], 15: [2, 11], 17: [2, 11], 18: [2, 11], 19: [2, 11], 20: [2, 11], 22: [2, 11], 23: [2, 11], 24: [2, 11], 25: [2, 11], 31: [2, 11], 33: [2, 11], 39: [2, 11]},
            {5: [2, 31], 8: [2, 31], 10: [2, 31], 11: [2, 31], 13: [2, 31], 15: [2, 31], 17: [2, 31], 18: [2, 31], 19: [2, 31], 20: [2, 31], 22: [2, 31], 23: [2, 31], 24: [2, 31], 25: [2, 31], 27: [2, 31], 29: [2, 31], 31: [2, 31], 33: [2, 31], 35: [2, 31], 39: [2, 31], 42: [2, 31], 54: [2, 31]},
            {35: [1, 76], 39: [1, 81]},
            {5: [2, 43], 8: [2, 43], 10: [2, 43], 11: [2, 43], 13: [2, 43], 15: [2, 43], 17: [2, 43], 18: [2, 43], 19: [2, 43], 20: [2, 43], 22: [2, 43], 23: [2, 43], 24: [2, 43], 25: [2, 43], 27: [2, 43], 29: [2, 43], 31: [2, 43], 33: [2, 43], 35: [2, 43], 39: [2, 43], 54: [2, 43]},
            {7: 82, 28: 15, 36: 14, 37: [1, 24], 38: [1, 17], 40: 16, 41: 26, 43: 9, 44: [1, 19], 45: 10, 46: [1, 20], 47: 11, 48: [1, 21], 49: 12, 50: [1, 22], 51: 13, 52: [1, 23], 53: [1, 25]},
            {5: [2, 8], 8: [2, 8], 10: [1, 53], 11: [1, 54], 13: [2, 8], 15: [2, 8], 17: [2, 8], 18: [2, 8], 19: [2, 8], 20: [2, 8], 22: [2, 8], 23: [2, 8], 24: [2, 8], 25: [2, 8], 31: [2, 8], 33: [2, 8], 39: [2, 8]},
            {5: [2, 9], 8: [2, 9], 10: [1, 53], 11: [1, 54], 13: [2, 9], 15: [2, 9], 17: [2, 9], 18: [2, 9], 19: [2, 9], 20: [2, 9], 22: [2, 9], 23: [2, 9], 24: [2, 9], 25: [2, 9], 31: [2, 9], 33: [2, 9], 39: [2, 9]},
            {5: [2, 5], 8: [2, 5], 10: [2, 5], 11: [2, 5], 13: [2, 5], 15: [2, 5], 17: [2, 5], 18: [2, 5], 19: [2, 5], 20: [2, 5], 22: [2, 5], 23: [2, 5], 24: [2, 5], 25: [2, 5], 31: [2, 5], 33: [2, 5], 39: [2, 5]},
            {5: [2, 6], 8: [2, 6], 10: [2, 6], 11: [2, 6], 13: [2, 6], 15: [2, 6], 17: [2, 6], 18: [2, 6], 19: [2, 6], 20: [2, 6], 22: [2, 6], 23: [2, 6], 24: [2, 6], 25: [2, 6], 31: [2, 6], 33: [2, 6], 39: [2, 6]},
            {5: [2, 32], 8: [2, 32], 10: [2, 32], 11: [2, 32], 13: [2, 32], 15: [2, 32], 17: [2, 32], 18: [2, 32], 19: [2, 32], 20: [2, 32], 22: [2, 32], 23: [2, 32], 24: [2, 32], 25: [2, 32], 27: [2, 32], 29: [2, 32], 31: [2, 32], 33: [2, 32], 35: [2, 32], 39: [2, 32], 42: [2, 32], 54: [2, 32]},
            {35: [2, 30], 39: [2, 30], 54: [2, 30]}
        ],
        defaultActions: {31: [2, 1]},
        parseError: function parseError(str, hash) {
            throw new Error(str);
        },
        parse: function parse(input) {
            var self = this, stack = [0], vstack = [null], lstack = [], table = this.table, yytext = "", yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
            this.lexer.setInput(input);
            this.lexer.yy = this.yy;
            this.yy.lexer = this.lexer;
            this.yy.parser = this;
            if (typeof this.lexer.yylloc == "undefined")
                this.lexer.yylloc = {};
            var yyloc = this.lexer.yylloc;
            lstack.push(yyloc);
            var ranges = this.lexer.options && this.lexer.options.ranges;
            if (typeof this.yy.parseError === "function")
                this.parseError = this.yy.parseError;
            function popStack(n) {
                stack.length = stack.length - 2 * n;
                vstack.length = vstack.length - n;
                lstack.length = lstack.length - n;
            }

            function lex() {
                var token;
                token = self.lexer.lex() || 1;
                if (typeof token !== "number") {
                    token = self.symbols_[token] || token;
                }
                return token;
            }

            var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
            while (true) {
                state = stack[stack.length - 1];
                if (this.defaultActions[state]) {
                    action = this.defaultActions[state];
                } else {
                    if (symbol === null || typeof symbol == "undefined") {
                        symbol = lex();
                    }
                    action = table[state] && table[state][symbol];
                }
                if (typeof action === "undefined" || !action.length || !action[0]) {
                    var errStr = "";
                    if (!recovering) {
                        expected = [];
                        for (p in table[state])
                            if (this.terminals_[p] && p > 2) {
                                expected.push("'" + this.terminals_[p] + "'");
                            }
                        if (this.lexer.showPosition) {
                            errStr = "Parse error on line " + (yylineno + 1) + ":\n" + this.lexer.showPosition() + "\nExpecting " + expected.join(", ") + ", got '" + (this.terminals_[symbol] || symbol) + "'";
                        } else {
                            errStr = "Parse error on line " + (yylineno + 1) + ": Unexpected " + (symbol == 1 ? "end of input" : "'" + (this.terminals_[symbol] || symbol) + "'");
                        }
                        this.parseError(errStr, {text: this.lexer.match, token: this.terminals_[symbol] || symbol, line: this.lexer.yylineno, loc: yyloc, expected: expected});
                    }
                }
                if (action[0] instanceof Array && action.length > 1) {
                    throw new Error("Parse Error: multiple actions possible at state: " + state + ", token: " + symbol);
                }
                switch (action[0]) {
                    case 1:
                        stack.push(symbol);
                        vstack.push(this.lexer.yytext);
                        lstack.push(this.lexer.yylloc);
                        stack.push(action[1]);
                        symbol = null;
                        if (!preErrorSymbol) {
                            yyleng = this.lexer.yyleng;
                            yytext = this.lexer.yytext;
                            yylineno = this.lexer.yylineno;
                            yyloc = this.lexer.yylloc;
                            if (recovering > 0)
                                recovering--;
                        } else {
                            symbol = preErrorSymbol;
                            preErrorSymbol = null;
                        }
                        break;
                    case 2:
                        len = this.productions_[action[1]][1];
                        yyval.$ = vstack[vstack.length - len];
                        yyval._$ = {first_line: lstack[lstack.length - (len || 1)].first_line, last_line: lstack[lstack.length - 1].last_line, first_column: lstack[lstack.length - (len || 1)].first_column, last_column: lstack[lstack.length - 1].last_column};
                        if (ranges) {
                            yyval._$.range = [lstack[lstack.length - (len || 1)].range[0], lstack[lstack.length - 1].range[1]];
                        }
                        r = this.performAction.call(yyval, yytext, yyleng, yylineno, this.yy, action[1], vstack, lstack);
                        if (typeof r !== "undefined") {
                            return r;
                        }
                        if (len) {
                            stack = stack.slice(0, -1 * len * 2);
                            vstack = vstack.slice(0, -1 * len);
                            lstack = lstack.slice(0, -1 * len);
                        }
                        stack.push(this.productions_[action[1]][0]);
                        vstack.push(yyval.$);
                        lstack.push(yyval._$);
                        newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
                        stack.push(newState);
                        break;
                    case 3:
                        return true;
                }
            }
            return true;
        }
    };
    undefined
    /* Jison generated lexer */
    var lexer = (function () {
        var lexer = ({EOF: 1,
            parseError: function parseError(str, hash) {
                if (this.yy.parser) {
                    this.yy.parser.parseError(str, hash);
                } else {
                    throw new Error(str);
                }
            },
            setInput: function (input) {
                this._input = input;
                this._more = this._less = this.done = false;
                this.yylineno = this.yyleng = 0;
                this.yytext = this.matched = this.match = '';
                this.conditionStack = ['INITIAL'];
                this.yylloc = {first_line: 1, first_column: 0, last_line: 1, last_column: 0};
                if (this.options.ranges) this.yylloc.range = [0, 0];
                this.offset = 0;
                return this;
            },
            input: function () {
                var ch = this._input[0];
                this.yytext += ch;
                this.yyleng++;
                this.offset++;
                this.match += ch;
                this.matched += ch;
                var lines = ch.match(/(?:\r\n?|\n).*/g);
                if (lines) {
                    this.yylineno++;
                    this.yylloc.last_line++;
                } else {
                    this.yylloc.last_column++;
                }
                if (this.options.ranges) this.yylloc.range[1]++;

                this._input = this._input.slice(1);
                return ch;
            },
            unput: function (ch) {
                var len = ch.length;
                var lines = ch.split(/(?:\r\n?|\n)/g);

                this._input = ch + this._input;
                this.yytext = this.yytext.substr(0, this.yytext.length - len - 1);
                //this.yyleng -= len;
                this.offset -= len;
                var oldLines = this.match.split(/(?:\r\n?|\n)/g);
                this.match = this.match.substr(0, this.match.length - 1);
                this.matched = this.matched.substr(0, this.matched.length - 1);

                if (lines.length - 1) this.yylineno -= lines.length - 1;
                var r = this.yylloc.range;

                this.yylloc = {first_line: this.yylloc.first_line,
                    last_line: this.yylineno + 1,
                    first_column: this.yylloc.first_column,
                    last_column: lines ?
                        (lines.length === oldLines.length ? this.yylloc.first_column : 0) + oldLines[oldLines.length - lines.length].length - lines[0].length :
                        this.yylloc.first_column - len
                };

                if (this.options.ranges) {
                    this.yylloc.range = [r[0], r[0] + this.yyleng - len];
                }
                return this;
            },
            more: function () {
                this._more = true;
                return this;
            },
            less: function (n) {
                this.unput(this.match.slice(n));
            },
            pastInput: function () {
                var past = this.matched.substr(0, this.matched.length - this.match.length);
                return (past.length > 20 ? '...' : '') + past.substr(-20).replace(/\n/g, "");
            },
            upcomingInput: function () {
                var next = this.match;
                if (next.length < 20) {
                    next += this._input.substr(0, 20 - next.length);
                }
                return (next.substr(0, 20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
            },
            showPosition: function () {
                var pre = this.pastInput();
                var c = new Array(pre.length + 1).join("-");
                return pre + this.upcomingInput() + "\n" + c + "^";
            },
            next: function () {
                if (this.done) {
                    return this.EOF;
                }
                if (!this._input) this.done = true;

                var token,
                    match,
                    tempMatch,
                    index,
                    col,
                    lines;
                if (!this._more) {
                    this.yytext = '';
                    this.match = '';
                }
                var rules = this._currentRules();
                for (var i = 0; i < rules.length; i++) {
                    tempMatch = this._input.match(this.rules[rules[i]]);
                    if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                        match = tempMatch;
                        index = i;
                        if (!this.options.flex) break;
                    }
                }
                if (match) {
                    lines = match[0].match(/(?:\r\n?|\n).*/g);
                    if (lines) this.yylineno += lines.length;
                    this.yylloc = {first_line: this.yylloc.last_line,
                        last_line: this.yylineno + 1,
                        first_column: this.yylloc.last_column,
                        last_column: lines ? lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length : this.yylloc.last_column + match[0].length};
                    this.yytext += match[0];
                    this.match += match[0];
                    this.matches = match;
                    this.yyleng = this.yytext.length;
                    if (this.options.ranges) {
                        this.yylloc.range = [this.offset, this.offset += this.yyleng];
                    }
                    this._more = false;
                    this._input = this._input.slice(match[0].length);
                    this.matched += match[0];
                    token = this.performAction.call(this, this.yy, this, rules[index], this.conditionStack[this.conditionStack.length - 1]);
                    if (this.done && this._input) this.done = false;
                    if (token) return token;
                    else return;
                }
                if (this._input === "") {
                    return this.EOF;
                } else {
                    return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(),
                        {text: "", token: null, line: this.yylineno});
                }
            },
            lex: function lex() {
                var r = this.next();
                if (typeof r !== 'undefined') {
                    return r;
                } else {
                    return this.lex();
                }
            },
            begin: function begin(condition) {
                this.conditionStack.push(condition);
            },
            popState: function popState() {
                return this.conditionStack.pop();
            },
            _currentRules: function _currentRules() {
                return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
            },
            topState: function () {
                return this.conditionStack[this.conditionStack.length - 2];
            },
            pushState: function begin(condition) {
                this.begin(condition);
            }});
        lexer.options = {};
        lexer.performAction = function anonymous(yy, yy_, $avoiding_name_collisions, YY_START) {

            var YYSTATE = YY_START
            switch ($avoiding_name_collisions) {
                case 0:
                    return 27;
                    break;
                case 1:
                    return 29;
                    break;
                case 2:/* skip whitespace */
                    break;
                case 3:
                    return 46;
                    break;
                case 4:
                    return 52;
                    break;
                case 5:
                    return 22;
                    break;
                case 6:
                    return 23;
                    break;
                case 7:
                    return 19;
                    break;
                case 8:
                    return 17;
                    break;
                case 9:
                    return 20;
                    break;
                case 10:
                    return 18;
                    break;
                case 11:
                    return 24;
                    break;
                case 12:
                    return 25;
                    break;
                case 13:
                    return 31;
                    break;
                case 14:
                    return 33;
                    break;
                case 15:
                    return 50;
                    break;
                case 16:
                    return 44;
                    break;
                case 17:
                    return 37;
                    break;
                case 18:
                    return 48;
                    break;
                case 19:
                    return 42;
                    break;
                case 20:
                    return 10;
                    break;
                case 21:
                    return 11;
                    break;
                case 22:
                    return 35;
                    break;
                case 23:
                    return 8;
                    break;
                case 24:
                    return 24;
                    break;
                case 25:
                    return 25;
                    break;
                case 26:
                    return 22;
                    break;
                case 27:
                    return 22;
                    break;
                case 28:
                    return 23;
                    break;
                case 29:
                    return 23;
                    break;
                case 30:
                    return 19;
                    break;
                case 31:
                    return 20;
                    break;
                case 32:
                    return 18;
                    break;
                case 33:
                    return 17;
                    break;
                case 34:
                    return 31;
                    break;
                case 35:
                    return 33;
                    break;
                case 36:
                    return 13;
                    break;
                case 37:
                    return 15;
                    break;
                case 38:
                    return 38;
                    break;
                case 39:
                    return 54;
                    break;
                case 40:
                    return 53;
                    break;
                case 41:
                    return 39;
                    break;
                case 42:
                    return 5;
                    break;
            }
        };
        lexer.rules = [/^(?:\s+in\b)/, /^(?:\s+notIn\b)/, /^(?:\s+)/, /^(?:[0-9]+(?:\.[0-9]+)?\b)/, /^(?:null\b)/, /^(?:(eq|EQ))/, /^(?:(neq|NEQ))/, /^(?:(lte|LTE))/, /^(?:(lt|LT))/, /^(?:(gte|GTE))/, /^(?:(gt|GT))/, /^(?:(like|LIKE))/, /^(?:(notLike|NOT_LIKE))/, /^(?:(and|AND))/, /^(?:(or|OR))/, /^(?:(true|false))/, /^(?:'[^']*')/, /^(?:[a-zA-Z0-9]+)/, /^(?:\/(.*)\/)/, /^(?:\.)/, /^(?:\*)/, /^(?:\/)/, /^(?:,)/, /^(?:-)/, /^(?:=~)/, /^(?:!=~)/, /^(?:==)/, /^(?:===)/, /^(?:!=)/, /^(?:!==)/, /^(?:<=)/, /^(?:>=)/, /^(?:>)/, /^(?:<)/, /^(?:&&)/, /^(?:\|\|)/, /^(?:\+)/, /^(?:\^)/, /^(?:\()/, /^(?:\])/, /^(?:\[)/, /^(?:\))/, /^(?:$)/];
        lexer.conditions = {"INITIAL": {"rules": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42], "inclusive": true}};
        return lexer;
    })()
    parser.lexer = lexer;
    function Parser() {
        this.yy = {};
    }

    Parser.prototype = parser;
    parser.Parser = Parser;
    return new Parser;
})();
if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
    exports.parser = parser;
    exports.Parser = parser.Parser;
    exports.parse = function () {
        return parser.parse.apply(parser, arguments);
    }
    exports.main = function commonjsMain(args) {
        if (!args[1])
            throw new Error('Usage: ' + args[0] + ' FILE');
        var source, cwd;
        return exports.parser.parse(source);
    }

}
});

require.define("/lib/parser/nools/nool.parser.js",function(require,module,exports,__dirname,__filename,process,global){"use strict";

var tokens = require("./tokens.js"),
    extd = require("../../extended"),
    keys = extd.hash.keys,
    utils = require("./util.js");

var parse = function (src, keywords, context) {
    var orig = src;
    src = src.replace(/\/\/(.*)[\n|\r|\r\n]/g, "").replace(/\n|\r|\r\n/g, " ");

    var blockTypes = new RegExp("^(" + keys(keywords).join("|") + ")"), index;
    while (src && (index = utils.findNextTokenIndex(src)) !== -1) {
        src = src.substr(index);
        var blockType = src.match(blockTypes);
        if (blockType !== null) {
            blockType = blockType[1];
            if (blockType in keywords) {
                try {
                    src = keywords[blockType](src, context, parse).replace(/^\s*|\s*$/g, "");
                } catch (e) {
                    throw new Error("Invalid " + blockType + " definition \n" + e.message + "; \nstarting at : " + orig);
                }
            } else {
                throw new Error("Unknown token" + blockType);
            }
        } else {
            throw new Error("Error parsing " + src);
        }
    }
};

exports.parse = function (src) {
    var context = {define: [], rules: [], scope: []};
    parse(src, tokens, context);
    return context;
};


});

require.define("/lib/parser/nools/tokens.js",function(require,module,exports,__dirname,__filename,process,global){"use strict";

var utils = require("./util.js");

var isWhiteSpace = function (str) {
    return str.replace(/[\s|\n|\r|\t]/g, "").length === 0;
};


var ruleTokens = {

    salience: (function () {
        var salienceRegexp = /^(salience|priority)\s*:\s*-?(\d+)\s*[,;]?/;
        return function (src, context) {
            if (salienceRegexp.test(src)) {
                var parts = src.match(salienceRegexp),
                    priority = parseInt(parts[2], 10);
                if (!isNaN(priority)) {
                    context.options.priority = priority;
                } else {
                    throw new Error("Invalid salience/priority " + parts[2]);
                }
                return src.replace(parts[0], "");
            } else {
                throw new Error("invalid format");
            }
        };
    })(),

    priority: function () {
        return this.salience.apply(this, arguments);
    },

    when: (function () {

        var ruleRegExp = /^(\w+) *: *(\w+)(.*)/;
        var joinFunc = function (m, str) {
            return "; " + str;
        };
        var constraintRegExp = /(\{(?:["']?\w+["']?\s*:\s*["']?\w+["']? *(?:, *["']?\w+["']?\s*:\s*["']?\w+["']?)*)+\})/;
        var predicateExp = /^(\w+)\((.*)\)$/m;
        var parseRules = function (str) {
            var rules = [];
            var ruleLines = str.split(";"), l = ruleLines.length, ruleLine;
            for (var i = 0; i < l && (ruleLine = ruleLines[i].replace(/^\s*|\s*$/g, "").replace(/\n/g, "")); i++) {
                if (!isWhiteSpace(ruleLine)) {
                    var rule = [];
                    if (predicateExp.test(ruleLine)) {
                        var m = ruleLine.match(predicateExp);
                        var pred = m[1].replace(/^\s*|\s*$/g, "");
                        rule.push(pred);
                        ruleLine = m[2].replace(/^\s*|\s*$/g, "");
                        if (pred === "or") {
                            rule = rule.concat(parseRules(ruleLine.replace(/,\s*(\w+\s*:)/, joinFunc)));
                            rules.push(rule);
                            continue;
                        }

                    }
                    var parts = ruleLine.match(ruleRegExp);
                    if (parts && parts.length) {
                        rule.push(parts[2], parts[1]);
                        var constraints = parts[3].replace(/^\s*|\s*$/g, "");
                        var hashParts = constraints.match(constraintRegExp);
                        if (hashParts) {
                            var hash = hashParts[1], constraint = constraints.replace(hash, "");
                            if (constraint) {
                                rule.push(constraint.replace(/^\s*|\s*$/g, ""));
                            }
                            if (hash) {
                                rule.push(eval("(" + hash.replace(/(\w+)\s*:\s*(\w+)/g, '"$1" : "$2"') + ")"));
                            }
                        } else if (constraints && !isWhiteSpace(constraints)) {
                            rule.push(constraints);
                        }
                        rules.push(rule);
                    } else {
                        throw new Error("Invalid constraint " + ruleLine);
                    }
                }
            }
            return rules;
        };

        return function (orig, context) {
            var src = orig.replace(/^when\s*/, "").replace(/^\s*|\s*$/g, "");
            if (utils.findNextToken(src) === "{") {
                var body = utils.getTokensBetween(src, "{", "}", true).join("");
                src = src.replace(body, "");
                context.constraints = parseRules(body.replace(/^\{\s*|\}\s*$/g, ""));
                return src;
            } else {
                throw new Error("unexpected token : expected : '{' found : '" + utils.findNextToken(src) + "'");
            }
        };
    })(),

    then: (function () {
        return function (orig, context) {
            if (!context.action) {
                var src = orig.replace(/^then\s*/, "").replace(/^\s*|\s*$/g, "");
                if (utils.findNextToken(src) === "{") {
                    var body = utils.getTokensBetween(src, "{", "}", true).join("");
                    src = src.replace(body, "");
                    if (!context.action) {
                        context.action = body.replace(/^\{\s*|\}\s*$/g, "");
                    }
                    if (!isWhiteSpace(src)) {
                        throw new Error("Error parsing then block " + orig);
                    }
                    return src;
                } else {
                    throw new Error("unexpected token : expected : '{' found : '" + utils.findNextToken(src) + "'");
                }
            } else {
                throw new Error("action already defined for rule" + context.name);
            }

        };
    })()
};

module.exports = {
    "define": function (orig, context) {
        var src = orig.replace(/^define\s*/, "");
        var name = src.match(/^([a-zA-Z_$][0-9a-zA-Z_$]*)/);
        if (name) {
            src = src.replace(name[0], "").replace(/^\s*|\s*$/g, "");
            if (utils.findNextToken(src) === "{") {
                name = name[1];
                var body = utils.getTokensBetween(src, "{", "}", true).join("");
                src = src.replace(body, "");
                //should
                context.define.push({name: name, properties: "(" + body + ")"});
                return src;
            } else {
                throw new Error("unexpected token : expected : '{' found : '" + utils.findNextToken(src) + "'");
            }
        } else {
            throw new Error("missing name");
        }
    },

    "function": function (orig, context) {
        var src = orig.replace(/^function\s*/, "");
        var name = src.match(/^([a-zA-Z_$][0-9a-zA-Z_$]*)\s*/);
        if (name) {
            src = src.replace(name[0], "");
            if (utils.findNextToken(src) === "(") {
                name = name[1];
                var params = utils.getParamList(src);
                src = src.replace(params, "").replace(/^\s*|\s*$/g, "");
                if (utils.findNextToken(src) === "{") {
                    var body = utils.getTokensBetween(src, "{", "}", true).join("");
                    src = src.replace(body, "");
                    //should
                    context.scope.push({name: name, body: "function" + params + body});
                    return src;
                } else {
                    throw new Error("unexpected token : expected : '{' found : '" + utils.findNextToken(src) + "'");
                }
            } else {
                throw new Error("unexpected token : expected : '(' found : '" + utils.findNextToken(src) + "'");
            }
        } else {
            throw new Error("missing name");
        }
    },

    "rule": function (orig, context, parse) {
        var src = orig.replace(/^rule\s*/, "");
        var name = src.match(/^([a-zA-Z_$][0-9a-zA-Z_$]*)/);
        if (name) {
            src = src.replace(name[0], "").replace(/^\s*|\s*$/g, "");
            if (utils.findNextToken(src) === "{") {
                name = name[1];
                var rule = {name: name, options: {}, constraints: null, action: null};
                var body = utils.getTokensBetween(src, "{", "}", true).join("");
                src = src.replace(body, "");
                parse(body.replace(/^\{\s*|\}\s*$/g, ""), ruleTokens, rule);
                context.rules.push(rule);
                return src;
            } else {
                throw new Error("unexpected token : expected : '{' found : '" + utils.findNextToken(src) + "'");
            }
        } else {
            throw new Error("missing name");
        }

    }
};


});

require.define("/lib/parser/nools/util.js",function(require,module,exports,__dirname,__filename,process,global){(function () {
    "use strict";


    var WHITE_SPACE_REG = /[\s|\n|\r|\t]/;

    var TOKEN_INVERTS = {
        "{": "}",
        "}": "{",
        "(": ")",
        ")": "(",
        "[": "]"
    };

    var getTokensBetween = exports.getTokensBetween = function (str, start, stop, includeStartEnd) {
        var depth = 0, ret = [];
        if (!start) {
            start = TOKEN_INVERTS[stop];
            depth = 1;
        }
        if (!stop) {
            stop = TOKEN_INVERTS[start];
        }
        str = Object(str);
        var startPushing = false, token, cursor = 0, found = false;
        while ((token = str.charAt(cursor++))) {
            if (token === start) {
                depth++;
                if (!startPushing) {
                    startPushing = true;
                    if (includeStartEnd) {
                        ret.push(token);
                    }
                } else {
                    ret.push(token);
                }
            } else if (token === stop && cursor) {
                depth--;
                if (depth === 0) {
                    if (includeStartEnd) {
                        ret.push(token);
                    }
                    found = true;
                    break;
                }
                ret.push(token);
            } else if (startPushing) {
                ret.push(token);
            }
        }
        if (!found) {
            throw new Error("Unable to match " + start + " in " + str);
        }
        return ret;
    };

    exports.getParamList = function (str) {
        return  getTokensBetween(str, "(", ")", true).join("");
    };

    var findNextTokenIndex = exports.findNextTokenIndex = function (str, startIndex, endIndex) {
        startIndex = startIndex || 0;
        endIndex = endIndex || str.length;
        var ret = -1, l = str.length;
        if (!endIndex || endIndex > l) {
            endIndex = l;
        }
        for (; startIndex < endIndex; startIndex++) {
            var c = str.charAt(startIndex);
            if (!WHITE_SPACE_REG.test(c)) {
                ret = startIndex;
                break;
            }
        }
        return ret;
    };

    exports.findNextToken = function (str, startIndex, endIndex) {
        return str.charAt(findNextTokenIndex(str, startIndex, endIndex));
    };


})();
});

require.define("/lib/workingMemory.js",function(require,module,exports,__dirname,__filename,process,global){"use strict";
var declare = require("declare.js");


var id = 0;

declare({

    instance: {
        constructor: function (obj) {
            this.object = obj;
            this.recency = 0;
            this.id = id++;
        },

        equals: function (fact) {
            if (fact instanceof this._static) {
                return fact !== null && fact.object === this.object;
            } else {
                return fact !== null && fact === this.object;
            }
        },

        hashCode: function () {
            return this.id;
        }
    }

}).as(exports, "Fact");

declare({

    instance: {

        constructor: function () {
            this.recency = 0;
            this.facts = [];
        },

        dispose: function () {
            this.facts.length = 0;
        },

        assertFact: function (fact) {
            if (fact.object === null) {
                throw new Error('The fact asserted cannot be null!');
            }
            fact.recency = this.recency++;
            this.facts.push(fact);
            return fact;
        },

        modifyFact: function (fact) {
            var facts = this.facts, l = facts.length;
            for (var i = 0; i < l; i++) {
                var existingFact = facts[i];
                if (existingFact.equals(fact)) {
                    return existingFact;
                }
            }
            //if we made it here we did not find the fact
            throw new Error("the fact to modify does not exist");
        },

        retractFact: function (fact) {
            var facts = this.facts, l = facts.length;
            for (var i = 0; i < l; i++) {
                var existingFact = facts[i];
                if (existingFact.equals(fact)) {
                    this.facts.splice(i, 1);
                    return existingFact;
                }
            }
            //if we made it here we did not find the fact
            throw new Error("the fact to remove does not exist");


        }
    }

}).as(exports, "WorkingMemory");


});

require.define("/lib/compile.js",function(require,module,exports,__dirname,__filename,process,global){(function () {
    "use strict";
    var extd = require("./extended"),
        parser = require("./parser"),
        constraintMatcher = require("./constraintMatcher.js"),
        indexOf = extd.indexOf,
        forEach = extd.forEach,
        map = extd.map,
        removeDuplicates = extd.removeDuplicates,
        obj = extd.hash,
        keys = obj.keys,
        merge = extd.merge,
        isString = extd.isString,
        bind = extd.bind,
        rules = require("./rule");

    var modifiers = ["assert", "modify", "retract", "emit"];

    /**
     * @private
     * Parses an action from a rule definition
     * @param {String} action the body of the action to execute
     * @param {Array} identifiers array of identifiers collected
     * @param {Object} defined an object of defined
     * @param scope
     * @return {Object}
     */
    var parseAction = function (action, identifiers, defined, scope) {
        var declares = [];
        forEach(identifiers, function (i) {
            if (action.indexOf(i) !== -1) {
                declares.push("var " + i + "= facts." + i + ";");
            }
        });
        forEach(modifiers, function (i) {
            if (action.indexOf(i) !== -1) {
                declares.push("var " + i + "= bind(flow, flow." + i + ");");
            }
        });
        extd(defined).keys().forEach(function (i) {
            if (action.indexOf(i) !== -1) {
                declares.push("var " + i + "= defined." + i + ";");
            }
        });

        extd(scope).keys().forEach(function (i) {
            if (action.indexOf(i) !== -1) {
                declares.push("var " + i + "= scope." + i + ";");
            }
        });
        var params = ["facts", 'flow'];
        if (/next\(.*\)/.test(action)) {
            params.push("next");
        }
        action = declares.join("") + action;
        action = ["(function(){ return function _parsedAction(", params.join(","), ")", "{\n\t", action, "\n};}())"].join("");
        try {
            return eval(action);
        } catch (e) {
            throw new Error("Invalid action : " + action + "\n" + e.message);
        }
    };

    var createRuleFromObject = (function () {
        var __resolveRule = function (rule, identifiers, conditions, defined, name) {
            var condition = [], definedClass = rule[0], alias = rule[1], constraint = rule[2], refs = rule[3];
            if (extd.isHash(constraint)) {
                refs = constraint;
                constraint = null;
            }
            if (definedClass && !!(definedClass = defined[definedClass])) {
                condition.push(definedClass);
            } else {
                throw new Error("Invalid class " + rule[0] + " for rule " + name);
            }
            condition.push(alias, constraint, refs);
            conditions.push(condition);
            identifiers.push(alias);
            if (constraint) {
                forEach(constraintMatcher.getIdentifiers(parser.parseConstraint(constraint)), function (i) {
                    identifiers.push(i);
                });
            }
            if (extd.isObject(refs)) {
                for (var j in refs) {
                    var ident = refs[j];
                    if (indexOf(identifiers, ident) === -1) {
                        identifiers.push(ident);
                    }
                }
            }

        };
        return function (obj, defined, scope) {
            var name = obj.name;
            if (extd.isEmpty(obj)) {
                throw new Error("Rule is empty");
            }
            var options = obj.options || {};
            options.scope = scope;
            var constraints = obj.constraints || [], l = constraints.length;
            if (!l) {
                throw new Error("no rules defined for rule " + name);
            }
            var action = obj.action;
            if (extd.isUndefined(action)) {
                throw new Error("No action was defined for rule " + name);
            }
            var conditions = [], identifiers = [];
            for (var i = 0; i < l; i++) {
                var rule = constraints[i];
                if (rule.length) {
                    var r0 = rule[0];
                    if (r0 === "not") {
                        var temp = [];
                        rule.shift();
                        __resolveRule(rule, identifiers, temp, defined, name);
                        var cond = temp[0];
                        cond.unshift(r0);
                        conditions.push(cond);
                        continue;
                    } else if (r0 === "or") {
                        var conds = [r0];
                        rule.shift();
                        forEach(rule, function (cond) {
                            __resolveRule(cond, identifiers, conds, defined, name);
                        });
                        conditions.push(conds);
                        continue;
                    }
                    __resolveRule(rule, identifiers, conditions, defined, name);
                    identifiers = removeDuplicates(identifiers);
                }
            }
            return rules.createRule(name, options, conditions, parseAction(action, identifiers, defined, scope));
        };
    })();

    var createFunction = function (body, defined, scope, scopeNames, definedNames) {
        var declares = [];
        forEach(definedNames, function (i) {
            if (body.indexOf(i) !== -1) {
                declares.push("var " + i + "= defined." + i + ";");
            }
        });

        forEach(scopeNames, function (i) {
            if (body.indexOf(i) !== -1) {
                declares.push("var " + i + "= scope." + i + ";");
            }
        });
        body = ["((function(){", declares.join(""), "\n\treturn ", body, "\n})())"].join("");
        try {
            return eval(body);
        } catch (e) {
            throw new Error("Invalid action : " + body + "\n" + e.message);
        }
    };

    var createDefined = (function () {

        var _createDefined = function (options) {
            options = isString(options) ? eval("(function(){ return " + options + "}())") : options;
            var ret = options.hasOwnProperty("constructor") && "function" === typeof options.constructor ? options.constructor : function (opts) {
                opts = opts || {};
                for (var i in opts) {
                    if (i in options) {
                        this[i] = opts[i];
                    }
                }
            };
            var proto = ret.prototype;
            for (var i in options) {
                proto[i] = options[i];
            }
            return ret;

        };

        return function (options, flow) {
            return flow.addDefined(options.name, _createDefined(options.properties));
        };
    })();

    exports.parse = function (src) {
        //parse flow from file
        return parser.parseRuleSet(src);

    };

    exports.compile = function (flowObj, options, cb, Container) {
        if (extd.isFunction(options)) {
            cb = options;
            options = {};
        } else {
            options = options || {};
            cb = null;
        }
        var name = flowObj.name || options.name;
        //if !name throw an error
        if (!name) {
            throw new Error("Name must be present in JSON or options");
        }
        var flow = new Container(name);
        var defined = merge({Array: Array, String: String, Number: Number, Boolean: Boolean, RegExp: RegExp}, options.define || {});
        if (typeof Buffer !== "undefined") {
            defined.Buffer = Buffer;
        }
        var scope = merge({}, options.scope);
        forEach(flowObj.define, function (d) {
            defined[d.name] = createDefined(d, flow);
        });
        var scopeNames = extd(flowObj.scope).pluck("name").union(extd(scope).keys()).value();
        var definedNames = map(keys(defined), function (s) {
            return s;
        });
        forEach(flowObj.scope, function (s) {
            scope[s.name] = createFunction(s.body, defined, scope, scopeNames, definedNames);
        });
        var rules = flowObj.rules;
        if (rules.length) {
            forEach(rules, function (rule) {
                flow.__rules = flow.__rules.concat(createRuleFromObject(rule, defined, scope));
            });
        }
        if (cb) {
            cb.call(flow, flow);
        }
        return flow;
    };


})();
});

require.define("/browser/nools.js",function(require,module,exports,__dirname,__filename,process,global){(function () {
    "use strict";
    var nools = require("../");

    if ("function" === typeof this.define && this.define.amd) {
        define([], function () {
            return nools;
        });
    } else {
        this.nools = nools;
    }
}).call(window);

});
require("/browser/nools.js");

})();
