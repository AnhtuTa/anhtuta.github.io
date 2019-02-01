function loadSong(elem, event) {
    var file = elem.files[0];
    if(file == undefined) return;

    audio_wrapper.innerHTML = "";
    div_result.innerHTML = "";
    div_result.style.display = "none";
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
        if(playLyricInterval == null) setPlayLyricInterval();
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
