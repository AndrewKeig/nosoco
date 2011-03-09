var io = require('..//..//libs/Socket.IO/lib/socket.io');
var http = require('http');
var sys = require('sys');
var url = require('url');

var couchdb_controller = require('./couchdb.js');
var file_controller = require('./file.js');

require('./node.json');

var server = http.createServer(function(request, response) {     
    file_controller.get_file(request, response);
});

server.listen(nodeconfig.port);

var socket = io.listen(server);

socket.on('connection', function(client){
    couchdb_controller.db.allDocs(function(er, docs) {
        if (er) throw new Error(JSON.stringify(er));
        for (var i = 0; i < docs.rows.length; i++) {
            couchdb_controller.db.getDoc(docs.rows[i].id, function(er, doc) {
                if (er) throw new Error(JSON.stringify(er));
                var latest = doc.team_1 +
                ' <span id="team_score_' + doc.team_1_id + '">' +
                doc.team_1_score + '</span> ' +
                ' - <span id="team_score_' + doc.team_2_id + '">' +
                doc.team_2_score + '</span> ' + doc.team_2;
                client.send(latest);
            });
        }		
    });

    couchdb_controller.couchdb_changes(function(change) {       
        couchdb_controller.db.getDoc(change.id, function(er, doc) {
            if (er) throw new Error(JSON.stringify(er));

            var json = '{"rows" : [' +
            '{ "id" : "team_score_' + doc.team_1_id + '", "score" : "' + 					 doc.team_1_score + '" },' +
            '{ "id" : "team_score_' + doc.team_2_id + '", "score" : "' + 				 doc.team_2_score + '" }]}';
            client.send(JSON.parse(json));
        });
    });
});
