angular.module("shackhand").directive('skhFinder', function($user){
            return {
                restrict: 'E',
                template: '<div class="col-md-12">'
        +'<div class="window.alert window.alert-info">'
            +'<h3>'+($user.p.slogen || '')+'</h3>'
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
                            +'以Facebook登入'
                            +'</button>'
            }
        }).directive('skhFblogout', function() {
            return {
                restrict: 'E',
                template: '<button id = "FBlogin" class="btn btn-primary" ng-click="logout()" ng-show = "root.name">'
                            +'登出'
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
                                 var li = (m.h.indexOf(myHref) > -1) ? '<li class = "active">' : '<li>';
                                 li += '<a href = "'+m.h+'">'+m['zh-tw']+'</a></li>';
                                 myList.push(li);
                             };

                              var htmlText = '<div class="collapse navbar-collapse">'
                                    +'<ul class="nav navbar-nav">'
                                      +myList.join('')
                                    +'</ul>'
                              +'</div>';

                            element.html(htmlText);
                        }
                    });

                   testService.getJSON(indexurl, function(data) {
                           scope.loadtext = data;
                    });

                }
            };
          }).directive('skhSelect',function($user){
          //  console.log($user);
            return {
                restrict: 'E',
                template: $user.p.selectBar
            }
          }).directive('skhFrame',function(){
            return {
                restrict: 'E',
                template:
                     '<div id = "skh-frame1">'
                        +'<span ng-show = "!hideFrame" ng-bind = "currentMarker.h.name"></span>'
                       //    +'<span ng-show = "!hideFrame && currentMarker" ng-bind = "currentMarker.lat"></span>'
                      //     +'<span ng-show = "!hideFrame && currentMarker" ng-bind = "\',\'"></span>'
                     //      +'<span ng-show = "!hideFrame && currentMarker" ng-bind = "currentMarker.lng"></span>'
                    //    +'<span ng-show = "currentMarker.h.name && !currentMarker.h.site">: 無網站</span>'
                        +'<input type = "checkbox" ng-model = "hideFrame"/>'
                        +'<iframe class = "noPhone" width="100%" height="100%" ng-show = "!hideFrame" ng-src = "{{frames[0]}}"></iframe>'
                    +'</div>'

              }
          }).directive('skhLocalmap',function(){
            return {
                restrict: 'E',
                template: '<div id = "local">'
             +'<form class="form-inline form-down" role="search">'
              +'<span ng-hide = "true">'
                +'<span ng-repeat = "k in [0,1,2,3]">'
                    +'<a ng-click = "askGeo(\'?\')" > <img class = "icon" src="module/src/images/findGeo.png"> </a>'
                +'</span>'
              +'</span>'

             +'<skh-select></skh-select>'
                + '<a class="btn" ng-click = "isFullscreen = !isFullscreen">'
                    +'<img class = "icon" src = "module/src/images/full-screen.png"></a>'

            +'</form>'
                    +'<div class = "center" ><a ng-click = "isFullscreen = true; askGeo(\'?\');" style = "display:block; overflow:hidden; width:32px; height:32px;">'
                    +'<img id = "skh-sprite" src="module/src/images/sprite.png"/>'
              //          +'<span id = "skh-warning" ng-show = "!isFullscreen && !center.lat">若看不到地圖，請點這裡</span>'
                    +'</a>'
                    +'</div>'

                    +'<div class = "center">'
            //        +'<span id = "skh-warning" class = "noPhone" style = "position: relative; top: 32px; right:50px;" ng-hide = "isFullscreen">'
            //            +'<a ng-click = "isFullscreen = true">按此進入RPG模式</a></span>'

                    +'<span id = "skh-warning" ng-show = "isFullscreen && !moving">點擊地圖一下，開始移動<br></span>'
                    +'<span id = "skh-warning" ng-show = "isFullscreen && !moving">上下左右移動，空白鍵對話</span>'
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


          +'<leaflet event-broadcast="events" center="center" markers = "markers" layers="layers" width="100%" height="'+($( window ).height()+100)+'"></leaflet>'
          
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
              +'<tr ng-repeat = "h in (bases[0].hands | filterBy:key | someFirst:root.follows)" ng-click = "focus(h)">'
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
          })
