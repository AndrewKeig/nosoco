var io = require('..//..//libs/Socket.IO/lib/socket.io');
//http://nodejs.org/
//http://couchdb.apache.org/
//http://socket.io/
//https://github.com/mikeal/node-couchdb
//http://wiki.apache.org/couchdb/HTTP_Document_API
//https://github.com/karmi/visualizing-couchdb-changes-with-node-js/blob/master/server.js
//http://till.klampaeckel.de/blog/archives/133-node.js-socket.io-fun.html
//http://davidwalsh.name/websocket
//http://www.davidgranado.com/2011/01/serve-a-static-html-file-with-nodejs/
//http://www.couchone.com/

var couchdb = require('..//..//libs/node-couchdb/lib/couchdb');
var http = require('http');
var url = require('url');
var fs = require('fs');
var sys = require('sys');
var url = require('url');
var page;

require('./node.json');
require('./couchdb.json');

var client = couchdb.createClient(couchdbconfig.port, couchdbconfig.host); 
var db = client.db(couchdbconfig.db);

var couchdb_changes = function(callback) {
  var stream;
  var since;

  db.info(function(err, data) {
    if (err) throw new Error(JSON.stringify(err));
    since = data.update_seq;
    stream = db.changesStream({since:since});
    console.log('db.update_seq: ' + since);
    stream.addListener('data', callback);
  });

  return stream;
}

fs.readFile('./nosoco/client.html', function (err, data) {
    if (err) throw err;
    page = data;
});
 
var server = http.createServer(function(request, response) {
    response.writeHeader(200, {"Content-Type": "text/html"});
    response.write(page);
    response.end();
});

server.listen(nodeconfig.port);

var socket = io.listen(server);

socket.on('connection', function(client){ 
  	sys.puts('Connected to: ' + db.name)

	db.allDocs(function(er, docs) {
	    if (er) throw new Error(JSON.stringify(er));
		//client.send(docs.rows)
		for (var i = 0; i < docs.rows.length; i++) {
		   // client.send(docs.rows[i].id)
			db.getDoc(docs.rows[i].id, function(er, doc) {
			if (er) throw new Error(JSON.stringify(er));
				sys.puts('Fetching doc from couch for id:' + doc.id);
				var latest = doc.team_1 + 
				' <span id="team_score_' + doc.team_1_id + '">' + 
				doc.team_1_score + '</span> ' +
				' - <span id="team_score_' + doc.team_2_id + '">' + 
				doc.team_2_score + '</span> ' + doc.team_2;
				client.send(latest);
			});
		}		
	});

  	couchdb_changes(function(change) {
		//respond to change
	    	sys.puts('Change id: ' + JSON.stringify(change.id));

		//get data using change.id
		db.getDoc(change.id, function(er, doc) {
		    if (er) throw new Error(JSON.stringify(er));
		    sys.puts('Fetching doc from couch for id:' + change.id);

		    var json = '{"rows" : [' +
				'{ "id" : "team_score_' + doc.team_1_id + '", "score" : "' + 					 doc.team_1_score + '" },' +
				'{ "id" : "team_score_' + doc.team_2_id + '", "score" : "' + 					 doc.team_2_score + '" }]}';
		    client.send(JSON.parse(json));
		});
	});

	client.on('message',function(event){ 
		console.log('Received message from client', event);
	});

	client.on('disconnect',function(){
		console.log('Node server has disconnected');
	});
});

sys.puts('Server running at ' + nodeconfig.host + ':' + nodeconfig.port);
sys.puts('Use the following command to make changes to db ' + couchdbconfig.db + ':');
sys.puts('curl -H \'Content-Type: application/json\' -X POST http://localhost:5984/air-comet -d \'{"name":"bar"}\'');

