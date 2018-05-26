function indexOfTab(tabId) {
    for (var i = 0; i < tabs.length; i++) {
        if (tabId === tabs[i].id) {
            return i;
        }
    }
    return -1;
}

function DelayedFunction(f, timeout) {

    var complete = false;

    var timeoutRef = setTimeout(function () {
        _invoke();
    }.bind(this), timeout);

    function _invoke() {
        complete = true;
        f();
    }

    this.call = function () {
        if (!complete) {
            _invoke();
        }
    };

    this.cancel = function () {
        complete = true;
        clearTimeout(timeoutRef);
    };
}

var tabOrderUpdateFunction = null;
var skipTabOrderUpdateTimer = null;
var badgeColor = { color: [32, 7, 114, 255] };

function updateTabOrder(tabId) {

    if (tabOrderUpdateFunction) {
        // clear current timer
        tabOrderUpdateFunction.cancel();
    }

    var idx = indexOfTab(tabId);

    // setup a new timer
    tabOrderUpdateFunction = new DelayedFunction(function () {
        if (idx >= 0) {
            var tab = tabs[idx];
            tabs.splice(idx, 1);
            tabs.unshift(tab);
        }
        // reset the badge color
        chrome.browserAction.setBadgeBackgroundColor(badgeColor);
    }, tabId === skipTabOrderUpdateTimer ? 0 : 1500);

    // clear the skip var
    skipTabOrderUpdateTimer = null;
}

function updateTabsOrder(tabArray) {
    for (var j = tabArray.length - 1; j >= 0; j--) {
        updateTabOrder(tabArray[j].id)
    }
}

function switchTabsWithoutDelay(tabid, callback) {
    skipTabOrderUpdateTimer = tabid;
    switchTabs(tabid, callback)
}

function switchTabs(tabid, callback) {
    chrome.tabs.get(tabid, function (tab) {
        if (callback) {
            callback();
        }
        chrome.windows.update(tab.windowId, { focused: true }, function () {
            chrome.tabs.update(tab.id, { selected: true });
            chrome.tabs.move(tab.id, { index: -1 });
        });
    });
}

function recordTab(tab) {
    tabs.push(tab);
}

var tabs = [];

function init() {

    tabs = [];

    // count and record all the open tabs for all the windows
    chrome.windows.getAll({ populate: true }, function (windows) {

        for (var i = 0; i < windows.length; i++) {
            var t = windows[i].tabs;

            for (var j = 0; j < t.length; j++) {
                recordTab(t[j]);
            }
        }

        // set the current tab as the first item in the tab list
        chrome.tabs.query({ currentWindow: true, active: true }, function (tabArray) {
            updateTabsOrder(tabArray);
        });
    });
}

init();