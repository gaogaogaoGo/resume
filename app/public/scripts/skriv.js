/*!
 * project name: SlideStudio
 * name:         core.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/17
 */

'use strict';

window.skriv = (function () {
  return {
    actions: {},
    create: function (container, options) {
      if (typeof container !== "object") {
        throw "A container element must be specified.";
      }

      options =  skriv.util.extend({
        autoBind : false
      }, options);

      function init() {
        //containerClk     = containerClk.bind(this);
        //containerFocus   = containerFocus.bind(this);
        //containerBlur    = containerBlur.bind(this);
        //containerMouseUp = containerMouseUp.bind(this);
        //containerKeyUp   = containerKeyUp.bind(this);
        //documentKeyDown  = documentKeyDown.bind(this);

        skrivEnable();
        configure();
        bind();

        container.classList.add('loaded');
        container.classList.add('disabled');

        container.addEventListener('click', containerClk, false);
      }

      function skrivEnable() {
        var div = document.createElement('div');

        div.setAttribute('contenteditable', true);
        div.style.className = 'skriv-enabler';
        div.style.position  = 'absolute';
        div.style.display   = 'none';
        div.style.width     = '0px';
        div.style.height    = '0px';

        document.body.appendChild(div);
      }

      function configure(opts) {
        options = skriv.util.extend(options, opts);

        initCommands();

        if (options.autoBind) {
          autoBindTimer = setInterval(bind, 500);
        } else {
          clearInterval(autoBindTimer);
        }
      }

      function initCommands() {
        var liAry = [].slice.call(container.querySelectorAll('li'));

        liAry.forEach(function (li) {
          if (li.childNodes.length === 0) {
            li.parentNode.removeChild(li);

            var attrsObj = {},
              attrs = Array.prototype.slice.call(li.attributes);

            attrs.forEach(function (attr) {
              if (/^data\-/gi.test(attr.name)) {
                attrsObj[attr.name.replace(/^data\-/gi, "")] = attr.value;
              }
            });

            attrsObj.tags = [];

            if (typeof attrsObj.tags === "string") {
              attrsObj.tags = attrsObj.tags.split(',');
            }

            attrsObj.keys = [];

            if (typeof attrsObj.keys === "string") {
              attrsObj.keys = attrsObj.keys.split(',');
            }

            if (typeof attrsObj.model === "string" &&
              /\./g.test(attrsObj.model)) {
              var win = window;

              for (var model = attrsObj.model.split('.'); model.length > 0;) {
                win = win[model.shift()];
              }

              attrsObj.model = win;
            }

            var command = null;

            if (attrsObj.command) {
              command = new skriv.actions.command(skrivObj, attrsObj);
              command.appendTo(container);
              commands.push(command);
            } else if (attrsObj.model) {
              command = new attrsObj.model(skrivObj, attrsObj);
              command.appendTo(container);
              commands.push(command);
            } else if (attrsObj.id === 'divider') {
              var div = document.createElement('div');

              div.className = 'divider';
              container.appendChild(div);

              if (attrsObj.name) {
                div.classList.add(attrsObj.name);
              }
            } else if (console && typeof console.warn === "function") {
              console.warn('Action of type "' + attrsObj.id +
                '" could not be created.');
            }
          }
        });
        //}).bind(this));
      }

      function appendTo(parent) {
        parent.appendChild(container);
      }

      function notify(container, options) {
        notified.dispatch(container, options);
      }

      function bind(element) {
        var elements = [];

        if (element) {
          elements = [element];
        } else {
          elements =
            Array.prototype.slice.call(document.querySelectorAll('[contenteditable]'));
        }

        elements.forEach(function (element) {
          element.addEventListener("focus", containerFocus, false);
          element.addEventListener("blur", containerBlur, false);
          element.addEventListener("mouseup", containerMouseUp, false);
          element.addEventListener("keyup", containerKeyUp, false);
        });
      }

      function unbind(element) {
        var elements = [];

        if (element) {
          elements = [element];
        } else {
          elements =
            Array.prototype.slice.call(document.querySelectorAll('[contenteditable]'));
        }

        elements.forEach(function (element) {
          element.removeEventListener("focus", containerFocus, false);
          element.removeEventListener("blur", containerBlur, false);
          element.removeEventListener("mouseup", containerMouseUp, false);
          element.removeEventListener("keyup", containerKeyUp, false);
        });
      }

      function closeActions() {
        commands.forEach(function (command) {
          if (typeof command.isOpen === "function" && command.isOpen()) {
            command.close();
          }
        });
      }

      function setEditor(edr) {
        targetEditor = edr;
        editor = edr;
      }

      function getEditor() {
        return targetEditor;
      }

      function getAction(id) {
        var action = null;

        commands.forEach(function (command) {
          if (command.id === id) {
            action = command;
          }
        });

        return action;
      }

      function getOpenAction() {
        var openAction = null;

        commands.forEach(function (command) {
          if (typeof command.isOpen === "function" && command.isOpen()) {
            openAction = command;
          }
        });

        return openAction;
      }

      function containerClk() {
        evtResponse();
      }

      function containerFocus(evt) {
        targetEditor = evt.target;

        removeDisabledClass();
        document.addEventListener('keydown', documentKeyDown, false);
      }

      function removeDisabledClass() {
        container.classList.remove('disabled');
      }

      function containerBlur() {
        evtResponse(null);
        document.removeEventListener('keydown', documentKeyDown, false);
      }

      function containerMouseUp() {
        evtResponse();
      }

      function containerKeyUp() {
        evtResponse();
      }

      function documentKeyDown(evt) {
        commands.forEach(function (command) {
          if ((evt.metaKey || evt.ctrlKey) &&
            command.updateKeyDown(evt.keyCode)) {
            evt.preventDefault();
          }
        });
      }

      function evtResponse(selectedElement) {
        if (typeof selectedElement === "undefined") {
          selectedElement = skriv.util.getSelectedElement();
        }

        if (selectedElement) {
          var nodesName = [];

          for (var element = selectedElement; element; ) {
            nodesName.push(element.nodeName.toLowerCase());
            element = element.parentNode;
          }

          commands.forEach(function (command) {
            command.updateSelection(selectedElement, nodesName);
          });
        } else {
          commands.forEach(function (command) {
            command.deselect();
          });
        }
      }

      var targetEditor = null,
        editor = null,
        commands = [],
        autoBindTimer = -1,
        notified = new skriv.Signal(),
        skrivObj = {
          configure :     configure,
          appendTo :      appendTo,
          notify :        notify,
          bind :          bind,
          unbind :        unbind,
          closeActions :  closeActions,
          setEditor :     setEditor,
          getEditor :     getEditor,
          getAction :     getAction,
          getOpenAction : getOpenAction,
          notified :      notified
        };

      init();

      return skrivObj;
    }
  };
})();


