const PORT = 3484;									

var http = require('http');
var express = require('express');
const path = require('path');
const router = express.Router();
var bodyParser = require("body-parser");
var cookieParser = require('cookie-parser');						
var socketio = require('socket.io')
var admin = require('./firebase_admin')
require('firebase')

//var ip = require('ip');
var app = express();									
var server = http.Server(app)

var io = socketio(server);							
//Tạo namespace để phân biêt SocketClient trên Esp và webapp
var webapp_nsp = io.of('/webapp')			
var esp8266_nsp = io.of('/esp8266')				

var middleware = require('socketio-wildcard')();	//Để có thể bắt toàn bộ lệnh!
esp8266_nsp.use(middleware);						//Khi esp8266 emit bất kỳ lệnh gì lên thì sẽ bị bắt
webapp_nsp.use(middleware);							//Khi webapp emit bất kỳ lệnh gì lên thì sẽ bị bắt

var ip = require('ip');
server.listen(PORT);
console.log("Server nodejs chay tai dia chi: " + ip.address() + ":" + PORT)										// Cho socket server (chương trình mạng) lắng nghe ở port 3484
//Cài đặt webapp các fie dữ liệu tĩnh
app.use(express.static("node_modules/mobile-angular-ui")) 		
app.use(express.static("node_modules/angular")) 							
app.use(express.static("node_modules/angular-route")) 				
app.use(express.static("node_modules/socket.io-client")) 
app.use(express.static("node_modules/angular-socket-io"))	
app.use(express.static("node_modules/firebase"))	
app.use(express.static("public"))
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));		

app.use('/', router)

app.use('/', router);

router.get('/home', function (req, res) {
  checkAuth(req,function (authenticated) {
    if (authenticated) {
      res.sendFile(path.join(__dirname + '/public/html/index.html'));
    } else {
    
      res.redirect('/login');
    }
  });
 

});

router.get('/', function (req, res) {
  res.redirect('/home');

});

router.get('/login', function (req, res) {
  checkAuth(req,function (authenticated) {
    if (authenticated) {
      res.redirect('/user');
    } else {
      res.sendFile(path.join(__dirname + '/public/html/login.html'));
    }
  });

 

});

router.get('/user', function (req, res) {
  checkAuth(req,function (authenticated) {
    if (authenticated) {
      res.sendFile(path.join(__dirname + '/public/html/user.html'));
    } else {
      res.redirect('/login');
    }
  });
  
});


router.post('/sessionLogin', function (req, res, next) {

  if (!req.body.hasOwnProperty("idToken")) {
    console.info("UNAUTHORIZED REQUEST!")
    res.status(401).send('UNAUTHORIZED REQUEST!');
    return;
  }
  const idToken = req.body.idToken.toString();
  console.info("idToken: " + idToken);
  // Set session expiration to 5 days.
  const expiresIn = 60 * 60 * 24 * 5 * 1000;
  admin.auth().createSessionCookie(idToken, { expiresIn })
    .then((sessionCookie) => {
      // Set cookie policy for session cookie.
      const options = { maxAge: expiresIn, httpOnly: true };
      res.setHeader('Cache-Control', 'private');
      res.cookie('authtoken', sessionCookie);
      res.end(JSON.stringify({ status: 'success' }));
    }, error => {
      console.info("UNAUTHORIZED REQUEST!")
      res.status(401).send('UNAUTHORIZED REQUEST!');
    });
});


router.post('/logout', (req, res) => {
  const authtoken = req.cookies.authtoken || '';
  res.clearCookie('authtoken');
  admin.auth().verifySessionCookie(authtoken)
    .then((decodedClaims) => {
      return admin.auth().revokeRefreshTokens(decodedClaims.sub);
    })
    .then(() => {
      res.end(JSON.stringify({ status: 'success' }));
    })
    .catch((error) => {
      res.end(JSON.stringify({ status: 'success' }));
    });
});

function checkAuth(req,callback) {
  const authtoken = req.cookies.authtoken || '';
  //console.info("cookies ->" + req.cookies)
  admin.auth().verifySessionCookie(authtoken, true)
    .then((decodedClaims) => {
      console.info("Authenticated")
      callback(true)
    }).catch(() => {
      console.info("Not authenticated")
      callback(false)
    });

}


//Bắt các sự kiện từ esp8266 gửi lên -> gửi toàn bộ dữ liệu cho webapp
esp8266_nsp.on('connection', function(socket) {
	console.log('esp8266 connected')
	
	socket.on('disconnect', function() {
		console.log("Disconnect socket esp8266")
	})
	

	socket.on("*", function(packet) {
		console.log("esp8266 rev and send to webapp packet: ", packet.data)

		var eventName = packet.data[0]
		var eventJson = packet.data[1] || {} 
		//console.log("Name: " + eventName + ", Json: " + eventJson);
		webapp_nsp.emit(eventName, eventJson) //gửi toàn bộ lệnh + json đến webapp
	})
})

//Bắt các sự kiện từ webapp -> gửi toàn bộ dữ liệu xuống esp8266

webapp_nsp.on('connection', function(socket) {
	
	console.log('webapp connected')
	

	socket.on('disconnect', function() {
		console.log("Disconnect socket webapp")
	})
	
	socket.on('*', function(packet) {
		console.log("webapp rev and send to esp8266 packet: ", packet.data)
		var eventName = packet.data[0]
		var eventJson = packet.data[1] || {}
		esp8266_nsp.emit(eventName, eventJson)
	});
})