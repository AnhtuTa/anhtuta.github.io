var liliana_lyric = getByClass("liliana-lyric");
var div_result = getById("div_result");
var lyric_playground = getById("lyric_playground");
var audio_wrapper = getById("audio_wrapper");
var song_details = getById("song_details");
var btn_toggle_setting = getByClass("btn_toggle_setting");
var btn_sync_wrapper = getByClass("btn_sync_wrapper");
var hide_when_fullscreen = getById("hide_when_fullscreen");
var div_background = getById("div_background");
var lilianaLyric = getByClass("liliana-lyric");
var btn_fullscreen = getByClass("btn_fullscreen");
var setting_bottom = getByClass("setting_bottom");
var left_img = getByClass("left_img");
var left_title = getByClass("left_title");
var left_artist = getByClass("left_artist");
var left_album = getByClass("left_album");
var select_mp3_label = getByClass("select_mp3_label");
var select_mp3_wrapper = getByClass("select_mp3_wrapper");
var words = [];
var startTimes = [];
var endTimes = [];
var myAudio;
var title, artist, album;
var lyricFile;

// offset time in milisecond
var offsetTime = 0;

var cntWord, currWordID;
var playLyricInterval, countdownInterval, currCountdownWord;

function setPlayLyricInterval() {
    playLyricInterval = setInterval(function() {
        updateLyric();
    }, 10);
}

function clearPlayLyricInterval() {
    clearInterval(playLyricInterval);
    playLyricInterval = null;
}

btn_toggle_setting.addEventListener("click", function() {
    btn_toggle_setting.style.display = "none";
    $("#setting_wrapper").show(100);
    //setting_wrapper.style.display = "";
});

getByClass("btn_align_left").addEventListener("click", function() {
    settingLyricAlign("left");
});
getByClass("btn_align_center").addEventListener("click", function() {
    settingLyricAlign("center");
});
getByClass("btn_align_right").addEventListener("click", function() {
    settingLyricAlign("right");
});
function settingLyricAlign(align) {
    div_result.style.textAlign = align;
    saveSettings("lyricAlign", align);
}

