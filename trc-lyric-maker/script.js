var input_lyric = document.getElementById("input_lyric");
var div_result = document.getElementById("div_result");
var btn_play = document.getElementById("btn_play");
var btn_next = document.getElementById("btn_next");
var btn_finish = document.getElementById("btn_finish");
var myAudio, artist, title;
var audio_wrapper = document.getElementById("audio_wrapper");
var song_details = document.getElementById("song_details");
var lds_roller_wrapper = document.getElementsByClassName("lds-roller-wrapper")[0];
var btn_download_wrapper = document.getElementById("btn_download_wrapper");
//var btn_toggle_time = document.getElementsByClassName("btn_toggle_time")[0];
var cbShowTime = document.getElementById("cbShowTime");

// thời điểm bắt đầu chạy nhạc (bắt đầu tạo lời bài hát)
var startTime;

// thời điểm bắt đầu của 1 từ
var prevTime;

// thời điểm bắt đầu của từ tiếp theo (khi ấn next sẽ dùng time này)
var currTime;

// thời điểm kết thúc của 1 từ (khi ấn down sẽ dùng time này)
var finishTime;

// chỉ số của từ hiện tại để chèn thêm milisecond
var index;

// biến global để dễ debug :v
// words[a][b] = từ ở hàng thứ a, cột b
var words = [];

// Dùng để tạo effect khi đang ở 1 từ nào đó
var interval;
var percent = 0;

div_result.addEventListener("keypress", function(event) {
    console.log(event.keyCode);
})

function playSong() {
    // init words array
    words = input_lyric.value.trim().split("\n");
    for(var i = 0; i < words.length; i++) {
        words[i] = words[i].trim().split(/[\s]+/);
    }
    index = 0;

    /*============= insert data into div_result =============*/
    div_result.innerHTML = "";
    var indexTemp = 0;

    // thêm 1 span rỗng vào từ đầu tiên
    var spanEmpty = document.createElement("span");
    spanEmpty.setAttribute("id", "word_" + indexTemp);
    div_result.appendChild(spanEmpty);
    indexTemp++;

    for(var i = 0; i < words.length; i++) {
        for(var j = 0; j < words[i].length; j++) {
            //console.log(" words[i][j] = ",  words[i][j]);

            // bỏ qua những ký tự rỗng (do 1 dòng ko có chữ gì)
            //if(words[i][j] == "") continue;

            var span = document.createElement("span");
            span.innerText = words[i][j] + (j==words[i].length-1 ? "" : " ");
            span.setAttribute("id", "word_" + indexTemp);
            if(j == 0 & i != 0) {
                span.classList.add("start_line");

                var br = document.createElement("br");
                div_result.appendChild(br);
            }

            div_result.appendChild(span);
            indexTemp++;
        }
    }
    
    enableBtns();

    // scroll down
    // document.body.scrollTop = btn_play.offsetTop;
    doScrolling("#cbShowTime", 500);

    // start play song
    myAudio.currentTime = 0
    myAudio.play();

    // bắt đầu tính giờ
    startTime = new Date().valueOf();
    prevTime = startTime;
    currTime = startTime;
    finishTime = 0;
}

function enableBtns() {
    // enable btn_next and set focus on it, show div_result...
    btn_next.disabled = false;
    btn_next.focus();
    btn_finish.disabled = false;
    div_result.classList.remove("display-none");
    //div_result.focus();
    cbShowTime.disabled = true;
    
    // create a link download lyric file
    var btnDownload = document.createElement("div");
    btnDownload.setAttribute("class", "btn btn_download");
    btnDownload.setAttribute("title", "Save " + (title!=undefined ? "\""+title+"\"" : "this") + " lyric");
    btnDownload.innerHTML = "Download";
    btnDownload.addEventListener("click", downloadLyric);
    btn_download_wrapper.innerHTML = "";
    btn_download_wrapper.appendChild(btnDownload);
}

function disableBtns() {
    btn_next.disabled = true;
    btn_finish.disabled = true;
    div_result.classList.add("display-none");
    cbShowTime.disabled = false;

    // remove btn_download
    btn_download_wrapper.innerHTML = "";
}

var currWord, nextWord;

function btnNextWord() {
    currTime = new Date().valueOf();
    var diff;
    if(finishTime > prevTime && finishTime < currTime) {
        console.log("vaoday");
        diff = finishTime - prevTime;
    } else {
        diff = currTime - prevTime;
    }
    //console.log(startTime/100000, currTime/100000, finishTime/100000);

    currWord = document.getElementById("word_" + index);
    nextWord = document.getElementById("word_" + (index+1));
    //var prevWord = document.getElementById("word_" + (index-1));
    var isCurrwordWordEmpty = currWord.innerText.trim() == "" ? true : false;

    //console.log(prevWord);

    var timeString = "";

    createBiggerWordEffect(currWord, nextWord);

    if(index == 0) {
        // Đây là từ đầu tiên
        timeString += getFormattedPassTime(currTime - startTime);
        // currWord.innerHTML = timeString + currWord.innerHTML;
        addTimeBeforeWord(currWord, timeString);
        currWord.classList.add("passed_word");
        
        prevTime = currTime;
        index++
        return;
    }

    if(currWord.classList.contains("start_line")) {
        // prevTime lúc này chính là thời điểm kết thúc của từ cuối cùng của hàng trước đó (Xem [1])
        timeString += getFormattedPassTime(prevTime - startTime);
    }
    timeString += "<" + diff + ">";
    //timeString += "<" + (currTime - prevTime) + ">";

    if(finishTime > prevTime && finishTime < currTime) {
        addTimeAfterWord(currWord, "<" + (currTime - finishTime) + ">");
    }
    // currWord.innerHTML = timeString + currWord.innerHTML;
    addTimeBeforeWord(currWord, timeString);
    currWord.classList.add("passed_word");

    // scroll down
    if(!isCurrwordWordEmpty)
        div_result.scrollTop = currWord.offsetTop - document.getElementById("word_1").offsetTop - 50;
    
    // [1] Set thời điểm bắt đầu của từ này = thời điểm kết thúc của từ này
    // (để dùng cho việc tính toán thời điểm của từ tiếp theo)
    prevTime = currTime;
    index++;
}

