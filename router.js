var fs = require("fs");
var url = require("url");

function startseite(anfrage, antwort) {
	console.log("Führe Startseite aus.")
	antwort.writeHead(200, {"Content-type": "text/html; charset=utf-8"});
	var template = fs.createReadStream("template_start_head.html")
	template.pipe(antwort, {end: false});
	template.on("end", function() {
		fs.readdir(filePath, function(err, dateien) {
			if (err) {
				antwort.end("<p>Verzeichnis <code>" + filePath + "</code> nicht gefunden!</p>");
				return;
			}
			else if (!dateien.length) {
				antwort.end("<p>Keine Dateien in <code>" + filePath + "</code> gefunden!</p>");
				return;
			}
			antwort.write("<p>Verzeichnis: " + filePath + "</p>");
			antwort.write("<table>\n <thead><th>Name</th><th>Größe</th><th>Änderungsdatum</th></thead>\n <tbody>\n")
			dateien.forEach(function(datei, i) {
				fs.stat(filePath + datei, function(err, stats) {
					if (stats.isFile()) {
						//console.log(stats);
						antwort.write("  <tr>\n   <td><a href='./edit?datei=" + datei + "'>" + datei + "</a></td>\n");
						antwort.write("   <td>" + stats.size + "</td>\n");
						var datum = stats.mtime.getDate() + '.' + (stats.mtime.getMonth() + 1) + '.' + stats.mtime.getFullYear() + ' ' + stats.mtime.getHours() + ':' + stats.mtime.getMinutes();
						antwort.write("   <td>" + datum + "</td>\n  </tr>\n");
						if (i + 1 === dateien.length) {
							fs.createReadStream("template_start_foot.html").pipe(antwort);
						}
					}
				});
			});
		});
	});
}

function edit(anfrage, antwort, datei) {
	console.log("Führe Edit-Seite aus.")
	antwort.writeHead(200, {"Content-type": "text/html; charset=utf-8"});
	fs.readFile("template_edit_head.html", function(err, inhalt) {
		antwort.write(inhalt);
		if (datei) {
			antwort.write("<h2>Datei " + datei + " geändert</h2>");
		} else {
			datei = url.parse(anfrage.url, true).query.datei;
			antwort.write("<h2>Editiere " + filePath + datei + " ...</h2>\n");
		}
	  if (!datei || datei.match(/[/\\%]/)) {
	  	antwort.end("<p>Ungültiger Dateiname: " + datei + "</p></body></html>");
	  	return;
	  }
		antwort.write("<pre contenteditable>");
	  var stream = fs.createReadStream(filePath + datei);
	  stream.pipe(antwort, {end: false});
	  stream.on("end", function() {
			fs.readFile("template_edit_foot.html", function(err, inhalt) {
				antwort.end(inhalt.toString().replace("%%datei%%", datei));
			});
	  });
	});
}

function save(anfrage, antwort) {
	console.log("Führe Save-Seite aus.");
	var post = '';
	if (anfrage.method == 'POST') {
	  anfrage.on('data', function(chunk) {
	  	post += chunk.toString();
	  });
	  anfrage.on('end', function() {
			var querystring = require("querystring");
			var datei = querystring.parse(post).datei;
		  if (!datei || datei.match(/[/\\%]/)) {
				antwort.writeHead(200, {"Content-type": "text/html; charset=utf-8"});
		  	antwort.end("<p>Ungültiger Dateiname: " + datei + "</p></body></html>");
		  	return;
		  }
	  	var text = querystring.parse(post).text;
	  	var schreibstream = fs.createWriteStream(filePath + datei);
	  	schreibstream.end(text, "utf8", function() {
	  		edit(anfrage, antwort, datei);
	  	});
		});
	} else {
		edit(anfrage, antwort);
	}
}

function outputFile(antwort, pfad) {
	var type = {
		"js": "text/javascript; charset=utf-8",
		"css": "text/css; charset=utf-8"
	}
	var regex = /^\/client\/[\w.-]+\.(\w+)$/;
	var match = regex.exec(pfad);
	if (match) {
		antwort.writeHead(200, {"Content-type": type[match[1]]});
		fs.createReadStream("." + pfad).pipe(antwort);
	} else {
		f404(antwort, pfad);
		return;
	}
}

function f404(antwort, pfad) {
	console.warn("Fehler 404.")
	antwort.writeHead(404, {"Content-type": "text/html; charset=utf-8"});
	antwort.end("Seite " + pfad + " nicht gefunden.");
}

exports.startseite = startseite;
exports.edit = edit;
exports.save = save;
exports.outputFile = outputFile;
exports.f404 = f404;