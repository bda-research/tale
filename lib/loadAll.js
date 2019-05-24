
'use strict';

const fs = require('fs');
const R = require('ramda');

// loadScriptFile :: String -> String -> a
const loadScriptFile = R.curry( (dir, name) => require(`${dir}/${name}`) );

// loadAll :: String -> {String: a}
module.exports = dir => R.pipe(
	R.reject(R.test(/^index.js$/)),
	R.filter(R.test(/\.js$/)),
	R.map(R.replace(/\.js$/, '')),
	R.map(item => [item, loadScriptFile(dir, item)]),
	R.fromPairs
)(	fs.readdirSync(dir));