/*!
 * project name: SlideStudio
 * name:         util.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/17
 */

'use strict';

skriv.util = {
  expressions : {
    IS_YOUTUBE_URL : /(?:www\.)?youtu(?:be\.com\/watch\?(?:.*?&(?:amp;)?)?v=|\.be\/)([\w\-]+)(?:&(?:amp;)?[\w\?=]*)?/gi,
    IS_VIMEO_URL : /(www\.)?vimeo\.com\/(\w*\/)*(([a-z]{0,2}-)?\d+)/gi,
    YOUTUBE_VIDEO_ID : /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/,
    VIMEO_VIDEO_ID : /^.*(vimeo\.com\/)((channels\/[A-z]+\/)|(groups\/[A-z]+\/videos\/))?([0-9]+)/
  },
  getYouTubeID : function (url) {
    if (skriv.util.expressions.IS_YOUTUBE_URL.test(url)) {
      var query = url.match(skriv.util.expressions.YOUTUBE_VIDEO_ID);

      if (query && query.length > 2) {
        return query[2];
      }
    }
  },
  getVimeoID : function (url) {
    if (skriv.util.expressions.IS_VIMEO_URL.test(url)) {
      var query = url.match(skriv.util.expressions.VIMEO_VIDEO_ID);

      if (query && query.length > 4) {
        return query[5];
      }
    }
  },
  extend : function (extendObj, obj) {
    for (var property in obj) {
      extendObj[property] = obj[property];
    }

    return extendObj;
  },
  wrap : function (child, parent) {
    if (parent && child) {
      child.parentNode.appendChild(parent);
      parent.appendChild(child);
    }
  },
  wrapInner : function (parent, child) {
    if (child && parent) {
      child.innerHTML = parent.innerText || parent.textContent;
      parent.innerHTML = '';
      parent.appendChild(child);
    }
  },
  unwrap : function (rmElement) {
    if (rmElement && rmElement.childNodes.length && rmElement.parentNode) {
      for (; rmElement.childNodes.length; ) {
        rmElement.parentNode.insertBefore(rmElement.childNodes[0], rmElement);
      }

      rmElement.parentNode.removeChild(rmElement);
    }
  },
  execCommand : function (aCommandName, aShowDefaultUI, aValueArgument) {
    try {
      document.execCommand(aCommandName, false, aValueArgument);
    } catch (err) {}
  },
  placeCaretAtEnd : function (element) {
    element.focus();

    if (typeof window.getSelection !== "undefined" &&
      typeof document.createRange !== "undefined") {
      var range = document.createRange();

      range.selectNodeContents(element);
      range.collapse(false);

      var selection = window.getSelection();

      selection.removeAllRanges();
      selection.addRange(range);
    } else if (typeof document.body.createTextRange !== "undefined") {
      var textRange = document.body.createTextRange();

      textRange.moveToElementText(element);
      textRange.collapse(false);
      textRange.select();
    }
  },
  selectText : function (element) {
    var textRange, selection;

    if (document.body.createTextRange) {
      textRange = document.body.createTextRange();
      textRange.moveToElementText(element);
      textRange.select();
    } else if (window.getSelection) {
      selection = window.getSelection();

      textRange = document.createRange();
      textRange.selectNodeContents(element);

      selection.removeAllRanges();
      selection.addRange(textRange);
    }
  },
  getSelectedElement : function () {
    var selection = window.getSelection();

    if (selection && selection.anchorNode) {
      return selection.anchorNode.parentNode;
    } else {
      return null;
    }
  },
  getSelectedHTML : function () {
    var range;

    if (document.selection && document.selection.createRange) {
      range = document.selection.createRange();
      return range.htmlText;
    }

    if (window.getSelection) {
      var selection = window.getSelection();

      if (selection.rangeCount > 0) {
        range = selection.getRangeAt(0);

        var content = range.cloneContents(),
          div = document.createElement('div');

        div.appendChild(content);

        return div.innerHTML;
      }

      return '';
    }

    return '';
  },
  getParentOfType : function (element, nodeName) {
    var parent = null;

    for (; element && element.parentNode; ) {
      if (element.nodeName.toLowerCase() === nodeName.toLowerCase()) {
        parent = element;
      }

      element = element.parentNode;
    }

    return parent;
  }
};


