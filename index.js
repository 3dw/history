     angular.module('demoapp', ['shackhand'])

        .config(["$userProvider", function($userProvider) {
             $userProvider.initAll({   
                    slogen:  '歷史地圖',    
                    selectBar: '', 
                    eagle: {
                                lat: 23.704894502324912,
                                lng: 120.89355468749999,
                                zoom: 3,
                    },
                    lang:'zh-tw',

                    checkList: [],
                    whiteList: [],
                    
                    layers: ['教育與心靈','數理與科技', '社會運動'],
                    urls: [
                            'https://ethercalc.org/pctvhbrpod',
                            'https://ethercalc.org/ans7j6cn1z',
                            'https://ethercalc.org/esnxmz3kmk'],
                    layerIcons: [
                                'https://www.moedict.tw/教.png?font=wt006',
                                'https://www.moedict.tw/科.png?font=wt006',
                                'https://www.moedict.tw/社.png?font=wt006'],
                    types: ['ethercalc', 'ethercalc', 'ethercalc'],

                    toFlags: [toFlag,toFlag,toFlag],
                    toLabels: [toLabel,toLabel,toLabel],

                    iconSize: [200,200,200],

                    logins:[],
                    headers:[],

                    listKeys: ['name','address','works'], //'connect_me',
                    listKeyNames: {
                      name:'名稱',
                      address:'位於',
                      share: '成就',
                    },
                    movie: true
                 });
        }])  

        .filter('toEra' ,function(){
            return function(n,view) {
                switch (n,view) {
                    case 'eu':
                        if (n < -9500) return "前農業時代";
                        if (n < -3500) return "國家體制";
                        if (n < -800) return "希臘黑暗時代";
                        if (n < 14) return "古希臘時期";
                        if (n < 476) return "羅馬帝國";
                        if (n < 768) return "中世紀";
                        if (n < 1158) return '卡洛林文藝復興';
                        if (n < 1265) return "十二世紀的文藝復興";
                        if (n < 1650) return "文藝復興與大航海時代";
                        if (n < 1750) return "啟蒙時代";
                        if (n < 1830) return "工業革命與普魯士教育系統"
                        if (n < 1914) return "軍國主義興起"
                        if (n < 1918) return "第一次世界大戰";
                        if (n < 1939) return "戰間期";
                        if (n < 1945) return "第二次世界大戰";
                        if (n < 1953) return "冷戰";
                        if (n < 1994) return "區域整合與全球貿易時代";
                        if (n >= 1994) return "全球資訊網";
                        break;
                    case 'zh':
                        if (n < -2070) return "史前時代";
                        if (n < -1600) return "夏朝";
                        if (n < -1046) return "商朝";
                        if (n < -771) return "西周";
                        if (n < -476) return "東周(春秋)";
                        if (n < -221) return "東周(戰國";
                        if (n < -206) return "秦";
                        if (n < 23) return "西漢";
                        if (n < 220) return "東漢";
                        if (n < 280) return "三國";
                        if (n < 316) return "西晉";
                        if (n < 420) return "東晉";
                        if (n < 439) return "五胡十六國";
                        if (n < 581) return "南北朝";
                        if (n < 618) return "隋朝";
                        if (n < 907) return "唐";
                        if (n < 979) return "五代十國";
                        if (n < 1227) return "北宋";
                        if (n < 1279) return "南宋";
                        if (n < 1368) return "元朝";
                        if (n < 1644) return "明朝";
                        if (n < 1911) return "清朝";
                        if (n < 1949) return "中華民國";
                        if (n >= 1949) return "兩岸分治";
                        break;
                    default:
                        return;
                    }
            }    
        });



       function toWiki(str, lang){
            if (!str) return '';
            return str.split('、').map(function(u){return '<a href = "http://'+(lang || 'zh')+'.wikipedia.org/wiki/' + u + '" target = "_blank">' + u +'</a>'}).join('、');
       }
     
       function toFlag(hand, i, Icon, year)  {
              var flag = '<div class="flag">'
                        + '<a href = "http://zh.wikipedia.org/wiki/'+hand.name+'" target = "_blank">' 

                        + hand.name+'(' + $$SKH.toAge(hand.birth,year) + '歲)'
                        +'<img src = "' + Icon+ '" id = "wiki" />'
                        +'</a>'

                        +'<br>&nbsp;&nbsp;生於'
                        +'<a href = "http://zh.wikipedia.org/wiki/'
                        +hand.address.replace(/(.+)-/,'')
                        +'" target = "_blank">'+hand.address+'</a>附近<hr>'

               
                        +'<hr>'
                        +'<b>興趣包含：</b>'+toWiki(hand.fields,'zh')+'<br />'
                        +'<b>可分享：</b>'+toWiki(hand.works,'zh')+'<br />'
                        +'<hr>圖文資料來源：'
                        + '<a href = "http://zh.wikipedia.org/wiki/'+hand.name+'" target = "_blank">維基百科'
                        +'</a>'
                        +'</div>';
    //        console.log(flag);
            return flag;
       }

       function toLabel (hand, i, Icon, year, whichLabel) {
          return hand.name;

       }