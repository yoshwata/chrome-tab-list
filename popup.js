var bg = chrome.extension.getBackgroundPage();

function startsWith(str, start) {
    return str.lastIndexOf(start, 0) === 0;
}

function endsWith(str, end) {
    return str.indexOf(end, str.length - end.length) !== -1;
}

function encodeHTMLSource(str) {
    var encodeHTMLRules = { "&": "&#38;", "<": "&#60;", ">": "&#62;", '"': '&#34;', "'": '&#39;', "/": '&#47;', "{": '<b>', "}": '</b>' },
        matchHTML = /&(?!#?\w+;)|<|>|"|'|\/|{|}/g;
    return str ? str.replace(matchHTML, function (m) {
        return encodeHTMLRules[m] || m;
    }) : str;
}

function stripTitle(str) {
    str = $('<div/>').html(str).text();
    str = str.replace(/(?:\{|\})/g, '');
    return str;
}

function closeWindow() {
    $(document).unbind();
    window.close();
    return false;
}

function renderTabs(params, delay, currentTab) {
    if (params === null) {
        return;
    }

    var allTabs = (params.allTabs || []).reduce(function (result, obj) {
        obj.templateTabImage = tabImage(obj);
        obj.templateTitle = encodeHTMLSource(obj.title);
        obj.templateTooltip = stripTitle(obj.title);
        obj.templateUrl = encodeHTMLSource(obj.displayUrl || obj.url);
        result.push(obj);
        return result;
    }, []);

    var context = {
        'type': params.type || "all",
        'tabs': allTabs,
        'tabImageStyle': "tabimage",
    };

    setTimeout(function () {
        document.getElementById("content-list").innerHTML = Mustache.to_html(
            document.getElementById('template').text, context
        );

        $('.open').on('click', function () {
            bg.switchTabsWithoutDelay(parseInt(this.id), function () {
                closeWindow();
            });
        });
    }, delay || 1);
}

function log() {
    if (bg.debug) {
        var args = Array.prototype.slice.call(arguments);
        args.unshift(LOG_SRC);
        bg.log.apply(bg, args);
    }
}

function tabImage(tab) {
    if (tab.audible) {
        return "/assets/noisy.png"
    } else if (tab.favIconUrl && (startsWith(tab.favIconUrl, "data:") || /^https?:\/\/.*/.exec(tab.favIconUrl))) {
        // if the favicon is a valid URL or embedded data return that
        return tab.favIconUrl;
    } else if (/^chrome:\/\/extensions\/.*/.exec(tab.url)) {
        return "/assets/chrome-extensions-icon.png";
    } else {
        return "/assets/blank.png"
    }
}

function drawCurrentTabs() {
    chrome.tabs.query({}, function (queryResultTabs) {

        bg.tabs = queryResultTabs;

        // find the current tab so that it can be excluded on the initial tab list rendering
        chrome.tabs.query({ currentWindow: true, active: true }, function (tab) {

            renderTabs({
                allTabs: bg.tabs,
                closedTabs: bg.closedTabs
            }, 100, tab[0]);
        })
    });
}

$(document).ready(function () {
    search = new FuseSearch();

    $('#searchbox').on({
        'keyup': function () {
            var str = $("#searchbox").val();
            var result = search.executeSearch(str);
            renderTabs(result);
        }
    });

    drawCurrentTabs();
});

function Timer() {
    this.start = this.last = (new Date).getTime();
}

Timer.prototype.reset = function () {
    this.start = this.last = (new Date).getTime();
};

var pageTimer = new Timer();

function AbstractSearch() {
}

function FuseSearch() { }

FuseSearch.prototype = Object.create(AbstractSearch.prototype);

// highlights Fuse results with the matches
FuseSearch.prototype.highlightResult = function (result) {
    var item = result.item;
    var highlighted = {};
    result.matches.forEach(function (match) {
        var formatted = item[match.key];

        // highlight each of the matches
        match.indices.forEach(function (endpoints, i) {
            // each previous match has added two characters
            var offset = i * 2;
            formatted = this.highlightString(formatted, endpoints[0] + offset, endpoints[1] + offset);
        }.bind(this));

        highlighted[match.key] = formatted;
    }.bind(this));
    return highlighted;
};

FuseSearch.prototype.searchTabArray = function (query, tabs) { var options = { keys: [{ name: 'title', weight: 0.5 }], include: ['matches'] }; options.keys.push({ name: 'url', weight: 1 }); var fuse = new Fuse(tabs, options); return fuse.search(query.trim()).map(function (result) { var highlighted = this.highlightResult(result); return { title: highlighted.title || result.item.title, displayUrl: highlighted.url || result.item.url, url: result.item.url, id: result.item.id, favIconUrl: result.item.favIconUrl } }.bind(this)); };

AbstractSearch.prototype.shouldSearch = function (query) {
    // make sure the this.searchStr variable has been initialized
    if (!this.searchStr) this.searchStr = "";
    var newQuery = this.searchStr !== query;
    this.searchStr = query;
    return newQuery;
};

AbstractSearch.prototype.highlightString = function (string, start, end) {
    return string.substring(0, start) + '{' + string.substring(start, end + 1) + '}' + string.substring(end + 1);
};

AbstractSearch.prototype.executeSearch = function (query) {

    if (!this.shouldSearch(query)) {
        return null;
    }

    pageTimer.reset();

    // Filter!
    var filteredTabs = [];

    if (query.trim().length === 0) {
        filteredTabs = bg.tabs;
    } else {
        filteredTabs = this.searchTabArray(query, bg.tabs);
        var resultCount = filteredTabs.length;
    }

    return {
        allTabs: filteredTabs,
    };
  };