'use strict';

showAllSongs(null, null);
settingUIUsingParams();
playSong();

function setPlayLyricInterval() {
  if (myAudio && !myAudio.paused) {
    playLyricInterval = setInterval(function () {
      updateLyric();
    }, 10);
  }
}

function clearPlayLyricInterval() {
  clearInterval(playLyricInterval);
  playLyricInterval = null;
}

/**
 * Get lyric for a song
 * (title and artist of this song were stored in title and artist variables)
 * @param {string} file Name of mp3 file
 */
function getLyric(file) {
  let lyricURL;
  let fileName = file.substr(0, file.length - 4); // remove ".mp3"

  lyricURL = HOST_API + "/api/lyric?file=" + artist + " - " + title + ".trc";
  lyricURL += "&file=" + fileName + ".trc";
  $.ajax({
    url: lyricURL
  }).then(lyric => {
    isLrc = false;
    saveLyric(lyric);
    lyricFile = lyricURL.substring(lyricURL.indexOf("?file=") + 6);
  }).fail(err => {
    lyricURL = HOST_API + "/api/lyric?file=" + artist + " - " + title + ".lrc";
    lyricURL += "&file=" + fileName + ".lrc";
    lyricURL
    $.ajax({
      url: lyricURL
    }).then(lyric => {
      isLrc = true;
      saveLyric(lyric);
      lyricFile = lyricURL.substring(lyricURL.indexOf("?file=") + 6);
    }).fail(err => {
      lyricFile = null;
      if (JSON.parse(err.responseText).code === 404002) {
        setNoLyric();
      } else {
        console.log(err);
      }
    });
  });
}

function saveLyric(lyric) {
  words = lyric.trim().split("\n");
  initLyric();
  setPlayLyricInterval();
}

function isNoLyric() {
  return words.length === 0;
}

function setNoLyric() {
  words = [];
  initLyric();
}

function initLyric() {
  lyric_playground.style.display = "";
  div_result.innerHTML = "";
  startTimes = [];
  endTimes = [];
  cntWord = 0;
  offsetTime = 0;
  currWordID = -1;

  let fileName = getRequestParam("file");
  if (!fileName || fileName.trim() === "") {
    // Nếu người dùng ko truyền param fileName trên URL thì ta đọc lyric từ textarea
    if (liliana_lyric.value.trim() !== "") {
      words = liliana_lyric.value.trim().split("\n");
    } else {
      words = [];
    }
  }
  if (isNoLyric()) {
    div_result.innerHTML = NO_LYRIC;
  } else {
    if (isLrc) initLrcLyric();
    else initTrcLyric();
  }

  let btnResetAudio = getById("btn_reset_audio");
  if (btnResetAudio) btnResetAudio.style.display = "none";
  initSettingsAtPlayer();

  // scrollPage(myAudio, 500);
}

function initTrcLyric() {
  var temp, startLine, wordsInLine, startWord, endWord;
  for (var i = 0; i < words.length; i++) {
    temp = words[i].match(/\[\d+:\d+\.\d+\]/g); // ex: temp = ["[1:15.047]"]
    if (temp != null) {
      startLine = decodeTime(temp[0]);  // ex: 75.047
      temp = words[i].substring(temp[0].length);  // ex: <271>I <256>keep <790>saying <1254>no
      wordsInLine = temp.match(/<\d+>[^\<]*/g);
      let divLine = createNewElement("div", null, "line");

      if (wordsInLine == null) {
        console.log("Khi nào thì nó mới nhảy vào đây???");
        let spanWord = createNewElement("span");
        spanWord.setAttribute("class", "not-pass-word");
        spanWord.innerText = temp;
        if (spanWord.innerText == "") spanWord.innerHTML = "&nbsp";
        divLine.appendChild(spanWord);
        div_result.appendChild(divLine);
        continue;
      }

      startWord = startLine;
      for (let j = 0; j < wordsInLine.length; j++) {
        // match(/\d+/)[0]: lấy số đầu tiên trong string này
        // VD: string này có dạng: "<123>demo " thì kết quả là 123
        // VD: string này có dạng: "<123>demo 949" thì kết quả là 123
        endWord = startWord + parseFloat(wordsInLine[j].match(/\d+/)[0]) / 1000;
        endWord = myParseFloat(endWord);

        // Do lưu time vào 2 mảng startTimes và endTimes nên việc
        // thêm attribute time-start và time-start chỉ dùng để debug
        let spanWord = createNewElement("span", "word-" + cntWord, "not-pass-word", { "time-start": startWord, "time-end": endWord });
        spanWord.innerText = wordsInLine[j].replace(/<\d+>/, "");
        if (spanWord.innerText == "") spanWord.innerHTML = "&nbsp";
        startTimes[cntWord] = startWord;
        endTimes[cntWord] = endWord;

        startWord = endWord;
        cntWord++;
        divLine.appendChild(spanWord);
      }
      div_result.appendChild(divLine);
    } else {
      if (words[i].includes("offset:")) {
        offsetTime = words[i].match(/[0-9|-]+/g);
        offsetTime = parseInt(offsetTime);
      }
    }
  }
}

