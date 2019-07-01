'use strict'

module.exports = [
	{source: 'input', target: 'keepFromLastYear', func: 'csv'},
	{source: 'keepFromLastYear', target: 'addFields', func: 'csv'},
	{source: 'addFields', target: 'partition', func: 'csv'},
	{source: 'partition', target: 'mergeOnline', func: 'csv'},
	{source: 'mergeOnline', target: 'concat', func: 'csv'},
	{source: 'concat', target: 'output', func: 'csv'},
];