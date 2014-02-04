global.filePath = "./testtexte/";
// Pfad zum einzulesenden Verzeichnis
// dank global ist die Variable auch in router.js verfügbar

var http = require("http");
var url = require("url");
var router = require("./router");

var routes = {
  "/": router.startseite,
  "/edit": router.edit,
  "/save": router.save
};

function onRequest(anfrage, antwort) {
  var postData = '';
  var pfad = url.parse(anfrage.url).pathname;
  console.log("Aufgerufen wurde: " + pfad);
  if (routes[pfad]) {
  	routes[pfad](anfrage, antwort);
  } else if (pfad.match(/^\/client\//)) {
		router.outputFile(antwort, pfad);
	} else {
		router.f404(antwort, pfad);
  }
}

http.createServer(onRequest).listen(8080);
console.log("Server ist gestartet.");
