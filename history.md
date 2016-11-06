# 0.4.4

* Fix focusing an agenda-group without rules [#158](https://github.com/C2FO/nools/issues/158)
* Fix bump uglify version for security purpose [#196](https://github.com/C2FO/nools/issues/196)
* Fix callback compile [#127](https://github.com/C2FO/nools/issues/127)

# 0.4.3 => 0.4.2

# 0.4.2

* Fix import nools files under Windows [#192](https://github.com/C2FO/nools/issues/192)
* Fix memory leak [#156](https://github.com/C2FO/nools/issues/156)
* Fix compile callback not called when options provided [#127](https://github.com/C2FO/nools/issues/127)
* Fix parsing error with a constraint value set to null or boolean [#157](https://github.com/C2FO/nools/issues/157)

# 0.4.1

* Fixed issue with `CustomConstraint` not binding `this.assert` to `this`. [#146](https://github.com/C2FO/nools/pull/146) - [@raymondfeng](https://github.com/raymondfeng)
* Added more tests for custom constraints
* Updated readme to include docs about custom constraints.

# 0.4.0

* Fix for issue [#122](https://github.com/C2FO/nools/issues/122) referencing defined class within another defined class
   * Also fixes accessing scoped functions within a defined class.
* Fix for issue [#119](https://github.com/C2FO/nools/issues/119) window was removed from the nools.js file now it is called in the current scope of `this`.
* Allow session.halt even for `match()` [#143](https://github.com/C2FO/nools/pull/143) - [@raymondfeng](https://github.com/raymondfeng)
   * Now if you call `halt()` even if you did not call `matchUntilHalt()`
* Now you can use a function as a constraint (Only applies to rules defined programatically) [#142](https://github.com/C2FO/nools/pull/142) - [@raymondfeng](https://github.com/raymondfeng)
* You can now define types using scope [#142](https://github.com/C2FO/nools/pull/142) - [@raymondfeng](https://github.com/raymondfeng)
* Fix for issue, is the dsl you do not have to escape `\` characters [#123](https://github.com/C2FO/nools/issues/123)


# 0.3.0

* Added new `===` and `!==` operators [#110](https://github.com/C2FO/nools/issues/110)
* Fix for issue [#109](https://github.com/C2FO/nools/issues/109)
* Updated Readme
    * Updated agenda groups examples for [#105](https://github.com/C2FO/nools/issues/105)
    * Changed class names not to match property names in readme [#99](https://github.com/C2FO/nools/issues/99)

# 0.2.3

* Added new `getFacts` method to allow for querying of facts currently in session. [#52](https://github.com/C2FO/nools/issues/52);
* Added indexing on comparison operators (i.e. `>, <, >=, <=`).
* Updated documentation.
   * Added new section about retrieving facts from a session.
   * Created new section for async actions to address [#94](https://github.com/C2FO/nools/issues/94)


# 0.2.2

* Performance Upgrades
  * Added BetaNode indexing
  * Abstracted out JoinNode to extend BetaNode (Prevents the checking of constraints if there are not any constraints to check)
  * Refactored BetaNetwork
  * Created a new Memory Class to encapusulate left and right memory for BetaNodes
* Added new `exists` logic operator to check for existence of fact (opposite of `not`)

# 0.2.1

* Added support for js expression in the `from` node addressing issue [#86](https://github.com/C2FO/nools/issues/86)
* Enhanced `JoinReferenceNode` performance in the default assert case where there are no `references` to left or right context.
* Added ability to use `or` and `not` in tandem to check for the non-existence of multiple facts. [#85](https://github.com/C2FO/nools/issues/85)
* Fixed issue with `from` node where an undefined property would be tested. [#89](https://github.com/C2FO/nools/issues/89)
* You can now define a custom resolution strategy.
* Compiling nools files now supports the from modifier.
* Documentation updates
   * Updates about from node support with js values.
   * New documentation about using `or` and `not` constratints together.
   * Updated `or` documentation to include a three constraint example.


# 0.2.0 / 2013-10-14

* Nools now supports true modify!!!
   * This is a major leap forward for `nools` opening the door for more complex actions and expressions in the rules.
* Added support from for `from` conditions in the `rhs`.
* Fixed issue [#81](https://github.com/C2FO/nools/issues/81).
* Fixed issue [#82](https://github.com/C2FO/nools/issues/82).
* Added new `sudoku` web example.
* Added [Send More Money](http://en.wikipedia.org/wiki/Verbal_arithmetic) benchmark see [#78](https://github.com/C2FO/nools/issues/78).


# 0.1.14
* Fixed issue with async actions and early match termination.


# 0.1.13
* Fixed issue [#68](https://github.com/C2FO/nools/issues/68) where `matchUntilHalt` uses a lot of CPU
* Fixed issue [#45](https://github.com/C2FO/nools/issues/45), now compiled rules support `or` constraint with more than 2 inner constraints.
* Added new feature to address [#76](https://github.com/C2FO/nools/issues/76), now you can use `deleteFlows` to dispose all flows, or use `hasFlow` to check if a flow is already registred with `nools`.

# 0.1.12
* Fixed issue in node v0.6 where path.sep is not found.

# 0.1.11
* Fixed issue [#73](https://github.com/C2FO/nools/issues/73) where requires in dsl would treat a file with a `.` character as a path instead of a module.

# 0.1.10

* Added ability to `import` other nools files to create composible rules files [#58](https://github.com/C2FO/nools/issues/58)
* When using `global` to require other files you can now require other files relative to the nools file
* Added uglify-js as a dependency instead of devDependency
* Fixed issue [#61](https://github.com/C2FO/nools/issues/61) where transpile would not properly escape `"` character.
* Fixed issue [#66](https://github.com/C2FO/nools/issues/66) and [#67](https://github.com/C2FO/nools/issues/67) where regular expression matching was too greedy.
* Fixed issue [#62](https://github.com/C2FO/nools/issues/62) where constraints with a `"` character would produce invalid javascript when `transpiling`.
* Fixed issue [#69](https://github.com/C2FO/nools/issues/69) where rules names with a `'` character in a rule would produce invalid javascript when `transpiling`.
* Added option to beautify generated code

# 0.1.9

* Fixed issues where notNode was not retracting all contexts when a fact was retracted
* Fixed issue [50](https://github.com/C2FO/nools/issues/50) in compiling rule with or condition
* Fixed issue [53](https://github.com/C2FO/nools/issues/53) in constraints with hash refrences.
* Merged pull request [49](https://github.com/C2FO/nools/pull/49)
* Added tests for logicalNot and truthy statements

# 0.1.8 / 2013-08-14

* Fixed scoping issue where scoped variables defined in compile were not available to defined classes or functions.

# 0.1.7 / 2013-06-25

* Fixed constraint parser to not evaluate functions that have the same name as operators as operators.
* Fixed the `getMatcher` to properly return an equality expression for constraints that do not have an explicit equality
* Added new diganosis example
* Changed Fibonacci example to support larger number

# v0.1.6 / 2012-06-17

* Fixed issue with the use of next in async actions

# v0.1.5 / 2013-06-17

* More Examples
* Changed nools compile to transpile to Javascript!
* Better performance
  * Simple Benchmark: Before ~600ms, Now ~350ms
  * Manners Benchmark (32): Before ~10s, Now ~4sec
  * WaltzDB: Before ~30sec, Now ~15sec

# v0.1.4 / 2013-05-25

* Added new agenda-group (#29)
* More documentation
  * Salience
  * Agenda Groups
  * Auto-focus
  * Scope
* Cleaned up agenda and made more modular

# v0.1.3 / 2013-05-24

* Fixed memory leak with FactHashes for the agendas

# v0.1.2 / 2013-05-24

* Removed unneeded calls to `.then` to address performance degredation (#30)

# v0.1.1 / 2013-05-23

* Updated grunt
* Fixed nextTick issues for node v0.10 #32
* Added ability to remove a defined flow from nools. #31 #22
* Added ability to use `getDefined` on externally defined fact types. #23
* Added support for block comments in dsl. #27 @xmltechgeek
* New globals feature in dsl. #26 @xmltechgeek
* Fixed all jshint issues
* Rebuilt nools.js and nools.min.js
* Added more tests for new globals feature

# 0.1.0 / 2013-02-27

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

# 0.0.5 / 2012-09-10
* Fix for issue [#13](https://github.com/C2FO/nools/issues/13) where identifiers were not gathered in property chains that contained functions.

# 0.0.4 / 2012-09-10
* Added travis CI

# 0.0.3 / 2012-09-06
* Updates for repo rename
* code clean up


# 0.0.2 / 2012-05-22
* Increased performance
  * Manners benchmark 800%
* Added Parser for nools DSL
* More helper functions
* Updated readme

