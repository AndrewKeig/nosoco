var path = require("path");
var url = require('url');
var fs = require('fs');

exports.get_file = function(request, response) {
    var uri = url.parse(request.url).pathname;
    var filename = path.join(process.cwd(), uri);
    var extension = /[^.]+$/.exec(request.url);
    
    path.exists(filename, function(exists) {
    	if(!exists) {
    		response.writeHeader(404, {"Content-Type": "text/plain"});
    		response.write("Missing..; 404 Not Found");
    		response.end();
    		return;
    	}

    	fs.readFile(filename, "binary", function(err, file) {
    		if(err) {
    			response.writeHeader(500, {"Content-Type": "text/plain"});
    			response.write(err + "Malfunction..\n");
    			response.end();
    			return;
    		}

    		response.writeHeader(200, {"Content-Type": "text/" + extension});
    		response.write(file, "binary");
    		response.end();
    	});
    });
}
