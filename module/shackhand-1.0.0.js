var SKH = function() {
      this.year = new Date().getFullYear();
      this.has = function (val) {
              return (val && val != 'undefined');
      }
      this.toAge = function (str,year) {
          var age = (str && (year || this.year) - parseInt(str)) || '';
          return age;
      }
      this.toHref = function (str) {
          return (str.indexOf('http') > -1)? str : 'http://' + str;
      }
      this.isClose = function(l1, l2) {
              if (!l1 || !l2) return false;
              console.log(l2);
              return Math.pow(parseFloat(l1.split(',')[0]) - parseFloat(l2.split(',')[0]), 2) + Math.pow(parseFloat(l1.split(',')[0]) - parseFloat(l2.split(',')[0]), 2) < 0.0001;
      }
      this.modifyLatLng = function (latlngColumn, counter) {   //  "lat,lng"
          var lat = parseFloat(latlngColumn.split(',')[0]);
          var lng = parseFloat(latlngColumn.split(',')[1]);

          var r = counter / 1000 * 20;
          var theta = counter * Math.PI / 12;

          var lngOffSet = r * Math.cos(theta);    // x
          var latOffSet = r * Math.sin(theta) / 2;    // y

          return ((lat + latOffSet) + ',' + (lng + lngOffSet));
      }
      this.toIcon = function (url, from, zoomNow, whichGroup, iconSize) {
         zoomNow = parseInt(zoomNow);
         
         // if (!zoomNow) zoomNow = 10;

         whichGroup = whichGroup || [];
         var iconSize = iconSize || [];
         return { iconUrl: url,
          
                  iconSize: [(iconSize[whichGroup] || 60) * (zoomNow / 20)
                          , (iconSize[whichGroup] || 60) * (zoomNow / 20)],

                  iconAnchor: [-(iconSize[whichGroup] || 60) * (zoomNow / 40)
                          , (iconSize[whichGroup] || 60) * (zoomNow / 40)],


                  labelAnchor: [(iconSize[whichGroup] || 60) * (zoomNow / 40)
                          , -(iconSize[whichGroup] || 60) * (zoomNow / 40)],

                  shadowUrl: '', //module/src/images/200px-Smiley.svg.png',

                  shadowSize: [(iconSize[whichGroup] || 60) * (zoomNow / 40)
                          , (iconSize[whichGroup] || 60) * (zoomNow / 40)]
                };
      }
}

var $$SKH = new SKH;


angular.module("shackhand",
        ['leaflet-directive','FBAngular','firebase','ezfb','ngStorage'])

    .service("$skhDefault", function($user){

        this.toDefaultIcon = function(zoomNow, whichGroup){
            zoomNow = parseInt(zoomNow);
            if (zoomNow <= 1) zoomNow = 10;

            var iconSize = $user.p.iconSize || [];


            return {
                iconUrl: 'module/src/images/200px-Smiley.svg.png',
                iconSize: [(iconSize[whichGroup] || 60) * zoomNow / 10, (iconSize[whichGroup] || 60) * zoomNow / 10],
                shadowUrl : '',// 'module/src/images/200px-Smiley.svg.png',
                shadowSize: [(iconSize[whichGroup] || 60) * zoomNow / 10, (iconSize[whichGroup] || 60) * zoomNow / 10],
            }
        }
    }).service("$SKH", SKH)
      .service('testService', function($rootScope, $http) {
        this.getJSON = function(url,cb) {
           $http.get(url).success(cb).
                error(function(data, status, headers, config) {
     //               window.alert(status + " | bad");
                });
            };
    }).provider('$user', function $userProvider() {
      var myP = {
        /* Default  */
      };

      this.initAll = function(userP) {
        myP = userP;
      };

      this.$get = ['$SKH', function $userFactory($SKH) {
        var p = angular.copy(myP);
        p.headers = p.headers || ['name','site'];
                p.lang = (p.lang || 'en');
                p.l = (p.l || {});
                p.toFlags = p.toFlags || [];
                p.toLabels = p.toLabels || [];
                p.logins = p.logins || [];
                p.latlngUsed = p.latlngUsed || [];
                p.hToM = (p.hToM || default_hToM);

                function default_hToM (keys,h,i,llC,from,fbid,year,whichLable,whichGroup,zoomNow) {

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
                h.icon = icon;

                var flag, label;

                flag = (p.toFlags[parseInt(whichGroup)] || toHackMapFlag || p.toFlags[0] || function () {return})(hand, i, icon, year);
                label = (p.toLabels[parseInt(whichGroup)] || //toHackMapLable ||
                                p.toLabels[0] || function () {return})(hand, i, icon, year, whichLable);


                if (key && key.length > 0) {
                    var re = new RegExp(('('+key+')').replace(/\s*(\s|or)\s*/gi, '|'), "gi");
                    if (flag.search(re) == -1 &&  
                            p.layers[parseInt(whichGroup)].search(re) == -1) {
                    
                            console.log('略過關鍵字不符者'); return;

                    } else {
                        flag = flag.replace(re, '<span class = "highlight">$1</span>');
                    }
                }
  //              console.log(h.name);
  //              console.log(llC);

                  var marker = {
                      lat: parseFloat(llC.split(/,\s*/)[0]),
                      lng: parseFloat(llC.split(/,\s*/)[1]),
                      layer: whichGroup,
                      message : flag,
                      h: h,
                      focus: false,
                      draggable: true,
                      hide: true,
              //        popupOptions: {
              //            autoPan: false
              //        },
                      label: {
                          message: label,
                          options: {
                              noHide: label
                          }
                      },
                      icon: ((icon && $SKH.toIcon(icon,
                                                  (from || 0),
                                                 zoomNow,  whichGroup,
                                                 p.iconSize)) || $skhDefault.toDefaultIcon((zoomNow || 10),
                                                 whichGroup,p.iconSize)
                             )
                  }

                  return(marker);
            }


            function toHackMapFlag (shack, i, Icon, from) {

                    var middle = '';
                    for (var i = 0; i < p.headers.length; i++) {
                        if (shack[p.headers[i].n]) middle += '<br>' + p.headers[i].t + '：' + shack[p.headers[i].n] + '<br>'
                    };

                    return '<div class="flag">'
                                +((shack.site && '<a href = "'+$SKH.toHref(shack.site)+'" target = "_blank">'
                                  + '<img title = "' + shack.site
                                      +'"src = "http://www.google.com/s2/favicons?domain=' + shack.site +'">' ) || "")

                                +'<strong>'+ shack.name+'</strong></a><br />'

                                + middle


                                +'<hr>'
                                +( shack.note.replace(/\n/g, '<br>')|| "")+'<br />'
                                +'<hr>'

                                +((shack.site && '<a href = "'+$SKH.toHref(shack.site)+'" target = "_blank">'
                                  + '<img title = "' + shack.site
                                      +'"src = "http://www.google.com/s2/favicons?domain=' + shack.site +'">' ) || "")

                                +'<strong>'+ shack.name+'</strong></a><br />'

                            +'</div>';
                }
          console.log(p);
          return {p: p};
    }];
  });


