
'use strict';

module.exports = [
	{id: 'input',fn: 'csv'	},
	{id: 'keepFromLastYear',fn: 'filter'},
	{id: 'addFields',fn: 'addFields'},
	{id: 'partition',fn: 'partition'},
	{id: 'mergeOnline', fn: 'identity'},
	{id: 'identity',fn: 'identity'},
	{id: 'concat',fn: 'concat'},
	{id: 'output',fn: 'identity'}
];
