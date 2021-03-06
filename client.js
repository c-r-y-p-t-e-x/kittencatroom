/*
	client.js!
	This code runs on the browser.
*/

SYMKEY = null;
CONNECTED = false;
USERS = {};
RESPOND_TO_PINGS = true;

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

// python style string.format
if (!String.prototype.format) {
	String.prototype.format = function() {
	var args = arguments;
	return this.replace(/{(\d+)}/g, function(match, number) { 
			return typeof args[number] != 'undefined' ? args[number] : match;
      });
    };
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
			var _users = [];
			for(var userid in msg.users){
				USERS[userid] = {
					id:msg.users[userid].id,
					name:CryptoJS.AES.decrypt(msg.users[userid].name, SYMKEY).toString(CryptoJS.enc.Utf8)
				};
				_users.push(USERS[userid].name);
			}
			putMessage("<strong>SERVER</strong>", username + " connected.");
			putMessage("<strong>SERVER</strong>", "Users connected: " + _users.join(", "));

		break;

		case "PING":
			if(RESPOND_TO_PINGS == false) return;
			response = {type:"PONG", data:msg.data};
			socket.send(JSON.stringify(response));
			STATUS.innerHTML += " PONG (" + msg.data + ") ";
		break;

		case "JOIN":
			msg.name = CryptoJS.AES.decrypt(msg.name, SYMKEY).toString(CryptoJS.enc.Utf8);
			var newuser = {id:msg.id, name:msg.name};
			USERS[msg.id] = newuser;
			putMessage("<strong>SERVER</strong>", msg.name + " connected.");
		break;

		case "MSG":
			putMessage(USERS[msg.id].name, CryptoJS.AES.decrypt(msg.data,SYMKEY).toString(CryptoJS.enc.Utf8));
		break;

		case "ERROR":
			// STATUS.innerHTML = "ERROR:" + msg.id + " (" + msg.data + ") Disconnect: " + msg.die + "<br/>" + STATUS.innerHTML;
			putMessage("<strong>ERROR</strong>", "Received error from server: (" + msg.id + ") " + msg.data);
			if( msg.die == true ){
				socket.close();
				// STATUS.innerHTML += "<strong>Disconnect</strong>";
				STATUS.innerHTML = "Disconnected.";
				putMessage("<strong>ERROR</strong>", "The server has killed your connection.");
			}
		break;
		
		case "DROP":
			putMessage("<strong>SERVER</strong>", USERS[msg.id].name + " (" + msg.id + ") has disconnected.");
			delete USERS[msg.id];
		break;
	}
}

function putMessage(uname, msg){
	var date = new Date();
	var timestamp = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
	box.innerHTML += "<span class=\"timestamp\">{0}</span><span class=\"username\">{1}</span> {2}<br/>\n".format(timestamp,uname,msg);
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
