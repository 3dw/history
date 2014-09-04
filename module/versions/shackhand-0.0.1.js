var SKH = new Object;

SKH.year = new Date().getFullYear();

SKH.has = function (val) {
        return (val && val != 'undefined');
}

SKH.toAge = function (str,year) {
    var age = (str && (year || SKH.year) - parseInt(str)) || '';
    return age;
}

SKH.init = function(p) {

    p.lang = (p.lang || 'en');

    function toIcon (url, from) {
       return ((!from && {
                  iconUrl: url,
                  iconSize: [(p.handsize || 70), (p.handsize || 70)]
              } ) || {
                  iconUrl: url,
                  iconSize: [(p.fingersize || 50), (p.fingersize || 50)]
              });
    };

    function isClose(l1, l2) {
        if (!l1 || !l2) return false;
        console.log(l2);
        return Math.pow(parseFloat(l1.split(',')[0]) - parseFloat(l2.split(',')[0]), 2) + Math.pow(parseFloat(l1.split(',')[0]) - parseFloat(l2.split(',')[0]), 2) < 0.0001;
    }

    function modifyLatLng (latlngColumn, counter) {   //  "lat,lng"
        var lat = parseFloat(latlngColumn.split(',')[0]);
        var lng = parseFloat(latlngColumn.split(',')[1]);

        var r = counter / 1000 * 20;
        var theta = counter * Math.PI / 12;

        var lngOffSet = r * Math.cos(theta);    // x
        var latOffSet = r * Math.sin(theta) / 2;    // y

        return ((lat + latOffSet) + ',' + (lng + lngOffSet));
    }    


    var defaultIcon = {
                iconUrl: 'http://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Smiley.svg/200px-Smiley.svg.png',
                iconSize: [40, 40]
    }

    p.hToM = (p.hToM || function(keys,h,i,llC,from,fbid,year) {
            var key = keys[0];
            var nameKey = keys[1];
            var geoKey = keys[2];

            var hand = h;

//            if (!hand.id && !hand.username && !from) return;
            if (!h.name) return;
            if (h.invis) return;

 //           console.log(h);

            var fbIcon,googIcon,gitIcon,twitIcon,personIcon;

            if (hand.id || fbid) {
                fbIcon = "http://graph.facebook.com/" + (hand.id || fbid) + "/picture";
            } else {
                fbIcon = "";
            }

            var icon = (fbIcon || googIcon || gitIcon || twitIcon || personIcon || h.img);

//            if (hand.site2 && hand.site2 == hand.site) hand.site2 = "";

            if (hand.site && hand.site.indexOf('http') == -1 && hand.site.indexOf('@') == -1) hand.site = 'http://' + hand.site;

            hand.latlngColumn = hand.latlngColumn.replace('(','').replace(')','').replace('附近','').replace(/near\s?/,''); 

     
            var flag = p.toFlag(hand, i, icon, year);

            if (key && key.length > 0) {
                if (flag.indexOf(key) == -1) {
                console.log('略過關鍵字不符者'); return; } else {
                    var re = new RegExp(key, "g");
                    flag = flag.replace(re, '<span class = "highlight">'+key+'</span>');
                }
            }
            if (nameKey && nameKey.length > 0) {
                if (hand.name.indexOf(nameKey) == -1) {
                console.log('略過人名不符者'); return; } else {
                    var re = new RegExp(nameKey, "g");
                    flag = flag.replace(re, '<span class = "highlight">'+nameKey+'</span>');
                }
            }
            if (geoKey && geoKey.length > 0) {
                if (hand.address.indexOf(geoKey) == -1) {
                console.log('略過地理不符者'); return; } else {
                    var re = new RegExp(geoKey, "g");
                    flag = flag.replace(re, '<span class = "highlight">'+geoKey+'</span>');
                }
            }

            var marker = {
                lat: parseFloat(llC.split(/,\s*/)[0]),
                lng: parseFloat(llC.split(/,\s*/)[1]),
                message : flag,
                focus: false,
                icon: ((icon && toIcon(icon, (from || 0))) || defaultIcon),
            }

            return(marker);
    });

    var shackhand = angular.module("shackhand",['leaflet-directive','firebase','ezfb'])
        .config(function ($FBProvider) { 
            var myInitFunction = function ($window, $rootScope, $fbInitParams) { 
                if (p.fbApp) $window.FB.init({ appId: p.fbApp});
            }
        }).service('testService', function($rootScope, $http) {
            this.getJSON = function(url,cb) {
               $http.get(url).success(cb).
                    error(function(data, status, headers, config) {
                        alert(status + " | bad");
                    });
                };
        }).filter('getKeys',function(){
          return function(obj) {
            return Object.keys(obj);
          }          
        }).filter('someFirst',function(){
            return function(list, firstList){               
                if (!list) return [];
                if (!firstList) return list;
                return list.sort(function(h){return $.inArray(h.id,firstList)});
            }
        }).filter('hideAncient',function(){
            return function(list, hideAncient,year,from,to){
                if (hideAncient) list = list.filter(function(h){
                    return (parseInt(h[from]) < year && year < parseInt(h[to]))
                });

                return list;
            }
        }).filter('toMarkers', function(){
            return function (list, ks, maybeHideLatLng, expHand, year) {
                var keys = [ks.key, ks.nameKey, ks.geoKey];
                var ms = [];                    
                var autos = angular.copy(list);

                console.log(autos);

                var latlngUsed = [];

                var mllC = function(h){
                  //重覆座標的解決  displacement algorithm
                        var counter = 0;
                        for (var j = 0; j < latlngUsed.length; j++) {
                            if (latlngUsed[j] == h.latlngColumn) counter++ ;
                        };
                        latlngUsed.push(h.latlngColumn);
                        var llC = "" + h.latlngColumn;
                        if (counter > 0) llC = modifyLatLng(h.latlngColumn, counter);
                        return llC;
                }

                if (autos) {
                    for (var i = 0; i < (autos.length || 0); i++) {
                        var h = autos[i];

                        if (!h) { console.log('略過空格'); continue; }



                        if (maybeHideLatLng && isClose(h.latlngColumn,maybeHideLatLng) && h.id != expHand.id) { 
                            console.log('略過同地址'); continue; 
                        }


                        ms.push(p.hToM(keys,h,i,mllC(h),0,0,year));

                    };

                    for (var i = 0; i < (autos.length || 0); i++) {
                        var h = autos[i];

                        if (h.friends) {
                            for (var j = 0; j < h.friends.length; j++) {
                                var f= f.friends[j];

                                if (!f) { console.log('略過空格'); continue; }
                                if (maybeHideLatLng && isClose(f.latlngColumn,maybeHideLatLng) && f.id != expHand.id) { console.log('略過同地址'); continue; }
                            
                                ms.push(p.hToM(keys,f, i, mllC(f), f.name, f.id, year));   
                            };              
                        }       
                    };
                }
                return ms;
            };
        }).filter('makeHref', function(){
            return function(str) {
                if (!str) return "";
                var ans = "" + str;
                if (str.indexOf('http://') == -1) {
                    ans = 'http://' + str;
                }
                ans = ans.replace('https://','');
                return ans;
            }
        }).filter('toWiki', function(){
            return function(str,lang) {
                    return 'http://'+(lang || 'zh')+'.wikipedia.org/wiki/'+str;
            }            
        }).filter('toList' ,function(){
            return function(obj) {
                if (!obj) return [];
                var array = $.map(obj, function(value, index) {
                    return [value];
                });
                return array;
            }
        }).directive('skhFinder', function(){
            return {
                restrict: 'E',
                template: '<div class="col-md-12">'
        +'<div class="alert alert-info">'
          +'<form class="form-inline" ng-show = "editS" ng-init = "editS = true">'  
            +'<input name="iehack" type="hidden" value="&#9760;" />'

            +'<h3>'+(p.slogen[p.lang].main || '')+'</h3>'
            +'<hr>'
            +{"zh-tw":'查詢',en:'search'}[p.lang]+' : <input class="form-control" type="text" step="any" ng-model="key"'
            +' placeholder = "'+{"zh-tw":'關鍵字查詢?', en:'find by keyword?'}[p.lang]+'" ng-change =  "makeMarkers()" />'
            +'<span class = "noPhone">'
            +{"zh-tw":'人名',en:'name'}[p.lang]+' : <input class="form-control" type="text" step="any" ng-model="nameKey"'
            +' placeholder = "'+{"zh-tw":'姓名查詢?', en:'find by name?'}[p.lang]+'" ng-change =  "makeMarkers()" />'
            +{"zh-tw":'地區',en:'address'}[p.lang]+' : <input class="form-control" type="text" step="any" ng-model="geoKey"'
            +' placeholder = "'+{"zh-tw":'地區查詢?', en:'find by address?'}[p.lang]+'" ng-change = "makeMarkers();" />'
            +'</span>'
          +'</form>'
        +'</div>'
        +'<hr>'
      +'</div>'
            }
        }).directive('skhFblogin', function() {
            return {
                restrict: 'E',
                template: '<button id = "FBlogin" class="btn btn-primary" ng-click="login()" ng-hide = "root.name">'
                            +{ "zh-tw":'以Facebook登入',
                               en: 'login with facebook'}[p.lang]
                            +'</button>'
            }
        }).directive('skhIndex', function(testService) {
            return {
                restrict: 'E',
                scope: {
                    maps: '='
                },                 
                link: function(scope, element, attrs){

                    var htmlLang = p.lang.replace(/\-/, '');

                    var heading = attrs[htmlLang] || '互助地圖';
                    var hurl = attrs.hurl || 'https://autolearn.hackpad.com/2gXl18t0vL1';
                    var author = attrs['author'+htmlLang] || '';
                    var aurl = attrs.aurl || 'https://autolearn.hackpad.com/2gXl18t0vL1';
                    var indexurl = attrs.indexurl || '';
                    
                    if (indexurl.search('.json') == -1) indexurl += '.json';
                  
                    var myHref = location.href;
                //    var indexRef = new Firebase(url);
                                      
                    scope.$watch('loadtext', function(newValue, oldValue){
                        if (newValue !== oldValue){
                        //    alert("watch working");
                            console.log(newValue);
                            var myList = [];
                            for (var i = 0; i < newValue.length; i++) {
                                 var m = newValue[i];
                                 var li = (myHref == m.h) ? '<li class = "active">' : '<li>';
                                 li += '<a href = "'+m.h+'">'+m[p.lang]+'</a></li>';
                                 myList.push(li);
                             };

                              var htmlText = 
                            '<div class="navbar navbar-inverse navbar-fixed-top" role="navigation">'
                              +'<div class="container">'
                                +'<div class="navbar-header">'
                                    +'<div class="navbar-brand">'
                                        +'<h1 class="h2"><a href = "'+hurl+'">'+heading+'</a></h1>'
                                    +'</div>'
                                +'<div class = "navbar-right"><a href = "'+aurl+'">'+author+'</a></div>'
                              +'</div>'
                              +'<div class="collapse navbar-collapse">'
                                    +'<ul class="nav navbar-nav">'
                                      +myList.join('')
                                    +'</ul>'
                              +'</div>'
                            +'</div>'
                        +'</div>';

                            element.html(htmlText);
                        }
                    });
                
                   testService.getJSON(indexurl, function(data) {
                           scope.loadtext = data;
                    });
           
                }                    
            };
          }).directive('skhLocalmap',function(){
            return {
                restrict: 'E',
                template: '<div class = "map">'
              +'<h4 style="display: inline">'+(p.slogen[p.lang].local || '')+'</h4>'
              +'<span ng-show = "center.zoom">'
                +'<a ng-click = "center.zoom = (center.zoom || 10) -1"> <img class = "icon" src="img/zoom-in.png"> </a>'
                +'<a ng-click = "center.zoom = (center.zoom || 10) -1" > <img class = "icon" src="img/zoom-out.png"> </a>'
                +'<a ng-click = "editS = !editS" > <img class = "icon" src="img/find.png"> </a>'
              +'</span>'
              +'<span ng-hide = "center.zoom">'
                +'<span ng-repeat = "k in [0,1,2,3]">'
                    +'<a ng-click = "askGeo()" > <img class = "icon" src="img/findGeo.png"> </a>'
                +'</span>'
              +'</span>'
            +'<a ng-click = "askGeo()"> <img class = "icon" src="img/findGeo.png"> </a>'
            +'<leaflet  center="center || eagle" markers = "markers" width="100%" height="420"></leaflet>'
        +'</div>'
            }
          }).directive('skhEaglemap',function(){
            return {
                restrict: 'E',
                template: '<div class="map">'
          +'<h4 style="display: inline-block">'+(p.slogen[p.lang].eagle || '')+'</h4>'
          +'<a ng-click = "eagle.zoom = eagle.zoom+1"> <img class = "icon" src="img/zoom-in.png"> </a>'
          +'<a ng-click = "eagle.zoom = eagle.zoom-1" > <img class = "icon" src="img/zoom-out.png"> </a>'
          +'<a ng-click = "editS = !editS" > <img class = "icon" src="img/find.png"> </a>'
   
          +'<leaflet center="eagle" markers = "markers" width="100%" height="420"></leaflet>'
        +'</div>'
            }
          }).directive('skhList',function(){
            return {
                restrict: 'E',
                template : '<div>'
            +'<table class="table table-striped table-hover table-condensed table-responsive">'
              +'<tr>'
                +'<th ng-repeat = "k in listKeys" class="text-center{{($index > 2 && \' noPhone\') || \'\'}}"> {{listKeyNames[k][lang] || k}} </th>'
              +'</tr>'
              +'<tr ng-repeat = "h in (base.hands | someFirst:root.follows)" ng-click = "focus(h)">'
                +'<td ng-repeat = "k in listKeys" class="text-center{{($index > 2 && \' noPhone\') || \'\'}}">'

                  +'<a ng-show = "$index == 0"'
                     +'ng-click = "focus(h)" style = "cursor:pointer" title="{{h.name}}">'
                    +'<img id = "{{ (h.id && \'fb\') || \'wiki\'}}" ng-src="{{(h.id && \'http://graph.facebook.com/\' + h.id + \'/picture\') || h.img || \'img/marker-icon.png\'}}"/>'
                  +'</a>'
                  +'<br>'
                  +'{{h[k]}}'
                  +'<br>'
                  +'<a ng-show = "$index == 0"'
                    +'ng-click = "toggleFollow(h)">' // <---- about to fix
                    +'<img id = "star" src = "img/star_white.png" ng-show = "root.name && !isFollow(h)">'
                    +'<img id = "star" src = "img/star.png" ng-show = "root.name && isFollow(h)">'
                  +'</a>'
                +'</td>'
              +'</tr>'
            +'</table>'
          +'</div>'
            }
          }).controller('SKH-Ctrl', function($scope, $firebase, $filter, $timeout){

            var h = location.hash.replace(/#\/?/,'');
            if (h.length == 3) {
                $scope.nameKey = h;
            } else {
                $scope.key = h;
            }

            $scope.markers = [];
            $scope.root = {};

            // for history map
            $scope.year = SKH.year;
            $scope.speed = 0;
            $scope.from = (p.from || 'birth');
            $scope.to = (p.to ||'death');


            if (p.movie) {
                $scope.onTimeout = function(){
                if (!$scope.pause) $scope.year += $scope.speed;
                    $scope.makeMarkers();

                    $(".leaflet-marker-icon").hover(
                        function(){$(this).css('z-index', 999999)},
                        function(){$(this).css('z-index', 100008)});

                    mytimeout = $timeout($scope.onTimeout,1000);
                }
                $scope.keyPress = function(e){
                    var keycode; 
                    if (window.event) keycode = window.event.keyCode;
                    else if (e) keycode = e.which;

                    switch(keycode) {
                        case 32:
                            e.preventDefault();
                            $scope.pause = !$scope.pause;
                            break;
                    }

                }

                document.onkeydown = $scope.keyPress;
            }

        var mytimeout = $timeout($scope.onTimeout,1000);

            $scope.lang = p.lang || navigator.language || navigator.userLanguage || '"zh-tw"';
            $scope.listKeys = p.listKeys;
            $scope.listKeyNames = p.listKeyNames;


            // for firends
            if (p.finger) {
                $scope.root.friends = {};
                for (var i = 0; i < p.finger; i++) {
                    $scope.root.friends[i] = {}; 
                };          
            }
  
            
            angular.extend($scope, {
                center: {
        //            autoDiscover: true
                    lat: 23.704894502324912,
                    lng: 120.89355468749999,
                    zoom: 10
                },

                local: {
                    lat: 23.704894502324912,
                    lng: 120.89355468749999,
                    zoom: 10 
                },

                taiwan: {
                    lat: 23.704894502324912,
                    lng: 120.89355468749999,
                    zoom: 7,
                },

                eagle: (p.eagle || {
                    lat: 23.704894502324912,
                    lng: 120.89355468749999,
                    zoom: 7
                })

            });


            $scope.makeMarkers = function(maybeHideLatLng, expHand){
                var ks = {
                    key : $scope.key,
                    nameKey: $scope.nameKey,
                    geoKey: $scope.geoKey
                }

                var showList = $filter('hideAncient')($scope.base.hands,$scope.hideAncient,$scope.year,$scope.from,$scope.to);
                $scope.markers = $filter('toMarkers')(showList, ks, maybeHideLatLng, expHand,$scope.year);
                $scope.$apply();
            };
    
            $scope.askGeo = function(place){

                if (!$scope.center.zoom) $scope.center = $scope.local;

                var add = (place || prompt(
                    {"zh-tw": '您在哪兒呢?', en: 'where are you?'}[$scope.lang]
                    , p.at[$scope.lang]));

                        $.getJSON("http://query.yahooapis.com/v1/public/yql?q=select+%2A+from+geo.placefinder+where+text%3D%22"+ encodeURI(add) +"%22+and+locale%3D%22zh_TW%22&format=json", function( d ) {

                    //        console.log(d);
                            var lat, lng;

                            try {
                             lat = d.query.results.Result[0].latitude;
                             lng = d.query.results.Result[0].longitude;
                            } catch(err) { }

                            if (!lat || !lng) {                        
                                try {
                                 lat = d.query.results.Result.latitude;
                                 lng = d.query.results.Result.longitude;
                                } catch(err) {  }
                            }

                            if (lat) $scope.local.lat = parseFloat(lat);
                            if (lng) $scope.local.lng = parseFloat(lng);
                            if (lat) $scope.local.zoom = 10;
            
                            $scope.$apply();
                        });
            };       

            if(p.at) {
                setTimeout(function(){
                            $scope.center = $scope.local;
                            $scope.askGeo();
                }, 2000); 
            } 
            
            $scope.base = {hands: []};

            // for backend firebase
            if (p.firebase) {
                $scope.dataRef = new Firebase(p.firebase);
                $scope.base = $firebase($scope.dataRef);
                $scope.base.$on('change', function(){
                 
                    if (typeof($scope.n) == 'undefined' && typeof($scope.base.hands) != 'undefined') $scope.n = $scope.base.hands.length;
                    if (typeof($scope.base.hands) != 'undefined') {
                        $scope.total = $scope.base.hands.length;
                    } else {
                        $scope.base.hands = [];
                    }
                    if (!$scope.n) console.log('error: wrong n');
                    setTimeout(function(){
                        $scope.makeMarkers();
                    }, 1000); 
                }); 
            }
            
            //for backend static jsons
            if (p.jsons) {
                for (var i = 0; i < p.jsons.length; i++) {
                        $.getJSON(p.jsons[i],function(data){
                                $scope.base.hands = $scope.base.hands.concat(data);
                        });
                } 
            }

            //for backend static csvs
            if (p.csvs || p.ethercalc) {
                var myCsvs = p.csvs;
                if (p.ethercalc) p.csvs.unshift(p.ethercalc); 

                for (var i = 0; i < p.csvs.length; i++) {      
                    $.ajax({
                    type: "GET",
                    url: p.csvs[i],
                    dataType: "text",
                        success: function(data) {
                          $scope.base.hands = $scope.base.hands.concat($scope.processData(data));
                          console.log($scope.base.hands);
                          $scope.makeMarkers();
                        }
                     });
                };

                $scope.processData = function(allText) {
                //    console.log(allText);
                    var list = [];
                    var allTextLines = allText.split(/\r\n|\n/); 
                    var headers = allTextLines[0].split(',');

                    for (var i=1; i < allTextLines.length; i++) {
                        var datas = allTextLines[i].split(',');
                        if (datas.length == headers.length) {
                            var hand = {};
                            for (var j=0; j < headers.length; j++) {
                                if (headers[j] == 'latlngColumn') datas[j] = datas[j].replace(/\?\?\s?/,',') .replace(/"/g,''); 
                                hand[headers[j]] = datas[j];
                            };
                            list.push(hand);
                        }
                    }
                    console.log(list);
                    return list;
                }

            }
            
            $scope.toggleFollow = function(hand) {
                if ($scope.n) {
                    var list =  $scope.base.hands[n].follows || [];
                    list.push(hand.id);
                    $scope.base.$child('hands').$child(n).$child('follows').$set(list);

                    for (var i = 0; i < $scope.base.hands.length; i++) {
                        var testH = $scope.base.hands[i];
                        if (testH.id == hand.id) {
                            var list2 =  testH.followBy || [];
                            list2.push($scope.base.hands[$scope.n].id);
                            $scope.base.$child('hands').$child(i).$child('followBy').$set(list2);
                        }
                    };

                }
            }

            $scope.isFollow = function(hand) {
                return $.inArray(hand.id,$scope.root.follows) + 1;
            }

            $scope.focus = function(hand) {

                if (!$scope.center.zoom) {
                    $scope.center = $scope.local;
                }

                $scope.local.lat = parseFloat(hand.latlngColumn.split(',')[0]);
                $scope.local.lng = parseFloat(hand.latlngColumn.split(',')[1]);
                $scope.local.zoom = 13;

                $scope.eagle.lat = parseFloat(hand.latlngColumn.split(',')[0]);
                $scope.eagle.lng = parseFloat(hand.latlngColumn.split(',')[1]);

                $scope.key = "";
                $scope.nameKey = "";
                $scope.geoKey = "";

                $("body,html").animate({scrollTop:0}, "slow");


                if(p.movie) {
                    $scope.hideAncient = true;
                    $scope.year = parseInt(hand[$scope.from]) + 15;
                }

           //     $scope.makeMarkers();

            }

            $scope.checkLatLng = function(add,n,k) {

                 $.getJSON("http://query.yahooapis.com/v1/public/yql?q=select+%2A+from+geo.placefinder+where+text%3D%22"+ add +"%22+and+locale%3D%22zh_TW%22&format=json", function( d ) {

                    var lat, lng;

                    try {
                     lat = d.query.results.Result[0].latitude;
                     lng = d.query.results.Result[0].longitude;
                    } catch(err) { console.log(err) }

                    if (!lat || !lng) {                        
                        try {
                         lat = d.query.results.Result.latitude;
                         lng = d.query.results.Result.longitude;
                        } catch(err) { console.log(err) }
                    }

                    if (k) {
                        $scope.root.friends[k].latlngColumn = lat+','+lng;
                    } else {
                        $scope.root.latlngColumn = lat+','+lng;
                    }

                    if ($scope.markers[n]) $scope.markers[n].lat = parseFloat(lat);
                    if ($scope.markers[n]) $scope.markers[n].lng = parseFloat(lng);

                    $scope.local.lat = parseFloat(lat);
                    $scope.local.lng = parseFloat(lng);

                });
            }

            $scope.login = function () {

                $scope.status = 
                    {"zh-tw": '資料讀取中...請稍候', en: 'loading...please wait'}[p.lang];

                auth = new FirebaseSimpleLogin($scope.dataRef, function(error, user) {
                     
                      if (error) {
                        // an error occurred while attempting login
                        console.log(error);
                      } else if (user) {

                        var data = user.thirdPartyUserData;

                            $scope.root.site = data.link;
                            $scope.root.note = data.bio;
                            //////

                            if (data.hometown && data.hometown.name) $scope.root.hometown = data.hometown.name;
                            $scope.root.id = data.id;
                            $scope.root.username = data.username;

                            setTimeout(function(){
                                     if (data.hometown && data.hometown.name) $scope.root.hometown = data.hometown.name;
                                    $scope.root.id = data.id;
                                    $scope.root.username = data.username;
                            },2000);


                            $scope.status = { "zh-tw": '讀取完畢!請修改後發佈', 
                                              en: 'data loaded! please modify it and submit again'}[p.lang];
                            

                            if ($scope.root.hometown) $scope.askGeo($scope.root.hometown);


                        $.getJSON('http://graph.facebook.com/' + user.id , function(d){
                            console.log(d);
                            $scope.ttName = d.name + "";
                            $scope.root.name = d.name + "";

                           for (var i = 0; i < $scope.base.hands.length; i++) {
                                
                                if (!$scope.base.hands[i]) continue;
                                if ($scope.base.hands[i].id == data.id || ( !$scope.base.hands[i].id && $scope.base.hands[i].name && $scope.base.hands[i].name == $scope.root.name) )  {

                                    var usrNameBuf = $scope.root.username +"";   
                                    var idBuf = $scope.root.id +"";
                                    var htBuf = $scope.root.hometown +"";

                                    $scope.root = angular.copy($scope.base.hands[i]);
                                    $scope.root.invis = false;
                                    $scope.root.username = usrNameBuf;
                                    $scope.root.id = idBuf;
                                    $scope.root.hometown = htBuf;
                                    $scope.n = i;
                                    $scope.imp = true;


                                    if (p.finger) {
                                        $scope.root.friends = {};
                                        for (var i = 0; i < p.finger; i++) {
                                            $scope.root.friends[i] = {}; 
                                        };          
                                    }

                                    $scope.$apply();
                       
                                }
                            }; 
                        }); 

                      } else {
                        console.log('user is logged out');
                        // user is logged out
                      }
                });

                auth.login('facebook', {
                  rememberMe: true,
             //     scope: 'email'
                });
            };

            $scope.logout = function (){
                auth.logout();
                $scope.root = new Object;                
                $scope.n = $scope.base.hands.length;
            }


            $scope.out = function () {
                if (confirm(
                    { '"zh-tw"': "確定要移除旗幟??這將會讓許多朋友失去一條找到您的路。",
                      'en' : "are you sure?? remove your flag will make you invisible to new friends"}[p.lang]
                    )) {
                    
//                  $scope.base.$child('hands').$child($scope.n).$child('invis').$set(true);
                    $scope.base.$child('hands').$child($scope.n).$remove();

                    for (var i = $scope.n; i < $scope.base.hands.length - 1; i++) {
                        $scope.base.$child('hands').$child(i).$set(angular.copy($scope.base.hands[i+1]));
                    };

                    $scope.base.$child('hands').$child($scope.base.hands.length - 1).$remove();

                    $scope.root = new Object;
                    $scope.status = "";
                }
            }

            $scope.submit = function (verb) {

                $.getJSON("http://query.yahooapis.com/v1/public/yql?q=select+%2A+from+geo.placefinder+where+text%3D%22"+ $scope.root.address +"%22+and+locale%3D%22zh_TW%22&format=json", function( d ) {
                    
                    var whiteList = p.whiteList || [];

                    p.checkList = p.checkList || [];
                    var checkList = p.checkList.concat(['latlngColumn','^(.(?!undefined,undefined))*$','地址查找不到座標，請調整一下']);

                    var lat;
                    var lng;

                    try {
                     lat = d.query.results.Result[0].latitude;
                     lng = d.query.results.Result[0].longitude;
                    } catch(err) { console.log(err) }

                    if (!lat || !lng) {                        
                        try {
                         lat = d.query.results.Result.latitude;
                         lng = d.query.results.Result.longitude;
                        } catch(err) { console.log(err) }
                    }

                    $scope.root.latlngColumn = lat+','+lng;

                    var n = $scope.n;

                    if (!$scope.base.hands || 
                        !$scope.base.hands[n] || 
                        $scope.base.hands[n].id == $scope.root.id || 
                        $scope.base.hands[n].name == $scope.root.name ||
                        $scope.base.hands[n].username == $scope.root.username)  {
                       
                       if ($scope.root.note && $scope.root.site && $scope.root.share) {

                            for (var i = 0; i < checkList.length; i++) {

                                var x = checkList[i][0];
                                var y = checkList[i][1];
                                var z = checkList[i][2];

                                if ($scope.root[x] && $scope.root[x].search(new RegExp(y)) == -1) {
                                    alert(z);
                                    return;
                                }
                            };                            

                            for (var i = 0; i < whiteList.length; i++) {
                                var w = whiteList[i];
                                    if (!$scope.root[w] || $scope.root[w] == 'undefined') $scope.root[w] = "";
                            };

                            $scope.base.$child('hands').$child(n).$set(angular.copy($scope.root));
                            $scope.base.hands[n] = angular.copy($scope.root);

                            var a = {"zh-tw" : "成功!!\n\n歡迎隨時回來更新!!",
                                       en : "successed! you're welcome to modify your flag any time"}[p.lang];
                            alert(verb[p.lang] + a);
                    
                        }

                        else {
                            alert(  {'"zh-tw"' : "請多介紹一些再發佈",
                                     'en' : 'please introduce yourself more'}[p.lang]);
                        }

                    } else {
                        alert({'"zh-tw"' : "抱歉，出了未知的問題",
                               'en' : "Sorry! some unexpected error happend."}[p.lang]);
                    }

                });

            }

          });

}
