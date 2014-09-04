
angular.module("shackhand").controller('SKH-Ctrl', function($scope, $skhDefault, $SKH,
                $user,
                leafletEvents, $firebase, $filter, $timeout,
                $http,
            //    $q,
                $localStorage
                ){

            $scope.storage = $localStorage.$default(
                { myWatches: [] }
            );

            $scope.myWatches = $localStorage.myWatches;
            $scope.myWatches.remove = function() {
                            var what, a = arguments, L = a.length, ax;
                            while (L && this.length) {
                                what = a[--L];
                                while ((ax = this.indexOf(what)) !== -1) {
                                    this.splice(ax, 1);
                                }
                            }
                            return this;
                        };

            $scope.encodeURI = encodeURI;
            $scope.decodeURI = decodeURIComponent;

            angular.element(document).ready(function() {
              $('input[autofocus]:visible:first').focus();
            });

            $timeout(function(){
                $('.leaflet-clickable').hover(
                      function(){$(this).css('z-index',900)}
                    , function(){$(this).css('z-index',890)});
            }, 3000);

            if(navigator.appName == 'Microsoft Internet Explorer') {
                if (confirm("IE瀏覽器不支援，請改用Firefox或Chrome")) {
                    window.open('http://moztw.org/firefox/');
                    window.open('http://www.google.com.tw/intl/zh-TW/chrome/browser/');
                }
            }

            $scope.frames = $user.p.frames || [];

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
        //            console.log(event);
        //            console.log(args);
                    $scope.eventDetected = event.name;
                    $scope.eventMarkerIndex = args.markerName;

        //            console.log($scope.markers[$scope.eventMarkerIndex]);

                    if ($scope.eventDetected == "leafletDirectiveMarker.mouseover"
                        || $scope.eventDetected == "leafletDirectiveMarker.popupopen") {

                       //     $scope.frameUrl = $scope.markers[$scope.eventMarkerIndex].site;
                            if ($scope.currentMarker != $scope.markers[$scope.eventMarkerIndex]) {
                                $scope.currentMarker = $scope.markers[$scope.eventMarkerIndex];

                                $("#skh-frame1").children('iframe').attr("src",$scope.currentMarker.h.site || ($user.p.frames && $user.p.frames[1]) || '');
                            }
                    }

                    if ($scope.eventDetected == "leafletDirectiveMarker.popupopen") {
                        $scope.toggleWatch($scope.currentMarker.h,'name',1);
                    }


//                    if ($scope.eventDetected == "leafletDirectiveMarker.popupopen") console.log("beep");

                });
            }

            // for history map
            $scope.year = $SKH.year;
            $scope.speed = 0;
            $scope.from = ($user.p.from || 'birth');
            $scope.to = ($user.p.to ||'death');
            /*****  ***/


            $scope.onTimeout = function(){

                if ($user.p.movie) {

                    if (!$scope.pause) $scope.year += $scope.speed;

                    $scope.markers = [];
                    $scope.clearMarker();
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
                        if ($user.p.movie) {
                            $scope.pause = !$scope.pause;
                        }

                        /* sort by distance */

                        $scope.sorted = $scope.markers
                            .filter(function(a){
                                if (a && a.lat && $scope.center && $scope.center.lat) {
                                    return (new L.LatLng(parseFloat(a.lat),parseFloat(a.lng)).distanceTo(
                                        new L.LatLng($scope.center.lat,$scope.center.lng)) < 50000 )
                                } else {
                                    return false;
                                }
                            })
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

            $scope.lang = $user.p.lang || navigator.language || navigator.userLanguage || '"zh-tw"';
            $scope.listKeys = $user.p.listKeys;
            $scope.listKeyNames = $user.p.listKeyNames;



            angular.extend($scope, {
                center: {
                    autoDiscover: true,
                    lat: ($user.p.lat || 24.704894502324912),
                    lng: ($user.p.lng || 121.19355468749999),
                    zoom: $user.p.zoom || ($(window).width() < 480 && 12) || 10
                },

                local: {
          //          autoDiscover: true,
                    lat: 23.704894502324912,
                    lng: 120.89355468749999,
                    zoom: $user.p.zoom || ($(window).width() < 480 && 12) || 10
                },

                taiwan: {
                    lat: 23.704894502324912,
                    lng: 120.89355468749999,
                    zoom: 7,
                },

                eagle: ($user.p.eagle || {
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
                    }
                },

                toggleLayer: function(type) {
                    $scope.layers.overlays[type].visible = !$scope.layers.overlays[type].visible;
                }

            });

                    if ($user.p.eagle) {
                        $scope.center = $scope.eagle;
                    } 


            $scope.$watch('center.zoom', function(newValue, oldValue) {
               if (newValue != oldValue) {
                  $scope.clearMarker();
                  $scope.makeMarkers();
     //                   $scope.shiftMarkers();
                 }
            });

            $scope.bindHash = function(){            
                    location.hash = '#' + ($scope.loc || '') 
                                  + '#' +  ($scope.key || '');
            }

            $scope.$watch('loc', function(newValue,oldValue) {
                if (newValue != oldValue) {
                        $scope.bindHash();
                }
            })

            $scope.$watch('key', function(newValue,oldValue) {
                if (newValue != oldValue) {
                        $scope.bindHash();
                }
            })

    /*      $scope.shiftMarkers = function(){
                for (var i = 0; i < $scope.markers.length; i++) {
                    $scope.markers[i].icon.iconSize = $scope.markers[i].icon.iconSize;
                };
            }  */

            $scope.clearMarker = function(){
                $scope.markers = [];
                $('leaflet-marker-icon').hide();
                $user.p.latlngUsed = [];

            }

            $scope.makeMarkers = function(maybeHideLatLng, expHand){
                var ks = {
                    key : $scope.key,
                    nameKey: $scope.nameKey,
                    geoKey: $scope.geoKey
                }

                $scope.markers = $scope.markers || [];

                for (var i = 0; i < $user.p.layers.length; i++) {

                    if (!$scope.bases || !$scope.bases[i]) continue;

                    var show = $filter('hideAncient')($scope.bases[i].hands,$scope.hideAncient,$scope.year,$scope.from,$scope.to);

                    $scope.markers = $scope.markers.concat(($filter('toMarkers')(show, ks, maybeHideLatLng,
                                        expHand,$scope.year,$scope.whichLable, "" + i,
                                          $scope.center.zoom )));
                };

            };

            $scope.askGeo = function(place){

                if (place == '?') place = prompt("您在哪兒呢?", $user.p.at || '');

                if (place) {
                    $scope.loc = place;
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
                    if (lat) $scope.local.zoom = $user.p.zoom || 13;

               //     if ($user.p.eagle) {
               //         $scope.center = $scope.eagle;
               //     } else {
                      $scope.center = $scope.local;
               //     }

                    $scope.$apply();
                });
            };


            var h = location.hash.split(/#\/?/);

               $scope.key = decodeURI(h[2] || '') || $user.p.key || '';
               $scope.loc = decodeURI(h[1] || '') || $user.p.at || '';

                if (h && h.length > 1) {
                    $timeout(function(){
                        var firstMapOffset = ($("#local").position() && $("#local").position().top)
                         || ($("#eagle").position() && $("#eagle").position().top) || 0;

                        $("body,html").animate({scrollTop:firstMapOffset + 50}, "slow");
                    }, 2000);
                }

            $scope.askGeo($scope.loc);

            $scope.base = {hands: [], shacks: []};

/*    */

            function makeLayer(n) {
                var title = $user.p.layers[n];
                var type = $user.p.types[n];
                var url = $user.p.urls[n];
                var login = ($user.p.logins && $user.p.logins[n]) || undefined;
                var toFlag = ($user.p.toFalgs && $user.p.toFlags[n]) || undefined;
                var toLabel = ($user.p.toLables && $user.p.toLables[n]) || undefined;
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
                            $.getJSON(url,function(data){
                                    $scope.bases = $scope.bases || [];
                                    $scope.bases[n].hands = data;
                            });
                }

                //for backend ethercalc using hackfoler format ==> hackmap
                if (type == 'hackmap') {
                    var hackmap = url;

                    /*  get the .CSV data  ==>  auto complete latlng ==> POST back   */                   

                            $http({
                                method: "GET",
                                url: hackmap + '.csv',
                                dataType: "text"})
                                    .success(function(data) { 
                                          console.log(data);
                                          $scope.bases = $scope.bases || [];
                                          $scope.bases[n] = {hands: processHackMapData(data, url)};
                                          
                                          $timeout(function(){
                                                        $scope.clearMarker();
                                                        $scope.makeMarkers();
                                                    }, 1000);
                                        })
                                    .error(function(XMLHttpRequest, textStatus, errorThrown){

                                        console.log("Status: " + textStatus);
                                        console.log("Error: " + errorThrown); 

                                    });

                }  /* type end */


                if (type == 'ethercalc') {

                    /*  get the .CSV data  ==>  auto complete latlng ==> POST back   */  



                   $http({
                        method: "GET",
                        url: url + '.csv',
                        dataType: "text"})
                          .success(function(data) { 
                              console.log(data);
                              $scope.bases = $scope.bases || [];
                              $scope.bases[n] = {hands: processEthercalcData(data, url)};                             


                            })
                        .error(function(XMLHttpRequest, textStatus, errorThrown){

                                console.log("Status: " + textStatus);
                                console.log("Error: " + errorThrown); 
                        });

                }


                function setElem (url,cell,text) {     // "https://ethercalc.org/_/farmer", A1, "mewMew"

                            var hackUrl = url.replace(/([^\/])\/([^\/])/, '$1'+ '/_/' +'$2');

                            $.ajax({
                                url: hackUrl,
                                type: 'POST',
                                dataType: 'application/json',
                                contentType: 'text/plain',
                                processData: false,
                                data: ('set ' + cell +' text t ' + text)
                            });

                }

                function backfire(url, shack, colNum) {

                        $http.get("http://query.yahooapis.com/v1/public/yql?q=select+%2A+from+geo.placefinder+where+text%3D%22"
                         + encodeURI(shack.address.replace(/\s/g,'')) +"%22+and+locale%3D%22zh_TW%22&format=json").success(function( d ) {

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

                                
                                setElem(url,
['A','B','C','D','E','F','G','H','I','J'][colNum || 6] + (shack.n + 1) , backfireData); // to Ethercalc

                            }
                        });
                    }


                function processHackMapData (allText, url) {
                        var allTextLines = allText.split(/\r\n|\n/);
                        var headers = allTextLines[0].split(',');
                        var list = [];
                        for (var i=2; i < allTextLines.length; i++) {
                            var datas = allTextLines[i].replace(/(\d+)\,\s?(\d+)/, '$1?? $2').split(',');
                            var shack = {
                                         n: i,
                                         site: datas[0],
                                         name: (datas[1] && datas[1].replace(/"/g,'')) || '',
                                         address: datas[5],
                                         latlngColumn: (datas[6] && datas[6].replace(/\?\?\s?/,',').replace(/"/g,'')) || '',
                                         freetime: datas[7] || '',
                                         note: ((datas[3] && datas[3].split(':')[0].replace(';',':')+'<hr>') || '') + datas[4]
                                     };

                            for (var k = 0; k < headers.length; k++) {
                                if (headers[k]) shack[headers[k]] = datas[k];
                            };

                            if (shack.address) {
                                    if (!shack.latlngColumn) {                                      
                                        backfire(url, shack);
                                } else {
                                    list.push(shack);
                                }
                            }
                        }
                        return list;
                    }

                    function processEthercalcData(allText,url){
                        var allTextLines = allText.split(/\r\n|\n/);
                        var headers = allTextLines[0].split(',');
                        var latlngColumnNum = headers.indexOf('latlngColumn');
                            if (latlngColumnNum == -1) latlngColumnNum = undefined;
                        var list = []; 

                        for (var i=2; i < allTextLines.length; i++) {
                            if (!allTextLines[i]) continue;

                            var datas = allTextLines[i].replace(/(\d+)\,\s?(\d+\.\d+)/, '$1?? $2').split(',');
                            var shack = { n: i };

                            for (var k = 0; k < headers.length; k++) {

                                console.log(headers[k]);
                                console.log(datas[k]);

                                if (k == latlngColumnNum) {
                                    shack[headers[k]] = (datas[k] || "").replace(/\?\?\s?/,',').replace(/"/g,'') || '';
                                

                                console.log("happy");
                                console.log(shack[headers[k]]);

                                } else {
                                    if (headers[k]) shack[headers[k]] = datas[k];
                                }

                                console.log(shack[headers[k]]);
                            };


                            if (shack.address) {
                                    if (!shack.latlngColumn) {                                 
                                        backfire(url, shack, latlngColumnNum);
                                } else {
                                    list.push(shack);
                                }
                            }
                        }
                        return list;
                    }

            }

        for (var i = 0; i < $user.p.layers.length; i++) {       
                makeLayer(i);
        };







        if ($user.p.ethercalcs) {
            /*  getAll  CSV  datas ==>  auto complete latlng ==> POST back   */
        }


        //for backend static csvs
        if ($user.p.csvs) {
            var myCsvs = $user.p.csvs || [];
       //     if (p.ethercalc) myCsvs.unshift(p.ethercalc);

            function processCsvData (allText) {
            //    console.log(allText);
                var list = [];
                var allTextLines = allText.split(/\r\n|\n/);
                var headers = allTextLines[0].split(',');

                for (var i=1; i < allTextLines.length; i++) {
                    var datas = allTextLines[i].replace(/(\d+)\,\s?(\d+)/, '$1?? $2').split(',');
                    if (datas.length == headers.length) {
                        var hand = {};
                        for (var j=0; j < headers.length; j++) {
                            if (headers[j] == 'latlngColumn') datas[j] = datas[j].replace(/\?\?\s?/,',') .replace(/"/g,'');
                            hand[headers[j]] = datas[j];
                        };
                        list.push(hand);
                    }
                }
                return list;
            }

            for (var i = 0; i < myCsvs.length; i++) {
                $.ajax({
                type: "GET",
                url: myCsvs[i],
                dataType: "text",
                    success: function(data) {
                      $scope.bases[0].hands = $scope.bases[0].hands.concat(processCsvData(data));
                      $scope.clearMarker();
                      $scope.makeMarkers();
                    }
                 });
            };
        }
           $scope.qWatch = function(obj,q) {
              q = q || 'name';
              return !($scope.myWatches.map(function(t){return t[q]}).indexOf(obj[q]) == -1);
           }

            $scope.toggleWatch = function(obj, q, sure) {
               if (!$scope.qWatch(obj,q)) {
                 $scope.myWatches.push(obj);
               } else {
                  if (!sure) {
                        $scope.myWatches.remove(obj);
                    }
               }
            }

            $scope.clearWatch = function(){
                while($scope.myWatches.length) {
                    $scope.myWatches.remove($scope.myWatches[0]);
                    $scope.center.zoom -= 3;
                }
            }

        $scope.focus = function(hand) {

            var firstMapOffset = ($("#local").position() && $("#local").position().top)
                     || ($("#eagle").position() && $("#eagle").position().top) || 0;

            $("body,html").animate({scrollTop:firstMapOffset}, "slow");

            $scope.toggleWatch(hand, 'name', 1);
            console.log($localStorage);

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

            if($user.p.movie) {
                $scope.hideAncient = true;
                $scope.year = parseInt(hand[$scope.from]) + 15;
            }
            $scope.toggleFollow(hand);
        }

        $scope.checkLatLng = function(add,n,k) {

             $http.get("http://query.yahooapis.com/v1/public/yql?q=select+%2A+from+geo.placefinder+where+text%3D%22"+ add +"%22+and+locale%3D%22zh_TW%22&format=json").success(function( d ) {

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

                if (k) { $scope.root.friends[k].latlngColumn = lat+','+lng }
                    else { $scope.root.latlngColumn = lat+','+lng }
                if ($scope.markers[n]) $scope.markers[n].lat = parseFloat(lat);
                if ($scope.markers[n]) $scope.markers[n].lng = parseFloat(lng);

                $scope.local.lat = parseFloat(lat);
                $scope.local.lng = parseFloat(lng);

            });
        }

        $scope.login = function (serviceProvider) {
            $scope.status = '資料讀取中...請稍候';
            for (var i = 0; i < $user.p.layers.length; i++) {

                if ($user.p.logins[i] != serviceProvider) continue;
                if (serviceProvider == 'facebook') {

                    auth = new FirebaseSimpleLogin($scope.dataRefs[i], function(error, user) {

                          if (error) {
                            // an error occurred while attempting login
                            console.log(error);
                          } else if (user) {

                            var data = user.thirdPartyUserData;

                                $scope.root.site = data.link;
                                $scope.root.note = data.bio;

                                if (data.hometown && data.hometown.name) $scope.root.hometown = data.hometown.name;
                                $scope.root.id = data.id;
                                $scope.root.username = data.username;

                                $timeout(function(){
                                         if (data.hometown && data.hometown.name) $scope.root.hometown = data.hometown.name;
                                        $scope.root.id = data.id;
                                        $scope.root.username = data.username;
                                },2000);
                                $scope.status = '讀取完畢!請修改後發佈';
                                if ($scope.root.hometown) $scope.askGeo($scope.root.hometown);

                            $http.get('http://graph.facebook.com/' + user.id).success(function(d){
                                console.log(d);
                                $scope.ttName = d.name + "";
                                $scope.root.name = d.name + "";

                               for (var i = 0; i < $scope.bases[0].hands.length; i++) {

                                    if (!$scope.bases[0].hands[i]) continue;
                                    if ($scope.bases[0].hands[i].id == data.id || ( !$scope.bases[0].hands[i].id && $scope.bases[0].hands[i].name && $scope.bases[0].hands[i].name == $scope.root.name) )  {

                                        var usrNameBuf = $scope.root.username +"";
                                        var idBuf = $scope.root.id +"";
                                        var htBuf = $scope.root.hometown +"";

                                        $scope.root = angular.copy($scope.bases[0].hands[i]);
                                        $scope.root.invis = false;
                                        $scope.root.username = usrNameBuf;
                                        $scope.root.id = idBuf;
                                        $scope.root.hometown = htBuf;
                                        $scope.n = i;
                                        $scope.imp = true;
                                        $scope.loc = angular.copy($scope.root.address);
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
            $scope.n = $scope.bases[0].hands.length;
        }

        $scope.out = function () {
            if (confirm("確定要移除旗幟??這將會讓許多朋友失去一條找到您的路。")) {

//                  $scope.base.$child('hands').$child($scope.n).$child('invis').$set(true);
                $scope.base.$child('hands').$child($scope.n).$remove();

                for (var i = $scope.n; i < $scope.bases[0].hands.length - 1; i++) {
                    $scope.base.$child('hands').$child(i).$set(angular.copy($scope.bases[0].hands[i+1]));
                };

                $scope.base.$child('hands').$child($scope.bases[0].hands.length - 1).$remove();

                $scope.root = new Object;
                $scope.status = "";
            }
        }

        $scope.submit = function (verb,target) {

            if (!target) target = 0;

            $http.get("http://query.yahooapis.com/v1/public/yql?q=select+%2A+from+geo.placefinder+where+text%3D%22"+ $scope.root.address +"%22+and+locale%3D%22zh_TW%22&format=json")
                .success(function( d ) {

                var whiteList = $user.p.whiteList || [];
                var checkList = $user.p.checkList || [];

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

                if (!$scope.bases[target].hands ||
                    !$scope.bases[target].hands[n] ||
                    $scope.bases[target].hands[n].id == $scope.root.id ||
                    $scope.bases[target].hands[n].name == $scope.root.name ||
                    $scope.bases[target].hands[n].username == $scope.root.username)  {

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

                 //   console.log($scope.bases[target].hands[n]);
                    var ks = Object.keys($scope.root);

                    for (var i = 0; i < ks.length; i++) {
                        if (typeof($scope.root[ks[i]]) == 'undefined') {
                            $scope.root[ks[i]] = false;
                        }
                    };

                    $scope.bases[target].$child('hands').$child(n).$set(angular.copy($scope.root));
                    $scope.bases[target].hands[n] = angular.copy($scope.root);

                    var a = "成功!!\n\n將此網址貼上圖鴨牆以介紹在地朋友:\n"
                        + window.location.href + '#' + $scope.root.address + "\n\n歡迎隨時回來更新!!";
                    window.alert((verb + a) || a);

                } else {
                    window.alert("抱歉，出了未知的問題");
                }
        });
    }
});
