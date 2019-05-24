
'use strict';

const path = require('path');

module.exports = loader => loader(path.resolve(__dirname,'../changzhou.class.csv'), {
	delimiter: ','
});
