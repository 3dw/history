// v0.0.1 stable
// v0.0.2 todo list:
    // b. activity join & discussion
    // c. wiki schedule
    // d. check if root has a hand on map
    // e. option to lock "remove hand"
    // f. option to hide all flag from outsider  (rise a flag to see others)
    // i. side 抽屜
    // j. match >>  <<     prosonalize
    // k. same ==          prosonalizech
    // l. nearFar ~~       prosonalize

var SKH = new Object;


SKH.year = new Date().getFullYear();

SKH.has = function (val) {
        return (val && val != 'undefined');
}

SKH.toAge = function (str,year) {
    var age = (str && (year || SKH.year) - parseInt(str)) || '';
    return age;
}

SKH.toHref = function (str) {
    return (str.indexOf('http') > -1)? str : 'http://' + str;
} 


SKH.init = function(p) {

    p.lang = (p.lang || 'en');

    p.l = (p.l || {});
    angular.extend(p.l, 
    	{'where are you?': {'zh-tw': '您在哪兒呢?',
    						 	'en': 'where are you?'}});

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

    p.hToM = (p.hToM || function(keys,h,i,llC,from,fbid,year,whichLable,whichGroup) {
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

            var icon = (h.img || h.icon || fbIcon || googIcon || gitIcon || twitIcon || personIcon);

//            if (hand.site2 && hand.site2 == hand.site) hand.site2 = "";

            if (hand.site && hand.site.indexOf('http') == -1 && hand.site.indexOf('@') == -1) hand.site = 'http://' + hand.site;

            hand.latlngColumn = hand.latlngColumn.replace('(','').replace(')','').replace('附近','').replace(/near\s?/,''); 

     
            var flag = p.toFlag(hand, i, icon, year);
            var label = (p.toLable || function () {return})(hand, i, icon, year, whichLable);

            if (key && key.length > 0) {
                var re = new RegExp(('('+key+')').replace(/\s*(\s|or)\s*/gi, '|'), "gi");
                if (flag.search(re) == -1) {
                console.log('略過關鍵字不符者'); return; } else {
                    flag = flag.replace(re, '<span class = "highlight">$1</span>');
                }
            }
            if (nameKey && nameKey.length > 0) {
                var re = new RegExp(nameKey, "gi");
                if (hand.name.search(re) == -1) {
                console.log('略過人名不符者'); return; } else {
                    flag = flag.replace(re, '<span class = "highlight">'+nameKey+'</span>');
                }
            }
            if (geoKey && geoKey.length > 0) {
                var re = new RegExp(geoKey, "gi");
                if (hand.address.search(re) == -1) {
                console.log('略過地理不符者'); return; } else {
                    flag = flag.replace(re, '<span class = "highlight">'+geoKey+'</span>');
                }
            }

            var marker = {
                lat: parseFloat(llC.split(/,\s*/)[0]),
                lng: parseFloat(llC.split(/,\s*/)[1]),
                layer: (whichGroup || 'hands'),
                message : flag,
                focus: false,
                draggable: true,
                icon: ((icon && toIcon(icon, (from || 0))) || defaultIcon),
                label: {
                    message: label,
                    options: {
                        noHide: label
                    }
                }
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
         //               window.alert(status + " | bad");
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
        }).filter('filterBy',function(){
            return function(list, key){
                if (!key) return list;
                var re = new RegExp(key.replace(/\s*(\s|or)\s*/gi, '|'), "gi");               
                var ks = ['name','note'];    //  <=====  to fix
                return list.filter(function (obj) {
                    for (var i = 0; i < ks.length; i++) {

                        if (obj[ks[i]].search(re) > -1) return true;
                    };
                    return false;
                })
            }
        }).filter('hideAncient',function(){
            return function(list, hideAncient,year,from,to){
                if (hideAncient) list = list.filter(function(h){
                    return (parseInt(h[from]) < year && year < parseInt(h[to]))
                });

                return list;
            }
        }).filter('toMarkers', function(){
            return function (list, ks, maybeHideLatLng, expHand, year, whichLable, whichGroup) {
                var keys = [ks.key, ks.nameKey, ks.geoKey];
                var ms = [];                    
                var autos = angular.copy(list);

//                console.log(autos);
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

                        ms.push(p.hToM(keys,h,i,mllC(h),0,0,year,whichLable,whichGroup));

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
        }).directive('skhSlogen', function(){
            return {
                restrict: 'E',
                template: '<div class="col-md-12">'
        +'<div class="alert alert-info">'
          +'<form class="form-inline">'  
            +'<input name="iehack" type="hidden" value="&#9760;" />'
            +'<h3>'+(p.slogen || '')+'</h3>'
          +'</form>'
        +'</div>'
        +'<hr>'
      +'</div>'
            }
        }).directive('skhFinder', function(){
            return {
                restrict: 'E',
                template: '<div class="col-md-12">'
        +'<div class="window.alert window.alert-info">'
            +'<h3>'+(p.slogen || '')+'</h3>'
          +'<form class="form-inline" ng-show = "editS" ng-init = "editS = true">'  
            +'<input name="iehack" type="hidden" value="&#9760;" />'
            +'<hr>'
            +'<skh-select></skh-select>'
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
        }).directive('skhFblogout', function() {
            return {
                restrict: 'E',
                template: '<button id = "FBlogin" class="btn btn-primary" ng-click="logout()" ng-show = "root.name">'
                            +{ "zh-tw":'登出',
                               en: 'logout'}[p.lang]
                            +'</button>'
            }
        }).directive('skhIndex', function(testService) {
            return {
                restrict: 'E',
                scope :{
                    key : '='
                },
                replace: 'true',       
                link: function(scope, element, attrs){

                    var indexurl = attrs.indexurl || '';
                    
                    if (indexurl.search('.json') == -1) indexurl += '.json';
                  
                    var myHref = location.href;
                                      
                    scope.$watch('loadtext', function(newValue, oldValue){
                        if (newValue !== oldValue){
                    //        window.alert("watch working");
                    
                   //         console.log(newValue);

                            var myList = [];

                            for (var i = 0; i < newValue.length; i++) {
                                 var m = newValue[i];
                                 var li = (myHref.indexOf(m.h) > -1) ? '<li class = "active">' : '<li>';
                                 li += '<a href = "'+m.h+'">'+m[p.lang]+'</a></li>';
                                 myList.push(li);
                             };

                              var htmlText = '<div class="collapse navbar-collapse">'
                                    +'<ul class="nav navbar-nav">'
                                      +myList.join('')
                                    +'</ul>'
                              +'</div>';


                   //         console.log(htmlText);

                            element.html(htmlText);
                        }
                    });
                
                   testService.getJSON(indexurl, function(data) {
                           scope.loadtext = data;
                    });
           
                }                    
            };
          }).directive('skhSelect',function(){
            return {
                restrict: 'E',
                template: p.selectBar
            }
          }).directive('skhLocalmap',function(){
            return {
                restrict: 'E',
                template: '<div class="col-md-12 map" id = "local" fullscreen="isFullscreen" only-watched-property>'

             +'<form class="form-inline form-down" role="search">'
              +'<span ng-hide = "center.zoom">'
                +'<span ng-repeat = "k in [0,1,2,3]">'
                    +'<a ng-click = "askGeo(\'?\')" > <img class = "icon" src="module/src/images/findGeo.png"> </a>'
                +'</span>'
              +'</span>'
             +'<a ng-hide = "root.name" ng-click = "askGeo(\'?\')"> <img class = "icon center" src="module/src/images/findGeo.png"> </a>'
             +'<a ng-click = "focus(n)" ng-show = "root.name"  style = "cursor:pointer">'
                +'<img id = "fb"  class = "center" ng-src="http://graph.facebook.com/{{root.id || root.username}}/picture"/>'
             +'</a>'
            
             +'<skh-select></skh-select>'
                + '<a class="btn" ng-click = "isFullscreen = !isFullscreen">'
                    +'<img class = "icon" src = "module/src/images/full-screen.png"></a>'

            +'</form>'
            +'<leaflet center="center" markers = "markers" layers="layers" width="100%" height="'+($( window ).height()+100)+'"></leaflet>'
        +'</div>'
            }
          }).directive('skhEaglemap',function(){
            return {
                restrict: 'E',
                template: '<div class="map" ng-hide="loc">'
          +'<form class="form-inline form-down" role="search">'
              +'<span ng-hide = "center.zoom">'
                +'<span ng-repeat = "k in [0,1,2,3]">'
                    +'<a ng-click = "askGeo(\'?\')" > <img class = "icon" src="module/src/images/findGeo.png"> </a>'
                +'</span>'
              +'</span>'
             
             +'<skh-select></skh-select>'
            +'</form>'
          
   
          +'<leaflet center="eagle" markers = "markers" layers="layers" width="100%" height="'+($( window ).height()+100)+'"></leaflet>'
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
              +'<tr ng-repeat = "h in (base.hands | filterBy:key | someFirst:root.follows)" ng-click = "focus(h)">'
                +'<td ng-repeat = "k in listKeys" class="text-center{{($index > 2 && \' noPhone\') || \'\'}}">'
                  
                  +'<div class = "skh-cell">'
                    +'<a ng-show = "$index == 0"'
                     +'ng-click = "focus(h)" style = "cursor:pointer" title="{{h.name}}">'
                    +'<img id = "{{ (h.id && \'fb\') || \'wiki\'}}" ng-src="{{(h.id && \'http://graph.facebook.com/\' + h.id + \'/picture\') || h.img || \'img/marker-icon.png\'}}"/>'
                    +'<br>'
                  +'</a>'
                    +'<div>{{h[k]}}</div>'
                  +'</div>'
                +'</td>'
              +'</tr>'
            +'</table>'
          +'</div>'
            }
          }).controller('SKH-Ctrl', function($scope, $firebase, $filter, $timeout){

            angular.element(document).ready(function() {
              $('input[autofocus]:visible:first').focus();
            });

            $timeout(function(){
                $('.leaflet-clickable,.leaflet-label').hover(
                      function(){$(this).css('z-index',900)}
                    , function(){$(this).css('z-index',890)});
            }, 3000);

            if(navigator.appName == 'Microsoft Internet Explorer') {
                if (confirm("IE瀏覽器不支援，請改用Firefox或Chrome")) {
                    window.open('http://moztw.org/firefox/');
                    window.open('http://www.google.com.tw/intl/zh-TW/chrome/browser/');
                }
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
                    autoDiscover: true,
                    lat: 23.704894502324912,
                    lng: 120.89355468749999,
                    zoom: ($(window).width() < 480 && 12) || 10
                },

                local: {
          //          autoDiscover: true,
                    lat: 23.704894502324912,
                    lng: 120.89355468749999,
                    zoom: ($(window).width() < 480 && 12) || 10
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
                }),

                layers: {
                    baselayers: {
                        openStreetMap: {
                            name: 'OpenStreetMap',
                            type: 'xyz',
                            url: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                        }
                    },
                    overlays: {
                        hands: {
                            type: 'group',
                            name: (p.handTitle || 'hands'),
                            visible: true
                        },

                        shacks: {
                            type: 'group',
                            name: (p.shackTitle || ''),
                            visible: false
                        }
                    }
                },

                toggleLayer: function(type) {
                    $scope.layers.overlays[type].visible = !$scope.layers.overlays[type].visible;
                }

            });


            $scope.makeMarkers = function(maybeHideLatLng, expHand){
                var ks = {
                    key : $scope.key,
                    nameKey: $scope.nameKey,
                    geoKey: $scope.geoKey
                }

                var showHandList = $filter('hideAncient')($scope.base.hands,$scope.hideAncient,$scope.year,$scope.from,$scope.to);
                var showShackList = $filter('hideAncient')($scope.base.shacks,$scope.hideAncient,$scope.year,$scope.from,$scope.to);

                $scope.markers = $filter('toMarkers')(showHandList, ks, maybeHideLatLng, 
                                        expHand,$scope.year,$scope.whichLable,'hands')
                            .concat($filter('toMarkers')(showShackList, ks, maybeHideLatLng, 
                                        expHand,$scope.year,$scope.whichLable,'shacks')
                                );
            
                $scope.$apply();
            };
    
            $scope.askGeo = function(place){


                if (place == '?') place = prompt("您在哪兒呢?", p.at || '');
                if (place) {
                    $scope.local.autoDiscover = false;
                    $scope.loc = place; 
                    $scope.center = $scope.local;                   
                } else {
                    return;
                }


                        $.getJSON("http://query.yahooapis.com/v1/public/yql?q=select+%2A+from+geo.placefinder+where+text%3D%22"+ encodeURI(place) +"%22+and+locale%3D%22zh_TW%22&format=json", function( d ) {

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


            var h = location.hash.split(/#\/?/);

               $scope.key = decodeURI(h[2] || '') || p.key || '';
               $scope.loc = decodeURI(h[1] || '') || p.at || '';
       
                if (h && h.length > 1) {
                    $timeout(function(){
                        var firstMapOffset = $("#local").position().top || $("#eagle").position().top || 0;
                        $("body,html").animate({scrollTop:firstMapOffset + 50}, "slow");
                    }, 2000);
                }
 
            $scope.askGeo($scope.loc);
            
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
                    $timeout(function(){
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
                if ($scope.imp) {
                    var list = ($scope.base.hands[$scope.n] && $scope.base.hands[$scope.n].follows) || [];
                    list.push($scope.base.hands.indexOf(hand));
                    var m = p.maxFollow || 10;

                    if(list.length > m) list = list.slice(-m, list.length);

                    $scope.base.$child('hands').$child($scope.n).$child('follows').$set(list);

                    for (var i = 0; i < $scope.base.hands.length; i++) {
                        var testH = $scope.base.hands[i];
                        if (testH.id == hand.id) {
                            var list2 =  testH.followBy || [];
                            list2.push($scope.n);
                            if(list2.length > m) list2 = lis2.slice(-m, lis2.length);
                            $scope.base.$child('hands').$child(i).$child('followBy').$set(list2);
                        }
                    };

                }
            }

            $scope.isFollow = function(hand) {
                return $.inArray(hand.id,$scope.root.follows) + 1;
            }

            $scope.focus = function(hand) {

                $scope.center = $scope.local;

                $scope.local.lat = parseFloat(hand.latlngColumn.split(',')[0]);
                $scope.local.lng = parseFloat(hand.latlngColumn.split(',')[1]);
                $scope.local.zoom = 13;

                $scope.eagle.lat = parseFloat(hand.latlngColumn.split(',')[0]);
                $scope.eagle.lng = parseFloat(hand.latlngColumn.split(',')[1]);

                $scope.key = "";
                $scope.nameKey = "";
                $scope.geoKey = "";

                var firstMapOffset = $("#local").position().top || $("#eagle").position().top || 0;
                $("body,html").animate({scrollTop:firstMapOffset}, "slow");


                if(p.movie) {
                    $scope.hideAncient = true;
                    $scope.year = parseInt(hand[$scope.from]) + 15;
                }

                window.location.hash = '#' + encodeURIComponent(hand.address) + '#' + encodeURIComponent(hand.name);
                


                $scope.toggleFollow(hand);



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

                            $timeout(function(){
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

                                    $scope.loc = angular.copy($scope.root.address);

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

            $scope.submit = function (verb,target) {

                if (!target) target = 'hands';

                $.getJSON("http://query.yahooapis.com/v1/public/yql?q=select+%2A+from+geo.placefinder+where+text%3D%22"+ $scope.root.address +"%22+and+locale%3D%22zh_TW%22&format=json", function( d ) {
                    
                    var whiteList = p.whiteList || [];
                    var checkList = p.checkList || [];

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
                    console.log($scope.root.latlngColumn);

                    if (!$scope.root.latlngColumn || $scope.root.latlngColumn == 'undefined,undefined') {
                        window.alert('地址查找不到座標，請調整一下');
                        return;
                    }

                    var n = $scope.n;

                    if (!$scope.base[target] || 
                        !$scope.base[target][n] || 
                        $scope.base[target][n].id == $scope.root.id || 
                        $scope.base[target][n].name == $scope.root.name ||
                        $scope.base[target][n].username == $scope.root.username)  {
                       
                        if (checkList) {
                            for (var i = 0; i < checkList.length; i++) {

                                var x = checkList[i][0];
                                var y = checkList[i][1];
                                var z = checkList[i][2];

                                var re = new RegExp(y,"g");
                                if ($scope.root[x] && $scope.root[x].search(re) == -1) {
                                    window.alert(z);
                                    return;
                                }
                            };                            
                        }

                        for (var i = 0; i < whiteList.length; i++) {
                            var w = whiteList[i];
                                if (!$scope.root[w] || $scope.root[w] == 'undefined') $scope.root[w] = "";
                        };

                        $scope.base.$child(target).$child(n).$set(angular.copy($scope.root));
                        $scope.base[target][n] = angular.copy($scope.root);

                        var a = {"zh-tw" : "成功!!\n\n將此網址貼上圖鴨牆以介紹在地朋友:\n"
                            + window.location.href + '#' + $scope.root.address + "\n\n歡迎隨時回來更新!!",
                                   en : "successed! you're welcome to modify your flag any time"}[p.lang];
                        window.alert((verb[p.lang] + a) || a);
                    

                    } else {
                        window.alert({'zh-tw' : "抱歉，出了未知的問題",
                               'en' : "Sorry! some unexpected error happend."}[p.lang]);
                    }

                });

            }

          });

}
