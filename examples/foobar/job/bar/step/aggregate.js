
'use strict';

// {
// 	nNewClassroom: statGroupBy(prop('_id'), [prop('city'), prop('clsType'), prop('termYear'), prop('termSeason')], T, length),
// 	nNewClassroomOffline: statGroupBy(({venueId, classroom})=>`${venueId}_${classroom}`, [prop('city'),()=>'面授+双师', prop('termYear'), prop('termSeason')], T, countDistinct)
// }

module.exports = (pivot, {prop, T, countDistinct, length}) => pivot(
	[{
		name: 'nNewclassroom',
		valueFn: prop('_id'),
		keyFn: [prop('city'), prop('clsType'), prop('termYear'), prop('termSeason')],
		predicate: T,
		statFn: length
	}, {
		name: 'nNewclassroomOffline',
		valueFn: ({venueId, classroom})=>`${venueId}_${classroom}`,
		keyFn: [prop('city'),()=>'面授+双师', prop('termYear'), prop('termSeason')],
		predicate: T,
		statFn: countDistinct
	}]
);
