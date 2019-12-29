btn_toggle_setting.addEventListener("click", function () {
  btn_toggle_setting.style.display = "none";
  $("#setting_wrapper").show(100);
});

getByClass("btn_align_left").addEventListener("click", function () {
  settingLyricAlign("left");
});
getByClass("btn_align_center").addEventListener("click", function () {
  settingLyricAlign("center");
});
getByClass("btn_align_right").addEventListener("click", function () {
  settingLyricAlign("right");
});
function settingLyricAlign(align) {
  div_result.style.textAlign = align;
  saveSettings("lyricAlign", align);
}

getByClass("btn_theme_dark").addEventListener("click", function () {
  settingThemeDark();
});
getByClass("btn_theme_light").addEventListener("click", function () {
  settingThemeLight();
});
getByClass("btn_theme_album_bg").addEventListener("click", function () {
  settingThemeAlbumBg();
});
function settingThemeDark() {
  settingTheme("div-res-dark", "none", "dark");
}
function settingThemeLight() {
  settingTheme("div-res-light", "none", "light");
}
function settingThemeAlbumBg() {
  settingTheme("div-res-album-bg", "", "album-bg");
}
function settingTheme(themeClass, bgImageDisplay, themeKey) {
  changeTheme(themeClass, bgImageDisplay);
  saveSettings("theme", themeKey);
}

/**
 * Note: Class theme sẽ bắt đầu = "div-res-"
 * Do đó những class ko liên quan đến theme KO được bắt đầu = "div-res-"
 */
function changeTheme(themeClass, bgImageDisplay) {
  let classes = div_result.classList;
  classes.forEach(className => {
    if (className.includes("div-res-")) div_result.classList.remove(className);
  });
  div_result.classList.add(themeClass);
  div_background.style.display = bgImageDisplay;
}

getByClass("btn_gigantic_line").addEventListener("click", function () {
  if (div_result.classList.contains("div-res-big-active-line")) {
    div_result.classList.remove("div-res-big-active-line");
    saveSettings("giganticLine", false);
  } else {
    div_result.classList.add("div-res-big-active-line");
    saveSettings("giganticLine", true);
  }
});

getByClass("btn_word_appear").addEventListener("click", function () {
  settingWordAppear(false);
});
function settingWordAppear(isForce) {
  if (isForce) {
    // set word appear, no matter what
    div_result.classList.add("word-appear");
    saveSettings("wordAppear", true);
  } else {
    // toggle
    if (div_result.classList.contains("word-appear")) {
      div_result.classList.remove("word-appear");
      saveSettings("wordAppear", false);
    } else {
      div_result.classList.add("word-appear");
      saveSettings("wordAppear", true);
    }
  }
}

getById("btn_reset_audio").addEventListener("click", function () {
  getById("btn_select_audio").value = "";
});
div_result.addEventListener("click", function () {
  $("#setting_wrapper").hide(100);
  $(".btn_toggle_setting").show(100);
  // btn_toggle_setting.style.display = "";
  // setting_wrapper.style.display = "none";
});
btn_fullscreen.addEventListener("click", function () {
  if (div_result.classList.contains("lyric_fullscreen")) {
    setLyricNormal();
    saveSettings("fullscreen", false);
  } else {
    setLyricFullscreen();
    saveSettings("fullscreen", true);
  }
});
left_img.addEventListener("click", function () {
  if (left_img.classList.contains("paused-spin")) {
    left_img.classList.remove("paused-spin");
  } else {
    left_img.classList.add("paused-spin");
  }
});

function setLyricNormal() {
  div_result.classList.add("lyric_normal");
  div_result.classList.remove("lyric_fullscreen");
  div_result.classList.add("show-left-normal");
  div_result.classList.remove("show-left-fs");
  audio_wrapper.classList.add("audio_normal");
  audio_wrapper.classList.remove("audio_fullscreen");
  document.body.classList.remove("overflow-hidden");
  btn_sync_wrapper.style.display = "";
  hide_when_fullscreen.style.display = "";
  div_background.classList.remove("bg-image-fullscreen");
  setting_bottom.classList.remove("setbot_fs");
  div_left_wrapper.classList.remove("left_fs");
  div_left_wrapper.classList.add("left_normal");

  scrollPage(myAudio, 300);
  setTimeout(() => {
    scrollLyric();
  }, 350)
}

function setLyricFullscreen() {
  div_result.classList.add("lyric_fullscreen");
  div_result.classList.remove("lyric_normal");
  div_result.classList.add("show-left-fs");
  div_result.classList.remove("show-left-normal");
  audio_wrapper.classList.add("audio_fullscreen");
  audio_wrapper.classList.remove("audio_normal");
  document.body.classList.add("overflow-hidden");
  btn_sync_wrapper.style.display = "none";
  hide_when_fullscreen.style.display = "none";
  div_background.classList.add("bg-image-fullscreen");
  setting_bottom.classList.add("setbot_fs");
  div_left_wrapper.classList.add("left_fs");
  div_left_wrapper.classList.remove("left_normal");

  setTimeout(() => {
    scrollLyric();
  }, 350)
}

select_mp3_label.addEventListener("click", function () {
  if (select_mp3_wrapper.style.display === "none") {
    select_mp3_wrapper.style.display = "";
    scrollPage(getByClass("liliana-lyric"), 300);
  } else {
    select_mp3_wrapper.style.display = "none";
  }
});

window.addEventListener("keydown", function (e) {
  // this.console.log(e);
  switch (e.keyCode) {
    case 37:
      // ArrowLeft
      myAudio.currentTime -= 5;
      break;
    case 39:
      // ArrowRight
      myAudio.currentTime += 5;
      break;
  }
});

function showSyncToast() {
  if (offsetTime > 0) {
    toastr["info"]("Delay " + offsetTime + "ms");
  } else {
    toastr["info"]("Advance " + (0 - offsetTime) + "ms");
  }
}
btn_sync_up.addEventListener("click", function () {
  offsetTime += 100;
  showSyncToast();
  updateOffsetTime();
});
btn_sync_down.addEventListener("click", function () {
  offsetTime -= 100;
  showSyncToast();
  updateOffsetTime();
});
function updateOffsetTime() {
  $.ajax({
    url: HOST_API + "/api/lyric/update/offset?file=" + lyricFile + "&offset=" + offsetTime
  }).then(res => {
    console.log(res);
  }).fail(err => {
    console.log(err);
  });
}

getByClass("btn_increase_speed").addEventListener("click", function () {
  updateSpeed(0.1);
});
getByClass("btn_decrease_speed").addEventListener("click", function () {
  updateSpeed(-0.1);
});
function updateSpeed(offset) {
  let speed = Number(getSetting("speed"));
  if (speed == null) {
    speed = 1;
  }
  speed += offset;
  speed = Number(speed.toFixed("1"));
  myAudio.playbackRate = speed;
  toastr.info("Speed: " + speed + "x");
  saveSettings("speed", speed);
}
