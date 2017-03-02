// Created by Hashim Hayat (hh1316)
// New York University
// Defination of Request, Response and App objects here

const net = require('net');

const statusCodes = {
						200: "OK", 
						404: "Not Found",
						500: "Internal Server Error",
						400: "Bad Request",
						301: "Moved Permanently",
						302: "Found",
						303: "See Other"
};

const fileTypes = {
						'.jpeg': 'image/jpeg',
						'.jpg': 'image/jpeg',
						'.png': 'image/png',
						'.gif': 'image/gif',
						'.html': 'text/html',
						'.css': 'text/css',
						'.txt': 'text/plain'
};

/*
	Request Class
*/

class Request {

	// Creates a new request object based on the string passed in.
    constructor(s) {
		this.rawReq = s;
        this.method = s.split(' ')[0];
        this.path = this.resolvePath(s.split(' ')[1]);
        this.headers = this.extractHeaders(s);
        this.body = this.extractBody(s);
    }

    // convert headers into a string and returns an the headers object
    extractHeaders(s){
		const req = s.split('\r\n\r\n')[0].split('\r\n').slice(1);
		const headers = {};

		req.forEach(function(p){
			const pair = p.split(': ');
			headers[pair[0]] = pair[1];
		});
		return headers;
    }

    // extracts the body from the string and returns
    extractBody(s){
		return s.split('\r\n\r\n')[1];
    }

	// resolves the pathname looking at trailing /
	resolvePath(path){
		if (path.length > 1 && path.charAt(path.length - 1) === "/"){
			path = path.slice(0, path.length - 1);
		}
		return path;
	}
}

// converts the request back to string
Request.prototype.toString = function(){
	return this.rawReq;
};

/*
	Response Class
*/

class Response {

	constructor(socket){
		this.sock = socket;
		this.headers = {};
		this.body = undefined;
		this.statusCode = undefined;
		this.open = true;		// Status of socket -> True: Open False: Close
	}

	// adds a new header name and header value pair to this Response object's internal headers property
	setHeader(name, value){
		this.headers[name] = value;
	}

	// sends data to the client by calling the write method on this Response object's internal socket 
	// object (essentially a pass-through / proxy method to call the same method on this.sock)
	write(data){
		if (this.open){
			this.sock.write(data);
		} else {
			console.warn('Connection Closed!');
		}
	}

	// sends data and ends the connection by callings the end method on this Response object's internal 
	// socket object (essentially a pass-through / proxy method to call the same method on this.sock)
	end(data) {
		if (this.open){
			this.sock.write(data);
			this.open = false;
			this.sock.end();
		} else {
			console.warn('Connection Closed!');
		}
	}

	// sets the statusCode and the body of this Request object, sends the valid http response to the client, 
	// and closes the connection. Essentially, it sets response properties, converts the Response to a string 
	// uses the Response object's end method to send the response and close the connection… all in one method call.
	send(statusCode, body){

		this.statusCode = statusCode;
		this.body = body;

		// Sending data and closing the connection
		this.end(this.toString());
	}

	// sets the statusCode, and writes everything but the body, and leaves the connection open; this is simply a 
	// combination of setting the statusCode property and calling this.write
	writeHead(statusCode){

		// Updating Status Code
		this.statusCode = statusCode;

		// Writing to the socket without closing the connection
		this.write(this.toString());
	}

	// redirects to the supplied url using the supplied statusCode… if statusCode is no given, 
	// then default to permanent redirect, 301 (for the redirect to work, the appropriate header 
	// must be set to the url provided!). Lastly, immediately sends response and closes connection.
	redirect(statusCode, url){

		if (arguments.length === 1) {
			this.setHeader('Location', statusCode);
			this.statusCode = 301;
		} else {
			this.statusCode = statusCode;
			this.setHeader('Location', url);
		}

		this.end(this.toString());
	}

	callback(err, type, data){

		if (!err){

			if (['image/jpeg','image/png','image/gif'].includes(type)){
				this.setHeader("Content-Type", type);
				this.writeHead(200);
				this.write(data);
				this.sock.end();
			} else {
				this.setHeader("Content-Type", type);
				this.send(200, data);
			}

		} else {
			this.writeHead(500);
			this.end("file can't be found!");
		}
    }