/*!
 * project name: SlideStudio
 * name:         signal.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/17
 */

'use strict';

skriv.Signal = function () {
  this.listeners = [];
};

skriv.Signal.prototype.add = function (action) {
  this.listeners.push(action);
};

skriv.Signal.prototype.remove = function (action) {
  var index = this.listeners.indexOf(action);

  if (index >= 0) {
    this.listeners.splice(index, 1);
  }
};

skriv.Signal.prototype.dispatch = function () {
  var args = Array.prototype.slice.call(arguments);

  this.listeners.forEach(function (action) {
    action.apply(null, args);
  });
};


/*!
 * project name: SlideStudio
 * name:         actions.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/17
 */

'use strict';

skriv.actions.abstract = Class.extend({
  init: function (core, config) {
    this.core    = core;
    this.config  = config || {};
    this.id      = this.config.id;
    this.tags    = this.config.tags || [];
    this.keys    = this.config.keys || [];
    this.clicked = new skriv.Signal();

    this.build();
    this.bind();
  },
  build: function () {
    this.domElement = document.createElement("div");
    this.domElement.classList.add("action");
    this.domElement.classList.add(this.id);

    if (this.config.name) {
      this.domElement.classList.add(this.config.name);
    }

    this.buttonElement = document.createElement("button");
    this.domElement.appendChild(this.buttonElement);
    this.iconElement = document.createElement("span");
    this.iconElement.className = "icon " + this.id;
    this.buttonElement.appendChild(this.iconElement);
  },
  bind: function () {
    this.buttonElement.addEventListener("mousedown", this.onMouseDown.bind(this));
    this.buttonElement.addEventListener("click", this.onClick.bind(this));
  },
  trigger: function () {},
  appendTo: function (parent) {
    parent.appendChild(this.domElement);
  },
  hasTag: function (tagName) {
    var have = false, tTags = this.tags;

    if (typeof e === "string") {
      tagName = [tagName];
    }

    tagName.forEach(function (tag) {
      tTags.forEach(function (tTag) {
        if (tag === tTag) {
          have = true;
        }
      });
    });

    return have;
  },
  select: function () {
    this.domElement.classList.add("selected");
  },
  deselect: function () {
    this.domElement.classList.remove("selected");
  },
  updateSelection: function (element, tag) {
    if (this.hasTag(tag)) {
      this.select();
    } else {
      this.deselect();
    }
  },
  updateKeyDown: function (keyCode) {
    for (var t = 0; t < this.keys.length; t += 1) {
      if (parseInt(this.keys[t], 10) === keyCode) {

        if (typeof this.open === "function") {
          this.open();
        } else {
          this.trigger();
        }

        return true;
      }
    }

    return false;
  },
  onMouseDown: function (evt) {
    evt.preventDefault();
  },
  onClick: function () {
    this.clicked.dispatch();
  }
});

skriv.actions.command = skriv.actions.abstract.extend({
  init : function (core, config) {
    this._super(core, config);

    this.command = config.command;
  },
  trigger : function () {
    skriv.util.execCommand(this.command, false);
  },
  onClick : function (evt) {
    this._super(evt);

    this.trigger();
  }
});

skriv.actions.popout = skriv.actions.abstract.extend({
  init : function (core, config) {
    this._super(core, config);

    this.onDocumentMouseDown = this.onDocumentMouseDown.bind(this);
  },
  build : function () {
    this._super();

    this.panelElement = document.createElement("div");
    this.panelElement.classList.add("panel");
    this.domElement.appendChild(this.panelElement);
  },
  bind : function () {
    this._super();

    this.domElement
      .addEventListener("mousedown", this.onMouseDown.bind(this), false);
    this.domElement
      .addEventListener("mouseover", this.onMouseOver.bind(this), false);
    this.domElement
      .addEventListener("mouseout", this.onMouseOut.bind(this), false);
  },
  open : function () {
    if (!this.isOpen()) {
      this.domElement.classList.add("open");
      document.addEventListener("mousedown", this.onDocumentMouseDown, false);

      this.layout();
    }
  },
  close : function () {
    if (this.isOpen()) {
      this.domElement.classList.remove("open");
      document.removeEventListener(
        "mousedown", this.onDocumentMouseDown, false);
    }
  },
  toggle : function () {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  },
  isOpen : function () {
    return this.domElement.classList.contains("open");
  },
  layout : function () {
    var panelW = this.panelElement.offsetWidth,
      btnW = this.buttonElement.offsetWidth,
      btnH = this.buttonElement.offsetHeight;

    this.panelElement.style.left = (btnW - panelW) / 2 + "px";
    this.panelElement.style.top  = btnH + "px";
  },
  onClick : function (evt) {
    this._super(evt);

    this.toggle();
  },
  onDocumentMouseDown : function (evt) {
    var isClose = false;

    for (var target = evt.target; target; ) {
      if (target === this.domElement) {
        isClose = true;
      }

      target = target.parentNode;
    }

    if (!isClose) {
      this.close();
    }
  },
  onMouseDown : function (evt) {
    evt.preventDefault();
  },
  onMouseOver : function () {
    if (this.config.openOnHover) {
      this.open();
    }
  },
  onMouseOut : function () {
    if (this.config.openOnHover) {
      this.close();
    }
  }
});

