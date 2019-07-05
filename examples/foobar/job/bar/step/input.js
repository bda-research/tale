
'use strict';

module.exports = loader => loader({
	'url': 'mongodb://bdaserver/',
	'db': 'xueersi',
	'collection': 'class',
	'limit': 1000,
	'query': {'cla_term_name': {'$in': ['春季班','秋季班','寒假班','暑期班']}, 'clsType':{'$ne':'在线'}},
	'projection': {'cla_start_date': 1, 'cla_term_name': 1,'cla_subject_names': 1, '_id': 0, 'cla_venue_id': 1, 'cla_venue_name': 1, 'clsType':1, 'city': 1, 'createdAt': 1, 'updatedAt': 1}
});
