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
                var buffer = [];
                buffer.push(doc.team_1);
                buffer.push(' <span id="team_score_');
                buffer.push(doc.team_1_id);
                buffer.push('">');
                buffer.push(doc.team_1_score);                
                buffer.push('</span> ');
                buffer.push(' - <span id="team_score_');
                buffer.push(doc.team_2_id);
                buffer.push('">');
                buffer.push(doc.team_2_score);
                buffer.push('</span> ');
                buffer.push(doc.team_2);
                var latestScore = buffer.join('');
                client.send(latestScore);
            });
        }		
    });

    couchdb_controller.couchdb_changes(function(change) {       
        couchdb_controller.db.getDoc(change.id, function(er, doc) {
            if (er) throw new Error(JSON.stringify(er));
            var buffer = [];
            buffer.push('{"rows" : [');
            buffer.push('{ "id" : "team_score_');
            buffer.push(doc.team_1_id);
            buffer.push('", "score" : "');
            buffer.push(doc.team_1_score);
            buffer.push('" },');
            buffer.push('{ "id" : "team_score_');
            buffer.push(doc.team_2_id);
            buffer.push('", "score" : "');
            buffer.push(doc.team_2_score);
            buffer.push('" }]}');
            var json = buffer.join('');
            client.send(JSON.parse(json));
        });
    });
});