skriv.actions.dropdown = skriv.actions.popout.extend({
  init : function (core, config) {
    this.options = this.options || [];

    this._super(core, config);

    if (this.options && this.options.length > 0) {
      this.setValue(this.options[0].value);
    }
  },
  build : function () {
    this._super();

    this.domElement.style.width = '100px';
    this.panelElement.style.width = '140px';
    this.dropdownElement = document.createElement('ul');
    this.panelElement.appendChild(this.dropdownElement);
    this.panelElement.classList.add('dropdown');
    this.options.forEach(this.addOption.bind(this));
  },
  addOption : function (options) {
    var li = document.createElement("li");

    li.setAttribute("data-value", options.value);
    li.textContent = options.name;

    this.bindOption(li, options);
    this.dropdownElement.appendChild(li);
  },
  bindOption : function (element, options) {
    element.addEventListener('click', (function (evt) {
      this.setValue(evt);
      this.close();
    }).bind(this, options.value), false);
  },
  populate : function (options) {
    this.dropdownElement.innerHTML = '';
    this.options = options;
    this.options.forEach(this.addOption.bind(this));
  },
  cancel : function () {},
  setValue : function (val, isTrigger) {
    if (this.hasValue(val)) {
      this.selectedElement =
        this.dropdownElement.querySelector('[data-value="' + val + '"]');

      if (!this.config.leaveHeader) {
        this.buttonElement.textContent = this.selectedElement.textContent;
      }

      if (!isTrigger) {
        this.trigger();
      }
    }
  },
  getValue : function () {
    if (this.selectedElement) {
      return this.selectedElement.getAttribute("data-value");
    } else {
      return null;
    }
  },
  hasValue : function (val) {
    return !!this.dropdownElement.querySelector('[data-value="' + val + '"]');
  }
});

skriv.actions.align = skriv.actions.dropdown.extend({
  init : function (core, config) {
    config.openOnHover = true;

    this.options = [{
        name : 'Left',
        value : 'justifyleft'
      }, {
        name : 'Center',
        value : 'justifycenter'
      }, {
        name : 'Right',
        value : 'justifyright'
      }, {
        name : 'Justify',
        value : 'justifyfull'
      }];

    this._super(core, config);
  },
  build : function () {
    this._super();

    this.domElement.style.width = '50px';
    this.panelElement.style.width = '152px';
    this.panelElement.classList.add('single-row');
  },
  addOption : function (option) {
    var li = document.createElement('li');

    li.setAttribute('data-value', option.value);
    this.bindOption(li, option);

    var div = document.createElement('div');

    div.className = 'icon ' + option.value;
    li.appendChild(div);
    this.dropdownElement.appendChild(li);
  },
  trigger : function () {
    var val = this.getValue();
    skriv.util.execCommand(val, false);
  },
  setValue : function (val, isTrigger) {
    if (this.hasValue(val)) {
      this.selectedElement =
        this.dropdownElement.querySelector('[data-value="' + val + '"]');

      if (!isTrigger) {
        this.trigger();
      }
    }
  }
});

