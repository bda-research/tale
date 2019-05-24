
'use strict';

const csv = require('csv-parse');
const fs = require('fs');
const path = require('path');
const future = require('fluture');

module.exports = (filePath, options={}) => {
	const absPath = path.resolve(__dirname, '../../', filePath);

	return future((reject, resolve) => {
		const defaultOpts = {
			delimiter: ',',
			columns: true,
			skip_empty_lines: true,
			ltrim: true,
			rtrim: true
		};
		
		const parser = csv(Object.assign(defaultOpts, options), (e, data) => e?reject(e):resolve(data));

		parser.write(
			fs.readFileSync(absPath)
		);

		parser.end();
	});
};
