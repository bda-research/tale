'use strict'

module.exports = [
	{source: 'input', target: 'keepFromLastYearYes', func: 'function'},
	{source: 'keepFromLastYearYes', target: 'addFields', func: 'csv'},
	{source: 'addFields', target: 'partition', func: 'csv'},
	{source: 'partition', target: 'mergeOnline', func: 'csv'},
	{source: 'mergeOnline', target: 'concat', func: 'csv'},
	{source: 'concat', target: 'output', func: 'csv'},
];