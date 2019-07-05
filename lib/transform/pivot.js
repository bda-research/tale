
'use strict';

const R = require('ramda');

// valueFn -> keyFn -> predicate -> statisticFn

// R.groupBy :: (a → String) → [a] → {String: [a]}

// groupByMultiple :: [String] -> [a] -> Object
const groupByMultiple = R.curry((fields, data) => {
	if (fields.length === 1) return R.groupBy(fields[0], data);

	// groupBy :: [a] → {String: [a]}
	let groupBy = R.groupBy(R.last(fields));
	
	R.times(() => {
		// groupBy :: Object → Object
		groupBy = R.mapObjIndexed(groupBy);
	}, fields.length - 1);

	return groupBy(groupByMultiple(R.init(fields), data));
});

const mapRecusive = (nLevel, fn) => {
	return mp;
	function mp(obj) {
		if(nLevel === 0){
			return R.map(fn, obj);
		}

		nLevel--;
		return R.map(mp);
	}
};

const statGroupBy = R.curry( (valueFn, keyFns, predicate, statFn) => R.compose(
	mapRecusive(
		keyFns.length,
		R.compose(statFn, R.map(valueFn))
	),
	groupByMultiple(keyFns),
	R.filter(predicate)
));

// pivot :: {String: Function} -> 
module.exports = (indicators) => {
	R.map((o) => {
		const stat = statGroupBy(R.prop('valueFn'), R.prop('keyFn'), R.prop('predicate'), R.prop('statFn'));
		R.assoc('value', stat(o), o);
	}, indicators);
	
};
