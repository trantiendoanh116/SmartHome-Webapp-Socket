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
	//Dùng để đặt các giá trị mặc định
	$scope.fan_status = [1, 0, 0];//tương ứng với 3 mức của quạt
	$scope.led_status = [1];
	$scope.voltage_value = [0, 0, 0];
	$scope.aptomat_value = [1];
	$scope.value = {}; //Các giá trị nhiệt độ, độ ẩm, khí CO
	/*
	- Các hàm xử lý nhận điều khiển từ client (webapp/app) 
	- Dữ liệu gửi xuống esp8266:
		+ Có tên của Event (F_ON,F_OFF,L_CHANGE....). Dựa vào tên event để arduino xử lý
		+ Chuỗi JSON (Hiện thời cho vào cho đủ chứ không dùng đến)
	*/

	//Khi ấn vào nút ON điều khiển quạt -> quạt sẽ chuyển trạng thái thoe thứ tự 1->2->3->1
	$scope.onFanClick = function () {
		console.log("Button on control FAN clicked");
		mySocket.emit("F_ON", true);
	};

	//Khi ấn vào nút OFF điều khiển quạt -> quạt lập tức tắt (các giá trị ứng với 3 mức quạt băng 0 fan_status = [0,0,0] )
	$scope.offFanClick = function () {
		mySocket.emit("F_OFF", true);
	};


	//Khi ấn vào nút Bật/Tắt đèn: nếu đang sáng-> tắt (tắt -> sáng).
	$scope.ledClick = function () {
		mySocket.emit("L_CHANGE", true);
	};

	//Khi ấn vào nút Bật/Tắt công tắc
	$scope.atomatClick = function () {
		mySocket.emit("AT_CHANGE", true);
	};


	/*
		- Sau khi thực hiện lệnh được gửi từ client (webapp, app) xong thì ngay lập tức Arduino sẽ đọc trạng thái 
		của các thiết bị -> trả lại cho client giúp kiểm tra xem lệnh đó đã được thưc hiện đúng chưa
		- Dữ liệu tả về client theo định dạng JSON
	*/
	mySocket.on('F_STATUS', function (json) {
		$scope.fan_status = json
	});

	mySocket.on('L_STATUS', function (json) {
		$scope.led_status = json
	});

	mySocket.on('V_VALUE', function (json) {
		$scope.voltage_value = json
	});

	mySocket.on('AT_STATUS', function (json) {
		$scope.aptomat_value = json
	});


	mySocket.on('THC_STATUS', function (json) {
		$scope.value = json
	});





	mySocket.on('connect', function () {
		console.log("connected webapp")
		//Khi mở webapp thì đọc trạng thái của các thiết bị ->để hiển thị trên webapp trạng thái hiện thời
		mySocket.emit("FAN");
		mySocket.emit("LED");
		mySocket.emit("APTOMAT");
		mySocket.emit("VOLTAGE");
		mySocket.emit("T_H_C");

	});


});