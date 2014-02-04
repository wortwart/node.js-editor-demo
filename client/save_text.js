document.querySelector("form").addEventListener("submit", function() {
	document.querySelector("#textinput").value = document.querySelector("pre").innerHTML;
}, false);