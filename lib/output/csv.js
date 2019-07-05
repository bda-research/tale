
'use strict';

const fs = require('fs');
const moment = require('moment');
const {keys, head, props, join, compose, map} = require('ramda');
const Future = require('fluture');

const write = Future.encaseN3(fs.writeFile);

module.exports = ({fields, dir, name}) => items => {
	const getFilePath = ()=>`${dir}${name}_${moment().format('YYYY-MM-DD')}.csv`;

	// const selectedFields = () => ['city', 'clsType', 'venueId', 'venueName','termYear', 'termSeason'];

	// we have to define it because the order of keys, which diverses.
	// const selectedFields = () => ['indicator', 'biz', 'city', 'value'];

	const valuesToLine = compose(join(','), props(fields ));
	const toLines = compose(join('\n'), map(valuesToLine));

	return write(getFilePath(), `\ufeff${fields.join()}\n` + toLines(items), {});
	
	// fs.writeFileSync(getFilePath(), `${selectedFields().join()}\n` + toLines(items));
	
	// return {
	// 	nItems: items.length,
	// 	fields: selectedFields(),
	// 	filePath: getFilePath()
	// };
};
