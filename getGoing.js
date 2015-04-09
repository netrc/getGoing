
var gg = {};
gg.mStr = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ]
gg.wStr = [ "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" ];

var GGApp = angular.module('GGApp', ["ngCookies"]);

GGApp.controller('GGLoginCtrl', function ($scope, $cookies){
    var x = $cookies.getGoingUserName;  // so we can read this in the debugger
    console.log("ggun cookie:"+x+".");
    if ( !$cookies.getGoingUserName) {
      $scope.loginstate = "login";          // first time, no cookie, wait
    } else {
      $scope.username = $cookies.getGoingUserName;
      $scope.loginstate = "logout";
      $scope.$emit('doLogin',$scope.username);  // first time, use cookie
    }

    $scope.dologinstate = function() {
      if ($scope.loginstate == "login") {
        console.log("login " + $scope.username);
        if (!$scope.username) { // empty?
          return;
        }
        $cookies.getGoingUserName = $scope.username;
        $scope.loginstate = "logout";
        $scope.$emit('doLogin',$scope.username);
      } else { // logout
        console.log("logout!" + $scope.username);
        $scope.username = '';
        delete $cookies.getGoingUserName;
        $scope.loginstate = "login";
        $scope.$emit('doLogout');
      }
    };
    // Facebook login fiddle http://jsfiddle.net/z6u2z75z/
  });

