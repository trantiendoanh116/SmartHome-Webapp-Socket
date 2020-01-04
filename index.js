const PORT = 3484;

var http = require('http');
var express = require('express');
const path = require('path');
const router = express.Router();
var bodyParser = require("body-parser");
var cookieParser = require('cookie-parser');
var socketio = require('socket.io')
var admin = require('./firebase_admin')

var app = express();
var server = http.Server(app)
var ip = require('ip');

var io = socketio(server);
//Tạo namespace để phân biêt SocketClient trên Esp, webapp, AndroidApp
var webapp_nsp = io.of('/webapp')
var android_nsp = io.of('/android')
var esp8266_nsp = io.of('/esp8266')


var middleware = require('socketio-wildcard')();
esp8266_nsp.use(middleware);
webapp_nsp.use(middleware);
android_nsp.use(middleware);


server.listen(process.env.PORT || PORT);
console.log("Server nodejs chay tai dia chi : " + ip.address() + ":" + PORT)
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

router.get('/home', function (req, res) {
  checkAuth(req, function (authenticated) {
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
  checkAuth(req, function (authenticated) {
    if (authenticated) {
      res.redirect('/user');
    } else {
      res.sendFile(path.join(__dirname + '/public/html/login.html'));
    }
  });



});

router.get('/user', function (req, res) {
  checkAuth(req, function (authenticated) {
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
  // Set session expiration to 14 days.
  const expiresIn = 14 * 60 * 60 * 24 * 1000;
  admin.auth().createSessionCookie(idToken, { expiresIn })
    .then((sessionCookie) => {
      // Set cookie policy for session cookie.
      res.setHeader('Cache-Control', 'private');
      res.cookie('authtoken', sessionCookie, { expires: new Date(Date.now() + expiresIn), httpOnly: true });
      res.end(JSON.stringify({ status: 'success' }));
    }, error => {
      console.error(error)
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

function checkAuth(req, callback) {
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
esp8266_nsp.on('connection', function (socket) {
  console.log('esp8266 connected and update value')

  var eventJsonInit = {}
  eventJsonInit["init"] = true;
  esp8266_nsp.emit("CONTROL", eventJsonInit);

  socket.on('disconnect', function () {
    console.log("Disconnect socket esp8266")
  });


  socket.on("*", function (packet) {
    console.log("Esp8266 send to webapp/android packet: ", packet.data)

    var eventName = packet.data[0]
    var eventJson = packet.data[1] || {}
    //console.log("Name: " + eventName + ", Json: " + eventJson);
    //webapp_nsp.emit(eventName, eventJson) //gửi toàn bộ lệnh + json đến webapp
    android_nsp.emit(eventName, eventJson) //gửi toàn bộ lệnh + json đến webapp
  });
});

//Bắt các sự kiện từ webapp -> gửi toàn bộ dữ liệu xuống esp8266

// webapp_nsp.on('connection', function (socket) {

//   console.log('webapp connected')
//   var eventJsonInit = {}
//   eventJsonInit["init"] = true;
//   esp8266_nsp.emit("CONTROL", eventJsonInit);
//   console.log("Android app send to esp8266 packet: ", eventJsonInit)

//   socket.on('disconnect', function () {
//     console.log("Disconnect socket webapp")
//   })

//   socket.on('*', function (packet) {
//     console.log("Webapp send to esp8266 packet: ", packet.data)
//     var eventName = packet.data[0]
//     var eventJson = packet.data[1] || {}
//     esp8266_nsp.emit(eventName, eventJson)
//   });
// });
//Bắt các sự kiện từ android app -> gửi toàn bộ dữ liệu xuống esp8266
android_nsp.on('connection', function (socket) {

  console.log('Android app connected')
  // var eventJsonInit = {}
  // eventJsonInit["init"] = true;
  // esp8266_nsp.emit("CONTROL", eventJsonInit);
  // console.log("Android app send to esp8266 packet: ", eventJsonInit)
  // socket.on('disconnect', function () {
  //   console.log("Disconnect socket Android app")
  // })

  socket.on('*', function (packet) {
    console.log("Android app send to esp8266 packet: ", packet.data)
    var eventName = packet.data[0]
    var eventJson = packet.data[1] || {}
    esp8266_nsp.emit(eventName, eventJson)
  });
});