function btnNextKeyPress(event) {
    //console.log(event.keyCode);
    if(event.keyCode == 110) {
        // chữ 'n'
        nextWord();
    } else if(event.keyCode == 102) {
        // chữ f
        finishWord();
    }
}

/**
 * Thêm thời gian vào trước 1 từ
 * @param word: thẻ span cần thêm time vào
 **/ 
function addTimeBeforeWord(word, timeString) {
    var span = document.createElement("span");
    if(cbShowTime.checked == true) {
        span.setAttribute("class", "word_time");
    } else {
        span.setAttribute("class", "word_time display-none");
    }
    span.innerText = timeString;
    word.insertBefore(span, word.firstChild);
}

/**
 * Thêm thời gian vào sau 1 từ
 * @param word: thẻ span cần thêm time vào
 **/ 
    function addTimeAfterWord(word, timeString) {
    var span = document.createElement("span");
    if(cbShowTime.checked == true) {
        span.setAttribute("class", "word_time");
    } else {
        span.setAttribute("class", "word_time display-none");
    }
    span.innerText = timeString;
    word.appendChild(span);
}

// khi click finish thì sẽ gọi hàm này
function finishWord() {
    //console.log("finishWord()");
    finishTime = new Date().valueOf();
    btn_next.focus();
    if(nextWord!=null) nextWord.classList.add("finish_word");
}

function createKaraokeEffect(currWord, nextWord) {
    window.clearInterval(interval);
    percent = 0;
    if(currWord!=null) currWord.style.background = "";

    interval = window.setInterval(function() {
        if(percent < 60) percent += 10;
        else if(percent < 99) percent += (100 - percent)/5;
        else window.clearInterval(interval);

        if(nextWord!=null) nextWord.style.background = "linear-gradient(to right, #00b217 " + percent + "%, #ffffff00 " + (100 - percent) + "%)";
    }, 300);
}

function createBiggerWordEffect(currWord, nextWord) {
    if(currWord!=null) {
        currWord.classList.remove("bigger_word");
        // uncomment this if you like!
        // currWord.classList.remove("finish_word");
    }
    if(nextWord!=null) nextWord.classList.add("bigger_word");
}

/**
 * Trả về thời gian theo format [minute:second.milisecond]
 * @param milisec: thời gian cần format
 **/
function getFormattedPassTime(milisec) {
    var minute = Math.floor(milisec/60000);  // 1 minute = 60000 ms
    var second = Math.floor((milisec - minute*60000)/1000);   //1 second = 1000 ms
    var milisecond = Math.floor(milisec - minute*60000 - second*1000);

    var temp2 = new Date().valueOf();
    return "[" + minute + ":" + second + "." + milisecond + "]";
}

function showLoading() {
    lds_roller_wrapper.classList.remove("display-none");
}

function hideLoading() {
    // delay 100ms for seeing the loading icon more clearly :v
    //setTimeout(function() {
        lds_roller_wrapper.classList.add("display-none");
    //}, 300);
}

function downloadLyric() {
    var word_time = document.getElementsByClassName("word_time");
    if(word_time[0].classList.contains("display-none")) {
        toggleWordTime();
    }
    var a = document.body.appendChild(
        document.createElement("a")
    );
    a.download = artist + " - " + title + ".trc";
    a.href = "data:text/plain," + document.getElementById("div_result").innerText;
    a.click(); // Trigger a click on the element

    // don't need to keep this element on our page
    document.body.removeChild(a);
}

function toggleWordTime() {
    var word_time = document.getElementsByClassName("word_time");
    console.log(word_time);

    if(word_time[0].classList.contains("display-none")) {
        // show time
        for(var i = 0; i < word_time.length; i++) {
            word_time[i].classList.remove("display-none");
        }
        //btn_toggle_time.innerText = "Hide time";
    } else {
        // hide time
        for(var i = 0; i < word_time.length; i++) {
            word_time[i].classList.add("display-none");
        }
        //btn_toggle_time.innerText = "Show time";
    }
}

function loadSong(elem, event) {
    disableBtns();
    
    var file = elem.files[0];
    
    // if user cancel selecting a file
    if(file == undefined) return;

    showLoading();

    var url = file.urn ||file.name;
    loadUrl(url, null, FileAPIReader(file));

    var audio = document.createElement("audio");
    audio.setAttribute("controls", "");
    audio.setAttribute("id", "myAudio");
    
    var source = document.createElement("source");
    source.src = URL.createObjectURL(elem.files[0]);

    audio.appendChild(source);

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
