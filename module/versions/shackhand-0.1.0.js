
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

    p = p || {};
    p.headers = p.headers || ['name','site'];
    p.lang = (p.lang || 'en');
    p.l = (p.l || {});
    p.toFlags = p.toFlags || [];
    p.toLabels = p.toLabels || [];

    SKH.toHackMapFlag = function(shack, i, Icon, from) {

        var middle = '';
        for (var i = 0; i < p.headers.length; i++) {
            if (shack[p.headers[i].n]) middle += '<br>' + p.headers[i].t + '：' + shack[p.headers[i].n] + '<br>'
        };

        return '<div class="flag">'
                    +((shack.site && '<a href = "'+SKH.toHref(shack.site)+'" target = "_blank">'
                      + '<img title = "' + shack.site
                          +'"src = "http://www.google.com/s2/favicons?domain=' + shack.site +'">' ) || "") 

                    +'<strong>'+ shack.name+'</strong></a><br />'

                    + middle

                      
                    +'<hr>'
                    +( shack.note.replace(/\n/g, '<br>')|| "")+'<br />'
                    +'<hr>'

                    +((shack.site && '<a href = "'+SKH.toHref(shack.site)+'" target = "_blank">'
                      + '<img title = "' + shack.site
                          +'"src = "http://www.google.com/s2/favicons?domain=' + shack.site +'">' ) || "") 

                    +'<strong>'+ shack.name+'</strong></a><br />'
                            
                +'</div>';
    }


    angular.extend(p.l, 
    	{'where are you?': {'zh-tw': '您在哪兒呢?',
    						 	'en': 'where are you?'}});

    function toIcon (url, from, zoomNow, whichGroup) {

       zoomNow = parseInt(zoomNow);
       if (zoomNow <= 1) zoomNow = 10;

       whichGroup = whichGroup || [];
       var iconSize = p.iconSize || [];

       return { iconUrl: url,
                iconSize: [(iconSize[whichGroup] || 60) * (zoomNow / 10), (iconSize[whichGroup] || 60) * (zoomNow / 10)],
                shadowUrl: 'module/src/images/200px-Smiley.svg.png',
                shadowSize: [(iconSize[whichGroup] || 60) * (zoomNow / 40), (iconSize[whichGroup] || 60) * (zoomNow / 40)]
              };
       
     /*  return ((!from && {
                  iconUrl: url,
                  iconSize: [(p.iconSize[whichGroup] || 60) * (zoomNow / 10), (p.iconSize[whichGroup] || 60) * (zoomNow / 10)]
              } ) || {
                  iconUrl: url,
                  iconSize: [(p.fingersize || 50), (p.fingersize || 50)]
              }); */
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


    var defaultIcon = function(zoomNow, whichGroup){

        zoomNow = parseInt(zoomNow);
        if (zoomNow <= 1) zoomNow = 10;

        var iconSize = p.iconSize || [];

        return {
            iconUrl: 'module/src/images/200px-Smiley.svg.png',
            iconSize: [(iconSize[whichGroup] || 60) * zoomNow / 10, (iconSize[whichGroup] || 60) * zoomNow / 10],
            shadowUrl : 'module/src/images/200px-Smiley.svg.png',
            shadowSize: [(iconSize[whichGroup] || 60) * zoomNow / 10, (iconSize[whichGroup] || 60) * zoomNow / 10],
        }   
    }

    p.hToM = (p.hToM || function(keys,h,i,llC,from,fbid,year,whichLable,whichGroup,zoomNow) {

            var key = keys[0];
            var nameKey = keys[1];
            var geoKey = keys[2];
            var hand = h;

            var layerIcons = p.layerIcons || [];

            if (!h.name) return;
            if (h.invis) return;

            if (hand.site && hand.site.indexOf('http') == -1 && hand.site.indexOf('@') == -1) hand.site = 'http://' + hand.site;
            hand.latlngColumn = hand.latlngColumn.replace('(','').replace(')','').replace('附近','').replace(/near\s?/,''); 

            var fbIcon,googIcon,gitIcon,twitIcon,personIcon;

            if (hand.id || fbid) {
                fbIcon = "http://graph.facebook.com/" + (hand.id || fbid) + "/picture";
            } else {  fbIcon = "";  }

            var icon = (h.img || h.icon || fbIcon || googIcon || gitIcon || twitIcon || personIcon || layerIcons[whichGroup]);

     
            var flag, label;            
            flag = (p.toFlags[parseInt(whichGroup)] || SKH.toHackMapFlag || p.toFlags[0] || function () {return})(hand, i, icon, year);
            label = (p.toLabels[parseInt(whichGroup)] || SKH.toHackMapLable || p.toLabels[0] || function () {return})(hand, i, icon, year, whichLable);


            if (key && key.length > 0) {
                var re = new RegExp(('('+key+')').replace(/\s*(\s|or)\s*/gi, '|'), "gi");
                if (flag.search(re) == -1) {
                console.log('略過關鍵字不符者'); return; } else {
                    flag = flag.replace(re, '<span class = "highlight">$1</span>');
                }
            }


            var marker = {
                lat: parseFloat(llC.split(/,\s*/)[0]),
                lng: parseFloat(llC.split(/,\s*/)[1]),
                layer: whichGroup,
                message : flag,
                site: h.site,
                focus: false,
                draggable: true,
                hide: true,
                popupOptions: {
                    autoPan: false
                },
                label: {
                    message: label,
                    options: {
                        noHide: label
                    }
                },
                icon: ((icon && toIcon(icon, (from || 0), zoomNow,  whichGroup )) || defaultIcon((zoomNow || 10), whichGroup))
            }

            return(marker);
    });

    var shackhand = angular.module("shackhand",['leaflet-directive','FBAngular','firebase','ezfb']);


    shackhand.config(function ($FBProvider) { 
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
            return function (list, ks, maybeHideLatLng, expHand, year, whichLable, whichGroup, zoomNow) {
                var keys = [ks.key, ks.nameKey, ks.geoKey];
                var ms = [];                    
                var autos = angular.copy(list);


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



                        ms.push(p.hToM(keys,h,i,mllC(h),0,0,year,whichLable,whichGroup, zoomNow));

                    };

                    // old Friends feature //
                    for (var i = 0; i < (autos.length || 0); i++) {
                        var h = autos[i] || {};

                        if (h.friends) {
                            for (var j = 0; j < h.friends.length; j++) {
                                var f= f.friends[j];

                                if (!f) { console.log('略過空格'); continue; }
                                if (maybeHideLatLng && isClose(f.latlngColumn,maybeHideLatLng) && f.id != expHand.id) { console.log('略過同地址'); continue; }
                            
                                ms.push(p.hToM(keys,f, i, mllC(f), f.name, f.id, year, whichLable,whichGroup, zoomNow));   
                            };              
                        }       
                    }; 
                    // old Friends feature End//
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
            +'<h3>'+(p.slogen || '')+'</h3>'
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
                template: '<button id = "FBlogin" class="btn btn-primary" ng-click="login(\'facebook\')" ng-hide = "root.name">'
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
          }).directive('skhFrame',function(){
            return {
                restrict: 'E',
                template: 
                     '<div id = "skh-frame1">'
                        +'<span ng-show = "frameUrl && !hideFrame">預覽</span><input type = "checkbox" ng-model = "hideFrame"/>'
                        +'<iframe class = "noPhone" width="100%" height="100%" ng-show = "frameUrl && !hideFrame"></iframe>'
                    +'</div>'

              }
          }).directive('skhLocalmap',function(){
            return {
                restrict: 'E',
                template: '<div class="col-md-12" id = "local" fullscreen="isFullscreen" only-watched-property>'
             +'<form class="form-inline form-down" role="search">'
              +'<span ng-hide = "true">'
                +'<span ng-repeat = "k in [0,1,2,3]">'           
                    +'<a ng-click = "askGeo(\'?\')" > <img class = "icon" src="module/src/images/findGeo.png"> </a>'
                +'</span>'
              +'</span>'
      //       +'<a ng-hide = "root.name" ng-click = "askGeo(\'?\')"> <img class = "icon center" src="module/src/images/findGeo.png"> </a>'
      //       +'<a ng-click = "focus(n)" ng-show = "root.name"  style = "cursor:pointer">'
      //          +'<img id = "fb"  class = "center" ng-src="http://graph.facebook.com/{{root.id || root.username}}/picture"/>'
      //       +'</a>'
            
             +'<skh-select></skh-select>'
                + '<a class="btn" ng-click = "isFullscreen = !isFullscreen">'
                    +'<img class = "icon" src = "module/src/images/full-screen.png"></a>'

            +'</form>'
                    +'<div class = "center" ><a ng-click = "isFullscreen = true; askGeo(\'?\');" style = "display:block; overflow:hidden; width:32px; height:32px;">'                
                    +'<img id = "skh-sprite" src="module/src/images/sprite.png"/> </a>'
                    +'</div>'

                    +'<div class = "center">'                
                    +'<span id = "skh-warning" class = "noPhone" style = "position: relative; top: 32px; right:50px;" ng-hide = "isFullscreen">'
                        +'<a ng-click = "isFullscreen = true">按此進入RPG模式</a></span>'
                    +'<span id = "skh-warning" style = "position: relative; top: 32px; right:50px;" ng-show = "isFullscreen && !moving">點擊地圖一下，開始移動<br></span>'
                    +'<span id = "skh-warning" style = "position: relative; top: 32px; right:50px;" ng-show = "isFullscreen && !moving">上下左右移動，空白鍵對話</span>'
                    +'</div>'

                    

            +'<leaflet event-broadcast="events" center="center" markers = "markers" layers="layers" width="100%" height="'+($( window ).height()+100)+'"></leaflet>'
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
          
   
          +'<leaflet event-broadcast="events" center="eagle" markers = "markers" layers="layers" width="100%" height="'+($( window ).height()+100)+'"></leaflet>'
        +'</div>'
            }
          }).directive('skhList',function(){
            return {
                restrict: 'E',
                template : '<div>'
            +'<table class="table table-striped table-hover table-condensed table-responsive">'
              +'<tr>'
                +'<th ng-repeat = "k in listKeys" class="text-center{{($index > 2 && \' noPhone\') || \'\'}}"> {{listKeyNames[k] || k}} </th>'
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
          }).controller('SKH-Ctrl', function($scope, leafletEvents, $firebase, $filter, $timeout){

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
            $scope.events = {
                markers: {
                    enable: leafletEvents.getAvailableMarkerEvents(),
                }
            };

            $scope.eventDetected = "No events yet...";
            var markerEvents = leafletEvents.getAvailableMarkerEvents();
            for (var k in markerEvents){
                var eventName = 'leafletDirectiveMarker.' + markerEvents[k];
                $scope.$on(eventName, function(event, args){
                    console.log(event);
                    console.log(args);
                    $scope.eventDetected = event.name;
                    $scope.eventMarkerIndex = args.markerName;

                    console.log($scope.markers[$scope.eventMarkerIndex]);

                    if ($scope.eventDetected == "leafletDirectiveMarker.mouseover" 
                        || $scope.eventDetected == "leafletDirectiveMarker.popupopen") { 


                            $scope.frameUrl = $scope.markers[$scope.eventMarkerIndex].site;
                            $("#skh-frame1").children('iframe').attr("src",$scope.frameUrl);
                    }


//                    if ($scope.eventDetected == "leafletDirectiveMarker.popupopen") console.log("beep");

                });
            }

            // for history map
            $scope.year = SKH.year;
            $scope.speed = 0;
            $scope.from = (p.from || 'birth');
            $scope.to = (p.to ||'death');


            
            $scope.onTimeout = function(){

                if (p.movie) {

                    if (!$scope.pause) $scope.year += $scope.speed;

                    $scope.markers = [];
                    $scope.makeMarkers();

                    $(".leaflet-marker-icon").hover(
                        function(){$(this).css('z-index', 999999)},
                        function(){$(this).css('z-index', 100008)});
                }

                $scope.left = (($scope.left || 0) - 32) % 128; 
                $('#skh-sprite').css('left', $scope.left + 'px');

                mytimeout = $timeout($scope.onTimeout,1000);
            }

            var mytimeout = $timeout($scope.onTimeout,1000);

            $scope.keyPress = function(e){

                var keycode; 
                if (window.event) keycode = window.event.keyCode;
                else if (e) keycode = e.which;

                switch(keycode) {
                    case 32: // space
                        e.preventDefault();
                        if (p.movie) {
                            $scope.pause = !$scope.pause;
                        }                                                  
                     
                        /* sort by distance */ 
        
                        $scope.sorted = $scope.markers
                                    .filter(function(a){
                                        return (new L.LatLng(parseFloat(a.lat),parseFloat(a.lng)).distanceTo(
                                            new L.LatLng($scope.center.lat,$scope.center.lng)) < 50000 )})
                        .sort(function(a,b){ 
                                return ((new L.LatLng(parseFloat(a.lat),parseFloat(a.lng)).distanceTo(
                                            new L.LatLng($scope.center.lat,$scope.center.lng)))

                                    - (new L.LatLng(parseFloat(b.lat),parseFloat(b.lng)).distanceTo(
                                        new L.LatLng($scope.center.lat,$scope.center.lng)))
                        )});


                        if ($scope.sorted && $scope.sorted[0]) {

                            for (var i = 1; i < $scope.sorted.length; i++) {
                                $scope.sorted[i].focus = false;
                            };
                            $scope.sorted[0].focus =  true;
                            $scope.moving = true;
                        }

                        $scope.$apply();
                        break;

                    case 37: // left
                        e.preventDefault();
                        $('#skh-sprite').css('top', '-32px');
                        if (!$scope.isFullscreen) $scope.focus();
                        break;
                    case 39: // right
                        e.preventDefault();
                        $('#skh-sprite').css('top', '-64px');
                        if (!$scope.isFullscreen) $scope.focus();
                        break;
                    case 38: // up
                        e.preventDefault();
                        $('#skh-sprite').css('top', '-96px');
                        if (!$scope.isFullscreen) $scope.focus();
                        break;
                    case 40: // down
                        e.preventDefault();
                        $('#skh-sprite').css('top', '0px');
                        if (!$scope.isFullscreen) $scope.focus();
                        break;
                }

            }

            document.onkeydown = $scope.keyPress;



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
                    lat: (p.lat || 24.704894502324912),
                    lng: (p.lng || 121.19355468749999),
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
              /*          hands: {
                            type: 'group',
                            name: (p.handTitle || 'hands'),
                            visible: (p.showHand || true)
                        },

                        shacks: {
                            type: 'group',
                            name: (p.shackTitle || ''),
                            visible: (p.showShack || true)
                        }, */
                    }
                },

                toggleLayer: function(type) {
                    $scope.layers.overlays[type].visible = !$scope.layers.overlays[type].visible;
                }

            });
            

                
            $scope.$watch('center.zoom', function(newValue, oldValue) {
          		// if (newValue.zoom !== oldValue.zoom) {
	                $scope.clearMarker();
	                $scope.makeMarkers(); 
              //  }                  

            });  



            $scope.clearMarker = function(){
                $scope.markers = [];
                $('leaflet-marker-icon').hide();
            }

            $scope.makeMarkers = function(maybeHideLatLng, expHand){

                var ks = {
                    key : $scope.key,
                    nameKey: $scope.nameKey,
                    geoKey: $scope.geoKey
                }

                /*   */

      //          var showList = [];
                $scope.markers = $scope.markers || [];

                for (var i = 0; i < p.layers.length; i++) {

                    if (!$scope.bases || !$scope.bases[i]) continue;

       //             console.log($scope.bases[i]);

                    var show = $filter('hideAncient')($scope.bases[i].hands,$scope.hideAncient,$scope.year,$scope.from,$scope.to);
                    
                    $scope.markers = $scope.markers.concat(($filter('toMarkers')(show, ks, maybeHideLatLng, 
                                        expHand,$scope.year,$scope.whichLable, "" + i, $scope.center.zoom)));
                };



                /*   */
/*
               var showHandList = $filter('hideAncient')($scope.base.hands,$scope.hideAncient,$scope.year,$scope.from,$scope.to);
                var showShackList = $filter('hideAncient')($scope.base.shacks,$scope.hideAncient,$scope.year,$scope.from,$scope.to);

                $scope.markers = $filter('toMarkers')(showHandList, ks, maybeHideLatLng, 
                                        expHand,$scope.year,$scope.whichLable,'hands')

                            .concat($filter('toMarkers')(showShackList, ks, maybeHideLatLng, 
                                        expHand,$scope.year,$scope.whichLable,'shacks')
                                );  */
            
 //               $scope.$apply();
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
            
            $scope.base = {hands: [], shacks: []};

/*    */

            function makeLayer(n) {
                var title = p.layers[n];
                var type = p.types[n];
                var url = p.urls[n];
                var login = (p.logins && p.logins[n]) || undefined;
                var toFlag = (p.toFalgs && p.toFlags[n]) || undefined;
                var toLabel = (p.toLables && p.toLables[n]) || undefined;
                var visible;  try {visible = p.visibles[n]} catch(err) {};

                $scope.layers.overlays = $scope.layers.overlays || {};
                $scope.layers.overlays[n] = {
                            type: 'group',
                            name: (title || 'hands'),
                            visible: (visible || true)
                        };

                  // for backend firebase
                  
                  /* maybe Bug here */

                if (type == 'firebase') {

                    $scope.dataRefs = $scope.dataRefs || [];
                    $scope.dataRefs[n] = new Firebase(url);  

                    $scope.bases = $scope.bases || [];                 
                    $scope.bases[n] = $firebase($scope.dataRefs[n]);


                    $scope.bases[n].$on('change', function(){


                        /* ???  */

                        if (typeof($scope.n) == 'undefined' && typeof($scope.bases[n].hands) != 'undefined') $scope.n = $scope.bases[n].hands.length;
                       
                        if (typeof($scope.bases[n].hands) != 'undefined') {
                            $scope.total = $scope.bases[n].hands.length;
                        } else {
                            $scope.bases[n].hands = [];
                        }
                        if (!$scope.n) console.log('error: wrong n');

                        /* ???  */

                        $timeout(function(){
                            $scope.clearMarker();
                            $scope.makeMarkers();
                        }, 1000); 
                    }); 
                }

                //for backend static jsons
                if (type == 'json') {
                //    for (var i = 0; i < p.jsons.length; i++) {
                            $.getJSON(url,function(data){
                                    $scope.bases = $scope.bases || [];                
                                    $scope.bases[n].hands = data;
                            });
               //     } 
                }

                //for backend ethercalc using hackfoler format ==> hackmap
                if (type == 'hackmap') {
                    var hackmap = url;
                    var hackUrl = hackmap.replace(/([^\/])\/([^\/])/, '$1'+ '/_/' +'$2');

                    /*  get the .CSV data  ==>  auto complete latlng ==> POST back   */

                    function setElem (url,cell,text) {     // "https://ethercalc.org/_/farmer", A1, "mewMew"
                                $.ajax({
                                    url: hackUrl,
                                    type: 'POST',
                                    dataType: 'application/json',
                                    contentType: 'text/plain',
                                    processData: false,
                                    data: ('set ' + cell +' text t ' + text)
                                });

                    }

                    function processHackMapData (allText) {

                //        console.log(allText);
                        var allTextLines = allText.split(/\r\n|\n/); 


                  /***  get header  ***/

                        var headers = allTextLines[0].split(',');

                  /***   ****/


                        var list = [];

                        for (var i=2; i < allTextLines.length; i++) {
                            var datas = allTextLines[i].split(',');

                            var shack = {
                                         n: i,
                                         site: datas[0],
                                         name: (datas[1] && datas[1].replace(/"/g,'')) || '',
                                         address: datas[5],
                                         latlngColumn: (datas[6] && datas[6].replace(/\?\?\s?/,',').replace(/"/g,'')) || '',
                                         freetime: (datas[7] && datas[7].replace(/"/g,'')) || '',
                                         note: ((datas[3] && datas[3].split(':')[0].replace(';',':')) || '') +'<hr>'+ datas[4]
                                     };

                            for (var k = 0; k < headers.length; k++) {
                                if (headers[k]) shack[headers[k]] = datas[k];
                            };


                            if (shack.address) {
                                    if (!shack.latlngColumn) {

                                        function backfire(hackUrl, shack) {
                                                     $.getJSON("http://query.yahooapis.com/v1/public/yql?q=select+%2A+from+geo.placefinder+where+text%3D%22"
                                             + encodeURI(shack.address) +"%22+and+locale%3D%22zh_TW%22&format=json", function( d ) {

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

                                                if (lat && lng) {
                                                    var backfireData = parseFloat(lat) + '?? ' + parseFloat(lng);
                                                    setElem(hackUrl,['A','B','C','D','E','F','G'][6] + (shack.n + 1) , backfireData); // to Ethercalc

                                                }
                                            });
                                        }

                                        backfire(hackUrl, shack);
                                       
                                
                                } else {
                                    list.push(shack);
                                }

                            }
              //              console.log(list);
                        }

                        return list;
                    }

                        

                    $.ajax({
                        type: "GET",
                        url: hackmap + '.csv',
                        dataType: "text",
                            success: function(data) {
                              $scope.bases = $scope.bases || [];
                              $scope.bases[n] = {hands: processHackMapData(data)};

                         //     console.log($scope.bases[n]);

                              $scope.clearMarker();
                              $scope.makeMarkers();
                            }
                         });

                }
            }

            for (var i = 0; i < p.layers.length; i++) {
                makeLayer(i);
            };


/*    */




          /******   TODO   *********/



            //for backend normal ethercalcs  ==> auto complete latlng

            if (p.ethercalcs) {

                /*  getAll  CSV  datas ==>  auto complete latlng ==> POST back   */

            }


            //for backend static csvs
            if (p.csvs) {
                var myCsvs = p.csvs || [];
           //     if (p.ethercalc) myCsvs.unshift(p.ethercalc); 

                function processCsvData (allText) {
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
          //          console.log(list);
                    return list;
                }

                for (var i = 0; i < myCsvs.length; i++) {      
                    $.ajax({
                    type: "GET",
                    url: myCsvs[i],
                    dataType: "text",
                        success: function(data) {
                          $scope.base.hands = $scope.base.hands.concat(processCsvData(data));
           //               console.log($scope.base.hands);
                          $scope.clearMarker();
                          $scope.makeMarkers();
                        }
                     });
                };               

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

                var firstMapOffset = $("#local").position().top || $("#eagle").position().top || 0;
                $("body,html").animate({scrollTop:firstMapOffset}, "slow");


                //todo: auto enter leaflet map

                $scope.isFullscreen = true;
                $scope.$apply();

                if (!hand) return;

                $scope.center = $scope.local;

                $scope.local.lat = parseFloat(hand.latlngColumn.split(',')[0]);
                $scope.local.lng = parseFloat(hand.latlngColumn.split(',')[1]);
                $scope.local.zoom = 13;

                $scope.eagle.lat = parseFloat(hand.latlngColumn.split(',')[0]);
                $scope.eagle.lng = parseFloat(hand.latlngColumn.split(',')[1]);

                $scope.key = "";
                $scope.nameKey = "";
                $scope.geoKey = "";

                $scope.top = 0;
                $scope.left = 0;


                if(p.movie) {
                    $scope.hideAncient = true;
                    $scope.year = parseInt(hand[$scope.from]) + 15;
                }
                
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

            $scope.login = function (serviceProvider) {

                $scope.status = '資料讀取中...請稍候';

                for (var i = 0; i < p.layers.length; i++) {

                    if (p.logins[i] != serviceProvider) continue;
                    if (serviceProvider == 'facebook') {

                        auth = new FirebaseSimpleLogin($scope.dataRefs[i], function(error, user) {
                             
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
                    }
                }
            };

            $scope.logout = function () {
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
