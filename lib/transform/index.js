
'use strict';

const R = require('ramda');
const loadAll = require('../loadAll.js');

module.exports =R.compose(
	R.mergeRight(R),
	loadAll
)(__dirname);
