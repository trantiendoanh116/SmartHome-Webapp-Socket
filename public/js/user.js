var firebaseConfig = {
    apiKey: "AIzaSyCZkXut96ZTsANIFBjxqsxI6eWFg1C5YXM",
    authDomain: "smarthome-116.firebaseapp.com",
    databaseURL: "https://smarthome-116.firebaseio.com",
    projectId: "smarthome-116",
    storageBucket: "smarthome-116.appspot.com",
    messagingSenderId: "1055864949441",
    appId: "1:1055864949441:web:ea1474b982167625cde240"
};
// Initialize Firebase
var app = firebase.initializeApp(firebaseConfig);
initApp = function () {
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            // User is signed in.
            var displayName = user.displayName;
            var email = user.email;
            var emailVerified = user.emailVerified;
            var photoURL = user.photoURL;
            var uid = user.uid;
            var phoneNumber = user.phoneNumber;
            var providerData = user.providerData;
            user.getIdToken().then(function (accessToken) {

                document.getElementById('account-details').textContent = JSON.stringify({
                    displayName: displayName,
                    email: email,
                    emailVerified: emailVerified,
                    phoneNumber: phoneNumber,
                    photoURL: photoURL,
                    uid: uid,
                    accessToken: accessToken,
                    providerData: providerData
                }, null, '  ');
            });
        }
    }, function (error) {
        console.error(error);
    });
};
window.addEventListener('load', function () {
    initApp();
});
//action Sign out
function signOutUser() {
    firebase.auth().signOut().then(function () {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/logout', true)
        xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

        xhr.onload = function (data) {
            window.location.href = '/login'
        };
        xhr.send();
    }).catch(function (error) {
        console.error(error)
    });
}