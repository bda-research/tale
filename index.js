
'use strict';

const path = require('path');
const transformation = require('./lib/transform/index.js');
const entry = require('./lib/entry/index.js');
const R = require('ramda');
const loadAll = require('./lib/loadAll.js');
const future = require('fluture');

const utility = R.mergeRight(transformation, entry);

const stepDir = path.resolve(process.cwd(), 'step');
const steps = require(stepDir);

const loadHandlers = R.compose(
	R.map(R.objOf('handler')),
	loadAll
);

const edges = require(
	path.resolve(process.cwd(), 'register')
);

const execute = (vertexes) => {
	const leaves = R.compose(
		R.filter(R.propEq('out',[])),
		R.values
	)(vertexes);
	
	return leaves.map(callOne);
	
	function callOne(node){
		if(node.in.length === 0){
			node.result = node.handler(utility[node.fn]);
		}
		
		if(node.result){
			return future.isFuture(node.result) ? node.result : future.resolve(node.result);
		}
		
		const prepareArgs = R.map(prev => callOne(vertexes[prev.id]).map(utility[prev.op]));
		const prepareHandler = fn => future.resolve(node.handler?node.handler(fn):fn);
		const execNode = R.compose(
			R.reduce((prev, arg) => prev.ap(arg), prepareHandler(utility[node.fn])),
			prepareArgs
		);

		return node.result = execNode(node.in);//.map(R.tap(console.log));
	}
};

( () => {
	const vertexes = R.compose(
		R.map(R.objOf('fn')),
		R.fromPairs,
		R.map(R.props(['id', 'fn']))
	)(steps);
	
	const handlers = loadHandlers(stepDir);
	
	// need refactor
	R.keys(vertexes)
		.forEach( id => {
			vertexes[id] = R.mergeRight(vertexes[id], handlers[id]);
			vertexes[id] = R.assoc('id', id, vertexes[id]);
			// vertexes[id].in = vertexes[id].out = [];
		});
	
	for(const edge of edges){
		const sourceNode = vertexes[edge.source];
		const targetNode = vertexes[edge.target];
		
		sourceNode.out = sourceNode.out || [];
		sourceNode.in = sourceNode.in || [];
		sourceNode.out.push({id: edge.target, op: edge.op || 'identity'});
		targetNode.in = targetNode.in || [];
		targetNode.out = targetNode.out || [];
		targetNode.in.push({id: edge.source, op: edge.op || 'identity'});
	}
	
	console.log(vertexes);
	
	execute(vertexes).map(fu => fu.fork(console.error, console.log));
})();
