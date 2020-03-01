var input_lyric = document.getElementById("input_lyric");
var div_result = document.getElementById("div_result");
var btn_play = document.getElementById("btn_play");
var btn_next = document.getElementById("btn_next");
var btn_finish = document.getElementById("btn_finish");
var btn_finish_line = document.getElementById("btn_finish_line");
var myAudio, artist, title, audioFileName;
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
            var span = document.createElement("span");
            if(words[i][j] == "") {
                span.innerHTML = "&nbsp" + (j==words[i].length-1 ? "" : " ");
            } else {
                span.innerText = words[i][j] + (j==words[i].length-1 ? "" : " ");
            }
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
    // doScrolling("#myAudio", 500);
    scrollPage(document.getElementById("myAudio"), 500);

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
    btn_finish_line.disabled = false;
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
    btn_finish_line.disabled = true;
    div_result.classList.add("display-none");
    cbShowTime.disabled = false;

    // remove btn_download
    btn_download_wrapper.innerHTML = "";
}

var currWord, nextWord;

function btnNextWord() {
    currTime = new Date().valueOf();
    var diff;
    var timeString = "";

    if(finishTime > prevTime && finishTime < currTime) {
        diff = finishTime - prevTime;
    } else {
        diff = currTime - prevTime;
    }

    currWord = document.getElementById("word_" + index);
    nextWord = document.getElementById("word_" + (index+1));
    createBiggerWordEffect(currWord, nextWord);

    if(index == 0) {
        // Đây là từ đầu tiên
        timeString += getFormattedPassTime(currTime - startTime);
        addTimeBeforeWord(currWord, timeString);
        currWord.classList.add("passed_word");
        
        index++;
        prevTime = currTime;
        return;
    }

    if(currWord.classList.contains("start_line")) {
        // prevTime lúc này chính là thời điểm kết thúc của từ cuối cùng của hàng trước đó (Xem [1])
        //fixJsSidaError(prevTime);
        timeString += getFormattedPassTime(prevTime - startTime);
    }
    timeString += "<" + diff + ">";

    if(finishTime > prevTime && finishTime < currTime) {
        addTimeAfterWord(currWord, "<" + (currTime - finishTime) + ">");
    }
    // currWord.innerHTML = timeString + currWord.innerHTML;
    addTimeBeforeWord(currWord, timeString);
    currWord.classList.add("passed_word");

    // scroll lyric
    div_result.scrollTop = currWord.offsetTop - document.getElementById("word_1").offsetTop - 50;
    
    index++;
    
    // [1] Set thời điểm bắt đầu của từ này = thời điểm kết thúc của từ này
    // (để dùng cho việc tính toán thời điểm của từ tiếp theo)
    prevTime = currTime;
}

