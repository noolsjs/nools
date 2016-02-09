"use strict";
var it = require("it"),
    assert = require("assert"),
    nools = require("../../");

it.describe("query", function (it) {

	var Message = function (message) {
		this.text = message;
		this.length = this.text ? this.text.length : 0;
	};
 it.describe("basic test of query", function (it) {
	//
	var options = {
			arguments: {
				maxLen: Number
				,filter: RegExp
			}
			,scope: {
				Message: Message
			}
		};
		//
		var rule1Called = 0, listLen = 0, msg;
		var flow = nools.flow("query test 1",function (flow) {
			//
			flow.query('MsgFilter', options, [
				[Message, 'm', "m.text.length < maxLen && m.text =~ filter"]
			]);
			//
			flow.rule('test', [
				[Number, '$maxLen'],
				[RegExp, '$filter'],
				[Array,   'list', 'from MsgFilter($maxLen, $filter)']
			],function(facts) {
				rule1Called++;
				listLen = facts.list.length;
				msg = facts.list[0];
			});
		});
		//
		it.should("rule using query called once and list avaialable in lhs", function () {
			var session		= flow.getSession()
				,maxLen = 14;
			//
			rule1Called = 0;
			 listLen = 0;
			 msg = null;
			//
			session.assert( new Message('hello world'));
			session.assert( new Message('this message is too long'));
			session.assert( new Message('bad message') );


			session.assert( maxLen );
			session.assert( new RegExp(/world/i));
			//
			return session.match().then(function () {
				assert.equal(rule1Called, 1);
				assert.equal(listLen, 1);
				assert.equal(msg.text, 'hello world');
			});
		});
		//
		it.should("be called manually from session", function () {
			rule1Called = 0;
			//
			var session		= flow.getSession();
			session.assert( new Message('hello world'));
			session.assert( new Message('this message is too long'));
			session.assert( new Message('bad message') );
			//
			// call the query manually
			var list = session.getQuery('MsgFilter')(14, /hello/i);
			assert.equal(list.length, 1);
			assert.equal(list[0].text, 'hello world');
		});		
	});
	it.describe("basic test of query using DSL", function (it) {
		//
		var flow = nools.compile(__dirname + '/query.nools', { name: 'TestQuery', define: {Message: Message} } )
			,maxLen = 14
			,filter = new RegExp(/world/i) 
			,Message = flow.getDefined('Message')
			,Person = flow.getDefined('Person');
		//
		it.should("call rule once and query list avaialable in lhs", function () {
			var rule1Called = 0
				,session = flow.getSession()
				,msg, listLen;
			//
			session.on("query-message", function (list) {
				rule1Called++;
				listLen = list.length;
				msg		= list[0];
            });
			//
			session.assert( new Message('hello world') );
			session.assert( new Message('this message is too long') );
			session.assert( new Message('bad message') );
			//
			session.assert( maxLen );
			session.assert( filter );
			//
			return session.match().then(function () {
				assert.equal(rule1Called, 1);
				assert.equal(listLen, 1);
				assert.equal(msg.text, 'hello world');
			});
		});
		//
		it.should("call query with mixed arguments", function () {
			var rule1Called = 0
				,session = flow.getSession()
				,msg, listLen;
			//
			session.on("query-message-mixed", function (list) {
				rule1Called++;
				listLen = list.length;
				msg		= list[0];
            });
			//
			var	Message = flow.getDefined('Message');
			//
			session.assert( new Message('hello world') );
			session.assert( new Message('this message is too long') );
			session.assert( new Message('bad message') );

			session.assert( filter );		// the other fact is a literal in the nools file
			//
			return session.match().then(function () {
				assert.equal(rule1Called, 1);
				assert.equal(listLen, 1);
				assert.equal(msg.text, 'hello world');
			});
		});
		//
		it.should("call query with no arguments", function () {
			var rule1Called = 0
				,session = flow.getSession()
				,person, listLen;
			//
			session.on("query-person-no-params", function (list) {
				rule1Called++;
				listLen = list.length;
				person  = list[0];
            });
			//
			session.assert( new Person(45, 'office'));
			session.assert( new Person(25, 'kitchen'));
			//
			return session.match().then(function () {
				assert.equal(rule1Called, 1);
				assert.equal(listLen, 1);
				assert.equal(person.age, 45);
			});
		});
		//
		it.should("call query with literal argument", function () {
			var rule1Called = 0
				,session = flow.getSession()
				,person, listLen;
			//
			session.on("query-person-literal-param", function (list) {
				rule1Called++;
				listLen = list.length;
				person  = list[0];
            });
			//
			session.assert( new Person(45, 'office'));
			session.assert( new Person(25, 'kitchen'));
			session.assert(40);
			//
			return session.match().then(function () {
				assert.equal(rule1Called, 1);
				assert.equal(listLen, 1);
				assert.equal(person.age, 45);
			});
		});
		//
		it.should("call the same query from multiple rules", function () {
			var rule1Called = 0
				,session = flow.getSession()
				,age = 40
				,person, listLen;
			//
			session.on("rule-calling-same-query", function (list) {
				rule1Called++;
				listLen = list.length;
				person  = list[0];
			});

			//
			session.assert( new Person(45, 'office'));
			session.assert( new Person(25, 'kitchen'));
			//
			session.assert(age);
			//
			return session.match().then(function () {
				assert.equal(rule1Called, 1);
				assert.equal(listLen, 1);
				assert.equal(person.age, 45);
			});
		});
	});
});
