# kittencatroom
Encrypted webchat client using websockets and a Nodejs server.  
Communications are symmetrically encrypted from the browser, sent over HTTPS and WSS (secure websockets).

## Messaging Protocol
All messages are sent over a SSL/TLS websocket connection. Messages are sent as JSON strings, and must have a "type" field.  
These are the packets exchanged between the client (chatroom.html) and the server.


#### CONNECT
    { "type":"CONNECT", "roomid":"hMh67Kbb20ELC3Yo" "data":"encrypted username!" }


#### USERS
	{
		"type":"USERS",
		"data":{
			"globalid":"encrypted username",
			"owe8sF":"lion",
			"hH109l":"natalie",
			"hASo6":"snowleapord69"
		}
	}

#### MSG Request
(from client to server)

	{ "type":"MSG", "data":"encrypted message" }

#### MSG Relay
(from server to all browsers)

	{ "type":"MSG", "data":"encrypted message", "id":"hH1091" }

#### JOIN
	{ "type":"JOIN", "id":"gFpeR8", "name":"encrypted username" }

#### DROP
	{ "type":"DROP", "id":"gFpeR8" }

#### ERROR
	{
		"type":"ERROR",
		"id":"unique error id",
		"data":"information for humans",
		"die":true|false
	}
