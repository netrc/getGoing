
var gg = {};
gg.mStr = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
gg.wStr = [ "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" ];

var GGApp = angular.module('GGApp', ["ngCookies", "backand"]);

GGApp.config(function (BackandProvider, $httpProvider) {
      BackandProvider.setAppName('getgoing');
      BackandProvider.setSignUpToken('a75d782c-73bc-490a-8868-e88be37abd0d');
      BackandProvider.setAnonymousToken('e99dd9a6-c15a-4954-804f-34eb1bc886f4');
      //BackandProvider.setDefaultHeader();

$httpProvider.interceptors.push(function($q, $log, $cookieStore) {
  return {
   'request': function(config) {
     config.headers['Authorization'] = $cookieStore.get('backand_token');
console.log("htppi " + config.headers['Authorization']);
     return config;
    }
  };
});



  });

// otherwise put F name in place of function
GGApp.factory('DataF',['$http', 'Backand', function ($http, Backand) {
  var df = {};
    // vm.getList = function(name, sort, filter) 
console.log('DataF setup');
console.log('DataF ba' + Backand.getApiUrl());
  df.getSchedules = function() {
      return $http({
        method: 'GET',
        //url: Backand.getApiUrl() + '/1/objects/' + name,
        url: 'https://api.backand.com/' + '1/schedules',
        params: {
          pageSize: 20,
          pageNumber: 1
          //,
          //filter: filter || '',
          //sort: sort || ''
        } });
    };
  return df;
}]);



GGApp.service('AuthService', ['Backand', AuthService]);

function AuthService(Backand) { // this is why todoswithusers uses SEF, global namespace pollution

        var self = this;
        self.currentUser = {};

        loadUserDetails();

        function loadUserDetails() {

            return Backand.getUserDetails()
                .then(function (data) {
                    self.currentUser.details = data;
                    if(data !== null)
                        self.currentUser.name = data.username;
                });

        }

        self.getSocialProviders = function () {
            return Backand.getSocialProviders()
        };

        self.socialSignin = function (provider) {
            //Backand.setRunSignupAfterErrorInSigninSocial(false); //by default run sign-up if there is no sign in
            return Backand.socialSignin(provider)
                .then(function (response) {
                    loadUserDetails();
                    return response;
                }).catch( function (e) { console.log("ssin, bssin e: " + e); } );
        };

};




