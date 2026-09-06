var navMusicEl = document.getElementById("nav-music");
var anzhiyu = {
  // 切换音乐播放状态
  musicToggle: function (changePaly = true) {
    if (!anzhiyu_musicFirst) {
      musicBindEvent();
      anzhiyu_musicFirst = true;
    }
    if (anzhiyu_musicPlaying) {
      navMusicEl.classList.remove("playing");
      document.getElementById("nav-music-hoverTips").innerHTML = "音乐已暂停";
      anzhiyu_musicPlaying = false;
      navMusicEl.classList.remove("stretch");
    } else {
      navMusicEl.classList.add("playing");
      anzhiyu_musicPlaying = true;
      navMusicEl.classList.add("stretch");
    }
    if (changePaly) document.querySelector("#nav-music meting-js").aplayer.toggle();
  },

  // 音乐伸缩
  musicTelescopic: function () {
    if (navMusicEl.classList.contains("stretch")) {
      navMusicEl.classList.remove("stretch");
    } else {
      navMusicEl.classList.add("stretch");
    }
  },

  // 音乐上一曲
  musicSkipBack: function () {
    document.querySelector("#nav-music meting-js").aplayer.skipBack();
  },

  // 音乐下一曲
  musicSkipForward: function () {
    document.querySelector("#nav-music meting-js").aplayer.skipForward();
  },

  // 获取音乐中的名称
  musicGetName: function () {
    var x = $(".aplayer-title");
    var arr = [];
    for (var i = x.length - 1; i >= 0; i--) {
      arr[i] = x[i].innerText;
    }
    return arr[0];
  },

  // 音乐节目切换背景
  changeMusicBg: function (isChangeBg = true) {
    if (window.location.pathname != "/music/") {
      return;
    }
    const anMusicBg = document.getElementById("an_music_bg");

    if (isChangeBg) {
      // player listswitch 会进入此处
      const musiccover = document.querySelector("#anMusic-page .aplayer-pic");
      anMusicBg.style.backgroundImage = musiccover.style.backgroundImage;
    } else {
      // 第一次进入，绑定事件，改背景
      let timer = setInterval(() => {
        const musiccover = document.querySelector("#anMusic-page .aplayer-pic");
        // 确保player加载完成
        console.info(anMusicBg);
        if (musiccover) {
          clearInterval(timer);
          anMusicBg.style.backgroundImage = musiccover.style.backgroundImage;
          // 绑定事件
          anzhiyu.addEventListenerChangeMusicBg();

          // 暂停nav的音乐
          if (
            document.querySelector("#nav-music meting-js").aplayer &&
            !document.querySelector("#nav-music meting-js").aplayer.audio.paused
          ) {
            anzhiyu.musicToggle();
          }
        }
      }, 100);
    }
  },
  addEventListenerChangeMusicBg: function () {
    const anMusicPage = document.getElementById("anMusic-page");
    const aplayerIconMenu = anMusicPage.querySelector(".aplayer-info .aplayer-time .aplayer-icon-menu");

    anMusicPage.querySelector("meting-js").aplayer.on("loadeddata", function () {
      anzhiyu.changeMusicBg();
      console.info("player loadeddata");
    });

    aplayerIconMenu.addEventListener("click", function () {
      document.getElementById("menu-mask").style.display = "block";
      document.getElementById("menu-mask").style.animation = "0.5s ease 0s 1 normal none running to_show";
    });

    document.getElementById("menu-mask").addEventListener("click", function () {
      if (window.location.pathname != "/music/") return;
      anMusicPage.querySelector(".aplayer-list").classList.remove("aplayer-list-hide");
    });
  },
};


// 监听播放器状态变化，同步 UI
document.addEventListener("DOMContentLoaded", function () {
  var checkPlayer = setInterval(function () {
    var player = document.querySelector("#nav-music meting-js");
    if (player && player.aplayer) {
      clearInterval(checkPlayer);
      player.aplayer.on("play", function () {
        anzhiyu_musicPlaying = true;
        navMusicEl.classList.add("playing", "stretch");
      });
      player.aplayer.on("pause", function () {
        anzhiyu_musicPlaying = false;
        navMusicEl.classList.remove("playing", "stretch");
      });
    }
  }, 200);
});

// PJAX 兼容
document.addEventListener("pjax:complete", function () {
  var checkPlayer = setInterval(function () {
    var player = document.querySelector("#nav-music meting-js");
    if (player && player.aplayer) {
      clearInterval(checkPlayer);
      player.aplayer.on("play", function () {
        anzhiyu_musicPlaying = true;
        navMusicEl.classList.add("playing", "stretch");
      });
      player.aplayer.on("pause", function () {
        anzhiyu_musicPlaying = false;
        navMusicEl.classList.remove("playing", "stretch");
      });
    }
  }, 200);
});

// 调用
anzhiyu.changeMusicBg(false);

// ============================================================
//  音乐馆页面检测 - 添加 body 类（移动端兼容）
// ============================================================

function checkMusicPage() {
    if (document.querySelector('#anMusic-page')) {
        document.body.classList.add('music-page');
    } else {
        document.body.classList.remove('music-page');
    }
}

// 页面加载后检测
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkMusicPage);
} else {
    checkMusicPage();
}

// Pjax 兼容
document.addEventListener('pjax:complete', checkMusicPage);
document.addEventListener('pjax:success', checkMusicPage);
