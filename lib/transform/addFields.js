
'use strict';

const {mergeRight, applySpec, ap, map} = require('ramda');

/** addFields :: {k: a -> v} -> (a -> {k: v})
 *
 */
module.exports = spec => map(ap(mergeRight, applySpec(spec)));
