/*
	client.js!
	This code runs on the browser.
*/

SYMKEY = null;
CONNECTED = false;
USERS = {};

function onload(){
	STATUS = document.getElementById("status");
	BOX = document.getElementById("box");
}

function randomString(len){
	var s = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	return Array(N).join().split(',').map(function() { return s.charAt(Math.floor(Math.random() * s.length)); }).join('');
}

function getQueryVariable(variable) {
	var query = window.location.search.substring(1);
	var vars = query.split("&");
	for (var i=0;i<vars.length;i++) {
		var pair = vars[i].split("=");
		if (pair[0] == variable) {
			return pair[1];
		}
	}
	return null;
}

function checkPassword(){
	var passwordField = document.getElementById("pwd");
	var usernameField = document.getElementById("uname");
	var passwordAttempt = passwordField.value;
	username = usernameField.value;
	var isCorrect = CryptoJS.AES.decrypt(ROOM_FISH, passwordAttempt).toString() != "";
	if(isCorrect){
		SYMKEY = passwordAttempt;
		connect();
	}else{
		alert("Incorrect password!");
		window.location = "/";
		return;
	}
}

function connect(){
	STATUS.innerHTML = "Connecting...";
	var url = "wss://" + window.location.host + "/chat";
	socket = new WebSocket(url);
	socket.onopen = function(e){
		STATUS.innerHTML = "Saying hello...";
		var packet = {
			type:"CONNECT",
			roomid: getQueryVariable("id"),
			data:CryptoJS.AES.encrypt(username, SYMKEY).toString()
		};
		socket.send(JSON.stringify(packet));
		STATUS.innerHTML = "Awaiting user list...";
		// alert("Sent: " + JSON.stringify(packet));
	};
	socket.onmessage = processMessage;
}

function processMessage(evt){
	var msg;
	try{
		msg = JSON.parse(evt.data);
	}catch(e){
		if(e instanceof SyntaxError){
			console.log("Server sent an invalid request:");
			console.log(evt.data);
			console.log(e);
			return;
		}else{
			console.log(e);
			return;
		}
	}

	switch(msg.type){
		case "USERS":
		STATUS.innerHTML = "Connected!";
		CONNECTED = true;

		for(var userid in msg.users){
			USERS[userid] = {
				id:msg.users[userid].id,
				name:CryptoJS.AES.decrypt(msg.users[userid].name, SYMKEY).toString(CryptoJS.enc.Utf8)
			};
		}

		break;

		case "PING":
		response = {type:"PONG", data:msg.data};
		socket.send(JSON.stringify(response));
		STATUS.innerHTML += " PONG (" + msg.data + ") ";
		break;

		case "JOIN":
		msg.name = CryptoJS.AES.decrypt(msg.name, SYMKEY).toString(CryptoJS.enc.Utf8);
		var newuser = {id:msg.id, name:msg.name};
		USERS[msg.id] = newuser;
		box.innerHTML += "User joined: " + msg.name + "<br/>";
		break;

		case "MSG":
		box.innerHTML += msg.id + " (" + USERS[msg.id].name + ") " + CryptoJS.AES.decrypt(msg.data,SYMKEY).toString(CryptoJS.enc.Utf8) + "<br/>";
		break;

		case "ERROR":
		STATUS.innerHTML = "ERROR:" + msg.id + " (" + msg.data + ") Disconnect: " + msg.die + "<br/>" + STATUS.innerHTML;
		if( msg.die == true ){
			socket.close();
			STATUS.innerHTML += "<strong>Disconnect</strong>";
		}
		break;
	}
}

function boxKeyPress(event){
	if(event.keyCode == 13){
		sendMessage();
	}
}

function sendMessage(){
	var inputbox = document.getElementById("inputbox");
	if(inputbox.value == "") return;
	var message = CryptoJS.AES.encrypt(inputbox.value, SYMKEY);
	inputbox.value = "";

	var packet = {type: "MSG", data: message.toString()};
	socket.send(JSON.stringify(packet));
}
