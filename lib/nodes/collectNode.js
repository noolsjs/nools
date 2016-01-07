var extd = require("../extended");
var FromNode = require("./fromNode");
var Context  = require('../context.js');
var Match	= require('../match.js');
var extdObj = require("object-extended");

var DEFAULT_MATCH = {
    isMatch: function () {
        return false;
    }
};

/**
*/
FromNode.extend({
    instance: {
        nodeType: "CollectNode",
        //
        constructor: function (pattern, wm) {
            this._super([pattern, wm]);
            this.setAliases			= pattern.setOrientedAliases;
			this.collectionHash		= {};
			this.isCollectionObject	= this.type({}) ? true : false
			this.fnCollectionSrc	= pattern.fnCollectionSrc;
        },

        __createMatches: function (lc) {
            var me = this
                ,fc					= me.getFilteredContext(lc)
				,rc					= me.collectionHash[fc.hashCode]
				,lcFh				= lc.factHash
				,verb				= 'assert'
				,createdContext, collection, collFact, match, setHash;
			//
			if(!rc) {
				// either an array [obj, obj,...] or { key: [], key2: [] }	
				if( me.fnCollectionSrc ) {
					collFact = me.fnCollectionSrc(me.workingMemory);
					collection = collFact.object;
				}
				else {
					collection	= me.isCollectionObject ? {} : [];	
					collFact	= me.workingMemory.getFactHandle(collection);
				}					
				rc			= new Context(collFact, null, null);				
				rc.set(me.alias, collection);
				rc.match	= fc.match.merge(rc.match);				// the match doesn't change    
				rc.hashCode = rc.match.hashCode;
				//
				me.collectionHash[fc.hashCode] = rc;
				//
				var fm = this.fromMemory[collFact.id];				// some bookeeping for modify / retract, revisit, not sure we need this			
				if (!fm) {
					fm = this.fromMemory[collFact.id] = {};
				}
			}
			else {
				verb		= 'modify'
				collection	= rc.fact.object;
			}
			//
			// build up the collection, the simplest case an array that accumulates a single var
			me.setAliases.forEach( function(alias, i) {
				var lcValue = lcFh[alias], idx;
				//
				if( me.isCollectionObject ) {							// { key1: [values], key2: [values], ... }
					collection[alias] = collection[alias] || [];
					idx = extd.findIndex(collection[alias], lcValue);	
					-1 === idx ? collection[alias].push(lcValue) : undefined;	
				}
				else {													// the collection's an array
					idx = extd.findIndex(collection, lcValue);				// don't reproduce values already in the collection
					if( 1 === me.setAliases.length ) {					
						-1 === idx ? collection.push(lcValue) : undefined;		
					}
					else {												// [ {alias:val, key2: val}, {...}, ... ]
						if( !setHash ) {
							setHash = {};
							setHash.filteredHashCode = fc.hashCode;		// tag this so we can find it on retractions
							collection.push(setHash);		// [{...}, {...}...]
						}
						setHash[alias] = lcValue;
					}
				}
			});
			//
			createdContext = me._createMatch(lc, fc, rc);
            if (createdContext.isMatch() ) {
                this.__propagate(verb, createdContext.clone());
            }
        }
		/*
			We are called with the original lc, the 'pruned' version of the lc and the rc.
		*/
        ,_createMatch: function (lc, fc, rc) {
            var me = this
				,match				= rc.match			//fc.match.merge(rc.match)		// the derived match
				,collFact			= rc.fact
				,collection			= rc.fact.object
				,eqConstraints		= this.__equalityConstraints
				,i = -1,l	= eqConstraints.length
                ,createdContext, fh;
			// 
			if( match.hashCode !== (fc.hashCode + ':' + rc.fact.id) ) {
				throw new Error('invalid match hashCode');
			}
			fh = Object.create(lc.factHash);		//_.merge({}, lc.factHash); 
			fh[me.alias] = collection;
			// check to see if any condition expressions pass before we propagate anything
			while (++i < l) {
				if (!eqConstraints[i](fh, fh)) {			// fh: all the 'regular' bindings plus a single collection binding
					createdContext = DEFAULT_MATCH;			// this is a non-match; e.g. lc.isMatch() => false
					break;
				}
			}
			if (!createdContext) {
				lc.fromMatches[fc.hashCode] = createdContext = lc.clone(rc.fact, null, match);
            }
			this.fromMemory[fc.hashCode] = [lc, createdContext];
            return createdContext;
        }
		//
		,modifyLeft: function (lc, retract) {
			var me = this
				,ctx			= this.removeFromLeftMemory(lc)
				,fc				= this.getFilteredContext(lc)
				,rc				= me.collectionHash[fc.hashCode]	// a collection for each combo of non-collection binding(s)
				,match			= rc.match							// fc.match.merge(rc.match)			// the rc.fact is the collection
				,collFact		= rc.fact
				,collection		= collFact.object
				,empty			= true
				,oldLcFh, newLcFh, lcOldValue, setHash, matchContext;
            if (ctx) {
				ctx				= ctx.data;
				if(!retract) {
					this.__addToLeftMemory(lc);
					lc.fromMatches = {};
				}
				oldLcFh			= ctx.factHash;
				newLcFh			= lc.factHash;
				rightMatches	= ctx.fromMatches;
				//
				// it's a modify all i have to do is replace the set variables in the collection with their modified values
				try { 
					me.setAliases.forEach(function(alias) {
						var theArray, idx;
						lcOldValue  = oldLcFh[alias];
						lcNewValue  = newLcFh[alias];
						if( me.isCollectionObject ) {					// a hash of sets -> { key: [values], key2: [values], ... }
							theArray = collection[alias];
							idx		 = extd.findIndex(theArray, lcOldValue);
							retract ? delete theArray[idx] :  theArray[idx] = lcNewValue;
							if(retract && empty) { empty = theArray.length ? false : true }		
						}
						else {											// an array either of single values OR [{hash of single values}, {...},...]
							if( 1 === me.setAliases.length ) {			// a simple array
								idx = extd.findIndex(collection, lcOldValue);
								retract ? delete collection[idx] :  collection[idx] = lcNewValue;
							}
							else {										// we have a hash remove the entire thing from the array
								collection.some(function(x,i) { if( x.filteredHashCode === fc.hashCode ) { idx = i; return true }});
								collection.splice(idx);
								if(!retract) {
									if(!setHash) {
										setHash = {};	setHash.filteredHashCode = fc.hashCode;
										collection[idx] = setHash;
										setHash[alias] = lcNewValue;
									}
									else {
										setHash[alias] = lcNewValue;
									}
								}
								else {
									if( empty ) { empty = collection.length ? false : true }
								}
							}
						}
					});
					//
					if( retract && empty ) {
						for (var i in ctx.fromMatches) {
							matchContext =  ctx.fromMatches[i];
							this.removeFromFromMemory(matchContext);
							this.__propagate("retract", matchContext.clone());
						}						
					}
					else {
						lc.fromMatches[fc.hashCode] = createdContext = lc.clone(collFact, null, match);
						this.fromMemory[fc.hashCode] = [lc, createdContext];
						this.__propagate("modify", createdContext.clone());
					}
				}
				catch(e) {
					throw new Error(e);	
				}					 
			}   
			else {
				this.assertLeft(lc);
			}
		}
		//
		,retractLeft: function(lc) {
			return this.modifyLeft(lc, true);
		}
		//
		// clone the (left) context and remove the set oriented variables
        //
        ,getFilteredContext: function(lc) {
            var me = this
				,match = new Match()
				,clone;
            // the aliases array is in order so the filtered aliases are also in order
            lc.match.aliases.forEach(function(alias, i) {
				var idx = extd.findIndex(me.setAliases, function(alias) { return function(x) { return x == alias; }}(alias))
					,fact;
                if(	idx === -1 ) {	
					fact = lc.match.facts[i];
                    match.addFact(fact);
					match.factHash[alias] = fact.object;
                }
            });
            clone = lc.clone(null, null, match);		// with set variables removed
			extdObj(match.factHash).forEach( function(val, key) {clone.set(key, val);});					
			return clone;
        }
		//
		// clone the (left) context and remove the set oriented variables
        //
        ,getFilteredHashCode: function(context) {
            var me		= this
				,facts = []
				,tmp;
            //
            context.match.aliases.forEach(function(alias, i) {
                if(	extd.findIndex(me.setAliases, function(x) { return x == alias; } )	=== -1)  {	
                    facts.push(context.factHash[alias]);
                }
			});
       		return facts.map(function(x){ return x.id; }).reduce(function(prev, cur, idx, array) { return prev ? ( prev + ':' + cur ) :  ('' + cur) });
		 }

    }
}).as(module);





















