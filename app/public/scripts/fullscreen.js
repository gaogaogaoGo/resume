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

  }

  function config() {
    if (typeof SLConfig === "object") {
      if (SLConfig.deck && !SLConfig.deck.notes) {
        SLConfig.deck.notes = {};
      }


      //设置网格默认值


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
 * name:         config.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/11
 */

'use strict';
SL.apiAddress = configHost;

SL.config = {
  SLIDE_WIDTH:                         960,
  SLIDE_HEIGHT:                        700,
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
    {type: 'sectionIframe', factory: 'SectionIframe', label: '切片', icon: 'browser'},
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
      // console.warn('Bad target for skipCSSTransitions.');
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
            return '\n  ' + word;
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
    if (SLConfig.deck && (SLConfig.deck.notes || SLConfig.deck.speakerNotes)) {
      var notes = SLConfig.deck.notes || SLConfig.deck.speakerNotes;
      [].forEach.call(
        document.querySelectorAll('.reveal .slides section'),
        function (element) {
          var note = notes[element.getAttribute('data-id')];

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
        // console.warn('Could not find font family with id "' + packName + '"');
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
 * name:         popup.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/28
 */

'use strict';

SL('components.popup').Popup          = Class.extend({
  WINDOW_PADDING: 5,


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
      // console.warn('ace library is not loaded!');
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

SL('views.decks').Show = SL.views.Base.extend({
    /**
     * Constructor SL.views.decks.Show Instance
     *
     * @function
     */
    init: function() {
        this._super();

        SL.util.setupReveal({
          width: 1170, // TODO: size
          height: 650, // TODO: size
          minScale:     1,
          maxScale:     1,
            history: true,
            embedded: true,
            pause: false,
            margin: 0.1,
            openLinksInTabs: true,
            trackEvents: true
        });

        this.setupReply();
        this.setupPills();

        if ($('header .deck-promotion').length) {
            $('header').addClass('extra-wide');
        }

        // if (window.Modernizr.fullscreen === false) {
        //     $('.deck-options .fullscreen-button').hide();
        // }

        this.bind();
        this.layout();
    },

    /**
     * Initialize Views Events
     *
     * @function
     */
    bind: function() {
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

        // this.onWindowScroll = $.debounce(this.onWindowScroll, 200);

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
    setupReply: function() {
        if ($('.panel', '#comments').length > 0) {
            this.reply = new SL.components.Reply();
        } else {
            $('.deck-options .comment-button').hide();
        }
    },

    setupPills: function() {
        this.$summaryPill = $(".summary-pill"),
            this.$instructionsPill = $(".instructions-pill");
        this.$summaryPill.on("vclick", this.hideSummary);
        this.$instructionsPill.on('vclick', this.hideInstructions);
        this.showSummaryTimeout =
            setTimeout(this.showSummary.bind(this), 1000);
        this.hideSummaryTimeout =
            setTimeout(this.hideSummary.bind(this), 6000);

        // if (!SL.util.user.isLoggedIn() &&
        //     !SL.util.device.IS_PHONE &&
        //     !SL.util.device.IS_TABLET &&
        //     Reveal.getTotalSlides() > 1 && Modernizr.localstorage) {
        //     var str = 'slides-has-seen-deck-navigation-instructions';

        //     if (!localStorage.getItem(str)) {
        //         localStorage.setItem(str, "yes");
        //         this.showInstructionsTimeout =
        //             setTimeout(this.showInstructions.bind(this), 6000);
        //     }
        // }
    },

    /**
     * Show Summary
     *
     * @function
     */
    showSummary: function() {
        if (this.$summaryPill) {
            this.$summaryPill.addClass('visible');
        }
    },

    /**
     * Hide Summary
     *
     * @function
     */
    hideSummary: function() {
        clearTimeout(this.showSummaryTimeout);

        if (this.$summaryPill) {
            this.$summaryPill.removeClass('visible');
            this.$summaryPill.on('transitionend', this.$summaryPill.remove);
            this.$summaryPill = null;
        }
    },

    showInstructions: function() {
        if (this.$instructionsPill) {
            this.$instructionsPill.addClass('visible');
        }
    },

    hideInstructions: function() {
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
    layout: function() {
        if (this.$summaryPill) {
            this.$summaryPill.css(
                'left', (window.innerWidth - this.$summaryPill.width()) / 2);
        }

        if (this.$instructionsPill) {
            this.$instructionsPill.css(
                'left', (window.innerWidth - this.$instructionsPill.width()) / 2);
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
    saveVisibility: function(visibility) {
        $.ajax({
            type: 'POST',
            url: SL.config.AJAX_PUBLISH_DECK(SL.current_deck.get('id')),
            context: this,
            data: {
                visibility: visibility
            }
        }).done(function(data) {
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
        }).fail(function() {
            SL.notify(SL.locale.get('Deck_Visibility_Changed_Err'), 'negative');
        });
    },

    /**
     * Share Clicked Callback
     *
     * @function
     */
    onShareClicked: function() {
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
    onCommentsClicked: function() {
        SL.analytics.trackPresenting('Comments clicked');
    },

    /**
     * FullScreen Callback
     *
     * @function
     */
    onFullScreenClicked: function() {
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
    onForkClicked: function() {
        SL.analytics.trackPresenting('Fork clicked');

        $.ajax({
            type: 'POST',
            url: SL.config.AJAX_FORK_DECK(SLConfig.deck.id),
            context: this
        }).done(function() {
            window.location = SL.current_user.getProfileURL();
        }).fail(function() {
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
    onVisibilityClicked: function(evt) {
        evt.preventDefault();

        var visibility = SL.current_deck.get('visibility'),
            ary = [];

        ary.push({
            html: SL.locale.get('Deck.show.visibility_change_self'),
            selected: visibility === SL.models.Deck.VISIBILITY_SELF,
            callback: (function() {
                this.saveVisibility(SL.models.Deck.VISIBILITY_SELF);
                SL.analytics.trackPresenting('Visibility changed', 'self');
            }).bind(this)
        });

        if (SL.current_user.isEnterprise()) {
            ary.push({
                html: SL.locale.get('Deck.show.visibility_change_team'),
                selected: visibility === SL.models.Deck.VISIBILITY_TEAM,
                className: 'divider',
                callback: (function() {
                    this.saveVisibility(SL.models.Deck.VISIBILITY_TEAM);
                    SL.analytics.trackPresenting('Visibility changed', 'team');
                }).bind(this)
            });
        }

        ary.push({
            html: SL.locale.get('Deck.show.visibility_change_all'),
            selected: visibility === SL.models.Deck.VISIBILITY_ALL,
            callback: function() {
                this.saveVisibility(SL.models.Deck.VISIBILITY_ALL);
                SL.analytics.trackPresenting('Visibility changed', 'all');
            }.bind(this)
        });

        SL.prompt({
            anchor: $(evt.currentTarget),
            type: 'select',
            data: ary
        });

        SL.analytics.trackPresenting('Visibility menu opened');
    },

    /**
     * Slide Changed Callback
     *
     * @function
     * @param {Event} evt -The Click Event
     */
    onSlideChanged: function(evt) {
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
    onWindowScroll: function() {
        if ($(window).scrollTop() > 10) {
            this.hideSummary();
        }
    }
});