function btnNextKeyPress(event) {
    //console.log(event.keyCode);
    if(event.keyCode == 110) {
        // chữ 'n'. Có thể ấn Enter hoặc Backspace cũng được
        btnNextWord();
    } else if(event.keyCode == 102) {
        // chữ f
        finishWord();
    }  else if(event.keyCode == 108) {
        // chữ l
        finishLine();
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

/**
 * Hàm này khá giống btnNextWord, chỉ khác ở chỗ, nó sẽ coi từ word hiện tại
 * đến word cuối cùng của dòng hiện tại là 1 word
 */
function finishLine() {
    currTime = new Date().valueOf();
    var diff;
    var timeString = "";
    var diffWord = 0;
    var tmpWord;

    if(finishTime > prevTime && finishTime < currTime) {
        diff = finishTime - prevTime;
    } else {
        diff = currTime - prevTime;
    }

    currWord = document.getElementById("word_" + index);
    while(true) {
        diffWord++;
        tmpWord = document.getElementById("word_" + (index + diffWord));
        if(tmpWord.classList.contains("start_line")) {
            break;
        }
        tmpWord.classList.add("passed_word");
    }
    nextWord = document.getElementById("word_" + (index + diffWord));
    createBiggerWordEffect(currWord, nextWord);
    btn_next.focus();

    if(index == 0) {
        // Đây là từ đầu tiên
        timeString += getFormattedPassTime(currTime - startTime);
        addTimeBeforeWord(currWord, timeString);
        currWord.classList.add("passed_word");
        
        index += diffWord;
        prevTime = currTime;
        return;
    }

    if(currWord.classList.contains("start_line")) {
        // prevTime lúc này chính là thời điểm kết thúc của từ cuối cùng của hàng trước đó (Xem [1])
        //fixJsSidaError(prevTime);
        timeString += getFormattedPassTime(prevTime - startTime);
    }
    timeString += "<" + diff + ">";

    if(finishTime > prevTime && finishTime < currTime) {
        addTimeAfterWord(currWord, "<" + (currTime - finishTime) + ">");
    }
    // currWord.innerHTML = timeString + currWord.innerHTML;
    addTimeBeforeWord(currWord, timeString);
    currWord.classList.add("passed_word");

    // scroll lyric
    div_result.scrollTop = currWord.offsetTop - document.getElementById("word_1").offsetTop - 50;
    
    index += diffWord;
    
    // [1] Set thời điểm bắt đầu của từ này = thời điểm kết thúc của từ này
    // (để dùng cho việc tính toán thời điểm của từ tiếp theo)
    prevTime = currTime;
}

function createBiggerWordEffect(currWord, nextWord) {
    removeBiggerWord(currWord);
    addBiggerWord(nextWord);
}

function removeBiggerWord(currWord) {
    if(currWord!=null) {
        currWord.classList.remove("bigger_word");
    }
}

function addBiggerWord(nextWord) {
    if(nextWord!=null) {
        nextWord.classList.add("bigger_word");
    }
}

/**
 * Trả về thời gian theo format [minute:second.milisecond]
 * @param {long} milisec: thời gian cần format
 **/
function getFormattedPassTime(milisec) {
    // TẠI SAO PHẢI LÀM PHỨC TẠP NHƯ SAU, LẠI CÒN BỊ SAI NỮA
    // VD: getFormattedPassTime(119056) = [1:59.56] (sai!), chứ ko phải [1:59.056]
    // var minute = Math.floor(milisec/60000);  // 1 minute = 60000 ms
    // var second = Math.floor((milisec - minute*60000)/1000);   //1 second = 1000 ms
    // var milisecond = Math.floor(milisec - minute*60000 - second*1000);
    // return "[" + minute + ":" + second + "." + milisecond + "]";

    // Cách đơn giản mà đúng: getFormattedPassTime(119056) = [1:59.056]
    var minute = Math.floor(milisec/60000);  // 1 minute = 60000 ms
    var second = (milisec - minute*60000)/1000;   //1 second = 1000 ms

    if(second%1 === 0) second = second + ".000";

    return "[" + minute + ":" + second + "]";
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
    showWordTime();
    
    var a = document.body.appendChild(
        document.createElement("a")
    );
    if(artist != null && title != null)
        a.download = artist + " - " + title + ".trc";
    else a.download = audioFileName.substring(0, audioFileName.length-4) + ".trc";

    a.href = "data:text/plain," + document.getElementById("div_result").innerText;
    a.click(); // Trigger a click on the element

    // don't need to keep this element on our page
    document.body.removeChild(a);
}

function toggleWordTime() {
    var word_time = document.getElementsByClassName("word_time");

    if(word_time[0].classList.contains("display-none")) {
        showWordTime(word_time);
    } else {
        hideWordTime(word_time);
    }
}

function showWordTime(word_time = null) {
    if(word_time == null || word_time == undefined) {
        word_time = document.getElementsByClassName("word_time");
    }
    for(var i = 0; i < word_time.length; i++) {
        word_time[i].classList.remove("display-none");
    }
    //btn_toggle_time.innerText = "Hide time";
}

function hideWordTime(word_time = null) {
    if(word_time == null || word_time == undefined) {
        word_time = document.getElementsByClassName("word_time");
    }
    for(var i = 0; i < word_time.length; i++) {
        word_time[i].classList.add("display-none");
    }
    //btn_toggle_time.innerText = "Show time";
}

// reference: https://github.com/aadsm/JavaScript-ID3-Reader
function loadSong(elem, event) {
    disableBtns();
    title = artist = null;
    
    var file = elem.files[0];
    
    // if user cancel selecting a file
    if(file == undefined) return;

    showLoading();
    audio_wrapper.innerHTML = "";

    var url = file.urn ||file.name;
    loadUrl(url, null, FileAPIReader(file));
    audioFileName = file.name;

    var note = document.createElement("div");
    note.innerHTML = "Note: Please do not pause the audio during making lyric!";
    note.setAttribute("style", "color: #2196F3;margin-bottom: 10px;");
    audio_wrapper.appendChild(note);

    var audio = document.createElement("audio");
    audio.setAttribute("controls", "");
    audio.setAttribute("id", "myAudio");
    
    var source = document.createElement("source");
    source.src = URL.createObjectURL(elem.files[0]);
    audio.appendChild(source);
    myAudio = audio;
    audio_wrapper.appendChild(audio);
    
    btn_play.disabled = false;
    
    hideLoading();
}

function loadUrl(url, callback, reader) {
    var $ = function(e){return document.getElementById(e);};

    var startDate = new Date().getTime();
    ID3.loadTags(url, function() {
        var endDate = new Date().getTime();
        var tags = ID3.getAllTags(url);

        song_details.innerHTML = tags.artist + " - " + tags.title + (tags.album==undefined||tags.album.trim()=="" ? "" : " (" + tags.album + ")");
        artist = tags.artist;
        title = tags.title;
        console.log(artist, title);

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
