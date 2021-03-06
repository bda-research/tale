
'use strict';

//TODO: should lazy load the functions. to avoid install unuse packages.
const path = require('path');
const transformation = require('./transform/index.js');
const input = require('./input/index.js');
const output = require('./output/index.js');
const R = require('ramda');
const loadAll = require('./loadAll.js');
const future = require('fluture');

const utility = R.mergeRight(transformation, {input, output});
const loadHandlers = R.compose(
	R.map(R.objOf('handler')),
	loadAll
);

// execute :: [Object] -> [Future b c]
const execute = (vertexes) => {
	const leaves = R.compose(
		R.filter(R.propEq('out',[])),
		R.values
	)(vertexes);
	
	return leaves.map(callOne);

	// callOne :: Object -> Future b c
	function callOne(node){
		if(node.in.length === 0){
			node.result = node.handler(utility['input'][node.fn]);
		}
		
		if(node.result){
			return future.isFuture(node.result) ? node.result : future.resolve(node.result);
		}
		
		// prepareArgs :: [a] -> [Future b c]
		const prepareArgs = R.map(prev => callOne(vertexes[prev.id]).map(utility[prev.op]));
		const prepareHandler = fn => {
			const actual = node.handler?node.handler(fn):fn;
			console.log(actual);
			return future.resolve(actual);
		};

		// execNode :: [a] -> Future b c
		const execNode = R.compose(
			R.reduce((prev, arg) => prev.ap(arg), prepareHandler(node.type==='output'?utility.output[node.fn] : utility[node.fn])),
			prepareArgs
		);

		return node.result = execNode(node.in);//.map(R.tap(console.log));
	}
};

const start = jobName => {
	const stepDir = path.resolve(process.cwd(),'job', jobName, 'step');
	const steps = require(stepDir);
	const edges = require(
		path.resolve(process.cwd(), 'job', jobName, 'register')
	);

	const vertexes = R.compose(
		R.reduce(R.mergeRight,{}),
		R.map(vertex => R.objOf(vertex.id, vertex))
	)(steps);
	
	const handlers = loadHandlers(stepDir);
	
	// need refactor
	R.keys(vertexes)
		.forEach( id => {
			vertexes[id] = R.mergeRight(vertexes[id], handlers[id]);
			// vertexes[id] = R.assoc('id', id, vertexes[id]);
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
	
	return future.parallel(Infinity, execute(vertexes));
};

module.exports = start;
