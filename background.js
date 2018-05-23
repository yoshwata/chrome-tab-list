chrome.windows.getAll({ populate: true }, function (windows) {
    windows.forEach(function (window) {
        window.tabs.forEach(function (tab) {
            //collect all of the urls here, I will just log them instead
            console.log(tab.url);
            var a = document.createElement("a");
            var linkText = document.createTextNode(tab.url);
            a.appendChild(linkText);
            a.title = tab.url;
            a.href = tab.url;
            document.body.appendChild(a);
            var br = document.createElement("br");
            document.body.appendChild(br);
        });
    });
});