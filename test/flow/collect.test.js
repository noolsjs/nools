"use strict";
var it = require("it"),
    assert = require("assert"),
    nools = require("../../");

//
function Customer(name) {
	this.name = name;
	this.items = [];
}
Customer.prototype = {
		add: function(order) {
			this.items.push(order);
		}
		,getOrder: function(name) {      
				var item;
				this.items.some(function(order) { if( order.type === name )  {item = order; return true;} });
				return item;
		}
}
//
function Item(type, price) {
	this.type = type;
	this.price = price;
}
//
var rule1Called = 0;
var rule2Called = 0;
var rule3Called = 0;

it.describe("collect condition", function (it) {

    it.describe("basic test of collection element", function (it) {

		var flow = nools.flow("collect test 1",function (flow) {
			flow.addDefined('Customer', Customer);
			flow.addDefined('Item', Item);
			flow.rule("rule 1" , {salience: 10,  scope: { Customer: Customer, Item: Item }}, [
				[Customer, 'c']
				,[Array, 'list', 'list.size === c.items.size', 'from collect( item : Item item.price > 10 from c.items )']
			], function(facts) {
				rule1Called++;
			});
		});
		//
		it.should("rhs for collection called a single time and set avaialable in lhs", function () {
			var session		= flow.getSession();
			//
			var customer    = new Customer('John');
			var stroller	= new Item('stroller',	50);
			var bike		= new Item('bike',		11);
			var car			= new Item('car',		2500);
			session.assert(stroller);session.assert(bike);session.assert(car);
			customer.add(stroller);customer.add(bike);customer.add(car);
			session.assert(customer);  
			//
			return session.match().then(function () {
				assert.equal(rule1Called, 1);
			});
		});
		
		//
		var flow = nools.flow("collect test 2",function (flow) {
			flow.addDefined('Customer', Customer);
			flow.addDefined('Item', Item);
			flow.rule("rule 1" , {salience: 10,  scope: { Customer: Customer, Item: Item }}, [
				[Customer, 'c']
				,[Array, 'list', 'list.size === c.items.size', 'from collect( item : Item item.price > 10 from c.items)']
			], function(facts) {
				rule1Called++;
			});
			flow.rule("rule 2", {salience: 5,  noLoop: true, scope: { Customer: Customer, Item: Item }}, [
				[Item, 'item', "item.type == 'bike' && item.price !== 11"]
			], function (facts) {
				rule2Called++;
				facts.item.price = 11;
				this.modify(facts.item);
			});
		});
		//
		it.should("use set in from expression with modified fact causing rhs to fire once", function () {
			var session		= flow.getSession();
			//
			var customer    = new Customer('John');
			var stroller	= new Item('stroller',	50);
			var bike		= new Item('bike',		9);
			var car			= new Item('car',		2500);
			session.assert(stroller);session.assert(bike);session.assert(car);
			customer.add(stroller);customer.add(bike);customer.add(car);
			session.assert(customer);  
			//
			rule1Called = rule2Called = 0;
			//
			return session.match().then(function () {
				assert.equal(rule1Called, 1);
				assert.equal(rule2Called, 1);
			});
		});
		
	});
	
	it.describe("basic test of collect using DSL", function (it) {
		var defines = { Customer: Customer, Item: Item },
			flow = nools.compile(__dirname + '/collect.nools', { name: 'TestCollect', defines: defines} ),
			rule1Called = 0;
		it.should("alarm example initial states cause rule fire", function () {
			//
			var System      = flow.getDefined('System'),
				Alarm		= flow.getDefined('Alarm'),
				session		= flow.getSession(),
				system, alarmA, alarmB, alarmC;
			//
			session.on("system-alarms", function (system, alarms) {
				rule1Called++;
				assert.equal(alarms.length, 3);
				assert.equal(system.location, 'kitchen');
				assert.deepEqual(alarms[0], alarmA);
				assert.deepEqual(alarms[1], alarmB);				
				assert.deepEqual(alarms[2], alarmC);				
			});
			//
			system		= new System('kitchen');
			session.assert(system);

			alarmA		= new Alarm(system, 'pending', 'door');		// create three alarms for the System
			alarmB		= new Alarm(system, 'pending', 'fire');
			alarmC		= new Alarm(system, 'pending', 'window');
			//
			session.assert(alarmA);
			session.assert(alarmB);
			session.assert(alarmC);			
			//
			return session.match().then(function () {
				assert.equal(rule1Called, 1);				
			});
		});
		it.should("modified alarm example alarm causes rule fire", function () {
			//
			var System      = flow.getDefined('System'),
				Alarm		= flow.getDefined('Alarm'),
				session		= flow.getSession(),
				system, alarmA, alarmB, alarmC;

			rule1Called = 0;
			rule2Called = 0;
			rule3Called = 0;
			//
			session.on("system-alarms", function (system, alarms) {
				rule1Called++;
				assert.equal(alarms.length, 3);
				assert.equal(system.location, 'kitchen');
				assert.deepEqual(alarms[0], alarmA);
				assert.deepEqual(alarms[1], alarmB);				
				assert.deepEqual(alarms[2], alarmC);				
			});
			//
			session.on("system-emergency", function (system, alarms) {
				rule2Called++;
				assert.equal(alarms.length, 3);
				assert.equal(system.status, 'alarms-pending');
			});
			//
			session.on("emergency-response", function (emergency) {
				rule3Called++;
				assert.equal(emergency.alarms.length, 3);
				assert.deepEqual(emergency.system, system);
			});


			//
			system		= new System('kitchen');
			session.assert(system);

			alarmA		= new Alarm(system, 'pending', 'door');		// create three alarms for the System
			alarmB		= new Alarm(system, 'pending', 'fire');
			alarmC		= new Alarm(system, 'normal', 'window');
			//
			session.assert(alarmA);
			session.assert(alarmB);
			session.assert(alarmC);		
			//
			return session.match().then(function () {
				assert.equal(rule1Called, 0);
				alarmC.status = 'pending';
				session.modify(alarmC);
				return session.match().then(function() {
					assert.equal(rule1Called, 1);
				});
			});
		});

		//
		it.should("rhs for collection called a single time and set avaialable in lhs", function () {
			var session		= flow.getSession();
			var rule1Called = 0;
			//
			session.on("test-collect", function (customer, items) {
				rule1Called++;
				assert.equal(items.length, 3);
				assert(customer);
			});

			//
			var customer    = new Customer('John');
			var stroller	= new Item('stroller',	50);
			var bike		= new Item('bike',		11);
			var car			= new Item('car',		2500);
			session.assert(stroller);session.assert(bike);session.assert(car);
			customer.add(stroller);customer.add(bike);customer.add(car);
			session.assert(customer);  
			//
			return session.match().then(function () {
				assert.equal(rule1Called, 1);
			});
		});
	});
});
