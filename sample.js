// The onClicked callback function.
function onClickHandler(info, tab) {
    console.log("item " + info.menuItemId + " was clicked");
    console.log("info: " + JSON.stringify(info));
    console.log("tab: " + JSON.stringify(tab));
    chrome.tabs.create({url: chrome.extension.getURL('background.html')});
};

chrome.contextMenus.onClicked.addListener(onClickHandler);

// Set up context menu tree at install time.
chrome.runtime.onInstalled.addListener(function() {
  var title = "Show tab list";
  var id = chrome.contextMenus.create({"title": title, "contexts":["page"],
                                         "id": "context" + "page"});
    console.log("'" + context + "' item:" + id);
});
