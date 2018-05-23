chrome.windows.getAll({ populate: true }, function (windows) {
    windows.forEach(function (window) {
        window.tabs.forEach(function (tab) {
            //collect all of the urls here, I will just log them instead
            console.log(tab.url);
            // var div = document.getElementById("urlList");
            var a = document.createElement("a");
            var linkText = document.createTextNode(tab.url);
            a.appendChild(linkText);
            // var text = document.createTextNode(tab.url);
            a.title = tab.url;
            a.href = tab.url;
            // 1document.body.appendChild(p).appendChild(text);
            document.body.appendChild(a);
            // div.textContent = "aadfadsf";
            var x = document.createElement("br");
            document.body.appendChild(x);
        });
    });
});