skriv.actions.link = skriv.actions.popout.extend({
  init : function (core, config) {
    this._super(core, config);
  },
  build : function () {
    this._super();

    this.domElement.classList.add(this.id);
    this.linkInput = document.createElement("input");
    this.linkInput.setAttribute("type", "text");
    this.linkInput.setAttribute("placeholder", "http://");
    this.panelElement.appendChild(this.linkInput);
    this.confirmButton = document.createElement("button");
    this.confirmButton.classList.add("confirm-button");
    this.confirmButton.innerHTML = "OK";
    this.panelElement.appendChild(this.confirmButton);
    this.cancelButton = document.createElement("button");
    this.cancelButton.classList.add("cancel-button");
    this.cancelButton.innerHTML = "Cancel";
    this.panelElement.appendChild(this.cancelButton);
    this.panelElement.style.width = "340px";
  },
  bind : function () {
    this._super();

    this.confirmButton
      .addEventListener("click", this.onConfirmClicked.bind(this), false);
    this.cancelButton
      .addEventListener("click", this.onCancelClicked.bind(this), false);
    this.linkInput
      .addEventListener("keydown", this.onKeyDown.bind(this), false);
  },
  trigger : function () {
    if (this.linkElement) {
      this.linkElement.setAttribute('href', this.linkInput.value);
      this.linkElement = null;
    }
  },
  open : function () {
    var element =
      skriv.util
        .getParentOfType(skriv.util.getSelectedElement(), "a");

    if (element || skriv.util.getSelectedHTML().length) {
      this._super();

      this.linkInput.value = "";

      if (element) {
        this.linkElement = element;
        this.linkInput.value = this.linkElement.getAttribute("href");
      } else {
        skriv.util.execCommand(
          "createLink", false, skriv.actions.link.PLACEHOLDER);
        this.linkElement =
          document.querySelector('a[href="' +
            skriv.actions.link.PLACEHOLDER + '"]');
      }

      this.linkInput.focus();
      this.linkInput.select();
    } else {
      this.core.notify("Please select some text first");
    }
  },
  close : function () {
    this._super();

    if (this.linkElement &&
      this.linkElement.getAttribute('href') ===
        skriv.actions.link.PLACEHOLDER) {
      skriv.util.unwrap(this.linkElement);
    }
  },
  onClick : function (evt) {
    this._super(evt);
  },
  onConfirmClicked : function () {
    if (this.linkInput.value === '') {
      this.close();
    } else {
      this.trigger();
      this.close();
    }
  },
  onCancelClicked : function () {
    this.close();
  },
  onKeyDown : function (evt) {
    if (evt.keyCode === 13) {
      this.onConfirmClicked(evt);
    }
  }
});

//skriv.actions.link.PLACEHOLDER = 'javascript:link';
skriv.actions.link.PLACEHOLDER = 'link';

skriv.actions.unlink = skriv.actions.abstract.extend({
  init : function (core, config) {
    this._super(core, config);
  },
  trigger : function () {
    var element =
      skriv.util
        .getParentOfType(skriv.util.getSelectedElement(), "a");

    if (element && skriv.util.getSelectedHTML().length === 0) {
      skriv.util.unwrap(element);
    } else {
      skriv.util.execCommand("unlink", false);
    }
  },
  onClick : function (evt) {
    this._super(evt);

    this.trigger();
  }
});

