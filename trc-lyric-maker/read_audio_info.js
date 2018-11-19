function loadSong(elem) {
    showLoading();

    var file = elem.files[0];
    var url = file.urn ||file.name;
    loadUrl(url, null, FileAPIReader(file));
    console.log("below loadUrl method");

    var audio = document.createElement("audio");
    audio.setAttribute("controls", "");
    audio.setAttribute("style", "margin: 10px 0;");
    
    var source = document.createElement("source");
    source.src = URL.createObjectURL(elem.files[0]);

    audio.appendChild(source);

    // not really needed in this exact case, but since it is really important in other cases,
    // don't forget to revoke the blobURI when you don't need it
    // audio.onend = function(e) {
    //     URL.revokeObjectURL(elem.src);
    // }
    
    myAudio = audio;
    audio_wrapper.innerHTML = "";
    audio_wrapper.appendChild(audio);

    var note = document.createElement("div");
    note.innerHTML = "Note: Please do not pause the audio during making lyric!";
    note.setAttribute("style", "color: #2196F3;margin-bottom: 10px;");
    audio_wrapper.appendChild(note);
    
    btn_play.disabled = false;
    
    hideLoading();
}

function loadUrl(url, callback, reader) {
    var $ = function(e){return document.getElementById(e);};

    var startDate = new Date().getTime();
    ID3.loadTags(url, function() {
        var endDate = new Date().getTime();
        // if (typeof console !== "undefined") console.log("Time: " + ((endDate-startDate)/1000)+"s");
        var tags = ID3.getAllTags(url);
        
        // $("artist").textContent = tags.artist || "";
        // $("title").textContent = tags.title || "";
        // $("album").textContent = tags.album || "";
        // $("artist").textContent = tags.artist || "";
        // $("year").textContent = tags.year || "";
        // $("comment").textContent = (tags.comment||{}).text || "";
        // $("genre").textContent = tags.genre || "";
        // $("track").textContent = tags.track || "";
        // $("lyrics").textContent = (tags.lyrics||{}).lyrics || "";
        song_details.innerHTML = tags.artist + " - " + tags.title + " (" + tags.album + ")";
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

    console.log("finish loadUrl()");
}
