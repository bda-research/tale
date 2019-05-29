
'use strict';

const program = require('commander');
const pkg = require('../package');

program
	.version(pkg.version)
	.command('init','generate worflow')
	.command('run','start a project.')
	// .command('list', 'list all projects')
	// .command('stop', 'stop process by pid')
	// .command('restart','restart process by pid')
	// .command('clean', 'clean a crashed process by pid')
	// .command('show', 'show detail info of a process by pid')
	.parse(process.argv);

