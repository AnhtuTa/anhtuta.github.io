var btn_sync_up = document.getElementsByClassName("btn_sync_up")[0];
var btn_sync_down = document.getElementsByClassName("btn_sync_down")[0];
const LILIANA_SETTINGS = "LILIANA_SETTINGS";

toastr.options = {
    "closeButton": false,
    "debug": false,
    "newestOnTop": false,
    "progressBar": false,
    "positionClass": "toast-bottom-center",
    "preventDuplicates": false,
    "onclick": null,
    "showDuration": "200",
    "hideDuration": "200",
    "timeOut": "3000",
    "extendedTimeOut": "1000",
    "showEasing": "swing",
    "hideEasing": "linear",
    "showMethod": "fadeIn",
    "hideMethod": "fadeOut"
}
function showSyncToast() {
    if (offsetTime > 0) {
        toastr["info"]("Delay " + offsetTime + "ms");
    } else {
        toastr["info"]("Advance " + (0-offsetTime) + "ms");
    }
}
btn_sync_up.addEventListener("click", function() {
    offsetTime += 100;
    showSyncToast();
    updateOffsetTime();
});
btn_sync_down.addEventListener("click", function() {
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

getById = (id) => {
    return document.getElementById(id);
}
getByClass = (className) => {
    return document.getElementsByClassName(className)[0];
}

/**
 * save setting to local storage
 */
function saveSettings(key, value) {
    let settings;
    if(localStorage && localStorage.getItem(LILIANA_SETTINGS)) {
        settings = JSON.parse(localStorage.getItem(LILIANA_SETTINGS));
        settings[key] = value;
    } else {
        settings = {
            [key]: value
        }
    }
    localStorage.setItem("LILIANA_SETTINGS", JSON.stringify(settings));
}

/**
 * get setting from local storage
 */
function getSetting(key) {
    if(localStorage && localStorage.getItem(LILIANA_SETTINGS)) {
        let settings = JSON.parse(localStorage.getItem(LILIANA_SETTINGS));
        return settings[key];
    }
    return null;
}

function getRequestParam(parameterName) {
    var result = null, tmp = [];
    location.search.substr(1).split("&")
        .forEach(function (item) {
            tmp = item.split("=");
            if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
        });
    return result;
}

// reference: https://github.com/aadsm/JavaScript-ID3-Reader
function loadSong(elem, event) {
    var file = elem.files[0];
    if(file == undefined) return;

    audio_wrapper.innerHTML = "";
    div_result.innerHTML = "";
    lyric_playground.style.display = "none";
    clearPlayLyricInterval();

    var url = file.urn ||file.name;
    loadUrl(url, null, FileAPIReader(file));

    var audio = document.createElement("audio");
    audio.setAttribute("controls", "");
    audio.setAttribute("id", "myAudio");

    var source = document.createElement("source");
    source.src = URL.createObjectURL(elem.files[0]);
    audio.appendChild(source);
    myAudio = audio;
    audio_wrapper.appendChild(audio);
    let vol = getSetting("volume");
    if(vol) audio.volume = vol;

    addAudioEvent();
}

function addAudioEvent() {
    myAudio.onplay = function() {
        if(div_result.innerHTML == "") {
            initLyric();
            setPlayLyricInterval();
        }

        if(playLyricInterval == null) setPlayLyricInterval();
    }
    myAudio.onseeked = function() {
        clearCountdownInterval();
        if(playLyricInterval == null) {
            updateLyric();
        }
        scrollLyric();
    }
    myAudio.onpause = function() {
        clearCountdownInterval();
        if(playLyricInterval != null) clearPlayLyricInterval();
    }
    myAudio.onvolumechange = function() {
        saveSettings("volume", myAudio.volume);
    }
}

function clearCountdownInterval() {
    if(countdownInterval != null) {
        clearInterval(countdownInterval);
        countdownInterval = null;
        if(currCountdownWord) currCountdownWord.innerHTML = "&nbsp;";
    }
}

function getSongDetails(json) {
    return "<div class='song_title'>" + (json.title && json.title.trim() ? json.title : "No title") + "&nbsp;-&nbsp;</div>" +
    "<div class='song_artist'>" + (json.artist && json.artist.trim() ? json.artist : "No artist") + "</div>" +
    "<div class='song_album'>(" + (json.album && json.album.trim() !== "" ? json.album : "No album") + ")</div>";
}

function loadUrl(url, callback, reader) {
    var $ = function(e){return document.getElementById(e);};

    ID3.loadTags(url, function() {
        var tags = ID3.getAllTags(url);

        song_details.innerHTML = getSongDetails(tags);
        artist = tags.artist;
        title = tags.title;

        if( "picture" in tags ) {
                var image = tags.picture;
                var base64String = "";
                for (var i = 0; i < image.data.length; i++) {
                    base64String += String.fromCharCode(image.data[i]);
                }
            $("art").src = "data:" + image.format + ";base64," + window.btoa(base64String);
            $("art").style.display = "block";
        } else {
            let ran = Math.floor((Math.random() * 3));
            if(ran === 0) $("art").src = "background.jpg";
            else $("art").src = "background" + ran + ".jpg";
            $("art").style.display = "none";
        }

        if( callback ) { callback(); };
    },
    {
        tags: ["artist", "title", "album", "year", "comment", "track", "genre", "lyrics", "picture"],
        dataReader: reader
    });
}

/**
 * VD: num = parseFloat("42.318")+100
 * kết quả sẽ ra là num = 142.31799999999998, chứ đéo phải 142.318
 * -_- @_@ ===> WTF???
 * do đó cần convert num thành số có 3 chữ số sau dấu phẩy (3 decimal places)
 **/
function myParseFloat(num) {
    return parseFloat(num.toFixed(3));
}

/**
 * Convert time stamp to seconds
 * @param {string} timestamp Lyrics time stamp, in format [2:17.88] or [1:03:45.32]
 * @return {number} Time in seconds, float number
 * Reference: https://github.com/guoyunhe/rabbit-lyrics/blob/master/src/index.js
 */
function decodeTime(timestamp) {
    if (!timestamp || typeof timestamp !== "string") return 0;
    let results;

    // [hh:mm:ss.xx] format, used by some long audio books
    results = timestamp.match(/\[(\d+):(\d+):(\d+\.\d+)\]/);
    if (results && results.length === 4) {
        return parseFloat((
            parseInt(results[1]) * 60 * 60 +
            parseInt(results[2]) * 60 +
            parseFloat(results[3])
        ).toFixed(3));
    }

    // [mm:ss.xx] format, widely used for songs
    // chú ý: regex này có 2 group: (\d+) và (\d+\.\d+)
    // do đó results sẽ là 1 mảng chứa 2 group này
    results = timestamp.match(/\[(\d+):(\d+\.\d+)\]/);
    if (results && results.length === 3) {
        return parseFloat((parseInt(results[1]) * 60 + parseFloat(results[2])).toFixed(3));
    }

    return 0;
}

/**
 * create and return new element
 * @param {string} tagName type of tag to create (ex: div, span, h1...)
 * @param {string} id id of tag
 * @param {string} classList list of classes for this tag
 * @param {JSON} attributes list of attribute this tag
 * @return {HTMLElement} element that be created
 **/
function createNewElement(tagName, id, classList, attributes=null) {
    let ele = document.createElement(tagName);

    if (id != null && typeof id === "string" && id != "") {
        ele.setAttribute("id", id);
    }
    if (classList != null && typeof classList === "string" && classList != "") {
        ele.setAttribute("class", classList);
    }
    if (attributes != null && typeof attributes === "object") {
        let key;
        for (let i = 0; i < Object.keys(attributes).length; i++) {
            ele.setAttribute(Object.keys(attributes)[i], attributes[Object.keys(attributes)[i]]);
        }
    }

    return ele;
}