    // sends file specified by fileName (which will be searched for in $PROJECT_ROOT/public) 
    // to client by specifying appropriate content type, writing the data from the file… and 
    // immediately closing the connection after the data is sent
    sendFile(fileName){

		const fs = require('fs');
		const filePath = __dirname + '/../public' + fileName;

		let contentType = undefined;
		let supportedType = false;

		for (const type in fileTypes) {
			if (fileTypes.hasOwnProperty(type)) {
				if (filePath.search(type) > -1){
					contentType = fileTypes[type];
					supportedType = true;
				}
			}
		}

		if (supportedType){

			if (['image/jpeg','image/png','image/gif'].includes(contentType)){
				fs.readFile(filePath, (err, data) => {
					this.callback(err,contentType,data);
				});

			} else {
				fs.readFile(filePath, 'utf8', (err, data) => {
					this.callback(err,contentType,data);
				});
			}

		} else {
			console.warn("Unsupported File Type.");
			this.callback('unsupportedFile', "text/plain", "unsupported file type\n");
		}
   
    }
}

Response.prototype.toString = function(){
	
	// Adding the status line
	let response = "HTTP/1.1 " + this.statusCode + " " + statusCodes[this.statusCode] + "\r\n";

	// Puting in headers

	//console.warn(this.headers);
	if (this.headers){
		for (const key in this.headers) {
			if (this.headers.hasOwnProperty(key)) {
				response += key + ": " + this.headers[key] + "\r\n";
			}
		}
	}

	response += "\r\n";

	// Puting in the body
	if (this.body){	
		response += this.body;
	}
	
	return response;
};

/*
	App Class
*/

class App {
	
	constructor() {
		this.server = net.createServer(this.handleConnection.bind(this));
		this.routes = {};
    }	
	
	// adds path as a property name in routes… the value of which is the callback function, 
	// cb (again, assumes support only for GET requests)
	get(path, cb){
		this.routes[path] = cb;
	}

	// binds the server to the given port and host ("listens" on host:port)
	listen(PORT, HOST){
		this.server.listen(PORT, HOST);
		console.log("listening on PORT: " + PORT + " HOST: " + HOST + "\n");
	}

	// the function called when a client connects to the server… this will simply set the callback 
	// for the socket's on method: sock.on('data', ...) to the function below, handleRequestData
	handleConnection(sock){
		sock.on('data', this.handleRequestData.bind(this,sock));
	}

	// the function called when the socket receives data from the client (our framework will not 
	// have a timeout, it'll just assume that once it receives data, that the data received is the 
	// entire request)… this is where most of the logic of our framework will go; it processes a request 
	// and sends back a response!
	handleRequestData(sock, binaryData){

		// convert the incoming data to a string

		const httpRequest = binaryData + '';

		// create a new Request object based on that string
		//req - the incoming http request
		const req = new Request(httpRequest);

		// create a new Response
		// res - the resulting http response
		const res = new Response(sock);
		
		// determine if the request is valid by checking for a Host header (it'll return a 400 if the request isn't valid)

		const validRequest = (req.headers['Host'] === '400') ? false : true;

		if (validRequest){

			// look up the function to call in this.routes by using the path property from the incoming Request object … 
			// make sure that urls with and without a trailing slash (/) map to the same function

			const action = this.routes[req.path];	// callback function for the path

			// call that function, passing in the Request and Response objects created above as arguments

			if (action) {
				action(req, res);
			} 

			// if the path doesn't exist in this.routes, then send back a 400
			else {
				res.send(404, "Error Code: 404 " + statusCodes[404]); 
			}

		}

		// sets a callback for when the connection is closed (the callback will be to log the response using logResponse below)

		sock.on('close', this.logResponse.bind(this, req, res));
	}

	// logs out the http request method and path… as well as the response status code and short message
	logResponse(req, res){
		const response = req.method + " " + req.path + " " + res.statusCode + " " + statusCodes[res.statusCode] + "\n";
		console.log(response);
	}
}

module.exports = {
	App: App,
	Request: Request,
	Response: Response
};

