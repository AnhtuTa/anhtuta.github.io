function loadSong(elem, event) {
  var file = elem.files[0];
  if (file == undefined) return;

  audio_wrapper.innerHTML = "";
  div_result.innerHTML = "";
  lyric_playground.style.display = "none";
  clearPlayLyricInterval();

  getAudioMetadata(file, null);

  var audio = document.createElement("audio");
  audio.setAttribute("controls", "");
  audio.setAttribute("id", "myAudio");

  var source = document.createElement("source");
  source.src = URL.createObjectURL(elem.files[0]);
  audio.appendChild(source);
  myAudio = audio;
  audio_wrapper.appendChild(audio);
  let vol = getSetting("volume");
  if (vol) audio.volume = vol;

  addAudioEvent();
  initLyric();
  setPlayLyricInterval();
}

function addAudioEvent() {
  myAudio.onplay = function () {
    if (playLyricInterval == null) setPlayLyricInterval();
    left_img.classList.remove("paused-spin");
    if (myAudio.currentTime === 0) {
      let file = getRequestParam("file");
      if (file && file.trim() !== "") {
        setTimeout(function () {
          let currFile = getRequestParam("file");
          if (currFile === file) {
            $.ajax({
              url: HOST_API + "/api/song/listens?file=" + file,
              type: 'PUT'
            }).then(res => {
              console.log(res);
            });
          }
        }, 60000);  // nghe 1 bài quá 1 phút mới tính 1 lượt nghe
      }
      setTimeout(function () {
        // reUpdateWordPass
        if (getById("word-0") != null) {
          for (let i = 0; i < cntWord; i++) {
            getById("word-" + i).classList.add("not-pass-word");
          }
        }
      }, 0);
    }
  }
  myAudio.onseeked = function () {
    clearCountdownInterval();
    if (playLyricInterval == null) {
      updateLyric();
    }
    setTimeout(function () {
      reUpdateWordPass();
    }, 0);
    scrollLyric();
  }
  myAudio.onpause = function () {
    clearCountdownInterval();
    if (playLyricInterval != null) clearPlayLyricInterval();
    left_img.classList.add("paused-spin");
  }
  myAudio.onvolumechange = function () {
    saveSettings("volume", myAudio.volume);
  }
  myAudio.onended = () => {
    nextSong();
  }
}

function nextSong() {
  if (playType === REPEAT_ONE) {
    activeAudio = activeAudio;
  } else {
    let currIndex = playedList.indexOf(activeAudio);
    if (currIndex >= 0 && currIndex < playedList.length - 1) {
      activeAudio = playedList[currIndex + 1];
    } else {
      if (playType === SHUFFLE) {
        while (true) {
          let temp = Math.floor(Math.random() * (playList.length - 1));
          if (!playedList.includes(temp)) {
            activeAudio = temp;
            break;
          }
        }
      } else if (playType === SEQUENCE) {
        activeAudio = (++activeAudio) % playList.length;
      }
      playedList.push(activeAudio);
    }
  }
  window.history.pushState(null, null, "?file=" + playList[activeAudio].fileName);
  playSong();
}

function prevSong() {
  if (playType === REPEAT_ONE) {
    activeAudio = activeAudio;
  } else {
    let currIndex = playedList.indexOf(activeAudio);
    if (currIndex > 0) {
      activeAudio = playedList[currIndex - 1];
    } else {
      toastr.warning("This is the first song of playing list!");
      return;
    }
  }
  window.history.pushState(null, null, "?file=" + playList[activeAudio].fileName);
  playSong();
}

function playSong(isClicked = false) {
  let file = getRequestParam("file");
  if (file && file.trim() !== "") {
    var select_mp3_from_local = getById("select_mp3_from_local");
    if (select_mp3_from_local !== undefined && select_mp3_from_local !== null) {
      select_mp3_from_local.parentElement.removeChild(select_mp3_from_local);
    }

    let songURL = HOST_API + "/api/song?file=" + file;

    if (myAudio === null || myAudio === undefined) {
      initAudio();
    }

    myAudio.src = songURL;
    var playPromise = myAudio.play();
    if (playPromise !== undefined) {
      playPromise.then(_ => {
        myAudio.play();
      })
        .catch(_ => {
          console.log("Cannot play audio if user doesn't interact with the page first!");
        });
    }
    changeAudioSpeed();

    showAudioMetadata(getLyric.bind(null, file));
    activeTr(file, isClicked);
  }
}

function changeAudioSpeed() {
  let speed = getRequestParam("speed");
  if (speed) {
    myAudio.playbackRate = speed;
    saveSettings("speed", Number(speed));
  } else {
    speed = getSetting("speed");
    if (speed) myAudio.playbackRate = speed;
  }
}