GGApp.controller('GGMainCtrl', function ($scope, $http){

    // fist time initialization; show (at least) the day and time!
    t = new Date();
    $scope.dateStr = gg.wStr[t.getDay()] + " " + t.getDate() + " " + gg.mStr[t.getMonth()] + " " + t.getFullYear();

    $scope.emptyData = function() {
      ///////
      // the user's data, an array of objects, with timeStr and taskStr
      $scope.userName = ""; // wait for login
      $scope.ggNoEdit = true; // wait for login action
      $scope.ggTaskTimes = [ ];
      // this is an array, because Date returns day of week as 0-6
      $scope.ggWeekDays = [ { w:"Sunday", s:"" }, { w:"Monday", s:"" }, { w:"Tuesday", s:"" }, { w:"Wednesday", s:"" }, { w:"Thursday", s:"" }, { w:"Friday", s:"" }, { w:"Saturday",s:"" } ];
      // this is an object, propert keys are date, e.g. 25 June, vals are string
      $scope.ggSpecialDays = { };
      $scope.ggWeatherCity= "";

      $scope.specialDayStr = "";
      $scope.weekDayStr = "";
      //////
    };

    $scope.emptyData(); // then wait for login

    $scope.getUserData = function() {
      // use 'return' so controller knows when promise is resolved; runs apply
      return $http.get($scope.ggStoragePath).success(function(data) {
        if (data.ggTaskTimes) {
          $scope.ggTaskTimes = data.ggTaskTimes;
        }
        if (data.ggSpecialDays) {
          $scope.ggSpecialDays = data.ggSpecialDays;
        }
        if (data.ggWeekDays) {
          $scope.ggWeekDays = data.ggWeekDays;
        }
        if (data.ggWeatherCity) {
          $scope.ggWeatherCity = data.ggWeatherCity;
        }
        $scope.weekDayStr = $scope.ggWeekDays[t.getDay()].s;
        thisday = t.getDate() + " " + gg.mStr[t.getMonth()];
        if ($scope.ggSpecialDays[ thisday ]) {
          $scope.specialDayStr = $scope.ggSpecialDays[ thisday ];
        }
        $scope.cleanData = false;   // redo the data calcs
      }).error(function(data) {
        // need to check if network/server error or if not found--> set defaults
        console.log("httpget error status: " + data.status + ": " + data.statusText);
        if (data.status == 404) {
          // first time; assume data has been reset (see above) or from logout
          return;
        }
        alert("Error getting " + $scope.userName + " data. (" + $scope.ggStoragePath + "). error status: " + data.status + ": " + data.statusText);
      }) ;
    };

    $scope.checkData = function () {
      if ($scope.cleanData) { 
        return 
      }; // apparently, clean

      var cnow=new Date();
      var cs = cnow.getHours()*60*60 + cnow.getMinutes()*60 + cnow.getSeconds();
      $scope.ggTaskTimes.forEach(function(t) {
        var i = t.t.indexOf(":");
        var th = t.t.substr(0,i);
        var tm = t.t.substr(i+1);
        t.ts = th * 60 + 1*tm;
        //console.log("cd:" + t.t + " th:" + th + " tm:" + tm + "  secs:" + ts);
        sToGo = t.ts*60-cs;
        console.log("checkData: " + t.s +" : " + t.t + " ... " + sToGo);
        if (sToGo < 1) {
          $scope.goRed(t);
        } else {
          var z = setTimeout(function(){$scope.goRed(t)},sToGo*1000);
        }
      } );
      // now go through and (re)-set the array of todos
      $scope.todoArray = [];
      var i = 0;
      $scope.ggTaskTimes.forEach(function(t) {
        $scope.todoArray.push( {ts:(t.ts-120), d:'startCountdown', i:i} );
        $scope.todoArray.push( {ts:t.ts, d:'goRed', i:i} );
        i++;
      } );
      // sort todoArray
      // run through logic for all secs up to now
      $scope.cleanData = true;
    };

    $scope.goRed = function (t) {
      console.log("goRed: " + t.s);
      document.getElementById("t"+t.t).className += " ggRed";
      document.getElementById("s"+t.t).className += " ggRed";
    };

    $scope.timeCheck = function () {
      $scope.checkData();

      var tnow=new Date();
      var h=tnow.getHours();
      var m=tnow.getMinutes();
      if (m<10) {m = "0" + m};  // add zero in front of numbers < 10
      var s=tnow.getSeconds();
      if (s<10) {s = "0" + s};  // add zero in front of numbers < 10
      $scope.timeStr = h + ":" +m;
      $scope.secsStr = s;
      $scope.$apply();
      var t = setTimeout(function(){$scope.timeCheck()},1000);
      //$scope.$timeout(function(){$scope.timeCheck()},1000);  // auto-call 'apply'
      //return $scope.$timeout(function(){$scope.timeCheck()},1000);  // auto-call 'apply'
    };

    $scope.$on('doLogin', function(e,uname) { 
      console.log("doLogin " + uname); 
      _gaq.push(['_trackEvent', 'User', 'Login', uname]);
      $scope.userName = uname;  // thanks, login controller
      $scope.ggNoEdit = false; // ok to edit now
      $scope.ggnamePath = "gnetrc";
      //$scope.ggStoragePath = "http://getgoing1.s3.amazonaws.com/"+$scope.userName+"/ggTaskTimes.json";
      $scope.ggStoragePath = "http://getgoing1.s3.amazonaws.com/"+$scope.userName+".json";
      console.log($scope.ggStoragePath);
      $scope.getUserData();
    } );

    $scope.$on('doLogout', function(e,args) { 
      console.log("doLogout "); 
      _gaq.push(['_trackEvent', 'User', 'Logout', $scope.userName]);
      $scope.emptyData();
    } );

    $scope.timeCheck();  // init - show the time

    $scope.addTimeTask = function( ) {
      console.log("addTimeTask " + $scope.addTime + " - " + $scope.addTask);
      $scope.ggTaskTimes.push( { t:$scope.addTime, s:$scope.addTask } );
      $scope.addTime = "";
      $scope.addTask = "";
      $scope.storeData();
    };
    $scope.removeTime = function( t ) {
      console.log("removetime " + t);
      $scope.ggTaskTimes = $scope.ggTaskTimes.filter( function(n){ 
        return n.t != t; });
      $scope.storeData();
    };
    $scope.updateWeekDay = function( w ) {
      console.log("updateWeekDay ");
      $scope.weekDayStr = $scope.ggWeekDays[t.getDay()].s; // in case its today
      $scope.storeData();
    }
    $scope.clearWeekDay = function( w ) {
      var n = gg.wStr.indexOf(w);
      console.log("clearWeekDay " + w + " " + n);
      $scope.ggWeekDays[n].s = "";
      $scope.weekDayStr = $scope.ggWeekDays[t.getDay()].s; // in case its today
      $scope.storeData();
    }
    $scope.addSpecialDay = function( ) {
      console.log("addSpecialDay " + $scope.sdaddDay + " - " + $scope.sdaddWhat);
      if ( ($scope.sdaddDay) && ($scope.sdaddWhat)) {
      //$scope.ggSpecialDays.push( { d:$scope.sdaddDay, w:$scope.sdaddWhat } );
        $scope.ggSpecialDays[ $scope.sdaddDay ] = $scope.sdaddWhat;
        $scope.sdaddDay = "";
        $scope.sdaddWhat = "";
        $scope.storeData();
      }
    };
    $scope.removeSpecialDay = function( d ) {
      console.log("removeSpecialDay " + d);
      delete $scope.ggSpecialDays[ d ]; 
      $scope.storeData();
    };
    $scope.changeWeatherCity = function( w ) {
      console.log("changeWC " + $scope.ggWeatherCity);
      $scope.storeData();
    }

    $scope.storeData = function( t ) {
      $.ajax({
        type: "PUT",
        url: $scope.ggStoragePath,
        dataType: 'json',
        async: false,
        data: JSON.stringify({ 
          "ggTaskTimes": $scope.ggTaskTimes, 
          "ggWeekDays": $scope.ggWeekDays, 
          "ggSpecialDays": $scope.ggSpecialDays,
          "ggWeatherCity": $scope.ggWeatherCity })
      }); 
      _gaq.push(['_trackEvent', 'User', 'edit', $scope.userName]);
      $scope.cleanData = false;   // redo the data calcs
      $scope.checkData(); // should be autocalled somehow
    // see http://naleid.com/blog/2013/05/22/saving-json-client-side-to-an-s3-bucket
    // interesting, but not used here; http://christophervachon.com/blog/2014/08/02/aws-s3-connecting-and-getting-a-list-of-objects
    };
  });
