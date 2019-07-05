
'use strict';

const Future = require('fluture');

// buffer :: ReadableStream a -> Future Error (Array a)
module.exports = stream => 
	Future((reject, resolve) => {
		const buf = [];
		const onData = d => buf.push(d);
		const onEnd = () => resolve(buf);
		stream
			.on('data',  onData)
			.on('end', onEnd)
			.on('error', reject );

		return ()=>{
			stream.removeListener('data', onData);
			stream.removeListener('end', onEnd);
			stream.removeListener('error', reject);
		};
	});
