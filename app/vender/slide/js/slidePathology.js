/**
 * Pathology - 1.0.0
 * @email v
 * @author 
 */

if (!window.Slide) {
  window.Slide = {};
}

var Slide = window.Slide;

/**
 * Pathology - 1.0.0
 * @email v
 * @author 
 */

var SlideBrowser  = Slide.Browser = {
  UNKNOWN: 0,
  IE: 1,
  FIREFOX: 2,
  SAFARI: 3,
  CHROME: 4,
  OPERA: 5
};

var SlideUtils = Slide.Utils = function () {
  // Fields
  var self = this,

    arrActiveX = ["Msxml2.XMLHTTP", "Msxml3.XMLHTTP", "Microsoft.XMLHTTP"],
    supportedImageFormats = {
      "bmp": false,
      "jpeg": true,
      "jpg": true,
      "png": true,
      "tif": false,
      "wdp": false
    },

    browser = SlideBrowser.UNKNOWN,
    browserVersion = 0,
    badAlphaBrowser = false,  // updated in constructor

    urlParams = {};

  // Constructor
  (function () {
    // Browser detect
    var app = navigator.appName,
      ver = navigator.appVersion,
      ua = navigator.userAgent;

    if (app === "Microsoft Internet Explorer" &&
      !!window.attachEvent && !!window.ActiveXObject) {
      var ieOffset = ua.indexOf("MSIE");
      browser = SlideBrowser.IE;
      browserVersion = parseFloat(
        ua.substring(ieOffset + 5, ua.indexOf(";", ieOffset)));

      var docMode = document.documentMode;

      if (typeof docMode !== "undefined") {
        browserVersion = docMode;
      }
    } else if (app === "Netscape" && !!window.addEventListener) {
      var ffOffset = ua.indexOf("Firefox"),
        saOffset = ua.indexOf("Safari"),
        chOffset = ua.indexOf("Chrome");

      if (ffOffset >= 0) {
        browser = SlideBrowser.FIREFOX;
        browserVersion = parseFloat(ua.substring(ffOffset + 8));
      } else if (saOffset >= 0) {
        var slash = ua.substring(0, saOffset).lastIndexOf("/");

        if (chOffset >= 0) {
          browser = SlideBrowser.CHROME;
        } else {
          browser = SlideBrowser.SAFARI;
        }

        browserVersion = parseFloat(ua.substring(slash + 1, saOffset));
      } else if (app === "Opera" && !!window.opera && !!window.attachEvent) {
        browser = SlideBrowser.OPERA;
        browserVersion = parseFloat(ver);
      }

      // Url parameters
      // ignore '?'
      var query = window.location.search.substring(1),
        parts = query.split('&');

      for (var i = 0; i < parts.length; i++) {
        var part = parts[i],
          sep = part.indexOf('=');

        if (sep > 0) {
          urlParams[part.substring(0, sep)] =
            decodeURIComponent(part.substring(sep + 1));
        }
      }

      // Browser behaviors
      // update: chrome 2 no longer has this problem! and now same with IE9!
      badAlphaBrowser = (browser === SlideBrowser.IE && browserVersion < 9) ||
        (browser === SlideBrowser.CHROME && browserVersion < 2);
    }
  })();

  // Private Methods

  // 获取元素的父元素
  function getOffsetParent(elmt, isFixed) {
    if (isFixed && elmt !== document.body) {
      return document.body;
    } else {
      return elmt.offsetParent;
    }
  }

  // Public Methods

  // 获取浏览器类型
  this.getBrowser = function () {
    return browser;
  };

  // 获取浏览器版本号
  this.getBrowserVersion = function () {
    return browserVersion;
  };

  // 根据id获取DOM元素
  this.getElement = function (elmt) {
    if (typeof elmt === "string") {
      elmt = document.getElementById(elmt);
    }

    return elmt;
  };

  // 获取元素相对于DOM页面左上角的绝对位置
  this.getElementPosition = function (elmt) {
    elmt = self.getElement(elmt);

    var isFixed = (self.getElementStyle(elmt).position === "fixed"),
      offsetParent = getOffsetParent(elmt, isFixed),
      result = new SlidePoint();

    while (offsetParent) {
      result.x += elmt.offsetLeft;
      result.y += elmt.offsetTop;

      if (isFixed) {
        result = result.plus(self.getPageScroll());
      }

      elmt = offsetParent;
      isFixed = self.getElementStyle(elmt).position === "fixed";
      offsetParent = getOffsetParent(elmt, isFixed);
    }

    return result;
  };

  // 获取元素尺寸
  this.getElementSize = function (elmt) {
    elmt = self.getElement(elmt);
    return new SlidePoint(elmt.clientWidth, elmt.clientHeight);
  };

  // 获取元素的样式
  this.getElementStyle = function (elmt) {
    elmt = self.getElement(elmt);

    if (elmt.currentStyle) {
      return elmt.currentStyle;
    } else if (window.getComputedStyle) {
      return window.getComputedStyle(elmt, "");
    } else {
      SlideDebug.fail("Unknown element style, no known technique.");
    }
  };

  // 获取时间对象
  this.getEvent = function (evt) {
    return evt ? evt : window.event;
  };

  // 获取鼠标位置
  this.getMousePosition = function (evt) {
    evt = self.getEvent(evt);
    var result = new SlidePoint();

    // technique from: http://www.quirksmode.org/js/events_properties.html
    if (evt.type === "DOMMouseScroll" && browser === SlideBrowser.FIREFOX
      && browserVersion < 3) {
      result.x = evt.screenX;
      result.y = evt.screenY;
    } else if (typeof evt.pageX === "number") {
      result.x = evt.pageX;
      result.y = evt.pageY;
    } else if (typeof evt.clientX === "number") {
      result.x = evt.clientX + document.body.scrollLeft +
        document.documentElement.scrollLeft;
      result.y = evt.clientY + document.body.scrollTop +
        document.documentElement.scrollTop;
    } else {
      SlideDebug.fail("Unknown event mouse position, no known technique.");
    }

    return result;
  };

  // 获取鼠标滚轮方向
  this.getMouseScroll = function (evt) {
    evt = self.getEvent(evt);
    var delta = 0;  // default value

    // technique from: http://blog.paranoidferret.com/index.php/2007/10/31/
    //  javascript-tutorial-the-scroll-wheel/
    if (typeof evt.wheelDelta === "number") {
      delta = evt.wheelDelta;
    } else if (typeof evt.detail === "number") {
      delta = evt.detail * 1;
    } else {
      SlideDebug.fail("Unknown event mouse scroll, no known technique.");
    }

    // normalize value to [-1, 1]
    return delta ? delta / Math.abs(delta) : 0;
  };

  // 获取页面水平垂直方向滚动距离
  this.getPageScroll = function () {
    var result = new SlidePoint(),
      body = document.body || {},
      docElmt = document.documentElement || {};

    // http://www.howtocreate.co.uk/tutorials/javascript/browserwindow
    if (typeof window.pageXOffset === "number") {
      // non-IE browsers
      result.x = window.pageXOffset;
      result.y = window.pageYOffset;
    } else if (body.scrollLeft || body.scrollTop) {
      // W3C spec, IE6+ in quirks mode
      result.x = body.scrollLeft;
      result.y = body.scrollTop;
    } else if (docElmt.scrollLeft || docElmt.scrollTop) {
      // IE6+ in standards mode
      result.x = docElmt.scrollLeft;
      result.y = docElmt.scrollTop;
    } else {
      SlideDebug.fail("Unknown page scroll, no known technique.");
    }

    return result;
  };

  // 获取窗口尺寸
  this.getWindowSize = function () {
    var result = new SlidePoint(),
      body = document.body || {},
      docElmt = document.documentElement || {};

    // http://www.howtocreate.co.uk/tutorials/javascript/browserwindow
    if (typeof window.innerWidth === "number") {
      // non-IE browsers
      result.x = window.innerWidth;
      result.y = window.innerHeight;
    } else if (docElmt.clientWidth || docElmt.clientHeight) {
      // IE6+ in standards mode
      result.x = docElmt.clientWidth;
      result.y = docElmt.clientHeight;
    } else if (body.clientWidth || body.clientHeight) {
      // IE6+ in quirks mode
      result.x = body.clientWidth;
      result.y = body.clientHeight;
    } else {
      SlideDebug.fail("Unknown window size, no known technique.");
    }

    return result;
  };

  // 获取支持图像格式
  this.imageFormatSupported = function (ext) {
    ext = (ext ? ext : "");
    return !!supportedImageFormats[ext.toLowerCase()];
  };

  // 居中元素
  this.makeCenteredNode = function (elmt) {
    elmt = self.getElement(elmt);
    var div = self.makeNeutralElement("div"), html = [];

    html.push('<div style="display:table; height:100%; width:100%;');
    html.push('border:none; margin:0px; padding:0px;'); // neutralizing
    html.push('#position:relative; overflow:hidden; text-align:left;">');
    html.push('<div style="#position:absolute; #top:50%; width:100%; ');
    html.push('border:none; margin:0px; padding:0px;');
    html.push('display:table-cell; vertical-align:middle;">');
    html.push('<div style="#position:relative; #top:-50%; width:100%; ');
    html.push('border:none; margin:0px; padding:0px;');
    html.push('text-align:center;"></div></div></div>');

    div.innerHTML = html.join("");
    div = div.firstChild;

    var innerDiv = div,
      innerDivs = div.getElementsByTagName("div");

    while (innerDivs.length > 0) {
      innerDiv = innerDivs[0];
      innerDivs = innerDiv.getElementsByTagName("div");
    }

    innerDiv.appendChild(elmt);
    return div;
  };

  // 创建一个默认属性的DOM元素
  this.makeNeutralElement = function (tagName) {
    var elmt = document.createElement(tagName);

    // TODO reset neutral element's style in a better way
    elmt.style.margin = "0px";
    elmt.style.border = "none";
    elmt.style.padding = "0px";
    elmt.style.position = "static";
    elmt.style.background = "transparent none";

    return elmt;
  };

  // 创建一个可透明的img
  this.makeTransparentImage = function (src) {
    var elmt = null,
      img = self.makeNeutralElement("img");

    if (browser === SlideBrowser.IE && browserVersion < 7) {
      elmt = self.makeNeutralElement("span");
      elmt.style.display = "inline-block";

      // to size span correctly, load image and get natural size,
      // but don't override any user-set CSS values
      img.onload = function() {
        elmt.style.width = elmt.style.width || img.width + "px";
        elmt.style.height = elmt.style.height || img.height + "px";

        img.onload = null;
        img = null;     // to prevent memory leaks in IE
      };

      img.src = src;
      elmt.style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(" +
        "src='" + src + "', sizingMethod='scale')";
    } else {
      elmt = img;
      elmt.src = src;
    }

    return elmt;
  };

  // 设置元素的透明度
  this.setElementOpacity = function (elmt, opacity, usesAlpha) {
    elmt = self.getElement(elmt);

    if (usesAlpha && badAlphaBrowser) {
      // images with alpha channels won't fade well, so round
      opacity = Math.round(opacity);
    }

    // for CSS opacity browsers, remove opacity value if it's unnecessary
    if (opacity < 1) {
      elmt.style.opacity = opacity;
    } else {
      elmt.style.opacity = "";
    }

    var prevFilter = elmt.style.filter || "";
    elmt.style.filter = prevFilter.replace(/[\s]*alpha\(.*?\)[\s]*/g, "");

    if (opacity > 1) {
      return;
    }

    var ieOpacity = Math.round(100 * opacity),
      ieFilter = " alpha(opacity=" + ieOpacity + ") ";

    elmt.style.filter += ieFilter;
  };

  // 给指定DOM元素添加事件响应
  this.addEvent = function (elmt, evtName, handler, useCapture) {
    elmt = self.getElement(elmt);

    // technique from: http://blog.paranoidferret.com/index.php/2007/08/10/
    //  javascript-working-with-events/
    if (elmt.addEventListener) {
      if (evtName === "mousewheel") {
        elmt.addEventListener("DOMMouseScroll", handler, useCapture);
      }

      elmt.addEventListener(evtName, handler, useCapture);
    } else if (elmt.attachEvent) {
      elmt.attachEvent("on" + evtName, handler);

      if (useCapture && elmt.setCapture) {
        elmt.setCapture();
      }
    } else {
      SlideDebug.fail("Unable to attach event handler, no known technique.");
    }
  };

  // 移除指定DOM元素的时间响应
  this.removeEvent = function (elmt, evtName, handler, useCapture) {
    elmt = self.getElement(elmt);

    if (elmt.removeEventListener) {
      if (evtName === "mousewheel") {
        elmt.removeEventListener("DOMMouseScroll", handler, useCapture);
      }

      elmt.removeEventListener(evtName, handler, useCapture);
    } else if (elmt.detachEvent) {
      elmt.detachEvent("on" + evtName, handler);

      if (useCapture && elmt.releaseCapture) {
        elmt.releaseCapture();
      }
    } else {
      SlideDebug.fail("Unable to detach event handler, no known technique.");
    }
  };

  // 阻止浏览器默认事件
  this.cancelEvent = function (evt) {
    evt = self.getEvent(evt);

    if (evt.preventDefault) {
      evt.preventDefault();  // W3C for preventing default
    }

    evt.cancel = true;       // legacy for preventing default
    evt.returnValue = false; // IE for preventing default
  };

  // 阻止元素的事件冒泡
  this.stopEvent = function (evt) {
    evt = self.getEvent(evt);

    if (evt.stopPropagation) {
      evt.stopPropagation();  // W3C for stopping propagation
    }

    evt.cancelBubble = true;  // IE for stopping propagation
  };

  // 创建一个回调函数
  this.createCallback = function (object, method) {
    var initialArgs = [];  // create callback args

    for (var i = 2; i < arguments.length; i++) {
      initialArgs.push(arguments[i]);
    }

    return function () {
      var args = initialArgs.concat([]);

      for (var i = 0; i < arguments.length; i++) {
        args.push(arguments[i]);
      }

      return method.apply(object, args);
    };
  };

  // 根据指定的key获取url中对应的参数值
  this.getUrlParameter = function (key) {
    var value = urlParams[key];
    return value ? value : null;
  };

  // 获取按钮图片地址
  this.iconUrl = function (name, state, ext) {
    ext = ext ? ext : "png";
    return [SlideConfig.imagePath, name, "_", state, ".", ext].join("");
  };

  this.cursorUrl = function (name) {
    return [SlideConfig.imagePath, name, ".cur"].join("");
  };

  // 设置鼠标光标
  this.setMouseCursor = function (elmt, url) {
    elmt = self.getElement(elmt);
    elmt.style.cursor = "url('" + url + "'), auto";
  };

  // 删除鼠标光标回复默认
  this.removeMouseCursor = function (elmt) {
    elmt = self.getElement(elmt);
    elmt.style.cursor = "default";
  };

  // 创建一个ajax请求
  this.makeAjaxRequest = function(url, callback) {
    var req = null,
      async = typeof(callback) == "function";

    if (async) {
      var actual = callback;

      callback = function() {
        window.setTimeout(self.createCallback(null, actual, req), 1);
      };
    }

    if (window.ActiveXObject) {
      for (var i = 0; i < arrActiveX.length; i++) {
        try {
          req = new ActiveXObject(arrActiveX[i]);
          break;
        } catch (err) {
          continue;
        }
      }
    } else if (window.XMLHttpRequest) {
      req = new XMLHttpRequest();
    }

    if (!req) {
      SlideDebug.fail("Browser doesn't support XMLHttpRequest.");
    }

    // Proxy support
    if (SlideConfig.proxyUrl) {
      url = SlideConfig.proxyUrl + url;
    }

    if (async) {
      req.onreadystatechange = function() {
        if (req.readyState === 4) {
          // prevent memory leaks by breaking circular reference now
          req.onreadystatechange = new Function();
          callback();
        }
      };
    }

    try {
      req.open("GET", url, async);
      req.send(null);
    } catch (err) {
      SlideDebug.log(err.name + " while making AJAX request: " + err.message);

      req.onreadystatechange = null;
      req = null;

      if (async) {
        callback();
      }
    }

    return async ? null : req;
  };

  // 格式化xml
  this.parseXml = function(string) {
    var xmlDoc = null;

    if (window.ActiveXObject) {
      try {
        xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
        xmlDoc.async = false;
        xmlDoc.loadXML(string);
      } catch (err) {
        SlideDebug.log(err.name + " while parsing XML (ActiveX): " + err.message);
      }
    } else if (window.DOMParser) {
      try {
        var parser = new DOMParser();
        xmlDoc = parser.parseFromString(string, "text/xml");
      } catch (err) {
        SlideDebug.log(err.name + " while parsing XML (DOMParser): " + err.message);
      }
    } else {
      SlideDebug.fail("Browser doesn't support XML DOM.");
    }

    return xmlDoc;
  };
};

// Seadragon.Utils is a static class, so make it singleton instance
SlideUtils = Slide.Utils = new SlideUtils();



/**
 * Pathology - 1.0.0
 * @email v
 * @author 
 */

var SlideExtend = Slide.Extend;

(function () {
    // Static
    var class2type = {},
    // toString()方法返回一个字符串代表对象。
        toString = class2type.toString,
    // 返回一个布尔值，指出一个对象是否具有指定名称的属性
        hasOwn = class2type.hasOwnProperty,
        isArray = Array.isArray;

    function type(obj) {
        if (obj == null) {
            return obj + "";
        }

        // Support: Android < 4.0, iOS < 6 (functionish RegExp)
        return typeof obj === "object" || typeof obj === "function" ?
        class2type[toString.call(obj)] || "object" :
            typeof obj;
    }

    function isWindow(obj) {
        return obj != null && obj === obj.window;
    }

    function isFunction(obj) {
        return type(obj) === "function";
    }

    function isPlainObject(obj) {
        // Not plain objects:
        // - Any object or value whose internal [[Class]] property is not "[object Object]"
        // - DOM nodes
        // - window
        if (type(obj) !== "object" || obj.nodeType || isWindow(obj)) {
            return false;
        }

        if (obj.constructor &&
            !hasOwn.call(obj.constructor.prototype, "isPrototypeOf")) {
            return false;
        }

        // If the function hasn't returned already, we're confident that
        // |obj| is a plain object, created by {} or constructed with new Object
        return true;
    }

    /**
     * Taken from jQuery 2.1.1
     * @function extend
     * @memberof OpenSeadragon
     * @see {@link http://www.jquery.com/ jQuery}
     */
    SlideExtend = Slide.Extend = function () {
        var options, name, src, copy, copyIsArray, clone,
            target = arguments[0] || {},
            index = 1,
            length = arguments.length,
            deep = false;

        // Handle a deep copy situation
        if (typeof target === "boolean") {
            deep = target;

            // skip the boolean and the target
            target = arguments[index] || {};
            index++;
        }

        // Handle case when target is a string or something (possible in deep copy)
        if (typeof target !== "object" && !isFunction(target)) {
            target = {};
        }

        // extend jQuery itself if only one argument is passed
        if (index === length) {
            target = this;
            index--;
        }

        for (; index < length; index++) {
            // Only deal with non-null/undefined values
            if ((options = arguments[index]) != null) {
                // Extend the base object
                for (name in options) {
                    src = target[name];
                    copy = options[name];

                    // Prevent never-ending loop
                    if (target === copy) {
                        continue;
                    }

                    // Recurse if we're merging plain objects or arrays
                    if (deep && copy && (isPlainObject(copy) || (copyIsArray = isArray(copy)))) {
                        if (copyIsArray) {
                            copyIsArray = false;
                            clone = src && isArray(src) ? src : [];
                        } else {
                            clone = src && isPlainObject(src) ? src : {};
                        }

                        // Never move original objects, clone them
                        target[name] = SlideExtend(deep, clone, copy);

                        // Don't bring in undefined values
                    } else if (copy !== undefined) {
                        target[name] = copy;
                    }
                }
            }
        }

        // Return the modified object
        return target;
    };
})();
/**
 * Pathology - 1.0.0
 * @email v
 * @author 
 */

var SlideButton = Slide.Button;

(function () {
  // Enumerations
  var ButtonState = {
    NORMAL: 0, // normal
    FOCUS: 1,  // focus
    HOVER: 2,  // hover
    DOWN: 3,   // down
    HOLD: 4    // hold
  };

  // Class Button
  SlideButton = Slide.Button = function (options) {
    SlideExtend(true, this, {
      canHold: false,
      tooltip: null,
      srcNormal: null,
      srcFocus: null,
      srcHover: null,
      srcDown: null,
      srcHold: null,

      onPress: null,
      onRelease: null,
      onClick: null,
      onEnter: null,
      onExit: null
    }, options);

    var self = this,

      isHold = false,
      imgNormal = SlideUtils.makeTransparentImage(self.srcNormal),
      imgFocus = SlideUtils.makeTransparentImage(self.srcFocus),
      imgHover = SlideUtils.makeTransparentImage(self.srcHover),
      imgDown = SlideUtils.makeTransparentImage(self.srcDown),
      imgHold = self.canHold ? SlideUtils.makeTransparentImage(self.srcHold) :
        SlideUtils.makeTransparentImage(self.srcDown),

      button = SlideUtils.makeNeutralElement("span"),
      tracker = new SlideMouseTracker(button),
      currentState = ButtonState.FOCUS,

      // begin fading immediately
      fadeDelay = 0,
      // fade over a period of 2 seconds
      fadeLength = 2000,

      fadeBeginTime = null,
      shouldFade = false;

    // Properties
    this.elmt = button;

    // Constructor
    (function () {
      button.title = self.tooltip;
      button.style.position = "relative";
      button.style.display = "inline-block";

      button.appendChild(imgNormal);
      button.appendChild(imgFocus);
      button.appendChild(imgHover);
      button.appendChild(imgDown);
      button.appendChild(imgHold);

      var styleGroup = imgFocus.style,
        styleHover = imgHover.style,
        styleDown = imgDown.style,
        styleHold = imgHold.style;

      // DON'T position imgNormal absolutely -- let it be inline so it fills up the div,
      // sizing the div appropriately rest and group are always visible
      styleGroup.position = styleHover.position = "absolute";
      styleDown.position = styleHold.position = "absolute";
      styleGroup.top = styleHover.top = "0px";
      styleDown.top = styleHold.top = "0px";
      styleGroup.left = styleHover.left = "0px";
      styleDown.left = styleHold.left = "0px";
      styleHover.visibility = styleDown.visibility = styleHold.visibility = "hidden";

      // FF2 is very buggy with inline-block.
      if (SlideUtils.getBrowser() === SlideBrowser.FIREFOX && SlideUtils.getBrowserVersion() < 3) {
        styleGroup.top = styleHover.top = styleDown.top = styleHold.top = "";
      }

      tracker.pressHandler = pressHandler;
      tracker.releaseHandler = releaseHandler;
      tracker.clickHandler = clickHandler;
      tracker.enterHandler = enterHandler;
      tracker.exitHandler = exitHandler;

      tracker.setTracking(true);
      outTo(ButtonState.NORMAL);
    })();

    // Private methods
    // State

    // 鼠标脱出当前状态,进入state
    function outTo(state) {
      // 当前状态为 HOLD, 新状态为 <= HOLD 时
      if (state <= ButtonState.DOWN && currentState === ButtonState.HOLD) {
        imgHold.style.visibility = "hidden";
        currentState = ButtonState.DOWN;
      }

      // 当前状态为 down, 新状态为 <= down 时
      if (state <= ButtonState.HOVER && currentState === ButtonState.DOWN) {
        imgDown.style.visibility = "hidden";
        currentState = ButtonState.HOVER;
      }

      // 当前状态为 hover, 新状态为小于 hover 时
      if (state <= ButtonState.FOCUS && currentState === ButtonState.HOVER) {
        imgHover.style.visibility = "hidden";
        currentState = ButtonState.FOCUS;
      }

      // 当前状态为 group, 新状态为小于 group 时
      if (state <= ButtonState.NORMAL && currentState === ButtonState.FOCUS) {
        beginFading();
        currentState = ButtonState.NORMAL;
      }
    }

    // 鼠标进入 state
    function inTo(state) {
      // 当前状态为 NORMAL, 新状态为 >= NORMAL 时
      if (state >= ButtonState.FOCUS && currentState === ButtonState.NORMAL) {
        stopFading();
        currentState = ButtonState.FOCUS;
      }

      // 当前状态为 FOCUS, 新状态为 >= FOCUS 时
      if (state >= ButtonState.HOVER && currentState === ButtonState.FOCUS) {
        imgHover.style.visibility = "";
        currentState = ButtonState.HOVER;
      }

      // 当前状态为 HOVER, 新状态为 >= HOVER 时
      if (state >= ButtonState.DOWN && currentState === ButtonState.HOVER) {
        imgDown.style.visibility = "";
        currentState = ButtonState.DOWN;
      }

      // 当前状态为 HOVER, 新状态为 >= HOVER 时
      if (state >= ButtonState.HOLD && currentState === ButtonState.DOWN) {
        imgHold.style.visibility = "";
        currentState = ButtonState.HOLD;
      }
    }

    // Fading

    // 开始 imgFocus 渐现
    function beginFading() {
      shouldFade = true;
      fadeBeginTime = new Date().getTime() + fadeDelay;
      window.setTimeout(scheduleFade, fadeDelay);
    }

    // 停止 imgFocus 渐现, 并设置按钮的 imgFocus 为显示
    function stopFading() {
      shouldFade = false;
      SlideUtils.setElementOpacity(imgFocus, 1.0, true);
    }

    // 更新渐现调度
    function scheduleFade() {
      window.setTimeout(updateFade, 20);
    }

    // 更新渐现
    function updateFade() {
      if (shouldFade) {
        var currentTime = new Date().getTime(),
          deltaTime = currentTime - fadeBeginTime,
          opacity = 1.0 - deltaTime / fadeLength;

        opacity = Math.min(1.0, opacity);
        opacity = Math.max(0.0, opacity);

        SlideUtils.setElementOpacity(imgFocus, opacity, true);

        // 进入下次更新渐现
        if (opacity > 0) {
          scheduleFade();
        }
      }
    }

    // Tracker

    // 鼠标按下事件响应
    function pressHandler(/*tracker, position*/) {
      if (self.canHold) {
        isHold = !isHold;
      }

      inTo(ButtonState.DOWN);

      if (self.onPress) {
        self.onPress();
      }
    }

    // 鼠标抬起事件响应
    function releaseHandler(tracker, position, insideElmtPress, insideElmtRelease) {
      if (insideElmtPress && insideElmtRelease) {
        outTo(ButtonState.HOVER);

        if (self.onRelease) {
          self.onRelease();
        }
      } else if (insideElmtPress) {
        outTo(ButtonState.FOCUS);
      } else {
        // pressed elsewhere, but released on it. if we ignored the
        // enter event because a button was down, activate hover now
        inTo(ButtonState.HOVER);
      }
    }

    // 鼠标点击事件响应
    function clickHandler(tracker, position, quick, shift) {
      if (self.onClick && quick) {
        self.onClick();
      }
    }

    // 鼠标进入事件响应
    function enterHandler(tracker, position, buttonDownElmt, buttonDownAny) {
      if (buttonDownElmt) {
        inTo(ButtonState.DOWN);

        if (self.onEnter) {
          self.onEnter();
        }
      } else if (buttonDownAny) {
        inTo(ButtonState.HOVER);
      }
    }

    // 鼠标移出事件响应
    function exitHandler(tracker, position, buttonDownElmt, buttonDownAny) {
      outTo(ButtonState.FOCUS);

      if (self.onExit && buttonDownElmt) {
        self.onExit();
      }
    }

    // Public methods

    // 提示进入按钮(函数名不同)
    this.notifyEnter = function () {
      inTo(ButtonState.FOCUS);
    };

    // 提示移出按钮(函数名不同)
    this.notifyExit = function () {
      if (isHold) {
        inTo(ButtonState.HOLD);
      } else {
        outTo(ButtonState.NORMAL);
      }
    };

    // 还原按钮原始状态
    this.resetState = function () {
      isHold = false;
      self.notifyExit();
    };

    // 设置按钮的保持状态
    this.setHoldState = function () {
      isHold = true;
      self.notifyExit();
    };
  };
})();

/**
 * Pathology - 1.0.0
 * @email v
 * @author 
 */

var SlideButtonGroup = Slide.ButtonGroup;

(function () {
  SlideButtonGroup = Slide.ButtonGroup = function (buttons) {
    // Fields
    var group = SlideUtils.makeNeutralElement("span"),
      buttons = buttons.concat([]),  // copy
      tracker = new SlideMouseTracker(group);

    // Properties
    this.elmt = group;

    // Constructor
    (function () {
      group.style.display = "inline-block";

      for (var i = 0; i < buttons.length; i++) {
        group.appendChild(buttons[i].elmt);
      }

      tracker.enterHandler = enterHandler;
      tracker.exitHandler = exitHandler;
      tracker.releaseHandler = releaseHandler;
      tracker.setTracking(true);
    })();

    // Private methods
    // Tracker

    // 鼠标进入按钮组事件响应
    function enterHandler(/*tracker, position, buttonDownElmt, buttonDownAny*/) {
      for (var i = 0; i < buttons.length; i++) {
        buttons[i].notifyEnter();
      }
    }

    // 鼠标移出按钮组事件响应
    function exitHandler(tracker, position, buttonDownElmt, buttonDownAny) {
      if (!buttonDownElmt) {
        for (var i = 0; i < buttons.length; i++) {
          buttons[i].notifyExit();
        }
      }
    }

    // 鼠标抬起按钮组事件响应
    function releaseHandler(tracker, position, insideElmtPress, insideElmtRelease) {
      if (!insideElmtRelease) {
        for (var i = 0; i < buttons.length; i++) {
          buttons[i].notifyExit();
        }
      }
    }

    // Public methods

    // 模拟鼠标进入事件
    this.emulateEnter = function () {
      enterHandler();
    };

    // 模拟鼠标移出事件
    this.emulateExit = function () {
      exitHandler();
    };
  };
})();

/**
 * Pathology - 1.0.0
 * @email v
 * @author 
 */

var SlideConfig = Slide.Config;

(function () {
  if (SlideConfig) {
    return;
  }

  SlideConfig =Slide.Config = {
    // debug
    debugMode: true,

    // utils
    proxyUrl: null,
    imagePath: "/libs/slide/img/coreImg/",

    //imagePath: "./img/coreImg/",

    // mouse tracker
    clickTimeThreshold: 200,
    clickDistThreshold: 5,

    // spring
    animationTime: 1.5,
    springStiffness: 5.0,

    // image loader
    imageLoaderLimit: 2,

    // viewer
    logarithmicZoom: true,
    constrainDuringPan: true,
    drawSwitchPerTime: 40,
    zoomPerClick: 2.0,
    zoomPerScroll: Math.pow(2, 1/3),
    autoHideControls: true,

    // viewport
    minZoomDimension: null,
    minZoomImageRatio: 0.8,
    maxZoomPixelRatio: 2,
    visibilityRatio: 0.8,

    // drawer
    wrapHorizontal: false,
    wrapVertical: false,
    blendTime: 0.5,

    immediateRender :false,
    //singleDrawer
    alwaysBlend: false,
    wrapOverlays: false,
    transformOverlays: false,
    showNavBtnGroup: true,

    // ui
    zoomPerSecond: 2.0
  };
})();

/**
 * Pathology - 1.0.0
 * @email v
 * @author 
 */

var SlideControlAnchor = Slide.ControlAnchor,
  SlideControl = Slide.Control;

(function () {
  // Controls Anchor
  SlideControlAnchor = Slide.ControlAnchor = {
    NONE: 0,
    TOP_LEFT: 1,
    TOP_RIGHT: 2,
    BOTTOM_RIGHT: 3,
    BOTTOM_LEFT: 4
  };

  // Class Control
  SlideControl = Slide.Control= function (viewer, elmt, anchor, container) {
    // Fields
    var wrapper = SlideUtils.makeNeutralElement("span");

    // Properties
    this.viewer = viewer;
    this.elmt = elmt;
    this.anchor = anchor;
    this.container = container;
    this.wrapper = wrapper;

    // Constructor
    (function () {
      wrapper.style.display = "inline-block";
      wrapper.appendChild(elmt);

      if (anchor === SlideControlAnchor.NONE) {
        wrapper.style.width = wrapper.style.height = "100%";
      }

      addToAnchor(wrapper, anchor, container);
    })();

    // Private methods
    /**
     * Adds the given element to the given container based on the given anchor,
     * such that all new elements anchored to a right edge are shown to the left
     * of existing elements anchored to the same edge.
     */
    function addToAnchor(elmt, anchor, container) {
      if (anchor === SlideControlAnchor.TOP_RIGHT ||
        anchor === SlideControlAnchor.BOTTOM_RIGHT) {
        container.insertBefore(elmt, container.firstChild);
      } else {
        container.appendChild(elmt);
      }
    }
  };

  var prototype = SlideControl.prototype;

  // 类 Control 成员函数,销毁控件
  prototype.destroy = function () {
    this.wrapper.removeChild(this.elmt);
    this.container.removeChild(this.wrapper);
  };

  // 类 Control 成员函数,获取控件是否显示
  prototype.isVisible = function () {
    // see note in setVisible() below about using "display: none"
    return this.wrapper.style.display !== "none";
  };

  // 类 Control 成员函数,设置控件的显示隐藏
  prototype.setVisible = function (visible) {
    // using "display: none" instead of "visibility: hidden" so that mouse
    // events are no longer blocked by this invisible control.
    this.wrapper.style.display = visible ? "inline-block" : "none";
  };

  // 类 Control 成员函数,设置控件的透明度
  prototype.setOpacity = function (opacity) {
    // like with setVisible() above, we really should be working with the
    // wrapper element and not the passed in element directly, so that we
    // don't conflict with the developer's own opacity settings. but this
    // doesn't work in IE always, so for our controls, use a hack for now...
    if (this.elmt[this.SIGNAL] && SlideUtils.getBrowser() === SlideBrowser.IE) {
      SlideUtils.setElementOpacity(this.elmt, opacity, true);
    } else {
      SlideUtils.setElementOpacity(this.wrapper, opacity, true);
    }
  };
})();

/**
 * Pathology - 1.0.0
 * @email v
 * @author 
 */

var SlideDebug = Slide.Debug = function () {
  this.log = function (msg, important) {
    var console = window.console || {},
      debug = SlideConfig.debugMode;

    if (debug && console.log) {
      //console.log(msg);
    } else if (debug && important) {
      alert(msg);
    }
  };

  this.error = function (msg, err) {
    var console = window.console || {},
      debug = SlideConfig.debugMode;

    if (debug && console.error) {
      //console.error(msg);
    } else if (debug) {
      alert(msg);
    }

    if (debug) {
      // since we're debugging, fail fast by crashing
      throw err || new Error(msg);
    }
  };

  this.fail = function (msg) {
    alert(SlideStrings.getString("Errors.Failure"));
    throw new Error(msg);
  };
};

SlideDebug = new SlideDebug();

/**
 * Pathology - 1.0.0
 * @email v
 * @author 
 */

var SlideSource = Slide.Source;

(function () {
  SlideSource = Slide.Source = function (width, height, number, tileSize, tileOverlap, minLevel, maxLevel) {
    // Fields
    var self = this,
      normHeight = height / width;

    // Properties
    this.width = width;
    this.height = height;
    this.aspectRatio = width / height;
    this.dimensions = new SlidePoint(width, height);
    this.number = number;

    this.minLevel = typeof minLevel === "number" ? minLevel : 0;
    this.maxLevel = typeof maxLevel === "number" ? maxLevel :
      Math.ceil(Math.log(Math.max(width, height)) / Math.log(2));

    this.tileSize = tileSize ? tileSize : 0;
    this.tileOverlap = tileOverlap ? tileOverlap : 0;
    // Public Methods

    // 获取指定层级的缩放倍数
    this.getLevelScale = function (lvl) {
      // equivalent to Math.pow(0.5, maxLevel - lvl);
      return 1 / (1 << (self.maxLevel - lvl));
    };

    // 获取指定层级的图像的宽度
    this.getPixelRatio = function (lvl) {
      var imgSizeScaled = self.dimensions.times(self.getLevelScale(lvl)),
        rx = 1.0 / imgSizeScaled.x,
        ry = 1.0 / imgSizeScaled.y;

      return new Point(rx, ry);
    };

    this.getSlideBounds = function () {};

    // 获取图像的地址url
    this.getSlideUrl = function (index) {
      // TODO: Here add your get tiles url function by overwrite this function
      throw new Error("Method not implemented.");
    };

    this.slideExists = function (index) {
      if (Math.abs(index % self.number) <= self.number) {
        return true;
      }


      //supplemental
      this.getNumTiles = function(level) {
        var scale = self.getLevelScale(level);
        var x = Math.ceil(scale * width / self.tileSize);
        var y = Math.ceil(scale * height / self.tileSize);

        return new SlidePoint(x, y);
      };

      this.getTileAtPoint = function(level, point) {
        // support wrapping by taking less-than-full tiles into account!
        // this is necessary in order to properly wrap low-res tiles.
        var scaledSize = self.dimensions.times(self.getLevelScale(level));
        var pixel = point.times(scaledSize.x);
        var tx, ty;

        // optimize for the non-wrapping case, but support wrapping
        if (point.x >= 0.0 && point.x <= 1.0) {
          tx = Math.floor(pixel.x / self.tileSize);
        } else {
          tx = Math.ceil(scaledSize.x / self.tileSize) * Math.floor(pixel.x / scaledSize.x) +
              Math.floor(((scaledSize.x + (pixel.x % scaledSize.x)) % scaledSize.x) / self.tileSize);
        }

        // same thing vertically
        if (point.y >= 0.0 && point.y <= normHeight) {
          ty = Math.floor(pixel.y / self.tileSize);
        } else {
          ty = Math.ceil(scaledSize.y / self.tileSize) * Math.floor(pixel.y / scaledSize.y) +
              Math.floor(((scaledSize.y + (pixel.y % scaledSize.y)) % scaledSize.y) / self.tileSize);
        }

        return new SlidePoint(tx, ty);
      };

      this.getTileBounds = function(level, x, y) {
        // work in scaled pixels for this level
        var dimensionsScaled = self.dimensions.times(self.getLevelScale(level));

        // find position, adjust for no overlap data on top and left edges
        var px = (x === 0) ? 0 : self.tileSize * x - self.tileOverlap;
        var py = (y === 0) ? 0 : self.tileSize * y - self.tileOverlap;

        // find size, adjust for no overlap data on top and left edges
        var sx = self.tileSize + (x === 0 ? 1 : 2) * self.tileOverlap;
        var sy = self.tileSize + (y === 0 ? 1 : 2) * self.tileOverlap;

        // adjust size for single-tile levels where the image size is smaller
        // than the regular tile size, and for tiles on the bottom and right
        // edges that would exceed the image bounds
        sx = Math.min(sx, dimensionsScaled.x - px);
        sy = Math.min(sy, dimensionsScaled.y - py);

        // finally, normalize...
        // note that isotropic coordinates ==> only dividing by scaled x!
        var scale = 1.0 / dimensionsScaled.x;
        return new SlideRect(px * scale, py * scale, sx * scale, sy * scale);
      };

      this.getTileUrl = function(level, x, y) {
        throw new Error("Method not implemented.");
      };


      this.tileExists = function(level, x, y) {
        var numTiles = self.getNumTiles(level);
        return level >= self.minLevel && level <= self.maxLevel &&
            x >= 0 && y >= 0 && x < numTiles.x && y < numTiles.y;
      };



      return false;
    };

    this.getNumTiles = function(level) {
      var scale = self.getLevelScale(level);
      var x = Math.ceil(scale * width / self.tileSize);
      var y = Math.ceil(scale * height / self.tileSize);

      return new SlidePoint(x, y);
    };

    this.getTileAtPoint = function(level, point) {
      // support wrapping by taking less-than-full tiles into account!
      // this is necessary in order to properly wrap low-res tiles.
      var scaledSize = self.dimensions.times(self.getLevelScale(level));
      var pixel = point.times(scaledSize.x);
      var tx, ty;

      // optimize for the non-wrapping case, but support wrapping
      if (point.x >= 0.0 && point.x <= 1.0) {
        tx = Math.floor(pixel.x / self.tileSize);
      } else {
        tx = Math.ceil(scaledSize.x / self.tileSize) * Math.floor(pixel.x / scaledSize.x) +
            Math.floor(((scaledSize.x + (pixel.x % scaledSize.x)) % scaledSize.x) / self.tileSize);
      }

      // same thing vertically
      if (point.y >= 0.0 && point.y <= normHeight) {
        ty = Math.floor(pixel.y / self.tileSize);
      } else {
        ty = Math.ceil(scaledSize.y / self.tileSize) * Math.floor(pixel.y / scaledSize.y) +
            Math.floor(((scaledSize.y + (pixel.y % scaledSize.y)) % scaledSize.y) / self.tileSize);
      }

      return new SlidePoint(tx, ty);
    };

    this.getTileBounds = function(level, x, y) {
      // work in scaled pixels for this level
      var dimensionsScaled = self.dimensions.times(self.getLevelScale(level));

      // find position, adjust for no overlap data on top and left edges
      var px = (x === 0) ? 0 : self.tileSize * x - self.tileOverlap;
      var py = (y === 0) ? 0 : self.tileSize * y - self.tileOverlap;

      // find size, adjust for no overlap data on top and left edges
      var sx = self.tileSize + (x === 0 ? 1 : 2) * self.tileOverlap;
      var sy = self.tileSize + (y === 0 ? 1 : 2) * self.tileOverlap;

      // adjust size for single-tile levels where the image size is smaller
      // than the regular tile size, and for tiles on the bottom and right
      // edges that would exceed the image bounds
      sx = Math.min(sx, dimensionsScaled.x - px);
      sy = Math.min(sy, dimensionsScaled.y - py);

      // finally, normalize...
      // note that isotropic coordinates ==> only dividing by scaled x!
      var scale = 1.0 / dimensionsScaled.x;
      return new SlideRect(px * scale, py * scale, sx * scale, sy * scale);
    };

    this.getTileUrl = function(level, x, y) {
      throw new Error("Method not implemented.");
    };

    this.tileExists = function(level, x, y) {
      var numTiles = self.getNumTiles(level);
      return level >= self.minLevel && level <= self.maxLevel &&
          x >= 0 && y >= 0 && x < numTiles.x && y < numTiles.y;
    };
  };
})();

/**
 * Pathology - 1.0.0
 * @email v
 * @author 
 */

var SlideMultiDrawer = Slide.MultiDrawer;

(function () {
  // Constants
  // the max number of images we should keep in memory
  var QUOTA = 100;

  // Method of drawing
  var browser = SlideUtils.getBrowser(),
    browserVer = SlideUtils.getBrowserVersion();

  // check if browser supports <canvas>.
  // update: IE9 returns type "object" instead of "function"...
  var hasCanvas = !!(document.createElement("canvas").getContext),

    // we use this style for a lot of our checks, so caching it here:
    docElmt = document.documentElement || {},
    docElmtStyle = docElmt.style || {},

    // check if browser supports CSS transforms. using this technique:
    // http://www.zachstronaut.com/posts/2009/02/17/
    //  animate-css-transforms-firefox-webkit.html
    // also, the spec says translate values need to include units (e.g. "px"),
    // but webkit chokes on units. we need to check for this bug.
    hasCssTransforms = false,
    cssTransformProperties = ["msTransform", "WebkitTransform", "MozTransform"],
    cssTransformProperty,
    cssTransformNoUnits;

  while (cssTransformProperty = cssTransformProperties.shift()) {
    if (typeof docElmtStyle[cssTransformProperty] !== "undefined") {
      hasCssTransforms = true;
      cssTransformNoUnits = /webkit/i.test(cssTransformProperty);
      break;
    }
  }

  // we'll use a similar technique to check for CSS transitions.
  // TEMP the value for CSS transition-property is the CSS name of the
  // property you want transitioned, e.g. "-webkit-transform", and NOT the
  // JavaScript name, e.g. "WebkitTransform". so for the time being, we're
  // hardcoding this stuff to just webkit instead of general checking.
  var cssTransformPropertyCssName = "-webkit-transform",
    cssTransitionProperty = "WebkitTransition",
    hasCssTransitions = typeof docElmtStyle[cssTransitionProperty] !== "undefined";

  // check if browser is IE, or supports IE's proprietary DirectX filters.
  // specifically, the matrix transform filter is similar to CSS transforms!
  // http://msdn.microsoft.com/en-us/library/ms533014(v=VS.85).aspx
  var IE_MATRIX_FILTER = "progid:DXImageTransform.Microsoft.Matrix",
    IE_MATRIX_FILTER_REGEXP = new RegExp(IE_MATRIX_FILTER + "\\(.*?\\)", 'g');

  // TEMP checking for the presence of the "filters" property isn't really
  // strong feature detection, so added an explicit IE check. that's fine?
  // update: also trying catch this since IE9 throws an error here.
  var hasIeFilters = (function() {
    try {
      return (browser === SlideBrowser.IE) && !!(document.documentElement.filters);
    } catch (e) {
      return false;
    }
  })();

  // in general, <canvas> is great because it's standardized and stable for
  // the functionality we need. plus, firefox, opera and safari 4 all have
  // subpixel precision inside <canvas>. CSS transforms also seem to get us
  // subpixel precision, and more broadly, across firefox, safari 4 and even
  // chrome, but it's less stable so far. both <canvas> and CSS transform
  // have potential to be hardware accelerated, so deciding between the two
  // comes down to subpixel precision and perf based on experimentation.
  // note that IE provides proprietary matrix transforms which also get us
  // subpixel precision!! for fallback, we use regular CSS position/size.
  // UPDATE: IE's matrix transforms are dog-slow, no good unfortunately.
  // but, we may still be able to use them somehow, maybe once per frame on
  // just the canvas and not multiple times per frame on each tile.
  // TODO investigate IE matrix transforms on canvas instead of per tile.
  // TEMP for now, turning off IE matrix transforms altogether.
  // due to no subpixel precision
  var badCanvas = (browser === SlideBrowser.SAFARI && browserVer < 4),
    useCanvas = hasCanvas && !badCanvas,
    useCssTransforms = !useCanvas && hasCssTransforms,
    useIeFilters = false;

  // regardless, in IE, we use <img> tags. unfortunately, in IE, <img> tags
  // use a crappy nearest-neighbor interpolation by default. IE7+ lets us
  // change this via a proprietary CSS property. unfortunately, changing it to
  // bicubic caused tile seams in IE7 -- but not IE8! even IE8 in compat mode
  // has no tile seams. so we need to detect IE8 regardless of mode; we do so
  // via document.documentMode, introduced in IE8 for all modes. finally, in
  // IE7, we'll explicitly say nearest-neighbor, otherwise if the user zooms
  // the page, IE7 would implicitly change it to bicubic, causing tile seams.
  var MS_INTERPOLATION_MODE = (typeof document.documentMode !== "undefined") ?
    "bicubic" : "nearest-neighbor";

  // Class Tiles
  function Tile(index, bounds, exists, url) {
    // Core
    this.index = index;
    this.bounds = bounds; // where this tile fits, in normalized coordinates
    this.exists = exists; // part of sparse image? tile hasn't failed to load?

    // Image
    this.url = url;         // the URL of this tile's image
    this.elmt = null;       // the HTML element for this tile
    this.image = null;      // the Image object for this tile
    this.loaded = false;    // is this tile loaded?
    this.loading = false;   // or is this tile loading?

    // Drawing
    this.style = null;      // alias of this.elmt.style
    this.position = null;   // this tile's position on screen, in pixels
    this.size = null;       // this tile's size on screen, in pixels
    this.blendStart = null; // the start time of this tile's blending
    this.opacity = null;    // the current opacity this tile should be
    this.visibility = null; // the visibility score of this tile

    // Caching
    this.beingDrawn = false;// whether this tile is currently being drawn
    this.lastDrawnTime = 0; // when the tile was last drawn
    this.lastTouchTime = 0; // the time that tile was last touched
  }

  // 转换为字符串
  Tile.prototype.toString = function () {
    return this.index;
  };

  // 没有载入或者载入删除此图像
  Tile.prototype.unload = function () {
    if (this.elmt && this.elmt.parentNode) {
      this.elmt.parentNode.removeChild(this.elmt);
    }

    this.elmt = null;
    this.image = null;
    this.loaded = false;
    this.loading = false;
  };

  // 在canvas中绘制
  Tile.prototype.drawCanvas = function (context) {
    if (!this.loaded) {
      SlideDebug.error("图像: " + this.toString() + "还没有加载就开始绘制!");
      return;
    }

    var size = this.size,
      position = this.position;

    context.globalAlpha = this.opacity;
    context.drawImage(this.image, position.x, position.y, size.x, size.y);
  };

  Tile.prototype.drawHTML = function (container) {
    if (!this.loaded) {
      SlideDebug.error("图像: " + this.toString() + "还没有加载就开始绘制!");
      return;
    }

    // initialize if first time
    if (!this.elmt) {
      this.elmt = SlideUtils.makeNeutralElement("img");
      this.elmt.src = this.url;
      this.style = this.elmt.style;
      this.style.position = "absolute";
      // IE only property. see note above for explanation.
      this.style.msInterpolationMode = MS_INTERPOLATION_MODE;

      if (useCssTransforms) {
        this.style[cssTransformProperty + "Origin"] = "0px 0px";
      }
    }

    var elmt = this.elmt,
      image = this.image,
      style = this.style,
      position = this.position,
      size = this.size;

    if (elmt.parentNode !== container) {
      container.appendChild(elmt);
    }

    if (useCssTransforms) {
      // warning! sometimes chrome doesn't have this new <img> element
      // loaded yet, even though it's a clone of another <img> element
      // that is loaded. so we use the width and height properties of the
      // original <img> (the image variable instead of this one (elmt).
      style[cssTransformProperty] = ['matrix(',
        (size.x / image.width).toFixed(8), ',0,0,',
        (size.y / image.height).toFixed(8), ',',
        position.x.toFixed(8), cssTransformNoUnits ? ',' : 'px,',
        position.y.toFixed(8), cssTransformNoUnits ? ')' : 'px)'].join('');
    } else if (useIeFilters) {
      var containerWidth = container.clientWidth,
        containerHeight = container.clientHeight;

      style.width = containerWidth + "px";
      style.height = containerHeight + "px";
      style.filter = ['progid:DXImageTransform.Microsoft.Matrix(',
        'M11=', (size.x / containerWidth).toFixed(8),
        ',M22=', (size.y / containerHeight).toFixed(8),
        ',Dx=', position.x.toFixed(8),
        ',Dy=', position.y.toFixed(8), ')'].join('');
    } else {
      position = position.apply(Math.floor);
      size = size.apply(Math.ceil);

      style.left = position.x + "px";
      style.top = position.y + "px";
      style.width = size.x + "px";
      style.height = size.y + "px";

      // TEMP because we know exactly whether we're using IE filters or not,
      // short-circuitting this utils call to optimize the logic.
      // UPDATE: we're no longer using IE filters, so reverting this logic.
      SlideUtils.setElementOpacity(elmt, this.opacity);
    }
  };

  SlideMultiDrawer = Slide.MultiDrawer =  function (source, viewport, elmt) {
    // Fields
    var container = SlideUtils.getElement(elmt),
      canvas = SlideUtils.makeNeutralElement(useCanvas ? "canvas" : "div"),
      context = useCanvas ? canvas.getContext("2d") : null,

      profiler = new SlideProfiler(),
      imgLoader = new SlideImgLoader(),

      normHeight = source.height / source.width,

      coverage = {},    // 3d dictionary [level][x][y] --> Boolean
      slideMatrix = {}, // 3d dictionary [index] --> Slide
      slideLoaded = [], // unordered list of Slides with loaded images

      lastDrawn = null, // unordered list of Tiles drawn last frame
      lastFrameTime = 0,// the timestamp of the previous frame
      lastResetTime = 0,
      midUpdate = false,
      updateAgain = true;

    // Properties
    this.elmt = container;
    this.profiler = profiler;

    // Constructor
    (function () {
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.position = "absolute";
      canvas.style.textAlign = "left";  // explicit left-align

      container.appendChild(canvas);
    })();

    // Private Methods
    // Core

    function updateActual() {
      // assume we won't need to update again after this update.
      // we'll set this if we find a reason to update again.
      updateAgain = false;

      // make local references to variables & functions referenced in
      // loops in order to improve perf
      var _canvas = canvas,
        _context = context,
        _useCanvas = useCanvas,
        _lastDrawn = lastDrawn;

      if (_lastDrawn) {
        var slide = _lastDrawn;
        slide.beingDrawn = false;
        _lastDrawn = null;
      }

      // we need the size of the viewport (in pixels) in multiple places
      var viewportSize = viewport.getContainerSize(),
        viewportWidth = viewportSize.x,
        viewportHeight = viewportSize.y;

      // clear canvas, whether in <canvas> mode or HTML mode.
      // this is important as scene may be empty this frame.
      if (_useCanvas) {
        _canvas.width = viewportWidth;
        _canvas.height = viewportHeight;

        // this last line shouldn't be needed. setting the width and
        // height should clear <canvas>, but Firefox doesn't always.
        _context.clearRect(0, 0, viewportWidth, viewportHeight);
      } else {
        _canvas.innerHTML = "";
      }

      // if viewport is off image entirely, don't bother drawing.
      // UPDATE: logic modified to support horizontal/vertical wrapping.
      var viewportBounds = viewport.getBounds(true),
        viewportTL = viewportBounds.getTopLeft(),
        viewportBR = viewportBounds.getBottomRight();

      if (!SlideConfig.wrapHorizontal && (viewportBR.x < 0 || viewportTL.x > 1)) {
        // we're not wrapping horizontally, and viewport is off in x
        return;
      } else if (!SlideConfig.wrapVertical && (viewportBR.y < 0 || viewportTL.y > normHeight)) {
        // we're not wrapping vertically, and viewport is off in y
        return;
      }

      // make local references to functions and
      // variables used in loops to improve perf
      var blendTimeMillis = 1000 * SlideConfig.blendTime;

      // restrain bounds of viewport relative to image.
      // UPDATE: logic modified to support horizontal/vertical wrapping.
      if (!SlideConfig.wrapHorizontal) {
        viewportTL.x = Math.max(viewportTL.x, 0);
        viewportBR.x = Math.min(viewportBR.x, 1);
      }

      if (!SlideConfig.wrapVertical) {
        viewportTL.y = Math.max(viewportTL.y, 0);
        viewportBR.y = Math.min(viewportBR.y, normHeight);
      }

      var best = null,
        currentTime = new Date().getTime(),
        // calculate values for scoring -- this is based on TARGET values
        viewportCenterPoint = viewport.getCenter(),
        viewportCenterPixel = viewport.pixelFromPoint(viewportCenterPoint);

      for (var index = source.number - 1; index >= 0; index--) {
        var slide = getSlide(index, currentTime);

        if (!slide.exists) {
          continue;
        }

        // calculate tile's position and size in pixels
        var boundsTL = slide.bounds.getTopLeft(),
          boundsSize = slide.bounds.getSize(),
          positionC = viewport.pixelFromPoint(boundsTL, true),
          sizeC = viewport.deltaPixelsFromPoints(boundsSize, true);

        // calculate distance from center of viewport -- note
        // that this is based on tile's TARGET position
        var positionT = viewport.pixelFromPoint(boundsTL, false),
          sizeT = viewport.deltaPixelsFromPoints(boundsSize, false),
          tileCenter = positionT.plus(sizeT.divide(2)),
          tileDistance = viewportCenterPixel.distanceTo(tileCenter);

        slide.position = positionC;
        slide.size = sizeC;
        slide.visibility = 1;
        slide.opacity = 1;

        if (slide.loaded) {
          if (!slide.blendStart) {
            slide.blendStart = currentTime;
          }

          var deltaTime = currentTime - slide.blendStart,
            opacity = (blendTimeMillis === 0 ? 1 : Math.min(1, deltaTime / blendTimeMillis));
          slide.opacity = opacity;

          if (viewport.getSlide(true) === index) {
            lastDrawn = slide;
          }

          if (deltaTime < blendTimeMillis) {
            updateAgain = true;
          }
        } else if (slide.loading) {
          // nothing to see here, move on
        } else {
          best = slide;
        }
      }

      if (lastDrawn) {
        if (_useCanvas) {
          lastDrawn.drawCanvas(_context);
        } else {
          lastDrawn.drawHTML(_canvas);
        }

        lastDrawn.beingDrawn = true;
      }

      if (best) {
        loadSlide(best, currentTime);

        updateAgain = true;
      }

      lastFrameTime = currentTime;
    }

    function getSlide(index, time) {
      if (!slideMatrix[index]) {
        var bounds = viewport.getImageBounds(),
          exists = source.slideExists(index),
          url = source.getSlideUrl(index);

        slideMatrix[index] = new Tile(index, bounds, exists, url);
      }

      var slide = slideMatrix[index];
      slide.lastTouchTime = time;
      return slide;
    }

    function loadSlide(slide, time) {
      slide.loading = imgLoader.loadImage(slide.url,
        SlideUtils.createCallback(null, onSlideLoad, slide, time));
    }

    function onSlideLoad(slide, time, image) {
      slide.loading = false;

      if (midUpdate) {
        return;
      } else if (!image) {
        slide.exists = false;
        return;
      } else if (time < lastResetTime) {
        return;
      }

      slide.loaded = true;
      slide.image = image;

      var len = slideLoaded.length;

      if (slideLoaded.length >= QUOTA) {}

      slideLoaded[len] = slide;
      updateAgain = true;
    }


    // Public Methods
    // Core

    this.needsUpdate = function () {
      return updateAgain;
    };

    this.idle = function () {
      // TODO idling function
    };

    // 更新绘制
    this.update = function () {
      profiler.beginUpdate();
      midUpdate = true;
      updateActual();
      midUpdate = false;
      profiler.endUpdate();
    };
  };
})();

/**
 * Pathology - 1.0.0
 * @email v
 * @author 
 */

/**
 * Created by MQ on 2016/10/9.
 */
//  This code is distributed under the included license agreement, also
//  available here: http://go.microsoft.com/fwlink/?LinkId=164943

var SlideSingleDrawer= Slide.SingleDrawer,
    SlideSingleOverlayPlacement;

(function() {

    // Constants

    var QUOTA = 100;    // the max number of images we should keep in memory
    var MIN_PIXEL_RATIO = 0.5;  // the most shrunk a tile should be

    // Method of drawing

    var browser = SlideUtils.getBrowser();
    var browserVer = SlideUtils.getBrowserVersion();
    var userAgent = navigator.userAgent;

    // check if browser supports <canvas>.
    // update: IE9 returns type "object" instead of "function"...
    var hasCanvas = !!(document.createElement("canvas").getContext);

    // we use this style for a lot of our checks, so caching it here:
    var docElmt = document.documentElement || {};
    var docElmtStyle = docElmt.style || {};

    // check if browser supports CSS transforms. using this technique:
    // http://www.zachstronaut.com/posts/2009/02/17/animate-css-transforms-firefox-webkit.html
    // also, the spec says translate values need to include units (e.g. "px"),
    // but webkit chokes on units. we need to check for this bug.
    var hasCssTransforms = false;
    var cssTransformProperties = ["msTransform", "WebkitTransform", "MozTransform"];
    var cssTransformProperty, cssTransformNoUnits;

    while (cssTransformProperty = cssTransformProperties.shift()) {
        if (typeof docElmtStyle[cssTransformProperty] !== "undefined") {
            hasCssTransforms = true;
            cssTransformNoUnits = /webkit/i.test(cssTransformProperty);
            break;
        }
    }

    // we'll use a similar technique to check for CSS transitions.
    // TEMP the value for CSS transition-property is the CSS name of the
    // property you want transitioned, e.g. "-webkit-transform", and NOT the
    // JavaScript name, e.g. "WebkitTransform". so for the time being, we're
    // hardcoding this stuff to just webkit instead of general checking.
    var cssTransformPropertyCssName = "-webkit-transform";
    var cssTransitionProperty = "WebkitTransition";
    var hasCssTransitions =
        typeof docElmtStyle[cssTransitionProperty] !== "undefined";

    // check if browser is IE, or supports IE's proprietary DirectX filters.
    // specifically, the matrix transform filter is similar to CSS transforms!
    // http://msdn.microsoft.com/en-us/library/ms533014(v=VS.85).aspx
    var IE_MATRIX_FILTER = "progid:DXImageTransform.Microsoft.Matrix";
    var IE_MATRIX_FILTER_REGEXP = new RegExp(
        IE_MATRIX_FILTER + "\\(.*?\\)", 'g');

    // TEMP checking for the presence of the "filters" property isn't really
    // strong feature detection, so added an explicit IE check. that's fine?
    // update: also trying catch this since IE9 throws an error here.
    var hasIeFilters = (function() {
        try {
            return (browser == SlideBrowser.IE) &&
                !!(document.documentElement.filters);
        } catch (e) {
            return false;
        }
    })();

    // in general, <canvas> is great because it's standardized and stable for
    // the functionality we need. plus, firefox, opera and safari 4 all have
    // subpixel precision inside <canvas>. CSS transforms also seem to get us
    // subpixel precision, and more broadly, across firefox, safari 4 and even
    // chrome, but it's less stable so far. both <canvas> and CSS transform
    // have potential to be hardware accelerated, so deciding between the two
    // comes down to subpixel precision and perf based on experimentation.
    // note that IE provides proprietary matrix transforms which also get us
    // subpixel precision!! for fallback, we use regular CSS position/size.
    // UPDATE: IE's matrix transforms are dog-slow, no good unfortunately.
    // but, we may still be able to use them somehow, maybe once per frame on
    // just the canvas and not multiple times per frame on each tile.
    // TODO investigate IE matrix transforms on canvas instead of per tile.
    // TEMP for now, turning off IE matrix transforms altogether.
    var badCanvas =     // due to no subpixel precision
        (browser == SlideBrowser.SAFARI && browserVer < 4);// ||
    //(browser == SlideBrowser.CHROME);
    var useCanvas = hasCanvas && !badCanvas;
    var useCssTransforms = !useCanvas && hasCssTransforms;
    var useIeFilters = false;

    // UPDATE: safari 4 on Mac OS X 10.6 (snow leopard) and safari mobile on
    // iPhone OS 3 hardware accelerate CSS transforms when combined with CSS
    // transitions, so use them there over <canvas>!
    // UPDATE: this causes flickers on the iPhone; removing support for now.
    //var acceleratedTransforms =
    //    browser == SlideBrowser.SAFARI && userAgent.match(/Mac OS X/) && (
    //        // case 1: safari 4 (desktop and iPad)
    //        browserVer >= 4 ||
    //        // case 2: safari mobile, might be 3
    //        userAgent.match(/Mobile\//));
    //if (hasCssTransforms && hasCssTransitions && acceleratedTransforms) {
    //    useCanvas = false;
    //    useCssTransforms = true;
    //}

    // regardless, in IE, we use <img> tags. unfortunately, in IE, <img> tags
    // use a crappy nearest-neighbor interpolation by default. IE7+ lets us
    // change this via a proprietary CSS property. unfortunately, changing it to
    // bicubic caused tile seams in IE7 -- but not IE8! even IE8 in compat mode
    // has no tile seams. so we need to detect IE8 regardless of mode; we do so
    // via document.documentMode, introduced in IE8 for all modes. finally, in
    // IE7, we'll explicitly say nearest-neighbor, otherwise if the user zooms
    // the page, IE7 would implicitly change it to bicubic, causing tile seams.
    var MS_INTERPOLATION_MODE = (typeof document.documentMode !== "undefined") ?
        "bicubic" : "nearest-neighbor";

    // Tiles

    function Tile(level, x, y, bounds, exists, url) {
        // Core
        this.level = level;
        this.x = x;
        this.y = y;
        this.bounds = bounds;   // where this tile fits, in normalized coordinates
        this.exists = exists;   // part of sparse image? tile hasn't failed to load?

        // Image
        this.url = url;         // the URL of this tile's image
        this.elmt = null;       // the HTML element for this tile
        this.image = null;      // the Image object for this tile
        this.loaded = false;    // is this tile loaded?
        this.loading = false;   // or is this tile loading?

        // Drawing
        this.style = null;      // alias of this.elmt.style
        this.position = null;   // this tile's position on screen, in pixels
        this.size = null;       // this tile's size on screen, in pixels
        this.blendStart = null; // the start time of this tile's blending
        this.opacity = null;    // the current opacity this tile should be
        this.distance = null;   // the distance of this tile to the viewport center
        this.visibility = null; // the visibility score of this tile

        // Caching
        this.beingDrawn = false;// whether this tile is currently being drawn
        this.lastDrawnTime = 0; // when the tile was last drawn
        this.lastTouchTime = 0; // the time that tile was last touched (though not necessarily drawn)
    }

    Tile.prototype.toString = function() {
        return this.level + "/" + this.x + "_" + this.y;
    };

    Tile.prototype.drawHTML = function(container) {
        if (!this.loaded) {
            SlideDebug.error("Attempting to draw tile " + this.toString() +
                " when it's not yet loaded.");
            return;
        }

        // initialize if first time
        if (!this.elmt) {
            this.elmt = SlideUtils.makeNeutralElement("img");
            this.elmt.src = this.url;
            this.style = this.elmt.style;
            this.style.position = "absolute";
            this.style.msInterpolationMode = MS_INTERPOLATION_MODE;
            // IE only property. see note above for explanation.

            if (useCssTransforms) {
                this.style[cssTransformProperty + "Origin"] = "0px 0px";
                // TEMP commenting out CSS transitions for now; not stable yet.
                //if (hasCssTransitions) {
                //    this.style[cssTransitionProperty + "Property"] = cssTransformPropertyCssName;
                //    this.style[cssTransitionProperty + "Duration"] = ".01666667s";   // TEMP 1/60th of a second
                //}
            }
        }

        var elmt = this.elmt;
        var image = this.image;
        var style = this.style;
        var position = this.position;
        var size = this.size;

        if (elmt.parentNode != container) {
            container.appendChild(elmt);
        }

        if (useCssTransforms) {

            // warning! sometimes chrome doesn't have this new <img> element
            // loaded yet, even though it's a clone of another <img> element
            // that is loaded. so we use the width and height properties of the
            // original <img> (the image variable instead of this one (elmt).
            style[cssTransformProperty] = [
                'matrix(',
                (size.x / image.width).toFixed(8),
                ',0,0,',
                (size.y / image.height).toFixed(8),
                ',',
                position.x.toFixed(8),
                cssTransformNoUnits ? ',' : 'px,',
                position.y.toFixed(8),
                cssTransformNoUnits ? ')' : 'px)'
            ].join('');

        } else if (useIeFilters) {

            var containerWidth = container.clientWidth,
                containerHeight = container.clientHeight;

            style.width = containerWidth + "px";
            style.height = containerHeight + "px";
            style.filter = [
                'progid:DXImageTransform.Microsoft.Matrix(',
                'M11=',
                (size.x / containerWidth).toFixed(8),
                ',M22=',
                (size.y / containerHeight).toFixed(8),
                ',Dx=',
                position.x.toFixed(8),
                ',Dy=',
                position.y.toFixed(8),
                ')'
            ].join('');

        } else {

            position = position.apply(Math.floor);
            size = size.apply(Math.ceil);

            style.left = position.x + "px";
            style.top = position.y + "px";
            style.width = size.x + "px";
            style.height = size.y + "px";

        }

        // TEMP because we know exactly whether we're using IE filters or not,
        // short-circuitting this utils call to optimize the logic.
        // UPDATE: we're no longer using IE filters, so reverting this logic.
        SlideUtils.setElementOpacity(elmt, this.opacity);
        //var opacity = this.opacity;
        //if (useIeFilters && opacity < 1) {
        //    style.filter += " alpha(opacity=" + Math.round(100 * opacity) + ")";
        //} else {
        //    style.opacity = (opacity < 1) ? opacity : '';
        //}
    };

    Tile.prototype.drawCanvas = function(context) {
        if (!this.loaded) {
            SlideDebug.error("Attempting to draw tile " + this.toString() +
                " when it's not yet loaded.");
            return;
        }

        var position = this.position;
        var size = this.size;

        context.globalAlpha = this.opacity;
        context.drawImage(this.image, position.x, position.y, size.x, size.y);
    };

    Tile.prototype.unload = function() {
        if (this.elmt && this.elmt.parentNode) {
            this.elmt.parentNode.removeChild(this.elmt);
        }

        this.elmt = null;
        this.image = null;
        this.loaded = false;
        this.loading = false;
    }

    // Overlays

    SlideSingleOverlayPlacement = Slide.OverlayPlacement = {
        CENTER: 0,
        TOP_LEFT: 1,
        TOP: 2,
        TOP_RIGHT: 3,
        RIGHT: 4,
        BOTTOM_RIGHT: 5,
        BOTTOM: 6,
        BOTTOM_LEFT: 7,
        LEFT: 8
    };

    /**
     * Creates an "adjustment" function for a given overlay placement that
     * adjusts an overlay's position depending on its size and placement. This
     * gives better perf during draw loop since we don't need to re-check and
     * re-calculate the adjustment every single iteration.
     */
    function createAdjustmentFunction(placement) {
        switch (placement) {
            case SlideSingleOverlayPlacement.TOP_LEFT:
                return function(position, size) {
                    // no adjustment needed
                };
            case SlideSingleOverlayPlacement.TOP:
                return function(position, size) {
                    position.x -= size.x / 2;
                    // no y adjustment needed
                };
            case SlideSingleOverlayPlacement.TOP_RIGHT:
                return function(position, size) {
                    position.x -= size.x;
                    // no y adjustment needed
                };
            case SlideSingleOverlayPlacement.RIGHT:
                return function(position, size) {
                    position.x -= size.x;
                    position.y -= size.y / 2;
                };
            case SlideSingleOverlayPlacement.BOTTOM_RIGHT:
                return function(position, size) {
                    position.x -= size.x;
                    position.y -= size.y;
                };
            case SlideSingleOverlayPlacement.BOTTOM:
                return function(position, size) {
                    position.x -= size.x / 2;
                    position.y -= size.y;
                };
            case SlideSingleOverlayPlacement.BOTTOM_LEFT:
                return function(position, size) {
                    // no x adjustment needed
                    position.y -= size.y;
                };
            case SlideSingleOverlayPlacement.LEFT:
                return function(position, size) {
                    // no x adjustment needed
                    position.y -= size.y / 2;
                };
            case SlideSingleOverlayPlacement.CENTER:
            default:
                return function(position, size) {
                    position.x -= size.x / 2;
                    position.y -= size.y / 2;
                };
        }
    }

    function Overlay(elmt, loc, placement) {
        // Core
        this.elmt = elmt;
        this.scales = (loc instanceof SlideRect);
        this.bounds = new SlideRect(loc.x, loc.y, loc.width, loc.height);
        // Drawing
        this.adjust = createAdjustmentFunction(loc instanceof SlidePoint ?
            placement : SlideSingleOverlayPlacement.TOP_LEFT);    // rects are always top-left
        this.position = new SlidePoint(loc.x, loc.y);
        this.size = new SlidePoint(loc.width, loc.height);
        this.style = elmt.style;
        this.naturalSize = new SlidePoint(elmt.clientWidth, elmt.clientHeight);
    }

    Overlay.prototype.destroy = function() {
        var elmt = this.elmt;
        var style = this.style;

        if (elmt.parentNode) {
            elmt.parentNode.removeChild(elmt);
        }

        style.top = "";
        style.left = "";
        style.position = "";

        if (this.scales) {
            style.width = "";
            style.height = "";
        }
    };

    Overlay.prototype.drawHTML = function(container) {
        var elmt = this.elmt;
        var style = this.style;
        var scales = this.scales;
        var naturalSize = this.naturalSize;

        if (elmt.parentNode != container) {
            container.appendChild(elmt);
            style.position = "absolute";
            naturalSize.x = elmt.clientWidth;
            naturalSize.y = elmt.clientHeight;
        }

        var position = this.position;
        var size = this.size;

        // override calculated size if this element doesn't scale with image
        if (!scales) {
            size.x = naturalSize.x = naturalSize.x || elmt.clientWidth;
            size.y = naturalSize.y = naturalSize.y || elmt.clientHeight;
        }

        // adjust position based on placement (default is center)
        this.adjust(position, size);

        if (SlideConfig.transformOverlays && hasCssTransforms) {

            style[cssTransformProperty + "Origin"] = "0px 0px";
            style[cssTransformProperty] = [
                'translate(',
                position.x.toFixed(8),
                'px,',  // webkit correctly accepts length units for translate() func
                position.y.toFixed(8),
                'px)'
            ].join('');

            if (scales) {

                if (!elmt.clientWidth) {
                    style.width = "100%";
                }
                if (!elmt.clientHeight) {
                    style.height = "100%";
                }

                style[cssTransformProperty] += [
                    ' scale(',
                    (size.x / elmt.clientWidth).toFixed(8),
                    ',',
                    (size.y / elmt.clientHeight).toFixed(8),
                    ')'
                ].join('');

            }

        } else if (SlideConfig.transformOverlays && useIeFilters) {

            var containerWidth = container.clientWidth,
                containerHeight = container.clientHeight;

            style.width = containerWidth + "px";
            style.height = containerHeight + "px";
            style.filter = [
                'progid:DXImageTransform.Microsoft.Matrix(',
                'M11=',
                (size.x / containerWidth).toFixed(8),
                ',M22=',
                (size.y / containerHeight).toFixed(8),
                ',Dx=',
                position.x.toFixed(8),
                ',Dy=',
                position.y.toFixed(8),
                ')'
            ].join('');

        } else {

            position = position.apply(Math.floor);
            size = size.apply(Math.ceil);

            style.left = position.x + "px";
            style.top = position.y + "px";

            if (scales) {
                style.width = size.x + "px";
                style.height = size.y + "px";
            }

        }
    };

    Overlay.prototype.update = function(loc, placement) {
        this.scales = (loc instanceof SlideRect);
        this.bounds = new SlideRect(loc.x, loc.y, loc.width, loc.height);
        this.adjust = createAdjustmentFunction(loc instanceof SlidePoint ?
            placement : SlideSingleOverlayPlacement.TOP_LEFT);    // rects are always top-left
    };

    // Drawer

    SlideSingleDrawer = Slide.SingleDrawer = function(source, viewport, elmt) {

        // Implementation note:
        // 
        // This class draws two types of things: tiles and overlays. Currently,
        // only HTML elements are supported overlay types, so they will always
        // be inserted into the DOM. Tiles are images, which allows them to be
        // both inserted into the DOM or to be drawn onto a <canvas> element.
        // 
        // Higher-res (higher-level) tiles need to be drawn above lower-res
        // (lower-level) tiles. Overlays need to be drawn above all tiles. For
        // tiles drawn using <canvas>, this is easy. For tiles drawn as HTML,
        // and for overlays, we can use the CSS z-index property, but that has
        // issues in full page. So instead, we can achieve natural z-ordering
        // through the order of the elements in the container.
        // 
        // To do this, in the HTML mode, we add the tiles not to the container
        // directly, but to a div inside the container. This div is the first
        // child of the container. The overlays are added to the container
        // directly, after that div. This ensures that the overlays are always
        // drawn above the tiles.
        // 
        // In the below fields, the canvas field refers to the <canvas> element
        // if we're drawing with canvas, or the div that contains the tiles if
        // we're drawing with HTML.
        // 
        // Minor note: we remove and re-add tiles to the div every frame, but we
        // can't do this with overlays, as it breaks browser event behavior.

        // Fields

        var container = SlideUtils.getElement(elmt);
        var canvas = SlideUtils.makeNeutralElement(useCanvas ? "canvas" : "div");
        var context = useCanvas ? canvas.getContext("2d") : null;

        var imageLoader = new SlideImgLoader();
        var profiler = new SlideProfiler();

        var minLevel = source.minLevel;
        var maxLevel = source.maxLevel;
        var tileSize = source.tileSize;
        var tileOverlap = source.tileOverlap;
        var normHeight = source.height / source.width;

        var cacheNumTiles = {};     // 1d dictionary [level] --> Point
        var cachePixelRatios = {};  // 1d dictionary [level] --> Point
        var tilesMatrix = {};       // 3d dictionary [level][x][y] --> Tile
        var tilesLoaded = [];       // unordered list of Tiles with loaded images
        var coverage = {};          // 3d dictionary [level][x][y] --> Boolean

        var overlays = [];          // unordered list of Overlays added
        var lastDrawn = [];         // unordered list of Tiles drawn last frame
        var lastFrameTime = 0;      // the timestamp of the previous frame
        var lastResetTime = 0;
        var midUpdate = false;
        var updateAgain = true;

        // Properties

        this.elmt = container;
        this.profiler = profiler;

        // Constructor

        (function() {
            canvas.style.width = "100%";
            canvas.style.height = "100%";
            canvas.style.position = "absolute";
            container.style.textAlign = "left";    // explicit left-align
            container.appendChild(canvas);
        })();

        // Helpers -- CACHES

        function getNumTiles(level) {
            if (!cacheNumTiles[level]) {
                cacheNumTiles[level] = source.getNumTiles(level);
            }

            return cacheNumTiles[level];
        }

        function getPixelRatio(level) {
            if (!cachePixelRatios[level]) {
                cachePixelRatios[level] = source.getPixelRatio(level);
            }

            return cachePixelRatios[level];
        }

        // Helpers -- TILES

        function getTile(level, x, y, time, numTilesX, numTilesY) {
            if (!tilesMatrix[level]) {
                tilesMatrix[level] = {};
            }
            if (!tilesMatrix[level][x]) {
                tilesMatrix[level][x] = {};
            }

            // initialize tile object if first time
            if (!tilesMatrix[level][x][y]) {
                // where applicable, adjust x and y to support wrapping.
                var xMod = (numTilesX + (x % numTilesX)) % numTilesX;
                var yMod = (numTilesY + (y % numTilesY)) % numTilesY;
                var bounds = source.getTileBounds(level, xMod, yMod);
                var exists = source.tileExists(level, xMod, yMod);
                var url = source.getTileUrl(level, xMod, yMod);

                // also adjust bounds to support wrapping.
                bounds.x += 1.0 * (x - xMod) / numTilesX;
                bounds.y += normHeight * (y - yMod) / numTilesY;

                tilesMatrix[level][x][y] = new Tile(level, x, y, bounds, exists, url);
            }

            var tile = tilesMatrix[level][x][y];

            // mark tile as touched so we don't reset it too soon
            tile.lastTouchTime = time;

            return tile;
        }

        function loadTile(tile, time) {
            tile.loading = imageLoader.loadImage(tile.url,
                SlideUtils.createCallback(null, onTileLoad, tile, time));
        }

        function onTileLoad(tile, time, image) {
            tile.loading = false;

            if (midUpdate) {
                SlideDebug.error("Tile load callback in middle of drawing routine.");
                return;
            } else if (!image) {
                SlideDebug.log("Tile " + tile + " failed to load: " + tile.url);
                tile.exists = false;
                return;
            } else if (time < lastResetTime) {
                SlideDebug.log("Ignoring tile " + tile + " loaded before reset: " + tile.url);
                return;
            }

            tile.loaded = true;
            tile.image = image;

            var insertionIndex = tilesLoaded.length;

            if (tilesLoaded.length >= QUOTA) {
                var cutoff = Math.ceil(Math.log(tileSize) / Math.log(2));
                // don't delete any single-tile levels. this takes priority.

                var worstTile = null;
                var worstTileIndex = -1;

                for (var i = tilesLoaded.length - 1; i >= 0; i--) {
                    var prevTile = tilesLoaded[i];

                    if (prevTile.level <= cutoff || prevTile.beingDrawn) {
                        continue;
                    } else if (!worstTile) {
                        worstTile = prevTile;
                        worstTileIndex = i;
                        continue;
                    }

                    var prevTime = prevTile.lastTouchTime;
                    var worstTime = worstTile.lastTouchTime;
                    var prevLevel = prevTile.level;
                    var worstLevel = worstTile.level;

                    if (prevTime < worstTime ||
                        (prevTime == worstTime && prevLevel > worstLevel)) {
                        worstTile = prevTile;
                        worstTileIndex = i;
                    }
                }

                if (worstTile && worstTileIndex >= 0) {
                    worstTile.unload();
                    insertionIndex = worstTileIndex;
                    // note: we don't want or need to delete the actual Tile
                    // object from tilesMatrix; that's negligible memory.
                }
            }

            tilesLoaded[insertionIndex] = tile;
            updateAgain = true;
        }

        function clearTiles() {
            tilesMatrix = {};
            tilesLoaded = [];
        }

        // Helpers -- COVERAGE

        // Coverage scheme: it's required that in the draw routine, coverage for
        // every tile within the viewport is initially explicitly set to false.
        // This way, if a given level's coverage has been initialized, and a tile
        // isn't found, it means it's offscreen and thus provides coverage (since
        // there's no content needed to be covered). And if every tile that is found
        // does provide coverage, the entire visible level provides coverage.

        /**
         * Returns true if the given tile provides coverage to lower-level tiles of
         * lower resolution representing the same content. If neither x nor y is
         * given, returns true if the entire visible level provides coverage.
         *
         * Note that out-of-bounds tiles provide coverage in this sense, since
         * there's no content that they would need to cover. Tiles at non-existent
         * levels that are within the image bounds, however, do not.
         */
        function providesCoverage(level, x, y) {
            if (!coverage[level]) {
                return false;
            }

            if (x === undefined || y === undefined) {
                // check that every visible tile provides coverage.
                // update: protecting against properties added to the Object
                // class's prototype, which can definitely (and does) happen.
                var rows = coverage[level];
                for (var i in rows) {
                    if (rows.hasOwnProperty(i)) {
                        var cols = rows[i];
                        for (var j in cols) {
                            if (cols.hasOwnProperty(j) && !cols[j]) {
                                return false;
                            }
                        }
                    }
                }

                return true;
            }

            return (coverage[level][x] === undefined ||
            coverage[level][x][y] === undefined ||
            coverage[level][x][y] === true);
        }

        /**
         * Returns true if the given tile is completely covered by higher-level
         * tiles of higher resolution representing the same content. If neither x
         * nor y is given, returns true if the entire visible level is covered.
         */
        function isCovered(level, x, y) {
            if (x === undefined || y === undefined) {
                return providesCoverage(level+1);
            } else {
                return (providesCoverage(level+1, 2*x, 2*y) &&
                providesCoverage(level+1, 2*x, 2*y + 1) &&
                providesCoverage(level+1, 2*x + 1, 2*y) &&
                providesCoverage(level+1, 2*x + 1, 2*y + 1));
            }
        }

        /**
         * Sets whether the given tile provides coverage or not.
         */
        function setCoverage(level, x, y, covers) {
            if (!coverage[level]) {
                SlideDebug.error("Setting coverage for a tile before its " +
                    "level's coverage has been reset: " + level);
                return;
            }

            if (!coverage[level][x]) {
                coverage[level][x] = {};
            }

            coverage[level][x][y] = covers;
        }

        /**
         * Resets coverage information for the given level. This should be called
         * after every draw routine. Note that at the beginning of the next draw
         * routine, coverage for every visible tile should be explicitly set.
         */
        function resetCoverage(level) {
            coverage[level] = {};
        }

        // Helpers -- SCORING

        function compareTiles(prevBest, tile) {
            // figure out if this tile is better than the previous best tile...
            // note that if there is no prevBest, this is automatically better.
            if (!prevBest) {
                return tile;
            }

            if (tile.visibility > prevBest.visibility) {
                return tile;
            } else if (tile.visibility == prevBest.visibility) {
                if (tile.distance < prevBest.distance) {
                    return tile;
                }
            }

            return prevBest;
        }

        // Helpers -- OVERLAYS

        function getOverlayIndex(elmt) {
            for (var i = overlays.length - 1; i >= 0; i--) {
                if (overlays[i].elmt == elmt) {
                    return i;
                }
            }

            return -1;
        }

        // Helpers -- CORE

        function updateActual() {
            // assume we won't need to update again after this update.
            // we'll set this if we find a reason to update again.
            updateAgain = false;

            // make local references to variables & functions referenced in
            // loops in order to improve perf
            var _canvas = canvas;
            var _context = context;
            var _container = container;
            var _useCanvas = useCanvas;
            var _lastDrawn = lastDrawn;

            // the tiles that were drawn last frame, but won't be this frame,
            // can be cleared from the cache, so they should be marked as such.
            while (_lastDrawn.length > 0) {
                var tile = _lastDrawn.pop();
                tile.beingDrawn = false;
            }

            // we need the size of the viewport (in pixels) in multiple places
            var viewportSize = viewport.getContainerSize();
            var viewportWidth = viewportSize.x;
            var viewportHeight = viewportSize.y;

            // clear canvas, whether in <canvas> mode or HTML mode.
            // this is important as scene may be empty this frame.
            if (_useCanvas) {
                _canvas.width = viewportWidth;
                _canvas.height = viewportHeight;
                _context.clearRect(0, 0, viewportWidth, viewportHeight);
                // this last line shouldn't be needed. setting the width and
                // height should clear <canvas>, but Firefox doesn't always.
            } else {
                _canvas.innerHTML = "";
            }

            // if viewport is off image entirely, don't bother drawing.
            // UPDATE: logic modified to support horizontal/vertical wrapping.
            var viewportBounds = viewport.getBounds(true);
            var viewportTL = viewportBounds.getTopLeft();
            var viewportBR = viewportBounds.getBottomRight();
            if (!SlideConfig.wrapHorizontal &&
                (viewportBR.x < 0 || viewportTL.x > 1)) {
                // we're not wrapping horizontally, and viewport is off in x
                return;
            } else if (!SlideConfig.wrapVertical &&
                (viewportBR.y < 0 || viewportTL.y > normHeight)) {
                // we're not wrapping vertically, and viewport is off in y
                return;
            }

            // the below section is commented out because it's more relevant to
            // collections, where you don't want 10 items to all load their xml
            // at the same time when 9 of them won't be in the viewport soon.

//            // but even if the viewport is currently on the image, don't force
//            // tiles to load if the viewport target is off the image
//            var viewportTargetBounds = getViewportBounds(false);
//            var viewportTargetTL = viewportTargetBounds.getTopLeft();
//            var viewportTargetBR = viewportTargetBounds.getBottomRight();
//            var willBeOff = viewportTargetBR.x < 0 || viewportTargetBR.y < 0 ||
//                    viewportTargetTL.x > 1 || viewportTargetTL.y > normHeight;

            // make local references to functions and variables used in loops to
            // improve perf
            var _getNumTiles = getNumTiles;
            var _getPixelRatio = getPixelRatio;
            var _getTile = getTile;
            var _isCovered = isCovered;
            var _setCoverage = setCoverage;
            var _resetCoverage = resetCoverage;
            var _providesCoverage = providesCoverage;
            var _tileOverlap = tileOverlap;
            var _lastFrameTime = lastFrameTime;
            var isChrome = (browser === SlideBrowser.CHROME);
            // same for Math functions
            var _abs = Math.abs;
            var _ceil = Math.ceil;
            var _floor = Math.floor;
            var _log = Math.log;
            var _max = Math.max;
            var _min = Math.min;
            // and Viewport functions
            var _deltaPixelsFromPoints = viewport.deltaPixelsFromPoints;
            var _pixelFromPoint = viewport.pixelFromPoint;
            // and TileSource functions
            var _getTileAtPoint = source.getTileAtPoint;
            // and Config properties
            var alwaysBlend = SlideConfig.alwaysBlend;
            var blendTimeMillis = 1000 * SlideConfig.blendTime;
            var immediateRender = SlideConfig.immediateRender;
            var minDimension = SlideConfig.minZoomDimension;   // for backwards compatibility
            var minImageRatio = SlideConfig.minImageRatio;
            var wrapHorizontal = SlideConfig.wrapHorizontal;
            var wrapVertical = SlideConfig.wrapVertical;
            var wrapOverlays = SlideConfig.wrapOverlays;

            // restrain bounds of viewport relative to image.
            // UPDATE: logic modified to support horizontal/vertical wrapping.
            if (!wrapHorizontal) {
                viewportTL.x = _max(viewportTL.x, 0);
                viewportBR.x = _min(viewportBR.x, 1);
            }
            if (!wrapVertical) {
                viewportTL.y = _max(viewportTL.y, 0);
                viewportBR.y = _min(viewportBR.y, normHeight);
            }

            var best = null;
            var haveDrawn = false;
            var currentTime = new Date().getTime();

            // calculate values for scoring -- this is based on TARGET values
            var viewportCenterPoint = viewport.getCenter();
            var viewportCenterPixel = _pixelFromPoint(viewportCenterPoint);
            var zeroRatioT = _deltaPixelsFromPoints(_getPixelRatio(0), false).x;
            var optimalPixelRatio = immediateRender ? 1 : zeroRatioT;

            // adjust levels to iterate over -- this is based on CURRENT values
            // TODO change this logic to use minImageRatio, but for backwards
            // compatibility, use minDimension if it's been explicitly set.
            // TEMP for now, original minDimension logic with default 64.
            minDimension = minDimension || 64;
            var lowestLevel = _max(minLevel, _floor(_log(minDimension) / _log(2)));
            var zeroRatioC = _deltaPixelsFromPoints(_getPixelRatio(0), true).x;
            var highestLevel = _min(maxLevel,
                _floor(_log(zeroRatioC / MIN_PIXEL_RATIO) / _log(2)));

            // with very small images, this edge case can occur...
            lowestLevel = _min(lowestLevel, highestLevel);

            for (var level = highestLevel; level >= lowestLevel; level--) {
                var drawLevel = false;
                var renderPixelRatioC = _deltaPixelsFromPoints(
                    _getPixelRatio(level), true).x;     // note the .x!

                // if we haven't drawn yet, only draw level if tiles are big enough
                if ((!haveDrawn && renderPixelRatioC >= MIN_PIXEL_RATIO) ||
                    level == lowestLevel) {
                    drawLevel = true;
                    haveDrawn = true;
                } else if (!haveDrawn) {
                    continue;
                }

                _resetCoverage(level);

                // calculate scores applicable to all tiles on this level --
                // note that we're basing visibility on the TARGET pixel ratio
                var levelOpacity = _min(1, (renderPixelRatioC - 0.5) / 0.5);
                var renderPixelRatioT = _deltaPixelsFromPoints(
                    _getPixelRatio(level), false).x;
                var levelVisibility = optimalPixelRatio /
                    _abs(optimalPixelRatio - renderPixelRatioT);

                // only iterate over visible tiles
                var tileTL = _getTileAtPoint(level, viewportTL);
                var tileBR = _getTileAtPoint(level, viewportBR);
                var numTiles = _getNumTiles(level);
                var numTilesX = numTiles.x;
                var numTilesY = numTiles.y;
                if (!wrapHorizontal) {
                    tileBR.x = _min(tileBR.x, numTilesX - 1);
                }
                if (!wrapVertical) {
                    tileBR.y = _min(tileBR.y, numTilesY - 1);
                }

                for (var x = tileTL.x; x <= tileBR.x; x++) {
                    for (var y = tileTL.y; y <= tileBR.y; y++) {
                        var tile = _getTile(level, x, y, currentTime, numTilesX, numTilesY);
                        var drawTile = drawLevel;

                        // assume this tile doesn't cover initially
                        _setCoverage(level, x, y, false);

                        if (!tile.exists) {
                            // not part of sparse image, or failed to load
                            continue;
                        }

                        // if we've drawn a higher-resolution level and we're not
                        // going to draw this level, then say this tile does cover
                        // if it's covered by higher-resolution tiles. if we're not
                        // covered, then we should draw this tile regardless.
                        if (haveDrawn && !drawTile) {
                            if (_isCovered(level, x, y)) {
                                _setCoverage(level, x, y, true);
                            } else {
                                drawTile = true;
                            }
                        }

                        if (!drawTile) {
                            continue;
                        }

                        // calculate tile's position and size in pixels
                        var boundsTL = tile.bounds.getTopLeft();
                        var boundsSize = tile.bounds.getSize();
                        var positionC = _pixelFromPoint(boundsTL, true);
                        var sizeC = _deltaPixelsFromPoints(boundsSize, true);

                        // if there is no tile overlap, we need to oversize the
                        // tiles by 1px to prevent seams at imperfect zooms.
                        // fortunately, this is not an issue with regular dzi's
                        // created from Deep Zoom Composer, which uses overlap.
                        if (!_tileOverlap) {
                            sizeC = sizeC.plus(new SlidePoint(1, 1));
                        }

                        // calculate distance from center of viewport -- note
                        // that this is based on tile's TARGET position
                        var positionT = _pixelFromPoint(boundsTL, false);
                        var sizeT = _deltaPixelsFromPoints(boundsSize, false);
                        var tileCenter = positionT.plus(sizeT.divide(2));
                        var tileDistance = viewportCenterPixel.distanceTo(tileCenter);

                        // update tile's scores and values
                        tile.position = positionC;
                        tile.size = sizeC;
                        tile.distance = tileDistance;
                        tile.visibility = levelVisibility;

                        if (tile.loaded) {
                            if (!tile.blendStart) {
                                // image was just added, blend it
                                tile.blendStart = currentTime;
                            }

                            var deltaTime = currentTime - tile.blendStart;
                            var opacity = (blendTimeMillis === 0) ? 1 :
                                _min(1, deltaTime / blendTimeMillis);

                            if (alwaysBlend) {
                                opacity *= levelOpacity;
                            }

                            tile.opacity = opacity;

                            // queue tile for drawing in reverse order
                            _lastDrawn.push(tile);

                            // if fully blended in, this tile now provides coverage,
                            // otherwise we need to update again to keep blending
                            if (opacity >= 1) {
                                _setCoverage(level, x, y, true);

                                // workaround for chrome's weird flickering issue
                                if (isChrome && tile.lastDrawnTime !== _lastFrameTime) {
                                    _setCoverage(level, x, y, false);
                                }
                            } else if (deltaTime < blendTimeMillis) {
                                updateAgain = true;
                            }

                            // new: remember that it was drawn this frame
                            tile.lastDrawnTime = currentTime;
                        } else if (tile.loading) {
                            // nothing to see here, move on
                        } else {
                            // means tile isn't loaded yet, so score it
                            best = compareTiles(best, tile);
                        }
                    }
                }

                // we may not need to draw any more lower-res levels
                if (_providesCoverage(level)) {
                    break;
                }
            }

            // now draw the tiles, but in reverse order since we want higher-res
            // tiles to be drawn on top of lower-res ones. also mark each tile
            // as being drawn so it won't get cleared from the cache.
            for (var i = _lastDrawn.length - 1; i >= 0; i--) {
                var tile = _lastDrawn[i];

                if (_useCanvas) {
                    tile.drawCanvas(_context);
                } else {
                    tile.drawHTML(_canvas);
                }

                tile.beingDrawn = true;
            }

            // draw the overlays -- TODO optimize based on viewport like tiles,
            // but this is tricky for non-scaling overlays like pins...
            var numOverlays = overlays.length;

            for (var i = 0; i < numOverlays; i++) {
                var overlay = overlays[i];
                var bounds = overlay.bounds;
                var overlayTL = bounds.getTopLeft();    // in normalized coords

                // wrap overlays if specified
                if (wrapOverlays && wrapHorizontal) {
                    // TEMP this isn't perfect, e.g. view center is at -2.1 and
                    // overlay is at 0.1, this will use -2.9 instead of -1.9.
                    overlayTL.x += _floor(viewportCenterPoint.x);
                }
                if (wrapOverlays && wrapVertical) {
                    // TODO wrap overlays vertically
                }

                overlay.position = _pixelFromPoint(overlayTL, true);
                overlay.size = _deltaPixelsFromPoints(bounds.getSize(), true);

                overlay.drawHTML(container);
            }

            // load next tile if there is one to load
            if (best) {
                loadTile(best, currentTime);
                updateAgain = true; // because we haven't finished drawing, so
                                    // we should be re-evaluating and re-scoring
            }

            // new: save this frame's timestamp to enable comparing times
            lastFrameTime = currentTime;
        }

        // Methods -- OVERLAYS

        this.addOverlay = function(elmt, loc, placement) {
            var elmt = SlideUtils.getElement(elmt);

            if (getOverlayIndex(elmt) >= 0) {
                return;     // they're trying to add a duplicate overlay
            }

            overlays.push(new Overlay(elmt, loc, placement));
            updateAgain = true;     // TODO do we really need this?
        };

        this.updateOverlay = function(elmt, loc, placement) {
            var elmt = SlideUtils.getElement(elmt);
            var i = getOverlayIndex(elmt);

            if (i >= 0) {
                overlays[i].update(loc, placement);
                updateAgain = true;     // TODO do we really need this?
            }
        };

        this.removeOverlay = function(elmt) {
            var elmt = SlideUtils.getElement(elmt);
            var i = getOverlayIndex(elmt);

            if (i >= 0) {
                overlays[i].destroy();
                overlays.splice(i, 1);
                updateAgain = true;     // TODO do we really need this?
            }
        };

        this.clearOverlays = function() {
            while (overlays.length > 0) {
                overlays.pop().destroy();
                updateAgain = true;     // TODO do we really need this?
                                        // TODO it also doesn't need to be in the loop.
            }
        };

        // Methods -- CORE

        this.needsUpdate = function() {
            return updateAgain;
        };

        this.numTilesLoaded = function() {
            return tilesLoaded.length;
        };

        this.reset = function() {
            clearTiles();
            lastResetTime = new Date().getTime();
            updateAgain = true;
        };

        this.update = function() {
            profiler.beginUpdate();
            midUpdate = true;
            updateActual();
            midUpdate = false;
            profiler.endUpdate();
        };

        this.idle = function() {
            // TODO idling function
        };


        // myself add function
        this.useCanvas = function () {
            return useCanvas;
        };
        this.getCanvas = function () {
            return canvas;
        };
    };

})();

/**
 * Pathology - 1.0.0
 * @email v
 * @author 
 */

var SlideEvtManage = Slide.EvtManage = function () {
  // Fields
  var listeners = {};  // dictionary of eventName --> array of handlers

  // Public Methods

  // 添加一个事件监听
  this.addListener = function (evtName, handler) {
    if (typeof(handler) !== "function") {
      return;
    }

    if (!listeners[evtName]) {
      listeners[evtName] = [];
    }

    listeners[evtName].push(handler);
  };

  // 移除一个事件监听
  this.removeListener = function (evtName, handler) {
    var handlers = listeners[evtName];

    if (typeof(handler) !== "function") {
      return;
    } else if (!handlers) {
      return;
    }

    for (var i = 0; i < handlers.length; i++) {
      if (handler === handlers[i]) {
        handlers.splice(i, 1);
        return;
      }
    }
  };

  // 清空一组事件监听
  this.clearListeners = function (evtName) {
    if (listeners[evtName]) {
      delete listeners[evtName];
    }
  };

  // 触发一组事件响应
  this.trigger = function (evtName) {
    var handlers = listeners[evtName],
      args = [];

    if (!handlers) {
      return;
    }

    for (var i = 1; i < arguments.length; i++) {
      args.push(arguments[i]);
    }

    for (var i = 0; i < handlers.length; i++) {
      try {
        handlers[i].apply(window, args);
      } catch (err) {
        // handler threw an error, ignore, go on to next one
        SlideDebug.error(err.name + " while executing " + evtName + " handler: "
          + err.message, err);
      }
    }
  };
};

/**
 * Pathology - 1.0.0
 * @email v
 * @author 
 */

var SlideImgLoader = Slide.ImgLoader;

(function () {
  // milliseconds after which an image times out
  var TIMEOUT = 15000;

  function Job(src, callback) {
    // Fields
    var image = null,
    // IE8 fix: no finishing event raised sometimes
      timeout = null;

    // Helpers
    function finish(success) {
      image.onload = null;
      image.onabort = null;
      image.onerror = null;

      if (timeout) {
        window.clearTimeout(timeout);
      }

      // call on a timeout to ensure asynchronous behavior
      window.setTimeout(function() {
        callback(src, (success ? image : null));
      }, 1);
    }

    // Public Methods
    this.start = function() {
      function successFunc() {
        finish(true);
      }

      function failureFunc() {
        finish(false);
      }

      function timeoutFunc() {
        SlideDebug.log("Image timed out: " + src);
        finish(false);
      }

      image = new Image();
      image.onload = successFunc;
      image.onabort = failureFunc;
      image.onerror = failureFunc;
      // consider it a failure if the image times out.
      timeout = window.setTimeout(timeoutFunc, TIMEOUT);
      image.src = src;
    };
  }

  SlideImgLoader = Slide.ImgLoader = function () {
    // Fields
    // number of Jobs currently downloading
    var downloading = 0;

    // Helpers
    function onComplete(callback, src, image) {
      downloading--;

      if (typeof(callback) === "function") {
        try {
//          if (SlideConfig.debugMode) {
//            SlideDebug.log("request img: " + src + " succeed!");
//          }

          callback(image);
        } catch (err) {
          SlideDebug.error(err.name +  " while executing " + src + " callback: " +
            err.message, err);
        }
      }
    }

    // Methods
    this.loadImage = function(src, callback) {
      if (downloading >= SlideConfig.imageLoaderLimit) {
        return false;
      }

      var func = SlideUtils.createCallback(null, onComplete, callback),
        job = new Job(src, func);

      downloading++;
      job.start();

      return true;
    };
  };
})();

/**
 * Pathology - 1.0.0
 * @email v
 * @author 
 */

var SlideMouseTracker = Slide.MouseTracker;

(function () {
  if (SlideMouseTracker) {
    return;
  }

  // Constants
  // update: IE9 implements the W3C standard event model! =)
  var IE8 = SlideUtils.getBrowser() === SlideBrowser.IE && SlideUtils.getBrowserVersion() < 9;

  // Static fields
  var buttonDownAny = false,
    ieCapturingAny = false,
    ieTrackersActive = {},     // dictionary from hash to MouseTracker
    ieTrackersCapturing = [];  // list of trackers interested in capture

  // Static Constructor
  (function () {
    if (IE8) {
      SlideUtils.addEvent(document, "mousedown", onGlobalMouseDown, false);
      SlideUtils.addEvent(document, "mouseup", onGlobalMouseUp, false);
    } else {
      SlideUtils.addEvent(window, "mousedown", onGlobalMouseDown, true);
      SlideUtils.addEvent(window, "mouseup", onGlobalMouseUp, true);
    }
  })();

  // 全局鼠标按下响应
  function onGlobalMouseDown() {
    buttonDownAny = true;
  }

  // 全局鼠标抬起响应
  function onGlobalMouseUp() {
    buttonDownAny = false;
  }

  // 鼠标事件跟踪器
  SlideMouseTracker = Slide.MouseTracker = function (elmt) {
    // Fields
    var self = this,
      elmt = SlideUtils.getElement(elmt),  // 需要跟踪的元素

      ieSelf = null,
      hash = Math.random(),       // a unique hash for this tracker

      tracking = false,           // 是否在跟踪监听鼠标
      capturing = false,
      buttonDownElmt = false,     // 是否鼠标在元素elmt中按下
      insideElmt = false,         // 是否在元素elmt中响应

      lastPoint = null,           // position of last mouse down/move
      lastMouseDownTime = null,   // time of last mouse down
      lastMouseDownPoint = null;  // position of last mouse down

    // Properties
    this.target = elmt;
    // function (tracker, position, buttonDownElmt, buttonDownAny)
    this.enterHandler = null;
    // function (tracker, position, buttonDownElmt, buttonDownAny)
    this.exitHandler = null;
    // function (tracker, position)
    this.pressHandler = null;
    // function (tracker, position, insideElmtPress, insideElmtRelease)
    this.releaseHandler = null;
    // function (tracker, position, quick, shift)
    this.clickHandler = null;
    // function (tracker, position, delta, shift)
    this.dragHandler = null;
    // function (tracker, position, scroll, shift)
    this.scrollHandler = null;

    // Constructor
    (function () {
      ieSelf = {
        hasMouse: hasMouse,
        onMouseOver: onMouseOver,
        onMouseOut: onMouseOut,
        onMouseUp: onMouseUp,
        onMouseMove: onMouseMove
      };
    })();

    // Private Methods

    // 工具函数

    // 如果 elmtB 是 elmtA 的子元素或者 elmtA 与 elmtB相等，返回true
    function isChild(elmtA, elmtB) {
      var body = document.body;

      while (elmtB && elmtA !== elmtB && body !== elmtB) {
        try {
          elmtB = elmtB.parentNode;
        } catch (err) {
          return false;
        }
      }

      return elmtA === elmtB;
    }

    // 获取鼠标的相对位置
    function getMsRelative(evt, elmt) {
      var mouse = SlideUtils.getMousePosition(evt),
        offset = SlideUtils.getElementPosition(elmt);

      return mouse.minus(offset);
    }

    // 获取鼠标的绝对位置
    function getMsAbsolute(evt) {
      return SlideUtils.getMousePosition(evt);
    }

    // 核心函数

    // 开始跟踪监听鼠标事件
    function startTracking() {
      if (!tracking) {
        SlideUtils.addEvent(elmt, "mouseover", onMouseOver, false);
        SlideUtils.addEvent(elmt, "mouseout", onMouseOut, false);
        SlideUtils.addEvent(elmt, "mousedown", onMouseDown, false);
        SlideUtils.addEvent(elmt, "mouseup", onMouseUp, false);
        SlideUtils.addEvent(elmt, "click", onMouseClick, false);
        SlideUtils.addEvent(elmt, "mousewheel", onMouseScroll, false);

        tracking = true;
        ieTrackersActive[hash] = ieSelf;
      }
    }

    // 停止跟踪监听鼠标事件
    function stopTracking() {
      if (tracking) {
        SlideUtils.removeEvent(elmt, "mouseover", onMouseOver, false);
        SlideUtils.removeEvent(elmt, "mouseout", onMouseOut, false);
        SlideUtils.removeEvent(elmt, "mousedown", onMouseDown, false);
        SlideUtils.removeEvent(elmt, "mouseup", onMouseUp, false);
        SlideUtils.removeEvent(elmt, "click", onMouseClick, false);
        SlideUtils.removeEvent(elmt, "mousewheel", onMouseScroll, false);

        releaseMouse();
        tracking = false;
        delete ieTrackersActive[hash];
      }
    }

    // 开始捕获鼠标
    function captureMouse() {
      if (!capturing) {
        if (IE8) {
          SlideUtils.removeEvent(elmt, "mouseup", onMouseUp, false);
          SlideUtils.addEvent(elmt, "mouseup", onMouseUpIE, true);
          SlideUtils.addEvent(elmt, "mousemove", onMouseMoveIE, true);
        } else {
          SlideUtils.addEvent(window, "mouseup", onMouseUpWindow, true);
          SlideUtils.addEvent(window, "mousemove", onMouseMove, true);
        }

        capturing = true;
      }
    }

    // 释放鼠标捕获
    function releaseMouse() {
      if (capturing) {
        if (IE8) {
          SlideUtils.addEvent(elmt, "mouseup", onMouseUp, false);
          SlideUtils.removeEvent(elmt, "mouseup", onMouseUpIE, true);
          SlideUtils.removeEvent(elmt, "mousemove", onMouseMoveIE, true);
        } else {
          SlideUtils.removeEvent(window, "mouseup", onMouseUpWindow, true);
          SlideUtils.removeEvent(window, "mousemove", onMouseMove, true);
        }

        capturing = false;
      }
    }

    // IE 专用函数

    function hasMouse() {
      return insideElmt;
    }

    // 触发ie相关的事件响应函数
    function triggerOthers(evtName, evt) {
      var trackers = ieTrackersActive;

      for (var otherHash in trackers) {
        if (trackers.hasOwnProperty(otherHash) && hash !== otherHash) {
          trackers[otherHash][evtName](evt);
        }
      }
    }

    // 监听跟踪事件响应

    // 跟踪监听鼠标移入事件
    function onMouseOver(evt) {
      evt = SlideUtils.getEvent(evt);

      if (IE8 && capturing && !isChild(evt.srcElement, elmt)) {
        triggerOthers("onMouseOver", evt);
      }

      var to = evt.target ? evt.target :evt.srcElement,
        from = evt.relatedTarget ? evt.relatedTarget : evt.fromElement;

      if (!isChild(elmt, to) || isChild(elmt, from)) {
        return;
      }

      insideElmt = true;

      if (typeof self.enterHandler === "function") {
        try {
          self.enterHandler(self, getMsRelative(evt, elmt),
            buttonDownElmt, buttonDownAny);
        } catch (err) {
          SlideDebug.error(err.name + " while executing enter handler: " +
            err.message, err);
        }
      }
    }

    // 跟踪监听鼠标移出事件
    function onMouseOut(evt) {
      evt = SlideUtils.getEvent(evt);

      if (IE8 && capturing && !isChild(evt.srcElement, elmt)) {
        triggerOthers("onMouseOut", evt);
      }

      var from = evt.target ? evt.target :evt.srcElement,
        to = evt.relatedTarget ? evt.relatedTarget : evt.toElement;

      if (!isChild(elmt, from) || isChild(elmt, to)) {
        return;
      }

      insideElmt = false;

      if (typeof self.exitHandler === "function") {
        try {
          self.exitHandler(self, getMsRelative(evt, elmt),
            buttonDownElmt, buttonDownAny);
        } catch (err) {
          SlideDebug.error(err.name + " while executing exit handler: " +
            err.message, err);
        }
      }
    }

    // 跟踪监听鼠标按下事件
    function onMouseDown(evt) {
      evt = SlideUtils.getEvent(evt);

      // don't consider right-clicks (fortunately this is cross-browser)
      if (evt.button === 2) {
        return;
      }

      buttonDownElmt = true;
      lastPoint = getMsAbsolute(evt);
      lastMouseDownPoint = lastPoint;
      lastMouseDownTime = new Date().getTime();

      if (typeof self.pressHandler === "function") {
        try {
          self.pressHandler(self, getMsRelative(evt, elmt));
        } catch (err) {
          SlideDebug.error(err.name + " while executing press handler: " +
            err.message, err)
        }
      }

      // 如果拖动事件或者按下事件注册过,阻止默认事件
      if (self.pressHandler || self.dragHandler) {
        SlideUtils.cancelEvent(evt);
      }

      if (!IE8 || !ieCapturingAny) {
        captureMouse();
        ieCapturingAny = true;
        ieTrackersCapturing = [ieSelf];
      } else if (IE8) {
        ieTrackersCapturing.push(ieSelf);
      }
    }

    // 跟踪监听鼠标抬起事件
    function onMouseUp(evt) {
      evt = SlideUtils.getEvent(evt);

      // don't consider right-clicks (fortunately this is cross-browser)
      if (evt.button === 2) {
        return;
      }

      var insideElmtPress = buttonDownElmt,
        insideElmtRelease = insideElmt;
      buttonDownElmt = false;

      if (typeof self.releaseHandler === "function") {
        try {
          self.releaseHandler(self, getMsRelative(evt, elmt),
            insideElmtPress, insideElmtRelease);
        } catch (err) {
          SlideDebug.error(err.name + " while executing release handler: " +
            err.message, err);
        }
      }

      // 响应点击事件
      if (insideElmtPress && insideElmtRelease) {
        handleMouseClick(evt);
      }
    }

    // 有些浏览器不响应click事件，所以在mouseup中添加click处理
    function handleMouseClick(evt) {
      evt = SlideUtils.getEvent(evt);

      // don't consider right-clicks (fortunately this is cross-browser)
      if (evt.button === 2) {
        return;
      }

      var time = new Date().getTime() - lastMouseDownTime,
        point = getMsAbsolute(evt),
        distance = lastMouseDownPoint.distanceTo(point),
        quick = time <= SlideConfig.clickTimeThreshold &&
          distance <= SlideConfig.clickDistThreshold;

      if (typeof self.clickHandler === "function") {
        try {
          self.clickHandler(self, getMsRelative(evt, elmt), quick, evt.shiftKey);
        } catch (err) {
          SlideDebug.error(err.name + " while executing click handler: " +
            err.message, err);
        }
      }
    }

    // 跟踪监听鼠标点击click事件
    function onMouseClick(evt) {
      // 已经在mouseup中触发过了

      if (self.clickHandler) {
        SlideUtils.cancelEvent(evt);
      }
    }

    // 跟踪监听鼠标滚轮滚动事件
    function onMouseScroll(evt) {
      evt = SlideUtils.getEvent(evt);

      if (typeof self.scrollHandler === "function") {
        var delta = SlideUtils.getMouseScroll(evt);

        if (delta) {
          try {
            self.scrollHandler(self, getMsRelative(evt, elmt), delta, evt.shiftKey);
          } catch (err) {
            SlideDebug.error(err.name + " while executing scroll handler: " +
              err.message, err);
          }
        }

        SlideUtils.cancelEvent(evt);
      }
    }

    /**
     * Only triggered once by the deepest element that initially received
     * the mouse down event. We want to make sure THIS event doesn't bubble.
     * Instead, we want to trigger the elements that initially received the
     * mouse down event (including this one) only if the mouse is no longer
     * inside them. Then, we want to release capture, and emulate a regular
     * mouseup on the event that this event was meant for.
     */
    function onMouseUpIE(evt) {
      evt = SlideUtils.getEvent(evt);

      // don't consider right-clicks (fortunately this is cross-browser)
      if (evt.button === 2) {
        return;
      }

      // first trigger those that were capturing
      for (var i = 0; i < ieTrackersCapturing.length; i++) {
        var tracker = ieTrackersCapturing[i];

        if (tracker.hasMouse()) {
          tracker.onMouseUp(evt);
        }
      }

      // then release capture and emulate a regular evt
      releaseMouse();

      ieCapturingAny = false;
      evt.srcElement.fireEvent("on" + evt.type, document.createEventObject(evt));

      // // make sure to stop this evt -- shouldn't bubble up
      SlideUtils.stopEvent(evt);
    }

    /**
     * Only triggered once by the deepest element that initially received
     * the mouse down event. Since no other element has captured the mouse,
     * we want to trigger the elements that initially received the mouse
     * down event (including this one).
     */
    function onMouseMoveIE(evt) {
      // manually trigger those that are capturing
      for (var i = 0; i < ieTrackersCapturing.length; i++) {
        ieTrackersCapturing[i].onMouseMove(evt);
      }

      // make sure to stop this evt -- shouldn't bubble up. note that at
      // the time of this writing, there is no harm in letting it bubble,
      // but a minor change to our implementation would necessitate this.
      SlideUtils.stopEvent(evt);
    }

    /**
     * Only triggered in W3C browsers by elements within which the mouse was
     * initially pressed, since they are now listening to the window for
     * mouseup during the capture phase. We shouldn't handle the mouseup
     * here if the mouse is still inside this element, since the regular
     * mouseup handler will still fire.
     */
    function onMouseUpWindow(evt) {
      if (!insideElmt) {
        onMouseUp(evt);
      }

      releaseMouse();
    }

    function onMouseMove(evt) {
      evt = SlideUtils.getEvent(evt);

      var point = getMsAbsolute(evt),
        delta = point.minus(lastPoint);

      lastPoint = point;

      if (typeof self.dragHandler === "function") {
        try {
          self.dragHandler(self, getMsRelative(evt, elmt), delta, evt.shiftKey);
        } catch (err) {
          SlideDebug.error(err.name + " while executing drag handler: " +
            err.message, err);
        }

        // since a drag handler was registered, don't allow highlighting, etc.
        SlideUtils.cancelEvent(evt);
      }
    }

    // Public Methods

    // 是否在跟踪监听鼠标
    this.isTracking = function () {
      return tracking;
    };

    // 设置开始结束跟踪监听鼠标
    this.setTracking = function (enable) {
      if (enable) {
        startTracking();
      } else {
        stopTracking();
      }
    };
  };
})();

/**
 * Pathology - 1.0.0
 * @email v
 * @author 
 */

var SlidePoint = Slide.Point;

(function () {
  if (SlidePoint) {
    return;
  }

  SlidePoint = Slide.Point = function (x, y) {
    // Properties
    this.x = typeof x === "number" ? x : 0;
    this.y = typeof y === "number" ? y : 0;
  };

  var prototype = SlidePoint.prototype;

  // 两点相加返回一个新的点对象
  prototype.plus = function (point) {
    return new SlidePoint(this.x + point.x, this.y + point.y);
  };

  // 两点相减返回一个新的点对象
  prototype.minus = function (point) {
    return new SlidePoint(this.x - point.x, this.y - point.y);
  };

  // 点x，y同时乘factor，返回一个新的点对象
  prototype.times = function (factor) {
    return new SlidePoint(this.x * factor, this.y * factor);
  };

  // 点x，y同时除factor，返回一个新的点对象
  prototype.divide = function (factor) {
    return new SlidePoint(this.x / factor, this.y / factor);
  };

  prototype.multiPoint = function (point) {
    return new SlidePoint(this.x * point.x, this.y * point.y);
  };

  prototype.dividePoint = function (point) {
    if (point.x !== 0 && point.y !== 0) {
      return new SlidePoint(this.x / point.x, this.y / point.y);
    }
  };

  // 对点x，y同时取负数，返回一个新的点对象
  prototype.negate = function () {
    return new SlidePoint(-this.x, -this.y);
  };

  // 返回两点之间的距离
  prototype.distanceTo = function (point) {
    return Math.sqrt(Math.pow(this.x - point.x, 2) + Math.pow(this.y - point.y, 2));
  };

  // 对点应用函数处理，处理后返回一个新的点对象
  prototype.apply = function (func) {
    if (typeof func === "function") {
      return new SlidePoint(func(this.x), func(this.y));
    }

    return new SlidePoint(this.x, this.y);
  };

  // 判断两个点是否相等，相等返回true
  prototype.equals = function (point) {
    if (point instanceof SlidePoint) {
      // 不用===，应对1.0 与1相等的情况
      if (this.x == point.x && this.y == point.y) {
        return true;
      }
    }

    return false;
  };

  // 点转换为字符串
  prototype.toString = function () {
    return "(" + this.x + "," + this.y + ")";
  };
})();

/**
 * Pathology - 1.0.0
 * @email v
 * @author 
 */

// 效能分析器
var SlideProfiler = Slide.Profiler = function () {
  // Fields
  var self = this,

    midUpdate = false,
    numUpdates = 0,

    lastBeginTime = null,
    lastEndTime = null,

    minUpdateTime = Infinity,
    avgUpdateTime = 0,
    maxUpdateTime = 0,

    minIdleTime = Infinity,
    avgIdleTime = 0,
    maxIdleTime = 0;

  // Public Methods
  // Methods -- UPDATE TIME ACCESSORS

  this.getAvgUpdateTime = function () {
    return avgUpdateTime;
  };

  this.getMinUpdateTime = function () {
    return minUpdateTime;
  };

  this.getMaxUpdateTime = function () {
    return maxUpdateTime;
  };

  // Methods -- IDLING TIME ACCESSORS

  this.getAvgIdleTime = function () {
    return avgIdleTime;
  };

  this.getMinIdleTime = function () {
    return minIdleTime;
  };

  this.getMaxIdleTime = function () {
    return maxIdleTime;
  };

  // Methods -- GENERAL ACCESSORS

  this.isMidUpdate = function () {
    return midUpdate;
  };

  this.getNumUpdates = function () {
    return numUpdates;
  };

  // Methods -- MODIFIERS

  this.beginUpdate = function () {
    if (midUpdate) {
      self.endUpdate();
    }

    midUpdate = true;
    lastBeginTime = new Date().getTime();

    if (numUpdates < 1) {
      // this is the first update
      return;
    }

    var time = lastBeginTime - lastEndTime;
    avgIdleTime = (avgIdleTime * (numUpdates - 1) + time) / numUpdates;

    if (time < minIdleTime) {
      minIdleTime = time;
    }

    if (time > maxIdleTime) {
      maxIdleTime = time;
    }
  };

  this.endUpdate = function () {
    if (!midUpdate) {
      return;
    }

    lastEndTime = new Date().getTime();
    midUpdate = false;
    var time = lastEndTime - lastBeginTime;
    numUpdates++;
    avgUpdateTime = (avgUpdateTime * (numUpdates - 1) + time) / numUpdates;

    if (time < minUpdateTime) {
      minUpdateTime = time;
    }

    if (time > maxUpdateTime) {
      maxUpdateTime = time;
    }
  };

  this.clearProfile = function () {
    midUpdate = false;
    numUpdates = 0;

    lastBeginTime = null;
    lastEndTime = null;

    minUpdateTime = Infinity;
    avgUpdateTime = 0;
    maxUpdateTime = 0;

    minIdleTime = Infinity;
    avgIdleTime = 0;
    maxIdleTime = 0;
  };
};

/**
 * Pathology - 1.0.0
 * @email v
 * @author 
 */

var SlideRect = Slide.Rect;

(function () {
  if (SlideRect) {
    return;
  }

  SlideRect = Slide.Rect = function (x, y, width, height) {
    // Properties
    this.x = typeof x === "number" ? x : 0;
    this.y = typeof y === "number" ? y : 0;
    this.width = typeof width === "number" ? width : 0;
    this.height = typeof height === "number" ? height : 0;
  };

  var prototype = SlideRect.prototype;

  // 获取矩形区域宽高比
  prototype.getAspectRatio = function () {
    return this.width / this.height;
  };

  // 获取矩形区域左上角点
  prototype.getTopLeft = function () {
    return new SlidePoint(this.x, this.y);daguyo
  };

  // 获取矩形区域右下角点
  prototype.getBottomRight = function () {
    return new SlidePoint(this.x + this.width, this.y + this.height);
  };

  // 获取矩形区域中心点
  prototype.getCenter = function () {
    return new SlidePoint(this.x + this.width / 2.0, this.y + this.height / 2.0);
  };

  // 获取矩形区域的尺寸
  prototype.getSize = function () {
    return new SlidePoint(this.width, this.height);
  };

  // 判断两个矩形区域是否相等
  prototype.equals = function (rect) {
    if (rect instanceof SlideRect) {
      if (this.x == rect.x && this.y == rect.y &&
        this.width == rect.width && this.height == rect.height) {
        return true;
      }
    }

    return false;
  };

  // 矩形区域转换为字符串
  prototype.toString = function () {
    return "[" + this.x + "," + this.y + "," + this.width + "x" + this.height + "]";
  };
})();

/**
 * Pathology - 1.0.0
 * @email v
 * @author 
 */

var SlideSpring = Slide.Spring = function (initialValue) {
  // Fields
  var currentValue = (typeof(initialValue) == "number" ? initialValue : 0),
    startValue = currentValue,
    targetValue = currentValue,

    currentTime = new Date().getTime(),  // always work in milliseconds
    startTime = currentTime,
    targetTime = currentTime;

  // Private Methods

  function transform(x) {
    var s = SlideConfig.springStiffness;
    return (1.0 - Math.exp(-x * s) / (1.0 - Math.exp(-s)));
  }

  // Public Methods

  // 返回当前值
  this.getCurrent = function () {
    return currentValue;
  };

  // 返回动画的目标值
  this.getTarget = function () {
    return targetValue;
  };

  // 重置到指定的target目标值
  this.resetTo = function (target) {
    targetValue = target;
    targetTime = currentTime;
    startValue = targetValue;
    startTime = targetTime;
  };

  // 转换指定的到目标值
  this.springTo = function (target) {
    startValue = currentValue;
    startTime = currentTime;
    targetValue = target;
    targetTime = startTime + 1000 * SlideConfig.animationTime;
  };

  // 延长值
  this.shiftBy = function (delta) {
    startValue += delta;
    targetValue += delta;
  };

  // 更新值
  this.update = function () {
    currentTime = new Date().getTime();

    if (currentTime >= targetTime) {
      currentValue = targetValue;
    } else {
      currentValue = startValue + (targetValue - startValue) *
        transform((currentTime - startTime) / (targetTime - startTime));
    }
  };
};

/**
 * Pathology - 1.0.0
 * @email v
 * @author 
 */

var SlideStrings = Slide.Strings;

(function () {
  if (SlideStrings) {
    return;
  }

  SlideStrings = Slide.Strings = {
    Errors: {
      Failure: "Sorry, but Seadragon Ajax can't run on your browser!\n" +
        "Please try using IE 8 or Firefox 3.\n",
      Dzc: "Sorry, we don't support Deep Zoom Collections!",
      Dzi: "Hmm, this doesn't appear to be a valid Deep Zoom Image.",
      Xml: "Hmm, this doesn't appear to be a valid Deep Zoom Image.",
      Empty: "You asked us to open nothing, so we did just that.",
      ImageFormat: "Sorry, we don't support {0}-based Deep Zoom Images.",
      Security: "It looks like a security restriction stopped us from " +
        "loading this Deep Zoom Image.",
      Status: "This space unintentionally left blank ({0} {1}).",
      Unknown: "Whoops, something inexplicably went wrong. Sorry!"
    },
    Messages: {
      Loading: "Loading..."
    },
    Tooltips: {
      FullPage: "Toggle full page",
      Home: "Go home",
      ZoomIn: "Zoom in (you can also use your mouse's scroll wheel)",
      ZoomOut: "Zoom out (you can also use your mouse's scroll wheel)",
      slideSpin: "Spin slide image",
      slidePan: "pan slide image",
      PrevSlide: "",
      NextSlide: ""
    }
  };

  SlideStrings.getString = function(prop) {
    var props = prop.split('.'),
      string = SlideStrings;

    // get property, which may contain dots, meaning subproperty
    for (var i = 0; i < props.length; i++) {
      // in case not a subproperty
      string = string[props[i]] || {};
    }

    // in case the string didn't exist
    if (typeof(string) != "string") {
      string = "";
    }

    // regular expression and lambda technique from:
    // http://frogsbrain.wordpress.com/2007/04/28/javascript-stringformat-method/#comment-236
    var args = arguments;

    return string.replace(/\{\d+\}/g, function(capture) {
      var i = parseInt(capture.match(/\d+/)) + 1;
      return i < args.length ? args[i] : "";
    });
  };

  SlideStrings.setString = function(prop, value) {
    var props = prop.split('.'),
      container = SlideStrings;

    // get property's container, up to but not after last dot
    for (var i = 0; i < props.length - 1; i++) {
      if (!container[props[i]]) {
        container[props[i]] = {};
      }

      container = container[props[i]];
    }

    container[props[i]] = value;
  };
})();

/**
 * Pathology - 1.0.0
 * @email v
 * @author 
 */

    var SlideUi = Slide.Ui;

(function () {
    SlideUi = Slide.Ui = function (viewer) {
        // Fields
        var groupTL = null,
            groupBL = null,

            isShowSwitchBtn = true,
            switchBtnWidth = 42,

        // top left SlideButton group
            home = "home",
            fullPage = "fullpage",
            zoomIn = "zoomin",
            zoomOut = "zoomout",

            zooming = false,    // whether we should be continuously zooming
            zoomFactor = null,  // how much we should be continuously zooming by
            lastZoomTime = null,

        // bottom left SlideButton group
            slideSpin = "slidespin",
            slidePan = "slidepan",

            slidePrev = "slideprev",
            slideNext = "slidenext",

            NORMAL = "normal",
            FOCUS = "focus",
            HOVER = "hover",
            DOWN = "down",
            HOLD = "hold";

        var homeBtn = new SlideButton({
                tooltip: SlideStrings.getString("Tooltips.Home"),
                srcNormal: SlideUtils.iconUrl(home, NORMAL),
                srcFocus: SlideUtils.iconUrl(home, FOCUS),
                srcHover: SlideUtils.iconUrl(home, HOVER),
                srcDown: SlideUtils.iconUrl(home, DOWN),
                onRelease: onHome
            }),
            fullPageBtn = new SlideButton({
                tooltip: SlideStrings.getString("Tooltips.FullPage"),
                srcNormal: SlideUtils.iconUrl(fullPage, NORMAL),
                srcFocus: SlideUtils.iconUrl(fullPage, FOCUS),
                srcHover: SlideUtils.iconUrl(fullPage, HOVER),
                srcDown: SlideUtils.iconUrl(fullPage, DOWN),
                onRelease: onFullPage
            }),
            zoomInBtn = new SlideButton({
                tooltip: SlideStrings.getString("Tooltips.ZoomIn"),
                srcNormal: SlideUtils.iconUrl(zoomIn, NORMAL),
                srcFocus: SlideUtils.iconUrl(zoomIn, FOCUS),
                srcHover: SlideUtils.iconUrl(zoomIn, HOVER),
                srcDown: SlideUtils.iconUrl(zoomIn, DOWN),
                onPress: beginZoomingIn,
                onRelease: endZooming,
                onClick: doSingleZoomIn,
                onEnter: beginZoomingIn,
                onExit: endZooming
            }),
            zoomOutBtn = new SlideButton({
                tooltip: SlideStrings.getString("Tooltips.ZoomOut"),
                srcNormal: SlideUtils.iconUrl(zoomOut, NORMAL),
                srcFocus: SlideUtils.iconUrl(zoomOut, FOCUS),
                srcHover: SlideUtils.iconUrl(zoomOut, HOVER),
                srcDown: SlideUtils.iconUrl(zoomOut, DOWN),
                onPress: beginZoomingOut,
                onRelease: endZooming,
                onClick: doSingleZoomOut,
                onEnter: beginZoomingOut,
                onExit: endZooming
            }),

            slideSpinBtn = new SlideButton({
                canHold: true,
                tooltip: SlideStrings.getString("Tooltips.slideSpin"),
                srcNormal: SlideUtils.iconUrl(slideSpin, NORMAL),
                srcFocus: SlideUtils.iconUrl(slideSpin, FOCUS),
                srcHover: SlideUtils.iconUrl(slideSpin, HOVER),
                srcDown: SlideUtils.iconUrl(slideSpin, DOWN),
                srcHold: SlideUtils.iconUrl(slideSpin, HOLD),
                onPress: onSlideSpin
            }),
            slidePanBtn = new SlideButton({
                canHold: true,
                tooltip: SlideStrings.getString("Tooltips.slidePan"),
                srcNormal: SlideUtils.iconUrl(slidePan, NORMAL),
                srcFocus: SlideUtils.iconUrl(slidePan, FOCUS),
                srcHover: SlideUtils.iconUrl(slidePan, HOVER),
                srcDown: SlideUtils.iconUrl(slidePan, DOWN),
                srcHold: SlideUtils.iconUrl(slidePan, HOLD),
                onPress: onSlidePan
            }),

            prevBtn = new SlideButton({
                tooltip: SlideStrings.getString("Tooltips.PrevSlide"),
                srcNormal: SlideUtils.iconUrl(slidePrev, NORMAL),
                srcFocus: SlideUtils.iconUrl(slidePrev, FOCUS),
                srcHover: SlideUtils.iconUrl(slidePrev, HOVER),
                srcDown: SlideUtils.iconUrl(slidePrev, DOWN),
                onRelease: onPrevSlide
            }),
            nextBtn = new SlideButton({
                tooltip: SlideStrings.getString("Tooltips.NextSlide"),
                srcNormal: SlideUtils.iconUrl(slideNext, NORMAL),
                srcFocus: SlideUtils.iconUrl(slideNext, FOCUS),
                srcHover: SlideUtils.iconUrl(slideNext, HOVER),
                srcDown: SlideUtils.iconUrl(slideNext, DOWN),
                onRelease: onNextSlide
            });

        groupTL = new SlideButtonGroup([homeBtn, fullPageBtn, zoomInBtn, zoomOutBtn]);
        groupTL.elmt[viewer.SIGNAL] = true;   // hack to get our controls to fade

        slideSpinBtn.setHoldState();
        groupBL = new SlideButtonGroup([slideSpinBtn, slidePanBtn]);
        groupBL.elmt[viewer.SIGNAL] = true;
        groupBL.elmt.style.marginLeft = "4px";
        groupBL.elmt.style.marginBottom = "4px";
        viewer.addControl(groupBL.elmt, SlideControlAnchor.BOTTOM_LEFT);


        var containerSize = viewer.viewport.getContainerSize(),
            groupPrev = new SlideButtonGroup([prevBtn, nextBtn]);
        groupPrev.elmt[viewer.SIGNAL] = true;
        prevBtn.elmt.position = "absolute";
        prevBtn.elmt.style.left = "4px";

        prevBtn.elmt.style.top = parseInt(containerSize.y / 2) - switchBtnWidth + "px";
        nextBtn.elmt.position = "absolute";
        nextBtn.elmt.style.left = containerSize.x - switchBtnWidth * 4 - 4 + "px";
        nextBtn.elmt.style.top = parseInt(containerSize.y / 2) - switchBtnWidth + "px";
        if (viewer.isMulti === false) {
            //prevBtn.elmt.style.display = "none";
            //nextBtn.elmt.style.display = "none";
            //groupBL.elmt.style.display = "none";
        }
        viewer.addControl(groupPrev.elmt, SlideControlAnchor.NONE);

        viewer.addEventListener("open", lightUp);
        viewer.addEventListener("resize", resize);

        // Private methods

        // 显示group
        function lightUp() {
            groupTL.emulateEnter();
            groupTL.emulateExit();

            groupBL.emulateEnter();
            groupBL.emulateExit();
        }

        function resize() {
            var containerSize = viewer.viewport.getContainerSize();
            nextBtn.elmt.style.left = containerSize.x - switchBtnWidth * 4 - 4 + "px";

            resetPositionSlideBtn();
        }

        // 回到初始位置
        function onHome() {
            if (viewer.viewport) {
                viewer.viewport.panTo(viewer.viewport.getHomeCenter(), true);
                window.setTimeout(function () {
                    viewer.viewport.goHome();
                }, 10);
            }
        }

        // 全页显示
        function onFullPage() {
            viewer.setFullPage(!viewer.isFullPage());

            groupTL.emulateExit();
            groupBL.emulateExit();
            resetPositionSlideBtn();

            if (viewer.viewport) {
                viewer.viewport.applyConstraints();
            }
        }

        // Zoom function
        function beginZoomingIn() {
            lastZoomTime = new Date().getTime();
            zoomFactor = SlideConfig.zoomPerSecond;
            zooming = true;
            scheduleZoom();
        }

        function beginZoomingOut() {
            lastZoomTime = new Date().getTime();
            zoomFactor = 1.0 / SlideConfig.zoomPerSecond;
            zooming = true;
            scheduleZoom();
        }

        function endZooming() {
            zooming = false;
        }

        function scheduleZoom() {
            window.setTimeout(doZoom, 10);
        }

        function doZoom() {
            if (zooming && viewer.viewport) {
                var currentTime = new Date().getTime(),
                    deltaTime = currentTime - lastZoomTime,
                    adjustedFactor = Math.pow(zoomFactor, deltaTime / 1000);

                viewer.viewport.zoomBy(adjustedFactor);
                viewer.viewport.applyConstraints();
                lastZoomTime = currentTime;
                scheduleZoom();
            }
        }

        function doSingleZoomIn() {
            if (viewer.viewport) {
                zooming = false;
                viewer.viewport.zoomBy(SlideConfig.zoomPerClick / 1.0);
                viewer.viewport.applyConstraints();
            }
        }

        function doSingleZoomOut() {
            if (viewer.viewport) {
                zooming = false;
                viewer.viewport.zoomBy(1.0 / SlideConfig.zoomPerClick);
                viewer.viewport.applyConstraints();
            }
        }

        function onSlideSpin() {
            slidePanBtn.resetState();

            if (!viewer.isSwitchSlide()) {
                viewer.setSwitchSlide(true);
            }
        }

        function onSlidePan() {
            slideSpinBtn.resetState();

            if (viewer.isSwitchSlide()) {
                viewer.setSwitchSlide(false);
            }
        }

        function onPrevSlide() {
            if (viewer.viewport) {
                var viewport = viewer.viewport,
                    index = viewport.getSlide() - 1;

                if (index < 0) {
                    index = viewer.source.number - 1;
                }

                viewport.slideTo(index, true);
            }
        }

        function onNextSlide() {
            if (viewer.viewport) {
                var viewport = viewer.viewport,
                    index = viewport.getSlide() + 1;

                if (index >= viewer.source.number) {
                    index = 0;
                }

                viewport.slideTo(index, true);
            }
        }

        function resetPositionSlideBtn() {
            if (viewer.viewport) {
                var containerSize = viewer.viewport.getContainerSize();
                prevBtn.elmt.style.left = "4px";
                prevBtn.elmt.style.top = parseInt(containerSize.y / 2) - 42 + "px";
                nextBtn.elmt.style.left = containerSize.x - 84 * 2 - 4 + "px";
                nextBtn.elmt.style.top = parseInt(containerSize.y / 2) - 42 + "px";
            }
        }

        // Public methods

        this.addNavControl = function () {
            var elmt = groupTL.elmt;

            elmt.style.marginLeft = "4px";
            elmt.style.marginTop = "4px";

            viewer.addControl(elmt, SlideControlAnchor.TOP_LEFT);
        };

        this.removeNavControl = function () {
            if (groupTL) {
                viewer.removeControl(groupTL.elmt);
            }
        };

        this.setSwitchBtnEnabel = function (enable) {
            if (typeof enable === "boolean" && enable === true) {

                viewer.addControl(groupPrev.elmt, SlideControlAnchor.NONE);
                viewer.addControl(groupBL.elmt, SlideControlAnchor.BOTTOM_LEFT);
            } else if(typeof enable === "boolean" && enable === false){
                viewer.removeControl(groupPrev.elmt);
                viewer.removeControl(groupBL.elmt);

            }
        };


    };
})();

/**
 * Pathology - 1.0.0
 * @email v
 * @author 
 */

var SlideViewport = Slide.Viewport;

(function () {
  SlideViewport = Slide.Viewport = function (containerSize, contentSize) {
    // Fields
    var self = this,

      contentAspect = contentSize.x / contentSize.y,
      contentHeight = contentSize.y / contentSize.x,

      slideSpring = new SlideSpring(0),
      centerSpringX = new SlideSpring(0),
      centerSpringY = new SlideSpring(0),
      zoomSpring = new SlideSpring(SlideConfig.logarithmicZoom ? 0 : 1),
      zoomPoint = null,

      homeBounds = new SlideRect(0, 0, 1, contentHeight),
      homeCenter = homeBounds.getCenter(),

      LN2 = Math.LN2;

    containerSize = new SlidePoint(containerSize.x, containerSize.y);

    // Private Methods

    // 返回2的x次幂
    function pow2(x) {
      return Math.pow(2, x);
    }

    // 返回x是2的几次幂
    function log2(x) {
      return Math.log(x) / LN2;
    }

    function clamp(x, min, max) {
      return Math.min(Math.max(x, min), max);
    }

    function clampPointToRect(point, rect) {
      var xOld = point.x,
        yOld = point.y,
        xNew = clamp(xOld, rect.x, rect.x + rect.width),
        yNew = clamp(yOld, rect.y, rect.y + rect.height);

      return (xOld === xNew && yOld === yNew) ? point : new SlidePoint(xNew, yNew);
    }

    function getCenterConstraintRect(current) {
      var zoom = self.getZoom(current),
        width = 1.0 / zoom,
        height = width / self.getAspectRatio(),
        visibilityRatio = SlideConfig.visibilityRatio,
        xMin = (visibilityRatio - 0.5) * width,
        yMin = (visibilityRatio - 0.5) * height,
        xDelta = 1.0 - 2 * xMin,
        yDelta = contentHeight - 2 * yMin;

      if (xDelta < 0) {
        xMin += (0.5 * xDelta);
        xDelta = 0;
      }

      if (yDelta < 0) {
        yMin += (0.5 * yDelta);
        yDelta = 0;
      }

      return new SlideRect(xMin, yMin, xDelta, yDelta);
    }

    // Public Methods
    // MODIFIERS

    // 转到初始位置
    this.goHome = function (immediately) {
      // calculate center adjusted for zooming
      var center = self.getCenter();

      // if we're wrapping horizontally, "unwind" the horizontal spring
      if (SlideConfig.wrapHorizontal) {
        // this puts center.x into the range [0, 1) always
        center.x = (1 + (center.x % 1)) % 1;
        centerSpringX.resetTo(center.x);
        centerSpringX.update();
      }

      // if we're wrapping vertically, "unwind" the vertical spring
      if (SlideConfig.wrapVertical) {
        // this puts center.y into the range e.g. [0, 0.75) always
        center.y = (contentHeight + (center.y % contentHeight)) % contentHeight;
        centerSpringY.resetTo(center.y);
        centerSpringY.update();
      }

      self.fitBounds(homeBounds, immediately);
    };

    // 缩放移动到新的边界
    this.fitBounds = function (bounds, immediately) {
      var aspect = self.getAspectRatio(),
        center = bounds.getCenter(),

        // resize bounds to match viewport's aspect ratio, maintaining center.
        // note that zoom = 1 / width, and width = height * aspect.
        newBounds = new SlideRect(bounds.x, bounds.y, bounds.width, bounds.height);

      if (newBounds.getAspectRatio() >= aspect) {
        // width is bigger relative to viewport, resize height
        newBounds.height = bounds.width / aspect;
        newBounds.y = center.y - newBounds.height / 2;
      } else {
        // height is bigger relative to viewport, resize width
        newBounds.width = bounds.height * aspect;
        newBounds.x = center.x - newBounds.width / 2;
      }

      // stop movement first! this prevents the operation from missing
      self.panTo(self.getCenter(true), true);
      self.zoomTo(self.getZoom(true), null, true);

      var oldBounds = self.getBounds(),
        oldZoom = self.getZoom(),
        newZoom = 1.0 / newBounds.width;

      if (newZoom == oldZoom || newBounds.width == oldBounds.width) {
        self.panTo(center, immediately);
        return;
      }

      var refPoint = oldBounds.getTopLeft().
          times(containerSize.x / oldBounds.width).
          minus(newBounds.getTopLeft().times(containerSize.x / newBounds.width)).
          divide(containerSize.x / oldBounds.width - containerSize.x / newBounds.width);

      // note: that last line (cS.x / oldB.w - cS.x / newB.w) was causing a
      // divide by 0 in the case that oldBounds.width == newBounds.width.
      // that should have been picked up by the zoom check, but in certain
      // cases, the math is slightly off and the zooms are different. so now,
      // the zoom check has an extra check added.
      self.zoomTo(newZoom, refPoint, immediately);
    };

    // 平移到中心点
    this.panTo = function (center, immediately) {
      if (immediately) {
        centerSpringX.resetTo(center.x);
        centerSpringY.resetTo(center.y);
        return;
      }

      if (!zoomPoint) {
        centerSpringX.springTo(center.x);
        centerSpringY.springTo(center.y);
        return;
      }

      // 目标倍数的边界
      var zoom = self.getZoom(),
        width = 1.0 / zoom,
        height = width / self.getAspectRatio(),
        x = centerSpringX.getCurrent() - width / 2.0,
        y = centerSpringY.getCurrent() - height / 2.0,
        bounds = new SlideRect(x, y, width, height);

      var oldZoomPixel = self.pixelFromPoint(zoomPoint, true),
        newZoomPixel = zoomPoint.minus(bounds.getTopLeft()).
          times(containerSize.x / bounds.width),
        deltaZoomPixels = newZoomPixel.minus(oldZoomPixel),
        deltaZoomPoints = deltaZoomPixels.divide(containerSize.x * zoom),

        // finally, shift center to negate the change.
        centerTarget = center.minus(deltaZoomPoints);

      centerSpringX.springTo(centerTarget.x);
      centerSpringY.springTo(centerTarget.y);
    };

    // 以refPoint为中心点缩放到指定倍数
    this.zoomTo = function (zoom, refPoint, immediately) {
      if (immediately) {
        zoomSpring.resetTo(SlideConfig.logarithmicZoom ? log2(zoom) : zoom);
      } else {
        zoomSpring.springTo(SlideConfig.logarithmicZoom ? log2(zoom) : zoom);
      }

      zoomPoint = refPoint instanceof SlidePoint ? refPoint : null;
    };

    this.slideTo = function (index, immediately) {
      if (immediately) {
        slideSpring.resetTo(index);
      } else {
        slideSpring.springTo(index);
      }
    };

    this.panBy = function (delta, immediately) {
      self.panTo(self.getCenter().plus(delta), immediately);
    };

    this.zoomBy = function (factor, refPoint, immediately) {
      self.zoomTo(self.getZoom() * factor, refPoint, immediately);
    };

    this.slideBy = function (delta, immediately) {
      self.slideTo(self.getSlide() + delta, immediately);
    };

    // 根据值是否变化返回是否要更新 true: 更新 false: 不更新
    this.update = function () {
      var oldCenterX = centerSpringX.getCurrent(),
        oldCenterY = centerSpringY.getCurrent(),
        oldZoom = zoomSpring.getCurrent(), oldZoomPixel,
        oldSlide = slideSpring.getCurrent();

      // remember position of zoom point
      if (zoomPoint) {
        oldZoomPixel = self.pixelFromPoint(zoomPoint, true);
      }

      // now update zoom only, don't update pan yet
      zoomSpring.update();

      if (zoomPoint && zoomSpring.getCurrent() !== oldZoom) {
        var newZoomPixel = self.pixelFromPoint(zoomPoint, true),
          deltaZoomPixels = newZoomPixel.minus(oldZoomPixel),
          deltaZoomPoints = self.deltaPointsFromPixels(deltaZoomPixels, true);

        // shift pan to negate the change
        centerSpringX.shiftBy(deltaZoomPoints.x);
        centerSpringY.shiftBy(deltaZoomPoints.y);
      } else {
        zoomPoint = null;
      }

      centerSpringX.update();
      centerSpringY.update();

      slideSpring.update();

      return centerSpringX.getCurrent() !== oldCenterX ||
        centerSpringY.getCurrent() !== oldCenterY ||
        zoomSpring.getCurrent() !== oldZoom ||
        slideSpring.getCurrent() !== oldSlide;
    };

    // 视图窗口尺寸改变
    this.resize = function (newContainerSize, maintain) {
      var oldBounds = self.getBounds(),
        newBounds = oldBounds,
        widthDeltaFactor = newContainerSize.x / containerSize.x;

      // update container size, but make copy first
      containerSize = new SlidePoint(newContainerSize.x, newContainerSize.y);

      if (maintain) {
        newBounds.width = oldBounds.width * widthDeltaFactor;
        newBounds.height = newBounds.width / self.getAspectRatio();
      }

      self.fitBounds(newBounds, true);
    };

    this.applyConstraints = function (immediately) {
      // first, apply zoom constraints
      var oldZoom = self.getZoom(),
        newZoom = clamp(oldZoom, self.getMinZoom(), self.getMaxZoom());

      if (oldZoom != newZoom) {
        self.zoomTo(newZoom, zoomPoint, immediately);
      }

      // then, apply pan constraints -- but do so via fitBounds() in order to
      // account for (and adjust) the zoom point! also ignore constraints if
      // content is being wrapped! but differentiate horizontal vs. vertical.
      var oldCenter = self.getCenter(),
        newCenter = clampPointToRect(oldCenter, getCenterConstraintRect());

      if (SlideConfig.wrapHorizontal) {
        newCenter.x = oldCenter.x;
      }

      if (SlideConfig.wrapVertical) {
        newCenter.y = oldCenter.y;
      }

      if (!oldCenter.equals(newCenter)) {
        var width = 1.0 / newZoom,
          height = width / self.getAspectRatio(),
          x = newCenter.x - 0.5 * width,
          y = newCenter.y - 0.5 * height;

        self.fitBounds(new SlideRect(x, y, width, height), immediately);
      }
    };

    // 确保立即应用显示
    this.ensureVisible = function (immediately) {
      // for backwards compatibility
      self.applyConstraints(immediately);
    };

    // ACCESSORS

    // 获取中心点坐标
    this.getCenter = function (current) {
      var centerCurrent = new SlidePoint(centerSpringX.getCurrent(), centerSpringY.getCurrent()),
        centerTarget = new SlidePoint(centerSpringX.getTarget(), centerSpringY.getTarget());

      if (current) {
        return centerCurrent;
      } else if (!zoomPoint) {
        // no adjustment necessary since we're not zooming
        return centerTarget;
      }

      var zoom = self.getZoom(), // 获取目标倍数

        width = 1.0 / zoom,
        height = width / self.getAspectRatio(),
        x = centerCurrent.x - width * 0.5,
        y = centerCurrent.y - height * 0.5,

        bounds = new SlideRect(x, y, width, height);

      var oldZoomPixel = self.pixelFromPoint(zoomPoint, true),
        newZoomPixel = zoomPoint.minus(bounds.getTopLeft()).
          times(containerSize.x / bounds.width),

        // 距目标值的差值
        deltaZoomPixels = newZoomPixel.minus(oldZoomPixel),
        deltaZoomPoints = deltaZoomPixels.divide(containerSize.x * zoom);

      // finally, shift center to negate the change.
      return centerTarget.plus(deltaZoomPoints);
    };

    // 获取放大倍数
    this.getZoom = function (current) {
      if (current) {
        var zoom = zoomSpring.getCurrent();
        return SlideConfig.logarithmicZoom ? pow2(zoom) : zoom;
      } else {
        var zoom = zoomSpring.getTarget();
        return SlideConfig.logarithmicZoom ? pow2(zoom) : zoom;
      }
    };

    // 获取当前哪一张图像
    this.getSlide = function (current) {
      if (current) {
        return Math.abs(parseInt(slideSpring.getCurrent()));
      } else {
        return Math.abs(parseInt(slideSpring.getTarget()));
      }
    };

    // 获取当前容器的宽高比
    this.getAspectRatio = function () {
      return containerSize.x / containerSize.y;
    };

    // 返回当前倍数图像边界
    this.getBounds = function (current) {
      var center = self.getCenter(current),

        width = 1.0 / self.getZoom(current),
        height = width / self.getAspectRatio(),
        x = center.x - width * 0.5,
        y = center.y - height * 0.5;

      return new SlideRect(x, y, width, height);
    };

    this.getImageBounds = function (current) {
      // fit home bounds to viewport's aspect ratio, maintaining center.
      // this is the same logic as in fitBounds().
      var bounds = self.getBounds(current),
        center = self.getCenter(current),
        viewportAspect = self.getAspectRatio(),
        imgBounds = new SlideRect(bounds.x, bounds.y, bounds.width, bounds.height);

      if (contentAspect >= viewportAspect) {
        // width is bigger relative to viewport, resize height
        imgBounds.height = bounds.width / contentAspect;
        imgBounds.y = center.y - imgBounds.height / 2;
      } else {
        // height is bigger relative to viewport, resize width
        imgBounds.width = bounds.height * contentAspect;
        imgBounds.x = center.x - imgBounds.width / 2;
      }

      return imgBounds;
    };

    // 返回绘制窗口容器的尺寸
    this.getContainerSize = function () {
      return new SlidePoint(containerSize.x, containerSize.y);
    };

    // Constraint Helpers

    this.getMinZoom = function () {
      var zoom,
        homeZoom = self.getHomeZoom();

      // for backwards compatibility, respect minZoomDimension if present
      if (SlideConfig.minZoomDimension) {
        if (contentSize.x <= contentSize.y) {
          zoom = SlideConfig.minZoomDimension / containerSize.x;
        } else {
          zoom = SlideConfig.minZoomDimension / (containerSize.x * contentHeight);
        }
      } else {
        zoom = SlideConfig.minZoomImageRatio * homeZoom;
      }

      return Math.min(zoom, homeZoom);
    };

    this.getMaxZoom = function () {
      var zoom = contentSize.x * SlideConfig.maxZoomPixelRatio / containerSize.x;
      return Math.max(zoom, self.getHomeZoom());
    };

    this.getHomeZoom = function () {
      // if content is wider, we'll fit width, otherwise height
      var aspectFactor = contentAspect / self.getAspectRatio();
      return (aspectFactor >= 1) ? 1 : aspectFactor;
    };

    this.getMinCenter = function (current) {
      return getCenterConstraintRect(current).getTopLeft();
    };

    this.getMaxCenter = function (current) {
      return getCenterConstraintRect(current).getBottomRight();
    };

    this.getHomeCenter = function () {
      return homeCenter;
    };

    this.getHomeBounds = function () {
      // fit home bounds to viewport's aspect ratio, maintaining center.
      // this is the same logic as in fitBounds().
      var viewportAspect = self.getAspectRatio(),
        homeBoundsFit = new SlideRect(homeBounds.x, homeBounds.y,
          homeBounds.width, homeBounds.height);

      if (contentAspect >= viewportAspect) {
        // width is bigger relative to viewport, resize height
        homeBoundsFit.height = homeBounds.width / viewportAspect;
        homeBoundsFit.y = homeCenter.y - homeBoundsFit.height / 2;
      } else {
        // height is bigger relative to viewport, resize width
        homeBoundsFit.width = homeBounds.height * viewportAspect;
        homeBoundsFit.x = homeCenter.x - homeBoundsFit.width / 2;
      }

      return homeBoundsFit;
    };

    // CONVERSION HELPERS

    // 把point转换到图像坐标系中对象像素位置
    this.pixelFromPoint = function (point, current) {
      var bounds = self.getBounds(current);
      return point.minus(bounds.getTopLeft()).times(containerSize.x / bounds.width);
    };

    // 把pixel图像中像素位置转换坐标值
    this.pointFromPixel = function (pixel, current) {
      var bounds = self.getBounds(current);
      return pixel.divide(containerSize.x / bounds.width).plus(bounds.getTopLeft());
    };

    // 把相对于当前图像像素位置转换为点坐标
    this.deltaPointsFromPixels = function (deltaPixel, current) {
      return deltaPixel.divide(containerSize.x * self.getZoom(current));
    };

    // 把点差转换到相对当前图像尺寸中的像素位置
    this.deltaPixelsFromPoints = function (deltaPoint, current) {
      return deltaPoint.times(containerSize.x * self.getZoom(current));
    };

    // Constructor
    (function () {
      self.goHome(true);
      self.update();
    })();
  };
})();

/**
 * Pathology - 1.0.0
 * @email v
 * @author 
 */

var SlideViewer = Slide.Viewer;

(function () {
  // Constants
  var SIGNAL = "----seadragon----";

  // Class Viewer
  SlideViewer = Slide.Viewer = function (container) {
    // Fields
    var self = this,

      parent = SlideUtils.getElement(container),
      container = SlideUtils.makeNeutralElement("div"),
      canvas = SlideUtils.makeNeutralElement("div"),

      controlsTL = SlideUtils.makeNeutralElement("div"),
      controlsTR = SlideUtils.makeNeutralElement("div"),
      controlsBR = SlideUtils.makeNeutralElement("div"),
      controlsBL = SlideUtils.makeNeutralElement("div"),

      source = null,
      drawer = null,
      viewport = null,
      profiler = null,

      evtManage = new SlideEvtManage(),
      innerTracker = new SlideMouseTracker(canvas),
      outerTracker = new SlideMouseTracker(container),

      controls = [],
      controlsFadeDelay = 1000,   // begin fading after 1 second
      controlsFadeLength = 2000,  // fade over 2 second period
      controlsFadeBeginTime = null,
      controlsShouldFade = false,
      mouseInside = false,

      uiControl = null,

      bodyWidth = document.body.style.width,
      bodyHeight = document.body.style.height,
      bodyOverflow = document.body.style.overflow,
      docOverflow = document.documentElement.style.overflow,
      fsBoundsDelta = new SlidePoint(1, 1),

      prevContainerSize = null,

      lastOpenStartTime = 0,
      lastOpenEndTime = 0,

      mouseDownPixel = null,
      mouseDownCenter = null,
      mouseMoveDirect = 0,
      mouseMoveTimer = null,
      mouseDragSwitchSlide = true, // false: Switch image true: Drag image

      animating = false,
      forceRedraw = false;

    // Properties
    this.container = container;
    this.elmt = container;
    this.source = null;
    this.drawer = null;
    this.viewport = null;
    this.profiler = null;
    this.tracker = innerTracker;
    this.SIGNAL = SIGNAL;

    // Constructor
    (function () {
      initialize();
    })();

    // Private methods
    // Ui

    function initialize() {
      // copy style objects to improve perf
      var canvasStyle = canvas.style,
        containerStyle = container.style,
        controlsTLStyle = controlsTL.style,
        controlsTRStyle = controlsTR.style,
        controlsBRStyle = controlsBR.style,
        controlsBLStyle = controlsBL.style;

      canvasStyle.top = "0px";
      canvasStyle.left = "0px";
      canvasStyle.width = "100%";
      canvasStyle.height = "100%";
      canvasStyle.overflow = "hidden";
      canvasStyle.position = "absolute";

      containerStyle.width = "100%";
      containerStyle.height = "100%";
      containerStyle.position = "relative";
      containerStyle.left = "0px";
      containerStyle.top = "0px";
      containerStyle.textAlign = "left";

      // Control
      controlsTLStyle.position = "absolute";
      controlsTRStyle.position = "absolute";
      controlsBRStyle.position = "absolute";
      controlsBLStyle.position = "absolute";
      controlsTLStyle.top = controlsTRStyle.top = "0px";
      controlsTLStyle.left = controlsBLStyle.left = "0px";
      controlsTRStyle.right = controlsBRStyle.right = "0px";
      controlsBLStyle.bottom = controlsBRStyle.bottom = "0px";
      controlsBLStyle.zIndex = controlsBRStyle.zIndex = 1;
      controlsTLStyle.zIndex = controlsTRStyle.zIndex = 1;

      // mouse tracker handler for canvas (pan and zoom and switch)
      innerTracker.clickHandler = onCanvasClick;
      innerTracker.scrollHandler = onCanvasScroll;
      innerTracker.pressHandler = onCanvasPress;
      innerTracker.dragHandler = onCanvasDrag;
      innerTracker.releaseHandler = onCanvasRelease;
      innerTracker.setTracking(true);  // default state

      // mouse tracker handler for container (controls fading)
      outerTracker.enterHandler = onContainerEnter;
      outerTracker.exitHandler = onContainerExit;
      outerTracker.releaseHandler = onContainerRelease;
      outerTracker.setTracking(true);               // always tracking
      window.setTimeout(beginControlsAutoHide, 1);  // initial fade out

      //append to DOM only at end
      container.appendChild(canvas);
      container.appendChild(controlsTL);
      container.appendChild(controlsTR);
      container.appendChild(controlsBR);
      container.appendChild(controlsBL);

      parent.innerHTML = "";          // clear any existing content...
      parent.appendChild(container);  // ...then add the real container
    }

    function setMessage(msg) {
      var textNode = document.createTextNode(msg);

      canvas.innerHTML = "";
      canvas.appendChild(SlideUtils.makeCenteredNode(textNode));

      var textStyle = textNode.parentNode.style;

      // explicit styles for error message
      // textStyle.color = "white";
      // TEMP uncommenting this; very obtrusive
      textStyle.fontFamily = "verdana";
      textStyle.fontSize = "13px";
      textStyle.fontSizeAdjust = "none";
      textStyle.fontStyle = "normal";
      textStyle.fontStretch = "normal";
      textStyle.fontVariant = "normal";
      textStyle.fontWeight = "normal";
      textStyle.lineHeight = "1em";
      textStyle.textAlign = "center";
      textStyle.textDecoration = "none";
    }

    // Mouse interaction with canvas

    // 鼠标单击事件响应(缩放功能 点击放大, 按住shift单击缩小)
    function onCanvasClick(tracker, position, quick, shift) {
      // ignore clicks where mouse moved
      if (viewport && quick) {
        var zoomPerClk = SlideConfig.zoomPerClick,
          factor = shift ? 1.0 / zoomPerClk : zoomPerClk;

        viewport.zoomBy(factor, viewport.pointFromPixel(position, true));
        viewport.applyConstraints();
      }
    }

    // 鼠标滚轮事件响应(缩放功能)
    function onCanvasScroll(tracker, position, delta, shift) {
      if (viewport) {
        var factor = Math.pow(SlideConfig.zoomPerScroll, delta);
        viewport.zoomBy(factor, viewport.pointFromPixel(position, true));
        viewport.applyConstraints();
      }
    }

    // 鼠标按下事件响应(保存鼠标按下的位置及当前窗口的中心点)
    function onCanvasPress (tracker, position) {
      if (viewport) {
        mouseDownPixel = position;
        mouseDownCenter = viewport.getCenter();

        if (mouseDragSwitchSlide) {
          SlideUtils.setMouseCursor(canvas, SlideUtils.cursorUrl("closedhand"));
        } else {
          SlideUtils.setMouseCursor(canvas, SlideUtils.cursorUrl("closedhand360"));
        }
      }
    }

    // 鼠标拖动事件响应(用于拖动图像或者进行图像的旋转)
    function onCanvasDrag(tracker, position, delta, shift) {
      if (viewport) {
        if (mouseDragSwitchSlide) {
          if (SlideConfig.constrainDuringPan) {
            var deltaPixels = position.minus(mouseDownPixel),
              deltaPoints = viewport.deltaPointsFromPixels(deltaPixels.negate(), true);

            viewport.panTo(mouseDownCenter.plus(deltaPoints));
            viewport.applyConstraints();
          } else {
            viewport.panBy(viewport.deltaPointsFromPixels(delta.negate(), true));
          }
        } else {
          if (!mouseMoveTimer) {
            mouseMoveTimer = window.setTimeout(function () {
              mouseMoveTimer = null;

              var deltaPixelX = position.minus(mouseDownPixel).x;
              mouseDownPixel = position;
              mouseMoveDirect = deltaPixelX ? deltaPixelX / Math.abs(deltaPixelX) : 0;

              var deltaSlide = viewport.getSlide() + mouseMoveDirect;

              if (deltaSlide < 0) {
                deltaSlide += source.number;
              }

              if (deltaSlide >= source.number) {
                deltaSlide -= source.number;
              }

              viewport.slideTo(deltaSlide, true);
              viewport.applyConstraints();
            }, SlideConfig.drawSwitchPerTime);
          }
        }
      }
    }

    // 鼠标抬起事件响应用于应用鼠标拖动结果
    function onCanvasRelease(tracker, position, insideElmtPress, insideElmtRelease) {
      if (insideElmtPress && viewport) {
        viewport.applyConstraints();

        SlideUtils.removeMouseCursor(canvas);
      }
    }

    // Mouse interaction with container

    // 鼠标进入显示容器内终止控件的自动隐藏
    function onContainerEnter(/*tracker, position, buttonDownElmt, buttonDownAny*/) {
      mouseInside = true;
      abortControlsAutoHide();

      if (viewport) {
        if (mouseDragSwitchSlide) {
          SlideUtils.setMouseCursor(canvas, SlideUtils.cursorUrl("openhand"));
        } else {
          SlideUtils.setMouseCursor(canvas, SlideUtils.cursorUrl("openhand360"));
        }
      }
    }

    // 鼠标移除显示容器,并且没有按下鼠标按键拖出控件
    function onContainerExit(tracker, position, buttonDownElmt, buttonDownAny) {
      // fade controls out over time, only if the mouse isn't down from
      // within the container (e.g. panning, or using a control)
      if (!buttonDownElmt) {
        mouseInside = false;

        if (!animating) {
          beginControlsAutoHide();
        }
      }
    }
    this.setFocus = function () {
      onContainerEnter();
    };
    // 鼠标释放显示容器
    function onContainerRelease(tracker, position, insideElmtPress, insideElmtRelease) {
      // the mouse may have exited the container and we ignored it if the
      // mouse was down from within the container. now when the mouse is
      // released, we should fade the controls out now.
      if (!insideElmtRelease) {
        mouseInside = false;

        if (!animating) {
          beginControlsAutoHide();
        }
      }

      if (viewport) {
        if (mouseDragSwitchSlide) {
          SlideUtils.setMouseCursor(canvas, SlideUtils.cursorUrl("openhand"));
        } else {
          SlideUtils.setMouseCursor(canvas, SlideUtils.cursorUrl("openhand360"));
        }
      }
    }

    // Key interaction

    // 键盘按下按键事件响应
    function onPageKeyDown(evt) {
      evt = SlideUtils.getEvent(evt);

      // 27 means esc key
      if (evt.keyCode === 27) {
        self.setFullPage(false);
      }
    }

    // Core

    // 打开图像前的准备工作返回当前时间
    function beforeOpen() {
      if (source) {
        onClose();
      }

      // to ignore earlier opens
      lastOpenStartTime = new Date().getTime();

      // show loading message after a delay if it still hasn't loaded
      window.setTimeout(function () {
        if (lastOpenStartTime > lastOpenEndTime) {
          setMessage(Strings.getString("Messages.Loading"));
        }
      }, 2000);

      return lastOpenStartTime;
    }

    // 关闭并且释放资源
    function onClose() {
      // TODO need destroy() methods to prevent leaks? check for null if so.

      // nullify fields and properties
      self.source = source = null;
      self.viewport = viewport = null;
      self.drawer = drawer = null;
      self.profiler = profiler = null;

      // clear all tiles and any message
      canvas.innerHTML = "";
    }

    // 图像打开事件响应并触发打开事件
    function onOpen(time, _source, err) {
      lastOpenEndTime = new Date().getTime();

      if (time < lastOpenStartTime) {
        SlideDebug.log("Ignoring out-of-date open.");
        evtManage.trigger("ignore", self);
      } else if (!_source) {
        setMessage(err);
        evtManage.trigger("error", self);
        return;
      }

      // clear any previous message
      canvas.innerHTML = "";
      prevContainerSize = SlideUtils.getElementSize(container);

      if (prevContainerSize.x === 0 || prevContainerSize.y === 0) {
        window.setTimeout(function () {
          onOpen(time, _source, err);
        }, 10);

        return;
      }

      // assign fields
      source = _source;
      viewport = new SlideViewport(prevContainerSize, source.dimensions);
      if(source.number === 1){
        drawer = new SlideSingleDrawer(source, viewport, canvas);
      }else{
        drawer = new SlideMultiDrawer(source, viewport, canvas);
      }

      profiler = new SlideProfiler();

      // assign properties
      self.source = source;
      self.viewport = viewport;
      self.drawer = drawer;
      self.profiler = profiler;

      if (!uiControl) {
        // 初始化 ui 视图, 由于用到接口函数故放在最后初始化
        uiControl = new SlideUi(self);
      }

      animating = false;
      forceRedraw = true;

      scheduleUpdate(updateMulti);
      evtManage.trigger("open", self);

    }

    // 每分钟60fps更新
    function scheduleUpdate(updateFunc, prevUpdateTime) {
      // if we're animating, update as fast as possible to stay smooth
      if (animating) {
        return window.setTimeout(updateFunc, 1);
      }

      var currentTime = new Date().getTime();
      prevUpdateTime = prevUpdateTime ? prevUpdateTime : currentTime;
      var targetTime = prevUpdateTime + 1000 / 60, // 60 fps ideal

        // calculate delta time to be a positive number
        deltaTime = Math.max(1, targetTime - currentTime);

      return window.setTimeout(updateFunc, deltaTime);
    }

    // 每次更新回调(并触发下一次的更新)
    function updateMulti() {
      if (!source) {
        return;
      }

      updateOnce();
      scheduleUpdate(arguments.callee, new Date().getTime());
    }

    // 每次更新函数
    function updateOnce() {
      if (!source) {
        return;
      }

      profiler.beginUpdate();

      var containerSize = SlideUtils.getElementSize(container);

      // 窗口尺寸改变时
      if (!containerSize.equals(prevContainerSize) &&
        containerSize.x > 0 && containerSize.y > 0) {
        viewport.resize(containerSize, true);
        prevContainerSize = containerSize;
        evtManage.trigger("resize", self);
      }

      var animated = viewport.update();

      if (!animating && animated) {
        // we weren't animating, and now we did ==> animation start
        evtManage.trigger("animationstart", self);

        // TODO: add some controls event handle
        abortControlsAutoHide();
      }

      if (animated) {
        drawer.update();
        evtManage.trigger("animation", self);
      } else if (forceRedraw || drawer.needsUpdate()) {
        drawer.update();
        forceRedraw = false;
      } else {
        drawer.idle();
      }

      if (animating && !animated) {
        // we were animating, and now we're not anymore ==> animation finish
        evtManage.trigger("animationfinish", self);

        // TODO: add some controls event handle
        if (!mouseInside) {
          beginControlsAutoHide();
        }
      }

      animating = animated;

      profiler.endUpdate();
    }

    // Controls

    // 开始控件的自动隐藏
    function beginControlsAutoHide() {
      if (!SlideConfig.autoHideControls) {
        return;
      }

      controlsShouldFade = true;
      controlsFadeBeginTime = new Date().getTime() + controlsFadeDelay;
      window.setTimeout(scheduleControlsFade, controlsFadeDelay);
    }

    // 停止自动隐藏控件,并且把所有空间容器透明度设置为1
    function abortControlsAutoHide() {
      controlsShouldFade = false;

      for (var i = controls.length - 1; i >= 0; i--) {
        controls[i].setOpacity(1.0);
      }
    }

    // 隐藏控件延迟调用函数
    function scheduleControlsFade() {
      window.setTimeout(updateControlsFade, 20);
    }

    // 设置隐藏控件,修改透明度
    function updateControlsFade() {
      if (controlsShouldFade) {
        var currentTime = new Date().getTime(),
          deltaTime = currentTime - controlsFadeBeginTime,
          opacity = 1.0 - deltaTime / controlsFadeLength;

        opacity = Math.min(1.0, opacity);
        opacity = Math.max(0.0, opacity);

        for (var i = controls.length - 1; i >= 0; i--) {
          controls[i].setOpacity(opacity);
        }

        if (opacity > 0) {
          scheduleControlsFade();
        }
      }
    }

    // 向显示容器中添加控件
    function addControl(elmt, anchor) {
      elmt = SlideUtils.getElement(elmt);

      if (getControlIndex(elmt) >= 0) {
        return;  // they're trying to add a duplicate control
      }

      var div = null;

      switch (anchor) {
        case SlideControlAnchor.TOP_RIGHT:
          div = controlsTR;
          elmt.style.position = "relative";
          break;
        case SlideControlAnchor.BOTTOM_RIGHT:
          div = controlsBR;
          elmt.style.position = "relative";
          break;
        case SlideControlAnchor.BOTTOM_LEFT:
          div = controlsBL;
          elmt.style.position = "relative";
          break;
        case SlideControlAnchor.TOP_LEFT:
          div = controlsTL;
          elmt.style.position = "relative";
          break;
        case SlideControlAnchor.NONE:
        default:
          div = container;
          elmt.style.position = "absolute";
          break;
      }

      controls.push(new SlideControl(self, elmt, anchor, div));
    }

    // 从显示容器中删除控件
    function removeControl(elmt) {
      elmt = SlideUtils.getElement(elmt);
      var index = getControlIndex(elmt);

      if (index >= 0) {
        controls[index].destroy();
        controls.splice(index, 1);
      }
    }

    // 从容器中删除所有控件
    function clearControls() {
      while (controls.length > 0) {
        controls.pop().destroy();
      }
    }

    // 获取某个控件在控件数组的索引位置
    function getControlIndex(elmt) {
      for (var i = controls.length - 1; i >= 0; i--) {
        if (controls[i].elmt === elmt) {
          return i;
        }
      }

      return -1;
    }

    // Public Methods
    // Image

    this.isOpen = function () {
      return !!source;
    };

    // 根据source打开图像
    this.openSource = function (source) {
      var currentTime = beforeOpen();

      window.setTimeout(function () {
        onOpen(currentTime, source);

      }, 1);

    };

    // 关闭打开的图像
    this.close = function () {
      if (!source) {
        return;
      }

      onClose();
    };

    // Controls

    // 接口: 向容器中添加控件
    this.addControl = function (elmt, anchor) {
      return addControl(elmt, anchor);
    };

    // 接口: 从容器中删除控件
    this.removeControl = function (elmt) {
      return removeControl(elmt);
    };

    // 接口: 从容器中删除所有控件
    this.clearControls = function () {
      return clearControls();
    };

    // Ui

    // 是否已经全页面显示
    this.isFullPage = function () {
      return container.parentNode === document.body;
    };

    // 设置全页显示
    this.setFullPage = function (fullPage) {
      if (fullPage && self.isFullPage()) {
        return;
      }

      // copy locally to improve perf
      var body = document.body,
        bodyStyle = body.style,
        docStyle = document.documentElement.style,
        containerStyle = container.style,
        canvasStyle = canvas.style;

      if (fullPage) {
        // change overflow, but preserve what current values are
        bodyOverflow = bodyStyle.overflow;
        docOverflow = docStyle.overflow;
        bodyStyle.overflow = "hidden";
        docStyle.overflow = "hidden";

        // IE6 needs the body width/height to be 100% also
        bodyWidth = bodyStyle.width;
        bodyHeight = bodyStyle.height;
        bodyStyle.width = "100%";
        bodyStyle.height = "100%";

        // always show black background, etc., for fullpage
        canvasStyle.backgroundColor = "#ffffff";
        canvasStyle.color = "white";

        // make container attached to the window, immune to scrolling,
        // and above any other things with a z-index set.
        containerStyle.position = "fixed";
        containerStyle.zIndex = "999999";

        body.appendChild(container);
        prevContainerSize = SlideUtils.getWindowSize();

        // add keyboard listener for esc key, to exit full page.
        // add it on document because browsers won't give an arbitrary
        // element (e.g. this viewer) keyboard focus, and adding it to
        // window doesn't work properly in IE.
        SlideUtils.addEvent(document, "keydown", onPageKeyDown);

        onContainerEnter();     // mouse will be inside container now
      } else {
        // restore previous values for overflow
        bodyStyle.overflow = bodyOverflow;
        docStyle.overflow = docOverflow;

        // IE6 needed to overwrite the body width/height also
        bodyStyle.width = bodyWidth;
        bodyStyle.height = bodyHeight;

        // return to inheriting style
        canvasStyle.backgroundColor = "";
        canvasStyle.color = "";

        // make container be inline on page again, and auto z-index
        containerStyle.position = "relative";
        containerStyle.zIndex = "";

        parent.appendChild(container);
        prevContainerSize = SlideUtils.getElementSize(parent);

        // remove keyboard listener for esc key
        SlideUtils.removeEvent(document, "keydown", onPageKeyDown);

        onContainerExit();      // mouse will likely be outside now
      }

      if (viewport) {
        var oldBounds = viewport.getBounds();
        viewport.resize(prevContainerSize);
        var newBounds = viewport.getBounds();

        if (fullPage) {
          // going to fullpage, remember how much bounds changed by.
          fsBoundsDelta = new SlidePoint(newBounds.width / oldBounds.width,
              newBounds.height / oldBounds.height);
        } else {
          // leaving fullpage, negate how much the fullpage zoomed by.
          // note that we have to negate the bigger of the two changes.
          // we have to zoom about the center of the new bounds, but
          // that's NOT the zoom point. so we have to manually update
          // first so that that center becomes the viewport center.
          viewport.update();
          viewport.zoomBy(Math.max(fsBoundsDelta.x, fsBoundsDelta.y), null, true);
        }

        forceRedraw = true;
        evtManage.trigger("resize", self);
        updateOnce();
      }
    };

    // 是否画板激活的鼠标事件
    this.isMouseNavEnabled = function () {
      return innerTracker.isTracking();
    };

    // 设置画板是否激活鼠标事件
    this.setMouseNavEnabled = function (enabled) {
      innerTracker.setTracking(enabled);
      //uiControl.setSwitchBtnEnabel(enabled);
    };

    // 当前绘制容器是否隐藏
    this.isVisible = function () {
      return container.style.visibility !== "hidden";
    };

    // 设置当前绘制容器是否隐藏
    this.setVisible = function (visible) {
      container.style.visibility = (visible ? "" : "hidden");
    };

    // 在画板中显示信息(清空画板显示)
    this.showMessage = function (msg, delay) {
      if (!delay) {
        setMessage(msg);
        return;
      }

      window.setTimeout(function () {
        if (!self.isOpen()) {
          setMessage(msg);
        }
      }, delay);
    };

    this.isSwitchSlide = function () {
      return !mouseDragSwitchSlide;
    };

    this.setSwitchSlide = function (enable) {
      if (typeof enable === "boolean" && enable) {
        mouseDragSwitchSlide = false;
      } else {
        mouseDragSwitchSlide = true;
      }
    };

    // 添加首部导航按钮
    this.setNavControl = function () {
      if (uiControl) {
        uiControl.addNavControl();
      }
    };

    // 删除首部导航按钮
    this.removeNavControl = function () {
      if (uiControl) {
        uiControl.removeNavControl();
      }
    };

    this.setBtnEnable = function(para){
      if (uiControl) {
        uiControl.setSwitchBtnEnabel(para);
      }
    };

    // Event handling
    // 对应的事件: open, error, ignore, resize,
    //  animationstart, animationfinish, animation

    // 给当前窗口添加事件响应
    this.addEventListener = function (evtName, handler) {
      evtManage.addListener(evtName, handler);
    };

    // 移除当前窗口添加事件响应
    this.removeEventListener = function (evtName, handler) {
      evtManage.removeListener(evtName, handler);
    };

    // 触发当前窗口添加事件响应
    this.trigger = function () {
      evtManage.trigger.apply(self, arguments);
    };
  };
})();

/**
 * Pathology - 1.0.0
 * @email v
 * @author 
 */

window.SL = window.SL || {};

var Debug = SL.Debug = Slide.Debug;

var Extend = SL.Extend = Slide.Extend;

var Point = SL.Point = Slide.Point;

var Rect = SL.Rect = Slide.Rect;

/**
 * Pathology - 1.0.0
 * @email v
 * @author 
 */

var Dom = SL.Dom;

(function () {
    Dom = SL.Dom = function () {
        // Fields
        var self = this;

        // Properties
        this.rnotwhite = (/\S+/g);
        this.rclass = (/[\t\r\n\f]/g);
        this.rtrim = (/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g);

        // Public methods

        this.trim = function (txt) {
            return txt === null ? "" : (txt + "").replace(self.rtrim, "");
        };

        this.isDOM = function (obj) {
            return typeof HTMLElement === "object" ?
                function (obj) {
                    return obj instanceof HTMLElement;
                } :
                function () {
                    return obj && typeof obj === "object" && obj.nodeType === 1 &&
                        typeof obj.nodeName === "string";
                };
        };

        this.addClass = function (elmt, value) {
            if (!self.isDOM(elmt)) {
                return;
            }

            var proceed = typeof value === "string" && value;

            if (proceed) {
                var classes = (value || "").match(self.rnotwhite) || [],
                    cur = elmt.nodeType === 1 && (elmt.className ?
                            (" " + elmt.className + " ").replace(self.rclass, " ") :
                            " ");

                if (cur) {
                    var j = 0, clazz = null;

                    while ((clazz = classes[j++])) {
                        if (cur.indexOf(" " + clazz + " ") < 0) {
                            cur += clazz + " ";
                        }
                    }

                    var finalValue = self.trim(cur);

                    if (elmt.className !== finalValue) {
                        elmt.className = finalValue;
                    }
                }
            }
        };

        this.removeClass = function (elmt, value) {
            if (!self.isDOM(elmt)) {
                return;
            }

            var proceed = arguments.length === 1 ||
                (typeof value === "string" && value);

            if (proceed) {
                var classes = (value || "").match(self.rnotwhite) || [],
                    cur = elmt.nodeType === 1 && (elmt.className ?
                            (" " + elmt.className + " ").replace(self.rclass, " ") :
                            " ");

                if (cur) {
                    var j = 0, clazz = null;

                    while ((clazz = classes[j++])) {
                        while (cur.indexOf(" " + clazz + " ") >= 0) {
                            cur = cur.replace(" " + clazz + " ", " ");
                        }
                    }

                    var finalValue = value ? self.trim(cur) : "";

                    if (elmt.className !== finalValue) {
                        elmt.className = finalValue;
                    }
                }
            }
        };

        this.toggleClass = function (elmt, value, stateVal) {
            if (!self.isDOM(elmt)) {
                return;
            }

            if (typeof stateVal === "boolean" && typeof value === "string") {
                return stateVal ? self.addClass(elmt, value) : self.removeClass(elmt, value);
            }

            if (typeof value === "string") {
                // toggle individual class names
                var className,
                    i = 0,
                    classNames = value.match(self.rnotwhite) || [];

                while ((className = classNames[i++])) {
                    // check each className given, space separated list
                    if (self.hasClass(elmt, className)) {
                        self.removeClass(elmt, className);
                    } else {
                        self.addClass(elmt, className);
                    }
                }
            } else if (typeof value === "undefined" || typeof value === "boolean") {
                if (elmt.className) {
                    // store className if set
                    elmt.__className__ = elmt.className;
                }

                elmt.className = elmt.className || value === false ?
                    "" : elmt.__className__ || "";
            }
        };

        this.hasClass = function (elmt, selector) {
            if (!self.isDOM(elmt)) {
                return false;
            }

            var className = " " + selector + " ";

            if (elmt.nodeType === 1 &&
                (" " + elmt.className + " ").replace(self.rclass, " ").indexOf(className) >= 0) {
                return true;
            }

            return false;
        };

        this.show = function (elmt) {
            if (!self.isDOM(elmt)) {
                return;
            }

            var display = elmt.style.display;

            if (!elmt.olddisplay && display === "none") {
                display = elmt.style.display = "";
            }

            if (display !== "none" || display !== "") {
                elmt.olddisplay = display;
            }

            if (display === "none" || display === "") {
                elmt.style.display = elmt.olddisplay || "";
            }
        };

        this.hide = function (elmt) {
            if (!self.isDOM(elmt)) {
                return;
            }

            var display = elmt.style.display;

            if (display !== "none" && !elmt.olddisplay) {
                elmt.olddisplay = display;
            }

            elmt.style.display = "none";
        };
    };
})();

// Dom is a static class, so make it singleton instance
Dom = SL.Dom = new Dom();


var ResultType = {
//  0: 成功
//  1: 没有此图
//  2: 没有权限获取此图
//  3: 失败
    Success: 0,
    NoImage: 1,
    NoPermission: 2,
    Failed: 3
};

function AjxResult(code, info) {
    this.resultCode = typeof code !== "undefined" ? code : ResultType.Success;
    this.Info = typeof info !== "undefined" ? info : null;
}

var SlideInfo = SL.SlideInfo =
    function (id, name, url, description, calibration,
              width, height, number, hasAnnotations, annotations, deviceId, priority, sign, scanObjective,navmap) {
        this.id = typeof id !== "undefined" ? id : 0; // 图像 id
        this.name = typeof name !== "undefined" ? name : "";
        this.url = typeof url !== "undefined" ? url : "";
        this.description = typeof description !== "undefined" ? description : "";

        this.calibration = typeof calibration !== "undefined" ? calibration : 1;  //　比例尺参数
        this.width = typeof width !== "undefined" ? width : 0;
        this.height = typeof height !== "undefined" ? height : 0;
        this.number = typeof number !== "undefined" ? number : 0;
        this.hasAnnotations = typeof hasAnnotations !== "undefined" ? hasAnnotations : false;
        this.annotations = typeof annotations !== "undefined" ? annotations : [];
        this.deviceId = typeof deviceId !== "undefined" ? deviceId : 0;
        this.priority = typeof priority !== "undefined" ? priority : 0;
        this.sign = typeof sign !== "undefined" ? sign : "";
        this.scanObjective = typeof scanObjective !== "undefined" ? scanObjective : 0;
        this.tileSize = 256;
        this.navmap = navmap;
    };

var AnnotationInfo = SL.AnnotationInfo =
    function (id, guid, imageId, name, description,
              imageIndex, scale,
              width, type, region,
              fontUnderLine, fontSize, fontFamily, fontItalic, fontBold, visible, color,
              measurement,
              radius, arcLength, angle,
              points) {
        this.id = typeof id !== "undefined" ? id : 0; // 当前标注 id
        this.guid = typeof guid !== "undefined" ? guid : ""; // 当前标注 guid
        this.imageId = typeof imageId !== "undefined" ? imageId : 0; // 图像 id
        this.name = typeof name !== "undefined" ? name : ""; // 当前标注名称
        this.description = typeof description !== "undefined" ? description : ""; // 当前标注的相关描述

        this.imageIndex = typeof imageIndex !== "undefined" ? imageIndex : 0; // 当前标注对应图像序列索引(第几张)
        this.scale = typeof scale !== "undefined" ? scale : 0; // 当前标注所在的放大倍数比例

        this.width = typeof width !== "undefined" ? width : 0; // 标注线宽
        this.type = typeof type !== "undefined" ? type : ""; // 当前标注类型
        this.region = typeof region !== "undefined" ? region : new Rect(); // 标注所在的矩形区域(赋值必须为Rect类型)

        this.fontUnderLine = typeof fontUnderLine !== "undefined" ? fontUnderLine : false;
        this.fontSize = typeof fontSize !== "undefined" ? fontSize : false;
        this.fontFamily = typeof fontFamily !== "undefined" ? fontFamily : false;
        this.fontItalic = typeof fontItalic !== "undefined" ? fontItalic : false;
        this.fontBold = typeof fontBold !== "undefined" ? fontBold : false;
        this.visible = typeof visible !== "undefined" ? visible : false;
        this.color = typeof color !== "undefined" ? color : 0;

        this.measurement = typeof measurement !== "undefined" ? measurement : false;

        this.radius = typeof radius !== "undefined" ? radius : 0;
        this.arcLength = typeof arcLength !== "undefined" ? arcLength : 0;
        this.angle = typeof angle !== "undefined" ? angle : 0;

        this.points = typeof points !== "undefined" ? points : [];
    };

var Utils = function () {
    // Fields
    var self = this;

    function colorHex(strRgb) {
        var rgb = strRgb;

        if (/^(rgb|RGB)/.test(rgb)) {
            var hex = "#",
                rgbAry = rgb.replace(/(?:\(|\)|rgb|RGB)*/g, "").split(",");

            for (var index = 0; index < rgbAry.length; index++) {
                var num = Number(rgbAry[index]).toString(16);

                if (num === "0") {
                    num += num;
                } else {
                    if (num.length == 1) {
                        num = "0" + num;
                    }
                }

                hex += num;
            }

            if (hex.length !== 7) {
                hex = rgb;
                return hex;
            }
        }

        if (reg.test(rgb)) {
            var rgbAry = rgb.replace(/#/, "").split("");

            if (rgbAry.length === 6) {
                return rgb;
            }

            if (rgbAry.length === 3) {
                var hex = "#";

                for (var index = 0; index < rgbAry.length; index++) {
                    hex += (rgbAry[index] + rgbAry[index]);
                }

                return hex;
            }
        } else {
            return rgb;
        }
    }

    function colorRgb(clrStr) {
        var clr = clrStr.toLowerCase();

        if (clr && reg.test(clr)) {
            if (clr.length === 4) {
                var hex = "#";

                // argb格式
                for (var index = 1; index < 4; index++) {
                    hex += clr.slice(index, index + 1).concat(clr.slice(index, index + 1));
                }

                clr = hex;
            }

            var ary = [];

            for (var index = 1; index < 7; index += 2) {
                ary.push(parseInt("0x" + clr.slice(index, index + 2)));
            }

            return ("RGB(" + ary.join(",") + ")");
        }

        return clr;
    }

    // Properties
    this.reg = (/^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/);
    this.enter = "<br/>";


    // Public methods

    this.HexToNumber =function(hex){
        return parseInt(hex.replace("#", "0xFF"));
    };

    this.NumberToHex = function(number) {
        var a = number >> 24 & 255,
            r = number >> 16 & 255,
            g = number >> 8 & 255,
            b = number & 255;

        var rgb = "rgb(" + r + "," + g + "," + b + ")";
        return colorHex(rgb);
    }

    // 计算三点对应外心的x坐标
    this.calcCenterX = function (x1, y1, x2, y2, x3, y3) {
        return ((x1 * x1 + y1 * y1) * (y2 - y3) -
            (x2 * x2 + y2 * y2) * (y2 - y3) -
            (x2 * x2 + y2 * y2) * (y1 - y2) +
            (x3 * x3 + y3 * y3) * (y1 - y2)) / (2 * ((x1 - x2) * (y2 - y3) -
            (x2 - x3) * (y1 - y2)));
    };

    // 计算三点对应外心的y坐标
    this.calcCenterY = function (x1, y1, x2, y2, x3, y3) {
        var centerX = self.calcCenterX(x1, y1, x2, y2, x3, y3);
        return (x2 * x2 + y2 * y2 - (x3 * x3 + y3 * y3) -
            2 * centerX * (x2 - x3)) / (2 * (y2 - y3));
    };

    // 计算三点对应外心的坐标
    // http://en.wikipedia.org/wiki/Circumscribed_circle
    this.calcCenterPoint = function (pt1, pt2, pt3) {
        var centerX = self.calcCenterX(pt1.x, pt1.y, pt2.x, pt2.y, pt3.x, pt3.y),
            centerY = self.calcCenterY(pt1.x, pt1.y, pt2.x, pt2.y, pt3.x, pt3.y);

        return new Point(centerX, centerY);
    };
    //计算两点的中心点
    this.calcTwoCenterPoint = function (pt1, pt2) {

        return pt1.plus(pt2).divide(2);
    };
    //计算两点间的距离
    this.calcTwoPointDistance = function(pt1,pt2){
        return pt1.distanceTo(pt2);
    };
    // 计算半径
    this.calcRadius = function (pt1, pt2) {
        var disX = pt2.x - pt1.x,
            disY = pt2.y - pt1.y;

        return Math.sqrt(disX * disX + disY * disY);
    };

    // 计算线 x1,y1 x2,y2 与 x2,y2 x3,y3 之间的角度
    this.angleDegreeS = function (x1, y1, x2, y2, x3, y3) {
        var angle1 = Math.atan2(y1 - y2, x1 - x2),
            angle2 = Math.atan2(y3 - y2, x3 - x2),
            angle = (angle2 - angle1) / Math.PI * 180;

        if (angle < 0) {
            return (360 + angle);
        } else {
            return angle;
        }
    };

    // 计算线 x1,y1 x2,y2 与 x2,y2 x3,y3 之间的弧度
    this.angleRadianS = function (x1, y1, x2, y2, x3, y3) {
        var angle1 = Math.atan2(y1 - y2, x1 - x2),
            angle2 = Math.atan2(y3 - y2, x3 - x2);

        return angle2 - angle1;
    };

    // 计算线 pt1 pt2 与 pt2 pt3 之间的弧度
    this.angleRadian = function (pt1, pt2, pt3) {
        return self.angleRadianS(pt1.x, pt1.y, pt2.x, pt2.y, pt3.x, pt3.y);
    };

    // 计算线 pt1 pt2 与 pt2 pt3 之间的角度
    this.angleDegree = function (pt1, pt2, pt3) {
        return self.angleDegreeS(pt1.x, pt1.y, pt2.x, pt2.y, pt3.x, pt3.y);
    };

    // 计算线 pt1 pt2 与 pt1 pt3 之间的弧度
    this.radianOfTwoLine = function (pt1, pt2, pt3) {
        var angle1 = Math.atan2(pt2.y - pt1.y, pt2.x - pt1.x),
            angle2 = Math.atan2(pt3.y - pt1.y, pt3.x - pt1.x);

        return angle2 - angle1;
    };

    // 计算两点连成的线与水平方向的夹角
    this.radian = function (pt1, pt2) {
        return Math.atan2(pt1.y - pt2.y, pt1.x - pt2.x);
    };

    // 计算点 x1,y1 x2,y2 radius 对应圆的圆心坐标
    this.angleArcPointS = function (x1, y1, x2, y2, radius) {
        var angle = Math.atan2(y2 - y1, x2 - x1),
            dx = Math.sin(angle) * radius,
            dy = Math.cos(angle) * radius;

        return new Point(x1 + dx, y1 + dy);
    };

    // 计算点 pt1 pt2 radius 对应圆的圆心坐标
    this.angleArcPointS = function (pt1, pt2, radius) {
        return self.angleArcPointS(pt1.x, pt1.y, pt2.x, pt2.y, radius);
    };

    // 判断弧度radian对应的圆弧是大圆弧
    this.isLargeArc = function (radian) {
        var angle = 0;

        if (radian < 0) {
            angle = 2 * Math.PI + radian;
        } else {
            angle = radian;
        }

        if (angle < 0.5 * Math.PI || angle > 1.5 * Math.PI) {
            return true;
        }

        return false;
    };

    // 判断是否顺时针方向
    this.isCounterClockwise = function (radian) {
        if (radian < 0) {
            return (2 * Math.PI + radian);
        } else {
            return radian;
        }
    };

    // 计算点数组围城的区域面积
    this.calcArea = function (points) {
        var area = 0,
            aryLen = points.length;

        for (var index = 0; index < aryLen; index++) {
            var prev = (index + 1) % aryLen;
            area += points[index].x * points[prev].y;
            area -= points[index].y * points[prev].x;
        }

        return Math.abs(area / 2);
    };

    // 计算三角形的面积
    this.triangleArea = function (pt1, pt2, pt3) {
        var len1 = self.lineLength(pt1, pt2),
            len2 = self.lineLength(pt1, pt3),
            len3 = self.lineLength(pt2, pt3);

        if (len1 + len2 <= len3 || len2 + len3 <= len1 || len3 + len1 <= len2) {
            return 0;
        } else {
            var averageLen = (len1 + len2 + len3) / 2;
            return Math.sqrt(Math.abs(averageLen * (averageLen - len1) *
                (averageLen - len2) * (averageLen - len3)));
        }
    };

    // 计算两点之间的距离
    this.lineLength = function (pt1, pt2) {
        var dx = pt1.x - pt2.x,
            dy = pt1.y - pt2.y;

        return Math.sqrt(dx * dx + dy * dy);
    };

    // 计算点数组组成多边形的边长
    this.calcLength = function (points) {
        var aryLen = 0,
            length = 0;

        if (points !== null) {
            aryLen = points.length;

            if (aryLen < 2) {
                return 0;
            }
        }

        for (var prev = 0, now = 1; now < aryLen; now++) {
            length += self.lineLength(points[prev], points[now]);
            prev = now;
        }

        return length;
    };

    // 计算点数组组成封闭多边形的边长
    this.calcLengthClosed = function (points) {
        if (points === null) {
            return 0;
        } else {
            var aryLen = points.length;

            if (aryLen < 2) {
                return 0;
            } else {
                if (points[0] !== points[aryLen - 1]) {
                    points.push(points[0]);

                    var length = self.calcLength(points);
                    points.splice(points.length - 1, 1);
                    return length;
                } else {
                    return self.calcLength(points);
                }
            }
        }
    };

    // 把16进制转换为10进制
    this.hexToNumber = function (hex) {
        return parseInt(hex.replace("#", "0xFF"));
    };

    // 把10进制的argb颜色值转换为16进制的rgb(r,g,b)
    this.numberToHex = function (number) {
        var a = number >> 24 & 255,
            r = number >> 16 & 255,
            g = number >> 8 & 255,
            b = number & 255;

        var rgb = "rgb(" + r + "," + g + "," + b + ")";
        return self.colorHex(rgb);
    };

    // 转换为#001122形式的颜色值
    this.colorHex = function (strRgb) {
        var rgb = strRgb;

        if (/^(rgb|RGB)/.test(rgb)) {
            var hex = "#",
                rgbAry = rgb.replace(/(?:\(|\)|rgb|RGB)*/g, "").split(",");

            for (var index = 0; index < rgbAry.length; index++) {
                var num = Number(rgbAry[index]).toString(16);

                if (num === "0") {
                    num += num;
                } else {
                    if (num.length === 1) {
                        num = "0" + num;
                    }
                }

                hex += num;
            }

            if (hex.length !== 7) {
                hex = rgb;
            }

            return hex;
        }

        if (self.reg.test(rgb)) {
            var rgbAry = rgb.replace(/#/, "").split("");

            if (rgbAry.length === 6) {
                return rgb;
            }

            if (rgbAry.length === 3) {
                var hex = "#";

                for (var index = 0; index < rgbAry.length; index++) {
                    hex += (rgbAry[index] + rgbAry[index]);
                }

                return hex;
            }
        } else {
            return rgb;
        }
    };

    // 16进制转换为RGB(r,g,b)
    this.colorRgb = function (clrStr) {
        var clr = clrStr.toLowerCase();

        if (clr && self.reg.test(clr)) {
            if (clr.length === 4) {
                var hex = "#";

                // argb格式
                for (var index = 1; index < 4; index++) {
                    hex += clr.slice(index, index + 1).concat(clr.slice(index, index + 1));
                }

                clr = hex;
            }

            var ary = [];

            for (var index = 1; index < 7; index += 2) {
                ary.push(parseInt("0x" + clr.slice(index, index + 2)));
            }

            return ("RGB(" + ary.join(",") + ")");
        }

        return clr;
    };

    // 把字符串结尾符替换为<br/>
    this.replaceHtmlEnter = function (str) {
        str = str.replaceAll("\n", self.enter);
        return str;
    };

    // 设置文本dom的样式
    this.registerTxtCSS = function (options) {
        var defaults = {};
        Extend(true, defaults, {
            elmt: null,
            left: 0,
            top: 0,
            fontSize: 12,
            fontFamily: "Microsoft YaHei",
            color: "#0000ff",
            fontBold: false,
            fontItalic: false,
            fontUnderline: false,
            bkColor: false,
            bkOpacity: false,
            description: ""
        }, options);

        if (defaults.elmt) {
            var $elmt = $(defaults.elmt);

            $elmt.css({
                left: defaults.left + "px",
                top: defaults.top + "px",
                "font-size": defaults.fontSize + "px",
                "font-family": defaults.fontFamily,
                color: defaults.color,
                position: "absolute",
                padding: "5px",
                float: "left",
                "border-radius": "4px",
                "-moz-border-radius": "4px",
                "-webkit-border-radius": "4px"
            });

            if (defaults.fontBold) {
                $elmt.css({
                    "font-weight": "bold"
                });
            }

            if (defaults.fontItalic) {
                $elmt.css({
                    "font-style": "italic"
                });
            }

            if (defaults.fontUnderline) {
                $elmt.css({
                    "text-decoration": "underline"
                });
            }

            if (defaults.bkColor) {
                $elmt.css({
                    "background-color": "#F7F8FA",
                    border: "1px solid #A3AEB9"
                });
            }

            if (defaults.bkOpacity) {
                $elmt.css({
                    filter: "alpha(opacity=80)",
                    opacity: "0.8",
                    display: "block"
                });
            }

            var str = self.replaceHtmlEnter(defaults.description);
            $elmt.html(str);
        }
    };

    // 设置测量文本dom的样式
    this.registerMeasurementTxtCSS = function (elmt) {
        if (elmt) {
            $(elmt).css({
                "font-size": "12px",
                "background-color": "#F7F8FA",
                border: "1px solid #A3AEB9",
                color: "#000000",
                "font-family": "Microsoft Sans Serif,Arial, Helvetica, sans-serif,宋体",
                filter: "alpha(opacity=80)",
                opacity: "0.8",
                position: "absolute",
                padding: "4px",
                "border-radius": "4px",
                "-moz-border-radius": "4px",
                "-webkit-border-radius": "4px"
            });
        }
    };

    // 设置元素elmt的位置
    this.registerPositionCSS = function (elmt, left, top) {
        if (elmt) {
            $(elmt).css({
                left: left + "px",
                top: top + "px"
            });
        }
    };

    // 浮点数保留两位小数(四舍五入)
    this.floatRound = function (num) {
        return Math.round(num * 100) / 100;
    };

    // 字符串结尾是否换行符
    this.isHasEnter = function (str) {
        var isEnter = false;

        for (var index = 0; index < str.length; index++) {
            if (str[index] === "\n") {
                isEnter = true;
                break;
            }
        }

        return isEnter;
    };

    // 用txtElmt元素的宽高应用到inpElmt
    this.replaceSize = function (inpElmt, txtElmt) {
        var width = $(txtElmt).width(),
            height = $(txtElmt).height();

        if (width < 200) {
            width = 200;
        }

        if (height < 200) {
            height = 200;
        }

        $(inpElmt).width(width).height(height);
    };

    // 用txtElmt元素的宽高应用到inpElmt,不会自动放大
    this.replaceSizeSame = function (inpElmt, txtElmt) {
        var width = $(txtElmt).width(),
            height = $(txtElmt).height();

        $(inpElmt).width(width).height(height);
    };

    // 把str1,str2拼接成一个字符串并在最后添加换行符
    this.appendLine = function (str1, str2) {
        return str1 += (str2 + self.enter);
    };

    // 把str1,str2拼接成一个字符串
    this.append = function (str1, str2) {
        return str1 += str2;
    };

    // 取宽度一半，用于检测图形的点击事件范围
    this.getOffsetWidth = function (width) {
        width /= 2;

        if (width < 10) {
            width = 10;
        }

        return width;
    };

    // 计算点到直线的距离ax+by+c=0 点p(x0,y0)距离d=|ax0+by0+c|/根号下(a^2+b^2)
    this.pointToLineLength = function (startPt, endPt, point) {
        var offsetY = startPt.y - endPt.y,
            offsetX = endPt.x - startPt.x;
        var c = (startPt.x - offsetX) * startPt.y - startPt.x * (startPt.y + offsetY);

        if (offsetX === 0 && offsetY === 0) {
            return null;
        } else {
            return Math.abs(offsetY * point.x + offsetX * point.y + c) /
                Math.sqrt(offsetX * offsetX + offsetY * offsetY);
        }
    };

    // 确定point是否在以startPt, endPt确定的直线在width为范围的范围内
    this.clickOnLine = function (startPt, endPt, point, width) {
        width = self.getOffsetWidth(width);

        var startX, startY, endX, endY;

        if (startPt.x > endPt.x) {
            startX = endPt.x;
            endX = startPt.x;
        } else {
            startX = startPt.x;
            endX = endPt.x;
        }

        if (startPt.y > endPt.y) {
            startY = endPt.y;
            endY = startPt.y;
        } else {
            startY = startPt.y;
            endY = endPt.y;
        }

        if (point.x < startX - width || point.x > endX + width ||
            point.y < startY - width || point.y > endY + width) {
            return false;
        } else {
            var len = self.pointToLineLength(startPt, endPt, point);

            if (len === null || typeof len === "undefined") {
                return false;
            } else {
                if (len < width) {
                    return true;
                }

                return false;
            }
        }
    };

    // 确定点是否在椭圆范围内
    this.clickOnEllipse = function (n, t, point, testPt, width) {
        width = self.getOffsetWidth(width);

        if (point.x - n - width > testPt.x || testPt.x > point.x + n + width ||
            point.y - t - width > testPt.y || testPt.y > point.y + t + width) {
            return false;
        }

        var s = (testPt.x - point.x) / n,
            o = 1 / s,
            f = Math.sqrt(o * o - 1) / o;

        if (isNaN(f)) {
            f = 0;
        }

        if (testPt.y < point.y && f > 0 || testPt.y > point.y && f < 0) {
            f = -f;
        }

        var e = i.y + t * f;

        if (e - width <= testPt.y && testPt.y <= e + width) {
            return true;
        }

        return false;
    };

    // 确定点point是否在以center以radius圆范围内
    this.clickInCircle = function (radius, center, point, width) {
        width = self.getOffsetWidth(width);
        var hitRadius = self.calcRadius(center, point);

        if (hitRadius <= radius + width) {
            return true;
        }

        return false;
    };

    // 获取点击圆的结果
    this.clickInCircleResult = function (radius, center, point, width) {
        width = self.getOffsetWidth(width);

        var hitRadius = self.calcRadius(center, point),
            clkResult = new ClickResult();
        clkResult.isIn = (hitRadius <= (radius + width));
        clkResult.length = hitRadius;

        return clkResult;
    };

    // 确定点point是否在以center为圆心半径为radius圆内
    this.clickOnCircle = function (radius, center, point, width) {
        width = self.getOffsetWidth(width);
        var hitRadius = self.calcRadius(center, point);

        return (radius - width < hitRadius && hitRadius < radius + width);
    };

    // 确定点point是否在以center为圆心半径为radius圆弧上
    this.clickOnArc = function (radius, centerPt, point, radian1, radian2, isLargeArc, width) {
        width = self.getOffsetWidth(width);

        var isOnArc = false,
            length = self.lineLength(centerPt, point),
            radian = self.radian(point, centerPt);

        if (!(radius - width > length || length > radius + width))  {
            if (Math.abs(radian1 - radian2) < Math.PI) {
                if (isLargeArc) {
                    isOnArc = Math.min(radian1, radian2) > radian || radian > Math.max(radian1, radian2);
                } else {
                    isOnArc = Math.min(radian1, radian2) < radian || radian < Math.max(radian1, radian2);
                }
            } else {
                if (isLargeArc) {
                    isOnArc = Math.min(radian1, radian2) < radian || radian < Math.max(radian1, radian2);
                } else {
                    isOnArc = Math.min(radian1, radian2) > radian || radian > Math.max(radian1, radian2);
                }
            }
        }

        return isOnArc;
    };

    // 确定点point是否在以center为圆心半径为radius圆弧内
    this.clickInArc = function (radius, centerPt, point, radian1, radian2, isLargeArc, width) {
        width = self.getOffsetWidth(width);

        var isInArc = false,
            length = self.lineLength(centerPt, point),
            radian = self.radian(point, centerPt);

        if (length <= radius + width)  {
            if (Math.abs(radian1 - radian2) < Math.PI) {
                if (isLargeArc) {
                    isInArc = Math.min(radian1, radian2) > radian || radian > Math.max(radian1, radian2);
                } else {
                    isInArc = Math.min(radian1, radian2) < radian || radian < Math.max(radian1, radian2);
                }
            } else {
                if (isLargeArc) {
                    isInArc = Math.min(radian1, radian2) < radian || radian < Math.max(radian1, radian2);
                } else {
                    isInArc = Math.min(radian1, radian2) > radian || radian > Math.max(radian1, radian2);
                }
            }
        }

        return isInArc;
    };

    // guid 生成器返回一个guid字符串
    this.guidGenerator = function () {
        function G() {
            return ((1 + Math.random()) * 65536 | 0).toString(16).substring(1);
        }

        return G() + G() + "-" + G() + "-" + G() + "-" + G() + "-" + G() + G() + G();
    };


};

// Utils is a static class, so make it singleton instance
// Utils = SP.Utils = new Utils();
// Utils = SP.Utils inherit Pathology.Utils and extend Pathology.Utils
Utils = SL.Utils = Extend(Slide.Utils, new Utils());

// 扩展String原型
String.prototype.replaceAll = function (str, replaceStr) {
    return this.replace(new RegExp(str, "gm"), replaceStr);
};

/**
 * Pathology - 1.0.0
 * @email v
 * @author 
 */

var Strings = SL.Strings;

(function () {
    if (Strings) {
        return;
    }

    var viewer_strings = {
        en: {
            Buttons: {
                MainToolbar: {
                    BtnFullScreen: "Full Screen",
                    BtnBack: "Back",
                    BtnHome: "Fit to view window",
                    Options: "Options",
                    ZoomIn: "Zoom In",
                    ZoomOut: "Zoom Out",
                    Annotation: "Annotations",
                    times:"x"
                },
                AnnoToolbar: {
                    BtnHand: "Cancel Edit",
                    BtnSelect: "Select And Edit",
                    BtnLine: "Draw Line",
                    BtnArrow: "Draw Arrow",
                    BtnRect: "Draw Rectangle",
                    BtnBrace: "Draw Brace",
                    BtnEllipse: "Draw Ellipse",
                    BtnPolygon: "Draw Polygon",
                    BtnPolyline: "Draw Polyline",
                    BtnPosition: "Add Position",
                    BtnRemark: "Add Remark",
                    BtnLinetext: "Draw Linetext",

                    BtnFinish: "Finish",
                    BtnSave: "Save",
                    BtnEdit: "Edit",
                    BtnDelete: "Delete",
                    BtnBack: "Back To Main Toolbar"
                }
            },
            Labels: {
                AnnotationType: "Annotations:"
            },
            Dialog: {
                Compact: {
                    Title: "Compact Browsing",
                    Message: "This function is disabled in compact browsing. " +
                    "You can go to [Options] to turn it off."
                },
                NotSupported: {
                    Title: "Not Supported",
                    Message: 'It seems this function is not supported well on your browser. ' +
                    'Please use the latest ' +
                    '<a href="https://www.google.com/chrome" target="_blank">Chrome</a>,' +
                    '<a href="http://www.mozillaonline.com/" target="_blank">Firefox</a> or' +
                    '<a href="http://www.apple.com/safari/" target="_blank">Safari</a>' +
                    ' for a better browsing experience.'
                },
                Options: {
                    Title: "Options",
                    Compact: "Compact:",
                    Ruler: "Ruler:",
                    Grid: "Grid:",
                    On: "On",
                    Off: "Off"
                },
                Edit: {
                    Title: "Edit Annotation",
                    LineWidth: "Line Width：",
                    Name: "Name：",
                    Description: "Description：",
                    Color: "Color："
                },
                AskSave: {
                    Title: "Save Annotations",
                    Message: "Annotations have been changed, do you want to save ?"
                },
                Buttons: {
                    AutoShow: "Show Automatically",
                    Ok: "Ok",
                    Cancel: "Cancel",
                    Yes: "Yes",
                    No: "No"
                }
            },
            Annotations: {
                Measurement: {
                    TxtLength: "Length：",
                    TxtWidth: "Width：",
                    TxtHeight: "Height：",
                    TxtAngle: "Angle：",
                    TxtArcLength: "Arc Length：",
                    TxtArea: "Area：",
                    TxtMajorhalfaxis: "Major half axis：",
                    TxtMinorhalfaxis: "Minor half axis：",
                    TxtPerimeter: "Perimeter：",
                    TxtRadius: "Radius：",
                    TxtDescription: "Description：",
                    TxtUnit: " um",
                    TxtAreaUnit: " squm",
                    TxtDeg: " Deg"
                },
                Default: {
                    Name: "New Annotation",
                    Description: "Description"
                }
            },
            Messages: {
                SaveSuccess: "Save Successfully.",
                SaveFailed: "Save Failed.",
                ExitConfirm: "The Slide's data has been changed, do you want to exit without saving ?",
                SaveAnnotationSuccess: "Save annotations successfully.",
                SaveAnnotationFailed: "Save annotations failed."
            }
        },
        zh: {
            Buttons: {
                MainToolbar: {
                    BtnBack: "返回",
                    BtnHome: "自适应窗口",
                    Options: "选项",
                    ZoomIn: "放大",
                    ZoomOut: "缩小",
                    Annotation: "标注",
                    times:"倍"
                },
                AnnoToolbar: {
                    BtnHand: "取消选择",
                    BtnSelect: "选择并编辑",
                    BtnLine: "绘制直线",
                    BtnArrow: "绘制带箭头直线",
                    BtnBrace: "绘制大括号",
                    BtnRect: "绘制矩形",
                    BtnEllipse: "绘制椭圆",
                    BtnPolygon: "绘制多边形",
                    BtnPolyline: "绘制折线",
                    BtnPosition: "标记位置",
                    BtnRemark: "标注文字",
                    BtnLinetext: "绘制带文字的直线",

                    BtnFinish: "完成",
                    BtnSave: "保存",
                    BtnEdit: "编辑",
                    BtnDelete: "删除",
                    BtnBack: "返回"
                }
            },
            Labels: {
                AnnotationType: "标注类型:"
            },
            Dialog: {
                Compact: {
                    Title: "精简模式",
                    Message: "精简模式下该功能是关闭的。您可以到 【选项】 关闭精简模式。"
                },
                NotSupported: {
                    Title: "不支持",
                    Message: '您的浏览器还不能很好的支持此功能，请使用最新的 ' +
                    '<a href="https://www.google.com/chrome" target="_blank">Chrome</a>, ' +
                    '<a href="http://www.mozillaonline.com/" target="_blank">Firefox</a> 或 ' +
                    '<a href="http://www.apple.com/safari/" target="_blank">Safari</a> ' +
                    '浏览器以获得更好的体验。'
                },
                Options: {
                    Title: "选项",
                    Compact: "精简模式:",
                    Ruler: "标尺:",
                    Grid: "网格:",
                    On: "开",
                    Off: "关"
                },
                Edit: {
                    Title: "编辑标注",
                    LineWidth: "线条宽度：",
                    Name: "名称：",
                    Description: "描述：",
                    Color: "颜色："
                },
                AskSave: {
                    Title: "保存标注",
                    Message: "标注已经改变，是否保存？"
                },
                Buttons: {
                    AutoShow: "自动显示",
                    Ok: "确定",
                    Cancel: "取消",
                    Yes: "是",
                    No: "否"
                }
            },
            Annotations: {
                Measurement: {
                    TxtLength: "长度：",
                    TxtWidth: "宽：",
                    TxtHeight: "高：",
                    TxtAngle: "角度：",
                    TxtArcLength: "弧长：",
                    TxtArea: "面积：",
                    TxtMajorhalfaxis: "长半轴：",
                    TxtMinorhalfaxis: "短半轴：",
                    TxtPerimeter: "周长：",
                    TxtRadius: "半径：",
                    TxtDescription: "描述：",
                    TxtUnit: " 微米",
                    TxtAreaUnit: " 平方微米",
                    TxtDeg: " 度"
                },
                Default: {
                    Name: "新标注",
                    Description: "请输入"
                }
            },
            Messages: {
                SaveSuccess: "保存成功。",
                SaveFailed: "保存失败！",
                ExitConfirm: "切片的数据已经改变，是否直接退出？",

                SaveAnnotationSuccess: "标注保存成功。",
                SaveAnnotationFailed: "标注保存失败！"
            }
        }
    };

    function getLanguage() {
        var language = Config.language;

        if (viewer_strings[language]) {
            return viewer_strings[language];
        } else {
            if ((language === undefined || language === null || language === "" ||
                language === "auto")) {
                language = window.navigator.userLanguage || window.navigator.language;
                var split = language.split("-");
                language = split[0];

                if (!viewer_strings[language]) {
                    language = "en";
                }

                Config.language = language;
                return viewer_strings[language];
            }
        }
    }

    Strings = SL.Strings = {};

    Strings.getString = function (str) {
        var str_split = str.split("."),
            language = getLanguage();

        for (var i = 0; i < str_split.length; i++) {
            language = language[str_split[i]] || {};
        }

        if (typeof language !== "string") {
            language = "";
        }

        var args = arguments;

        return language.replace(/\{\d+\}/g, function (str) {
            var index = parseInt(str.match(/\d+/)) + 1;
            return index < args.length ? arguments[index] : "";
        });
    };
})();

/**
 * Pathology - 1.0.0
 * @email v
 * @author 
 */

// 整个页面公共 配置对象
var Config = SL.Config;

(function () {
    if (Config) {
        return;
    }

    var config = {};

    Config = SL.Config = {
        language: "auto",
        debugMode: true,

        enableAnnotation: true,
        enableImageAdjustmet:true,
        autoShowAnnoDialog: false,

        showOption: true,
        dialogDraggable: true,

        // Shape
        //imagePath: "img/",

        // 大体病理
        //imagePath: "lib/slidePathology/img/",

        // 平台
        //imagePath: "/Static/plugins/slidePathology/img/",

        // Foundation Parameter

        showRulers: function (enable) {
            return setItem("showrulers", enable);
        },
        showGrid: function (enable) {
            return setItem("showgrid", enable);
        },
        showLabel: function (enable) {
            return setItem("showlabel", enable);
        },
        compactBrowsing: function (enable) {
            if (enable !== undefined) {
                setCompact(enable);
            }

            return setItem("compactbrowsing", enable);
        },
        showNavMap: function (enable){
            return n("shownavmap,enable,!10");
        }
    };

    Slide.Config.showNavBtnGroup = false;
    Slide.Config.debugMode = Config.debugMode;
    Slide.Config.autoHideControls = false;
    Slide.Config.maxZoomPixelRatio = 2;
    Slide.Config.imageLoaderLimit = 4;
    Slide.Config.zoomPerClick = 1.0;

    setCompact(Config.compactBrowsing());

    function setItem(name, enable, on_off) {
        if (enable === undefined) {
            if (config[name] === undefined) {
                var cookie = $.cookie(name);

                if (cookie) {
                    config[name] = (cookie === "on");
                } else {
                    config[name] = (on_off === true);
                }
            }

            return config[name];
        }

        config[name] = enable;

        if (enable) {
            $.cookie(name, "on", {expires: 7});
        } else {
            $.cookie(name, "off", {expires: 7});
        }
    }

    // 设置精简模式
    function setCompact(enable) {
        if (enable) {
            Config.enableAnnotation = false;
            Slide.Config.animationTime = 0;
            Slide.Config.blendTime = 0;
            Slide.Config.immediateRender = true;
        } else {
            Config.enableImageAdjustmet = true;
            Config.enableAnnotation = true;
            Slide.Config.animationTime = 1;
            Slide.Config.blendTime = 0.5;
            Slide.Config.immediateRender = false;
        }
    }
})();

/**
 * Pathology - 1.0.0
 * @email v
 * @author 
 */

var ActiveMove = SL.ActiveMove;

(function () {
    if (ActiveMove) {
        return;
    }

    ActiveMove = SL.ActiveMove = {
        None: "None",
        StartMove: "StartMove",
        EndMove: "EndMove",
        LeftTopMove: "LeftTopMove",
        RightTopMove: "RightTopMove",
        LeftBottomMove: "LeftBottomMove",
        RightBottomMove: "RightBottomMove",
        TopMiddleMove: "TopMiddleMove",
        BottomMiddleMove: "BottomMiddleMove",
        LeftMiddleMove: "LeftMiddleMove",
        RightMiddleMove: "RightMiddleMove",
        PointMove: "PointMove",
        ShapeMove: "ShapeMove"
    };
})();

var ClickResult = SL.ClickResult;

(function () {
    ClickResult = SL.ClickResult = function () {
        this.isIn = false;
        this.length = 0;
        this.activeMove = ActiveMove.None;
        this.pIndex = 0;
    };
})();

var AnnotationType = SL.AnnotationType;

(function () {
    if (AnnotationType) {
        return;
    }

    AnnotationType = SL.AnnotationType = {
        NONE: "NONE",
        Line: "Line",
        Arrow: "Arrow",
        Brace: "Brace",
        Rectangle: "Rectangle",
        Ellipse: "Ellipse",
        Remark: "Remark",
        Angle: "Angle",
        Arc: "Arc",
        Polygon: "Polygon",
        Polyline: "Polyline",
        Linetext: "Linetext"
    };
})();

var Measurement = SL.Measurement;

(function () {
    if (Measurement) {
        return;
    }

    Measurement = SL.Measurement = function () {
        this.Length = Strings.getString("Annotations.Measurement.TxtLength");
        this.Width = Strings.getString("Annotations.Measurement.TxtWidth");
        this.Height = Strings.getString("Annotations.Measurement.TxtHeight");
        this.Angle = Strings.getString("Annotations.Measurement.TxtAngle");
        this.ArcLength = Strings.getString("Annotations.Measurement.TxtArcLength");
        this.Area = Strings.getString("Annotations.Measurement.TxtArea");
        this.Majorhalfaxis = Strings.getString("Annotations.Measurement.TxtMajorhalfaxis");
        this.Minorhalfaxis = Strings.getString("Annotations.Measurement.TxtMinorhalfaxis");
        this.Perimeter = Strings.getString("Annotations.Measurement.TxtPerimeter");
        this.Radius = Strings.getString("Annotations.Measurement.TxtRadius");
        this.Description = Strings.getString("Annotations.Measurement.TxtDescription");
        this.Unit = Strings.getString("Annotations.Measurement.TxtUnit");
        this.AreaUnit = Strings.getString("Annotations.Measurement.TxtAreaUnit");
        this.Deg = Strings.getString("Annotations.Measurement.TxtDeg");
    };
})();

var ShapeConfig = SL.ShapeConfig;

(function () {
    if (ShapeConfig) {
        return;
    }

    ShapeConfig = SL.ShapeConfig = function () {
        this.defaultColor = "#0000ff";
        this.lineWidth = 2;
        this.thumbRadius = 5;
        this.thumbMoveRadius = 8;
        this.thumbHitRadius = 20;
        this.thumbHitMoveRadius = 40;
        this.name = Strings.getString("Annotations.Default.Name");
        this.description = Strings.getString("Annotations.Default.Description");
    };
})();

var Shape = SL.Shape;

(function () {
    Shape = SL.Shape = function (shapeViewer, startPt, endPt) {
        // Fields
        var self = this;

        // Properties
        this.startPoint = startPt;
        this.endPoint = endPt;
        this.rsPoint = new Point(0, 0);
        this.rePoint = new Point(0, 0);
        this.movePoint = new Point(0, 0);

        this.width = shapeViewer.ShapeConfig.lineWidth;
        this.color = shapeViewer.ShapeConfig.defaultColor;

        this.id = null;
        this.guid = null;
        this.imageId = null;
        this.imageIndex = 0;

        this.name = shapeViewer.ShapeConfig.name;
        this.description = shapeViewer.ShapeConfig.description;

        this.scale = 1;
        this.calibration = 0;

        this.type = AnnotationType.NONE;
        this.region = null;
        this.fontUnderLine = false;
        this.fontSize = 11;
        this.fontFamily = "Microsoft Sans Serif";
        this.fontItalic = false;
        this.fontBold = false;
        this.visible = true;
        this.measurement = true;
        this.radius = 0;
        this.arcLength = 0;
        this.angle = 0;
        this.points = [];
        this.isEndDrawing = false;
        this.txtElmt = null;
        this.inpElmt = null;
        this.container = shapeViewer.getContainer();
        this.isSelected = false;
        this.cavScale = null;
        this.cavOffset = null;
        this.moveOffset = null;
        this.activeMove = ActiveMove.None;
        this.isMeasurementChanged = true;
        this.isDrawStart = false;
        this.cavRect = null;

        // Public methods

        // 计算测量信息
        this.calcMeasurementInfo = function () {};

        // 激活当前图形
        this.active = function () {};

        // 移动图形
        this.shapeMovePosition = function () {};

        // 判断是否点击当前图形
        this.isHitMe = function () {};

        // 绘制激活点
        this.drawThumb = function (point) {
            if (point !== null) {
                var context = self.getContext();
                context.beginPath();
                context.lineWidth = 2;
                context.arc(point.x, point.y,
                    shapeViewer.ShapeConfig.thumbRadius, 0, Math.PI * 2, false);
                context.fillStyle = "rgba(255, 255, 255, 0.6)";
                context.fill();
                context.strokeStyle = "#666465";
                context.stroke();
            }
        };

        // 绘制拖动激活点
        this.drawMoveThumb = function (point) {
            if (point !== null) {
                var context = self.getContext();
                context.beginPath();
                context.lineWidth = 2;
                context.arc(point.x, point.y,
                    shapeViewer.ShapeConfig.thumbMoveRadius, 0, Math.PI * 2, false);
                context.fillStyle = "rgba(255, 255, 255, 0.6)";
                context.fill();
                context.strokeStyle = "#666465";
                context.stroke();
            }
        };

        // 获取画板环境上下文
        this.getContext = function () {
            if (self.isSelected) {
                return shapeViewer.DrawCanvas.getContext("2d");
            } else {
                return shapeViewer.Canvas.getContext("2d");
            }
        };

        // 开始绘制
        this.drawStart = function (point) {
            self.startPoint = point.times(1);
            self.endPoint = new Point(point.x, point.y);
            self.drawThumb(self.toCanvasPoint(point));
            self.isDrawStart = true;
        };

        // 绘制移动
        this.drawMove = function (point) {
            self.endPoint = point.times(1);
            self.isDrawStart = false;
        };

        // 绘制点击
        this.drawClick = function (point) {
            if (point !== null) {
                self.endPoint = point.times(1);
            }

            if (!self.startPoint.equals(self.endPoint)) {
                self.isEndDrawing = true;
                self.isMeasurementChanged = false;
            }
        };

        // 绘制结束
        this.drawEnd = function () {};

        // 刷新绘制
        this.refresh = function (scale, offset) {
            self.cavScale = scale;
            self.cavOffset = offset;
        };

        // 创建测量dom元素
        this.createElmt = function () {
            if (self.txtElmt === null) {
                self.txtElmt = document.createElement("div");
                self.container.appendChild(self.txtElmt);
                Utils.registerMeasurementTxtCSS(self.txtElmt);
            }
        };

        // 显示测量信息
        this.showMeasurement = function () {
            if (!self.measurement || !Config.enableAnnotation) {
                $(self.txtElmt).hide();
                return;
            }

            self.createElmt();
            $(self.txtElmt).show();

            Utils.registerPositionCSS(self.txtElmt,
                self.movePoint.x + shapeViewer.ShapeConfig.thumbMoveRadius,
                self.movePoint.y + shapeViewer.ShapeConfig.thumbMoveRadius);

            if (self.isMeasurementChanged) {
                var measureInfo = self.calcMeasurementInfo();

                if (Utils.isHasEnter(self.description)) {
                    var str1 = "<table style='border-spacing:0px;'><tr>";
                    str2 = "<td>" + shapeViewer.Measurement.Description + "</td>" +
                        Utils.replaceHtmlEnter("<td>" + this.description + "</td></tr></table>");
                    measureInfo += Utils.append(str1, str2);
                } else {
                    measureInfo += Utils.appendLine(shapeViewer.Measurement.Description, self.description);
                }

                $(self.txtElmt).html(measureInfo);
                //self.isMeasurementChanged = false;
            } else {
                $(self.txtElmt).hide();
            }
        };

        // 是否点击到当前图形区域
        this.isHitMyArea = function (point) {
            if (self.type === AnnotationType.Remark || self.type === AnnotationType.Position) {
                return false;
            } else {
                var rsPtX, rsPtY, rePtX, rePtY;

                if (self.rsPoint.x < self.rePoint.x) {
                    rsPtX = self.rsPoint.x;
                    rePtX = self.rePoint.x;
                } else {
                    rsPtX = self.rePoint.x;
                    rePtX = self.rsPoint.x;
                }

                if (self.rsPoint.y < self.rePoint.y) {
                    rsPtY = self.rsPoint.y;
                    rePtY = self.rePoint.y;
                } else {
                    rsPtY = self.rePoint.y;
                    rePtY = self.rsPoint.y;
                }

                var centerX = self.width / 2;

                if (rsPtX - centerX <= point.x && point.x <= rePtX + centerX &&
                    rsPtY - centerX < point.y && point.y <= rePtY + centerX) {
                    self.isSelected = true;
                } else {
                    self.isSelected = false;
                }

                self.cavRect = new Rect(rsPtX, rsPtY, rePtX - rsPtX, rePtY - rsPtY);
                return self.isSelected;
            }
        };

        // 设置点
        this.resetPoint = function (point, scale, offset) {
            var pt = point.times(1);

            if (scale) {
                pt = pt.times(scale);
            }

            if (offset) {
                pt = pt.plus(offset);
            }

            return pt;
        };

        // 重置默认颜色
        this.resetDefaultColor = function () {
            shapeViewer.ShapeConfig.defaultColor = self.color;
        };

        // 点到激活点
        this.clickInThumb = function (point, testPt) {
            return Utils.clickInCircleResult(shapeViewer.ShapeConfig.thumbHitRadius,
                point, testPt, self.width);
        };

        // 点到拖动激活点
        this.clickInMoveThumb = function (point, testPt) {
            return Utils.clickInCircleResult(shapeViewer.ShapeConfig.thumbHitMoveRadius,
                point, testPt, self.width);
        };

        // 添加点击结果
        this.addClickResult = function (resultAry, point, testPt, type, index) {
            var hitResult = self.clickInThumb(point, testPt);

            if (hitResult.isIn) {
                hitResult.activeMove = type;
                hitResult.pIndex = index;
                resultAry.push(hitResult);
            }
        };

        // 设置最近图形
        this.setNearestMove = function (hitResultAry) {
            if (hitResultAry.length <= 0) {
                self.activeMove = ActiveMove.None;
            } else if (hitResultAry.length === 1) {
                self.activeMove = hitResultAry[0].activeMove;
                self.pIndex = hitResultAry[0].pIndex;
            } else {
                var pos = 0, len = 0;

                for (var index = 0; index < hitResultAry.length; index++) {
                    if (index === 0) {
                        len = hitResultAry[index].length;
                    } else {
                        if (hitResultAry[index].length < len) {
                            len = hitResultAry[index].length;
                            pos = index;
                        }
                    }
                }

                self.activeMove = hitResultAry[pos].activeMove;
                self.pIndex = hitResultAry[pos].pIndex;
            }
        };

        // 设置激活移动点
        this.resetActiveMovePoint = function (realPt, pt, offset) {
            if (offset === null || typeof offset === "undefined") {
                if (self.moveOffset === null) {
                    return;
                }

                realPt.x += self.moveOffset.x;
                realPt.y += self.moveOffset.y;
            } else {
                realPt.x += offset.x;
                realPt.y += offset.y;
            }

            pt.x = (realPt.x - self.cavOffset.x) / self.cavScale;
            pt.y = (realPt.y - self.cavOffset.y) / self.cavScale;
        };

        // 设置开始坐标
        this.resetStartPoint = function (point) {
            self.rsPoint = point.times(1);
            self.startPoint = self.toImagePoint(point);
        };

        // 设置结束坐标
        this.resetEndPoint = function (point) {
            self.rePoint = point.times(1);
            self.endPoint = self.toImagePoint(point);
        };

        // 把坐标转换到图像中
        this.toImagePoint = function (point) {
            return point.minus(self.cavOffset).divide(self.cavScale);
        };

        // 把坐标转换到画板中
        this.toCanvasPoint = function (point) {
            return point.times(self.cavScale).plus(self.cavOffset);
        };
    };
})();

var Measure = SL.Measure;

(function () {
    Measure = SL.Measure = function (canvas, calibration) {
        // Fields
        var self = this;

        // Properties
        this.canvas = canvas;
        this.calibration = calibration;
        this.cellWidth = 640;
        this.minCellWidth = 80;
        this.maxCellWidth = 200;
        this.cavScale = 0;
        this.cavOffset = new Point(0, 0);
        this.autoAdjustCellWidth = true;
        this.location = new Point(0, 0);
        this.defaultPadding = 20;
        this.containerSize = null;
        this.width = 1;
        this.color = "#363736";

        // Public methods

        // 获取画板上下文环境
        this.getContext = function () {
            if (self.canvas) {
                return self.canvas.getContext("2d");
            }

            return null;
        };

        // 刷新参数
        this.refresh = function (scale, offset) {
            self.cavScale = scale;
            self.cavOffset = offset;
        };

        // 重置容器尺寸
        this.resetContainerSize = function (width, height) {
            self.containerSize = new Point(width, height);
        };

        // 绘制函数
        this.draw = function () {};
    };
})();

var Grid = SL.Grid;

(function () {
    Grid = SL.Grid = function (canvas, calibration, imgW, imgH, containerW, containerH) {
        Measure.apply(this, [canvas, calibration]);

        // Fields
        var self = this;

        // Properties
        this.imgSize = new Point(imgW, imgH);
        this.containerSize = new Point(containerW, containerH);
        this.displayRect = new Rect();

        // Public methods

        this.draw = function (radio, offset) {
            self.refresh(radio, offset);
            var gridWidth = self.cellWidth * self.cavScale / self.calibration;

            if (self.autoAdjustCellWidth) {
                if (gridWidth < self.minCellWidth) {
                    self.cellWidth *= 2;
                    self.draw(radio, offset);
                    return;
                }

                if (gridWidth > self.maxCellWidth) {
                    self.cellWidth /= 2;
                    self.draw(radio, offset);
                    return;
                }
            }

            if (!Config.showRulers()) {
                self.defaultPadding = 0;
            }

            self.displayRect.x = self.cavOffset.x;
            self.displayRect.y = self.cavOffset.y;
            self.displayRect.width = self.imgSize.x * self.cavScale;
            self.displayRect.height = self.imgSize.y * self.cavScale;

            if (!(self.displayRect.width < imgW) && !(self.displayRect.height < imgH)) {
                var context = self.getContext();
                context.beginPath();

                var left = self.location.x + self.defaultPadding,
                    top = self.location.y + self.defaultPadding,
                    point = (new Point(left, top)).plus(self.cavOffset);

                var startLeft = point.x % gridWidth - left,
                    startTop = point.y % gridWidth - top;

                if (self.containerSize.x < self.displayRect.width &&
                    self.containerSize.y < self.displayRect.height) {
                    for (var x = startLeft; x < self.containerSize.x; x += gridWidth) {
                        context.moveTo(x, top);
                        context.lineTo(x, self.containerSize.y);
                    }

                    for (var y = startTop; y < self.containerSize.y; y += gridWidth) {
                        context.moveTo(left, y);
                        context.lineTo(self.containerSize.x, y);
                    }
                } else {
                    for (var x = self.displayRect.x;
                         x < self.displayRect.width + self.displayRect.x; x += gridWidth) {
                        context.moveTo(x, self.displayRect.y);
                        context.moveTo(x, self.displayRect.y + self.displayRect.height);
                    }

                    for (var y = self.displayRect.y;
                         y < self.displayRect.height + self.displayRect.y; y += gridWidth) {
                        context.moveTo(self.displayRect.x, y);
                        context.lineTo(self.displayRect.x + self.displayRect.width, y);
                    }
                }

                context.lineWidth = self.width;
                context.strokeStyle = "Grey";
                context.stroke();
            }
        };
    };
})();

var Scale =SL.Scale;

(function () {
    Scale =SL.Scale =function (canvas, calibration) {
        Measure.apply(this, [canvas, calibration]);

        var self = this,
            left = 25,
            ruler = null,
            px = "px",
            top = 25,
            width = 90,
            rulerWidth,
            ratio = null,
            multipleArray = [0.01,0.02,0.04,0.1,0.2,0.4,1,2,4,10,20,40,100,200,400],
            minScale = 0.4,
            maxScale = 1,
            arrayIndex = 6,
            rulerText,

            height = 10;

        this.showScale = function(radio, offset) {
            self.refresh(radio, offset);
            rulerWidth = self.cellWidth * self.cavScale / self.calibration;

            if(rulerWidth < self.minCellWidth){
                self.cellWidth *=2;
                self.showScale(radio, offset);
                return;
            }
            else if(rulerWidth > self.maxCellWidth){
                self.cellWidth /=2;
                self.showScale(radio, offset);
                return;
            }
            //    if (self.cavScale*44.99 > maxScale) {
            //        self.cellWidth = self.cellWidth /(maxScale/minScale);
            //        arrayIndex += 1;
            //        maxScale = multipleArray[arrayIndex + 1];
            //        minScale = multipleArray[arrayIndex ];
            //
            //        self.showScale(radio, offset);
            //            return;
            //    }
            //
            //    if (self.cavScale*44.99 < minScale) {
            //    self.cellWidth = self.cellWidth *(multipleArray[arrayIndex]/multipleArray[arrayIndex-1]);
            //    maxScale = multipleArray[arrayIndex];
            //    minScale = multipleArray[arrayIndex - 1];
            //        arrayIndex -= 1;
            //    self.showScale(radio, offset);
            //    return;
            //}

            //    if (rulerWidth > self.maxCellWidth) {
            //        self.cellWidth /= 2;
            //        self.showScale(radio, offset);
            //        return;
            //    }
            //}

            $(ruler).css({
                width:rulerWidth +px
            });
            //console.log("实际长度 = "+self.cellWidth);
            //console.log("self.cavScale = " + self.cavScale);
            //console.log("calibration = " + self.calibration);
            //console.log("线段长度" + rulerWidth);
            //console.log("倍数：= " + self.cavScale*44.99);
            if(self.cellWidth >= 1000) {
                rulerText = this.cellWidth/1000 + "mm";
            }
            else {
                rulerText = this.cellWidth + "µm";
            }
            $("#Ratio").text(rulerText);
        };



        (function () {
            initRuler();
            initRulerCss();
            //console.log("cellWidth = "+self.cellWidth);
            //console.log("self.cavScale = " + self.cavScale);
            //console.log("calibration = " + self.calibration);
            //console.log("rulerWidth" + rulerWidth);
        })();

        function initRuler() {
            $("#Ruler").remove();
            ruler = document.createElement("div");
            ruler.id = "Ruler";
            ruler.style.width = rulerWidth + px;
            ruler.style.height = height + px;

            ratio = document.createElement("div");
            ratio.id = "Ratio";
            ratio.style.top = "-10px";
           // ratio.style.height = "15px";
            ruler.appendChild(ratio);

        }
       function initRulerCss() {
           $(ruler).css({
               position: "relative",
               "z-index": "0",
               border: "solid #000000",
               "border-top-width": "0",
               "border-left-width": "2px",
               "border-right-width": "2px",
               "border-bottom-width": "2px",
               "margin-bottom":"10px",
               "margin-right":"10px",
               "text-align":"center"
           });
           $(ratio).css({

               position: "relative",
               "margin":"0 auto",
               color: "#000000"
           });

           self.elmt = ruler;

        }

        this.setRatioText =function() {
            if(self.cellWidth >= 1000) {
                rulerText = this.cellWidth/1000 + "mm";
            }
            else {
                rulerText = this.cellWidth + "µm";
            }

            document.getElementById("Ratio").innerHTML = rulerText;
        };
        this.setVisibility = function (isShow) {
            if(isShow){
                $(ruler).show();
            }else{
                $(ruler).hide();
            }

        };
    }
})();

var Ruler = SL.Ruler;

(function () {
    Ruler = SL.Ruler = function (canvas, calibration, containerW, containerH) {
        Measure.apply(this, [canvas, calibration]);

        // Fields
        var self = this;

        // Properties
        this.divisionMark = 5;
        this.divisionMajorMark = this.defaultPadding;
        this.divisionNum = 5;
        this.containerSize = new Point(containerW, containerH);
        this.zeroPoint = null;

        // Public methods


        this.draw = function (radio, offset) {
            self.refresh(radio, offset);
            var rulerWidth = self.cellWidth * self.cavScale / self.calibration;

            if (self.autoAdjustCellWidth) {
                if (rulerWidth < self.minCellWidth) {
                    self.cellWidth *= 2;
                    self.draw(radio, offset);
                    return;
                }

                if (rulerWidth > self.maxCellWidth) {
                    self.cellWidth /= 2;
                    self.draw(radio, offset);
                    return;
                }
            }

            self.zeroPoint = self.cavOffset.times(1);

            var context = self.getContext();
            context.beginPath();
            context.fillStyle = "#ffffff";
            context.fillRect(self.location.x, self.location.y,
                self.containerSize.x, self.divisionMajorMark);
            context.fillRect(self.location.x, self.location.y,
                self.divisionMajorMark, self.containerSize.y);
            context.font = "12px Microsoft Sans Serif,宋体";
            context.fillStyle = self.color;

            var num = 0,
                divNum = rulerWidth / self.divisionNum,
                left = self.location.x + self.divisionMajorMark,
                top = self.location.y + self.divisionMajorMark,
                point = (new Point(left, top)).plus(self.cavOffset),
                startLeft = point.x % rulerWidth - left,
                startTop = point.y % rulerWidth - top;

            context.moveTo(left, top);
            context.lineTo(self.location.x + self.containerSize.x, top);

            for (var x = startLeft; x < self.containerSize.x; x += divNum) {
                if (x < left) {
                    num++;
                    continue;
                }

                if (num % self.divisionNum == 0) {
                    context.moveTo(x, top);
                    context.lineTo(x, top - self.divisionMajorMark);
                    var str = Utils.floatRound((x - self.zeroPoint.x) *
                        self.cellWidth / rulerWidth).toString();
                    context.fillText(str, x + 2, top / 1.5);
                } else {
                    context.moveTo(x, top);
                    context.lineTo(x, top - self.divisionMark);
                }

                num++;
            }

            num = 0;
            context.moveTo(left, top);
            context.lineTo(left, self.location.y + self.containerSize.y);

            for (var y = startTop; y < self.containerSize.y; y += divNum) {
                if (y < top) {
                    num++;
                    continue;
                }

                if (num % self.divisionNum == 0) {
                    context.moveTo(left, y);
                    context.lineTo(left - self.divisionMajorMark, y);
                    context.rotate(Math.PI * 3 / 2);
                    var str = Utils.floatRound((y - self.zeroPoint.y) *
                        self.cellWidth / rulerWidth).toString();
                    context.fillText(str, -(y + str.length * 8), left / 1.5);
                    context.rotate(Math.PI / 2);
                } else {
                    context.moveTo(left, y);
                    context.lineTo(left - self.divisionMark, y);
                }

                num++;
            }

            context.lineWidth = self.width;
            context.strokeStyle = self.color;
            context.stroke();
        };
    };
})();

var ShapeCanvas = SL.ShapeCanvas;

(function () {
    ShapeCanvas = SL.ShapeCanvas = function (viewer) {
        // Fields
        var self = this,
            shapeContainer = null,
            shapeCanvas = null,
            drawCanvas = null,
            measureCanvas = null,

            currentSlide = null,

            canMove = false,
            isDrawing = false,
            isAnimationStart = false,

            shapeAry = [], // Have draw shape array
            annotations = [], // Shape data not draw
            activeShape = null,
            drawAnnotationType = null, // draw element type
            zoomScale = 1,
            slideIndex = 0, // current image number

            startPage = null,    // (evt.pageX, evt.pageY)
            startPoint = null, // mouse down or touch start point
            imageTL = null, // image top left position
            elmtPosition = null, // Shape canvas position

            grid = null,
            c_ruler = null,
            ruler = null;

        // Properties
        this.isShapeChanged = false;
        this.isSelectedEnable = true;
        this.isShowInfo = true;

        this.Canvas = null;
        this.DrawCanvas = null;
        this.Measurement = null;
        this.ShapeConfig = new ShapeConfig();

        // Private methods
        // Initialize

        // 初始化或者重置画板尺寸
        function resetCanvasSize() {
            if (viewer.viewport) {
                var size = viewer.viewport.getContainerSize();

                shapeCanvas.width = size.x;
                shapeCanvas.height = size.y;

                drawCanvas.width = size.x;
                drawCanvas.height = size.y;

                measureCanvas.width = size.x;
                measureCanvas.height = size.y;

                // 用isOpen判断
                if (currentSlide != null) {
                    //grid.resetContainerSize(size.x, size.y);
                    //ruler.resetContainerSize(size.x, size.y);
                    self.showAnnotations();
                }

                shapeContainer.style.width = size.x + "px";
                shapeContainer.style.height = size.y + "px";
            }
        }

        // 清空激活的图形并清空drawCanvas画板
        function clearActiveShape() {
            if (activeShape != null) {
                activeShape.isSelected = false;
                activeShape.measurement = false;
            }

            activeShape = null;
            clearRect(drawCanvas);
        }

        // 清空指定canvas
        function clearRect(canvas) {
            canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
        }

        // 初始化或者重置缩放参数和图像左上角位置
        function resetParameters() {
            var bounds = viewer.viewport.getBounds(true),
                zoom = viewer.viewport.getZoom(true),
                size = viewer.viewport.getContainerSize();

            slideIndex = viewer.viewport.getSlide(true);
            zoomScale = size.x * zoom / currentSlide.width;
            imageTL = bounds.getTopLeft().times(-1).times(size.x * zoom);
        }

        // Mouse event handling

        // 在触摸模式下 触摸开始事件响应函数(创建等操作)
        function touchStart(evt) {
            var orEvt = evt.originalEvent;
            elmtPosition = Slide.Utils.getElementPosition(shapeCanvas);
            startPage = (new Point(orEvt.targetTouches[0].pageX,
                orEvt.targetTouches[0].pageY)).minus(elmtPosition);

            if (drawAnnotationType == null && hitObjTest(startPage)) {
                self.showAnnotations();

                if ((self.isSelectedEnable || activeShape != null) &&
                    activeShape.activeMove !== ActiveMove.None) {
                    return false;
                }
            }

            if (drawAnnotationType != null) {
                if (activeShape != null && activeShape.isEndDrawing) {
                    startPage = startPage.minus(imageTL);
                    return false;
                }

                if (resetSelected()) {
                    self.showAnnotations();
                }

                startPage = startPage.minus(imageTL);

                var point = startPage.divide(zoomScale),
                    shape = null, shapeSP = point.times(1), shapeEP = point.times(1);

                switch (drawAnnotationType) {
                    case AnnotationType.Line:
                        shape = new Line(self, shapeSP, shapeEP);
                        break;
                    case AnnotationType.Arrow:
                        shape = new Arrow(self, shapeSP, shapeEP);
                        break;
                    case AnnotationType.Rectangle:
                        shape = new Rectangle(self, shapeSP, shapeEP);
                        break;
                    case AnnotationType.Ellipse:
                        shape = new Ellipse(self, shapeSP, shapeEP);
                        break;
                    case AnnotationType.Remark:
                        shape = new Remark(self, shapeSP, shapeEP);
                        break;
                    case AnnotationType.Position:
                        shape = new Position(self, shapeSP, shapeEP);
                        break;
                    case AnnotationType.Angle:
                        shape = new Angle(self, shapeSP, shapeEP);
                        break;
                    case AnnotationType.Polygon:
                        shape = new Polygon(self, shapeSP, shapeEP);
                        break;
                    case AnnotationType.Brace:
                        shape = new Brace(self, shapeSP, shapeEP);
                        break;
                    case AnnotationType.Polyline:
                        shape = new Polyline(self, shapeSP, shapeEP);
                        break;
                    case AnnotationType.Linetext:
                        shape = new Linetext(self, shapeSP, shapeEP);
                        break;
                    default :
                        shape = null;
                        break;
                }

                // 给 shape 属性参数赋值
                activeShape = shape;
                activeShape.imageId = currentSlide.id;
                activeShape.guid = Utils.guidGenerator();
                activeShape.imageIndex = slideIndex;

                activeShape.type = drawAnnotationType;
                activeShape.scale = zoomScale;
                activeShape.guid = Utils.guidGenerator();
                activeShape.calibration = currentSlide.calibration;
                activeShape.isSelected = true;
                activeShape.refresh(zoomScale, imageTL);
                activeShape.drawStart(point);

                isDrawing = true;

                shapeAry.push(shape);
                $(shapeContainer).bind("touchmove", touchMove);

                evt.stopPropagation();
                return false;
            }
        }

        // 在触摸模式下 触摸结束事件响应函数(结束绘制编辑等操作)
        function touchEnd(evt) {
            if (canMove) {
                resetStatus();
                self.showAnnotations();

                evt.stopPropagation();
                return false;
            }

            if (isDrawing && activeShape != null) {
                var point = startPage.divide(zoomScale);
                activeShape.drawClick(point);

                if (activeShape.isEndDrawing) {
                    endDraw(point);
                    self.showAnnotations();

                    return false;
                }
            }
        }


        // 在鼠标模式下 鼠标按下事件响应函数(创建等操作)
        function mouseDown(evt) {
            elmtPosition = Slide.Utils.getElementPosition(shapeCanvas);
            startPage = (new Point(evt.pageX, evt.pageY)).minus(elmtPosition);

            // 绘制对象类型为空,检测是否点击到已经绘制的对象上面
            if (drawAnnotationType == null && hitObjTest(startPage)) {
               self.showAnnotations();

                // 激活选择编辑状态,切 activeShape 存在
                if ((self.isSelectedEnable || activeShape != null) &&
                    activeShape.activeMove !== ActiveMove.None) {
                    return false;
                }
            }

            // 绘制对象类型不为空, 且 activeShape 不为空或者正在绘制中
            if (drawAnnotationType != null &&
                (activeShape == null || activeShape.isEndDrawing)) {
                // 取消已经选择的对象
                if (resetSelected()) {
                    self.showAnnotations();
                }
                startPage = startPage.minus(imageTL);
                var point = startPage.divide(zoomScale),
                    shape = null, shapeSP = point.times(1), shapeEP = point.times(1);

                switch (drawAnnotationType) {
                    case AnnotationType.Line:
                        shape = new Line(self, shapeSP, shapeEP);
                        break;
                    case AnnotationType.Arrow:
                        shape = new Arrow(self, shapeSP, shapeEP);
                        break;
                    case AnnotationType.Rectangle:
                        shape = new Rectangle(self, shapeSP, shapeEP);
                        break;
                    case AnnotationType.Ellipse:
                        shape = new Ellipse(self, shapeSP, shapeEP);
                        break;
                    case AnnotationType.Remark:
                        shape = new Remark(self, shapeSP, shapeEP);
                        break;
                    case AnnotationType.Position:
                        shape = new Position(self, shapeSP, shapeEP);
                        break;
                    case AnnotationType.Angle:
                        shape = new Angle(self, shapeSP, shapeEP);
                        break;
                    case AnnotationType.Polygon:
                        shape = new Polygon(self, shapeSP, shapeEP);
                        break;
                    case AnnotationType.Brace:
                        shape = new Brace(self, shapeSP, shapeEP);
                        break;
                    case AnnotationType.Polyline:
                        shape = new Polyline(self, shapeSP, shapeEP);
                        break;
                    case AnnotationType.Linetext:
                        shape = new Linetext(self, shapeSP, shapeEP);
                        break;
                    default :
                        shape = null;
                        break;
                }

                // 给 shape 属性参数赋值
                activeShape = shape;
                activeShape.imageId = currentSlide.id;
                activeShape.guid = Utils.guidGenerator();
                activeShape.imageIndex = slideIndex;

                activeShape.type = drawAnnotationType;
                activeShape.scale = zoomScale;
                activeShape.calibration = currentSlide.calibration;
                activeShape.isSelected = true;

                activeShape.refresh(zoomScale, imageTL);
                activeShape.drawStart(point);

                isDrawing = true;

                shapeAry.push(shape);
                $(shapeContainer).bind("mousemove", mouseMove);
                //$(shapeContainer).bind("touchmove", touchMove);

                evt.stopPropagation();
                return false;
            }

            // 针对多次点击绘制的情况
            if (drawAnnotationType != null &&
                activeShape != null && !activeShape.isEndDrawing) {
                evt.stopPropagation();
                return false;
            }
        }

        // 在鼠标模式下 鼠标抬起事件响应函数(结束绘制编辑等操作)
        function mouseUp(evt) {
            if (canMove) {
                resetStatus();
                self.showAnnotations();

                evt.stopPropagation();
                return false;
            }

            if (isDrawing && activeShape != null) {
                startPage = (new Point(evt.pageX, evt.pageY)).minus(elmtPosition.plus(imageTL));

                var point = startPage.divide(zoomScale);
                activeShape.drawClick(point);

                if (activeShape.isEndDrawing) {
                    endDraw(point);
                }

                evt.stopPropagation();
                return false;
            }
        }

        function touchHoldOrDblClk(evt) {
            if (isDrawing && activeShape != null) {
                endDraw();
            }

            evt.stopPropagation();
            return false;
        }

        function touchMove(evt) {
            var orEvt = evt.originalEvent;
            orEvt.preventDefault();

            if (1) {
                startPage = (new Point(orEvt.targetTouches[0].pageX,
                    orEvt.targetTouches[0].pageY)).minus(elmtPosition);

                if (startPage.x !== startPoint.x || startPage.y !== startPoint.y) {
                    activeShape.moveOffset = startPage.minus(startPoint);
                    startPoint = startPage;

                    self.showAnnotations();
                    activeShape.moveOffset.times(0);
                }

                shapeChange();

                evt.stopPropagation();
                return false;
            }

            if (isDrawing && activeShape != null) {
                evt.stopPropagation();
            } else {
                return;
            }

            var start = (new Point(orEvt.targetTouches[0].pageX,
                orEvt.targetTouches[0].pageY)).minus(elmtPosition.plus(imageTL));

            if (start.x !== startPage.x || start.y !== startPage.y) {
                startPage = start;

                activeShape.drawMove(startPage.divide(zoomScale));
                self.showAnnotations();
                shapeChange();

                return false;
            }
        }

        function mouseMove(evt) {
            // 拖动
            if (canMove) {
                startPage = (new Point(evt.pageX, evt.pageY)).minus(elmtPosition);

                if (startPage.x !== startPoint.x || startPage.y !== startPoint.y) {
                    activeShape.moveOffset = startPage.minus(startPoint);
                    startPoint = startPage;

                    self.showAnnotations();
                    activeShape.moveOffset.times(0);
                }

                shapeChange();

                // 设置鼠标指针
                shapeContainer.style.cursor = "move";
                evt.stopPropagation();
                return false;
            }

            if (isDrawing && activeShape != null) {
                Utils.setMouseCursor(shapeContainer,
                    [SlideConfig.imagePath, "pen_rm", ".cur"].join(""));
                evt.stopPropagation();
            } else {
                return;
            }

            // 编辑
            var start = (new Point(evt.pageX, evt.pageY)).minus(elmtPosition.plus(imageTL));


            if (start.x !== startPage.x || start.y !== startPage.y) {
                startPage = start.times(1);

                activeShape.drawMove(startPage.divide(zoomScale));
                self.showAnnotations();
                shapeChange();

                return false;
            }
        }

        // Mouse handling helper

        function hitObjTest(point) {
            if (shapeAry == null) {
                return false;
            }

            // 如果 activeShape 不空,隐藏掉测量信息
            if (activeShape != null) {
                activeShape.measurement = false;
            }

            // activeShape不空切isSelected false清空选择的对象(没有取消选择状态)
            if (!(activeShape == null || activeShape.isSelected)) {
                clearActiveShape();
                self.showAnnotations();
            }

            var isSelected = false, selectedAry = [], hasSelected = false;

            // activeShape 不空,检测是否点击的是 activeShape 本身
            if (activeShape != null &&
                activeShape.imageIndex === slideIndex &&
                activeShape.isHitMe(point)) {
                isSelected = true;
                // activeShape 不空,点击的不是 activeShape 且 允许编辑显示测量信息
            } else if (self.isSelectedEnable || self.isShowInfo) {
                for (var i = 0; i < shapeAry.length; i++) {
                    if (shapeAry[i].imageIndex === slideIndex && shapeAry[i].isHitMyArea(point)) {
                        isSelected = true;
                        shapeAry[i].isSelected = false;
                        selectedAry.push(shapeAry[i]);

                        // 检测的点击区域是否是 activeShape
                        if (activeShape === shapeAry[i]) {
                            hasSelected = true;
                        }
                    }
                }
                // 其他情况清空选择状态, 如果 activeShape 不空, 清空当前选择状态
            } else {
                if (activeShape != null) {
                    activeShape.isSelected = false;
                    clearActiveShape();
                    self.showAnnotations();
                }
            }

            // selectedAry 只有一个元素 且 activeShape 不是这个元素
            if (selectedAry.length === 1 && activeShape !== selectedAry[0]) {
                activeShape = selectedAry[0];
                activeShape.isSelected = true;
                // activeShape 不是这个元素 且 selectedAry 中有元素
            } else if (!hasSelected && selectedAry.length > 0) {
                var tmpAnt = null;

                for (var i = 0; i < selectedAry.length; i++) {
                    if (i === 0) {
                        tmpAnt = selectedAry[0];
                    } else {
                        // 寻找图形范围最小的元素
                        if (tmpAnt.cavRect.x < selectedAry[i].cavRect.x &&
                            tmpAnt.cavRect.y < selectedAry[i].cavRect.y &&
                            tmpAnt.cavRect.width > selectedAry[i].cavRect.width &&
                            tmpAnt.cavRect.height > selectedAry[i].cavRect.height) {
                            tmpAnt = selectedAry[i];
                        }
                    }
                }

                // 设置为选择图形对象
                activeShape = tmpAnt;
                activeShape.isSelected = true;
            } else {
                // hasSelected 为真情况
                if (activeShape == null) {
                    activeShape = selectedAry[0];
                }

                for (var i = 0; i < selectedAry.length; i++) {
                    if (activeShape === selectedAry[i]) {
                        if (i < (selectedAry.length - 1)) {
                            activeShape.isSelected = false;
                            activeShape = selectedAry[i + 1];
                            activeShape.isSelected = true;
                        } else {
                            activeShape.isSelected = false;
                            activeShape = selectedAry[0];
                            activeShape.isSelected = true;
                        }

                        break;
                    }
                }
            }

            // activeShape 不空有选择的对象
            if (activeShape != null) {
                // 选择对象为选择状态 否则清空状态
                if (activeShape.isSelected) {
                    activeShape.measurement = true;

                    if (activeShape.activeMove !== ActiveMove.None) {
                        if ($.support.touch) {
                            $(shapeContainer).bind("mousemove", mouseMove);
                        } else {
                            $(shapeContainer).bind("mousemove", mouseMove);
                        }

                        canMove = true;
                        startPoint = point.times(1);
                    } else {
                        if (!self.isSelectedEnable && self.isShowInfo) {
                            activeShape.isSelected = false;
                        }
                    }
                } else {
                    clearActiveShape();
                    self.showAnnotations();
                }
            }

            return isSelected;
        }

        function resetSelected(shape) {
            if (shapeAry != null) {
                var isReset = false;

                for (var i = 0; i < shapeAry.length; i++) {
                    if (shapeAry[i].isSelected || shapeAry[i].measurement) {
                        shapeAry[i].isSelected = false;
                        shapeAry[i].measurement = false;
                        isReset = true;
                    }
                }

                if (shape != null) {
                    shape.isSelected = true;
                }

                return isReset;
            }

            return false;
        }

        function shapeChange() {
            self.isShapeChanged = true;

            if (self.onShapeChanged) {
                self.onShapeChanged();
            }
        }

        function resetStatus() {
            shapeContainer.style.cursor = "";
            $(shapeContainer).unbind("mousemove").unbind("touchmove");
            activeShape.activeMove = ActiveMove.None;
            drawAnnotationType = null;
            isDrawing = false;
            canMove = false;
        }

        function endDraw(point) {
            activeShape.cavScale = zoomScale;
            activeShape.cavOffset = imageTL.times(1);
            activeShape.isEndDrawing = true;
            activeShape.measurement = true;
            activeShape.drawEnd(point);

            resetStatus();
            self.showAnnotations();

            if (self.onShapeDrawEnd) {
                self.onShapeDrawEnd();
            }
        }

        // Viewer event handling

        function animationStart() {
            isAnimationStart = true;
        }

        function animation() {
            resetParameters();

            // 刷新当前选择的标注,用于清空显示的测量信息
            if (activeShape != null && activeShape.imageIndex !== slideIndex) {
                activeShape.measurement = false;
                activeShape.refresh(zoomScale, imageTL);
                activeShape.draw();
            } else if (activeShape != null && activeShape.imageIndex === slideIndex) {
                activeShape.measurement = true;
                activeShape.refresh(zoomScale, imageTL);
                activeShape.draw();
            }

            self.showAnnotations();
        }

        function animationFinish() {
            isAnimationStart = false;
        }

        // Annotation Related

        function setAnnotations(antAry) {
            annotations = antAry.slice(0);
        }

        // 转换为point对象数组
        function cvtPoints(points) {
            var pts = [];

            if (!points || points.length <= 0) {
                return pts;
            }

            for (var i = 0; i < points.length; i++) {
                pts.push(new Point(points[i].x, points[i].y));
            }

            return pts;
        }

        // point对象数组转换为json数组
        function aCvtPoints(points) {
            var pts = [];

            if (!points || points.length <= 0) {
                return pts;
            }

            for (var i = 0; i < points.length; i++) {
                pts.push({x: points[i].x, y: points[i].y});
            }

            return pts;
        }

        function convertToAntInfo(antInfo, ant) {
            antInfo.id = ant.id;
            antInfo.imageId = ant.imageId; // 图像 id
            antInfo.guid = (ant.guid == null ? Utils.guidGenerator() : ant.guid); // 当前标注 guid
            antInfo.name = ant.name; // 当前标注名称
            antInfo.description = ant.description; // 当前标注的相关描述

            antInfo.imageIndex = ant.imageIndex; // 当前标注对应图像序列索引(第几张)
            antInfo.scale = ant.scale; // 当前标注所在的放大倍数比例

            antInfo.width = ant.width; // 标注线宽
            antInfo.type = ant.type; // 当前标注类型
            antInfo.region = {
                x: ant.startPoint.x,
                y: ant.startPoint.y,
                width: ant.endPoint.x - ant.startPoint.x,
                height: ant.endPoint.y - ant.startPoint.y
            }; // 标注所在的矩形区域(赋值必须为Rect类型)

            antInfo.fontUnderLine = ant.fontUnderLine;
            antInfo.fontSize = ant.fontSize;
            antInfo.fontFamily = ant.fontFamily;
            antInfo.fontItalic = ant.fontItalic;
            antInfo.fontBold = ant.fontBold;
            antInfo.visible = ant.visible;
            antInfo.color = ant.color;

            antInfo.measurement = ant.measurement;

            antInfo.radius = ant.radius;
            antInfo.arcLength = ant.arcLength;
            antInfo.angle = ant.angle;
            antInfo.points = aCvtPoints(ant.points);

            return antInfo;
        }

        // Public methods

        //

        // Mouse Event trigger Annotations function

        this.onShapeChanged = null;

        this.onShapeDrawEnd = null;

        // Initialize Shape

        // 创建绘制环境
        this.createShapeCanvas = function () {
            if (!Support.canvas) {
                return false;
            }

            shapeCanvas = document.createElement("canvas");
            shapeCanvas.style.position = "absolute";

            drawCanvas = document.createElement("canvas");
            drawCanvas.style.position = "absolute";

            measureCanvas = document.createElement("canvas");
            measureCanvas.style.position = "absolute";

            self.Canvas = shapeCanvas;
            self.DrawCanvas = drawCanvas;
            self.Measurement = new Measurement();

            shapeContainer = document.createElement("div");
            shapeContainer.style.position = "absolute";

            shapeContainer.appendChild(shapeCanvas);
            shapeContainer.appendChild(drawCanvas);
            shapeContainer.appendChild(measureCanvas);

            viewer.drawer.elmt.appendChild(shapeContainer);

            // 初始化容器
            resetCanvasSize();
            clearActiveShape();

            // 添加shapeContainer鼠标触摸事件
            var $container = $(shapeContainer);

            if ($.support.touch) {

                //$container.unbind("touchstart", touchStart);
                //$container.unbind("touchend", touchEnd);
                //$container.unbind("taphold", touchHoldOrDblClk);
                //
                //$container.bind("touchstart", touchStart);
                //$container.bind("touchend", touchEnd);
                //$container.bind("taphold", touchHoldOrDblClk);

                $container.unbind("mousedown", mouseDown);
                $container.unbind("mouseup", mouseUp);
                $container.unbind("dblclick", touchHoldOrDblClk);

                $container.bind("mousedown", mouseDown);
                $container.bind("mouseup", mouseUp);
                $container.bind("dblclick", touchHoldOrDblClk);
            } else {

                $container.unbind("mousedown", mouseDown);
                $container.unbind("mouseup", mouseUp);
                $container.unbind("dblclick", touchHoldOrDblClk);

                $container.bind("mousedown", mouseDown);
                $container.bind("mouseup", mouseUp);
                $container.bind("dblclick", touchHoldOrDblClk);
            }

            // 添加viewer事件响应

            viewer.removeEventListener("animationstart", animationStart);
            viewer.removeEventListener("animation", animation);
            viewer.removeEventListener("animationfinish", animationFinish);
            viewer.removeEventListener("resize", resetCanvasSize);

            viewer.addEventListener("animationstart", animationStart);
            viewer.addEventListener("animation", animation);
            viewer.addEventListener("animationfinish", animationFinish);
            viewer.addEventListener("resize", resetCanvasSize);

            return true;
        };

        this.delShapeCanvas = function () {};

        // 设置打开的图像序列
        this.setOpenSlide = function (slide) {
            currentSlide = slide;

            if (viewer.viewport) {
                var size = viewer.viewport.getContainerSize();

                //grid = new Grid(measureCanvas, currentSlide.calibration,
                //    currentSlide.width, currentSlide.height, size.x, size.y);
                //ruler = new Ruler(measureCanvas, currentSlide.calibration,
                //    size.x, size.y);

                resetParameters();
            }
        };

        // Annotations

        // 设置要绘制图形的类型
        this.setDrawType = function (type) {
            drawAnnotationType = type;
        };

        //显示标尺
        this.showRuler = function () {
            var size = viewer.viewport.getContainerSize();
            c_ruler = new Scale(measureCanvas, currentSlide.calibration,
                size.x, size.y);
            return c_ruler;
        };

        this.showAnnotations = function (isErase) {
            if (c_ruler !== null) {
                c_ruler.showScale(zoomScale, imageTL);
            }
            if (shapeCanvas != null && shapeAry != null) {
                if (isErase == null) {
                    isErase = false;
                }

                self.clearShapeCanvas();

                if (!isAnimationStart && !isErase && (isDrawing || canMove)) {
                    activeShape.refresh(zoomScale, imageTL);
                    activeShape.draw();
                } else {
                    if (Config.enableAnnotation) {

                        for (var i = 0; i < shapeAry.length; i++) {
                            if (shapeAry[i].type === AnnotationType.Linetext){
                                shapeAry[i].draw();
                            }
                        }
                        self.clearShapeCanvas();
                        for (var i = 0; i < shapeAry.length; i++) {
                            if (shapeAry[i].imageIndex === slideIndex) {
                                shapeAry[i].refresh(zoomScale, imageTL);
                                shapeAry[i].draw();
                            }

                            // 如果remark类型的标注需要调用自己的draw清空自己
                            if (shapeAry[i].type === AnnotationType.Position ||
                                shapeAry[i].type === AnnotationType.Remark ) {
                                shapeAry[i].draw();
                            }
                        }
                    }

                    if (Config.showGrid()) {
                        grid.draw(zoomScale, imageTL);
                    }

                    if (Config.showRulers()) {
                        ruler.draw(zoomScale, imageTL);

                    }
                }
            }
        };

        // 载入标注(或者初始化标注图形)
        this.loadAnnotations = function (annotations) {
            if (annotations != null && annotations.length > 0) {
                setAnnotations(annotations);
                self.clearShapeAry();

                for (var i = 0; i < annotations.length; i++) {
                    var ant = annotations[i];
                    ant.region = new Rect(ant.region.x, ant.region.y, ant.region.width, ant.region.height);
                    ant.points = cvtPoints(ant.points);
                    ant.color = typeof ant.color === "string" ?
                        ant.color : Utils.numberToHex(ant.color);

                    var shape = null,
                        startP = ant.region.getTopLeft(), endP = ant.region.getBottomRight();

                    switch (ant.type) {
                        case AnnotationType.Line:
                            shape = new Line(self, startP, endP);
                            break;
                        case AnnotationType.Arrow:
                            shape = new Arrow(self, startP, endP);
                            break;
                        case AnnotationType.Rectangle:
                            shape = new Rectangle(self, startP, endP);
                            break;
                        case AnnotationType.Ellipse:
                            shape = new Ellipse(self, startP, endP);
                            break;
                        case AnnotationType.Remark:
                            shape = new Remark(self, startP, endP);
                            break;
                        case AnnotationType.Position:
                            shape = new Position(self, startP, endP);
                            break;
                        case AnnotationType.Angle:
                            shape = new Angle(self, startP, endP);
                            break;
                        case AnnotationType.Polygon:
                            shape = new Polygon(self, startP, endP);
                            break;
                        case AnnotationType.Brace:
                            shape = new Brace(self, startP, endP);
                            break;
                        case AnnotationType.Polyline:
                            shape = new Polyline(self, startP, endP);
                            break;
                        case AnnotationType.Linetext:
                            shape = new Linetext(self, startP, endP);
                            break;
                        default :
                            shape = null;
                            break;
                    }

                    if (shape != null) {
                        shape.id = ant.id;
                        shape.guid = ant.guid;

                        shape.imageId = ant.imageId;
                        shape.name = ant.name;
                        shape.description = ant.description;

                        shape.imageIndex = ant.imageIndex;
                        shape.scale = ant.scale;
                        shape.width = ant.width;
                        shape.type = ant.type;
                        shape.region = ant.region;

                        shape.fontUnderLine = ant.fontUnderLine;
                        shape.fontSize = ant.fontSize;
                        shape.fontFamily = ant.fontFamily;
                        shape.fontItalic = ant.fontItalic;
                        shape.fontBold = ant.fontBold;
                        shape.visible = ant.visible;
                        shape.color = ant.color;

                        shape.measurement = false;

                        shape.radius = ant.radius;
                        shape.arcLength = ant.arcLength;
                        shape.angle = ant.angle;

                        shape.points = ant.points;
                        shape.calibration = currentSlide.calibration;
                        shape.isEndDrawing = true;

                        shapeAry.push(shape);
                    }
                }

                self.showAnnotations();
            }
        };

        // 从annotations中重新载入标注
        this.reloadAnnotations = function () {
            self.loadAnnotations(annotations);
            self.showAnnotations();
            self.isShapeChanged = false;
        };

        // 通过回调回去标注数组并且存入 SlideInfo 中
        this.getAnnotations = function (callback) {
            if (callback && typeof callback === "function") {
                var annos = [];

                for (var i = 0; i < shapeAry.length; i++) {
                    annos.push(convertToAntInfo(new AnnotationInfo(), shapeAry[i]));
                }

                currentSlide.annotations = annos;
                callback(annos);

                return annos;
            }

            return [];
        };

        // 设置是否可以选择元素或者可编辑
        this.setSelectedEnable = function (enable) {
            drawAnnotationType = null;
            self.isSelectedEnable = enable;

            var changed = false;

            // 取消可编辑选择状态,则把处于选择状态的元素回复不能编辑状态
            if (!enable) {
                for (var i = 0; i < shapeAry.length; i++) {
                    if (shapeAry[i].isSelected || shapeAry[i].measurement) {
                        shapeAry[i].isSelected = shapeAry[i].measurement = false;
                        changed = true;
                    }
                }

                if (changed) {
                    self.showAnnotations();
                }
            }
        };

        // 设置是否可以显示测量信息
        this.setShowInfoEnable = function (enable) {
            self.isShowInfo = enable;

            // 设置为不显示时,把正在显示的测量信息隐藏掉
            if (!enable) {
                for (var i = 0; i < shapeAry.length; i++) {
                    if (shapeAry[i].measurement) {
                        shapeAry[i].measurement = false;
                        $(shapeAry[i].txtElmt).hide();
                    }
                }
            }
        };

        // 显示测量信息
        this.showMeasurement = function (isShow) {
            var count = 0;

            for (var index = 0; index < shapeAry.length; index++) {
                if (shapeAry[index].type !== AnnotationType.Remark &&
                    shapeAry[index].type !== AnnotationType.Position) {
                    shapeAry[index].measurement = isShow;
                    shapeAry[index].showMeasurement();
                    count++;
                }
            }

            if (count > 0) {
                shapeChange();
            }
        };

        // 获取当前激活的图形
        this.getActiveShape = function () {
            return typeof activeShape === "undefined" ||
            activeShape === null ? null : activeShape;
        };

        // 设置当前激活图形
        this.setActiveShape = function (shape) {
            shape.isSelected = true;
            activeShape = shape;
        };

        // 删除选中的标注
        this.deleteAnnotation = function (callback) {
            if (!self.isSelectedEnable || self.getActiveShape() === null) {
                return;
            }

            var position = null, shape = null;

            for (var i = 0; i < shapeAry.length; i++) {
                if (activeShape === shapeAry[i] || shapeAry[i].isSelected) {
                    position = i;
                    shape = shapeAry[i];
                    break;
                }
            }

            if (position != null) {
                shapeAry.splice(position, 1);
                self.showAnnotations();

                $(shape.txtElmt).remove();
                $(shape.inpElmt).remove();

                clearActiveShape();
                shapeChange();

                // 回调
                if (callback && typeof  callback === "function") {
                    callback(shape);
                }
            }
        };

        // 触发图形改变
        this.dirtyCanvas = function () {
            shapeChange();
        };

        // 清空标注数组
        this.clearShapeAry = function () {
            // 移除所有标注标签
            for (var i = 0; i < shapeAry.length; i++) {
                $(shapeAry[i].txtElmt).remove();
                $(shapeAry[i].inpElmt).remove();
            }

            shapeAry = [];
            self.clearShapeCanvas(true);
        };

        // 定位图像
        this.linkTo = function (arguments) {
            if (!viewer.isOpen()) {
                return;
            }

            var args = arguments;

                viewer.viewport.slideTo(args[0]);

            var containnerSize = viewer.viewport.getContainerSize();
               var  zoom = (args[2] / currentSlide.scanObjective * currentSlide.width) / containnerSize.x;
            viewer.viewport.panTo(new SlidePoint(args[1].x,args[1].y));
                viewer.viewport.zoomTo(zoom);

            //if (1 === args.length) {
            //    for (var i = 0; i < shapeAry.length; i++) {
            //        var shape = null;
            //
            //        // id and guid
            //        if (typeof args[0] === "number" &&
            //            shapeAry[i].id != null && shapeAry[i].id === args[0]) {
            //            shape = shapeAry[i];
            //        } else if (typeof args[0] === "string" &&
            //            shapeAry[i].guid != null && shapeAry[i].guid === args[0]) {
            //            shape = shapeAry[i];
            //        }
            //
            //        if (shape !== null) {
            //            if (slideIndex === shape.imageIndex) {
            //                var size = viewer.viewport.getContainerSize(),
            //                    zoom = currentSlide.width * shape.scale / size.x,
            //                    offset = shape.toImagePoint(shape.movePoint).divide(currentSlide.width);
            //                viewer.viewport.panTo(offset);
            //                viewer.viewport.zoomTo(zoom);
            //            } else {
            //                viewer.viewport.slideTo(shape.imageIndex);
            //                viewer.addEventListener("animationfinish", To);
            //                viewer.shape = shape;
            //
            //                function To() {
            //                    var shape = viewer.shape;
            //                    viewer.removeEventListener("animationfinish", To);
            //
            //                    var size = viewer.viewport.getContainerSize(),
            //                        zoom = currentSlide.width * shape.scale / size.x,
            //                        offset = shape.toImagePoint(shape.movePoint).divide(currentSlide.width);
            //                    viewer.viewport.panTo(offset);
            //                    viewer.viewport.zoomTo(zoom);
            //                }
            //            }
            //        }
            //    }
            //    // index offset scale
            //} else if (3 === args.length) {
            //    var index = typeof args[0] === "undefined" ? null : args[0],
            //
            //        offset = typeof args[1] === "undefined" ? null : args[1],
            //        scale = typeof args[2] === "undefined" ? null : args[2];
            //
            //    if (index !== null) {
            //        viewer.viewport.slideTo(index);
            //    }
            //
            //    if (offset) {
            //        //var offset = viewer.viewport.deltaPointsFromPixels(offset);
            //        viewer.viewport.panTo(offset);
            //    }
            //
            //    if (scale) {
            //        viewer.viewport.zoomTo(scale);
            //    }
            //}
        };

        // Canvas

        // 结束当前正在绘制的图形
        this.finishDrawing = function () {
            endDraw();
        };

        // 获取当前绘制容器
        this.getContainer = function () {
            return shapeContainer;
        };

        // 清空画板
        this.clearShapeCanvas = function (isErase) {
            if (isErase == null) {
                isErase = false;
            }

            if (isErase) {
                clearRect(drawCanvas);
                clearRect(shapeCanvas);
                clearRect(measureCanvas);

                if (!Config.enableAnnotation) {
                    for (var i = 0; i < shapeAry.length; i++) {
                        $(shapeAry[i].txtElmt).hide();
                        $(shapeAry[i].inpElmt).hide();
                    }
                }
            } else {
                if (!isAnimationStart && activeShape != null && (isDrawing || canMove)) {
                    clearRect(drawCanvas);
                } else {
                    clearRect(shapeCanvas);

                    if (activeShape != null) {
                        clearRect(drawCanvas);
                    }

                    if (Config.showGrid() || Config.showRulers()) {
                        clearRect(measureCanvas);
                    }
                }
            }
        };

        // for remark and position hide
        this.getCurrentIndex = function () {
            return slideIndex;
        };
    };
})();
/**
 * Pathology - 1.0.0
 * @email v
 * @author 
 */

var Line = SL.Line;

(function () {
    Line = SL.Line = function (shapeViewer, startPt, endPt) {
        Shape.apply(this, [shapeViewer, startPt, endPt]);

        // Fields
        var self = this;

        // Public methods

        // 绘制直线
        this.draw = function () {
            var context = self.getContext();
            context.beginPath();

            self.rsPoint = self.resetPoint(self.startPoint, self.cavScale, self.cavOffset);
            self.rePoint = self.resetPoint(self.endPoint, self.cavScale, self.cavOffset);
            self.shapeMovePosition();
            self.movePoint = self.rsPoint.plus(self.rePoint).divide(2);
            context.moveTo(self.rsPoint.x, self.rsPoint.y);
            context.lineTo(self.rePoint.x, self.rePoint.y);
            context.lineWidth = self.width;
            context.strokeStyle = self.color;
            context.stroke();

            self.active();
            self.showMeasurement();

        };

        // 重绘(在绘制过程中点改变时进行重绘)
        this.shapeMovePosition = function () {
            if (self.activeMove !== ActiveMove.None) {
                switch (self.activeMove) {
                    case ActiveMove.StartMove:
                        self.resetActiveMovePoint(self.rsPoint, self.startPoint);
                        break;
                    case ActiveMove.EndMove:
                        self.resetActiveMovePoint(self.rePoint, self.endPoint);
                        break;
                    case ActiveMove.ShapeMove:
                        self.resetActiveMovePoint(self.rsPoint, self.startPoint);
                        self.resetActiveMovePoint(self.rePoint, self.endPoint);
                        break;
                    default :
                        break;
                }

                if (self.activeMove !== ActiveMove.ShapeMove) {
                    self.isMeasurementChanged = true;
                }
            }
        };

        // 计算测量信息
        this.calcMeasurementInfo = function () {
            var radius = Utils.calcRadius(self.startPoint, self.endPoint);
            return Utils.appendLine(shapeViewer.Measurement.Length,
                Utils.floatRound(radius * self.calibration) + shapeViewer.Measurement.Unit);
        };

        // 激活编辑状态绘制编辑点
        this.active = function () {
            if ((this.isEndDrawing || !this.isDrawStart) && this.isSelected) {
                self.drawThumb(self.rsPoint);
                self.drawThumb(self.rePoint);
                self.drawMoveThumb(self.movePoint);
            }
        };

        // 判断是否点击当前图形
        this.isHitMe = function (point) {
            if (self.isSelected) {
                var resultAry = [];
                self.addClickResult(resultAry, point, self.rePoint, ActiveMove.EndMove);
                self.addClickResult(resultAry, point, self.rsPoint, ActiveMove.StartMove);
                self.addClickResult(resultAry, point, self.movePoint, ActiveMove.ShapeMove);
                self.setNearestMove(resultAry);
            }

            if (self.activeMove !== ActiveMove.None) {
                return true;
            }

            return false;
        };

        // 判断是否点击到当前图形区域内
        this.isHitMyArea = function (point) {
            if (self.activeMove === ActiveMove.None) {
                var isSelected = Utils.clickOnLine(self.rsPoint, self.rePoint,
                    point, self.width);
                self.isSelected = isSelected;
                self.cavRect = new Rect(self.rsPoint.x, self.rsPoint.y, 0, 0);

                return isSelected;
            }

            return true;
        };
    };
})();
/**
 * Pathology - 1.0.0
 * @email v
 * @author 
 */

/**
 * Created by MQ on 2016/10/20.
 */
var Linetext = SL.Linetext;

(function () {
    Linetext = SL.Linetext = function (shapeViewer, startPt, endPt) {
        Shape.apply(this, [shapeViewer, startPt, endPt]);

        // Fields
        var self = this;

        // Private methods

        function setPos(){
            var pos;
            var angle = Utils.radian(self.rsPoint ,self.rePoint) /(2* Math.PI) *360;
            var textwidth = $(self.txtElmt).width()  + 14 ;
            var textheight = $(self.txtElmt).height()  + 14;

            if(angle <= 45 && angle > -45){
                pos = new Point(self.rePoint.x - textwidth,self.rePoint.y-0.5*textheight);
            }else if(angle <= 135 && angle > 45){
                pos = new Point(self.rePoint.x - 0.5*textwidth,self.rePoint.y - textheight);
            }else if(angle <= -45 && angle > -135){
                pos = new Point(self.rePoint.x- 0.5*textwidth,self.rePoint.y + 7);
            }else{
                pos = new Point(self.rePoint.x + 7,self.rePoint.y-0.5*textheight);
            }
            self.setCSS(pos.x,pos.y);
        }

        function selectElmt(isSelected, elmt) {
            if (isSelected) {
                Utils.replaceSizeSame(elmt.inpElmt, elmt.txtElmt);
                $(elmt.txtElmt).hide();
                $(elmt.inpElmt).show();
                $(elmt.inpElmt).select();
                elmt.isSelected = true;
                //elmt.active();
            } else {
                $(elmt.txtElmt).show();
                var val = $(elmt.inpElmt).val();

                if (elmt.description !== val) {
                    shapeViewer.dirtyCanvas();
                }

                $(elmt.txtElmt).html(Utils.replaceHtmlEnter(val));
                $(elmt.inpElmt).hide();
                elmt.description = val;
            }

            if (self.imageIndex !== shapeViewer.getCurrentIndex()) {
                $(elmt.txtElmt).hide();
                $(elmt.inpElmt).hide();
            }
        }

        // Public methods

        // 绘制直线
        this.draw = function () {
            var context = self.getContext();
            context.beginPath();

            self.rsPoint = self.resetPoint(self.startPoint, self.cavScale, self.cavOffset);
            self.rePoint = self.resetPoint(self.endPoint, self.cavScale, self.cavOffset);
            self.shapeMovePosition();
            self.movePoint = self.rsPoint.plus(self.rePoint).divide(2);
            context.moveTo(self.rsPoint.x, self.rsPoint.y);
            context.lineTo(self.rePoint.x, self.rePoint.y);
            context.lineWidth = self.width;
            context.strokeStyle = self.color;
            context.stroke();

            setPos();

            self.active();
            //self.showMeasurement();
        };

        //this.drawEnd = function () {
        //    showElmt("inp");
        //};


        // 重绘(在绘制过程中点改变时进行重绘)
        this.shapeMovePosition = function () {
            if (self.activeMove !== ActiveMove.None) {
                switch (self.activeMove) {
                    case ActiveMove.StartMove:
                        self.resetActiveMovePoint(self.rsPoint, self.startPoint);
                        break;
                    case ActiveMove.EndMove:
                        self.resetActiveMovePoint(self.rePoint, self.endPoint);
                        break;
                    case ActiveMove.ShapeMove:
                        self.resetActiveMovePoint(self.rsPoint, self.startPoint);
                        self.resetActiveMovePoint(self.rePoint, self.endPoint);
                        break;
                    default :
                        break;
                }

                if (self.activeMove !== ActiveMove.ShapeMove) {
                    self.isMeasurementChanged = true;
                }
            }
        };

        // 计算测量信息
        this.calcMeasurementInfo = function () {
            var radius = Utils.calcRadius(self.startPoint, self.endPoint);
            return Utils.appendLine(shapeViewer.Measurement.Length,
                Utils.floatRound(radius * self.calibration) + shapeViewer.Measurement.Unit);
        };

        // 激活编辑状态绘制编辑点
        this.active = function () {
            if ((this.isEndDrawing || !this.isDrawStart) && this.isSelected) {
                self.drawThumb(self.rsPoint);
                self.drawThumb(self.rePoint);
                self.drawMoveThumb(self.movePoint);

            }
        };

        // 判断是否点击当前图形
        this.isHitMe = function (point) {
            if (self.isSelected) {
                var resultAry = [];
                self.addClickResult(resultAry, point, self.rePoint, ActiveMove.EndMove);
                self.addClickResult(resultAry, point, self.rsPoint, ActiveMove.StartMove);
                self.addClickResult(resultAry, point, self.movePoint, ActiveMove.ShapeMove);
                self.setNearestMove(resultAry);

            }

            if (self.activeMove !== ActiveMove.None) {
                return true;
            }

            return false;
        };

        // 判断是否点击到当前图形区域内
        this.isHitMyArea = function (point) {
            if (self.activeMove === ActiveMove.None) {
                var isSelected = Utils.clickOnLine(self.rsPoint, self.rePoint,
                    point, self.width);
                var isSelectedText = self.isHitMe(point);
                self.isSelected = isSelected||isSelectedText;

                self.cavRect = new Rect(self.rsPoint.x, self.rsPoint.y, 0, 0);

                setPos();

                return isSelected;
            }

            return true;
        };

        this.createElmt = function () {
            var $elmt = null;

            if (self.txtElmt === null) {
                self.txtElmt = document.createElement("label");
                self.container.appendChild(self.txtElmt);
                $elmt = $(self.txtElmt);
                $elmt.bind("mousedown", {owner: self}, function (evt) {
                    if (!shapeViewer.isSelectedEnable) {
                        return true;
                    }

                    var self = evt.data.owner;
                    shapeViewer.setActiveShape(self);

                    if (self.type === AnnotationType.Position) {
                        self.isSelected = true;
                        shapeViewer.showAnnotations();
                    } else {
                        selectElmt(true, self);
                    }

                    evt.stopPropagation();
                    return false;
                });
                $elmt.hide();
            }

            if (self.inpElmt === null) {
                self.inpElmt = document.createElement("textarea");
                self.container.appendChild(self.inpElmt);
                $(self.inpElmt).mousedown(function (evt) {
                    evt.stopPropagation();
                }).hide();
            }
        };

        this.setCSS = function (left, top) {
            Utils.registerTxtCSS({
                elmt: self.txtElmt,
                left: left,
                top: top,
                fontSize: self.fontSize,
                fontFamily: self.fontFamily,
                color: self.color,
                fontBold: self.fontBold,
                fontItalic: self.fontItalic,
                fontUnderline: self.fontUnderLine,
                bkColor: true,
                bkOpacity: true,
                description: self.description
            });
            Utils.registerTxtCSS({
                elmt: self.inpElmt,
                left: left,
                top: top,
                fontSize: self.fontSize,
                fontFamily: self.fontFamily,
                color: self.color,
                fontBold: self.fontBold,
                fontItalic: self.fontItalic,
                fontUnderline: self.fontUnderLine,
                bkColor: true,
                bkOpacity: false,
                description: self.description
            });
            selectElmt(self.isSelected, self);
        };

        // Constructor (放在最后,保证createElmt覆盖掉基类)
        if (shapeViewer.getContainer() !== null) {
            self.createElmt();
        }
    };
})();
/**
 * Pathology - 1.0.0
 * @email v
 * @author 
 */

var Rectangle = SL.Rectangle;

(function () {
    Rectangle = SL.Rectangle = function (shapeViewer, startPt, endPt) {
        Shape.apply(this, [shapeViewer, startPt, endPt]);

        // Fields
        var self = this;

        // Properties
        this.leftTopPoint = null;
        this.leftBottomPoint = null;
        this.rightTopPoint = null;
        this.rightBottomPoint = null;
        this.topMiddlePoint = null;
        this.bottomMiddlePoint = null;
        this.leftMiddlePoint = null;
        this.rightMiddlePoint = null;

        // Public methods

        // 绘制矩形图形
        this.draw = function () {
            var context = self.getContext();
            context.beginPath();

            self.rsPoint = self.resetPoint(self.startPoint, self.cavScale, self.cavOffset);
            self.rePoint = self.resetPoint(self.endPoint, self.cavScale, self.cavOffset);
            self.shapeMovePosition();

            var rectX = 0, rectY = 0,
                rectW = Math.abs(self.rePoint.x - self.rsPoint.x),
                rectH = Math.abs(self.rePoint.y - self.rsPoint.y);

            if (self.rePoint.x > self.rsPoint.x && self.rePoint.y > self.rsPoint.y) {
                rectX = self.rsPoint.x;
                rectY = self.rsPoint.y;
            } else if (self.rePoint.x > self.rsPoint.x && self.rePoint.y < self.rsPoint.y) {
                rectX = self.rsPoint.x;
                rectY = self.rePoint.y;
            } else if (self.rePoint.x < self.rsPoint.x && self.rePoint.y > self.rsPoint.y) {
                rectX = self.rePoint.x;
                rectY = self.rsPoint.y;
            } else if (self.rePoint.x < self.rsPoint.x && self.rePoint.y < self.rsPoint.y) {
                rectX = self.rePoint.x;
                rectY = self.rePoint.y;
            }

            self.leftTopPoint = new Point(self.rsPoint.x, self.rsPoint.y);
            self.leftBottomPoint = new Point(self.rsPoint.x, self.rePoint.y);
            self.rightTopPoint = new Point(self.rePoint.x, self.rsPoint.y);
            self.rightBottomPoint = new Point(self.rePoint.x, self.rePoint.y);
            self.topMiddlePoint = new Point(rectX + rectW / 2, self.rsPoint.y);
            self.bottomMiddlePoint = new Point(rectX + rectW / 2, self.rePoint.y);
            self.leftMiddlePoint = new Point(self.rsPoint.x, rectY + rectH / 2);
            self.rightMiddlePoint = new Point(self.rePoint.x, rectY + rectH / 2);
            self.movePoint = self.rsPoint.plus(self.rePoint).divide(2);

            context.strokeStyle = self.color;
            context.lineWidth = self.width;
            context.strokeRect(rectX, rectY, rectW, rectH);
            context.stroke();

            self.active();
            //self.showMeasurement();
        };

        // 计算矩形测量信息
        this.calcMeasurementInfo = function () {
            var width = Math.abs(self.startPoint.x - self.endPoint.x),
                height = Math.abs(self.startPoint.y - self.endPoint.y),
                measureInfo = "";

            measureInfo = Utils.appendLine(measureInfo, shapeViewer.Measurement.Width +
                Utils.floatRound(width * self.calibration) + shapeViewer.Measurement.Unit);
            measureInfo = Utils.appendLine(measureInfo, shapeViewer.Measurement.Height +
                Utils.floatRound(height * self.calibration) + shapeViewer.Measurement.Unit);
            measureInfo = Utils.appendLine(measureInfo, shapeViewer.Measurement.Area +
                Utils.floatRound(width * self.calibration * height * self.calibration) +
                shapeViewer.Measurement.AreaUnit);
            measureInfo = Utils.appendLine(measureInfo,
                shapeViewer.Measurement.Perimeter +
                Utils.floatRound(2 * (width + height) * self.calibration) +
                shapeViewer.Measurement.Unit);

            return measureInfo;
        };

        // 激活为编辑状态, 绘制各个编辑点
        this.active = function () {
            if ((self.isEndDrawing || !self.isDrawStart) && self.isSelected) {
                self.drawThumb(self.leftTopPoint);
                self.drawThumb(self.leftBottomPoint);
                self.drawThumb(self.rightTopPoint);
                self.drawThumb(self.rightBottomPoint);
                self.drawThumb(self.topMiddlePoint);
                self.drawThumb(self.bottomMiddlePoint);
                self.drawThumb(self.leftMiddlePoint);
                self.drawThumb(self.rightMiddlePoint);
                self.drawMoveThumb(self.movePoint);
            }
        };

        // 编辑状态下改变各个编辑点的位置
        this.shapeMovePosition = function () {
            if (self.activeMove !== null &&
                self.activeMove !== ActiveMove.None && self.moveOffset !== null) {
                var point = new Point(0, 0);

                switch (self.activeMove) {
                    case ActiveMove.LeftTopMove:
                        self.resetActiveMovePoint(self.rsPoint, self.startPoint);
                        break;
                    case ActiveMove.RightTopMove:
                        point = new Point(0, self.moveOffset.y);
                        self.resetActiveMovePoint(self.rsPoint, self.startPoint, point);
                        point = new Point(self.moveOffset.x, 0);
                        self.resetActiveMovePoint(self.rePoint, self.endPoint, point);
                        break;
                    case ActiveMove.LeftBottomMove:
                        point = new Point(self.moveOffset.x, 0);
                        self.resetActiveMovePoint(self.rsPoint, self.startPoint, point);
                        point = new Point(0, self.moveOffset.y);
                        self.resetActiveMovePoint(self.rePoint, self.endPoint, point);
                        break;
                    case ActiveMove.RightBottomMove:
                        self.resetActiveMovePoint(self.rePoint, self.endPoint);
                        break;
                    case ActiveMove.TopMiddleMove:
                        point = new Point(0, self.moveOffset.y);
                        self.resetActiveMovePoint(self.rsPoint, self.startPoint, point);
                        break;
                    case ActiveMove.BottomMiddleMove:
                        point = new Point(0, self.moveOffset.y);
                        self.resetActiveMovePoint(self.rePoint, self.endPoint, point);
                        break;
                    case ActiveMove.LeftMiddleMove:
                        point = new Point(this.moveOffset.x, 0);
                        self.resetActiveMovePoint(self.rsPoint, self.startPoint, point);
                        break;
                    case ActiveMove.RightMiddleMove:
                        point = new Point(self.moveOffset.x, 0);
                        self.resetActiveMovePoint(self.rePoint, self.endPoint, point);
                        break;
                    case ActiveMove.ShapeMove:
                        self.resetActiveMovePoint(self.rsPoint, self.startPoint);
                        self.resetActiveMovePoint(self.rePoint, self.endPoint);
                        break;
                    default :
                        break;
                }

                if (self.activeMove !== ActiveMove.ShapeMove) {
                    self.isMeasurementChanged = true;
                }
            }
        };

        // 获取激活编辑点
        this.getActiveMove = function (point) {
            var resultAry = [];

            self.addClickResult(resultAry, point, self.leftTopPoint, ActiveMove.LeftTopMove);
            self.addClickResult(resultAry, point, self.leftBottomPoint, ActiveMove.LeftBottomMove);
            self.addClickResult(resultAry, point, self.rightTopPoint, ActiveMove.RightTopMove);
            self.addClickResult(resultAry, point, self.rightBottomPoint, ActiveMove.RightBottomMove);
            self.addClickResult(resultAry, point, self.topMiddlePoint, ActiveMove.TopMiddleMove);
            self.addClickResult(resultAry, point, self.bottomMiddlePoint, ActiveMove.BottomMiddleMove);
            self.addClickResult(resultAry, point, self.leftMiddlePoint, ActiveMove.LeftMiddleMove);
            self.addClickResult(resultAry, point, self.rightMiddlePoint, ActiveMove.RightMiddleMove);
            self.addClickResult(resultAry, point, self.movePoint, ActiveMove.ShapeMove);
            self.setNearestMove(resultAry);

            return;
        };

        // 判断是否点击当前图形
        this.isHitMe = function (point) {
            if (self.isSelected) {
                self.getActiveMove(point);

                if (self.activeMove !== ActiveMove.None) {
                    return true;
                }
            }

            return false;
        };
    };
})();
/**
 * Pathology - 1.0.0
 * @email v
 * @author 
 */

var Angle = SL.Angle;

(function () {
    Angle = SL.Angle = function (shapeViewer, startPt, endPt) {
        Shape.apply(this, [shapeViewer, startPt, endPt]);

        // Fields
        var self = this;

        // Properties
        this.cavPoints = [];
        this.pIndex = 0;

        // Public methods

        // 绘制角度图形
        this.draw = function () {
            var context = self.getContext();
            context.beginPath();

            self.shapeMovePosition();
            self.cavPoints = [];

            for (var index = 0; index < self.points.length; index++) {
                var point = self.resetPoint(self.points[index], self.cavScale, self.cavOffset);
                self.cavPoints.push(point);
            }

            if (self.isEndDrawing) {
                var radius = 10,
                    startRadian = Utils.radian(self.cavPoints[0], self.cavPoints[1]),
                    endRadian = Utils.radian(self.cavPoints[2], self.cavPoints[1]);

                context.arc(self.cavPoints[1].x, self.cavPoints[1].y, radius, startRadian, endRadian, false);
                self.movePoint = self.cavPoints[0].plus(self.cavPoints[2]).divide(2);
            }

            var startPt = new Point(), endPt = new Point();

            for (var index = 0; index < self.cavPoints.length; index++) {
                var point = self.cavPoints[index];

                if (index == 0) {
                    context.moveTo(point.x, point.y);
                    startPt = new Point(point.x, point.y);
                    endPt = new Point(point.x, point.y);
                } else {
                    context.lineTo(point.x, point.y);

                    if (startPt.x > point.x) {
                        startPt.x = point.x;
                    }

                    if (startPt.y > point.y) {
                        startPt.y = point.y;
                    }

                    if (endPt.x < point.x) {
                        endPt.x = point.x;
                    }

                    if (endPt.y < point.y) {
                        endPt.y = point.y;
                    }
                }
            }

            self.rsPoint = startPt;
            self.rePoint = endPt;

            context.lineWidth = self.width;
            context.strokeStyle = self.color;
            context.stroke();

            self.active();
            self.showMeasurement();
        };

        // 计算测量信息
        this.calcMeasurementInfo = function () {
            var angle = Utils.angleDegree(this.cavPoints[0], this.cavPoints[1], this.cavPoints[2]);
            return Utils.appendLine(shapeViewer.Measurement.Angle,
                Utils.floatRound(angle) + shapeViewer.Measurement.Deg);
        };

        // 激活为编辑状态, 绘制各个编辑点
        this.active = function () {
            if (self.isSelected) {
                for (var index = 0; index < self.cavPoints.length; index++) {
                    var point = self.cavPoints[index];
                    self.drawThumb(point);
                }

                this.drawMoveThumb(self.movePoint);
            }
        };

        // 编辑状态下改变各个编辑点的位置
        this.shapeMovePosition = function () {
            if (self.activeMove !== null && self.activeMove !== ActiveMove.None) {
                switch (self.activeMove) {
                    case ActiveMove.PointMove:
                        self.resetActiveMovePoint(self.cavPoints[self.pIndex], self.points[self.pIndex]);
                        break;
                    case ActiveMove.ShapeMove:
                        for (var index = 0; index < self.cavPoints.length; index++) {
                            self.resetActiveMovePoint(self.cavPoints[index], self.points[index]);
                        }
                        break;
                    default :
                        break;
                }

                if (self.activeMove != ActiveMove.ShapeMove) {
                    self.isMeasurementChanged = true;
                }
            }
        };

        // 获取激活编辑点
        this.getActiveMove = function (point) {
            var resultAry = [];

            for (var index = 0; index < self.cavPoints.length; index++) {
                self.addClickResult(resultAry, point, self.cavPoints[index], ActiveMove.PointMove, index);
            }

            self.addClickResult(resultAry, point, self.movePoint, ActiveMove.ShapeMove);
            self.setNearestMove(resultAry);
        };

        // 判断是否点击当前图形
        this.isHitMe = function (point) {
            if (self.isSelected) {
                self.getActiveMove(point);
            }

            if (self.activeMove !== ActiveMove.None) {
                return true;
            }

            return false;
        };

        this.drawStart = function (point) {
            self.points.push(point);
        };

        this.drawMove = function (point) {
            if (self.points.length >= 0) {
                self.points[self.points.length - 1] = point;
            }
        };

        this.drawClick = function (point) {
            if (self.points.length == 1) {
                self.drawThumb(self.toCanvasPoint(point));
            }

            if (self.points.length >= 0) {
                self.points[self.points.length - 1] = point;
            }

            if (self.points.length >= 3) {
                self.isEndDrawing = true;
            } else {
                self.points.push(point);
            }
        };

        this.drawEnd = function () {};
    };
})();
/**
 * Pathology - 1.0.0
 * @email v
 * @author 
 */

var Arrow = SL.Arrow;

(function () {
    Arrow = SL.Arrow = function (shapeViewer, startPt, endPt) {
        Line.apply(this, [shapeViewer, startPt, endPt]);

        // Fields
        var self = this;

        // Public methods

        // 绘制箭头图形
        this.draw = function () {
            var context = self.getContext();
            context.beginPath();

            self.rsPoint = self.resetPoint(self.startPoint, self.cavScale, self.cavOffset);
            self.rePoint = self.resetPoint(self.endPoint, self.cavScale, self.cavOffset);
            self.shapeMovePosition();

            self.movePoint = self.rsPoint.plus(self.rePoint).divide(2);

            context.moveTo(self.rsPoint.x, self.rsPoint.y);
            context.lineTo(self.rePoint.x, self.rePoint.y);

            // 绘制箭头
            var pt1, pt2,
                arPt = new Point(self.width * 2, self.width * 3);

            if (self.rsPoint.x === self.rePoint.x) {
                if (self.rsPoint.y < self.rePoint.y) {
                    pt1 = new Point(self.rsPoint.x - arPt.x, self.rsPoint.y + arPt.y);
                    pt2 = new Point(self.rsPoint.x + arPt.x, self.rsPoint.y + arPt.y);
                } else {
                    pt1 = new Point(self.rsPoint.x - arPt.x, self.rsPoint.y - arPt.y);
                    pt2 = new Point(self.rsPoint.x + arPt.x, self.rsPoint.y - arPt.y);
                }
            } else if (self.rsPoint.y === self.rePoint.y) {
                if (self.rsPoint.x < self.rePoint.x) {
                    pt1 = new Point(self.rsPoint.x + arPt.y, self.rsPoint.y - arPt.x);
                    pt2 = new Point(self.rsPoint.x + arPt.y, self.rsPoint.y + arPt.y);
                } else {
                    pt1 = new Point(self.rsPoint.x - arPt.y, self.rsPoint.y - arPt.x);
                    pt2 = new Point(self.rsPoint.x - arPt.y, self.rsPoint.y + arPt.x);
                }
            } else {
                var lineAngle = Math.atan2(self.rsPoint.y - self.rePoint.y, self.rsPoint.x - self.rePoint.x),
                    arPtAngle = Math.atan2(arPt.x, arPt.y),
                    arLen = Math.sqrt(arPt.x * arPt.x + arPt.y * arPt.y);

                pt1 = new Point(self.rsPoint.x - arLen * Math.cos(lineAngle + arPtAngle),
                    self.rsPoint.y - arLen * Math.sin(lineAngle + arPtAngle));
                pt2 = new Point(self.rsPoint.x - arLen * Math.cos(lineAngle - arPtAngle),
                    self.rsPoint.y - arLen * Math.sin(lineAngle - arPtAngle));
            }

            context.moveTo(pt1.x , pt1.y);
            context.lineTo(self.rsPoint.x, self.rsPoint.y);
            context.lineTo(pt2.x, pt2.y);
            context.lineWidth = self.width;
            context.strokeStyle = self.color;
            context.stroke();

            self.active();
            //self.showMeasurement();
        };
    };
})();

/**
 * Pathology - 1.0.0
 * @email v
 * @author 
 */

var Brace = SL.Brace;

(function () {
    Brace = SL.Brace = function (shapeViewer, startPt, endPt) {
        Line.apply(this, [shapeViewer, startPt, endPt]);

        var self = this;

        this.draw = function () {
            var context = self.getContext();
            context.beginPath();

            self.rsPoint = self.resetPoint(self.startPoint, self.cavScale, self.cavOffset);
            self.rePoint = self.resetPoint(self.endPoint, self.cavScale, self.cavOffset);
            self.shapeMovePosition();
            self.movePoint = SlideUtils.calcTwoCenterPoint(self.rsPoint, self.rePoint);

            var slopy, cosy, siny;
            var Par = 10.0;
            slopy = Math.atan2(self.rsPoint.y - self.rePoint.y, self.rsPoint.x - self.rePoint.x);
            cosy = Math.cos(slopy);
            siny = Math.sin(slopy);

            var ptStart = new Point(self.rsPoint.x + Par * cosy + Par * siny, self.rsPoint.y + Par * siny - Par * cosy);
            var ptEnd = new Point(self.rePoint.x + (-Par * cosy + Par * siny), self.rePoint.y + (-Par * cosy - Par * siny));
            var ptMid = new Point((self.rsPoint.x + self.rePoint.x) / 2, (self.rsPoint.y + self.rePoint.y) / 2);
            var ptPreMid = new Point(ptMid.x + (Par * cosy), ptMid.y + (Par * siny));
            var ptPostMid = new Point(ptMid.x - (Par * cosy), ptMid.y - (Par * siny));
            var ptCurve = new Point(ptMid.x - (Par * siny), ptMid.y + (Par * cosy));
            //画大括号

            context.moveTo(ptStart.x, ptStart.y);
            context.lineTo(self.rsPoint.x, self.rsPoint.y);
            context.lineTo(ptPreMid.x, ptPreMid.y);
            context.lineTo(ptCurve.x, ptCurve.y);
            context.lineTo(ptPostMid.x, ptPostMid.y);
            context.lineTo(self.rePoint.x, self.rePoint.y);
            context.lineTo(ptEnd.x, ptEnd.y);

            context.lineWidth = self.width;
            context.strokeStyle = self.color;
            context.stroke();

            self.active();
            //self.showMeasurement();
        };
    };
})();
/**
 * Pathology - 1.0.0
 * @email v
 * @author 
 */

var Ellipse = SL.Ellipse;

(function () {
    Ellipse = SL.Ellipse = function (shapeViewer, startPt, endPt) {
        Rectangle.apply(this, [shapeViewer, startPt, endPt]);

        // Fields
        var self = this;

        // Private methods

        // 绘制图形
        function drawShape(context, x, y, width, height) {
            var radio = 0.5522848,
                centerX = width / 2 * radio,
                centerY = height / 2 * radio,
                rightX = x + width,
                rightY = y + height,
                topCenterX = x + width / 2,
                leftCenterY = y + height / 2;

            context.beginPath();
            context.moveTo(x, leftCenterY);
            context.bezierCurveTo(x, leftCenterY - centerY, topCenterX - centerX, y, topCenterX, y);
            context.bezierCurveTo(topCenterX + centerX, y, rightX, leftCenterY - centerY, rightX, leftCenterY);
            context.bezierCurveTo(rightX, leftCenterY + centerY, topCenterX + centerX, rightY, topCenterX, rightY);
            context.bezierCurveTo(topCenterX - centerX, rightY, x, leftCenterY + centerY, x, leftCenterY);
            context.stroke();
        }

        // Public methods

        // 绘制椭圆
        this.draw = function () {
            var context = self.getContext();

            self.rsPoint = self.resetPoint(self.startPoint, self.cavScale, self.cavOffset);
            self.rePoint = self.resetPoint(self.endPoint, self.cavScale, self.cavOffset);
            self.shapeMovePosition();

            var ellX = 0, ellY = 0,
                ellW = Math.abs(self.rePoint.x - self.rsPoint.x),
                ellH = Math.abs(self.rePoint.y - self.rsPoint.y);

            if (self.rePoint.x > self.rsPoint.x && self.rePoint.y > self.rsPoint.y) {
                ellX = self.rsPoint.x;
                ellY = self.rsPoint.y;
            } else if (self.rePoint.x > self.rsPoint.x && self.rePoint.y < self.rsPoint.y) {
                ellX = self.rsPoint.x;
                ellY = self.rePoint.y;
            } else if (self.rePoint.x < self.rsPoint.x && self.rePoint.y > self.rsPoint.y) {
                ellX = self.rePoint.x;
                ellY = self.rsPoint.y;
            } else if (self.rePoint.x < self.rsPoint.x && self.rePoint.y < self.rsPoint.y) {
                ellX = self.rePoint.x;
                ellY = self.rePoint.y;
            }

            self.leftTopPoint = new Point(self.rsPoint.x, self.rsPoint.y);
            self.leftBottomPoint = new Point(self.rsPoint.x, self.rePoint.y);
            self.rightTopPoint = new Point(self.rePoint.x, self.rsPoint.y);
            self.rightBottomPoint = new Point(self.rePoint.x, self.rePoint.y);
            self.topMiddlePoint = new Point(ellX + ellW / 2, self.rsPoint.y);
            self.bottomMiddlePoint = new Point(ellX + ellW / 2, self.rePoint.y);
            self.leftMiddlePoint = new Point(self.rsPoint.x, ellY + ellH / 2);
            self.rightMiddlePoint = new Point(self.rePoint.x, ellY + ellH / 2);
            self.movePoint = self.rsPoint.plus(self.rePoint).divide(2);

            context.lineWidth = self.width;
            context.strokeStyle = self.color;
            drawShape(context, ellX, ellY, ellW, ellH);

            self.active();
            //self.showMeasurement();
        };

        // 计算测量信息wobuquhuiyi
        this.calcMeasurementInfo = function () {
            var width = Math.abs(self.startPoint.x - self.endPoint.x),
                height = Math.abs(self.startPoint.y - self.endPoint.y),
                relativeW = width / 2 * self.calibration,
                relativeH = height / 2 * self.calibration,
                entropy = Math.abs(relativeW - relativeH) / (relativeW + relativeH);

            var perimeter, area;
            entropy = entropy * entropy;

            if (isNaN(entropy)) {
                perimeter = 0;
            } else {
                perimeter = Math.PI * (relativeW + relativeH) *
                    (135168 - 85760 * entropy - 5568 * entropy * entropy + 3868 * entropy * entropy * entropy) /
                    (135168 - 119552 * entropy + 22208 * entropy * entropy - 345 * entropy * entropy * entropy);
            }

            area = Math.abs(Math.PI * width * this.calibration * height * this.calibration / 4);

            var info = "";
            info = Utils.appendLine(info, shapeViewer.Measurement.Majorhalfaxis +
                Utils.floatRound(Math.max(relativeW, relativeH)) + shapeViewer.Measurement.Unit);
            info = Utils.appendLine(info, shapeViewer.Measurement.Minorhalfaxis +
                Utils.floatRound(Math.min(relativeW, relativeH)) + shapeViewer.Measurement.Unit);
            info = Utils.appendLine(info, shapeViewer.Measurement.Area +
                Utils.floatRound(area) + shapeViewer.Measurement.AreaUnit);
            info = Utils.appendLine(info, shapeViewer.Measurement.Perimeter +
                Utils.floatRound(perimeter) + shapeViewer.Measurement.Unit);

            return info;
        };

        // 判断是否点击当前图形
        this.isHitMe = function (point) {
            if (self.isSelected) {
                self.getActiveMove(point);
            }

            if (self.activeMove !== ActiveMove.None) {
                return true;
            }

            return false;
        };
    };
})();
/**
 * Pathology - 1.0.0
 * @email v
 * @author 
 */

var Polygon = SL.Polygon;

(function () {
    Polygon = SL.Polygon = function (shapeViewer, startPt, endPt) {
        Angle.apply(this, [shapeViewer, startPt, endPt]);

        // Fields
        var self = this;

        // Public methods

        // 绘制图形
        this.draw = function () {
            var context = self.getContext();
            context.beginPath();

            self.shapeMovePosition();
            self.cavPoints = [];

            var startPt = new Point(), endPt = new Point();

            for (var index = 0; index < self.points.length; index++) {
                var point = self.resetPoint(self.points[index], self.cavScale, self.cavOffset);
                self.cavPoints.push(point);

                if (index == 0) {
                    context.moveTo(point.x, point.y);
                    self.rsPoint = point.times(1);
                    startPt = point.times(1);
                    endPt = point.times(1);
                } else {
                    context.lineTo(point.x, point.y);

                    if (startPt.x > point.x) {
                        startPt.x = point.x;
                    }

                    if (startPt.y > point.y) {
                        startPt.y = point.y;
                    }

                    if (endPt.x < point.x) {
                        endPt.x = point.x;
                    }

                    if (endPt.y < point.y) {
                        endPt.y = point.y;
                    }
                }
            }

            if (self.isEndDrawing && self.points.length > 2) {
                context.lineTo(self.rsPoint.x, self.rsPoint.y);

                self.movePoint = startPt.plus(endPt).divide(2);
                self.rsPoint = startPt;
                self.rePoint = endPt;
            }

            context.lineWidth = self.width;
            context.strokeStyle = self.color;
            context.stroke();

            self.active();
            //self.showMeasurement();
        };

        // 计算测量信息
        this.calcMeasurementInfo = function () {
            var str = "";

            var area = Utils.calcArea(self.points) * self.calibration * self.calibration,
                perimeter = Utils.calcLengthClosed(self.points) * self.calibration;

            str = Utils.appendLine(str, shapeViewer.Measurement.Area +
                Utils.floatRound(area) + shapeViewer.Measurement.AreaUnit);
            str = Utils.appendLine(str, shapeViewer.Measurement.Perimeter +
                Utils.floatRound(perimeter) + shapeViewer.Measurement.Unit);

            return str;
        };

        this.drawMove = function (point) {
            if (self.points.length >= 0) {
                self.points[self.points.length - 1] = point;
            }
        };

        this.drawClick = function (point) {
            self.points.push(point);
        };

        this.drawEnd = function () {
            var index = 0;

            for (var i = self.points.length - 1; i > 0; i--) {
                if (Utils.floatRound(self.points[i].x) === Utils.floatRound(self.points[i - 1].x) &&
                    Utils.floatRound(self.points[i].y) === Utils.floatRound(self.points[i - 1].y)) {
                    index = i;
                } else {
                    break;
                }
            }

            if (index != null) {
                self.points.splice(index, self.points.length - index);
            }
        };
    };
})();
/**
 * Pathology - 1.0.0
 * @email v
 * @author 
 */

var Polyline = SL.Polyline;

(function () {
    Polyline = SL.Polyline = function (shapeViewer, startPt, endPt) {
        Angle.apply(this, [shapeViewer, startPt, endPt]);

        var self = this;

        this.draw = function () {
            var context = self.getContext();
            context.beginPath();

            self.shapeMovePosition();
            self.cavPoints = [];

            var startPt, endPt;

            for (var index = 0; index < self.points.length; index++) {
                var point = self.resetPoint(self.points[index], self.cavScale, self.cavOffset);
                self.cavPoints.push(point);

                if (index == 0) {
                    context.moveTo(point.x, point.y);
                    self.rsPoint = point;
                    startPt = new Point(point.x, point.y);
                    endPt = new Point(point.x, point.y);
                } else {
                    context.lineTo(point.x, point.y);

                    if (startPt.x > point.x) {
                        startPt.x = point.x;
                    }

                    if (startPt.y > point.y) {
                        startPt.y = point.y;
                    }

                    if (endPt.x < point.x) {
                        endPt.x = point.x;
                    }

                    if (endPt.y < point.y) {
                        endPt.y = point.y;
                    }
                }
            }

            if (self.isEndDrawing && self.points.length > 1) {
//      context.lineTo(self.rsPoint.x, self.rsPoint.y);

                self.movePoint = new Point((startPt.x + endPt.x) / 2, (startPt.y + endPt.y) / 2);
                self.rsPoint = startPt;
                self.rePoint = endPt;
            }


            context.lineWidth = self.width;
            context.strokeStyle = self.color;
            context.stroke();

            self.active();
            //self.showMeasurement();
        };

        this.calcMeasurementInfo = function () {

            var str = "";

            var area = Utils.calcArea(self.points) * self.calibration * self.calibration,
                perimeter = Utils.calcLengthClosed(self.points) * self.calibration;

            str = Utils.appendLine(str, shapeViewer.Measurement.Area +
                Utils.floatRound(area) + shapeViewer.Measurement.AreaUnit);
            str = Utils.appendLine(str, shapeViewer.Measurement.Perimeter +
                Utils.floatRound(perimeter) + shapeViewer.Measurement.Unit);

            return str;
        };

        this.drawMove = function (point) {


            if (self.points.length >= 0) {
                self.points[self.points.length - 1] = point;
            }
        };

        this.drawClick = function (point) {
            this.points.push(point);
        };

        this.drawEnd = function () {
            var index;

            for (var i = self.points.length - 1; i > 0; i--) {
                if (SL.Utils.floatRound(self.points[i].x) == SL.Utils.floatRound(self.points[i - 1].x) &&
                    SL.Utils.floatRound(self.points[i].y) == SL.Utils.floatRound(self.points[i - 1].y)) {
                    index = i;
                } else {
                    break;
                }
            }

            if (index != null) {
                self.points.splice(index, self.points.length - index);
            }
        };
    };
})();
/**
 * Pathology - 1.0.0
 * @email v
 * @author 
 */

var Remark = SL.Remark;

(function () {
    Remark = SL.Remark = function (shapeViewer, startPt, endPt) {
        Shape.apply(this, [shapeViewer, startPt, endPt]);

        // Fields
        var self = this;

        // Private methods

        function selectElmt(isSelected, elmt) {
            if (isSelected) {
                Utils.replaceSize(elmt.inpElmt, elmt.txtElmt);
                $(elmt.txtElmt).hide();
                $(elmt.inpElmt).show();
                $(elmt.inpElmt).select();
                elmt.isSelected = true;
                elmt.active();
            } else {
                $(elmt.txtElmt).show();
                var val = $(elmt.inpElmt).val();

                if (elmt.description !== val) {
                    shapeViewer.dirtyCanvas();
                }

                $(elmt.txtElmt).html(Utils.replaceHtmlEnter(val));
                $(elmt.inpElmt).hide();
                elmt.description = val;
            }

            if (self.imageIndex !== shapeViewer.getCurrentIndex()) {
                $(elmt.txtElmt).hide();
                $(elmt.inpElmt).hide();
            }
        }

        // Public methods

        // 绘制图形
        this.draw = function () {
            self.rsPoint = self.resetPoint(self.startPoint, self.cavScale, self.cavOffset);
            self.rePoint = self.resetPoint(self.endPoint, self.cavScale, self.cavOffset);
            self.setCSS(self.rsPoint.x, self.rsPoint.y);
            self.shapeMovePosition();
        };

        // 激活为编辑状态, 绘制各个编辑点
        this.active = function () {
            if (self.isSelected) {
                self.movePoint = self.rsPoint.plus(new Point(parseInt(self.inpElmt.style.width),
                    parseInt(self.inpElmt.style.height))).divide(2);
                self.drawMoveThumb(self.rsPoint);
            }
        };

        // 判断是否点击当前图形
        this.isHitMe = function (point) {
            if (self.isSelected) {
                var resultAry = [];
                self.addClickResult(resultAry, point, self.rsPoint, ActiveMove.ShapeMove);
                self.setNearestMove(resultAry);

                if (self.activeMove === ActiveMove.ShapeMove) {
                    return true;
                }
            }

            return false;
        };

        // 判断是否点击到当前图形区域内
        this.isHitMyArea = function (point) {
            self.isSelected = self.isHitMe(point);
            return self.isSelected;
        };

        // 重绘(在绘制过程中点改变时进行重绘)
        this.shapeMovePosition = function () {
            if (self.activeMove !== null && self.activeMove !== ActiveMove.None &&
                self.activeMove === ActiveMove.ShapeMove) {
                self.resetActiveMovePoint(self.rsPoint, self.startPoint);
                self.resetActiveMovePoint(self.rePoint, self.endPoint);
            }
        };

        this.drawStart = function () {};

        this.drawClick = function () {
            this.isEndDrawing = true;
        };

        this.createElmt = function () {
            var $elmt = null;

            if (self.txtElmt === null) {
                self.txtElmt = document.createElement("label");
                self.container.appendChild(self.txtElmt);
                $elmt = $(self.txtElmt);
                $elmt.bind("mousedown", {owner: self}, function (evt) {
                    if (!shapeViewer.isSelectedEnable) {
                        return true;
                    }

                    var self = evt.data.owner;
                    shapeViewer.setActiveShape(self);

                    if (self.type === AnnotationType.Position) {
                        self.isSelected = true;
                        shapeViewer.showAnnotations();
                    } else {
                        selectElmt(true, self);
                    }

                    //evt.stopPropagation();
                    return false;
                });
                $elmt.hide();
            }

            if (self.inpElmt === null) {
                self.inpElmt = document.createElement("textarea");
                self.container.appendChild(self.inpElmt);
                $(self.inpElmt).mousedown(function (evt) {
                    evt.stopPropagation();
                }).hide();
            }
        };

        this.setCSS = function (left, top) {
            Utils.registerTxtCSS({
                elmt: self.txtElmt,
                left: left,
                top: top,
                fontSize: self.fontSize,
                fontFamily: self.fontFamily,
                color: self.color,
                fontBold: self.fontBold,
                fontItalic: self.fontItalic,
                fontUnderline: self.fontUnderLine,
                bkColor: true,
                bkOpacity: true,
                description: self.description
            });
            Utils.registerTxtCSS({
                elmt: self.inpElmt,
                left: left,
                top: top,
                fontSize: self.fontSize,
                fontFamily: self.fontFamily,
                color: self.color,
                fontBold: self.fontBold,
                fontItalic: self.fontItalic,
                fontUnderline: self.fontUnderLine,
                bkColor: true,
                bkOpacity: false,
                description: self.description
            });
            selectElmt(self.isSelected, self);
        };

        // Constructor (放在最后,保证createElmt覆盖掉基类)
        if (shapeViewer.getContainer() !== null) {
            self.createElmt();
        }
    };
})();
/**
 * Pathology - 1.0.0
 * @email v
 * @author 
 */

var Provider = SL.Provider;

(function () {
    Provider = SL.Provider = function (options) {
        SlideExtend(true, this, {
            localhost: "",
            slideUrl: "",
            getAnnoUrl: "",
            updateAnnoUrl: "",
            getPermissionUrl: ""
        }, options);

        var self = this,
            slideId = null,
            openCallback = null;

        function openSlideSuccess(data, status, jqXHR) {
            if (!data) {
                return outputLog("Open Slide error and errMsg: Request data fail!");
            }

            var result = new AjxResult(),
                slide = new SlideInfo();

            result.resultCode = data.resultCode;
            result.Info = data.Info;

            if (status === "success" && openCallback) {
                // 成功代码
                if (result.resultCode === ResultType.Success) {
                    var info = result.Info;

                    slide.id = info.id;
                    slide.name = info.name;
                    slide.url = info.url;
                    slide.description = info.description;

                    slide.calibration = info.calibration;  //　比例尺参数
                    slide.width = info.width;
                    slide.height = info.height;
                    slide.number = info.number;
                    slide.hasAnnotations = info.hasAnnotations;
                    slide.annotations = info.annotations;
                    slide.tileSize = 256;
                    slide.scanObjective = info.scanObjective;

                    openCallback(slide, ResultType.Success);
                } else if (result.resultCode === ResultType.NoImage) {
                    openCallback(slide, ResultType.NoImage);
                    outputLog("Open Slide error and errMsg: No Image!");
                } else if (result.resultCode === ResultType.NoPermission) {
                    openCallback(slide, result.resultCode);
                    outputLog("Open Slide error and errMsg: No Permission!");
                } else {
                    openCallback(slide, result.resultCode);
                }
            }
        }

        function openSlideError(jqXHR, status, errThrown) {
            if (Config.debugMode) {
                SlideDebug.log("Open Slide error: \n  status: " + status +
                    "\n  errMsg: " + errThrown.message);
            } else {
                SlideDebug.error("Open Slide error!", errThrown);
            }

            alert("Open Slide error!");
        }

        function outputLog(msg) {
            if (Config.debugMode) {
                SlideDebug.log(msg);
            } else {
                SlideDebug.error(msg);
            }
        }

        // Public methods

        // 根据图像 id 打开图像
        this.openSlide = function (id, callback) {
            slideId = typeof id === "number" || typeof parseInt(id) === "number" ? id : null;
            openCallback = typeof callback === "function" ? callback : null;

            var url = self.localhost !== "" ?
            self.localhost + self.slideUrl : self.slideUrl;

            $.ajax({
                type: "GET",
                dataType: "json",
                async: true,
                cache: false,
                url: url,
                data: {slideId: slideId},
                success: openSlideSuccess,
                error: openSlideError
            });
        };

        // 获取权限(用于保存标注,显示工具条等功能)
        this.getPermission = function (callback) {
            if (slideId !== null && typeof callback === "function") {
                var url = self.localhost !== "" ?
                self.localhost + self.getPermissionUrl : self.getPermissionUrl;

                $.ajax({
                    type: "GET",
                    dataType: "json",
                    async: true,
                    cache: false,
                    url: url + "?slideId=" + slideId,
                    success: function (data, status, jqXHR) {
                        if (!data) {
                            return outputLog("Get Permission error and errMsg: " +
                                "Request data fail!");
                        }

                        var result = new AjxResult();
                        result.resultCode = data.resultCode;
                        result.Info = data.Info;

                        if (status === "success") {
                            // 成功代码
                            if (result.resultCode === ResultType.Success) {
                                var info = result.Info;

                                if (info === "true" || (typeof info === "boolean" && info === true)) {
                                    callback(true, result.resultCode);
                                }
                            } else if (result.resultCode === ResultType.NoPermission) {
                                callback(false, result.resultCode);
                                outputLog("Get Permission error and errMsg: No Permission!");
                            } else {
                                callback(false, ResultType.Failed);
                                outputLog("Get Permission !");
                            }
                        }
                    },
                    error: function (jqXHR, status, errThrown) {
                        if (Config.debugMode) {
                            SlideDebug.log("Get Permission error: \n  status: " + status +
                                "\n  errMsg: " + errThrown.message);
                        } else {
                            SlideDebug.error("Get Permission error!", errThrown);
                        }
                    }
                });
            }
        };

        // 加载标注
        this.getAnnotations = function (callback) {
            if (typeof callback === "function") {
                var url = self.localhost !== "" ?
                self.localhost + self.getAnnoUrl : self.getAnnoUrl;

                $.ajax({
                    type: "GET",
                    dataType: "json",
                    async: true,
                    cache: false,
                    url: url + "?slideId=" + slideId,
                    success: function (data, status, jqXHR) {
                        if (!data) {
                            return outputLog("Get annotations finished, " +
                                "But return status code is NULL!");
                        }

                        var result = new AjxResult();
                        result.resultCode = data.resultCode;
                        result.Info = data.Info ? data.Info : [];

                        if (status === "success" && result.Info.length > 0) {
                            if (ResultType.Success === result.resultCode) {
                                callback(result.Info, ResultType.Success);
                            } else if (ResultType.NoPermission === result.resultCode) {
                                callback(result.Info, ResultType.NoPermission);
                                outputLog("No Permission Get annotations!");
                            } else {
                                callback(result.Info, ResultType.Failed);
                                outputLog("Get annotations Failed!");
                            }

                            return;
                        }

                        if (Config.debugMode) {
                            SlideDebug.log("Get annotations array length is zero!");
                        }
                    },
                    error: function (jqXHR, status, errThrown) {
                        if (Config.debugMode) {
                            SlideDebug.log("Get annotations error: \n  status: " + status +
                                "\n  errMsg: " + errThrown.message);
                        } else {
                            SlideDebug.error("Get annotations error!", errThrown);
                        }
                    }
                });
            }
        };

        // 上传保存标注
        this.updateAnnotations = function (slide, annos, callback) {
            if (annos && typeof callback === "function") {
                var url = self.localhost !== "" ?
                self.localhost + self.updateAnnoUrl : self.updateAnnoUrl;

                annos = annos.length > 0 ? annos : [];

                $.ajax({
                    type: "POST",
                    dataType: "json",
                    async: true,
                    cache: false,
                    url: url,
                    data: {
                        slideId: slide.id,
                        annotations: annos
                    },
                    success: function (data, status, jqXHR) {
                        if (!data) {
                            return outputLog("Update annotations finished, " +
                                "But return status code is NULL!");
                        }

                        var result = new AjxResult();
                        result.resultCode = data.resultCode;
                        result.Info = data.Info;

                        if (status === "success") {
                            if (ResultType.Success === result.resultCode) {
                                callback(ResultType.Success);
                            } else if (ResultType.NoPermission === result.resultCode) {
                                callback(ResultType.NoPermission);
                                outputLog("No Permission Update annotations!");
                            } else {
                                callback(ResultType.Failed);
                                outputLog("Update annotations Failed!");
                            }
                        }
                    },
                    error: function (jqXHR, status, errThrown) {
                        if (Config.debugMode) {
                            SlideDebug.log("Update annotations error: \n  status: " + status +
                                "\n  errMsg: " + errThrown.message);
                        } else {
                            SlideDebug.error("Update annotations error!", errThrown);
                        }
                    }
                });
            }
        };
    };
})();

/**
 * Pathology - 1.0.0
 * @email v
 * @author 
 */

var Source = SL.Source;

(function () {
    Source = SL.Source = function (localhost, url, width, height, sign, deviceId, priority, number) {
        Slide.Source.apply(this, [width, height, number]);

        url = localhost !== "" ? localhost + "/" + url : url;

        this.getSlideUrl = function (index) {
            return [url, "/", index,'?deviceId=',deviceId ,'&priority=',priority ,'&sign=', sign].join('');
            //return [url, "/", index,'.jpg'].join('');
        };
    };
})();


var TileSource = SL.TileSource;

(function () {
    TileSource = SL.TileSource = function (localhost,url, width, height, number, tierSize, sign, deviceId, priority,tierLvl) {
        SlideSource.apply(this, [width, height, number, tierSize, tierLvl]);

        url = localhost !== "" ? localhost + "/" + url : url;

        this.getTileUrl = function (level, xMod, yMod) {

            return [url, '/0','/',level, '/', xMod, '-', yMod,'?deviceId=',deviceId ,'&priority=',priority ,'&sign=', sign].join('');

            //return [url, '/',level, '/', xMod, '_', yMod,'.jpg'].join('');
        };
    };
})();

/**
 * Pathology - 1.0.0
 * @email v
 * @author 
 */

var Support = SL.Support;

(function () {
    if (Support) {
        return;
    }

    $.extend($.support, {
        orientation: "orientation" in window && "onorientationchange" in window,
        touch: "ontouchend" in document
    });

    Support = SL.Support = {
        imageAdjustment: false,
        canvas: false,
        isAndroid: false
    };

    var browser = Slide.Utils.getBrowser(),
        userAgent = navigator.userAgent.toLowerCase(),
        isSupportCanvas = !! document.createElement("canvas").getContext;

    Support.canvas = isSupportCanvas;

    if (isSupportCanvas && browser !== Slide.Browser.IE &&
        browser !== Slide.Browser.UNKNOWN) {
        Support.imageAdjustment = true;
    }

    Support.isAndroid = (userAgent.indexOf("android") > -1);
})();

/**
 * Pathology - 1.0.0
 * @email v
 * @author 
 */

// Class Button not jQuery for use Pathology library
var Button = SL.Button;

(function () {
    Button = SL.Button = function (options) {
        // Default parameters
        Extend(true, this, {
            name: "",
            text: "",
            title: "",

            data: null,

            mouseDown: null,
            mouseUp: null,
            mouseEnter: null,
            mouseLeave: null,
            mouseClk: null
        }, options);

        // Fields
        var self = this,
            selected = false;

        // Properties
        this.elmt = document.createElement("a");

        // Constructor
        (function () {
            self.data = {
                _this: self,
                data: self.data
            };

            var btn = self.elmt,
                icon = document.createElement("span"),
                text = document.createElement("span");

            btn.title = self.title;
            text.innerHTML = self.text;
            //$(btn).bind("click", self.data, self.mouseClk);

            Dom.addClass(btn, "sp-btn");
            Dom.addClass(icon, "icon " + self.name);
            Dom.addClass(text, "text");

            btn.appendChild(icon);

            if (self.text !== undefined && self.text !== null && self.text !== "") {
                btn.appendChild(text);
            }

            // 添加鼠标事件
            Utils.addEvent(btn, "mouseover", onMouseEnter, false);
            Utils.addEvent(btn, "mouseout", onMouseLeave, false);
            Utils.addEvent(btn, "mousedown", onMouseDown, false);
            Utils.addEvent(btn, "mouseup", onMouseUp, false);
            Utils.addEvent(btn, "click", onMouseClk, false);
        })();

        // Private methods
        // Mouse event handling

        function onMouseDown(evt) {
            evt = Utils.getEvent(evt);

            if (self.mouseDown !== null && typeof self.mouseDown === "function") {
                self.mouseDown(evt, self.data);
            }
        }

        function onMouseUp(evt) {
            evt = Utils.getEvent(evt);

            if (self.mouseUp !== null && typeof self.mouseUp === "function") {
                self.mouseUp(evt, self.data);
            }
        }

        function onMouseEnter(evt) {
            evt = Utils.getEvent(evt);

            if (self.mouseEnter !== null && typeof self.mouseEnter === "function") {
                self.mouseEnter(evt, self.data);
            }
        }

        function onMouseLeave(evt) {
            evt = Utils.getEvent(evt);

            if (self.mouseLeave !== null && typeof self.mouseLeave === "function") {
                self.mouseLeave(evt, self.data);
            }
        }

        function onMouseClk(evt) {
            evt = Utils.getEvent(evt);

            if (self.mouseClk !== null && typeof self.mouseClk === "function") {
                self.mouseClk(evt, self.data);
            }
        }

        // Public methods

        this.hide = function () {
            Dom.hide(self.elmt);
        };

        this.show = function () {
            Dom.show(self.elmt);
        };

        this.setSelected = function (enable) {
            if (typeof enable === "boolean" && enable === true) {
                selected = true;
                Dom.addClass(self.elmt, "sp-btn-selected");
            } else {
                selected = false;
                Dom.removeClass(self.elmt, "sp-btn-selected");
            }
        };

        this.isSelected = function () {
            return selected;
        };
    };
})();

var LabelTxt = SL.LabelTxt;

(function () {
    LabelTxt = SL.LabelTxt = function (options) {
        // Default parameters
        Extend(true, this, {
            name: "",
            text: "",
            title: "",

            width: 0,

            data: null
        }, options);

        // Fields
        var self = this;

        // Properties
        this.elmt = document.createElement("span");

        // Constructor
        (function () {
            Dom.addClass(self.elmt, "sp-label");
            Dom.addClass(self.elmt, self.name);

            self.title = self.title;
            self.elmt.innerHTML = self.text;

            if (self.width !== 0) {
                self.elmt.style.width = self.width;
            }
        })();

        // Public methods

        this.hide = function () {
            Dom.hide(self.elmt);
        };

        this.show = function () {
            Dom.show(self.elmt);
        };

        this.setText = function (str) {
            self.elmt.innerHTML = str;
        };

        this.addItem = function (item) {
            if (Dom.isDOM(item)) {
                self.elmt.appendChild(item);
            }
        };
    };
})();

var Toolstrip = SL.Toolstrip;

(function () {
    Toolstrip = SL.Toolstrip = function (name) {
        // Fields
        var self = this,
            elmtAry = [];

        // Properties
        this.elmt = document.createElement("div");

        // Constructor
        (function () {
            Dom.addClass(self.elmt, "sp-toolstrip " + name);
        })();

        // Public methods

        this.addItem = function (item) {
            if (Dom.isDOM(item)) {
                self.elmt.appendChild(item);
                elmtAry.push(item);
            }
        };

        this.hide = function () {
            Dom.hide(self.elmt);
        };

        this.show = function () {
            Dom.show(self.elmt);
        };
    };
})();

var Toolbar = SL.Toolbar;

(function () {
    Toolbar = SL.Toolbar = function (name) {
        // Fields
        var self = this;

        // Properties
        this.elmt = document.createElement("div");

        // Constructor
        (function () {
            Dom.addClass(self.elmt, "sp-" + name);
        })();

        // Public methods

        this.show = function () {
            self.elmt.visibility = "visible";
        };

        this.hide = function () {
            self.elmt.visibility = "hidden";
        };

        this.addToolstrip = function (elmt) {
            if (Dom.isDOM(elmt)) {
                self.elmt.appendChild(elmt);
            }
        };
    };
})();

var DialogEdit = SL.DialogEdit;

(function () {
    DialogEdit = SL.DialogEdit = function (viewer) {
        // Fields
        var self = this,
            shapeCanvas = null,
            activeShape = null,
            colorPicker = null,
            lineWidthId = "lineWidth-" + new Date().getTime(),
            annoNameId = "annoName-" + new Date().getTime(),
            annoDescId = "annoDesc-" + new Date().getTime(),
            colorId = "color-" + new Date().getTime(),
            colorpickerId = "colorpicker-" + new Date().getTime(),
            chkAutoShowId = "chkAutoShow-" + new Date().getTime(),
            str =
                '<div data-role="dialog" data-overlay-theme="e" title="Edit Annotation" class="ui-dialog-topright">' +
                '<div data-role="content" data-theme="c">' +

                '<div data-role="fieldcontain">' +
                '<label for="' + lineWidthId + '" class="ui-item-label" data-lang="Dialog.Edit.LineWidth">Line Width:</label>' +
                '<select id="' + lineWidthId + '" class="ui-item-field" >' +
                '<option value="1">1</option>' +
                '<option value="2">2</option>' +
                '<option value="5" selected="selected">5</option>' +
                '<option value="10">10</option>' +
                '<option value="20">20</option>' +
                '</select>' +
                '</div>' +

                '<div data-role="fieldcontain">' +
                '<label for="' + annoNameId + '" class="ui-item-label" data-lang="Dialog.Edit.Name">Name:</label>' +
                '<input type="text" id="' + annoNameId + '" class="ui-item-field" />' +
                '</div>' +

                '<div data-role="fieldcontain">' +
                '<label for="' + annoDescId + '" class="ui-item-label" data-lang="Dialog.Edit.Description">Description:</label>' +
                '<textarea id="' + annoDescId + '" class="ui-item-field" rows="2"></textarea>' +
                '</div>' +

                '<div data-role="fieldcontain">' +
                '<label for="' + colorId + '" class="ui-item-label" data-lang="Dialog.Edit.Color">Color:</label>' +
                '<input type="text" id="' + colorId + '" value="#0d29e7" class="ui-item-field"/>' +
                '<div id="' + colorpickerId + '"></div>' +
                '</div>' +

                '<div data-role="fieldcontain">' +
                '<input type="checkbox" id="' + chkAutoShowId + '"/>' +
                '<label for="' + chkAutoShowId + '" data-inline="true" data-lang="Dialog.Buttons.AutoShow">Show Automatically</label>' +
                '</div>' +

                '</div>' +
                '</div>';

        // Properties
        this.$dlg = $(str);

        // Private methods

        function initDlg() {
            shapeCanvas = viewer.shapeCanvas != null ? viewer.shapeCanvas : null;
            activeShape = shapeCanvas != null ? shapeCanvas.getActiveShape() : null;

            $("[data-lang]", self.$dlg).html(function () {
                return Strings.getString($(this).attr("data-lang"));
            });

            self.$dlg.appendTo($("body")).dialog({
                autoOpen: true,
                resizable: false,
                modal: true,
                minWidth: 320,
                minHeight: 500,
                width: 320,
                height: 500,
                zIndex: 10000,
                dialogClass: "editClass",
                draggable: Config.dialogDraggable,
                title: Strings.getString("Dialog.Edit.Title"),
                open: function (event, ui) {
                    $("#" + colorpickerId, self.$dlg).farbtastic("#" + colorId);
                    colorPicker = $.farbtastic("#" + colorpickerId);

                    $("#" + chkAutoShowId, self.$dlg).attr("checked",
                        Config.autoShowAnnoDialog);

                    if (activeShape) {
                        $("#" + lineWidthId, self.$dlg).val(activeShape.width);
                        $("#" + annoNameId, self.$dlg).val(activeShape.name);
                        $("#" + annoDescId, self.$dlg).val(activeShape.description);
                        colorPicker.setColor(activeShape.color);
                    }
                },
                close: function(event, ui) {
                    shapeCanvas = null;
                    activeShape = null;
                    colorPicker = null;
                    self.$dlg.remove();
                },
                buttons: [
                    {
                        text: Strings.getString("Dialog.Buttons.Ok"),
                        click: function () {
                            changeParameter();
                            $(this).dialog("close");
                        }
                    },
                    {
                        text: Strings.getString("Dialog.Buttons.Cancel"),
                        click: function () {
                            $(this).dialog("close");
                        }
                    }
                ]
            });
        }

        function changeParameter() {
            var shapeConfig = viewer.shapeCanvas.ShapeConfig;
            shapeConfig.defaultColor = $("#" + colorId, self.$dlg).val();
            shapeConfig.lineWidth = $("#" + lineWidthId, self.$dlg).val();
            Config.autoShowAnnoDialog =
                ($("#" + chkAutoShowId, self.$dlg).attr("checked") === "checked");

            if (shapeCanvas != null) {
                if(activeShape.type === "Remark"||activeShape.type === "Linetext"){
                    activeShape.fontSize = shapeConfig.lineWidth * 5;
                }

                activeShape.width = shapeConfig.lineWidth;
                activeShape.color = shapeConfig.defaultColor;
                activeShape.name = $("#" + annoNameId, self.$dlg).val();
                activeShape.description = $("#" + annoDescId, self.$dlg).val();
                activeShape.isMeasurementChanged = true;
                shapeCanvas.dirtyCanvas();
                shapeCanvas.showAnnotations();
            }
        }

        // Public methods

        this.show = function () {
            initDlg();
        };
    };
})();

var AnnoToolbar = SL.AnnoToolbar;

(function () {
    AnnoToolbar = SL.AnnoToolbar = function (viewer) {
        // Fields
        var self = this,
            toolbar = new Toolbar("annotation"),
            antdlg;

            btnSvEnalbe = true,

            btnAry = [],
            btnFinish = null,
            btnSave = null,
            btnEdit = null,
            btnDelete = null,
            btnBk = null;

        // Properties
        this.elmt = toolbar.elmt;

        // Constructor
        (function () {
            // left
            antdlg = new DialogEdit(viewer);

            var leftStrip = new Toolstrip("left");
            toolbar.addToolstrip(leftStrip.elmt);

            var labelAnno = new LabelTxt({
                name: "标注类型",
                text: "&nbsp;" + Strings.getString("Labels.AnnotationType") + "&nbsp;"
            });
            leftStrip.addItem(labelAnno.elmt);

            var labelContent = new LabelTxt();
            leftStrip.addItem(labelContent.elmt);

            var btn = new Button({
                name: "hand",
                title: Strings.getString("Buttons.AnnoToolbar.BtnHand"),
                data: {type: "hand"},
                mouseClk: btnAnnoClk
            });
            labelContent.addItem(btn.elmt);
            btnAry.push(btn);

            btn = new Button({
                name: "select",
                title: Strings.getString("Buttons.AnnoToolbar.BtnSelect"),
                data: {type: "select"},
                mouseClk: btnAnnoClk
            });
            labelContent.addItem(btn.elmt);
            btnAry.push(btn);

            btn = new Button({
                name: "line",
                title: Strings.getString("Buttons.AnnoToolbar.BtnLine"),
                data: {type: AnnotationType.Line},
                mouseClk: btnAnnoClk
            });
            labelContent.addItem(btn.elmt);
            btnAry.push(btn);

            btn = new Button({
                name: "arrow",
                title: Strings.getString("Buttons.AnnoToolbar.BtnArrow"),
                data: {type: AnnotationType.Arrow},
                mouseClk: btnAnnoClk
            });
            labelContent.addItem(btn.elmt);
            btnAry.push(btn);

            btn = new Button({
                name: "brace",
                title: Strings.getString("Buttons.AnnoToolbar.BtnBrace"),
                data: {type: AnnotationType.Brace},
                mouseClk: btnAnnoClk
            });
            labelContent.addItem(btn.elmt);
            btnAry.push(btn);

            btn = new Button({
                name: "rect",
                title: Strings.getString("Buttons.AnnoToolbar.BtnRect"),
                data: {type: AnnotationType.Rectangle},
                mouseClk: btnAnnoClk
            });
            labelContent.addItem(btn.elmt);
            btnAry.push(btn);

            btn = new Button({
                name: "ellipse",
                title: Strings.getString("Buttons.AnnoToolbar.BtnEllipse"),
                data: {type: AnnotationType.Ellipse},
                mouseClk: btnAnnoClk
            });
            labelContent.addItem(btn.elmt);
            btnAry.push(btn);

            btn = new Button({
                name: "polygon",
                title: Strings.getString("Buttons.AnnoToolbar.BtnPolygon"),
                data: {type: AnnotationType.Polygon},
                mouseClk: btnAnnoClk
            });
            labelContent.addItem(btn.elmt);
            btnAry.push(btn);

            btn = new Button({
                name: "polyline",
                title: Strings.getString("Buttons.AnnoToolbar.BtnPolyline"),
                data: {type: AnnotationType.Polyline},
                mouseClk: btnAnnoClk
            });
            labelContent.addItem(btn.elmt);
            btnAry.push(btn);

            btn = new Button({
                name: "remark",
                title: Strings.getString("Buttons.AnnoToolbar.BtnPosition"),
                data: {type: AnnotationType.Remark},
                mouseClk: btnAnnoClk
            });
            labelContent.addItem(btn.elmt);
            btnAry.push(btn);

            btn = new Button({
                name: "linetext",
                title: Strings.getString("Buttons.AnnoToolbar.BtnLinetext"),
                data: {type: AnnotationType.Linetext},
                mouseClk: btnAnnoClk
            });
            labelContent.addItem(btn.elmt);
            btnAry.push(btn);

            // right
            var rightStrip = new Toolstrip("right");
            toolbar.addToolstrip(rightStrip.elmt);

            btnBk = new Button({
                name: "back-to-main",
                title: Strings.getString("Buttons.AnnoToolbar.BtnBack"),
                mouseClk: btnBkClk
            });
            rightStrip.addItem(btnBk.elmt);

            btnDelete = new Button({
                name: "delete",
                title: Strings.getString("Buttons.AnnoToolbar.BtnDelete"),
                mouseClk: btnDeleteClk
            });
            rightStrip.addItem(btnDelete.elmt);

            btnEdit = new Button({
                name: "edit",
                title: Strings.getString("Buttons.AnnoToolbar.BtnEdit"),
                mouseClk: btnEditClk
            });
            rightStrip.addItem(btnEdit.elmt);

            btnSave = new Button({
                name: "save",
                title: Strings.getString("Buttons.AnnoToolbar.BtnSave"),
                mouseClk: btnSaveClk
            });
            btnSave.hide();
            btnSvEnalbe = false;
            rightStrip.addItem(btnSave.elmt);

            btnFinish = new Button({
                name: "finish",
                title: Strings.getString("Buttons.AnnoToolbar.BtnFinish"),
                mouseClk: btnFinishClk
            });
            btnFinish.hide();
            rightStrip.addItem(btnFinish.elmt);
        })();

        // Private methods
        // Annotation button event handling

        function btnAnnoClk(evt, data) {
            for (var i = 0; i < btnAry.length; i++) {
                btnAry[i].setSelected(false);
            }

            var btn = data._this;
            btn.setSelected(!btn.isSelected());

            if (btn.isSelected()) {
                btnFinish.hide();

                if (viewer.shapeCanvas != null) {
                    var type = data.data.type;

                    switch (type) {
                        case "hand":
                            viewer.shapeCanvas.setSelectedEnable(false);
                            break;
                        case "select":
                            viewer.shapeCanvas.setSelectedEnable(true);
                            break;
                        default:
                            if (type == AnnotationType.Polygon) {
                                //btnFinish.show();
                            }

                            viewer.shapeCanvas.setDrawType(type);
                    }
                }
            }
        }

        function btnFinishClk() {
            if (viewer.shapeCanvas != null) {
                viewer.shapeCanvas.finishDrawing();
            }
        }

        function btnSaveClk() {
            // 提示保存标注对话框
            //var $dlg = $('<div data-role="dialog" class="ui-dialog-topright">' +
            //    '<div data-role="content" data-theme="c" data-mini="true">' +
            //    '<p>' + Strings.getString("Dialog.AskSave.Message") + '</p>' +
            //    '</div>' +
            //    '</div>');
            //$dlg.appendTo($("body")).dialog({
            //    autoOpen: true,
            //    resizable: false,
            //    modal: true,
            //    title: Strings.getString("Dialog.AskSave.Title"),
            //    close: function(event, ui) {
            //        $dlg.remove();
            //    },
            //    buttons: [
            //        {
            //            text: Strings.getString("Dialog.Buttons.Yes"),
            //            click: function () {
            //                $(btnSave.elmt).attr("disable", true);
            //                viewer.saveAnnotations();
            //                $(this).dialog("close");
            //            }
            //        },
            //        {
            //            text: Strings.getString("Dialog.Buttons.No"),
            //            click: function () {
            //                //viewer.reloadAnnotations();
            //                $(this).dialog("close");
            //            }
            //        }
            //    ]
            //});
            viewer.saveAnnotations();
        }

        function btnEditClk() {
            if (viewer.isOpen()) {
                if (viewer.shapeCanvas != null && viewer.shapeCanvas.isSelectedEnable &&
                    viewer.shapeCanvas.getActiveShape() !== null) {
                    (new DialogEdit(viewer)).show();
                }
            }
        }

        function btnDeleteClk() {
            if (viewer !== null) {
                viewer.deleteAnnotation();
            }
        }

        function btnBkClk() {
            if (self.onBack && typeof self.onBack === "function") {
                self.onBack();
            }
        }

        // Public methods

        this.onBack = null;

        this.hide = function () {
            Dom.hide(self.elmt);
        };

        this.show = function () {
            Dom.show(self.elmt);
        };

        this.resetAnnoBtns = function () {
            for (var i = 0; i < btnAry.length; i++) {
                btnAry[i].setSelected(false);
            }

            btnFinish.hide();
        };

        this.setSaveBtn = function (enable) {
            if (typeof enable === "boolean" && enable === true) {
                btnSave.show();
                btnSvEnalbe = true;
            } else {
                btnSave.hide();
                btnSvEnalbe = false;
            }
        };

        this.isSvBtnEnable = function () {
            return btnSvEnalbe;
        };

        this.resetBtnStatus = function () {
            for (var i = 0; i < btnAry.length; i++) {
                btnAry[i].setSelected(false);
            }
        };

        this.showAnnotationDialog = function () {
            antdlg && antdlg.show();
        };
    };
})();

var MainToolbar = SL.MainToolbar;

(function () {
    MainToolbar = SL.MainToolbar = function (viewer) {
        // Fields
        var self = this,
            toolbar = new Toolbar("main"),
            viewSize = Utils.getElementSize(viewer.containerId),

            zoomAry = [4,10,20,40,100],
            btnZoomAry = [],

            minWidth = 650,
            btnCnt = 6,
            btnWidth = 40,
            zoomCntWidth = 70,
            fitWidth = 2,

            leftStrip = null,
            centerStrip = null,
            rightStrip = null,
            btnFull = null,
            btnBk = null,
            btnHome = null,
            btnZoom = null,
            btnZoomIn = null,
            labelName = null,
            labelZoomCnt = null,
            btnZoomOut = null,
            btnAnnotation = null,
            btnOptions = null;

        // Properties
        this.elmt = toolbar.elmt;

        // Constructor
        (function () {
            var width = viewSize.x - btnWidth * btnCnt;

            // left
            leftStrip = new Toolstrip("left");
            toolbar.addToolstrip(leftStrip.elmt);

            btnBk = new Button({
                name: "back",
                title: Strings.getString("Buttons.MainToolbar.BtnBack"),
                mouseClk: btnBkClk
            });
            //leftStrip.addItem(btnBk.elmt);

            btnFull = new Button({
                name: "fullScreen",
                title: Strings.getString("Buttons.MainToolbar.BtnFullScreen"),
                mouseClk: btnFullScClk
            });
            leftStrip.addItem(btnFull.elmt);

            btnHome = new Button({
                name: "home",
                title: Strings.getString("Buttons.MainToolbar.BtnHome"),
                mouseClk: btnHomeClk
            });
            leftStrip.addItem(btnHome.elmt);

            btnOptions = new Button({
                name: "options",
                title: Strings.getString("Buttons.MainToolbar.Options"),
                mouseClk: btnOptionsClk
            });
            leftStrip.addItem(btnOptions.elmt);
            btnOptions.hide();

            if(1){
                for(var i = 0;i < zoomAry.length; i++){
                    btnZoom = new Button({
                        name: "times-" +zoomAry[i].toString()+"x",
                        title: zoomAry[i].toString() + Strings.getString("Buttons.MainToolbar.times"),
                        mouseClk: btnZoomClk,
                        data:{times:zoomAry[i]}
                    });
                    btnZoomAry.push(btnZoom);
                    leftStrip.addItem(btnZoom.elmt);
                }
            }


            if (!Config.showOption) {
                btnOptions.hide();
            }

            // center
            centerStrip = new Toolstrip("center");
            centerStrip.elmt.style.width = width + "px";
            toolbar.addToolstrip(centerStrip.elmt);

            labelName = new LabelTxt({
                name: "name",
                text: "",
                width: width - zoomCntWidth + "px"
            });
            centerStrip.addItem(labelName.elmt);

            labelZoomCnt = new LabelTxt({
                name: "zoomCount",
                text: "",
                width: zoomCntWidth + "px"
            });
            centerStrip.addItem(labelZoomCnt.elmt);

            // right
            rightStrip = new Toolstrip("right");
            toolbar.addToolstrip(rightStrip.elmt);

            btnZoomIn = new Button({
                name: "zoomIn",
                title: Strings.getString("Buttons.MainToolbar.ZoomIn"),
                mouseClk: btnZoomInClk
            });
            rightStrip.addItem(btnZoomIn.elmt);

            btnZoomOut = new Button({
                name: "zoomOut",
                title: Strings.getString("Buttons.MainToolbar.ZoomOut"),
                mouseClk: btnZoomOutClk
            });
            rightStrip.addItem(btnZoomOut.elmt);

            btnAnnotation= new Button({
                name: "annotation",
                title: Strings.getString("Buttons.MainToolbar.Annotation"),
                mouseClk: btnAnnotationClk
            });
            rightStrip.addItem(btnAnnotation.elmt);

            if (viewer.isOpen()) {
                onOpen();
                onAnimation();
            }

            viewer.addEventListener("open", onOpen);
            viewer.addEventListener("animation", onAnimation);
        })();

        // Private methods
        // Button click event handling

        function btnFullScClk() {
            if (viewer) {
                if (!viewer.isFullPage()) {
                    viewer.setFullPage(true);
                } else {
                    viewer.setFullPage(false);
                }
            }
        }

        function btnBkClk() {
            window.history.back(-1);
        }

        function btnHomeClk() {
            if (viewer.isOpen() && viewer.viewport) {
                viewer.viewport.goHome();
            }
        }

        function btnZoomClk(evt,data) {
            if (viewer) {
                viewer.zoomToObj(data.data.times);
            }
        }

        function btnOptionsClk() {
            if (!viewer.isOpen()) {
                return;
            }

            var compactId = "flip-compact-" + new Date().getTime(),
                rulerId = "flip-ruler-" + new Date().getTime(),
                gridId = "flip-grid-" + new Date().getTime(),
                $dlg = $('<div title="Options" data-role="dialog">' +
                    '<div data-role="fieldcontain" class="option-item">' +
                    '<label for="' + compactId + '" class="option-item-label" data-lang="Dialog.Options.Compact">Compact:</label>' +
                    '<div id="' + compactId + '" class="option-item-radio">' +
                    '<input type="radio" id="' + compactId + '-on" name="compact" value="on"/>' +
                    '<label for="' + compactId + '-on" data-lang="Dialog.Options.On">On</label>' +
                    '<input type="radio" id="' + compactId + '-off" name="compact" value="off" />' +
                    '<label for="' + compactId + '-off" data-lang="Dialog.Options.Off">Off</label>' +
                    '</div>' +
                    '</div>' +
                    '<div data-role="fieldcontain" class="option-item" data-show="canvas">' +
                    '<label for="' + rulerId + '" class="option-item-label" data-lang="Dialog.Options.Ruler">Ruler:</label>' +
                    '<div id="' + rulerId + '" class="option-item-radio">' +
                    '<input type="radio" id="' + rulerId + '-on" name="ruler" value="on" />' +
                    '<label for="' + rulerId + '-on" data-lang="Dialog.Options.On">On</label>' +
                    '<input type="radio" id="' + rulerId + '-off" name="ruler" value="off" />' +
                    '<label for="' + rulerId + '-off" data-lang="Dialog.Options.Off">Off</label>' +
                    '</div>' +
                    '</div>' +
                    '<div data-role="fieldcontain" class="option-item" data-show="canvas">' +
                    '<label for="' + gridId + '" class="option-item-label" data-lang="Dialog.Options.Grid">Grid:</label>' +
                    '<div id="' + gridId + '" class="option-item-radio">' +
                    '<input type="radio" id="' + gridId + '-on" name="grid" value="on" />' +
                    '<label for="' + gridId + '-on" data-lang="Dialog.Options.On">On</label>' +
                    '<input type="radio" id="' + gridId + '-off" name="grid" value="off" />' +
                    '<label for="' + gridId + '-off" data-lang="Dialog.Options.Off">Off</label>' +
                    '</div>' +
                    '</div>' +
                    '</div>');

            $("[data-lang]", $dlg).html(function () {
                return Strings.getString($(this).attr("data-lang"))
            });
            $(".option-item-radio", $dlg).buttonset();

            if (!Support.canvas) {
                $("[data-show='canvas']", $dlg).hide();
            }

            $dlg.appendTo($("body")).dialog({
                autoOpen: true,
                resizable: false,
                modal: true,
                draggable: Config.dialogDraggable,
                title: Strings.getString("Dialog.Options.Title"),
                open: function (event, ui) {
                    if (Config.compactBrowsing()) {
                        $("#" + compactId + "-on", $dlg).attr("checked",
                            "checked").button("refresh");
                    } else {
                        $("#" + compactId + "-off", $dlg).attr("checked",
                            "checked").button("refresh");
                    }

                    if (Config.showRulers()) {
                        $("#" + rulerId + "-on", $dlg).attr("checked",
                            "checked").button("refresh");
                    } else {
                        $("#" + rulerId + "-off", $dlg).attr("checked",
                            "checked").button("refresh");
                    }

                    if (Config.showGrid()) {
                        $("#" + gridId + "-on", $dlg).attr("checked",
                            "checked").button("refresh");
                    } else {
                        $("#" + gridId + "-off", $dlg).attr("checked",
                            "checked").button("refresh");
                    }
                },
                close: function(event, ui) {
                    $dlg.remove();
                },
                buttons: [
                    {
                        text: Strings.getString("Dialog.Buttons.Ok"),
                        click: function () {
                            var isChecked = ($("#" + compactId + "-on", $dlg).attr("checked") === "checked");
                            Config.compactBrowsing(isChecked);

                            isChecked = ($("#" + rulerId + "-on", $dlg).attr("checked") === "checked");
                            Config.showRulers(isChecked);

                            isChecked = ($("#" + gridId + "-on", $dlg).attr("checked") === "checked");
                            Config.showGrid(isChecked);

                            viewer.update();
                            $(this).dialog("close");
                        }
                    },
                    {
                        text: Strings.getString("Dialog.Buttons.Cancel"),
                        click: function () {
                            $(this).dialog("close");
                        }
                    }
                ]
            });
        }


        function btnZoomInClk() {
            if (viewer.isOpen() && viewer.viewport) {
                var factor = Math.pow(Slide.Config.zoomPerScroll, 1);
                viewer.viewport.zoomBy(factor);
                viewer.viewport.applyConstraints();
            }
        }

        function btnZoomOutClk() {
            if (viewer.isOpen() && viewer.viewport) {
                var factor = Math.pow(Slide.Config.zoomPerScroll, -1);
                viewer.viewport.zoomBy(factor);
                viewer.viewport.applyConstraints();
            }
        }

        function btnAnnotationClk() {
            viewer.getShapeCanvas().setSelectedEnable(true);
            if (Support.canvas) {
                if (Config.compactBrowsing()) {
                    // 提示精简模式不支持对话框
                    var $dlg = $('<div data-role="dialog" class="ui-dialog-topright">' +
                        '<div data-role="content" data-theme="c" data-mini="true">' +
                        '<p>' + Strings.getString("Dialog.Compact.Message") + '</p>' +
                        '</div>' +
                        '</div>');
                    $dlg.appendTo($("body")).dialog({
                        autoOpen: true,
                        resizable: false,
                        modal: true,
                        draggable: Config.dialogDraggable,
                        title: Strings.getString("Dialog.Compact.Title"),
                        close: function(event, ui) {
                            $dlg.remove();
                        },
                        buttons: [{
                            text: Strings.getString("Dialog.Buttons.Ok"),
                            click: function () {
                                $(this).dialog("close");
                            }
                        }]
                    });
                } else {
                    if (self.onShowAnnoToolbar &&
                        typeof self.onShowAnnoToolbar === "function") {
                        self.onShowAnnoToolbar();
                    }
                }
            } else {
                // 提示精简模式不支持对话框
                var $dlg = $('<div data-role="dialog" class="ui-dialog-topright">' +
                    '<div data-role="content" data-theme="c" data-mini="true">' +
                    '<p>' + Strings.getString("Dialog.NotSupported.Message") + '</p>' +
                    '</div>' +
                    '</div>');
                $dlg.appendTo($("body")).dialog({
                    autoOpen: true,
                    resizable: false,
                    modal: true,
                    draggable: Config.dialogDraggable,
                    title: Strings.getString("Dialog.NotSupported.Title"),
                    close: function(event, ui) {
                        $dlg.remove();
                    },
                    buttons: [{
                        text: Strings.getString("Dialog.Buttons.Ok"),
                        click: function () {
                            $(this).dialog("close");
                        }
                    }]
                });
            }
        }

        // view event handling

        function onOpen() {
            var currentSlide = viewer.getCurrentSL();

            if (currentSlide) {
                labelName.elmt.innerHTML = "";
                labelName.elmt.innerHTML = currentSlide.name;
            }

            if (currentSlide) {
                showZoomBtn(currentSlide.scanObjective)
            }

            self.setArcAndZoomCnt();
        }

        function onAnimation() {
            self.setArcAndZoomCnt();
        }

        function showZoomBtn(scanObj) {
            for (var i = 0; i < zoomAry.length; i++) {
                if (zoomAry[i] > scanObj) {
                    btnZoomAry[i].hide();
                } else {
                    btnZoomAry[i].show();
                }
            }
        }

        // Public methods

        this.onShowAnnoToolbar = null;

        this.resize = function () {
            viewSize = Utils.getElementSize(viewer.containerId);

            if (viewSize.x < minWidth) {
                leftStrip.hide();
                rightStrip.hide();
                centerStrip.elmt.style.width = viewSize.x + "px";
                labelName.elmt.style.width = viewSize.x - zoomCntWidth + "px";
            } else {
                leftStrip.show();
                rightStrip.show();
                centerStrip.elmt.style.width = viewSize.x - btnWidth * btnCnt
                    - fitWidth + "px";
                labelName.elmt.style.width = viewSize.x - btnWidth * btnCnt -
                    zoomCntWidth + "px";
            }
        };

        this.hide = function () {
            Dom.hide(self.elmt);
        };

        this.show = function () {
            Dom.show(self.elmt);
        };

        this.setArcAndZoomCnt = function () {
            if (viewer.isOpen()) {
                var zoom = viewer.getScale(),
                    index = viewer.getIndex(),
                    currentSlide = viewer.getCurrentSL();
                var currentZoom = (currentSlide.scanObjective * viewer.getScaleP()).toFixed(2);


                labelZoomCnt.elmt.style.fontSize = "13px";
                labelZoomCnt.elmt.innerHTML = "";

                labelZoomCnt.elmt.innerHTML =
                    parseInt((index / currentSlide.number) * 360) + "° - " +
                    currentZoom + "x";
            }
        };
    };
})();

var ViewToolbar = SL.ViewToolbar;

(function () {
    ViewToolbar = SL.ViewToolbar = function (viewer, id) {
        // Fields
        var self = this,
            isShow = true;

        // Properties
        this.elmt = Utils.getElement(id);
        this.main = null;
        this.annotation = null;

        // Constructor
        (function () {
            self.main = new MainToolbar(viewer);
            self.annotation = new AnnoToolbar(viewer);

            // Initialize Callback function
            self.main.onShowAnnoToolbar = function () {
                self.main.hide();
                self.annotation.show();
            };

            self.annotation.onBack = function () {
                self.main.show();
                self.annotation.hide();
            };

            Dom.addClass(self.elmt, "sp-toolbar");
            self.elmt.appendChild(self.main.elmt);
            self.elmt.appendChild(self.annotation.elmt);

            self.main.resize();
            self.annotation.hide();

            viewer.addEventListener("resize", onResize);
        })();

        // Private methods
        // Viewer event handling

        function onResize() {
            var viewSize = Utils.getElementSize(viewer.containerId);

            if (viewSize.x < 650) {
                self.annotation.hide();
                self.main.show();
                self.main.resize();
            } else {
                self.main.resize();
            }
        }

        // Public methods

        this.hide = function () {
            isShow = false;
            Dom.hide(self.elmt);
        };

        this.show = function () {
            isShow = true;
            Dom.show(self.elmt);
        };

        this.isShow = function () {
            return isShow;
        };

        this.resize = function () {
            onResize();
        };

        this.resetToolbar = function () {
            if (self.annotation && self.main && isShow === true) {
                self.annotation.resetBtnStatus();

                self.main.show();
                self.annotation.hide();
            }
        };
    };
})();

var NavigationView = SL.NavigationView;
(function (){
    NavigationView = SL.NavigationView= function (url, width, height) {
        var self = this,
            isTouchStart = false,
            hLine,
            vLine,
            imgView = null,
            cavView = null,
            cavViewImg = null,
            thumbnail = null,
            viewRect = null,
            startPageX,
            startPageY,
            left = 25,
            top = 25,
            posX = 0,
            posY = 0,
            px = "px",
            zooms,
            offset = 1,
            aspectRadio;

        (function () {
            initThumbnail();
            initThumbnailCss();
            self.elmt = thumbnail;
        })();

        function initThumbnail() {
            $("#Thumbnail").remove();
            thumbnail = document.createElement("div");
            thumbnail.id = "Thumbnail";
            thumbnail.style.width = width + px;
            thumbnail.style.height = height + px;
            //thumbnail.style.top = top + px;
            //thumbnail.style.left = left + px;
            thumbnail.style.margin = left +px;

            if (Support.canvas) {
                cavView = document.createElement("canvas");
                cavView.id = "cavView";
                cavView.width = width;
                cavView.height = height;
                thumbnail.appendChild(cavView);

                cavViewImg = new Image();
                cavViewImg.src = url;
                cavViewImg.onload = function () {
                    self.refresh();
                    self.imgLoaded = true;
                };
            } else {
                imgView = document.createElement("img");
                imgView.id = "imgView";
                imgView.src = url;
                imgView.alt = "";
                thumbnail.appendChild(imgView);
            }

            hLine = document.createElement("div");
            hLine.id = "hLine";
            hLine.style.top = height / 2 + px;
            hLine.style.width = width + px;
            thumbnail.appendChild(hLine);

            vLine = document.createElement("div");
            vLine.id = "vLine";
            vLine.style.left = width / 2 + px;
            vLine.style.height = height + px;
            thumbnail.appendChild(vLine);

            viewRect = document.createElement("div");
            viewRect.id = "viewRect";
            viewRect.style.top = (height - 50) / 2 + px;
            viewRect.style.left = (width - 50) / 2 + px;

            var $viewRect = $(viewRect);

            if ($.support.touch) {
                $viewRect.bind("touchstart", vrTouchStart);
                $viewRect.bind("touchmove", vrTouchMove);
                $viewRect.bind("touchend", vrTouchEnd);
                $(thumbnail).bind("touchstart", thbTouchStart);
            } else {
                $viewRect.mousedown(vrMsDn);
                $viewRect.mouseup(vrMsUp);
                $viewRect.mouseleave(vrMsLv);
                $(thumbnail).mousedown(thbMsDn);
            }

            thumbnail.appendChild(viewRect);
        }

        function vrTouchStart(evt) {
            evt.stopPropagation();
            isTouchStart = true;

            var orEvt = evt.originalEvent;
            orEvt.preventDefault();

            startPageX = orEvt.targetTouches[0].pageX;
            startPageY = orEvt.targetTouches[0].pageY;
        }

        function vrTouchMove(evt) {
            evt.stopPropagation();
            var orEvt = evt.originalEvent;
            orEvt.preventDefault();

            if (isTouchStart && orEvt.targetTouches.length == 1) {
                var offsetX = startPageX - orEvt.targetTouches[0].pageX,
                    offsetY = startPageY - orEvt.targetTouches[0].pageY;

                startPageX = orEvt.targetTouches[0].pageX;
                startPageY = orEvt.targetTouches[0].pageY;

                viewRect.style.top = parseFloat(viewRect.style.top) - offsetY + px;
                viewRect.style.left = parseFloat(viewRect.style.left) - offsetX + px;

                hLine.style.top = parseFloat(hLine.style.top) - offsetY + px;
                vLine.style.left = parseFloat(vLine.style.left) - offsetX + px;

                if (self.onUserMove) {
                    var centerX = parseFloat(viewRect.style.left) + parseFloat(viewRect.clientWidth) / 2,
                        centerY = parseFloat(viewRect.style.top) + parseFloat(viewRect.clientHeight) / 2;

                    var viewWidth = centerX / (parseFloat(viewRect.style.width) * zooms),
                        viewHeight = centerY / (parseFloat(viewRect.style.width) * zooms);

                    self.onUserMove(viewWidth, viewHeight);
                }
            }
        }

        function vrTouchEnd(evt) {
            evt.stopPropagation();
            var orEvt = evt.originalEvent;
            orEvt.preventDefault();

            isTouchStart = false;
        }

        function thbTouchStart(evt) {
            var orEvt = evt.originalEvent;
            orEvt.preventDefault();

            startPageX = orEvt.targetTouches[0].pageX;
            startPageY = orEvt.targetTouches[0].pageY;

            hLine.style.top = parseFloat(startPageY - posY - offset) + px;
            vLine.style.left = parseFloat(startPageX - posX - offset) + px;

            viewRect.style.top =  parseFloat(startPageY - posY - parseFloat(viewRect.style.height) / 2 - offset) + px;
            viewRect.style.left = parseFloat(startPageX - posX - parseFloat(viewRect.style.height) / 2 - offset) + px;

            if (self.onUserMove) {
                var centerX = parseFloat(viewRect.style.left) + parseFloat(viewRect.style.width) / 2,
                    centerY = parseFloat(viewRect.style.top) + parseFloat(viewRect.style.height) / 2;

                var viewWidth = centerX / (parseFloat(viewRect.style.width) * zooms),
                    viewHeight = centerY / (parseFloat(viewRect.style.width) * zooms);

                self.onUserMove(viewWidth, viewHeight);
            }

            evt.stopPropagation();
            return false;
        }

        function vrMsDn(evt) {
            evt.stopPropagation();
            isTouchStart = true;

            startPageX = evt.pageX;
            startPageY = evt.pageY;

            $(viewRect).mousemove(vrMsMv);
            return false;
        }

        function vrMsMv(evt) {
            evt.stopPropagation();

            if (isTouchStart) {
                var pageX = evt.pageX,
                    pageY = evt.pageY;

                var offsetX = pageX - startPageX,
                    offsetY = pageY - startPageY;

                startPageX = pageX;
                startPageY = pageY;

                if (offsetX == 0 && offsetY == 0) {
                    return false;
                }

                viewRect.style.top = parseFloat(viewRect.style.top) + offsetY + px;
                viewRect.style.left = parseFloat(viewRect.style.left) + offsetX + px;

                hLine.style.top = parseFloat(hLine.style.top) + offsetY + px;
                vLine.style.left = parseFloat(vLine.style.left) + offsetX + px;

                if (self.onUserMove) {
                    var centerX = parseFloat(viewRect.style.left) + parseFloat(viewRect.style.width) / 2,
                        centerY = parseFloat(viewRect.style.top) + parseFloat(viewRect.style.height) / 2;

                    var viewWidth = centerX / (parseFloat(viewRect.style.width) * zooms),
                        viewHeight = centerY / (parseFloat(viewRect.style.width) * zooms);

                    self.onUserMove(viewWidth, viewHeight);
                }
            }
        }

        function vrMsUp() {
            isTouchStart = false;
            $(viewRect).mousemove(null);
            return false;
        }

        function vrMsLv() {
            isTouchStart = false;
            return false;
        }

        function thbMsDn(evt) {
            startPageX = evt.pageX;
            startPageY = evt.pageY;

            hLine.style.top = parseFloat(startPageY - posY - offset) + px;
            vLine.style.left = parseFloat(startPageX - posX - offset) + px;

            viewRect.style.top =  parseFloat(startPageY - posY - parseFloat(viewRect.style.height) / 2 - offset) + px;
            viewRect.style.left = parseFloat(startPageX - posX - parseFloat(viewRect.style.width) / 2 - offset) + px;

            if (self.onUserMove) {
                var centerX = parseFloat(viewRect.style.left) + parseFloat(viewRect.style.width) / 2,
                    centerY = parseFloat(viewRect.style.top) + parseFloat(viewRect.style.height) / 2;

                var viewWidth = centerX / (parseFloat(viewRect.style.width) * zooms),
                    viewHeight = centerY / (parseFloat(viewRect.style.width) * zooms);

                self.onUserMove(viewWidth, viewHeight);
            }

            evt.stopPropagation();
            return false;
        }

        function initThumbnailCss() {
            $(thumbnail).css({
                position: "relative",
                "z-index": "0",
                overflow: "hidden",
                border: "1px solid #319DCE"
            });

            $(cavView).css({
                "z-index": "0",
                position: "absolute"
            });

            $(imgView).css({
                "z-index": "0"
            });

            $(hLine).css({
                height: "1px",
                "line-height": "1px",
                position: "absolute",
                left: "0px",
                "background-color": "#FF0000",
                "z-index": "0"
            });

            $(vLine).css({
                width: "1px",
                "line-height": "1px",
                position: "absolute",
                top: "0px",
                "background-color": "#FF0000",
                "z-index": "0"
            });

            $(viewRect).css({
                border: "1px solid #FF0000",
                "background-color": "#FFFFFF",
                position: "absolute",
                width: "50px",
                height: "50px",
                cursor: "pointer",
                "z-index": "0",
                top: "0px",
                left: "0px",
                filter: "alpha(opacity=50)",
                opacity: "0.5"
            });
        }

        this.imgLoaded = false;

        this.onUserMove;

        this.isOnDragging = function () {
            return isTouchStart;
        };

        this.setVisibility = function (isShow) {
            if (isShow) {
                $(thumbnail).show();
            } else {
                $(thumbnail).hide();
            }
        };

        this.refresh = function () {
            var context = cavView.getContext("2d");
            context.clearRect(0, 0, width, height);
            context.drawImage(cavViewImg, 0, 0, width, height);
        };

        this.getCanvas = function () {
            return cavView;
        };

        this.UpdateViewRect = function (zoom, boundsX, boundsY, radio) {
            zooms = zoom;
            aspectRadio = radio;

            if (!isTouchStart) {
                var rWidth = width / zooms,
                    rHeight = rWidth / radio,
                    rTopX = width * boundsX,
                    rTopY = width * boundsY;

                viewRect.style.width = rWidth + px;
                viewRect.style.height = rHeight + px;
                viewRect.style.top = rTopY + px;
                viewRect.style.left = rTopX + px;

                hLine.style.top = rHeight / 2 + rTopY + px;
                vLine.style.left = rWidth / 2 + rTopX + px;
            }
        };

        this.UpdateThumbnailOrigin = function (x, y) {
            posX = x;
            posY = y;
        };

        this.setNavImg =function(navurl){
            cavViewImg.src = navurl;
            self.refresh();
        };
    };
})();

/**
 * Pathology - 1.0.0
 * @email v
 * @author 
 */

var Viewer = SL.Viewer;

(function () {
    Viewer = SL.Viewer = function (containerId, toolbarId, options) {
        SlideViewer.apply(this, [containerId]);

        var self = this,

            currentSlide = null,
            toolbar = null,
            canSave = false,

            touchPoint = null, // for touch event
            touchLen = 0,
            mouseMoveTimer = null, // for spin image
            currentZoom = 0, // for gesture event
            scale,
            currentIndex = 0,

            navMap = null,
            slideRuler = null;

        // Properties
        //mouseDragSwitchSlide = !options.isMulti;
        this.containerId = containerId;
        this.shapeCanvas = null;
        if (options.creatPv) {
            this.provider = new Provider();
        }

        this.isMobile = options.isMobile;
        this.isMulti = options.isMulti;
        this.isSave = options.isSave;
        this.thumbPos = options.thumbnailPos;


        // Constructor
        (function () {
            // 添加 open、animation 事件响应
            self.addEventListener("open", onOpen);
            self.addEventListener("resize", onResize);
            self.addEventListener("animation", onAnimation);

            // 添加触摸事件响应
            if ($.support.touch) {
                //self.setMouseNavEnabled(true);
                $("#" + containerId).bind({
                    "touchstart": touchStart,
                    "touchmove": touchMove,
                    "touchend": touchEnd,
                    "gesturestart": gestureStart,
                    "gesturechange": gestureChange
                });

            }

            // 初始化 UI 控件
            toolbar = new ViewToolbar(self, toolbarId);
            if (!options.toolbarEnable) {
                $('#' + toolbarId).hide();

            }


        })();

        // Private methods
        // Viewer event handling

        // 图像打开事件响应
        function onOpen() {
            // 添加触摸事件响应
            if ($.support.touch) {
                //self.setMouseNavEnabled(false);
            }

            currentZoom = self.viewport.getZoom(true);
            currentIndex = self.viewport.getSlide(true);

            initPermission();
            initShapeCanvas();
            if (!options.isMulti) {
                self.setSwitchSlide(false);
                initNavMap();
                initRuler();
                self.setBtnEnable(false);
            } else {
                self.setSwitchSlide(true);
            }

            if (!!options.openCb) {

                options.openCb(self);

            }

        }

        function initPermission() {
            if (self.provider) {
                self.provider.getPermission(function (permission, statusCode) {
                    if (ResultType.Success === statusCode) {
                        canSave = permission;

                        if (canSave === true) {
                            toolbar.annotation.setSaveBtn(canSave);
                        }
                    }
                });
            } else {
                toolbar.annotation.setSaveBtn(self.isSave);

            }
        }

        // 初始化标注画板
        function initShapeCanvas() {
            if (!self.shapeCanvas) {
                self.shapeCanvas = new ShapeCanvas(self);
                self.shapeCanvas.createShapeCanvas();
                self.shapeCanvas.onShapeDrawEnd = function () {
                    toolbar.annotation.resetAnnoBtns();

                    if (Config.autoShowAnnoDialog) {
                        //(new DialogEdit(self)).show();
                        toolbar.annotation.showAnnotationDialog();
                    }
                };
                self.shapeCanvas.onShapeChanged = function () {
                    if (canSave) {
                        toolbar.annotation.setSaveBtn(true);
                    }
                };
                self.shapeCanvas.setOpenSlide(currentSlide);

                // 初始加载标注
                if (Config.enableAnnotation && !currentSlide.hasAnnotations) {
                    self.shapeCanvas.clearShapeAry();

                    if (options.autoLoadAnnos === true) {
                        self.provider.getAnnotations(function (annos, statusCode) {
                            if (ResultType.Success === statusCode) {
                                self.loadAnnotations(annos);
                            }
                            currentSlide.hasAnnotations = true;
                        });
                    }
                } else {
                    //self.shapeCanvas.loadAnnotations(currentSlide.annotations);

                    if (options.autoLoadAnnos === true) {
                        if (currentSlide.annotations) {//.length > 0) {
                            self.shapeCanvas.loadAnnotations(currentSlide.annotations);
                            self.update();

                            //if (options.loadAnnosCallback &&
                            //    typeof options.loadAnnosCallback === "function") {
                            //    options.loadAnnosCallback(currentSlide.annotations);
                            //
                            //}
                        }

                    }
                }
            }
        }

        // 初始化缩略图
        function initNavMap() {
            if (currentSlide) {
                var width = 256, height = 256;

                if (currentSlide.width > currentSlide.height) {
                    height = Math.floor(width * currentSlide.height / currentSlide.width);
                } else {
                    width = Math.floor(height * currentSlide.width / currentSlide.height);
                }

                var url = options.thumbnailUrl;
                if (url == null) {
                    url = "/getThumbnail";
                }
                navMap = new NavigationView(url, width, height);
                navMap.onUserMove = function (width, height) {
                    if (self.viewport) {
                        self.viewport.panTo(new Point(width, height));
                    }
                };

                navMap.setVisibility(options.isNavmap);

                var SlideThumbPos = SlideControlAnchor.TOP_LEFT;
                switch(options.thumbnailPos)
                {
                    case 'TOP_LEFT':
                        SlideThumbPos = SlideControlAnchor.TOP_LEFT;
                        break;
                    case 'TOP_RIGHT':
                        SlideThumbPos = SlideControlAnchor.TOP_RIGHT;
                        break;
                    case 'BOTTOM_RIGHT':
                        SlideThumbPos = SlideControlAnchor.BOTTOM_RIGHT;
                        break;
                    case 'BOTTOM_LEFT':
                        SlideThumbPos = SlideControlAnchor.BOTTOM_LEFT;
                        break;
                    default:
                        SlideThumbPos = SlideControlAnchor.TOP_LEFT;
                }
                self.addControl(navMap.elmt, SlideThumbPos);
                onAnimation();

            }
        }

        //显示比例尺
        function initRuler() {


            slideRuler = self.shapeCanvas.showRuler();
            slideRuler.setVisibility(true);
            self.addControl(slideRuler.elmt, SlideControlAnchor.BOTTOM_RIGHT);
            onAnimation();
            self.shapeCanvas.showAnnotations(true);
            slideRuler.setRatioText();
        }

        // 显示图像容器尺寸改变事件
        function onResize() {
            if (options.resizeCallback &&
                typeof options.resizeCallback === "function") {
                options.resizeCallback();
            }
        }

        // 图像动画事件
        function onAnimation() {
            if (self.viewport) {
                var zoom = self.viewport.getZoom(true),
                    containerSize = self.viewport.getContainerSize(),
                    bounds = self.viewport.getBounds(),
                    aspectRatio = self.viewport.getAspectRatio();
                scale = containerSize.x * zoom / currentSlide.width;

                self.trigger("viewportchanged", {
                    viewportWidth: zoom,
                    containerSize: containerSize,
                    bounds: bounds,
                    aspectRatio: aspectRatio,
                    scale: scale
                });

                currentZoom = (scale * currentSlide.scanObjective).toFixed(2);
                currentIndex = self.viewport.getSlide(true);
            }

            if (navMap) {
                navMap.UpdateViewRect(self.viewport.getZoom(), bounds.x, bounds.y, aspectRatio);
                var position = Utils.getElementPosition(navMap.elmt);

                if (!navMap.isOnDragging()) {
                    navMap.UpdateThumbnailOrigin(position.x, position.y);
                }
            }
        }

        // Container touch event handling

        function touchStart(evt) {
            var orEvt = evt.originalEvent;
            touchPoint = new Point(orEvt.targetTouches[0].clientX,
                orEvt.targetTouches[0].clientY);

            if (self.viewport && orEvt.targetTouches.length == 2) {
                currentZoom = self.viewport.getZoom(true);

                var point1 = new Point(orEvt.targetTouches[0].clientX,
                    orEvt.targetTouches[0].clientY);
                var point2 = new Point(orEvt.targetTouches[1].clientX,
                    orEvt.targetTouches[1].clientY);

                touchLen = Utils.calcTwoPointDistance(point1, point2);
            }
        }

        function touchMove(evt) {
            var orEvt = evt.originalEvent;
            orEvt.preventDefault();

            var point = new Point(orEvt.targetTouches[0].clientX,
                    orEvt.targetTouches[0].clientY),
                offset = touchPoint.minus(point);
            touchPoint = point.times(1);

            if (self.viewport && orEvt.targetTouches.length === 1) {
                if (!self.isSwitchSlide()) {
                    var offsetPixel = self.viewport.deltaPointsFromPixels(offset, true);
                    self.viewport.panBy(offsetPixel);
                } else {
                    if (mouseMoveTimer) {
                        return;
                    }

                    mouseMoveTimer = window.setTimeout(function () {
                        mouseMoveTimer = null;

                        var direct = -(offset.x ? offset.x / Math.abs(offset.x) : 0),
                            deltaSlide = self.viewport.getSlide() + direct;

                        if (deltaSlide < 0) {
                            deltaSlide += currentSlide.number;
                        }

                        if (deltaSlide >= currentSlide.number) {
                            deltaSlide -= currentSlide.number;
                        }

                        self.viewport.slideTo(deltaSlide, true);
                        self.viewport.applyConstraints();
                    }, Slide.Config.drawSwitchPerTime);
                }
            }

            if (self.viewport && orEvt.targetTouches.length === 2) {
                var point1 = new Point(orEvt.targetTouches[0].clientX,
                    orEvt.targetTouches[0].clientY);
                var point2 = new Point(orEvt.targetTouches[1].clientX,
                    orEvt.targetTouches[1].clientY);

                var len = Utils.calcTwoPointDistance(point1, point2);
                var changeLen = len - touchLen;

                if (Math.abs(changeLen) < 20) {
                    var offsetPixel = self.viewport.deltaPointsFromPixels(offset, true);
                    self.viewport.panBy(offsetPixel);
                }
                else {
                    var touchScale = len / touchLen;
                    var zoom = currentZoom * touchScale;

                    if (self.viewport.getMinZoom() < zoom && zoom < self.viewport.getMaxZoom()) {
                        self.viewport.zoomTo(zoom);
                    }
                }
            }
        }

        function touchEnd(evt) {
        }

        function gestureStart(evt) {
            if (self.viewport) {
                currentZoom = self.viewport.getZoom(true);
            }
        }

        function gestureChange(evt) {
            var orEvt = evt.originalEvent;
            orEvt.preventDefault();

            if (evt.scale < 1.1) {
                var offsetPixel = self.viewport.deltaPointsFromPixels(offset, true);
                self.viewport.panBy(offsetPixel);
            }
        }

        // Initialize

        // 初始化权限


        // 根据图像 id 打开图形,并初始化
        function initSlide(id, callback) {
            if (self.provider) {

                self.provider.localhost = options.localhost;
                self.provider.slideUrl = options.slideUrl;
                self.provider.getAnnoUrl = options.getAnnoUrl;
                self.provider.updateAnnoUrl = options.updateAnnoUrl;
                self.provider.getPermissionUrl = options.getPermissionUrl;

                self.provider.openSlide(id, function (result, statusCode) {
                    if (ResultType.Success === statusCode) {
                        currentSlide = result;

                        if (options.isMulti) {
                            self.openSource(new Source(
                                options.localhost,
                                currentSlide.url,
                                currentSlide.width,
                                currentSlide.height,
                                currentSlide.sign,
                                currentSlide.deviceId,
                                currentSlide.priority,
                                currentSlide.number));
                        } else {
                            self.openSource(new TileSource(
                                options.localhost,
                                currentSlide.url,
                                currentSlide.width,
                                currentSlide.height,
                                currentSlide.number,
                                currentSlide.tileSize,
                                currentSlide.sign,
                                currentSlide.deviceId,
                                currentSlide.priority,
                                0));
                        }


                        if (typeof callback === "function") {
                            callback(currentSlide);
                        }
                    }
                });
            }
        }

        // Public methods

        /**
         * 是否为移动端
         * @function getDevice
         * @returns  {Boolean} true:是移动端
         */
        this.getDevice = function () {
            return self.isMobile;
        };

        /**
         * 获取画布
         * @function getShapeCanvas
         * @returns  {ShapeCanvas} 画布
         */
        this.getShapeCanvas = function () {
            return self.shapeCanvas
        };

        /**
         * 获取编辑权限
         * @function getCanSave
         * @returns  {Boolean} true：有编辑权限
         */
        this.getCanSave = function () {
            return (canSave & 2) > 0;
        };


        /**
         * 显示消息
         * @function showMessage
         * @param {String}          msg             - 消息内容
         * @param {Number}          delay           - 延时时间（可选）
         * @param {Number}          nleft           - 左边距（可选）
         * @param {Number}          ntop            - 上边距（可选）
         */
        this.showMessage = function (msg, delay, nleft, ntop) {
            if (delay == null) {
                delay = 1500;
            }

            var point, top, left;
            var $msg = $("<div class='ui-loader ui-overlay-shadow ui-body-e ui-corner-all'>" +
                "<h1 style='font-size: 2em'>" + msg + "</h1>" +
                "</div>");
            $msg.appendTo("body");

            if (self.viewport == null) {
                point = new Slide.Point($(window).width(), $(window).height());
            } else {
                point = self.viewport.getContainerSize();
            }

            if (nleft) {
                left = nleft + "px";
            } else {
                left = (point.x - $msg.width()) / 2 + "px";
            }

            if (ntop) {
                top = ntop + "px";
            } else {
                top = (point.y - $msg.height()) / 2 + "px";
            }


            $msg.css({
                top: top,
                left: left,
                filter: "alpha(opacity=90)",
                opacity: "0.9",
                position: "absolute",
                display: "block",
                "padding-left": "12px",
                "padding-right": "12px"
            });
            $msg.delay(delay).fadeOut(400, function () {
                $(this).remove();
            });
        };


        this.transAnnotations = function (shape) {
            var shapeAry = self.shapeCanvas.transAnnotations(shape);
            return shapeAry;
        };

        // Interface: 打开指定id的图像
        this.openSL = function (para, callback) {
            if (typeof para === "number") {
                initSlide(para, callback);
            } else if (para instanceof SlideInfo) {
                currentSlide = para;
                self.closeSL();
                if (para.number !== 1) {
                    self.openSource(new Source(
                        options.localhost,
                        currentSlide.url,
                        currentSlide.width,
                        currentSlide.height,
                        currentSlide.sign,
                        currentSlide.deviceId,
                        currentSlide.priority,
                        currentSlide.number));
                    options.isMulti = true;
                    options.isNavmap = false;
                    //self.isShowSwitchBtn = true ;
                    self.setNavmap(false);
                    self.setSwitchSlide(true);
                    self.setBtnEnable(true);
                    self.setNavMapImg(currentSlide.navmap);

                } else {
                    self.openSource(new TileSource(
                        options.localhost,
                        currentSlide.url,
                        currentSlide.width,
                        currentSlide.height,
                        currentSlide.number,
                        currentSlide.tileSize,
                        currentSlide.sign,
                        currentSlide.deviceId,
                        currentSlide.priority,
                        0));
                    options.isMulti = false;
                    options.isNavmap = options.isNavmap;
                    self.setNavmap(true);
                    self.setSwitchSlide(false);
                    self.setBtnEnable(false);
                    self.setNavMapImg(currentSlide.navmap);
                }

                if (typeof callback === "function") {
                    callback(currentSlide);
                }
            } else {
                SlideDebug.error("Open slide failed: id is not current!");
            }
        };

        // Interface: 关闭打开的图像并清空标注数组
        this.closeSL = function (callback) {
            self.close();
            if (self.shapeCanvas) {
                self.shapeCanvas.clearShapeAry();
                self.shapeCanvas = null;
            }


            if (toolbar) {
                toolbar.resetToolbar();
            }

            if (callback && typeof callback === "function") {
                callback();
            }
        };

        // Interface: 获取当前切片
        this.getCurrentSL = function () {
            return currentSlide;
        };

        // Interface and for Shape Canvas: 获取当前的放大倍数
        this.getScale = function () {
            return currentZoom;
        };

        this.getScaleP = function () {
            return scale;
        };

        // Interface and for Shape Canvas: 获取当前的图像的索引序号
        this.getIndex = function () {
            return currentIndex;
        };

        // Interface: 获取当前图像的位置
        this.getCenter = function () {
            if (self.isOpen()) {
                return self.viewport.getCenter();
            }
        };

        // Interface: 当前图像的标注是否改动过
        this.isShapeChanged = function () {
            if (self.shapeCanvas && typeof self.shapeCanvas.isShapeChanged) {
                return self.shapeCanvas.isShapeChanged;
            }

            return false;
        };

        // Toolbar use And UI

        // for grid and ruler change update
        this.update = function () {
            if (self.shapeCanvas !== null) {
                self.shapeCanvas.clearShapeCanvas(true);
                self.shapeCanvas.showAnnotations(true);
                if (navMap) {
                    navMap.refresh();
                }
            }
        };

        // 保存标注
        this.saveAnnotations = function (callback) {
            if (options.autoSaveAnnosBySaveBtn) {
                if (canSave === true && self.provider !== null) {
                    self.shapeCanvas.getAnnotations(function (annotations) {
                        self.provider.updateAnnotations(currentSlide, annotations, function (statusCode) {
                            if (ResultType.Success === statusCode) {
                                alert(Strings.getString("Messages.SaveAnnotationSuccess"));
                            } else {
                                alert(Strings.getString("Messages.SaveAnnotationFailed"));
                            }

                            // 保存成功后重新载入标注
                            if (Config.enableAnnotation && !currentSlide.hasAnnotations) {
                                self.shapeCanvas.clearShapeAry();

                                if (options.autoLoadAnnos === true) {
                                    self.provider.getAnnotations(function (annos, statusCode) {
                                        if (ResultType.Success === statusCode) {
                                            self.loadAnnotations(annos);
                                        }
                                    });
                                }
                            } else {
                                self.shapeCanvas.loadAnnotations(currentSlide.annotations);
                            }

                            if (callback && typeof callback === "function") {
                                callback(annotations);
                            }

                            if (options.saveAnnosCallback &&
                                typeof options.saveAnnosCallback === "function") {
                                options.saveAnnosCallback(annotations);
                            }
                        });
                    });
                }
            } else {
                self.shapeCanvas.getAnnotations(
                    function (annotations) {
                        if (options.saveAnnosCallback &&
                            typeof options.saveAnnosCallback === "function") {
                            options.saveAnnosCallback(annotations, callback);
                            function callback(n, anno) {
                                currentSlide.annotations = anno;
                                if (n) {
                                    self.showMessage(Strings.getString("Messages.SaveAnnotationSuccess"));
                                } else {
                                    self.showMessage(Strings.getString("Messages.SaveAnnotationFailed"));
                                }
                            }
                        }
                    });
            }
        };

        // Interface: 获取所有标注
        this.getAnnotations = function (callback) {
            if (typeof callback === "function") {
                return self.shapeCanvas.getAnnotations(function (annotations) {
                    callback(annotations);

                });
            } else {
                return;
            }


        };

        // Interface: 载入标注
        this.loadAnnotations = function (annotations) {
            if (annotations) {//.length > 0) {
                self.shapeCanvas.loadAnnotations(annotations);
                self.update();
                if (options.loadAnnosCallback &&
                    typeof options.loadAnnosCallback === "function") {
                    options.loadAnnosCallback(annotations);

                }
            }
        };

        // Interface: 重新载入标注
        this.reloadAnnotations = function () {
            self.shapeCanvas.reloadAnnotations();
        };

        // Interface: 清空画板
        this.clearShapeCanvas = function () {
            self.shapeCanvas.clearShapeAry();
        };

        // Interface: 删除选中的标注
        this.deleteAnnotation = function () {
            if (self.shapeCanvas != null) {
                self.shapeCanvas.deleteAnnotation(options.delAnnoCallback);
            }
        };

        // Interface: 定位某个标注或者某张图的某个位置
        this.linkTo = function (args) {
            self.shapeCanvas.linkTo(args);
        };

        // Interface: 手动改变装口尺寸
        this.resize = function (callback) {
            toolbar.resize();
        };

        // Interface: 设置显示隐藏工具条
        this.setTbEnabled = function (enable) {
            var $containerId = $("#" + containerId);
            if (!!toolbar) {
                if (!!enable) {
                    $containerId.css({
                        'height': $containerId.height() - 30
                    });
                    toolbar.show();
                } else {
                    $containerId.css({
                        'height': '100%'
                    });
                    toolbar.hide();
                }
            }
        };

        // Interface: 工具条是否显示
        this.isTbEnabled = function () {
            return !options.toolbarEnable ? false : toolbar.isShow();
        };

        // Interface: 设置鼠标和触摸禁用
        this.setMsAndThEnable = function (enable) {
            self.setMouseNavEnabled(enable);
        };

        // Interface: 鼠标和触摸是否禁用
        this.isMsAndThEnable = function () {

            return self.isMouseNavEnabled();
        };


        // Interface: 根据是否有保存标注权限设置保存按钮
        this.setSvBtnEnable = function (enable) {
            if (options.autoSaveAnnosBySaveBtn) {
                if (typeof enable === "boolean" && enable === true) {
                    if (canSave) {
                        toolbar.annotation.setSaveBtn(enable);
                    }
                } else {
                    toolbar.annotation.setSaveBtn(false);
                }
            } else {
                toolbar.annotation.setSaveBtn(enable);
            }
        };

        // Interface: 根据是否有保存标注权限
        this.isSvBtnEnable = function () {
            return toolbar.annotation.isSvBtnEnable();
        };

        // Interface: 设置全屏(全页面)
        this.fullPage = function (enable) {
            if (this.isOpen() && this.viewport) {
                this.setFullPage(!!enable);
            }
        };

        // Interface: 回到最初状态
        this.goHome = function () {
            if (this.isOpen() && this.viewport) {
                this.viewport.goHome();
            }
        };

        // Initialize parameter

        // 设置参数
        //this.setParameter = function (options) {
        //    Extend(self.Parameters, options);
        //
        //    if (self.provider !== null) {
        //        self.provider.localhost = self.Parameters.localhost;
        //        self.provider.slideUrl = self.Parameters.slideUrl;
        //        self.provider.getAnnoUrl = self.Parameters.getAnnoUrl;
        //        self.provider.updateAnnoUrl = self.Parameters.updateAnnoUrl;
        //        self.provider.getPermissionUrl = self.Parameters.getPermissionUrl;
        //    }
        //};

        //切换到指定倍数
        //this.zoomToObj = function (zoomCnt) {
        //    self.viewport.zoomTo(zoomCnt);
        //};
        this.zoomToObj = function (zoomCnt) {
            var containnerSize = self.viewport.getContainerSize(),
                zoom = (zoomCnt / currentSlide.scanObjective * currentSlide.width) / containnerSize.x;
            self.viewport.zoomTo(zoom);
        };

        this.setAnnoType = function (type) {

            switch (type) {
                case "hand":
                    self.shapeCanvas.setSelectedEnable(false);
                    break;
                case "select":
                    self.shapeCanvas.setSelectedEnable(true);
                    break;
                default:
                    SlideUtils.setMouseCursor(self.shapeCanvas.getContainer(),
                        [SlideConfig.imagePath, "pen_rm", ".cur"].join(""));
                    self.shapeCanvas.setDrawType(type);
            }
        };

        this.setEdit = function () {
            if (self.shapeCanvas != null && self.shapeCanvas.isSelectedEnable &&
                self.shapeCanvas.getActiveShape() !== null) {
                (new DialogEdit(self)).show();
            }
        };

        this.zoomIn = function () {
            var factor = Math.pow(Slide.Config.zoomPerScroll, 1);
            self.viewport.zoomBy(factor);
            self.viewport.applyConstraints();
        };

        this.zoomOut = function () {
            var factor = Math.pow(Slide.Config.zoomPerScroll, -1);
            self.viewport.zoomBy(factor);
            self.viewport.applyConstraints();
        };

        this.setNavmap = function (para) {
            if (navMap) {
                navMap.setVisibility(para);
            }
        };

        this.setNavMapImg = function (url) {

            options.thumbnailUrl = url;
            //navMap.setNavImg(url);


        };
    };
})();


/**
 * Pathology - 1.0.0
 * @email v
 * @author 
 */

var CreatViewer = SL.CreateViewer;
(function () {
    CreatViewer = SL.CreateViewer = function (viewerJson) {
        var defaults = Extend(true, {}, {
            creatPv: true,
            isMulti: true,
            containerId: "",
            imageId: null,
            toolbarEnable: true,
            isSave: false,
            // Provide
            localhost: "",
            slideUrl: "/GetSlide",
            getAnnoUrl: "/GetAnnotations",
            updateAnnoUrl: "/UpdateAnnotations",
            getPermissionUrl: "/GetPermission",

            openCb: null,
            resizeCallback: null,

            autoLoadAnnos: true,
            loadAnnosCallback: null,

            autoSaveAnnosBySaveBtn: true,
            saveAnnosCallback: null,

            delAnnoCallback: null,

            // Config
            language: "auto",
            debugMode: true,

            enableAnnotation: true,
            autoShowAnnoDialog: false,

            //缩略图
            isNavmap:true,
            thumbnailUrl:"/getThumbnail",
            thumbnailPos:"TOP_LEFT",

            //移动端
            isMobile:false,

            showOption: true,
            exitConfirm: false,

            finishCallback:null

            //createPV: true
        }, viewerJson);
        var container = document.getElementById(defaults.containerId)|| document.body;
        var toolbarDiv = document.createElement("div");
        var viewerDiv = document.createElement("div");

        toolbarDiv.id = defaults.containerId + "_toolbar";
        viewerDiv.id = defaults.containerId + "_viewer";
        container.appendChild(toolbarDiv);
        container.appendChild(viewerDiv);

        // 初始化参数配置
        Config.language = defaults.language;
        Config.debugMode = defaults.debugMode;
        Config.enableAnnotation = defaults.enableAnnotation;
        Config.autoShowAnnoDialog = defaults.autoShowAnnoDialog;
        Config.showOption = defaults.showOption;
        // Events
        $(container).bind({
            "contextmenu": stopDefaults,
            "dragstart": stopDefaults,
            "beforecopy": stopDefaults,
            "selectstart": stopDefaults
        });




        // 初始化 viewer
        var slideviewer = new Viewer(viewerDiv.id, toolbarDiv.id,defaults);

        if (defaults.imageId !== null) {
            slideviewer.openSL(defaults.imageId);  // 打开图像
        }

        $(window).resize(resizeViewer).on("beforeunload", beforeUnload);

        resizeViewer();

        return slideviewer;



        function resizeViewer() {
            $(viewerDiv).height($(container).height() - 30);

            if (!!slideviewer && typeof slideviewer.isTbEnabled === 'function' &&
                !slideviewer.isTbEnabled()) {
                $(viewerDiv).height($(viewerDiv).height() + 30);
            }
        }

        function stopDefaults(evt) {
            return false;
        }

        function beforeUnload(evt) {
            if (defaults.exitConfirm &&
                slideviewer.isShapeChanged() && slideviewer.isSvBtnEnable()) {
                evt = evt || window.event;
                evt.returnValue = Strings.getString("Messages.ExitConfirm");
                return Strings.getString("Messages.ExitConfirm");
            }
        }



    }
})();