function initLrcLyric() {
  let lineTime = "", lineTimeLen, lineWords, startLine;
  let lineMap = new Map();  // key là 1 phần tử trong mảng startTimes

  for (let i = 0; i < words.length; i++) {
    lineTime = words[i].match(/\[\d+:\d+\.\d+\]/g);
    if (lineTime != null) {
      lineTimeLen = 0;
      for (let j = 0; j < lineTime.length; j++) {
        lineTimeLen += lineTime[j].length;
      }
      lineWords = words[i].substring(lineTimeLen);
      for (let j = 0; j < lineTime.length; j++) {
        startLine = decodeTime(lineTime[j]);
        startTimes[cntWord] = startLine;
        lineMap.set(startLine, lineWords);
        cntWord++;
      }
    } else {
      if (words[i].includes("offset:")) {
        offsetTime = words[i].match(/[0-9|-]+/g);
        offsetTime = parseInt(offsetTime);
      }
    }
  }

  startTimes.sort(function (a, b) { return a - b });

  for (let i = 0; i < startTimes.length; i++) {
    let divLine = createNewElement("div", null, "line");

    let spanWord = createNewElement("span", "word-" + i, "not-pass-word", null);
    spanWord.innerText = lineMap.get(startTimes[i]);
    if (spanWord.innerText == "") spanWord.innerHTML = "&nbsp";
    divLine.appendChild(spanWord);
    div_result.appendChild(divLine);
  }

  for (let i = 0; i < startTimes.length - 1; i++) {
    endTimes[i] = startTimes[i + 1];
  }
  endTimes[startTimes.length - 1] = myAudio.duration;
}

function initSettingsAtPlayer() {
  let lyricAlign = getSetting("lyricAlign");
  if (lyricAlign) div_result.style.textAlign = lyricAlign;

  let isFullscreen = getSetting("fullscreen");
  if (isFullscreen) setLyricFullscreen();

  let theme = getSetting("theme");
  if (theme) {
    switch (theme) {
      case "dark":
        changeTheme("div-res-dark", "none");
        break;
      case "light":
        changeTheme("div-res-light", "none");
        break;
      case "album-bg":
        changeTheme("div-res-album-bg", "");
        break;
      default:
        break;
    }
  }

  let giganticLine = getSetting("giganticLine");
  if (giganticLine) div_result.classList.add("div-res-big-active-line");

  let wordAppear = getSetting("wordAppear");
  if (wordAppear) div_result.classList.add("word-appear");

  playType = getSetting("playType");
  if (playType) {
    setPlayType(playTypeList.indexOf(playType));
  } else {
    playType = SEQUENCE;
  }
}

