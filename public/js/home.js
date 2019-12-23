angular.module('myApp', [
	'ngRoute',
	'mobile-angular-ui',
	'btford.socket-io'
]).config(function ($routeProvider) {
	$routeProvider.when('/', {
		templateUrl: '../html/home.html',
		controller: 'Home'
	});
}).factory('mySocket', function (socketFactory) {
	var myIoSocket = io.connect('/webapp');	//Tên namespace webapp

	mySocket = socketFactory({
		ioSocket: myIoSocket
	});
	return mySocket;

	//Hàm xử lý chính
}).controller('Home', function ($scope, mySocket) {
	const EVENT_RECEIVE_DATA = "DATA";
	const EVENT_CONTROL = "CONTROL";
	//Dùng để đặt các giá trị mặc định
	$scope.fan_status = [0, 0, 0];//tương ứng với 3 mức của quạt
	$scope.led_status = 0;
	$scope.led_status_1 = 0;
	$scope.voltage_value = [0, 0, 0];
	$scope.aptomat_value = 0;
	$scope.value = {}; //Các giá trị nhiệt độ, độ ẩm, khí CO
	/*
	- Các hàm xử lý nhận điều khiển từ client (webapp/app) 
	- Dữ liệu gửi xuống esp8266:
		+ Có tên của Event (F_ON,F_OFF,L_CHANGE....). Dựa vào tên event để arduino xử lý
		+ Chuỗi JSON (Hiện thời cho vào cho đủ chứ không dùng đến)
	*/

	//Khi ấn vào nút ON điều khiển quạt -> quạt sẽ chuyển trạng thái thoe thứ tự 1->2->3->1
	$scope.onFanClick = function () {
		var json = {};
		json["fan_on"] = true;
		mySocket.emit(EVENT_CONTROL, json);
	};

	//Khi ấn vào nút OFF điều khiển quạt -> quạt lập tức tắt (các giá trị ứng với 3 mức quạt băng 0 fan_status = [0,0,0] )
	$scope.offFanClick = function () {
		var json = {};
		json["fan_off"] = true;
		mySocket.emit(EVENT_CONTROL, json);

	};


	//Khi ấn vào nút Bật/Tắt đèn: nếu đang sáng-> tắt (tắt -> sáng).
	$scope.ledClick = function () {
		var json = {};
		json["light"] = true;
		mySocket.emit(EVENT_CONTROL, json);
	};
	$scope.ledClick1 = function () {
		var json = {};
		json["light_1"] = true;
		mySocket.emit(EVENT_CONTROL, json);
	};

	//Khi ấn vào nút Bật/Tắt công tắc
	$scope.atomatClick = function () {
		var json = {};
		json["apt"] = true;
		mySocket.emit(EVENT_CONTROL, json);
	};


	/*
		- Sau khi thực hiện lệnh được gửi từ client (webapp, app) xong thì ngay lập tức Arduino sẽ đọc trạng thái 
		của các thiết bị -> trả lại cho client giúp kiểm tra xem lệnh đó đã được thưc hiện đúng chưa
		- Dữ liệu tả về client theo định dạng JSON
	*/
	mySocket.on(EVENT_RECEIVE_DATA, function (json) {
		console.log(json)
		if (json.hasOwnProperty('fan')) {
			var value = json['fan'];
			if (value == 0) {
				$scope.fan_status = [0, 0, 0];
			}else if(value == 1){
				$scope.fan_status = [1, 0, 0];
			}else if(value == 2){
				$scope.fan_status = [0, 1, 0];
			}else{
				$scope.fan_status = [0, 0, 1];
			}
		}
		if (json.hasOwnProperty('light')) {
			var value = json['light'];
			$scope.led_status = value
		}
		if (json.hasOwnProperty('light_1')) {
			var value = json['light_1'];
			$scope.led_status_1 = value
		}
		if (json.hasOwnProperty('apt')) {
			var value = json['apt'];
			$scope.apt_status = value
		}
		if (json.hasOwnProperty('temp')) {
			var value = json['temp'];
			$scope.temp = value
		}
		if (json.hasOwnProperty('humi')) {
			var value = json['humi'];
			$scope.humi = value
		}
		if (json.hasOwnProperty('co')) {
			var value = json['co'];
			$scope.co = value
		}

	});


	mySocket.on('connect', function () {
		console.log("connected webapp")
		//Khi mở webapp thì đọc trạng thái của các thiết bị ->để hiển thị trên webapp trạng thái hiện thời
		var json = {};
		json["init"] = true;
		mySocket.emit(EVENT_CONTROL, json);

	});


});