skriv.actions.image = skriv.actions.popout.extend({
  init : function (core, config) {
    this._super(core, config);

    this.changeTab("upload");
  },
  build : function () {
    this._super();

    this.domElement.classList.add(this.id);
    this.panelElement.classList.add("tabbed");
    this.tabBar = document.createElement("div");
    this.tabBar.className = "tab-bar";
    this.panelElement.appendChild(this.tabBar);
    this.uploadTab = document.createElement("button");
    this.uploadTab.setAttribute("data-value", "upload");
    this.uploadTab.textContent = "Upload";
    this.tabBar.appendChild(this.uploadTab);
    this.linkTab = document.createElement("button");
    this.linkTab.setAttribute("data-value", "link");
    this.linkTab.textContent = "URL";
    this.tabBar.appendChild(this.linkTab);
    this.linkSection = document.createElement("div");
    this.linkSection.className = "tab-contents link-section";
    this.panelElement.appendChild(this.linkSection);
    this.linkInput = document.createElement("input");
    this.linkInput.setAttribute("type", "text");
    this.linkInput.setAttribute("placeholder", "Image, YouTube or Vimeo URL...");
    this.linkSection.appendChild(this.linkInput);
    this.confirmButton = document.createElement("button");
    this.confirmButton.className = "confirm-button";
    this.confirmButton.innerHTML = "OK";
    this.linkSection.appendChild(this.confirmButton);
    this.cancelButton = document.createElement("button");
    this.cancelButton.className = "cancel-button";
    this.cancelButton.innerHTML = "Cancel";
    this.linkSection.appendChild(this.cancelButton);
    this.clearElement = document.createElement("div");
    this.clearElement.classList.add("clear");
    this.linkSection.appendChild(this.clearElement);
    this.uploadSection = document.createElement("div");
    this.uploadSection.className = "tab-contents upload-section";
    this.panelElement.appendChild(this.uploadSection);
    this.formElement = document.createElement("div");
    this.formElement.className = "file-form";
    this.uploadSection.appendChild(this.formElement);
    this.fileInput = document.createElement("input");
    this.fileInput.setAttribute("type", "file");
    this.formElement.appendChild(this.fileInput);
    this.browseWrapper = document.createElement("div");
    this.browseWrapper.className = "browse";
    this.formElement.appendChild(this.browseWrapper);
    this.browseOutput = document.createElement("input");
    this.browseOutput.setAttribute("type", "text");
    this.browseOutput.setAttribute("readonly", "readonly");
    this.browseOutput.setAttribute("disabled", "disabled");
    this.browseOutput.setAttribute("placeholder", "Select image file...");
    this.browseOutput.className = "browse-output";
    this.browseWrapper.appendChild(this.browseOutput);
    this.browseButton = document.createElement("button");
    this.browseButton.className = "browse-button confirm-button";
    this.browseButton.textContent = "Browse";
    this.browseWrapper.appendChild(this.browseButton);
    this.browseClear = document.createElement("div");
    this.browseClear.className = "clear";
    this.formElement.appendChild(this.browseClear);
    this.progressBar = document.createElement("div");
    this.progressBar.className = "progress";
    this.formElement.appendChild(this.progressBar);
    this.progressBarInner = document.createElement("div");
    this.progressBarInner.className = "inner";
    this.progressBar.appendChild(this.progressBarInner);
    this.panelElement.style.width = "340px";
  },
  bind : function () {
    this._super();

    this.browseButton
      .addEventListener("click", this.onBrowseClicked.bind(this), false);
    this.confirmButton
      .addEventListener("click", this.onConfirmClicked.bind(this), false);
    this.cancelButton
      .addEventListener("click", this.onCancelClicked.bind(this), false);
    this.linkInput
      .addEventListener("keydown", this.onKeyDown.bind(this), false);
    this.linkTab
      .addEventListener("click", this.onTabClicked.bind(this), false);
    this.uploadTab
      .addEventListener("click", this.onTabClicked.bind(this), false);
    this.fileInput
      .addEventListener("change", this.onFileInputChange.bind(this), false);
  },
  trigger : function (url) {
    if (this.imageElement) {
      if (this.currentTab === "link") {
        var inputVal = this.linkInput.value,
          youTuBeId = skriv.util.getYouTubeID(inputVal),
          vimeoId = skriv.util.getVimeoID(inputVal),
          iframe = [
            '<iframe width="720" height="405" src="',
            '" frameborder="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe>'
          ];

        if (youTuBeId) {
          this.imageElement.outerHTML =
            iframe.join("https://youtube.com/embed/" + youTuBeId);
        } else if (vimeoId) {
          this.imageElement.outerHTML =
            iframe.join("https://player.vimeo.com/video/" + vimeoId);
        } else {
          this.imageElement.setAttribute("src", this.linkInput.value);
          this.imageElement.style.display = "";
          this.imageElement.removeAttribute("width");
          this.imageElement.removeAttribute("height");
        }
      } else if (url) {
        this.imageElement.setAttribute("src", url);
        this.imageElement.style.display = "";
        this.imageElement.removeAttribute("width");
        this.imageElement.removeAttribute("height");
      }

      this.imageElement = null;
    }
  },
  changeTab : function (tab) {
    this.currentTab = tab;

    if (tab === "link") {
      this.uploadTab.classList.remove("selected");
      this.uploadSection.classList.remove("visible");
      this.linkTab.classList.add("selected");
      this.linkSection.classList.add("visible");
      this.linkInput.focus();
    } else {
      this.linkTab.classList.remove("selected");
      this.linkSection.classList.remove("visible");
      this.uploadTab.classList.add("selected");
      this.uploadSection.classList.add("visible");
    }
  },
  open : function () {
    this._super();

    this.linkInput.value = "";
    this.fileInput.value = "";
    this.browseOutput.value = "";
    this.panelElement.classList.remove("busy");

    skriv.util.execCommand(
      "insertImage", false, skriv.actions.image.PLACEHOLDER);

    this.imageElement =
      document.querySelector('img[src="' +
        skriv.actions.image.PLACEHOLDER + '"]');

    if (!this.imageElement && this.core.getEditor()) {
      this.imageElement = document.createElement("img");
      this.imageElement.setAttribute("src", skriv.actions.image.PLACEHOLDER);
      this.core.getEditor().appendChild(this.imageElement);
    }

    if (this.imageElement) {
      this.imageElement.style.display = "none";
    } else {
      this.core.notify("Please focus the editor first");
      this.close();
    }
  },
  close : function () {
    this._super();

    if (this.imageElement && this.imageElement.parentNode &&
      this.imageElement.getAttribute("src") ===
        skriv.actions.image.PLACEHOLDER) {
      this.imageElement.parentNode.removeChild(this.imageElement);
      this.imageElement = null;
    }
  },
  uploadFile : function () {
    var file = this.fileInput.files[0];

    if (!file || !file.type.match(/image.*/)) {
      return void this.core.notify("Only image files, please");
    }

    if (typeof file.size === "number" &&
      file.size / 1024 > this.config.maxsize) {
      return void this.core.notify("No more than " +
        Math.round(this.config.maxsize / 1024) + "mb please", "negative");
    }

    this.panelElement.classList.add("busy");
    this.setProgress(0);
    this.browseOutput.value = file.name;

    var formData = new FormData();

    formData.append("file", file);

    var csrf = document.querySelector('meta[name="csrf-token"]');

    if (csrf) {
      formData.append("authenticity_token", csrf.getAttribute("content"));
    }

    var httpRequest = new XMLHttpRequest();

    httpRequest.open("POST", this.config.endpoint);
    httpRequest.onload = (function () {
      var data = {};
      try {
        data = JSON.parse(httpRequest.responseText);
      } catch (err) {
        return this.onFileUploadError();
      }

      this.onFileUploadSuccess(data);
    }).bind(this);
    httpRequest.onerror = (this.onFileUploadError).bind(this);
    httpRequest.upload.onprogress = (function (progress) {
      this.setProgress(progress.loaded / progress.total * 100);
    }).bind(this);
    httpRequest.send(formData);
  },
  setProgress : function (progress) {
    this.progressBarInner.style.width = progress + "%";
  },
  onFileUploadError : function (msg) {
    this.close();
    this.core.notify(msg || "Failed to upload image", "negative");
  },
  onFileUploadSuccess : function (data) {
    this.trigger(data.url);
    this.close();
  },
  onFileInputChange : function () {
    this.uploadFile();
  },
  onBrowseClicked : function () {
    this.fileInput.click();
  },
  onTabClicked : function (evt) {
    var val = evt.target.getAttribute("data-value");

    if (val) {
      this.changeTab(val);
    }
  },
  onConfirmClicked : function () {
    if (this.linkInput.value === '') {
      this.close();
    } else {
      this.trigger();
      this.close();
    }
  },
  onCancelClicked : function () {
    this.close();
  },
  onClick : function (evt) {
    this._super(evt);
  },
  onKeyDown : function (evt) {
    if (evt.keyCode === 13) {
      this.onConfirmClicked(evt);
    }
  },
  onMouseDown : function () {}
});

