
'use strict';

const R = require('ramda');
const pivot = require('../lib/transform/pivot.js');
const countDistinct = require('../lib/transform/countDistinct.js');


const nNewClassroom = (R.prop('_id'), [R.prop('city'), R.prop('clsType'), R.prop('termYear'), R.prop('termSeason')], R.T, R.length);

const nNewClassroomOffline = aggregate(({venueId, classroom})=>`${venueId}_${classroom}`, [R.prop('city'),()=>'面授+双师', R.prop('termYear'), R.prop('termSeason')], R.T, countDistinct);


pivot({nNewClassroom, nNewClassroomOffline});
