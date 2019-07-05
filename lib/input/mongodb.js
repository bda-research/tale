
'use strict';

const Future = require('fluture');
const MongoClient = require('mongodb').MongoClient;
const bufferFromStream = require('./bufferFromStream.js');

// function handle(){
// 	if(cfg.get('dataSource:type') === 'database'){
// 		const ourl = URL.parse(cfg.get('dataSource:url'), true);
// 		switch(ourl.protocol){
// 		case 'mysql':
// 			require('mysql');
// 			break;
// 		case 'mongodb':
// 			require('mongodb');
// 			break;
// 		default:
// 			throw 'Specified protocol is unsupported!';
// 		}
// 	}else{ // 'file'
		
// 	}
// }




/** Only read operation is needed, and ways are various by datastore type
 * 1. File
 *     - Read the whole file content without filter, in generally.
 *     - A single file size may exceed memory limit.
 *     - Sometimes there are many files, named in date pattern, group by fixed prefix or in one directory.
 * 2. Database( MongoDb in most cases)
 *     - Only perform find operation with query.
 *     - Read dataset in one time or using streamming cursor.
 **/

module.exports = ({connection, db, collection, op}) => {
	const connect = Future.encaseP( url => new MongoClient(url).connect() );
	const withConnection = Future.hook(
		connect(connection.url),
		client => Future.of(client.close())
	);
	
	return withConnection(
		client => bufferFromStream(
			op.name === 'aggregate' ? client.db(db).collection(collection).aggregate(op.pipeline,op.options) : client.db(db).collection(collection)[op.name](op.query,op.options)
				// .find(query)
				// .project(projection)
				// // .limit(35000)
				.stream()
		)
	);
};
