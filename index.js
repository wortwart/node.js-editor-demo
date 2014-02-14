global.filePath = "./testtexts/";
// Path to directory containing the text files
// "global" makes variable also available in router.js

var http = require("http");
var url = require("url");
var router = require("./router");

var routes = {
  "/": router.startpage,
  "/edit": router.edit,
  "/save": router.save
};

function onRequest(req, resp) {
  var postData = '';
  var pfad = url.parse(req.url).pathname;
  console.log("Called: " + pfad);
  if (routes[pfad]) {
  	routes[pfad](req, resp);
  } else if (pfad.match(/^\/client\//)) {
		router.outputFile(resp, pfad);
	} else {
		router.f404(resp, pfad);
  }
}

http.createServer(onRequest).listen(8080);
console.log("Server has started.");