skriv.actions.image.PLACEHOLDER = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

skriv.actions.foregroundColor = skriv.actions.abstract.extend({
  init : function (core, config) {
    this._super(core, config);

    this.colorpickerOpen = false;
  },
  build : function () {
    this._super();

    this.domElement.classList.add(this.id);

    $(this.buttonElement).spectrum({
        color : "#ECC",
        showInput : true,
        className : "skriv-colorpicker",
        showAlpha : !!this.config.alpha,
        showInitial : true,
        showPalette : true,
        showSelectionPalette : true,
        maxPaletteSize : 10,
        preferredFormat : "hex",
        localStorageKey : "skriv-colors",
        cancelText : "Cancel",
        cancelClassName : "skriv-cancel-button",
        chooseText : "Confirm",
        chooseClassName : "skriv-confirm-button",
        offsetY : 16,
        show : (function () {
          this.colorpickerOpen = true;
        }).bind(this),
        hide : (function () {
          this.colorpickerOpen = false;
        }).bind(this),
        move : (function (clr) {
          if (this.config.alpha) {
            this.currentColor = clr.toRgbString();
          } else {
            this.currentColor = clr.toHexString();
          }
        }).bind(this),
        change : (function (clr) {
          if (this.config.alpha) {
            this.currentColor = clr.toRgbString();
          } else {
            this.currentColor = clr.toHexString();
          }

          this.trigger();
        }).bind(this),
        palette : [[
          "rgb(0, 0, 0)",
          "rgb(67, 67, 67)",
          "rgb(102, 102, 102)",
          "rgb(204, 204, 204)",
          "rgb(217, 217, 217)",
          "rgb(255, 255, 255)",
          "transparent"
        ], [
          "rgb(152, 0, 0)",
          "rgb(255, 0, 0)",
          "rgb(255, 153, 0)",
          "rgb(255, 255, 0)",
          "rgb(0, 255, 0)",
          "rgb(0, 255, 255)",
          "rgb(74, 134, 232)",
          "rgb(0, 0, 255)",
          "rgb(153, 0, 255)"
        ], [
          "rgb(230, 184, 175)",
          "rgb(244, 204, 204)",
          "rgb(252, 229, 205)",
          "rgb(255, 242, 204)",
          "rgb(217, 234, 211)",
          "rgb(208, 224, 227)",
          "rgb(201, 218, 248)",
          "rgb(207, 226, 243)",
          "rgb(217, 210, 233)",
          "rgb(234, 209, 220)",
          "rgb(221, 126, 107)",
          "rgb(234, 153, 153)",
          "rgb(249, 203, 156)",
          "rgb(255, 229, 153)",
          "rgb(182, 215, 168)",
          "rgb(162, 196, 201)",
          "rgb(164, 194, 244)",
          "rgb(159, 197, 232)",
          "rgb(180, 167, 214)",
          "rgb(213, 166, 189)",
          "rgb(204, 65, 37)",
          "rgb(224, 102, 102)",
          "rgb(246, 178, 107)",
          "rgb(255, 217, 102)",
          "rgb(147, 196, 125)",
          "rgb(118, 165, 175)",
          "rgb(109, 158, 235)",
          "rgb(111, 168, 220)",
          "rgb(142, 124, 195)",
          "rgb(194, 123, 160)",
          "rgb(166, 28, 0)",
          "rgb(204, 0, 0)",
          "rgb(230, 145, 56)",
          "rgb(241, 194, 50)",
          "rgb(106, 168, 79)",
          "rgb(69, 129, 142)",
          "rgb(60, 120, 216)",
          "rgb(61, 133, 198)",
          "rgb(103, 78, 167)",
          "rgb(166, 77, 121)",
          "rgb(91, 15, 0)",
          "rgb(102, 0, 0)",
          "rgb(120, 63, 4)",
          "rgb(127, 96, 0)",
          "rgb(39, 78, 19)",
          "rgb(12, 52, 61)",
          "rgb(28, 69, 135)",
          "rgb(7, 55, 99)",
          "rgb(32, 18, 77)", "rgb(76, 17, 48)"
        ]]
      });
  },
  bind : function () {
    this._super();
  },
  trigger : function () {
    skriv.util.execCommand("forecolor", false, this.currentColor);
  },
  open : function () {
    this.colorpickerOpen = true;
    $(this.buttonElement).spectrum("show");
  },
  close : function () {
    this.colorpickerOpen = false;
    $(this.buttonElement).spectrum("hide");
  },
  isOpen : function () {
    return this.colorpickerOpen;
  },
  onClick : function (evt) {
    this._super(evt);
  }
});

