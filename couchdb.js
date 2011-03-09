var couchdb = require('..//..//libs/node-couchdb/lib/couchdb');
require('./couchdb.json');

exports.client = couchdb.createClient(couchdbconfig.port, couchdbconfig.host); 
exports.db = exports.client.db(couchdbconfig.db);

exports.couchdb_changes = function(callback) {
  var stream;
  var since;

  exports.db.info(function(err, data) {
    if (err) throw new Error(JSON.stringify(err));
    since = data.update_seq;
    stream = exports.db.changesStream({since:since});
    console.log('db.update_seq: ' + since);
    stream.addListener('data', callback);
  });

  return stream;
}