GGApp.controller('GGLoginCtrl', function GGApp_GGLoginCtrl($scope, $cookies){
    var x = $cookies.getGoingUserName;  // so we can read this in the debugger
    console.log("ggun cookie:"+x+".");
    if ( !$cookies.getGoingUserName) {
      $scope.loginstate = "login";          // first time, no cookie, wait
    } else {
      $scope.username = $cookies.getGoingUserName;
      $scope.loginstate = "logout";
      $scope.$emit('doLogin',$scope.username);  // first time, use cookie
    }


    $scope.dologinstate = function GGLoginCtrl_dologinstate() {
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

GGApp.controller('GGMainCtrl', ['$scope', '$http', 'DataF', 'AuthService', function GGApp_GGMainCtrl($scope, $http, DataF, AuthService){
	// see main section at bottom

    $scope.emptyData = function GGMainCtrl_emptyData() {
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

    $scope.getUserData = function GGMainCtrl_getUserData() {
      // use 'return' so controller knows when promise is resolved; runs apply
      return $http.get($scope.ggStoragePath).success(function(data) {
      	// collect the data from the file, if set
        ['ggTaskTimes','ggSpecialDays','ggWeekDays','ggWeatherCity'].forEach(function getUserData_setVals(s) {
        	if (data[s]) {
        		// need to set prog bar to Hide a.s.a.p.
        		if (s == 'ggTaskTimes') {
      				data[s].forEach(function getUserData_setHide(t) {
      					$scope.ggHideProg[t.t] = true;
      				});        			
        		}
          		$scope[s] = data[s];
          	}
        });
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

    $scope.checkData = function GGMainCtrl_checkData() {
      if ($scope.cleanData) { 
        return;
      } // apparently, clean

      // now go through and (re)-set the array of todos
      $scope.todoArray = [];
      var cnow=new Date();
      var cs = cnow.getHours()*60*60 + cnow.getMinutes()*60 + cnow.getSeconds();
      $scope.ggTaskTimes.forEach(function checkData_settodoTimes(t) {
        var i = t.t.indexOf(":");
        var th = t.t.substr(0,i);
        var tm = t.t.substr(i+1);
        t.ts = th*60*60 + tm*60;		// n.b. this is used in template order-by
        var d = { tp: t.ts-120, t:t, x:''};
        $scope.ggHideProg[t.t] = true;
        $scope.barwidth[t.t] = "0%";
        //console.log("cd:" + t.t + " th:" + th + " tm:" + tm + "  secs:" + ts);
        console.log("checkData: " + t.s +" : " + t.t + " ... " + t.ts);
        $scope.todoArray.push( d );
      } );
      // sort todoArray  - ???
      $scope.cleanData = true;
    };

    $scope.idReplaceClass = function GGMainCtrl_idReplaceClass (id,oc,nc) {
      var cStr =     document.getElementById(id).className;
      cStr = cStr.split(oc).join(' ') + " " + nc;
      document.getElementById(id).className = cStr;
    };
    $scope.idAddClass = function GGMainCtrl_idAddClass (id,nc) {
      document.getElementById(id).className += " " + nc;
    };

    $scope.goRed = function GGMainCtrl_goRed (t) {
      console.log("goRed: " + t.s);
      $scope.idReplaceClass("t"+t.t, 'ggProg', 'ggRed');
      $scope.idReplaceClass("s"+t.t, 'ggProg', 'ggRed');
      // unset/hide prog bar
      $scope.ggHideProg[t.t] = true;
    };

    $scope.goProg = function GGMainCtrl_goProg (d, s) {
      console.log("goProg: " + d.t.s);
      if (d.x != "prog") { // add the class only once
      		$scope.idAddClass("t"+d.t.t, "ggProg");
		    $scope.idAddClass("s"+d.t.t, "ggProg");      	
      }
      d.x = "prog";
      $scope.ggHideProg[d.t.t] = false;
      //var pc= { 'width': ((s-d.tp)/120*100).toFixed(1)+"%" };
      //$scope.barwidth[d.t.t] = pc;
      //console.log("goProg - ",pc);
      var pc= ((s-d.tp)/120*100).toFixed(1)+"%" ;
      document.getElementById("bar"+d.t.t).style.width = pc;
    };

    $scope.timeCheck = function GGMainCtrl_timeCheck() {
      $scope.checkData();

      var tnow=new Date();
      var h=tnow.getHours();
      var m=tnow.getMinutes();
      var s=tnow.getSeconds();
      var thisSec = h*60*60 + m*60 + s;
      if (m<10) {m = "0" + m;}  // add zero in front of numbers < 10
      if (s<10) {s = "0" + s;}  // add zero in front of numbers < 10
      $scope.timeStr = h + ":" +m;
      $scope.secsStr = s;
      $scope.$apply();
      var t = setTimeout(function timeCheck_setTimeout(){$scope.timeCheck();},1000);
      //$scope.$timeout(function(){$scope.timeCheck()},1000);  // auto-call 'apply'
      //return $scope.$timeout(function(){$scope.timeCheck()},1000);  // auto-call 'apply'
      // do what updates are ready
      $scope.todoArray.forEach(function timeCheck_GoRed(d) {
		if ( (d.tp <= thisSec) && (thisSec <= d.t.ts) ){
			$scope.goProg(d, thisSec);
		} else	if (thisSec >= d.t.ts) {
			if (d.x != "red") {
				$scope.goRed(d.t);
				d.x = 'red';
			}
		}
		});     
    };

    ////////////////////////////////////////////////////////////////////////////

    ////////////////////////////////////////////////////////////////////////////
    // LOGIN 
    $scope.doGoogleLogin = function GGMainCtrl_doGoogleLogin() {
      console.log("doGoogleLogin enter"); 

      spname = $scope.socialProviders.google.name;
      AuthService.socialSignin(spname).then( function() {
        console.log("auth service signin done");

        DataF.getSchedules().then( function(res) {
         console.log('dgl - then' + res.data);
       });
      }).catch( function( reason ) {
        console.log("dgl - auth socialsignin catch: " + reason)
      });
      console.log("doGoogleLogin exit"); 

    };

    $scope.$on('doLogin', function GGMainCtrl_doLoginCB(e,uname) { 
      console.log("doLogin " + uname); 
      ggEventLog('login', uname);
      $scope.userName = uname;  // thanks, login controller
      $scope.ggNoEdit = false; // ok to edit now
      $scope.ggnamePath = "gnetrc";
      //$scope.ggStoragePath = "http://getgoing1.s3.amazonaws.com/"+$scope.userName+"/ggTaskTimes.json";
      $scope.ggStoragePath = "https://getgoing1.s3.amazonaws.com/"+$scope.userName+".json";
      console.log($scope.ggStoragePath);
      $scope.getUserData();
    } );

    $scope.$on('doLogout', function GGMainCtrl_doLogoutCB(e,args) { 
      console.log("doLogout " + $scope.userName); 
      ggEventLog('logout', $scope.userName);
      $scope.emptyData();
    } );

    //////////////////////////////////////////////////////////////////////////
    // EDITING 
    $scope.addTimeTask = function GGMainCtrl_addTimeTask( ) {
      console.log("addTimeTask " + $scope.addTime + " - " + $scope.addTask);
      $scope.ggTaskTimes.push( { t:$scope.addTime, s:$scope.addTask } );
      $scope.addTime = "";
      $scope.addTask = "";
      $scope.storeData();
    };
    $scope.removeTime = function GGMainCtrl_removeTime( t ) {
      console.log("removetime " + t);
      $scope.ggTaskTimes = $scope.ggTaskTimes.filter( function(n){ 
        return n.t != t; });
      $scope.storeData();
    };
    $scope.updateWeekDay = function GGMainCtrl_updateWeekDay( w ) {
      console.log("updateWeekDay ");
      $scope.weekDayStr = $scope.ggWeekDays[t.getDay()].s; // in case its today
      $scope.storeData();
    };
    $scope.clearWeekDay = function GGMainCtrl_clearWeekDay( w ) {
      var n = gg.wStr.indexOf(w);
      console.log("clearWeekDay " + w + " " + n);
      $scope.ggWeekDays[n].s = "";
      $scope.weekDayStr = $scope.ggWeekDays[t.getDay()].s; // in case its today
      $scope.storeData();
    };
    $scope.addSpecialDay = function GGMainCtrl_addSpecialDay( ) {
      console.log("addSpecialDay " + $scope.sdaddDay + " - " + $scope.sdaddWhat);
      if ( ($scope.sdaddDay) && ($scope.sdaddWhat)) {
      //$scope.ggSpecialDays.push( { d:$scope.sdaddDay, w:$scope.sdaddWhat } );
        $scope.ggSpecialDays[ $scope.sdaddDay ] = $scope.sdaddWhat;
        $scope.sdaddDay = "";
        $scope.sdaddWhat = "";
        $scope.storeData();
      }
    };
    $scope.removeSpecialDay = function GGMainCtrl_removeSpecialDay( d ) {
      console.log("removeSpecialDay " + d);
      delete $scope.ggSpecialDays[ d ]; 
      $scope.storeData();
    };
    $scope.changeWeatherCity = function GGMainCtrl_changeWeatherCity( w ) {
      console.log("changeWC " + $scope.ggWeatherCity);
      $scope.storeData();
    };

    $scope.storeData = function GGMainCtrl_storeData( t ) {
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
      ggEventLog('edit', $scope.userName);
      $scope.cleanData = false;   // redo the data calcs
      $scope.checkData(); // should be autocalled somehow; this also kicks off the time todo list calcs
    // see http://naleid.com/blog/2013/05/22/saving-json-client-side-to-an-s3-bucket
    // interesting, but not used here; http://christophervachon.com/blog/2014/08/02/aws-s3-connecting-and-getting-a-list-of-objects
    };
    // DONE EDITING ////////////////////////////////////////////////


    // fist time initialization; show (at least) the day and time!
    t = new Date();
    $scope.dateStr = gg.wStr[t.getDay()] + " " + t.getDate() + " " + gg.mStr[t.getMonth()] + " " + t.getFullYear();
    $scope.emptyData(); // then wait for login
    $scope.timeCheck();  // init - show the time
    $scope.ggHideProg = {};
    $scope.barwidth = {};
    // done with 'main' section; (perpetual) one-second timer is set in timeCheck

    $scope.socialProviders = AuthService.getSocialProviders();
  }]);