/*
    * CHÚ Ý [1]: Nếu lyric sai thời gian:
    * VD: nếu startTimes[4] = 3, endTimes[4] = 5 và
    * startTimes[5] = 4, endTimes[5] = 6, ta thấy 2 từ này có khoảng
    * thời gian chồng lên nhau, do lỗi lyric
    * Fix: xem thêm hàm getCurrentWordByTime
    */
function updateLyric() {
  if (isNoLyric()) {
    clearPlayLyricInterval();
    return;
  }

  let prevWord, prevParent, currWord, currParent;

  // PHẢI FIX XONG CÁI BUG NÀY!
  //console.log(countdownInterval);

  if (currWordID >= 0) {
    let st = startTimes[currWordID] + offsetTime / 1000;
    let en = endTimes[currWordID] + offsetTime / 1000;

    // ko dùng cái này để fix lỗi CHÚ Ý [1]
    // (dùng cái này sẽ tối ưu hơn, tốt nhất là lyric KHÔNG NÊN sai)
    if (st <= myAudio.currentTime && en >= myAudio.currentTime) return;

    prevWord = getById("word-" + currWordID);
    prevParent = prevWord.parentNode;
    if (isLrc) prevWord.classList.remove("word-active", "curr-word-lrc");
    else prevWord.classList.remove("word-active", "curr-word");
  }

  currWordID = getCurrentWordByTime(myAudio.currentTime);
  //console.log(getById("word-" + currWordID).innerText);
  if (currWordID >= 0) {
    currWord = getById("word-" + currWordID);
    currParent = currWord.parentNode;

    if (isLrc) currWord.classList.add("word-active", "curr-word-lrc");
    else currWord.classList.add("word-active", "curr-word");
    currWord.classList.remove("not-pass-word");

    if (prevParent != currParent) {
      if (prevParent != null) {
        prevParent.classList.remove("line-active");
        for (let i = 0; i < prevParent.children.length; i++) {
          if (prevParent.children[i] == prevWord) break;
          prevParent.children[i].classList.remove("word-active");
        }
      }

      currParent.classList.add("line-active");
    }

    let currIndex;
    for (let i = 0; i < currParent.children.length; i++) {
      if (currParent.children[i] == currWord) {
        currIndex = i;
        break;
      }
      currParent.children[i].classList.add("word-active");
    }
    for (let i = currIndex + 1; i < currParent.children.length; i++) {
      if (!currParent.children[i].classList.contains("word-active")) break;
      currParent.children[i].classList.remove("word-active");
    }

    // countdown
    if (currWord.innerText.trim() === "") {
      let nextWord = getById("word-" + (currWordID + 1));
      if (nextWord) {
        // let timeDiff = endTimes[currWordID] - startTimes[currWordID];
        let timeDiff = endTimes[currWordID] + offsetTime / 1000 - myAudio.currentTime;
        if (timeDiff >= 5) {
          createCountDownInterval((timeDiff - 5) * 1000 + offsetTime, 5, currWord);
        } else if (timeDiff >= 3) {
          createCountDownInterval((timeDiff - 3) * 1000 + offsetTime, 3, currWord);
        }
      }
    }

    // scroll
    if (currWord == currParent.childNodes[0] && currWord.innerText.trim() != "") {
      scrollLyric();
    }
  } else {
    // chạy hết nhạc thì xóa active ở dòng cuối cùng
    let finalLine = getById("word-" + (cntWord - 1)).parentNode;
    if (finalLine.classList.contains("line-active")) {
      finalLine.classList.remove("line-active");
      for (let i = 0; i < finalLine.children.length; i++) {
        finalLine.children[i].classList.remove("word-active");
      }
    }
  }
}

function createCountDownInterval(timeout, cnt, emptyWord) {
  setTimeout(() => {
    emptyWord.innerText = bulletArr[cnt--];
    currCountdownWord = emptyWord;

    countdownInterval = setInterval(() => {
      if (cnt == 0) {
        clearInterval(countdownInterval);
        emptyWord.innerHTML = "&nbsp;";
      } else {
        emptyWord.innerText = bulletArr[cnt--];
      }
    }, 1000);
  }, timeout);
}