getByClass("btn_theme_dark").addEventListener("click", function() {
    settingThemeDark();
});
getByClass("btn_theme_light").addEventListener("click", function() {
    settingThemeLight();
});
getByClass("btn_theme_album_bg").addEventListener("click", function() {
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

getByClass("btn_gigantic_line").addEventListener("click", function() {
    if(div_result.classList.contains("div-res-big-active-line")) {
        div_result.classList.remove("div-res-big-active-line");
        saveSettings("giganticLine", false);
    } else {
        div_result.classList.add("div-res-big-active-line");
        saveSettings("giganticLine", true);
    }
});
getByClass("btn_word_appear").addEventListener("click", function() {
    settingWordAppear(false);
});
function settingWordAppear(isForce) {
    if(isForce) {
        // set word appear, no matter what
        div_result.classList.add("word-appear");
        saveSettings("wordAppear", true);
    } else {
        // toggle
        if(div_result.classList.contains("word-appear")) {
            div_result.classList.remove("word-appear");
            saveSettings("wordAppear", false);
        } else {
            div_result.classList.add("word-appear");
            saveSettings("wordAppear", true);
        }
    }
}

getById("btn_reset_audio").addEventListener("click", function() {
    getById("btn_select_audio").value = "";
});
div_result.addEventListener("click", function() {
    $("#setting_wrapper").hide(100);
    $(".btn_toggle_setting").show(100);
    // btn_toggle_setting.style.display = "";
    // setting_wrapper.style.display = "none";
});
btn_fullscreen.addEventListener("click", function() {
    if(div_result.classList.contains("lyric_fullscreen")) {
        setLyricNormal();
        saveSettings("fullscreen", false);
    } else {
        setLyricFullscreen();
        saveSettings("fullscreen", true);
    }
});
left_img.addEventListener("click", function() {
    if(left_img.classList.contains("paused-spin")) {
        left_img.classList.remove("paused-spin");
    } else {
        left_img.classList.add("paused-spin");
    }
});

select_mp3_label.addEventListener("click", function() {
    if(select_mp3_wrapper.style.display === "none") {
        select_mp3_wrapper.style.display = "";
        scrollPage(getByClass("liliana-lyric"), 300);
    } else {
        select_mp3_wrapper.style.display = "none";
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

/**
 * Note: Class theme sẽ bắt đầu = "div-res-"
 * Do đó những class ko liên quan đến theme KO được bắt đầu = "div-res-"
 */
function changeTheme(themeClass, bgImageDisplay) {
    let classes = div_result.classList;
    classes.forEach(className => {
        if(className.includes("div-res-")) div_result.classList.remove(className);
    });
    div_result.classList.add(themeClass);
    div_background.style.display = bgImageDisplay;
}

function settingUIUsingParams() {
    let lyricAlign = getRequestParam("lyricAlign");
    if(lyricAlign && lyricAlign.trim() !== "") {
        settingLyricAlign(lyricAlign);
    }

    let theme = getRequestParam("theme");
    if(theme && theme.trim() !== "") {
        switch(theme) {
            case "dark":
                settingThemeDark();
                break;
            case "light":
                settingThemeLight();
                break;
            case "albumBg":
                settingThemeAlbumBg();
                break;
            default:
                // do nothing
                break;
        }
    }

    let wordAppear = getRequestParam("wordAppear");
    if(wordAppear && wordAppear.trim() === "true") {
        settingWordAppear(true);
    }
}

function startPage() {
    let file = getRequestParam("file");
    if(file && file.trim() !== "") {
        select_mp3_from_local.parentElement.removeChild(select_mp3_from_local);

        let songURL = HOST_API + "/api/song?file=" + file;

        var audio = document.createElement("audio");
        audio.setAttribute("controls", "");
        audio.setAttribute("id", "myAudio");

        let source = document.createElement("source");
        source.src = songURL;
        audio.appendChild(source);

        myAudio = audio;
        audio_wrapper.appendChild(audio);
        let vol = getSetting("volume");
        if(vol) audio.volume = vol;

        addAudioEvent();
        // Cannot play audio tag when page is loaded! We must click to do something
        // with the screen first, and then this method will work
        // myAudio.play();

        // -_- try to get blob from ajax, so we can display song's image
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function(){
            if (this.readyState == 4 && this.status == 200){
                // loadUrl(this.response, getLyric.bind({fileName: file}), FileAPIReader(this.response));
                loadUrl(this.response, getLyric.bind(null, file), FileAPIReader(this.response));
            }
        }
        xhr.open('GET', songURL);
        xhr.responseType = 'blob';
        xhr.send();

        // using param to setting UI
        settingUIUsingParams();
    } else {
        // show all available songs
        let urlAllSongs = HOST_API + "/api/song/all/by/folder";
        let all_songs = getById("all_songs");
        $.ajax({
            url: urlAllSongs
        }).then(json => {
            let allSongLabel = createNewElement("div", null, "all-song-label");
            allSongLabel.innerText = "Here is all songs available in our server";
            all_songs.appendChild(allSongLabel);

            let cntSong = 1;
            let allSongValue = createNewElement("div", null, "all-song-value custom-scrollbar");
            let tableTag = createNewElement("table", null, "table_striped");
            let tdTag, trTag, aTag;
            
            for(let i = 0; i < json.length; i++) {
                tdTag = createNewElement("th");
                tdTag.setAttribute("colspan", "2");
                tdTag.innerText = json[i].name;
                trTag = createNewElement("tr");
                trTag.appendChild(tdTag);
                tableTag.appendChild(trTag);

                for(let j = 0; j < json[i].fileList.length; j++) {
                    tdTag = createNewElement("td");
                    tdTag.innerText = cntSong++;
                    trTag = createNewElement("tr");
                    trTag.appendChild(tdTag);
                    
                    aTag = createNewElement("a", null, "song-item", {"href": "?file=" + json[i].fileList[j]});
                    aTag.innerText = json[i].fileList[j];
                    tdTag = createNewElement("td");
                    tdTag.appendChild(aTag);
                    trTag.appendChild(tdTag);
                    tableTag.appendChild(trTag);
                }
            }
            allSongValue.appendChild(tableTag);
            all_songs.appendChild(allSongValue);

            setScrollEvent(allSongValue);
            initSettingsAtHomePage();
        });
    }
}
startPage();

/**
 * Get lyric for a song
 * (title and artist of this song were stored in title and artist variables)
 * @param {string} file Name of mp3 file
 */
function getLyric(file) {
    let lyricURL;

    lyricURL = HOST_API + "/api/lyric?file=";
    lyricURL += artist + " - " + title + ".trc";
    $.ajax({
        url: lyricURL
    }).then(lyric => {
        saveLyric(lyric);
        lyricFile = lyricURL.substring(lyricURL.indexOf("?file=") + 6);
    }).fail(err => {
        lyricURL = HOST_API + "/api/lyric?file=";
        // lyricURL += this.fileName.replace(".mp3", ".trc");
        lyricURL += file.replace(".mp3", ".trc");
        lyricURL = lyricURL.replace(".MP3", ".trc");
        $.ajax({
            url: lyricURL
        }).then(lyric => {
            saveLyric(lyric);
            lyricFile = lyricURL.substring(lyricURL.indexOf("?file=") + 6);
        }).fail(err => {
            lyricFile = null;
            if(JSON.parse(err.responseText).code === 404002) {
                let noLyric = "Sorry! This song hasn't no lyric yet! You can contribute lyric by sending it to tu.ta1@samsung.com. ";
                noLyric += "Or contact me via FB: <a href='https://fb.com/anhtuta95'>@anhtuta95</a>";
                lyric_playground.innerHTML = noLyric;
            } else {
                console.log(err);
            }
        });
    });
}

function saveLyric(lyric) {
    words = lyric.trim().split("\n");
}

function setScrollEvent(allSongValue) {
    allSongValue.onscroll = () => {
        saveSettings("allSongScrollTop", allSongValue.scrollTop);
    }
}

function isNoLyric() {
    return words.length === 0;
}

function initLyric() {
    lyric_playground.style.display = "";

    let fileName = getRequestParam("file");
    if(!fileName || fileName.trim() === "") {
        // Nếu người dùng ko truyền param fileName trên URL thì ta đọc lyric từ textarea
        if(liliana_lyric.value.trim() !== "") {
            words = liliana_lyric.value.trim().split("\n");
        } else {
            words = [];
        }
    }
    if(isNoLyric()) return;

    cntWord = 0;
    offsetTime = 0;
    currWordID = -1;
    div_background.style.backgroundImage = "url('" + getById("art").src + "')";

    var temp, startLine, wordsInLine, startWord, endWord;
    for(var i = 0; i < words.length; i++) {
        temp = words[i].match(/\[\d+:\d+\.\d+\]/g);
        if(temp != null) {
            startLine = decodeTime(temp[0]);
            temp = words[i].substring(temp[0].length);
            wordsInLine = temp.match(/<\d+>[^\<]*/g);
            let divLine = createNewElement("div", null, "line");

            if(wordsInLine==null) {
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
                endWord = startWord + parseFloat(wordsInLine[j].match(/\d+/)[0])/1000;
                endWord = myParseFloat(endWord);
                
                // Do lưu time vào 2 mảng startTimes và endTimes nên có thể ko cần
                // thêm attribute time-start và time-start nữa
                let spanWord = createNewElement("span", "word-" + cntWord, "not-pass-word", {"time-start":startWord, "time-end": endWord});
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
            if(words[i].includes("offset:")) {
                offsetTime = words[i].match(/[0-9|-]+/g);
                offsetTime = parseInt(offsetTime);
            }
        }
    }
    
    let btnResetAudio = getById("btn_reset_audio");
    if(btnResetAudio) btnResetAudio.style.display = "none";
    initSettingsAtPlayer();

    scrollPage(myAudio, 500);
}

function initSettingsAtPlayer() {
    let lyricAlign = getSetting("lyricAlign");
    if(lyricAlign) div_result.style.textAlign = lyricAlign;

    let isFullscreen = getSetting("fullscreen");
    if(isFullscreen) setLyricFullscreen();

    let theme = getSetting("theme");
    if(theme) {
        let classes;
        switch(theme) {
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
    if(giganticLine) div_result.classList.add("div-res-big-active-line");

    let wordAppear = getSetting("wordAppear");
    if(wordAppear) div_result.classList.add("word-appear");
}

function initSettingsAtHomePage() {
    let allSongValue = getByClass("all-song-value");
    if(allSongValue) {
        let scrollValue = getSetting("allSongScrollTop");
        if(scrollValue) {
            allSongValue.scrollTop = scrollValue;
            // $('.all-song-value').animate({scrollTop:scrollValue}, 400);
        }
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
    if(isNoLyric()) {
        clearPlayLyricInterval();
        return;
    }

    let prevWord, prevParent, currWord, currParent;

    // PHẢI FIX XONG CÁI BUG NÀY!
    //console.log(countdownInterval);

    if (currWordID >= 0) {
        let st = startTimes[currWordID] + offsetTime/1000;
        let en = endTimes[currWordID] + offsetTime/1000;

        // ko dùng cái này để fix lỗi CHÚ Ý [1]
        // (dùng cái này sẽ tối ưu hơn, tốt nhất là lyric KHÔNG NÊN sai)
        if (st <= myAudio.currentTime && en >= myAudio.currentTime) return;

        prevWord = getById("word-"+currWordID);
        prevParent = prevWord.parentNode;
        prevWord.classList.remove("word-active", "curr-word");
    }

    currWordID = getCurrentWordByTime(myAudio.currentTime);
    //console.log(getById("word-" + currWordID).innerText);
    if(currWordID >= 0) {
        currWord = getById("word-" + currWordID);
        currParent = currWord.parentNode;

        currWord.classList.add("word-active", "curr-word");
        currWord.classList.remove("not-pass-word");

        if (prevParent != currParent) {
            if (prevParent != null) {
                prevParent.classList.remove("line-active");
                for (let i = 0; i < prevParent.children.length; i++) {
                    if(prevParent.children[i] == prevWord) break;
                    prevParent.children[i].classList.remove("word-active");
                }
            }

            currParent.classList.add("line-active");
        }

        let currIndex;
        for (let i = 0; i < currParent.children.length; i++) {
            if(currParent.children[i] == currWord) {
                currIndex = i;
                break;
            }
            currParent.children[i].classList.add("word-active");
        }
        for (let i = currIndex + 1; i < currParent.children.length; i++) {
            if(!currParent.children[i].classList.contains("word-active")) break;
            currParent.children[i].classList.remove("word-active");
        }

        // countdown
        if(currWord.innerText.trim() === "") {
            let nextWord = getById("word-" + (currWordID+1));
            if(nextWord) {
                // let timeDiff = endTimes[currWordID] - startTimes[currWordID];
                let timeDiff = endTimes[currWordID] + offsetTime/1000 - myAudio.currentTime;
                if(timeDiff >= 5) {
                    createCountDownInterval((timeDiff - 5)*1000 + offsetTime, 5, currWord);
                } else if(timeDiff >= 3) {
                    createCountDownInterval((timeDiff - 3)*1000 + offsetTime, 3, currWord);
                }
            }
        }

        // scroll
        if(currWord == currParent.childNodes[0] && currWord.innerText.trim() != "") {
            scrollLyric();
        }
    } else {
        // chạy hết nhạc thì xóa active ở dòng cuối cùng
        let finalLine = getById("word-" + (cntWord-1)).parentNode;
        if(finalLine.classList.contains("line-active")) {
            finalLine.classList.remove("line-active");
            for (let i = 0; i < finalLine.children.length; i++) {
                finalLine.children[i].classList.remove("word-active");
            }
        }
    }
}

let bulletArr = ["", "•", "••", "•••", "••••", "•••••"];
function createCountDownInterval(timeout, cnt, emptyWord) {
    setTimeout(() => {
        emptyWord.innerText = bulletArr[cnt--];
        currCountdownWord = emptyWord;

        countdownInterval = setInterval(() => {
            if(cnt == 0) {
                clearInterval(countdownInterval);
                emptyWord.innerHTML = "&nbsp;";
            } else {
                emptyWord.innerText = bulletArr[cnt--];
            }
        }, 1000);
    }, timeout);
}

function scrollLyric(currWord=null) {
    if(currWord == null) {
        currWord = getById("word-" + currWordID);
    }
    if(currWord != null) div_result.scrollTop = currWord.offsetTop - getById("word-0").offsetTop - div_result.offsetHeight/2 + 50;
}

/**
 * get the word base on a time, using binary search
 * Node: offsetTime will be added in this place
 * @param {float} Current time of audio in second
 * @return {Integer} id of word
 **/
function getCurrentWordByTime(sec) {
    let lo = 0, hi = cntWord-1;
    let mid, st, en;

    while(lo <= hi) {
        mid = parseInt((lo+hi)/2);
        st = startTimes[mid] + offsetTime/1000;
        en = endTimes[mid] + offsetTime/1000;

        if(st <= sec && en >= sec) {
            // fix lỗi CHÚ Ý [1]:
            // Nếu như có 2 từ có khoảng thời gian bị chồng
            // lên nhau thì ta ưu tiên từ đứng đằng sau
            st = startTimes[mid+1] + offsetTime/1000;
            en = endTimes[mid+1] + offsetTime/1000;
            if(st <= sec && en >= sec) return mid+1;
            else return mid;
        }
        else if (st > sec) hi = mid-1;
        else lo = mid+1;
    }

    if(mid==0 || mid==cntWord-1) mid = -1;

    // ko tìm thấy thẻ nào có st <= sec <= en. tuy vậy, vẫn return thẻ gần đó nhất
    console.log("Cannot found a tag that the value of \"sec\" is " +
        "between its duration (st <= sec <= en). Return nearest tag: " + mid);
    
    // delete interval when finish song!
    if (sec > endTimes[cntWord-1]) clearPlayLyricInterval();

    return mid;
}

function loadLyric(elem, event) {
    // Có thể dùng tham số event để đọc:
    //var file = event.target.files[0];
    var file = elem.files[0];
    if(file == undefined) return;

    var reader = new FileReader();
    reader.onload = function(e) {
        lilianaLyric.value = e.target.result;
    };
    reader.readAsText(file);
}
