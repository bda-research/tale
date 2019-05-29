
'use strict';

const program = require('commander');
const R = require('ramda');
const future = require('fluture');
const executor = require('./execute.js');

program
	.option('-p, --parallel', 'run jobs concurrently, default sequentially')
	.parse(process.argv);

const parallelFuture = parallel => parallel ? future.parallel(Infinity) : future.parallel(1);
const print = R.map(() => console.log('job done.'));

parallelFuture(program.parallel)( R.map(executor, program.args)).fork(console.error, print);