function reUpdateWordPass() {
  let currWordID = getCurrentWordByTime(myAudio.currentTime);
  if (currWordID >= 0) {
    for (let i = 0; i < currWordID; i++) {
      getById("word-" + i).classList.remove("not-pass-word");
    }
    for (let i = currWordID; i < cntWord; i++) {
      getById("word-" + i).classList.add("not-pass-word");
    }
  }
}

function showAudioMetadata(callback) {
  if (activeAudio == null || !playList || playList.length === 0) return;

  let songItem = playList[activeAudio];
  song_details.innerHTML = getSongDetails(songItem);
  let art = getById("art");

  if (songItem.imageUrl && songItem.imageUrl.trim() !== "") {
    art.src = HOST_API + songItem.imageUrl;
    left_img.src = art.src;
    div_background.style.backgroundImage = "url('" + art.src + "')";
  } else {
    art.src = "spin.jpg";
    left_img.src = "spin.jpg";
    div_background.style.backgroundImage = "url('background.jpg')";
  }

  if (callback) { callback(); };
}

// Function này khá giống function ở trên (showAudioMetadata)
// nên nếu sửa thì phải sửa cả 2
// Ref: https://github.com/leetreveil/musicmetadata/blob/master/example/index.html
function getAudioMetadata(data, callback) {
  musicmetadata(data, function (err, metadata) {
    if (err) throw err;

    metadata.artist = metadata.artist[0];
    song_details.innerHTML = getSongDetails(metadata);
    let art = getById("art");

    if (metadata.picture.length > 0 && metadata.picture[0].data.length > 0) {
      var image = metadata.picture[0];
      var url = URL.createObjectURL(new Blob([image.data], { 'type': 'image/' + image.format }));
      art.src = url;
      left_img.src = art.src;
      div_background.style.backgroundImage = "url('" + art.src + "')";
    } else {
      art.src = "background.jpg";
      left_img.src = "spin.jpg";
      div_background.style.backgroundImage = "url('background.jpg')";
    }

    if (callback) { callback(); };
  });
}

function getSongDetails(json) {
  let hideInfo = getRequestParam("hideInfo");
  title = json.title && json.title.trim() ? json.title : "No title";
  artist = json.artist && json.artist.trim() ? json.artist : "No artist";
  album = json.album && json.album.trim() !== "" ? json.album : "No album";

  left_title.innerText = hideText(title, hideInfo);
  left_artist.innerText = hideText(artist, hideInfo);
  left_album.innerHTML = "(" + hideText(album, hideInfo) + ")";
  document.title = title + " - " + artist + " | Liliana Player";

  return "<div class='song_title'>" + hideText(title, hideInfo) + "&nbsp;-&nbsp;</div>" +
    "<div class='song_artist'>" + hideText(artist, hideInfo) + "</div>" +
    "<div class='song_album'>(" + hideText(album, hideInfo) + ")</div>";
}

function hideText(text, hideInfo) {
  return hideInfo === "true" ? "Hidden" : text;
}

function initAudio() {
  myAudio = document.createElement("audio");
  myAudio.setAttribute("controls", "");
  myAudio.setAttribute("id", "myAudio");
  audio_wrapper.appendChild(myAudio);
  let vol = getSetting("volume");
  if (vol) myAudio.volume = vol;
  addAudioEvent();

  btnPrev = createNewElement("button", "btn_prev", "Player__Button btn-prev", { "title": "Previous" });
  btnPrev.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 35 35" fill="currentColor"><path d="M4 4 H8 V14 L28 4 V28 L8 18 V28 H4 z "></path></svg>';
  audio_wrapper.appendChild(btnPrev);
  btnPrev.onclick = () => {
    prevSong();
  }

  btnNext = createNewElement("button", "btn_next", "Player__Button btn-next", { "title": "Next" });
  btnNext.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 35 35" fill="currentColor"><path d="M4 4 L24 14 V4 H28 V28 H24 V18 L4 28 z "></path></svg>';
  audio_wrapper.appendChild(btnNext);
  btnNext.onclick = () => {
    nextSong();
  }

  btnPlayType = createNewElement("button", "btn_play_type", "Player__Button btn-play-type", { "title": "Sequence" });
  btnPlayType.innerHTML = BTN_SEQUENCE_SVG;
  audio_wrapper.appendChild(btnPlayType);
  btnPlayType.onclick = () => {
    let newIndex;
    for (let i = 0; i < playTypeList.length; i++) {
      if (playType === playTypeList[i]) {
        newIndex = i + 1;
        if (newIndex == playTypeList.length) newIndex = 0;
        setPlayType(newIndex);
        break;
      }
    }
  }
}

function setPlayType(i) {
  playType = playTypeList[i];
  btnPlayType.setAttribute("title", playTypeTitleList[i]);
  btnPlayType.innerHTML = playTypeSvgList[i];
  saveSettings("playType", playType);
}
