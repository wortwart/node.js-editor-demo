var fs = require("fs");
var url = require("url");

function startpage(req, resp) {
	console.log("Executing startpage.")
	resp.writeHead(200, {"Content-type": "text/html; charset=utf-8"});
	var template = fs.createReadStream("template_start_head.html")
	template.pipe(resp, {end: false});
	template.on("end", function() {
		fs.readdir(filePath, function(err, dateien) {
			if (err) {
				resp.end("<p>Directory <code>" + filePath + "</code> not found!</p>");
				return;
			}
			else if (!dateien.length) {
				resp.end("<p>No files found in <code>" + filePath + "</code>!</p>");
				return;
			}
			resp.write("<p>Directory: " + filePath + "</p>");
			resp.write("<table>\n <thead><th>Name</th><th>Size</th><th>Last modified</th></thead>\n <tbody>\n")
			dateien.forEach(function(file, i) {
				fs.stat(filePath + file, function(err, stats) {
					if (stats.isFile()) {
						//console.log(stats);
						resp.write("  <tr>\n   <td><a href='./edit?file=" + file + "'>" + file + "</a></td>\n");
						resp.write("   <td>" + stats.size + "</td>\n");
						var datum = stats.mtime.getDate() + '.' + (stats.mtime.getMonth() + 1) + '.' + stats.mtime.getFullYear() + ' ' + stats.mtime.getHours() + ':' + stats.mtime.getMinutes();
						resp.write("   <td>" + datum + "</td>\n  </tr>\n");
						if (i + 1 === dateien.length) {
							fs.createReadStream("template_start_foot.html").pipe(resp);
						}
					}
				});
			});
		});
	});
}

function edit(req, resp, file) {
	console.log("Executing edit.")
	resp.writeHead(200, {"Content-type": "text/html; charset=utf-8"});
	fs.readFile("template_edit_head.html", function(err, content) {
		resp.write(content);
		if (file) {
			resp.write("<h2>Changed File " + file + "</h2>");
		} else {
			file = url.parse(req.url, true).query.file;
			resp.write("<h2>Editing " + filePath + file + " ...</h2>\n");
		}
	  if (!file || file.match(/[/\\%]/)) {
	  	resp.end("<p>Ungültiger Dateiname: " + file + "</p></body></html>");
	  	return;
	  }
		resp.write("<pre contenteditable>");
	  var stream = fs.createReadStream(filePath + file);
	  stream.pipe(resp, {end: false});
	  stream.on("end", function() {
			fs.readFile("template_edit_foot.html", function(err, content) {
				resp.end(content.toString().replace("%%file%%", file));
			});
	  });
	});
}

function save(req, resp) {
	console.log("Executing save.");
	var chunks = ''; // or: = new Buffer([]);
	if (req.method == 'POST') {
	  req.on('data', function(chunk) {
	  	chunks += chunk; // or: = Buffer.concat([chunks, chunk]);
	  });
	  req.on('end', function() {
			var querystring = require("querystring");
	  	var post = querystring.parse(chunks.toString());
		  if (!post.file || post.file.match(/[/\\%]/)) {
				resp.writeHead(200, {"Content-type": "text/html; charset=utf-8"});
		  	resp.end("<p>Invalid file name: " + post.file + "</p></body></html>");
		  	return;
		  }
	  	var writestream = fs.createWriteStream(filePath + post.file);
	  	writestream.end(post.text, "utf8", function() {
	  		edit(req, resp, post.file);
	  	});
		});
	} else {
		edit(req, resp);
	}
}

function outputFile(resp, path) {
	var type = {
		"js": "text/javascript; charset=utf-8",
		"css": "text/css; charset=utf-8"
	}
	var regex = /^\/client\/[\w.-]+\.(\w+)$/;
	var match = regex.exec(path);
	if (match) {
		resp.writeHead(200, {"Content-type": type[match[1]]});
		fs.createReadStream("." + path).pipe(resp);
	} else {
		f404(resp, path);
		return;
	}
}

function f404(resp, path) {
	console.warn("Error 404.")
	resp.writeHead(404, {"Content-type": "text/html; charset=utf-8"});
	resp.end("Page " + path + " not found.");
}

exports.startpage = startpage;
exports.edit = edit;
exports.save = save;
exports.outputFile = outputFile;
exports.f404 = f404;