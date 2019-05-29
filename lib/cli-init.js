
'use strict';

const fs = require('fs');
const path = require('path');
const pkg = require('../package');
const program = require('commander');

program
	.arguments('[name]')
	.parse(process.argv);

console.log(`tale v${pkg.version}`);

const fullPath = dir => name => path.join(dir, name);
const pipeFile = ([src, dst]) => fs.createReadStream(src).pipe(fs.createWriteStream(dst));

const cpy = dirApp => {
	['./','lib','step'].forEach(dir => {
		const sourceDir = path.join(__dirname,'..','template',dir);
		const srcFullPath = fullPath(sourceDir);
		const dstFullPath = fullPath(dirApp);
		
		fs.readdirSync(sourceDir)
			.filter(name => path.extname(name) === '.js')
			.map(name => [srcFullPath(name), dstFullPath(name)])
			.map(pipeFile);
	});
};

const ensureDir = dirApp => ['lib', 'test', 'step'].map(fullPath(dirApp)).map(fs.mkdirSync);

(() => {
	const dirApp = process.cwd();
	ensureDir(dirApp);
	cpy(dirApp);
})();
