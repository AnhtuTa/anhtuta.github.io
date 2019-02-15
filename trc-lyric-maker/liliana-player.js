var btn_sync_up = document.getElementsByClassName("btn_sync_up")[0];
var btn_sync_down = document.getElementsByClassName("btn_sync_down")[0];
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

    myAudio.onplay = function() {
        if(div_result.innerHTML == "") {
            initLyric();
            setPlayLyricInterval();
        }

        if(playLyricInterval == null) setPlayLyricInterval();
    }
    myAudio.onseeked = function() {
        if(playLyricInterval == null) {
            // setPlayLyricInterval();
            // clearPlayLyricInterval();
            updateLyric();
            scrollLyric();
        }
    }
    myAudio.onpause = function() {
        if(playLyricInterval != null) clearPlayLyricInterval();
    }
}

function loadUrl(url, callback, reader) {
    var $ = function(e){return document.getElementById(e);};

    var startDate = new Date().getTime();
    ID3.loadTags(url, function() {
        var endDate = new Date().getTime();
        // if (typeof console !== "undefined") console.log("Time: " + ((endDate-startDate)/1000)+"s");
        var tags = ID3.getAllTags(url);

        song_details.innerHTML = tags.artist + " - " + tags.title + (tags.album==undefined||tags.album.trim()=="" ? "" : " (" + tags.album + ")");
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
            $("art").style.display = "none";
        }

        if( callback ) { callback(); };
    },
    {tags: ["artist", "title", "album", "year", "comment", "track", "genre", "lyrics", "picture"],
    dataReader: reader});
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
});
btn_sync_down.addEventListener("click", function() {
    offsetTime -= 100;
    showSyncToast();
});
