//动态标题
var OriginTitile = document.title;
var titleTime;
document.addEventListener("visibilitychange", function () {
  if (document.hidden) {
    //离开当前页面时标签显示内容
    document.title = "w(ﾟДﾟ)w 不要走！再看看嘛！";
    clearTimeout(titleTime);
  } else {
    //返回当前页面时标签显示内容
    document.title = "♪(^∇^*)欢迎肥来！" + OriginTitile;
    //两秒后变回正常标题
    titleTime = setTimeout(function () {
      document.title = OriginTitile;
    }, 2000);
  }
});

// ============================================================
//  动态彩色控制台输出
// ============================================================
console.clear(); // 每次清除之前的输出，产生动态效果

console.log("%c子子涵ya", " text-shadow: 0 1px 0 #ccc,0 2px 0 #c9c9c9,0 3px 0 #bbb,0 4px 0 #b9b9b9,0 5px 0 #aaa,0 6px 1px rgba(0,0,0,.1),0 0 5px rgba(0,0,0,.1),0 1px 3px rgba(0,0,0,.3),0 3px 5px rgba(0,0,0,.2),0 5px 10px rgba(0,0,0,.25),0 10px 10px rgba(0,0,0,.2),0 20px 20px rgba(0,0,0,.15);font-size:5em");

console.log("%c每一个案例都是故事", " text-shadow: 0 1px 0 #ccc,0 2px 0 #c9c9c9,0 3px 0 #bbb,0 4px 0 #b9b9b9,0 5px 0 #aaa,0 6px 1px rgba(0,0,0,.1),0 0 5px rgba(0,0,0,.1),0 1px 3px rgba(0,0,0,.3),0 3px 5px rgba(0,0,0,.2),0 5px 10px rgba(0,0,0,.25),0 10px 10px rgba(0,0,0,.2),0 20px 20px rgba(0,0,0,.15);font-size:5em");

console.log('%c让编程改变世界.', 'color: #fff; background: #2ebb96; font-size: 24px;');

Function.prototype.getMultiLine = function () {
    var lines = new String(this);
    lines = lines.substring(lines.indexOf("/*") + 3, lines.lastIndexOf("*/"));
    return lines;
}

var string = function () {
    /*

 ____    __
/\  _`\ /\ \
\ \ \/\_\ \ \___      __      ___      __      __
 \ \ \/_/\ \  _ `\  /'__`\  /' _ `\  /'_ `\  /'__`\
  \ \ \L\ \ \ \ \ \/\ \L\.\_/\ \/\ \/\ \L\ \/\  __/
   \ \____/\ \_\ \_\ \__/.\_\ \_\ \_\ \____ \ \____\
    \/___/  \/_/\/_/\/__/\/_/\/_/\/_/\/___L\ \/____/
 __    __                              /\____/
/\ \__/\ \                             \_/__/
\ \ ,_\ \ \___      __
 \ \ \/\ \  _ `\  /'__`\
  \ \ \_\ \ \ \ \/\  __/
   \ \__\\ \_\ \_\ \____\
    \/__/ \/_/\/_/\/____/
                        ___       __
                       /\_ \     /\ \
 __  __  __   ___   _ _\//\ \    \_\ \
/\ \/\ \/\ \ / __`\/\`'__\ \ \   /'_` \
\ \ \_/ \_/ /\ \L\ \ \ \/ \_\ \_/\ \L\ \
 \ \___x___/\ \____/\ \_\ /\____\ \___,_\
  \/__//__/  \/___/  \/_/ \/____/\/__,_ /
 __
/\ \
\ \ \____  __  __
 \ \ '__`\/\ \/\ \
  \ \ \L\ \ \ \_\ \
   \ \_,__/\/`____ \
    \/___/  `/___/> \
               /\___/
               \/__/
 _____   _ __  ___     __   _ __   __      ___ ___
/\ '__`\/\`'__/ __`\ /'_ `\/\`'__/'__`\  /' __` __`\
\ \ \L\ \ \ \/\ \L\ /\ \L\ \ \ \/\ \L\.\_/\ \/\ \/\ \
 \ \ ,__/\ \_\ \____\ \____ \ \_\ \__/.\_\ \_\ \_\ \_\
  \ \ \/  \/_/\/___/ \/___L\ \/_/\/__/\/_/\/_/\/_/\/_/
   \ \_\               /\____/
    \/_/               \_/__/


     */
}

window.console.log(string.getMultiLine());