skriv.actions.backgroundColor = skriv.actions.foregroundColor.extend({
  init : function (core, config) {
    config.alpha = true;

    this._super(core, config);
  },
  trigger : function () {
    skriv.util.execCommand("backcolor", false, this.currentColor);
  },
  open : function () {
    this._super();
  }
});

skriv.actions.fontFamily = skriv.actions.dropdown.extend({
  init : function (core, config) {
    config.openOnHover = true;

    this.options = [{
        name : "Arial",
        value : "arial"
      }, {
        name : "Courier New",
        value : "courier new"
      }, {
        name : "Georgia",
        value : "georgia"
      }, {
        name : "Helvetica",
        value : "helvetica"
      }, {
        name : "Impact",
        value : "impact"
      }, {
        name : "Lato",
        value : "Lato"
      }, {
        name : "League Gothic",
        value : "League Gothic"
      }, {
        name : "Times",
        value : "times new roman"
      }, {
        name : "Monospace",
        value : "monospace"
      }, {
        name : "Trebuchet",
        value : "trebuchet ms"
      }, {
        name : "Verdana",
        value : "verdana"
      }];

    this._super(core, config);

    [].slice
      .call(this.dropdownElement.querySelectorAll("li"))
      .forEach(function (li) {
        li.style.fontFamily = li.getAttribute("data-value");
      });
  },
  trigger : function () {
    skriv.util.execCommand("fontName", false, this.getValue());
  },
  updateSelection : function (styleStr) {
    if (styleStr && typeof window.getComputedStyle === "function") {
      this.setValue(
        window.getComputedStyle(styleStr)
          .getPropertyValue("font-family")
          .replace(/(,.*)|\'|\"/g, ""), true);
    }
  },
  setValue : function (val, isTrigger) {
    this._super(val, isTrigger);

    if (this.selectedElement) {
      this.buttonElement.style.fontFamily = this.getValue();
    }
  }
});

skriv.actions.fontFormat = skriv.actions.dropdown.extend({
  init : function (core, config) {
    config.openOnHover = true;

    this.options = [{
        name : "Paragraph",
        value : "p"
      }, {
        name : "Pre",
        value : "pre"
      }, {
        name : "Code",
        value : "code"
      }, {
        name : "Quote",
        value : "blockquote"
      }, {
        name : "Heading 1",
        value : "h1"
      }, {
        name : "Heading 2",
        value : "h2"
      }, {
        name : "Heading 3",
        value : "h3"
      }];

    this._super(core, config);
  },
  trigger : function () {
    var val = this.getValue();

    if (val === "code") {
      var pre =
          skriv.util
            .getParentOfType(skriv.util.getSelectedElement(), "pre"),
        code =
          skriv.util
            .getParentOfType(skriv.util.getSelectedElement(), "code");

      if (code && pre) {
        skriv.util.unwrap(code);
        skriv.util.unwrap(pre);
      } else {
        var selection = document.getSelection();

        document.execCommand(
          "insertHTML", false, "<pre><code>" + selection + " </code></pre>");

        if (selection.anchorNode &&
          typeof selection.anchorNode.querySelector === "function") {
          var preCode = selection.anchorNode.querySelector("pre code");

          if (preCode) {
            preCode.focus();
          }
        }
      }
    } else {
      skriv.util.execCommand("formatBlock", false, this.getValue());
    }
  },
  updateSelection : function (selection) {
    if (selection) {
      for (var parent = selection; parent;) {
        if (this.hasValue(parent.nodeName.toLowerCase())) {
          this.setValue(parent.nodeName.toLowerCase(), true);
          parent = null;
        } else {
          parent = parent.parentNode;
        }
      }
    }
  }
});

skriv.actions.fontSize = skriv.actions.dropdown.extend({
  init : function (core, config) {
    config.openOnHover = true;
    config.leaveHeader = true;

    this.options = [{
        name : "18px",
        value : "1"
      }, {
        name : "24px",
        value : "2"
      }, {
        name : "32px",
        value : "3"
      }, {
        name : "42px",
        value : "4"
      }, {
        name : "54px",
        value : "5"
      }, {
        name : "72px",
        value : "6"
      }, {
        name : "112px",
        value : "7"
      }];

    this._super(core, config);
  },
  build : function () {
    this._super();

    this.domElement.style.width    = "60px";
    this.panelElement.style.width  = "80px";
    this.buttonElement.textContent = "Size";
  },
  trigger : function () {
    this.getValue();

    skriv.util.execCommand("fontSize", false, this.getValue());

    setTimeout((function () {
        var editor = this.core.getEditor();

        if (editor) {
          this.options.forEach(function (opt) {
            var elements =
              editor.querySelectorAll('font[size="' + opt.value + '"]');

            for (var n = 0; n < elements.length; n += 1) {
              elements[n].removeAttribute("size");
              elements[n].style.fontSize = opt.name;
            }
          });
        }
      }).bind(this), 1);
  }
});

