
'use strict';

module.exports = [
	{id: 'input',fn: 'mongodb', type: 'input'},
	{id: 'keepFromLastYear',fn: 'filter'},
	{id: 'addFields',fn: 'addFields'},
	{id: 'partition',fn: 'partition'},
	{id: 'mergeOnline', fn: 'identity'},
	{id: 'identity',fn: 'identity'},
	{id: 'concat',fn: 'concat'},
	{id: 'output',fn: 'csv', type: 'output'}
];
