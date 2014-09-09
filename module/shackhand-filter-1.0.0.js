angular.module("shackhand").filter('getKeys',function(){
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
                    return (parseInt(h[from]) <= year && (year <= parseInt(h[to]) || !h[to] ))
                });

                return list;
            }
        }).filter('toMarkers', function($SKH, $user){
            return function (list, ks, maybeHideLatLng, expHand, year, whichLable, whichGroup, zoomNow) {
                var keys = [ks.key, ks.nameKey, ks.geoKey];
                var ms = [];
                var autos = angular.copy(list);
                var mllC = function(h){
                  //重覆座標的解決  displacement algorithm
                        var counter = 0;
                        for (var j = 0; j < $user.p.latlngUsed.length; j++) {
                            if ($user.p.latlngUsed[j] == h.latlngColumn) counter++ ;
                        };
                        $user.p.latlngUsed.push(h.latlngColumn);
                        var llC = "" + h.latlngColumn;
                        if (counter > 0) llC = $SKH.modifyLatLng(h.latlngColumn, counter);
                        return llC;
                }

                if (autos) {
                    for (var i = 0; i < (autos.length || 0); i++) {
                        var h = autos[i];

                        if (!h) { console.log('略過空格'); continue; }

                        if (maybeHideLatLng && $SKH.isClose(h.latlngColumn,maybeHideLatLng) && h.id != expHand.id) {
                            console.log('略過同地址'); continue;
                        }

                        var m = $user.p.hToM(keys,h,i,mllC(h),0,0,year,whichLable,whichGroup, zoomNow);

                        if (m) ms.push(m);

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
        }).filter('filterBy', function(){
            return function(list, key) {
                list = list || [];
                return list.filter(function(o){
                    return Object.toString(o).indexOf(key) > -1
                })
            }
        });
