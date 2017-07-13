/* Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 */
// Inspired by base2 and Prototype
(function(){
  var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;

  // The base Class implementation (does nothing)
  this.Class = function(){};

  // Create a new Class that inherits from this class
  Class.extend = function(prop) {
    var _super = this.prototype;

    // Instantiate a base class (but only create the instance,
    // don't run the init constructor)
    initializing = true;
    var prototype = new this();
    initializing = false;

    // Copy the properties over onto the new prototype
    for (var name in prop) {
      // Check if we're overwriting an existing function
      prototype[name] = typeof prop[name] == "function" &&
        typeof _super[name] == "function" && fnTest.test(prop[name]) ?
        (function(name, fn){
          return function() {
            var tmp = this._super;

            // Add a new ._super() method that is the same method
            // but on the super-class
            this._super = _super[name];

            // The method only need to be bound temporarily, so we
            // remove it when we're done executing
            var ret = fn.apply(this, arguments);
            this._super = tmp;

            return ret;
          };
        })(name, prop[name]) :
        prop[name];
    }

    // The dummy class constructor
    function Class() {
      // All construction is actually done in the init method
      if ( !initializing && this.init )
        this.init.apply(this, arguments);
    }

    // Populate our constructed prototype object
    Class.prototype = prototype;

    // Enforce the constructor to be what we expect
    Class.prototype.constructor = Class;

    // And make this class extendable
    Class.extend = arguments.callee;

    return Class;
  };
})();


/**
 * innerHTML property for SVGElement
 * Copyright(c) 2010, Jeff Schiller
 *
 * Licensed under the Apache License, Version 2
 *
 * Works in a SVG document in Chrome 6+, Safari 5+, Firefox 4+ and IE9+.
 * Works in a HTML5 document in Chrome 7+, Firefox 4+ and IE9+.
 * Does not work in Opera since it doesn't support the SVGElement interface yet.
 *
 * I haven't decided on the best name for this property - thus the duplication.
 */

(function() {
var serializeXML = function(node, output) {
  var nodeType = node.nodeType;
  if (nodeType == 3) { // TEXT nodes.
    // Replace special XML characters with their entities.
    output.push(node.textContent.replace(/&/, '&amp;').replace(/</, '&lt;').replace('>', '&gt;'));
  } else if (nodeType == 1) { // ELEMENT nodes.
    // Serialize Element nodes.
    output.push('<', node.tagName);
    if (node.hasAttributes()) {
      var attrMap = node.attributes;
      for (var i = 0, len = attrMap.length; i < len; ++i) {
        var attrNode = attrMap.item(i);
        output.push(' ', attrNode.name, '=\'', attrNode.value, '\'');
      }
    }
    if (node.hasChildNodes()) {
      output.push('>');
      var childNodes = node.childNodes;
      for (var i = 0, len = childNodes.length; i < len; ++i) {
        serializeXML(childNodes.item(i), output);
      }
      output.push('</', node.tagName, '>');
    } else {
      output.push('/>');
    }
  } else if (nodeType == 8) {
    // TODO(codedread): Replace special characters with XML entities?
    output.push('<!--', node.nodeValue, '-->');
  } else {
    // TODO: Handle CDATA nodes.
    // TODO: Handle ENTITY nodes.
    // TODO: Handle DOCUMENT nodes.
    throw 'Error serializing XML. Unhandled node of type: ' + nodeType;
  }
}
// The innerHTML DOM property for SVGElement.
Object.defineProperty(SVGElement.prototype, 'innerHTML', {
  get: function() {
    var output = [];
    var childNode = this.firstChild;
    while (childNode) {
      serializeXML(childNode, output);
      childNode = childNode.nextSibling;
    }
    return output.join('');
  },
  set: function(markupText) {
    // Wipe out the current contents of the element.
    while (this.firstChild) {
      this.removeChild(this.firstChild);
    }

    try {
      // Parse the markup into valid nodes.
      var dXML = new DOMParser();
      dXML.async = false;
      // Wrap the markup into a SVG node to ensure parsing works.
      sXML = '<svg xmlns=\'http://www.w3.org/2000/svg\'>' + markupText + '</svg>';
      var svgDocElement = dXML.parseFromString(sXML, 'text/xml').documentElement;

      // Now take each node, import it and append to this element.
      var childNode = svgDocElement.firstChild;
      while(childNode) {
        this.appendChild(this.ownerDocument.importNode(childNode, true));
        childNode = childNode.nextSibling;
      }
    } catch(e) {
      throw new Error('Error parsing XML string');
    };
  }
});

// The innerSVG DOM property for SVGElement.
Object.defineProperty(SVGElement.prototype, 'innerSVG', {
  get: function() {
    return this.innerHTML;
  },
  set: function(markupText) {
    this.innerHTML = markupText;
  }
});

})();

/*!
 * project name: SlideStudio
 * name:         placement.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/17
 */

'use strict';

(function (win) {
  var placement = {};

  placement.sync = function () {
    $('[data-placement]').each(function () {
      var $this = $(this), attr = $this.attr('data-placement');

      if (typeof placement[attr] === "function") {
        placement[attr]($this);
      } else {
        console.log('No matching layout found for "' + attr + '"');
      }
    });
  };

  placement.hcenter = function ($ele) {
    var $parent = $ele.parent();

    if ($parent.length > 0) {
      $ele.css('left', ($parent.width() - $ele.outerWidth()) / 2);
    }
  };

  placement.vcenter = function ($ele) {
    var $parent = $ele.parent();

    if ($parent.length > 0) {
      $ele.css('top', ($parent.height() - $ele.outerHeight()) / 2);
    }
  };

  placement.center = function ($ele) {
    var $parent = $ele.parent();

    if ($parent.length > 0) {
      $ele.css({
        'left': ($parent.width() - $ele.outerWidth()) / 2,
        'top': ($parent.height() - $ele.outerHeight()) / 2
      });
    }
  };

  placement.sync();
  $(win).on('resize', placement.sync);

  win.Placement = placement;
})(window);


/*!
 * project name: SlideStudio
 * name:         main.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/7/20
 */

'use strict';

$(document).ready(function () {
  function terminal() {
    var $html = $('html');
    $html.addClass('loaded');

    if (SL.util.device.HAS_TOUCH) {
      $html.addClass('touch');
    }

    if (SL.util.device.isMac()) {
      $html.addClass('ua-mac');
    } else if (SL.util.device.isWindows()) {
      $html.addClass('ua-windows');
    } else if (SL.util.device.isLinux()) {
      $html.addClass('ua-linux');
    }

    if (SL.util.device.isChrome()) {
      $html.addClass('ua-chrome');
    } else if (SL.util.device.isSafari()) {
      $html.addClass('ua-safari');
    } else if (SL.util.device.isFirefox()) {
      $html.addClass('ua-firefox');
    } else if (SL.util.device.isIE()) {
      $html.addClass('ua-ie');
    }

    if (SL.util.device.getScrollBarWidth() > 0) {
      $html.addClass('has-visible-scrollbars');
    }
  }

  function config() {
    if (typeof SLConfig === "object") {
      if (SLConfig.deck && !SLConfig.deck.notes) {
        SLConfig.deck.notes = {};
      }

      SL.current_user = new SL.models.User(SLConfig.current_user);
      //设置网格默认值
      SL.current_user.settings.data.editor_grid = true;

      if (typeof SLConfig.deck === "object") {
        SL.current_deck = new SL.models.Deck(SLConfig.deck);
      }

      if (typeof SLConfig.team === "object") {
        SL.current_team = new SL.models.Team(SLConfig.team);
      }
    }
  }

  function views() {
    SL.util.hideAddressBar();

    var $html = $('html');

    if ($html.hasClass('home index')) {
      SL.view = new SL.views.home.Index(); // 项目首页
    }

    if ($html.hasClass('home explore')) {
      SL.view = new SL.views.home.Explore(); // 搜索页面
    } else if ($html.hasClass('users show')) {
      SL.view = new SL.views.users.Show(); // 用户首页页面
    } else if ($html.hasClass('decks show')) {
      SL.view = new SL.views.decks.Show(); // 展示页面
    } else if ($html.hasClass('decks edit')) {
      SL.view = new SL.editor.Editor(); // 编辑页面
    } else if ($html.hasClass('decks edit-requires-upgrade')) {
      SL.view = new SL.views.decks.EditRequiresUpgrade();
    } else if ($html.hasClass('decks embed')) {
      SL.view = new SL.views.decks.Embed(); // 分享iframe嵌入页面
    } else if ($html.is('.decks.live-client')) {
      SL.view = new SL.views.decks.LiveClient(); // 非作者演示页面
    } else if ($html.is('.decks.live-server')) {
      SL.view = new SL.views.decks.LiveServer(); // 演示页面
    } else if ($html.hasClass('decks speaker')) {
      SL.view = new SL.views.decks.Speaker(); // 演讲页面
    } else if ($html.hasClass('decks export')) {
      SL.view = new SL.views.decks.Export();
    } else if ($html.hasClass('decks fullscreen')) {
      SL.view = new SL.views.decks.Fullscreen(); // 全屏显示deck页面
    } else if ($html.hasClass('decks password')) {
      SL.view = new SL.views.decks.Password();
    } else if ($html.hasClass('teams-subscriptions-show')) {
      SL.view = new SL.views.teams.subscriptions.Show();
    } else if ($html.hasClass("registrations") &&
      ($html.hasClass("edit") || $html.hasClass("update"))) {
      SL.view = new SL.views.devise.Edit();
    } else if ($html.hasClass("registrations") || /*用户注册页面*/
      $html.hasClass("team_registrations") ||
      $html.hasClass("sessions") || /*用户登录页面*/
      $html.hasClass("passwords")) { /*忘记密码页面*/
      SL.view = new SL.views.devise.All();
    } else if ($html.hasClass("subscriptions new") ||
      $html.hasClass("subscriptions edit")) {
      SL.view = new SL.views.subscriptions.New();
    } else if ($html.hasClass('subscriptions show')) {
      SL.view = new SL.views.subscriptions.Show();
    } else if ($html.hasClass('subscriptions edit_period')) {
      SL.view = new SL.views.subscriptions.EditPeriod();
    } else if ($html.hasClass('teams-signup')) {
      SL.view = new SL.views.teams.New();
    } else if ($html.hasClass('teams edit')) {
      SL.view = new SL.views.teams.teams.Edit();
    } else if ($html.hasClass('teams edit_members')) {
      SL.view = new SL.views.teams.teams.EditMembers();
    } else if ($html.hasClass('teams show')) {
      SL.view = new SL.views.teams.teams.Show();
    } else if ($html.hasClass('themes edit')) {
      SL.view = new SL.views.themes.Edit();
    } else if ($html.hasClass('themes preview')) {
      SL.view = new SL.views.themes.Preview();
    } else if ($html.hasClass('pricing')) {
      SL.view = new SL.views.statik.Pricing(); // 已经关闭的专业版价格页面
    } else if ($html.hasClass('static')) {
      SL.view = new SL.views.statik.All(); // 功能暂时与关于页面
    } else {
      SL.view = new SL.views.Base();
    }

    window.Placement.sync();
  }

  setTimeout(function () {
    terminal();

    SL.helpers.PageLoader.hide();
    SL.settings.init();
    SL.keyboard.init();
    SL.pointer.init();
    SL.warnings.init();
    SL.draganddrop.init();
    SL.fonts.init();

    if (typeof SLConfig === "undefined") {
      window.SLConfig = {};
    }

    config();
    views();
  }, 1);
});


/*!
 * project name: SlideStudio
 * name:         SL.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/7/20
 */

'use strict';

window.SL = function (property) {
  property = property.split('.');

  var obj = SL;

  for (; property.length;) {
    var pro = property.shift();

    if (!obj[pro]) {
      obj[pro] = {};
    }

    obj = obj[pro];
  }

  return obj;
};


/*!
 * project name: SlideStudio
 * name:         collection.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/7/15
 */

'use strict';

SL('collections').Collection = Class.extend({
  init: function (data, factory, crud) {
    this.factory = factory;
    this.crud    = crud || {};
    this.changed = new window.signals.Signal();

    this.setData(data);
  },
  setData: function (data) {
    this.data = data || [];

    if (typeof this.factory === "function") {
      var tData = this.data;

      this.data = [];

      for (var i = 0; i < tData.length; i += 1) {
        var factory = tData[i],
          facData = null;

        if (factory instanceof this.factory) {
          facData = tData[i];
        } else {
          facData = this.createModelInstance(tData[i]);
        }

        this.data.push(facData);
      }
    }
  },
  find: function (compare) {
    for (var i = 0; i < this.data.length; i += 1) {
      var data = this.data[i];

      if (data === compare) {
        return i;
      }
    }

    return -1;
  },
  contains: function (compare) {
    return this.find(compare) !== -1;
  },
  findByProperties: function (properties) {
    for (var i = 0; i < this.data.length; i += 1) {
      var data = this.data[i], hasProperty = true;

      for (var pro in properties) {
        if (properties.hasOwnProperty(pro)) {
          if (typeof data.get === "function") {
            if (data.get(pro) !== properties[pro]) {
              hasProperty = false;
            }
          } else {
            if (data[pro] !== properties[pro]) {
              hasProperty = false;
            }
          }
        }
      }

      if (hasProperty) {
        return i;
      }
    }

    return -1;
  },
  getByProperties: function (properties) {
    return this.data[this.findByProperties(properties)];
  },
  remove: function (data) {
    var removeValue;

    for (var i = 0; i < this.data.length; i += 1) {
      if (this.data[i] === data) {
        removeValue = this.data.splice(i, 1)[0];
        i -= 1;
      }
    }

    if (typeof removeValue !== "undefined") {
      this.changed.dispatch(null, [removeValue]);
    }
  },
  removeByProperties: function (properties) {
    var data, index = this.findByProperties(properties);

    for (var i = 0; index !== -1 && i < 1000; i += 1) {
      data  = this.data.splice(index, 1)[0];
      index = this.findByProperties(properties);
    }

    if (typeof data !== "undefined") {
      this.changed.dispatch(null, [data]);
    }
  },
  removeByIndex: function (index) {
    var data = this.data.splice(index, 1);

    if (typeof data === "undefined") {
      this.changed.dispatch(null, [data]);
    }

    return data;
  },
  create: function (data, cbObj) {
    if (typeof this.factory === "function") {
      if (!this.crud.create) {
        var model = this.createModel(data, cbObj);

        if (cbObj) {
          SL.util.callback(cbObj.success, model);
        }

        return model;
      }

      $.ajax({
        type: 'POST',
        context: this,
        url: this.crud.create,
        data: data
      }).done(function (data) {
        SL.util.callback(cbObj.success, this.createModel(data, cbObj));
      }).fail(function () {
        SL.util.callback(cbObj.error);
      });
    }
  },
  createModel: function (data, cbObj) {
    cbObj = $.extend({
      prepend: false
    }, cbObj);

    if (typeof this.factory === "function") {
      var modelInstance = this.createModelInstance(data);

      if (cbObj.prepend) {
        this.unshift(modelInstance);
      } else {
        this.push(modelInstance);
      }

      return modelInstance;
    }
  },
  createModelInstance: function (data, cbObj) {
    return new this.factory(data, cbObj);
  },
  clear: function () {
    this.data.length = 0;
    this.changed.dispatch();
  },
  swap: function (pos1, pos2) {
    var pos1In = typeof pos1 === "number" && pos1 >= 0 && pos1 < this.size(),
      pos2In = typeof pos2 === "number" && pos2 >= 0 && pos2 < this.size();

    if (pos1In && pos2In) {
      var data1 = this.data[pos1],
        data2 = this.data[pos2];

      this.data[pos1] = data2;
      this.data[pos2] = data1;
    }

    this.changed.dispatch();
  },
  shiftLeft: function (index) {
    if (typeof index === "number" && index > 0) {
      this.swap(index, index - 1);
    }
  },
  shiftRight: function (index) {
    if (typeof index === "number" && index < this.size() - 1) {
      this.swap(index, index + 1);
    }
  },
  at: function (index) {
    return this.data[index];
  },
  first: function () {
    return this.at(0);
  },
  last: function () {
    return this.at(this.size() - 1);
  },
  size: function () {
    return this.data.length;
  },
  isEmpty: function () {
    return this.size() === 0;
  },
  getUniqueName: function (name, property, isUnique) {
    var index = -1;

    for (var i = 0; i < this.data.length; i += 1) {
      var data = this.data[i],
        dataContent =
          typeof data.get === "function" ?
            data.get(property) :
            data[property];

      if (dataContent) {
        var matchAry =
          dataContent.match(new RegExp('^' + name + '\\s?(\\d+)?$'));

        if (matchAry && matchAry.length === 2) {
          index = Math.max(
            matchAry[1] ? parseInt(matchAry[1], 10) : 0,
            index);
        }
      }
    }

    if (index === -1) {
      return name + (isUnique ? ' 1' : '');
    } else {
      return name + ' ' + (index + 1);
    }
  },
  toJSON: function () {
    return this.map(function (obj) {
      return typeof obj.toJSON === "function" ? obj.toJSON() : obj;
    });
  },
  destroy: function () {
    this.changed.dispose();
    this.data = null;
  },
  unshift: function (data) {
    var len = this.data.unshift(data);
    this.changed.dispatch(data);

    return len;
  },
  push: function (data) {
    var len = this.data.push(data);
    this.changed.dispatch([data]);

    return len;
  },
  pop: function () {
    var data = this.data.pop();

    if (typeof data !== "undefined") {
      this.changed.dispatch(null, [data]);
    }

    return data;
  },
  map: function (cb) {
    return this.data.map(cb);
  },
  some: function (cb) {
    return this.data.some(cb);
  },
  filter: function (cb) {
    return this.data.filter(cb);
  },
  forEach: function (cb) {
    return this.data.forEach(cb);
  }
});


/*!
 * project name: SlideStudio
 * name:         loadable.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/7/15
 */

'use strict';

SL('collections').Loadable = SL.collections.Collection.extend({
  init: function () {
    this._super.apply(this, arguments);

    this.loadStatus    = '';

    this.loadStarted   = new window.signals.Signal();
    this.loadCompleted = new window.signals.Signal();
    this.loadFailed    = new window.signals.Signal();
  },
  load: function () {},
  onLoadStarted: function () {
    this.loadStatus = 'loading';
    this.loadStarted.dispatch();
  },
  onLoadCompleted: function () {
    this.loadStatus = 'loaded';
    this.loadCompleted.dispatch();
  },
  onLoadFailed: function () {
    this.loadStatus = 'failed';
    this.loadFailed.dispatch();
  },
  isLoading: function () {
    return this.loadStatus === 'loading';
  },
  isLoaded: function () {
    return this.loadStatus === 'loaded';
  },
  destroy: function () {
    this.loadStarted.dispose();
    this.loadCompleted.dispose();
    this.loadFailed.dispose();

    this._super();
  }
});


/*!
 * project name: SlideStudio
 * name:         mediatags.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/7/15
 */

'use strict';

SL('collections').MediaTags = SL.collections.Loadable.extend({
  init: function (data, mediaTag, options) {
    this._super(data, mediaTag || SL.models.MediaTag, options || {
        list:         SL.config.AJAX_MEDIA_TAG_LIST,
        create:       SL.config.AJAX_MEDIA_TAG_CREATE,
        update:       SL.config.AJAX_MEDIA_TAG_UPDATE,
        'delete':     SL.config.AJAX_MEDIA_TAG_DELETE,
        add_media:    SL.config.AJAX_MEDIA_TAG_ADD_MEDIA,
        remove_media: SL.config.AJAX_MEDIA_TAG_REMOVE_MEDIA
      });

    this.associationChanged = new window.signals.Signal();
  },
  load: function () {
    if (!this.isLoading()) {
      this.onLoadStarted();

      $.ajax({
        type: 'GET',
        url: this.crud.list,
        context: this
      }).done(function (data) {
        this.setData(data.result);
        this.onLoadCompleted();
      }).fail(function () {
        this.onLoadFailed();
      });
    }
  },
  create: function (tags, media) {
    this._super($.extend({
      tag: {
        name: this.getUniqueName('Tag', 'name', true)
      }
    }, tags), media);
  },
  addTagTo: function (mediaTag, tags) {
    tags.forEach(function (tag) {
      mediaTag.addMedia(tag);
    });

    this.associationChanged.dispatch(mediaTag);

    $.ajax({
      type: 'POST',
      url: this.crud.add_media(mediaTag.get('id')),
      context: this,
      data: {
        media_ids: tags.map(function (tag) {
          return tag.get('id');
        })
      }
    }).fail(function () {
      SL.notify(SL.locale.get('Generic_Error'), 'negative');
    });
  },
  removeTagFrom: function (mediaTag, tags) {
    tags.forEach(function (tag) {
      mediaTag.removeMedia(tag);
    });

    this.associationChanged.dispatch(mediaTag);

    $.ajax({
      type: 'DELETE',
      url: this.crud.remove_media(mediaTag.get('id')),
      context: this,
      data: {
        media_ids: tags.map(function (tag) {
          return tag.get('id');
        })
      }
    }).fail(function () {
      SL.notify(SL.locale.get('Generic_Error'), 'negative');
    });
  }
});

//媒体库章节目录
SL('collections').SectionCatalog = SL.collections.Loadable.extend({
  init: function (data, mediaTag, options) {
    this._super(data, mediaTag || SL.models.MediaTag, options || {
        list: SL.config.AJAX_SECTION_CATALOG_LIST,
        section: true
      });

    this.associationChanged = new window.signals.Signal();
  },
  load: function () {
    if (!this.isLoading()) {
      this.onLoadStarted();

      $.ajax({
        type: 'GET',
        url: this.crud.list,
        context: this
      }).done(function (data) {
        this.setData(data.result);
        this.onLoadCompleted();
      }).fail(function () {
        this.onLoadFailed();
      });
    }
  }
});

/*!
 * project name: SlideStudio
 * name:         media.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/7/15
 */

'use strict';

SL('collections').Media = SL.collections.Loadable.extend({
  init: function (data, media, options) {
    this._super(data, media || SL.models.Media, options || {
        list:     SL.config.AJAX_MEDIA_LIST,
        update:   SL.config.AJAX_MEDIA_UPDATE,
        create:   SL.config.AJAX_MEDIA_CREATE,
        'delete': SL.config.AJAX_MEDIA_DELETE
      });
  },
  load: function () {
    if (!this.isLoading()) {
      this.onLoadStarted();

      $.ajax({
        type: 'GET',
        url: this.crud.list,
        context: this
      }).done(function (data) {
        this.setData(data.result);
        this.onLoadCompleted();
      }).fail(function () {
        this.onLoadFailed();
      });
    }
  },
  createSearchFilter: function (filterStr) {
    if (!filterStr || filterStr === '') {
      return function () {
        return false;
      };
    }

    var reg = new RegExp(filterStr, 'i');

    return function (media) {
      reg.test(media.get('label'));
    };
  },
  getImages: function () {
    return this.filter(SL.models.Media.IMAGE.filter);
  },
  getVideos: function () {
    return this.filter(SL.models.Media.VIDEO.filter);
  }
});

//切片库
SL('collections').Section = SL.collections.Loadable.extend({
  init: function (data, media, options) {
    this._super(data, media || SL.models.Media, options || {
        list:     SL.config.AJAX_SECTION_LIST+ '?maxResultCount=5000&skipCount=0',
        // update:   SL.config.AJAX_MEDIA_UPDATE,
        // create:   SL.config.AJAX_MEDIA_CREATE,
        // 'delete': SL.config.AJAX_MEDIA_DELETE,
        section: true
      });
  },
  load: function () {
    if (!this.isLoading()) {
      this.onLoadStarted();

      $.ajax({
        type: 'GET',
        url: this.crud.list,
        context: this
      }).done(function (data) {
        this.setData(data.result.items);
        this.onLoadCompleted();
      }).fail(function () {
        this.onLoadFailed();
      });
    }
  },
  createSearchFilter: function (filterStr) {
    if (!filterStr || filterStr === '') {
      return function () {
        return false;
      };
    }

    var reg = new RegExp(filterStr, 'i');

    return function (media) {
      reg.test(media.get('label'));
    };
  },
  getImages: function () {
    return this.filter(SL.models.Media.IMAGE.filter);
  },
  getVideos: function () {
    return this.filter(SL.models.Media.VIDEO.filter);
  }
});


/*!
 * project name: SlideStudio
 * name:         teammediatags.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/7/15
 */

'use strict';

SL('collections').TeamMediaTags = SL.collections.MediaTags.extend({
  init: function (data) {
    this._super(data, SL.models.MediaTag, {
      list:         SL.config.AJAX_TEAM_MEDIA_TAG_LIST,
      create:       SL.config.AJAX_TEAM_MEDIA_TAG_CREATE,
      update:       SL.config.AJAX_TEAM_MEDIA_TAG_UPDATE,
      'delete':     SL.config.AJAX_TEAM_MEDIA_TAG_DELETE,
      add_media:    SL.config.AJAX_TEAM_MEDIA_TAG_ADD_MEDIA,
      remove_media: SL.config.AJAX_TEAM_MEDIA_TAG_REMOVE_MEDIA
    });
  },
  createModelInstance: function (data) {
    return this._super(data, this.crud);
  }
});

/*!
 * project name: SlideStudio
 * name:         teammedia.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/7/15
 */

'use strict';

SL('collections').TeamMedia = SL.collections.Media.extend({
  init: function (data) {
    this._super(data, SL.models.Media, {
      list:     SL.config.AJAX_TEAM_MEDIA_LIST,
      create:   SL.config.AJAX_TEAM_MEDIA_CREATE,
      update:   SL.config.AJAX_TEAM_MEDIA_UPDATE,
      'delete': SL.config.AJAX_TEAM_MEDIA_DELETE
    });
  },
  createModelInstance: function (data) {
    return this._super(data, this.crud);
  }
});


/*!
 * project name: SlideStudio
 * name:         config.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/11
 */

'use strict';
SL.apiAddress = configHost;

SL.config = {
  // SLIDE_WIDTH:                         960,
  // SLIDE_HEIGHT:                        700,
  SLIDE_WIDTH:                         1170,
  SLIDE_HEIGHT:                        650,
  LOGIN_STATUS_INTERVAL:               60000,
  UNSAVED_CHANGES_INTERVAL:            1500,
  AUTOSAVE_INTERVAL:                   4000,
  DECK_TITLE_MAXLENGTH:                200,
  MEDIA_LABEL_MAXLENGTH:               200,
  SPEAKER_NOTES_MAXLENGTH:             300,
  MAX_IMAGE_UPLOAD_SIZE:               1024 * 1024 * 1024 * 500,
  MAX_IMPORT_UPLOAD_SIZE:              100000,
  IMPORT_SOCKET_TIMEOUT:               240000,
  PRESENT_CONTROLS_DEFAULT:            true,
  PRESENT_UPSIZING_DEFAULT:            true,
  PRESENT_UPSIZING_MAX_SCALE:          10,
  DEFAULT_THEME_COLOR:                 'white-blue',
  DEFAULT_THEME_FONT:                  'montserrat',
  DEFAULT_THEME_TRANSITION:            'slide',
  DEFAULT_THEME_BACKGROUND_TRANSITION: 'slide',
  AUTO_SLIDE_OPTIONS:                  [2, 4, 6, 8, 10, 15, 20, 30, 40],
  RESERVED_SLIDE_CLASSES : ['past', 'present', 'future', 'disabled', 'overflowing'],
  THEME_COLORS: [
    {id: 'white-blue'},
    {id: 'sand-blue'},
    {id: 'beige-brown'},
    {id: 'silver-green'},
    {id: 'silver-blue'},
    {id: 'sky-blue'},
    {id: 'blue-yellow'},
    {id: 'cobalt-orange'},
    {id: 'asphalt-orange'},
    {id: 'forest-yellow'},
    {id: 'mint-beige'},
    {id: 'sea-yellow'},
    {id: 'yellow-black'},
    {id: 'coral-blue'},
    {id: 'grey-blue'},
    {id: 'black-blue'},
    {id: 'black-mint'},
    {id: 'black-orange'}
  ],
  THEME_FONTS: [
    {id: 'montserrat', title: 'Montserrat'},
    {id: 'league', title: 'League'},
    {id: 'opensans', title: 'Open Sans'},
    {id: 'josefine', title: 'Josefine'},
    {id: 'palatino', title: 'Palatino'},
    {id: 'news', title: 'News'},
    {id: 'helvetica', title: 'Helvetica'},
    {id: 'merriweather', title: 'Merriweather'},
    {id: 'asul', title: 'Asul'},
    {id: 'sketch', title: 'Sketch'},
    {id: 'quicksand', title: 'Quicksand'},
    {id: 'overpass', title: 'Overpass'}
  ],
  THEME_TRANSITIONS: [
    {id: 'slide', title: 'Slide'},
    {id: 'linear', title: 'Linear', deprecated: true},
    {id: 'fade', title: 'Fade'},
    {id: 'none', title: 'None'},
    {id: 'default', title: 'Convex'},
    {id: 'concave', title: 'Concave'},
    {id: 'zoom', title: 'Zoom'},
    {id: 'cube', title: 'Cube', deprecated: true},
    {id: 'page', title: 'Page', deprecated: true}
  ],
  THEME_BACKGROUND_TRANSITIONS: [
    {id: 'slide', title: 'Slide'},
    {id: 'fade', title: 'Fade'},
    {id: 'none', title: 'None'},
    {id: 'convex', title: 'Convex'},
    {id: 'concave', title: 'Concave'},
    {id: 'zoom', title: 'Zoom'}
  ],
  BLOCKS: new SL.collections.Collection([
    {type: 'text', factory: 'Text', label: '文本', icon: 'type'},
    {type: 'image', factory: 'Image', label: '图片', icon: 'picture'},
    {type: 'shape', factory: 'Shape', label: '图形', icon: 'shapes'},
    {type: 'iframe', factory: 'Iframe', label: 'Iframe', icon: 'browser'},
    {type: 'table', factory : 'Table', label : '表格', icon : 'table'},
    {type: 'video', factory : 'Video', label : '视频', icon : 'video-camera'},
    {type: 'sectionIframe', factory: 'SectionIframe', label: '切片', icon: 'specimen'},
    {type: 'snippet', factory: 'Snippet', label: 'snippet', icon: 'file-xml', hidden: true}
  ]),
  DEFAULT_DECK_THUMBNAIL:   'images/default-deck-thumbnail.png',
  DEFAULT_USER_THUMBNAIL:   'images/default-profile-picture.png',
  DECK_THUMBNAIL_TEMPLATE: [
    '<li class="deck-thumbnail">',
      '<div class="deck-image" style="background-image: url({{DECK_THUMB_URL}})">',
        '<a class="deck-link" href="{{DECK_URL}}"></a>',
      '</div>',
      '<footer class="deck-details">',
        '<a class="author" href="{{USER_URL}}">',
          '<span class="picture" style="background-image: url({{USER_THUMB_URL}})"></span>',
          '<span class="name">{{USER_NAME}}</span>',
        '</a>',
        '<div class="stats">',
          '<div>{{DECK_VIEWS}}<span class="icon i-eye"></span></div>',
        '</div>',
      '</footer>',
    '</li>'].join(''),

  AJAX_SEARCH:              '/api/v1/search.json',
  AJAX_SEARCH_ORGANIZATION: '/api/v1/team/search.json',

  AJAX_CREATE_DECK: function () {
    return SL.apiAddress + '/api/v1/decks';
  }, // 创建
  AJAX_UPDATE_DECK: function (deckId) {
    return SL.apiAddress + '/api/v1/decks/' + deckId;
  }, // 更新
  AJAX_PUBLISH_DECK: function (deckId) {
    return '/api/v1/decks/' + deckId + '/publish';
  }, // 发布deck或者更改可见属性
  AJAX_GET_DECK_VERSIONS: function (deckId) {
    return SL.apiAddress + '/api/v1/decks/' + deckId + '/revisions';
  }, // 获取deck的版本信息
  AJAX_RESTORE_DECK_VERSION: function (deckId, revision) {
    return SL.apiAddress + '/api/v1/decks/' + deckId + '/revisions/' + revision + '/restore';
  }, // 恢复deck到指定的一个版本
  AJAX_PREVIEW_DECK_VERSION: function (userName, slug, revision) {
    // html view page
    return '/' + userName + '/' + slug + '/preview?revision=' + revision;
  }, // 预览某个版本
  AJAX_THUMBNAIL_DECK: function (deckId) {
    return SL.apiAddress + '/api/v1/decks/' + deckId + '/thumbnails';
  }, // 同步缩略图
  AJAX_FORK_DECK: function (deckId) {
    return '/api/v1/decks/' + deckId + '/fork';
  }, // 复制deck
  AJAX_SHARE_DECK_VIA_EMAIL: function (deckId) {
    return '/api/v1/decks/' + deckId + '/deck_shares';
  }, // 通过邮件共享deck
  AJAX_KUDO_DECK: function (kudosId) {
    return '/api/v1/decks/' + kudosId + '/kudos/kudo';
  }, // 添加赞
  AJAX_UNKUDO_DECK: function (kudosId) {
    return '/api/v1/decks/' + kudosId + '/kudos/unkudo';
  }, // 移除赞

  AJAX_EXPORT_DECK: function (userName, deckId) {
    // html view page
    return '/' + userName + '/' + deckId + '/export';
  }, // download html
  AJAX_EXPORT_START: function (deckId) {
    return '/api/v1/decks/' + deckId + '/exports';
  }, // download pdf/zip
  AJAX_EXPORT_LIST: function (deckId) {
    return '/api/v1/decks/' + deckId + '/exports';
  },
  AJAX_EXPORT_STATUS: function (deckId, exportId) {
    return '/api/v1/decks/' + deckId + '/exports/' + exportId;
  },

  AJAX_PDF_IMPORT_NEW: '/api/v1/imports', // 新建上传pdf、ppt
  AJAX_PDF_IMPORT_UPLOADED: function (deckId) {
    return '/api/v1/imports/' + deckId;
  }, // 提交pdf、ppt上传完成

  // dropbox connect has been abandoned;
  AJAX_DROPBOX_CONNECT:    '/settings/dropbox/authorize',
  AJAX_DROPBOX_DISCONNECT: 'https://www.dropbox.com/account/security#apps',
  AJAX_DROPBOX_SYNC_DECK: function (deckId) {
    return '/api/v1/decks/' + deckId + '/export.json';
  },

  AJAX_UPDATE_ORGANIZATION:        '/api/v1/team.json',
  AJAX_LOOKUP_ORGANIZATION:        '/api/v1/team/lookup.json',
  AJAX_ORGANIZATION_MEMBERS_LIST:  '/api/v1/team/users.json',
  AJAX_ORGANIZATION_MEMBER_CREATE: '/api/v1/team/users.json',
  AJAX_ORGANIZATION_MEMBER_DELETE: function (userId) {
    return '/api/v1/team/users/' + userId + '.json';
  },
  AJAX_ORGANIZATION_MEMBER_WELCOME: function (userId) {
    return '/api/v1/team/users/' + userId + '/welcome.json';
  },

  AJAX_THEMES_LIST:   '/api/v1/themes.json',
  AJAX_THEMES_CREATE: '/api/v1/themes.json',
  AJAX_THEMES_READ: function (themeId) {
    return '/api/v1/themes/' + themeId + '.json';
  },
  AJAX_THEMES_UPDATE: function (themeId) {
    return '/api/v1/themes/' + themeId + '.json';
  },
  AJAX_THEMES_DELETE: function (themeId) {
    return '/api/v1/themes/' + themeId + '.json';
  },
  AJAX_THEME_ADD_SLIDE_TEMPLATE: function (themeId) {
    return '/api/v1/themes/' + themeId + '/add_slide_template.json';
  },
  AJAX_THEME_REMOVE_SLIDE_TEMPLATE: function (themeId) {
    return '/api/v1/themes/' + themeId + '/remove_slide_template.json';
  },

  AJAX_ACCESS_TOKENS_LIST: function (deckId) {
    return '/api/v1/decks/' + deckId + '/access_tokens.json';
  }, // 允许访问用户列表
  AJAX_ACCESS_TOKENS_CREATE: function (deckId) {
    return '/api/v1/decks/' + deckId + '/access_tokens.json';
  },
  AJAX_ACCESS_TOKENS_UPDATE: function (deckId, tokenId) {
    return '/api/v1/decks/' + deckId + '/access_tokens/' + tokenId + '.json';
  },
  AJAX_ACCESS_TOKENS_DELETE: function (deckId, tokenId) {
    return '/api/v1/decks/' + deckId + '/access_tokens/' + tokenId + '.json';
  },

  AJAX_ACCESS_TOKENS_PASSWORD_AUTH: function (tokenId) {
    return '/access_tokens/' + tokenId + '.json';
  },

  AJAX_SLIDE_TEMPLATES_LIST: SL.apiAddress + '/api/v1/slide_templates', // 获取模板列表
  AJAX_SLIDE_TEMPLATES_CREATE: SL.apiAddress + '/api/v1/slide_templates', // 创建一个模板
  AJAX_SLIDE_TEMPLATES_UPDATE: function (templatesId) {
    return SL.apiAddress + '/api/v1/slide_templates/' + templatesId;
  }, // 更新一个模板
  AJAX_SLIDE_TEMPLATES_DELETE: function (templatesId) {
    return SL.apiAddress + '/api/v1/slide_templates/' + templatesId;
  }, // 删除一个模板

  AJAX_TEAM_SLIDE_TEMPLATES_LIST:   '/api/v1/team/slide_templates',
  AJAX_TEAM_SLIDE_TEMPLATES_CREATE: '/api/v1/team/slide_templates.json',
  AJAX_TEAM_SLIDE_TEMPLATES_UPDATE: function (templatesId) {
    return '/api/v1/team/slide_templates/' + templatesId + '.json';
  },
  AJAX_TEAM_SLIDE_TEMPLATES_DELETE: function (templatesId) {
    return '/api/v1/team/slide_templates/' + templatesId + '.json';
  },

  AJAX_GET_USER: function (userId) {
    return '/api/v1/users/' + userId + '.json';
  },
  AJAX_LOOKUP_USER:          '/api/v1/users/lookup', // 同步用户状态(是否重复)
  AJAX_SERVICES_USER:        '/api/v1/users/services.json',
  AJAX_UPDATE_USER:          '/api/v1/users', // 删除用户头像或者教程完成

  AJAX_GET_USER_SETTINGS:    '/api/v1/user_settings', // 获取用户编辑器设置
  AJAX_UPDATE_USER_SETTINGS: '/api/v1/user_settings', // 更新用户编辑器设置

  AJAX_SUBSCRIPTIONS:        '/subscriptions',
  AJAX_SUBSCRIPTIONS_STATUS: '/account/details.json',
  AJAX_SUBSCRIPTIONS_PRINT_RECEIPT: function (chargeId) {
    return '/account/receipts/' + chargeId;
  },

  AJAX_TEAMS_CREATE: '/teams.json',

  AJAX_CHECK_STATUS: '/api/v1/status', // 用户登录状态监测

  AJAX_MEDIA_LIST:  SL.apiAddress + '/api/v1/media', // 获取媒体列表
  AJAX_MEDIA_CREATE: SL.apiAddress + '/api/v1/media', // 创建媒体
  AJAX_MEDIA_UPDATE: function (mediaId) {
    return SL.apiAddress + '/api/v1/media/' + mediaId;
  }, // 更新媒体
  AJAX_MEDIA_DELETE: function (mediaId) {
    return SL.apiAddress + '/api/v1/media/' + mediaId;
  }, // 删除媒体
  AJAX_MEDIA_TAG_LIST: SL.apiAddress + '/api/v1/tags',  // 获取标签列表
  AJAX_MEDIA_TAG_CREATE: SL.apiAddress + '/api/v1/tags',  // 创建标签
  AJAX_MEDIA_TAG_UPDATE: function (tagId) {
    return SL.apiAddress + '/api/v1/tags/' + tagId;
  }, // 更新标签
  AJAX_MEDIA_TAG_DELETE: function (tagId) {
    return SL.apiAddress + '/api/v1/tags/' + tagId;
  }, // 删除标签
  AJAX_MEDIA_TAG_ADD_MEDIA: function (tagId) {
    return SL.apiAddress + '/api/v1/tags/' + tagId + '/add_media';
  }, // 向标签中添加媒体
  AJAX_MEDIA_TAG_REMOVE_MEDIA: function (tagId) {
    return SL.apiAddress + '/api/v1/tags/' + tagId + '/remove_media';
  }, // 从标签中移除媒体

  AJAX_SECTION_CATALOG_LIST: SL.apiAddress + '/api/v1/CatalogUnit/list', //获取切片列表
  AJAX_SECTION_LIST: SL.apiAddress + '/api/v1/specimen/deck', //获取切片列表

  AJAX_TEAM_MEDIA_LIST:   '/api/v1/team/media',
  AJAX_TEAM_MEDIA_CREATE: '/api/v1/team/media.json',
  AJAX_TEAM_MEDIA_UPDATE: function (mediaId) {
    return '/api/v1/team/media/' + mediaId + '.json';
  },
  AJAX_TEAM_MEDIA_DELETE: function (mediaId) {
    return '/api/v1/team/media/' + mediaId + '.json';
  },

  AJAX_TEAM_MEDIA_TAG_LIST:   '/api/v1/team/tags',
  AJAX_TEAM_MEDIA_TAG_CREATE: '/api/v1/team/tags.json',
  AJAX_TEAM_MEDIA_TAG_UPDATE: function (tagId) {
    return '/api/v1/team/tags/' + tagId + '.json';
  },
  AJAX_TEAM_MEDIA_TAG_DELETE: function (tagId) {
    return '/api/v1/team/tags/' + tagId + '.json';
  },
  AJAX_TEAM_MEDIA_TAG_ADD_MEDIA: function (tagId) {
    return '/api/v1/team/tags/' + tagId + '/add_media.json';
  },
  AJAX_TEAM_MEDIA_TAG_REMOVE_MEDIA: function (tagId) {
    return '/api/v1/team/tags/' + tagId + '/remove_media.json';
  },

  STREAM_ENGINE_HOST:              window.location.protocol + '//localhost:3080', // socket 服务器地址
  STREAM_ENGINE_LIVE_NAMESPACE:    'live', // 演讲模式 socket 路由
  STREAM_ENGINE_EDITOR_NAMESPACE:  'editor', // 编辑模式　socket 路由
  STREAM_ENGINE_MESSAGE_NAMESPACE: 'messages', // 消息系统　socket 路由

  APP_HOST:                       '#',
  S3_HOST:                        'https://localhost:3000',

  ASSET_URLS: {
    'offline-v2.css':          '/public/styles/offline-v2.css',
    'homepage-background.jpg': 'images/homepage-background.jpg',
    'reveal.js/marked.js':     '/public/plugins/reveal.js/plugin/markdown/marked.js',
    'reveal.js/markdown.js':   '/public/plugins/reveal.js/plugin/markdown/markdown.js',
    'reveal.js/highlight.js':  '/public/plugins/reveal.js/plugin/highlight/highlight.js'
  }
};


/*!
 * project name: SlideStudio
 * name:         configv1.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/11
 */

'use strict';

SL.config.V1 = {
  DEFAULT_THEME_COLOR:      'grey-blue',
  DEFAULT_THEME_FONT:       'league',
  DEFAULT_THEME_TRANSITION: 'linear',
  DEFAULT_THEME_BACKGROUND_TRANSITION: 'fade',
  THEME_COLORS: [
    {id: 'grey-blue'},
    {id: 'black-mint'},
    {id: 'black-orange'},
    {id: 'forest-yellow'},
    {id: 'lila-yellow'},
    {id: 'asphalt-orange'},
    {id: 'sky-blue'},
    {id: 'beige-brown'},
    {id: 'sand-grey'},
    {id: 'silver-green'},
    {id: 'silver-blue'},
    {id: 'cobalt-orange'},
    {id: 'white-blue'},
    {id: 'mint-beige'},
    {id: 'sea-yellow'},
    {id: 'coral-blue'}
  ],
  THEME_FONTS: [
    {id: 'league',       title: 'League'},
    {id: 'opensans',     title: 'Open Sans'},
    {id: 'josefine',     title: 'Josefine'},
    {id: 'palatino',     title: 'Palatino'},
    {id: 'news',         title: 'News'},
    {id: 'montserrat',   title: 'Montserrat'},
    {id: 'helvetica',    title: 'Helvetica'},
    {id: 'asul',         title: 'Asul'},
    {id: 'merriweather', title: 'Merriweather'},
    {id: 'sketch',       title: 'Sketch'},
    {id: 'quicksand',    title: 'Quicksand'},
    {id: 'overpass',     title: 'Overpass'}
  ]
};


/*!
 * project name: SlideStudio
 * name:         analytics.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/7/15
 */

'use strict';

SL.analytics = {
  CATEGORY_OTHER: "other",
  CATEGORY_EDITOR: "editor",
  CATEGORY_THEMING: "theming",
  CATEGORY_PRESENTING: "presenting",
  _track: function (category, evtName, value) {
    if (typeof window.ga !== "undefined") {
      window.ga("send", "event", category, evtName, value);
    }
  },
  _trackPageView: function (url, currentSlide) {
    currentSlide = currentSlide || document.title;

    if (typeof window.ga !== "undefined") {
      window.ga(function () {
        var winGa = window.ga.getAll();

        for (var i = 0; i < winGa.length; i += 1) {
          winGa[i].send("pageview", {
            page: url,
            title: currentSlide
          });
        }
      });
    }
  },
  track: function (evtName, value) {
    this._track(SL.analytics.CATEGORY_OTHER, evtName, value);
  },
  trackEditor: function (evtName, value) {
    this._track(SL.analytics.CATEGORY_EDITOR, evtName, value);
  },
  trackTheming: function (evtName, value) {
    this._track(SL.analytics.CATEGORY_THEMING, evtName, value);
  },
  trackPresenting: function (evtName, value) {
    this._track(SL.analytics.CATEGORY_PRESENTING, evtName, value);
  },
  trackCurrentSlide: function () {
    if (window.Reveal) {
      var indices = window.Reveal.getIndices(),
        url = window.location.pathname + "/" + indices.h;

      if (typeof indices.v === "number" && indices.v > 0) {
        url += "/" + indices.v;
      }

      var currentSlide = $(window.Reveal.getCurrentSlide())
        .find("h1, h2, h3")
        .first()
        .text()
        .trim();

      if (!currentSlide || currentSlide.length < 2) {
        currentSlide = 'Untitled';
      }

      this._trackPageView(url, currentSlide);
    }
  }
};


/*!
 * project name: SlideStudio
 * name:         templates.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/18
 */

'use strict';

SL('data').templates = {
  NEW_DECK_TEMPLATE: {
    html: [
      '<section>',
        '<div class="sl-block" data-block-type="text" ' +
          'style="width: 800px; left: 80px; top: 250px;">',
          '<div class="sl-block-content" data-placeholder-tag="h1" ' +
            'data-placeholder-text="Title Text">',
            '<h1>Title Text</h1>',
          '</div>',
        '</div>',
      '</section>'
    ].join('')
  },
  DEFAULT_TEMPLATES_DUPLICATE_INDEX: 1,
  DEFAULT_TEMPLATES: [{
    label: 'Blank',html: ''
  }, {
    label: 'Duplicate',html: ''
  }, {
    html: [
      '<section>',
        '<div class="sl-block" data-block-type="text" ' +
          'style="width: 800px; left: 80px; top: 270px;">',
          '<div class="sl-block-content" data-placeholder-tag="h1" ' +
            'data-placeholder-text="Title Text">',
            '<h1>Title Text</h1>',
          '</div>',
        '</div>',
      '</section>'].join('')
  },{
    html: [
      '<section>',
        '<div class="sl-block" data-block-type="text" ' +
          'style="width: 800px; left: 80px; top: 190px;">',
          '<div class="sl-block-content" data-placeholder-tag="h1" ' +
            'data-placeholder-text="Title Text">',
            '<h1>Title Text</h1>',
          '</div>',
        '</div>',
        '<div class="sl-block" data-block-type="text" ' +
          'style="width: 800px; left: 80px; top: 255px;" ' +
          'data-layout-method="belowPreviousBlock">',
          '<div class="sl-block-content" data-placeholder-tag="h2" ' +
            'data-placeholder-text="Subtitle">',
            '<h2>Subtitle</h2>',
          '</div>',
        '</div>',
      '</section>'].join('')
  }, {
    html: [
      '<section>',
        '<div class="sl-block" data-block-type="text" ' +
          'style="width: 800px; left: 80px; top: 190px;">',
          '<div class="sl-block-content" data-placeholder-tag="h2" ' +
            'data-placeholder-text="Title Text">',
            '<h2>Title Text</h2>',
          '</div>',
        '</div>',
        '<div class="sl-block" data-block-type="text" ' +
          'style="width: 800px; left: 80px; top: 264px;" ' +
          'data-layout-method="belowPreviousBlock">',
          '<div class="sl-block-content">',
            '<ul>',
              '<li>Bullet One</li>',
              '<li>Bullet Two</li>',
              '<li>Bullet Three</li>',
            '</ul>',
          '</div>',
        '</div>',
      '</section>'].join('')
  }, {
    html: [
      '<section>',
        '<div class="sl-block" data-block-type="text" ' +
          'style="width: 410px; left: 49px; top: 106px; height: auto;">',
          '<div class="sl-block-content" data-placeholder-tag="h2" ' +
            'data-placeholder-text="Title Text" style="text-align: left;">',
            '<h2>Title Text</h2>',
          '</div>',
        '</div>',
        '<div class="sl-block" data-block-type="text" ' +
          'style="width: 410px; left: 49px; top: 200px; height: auto;">',
          '<div class="sl-block-content" data-placeholder-tag="p" ' +
            'data-placeholder-text="Lorem ipsum dolor sit amet, ' +
            'consectetur adipiscing elit. Proin urna odio, aliquam ' +
            'vulputate faucibus id, elementum lobortis felis. Mauris ' +
            'urna dolor, placerat ac sagittis quis." style="text-align: left;">',
            '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. ' +
              'Proin urna odio, aliquam vulputate faucibus id, elementum lobortis ' +
              'felis. Mauris urna dolor, placerat ac sagittis quis.</p>',
          '</div>',
        '</div>',
        '<div class="sl-block" data-block-type="text" ' +
          'style="width: 410px; left: 499px; top: 106px; height: auto;">',
          '<div class="sl-block-content" data-placeholder-tag="h2" ' +
            'data-placeholder-text="Title Text" style="text-align: left;">',
            '<h2>Title Text</h2>',
          '</div>',
        '</div>',
        '<div class="sl-block" data-block-type="text" ' +
          'style="width: 410px; left: 499px; top: 200px; height: auto;">',
          '<div class="sl-block-content" data-placeholder-tag="p" ' +
            'data-placeholder-text="Lorem ipsum dolor sit amet, ' +
            'consectetur adipiscing elit. Proin urna odio, aliquam ' +
            'vulputate faucibus id, elementum lobortis felis. ' +
            'Mauris urna dolor, placerat ac sagittis quis." ' +
            'style="text-align: left;">',
            '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. ' +
              'Proin urna odio, aliquam vulputate faucibus id, elementum lobortis ' +
              'felis. Mauris urna dolor, placerat ac sagittis quis.</p>',
          '</div>',
        '</div>',
      '</section>'
    ].join('')
  }, {
    html: [
      '<section>',
        '<div class="sl-block" data-block-type="text" ' +
          'style="width: 900px; left: 30px; top: 58px; height: auto;">',
          '<div class="sl-block-content" data-placeholder-tag="h1" ' +
            'style="font-size: 200%; text-align: left;">',
            '<h1>One<br>Two<br>Three</h1>',
          '</div>',
        '</div>',
      '</section>'].join('')
  }, {
    html: [
      '<section>',
        '<div class="sl-block" data-block-type="text" ' +
          'style="width: 800px; left: 79px; top: 50px;">',
          '<div class="sl-block-content" data-placeholder-tag="h2" ' +
            'data-placeholder-text="Title Text">',
            '<h2>Title Text</h2>',
          '</div>',
        '</div>',
        '<div class="sl-block" data-block-type="image" ' +
          'style="width: 700px; height: 475px; left: 129px; top: 144px;">',
          '<div class="sl-block-content">',
            '<div class="editing-ui sl-block-overlay sl-block-placeholder"></div>',
          '</div>',
        '</div>',
      '</section>'].join('')
  }, {
    html: [
      '<section>',
        '<div class="sl-block" data-block-type="text" ' +
          'style="width: 430px; left: 23px; top: 87px;">',
          '<div class="sl-block-content" data-placeholder-tag="h2" ' +
            'data-placeholder-text="Title Text" ' +
            'style="text-align: left;">',
            '<h2>Title Text</h2>',
          '</div>',
        '</div>',
        '<div class="sl-block" data-block-type="text" ' +
          'style="width: 430px; left: 23px; top: 161px;" ' +
          'data-layout-method="belowPreviousBlock">',
          '<div class="sl-block-content" data-placeholder-tag="p" ' +
            'data-placeholder-text="Lorem ipsum dolor sit amet, ' +
            'consectetur adipiscing elit. Morbi nec metus justo. ' +
            'Aliquam erat volutpat." style="z-index: 13; text-align: left;">',
            '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. ' +
              'Morbi nec metus justo. Aliquam erat volutpat.</p>',
          '</div>',
        '</div>',
        '<div class="sl-block" data-block-type="image" ' +
          'style="width: 454px; height: 641px; left: 479px; top: 29px;">',
          '<div class="sl-block-content">',
            '<div class="editing-ui sl-block-overlay sl-block-placeholder"></div>',
          '</div>',
        '</div>',
      '</section>'].join('')
  }, {
    html: [
      '<section>',
        '<div class="sl-block" data-block-type="image" ' +
          'style="width: 700px; height: 475px; left: 130px; top: 65px;">',
          '<div class="sl-block-content">',
            '<div class="editing-ui sl-block-overlay sl-block-placeholder"></div>',
          '</div>',
        '</div>',
        '<div class="sl-block" data-block-type="text" ' +
          'style="width: 800px; left: 80px; top: 575px;">',
          '<div class="sl-block-content" data-placeholder-tag="h2" ' +
            'data-placeholder-text="Title Text">',
            '<h2>Title Text</h2>',
          '</div>',
        '</div>',
      '</section>'].join('')
  }],
  LAYOUT_METHODS: {
    belowPreviousBlock: function(t, blockElement) {
      var block = blockElement.prev().get(0);

      if (block) {
        blockElement.css(
          'top',
          block.offsetTop + block.offsetHeight);
      }
    }
  },
  userTemplatesLoaded:    false,
  userTemplatesLoading:   false,
  userTemplatesCallbacks: [],
  teamTemplatesLoaded:    false,
  teamTemplatesLoading:   false,
  teamTemplatesCallbacks: [],

  /**
   * Get New Deck Template
   *
   * @function
   * @returns {number|boolean|*}
   */
  getNewDeckTemplate: function() {
    return new SL.models.Template(SL.data.templates.NEW_DECK_TEMPLATE);
  },

  /**
   * Get Default Template
   *
   * @function
   * @returns {*|Collection}
   */
  getDefaultTemplates: function() {
    return new SL.collections.Collection(
      SL.data.templates.DEFAULT_TEMPLATES, SL.models.Template);
  },

  /**
   * Get User Template
   *
   * @function
   * @param {Function} callback
   */
  getUserTemplates: function(callback) {
    callback = callback || function() {};

    if (SL.data.templates.userTemplatesLoading === false &&
      SL.data.templates.userTemplatesLoaded === false) {
      SL.data.templates.userTemplatesLoading = true;
      SL.data.templates.userTemplatesCallbacks.push(callback);

      $.ajax({
        type: 'GET',
        url: SL.config.AJAX_SLIDE_TEMPLATES_LIST,
        context: this
      }).done(function (data) {
        SL.data.templates.userTemplates =
          new SL.collections.Collection(data.results, SL.models.Template);
        SL.data.templates.userTemplatesLoaded = true;
        SL.data.templates.userTemplatesLoading = false;

        SL.data.templates.userTemplatesCallbacks.forEach(function (cb) {
          cb.call(null, SL.data.templates.userTemplates);
        });

        SL.data.templates.userTemplatesCallbacks.length = 0;
      }).fail(function () {
        SL.data.templates.userTemplatesLoading = false;
        SL.notify(SL.locale.get('Templates.load_err'), 'negative');
      });
    } else if (SL.data.templates.userTemplatesLoading) {
      SL.data.templates.userTemplatesCallbacks.push(callback);
    } else {
      callback.call(null, SL.data.templates.userTemplates);
    }
  },

  /**
   * Get Team Template
   *
   * @function
   * @param {Function} callback
   */
  getTeamTemplates: function(callback) {
    if (SL.current_user.isEnterprise()) {
      callback = callback || function () {};

      if (SL.data.templates.teamTemplatesLoading === false &&
        SL.data.templates.teamTemplatesLoaded === false) {
        SL.data.templates.teamTemplatesLoading = true;
        SL.data.templates.teamTemplatesCallbacks.push(callback);

        $.ajax({
          type: 'GET',
          url: SL.config.AJAX_TEAM_SLIDE_TEMPLATES_LIST,
          context: this
        }).done(function (data) {
          SL.data.templates.teamTemplates =
            new SL.collections.Collection(data.results, SL.models.Template);
          SL.data.templates.teamTemplatesLoaded = true;
          SL.data.templates.teamTemplatesLoading = true;

          SL.data.templates.teamTemplatesCallbacks.forEach(function (cb) {
            cb.call(null, SL.data.templates.teamTemplates);
          });

          SL.data.templates.teamTemplatesCallbacks.length = 0;
        }).fail(function () {
          SL.data.templates.teamTemplatesLoading = false;
          SL.notify(SL.locale.get('Templates.load_err'), 'negative');
        });
      } else if (SL.data.templates.teamTemplatesLoading) {
        SL.data.templates.teamTemplatesCallbacks.push(callback);
      } else {
        callback.call(null, SL.data.templates.teamTemplates);
      }
    }
  },

  /**
   * Resize Layout Template
   *
   * @function
   * @param {HTMLElement|*} $slide
   * @param {boolean} isRemoveAttrMethod
   */
  layoutTemplate: function($slide, isRemoveAttrMethod) {
    $slide.find('.sl-block').each(function(index, blockElement) {
      blockElement = $(blockElement);

      var method = blockElement.attr('data-layout-method');

      if (method &&
        typeof SL.data.templates.LAYOUT_METHODS[method] === "function") {
        if (!isRemoveAttrMethod) {
          blockElement.removeAttr('data-layout-method');
        }

        SL.data.templates.LAYOUT_METHODS[method]($slide, blockElement);
      }
    });
  },

  /**
   * Templatize
   *
   * @function
   * @param {HTMLElement|*} $slide
   * @param {Object|*} options
   * @returns {*}
   */
  templatize: function($slide, options) {
    $slide = $($slide);

    options = $.extend({
      placeholderText: false,
      zIndex: true
    }, options);

    var sectionStr =
        SL.editor.controllers.Serialize.getSlideAsString($slide, {
          templatize: true,
          inner:      true
        }),
      $section = $('<section>' + sectionStr + '</section>');

    $section.children().each(function(index, block) {
      block = $(block);
      block.css({
        'min-width':  '',
        'min-height': ''
      });

      var $blockContent = block.find('.sl-block-content');

      if (options.placeholderText &&
        block.attr('data-block-type') === 'text' &&
        $blockContent.children().length === 1) {
        var $content = $($blockContent.children()[0]);

        if ($content.is('h1, h2')) {
          $content.html('Title Text');
          $blockContent.attr('data-placeholder-text', 'Title Text');
        } else if ($content.is('p')) {
          $blockContent.attr('data-placeholder-text', $content.text().trim());
        }
      }

      if (options.zIndex === false) {
        $blockContent.css('z-index', '');
      }
    });

    [
      'class',
      'data-autoslide',
      'data-transition',
      'data-transition-speed',
      'data-background',
      'data-background-color',
      'data-background-image',
      'data-background-size'
    ].forEach(function(attr) {
        if ($slide.attr(attr)) {
          $section.attr(attr, $slide.attr(attr));
        }
      });

    $section.removeClass('past present future');

    return $section.prop('outerHTML').trim();
  }
};


/*!
 * project name: SlideStudio
 * name:         tokens.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/18
 */

'use strict';

SL('data').tokens = {
  cache:     {},
  callbacks: {},

  /**
   * Create SL.data.tokens
   *
   * @function
   * @param {String|Number|*} deckId   -The Deck Id
   * @param {Function}        callback -Create Callback
   */
  create: function(deckId, callback) {
    callback = $.extend({
      success: function() {},
      error: function() {}
    }, callback);

    SL.data.tokens.get(deckId, {
      success: (function(result) {
        $.ajax({
          type: 'POST',
          context: this,
          url: SL.config.AJAX_ACCESS_TOKENS_CREATE(deckId),
          data: {
            access_token: {
              name: result.getUniqueName('Link', 'name', true)
            }
          }
        }).done(function(data) {
          callback.success.call(null, result.create(data));
        }).fail(function() {
          callback.error.call();
        });
      }).bind(this),
      error: (function() {
        console.warn('Failed to load token collection for deck ' + deckId);
      }).bind(this)
    });
  },

  /**
   * @function
   * @param {String|Number|*} deckId    -The Deck Id
   * @param {Function}        successCB -The Success Callback
   * @param {Function}        errorCB   -The Fail Callback
   * @private
   */
  _addCallbacks: function(deckId, successCB, errorCB) {
    if (!this.callbacks[deckId]) {
      this.callbacks[deckId] = {success: [], error: []};
    }

    if (successCB) {
      this.callbacks[deckId].success.push(successCB);
    }

    if (errorCB) {
      this.callbacks[deckId].error.push(errorCB);
    }
  },

  /**
   * @function
   * @param {String|Number|*} deckId    -The Deck Id
   * @param {Object|*}        tokens
   * @private
   */
  _triggerSuccessCallback: function(deckId, tokens) {
    var callback = this.callbacks[deckId];

    if (callback) {
      for (; callback.success.length; ) {
        callback.success.pop().call(null, tokens);
      }

      callback.success = [];
      callback.error   = [];
    }
  },

  /**
   * @function
   * @param {String|Number|*} deckId    -The Deck Id
   * @param {Object|String|*} status
   * @private
   */
  _triggerErrorCallback: function(deckId, status) {
    var callback = this.callbacks[deckId];

    if (callback) {
      for (; callback.error.length; ) {
        callback.error.pop().call(null, status);
      }

      callback.success = [];
      callback.error   = [];
    }
  },

  /**
   * @function
   * @param {String|Number|*} deckId    -The Deck Id
   * @param {Function} callback
   */
  get: function(deckId, callback) {
    callback = callback || {};

    this._addCallbacks(deckId, callback.success, callback.error);

    if (typeof this.cache[deckId] === "object") {
      this._triggerSuccessCallback(deckId, this.cache[deckId]);
    } else if (this.cache[deckId] !== 'loading') {
      this.cache[deckId] = 'loading';

      $.ajax({
        type: 'GET',
        context: this,
        url: SL.config.AJAX_ACCESS_TOKENS_LIST(deckId)
      }).done(function (data) {
        var tokens =
          new SL.collections.Collection(
            data.results,
            SL.models.AccessToken);

        this.cache[deckId] = tokens;
        this._triggerSuccessCallback(deckId, tokens);
      }).fail(function (err) {
        delete this.cache[deckId];
        this._triggerErrorCallback(deckId, err.status);
      });
    }
  }
};


/*!
 * project name: SlideStudio
 * name:         util.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/7/17
 */

'use strict';

SL.util = {
  /**
   * Get Url Query string array
   *
   * @function
   * @returns {Array} Query key-value
   */
  getQuery: function () {
    var query = {};

    location.search.replace(/[A-Z0-9]+?=([\w%]*)/gi, function (word) {
      query[word.split('=').shift()] =
        window.unescape(word.split('=').pop());
    });

    return query;
  },

  /**
   * Get Language
   *
   * @function
   * @returns {String|*} Language Type String('zh', 'en')
   */
  getLanguage: function () {
    if (!!SLConfig && !!SLConfig.language) {
      return SLConfig.language;
    } else {
      var language = window.navigator.userLanguage || window.navigator.language;
      return language;//.split("-")[0];
    }
  },

  /**
   * Get Meta Keyboard Name
   *
   * @function
   * @returns {string} Return Meta Keyboard Name
   */
  getMetaKeyName: function () {
    return SL.util.device.isMac() ? '&#8984' : 'CTRL';
  },

  /**
   * Reserved characters in HTML must be replaced with character entities.
   * Characters, not present on your keyboard, can also be replaced by
   * entities.
   *
   * @function
   * @param {String} htmlStr -The Html String
   * @returns {string|*} Return Changed Html String
   */
  escapeHTMLEntities: function (htmlStr) {
    htmlStr = htmlStr || '';
    htmlStr = htmlStr.split('<').join('&lt;');
    htmlStr = htmlStr.split('>').join('&gt;');

    return htmlStr;
  },

  /**
   * Get Html Node Value
   *
   * @function
   * @param {String} htmlStr -The Html String
   * @returns {String} Return Html Node Value
   */
  unescapeHTMLEntities: function (htmlStr) {
    var div = document.createElement('div'), nodeValue = '';
    div.innerHTML = htmlStr || '';

    if (div.childNodes.length !== 0) {
      nodeValue = div.childNodes[0].nodeValue;
    }

    return nodeValue || '';
  },

  /**
   * Return Convert Array
   *
   * @function
   * @param {Array|Object} obj -The Needed Converted Object
   * @returns {Array} Return Convert Array
   */
  toArray: function (obj) {
    var ary = [];

    for (var i = 0; i < obj.length; i += 1) {
      ary.push(obj[i]);
    }

    return ary;
  },

  /**
   * Set Element classes 'no-transition'
   *
   * @function
   * @param {Element} element -The Dom Element
   * @param {Number} delay -The Time Delay
   */
  skipCSSTransitions: function (element, delay) {
    element = $(element ? element : 'html');

    var type = typeof element.get(0);


    if (type === "undefined" || type === "number") {
      console.warn('Bad target for skipCSSTransitions.');
    }

    element.addClass('no-transition');

    setTimeout(function () {
      element.removeClass('no-transition');
    }, delay || 1);
  },

  /**
   * Setup Reveal
   *
   * @function
   * @param {Object} options -The Config of Reveal
   */
  setupReveal: function (options) {
    if (typeof window.Reveal !== "undefined") {
      var config = {

        controls:           true,
        progress:           true,
        history:            false,
        mouseWheel:         false,
        margin:             0.05,
        autoSlideStoppable: true,
        dependencies: [{
          src: SL.config.ASSET_URLS['reveal.js/marked.js'],
          condition: function () {
            return !!document.querySelector('.reveal [data-markdown]');
          }
        }, {
          src: SL.config.ASSET_URLS['reveal.js/markdown.js'],
          condition: function () {
            return !!document.querySelector('.reveal [data-markdown]');
          }
        }, {
          src: SL.config.ASSET_URLS['reveal.js/highlight.js'],
          async: true,
          condition: function () {
            return !!document.querySelector('.reveal pre code');
          },
          callback: function () {
            window.hljs.initHighlighting();
            window.hljs.initHighlightingOnLoad();
          }
        }]
      };

      if (SLConfig && SLConfig.deck) {
        config.autoSlide            = SLConfig.deck.auto_slide_interval || 0;
        config.rollingLinks         = SLConfig.deck.rolling_links;
        config.center               = SLConfig.deck.center;
        config.loop                 = SLConfig.deck.should_loop;
        config.rtl                  = SLConfig.deck.rtl;
        config.showNotes            = SLConfig.deck.share_notes;
        config.transition           = SLConfig.deck.transition || 'default';
        config.backgroundTransition = SLConfig.deck.background_transition;
      }

      $.extend(config, options);
      SL.util.deck.injectNotes();

      window.Reveal.initialize(config);
      window.Reveal.addEventListener('ready', function () {
        window.STATUS = window.STATUS || {};
        window.STATUS.REVEAL_IS_READY = true;
        $('html').addClass('reveal-is-ready');
      });

      if (options && options.openLinksInTabs) {
        this.openLinksInTabs($('.reveal .slides'));
      }

      if (options && options.trackEvents) {
        var progressAry = [];

        window.Reveal.addEventListener('slidechanged', function () {
          var progress = window.Reveal.getProgress();

          if (progress >= 0.5 && !progressAry[0]) {
            progressAry[0] = true;
            SL.analytics.trackPresenting('Presentation progress: 50%');
          }

          if (progress >= 1 && !progressAry[1]) {
            progressAry[1] = true;
            SL.analytics.trackPresenting('Presentation progress: 100%');
          }

          SL.analytics.trackCurrentSlide();
        });
      }
    }
  },

  /**
   * Open Links In Tabs
   *
   * @function
   * @param {Element|jquery} $element -The Tab Link Element
   */
  openLinksInTabs: function ($element) {
    if ($element) {
      $element.find('a').each(function () {
        var $link = $(this), href = $link.attr('href');

        if (!(/^#/gi.test(href) === true || this.hasAttribute('download'))) {
          $link.removeAttr('target');
        } else if (/http|www/gi.test(href)) {
          $link.attr('target', '_blank');
        } else {
          $link.attr('target', '_top');
        }
      });
    }
  },

  /**
   * Open New Window
   *
   * @function
   * @param {String} url     -The url Of Window Open
   * @param {String} winName -The Name Of Window
   * @param {Number} width   -The Width Of Window
   * @param {Number} height  -The Height Of Window
   * @returns {Window} Return Window
   */
  openPopupWindow: function (url, winName, width, height) {
    var left = screen.width / 2 - width / 2,
      top = screen.height / 2 - height / 2;
    return window.open(
      url,
      winName,
      'toolbar=no, location=no, directories=no, status=no, ' +
      'menubar=no, scrollbars=no, resizable=no, copyhistory=no, ' +
      'width=' + width + ', height=' + height + ', ' +
      'top=' + top + ', left=' + left);
  },

  /**
   * @function
   * @param {Object} sopts
   * @param {String} cls
   */
  prefixSelectorsInStyle : function (sopts, cls) {
    var selectors = [];

    SL.util.toArray(sopts.sheet.cssRules).forEach(function (rules) {
      if (rules.type === 1 && rules.selectorText && rules.cssText) {
        var cssText = rules.cssText;
        cssText = cssText.replace(rules.selectorText, '');
        cssText = cssText.trim();
        cssText = cssText.slice(1, cssText.length - 1);
        cssText = cssText.trim();
        cssText = cssText.split(';').map(function (word) {
          word = word.trim();

          if (word === '') {
            return '';
          } else {
            return '\n	' + word;
          }
        }).join(';');

        var selectorText = rules.selectorText.split(',').map(function (word) {
          word = word.trim();

          if (word.indexOf(cls) === 0) {
            return word;
          } else {
            return cls + word;
          }
        }).join(', ');

        selectors.push(selectorText + ' {' + cssText + '\n}');
      } else {
        if (rules.type === 7 && rules.cssText) {
          selectors.push(rules.cssText);
        }
      }
    });

    sopts.innerHTML = '\n' + selectors.join('\n\n') + '\n';
  },

  /**
   * Set Time Resize Reveal.layout Timer
   *
   * @function
   * @param {Number} timeoutDelay -Stop resize Reveal.layout Time
   * @param {Number} intervalDelay -Time Delay of Reveal.layout
   */
  layoutReveal: function (timeoutDelay, intervalDelay) {
    clearInterval(this.revealLayoutInterval);
    clearTimeout(this.revealLayoutTimeout);

    if (arguments.length === 1) {
      this.revealLayoutTimeout = setTimeout(window.Reveal.layout, timeoutDelay);
    } else {
      if (arguments.length !== 2) {
        throw 'Illegal arguments, expected (duration[, fps])';
      }

      this.revealLayoutInterval =
        setInterval(window.Reveal.layout, intervalDelay);
      this.revealLayoutTimeout = setTimeout((function () {
        clearInterval(this.revealLayoutInterval);
      }).bind(this), timeoutDelay);
    }
  },

  /**
   * Get The Current Slide Reveal Element Bounds
   *
   * @function
   * @param {Element} curSlide -The Current Slide Reveal Element
   * @param {boolean} absolutely -Is Get Absolutely Bounds
   * @returns {{x: number, y: number, width: number, height: number}}
   *     The Current Slide Reveal Element Bounds
   */
  getRevealSlideBounds: function (curSlide, absolutely) {
    curSlide = curSlide || SL.editor.controllers.Markup.getCurrentSlide();

    var offset  = curSlide.offset(),
      scale     = window.Reveal.getScale(),
      scaleLeft = offset.left * scale,
      scaleTop  = offset.top * scale;

    if (absolutely) {
      var pOffset = $('.projector').offset();

      if (pOffset) {
        scaleLeft -= pOffset.left;
        scaleTop  -= pOffset.top;
      }
    }

    return {
      x:      scaleLeft,
      y:      scaleTop,
      width:  curSlide.outerWidth() * scale,
      height: curSlide.outerHeight() * scale
    };
  },

  /**
   * Get Reveal Element Bounds
   *
   * @function
   * @param {boolean} absolutely -Is Get Absolutely Bounds
   * @returns {{x: number, y: number, width: number, height: number}}
   *     The Reveal Element Bounds
   */
  getRevealSlidesBounds: function (absolutely) {
    var $reveal = $('.reveal .slides'),
      offset    = $reveal.offset(),
      scale     = window.Reveal.getScale(),
      scaleLeft = offset.left * scale,
      scaleTop  = offset.top * scale;

    if (absolutely) {
      var pOffset = $('.projector').offset();

      if (pOffset) {
        scaleLeft -= pOffset.left;
        scaleTop  -= pOffset.top;
      }
    }

    return {
      x:      scaleLeft,
      y:      scaleTop,
      width:  $reveal.outerWidth() * scale,
      height: $reveal.outerHeight() * scale
    };
  },

  /**
   * Get Reveal Dom Element Offset Point
   *
   * @function
   * @param {Element} element -Reveal Dom Element
   * @param {boolean} noMargin -Is Contain Margin
   * @returns {{x: number, y: number}} The Reveal Element Offset
   */
  getRevealElementOffset: function (element, noMargin) {
    element = $(element);

    var offset = {x: 0, y: 0};

    if (element.parents('section').length) {
      for (; element.length && !element.is('section');) {
        offset.x += element.get(0).offsetLeft;
        offset.y += element.get(0).offsetTop;

        if (noMargin) {
          offset.x -= parseInt(element.css('margin-left'), 10);
          offset.y -= parseInt(element.css('margin-top'), 10);
        }

        element = $(element.get(0).offsetParent);
      }
    }

    return offset;
  },

  /**
   * Get Reveal Dom Element Global Offset Point
   *
   * @function
   * @param {Element} element -Reveal Dom Element
   * @returns {{x: number, y: number}} The Reveal Element Global Offset
   */
  getRevealElementGlobalOffset: function (element) {
    element = $(element);

    var $reveal = element.closest('.reveal'),
      offset = {x: 0, y: 0};

    if (element.length && $reveal.length) {
      var config = window.Reveal.getConfig(),
        scale = window.Reveal.getScale(),
        clientRect = $reveal.get(0).getBoundingClientRect(),
        center = {
          x: clientRect.left + clientRect.width / 2,
          y: clientRect.top + clientRect.height / 2
        },
        scaleW = config.width * scale,
        scaleH = config.height * scale;

      offset.x = center.x - scaleW / 2;
      offset.y = center.y - scaleH / 2;

      var $section = element.closest('.slides section');

      if ($section.length) {
        offset.y -= $section.scrollTop() * scale;
      }

      var elementOffset = SL.util.getRevealElementOffset(element);

      offset.x += elementOffset.x * scale;
      offset.y += elementOffset.y * scale;
    }

    return offset;
  },

  /**
   * Get Reveal Scale
   *
   * @function
   * @returns {number} Reveal Scale
   */
  getRevealCounterScale: function () {
    return window.Reveal ? 2 - window.Reveal.getScale() : 1;
  },

  /**
   * Convert Global Coordinate To Reveal Coordinate
   *
   * @function
   * @param {Number} x -Global Coordinate X.
   * @param {Number} y -Global Coordinate Y.
   * @returns {{x: number, y: number}} Converted Coordinate
   */
  globalToRevealCoordinate: function (x, y) {
    var bounds = SL.util.getRevealSlideBounds(),
      scale = SL.util.getRevealCounterScale();

    return {
      x: (x - bounds.x) * scale,
      y: (y - bounds.y) * scale
    };
  },

  /**
   * Convert Global Coordinate To Projector Coordinate
   *
   * @function
   * @param {Number} x -Global Coordinate X.
   * @param {Number} y -Global Coordinate Y.
   * @returns {{x: *, y: *}} Converted Coordinate
   */
  globalToProjectorCoordinate: function (x, y) {
    var coordinate = {x: x, y: y},
      offset = $('.projector').offset();

    if (offset) {
      coordinate.x -= offset.left;
      coordinate.y -= offset.top;
    }

    return coordinate;
  },

  /**
   * Hide Address Bar
   *
   * @function
   */
  hideAddressBar: function () {
    function orientationChange() {
      window.setTimeout(function () {
        window.scrollTo(0, 1);
      }, 10);
    }

    if (SL.util.device.IS_PHONE &&
      !/crios/gi.test(navigator.userAgent)) {

      $(window).on('orientationchange', function () {
        orientationChange();
      });

      orientationChange();
    }
  },

  /**
   * This is same to apply and call function
   *
   * @function
   */
  callback: function () {
    if (typeof arguments[0] === "function") {
      arguments[0].apply(null, [].slice.call(arguments, 1));
    }
  },

  /**
   * Get Placeholder Image
   *
   * @function
   * @param {boolean} unique -Is unique
   * @returns {string} Image Data string
   */
  getPlaceholderImage: function (unique) {
    var str = '';

    if (unique && typeof window.btoa === "function") {
      str = window.btoa(Math.random().toString()).replace(/=/g, '');
    }

    return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///' +
      'yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' + str;
  },

  /**
   * Get this evt is input\textarea\[contenteditable] trigger
   *
   * @function
   * @param {Event} evt -The input event
   * @returns {boolean|*|jQuery} True is trigger, is or not.
   */
  isTypingEvent: function (evt) {
    return $(evt.target)
      .is('input:not([type="file"]), textarea, [contenteditable]');
  }
};


/*!
 * project name: SlideStudio
 * name:         user.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/7/16
 */

'use strict';

SL.util.user = {
  /**
   * Get current have user login
   *
   * @function
   * @returns {boolean} True is user login, False or not.
   */
  isLoggedIn: function () {
    return typeof SLConfig === "object" &&
      typeof SLConfig.current_user === "object";
  },

  /**
   * Get user is pro
   *
   * @function
   * @returns {boolean} True is user pro, False or not.
   */
  isPro: function () {
    return SL.util.user.isLoggedIn() ?
      !!SLConfig.current_user.pro : false;
  },

  /**
   * Get user is enterprise
   *
   * @function
   * @returns {boolean} True is user enterprise, False or not.
   */
  isEnterprise: function () {
    return SL.util.user.isLoggedIn() ?
      !!SLConfig.current_user.enterprise : false;
  },

  /**
   * Get Can User Custom Css
   * @returns {*|boolean}
   */
  canUseCustomCSS : function () {
    return this.isLoggedIn() && this.isPro();
  }
};


/*!
 * project name: SlideStudio
 * name:         device.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/7/17
 */

'use strict';

SL.util.device    = {
  HAS_TOUCH: !!('ontouchstart' in window),
  IS_PHONE:  /iphone|ipod|android|windows\sphone/gi.test(navigator.userAgent),
  IS_TABLET: /ipad/gi.test(navigator.userAgent),

  /**
   * Get is or not Mac system
   *
   * @function
   * @returns {boolean} True is mac,is or not.
   */
  isMac: function () {
    return /Mac/.test(navigator.platform);
  },

  /**
   * Get is or not Windows system
   *
   * @function
   * @returns {boolean} True is Windows,is or not.
   */
  isWindows: function () {
    return /Win/g.test(navigator.platform);
  },

  /**
   * Get is or not Linux system
   *
   * @function
   * @returns {boolean} True is Linux,is or not.
   */
  isLinux: function () {
    return /Linux/g.test(navigator.platform);
  },

  /**
   * Get is or not IE browser
   *
   * @function
   * @returns {boolean} True is IE,is or not.
   */
  isIE: function () {
    return /MSIE\s[0-9]/gi.test(navigator.userAgent) ||
      /Trident\/7.0;(.*)rv:\d\d/.test(navigator.userAgent);
  },

  /**
   * Get is or not Chrome browser
   *
   * @function
   * @returns {boolean} True is Chrome,is or not.
   */
  isChrome: function () {
    return /chrome/gi.test(navigator.userAgent);
  },

  /**
   * Get is or not Safari browser
   *
   * @function
   * @returns {boolean} True is Safari,is or not.
   */
  isSafari: function () {
    return /safari/gi.test(navigator.userAgent) && !SL.util.device.isChrome();
  },

  /**
   * Get is or not Safari Desktop browser
   *
   * @function
   * @returns {boolean} True is Safari Desktop,is or not.
   */
  isSafariDesktop: function () {
    return SL.util.device.isSafari() &&
      !SL.util.device.isChrome() &&
      !SL.util.device.IS_PHONE &&
      !SL.util.device.IS_TABLET;
  },

  /**
   * Get is or not Opera browser
   *
   * @function
   * @returns {boolean} True is Opera,is or not.
   */
  isOpera: function () {
    return !!window.opera;
  },

  /**
   * Get is or not Firefox browser
   *
   * @function
   * @returns {boolean} True is Firefox,is or not.
   */
  isFirefox: function () {
    return /firefox\/\d+\.?\d+/gi.test(navigator.userAgent);
  },

  /**
   * Get is or not PhantomJS browser test context
   *
   * @function
   * @returns {boolean} True is PhantomJS browser test context,is or not.
   */
  isPhantomJS: function () {
    return /PhantomJS/gi.test(navigator.userAgent);
  },

  /**
   * Test Run Context is supported by editor.
   *
   * @function
   * @returns {boolean} True supported,False or not.
   */
  supportedByEditor: function () {
    return !!window.Modernizr.history &&
      !!window.Modernizr.csstransforms && !SL.util.device.isOpera();
  },

  /**
   * Get Scroll Bar Width
   *
   * @function
   * @returns {number} Return Scroll Bar Width
   */
  getScrollBarWidth: function () {
    var $div = $('<div>').css({
      width:    '100px',
      height:   '100px',
      overflow: 'scroll',
      position: 'absolute',
      top:      '-9999px'
    });

    $div.appendTo(document.body);

    var width = $div.prop('offsetWidth') - $div.prop('clientWidth');
    $div.remove();

    return width;
  }
};


/*!
 * project name: SlideStudio
 * name:         trig.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/7/16
 */

'use strict';

SL.util.trig = {
  /**
   * Calculate between Point-1 and Point-2 distance
   *
   * @function
   * @param {Point} pt1 -The first point
   * @param {Point} pt2 -The second point
   * @returns {number}
   */
  distanceBetween: function (pt1, pt2) {
    var dx = pt1.x - pt2.x, dy = pt1.y - pt2.y;
    return Math.sqrt(dx * dx + dy * dy);
  },

  /**
   * Calculate the area of between Bound-1 and Bound-2 intersection.
   *
   * @function
   * @param {Rect} bounds1 -The first bounds
   * @param {Rect} bounds2 -The second bounds
   * @returns {{width: number, height: number}}
   *     Intersection area width and height
   */
  intersection: function (bounds1, bounds2) {
    return {
      width:
        Math.max(
          0,
          Math.min(
            bounds1.x + bounds1.width,
            bounds2.x + bounds2.width) - Math.max(bounds1.x, bounds2.x)),
      height:
        Math.max(
          0,
          Math.min(
            bounds1.y + bounds1.height,
            bounds2.y + bounds2.height) - Math.max(bounds1.y, bounds2.y))
    };
  },

  /**
   * Calculate the scaled bounds-1 is in bounds-2?
   *
   * @function
   * @param {Rect} bounds1 -The first bounds
   * @param {Rect} bounds2 -The second bounds
   * @param {Number} scale -Scale ratio
   * @returns {boolean}
   */
  intersects: function (bounds1, bounds2, scale) {
    if (typeof scale === "undefined") {
      scale = 0;
    }

    var intersection = SL.util.trig.intersection(bounds1, bounds2);

    return intersection.width > bounds1.width * scale &&
      intersection.height > bounds1.height * scale;
  }
};


/*!
 * project name: SlideStudio
 * name:         string.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/7/17
 */

'use strict';

SL.util.string = {
  uniqueIDCount: 0,
  SCRIPT_TAG_REGEX: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  URL_REGEX: /((https?\:\/\/)|(www\.)|(\/\/))(\S+)(\w{2,4})(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/i,

  /**
   * Generate the unique id
   *
   * @function
   * @param {String|Number} ID -The input ID
   * @returns {string} Return the unique id
   */
  uniqueID: function (ID) {
    SL.util.string.uniqueIDCount += 1;
    return (ID || '') + SL.util.string.uniqueIDCount + '-' + Date.now();
  },

  /**
   * Trim String Special Characters
   *
   * @function
   * @param {String} str -The input string
   * @returns {String|*} The result of string
   */
  slug: function (str) {
    if (typeof str === "string") {
      str = SL.util.string.trim(str);
      str = str.toLowerCase();
      str = str.replace(/-/g, ' ');
      str = str.replace(/[^\w\s]/g, '');
      str = str.replace(/\s{2,}/g, ' ');
      str = str.replace(/\s/g, '-');

      return str;
    } else {
      return '';
    }
  },

  /**
   * Trim string spaces
   *
   * @function
   * @param {String} str -The input string
   * @returns {String|*} The result of string
   */
  trim: function (str) {
    return SL.util.string.trimRight(SL.util.string.trimLeft(str));
  },

  /**
   * Trim string left spaces
   *
   * @function
   * @param {String} str -The input string
   * @returns {String|*} The result of string
   */
  trimLeft: function (str) {
    if (typeof str === "string") {
      return str.replace(/^\s+/, '');
    } else {
      return '';
    }
  },

  /**
   * Trim string right spaces
   *
   * @function
   * @param {String} str -The input string
   * @returns {String|*} The result of string
   */
  trimRight: function (str) {
    if (typeof str === "string") {
      return str.replace(/\s+$/, '');
    } else {
      return '';
    }
  },

  /**
   * According input string return document link
   *
   * @function
   * @param {String} str -The url string
   * @returns {Element|*} Return element string
   */
  linkify: function (str) {
    if (str) {
      str = str.replace(/((https?\:\/\/)|(www\.))(\S+)(\w{2,4})(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/gi, function (word) {
        var w = word;

        if (!w.match('^https?://')) {
          w = 'http://' + w;
        }

        return '<a href="' + w + '">' + word + '</a>';
      });
    }

    return str;
  },

  /**
   * Concat str1 and str2 if cantact is true
   *
   * @function
   * @param {String} str1 -The first string
   * @param {String} str2 -The second string
   * @param {boolean} contact -Is concat str2
   * @returns {String|*} Return concat string
   */
  pluralize: function (str1, str2, contact) {
    return contact ? str1 + str2 : str1;
  },

  /**
   * Get Custom Classes From Less
   *
   * @function
   * @param {String} str -Less string
   * @returns {Array} Classes list array
   */
  getCustomClassesFromLESS: function (str) {
    var ary = (str || '').match(/\/\/=[a-z0-9-_ \t]{2,}(?=\n)?/gi);

    if (ary) {
      return ary.map(function (word) {
        word = word.replace('//=', '');
        word = word.trim();
        word = word.toLowerCase();
        word = word.replace(/\s/g, '-');

        return word;
      });
    } else {
      return [];
    }
  }
};


/*!
 * project name: SlideStudio
 * name:         validate.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/7/16
 */

'use strict';

SL.util.validate = {
  /**
   * @function
   * @returns {Array}
   */
  name: function () {
    return [];
  },

  /**
   * Validate input name string is right?
   *
   * @function
   * @param {String} str -Name string
   * @returns {Array} Error message
   */
  slug: function (str) {
    str = str || '';

    var msg = [];

    if (str.length < 2) {
      msg.push(SL.locale.get('Validate.at_least', {num: '2'}));
    } else if (/\s/gi.test(str)) {
      msg.push(SL.locale.get('Validate.no_spaces'));
    } else if (!/^[\w-_]+$/gi.test(str)) {
      msg.push(SL.locale.get('Validate.only_contain'));
    }

    return msg;
  },

  /**
   * Validate input user name string is right?
   *
   * @function
   * @param {String} str -Name string
   * @returns {*|{least, spaces, contain}} Error message
   */
  username: function (str) {
    return SL.util.validate.slug(str);
  },

  /**
   * Validate input team name string is right?
   *
   * @function
   * @param {String} str -Name string
   * @returns {*|{least, spaces, contain}} Error message
   */
  teamSlug: function (str) {
    return SL.util.validate.slug(str);
  },

  /**
   * Validate input password string is right?
   *
   * @function
   * @param {String} str -Password string
   * @returns {Array} Error message
   */
  password: function (str) {
    str = str || '';

    var msg = [];

    if (str.length < 6) {
      msg.push(SL.locale.get('Validate.at_least', {num: '6'}));
    }

    return msg;
  },

  /**
   * Validate input email address string is right?
   *
   * @function
   * @param {String} str -Email Address String
   * @returns {Array} Error message
   */
  email: function (str) {
    str = str || '';

    var msg = [];

    if (!/^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$/gi.test(str)) {
      msg.push(SL.locale.get('Validate.email_err'));
    }

    return msg;
  },

  /**
   * Validate input twitter string is right?
   *
   * @function
   * @param {String} str -twitter String
   * @returns {Array} Error message
   */
  twitterHandle: function (str) {
    str = str || '';

    var msg = [];

    if (str.length > 15) {
      msg.push(SL.locale.get('Validate.max_char', {num: '15'}));
    } else if (/\s/gi.test(str)) {
      msg.push(SL.locale.get('Validate.no_spaces'));
    } else if (!/^[\w-_]+$/gi.test(str)) {
      msg.push(SL.locale.get('Validate.only_contain'));
    }

    return msg;
  },

  /**
   * Validate input URL string is right?
   *
   * @function
   * @param {String} str -URL String
   * @returns {Array} Error message
   */
  url: function (str) {
    str = str || '';

    var msg = [];

    if (str.length < 4) {
      msg.push(SL.locale.get('Validate.url_err'));
    } else if (/\s/gi.test(str)) {
      msg.push(SL.locale.get('Validate.no_spaces'));
    }

    return msg;
  },

  /**
   * Validate input deck title string is right?
   *
   * @function
   * @param {String} str -Title String
   * @returns {Array} Error message
   */
  deckTitle: function (str) {
    str = str || '';

    var msg = [];

    if (str.length === 0) {
      msg.push(SL.locale.get('Validate.no_empty'));
    }

    return msg;
  },

  /**
   * Validate input deck string is right?
   *
   * @function
   * @param  {String} str -String
   * @returns {*} Error message
   */
  deckSlug: function (str) {
    return SL.util.validate.deckTitle(str);
  },

  /**
   * Validate input Google Analytics Id String is right?
   *
   * @function
   * @param {String} str -Google Analytics Id String
   * @returns {Array} Error message
   */
  googleAnalyticsId: function (str) {
    str = str || '';

    var msg = [];

    if (/\bUA-\d{4,20}-\d{1,10}\b/gi.test(str)) {
      msg.push('Please enter a valid ID');
    }

    return msg;
  },

  /**
   * @function
   * @returns {Array}
   */
  none: function () {
    return [];
  }
};


/*!
 * project name: SlideStudio
 * name:         dom.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/7/17
 */

'use strict';

SL.util.dom = {
  /**
   * scrollIntoView
   *
   * @function
   * @param {Element} dom -The dom element
   */
  scrollIntoViewIfNeeded: function (dom) {
    if (dom) {
      if (typeof dom.scrollIntoViewIfNeeded === "function") {
        dom.scrollIntoViewIfNeeded.apply(
          dom,
          [].slice.call(arguments, 1));
      } else if (typeof dom.scrollIntoView === "function") {
        dom.scrollIntoView();
      }
    }
  },

  /**
   * Insert CSRF
   *
   * @function
   * @param {Element} $element -The dom element
   * @param {String} csrf -csrf string
   */
  insertCSRF: function ($element, csrf) {
    if (typeof csrf === "undefined") {
      csrf = $('meta[name="csrf-token"]').attr('content');
    }

    if (csrf) {
      $element.find('input[name="authenticity_token"]').remove();
      $element
        .append('<input name="authenticity_token" type="hidden" value="' +
        csrf + '" />');
    }
  },

  /**
   * Get calculated style opacity
   *
   * @function
   * @param {Element} element -The dom element
   * @returns {Number|*} Calculated Opacity
   */
  calculateStyle: function (element) {
    var style = window.getComputedStyle($(element).get(0));

    if (style) {
      return style.opacity;
    }
  }
};


/*!
 * project name: SlideStudio
 * name:         deck.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/7/17
 */

'use strict';

SL.util.deck = {
  idCounter: 1,

  /**
   * Inject theme css and user css
   *
   * @function
   */
  sortInjectedStyles: function () {
    var $head = $('head');

    $('#theme-css-output').appendTo($head);
    $('#user-css-output').appendTo($head);
  },

  /**
   * Generate unique Id
   *
   * @function
   * @param {String} queryStr -The Selector String
   */
  generateIdentifiers: function (queryStr) {
    $(queryStr || '.reveal .slides section').each(function () {
      if (this.hasAttribute('data-id') === false ||
        this.getAttribute('data-id').length === 0) {
        var id = window.CryptoJS.MD5(
          ['slide',
            SL.current_user.get('id'),
            SL.current_deck.get('id'),
            Date.now(),
            SL.util.deck.idCounter].join('-')).toString();

        SL.util.deck.idCounter += 1;

        this.setAttribute('data-id', id);
      }
    });
  },

  /**
   * Inject Notes
   *
   * @function
   */
  injectNotes: function () {
    if (SLConfig.deck && SLConfig.deck.notes) {
      [].forEach.call(
        document.querySelectorAll('.reveal .slides section'),
        function (element) {
          var note = SLConfig.deck.notes[element.getAttribute('data-id')];

          if (note && typeof note === "string") {
            element.setAttribute('data-notes', note);
          }
        });
    }
  },

  /**
   * Get Background Color
   *
   * @function
   * @returns {String|*} Color String
   */
  getBackgroundColor: function () {
    var $viewport = $('.reveal-viewport');

    if ($viewport.length) {
      var color = $viewport.css('background-color');

      if (window.Reveal && window.Reveal.isReady()) {
        var indices  = window.Reveal.getIndices(),
          background = window.Reveal.getSlideBackground(indices.h, indices.v);

        if (background) {
          var backgroundClr = background.style.backgroundColor;

          if (backgroundClr &&
            window.tinycolor(backgroundClr).getAlpha() > 0) {
            color = backgroundClr;
          }
        }
      }

      if (color) {
        return color;
      }
    }

    return '#ffffff';
  },

  /**
   * Get Background Color Contrast
   *
   * @function
   * @returns {*|number} The Contrast
   */
  getBackgroundContrast: function () {
    return SL.util.color.getContrast(SL.util.deck.getBackgroundColor());
  },

  /**
   * Get Background Color Brightness
   *
   * @function
   * @returns {*|number} The Brightness
   */
  getBackgroundBrightness: function () {
    return SL.util.color.getBrightness(SL.util.deck.getBackgroundColor());
  }
};


/*!
 * project name: SlideStudio
 * name:         color.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/7/16
 */

'use strict';

SL.util.color = {
  /**
   * Get Hex Color Value Contrast
   *
   * @function
   * @param {Number|Hex} hexClr -Hex Color Value
   * @returns {number}
   */
  getContrast: function (hexClr) {
    var rgb = window.tinycolor(hexClr).toRgb(),
      contrast = (299 * rgb.r + 587 * rgb.g + 114 * rgb.b) / 1e3;

    return contrast / 255;
  },

  /**
   * Get Hex Color Value Brightness
   *
   * @function
   * @param {Number|Hex} hexClr -Hex Color Value
   * @returns {number}
   */
  getBrightness: function (hexClr) {
    var rgb = window.tinycolor(hexClr).toRgb(),
      brightness =
        rgb.r / 255 * 0.3 + rgb.g / 255 * 0.59 + (rgb.b / 255 + 0.11);

    return brightness / 2;
  }
};


/*!
 * project name: SlideStudio
 * name:         anim.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/7/16
 */

'use strict';

SL.util.anim = {
  /**
   * Close List Tab User Animate
   *
   * @function
   * @param {Element}   listItem   -List Item
   * @param {Function}  completeCb -Close Complete Callback
   * @param {Data|Time} duration   -Delay Time To Close
   */
  collapseListItem: function (listItem, completeCb, duration) {
    listItem = $(listItem);
    listItem.addClass('no-transition');
    listItem.css('overflow', 'hidden');
    listItem.animate({
      opacity:       0,
      height:        0,
      minHeight:     0,
      paddingTop:    0,
      paddingBottom: 0,
      marginTop:     0,
      marginBottom:  0
    }, {
      duration: duration || 500,
      complete: completeCb
    });
  }
};


/*!
 * project name: SlideStudio
 * name:         selection.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/7/17
 */

'use strict';

SL.util.selection = {
  clear : function () {
    if (window.getSelection) {
      if (window.getSelection().empty) {
        window.getSelection().empty();
      } else {
        if (window.getSelection().removeAllRanges) {
          window.getSelection().removeAllRanges();
        }
      }
    }
  },

  /**
   * Set element to select
   *
   * @function
   * @param {Element} $element -The dom element
   */
  moveCursorToEnd: function ($element) {
    if ($element) {
      $element.focus();

      var range = document.createRange();

      range.selectNodeContents($element);
      range.collapse(false);

      var selection = window.getSelection();

      selection.removeAllRanges();
      selection.addRange(range);
    }
  },

  /**
   * Select text
   *
   * @function
   * @param {Element} $element -The dom element
   */
  selectText: function ($element) {
    var textRange = null, selection = null;

    if (document.body.createTextRange) {
      textRange = document.body.createTextRange();
      textRange.moveToElementText($element);
      textRange.select();
    } else if (window.getSelection) {
      selection = window.getSelection();
      textRange = document.createRange();
      textRange.selectNodeContents($element);
      selection.removeAllRanges();
      selection.addRange(textRange);
    }
  },

  /**
   * Get selected element
   *
   * @function
   * @returns {Element|null} Return Current selected
   */
  getSelectedElement: function () {
    var selection = window.getSelection();

    if (selection && selection.anchorNode) {
      return selection.anchorNode.parentNode;
    } else {
      return null;
    }
  },

  /**
   * Get Current Selected Tags
   *
   * @function
   * @returns {Array} Return Tags Array
   */
  getSelectedTags: function () {
    var tags = [],
      selectedElements = SL.util.selection.getSelectedElement();

    if (selectedElements) {
      for (; selectedElements;) {
        tags.push(selectedElements.nodeName.toLowerCase());
        selectedElements = selectedElements.parentNode;
      }
    }

    return tags;
  },

  /**
   * Get Selected Element inner html
   *
   * @function
   * @returns {String|*} The inner html string
   */
  getSelectedHTML: function () {
    var range = null;

    if (document.selection && document.selection.createRange) {
      range = document.selection.createRange();

      return range.htmlText;
    }

    if (window.getSelection) {
      var selection = window.getSelection();

      if (selection.rangeCount > 0) {
        range = selection.getRangeAt(0);

        var contents = range.cloneContents(),
          div = document.createElement('div');

        div.appendChild(contents);

        return div.innerHTML;
      }
    }

    return '';
  }
};


/*!
 * project name: SlideStudio
 * name:         svg.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/7/16
 */

'use strict';

SL.util.svg = {
  NAMESPACE: 'http://www.w3.org/2000/svg',
  SYMBOLS: {
    happy: '<path d="M16 32c8.837 0 16-7.163 16-16s-7.163-16-16-16-16 7.163-16 16 7.163 16 16 16zM16 3c7.18 0 13 5.82 13 13s-5.82 13-13 13-13-5.82-13-13 5.82-13 13-13zM16 18.711c3.623 0 7.070-0.963 10-2.654-0.455 5.576-4.785 9.942-10 9.942-5.215 0-9.544-4.371-10-9.947 2.93 1.691 6.377 2.658 10 2.658zM8 11c0-1.657 0.895-3 2-3s2 1.343 2 3c0 1.657-0.895 3-2 3-1.105 0-2-1.343-2-3zM20 11c0-1.657 0.895-3 2-3s2 1.343 2 3c0 1.657-0.895 3-2 3-1.105 0-2-1.343-2-3z"></path>',
    smiley: '<path d="M16 32c8.837 0 16-7.163 16-16s-7.163-16-16-16-16 7.163-16 16 7.163 16 16 16zM16 3c7.18 0 13 5.82 13 13s-5.82 13-13 13-13-5.82-13-13 5.82-13 13-13zM8 10c0-1.105 0.895-2 2-2s2 0.895 2 2c0 1.105-0.895 2-2 2-1.105 0-2-0.895-2-2zM20 10c0-1.105 0.895-2 2-2s2 0.895 2 2c0 1.105-0.895 2-2 2-1.105 0-2-0.895-2-2zM22.003 19.602l2.573 1.544c-1.749 2.908-4.935 4.855-8.576 4.855s-6.827-1.946-8.576-4.855l2.573-1.544c1.224 2.036 3.454 3.398 6.003 3.398s4.779-1.362 6.003-3.398z"></path>',
    wondering: '<path d="M16 32c8.837 0 16-7.163 16-16s-7.163-16-16-16-16 7.163-16 16 7.163 16 16 16zM16 3c7.18 0 13 5.82 13 13s-5.82 13-13 13-13-5.82-13-13 5.82-13 13-13zM23.304 18.801l0.703 2.399-13.656 4-0.703-2.399zM8 10c0-1.105 0.895-2 2-2s2 0.895 2 2c0 1.105-0.895 2-2 2-1.105 0-2-0.895-2-2zM20 10c0-1.105 0.895-2 2-2s2 0.895 2 2c0 1.105-0.895 2-2 2-1.105 0-2-0.895-2-2z"></path>',
    sad: '<path d="M16 32c8.837 0 16-7.163 16-16s-7.163-16-16-16-16 7.163-16 16 7.163 16 16 16zM16 3c7.18 0 13 5.82 13 13s-5.82 13-13 13-13-5.82-13-13 5.82-13 13-13zM8 10c0-1.105 0.895-2 2-2s2 0.895 2 2c0 1.105-0.895 2-2 2-1.105 0-2-0.895-2-2zM20 10c0-1.105 0.895-2 2-2s2 0.895 2 2c0 1.105-0.895 2-2 2-1.105 0-2-0.895-2-2zM9.997 24.398l-2.573-1.544c1.749-2.908 4.935-4.855 8.576-4.855 3.641 0 6.827 1.946 8.576 4.855l-2.573 1.544c-1.224-2.036-3.454-3.398-6.003-3.398-2.549 0-4.779 1.362-6.003 3.398z"></path>',
    "checkmark-circle": '<path d="M16 0c-8.836 0-16 7.164-16 16s7.164 16 16 16 16-7.164 16-16-7.164-16-16-16zM13.52 23.383l-7.362-7.363 2.828-2.828 4.533 4.535 9.617-9.617 2.828 2.828-12.444 12.445z"></path>',
    "plus-circle": '<path d="M16 0c-8.836 0-16 7.164-16 16s7.164 16 16 16 16-7.164 16-16-7.164-16-16-16zM24 18h-6v6h-4v-6h-6v-4h6v-6h4v6h6v4z"></path>',
    "minus-circle": '<path d="M16 0c-8.836 0-16 7.164-16 16s7.164 16 16 16 16-7.164 16-16-7.164-16-16-16zM24 18h-16v-4h16v4z"></path>',
    "x-circle": '<path d="M16 0c-8.836 0-16 7.164-16 16s7.164 16 16 16 16-7.164 16-16-7.164-16-16-16zM23.914 21.086l-2.828 2.828-5.086-5.086-5.086 5.086-2.828-2.828 5.086-5.086-5.086-5.086 2.828-2.828 5.086 5.086 5.086-5.086 2.828 2.828-5.086 5.086 5.086 5.086z"></path>',
    denied: '<path d="M16 0c-8.836 0-16 7.164-16 16s7.164 16 16 16 16-7.164 16-16-7.164-16-16-16zM16 4c2.59 0 4.973 0.844 6.934 2.242l-16.696 16.688c-1.398-1.961-2.238-4.344-2.238-6.93 0-6.617 5.383-12 12-12zM16 28c-2.59 0-4.973-0.844-6.934-2.242l16.696-16.688c1.398 1.961 2.238 4.344 2.238 6.93 0 6.617-5.383 12-12 12z"></path>',
    clock: '<path d="M16 4c6.617 0 12 5.383 12 12s-5.383 12-12 12-12-5.383-12-12 5.383-12 12-12zM16 0c-8.836 0-16 7.164-16 16s7.164 16 16 16 16-7.164 16-16-7.164-16-16-16v0zM21.422 18.578l-3.422-3.426v-7.152h-4.023v7.992c0 0.602 0.277 1.121 0.695 1.492l3.922 3.922 2.828-2.828z"></path>',
    "heart-stroke": '<path d="M23.113 6c2.457 0 4.492 1.82 4.836 4.188l-11.945 13.718-11.953-13.718c0.344-2.368 2.379-4.188 4.836-4.188 2.016 0 3.855 2.164 3.855 2.164l3.258 3.461 3.258-3.461c0 0 1.84-2.164 3.855-2.164zM23.113 2c-2.984 0-5.5 1.578-7.113 3.844-1.613-2.266-4.129-3.844-7.113-3.844-4.903 0-8.887 3.992-8.887 8.891v0.734l16.008 18.375 15.992-18.375v-0.734c0-4.899-3.984-8.891-8.887-8.891v0z"></path>',
    "heart-fill": '<path d="M16 5.844c-1.613-2.266-4.129-3.844-7.113-3.844-4.903 0-8.887 3.992-8.887 8.891v0.734l16.008 18.375 15.992-18.375v-0.734c0-4.899-3.984-8.891-8.887-8.891-2.984 0-5.5 1.578-7.113 3.844z"></path>',
    home: '<path d="M16 0l-16 16h4v16h24v-16h4l-16-16zM24 28h-6v-6h-4v6h-6v-14.344l8-5.656 8 5.656v14.344z"></path>',
    pin: '<path d="M17.070 2.93c-3.906-3.906-10.234-3.906-14.141 0-3.906 3.904-3.906 10.238 0 14.14 0.001 0 7.071 6.93 7.071 14.93 0-8 7.070-14.93 7.070-14.93 3.907-3.902 3.907-10.236 0-14.14zM10 14c-2.211 0-4-1.789-4-4s1.789-4 4-4 4 1.789 4 4-1.789 4-4 4z"></path>',
    user: '<path d="M12 16c-6.625 0-12 5.375-12 12 0 2.211 1.789 4 4 4h16c2.211 0 4-1.789 4-4 0-6.625-5.375-12-12-12zM6 6c0-3.314 2.686-6 6-6s6 2.686 6 6c0 3.314-2.686 6-6 6-3.314 0-6-2.686-6-6z"></path>',
    mail: '<path d="M15.996 15.457l16.004-7.539v-3.918h-32v3.906zM16.004 19.879l-16.004-7.559v15.68h32v-15.656z"></path>',
    star: '<path d="M22.137 19.625l9.863-7.625h-12l-4-12-4 12h-12l9.875 7.594-3.875 12.406 10.016-7.68 9.992 7.68z"></path>',
    bolt: '<path d="M32 0l-24 16 6 4-14 12 24-12-6-4z"></path>',
    sun: '<path d="M16.001 8c-4.418 0-8 3.582-8 8s3.582 8 8 8c4.418 0 7.999-3.582 7.999-8s-3.581-8-7.999-8v0zM14 2c0-1.105 0.895-2 2-2s2 0.895 2 2c0 1.105-0.895 2-2 2-1.105 0-2-0.895-2-2zM4 6c0-1.105 0.895-2 2-2s2 0.895 2 2c0 1.105-0.895 2-2 2-1.105 0-2-0.895-2-2zM2 14c1.105 0 2 0.895 2 2 0 1.107-0.895 2-2 2s-2-0.893-2-2c0-1.105 0.895-2 2-2zM4 26c0-1.105 0.895-2 2-2s2 0.895 2 2c0 1.105-0.895 2-2 2-1.105 0-2-0.895-2-2zM14 30c0-1.109 0.895-2 2-2 1.108 0 2 0.891 2 2 0 1.102-0.892 2-2 2-1.105 0-2-0.898-2-2zM24 26c0-1.105 0.895-2 2-2s2 0.895 2 2c0 1.105-0.895 2-2 2-1.105 0-2-0.895-2-2zM30 18c-1.104 0-2-0.896-2-2 0-1.107 0.896-2 2-2s2 0.893 2 2c0 1.104-0.896 2-2 2zM24 6c0-1.105 0.895-2 2-2s2 0.895 2 2c0 1.105-0.895 2-2 2-1.105 0-2-0.895-2-2z"></path>',
    moon: '<path d="M24.633 22.184c-8.188 0-14.82-6.637-14.82-14.82 0-2.695 0.773-5.188 2.031-7.363-6.824 1.968-11.844 8.187-11.844 15.644 0 9.031 7.32 16.355 16.352 16.355 7.457 0 13.68-5.023 15.648-11.844-2.18 1.254-4.672 2.028-7.367 2.028z"></path>',
    cloud: '<path d="M24 10c-0.379 0-0.738 0.061-1.102 0.111-1.394-2.465-3.972-4.111-6.898-4.111-2.988 0-5.566 1.666-6.941 4.1-0.352-0.047-0.704-0.1-1.059-0.1-4.41 0-8 3.588-8 8 0 4.414 3.59 8 8 8h16c4.41 0 8-3.586 8-8 0-4.412-3.59-8-8-8zM24 22h-16c-2.207 0-4-1.797-4-4 0-2.193 1.941-3.885 4.004-3.945 0.008 0.943 0.172 1.869 0.5 2.744l3.746-1.402c-0.168-0.444-0.25-0.915-0.25-1.397 0-2.205 1.793-4 4-4 1.293 0 2.465 0.641 3.199 1.639-1.929 1.461-3.199 3.756-3.199 6.361h4c0-2.205 1.793-4 4-4s4 1.795 4 4c0 2.203-1.793 4-4 4z"></path>',
    rain: '<path d="M23.998 6c-0.375 0-0.733 0.061-1.103 0.111-1.389-2.465-3.969-4.111-6.895-4.111-2.987 0-5.565 1.666-6.94 4.1-0.353-0.047-0.705-0.1-1.060-0.1-4.41 0-8 3.588-8 8s3.59 8 8 8h15.998c4.414 0 8-3.588 8-8s-3.586-8-8-8zM23.998 18h-15.998c-2.207 0-4-1.795-4-4 0-2.193 1.941-3.885 4.004-3.945 0.009 0.943 0.172 1.869 0.5 2.744l3.746-1.402c-0.168-0.444-0.25-0.915-0.25-1.397 0-2.205 1.793-4 4-4 1.293 0 2.465 0.641 3.199 1.639-1.928 1.461-3.199 3.756-3.199 6.361h4c0-2.205 1.795-4 3.998-4 2.211 0 4 1.795 4 4s-1.789 4-4 4zM3.281 29.438c-0.75 0.75-1.969 0.75-2.719 0s-0.75-1.969 0-2.719 5.438-2.719 5.438-2.719-1.969 4.688-2.719 5.438zM11.285 29.438c-0.75 0.75-1.965 0.75-2.719 0-0.75-0.75-0.75-1.969 0-2.719 0.754-0.75 5.438-2.719 5.438-2.719s-1.965 4.688-2.719 5.438zM19.28 29.438c-0.75 0.75-1.969 0.75-2.719 0s-0.75-1.969 0-2.719 5.437-2.719 5.437-2.719-1.968 4.688-2.718 5.438z"></path>',
    umbrella: '<path d="M16 0c-8.82 0-16 7.178-16 16h4c0-0.826 0.676-1.5 1.5-1.5 0.828 0 1.5 0.674 1.5 1.5h4c0-0.826 0.676-1.5 1.5-1.5 0.828 0 1.5 0.674 1.5 1.5v10c0 1.102-0.895 2-2 2-1.102 0-2-0.898-2-2h-4c0 3.309 2.695 6 6 6 3.312 0 6-2.691 6-6v-10c0-0.826 0.676-1.5 1.5-1.5 0.828 0 1.498 0.674 1.498 1.5h4c0-0.826 0.68-1.5 1.5-1.5 0.828 0 1.5 0.674 1.5 1.5h4c0-8.822-7.172-16-15.998-16z"></path>',
    eye: '<path d="M16 4c-8.836 0-16 11.844-16 11.844s7.164 12.156 16 12.156 16-12.156 16-12.156-7.164-11.844-16-11.844zM16 24c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8zM12 16c0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.209-1.791 4-4 4-2.209 0-4-1.791-4-4z"></path>',
    ribbon: '<path d="M8 20c-1.41 0-2.742-0.289-4-0.736v12.736l4-4 4 4v-12.736c-1.258 0.447-2.59 0.736-4 0.736zM0 8c0-4.418 3.582-8 8-8s8 3.582 8 8c0 4.418-3.582 8-8 8-4.418 0-8-3.582-8-8z"></path>',
    iphone: '<path d="M16 0h-8c-4.418 0-8 3.582-8 8v16c0 4.418 3.582 8 8 8h8c4.418 0 8-3.582 8-8v-16c0-4.418-3.582-8-8-8zM12 30.062c-1.139 0-2.062-0.922-2.062-2.062s0.924-2.062 2.062-2.062 2.062 0.922 2.062 2.062-0.923 2.062-2.062 2.062zM20 24h-16v-16c0-2.203 1.795-4 4-4h8c2.203 0 4 1.797 4 4v16z"></path>',
    camera: '<path d="M16 20c0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.209-1.791 4-4 4-2.209 0-4-1.791-4-4zM28 8l-3.289-6.643c-0.27-0.789-1.016-1.357-1.899-1.357h-5.492c-0.893 0-1.646 0.582-1.904 1.385l-3.412 6.615h-8.004c-2.209 0-4 1.791-4 4v20h32v-20c0-2.209-1.789-4-4-4zM6 16c-1.105 0-2-0.895-2-2s0.895-2 2-2 2 0.895 2 2-0.895 2-2 2zM20 28c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8z"></path>',
    cog: '<path d="M32 17.969v-4l-4.781-1.992c-0.133-0.375-0.273-0.738-0.445-1.094l1.93-4.805-2.829-2.828-4.762 1.961c-0.363-0.176-0.734-0.324-1.117-0.461l-2.027-4.75h-4l-1.977 4.734c-0.398 0.141-0.781 0.289-1.16 0.469l-4.754-1.91-2.828 2.828 1.938 4.711c-0.188 0.387-0.34 0.781-0.485 1.188l-4.703 2.011v4l4.707 1.961c0.145 0.406 0.301 0.801 0.488 1.188l-1.902 4.742 2.828 2.828 4.723-1.945c0.379 0.18 0.766 0.324 1.164 0.461l2.023 4.734h4l1.98-4.758c0.379-0.141 0.754-0.289 1.113-0.461l4.797 1.922 2.828-2.828-1.969-4.773c0.168-0.359 0.305-0.723 0.438-1.094l4.782-2.039zM15.969 22c-3.312 0-6-2.688-6-6s2.688-6 6-6 6 2.688 6 6-2.688 6-6 6z"></path>',
    lock: '<path d="M14 0c-5.508 0-9.996 4.484-9.996 10v2h-4.004v14c0 3.309 2.691 6 6 6h12c3.309 0 6-2.691 6-6v-16c0-5.516-4.488-10-10-10zM11.996 24c-1.101 0-1.996-0.895-1.996-2s0.895-2 1.996-2c1.105 0 2 0.895 2 2s-0.894 2-2 2zM20 12h-11.996v-2c0-3.309 2.691-6 5.996-6 3.309 0 6 2.691 6 6v2z"></path>',
    unlock: '<path d="M14.004 0c-5.516 0-9.996 4.484-9.996 10h3.996c0-3.309 2.688-6 6-6 3.305 0 5.996 2.691 5.996 6v2h-20v14c0 3.309 2.695 6 6 6h12c3.305 0 6-2.691 6-6v-16c0-5.516-4.488-10-9.996-10zM12 24c-1.102 0-2-0.895-2-2s0.898-2 2-2c1.109 0 2 0.895 2 2s-0.891 2-2 2z"></path>',
    fork: '<path d="M20 0v3.875c0 1.602-0.625 3.109-1.754 4.238l-11.316 11.254c-1.789 1.785-2.774 4.129-2.883 6.633h-4.047l6 6 6-6h-3.957c0.105-1.438 0.684-2.773 1.711-3.805l11.316-11.25c1.891-1.89 2.93-4.398 2.93-7.070v-3.875h-4zM23.953 26c-0.109-2.504-1.098-4.848-2.887-6.641l-2.23-2.215-2.836 2.821 2.242 2.23c1.031 1.027 1.609 2.367 1.715 3.805h-3.957l6 6 6-6h-4.047z"></path>',
    paperclip: '<path d="M17.293 15.292l-2.829-2.829-4 4c-1.953 1.953-1.953 5.119 0 7.071 1.953 1.953 5.118 1.953 7.071 0l10.122-9.879c3.123-3.124 3.123-8.188 0-11.313-3.125-3.124-8.19-3.124-11.313 0l-11.121 10.88c-4.296 4.295-4.296 11.26 0 15.557 4.296 4.296 11.261 4.296 15.556 0l6-6-2.829-2.829-5.999 6c-2.733 2.732-7.166 2.732-9.9 0-2.733-2.732-2.733-7.166 0-9.899l11.121-10.881c1.562-1.562 4.095-1.562 5.656 0 1.563 1.563 1.563 4.097 0 5.657l-10.121 9.879c-0.391 0.391-1.023 0.391-1.414 0s-0.391-1.023 0-1.414l4-4z"></path>',
    facebook: '<path d="M17.996 32h-5.996v-16h-4v-5.514l4-0.002-0.007-3.248c0-4.498 1.22-7.236 6.519-7.236h4.412v5.515h-2.757c-2.064 0-2.163 0.771-2.163 2.209l-0.008 2.76h4.959l-0.584 5.514-4.37 0.002-0.004 16z"></path>',
    twitter: '<path d="M32 6.076c-1.177 0.522-2.443 0.875-3.771 1.034 1.355-0.813 2.396-2.099 2.887-3.632-1.269 0.752-2.674 1.299-4.169 1.593-1.198-1.276-2.904-2.073-4.792-2.073-3.626 0-6.565 2.939-6.565 6.565 0 0.515 0.058 1.016 0.17 1.496-5.456-0.274-10.294-2.888-13.532-6.86-0.565 0.97-0.889 2.097-0.889 3.301 0 2.278 1.159 4.287 2.921 5.465-1.076-0.034-2.088-0.329-2.974-0.821-0.001 0.027-0.001 0.055-0.001 0.083 0 3.181 2.263 5.834 5.266 6.437-0.551 0.15-1.131 0.23-1.73 0.23-0.423 0-0.834-0.041-1.235-0.118 0.835 2.608 3.26 4.506 6.133 4.559-2.247 1.761-5.078 2.81-8.154 2.81-0.53 0-1.052-0.031-1.566-0.092 2.905 1.863 6.356 2.95 10.064 2.95 12.076 0 18.679-10.004 18.679-18.68 0-0.285-0.006-0.568-0.019-0.849 1.283-0.926 2.396-2.082 3.276-3.398z"></path>',
    earth: '<path d="M27.314 4.686c3.022 3.022 4.686 7.040 4.686 11.314s-1.664 8.292-4.686 11.314c-3.022 3.022-7.040 4.686-11.314 4.686s-8.292-1.664-11.314-4.686c-3.022-3.022-4.686-7.040-4.686-11.314s1.664-8.292 4.686-11.314c3.022-3.022 7.040-4.686 11.314-4.686s8.292 1.664 11.314 4.686zM25.899 25.9c1.971-1.971 3.281-4.425 3.821-7.096-0.421 0.62-0.824 0.85-1.073-0.538-0.257-2.262-2.335-0.817-3.641-1.621-1.375 0.927-4.466-1.802-3.941 1.276 0.81 1.388 4.375-1.858 2.598 1.079-1.134 2.050-4.145 6.592-3.753 8.946 0.049 3.43-3.504 0.715-4.729-0.422-0.824-2.279-0.281-6.262-2.434-7.378-2.338-0.102-4.344-0.314-5.25-2.927-0.545-1.87 0.58-4.653 2.584-5.083 2.933-1.843 3.98 2.158 6.731 2.232 0.854-0.894 3.182-1.178 3.375-2.18-1.805-0.318 2.29-1.517-0.173-2.199-1.358 0.16-2.234 1.409-1.512 2.467-2.632 0.614-2.717-3.809-5.247-2.414-0.064 2.206-4.132 0.715-1.407 0.268 0.936-0.409-1.527-1.594-0.196-1.379 0.654-0.036 2.854-0.807 2.259-1.325 1.225-0.761 2.255 1.822 3.454-0.059 0.866-1.446-0.363-1.713-1.448-0.98-0.612-0.685 1.080-2.165 2.573-2.804 0.497-0.213 0.973-0.329 1.336-0.296 0.752 0.868 2.142 1.019 2.215-0.104-1.862-0.892-3.915-1.363-6.040-1.363-3.051 0-5.952 0.969-8.353 2.762 0.645 0.296 1.012 0.664 0.39 1.134-0.483 1.439-2.443 3.371-4.163 3.098-0.893 1.54-1.482 3.238-1.733 5.017 1.441 0.477 1.773 1.42 1.464 1.736-0.734 0.64-1.185 1.548-1.418 2.541 0.469 2.87 1.818 5.515 3.915 7.612 2.644 2.644 6.16 4.1 9.899 4.1s7.255-1.456 9.899-4.1z"></path>',
    globe: '<path d="M15 2c-8.284 0-15 6.716-15 15s6.716 15 15 15c8.284 0 15-6.716 15-15s-6.716-15-15-15zM23.487 22c0.268-1.264 0.437-2.606 0.492-4h3.983c-0.104 1.381-0.426 2.722-0.959 4h-3.516zM6.513 12c-0.268 1.264-0.437 2.606-0.492 4h-3.983c0.104-1.381 0.426-2.722 0.959-4h3.516zM21.439 12c0.3 1.28 0.481 2.62 0.54 4h-5.979v-4h5.439zM16 10v-5.854c0.456 0.133 0.908 0.355 1.351 0.668 0.831 0.586 1.625 1.488 2.298 2.609 0.465 0.775 0.867 1.638 1.203 2.578h-4.852zM10.351 7.422c0.673-1.121 1.467-2.023 2.298-2.609 0.443-0.313 0.895-0.535 1.351-0.668v5.854h-4.852c0.336-0.94 0.738-1.803 1.203-2.578zM14 12v4h-5.979c0.059-1.38 0.24-2.72 0.54-4h5.439zM2.997 22c-0.533-1.278-0.854-2.619-0.959-4h3.983c0.055 1.394 0.224 2.736 0.492 4h-3.516zM8.021 18h5.979v4h-5.439c-0.3-1.28-0.481-2.62-0.54-4zM14 24v5.854c-0.456-0.133-0.908-0.355-1.351-0.668-0.831-0.586-1.625-1.488-2.298-2.609-0.465-0.775-0.867-1.638-1.203-2.578h4.852zM19.649 26.578c-0.673 1.121-1.467 2.023-2.298 2.609-0.443 0.312-0.895 0.535-1.351 0.668v-5.854h4.852c-0.336 0.94-0.738 1.802-1.203 2.578zM16 22v-4h5.979c-0.059 1.38-0.24 2.72-0.54 4h-5.439zM23.98 16c-0.055-1.394-0.224-2.736-0.492-4h3.516c0.533 1.278 0.855 2.619 0.959 4h-3.983zM25.958 10h-2.997c-0.582-1.836-1.387-3.447-2.354-4.732 1.329 0.636 2.533 1.488 3.585 2.54 0.671 0.671 1.261 1.404 1.766 2.192zM5.808 7.808c1.052-1.052 2.256-1.904 3.585-2.54-0.967 1.285-1.771 2.896-2.354 4.732h-2.997c0.504-0.788 1.094-1.521 1.766-2.192zM4.042 24h2.997c0.583 1.836 1.387 3.447 2.354 4.732-1.329-0.636-2.533-1.488-3.585-2.54-0.671-0.671-1.261-1.404-1.766-2.192zM24.192 26.192c-1.052 1.052-2.256 1.904-3.585 2.54 0.967-1.285 1.771-2.896 2.354-4.732h2.997c-0.504 0.788-1.094 1.521-1.766 2.192z"></path>',
    "thin-arrow-up": '<path d="M27.414 12.586l-10-10c-0.781-0.781-2.047-0.781-2.828 0l-10 10c-0.781 0.781-0.781 2.047 0 2.828s2.047 0.781 2.828 0l6.586-6.586v19.172c0 1.105 0.895 2 2 2s2-0.895 2-2v-19.172l6.586 6.586c0.39 0.39 0.902 0.586 1.414 0.586s1.024-0.195 1.414-0.586c0.781-0.781 0.781-2.047 0-2.828z"></path>',
    "thin-arrow-down": '<path d="M4.586 19.414l10 10c0.781 0.781 2.047 0.781 2.828 0l10-10c0.781-0.781 0.781-2.047 0-2.828s-2.047-0.781-2.828 0l-6.586 6.586v-19.172c0-1.105-0.895-2-2-2s-2 0.895-2 2v19.172l-6.586-6.586c-0.391-0.39-0.902-0.586-1.414-0.586s-1.024 0.195-1.414 0.586c-0.781 0.781-0.781 2.047 0 2.828z"></path>',
    "thin-arrow-up-left": '<path d="M4 18c0 1.105 0.895 2 2 2s2-0.895 2-2v-7.172l16.586 16.586c0.781 0.781 2.047 0.781 2.828 0 0.391-0.391 0.586-0.902 0.586-1.414s-0.195-1.024-0.586-1.414l-16.586-16.586h7.172c1.105 0 2-0.895 2-2s-0.895-2-2-2h-14v14z"></path>',
    "thin-arrow-up-right": '<path d="M26.001 4c-0 0-0.001 0-0.001 0h-11.999c-1.105 0-2 0.895-2 2s0.895 2 2 2h7.172l-16.586 16.586c-0.781 0.781-0.781 2.047 0 2.828 0.391 0.391 0.902 0.586 1.414 0.586s1.024-0.195 1.414-0.586l16.586-16.586v7.172c0 1.105 0.895 2 2 2s2-0.895 2-2v-14h-1.999z"></path>',
    "thin-arrow-left": '<path d="M12.586 4.586l-10 10c-0.781 0.781-0.781 2.047 0 2.828l10 10c0.781 0.781 2.047 0.781 2.828 0s0.781-2.047 0-2.828l-6.586-6.586h19.172c1.105 0 2-0.895 2-2s-0.895-2-2-2h-19.172l6.586-6.586c0.39-0.391 0.586-0.902 0.586-1.414s-0.195-1.024-0.586-1.414c-0.781-0.781-2.047-0.781-2.828 0z"></path>',
    "thin-arrow-right": '<path d="M19.414 27.414l10-10c0.781-0.781 0.781-2.047 0-2.828l-10-10c-0.781-0.781-2.047-0.781-2.828 0s-0.781 2.047 0 2.828l6.586 6.586h-19.172c-1.105 0-2 0.895-2 2s0.895 2 2 2h19.172l-6.586 6.586c-0.39 0.39-0.586 0.902-0.586 1.414s0.195 1.024 0.586 1.414c0.781 0.781 2.047 0.781 2.828 0z"></path>',
    "thin-arrow-down-left": '<path d="M18 28c1.105 0 2-0.895 2-2s-0.895-2-2-2h-7.172l16.586-16.586c0.781-0.781 0.781-2.047 0-2.828-0.391-0.391-0.902-0.586-1.414-0.586s-1.024 0.195-1.414 0.586l-16.586 16.586v-7.172c0-1.105-0.895-2-2-2s-2 0.895-2 2v14h14z"></path>',
    "thin-arrow-down-right": '<path d="M28 14c0-1.105-0.895-2-2-2s-2 0.895-2 2v7.172l-16.586-16.586c-0.781-0.781-2.047-0.781-2.828 0-0.391 0.391-0.586 0.902-0.586 1.414s0.195 1.024 0.586 1.414l16.586 16.586h-7.172c-1.105 0-2 0.895-2 2s0.895 2 2 2h14v-14z"></path>'
  },

  /**
   * Bounding svg to box
   *
   * @function
   * @param {Element} element -The Dom Element
   * @returns {Element|*} Return the svg path box
   */
  boundingBox: function (element) {
    var box;

    if ($(element).parents('body').length) {
      box = element.getBBox();
    } else {
      var parentNode = element.parentNode,
        svg = document.createElementNS(SL.util.svg.NAMESPACE, 'svg');

      svg.setAttribute('width', '0');
      svg.setAttribute('height', '0');
      svg.setAttribute(
        'style',
        'visibility: hidden; position: absolute; left: 0; top: 0;');
      svg.appendChild(element);

      document.body.appendChild(svg);

      box = element.getBBox();

      if (parentNode) {
        parentNode.appendChild(element);
      } else {
        svg.removeChild(element);
      }

      document.body.removeChild(svg);
    }

    return box;
  },

  /**
   * Convert point array to points string
   *
   * @function
   * @param points -Point array
   * @returns {string} The Points String
   */
  pointsToPolygon: function (points) {
    var ary = [];

    for (; points.length >= 2;) {
      ary.push(points.shift() + ',' + points.shift());
    }

    return ary.join(' ');
  },

  /**
   * Draw rect graph
   *
   * @function
   * @param {Number} width  -The rect of width
   * @param {Number} height -The rect of height
   * @returns {Element|*} Return svg graph(rect)
   */
  rect: function (width, height) {
    var svgRect =
      document.createElementNS(SL.util.svg.NAMESPACE, 'rect');

    svgRect.setAttribute('width', width);
    svgRect.setAttribute('height', height);

    return svgRect;
  },

  /**
   * Draw ellipse graph
   *
   * @function
   * @param {Number} width  -The ellipse of width
   * @param {Number} height -The ellipse of height
   * @returns {Element|*} Return svg graph(ellipse)
   */
  ellipse: function (width, height) {
    var svgEllipse =
      document.createElementNS(SL.util.svg.NAMESPACE, 'ellipse');

    svgEllipse.setAttribute('rx', width / 2);
    svgEllipse.setAttribute('ry', height / 2);
    svgEllipse.setAttribute('cx', width / 2);
    svgEllipse.setAttribute('cy', height / 2);

    return svgEllipse;
  },

  /**
   * Draw the triangle to the up
   *
   * @function
   * @param {Number} x -The center of x point
   * @param {Number} y -The center of y point
   * @returns {Element|*} Return svg graph(the triangle to the up)
   */
  triangleUp: function (x, y) {
    var svgTriangle =
      document.createElementNS(SL.util.svg.NAMESPACE, 'polygon');

    svgTriangle.setAttribute(
      'points',
      SL.util.svg.pointsToPolygon([x / 2, 0, x, y, 0, y]));

    return svgTriangle;
  },

  /**
   * Draw the triangle to the down
   *
   * @function
   * @param {Number} x -The center of x point
   * @param {Number} y -The center of y point
   * @returns {Element|*} Return svg graph(the triangle to the down)
   */
  triangleDown: function (x, y) {
    var svgTriangle =
      document.createElementNS(SL.util.svg.NAMESPACE, 'polygon');

    svgTriangle.setAttribute(
      'points',
      SL.util.svg.pointsToPolygon([0, 0, x, 0, x / 2, y]));

    return svgTriangle;
  },

  /**
   * Draw the triangle to the left
   *
   * @function
   * @param {Number} x -The center of x point
   * @param {Number} y -The center of y point
   * @returns {Element|*} Return svg graph(the triangle to the left)
   */
  triangleLeft: function (x, y) {
    var svgTriangle =
      document.createElementNS(SL.util.svg.NAMESPACE, 'polygon');

    svgTriangle.setAttribute(
      'points',
      SL.util.svg.pointsToPolygon([0, y / 2, x, 0, x, y]));

    return svgTriangle;
  },

  /**
   * Draw the triangle to the right
   *
   * @function
   * @param {Number} x -The center of x point
   * @param {Number} y -The center of y point
   * @returns {Element|*} Return svg graph(the triangle to the right)
   */
  triangleRight: function (x, y) {
    var svgTriangle =
      document.createElementNS(SL.util.svg.NAMESPACE, 'polygon');

    svgTriangle.setAttribute(
      'points',
      SL.util.svg.pointsToPolygon([x, y / 2, 0, y, 0, 0]));

    return svgTriangle;
  },

  /**
   * Draw the arrow to the up
   *
   * @function
   * @param {Number} x -The center of x point
   * @param {Number} y -The center of y point
   * @returns {Element|*} Return svg graph(the arrow to the up)
   */
  arrowUp: function (x, y) {
    var svgArrow =
      document.createElementNS(SL.util.svg.NAMESPACE, 'polygon');

    svgArrow.setAttribute(
      'points',
      SL.util.svg.pointsToPolygon([
        0.5 * x, 0,
        x, 0.5 * y,
        0.7 * x, 0.5 * y,
        0.7 * x, y,
        0.3 * x, y,
        0.3 * x, 0.5 * y,
        0, 0.5 * y,
        0.5 * x, 0]));

    return svgArrow;
  },

  /**
   * Draw the arrow to the down
   *
   * @function
   * @param {Number} x -The center of x point
   * @param {Number} y -The center of y point
   * @returns {Element|*} Return svg graph(the arrow to the down)
   */
  arrowDown: function (x, y) {
    var svgArrow =
      document.createElementNS(SL.util.svg.NAMESPACE, 'polygon');

    svgArrow.setAttribute(
      'points',
      SL.util.svg.pointsToPolygon([
        0.5 * x, y,
        x, 0.5 * y,
        0.7 * x, 0.5 * y,
        0.7 * x, 0,
        0.3 * x, 0,
        0.3 * x, 0.5 * y,
        0, 0.5 * y,
        0.5 * x, y]));

    return svgArrow;
  },

  /**
   * Draw the arrow to the left
   *
   * @function
   * @param {Number} x -The center of x point
   * @param {Number} y -The center of y point
   * @returns {Element|*} Return svg graph(the arrow to the left)
   */
  arrowLeft: function (x, y) {
    var svgArrow =
      document.createElementNS(SL.util.svg.NAMESPACE, 'polygon');

    svgArrow.setAttribute(
      'points',
      SL.util.svg.pointsToPolygon([
        x, 0.3 * y,
        0.5 * x, 0.3 * y,
        0.5 * x, 0,
        0, 0.5 * y,
        0.5 * x, y,
        0.5 * x, 0.7 * y,
        x, 0.7 * y,
        x, 0.3 * y]));

    return svgArrow;
  },

  /**
   * Draw the arrow to the right
   *
   * @function
   * @param {Number} x -The center of x point
   * @param {Number} y -The center of y point
   * @returns {Element|*} Return svg graph(the arrow to the right)
   */
  arrowRight: function (x, y) {
    var svgArrow =
      document.createElementNS(SL.util.svg.NAMESPACE, 'polygon');

    svgArrow.setAttribute(
      'points',
      SL.util.svg.pointsToPolygon([
        0, 0.3 * y,
        0.5 * x, 0.3 * y,
        0.5 * x, 0,
        x, 0.5 * y,
        0.5 * x, y,
        0.5 * x, 0.7 * y,
        0, 0.7 * y]));

    return svgArrow;
  },

  /**
   * Draw polygon, x/2, y/2 is center.
   *
   * @function
   * @param {Number} x -X Point
   * @param {Number} y -Y Point
   * @param {Number} num -Polygon border Number
   * @returns {Element|*} Return svg graph
   */
  polygon: function (x, y, num) {
    var pointsAry = [],
      svgPolygon =
        document.createElementNS(SL.util.svg.NAMESPACE, 'polygon');

    if (num === 3) {
      pointsAry = [x / 2, 0, x, y, 0, y];
    } else if (num > 3) {
      var centerX = x / 2,
        centerY = y / 2;

      for (var i = 0; i < num; i += 1) {
        var ptX = centerX + centerX * Math.cos(2 * Math.PI * i / num),
          ptY = centerY + centerY * Math.sin(2 * Math.PI * i / num);

        ptX = Math.round(10 * ptX) / 10;
        ptY = Math.round(10 * ptY) / 10;

        pointsAry.push(ptX);
        pointsAry.push(ptY);
      }
    }

    svgPolygon.setAttribute(
      'points',
      SL.util.svg.pointsToPolygon(pointsAry));

    return svgPolygon;
  },

  /**
   * Get svg symbol
   *
   * @function
   * @param {String} type -Symbol type string
   * @returns {Element|*} Return svg symbol
   */
  symbol: function (type) {
    var symbol = SL.util.svg.SYMBOLS[type],
      svg = document.createElementNS(SL.util.svg.NAMESPACE, 'g');

    if (symbol) {
      svg.innerSVG = symbol;
    }

    return svg;
  }
};


/*!
 * project name: SlideStudio
 * name:         html.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/7/17
 */

'use strict';

SL.util.html      = {
  ATTR_SRC_NORMAL:         'src',
  ATTR_SRC_SILENCED:       'data-silenced-src',
  ATTR_SRC_NORMAL_REGEX:   ' src=',
  ATTR_SRC_SILENCED_REGEX: ' data-silenced-src=',

  /**
   * Insert indent to html string
   *
   * @function
   * @param {String} htmlStr -HTML string
   * @returns {XML|*} Return indented xml
   */
  indent: function (htmlStr) {
    htmlStr = htmlStr.replace(/<br>/gi, '<br/>');
    htmlStr = htmlStr.replace(/(<img("[^"]*"|[^>])+)/gi, '$1/');

    var xml = window.vkbeautify.xml(htmlStr);

    xml = xml.replace(/<pre>[\n\r\t\s]+<code/gi, '<pre><code');
    xml = xml.replace(/<\/code>[\n\r\t\s]+<\/pre>/gi, '</code></pre>');

    return xml;
  },

  /**
   * Replace attr src= to data-silenced-src=
   *
   * @function
   * @param {String} str -The input string
   * @returns {string} Replaced String
   */
  muteSources: function (str) {
    return (str || '').replace(
      new RegExp(SL.util.html.ATTR_SRC_NORMAL_REGEX, 'gi'),
      SL.util.html.ATTR_SRC_SILENCED_REGEX);
  },

  /**
   * Replace attr data-silenced-src= to src=
   *
   * @function
   * @param {String} str -The input string
   * @returns {string} Replaced String
   */
  unmuteSources: function (str) {
    return (str || '').replace(
      new RegExp(SL.util.html.ATTR_SRC_SILENCED_REGEX, 'gi'),
      SL.util.html.ATTR_SRC_NORMAL_REGEX);
  },

  /**
   * Delete spaces the code
   *
   * @function
   * @param {Element} element -The dom element
   */
  trimCode: function (element) {
    $(element).find('pre code').each(function () {
      var $pre = $(this).parent('pre'),
        html = $pre.html(),
        trimHtml = $.trim(html);

      if (html !== trimHtml) {
        $pre.html(trimHtml);
      }
    });
  },

  /**
   * Remove the dom element attrs
   *
   * @function
   * @param {Element} element -The dom element
   * @param {Function} filter -The filter callback function
   */
  removeAttributes: function (element, filter) {
    element = $(element);

    var attrNames = $.map(element.get(0).attributes, function (attr) {
      return attr.name;
    });

    if (typeof filter === "function") {
      attrNames = attrNames.filter(filter);
    }

    $.each(attrNames, function (index, name) {
      element.removeAttr(name);
    });
  },

  /**
   * Remove the dom element of css classes
   *
   * @function
   * @param {Element} element -The dom element
   * @param {Function} filter -The filter callback function
   */
  removeClasses: function (element, filter) {
    element = $(element);

    if (typeof filter === "function") {
      var classes =
        (element.attr('class') || '').split(' ').filter(filter);

      element.removeClass(classes.join(' '));
    } else {
      element.attr('class', '');
    }
  },

  /**
   * Get the html string scripts element
   *
   * @function
   * @param {String} htmlStr -The html string
   * @returns {Element} The Scripts Element Array
   */
  findScriptTags: function (htmlStr) {
    var div = document.createElement('div');

    div.innerHTML = htmlStr;

    var scripts = SL.util.toArray(div.getElementsByTagName('script'));

    return scripts.map(function (script) {
      return script.outerHTML;
    });
  },

  /**
   * Remove the html string scripts element
   *
   * @function
   * @param {String} htmlStr -The html string
   * @returns {String|*} The removed string
   */
  removeScriptTags: function (htmlStr) {
    var div = document.createElement('div');
    div.innerHTML = htmlStr;

    var scripts = SL.util.toArray(div.getElementsByTagName('script'));
    scripts.forEach(function (script) {
      script.parentNode.removeChild(script);
    });

    return div.innerHTML;
  },

  /**
   * Create Process Spinner
   *
   * @function
   * @param {Object} options -The Spinner Options
   * @returns {Object|*} The Spinner Instance
   */
  createSpinner: function (options) {
    options = $.extend({
      lines:     12,
      radius:    8,
      length:    6,
      width:     3,
      color:     '#fff',
      zIndex:    'auto',
      left:      '0',
      top:       '0',
      className: ''
    }, options);

    return new window.Spinner(options);
  },

  /**
   * Create from html config Spinner
   *
   * @function
   */
  generateSpinners: function () {
    $('.spinner').each(function (index, item) {
      if (item.hasAttribute('data-spinner-state') === false) {
        item.setAttribute('data-spinner-state', 'spinning');

        var options = {};

        if (item.hasAttribute('data-spinner-color')) {
          options.color = item.getAttribute('data-spinner-color');
        }

        if (item.hasAttribute('data-spinner-lines')) {
          options.lines = parseInt(item.getAttribute('data-spinner-lines'), 10);
        }

        if (item.hasAttribute('data-spinner-width')) {
          options.width = parseInt(item.getAttribute('data-spinner-width'), 10);
        }

        if (item.hasAttribute('data-spinner-radius')) {
          options.radius = parseInt(item.getAttribute('data-spinner-radius'), 10);
        }

        if (item.hasAttribute('data-spinner-length')) {
          options.length = parseInt(item.getAttribute('data-spinner-length'), 10);
        }

        var spinner = SL.util.html.createSpinner(options);

        spinner.spin(item);
      }
    });
  },

  /**
   * Create Deck Thumbnail
   *
   * @function
   * @param {Object} config -The Parameters of thumbnail
   * @returns {*|jQuery|HTMLElement} Thumbnail document
   */
  createDeckThumbnail: function (config) {
    var options = {
        DECK_URL:       config.user.username + '/' + config.slug,
        DECK_VIEWS:     typeof config.view_count === "number" ? config.view_count : 'N/A',
        DECK_THUMB_URL: config.thumbnail_url || SL.config.DEFAULT_DECK_THUMBNAIL,
        USER_URL:       '/' + config.user.username,
        USER_NAME:      config.user.name || config.user.username,
        USER_THUMB_URL: config.user.thumbnail_url || SL.config.DEFAULT_USER_THUMBNAIL
      },
      thumbTemplate = SL.config.DECK_THUMBNAIL_TEMPLATE;

    for (var item in options) {
      thumbTemplate = thumbTemplate.replace('{{' + item + '}}', options[item]);
    }

    return $(thumbTemplate);
  }
};


if (typeof window.Spinner !== "undefined" &&
  typeof SL.util !== "undefined") {
  SL.util.html.generateSpinners();
}


/*!
 * project name: SlideStudio
 * name:         draganddrop.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/7/16
 */

'use strict';

SL.draganddrop = {
  /**
   * Constructor A Draganddrop Management Instance
   *
   * @constructor
   */
  init: function () {
    this.listeners = new SL.collections.Collection();

    this.onDragStart = this.onDragStart.bind(this);
    this.onDragOver  = this.onDragOver.bind(this);
    this.onDragOut   = this.onDragOut.bind(this);
    this.onDrop      = this.onDrop.bind(this);

    this.isListening    = false;
    this.isInternalDrag = false;
  },

  /**
   * Register A Group Of Drag Event Handles
   *
   * @function
   * @param {Object} handler -Event Handles Object
   */
  subscribe: function (handler) {
    this.listeners.push(handler);
    this.bind();
  },

  /**
   * Unregister A Group Of Drag Event Handles
   *
   * @function
   * @param {Object} handler -Event Handles Object
   */
  unsubscribe: function (handler) {
    this.listeners.remove(handler);

    if (this.listeners.isEmpty()) {
      this.unbind();
    }
  },

  /**
   * Run And Dispatch Event Handler
   *
   * @function
   * @param {String} evtName -Event name
   * @param {Event}  evt     -Pass to the handler Event Object
   */
  dispatch: function (evtName, evt) {
    var handler = this.listeners.last();

    if (handler) {
      handler[evtName](evt);
    }
  },

  /**
   * Bind Drag Events
   *
   * @function
   */
  bind: function () {
    if (this.isListening === false) {
      this.isListening = true;

      $(document.documentElement)
        .on('dragstart', this.onDragStart)
        .on('dragover dragenter', this.onDragOver)
        .on('dragleave', this.onDragOut)
        .on('drop', this.onDrop);
    }
  },

  /**
   * Unbind Drag Events
   *
   * @function
   */
  unbind: function () {
    if (this.isListening === true) {
      this.isListening = false;

      $(document.documentElement)
        .off('dragstart', this.onDragStart)
        .off('dragover dragenter', this.onDragOver)
        .off('dragleave', this.onDragOut)
        .off('drop', this.onDrop);
    }
  },

  /**
   * Inner Drag Start Event handler
   *
   * @function
   * @param {Event} evt -Event Object
   */
  onDragStart: function (evt) {
    evt.preventDefault();
    this.isInternalDrag = true;
  },

  /**
   * Inner Drag Over Event handler
   *
   * @function
   * @param {Event} evt -Event Object
   */
  onDragOver: function (evt) {
    if (!this.isInternalDrag) {
      evt.preventDefault();
      this.dispatch('onDragOver', evt);
    }
  },

  /**
   * Inner Drag Out Event handler
   *
   * @function
   * @param {Event} evt -Event Object
   */
  onDragOut: function (evt) {
    if (!this.isInternalDrag) {
      evt.preventDefault();
      this.dispatch('onDragOut', evt);
    }
  },

  /**
   * Inner Drop Event handler
   *
   * @function
   * @param {Event} evt -Event Object
   * @returns {boolean}
   */
  onDrop: function (evt) {
    if (!this.isInternalDrag) {
      this.isInternalDrag = false;
      this.dispatch('onDrop', evt);

      evt.stopPropagation();
      evt.preventDefault();

      return false;
    }
  }
};


/*!
 * project name: SlideStudio
 * name:         fonts.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/10
 */

'use strict';

SL.fonts = {
  INIT_TIMEOUT: 5000,
  FONTS_URL: '/public/fonts/',
  FAMILIES: {
    montserrat: {
      name: 'Montserrat',
      css: 'montserrat/montserrat.css'
    },
    opensans: {
      name: 'Open Sans',
      css: 'opensans/opensans.css'
    },
    lato: {
      name: 'Lato',
      css: 'lato/lato.css'
    },
    asul: {
      name: 'Asul',
      css: 'asul/asul.css'
    },
    josefinsans: {
      name: 'Josefin Sans',
      css: 'josefinsans/josefinsans.css'
    },
    league: {
      name: 'League Gothic',
      css: 'league/league_gothic.css'
    },
    merriweathersans: {
      name: 'Merriweather Sans',
      css: 'merriweathersans/merriweathersans.css'
    },
    overpass: {
      name: 'Overpass',
      css: 'overpass/overpass.css'
    },
    quicksand: {
      name: 'Quicksand',
      css: 'quicksand/quicksand.css'
    },
    cabinsketch: {
      name: 'Cabin Sketch',
      css: 'cabinsketch/cabinsketch.css'
    },
    newscycle: {
      name: 'News Cycle',
      css: 'newscycle/newscycle.css'
    },
    oxygen: {
      name: 'Oxygen',
      css: 'oxygen/oxygen.css'
    }
  },
  PACKAGES: {
    asul:         ['asul'],
    helvetica:    [],
    josefine:     ['josefinsans', 'lato'],
    league:       ['league', 'lato'],
    merriweather: ['merriweathersans', 'oxygen'],
    news:         ['newscycle', 'lato'],
    montserrat:   ['montserrat', 'opensans'],
    opensans:     ['opensans'],
    overpass:     ['overpass'],
    palatino:     [],
    quicksand:    ['quicksand', 'opensans'],
    sketch:       ['cabinsketch', 'oxygen']
  },

  /**
   * Constructor fonts Instance
   *
   * @function
   */
  init: function () {
    this._isReady  = false;
    this.ready     = new window.signals.Signal();
    this.debugMode = !!SL.util.getQuery().debug;

    $('link[data-application-font]').each(function () {
      var font = $(this).attr('data-application-font');

      if (SL.fonts.FAMILIES[font]) {
        SL.fonts.FAMILIES[font].loaded = true;
      }
    });

    if (typeof SLConfig ==='object' && SLConfig.deck) {
      var font = this.loadDeckFont(
        [SLConfig.deck.theme_font || SL.config.DEFAULT_THEME_FONT], {
          active:   this.onWebFontsActive.bind(this),
          inactive: this.onWebFontsInactive.bind(this)
        });

      if (font) {
        this.initTimeout = setTimeout((function () {
          if (this.debugMode) {
            console.log('SL.fonts', 'timed out');
          }

          this.finishLoading();
        }).bind(this), SL.fonts.INIT_TIMEOUT);
      } else {
        this.finishLoading();
      }
    } else {
      this.finishLoading();
    }
  },

  /**
   * Load Font
   *
   * @function
   * @param {Array}    packages -The Font Packages
   * @param {Object|*} options  -The Load Font Parameter
   * @returns {boolean} True is loaded, False or not.
   */
  load: function (packages, options) {
    var fonts = $.extend({
      custom: {
        families: [],
        urls:     []
      }
    }, options);

    packages.forEach(function (packName) {
      var families = SL.fonts.FAMILIES[packName];

      if (families) {
        if (!families.loaded) {
          families.loaded = true;
          fonts.custom.families.push(families.name);
          fonts.custom.urls.push(SL.fonts.FONTS_URL + families.css);
        }
      } else {
        console.warn('Could not find font family with id "' + packName + '"');
      }
    });

    if (this.debugMode) {
      console.log('SL.fonts.load', fonts.custom.families);
    }

    if (fonts.custom.families.length) {
      window.WebFont.load(fonts);
      return true;
    } else {
      return false;
    }
  },

  /**
   * Load All Fonts
   *
   * @function
   */
  loadAll: function () {
    var fonts = [];

    for (var family in SL.fonts.FAMILIES) {
      fonts.push(family);
    }

    this.load(fonts);
  },

  /**
   * Load Deck Font
   *
   * @function
   * @param {String|*} font    -The Font Name
   * @param {Object|*} options -The Load Font Parameter
   * @returns {*|boolean} True is Loaded, False or not.
   */
  loadDeckFont: function (font, options) {
    var packages = SL.fonts.PACKAGES[font];

    if (packages) {
      return SL.fonts.load(packages, options);
    } else {
      return false;
    }
  },

  /**
   * Finish Loading
   *
   * @function
   */
  finishLoading: function () {
    clearTimeout(this.initTimeout);
    $('html').addClass('fonts-are-ready');

    if (this._isReady === false) {
      this._isReady = true;
      this.ready.dispatch();
    }
  },

  /**
   * Is Ready
   *
   * @function
   * @returns {boolean}
   */
  isReady: function () {
    return this._isReady;
  },

  /**
   * Web Fonts Active Callback
   *
   * @function
   */
  onWebFontsActive: function () {
    this.finishLoading();
  },

  /**
   * Web Fonts Inactive Callback
   *
   * @function
   */
  onWebFontsInactive: function () {
    this.finishLoading();
  }
};


/*!
 * project name: SlideStudio
 * name:         keyboard.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/7/16
 */

'use strict';

SL.keyboard = {
  /**
   * Constructor A keyboard Management Instance
   *
   * @constructor
   */
  init: function () {
    this.keyupConsumers   = new SL.collections.Collection();
    this.keydownConsumers = new SL.collections.Collection();

    $(document).on('keydown', this.onDocumentKeyDown.bind(this));
    $(document).on('keyup', this.onDocumentKeyUp.bind(this));
  },

  /**
   * @function
   * @param handler
   */
  keyDown: function (handler) {
    this.keydownConsumers.push(handler);
  },

  /**
   * @function
   * @param handler
   */
  keyUp: function (handler) {
    this.keyupConsumers.push(handler);
  },

  /**
   * @function
   * @param handler
   */
  release: function (handler) {
    this.keydownConsumers.remove(handler);
    this.keyupConsumers.remove(handler);
  },

  /**
   * @function
   * @param evt
   * @returns {*}
   */
  onDocumentKeyDown: function (evt) {
    var handler, size = this.keydownConsumers.size(), bubble = false;

    size   -= 1;
    handler = this.keydownConsumers.at(size);

    while (!!handler) {
      if (!handler(evt)) {
        bubble = true;
        break;
      }

      size -= 1;
      handler = this.keydownConsumers.at(size);
    }

    if (bubble) {
      evt.preventDefault();
      evt.stopImmediatePropagation();

      return false;
    } {
      return void 0;
    }
  },

  /**
   * @function
   * @param evt
   * @returns {*}
   */
  onDocumentKeyUp: function (evt) {
    var handler, size = this.keyupConsumers.size(), bubble = false;

    size   -= 1;
    handler = this.keydownConsumers.at(size);

    while (!!handler) {
      if (!handler(evt)) {
        bubble = true;
        break;
      }

      size -= 1;
      handler = this.keydownConsumers.at(size);
    }

    if (bubble) {
      evt.preventDefault();
      evt.stopImmediatePropagation();

      return false;
    } else {
       return void 0;
    }
  }
};


/*!
 * project name: SlideStudio
 * name:         locale.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/7/15
 */

'use strict';

SL.locale = {
  /**
   * Random Tooltips Object
   */
  counter: {},

  get: function (str, replaces) {
    var language = SL.util.getLanguage().toLowerCase();

    if (SL.locale[language]) {
      language = SL.locale[language];
    } else {
      language = SL.locale['en'];
    }

    var strSplit = str.split('.');

    for (var i = 0; i < strSplit.length; i+= 1) {
      language = language[strSplit[i]] || {};
    }

    if (typeof language === "object" && language.length) {
      if (typeof this.counter[str] === "number") {
        this.counter[str] = (this.counter[str] + 1) % language.length;
      } else {
        this.counter[str] = 0;
      }

      language = language[this.counter[str]];
    }

    if (typeof replaces === "object") {
      for (var re in replaces) {
        language = language.replace('{#' + re + '}', replaces[re]);
      }
    }

    if (typeof language === "string") {
      return language;
    } else {
      return '';
    }
  }
};


/*!
 * project name: SlideStudio
 * name:         en.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/10/30
 */

'use strict';

SL.locale['en'] = {
  // Common
  Generic_Error: [
    'Oops, something went wrong',
    'We ran into an unexpected error',
    'Something\'s wong, can you try that again?'
  ],

  OK: 'OK',
  Cancel: 'Cancel',
  Delete: 'Delete',
  Close: 'Close',
  Previous: 'Previous',
  Next: 'Next',
  Save: 'Save',
  Edit: 'Edit',
  Preview: 'Preview',
  Undo: 'Undo',
  Import: 'Import',
  Remove: 'Remove',

  Deck_Visibility_Change_Self: '<div><span class="icon i-lock-stroke"></span></div><h3>Private</h3><p>Only visible to you</p>',
  Deck_Visibility_Change_Team: '<div><span class="icon i-users"></span></div><h3>Internal</h3><p>Visible to your team</p>',
  Deck_Visibility_Change_All: '<div><span class="icon i-globe"></span></div><h3>Public</h3><p>Visible to the world</p>',
  Deck_Visibility_Changed_Self: 'Your deck is now private',
  Deck_Visibility_Changed_Team: 'Your deck is now internal',
  Deck_Visibility_Changed_All: 'Your deck is now public',
  Deck_Visibility_Changed_Err: 'Failed to change visibility',

  // Components - decksharer
  Deck_Sharer: {
    title: 'Share',
    warn: 'This deck is internal and can only be shared with and viewed by other team members.',
    token_title: 'This deck is {#title}',
    token_des: 'To share it you\'ll need to create a secret link.',
    token_btn: 'Create link',
    link_title: 'Link',
    link_label: 'Presentation link',
    link_fullscreen: 'Fullscreen',
    embed_title: 'Embed',
    embed_label_width: 'Width:',
    embed_label_height: 'Height:',
    embed_label_style: 'Footer style:',
    embed_style_light: 'Light',
    embed_style_dark: 'Dark',
    embed_style_hide: 'Hidden',
    mail_title: 'Email',
    mail_label_from: 'From:',
    mail_label_to: 'To:',
    mail_label_msg: 'Message:',
    mail_label_msg_des: 'A link to the deck is automatically included after the message.',
    mail_label_msg_tip: 'Check out this deck {#tip}',
    mail_send_btn: 'Send',
    mail_send_success: 'Email sent!',
    mail_send_error: 'Failed to send email',
    token_btn_del_tip: 'Delete link',
    token_prompt_title: 'Are you sure you want to delete this link? It will stop working for anyone you have already shared it with.',
    token_opt_label_name: 'Name',
    token_opt_label_name_des: 'So you can tell your links apart.',
    token_opt_label_pwd: 'Password<span class="optional-label">(optional)</span>',
    token_opt_label_pwd_des: 'Viewers need to enter this.',
    token_opt_btn_save: 'Save changes',
    token_opt_name_tip: 'Please give the link a name'
  },

  // Components - formunit
  Form: {
    err_required: 'Required',
    err_username_token: [
      'That one\'s already taken :(',
      'Sorry, that\'s taken too'
    ],
    err_slug_taken: [
      'That one\'s already taken :(',
      'Sorry, that\'s taken too'
    ]
  },

  // Components - header
  Header: {
    profile: 'Profile',
    "new": 'New deck',
    theme: 'Themes',
    settings: 'Settings',
    account_settings: 'Account settings',
    team_settings: 'Team settings',
    team_members: 'Team members',
    exit: 'Sign out'
  },

  // Components - search
  Search: {
    page: 'Page',
    no_result_for: 'No results for "{#term}"',
    server_err: 'Failed to fetch search results',
    no_team_err: 'Please enter a search term'
  },

  // Components - templatepage
  Template_Page: {
    btn_save: 'Save current slide',
    btn_del_tip: 'Delete this template',
    btn_team_del_tip: 'Theme availability',
    content_tip: 'You haven\'t saved any custom templates yet.<br>Click the button below to save one now.',
    content_team_tip: 'No templates are available for the current theme.',
    content_enter_tip: 'Templates saved here are made available to the everyone in your team.',
    del_confirm: 'Are you sure you want to delete this template?',
    create_err: 'Failed to save template'
  },

  // Components - themeoptions
  Theme_Opts: {
    title: 'Theme',
    custom: 'Custom',
    opt_title: 'Options',
    opt_center: 'Vertical centering',
    opt_center_tip: 'Center slide contents vertically (not visible while editing)',
    opt_roll_link_tip: 'Use a 3D hover effect on links',
    opt_roll_link: 'Rolling links',
    clr_title: 'Color',
    font_title: 'Typography',
    font_type: 'Type',
    transitions_title: 'Transitions',
    bk_transition_title: 'Background Transition',
    bk_transition_tip: 'Background transitions apply when navigating to or from a slide that has a background image or color.'
  },

  // Data - templates
  Templates: {
    load_err: 'Failed to load slide templates'
  },

  // Util - validate
  Validate: {
    at_least: 'At least {#num} characters',
    no_spaces: 'No spaces please',
    only_contain: 'Can only contain: A-Z, 0-9, - and _',
    email_err: 'Please enter a valid email',
    max_char: '{#num} characters max',
    url_err: 'Please enter a valid URL',
    no_empty: 'Can not be empty'
  },

  // View - decks
  Deck: {
    client: {
      wait_summary_title: 'Waiting for presenter',
      lost_summary_title: 'Connection lost',
      loas_summary_des: 'Attempting to reconnect',
      retry: 'Retrying',
      retry_in: 'Retrying in ',
      retry_now: 'Retrying now'
    },
    server: {
      title: 'Presentation Controls',
      speaker_title: 'Speaker View',
      speaker_des: 'The control panel for your presentation. Includes speaker notes, an upcoming slide preview and more. It can be used as a remote control when opened from a mobile device. <a href="#" target="_blank">Learn more.</a>',
      speaker_btn: 'Open speaker view',
      live_title: 'Present Live',
      live_des: 'Share this link with your audience to have them follow along with the presentation in real-time. <a href="{#url}" target="_blank">Learn more.</a>',
      opt_title: 'Options',
      opt_fullscreen_btn: 'Fullscreen',
      opt_hidectrl_btn: 'Hide controls',
      opt_hidectrl_tip: 'Hide the presentation control arrows and progress bar.',
      opt_hidenote_btn: 'Hide notes',
      opt_hidenote_tip: 'Hide your speaker notes from the audience.',
      opt_disable_upsize_btn: 'Disable upsizing',
      opt_disable_upsize_tip: 'Your content is automatically scaled up to fill as much of the browser window as possible. This option disables that scaling and favors the original authored at size.',
      opt_start: 'Start presentation',
      live_create_title: 'Create link',
      live_create_btn: 'This deck is private. To share a private deck you\'ll need to create a secret share link.'
    }
  },

  // View - devise
  Devise: {
    all_setup_form: 'Please answer the reCAPTCHA to prove you\'re not a robot',
    edit_photo_err: 'An error occured while saving',
    upload_img_size_err: 'No more than {#size} MB please',
    upload_img_type: 'Only image files, please'
  },

  // View - subscriptions
  Sub: {
    no_support_title: 'Not supported',
    no_support_des: 'It looks like you\'re using a browser which isn\'t supported by the Slides editor. Please make sure to try the editor before upgrading.'
  },

  // View - team
  Team: {},

  // View - Themes
  Themes: {},

  // View - User
  User: {
    clk_edit_tip: 'Click to edit',
    announcement_title: 'New Editor',
    announcement_des_p1: 'We have released a new and greatly improved presentation editor. Have a look at the <a href="http://#/news/new-editor/" target="_blank">demo presentation</a> for a quick overview.',
    announcement_des_p2: 'To enable the new editor, please visit the team settings page.',
    announcement_team_setting: 'Team settings',
    announcement_dismiss: 'Dismiss',
    deck_del_confirm: 'Are you sure you want to delete "{#title}"?',
    deck_del_success: 'Deck deleted',
    deck_del_error: 'Failed to delete',
    prompt_deck_title: 'Edit deck title',
    default_deck_title: 'Deck title...',
    change_deck_title_err: 'An error occured while saving your deck title',
    no_empty_deck_title: 'Title can\'t be empty',
    prompt_deck_des_title: 'Edit deck description',
    default_deck_des: 'A short description of this deck...',
    change_deck_des_err: 'An error occured while saving your deck description'
  },

  // Editor - components(medialibrary)
  MediaLibrary: {
    filter: {
      all_images: 'All Images',
      create_tag: 'Create tag',
      filter_text: 'No media has been added to this tag',
      filter_edit_text: 'This tag is empty. To add media, drag and drop it onto the tag in the sidebar.',
      filter_type_text: 'There is no media of this type',
      tag_del_confirm: 'Are you sure you want to permanently delete this tag?',
      tag_del_success: 'Tag deleted',
      tag_del_err: 'Failed to delete'
    },
    List: {
      btn_remove_tag: 'Remove tag',
      btn_clear_select: 'Clear selection',
      empty_placeholder: 'Empty',
      placeholder_content: 'No media has been uploaded yet.',
      edit_placeholder_content: 'You haven\'t uploaded any media yet.<br>Use the upload button to the left or drag media from your desktop.',
      delete_select_title: 'Are you sure you want to delete this file? It will stop working in any presentation it\'s currently used.',
      delete_selects_title: 'Are you sure you want to delete these files? They\'ll stop working in any presentation they\'re currently used in.',
      delete_media_err: 'An error occurred, media was not deleted',
      edit_label_title: 'Edit asset label',
      edit_label_placeholder: 'Label...',
      edit_label_no_empty: 'Label can\'t be empty'
    },
    main: {
      title: 'Media Library'
    }
  },

  // Editor - components(slidebar)
  SlideBar: {
    base/*SlideBar*/: {
      play: 'Present',
      copy: 'Duplicate deck',
      del: 'Delete deck',
      publish_tip: 'Visibility'
    },
    pdf: {
      btn: 'Download PDF',
      btn_work: 'Creating PDF...',
      export_err: 'An error occured while exporting your PDF.'
    },
    zip: {
      btn: 'Download ZIP',
      btn_work: 'Creating ZIP...',
      export_err: 'An error occured while exporting your ZIP.'
    },
    "import": {
      select_btn: 'Select PDF/PPT file',
      upload_err: 'Failed to upload, please try again'
    },
    reveal: {
      confirm_title: 'All existing content will be replaced, continue?'
    },
    revisions: {
      confirm_title: 'Are you sure you want to revert to this version from {#time}?'
    },
    settings: {
      save_title_err: 'Please enter a valid title',
      save_slug_err: '请输入有效网址'
    },
    style: {
      reload_title: 'The editor needs to reload to apply your changes.',
      save_title: 'Saving and reloading...'
    }
  },

  // Editor - components(slideoptions)
    SlideOpts: {
      remove_tip: 'Remove current slide',
      bk_clr_tip: 'Slide background color',
      bk_tip: 'Slide background image',
      class_tip: 'Slide classes',
      fragment_tip: 'Create fragments<br>(SHIFT + ALT + F)',
      note_tip: 'Speaker notes<br>(SHIFT + ALT + N)',
      html_tip: 'Edit HTML<br>(SHIFT + ALT + H)',
      uploading: 'Uploading',
      stretch: 'Stretch',
      fit: 'Fit',
      original: 'Original',
      overflow_warning_tip: 'Please keep content inside of the dotted outline. Content placed outside may not be visible on all display sizes.',
      note_title: 'Speaker Notes',
      max_note: 'Plain text, max {#max} characters...',
      class_title: 'Slide classes',
      remove_slide_title: 'Are you sure you want to remove this slide?'
    },
  // Editor - controllers(api)
  API: {
    title: '<b>You are permanently deleting the entire presentation.</b><br><br>Are you sure you want to do this?',
    "delete": 'Delete my presentation'
  },

  // Editor - controllers(onboarding)
  OnBoarding: {},

  // Editor - core(editor)
  Editor: {
    clk_save_tip: 'Click to save',
    changed_save_tip: 'Latest changes are saved',
    saving_tip: 'Saving changes',
    deck_save_success: 'Saved successfully',
    deck_save_err: 'Failed to save',
    leave_unsaved_deck: 'You will lose your unsaved changes.'
  },

  // Editor - modes(css)
  CSS: {},

  // Editor - modes(fragment)
  Fragment: {},


  T: {
    GENERIC_ERROR: [
      'Oops, something went wrong',
      'We ran into an unexpected error',
      'Something\'s wong, can you try that again?'
    ],
    CLOSE: 'Close',
    PREVIOUS: 'Previous',
    NEXT: 'Next',


    WARN_UNSAVED_CHANGES: 'You have unsaved changes, save first?',

    DECK_SAVE_SUCCESS: 'Saved successfully',
    DECK_SAVE_ERROR: 'Failed to save',
    NEW_SLIDE_TITLE: 'Title',
    LEAVE_UNSAVED_DECK: 'You will lose your unsaved changes.',
    LEAVE_UNSAVED_THEME: 'You will lose your unsaved changes.',
    REMOVE_PRO_CONFIRM: 'After the end of the current billing cycle your account will be downgraded from Pro to the Free plan.',
    REMOVE_PRO_SUCCESS: 'Subscription canceled',
    DECK_RESTORE_CONFIRM: 'Are you sure you want to revert to this version from {#time}?',
    DECK_DELETE_CONFIRM: 'Are you sure you want to delete "{#title}"?',
    DECK_DELETE_SUCCESS: 'Deck deleted',
    DECK_DELETE_ERROR: 'Failed to delete',
    DECK_VISIBILITY_CHANGE_SELF: '<div><span class="icon i-lock-stroke"></span></div><h3>Private</h3><p>Only visible to you</p>',
    DECK_VISIBILITY_CHANGE_TEAM: '<div><span class="icon i-users"></span></div><h3>Internal</h3><p>Visible to your team</p>',
    DECK_VISIBILITY_CHANGE_ALL: '<div><span class="icon i-globe"></span></div><h3>Public</h3><p>Visible to the world</p>',
    DECK_VISIBILITY_CHANGED_SELF: 'Your deck is now private',
    DECK_VISIBILITY_CHANGED_TEAM: 'Your deck is now internal',
    DECK_VISIBILITY_CHANGED_ALL: 'Your deck is now public',
    DECK_VISIBILITY_CHANGED_ERROR: 'Failed to change visibility',
    DECK_EDIT_INVALID_TITLE: 'Please enter a valid title',
    DECK_EDIT_INVALID_SLUG: 'Please enter a valid URL',
    DECK_DELETE_SLIDE_CONFIRM: 'Are you sure you want to remove this slide?',
    DECK_IMPORT_HTML_CONFIRM: 'All existing content will be replaced, continue?',
    EXPORT_PDF_BUTTON: 'Download PDF',
    EXPORT_PDF_BUTTON_WORKING: 'Creating PDF...',
    EXPORT_PDF_ERROR: 'An error occured while exporting your PDF.',
    EXPORT_ZIP_BUTTON: 'Download ZIP',
    EXPORT_ZIP_BUTTON_WORKING: 'Creating ZIP...',
    EXPORT_ZIP_ERROR: 'An error occured while exporting your ZIP.',
    FORM_ERROR_REQUIRED: 'Required',
    FORM_ERROR_USERNAME_TAKEN: [
      'That one\'s already taken :(',
      'Sorry, that\'s taken too'
    ],
    FORM_ERROR_ORGANIZATION_SLUG_TAKEN: [
      'That one\'s already taken :(',
      'Sorry, that\'s taken too'
    ],
    BILLING_DETAILS_ERROR: 'An error occured while fetching your billing details, please try again.',
    BILLING_DETAILS_NOHISTORY: 'You haven\'t made any payments yet.',
    THEME_CREATE: 'New theme',
    THEME_CREATE_ERROR: 'Failed to create theme',
    THEME_SAVE_SUCCESS: 'Theme saved',
    THEME_SAVE_ERROR: 'Failed to save theme',
    THEME_REMOVE_CONFIRM: 'Are you sure you want to delete this theme?',
    THEME_REMOVE_SUCCESS: 'Theme removed successfully',
    THEME_REMOVE_ERROR: 'Failed to remove theme',
    THEME_LIST_LOAD_ERROR: 'Failed to load themes',
    THEME_LIST_EMPTY: 'You haven\'t created any themes yet. <a href="#" class="create-theme-button">Create one now</a>.',
    THEME_CSS_DESCRIPTION: 'This editor supports LESS or plain CSS input. All selectors are prefixed with .reveal when saved to avoid style spillover.',
    THEME_HTML_DESCRIPTION: 'HTML is inserted into the presentation container, meaning it lives separately from individual slides. This makes it great for things like a company logo which is constantly visible on top of the presentation.',
    THEME_JS_DESCRIPTION: 'Scripts will be executed when a deck that uses this theme is loaded.',
    THEME_DEFAULT_SAVE_SUCCESS: 'Default theme was changed',
    THEME_DEFAULT_SAVE_ERROR: 'Failed to change default theme',
    THEME_DELETE_TOOLTIP: 'Delete',
    THEME_EDIT_TOOLTIP: 'Edit',
    THEME_MAKE_DEFAULT_TOOLTIP: 'Make this the default theme',
    THEME_IS_DEFAULT_TOOLTIP: 'This is the default theme',
    THEME_SNIPPET_DELETE_CONFIRM: 'Are you sure you want to delete this snippet?',
    TEMPLATE_LOAD_ERROR: 'Failed to load slide templates',
    TEMPLATE_CREATE_ERROR: 'Failed to save template',
    TEMPLATE_DELETE_CONFIRM: '确定删除此模板？',
    ORG_USERS_REMOVE_CONFIRM: 'Delete "{#name}" and all of their decks?',
    ORG_USERS_REMOVE_SUCCESS: 'User removed successfully',
    ORG_USERS_REMOVE_ERROR: 'Failed to remove user',
    ORG_USERS_INVITE_SEND_SUCCESS: 'Invite email sent',
    ORG_USERS_INVITE_SEND_ERROR: 'Failed to send invite email',
    ORG_USERS_LIST_EMPTY: 'Couldn\'t find any members of this team.',
    ORG_USERS_LIST_LOAD_ERROR: 'Failed to load user list',
    SEARCH_PAGINATION_PAGE: 'Page',
    SEARCH_NO_RESULTS_FOR: 'No results for "{#term}"',
    SEARCH_SERVER_ERROR: 'Failed to fetch search results',
    SEARCH_NO_TERM_ERROR: 'Please enter a search term',
    MEDIA_TAG_DELETE_CONFIRM: 'Are you sure you want to permanently delete this tag?',
    MEDIA_TAG_DELETE_SUCCESS: 'Tag deleted',
    MEDIA_TAG_DELETE_ERROR: 'Failed to delete'
  }
};


/*!
 * project name: SlideStudio
 * name:         zh-cn.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/10/30
 */

'use strict';

SL.locale['zh-cn'] = {
  // Common
  Generic_Error: [
    '哎呦,出错喽',
    '你整了一个我们想不到的错误哦',
    '出错鸟,再试一下?'
  ],

  OK: '确定',
  Cancel: '取消',
  Delete: '删除',
  Close: '关闭',
  Previous: '上一个',
  Next: '下一个',
  Save: '保存',
  Edit: '编辑',
  Preview: '预览',
  Undo: '撤销',
  Import: '导入',
  Remove: '移除',

  Deck_Visibility_Change_Self: '<div><span class="icon i-lock-stroke"></span></div><h3>私有</h3><p>仅自己可见</p>',
  Deck_Visibility_Change_Team: '<div><span class="icon i-users"></span></div><h3>内部</h3><p>对小组可见</p>',
  Deck_Visibility_Change_All: '<div><span class="icon i-globe"></span></div><h3>公开</h3><p>对所有人可见</p>',
  Deck_Visibility_Changed_Self: '现在就你自己能看到了',
  Deck_Visibility_Changed_Team: '现在就和你一个小组的人能看到了',
  Deck_Visibility_Changed_All: '我靠,世界都能看到了',
  Deck_Visibility_Changed_Err: '对谁可见,修改失败了',

  // Components - decksharer
  Deck_Sharer: {
    title: 'Share',
    warn: 'This deck is internal and can only be shared with and viewed by other team members.',
    token_title: 'This deck is {#title}',
    token_des: 'To share it you\'ll need to create a secret link.',
    token_btn: 'Create link',
    link_title: 'Link',
    link_label: 'Presentation link',
    link_fullscreen: 'Fullscreen',
    embed_title: 'Embed',
    embed_label_width: 'Width:',
    embed_label_height: 'Height:',
    embed_label_style: 'Footer style:',
    embed_style_light: 'Light',
    embed_style_dark: 'Dark',
    embed_style_hide: 'Hidden',
    mail_title: 'Email',
    mail_label_from: 'From:',
    mail_label_to: 'To:',
    mail_label_msg: 'Message:',
    mail_label_msg_des: 'A link to the deck is automatically included after the message.',
    mail_label_msg_tip: 'Check out this deck {#tip}',
    mail_send_btn: 'Send',
    mail_send_success: 'Email sent!',
    mail_send_error: 'Failed to send email',
    token_btn_del_tip: 'Delete link',
    token_prompt_title: 'Are you sure you want to delete this link? It will stop working for anyone you have already shared it with.',
    token_opt_label_name: 'Name',
    token_opt_label_name_des: 'So you can tell your links apart.',
    token_opt_label_pwd: 'Password<span class="optional-label">(optional)</span>',
    token_opt_label_pwd_des: 'Viewers need to enter this.',
    token_opt_btn_save: 'Save changes',
    token_opt_name_tip: 'Please give the link a name'
  },

  // Components - formunit
  Form: {
    err_required: 'Required',
    err_username_token: [
      'That one\'s already taken :(',
      'Sorry, that\'s taken too'
    ],
    err_slug_taken: [
      'That one\'s already taken :(',
      'Sorry, that\'s taken too'
    ]
  },

  // Components - header
  Header: {
    profile: '我',
    "new": '新建',
    theme: '主题',
    settings: '设置',
    account_settings: '账号设置',
    team_settings: '群组设置',
    team_members: '群组成员',
    exit: '退出'
  },

  // Components - search
  Search: {
    page: 'Page',
    no_result_for: 'No results for "{#term}"',
    server_err: 'Failed to fetch search results',
    no_team_err: 'Please enter a search term'
  },

  // Components - templatepage
  Template_Page: {
    btn_save: '保存当前幻灯片',
    btn_del_tip: '删除此模板',
    btn_team_del_tip: 'Theme availability',
    content_tip: '您尚未保存任何自定义模板.<br>点击下面的按钮现在保存一个.',
    content_team_tip: 'No templates are available for the current theme.',
    content_enter_tip: 'Templates saved here are made available to the everyone in your team.',
    del_confirm: 'Are you sure you want to delete this template?',
    create_err: 'Failed to save template'
  },

  // Components - themeoptions
  Theme_Opts: {
    title: 'Theme',
    custom: 'Custom',
    opt_title: 'Options',
    opt_center: 'Vertical centering',
    opt_center_tip: 'Center slide contents vertically (not visible while editing)',
    opt_roll_link_tip: 'Use a 3D hover effect on links',
    opt_roll_link: 'Rolling links',
    clr_title: '颜色',
    font_title: '排版',
    font_type: '类型',
    transitions_title: '转换',
    bk_transition_title: '背景转换',
    bk_transition_tip: 'Background transitions apply when navigating to or from a slide that has a background image or color.'
  },

  // Data - templates
  Templates: {
    load_err: '加载模板失败'
  },

  // Util - validate
  Validate: {
    at_least: 'At least {#num} characters',
    no_spaces: 'No spaces please',
    only_contain: 'Can only contain: A-Z, 0-9, - and _',
    email_err: 'Please enter a valid email',
    max_char: '{#num} characters max',
    url_err: '请输入有效网址',
    no_empty: 'Can not be empty'
  },

  // View - decks
  Deck: {
    client: {
      wait_summary_title: 'Waiting for presenter',
      lost_summary_title: 'Connection lost',
      loas_summary_des: 'Attempting to reconnect',
      retry: 'Retrying',
      retry_in: 'Retrying in ',
      retry_now: 'Retrying now'
    },
    server: {
      title: 'Presentation Controls',
      speaker_title: 'Speaker View',
      speaker_des: 'The control panel for your presentation. Includes speaker notes, an upcoming slide preview and more. It can be used as a remote control when opened from a mobile device. <a href="#" target="_blank">Learn more.</a>',
      speaker_btn: 'Open speaker view',
      live_title: 'Present Live',
      live_des: 'Share this link with your audience to have them follow along with the presentation in real-time. <a href="{#url}" target="_blank">Learn more.</a>',
      opt_title: 'Options',
      opt_fullscreen_btn: 'Fullscreen',
      opt_hidectrl_btn: 'Hide controls',
      opt_hidectrl_tip: 'Hide the presentation control arrows and progress bar.',
      opt_hidenote_btn: 'Hide notes',
      opt_hidenote_tip: 'Hide your speaker notes from the audience.',
      opt_disable_upsize_btn: 'Disable upsizing',
      opt_disable_upsize_tip: 'Your content is automatically scaled up to fill as much of the browser window as possible. This option disables that scaling and favors the original authored at size.',
      opt_start: 'Start presentation',
      live_create_title: 'Create link',
      live_create_btn: 'This deck is private. To share a private deck you\'ll need to create a secret share link.'
    }
  },

  // View - devise
  Devise: {
    all_setup_form: 'Please answer the reCAPTCHA to prove you\'re not a robot',
    edit_photo_err: 'An error occured while saving',
    upload_img_size_err: 'No more than {#size} MB please',
    upload_img_type: 'Only image files, please'
  },

  // View - subscriptions
  Sub: {
    no_support_title: 'Not supported',
    no_support_des: 'It looks like you\'re using a browser which isn\'t supported by the Slides editor. Please make sure to try the editor before upgrading.'
  },

  // View - team
  Team: {},

  // View - Themes
  Themes: {},

  // View - User
  User: {
    clk_edit_tip: 'Click to edit',
    announcement_title: 'New Editor',
    announcement_des_p1: 'We have released a new and greatly improved presentation editor. Have a look at the <a href="http://#/news/new-editor/" target="_blank">demo presentation</a> for a quick overview.',
    announcement_des_p2: 'To enable the new editor, please visit the team settings page.',
    announcement_team_setting: 'Team settings',
    announcement_dismiss: 'Dismiss',
    deck_del_confirm: 'Are you sure you want to delete "{#title}"?',
    deck_del_success: 'Deck deleted',
    deck_del_error: 'Failed to delete',
    prompt_deck_title: 'Edit deck title',
    default_deck_title: 'Deck title...',
    change_deck_title_err: 'An error occured while saving your deck title',
    no_empty_deck_title: 'Title can\'t be empty',
    prompt_deck_des_title: 'Edit deck description',
    default_deck_des: 'A short description of this deck...',
    change_deck_des_err: 'An error occured while saving your deck description'
  },

  // Editor - components(medialibrary)
  MediaLibrary: {
    filter: {
      all_images: '所有图片',
      all: '所有',
      image: '图片',
      video: '视频',
      all_section: '全部',
      create_tag: '创建标签',
      filter_text: '没有媒体添加到此标签',
      filter_edit_text: '此标签为空。要添加媒体，请将其拖放到侧栏中的标签上.',
      filter_type_text: '没有这种媒体',
      tag_del_confirm: '确定永久删除此标签?',
      tag_del_success: '标签已删除',
      tag_del_err: '删除失败'
    },
    List: {
      btn_remove_tag: 'Remove tag',
      btn_clear_select: '取消选择',
      empty_placeholder: 'Empty',
      placeholder_content: 'No media has been uploaded yet.',
      edit_placeholder_content: '你还没有上传任何媒体资源.<br>使用上传按钮向左或拖动媒体从您的桌面.',
      delete_select_title: '确定要删除这个文件? 它将停止目前使用的任何演示文稿.',
      delete_selects_title: '确实要删除这些文件吗？他们将停止目前使用的任何演示.',
      delete_media_err: '出现错误，媒体未删除',
      edit_label_title: '编辑',
      edit_label_placeholder: 'Label...',
      edit_label_no_empty: 'Label can\'t be empty'
    },
    main: {
      title: '媒体库'
    }
  },

  // Editor - components(slidebar)
  SlideBar: {
    base/*SlideBar*/: {
      play: '当前 deck',
      copy: '复制 deck',
      del:  '删除 deck',
      publish_tip: 'Visibility'
    },
    pdf: {
      btn: 'Download PDF',
      btn_work: 'Creating PDF...',
      export_err: 'An error occured while exporting your PDF.'
    },
    zip: {
      btn: 'Download ZIP',
      btn_work: 'Creating ZIP...',
      export_err: 'An error occured while exporting your ZIP.'
    },
    "import": {
      select_btn: 'Select PDF/PPT file',
      upload_err: 'Failed to upload, please try again'
    },
    reveal: {
      confirm_title: 'All existing content will be replaced, continue?'
    },
    revisions: {
      confirm_title: '确定要回退到{#time}的这个版本?'
    },
    settings: {
      save_title_err: 'Please enter a valid title',
      save_slug_err: '请输入有效网址'
    },
    style: {
      reload_title: 'The editor needs to reload to apply your changes.',
      save_title: 'Saving and reloading...'
    }
  },

  // Editor - components(slideoptions)
  SlideOpts: {
    remove_tip: '删除当前幻灯片',
    bk_clr_tip: '幻灯片背景颜色',
    bk_tip: '幻灯片背景图片',
    class_tip: 'Slide classes',
    fragment_tip: 'Create fragments<br>(SHIFT + ALT + F)',
    note_tip: '演讲者备注<br>(SHIFT + ALT + N)',
    html_tip: 'Edit HTML<br>(SHIFT + ALT + H)',
    uploading: 'Uploading',
    stretch: 'Stretch',
    fit: 'Fit',
    original: 'Original',
    overflow_warning_tip: 'Please keep content inside of the dotted outline. Content placed outside may not be visible on all display sizes.',
    note_title: '演讲者备注',
    max_note: '纯文字, 最大 {#max} 个字符...',
    class_title: 'Slide classes',
    remove_slide_title: '您确定要删除此幻灯片吗?'
  },

  // Editor - controllers(api)
  API: {
    title: '<b>You are permanently deleting the entire presentation.</b><br><br>Are you sure you want to do this?',
    "delete": 'Delete my presentation'
  },

  // Editor - controllers(onboarding)
  OnBoarding: {},

  // Editor - core(editor)
  Editor: {
    clk_save_tip: '点击保存',
    changed_save_tip: '保存最新的更改',
    saving_tip: '保存更改',
    deck_save_success: '保存成功',
    deck_save_err: '保存失败',
    leave_unsaved_deck: '您将失去未保存的更改.'
  },

  // Editor - modes(css)
  CSS: {},

  // Editor - modes(fragment)
  Fragment: {},

  // TOOLTIPS
  T: {
    GENERIC_ERROR: [
      '哎呦,出错喽',
      '你整了一个我们想不到的错误哦',
      '出错鸟,再试一下?'
    ],
    WARN_UNSAVED_CHANGES: '您有未保存的修改,保存?',
    CLOSE: '关闭',
    PREVIOUS: '上一个',
    NEXT: '下一个',
    DECK_SAVE_SUCCESS: '保存成功',
    DECK_SAVE_ERROR: '保存失败',
    NEW_SLIDE_TITLE: '标题',
    LEAVE_UNSAVED_DECK: '你将失去你的未保存的修改。',
    LEAVE_UNSAVED_THEME: '你将失去你的未保存的修改。',
    REMOVE_PRO_CONFIRM: '目前的计费周期结束后你的帐户将被从专业版降级到免费版。',
    REMOVE_PRO_SUCCESS: '已经降级',
    DECK_RESTORE_CONFIRM: '你确定你想要恢复到这个版本 {#time}?',
    DECK_DELETE_CONFIRM: '你确定你要删除 "{#title}" 吗?',
    DECK_DELETE_SUCCESS: '删除成功',
    DECK_DELETE_ERROR: '删除失败',
    DECK_VISIBILITY_CHANGE_SELF: '<div><span class="icon i-lock-stroke"></span></div><h3>私有</h3><p>仅自己可见</p>',
    DECK_VISIBILITY_CHANGE_TEAM: '<div><span class="icon i-users"></span></div><h3>内部</h3><p>对小组可见</p>',
    DECK_VISIBILITY_CHANGE_ALL: '<div><span class="icon i-globe"></span></div><h3>公开</h3><p>对所有人可见</p>',
    DECK_VISIBILITY_CHANGED_SELF: '现在就你自己能看到了',
    DECK_VISIBILITY_CHANGED_TEAM: '现在就和你一个小组的人能看到了',
    DECK_VISIBILITY_CHANGED_ALL: '我靠,世界都能看到了',
    DECK_VISIBILITY_CHANGED_ERROR: '对谁可见,修改失败了',
    DECK_EDIT_INVALID_TITLE: '你能输入一个有效的标题吗',
    DECK_EDIT_INVALID_SLUG: '地址都弄不对一个正确的啊',
    DECK_DELETE_SLIDE_CONFIRM: '费了这么大劲,真的要把我删了啊?',
    DECK_IMPORT_HTML_CONFIRM: '所有现有内容将被替换,继续?',
    EXPORT_PDF_BUTTON: '下载 pdf',
    EXPORT_PDF_BUTTON_WORKING: '创建 pdf...',
    EXPORT_PDF_ERROR: '本来想给你导出一个 pdf 结果出错了.',
    EXPORT_ZIP_BUTTON: '下载 ZIP',
    EXPORT_ZIP_BUTTON_WORKING: '创建 ZIP...',
    EXPORT_ZIP_ERROR: '本来想给你导出一个 ZIP 结果出错了.',
    FORM_ERROR_REQUIRED: '这个是必须的',
    FORM_ERROR_USERNAME_TAKEN: [
      '已经被人抢了. :(',
      '你这智商已经想不出不被别人抢的了.'
    ],
    FORM_ERROR_ORGANIZATION_SLUG_TAKEN: [
      '已经被人抢了. :(',
      '你这智商已经想不出不被别人抢的了.'
    ],
    BILLING_DETAILS_ERROR: '获取您的账单详情时出错,请再试一次.',
    BILLING_DETAILS_NOHISTORY: '没有付钱就想用啊?',
    THEME_CREATE: '新的主题',
    THEME_CREATE_ERROR: '创建主题失败',
    THEME_SAVE_SUCCESS: '已经保存主题',
    THEME_SAVE_ERROR: '保存主题失败',
    THEME_REMOVE_CONFIRM: '编辑了半天你确定要删除了?',
    THEME_REMOVE_SUCCESS: '没了',
    THEME_REMOVE_ERROR: '删除失败了',
    THEME_LIST_LOAD_ERROR: '载入主题失败了',
    THEME_LIST_EMPTY: '你还没有创建任何的主题呢. <a href="#" class="create-theme-button">现在创建一个</a>.',
    THEME_CSS_DESCRIPTION: '这个编辑器支持 less 或者纯 css 输入. 所有的 css 选择器必须是前缀, 防止保存失败.',
    THEME_HTML_DESCRIPTION: '演示容器中插入 html, 将会分开演示.',
    THEME_JS_DESCRIPTION: '当主题用于一个页面时,脚本将会执行.',
    THEME_DEFAULT_SAVE_SUCCESS: '默认主题已经修改',
    THEME_DEFAULT_SAVE_ERROR: '修改主题失败',
    THEME_DELETE_TOOLTIP: '删除',
    THEME_EDIT_TOOLTIP: '编辑',
    THEME_MAKE_DEFAULT_TOOLTIP: '设置为默认主题',
    THEME_IS_DEFAULT_TOOLTIP: '这个一个默认主题',
    THEME_SNIPPET_DELETE_CONFIRM: '你确定你要删除这个代码片段吗?',
    TEMPLATE_LOAD_ERROR: '加载幻灯片模板失败',
    TEMPLATE_CREATE_ERROR: '保存模板失败',
    TEMPLATE_DELETE_CONFIRM: '确定删除模板?',
    ORG_USERS_REMOVE_CONFIRM: '删除 "{#name}" 和所有的幻灯片?',
    ORG_USERS_REMOVE_SUCCESS: '删除用户成功',
    ORG_USERS_REMOVE_ERROR: '删除用户失败',
    ORG_USERS_INVITE_SEND_SUCCESS: '邀请电子邮件发送成功',
    ORG_USERS_INVITE_SEND_ERROR: '邀请电子邮件发送失败',
    ORG_USERS_LIST_EMPTY: '在这个组中没有发现一个人。',
    ORG_USERS_LIST_LOAD_ERROR: '载入用户失败',
    SEARCH_PAGINATION_PAGE: '页',
    SEARCH_NO_RESULTS_FOR: '没有 "{#term}" 结果',
    SEARCH_SERVER_ERROR: '获取搜索结果失败',
    SEARCH_NO_TERM_ERROR: '请输入一个搜索词',
    MEDIA_TAG_DELETE_CONFIRM: '你确定要永久删除这个标签吗?',
    MEDIA_TAG_DELETE_SUCCESS: '已经删除标签',
    MEDIA_TAG_DELETE_ERROR: '删除失败'
  }
};


/*!
 * project name: SlideStudio
 * name:         notify.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/10
 */

'use strict';

/**
 * Show Notify Information Message Dialog
 *
 * @function
 * @param {String} text -The Show Message
 * @param {String} type -The Notify Type
 * @returns {{
 *       $domElement: (*|jQuery),
 *       destroy:     notifyClk,
 *       destroyed:   (skriv.Signal|*|Signal|e)
 *     }}
 */
SL.notify = function (text, type) {
  function notifyClk() {
    clearTimeout(timer);
    $notify.remove();
    signal.dispatch();
  }

  function mouseIn() {
    clearTimeout(timer);
    $notify.stop().css('opacity', '');
  }

  function mouseOut() {
    mouseIn();
    timer = setTimeout(function () {
      $notify.addClass('no-transition').fadeOut(600, notifyClk);
    }, type.duration);
  }

  if ($('.sl-notifications').length === 0) {
    $(document.body).append('<div class="sl-notifications"></div>');
  }

  if ($('.sl-notifications>').last().html() === text) {
    $('.sl-notifications>').last().remove();
  }

  if (typeof type === "string") {
    type = {type: type};
  }

  type = $.extend({
    type: '',
    duration: 2500 + 15 * text.length,
    autoHide: true
  }, type);

  if (type.type === 'negative') {
    type.duration = 1.5 * type.duration;
  }

  var $notify =
    $('<p>').html(text)
      .addClass(type.type)
      .appendTo($('.sl-notifications'))
      .on('click', notifyClk);

  if (type.autoHide) {
    $notify.on('mouseover', mouseIn);
    $notify.on('mouseout', mouseOut);
  }

  var signal = new window.signals.Signal(), timer = -1;

  window.setTimeout(function () {
    $notify.addClass('show');

    if (type.autoHide) {
      mouseOut();
    }
  }, 1);

  return {
    $domElement: $notify,
    destroy:     notifyClk,
    destroyed:   signal
  };
};


/*!
 * project name: SlideStudio
 * name:         pointer.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/10
 */

'use strict';

SL.pointer = {
  down:        false,
  downTimeout: -1,

  /**
   * Constructor pointer Instance
   *
   * @function
   */
  init: function () {
    $(document).on('mousedown', this.onMouseDown.bind(this));
    $(document).on('mouseleave', this.onMouseLeave.bind(this));
    $(document).on('mouseup', this.onMouseUp.bind(this));
  },

  /**
   * Mouse Is Down
   *
   * @function
   * @returns {boolean} True is down, False or not.
   */
  isDown: function () {
    return this.down;
  },

  /**
   * Mouse Down Callback
   *
   * @function
   */
  onMouseDown: function () {
    clearTimeout(this.downTimeout);

    this.down        = true;
    this.downTimeout = setTimeout((function () {
      this.down = false;
    }).bind(this), 3e4);
  },

  /**
   * Mouse Leave Callback
   *
   * @function
   */
  onMouseLeave: function () {
    clearTimeout(this.downTimeout);
    this.down = false;
  },

  /**
   * Mouse Up Callback
   *
   * @function
   */
  onMouseUp: function () {
    clearTimeout(this.downTimeout);
    this.down = false;
  }
};


/*!
 * project name: SlideStudio
 * name:         popup.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/10
 */

'use strict';

SL.popup = {
  items:      [],
  singletons: [],

  /**
   * @function
   * @param Factory
   * @param options
   * @returns {*}
   */
  open: function (Factory, options) {
    var instance = null;

    for (var i = 0; i < SL.popup.singletons.length; i += 1) {
      if (SL.popup.singletons[i].factory === Factory) {
        instance = SL.popup.singletons[i].instance;
        break;
      }
    }

    if (!instance) {
      instance = new Factory(options);

      if (instance.isSingleton()) {
        SL.popup.singletons.push({
          factory:  Factory,
          instance: instance
        });
      }
    }

    instance.open(options);

    SL.popup.items.push({
      factory:  Factory,
      instance: instance
    });

    $('html').addClass('popup-open');

    return instance;
  },

  /**
   * @function
   * @param factory
   */
  close: function (factory) {
    SL.popup.items.concat().forEach(function (item) {
      if (!(factory && factory !== item.factory)) {
        item.instance.close(true);
      }
    });
  },

  /**
   * @function
   * @param factory
   * @returns {boolean}
   */
  isOpen: function (factory) {
    for (var i = 0; i < SL.popup.items.length; i += 1) {
      if (!factory || factory === SL.popup.items[i].factory) {
        return true;
      }
    }

    return false;
  },

  /**
   * @function
   * @param instance
   */
  unRegister: function (instance) {
    var removedValue = null;

    for (var i = 0; i < SL.popup.items.length; i += 1) {
      if (SL.popup.items[i].instance === instance) {
        removedValue = SL.popup.items.splice(i, 1);
        i -= 1;
      }
    }

    if (SL.popup.items.length === 0) {
      $('html').removeClass('popup-open');
    }
  }
};


/*!
 * project name: SlideStudio
 * name:         prompt.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/10
 */

'use strict';

/**
 * @function
 * @param {Object} options -Initialize Parameter
 * @returns {*|SL.components.Prompt} SL.components.Prompt
 */
SL.prompt = function (options) {
  var prompt = new SL.components.Prompt(options);
  prompt.show();

  return prompt;
};


/*!
 * project name: SlideStudio
 * name:         routes.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/10
 */

'use strict';

SL.routes = {
  PRICING:                   '/pricing',
  BILLING_DETAILS:           '/account/billing',
  SUBSCRIPTIONS_NEW:         '/account/upgrade',
  SUBSCRIPTIONS_EDIT_CARD:   '/account/update_billing',
  SUBSCRIPTIONS_EDIT_PERIOD: '/account/update_billing_period',

  SIGN_IN:                   '/users/sign_in',
  SIGN_OUT:                  '/users/sign_out',
  THEME_EDITOR:              '/themes',
  USER: function (userName) {
    return '/' + userName;
  },
  USER_EDIT: function (userName) {
    return '/' + userName + '/edit';
  },
  DECK: function (userName, slug) {
    return '/' + userName + '/' + slug;
  },
  DECK_NEW: function (userName) {
    return '/' + userName + '/deck/new';
  },
  DECK_EDIT: function (userName, slug) {
    return '/' + userName + '/' + slug + '/edit';
  },
  DECK_EMBED: function (userName, slug) {
    return '/' + userName + '/' + slug + '/embed';
  },
  DECK_LIVE: function (userName, slug) {
    return '/' + userName + '/' + slug + '/live';
  },
  TEAM: function (team) {
    return window.location.protocol + '//' +
      team.get('slug') + '.' + SL.config.APP_HOST;
  },
  TEAM_EDIT: function (team) {
    return SL.routes.TEAM(team) + '/edit';
  },
  TEAM_EDIT_MEMBERS: function (team) {
    return SL.routes.TEAM(team) + '/edit_members';
  }
};


/*!
 * project name: SlideStudio
 * name:         settings.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/10
 */

'use strict';

SL.settings = {
  STORAGE_VERSION:  1,
  STORAGE_KEY:      'slides-settings',
  EDITOR_AUTO_HIDE: 'editorAutoHide',
  EDITOR_AUTO_SAVE: 'editorAutoSave',

  /**
   * Constructor settings Instance
   *
   * @function
   */
  init: function () {
    this.settings = {
      version: this.STORAGE_VERSION
    };
    this.changed = new window.signals.Signal();
    this.restore();
  },

  /**
   * Set Default Settings
   *
   * @function
   */
  setDefaults: function () {
    if (typeof this.settings[this.EDITOR_AUTO_HIDE] === "undefined") {
      this.settings[this.EDITOR_AUTO_HIDE] = false;
    }

    if (typeof this.settings[this.EDITOR_AUTO_SAVE] === "undefined") {
      this.settings[this.EDITOR_AUTO_SAVE] = true;
    }
  },

  /**
   * Set Special Item Value
   *
   * @function
   * @param {String|Object|*} item  -The Special Item
   * @param {*|Object}        value -The Value
   */
  setValue: function (item, value) {
    if (typeof item === "object") {
      $.extend(this.settings, item);
    } else {
      this.settings[item] = value;
    }

    this.save();
    this.changed.dispatch([item]);
  },

  /**
   * Get Special Item Value
   *
   * @function
   * @param {String|Object|*} item  -The Special Item
   * @returns {*|Object} The Value
   */
  getValue: function (item) {
    return this.settings[item];
  },

  /**
   * Delete Special Item Value
   *
   * @function
   * @param {String|Object|*} item  -The Special Item
   */
  removeValue: function (item) {
    if (typeof item === "object" && item.length) {
      item.forEach((function (it) {
        delete this.settings[it];
      }).bind(this));
    } else {
      delete this.settings[item];
    }

    this.save();
    this.changed.dispatch([item]);
  },

  /**
   * Restore Settings
   *
   * @function
   */
  restore: function () {
    if (window.Modernizr.localstorage) {
      var storage = localStorage.getItem(this.STORAGE_KEY);

      if (storage) {
        var data = JSON.parse(localStorage.getItem(this.STORAGE_KEY));

        if (data && data.version === this.STORAGE_VERSION) {
          this.settings = data;
          this.setDefaults();
          this.changed.dispatch();
        } else {
          this.setDefaults();
          this.save();
        }
      }
    }

    this.setDefaults();
  },

  /**
   * Save Settings
   *
   * @function
   */
  save: function () {
    if (window.Modernizr.localstorage) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.settings));
    }
  }
};


/*!
 * project name: SlideStudio
 * name:         tooltip.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/10
 */

'use strict';

/**
 * @function
 * @type {{
 *       show,
 *       hide,
 *       anchorTo
 *     }}
 */
SL.tooltip = (function () {
  var $tooltip = null, $inner = null, $arrow = null, $arrowFill = null,
    config = {}, marginLeft = 6, marginTop = 4, timer = -1, dateTime = -1;

  function init() {
    $tooltip   = $('<div>').addClass('sl-tooltip');
    $inner     = $('<p class="sl-tooltip-inner">').appendTo($tooltip);
    $arrow     = $('<div class="sl-tooltip-arrow">').appendTo($tooltip);
    $arrowFill = $('<div class="sl-tooltip-arrow-fill">').appendTo($arrow);

    bind();
  }

  function bind() {
    //layout = layout.bind(this);

    $(document).on('keydown, mousedown', function () {
      SL.tooltip.hide();
    });

    if (!SL.util.device.IS_PHONE && !SL.util.device.IS_TABLET) {
      $(document.body).delegate('[data-tooltip]', 'mouseenter', function (evt) {
        var $target = $(evt.currentTarget);

        if (!$target.is('[no-tooltip]')) {
          var tooltipMsg = $target.attr('data-tooltip'),
            delay     = $target.attr('data-tooltip-delay'),
            align     = $target.attr('data-tooltip-align'),
            alignment = $target.attr('data-tooltip-alignment'),
            maxwidth  = $target.attr('data-tooltip-maxwidth'),
            maxheight = $target.attr('data-tooltip-maxheight'),
            ox        = $target.attr('data-tooltip-ox'),
            oy        = $target.attr('data-tooltip-oy'),
            x         = $target.attr('data-tooltip-x'),
            y         = $target.attr('data-tooltip-y');

          if (tooltipMsg) {
            var config = {
              anchor: $target,
              align: align,
              alignment: alignment,
              delay: parseInt(delay, 10),
              maxwidth: parseInt(maxwidth, 10),
              maxheight: parseInt(maxheight, 10)
            };

            if (ox) {
              config.ox = parseFloat(ox);
            }

            if (oy) {
              config.oy = parseFloat(oy);
            }

            if (x && y) {
              config.x      = parseFloat(x);
              config.y      = parseFloat(y);
              config.anchor = null;
            }

            show(tooltipMsg, config);
          }
        }
      });

      $(document.body).delegate('[data-tooltip]', 'mouseleave', hide);
    }
  }

  function show(msg, options) {
    if (!SL.util.device.IS_PHONE && !SL.util.device.IS_TABLET) {
      config = options || {};

      clearTimeout(timer);

      var timeDelay = Date.now() - dateTime;

      if (typeof config.delay === "number" && timeDelay > 500) {
        //timer = setTimeout(show.bind(this, msg, config), config.delay);
        timer = setTimeout(function () {
          show(msg, config);
        }, config.delay);
        delete config.delay;

        return;
      }

      $tooltip.css('opacity', 0);
      $tooltip.appendTo(document.body);
      $inner.html(msg);

      $tooltip.css('max-width', config.maxwidth ? config.maxwidth : null);
      $tooltip.css('max-height', config.maxheight ? config.maxheight : null);

      if (config.align) {
        $tooltip.css('text-align', config.align);
      }

      layout();

      $tooltip.stop(true, true).animate({
        opacity: 1
      }, {
        duration: 150
      });

      $(window).on('resize scroll', layout);
    }
  }

  function hide() {
    if (hasParent()) {
      dateTime = Date.now();
    }

    clearTimeout(timer);

    $tooltip.remove().stop(true, true);

    $(window).off('resize scroll', layout);
  }

  function layout() {
    var $anchor = $(config.anchor);

    if ($anchor.length) {
      var alignment = config.alignment || 'auto',
        padding     = 10,
        scrollLeft  = $(window).scrollLeft(),
        scrollTop   = $(window).scrollTop(),
        offset      = $anchor.offset();

      offset.x = offset.left;
      offset.y = offset.top;

      if (config.anchor.parents('.reveal .slides').length &&
        typeof window.Reveal !== "undefined") {
        offset = SL.util.getRevealElementGlobalOffset(config.anchor);
      }

      var anchorOuterW = $anchor.outerWidth(),
        anchorOuterH   = $anchor.outerHeight(),
        innerOuterW    = $inner.outerWidth(),
        innerOuterH    = $inner.outerHeight(),
        tLeft          = offset.x - scrollLeft,
        tTop           = offset.y - scrollTop,
        aLeft          = innerOuterW / 2,
        aTop           = innerOuterH / 2;

      if (typeof config.ox === "number") {
        tLeft += config.ox;
      }

      if (typeof config.oy === "number") {
        tTop += config.oy;
      }

      if (alignment === 'auto') {
        if (offset.y - (innerOuterH + padding + marginLeft) < scrollTop) {
          alignment = 'b';
        } else {
          alignment = 't';
        }
      }

      switch (alignment) {
        case 't':
          tLeft += (anchorOuterW - innerOuterW) / 2;
          tTop  -= innerOuterH + marginLeft + marginTop;
          break;
        case 'b':
          tLeft += (anchorOuterW - innerOuterW) / 2;
          tTop  += anchorOuterH + marginLeft + marginTop;
          break;
        case 'l':
          tLeft -= innerOuterW + marginLeft + marginTop;
          tTop  += (anchorOuterH - innerOuterH) / 2;
          break;
        case 'r':
          tLeft += anchorOuterW + marginLeft + marginTop;
          tTop  += (anchorOuterH - innerOuterH) / 2;
          break;
      }

      tLeft =
        Math.min(
          Math.max(tLeft, padding),
          window.innerWidth - innerOuterW - padding);
      tTop = Math.min(
        Math.max(tTop, padding),
        window.innerHeight - innerOuterH - padding);

      var nMarginLeft = marginLeft + 3;

      switch (alignment) {
        case 't':
          aLeft = offset.x - tLeft - scrollLeft + anchorOuterW / 2;
          aTop  = innerOuterH;
          aLeft = Math.min(
            Math.max(aLeft, nMarginLeft), innerOuterW - nMarginLeft);
          break;
        case 'b':
          aLeft = offset.x - tLeft - scrollLeft + anchorOuterW / 2;
          aTop  = -marginLeft;
          aLeft = Math.min(
            Math.max(aLeft, nMarginLeft), innerOuterW - nMarginLeft);
          break;
        case 'l':
          aLeft = innerOuterW;
          aTop  = offset.y - tTop - scrollTop + anchorOuterH / 2;
          aTop  = Math.min(
            Math.max(aTop, nMarginLeft), innerOuterH - nMarginLeft);
          break;
        case 'r':
          aLeft = -marginLeft;
          aTop  = offset.y - tTop - scrollTop + anchorOuterH / 2;
          aTop  = Math.min(
            Math.max(aTop, nMarginLeft), innerOuterH - nMarginLeft);
          break;
      }

      $arrow.css({
        left: Math.round(aLeft),
        top: Math.round(aTop)
      });
      $tooltip.css({
        left: Math.round(tLeft),
        top: Math.round(tTop)
      }).attr('data-alignment', alignment);
    }
  }

  function hasParent() {
    return $tooltip.parent().length > 0;
  }

  init();

  return {
    show: function (msg, options) {
      show(msg, options);
    },
    hide: function () {
      hide();
    },
    anchorTo: function (element, tooltipMsg, options) {
      var config = {};

      if (typeof tooltipMsg !== "undefined") {
        config['data-tooltip'] = tooltipMsg;
      }

      if (typeof options.delay === "number") {
        config['data-tooltip-delay'] = options.delay;
      }

      if (typeof options.alignment === "string") {
        config['data-tooltip-alignment'] = options.alignment;
      }

      $(element).attr(config);
    }
  };
})();


/*!
 * project name: SlideStudio
 * name:         warnings.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/10
 */

'use strict';

SL.warnings = {
  STORAGE_KEY: 'slides-last-warning-id',
  MESSAGE_ID:  23,

  /**
   * Initialize And Show Warning Message
   *
   * @function
   */
  init: function () {
    this.showMessage();
  },

  /**
   * Show Warning Message
   *
   * @function
   */
  showMessage: function () {
    if (this.hasMessage() && !this.hasExpired() &&
      SL.util.user.isLoggedIn() && window.Modernizr.localstorage) {
      var key = parseInt(localStorage.getItem(this.STORAGE_KEY), 10) || 0;

      if (this.MESSAGE_ID > key) {
        SL.notify(this.MESSAGE_TEXT, {autoHide: false})
          .destroyed.add(this.hideMessage.bind(this));
      }
    }
  },

  /**
   * Hide Warning Message
   *
   * @function
   */
  hideMessage: function () {
    if (window.Modernizr.localstorage) {
      localStorage.setItem(this.STORAGE_KEY, this.MESSAGE_ID);
    }
  },

  /**
   * Have Warning Message?
   *
   * @function
   * @returns {boolean} True have message, False or not.
   */
  hasMessage: function () {
    return !!this.MESSAGE_TEXT;
  },

  /**
   * Have Expired
   *
   * @function
   * @returns {boolean} True have expired, False or not.
   */
  hasExpired: function () {
    if (this.MESSAGE_EXPIRY) {
      return window.moment()
          .diff(window.moment(this.MESSAGE_EXPIRY)) > 0;
    }

    return false;
  }
};


/*!
 * project name: SlideStudio
 * name:         model.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/7/20
 */

'use strict';

SL('models').Model = Class.extend({
  /**
   * Constructor Model Instance
   *
   * @function
   * @param {Object} data -Model Data
   */
  init: function (data) {
    this.data = data || {};
  },

  /**
   * Have Property ?
   *
   * @function
   * @param {String} property -The Property Name Or Path
   * @returns {boolean} True have this property, False or not
   */
  has: function (property) {
    var value = this.get(property);

    return !!value || value === false || value === 0;
  },

  /**
   * Return JSON This Model's Data String
   *
   * @function
   */
  toJSON: function () {
    return JSON.parse(JSON.stringify(this.data));
  },


  /**
   * Get The Property Value
   *
   * @function
   * @param {String} property -The Property Name Or Path
   * @returns {*} The Property Value
   */
  get: function (property) {
    if (typeof property === "string" && /\./.test(property)) {
      var data = this.data;

      for (var proAry = property.split('.'); proAry.length && data;) {
        property = proAry.shift();
        data = data[property];
      }

      return data;
    }

    return this.data[property];
  },

  /**
   * Set The Property Value
   *
   * @function
   * @param {String} property -The Property Name Or Path
   * @param {*} value -The Property Value
   */
  set: function (property, value) {
    this.data[property] = value;
  }
});


/*!
 * project name: SlideStudio
 * name:         accesstoken.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/7/20
 */

'use strict';

SL('models').AccessToken = SL.models.Model.extend({
  /**
   * Constructor AccessToken Instance
   *
   * @function
   * @param {Object} data -AccessToken Data
   */
  init: function (data) {
    this._super(data);
  },

  /**
   * Save Accesses Data
   *
   * @function
   * @param {Object} accesses -The Accesses Data
   * @returns {*|Promise} Return jQuery Ajax Promise
   */
  save: function (accesses) {
    var data = {
      access_token: {}
    };

    if (accesses) {
      accesses.forEach((function (access) {
        data.access_token[access] = this.get(access);
      }).bind(this));
    } else {
      data.access_token = this.toJSON();
    }

    return $.ajax({
      url:
        SL.config.AJAX_ACCESS_TOKENS_UPDATE(
          this.get('deck_id'), this.get('id')),
      type: 'PUT',
      data: data
    });
  },

  /**
   * Delete Accesses Data
   *
   * @function
   * @returns {*|Promise} Return jQuery Ajax Promise
   */
  destroy: function () {
    return $.ajax({
      url:
        SL.config.AJAX_ACCESS_TOKENS_DELETE(
          this.get('deck_id'), this.get('id')),
      type: 'DELETE'
    });
  },

  /**
   * Clone AccessToken Instance
   *
   * @function
   * @returns {*|AccessToken} AccessToken Instance
   */
  clone: function () {
    return new SL.models.AccessToken(JSON.parse(JSON.stringify(this.data)));
  }
});


/*!
 * project name: SlideStudio
 * name:         customer.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/7/20
 */

'use strict';

SL('models').Customer = SL.models.Model.extend({
  /**
   * Constructor Customer Instance
   *
   * @function
   * @param {Object} data -Customer Data
   */
  init: function (data) {
    this._super(data);
  },

  /**
   * Get Is Trial Version
   *
   * @function
   * @returns {boolean} True Trial Version, False or not
   */
  isTrial: function () {
    return this.get('subscription.status') === 'trialing';
  },

  /**
   * Have Active Subscription
   *
   * @function
   * @returns {*|boolean} True have, False or not
   */
  hasActiveSubscription: function () {
    return this.has('subscription') &&
      !this.get('subscription.cancel_at_period_end');
  },

  /**
   * Get Next Invoice Date
   *
   * @function
   * @returns {*} Invoice Date
   */
  getNextInvoiceDate: function () {
    return this.get('next_charge');
  },

  /**
   * Get Next Invoice Sum
   *
   * @function
   * @returns {string} Invoice Sum
   */
  getNextInvoiceSum: function () {
    return (parseFloat(this.get('next_charge_amount')) / 100).toFixed(2);
  },

  /**
   * Clone AccessToken Instance
   *
   * @function
   * @returns {*|Customer} Customer Instance
   */
  clone: function () {
    return new SL.models.Customer(JSON.parse(JSON.stringify(this.data)));
  }
});


/*!
 * project name: SlideStudio
 * name:         deck.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/7/20
 */

'use strict';

SL('models').Deck = SL.models.Model.extend({
  /**
   * Constructor Deck Instance
   *
   * @function
   * @param {Object} data -Deck Data
   */
  init: function (data) {
    this.data = data || {};

    $.extend(this, this.data);

    this.user_settings =
      new SL.models.UserSettings(this.data.user.settings);
  },

  /**
   * Get Is Pro
   *
   * @function
   * @returns {boolean} True is Pro, False or not
   */
  isPro: function () {
    return this.data.user ? !!this.data.user.pro : false;
  },

  /**
   * Get Is Visibility All
   *
   * @function
   * @returns {boolean} True Visibility All, False or not
   */
  isVisibilityAll: function () {
    return this.get('visibility') === SL.models.Deck.VISIBILITY_ALL;
  },

  /**
   * Get Is Visibility Self
   *
   * @function
   * @returns {boolean} True Visibility Self, False or not
   */
  isVisibilitySelf: function () {
    return this.get('visibility') === SL.models.Deck.VISIBILITY_SELF;
  },

  /**
   * Get Is Visibility Team
   *
   * @function
   * @returns {boolean} True Visibility Team, False or not
   */
  isVisibilityTeam: function () {
    return this.get('visibility') === SL.models.Deck.VISIBILITY_TEAM;
  },

  /**
   * Get Is Belong to user's
   *
   * @function
   * @param {Object} user -The User Data Object
   * @returns {boolean} True is user's, False or not.
   */
  belongsTo: function (user) {
    return this.get('user.id') === user.get('id');
  },

  /**
   * Get Current Deck Url
   *
   * @function
   * @param {Object} paraObj -The Current Deck Parameters
   * @returns {string} This Deck Url
   */
  getURL: function (paraObj) {
    paraObj = $.extend({
      protocol: document.location.protocol,
      token: null,
      view: null
    }, paraObj);

    var username = this.get('user.username'),
      slug = this.get('slug') || this.get('id'),
      url = paraObj.protocol + '//' +
        document.location.host + SL.routes.DECK(username, slug);

    if (paraObj.view) {
      url += '/' + paraObj.view;
    }

    if (paraObj.token) {
      url += '?token=' + paraObj.token.get('token');
    }

    return url;
  },

  /**
   * Clone Deck Instance
   *
   * @function
   * @returns {*|Deck} Deck Instance
   */
  clone: function () {
    return new SL.models.Deck(JSON.parse(JSON.stringify(this.data)));
  }
});

SL('models').Deck.VISIBILITY_SELF = 'self';
SL('models').Deck.VISIBILITY_TEAM = 'team';
SL('models').Deck.VISIBILITY_ALL  = 'all';


/*!
 * project name: SlideStudio
 * name:         mediatag.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/7/20
 */

'use strict';

SL('models').MediaTag = SL.models.Model.extend({
  /**
   * Constructor MediaTag Instance
   *
   * @function
   * @param {Object} data -MediaTag Data
   * @param {Object} crud -MediaTag Operation Url
   */
  init: function (data, crud) {
    this._super(data);

    this.crud = $.extend({
      update:   SL.config.AJAX_MEDIA_TAG_UPDATE,
      'delete': SL.config.AJAX_MEDIA_TAG_DELETE
    }, crud);
  },

  /**
   * Create Media Filter
   *
   * @function
   * @returns {Function} Media Filter
   */
  createFilter: function () {
    var self = this;

    return function (media) {
      return self.hasMedia(media);
    };
  },

  /**
   * Get Have Media In This Medias
   *
   * @function
   * @param {*|Media} media -The Media
   * @returns {boolean} True have, False or not
   */
  hasMedia: function (media) {
    //console.log(this.data);
    if (this.data.specimens) {
      return this.data.specimens.indexOf(media.get('id')) !== -1;
    }
    else {
      return this.data.medias.indexOf(media.get('id')) !== -1;
    }

  },

  /**
   * Add A New Media To This Medias
   *
   * @function
   * @param {*|Media} media -The Media
   */
  addMedia: function (media) {
    if (!this.hasMedia(media)) {
      this.data.medias.push(media.get('id'));
    }
  },

  /**
   * Remove A Media From This Medias
   *
   * @function
   * @param {*|Media} media -The Media
   */
  removeMedia: function (media) {
    var id = media.get('id');

    for (var n = 0; n < this.data.medias.length; n += 1) {
      if (this.data.medias[n] === id) {
        this.data.medias.splice(n, 1);
        n -= 1;
      }
    }
  },

  /**
   * Save Tags To Server
   *
   * @function
   * @param {Object} tags -Media Tag
   * @returns {*|Promise} The jQuery Ajax Promise
   */
  save: function (tags) {
    var data = {
      tag: {}
    };

    if (tags) {
      tags.forEach((function (tag) {
        data.tag[tag] = this.get(tag);
      }).bind(this));
    } else {
      data.tag = this.toJSON();
    }

    return $.ajax({
      url: this.crud.update(this.get('id')),
      type: 'PUT',
      data: data
    });
  },

  /**
   * Delete Tags To Server
   *
   * @function
   * @returns {*|Promise} The jQuery Ajax Promise
   */
  destroy: function () {
    return $.ajax({
      url: this.crud['delete'](this.get('id')),
      type: 'DELETE'
    });
  },

  /**
   * Clone MediaTag Instance
   *
   * @function
   * @returns {*|MediaTag} MediaTag Instance
   */
  clone: function () {
    return new SL.models.MediaTag(JSON.parse(JSON.stringify(this.data)));
  }
});


/*!
 * project name: SlideStudio
 * name:         media.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/7/20
 */

'use strict';

SL('models').Media = SL.models.Model.extend({
  uploadStatus: '',
  uploadFile:   null,

  /**
   * Constructor Media Instance
   *
   * @function
   * @param {Object} data           -Media Data
   * @param {Object} crud           -Media Operation Url
   * @param {File}   uploadFile     -The Media File
   * @param {String} uploadFileName -The Media File Name
   */
  init: function (data, crud, uploadFile, uploadFileName) {
    this._super(data);

    this.crud = $.extend({
      create:   SL.config.AJAX_MEDIA_CREATE,
      update:   SL.config.AJAX_MEDIA_UPDATE,
      'delete': SL.config.AJAX_MEDIA_DELETE
    }, crud);

    if (uploadFile) {
      this.uploadStatus   = SL.models.Media.STATUS_UPLOAD_WAITING;
      this.uploadFile     = uploadFile;
      this.uploadFilename = uploadFileName;
    } else {
      this.uploadStatus = SL.models.Media.STATUS_UPLOADED;
    }

    this.uploadStarted    = new window.signals.Signal();
    this.uploadProgressed = new window.signals.Signal();
    this.uploadCompleted  = new window.signals.Signal();
    this.uploadFailed     = new window.signals.Signal();
  },

  /**
   * Upload Media File
   *
   * @function
   */
  upload: function () {
    if (/\.svg$/i.test(this.uploadFile.name) && window.FileReader) {
      SL.analytics.trackEditor('Media: SVG upload started');

      this.reader = new window.FileReader();
      this.reader.addEventListener('abort', this.uploadValidated.bind(this));
      this.reader.addEventListener('error', this.uploadValidated.bind(this));
      this.reader.addEventListener('load', (function (evt) {
        var $svg = $('<div>' + evt.target.result + '</div>').find('svg');

        if ($svg.length === 0) {
          this.uploadStatus = SL.models.Media.STATUS_UPLOAD_FAILED;
          this.uploadFailed
            .dispatch('Invalid SVG: missing &lt;svg&gt; element');

          SL.analytics
            .trackEditor('Media: SVG upload error', 'missing svg element');
        } else {
          var xmlns = $svg.get(0).hasAttribute('xmlns'),
            viewBox = $svg.get(0).hasAttribute('viewBox'),
            hasWidthAndHeight =
              $svg.get(0).hasAttribute('width') &&
              $svg.get(0).hasAttribute('height');

          if (xmlns) {
            if (viewBox || hasWidthAndHeight) {
              if (viewBox) {
                if (hasWidthAndHeight) {
                  this.uploadValidated();
                } else {
                  this.uploadStatus = SL.models.Media.STATUS_UPLOAD_FAILED;
                  this.uploadFailed.dispatch('SVG error: missing width/height');

                  SL.analytics
                    .trackEditor('Media: SVG upload error', 'missing w/h');
                }
              } else {
                this.uploadStatus = SL.models.Media.STATUS_UPLOAD_FAILED;
                this.uploadFailed.dispatch('SVG error: missing viewBox');

                SL.analytics
                  .trackEditor('Media: SVG upload error', 'missing viewBox');
              }
            } else {
              this.uploadStatus = SL.models.Media.STATUS_UPLOAD_FAILED;
              this.uploadFailed
                .dispatch('SVG error: missing viewBox and width/height');

              SL.analytics
                .trackEditor('Media: SVG upload error', 'missing viewBox or w/h');
            }
          } else {
            this.uploadStatus = SL.models.Media.STATUS_UPLOAD_FAILED;
            this.uploadFailed.dispatch('SVG error: missing xmlns');

            SL.analytics
              .trackEditor('Media: SVG upload error', 'missing xmlns');
          }
        }

        this.reader = null;
      }).bind(this));
      this.reader.readAsText(this.uploadFile, 'UTF-8');
    } else {
      this.uploadValidated();
    }
  },

  /**
   * Get Is Upload File
   *
   * @function
   * @returns {*|boolean} void 0
   */
  uploadValidated: function () {
    if (this.uploader) {
      return false;
    } else {
      this.uploader = new SL.helpers.FileUploader({
        file:     this.uploadFile,
        filename: this.uploadFilename,
        service:  this.crud.create,
        timeout:  60000
      });

      this.uploader.progressed.add(this.onUploadProgress.bind(this));
      this.uploader.succeeded.add(this.onUploadSuccess.bind(this));
      this.uploader.failed.add(this.onUploadError.bind(this));

      this.uploader.upload();

      this.uploadStatus = SL.models.Media.STATUS_UPLOADING;

      return void this.uploadStarted.dispatch();

      //this.uploadStarted.dispatch();
      //return true;
    }
  },

  /**
   * The Callback Upload Progress
   *
   * @function
   * @param {Object} data -The Upload Progress
   */
  onUploadProgress: function (data) {
    this.uploadProgressed.dispatch(data);
  },

  /**
   * The Callback Upload Success
   *
   * @function
   * @param {Object} responses -The Upload Success Data
   */
  onUploadSuccess: function (responses) {
    this.uploader.destroy();
    this.uploader = null;

    for (var item in responses) {
      this.set(item, responses[item]);
    }

    this.uploadStatus = SL.models.Media.STATUS_UPLOADED;
    this.uploadCompleted.dispatch();
  },

  /**
   * The Callback Upload Error
   *
   * @function
   */
  onUploadError: function () {
    this.uploader.destroy();
    this.uploader = null;

    this.uploadStatus = SL.models.Media.STATUS_UPLOAD_FAILED;
    this.uploadFailed.dispatch();
  },

  /**
   * Get Is Waiting To Upload Status
   *
   * @function
   * @returns {boolean} True is Waiting Status, False or not
   */
  isWaitingToUpload: function () {
    return this.uploadStatus === SL.models.Media.STATUS_UPLOAD_WAITING;
  },

  /**
   * Get Is Waiting To Uploading Status
   *
   * @function
   * @returns {boolean} True is Uploading Status, False or not
   */
  isUploading: function () {
    return this.uploadStatus === SL.models.Media.STATUS_UPLOADING;
  },

  /**
   * Get Is Waiting To Uploaded Status
   *
   * @function
   * @returns {boolean} True is Uploaded Status, False or not
   */
  isUploaded: function () {
    return this.uploadStatus === SL.models.Media.STATUS_UPLOADED;
  },

  /**
   * Get Is Waiting To Upload Failed Status
   *
   * @function
   * @returns {boolean} True is Upload Failed Status, False or not
   */
  isUploadFailed: function () {
    return this.uploadStatus === SL.models.Media.STATUS_UPLOAD_FAILED;
  },

  /**
   * Get Is Image Media
   *
   * @function
   * @returns {boolean} True is Image, False or not
   */
  isImage: function () {
    return /^image\//.test(this.get('content_type'));
  },

  /**
   * Get Is SVG Media
   *
   * @function
   * @returns {boolean} True is SVG, False or not
   */
  isSVG: function () {
    return /^image\/svg/.test(this.get('content_type'));
  },

  /**
   * Get Is Video Media
   *
   * @function
   * @returns {boolean} True is Video, False or not
   */
  isVideo: function () {
    return /^video\//.test(this.get('content_type'));
  },

  /**
   * Save Medias To Server
   *
   * @function
   * @param {Array} medias -The Media Array
   * @returns {*|Promise} The jQuery Ajax Promise
   */
  save: function (medias) {
    var data = {
      media: {}
    };

    if (medias) {
      medias.forEach((function (m) {
        data.media[m] = this.get(m);
      }).bind(this));
    } else {
      data.media = this.toJSON();
    }

    return $.ajax({
      url:  this.crud.update(this.get('id')),
      type: 'PUT',
      data: data
    });
  },

  /**
   * Delete Medias To Server
   *
   * @function
   * @returns {*|Promise} The jQuery Ajax Promise
   */
  destroy: function () {
    this.uploadFile = null;

    if (this.uploadStarted) {
      this.uploadStarted.dispose();
    }

    if (this.uploadProgressed) {
      this.uploadProgressed.dispose();
    }

    if (this.uploadCompleted) {
      this.uploadCompleted.dispose();
    }

    if (this.uploadFailed) {
      this.uploadFailed.dispose();
    }

    if (this.uploader) {
      this.uploader.destroy();
      this.uploader = null;
    }

    return $.ajax({
      url: this.crud['delete'](this.get('id')),
      type: 'DELETE'
    });
  },

  /**
   * Clone Media Instance
   *
   * @function
   * @returns {*|Media} Media Instance
   */
  clone: function () {
    return new SL.models.Media(JSON.parse(JSON.stringify(this.data)));
  }
});

SL.models.Media.STATUS_UPLOAD_WAITING = 'waiting';
SL.models.Media.STATUS_UPLOADING      = 'uploading';
SL.models.Media.STATUS_UPLOADED       = 'uploaded';
SL.models.Media.STATUS_UPLOAD_FAILED  = 'upload-failed';
SL('models.Media').All = {
  id: 'all',

  /**
   * Image Filter
   *
   * @function
   * @param {Media} obj -The Media Object
   * @returns {*|boolean} True is Image, False or not
   */
  filter: function (obj) {
    return obj.isAll();
  }
};

SL('models.Media').IMAGE = {
  id: 'image',

  /**
   * Image Filter
   *
   * @function
   * @param {Media} obj -The Media Object
   * @returns {*|boolean} True is Image, False or not
   */
  filter: function (obj) {
    return obj.isImage();
  }
};

SL('models.Media').SVG   = {
  id: 'svg',

  /**
   * SVG Filter
   *
   * @function
   * @param {Media} obj -The Media Object
   * @returns {*|boolean} True is SVG, False or not
   */
  filter: function (obj) {
    return obj.isSVG();
  }
};

SL('models.Media').VIDEO = {
  id: 'video',

  /**
   * Video Filter
   *
   * @function
   * @param {Media} obj -The Media Object
   * @returns {*|boolean} True is Video, False or not
   */
  filter: function (obj) {
    return obj.isVideo();
  }
};


/*!
 * project name: SlideStudio
 * name:         team.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/7/20
 */

'use strict';

SL('models').Team = SL.models.Model.extend({
  /**
   * Constructor Team Instance
   *
   * @function
   * @param {Object} data -Team Data
   */
  init: function (data) {
    this._super(data);

    if (typeof this.data.themes === "object") {
      for (var i = 0; i < this.data.themes.length; i += 1) {
        this.data.themes[i] = new SL.models.Theme(this.data.themes[i]);
      }
    }

    this.set('themes', new SL.collections.Collection(this.data.themes));
  },

  /**
   * Get This Team Have Themes
   *
   * @function
   * @returns {*|boolean} True have, False or not
   */
  hasThemes: function () {
    var themes = this.get('themes');
    return themes && themes.size() > 0;
  },

  /**
   * Clone Team Instance
   *
   * @function
   * @returns {*|Team} Team Instance
   */
  clone: function () {
    return new SL.models.Team(JSON.parse(JSON.stringify(this.data)));
  }
});


/*!
 * project name: SlideStudio
 * name:         template.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/7/20
 */

'use strict';

SL('models').Template = SL.models.Model.extend({
  /**
   * Constructor Template Instance
   *
   * @function
   * @param {Object} theme -This Template Theme Object Data
   */
  init: function (theme) {
    this._super(theme);
  },

  /**
   * Get Is Available For Theme
   *
   * @function
   * @param {Object} theme -This Template Theme
   * @returns {boolean} True have, False or not
   */
  isAvailableForTheme: function (theme) {
    return theme.hasSlideTemplate(this.get('id')) ||
      this.isAvailableForAllThemes();
  },

  /**
   * Get Is Available For All Theme
   *
   * @function
   * @returns {boolean} True have, False or not
   */
  isAvailableForAllThemes: function () {
    var id = this.get('id');

    return !SL.current_user.getThemes().some(function (theme) {
      return theme.hasSlideTemplate(id);
    });
  }
});


/*!
 * project name: SlideStudio
 * name:         themesnippet.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/7/20
 */

'use strict';

SL('models').ThemeSnippet = SL.models.Model.extend({
  /**
   * Constructor ThemeSnippet Instance
   *
   * @function
   * @param {Object} themeSnippet -ThemeSnippet Data
   */
  init: function (themeSnippet) {
    this._super(themeSnippet);

    if (!this.has('title')) {
      this.set('title', '');
    }

    if (!this.has('template')) {
      this.set('template', '');
    }
  },

  /**
   * According To templateParas Return Theme Template String
   *
   * @function
   * @param templateParas
   * @returns {*|String} Theme Template String
   */
  template: function (templateParas) {
    var template = this.get('template');

    if (template) {
      template =
        template
          .split(SL.models.ThemeSnippet.TEMPLATE_SELECTION_TAG)
          .join('');

      templateParas.forEach(function (para) {
        template = template.replace(para.string, para.value || para.defaultValue);
      });
    }

    return template;
  },

  /**
   * Get Template Variables
   *
   * @function
   * @returns {*|Array} Return Template Variables
   */
  getTemplateVariables: function () {
    var template = this.get('template');

    if (template) {
      template =
        template
          .split(SL.models.ThemeSnippet.TEMPLATE_SELECTION_TAG)
          .join('');

      var paras =
        template.match(SL.models.ThemeSnippet.TEMPLATE_VARIABLE_REGEX);

      if (paras) {
        paras = paras.map(function (para) {
          var variableAry = para.split(SL.models.ThemeSnippet.TEMPLATE_VARIABLE_DIVIDER),
            variable = {
              string:       para,
              label:        variableAry[0] || '',
              defaultValue: variableAry[1] || ''
            };

          variable.label = variable.label.trim();
          variable.defaultValue = variable.defaultValue.trim();
          variable.label =
            variable.label
              .replace(SL.models.ThemeSnippet.TEMPLATE_VARIABLE_OPENER, '');
          variable.label =
            variable.label
              .replace(SL.models.ThemeSnippet.TEMPLATE_VARIABLE_CLOSER, '');
          variable.defaultValue =
            variable.defaultValue
              .replace(SL.models.ThemeSnippet.TEMPLATE_VARIABLE_OPENER, '');
          variable.defaultValue =
            variable.defaultValue
              .replace(SL.models.ThemeSnippet.TEMPLATE_VARIABLE_CLOSER, '');

          return variable;
        });

        return paras;
      }
    }

    return [];
  },

  /**
   * Get Template Have Variables
   *
   * @function
   * @returns {boolean} True Have Variables, False or not
   */
  templateHasVariables: function () {
    return this.getTemplateVariables().length > 0;
  },

  /**
   * Get Template Have Selection Element
   *
   * @function
   * @returns {boolean} True Is Template Have Selection Element,
   *     False or not
   */
  templateHasSelection: function () {
    var template = this.get('template');

    if (template) {
      return template
          .indexOf(SL.models.ThemeSnippet.TEMPLATE_SELECTION_TAG) > -1;
    } else {
      return false;
    }
  },

  /**
   * Get ThemeSnippet Is Empty
   *
   * @function
   * @returns {boolean} True is Empty, False or not
   */
  isEmpty: function () {
    return !this.get('title') && !this.get('template');
  }
});

SL.models.ThemeSnippet.TEMPLATE_VARIABLE_OPENER  = '{{';
SL.models.ThemeSnippet.TEMPLATE_VARIABLE_CLOSER  = '}}';
SL.models.ThemeSnippet.TEMPLATE_VARIABLE_DIVIDER = '::';
SL.models.ThemeSnippet.TEMPLATE_VARIABLE_REGEX   = /\{\{.*?\}\}/gi;
SL.models.ThemeSnippet.TEMPLATE_SELECTION_TAG    = '{{selection}}';


/*!
 * project name: SlideStudio
 * name:         theme.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/7/20
 */

'use strict';

SL('models').Theme = SL.models.Model.extend({
  /**
   * Constructor Theme Instance
   *
   * @function
   * @param {Object} options -Theme Config Data
   */
  init: function (options) {
    this._super(options);

    if (!this.has('name')) {
      this.set('name', 'Untitled');
    }

    this.set(
      'slide_template_ids',
      new SL.collections.Collection(this.data.slide_template_ids));

    this.loading = false;
  },

  /**
   * Load Theme
   *
   * @function
   * @returns {*|Promise} The jQuery Ajax Promise
   */
  load: function () {
    this.loading = true;

    return $.ajax({
      type: 'GET',
      url: SL.config.AJAX_THEMES_READ(this.get('id')),
      context: this
    }).done(function (data) {
      this.data = $.extend(data, this.data);

      if (!this.has('font')) {
        this.set('font', SL.config.DEFAULT_THEME_FONT);
      }

      if (!this.has('color')) {
        this.set('color', SL.config.DEFAULT_THEME_COLOR);
      }

      if (!this.has('transition')) {
        this.set('transition', SL.config.DEFAULT_THEME_TRANSITION);
      }

      if (!this.has('background_transition')) {
        this.set(
          'background_transition',
          SL.config.DEFAULT_THEME_BACKGROUND_TRANSITION);
      }

      if (typeof this.data.snippets === "string" &&
        typeof this.data.snippets.length > 0) {
        try {
          this.data.snippets = JSON.parse(this.data.snippets);
        } catch (err) {
          console.warn('Malformed snippets JSON');
        }
      }

      this.set(
        'snippets',
        new SL.collections.Collection(
          this.data.snippets, SL.models.ThemeSnippet));

      if (typeof this.data.snippets === "string" &&
        typeof this.data.snippets.length > 0) {
        this.data.palette = this.data.palette.split(',');
        this.data.palette = this.data.palette.map(function (item) {
          return item.trim();
        });
      } else {
        this.data.palette = [];
      }
    }).always(function () {
      this.loading = false;
    });
  },

  /**
   * According To Template Id Get Slide Have Template
   *
   * @function
   * @param templateIds
   * @returns {*|boolean} True Contain Template, False or not
   */
  hasSlideTemplate: function (templateIds) {
    return this.get('slide_template_ids').contains(templateIds);
  },

  /**
   * Add Template To Slide
   *
   * @function
   * @param {String|Number} templateIds -The Template Id
   * @returns {*|Promise} The jQuery Ajax Promise
   */
  addSlideTemplate: function (templateIds) {
    var ids = this.get('slide_template_ids');

    templateIds.forEach(function (id) {
      if (!ids.contains(id)) {
        ids.push(id);
      }
    });

    return $.ajax({
      type: 'POST',
      url: SL.config.AJAX_THEME_ADD_SLIDE_TEMPLATE(this.get('id')),
      context: this,
      data: {
        slide_template_ids: templateIds
      }
    });
  },

  /**
   * Delete Template To Slide
   *
   * @function
   * @param {String|Number} templateIds -The Template Id
   * @returns {*|Promise} The jQuery Ajax Promise
   */
  removeSlideTemplate: function (templateIds) {
    var ids = this.get('slide_template_ids');

    templateIds.forEach(function (id) {
      ids.remove(id);
    });

    return $.ajax({
      type: 'DELETE',
      url: SL.config.AJAX_THEME_REMOVE_SLIDE_TEMPLATE(this.get('id')),
      context: this,
      data: {
        slide_template_ids: templateIds
      }
    });
  },

  /**
   * Get Theme Have Thumbnail
   *
   * @function
   * @returns {boolean} True Have Thumbnail, False or not
   */
  hasThumbnail: function () {
    return !!this.get('thumbnail_url');
  },

  /**
   * Get Theme Have JavaScript
   *
   * @function
   * @returns {boolean} True Have JavaScript, False or not
   */
  hasJavaScript: function () {
    return !!this.get('js');
  },

  /**
   * Get Theme Have Palette
   *
   * @function
   * @returns {boolean} True Have Palette, False or not
   */
  hasPalette: function () {
    return this.get('palette').length > 0;
  },

  /**
   * Get This Theme Is Supported Transition
   *
   * @function
   * @returns {boolean} True Support Transition, False or not
   */
  isTransitionDeprecated: function () {
    var transitionId = this.get('transition');

    return SL.config.THEME_TRANSITIONS.some(function (transition) {
      return transition.id === transitionId &&
        transition.deprecated === true;
    });
  },

  /**
   * Get This Theme Is Supported Background Transition
   *
   * @function
   * @returns {boolean} True Support Background Transition, False or not
   */
  isBackgroundTransitionDeprecated: function () {
    var transitionId = this.get('background_transition');

    return SL.config
      .THEME_BACKGROUND_TRANSITIONS
      .some(function (transition) {
        return transition.id === transitionId &&
          transition.deprecated === true;
      });
  },

  /**
   * Get Is Loading Status
   *
   * @function
   * @returns {*|boolean} True is loading, false or not
   */
  isLoading: function () {
    return this.loading;
  },

  /**
   * Clone Theme Instance
   *
   * @function
   * @returns {*} Theme Instance
   */
  clone: function () {
    return new SL.models.Theme(JSON.parse(JSON.stringify(this.toJSON())));
  },

  /**
   * Convert Theme To Json String
   *
   * @function
   * @returns {{
   *     id: *,
   *     name: *,
   *     center: *,
   *     rolling_links: *,
   *     font: *,
   *     color: *,
   *     transition: *,
   *     background_transition: *,
   *     html: *,
   *     less: *,
   *     css: *,
   *     js: *,
   *     snippets: null,
   *     palette: *}} Return Theme Json String
   */
  toJSON: function () {
    return {
      id: this.get('id'),
      name: this.get('name'),
      center: this.get('center'),
      rolling_links: this.get('rolling_links'),
      font: this.get('font'),
      color: this.get('color'),
      transition: this.get('transition'),
      background_transition: this.get('background_transition'),
      html: this.get('html'),
      less: this.get('less'),
      css: this.get('css'),
      js: this.get('js'),
      snippets: this.has('snippets') ? JSON.stringify(this.get('snippets').toJSON()) : null,
      palette: this.has('palette') ? this.get('palette').join(',') : null
    };
  }
});

/**
 * @function
 * @param {Object} theme
 * @returns {*|Theme}
 */
SL('models').Theme.fromDeck = function (theme) {
  return new SL.models.Theme({
    id:                    theme.theme_id,
    name:                  '',
    center:                theme.center,
    rolling_links:         theme.rolling_links,
    font:                  theme.theme_font,
    color:                 theme.theme_color,
    transition:            theme.transition,
    background_transition: theme.background_transition,
    snippets:              '',
    palette:               []
  });
};


/*!
 * project name: SlideStudio
 * name:         usersettings.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/7/20
 */

'use strict';

SL('models').UserSettings = SL.models.Model.extend({
  /**
   * Constructor UserSettings Instance
   *
   * @function
   * @param {Object} settings -UserSettings Data
   */
  init: function (settings) {
    this._super(settings);

    if (!this.has('present_controls')) {
      this.set('present_controls', SL.config.PRESENT_CONTROLS_DEFAULT);
    }

    if (!this.has('present_upsizing')) {
      this.set('present_upsizing', SL.config.PRESENT_UPSIZING_DEFAULT);
    }
  },

  /**
   * Save UserSettings To Server
   *
   * @function
   * @param {Object} setPros -User Setting Data Object
   */
  save: function (setPros) {
    var settings = {
      user_settings: {}
    };

    if (setPros) {
      setPros.forEach((function (pro) {
        settings.user_settings[pro] = this.get(pro);
      }).bind(this));
    } else {
      settings.user_settings = this.toJSON();
    }

    $.ajax({
      url: SL.config.AJAX_UPDATE_USER_SETTINGS,
      type: 'PUT',
      data: settings
    });
  },

  /**
   * Clone UserSettings Instance
   *
   * @function
   * @returns {*|UserSettings} UserSettings Instance
   */
  clone: function () {
    return new SL.models
      .UserSettings(JSON.parse(JSON.stringify(this.data)));
  }
});


/*!
 * project name: SlideStudio
 * name:         user.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/7/20
 */

'use strict';

SL('models').User = Class.extend({
  /**
   * Constructor User Instance
   *
   * @function
   * @param {Object} user -User Data
   */
  init: function (user) {
    this.data = user || {};

    $.extend(this, this.data);

    this.settings = new SL.models.UserSettings(this.data.settings);
  },

  /**
   * Get User is Pro
   *
   * @function
   * @returns {boolean} True is Pro, False or not
   */
  isPro: function () {
    return !!this.pro;
  },

  /**
   * Get User is Enterprise
   *
   * @function
   * @returns {boolean} True is Enterprise, False or not
   */
  isEnterprise: function () {
    return !!this.enterprise;
  },

  /**
   * Get User is Enterprise Manager
   *
   * @function
   * @returns {boolean} True is Enterprise Manager, False or not
   */
  isEnterpriseManager: function () {
    return !!this.enterprise_manager;
  },

  /**
   * Get User Is Have Special Property
   *
   * @function
   * @param {String|*} property -The Property Name
   * @returns {boolean} True is have, False or not
   */
  has: function (property) {
    var value = this.get(property);

    return !!value || value === false || value === 0;
  },

  /**
   * Get User Is Have Special Themes
   *
   * @function
   * @returns {*|boolean|void 0} True is have, False or not
   */
  hasThemes: function () {
    if (SL.current_team) {
      return SL.current_team.hasThemes();
    } else {
      return void 0;
    }
  },

  /**
   * Get User Themes
   *
   * @function
   * @returns {*|Collection(Array)} Return User Themes
   */
  getThemes: function () {
    if (SL.current_team) {
      return SL.current_team.get('themes');
    } else {
      return new SL.collections.Collection();
    }
  },

  /**
   * Get User Have Default Theme
   *
   * @function
   * @returns {boolean} True have default theme, False or not
   */
  hasDefaultTheme: function () {
    return !!this.getDefaultTheme();
  },

  /**
   * Get User Default Theme
   *
   * @function
   * @returns {*|Theme} Return Default theme
   */
  getDefaultTheme: function () {
    var id = null, theme = this.getThemes();

    if (SL.current_team) {
      id = SL.current_team.get('default_theme_id');
    } else {
      id = this.default_theme_id;
    }

    return theme.getByProperties({id: id});
  },

  /**
   * Get Profile URL(User Home Page)
   *
   * @function
   * @returns {string} The Url of user
   */
  getProfileURL: function () {
    return '/' + this.username;
  },

  /**
   * Get User Name
   *
   * @function
   * @returns {*|SL.util.validate.username|Function|null} User Name
   */
  getNameOrSlug: function () {
    return this.name || this.username;
  },


  /**
   * According To Special Property Name Get User Property
   *
   * @function
   * @param {String} property -The Property Name
   * @returns {*} User Property
   */
  get: function (property) {
    return this[property];
  },

  /**
   * Set User Property Value
   *
   * @function
   * @param {String} property -The Property Name
   * @param {*}      value    -The Property Value
   */
  set: function (property, value) {
    this[property] = value;
  }
});


/*!
 * project name: SlideStudio
 * name:         fileuploader.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/7/20
 */

'use strict';

SL('helpers').FileUploader = Class.extend({
  /**
   * Constructor FileUploader Instance
   *
   * @function
   * @param {Object} options -Initialize Parameter
   */
  init: function (options) {
    this.options = $.extend({
      formdata:    true,
      contentType: false,
      external:    false,
      method:      'POST'
    }, options);

    if (typeof this.options.file === "undefined" ||
      typeof this.options.service === "undefined") {
      throw 'File and service must be defined for FileUploader task.';
    }

    this.timeout   = -1;
    this.uploading = false;

    this.onUploadSuccess  = this.onUploadSuccess.bind(this);
    this.onUploadProgress = this.onUploadProgress.bind(this);
    this.onUploadError    = this.onUploadError.bind(this);

    this.failed     = new window.signals.Signal();
    this.succeeded  = new window.signals.Signal();
    this.progressed = new window.signals.Signal();
  },

  /**
   * Upload File To Server
   *
   * @function
   */
  upload: function () {
    this.uploading = true;

    clearTimeout(this.timeout);

    if (typeof this.options.timeout === "number") {
      this.timeout = setTimeout(this.onUploadError, this.options.timeout);
    }

    this.xhr                   = new XMLHttpRequest();
    this.xhr.onload            = (function () {
      if (this.options.external === true) {
        this.onUploadSuccess();
      } else if (this.xhr.status === 422 || this.xhr.status === 500) {
        this.onUploadError();
      } else {
        var responseData = {};

        try {
          responseData = JSON.parse(this.xhr.responseText);
        } catch (err) {
          return this.onUploadError();
        }

        this.onUploadSuccess(responseData);
      }
    }).bind(this);
    this.xhr.onerror           = this.onUploadError;
    this.xhr.upload.onprogress = this.onUploadProgress;
    this.xhr.open(this.options.method, this.options.service, true);

    if (this.options.contentType) {
      var type = '';

      if (typeof this.options.contentType === "string") {
        type = this.options.contentType;
      } else {
        type = this.options.file.type;
      }

      if (type) {
        this.xhr.setRequestHeader('Content-Type', type);
      }
    }

    if (this.options.formdata) {
      var formData = new FormData();

      if (this.options.filename) {
        formData.append('file', this.options.file, this.options.filename);
      } else {
        formData.append('file', this.options.file);
      }

      var csrf = this.options.csrf ||
        document.querySelector('meta[name="csrf-token"]');

      if (csrf && !this.options.external) {
        formData.append('authenticity_token', csrf.getAttribute('content'));
      }

      this.xhr.send(formData);
    } else {
      this.xhr.send(this.options.file);
    }
  },

  /**
   * Get is uploading file
   *
   * @function
   * @returns {boolean} True is uploading, False or not.
   */
  isUploading: function () {
    return this.uploading;
  },

  /**
   * Upload File Success Callback
   *
   * @function
   * @param {*|Object} data -The Server Return Data.
   */
  onUploadSuccess: function (data) {
    clearTimeout(this.timeout);
    this.uploading = false;
    this.succeeded.dispatch(data);
  },

  /**
   * Upload Progress Callback
   *
   * @function
   * @param {*|Object} data -The Server Return Data.
   */
  onUploadProgress: function (data) {
    if (data.lengthComputable) {
      this.progressed.dispatch(data.loaded / data.total);
    }
  },

  /**
   * Upload File Error Callback
   *
   * @function
   */
  onUploadError: function () {
    clearTimeout(this.timeout);
    this.uploading = false;
    this.failed.dispatch();
  },

  /**
   * Destroy FileUploader Instance
   *
   * @function
   */
  destroy: function () {
    clearTimeout(this.timeout);

    if (this.xhr) {
      var cb = function () {};

      this.xhr.onload            = cb;
      this.xhr.onerror           = cb;
      this.xhr.upload.onprogress = cb;

      this.xhr.abort();
    }

    this.succeeded.dispose();
    this.progressed.dispose();
    this.failed.dispose();
  }
});


/*!
 * project name: SlideStudio
 * name:         fullscreen.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/7/20
 */

'use strict';

SL.helpers.Fullscreen = {
  /**
   * Enter FullScreen
   *
   * @function
   * @param {*|DOM Element} element -The Element Enter FullScreen
   */
  enter: function (element) {
    element = element || document.body;

    var fullScreen =
      element.requestFullScreen || element.webkitRequestFullscreen ||
      element.webkitRequestFullScreen || element.mozRequestFullScreen ||
      element.msRequestFullscreen;

    if (fullScreen) {
      fullScreen.apply(element);
    }
  },

  /**
   * Exit FullScreen
   *
   * @function
   */
  exit: function () {
    var exitFullScreen =
      document.exitFullscreen || document.msExitFullscreen ||
      document.mozCancelFullScreen || document.webkitExitFullscreen;

    if (exitFullScreen) {
      exitFullScreen.apply(document);
    }
  },

  /**
   * Toggle FullScreen
   *
   * @function
   */
  toggle: function () {
    if (SL.helpers.Fullscreen.isActive()) {
      SL.helpers.Fullscreen.exit();
    } else {
      SL.helpers.Fullscreen.enter();
    }
  },

  /**
   * Is Supported FullScreen
   *
   * @function
   * @returns {boolean} True is enabled FullScreen, False or not.
   */
  isEnabled: function () {
    return !!(document.fullscreenEnabled || document.mozFullscreenEnabled ||
      document.msFullscreenEnabled || document.webkitFullscreenEnabled);
  },

  /**
   * Is Active FullScreen
   *
   * @function
   * @returns {boolean} True is Active FullScreen, False or not.
   */
  isActive: function () {
    return !!(document.fullscreenElement || document.msFullscreenElement ||
      document.mozFullScreenElement || document.webkitFullscreenElement);
  }
};


/*!
 * project name: SlideStudio
 * name:         imageuploader.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/7/20
 */

'use strict';

SL('helpers').ImageUploader = Class.extend({
  /**
   * Constructor ImageUploader Instance
   *
   * @function
   * @param {*|Object} options -Initialize Parameter
   */
  init: function (options) {
    this.options = $.extend({
      service: SL.config.AJAX_MEDIA_CREATE,
      timeout: 90000
    }, options);

    this.onUploadSuccess  = this.onUploadSuccess.bind(this);
    this.onUploadProgress = this.onUploadProgress.bind(this);
    this.onUploadError    = this.onUploadError.bind(this);

    this.progressed = new window.signals.Signal();
    this.succeeded  = new window.signals.Signal();
    this.failed     = new window.signals.Signal();
  },

  /**
   * Upload Image File To Server
   *
   * @function
   * @param {File|*} file -The File interface provides
   *     information about files and allows to access their content.
   * @param {String} fileName -The image file name.
   */
  upload: function (file, fileName) {
    if (file && file.type.match(/image.*/)) {
      if (typeof file.size === "number" &&
        file.size / 1024 > SL.config.MAX_IMAGE_UPLOAD_SIZE.maxsize) {
        return void SL.notify(
          'No more than ' +
          Math.round(SL.config.MAX_IMAGE_UPLOAD_SIZE / 1000) +
          'mb please',
          'negative');
      } else {
        if (this.fileUploader) {
          this.fileUploader.destroy();
        }

        this.fileUploader = new SL.helpers.FileUploader({
          file: file,
          filename: fileName || this.options.filename,
          service: this.options.service,
          timeout: this.options.timeout
        });

        this.fileUploader.succeeded.add(this.onUploadSuccess);
        this.fileUploader.progressed.add(this.onUploadProgress);
        this.fileUploader.failed.add(this.onUploadError);

        return void this.fileUploader.upload();
      }
    } else {
      return void SL.notify('Only image files, please');
    }
  },

  /**
   * Get is uploading file
   *
   * @function
   * @returns {boolean|*} True is uploading, False or not.
   */
  isUploading: function () {
    return !!this.fileUploader && this.fileUploader.isUploading();
  },

  /**
   * Upload File Success Callback
   *
   * @function
   * @param {*|Object} data -The Server Return Data.
   */
  onUploadSuccess: function (data) {
    if (data && typeof data.url === "string") {
      this.succeeded.dispatch(data.url);
    } else {
      this.failed.dispatch();
    }

    this.fileUploader.destroy();
    this.fileUploader = null;
  },

  /**
   * Upload Progress Callback
   *
   * @function
   * @param {*|Object} data -The Server Return Data.
   */
  onUploadProgress: function (data) {
    this.progressed.dispatch(data);
  },

  /**
   * Upload File Error Callback
   *
   * @function
   */
  onUploadError: function () {
    this.failed.dispatch();
    this.fileUploader.destroy();
    this.fileUploader = null;
  },

  /**
   * Destroy FileUploader Instance
   *
   * @function
   */
  destroy: function () {
    this.succeeded.dispose();
    this.progressed.dispose();
    this.failed.dispose();

    if (this.fileUploader) {
      this.fileUploader.destroy();
    }
  }
});


/*!
 * project name: SlideStudio
 * name:         pageloader.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/7/20
 */

'use strict';

SL.helpers.PageLoader = {
  /**
   * Show PageLoader Control
   *
   * @function
   * @param {Object} options -Initialize Parameter
   */
  show: function (options) {
    options = $.extend({
      container: null,
      style:     null,
      message:   null
    }, options);

    var $loader = $('.page-loader');

    if ($loader.length === 0) {
      $loader = $([
        '<div class="page-loader">',
          '<div class="page-loader-inner hidden">',
            '<p class="page-loader-message"></p>',
            '<div class="page-loader-spinner spinner"></div>',
          '</div>',
        '</div>'].join('')).appendTo(document.body);

      setTimeout(function () {
        $loader.find('.page-loader-inner').removeClass('hidden');
      }, 1);
    }

    if (options.container) {
      $loader.appendTo(options.container);
    }

    if (options.message) {
      $loader.find('.page-loader-message').html(options.message);
    }

    if (options.style) {
      $loader.attr('data-style', options.style);
    }

    clearTimeout(this.hideTimeout);

    $loader.removeClass('frozen');
    $loader.addClass('visible');
  },

  /**
   * Hide PageLoader Control
   *
   * @function
   */
  hide: function () {
    $('.page-loader').removeClass('visible');

    clearTimeout(SL.helpers.PageLoader.hideTimeout);

    SL.helpers.PageLoader.hideTimeout = setTimeout((function () {
      $('.page-loader').addClass('frozen');
    }).bind(this), 1000);
  },

  /**
   * Fonts PageLoader Control
   *
   * @function
   * @param {Object} options -Initialize Parameter
   */
  waitForFonts: function (options) {
    if (SL.fonts.isReady() === false) {
      this.show(options);
      SL.fonts.ready.add(this.hide);
    }
  }
};


/*!
 * project name: SlideStudio
 * name:         polljob.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/7/20
 */

'use strict';

SL('helpers').PollJob = Class.extend({
  /**
   * Constructor PollJob Instance
   *
   * @function
   * @param {Object} options -Initialize Parameter
   */
  init: function (options) {
    this.options = $.extend({
      interval: 1000,
      timeout:  Number.MAX_VALUE,
      retries:  Number.MAX_VALUE
    }, options);

    this.interval = -1;
    this.running  = false;

    this.poll   = this.poll.bind(this);

    this.ended  = new window.signals.Signal();
    this.polled = new window.signals.Signal();
  },

  /**
   * Start PollJob
   *
   * @function
   */
  start: function () {
    this.running   = true;

    this.pollStart = Date.now();
    this.pollTimes = 0;

    clearInterval(this.interval);

    this.interval = setInterval(this.poll, this.options.interval);
  },

  /**
   * Stop PollJob
   *
   * @function
   */
  stop: function () {
    this.running = false;
    clearInterval(this.interval);
  },

  /**
   * poll
   *
   * @function
   */
  poll: function () {
    this.pollTimes += 1;

    if ((Date.now() - this.pollStart) > this.options.timeout ||
      this.pollTimes > this.options.retries) {
      this.stop();
      this.ended.dispatch();
    } else {
      this.polled.dispatch();
    }
  }
});


/*!
 * project name: SlideStudio
 * name:         streameditor.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/7/20
 */

'use strict';

SL('helpers').StreamEditor = Class.extend({
  /**
   * Constructor StreamEditor Instance
   *
   * @function
   * @param {Object} options -Initialize Parameter
   */
  init: function (options) {
    this.options = $.extend({}, options);

    this.statusChanged   = new window.signals.Signal();
    this.messageReceived = new window.signals.Signal();

    this.socketIsDisconnected = false;
    this.debugMode            = true;//!!SL.util.getQuery().debug;
  },

  /**
   * Connect to Server
   *
   * @function
   */
  connect: function () {
    var url =
      SL.config.STREAM_ENGINE_HOST + '/' +
      SL.config.STREAM_ENGINE_EDITOR_NAMESPACE;

    this.log('socket connected', url);

    this.socket = window.io.connect(url);
    this.socket.on('connect', this.onSocketConnected.bind(this));
    this.socket.on('disconnect', this.onSocketDisconnected.bind(this));
    this.socket.on('message', this.onSocketMessage.bind(this));
  },

  /**
   * Socket Log
   *
   * @function
   */
  log: function () {
    if (this.debugMode && typeof console.log.apply === "function") {
      var msg = ['Stream:'].concat(Array.prototype.slice.call(arguments));
      console.log.apply(console, msg);
    }
  },

  /**
   * Set Socket Status
   *
   * @function
   * @param {*|Object} status -The Socket Status
   */
  setStatus: function (status) {
    if (this.status !== status) {
      this.status = status;
      this.statusChanged.dispatch(this.status);
    }
  },

  /**
   * Socket Receive Message Callback
   *
   * @function
   * @param {*|XMLHttpResponse} response -The browser's native
   *     XMLHttpRequest object
   */
  onSocketMessage: function (response) {
    try {
      var msg = JSON.parse(response.data);
      this.messageReceived.dispatch(msg);
    } catch (err) {
      this.log('unable to parse streamed socket message as JSON.');
    }

    this.setStatus(SL.helpers.StreamEditor.STATUS_NONE);
  },

  /**
   * Socket Connected Callback
   *
   * @function
   */
  onSocketConnected: function () {
    this.socket.emit('subscribe', {
      deck_id: this.options.deckID
    });

    if (this.socketIsDisconnected === true) {
      this.socketIsDisconnected = false;
      this.log('socket connection regained');
      this.setStatus(SL.helpers.StreamEditor.STATUS_NONE);
    }
  },

  /**
   * Socket Disconnected Callback
   *
   * @function
   */
  onSocketDisconnected: function () {
    if (this.socketIsDisconnected === false) {
      this.socketIsDisconnected = true;
      this.log('socket connection lost');
      this.setStatus(SL.helpers.StreamEditor.STATUS_CONNECTION_LOST);
    }
  }
});

SL.helpers.StreamEditor.STATUS_NONE            = '';
SL.helpers.StreamEditor.STATUS_CONNECTION_LOST = 'connection_lost';


/*!
 * project name: SlideStudio
 * name:         streamlive.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/7/20
 */

'use strict';

SL('helpers').StreamLive = Class.extend({
  /**
   * Constructor StreamLive Instance
   *
   * @function
   * @param {Object} options -Initialize Parameter
   */
  init: function (options) {
    this.options = $.extend({
      reveal:      window.Reveal,
      subscriber:  true,
      publisher:   false,
      publisherID: Date.now() + '-' + Math.round(1e6 * Math.random()),
      deckID:      SL.current_deck.get('id')
    }, options);

    this.ready              = new window.signals.Signal();
    this.stateChanged       = new window.signals.Signal();
    this.statusChanged      = new window.signals.Signal();
    this.subscribersChanged = new window.signals.Signal();

    this.socketIsDisconnected = false;
    this.debugMode            = !!SL.util.getQuery().debug;
  },

  /**
   * Connect
   *
   * @function
   */
  connect: function () {
    if (this.options.publisher) {
      this.setupPublisher();
    } else {
      this.setupSubscriber();
    }
  },

  /**
   * SetupPublisher
   *
   * @function
   */
  setupPublisher: function () {
    this.publish     = this.publish.bind(this);
    this.publishable = true;

    this.options.reveal.addEventListener('slidechanged', this.publish);
    this.options.reveal.addEventListener('fragmentshown', this.publish);
    this.options.reveal.addEventListener('fragmenthidden', this.publish);
    this.options.reveal.addEventListener('overviewshown', this.publish);
    this.options.reveal.addEventListener('overviewhidden', this.publish);
    this.options.reveal.addEventListener('paused', this.publish);
    this.options.reveal.addEventListener('resumed', this.publish);

    $.ajax({
      url:  '/api/v1/decks/' + this.options.deckID + '/stream',
      type: 'GET',
      context: this
    }).done(function (data) {
      this.log('found existing stream');
      this.setState(JSON.parse(data.state), true);
      this.setupSocket();
      this.ready.dispatch();
    }).error(function () {
      this.log('no existing stream, publishing state');
      this.publish((function () {
        this.setupSocket();
        this.ready.dispatch();
      }).bind(this));
    });
  },

  /**
   * SetupSubscriber
   *
   * @function
   */
  setupSubscriber: function () {
    $.ajax({
      url:  '/api/v1/decks/' + this.options.deckID + '/stream',
      type: 'GET',
      context: this
    }).done(function (data) {
      this.log('found existing stream');
      this.setStatus(SL.helpers.StreamLive.STATUS_NONE);
      this.setState(JSON.parse(data.state), true);
      this.setupSocket();
      this.ready.dispatch();
    }).error(function () {
      this.retryStartTime = Date.now();
      this.setStatus(SL.helpers.StreamLive.STATUS_WAITING_FOR_PUBLISHER);
      this.log('no existing stream, retrying in ' +
        SL.helpers.StreamLive.CONNECTION_RETRY_INTERVAL / 1000 + 's');

      setTimeout(
        this.setupSubscriber.bind(this),
        SL.helpers.StreamLive.CONNECTION_RETRY_INTERVAL);
    });
  },

  /**
   * SetupSocket
   *
   * @function
   */
  setupSocket: function () {
    if (this.options.subscriber) {
      var url =
        SL.config.STREAM_ENGINE_HOST + '/' +
        SL.config.STREAM_ENGINE_LIVE_NAMESPACE;

      this.log('socket connected', url);

      this.socket = window.io.connect(url);
      this.socket.on('connect', this.onSocketConnected.bind(this));
      this.socket.on('disconnect', this.onSocketDisconnected.bind(this));
      this.socket.on('message', this.onSocketStateMessage.bind(this));
      this.socket.on('subscribers', this.onSocketSubscribersMessage.bind(this));
    }
  },

  /**
   * Publish deck
   *
   * @function
   * @param {Function|*} successCb -The Success Callback
   * @param {Function|*} stateObj  -The Return Data
   */
  publish: function (successCb, stateObj) {
    if (this.publishable) {
      var state = this.options.reveal.getState();
      state.publisher_id = this.options.publisherID;
      state = $.extend(state, stateObj);

      this.log('publish', state.publisher_id);

      $.ajax({
        url: '/api/v1/decks/' + this.options.deckID + '/stream',
        type: 'PUT',
        data: {
          state: JSON.stringify(state)
        },
        success: successCb
      });
    }
  },

  /**
   * Log
   *
   * @function
   */
  log: function () {
    if (this.debugMode && typeof console.log.apply === "function") {
      var msg =
        ['Stream (' + (this.options.publisher ? 'publisher' : 'subscriber') +
        '):'].concat(Array.prototype.slice.call(arguments));

      console.log.apply(console, msg);
    }
  },

  /**
   * @function
   * @param state
   * @param transition
   */
  setState: function (state, transition) {
    this.publishable = false;

    if (transition) {
      $('.reveal').addClass('no-transition');
    }

    this.options.reveal.setState(state);
    this.stateChanged.dispatch(state);

    setTimeout(function () {
      this.publishable = true;

      if (transition) {
        $('.reveal').removeClass('no-transition');
      }
    }.bind(this), 1);
  },

  /**
   * @function
   * @param status
   */
  setStatus: function (status) {
    if (this.status !== status) {
      this.status = status;
      this.statusChanged.dispatch(this.status);
    }
  },

  /**
   * @function
   * @returns {number|*}
   */
  getRetryStartTime: function () {
    return this.retryStartTime;
  },

  /**
   * @function
   * @returns {boolean|*}
   */
  isPublisher: function () {
    return this.options.publisher;
  },

  /**
   * Socket State Message Callback
   *
   * @function
   * @param {*|XMLHttpResponse} response -The browser's native
   *     XMLHttpRequest object
   */
  onSocketStateMessage: function (response) {
    try {
      var data = JSON.parse(response.data);

      if (data.publisher_id !== this.options.publisherID) {
        this.log(
          'sync',
          'from: ' + data.publisher_id, 'to: ' + this.options.publisherID);
        this.setState(data);
      }
    } catch (err) {
      this.log('unable to parse streamed deck state as JSON.');
    }

    this.setStatus(SL.helpers.StreamLive.STATUS_NONE);
  },

  /**
   * Socket Subscribers Message Callback
   *
   * @function
   * @param {*|XMLHttpResponse} response -The browser's native
   *     XMLHttpRequest object
   */
  onSocketSubscribersMessage: function (response) {
    this.subscribersChanged.dispatch(response.subscribers);
  },

  /**
   * Socket Connected Callback
   *
   * @function
   */
  onSocketConnected: function () {
    this.socket.emit('subscribe', {
      deck_id:   this.options.deckID,
      publisher: this.options.publisher
    });

    if (this.socketIsDisconnected === true) {
      this.socketIsDisconnected = false;
      this.log('socket connection regained');
      this.setStatus(SL.helpers.StreamLive.STATUS_NONE);
    }
  },

  /**
   * Socket Disconnected Callback
   *
   * @function
   */
  onSocketDisconnected: function () {
    if (this.socketIsDisconnected === false) {
      this.socketIsDisconnected = true;
      this.log('socket connection lost');
      this.setStatus(SL.helpers.StreamLive.STATUS_CONNECTION_LOST);
    }
  }
});

SL.helpers.StreamLive.CONNECTION_RETRY_INTERVAL    = 20000;
SL.helpers.StreamLive.STATUS_NONE                  = "";
SL.helpers.StreamLive.STATUS_CONNECTION_LOST       = "connection_lost";
SL.helpers.StreamLive.STATUS_WAITING_FOR_PUBLISHER = "waiting_for_publisher";


/*!
 * project name: SlideStudio
 * name:         themecontroller.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/7/20
 */

'use strict';

SL.helpers.ThemeController = {
  /**
   * @function
   * @param theme
   * @param revealConfig
   */
  paint: function (theme, revealConfig) {
    revealConfig = revealConfig || {};

    var $viewport = $('.reveal-viewport');

    if ($viewport.length === 0 || typeof window.Reveal === "undefined") {
      return false;
    }

    this.cleanup();

    $viewport.addClass('theme-font-' + theme.get('font'));
    $viewport.addClass('theme-color-' + theme.get('color'));

    window.Reveal.configure($.extend({
      center:               theme.get('center'),
      rolling_links:        theme.get('rolling_links'),
      transition:           theme.get('transition'),
      backgroundTransition: theme.get('background_transition')
    }, revealConfig));

    if (theme.get('html')) {
      var $htmlOutput = $('#theme-html-output');

      if ($htmlOutput.length) {
        $htmlOutput.html(theme.get('html'));
      } else {
        $('.reveal')
          .append('<div id="theme-html-output">' +
          theme.get('html') + '</div>');
      }
    } else {
      $('#theme-html-output').remove();
    }

    if (theme.get('css')) {
      var $cssOutput = $('#theme-css-output');

      if ($cssOutput.length) {
        $cssOutput.html(theme.get('css'));
      } else {
        $('head')
          .append('<style id="theme-css-output">' +
          theme.get('css') + '</style>');
      }
    } else {
      $('#theme-css-output').remove();
    }

    if (revealConfig.js !== false) {
      if (theme.get('js')) {
        var $jsOutput = $('#theme-js-output');

        if ($jsOutput.text() !== theme.get('js')) {
          $jsOutput.remove();
          $('body')
            .append('<script id="theme-js-output">' +
            theme.get('js') + '</script>');
        }
      } else {
        $('#theme-js-output').remove();
      }
    }

    SL.util.deck.sortInjectedStyles();
    SL.fonts.loadDeckFont(theme.get('font'));
  },

  /**
   * @function
   */
  cleanup: function () {
    var $viewport = $('.reveal-viewport'), $reveal = $('.reveal');

    $viewport.attr(
      'class',
      $viewport
        .attr('class')
        .replace(/theme\-(font|color)\-([a-z0-9-])*/gi, ''));

    SL.config.THEME_TRANSITIONS.forEach(function ($viewport) {
      $reveal.removeClass($viewport.id);
    });
  }
};


/*!
 * project name: SlideStudio
 * name:         popup.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/28
 */

'use strict';

SL('components.popup').Popup          = Class.extend({
  WINDOW_PADDING: 5,
  USE_ABSOLUTE_POSITIONING: SL.util.device.IS_PHONE || SL.util.device.IS_TABLET,

  /**
   * Constructor SL.components.Popup Instance
   *
   * @function
   * @param {Object} options
   */
  init: function (options) {
    this.options = $.extend({
      title:               '',
      titleItem:           '',
      header:              true,
      headerActions: [{
        label:             '关闭',
        className:         'grey',
        callback: this.close.bind(this)
      }],
      width:               'auto',
      height:              'auto',
      singleton:           false,
      closeOnEscape:       true,
      closeOnClickOutside: true
    }, options);

    if (this.options.additionalHeaderActions) {
      this.options.headerActions =
        this.options.additionalHeaderActions
          .concat(this.options.headerActions);
    }

    this.render();
    this.bind();
    this.layout();

    if (this.USE_ABSOLUTE_POSITIONING) {
      var $win = $(window);

      this.$domElement.css({position: 'absolute'});
      this.$innerElement.css({
        maxWidth: $win.width() - 2 * this.WINDOW_PADDING
      });
      this.$innerElement.css({
        position: 'absolute',
        top: $win.scrollTop() +
          ($win.height() - this.$innerElement.outerHeight()) / 2,
        left: $win.scrollLeft() +
          ($win.width() - this.$innerElement.outerWidth()) / 2
      });
    }
  },

  /**
   * @function
   */
  render: function () {
    this.$domElement = $('<div class="sl-popup" data-id="' + this.TYPE + '">');
    this.$domElement.appendTo(document.body);

    this.$innerElement = $('<div class="sl-popup-inner">');
    this.$innerElement.appendTo(this.$domElement);

    if (this.options.header) {
      this.renderHeader();
    }

    this.$bodyElement = $('<div class="sl-popup-body">');
    this.$bodyElement.appendTo(this.$innerElement);
  },

  /**
   * @function
   */
  renderHeader: function () {
    this.$headerElement = $([
      '<header class="sl-popup-header">',
        '<h3 class="sl-popup-header-title">',
          this.options.title,
        '</h3>',
      '</header>'].join(''));
    this.$headerElement.appendTo(this.$innerElement);
    this.$headerTitleElement = this.$headerElement.find('.sl-popup-header-title');

    if (this.options.titleItem) {
      this.$headerTitleElement.append([
        '<span class="sl-popup-header-title-item">',
          this.options.titleItem,
        '</span>'].join(''));
    }

    if (this.options.headerActions &&
      this.options.headerActions.length) {
      this.$headerActionsElement = $('<div class="sl-popup-header-actions">')
        .appendTo(this.$headerElement);

      this.options.headerActions.forEach((function (action) {
        if　(action.type === 'divider') {
          $('<div class="divider"></div>').appendTo(this.$headerActionsElement);
        } else {
          $([
            '<button class="button l ' + action.className + '">',
            action.label,
            '</button>'].join(''))
            .appendTo(this.$headerActionsElement)
            .on('vclick', function (evt) {
              action.callback(evt);
              evt.preventDefault();
            });
        }
      }).bind(this));
    }
  },

  /**
   * @function
   */
  bind: function () {
    this.onKeyDown           = this.onKeyDown.bind(this);
    this.onWindowResize      = this.onWindowResize.bind(this);
    this.onBackgroundClicked = this.onBackgroundClicked.bind(this);

    this.$domElement.on('vclick', this.onBackgroundClicked);
  },

  /**
   * @function
   */
  layout: function () {
    this.$innerElement.css({
      width:  this.options.width,
      height: this.options.height
    });

    if (this.options.height) {
      var height = this.$headerElement ?
        this.$headerElement.outerHeight() : 0;

      if (this.$headerElement && typeof this.options.height === "number") {
        this.$bodyElement.css('height', this.options.height - height);
      } else {
        this.$bodyElement.css('height', 'auto');
      }

      this.$bodyElement.css(
        'max-height',
        window.innerHeight - height - 2 * this.WINDOW_PADDING);
    }

    if (this.$headerElement) {
      var width    = this.$headerElement.width(),
        outerWidth = this.$headerActionsElement.outerWidth();

      this.$headerTitleElement.css('max-width', width - outerWidth - 30);
    }

    if (this.USE_ABSOLUTE_POSITIONING) {
      this.$domElement.css(
        'height', Math.max($(window).height(), $(document).height()));
    }
  },

  /**
   * @function
   * @param {Object} options
   */
  open: function (options) {
    this.$domElement.appendTo(document.body);

    clearTimeout(this.closeTimeout);
    this.closeTimeout = null;

    this.options = $.extend(this.options, options);

    SL.keyboard.keyDown(this.onKeyDown);
    $(window).on('resize', this.onWindowResize);

    window.setTimeout((function () {
      this.$domElement.addClass('visible');
    }).bind(this), 1);
  },

  /**
   * @function
   * @param {boolean} confirm
   */
  close: function (confirm) {
    if (!this.closeTimeout) {
      if (confirm) {
        this.closeConfirmed();
      } else {
        this.checkUnsavedChanges(this.closeConfirmed.bind(this));
      }
    }
  },

  /**
   * @function
   */
  closeConfirmed: function () {
    SL.keyboard.release(this.onKeyDown);
    $(window).off('resize', this.onWindowResize);

    this.$domElement.removeClass('visible');
    SL.popup.unRegister(this);

    this.closeTimeout = setTimeout((function () {
      this.$domElement.detach();

      if (!this.isSingleton()) {
        this.destroy();
      }
    }).bind(this), 500);
  },

  /**
   * @function
   * @param {Fuction|*} cb
   */
  checkUnsavedChanges: function (cb) {
    if (!!cb && typeof cb === "function") {
      cb();
    }
  },

  /**
   * @function
   * @returns {boolean}
   */
  isSingleton: function () {
    return this.options.singleton;
  },

  /**
   * @function
   * @param {String} evt
   */
  onBackgroundClicked: function (evt) {
    if ($(evt.target).is(this.$domElement)) {
      if (this.options.closeOnClickOutside) {
        this.close();
      }

      evt.preventDefault();
    }
  },

  /**
   * @function
   */
  onWindowResize: function () {
    this.layout();
  },

  /**
   * @function
   * @param {Event} evt
   */
  onKeyDown: function (evt) {
    if (evt.keyCode === 27) {
      if (this.options.closeOnEscape) {
        this.close();
      }

      return false;
    }

    return true;
  },

  /**
   * @function
   */
  destroy: function () {
    SL.popup.unRegister(this);
    this.options = null;
    this.$domElement.remove();
  }
});

SL('components.popup').EditHTML       = SL.components.popup.Popup.extend({
  TYPE: 'edit-html',

  /**
   * Constructor SL.components.EditHTML Instance
   *
   * @function
   * @param {Object} options
   */
  init: function (options) {
    this._super($.extend({
      title:  'Edit HTML',
      width:  900,
      height: 550,
      headerActions: [{
        label:     'Cancel',
        className: 'outline',
        callback:   this.close.bind(this)
      }, {
        label:     'Save',
        className: 'positive',
        callback:   this.saveAndClose.bind(this)
      }]
    }, options));

    this.saved = new signals.Signal();
  },

  /**
   * @function
   */
  render: function () {
    this._super();

    this.$bodyElement.html('<div id="ace-html" class="editor"></div>');

    if (this.editor && typeof this.editor.destroy === "function") {
      this.editor.destroy();
      this.editor = null;
    }

    setTimeout((function () {
      try {
        this.editor = window.ace.edit('ace-html');
        this.editor.setTheme('ace/theme/monokai');
        this.editor.setDisplayIndentGuides(true);
        this.editor.setShowPrintMargin(false);
        this.editor.getSession().setUseWrapMode(true);
        this.editor.getSession().setMode('ace/mode/html');
      } catch (err) {
        console.log('An error occurred while initializing the Ace editor.');
      }

      this.editor.env.document.setValue(this.options.html);
      this.editor.focus();
    }).bind(this), 1);
  },

  /**
   * @function
   */
  saveAndClose: function () {
    this.saved.dispatch(this.getHTML());
    this.close(true);
  },

  /**
   * @function
   * @param {Function} cb
   */
  checkUnsavedChanges: function (cb) {
    if (this.getHTML() === this.options.html || this.cancelPrompt) {
      if (!!cb && typeof cb === "function") {
        cb();
      }
    } else {
      this.cancelPrompt = SL.prompt({
        title: 'Discard unsaved changes?',
        type: 'select',
        data: [{
          html: '<h3>Cancel</h3>'
        },{
          html: '<h3>Discard</h3>',
          selected: true,
          className: 'negative',
          callback: cb
        }]
      });
      this.cancelPrompt.destroyed.add((function () {
        this.cancelPrompt = null;
      }).bind(this));
    }
  },

  /**
   * @function
   * @returns {*}
   */
  getHTML: function () {
    return this.editor.env.document.getValue();
  },

  /**
   * @function
   */
  destroy: function () {
    if (this.editor && typeof this.editor.destroy === "function") {
      this.editor.destroy();
      this.editor = null;
    }

    if (this.saved) {
      this.saved.dispose();
      this.saved = null;
    }

    this._super();
  }
});

SL('components.popup').EditSlideHTML  = SL.components.popup.EditHTML.extend({
  TYPE : 'edit-slide-html',

  init : function (config) {
    if (SL.util.user.canUseCustomCSS()) {
      config.additionalHeaderActions = [{
        label:     'Slide classes',
        className: 'outline',
        callback:  this.onSlideClassesClicked.bind(this)
      }, {
        type:      'divider'
      }];
    }

    config.html = SL.util.html.indent(
      SL.editor.controllers.Serialize.getSlideAsString(
        config.slide, {
          inner :   true,
          lazy :    false,
          exclude : '.math-output'
        }));

    this._super(config);
  },
  readSlideClasses : function () {
    return this.options.slide.className.split(' ').filter(function (clsName) {
      return SL.config.RESERVED_SLIDE_CLASSES.indexOf(clsName) === -1;
    }).join(' ');
  },
  writeSlideClasses : function (cls) {
    cls = cls || '';
    cls = cls.trim().replace(/\s{2,}/g, ' ');

    var clsNames = this.options.slide.className.split(' ').filter(function (clsName) {
      return -1 !== SL.config.RESERVED_SLIDE_CLASSES.indexOf(clsName);
    });

    clsNames = clsNames.concat(cls.split(' '));
    this.options.slide.className = clsNames.join(' ');
  },
  onSlideClassesClicked : function (evt) {
    var prompt = SL.prompt({
      anchor : evt.currentTarget,
      title : 'Specify class names which will be added to the slide wrapper. Useful for targeting from the CSS editor.',
      type :         'input',
      confirmLabel : 'Save',
      data : {
        value :                this.readSlideClasses(),
        placeholder :          'Classes...',
        width :                400,
        confirmBeforeDiscard : true
      }
    });
    prompt.confirmed.add((function (cls) {
      this.writeSlideClasses(cls);
    }).bind(this));
  }
});

SL('components.popup').InsertSnippet  = SL.components.popup.Popup.extend({
  TYPE: 'insert-snippet',

  /**
   * Constructor SL.components.InsertSnippet Instance
   *
   * @function
   * @param {Object} options
   */
  init: function (options) {
    this._super($.extend({
      title:       'Insert',
      titleItem:   '"' + options.snippet.get('title') + '"',
      width:       500,
      headerActions: [{
        label:     'Cancel',
        className: 'outline',
        callback:   this.close.bind(this)
      }, {
        label:     'Insert',
        className: 'positive',
        callback:  this.insertAndClose.bind(this)
      }]
    }, options));

    this.snippetInserted = new window.signals.Signal();
  },

  /**
   * @function
   */
  render: function () {
    this._super();

    this.$variablesElement = $('<div class="variables sl-form"></div>');
    this.$variablesElement.appendTo(this.$bodyElement);

    this.variables = this.options.snippet.getTemplateVariables();

    this.variables.forEach((function (variable) {
      var $variable = $([
        '<div class="unit">',
          '<label>' + variable.label + '</label>',
          '<input type="text" value="' + variable.defaultValue + '">',
        '</div>'].join('')).appendTo(this.$variablesElement);

      $variable.find('input').data('variable', variable);
    }).bind(this));

    this.$variablesElement.find('input').first().focus().select();
  },

  /**
   * @function
   */
  insertAndClose: function () {
    this.$variablesElement.find('input').each(function (index, item) {
      item = $(item);
      item.data('variable').value = item.val();
    });

    this.snippetInserted
      .dispatch(this.options.snippet.templatize(this.variables));
    this.close();
  },

  /**
   * @function
   * @param {String} evt
   */
  onKeyDown: function (evt) {
    if (evt.keyCode === 13) {
      this.insertAndClose();
      return false;
    } else {
      this._super(evt);
    }
  },

  /**
   * @function
   */
  destroy: function () {
    this.snippetInserted.dispose();
    this._super();
  }
});

SL('components.popup').Revision       = SL.components.popup.Popup.extend({
  TYPE: 'revision',

  /**
   * Constructor SL.components.Revision Instance
   *
   * @function
   * @param {Object} options
   */
  init: function (options) {
    this._super($.extend({
      revisionURL:     null,
      revisionTimeAgo: null,
      title:       'Revision',
      titleItem:   'from ' + options.revisionTimeAgo,
      width:       900,
      height:      700,
      headerActions: [{
        label:     'Open in new tab',
        className: 'outline',
        callback: this.onOpenExternalClicked.bind(this)
      }, {
        label:     'Restore',
        className: 'grey',
        callback:  this.onRestoreClicked.bind(this)
      }, {
        label:     '关闭',
        className: 'grey',
        callback:  this.close.bind(this)
      }]
    }, options));

    this.restoreRequested  = new window.signals.Signal();
    this.externalRequested = new window.signals.Signal();
  },

  /**
   * @function
   */
  render: function () {
    this._super();

    this.$bodyElement.html([
      '<div class="spinner centered"></div>',
      '<div class="deck"></div>'].join(''));
    this.$bodyElement.addClass('loading');

    SL.util.html.generateSpinners();

    var $iframe = $('<iframe>', {
      src: this.options.revisionURL,
      load: (function () {
        this.$bodyElement.removeClass('loading');
      }).bind(this)
    });

    $iframe.appendTo(this.$bodyElement.find('.deck'));
  },

  /**
   * @function
   * @param {Event} evt
   */
  onRestoreClicked: function (evt) {
    this.restoreRequested.dispatch(evt);
  },

  /**
   * @function
   * @param {Event} evt
   */
  onOpenExternalClicked: function (evt) {
    this.externalRequested.dispatch(evt);
  },

  /**
   * @function
   */
  destroy: function () {
    this.$bodyElement.find('.deck iframe').attr('src', '');
    this.$bodyElement.find('.deck').empty();

    this.restoreRequested.dispose();
    this.externalRequested.dispose();

    this._super();
  }
});

SL('components.popup').SessionExpired = SL.components.popup.Popup.extend({
  TYPE: 'session-expired',

  /**
   * Constructor SL.components.SessionExpired Instance
   *
   * @function
   * @param {Object} options
   */
  init: function (options) {
    this._super($.extend({
      title:               'Session expired',
      width:               500,
      closeOnEscape:       false,
      closeOnClickOutside: false,
      headerActions: [{
        label:     'Ignore',
        className: 'outline negative',
        callback:  this.close.bind(this)
      }, {
        label:     'Retry',
        className: 'positive',
        callback:  this.onRetryClicked.bind(this)
      }]
    }, options));
  },

  /**
   * @function
   */
  render: function () {
    this._super();

    this.$bodyElement.html([
      '<p>',
        'You are no longer signed in to Slides. This can happen ',
        'when you leave the editor idle for too long, log out in ',
        'a different tab or go offline. To continue please:',
      '</p>',
      '<ol>',
        '<li>',
          '<a href="' + SL.routes.SIGN_IN + '" target="_blank">Sign in</a>',
          ' to Slides from another browser tab.',
        '</li>',
        '<li>',
          'Come back to this tab and press the \'Retry\' button.',
        '</li>',
      '</ol>'].join(''));
  },

  /**
   * @function
   */
  onRetryClicked: function () {
    if (SL.editor) {
      if (SL.editor.Editor.VERSION === 1) {
        SL.view.checkLogin(true);
      } else {
        SL.editor.controllers.Session.checkLogin(true);
      }
    } else {
      console.warn('The session expired popup only works within ' +
        'the Slides editor.');
    }
  },

  /**
   * @function
   */
  destroy: function () {
    this._super();
  }
});


/*!
 * project name: SlideStudio
 * name:         decksharer.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/28
 */

'use strict';

SL('components.decksharer').DeckSharer   = SL.components.popup.Popup.extend({
  TYPE: 'decksharer',
  MODE_PUBLIC: {
    id:          'public',
    width:       560,
    height:      380,
    heightEmail: 'auto'
  },
  MODE_PRIVATE: {
    id:          'private',
    width:       800,
    height:      560,
    heightEmail: 730
  },
  MODE_INTERNAL: {
    id:          'internal',
    width:       560,
    height:      'auto',
    heightEmail: 'auto'
  },

  /**
   * Constructor SL.components.decksharer.DeckSharer Instance
   *
   * @function
   * @param {Object} options -The Options Parameters
   */
  init: function (options) {
    var deck = options.deck,
      isBelong = deck.belongsTo(SL.current_user);

    if (isBelong && (deck.isVisibilitySelf() || deck.isVisibilityTeam())) {
      this.mode = this.MODE_PRIVATE;
    } else if (!isBelong && deck.isVisibilityTeam()) {
      this.mode = this.MODE_INTERNAL;
    } else {
      this.mode = this.MODE_PUBLIC;
    }

    this._super($.extend({
      title:     SL.locale.get('Deck_Sharer.title'),
      titleItem: '"' + deck.get('title') + '"',
      width:     this.mode.width,
      height:    this.mode.height
    }, options));
  },

  /**
   * @function
   */
  render: function () {
    this._super();

    if (this.mode.id === this.MODE_PRIVATE.id) {
      this.renderPrivate();
    } else if (this.mode.id === this.MODE_INTERNAL.id) {
      this.renderInternal();
    } else {
      this.renderPublic();
    }
  },

  /**
   * @function
   */
  renderPublic: function () {
    this.$domElement.addClass('is-public');
    this.shareOptions =
      new SL.components.decksharer.ShareOptions(this.options.deck);
    this.shareOptions.tabChanged.add(this.layout.bind(this));
    this.shareOptions.appendTo(this.$bodyElement);
  },

  /**
   * @function
   */
  renderInternal: function () {
    this.$domElement.addClass('is-internal');
    this.$bodyElement
      .append([
        '<p class="decksharer-share-warning">',
          SL.locale.get('Deck_Sharer.warn'),
        '</p>'].join(''));

    this.shareOptions =
      new SL.components.decksharer.ShareOptions(this.options.deck, {
        embedEnabled: false
      });
    this.shareOptions.tabChanged.add(this.layout.bind(this));
    this.shareOptions.appendTo(this.$bodyElement);
  },

  /**
   * @function
   */
  renderPrivate: function () {
    this.$domElement.addClass('is-private');
    this.$placeholderElement = $([
      '<div class="decksharer-token-placeholder">',
        '<div class="decksharer-token-placeholder-inner">',
          '<div class="spinner" data-spinner-color="#999"></div>',
        '</div>',
      '</div>'].join(''));
    this.$placeholderElement.appendTo(this.$bodyElement);

    SL.util.html.generateSpinners();

    SL.data.tokens.get(this.options.deck.get('id'), {
      success: (function (tokens) {
        this.tokens = tokens;
        this.tokenList = new SL.components.decksharer.TokenList(this.options.deck, this.tokens);
        this.tokenList.appendTo(this.$bodyElement);
        this.tokenList.tokenSelected.add(this.onTokenSelected.bind(this));
        this.tokenList.tokensEmptied.add(this.onTokensEmptied.bind(this));

        if (this.tokens.size() === 0) {
          this.renderTokenPlaceholder();
        } else {
          this.tokenList.selectDefault();
        }
      }).bind(this),
      error: (function () {
        this.destroy();
        SL.notify(SL.locale.get('Generic_Error'), 'negative');
      }).bind(this)
    });
  },

  /**
   * @function
   */
  layout: function () {
    var shareOptions = this.tokenOptions ?
      this.tokenOptions.shareOptions : this.shareOptions;

    if (shareOptions &&
      shareOptions.getTabID() ===
      SL.components.decksharer.ShareOptions.EMAIL_PAGE_ID) {
      this.options.height = this.mode.heightEmail;
    } else {
      this.options.height = this.mode.height;
    }

    this._super();
  },

  /**
   * @function
   */
  resetContentArea: function () {
    if (this.tokenOptions) {
      this.tokenOptions.destroy();
      this.tokenOptions = null;
    }

    if (this.$placeholderElement) {
      this.$placeholderElement.addClass('hidden');
      setTimeout(
        this.$placeholderElement.remove.bind(this.$placeholderElement),
        300);
      this.$placeholderElement = null;
    }
  },

  /**
   * @function
   */
  renderTokenPlaceholder: function () {
    this.$domElement.addClass('is-empty');
    this.resetContentArea();

    var title = '';

    if (this.options.deck.isVisibilityTeam()) {
      title = SL.locale.get('Deck_Sharer.token_title', {title: 'internal'});
    } else {
      title = SL.locale.get('Deck_Sharer.token_title', {title: 'private'});
    }

    this.$placeholderElement = $([
      '<div class="decksharer-token-placeholder">',
        '<div class="decksharer-token-placeholder-inner">',
          '<div class="lock-icon icon i-lock-stroke"></div>',
          '<h2>' + title + '</h2>',
          '<p>' + SL.locale.get('Deck_Sharer.token_des') + '</p>',
          '<button class="button create-button xl ladda-button" data-style="zoom-out">',
            SL.locale.get('Deck_Sharer.token_des'),
          '</button>',
        '</div>',
      '</div>'].join(''));
    this.$placeholderElement.appendTo(this.$bodyElement);
    this.$placeholderElement.find('.create-button').on('click', (function () {
      this.tokenList.create();
    }).bind(this));

    window.Ladda.bind(this.$placeholderElement.find('.create-button').get(0));
    this.layout();
  },

  /**
   * @function
   * @param {Object} options
   */
  renderTokenOptions: function (options) {
    this.$domElement.removeClass('is-empty');

    var isTokenOptions = !this.tokenOptions;

    this.resetContentArea();

    this.tokenOptions =
      new SL.components.decksharer.TokenOptions(this.options.deck, options);
    this.tokenOptions.appendTo(this.$bodyElement, isTokenOptions);
    this.tokenOptions
      .tokenRenamed.add(this.tokenList.setTokenLabel.bind(this.tokenList));
    this.tokenOptions.shareOptions.tabChanged.add(this.layout.bind(this));

    this.layout();
  },

  /**
   * @function
   * @param {Object} options
   */
  onTokenSelected: function (options) {
    this.renderTokenOptions(options);
  },

  /**
   * @function
   */
  onTokensEmptied: function () {
    this.renderTokenPlaceholder();
  },

  /**
   * @function
   */
  destroy: function () {
    if (this.shareOptions) {
      this.shareOptions.destroy();
      this.shareOptions = null;
    }

    if (this.tokenList) {
      this.tokenList.destroy();
      this.tokenList = null;
    }

    this.options.deck = null;
    this.tokens       = null;

    this._super();
  }
});

SL('components.decksharer').ShareOptions = Class.extend({
  USE_READONLY: !SL.util.device.IS_PHONE && !SL.util.device.IS_TABLET,

  /**
   * Constructor SL.components.decksharer.ShareOptions Instance
   *
   * @function
   * @param {Object} deck
   * @param {Object} options
   */
  init: function (deck, options) {
    this.deck = deck;
    this.options = $.extend({
      token:        null,
      linkEnabled:  true,
      embedEnabled: true,
      emailEnabled: true
    }, options);

    this.onLinkInputMouseDown   = this.onLinkInputMouseDown.bind(this);
    this.onEmbedOutputMouseDown = this.onEmbedOutputMouseDown.bind(this);
    this.onEmbedStyleChanged    = this.onEmbedStyleChanged.bind(this);
    this.onEmbedSizeChanged     = this.onEmbedSizeChanged.bind(this);

    this.width  = SL.components.decksharer.ShareOptions.DEFAULT_WIDTH;
    this.height = SL.components.decksharer.ShareOptions.DEFAULT_HEIGHT;
    this.style  = '';
    this.tabChanged = new window.signals.Signal();

    this.render();
    this.generate();
  },

  /**
   * @function
   */
  render: function () {
    this.$domElement = $('<div class="decksharer-share-options">');
    this.$tabsElement = $('<div class="decksharer-share-options-tabs">')
      .appendTo(this.$domElement);
    this.$pagesElement = $('<div class="decksharer-share-options-pages">')
      .appendTo(this.$domElement);

    if (this.options.linkEnabled) {
      this.renderLink();
    }

    if (this.options.embedEnabled) {
      this.renderEmbed();
    }

    if (this.options.emailEnabled && SL.util.user.isLoggedIn()) {
      this.renderEmail();
    }

    this.$tabsElement
      .find('.decksharer-share-options-tab')
      .on('vclick', (function (evt) {
        var id = $(evt.currentTarget).attr('data-id');

        this.showTab(id);
        SL.analytics.track('Decksharer: Tab clicked', id);
      }).bind(this));

    this.showTab(
      this.$tabsElement
        .find('.decksharer-share-options-tab').first().attr('data-id'));
  },

  /**
   * @function
   */
  renderLink: function () {
    this.$tabsElement.append([
      '<div class="decksharer-share-options-tab" data-id="' +
        SL.components.decksharer.ShareOptions.LINK_PAGE_ID + '">',
          SL.locale.get('Deck_Sharer.link_title'),
      '</div>'].join(''));
    this.$pagesElement.append([
      '<div class="decksharer-share-options-page sl-form" data-id="link">',
        '<div class="unit link-unit">',
          '<label>',
            SL.locale.get('Deck_Sharer.link_label'),
          '</label>',
        '</div>',
        '<div class="unit sl-checkbox outline">',
          '<input id="fullscreen-checkbox" type="checkbox" class="fullscreen-input" />',
          '<label for="fullscreen-checkbox">',
            SL.locale.get('Deck_Sharer.link_fullscreen'),
          '</label>',
        '</div>',
      '</div>'].join(''));

    if (this.USE_READONLY) {
      this.$linkInput =
        $('<input type="text" class="link-input" readonly="readonly" />');
      this.$linkInput.on('mousedown', this.onLinkInputMouseDown);
      this.$linkInput
        .appendTo(this.$pagesElement.find('[data-id="link"] .link-unit'));
    } else {
      this.$linkAnchor = $('<a href="#" class="input-field">');
      this.$linkAnchor
        .appendTo(this.$pagesElement.find('[data-id="link"] .link-unit'));
    }

    this.$fullscreenInput =
      this.$pagesElement.find('[data-id="link"] .fullscreen-input');
    this.$fullscreenInput
      .on('change', this.onLinkFullScreenToggled.bind(this));
  },

  /**
   * @function
   */
  renderEmbed: function () {
    this.$tabsElement.append([
      '<div class="decksharer-share-options-tab" data-id="' +
        SL.components.decksharer.ShareOptions.EMBED_PAGE_ID + '">',
        SL.locale.get('Deck_Sharer.embed_title'),
      '</div>'].join(''));

    var clrOption = [
      '<option value="dark" selected>',
        SL.locale.get('Deck_Sharer.embed_style_dark'),
      '</option>',
      '<option value="light">',
        SL.locale.get('Deck_Sharer.embed_style_light'),
      '</option>'].join('');

    if (SL.current_user.isPro()) {
      clrOption += [
        '<option value="hidden">',
          SL.locale.get('Deck_Sharer.embed_style_hide'),
        '</option>'].join('');
    }

    this.$pagesElement.append([
      '<div class="decksharer-share-options-page sl-form" data-id="embed">',
        '<div class="embed-options">',
          '<div class="unit">',
            '<label>' + SL.locale.get('Deck_Sharer.embed_label_width') + '</label>',
            '<input type="text" name="width" maxlength="4" />',
          '</div>',
          '<div class="unit">',
            '<label>' + SL.locale.get('Deck_Sharer.embed_label_height') + '</label>',
            '<input type="text" name="height" maxlength="4" />',
          '</div>',
          '<div class="unit">',
            '<label>' + SL.locale.get('Deck_Sharer.embed_label_style') + '</label>',
            '<select class="sl-select" name="style">', clrOption, '</select>',
          '</div>',
        '</div>',
        '<textarea name="output"></textarea>',
      '</div>'].join(''));

    this.$embedElement       = this.$pagesElement.find('[data-id="embed"]');
    this.$embedStyleElement  = this.$embedElement.find('select[name=style]');
    this.$embedWidthElement  = this.$embedElement.find('input[name=width]');
    this.$embedHeightElement = this.$embedElement.find('input[name=height]');
    this.$embedOutputElement = this.$embedElement.find('textarea');

    this.$embedStyleElement.on('change', this.onEmbedStyleChanged);
    this.$embedWidthElement.on('input', this.onEmbedSizeChanged);
    this.$embedHeightElement.on('input', this.onEmbedSizeChanged);

    if (this.USE_READONLY) {
      this.$embedOutputElement.attr('readonly', 'readonly');
      this.$embedOutputElement.on('mousedown', this.onEmbedOutputMouseDown);
    } else {
      this.$embedOutputElement.on('input', this.generate.bind(this));
    }

    this.$embedWidthElement.val(this.width);
    this.$embedHeightElement.val(this.height);
  },

  /**
   * @function
   */
  renderEmail: function () {
    this.$tabsElement.append([
      '<div class="decksharer-share-options-tab" data-id="' +
        SL.components.decksharer.ShareOptions.EMAIL_PAGE_ID + '">',
        SL.locale.get('Deck_Sharer.mail_title'),
      '</div>'].join(''));
    this.$pagesElement.append([
      '<div class="decksharer-share-options-page" data-id="email">',
        '<div class="sl-form">',
          '<div class="unit" data-validate="none" data-required>',
            '<label>' + SL.locale.get('Deck_Sharer.mail_label_from') + '</label>',
            '<input type="text" class="email-from" placeholder="Your Name" maxlength="255" />',
          '</div>',
          '<div class="unit" data-validate="none" data-required>',
            '<label>' + SL.locale.get('Deck_Sharer.mail_label_to') + '</label>',
            '<input type="text" class="email-to" placeholder="john@example.com, jane@example.com" maxlength="2500" />',
          '</div>',
          '<div class="unit text" data-validate="none" data-required>',
            '<label>' + SL.locale.get('Deck_Sharer.mail_label_msg') + '</label>',
            '<p class="unit-description">',
              SL.locale.get('Deck_Sharer.mail_label_msg_des'),
            '</p>',
            '<textarea class="email-body" rows="3" maxlength="2500"></textarea>',
          '</div>',
          '<div class="submit-wrapper">',
            '<button type="submit" class="button positive l ladda-button email-submit" data-style="zoom-out">',
              SL.locale.get('Deck_Sharer.mail_send_btn'),
            '</button>',
          '</div>',
        '</div>',
        '<div class="email-success">',
          '<div class="email-success-icon icon i-checkmark"></div>',
          '<p class="email-success-description">',
            SL.locale.get('Deck_Sharer.mail_send_success'),
          '</p>',
        '</div>',
      '</div>'].join(''));

    this.$emailElement      = this.$pagesElement.find('[data-id="email"]');
    this.$emailSuccess      = this.$emailElement.find('.email-success');
    this.$emailForm         = this.$emailElement.find('.sl-form');
    this.$emailFromElement  = this.$emailForm.find('.email-from');
    this.$emailToElement    = this.$emailForm.find('.email-to');
    this.$emailBodyElement  = this.$emailForm.find('.email-body');
    this.$emailSubmitButton = this.$emailForm.find('.email-submit');

    this.emailFormUnits = [];

    this.$emailForm.find('.unit[data-validate]').each((function (index, item) {
      this.emailFormUnits.push(new SL.components.FormUnit(item));
    }).bind(this));

    this.$emailSubmitButton.on('vclick', this.onEmailSubmitClicked.bind(this));
    this.emailSubmitLoader = window.Ladda.create(this.$emailSubmitButton.get(0));
  },

  /**
   * @function
   * @param {*|jQuery|HTMLElement} parent
   */
  appendTo: function (parent) {
    this.$domElement.appendTo(parent);
  },

  /**
   * @function
   * @param {String|Number} id
   */
  showTab: function (id) {
    this.$tabsElement.find('.decksharer-share-options-tab')
      .removeClass('is-selected');
    this.$pagesElement.find('.decksharer-share-options-page')
      .removeClass('is-selected');
    this.$tabsElement.find('[data-id="' + id + '"]')
      .addClass('is-selected');
    this.$pagesElement.find('[data-id="' + id + '"]')
      .addClass('is-selected');

    this.tabChanged.dispatch(id);
  },

  /**
   * @function
   * @returns {*|String|Number}
   */
  getTabID: function () {
    return this.$tabsElement.find('.is-selected').attr('data-id');
  },

  /**
   * @function
   */
  generate: function () {
    var shareUrls = this.getShareURLs();

    if (this.$embedOutputElement) {
      this.$embedOutputElement.text('<iframe src="' + shareUrls.embed +
        '" width="' + this.width + '" height="' + this.height +
        '" scrolling="no" frameborder="0" ' +
        'webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>');
    }

    var text = '';

    if (this.$fullscreenInput.is(':checked')) {
      text = shareUrls.fullscreen;
    } else {
      text = shareUrls.show;
    }

    if (this.$linkInput) {
      this.$linkInput.val(text);
    }

    if (this.$linkAnchor) {
      this.$linkAnchor.attr('href', text).text(text);
    }

    if (this.$emailElement) {
      if (SL.current_user) {
        this.$emailFromElement.val(SL.current_user.getNameOrSlug());
      }

      var val = '';

      if (this.deck.has('title') && this.deck.get('title') !== 'deck') {
        val = SL.locale.get('Deck_Sharer.mail_label_msg_tip', {
          tip: this.deck.get('title')
        });
      } else {
        val = SL.locale.get('Deck_Sharer.mail_label_msg_tip', {tip: ''});
      }

      this.$emailBodyElement.val(val);
    }
  },

  /**
   * @function
   * @returns {{show: (*|string), fullscreen: (*|string), embed: (*|string)}}
   */
  getShareURLs: function () {
    var url = {
      show:       this.deck.getURL({protocol: 'http:'}),
      fullscreen: this.deck.getURL({protocol: 'http:', view: 'fullscreen'}),
      embed:      this.deck.getURL({protocol: '', view: 'embed'})
    }, tokens = [];

    if (this.options.token && this.options.token.has('token')) {
      tokens.push('token=' + this.options.token.get('token'));
    }

    url.show       += tokens.length ? '?' + tokens.join('&') : '';
    url.fullscreen += tokens.length ? '?' + tokens.join('&') : '';

    if (typeof this.style === "string" && this.style.length > 0) {
      tokens.push('style=' + this.style);
    }

    url.embed += tokens.length ? '?' + tokens.join('&') : '';

    return url;
  },

  /**
   * @function
   * @param {Event} evt
   */
  onEmbedOutputMouseDown: function (evt) {
    evt.preventDefault();

    this.$embedOutputElement.focus().select();
    SL.analytics.track('Decksharer: Embed code selected');
  },

  /**
   * @function
   * @param {Event} evt
   */
  onLinkInputMouseDown: function (evt) {
    evt.preventDefault();

    $(evt.target).focus().select();
    SL.analytics.track('Decksharer: URL selected');
  },

  /**
   * @function
   */
  onLinkFullScreenToggled: function () {
    this.generate();
    SL.analytics.track('Decksharer: URL fullscreen toggled');
  },

  /**
   * @function
   */
  onEmbedSizeChanged: function () {
    this.width  = parseInt(this.$embedWidthElement.val(), 10) || 1;
    this.height = parseInt(this.$embedHeightElement.val(), 10) || 1;

    this.generate();
  },

  /**
   * @function
   */
  onEmbedStyleChanged: function () {
    this.style = this.$embedStyleElement.val();
    this.generate();
  },

  /**
   * @function
   * @param {Event} evt
   */
  onEmailSubmitClicked: function (evt) {
    var units = this.emailFormUnits.every(function (unit) {
      return unit.beforeSubmit();
    });

    if (units && !this.emailXHR) {
      SL.analytics.track('Decksharer: Submit email');

      var from = this.$emailFromElement.val(),
        emails = this.$emailToElement.val(),
        body   = this.$emailBodyElement.val();

      this.emailSubmitLoader.start();

      emails = emails.split(',');
      emails = emails.map(function (email) {
        return email.trim();
      });
      emails = emails.join(',');

      var data = {
        deck_share: {
          emails: emails,
          from:   from,
          body:   body
        }
      };

      if (this.options.token) {
        data.deck_share.access_token_id = this.options.token.get('id');
      }

      this.emailXHR = $.ajax({
        url:     SL.config.AJAX_SHARE_DECK_VIA_EMAIL(this.deck.get('id')),
        type:   'POST',
        context: this,
        data:    data
      }).done(function () {
        this.$emailSuccess.addClass('visible');

        setTimeout((function () {
          this.$emailSuccess.removeClass('visible');
          this.$emailToElement.val('');
          this.$emailBodyElement.val('');
          this.generate();
        }).bind(this), 3000);

        SL.analytics.track('Decksharer: Submit email success');
      }).fail(function () {
        SL.notify(SL.locale.get('Deck_Sharer.mail_send_error'), 'negative');
        SL.analytics.track('Decksharer: Submit email error');
      }).always(function () {
        this.emailXHR = null;
        this.emailSubmitLoader.stop();
      });
    }

    evt.preventDefault();
  },

  /**
   * @function
   */
  destroy: function () {
    this.tabChanged.dispose();
    this.deck = null;
    this.$domElement.remove();
  }
});

SL.components.decksharer.ShareOptions.DEFAULT_WIDTH  = 576;
SL.components.decksharer.ShareOptions.DEFAULT_HEIGHT = 420;
SL.components.decksharer.ShareOptions.LINK_PAGE_ID   = 'link';
SL.components.decksharer.ShareOptions.EMBED_PAGE_ID  = 'embed';
SL.components.decksharer.ShareOptions.EMAIL_PAGE_ID  = 'email';

SL('components.decksharer').TokenList    = Class.extend({
  /**
   * Constructor SL.components.decksharer.TokenList Instance
   *
   * @function
   * @param {Object} deck
   * @param {Array} tokens
   */
  init: function (deck, tokens) {
    this.deck   = deck;
    this.tokens = tokens;

    this.tokenSelected = new window.signals.Signal();
    this.tokensEmptied = new window.signals.Signal();

    this.render();
  },

  /**
   * @function
   */
  render: function () {
    this.$domElement = $('<div class="decksharer-token-list">');
    this.$listItems = $('<div class="decksharer-token-list-items">')
      .appendTo(this.$domElement);

    this.$createButton = $([
      '<div class="decksharer-token-list-create ladda-button" ' +
        'data-style="zoom-out" data-spinner-color="#222">',
        '<span class="icon i-plus"></span>',
      '</div>'].join(''));
    this.$createButton.on('vclick', this.create.bind(this));
    this.$createButton.appendTo(this.$domElement);
    this.createButtonLoader = window.Ladda.create(this.$createButton.get(0));

    this.tokens.forEach(this.renderToken.bind(this));

    this.scrollShadow = new SL.components.ScrollShadow({
      $parentElement:  this.$domElement,
      $contentElement: this.$listItems,
      $footerElement:  this.$createButton,
      resizeContent:   false
    });
  },

  /**
   * @function
   * @param {Object} token
   */
  renderToken: function (token) {
    var count = token.get('deck_view_count') || 0,
      num = count + ' ' + SL.util.string.pluralize('view', 's', count !== 1),
      $item = $([
        '<div class="decksharer-token-list-item" data-id="' + token.get('id') + '">',
          '<span class="label"></span>',
          '<div class="meta">',
            '<span class="views">' + num + "</span>",
            '<span class="icon i-x delete" data-tooltip="',
              SL.locale.get('Deck_Sharer.token_btn_del_tip'),
              '"></span>',
          '</div>',
        '</div>'].join('')).appendTo(this.$listItems);

    $item.on('vclick', (function (evt) {
      if ($(evt.target).closest('.delete').length > 0) {
        SL.prompt({
          anchor: $item,
          alignment: 'r',
          title: SL.locale.get('Deck_Sharer.token_prompt_title'),
          type: 'select',
          data: [{
            html: '<h3>' + SL.locale.get('Cancel') + '</h3>'
          }, {
            html: '<h3>' + SL.locale.get('Delete') + '</h3>',
            selected: true,
            className: 'negative',
            callback: (function () {
              this.remove(token, $item);
            }).bind(this)
          }]
        });
      } else {
        this.select(token);
      }
    }).bind(this));

    this.setTokenLabel(token);
  },

  /**
   * @function
   * @param {Object} token
   * @param {String} labelTxt
   */
  setTokenLabel: function (token, labelTxt) {
    var $item =
      this.$listItems
        .find('.decksharer-token-list-item[data-id=' + token.get('id') + ']');

    if ($item.length) {
      if (!labelTxt) {
        labelTxt = token.get('name');

        if (!labelTxt) {
          token.get('token');
        }
      }

      $item.find('.label').html(labelTxt);
    }
  },

  /**
   * @function
   * @param {*|jQuery|HTMLElement} parent
   */
  appendTo: function (parent) {
    this.$domElement.appendTo(parent);
    this.scrollShadow.sync();
  },

  /**
   * @function
   */
  selectDefault: function () {
    this.select(this.tokens.first());
    this.scrollShadow.sync();
  },

  /**
   * @function
   * @param {Object} token
   */
  select: function (token) {
    if (token && token !== this.selectedToken) {
      var $item =
        this.$listItems
          .find('.decksharer-token-list-item[data-id=' +
            token.get('id') + ']');

      if ($item.length) {
        this.$listItems.find('.decksharer-token-list-item')
          .removeClass('is-selected');

        $item.addClass('is-selected');

        this.tokenSelected.dispatch(token);
        this.selectedToken = token;
      }
    }
  },

  /**
   * @function
   * @param {boolean} isProcess
   */
  create: function (isProcess) {
    var hasToken = this.tokens.size() === 0;

    if (isProcess) {
      this.createButtonLoader.start();
    }

    SL.data.tokens.create(this.deck.get('id'), {
      success: (function (data) {
        var str = hasToken ?
          'Decksharer: Created first token' :
          'Decksharer: Created additional token';

        SL.analytics.track(str);

        this.renderToken(data);
        this.select(data);

        this.createButtonLoader.stop();
        this.scrollShadow.sync();
      }).bind(this),
      error: (function () {
        SL.notify(SL.locale.get('Generic_Error'), 'negative');
        this.createButtonLoader.stop();
      }).bind(this)
    });
  },

  /**
   * @function
   * @param {Object}               token
   * @param {*|jQuery|HTMLElement} $item
   */
  remove: function (token, $item) {
    token.destroy().fail((function () {
      SL.notify(SL.locale.get('Generic_Error'), 'negative');
    }).bind(this)).done((function () {
      SL.util.anim.collapseListItem($item, (function () {
        $item.remove();
        this.scrollShadow.sync();
      }).bind(this), 300);

      this.tokens.remove(token);

      if (this.selectedToken === token) {
        this.selectedToken = null;
        this.selectDefault();
      }

      if (this.tokens.size() === 0) {
        this.tokensEmptied.dispatch();
      }

      SL.analytics.track('Decksharer: Deleted token');
    }).bind(this));
  },

  /**
   * @function
   */
  destroy: function () {
    if (this.createButtonLoader) {
      this.createButtonLoader.stop();
    }

    if (this.scrollShadow) {
      this.scrollShadow.destroy();
    }

    this.tokens = null;
    this.$domElement.remove();
  }
});

SL('components.decksharer').TokenOptions = Class.extend({
  /**
   * Constructor SL.components.decksharer.TokenOptions Instance
   *
   * @function
   * @param {Object} deck
   * @param {Object} token
   */
  init: function (deck, token) {
    this.deck         = deck;
    this.token        = token;
    this.tokenRenamed = new window.signals.Signal();

    this.render();
    this.bind();
  },

  /**
   * @function
   */
  render: function () {
    this.$domElement   = $('<div class="decksharer-token-options">');

    this.$innerElement = $('<div class="sl-form decksharer-token-options-inner">');
    this.$innerElement.appendTo(this.$domElement);

    this.$namePasswordElement = $('<div class="split-units">');
    this.$namePasswordElement.appendTo(this.$innerElement);

    this.$nameUnit = $([
      '<div class="unit">',
        '<label class="form-label" for="token-name">',
          SL.locale.get('Deck_Sharer.token_opt_label_name'),
        '</label>',
        '<p class="unit-description">',
          SL.locale.get('Deck_Sharer.token_opt_label_name_des'),
        '</p>',
        '<input class="input-field" type="text" id="token-name" maxlength="255" />',
      '</div>'].join(''));
    this.$nameUnit.appendTo(this.$namePasswordElement);

    this.$nameInput = this.$nameUnit.find('input');
    this.$nameInput.val(this.token.get('name'));

    this.$passwordUnit = $([
      '<div class="unit">',
        '<label class="form-label" for="token-password">',
          SL.locale.get('Deck_Sharer.token_opt_label_pwd'),
        '</label>',
        '<p class="unit-description">',
          SL.locale.get('Deck_Sharer.token_opt_label_pwd_des'),
        '</p>',
        '<input class="input-field" type="password" id="token-password" ' +
          'placeholder="&bull;&bull;&bull;&bull;&bull;&bull;" maxlength="255" />',
      '</div>'].join(''));
    this.$passwordUnit.appendTo(this.$namePasswordElement);

    this.$passwordInput = this.$passwordUnit.find('input');
    this.$passwordInput.val(this.token.get('password'));

    this.$saveWrapper = $([
      '<div class="save-wrapper">',
        '<button class="button l save-button ladda-button" data-style="expand-left" data-spinner-size="26">',
          SL.locale.get('Deck_Sharer.token_opt_btn_save'),
        '</button>',
      '</div>'].join(''));
    this.$saveWrapper.appendTo(this.$innerElement);

    this.$saveButton = this.$saveWrapper.find('.button');
    this.saveButtonLoader = window.Ladda.create(this.$saveButton.get(0));

    this.shareOptions = new SL.components.decksharer.ShareOptions(this.deck, {
      token: this.token
    });
    this.shareOptions.appendTo(this.$domElement);
  },

  /**
   * @function
   */
  bind: function () {
    this.saveChanges = this.saveChanges.bind(this);
    this.$nameInput.on('input', this.onNameInput.bind(this));
    this.$passwordInput.on('input', this.onPasswordInput.bind(this));
    this.$saveButton.on('click', this.saveChanges);
  },

  /**
   * @function
   * @param {*|jQuery|HTMLElement} element
   * @param {boolean}              calculateStyle
   */
  appendTo: function (element, calculateStyle) {
    this.$domElement.appendTo(element);

    if (!calculateStyle) {
      SL.util.dom.calculateStyle(this.$domElement);
    }

    this.$domElement.addClass('visible');
  },

  /**
   * @function
   */
  checkUnsavedChanges: function () {
    var name    = this.token.get('name') || '',
      password  = this.token.get('password') || '',
      iName     = this.$nameInput.val(),
      iPassword = this.$passwordInput.val(),
      changed   = iPassword !== password || iName !== name;

    this.$domElement.toggleClass('is-unsaved', changed);
  },

  /**
   * @function
   */
  saveChanges: function () {
    if (this.$nameInput.val()) {
      this.token.set('name', this.$nameInput.val());
      this.token.set('password', this.$passwordInput.val());
      this.saveButtonLoader.start();

      this.token.save(['name', 'password']).fail((function () {
        this.saveButtonLoader.stop();
        SL.notify(SL.locale.get('Generic_Error'), 'negative');
      }).bind(this)).done((function () {
        this.saveButtonLoader.stop();
        this.$domElement.removeClass('is-unsaved');
      }).bind(this));
    } else {
      SL.notify(SL.locale.get('Deck_Sharer.token_opt_name_tip'), 'negative');
    }
  },

  /**
   * @function
   */
  onNameInput: function () {
    this.tokenRenamed.dispatch(this.token, this.$nameInput.val());
    this.checkUnsavedChanges();
  },

  /**
   * @function
   */
  onPasswordInput: function () {
    this.checkUnsavedChanges();
  },

  /**
   * @function
   */
  destroy: function () {
    this.tokenRenamed.dispatch(this.token);
    this.tokenRenamed.dispose();

    if (this.shareOptions) {
      this.shareOptions.destroy();
      this.shareOptions = null;
    }

    if (this.saveButtonLoader) {
      this.saveButtonLoader.stop();
    }

    this.deck  = null;
    this.token = null;

    this.$domElement.addClass('hidden');
    setTimeout(this.$domElement.remove.bind(this.$domElement), 500);
  }
});


/*!
 * project name: SlideStudio
 * name:         form.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/28
 */

'use strict';

SL('components.form').Scripts = Class.extend({
  /**
   * Constructor SL.components.Header Instance
   *
   * @function
   * @param {*|jQuery|HTMLElement} element
   */
  init: function (element) {
    this.$domElement = $(element);

    this.render();
    this.readValues();
    this.renderList();
  },

  /**
   * @function
   */
  render: function () {
    this.$valueElement = this.$domElement.find('.value-holder');

    this.$listElement = $('<ul class="list">');
    this.$listElement.delegate('li .remove', 'click', this.onListItemRemove.bind(this));
    this.$listElement.appendTo(this.$domElement);

    this.$inputWrapper = $('<div class="input-wrapper"></div>').appendTo(this.$domElement);
    this.$inputElement = $('<input type="text" placeholder="https://...">');
    this.$inputElement.on('keyup', this.onInputKeyUp.bind(this));
    this.$inputElement.appendTo(this.$inputWrapper);

    this.$submitElement = $('<div class="button outline">Add</div>');
    this.$submitElement.on('click', this.submitInput.bind(this));
    this.$submitElement.appendTo(this.$inputWrapper);

    this.$domElement.parents('form')
      .first().on('submit', this.onFormSubmit.bind(this));
  },

  /**
   * @function
   */
  renderList: function () {
    this.$listElement.empty();

    this.values.forEach((function (val) {
      this.$listElement.append([
        '<li class="list-item" data-value="' + val + '">',
          val,
          '<span class="icon i-x remove"></span>',
        '</li>'].join(''));
    }).bind(this));
  },

  /**
   * @function
   */
  formatValues: function () {
    for (var i = 0; i < this.values.length; i += 1) {
      this.values[i] = SL.util.string.trim(this.values[i]);

      if (this.values[i] === '') {
        this.values.splice(i, 1);
      }
    }
  },

  /**
   * @function
   */
  readValues: function () {
    this.values = (this.$valueElement.val() || '').split(',');
    this.formatValues();
  },

  /**
   * @function
   */
  writeValues: function () {
    this.formatValues();
    this.$valueElement.val(this.values.join(','));
  },

  /**
   * @function
   * @param {String} val
   * @returns {boolean}
   */
  addValue: function (val) {
    val = val || '';

    if (val.search(/https\:\/\//g) === 0) {
      this.values.push(val);
      this.renderList();
      this.writeValues();
      return true;
    } else if (val.search(/http\:\/\//gi) === 0) {
      SL.notify('Script must be loaded via HTTPS', 'negative');
      return false;
    } else {
      SL.notify('Please enter a valid script URL', 'negative');
      return false;
    }
  },

  /**
   * @function
   * @param {String} val
   */
  removeValue: function (val) {
    if (typeof val === "string") {
      for (var i = 0; i < this.values.length; i += 1) {
        if (this.values[i] === val) {
          this.values.splice(i, 1);
        }
      }
    } else if (typeof val === "number") {
      this.values.splice(val, 1);
    }

    this.renderList();
    this.writeValues();
  },

  /**
   * @function
   */
  submitInput: function () {
    if (this.addValue(this.$inputElement.val())) {
      this.$inputElement.val('');
    }
  },

  /**
   * @function
   * @param {Event} evt
   */
  onListItemRemove: function (evt) {
    var index = $(evt.target).parent().index();

    if (typeof index === "number") {
      this.removeValue(index);
    }
  },

  /**
   * @function
   * @param {Event} evt
   */
  onInputKeyUp: function (evt) {
    if (evt.keyCode === 13) {
      this.submitInput();
    }
  },

  /**
   * @function
   * @param {Event} evt
   */
  onFormSubmit: function (evt) {
    if (this.$inputElement.is(':focus')) {
      evt.preventDefault();
      return false;
    }
  }
});


/*!
 * project name: SlideStudio
 * name:         formunit.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/21
 */

'use strict';

SL('components').FormUnit = Class.extend({
  /**
   * Constructor SL.components.FormUnit Instance
   *
   * SL.components.FormUnit
   *
   * @function
   * @param {*|jQuery|HTMLElement} domElement
   */
  init: function (domElement) {
    this.$domElement   = $(domElement);
    this.$inputElement = this.$domElement.find('input, textarea').first();
    this.$errorElement = $('<div class="error">');
    this.$errorIcon    = $('<span class="icon">!</span>').appendTo(this.$errorElement);
    this.$errorMessage = $('<p class="message">!</p>').appendTo(this.$errorElement);
    this.validateType  = this.$domElement.attr('data-validate');
    this.originalValue = this.$inputElement.val();
    this.originalError = this.$domElement.attr('data-error-message');

    this.validateTimeout     = -1;
    this.asyncValidatedValue = null;
    this.clientErrors        = [];
    this.serverErrors        = [];

    this.$inputElement.on('input', this.onInput.bind(this));
    this.$inputElement.on('change', this.onInputChange.bind(this));
    this.$inputElement.on('focus', this.onInputFocus.bind(this));
    this.$inputElement.on('blur', this.onInputBlur.bind(this));
    this.$inputElement.on('invalid', this.onInputInvalid.bind(this));

    this.$domElement.parents('form').first()
      .on('submit', this.onFormSubmit.bind(this));

    if (this.originalError) {
      this.$domElement.removeClass('hidden');
      this.validate();
      this.$inputElement.focus();
    }

    this.$domElement.data('controller', this);
  },

  /**
   * Validate Input Text
   *
   * @function
   * @param {boolean} noEmpty
   * @returns {*}
   */
  validate: function (noEmpty) {
    clearTimeout(this.validateTimeout);

    var val = this.$inputElement.val();

    if (typeof val !== "string") {
      this.serverErrors = [];
      this.clientErrors = [];

      return void this.render();
    }

    if (this.originalValue === val &&
      (this.originalValue || this.validateType === 'password') &&
      this.originalError) {
      this.clientErrors = [this.originalError];
    } else if (val.length) {
      var validate = SL.util.validate[this.validateType];

      if (typeof validate === "function") {
        this.clientErrors = validate(val);
      } else {
        console.log('Could not find validation method of type "' +
          this.validateType + '"');
      }
    } else {
      this.clientErrors = [];

      if (noEmpty && this.isRequired()) {
        this.clientErrors.push(SL.locale.get('Form.err_required'));
      }
    }

    this.validateAsync();
    this.render();

    return this.clientErrors.length === 0 && this.serverErrors.length === 0;
  },

  /**
   * Validate user name and team_slug name from server.
   *
   * Function inner have detailed comments about this function.
   *
   * @function
   */
  validateAsync: function () {
    var inputVal = '';

    if (this.validateType === 'username') {
      var userName = '';
      inputVal     = this.$inputElement.val();

      if (!!SLConfig && SLConfig.current_user) {
        userName = SLConfig.current_user.userName;
      }

      // If the SLConfig user name is empty.
      if (SL.util.validate.username(userName).length === 0) {
        if (userName && userName === inputVal) {
          this.asyncValidatedValue = userName;
          this.serverErrors = [];
        } else if (this.asyncValidatedValue !== inputVal) {
          $.ajax({
            url: SL.config.AJAX_LOOKUP_USER,
            type: 'GET',
            data: {
              id: inputVal
            },
            context: this,
            statusCode: {
              204: function () {
                this.serverErrors = [
                  SL.locale.get('Form.err_username_token')];
              },
              404: function () {
                this.serverErrors = [];
              }
            }
          }).complete(function () {
            this.render();
            this.asyncValidatedValue = inputVal;
          });
        }
      }
    } else if (this.validateType === 'team_slug') {
      var slug = '';
      inputVal = this.$inputElement.val();

      if (SL.current_team) {
        slug = SL.current_team.get('slug');
      }

      if (SL.util.validate.team_slug(inputVal).length === 0) {
        if (slug && slug === inputVal) {
          this.asyncValidatedValue = slug;
          this.serverErrors = [];
        } else if (this.asyncValidatedValue !== inputVal) {
          $.ajax({
            url: SL.config.AJAX_LOOKUP_ORGANIZATION,
            type: 'GET',
            data: {
              id: inputVal
            },
            context: this,
            statusCode: {
              204: function () {
                this.serverErrors =
                  [SL.locale.get('Form.err_slug_taken')];
              },
              404: function () {
                this.serverErrors = [];
              }
            }
          }).complete(function () {
            this.render();
            this.asyncValidatedValue = inputVal;
          });
        }
      }
    }
  },

  /**
   * Render Error Information.
   *
   * @function
   */
  render: function () {
    var errors = this.serverErrors.concat(this.clientErrors);

    if (errors.length > 0) {
      this.$domElement.addClass('has-error');
      this.$errorElement.appendTo(this.$domElement);
      this.$errorMessage.text(errors[0]);

      setTimeout((function () {
        this.$errorElement.addClass('visible');
      }).bind(this), 1);
    } else {
      this.$domElement.removeClass('has-error');
      this.$errorElement.removeClass('visible').remove();
    }
  },

  /**
   * Format Input Text To Lower Case, If Validate Type Is
   * Url Validate it.
   *
   * @function
   */
  format: function () {
    var val = '';

    if (this.validateType === 'username' || this.validateType === 'team_slug') {
      val = this.$inputElement.val();

      if (val) {
        this.$inputElement.val(val.toLowerCase());
      }
    }

    if (this.validateType === 'url') {
      val = this.$inputElement.val();

      if (val && val.length > 2 && /^http(s?):\/\//gi.test(val) === false) {
        this.$inputElement.val('http://' + val);
      }
    }
  },

  /**
   * Focus Input Element
   *
   * @function
   */
  focus: function () {
    this.$inputElement.focus();
  },

  /**
   * Before Submit, If This Input Element clientErrors And serverErrors
   * Is Not Empty Turn False.
   *
   * @function
   * @returns {boolean}
   */
  beforeSubmit: function () {
    this.validate(true);

    if (this.clientErrors.length > 0 || this.serverErrors.length > 0) {
      this.focus();
      return false;
    } else {
      return true;
    }
  },

  /**
   * Render Image Input Element.
   *
   * @function
   */
  renderImage: function () {
    var inputEle = this.$inputElement.get(0);

    if (inputEle.files && inputEle.files[0]) {
      var fileReader = new FileReader();

      fileReader.onload = (function (evt) {
        var $img = this.$domElement.find('img'),
          result = evt.target.result;

        if ($img.length > 0) {
          fileReader.attr('src', result);
        } else {
          $('<img src="' + result + '">')
            .appendTo(this.$domElement.find('.image-uploader'));
        }
      }).bind(this);
      fileReader.readAsDataURL(inputEle.files[0]);
    }
  },

  /**
   * Get This Input Element Have '[data-required]' Attribute.
   *
   * @function
   * @returns {boolean|*}
   */
  isRequired: function () {
    return !this.$domElement.hasClass('hidden') &&
      this.$domElement.is('[data-required]');
  },

  /**
   * Get Input Element Input Value Is Changed.
   *
   * @function
   * @returns {boolean}
   */
  isUnchanged: function () {
    return this.$inputElement.val() === this.originalValue;
  },

  /**
   * Form Unit Input OnInput Event Callback,
   * When user input text, validate input text.
   *
   * @function
   */
  onInput: function () {
    clearTimeout(this.validateTimeout);

    if (!SL.util.device.IS_PHONE && !SL.util.device.IS_TABLET) {
      var delay = 600;

      if ((this.clientErrors.length || this.serverErrors.length)) {
        delay = 300;
      }

      this.validateTimeout = setTimeout(this.validate.bind(this), delay);
    }
  },

  /**
   * The Input Change Event Callback,
   * If Input Text Change Validate It.
   *
   * @function
   * @param {Event} evt
   */
  onInputChange: function (evt) {
    if (this.$domElement.hasClass('image')) {
      this.renderImage(evt.target);
    }

    this.validate();
  },

  /**
   * On Input Focus Event Callback
   *
   * @function
   */
  onInputFocus: function () {
    this.$domElement.addClass('focused');
  },

  /**
   * On Input Blur Event Callback
   *
   * @function
   */
  onInputBlur: function () {
    this.format();
    this.$domElement.removeClass('focused');
  },

  /**
   * Before Form Submit Validate Input Text.
   *
   * @function
   * @returns {*|boolean}
   */
  onInputInvalid: function () {
    return this.beforeSubmit();
  },

  /**
   * Form Before Submit Event Callback.
   *
   * @function
   * @param {Event} evt
   * @returns {boolean}
   */
  onFormSubmit: function (evt) {
    if (this.beforeSubmit() === false) {
      evt.preventDefault();
      return false;
    }
  }
});

/*!
 * project name: SlideStudio
 * name:         reply.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/10/16
 */

'use strict';

/**
 * Abandoned, convert markdown.
 */
SL('components').Reply1 = Class.extend({
  /**
   * Constructor SL.components.Reply Instance
   *
   * @function
   */
  init: function () {
    this.$domElement  = $('#comments');
    this.$replyEditor = $('.reply_editor', '#reply_form');
    this.$replyButton = $('.submit_btn', '#reply_form');

    this.setup();
    this.render();
    this.bind();
  },

  /**
   * Setup Editor For Reply Editor
   *
   * @function
   */
  setup: function () {
    this.setupWYSIWYG();
    this.preloadWYSIWYG();
  },

  /**
   * @function
   */
  setupWYSIWYG: function () {
    window.CKEDITOR.on('dialogDefinition', function (evt) {
      evt.data.definition.resizable = window.CKEDITOR.DIALOG_RESIZE_NONE;
    });
    window.CKEDITOR.on('instanceReady', function (evt) {
      evt.editor.on('paste', function (ev) {
        if (ev.data && ev.data.type === 'html') {
          ev.data.dataValue =
            ev.data.dataValue
              .replace(/(font\-size|line\-height):\s?\d+(px|em|pt|%)?;/gi, '');
        }
      }, null, null, 9);
    });

    window.CKEDITOR.config.height                  = 150;
    window.CKEDITOR.disableAutoInline              = true;
    window.CKEDITOR.config.floatSpaceDockedOffsetY = 1;
    window.CKEDITOR.config.title                   = false;
  },

  /**
   * @function
   */
  preloadWYSIWYG: function () {
    var $p = $('<p>').hide().appendTo(document.body),
      editor = window.CKEDITOR.replace($p.get(0));

    if (editor) {
      editor.on('instanceReady', (function () {
        editor.destroy();
        $p.remove();
      }).bind(this));
    } else {
      console.warn('CKEDITOR library is not loaded!');
    }
  },

  /**
   * Render Reply Editor
   *
   * @function
   */
  render: function () {
    var options = {};
    this.editor = window.CKEDITOR.replace(this.$replyEditor.get(0), options);
    this.editor.on('instanceReady', (function () {
      this.$replyEditor.html(this.$replyEditor.html().trim());
      //this.editor.focus();

      var range = this.editor.createRange();
      range.moveToElementEditEnd(this.editor.editable());
      range.select();
    }).bind(this));
  },
  bind: function () {
    this.$replyButton.on('vclick', this.onReplyButtonClk.bind(this));
  },
  onReplyButtonClk: function (evt) {
    evt.preventDefault();
  }
});

SL('components').Reply = Class.extend({
  init: function () {
    this.$domElement    = $('#comments');

    this.$replyList   = this.$domElement.find('.panel:first-child');
    this.$replyForm   = $('#reply_form');
    this.$replyEditor = this.$replyForm.find('textarea.editor');
    this.$replySubmit = this.$replyForm.find('.submit_btn');

    this.allUserNames = _.uniq($('.reply_author', this.$reply1Items).map(function (index, element) {
      return $(element).text().trim();
    }).toArray());

    this.setupEditor(this.$replyEditor);
    this.bind();
  },
  setupEditor: function (element) {
    element = $(element);

    var editor = new Editor({status: []});
    editor.render(element.get(0));
    element.data('editor', editor);

    var $input = $(editor.codemirror.display.input);
    $input.keydown(function (evt) {
      if (evt.keyCode === 13 && (evt.ctrlKey || evt.metaKey)) {
        evt.preventDefault();
        element.closest('form').submit();
      }
    });

    // at.js 配置
    var codeMirrorGoLineUp         = CodeMirror.commands.goLineUp;
    var codeMirrorGoLineDown       = CodeMirror.commands.goLineDown;
    var codeMirrorNewlineAndIndent = CodeMirror.commands.newlineAndIndent;
    $input.atwho({
      at:  '@',
      data: this.allUserNames
    }).on('shown.atwho', function () {
      CodeMirror.commands.goLineUp         = _.noop;
      CodeMirror.commands.goLineDown       = _.noop;
      CodeMirror.commands.newlineAndIndent = _.noop;
    }).on('hidden.atwho', function () {
      CodeMirror.commands.goLineUp         = codeMirrorGoLineUp;
      CodeMirror.commands.goLineDown       = codeMirrorGoLineDown;
      CodeMirror.commands.newlineAndIndent = codeMirrorNewlineAndIndent;
    });
  },
  bind: function () {
    this.$reply1Items   = this.$domElement.find('.reply_area.reply_item');
    this.$upButtons     = this.$reply1Items.find('.user_action .up');
    this.$editButtons   = this.$reply1Items.find('.user_action .edit_reply_btn');
    this.$delButtons    = this.$reply1Items.find('.user_action .delete_reply_btn');
    this.$reply2Buttons = this.$reply1Items.find('.user_action .reply2');
    this.$reply2Submit  = this.$reply1Items.find('.reply2_area .reply2_submit_btn');
    this.$reply2Cancel  = this.$reply1Items.find('.reply2_area .reply2_cancel_btn');

    this.$reply1Items.hover(this.onReplyItemsHoverIn, this.onReplyItemsHoverOut);
    this.$upButtons.on('vclick', this.onUpBtnClk.bind(this));
    this.$editButtons.on('vclick', this.onEditBtnClk.bind(this));
    this.$delButtons.on('vclick', this.onDelBtnClk.bind(this));
    this.$reply2Buttons.on('vclick', this.onReply2BtnClk.bind(this));
    this.$reply2Submit.on('vclick', this.onReply2SubmitBtnClk.bind(this));
    this.$reply2Cancel.on('vclick', this.onReply2CancelBtnClk.bind(this));

    this.$replySubmit.on('vclick', this.onReplySubmitBtnClk.bind(this));
  },
  unbind: function () {
    this.$reply1Items.off( "mouseenter mouseleave" );
    this.$upButtons.off('vclick');
    this.$editButtons.off('vclick');
    this.$delButtons.off('vclick');
    this.$reply2Buttons.off('vclick');
    this.$reply2Submit.off('vclick');
    this.$reply2Cancel.off('vclick');

    this.$replySubmit.off('vclick');
  },
  parseTimes: function () {
    window.moment.lang(SL.util.getLanguage());

    $('time.ago').each(function () {
      var dateTime = $(this).attr('datetime');

      if (dateTime) {
        $(this).text(window.moment.utc(dateTime).fromNow());
      }
    });
    $('time.date').each(function () {
      var dateTime = $(this).attr('datetime');

      if (dateTime) {
        $(this).text(window.moment.utc(dateTime).fromNow('MMM Do, YYYY'));
      }
    });
  },
  renderReply: function (url, reply) {
    var index = $(this.$reply1Items.get(this.$reply1Items.length - 1)).attr('id') || '0';
    index = parseInt((index).match(/[0-9]/gm).join('')) + 1;
    var $item = $(
      '<div id="reply' + index + '" class="cell reply_area reply_item reply_highlight"> \
        <a id="' + reply.id + '" class="anchor"></a> \
        \
        <div class="author_content"> \
          <a class="user_avatar" href="/' + reply.user.username + '"> \
            <img src="' + reply.user.thumbnail_url + '" title="' + reply.user.username + '"> \
          </a> \
          \
          <div class="user_info"> \
            <a class="reply_author dark" href="/' + reply.user.username + '"> \
              ' + reply.user.username + ' \
            </a> \
            <a class="reply_time" href="#' + reply.id + '"> \
              ' + index + '楼•<time class="value ago" datetime="' + reply.create_at + '"></time> \
            </a> \
          </div> \
          \
          <div class="user_action"></div> \
        </div> \
        \
        <div class="reply_content from-' + reply.user.username + '"> \
          ' + reply.content + ' \
        </div> \
        \
        <div class="clearfix"><div class="reply2_area"> \
          <form class="reply2_form" action="" method="post"> \
            <input type="hidden" name="reply_id" value="' + reply.id + '"> \
            <div class="markdown_editor in_editor"><div class="markdown_in_editor"> \
              <textarea class="editor reply_editor" id="reply2_editor_' + reply.id + '" name="r_content" rows="4"></textarea> \
              \
              <div class="editor_buttons"> \
                <input class="span-primary reply2_submit_btn submit_btn" type="submit" data-id="' + reply.id + '" data-loading-text="回复中.." value="回复"> \
                <input class="span-primary reply2_cancel_btn" type="button" value="取消"> \
              </div> \
            </div></div> \
          </form> \
        </div></div> \
      </div>');

    if (!!SL.current_user) {
      if (SL.current_user.get('id') !== reply.user.id) {
        $item.find('.user_action').append(
          '<span class="up"> \
            <i class="fa up_btn icon i-thumbs-o-up invisible" title="喜欢"></i> \
            <span class="up-count"></span> \
          </span>');
      } else if (SL.current_user.get('id') === reply.user.id) {
        $item.find('.user_action').append(
          '<a class="edit_reply_btn" href="javascript: void(0);"> \
            <i class="fa icon i-edit" title="编辑"></i> \
          </a> \
          <a class="delete_reply_btn" href="javascript: void(0);"> \
            <i class="fa icon i-trash" title="删除"></i> \
          </a>');
      }

      $item.find('.user_action').append(
        '<span class="reply2"> \
          <i class="fa icon i-reply reply2_btn" title="回复"></i> \
        </span>');
    }

    this.$replyList.append($item);
  },
  sortReplyLvl: function () {
    this.$reply1Items.each(function (index, element) {
      index  += 1;
      element = $(element);
      element.find('.user_info .reply_time').val(index + '楼•');
    });
  },

  onReplyItemsHoverIn: function () {
    $(this).find('.up_btn').removeClass('invisible');
  },
  onReplyItemsHoverOut: function () {
    var $this = $(this);

    if ($this.find('.up-count').text().trim() === '') {
      $this.find('.up_btn').addClass('invisible');
    }
  },
  onUpBtnClk: function (evt) {
    var $btn    = $(evt.currentTarget);
    var replyId = $btn.closest('.reply_area').find('.anchor').attr('id');

    $.ajax({
      url:    '/api/v1/reply/' + replyId + '/up',
      method: 'POST',
      context: this
    }).done(function (data) {
    }).fail(function (xhr) {
    });
  },
  onEditBtnClk: function () {},
  onDelBtnClk: function () {},
  onReply2BtnClk: function (evt) {
    var $btn        = $(evt.currentTarget);
    var userName    = $btn.closest('.author_content').find('.reply_author').text().trim();
    var $editorWrap = $btn.closest('.reply_area').find('.reply2_form');
    var $textArea   = $editorWrap.find('textarea.editor');
    var editor      = $textArea.data('editor');

    if (!editor) {
      this.setupEditor($textArea);
      editor = $textArea.data('editor');
    }

    $editorWrap.show('fast', function () {
      var cm = editor.codemirror;
      cm.focus();

      if(cm.getValue().indexOf('@' + userName) < 0){
        editor.push('@' + userName + ' ');
      }
    });
  },
  onReply2SubmitBtnClk: function (evt) {
    var $btn       = $(evt.currentTarget);
    var $replyForm = $btn.closest('.reply_area').find('.reply2_form');

    evt.preventDefault();

    var url     = $replyForm.attr('action');
    var method  = $replyForm.attr('method');
    var replyId = $replyForm.find('input[name=reply_id]').val();
    var editor  = $replyForm.find('textarea.editor').data('editor');
    var content = editor.codemirror.getValue();

    $.ajax({
      type:    method,
      url:     url,
      context: this,
      data: {
        reply_id:  replyId,
        r_content: content
      }
    }).done(function (reply) {
      this.renderReply(url, reply);
      this.parseTimes();
      this.unbind();
      this.bind();
      this.sortReplyLvl();
      $replyForm.hide('fast');
    }).fail(function () {});
  },
  onReply2CancelBtnClk: function (evt) {
    var $btn        = $(evt.currentTarget);
    var $editorWrap = $btn.closest('.reply_area').find('.reply2_form');
    $editorWrap.hide('fast');
  },

  /**
   * Reply Button has Abandoned.
   *
   * @function
   * @param {Event} evt
   */
  onReplySubmitBtnClk: function (evt) {
    evt.preventDefault();

    var url     = this.$replyForm.attr('action');
    var method  = this.$replyForm.attr('method');
    var editor  = this.$replyForm.find('textarea.editor').data('editor');
    var content = editor.codemirror.getValue();

    $.ajax({
      type:    method,
      url:     url,
      context: this,
      data: {
        r_content: content
      }
    }).done(function (reply) {
      this.renderReply(url, reply);
      this.parseTimes();
      this.unbind();
      this.bind();
      this.sortReplyLvl();
    }).fail(function () {});
  }
});


/*!
 * project name: SlideStudio
 * name:         kudos.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/28
 */

'use strict';

SL('components').Kudos = (function () {
  var kudos = {};

  function init() {
    $('[data-kudos-value][data-kudos-id]').each(function (index, element) {
      var kudosId = element.getAttribute('data-kudos-id');

      if (kudosId && !kudos[kudosId]) {
        kudos[kudosId] = element.getAttribute('data-kudos-value');
      }
    });

    $('.kudos-trigger[data-kudos-id]').on('click', function (evt) {
      var $current = evt.currentTarget;

      if ($current.getAttribute('data-kudoed-by-user') === 'true') {
        removeKudo($current.getAttribute('data-kudos-id'));
      } else {
        addKudo($current.getAttribute('data-kudos-id'));
      }
    });
  }

  function addKudo(kudosId) {
    setKudoUser(kudosId);

    $.ajax({
      type: 'POST',
      url: SL.config.AJAX_KUDO_DECK(kudosId)
      // context: this
    }).fail(function () {
      resetKudoUser(kudosId);
      SL.notify(SL.locale.get('Generic_Error'));
    });
  }

  function removeKudo(kudosId) {
    resetKudoUser(kudosId);

    $.ajax({
      type: 'DELETE',
      url: SL.config.AJAX_UNKUDO_DECK(kudosId)
      // context: this
    }).fail(function () {
      setKudoUser(kudosId);
      SL.notify(SL.locale.get('Generic_Error'));
    });
  }

  function resetKudoUser(kudosId) {
    var $element = $('.kudos-trigger[data-kudos-id="' + kudosId + '"]');
    $element.attr('data-kudoed-by-user', 'false');

    kudos[kudosId] -= 1;

    setKudoVal(kudosId, kudos[kudosId]);

    $element.find('.kudos-icon').removeClass('bounce');
  }

  function setKudoUser(kudosId) {
    var $element = $('.kudos-trigger[data-kudos-id="' + kudosId + '"]');
    $element.attr('data-kudoed-by-user', 'true');

    kudos[kudosId] += 1;

    setKudoVal(kudosId, kudos[kudosId]);

    var $icon = $element.find('.kudos-icon');

    if ($icon.length) {
      $icon.removeClass('bounce');

      setTimeout(function () {
        $icon.addClass('bounce');
      }, 1);
    }
  }

  function setKudoVal(kudosId, kudoVal) {
    if (typeof kudos[kudosId] === "number") {
      if (typeof kudosVal === "number") {
        kudos[kudosId] = kudoVal;
      }

      kudoVal = Math.max(kudos[kudosId], 0);

      $('[data-kudos-id][data-kudos-value]')
        .each(function (index, element) {
          element.setAttribute('data-kudos-value', kudoVal);
        });
    }
  }

  init();
})();


/*!
 * project name: SlideStudio
 * name:         menu.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/28
 */

'use strict';

SL('components').Menu = Class.extend({
  /**
   * Constructor SL.components.Meter Instance
   *
   * @function
   * @param {Object} options
   */
  init: function (options) {
    this.config = $.extend({
      alignment:     'auto',
      anchorSpacing: 10,
      minWidth:      0,
      offsetX:       0,
      offsetY:       0,
      options:       [],
      showOnHover:   false,
      touch: /(iphone|ipod|ipad|android|windows\sphone)/gi.test(navigator.userAgent)
    }, options);
    this.config.anchor = $(this.config.anchor);

    this.show                = this.show.bind(this);
    this.hide                = this.hide.bind(this);
    this.layout              = this.layout.bind(this);
    this.toggle              = this.toggle.bind(this);
    this.onMouseOver         = this.onMouseOver.bind(this);
    this.onDocumentMouseMove = this.onDocumentMouseMove.bind(this);
    this.onDocumentMouseDown = this.onDocumentMouseDown.bind(this);
    this.onDocumentKeyDown   = this.onDocumentKeyDown.bind(this);

    this.submenus  = [];
    this.destroyed = new window.signals.Signal();

    this.render();
    this.renderList();

    if (this.config.anchor.length > 0) {
      if (!!options.touch) {
        this.config.anchor.addClass('menu-show-on-touch');
        this.config.anchor.on('touchstart pointerdown', (function (evt) {
          evt.preventDefault();
          this.toggle();
        }).bind(this));
        this.config.anchor.on('click', (function (evt) {
          evt.preventDefault();
        }).bind(this));
      } else {
        if (this.config.showOnHover) {
          this.config.anchor.on('mouseover', this.onMouseOver);

          try {
            if (this.config.anchor.is(':hover')) {
              this.onMouseOver();
            }
          } catch (err) {
            new Error(err);
          }
        }

        this.config.anchor.on('click', this.toggle);
      }
    }
  },

  /**
   * @function
   */
  render: function () {
    this.$domElement     = $('<div class="sl-menu">');

    this.$listElement    = $('<div class="sl-menu-list">')
      .appendTo(this.$domElement);
    this.$arrowElement   = $('<div class="sl-menu-arrow">')
      .appendTo(this.$domElement);
    this.$hitareaElement = $('<div class="sl-menu-hitarea">')
      .appendTo(this.$domElement);

    this.$listElement.css('minWidth', this.config.minWidth + 'px');
  },

  /**
   * @function
   */
  renderList: function () {
    this.config.options.forEach(function (btn) {
      var $menu = null;

      if (typeof btn.url === "string") {
        $menu = $('<a class="sl-menu-item" href="' + btn.url + '">');
      } else {
        $menu = $('<div class="sl-menu-item">');
      }

      $menu.html('<span class="label">' + btn.label + '</span>');
      $menu.data('callback', btn.callback);
      $menu.appendTo(this.$listElement);
      $menu.on('click', (function (evt) {
        var cb = $(evt.currentTarget).data('callback');

        if (typeof cb === "function") {
          cb.apply(null);
        }

        this.hide();
      }).bind(this));

      if (!!btn.icon) {
        $menu.append('<span class="icon i-' + btn.icon + '"></span>');
      }

      if (!!btn.attributes) {
        $menu.attr(btn.attributes);
      }

      if (btn.submenu && !this.config.touch) {
        this.submenus.push(new SL.components.Menu({
          anchor:        $menu,
          anchorSpacing: 10,
          alignment:     btn.submenuAlignment || 'rl',
          minWidth:      btn.submenuWidth || 160,
          showOnHover:   true,
          options:       btn.submenu
        }));
      }
    }.bind(this));

    this.$listElement.find('.sl-menu-item:not(:last-child)')
      .after('<div class="sl-menu-divider">');
  },

  /**
   * @function
   */
  bind: function () {
    $(window).on('resize scroll', this.layout);
    $(document).on('keydown', this.onDocumentKeyDown);
    $(document).on('mousedown touchstart pointerdown', this.onDocumentMouseDown);
  },

  /**
   * @function
   */
  unbind: function () {
    $(window).off('resize scroll', this.layout);
    $(document).off('keydown', this.onDocumentKeyDown);
    $(document).off('mousedown touchstart pointerdown', this.onDocumentMouseDown);
  },

  /**
   * @function
   */
  layout: function () {
    var offset      = this.config.anchor.offset(),
      anchorSpacing = this.config.anchorSpacing,
      alignment     = this.config.alignment,
      scrollLeft    = $(window).scrollLeft(),
      scrollTop     = $(window).scrollTop(),
      offsetX       = offset.left + this.config.offsetX,
      offsetY       = offset.top + this.config.offsetY,
      anchorWidth   = this.config.anchor.outerWidth(),
      anchorHeight  = this.config.anchor.outerHeight(),
      domWidth      = this.$domElement.outerWidth(),
      domHeight     = this.$domElement.outerHeight(),
      centerLeft    = domWidth / 2,
      centerTop     = domHeight / 2,
      cover         = 8;

    if (alignment === 'auto') {
      if (offset.top - (domHeight + anchorSpacing + cover) < scrollTop) {
        alignment = 'b';
      } else {
        alignment = 't';
      }
    }

    if (alignment === 'rl') {
      if ((offset.left + anchorWidth +
        anchorSpacing + cover + domWidth) < window.innerWidth) {
        alignment = 'r';
      } else {
        alignment = 'l';
      }
    }

    this.$domElement.attr('data-alignment', alignment);

    switch (alignment) {
      case 't':
        offsetX += (anchorWidth - domWidth) / 2;
        offsetY -= domHeight + anchorSpacing;
        break;
      case 'b':
        offsetX += (anchorWidth - domWidth) / 2;
        offsetY += anchorHeight + anchorSpacing;
        break;
      case 'l':
        offsetX -= domWidth + anchorSpacing;
        offsetY += (anchorHeight - domHeight) / 2;
        break;
      case 'r':
        offsetX += anchorWidth + anchorSpacing;
        offsetY += (anchorHeight - domHeight) / 2;
        break;
      default :
        break;
    }

    offsetX = Math.min(
      Math.max(offsetX, scrollLeft + anchorSpacing),
      window.innerWidth + scrollLeft - domWidth - anchorSpacing);
    offsetY = Math.min(
      Math.max(offsetY, scrollTop + anchorSpacing),
      window.innerHeight + scrollTop - domHeight - anchorSpacing);

    switch (alignment) {
      case 't':
        centerLeft = offset.left - offsetX + anchorWidth / 2;
        centerTop = domHeight;
        break;
      case 'b':
        centerLeft = offset.left - offsetX + anchorWidth / 2;
        centerTop = -cover;
        break;
      case 'l':
        centerLeft = domWidth;
        centerTop = offset.top - offsetY + anchorHeight / 2;
        break;
      case 'r':
        centerLeft = -cover;
        centerTop = offset.top - offsetY + anchorHeight / 2;
        break;
      default :
        break;
    }

    this.$domElement.css({
      left: offsetX,
      top:  offsetY
    });
    this.$arrowElement.css({
      left: centerLeft,
      top:  centerTop
    });
    this.$hitareaElement.css({
      top:   -anchorSpacing,
      right:  -anchorSpacing,
      bottom: -anchorSpacing,
      left:   -anchorSpacing
    });
  },

  /**
   * @function
   * @param {Number} delta
   */
  focus: function (delta) {
    var $focus = this.$listElement.find('.focus');

    if ($focus.length > 0) {
      var $item = null;

      if (delta > 0) {
        $item = $focus.nextAll('.sl-menu-item').first();
      } else {
        $item = $focus.prevAll('.sl-menu-item').first();
      }

      if ($item.length > 0) {
        $focus.removeClass('focus');
        $item.addClass('focus');
      }
    } else {
      this.$listElement.find('.sl-menu-item').first().addClass('focus');
    }
  },

  /**
   * @function
   */
  show: function () {
    this.$domElement.removeClass('visible').appendTo(document.body);

    setTimeout((function () {
      this.$domElement.addClass('visible');
    }).bind(this), 1);

    this.config.anchor.addClass('menu-is-open');
    this.layout();
    this.bind();
  },

  /**
   * @function
   */
  hide: function () {
    this.$listElement.find('.focus').removeClass('focus');
    this.config.anchor.removeClass('menu-is-open');

    this.$domElement.detach();
    this.unbind();

    $(document).off('mousemove', this.onDocumentMouseMove);

    this.isMouseOver = false;
    clearTimeout(this.hideTimeout);
  },

  /**
   * @function
   */
  toggle: function () {
    if (this.isVisible()) {
      this.hide();
    } else {
      this.show();
    }
  },

  /**
   * @function
   * @returns {boolean}
   */
  isVisible: function () {
    return this.$domElement.parent().length > 0;
  },

  /**
   * @function
   * @returns {boolean}
   */
  hasSubMenu: function () {
    return this.submenus.length > 0;
  },

  /**
   * @function
   */
  destroy: function () {
    this.destroyed.dispatch();
    this.destroyed.dispose();
    this.$domElement.remove();

    this.unbind();

    this.config.anchor.off('click', this.toggle);
    this.config.anchor.off('hover', this.toggle);

    this.submenus.forEach(function (menu) {
      menu.destroy();
    });
  },

  /**
   * @function
   * @param {String} evt
   */
  onDocumentKeyDown: function (evt) {
    if (evt.keyCode === 27) {
      this.hide();
      evt.preventDefault();
    }

    if (evt.keyCode === 13) {
      var $focus = this.$listElement.find('.focus');

      if ($focus.length > 0) {
        $focus.trigger('click');
        evt.preventDefault();
      }
    } else if (evt.keyCode === 38) {
      this.focus(-1);
      evt.preventDefault();
    } else if (evt.keyCode === 40) {
      this.focus(1);
      evt.preventDefault();
    } else if (evt.keyCode === 9 && evt.shiftKey) {
      this.focus(-1);
      evt.preventDefault();
    } else if (evt.keyCode === 9) {
      this.focus(1);
      evt.preventDefault();
    }
  },

  /**
   * @function
   */
  onMouseOver: function () {
    if (!this.isMouseOver) {
      $(document).on('mousemove', this.onDocumentMouseMove);
      this.hideTimeout = -1;
      this.isMouseOver = true;
      this.show();
    }
  },

  /**
   * @function
   * @param {String} evt
   */
  onDocumentMouseMove: function (evt) {
    var $target = $(evt.target),
      noClosest = $target.closest(this.$domElement).length === 0 &&
        $target.closest(this.config.anchor).length === 0;

    if (this.hasSubMenu()) {
      noClosest = $target.closest('.sl-menu').length === 0 &&
        $target.closest(this.config.anchor).length === 0;
    }

    if (noClosest) {
      if (this.hideTimeout === -1) {
        clearTimeout(this.hideTimeout);
        this.hideTimeout = setTimeout(this.hide, 150);
      }
    } else if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = -1;
    }
  },

  /**
   * @function
   * @param {String} evt
   */
  onDocumentMouseDown: function (evt) {
    var $target = $(evt.target);

    if (this.isVisible() &&
      $target.closest(this.$domElement).length === 0 &&
      $target.closest(this.config.anchor).length === 0) {
      this.hide();
    }
  }
});


/*!
 * project name: SlideStudio
 * name:         meter.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/28
 */

'use strict';

SL('components').Meter = Class.extend({
  /**
   * Constructor SL.components.Meter Instance
   *
   * @function
   * @param {*|jQuery|HTMLElement} element
   */
  init: function (element) {
    this.$domElement      = $(element);
    this.$labelElement    = $('<div class="label">').appendTo(this.$domElement);
    this.$progressElement = $('<div class="progress">').appendTo(this.$domElement);

    this.read();
    this.paint();

    window.meter = this;
  },

  /**
   * @function
   */
  read: function () {
    this.unit  = '';
    this.type  = this.$domElement.attr('data-type');
    this.value = parseInt(this.$domElement.attr('data-value'), 10) || 0;
    this.total = parseInt(this.$domElement.attr('data-total'), 10) || 0;

    switch (this.type) {
      case 'storage':
        var KB = 1024, MB = 1024 * KB, GB = 1024 * MB;

        if (this.value < MB && this.total < MB) {
          this.value = Math.round(this.value / KB);
          this.total = Math.round(this.total / KB);
          this.unit  = 'KB';
        } else if (this.value < GB && this.total < GB) {
          this.value = Math.round(this.value / MB);
          this.total = Math.round(this.total / MB);
          this.unit  = 'MB';
        } else {
          this.value = Math.round(this.value / GB);
          this.total = Math.round(this.total / GB);
          this.unit  = 'GB';
        }

        break;
      default :
        break;
    }
  },

  /**
   * @function
   */
  paint: function () {
    var percent = Math.min(Math.max(this.value / this.total, 0), 1) || 0;

    this.$labelElement.text(this.value + ' / ' + this.total + ' ' + this.unit);
    this.$progressElement.width(100 * percent + '%');

    if (this.total === 0) {
      this.$domElement.attr('data-state', 'invalid');
    } else if (percent > 0.9) {
      this.$domElement.attr('data-state', 'negative');
    } else if (percent > 0.7) {
      this.$domElement.attr('data-state', 'warning');
    } else {
      this.$domElement.attr('data-state', 'positive');
    }
  }
});


/*!
 * project name: SlideStudio
 * name:         prompt.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/28
 */

'use strict';

SL('components').Prompt = Class.extend({
  /**
   * Constructor SL.components.Prompt Instance
   *
   * @function
   * @param {Object} options
   */
  init: function (options) {
    this.config = $.extend({
      type:         'custom',
      data:         null,
      anchor:       null,
      title:        null,
      optional:     true,
      alignment:    'auto',
      offsetX:      0,
      offsetY:      0,
      className:    null,
      confirmLabel: 'OK',
      cancelLabel:  '取消',
      hoverTarget:  null,
      hoverClass:   'hover'
    }, options);

    this.onBackgroundClicked  = this.onBackgroundClicked.bind(this);
    this.onDocumentKeyDown    = this.onDocumentKeyDown.bind(this);
    this.onPromptCancelClick  = this.onPromptCancelClick.bind(this);
    this.onPromptConfirmClick = this.onPromptConfirmClick.bind(this);
    this.onInputChanged       = this.onInputChanged.bind(this);
    this.layout               = this.layout.bind(this);

    this.confirmed = new window.signals.Signal();
    this.canceled  = new window.signals.Signal();
    this.destroyed = new window.signals.Signal();

    this.render();
  },

  /**
   * @function
   */
  render: function () {
    this.$domElement   =
      $('<div class="sl-prompt" data-type="' + this.config.type + '">');
    this.$innerElement =
      $('<div class="sl-prompt-inner">').appendTo(this.$domElement);
    this.$arrowElement =
      $('<div class="sl-prompt-arrow">').appendTo(this.$innerElement);

    if (this.config.title) {
      this.$titleElement = $('<h3 class="title">')
        .html(this.config.title).appendTo(this.$innerElement);
    }

    if (this.config.className) {
      this.$domElement.addClass(this.config.className);
    }

    if (this.config.html) {
      this.$innerElement.append(this.config.html);
    }

    if (this.config.type === 'select') {
      this.renderSelect();
    } else if (this.config.type === 'list') {
      this.renderList();
      this.renderButtons(!this.config.multiselect, this.config.multiselect);
    } else if (this.config.type === 'input') {
      this.renderInput();
      this.renderButtons();
    }
  },

  /**
   * @function
   */
  renderSelect: function () {
    this.config.data.forEach((function (item) {
      var $btn = $('<a class="item button outline l">').html(item.html);
      $btn.appendTo(this.$innerElement);

      $btn.data('callback', item.callback);
      $btn.on('vclick', (function (evt) {
        var cb = $(evt.currentTarget).data('callback');

        if (typeof cb === "function") {
          cb.apply(null);
        }

        this.destroy();

        evt.preventDefault();
      }).bind(this));

      if (item.focused === true) {
        $btn.addClass('focus');
      }

      if (item.selected === true) {
        $btn.addClass('selected');
      }

      if (typeof item.className === "string") {
        $btn.addClass(item.className);
      }
    }).bind(this));

    this.$domElement.attr('data-length', this.config.data.length);
  },

  /**
   * @function
   */
  renderList: function () {
    this.$listElement = $('<div class="list">').appendTo(this.$innerElement);

    this.config.data.forEach((function (item) {
      var $item = $('<div class="item">');
      $item.html([
        '<span class="title">',
          item.title ? item.title : item.value,
        '</span>',
        '<span class="checkmark icon i-checkmark"></span>'].join(''));
      $item.appendTo(this.$listElement);

      $item.data({
        callback: item.callback,
        value:    item.value
      });

      $item.on('click', (function (evt) {
        var $target = $(evt.currentTarget),
          cb = $target.data('callback'), val = $target.data('value');

        if (this.config.multiselect) {
          $target.toggleClass('selected');

          if (item.exclusive) {
            $target.addClass('selected');
            $target.siblings().removeClass('selected');
          } else {
            $target.siblings().filter('.exclusive').removeClass('selected');
          }
        }

        if (typeof cb === "function") {
          cb.apply(null, [val, $target.hasClass('selected')]);
        }

        if (this.config.multiselect) {
          this.confirmed.dispatch(val);
          this.destroy();
        }
      }).bind(this));

      if (item.focused === true) {
        $item.addClass('focus');
      }

      if (item.selected === true) {
        $item.addClass('selected');
      }

      if (item.exclusive === true) {
        $item.addClass('exclusive');
      }

      if (typeof item.className === "string") {
        $item.addClass(item.className);
      }
    }).bind(this));
  },

  /**
   * @function
   */
  renderInput: function () {
    if (this.config.data.multiline === true) {
      this.$inputElement = $('<textarea cols="40" rows="8">');
    } else {
      this.$inputElement = $('<input type="text">');

      if (typeof this.config.data.width === "number") {
        this.$inputElement.css('width', this.config.data.width);
      }
    }

    if (this.config.data.value) {
      this.$inputElement.val(this.config.data.value);
    }

    if (this.config.data.placeholder) {
      this.$inputElement.attr('placeholder', this.config.data.placeholder);
    }

    if (this.config.data.maxlength) {
      this.$inputElement.attr('maxlength', this.config.data.maxlength);
    }

    this.$inputWrapperElement = $('<div class="input-wrapper">')
      .append(this.$inputElement);
    this.$inputWrapperElement.appendTo(this.$innerElement);

    this.onInputChanged();
  },

  /**
   * @function
   * @param {boolean} noMultiselect
   * @param {boolean} multiselect
   */
  renderButtons: function (noMultiselect, multiselect) {
    this.$footerElement = $('<div class="footer">')
      .appendTo(this.$innerElement);

    if (!multiselect && this.config.optional && this.config.cancelLabel) {
      this.$footerElement.append([
        '<button class="button l outline white prompt-cancel">',
          this.config.cancelLabel,
        '</button>'].join(''));
    }

    if (!noMultiselect && this.config.confirmLabel) {
      this.$footerElement.append([
        '<button class="button l prompt-confirm">',
          this.config.confirmLabel,
        '</button>'].join(''));
    }
  },

  /**
   * @function
   */
  bind: function () {
    $(window).on('resize', this.layout);

    this.$domElement.on('vclick', this.onBackgroundClicked);

    SL.keyboard.keyDown(this.onDocumentKeyDown);

    if ($('html').css('overflow') !== 'hidden') {
      $(window).on('scroll', this.layout);
    }

    this.$domElement.find('.prompt-cancel').on('vclick', this.onPromptCancelClick);
    this.$domElement.find('.prompt-confirm').on('vclick', this.onPromptConfirmClick);

    if (this.$inputElement) {
      this.$inputElement.on('input', this.onInputChanged);
    }
  },

  /**
   * @function
   */
  unbind: function () {
    $(window).off('resize scroll', this.layout);

    this.$domElement.off('vclick', this.onBackgroundClicked);

    SL.keyboard.release(this.onDocumentKeyDown);

    this.$domElement.find('.prompt-cancel').off('vclick', this.onPromptCancelClick);
    this.$domElement.find('.prompt-confirm').off('vclick', this.onPromptConfirmClick);

    if (this.$inputElement) {
      this.$inputElement.off('input', this.onInputChanged);
    }
  },

  /**
   * @function
   */
  layout: function () {
    var innerBorder = 10,
      winInnerW = window.innerWidth,
      winInnerH = window.innerHeight;

    this.$innerElement.css({
      'max-width':  winInnerW - 2 * innerBorder,
      'max-height': winInnerH - 2 * innerBorder
    });

    var innerElementW = this.$innerElement.outerWidth(),
      innerElementH   = this.$innerElement.outerHeight(),
      $anchor         = $(this.config.anchor);

    if ($anchor.length > 0) {
      var offset   = $anchor.offset(), anchorBorder = 15,
        alignment  = this.config.alignment,
        scrollLeft = $(window).scrollLeft(),
        scrollTop  = $(window).scrollTop(),
        left       = offset.left - scrollLeft,
        top        = offset.top - scrollTop;

      left += this.config.offsetX;
      top  += this.config.offsetY;

      var anchorW = $anchor.outerWidth(),
        anchorH   = $anchor.outerHeight(),
        arrowLeft = innerElementW / 2,
        arrowTop  = innerElementW / 2, arrowBorder = 8;

      if (alignment === 'auto') {
        if (offset.top - (innerElementH + anchorBorder + arrowBorder) < scrollTop) {
          alignment = 'b';
        } else {
          alignment = 't';
        }
      }

      this.$domElement.attr('data-alignment', alignment);

      switch (alignment) {
        case 't':
          left += (anchorW - innerElementW) / 2;
          top  -= innerElementH + anchorBorder;
          break;
        case 'b':
          left += (anchorW - innerElementW) / 2;
          top  += anchorH + anchorBorder;
          break;
        case 'l':
          left -= innerElementW + anchorBorder;
          top  += (anchorH - innerElementH) / 2;
          break;
        case 'r':
          left += anchorW + anchorBorder;
          top  += (anchorH - innerElementH) / 2;
      }

      left = Math.max(Math.min(left, window.innerWidth - innerElementW - innerBorder), innerBorder);
      top  = Math.max(Math.min(top, window.innerHeight - innerElementH - innerBorder), innerBorder);
      left = Math.round(left);
      top  = Math.round(top);

      switch (alignment) {
        case't':
          arrowLeft = offset.left - left - scrollLeft + anchorW / 2;
          arrowLeft = Math.max(Math.min(arrowLeft, innerElementW - arrowBorder), arrowBorder);
          arrowTop  = innerElementH;
          break;
        case'b':
          arrowLeft = offset.left - left - scrollLeft + anchorW / 2;
          arrowLeft = Math.max(Math.min(arrowLeft, innerElementW - arrowBorder), arrowBorder);
          arrowTop  = -arrowBorder;
          break;
        case'l':
          arrowLeft = innerElementW;
          arrowTop  = offset.top - top - scrollTop + anchorH / 2;
          arrowTop  = Math.max(Math.min(arrowTop, innerElementH - arrowBorder), arrowBorder);
          break;
        case'r':
          arrowLeft = -arrowBorder;
          arrowTop  = offset.top - top - scrollTop + anchorH / 2;
          arrowTop  = Math.max(Math.min(arrowTop, innerElementH - arrowBorder), arrowBorder);
      }

      this.$innerElement.css({
        left: left,
        top:  top
      });
      this.$arrowElement.css({
        left: arrowLeft,
        top:  arrowTop
      }).show();
    } else {
      this.$innerElement.css({
        left: Math.round((winInnerW - innerElementW) / 2),
        top:  Math.round(0.4 * (winInnerH - innerElementH))
      });
      this.$arrowElement.hide();
    }
  },

  /**
   * @function
   * @param {boolean} isNext
   */
  focus: function (isNext) {
    var $focus = this.$innerElement.find('.focus');

    if (!$focus.length) {
      $focus = this.$innerElement.find('.selected');
    }

    if ($focus.length) {
      var $other = null;

      if (isNext > 0) {
        $focus.next('.item');
      } else {
        $focus.prev('.item');
      }

      if ($other.length) {
        $focus.removeClass('focus');
        $other.addClass('focus');
      }
    } else {
      this.$innerElement.find('.item').first().addClass('focus');
    }
  },

  /**
   * @function
   */
  show: function () {
    var $anchor = $(this.config.anchor);

    if ($anchor.length) {
      $anchor.addClass('focus');
    }

    $(this.config.hoverTarget).addClass(this.config.hoverClass);

    this.$domElement.removeClass('visible').appendTo(document.body);

    setTimeout((function () {
      this.$domElement.addClass('visible');
    }).bind(this), 1);

    this.layout();
    this.bind();

    if (this.$inputElement) {
      this.$inputElement.focus();
    }
  },

  /**
   * @function
   */
  hide: function () {
    var $anchor = $(this.config.anchor);

    if ($anchor.length) {
      $anchor.removeClass('focus');
    }

    $(this.config.hoverTarget).removeClass(this.config.hoverClass);

    this.$domElement.detach();
    this.unbind();
  },

  /**
   * @function
   * @returns {*|String}
   */
  getValue: function () {
    if (this.config.type === 'input') {
      return this.$inputElement.val();
    }

    return '';
  },

  /**
   * @function
   * @returns {*}
   */
  getDOMElement: function () {
    return this.$domElement;
  },

  /**
   * @function
   */
  cancel: function () {
    if (this.config.type === 'input' &&
      this.config.data.confirmBeforeDiscard) {
      var configVal = this.config.data.value || '',
        val = this.getValue() || '';

      if (configVal !== val) {
        SL.prompt({
          title: 'Discard unsaved changes?',
          type:  'select',
          data: [{
            html: '<h3>Cancel</h3>'
          }, {
            html: '<h3>Discard</h3>',
            selected:  true,
            className: 'negative',
            callback: (function () {
              this.canceled.dispatch(this.getValue());
              this.destroy();
            }).bind(this)
          }]
        });
      } else {
        this.canceled.dispatch(this.getValue());
        this.destroy();
      }
    } else {
      this.canceled.dispatch(this.getValue());
      this.destroy();
    }
  },

  /**
   * @function
   */
  destroy: function () {
    this.destroyed.dispatch();
    this.destroyed.dispose();

    var $anchor = $(this.config.anchor);

    if ($anchor.length) {
      $anchor.removeClass('focus');
    }

    $(this.config.hoverTarget).removeClass(this.config.hoverClass);
    this.$domElement.remove();

    this.unbind();

    this.confirmed.dispose();
    this.canceled.dispose();
  },

  /**
   * @function
   * @param {String} evt
   */
  onBackgroundClicked: function (evt) {
    if (this.config.optional && $(evt.target).is(this.$domElement)) {
      this.cancel();
      evt.preventDefault();
    }
  },

  /**
   * @function
   * @param {String} evt
   */
  onPromptCancelClick: function (evt) {
    this.cancel();
    evt.preventDefault();
  },

  /**
   * @function
   * @param {String} evt
   */
  onPromptConfirmClick: function (evt) {
    this.confirmed.dispatch(this.getValue());
    this.destroy();
    evt.preventDefault();
  },

  /**
   * @function
   * @param {String} evt
   */
  onDocumentKeyDown: function (evt) {
    if (evt.keyCode === 27) {
      if (this.config.optional) {
        this.cancel();
      }

      evt.preventDefault();
      return false;
    }

    if (this.config.type === 'select' || this.config.type === 'list') {
      if (evt.keyCode === 13) {
        var $inputFocus = this.$innerElement.find('.focus');

        if ($inputFocus.length === 0) {
          $inputFocus = this.$innerElement.find('.selected');
        }

        if ($inputFocus.length) {
          $inputFocus.trigger('click');
          evt.preventDefault();
        }
      } else if (evt.keyCode === 37 || evt.keyCode === 38) {
        this.focus(-1);
        evt.preventDefault();
      } else if (evt.keyCode === 39 || evt.keyCode === 40) {
        this.focus(1);
        evt.preventDefault();
      } else if (evt.keyCode === 9 && evt.shiftKey) {
        this.focus(-1);
        evt.preventDefault();
      } else if (evt.keyCode === 9) {
        this.focus(1);
        evt.preventDefault();
      }
    }

    if (this.config.type === 'input') {
      if (!(evt.keyCode !== 13 || this.config.data.multiline)) {
        this.onPromptConfirmClick(evt);
      }
    }

    return true;
  },

  /**
   * @function
   */
  onInputChanged: function () {
    if (this.config.data.maxlength) {
      var $inputStatus = this.$inputWrapperElement.find('.input-status');

      if ($inputStatus.length === 0) {
        $inputStatus = $('<div class="input-status">')
          .appendTo(this.$inputWrapperElement);
      }

      var valLen  = this.$inputElement.val().length,
        maxlength = this.config.data.maxlength;

      $inputStatus.text(valLen + '/' + maxlength);
      $inputStatus.toggleClass('negative', valLen > 0.95 * maxlength);
    }
  }
});


/*!
 * project name: SlideStudio
 * name:         resizer.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/28
 */

'use strict';

SL('components').Resizer = Class.extend({
  /**
   * Constructor SL.components.Resizer Instance
   *
   * @function
   * @param domElement
   * @param options
   */
  init: function (domElement, options) {
    this.$domElement    = $(domElement);
    this.$revealElement = this.$domElement.closest('.reveal');

    this.options = $.extend({
      padding:             10,
      preserveAspectRatio: false,
      useOverlay:          false
    }, options);

    this.mouse      = {x: 0, y: 0};
    this.mouseStart = {x: 0, y: 0};
    this.origin     = {
      x:     0, y:      0,
      width: 0, height: 0
    };
    this.resizing = false;

    if (this.$domElement.length) {
      this.onAnchorMouseDown   = this.onAnchorMouseDown.bind(this);
      this.onDocumentMouseMove = this.onDocumentMouseMove.bind(this);
      this.onDocumentMouseUp   = this.onDocumentMouseUp.bind(this);
      this.onElementDrop       = this.onElementDrop.bind(this);
      this.layout              = this.layout.bind(this);

      this.build();
      this.bind();
      this.layout();
    } else {
      console.warn('Resizer: invalid resize target.');
    }
  },

  /**
   * @function
   */
  build: function () {
    if (this.options.useOverlay) {
      this.$overlay = $('<div class="editing-ui resizer-overlay"></div>')
        .appendTo(document.body).hide();
    }

    this.$anchorN =
      $('<div class="editing-ui resizer-anchor" data-direction="n"></div>')
        .appendTo(document.body);
    this.$anchorE =
      $('<div class="editing-ui resizer-anchor" data-direction="e"></div>')
        .appendTo(document.body);
    this.$anchorS =
      $('<div class="editing-ui resizer-anchor" data-direction="s"></div>')
        .appendTo(document.body);
    this.$anchorW =
      $('<div class="editing-ui resizer-anchor" data-direction="w"></div>')
        .appendTo(document.body);
  },

  /**
   * @function
   */
  bind: function () {
    this.resizeStarted = new window.signals.Signal();
    this.resizeUpdated = new window.signals.Signal();
    this.resizeEnded   = new window.signals.Signal();

    this.getAnchors().on('mousedown', this.onAnchorMouseDown);
    this.$revealElement.on('drop', this.onElementDrop);

    $(document).on('keyup', this.layout);
    $(document).on('mouseup', this.layout);
    $(document).on('mousewheel', this.layout);
    $(document).on('DOMMouseScroll', this.layout);
    $(window).on('resize', this.layout);
  },

  /**
   * @function
   */
  layout: function () {
    if (!this.destroyIfDetached()) {
      var offset     = SL.util.getRevealElementGlobalOffset(this.$domElement),
        scale        = window.Reveal.getScale(),
        marginR      = parseInt(this.$domElement.css('margin-right'), 10),
        marginBottom = parseInt(this.$domElement.css('margin-bottom'), 10),
        left         = offset.x - this.options.padding,
        top          = offset.y - this.options.padding,
        width =
          (this.$domElement.width() + marginR) * scale +
          2 * this.options.padding,
        height =
          (this.$domElement.height() + marginBottom) * scale +
          2 * this.options.padding,
        centerX = -this.$anchorN.outerWidth() / 2;

      this.$anchorN.css({
        left: left + width / 2 + centerX,
        top:  top + centerX
      });
      this.$anchorE.css({
        left: left + width + centerX,
        top:  top + height / 2 + centerX
      });
      this.$anchorS.css({
        left: left + width / 2 + centerX,
        top:  top + height + centerX
      });
      this.$anchorW.css({
        left: left + centerX,
        top:  top + height / 2 + centerX
      });

      if (this.overlay) {
        this.overlay.css({
          left:  left, top: top,
          width: width, height: height
        });
      }
    }
  },

  /**
   * @function
   */
  show: function () {
    this.getAnchors().addClass('visible');
    this.layout();
  },

  /**
   * @function
   */
  hide: function () {
    this.getAnchors().removeClass('visible');
  },

  /**
   * @function
   * @returns {boolean}
   */
  destroyIfDetached: function () {
    if (this.$domElement.closest('body').length === 0) {
      this.destroy();
      return true;
    } else {
      return false;
    }
  },

  /**
   * @function
   * @returns {*}
   */
  getOptions: function () {
    return this.options;
  },

  /**
   * @function
   * @returns {*}
   */
  getAnchors: function () {
    return this.$anchorN.add(this.$anchorE).add(this.$anchorS).add(this.$anchorW);
  },

  /**
   * @function
   * @returns {boolean}
   */
  isResizing: function () {
    return !!this.resizing;
  },

  /**
   * @function
   * @returns {boolean}
   */
  isDestroyed: function () {
    return !!this.destroyed;
  },

  /**
   * @function
   * @param {Event} evt
   */
  onAnchorMouseDown: function (evt) {
    var direction = $(evt.target).attr('data-direction');

    if (direction) {
      evt.preventDefault();

      this.resizeDirection = direction;
      this.mouseStart.x    = evt.clientX;
      this.mouseStart.y    = evt.clientY;

      var offset = SL.util.getRevealElementOffset(this.$domElement);

      this.origin.x      = offset.x;
      this.origin.y      = offset.y;
      this.origin.width  = this.$domElement.width();
      this.origin.height = this.$domElement.height();

      if (this.overlay) {
        this.overlay.show();
      }

      this.resizing = true;

      $(document).on('mousemove', this.onDocumentMouseMove);
      $(document).on('mouseup', this.onDocumentMouseUp);

      this.resizeStarted.dispatch();
    }
  },

  /**
   * @function
   * @param {Event} evt
   */
  onDocumentMouseMove: function (evt) {
    this.mouse.x = evt.clientX;
    this.mouse.y = evt.clientY;

    if (!this.destroyIfDetached() && this.resizing) {
      var scale = window.Reveal.getScale(),
        offsetX = (this.mouse.x - this.mouseStart.x) / scale,
        offsetY = (this.mouse.y - this.mouseStart.y) / scale,
        width   = '', height = '';

      switch (this.resizeDirection) {
        case 'e':
          width = Math.max(this.origin.width + offsetX, 1);
          break;
        case 'w':
          width = Math.max(this.origin.width - offsetX, 1);
          break;
        case 's':
          height = Math.max(this.origin.height + offsetY, 1);
          break;
        case 'n':
          height = Math.max(this.origin.height - offsetY, 1);
          break;
      }

      if (this.options.preserveAspectRatio) {
        if (width === '') {
          width = this.origin.width * (height / this.origin.height);
        }

        if (height === '') {
          height = this.origin.height * (width / this.origin.width);
        }
      } else {
        if (width === '') {
          width = this.$domElement.css('width');
        }

        if (height === '') {
          height = this.$domElement.css('height');
        }
      }

      if (this.$domElement.css('position') === 'absolute' &&
        (this.resizeDirection === 'n' || this.resizeDirection === 'w')) {
        switch (this.resizeDirection) {
          case 'w':
            this.$domElement.css('left', Math.round(this.origin.x + offsetX));
            break;
          case 'n':
            this.$domElement.css('top', Math.round(this.origin.y + offsetY));
        }
      }

      this.$domElement.css({
        width:     width ? width : '',
        height:    height ? height : '',
        maxHeight: 'none',
        maxWidth:  'none'
      });

      this.layout();
      this.resizeUpdated.dispatch();
    }
  },

  /**
   * @function
   */
  onDocumentMouseUp: function () {
    this.resizing = false;

    $(document).off('mousemove', this.onDocumentMouseMove);
    $(document).off('mouseup', this.onDocumentMouseUp);

    if (this.overlay) {
      this.overlay.hide();
    }

    this.resizeEnded.dispatch();
  },

  /**
   * @function
   */
  onElementDrop: function () {
    setTimeout(this.layout, 1);
  },

  /**
   * @function
   */
  destroy: function () {
    if (!this.destroyed) {
      this.destroyed = true;

      this.resizeStarted.dispose();
      this.resizeUpdated.dispose();
      this.resizeEnded.dispose();

      $(document).off('mousemove', this.onDocumentMouseMove);
      $(document).off('mouseup', this.onDocumentMouseUp);
      $(document).off('keyup', this.layout);
      $(document).off('mouseup', this.layout);
      $(document).off('mousewheel', this.layout);
      $(document).off('DOMMouseScroll', this.layout);

      $(window).off('resize', this.layout);

      this.$revealElement.off('drop', this.onElementDrop);

      this.getAnchors().off('mousedown', this.onAnchorMouseDown);

      this.$anchorN.remove();
      this.$anchorE.remove();
      this.$anchorS.remove();
      this.$anchorW.remove();

      if (this.overlay) {
        this.overlay.remove();
      }
    }
  }
});

SL.components.Resizer.delegateOnHover = function (element, selector, resizerOpts) {
  var updated = new window.signals.Signal(),
    $element = null, resizer = null;

  function show($target, resizeOpt) {
    if (resizer && resizer.isResizing()) {
      return false;
    }

    if (resizer && $element && $element.is($target)) {
      destroy();
    }

    if (!resizer) {
      var options = {};

      $.extend(options, selector);
      $.extend(options, resizeOpt);

      $element = $($target);

      resizer = new SL.components.Resizer($element, options);
      resizer.resizeUpdated(resize);
      resizer.show();

      $(document).on('mousemove', documentMouseMove);
      $(document).on('mouseup', documentMouseUp);
    }
  }

  function destroy() {
    if (resizer) {
      resizer.destroy();
      resizer = null;

      $(document).off('mousemove', documentMouseMove);
      $(document).off('mouseup', documentMouseUp);
    }
  }

  function resize() {
    updated.dispatch($element);
  }

  function documentMouseMove(evt) {
    if (resizer) {
      if (resizer.isDestroyed()) {
        destroy();
      } else if (!resizer.isResizing()) {
        var scale  = window.Reveal.getScale(),
          offset   = SL.util.getRevealElementGlobalOffset($element),
          padding  = 3 * resizer.getOptions().padding,
          position = {
            top: offset.y - padding,
            left: offset.x - padding,
            right: offset.x + $element.outerWidth(true) * scale + padding,
            bottom: offset.y + $element.outerHeight(true) * scale + padding
          };

        if (evt.clientX < position.left || evt.clientX > position.right ||
          evt.clientY < position.top || evt.clientY > position.bottom) {
          destroy();
        }
      }
    }
  }

  function documentMouseUp(evt) {
    setTimeout(function () {
      documentMouseMove(evt);
    }, 1);
  }

  function mouseOver(evt) {
    var $target = $(evt.currentTarget);

    resizerOpts = null;

    if ($target.data('resizer-options')) {
      resizerOpts = $target.data('resizer-options');
    }

    if ($target.data('target-element')) {
      selector = $target.data('target-element');
    }

    show($target, resizerOpts);
  }

  element.delegate(selector, 'mouseover', mouseOver);

  return {
    show: show,
    updated: updated,
    layout: function () {
      if (!!resizer) {
        resizer.layout();
      }
    },
    destroy: function () {}
  };
};


/*!
 * project name: SlideStudio
 * name:         scrollshadow.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/28
 */

'use strict';

SL('components').ScrollShadow  = Class.extend({
  /**
   * Constructor SL.components.ScrollShadow Instance
   *
   * @function
   * @param {Object} options
   */
  init: function (options) {
    this.options = $.extend({
      threshold:     20,
      shadowSize:    10,
      resizeContent: true
    }, options);

    this.bind();
    this.render();
    this.layout();
  },

  /**
   * @function
   */
  bind: function () {
    this.layout = this.layout.bind(this);
    this.sync   = this.sync.bind(this);

    $(window).on('resize', this.layout);
    this.options.$contentElement.on('scroll', this.sync);
  },

  /**
   * @function
   */
  render: function () {
    this.$shadowTop = $('<div class="sl-scroll-shadow-top">')
      .appendTo(this.options.$parentElement);
    this.$shadowBottom = $('<div class="sl-scroll-shadow-bottom">')
      .appendTo(this.options.$parentElement);

    this.$shadowTop.height(this.options.shadowSize);
    this.$shadowBottom.height(this.options.shadowSize);
  },

  /**
   * @function
   */
  layout: function () {
    var pHeight = this.options.$parentElement.height(),
      fOuterH = 0, hOuterH = 0;

    if (this.options.$footerElement) {
      fOuterH = this.options.$footerElement.outerHeight();
    }

    if (this.options.$headerElement) {
      hOuterH = this.options.$headerElement.outerHeight();
    }

    if (this.options.resizeContent &&
      this.options.$footerElement ||
      this.options.$headerElement) {
      this.options.$contentElement.css('height', pHeight - fOuterH - hOuterH);
    }

    this.sync();
  },

  /**
   * @function
   */
  sync: function () {
    var fOuterH = 0, hOuterH = 0,
      scrollTop    = this.options.$contentElement.scrollTop(),
      scrollHeight = this.options.$contentElement.prop('scrollHeight'),
      outerHeight  = this.options.$contentElement.outerHeight(),
      threshold    = scrollHeight > outerHeight + this.options.threshold,
      opacity      = scrollTop / (scrollHeight - outerHeight);

    if (this.options.$footerElement) {
      fOuterH = this.options.$footerElement.outerHeight();
    }

    if (this.options.$headerElement) {
      hOuterH = this.options.$headerElement.outerHeight();
    }

    this.$shadowTop.css({
      opacity: threshold ? opacity : 0,
      top:     hOuterH
    });
    this.$shadowBottom.css({
      opacity: threshold ? 1 - opacity : 0,
      bottom:  fOuterH
    });
  },

  /**
   * @function
   */
  destroy: function () {
    $(window).off('resize', this.layout);

    this.options.$contentElement.off('scroll', this.sync);

    this.options = null;
  }
});


/*!
 * project name: SlideStudio
 * name:         search.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/28
 */

'use strict';

SL('components').Search        = Class.extend({
  /**
   * Constructor SL.components.Search Instance
   *
   * @function
   * @param {Object} config
   */
  init: function (config) {
    this.config = config;

    this.$searchForm           = $('.search .search-form');
    this.$searchFormInput      = this.$searchForm.find('.search-term');
    this.$searchFormSubmit     = this.$searchForm.find('.search-submit');
    this.$searchResults        = $('.search .search-results');
    this.$searchResultsHeader  = this.$searchResults.find('header');
    this.$searchResultsTitle   = this.$searchResults.find('.search-results-title');
    this.$searchResultsSorting = this.$searchResults.find('.search-results-sorting');
    this.$searchResultsList    = this.$searchResults.find('ul');

    this.searchFormLoader = window.Ladda.create(this.$searchFormSubmit.get(0));

    this.bind();
    this.checkQuery();
  },

  /**
   * @function
   */
  bind: function () {
    this.$searchForm.on('submit', this.onSearchFormSubmit.bind(this));
    this.$searchResultsSorting.find('input[type=radio]')
      .on('click', this.onSearchSortingChange.bind(this));
  },

  /**
   * @function
   */
  checkQuery: function () {
    var query = SL.util.getQuery();

    if (query.search && !this.$searchFormInput.val()) {
      this.$searchFormInput.val(query.search);

      if (query.page) {
        this.search(query.search, parseInt(query.page, 10));
      } else {
        this.search(query.search);
      }
    }
  },

  /**
   * @function
   * @param {Object} data
   */
  renderSearchResults: function (data) {
    $('.search').removeClass('empty');

    this.$searchResults.show();
    this.$searchResultsList.empty();

    this.renderSearchPagination(data);

    if (data.results && data.results.length) {
      this.$searchResultsTitle.text(data.total + ' ' +
        SL.util.string.pluralize('result', 's', data.total > 1) +
        ' for "' + this.searchTerm + '"');

      for (var i = 0; i < data.results.length; i += 1) {
        this.$searchResultsList
          .append(SL.util.html.createDeckThumbnail(data.results[i]));
      }
    } else {
      this.$searchResultsTitle.text(
        data.error || SL.locale.get('Search.no_result_for', {term: this.searchTerm}));
    }
  },

  /**
   * @function
   * @param {Object} data
   */
  renderSearchPagination: function (data) {
    if (this.$searchPagination) {
      this.$searchPagination.remove();
    }

    if (typeof data.decks_per_page === "undefined") {
      data.decks_per_page = 8;
    }

    var pageNum = Math.ceil(data.total / data.decks_per_page);

    if (pageNum > 1) {
      this.$searchPagination =
        $('<div class="search-results-pagination"></div>')
          .appendTo(this.$searchResultsHeader);

      this.$searchPagination.append([
        '<span class="page">',
          SL.locale.get('Search.page') + ' ' +
          this.searchPage + '/' + pageNum,
        '</span>'].join(''));

      if (this.searchPage > 1) {
        this.$searchPagination.append([
          '<button class="button outline previous">',
            SL.locale.get('Previous'),
          '</button>'].join(''));
      }

      this.$searchPagination.append([
        '<button class="button outline next">',
          SL.locale.get('Next'),
        '</button>'].join(''));

      this.$searchPagination.find('button.previous')
        .on('click', (function () {
          this.search(this.searchTerm, Math.max(this.searchPage - 1, 1));
        }).bind(this));

      this.$searchPagination.find('button.next')
        .on('click', (function () {
          this.search(this.searchTerm, Math.min(this.searchPage + 1, pageNum));
        }).bind(this));
    }
  },

  /**
   * @function
   * @param {String} searchStr
   * @param {String} page
   * @param {String} sort
   */
  search: function (searchStr, page, sort) {
    this.searchTerm = searchStr || this.$searchFormInput.val();
    this.searchPage = page || 1;
    this.searchSort = sort || this.searchSort;

    if (window.history &&
      typeof window.history.replaceState === "function") {
      var url = '?search=' + window.escape(this.searchTerm);

      if (page > 1) {
        url += '&page=' + page;
      }

      window.history.replaceState(null, null, '/explore' + url);
    }

    if (!this.searchSort) {
      this.searchSort = this.$searchResultsSorting
        .find('input[type=radio]:checked').val();
    }

    this.$searchResultsSorting.find('input[type=radio]').prop('checked', false);

    this.$searchResultsSorting
      .find('input[type=radio][value=' + this.searchSort + ']')
      .prop('checked', true);

    if (this.searchTerm) {
      this.searchFormLoader.start();

      $.ajax({
        type:   'GET',
        url:     this.config.url,
        context: this,
        data: {
          q:    this.searchTerm,
          page: this.searchPage,
          sort: this.searchSort
        }
      }).done(function (data) {
        this.renderSearchResults(data);
      }).fail(function () {
        this.renderSearchResults({
          error: SL.locale.get('Search.server_err')
        });
      }).always(function () {
        this.searchFormLoader.stop();
      });
    } else {
      SL.notify(SL.locale.get('Search.no_team_err'));
    }
  },

  /**
   * @function
   * @param {boolean} isSort
   */
  sort: function (isSort) {
    this.search(this.searchTerm, this.searchPage, isSort);
  },

  /**
   * @function
   * @param {Event} evt
   */
  onSearchFormSubmit: function (evt) {
    this.search();

    evt.preventDefault();
    return false;
  },

  /**
   * @function
   */
  onSearchSortingChange: function () {
    this.sort(
      this.$searchResultsSorting.find('input[type=radio]:checked').val());
  }
});


/*!
 * project name: SlideStudio
 * name:         templatespage.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/28
 */

'use strict';

SL('components').TemplatesPage = Class.extend({
  /**
   * Constructor SL.components.TemplatesPage Instance
   *
   * @function
   * @param {Object} options
   */
  init: function (options) {
    this.options          = options || {};
    this.templateSelected = new window.signals.Signal();

    this.render();
  },

  /**
   * @function
   */
  render: function () {
    this.$domElement  = $('<div class="page" data-page-id="' + this.options.id + '">');
    this.$bodyElement = $('<div class="page-body">').appendTo(this.$domElement);

    if (this.isEditable()) {
      this.$domElement.addClass('has-footer');
      this.$footerElement = $('<div class="page-footer">').appendTo(this.$domElement);

      this.$addTemplateButton = $([
        '<div class="add-new-template ladda-button" data-style="zoom-out" ' +
          'data-spinner-color="#222" data-spinner-size="32">',
          '<span class="icon i-plus"></span>',
          '<span>',
            SL.locale.get('Template_Page.btn_save'),
          '</span>',
        '</div>'].join(''));

      this.$addTemplateButton.appendTo(this.$footerElement);
      this.$addTemplateButton.on('click', this.onTemplateCreateClicked.bind(this));

      this.addTemplateButtonLoader = window.Ladda.create(this.$addTemplateButton.get(0));
    }

    this.options.templates.forEach(this.renderTemplate.bind(this));
  },

  /**
   * @function
   * @param {*|jQuery|HTMLElement} template
   * @param {Object}               temOption
   */
  renderTemplate: function (template, temOption) {
    temOption = $.extend({repend: false}, temOption);

    var $item = $('<div class="template-item">');
    $item.html([
      '<div class="template-item-thumb themed">',
        '<div class="template-item-thumb-content reveal reveal-thumbnail">',
          '<div class="slides">',
            template.get('html'),
          '</div>',
          '<div class="backgrounds"></div>',
        '</div>',
      '</div>'].join(''));
    $item.data('template-model', template);
    $item.on('vclick', this.onTemplateSelected.bind(this, $item));

    if (template.get('label')) {
      $item.append([
        '<span class="template-item-label">',
          template.get('label'),
        '</span>'].join(''));
    }

    if (temOption.replaceTemplateAt) {
      this.$bodyElement.find('.template-item')
        .eq(temOption.replaceTemplateAt).replaceWith($item);
    } else if (temOption.prepend) {
      this.$bodyElement.prepend($item);
    } else {
      this.$bodyElement.append($item);
    }

    var color = $item.find('section').attr('data-background-color'),
      image   = $item.find('section').attr('data-background-image'),
      size    = $item.find('section').attr('data-background-size'),
      $background =
        $('<div class="slide-background present template-item-thumb-background">');

    $background.addClass($item.find('.template-item-thumb .reveal section').attr('class'));
    $background.appendTo($item.find('.template-item-thumb .reveal>.backgrounds'));

    if (color || image) {
      if (color) {
        $background.css('background-color', color);
      }

      if (image) {
        $background.css('background-image', 'url("' + image + '")');
      }

      if (size) {
        $background.css('background-size', size);
      }
    }

    if (this.isEditable()) {
      var $options = $('<div class="template-item-options"></div>').appendTo($item),
        $option    = $([
          '<div class="option">',
            '<span class="icon i-trash-stroke"></span>',
          '</div>'].join(''));

      $option.attr('data-tooltip', SL.locale.get('Template_Page.btn_del_tip'));
      $option.on('vclick', this.onTemplateDeleteClicked.bind(this, $item));
      $option.appendTo($options);

      if (this.isTeamTemplates() && SL.current_user.getThemes().size() > 1) {
        $([
          '<div class="option">',
            '<span class="icon i-ellipsis-v"></span>',
          '</div>'].join(''))
          .attr('data-tooltip', SL.locale.get('Template_Page.btn_team_del_tip'))
          .on('vclick', this.onTemplateThemeClicked.bind(this, $item))
          .appendTo($options);
      }
    }
  },

  /**
   * @function
   */
  refresh: function () {
    if (this.isDefaultTemplates()) {
      var dupIndex = SL.data.templates.DEFAULT_TEMPLATES_DUPLICATE_INDEX,
        template   = this.options.templates.at(dupIndex);

      if (template) {
        template.set('html',
          SL.data.templates.templatize(window.Reveal.getCurrentSlide()));

        this.renderTemplate(template, {
          replaceTemplateAt: dupIndex
        });
      }
    }

    this.$bodyElement.find('.placeholder').remove();

    var currentTheme = SL.view.getCurrentTheme(),
      $tItem         = this.$bodyElement.find('.template-item');

    if (this.isTeamTemplates()) {
      $tItem.each((function (index, item) {
        item = $(item);

        var classStr  = '',
          isAvailable =
            item.data('template-model').isAvailableForTheme(currentTheme);

        if (SL.current_user.isEnterpriseManager()) {
          classStr = 'semi-hidden';
        } else {
          classStr = 'hidden';
        }

        item.toggleClass(classStr, !isAvailable);
      }).bind(this));
    }

    $tItem = this.$bodyElement.find('.template-item:not(.hidden)');

    if ($tItem.length) {
      $tItem.each((function (index, item) {
        item = $(item);

        var $thumb = item.find('.template-item-thumb');

        $thumb.attr('class',
          $thumb.attr('class').replace(/theme\-(font|color)\-([a-z0-9-])*/gi, ''));
        $thumb.addClass('theme-font-' + currentTheme.get('font'));
        $thumb.addClass('theme-color-' + currentTheme.get('color'));

        $thumb.find('.template-item-thumb-content img[data-src]').each(function () {
          this.setAttribute('src', this.getAttribute('data-src'));
          this.removeAttribute('data-src');
        });

        SL.data.templates.layoutTemplate($thumb.find('section'), true);
      }).bind(this));

      this.$bodyElement.find('.placeholder').remove();
    } else {
      var str = SL.locale.get('Template_Page.content_tip');

      if (this.isTeamTemplates()) {
        if (SL.current_user.isEnterpriseManager()) {
          str = SL.locale.get('Template_Page.content_enter_tip');
        } else {
          str = SL.locale.get('Template_Page.content_team_tip');
        }
      }

      this.$bodyElement.append([
        '<p class="placeholder">',
          str,
        '</p>'].join(''));
    }
  },

  /**
   * @function
   * @param {*|jQuery|HTMLElement} parent
   */
  appendTo: function (parent) {
    this.$domElement.appendTo(parent);
  },

  /**
   * @function
   */
  isEditable: function () {
    return this.isUserTemplates() || this.isTeamTemplates() && SL.current_user.isEnterpriseManager();
  },

  /**
   * @function
   * @returns {boolean}
   */
  isDefaultTemplates: function () {
    return this.options.id === 'default';
  },

  /**
   * @function
   * @returns {boolean}
   */
  isUserTemplates: function () {
    return this.options.id === 'user';
  },

  /**
   * @function
   * @returns {boolean}
   */
  isTeamTemplates: function () {
    return this.options.id === 'team';
  },

  /**
   * @function
   * @param {*|jQuery|HTMLElement} template
   * @param {Event}                evt
   */
  onTemplateSelected: function (template, evt) {
    evt.preventDefault();
    this.templateSelected.dispatch(template.data('template-model'));
  },

  /**
   * @function
   * @param {*|jQuery|HTMLElement} template
   * @param {Event}                evt
   */
  onTemplateDeleteClicked: function (template, evt) {
    evt.preventDefault();

    SL.prompt({
      anchor: $(evt.currentTarget),
      title: SL.locale.get('Template_Page.del_confirm'),
      type: 'select',
      hoverTarget: template,
      data: [{
        html: '<h3>' + SL.locale.get('Cancel') + '</h3>'
      }, {
        html: '<h3>' + SL.locale.get('Delete') + '</h3>',
        selected: true,
        className: 'negative',
        callback: (function () {
          var model = template.data('template-model'),
            url = SL.config.AJAX_SLIDE_TEMPLATES_DELETE(model.get('id'));

          if (this.isTeamTemplates()) {
            url = SL.config.AJAX_TEAM_SLIDE_TEMPLATES_DELETE(model.get('id'));
          }

          $.ajax({
            type:   'DELETE',
            url:     url,
            context: this
          }).done(function () {
            template.remove();
            this.refresh();
          });
        }).bind(this)
      }]
    });

    return false;
  },

  /**
   * @function
   * @param {*|jQuery|HTMLElement} template
   * @param {Event}                evt
   */
  onTemplateThemeClicked: function (template, evt) {
    evt.preventDefault();

    var themes = SL.current_user.getThemes();

    if (themes.size() > 0) {
      var model = template.data('template-model'),
        id = model.get('id'),
        isAvailable = model.isAvailableForAllThemes(),
        data = [{
          value:     'All themes',
          selected:   isAvailable,
          exclusive:  true,
          className: 'header-item',
          callback: (function () {
            themes.forEach((function (theme) {
              if (theme.hasSlideTemplate(id)) {
                theme.removeSlideTemplate([id]).fail(this.onGenericError);
              }
            }).bind(this));

            this.refresh();
          }).bind(this)
        }];

      themes.forEach((function (theme) {
        data.push({
          value: theme.get('name'),
          selected: isAvailable ? false : model.isAvailableForTheme(theme),
          callback: (function (val, selected) {
            if (selected) {
              theme.addSlideTemplate([id]).fail(this.onGenericError);
            } else {
              theme.removeSlideTemplate([id]).fail(this.onGenericError);
            }

            this.refresh();
          }).bind(this)
        });
      }).bind(this));

      SL.prompt({
        anchor:     $(evt.currentTarget),
        title:      'Available for...',
        type:       'list',
        alignment:  'l',
        data:        data,
        multiselect: true,
        optional:    true,
        hoverTarget: template
      });
    }

    return false;
  },

  /**
   * @function
   * @returns {boolean}
   */
  onTemplateCreateClicked: function () {
    var url = SL.config.AJAX_SLIDE_TEMPLATES_CREATE;

    if (this.isTeamTemplates()) {
      url = SL.config.AJAX_TEAM_SLIDE_TEMPLATES_CREATE;
    }

    this.addTemplateButtonLoader.start();

    var html =
      SL.data.templates.templatize(window.Reveal.getCurrentSlide());

    $.ajax({
      type: 'POST',
      url: url,
      context: this,
      data: {
        slide_template: {
          html: html
        }
      }
    }).done(function (data) {
      var templates = this.options.templates.create(data, {
        prepend: true
      });

      this.renderTemplate(templates, {
        prepend: true
      });

      this.refresh();
      this.addTemplateButtonLoader.stop();

      var str = '';

      if (this.isTeamTemplates()) {
        str = 'Saved team template';
      } else {
        str = 'Saved user template';
      }

      SL.analytics.trackEditor(str);
    }).fail(function () {
      this.addTemplateButtonLoader.stop();
      SL.notify(SL.locale.get('Template_Page.create_err'), 'negative');
    });

    return false;
  },

  /**
   * @function
   */
  onGenericError: function () {
    SL.notify(SL.locale.get('Generic_Error'), 'negative');
  }
});


/*!
 * project name: SlideStudio
 * name:         templates.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/28
 */

'use strict';

SL('components').Templates = Class.extend({
  /**
   * Constructor SL.components.Templates Instance
   *
   * @function
   * @param {Object} options
   */
  init: function (options) {
    this.options = $.extend({
      alignment: '',
      width:     450,
      height:    730,
      arrowSize: 8
    }, options);

    this.pages = [];

    SL.data.templates.getUserTemplates();
    SL.data.templates.getTeamTemplates();

    this.render();
    this.bind();
  },

  /**
   * @function
   */
  render: function () {
    this.$domElement    = $('<div class="sl-templates">');
    this.$innerElement  = $('<div class="sl-templates-inner">')
      .appendTo(this.$domElement);
    this.$headerElement = $('<div class="sl-templates-header">')
      .appendTo(this.$innerElement);
    this.$bodyElement   = $('<div class="sl-templates-body">')
      .appendTo(this.$innerElement);
    this.$domElement.data('instance', this);
  },

  /**
   * @function
   */
  renderTemplates: function () {
    this.pages = [];
    this.$headerElement.empty();
    this.$bodyElement.empty();

    this.renderPage('default', '默认',
      SL.data.templates.getDefaultTemplates());

    SL.data.templates.getUserTemplates((function (templates) {
      this.renderPage('user', '自定义', templates);
    }).bind(this));

    SL.data.templates.getTeamTemplates((function (templates) {
      if (SL.current_user.isEnterpriseManager() || !templates.isEmpty()) {
        this.renderPage('team', 'Team', templates);
      }
    }).bind(this));
  },

  /**
   * @function
   * @param {String|Number|*} id
   * @param {String}          name
   * @param {Array}           templates
   */
  renderPage: function (id, name, templates) {
    var $pageTab = $([
      '<div class="page-tab" data-page-id="' + id + '">',
        name,
      '</div>'].join('')).appendTo(this.$headerElement);

    $pageTab.on('vclick', (function () {
      this.showPage(id);
      SL.analytics.trackEditor('Slide templates tab clicked', id);
    }).bind(this));

    var templatesPage = new SL.components.TemplatesPage({
      id:        id,
      templates: templates
    });

    templatesPage.templateSelected.add(this.onTemplateSelected.bind(this));
    templatesPage.appendTo(this.$bodyElement);

    this.pages.push(templatesPage);
    this.$domElement.attr('data-pages-total', this.pages.length);
    this.showPage('default');
  },

  /**
   * @function
   * @param {String|Number|*} id
   */
  showPage: function (id) {
    this.$bodyElement.find('.page').removeClass('past present future');
    this.$bodyElement.find('.page[data-page-id="' + id + '"]').addClass('present');
    this.$bodyElement.find('.page[data-page-id="' + id + '"]').prevAll().addClass('past');
    this.$bodyElement.find('.page[data-page-id="' + id + '"]').nextAll().addClass('future');
    this.$headerElement.find('.page-tab').removeClass('selected');
    this.$headerElement.find('.page-tab[data-page-id="' + id + '"]').addClass('selected');
  },

  /**
   * @function
   */
  refreshPages: function () {
    this.pages.forEach(function (page) {
      page.refresh();
    });
  },

  /**
   * @function
   */
  bind: function () {
    this.layout = this.layout.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onClicked = this.onClicked.bind(this);

    this.$domElement.on('vclick', this.onClicked);
  },

  /**
   * @function
   */
  layout: function () {
    var border = 10,
      outerWidth  = this.$domElement.outerWidth(),
      outerHeight = this.$domElement.outerHeight(),
      width       = this.options.width,
      height      = this.options.height, margin = {};

    width  = Math.min(width, outerHeight - 2 * border);
    height = Math.min(height, outerHeight - 2 * border);

    if (this.options.anchor) {
      margin.left   = this.options.anchor.offset().left;
      margin.top    = this.options.anchor.offset().top;
      margin.width  = this.options.anchor.outerWidth();
      margin.height = this.options.anchor.outerHeight();
      margin.right  = margin.left + margin.width;
      margin.bottom = margin.top + margin.height;
    }

    var left = 0, top = 0;

    if (this.options.anchor && this.options.alignment === 'r') {
      width = Math.min(width, margin.left - 2 * border);
      left  = margin.left - width - this.options.arrowSize - border;
      top   = margin.top + margin.height / 2 - height / 2;
    } else if (this.options.anchor && this.options.alignment === 'b') {
      height = Math.min(height, margin.top - 2 * border);
      left   = margin.left + margin.width / 2 - width / 2;
      top    = margin.top - height - this.options.arrowSize - border;
    } else if (this.options.anchor && this.options.alignment === 'l') {
      width = Math.min(width, outerWidth - margin.right - 2 * border);
      left  = margin.right + this.options.arrowSize + border;
      top   = margin.top + margin.height / 2 - height / 2;
    } else {
      left = (outerWidth - width) / 2;
      top  = (outerHeight - height) / 2;
    }

    this.$innerElement.css({
      width:  width,
      height: height,
      left:   left,
      top:    top
    });
  },

  /**
   * @function
   * @param {Object} options
   */
  show: function (options) {
    this.options = $.extend(this.options, options);

    if (this.pages.length === 0) {
      this.renderTemplates();
    }

    this.$domElement.attr('data-alignment', this.options.alignment);
    this.$domElement.appendTo(document.body);

    $(window).on('resize', this.layout);

    SL.keyboard.keyDown(this.onKeyDown);

    this.refreshPages();
    this.layout();
  },

  /**
   * @function
   */
  hide: function () {
    this.$domElement.detach();
    $(window).off('resize', this.layout);
    SL.keyboard.release(this.onKeyDown);
  },

  /**
   * @function
   * @param {Object} template
   */
  onTemplateSelected: function (template) {
    if (this.options.callback) {
      this.hide();
      this.options.callback(template.get('html'));
    }
  },

  /**
   * @function
   * @param {Event} evt
   */
  onKeyDown: function (evt) {
    if (evt.keyCode === 27) {
      this.hide();
      return false;
    }

    return true;
  },

  /**
   * @function
   * @param {Event} evt
   */
  onClicked: function (evt) {
    if ($(evt.target).is(this.$domElement)) {
      evt.preventDefault();
      this.hide();
    }
  },

  /**
   * @function
   */
  destroy: function () {
    $(window).off('resize', this.layout);
    SL.keyboard.release(this.onKeyDown);

    this.$domElement.remove();
  }
});


/*!
 * project name: SlideStudio
 * name:         texteditor.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/28
 */

'use strict';

SL('components').TextEditor = Class.extend({
  /**
   * Constructor SL.components.TextEditor Instance
   *
   * @function
   * @param {Object} options
   */
  init: function (options) {
    this.options = $.extend({
      type:  '',
      value: ''
    }, options);

    this.saved    = new window.signals.Signal();
    this.canceled = new window.signals.Signal();

    this.render();
    this.bind();

    this.originalValue = this.options.value || '';

    if (typeof this.options.value === "string") {
      this.setValue(this.options.value);
    }

    if (!SL.editor.controllers.Capabilities.isTouchEditor()) {
      this.focusInput();
    }
  },

  /**
   * @function
   */
  render: function () {
    this.$domElement   =
      $('<div class="sl-text-editor">').appendTo(document.body);
    this.$innerElement =
      $('<div class="sl-text-editor-inner">').appendTo(this.$domElement);
    this.$domElement.attr('data-type', this.options.type);

    if (this.options.type === 'html') {
      this.renderHTMLInput();
    } else {
      this.renderTextInput();
    }

    this.$footerElement = $([
      '<div class="sl-text-editor-footer">',
        '<button class="button l outline white cancel-button">Cancel</button>',
        '<button class="button l positive save-button">Save</button>',
      '</div>'].join('')).appendTo(this.$innerElement);
    setTimeout((function () {
      this.$domElement.addClass('visible');
    }).bind(this), 1);
  },

  /**
   * @function
   */
  renderTextInput: function () {
    this.$inputElement =
      $('<textarea class="sl-text-editor-input">').appendTo(this.$innerElement);

    if (this.options.type === 'code') {
      this.$inputElement.tabby({tabString: '    '});
    }
  },

  /**
   * @function
   */
  renderHTMLInput: function () {
    this.$inputElement =
      $('<div class="editor sl-text-editor-input">')
        .appendTo(this.$innerElement);

    if (this.codeEditor && typeof this.codeEditor.destroy === "function") {
      this.codeEditor.destroy();
      this.codeEditor = null;
    }

    try {
      this.codeEditor = window.ace.edit(this.$inputElement.get(0));
      this.codeEditor.setTheme('ace/theme/monokai');
      this.codeEditor.setDisplayIndentGuides(true);
      this.codeEditor.setShowPrintMargin(false);
      this.codeEditor.getSession().setMode('ace/mode/html');
    } catch (err) {
      console.log('An error occurred while initializing the Ace editor.');
    }
  },

  /**
   * @function
   */
  bind: function () {
    this.$footerElement.find('.save-button').on('click', this.save.bind(this));
    this.$footerElement.find('.cancel-button').on('click', this.cancel.bind(this));

    this.onKeyDown = this.onKeyDown.bind(this);
    SL.keyboard.keyDown(this.onKeyDown);

    this.onBackgroundClicked = this.onBackgroundClicked.bind(this);
    this.$domElement.on('vclick', this.onBackgroundClicked);
  },

  /**
   * @function
   */
  save: function () {
    this.saved.dispatch(this.getValue());
    this.destroy();
  },

  /**
   * @function
   */
  cancel: function () {
    var orgVal = this.originalValue || '',
      val = this.getValue() || '';

    if (orgVal !== val) {
      if (!this.cancelPrompt) {
        this.cancelPrompt = SL.prompt({
          title: 'Discard unsaved changes?',
          type:  'select',
          data: [{
            html: '<h3>Cancel</h3>'
          }, {
            html: '<h3>Discard</h3>',
            selected: true,
            className: 'negative',
            callback: (function () {
              this.canceled.dispatch();
              this.destroy();
            }).bind(this)
          }]
        });

        this.cancelPrompt.destroyed.add((function () {
          this.cancelPrompt = null;
        }).bind(this));
      }
    } else {
      this.canceled.dispatch();
      this.destroy();
    }
  },

  /**
   * @function
   */
  focusInput: function () {
    if (this.codeEditor) {
      this.codeEditor.focus();
    } else {
      this.$inputElement.focus();
    }
  },

  /**
   * @function
   * @param {*|String|Object} val
   */
  setValue: function (val) {
    this.originalValue = val || '';

    if (this.codeEditor) {
      this.codeEditor.env.document.setValue(val);
    } else {
      this.$inputElement.val(val);
    }
  },

  /**
   * @function
   * @returns {*}
   */
  getValue: function () {
    if (this.codeEditor) {
      return this.codeEditor.env.document.getValue();
    } else {
      return this.$inputElement.val();
    }
  },

  /**
   * @function
   * @param {Event} evt
   */
  onBackgroundClicked: function (evt) {
    if ($(evt.target).is(this.$domElement)) {
      this.cancel();
      evt.preventDefault();
    }
  },

  /**
   * @function
   * @param {Event} evt
   */
  onKeyDown: function (evt) {
    if (evt.keyCode === 27) {
      this.cancel();
      return false;
    } else if ((evt.metaKey || evt.ctrlKey) && evt.keyCode === 83) {
      this.save();
      return false;
    }

    return true;
  },

  /**
   * @function
   */
  destroy: function () {
    this.saved.dispose();
    this.canceled.dispose();
    SL.keyboard.release(this.onKeyDown);
    this.$domElement.remove();
  }
});


/*!
 * project name: SlideStudio
 * name:         themeoptions.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/28
 */

'use strict';

SL('components').ThemeOptions = Class.extend({
  /**
   * Constructor SL.components.ThemeOptions Instance
   *
   * @function
   * @param {Object} config
   */
  init: function (config) {
    if (!config.container) {
      throw 'Cannot build theme options without container';
    }

    if (!config.model) {
      throw 'Cannot build theme options without model';
    }

    this.config = $.extend({
      center:                true,
      rollingLinks:          true,
      colors:                SL.config.THEME_COLORS,
      fonts:                 SL.config.THEME_FONTS,
      transitions:           SL.config.THEME_TRANSITIONS,
      backgroundTransitions: SL.config.THEME_BACKGROUND_TRANSITIONS
    }, config);

    this.theme   = config.model;
    this.changed = new window.signals.Signal();

    this.render();
    this.updateSelection();
    this.toggleDeprecatedOptions();
    this.scrollToTop();
  },

  /**
   * @function
   */
  render: function () {
    this.$domElement =
      $('<div class="sl-themeoptions">').appendTo(this.config.container);

    if (typeof this.config.className === "string") {
      this.$domElement.addClass(this.config.className);
    }

    if (this.config.themes) {
      this.renderThemes();
    }

    if (this.config.center || this.config.rollingLinks) {
      this.renderOptions();
    }

    if (this.config.colors) {
      this.renderColors();
    }

    if (this.config.fonts) {
      this.renderFonts();
    }

    if (this.config.transitions) {
      this.renderTransitions();
    }

    if (this.config.backgroundTransitions) {
      this.renderBackgroundTransitions();
    }
  },

  /**
   * @function
   */
  renderThemes: function () {
    if (this.config.themes && !this.config.themes.isEmpty()) {
      var $selector = $([
        '<div class="section selector theme">',
          '<h3>' + SL.locale.get('Theme_Opts.title') + '</h3>',
          '<ul></ul>',
        '</div>'].join('')).appendTo(this.$domElement),
        $ul = $selector.find('ul');

      $ul.append([
        '<li data-theme="" class="custom">',
          '<span class="thumb-icon icon i-equalizer"></span>',
          '<span class="thumb-label">',
            SL.locale.get('Theme_Opts.custom'),
          '</span>',
        '</li>'].join(''));

      this.config.themes.forEach(function (theme) {
        var $theme = $([
          '<li data-theme="' + theme.get('id') + '">',
            '<span class="thumb-label" title="' + theme.get('name') + '">',
              theme.get('name') +
            '</span>',
          '</li>'].join('')).appendTo($ul);

        if (theme.hasThumbnail()) {
          $theme.css(
            'background-image',
            'url("' + theme.get('thumbnail_url') + '")');
        }
      });

      this.$domElement.find('.theme li').on('vclick', this.onThemeClicked.bind(this));
    }
  },

  /**
   * @function
   */
  renderOptions: function () {
    var $section = $([
        '<div class="section options">',
          '<h3>Options</h3>',
        '</div>'].join('')).appendTo(this.$domElement),
      $options = $('<div class="options"></div>').appendTo($section);

    if (this.config.center) {
      $options.append([
        '<div class="unit sl-checkbox outline">' +
          '<input id="theme-center" value="center" type="checkbox">',
          '<label for="theme-center" ' + 'data-tooltip="' +
            SL.locale.get('Theme_Opts.opt_center_tip') + '" data-tooltip-maxwidth="220" ' +
            'data-tooltip-delay="500">',
            SL.locale.get('Theme_Opts.opt_center'),
          '</label>',
        '</div>'].join(''));
      $section.find('#theme-center').on('change', this.onOptionChanged.bind(this));
    }

    if (this.config.rollingLinks) {
      $options.append([
        '<div class="unit sl-checkbox outline">',
          '<input id="theme-rolling_links" value="rolling_links" type="checkbox">',
          '<label for="theme-rolling_links" data-tooltip="' +
            SL.locale.get('Theme_Opts.opt_roll_link') +
            '" data-tooltip-maxwidth="220" data-tooltip-delay="500">',
            SL.locale.get('Theme_Opts.opt_roll_link'),
          '</label>',
        '</div>'].join(''));
      $section.find('#theme-rolling_links').on('change', this.onOptionChanged.bind(this));
    }
  },

  /**
   * @function
   */
  renderColors: function () {
    var $section = $([
        '<div class="section selector color">',
          '<h3>' + SL.locale.get('Theme_Opts.clr_title') + '</h3>',
          '<ul></ul>',
        '</div>'].join('')).appendTo(this.$domElement),
      $ul = $section.find('ul');

    this.config.colors.forEach((function (clr) {
      var $color = $([
        '<li data-color="' + clr.id + '">',
          '<div class="theme-body-color-block"></div>',
          '<div class="theme-link-color-block"></div>',
        '</li>'].join(''));

      $color.addClass('theme-color-' + clr.id);
      $color.addClass('themed');
      $color.appendTo($ul);

      if (clr.tooltip) {
        $color.attr({
          'data-tooltip':          clr.tooltip,
          'data-tooltip-delay':    250,
          'data-tooltip-maxwidth': 300
        });
      }

      if (!SL.current_user.isPro() && clr.pro) {
        $color.attr('data-pro', 'true');
      }
    }).bind(this));

    this.$domElement.find('.color li').on('vclick', this.onColorClicked.bind(this));
  },

  /**
   * @function
   */
  renderFonts: function () {
    var $section = $([
        '<div class="section selector font">',
          '<h3>' + SL.locale.get('Theme_Opts.font_title') + '</h3>',
          '<ul></ul>',
        '</div>'].join('')).appendTo(this.$domElement),
      $ul = $section.find('ul');

    this.config.fonts.forEach((function (font) {
      var $font = $([
        '<li data-font="' + font.id + '" data-name="' + font.title + '">',
          '<div class="themed">',
            '<h1>' + font.title + '</h1>',
            '<a>' + SL.locale.get('Theme_Opts.font_type') + '</a>',
          '</div>',
        '</li>'].join(''));

      $font.addClass('theme-font-' + font.id);
      $font.appendTo($ul);

      if (font.tooltip) {
        $font.attr({
          'data-tooltip':          font.tooltip,
          'data-tooltip-delay':    250,
          'data-tooltip-maxwidth': 300
        });
      }
    }).bind(this));

    this.$domElement.find('.font li').on('vclick', this.onFontClicked.bind(this));
  },

  /**
   * @function
   */
  renderTransitions: function () {
    var $section = $([
        '<div class="section selector transition">',
          '<h3>' + SL.locale.get('Theme_Opts.transitions_title') + '</h3>',
          '<ul></ul>',
        '</div>'].join('')).appendTo(this.$domElement),
      $ul = $section.find('ul');

    this.config.transitions.forEach((function (transition) {
      var $transition = $([
        '<li data-transition="' + transition.id + '">',
        '</li>'].join('')).appendTo($ul);

      if (transition.deprecated === true) {
        $transition.addClass('deprecated');
      }

      if (transition.title) {
        $transition.attr({
          'data-tooltip':    transition.title,
          'data-tooltip-oy': -5
        });
      }
    }).bind(this));

    this.$domElement.find('.transition li').on('vclick', this.onTransitionClicked.bind(this));
  },

  /**
   * @function
   */
  renderBackgroundTransitions: function () {
    var $section = $([
      '<div class="section selector background-transition">',
      '</div>'].join('')).appendTo(this.$domElement);

    $section.append([
      '<h3>' + SL.locale.get('Theme_Opts.bk_transition_title') +
        '<span class="icon i-info info-icon" data-tooltip="' +
          SL.locale.get('Theme_Opts.bk_transition_tip') +
          '" data-tooltip-maxwidth="250">',
        '</span>',
      '</h3>'].join(''));
    $section.append('<ul>');

    var $ul = $section.find('ul');

    this.config.backgroundTransitions.forEach((function (transition) {
      var $transition = $([
        '<li data-background-transition="' + transition.id + '">',
        '</li>'].join('')).appendTo($ul);

      if (transition.deprecated === true) {
        $transition.addClass('deprecated');
      }

      if (transition.title) {
        $transition.attr({
          'data-tooltip':    transition.title,
          'data-tooltip-oy': -5
        });
      }
    }).bind(this));

    this.$domElement.find('.background-transition li')
      .on('vclick', this.onBackgroundTransitionClicked.bind(this));
  },

  /**
   * @function
   * @param {Object} theme
   */
  populate: function (theme) {
    if (theme) {
      this.theme = theme;

      this.updateSelection();
      this.toggleDeprecatedOptions();
      this.scrollToTop();
    }
  },

  /**
   * @function
   */
  scrollToTop: function () {
    this.$domElement.scrollTop(0);
  },

  /**
   * @function
   */
  updateSelection: function () {
    if (this.config.themes && !this.config.themes.isEmpty()) {
      this.$domElement.toggleClass('using-theme', this.theme.has('id'));
    }

    if (this.config.center) {
      this.$domElement.find('#theme-center')
        .prop('checked', this.theme.get('center') === 1);
    }

    if (this.config.rollingLinks) {
      this.$domElement.find('#theme-rolling_links')
        .prop('checked', this.theme.get('rolling_links') === 1);
    }

    this.$domElement.find('.theme li').removeClass('selected');

    this.$domElement.find('.theme li[data-theme=' + this.theme.get('id') + ']')
      .addClass('selected');

    if (!(this.$domElement.find('.theme li.selected').length !== 0 ||
      this.theme.has('id'))) {
      this.$domElement.find('.theme li[data-theme=""]').addClass('selected');
    }

    this.$domElement.find('.color li').removeClass('selected');
    this.$domElement
      .find('.color li[data-color=' + this.theme.get('color') + ']')
      .addClass('selected');
    this.$domElement.find('.font li').removeClass('selected');
    this.$domElement
      .find('.font li[data-font=' + this.theme.get('font') + ']')
      .addClass('selected');

    this.$domElement.find('.font li').each((function (index, item) {
      SL.util.html.removeClasses(item, function (str) {
        return str.match(/^theme\-color\-/gi);
      });

      $(item).addClass('theme-color-' + this.theme.get('color'));
    }).bind(this));

    this.$domElement.find('.transition li').removeClass('selected');
    this.$domElement.find('.transition li[data-transition=' +
      this.theme.get('transition') + ']').addClass('selected');
    this.$domElement.find('.background-transition li').removeClass('selected');
    this.$domElement.find('.background-transition li[data-background-transition=' +
      this.theme.get('background_transition') + ']').addClass('selected');
  },

  /**
   * @function
   */
  applySelection: function () {
    SL.helpers.ThemeController.paint(this.theme, {
      center: false,
      js:     false
    });
  },

  /**
   * @function
   */
  toggleDeprecatedOptions: function () {
    this.$domElement.find('.transition .deprecated')
      .toggle(this.theme.isTransitionDeprecated());
    this.$domElement.find('.background-transition .deprecated')
      .toggle(this.theme.isBackgroundTransitionDeprecated());
  },

  /**
   * @function
   * @returns {*|Object}
   */
  getTheme: function () {
    return this.theme;
  },

  /**
   * @function
   * @param {Event} evt
   */
  onThemeClicked: function (evt) {
    var $target = $(evt.currentTarget),
      themeId   = $target.data('theme');

    if (themeId) {
      var property = this.config.themes.getByProperties({
        id: themeId
      });

      if (property) {
        if (!property.isLoading()) {
          var $preloader = $([
              '<div class="thumb-preloader hidden">' +
                '<div class="spinner centered"></div>' +
              '</div>'].join('')).appendTo($target),
            timer = -1;

          timer = setTimeout(function () {
            $preloader.removeClass('hidden');
          }, 1);

          SL.util.html.generateSpinners();
          $target.addClass('selected');

          property.load().done((function () {
            this.theme = property.clone();

            this.updateSelection();
            this.applySelection();

            this.changed.dispatch();
          }).bind(this)).fail((function () {
            SL.notify(SL.locale.get('Generic_Error'), 'negative');
            $target.removeClass('selected');
          }).bind(this)).always((function () {
            clearTimeout(timer);
            $preloader.remove();
          }).bind(this));
        }
      } else {
        SL.notify('Could not find theme data', 'negative');
      }
    } else {
      this.theme.set('id', null);
      this.theme.set('js', null);
      this.theme.set('css', null);
      this.theme.set('less', null);
      this.theme.set('html', null);

      this.updateSelection();
      this.applySelection();

      this.changed.dispatch();
    }

    SL.analytics.trackTheming('Theme option selected');
  },

  /**
   * @function
   */
  onOptionChanged: function () {
    this.theme.set(
      'center', this.$domElement.find('#theme-center').is(':checked'));
    this.theme.set(
      'rolling_links', this.$domElement.find('#theme-rolling_links').is(':checked'));

    this.updateSelection();
    this.applySelection();

    this.changed.dispatch();
  },

  /**
   * @function
   * @param {Event} evt
   */
  onColorClicked: function (evt) {
    evt.preventDefault();

    if ($(evt.currentTarget).is('[data-pro]')) {
      window.open('/pricing');
      return;
    } else {
      this.theme.set('color', $(evt.currentTarget).data('color'));

      this.updateSelection();
      this.applySelection();

      SL.analytics.trackTheming('Color option selected', this.theme.get('color'));

      this.changed.dispatch();
      return;
    }
  },

  /**
   * @function
   * @param {Event} evt
   */
  onFontClicked: function (evt) {
    evt.preventDefault();

    this.theme.set('font', $(evt.currentTarget).data('font'));

    this.updateSelection();
    this.applySelection();

    SL.analytics.trackTheming('Font option selected', this.theme.get('font'));

    this.changed.dispatch();
  },

  /**
   * @function
   * @param {Event} evt
   */
  onTransitionClicked: function (evt) {
    evt.preventDefault();

    this.theme.set('transition', $(evt.currentTarget).data('transition'));

    this.updateSelection();
    this.applySelection();

    SL.analytics.trackTheming('Transition option selected', this.theme.get('transition'));

    this.changed.dispatch();
  },

  /**
   * @function
   * @param {Event} evt
   */
  onBackgroundTransitionClicked: function (evt) {
    evt.preventDefault();

    this.theme.set(
      'background_transition', $(evt.currentTarget).data('background-transition'));

    this.updateSelection();
    this.applySelection();

    SL.analytics.trackTheming(
      'Background transition option selected', this.theme.get('background_transition'));

    this.changed.dispatch();
  },

  /**
   * @function
   */
  destroy: function () {
    this.changed.dispose();
    this.$domElement.remove();

    this.theme  = null;
    this.config = null;
  }
});


/*!
 * project name: SlideStudio
 * name:         tutorial.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/26
 */

'use strict';

SL('components').Tutorial = Class.extend({
  /**
   * Constructor SL.components.Tutorial Instance
   *
   * @function
   * @param options
   */
  init: function (options) {
    this.options = $.extend({
      steps: []
    }, options);

    this.options.steps.forEach(function (step) {
      if (typeof step.backwards === "undefined") {
        step.backwards = function () {};
      }

      if (typeof step.forwards === "undefined") {
        step.forwards = function () {};
      }
    });

    this.skipped  = new window.signals.Signal();
    this.finished = new window.signals.Signal();

    this.index = -1;

    this.render();
    this.bind();
    this.layout();
    this.paint();

    this.$controlsButtons.css('width', this.$controlsButtons.outerWidth() + 10);
  },

  /**
   * Render Tutorial View Dom Elements
   *
   * @function
   */
  render: function () {
    this.$domElement = $('<div class="sl-tutorial">');
    this.$domElement.appendTo(document.body);

    this.canvas = $('<canvas class="sl-tutorial-canvas">');
    this.canvas.appendTo(this.$domElement);
    this.canvas = this.canvas.get(0);

    this.context = this.canvas.getContext('2d');

    this.$controls = $('<div class="sl-tutorial-controls">');
    this.$controls.appendTo(this.$domElement);

    this.$controlsInner = $('<div class="sl-tutorial-controls-inner">');
    this.$controlsInner.appendTo(this.$controls);

    this.renderPagination();

    this.$controlsButtons = $('<div class="sl-tutorial-buttons">');
    this.$controlsButtons.appendTo(this.$controlsInner);

    this.$nextButton = $([
      '<button class="button no-transition positive l sl-tutorial-next">',
        '下一步',
      '</button>'].join(''));
    this.$nextButton.appendTo(this.$controlsButtons);

    this.$skipButton = $([
      '<button class="button no-transition outline white l sl-tutorial-skip">',
        '跳过教程',
      '</button>'].join(''));
    this.$skipButton.appendTo(this.$controlsButtons);

    this.$messageElement = $('<div class="sl-tutorial-message no-transition">').hide();
    this.$messageElement.appendTo(this.$domElement);
  },

  /**
   * Render Tutorial Pagination
   *
   * @function
   */
  renderPagination: function () {
    this.$pagination = $('<div class="sl-tutorial-pagination">');
    this.$pagination.appendTo(this.$controlsInner);

    this.options.steps.forEach((function (index, step) {
      $('<li class="sl-tutorial-pagination-number">')
        .appendTo(this.$pagination)
        .on('click', this.step.bind(this, step));
    }).bind(this));
  },

  /**
   * Bind Tutorial Event
   *
   * @function
   */
  bind: function () {
    this.onKeyDown      = this.onKeyDown.bind(this);
    this.onSkipClicked  = this.onSkipClicked.bind(this);
    this.onWindowResize = this.onWindowResize.bind(this);

    SL.keyboard.keyDown(this.onKeyDown);

    this.$skipButton.on('click', this.onSkipClicked);
    this.$nextButton.on('click', this.next.bind(this));

    $(window).on('resize', this.onWindowResize);
  },

  /**
   * Previous Step
   *
   * @function
   */
  prev: function () {
    this.step(Math.max(this.index - 1, 0));
  },

  /**
   * Next Step
   *
   * @function
   */
  next: function () {
    if (this.index + 1 >= this.options.steps.length) {
      this.finished.dispatch();
      this.destroy();
    } else {
      this.step(Math.min(this.index + 1, this.options.steps.length - 1));
    }
  },

  /**
   * Jump To Special Index Step Tutorial
   *
   * @function
   * @param {Number} index -The Tutorial Step Index
   */
  step: function (index) {
    if (this.index < index) {
      for (; this.index < index;) {
        this.index += 1;
        this.options.steps[this.index]
          .forwards.call(this.options.context);
      }

      if ((this.index + 1) === this.options.steps.length) {
        this.$skipButton.hide();
        this.$nextButton.text('开始吧');
        this.$domElement.addClass('last-step');
      }
    } else if (this.index > index) {
      if ((this.index + 1) === this.options.steps.length) {
        this.$skipButton.show();
        this.$nextButton.text('Next');
        this.$domElement.removeClass('last-step');
      }

      for (; this.index > index;) {
        this.options.steps[this.index]
          .backwards.call(this.options.context);
        this.index -= 1;
      }

      this.options.steps[this.index]
        .forwards.call(this.options.context);
    }

    this.updatePagination();
  },

  /**
   * After Changed Step Update Pagination
   *
   * @function
   */
  updatePagination: function () {
    this.$pagination
      .find('.sl-tutorial-pagination-number')
      .each((function (index, pagination) {
        pagination = $(pagination);
        pagination.toggleClass('past', index < this.index);
        pagination.toggleClass('present', index === this.index);
        pagination.toggleClass('future', index > this.index);
      }).bind(this));
  },

  /**
   * Resize Tutorial Layout
   *
   * @function
   */
  layout: function () {
    this.width  = window.innerWidth;
    this.height = window.innerHeight;

    if (this.$cutoutElement) {
      var offset = this.$cutoutElement.offset();

      this.cutoutRect = {
        x:      offset.left - this.cutoutPadding,
        y:      offset.top - this.cutoutPadding,
        width:  this.$cutoutElement.outerWidth() + 2 * this.cutoutPadding,
        height: this.$cutoutElement.outerHeight() + 2 * this.cutoutPadding
      };
    }

    if (this.$messageElement.is(':visible')) {
      var padding = 20,
        outerWidth = this.$messageElement.outerWidth(),
        outerHeight = this.$messageElement.outerHeight(),
        margin = {
          left: (window.innerWidth - outerWidth) / 2,
          top:  (window.innerHeight - outerHeight) / 2
        };

      if (this.messageOptions.anchor && this.messageOptions.alignment) {
        var anchorOffset = this.messageOptions.anchor.offset(),
          anchorOuterW   = this.messageOptions.anchor.outerWidth(),
          anchorOuterH   = this.messageOptions.anchor.outerHeight();

        switch (this.messageOptions.alignment) {
          case 't':
            margin.left = anchorOffset.left + (anchorOuterW - outerWidth) / 2;
            margin.top  = anchorOffset.top - outerHeight - padding;
            break;
          case 'r':
            margin.left = anchorOffset.left + anchorOuterW + padding;
            margin.top  = anchorOffset.top + (anchorOuterH - outerHeight) / 2;
            break;
          case 'b':
            margin.left = anchorOffset.left + (anchorOuterW - outerWidth) / 2;
            margin.top  = anchorOffset.top + anchorOuterH + padding;
            break;
          case 'l':
            margin.left = anchorOffset.left - outerWidth - padding;
            margin.top  = anchorOffset.top + (anchorOuterH - outerHeight) / 2;
            break;
        }
      }

      var transform =
        'translate(' + Math.round(margin.left) + 'px,' +
        Math.round(margin.top) + 'px)';

      this.$messageElement.css({
        '-webkit-transform': transform,
        '-moz-transform':    transform,
        '-ms-transform':     transform,
        transform:           transform
      });

      setTimeout((function () {
        this.$messageElement.removeClass('no-transition');
      }).bind(this), 1);
    }
  },

  /**
   * Paint Content
   *
   * @function
   */
  paint: function () {
    this.canvas.width  = this.width;
    this.canvas.height = this.height;

    this.context.clearRect(0, 0, this.width, this.height);
    this.context.fillStyle = 'rgba( 0, 0, 0, 0.7 )';
    this.context.fillRect(0, 0, this.width, this.height);

    if (this.$cutoutElement) {
      this.context.clearRect(this.cutoutRect.x, this.cutoutRect.y,
        this.cutoutRect.width, this.cutoutRect.height);
      this.context.strokeStyle = '#ddd';
      this.context.lineWidth = 1;
      this.context.strokeRect(this.cutoutRect.x + 0.5, this.cutoutRect.y + 0.5,
        this.cutoutRect.width - 1, this.cutoutRect.height - 1);
    }
  },

  /**
   * Show Cut Out Element
   *
   * @function
   * @param {*|jQuery|HTMLElement} cutoutElement
   * @param {Object}               options
   */
  cutout: function (cutoutElement, options) {
    options = options || {};

    this.$cutoutElement = cutoutElement;
    this.cutoutPadding  = options.padding || 0;

    this.layout();
    this.paint();
  },

  /**
   * Clear Cut Out Element
   *
   * @function
   */
  clearCutout: function () {
    this.$cutoutElement = null;
    this.cutoutPadding  = 0;

    this.paint();
  },

  /**
   * Show Tutorial Message
   *
   * @function
   * @param {Object} messageOptions
   * @param {String} msg
   */
  message: function (msg, messageOptions) {
    this.messageOptions = $.extend({
      maxWidth:  320,
      alignment: ''
    }, messageOptions);

    this.$messageElement.html(msg).show();
    this.$messageElement.css('max-width', this.messageOptions.maxWidth);
    this.$messageElement.attr('data-alignment', this.messageOptions.alignment);

    this.layout();
    this.paint();
  },

  /**
   * Clear Tutorial Message
   *
   * @function
   */
  clearMessage: function () {
    this.$messageElement.hide();
    this.messageOptions = {};
  },

  /**
   * Get Has Next Step
   *
   * @function
   * @returns {boolean}
   */
  hasNextStep: function () {
    return this.index + 1 < this.options.steps.length;
  },

  /**
   * Destory This Tutorial Instance
   *
   * @function
   */
  destroy: function () {
    if (!this.destroyed) {
      this.destroyed = true;

      $(window).off('resize', this.onWindowResize);

      this.skipped.dispose();
      this.finished.dispose();

      SL.keyboard.release(this.onKeyDown);
      this.$domElement.fadeOut(400, this.$domElement.remove);
    }
  },

  /**
   * @function
   * @param {Event} evt
   */
  onKeyDown: function (evt) {
    if (evt.keyCode === 27) {
      this.skipped.dispatch();
      this.destroy();
      return false;
    } else if (evt.keyCode === 37 || evt.keyCode === 8) {
      this.prev();
      return false;
    } else if (evt.keyCode === 39 || evt.keyCode === 32) {
      this.next();
      return false;
    } else {
      return true;
    }
  },

  /**
   * @function
   */
  onSkipClicked: function () {
    this.skipped.dispatch();
    this.destroy();
  },

  /**
   * @function
   */
  onWindowResize: function () {
    this.layout();
    this.paint();
  }
});


/*!
 * project name: SlideStudio
 * name:         contextmenu.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/9/6
 */

'use strict';

SL('components').ContextMenu = Class.extend({
  /**
   * @function
   * @param {Object} config
   */
  init : function (config) {
    this.config = $.extend({
      anchorSpacing : 5,
      minWidth :      0,
      options :       []
    }, config);
    this.config.anchor = $(this.config.anchor);

    this.show                = this.show.bind(this);
    this.hide                = this.hide.bind(this);
    this.layout              = this.layout.bind(this);
    this.onContextMenu       = this.onContextMenu.bind(this);
    this.onDocumentKeyDown   = this.onDocumentKeyDown.bind(this);
    this.onDocumentMouseDown = this.onDocumentMouseDown.bind(this);

    this.shown     = new signals.Signal;
    this.hidden    = new signals.Signal;
    this.destroyed = new signals.Signal;

    this.$domElement = $('<div class="sl-context-menu">');
    this.config.anchor.on('contextmenu', this.onContextMenu);
  },

  /**
   * @function
   */
  render : function () {
    this.$listElement = $('<div class="sl-context-menu-list">').appendTo(this.$domElement);
    this.$listElement.css('minWidth', this.config.minWidth + 'px');
    this.$arrowElement = $('<div class="sl-context-menu-arrow">').appendTo(this.$domElement);
  },

  /**
   * @function
   */
  renderList : function () {
    this.config.options.forEach((function (opt) {
      if (opt.type === 'divider') {
        $('<div class="sl-context-menu-divider">').appendTo(this.$listElement);
      } else {
        var $opt = $(typeof opt.url === "string" ?
          '<a class="sl-context-menu-item" href="' + opt.url + '">' :
          '<div class="sl-context-menu-item">');

        $opt.data('item-data', opt);
        $opt.html('<span class="label">' + opt.label + '</span>');
        $opt.appendTo(this.$listElement);

        $opt.on('click', (function (evt) {
          var cb = $(evt.currentTarget).data('item-data').callback;

          if (typeof cb === "function") {
            cb.apply(null, [this.contextMenuEvent]);
          }

          this.hide();
        }).bind(this));

        if (opt.icon) {
          $opt.append('<span class="icon i-' + opt.icon + '"></span>');
        }

        if (opt.attributes) {
          $opt.attr(opt.attributes);
        }
      }
    }).bind(this));
  },

  /**
   * @function
   */
  bind : function () {
    SL.keyboard.keyDown(this.onDocumentKeyDown);
    $(document).on('mousedown touchstart pointerdown', this.onDocumentMouseDown);
  },

  /**
   * @function
   */
  unbind : function () {
    SL.keyboard.release(this.onDocumentKeyDown);
    $(document).off('mousedown touchstart pointerdown', this.onDocumentMouseDown);
  },

  /**
   * @function
   * @param {Number} clientX
   * @param {Number} clientY
   */
  layout : function (clientX, clientY) {
    var anchorSpacing = this.config.anchorSpacing,
      scrollLeft = $(window).scrollLeft(),
      scrollTop  = $(window).scrollTop(),
      width  = this.$domElement.outerWidth(),
      height = this.$domElement.outerHeight(),
      aLeft  = width / 2,
      aTop   = height / 2,
      offset = 8,
      left   = clientX,
      top    = clientY - height / 2;

    if (clientX + anchorSpacing + offset + width < window.innerWidth) {
      this.$domElement.attr('data-alignment', 'r');
      left += offset + anchorSpacing;
      aLeft = -offset;
    } else {
      this.$domElement.attr('data-alignment', 'l');
      left -= width + offset + anchorSpacing;
      aLeft = width;
    }

    left = Math.min(
      Math.max(left, scrollLeft + anchorSpacing),
      window.innerWidth + scrollLeft - width - anchorSpacing);
    top = Math.min(
      Math.max(top, scrollTop + anchorSpacing),
      window.innerHeight + scrollTop - height - anchorSpacing);

    this.$domElement.css({
      left: left,
      top:  top
    });
    this.$arrowElement.css({
      left: aLeft,
      top:  aTop
    });
  },

  /**
   * @function
   * @param {Number} delta
   */
  focus : function (delta) {
    var $focus = this.$listElement.find('.focus');

    if ($focus.length) {
      var $item = delta > 0 ?
        $focus.nextAll('.sl-context-menu-item').first() :
        $focus.prevAll('.sl-context-menu-item').first();

      if ($item.length) {
        $focus.removeClass('focus');
        $item.addClass('focus');
      }
    } else {
      this.$listElement.find('.sl-context-menu-item').first().addClass('focus');
    }
  },

  /**
   * @function
   */
  show : function () {
    if (!this.rendered) {
      this.rendered = true;
      this.render();
      this.renderList();
    }

    this.$listElement.find('.sl-context-menu-item').each((function (index, element) {
      var $ele = $(element), data = $ele.data('item-data');
      $ele.toggleClass('hidden', typeof data.filter === "function" && !data.filter());
    }).bind(this));

    if (this.$listElement.find('.sl-context-menu-item:not(.hidden)').length) {
      this.$domElement.removeClass('visible').appendTo(document.body);

      setTimeout((function () {
        this.$domElement.addClass('visible');
      }).bind(this), 1);

      this.bind(),
      this.layout(this.contextMenuEvent.clientX, this.contextMenuEvent.clientY);
      this.shown.dispatch(this.contextMenuEvent);
    }
  },

  /**
   * @function
   */
  hide : function () {
    this.$listElement.find('.focus').removeClass('focus');
    this.$domElement.detach();
    this.unbind();
    this.hidden.dispatch();
  },

  /**
   * @function
   * @returns {boolean}
   */
  isVisible : function () {
    return this.$domElement.parent().length > 0;
  },

  /**
   * @function
   */
  destroy : function () {
    this.shown.dispose();
    this.hidden.dispose();
    this.destroyed.dispatch();
    this.destroyed.dispose();
    this.$domElement.remove();
    this.unbind();
    this.config = null;
  },

  /**
   * @function
   * @param {Event} evt
   */
  onDocumentKeyDown : function (evt) {
    if (evt.keyCode === 27) {
      this.hide();
      evt.preventDefault();
    }

    if (evt.keyCode === 13) {
      var $focus = this.$listElement.find('.focus');

      if ($focus.length) {
        $focus.trigger('click');
        evt.preventDefault();
      }
    } else {
      if (evt.keyCode === 38) {
        this.focus(-1);
        evt.preventDefault();
      } else if (evt.keyCode = 40) {
        this.focus(1);
        evt.preventDefault();
      } else if (evt.keyCode === 9 && evt.shiftKey) {
        this.focus(-1);
        evt.preventDefault();
      } else if (evt.keyCode === 9) {
        this.focus(1);
        evt.preventDefault();
      }
    }
  },

  /**
   * @function
   * @param {Event} evt
   */
  onContextMenu : function (evt) {
    evt.preventDefault();
    this.contextMenuEvent = evt;
    this.show();
  },

  /**
   * @function
   * @param {Event} evt
   */
  onDocumentMouseDown : function (evt) {
    var $target = $(evt.target);

    if (this.isVisible() && $target.closest(this.$domElement).length === 0) {
      this.hide();
    }
  }
});


/*!
 * project name: SlideStudio
 * name:         base.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/11
 */

'use strict';

SL('views').Base = Class.extend({
  init: function () {

    this.setupAce();
    //this.setupSocial();
    this.handleLogos();
    this.handleOutlines();
    this.handleFeedback();
    this.handleWindowClose();
    this.handleAutoRefresh();
    this.parseTimes();
    this.parseLinks();
    this.parseMeters();
    this.parseSpinners();
    this.parseNotifications();
    this.parseScrollLinks();

    setInterval(this.parseTimes.bind(this), 120000);
  },
  setupAce: function () {
    if (typeof window.ace === "object" &&
      typeof window.ace.config === "object" &&
      typeof window.ace.config.set === "function") {
      window.ace.config.set('workerPath', '/plugins/ace/src');
    } else {
      console.warn('ace library is not loaded!');
    }
  },
  setupSocial: function () {
    $(window).on('load', function () {
      var script = null;

      if (document.querySelector('.fb-like')) {
        $('body').append('<div id="fb-root"></div>');

        (function (doc, script, fbsdk) {
          if (doc.getElementById(fbsdk)) {
            var firstScript = document.getElementsByTagName('script')[0];

            script = doc.createElement(script);
            script.id = fbsdk;
            script.src = '//connect.facebook.net/en_US/all.js#xfbml=1&appId=178466085544080';
            firstScript.parentNode.insertBefore(script, firstScript);
          }
        })(document, 'script', 'facebook-jssdk');
      }

      if (document.querySelector('.twitter-share-button')) {
        (function (doc, script, twsdk) {
          if (doc.getElementById(twsdk)) {
            var firstScript = document.getElementsByTagName('script')[0];

            script = doc.createElement(script);
            script.id = twsdk;
            script.src = '//platform.twitter.com/widgets.js';
            firstScript.parentNode.insertBefore(script, firstScript);
          }
        })(document, 'script', 'twitter-wjs');
      }

      if (document.querySelector('.g-plusone')) {
        script = document.createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        script.src = 'https://apis.google.com/js/plusone.js';

        var firstScript = document.getElementsByTagName('script')[0];
        firstScript.parentNode.insertBefore(script, firstScript);
      }
    });
  },
  handleLogos: function () {
    setTimeout(function () {
      $('.logo-animation').addClass('open');
    }, 600);
  },
  handleOutlines: function () {
    var firstStyle = $('<style>').appendTo('head').get(0);

    $(document).on('keydown', function () {
      setStyle('a, button, .sl-select, .sl-checkbox label, .radio label { outline: none !important; }');
    });
    $(document).on('mousedown', function () {
      setStyle('');
    });

    function setStyle(str) {
      if (firstStyle.styleSheet) {
        firstStyle.styleSheet.cssText = str;
      } else {
        firstStyle.innerHTML = str;
      }
    }
  },
  handleFeedback: function () {
    $('html').on('click', '[data-feedback-mode]', function (evt) {
      var $this  = $(this),
        feedback = {
          target:   this,
          mode:     $this.attr('data-feedback-mode') || 'contact',
          position: $this.attr('data-feedback-position') || 'top',
          screenshot_enabled:
          $this.attr('data-feedback-screenshot_enabled') || 'true',
          smartvote_enabled:
          $this.attr('data-feedback-smartvote-enabled') || 'true',
          ticket_custom_fields: {}
        };

      if (SL.current_deck) {
        feedback.ticket_custom_fields['Deck ID']                    =
          SL.current_deck.get('id');
        feedback.ticket_custom_fields['Deck Slug']                  =
          SL.current_deck.get('slug');
        feedback.ticket_custom_fields['Deck Version']               =
          SL.current_deck.get('version');
        feedback.ticket_custom_fields['Deck Font']                  =
          SL.current_deck.get('theme_font');
        feedback.ticket_custom_fields['Deck Color']                 =
          SL.current_deck.get('theme_color');
        feedback.ticket_custom_fields['Deck Transition']            =
          SL.current_deck.get('transition');
        feedback.ticket_custom_fields['Deck Background Transition'] =
          SL.current_deck.get('backgroundTransition');

        var feedbackType = $this.attr('data-feedback-type');

        if (feedbackType && feedbackType.length) {
          feedback.ticket_custom_fields.Type = feedbackType;
        }

        var feedbackTitle = $this.attr('data-feedback-contact-title');

        if (feedbackTitle && feedbackTitle.length) {
          feedback.contact_title = feedbackTitle;
        }

        if (window.UserVoice) {
          window.UserVoice.push(['show', feedback]);
        }

        evt.preventDefault();
      }
    });
  },
  handleWindowClose: function () {
    var query = SL.util.getQuery();

    if (query && query.autoClose && window.opener) {
      var times = parseInt(query.autoClose, 10) || 10;

      setTimeout(function () {
        try {
          window.close();
        } catch (err) {
          console.log(err);
        }
      }, times);
    }
  },
  handleAutoRefresh: function () {
    var query = SL.util.getQuery();

    if (query && query.autoRefresh) {
      var times = parseInt(query.autoRefresh, 10);

      if (!isNaN(times) && times > 0) {
        setTimeout(function () {
          try {
            window.location.reload();
          } catch (err) {
            console.log(err);
          }
        }, times);
      }
    }
  },
  parseTimes: function () {
    window.moment.lang(SL.util.getLanguage());

    $('time.ago').each(function () {
      var dateTime = $(this).attr('datetime');

      if (dateTime) {
        $(this).text(window.moment.utc(dateTime).fromNow());
      }
    });
    $('time.date').each(function () {
      var dateTime = $(this).attr('datetime');

      if (dateTime) {
        $(this).text(window.moment.utc(dateTime).fromNow('MMM Do, YYYY'));
      }
    });
  },
  parseLinks: function () {
    $('.linkify').each(function () {
      $(this).html(SL.util.string.linkify($(this).text()));
    });
  },
  parseMeters: function () {
    $('.sl-meter').each(function () {
      new SL.components.Meter($(this));
    });
  },
  parseSpinners: function () {
    SL.util.html.generateSpinners();
  },
  parseNotifications: function () {
    var notify = $('.flash-notification');

    if (notify.length) {
      SL.notify(notify.remove().text(), notify.attr('data-notification-type'));
    }
  },
  parseScrollLinks: function () {
    $(document).delegate('a[data-scroll-to]', 'click', function (evt) {
      var currentTarget = evt.currentTarget,
        href = $(currentTarget.getAttribute('href')),
        scrollOffset =
          parseInt(currentTarget.getAttribute('data-scroll-to-offset'), 10),
        scrollDuration =
          parseInt(currentTarget.getAttribute('data-scroll-to-duration'), 10);

      if (isNaN(scrollOffset)) {
        scrollOffset = -20;
      }

      if (isNaN(scrollDuration)) {
        scrollDuration = 1e3;
      }

      if (href.length > 0) {
        $('html, body').animate({
          scrollTop: href.offset().top + scrollOffset
        }, scrollDuration);
      }

      evt.preventDefault();
    });
  }
});


/*!
 * project name: SlideStudio
 * name:         decks.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/11
 */

'use strict';

SL('views.decks').Show                = SL.views.Base.extend({
  /**
   * Constructor SL.views.decks.Show Instance
   *
   * @function
   */
  init: function () {
    this._super();

    SL.util.setupReveal({
      history:         true,
      embedded:        true,
      pause:           false,
      margin:          0.1,
      openLinksInTabs: true,
      trackEvents:     true
    });

    this.setupReply();
    this.setupPills();

    if ($('header .deck-promotion').length) {
      $('header').addClass('extra-wide');
    }

    if (window.Modernizr.fullscreen === false) {
      $('.deck-options .fullscreen-button').hide();
    }

    this.bind();
    this.layout();
  },

  /**
   * Initialize Views Events
   *
   * @function
   */
  bind: function () {
    this.$editButton = $('.deck-options .edit-button');
    this.editButtonOriginalLink = this.$editButton.attr('href');

    $('.deck-options .fork-button')
      .on('vclick', this.onForkClicked.bind(this));
    $('.deck-options .share-button')
      .on('vclick', this.onShareClicked.bind(this));
    $('.deck-options .comment-button')
      .on('vclick', this.onCommentsClicked.bind(this));
    $('.deck-options .fullscreen-button')
      .on('vclick', this.onFullScreenClicked.bind(this));

    this.$visibilityButton = $('.deck-options .visibility-button');
    this.$visibilityButton.on('vclick', this.onVisibilityClicked.bind(this));

    $(document)
      .on('webkitfullscreenchange mozfullscreenchange ' +
      'MSFullscreenChange fullscreenchange', Reveal.layout);

    this.onWindowScroll = $.debounce(this.onWindowScroll, 200);

    $(window).on('resize', this.layout.bind(this));
    $(window).on('scroll', this.onWindowScroll.bind(this));

    this.hideSummary = this.hideSummary.bind(this);

    Reveal.addEventListener('slidechanged', this.onSlideChanged.bind(this));
    Reveal.addEventListener('fragmentshown', this.hideSummary);
    Reveal.addEventListener('fragmenthidden', this.hideSummary);
  },

  /**
   * Initialize Discussions Systems
   *
   * @function
   */
  setupReply: function () {
    if ($('.panel', '#comments').length > 0) {
      this.reply = new SL.components.Reply();
    } else {
      $('.deck-options .comment-button').hide();
    }
  },

  setupPills: function () {
    this.$summaryPill = $(".summary-pill"),
    this.$instructionsPill = $(".instructions-pill");
    this.$summaryPill.on("vclick", this.hideSummary);
    this.$instructionsPill.on('vclick', this.hideInstructions);
    this.showSummaryTimeout =
      setTimeout(this.showSummary.bind(this), 1000);
    this.hideSummaryTimeout =
      setTimeout(this.hideSummary.bind(this), 6000);

    if (!SL.util.user.isLoggedIn() &&
      !SL.util.device.IS_PHONE &&
      !SL.util.device.IS_TABLET &&
      Reveal.getTotalSlides() > 1 && Modernizr.localstorage) {
      var str = 'slides-has-seen-deck-navigation-instructions';

      if (!localStorage.getItem(str)) {
        localStorage.setItem(str, "yes");
        this.showInstructionsTimeout =
          setTimeout(this.showInstructions.bind(this), 6000);
      }
    }
  },

  /**
   * Show Summary
   *
   * @function
   */
  showSummary: function () {
    if (this.$summaryPill) {
      this.$summaryPill.addClass('visible');
    }
  },

  /**
   * Hide Summary
   *
   * @function
   */
  hideSummary: function () {
    clearTimeout(this.showSummaryTimeout);

    if (this.$summaryPill) {
      this.$summaryPill.removeClass('visible');
      this.$summaryPill.on('transitionend', this.$summaryPill.remove);
      this.$summaryPill = null;
    }
  },

  showInstructions: function () {
    if (this.$instructionsPill) {
      this.$instructionsPill.addClass('visible');
    }
  },

  hideInstructions: function () {
    clearTimeout(this.showInstructionsTimeout);

    if (this.$instructionsPill) {
      this.$instructionsPill.removeClass('visible');
      this.$instructionsPill.on('transitionend', this.$instructionsPill.remove);
      this.$instructionsPill = null;
    }
  },

  /**
   * Resize Layout
   *
   * @function
   */
  layout: function () {
    if (this.$summaryPill) {
      this.$summaryPill.css(
        'left',
        (window.innerWidth - this.$summaryPill.width()) / 2);
    }

    if (this.$instructionsPill) {
      this.$instructionsPill.css(
        'left',
        (window.innerWidth - this.$instructionsPill.width()) / 2);
    }

    var $playback = $('.reveal .playback'),
      $kudos = $('.deck-kudos'),
      css = {
        opacity: 1
      };

    if ($playback.length && $kudos.length) {
      css.marginLeft =
        $playback.offset().left + $playback.outerWidth() - 10;
    }

    $kudos.css(css);
  },

  /**
   * Save Deck Visibility
   *
   * @function
   * @param {String|*} visibility -The Visibility Type
   */
  saveVisibility: function (visibility) {
    $.ajax({
      type:    'POST',
      url:     SL.config.AJAX_PUBLISH_DECK(SL.current_deck.get('id')),
      context: this,
      data: {
        visibility: visibility
      }
    }).done(function (data) {
      if (data.deck.visibility === SL.models.Deck.VISIBILITY_SELF) {
        SL.notify(SL.locale.get('Deck_Visibility_Change_Self'));
      } else if (data.deck.visibility === SL.models.Deck.VISIBILITY_TEAM) {
        SL.notify(SL.locale.get('Deck_Visibility_Change_Team'));
      } else if (data.deck.visibility === SL.models.Deck.VISIBILITY_ALL) {
        SL.notify(SL.locale.get('Deck_Visibility_Change_All'));
      }

      if (typeof data.deck.slug === "string") {
        SL.current_deck.set('slug', data.deck.slug);
      }

      if (typeof data.deck.visibility === "string") {
        SL.current_deck.set('visibility', data.deck.visibility);
      }
    }).fail(function () {
      SL.notify(SL.locale.get('Deck_Visibility_Changed_Err'), 'negative');
    });
  },

  /**
   * Share Clicked Callback
   *
   * @function
   */
  onShareClicked: function () {
    if (typeof SLConfig !== "undefined" &&
      typeof SLConfig.deck.user.username === "string" &&
      typeof SLConfig.deck.slug === "string") {
      SL.popup.open(SL.components.decksharer.DeckSharer, {
        deck: SL.current_deck
      });
    } else {
      SL.notify(SL.locale.get('Generic_Error'), 'negative');
    }

    SL.analytics.trackPresenting('Share clicked');

    return false;
  },

  /**
   * Comments Callback
   *
   * @function
   */
  onCommentsClicked: function () {
    SL.analytics.trackPresenting('Comments clicked');
  },

  /**
   * FullScreen Callback
   *
   * @function
   */
  onFullScreenClicked: function () {
    var viewport = $('.reveal-viewport').get(0);

    if (viewport) {
      SL.helpers.Fullscreen.enter(viewport);
      return false;
    } else {
      SL.analytics.trackPresenting('Fullscreen clicked');
    }
  },

  /**
   * Fork Callback
   *
   * @function
   */
  onForkClicked: function () {
    SL.analytics.trackPresenting('Fork clicked');

    $.ajax({
      type: 'POST',
      url: SL.config.AJAX_FORK_DECK(SLConfig.deck.id),
      context: this
    }).done(function () {
      window.location = SL.current_user.getProfileURL();
    }).fail(function () {
      SL.notify(SL.locale.get('Generic_Error'), 'negative');
    });

    return false;
  },

  /**
   * Visibility Callback
   *
   * @function
   * @param {Event} evt -The Click Event
   */
  onVisibilityClicked: function (evt) {
    evt.preventDefault();

    var visibility = SL.current_deck.get('visibility'),
      ary = [];

    ary.push({
      html: SL.locale.get('Deck.show.visibility_change_self'),
      selected: visibility === SL.models.Deck.VISIBILITY_SELF,
      callback: (function () {
        this.saveVisibility(SL.models.Deck.VISIBILITY_SELF);
        SL.analytics.trackPresenting('Visibility changed', 'self');
      }).bind(this)
    });

    if (SL.current_user.isEnterprise()) {
      ary.push({
        html: SL.locale.get('Deck.show.visibility_change_team'),
        selected: visibility === SL.models.Deck.VISIBILITY_TEAM,
        className: 'divider',
        callback: (function () {
          this.saveVisibility(SL.models.Deck.VISIBILITY_TEAM);
          SL.analytics.trackPresenting('Visibility changed', 'team');
        }).bind(this)
      });
    }

    ary.push({
      html: SL.locale.get('Deck.show.visibility_change_all'),
      selected: visibility === SL.models.Deck.VISIBILITY_ALL,
      callback: function () {
        this.saveVisibility(SL.models.Deck.VISIBILITY_ALL);
        SL.analytics.trackPresenting('Visibility changed', 'all');
      }.bind(this)
    });

    SL.prompt({
      anchor: $(evt.currentTarget),
      type:   'select',
      data:   ary
    });

    SL.analytics.trackPresenting('Visibility menu opened');
  },

  /**
   * Slide Changed Callback
   *
   * @function
   * @param {Event} evt -The Click Event
   */
  onSlideChanged: function (evt) {
    this.hideSummary();
    this.hideInstructions();

    var str = '#';

    if (evt.indexh) {
      str += '/' + evt.indexh;

      if (evt.indexv) {
        str += '/' + evt.indexv;
      }
    }

    this.$editButton.attr('href', this.editButtonOriginalLink + str);
  },

  /**
   * Window Scroll Callback
   *
   * @function
   */
  onWindowScroll: function () {
    if ($(window).scrollTop() > 10) {
      this.hideSummary();
    }
  }
});

SL('views.decks').EditRequiresUpgrade = SL.views.Base.extend({
  /**
   * Constructor SL.views.decks.EditRequiresUpgrade Instance
   *
   * @function
   */
  init: function () {
    this._super();

    this.$makePublicButton = $('.make-deck-public').first();
    this.$makePublicButton.on('click', this.onMakePublicClicked.bind(this));

    this.makePublicLoader = window.Ladda.create(this.$makePublicButton.get(0));
  },

  /**
   * Setting Deck To Public
   *
   * @function
   */
  makeDeckPublic: function () {
    this.makePublicLoader.start();

    $.ajax({
      type: 'POST',
      url: SL.config.AJAX_PUBLISH_DECK(SL.current_deck.get('id')),
      context: this,
      data: {
        visibility: SL.models.Deck.VISIBILITY_ALL
      }
    }).done(function () {
      window.location =
        SL.routes.DECK_EDIT(
          SL.current_user.get('username'),
          SL.current_deck.get('slug'));
    }).fail(function () {
      SL.notify(SL.locale.get('Deck_Visibility_Changed_Err'), 'negative');
      this.makePublicLoader.stop();
    });
  },

  /**
   * Make Public Click Callback
   *
   * @function
   * @param {Event} evt -The Click Event
   */
  onMakePublicClicked: function (evt) {
    evt.preventDefault();
    this.makeDeckPublic();
  }
});

SL('views.decks').Embed               = SL.views.Base.extend({
  /**
   * Constructor SL.views.decks.Embed Instance
   *
   * @function
   */
  init: function () {
    this._super();

    this.$footerElement    = $('.embed-footer');
    this.$shareButton      = this.$footerElement.find('.embed-footer-share');
    this.$fullscreenButton = this.$footerElement.find('.embed-footer-fullscreen');
    this.$revealElement    = $('.reveal');

    SL.util.setupReveal({
      embedded:        true,
      openLinksInTabs: true,
      trackEvents:     true
    });

    $(window).on('resize', this.layout.bind(this));
    $(document).on('webkitfullscreenchange mozfullscreenchange ' +
      'MSFullscreenChange fullscreenchange', this.layout.bind(this));
    this.$shareButton.on('click', this.onShareClicked.bind(this));
    this.$fullscreenButton.on('click', this.onFullScreenClicked.bind(this));

    var style = SL.util.getQuery().style;

    if (!(style !== 'hidden' || SL.current_deck.isPro())) {
      style = null;
    }

    if (style) {
      $('html').attr('data-embed-style', style);
    }

    if (window.Modernizr.fullscreen === false) {
      this.$fullscreenButton.hide();
    }

    this.layout();
  },

  /**
   * Resize layout
   *
   * @function
   */
  layout: function () {
    this.$revealElement.height(
      this.$footerElement.is(':visible') ?
      window.innerHeight - this.$footerElement.height() :
        '100%');
    window.Reveal.layout();
  },

  /**
   * FullScreen Click Callback
   *
   * @function
   */
  onFullScreenClicked: function () {
    var viewport = $('html').get(0);

    if (viewport) {
      SL.helpers.Fullscreen.enter(viewport);
      return false;
    }
  },

  /**
   * Share Click Callback
   *
   * @function
   */
  onShareClicked: function () {
    SL.popup.open(
      SL.components.decksharer.DeckSharer, {
        deck: SL.current_deck
      });
    SL.analytics.trackPresenting('Share clicked (embed footer)');
  }
});

SL('views.decks').LiveClient          = SL.views.Base.extend({
  /**
   * Constructor SL.views.decks.LiveClient Instance
   *
   * @function
   */
  init: function () {
    this._super();

    SL.util.setupReveal({
      touch:           false,
      history:         false,
      keyboard:        false,
      controls:        false,
      progress:        false,
      showNotes:       false,
      autoSlide:       0,
      openLinksInTabs: true,
      trackEvents:     true
    });
    Reveal.addEventListener('ready', this.onRevealReady.bind(this));

    this.stream = new SL.helpers.StreamLive();
    this.stream.ready.add(this.onStreamReady.bind(this));
    this.stream.stateChanged.add(this.onStreamStateChanged.bind(this));
    this.stream.statusChanged.add(this.onStreamStatusChanged.bind(this));

    this.render();
    this.bind();

    this.stream.connect();
  },

  /**
   * Render Content
   *
   * @function
   */
  render: function () {
    var user = SL.current_deck.get('user'),
      urlSlug = SL.routes.DECK(user.username, SL.current_deck.get('slug')),
      thumbnailUrl = user.thumbnail_url;

    this.$summaryBubble = $([
      '<a class="summary-bubble" href="' + urlSlug + '" target="_blank">',
        '<div class="summary-bubble-picture"' +
          'style="background-image: url(' + thumbnailUrl + ')"></div>',
        '<div class="summary-bubble-content"></div>',
      '</a>'].join('')).appendTo(document.body);
    this.$summaryBubbleContent =
      this.$summaryBubble.find('.summary-bubble-content');

    this.renderUserSummary();
  },

  /**
   * Render User Summary
   *
   * @function
   */
  renderUserSummary: function () {
    var user = SL.current_deck.get('user');

    this.$summaryBubbleContent.html([
      '<h4>' + SL.current_deck.get('title') + '</h4>',
      '<p>By ' + (user.name || user.username) + '</p>'].join(''));
  },

  /**
   * Render Waiting Summary
   *
   * @function
   */
  renderWaitingSummary: function () {
    this.$summaryBubbleContent.html([
      '<h4>',
        SL.locale.get('Deck.client.wait_summary_title'),
      '</h4>',
      '<p class="retry-status"></p>'].join(''));

    this.$summaryBubbleRetryStatus =
      this.$summaryBubbleContent.find('.retry-status');
  },

  /**
   * Render Connection Lost Summary
   *
   * @function
   */
  renderConnectionLostSummary: function () {
    this.$summaryBubbleContent.html([
      '<h4>',
        SL.locale.get('Deck.client.lost_summary_title'),
      '</h4>',
      '<p>',
        SL.locale.get('Deck.client.loas_summary_des'),
      '</p>'].join(''));
  },

  /**
   * Open Update Timer
   *
   * @function
   */
  startUpdatingTimer: function () {
    var updateCb = (function () {
      if (this.$summaryBubbleRetryStatus &&
        this.$summaryBubbleRetryStatus.length) {
        var retryInterval = SL.helpers.StreamLive.CONNECTION_RETRY_INTERVAL,
          date = Date.now() - this.stream.getRetryStartTime(),
          time = Math.ceil((retryInterval - date) / 1000),
          str  = '';

        if (isNaN(time)) {
          str = SL.locale.get('Deck.client.retry');
        } else if (time > 0) {
          str = SL.locale.get('Deck.client.retry_in') + time + 's';
        } else {
          str = SL.locale.get('Deck.client.retry_now');
        }

        this.$summaryBubbleRetryStatus.text(str);
      }
    }).bind(this);

    window.clearInterval(this.updateTimerInterval);
    this.updateTimerInterval = setInterval(updateCb, 100);

    updateCb();
  },

  /**
   * Close Update Timer
   *
   * @function
   */
  stopUpdatingTimer: function () {
    window.clearInterval(this.updateTimerInterval);
  },

  /**
   * Bind Mouse Event
   *
   * @function
   */
  bind: function () {
    this.$summaryBubble.on('mouseover', this.expandSummary.bind(this));
    this.$summaryBubble.on('mouseout', this.collapseSummary.bind(this));
  },

  /**
   * Mouse Over Event To Expand Summary
   *
   * @function
   * @param evt
   */
  expandSummary: function (evt) {
    clearTimeout(this.collapseSummaryTimeout);

    var width = window.innerWidth -
      (this.$summaryBubbleContent.find('h4, p').offset().left + 40);

    width = Math.min(width, 400);
    this.$summaryBubbleContent.find('h4, p').css('max-width', width);
    this.$summaryBubble.width(
      this.$summaryBubble.height() + this.$summaryBubbleContent.outerWidth());

    if (typeof evt === "number") {
      this.collapseSummaryTimeout =
        setTimeout(this.collapseSummary.bind(this), evt);
    }
  },

  /**
   * Mouse Over Event To Expand Summary Error
   *
   * @function
   */
  expandSummaryError: function () {
    this.summaryBubbleError = true;
    this.expandSummary();
  },

  /**
   * Mouse Over Event To Collapse Summary
   *
   * @function
   */
  collapseSummary: function () {
    if (!this.summaryBubbleError) {
      clearTimeout(this.collapseSummaryTimeout);
      this.$summaryBubble.width(this.$summaryBubble.height());
    }
  },

  /**
   * Setting Present Controls Parameters
   *
   * @function
   * @param {Object} setting -The Setting Parameters
   */
  setPresentControls: function (setting) {
    if (typeof setting !== "boolean") {
      setting.present_controls = SL.config.PRESENT_CONTROLS_DEFAULT;
      return;
    }

    this.$summaryBubble.toggle(setting);
  },

  setPresentNotes: function (setting) {
    window.Reveal.configure({
      showNotes: setting
    })
  },

  /**
   * Setting Present UpSizing Parameters
   *
   * @function
   * @param {Object} setting -The Setting Parameters
   */
  setPresentUpSizing: function (setting) {
    if (typeof setting !== "boolean") {
      setting.present_upsizing = SL.config.PRESENT_UPSIZING_DEFAULT;
      return;
    }

    window.Reveal.configure({
      maxScale: setting ? SL.config.PRESENT_UPSIZING_MAX_SCALE : 1
    });
  },

  onRevealReady : function () {
    this.setPresentControls(SL.current_deck.user_settings.get('present_controls'));
    this.setPresentNotes(SL.current_deck.user_settings.get('present_notes'));
    this.setPresentUpSizing(SL.current_deck.user_settings.get('present_upsizing'))
  },

  /**
   * Live Stream Ready Callback
   *
   * @function
   */
  onStreamReady: function () {
    this.expandSummary(5000);
  },

  /**
   * Live Stream State Changed Callback
   *
   * @function
   * @param {Object} setting -The Setting Parameters
   */
  onStreamStateChanged: function (setting) {
    if (setting && typeof setting.present_controls === "boolean") {
      this.setPresentControls(setting.present_controls);
    }

    if (setting && typeof setting.present_notes === "boolean") {
      this.setPresentControls(setting.present_notes);
    }

    if (setting && typeof setting.present_upsizing === "boolean") {
      this.setPresentUpSizing(setting.present_upsizing);
    }
  },

  /**
   * Live Stream Status Changed Callback
   *
   * @function
   * @param {String} status -The Stream Live Status
   */
  onStreamStatusChanged: function (status) {
    if (SL.helpers.StreamLive.STATUS_WAITING_FOR_PUBLISHER === status) {
      this.renderWaitingSummary();
      this.expandSummaryError();
      this.startUpdatingTimer();
    } else if (SL.helpers.StreamLive.STATUS_CONNECTION_LOST === status) {
      this.renderConnectionLostSummary();
      this.expandSummaryError();
      this.stopUpdatingTimer();
    } else {
      this.summaryBubbleError = false;
      this.renderUserSummary();
      this.stopUpdatingTimer();
    }
  }
});

SL('views.decks').LiveServer          = SL.views.Base.extend({
  /**
   * Constructor SL.views.decks.LiveServer Instance
   *
   * @function
   */
  init: function () {
    this._super();

    SL.util.setupReveal({
      history:         true,
      openLinksInTabs: true,
      trackEvents:     true,
      showNotes: SL.current_deck.get('share_notes') && SL.current_user.settings.get('present_notes'),
      controls:  SL.current_user.settings.get('present_controls'),
      progress:  SL.current_user.settings.get('present_controls'),
      maxScale:  SL.current_user.settings.get('present_upsizing') ?
        SL.config.PRESENT_UPSIZING_MAX_SCALE : 1
    });

    this.stream = new SL.helpers.StreamLive({
      publisher: true
    });
    this.stream.connect();

    this.render();

    SL.helpers.PageLoader.waitForFonts();
  },

  /**
   * Render Controls Dom
   *
   * @function
   */
  render: function () {
    var speakerUrl = SL.current_deck.getURL({
        view: 'speaker'
      });

    this.$presentationControls = $([
      '<aside class="presentation-controls">',
        '<div class="presentation-controls-content">',
          '<h2>' + SL.locale.get('Deck.server.title') + '</h2>',

          '<div class="presentation-controls-section">',
            '<h2>' + SL.locale.get('Deck.server.speaker_title') + '</h2>',
            '<p>' + SL.locale.get('Deck.server.speaker_des') + '</p>',
            '<a class="button l outline" href="' + speakerUrl + '" target="_blank">',
              SL.locale.get('Deck.server.speaker_btn'),
            '</a>',
          '</div>',

          '<div class="presentation-controls-section">',
            '<h2>' + SL.locale.get('Deck.server.live_title') + '</h2>',
            '<p>' + SL.locale.get('Deck.server.live_des') + '</p>',
            '<div class="live-share"></div>',
          '</div>',

          '<div class="presentation-controls-section sl-form">',
            '<h2>' + SL.locale.get('Deck.server.opt_title') + '</h2>',
            '<div class="sl-checkbox outline fullscreen-toggle">',
              '<input id="fullscreen-checkbox" type="checkbox">',
              '<label for="fullscreen-checkbox">',
                SL.locale.get('Deck.server.opt_fullscreen_btn'),
              '</label>',
            '</div>',
            '<div class="sl-checkbox outline controls-toggle" data-tooltip="' +
              SL.locale.get('Deck.server.opt_hidectrl_tip') + '" data-tooltip-alignment="r" ' +
              'data-tooltip-delay="500" data-tooltip-maxwidth="250">',
              '<input id="controls-checkbox" type="checkbox">',
              '<label for="controls-checkbox">',
                SL.locale.get('Deck.server.opt_hidectrl_btn'),
              '</label>',
            '</div>',
            '<div class="sl-checkbox outline notes-toggle" data-tooltip="' +
              SL.locale.get('Deck.server.opt_hidenote_tip') + '" data-tooltip-alignment="r" ' +
              'data-tooltip-delay="500" data-tooltip-maxwidth="250">',
              '<input id="controls-checkbox" type="checkbox">',
              '<label for="controls-checkbox">',
                SL.locale.get('Deck.server.opt_hidenote_btn'),
              '</label>',
            '</div>',
            '<div class="sl-checkbox outline upsizing-toggle" data-tooltip="' +
              SL.locale.get('Deck.server.opt_disable_upsize_tip') + '" data-tooltip-alignment="r" ' +
              'data-tooltip-delay="500" data-tooltip-maxwidth="300">',
              '<input id="upsizing-checkbox" type="checkbox">',
              '<label for="upsizing-checkbox">',
                SL.locale.get('Deck.server.opt_disable_upsize_btn'),
              '</label>',
            '</div>',
          '</div>',

        '</div>',
        '<footer class="presentation-controls-footer">',
          '<button class="button xl positive start-presentation">',
            SL.locale.get('Deck.server.opt_start'),
          '</button>',
        '</footer>',
      '</aside>'].join('')).appendTo(document.body);

    this.presentationControlsScrollShadow =
      new SL.components.ScrollShadow({
        $parentElement: this.$presentationControls,
        $contentElement: this.$presentationControls.find('.presentation-controls-content'),
        $footerElement: this.$presentationControls.find('.presentation-controls-footer')
      });

    this.$presentationControls
      .find('.live-view-url')
      .on('mousedown', this.onLiveURLMouseDown.bind(this));
    this.$presentationControls
      .find('.fullscreen-toggle')
      .on('click', this.onFullScreenToggled.bind(this));
    this.$presentationControls
      .find('.controls-toggle')
      .on('click', this.onControlsToggled.bind(this));
    this.$presentationControls
      .find('.notes-toggle')
      .on('click', this.onNotesToggled.bind(this));
    this.$presentationControls
      .find('.upsizing-toggle')
      .on('click', this.onUpSizingToggled.bind(this));
    this.$presentationControls
      .find('.button.start-presentation')
      .on('click', this.onStartPresentationClicked.bind(this));
    $(document).on('webkitfullscreenchange mozfullscreenchange ' +
      'MSFullscreenChange fullscreenchange', this.onFullScreenChange.bind(this));

    if (SL.helpers.Fullscreen.isEnabled() === false) {
      this.$presentationControls.find('.fullscreen-toggle').hide();
    }

    if (!SL.current_deck.get('share_notes')) {
      this.$presentationControls.find('.notes-toggle').hide();
    }

    this.syncPresentationControls();
    this.renderLiveShare();
  },

  /**
   * Sync Controls From Server
   *
   * @function
   */
  syncPresentationControls: function () {
    this.$presentationControls
      .find('.fullscreen-toggle input')
      .prop('checked', SL.helpers.Fullscreen.isActive());
    this.$presentationControls
      .find('.controls-toggle input')
      .prop('checked', !SL.current_user.settings.get('present_controls'));
    this.$presentationControls
      .find('.upsizing-toggle input')
      .prop('checked', !SL.current_user.settings.get('present_upsizing'));
    this.$presentationControls
      .find('.notes-toggle input')
      .prop('checked', !SL.current_user.settings.get('present_notes'));
  },

  /**
   * Render Live Share
   *
   * @function
   */
  renderLiveShare: function () {
    this.$liveShareElement = this.$presentationControls.find('.live-share');

    if (SL.current_deck.isVisibilityAll()) {
      this.showLiveShareLink(SL.current_deck.getURL({
        view: 'live'
      }));
    } else {
      this.$liveShareElement
        .html('<div class="spinner" data-spinner-color="#777"></div>');

      SL.util.html.generateSpinners();

      SL.data.tokens.get(SL.current_deck.get('id'), {
        success: (function (data) {
          this.tokens = data;

          if (this.tokens.size() === 0) {
            this.showLiveShareLinkGenerator();
          } else {
            this.showLiveShareLink(SL.current_deck.getURL({
              view: 'live',
              token: this.tokens.first()
            }));
          }
        }).bind(this),
        error: (function () {
          SL.notify(SL.locale.get('Generic_Error'), 'negative');
          this.$liveShareElement.html([
            '<p class="live-view-error">',
              'Failed to generate link',
            '</p>'].join(''));
        }).bind(this)
      });
    }
  },

  /**
   * Show Live Share Link Create Button
   *
   * @function
   */
  showLiveShareLinkGenerator: function () {
    this.$liveShareElement.html([
      '<p>',
        SL.locale.get('Deck.server.live_create_title'),
      '</p>',
      '<button class="button l outline ladda-button" data-style="zoom-out" data-spinner-color="#222">',
        SL.locale.get('Deck.server.live_create_btn'),
      '</button>'].join(''));

    var $shareBtn = this.$liveShareElement.find('.button'),
      ladda = window.Ladda.create($shareBtn.get(0));

    $shareBtn.on('click', (function () {
      ladda.start();

      SL.data.tokens.create(SL.current_deck.get('id'), {
        success: (function (data) {
          this.showLiveShareLink(SL.current_deck.getURL({
            view: 'live',
            token: data
          }));

          ladda.stop();
        }).bind(this),
        error: (function () {
          SL.notify(SL.locale.get('Generic_Error'), 'negative');
          ladda.stop();
        }).bind(this)
      });
    }).bind(this));
  },

  /**
   * Show Live Share Link
   *
   * @function
   * @param {String} url -The Show Live Share Link Url
   */
  showLiveShareLink: function (url) {
    this.$liveShareElement
      .html('<input class="live-view-url input-field" type="text" value="' + url +
      '" readonly />');
    this.$liveShareElement
      .find('.live-view-url')
      .on('mousedown', this.onLiveURLMouseDown.bind(this));
  },

  /**
   * Show Status
   *
   * @function
   * @param {String} status -The Status String
   */
  showStatus: function (status) {
    if (this.$statusElement) {
      this.$statusElement.find('.stream-status-message').html(status);
    } else {
      this.$statusElement = $([
        '<div class="stream-status">',
          '<p class="stream-status-message">' + status + '</p>',
        '</div>'].join('')).appendTo(document.body);
    }
  },

  /**
   * Clear Status
   *
   * @function
   */
  clearStatus: function () {
    if (this.$statusElement) {
      this.$statusElement.remove();
      this.$statusElement = null;
    }
  },

  /**
   * Save Options
   *
   * @function
   * @param {String} optionStr -The Save Option Name
   */
  savePresentOption: function (optionStr) {
    this.xhrRequests = this.xhrRequests || {};

    if (this.xhrRequests[optionStr]) {
      this.xhrRequests[optionStr].abort();
    }

    var settings = {
      url:     SL.config.AJAX_UPDATE_USER_SETTINGS,
      type:    'PUT',
      context: this,
      data: {
        user_settings: {}
      }
    };
    settings.data.user_settings[optionStr] =
      SL.current_user.settings.get(optionStr);

    this.xhrRequests[optionStr] = $.ajax(settings).always(function () {
      this.xhrRequests[optionStr] = null;
    });
  },

  /**
   * Mouse Down Callback
   *
   * @function
   * @param {Event} evt -The Click Event
   */
  onLiveURLMouseDown: function (evt) {
    $(evt.target).focus().select();
    evt.preventDefault();
  },

  /**
   * Click Callback
   *
   * @function
   * @param {Event} evt -The Click Event
   */
  onControlsToggled: function (evt) {
    evt.preventDefault();

    var controls = !window.Reveal.getConfig().controls;
    SL.current_user.settings.set('present_controls', controls);

    window.Reveal.configure({
      controls: controls,
      progress: controls
    });

    this.syncPresentationControls();
    this.savePresentOption('present_controls');

    this.stream.publish(null, {
      present_controls: controls
    });
  },

  onNotesToggled: function (evt) {
    evt.preventDefault();

    var showNotes = !Reveal.getConfig().showNotes;

    SL.current_user.settings.set('present_notes', showNotes);
    Reveal.configure({showNotes : showNotes});
    this.syncPresentationControls();
    this.savePresentOption('present_notes');
    this.stream.publish(null, {present_notes : showNotes});
  },

  /**
   * Click Callback
   *
   * @function
   * @param {Event} evt -The Click Event
   */
  onUpSizingToggled: function (evt) {
    evt.preventDefault();

    var isMaxScale = window.Reveal.getConfig().maxScale <= 1;
    SL.current_user.settings.set('present_upsizing', isMaxScale);

    window.Reveal.configure({
      maxScale: isMaxScale ? SL.config.PRESENT_UPSIZING_MAX_SCALE : 1
    });

    this.syncPresentationControls();
    this.savePresentOption('present_upsizing');

    this.stream.publish(null, {
      present_upsizing: isMaxScale
    });
  },

  /**
   * Click Callback
   *
   * @function
   * @param {Event} evt -The Click Event
   */
  onFullScreenToggled: function (evt) {
    evt.preventDefault();
    SL.helpers.Fullscreen.toggle();
  },

  /**
   * Change Callback
   *
   * @function
   */
  onFullScreenChange: function () {
    this.syncPresentationControls();
    window.Reveal.layout();
  },

  /**
   * Click Callback
   *
   * @function
   */
  onStartPresentationClicked: function () {
    $('html').addClass('presentation-started');
  }
});

SL('views.decks').Speaker             = SL.views.Base.extend({
  /**
   * Constructor SL.views.decks.Speaker Instance
   *
   * @function
   */
  init: function () {
    this._super();

    this.$notesElement       = $('.speaker-controls .notes');
    this.$notesValue         = $('.speaker-controls .notes .value');
    this.$timeElement        = $('.speaker-controls .time');
    this.$timeTimerValue     = $('.speaker-controls .time .timer-value');
    this.$timeClockValue     = $('.speaker-controls .time .clock-value');
    this.$subscribersElement = $('.speaker-controls .subscribers');
    this.$subscribersValue   = $('.speaker-controls .subscribers .subscribers-value');
    this.$currentElement     = $('.current-slide');
    this.$upcomingElement    = $('.upcoming-slide');
    this.$upcomingFrame      = $('.upcoming-slide iframe');
    this.$upcomingJumpTo     = $('.upcoming-slide-jump-to');

    if (this.$upcomingFrame.length) {
      this.$upcomingFrame.on('load', this.onUpcomingFrameLoaded.bind(this));
      this.$upcomingFrame.attr('src', this.$upcomingFrame.attr('data-src'));
    } else {
      this.setup();
    }

    SL.helpers.PageLoader.show();
  },

  /**
   * Setup Component
   *
   * @function
   */
  setup: function () {
    window.Reveal.addEventListener('ready', (function () {
      this.currentReveal = window.Reveal;
      this.currentReveal
        .addEventListener('slidechanged', this.onCurrentSlideChanged.bind(this));
      this.currentReveal
        .addEventListener('fragmentshown', this.onCurrentFragmentChanged.bind(this));
      this.currentReveal
        .addEventListener('fragmenthidden', this.onCurrentFragmentChanged.bind(this));
      this.currentReveal
        .addEventListener('paused', this.onCurrentPaused.bind(this));
      this.currentReveal
        .addEventListener('resumed', this.onCurrentResumed.bind(this));

      if (this.$upcomingFrame.length) {
        this.upcomingReveal = this.$upcomingFrame.get(0).contentWindow.Reveal;
        this.upcomingReveal.configure({
          history:              false,
          controls:             false,
          progress:             false,
          overview:             false,
          autoSlide:            0,
          transition:           'none',
          backgroundTransition: 'none'
        });

        this.upcomingReveal
          .addEventListener('slidechanged', this.onUpcomingSlideChanged.bind(this));
        this.upcomingReveal
          .addEventListener('fragmentshown', this.onUpcomingFragmentChanged.bind(this));
        this.upcomingReveal
          .addEventListener('fragmenthidden', this.onUpcomingFragmentChanged.bind(this));

        this.$upcomingFrame.get(0).contentWindow.document.body.className += ' no-transition';

        this.$upcomingJumpTo.on('vclick', this.onJumpToUpcomingSlide.bind(this));
        this.syncJumpButton();
      }


      this.setupTimer();
      this.setupTouch();

      this.stream = new SL.helpers.StreamLive({
        reveal:    this.currentReveal,
        publisher: true
      });
      this.stream.ready.add(this.onStreamReady.bind(this));
      this.stream.subscribersChanged.add(this.onStreamSubscribersChange.bind(this));
      this.stream.connect();

      this.layout();
      window.addEventListener('resize', this.layout.bind(this))
    }).bind(this));

    SL.util.setupReveal({
      touch:           true,
      history:         false,
      autoSlide:       0,
      openLinksInTabs: true,
      trackEvents:     true
    });
  },

  /**
   * Setup Touch
   *
   * @function
   */
  setupTouch: function () {
    if ($('html').hasClass('speaker-mobile') &&
      (SL.util.device.HAS_TOUCH || window.navigator.pointerEnabled)) {
      this.$touchControls = $([
        '<div class="touch-controls">',
          '<div class="touch-controls-content">',
            '<span class="status">',
              'Tap or Swipe to change slide',
            '</span>',
            '<span class="slide-number"></span>',
          '</div>',
          '<div class="touch-controls-progress"></div>',
        '</div>'].join('')).appendTo(document.body);
      this.$touchControlsProgress    = this.$touchControls.find('.touch-controls-progress');
      this.$touchControlsSlideNumber = this.$touchControls.find('.slide-number');
      this.$touchControlsStatus      = this.$touchControls.find('.status');

      window.setTimeout((function () {
        this.$touchControls.addClass('visible');
      }).bind(this), 1000);

      var hammer = new window.Hammer(document.body);
      hammer.get('swipe').set({
        direction: window.Hammer.DIRECTION_ALL
      });
      hammer.get('press').set({
        threshold: 1000
      });
      hammer.on('swipe', (function (evt) {
        switch (evt.direction) {
          case window.Hammer.DIRECTION_LEFT:
            this.currentReveal.right();
            this.showTouchStatus('Previous slide');
            break;
          case window.Hammer.DIRECTION_RIGHT:
            this.currentReveal.left();
            this.showTouchStatus('Next slide');
            break;
          case window.Hammer.DIRECTION_UP:
            this.currentReveal.down();
            this.showTouchStatus('Previous vertical slide');
            break;
          case window.Hammer.DIRECTION_DOWN:
            this.currentReveal.up();
            this.showTouchStatus('Next vertical slide');
          default:
            break;
        }
      }).bind(this));
      hammer.on('tap', (function () {
        this.currentReveal.next();
        this.showTouchStatus('Next slide');
      }).bind(this));
      hammer.on('press', (function () {
        if (this.currentReveal.isPaused()) {
          this.currentReveal.togglePause(false);
          this.showTouchStatus('Resumed');
        }
      }).bind(this));
    }
  },

  /**
   * Setup Timer
   *
   * @function
   */
  setupTimer: function () {
    this.$timeTimerValue.on('click', this.restartTimer.bind(this));
    this.restartTimer();
    window.setInterval(this.syncTimer.bind(this), 1000);
  },

  /**
   * Restart Timer
   *
   * @function
   */
  restartTimer: function () {
    this.startTime = Date.now();
    this.syncTimer();
  },

  /**
   * Resize
   *
   * @function
   */
  layout: function () {
    if (!this.isMobileSpeakerView()) {
      var height = window.innerHeight - this.$notesValue.offset().top - 10;

      if (this.$subscribersElement.hasClass('visible')) {
        height -= this.$subscribersElement.outerHeight();
      }

      this.$notesValue.height(height);
    }
  },

  /**
   * Sync
   *
   * @function
   */
  sync: function () {
    window.setTimeout((function () {
      this.syncUpcomingSlide();
      this.syncTouchControls();
      this.syncNotes();
      this.syncTimer();
    }).bind(this), 1);
  },

  /**
   * Sync Timer
   *
   * @function
   */
  syncTimer: function () {
    var momentData = window.moment();

    this.$timeClockValue.html(
      momentData.format('hh:mm') + ' <span class="dim">' +
      momentData.format('A') + '<span>');
    momentData.hour(0).minute(0).second((Date.now() - this.startTime) / 1e3);

    var hour = momentData.format('HH') + ':',
      minute = momentData.format('mm') + ':',
      second = momentData.format('ss');

    if (hour === '00:') {
      hour = '<span class="dim">' + hour + '</span>';

      if (minute === '00:') {
        minute = '<span class="dim">' + minute + '</span>';
      }
    }

    this.$timeTimerValue.html(hour + minute + second);
  },

  /**
   * Sync Upcoming Slide
   *
   * @function
   */
  syncUpcomingSlide: function () {
    if (this.upcomingReveal) {
      var indices = this.currentReveal.getIndices();

      this.upcomingReveal.slide(indices.h, indices.v, indices.f);
      this.upcomingReveal.next();

      var comingIndices = this.upcomingReveal.getIndices();

      this.$upcomingElement
        .toggleClass(
        'is-last-slide',
        indices.h === comingIndices.h &&
        indices.v === comingIndices.v &&
        indices.f === comingIndices.f);
    }
  },

  syncJumpButton: function () {
    if (this.upcomingReveal) {
      var cur = this.currentReveal.getIndices(),
        up = this.upcomingReveal.getIndices();

      this.$upcomingJumpTo.toggleClass(
        'hidden',
        cur.h === up.h && cur.v === up.v && cur.f === up.f);
    }
  },

  /**
   * Sync Notes
   *
   * @function
   */
  syncNotes: function () {
    var note =
      $(this.currentReveal.getCurrentSlide()).attr('data-notes') || '';

    if (note) {
      this.$notesElement.show();
      this.$notesValue.text(note);
      this.$notesElement.removeAttr('data-note-length');

      if (note.length < 0.4 * SL.config.SPEAKER_NOTES_MAXLENGTH) {
        this.$notesElement.attr('data-note-length', 'short');
      } else if (note.length > 0.7 * SL.config.SPEAKER_NOTES_MAXLENGTH) {
        this.$notesElement.attr('data-note-length', 'long');
      }
    } else {
      this.$notesElement.hide();
    }
  },

  /**
   * Sync Touch Controls
   *
   * @function
   */
  syncTouchControls: function () {
    if (this.$touchControls) {
      var progress = this.currentReveal.getProgress();

      this.$touchControlsProgress.css({
        '-webkit-transform': 'scale(' + progress + ', 1)',
        '-moz-transform':    'scale(' + progress + ', 1)',
        '-ms-transform':     'scale(' + progress + ', 1)',
        transform:           'scale(' + progress + ', 1)'
      });

      var sectionNum = $('.reveal .slides section:not(.stack)').length,
        num = this.currentReveal.getIndices().h + this.currentReveal.getIndices().v;

      num += $('.reveal .slides>section.present')
        .prevAll('section').find('>section:gt(0)').length;
      num += 1;

      this.$touchControlsSlideNumber.html(num + '/' + sectionNum);
    }
  },

  /**
   * Show Touch Status
   *
   * @function
   * @param {String} status -The Tooltip Status
   */
  showTouchStatus: function (status) {
    clearTimeout(this.touchControlsStatusTimeout);

    var isPaused = this.currentReveal && this.currentReveal.isPaused();

    if (isPaused) {
      status = 'Paused (tap+hold to resume)';
    }

    if (this.$touchControlsStatus) {
      this.$touchControlsStatus.text(status).removeClass('hidden');

      if (!isPaused) {
        this.touchControlsStatusTimeout = window.setTimeout((function () {
          this.$touchControlsStatus.addClass('hidden');
        }).bind(this), 1000);
      }
    }
  },

  isMobileSpeakerView: function () {
    return $('html').hasClass('speaker-mobile');
  },

  /**
   * Upcoming Frame Loaded Callback
   *
   * @function
   */
  onUpcomingFrameLoaded: function () {
    this.setup();
  },

  /**
   * Stream Ready Callback
   *
   * @function
   */
  onStreamReady: function () {
    SL.helpers.PageLoader.hide();
    this.sync();
  },

  /**
   * Stream Subscriber Change Callback
   *
   * @function
   * @param {Number} num -The Subscriber Count
   */
  onStreamSubscribersChange: function (num) {
    if (typeof this.subscriberCount === "number") {
      this.$subscribersValue.removeClass('flash green flash-red');

      if (num > this.subscriberCount) {
        window.setTimeout((function () {
          this.$subscribersValue.addClass('flash-green');
        }).bind(this), 1);
      } else if (num < this.subscriberCount) {
        window.setTimeout((function () {
          this.$subscribersValue.addClass('flash-red');
        }).bind(this), 1);
      }
    }

    this.subscriberCount = num;

    if (this.subscriberCount > 0) {
      this.$subscribersValue.html('<span class="icon i-eye"></span>' + num);
      this.$subscribersElement.addClass('visible');
    } else {
      this.$subscribersElement.removeClass('visible');
    }
  },

  /**
   * Current Slide Change Callback
   *
   * @function
   */
  onCurrentSlideChanged: function () {
    this.sync();
  },

  /**
   * Current Fragment Change Callback
   *
   * @function
   */
  onCurrentFragmentChanged: function () {
    this.sync();
  },

  /**
   * Current Pause Callback
   *
   * @function
   */
  onCurrentPaused: function () {
    if (!this.$pausedInstructions) {
      this.$pausedInstructions =
        $('<h3 class="message-overlay">' +
            'Paused. Press the "B" key to resume.' + '</h3>');

      this.$pausedInstructions.appendTo(this.$currentElement);
      this.$pausedInstructions.addClass('visible');
    }
  },

  /**
   * Current Resume Callback
   *
   * @function
   */
  onCurrentResumed: function () {
    if (this.$pausedInstructions) {
      this.$pausedInstructions.remove();
      this.$pausedInstructions = null;
    }
  },

  /**
   * @function
   */
  onUpcomingSlideChanged: function () {
    this.syncJumpButton();
  },

  onUpcomingFragmentChanged: function () {
    this.syncJumpButton();
  },

  onJumpToUpcomingSlide: function () {
    var indices = this.upcomingReveal.getIndices();
    this.currentReveal.slide(indices.h, indices.v, indices.f);
    this.syncUpcomingSlide();
  }
});

SL('views.decks').Export              = SL.views.Base.extend({
  /**
   * Constructor SL.views.decks.Export Instance
   *
   * @function
   */
  init: function () {
    this._super();

    SL.util.setupReveal({
      history: !navigator.userAgent.match(/(iphone|ipod|ipad|android)/gi),
      openLinksInTabs: true,
      trackEvents:     true
    });
  }
});

SL('views.decks').Fullscreen          = SL.views.Base.extend({
  /**
   * Constructor SL.views.decks.Fullscreen Instance
   *
   * @function
   */
  init: function () {
    this._super();

    SL.util.setupReveal({
      history: !navigator.userAgent.match(/(iphone|ipod|ipad|android)/gi),
      openLinksInTabs: true,
      trackEvents:     true,
      maxScale:        SL.config.PRESENT_UPSIZING_MAX_SCALE
    });
  }
});

SL('views.decks').Password            = SL.views.Base.extend({
  OUTRO_DURATION: 600,

  /**
   * Constructor SL.views.decks.Password Instance
   *
   * @function
   */
  init: function () {
    this._super();

    this.$domElement   = $('.password-content');
    this.$formElement  = this.$domElement.find('.sl-form');
    this.$inputElement = this.$formElement.find('.password-input');
    this.$submitButton = this.$formElement.find('.password-submit');
    this.$iconElement  = $('.password-icon');
    this.$titleElement = $('.password-title');

    this.submitLoader  = window.Ladda.create(this.$submitButton.get(0));
    this.incorrectPasswordCounter = 0;
    this.incorrectPasswordMessages = [
      'Wrong password, please try again',
      'Still wrong, give it another try',
      'That one was wrong too',
      'Nope'];

    this.$submitButton.on('vclick', this.onSubmitClicked.bind(this));
    $(document).on('keydown', this.onKeyDown.bind(this));
  },

  /**
   * Submit Password To Server
   *
   * @function
   */
  submit: function () {
    if (!this.request) {
      this.submitLoader.start();
      this.$iconElement.removeClass('wobble');

      this.request = $.ajax({
        url: SL.config.AJAX_ACCESS_TOKENS_PASSWORD_AUTH(SLConfig.access_token_id),
        type:   'PUT',
        context: this,
        data: {
          access_token: {
            password: this.$inputElement.val()
          }
        }
      }).done(function () {
        this.$domElement.addClass('outro');
        this.$titleElement.text('All set! Loading deck...');

        window.setTimeout(function () {
          window.location.reload();
        }, this.OUTRO_DURATION);
      }).fail(function () {
        this.submitLoader.stop();
        this.$titleElement.text(this.getIncorrectPasswordMessage());
        this.$iconElement.addClass('wobble');
        this.request = null;
      });
    }
  },

  /**
   * Get Error Password Message
   *
   * @function
   * @returns {String} Error Message
   */
  getIncorrectPasswordMessage: function () {
    var index =
      this.incorrectPasswordCounter % this.incorrectPasswordMessages.length;
    this.incorrectPasswordCounter += 1;

    return this.incorrectPasswordMessages[index];
  },

  /**
   * Click Callback
   *
   * @function
   * @param {Event} evt -The Click Event
   */
  onSubmitClicked: function (evt) {
    evt.preventDefault();
    this.submit();
  },

  /**
   * Key Down Callback
   *
   * @function
   * @param {Event} evt -The Key Down Event
   */
  onKeyDown: function (evt) {
    if (evt.keyCode === 13) {
      evt.preventDefault();
      this.submit();
    }
  }
});


/*!
 * project name: SlideStudio
 * name:         devise.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/12
 */

'use strict';

SL('views.devise').All  = SL.views.Base.extend({
  /**
   * Constructor SL.views.devise.All Instance
   *
   * @function
   */
  init: function () {
    this._super();
    this.setupForm();

    $('.auth-button.email.toggle').on('vclick', function (evt) {
      evt.preventDefault();

      var $auth = $('.auth-option.email-auth');
      $auth.toggleClass('hidden');

      if ($auth.hasClass('hidden') === false) {
        $auth.find('input[type="text"], input[type="email"]').first().focus();
      }
    });
  },

  /**
   * Submit Form
   *
   * @function
   */
  setupForm: function () {
    this.$formElement = $('form');

    if (this.$formElement.length) {
      this.$formElement
        .find('.unit[data-validate]')
        .each(function (index, item) {
          new SL.components.FormUnit(item);
        });

      var $submitBtn = this.$formElement.find('button[type=submit]');

      if ($submitBtn.length) {
        this.$formElement.on('submit', (function (evt) {
          if (!evt.isDefaultPrevented()) {
            if ($('.g-recaptcha').length &&
              typeof window.grecaptcha !== "undefined" &&
              typeof window.grecaptcha.getResponse === "function" &&
              !window.grecaptcha.getResponse()) {
              SL.notify(SL.locale.get('Devise.all_setup_form'));

              evt.preventDefault();
              return false;
            }

            window.Ladda.create($submitBtn.get(0)).start();
          }
        }).bind(this));
      }
    }
  }
});

SL('views.devise').Edit = SL.views.devise.All.extend({
  /**
   * Constructor SL.views.devise.Edit Instance
   *
   * @function
   */
  init: function () {
    this._super();

    this.changedProfile = false;

    $('.delete-account-toggle')
      .on('click', this.onDeleteAccountToggleClicked.bind(this));
    $('.delete-profile-photo')
      .on('click', this.onDeleteProfilePhotoClicked.bind(this));
    $('#user_email')
      .on('change keyup', this.onEmailChanged.bind(this));
    $('#user_password')
      .on('change keyup', this.onNewPasswordChanged.bind(this));

    $('.description input')
      .on('change', this.onUploadInputChanged.bind(this));

    this.undoAutoFill();
  },

  /**
   * Undo Auto Fill
   *
   * @function
   */
  undoAutoFill: function () {
    if (navigator.userAgent.toLowerCase().indexOf('chrome') >= 0) {
      var timer = window.setInterval(function () {
        var $input = $("input:-webkit-autofill");

        if ($input.length > 0) {
          window.clearInterval(timer);

          $input.each(function () {
            var input = $(this).clone(true, true),
              $unit = input.parent('.unit');

            if (input.is('[type=password]')) {
              input.val('');
            }

            $(this).after(input).remove();

            if ($unit.length) {
              new SL.components.FormUnit($unit);
            }
          });
        }
      }, 20);
    }
  },

  /**
   * Update Password Verification
   *
   * @function
   */
  updatePasswordVerification: function () {
    var $emailUnit    = $('#user_email').parents('.unit'),
      $pwdUnit        = $('#user_password').parents('.unit'),
      $curPwdUnit     = $('#user_current_password').parents('.unit'),
      emailController = $emailUnit.data('controller'),
      pwdController   = $pwdUnit.data('controller');


    if (emailController && pwdController &&
      emailController.isUnchanged() &&
      pwdController.isUnchanged()) {
      $curPwdUnit.removeAttr('data-required');
      $curPwdUnit.addClass('hidden');
    } else {
      $curPwdUnit.attr('data-required', 'true');
      $curPwdUnit.removeClass('hidden');
    }
  },

  /**
   * Delete Account Toggle Click Callback
   *
   * @function
   * @param {Event} evt -The Click Event
   */
  onDeleteAccountToggleClicked: function (evt) {
    evt.preventDefault();
    $('.delete-account').toggleClass('visible');
  },

  /**
   * Delete Profile Photo Click Callback
   *
   * @function
   * @param {Event} evt -The Click Event
   */
  onDeleteProfilePhotoClicked: function (evt) {
    evt.preventDefault();

    $.ajax({
      url:     SL.config.AJAX_UPDATE_USER,
      type:    'PUT',
      context: this,
      data: {
        user: {
          avatar: ''
        }
      }
    }).done(function () {
      $('.photo-editor').attr('data-photo-type', 'gravatar');
    }).fail(function () {
      SL.notify(SL.locale.get('Devise.edit_photo_err'), 'negative');
    });
  },

  /**
   * Email Change Click Callback
   *
   * @function
   */
  onEmailChanged: function () {
    this.updatePasswordVerification();
  },

  /**
   * Password Change Click Callback
   *
   * @function
   */
  onNewPasswordChanged: function () {
    this.updatePasswordVerification();
  },

  /**
   * Upload User Profile Image
   *
   * @function
   */
  onUploadInputChanged: function () {
    var file = SL.util.toArray($('.description input').get(0).files)[0];

    if (file && file.type.match(/image.*/)) {
      if (typeof file.size === "number" &&
        file.size / 1024 > SL.config.MAX_IMAGE_UPLOAD_SIZE.maxsize) {
        return void SL.notify(SL.locale.get('Devise.upload_img_type', {
            size: Math.round(SL.config.MAX_IMAGE_UPLOAD_SIZE / 1000)
          }), 'negative');
      } else {
        if (this.fileUploader) {
          this.fileUploader.destroy();
        }

        this.fileUploader = new SL.helpers.FileUploader({
          file: file,
          filename: file.fileName || '',
          service: '/api/v1/users/avatar',
          timeout: 90000
        });

        this.fileUploader.succeeded.add(this.onUploadSuccess);
        return void this.fileUploader.upload();
      }
    } else {
      return void SL.notify(SL.locale.get('Devise.upload_img_type'));
    }
  },

  /**
   * @function
   * @param {Object} data
   */
  onUploadSuccess: function (data) {
    if (typeof data.msg !== "undefined") {
      return void SL.notify(data.msg);
    } else {
      $('.gravatar-photo .picture').css(
        'background-image',
        'url(' + data.url + ')');
    }
  }
});


/*!
 * project name: SlideStudio
 * name:         home.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/14
 */

'use strict';

SL('views.home').IndexOld   = SL.views.Base.extend({
  MARQUEE_MIN_HEIGHT: 600,
  init: function () {
    this._super();

    this.$sharingElement       = $('.marquee .sharing');
    this.$learnMoreButton      = $('.marquee .description-cta-secondary');
    this.$scrollPromotion      = $('.marquee .scroll-promotion');
    this.$scrollPromotionArrow = $('.marquee .scroll-promotion-arrow');
    this.$backgroundElement    = $('.marquee .marquee-background');

    this.setupBackground();
    this.setupVideo();
    this.bind();
    this.startScrollPromotion();
  },
  setupBackground: function () {
    this.$backgroundImage = $('<img>', {
      src:  SL.config.ASSET_URLS['homepage-background.jpg'],
      load: this.onBackgroundLoaded.bind(this)
    });
  },
  setupVideo: function () {
    if (SL.util.device.IS_PHONE || SL.util.device.IS_TABLET) {
      $('.features .features-item-figure').each(function () {
        var $figure = $(this),
          $image = $figure.find('.image-wrapper'),
          $video = $figure.find('.video-wrapper');

        if ($video.length) {
          $video.find('video').prop('controls', true);
          $video.appendTo($figure);
          $image.appendTo($figure);
          $figure.addClass('manually-triggered');
          $figure.find('.browser-frame').remove();
          $figure.find('.browser-content').remove();
        }
      });
    }

    $('.features video').each(function (index, item) {
      var str = '';

      item = $(item);
      item.find('span[data-src]').each(function (index, item) {
        item = $(item);
        str += '<source src="' + item.attr('data-src') +
          '" type="' + item.attr('data-type') + '">';
      });

      if (str) {
        item.html(str);
      }
    });
  },
  bind: function () {
    this.$sharingElement.on('mouseover', this.onSharingMouseOver.bind(this));
    this.$learnMoreButton.on('click', this.onLearnMoreClicked.bind(this));
    this.$scrollPromotion.on('click', this.onLearnMoreClicked.bind(this));
    this.$scrollPromotionArrow.on('mouseover', this.onScrollPromotionOver.bind(this));

    if (!(SL.util.device.IS_PHONE || SL.util.device.IS_TABLET)) {
      this.updateFeatureAnimations = $.debounce(this.updateFeatureAnimations, 300);

      $(window).on('resize', this.onWindowResize.bind(this));
      $(window).on('scroll', this.onWindowScroll.bind(this));
    }

    this.trackScrolling = $.throttle(this.trackScrolling, 500);
    $(window).on('scroll', this.trackScrolling.bind(this));
  },
  trackScrolling: function () {
    this.scrollTracking = this.scrollTracking || {};

    var scrollTop = $(window).scrollTop(),
      innerHeight = window.innerHeight,
      height = $(document).height(),
      delta = Math.max(Math.min(scrollTop / (height - innerHeight), 1), 0);

    if (delta > 0.1 && !this.scrollTracking[0.1]) {
      this.scrollTracking[0.1] = true;
      SL.analytics.track('Home: Scrolled', '10%');
    }

    if (delta > 0.5 && !this.scrollTracking[0.5]) {
      this.scrollTracking[0.5] = true;
      SL.analytics.track('Home: Scrolled', '50%');
    }

    if (delta > 0.95 && !this.scrollTracking[0.95]) {
      this.scrollTracking[0.95] = true;
      SL.analytics.track('Home: Scrolled', '100%');
    }
  },
  updateFeatureAnimations: function () {
    var $video,
      scrollTop = $(window).scrollTop(),
      MAX_VALUE = Number.MAX_VALUE;

    $('.features .features-item .video-wrapper, .features .features-item .animation-wrapper')
      .each(function (index, item) {
        item = $(item);

        var top = item.offset().top,
          position = top - scrollTop;

        if (position > -100 && 500 > position && MAX_VALUE > position) {
          MAX_VALUE = position;
          $video = item;
        }
      });

    if (this.$activeFeature && !this.$activeFeature.is($video)) {
      this.stopFeatureAnimation();
    }

    if ($video && !$video.hasClass('playing')) {
      this.$activeFeature = $video;
      this.startFeatureAnimation();
    }
  },
  startFeatureAnimation: function () {
    this.$activeFeature.addClass('playing');

    if (this.$activeFeature.is('.video-wrapper')) {
      this.$activeFeature.find('video').get(0).play();
    } else if (this.$activeFeature.is('.animation-wrapper')) {
      var steps = parseInt(this.$activeFeature.attr('data-animation-steps'), 10),
        duration = parseInt(this.$activeFeature.attr('data-animation-duration'), 10),
        initStep = 1;

      this.$activeFeature.attr('data-animation-step', initStep);

      this.activeFeatureInterval = setInterval((function () {
        initStep += 1;

        if (initStep > steps) {
          initStep = 1;
        }

        this.$activeFeature.attr('data-animation-step', initStep);
      }).bind(this), duration / steps);
    }

    SL.analytics.track('Home: Start feature animation');
  },
  stopFeatureAnimation: function () {
    this.$activeFeature.removeClass('playing');
    this.$activeFeature.removeAttr('data-animation-step');

    clearInterval(this.activeFeatureInterval);

    if (this.$activeFeature.is('.video-wrapper')) {
      this.$activeFeature.find('video').get(0).pause();
    }
  },
  startScrollPromotion: function () {
    clearInterval(this.scrollPromotionInterval);
    this.scrollPromotionInterval = setInterval(this.promoteScrolling.bind(this), 2500);
  },
  stopScrollPromotion: function () {
    clearInterval(this.scrollPromotionInterval);
    this.scrollPromotionInterval = null;
  },
  promoteScrolling: function () {
    this.$scrollPromotionArrow.removeClass('bounce');

    setTimeout((function () {
      this.$scrollPromotionArrow.addClass('bounce');
    }).bind(this), 1);
  },
  onScrollPromotionOver: function () {
    this.stopScrollPromotion();
  },
  onBackgroundLoaded: function () {
    this.$backgroundElement
      .css(
      'background-image',
      'url(' + this.$backgroundImage.attr('src') + ')')
      .addClass('show');
  },
  onSharingMouseOver: function () {
    if (!this.$sharingElement.hasClass('parsed')) {
      this.$sharingElement.addClass('parsed');
      this.$sharingElement.html(
        '<iframe src="//www.facebook.com/plugins/like.php?href=http%3A%2F%2F' +
          'www.facebook.com%2Fslidesapp&amp;send=false&amp;layout=button_count&amp;' +
          'width=100&amp;show_faces=false&amp;action=like&amp;colorscheme=light&amp;' +
          'font&amp;height=20&amp" scrolling="no" frameborder="0" ' +
          'style="border:none; overflow:hidden; width:100px; height:20px;" ' +
          'allowTransparency="true">' +
        '</iframe>' +
        '<a href="https://twitter.com/share" class="twitter-share-button" ' +
          'data-url="http://slides.com" ' +
          'data-text="Create, present and share beautiful presentations with @slidesapp" ' +
          'data-count="horizontal" data-related="slidesapp">' +
        '</a>');

      (function (doc, tagName, wjsSdk) {
        var tag = doc.getElementsByTagName(tagName)[0];

        if (!doc.getElementById(wjsSdk)) {
          var cTag = doc.createElement(tagName);
          cTag.id = wjsSdk;
          cTag.src = '//platform.twitter.com/widgets.js';
          tag.parentNode.insertBefore(cTag, tag);
        }
      })(document, 'script', 'twitter-wjs');
    }
  },
  onLearnMoreClicked: function () {
    SL.analytics.track('Home: Learn more clicked');
    this.stopScrollPromotion();
  },
  onWindowResize: function () {
    this.updateFeatureAnimations();
  },
  onWindowScroll: function () {
    this.updateFeatureAnimations();

    if (this.scrollPromotionInterval) {
      this.stopScrollPromotion();
    }

    this.trackScrolling();
  }
});

SL('views.home').Index   = SL.views.Base.extend({
  MARQUEE_MIN_HEIGHT: 600,

  /**
   * Constructor SL.views.home.Index Instance
   *
   * @function
   */
  init: function () {
    this._super();

    this.$learnMoreButton = $('.marquee .description-cta-secondary');
    this.$scrollPromotion = $('.marquee .scroll-promotion');
    this.$scrollPromotionArrow = $('.marquee .scroll-promotion-arrow');

    this.setupVideo();
    this.bind();
    this.startScrollPromotion();
  },

  /**
   * Setup Video Component
   *
   * @function
   */
  setupVideo: function () {
    if (SL.util.device.IS_PHONE || SL.util.device.IS_TABLET) {
      $('.media-item video').each(function () {
        $(this).prop('controls', true);
      });

      $('.features .media-item').each(function () {
        var $media = $(this),
          $img = $media.find('.image-wrapper'),
          $video = $media.find('.video-wrapper');

        if ($video.length) {
          $video.appendTo($media);
          $img.appendTo($media);

          $media.addClass('manually-triggered');

          $media.find('.browser-frame').remove();
          $media.find('.browser-content').remove();
        }
      });
    }

    $('.media-item video').each(function (index, element) {
      var html = '';

      element = $(element);

      if (SL.util.device.IS_PHONE || SL.util.device.IS_TABLET) {
        element.parents('.media-item').addClass('loaded');
      } else {
        element.on('loadeddata', function () {
          element.parents('.media-item').addClass('loaded');
        });
      }

      element.find('span[data-src]').each(function (index, element) {
        element = $(element);

        html += '<source src="' + element.attr('data-src') + '" type="' +
          element.attr('data-type') + '">';
      });

      if (html) {
        element.html(html);
      }
    });
  },

  /**
   * Bind Event
   *
   * @function
   */
  bind: function () {
    this.$learnMoreButton.on('click', this.onLearnMoreClicked.bind(this));
    this.$scrollPromotion.on('click', this.onLearnMoreClicked.bind(this));
    this.$scrollPromotionArrow
      .on('mouseover', this.onScrollPromotionOver.bind(this));

    this.syncScrolling  = $.debounce(this.syncScrolling, 300);
    this.trackScrolling = $.throttle(this.trackScrolling, 500);

    $(window).on('resize', this.onWindowResize.bind(this));
    $(window).on('scroll', this.onWindowScroll.bind(this));
  },

  /**
   * Track Scrolling
   *
   * @function
   */
  trackScrolling: function () {
    this.scrollTracking = this.scrollTracking || {};

    var scrollTop = $(window).scrollTop(),
      innerHeight = window.innerHeight,
      height      = $(document).height(),
      delta = Math.max(Math.min(scrollTop / (height - innerHeight), 1), 0);

    if (delta > 0.1 && !this.scrollTracking[0.1]) {
      this.scrollTracking[0.1] = true;
      SL.analytics.track('Home: Scrolled', '10%');
    }

    if (delta > 0.5 && !this.scrollTracking[0.5]) {
      this.scrollTracking[0.5] = true;
      SL.analytics.track('Home: Scrolled', '50%');
    }

    if (delta > 0.95 && !this.scrollTracking[0.95]) {
      this.scrollTracking[0.95] = true;
      SL.analytics.track('Home: Scrolled', '100%');
    }
  },

  /**
   * Sync Scrolling
   *
   * @function
   */
  syncScrolling: function () {
    var scrollTop = $(window).scrollTop();

    if (!SL.util.device.IS_PHONE && !SL.util.device.IS_TABLET) {
      var activeFeature = $(), MAX_VALUE = Number.MAX_VALUE;

      $('.media-item .video-wrapper, .media-item .animation-wrapper')
        .each(function (index, element) {
          element = $(element);

          var realTop = element.offset().top - scrollTop;

          if (realTop > -100 && 500 > realTop && MAX_VALUE > realTop) {
            MAX_VALUE = realTop;
            activeFeature = element;
          }
        });

      if (this.$activeFeature && !this.$activeFeature.is(activeFeature)) {
        this.stopFeatureAnimation();
      }

      if (activeFeature && !activeFeature.hasClass('playing')) {
        this.$activeFeature = activeFeature;
        this.startFeatureAnimation();
      }
    }

    if (scrollTop > 20) {
      this.$scrollPromotion.addClass('hidden');
    }
  },

  /**
   * Start Feature Animation
   *
   * @function
   */
  startFeatureAnimation: function () {
    this.$activeFeature.addClass('playing');

    if (this.$activeFeature.is('.video-wrapper')) {
      this.$activeFeature.find('video').get(0).play();
    } else if (this.$activeFeature.is('.animation-wrapper')) {
      var step = 1,
        animationStep =
          parseInt(this.$activeFeature.attr('data-animation-steps'), 10),
        animationDuration =
          parseInt(this.$activeFeature.attr('data-animation-duration'), 10);

      this.$activeFeature.attr('data-animation-step', step);

      this.activeFeatureInterval = setInterval((function () {
        step += 1;
        step = step > animationStep ? 1 : step;
        this.$activeFeature.attr('data-animation-step', step);
      }).bind(this), animationDuration / animationStep);
    }

    SL.analytics.track('Home: Start feature animation');
  },

  /**
   * Stop Feature Animation
   *
   * @function
   */
  stopFeatureAnimation: function () {
    this.$activeFeature.removeClass('playing');
    this.$activeFeature.removeAttr('data-animation-step');

    clearInterval(this.activeFeatureInterval);

    if (this.$activeFeature.is('.video-wrapper')) {
      this.$activeFeature.find('video').get(0).pause();
    }
  },

  /**
   * Start Scroll Promotion
   *
   * @function
   */
  startScrollPromotion: function () {
    clearInterval(this.scrollPromotionInterval);
    this.scrollPromotionInterval =
      setInterval(this.promoteScrolling.bind(this), 2500);
  },

  /**
   * Stop Scroll Promotion
   *
   * @function
   */
  stopScrollPromotion: function () {
    clearInterval(this.scrollPromotionInterval);
    this.scrollPromotionInterval = null;
  },

  /**
   * Promote Scrolling
   *
   * @function
   */
  promoteScrolling: function () {
    this.$scrollPromotionArrow.removeClass('bounce');

    setTimeout((function () {
      this.$scrollPromotionArrow.addClass('bounce');
    }).bind(this), 1);
  },

  /**
   * Scroll Promotion Over Callback
   *
   * @function
   */
  onScrollPromotionOver: function () {
    this.stopScrollPromotion();
  },

  /**
   * Learn More Click Callback
   *
   * @function
   */
  onLearnMoreClicked: function () {
    SL.analytics.track('Home: Learn more clicked');
    this.stopScrollPromotion();
  },

  /**
   * Window Resize Callback
   *
   * @function
   */
  onWindowResize: function () {
    this.syncScrolling();
  },

  /**
   * Window Scroll Callback
   *
   * @function
   */
  onWindowScroll: function () {
    if (this.scrollPromotionInterval) {
      this.stopScrollPromotion();
    }

    this.syncScrolling();
    this.trackScrolling();
  }
});

SL('views.home').Explore = SL.views.Base.extend({
  /**
   * Constructor SL.views.home.Explore Instance
   *
   * @function
   */
  init: function () {
    this._super();

    new SL.components.Search({
      url: SL.config.AJAX_SEARCH
    });
  }
});


/*!
 * project name: SlideStudio
 * name:         statik.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/14
 */

'use strict';

SL('views.statik').All     = SL.views.Base.extend({
  /**
   * Constructor SL.views.statik.All Instance
   *
   * @function
   */
  init: function () {
    this._super();
    $('img.click-to-expand').on('click', function () {
      $(this).toggleClass('expanded');
    });
  }
});

SL('views.statik').Pricing = SL.views.Base.extend({
  /**
   * Constructor SL.views.statik.Pricing Instance
   *
   * @function
   */
  init: function () {
    this._super();
    $('.tier').each(this.setupTier.bind(this));
  },

  /**
   * @function
   * @param {*}     index
   * @param {Dom|*} item  -The Html Document
   */
  setupTier: function (index, item) {
    var $tier = $(item), $a = $tier.find('.cta a');

    if ($a.length && !$a.hasClass('disabled')) {
      $tier.on('click', function (evt) {
        evt.preventDefault();
        window.location = $a.attr("href");
      });
      $tier.on('mouseenter', function () {
        $tier.addClass("hover");
      });
      $tier.on('mouseleave', function () {
        $tier.removeClass("hover");
      });
    }
  }
});


/*!
 * project name: SlideStudio
 * name:         subscriptions.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/14
 */

'use strict';

SL('views.subscriptions').New        = SL.views.Base.extend({
  /**
   * Constructor SL.views.subscriptions.New Instance
   *
   * @function
   */
  init: function () {
    this._super();

    this.onFormSubmit     = this.onFormSubmit.bind(this);
    this.onStripeResponse = this.onStripeResponse.bind(this);

    this.$formElement = $('#payment-form');
    this.$formElement.on('submit', this.onFormSubmit);
    this.$formSubmitButton = this.$formElement.find('button[type=submit]');

    this.formSubmitLoader = window.Ladda.create(this.$formSubmitButton.get(0));

    $('#stripe-card-number').payment('formatCardNumber');
    $('#stripe-card-cvc').payment('formatCardCVC');
    $('#stripe-month').payment('restrictNumeric');
    $('#stripe-year').payment('restrictNumeric');

    if (!SL.util.device.supportedByEditor()) {
      $('.column').prepend([
        '<section class="critical-error">',
          '<h2>', SL.locale.get('Sub.no_support_title'), '</h2>',
          '<p>', SL.locale.get('Sub.no_support_des'), '</p>',
        '</section>'].join(''));
    }

    if ($('html').hasClass('subscriptions new')) {
      $('input[name="subscription[billing_period]"]')
        .on("change", this.syncSubmitButton.bind(this));

      this.syncSubmitButton();
    }
  },

  /**
   * Sync Submit Button
   *
   * @function
   */
  syncSubmitButton: function () {
    var $checked =
        this.$formElement.find('input[name="subscription[billing_period]"]:checked'),
      period = $checked.attr('data-period-value'),
      dollar = $checked.attr('data-dollar-value'),
      $note  = this.$formElement.find('.devise-note');

    if ($note.length) {
      $note =
        $('<div class="devise-note">')
          .insertAfter(this.$formElement.find('.actions'));
    }

    if (period && dollar) {
      $note.html('You are starting a <strong>' + period +
        '</strong> subscription and will be charged <strong>$' + dollar +
        '</strong> today.');
    } else {
      $note.remove();
    }
  },

  /**
   * Form Submit Event
   *
   * @function
   * @param {Event} evt -The Form Submit Event
   */
  onFormSubmit: function (evt) {
    this.formSubmitLoader.start();
    window.Stripe.createToken(this.$formElement, this.onStripeResponse);

    evt.preventDefault();

    return false;
  },

  /**
   * Stripe Response Callback
   *
   * @function
   * @param {String}          status   -The Text Status
   * @param {XMLHttpResponse} response -The XMLHttpResponse Object
   */
  onStripeResponse: function (status, response) {
    if (response.error) {
      SL.notify(response.error.message, 'negative');
      this.formSubmitLoader.stop();
    } else {
      var id = response.id;

      this.$formElement
        .find('input[name="subscription[token]"]')
        .remove();

      this.$formElement
        .append($('<input type="hidden" name="subscription[token]" />')
          .val(id));

      this.$formElement.get(0).submit();
    }
  }
});

SL('views.subscriptions').Show       = SL.views.Base.extend({
  DOTTED_CARD_PREFIX: '&bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; ',

  /**
   * Constructor SL.views.subscriptions.Show Instance
   *
   * @function
   */
  init: function () {
    this._super();
    this.strings = {
      CONFIRM_UNSUBSCRIBE_ACTION: 'Unsubscribe',
      CONFIRM_UNSUBSCRIBE_DESCRIPTION: SL.locale.get('T.REMOVE_PRO_CONFIRM')
    };
    this.load();
  },

  /**
   * Bing Ladda Component
   *
   * @function
   */
  bindLadda: function () {
    $('.column section .ladda-button').each(function (index, item) {
      item = $(item);

      if (item.data('ladda')) {
        item.data('ladda', window.Ladda.create(item.get(0)));
      }
    });
  },

  /**
   * Load Subscriptions Status
   *
   * @function
   */
  load: function () {
    $.ajax({
      url: SL.config.AJAX_SUBSCRIPTIONS_STATUS,
      type: 'GET',
      context: this
    }).done(this.onDataLoaded).fail(this.onDataFailed);
  },

  /**
   * The Load Customer Callback
   *
   * @function
   * @param {Object} data The Customer Object
   */
  onDataLoaded: function (data) {
    this.data = new SL.models.Customer(data.customer);
    this.render();
  },

  /**
   * The Load Customer Failed Callback
   *
   * @function
   */
  onDataFailed: function () {
    $('.billing-loader').text(SL.locale.get('T.BILLING_DETAILS_ERROR'));
  },

  /**
   * Render Views
   *
   * @function
   */
  render: function () {
    $('.billing-loader').remove();

    this.renderDetails();
    this.renderHistory();

    if (!SL.current_user.isEnterprise() ||
      SL.current_user.billing_address) {
      this.renderAddress();
    }

    this.bindLadda();
  },

  /**
   * Render Detail Information
   *
   * @function
   */
  renderDetails: function () {
    var hasActiveSubscription = this.data.hasActiveSubscription(),
      $detail = $([
        '<section class="billing-details">',
          '<h2>Billing details</h2>',
        '</section>'].join('')).appendTo('.billing-wrapper');

    if (hasActiveSubscription) {
      $detail.append([
        '<div class="field status">',
          '<span class="label">Status</span>',
          '<span class="value">Active</span>',
        '</div>'].join(''));

      if (this.data.has('active_card')) {
        $detail.append([
          '<div class="field card">',
            '<span class="label">Card</span>',
            '<span class="value">',
              this.DOTTED_CARD_PREFIX + this.data.get('active_card.last4'),
            '</span>',
          '</div>'].join(''));
      }

      if (this.data.has('subscription')) {
        var num = '$' + this.data.getNextInvoiceSum(),
          date = window.moment
            .unix(this.data.getNextInvoiceDate())
            .format('MMMM Do, YYYY');

        $detail.append([
          '<div class="field payment-cycle">',
            '<span class="label">Next invoice</span>',
            '<span class="value">',
              num + " on " + date,
            '</span>',
          '</div>'].join(''));
      }

      $detail.append([
        '<footer class="actions">' +
          '<a class="button s outline" href="' + SL.routes.SUBSCRIPTIONS_EDIT_CARD + '">',
            'Change credit card',
          '</a>',
          '<button class="button s negative outline cancel-subscription ladda-button" data-style="expand-right" data-spinner-color="#222">',
            this.strings.CONFIRM_UNSUBSCRIBE_ACTION,
          '</button>',
        '</footer>'].join(''));

      if (this.data.get('can_change_period')) {
        $detail.find('.actions').prepend([
          '<a class="button s outline" href="' + SL.routes.SUBSCRIPTIONS_EDIT_PERIOD + '">',
            'Change billing period',
          '</a>'].join(''));
      }
    } else {
      var str = 'No active subscription';

      if (this.data.get('subscription')) {
        str = 'Pro until ' +
          window.moment
            .unix(this.data.get('subscription.current_period_end'))
            .format('MMM Do, YYYY');
      }

      $detail.append([
        '<div class="field status">',
          '<span class="label">Status</span>',
          '<span class="value">' + str + '</span>',
        '</div>'].join(''));
      $detail.append([
        '<footer class="actions">',
          '<a class="button s outline positive" href="' + SL.routes.SUBSCRIPTIONS_NEW + '">',
            'Return to Pro',
          '</a>',
        '</footer>'].join(''));
    }

    this.$cancelButton = $('.billing-details .cancel-subscription');

    if (this.$cancelButton.length) {
      this.$cancelButton.
        on('click', this.onCancelSubscriptionClicked.bind(this));
      this.cancelLoader = window.Ladda.create(this.cancelButton.get(0));
    }
  },

  /**
   * Render History
   *
   * @function
   */
  renderHistory: function () {
    var $history = $([
        '<section class="billing-history">',
          '<h2>Receipts</h2>',
          '<table class="sl-table"></table>',
        '</section>'].join('')).appendTo('.billing-wrapper'),
      $table = $history.find('table');

    if (this.data.get('can_toggle_notifications') === true) {
      $history.append([
        '<div class="sl-checkbox outline">',
          '<input type="checkbox" id="receipt-notifications">',
          '<label for="receipt-notifications">',
            'Send receipts via email when I\'m charged',
          '</label>',
        '</div>'].join(''));

      var $notify = $history.find('#receipt-notifications');
      $notify.on('change', this.onEmailNotificationChanged.bind(this));

      if (SL.current_user.notify_on_receipt) {
        $notify.prop('checked', true);
      }
    }

    $table.html(['<tr>',
        '<th class="amount">Amount</th>',
        '<th class="date">Date</th>',
        '<th class="card">Card</th>',
        '<th class="download">PDF</th>',
      '</tr>'].join(''));

    var charges = this.data.get('charges');

    if (charges && charges.length) {
      charges.forEach((function (charge) {
        if (charge.paid) {
          var $pdf = $([
            '<tr data-charge-id="' + charge.id + '">',
              '<td class="amount">$',
                (charge.amount / 100).toFixed(2),
              '</td>',
              '<td class="date">',
                window.moment.unix(charge.created).format('DD-MM-YYYY'),
              '</td>',
              '<td class="card">' +
                this.DOTTED_CARD_PREFIX + charge.card.last4 +
              '</td>',
              '<td class="download">',
                '<form action="' + SL.config.AJAX_SUBSCRIPTIONS_PRINT_RECEIPT(charge.id) + '" method="post">',
                  '<button type="submit" class="button outline ladda-button download-button" data-style="slide-right" data-spinner-color="#222">',
                    '<span class="icon i-download"></span>',
                  '</button>',
                '</form>',
              '</td>',
            '</tr>'].join(''));

          $pdf.appendTo($table);
          SL.util.dom.insertCSRF($pdf.find('.download form'));
        }
      }).bind(this));
    } else {
      $table.replaceWith('<p>' +
          SL.locale.get('T.BILLING_DETAILS_NOHISTORY') +
        '</p>');
    }
  },

  /**
   * Render Address Views
   *
   * @function
   */
  renderAddress: function () {
    var $address = $(['<section class="billing-address">',
        '<h2>Billing address</h2>',
        '<div class="sl-form">',
          '<div class="unit">',
            '<p class="unit-description">',
              'If you wish to include a billing address on your receipts please enter it below.',
            '</p>',
            '<textarea class="billing-address-input" rows="4" maxlength="100">',
              SL.current_user.billing_address || '',
            '</textarea>',
          '</div>',
          '<div class="footer">',
            '<button class="button l positive billing-address-save">',
              'Save',
            '</button>',
          '</div>',
        '</div>',
      '</section>'].join('')).appendTo('.billing-wrapper');

    this.$addressInputField = $address.find('.billing-address-input');
    this.$addressSaveButton = $address.find('.billing-address-save');
    this.$addressInputField.on('change keyup mouseup', this.checkAddress.bind(this));
    this.$addressSaveButton.on('click', this.saveAddress.bind(this));

    this.checkAddress();
  },

  /**
   * Check Address
   *
   * @function
   */
  checkAddress: function () {
    if (this.$addressInputField.val() ===
      (SL.current_user.billing_address || '')) {
      this.$addressSaveButton.hide();
    } else {
      this.$addressSaveButton.show();
    }
  },

  /**
   * Save Address
   *
   * @function
   */
  saveAddress: function () {
    if (this.billingAddressXHR) {
      this.billingAddressXHR.abort();
    }

    var address = this.addressInputField.val() || '';

    this.billingAddressXHR = $.ajax({
      url: SL.config.AJAX_UPDATE_USER,
      type: 'PUT',
      context: this,
      data: {
        user: {
          billing_address: address
        }
      }
    }).done(function () {
      SL.current_user.billing_address = address;
      SL.notify('Billing address saved');
    }).fail(function () {
      SL.notify(SL.locale.get('Generic_Error'), 'negative');
    }).always(function () {
      this.billingAddressXHR = null;
      this.checkAddress();
    });
  },

  /**
   * @function
   * @param {Event} evt
   */
  onCancelSubscriptionClicked: function (evt) {
    SL.prompt({
      anchor: $(evt.currentTarget),
      title: this.strings.CONFIRM_UNSUBSCRIBE_DESCRIPTION,
      type: 'select',
      data: [{
        html: '<h3>Cancel</h3>'
      }, {
        html: '<h3>Confirm</h3>',
        selected: true,
        className: 'negative',
        callback: (function () {
          this.cancelLoader.start();
          $.ajax({
            url: SL.config.AJAX_SUBSCRIPTIONS,
            type: 'DELETE',
            context: this
          }).done(this.onCancelSubscriptionSuccess).fail(this.onCancelSubscriptionError);
        }).bind(this)
      }]
    });
  },

  /**
   * @function
   */
  onCancelSubscriptionSuccess: function () {
    SL.notify(SL.locale.get('T.REMOVE_PRO_SUCCESS'));
    window.location.reload();
  },

  /**
   * @function
   */
  onCancelSubscriptionError: function () {
    SL.notify(SL.locale.get('Generic_Error'));
    this.cancelLoader.stop();
  },

  /**
   * @function
   * @param {Event} evt
   */
  onEmailNotificationChanged: function (evt) {
    if (this.emailNotificationXHR) {
      this.emailNotificationXHR.abort();
    }

    var isChecked = $(evt.currentTarget).is(':checked');

    this.emailNotificationXHR = $.ajax({
      url: SL.config.AJAX_UPDATE_USER,
      type: 'PUT',
      context: this,
      data: {
        user: {
          notify_on_receipt: isChecked
        }
      }
    }).done(function () {
      if (isChecked === true) {
        SL.notify('All future receipts will be emailed to you');
      }
    }).fail(function () {
      SL.notify(SL.locale.get('Generic_Error'), 'negative');
    }).always(function () {
      this.emailNotificationXHR = null;
    });
  }
});

SL('views.subscriptions').EditPeriod = SL.views.Base.extend({
  /**
   * Constructor SL.views.subscriptions.EditPeriod Instance
   *
   * @function
   */
  init: function () {
    this._super();
    window.Ladda.bind($('#payment-form button[type=submit]').get(0));
  }
});


/*!
 * project name: SlideStudio
 * name:         teams.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/17
 */

'use strict';

SL('views.teams').New                = SL.views.Base.extend({
  /**
   * Constructor SL.views.teams.New Instance
   *
   * @function
   */
  init: function () {
    this._super();

    this.$formElement      = $('#payment-form');
    this.$formSubmitButton = this.$formElement.find('button[type=submit]');
    this.formSubmitLoader  = window.Ladda.create(this.$formSubmitButton.get(0));

    this.bind();
    this.summarize();
  },

  /**
   * Bind Teams Views Events
   *
   * @function
   */
  bind: function () {
    this.summarize = this.summarize.bind(this);

    this.$formElement.on('keydown', this.onFormKeyDown.bind(this));
    this.$formSubmitButton.on('click', this.onFormSubmitClicked.bind(this));
    this.$formElement
      .find('#team-name')
      .on('input', this.onTeamNameChange.bind(this));
    this.$formElement
      .find('input[name="billing-period"]')
      .on('change', this.summarize);

    $('#stripe-card-number').payment('formatCardNumber');
    $('#stripe-card-cvc').payment('formatCardCVC');
    $('#stripe-month').payment('restrictNumeric');
    $('#stripe-year').payment('restrictNumeric');

    this.$formElement
      .find('.unit[data-validate], .unit[data-required]')
      .each(function (index, item) {
        $(item).data('unit', new SL.components.FormUnit(item));
      });
  },

  /**
   * Summarize View
   *
   * @function
   */
  summarize: function () {
    var $purchaseSummary = this.$formElement.find('.purchase-summary'),
      $message = $purchaseSummary.find('.message'),
      isMonth =
        this.$formElement
          .find('input[name="billing-period"]:checked')
          .val() === 'monthly',
      priceInfo = {
        period: isMonth ?
          'month' : 'year',
        cost: '$' + (isMonth ? 14 : 140)
      };

    $message.html([
      'You are starting a <strong>30 day free trial</strong>. If you cancel anytime in that period you will not be charged at all.<br><br>After the trial you will begin paying <strong>',
      priceInfo.cost + ' per ' + priceInfo.period,
      '</strong> for each team member.'].join(''));
  },

  /**
   * Validate Unit
   *
   * @function
   * @returns {boolean} True is Focus, False or not.
   */
  validate: function () {
    var validated = true;

    this.$formElement
      .find('.unit[data-validate], .unit[data-required]')
      .each(function (index, item) {
        var $unit = $(item).data('unit');

        if ($unit.validate(true) === false) {
          if (validated) {
            $unit.focus();
          }

          validated = false;
        }
      });

    return validated;
  },

  /**
   * Save Current Data To This Instance formData.
   *
   * @function
   */
  captureData: function () {
    this.formData = {
      team: {
        name: this.$formElement.find('#team-name').val(),
        slug: this.$formElement.find('#team-slug').val()
      },
      user: {
        username: this.$formElement.find('#user-name').val(),
        email:    this.$formElement.find('#user-email').val(),
        password: this.$formElement.find('#user-password').val()
      },
      subscription: {
        billing_period: this.$formElement
          .find('input[name="billing-period"]:checked')
          .val()
      }
    };
  },

  /**
   * Submit To Stripe
   *
   * @function
   */
  submitToStripe: function () {
    if (this.validate()) {
      this.captureData();
      this.formSubmitLoader.start();
      // TODO: No Add This Stripe Library
      window.Stripe.createToken(
        this.$formElement,
        this.onStripeResponse.bind(this));
    }
  },

  /**
   * Submit To App
   *
   * @function
   * @param {String|Number|*} id -The Team Id
   */
  submitToApp: function (id) {
    this.formData.subscription.token = id;

    $.ajax({
      type: 'POST',
      url: SL.config.AJAX_TEAMS_CREATE,
      data: JSON.stringify(this.formData),
      dataType: 'json',
      context: this,
      contentType: 'application/json'
    }).done(function (data) {
      if (data.team && typeof data.team.root_url === "string") {
        window.location =
          window.location.protocol + "//" + data.team.root_url;
      } else {
        window.location =
          window.location.protocol + "//" + this.formData.team.slug +
          "." + window.location.host;
      }
    }).fail(function (data) {
      var result = JSON.parse(data.responseText);

      if (result &&
        result.user &&
        result.user.email &&
        result.user.email.length) {
        SL.notify('Email error: ' + result.user.email[0], 'negative');
      } else {
        SL.notify(SL.locale.get('Generic_Error'), 'negative');
      }

      this.formSubmitLoader.stop();
    });
  },

  /**
   * @function
   * @param {String|*}        status
   * @param {XMLHttpResponse} response
   */
  onStripeResponse: function (status, response) {
    if (response.error) {
      SL.notify(response.error.message, 'negative');
      this.formSubmitLoader.stop();
    } else {
      this.submitToApp(response.id);
    }
  },

  /**
   * @function
   * @param {Event} evt
   */
  onFormKeyDown: function (evt) {
    if (evt.keyCode === 13) {
      this.submitToStripe();
      evt.preventDefault();

      return false;
    }
  },

  /**
   * @function
   * @param {Event} evt
   */
  onFormSubmitClicked: function (evt) {
    this.submitToStripe();
    evt.preventDefault();

    return false;
  },

  /**
   * @function
   */
  onTeamNameChange: function () {
    var $teamName = this.$formElement.find('#team-name'),
      $teamSlug   = this.$formElement.find('#team-slug');

    $teamSlug.val(SL.util.string.slug($teamName.val()));

    var unit = $teamSlug.data('unit');

    if (unit) {
      unit.validate();
    }
  }
});

SL('views.teams.teams').Edit         = SL.views.Base.extend({
  /**
   * Constructor SL.views.teams.Edit Instance
   *
   * @function
   */
  init: function () {
    this._super();
    this.render();
  },

  /**
   * Render Teams Edit
   *
   * @function
   */
  render: function () {
    this.$formElement = $('form');

    if (this.$formElement.length) {
      this.$formElement
        .find('.unit[data-factory]')
        .each(function (index, item) {
          var Factory = null;

          $(item)
            .attr('data-factory')
            .split('.')
            .forEach(function (item) {
              if (Factory) {
                Factory = Factory[item];
              } else {
                Factory = window[item];
              }
            });

          if (typeof Factory === "function") {
            new Factory(item);
          }
        });

      this.$formElement
        .find('.unit[data-validate]:not([data-factory])')
        .each(function (index, item) {
          new SL.components.FormUnit(item);
        });

      var $submitBtn = this.$formElement.find('button[type=submit]');

      if ($submitBtn.length) {
        var ladda = window.Ladda.create($submitBtn.get(0));

        this.$formElement.on('submit', (function (evt) {
          if (evt.isDefaultPrevented()) {
            ladda.start();
          }
        }).bind(this));
      }
    }
  }
});

SL('views.teams.teams').EditMembers  = SL.views.Base.extend({
  /**
   * Constructor SL.views.teams.EditMembers Instance
   *
   * @function
   */
  init: function () {
    this._super();
    this.$domElement = $('section.users');
    this.load();
  },

  /**
   * Bind Ladda Component
   *
   * @function
   */
  bindLadda: function () {
    $('.column section .ladda-button').each(function (index, item) {
      item = $(item);

      if (item.data('ladda')) {
        item.data('ladda', window.Ladda.create(item.get(0)));
      }
    });
  },

  /**
   * Load Teams Users
   *
   * @function
   */
  load: function () {
    $.ajax({
      type: 'GET',
      url: SL.config.AJAX_ORGANIZATION_MEMBERS_LIST,
      context: this
    }).done(function (data) {
      this.userData = new SL.collections.Collection();
      this.userLimit = data.max;

      data.results.forEach((function (result) {
        this.userData.push(new SL.models.User(result));
      }).bind(this));
    }).fail(function () {
      SL.notify(SL.locale.get('T.ORG_USERS_LIST_LOAD_ERROR'), 'negative');
    }).always(this.render);
  },

  /**
   * Render Users List
   *
   * @function
   */
  render: function () {
    var $contents = this.$domElement.find('.contents').empty();
    this.renderTable($contents);
    this.renderInviteForm($contents);
    this.syncInviteForm();
  },

  /**
   * Render User Table
   *
   * @function
   * @param {jQuery|Element|*} $contents -The jQuery Element
   */
  renderTable: function ($contents) {
    if (this.userData.isEmpty()) {
      $contents.html([
        '<p class="empty-notice">',
          SL.locale.get('T.ORG_USERS_LIST_EMPTY'),
        '</p>'].join(''));
    } else {
      var $table = $('<table class="sl-table">').appendTo($contents);
      $table.append([
        '<tr>',
          '<th class="name">Name</th>',
          '<th class="username">Username</th>',
          '<th class="email">Email</th>',
          '<th class="actions">Actions</th>',
        '</tr>'].join(''));
      this.userData.forEach(this.renderUser.bind(this));
    }
  },

  /**
   * Render Invite Form
   *
   * @function
   * @param {jQuery|Dom|*} $contents -The Invite Form Parent
   */
  renderInviteForm: function ($contents) {
    var $userForm = $([
        '<form class="create-user-form">',
          '<h4>Add a user to this team</h4>',
          '<div class="unit text" data-validate="email" data-required>',
            '<input type="text" placeholder="Email" name="email" size="35">',
          '</div>',
          '<div class="unit text" data-validate="username" data-required>',
            '<input type="text" placeholder="Username" name="username">',
          '</div>',
          '<button type="submit" class="button positive l ladda-button create-user" data-style="zoom-out">',
            'Add',
          '</button>',
        '</form>'].join('')).appendTo($contents),
      $email    = $userForm.find('[name=email]'),
      $userName = $userForm.find('[name=username]');

    $userForm.find('.unit[data-validate]').each(function (index, item) {
      new SL.components.FormUnit(item);
    });

    $userForm.on('submit', (function (evt) {
      this.createUser();
      evt.preventDefault();

      return false;
    }).bind(this));

    $email.on('blur', (function () {
      var email = $email.val(), userName = $userName.val();

      if (!(userName || SL.util.validate.email(email).length === 0)) {
        $userName.val(SL.util.string.slug(email.slice(0, email.indexOf('@'))));
      }
    }).bind(this));

    this.bindLadda();
  },

  /**
   * Render User Data
   *
   * @function
   * @param {Object} userData -The User Data Object
   */
  renderUser: function (userData) {
    var $tr = $('<tr>'),
      thumbStr = [
        '<div class="avatar" style="background-image: url(',
        userData.thumbnail_url + ')"></div>'].join('');

    $tr.append([
      '<td>',
        thumbStr + (userData.name || 'N/A'),
      '</td>'].join(''));
    $tr.append([
      '<td>',
        '<a href="/' + userData.username + '" target="_blank">',
          userData.username,
        '</a>',
      '</td>'].join(''));
    $tr.append([
      '<td>',
        userData.email,
      '</td>'].join(''));

    if (SL.current_user.userName &&
      SL.current_user.userName !== userData.userName) {
      var $td = $('<td>');

      $td.append([
        '<button class="button outline ladda-button remove-user" ',
          'data-style="zoom-out" data-spinner-color="#222" data-tooltip="',
          'Remove this user from the team', '">',
          '<span class="i-trash-stroke"></span>',
        '</button>'].join(''));

      if (!userData.registered) {
        $td.append([
          '<button class="button outline ladda-button welcome-user" ',
            'data-style="zoom-out" data-spinner-color="#222" data-tooltip="',
            'zhe li mei you' + '">',
            '<span class="i-mail"></span>' +
          '</button>'].join(''));
        $tr.addClass('disabled');
      }

      $tr.append($td);
      $tr.find('.welcome-user').on('click', (function (evt) {
        this.welcomeUser(evt, userData, $tr);
      }).bind(this));
      $tr.find('.remove-user').on('click', (function (evt) {
        this.removeUser(evt, userData, $tr);
      }).bind(this));
    } else {
      $tr.append('<td></td>');
    }

    $tr.appendTo(this.$domElement.find('table'));
    this.bindLadda();
  },

  /**
   * Sync invite form, if teams is full notify.
   *
   * @function
   */
  syncInviteForm: function () {
    $('.team-is-full-notice').remove();

    if (this.isTeamFull()) {
      $('.create-user-form').append([
        '<div class="team-is-full-notice">',
          '<h4>This team is full</h4>',
          '<p>To add new members please <a href="#" data-feedback-mode="contact" data-feedback-screenshot_enabled="false">contact support</a>.</p>',
        '</div>'].join(''));
    }
  },

  /**
   * Create User To Teams
   *
   * @function
   */
  createUser: function () {
    if (this.isTeamFull()) {
      SL.notify('Your team is full, please contact support');
      return false;
    }

    var $userForm = $('.create-user-form'),
      ladda = $userForm.find('button.create-user').data('ladda');

    if (ladda) {
      ladda.start();
    }

    $.ajax({
      type: 'POST',
      url: SL.config.AJAX_ORGANIZATION_MEMBER_CREATE,
      data: {
        user: {
          email:    $userForm.find('[name=email]').val(),
          username: $userForm.find('[name=username]').val()
        }
      },
      dataType: 'json',
      context: this
    }).done(function (data) {
      var user = new SL.models.User(data);

      if (this.userData.isEmpty()) {
        this.userData.push(user);
        this.render();
      } else {
        this.userData.push(user);
        this.renderUser(user);
      }

      $userForm.find('[name=email]').val('');
      $userForm.find('[name=username]').val('');
      this.syncInviteForm();

      if (ladda) {
        ladda.stop();
      }

      SL.notify(SL.locale.get('T.ORG_USERS_INVITE_SEND_SUCCESS'));
    }).fail(function (data) {
      data = $.parseJSON(data.responseText) || {};

      if (ladda) {
        ladda.stop();
      }

      if (typeof data.email === "object" && data.email.length) {
        SL.notify('Email error: ' + data.email[0], 'negative');
      } else if (typeof data.username === "object" && data.username.length) {
        SL.notify('Username error: ' + data.username[0], 'negative');
      } else {
        SL.notify('Failed to add user', 'negative');
      }
    });
  },

  /**
   * Remove User From Teams
   *
   * @function
   * @param {Event}      evt
   * @param {Object|*}   userData
   * @param {jQuery|Dom} $tr
   */
  removeUser: function (evt, userData, $tr) {
    SL.prompt({
      anchor: $(evt.currentTarget),
      title: SL.locale.get('T.ORG_USERS_REMOVE_CONFIRM', {
        name: userData.name || userData.username
      }),
      type: 'select',
      data: [{
        html: '<h3>Cancel</h3>'
      }, {
        html: '<h3>Delete</h3>',
        selected: true,
        className: 'negative',
        callback: (function () {
          var ladda = $tr.find(".remove-user").data('ladda');

          if (ladda) {
            ladda.start();
          }

          $.ajax({
            type: 'DELETE',
            url: SL.config.AJAX_ORGANIZATION_MEMBER_DELETE(userData.id),
            context: this
          }).done(function () {
            $tr.remove();
            this.userData.removeByProperties({
              id: userData.id
            });
            this.syncInviteForm();

            if (ladda) {
              ladda.stop();
            }

            SL.notify(SL.locale.get('T.ORG_USERS_REMOVE_SUCCESS'));
          }).fail(function () {
            if (ladda) {
              ladda.stop();
            }

            SL.notify(SL.locale.get('T.ORG_USERS_REMOVE_ERROR'), 'negative');
          });
        }).bind(this)
      }]
    });
  },

  /**
   * Welcome User Add To Team
   *
   * @function
   * @param evt
   * @param userData
   * @param $tr
   */
  welcomeUser: function (evt, userData, $tr) {
    var ladda = $tr.find('.welcome-user').data('ladda');

    if (ladda) {
      ladda.start();
    }

    $.ajax({
      type: 'POST',
      url: SL.config.AJAX_ORGANIZATION_MEMBER_WELCOME(userData.id),
      context: this
    }).done(function () {
      if (ladda) {
        ladda.stop();
      }

      SL.notify(SL.locale.get('T.ORG_USERS_INVITE_SEND_SUCCESS'));
    }).fail(function () {
      if (ladda) {
        ladda.stop();
      }

      SL.notify(SL.locale.get('T.ORG_USERS_INVITE_SEND_ERROR'), 'negative');
    });
  },

  /**
   * Get The Team Is Full
   *
   * @function
   * @returns {boolean} True is full, False or not.
   */
  isTeamFull: function () {
    return this.userLimit > 0 && this.userData.size() >= this.userLimit;
  }
});

SL('views.teams.teams').Show         = SL.views.Base.extend({
  /**
   * Constructor SL.views.teams.Show Instance
   *
   * @function
   */
  init: function () {
    this._super();
    new SL.components.Search({
      url: SL.config.AJAX_SEARCH_ORGANIZATION
    });
  }
});

SL('views.teams.subscriptions').Show = SL.views.subscriptions.Show.extend({
  /**
   * Constructor SL.views.teams.subscriptions.Show Instance
   *
   * @function
   */
  init: function () {
    this._super();
  },

  /**
   * Render subscriptions.Show View
   *
   * @function
   */
  render: function () {
    if (this.data.isTrial()) {
      this.strings.CONFIRM_UNSUBSCRIBE_ACTION      =
        'Delete my team';
      this.strings.CONFIRM_UNSUBSCRIBE_DESCRIPTION =
        'Your trial will be canceled immediately and this team will no longer be accessible.';
    } else {
      this.strings.CONFIRM_UNSUBSCRIBE_ACTION      =
        'End subscription';
      this.strings.CONFIRM_UNSUBSCRIBE_DESCRIPTION =
        'Your subscription will be terminated and this team will be inaccessible after the end of the current billing cycle.';
    }

    this._super();
  },

  /**
   * Render Teams Subscriptions Details
   *
   * @function
   */
  renderDetails: function () {
    var $section = $([
        '<section class="billing-details">',
          '<h2>Billing details</h2>',
        '</section>'].join('')).appendTo('.billing-wrapper'),
      hasActiveSubscription = this.data.hasActiveSubscription(),
      isTrial = this.data.isTrial(), date = null;

    if (hasActiveSubscription) {
      $section.append(isTrial ?
      '<div class="field status">' +
        '<span class="label">Status</span>' +
        '<span class="value">Trial</span>' +
      '</div>' :
      '<div class="field status">' +
        '<span class="label">Status</span>' +
        '<span class="value">Active</span>' +
      '</div>');

      if (SL.current_team.has('user_count')) {
        $section.append([
          '<div class="field active-users">',
            '<span class="label" data-tooltip="The current number of users that you have invited to the team." data-tooltip-maxwidth="260">',
              'Team members',
            '</span>',
            '<span class="value">',
              SL.current_team.get('user_count'),
            '</span>',
          '</div>'].join(''));
      }

      if (this.data.has('subscription.period')) {
        $section.append([
          '<div class="field period">',
            '<span class="label">Billing period</span>',
            '<span class="value">',
              ('year' === this.data.get('subscription.period') ?
                'Yearly' : 'Monthly'),
            '</span>',
          '</div>'].join(''));
      }

      if (this.data.has('active_card')) {
        $section.append([
          '<div class="field card">',
            '<span class="label">Card</span>',
            '<span class="value">',
              this.DOTTED_CARD_PREFIX + this.data.get("active_card.last4"),
            '</span>',
          '</div>'].join(''));
      }

      if (this.data.has('subscription')) {
        date = window.moment
          .unix(this.data.getNextInvoiceDate())
          .format('MMMM Do, YYYY');
        var invoice = isTrial ? 'First invoice' : 'Next invoice',
          num = '$' + this.data.getNextInvoiceSum();

        $section.append([
          '<div class="field payment-cycle">',
            '<span class="label">' + invoice + '</span>',
            '<span class="value">' + num + " on " + date + '</span>',
          '</div>'].join(''));
      }

      $section.append([
        '<footer class="actions">' +
          '<a class="button s outline" href="' + SL.routes.SUBSCRIPTIONS_EDIT_CARD + '">',
            'Change credit card',
          '</a>',
          '<button class="button s negative outline cancel-subscription ladda-button" data-style="expand-right" data-spinner-color="#222">',
            this.strings.CONFIRM_UNSUBSCRIBE_ACTION,
          '</button>' +
        '</footer>'].join(''));

      if (this.data.get('can_change_period')) {
        $section.find('.actions').prepend([
          '<a class="button s outline" href="' + SL.routes.SUBSCRIPTIONS_EDIT_PERIOD + '">',
            'Change billing period',
          '</a>'].join(''));
      }
    } else {
      date = window.moment
        .unix(this.data.get('subscription.current_period_end'))
        .format('MMM Do, YYYY');

      $section.append([
        '<div class="field status">',
          '<span class="label">Status</span>',
          '<span class="value">Canceled, available until ' + date + '</span>',
        '</div>'].join(''));
    }

    this.$cancelButton = $('.billing-details .cancel-subscription');

    if (this.$cancelButton.length) {
      this.$cancelButton.on('click', this.onCancelSubscriptionClicked.bind(this));
      this.cancelLoader = window.Ladda.create(this.cancelButton.get(0));
    }
  },

  /**
   * @function
   */
  onCancelSubscriptionSuccess: function () {
    SL.notify('Subscription canceled');
    window.location = '#';
  }
});


/*!
 * project name: SlideStudio
 * name:         themes.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/17
 */

'use strict';

SL('views.themes').Preview             = SL.views.Base.extend({
  /**
   * Constructor SL.views.themes.Preview Instance
   *
   * @function
   */
  init: function () {
    this._super();
    SL.util.setupReveal({
      openLinksInTabs: true
    });

    if (window.parent !== window.self) {
      window.parent.postMessage({
        type: 'theme-preview-ready'
      }, window.location.origin);
    }
  }
});

SL('views.themes').Edit                = SL.views.Base.extend({
  /**
   * Constructor SL.views.themes.Edit Instance
   *
   * @function
   */
  init: function () {
    this._super();

    this.themeData           = new SL.collections.Collection();

    this.$listElement        = $('.theme-list');
    this.$editorElement      = $('.theme-editor');
    this.$editorInnerElement = $('.theme-editor-inner');

    this.VERSION =
      parseInt($('.theme-editor').attr('data-editor-version'), 10);

    this.load();
    this.bindLadda();
    this.setupPreview();

    $('body').on('click', '.create-theme-button',
      this.onCreateThemeClicked.bind(this));
    $(window).on('beforeunload',
      this.onWindowBeforeUnload.bind(this));
  },

  /**
   * Bind Ladda Component
   *
   * @function
   */
  bindLadda: function () {
    $('.page-wrapper .ladda-button').each(function (index, item) {
      var $item = $(item);

      if (!$item.data('ladda')) {
        $item.data('ladda', window.Ladda.create($item.get(0)));
      }
    });
  },

  /**
   * Preview Theme
   *
   * @function
   */
  setupPreview: function () {
    this.$previewFrame    = $(".preview .preview-frame");
    this.$previewReloader = $(".preview .preview-reloader");

    this.$previewReloader.on('click', this.reloadPreview.bind(this));
    window.addEventListener("message", (function (evt) {
      if (evt.data && "theme-preview-ready" === evt.data.type) {
        this.refreshPreview();
      }
    }).bind(this));
  },

  /**
   * Load Themes
   *
   * @function
   */
  load: function () {
    SL.helpers.PageLoader.show({
      message: "Loading themes"
    });

    $.ajax({
      type: "GET",
      url: SL.config.AJAX_THEMES_LIST,
      context: this
    }).done(function (data) {
      this.themeData.clear();
      data.results.forEach((function (result) {
        this.themeData.push(new SL.models.Theme(result));
      }).bind(this));
    }).fail(function () {
      SL.notify(SL.locale.get('T.THEME_LIST_LOAD_ERROR'), 'negative');
    }).always(function () {
      this.renderList();
      SL.helpers.PageLoader.hide();
    });
  },

  /**
   * Render Theme List View
   *
   * @function
   */
  renderList: function () {
    this.$listElement.empty();

    if (this.themeData.isEmpty()) {
      this.$listElement.html([
        '<p class="theme-list-empty">',
          SL.locale.get('T.THEME_LIST_EMPTY'),
        '</p>'].join(''));
    } else {
      this.themeData.forEach(this.renderListItem.bind(this));
      SL.view.parseTimes();
    }

    this.updateListDefault();
  },

  /**
   * Render List Item
   *
   * @function
   * @param {Object} theme -The Theme Object Data
   * @param {Number} index -The Display Index
   * @returns {*}
   */
  renderListItem: function (theme, index) {
    index = $.extend({
      prepend:   false,
      showDelay: 0
    }, index);

    var $item =
      this.$listElement.find('[data-theme-id="' + theme.get('id') + '"]');

    if ($item.length > 0) {
      $item.find('.theme-list-item-title')
        .text(theme.get('name'))
        .attr('title', theme.get('name'));
    } else {
      $item =
        $([
          '<div class="theme-list-item" data-theme-id="' + theme.get('id') + '">',
            '<div class="theme-list-item-thumbnail"></div>',
            '<h2 class="theme-list-item-title" title="' + theme.get('name') + '">',
              theme.get('name'),
            '</h2>',
            '<div class="theme-list-item-metadata">',
              '<div class="theme-list-item-metadata-field">',
                'Created <time class="date" datetime="' + theme.get('created_at') + '"></time>',
              '</div>',
              '<div class="theme-list-item-metadata-field">' +
                'Updated <time class="ago" datetime="' + theme.get("updated_at") + '"></time>',
              '</div>',
            '</div>',
            '<div class="theme-list-item-controls">',
              '<button class="button outline l delete" data-tooltip="' + SL.locale.get("T.THEME_DELETE_TOOLTIP") + '">',
                '<span class="icon i-trash-stroke"></span>',
              '</button>',
              '<button class="button outline l edit" data-tooltip="' + SL.locale.get("T.THEME_EDIT_TOOLTIP") + '">',
                '<span class="icon i-pen-alt2"></span>',
              '</button>',
              '<button class="button outline l default" data-tooltip="' + SL.locale.get("T.THEME_MAKE_DEFAULT_TOOLTIP") + '">',
                '<span class="icon i-checkmark"></span>',
              '</button>',
            '</div>',
          '</div>'].join(''));

      if (index.prepend === true) {
        $item.prependTo(this.$listElement);
      } else {
        $item.appendTo(this.$listElement);
      }

      if (index.showDelay > 0) {
        $item.hide();
        window.setTimeout(function () {
          $item.show();
        }, index.showDelay);
      }

      if (theme.hasThumbnail()) {
        var url = theme.get('thumbnail_url');

        $item.find('.theme-list-item-thumbnail')
          .css('background-image', 'url("' + url + '")')
          .attr('data-thumb-url"', url);
      }

      $item.off('click').on('click', (function (evt) {
        if ($(evt.target).closest('.theme-list-item-controls .delete').length) {
          this.removeTheme(
            theme,
            null,
            $(evt.target).closest('.theme-list-item-controls .delete'));
        } else if ($(evt.target).closest('.theme-list-item-controls .default').length) {
          if ($item.hasClass('default')) {
            this.unmakeDefaultTheme();
          } else {
            this.makeDefaultTheme(theme);
          }
        } else {
          this.editTheme(theme);
        }
      }).bind(this));

      return $item;
    }
  },

  /**
   * Refresh List Item Thumb
   *
   * @function
   * @param {jQuery|HTMLElement} $theme -The Theme Element
   */
  refreshListItemThumb: function ($theme) {
    if ($theme && $theme.length) {
      var $thumbnail = $theme.find(".theme-list-item-thumbnail"),
        thumbUrl     = $thumbnail.attr("data-thumb-url");

      if (thumbUrl) {
        thumbUrl = thumbUrl + '?' + Math.round(1e4 * Math.random());
        $thumbnail.css('background-image', 'url("' + thumbUrl + '")');
      }
    }
  },

  /**
   * Update List Default
   *
   * @function
   */
  updateListDefault: function () {
    this.$listElement
      .find('.theme-list-item')
      .each(function (index, element) {
        element = $(element);
        var enable = element.attr('data-theme-id') ===
          SL.current_team.get('default_theme_id');
        element.toggleClass('default', enable);

        enable = SL.locale.get(element.hasClass('default') ?
          'T.THEME_IS_DEFAULT_TOOLTIP' :
          'T.THEME_MAKE_DEFAULT_TOOLTIP');
        element
          .find('.theme-list-item-controls .default')
          .attr('data-tooltip', enable);
      });
  },

  /**
   * Edit Theme
   *
   * @function
   * @param {Object|*} theme -The Theme Object
   */
  editTheme: function (theme) {
    SL.fonts.loadAll();

    if (this.panel) {
      this.panel.close((function () {
        this.editTheme(theme);
      }).bind(this));

      return false;
    }

    $('html').addClass('is-editing-theme');

    var config = {};

    if (this.VERSION === 1) {
      config = {
        colors: SL.config.V1.THEME_COLORS,
        fonts:  SL.config.V1.THEME_FONTS,
        center:       true,
        rollingLinks: true
      };
    } else {
      config = {
        colors: SL.config.THEME_COLORS,
        fonts:  SL.config.THEME_FONTS,
        center:       false,
        rollingLinks: false
      };
    }

    this.panel = new SL.views.themes.edit.Panel(this, theme, config);
    this.panel.destroyed.add((function () {
      this.setSelectedListItem(null);
      $('html').removeClass('is-editing-theme');
      this.panel = null;
    }).bind(this));
    this.setSelectedListItem(theme);
    this.bindLadda();
  },

  /**
   * Create Theme
   *
   * @function
   */
  createTheme: function () {
    $.ajax({
      type: 'POST',
      url: SL.config.AJAX_THEMES_CREATE,
      data: {
        theme: {
          font:                  SL.config.DEFAULT_THEME_FONT,
          color:                 SL.config.DEFAULT_THEME_COLOR,
          transition:            SL.config.DEFAULT_THEME_TRANSITION,
          background_transition: SL.config.DEFAULT_THEME_BACKGROUND_TRANSITION
        }
      },
      context: this
    }).done(function (data) {
      var theme = new SL.models.Theme(data);

      if (this.themeData.isEmpty()) {
        this.themeData.push(theme);
        this.renderList();
        this.makeDefaultTheme(theme, null, true);
      } else {
        this.themeData.push(theme);
        this.renderListItem(theme, {
          prepend:   true,
          showDelay: 3000
        });
        SL.view.parseTimes();
      }

      this.editTheme(theme);
    }).fail(function () {
      SL.notify(SL.locale.get('T.THEME_CREATE_ERROR'), 'negative');
    });
  },

  /**
   * Save Theme
   *
   * @function
   * @param {Object|*} theme     -The Theme Object
   * @param {Function} successCb -The Success Callback
   * @param {Function} failCb    -The Fail Callback
   */
  saveTheme: function (theme, successCb, failCb) {
    $.ajax({
      type: 'PUT',
      url: SL.config.AJAX_THEMES_UPDATE(theme.get('id')),
      data: {
        theme: theme.toJSON()
      },
      context: this
    }).done(function (data) {
      var $item = this.renderListItem(new SL.models.Theme(data));
      SL.view.parseTimes();

      if (data && data.sanitize_messages && data.sanitize_messages.length) {
        SL.notify(data.sanitize_messages[0], 'negative');
      } else {
        SL.notify(SL.locale.get('T.THEME_SAVE_SUCCESS'));
      }

      SL.util.callback(successCb);

      window.setTimeout((function () {
        this.refreshListItemThumb($item);
      }).bind(this), 2500);

      window.setTimeout((function () {
        this.refreshListItemThumb($item);
      }).bind(this), 5000);
    }).fail(function () {
      SL.notify(SL.locale.get('T.THEME_SAVE_ERROR'), 'negative');
      SL.util.callback(failCb);
    });
  },

  /**
   * Remove theme
   *
   * @function
   * @param {Object|*}           theme     -The Theme Object
   * @param {Function}           successCb -The Success Callback
   * @param {jQuery|HTMLElement} anchor    -The Prompt Parent Element
   */
  removeTheme: function (theme, successCb, anchor) {
    var item = this.getListItem(theme);

    SL.prompt({
      anchor: anchor,
      title: SL.locale.get('T.THEME_REMOVE_CONFIRM'),
      type: 'select',
      offsetX: 15,
      data: [{
        html: '<h3>Cancel</h3>'
      }, {
        html: '<h3>Delete</h3>',
        selected: true,
        className: 'negative',
        callback: (function () {
          var id = theme.get('id');

          $.ajax({
            type: 'DELETE',
            url: SL.config.AJAX_THEMES_DELETE(id),
            context: this
          }).done(function () {
            SL.util.anim.collapseListItem(item, function () {
              item.remove();
            });
            SL.util.callback(successCb);

            this.themeData.removeByProperties({
              id: id
            });

            if (this.panel && this.panel.getTheme().get('id') === id) {
              this.panel.destroy();
            }

            SL.notify(SL.locale.get('T.THEME_REMOVE_SUCCESS'));
          }).fail(function () {
            SL.notify(SL.locale.get('T.THEME_REMOVE_ERROR'), 'negative');
          });
        }).bind(this)
      }]
    });
  },

  /**
   * Make Default Theme
   *
   * @function
   * @param {Object|*} theme     -The Theme Object
   * @param {Function} successCb -The Success Callback
   * @param {boolean}  notify    -Is Show Notify
   */
  makeDefaultTheme: function (theme, successCb, notify) {
    $.ajax({
      type: 'PUT',
      url: SL.config.AJAX_UPDATE_ORGANIZATION,
      data: {
        team: {
          default_theme_id: theme.get('id')
        }
      },
      context: this
    }).done(function () {
      SL.current_team.set('default_theme_id', theme.get('id'));
      this.updateListDefault();

      if (notify) {
        SL.notify(SL.locale.get('T.THEME_DEFAULT_SAVE_SUCCESS'));
      }

      SL.util.callback(successCb);
    }).fail(function () {
      if (notify) {
        SL.notify(SL.locale.get('T.THEME_DEFAULT_SAVE_ERROR'), 'negative');
      }
    });
  },

  /**
   * Unmake Default Theme
   *
   * @function
   * @param {Function} successCb -The Success Callback
   * @param {boolean}  notify    -Is Show Notify
   */
  unmakeDefaultTheme: function (successCb, notify) {
    $.ajax({
      type: 'PUT',
      url: SL.config.AJAX_UPDATE_ORGANIZATION,
      data: {
        team: {
          default_theme_id: null
        }
      },
      context: this
    }).done(function () {
      SL.current_team.set('default_theme_id', null);
      this.updateListDefault();

      if (notify) {
        SL.notify(SL.locale.get('T.THEME_DEFAULT_SAVE_SUCCESS'));
      }

      SL.util.callback(successCb);
    }).fail(function () {
      if (notify) {
        SL.notify(SL.locale.get('T.THEME_DEFAULT_SAVE_ERROR'), 'negative');
      }
    });
  },

  /**
   * Get List Item
   *
   * @function
   * @param {Object} theme -The Theme Object Data
   * @returns {jQuery|HTMLElement|*} The Item Element
   */
  getListItem: function (theme) {
    return this.$listElement
      .find('[data-theme-id="' + (theme ? theme.get('id') : null) + '"]');
  },

  /**
   * Set Selected List Item
   *
   * @function
   * @param {Object} theme -The Theme Object Data
   */
  setSelectedListItem: function (theme) {
    this.listElement.find('.theme-list-item').removeClass('selected');

    var $item = this.getListItem(theme);

    if ($item.length) {
      $item.addClass('selected');
    }
  },

  /**
   * Refresh Preview
   *
   * @function
   * @param {Object} theme -The Theme Object Data
   */
  refreshPreview: function (theme) {
    theme = theme || this.previewTheme;

    var preWin = this.getPreviewWindow();

    if (preWin && theme && preWin.SL && preWin.SL.helper) {
      preWin.SL.helpers.ThemeController.paint(theme, {
        center: this.VERSION === 1
      });
    }
  },

  /**
   * Reload Preview
   *
   * @function
   */
  reloadPreview: function () {
    var preWin = this.getPreviewWindow();

    if (preWin) {
      preWin.location.reload();
    }
  },

  /**
   * Get Preivew Window
   *
   * @function
   * @returns {window|*}
   */
  getPreviewWindow: function () {
    return this.$previewFrame.length ?
      this.$previewFrame.get(0).contentWindow : null;
  },

  /**
   * @function
   * @returns {*}
   */
  onWindowBeforeUnload: function () {
    if (this.panel && this.panel.hasUnsavedChanges()) {
      return SL.locale.get('T.LEAVE_UNSAVED_THEME');
    }

    return void 0;
  },

  /**
   * @function
   * @param {Event} evt
   */
  onCreateThemeClicked: function (evt) {
    evt.preventDefault();
    this.createTheme();
  }
});

SL('views.themes.edit').Panel          = Class.extend({
  PAGES: [{
    name:    'Settings',
    id:      'settings',
    factory: 'renderSettings'
  }, {
    name:    'CSS',
    id:      'css',
    factory: 'renderCSS'
  }, {
    name:    'HTML',
    id:      'html',
    factory: 'renderHTML'
  }, {
    name:    'JS',
    id:      'js',
    factory: 'renderJS',
    condition: function () {
      return SL.current_team.get('allow_scripts');
    }
  }, {
    name:    'Palette',
    id:      'palette',
    factory: 'renderPalette',
    condition: function () {
      return this.editor.VERSION > 1;
    }
  }, {
    name:    'Snippets',
    id:      'snippets',
    factory: 'renderSnippets'
  }],

  /**
   * Constructor SL.views.themes.edit.Panel Instance
   *
   * @function
   * @param {Object}   editor -The Editor Instance
   * @param {Object|*} theme  -The Theme Object
   * @param {Object|*} config -The Config Options
   */
  init: function (editor, theme, config) {
    this.editor = editor;
    this.theme  = theme;
    this.themeOptionsConfig = config;
    this.previewTimeout     = -1;
    this.destroyed = new window.signals.Signal();

    this.updatePreview = this.updatePreview.bind(this);
    this.paintPreview  = this.paintPreview.bind(this);

    this.render();
    this.load();
  },

  /**
   * Load Theme
   *
   * @function
   */
  load: function () {
    this.theme.load().done((function (data) {
      this.theme = new SL.models.Theme(data);
      this.$preloaderElement.addClass('hidden');

      window.setTimeout((function () {
        this.$preloaderElement.remove();
        this.$preloaderElement = null;
      }).bind(this), 400);

      this.renderHeader();
      this.renderPages();
      this.bind();

      this.showPage('settings');
      this.paintPreview();

      this.savedJSON = JSON.stringify(this.theme.toJSON());
      this.checkUnsavedChanges();
    }).bind(this)).fail((function () {
      this.close();
      SL.notify(SL.locale.get('T.GENERIC_ERROR'), 'negative');
    }).bind(this));
  },

  /**
   * Render Theme Panel
   *
   * @function
   */
  render: function () {
    this.$domElement = $('<div class="panel">');
    this.$domElement.appendTo(this.editor.$editorInnerElement);

    this.$pagesElement = $('<div class="pages">');
    this.$pagesElement.appendTo(this.$domElement);

    this.$preloaderElement =
      $([
        '<div class="preloader">' +
          '<div class="preloader-inner">' +
            '<div class="preloader-spinner"></div>' +
          '</div>' +
        '</div>'].join(''));
    this.$preloaderElement.appendTo(this.editor.$editorInnerElement);

    SL.util.html.generateSpinners();
  },

  /**
   * Render Panel Header
   *
   * @function
   */
  renderHeader: function () {
    this.$headerElement =
      $('<header class="panel-header">').appendTo(this.$domElement);
    this.$tabsElement =
      $('<div class="page-tabs">').appendTo(this.$headerElement);
    this.$cancelButton =
      $('<button class="button l grey cancel-button">关闭</button>')
        .appendTo(this.$headerElement);
    this.$saveButton =
      $([
        '<button class="button l positive save-button ladda-button" data-style="zoom-out">',
          'Save',
        '</button>'].join('')).appendTo(this.$headerElement);

    this.$saveButton.data('ladda', window.Ladda.create(this.saveButton.get(0)));

    this.onSaveClicked   = this.onSaveClicked.bind(this);
    this.onCancelClicked = this.onCancelClicked.bind(this);

    this.$saveButton.on('click', this.onSaveClicked);
    this.$cancelButton.on('click', this.onCancelClicked);
  },

  /**
   * Render Theme Pages
   *
   * @function
   */
  renderPages: function () {
    this.PAGES.forEach((function (page) {
      if (typeof page.condition === "function" || page.condition.call(this)) {
        $([
          '<button class="page-tab" data-page-id="' + page.id + '">',
            page.name,
          '</button>'].join(''))
          .on('click', this.showPage.bind(this, page.id))
          .appendTo(this.$tabsElement);
        this[page.factory]();
      }
    }).bind(this));
  },

  /**
   * Render Settings
   *
   * @function
   */
  renderSettings: function () {
    this.$settingsElement =
      $('<div class="page sl-form" data-page-id="settings">')
        .appendTo(this.$pagesElement);
    this.$settingsElement.append([
      '<div class="unit name" data-required>' +
        '<label for="">Name</label>' +
        '<input id="theme-name" placeholder="Theme name" type="text" value="' +
          (this.theme.get('name') || 'Untitled') + '">' +
      '</div>'].join(''));

    this.$settingsElement
      .find('#theme-name')
      .on("change", this.paintPreview);
    this.$settingsElement
      .find('#theme-name')
      .on('input', this.onNameInputChanged.bind(this));

    this.renderThemeOptions();
  },

  /**
   * Render Theme Options
   *
   * @function
   */
  renderThemeOptions: function () {
    var themeConfig = $.extend(this.themeOptionsConfig, {
      model:     this.theme,
      container: this.$settingsElement
    });

    if (themeConfig.colors[themeConfig.colors.length - 1].id === 'no-color') {
      themeConfig.colors.push({
        id:      'no-color',
        tooltip: 'Specifies as few color styles as possible, useful if you want to write custom CSS from the ground up.'
      });
    }

    if (themeConfig.fonts[themeConfig.fonts.length - 1].id === 'no-font') {
      themeConfig.fonts.push({
        id:      'no-font',
        title:   'None',
        tooltip: 'Specifies as few typographic styles as possible, useful if you want to write custom CSS from the ground up.'
      });
    }

    this.themeOptions = new SL.components.ThemeOptions(themeConfig);
    this.themeOptions.changed.add(this.paintPreview);
  },

  /**
   * Render Css
   *
   * @function
   */
  renderCSS: function () {
    this.$cssElement =
      $('<div class="page" data-page-id="css">')
        .appendTo(this.$pagesElement);
    this.$cssElement
      .append([
        '<div class="editor-wrapper">',
          '<div id="ace-less" class="editor"></div>',
          '<div class="error"></div>',
          '<div class="info" data-tooltip="',
            SL.locale.get('T.THEME_CSS_DESCRIPTION'),
            '" data-tooltip-maxwidth="300" data-tooltip-align="left">',
            '<span class="icon i-info"></span>',
          '</div>',
        '</div>'].join(''));

    this.$cssErrorElement = this.$cssElement.find('.error');

    try {
      this.cssEditor = window.ace.edit('ace-less');
      this.cssEditor.setTheme('ace/theme/monokai');
      this.cssEditor.setDisplayIndentGuides(true);
      this.cssEditor.setShowPrintMargin(false);
      this.cssEditor.getSession().setMode('ace/mode/less');
      this.cssEditor.env.document.setValue(this.theme.get('less') || '');
      this.cssEditor.env.editor
        .on('change', this.onCSSInputChanged.bind(this));
      this.syncCSS();
    } catch (err) {
      console.log('An error occurred while initializing the Ace CSS editor.');
    }
  },

  /**
   * Sync Css
   *
   * @function
   */
  syncCSS: function () {
    var cssDescription = '',
      customClasses = SL.util.string.getCustomClassesFromLESS(
        this.cssEditor.env.document.getValue());

    if (customClasses.length) {
      cssDescription = 'Found custom slide classes:<br>- ' +
        customClasses.join('<br>- ') +
        '<br><br>' + SL.locale.get('T.THEME_CSS_DESCRIPTION');
    } else {
      cssDescription = SL.locale.get('T.THEME_CSS_DESCRIPTION');
    }

    this.$cssElement.find('.info')
      .toggleClass('positive', customClasses.length > 0);
    this.$cssElement.find('.info').attr('data-tooltip', cssDescription);
  },

  /**
   * Render Theme HTML
   *
   * @function
   */
  renderHTML: function () {
    this.$htmlElement =
      $('<div class="page" data-page-id="html">')
        .appendTo(this.$pagesElement);
    this.$htmlElement
      .append([
        '<div class="editor-wrapper">' +
          '<div id="ace-html" class="editor"></div>' +
          '<div class="info" data-tooltip="' +
            SL.locale.get('T.THEME_HTML_DESCRIPTION') +
            '" data-tooltip-maxwidth="300" data-tooltip-align="left">' +
            '<span class="icon i-info"></span>' +
          '</div>' +
        '</div>'].join(''));

    try {
      this.htmlEditor = window.ace.edit('ace-html');
      this.htmlEditor.setTheme('ace/theme/monokai');
      this.htmlEditor.setDisplayIndentGuides(true);
      this.htmlEditor.setShowPrintMargin(false);
      this.htmlEditor.getSession().setMode('ace/mode/html');
      this.htmlEditor.env.document.setValue(this.theme.get('html') || '');
      this.htmlEditor.env.editor
        .on('change', this.onHTMLInputChanged.bind(this));
    } catch (err) {
      console.log('An error occurred while initializing the Ace HTML editor.');
    }
  },

  /**
   * Render Js
   *
   * @function
   */
  renderJS: function () {
    this.$jsElement =
      $('<div class="page" data-page-id="js">')
        .appendTo(this.$pagesElement);
    this.$jsElement
      .append([
        '<div class="editor-wrapper">' +
          '<div id="ace-js" class="editor"></div>' +
            '<div class="info" data-tooltip="' +
            SL.locale.get('T.THEME_JS_DESCRIPTION') +
            '" data-tooltip-maxwidth="300" data-tooltip-align="left">' +
            '<span class="icon i-info"></span>' +
          '</div>' +
        '</div>'].join(''));

    try {
      this.jsEditor = window.ace.edit('ace-js');
      this.jsEditor.setTheme('ace/theme/monokai');
      this.jsEditor.setDisplayIndentGuides(true);
      this.jsEditor.setShowPrintMargin(false);
      this.jsEditor.getSession().setMode('ace/mode/javascript');
      this.jsEditor.env.document.setValue(this.theme.get('js') || '');
      this.jsEditor.env.editor
        .on('change', this.onJSInputChanged.bind(this));
    } catch (t) {
      console.log('An error occurred while initializing the Ace JS editor.');
    }
  },

  /**
   * Render Palette
   *
   * @function
   */
  renderPalette: function () {
    this.palette =
      new SL.views.themes.edit.pages.Palette(this.editor, this.theme);

    this.palette.appendTo(this.$pagesElement);
    this.palette.changed.add(this.checkUnsavedChanges.bind(this));
  },

  /**
   * Render Snippets
   *
   * @function
   */
  renderSnippets: function () {
    this.snippets =
      new SL.views.themes.edit.pages.Snippets(this.editor, this.theme);

    this.snippets.appendTo(this.$pagesElement);
    this.snippets.changed.add(this.checkUnsavedChanges.bind(this));
  },

  /**
   * Bind Event
   *
   * @function
   */
  bind: function () {
    this.onDocumentKeyDown = this.onDocumentKeyDown.bind(this);
    $(document).on('keydown', this.onDocumentKeyDown);
  },

  /**
   * Show Theme Page
   *
   * @function
   * @param {String|Number|*} pageId -The Theme Page Id
   */
  showPage: function (pageId) {
    this.$domElement
      .find('.page').removeClass('past present future');
    this.$domElement
      .find('.page[data-page-id="' + pageId + '"]')
      .addClass('present');
    this.$domElement
      .find('.page[data-page-id="' + pageId + '"]')
      .prevAll()
      .addClass('past');
    this.$domElement
      .find('.page[data-page-id="' + pageId + '"]')
      .nextAll()
      .addClass('future');
    this.$domElement
      .find('.panel-header .page-tab')
      .removeClass('selected');
    this.$domElement
      .find('.panel-header .page-tab[data-page-id="' + pageId + '"]')
      .addClass('selected');

    if (pageId === 'css' && this.cssEditor) {
      this.cssEditor.focus();
    } else if (pageId === 'html' && this.htmlEditor) {
      this.htmlEditor.focus();
    } else if (pageId === 'js' && this.jsEditor) {
      this.jsEditor.focus();
    } else if (pageId === 'palette' && this.palette) {
      this.palette.refresh();
    }

    window.setTimeout((function () {
      this.$domElement.find('.page').addClass('transition');
    }).bind(this), 1);

    this.resetScrollPosition();
  },

  /**
   * Reset Scrool Position
   *
   * @function
   */
  resetScrollPosition: function () {
    this.$domElement.scrollLeft(0).scrollTop(0);
    this.$settingsElement.scrollLeft(0).scrollTop(0);
  },

  /**
   * Update Preview
   *
   * @function
   * @param {Number|*} delay -The Update Preview Delay Time
   */
  updatePreview: function (delay) {
    if (typeof delay !== "number") {
      delay = 250;
    }

    clearTimeout(this.previewTimeout);

    this.previewTimeout = window.setTimeout((function () {
      this.paintPreview();
    }).bind(this), delay);
  },

  /**
   * Paint Preview
   *
   * @function
   */
  paintPreview: function () {
    this.preProcess((function () {
      this.editor.refreshPreview(this.theme);
    }).bind(this), (function () {
      this.editor.refreshPreview(this.theme);
    }).bind(this));
  },

  /**
   * PreProcess Paint
   *
   * @function
   * @param {Function} successCb -The Success Callback
   * @param {Function} failCb    -The Fail Callback
   */
  preProcess: function (successCb, failCb) {
    this.theme.set('name', this.$domElement.find('#theme-name').val());

    if (this.cssEditor) {
      this.theme.set('less', this.cssEditor.env.document.getValue());
    }

    if (this.htmlEditor) {
      this.theme.set('html', this.htmlEditor.env.document.getValue());
    }

    if (this.jsEditor) {
      this.theme.set('js', this.jsEditor.env.document.getValue());
    }

    if (!this.cssParser) {
      // TODO: less no define
      this.cssParser = new window.less.Parser();
    }

    var env = this.cssEditor.env.document.getValue();

    if (env) {
      this.cssParser.parse('.reveal { ' + env + ' }', (function (err, tree) {
        if (err) {
          this.$cssErrorElement.addClass('visible');
          this.$cssErrorElement.html(err.message);
          SL.util.callback(failCb, err);
        } else {
          this.cssErrorElement.removeClass('visible');

          var css = '';

          try {
            css = tree.toCSS();
          } catch (err) {
            console.log(err);
          }

          if (css) {
            var str = '';
            css = css.replace(
              /@import url\(["'\s]*(http:|https:)?\/\/(.*)\);?/gi,
              function (s) {
                str += s + '\n';
                return "";
              });
            css = str + css;

            this.theme.set('less', env);
            this.theme.set('css', css);

            SL.util.callback(successCb);
          } else {
            SL.util.callback(failCb);
          }
        }

        this.checkUnsavedChanges();
      }).bind(this));
    } else {
      this.theme.set('less', '');
      this.theme.set('css', '');
      SL.util.callback(successCb);
    }

    this.checkUnsavedChanges();
  },

  /**
   * Have Unsaved Changes
   *
   * @function
   * @returns {*|boolean} True have unsaved change, False or not.
   */
  hasUnsavedChanges: function () {
    return this.theme && this.savedJSON !== JSON.stringify(this.theme.toJSON());
  },

  /**
   * Check Unsaved Change
   *
   * @function
   */
  checkUnsavedChanges: function () {
    this.$domElement.toggleClass('has-unsaved-changes', this.hasUnsavedChanges());
  },

  /**
   * Save
   *
   * @function
   * @param {Function} saveCb -The Save Callback
   */
  save: function (saveCb) {
    var ladda = this.saveButton.data('ladda');

    if (ladda) {
      ladda.start();
    }

    this.preProcess((function () {
      this.editor.saveTheme(this.theme, (function () {
        if (ladda) {
          ladda.stop();
        }

        this.savedJSON = JSON.stringify(this.theme.toJSON());
        this.checkUnsavedChanges();
        SL.util.callback(saveCb);
      }).bind(this), (function () {
        if (ladda) {
          ladda.stop();
        }
      }).bind(this));
    }).bind(this), (function () {
      SL.notify('Please fix all CSS errors before saving', 'negative');

      if (ladda) {
        ladda.stop();
      }
    }).bind(this));
  },

  /**
   * Close
   *
   * @function
   * @param {Function} closeCb -The Close Callback
   */
  close: function (closeCb) {
    if (this.hasUnsavedChanges()) {
      SL.prompt({
        anchor: this.cancelButton,
        title: SL.locale.get('T.WARN_UNSAVED_CHANGES'),
        alignment: 'b',
        type: 'select',
        data: [{
          html: '<h3>Cancel</h3>'
        }, {
          html: '<h3>Discard</h3>',
          className: 'divider',
          callback: (function () {
            this.destroy();
            SL.util.callback(closeCb);
          }).bind(this)
        }, {
          html: '<h3>Save</h3>',
          className: 'positive',
          selected: true,
          callback: function () {
            SL.util.callback(closeCb);
            this.save(this.destroy.bind(this));
          }.bind(this)
        }]
      });
    } else {
      this.destroy();
      SL.util.callback(closeCb);
    }
  },

  /**
   * Get Theme
   *
   * @function
   * @returns {*|Object} Theme Object
   */
  getTheme: function () {
    return this.theme;
  },

  /**
   * @function
   */
  onCSSInputChanged: function () {
    this.syncCSS();
    this.updatePreview();
  },

  /**
   * @function
   */
  onHTMLInputChanged: function () {
    this.updatePreview();
  },

  /**
   * @function
   */
  onJSInputChanged: function () {
    this.updatePreview(1000);
  },

  /**
   * @function
   */
  onNameInputChanged: function () {
    this.theme.set('name', this.$domElement.find('#theme-name').val());
    this.checkUnsavedChanges();
  },

  /**
   * @function
   */
  onSaveClicked: function () {
    this.save();
  },

  /**
   * @function
   */
  onCancelClicked: function () {
    this.close();
  },

  /**
   * @function
   * @param {Event} evt
   */
  onDocumentKeyDown: function (evt) {
    if ((evt.metaKey || evt.ctrlKey) && evt.keyCode === 83) {
      if (this.hasUnsavedChanges()) {
        this.save();
      }

      evt.preventDefault();
    }
  },

  /**
   * @function
   */
  destroy: function () {
    if (!this.isDestroyed) {
      this.isDestroyed = true;
      clearTimeout(this.previewTimeout);

      this.destroyed.dispatch();
      this.destroyed.dispose();

      $(document).off('keydown', this.onDocumentKeyDown);

      window.setTimeout((function () {
        if (this.cssEditor) {
          this.cssEditor.destroy();
          this.cssEditor = null;
        }

        if (this.htmlEditor) {
          this.htmlEditor.destroy();
          this.htmlEditor = null;
        }

        if (this.jsEditor) {
          this.jsEditor.destroy();
          this.jsEditor = null;
        }

        if (this.palette) {
          this.palette.destroy();
          this.palette = null;
        }

        if (this.snippets) {
          this.snippets.destroy();
          this.snippets = null;
        }

        if (this.themeOptions) {
          this.themeOptions.destroy();
        }

        if (this.$preloaderElement) {
          this.$preloaderElement.remove();
        }

        if (this.$domElement) {
          this.$domElement.remove();
        }
      }).bind(this), 500);
    }
  }
});

SL('views.themes.edit.pages').Palette  = Class.extend({
  /**
   * Constructor SL.views.themes.edit.pages.Palette Instance
   *
   * @function
   * @param {Object} editor -The Editor Instance
   * @param {Object} theme  -The Theme Data
   */
  init: function (editor, theme) {
    this.editor = editor;
    this.theme  = theme;

    this.changed = new window.signals.Signal();

    this.onDocumentMouseUp   = this.onDocumentMouseUp.bind(this);
    this.onDocumentMouseMove = this.onDocumentMouseMove.bind(this);
    this.onSaveButtonClicked = this.onSaveButtonClicked.bind(this);
    this.onListItemDelete    = this.onListItemDelete.bind(this);
    this.onListItemMouseDown = this.onListItemMouseDown.bind(this);

    this.render();
    this.bind();
  },

  /**
   * Render View
   *
   * @function
   */
  render: function () {
    this.$domElement = $('<div class="page" data-page-id="palette">');
    this.$domElement.html([
      '<div class="page-header">',
        '<h4>Color Palette</h4>',
        '<p>',
          'Replace the default color options that we offer throughout the' +
          ' deck editor with your own custom color palette. ' +
          '<a class="documentation-link" href="#">More info</a>',
        '</p>',
        '<div class="documentation">',
          '<p>',
            'A color picker component appears in multiple places inside of ' +
            'the deck editor, such as when setting text or slide background ' +
            'color. Inside of that color picker we display a preset color ' +
            'palette. If you define a custom color palette here anyone using ' +
            'this theme will see your custom palette instead of our defaults.',
          '</p>',
          '<h5>Reset</h5>',
          '<p>',
            'If no custom colors are added here we\'ll show our default ' +
            'palette. Colors can be deleted by clicking the trash icon that ' +
            'appears when hovering over them with your mouse pointer.',
          '</p>',
          '<h5>Rearrange</h5>',
          '<p>',
            'Drag and drop colors in your palette to change their order.',
          '</p>',
        '</div>',
      '</div>',
      '<div class="page-body">',
        '<div class="palette-picker">',
          '<div class="palette-picker-api"></div>',
        '</div>',
        '<ul class="palette-list"></ul>',
      '</div>'].join(''));
    this.$innerElement     = this.$domElement.find('.page-body');
    this.$pickerElement    = this.$domElement.find('.palette-picker');
    this.$pickerAPIElement = this.$domElement.find('.palette-picker-api');
    this.$listElement      = this.$domElement.find('.palette-list');
    this.$documentationLinkElement = this.$domElement.find('.page-header .documentation-link');
    this.$documentationElement     = this.$domElement.find('.page-header .documentation');
    this.$documentationElement.hide();

    this.renderPicker();
    this.renderList();
    this.checkIfEmpty();
  },

  /**
   * Render Color Picker
   *
   * @function
   */
  renderPicker: function () {
    this.$pickerAPIElement.spectrum({
      flat:        true,
      showInput:   true,
      showButtons: false,
      showInitial: false,
      showPalette: false,
      showSelectionPalette: false,
      preferredFormat: 'hex',
      className:       'palette-picker-spectrum',
      move: (function (color) {
        this.setPreviewColor(color.toHexString());
      }).bind(this),
      change: (function (color) {
        this.setPreviewColor(color.toHexString());
      }).bind(this)
    });
    this.$domElement
      .find('.palette-picker-spectrum .sp-input-container')
      .append([
        '<div class="palette-picker-save-button">',
          '<span class="icon i-plus"></span>',
          'Save color',
        '</div>'].join(''));
    this.$pickerSaveButton =
      this.$domElement.find('.palette-picker-save-button');
  },

  /**
   * Render Palette List
   *
   * @function
   */
  renderList: function () {
    this.$listElement.empty();
    this.theme.get('palette').forEach(this.renderListItem.bind(this));
  },

  /**
   * Render List Item
   *
   * @function
   * @param {Color} item -The Color
   * @returns {*|jQuery|HTMLElement} -The Form Element
   */
  renderListItem: function (item) {
    var $slForm = $('<li class="palette-list-item sl-form">');
    $slForm.data('color', item);
    $slForm.html([
      '<div class="palette-list-item-color"></div>',
      '<div class="palette-list-item-label">' + item + '</div>',
      '<div class="palette-list-item-delete">' +
        '<span class="icon i-trash-stroke"></span>' +
      '</div>'].join(''));
    $slForm.appendTo(this.$listElement);

    $slForm.toggleClass('is-light', window.tinycolor(item).isLight());
    $slForm.find('.palette-list-item-color').css('background-color', item);
    $slForm.find('.palette-list-item-delete').on('click', this.onListItemDelete);
    $slForm.on('mousedown', this.onListItemMouseDown);

    return $slForm;
  },

  /**
   * Bind Event
   *
   * @function
   */
  bind: function () {
    this.$documentationLinkElement
      .on('click', this.onDocumentationLinkClicked.bind(this));
    this.$pickerSaveButton
      .on('click', this.onSaveButtonClicked.bind(this));
  },

  /**
   * Append To Parent Element
   *
   * @function
   * @param {jQuery|Dom|*} $element -The Parent Element
   */
  appendTo: function ($element) {
    this.$domElement.appendTo($element);
  },

  /**
   * Set Preview Color
   *
   * @function
   * @param {Hex|String|RGB} clr -The Preview Background Color
   */
  setPreviewColor: function (clr) {
    this.$pickerSaveButton.css({
      color: window.tinycolor(clr).isLight() ? '#222' : '#fff',
      backgroundColor: clr
    });
  },

  /**
   * Check If Empty
   *
   * @function
   */
  checkIfEmpty: function () {
    if (this.$listElement.find('.palette-list-item').length === 0) {
      this.$listElement.append([
        '<span class="palette-list-empty">',
          'No custom colors have been added to the palette. ' +
          'Click "Save color" to add one now.',
        '</span>'].join(''));
    } else {
      this.$listElement.find('.palette-list-empty').remove();
    }
  },

  /**
   * Refresh
   *
   * @function
   */
  refresh: function () {
    this.$pickerAPIElement.spectrum('set', '#000');
    this.$pickerAPIElement.spectrum('reflow');
    this.setPreviewColor('#000');
  },

  /**
   * Persist
   *
   * @function
   */
  persist: function () {
    var ary = this.$listElement
      .find('.palette-list-item:not(.element)')
      .map(function () {
        return $(this).data('color');
      }).toArray();

    this.theme.set('palette', ary);
    this.checkIfEmpty();
    this.changed.dispatch();
  },

  /**
   * @function
   */
  destroy: function () {
    this.changed.dispose();
    this.$listElement.find('.palette-list-item').off();

    this.editor = null;
    this.theme  = null;
  },

  /**
   * @function
   * @param {Event} evt
   */
  onDocumentationLinkClicked: function (evt) {
    evt.preventDefault();

    this.$documentationElement.toggle();
    this.$documentationLinkElement.text(
      this.$documentationElement.is(':visible') ? 'Less info' : 'More info');
  },

  /**
   * @function
   */
  onSaveButtonClicked: function () {
    this.$listElement
      .prepend(this.renderListItem(this.$pickerAPIElement.spectrum('get')));
    this.persist();
  },

  /**
   * @function
   * @param {Event} evt
   */
  onListItemDelete: function (evt) {
    var $item = $(evt.target).closest('.palette-list-item');

    if ($item.length) {
      $item.remove();
      this.persist();
    } else {
      SL.notify('An error occured while deleting this color');
    }
  },

  /**
   * @function
   * @param {Event} evt
   */
  onListItemMouseDown: function (evt) {
    var $target = $(evt.currentTarget);

    if ($target.length &&
      $target.is('.palette-list-item') &&
      $(evt.target).closest('.palette-list-item-delete').length) {
      this.$dragTarget = $target;
      this.$dragGhost  = $target.clone().appendTo(this.$listElement);

      this.$dragGhost.addClass('drag-ghost');
      this.$dragTarget.addClass('drag-target');

      this.dragOffsetX = evt.clientX - this.$dragTarget.offset().left;
      this.dragOffsetY = evt.clientY - this.$dragTarget.offset().top;

      this.listOffsetX = this.$listElement.offset().left;
      this.listOffsetY = this.$listElement.offset().top;

      this.listWidth  = this.$listElement.width();
      this.listHeight = this.$listElement.height();

      this.listItemSize = this.$dragTarget.outerHeight();
      this.listItemCols = Math.floor(this.listWidth / this.listItemSize);

      $(document).on('mousemove', this.onDocumentMouseMove);
      $(document).on('mouseup', this.onDocumentMouseUp);

      this.onDocumentMouseMove(evt);
    }
  },

  /**
   * @function
   * @param {Event} evt
   */
  onDocumentMouseMove: function (evt) {
    evt.preventDefault();

    var $item = this.$listElement.find('.palette-list-item'),
      offsetX = evt.clientX - this.listOffsetX - this.dragOffsetX,
      offsetY = evt.clientY - this.listOffsetY - this.dragOffsetY;

    offsetX =
      Math.max(Math.min(offsetX, this.listWidth - this.listItemSize), 0);
    offsetY =
      Math.max(Math.min(offsetY, this.listHeight - this.listItemSize), 0);

    this.$dragGhost.css({
      left: offsetX,
      top:  offsetY
    });

    var numX = Math.round(offsetX / this.listItemSize),
      numY   = Math.round(offsetY / this.listItemSize);

    numX = Math.max(Math.min(numX, this.listItemCols), 0);
    numY = Math.max(Math.min(numY, $item.length), 0);

    var index = numY * this.listItemCols + numX,
      $indexItem = $($item[index]);

    if ($indexItem.is(this.$dragTarget)) {
      if (this.$dragTarget.index() > index) {
        $indexItem.before(this.$dragTarget);
      } else {
        $indexItem.after(this.$dragTarget);
      }
    }
  },

  /**
   * @function
   */
  onDocumentMouseUp: function () {
    this.$dragTarget.removeClass('drag-target');
    this.$dragGhost.remove();

    $(document).off('', this.onDocumentMouseMove);
    $(document).off('mouseup', this.onDocumentMouseUp);

    this.persist();
  }
});

SL('views.themes.edit.pages').Snippets = Class.extend({
  /**
   * Constructor SL.views.themes.edit.pages.Snippets Instance
   *
   * @function
   * @param {Object} editor -The Editor Instance
   * @param {Object} theme  -The Theme Object
   */
  init: function (editor, theme) {
    this.editor  = editor;
    this.theme   = theme;
    this.changed = new window.signals.Signal();

    this.render();
    this.bind();
    this.syncMoveButtons();
  },

  /**
   * Render Views
   *
   * @function
   */
  render: function () {
    this.$domElement = $('<div class="page" data-page-id="snippets">');
    this.$domElement.html([
      '<div class="page-header">',
        '<h4>Snippets</h4>',
        '<p>',
          'Snippets are small HTML templates that your team members can' +
          'use as building blocks when creating decks. These templates can ' +
          'contain placeholder variables that are filled out at the time of ' +
          'insertion. ' +
          '<a class="documentation-link" href="#">More info</a>',
        '</p>',
        '<div class="documentation">',
          '<p>',
            'Each snippet consist of two values; title and template. The title ' +
            'is what we\'ll show your teammates so try to keep it descriptive. The ' +
            'template is where you enter your custom HTML.',
          '</p>',
          '<h5>Variables</h5>',
          '<p>',
            'If you add placeholder variables inside of your templates the user ' +
            'will be prompted to fill them out. The syntax for variables is as ' +
            'follows:',
          '</p>',
          '<pre><code>{{Label Value}}</code></pre>',
          '<p>',
            'The string between the opening and closing brackets is considered the ' +
            'variable name. This name is shown when the snippet is inserted so that the ' +
            'author knows what value you\'re expecting.',
          '</p>',
          '<p>',
            'It\'s possible to define default values for variables. To do so you\'ll' +
            'need to delimit your variable name and default value by two colon characters ' +
            'as shown below.',
          '</p>',
          '<pre><code>{{Label Value::Default value}}</code></pre>',
          '<h5>Example</h5>',
          '<p>',
            'Here\'s a basic example template that shows how you could create a ' +
            'snippet for images with captions.',
          '</p>',
          '<pre><code>',
            '&lt;div class="image-with-caption"&gt;\n',
            '  &lt;img src="{{Image URL}}"&gt;\n',
            '  &lt;p&gt;{{Caption::Untitled}}&lt;/p&gt;\n',
            '&lt;/div&gt;',
          '</code></pre>',
        '</div>',
      '</div>',
      '<div class="page-body">',
        '<ul class="snippet-list"></ul>',
        '<ul class="snippet-controls snippet-list-item sl-form">',
          '<div class="add-button-wrapper">',
            '<button class="button l add-button">',
              'Add Snippet ' +
              '<span class="icon i-plus"></span>',
            '</button>',
          '</div>',
          '<div class="unit text">',
            '<label>Title</label>',
            '<input class="title-value" maxlength="200" type="text" readonly>',
          '</div>',
          '<div class="unit text">',
            '<label>Template</label>',
            '<textarea class="template-value" rows="4" readonly></textarea>',
          '</div>',
        '</ul>',
      '</div>'].join(''));

    this.$innerElement             = this.$domElement.find('.page-body');
    this.$listElement              = this.$domElement.find('.snippet-list');
    this.$controlsElement          = this.$domElement.find('.snippet-controls');
    this.$addButton                =
      this.$domElement.find('.snippet-controls .add-button-wrapper');
    this.$documentationLinkElement =
      this.$domElement.find('.page-header .documentation-link');
    this.$documentationElement     =
      this.$domElement.find('.page-header .documentation');

    this.$documentationElement.hide();
    this.renderList();
  },

  /**
   * Render Snippets List
   *
   * @function
   */
  renderList: function () {
    this.$listElement.empty();
    this.theme.get('snippets').forEach(this.renderListItem.bind(this));
  },

  /**
   * Render Snippets List Item Form
   *
   * @function
   * @param {Object|*} item -The Snippet Data Object
   * @returns {*|jQuery|HTMLElement} The Snippet Form View
   */
  renderListItem: function (item) {
    var $slForm = $('<li class="snippet-list-item sl-form">');

    $slForm.html([
      '<div class="unit text">',
        '<label>Title</label>',
        '<input class="title-value" maxlength="200" value="' +
          item.get('title') +
          '" type="text" spellcheck="false">',
      '</div>',
      '<div class="unit text">',
        '<label>Template</label>',
        '<textarea class="template-value" rows="4" spellcheck="false">',
          item.get('template'),
        '</textarea>',
        '<div class="status" data-tooltip="" data-tooltip-maxwidth="400" data-tooltip-align="left">',
          '<span class="icon i-info"></span>',
        '</div>',
      '</div>',
      '<div class="snippet-list-item-footer">',
        '<button class="button outline delete-button" data-tooltip="Delete" data-tooltip-delay="1000">',
          '<snap class="icon i-trash-stroke"></snap>',
        '</button>',
        '<button class="button outline preview-button" data-tooltip="Preview" data-tooltip-delay="1000">',
          '<snap class="icon i-eye"></snap>',
        '</button>',
        '<button class="button outline move-up-button" data-tooltip="Move Up" data-tooltip-delay="1000">',          '<snap class="icon i-arrow-up"></snap>',
        '</button>',
        '<button class="button outline move-down-button" data-tooltip="Move Down" data-tooltip-delay="1000">',
          '<snap class="icon i-arrow-down"></snap>',
        '</button>',
      '</div>'].join(''));

    $slForm.appendTo(this.$listElement);
    $slForm.data('model', item);

    $slForm.find('input, textarea').on('input', this.onSnippetChange.bind(this));
    $slForm.find('input, textarea').on('focus', this.onSnippetFocused.bind(this));
    $slForm.find('.delete-button').on('click', this.onSnippetDelete.bind(this));
    $slForm.find('.preview-button').on('click', this.onSnippetFocused.bind(this));
    $slForm.find('.move-up-button').on('click', this.onSnippetMoveUp.bind(this));
    $slForm.find('.move-down-button').on('click', this.onSnippetMoveDown.bind(this));

    this.validateSnippet($slForm);

    return $slForm;
  },

  /**
   * Bind Event
   *
   * @function
   */
  bind: function () {
    this.$addButton.on('click', this.addSnippet.bind(this));
    this.$documentationLinkElement
      .on('click', this.onDocumentationLinkClicked.bind(this));
  },

  /**
   * Append To Parent Element
   *
   * @function
   * @param {jQuery|Dom|*} parentDom -The Parent Dom Element.
   */
  appendTo: function (parentDom) {
    this.$domElement.appendTo(parentDom);
    this.$listElement.find('.snippet-list-item').each((function (index, item) {
      this.layoutSnippet($(item));
    }).bind(this));
  },

  /**
   * Add Snippet
   *
   * @function
   */
  addSnippet: function () {
    var snippets = this.theme.get('snippets').create(),
      $slItem    = this.renderListItem(snippets);

    $slItem.data('model', snippets);
    $slItem.find('input').first().focus();

    window.setTimeout((function () {
      var scrollHeight = this.$domElement.prop('scrollHeight');

      scrollHeight -= this.$domElement.outerHeight(true);
      scrollHeight -= this.$controlsElement.outerHeight(true);

      this.$domElement.scrollTop(scrollHeight);
    }).bind(this), 1);

    this.changed.dispatch();
    this.syncMoveButtons();
  },

  /**
   * Resize Layout Snippet
   *
   * @function
   * @param {jQuery|Dom|*} $item -The Item Element
   */
  layoutSnippet: function ($item) {
    var $val = $item.find('.template-value');
    $val.attr('rows', 4);

    var lineHeight = parseFloat($val.css('line-height')),
      scrollHeight = $val.prop('scrollHeight'),
      clientHeight = $val.prop('clientHeight');

    if (scrollHeight > clientHeight) {
      $val.attr('rows', Math.min(Math.ceil(scrollHeight / lineHeight), 10));
    }
  },

  /**
   * validate Snippet Data
   *
   * @function
   * @param {jQuery|Dom|*} $slForm -The Snippet Form Element
   */
  validateSnippet: function ($slForm) {
    var model = $slForm.data('model'),
      infoVariables = [],
      errMessages  = [],
      hasVariables = model.templateHasVariables(),
      hasSelection = model.templateHasSelection();

    if (hasVariables && hasSelection) {
      errMessages.push('Templates can not mix variables and selection tags.');
    } else {
      if (hasVariables) {
        var variables = model.getTemplateVariables();

        infoVariables.push('Found ' + variables.length + ' variables:');

        variables.forEach(function (variable) {
          infoVariables.push(variable.defaultValue ?
            '- ' + variable.label + ' (default: ' + variable.defaultValue + ')' :
            '- ' + variable.label);
        });
      }
    }

    if (errMessages.length) {
      $slForm.find('.status')
        .addClass('negative')
        .show()
        .attr('data-tooltip', errMessages.join('<br>'));
    } else if (infoVariables.length) {
      $slForm.find('.status')
        .removeClass('negative')
        .show()
        .attr('data-tooltip', infoVariables.join('<br>'));
    } else {
      $slForm.find('.status')
        .removeClass('negative')
        .hide();
    }
  },

  /**
   * Preview Snippet
   *
   * @function
   * @param {String|*} model -The Snippet Data
   */
  previewSnippet: function (model) {
    var preWin = this.editor.getPreviewWindow(),
      $snippetSlide = preWin.$('#snippet-slide');

    if ($snippetSlide.length) {
      $snippetSlide = $('<section id="snippet-slide">')
        .appendTo(preWin.$('.reveal .slides'));
    }

    $snippetSlide.html([
      '<div class="sl-block" data-block-type="html" style="width: 100%; left: 0; top: 0; height: auto;">',
        '<div class="sl-block-content">',
          model.templatize(model.getTemplateVariables()),
        '</div>',
      '</div>'].join(''));

    preWin.SL.util.skipCSSTransitions();
    preWin.Reveal.sync();
    preWin.Reveal.slide($snippetSlide.index());
  },

  /**
   * Sync Snippet Order
   *
   * @function
   */
  syncSnippetOrder: function () {
    var $items = this.$listElement.find('.snippet-list-item'),
      snippets = this.theme.get('snippets');

    $items.sort((function (a, b) {
      var modelA = snippets.find($(a).data('model')),
        modelB   = snippets.find($(b).data('model'));

      return modelA - modelB;
    }).bind(this));

    $items.each((function (index, item) {
      this.$listElement.append(item);
    }).bind(this));

    this.syncMoveButtons();
  },

  /**
   * Sync Move Buttons
   *
   * @function
   */
  syncMoveButtons: function () {
    this.$listElement.find('.snippet-list-item').each(function (index, item) {
      item = $(item);
      item.find('.move-up-button')
        .toggleClass('disabled', item.is(':first-child'));
      item.find('.move-down-button')
        .toggleClass('disabled', item.is(':last-child'));
    });
  },

  /**
   * Destroy
   *
   * @function
   */
  destroy: function () {
    this.changed.dispose();
    this.$listElement.find('.snippet-list-item').off().removeData('model');

    var preWin = this.editor.getPreviewWindow();
    preWin.$('snippet-slide').remove();

    preWin.Reveal.sync();
    preWin.Reveal.slide(0);

    this.editor = null;
    this.theme  = null;
  },

  /**
   * @function
   * @param {Event} evt
   */
  onDocumentationLinkClicked: function (evt) {
    evt.preventDefault();

    this.$documentationElement.toggle();
    this.$documentationLinkElement.text(
      this.$documentationElement.is(':visible') ? 'Less info' : 'More info');
  },

  /**
   * @function
   * @param {Event} evt
   */
  onSnippetFocused: function (evt) {
    var $target = $(evt.target).closest('.snippet-list-item');

    if ($target.length) {
      this.previewSnippet($target.data('model'));
    }
  },

  /**
   * @function
   * @param {Event} evt
   */
  onSnippetChange: function (evt) {
    var $target = $(evt.target).closest('.snippet-list-item');

    if ($target.length) {
      var title  = $target.find('.title-value').val(),
        template = $target.find('.template-value').val(),
        scriptTags = SL.util.html.findScriptTags(template);

      if (scriptTags.length > 0) {
        SL.notify('Scripts are not allowed. Please remove all ' +
          'script tags for this snippet to save.', 'negative');

        return false;
      }

      var model = $target.data('model');
      model.set('title', title);
      model.set('template', template);

      this.layoutSnippet($target);
      this.validateSnippet($target);
      this.previewSnippet(model);
      this.changed.dispatch();
    }
  },

  /**
   * @function
   * @param {Event} evt
   */
  onSnippetDelete: function (evt) {
    var $item = $(evt.target).closest('.snippet-list-item');

    if ($item.length) {
      var model = $item.data('model');

      if (model) {
        SL.prompt({
          anchor: $(evt.currentTarget),
          title: SL.locale.get('T.THEME_SNIPPET_DELETE_CONFIRM'),
          type: 'select',
          data: [{
            html: '<h3>Cancel</h3>'
          }, {
            html: '<h3>Remove</h3>',
            selected: true,
            className: 'negative',
            callback: (function () {
              SL.util.anim.collapseListItem($item, (function () {
                $item.remove();
                this.syncMoveButtons();
              }).bind(this));

              var snippets = this.theme.get('snippets');
              snippets.remove($item.data('model'));
              this.changed.dispatch();
            }).bind(this)
          }]
        });
      } else {
        SL.notify('An error occured while deleting this snippet');
      }
    } else {
      SL.notify('An error occured while deleting this snippet');
    }
  },

  /**
   * @function
   * @param {Event} evt
   */
  onSnippetMoveUp: function (evt) {
    var $item = $(evt.target).closest('.snippet-list-item');

    if ($item.length) {
      var model = $item.data('model');

      if (model) {
        var snippets = this.theme.get('snippets');
        snippets.shiftLeft(snippets.find(model));

        this.changed.dispatch();
        this.syncSnippetOrder();
      }
    }
  },

  /**
   * @function
   * @param {Event} evt
   */
  onSnippetMoveDown: function (evt) {
    var $item = $(evt.target).closest('.snippet-list-item');

    if ($item.length) {
      var model = $item.data('model');

      if (model) {
        var snippets = this.theme.get('snippets');
        snippets.shiftRight(snippets.find(model));

        this.changed.dispatch();
        this.syncSnippetOrder();
      }
    }
  }
});


/*!
 * project name: SlideStudio
 * name:         users.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/17
 */

'use strict';

SL('views.users').Show = SL.views.Base.extend({
  /**
   * Constructor SL.views.users.Show Instance
   *
   * @function
   */
  init: function () {
    this._super();

    $('.decks .deck').each((function (index, item) {
      item = $(item);
      item.find('.edit').on('vclick', this.onEditClicked.bind(this, item));
      item.find('.share').on('vclick', this.onShareClicked.bind(this, item));
      item.find('.fork').on('vclick', this.onForkClicked.bind(this, item));
      item.find('.clone').on('vclick', this.onCloneClicked.bind(this, item));
      item.find('.delete').on('vclick', this.onDeleteClicked.bind(this, item));
      item.find('.lock-icon').on('vclick', this.onVisibilityClicked.bind(this, item));
      item.find('.visibility').on('vclick', this.onVisibilityClicked.bind(this, item));

      if (item.hasClass('is-owner')) {
        item.find('.deck-title-value').attr({
          'data-tooltip':           SL.locale.get('User.clk_edit_tip'),
          'data-tooltip-alignment': 'l',
          'data-tooltip-delay':      200
        });

        item.find('.deck-description-value').attr({
          'data-tooltip':           SL.locale.get('User.clk_edit_tip'),
          'data-tooltip-alignment': 'l',
          'data-tooltip-delay':      200
        });

        item.find('.deck-title-value')
          .on('click', this.onDeckTitleClicked.bind(this, item));

        item.find('.deck-description-value')
          .on('click', this.onDeckDescriptionClicked.bind(this, item));
      }
    }).bind(this));

    $('.decks .deck .ladda-button').each(function (index, item) {
      $(item).data('ladda', window.Ladda.create(item));
    });

    if (SL.util.device.IS_PHONE) {
      $('html').addClass('is-mobile-phone');
    }

    this.showAnnouncement();
  },

  /**
   * Show Announcement
   *
   * @function
   */
  showAnnouncement: function () {
    if (window.Modernizr.localstorage &&
      SL.current_user.isEnterpriseManager() &&
      SL.current_team &&
      SL.current_team.get('beta_new_editor') === false) {
      var queryStr = 'slides-team-has-seen-new-editor-announcement';

      if (!localStorage.getItem(queryStr)) {
        var $section = $([
          '<section class="announcement">',
            '<h3>', SL.locale.get('User.announcement_title'), '</h3>',
            '<p>',
              SL.locale.get('User.announcement_des_p1'),
            '</p>',
            '<p>',
              SL.locale.get('User.announcement_des_p2'),
            '</p>',
            '<a class="button positive" href="/edit#beta-features">',
              SL.locale.get('User.announcement_team_setting'),
            '</a>',
            '<a class="button grey dismiss-button">',
              SL.locale.get('User.announcement_dismiss'),
            '</a>',
          '</section>'].join(''));

        $section.find('.dismiss-button').on('click', function () {
          $section.remove();
          localStorage.setItem(queryStr, 'completed');
        });

        $('.main section').first().before($section);
      }
    }
  },

  /**
   * Get Deck Data
   *
   * @function
   * @param {jQuery|HTMLElement|*} $deck -The Deck Element
   * @returns {{user: {id: Number, username: *}, id: *, slug: *, title: *, visibility: *}}
   */
  getDeckData: function ($deck) {
    return {
      user: {
        id: parseInt($deck.attr('data-userid'), 10),
        username: $deck.attr('data-username')
      },
      id:         $deck.attr('data-id'),
      slug:       $deck.attr('data-slug'),
      title:      $deck.attr('data-title'),
      visibility: $deck.attr('data-visibility')
    };
  },

  /**
   * Save Deck Visibility Property
   *
   * @function
   * @param {jQuery|HTMLElement|*} $deck -The Deck Element
   * @param {String} visibility -The Deck Visibility Property
   */
  saveVisibility: function ($deck, visibility) {
    var deckData = this.getDeckData($deck),
      ladda = $deck.find('.visibility').data('ladda');

    if (ladda) {
      ladda.start();
    }

    $.ajax({
      type: 'POST',
      url: SL.config.AJAX_PUBLISH_DECK(deckData.id),
      context: this,
      data: {
        visibility: visibility
      }
    }).done(function (data) {
      if (data.deck.visibility === SL.models.Deck.VISIBILITY_SELF) {
        SL.notify(SL.locale.get('Deck_Visibility_Changed_Self'));
      } else if (data.deck.visibility === SL.models.Deck.VISIBILITY_TEAM) {
        SL.notify(SL.locale.get('Deck_Visibility_Changed_Team'));
      } else if (data.deck.visibility === SL.models.Deck.VISIBILITY_ALL) {
        SL.notify(SL.locale.get('Deck_Visibility_Changed_All'));
      }

      if (typeof data.deck.slug === 'string') {
        $deck.attr('data-slug', data.deck.slug);
      }

      if (typeof data.deck.visibility === 'string') {
        $deck.attr('data-visibility', data.deck.visibility);
      }
    }).fail(function () {
      SL.notify(SL.locale.get('Deck_Visibility_Changed_Err'), 'negative');
    }).always(function () {
      if (ladda) {
        ladda.stop();
      }

      $deck.removeClass('hover');
    });
  },

  /**
   * Clone Deck
   *
   * @function
   * @param {jQuery|HTMLElement|*} $deck   -The Deck Element
   * @param {Function}             cloneCb -The Clone Callback
   */
  cloneDeck: function ($deck, cloneCb) {
    var deckData = this.getDeckData($deck),
      ladda = $deck.find('.clone.ladda-button').data('ladda');
    $deck.addClass('hover');

    if (ladda) {
      ladda.start();
    }

    $.ajax({
      type: 'POST',
      url: SL.config.AJAX_FORK_DECK(deckData.id),
      context: this
    }).done(function () {
      SL.util.callback(cloneCb);
    }).fail(function () {
      SL.notify(SL.locale.get('Generic_Error'), 'negative');

      if (ladda) {
        ladda.stop();
      }

      $deck.removeClass('hover');
    });
  },

  /**
   * @function
   * @param {jQuery|HTMLElement|*} $deck -The Deck Element
   * @param {Event} evt
   */
  onEditClicked: function ($deck, evt) {
    evt.preventDefault();
    window.location = $deck.attr('data-url') + '/edit';
  },

  /**
   * @function
   * @param {jQuery|HTMLElement|*} $deck -The Deck Element
   * @param {Event} evt
   */
  onDeleteClicked: function ($deck, evt) {
    evt.preventDefault();

    $deck.addClass('hover');

    var deckData = this.getDeckData($deck),
      prompt = SL.prompt({
      anchor: $(evt.currentTarget),
      title: SL.locale.get('User.deck_del_confirm', {
        title: deckData.title
      }),
      type: 'select',
      data: [{
        html: '<h3>' + SL.locale.get('Cancel') + '</h3>',
        callback: (function () {
          $deck.removeClass('hover');
        }).bind(this)
      }, {
        html: '<h3>' + SL.locale.get('Delete') + '</h3>',
        selected: true,
        className: 'negative',
        callback: (function () {
          $deck.find('.deck-metadata .status').text('Deleting...');

          var ladda = $deck.find('.delete.ladda-button').data('ladda');

          if (ladda) {
            ladda.start();
          }

          $.ajax({
            type: 'DELETE',
            url: SL.config.AJAX_UPDATE_DECK(deckData.id),
            data: {},
            context: this
          }).done(function () {
            SL.util.anim.collapseListItem($deck, (function () {
              if (ladda) {
                ladda.stop();
              }

              $deck.remove();
            }).bind(this));

            SL.notify(SL.locale.get('User.deck_del_success'));
          }).fail(function () {
            SL.notify(SL.locale.get('User.deck_del_error'), 'negative');

            if (ladda) {
              ladda.stop();
            }
          }).always(function () {
            $deck.removeClass('hover');
          });
        }).bind(this)
      }]
    });

    prompt.canceled.add(function () {
      $deck.removeClass('hover');
    });
    SL.analytics.track('User.show: Delete deck');
  },

  /**
   * @function
   * @param {jQuery|HTMLElement|*} $deck -The Deck Element
   * @param {Event} evt
   */
  onVisibilityClicked: function ($deck, evt) {
    evt.preventDefault();

    $deck.addClass('hover');

    var deckData = this.getDeckData($deck), ary = [];

    ary.push({
      html: SL.locale.get('Deck_Visibility_Change_Self'),
      selected: deckData.visibility === SL.models.Deck.VISIBILITY_SELF,
      callback: (function () {
        this.saveVisibility($deck, SL.models.Deck.VISIBILITY_SELF);
        SL.analytics.track('User.show: Visibility changed', 'self');
      }).bind(this)
    });

    if (SL.current_user.isEnterprise()) {
      ary.push({
        html: SL.locale.get('Deck_Visibility_Change_Team'),
        selected: deckData.visibility === SL.models.Deck.VISIBILITY_TEAM,
        className: 'divider',
        callback: (function () {
          this.saveVisibility($deck, SL.models.Deck.VISIBILITY_TEAM);
          SL.analytics.track('User.show: Visibility changed', 'team');
        }).bind(this)
      });
    }

    ary.push({
      html: SL.locale.get('Deck_Visibility_Change_All'),
      selected: deckData.visibility === SL.models.Deck.VISIBILITY_ALL,
      callback: (function () {
        this.saveVisibility($deck, SL.models.Deck.VISIBILITY_ALL);
        SL.analytics.track('User.show: Visibility changed', 'all');
      }).bind(this)
    });

    SL.prompt({
      anchor: $(evt.currentTarget),
      type: 'select',
      data: ary
    }).canceled.add(function () {
      $deck.removeClass('hover');
    });

    SL.analytics.track('User.show: Visibility menu opened');
  },

  /**
   * @function
   * @param {jQuery|HTMLElement|*} $deck -The Deck Element
   * @param {Event} evt
   */
  onShareClicked: function ($deck, evt) {
    evt.preventDefault();

    var deckData = this.getDeckData($deck);

    if (typeof deckData.user.username !== "string" ||
      typeof deckData.slug !== "string" &&
      typeof deckData.id !== "string") {
      SL.notify(SL.locale.get('Generic_Error'), 'negative');
    } else {
      SL.popup.open(SL.components.decksharer.DeckSharer, {
        deck: new SL.models.Deck(deckData)
      });
    }

    return false;
  },

  /**
   * @function
   * @param {jQuery|HTMLElement|*} $deck -The Deck Element
   * @param {Event} evt
   */
  onCloneClicked: function ($deck, evt) {
    evt.preventDefault();

    this.cloneDeck($deck, function () {
      window.location.reload();
    });

    return false;
  },

  /**
   * @function
   * @param {jQuery|HTMLElement|*} $deck -The Deck Element
   * @param {Event} evt
   */
  onForkClicked: function ($deck, evt) {
    evt.preventDefault();

    this.cloneDeck($deck, function () {
      window.location = SL.current_user.getProfileURL();
    });

    return false;
  },

  /**
   * @function
   * @param {jQuery|HTMLElement|*} $deck -The Deck Element
   */
  onDeckTitleClicked: function ($deck) {
    var $title = $deck.find('.deck-title-value');

    SL.prompt({
      anchor:        $title,
      title:         SL.locale.get('User.prompt_deck_title'),
      type:         'input',
      confirmLabel:  SL.locale.get('Save'),
      data: {
        value:       $title.text(),
        placeholder: SL.locale.get('User.default_deck_title'),
        maxlength:   SL.config.DECK_TITLE_MAXLENGTH,
        width:       400,
        confirmBeforeDiscard: true
      }
    }).confirmed.add((function (str) {
      if (str && str.trim() !== '') {
        $title.text(str);

        $.ajax({
          url: SL.config.AJAX_UPDATE_DECK(this.getDeckData($deck).id),
          type: 'PUT',
          context: this,
          data: {
            deck: {
              title: str
            }
          }
        }).fail(function () {
          SL.notify(SL.locale.get('User.change_deck_title_err'), 'negative');
        });
      } else {
        SL.notify(SL.locale.get('User.no_empty_deck_title'), 'negative');
      }
    }).bind(this));

    return false;
  },

  /**
   * @function
   * @param {jQuery|HTMLElement|*} $deck -The Deck Element
   */
  onDeckDescriptionClicked: function ($deck) {
    var $description = $deck.find('.deck-description-value');

    SL.prompt({
      anchor:        $description,
      title:         SL.locale.get('User.prompt_deck_des_title'),
      type:         'input',
      confirmLabel:  SL.locale.get('Save'),
      data: {
        value:       $description.text(),
        placeholder: SL.locale.get('User.default_deck_des'),
        multiline:            true,
        confirmBeforeDiscard: true
      }
    }).confirmed.add((function (str) {
      $description.text(str);

      $.ajax({
        url: SL.config.AJAX_UPDATE_DECK(this.getDeckData($deck).id),
        type: 'PUT',
        context: this,
        data: {
          deck: {
            description: str
          }
        }
      }).fail(function () {
        SL.notify(SL.locale.get('User.change_deck_des_err'), 'negative');
      });
    }).bind(this));

    return false;
  }
});

