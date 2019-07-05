
'use strict';

const {omit, map} = require('ramda');

module.exports = (fields) => map(omit(fields));
