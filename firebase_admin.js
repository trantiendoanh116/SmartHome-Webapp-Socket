var firebaseAdmin = require("firebase-admin");

var serviceAccount = require("./firebase-account-key.json");
firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
  databaseURL: "https://store-grocery-list.firebaseio.com"
});

module.exports = firebaseAdmin;