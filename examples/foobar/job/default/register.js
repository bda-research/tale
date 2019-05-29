
'use strict';

module.exports = [
	{source: 'input', target: 'keepFromLastYear'},
	{source: 'keepFromLastYear', target: 'addFields'},
	{source: 'addFields', target: 'partition'},
	{source: 'partition', target: 'mergeOnline', op: 'head'},
	{source: 'partition', target: 'identity', op: 'last'},
	{source: 'mergeOnline', target: 'concat'},
	{source: 'identity', target: 'concat'},
	{source: 'concat', target: 'output'}
];
