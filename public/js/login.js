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
firebase.initializeApp(firebaseConfig);

function login() {
    var username = document.getElementById("username").value || ''
    var password = document.getElementById("password").value || ''
    console.log(username)
    console.log(password)
    firebase.auth().signInWithEmailAndPassword(username, password).then((response) => {
        if (response && response.user) {
            firebase.auth().currentUser.getIdToken(/* forceRefresh */ true).then(function (idToken) {
                return postIdTokenToSessionLogin('/sessionLogin', idToken);
            }).catch(function (error) {
                console.error(error)
                alert("Xảy ra lỗi, vui lòng thử lại sau.");
            });


        } else {
            alert("Tên đăng nhập hoặc mật khẩu sai !!!");
        }


    }).catch((err) => {
        console.error(err)
        alert("Xảy ra lỗi, vui lòng thử lại sau.");
    });
}

function postIdTokenToSessionLogin(url, idToken) {
    var data = {}
    data['idToken'] = idToken
    // construct an HTTP request
    var xhr = new XMLHttpRequest();
    xhr.open('POST', url, true)
    xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

    xhr.onload = function () {
        if (this.status == 200) {
            console.info('success')
            window.location.href = '/'
        } else {
            alert("Xảy ra lỗi, vui lòng thử lại sau.");
        }
    };
    xhr.send(JSON.stringify(data));
}
