# Cách download ảnh từ 1 trang web bằng browser của người dùng
- Giả sử 1 trang web có nhiều thẻ như sau:
```html
<div class="ladi-image-background"></div>
```
- Và style của class trên như sau:
```css
.ladi-image-background {
    width: 900px;
    height: 1500px;
    background-image: url(https://w.ladicdn.com/s1300x1900/5842439…/1-20191022044040.jpg);
}
```
- Các thẻ trên có background là ảnh mà ta muốn tải về (tải tất cả ảnh đó), thế thì chỉ cần tìm tất cả các thẻ đó và lấy thuộc tính style.backgroundImage và tải về là xong
- Nhưng phần khó khăn nhất là code phần download ảnh từ 1 URL
- Code như sau nhé
```javascript
var divImgs = document.getElementsByClassName("ladi-image-background");
for (var i = 0; i < divImgs.length; i++) {
    var styles = getComputedStyle(divImgs[i]);
    var url = styles.backgroundImage.substring(5, styles.backgroundImage.length - 2);
    var name = url.substring(url.lastIndexOf("/") + 1);
    forceDownload(url, name);
}

function forceDownload(url, fileName) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.responseType = "blob";
    xhr.onload = function () {
        var urlCreator = window.URL || window.webkitURL;
        var imageUrl = urlCreator.createObjectURL(this.response);
        var tag = document.createElement('a');
        tag.href = imageUrl;
        tag.download = fileName;
        document.body.appendChild(tag);
        tag.click();
        document.body.removeChild(tag);
    }
    xhr.send();
}
```