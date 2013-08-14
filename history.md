#0.1.7 / 2013-06-25

* Fixed constraint parser to not evaluate functions that have the same name as operators as operators.
* Fixed the `getMatcher` to properly return an equality expression for constraints that do not have an explicit equality
* Added new diganosis example
* Changed Fibonacci example to support larger number

#v0.1.6 / 2012-06-17

* Fixed issue with the use of next in async actions

#v0.1.5 / 2013-06-17

* More Examples
* Changed nools compile to transpile to Javascript!
* Better performance
  * Simple Benchmark: Before ~600ms, Now ~350ms
  * Manners Benchmark (32): Before ~10s, Now ~4sec
  * WaltzDB: Before ~30sec, Now ~15sec

#v0.1.4 / 2013-05-25

* Added new agenda-group (#29)
* More documentation
  * Salience
  * Agenda Groups
  * Auto-focus
  * Scope
* Cleaned up agenda and made more modular

#v0.1.3 / 2013-05-24

* Fixed memory leak with FactHashes for the agendas

#v0.1.2 / 2013-05-24

* Removed unneeded calls to `.then` to address performance degredation (#30)

#v0.1.1 / 2013-05-23

* Updated grunt
* Fixed nextTick issues for node v0.10 #32
* Added ability to remove a defined flow from nools. #31 #22
* Added ability to use `getDefined` on externally defined fact types. #23
* Added support for block comments in dsl. #27 @xmltechgeek
* New globals feature in dsl. #26 @xmltechgeek
* Fixed all jshint issues
* Rebuilt nools.js and nools.min.js
* Added more tests for new globals feature

#0.1.0 / 2013-02-27

* Browser support!
* Support for compiling nools dsl from string source or path
* New reactive mode when running a flow
* Support for emitting custom events from rule actions
* Can now include `$` in your constraint variables
* Added support for `%`, `!=~`, `notIn`, and `notLike` in constraints
* Increased performance
  * Waltdb Bench (Before ~60000ms, Now ~25000ms)
  * Manners (Before ~2000ms, Now ~500ms)
* Better error reporting if action has reference error
* Better fact retraction in not and join nodes
* You can now use properties from object in `in` expressions.
* Refactoring of node types into seperate files
* Support for specifying a `scope` when compiling which can be used to expose methods and objects to be used in constraints and actions.
* More Examples (requirejs, browser, conways game of life)
* More tests and better coverage on or and not nodes.

#0.0.5 / 2012-09-10
* Fix for issue [#13](https://github.com/C2FO/nools/issues/13) where identifiers were not gathered in property chains that contained functions.

#0.0.4 / 2012-09-10
* Added travis CI

#0.0.3 / 2012-09-06
* Updates for repo rename
* code clean up


#0.0.2 / 2012-05-22
* Increased performance
  * Manners benchmark 800%
* Added Parser for nools DSL
* More helper functions
* Updated readme

