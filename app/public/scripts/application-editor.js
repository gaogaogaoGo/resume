/*!
 * project name: SlideStudio
 * name:         base.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/18
 */

'use strict';

SL('editor.blocks').Base = Class.extend({
  /**
   * Constructor SL.editor.blocks.Base Instance
   *
   * @function
   * @param {String|*} type
   * @param {Object}   options
   */
  init: function (type, options) {
    this.type     = type;
    this.pairings = [];
    this.plugins  = [];

    this.options = $.extend({
      contentElementType: 'div',
      aspectRatio:        0,
      minWidth:           30,
      minHeight:          30,
      horizontalResizing: true,
      verticalResizing:   true,
      keyboardConsumer:   false,
      introDelay:         1
    }, options);

    if (this.options.element) {
      this.$domElement     = $(this.options.element);
      this.$contentElement = this.$domElement.find('.sl-block-content');
    }

    this.setup();
    this.validateProperties();
    this.render();
    this.bind();
    this.format();
    this.paint();

    this.transform = new SL.editor.blocks.behavior.Transform(this);
  },

  /**
   * @function
   */
  setup: function () {
    this.removed         = new signals.Signal();
    this.dragStarted     = new signals.Signal();
    this.dragUpdated     = new signals.Signal();
    this.dragEnded       = new signals.Signal();
    this.propertyChanged = new signals.Signal();

    this.focused               = false;
    this.moved                 = false;
    this.mouseDownCursor       = {x: 0, y: 0};
    this.properties = {
      style: {
        opacity: {
          type:         'number',
          decimals:     2,
          minValue:     0,
          maxValue:     1,
          defaultValue: 1
        },
        padding: {
          type:         'number',
          unit:         'px',
          decimals:     0,
          minValue:     0,
          maxValue:     100,
          defaultValue: 0
        },
        color: {computed: true},
        'background-color': {computed: true},
        'border-color': {
          computed: true,
          getter:   this.getBorderColor.bind(this)
        },
        'border-style': {
          defaultValue: 'none',
          options: [{
            value: 'solid',
            title: '实线'
          }, {
            value: 'dashed',
            title: '虚线'
          }, {
            value: 'dotted',
            title: '点线'
          }]
        },
        'border-width': {
          type:         'number',
          unit:         'px',
          decimals:     0,
          minValue:     0,
          maxValue:     200,
          defaultValue: 0
        },
        'border-radius': {
          type:        'number',
          unit:        'px',
          decimals:     0,
          minValue:     0,
          maxValue:     200,
          defaultValue: 0
        },
        'text-align': {
          options: [{
            value: 'left',    icon: 'alignleft'
          }, {
            value: 'center',  icon: 'aligncenter'
          }, {
            value: 'right',   icon: 'alignright'
          }, {
            value: 'justify', icon: 'alignjustify'
          }]
        },
        'font-size': {
          type:         'number',
          unit:         '%',
          minValue:     6,
          maxValue:     500,
          defaultValue: 100
        },
        'line-height': {
          type:         'number',
          unit:         '%',
          minValue:     0,
          maxValue:     300,
          defaultValue: 100
        },
        'letter-spacing': {
          type:        'number',
          unit:        'em',
          unitHidden:   true,
          decimals:     2,
          minValue:     -1,
          maxValue:     2,
          defaultValue: 0,
          stepSize:     0.01
        },
        'z-index': {
          type:     'number',
          minValue: 0,
          maxValue: 1000,
          setter:   this.setZ.bind(this),
          getter:   this.getZ.bind(this)
        },
        'section-edit': {
        }
      },
      'attribute': {
        'class': {
          type:   'string',
          setter: this.setClassName.bind(this),
          getter: this.getClassName.bind(this)
        }
      }
    };
  },

  /**
   * @function
   */
  validateProperties: function () {
    for (var property in this.properties) {
      var subPros = this.properties[property];

      for (var pro in this.properties[property]) {
        var subPro = subPros[pro], msg = [];

        if (subPro.type === 'number') {
          if (typeof subPro.minValue !== "number") {
            msg.push('must have minValue');
          }

          if (typeof subPro.maxValue !== "number") {
            msg.push('must have maxValue');
          }

          if (typeof subPro.decimals !== "number") {
            subPro.decimals = 0;
          }

          if (typeof subPro.unit !== "string") {
            subPro.unit = '';
          }
        }

        if (msg.length) {
          console.warn('Malformed property "' + property + "." + pro + '"', msg);
        }
      }
    }
  },

  /**
   * @function
   */
  render: function () {
    if (!this.$domElement) {
      this.$domElement = $('<div>');
      this.$domElement.addClass('sl-block');
      this.$contentElement =
        $('<' + this.options.contentElementType + '>')
          .appendTo(this.$domElement);
      this.$contentElement.addClass('sl-block-content');
    }

    this.$domElement.attr('data-block-type', this.type);
    this.$domElement.data('block-instance', this);
  },

  /**
   * @function
   */
  bind: function () {
    this.onClick                 = this.onClick.bind(this);
    this.onMouseDown             = this.onMouseDown.bind(this);
    this.onMouseMove             = this.onMouseMove.bind(this);
    this.onMouseUp               = this.onMouseUp.bind(this);
    this.onKeyDown               = this.onKeyDown.bind(this);
    this.onKeyUp                 = this.onKeyUp.bind(this);
    this.onDoubleClick           = this.onDoubleClick.bind(this);
    this.syncTransformVisibility = this.syncTransformVisibility.bind(this);

    this.$domElement.on('vclick', this.onClick);
    this.$domElement.on('vmousedown', this.onMouseDown);

    SL.editor.controllers.Blocks.focusChanged.add(this.syncTransformVisibility);
  },

  /**
   * @function
   */
  format: function () {
    if (this.options.horizontalResizing === false) {
      this.$domElement.css('width', 'auto');
    }

    if (this.options.verticalResizing === false) {
      this.$domElement.css('height', 'auto');
    }
  },

  /**
   * @function
   */
  setDefaults: function () {
    this.$domElement.css({
      'min-width':  this.options.minWidth,
      'min-height': this.options.minHeight
    });
  },

  /**
   * @function
   * @param {String|Number}|*} id
   */
  setID: function (id) {
    this.$domElement.attr('data-block-id', id);
  },

  /**
   * @function
   * @returns {String|Number}|*}
   */
  getID: function () {
    return this.$domElement.attr('data-block-id');
  },

  /**
   * @function
   * @returns {boolean}
   */
  hasID: function () {
    return !!this.getID();
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
  detach: function () {
    this.$domElement.detach();
  },

  /**
   * @function
   */
  focus: function () {
    if (!this.focused) {
      this.focused = true;
      this.$domElement.addClass('is-focused');

      this.syncTransformVisibility();

      $(document).on('keydown', this.onKeyDown);
      $(document).on('keyup', this.onKeyUp);
    }
  },

  /**
   * @function
   */
  blur: function () {
    if (this.focused) {
      this.focused = false;
      this.$domElement.removeClass('is-focused');

      this.syncTransformVisibility();
      this.hidePaddingHint();

      $(document).off('keydown', this.onKeyDown);
      $(document).off('keyup', this.onKeyUp);
    }
  },

  /**
   * @function
   * @param {Constructor} Plugin
   */
  plug: function (Plugin) {
    if (this.hasPlugin(Plugin)) {
      console.log('Plugin is already plugged.');
    } else {
      this.plugins.push(new Plugin(this));
    }
  },

  /**
   * @function
   * @param {Object|Instance|*} plugin
   */
  unplug: function (plugin) {
    for (var t = 0; t < this.plugins.length; t += 1) {
      var plug = this.plugins[t];

      if (plug instanceof plugin) {
        plug.destroy();
        this.plugins.splice(t, 1);
      }
    }
  },

  /**
   * @function
   * @param {Object|Instance|*} plugin
   */
  hasPlugin: function (plugin) {
    return this.plugins.some(function (plug) {
      return plug instanceof plugin;
    });
  },

  /**
   * @function
   * @return {boolean}
   */
  isFocused: function () {
    return this.focused;
  },

  /**
   * @function
   * @param {Number} delay
   */
  showPaddingHint: function (delay) {
    var padding = this.get('style.padding');

    if (padding > 0) {
      var $hint = this.$domElement.find('.sl-block-padding-hint');

      if ($hint.length === 0) {
        $hint = $('<div class="editing-ui sl-block-overlay sl-block-padding-hint">');
        $hint.appendTo(this.$domElement);
      }

      var measure = this.measure(),
        height    = measure.height,
        width     = measure.width,
        centerX   = Math.round(width / 2),
        centerY   = Math.round(height / 2),
        paddingX  = Math.round(padding),
        realX     = Math.round(width - padding),
        realY     = Math.round(height - padding),
        paddingY  = Math.round(padding),
        $canvas   = $hint.find('canvas');

      if ($canvas.length === 0) {
        $canvas = $('<canvas>').appendTo($hint);
      }

      $canvas.attr({width: width, height: height});

      var context = $canvas.get(0).getContext('2d');
      context.clearRect(0, 0, width, height);
      context.fillStyle = 'rgba(17, 188, 231, 0.1)';
      context.fillRect(0, 0, width, height);
      context.clearRect(paddingY, paddingX, width - 2 * padding, height - 2 * padding);
      context.fillStyle = 'rgba(17, 188, 231, 0.6)';
      context.fillRect(paddingY, paddingX, width - 2 * padding, 1);
      context.fillRect(realX, paddingX, 1, height - 2 * padding);
      context.fillRect(paddingY, realY, width - 2 * padding, 1);
      context.fillRect(paddingY, paddingX, 1, height - 2 * padding);
      context.fillRect(centerX - 1, 0, 1, padding);
      context.fillRect(centerX - 1, realY, 1, padding);
      context.fillRect(0, centerY - 1, padding, 1);
      context.fillRect(realX, centerY - 1, padding, 1);

      this.syncZ();

      clearTimeout(this.hintPaddingTimeout);

      if (typeof delay === "number") {
        this.hintPaddingTimeout =
          setTimeout(this.hidePaddingHint.bind(this), delay);
      }
    } else {
      this.hidePaddingHint();
    }
  },

  /**
   * @function
   */
  hidePaddingHint: function () {
    clearTimeout(this.hintPaddingTimeout);
    this.$domElement.find('.sl-block-padding-hint').remove();
  },

  /**
   * @function
   * @param {Array|String} proStrAry
   */
  unset: function (proStrAry) {
    if (typeof proStrAry === "string") {
      proStrAry = [proStrAry];
    }

    var romoves = [];

    proStrAry.forEach((function (proStr) {
      var property = this.getPropertySettings(proStr);

      if (property) {
        var pros = proStr.split('.'),
          $target = this.$contentElement;

        if (typeof property.targetElement === "function") {
          $target = property.targetElement();
        }

        if (pros[0] === 'style') {
          $target.css(pros[1], '');
        } else if (pros[0] === 'attribute') {
          $target.removeAttr(pros[1]);
        }

        romoves.push(proStr);
      }
    }).bind(this));

    if (romoves.length) {
      this.propertyChanged.dispatch(romoves);
    }
  },

  /**
   * @function
   * @param {String} proStr
   * @returns {boolean}
   */
  isset: function (proStr) {
    var property = this.getPropertySettings(proStr);

    if (property) {
      if (property.checker) {
        return property.call();
      }

      var pro = this.get(proStr);

      if (pro && pro !== property.defaultValue) {
        return true;
      }
    }

    return false;
  },

  /**
   * @function
   * @param {String} proStr
   * @returns {Object|String|*}
   */
  getPropertySettings: function (proStr) {
    if (typeof proStr === "string") {
      proStr = proStr.split('.');

      var subFirst = proStr[0],
        subSecond  = proStr[1],
        property   = null;

      if (this.properties[subFirst]) {
        property =  this.properties[subFirst][subSecond];
      }

      if (property) {
        return property;
      }

      console.log('Property not found:', proStr);
    }

    return null;
  },

  /**
   * @function
   * @param {String} proStr
   */
  getPropertyDefault: function (proStr) {
    var property = this.getPropertySettings(proStr);
    return property ? property.defaultValue : null;
  },

  /**
   * @function
   * @param {Number|String|*} zIndex
   */
  setZ: function (zIndex) {
    this.$contentElement.css('z-index', zIndex);
    this.$domElement.find('.sl-block-overlay').css('z-index', zIndex);
  },

  /**
   * @function
   * @returns {Number|String|*}
   */
  getZ: function () {
    var zIndex = parseInt(this.$contentElement.css('z-index'), 10);
    return isNaN(zIndex) ? -1 : zIndex;
  },

  /**
   * @function
   */
  syncZ: function () {
    this.$domElement
      .find('.sl-block-overlay')
      .css('z-index', this.getZ());
  },

  /**
   * @function
   * @param {String} className
   */
  setClassName: function (className) {
    className = className.replace(/\s{2,}/g, ' ');
    className = className.replace(/[^a-zA-Z0-9-_\s]*/gi, '');
    className = className.trim();

    this.$contentElement.attr(
      'class',
      'sl-block-content' + (className ? ' ' + className : ''));
  },

  /**
   * @function
   * @returns {*|String}
   */
  getClassName: function () {
    var className = this.$contentElement.attr('class');

    className = className.split(' ').map(function (cls) {
      cls = cls.trim();

      if (/^(sl\-|cke\_)/gi.test(cls) || cls === 'visible') {
        cls = '';
      }

      return cls;
    }).join(' ');
    className = className.replace(/\s{2,}/g, ' ');
    className = className.trim();

    return className;
  },

  /**
   * @function
   * @returns {*|String}
   */
  getBorderColor: function () {
    return this.$contentElement.css('border-top-color');
  },

  /**
   * @function
   * @returns {number|boolean|*}
   */
  getAspectRatio: function () {
    return this.options.aspectRatio;
  },

  /**
   * @function
   * @returns {boolean}
   */
  hasAspectRatio: function () {
    return this.getAspectRatio() > 0;
  },

  /**
   * @function
   */
  syncAspectRatio: function () {
    if (this.hasAspectRatio()) {
      var measure = this.measure();

      this.resize({
        width:  measure.width,
        height: measure.height,
        center: true
      });
    }
  },

  /**
   * @function
   */
  syncTransformVisibility: function () {
    if (this.isFocused()) {
      this.transform.show();
    } else {
      this.transform.hide();
    }
  },

  /**
   * @function
   */
  showPlaceholder: function () {
    if (this.$domElement.find('.sl-block-placeholder').length === 0) {
      this.$domElement
        .append('<div class="editing-ui sl-block-overlay sl-block-placeholder">');
    }
  },

  /**
   * @function
   */
  hidePlaceholder: function () {
    this.$domElement.find('.sl-block-placeholder').remove();
  },

  /**
   * @function
   */
  paint: function () {
    if (this.isEmpty()) {
      this.showPlaceholder();
    } else {
      this.hidePlaceholder();
    }

    this.syncZ();
  },

  /**
   * @function
   * @returns {boolean}
   */
  isEmpty: function () {
    return false;
  },

  /**
   * @function
   * @returns {boolean}
   */
  isEditingText: function () {
    return false;
  },

  /**
   * @function
   * @returns {*[]}
   */
  getToolbarOptions: function () {
    if (SL.editor.controllers.Blocks.getCurrentBlocks().length > 1) {
      return [
        SL.editor.components.toolbars.options.Divider,
        SL.editor.components.toolbars.options.BlockDepth,
        SL.editor.components.toolbars.options.BlockActions
      ];
    } else {
      return [
        SL.editor.components.toolbars.options.Divider,
        SL.editor.components.toolbars.options.BlockActions
      ];
    }
  },

  /**
   * @function
   * @param {String|*} type
   */
  changeContentElementType: function (type) {
    this.$contentElement.changeElementType(type);
    this.$contentElement = this.$domElement.find('.sl-block-content');
  },

  /**
   * @function
   * @param {String|Number|*} left
   * @param {String|Number|*} top
   * @param {Object}          options
   */
  move: function (left, top, options) {
    if (options && options.isOffset) {
      this.$domElement.css({
        left: '+=' + left,
        top:  '+=' + top
      });
    } else {
      var css = {};

      if (typeof left === "number") {
        css.left = Math.round(left);
      }

      if (typeof top === "number") {
        css.top = Math.round(top);
      }

      this.$domElement.css(css);
    }
  },

  /**
   * @function
   */
  moveToCenter: function () {
    var measure = this.measure(),
      size = SL.view.getSlideSize();

    this.move(
      (size.width - measure.width) / 2,
      (size.height - measure.height) / 2);
  },

  /**
   * @function
   * @param {Object} size
   */
  resize: function (size) {
    size = size || {};

    var measure = null;

    if (this.transform.isResizing()) {
      measure = this.transform.getState().originalMeasurements;
    } else {
      measure = this.measure();
    }

    if (typeof size.top === "number") {
      size.height    = measure.bottom - size.top;
      size.direction = 'n';
    }

    if (typeof size.left === "number") {
      size.width     = measure.right - size.left;
      size.direction = 'w';
    }

    if (typeof size.right === "number") {
      size.width = size.right - measure.x;
    }

    if (typeof size.bottom === "number") {
      size.height = size.bottom - measure.y;
    }

    var width = Math.max(size.width, this.options.minWidth),
      height  = Math.max(size.height, this.options.minHeight);

    if (this.transform.isResizingProportionally()) {
      var mAspect = measure.width / measure.height;

      if (/s|n/.test(size.direction)) {
        width  = height * mAspect;
      } else {
        height = width / mAspect;
      }
    }

    if (this.hasAspectRatio()) {
      var aspect = this.getAspectRatio();

      if (size.direction) {
        if (/s|n/.test(size.direction)) {
          width  = height * aspect;
        } else {
          height = width / aspect;
        }
      } else if (this.getAspectRatio() < 1) {
        width  = height * aspect;
      } else {
        height = width / aspect;
      }
    }

    this.$domElement.css({
      width:  this.options.horizontalResizing ? width : 'auto',
      height: this.options.verticalResizing ? height : 'auto'
    });

    if (this.transform.isResizingCentered() || size.center) {
      var curMeasure = this.measure();

      this.$domElement.css({
        left: measure.x + (measure.width - curMeasure.width) / 2,
        top:  measure.y + (measure.height - curMeasure.height) / 2
      });
    } else if (size.direction) {
      if (/n/.test(size.direction)) {
        this.$domElement.css('top', measure.bottom - height);
      }

      if (/w/.test(size.direction)) {
        this.$domElement.css('left', measure.right - width);
      }

      if (size.direction.length === 1) {
        if (/n|s/.test(size.direction)) {
          this.$domElement.css(
            'left',
            measure.x + (measure.width - width) / 2);
        } else if (/e|w/.test(size.direction)) {
          this.$domElement.css(
            'top',
            measure.y + (measure.height - height) / 2);
        }
      }
    }

    if (this.transform.isResizing() && !this.transform.isResizingCentered()) {
      if (/n/.test(this.transform.getState().direction)) {
        this.$domElement.css('top', measure.bottom - height);
      }

      if (/e/.test(this.transform.getState().direction)) {
        this.$domElement.css('left', measure.x);
      }

      if (/s/.test(this.transform.getState().direction)) {
        this.$domElement.css('top', measure.y);
      }

      if (/w/.test(this.transform.getState().direction)) {
        this.$domElement.css('left', measure.right - width);
      }
    }
  },

  /**
   * @function
   * @returns {{x: (Number|number), y: (Number|number), width: (Number|number|*), height: (Number|number|*)}}
   */
  measure: function () {
    var $dom = this.$domElement.get(0),
      measure = {
        x:      $dom.offsetLeft,
        y:      $dom.offsetTop,
        width:  this.$domElement.outerWidth(),
        height: this.$domElement.outerHeight()
      };

    measure.right  = measure.x + measure.width;
    measure.bottom = measure.y + measure.height;

    return measure;
  },

  /**
   * @function
   */
  runIntro: function () {
    this.$domElement.addClass('intro-start');

    setTimeout((function () {
      this.$domElement.removeClass('intro-start').addClass('intro-end');

      setTimeout((function () {
        this.$domElement.removeClass('intro-end');
      }).bind(this), 500);
    }).bind(this), this.options.introDelay || 1);
  },

  /**
   * @function
   * @param {Object}   block
   * @param {String|*} direction
   */
  pair: function (block, direction) {
    this.pairings.push({
      block:     block,
      direction: direction
    });
  },

  /**
   * @function
   */
  unpair: function () {
    this.pairings.length = 0;
  },

  /**
   * @function
   */
  syncPairs: function () {
    this.pairings.forEach(function (pairing) {
      pairing.block.syncPairs();
    });
  },

  /**
   * @function
   */
  destroy: function () {
    this.destroyed = true;

    SL.editor.controllers.Blocks
      .focusChanged.remove(this.syncTransformVisibility);

    this.removed.dispatch();
    this.removed.dispose();
    this.dragStarted.dispose();
    this.dragUpdated.dispose();
    this.dragEnded.dispose();
    this.propertyChanged.dispose();
    this.transform.destroy();

    this.$domElement.off('vclick', this.onClick);
    this.$domElement.off('vmousedown', this.onMouseDown);
    this.$domElement.data('block-instance', null);
    this.$domElement.remove();
  },

  /**
   * @function
   * @param {Event} evt
   */
  onClick: function (evt) {
    if (SL.view.isEditing() &&
      this.hasPlugin(SL.editor.blocks.plugin.Link) && this.isLinked()) {
      evt.preventDefault();
    }
  },

  /**
   * @function
   * @param {Event} evt
   */
  onMouseDown: function (evt) {
    if (SL.view.isEditing()) {
      if ($(evt.target).closest('.sl-block-transform .anchor').length > 0) {
        return true;
      } else if (!this.isEditingText()) {
        evt.preventDefault();

        SL.editor.controllers.Blocks.focus(this, evt.shiftKey);

        $('input:focus, textarea:focus').blur();

        $(document).on('vmousemove', this.onMouseMove);
        $(document).on('vmouseup', this.onMouseUp);

        this.moved = false;

        this.mouseDownCursor.x = evt.clientX;
        this.mouseDownCursor.y = evt.clientY;

        this.dragTargets = SL.editor.controllers.Blocks.getFocusedBlocks().map(function (block) {
          return {
            block:  block,
            origin: block.measure(true)
          };
        });

        return void 0;
      }
    }
  },

  /**
   * @function
   * @param {Event} evt
   */
  onMouseMove: function (evt) {
    var isMoved =
      this.moved ||
      Math.abs(this.mouseDownCursor.x - evt.clientX) > 1 ||
      Math.abs(this.mouseDownCursor.y - evt.clientY) > 1;

    if (isMoved) {
      evt.preventDefault();

      this.dragTargets.forEach((function (target) {
        target.block.move(
          target.origin.x + (evt.clientX - this.mouseDownCursor.x),
          target.origin.y + (evt.clientY - this.mouseDownCursor.y));
      }).bind(this));

      if (this.moved === false) {
        SL.editor.controllers
          .Guides
          .start(SL.editor.controllers.Blocks.getFocusedBlocks());
      }

      SL.editor.controllers.Guides.sync();
      this.moved = true;
    }
  },

  /**
   * @function
   * @param {Event} evt
   */
  onMouseUp: function (evt) {
    evt.preventDefault();

    $(document).off('vmousemove', this.onMouseMove);
    $(document).off('vmouseup', this.onMouseUp);

    SL.editor.controllers.Guides.stop();

    if (!this.moved) {
      if (typeof this.lastMouseUpTime !== "number") {
        this.lastMouseUpTime     = 0;
        this.lastDoubleClickTime = 0;
      }

      var now = Date.now(), timeLine = 400;

      if (now - this.lastMouseUpTime < timeLine) {
        if (now - this.lastDoubleClickTime > timeLine) {
          this.onDoubleClick(evt);
        }

        this.lastDoubleClickTime = now;
      }

      this.lastMouseUpTime = now;
    }
  },

  /**
   * @function
   */
  onDoubleClick: function () {},

  /**
   * @function
   */
  onKeyDown: function () {},

  /**
   * @function
   */
  onKeyUp: function () {},

  /**
   * @function
   * @param {String} proStr
   * @returns {*}
   */
  get: function (proStr) {
    var property = this.getPropertySettings(proStr);

    if (property) {
      var proVal, proPathAry = proStr.split('.'),
        $target = this.$contentElement;

      if (typeof property.targetElement === "function") {
        $target = property.targetElement();
      }

      if ($target && $target.length) {
        if (property.getter) {
          proVal = property.getter.call(this);
        } else if (proPathAry[0] === 'style') {
          var proName = proPathAry[1].replace(/-(\w)/g, function (word0, word1) {
            return word1.toUpperCase();
          });

          if (property.computed) {
            proVal = $target.css(proName);
          } else {
            proVal = $target.get(0).style[proName];
          }
        } else if (proPathAry[0] === 'attribute') {
          proVal = $target.attr(proPathAry[1]);

          if (typeof proVal === "string") {
            if (proVal === 'null') {
              return null;
            }

            if (proVal === 'true') {
              return true;
            }

            if (proVal === 'false') {
              return false;
            }

            if (proVal.match(/^\d+$/)) {
              return parseFloat(proVal);
            }
          }
        }
      }

      if (property.type === 'number') {
        proVal = parseFloat(proVal);
      }

      if (property.defaultValue !== 'undefined') {
        if (property.type === 'number') {
          if (isNaN(proVal)) {
            proVal = property.defaultValue;
          }
        } else if (!proVal) {
          proVal = property.defaultValue;
        }
      }

      return proVal;
    }

    return void console.log('Property not found:', proStr);
  },

  /**
   * @function
   * @param {String} proStr
   * @param {*}      value
   */
  set: function (proStr, value) {
    if (typeof proStr === "string") {
      var str = proStr;

      proStr      = {};
      proStr[str] = value;
    }

    var proAry = [];

    for (var proName in proStr) {
      if (proStr.hasOwnProperty(proName)) {
        var property = this.getPropertySettings(proName);

        if (property) {
          var proNameAry = proName.split('.'),
            val = proStr[proName], defaultVal = val,
            $target = this.$contentElement;

          if (typeof property.targetElement === "function") {
            $target = property.targetElement();
          }

          if (property.unit) {
            val += property.unit;
          }

          if (property.setter) {
            property.setter.call(null, val);
          } else if (proNameAry[0] === 'style') {
            if (typeof property.defaultValue !== "undefined" &&
              property.defaultValue === defaultVal) {
              $target.css(proNameAry[1], '');
            } else {
              $target.css(proNameAry[1], val);
            }
          } else if (proNameAry[0] === 'attribute') {
            $target.attr(proNameAry[1], val);
          }

          proAry.push(proName);
        } else {
          console.log('Property not found:', proName);
        }
      }
    }

    if (proAry.length) {
      this.propertyChanged.dispatch(proAry);
    }
  }
});


/*!
 * project name: SlideStudio
 * name:         behavior.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/18
 */

'use strict';

SL('editor.blocks.behavior').Transform = Class.extend({
  ANCHOR_SIZE: 16,

  /**
   * @function
   * @param block
   */
  init: function (block) {
    this.block = block;
    this.state = {
      direction:              null,
      centered:               false,
      proportional:           false,
      originalMeasurements:   null,
      originalCursorPosition: {x: 0, y: 0}
    };

    this.render();
    this.bind();
  },

  /**
   * @function
   */
  render: function () {
    this.$domElement = $('<div class="sl-block-transform editing-ui">');
    this.$domElement.attr({
      'data-horizontal': this.block.options.horizontalResizing,
      'data-vertical':   this.block.options.verticalResizing
    });

    this.anchors = {};
    this.anchors.n  =
      $('<div class="anchor" data-direction="n">')
        .appendTo(this.$domElement);
    this.anchors.e  =
      $('<div class="anchor" data-direction="e">')
        .appendTo(this.$domElement);
    this.anchors.s  =
      $('<div class="anchor" data-direction="s">')
        .appendTo(this.$domElement);
    this.anchors.w  =
      $('<div class="anchor" data-direction="w">')
        .appendTo(this.$domElement);
    this.anchors.nw =
      $('<div class="anchor" data-direction="nw">')
        .appendTo(this.$domElement);
    this.anchors.ne =
      $('<div class="anchor" data-direction="ne">')
        .appendTo(this.$domElement);
    this.anchors.se =
      $('<div class="anchor" data-direction="se">')
        .appendTo(this.$domElement);
    this.anchors.sw =
      $('<div class="anchor" data-direction="sw">')
        .appendTo(this.$domElement);
  },

  /**
   * @function
   */
  bind: function () {
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp   = this.onMouseUp.bind(this);

    this.resizeStarted = new signals.Signal();
    this.resizeEnded   = new signals.Signal();

    for (var anchor in this.anchors) {
      this.anchors[anchor].on('vmousedown', this.onMouseDown);
    }
  },

  /**
   * @function
   */
  show: function () {
    if (this.$domElement.parent().length === 0) {
      this.$domElement.appendTo(this.block.$domElement);
      this.$domElement.addClass('visible');
    }
  },

  /**
   * @function
   */
  hide: function () {
    this.$domElement.detach();
    this.$domElement.removeClass('visible');
  },

  /**
   * @function
   */
  destroy: function () {
    this.$domElement.remove();
  },

  /**
   * @function
   * @returns {boolean}
   */
  isResizing: function () {
    return !!this.state.direction;
  },

  /**
   * @function
   * @returns {*|boolean|null}
   */
  isResizingCentered: function () {
    return this.isResizing() && this.state.centered;
  },

  /**
   * @function
   * @returns {*|boolean|null}
   */
  isResizingProportionally: function () {
    return this.isResizing() && this.state.proportional;
  },

  /**
   * @function
   * @returns {*}
   */
  getState: function () {
    return this.state;
  },

  /**
   * @function
   * @param {Event} evt
   */
  onMouseDown: function (evt) {
    evt.preventDefault();

    this.state.direction = $(evt.currentTarget).attr('data-direction');

    if (this.state.direction) {
      $(document).on('vmousemove', this.onMouseMove);
      $(document).on('vmouseup', this.onMouseUp);

      this.moved = false;

      this.state.originalCursorPosition.x = evt.clientX;
      this.state.originalCursorPosition.y = evt.clientY;

      this.state.originalMeasurements = this.block.measure(true);
    }
  },

  /**
   * @function
   * @param {Event} evt
   */
  onMouseMove: function (evt) {
    evt.preventDefault();

    if (!this.moved) {
      this.resizeStarted.dispatch(this);
      SL.editor.controllers.Guides.start([this.block], {
        action:    'resize',
        direction: this.state.direction
      });
    }

    this.moved = true;

    var offsetX = evt.clientX - this.state.originalCursorPosition.x,
      offsetY   = evt.clientY - this.state.originalCursorPosition.y;

    if (evt.altKey) {
      offsetX *= 2;
      offsetY *= 2;
    }

    var width = '', height = '';

    switch (this.state.direction) {
      case 'e':
        width = Math.max(this.state.originalMeasurements.width + offsetX, 1);
        break;
      case 'w':
        width = Math.max(this.state.originalMeasurements.width - offsetX, 1);
        break;
      case 's':
        height = Math.max(this.state.originalMeasurements.height + offsetY, 1);
        break;
      case 'n':
        height = Math.max(this.state.originalMeasurements.height - offsetY, 1);
        break;
      case 'nw':
        width  = Math.max(this.state.originalMeasurements.width - offsetX, 1);
        height = Math.max(this.state.originalMeasurements.height - offsetY, 1);
        break;
      case 'ne':
        width  = Math.max(this.state.originalMeasurements.width + offsetX, 1);
        height = Math.max(this.state.originalMeasurements.height - offsetY, 1);
        break;
      case 'se':
        width  = Math.max(this.state.originalMeasurements.width + offsetX, 1);
        height = Math.max(this.state.originalMeasurements.height + offsetY, 1);
        break;
      case 'sw':
        width  = Math.max(this.state.originalMeasurements.width - offsetX, 1);
        height = Math.max(this.state.originalMeasurements.height + offsetY, 1);
        break;
    }

    if (this.block.hasAspectRatio()) {
      if (width === '') {
        width =
          this.state.originalMeasurements.width *
          (height / this.state.originalMeasurements.height);
      }

      if (height === '') {
        height =
          this.state.originalMeasurements.height *
          (width / this.state.originalMeasurements.width);
      }
    } else {
      if (width === '') {
        width = this.state.originalMeasurements.width;
      }

      if (height === '') {
        height = this.state.originalMeasurements.height;
      }
    }

    this.state.centered     = evt.altKey;
    this.state.proportional = evt.shiftKey;

    this.block.resize({
      width:     width,
      height:    height,
      direction: this.state.direction
    });

    SL.editor.controllers.Guides.sync();
  },

  /**
   * @function
   * @param {Event} evt
   */
  onMouseUp: function (evt) {
    evt.preventDefault();

    $(document).off('vmousemove', this.onMouseMove);
    $(document).off('vmouseup', this.onMouseUp);

    SL.editor.controllers.Guides.stop();

    if (this.moved) {
      this.resizeEnded.dispatch(this);
    }

    this.state.direction    = null;
    this.state.centered     = null;
    this.state.proportional = null;
  }
});


/*!
 * project name: SlideStudio
 * name:         iframe.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/18
 */

'use strict';

SL('editor.blocks').Iframe = SL.editor.blocks.Base.extend({
  /**
   * Constructor SL.editor.blocks.Iframe Instance
   *
   * @function
   * @param {Object} options
   */
  init: function (options) {
    this._super('iframe', options);

    this.editingRequested    = new signals.Signal();
    this.iframeSourceChanged = new signals.Signal();

    this.paint();
  },

  /**
   * @function
   */
  setup: function () {
    this._super();

    this.setIframeURL      = this.setIframeURL.bind(this);
    this.getIframeURL      = this.getIframeURL.bind(this);
    this.setIframeAutoplay = this.setIframeAutoplay.bind(this);
    this.getIframeAutoplay = this.getIframeAutoplay.bind(this);

    this.setIframeURL = $.debounce(this.setIframeURL, 400);

    this.properties.iframe = {
      src: {
        setter: this.setIframeURL,
        getter: this.getIframeURL
      },
      autoplay: {
        defaultValue: false,
        setter: this.setIframeAutoplay,
        getter: this.getIframeAutoplay
      }
    };
  },

  /**
   * @function
   */
  paint: function () {
    this._super.apply(this, arguments);

    var url = this.getIframeURL(),
      protocol = window.location.protocol;

    if (protocol === 'https:' && url && /^http:/gi.test(url)) {
      if (this.$domElement.find('.sl-block-overlay-message').length === 0) {
        this.$domElement.append([
          '<div class="editing-ui sl-block-overlay sl-block-overlay-message below-content vcenter">',
            '<div class="vcenter-target">' +
              'Cannot display non-HTTPS iframe while in the editor.' +
            '</div>',
          '</div>'].join(''));
      }
    } else {
      this.$domElement.find('.sl-block-overlay-message').remove();
    }
  },

  /**
   * @function
   */
  setDefaults: function () {
    this._super();
    this.resize({width: 360, height: 300});
  },

  /**
   * @function
   * @returns {*|String}
   */
  getIframeURL: function () {
    return this.getIframeElement().attr('src') || this.getIframeElement().attr('data-src');
  },

  /**
   * @function
   * @param {String} url
   */
  setIframeURL: function (url) {
    if (url !== this.get('iframe.src')) {
      this.getIframeElement().attr({
        'src':      url,
        'data-src': url
      });
      this.iframeSourceChanged.dispatch(url);
    }

    this.paint();
    //编辑
  },

  /**
   * @function
   * @returns {boolean|*}
   */
  getIframeAutoplay: function () {
    return this.getIframeElement().get(0).hasAttribute('data-autoplay');
  },

  /**
   * @function
   * @param {boolean} isAutoPlay
   */
  setIframeAutoplay: function (isAutoPlay) {
    if (isAutoPlay === true) {
      this.getIframeElement().attr('data-autoplay', '');
    } else {
      this.getIframeElement().removeAttr('data-autoplay');
    }
  },

  /**
   * @function
   * @returns {Array.<*>}
   */
  getToolbarOptions: function () {
    return [
      SL.editor.components.toolbars.options.IframeSRC,
      SL.editor.components.toolbars.options.IframeAutoplay,
      SL.editor.components.toolbars.options.Divider,
      SL.editor.components.toolbars.options.Opacity,
      SL.editor.components.toolbars.options.Padding,
      SL.editor.components.toolbars.options.Divider,
      SL.editor.components.toolbars.groups.BorderCSS
    ].concat(this._super());
  },

  /**
   * @function
   * @returns {*|jQuery|HTMLElement}
   */
  getIframeElement: function () {
    var $iframe = this.$contentElement.find('iframe');

    if ($iframe.length === 0) {
      $iframe = $('<iframe>').appendTo(this.$contentElement);
    }

    $iframe.attr({
      webkitallowfullscreen: '',
      mozallowfullscreen:    '',
      allowfullscreen:       '',
      sandbox: 'allow-forms allow-scripts allow-popups ' +
        'allow-same-origin allow-pointer-lock'
    });

    return $iframe;
  },

  /**
   * @function
   * @returns {boolean}
   */
  isEmpty: function () {
    return !this.isset('iframe.src');
  },

  /**
   * @function
   */
  destroy: function () {
    this.iframeSourceChanged.dispose();
    this._super();
  },

  /**
   * @function
   * @param {Event} evt
   */
  onDoubleClick: function (evt) {
    this._super(evt);
    this.editingRequested.dispatch();
  },

  /**
   * @function
   * @param {Event} evt
   */
  onKeyDown: function (evt) {
    this._super(evt);

    if (evt.keyCode === 13 && !SL.util.isTypingEvent(evt)) {
      this.editingRequested.dispatch();
      evt.preventDefault();
    }
  }
});

'use strict';

SL('editor.blocks').SectionIframe = SL.editor.blocks.Base.extend({
  /**
   * Constructor SL.editor.blocks.Iframe Instance
   *
   * @function
   * @param {Object} options
   */
  init: function (options) {
    this._super('sectionIframe', options);

    this.editingRequested    = new signals.Signal();
    this.iframeSourceChanged = new signals.Signal();

    this.paint();
  },

  /**
   * @function
   */
  setup: function () {
    this._super();

    this.setIframeURL      = this.setIframeURL.bind(this);
    this.getIframeURL      = this.getIframeURL.bind(this);
    this.setIframeAutoplay = this.setIframeAutoplay.bind(this);
    this.getIframeAutoplay = this.getIframeAutoplay.bind(this);

    this.setIframeURL = $.debounce(this.setIframeURL, 400);

    this.properties.iframe = {
      src: {
        setter: this.setIframeURL,
        getter: this.getIframeURL
      },
      autoplay: {
        defaultValue: false,
        setter: this.setIframeAutoplay,
        getter: this.getIframeAutoplay
      }
    };
  },

  /**
   * @function
   */
  paint: function () {
    this._super.apply(this, arguments);

    var url = this.getIframeURL(),
      protocol = window.location.protocol;

    if (protocol === 'https:' && url && /^http:/gi.test(url)) {
      if (this.$domElement.find('.sl-block-overlay-message').length === 0) {
        this.$domElement.append([
          '<div class="editing-ui sl-block-overlay sl-block-overlay-message below-content vcenter">',
            '<div class="vcenter-target">' +
              'Cannot display non-HTTPS iframe while in the editor.' +
            '</div>',
          '</div>'].join(''));
      }
    } else {
      this.$domElement.find('.sl-block-overlay-message').remove();
    }
  },

  /**
   * @function
   */
  setDefaults: function () {
    this._super();
    this.resize({width: 360, height: 300});
  },

  /**
   * @function
   * @returns {*|String}
   */
  getIframeURL: function () {
    return this.getIframeElement().attr('src') || this.getIframeElement().attr('data-src');
  },

  /**
   * @function
   * @param {String} url
   */
  setIframeURL: function (url) {
    var id = url.split('id=')[1];
    if (url !== this.get('iframe.src')) {
      this.getIframeElement().attr({
        'src':      url,
        'data-src': url,
        'data-id': id
      });
      this.iframeSourceChanged.dispatch(url);
    }

    this.paint();
    //编辑
  },

  getSectionId: function () {
    return parseInt(this.getIframeElement().attr('data-id'));
  },


  getAnnotated: function () {
    return this.getIframeElement().attr('data-Annotated');
  },

  setAnnotated: function (Annotated) {
    this.getIframeElement().attr('data-Annotated', Annotated);
  },
  /**
   * @function
   * @returns {boolean|*}
   */
  getIframeAutoplay: function () {
    return this.getIframeElement().get(0).hasAttribute('data-autoplay');
  },

  /**
   * @function
   * @param {boolean} isAutoPlay
   */
  setIframeAutoplay: function (isAutoPlay) {
    if (isAutoPlay === true) {
      this.getIframeElement().attr('data-autoplay', '');
    } else {
      this.getIframeElement().removeAttr('data-autoplay');
    }
  },

  /**
   * @function
   * @returns {Array.<*>}
   */
  getToolbarOptions: function () {
    return [
      SL.editor.components.toolbars.options.IframeAutoplay,
      SL.editor.components.toolbars.options.Divider,
      SL.editor.components.toolbars.options.Opacity,
      SL.editor.components.toolbars.options.Padding,
      SL.editor.components.toolbars.options.Divider,
      SL.editor.components.toolbars.groups.BorderCSS,
      SL.editor.components.toolbars.options.SectionToEdit
    ].concat(this._super());
  },

  /**
   * @function
   * @returns {*|jQuery|HTMLElement}
   */
  getIframeElement: function () {
    var $iframe = this.$contentElement.find('iframe');

    if ($iframe.length === 0) {
      $iframe = $('<iframe style="width:100%;height:100%">').appendTo(this.$contentElement);
    }

    $iframe.attr({
      webkitallowfullscreen: '',
      mozallowfullscreen:    '',
      allowfullscreen:       '',
      sandbox: 'allow-forms allow-scripts allow-popups ' +
        'allow-same-origin allow-pointer-lock'
    });

    return $iframe;
  },

  /**
   * @function
   * @returns {boolean}
   */
  isEmpty: function () {
    return !this.isset('iframe.src');
  },

  /**
   * @function
   */
  destroy: function () {
    this.iframeSourceChanged.dispose();
    this._super();
  },

  /**
   * @function
   * @param {Event} evt
   */
  onDoubleClick: function (evt) {
    this._super(evt);
    this.browse();
  },

  browse: function () {
    var popup =
      SL.popup.open(SL.editor.components.sectionlibrary.SectionLibrary);
    popup.selected.addOnce(this.setIframeURL.bind(this));
  },

  /**
   * @function
   * @param {Event} evt
   */
  onKeyDown: function (evt) {
    this._super(evt);

    if (evt.keyCode === 13 && !SL.util.isTypingEvent(evt)) {
      this.editingRequested.dispatch();
      evt.preventDefault();
    }
  }
});


SL('editor.blocks').Video = SL.editor.blocks.Base.extend({
  /**
   * Constructor SL.editor.blocks.Iframe Instance
   *
   * @function
   * @param {Object} options
   */
  init: function (options) {
    this._super('video', options);

    this.editingRequested    = new signals.Signal();
    this.videoSourceChanged = new signals.Signal();

    this.paint();
  },

  /**
   * @function
   */
  setup: function () {
    this._super();

    this.setVideoURL      = this.setVideoURL.bind(this);
    this.getVideoURL      = this.getVideoURL.bind(this);
    this.setVideoAutoplay = this.setVideoAutoplay.bind(this);
    this.getVideoAutoplay = this.getVideoAutoplay.bind(this);

    this.setVideoURL = $.debounce(this.setVideoURL, 400);

    this.properties.video = {
      src: {
        setter: this.setVideoURL,
        getter: this.getVideoURL
      },
      autoplay: {
        defaultValue: false,
        setter: this.setVideoAutoplay,
        getter: this.getVideoAutoplay
      }
    };
  },

  /**
   * @function
   */
  paint: function () {
    this._super.apply(this, arguments);

    var url = this.getVideoURL(),
      protocol = window.location.protocol;

    // if (protocol === 'https:' && url && /^http:/gi.test(url)) {
    //   if (this.$domElement.find('.sl-block-overlay-message').length === 0) {
    //     this.$domElement.append([
    //       '<div class="editing-ui sl-block-overlay sl-block-overlay-message below-content vcenter">',
    //         '<div class="vcenter-target">' +
    //           'Cannot display non-HTTPS iframe while in the editor.' +
    //         '</div>',
    //       '</div>'].join(''));
    //   }
    // } else {
    //   this.$domElement.find('.sl-block-overlay-message').remove();
    // }
  },

  /**
   * @function
   */
  setDefaults: function () {
    this._super();
    this.resize({width: 500, height: 282});

    if (this.options.insertedFromToolbar) {
      this.options.introDelay = 300;
      this.browse();
    }
  },

  /**
   * @function
   * @returns {*|String}
   */
  getVideoURL: function () {
    return this.getVideoElement().attr('src') || this.getVideoElement().attr('data-src');
  },

  /**
   * @function
   * @param {String} url
   */
  setVideoURL: function (url, thumbnail) {
    if (typeof(url) == 'string') {

      if (url !== this.get('Video.src')) {
        this.getVideoElement().attr({
          'src':      url,
          'data-src': url,
          'poster': thumbnail
        });
      }

    } 
    else if (typeof(url) == 'object') {
      console.log(url);
      if (url.data.url !== this.get('Video.src')) {
        this.getVideoElement().attr({
          'src':      url.data.url,
          'data-src': url.data.url,
          'poster': url.data.thumb_url
        });
      }
    }
    SL.editor.controllers.Blocks.getFocusedBlocks()[0].$domElement.css('background', '#faf9fa');
    this.videoSourceChanged.dispatch(url);

    this.paint();
  },

  /**
   * @function
   * @returns {boolean|*}
   */
  getVideoAutoplay: function () {
    return this.getVideoElement().get(0).hasAttribute('data-autoplay');
  },

  /**
   * @function
   * @param {boolean} isAutoPlay
   */
  setVideoAutoplay: function (isAutoPlay) {
    if (isAutoPlay === true) {
      this.getVideoElement().attr('data-autoplay', '');
    } else {
      this.getVideoElement().removeAttr('data-autoplay');
    }
  },

  /**
   * @function
   * @returns {Array.<*>}
   */
  getToolbarOptions: function () {
    return [
      SL.editor.components.toolbars.options.Divider,
      SL.editor.components.toolbars.options.BackgroundColor,
      SL.editor.components.toolbars.options.Opacity,
      SL.editor.components.toolbars.options.Padding,
      SL.editor.components.toolbars.options.Divider,
      SL.editor.components.toolbars.groups.BorderCSS
    ].concat(this._super());
  },

  /**
   * @function
   * @returns {*|jQuery|HTMLElement}
   */
  getVideoElement: function () {
    var $video = this.$contentElement.find('video');
    
    if ($video.length === 0) {
      $video = $('<video>').appendTo(this.$contentElement);
    }

    $video.attr({
      controls: 'controls'
    });

    return $video;
  },

  browse: function () {
    var popup =
      SL.popup.open(SL.editor.components.medialibrary.MediaLibrary, {
        select: SL.models.Media.VIDEO
      });
    popup.selected.addOnce(this.setVideoURL.bind(this));
  },

  /**
   * @function
   * @returns {boolean}
   */
  isEmpty: function () {
    return !this.isset('video.src');
  },

  /**
   * @function
   */
  destroy: function () {
    this.videoSourceChanged.dispose();
    this._super();
  },

  /**
   * @function
   * @param {Event} evt
   */
  onDoubleClick: function () {
    this.browse();
  },

  /**
   * @function
   * @param {Event} evt
   */
  onKeyDown: function (evt) {
    this._super(evt);

    if (evt.keyCode === 13 && !SL.util.isTypingEvent(evt)) {
      this.editingRequested.dispatch();
      evt.preventDefault();
    }
  }
});

/*!
 * project name: SlideStudio
 * name:         image.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/18
 */

'use strict';

SL('editor.blocks').Image = SL.editor.blocks.Base.extend({
  /**
   * Constructor SL.editor.blocks.Image Instance
   *
   * @function
   * @param {Object} options
   */
  init: function (options) {
    this._super('image', options);

    this.plug(SL.editor.blocks.plugin.Link);

    this.imageURLChanged   = new signals.Signal();
    this.imageStateChanged = new signals.Signal();
  },

  /**
   * @function
   */
  setup: function () {
    this._super();

    this.properties.image = {
      src: {
        setter: this.setImageURL.bind(this),
        getter: this.getImageURL.bind(this)
      }
    };
    this.properties.attribute['data-inline-svg'] = {defaultValue: false};
  },

  /**
   * @function
   */
  bind: function () {
    this._super();

    this.onUploadCompleted = this.onUploadCompleted.bind(this);
    this.onUploadFailed    = this.onUploadFailed.bind(this);

    this.propertyChanged.add(this.onPropertyChanged.bind(this));
  },

  /**
   * @function
   */
  setDefaults: function () {
    this._super();

    this.resize({width: 360, height: 300});

    if (this.options.insertedFromToolbar) {
      this.options.introDelay = 300;
      this.browse();
    }
  },

  /**
   * @function
   * @returns {Array.<*>}
   */
  getToolbarOptions: function () {
    return [
      SL.editor.components.toolbars.options.Image,
      SL.editor.components.toolbars.options.ImageInlineSVG,
      SL.editor.components.toolbars.options.Divider,
      SL.editor.components.toolbars.options.Opacity,
      SL.editor.components.toolbars.options.Divider,
      SL.editor.components.toolbars.groups.BorderCSS,
      SL.editor.components.toolbars.options.Divider,
      SL.editor.components.toolbars.groups.Link
    ].concat(this._super());
  },

  /**
   * @function
   * @param {String} url
   */
  setImageURL: function (url) {
    if (url !== this.getImageURL()) {
      this.loading = true;
      this.paint();
      this.imageStateChanged.dispatch();

      var $img = this.$contentElement.find('img');

      if ($img.length === 0) {
        $img = $('<img src="' + url + '">');
        $img.css('visibility', 'hidden');
        $img.appendTo(this.$contentElement);
      } else {
        $img.attr('src', url);
      }

      $img.off('load').on('load', (function () {
        $img.css('visibility', '');
        this.loading = false;

        this.syncAspectRatio();
        this.paint();

        this.imageStateChanged.dispatch();

        this.paintInlineSVG();
      }).bind(this));

      this.imageURLChanged.dispatch(url);
    }
  },

  /**
   * @function
   * @returns {*|String}
   */
  getImageURL: function () {
    return this.$contentElement.find('img').attr('src');
  },

  /**
   * @function
   * @param model
   */
  setImageModel: function (model) {
    if (model.isSVG()) {
      this.set('attribute.data-inline-svg', model.get('inline'));
    }

    this.intermediateModel = model;

    if (this.intermediateModel.isUploaded()) {
      this.onUploadCompleted();
    } else {
      this.paint();

      this.imageStateChanged.dispatch();
      this.intermediateModel.uploadCompleted.add(this.onUploadCompleted);
      this.intermediateModel.uploadFailed.add(this.onUploadFailed);
    }
  },

  /**
   * @function
   * @returns {boolean}
   */
  isLoading: function () {
    return !!this.loading || !!this.loadingSVG;
  },

  /**
   * @function
   * @returns {boolean}
   */
  isUploading: function () {
    return !(!this.intermediateModel ||
      !this.intermediateModel.isWaitingToUpload() &&
      !this.intermediateModel.isUploading());
  },

  /**
   * @function
   * @returns {boolean}
   */
  hasImage: function () {
    var url = this.get('image.src');
    return !!(typeof url === "string" && url.length > 0);
  },

  /**
   * @function
   * @returns {*|boolean}
   */
  isLoaded: function () {
    var size = this.getNaturalSize(true);
    return size && size.width > 0 && size.height > 0;
  },

  /**
   * @function
   * @returns {*|boolean}
   */
  isSVG: function () {
    return this.hasImage() && /^svg/i.test(this.get('image.src').split('.').pop());
  },

  /**
   * @function
   * @param {boolean} isCurrent
   * @returns {*|Object}
   */
  getNaturalSize: function (isCurrent) {
    var $img = this.$contentElement.find('img');

    if ($img.length) {
      var size = {};

      if (!isCurrent) {
        size.width  = parseInt($img.attr('data-natural-width'), 10);
        size.height = parseInt($img.attr('data-natural-height'), 10);

        if (size.width && size.height) {
          return size;
        }
      }

      size.width  = $img.get(0).naturalWidth;
      size.height = $img.get(0).naturalHeight;

      if (size.width && size.height) {
        $img.attr({
          'data-natural-width':  size.width,
          'data-natural-height': size.height
        });

        return size;
      }
    }

    return null;
  },

  /**
   * @function
   * @param {boolean} isCurrent
   * @returns {*|Number}
   */
  getAspectRatio: function (isCurrent) {
    var size = this.getNaturalSize(isCurrent);

    if (size) {
      return size.width / size.height;
    } else {
      return this._super();
    }
  },

  /**
   * @function
   */
  syncAspectRatio: function () {
    var size = this.getNaturalSize(true);

    if (size) {
      var measure = this.measure();

      this.resize({
        width:  measure.width,
        height: measure.height,
        center: true
      });
    }
  },

  /**
   * @function
   */
  paint: function () {
    this.$domElement
      .find('.sl-block-placeholder, .image-progress')
      .remove();

    if (this.isLoading() || this.isUploading()) {
      this.$domElement.append([
        '<div class="editing-ui sl-block-overlay image-progress">',
          '<span class="spinner centered"></span>',
        '</div>'].join(''));
      SL.util.html.generateSpinners();
    } else if (!this.hasImage()) {
      this.showPlaceholder();
    }

    this.syncZ();
  },

  /**
   * @function
   */
  paintInlineSVG: function () {
    if (this.isSVG() && this.get('attribute.data-inline-svg')) {
      this.loadingSVG = true;

      this.paint();

      $.ajax({
        url: this.getImageURL() + '?t=' + Date.now(),
        type:     'GET',
        dataType: 'xml',
        context:   this
      }).done(function (data) {
        var svgDom = $(data).find('svg').first().get(0);

        if (svgDom) {
          svgDom.setAttribute('preserveAspectRatio', 'xMidYMid meet');

          if (!svgDom.hasAttribute('viewBox')) {
            var size = this.getNaturalSize();

            if (size) {
              svgDom.setAttribute(
                'viewBox',
                '0 0 ' + size.width + ' ' + size.height);
            }
          }

          this.$contentElement.find('img').css('display', 'none');
          this.$contentElement.find('svg').remove();
          this.$contentElement.append(svgDom);
        }
      }).always(function () {
        this.loadingSVG = false;
        this.paint();
        this.imageStateChanged.dispatch();
      });
    } else {
      this.$contentElement.find('img').css('display', '');
      this.$contentElement.find('svg').remove();
    }
  },

  /**
   * @function
   */
  clear: function () {
    this.$contentElement.find('img').remove();
    this.paint();
    this.imageStateChanged.dispatch();
  },

  /**
   * @function
   */
  browse: function () {
    var popup =
      SL.popup.open(SL.editor.components.medialibrary.MediaLibrary, {
        select: SL.models.Media.IMAGE
      });
    popup.selected.addOnce(this.setImageModel.bind(this));
  },

  /**
   * @function
   */
  destroy: function () {
    if (this.intermediateModel) {
      this.intermediateModel.uploadCompleted.remove(this.onUploadCompleted);
      this.intermediateModel.uploadFailed.remove(this.onUploadFailed);
      this.intermediateModel = null;
    }

    this.imageStateChanged.dispose();
    this.imageStateChanged = null;

    this.imageURLChanged.dispose();
    this.imageURLChanged = null;

    this._super();
  },

  /**
   * @function
   */
  onUploadCompleted: function () {
    var url = this.intermediateModel.get('url');
    this.intermediateModel = null;
    this.set('image.src', url);
    this.imageStateChanged.dispatch();
  },

  /**
   * @function
   */
  onUploadFailed: function () {
    this.intermediateModel = null;
    this.paint();
    this.imageStateChanged.dispatch();
  },

  /**
   * @function
   */
  onDoubleClick: function () {
    this.browse();
  },

  /**
   * @function
   * @param {Object} pros
   */
  onPropertyChanged: function (pros) {
    if (pros[0] === 'attribute.data-inline-svg') {
      this.paintInlineSVG();
    }
  }
});

/*!
 * project name: SlideStudio
 * name:         plugin.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/18
 */

'use strict';

SL('editor.blocks.plugin').HTML = Class.extend({
  /**
   * Constructor SL.editor.blocks.HTML Instance
   *
   * @function
   * @param {Object|Instance|*} block
   */
  init: function (block) {
    this.block = block;

    this.block.editHTML      = (function () {
      var popup = SL.popup.open(SL.components.popup.EditHTML, {
        html: this.$contentElement.html()
      });
      popup.saved.add((function (html) {
        this.setCustomHTML(html);
      }).bind(this));
    }).bind(block);
    this.block.setCustomHTML = (function (html) {
      this.$contentElement.attr('data-has-custom-html', '');
      this.$contentElement.html(html);
    }).bind(block);
    this.block.hasCustomHTML = (function () {
      return this.$contentElement.get(0)
        .hasAttribute('data-has-custom-html');
    }).bind(block);
  },

  /**
   * @function
   */
  destroy: function () {
    delete this.block.editHTML;
    delete this.block.setCustomHTML;
    delete this.block.hasCustomHTML;
  }
});

SL('editor.blocks.plugin').Link = Class.extend({
  /**
   * Constructor SL.editor.blocks.Link Instance
   *
   * @function
   * @param {Object|Instance|*} block
   */
  init: function (block) {
    this.block = block;

    this.block.setLinkURL = (function (url) {
      if (typeof url === "string") {
        if (this.isLinked() === false) {
          this.changeContentElementType('a');
        }

        this.$contentElement.attr('href', url);
        this.$contentElement.attr('target', '_blank');

        if (/^#\/\d/.test(url)) {
          this.$contentElement.removeAttr('target');
        }
      } else {
        this.$contentElement.removeAttr('target');
        this.changeContentElementType(this.options.contentElementType);
      }
    }).bind(block);

    this.block.getLinkURL = (function () {
      return this.$contentElement.attr('href');
    }).bind(block);

    this.block.isLinked = (function () {
      return this.$contentElement.is('a');
    }).bind(block);

    this.block.properties.link = {
      href: {
        setter:  this.block.setLinkURL,
        getter:  this.block.getLinkURL,
        checker: this.block.isLinked
      }
    };
  },

  /**
   * @function
   */
  destroy: function () {
    delete this.block.properties.link;
    delete this.block.setLinkURL;
    delete this.block.getLinkURL;
    delete this.block.isLinked;
  }
});


/*!
 * project name: SlideStudio
 * name:         shape.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/18
 */

'use strict';

SL('editor.blocks').Shape = SL.editor.blocks.Base.extend({
  /**
   * Constructor SL.editor.blocks.Shape Instance
   *
   * @function
   * @param {Object} options
   */
  init: function (options) {
    this._super('shape', $.extend({
      minWidth:  4,
      minHeight: 4
    }, options));
    this.plug(SL.editor.blocks.plugin.Link);
  },

  /**
   * @function
   */
  setup: function () {
    this._super();
    this.properties.attribute['data-shape-type'] = {
      defaultValue: 'rect',
      options: [{
        value: 'rect'
      }, {
        value: 'circle'
      }, {
        value: 'diamond'
      }, {
        value: 'octagon'
      }, {
        value: 'triangle-up'
      }, {
        value: 'triangle-down'
      }, {
        value: 'triangle-left'
      }, {
        value: 'triangle-right'
      }, {
        value: 'arrow-up'
      }, {
        value: 'arrow-down'
      }, {
        value: 'arrow-left'
      }, {
        value: 'arrow-right'
      }]
    };

    for (var symbol in SL.util.svg.SYMBOLS) {
      this.properties
        .attribute['data-shape-type']
        .options.push({
          value: 'symbol-' + symbol
        });
    }

    this.properties.attribute['data-shape-stretch']      = {
      defaultValue: false
    };
    this.properties.attribute['data-shape-fill-color']   = {
      defaultValue: '#000'
    };
    this.properties.attribute['data-shape-stroke-color'] = {};
    this.properties.attribute['data-shape-stroke-width'] = {
      type:         'number',
      decimals:     0,
      minValue:     1,
      maxValue:     50,
      defaultValue: 0
    };
  },

  /**
   * @function
   */
  bind: function () {
    this._super();
    this.propertyChanged.add(this.onPropertyChanged.bind(this));
  },

  /**
   * @function
   */
  setDefaults: function () {
    this._super();

    this.resize({width: 300, height: 300});
    this.set(
      'attribute.data-shape-type',
      this.getPropertyDefault('attribute.data-shape-type'));
    this.set(
      'attribute.data-shape-fill-color',
      this.getPropertyDefault('attribute.data-shape-fill-color'));
    this.set(
      'attribute.data-shape-stretch',
      this.getPropertyDefault('attribute.data-shape-stretch'));
  },

  /**
   * @function
   */
  paint: function () {
    var type      = this.get('attribute.data-shape-type'),
      fillClr     = this.get('attribute.data-shape-fill-color'),
      strokeClr   = this.get('attribute.data-shape-stroke-color'),
      strokeWidth = this.get('attribute.data-shape-stroke-width'),
      stretch     = this.get('attribute.data-shape-stretch'),
      width       = this.$domElement.width(),
      height      = this.$domElement.height();

    if (!stretch) {
      width = height = Math.min(width, height);
    }

    var shape =
      SL.editor.blocks.Shape.shapeFromType(type, width, height);

    if (shape) {
      var hasStroke    = this.hasStroke(),
        supportsStroke = this.supportsStroke(shape),
        svgElement     = this.getSVGElement();

      svgElement.setAttribute('width', '100%');
      svgElement.setAttribute('height', '100%');
      svgElement.setAttribute(
        'preserveAspectRatio',
        stretch ? 'none' : 'xMidYMid');
      svgElement.innerHTML = '';

      if (supportsStroke && hasStroke) {
        var id = SL.util.string.uniqueID('shape-mask-'),
          defs =
            document.createElementNS(SL.util.svg.NAMESPACE, 'defs'),
          clipPath =
            document.createElementNS(SL.util.svg.NAMESPACE, 'clipPath');

        clipPath.setAttribute('id', id);
        clipPath.appendChild($(shape).clone().get(0));

        defs.appendChild(clipPath);
        svgElement.appendChild(defs);

        shape.setAttribute('clip-path', 'url(#' + id + ')');
      }

      shape.setAttribute('class', 'shape-element');

      if (fillClr) {
        shape.setAttribute('fill', fillClr);
      }

      if (supportsStroke && strokeClr) {
        shape.setAttribute('stroke', strokeClr);
      }

      if (supportsStroke && strokeWidth) {
        shape.setAttribute('stroke-width', 2 * strokeWidth);
      }

      svgElement.appendChild(shape);

      var box = SL.util.svg.boundingBox(shape);

      svgElement.setAttribute(
        'viewBox', [
          Math.round(box.x) || 0,
          Math.round(box.y) || 0,
          Math.round(box.width) || 32,
          Math.round(box.height) || 32
        ].join(' '));
    }
  },

  /**
   * @function
   */
  resize: function () {
    this._super.apply(this, arguments);
    this.paint();
  },

  /**
   * @function
   */
  toggleStroke: function () {
    if (this.hasStroke()) {
      this.unset([
        'attribute.data-shape-stroke-color',
        'attribute.data-shape-stroke-width']);
    } else {
      this.set({
        'attribute.data-shape-stroke-color': '#000',
        'attribute.data-shape-stroke-width': 1
      });
    }

    this.paint();
  },

  /**
   * @function
   * @returns {*|boolean}
   */
  hasStroke: function () {
    return this.isset('attribute.data-shape-stroke-color') || this.isset('attribute.data-shape-stroke-width');
  },

  /**
   * @function
   * @param {*|jQuery|HTMLElement} shape
   * @returns {*|jQuery}
   */
  supportsStroke: function (shape) {
    return $(shape || this.getSVGShapeElement()).is('rect, circle, ellipse, polygon');
  },

  /**
   * @function
   * @returns {*|HTMLElement|SVG}
   */
  getSVGElement: function () {
    var svg = this.$contentElement.find('svg').get(0);

    if (!svg) {
      svg = document.createElementNS(SL.util.svg.NAMESPACE, 'svg');
      svg.setAttribute('xmlns', SL.util.svg.NAMESPACE);
      svg.setAttribute('version', '1.1');

      this.$contentElement.append(svg);
    }

    return svg;
  },

  /**
   * @function
   * @returns {*|jQuery|HTMLElement}
   */
  getSVGShapeElement: function () {
    return $(this.getSVGElement().querySelector('.shape-element'));
  },

  /**
   * @function
   * @returns {Array.<*>}
   */
  getToolbarOptions: function () {
    return [
      SL.editor.components.toolbars.options.ShapeType,
      SL.editor.components.toolbars.options.ShapeStretch,
      SL.editor.components.toolbars.options.ShapeFillColor,
      SL.editor.components.toolbars.options.Divider,
      SL.editor.components.toolbars.options.Opacity,
      SL.editor.components.toolbars.options.Divider,
      SL.editor.components.toolbars.groups.BorderSVG,
      SL.editor.components.toolbars.groups.Link
    ].concat(this._super());
  },

  /**
   * @function
   */
  onPropertyChanged: function () {
    this.paint();
  }
});

/**
 * @function
 * @param {String} type
 * @param {Number} width
 * @param {Number} height
 * @returns {*|HTMLElement|SVG}
 */
SL.editor.blocks.Shape.shapeFromType = function (type, width, height) {
  width  = width || 32;
  height = height || 32;

  if (/^symbol\-/.test(type)) {
    return SL.util.svg.symbol(type.replace(/^symbol\-/, ''));
  } else if (type === 'rect') {
    return SL.util.svg.rect(width, height);
  } else if (type === 'circle') {
    return SL.util.svg.ellipse(width, height);
  } else if (type === 'diamond') {
    return SL.util.svg.polygon(width, height, 4);
  } else if (type === 'octagon') {
    return SL.util.svg.polygon(width, height, 8);
  } else if (type === 'triangle-up') {
    return SL.util.svg.triangleUp(width, height);
  } else if (type === 'triangle-down') {
    return SL.util.svg.triangleDown(width, height);
  } else if (type === 'triangle-left') {
    return SL.util.svg.triangleLeft(width, height);
  } else if (type === 'triangle-right') {
    return SL.util.svg.triangleRight(width, height);
  } else if (type === 'arrow-up') {
    return SL.util.svg.arrowUp(width, height);
  } else if (type === 'arrow-down') {
    return SL.util.svg.arrowDown(width, height);
  } else if (type === 'arrow-left') {
    return SL.util.svg.arrowLeft(width, height);
  } else if (type === 'arrow-right') {
    return SL.util.svg.arrowRight(width, height);
  } else {
    return null;
  }
};


/*!
 * project name: SlideStudio
 * name:         snippet.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/18
 */

'use strict';

SL('editor.blocks').Snippet = SL.editor.blocks.Base.extend({
  /**
   * Constructor SL.editor.blocks.Snippet Instance
   *
   * @function
   * @param {Object} options
   */
  init: function (options) {
    this._super('snippet', $.extend({}, options));
    this.plug(SL.editor.blocks.plugin.HTML);
  },

  /**
   * @function
   */
  bind: function () {
    this._super();

    this.onEditingKeyUp   = this.onEditingKeyUp.bind(this);
    this.onEditingKeyDown = this.onEditingKeyDown.bind(this);
    this.onEditingInput   = this.onEditingInput.bind(this);

    this.propertyChanged.add(this.onPropertyChanged.bind(this));
  },

  /**
   * @function
   */
  blur: function () {
    this._super();
    this.disableEditing();
  },

  /**
   * @function
   */
  setDefaults: function () {
    this._super();
    this.resize({
      width:  SL.editor.blocks.Snippet.DEFAULT_WIDTH,
      height: SL.editor.blocks.Snippet.DEFAULT_HEIGHT
    });
  },

  /**
   * @function
   */
  resizeToFitContent: function () {
    this.$domElement.css('width', 'auto');

    var width =
      Math.min(
        this.$domElement.outerWidth(),
        SL.view.getSlideSize().width);

    if (width === 0 || isNaN(width)) {
      width = SL.editor.blocks.Snippet.DEFAULT_WIDTH;
    }

    this.$domElement.css('width', width);
    this.$domElement.css('height', 'auto');

    var height =
      Math.min(
        this.$domElement.outerHeight(),
        SL.view.getSlideSize().height);

    if (height === 0 || isNaN(height)) {
      height = SL.editor.blocks.Snippet.DEFAULT_HEIGHT;
    }

    this.$domElement.css('height', height);
  },

  /**
   * @function
   * @returns {Array.<*>}
   */
  getToolbarOptions: function () {
    return [
      SL.editor.components.toolbars.options.TextAlign,
      SL.editor.components.toolbars.options.TextSize,
      SL.editor.components.toolbars.options.LetterSpacing,
      SL.editor.components.toolbars.options.Divider,
      SL.editor.components.toolbars.options.TextColor,
      SL.editor.components.toolbars.options.BackgroundColor,
      SL.editor.components.toolbars.options.Opacity,
      SL.editor.components.toolbars.options.Padding,
      SL.editor.components.toolbars.options.Divider,
      SL.editor.components.toolbars.groups.BorderCSS
    ].concat(this._super());
  },

  /**
   * @function
   */
  enableEditing: function () {
    if (!this.isEditingText()) {
      this.$contentElement.attr('contenteditable', '');
      this.$domElement.addClass('is-editing');

      this.$contentElement.on('keyup', this.onEditingKeyUp);
      this.$contentElement.on('keydown', this.onEditingKeyDown);
      this.$contentElement.on('input', this.onEditingInput);

      this.editor = window.CKEDITOR.inline(this.$contentElement.get(0), {
        allowedContent: true
      });
      this.editor.on('instanceReady', (function () {
        this.editor.focus();

        var range = this.editor.createRange();

        range.moveToElementEditEnd(this.editor.editable());
        range.select();
      }).bind(this));
    }

  },

  /**
   * @function
   */
  disableEditing: function () {
    this.$contentElement.removeAttr('contenteditable').blur();
    this.$domElement.removeClass('is-editing');

    this.$contentElement.off('keyup', this.onEditingKeyUp);
    this.$contentElement.off('keydown', this.onEditingKeyDown);
    this.$contentElement.off('input', this.onEditingInput);

    if (this.editor) {
      this.editor.destroy();
      this.editor = null;
    }
  },

  /**
   * @function
   * @returns {*}
   */
  isEditingText: function () {
    return this.$domElement.hasClass('is-editing');
  },

  /**
   * @function
   * @param {Event} evt
   */
  onDoubleClick: function (evt) {
    this._super(evt);

    if (SL.view.isEditing()) {
      this.enableEditing();
    }
  },

  /**
   * @function
   * @param {Event} evt
   */
  onKeyDown: function (evt) {
    this._super(evt);

    if (evt.keyCode === 13) {
      if (this.isEditingText() || SL.util.isTypingEvent(evt)) {
        if (evt.metaKey) {
          this.disableEditing();
        }
      } else {
        evt.preventDefault();
        this.enableEditing();
      }
    } else if (evt.keyCode === 27) {
      evt.preventDefault();
      this.disableEditing();
    }
  },

  /**
   * @function
   */
  onEditingKeyUp: function () {
    SL.editor.controllers.Blocks.afterBlockTextInput();
  },

  /**
   * @function
   */
  onEditingKeyDown: function () {
    SL.editor.controllers.Blocks.afterBlockTextInput();
  },

  /**
   * @function
   */
  onEditingInput: function () {
    setTimeout(function () {
      SL.editor.controllers.Blocks.afterBlockTextInput();
    }, 1);
  },

  /**
   * @function
   * @param {Array|String} property
   */
  onPropertyChanged: function (property) {
    if (property.indexOf('style.letter-spacing') !== -1) {
      if (this.isset('style.letter-spacing')) {
        this.$contentElement.attr('data-has-letter-spacing', '');
      } else {
        this.$contentElement.removeAttr('data-has-letter-spacing', '');
      }
    }
  }
});

SL.editor.blocks.Snippet.DEFAULT_WIDTH  = 300;
SL.editor.blocks.Snippet.DEFAULT_HEIGHT = 300;


/*!
 * project name: SlideStudio
 * name:         table.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/9/6
 */

'use strict';

SL('editor.blocks').Table = SL.editor.blocks.Base.extend({
  init: function (config) {
    this._super('table', $.extend({
      minWidth:         100,
      verticalResizing: false
    }, config));

    this.setupContextMenu();
  },
  setup: function () {
    this._super();

    this.tableSizeChanged   = new signals.Signal();
    this.tableHeaderChanged = new signals.Signal();

    this.properties.attribute['data-table-cols'] = {
      type:        'number',
      decimals:     0,
      minValue:     1,
      maxValue:     10,
      defaultValue: 3
    };
    this.properties.attribute['data-table-rows'] = {
      type:        'number',
      decimals:     0,
      minValue:     1,
      maxValue:     18,
      defaultValue: 3
    };
    this.properties.attribute['data-table-padding'] = {
      type:        'number',
      unit:        'px',
      decimals:     0,
      minValue:     0,
      maxValue:     30,
      defaultValue: 5
    };
    this.properties.attribute['data-table-has-header'] = {
      defaultValue: true
    };
    this.properties.attribute['data-table-border-width'] = {
      type:        'number',
      unit:        'px',
      decimals:     0,
      minValue:     0,
      maxValue:     20,
      defaultValue: 1
    };
    this.properties.attribute['data-table-border-color'] = {};
    this.repaintProperties = [
      'attribute.data-table-cols',
      'attribute.data-table-rows',
      'attribute.data-table-padding',
      'attribute.data-table-has-header',
      'attribute.data-table-border-width',
      'attribute.data-table-border-color'
    ];
  },
  setupContextMenu: function () {
    this.contextMenu = new SL.components.ContextMenu({
      anchor: this.$contentElement,
      options: [{
        label: 'Insert row above',
        callback: this.onInsertRowAbove.bind(this),
        filter: (function () {
          return this.getTableRowCount() < this.getPropertySettings('attribute.data-table-rows').maxValue;
        }).bind(this)
      }, {
        label: 'Insert row below',
        callback: this.onInsertRowBelow.bind(this),
        filter: (function () {
          return this.getTableRowCount() < this.getPropertySettings('attribute.data-table-rows').maxValue;
        }).bind(this)
      }, {
        label: 'Insert column left',
        callback: this.onInsertColLeft.bind(this),
        filter: (function () {
          return this.getTableColCount() < this.getPropertySettings('attribute.data-table-cols').maxValue;
        }).bind(this)
      }, {
        label: 'Insert column right',
        callback: this.onInsertColRight.bind(this),
        filter: (function () {
          return this.getTableColCount() < this.getPropertySettings('attribute.data-table-cols').maxValue;
        }).bind(this)
      }, {
        type : 'divider'
      }, {
        label: 'Delete row',
        callback: this.onDeleteRow.bind(this),
        filter: (function () {
          return this.getTableRowCount() > this.getPropertySettings('attribute.data-table-rows').minValue;
        }).bind(this)
      }, {
        label: 'Delete column',
        callback: this.onDeleteCol.bind(this),
        filter: (function () {
          return this.getTableColCount() > this.getPropertySettings('attribute.data-table-cols').minValue;
        }).bind(this)
      }]
    });
    this.contextMenu.shown.add(this.onContextMenuShown.bind(this));
    this.contextMenu.hidden.add(this.onContextMenuHidden.bind(this));
    this.contextMenu.destroyed.add(this.onContextMenuHidden.bind(this));
  },
  bind: function () {
    this._super();

    this.onEditingKeyUp   = this.onEditingKeyUp.bind(this);
    this.onEditingKeyDown = this.onEditingKeyDown.bind(this);
    this.onEditingInput   = this.onEditingInput.bind(this);
    this.onCellFocused    = this.onCellFocused.bind(this);
    this.onCellMouseOver  = this.onCellMouseOver.bind(this);

    this.propertyChanged.add(this.onPropertyChanged.bind(this));
  },
  blur: function () {
    this._super();
    this.disableEditing();
  },
  setDefaults: function () {
    this._super();
    this.resize({
      width:  SL.editor.blocks.Table.DEFAULT_WIDTH,
      height: SL.editor.blocks.Table.DEFAULT_HEIGHT
    });
  },
  getToolbarOptions: function () {
    return [
      SL.editor.components.toolbars.groups.TableSize,
      SL.editor.components.toolbars.options.TableHasHeader,
      SL.editor.components.toolbars.options.Divider,
      SL.editor.components.toolbars.options.TablePadding,
      SL.editor.components.toolbars.options.TableBorderWidth,
      SL.editor.components.toolbars.options.TableBorderColor,
      SL.editor.components.toolbars.options.Divider,
      SL.editor.components.toolbars.options.TextAlign,
      SL.editor.components.toolbars.options.TextSize,
      SL.editor.components.toolbars.options.TextColor,
      SL.editor.components.toolbars.options.Divider,
      SL.editor.components.toolbars.options.BackgroundColor,
      SL.editor.components.toolbars.options.Opacity
    ].concat(this._super());
  },
  getTableElement: function () {
    var $table = this.$contentElement.find('table');

    if ($table.length === 0) {
      $table = $('<table>').appendTo(this.$contentElement);
    }

    var $tbody = $table.find('tbody');

    if ($tbody.length === 0) {
      $('<tbody>').appendTo($table);
    }

    return $table;
  },
  getTableRowCount: function () {
    return this.getTableElement().find('tr').length;
  },
  getTableColCount: function () {
    return this.getTableElement().find('tr').first().find('td, th').length;
  },
  getTableBorderColor: function () {
    return this.getTableElement().find('td, th').css('border-top-color');
  },
  resize: function () {
    this._super.apply(this, arguments);
    this.paint();
  },
  paint: function () {
    this._super.apply(this, arguments);

    var $table   = this.getTableElement(),
      rows = this.get('attribute.data-table-rows'),
      cols = this.get('attribute.data-table-cols'),
      offsetRows = rows - $table.find('tr').length;

    if (offsetRows > 0) {
      for (var o = 0; o < offsetRows; o += 1) {
        $table.append('<tr></tr>');
      }
    } else if (offsetRows < 0) {
      $table.find('tr:gt(' + (rows - 1) + ')').remove();
    }

    $table.find('tr').each((function (index, element) {
      var $tr = $(element),
        offsetCols = cols - $tr.find('td, th').length;

      if (offsetCols > 0) {
        for (var r = 0; r < offsetCols; r += 1) {
          this.backfill($('<td></td>').appendTo($tr));
        }
      } else if (offsetCols < 0) {
        var col = cols - 1;
        $tr.find('td:gt(' + col + '), th:gt(' + col + ')').remove();
      }
    }).bind(this));

    if (this.get('attribute.data-table-has-header')) {
      $table.find('tr').first().find('td').changeElementType('th');
    } else {
      $table.find('tr').first().find('th').changeElementType('td');
    }

    var padding = '', borderWidth = '', borderClr = '';

    if (this.isset('attribute.data-table-padding')) {
      padding = this.get('attribute.data-table-padding');
    }

    if (this.isset('attribute.data-table-border-width')) {
      borderWidth = this.get('attribute.data-table-border-width');
    }

    if (this.isset('attribute.data-table-border-color')) {
      borderClr = this.get('attribute.data-table-border-color');
    }

    $table.find('td, th').css({
      padding:         padding,
      'border-width':  borderWidth,
      'border-color':  borderClr
    });
    $table.find('td:last-child, th:last-child').css('width', '');

    this.refreshMinWidth();
    this.paintResizeHandles();
  },
  paintResizeHandles: function () {
    var resizers = [],
      $table = this.getTableElement(),
      center = Math.floor(this.get('attribute.data-table-border-width') / 2);

    $table.find('tr').first().find('td:not(:last), th:not(:last)')
      .each((function (index, element) {
        var $content = this.$contentElement
          .find('.sl-table-column-resizer[data-column-index="' + index + '"]');

        if ($content.length === 0) {
          $content = $([
            '<div class="editing-ui sl-table-column-resizer" data-column-index="' + index + '">',
            '</div>'].join(''));
          $content.on('vmousedown', this.onResizeHandleMouseDown.bind(this));
          $content.on('dblclick', this.onResizeHandleDoubleClick.bind(this));
          $content.appendTo(this.$contentElement);
        }

        $content.css('left', element.offsetLeft + element.offsetWidth + center);
        resizers.push(index);
    }).bind(this));
    this.$contentElement.find('.sl-table-column-resizer')
      .each(function () {
        if (resizers.indexOf(parseInt(this.getAttribute('data-column-index'), 10)) === -1) {
          $(this).remove();
        }
      });
  },
  onResizeHandleMouseDown: function (evt) {
    evt.preventDefault();

    var $table = this.getTableElement(),
      $target = $(evt.currentTarget),
      index = parseInt($target.attr('data-column-index'), 10),
      $row = $table.find('td:eq(' + index + '), th:eq(' + index + ')').first(),
      offsetLeft = this.$domElement.offset().left,
      left = $row.position().left,
      minLeft = left + SL.editor.blocks.Table.MIN_COL_WIDTH,
      width = this.measure().width;

    $target.addClass('is-dragging');
    width -= this.getMinWidthFromCells($table.find('tr:first-child td:gt(' + index + '), th:gt(' + index + ')'));

    var mouseMove = (function (evt) {
        var i = index + 1,
          minWidth = Math.min(evt.clientX - offsetLeft, width);

        $table.find('td:nth-child(' + i + '), th:nth-child(' + i + ')')
          .css({
            width: Math.round(Math.max(minWidth, minLeft) - left)
          });

        this.paintResizeHandles();
      }).bind(this),
      mouseUp = (function () {
        $target.removeClass('is-dragging');
        $(document).off('vmousemove', mouseMove);
        $(document).off('vmouseup', mouseUp);
      }).bind(this);

    $(document).on('vmousemove', mouseMove);
    $(document).on('vmouseup', mouseUp)
  },
  onResizeHandleDoubleClick: function (evt) {
    var index = $(evt.currentTarget).attr('data-column-index');
    index = parseInt(index, 10);

    this.getTableElement()
      .find('td:eq(' + index + '), th:eq(' + index + ')')
      .css('width', '');
    this.paintResizeHandles();
  },
  enableEditing: function (element) {
    if (!this.isEditingText()) {
      this.$domElement.addClass('is-editing');
      this.$contentElement.on('keyup', this.onEditingKeyUp);
      this.$contentElement.on('keydown', this.onEditingKeyDown);
      this.$contentElement.on('input', this.onEditingInput);

      var $tdth = this.$contentElement.find('td, th');
      $tdth.wrapInner('<div contenteditable>');
      $tdth.find('[contenteditable]')
        .on('mouseover', this.onCellMouseOver)
        .on('focus', this.onCellFocused);

      element = element || this.$contentElement.find('td, th').first();
      this.enableEditingOfCell(element, true);
      element.find('>[contenteditable]').focus();
    }

    this.paint();
  },
  enableEditingOfCell: function ($element, enable) {
    if ($element) {
      var editContent = $element.find('>[contenteditable]').first(),
        ckeditor = editContent.data('ckeditor');

      if (!ckeditor) {
        ckeditor = CKEDITOR.inline(
          editContent.get(0), this.getEditorOptions($element));
        editContent.data('ckeditor', ckeditor);

        if (enable) {
          ckeditor.on('instanceReady', (function () {
            SL.util.selection.moveCursorToEnd(editContent.get(0))
          }).bind(this));
        }

        if (SL.editor.controllers.Capabilities.isTouchEditor()) {
          window.scrollTo(
            0,
            Math.max($element.offset().top - 100, 0));
        }
      }
    }
  },
  disableEditing: function () {
    this.$domElement.removeClass('is-editing');
    this.$contentElement.off('keyup', this.onEditingKeyUp);
    this.$contentElement.off('keydown', this.onEditingKeyDown);
    this.$contentElement.off('input', this.onEditingInput);

    this.getTableElement()
      .find('td>[contenteditable], th>[contenteditable]')
      .each(function (index, element) {
        var $element = $(element);

        if ($element.data('ckeditor')) {
          $element.data('ckeditor').destroy();
          $element.data('ckeditor', '');
        }

        element.parentNode.innerHTML = element.innerHTML;
      });

    this.$contentElement.find('td, th')
      .off('mouseover', this.onCellMouseOver)
      .off('focus', this.onCellFocused).blur();

    SL.util.selection.clear();
    this.paint();
  },
  isEditingText: function () {
    return this.$domElement.hasClass('is-editing');
  },
  enableBackfill: function () {
    this.backfillData = [];

    this.getTableElement().find('tr').each((function (j, element) {
      $(element).find('td, th').each((function (i, ele) {
        this.backfillData[i] = this.backfillData[i] || [];
        this.backfillData[i][j] = ele.innerHTML;
      }).bind(this));
    }).bind(this));
  },
  disableBackfill: function () {
    this.backfillData = null;
  },
  backfill: function ($element) {
    if (this.backfillData && this.backfillData.length) {
      var t = $element.index(),
        i = $element.parent().index();

      if (this.backfillData[t]) {
        var data = this.backfillData[t][i];

        if (data) {
          $element.html(data);
        }
      }
    }
  },
  getCellAtPoint: function (clientX, ClientY) {
    var $cell = null;

    this.$contentElement.find('td, th').each((function (index, element) {
      var rect = element.getBoundingClientRect();

      if (clientX > rect.left && clientX < rect.right &&
        ClientY > rect.top && ClientY < rect.bottom) {
        $cell = element;
      }
    }).bind(this));

    return $cell;
  },
  getRowAtPoint: function (clientX, clientY) {
    return $(this.getCellAtPoint(clientX, clientY)).parents('tr').get(0);
  },
  getEditorOptions: function ($element) {
    var offsetX = -this.get('attribute.data-table-padding'),
      offsetY   = this.get('attribute.data-table-padding'),
      options = {
      enterMode: CKEDITOR.ENTER_BR,
      autoParagraph: false,
      allowedContent: {
        'strong em u s del ins': {
          styles: 'text-align'
        }
      },
      floatSpaceDockedOffsetX: offsetX,
      floatSpaceDockedOffsetY: offsetY
    };

    if ($element.is('th')) {
      options.toolbar = [['Italic', 'Underline', 'Strike']];
    } else {
      options.toolbar = [['Bold', 'Italic', 'Underline', 'Strike']];
    }

    return options;
  },
  propagateDOMTableSize: function () {
    var rows = this.getTableElement().find('tr').length,
      cols = this.getTableElement().find('tr').first().find('td, th').length;

    this.set({
      'attribute.data-table-rows' : rows,
      'attribute.data-table-cols' : cols
    });

    this.tableSizeChanged.dispatch();
  },
  refreshMinWidth: function () {
    this.options.minWidth = this.getMinWidthFromCells(
      this.getTableElement().find('tr:first-child td, tr:first-child th'));
  },
  getMinWidthFromCells: function (cells) {
    var width = 0;

    cells.each(function () {
      if (typeof this.style.width === "string" && this.style.width.length) {
        width += parseInt(this.style.width, 10);
      } else {
        width += SL.editor.blocks.Table.MIN_COL_WIDTH;
      }
    });

    return width;
  },
  destroy: function () {
    if (this.isEditingText()) {
      this.disableEditing();
    }

    this.contextMenu.destroy();
    this.tableSizeChanged.dispose();
    this.tableSizeChanged = null;
    this.tableHeaderChanged.dispose();
    this.tableHeaderChanged = null;

    this._super();
  },
  onDoubleClick: function (evt) {
    this._super(evt);

    if (SL.view.isEditing()) {
      var $cell = this.getCellAtPoint(evt.clientX, evt.clientY);
      this.enableEditing($($cell));
    }
  },
  onCellMouseOver: function (evt) {
    var $parent = $(evt.currentTarget).parent();

    if ($parent.length) {
      this.enableEditingOfCell($parent, false);
    }
  },
  onCellFocused: function (evt) {
    var $parent = $(evt.currentTarget).parent();

    if ($parent.length) {
      var enable =
        typeof this.lastTabTime === "number" &&
        (Date.now() - this.lastTabTime) < 100;
      this.enableEditingOfCell($parent, enable);
    }
  },
  onKeyDown: function (evt) {
    this._super(evt);

    if (evt.keyCode === 13) {
      if (this.isEditingText() || SL.util.isTypingEvent(evt)) {
        if (evt.metaKey) {
          this.disableEditing();
        }
      } else {
        evt.preventDefault();
        this.enableEditing();
      }
    } else if (evt.keyCode === 27) {
      evt.preventDefault();
      this.disableEditing();
    } else if (evt.keyCode === 9) {
      this.lastTabTime = Date.now();
    }
  },
  onEditingKeyUp: function () {
    SL.editor.controllers.Blocks.afterBlockTextInput();
  },
  onEditingKeyDown: function () {
    SL.editor.controllers.Blocks.afterBlockTextInput();
  },
  onEditingInput: function () {
    setTimeout(function () {
      SL.editor.controllers.Blocks.afterBlockTextInput();
    }, 1);
  },
  onPropertyChanged: function (properties) {
    var pros = properties.some((function (pro) {
      return this.repaintProperties.indexOf(pro) !== -1;
    }).bind(this));

    if (pros) {
      this.paint();
    }

    if (properties.indexOf('style.color') !== -1) {
      var content = this.$contentElement.get(0);

      content.style.display = 'none';
      content.offsetHeight  = '';
      content.style.display = '';
    }

    if (properties.indexOf('attribute.data-table-has-header') !== -1) {
      this.tableHeaderChanged.dispatch();
    }
  },
  onContextMenuShown: function (evt) {
    var $cell = $(this.getCellAtPoint(evt.clientX, evt.clientY));

    if ($cell.length) {
      $cell.addClass('context-menu-is-open');

      if (this.isEditingText()) {
        this.disableEditing();
      }
    }
  },
  onContextMenuHidden: function () {
    this.getTableElement().find('.context-menu-is-open')
      .removeClass('context-menu-is-open');
  },
  onInsertRowAbove: function (evt) {
    var $row = $(this.getRowAtPoint(evt.clientX, evt.clientY));

    if ($row.length) {
      var $newRow = $row.clone();
      $newRow.children().empty();

      if ($row.index() === 0) {
        $row.find('th').changeElementType('td');
        $newRow.find('td').changeElementType('th');
      }

      $row.before($newRow);
      this.propagateDOMTableSize();
    }
  },
  onInsertRowBelow: function (evt) {
    var $row = $(this.getRowAtPoint(evt.clientX, evt.clientY));

    if ($row.length) {
      $row.after('<tr>');
      this.propagateDOMTableSize();
    }
  },
  onDeleteRow: function (evt) {
    var $row = $(this.getRowAtPoint(evt.clientX, evt.clientY));

    if ($row.length) {
      $row.remove();
      this.propagateDOMTableSize();
    }
  },
  onInsertColLeft: function (evt) {
    var $cell = $(this.getCellAtPoint(evt.clientX, evt.clientY));

    if ($cell.length) {
      var index = $cell.index();

      if (index !== -1) {
        this.getTableElement().find('td:nth-child(' + (index + 1) + ')')
          .before('<td>');
        this.getTableElement().find('th:nth-child(' + (index + 1) + ')')
          .before('<th>');
        this.propagateDOMTableSize();
      }
    }
  },
  onInsertColRight: function (evt) {
    var $cell = $(this.getCellAtPoint(evt.clientX, evt.clientY));

    if ($cell.length) {
      var index = $cell.index();

      if (index !== -1) {
        this.getTableElement().find('td:nth-child(' + (index + 1) + ')')
          .after('<td>');
        this.getTableElement().find('th:nth-child(' + (index + 1) + ')')
          .after('<th>');
        this.propagateDOMTableSize();
      }
    }
  },
  onDeleteCol: function (evt) {
    var $cell = $(this.getCellAtPoint(evt.clientX, evt.clientY));

    if ($cell.length) {
      var index = $cell.index();

      if (index !== -1) {
        this.getTableElement()
          .find('td:nth-child(' + (index + 1) + '), th:nth-child(' + (index + 1) + ')')
          .remove();
        this.propagateDOMTableSize();
      }
    }
  }
});

SL.editor.blocks.Table.DEFAULT_WIDTH  = 800;
SL.editor.blocks.Table.DEFAULT_HEIGHT = 400;
SL.editor.blocks.Table.MIN_COL_WIDTH  = 40;


/*!
 * project name: SlideStudio
 * name:         text.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/18
 */

'use strict';

SL('editor.blocks').Text = SL.editor.blocks.Base.extend({
  /**
   * Constructor SL.editor.blocks.Snippet Instance
   *
   * @function
   * @param {Object} options
   */
  init: function (options) {
    this._super('text', $.extend({
      verticalResizing:  false,
      placeholderTag:   'p',
      placeholderText:  'Text'
    }, options));

    this.plug(SL.editor.blocks.plugin.HTML);
    this.readDefaultContent();
    this.injectDefaultContent();
  },

  /**
   * @function
   */
  bind: function () {
    this._super();

    this.onEditingKeyUp    = this.onEditingKeyUp.bind(this);
    this.onEditingKeyDown  = this.onEditingKeyDown.bind(this);
    this.onEditingInput    = this.onEditingInput.bind(this);
    this.onEditingFocusOut = this.onEditingFocusOut.bind(this);

    this.propertyChanged.add(this.onPropertyChanged.bind(this));
  },

  /**
   * @function
   */
  blur: function () {
    this._super();

    if (this.isEditingText()) {
      this.disableEditing();
    }
  },

  /**
   * @function
   */
  setDefaults: function () {
    this._super();
    this.resize({width: SL.editor.blocks.Text.DEFAULT_WIDTH});
  },

  /**
   * @function
   */
  readDefaultContent: function () {
    if (this.$contentElement.attr('data-placeholder-tag')) {
      this.options.placeholderTag =
        this.$contentElement.attr('data-placeholder-tag');
    } else {
      this.$contentElement.attr(
        'data-placeholder-tag', this.options.placeholderTag);
    }

    if (this.$contentElement.attr('data-placeholder-text')) {
      this.options.placeholderText =
        this.$contentElement.attr('data-placeholder-text');
    } else {
      this.$contentElement.attr(
        'data-placeholder-text', this.options.placeholderText);
    }
  },

  /**
   * @function
   */
  injectDefaultContent: function () {
    var content = this.getDefaultContent();

    if (this.$contentElement.text().trim() === '' && content) {
      if (!(this.hasPlugin(SL.editor.blocks.plugin.HTML) &&
        this.hasCustomHTML())) {
        this.$contentElement.html(content);
      }
    }
  },

  /**
   * @function
   */
  clearDefaultContent: function () {
    if (this.$contentElement.html().trim() === this.getDefaultContent()) {
      this.$contentElement.html(this.getDefaultContent(true));
    }
  },

  /**
   * @function
   * @param {boolean} excludeText
   * @returns {*|String}
   */
  getDefaultContent: function (excludeText) {
    if (this.options.placeholderTag && this.options.placeholderText) {
      if (excludeText) {
        return [
          '<',
            this.options.placeholderTag,
          '>&nbsp;</',
            this.options.placeholderTag,
          '>'].join('');
      } else {
        return [
          '<',
            this.options.placeholderTag,
          '>',
            this.options.placeholderText,
          '</',
            this.options.placeholderTag,
          '>'].join('');
      }
    } else {
      return '';
    }
  },

  /**
   * @function
   */
  externalizeLinks: function () {
    SL.util.openLinksInTabs(this.$contentElement);
  },

  /**
   * @function
   */
  resize: function () {
    this._super.apply(this, arguments);

    this.syncPairs();
    this.syncOverflow();
  },

  /**
   * @function
   * @returns {Array.<*>}
   */
  getToolbarOptions: function () {
    return [
      SL.editor.components.toolbars.options.TextAlign,
      SL.editor.components.toolbars.options.TextSize,
      SL.editor.components.toolbars.options.LetterSpacing,
      SL.editor.components.toolbars.options.Divider,
      SL.editor.components.toolbars.options.TextColor,
      SL.editor.components.toolbars.options.BackgroundColor,
      SL.editor.components.toolbars.options.Opacity,
      SL.editor.components.toolbars.options.Padding,
      SL.editor.components.toolbars.options.Divider,
      SL.editor.components.toolbars.groups.BorderCSS
    ].concat(this._super());
  },

  /**
   * @function
   */
  focus: function () {
    this._super();

    SL.editor.controllers.Blocks.discoverBlockPairs();
    this.syncOverflow();
  },

  /**
   * @function
   */
  enableEditing: function () {
    if (!this.isEditingText()) {
      this.$contentElement.attr('contenteditable', '');
      this.$domElement.addClass('is-editing');

      this.$contentElement.on('keyup', this.onEditingKeyUp);
      this.$contentElement.on('keydown', this.onEditingKeyDown);
      this.$contentElement.on('input', this.onEditingInput);
      this.$contentElement.on('focusout', this.onEditingFocusOut);

      this.clearDefaultContent();

      var options = {};

      if (SL.editor.controllers.Capabilities.isTouchEditor()) {
        this.$contentElement.focus();

        options.toolbar = [
          ['Format'],
          ['NumberedList', 'BulletedList', '-', 'Blockquote']
        ];

        window.scrollTo(
          0, Math.max(this.$contentElement.offset().top - 60, 0));
      }

      if (this.hasPlugin(SL.editor.blocks.plugin.HTML) && this.hasCustomHTML()) {
        options.allowedContent = true;
      }

      options.contentsLangDirection = SLConfig.deck.rtl === true ? 'rtl' : 'ui';

      var theme = SL.view.getCurrentTheme();

      if (theme && theme.hasPalette()) {
        var palette = theme.get('palette');

        palette = palette.join(',');
        palette = palette.replace(/#/g, '');
        options.colorButton_colors = palette;
      }

      this.editor = window.CKEDITOR.inline(this.$contentElement.get(0), options);
      this.editor.on('instanceReady', (function () {
        this.$contentElement.html(this.$contentElement.html().trim());
        this.editor.focus();

        var range = this.editor.createRange();
        range.moveToElementEditEnd(this.editor.editable());
        range.select();
      }).bind(this));
    }
  },

  /**
   * @function
   */
  disableEditing: function () {
    this.$contentElement.removeAttr('contenteditable').blur();
    this.$domElement.removeClass('is-editing');

    this.$contentElement.off('keyup', this.onEditingKeyUp);
    this.$contentElement.off('keydown', this.onEditingKeyDown);
    this.$contentElement.off('input', this.onEditingInput);
    this.$contentElement.off('focusout', this.onEditingFocusOut);

    this.externalizeLinks();
    this.injectDefaultContent();

    if (this.editor) {
      this.editor.destroy();
      this.editor = null;
    }
  },

  /**
   * @function
   */
  syncPairs: function () {
    if (!this.destroyed) {
      var measure = this.measure();

      this.pairings.forEach(function (pairing) {
        if (pairing.direction === 'bottom') {
          pairing.block.move(null, measure.bottom);
        }
      });

      this._super();
    }
  },

  /**
   * @function
   */
  syncOverflow: function () {
    this.$domElement.toggleClass(
      'is-text-overflowing',
      this.$contentElement.prop('scrollHeight') > SL.view.getSlideSize().height);
  },

  /**
   * @function
   * @returns {*|boolean}
   */
  isEditingText: function () {
    return this.$domElement.hasClass('is-editing');
  },

  /**
   * @function
   * @param {Event} evt
   */
  onDoubleClick: function (evt) {
    this._super(evt);

    if (SL.view.isEditing()) {
      this.enableEditing();
    }
  },

  /**
   * @function
   * @param {Event} evt
   */
  onKeyDown: function (evt) {
    this._super(evt);

    if (evt.keyCode === 13) {
      if (this.isEditingText() || SL.util.isTypingEvent(evt)) {
        if (evt.metaKey) {
          this.disableEditing();
        }
      } else {
        evt.preventDefault();
        this.enableEditing();
      }
    } else if (evt.keyCode === 27) {
      evt.preventDefault();
      this.disableEditing();
    }
  },

  /**
   * @function
   */
  onEditingKeyUp: function () {
    this.syncPairs();
    this.syncOverflow();

    SL.editor.controllers.Blocks.afterBlockTextInput();
  },

  /**
   * @function
   */
  onEditingKeyDown: function () {
    SL.editor.controllers.Blocks.afterBlockTextInput();
  },

  /**
   * @function
   */
  onEditingInput: function () {
    setTimeout(function () {
      SL.editor.controllers.Blocks.afterBlockTextInput();
    }, 1);
  },

  /**
   * @function
   */
  onEditingFocusOut: function () {
    if (SL.editor.controllers.Capabilities.isTouchEditor()) {
      setTimeout((function () {
        if (this.isEditingText() &&
          $(document.activeElement).closest('.cke').length === 0) {
          this.disableEditing();
        }
      }).bind(this), 1);
    }
  },

  /**
   * @function
   */
  onPropertyChanged: function (property) {
    if (property.indexOf('style.letter-spacing') !== -1) {
      if (this.isset('style.letter-spacing')) {
        this.$contentElement.attr('data-has-letter-spacing', '');
      } else {
        this.$contentElement.removeAttr('data-has-letter-spacing', '');
      }
    }

    this.syncPairs();
    this.syncOverflow();
  }
});

SL.editor.blocks.Text.DEFAULT_WIDTH = 600;

/*!
 * project name: SlideStudio
 * name:         medialibrary.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/18
 */

'use strict';

SL('editor.components.medialibrary').Filters          = Class.extend({
  /**
   * Constructor SL.editor.components.medialibrary.Filters Instance
   *
   * @function
   * @param {Object} media
   * @param {Array}  tags
   * @param {Object} options
   */
  init: function (media, tags, options) {
    this.options = $.extend({editable: true}, options);
    this.media   = media;

    this.media.changed.add(this.onMediaChanged.bind(this));

    this.tags = tags;
    this.tags.changed.add(this.onTagsChanged.bind(this));
    this.tags.associationChanged.add(this.onTagAssociationChanged.bind(this));

    this.filterChanged = new signals.Signal();

    this.onSearchInput = $.throttle(this.onSearchInput, 300);

    this.render();
    this.recount();
    this.selectDefaultFilter(true);
  },

  /**
   * @function
   */
  render: function () {
    this.$domElement    = $('<div class="media-library-filters">');
    this.$innerElement  =
      $('<div class="media-library-filters-inner">').appendTo(this.$domElement);
    this.$scrollElement = this.$innerElement;

    this.$fileType =
      $('<div class="media-library-filter-types">').appendTo(this.$innerElement);

    this.renderSearch();
    this.renderTypes();

    this.renderTags();
  },

  /**
   * @function
   */
  renderTypes: function () {
    //切片库判断
    if (this.media.crud.section) {
      this.renderType(SL.models.Media.IMAGE.id, function () {
        return true;
      }, SL.locale.get('MediaLibrary.filter.all_section'), 'All Images');
    }
    else {
      this.renderType(SL.models.Media.All.id, function () {
        return true;
      }, SL.locale.get('MediaLibrary.filter.all'), 'All Images');

      this.$fileType =
        $('<div class="media-library-filter-types">').appendTo(this.$innerElement);

      this.renderFileType(SL.models.Media.IMAGE.id, function () {
        return true;
      }, SL.locale.get('MediaLibrary.filter.image'), 'Images');
      this.renderFileType(SL.models.Media.VIDEO.id, function () {
        return true;
      }, SL.locale.get('MediaLibrary.filter.video'), 'Video');
    }
  },

  renderFileType: function (id, filter, label, exclusiveLabel){
    var $fileType = $([
      '<div class="media-library-filter media-library-type-filter media-type">',
        '<span class="label">'+ label +'</span>',
        '<span class="count"></span>',
      '</div>'].join(''));

    $fileType.attr({
      'data-id':              id,
      'data-label':           label,
      'data-exclusive-label': exclusiveLabel
    });

    $fileType.data('filter', function (media){
      var type = media.data.content_type.slice(0, 5);
      if ( type == id) {
        return true;
      }
    });
    $fileType.on('vclick', this.onFilterClicked.bind(this));
    $fileType.appendTo(this.$fileType);

    return $fileType;
  },

  /**
   * @function
   * @param {String|Number|*} id
   * @param {Function}        filter
   * @param {String}          label
   * @param {String}          exclusiveLabel
   * @returns {*|jQuery|HTMLElement}
   */
  renderType: function (id, filter, label, exclusiveLabel) {
    var $type = $([
      '<div class="media-library-filter media-library-type-filter">',
        '<span class="label">' + label + '</span>',
        '<span class="count"></span>',
      '</div>'].join(''));

    $type.attr({
      'data-id':              id,
      'data-label':           label,
      'data-exclusive-label': exclusiveLabel
    });
    $type.on('vclick', this.onFilterClicked.bind(this));
    $type.data('filter', filter);
    $type.appendTo(this.$innerElement);

    return $type;
  },

  /**
   * @function
   */
  renderTags: function () {
    this.$tagsElement = $([
      '<div class="media-library-tags media-drop-area">',
        '<div class="tags-list"></div>',
      '</div>'].join(''));
    this.$tagsElement.appendTo(this.$innerElement);
    this.$tagsList = this.$tagsElement.find('.tags-list');


    if (!this.media.crud.section && this.options.editable) {
      this.$tagsElement.append([
        '<div class="tags-create">',
          '<div class="tags-create-inner ladda-button" data-style="expand-right" data-spinner-color="#666" data-spinner-size="28">',
            SL.locale.get('MediaLibrary.filter.create_tag'),
          '</div>',
        '</div>'].join(''));

      this.$tagsElement.find('.tags-create')
        .on('vclick', this.onCreateTagClicked.bind(this));
      this.tagsCreateLoader =
        window.Ladda.create(this.$tagsElement.find('.tags-create-inner').get(0));
    }

    this.tags.forEach(this.renderTag.bind(this));
    this.sortTags();
  },

  /**
   * @function
   * @param {Object} tag
   * @returns {*|jQuery|HTMLElement}
   */
  renderTag: function (tag) {
    //如果是切片
    if( this.media.crud.section) {
      //不存在情况
      if (this.getTagElementByID(tag.get('id')).length <= 0) {

        // 存在父id
        if (this.getTagElementByID(tag.get('parentId')).length > 0) {
          var backColor = this.getTagElementByID(tag.get('parentId')).attr('style');

          var color = '';
          if (backColor == 'background:#eee') {
            color = '#E6E6E6'
          }
          else if (backColor == 'background:#E6E6E6') {
            color = '#D9D9D9'
          }
          else if (backColor == 'background:#D9D9D9') {
            color = '#CCCCCC';
          }
          var $tagFilter = $([
          '<div style="background:'+color + '" class="media-library-filter media-drop-target catalogDown" data-id="' +
            tag.get('id') + '" data-parentId="' +tag.get('parentId') + '">',
            '<div class="front">',
              '<span class="label-output">' + tag.get('displayName') + '(' + tag.get('specimenCount') + ')</span>',
              '<div class="controls-img" style="width:12px;">',
                '<img style="width:100%" src="/image/school/jtbotm.png">',
              '</div>',
            '</div>',
          '</div>'].join(''));
          this.getTagElementByID(tag.get('parentId')).after($tagFilter);
        }
        else {
          var $tagFilter = $([
          '<div style="background:#eee" class="media-library-filter media-drop-target" data-id="' +
            tag.get('id') + '" data-parentId="' +tag.get('parentId') + '">',
            '<div class="front">',
              '<span class="label-output">' + tag.get('displayName') + '(' + tag.get('specimenCount') + ')</span>',
              '<div class="controls-img" style="width:12px;">',
                '<img style="width:100%" src="/image/school/jtbotm.png">',
              '</div>',
            '</div>',
          '</div>'].join(''));
          $tagFilter.appendTo(this.$tagsList);
        }
      }
      else {
        var $tagFilter = $([
        '<div class="media-library-filter media-drop-target" data-id="' +
          tag.get('id') + '" data-parentId="' +tag.get('parentId') + '">',
          '<div class="front">',
            '<span class="label-output">' + tag.get('displayName') + '(' + tag.get('specimenCount') + ')</span>',
            '<div class="controls-img" style="width:12px;">',
              '<img style="width:100%" src="/image/school/jtbotm.png">',
            '</div>',
          '</div>',
        '</div>'].join(''));
        $tagFilter.appendTo(this.$tagsList);
      }

      $tagFilter.on('vclick', this.onTagClicked.bind(this));
      $tagFilter.data({
        model:  tag,
        filter: tag.createFilter()
      });

      return $tagFilter;
    }
    else {
      var $tagFilter = $([
        '<div class="media-library-filter media-drop-target" data-id="' +
          tag.get('id') + '">',
          '<div class="front">',
            '<span class="label-output">' + tag.get('name') + '</span>',
            '<div class="controls-out">',
              '<span class="count"></span>',
            '</div>',
          '</div>',
        '</div>'].join(''));
      $tagFilter.on('vclick', this.onTagClicked.bind(this));
      $tagFilter.data({
        model:  tag,
        filter: tag.createFilter()
      });

      if (this.options.editable) {
        $tagFilter.find('.front').append([
          '<div class="controls-over">',
            '<span class="controls-button edit-button">',
              SL.locale.get('Edit'),
            '</span>',
          '</div>'].join(''));
        $tagFilter.append([
          '<div class="back">',
            '<input class="label-input" value="' + tag.get('name') + '" type="text">',
            '<div class="controls">',
              '<span class="controls-button delete-button negative icon i-trash-stroke"></span>',
              '<span class="controls-button save-button">',
                SL.locale.get('Save'),
              '</span>',
            '</div>',
          '</div>'].join(''));

        $tagFilter.data('dropReceiver', (function (data) {
          this.tags.addTagTo(tag, data);
        }).bind(this));
      } else {
        $tagFilter.find('.controls-out')
          .removeClass('controls-out').addClass('controls-permanent');
      }

      $tagFilter.appendTo(this.$tagsList);
      return $tagFilter;
    }
  },

  /**
   * @function
   */
  renderSearch: function () {
    this.$searchElement = $([
      '<div class="media-library-filter media-library-search-filter" data-id="search">',
        '<input class="search-input" type="text" placeholder="Search..." maxlength="50" />',
      '</div>'].join(''));
    this.$searchElement.on('vclick', this.onSearchClicked.bind(this));
    this.$searchElement.data('filter', function () {
      return false;
    });
    this.$searchElement.appendTo(this.$innerElement);

    this.$searchInput = this.$searchElement.find('.search-input');
    this.$searchInput.on('input', this.onSearchInput.bind(this));
  },

  /**
   * @function
   * @param {*|jQuery|HTMLElement} $filter
   */
  recount: function ($filter) {
    $filter = $filter || this.$domElement.find('.media-library-filter');

    $filter.each((function (index, element) {
      element = $(element);

      var $count = element.find('.count');
      if ($count.length) {
        $count.text(this.media.filter(element.data('filter')).length);
      }
    }).bind(this));
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
   * @param {String|Number|*} id
   * @param {boolean|*}       exclude
   */
  selectFilter: function (id, exclude) {
    var $filter =
      this.$domElement.find('.media-library-filter[data-id="' + id + '"]');

    this.$domElement.find('.is-selected').removeClass('is-selected');

    $filter.addClass('is-selected');

    this.selectedFilter = $filter.data('filter');
    this.selectedFilterData = {};

    if ($filter.closest(this.$tagsList).length) {
      this.selectedFilterData.type =
        SL.editor.components.medialibrary.Filters.FILTER_TYPE_TAG;
      this.selectedFilterData.tag = $filter.data('model');
      this.selectedFilterData.placeholder  = SL.locale.get('MediaLibrary.filter.filter_text');

      if (this.options.editable) {
        this.selectedFilterData.placeholder = SL.locale.get('MediaLibrary.filter.filter_edit_text');
      }
    } else {
      this.selectedFilterData.type = SL.editor.components.medialibrary.Filters.FILTER_TYPE_MEDIA;
      this.selectedFilterData.placeholder = SL.locale.get('MediaLibrary.filter.filter_type_text');
    }

    if (!exclude) {
      this.filterChanged.dispatch(this.selectedFilter, this.selectedFilterData);
    }
  },

  /**
   * @function
   * @param {boolean} exclude
   */
  selectDefaultFilter: function (exclude) {
    this.selectFilter(
      this.$domElement
        .find('.media-library-filter:not(.media-library-search-filter)')
        .first()
        .attr('data-id'),
      exclude);
  },

  /**
   * @function
   */
  showAllTypes: function () {
    this.$domElement.find('.media-library-type-filter').each(function () {
      var $this = $(this);

      $this.css('display', '');
      $this.find('.label').text($this.attr('data-label'));
    });
  },

  /**
   * @function
   * @param {String|Number|*} id
   */
  hideAllTypesExcept: function (id) {
    this.$domElement.find('.media-library-type-filter').each(function () {
      var $this = $(this);

      if ($this.attr('data-id') === id) {
        $this.css('display', '').find('.label').text($this.attr('data-exclusive-label'));
      } else {
        $this.css('display', 'none').find('.label').text($this.attr('data-label'));
      }
    });
  },

  /**
   * @function
   * @param {*|jQuery|HTMLElement} $tag
   * @param {boolean}              isScrollTop
   * @returns {boolean}
   */
  startEditingTag: function ($tag, isScrollTop) {
    if (this.$tagsList.find('.is-editing').length) {
      return false;
    }

    this.$domElement.addClass('is-editing');

    if (isScrollTop === true) {
      $tag.addClass('collapsed');
      $tag.find('.label-output').empty();

      setTimeout(function () {
        $tag.removeClass('collapsed');
      }, 1);

      this.$scrollElement.animate({
        scrollTop: $tag.prop('offsetTop') + 80 - this.$scrollElement.height()
      }, 300);
    }

    $tag.addClass('is-editing');

    var $input = $tag.find('.label-input'),
      scrollTop = this.$scrollElement.prop('scrollTop');

    $input.focus().select();
    $input.on('keydown', (function (evt) {
      if (evt.keyCode === 13) {
        evt.preventDefault();
        this.stopEditingTag($tag);
      }
    }).bind(this));

    this.$scrollElement.prop('scrollTop', scrollTop);
  },

  /**
   * @function
   * @param {*|jQuery|HTMLElement} $tag
   * @param {boolean|Object|*}     abandon
   */
  stopEditingTag: function ($tag, abandon) {
    var model = $tag.data('model'),
      $input  = $tag.find('.label-input'),
      $output = $tag.find('.label-output'),
      name    = $input.val();

    this.$domElement.removeClass('is-editing');

    if (name && !abandon) {
      model.set('name', name);
      model.save(['name']);
    }

    $output.text(model.get('name'));
    $input.off('keydown');
    setTimeout(function () {
      $tag.removeClass('is-editing');
    }, 1);
  },

  /**
   * @function
   */
  sortTags: function () {
    var tags = this.$tagsList.find('.media-library-filter').toArray();

    if (!this.media.crud.section ) {
      tags.sort(function (tagA, tagB) {
        tagA = $(tagA).data('model').get('name').toLowerCase();
        tagB = $(tagB).data('model').get('name').toLowerCase();

        if (tagB > tagA) {
          return -1;
        } else if (tagA > tagB) {
          return 1;
        } else {
          return 0;
        }
      });
    }

    tags.forEach((function (tag) {
      $(tag).appendTo(this.$tagsList);
    }).bind(this));
  },

  /**
   * @function
   * @param {String|Number|*} id
   * @returns {*|jQuery|HTMLElement}
   */
  getTagElementByID: function (id) {
    return this.$tagsList.find('.media-library-filter[data-id="' + id + '"]');
  },

  /**
   * @function
   * @param {*|jQuery|HTMLElement} $tag
   */
  confirmTagRemoval: function ($tag) {
    var model = $tag.data('model');

    SL.prompt({
      anchor: $tag.find('.delete-button'),
      title:  SL.locale.get('MediaLibrary.filter.tag_del_confirm'),
      type:  'select',
      data: [{
        html: '<h3>' + SL.locale.get('Cancel') + '</h3>'
      }, {
        html: '<h3>' + SL.locale.get('Delete') + '</h3>',
        selected: true,
        className: 'negative',
        callback: (function () {
          SL.analytics.trackEditor('Media: Delete tag');

          model.destroy().done((function () {
            this.$domElement.removeClass('is-editing');
            this.tags.remove(model);
            SL.notify(SL.locale.get('MediaLibrary.filter.tag_del_success'));
          }).bind(this)).fail((function () {
            SL.notify(SL.locale.get('MediaLibrary.filter.tag_del_err'), 'negative');
          }).bind(this));
        }).bind(this)
      }]
    });
  },

  /**
   * @function
   * @returns {{}|*}
   */
  getSelectedFilterData: function () {
    return this.selectedFilterData;
  },

  /**
   * @function
   */
  destroy: function () {
    this.filterChanged.dispose();
    this.$domElement.remove();
  },

  /**
   * @function
   */
  onMediaChanged: function () {
    this.recount(null);
  },

  /**
   * @function
   * @param {Array} orgTags
   * @param {Array} curTags
   */
  onTagsChanged: function (orgTags, curTags) {
    if (orgTags && orgTags.length) {
      orgTags.forEach((function (tag) {
        this.startEditingTag(this.renderTag(tag), true);
      }).bind(this));
    }

    if (curTags && curTags.length) {
      curTags.forEach((function (cTag) {
        var tag = this.$tagsElement.find('[data-id="' + cTag.get('id') + '"]');

        this.stopEditingTag(tag, true);
        tag.css({height: 0, padding: 0, opacity: 0});

        if (tag.hasClass('is-selected')) {
          this.selectDefaultFilter();
        }

        setTimeout(function () {
          tag.remove();
        }, 300);
      }).bind(this));
    }
  },

  /**
   * @function
   * @param {Object} tag
   */
  onTagAssociationChanged: function (tag) {
    this.recount(this.getTagElementByID(tag.get('id')));
  },

  /**
   * @function
   * @param {Event} evt
   */
  onFilterClicked: function (evt) {
    this.selectFilter($(evt.currentTarget).attr('data-id'), null);
  },

  /**
   * @function
   */
  onCreateTagClicked: function () {
    this.tagsCreateLoader.start();

    this.tags.create(null, {
      success: (function (data) {
        this.recount(this.getTagElementByID(data.get('id')));
        this.tagsCreateLoader.stop();
      }).bind(this),
      error: (function () {
        SL.notify(SL.locale.get('Generic_Error'), 'negative');
        this.tagsCreateLoader.stop();
      }).bind(this)
    });

    SL.analytics.trackEditor('Media: Create tag');
  },

  /**
   * @function
   * @param {Event} evt
   */
  onTagClicked: function (evt) {

    var $target = $(evt.target),
      $tags = $target.closest('.media-library-filter');

    if ($tags.length) {
      if ($target.closest('.edit-button').length) {
        this.startEditingTag($tags, false);
      } else if ($target.closest('.save-button').length) {
        this.stopEditingTag($tags, false);
      } else if ($target.closest('.delete-button').length) {
        this.confirmTagRemoval($tags);
      } else if (!$tags.hasClass('is-editing')) {
        this.onFilterClicked(evt);
      }
    }

    if (this.media.crud.section) {
      var catalosShow = $('.media-library-filter[data-parentId= '+ $tags.attr("data-id") +']');
      $('.media-library-filter').removeClass('current');
      
      if ($tags.hasClass('showed')) {
        catalosShow.hide();
        $tags.removeClass('showed');

        var tagsId = $tags.attr('data-id');
        //将第三层隐藏
        for (var i = 0; i < $('.showed'+ tagsId).length; i++ ) {
          var id2 =  $('.showed'+ tagsId).eq(i).attr('data-id');//获取第二层id
          $('.media-library-filter[data-id=' + id2 + ']').removeClass('showed')
          $('.showed' + id2).hide();
          //将第四层隐藏
          for (var j = 0; j < $('.showed' + id2).length; j++) {
            var id3 = $('.showed' + id2).eq(j).attr('data-id');//获取第三层id
            $('.media-library-filter[data-id=' + id3 + ']').removeClass('showed')
            $('.showed' + id3).hide();
          }
        }
      }
      else {
        var siblingsId = $tags.attr('data-parentId');
          
        var siblingsDom =  $('.media-library-filter[data-parentId= '+ siblingsId+']');
        siblingsDom.removeClass('showed');
        for(var i=0; i<siblingsDom.length; i++ ) {
          $('.media-library-filter[data-parentId= '+ $(siblingsDom[i]).attr('data-id') +']').hide();
        }
       
        catalosShow.show();
        $tags.addClass('showed');
        $tags.addClass('current');
        var tagsId = $tags.attr('data-id');
        //将第二层隐藏    
        catalosShow.addClass('showed'+ $tags.attr('data-id'));
      }
    }

  },

  /**
   * @function
   */
  onSearchClicked: function () {
    this.selectFilter(this.$searchElement.attr('data-id'), true);
    this.$searchInput.focus();
    this.onSearchInput();

    SL.analytics.trackEditor('Media: Search clicked');
  },

  /**
   * @function
   */
  onSearchInput: function () {
    var val = this.$searchInput.val();

    this.selectedFilter = this.media.createSearchFilter(val);
    this.selectedFilterData = {
      type: SL.editor.components.medialibrary.Filters.FILTER_TYPE_SEARCH,
      placeholder: 'Please enter a search term'
    };
    this.$searchElement.data('filter', this.selectedFilter);

    if (val.length > 0) {
      this.selectedFilterData.placeholder = 'No results for "' + val + '"';
    }

    this.filterChanged.dispatch(this.selectedFilter, this.selectedFilterData);
  }
});

SL.editor.components.medialibrary.Filters.FILTER_TYPE_MEDIA  = "media";
SL.editor.components.medialibrary.Filters.FILTER_TYPE_TAG    = "tag";
SL.editor.components.medialibrary.Filters.FILTER_TYPE_SEARCH = "search";

SL('editor.components.medialibrary').ListDrag         = Class.extend({
  /**
   * Constructor SL.editor.components.medialibrary.ListDrag Instance
   *
   * @function
   */
  init: function () {
    this.items = [];

    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp   = this.onMouseUp.bind(this);
  },

  /**
   * @function
   */
  reset: function () {
    this.items = [];

    if (this.$ghostElement) {
      this.$ghostElement.remove();
    }

    this.$currentDropTarget = null;

    $('.media-drop-target').removeClass('drag-over');
    $('.media-drop-area').removeClass('media-drop-area-active');

    $(document).off('vmousemove', this.onMouseMove);
    $(document).off('vmouseup', this.onMouseUp);
  },

  /**
   * @function
   * @param {Event}                evt
   * @param {*|jQuery|HTMLElement} parent
   * @param {Array}                items
   */
  startDrag: function (evt, parent, items) {
    this.items = items;

    var offset = parent.offset();

    this.ghostOffset = {
      x: offset.left - evt.clientX,
      y: offset.top - evt.clientY
    };

    this.ghostWidth  = parent.width();
    this.ghostHeight = parent.height();

    this.$ghostElement = $('<div class="media-library-drag-ghost">');
    this.$ghostElement.css({
      border:             parent.css('border'),
      backgroundImage:    parent.css('background-image'),
      backgroundSize:     parent.css('background-size'),
      backgroundPosition: parent.css('background-position'),
      width:              this.ghostWidth,
      height:             this.ghostHeight,
      marginLeft:         this.ghostOffset.x,
      marginTop:          this.ghostOffset.y
    });
    this.$ghostElement.appendTo(document.body);

    if (items.length > 1) {
      this.$ghostElement.append('<span class="count">' + items.length + '</span>');
      this.$ghostElement.attr('data-depth', Math.min(items.length, 3));
    }

    this.$dropTargets = $('.media-drop-target');
    $('.media-drop-area').addClass('media-drop-area-active');

    $(document).on('vmousemove', this.onMouseMove);
    $(document).on('vmouseup', this.onMouseUp);
  },

  /**
   * @function
   */
  stopDrag: function () {
    this.reset();
  },

  /**
   * @function
   * @param {Event} evt
   */
  onMouseMove: function (evt) {
    evt.preventDefault();

    var clientX = evt.clientX, clientY = evt.clientY,
      transform = 'translate(' + clientX + 'px,' + clientY + 'px)';

    this.$ghostElement.css({
      webkitTransform: transform,
      transform:       transform
    });
    this.$currentDropTarget = null;
    this.$dropTargets.each((function (index, dropTarget) {
      var target = $(dropTarget);
      var rect = dropTarget.getBoundingClientRect();

      if (clientX > rect.left && clientX < rect.right &&
        clientY > rect.top && clientY < rect.bottom) {
        target.addClass('drag-over');
        this.$currentDropTarget = target;
      } else {
        target.removeClass('drag-over');
      }
    }).bind(this));
  },

  /**
   * @function
   * @param {Event} evt
   */
  onMouseUp: function (evt) {
    evt.preventDefault();

    if (this.$currentDropTarget) {
      this.$currentDropTarget.data('dropReceiver').call(null, this.items);

      SL.analytics.trackEditor('Media: Drop items on tag');

      var $ghostElement = this.$ghostElement,
        rect = this.$currentDropTarget.get(0).getBoundingClientRect(),
        x = rect.left + (rect.width - this.ghostWidth) / 2 - this.ghostOffset.x,
        y = rect.top + (rect.height - this.ghostHeight) / 2 - this.ghostOffset.y,
        transform = 'translate(' + x + 'px,' + y + 'px) scale(0.2)';

      $ghostElement.css({
        webkitTransition: 'all 0.2s ease',
        transition:       'all 0.2s ease',
        webkitTransform:  transform,
        transform:        transform,
        opacity:          0
      });

      setTimeout(function () {
        $ghostElement.remove();
      }, 500);

      this.$ghostElement = null;
    }

    this.stopDrag();
  }
});

SL('editor.components.medialibrary').List             = Class.extend({
  /**
   * Constructor SL.editor.components.medialibrary.List Instance
   *
   * @function
   * @param {Object} media
   * @param {Array}  tags
   * @param {Object} options
   */
  init: function (media, tags, options) {
    this.options = $.extend({editable: true}, options);
    this.media   = media;

    this.media.changed.add(this.onMediaChanged.bind(this));

    this.tags = tags;
    this.tags.associationChanged.add(this.onTagAssociationChanged.bind(this));

    this.items         = [];
    this.filteredItems = [];
    this.overlayPool   = [];

    this.selectedItems = new SL.collections.Collection();

    this.itemSelected = new signals.Signal();
    this.drag         = new SL.editor.components.medialibrary.ListDrag();

    this.render();
    this.bind();
  },

  /**
   * @function
   */
  render: function () {
    this.$domElement  = $('<div class="media-library-list">');
    this.$trayElement = $([
      '<div class="media-library-tray">',
        '<div class="status"></div>',
        '<div class="button negative delete-button">',
          SL.locale.get('Delete'),
        '</div>',
        '<div class="button outline white untag-button">',
          SL.locale.get('MediaLibrary.List.btn_remove_tag'),
        '</div>',
        '<div class="button outline white clear-button">',
          SL.locale.get('MediaLibrary.List.btn_clear_select'),
        '</div>',
      '</div>'].join(''));
    this.$placeholderElement = $([
      '<div class="media-library-list-placeholder">',
        SL.locale.get('MediaLibrary.List.empty_placeholder'),
      '</div>'].join(''));

    this.media.forEach(this.addItem.bind(this));

    this.filteredItems = this.items;
  },

  /**
   * @function
   */
  bind: function () {
    this.loadItemsInView = $.debounce(this.loadItemsInView, 200);

    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp   = this.onMouseUp.bind(this);

    this.$domElement.on('scroll', this.onListScrolled.bind(this));
    this.$trayElement.find('.delete-button')
      .on('vclick', this.onDeleteSelectionClicked.bind(this));
    this.$trayElement.find('.untag-button')
      .on('vclick', this.onUntagSelectionClicked.bind(this));
    this.$trayElement.find('.clear-button')
      .on('vclick', this.onClearSelectionClicked.bind(this));


    if (SL.util.device.IS_PHONE || SL.util.device.IS_TABLET) {
      var hammer = new window.Hammer(this.$domElement.get(0));

      hammer.on('tap', this.onMouseUp);
      hammer.on('press', (function (evt) {
        var item =
          $(evt.target).closest('.media-library-list-item').data('item');

        if (item) {
          this.lastSelectedItem = item;
          this.toggleSelection(item);
        }

        evt.preventDefault();
      }).bind(this));
    } else {
      this.$domElement.on('vmousedown', this.onMouseDown.bind(this));
    }
  },

  /**
   * @function
   */
  layout: function () {
    var $item = $('.media-library-list-item').first();

    this.cellWidth   = $item.outerWidth(true);
    this.cellHeight  = $item.outerHeight(true);
    this.columnCount = Math.floor(this.$domElement.outerWidth() / this.cellWidth);
  },

  /**
   * @function
   * @param {*|jQuery|HTMLElement} parent
   */
  appendTo: function (parent) {
    this.$domElement.appendTo(parent);
    this.$trayElement.appendTo(parent);
    this.$placeholderElement.appendTo(parent);

    this.layout();
    this.loadItemsInView();
  },

  /**
   * @function
   * @param {Object}  model
   * @param {boolean} isFirst
   * @param {boolean} isShow
   */
  addItem: function (model, isFirst, isShow) {

    var $item = $('<div class="media-library-list-item"></div>');
    var itemData = {
      model:       model,
      element:     $item,
      elementNode: $item.get(0),
      selected:    false,
      visible:     true
    };

    $item.data('item', itemData);

    if (isFirst === true) {
      $item.prependTo(this.$domElement);
      this.items.unshift(itemData);
    } else {
      $item.appendTo(this.$domElement);
      this.items.push(itemData);
    }

    if (isShow === true) {
      $item.addClass('has-intro hidden');

      setTimeout(function () {
        $item.removeClass('hidden');
      }, 1);
    }
  },

  /**
   * @function
   * @param {Object} model
   */
  removeItem: function (model) {
    for (var t = this.items.length - 1; t >= 0; t -= 1) {
      var item = this.items[t];

      if (item.model === model) {
        item.model = null;
        item.element.remove();

        this.items.splice(t, 1);
      }
    }
  },

  /**
   * @function
   * @param {Function} filter
   */
  setPrimaryFilter: function (filter) {
    this.filterA = filter;
    this.applyFilter();
  },

  /**
   * @function
   */
  clearPrimaryFilter: function () {
    this.filterA = null;
    this.applyFilter();
  },

  /**
   * @function
   * @param {Function} filterB
   * @param {Object}   filterBData
   */
  setSecondaryFilter: function (filterB, filterBData) {
    this.clearSelection();

    this.filterB     = filterB;
    this.filterBData = filterBData;

    this.applyFilter();

    this.setPlaceholderContent(filterBData.placeholder);
    this.afterSelectionChange();
  },

  /**
   * @function
   */
  clearSecondaryFilter: function () {
    this.filterB     = null;
    this.filterBData = null;

    this.applyFilter();
    this.setPlaceholderContent('Empty');
  },

  /**
   * @function
   */
  applyFilter: function () {
    this.filteredItems = [];

    for (var e = 0; e < this.items.length; e += 1) {
      var item = this.items[e];

      if (this.filterA && !this.filterA(item.model) ||
        this.filterB && !this.filterB(item.model)) {
        item.elementNode.style.display = 'none';
        item.visible = false;
        this.detachOverlay(item);
      } else {
        this.filteredItems.push(item);
        item.visible = true;
        item.elementNode.style.display = '';
      }
    }

    this.$domElement.scrollTop(0);
    this.loadItemsInView();
    this.$placeholderElement.toggleClass('visible', this.filteredItems.length === 0);
  },

  /**
   * @function
   */
  loadItemsInView: function () {

    if (this.filteredItems.length && !this.media.crud.section) {
      var offset    = 100,
        scrollTop   = this.$domElement.scrollTop(),
        outerHeight = this.$domElement.outerHeight();

      for (var r = 0; r < this.filteredItems.length; r += 1) {
        var filteredItems = this.filteredItems[r],
          perHeight = Math.floor(r / this.columnCount) * this.cellHeight;

        if (perHeight + this.cellHeight - scrollTop > -offset &&
          outerHeight + offset > perHeight - scrollTop) {
          if (!filteredItems.overlay) {
            this.attachOverlay(filteredItems);
          }

          if (!filteredItems.elementNode.hasAttribute('data-thumb-loaded')) {
            var type = filteredItems.model.get('content_type').slice(0, 5);
            filteredItems.elementNode.setAttribute('data-type', type);
            filteredItems.elementNode.style.backgroundImage =
              'url(' + filteredItems.model.get('thumb_url') + ')';
            filteredItems.elementNode.setAttribute('data-thumb-loaded', 'true');
          }
        } else if (filteredItems.overlay && !filteredItems.selected) {
          this.detachOverlay(filteredItems);
        }
      }
    }
    else if (this.filteredItems.length && this.media.crud.section) {
      var offset    = 100,
        scrollTop   = this.$domElement.scrollTop(),
        outerHeight = this.$domElement.outerHeight();

      for (var r = 0; r < this.filteredItems.length; r += 1) {
        var filteredItems = this.filteredItems[r],
          perHeight = Math.floor(r / this.columnCount) * this.cellHeight;

        if (perHeight + this.cellHeight - scrollTop > -offset &&
          outerHeight + offset > perHeight - scrollTop) {
          if (!filteredItems.overlay) {
            this.attachOverlay(filteredItems);
          }

          if (!filteredItems.elementNode.hasAttribute('data-thumb-loaded')) {
            filteredItems.elementNode.style.width = '225px';
            filteredItems.elementNode.style.height = '330px';
            filteredItems.elementNode.style.marginTop = '10px';
            filteredItems.elementNode.setAttribute('data-sectionId', filteredItems.model.get('id'));
            filteredItems.element.append('<div class ="section-top">' + filteredItems.model.get('displayName') + '</div>');

            filteredItems.element.append('<img class="section-url" src="' + filteredItems.model.get('thumb_url') + '">');

            filteredItems.element.append('<div class="section-details"><img src="/image/school/size.png">'+
              '尺寸<span>'+ filteredItems.model.get('width') + '* ' + filteredItems.model.get('height') + '</span></div>');

            filteredItems.element.append('<div class="section-details"><img src="/image/school/zoom.png">'+
              '倍数<span>' + filteredItems.model.get('zoom') + '倍</span></div>');

            filteredItems.element.append('<div class="section-details"><img src="/image/school/dyeing.png">'+
              '染色<span>' + filteredItems.model.get('dyeing') + '</span></div>');
            filteredItems.element.append('<div class="section-details"><img src="/image/school/from.png">'+
              '来源<span>' + filteredItems.model.get('from') + '</span></div>');
            filteredItems.element.append('<div class="section-details"><img src="/image/school/browserCount.png">'+
              '访问<span>' + filteredItems.model.get('browserCount') + '</span></div>');


            filteredItems.elementNode.setAttribute('data-thumb-loaded', 'true');
          }
        } else if (filteredItems.overlay && !filteredItems.selected) {
          this.detachOverlay(filteredItems);
        }
      }
    }

  },

  /**
   * @function
   * @param {boolean} content
   */
  setPlaceholderContent: function (content) {
    var text = '';

    if (this.media.isEmpty()) {
      if (this.options.editable) {
        text = SL.locale.get('MediaLibrary.List.edit_placeholder_content');
      } else {
        text = SL.locale.get('MediaLibrary.List.placeholder_content');
      }
    } else if (!content) {
      text = SL.locale.get('MediaLibrary.List.empty_placeholder');
    }

    this.$placeholderElement.html(text);
  },

  /**
   * @function
   * @param {Array} filteredItems
   * @returns {boolean}
   */
  attachOverlay: function (filteredItems) {
    if (filteredItems.overlay || !this.options.editable) {
      return false;
    } else if (!filteredItems.model.data.displayName) {
      if (this.overlayPool.length === 0) {
        this.overlayPool.push($([
          '<div class="info-overlay">',
            '<span class="info-overlay-action inline-button icon i-embed" data-tooltip="Insert SVG inline"></span>',
            '<span class="info-overlay-action label-button icon i-type"></span>',
            '<span class="info-overlay-action select-button" data-tooltip="选择">',
              '<span class="icon i-checkmark checkmark"></span>',
            '</span>',
          '</div>'].join('')));
      }

      filteredItems.overlay = this.overlayPool.pop();
      filteredItems.overlay.appendTo(filteredItems.element);

      this.refreshOverlay(filteredItems);
      return true;
    }
  },

  /**
   * @function
   * @param {Array} filteredItems
   */
  refreshOverlay: function (filteredItems) {
    if (filteredItems.overlay) {
      var tooltip = filteredItems.model.get('label');

      if (!(tooltip && tooltip !== '')) {
        tooltip = 'Label';
      }

      filteredItems.overlay.find('.label-button').attr('data-tooltip', tooltip);

      if (filteredItems.model.isSVG()) {
        filteredItems.overlay.addClass('has-inline-option');
        filteredItems.overlay.find('.inline-button')
          .toggleClass('is-on', !!filteredItems.model.get('inline'));
      } else {
        filteredItems.overlay.removeClass('has-inline-option');
      }
    }
  },

  /**
   * @function
   * @param {Array} filteredItems
   */
  detachOverlay: function (filteredItems) {
    if (filteredItems && filteredItems.overlay) {
      this.overlayPool.push(filteredItems.overlay);
      filteredItems.overlay = null;
    }
  },

  /**
   * @function
   * @param {ListItem|Object|*} item
   * @param {boolean}           isSelected
   */
  toggleSelection: function (item, isSelected) {
    if (item.visible) {
      if (typeof isSelected === "boolean") {
        item.selected = isSelected;
      } else {
        item.selected = !item.selected;
      }

      if (item.selected) {
        item.element.addClass('is-selected');
        this.selectedItems.push(item);
      } else {
        item.element.removeClass('is-selected');
        this.selectedItems.remove(item);
      }

      this.afterSelectionChange();
    }
  },

  /**
   * @function
   * @param {ListItem|Object|*} item
   */
  toggleSelectionThrough: function (item) {
    if (this.lastSelectedItem) {
      var selected = !item.selected,
        index = item.element.index(),
        lastSelectedIndex = this.lastSelectedItem.element.index();

      if (index > lastSelectedIndex) {
        for (var i = lastSelectedIndex + 1; i <= index; i += 1) {
          this.toggleSelection(this.items[i], selected);
        }
      } else if (lastSelectedIndex > index) {
        for (var j = index; j < lastSelectedIndex; j += 1) {
          this.toggleSelection(this.items[j], selected);
        }
      }
    }
  },

  /**
   * @function
   */
  clearSelection: function () {
    this.selectedItems.forEach((function (item) {
      item.selected = false;
      item.element.removeClass('is-selected');
    }).bind(this));

    this.selectedItems.clear();
    this.lastSelectedItem = null;

    this.afterSelectionChange();
  },

  /**
   * @function
   */
  afterSelectionChange: function () {
    var size = this.selectedItems.size();

    this.$domElement.toggleClass('is-selecting', size > 0);
    this.$trayElement.toggleClass('visible', size > 0);
    this.$trayElement.find('.status').text(
      size + ' ' + SL.util.string.pluralize('个媒体', size !== 1) + '被选择');

    if (this.filterBData &&
      this.filterBData.type ===
      SL.editor.components.medialibrary.Filters.FILTER_TYPE_TAG) {
      this.$trayElement.find('.untag-button').show();
    } else {
      this.$trayElement.find('.untag-button').hide();
    }
  },

  /**
   * @function
   */
  deleteSelection: function () {
    var title = SL.locale.get('MediaLibrary.List.delete_select_title');

    if (this.selectedItems.size() > 1) {
      title = SL.locale.get('MediaLibrary.List.delete_selects_title');
    }

    SL.prompt({
      anchor: this.$trayElement.find('.delete-button'),
      title: title,
      type: 'select',
      data: [{
        html: '<h3>' + SL.locale.get('Cancel') + '</h3>'
      }, {
        html: '<h3>' + SL.locale.get('Delete') + '</h3>',
        selected: true,
        className: 'negative',
        callback: (function () {
          this.selectedItems.forEach((function (item) {
            item.model.destroy().fail((function () {
              SL.notify(SL.locale.get('MediaLibrary.List.delete_media_err'), 'negative');
            }).bind(this));

            this.media.remove(item.model);
          }).bind(this));

          this.clearSelection();
        }).bind(this)
      }]
    });

    SL.analytics.trackEditor('Media: Delete items');
  },

  /**
   * @function
   * @param {ListItem|Object|*} item
   */
  editLabel: function (item) {
    // TODO：'item.element' Is have problem ?
    item.element.addClass('hover');

    var prompt = SL.prompt({
      anchor:        item.element.find('.label-button'),
      title:         SL.locale.get('MediaLibrary.List.edit_label_title'),
      type:          'input',
      confirmLabel:  SL.locale.get('Save'),
      data: {
        value:       item.model.get('label'),
        placeholder: SL.locale.get('MediaLibrary.List.edit_label_placeholder'),
        maxlength:   SL.config.MEDIA_LABEL_MAXLENGTH,
        width: 400
      }
    });
    prompt.confirmed.add((function (val) {
      item.element.removeClass('hover');

      if (val && val.trim() !== '') {
        item.model.set('label', val);
        item.model.save(['label']);
        this.refreshOverlay(item);
      } else {
        SL.notify(SL.locale.get('MediaLibrary.List.edit_label_no_empty'), 'negative');
      }
    }).bind(this));
    prompt.canceled.add((function () {
      item.element.removeClass('hover');
    }).bind(this));

    SL.analytics.trackEditor('Media: Edit item label');
  },

  /**
   * @function
   * @param {ListItem|Object|*} item
   */
  toggleInline: function (item) {
    item.model.set('inline', !item.model.get('inline'));
    item.model.save(['inline']);

    this.refreshOverlay(item);
    SL.analytics.trackEditor('Media: Toggle inline SVG');
  },

  /**
   * @function
   * @param {Array} medias
   * @param {Array} curMedias
   */
  onMediaChanged: function (medias, curMedias) {
    if (medias && medias.length) {
      medias.forEach((function (item) {
        this.addItem(item, true, true);
      }).bind(this));

      this.applyFilter();
    }

    if (curMedias && curMedias.length) {
      curMedias.forEach(this.removeItem.bind(this));

      if (this.media.isEmpty()) {
        this.applyFilter();
      } else {
        this.loadItemsInView();
      }
    }
  },

  /**
   * @function
   * @param {Object} tag
   */
  onTagAssociationChanged: function (tag) {
    if (this.filterBData &&
      this.filterBData.type ===
      SL.editor.components.medialibrary.Filters.FILTER_TYPE_TAG &&
      this.filterBData.tag.get('id') === tag.get('id')) {
      this.applyFilter();
    }
  },

  /**
   * @function
   * @param {Event} evt
   */
  onMouseDown: function (evt) {
    this.$mouseDownTarget = $(evt.target);

    this.mouseDownX = evt.clientX;
    this.mouseDownY = evt.clientY;

    this.$domElement.on('vmousemove', this.onMouseMove);
    this.$domElement.on('vmouseup', this.onMouseUp);
  },

  /**
   * @function
   * @param {Event} evt
   */
  onMouseMove: function (evt) {
    var distance = SL.util.trig.distanceBetween({
      x: this.mouseDownX, y: this.mouseDownY
    }, {
      x: evt.clientX, y: evt.clientY
    });

    if (distance > 10 && this.options.editable) {
      var mediaItem =
        this.$mouseDownTarget.closest('.media-library-list-item').data('item');

      if (mediaItem) {
        this.$domElement.off('vmousemove', this.onMouseMove);
        this.$domElement.off('vmouseup', this.onMouseUp);

        var models = [mediaItem.model];

        if (this.selectedItems.size() > 0 && mediaItem.selected) {
          models = this.selectedItems.map(function (item) {
            return item.model;
          });
        }

        this.drag.startDrag(evt, mediaItem.element, models);

        SL.analytics.trackEditor(
          'Media: Start drag', models.length > 1 ? 'multiple' : 'single');
      }
    }

    evt.preventDefault();
  },

  /**
   * @function
   * @param {Event} evt
   */
  onMouseUp: function (evt) {
    var $target = $(evt.target),
      item = $target.closest('.media-library-list-item').data('item');

    if (item) {
      if (this.selectedItems.size() > 0 ||
        $target.closest('.select-button').length) {

        if (evt.shiftKey) {
          this.toggleSelectionThrough(item);
        }
        else {
          this.lastSelectedItem = item;
          this.toggleSelection(item);
        }
      }
      else if ($target.closest('.label-button').length) {
        this.editLabel(item);
      }
      else if ($target.closest('.inline-button').length) {
        this.toggleInline(item);
      }
      else {
        this.itemSelected.dispatch(item.model);
      }
    }

    this.$domElement.off('vmousemove', this.onMouseMove);
    this.$domElement.off('vmouseup', this.onMouseUp);

    evt.preventDefault();
  },

  /**
   * @function
   */
  onListScrolled: function () {
    this.loadItemsInView();
  },

  /**
   * @function
   */
  onDeleteSelectionClicked: function () {
    this.deleteSelection();
  },

  /**
   * @function
   */
  onUntagSelectionClicked: function () {
    if (this.filterBData &&
      this.filterBData.type ===
      SL.editor.components.medialibrary.Filters.FILTER_TYPE_TAG) {
      var models = this.selectedItems.map(function (item) {
        return item.model;
      });

      this.tags.removeTagFrom(this.filterBData.tag, models);

      this.applyFilter();
      this.clearSelection();
    }
  },

  /**
   * @function
   */
  onClearSelectionClicked: function () {
    this.clearSelection();
  }
});

SL('editor.components.medialibrary').MediaLibraryPage = Class.extend({
  /**
   * Constructor SL.editor.components.medialibrary.MediaLibraryPage Instance
   *
   * @function
   * @param {Object} media
   * @param {Array}  tags
   * @param {Object} options
   */
  init: function (media, tags, options) {
    this.media = media;

    this.media.loadCompleted.add(this.onMediaLoaded.bind(this));
    this.media.loadFailed.add(this.onMediaFailed.bind(this));

    this.tags = tags;
    this.tags.loadCompleted.add(this.onTagsLoaded.bind(this));
    this.tags.loadFailed.add(this.onTagsFailed.bind(this));
    this.tags.changed.add(this.onTagsChanged.bind(this));

    this.options = $.extend({
      editable:          true,
      selectAfterUpload: true
    }, options);

    this.selected = new signals.Signal();

    this.render();
    this.setupDragAndDrop();
  },

  /**
   * @function
   */
  load: function () {
    this.mediaLoaded = false;
    this.tagsLoaded  = false;

    if (this.$loadStatus) {
      this.$loadStatus.remove();
    }

    this.$loadStatus = $('<div class="media-library-load-status">')
      .appendTo(this.$domElement);
    this.$loadStatus.html('Loading...');

    this.media.load();
    this.tags.load();
  },

  /**
   * @function
   */
  onMediaLoaded: function () {
    this.mediaLoaded = true;

    if (this.tagsLoaded) {
      this.onMediaAndTagsLoaded();
    }
  },

  /**
   * @function
   */
  onMediaFailed: function () {
    SL.notify(SL.locale.get('Generic_Error'), 'negative');

    this.$loadStatus.html([
      'Failed to load media ',
      '<button class="button outline retry">',
        'Try again',
      '</button>'].join(''));
    this.$loadStatus.find('.retry').on('click', this.load.bind(this));
  },

  /**
   * @function
   */
  onTagsLoaded: function () {
    this.tagsLoaded = true;

    if (this.mediaLoaded) {
      this.onMediaAndTagsLoaded();
    }
  },

  /**
   * @function
   */
  onTagsFailed: function () {
    SL.notify(SL.locale.get('Generic_Error'), 'negative');

    this.$loadStatus.html([
      '加载标签失败 ' +
      '<button class="button outline retry">',
        '重试',
      '</button>'].join(''));
    this.$loadStatus.find('.retry').on('click', this.load.bind(this));
  },

  /**
   * @function
   */
  onMediaAndTagsLoaded: function () {
    this.renderFilters();
    this.renderUploader();
    this.renderList();
    this.refresh();

    this.$sidebarElement.addClass('visible');
    this.$contentElement.addClass('visible');

    this.scrollShadow = new SL.components.ScrollShadow({
      $parentElement:  this.filters.$domElement,
      $contentElement: this.filters.$innerElement,
      shadowSize:      6,
      resizeContent:   false
    });

    this.$loadStatus.remove();
  },

  /**
   * @function
   */
  render: function () {
    this.$domElement = $('<div class="media-library-page"></div>');
    this.$sidebarElement =
      $('<div class="media-library-sidebar">').appendTo(this.$domElement);
    this.$contentElement =
      $('<div class="media-library-content">').appendTo(this.$domElement);
  },

  /**
   * @function
   */
  renderFilters: function () {
    this.filters =
      new SL.editor.components.medialibrary.Filters(
        this.media, this.tags, {editable: this.isEditable()});
    this.filters.filterChanged.add(this.onFilterChanged.bind(this));
    this.filters.appendTo(this.$sidebarElement);
  },

  /**
   * @function
   */
  renderUploader: function () {
    if (!this.media.crud.section && this.isEditable()) {
      this.uploader = new SL.editor.components.medialibrary.Uploader(this.media);
      this.uploader.uploadEnqueued.add(this.onUploadEnqueued.bind(this));
      this.uploader.uploadStarted.add(this.onUploadStarted.bind(this));
      this.uploader.uploadCompleted.add(this.onUploadCompleted.bind(this));
      this.uploader.appendTo(this.$sidebarElement);
    }
  },

  /**
   * @function
   */
  renderList: function () {
    this.list =
      new SL.editor.components.medialibrary.List(
        this.media, this.tags, {editable: this.isEditable()});
    this.list.itemSelected.add(this.select.bind(this));
    this.list.appendTo(this.$contentElement);
  },

  /**
   * @function
   */
  setupDragAndDrop: function () {
    var $drop = $([
      '<div class="media-library-drag-instructions">',
        '<div class="inner">', 'Drop to upload media', '</div>',
      '</div>'].join(''));

    this.dragAndDropListener = {
      onDragOver: (function () {
        $drop.appendTo(this.$domElement);
      }).bind(this),
      onDragOut: (function () {
        $drop.remove();
      }).bind(this),
      onDrop: (function (evt) {
        $drop.remove();

        var files = evt.originalEvent.dataTransfer.files;

        if (this.isSelecting()) {
          this.uploader.enqueue(files[0]);
        } else {
          for (var n = 0; n < files.length; n += 1) {
            this.uploader.enqueue(files[n]);
          }
        }

        SL.analytics.trackEditor('Media: Upload file', 'drop from desktop');
      }).bind(this)
    };
  },

  /**
   * @function
   * @param parent
   */
  show: function (parent) {
    this.$domElement.appendTo(parent);
    this.$domElement.removeClass('visible');

    clearTimeout(this.showTimeout);
    this.showTimeout = setTimeout((function () {
      this.$domElement.addClass('visible');
    }).bind(this), 1);
  },

  /**
   * @function
   */
  hide: function () {
    clearTimeout(this.showTimeout);
    this.$domElement.detach();
  },

  /**
   * @function
   */
  bind: function () {
    SL.draganddrop.subscribe(this.dragAndDropListener);
  },

  /**
   * @function
   */
  unbind: function () {
    SL.draganddrop.unsubscribe(this.dragAndDropListener);
  },

  /**
   * @function
   * @param {Object} options
   */
  configure: function (options) {
    this.options = $.extend(this.options, options);
    this.refresh();
  },

  /**
   * @function
   */
  refresh: function () {
    if (this.media && this.media.isLoaded()) {
      this.list.clearSelection();

      if (this.uploader) {
        this.uploader.configure({
          multiple: !this.isSelecting() || !this.options.selectAfterUpload
        });
      }


      if (this.isSelecting()) {
        this.list.setPrimaryFilter(this.options.select.filter);
        this.list.clearSecondaryFilter();

        this.filters.hideAllTypesExcept(this.options.select.id);
        this.filters.selectFilter(this.options.select.id);
      } else {
        this.filters.showAllTypes();
        this.list.clearPrimaryFilter();
        this.filters.selectDefaultFilter();
      }

      if (this.scrollShadow) {
        this.scrollShadow.sync();
      }
    }
  },

  /**
   * @function
   */
  layout: function () {
    var width = this.$sidebarElement.width();

    this.$contentElement.css({
      width:       this.$domElement.width() - width,
      left:        width,
      paddingLeft: 0
    });

    if (this.list) {
      this.list.layout();
    }
  },

  /**
   * @function
   * @param {File} file
   */
  select: function (file) {
    this.selected.dispatch(file);
  },

  /**
   * @function
   * @returns {boolean}
   */
  isSelecting: function () {
    return !!this.options.select;
  },

  /**
   * @function
   * @returns {boolean}
   */
  isEditable: function () {
    return !!this.options.editable;
  },

  /**
   * @function
   * @param {Function} filterB
   * @param {Object}   filterBData
   */
  onFilterChanged: function (filterB, filterBData) {
    this.list.setSecondaryFilter(filterB, filterBData);
  },

  /**
   * @function
   * @param {Object|Instance|*} upload
   */
  onUploadEnqueued: function (upload) {
    var selectedFilterData = this.filters.getSelectedFilterData();

    if (selectedFilterData.type ===
      SL.editor.components.medialibrary.Filters.FILTER_TYPE_TAG) {
      upload.uploadCompleted.add((function () {
        this.tags.addTagTo(selectedFilterData.tag, [upload]);
      }).bind(this));
    }
  },

  /**
   * @function
   * @param {File} file
   */
  onUploadStarted: function (file) {
    if (this.isSelecting() && this.options.selectAfterUpload) {
      this.select(file);
    }
  },

  /**
   * @function
   * @param {Object} media
   */
  onUploadCompleted: function (media) {
    this.media.push(media);
  },

  /**
   * @function
   */
  onTagsChanged: function () {
    if (this.scrollShadow) {
      this.scrollShadow.sync();
    }
  }
});

SL('editor.components.medialibrary').MediaLibrary     = SL.components.popup.Popup.extend({
  TYPE : 'media-library',

  /**
   * Constructor SL.editor.components.medialibrary.MediaLibrary Instance
   *
   * @function
   * @param {Object} options
   */
  init: function (options) {
    this._super($.extend({
      title:     SL.locale.get('MediaLibrary.main.title'),
      width:     1010,
      height:    660,
      singleton: true
    }, options));

    this.selected = new signals.Signal();
  },

  /**
   * @function
   */
  render: function () {
    this._super();

    this.$innerElement.addClass('media-library');
    this.userPage =
      new SL.editor.components.medialibrary.MediaLibraryPage(
        new SL.collections.Media(), new SL.collections.MediaTags());
    this.userPage.selected.add(this.onMediaSelected.bind(this));
    this.userPage.load();

    if (SL.current_user.isEnterprise()) {
      var teamMedia = new SL.collections.TeamMedia();

      this.$headerTabs = $([
        '<div class="media-library-header-tabs">',
          '<div class="media-library-header-tab user-tab">Your Media</div>',
          '<div class="media-library-header-tab team-tab" data-tooltip-alignment="r">',
            'Team Media',
          '</div>',
        '</div>'].join(''));

      this.$userTab = this.$headerTabs.find('.user-tab');
      this.$teamTab = this.$headerTabs.find('.team-tab');
      this.$userTab.on('vclick', this.showUserPage.bind(this));
      this.$teamTab.on('vclick', this.showTeamPage.bind(this));

      this.$innerElement.addClass('has-header-tabs');
      this.$headerTitleElement.replaceWith(this.$headerTabs);

      teamMedia.loadCompleted.add((function () {
        if (!SL.current_user.isEnterpriseManager() && teamMedia.isEmpty()) {
          this.$teamTab.addClass('is-disabled');
          this.$teamTab.attr(
            'data-tooltip',
            'Your team doesn\'t have any shared media yet.<br>Only admins can upload team media.');
        }
      }).bind(this));
      teamMedia.loadFailed.add((function () {
        this.$teamTab.attr('data-tooltip', 'Failed to load');
      }).bind(this));

      this.teamPage =
        new SL.editor.components.medialibrary.MediaLibraryPage(
          teamMedia,
          new SL.collections.TeamMediaTags(), {
            editable: SL.current_user.isEnterpriseManager(),
            selectAfterUpload: false
          });
      this.teamPage.selected.add(this.onMediaSelected.bind(this));
      this.teamPage.load();
    }

    this.showUserPage();
  },

  /**
   * @function
   */
  showUserPage: function () {
    this.currentPage = this.userPage;

    if (this.teamPage) {
      this.teamPage.hide();
      this.$teamTab.removeClass('is-selected');
      this.$userTab.addClass('is-selected');
    }

    this.userPage.show(this.$bodyElement);
    this.userPage.configure(this.options);

    this.refresh();
    this.layout();
  },

  /**
   * @function
   */
  showTeamPage: function () {
    this.currentPage = this.teamPage;

    this.userPage.hide();
    this.$userTab.removeClass('is-selected');

    this.teamPage.show(this.$bodyElement);
    this.teamPage.configure(this.options);

    this.$teamTab.addClass('is-selected');

    this.refresh();
    this.layout();
  },

  /**
   * @function
   * @param {Object} options
   */
  open: function (options) {
    options = $.extend({select: null}, options);

    this._super(options);

    this.currentPage.configure(options);
    this.currentPage.bind();

    this.refresh();
    this.layout();
  },

  /**
   * @function
   */
  close: function () {
    this._super.apply(this, arguments);

    this.selected.removeAll();
    this.currentPage.unbind();
  },

  /**
   * @function
   */
  layout: function () {
    this._super.apply(this, arguments);
    this.currentPage.layout();
  },

  /**
   * @function
   */
  refresh: function () {
    this.currentPage.refresh();
  },

  /**
   * @function
   * @returns {boolean}
   */
  isSelecting: function () {
    return !!this.options.select;
  },

  /**
   * @function
   * @param {Object} media
   */
  onMediaSelected: function (media) {
    if (this.isSelecting()) {
      this.selected.dispatch(media);
    } else {
      //判断是图片还是视频
      var type = media.data.content_type.slice(0, 5);

      if (type == 'image') {
        SL.editor.controllers.Blocks.add({
          type: 'image',
          afterInit: function (block) {
            block.setImageModel(media);
          }
        });
      }
      else if(type == 'video') {
        SL.editor.controllers.Blocks.add({
          type: 'video',
          afterInit: function (block) {
            block.setVideoURL(media.data.url, media.data.thumb_url);
          }
        });
      }
    }

    this.close();
  }
});


//切片库
SL('editor.components.sectionlibrary').SectionLibrary = SL.components.popup.Popup.extend({
  TYPE : 'section-library',

  init: function (options) {
    this._super($.extend({
      title:     '切片库',
      width:     1010,
      height:    660,
      singleton: true
    }, options));

    this.selected = new signals.Signal();
  },

  render: function () {
    this._super();
    // this.userPage =
    //   new SL.editor.components.sectionlibrary.SectionLibraryPage(
    //     new SL.collections.Media());
    this.userPage =
      new SL.editor.components.medialibrary.MediaLibraryPage(
        new SL.collections.Section(), new SL.collections.SectionCatalog());
    this.userPage.selected.add(this.onMediaSelected.bind(this));
    this.userPage.load();

    this.$domElementpage = $('<div class="media-library-page"></div>');
    this.$sidebarElement =
      $('<div class="media-library-sidebar">').appendTo(this.$domElementpage);
    this.$contentElement =
      $('<div class="media-library-content">').appendTo(this.$domElementpage);

    this.showUserPage();
  },

   /**
   * @function
   */
  showUserPage: function () {
    this.currentPage = this.userPage;

    this.userPage.show(this.$bodyElement);
    this.userPage.configure(this.options);

    this.refresh();
    this.layout();
  },

  onMediaSelected: function (media) {
    SL.editor.controllers.Blocks.add({
      type: 'sectionIframe',
      afterInit: function (block) {
        block.setIframeURL('/html/platform/sliceframe/sliceview.html?id=' +  media.data.id);
      }
    });

    this.close();
  },

  refresh: function () {
    this.currentPage.refresh();
  }
});

//添加标注
SL('editor.components.sectionLibrary').addAnnotated    = SL.components.popup.Popup.extend({
  TYPE : 'add-annotated',

  /**
   * Constructor SL.editor.components.medialibrary.MediaLibrary Instance
   *
   * @function
   * @param {Object} options
   */
  init: function (options) {
    this._super($.extend({
      title:     '添加标注',
      width:     1180,
      height:    800,
      //singleton: true
    }, options));
  },

  render: function () {
    this._super();

    if (!this.$bodyElement.hasClass('add-annotated')) {
      if (this.options.annotated ) {
        this.options.annotated = this.options.annotated.replace(/\s/ig,'');
      }
      
      var iframeStr =
        '<iframe id="editSlice" style="width:100%; height:100%"' +
         'src="/html/platform/sliceframe/sliceframe.html?id=' + this.options.id +
         '" data-annotated ='+this.options.annotated+'></iframe>';
        this.$bodyElement.append(iframeStr);

      this.$bodyElement.addClass('add-annotated');
    }
  }
});


SL('editor.components.medialibrary').Uploader         = Class.extend({
  MAX_CONCURRENT_UPLOADS: 2,
  FILE_FORMATS: [{
    validator: /(image.*)|(video.*)/,
    maxSize:   SL.config.MAX_IMAGE_UPLOAD_SIZE
  }],

  /**
   * Constructor SL.editor.components.medialibrary.Uploader Instance
   *
   * @function
   * @param {Object} media
   */
  init: function (media) {
    this.media   = media;
    this.options = {multiple: true};
    this.queue   = new SL.collections.Collection();

    this.render();
    this.renderInput();
    this.bind();
  },

  /**
   * @function
   */
  bind: function () {
    this.onUploadCompleted = this.onUploadCompleted.bind(this);
    this.onUploadFailed    = this.onUploadFailed.bind(this);

    this.uploadEnqueued  = new signals.Signal();
    this.uploadStarted   = new signals.Signal();
    this.uploadCompleted = new signals.Signal();
  },

  /**
   * @function
   */
  render: function () {
    this.$domElement = $('<div class="media-library-uploader">');

    this.$uploadButton = $([
      '<div class="media-library-uploader-button">',
        'Upload ',
        '<span class="icon i-cloud-upload2"></span>',
      '</div>'].join(''));
    this.$uploadButton.appendTo(this.$domElement);

    this.$uploadList = $('<div class="media-library-uploader-list">');
    this.$uploadList.appendTo(this.$domElement);
  },

  /**
   * @function
   */
  renderInput: function () {
    if (this.$fileInput) {
      this.$fileInput.remove();
    }

    this.$fileInput = $('<input class="file-input" type="file">');
    this.$fileInput.on('change', this.onInputChanged.bind(this));
    this.$fileInput.appendTo(this.$uploadButton);

    if (this.options.multiple) {
      this.$fileInput.attr('multiple', 'multiple');
    } else {
      this.$fileInput.removeAttr('multiple', 'multiple');
    }
  },

  /**
   * @function
   * @param {Object} options
   */
  configure: function (options) {
    this.options = $.extend(this.options, options);
    this.renderInput();
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
   * @returns {*}
   */
  isUploading: function () {
    return this.queue.some(function (uploader) {
      return uploader.isUploading();
    });
  },

  /**
   * @function
   * @param {File} file
   * @returns {boolean}
   */
  validateFile: function (file) {
    var maxSize = 0;

    if (typeof file.size === "number") {
      maxSize = file.size / 1024;
    }

    return this.FILE_FORMATS.some(function (fileFormats) {
      if (file.type.match(fileFormats.validator)) {
        if (fileFormats.maxSize && maxSize > fileFormats.maxSize) {
          return false;
        } else {
          return true;
        }
      } else {
        return false;
      }
    });
  },

  /**
   * @function
   * @param {File} file
   * @returns {boolean}
   */
  enqueue: function (file) {
    if (this.queue.size() >= 50) {
      SL.notify('Upload queue is full, please wait', 'negative');
      return false;
    }

    var media = new SL.models.Media(null, this.media.crud, file);

    media.$uploaderElement = $([
      '<div class="media-library-uploader-item">',
        '<div class="item-text">',
          '<span class="status">',
            '<span class="icon i-clock"></span>',
          '</span>',
          '<span class="filename">',
            (file.name || 'untitled'),
          '</span>',
        '</div>',
        '<div class="item-progress">',
          '<span class="bar"></span>',
        '</div>',
      '</div>'].join(''));
    media.$uploaderElement.appendTo(this.$uploadList);

    setTimeout(media.$uploaderElement.addClass.bind(
      media.$uploaderElement, 'animate-in'), 1);

    media.uploadCompleted.add(this.onUploadCompleted);
    media.uploadFailed.add(this.onUploadFailed);
    media.uploadProgressed.add((function (progess) {
      var transform = 'scaleX(' + progess + ')';

      media.$uploaderElement.find('.bar').css({
        '-webkit-transform': transform,
        '-moz-transform':    transform,
        transform:           transform
      });
    }).bind(this));

    this.queue.push(media);
    this.uploadEnqueued.dispatch(media);
    this.checkQueue();
  },

  /**
   * @function
   * @param {Object} media
   * @param {String} classStr
   * @param {String} statusTxt
   */
  dequeue: function (media, classStr, statusTxt) {
    var $uploaderElement = media.$uploaderElement;

    if ($uploaderElement) {
      media.$uploaderElement = null;

      $uploaderElement.addClass(classStr);
      $uploaderElement.find('.status').html(statusTxt);

      setTimeout((function () {
        $uploaderElement.removeClass('animate-in').addClass('animate-out');

        setTimeout($uploaderElement.remove.bind($uploaderElement), 500);
      }).bind(this), 2e3);

      this.queue.remove(media);

      if (media.isUploaded()) {
        this.uploadCompleted.dispatch(media);
      }
    }
  },

  /**
   * @function
   */
  checkQueue: function () {
    this.queue.forEach((function (media) {
      if (media.isUploaded()) {
        this.dequeue(
          media,
          'completed',
          '<span class="icon i-checkmark"></span>');
      } else if (media.isUploadFailed()) {
        this.dequeue(
          media,
          'failed',
          '<span class="icon i-denied"></span>');
      }
    }).bind(this));

    var maxUploads = 0;

    this.queue.forEach((function (media) {
      if (maxUploads < this.MAX_CONCURRENT_UPLOADS) {
        if (media.isUploading()) {
          maxUploads += 1;
        } else if (media.isWaitingToUpload()) {
          media.upload();
          media.$uploaderElement
            .find('.status')
            .html('<div class="upload-spinner"></div>');

          maxUploads += 1;
          this.uploadStarted.dispatch(media);
        }
      }
    }).bind(this));

    this.$domElement.toggleClass('is-uploading', maxUploads > 0);
  },

  /**
   * @function
   */
  onUploadCompleted: function () {
    this.checkQueue();
  },

  /**
   * @function
   * @param {String} msg
   */
  onUploadFailed: function (msg) {
    SL.notify(
      msg || '上传图像时出错.',
      'negative');
    this.checkQueue();
  },

  /**
   * @function
   * @param {Event} evt
   */
  onInputChanged: function (evt) {
    var files = SL.util.toArray(this.$fileInput.get(0).files);
    files = files.filter(this.validateFile.bind(this));

    if (files.length) {
      files.forEach(this.enqueue.bind(this));
      SL.analytics.trackEditor('Media: Upload file', 'file input');
    } else {
      SL.notify('该文件格式不支持', 'negative');
    }

    this.renderInput();
    evt.preventDefault();
  },

  /**
   * @function
   */
  destroy: function () {
    this.queue = null;
    this.uploadStarted.dispose();
    this.uploadCompleted.dispose();
  }
});


/*!
 * project name: SlideStudio
 * name:         colorpicker.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/18
 */

'use strict';

SL('editor.components').Colorpicker = Class.extend({
  /**
   * Constructor SL.editor.components.Colorpicker Instance
   *
   * @function
   * @param {Editor|Object|*} editor -The Editor Instance
   */
  init: function (editor) {
    this.editor = editor;

    this.render();
    this.bind();
  },

  /**
   * @function
   */
  render: function () {
    this.$domElement   = $('<div class="sl-colorpicker">');
    this.$arrowElement =
      $('<div class="sl-colorpicker-arrow">').appendTo(this.$domElement);
    this.$apiElement   =
      $('<div class="sl-colorpicker-api">').appendTo(this.$domElement);
  },

  /**
   * @function
   */
  bind: function () {
    this.onChooseClicked     = this.onChooseClicked.bind(this);
    this.onResetClicked      = this.onResetClicked.bind(this);
    this.onWindowResize      = this.onWindowResize.bind(this);
    this.onDocumentMouseDown = this.onDocumentMouseDown.bind(this);
  },

  /**
   * @function
   */
  renderColorpicker: function () {
    if (!this.hasRenderedColorPicker) {
      this.hasRenderedColorPicker = true;
      this.$apiElement.spectrum({
        flat:                   true,
        showInput:              true,
        showButtons:            false,
        showInitial:            true,
        showPalette:            true,
        showPaletteOnly:        true,
        togglePaletteOnly:      true,
        showSelectionPalette:   true,
        hideAfterPaletteSelect: true,
        maxSelectionSize:       10,
        togglePaletteMoreText: '更多选项',
        togglePaletteLessText: 'Less options',
        preferredFormat:       'hex',
        localStorageKey:       'sl-colors',
        className:             'sl-colorpicker-spectrum',
        move: (function (clr) {
          clr = this.config.alpha ? clr.toRgbString() : clr.toHexString();
          this.config.changeCallback(clr, true);
        }).bind(this),
        change: (function (clr) {
          clr = this.config.alpha ? clr.toRgbString() : clr.toHexString();
          this.config.changeCallback(clr, true);
        }).bind(this),
        hide: (function () {
          this.hide();
        }).bind(this)
      });
    }

    this.$domElement.find('.sl-colorpicker-buttons').remove();
    this.$domElement.append([
      '<div class="sl-colorpicker-buttons">',
        '<button class="sl-colorpicker-reset button s outline">' +
          this.config.resetText +
        '</button>',
        '<button class="sl-colorpicker-choose button s grey">' +
          this.config.chooseText +
        '</button>',
      '</div>'].join(''));

    this.$domElement.find('.sl-colorpicker-reset')
      .on('click', this.onResetClicked);
    this.$domElement.find('.sl-colorpicker-choose')
      .on('click', this.onChooseClicked);

    this.$apiElement.spectrum('option', 'palette', this.getColorPalettePresets(this.config.alpha));
    this.$apiElement.spectrum('option', 'showAlpha', !!this.config.alpha);
    this.$apiElement.spectrum('option', 'cancelText', this.config.cancelText);
    this.$apiElement.spectrum('option', 'cancelClassName', this.config.cancelClassName);
    this.$apiElement.spectrum('option', 'chooseText', this.config.chooseText);
    this.$apiElement.spectrum('option', 'chooseClassName', this.config.chooseClassName);

    if (this.config.color) {
      this.$apiElement.spectrum('set', this.config.color);
    }

    this.$apiElement.spectrum('reflow');
  },

  /**
   * @function
   */
  layout: function () {
    var domPadding = 10, anchorPadding = 6,
      domOutW      = this.$domElement.outerWidth(),
      domOutH      = this.$domElement.outerHeight(),
      offset       = this.config.anchor.offset(),
      anchorOutW   = this.config.anchor.outerWidth(),
      anchorOutH   = this.config.anchor.outerHeight(),
      left         = offset.left + this.config.offsetX,
      top          = offset.top + this.config.offsetY;

    switch (this.config.alignment) {
      case 't':
        left += (anchorOutW - domOutW) / 2;
        top -= domOutH + domPadding;
        break;
      case 'b':
        left += (anchorOutW - domOutW) / 2;
        top += anchorOutH + domPadding;
        break;
      case 'l':
        left -= domOutW + domPadding;
        top += (anchorOutH - domOutH) / 2;
        break;
      case 'r':
        left += anchorOutW + domPadding;
        top += (anchorOutH - domOutH) / 2;
        break;
      default :
        break;
    }

    left = Math.min(
      Math.max(left, domPadding),
      window.innerWidth - domOutW - domPadding);
    top  = Math.min(
      Math.max(top, domPadding),
      window.innerHeight - domOutH - domPadding);

    var arrowX = 0, arrowY = 0;

    switch (this.config.alignment) {
      case 't':
        arrowX = offset.left - left + anchorOutW / 2;
        arrowY = domOutH;
        break;
      case 'b':
        arrowX = offset.left - left + anchorOutW / 2;
        arrowY = -anchorPadding;
        break;
      case 'l':
        arrowX = domOutW;
        arrowY = offset.top - top + anchorOutH / 2;
        break;
      case 'r':
        arrowX = -anchorPadding;
        arrowY = offset.top - top + anchorOutH / 2;
        break;
      default :
        break;
    }

    this.$domElement.css({
      left: left,
      top:  top
    });
    this.$arrowElement.css({
      left: arrowX,
      top:  arrowY
    });
    this.$domElement.attr('data-alignment', this.config.alignment);
  },

  /**
   * @function
   * @param {Object} config
   */
  show: function (config) {
    if (!config.anchor) {
      throw 'Can not show color picker without anchor.';
    }

    this.$domElement.appendTo(document.body);

    this.config = $.extend({
      alignment:  'l',
      offsetX:     0,
      offsetY:     0,
      alpha:       false,
      resetText:  '使用默认',
      chooseText: '确定',
      resetCallback:  function () {},
      changeCallback: function () {},
      hiddenCallback: function () {}
    }, config);

    this.renderColorpicker();
    this.layout();

    $(window).on('resize', this.onWindowResize);
    $(document).on('mousedown', this.onDocumentMouseDown);
  },

  /**
   * @function
   */
  hide: function () {
    this.saveCurrentColorToPalette();
    this.$domElement.detach();

    $(window).off('resize', this.onWindowResize);
    $(document).off('mousedown', this.onDocumentMouseDown);
  },

  /**
   * @function
   * @param {Object} config
   */
  toggle: function (config) {
    if (this.isVisible()) {
      this.hide();
    } else {
      this.show(config);
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
   * @param {String|Number|*} clr
   */
  setColor: function (clr) {
    this.$apiElement.spectrum('set', clr);
    this.$apiElement.spectrum('reflow');
  },

  /**
   * @function
   * @returns {String|Number|*}
   */
  getColor: function () {
    return this.$apiElement.spectrum('get');
  },

  /**
   * @function
   */
  saveCurrentColorToPalette: function () {
    //this.$apiElement.spectrum('saveCurrentSelection');
  },

  /**
   * @function
   * @param {boolean} transparent
   * @returns {*[]}
   */
  getColorPalettePresets: function (transparent) {
    if (this.hasCustomPalette()) {
      return [SL.view.getCurrentTheme().get('palette')];
    }

    var presetsClr1 = [
        'rgb(0, 0, 0)',
        'rgb(34, 34, 34)',
        'rgb(68, 68, 68)',
        'rgb(102, 102, 102)',
        'rgb(136, 136, 136)',
        'rgb(170, 170, 170)',
        'rgb(204, 204, 204)',
        'rgb(238, 238, 238)',
        'rgb(255, 255, 255)'
      ],
      presetsClr2 = [
        'rgb(152, 0, 0)',
        'rgb(255, 0, 0)',
        'rgb(255, 153, 0)',
        'rgb(255, 255, 0)',
        'rgb(0, 255, 0)',
        'rgb(0, 255, 255)',
        'rgb(74, 134, 232)',
        'rgb(0, 0, 255)',
        'rgb(153, 0, 255)',
        'rgb(168, 39, 107)'
      ],
      presetsClr3 = [
        'rgb(230, 184, 175)',
        'rgb(244, 204, 204)',
        'rgb(252, 229, 205)',
        'rgb(255, 242, 204)',
        'rgb(217, 234, 211)',
        'rgb(208, 224, 227)',
        'rgb(201, 218, 248)',
        'rgb(207, 226, 243)',
        'rgb(217, 210, 233)',
        'rgb(234, 209, 220)',
        'rgb(221, 126, 107)',
        'rgb(234, 153, 153)',
        'rgb(249, 203, 156)',
        'rgb(255, 229, 153)',
        'rgb(182, 215, 168)',
        'rgb(162, 196, 201)',
        'rgb(164, 194, 244)',
        'rgb(159, 197, 232)',
        'rgb(180, 167, 214)',
        'rgb(213, 166, 189)',
        'rgb(204, 65, 37)',
        'rgb(224, 102, 102)',
        'rgb(246, 178, 107)',
        'rgb(255, 217, 102)',
        'rgb(147, 196, 125)',
        'rgb(118, 165, 175)',
        'rgb(109, 158, 235)',
        'rgb(111, 168, 220)',
        'rgb(142, 124, 195)',
        'rgb(194, 123, 160)',
        'rgb(166, 28, 0)',
        'rgb(204, 0, 0)',
        'rgb(230, 145, 56)',
        'rgb(241, 194, 50)',
        'rgb(106, 168, 79)',
        'rgb(69, 129, 142)',
        'rgb(60, 120, 216)',
        'rgb(61, 133, 198)',
        'rgb(103, 78, 167)',
        'rgb(166, 77, 121)',
        'rgb(91, 15, 0)',
        'rgb(102, 0, 0)',
        'rgb(120, 63, 4)',
        'rgb(127, 96, 0)',
        'rgb(39, 78, 19)',
        'rgb(12, 52, 61)',
        'rgb(28, 69, 135)',
        'rgb(7, 55, 99)',
        'rgb(32, 18, 77)',
        'rgb(76, 17, 48)'
      ];

    if (transparent) {
      presetsClr1.push('transparent');
    }

    return [presetsClr1, presetsClr2, presetsClr3];
  },

  /**
   * @function
   * @returns {*|boolean}
   */
  hasCustomPalette: function () {
    var theme = SL.view.getCurrentTheme();

    if (!!theme) {
      return theme.hasPalette();
    }

    return false;
  },

  /**
   * @function
   */
  destroy: function () {
    this.$domElement.remove();
  },

  /**
   * @function
   * @param {Event} evt
   */
  onResetClicked: function (evt) {
    this.config.resetCallback();
    this.hide();

    evt.preventDefault();
  },

  /**
   * @function
   * @param {Event} evt
   */
  onChooseClicked: function (evt) {
    this.saveCurrentColorToPalette();
    this.hide();

    evt.preventDefault();
  },

  /**
   * @function
   * @param {Event} evt
   */
  onDocumentMouseDown: function (evt) {
    var $target = $(evt.target);

    if ($target.closest(this.$domElement).length === 0 &&
      $target.closest(this.config.anchor).length === 0) {
      this.hide();
    }
  },

  /**
   * @function
   */
  onWindowResize: function () {
    this.layout();
  }
});


/*!
 * project name: SlideStudio
 * name:         sidebar.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/18
 */

'use strict';

SL('editor.components').Sidebar              = Class.extend({
  /**
   * Constructor SL.editor.components.Sidebar Instance
   *
   * @function
   * @param {Object} options
   */
  init: function (options) {
    this.options = options || {};

    this.$sidebarElement            = $('.sidebar');
    this.$sidebarPrimary            = this.$sidebarElement.find('.primary');
    this.$sidebarSecondary          = this.$sidebarElement.find('.secondary');
    this.$sidebarHeader             = this.$sidebarElement.find('.global-header');
    this.$sidebarScrollShadowTop    = this.$sidebarElement.find('.scroll-shadow-top');
    this.$sidebarScrollShadowBottom = this.$sidebarElement.find('.scroll-shadow-bottom');
    this.$panelElement              = $('.sidebar-panel');
    this.$saveButton                = this.$sidebarElement.find('.button.save');
    this.$previewButton             = this.$sidebarElement.find('.button.preview');
    this.$undoButton                = this.$sidebarElement.find('.button.undo');
    this.$exportButton              = this.$sidebarElement.find('.button.export');
    this.$importButton              = this.$sidebarElement.find('.button.import');
    this.$publishButton             = this.$sidebarElement.find('.button.publish');
    this.$settingsButton            = this.$sidebarElement.find('.button.settings');
    this.$revisionsButton           = this.$sidebarElement.find('.button.revisions');
    this.$medialibraryButton        = this.$sidebarElement.find('.button.medialibrary');
    this.$arrangeButton             = this.$sidebarElement.find('.button.arrange');
    this.$styleButton               = this.$sidebarElement.find('.button.style');
    this.$shareButton               = this.$sidebarElement.find('.button.share');

    //切片库
    this.$sectionlibraryButton        = this.$sidebarElement.find('.button.sectionlibrary');

    if (this.$previewButton) {
      this.$previewButton.attr(
        'data-tooltip',
        SL.locale.get('Preview') + ' (' + SL.util.getMetaKeyName() + ' + F)');
    }

    if (this.$undoButton) {
      this.$undoButton.attr(
        'data-tooltip',
        SL.locale.get('Undo') + ' (' + SL.util.getMetaKeyName() + ' + Z)');
    }

    this.currentPanel = null;

    this.createSignals();
    this.render();
    this.bind();
    this.layout();

    this.updatePublishButton();
    this.updateUndoButton();
  },

  /**
   * @function
   */
  bind: function () {
    this.$saveButton.on('vclick', this.onSaveClicked.bind(this));

    if (this.$previewButton) {
      this.$previewButton.on('vclick', this.onPreviewClicked.bind(this));
    }

    if (this.$undoButton) {
      this.$undoButton.on('vclick', this.onUndoClicked.bind(this));
    }

    if (this.$exportButton) {
      this.$exportButton.on('vclick', this.onExportClicked.bind(this));
    }

    if (this.$importButton) {
      this.$importButton.on('vclick', this.onImportClicked.bind(this));
    }

    //资源库
    this.$sectionlibraryButton.on('vclick', this.onSectionLibraryClicked.bind(this));


    this.$settingsButton.on('vclick', this.onSettingsClicked.bind(this));
    this.$revisionsButton.on('vclick', this.onRevisionsClicked.bind(this));
    this.$medialibraryButton.on('vclick', this.onMediaLibraryClicked.bind(this));
    this.$publishButton.on('vclick', this.onPublishClicked.bind(this));
    this.$arrangeButton.on('vclick', this.onArrangeClicked.bind(this));
    this.$styleButton.on('vclick', this.onStyleClicked.bind(this));
    this.$shareButton.on('vclick', this.onShareClicked.bind(this));
    this.$panelElement.on('vclick', this.onPanelElementClicked.bind(this));
    this.$sidebarSecondary.on('scroll', this.layout.bind(this));

    this.settingsPanel.onclose.add(this.close.bind(this));
    this.exportPanel.onclose.add(this.close.bind(this));
    this.importPanel.onclose.add(this.close.bind(this));
    this.revisionsPanel.onclose.add(this.close.bind(this));
    this.stylePanel.onclose.add(this.close.bind(this));

    $(window).on('resize', this.layout.bind(this));
    SL.editor.controllers.History.changed.add(this.updateUndoButton.bind(this));
  },

  /**
   * @function
   */
  createSignals: function () {
    this.saveClicked    = new signals.Signal();
    this.previewClicked = new signals.Signal();
  },

  /**
   * @function
   */
  render: function () {
    this.revisionsPanel = new SL.editor.components.sidebar.Revisions();
    this.settingsPanel  = new SL.editor.components.sidebar.Settings();
    this.exportPanel    = new SL.editor.components.sidebar.Export();
    this.importPanel    = new SL.editor.components.sidebar.Import();
    this.stylePanel     = new SL.editor.components.sidebar.Style();

    this.renderMoreOptions();
  },

  /**
   * @function
   */
  renderMoreOptions: function () {
    this.$moreOptionsElement = this.$sidebarElement.find('.more-options');

    this.moreOptions = new SL.components.Menu({
      anchor:        this.$moreOptionsElement,
      anchorSpacing: 10,
      alignment:     'r',
      showOnHover:   true,
      options: [{
        label: SL.locale.get('SlideBar.base.play'),
        icon:  'play',
        callback: (function () {
          SL.analytics.trackEditor('Sidebar: Present');
          window.open(SL.routes.DECK_LIVE(
            SLConfig.deck.user.username, SLConfig.deck.slug));
        }).bind(this)
      }, {
        label: SL.locale.get('SlideBar.base.copy'),
        icon:  'fork',
        callback: (function () {
          SL.analytics.trackEditor('Sidebar: Duplicate deck');
          SL.editor.controllers.API.forkDeck();
        }).bind(this)
      }, {
        label: SL.locale.get('SlideBar.base.del'),
        icon:  'trash-fill',
        callback: (function () {
          SL.analytics.trackEditor('Sidebar: Delete deck');
          SL.editor.controllers.API.deleteDeck();
        }).bind(this)
      }]
    });
  },

  /**
   * @function
   */
  layout: function () {
    var primaryHeight = this.$sidebarPrimary.outerHeight(true),
      slideBarHeight  = this.$sidebarHeader.outerHeight(true),
      maxHeight = window.innerHeight - (primaryHeight + slideBarHeight);

    this.$sidebarSecondary.css('max-height', maxHeight);

    var scrollTop  = this.$sidebarSecondary.scrollTop(),
      scrollHeight = this.$sidebarSecondary.prop('scrollHeight'),
      outerHeight  = this.$sidebarSecondary.outerHeight(),
      isScroll     = scrollHeight > outerHeight,
      opacity      = scrollTop / (scrollHeight - outerHeight);

    this.$sidebarScrollShadowBottom.css({
      opacity: isScroll ? 1 - opacity : 0,
      bottom:  this.$sidebarHeader.outerHeight()
    });
    this.$sidebarScrollShadowTop.css({
      opacity: isScroll ? opacity : 0,
      top:     this.$sidebarSecondary.offset().top
    });
  },

  /**
   * @function
   * @param panelType
   */
  open: function (panelType) {
    if (this.currentPanel) {
      this.currentPanel.close();
    }

    SL.editor.controllers.Mode.clear();

    switch (panelType) {
      case 'settings':
        this.currentPanel = this.settingsPanel;
        break;
      case 'export':
        this.currentPanel = this.exportPanel;
        break;
      case 'import':
        this.currentPanel = this.importPanel;
        break;
      case 'style':
        this.currentPanel = this.stylePanel;
        break;
      case 'revisions':
        this.currentPanel = this.revisionsPanel;
        break;
      default :
        break;
    }

    this.setActiveButton(panelType);
    this.currentPanel.open();
    this.$panelElement.addClass('visible');

    SL.analytics.trackEditor('Open panel', panelType);
  },

  /**
   * @function
   * @param {boolean} isSave
   */
  close: function (isSave) {
    if (this.currentPanel) {
      if (isSave === true) {
        this.currentPanel.save();
      }

      this.currentPanel.close();
    }

    this.setActiveButton(null);
    this.$panelElement.removeClass('visible');
  },

  /**
   * @function
   * @param {String} panelType
   */
  toggle: function (panelType) {
    if (this.isExpanded(panelType)) {
      this.close();
    } else {
      this.open(panelType);
    }
  },

  /**
   * @function
   * @param {String} classStr
   */
  setActiveButton: function (classStr) {
    if (classStr) {
      this.$sidebarElement.addClass('has-active-panel');
      this.$sidebarSecondary.find('.active').removeClass('active');
      this.$sidebarSecondary.find('.button.' + classStr).addClass('active');
    } else {
      this.$sidebarElement.removeClass('has-active-panel');
      this.$sidebarSecondary.find('.active').removeClass('active');
    }
  },

  /**
   * @function
   * @param {String} panelType
   * @returns {*}
   */
  isExpanded: function (panelType) {
    if (panelType) {
      return this.$panelElement.find('.' + panelType).hasClass('visible');
    } else {
      return this.$panelElement.hasClass('visible');
    }
  },

  /**
   * @function
   * @param {String} classStr
   * @param {String} tooltip
   */
  updateSaveButton: function (classStr, tooltip) {
    this.$saveButton.attr({
      'class':        'button save ' + (classStr || ''),
      'data-tooltip': tooltip || ''
    });
  },

  /**
   * @function
   */
  updatePublishButton: function () {
    var $icon = this.$publishButton.find('.icon');

    if (SLConfig.deck.visibility === SL.models.Deck.VISIBILITY_SELF) {
      $icon.removeClass('i-unlock-stroke').addClass('i-lock-stroke');
    } else if (SLConfig.deck.visibility === SL.models.Deck.VISIBILITY_TEAM) {
      $icon.removeClass('i-lock-stroke').addClass('i-unlock-stroke');
    } else if (SLConfig.deck.visibility === SL.models.Deck.VISIBILITY_ALL) {
      $icon.removeClass('i-lock-stroke').addClass('i-unlock-stroke');
    }

    if (SLConfig.deck.visibility === SL.models.Deck.VISIBILITY_SELF ||
      SL.util.user.isPro()) {
      this.$publishButton.attr('data-tooltip', SL.locale.get('SlideBar.base.publish_tip'));
    } else {
      this.$publishButton.attr(
        'data-tooltip',
        '您需要一个专业帐户才能<br> 才能设置自己可见. 点击了解更多.');
    }
  },

  /**
   * @function
   * @param {String} classStr
   */
  updateArrangeButton: function (classStr) {
    this.setActiveButton(classStr === 'arranging' ? 'arrange' : null);
  },

  /**
   * @function
   */
  updateUndoButton: function () {
    if (this.$undoButton) {
      this.$undoButton.toggleClass(
        'disabled', !SL.editor.controllers.History.canUndo());
    }
  },

  /**
   * @function
   * @param {Event} evt
   */
  onSaveClicked: function (evt) {
    evt.preventDefault();
    this.saveClicked.dispatch();
  },

  /**
   * @function
   * @param {Event} evt
   */
  onPreviewClicked: function (evt) {
    evt.preventDefault();
    this.previewClicked.dispatch();
  },

  /**
   * @function
   * @param {Event} evt
   */
  onUndoClicked: function (evt) {
    evt.preventDefault();
    SL.editor.controllers.History.undo({ignoreMode: true});
    SL.analytics.trackEditor('Undo clicked');
  },

  /**
   * @function
   * @returns {boolean}
   */
  onExportClicked: function () {
    var sections   = $('.reveal .slides').children().map(function () {
      var $section = $(this).clone();

      $section.find('section').add($section).each(function () {
        var $this = $(this),
          $block = $.map(this.attributes, function (attr) {
            return attr.name;
          });

        $.each($block, function (index, attr) {
          $this.removeAttr(attr);
        });
      });

      return $section.wrap('<div>').parent().html();
    }).toArray().join('');

    sections = '<div class="slides">' + sections + '</div>';
    $('.sidebar .export textarea').text(SL.util.html.indent(sections));

    this.toggle('export');
    return false;
  },

  /**
   * @function
   * @returns {boolean}
   */
  onImportClicked: function () {
    this.toggle('import');
    return false;
  },

  /**
   * @function
   * @returns {boolean}
   */
  onArrangeClicked: function () {
    this.close();
    SL.editor.controllers.Mode.toggle('arrange');
    return false;
  },

  /**
   * @function
   * @returns {boolean}
   */
  onSettingsClicked: function () {
    this.toggle('settings');
    return false;
  },

  /**
   * @function
   * @returns {boolean}
   */
  onRevisionsClicked: function () {
    this.toggle('revisions');
    return false;
  },

  /**
   * @function
   * @returns {boolean}
   */
  onMediaLibraryClicked: function () {
    SL.popup.open(SL.editor.components.medialibrary.MediaLibrary);
    return false;
  },

   /**
   * @function
   * @returns {boolean}
   */
  //切片库
  onSectionLibraryClicked: function () {
    SL.popup.open(SL.editor.components.sectionlibrary.SectionLibrary);
    return false;
  },


  /**
   * @function
   * @returns {boolean}
   */
  onStyleClicked: function () {
    this.toggle('style');
    return false;
  },

  /**
   * @function
   * @returns {boolean}
   */
  onShareClicked: function () {
    SL.popup.open(SL.components.decksharer.DeckSharer, {
      deck: SL.current_deck
    });

    return false;
  },

  /**
   * @function
   * @param {Event} evt
   */
  onPublishClicked: function (evt) {
    evt.preventDefault();

    if (SL.util.user.isPro() ||
      SLConfig.deck.visibility === SL.models.Deck.VISIBILITY_SELF) {
      var data = [];

      data.push({
        html:     SL.locale.get('Deck_Visibility_Change_Self'),
        selected: SLConfig.deck.visibility === SL.models.Deck.VISIBILITY_SELF,
        callback: (function () {
          SLConfig.deck.visibility = SL.models.Deck.VISIBILITY_SELF;
          SL.view.saveVisibility();
          this.updatePublishButton();

          SL.analytics.trackEditor('Visibility changed', 'self');
        }).bind(this)
      });

      if (SL.current_user.isEnterprise()) {
        data.push({
          html:      SL.locale.get('Deck_Visibility_Change_Team'),
          selected:  SLConfig.deck.visibility === SL.models.Deck.VISIBILITY_TEAM,
          className: 'divider',
          callback: (function () {
            SLConfig.deck.visibility = SL.models.Deck.VISIBILITY_TEAM;
            SL.view.saveVisibility();
            this.updatePublishButton();

            SL.analytics.trackEditor('Visibility changed', 'team');
          }).bind(this)
        });
      }

      data.push({
        html:     SL.locale.get('Deck_Visibility_Change_All'),
        selected: SLConfig.deck.visibility === SL.models.Deck.VISIBILITY_ALL,
        callback: (function () {
          SLConfig.deck.visibility = SL.models.Deck.VISIBILITY_ALL;
          SL.view.saveVisibility();
          this.updatePublishButton();

          SL.analytics.trackEditor('Visibility changed', 'all');
        }).bind(this)
      });

      SL.prompt({
        anchor:    this.$publishButton,
        alignment: 'r',
        type:      'select',
        data:      data
      });

      SL.analytics.trackEditor('Visibility menu opened', SLConfig.deck.visibility);
    } else {
      window.open('/pricing');
      SL.analytics.trackEditor('Click upgrade link', 'visibility button');
    }
  },

  /**
   * @function
   * @param {Event} evt
   */
  onPanelElementClicked: function (evt) {
    if (evt.target === this.$panelElement.get(0)) {
      this.close();
    }
  }
});

SL('editor.components.sidebar').Base         = Class.extend({
  /**
   * Constructor SL.editor.components.sidebar.Base Instance
   *
   * @function
   */
  init: function () {
    this.saved = false;

    this.onWindowResize    = this.onWindowResize.bind(this);
    this.onDocumentKeyDown = this.onDocumentKeyDown.bind(this);
    this.onSaveClicked     = this.onSaveClicked.bind(this);
    this.onCancelClicked   = this.onCancelClicked.bind(this);
    this.onCloseClicked    = this.onCloseClicked.bind(this);

    this.render();
    this.bind();
    this.createSignals();
  },

  /**
   * @function
   */
  render: function () {
    this.$bodyElement   = this.$domElement.find('.panel-body');
    this.$footerElement = this.$domElement.find('.panel-footer');
    this.scrollShadow   = new SL.components.ScrollShadow({
      $parentElement:  this.$domElement,
      $contentElement: this.$bodyElement,
      $footerElement:  this.$footerElement,
      resizeContent:   false
    });
  },

  /**
   * @function
   */
  bind: function () {
    this.$domElement.find('.save').on('click', this.onSaveClicked);
    this.$domElement.find('.cancel').on('click', this.onCancelClicked);
    this.$domElement.find('.close').on('click', this.onCloseClicked);
  },

  /**
   * @function
   */
  createSignals: function () {
    this.onclose = new signals.Signal();
  },

  /**
   * @function
   */
  buffer: function () {
    this.config = JSON.parse(JSON.stringify(SLConfig));
  },

  /**
   * @function
   */
  open: function () {
    this.saved = false;
    this.$domElement.addClass('visible');

    this.layout();

    $(window).on('resize', this.onWindowResize);
    $(document).on('keydown', this.onDocumentKeyDown);
  },

  /**
   * @function
   */
  close: function () {
    this.$domElement.removeClass('visible');

    $(window).off('resize', this.onWindowResize);
    $(document).off('keydown', this.onDocumentKeyDown);

    if (this.saved === false) {
      this.revert();
    }
  },

  /**
   * @function
   */
  layout: function () {
    if (this.$bodyElement.length && this.$footerElement.length) {
      var scrollHeight = this.$bodyElement.get(0).scrollHeight,
        footHeight = parseInt(this.$footerElement.css('margin-top'), 10),
        height = this.$footerElement.outerHeight(true) + footHeight;

      this.$domElement.toggleClass(
        'overflowing', scrollHeight > (window.innerHeight - height));
    }

    this.scrollShadow.sync();
  },

  /**
   * @function
   */
  revert: function () {
    this.buffer();
    this.updateSelection();
    this.applySelection();
  },

  /**
   * @function
   * @returns {boolean}
   */
  save: function () {
    this.saved = true;
    return true;
  },

  /**
   * @function
   */
  updateSelection: function () {},

  /**
   * @function
   */
  applySelection: function () {},

  /**
   * @function
   */
  onSaveClicked: function () {
    if (this.save()) {
      this.onclose.dispatch();
    }
  },

  /**
   * @function
   */
  onCancelClicked: function () {
    this.onclose.dispatch();
  },

  /**
   * @function
   */
  onCloseClicked: function () {
    this.onclose.dispatch();
  },

  /**
   * @function
   */
  onDocumentKeyDown: function () {},

  /**
   * @function
   */
  onWindowResize: function () {
    this.layout();
  }
});

SL('editor.components.sidebar').Export       = SL.editor.components.sidebar.Base.extend({
  /**
   * Constructor SL.editor.components.sidebar.Export Instance
   *
   * @function
   */
  init: function () {
    this.$domElement            = $('.sidebar-panel .export');
    this.$htmlOutputElement     = this.$domElement.find('.deck-html-contents');
    this.$cssOutputElement      = this.$domElement.find('.deck-css-contents');
    this.$downloadRevealElement = this.$domElement.find('.section.download-reveal');
    this.$downloadHTMLButton    = this.$domElement.find('.download-html-button');
    this.$downloadPDFElement    = this.$domElement.find('.section.download-pdf');
    this.$downloadZIPElement    = this.$domElement.find('.section.download-zip');

    if (this.$downloadPDFElement.length) {
      this.pdf =
        new SL.editor.components.sidebar.Export.PDF(this.$downloadPDFElement);
      this.pdf.heightChanged.add(this.layout.bind(this));
    }

    if (this.$downloadZIPElement.length) {
      this.zip =
        new SL.editor.components.sidebar.Export.ZIP(this.$downloadZIPElement);
      this.zip.heightChanged.add(this.layout.bind(this));
    }

    this.setupDropbox();
    this._super();
  },

  /**
   * @function
   */
  setupDropbox: function () {
    this.$dropboxElement  = this.$domElement.find('.section.dropbox');
    this.$dropboxContents = this.$dropboxElement.find('.contents');

    this.dropboxPollGoal  = null;

    this.onDropboxPoll        = this.onDropboxPoll.bind(this);
    this.onDropboxPollTimeout = this.onDropboxPollTimeout.bind(this);

    this.dropboxPollJob = new SL.helpers.PollJob({
      interval: 2000,
      timeout:  300000
    });
    this.dropboxPollJob.polled.add(this.onDropboxPoll);
    this.dropboxPollJob.ended.add(this.onDropboxPollTimeout);
  },

  /**
   * @function
   */
  bind: function () {
    this._super();

    if (this.$downloadHTMLButton) {
      this.$downloadHTMLButton.on('click', this.onDownloadHTMLClicked.bind(this));
    }

    if (this.$htmlOutputElement) {
      this.$htmlOutputElement.on('click', this.onHTMLOutputClicked.bind(this));
    }

    if (this.$cssOutputElement) {
      this.$cssOutputElement.on('click', this.onCSSOutputClicked.bind(this));
    }

    this.$domElement.find('.upgrade-button').on('click', function () {
      SL.analytics.trackEditor('Click upgrade link', 'export panel');
    });
  },

  /**
   * @function
   */
  open: function () {
    this._super();

    this.syncRevealExport();
    this.checkDropboxStatus();
    this.checkOnlineContent();
  },

  /**
   * @function
   */
  close: function () {
    this._super();

    if (this.dropboxStatusXHR) {
      this.dropboxStatusXHR.abort();
    }

    this.dropboxPollJob.stop();
    this.dropboxPollGoal = null;
  },

  /**
   * @function
   */
  syncRevealExport: function () {
    if (SL.view.isDeveloperMode()) {
      this.$downloadRevealElement.show();

      if (this.$htmlOutputElement.length) {
        var theme = SL.view.getCurrentTheme(),
          font  = 'theme-font-' + theme.get('font'),
          color = 'theme-color-' + theme.get('color'),
          html  = [
            '<div class="' + font + ' ' + color +
              '" style="width: 100%; height: 100%;">',
              '<div class="reveal">',
                '<div class="slides">',
                  SL.editor.controllers.Serialize.getDeckAsString({
                    removeSlideIds: true,
                    removeBlockIds: true,
                    removeTextPlaceholders: true
                  }),
                '</div>',
              '</div>',
            '</div>'].join('');

        this.$htmlOutputElement.val(SL.util.html.indent(html));
      }

      if (this.$cssOutputElement.length) {
        this.$cssOutputElement.val('Loading...');

        $.ajax({
          url: SL.config.ASSET_URLS['offline-v2.css'],
          context: this
        }).done(function (data) {
          var userCss = $('#user-css-output').html() || '',
            themeCss  = $('#theme-css-output').html() || '';

          this.$cssOutputElement.val([
            '<style>',
              data, themeCss, userCss,
            '</style>'].join('\n'));
        }).fail(function () {
          this.$cssOutputElement.val('Failed to load CSS...');
        });
      }
    } else {
      this.$downloadRevealElement.hide();
    }
  },

  /**
   * @function
   */
  checkDropboxStatus: function () {
    if (this.$dropboxElement.length !== 0) {
      if (this.dropboxStatusXHR) {
        this.dropboxStatusXHR.abort();
      }

      this.dropboxStatusXHR =
        $.get(SL.config.AJAX_SERVICES_USER).done((function (data) {
          var isPoll = typeof this.dropboxPollGoal === "string";

          if (data && data.dropbox_connected) {
            this.$dropboxContents.html([
              '<p>Your changes are automatically ' +
                'synced with Dropbox. Press the button below if you wish to ' +
                'disconnect. <a href="#" target="_blank">Learn more.</a>',
              '</p>',
              '<button class="button negative disconnect-dropbox l">',
                'Disconnect',
              '</button>'].join(''));
            this.$dropboxContents
              .find('button')
              .on('click', this.onDropboxDisconnectClicked.bind(this));

            if (isPoll && this.dropboxPollGoal === 'connected') {
              this.dropboxPollJob.stop();
              this.dropboxPollGoal = null;

              $.ajax({
                type: 'POST',
                url: SL.config.AJAX_DROPBOX_SYNC_DECK(SLConfig.deck.id),
                data: {}
              });
            }

            this.layout();
          } else {
            this.$dropboxContents.html([
              '<p>Connect with Dropbox to automatically ' +
                'sync your work. Decks in your Dropbox folder can be viewed ' +
                'offline. <a href="#" ' +
                'target="_blank">Learn more.</a>',
              '</p>',
              '<button class="button connect-dropbox l">',
                'Connect Dropbox',
              '</button>'].join(''));
            this.$dropboxContents.find('button')
              .on('click', this.onDropboxConnectClicked.bind(this));

            if (isPoll && this.dropboxPollGoal === 'disconnected') {
              this.dropboxPollJob.stop();
              this.dropboxPollGoal = null;
            }

            this.layout();
          }

          this.dropboxStatusXHR = null;
        }).bind(this));
    }
  },

  /**
   * @function
   */
  checkOnlineContent: function () {
    this.$bodyElement.find('.section.online-content-warning').remove();

    if ($('.reveal .slides [data-block-type="iframe"]').length) {
      this.$bodyElement.prepend([
        '<div class="section online-content-warning">',
          'Looks like there are iframes in this presentation. ' +
          'Note that since iframes load content from other servers ' +
          'they won\'t work without an internet connection.',
        '</div>'].join(''));
    }
  },

  /**
   * @function
   */
  onDropboxConnectClicked: function () {
    this.dropboxPollGoal = 'connected';
    this.dropboxPollJob.start();
    SL.util.openPopupWindow(
      SL.config.AJAX_DROPBOX_CONNECT, 'Sync with Dropbox', 1024, 650);
  },

  /**
   * @function
   */
  onDropboxDisconnectClicked: function () {
    this.dropboxPollGoal = 'disconnected';
    this.dropboxPollJob.start();
    window.open(SL.config.AJAX_DROPBOX_DISCONNECT);
  },

  /**
   * @function
   */
  onDropboxPoll: function () {
    this.checkDropboxStatus();
  },

  /**
   * @function
   */
  onDropboxPollTimeout: function () {},

  /**
   * @function
   */
  onDownloadHTMLClicked: function () {
    window.open(SL.config.AJAX_EXPORT_DECK(
      SLConfig.deck.user.username, SLConfig.deck.slug || SLConfig.deck.id));

    //SL.analytics.trackEditor('Download as HTML');
  },

  /**
   * @function
   */
  onHTMLOutputClicked: function () {
    this.$htmlOutputElement.select();
  },

  /**
   * @function
   */
  onCSSOutputClicked: function () {
    this.$cssOutputElement.select();
  }
});

SL('editor.components.sidebar.Export').PDF   = Class.extend({
  /**
   * Constructor SL.editor.components.sidebar.Export.PDF Instance
   *
   * @function
   * @param {*|jQuery|HTMLElement} $domElement
   */
  init: function ($domElement) {
    this.$domElement = $domElement;

    this.$downloadButton = this.$domElement.find('.download-pdf-button');
    this.$downloadButton.on('click', this.onDownloadClicked.bind(this));

    this.$downloadButtonLabel =
      this.$domElement.find('.download-pdf-button .label');

    this.downloadButtonLoader =
      window.Ladda.create(this.$downloadButton.get(0));

    this.onPoll        = this.onPoll.bind(this);
    this.onPollTimeout = this.onPollTimeout.bind(this);

    this.exportID = null;

    this.pollJob = new SL.helpers.PollJob({
      interval: 1000,
      timeout:  180000
    });
    this.pollJob.polled.add(this.onPoll);
    this.pollJob.ended.add(this.onPollTimeout);

    this.heightChanged = new window.signals.Signal();

    this.setIsLoading(false);
  },

  /**
   * @function
   */
  startExport: function () {
    if (this.exportXHR) {
      this.exportXHR.abort();
    }

    this.exportXHR = $.ajax({
      url:   SL.config.AJAX_EXPORT_START(SLConfig.deck.id),
      type: 'POST',
      context: this
    }).done((function (data) {
      this.exportID  = data.id;
      this.exportXHR = null;
      this.pollJob.start();
    }).bind(this)).fail((function () {
      this.setIsLoading(false);
      SL.notify(SL.locale.get('SlideBar.pdf.export_err'), 'negative');
    }).bind(this));
  },

  /**
   * @function
   * @param {boolean} isStart
   */
  setIsLoading: function (isStart) {
    if (isStart) {
      this.$downloadButtonLabel
        .text(SL.locale.get('SlideBar.pdf.btn_work'));

      if (this.downloadButtonLoader) {
        this.downloadButtonLoader.start();
      }
    } else {
      this.$downloadButtonLabel.text(SL.locale.get('SlideBar.pdf.btn'));

      if (this.downloadButtonLoader) {
        this.downloadButtonLoader.stop();
      }
    }
  },

  /**
   * @function
   * @param {String} url
   */
  showPreviousExport: function (url) {
    if (typeof url === "string" && url.length) {
      if (this.$previousExport) {
        this.$previousExport.remove();
        this.$previousExport = null;
      }

      var name = (SLConfig.deck.slug || 'deck') + '.pdf';

      this.$previousExport =
        $('<p class="previous-pdf">Recent: <a href="' + url +
            '" download="' + name + '" target="_blank">' + name +
          '</a></p>').appendTo(this.$domElement);

      $('html').addClass('editor-exported-pdf-successfully');
      this.heightChanged.dispatch();
    }
  },

  /**
   * @function
   */
  onDownloadClicked: function () {
    this.setIsLoading(true);
    this.startExport();
    SL.analytics.trackEditor('Download as PDF');
  },

  /**
   * @function
   */
  onPoll: function () {
    if (this.pdfStatusXHR) {
      this.pdfStatusXHR.abort();
    }

    this.pdfStatusXHR =
      $.get(SL.config.AJAX_EXPORT_STATUS(SLConfig.deck.id, this.exportID))
        .done((function (data) {
          if (typeof data.url === "string" && data.url.length) {
            var $win = $('<iframe style="display: none;">');

            $win.appendTo(document.body);
            $win.attr('src', data.url);

            setTimeout($win.remove, 1000);

            this.showPreviousExport(data.url);
            this.setIsLoading(false);
            this.pollJob.stop();
          }
        }).bind(this));
  },

  /**
   * @function
   */
  onPollTimeout: function () {
    this.setIsLoading(false);
    SL.notify(SL.locale.get('SlideBar.pdf.export_err'), 'negative');
  }
});

SL('editor.components.sidebar.Export').ZIP   = Class.extend({
  /**
   * Constructor SL.editor.components.sidebar.Export.ZIP Instance
   *
   * @function
   * @param {*|jQuery|HTMLElement} $domElement
   */
  init: function ($domElement) {
    this.$domElement = $domElement;

    this.$downloadButton = this.$domElement.find('.download-zip-button');
    this.$downloadButton.on('click', this.onDownloadClicked.bind(this));

    this.$downloadButtonLabel =
      this.$domElement.find('.download-zip-button .label');

    this.downloadButtonLoader =
      window.Ladda.create(this.$downloadButton.get(0));

    this.onPoll        = this.onPoll.bind(this);
    this.onPollTimeout = this.onPollTimeout.bind(this);

    this.exportID = null;

    this.pollJob = new SL.helpers.PollJob({
      interval: 1000,
      timeout:  180000
    });
    this.pollJob.polled.add(this.onPoll);
    this.pollJob.ended.add(this.onPollTimeout);

    this.heightChanged = new window.signals.Signal();

    this.setIsLoading(false);
  },

  /**
   * @function
   */
  startExport: function () {
    if (this.exportXHR) {
      this.exportXHR.abort();
    }

    this.exportXHR = $.ajax({
      url: SL.config.AJAX_EXPORT_START(SLConfig.deck.id),
      type: 'POST',
      context: this,
      data: {
        'export': {
          export_type: 'zip'
        }
      }
    }).done((function (data) {
      this.exportID  = data.id;
      this.exportXHR = null;
      this.pollJob.start();
    }).bind(this)).fail((function () {
      this.setIsLoading(false);
      SL.notify(SL.locale.get('SlideBar.zip.export_err'), 'negative');
    }).bind(this));
  },

  /**
   * @function
   * @param {Boolean} isStart
   */
  setIsLoading: function (isStart) {
    if (isStart) {
      this.$downloadButtonLabel
        .text(SL.locale.get('SlideBar.zip.btn_work'));

      if (this.downloadButtonLoader) {
        this.downloadButtonLoader.start();
      }
    } else {
      this.$downloadButtonLabel.text(SL.locale.get('SlideBar.zip.btn'));

      if (this.downloadButtonLoader) {
        this.downloadButtonLoader.stop();
      }
    }
  },

  /**
   * @function
   * @param {String} url
   */
  showPreviousExport: function (url) {
    if (typeof url === "string" && url.length) {
      if (this.$previousExport) {
        this.$previousExport.remove();
        this.$previousExport = null;
      }

      var name = (SLConfig.deck.slug || 'deck') + '.zip';

      this.$previousExport =
        $('<p class="previous-zip">Recent: <a href="' + url +
            '" download="' + name + '" target="_blank">' + name +
          '</a></p>').appendTo(this.$domElement);
      $('html').addClass('editor-exported-zip-successfully');
      this.heightChanged.dispatch();
    }
  },

  /**
   * @function
   */
  onDownloadClicked: function () {
    this.setIsLoading(true);
    this.startExport();
    SL.analytics.trackEditor('Download as ZIP');
  },

  /**
   * @function
   */
  onPoll: function () {
    if (this.zipStatusXHR) {
      this.zipStatusXHR.abort();
    }

    this.zipStatusXHR =
      $.get(SL.config.AJAX_EXPORT_STATUS(SLConfig.deck.id, this.exportID))
        .done((function (data) {
          if (typeof data.url === "string" && data.url.length) {
            var $win = $('<iframe style="display: none;">');

            $win.appendTo(document.body);
            $win.attr('src', data.url);

            setTimeout($win.remove, 1000);

            this.showPreviousExport(data.url);
            this.setIsLoading(false);
            this.pollJob.stop();
          }
        }).bind(this));
  },

  /**
   * @function
   */
  onPollTimeout: function () {
    this.setIsLoading(false);
    SL.notify(SL.locale.get('SlideBar.zip.export_err'), 'negative');
  }
});

SL('editor.components.sidebar').ImportFile   = Class.extend({
  /**
   * Constructor SL.editor.components.sidebar.ImportFile Instance
   *
   * @function
   * @param {Object} panel
   */
  init: function (panel) {
    this.panel           = panel;
    this.importCompleted = new signals.Signal();

    this.render();
    this.bind();
    this.reset();

    SL.editor.controllers.Stream.connect();
  },

  /**
   * @function
   */
  render: function () {
    this.$domElement   = $('.sidebar-panel .import .import-from-file');
    this.$browseButton = this.$domElement.find('.import-browse-button');
  },

  /**
   * @function
   */
  bind: function () {
    this.onFileInputChange = this.onFileInputChange.bind(this);
    this.onSocketMessage   = this.onSocketMessage.bind(this);
  },

  /**
   * @function
   */
  reset: function () {
    this.hideOverlay();
    this.stopTimeout();
    this.createFileInput();
  },

  /**
   * @function
   */
  createFileInput: function () {
    if (this.$browseFileInput) {
      this.$browseFileInput.remove();
      this.$browseFileInput.off('change', this.onFileInputChange);
    }

    this.$browseButton.off('click');
    this.$browseButton.removeClass('disabled');
    this.$browseButton.text(SL.locale.get('SlideBar.import.select_btn'));

    this.$browseFileInput = $('<input class="file-input" type="file">')
      .appendTo(this.$browseButton);
    this.$browseFileInput.on('change', this.onFileInputChange);
  },

  /**
   * @function
   * @param {Event} evt
   * @returns {null}
   */
  onFileInputChange: function (evt) {
    evt.preventDefault();

    var file = this.$browseFileInput.get(0).files[0];

    if (file) {
      if (!file || file.type !== '' &&
        !file.type.match(/powerpoint|presentationml|pdf/)) {
        SL.notify('Only PDF or PPT files, please');
        return void this.createFileInput();
      }

      if (typeof file.size === "number" &&
        file.size / 1024 > SL.config.MAX_IMPORT_UPLOAD_SIZE.maxsize) {
        SL.notify('No more than ' +
          Math.round(SL.config.MAX_IMPORT_UPLOAD_SIZE.maxsize / 1000) +
          'mb please', 'negative');
        return void this.createFileInput();
      }

      SL.analytics.trackEditor('Import PDF/PPT', 'file selected');

      var fileName = file.name || 'untitled';
      fileName = fileName.trim();
      //fileName = fileName.replace(/\s/g, '-').replace(/[^a-zA-Z0-9-_\.]*/g, '');

      this.enterProcessingState();

      $.ajax({
        type: 'POST',
        url:   SL.config.AJAX_PDF_IMPORT_NEW,
        data: {
          deck_id:  SLConfig.deck.id,
          filename: fileName
        },
        context: this
      }).done(function (data) {
        this.uploadFile(data.id, data.upload_url);
      }).fail(function () {
        SL.notify(SL.locale.get('SlideBar.import.upload_err'), 'negative');
        this.hideOverlay();
      });
    } else {
      SL.notify(SL.locale.get('SlideBar.import.upload_err'), 'negative');
    }
  },

  /**
   * @function
   * @param {String|Number|*} id
   * @param {String|*}        url
   * @returns {null}
   */
  uploadFile: function (id, url) {
    var file = this.$browseFileInput.get(0).files[0];

    if (typeof url !== "string" || url.length < 3) {
      SL.notify(
        'Invalid upload URL, try reopening the imports page',
        'negative');
      return void this.createFileInput();
    }

    SL.analytics.trackEditor('Import PDF/PPT', 'upload started');

    var fileUploader = new SL.helpers.FileUploader({
      file:        file,
      method:     'PUT',
      service:     url,
      timeout:     60000
    });
    fileUploader.succeeded.add((function () {
      fileUploader.destroy();

      this.createFileInput();
      this.startTimeout();

      SL.analytics.trackEditor('Import PDF/PPT', 'upload complete');

      $.ajax({
        type: 'PUT',
        url: SL.config.AJAX_PDF_IMPORT_UPLOADED(id),
        data: {
          'import': {
            upload_complete: true
          }
        },
        context: this
      }).fail(function () {
        this.hideOverlay();
        SL.notify('An error occurred while processing your file', 'negative');
      }).done(function () {
        SL.analytics.trackEditor('Import PDF/PPT', 'upload_complete sent');
      });
    }).bind(this));
    fileUploader.progressed.add((function (progess) {
      this.setProgress(25 * progess);
    }).bind(this));
    fileUploader.failed.add((function () {
      fileUploader.destroy();

      this.createFileInput();
      this.hideOverlay();

      SL.notify('An error occurred while uploading your file', 'negative');
    }).bind(this));
    fileUploader.upload();
  },

  /**
   * @function
   * @param {String|Object|*} state
   * @param {String}          title
   */
  showOverlay: function (state, title) {
    if (!this.$overlay) {
      this.$overlay       =
        $('<div class="import-overlay">').appendTo(document.body);
      this.$overlayInner  =
        $('<div class="import-overlay-inner">').appendTo(this.$overlay);
      this.$overlayHeader =
        $('<div class="import-overlay-header">').appendTo(this.$overlayInner);
      this.$overlayBody   =
        $('<div class="import-overlay-body">').appendTo(this.$overlayInner);
      this.$overlayFooter =
        $('<div class="import-overlay-footer">').appendTo(this.$overlayInner);

      SL.editor.controllers.Stream.get().messageReceived.add(this.onSocketMessage);

      setTimeout((function () {
        this.$overlay.addClass('visible');
      }).bind(this), 1);
    }

    this.$overlayInner.attr('data-state', state);
    this.$overlayHeader.html('<h3>' + title + '</h3>');
    this.$overlayBody.empty();
    this.$overlayFooter.empty();
  },

  /**
   * @function
   */
  hideOverlay: function () {
    if (this.$overlay) {
      this.$overlay.remove();
      this.$overlay = null;
      this.stopTimeout();

      SL.editor.controllers.Stream.get().messageReceived.remove(this.onSocketMessage);
    }
  },

  /**
   * @function
   */
  enterProcessingState: function () {
    this.showOverlay('processing', 'Processing');

    this.$overlayBody.html([
      '<div class="progress">',
        '<div class="progress-text">Uploading</div>',
        '<div class="progress-spinner spinner" data-spinner-color="#333"></div>',
        '<div class="progress-inner">',
          '<div class="progress-text">Uploading</div>',
        '</div>',
      '</div>'].join(''));

    SL.util.html.generateSpinners();
  },

  /**
   * @function
   * @param {Object} data
   */
  enterErrorState: function (data) {
    data = data || {};

    this.showOverlay('error', 'Something went wrong...');

    this.$overlayBody.html([
      '<div class="error">',
        '<p class="error-text">' +
          (data.message || 'Sorry about that. We\'re looking into it.') +
        '</p>',
      '</div>'].join(''));
    this.$overlayFooter.html([
      '<button class="button l outline cancel-button">Close</button>'
    ].join(''));
    this.$overlayFooter.find('.cancel-button').on('click', (function () {
      this.hideOverlay();
    }).bind(this));

    SL.util.html.generateSpinners();
  },

  /**
   * @function
   * @param {Object} data
   */
  enterFinishedState: function (data) {
    SL.analytics.trackEditor('Import PDF/PPT', 'import complete');

    var $preview = null;
    this.stopTimeout();

    if (data.output && data.output.length > 0) {
      this.showOverlay('finished', 'Finished');

      this.$overlayBody.html([
        '<p>The following ' +
          '<strong><span class="slide-count"></span> slides</strong> will be added.',
        '</p>',
        '<div class="preview"></div>',
        '<div class="options">',
          '<div class="sl-checkbox outline">',
            '<input id="import-append-checkbox" value="" type="checkbox">',
            '<label for="import-append-checkbox" ' +
              'data-tooltip="Append the imported slides after the existing ' +
              'slides instead of replacing them." data-tooltip-maxwidth="300" ' +
              'data-tooltip-delay="500">Append slides</label>',
          '</div>',
        '</div>'].join(''));
      this.$overlayFooter.html([
        '<button class="button l outline cancel-button">',
          SL.locale.get('Cancel'),
        '</button>',
        '<button class="button l positive confirm-button">',
          SL.locale.get('Import'),
        '</button>'
      ].join(''));

      $preview = this.$overlayBody.find('.preview');

      var setSlideCount = (function () {
        this.$overlayBody.find('.slide-count')
          .text($preview.find('.preview-slide').not('.excluded').length);
      }).bind(this);

      data.output.forEach((function (outputUrl) {
        var $preSlide = $('<div class="preview-slide">');

        $preSlide.attr({
          'data-background-image':          outputUrl,
          'data-background-image-original': outputUrl
        });
        $preSlide.appendTo($preview);
        $preSlide.on('click', (function () {
          if ($preSlide.hasClass('excluded')) {
            $preSlide.removeClass('excluded').html('');
          } else {
            $preSlide.addClass('excluded').html([
              '<div class="preview-slide-excluded-overlay">',
                '<span class="icon i-denied"></span>',
              '</div>'].join(''));
          }

          setSlideCount();
        }).bind(this));
      }).bind(this));

      $preview.on('scroll', this.loadVisiblePreviewThumbs.bind(this));
      this.loadVisiblePreviewThumbs();
      setSlideCount();
    } else {
      this.showOverlay('finished-error', 'Unexpected Error');
      this.$overlayBody.html('No slides were returned from the server.');
      this.$overlayFooter.html([
        '<button class="button l outline cancel-button">',
          SL.locale.get('Close'),
        '</button>'].join(''));
    }

    this.$overlayFooter.find('.cancel-button').on('click', (function () {
      this.hideOverlay();
    }).bind(this));
    this.$overlayFooter.find('.confirm-button').on('click', (function () {
      var $slides = $preview.find('.preview-slide')
          .not('.excluded')
          .map(function () {
            return [
              '<section data-background-image="',
                $(this).attr('data-background-image-original'),
                '" data-background-size="contain"></section>'].join('');
          }),
        isAddTo = this.$overlayBody.find('#import-append-checkbox').is(':checked');

      SL.editor.controllers.Markup.importSlides($slides, !isAddTo);

      if (!isAddTo) {
        SLConfig.deck.background_transition = 'none';
        window.Reveal.configure({
          backgroundTransition: SLConfig.deck.background_transition
        });
      }

      this.hideOverlay();
      this.importCompleted.dispatch();
    }).bind(this));
  },

  /**
   * @function
   */
  loadVisiblePreviewThumbs: function () {
    var $preview = this.$overlayBody.find('.preview');

    if ($preview.length) {
      var scrollTop = $preview.scrollTop(),
        preHeight   = scrollTop + $preview.outerHeight(),
        slideHeight = $preview.find('.preview-slide').first().outerHeight();

      $preview.find('.preview-slide').not('.loaded').each(function (index, slide) {
        var offsetTop = slide.offsetTop,
          height      = offsetTop + slideHeight;

        if (height > scrollTop && preHeight > offsetTop) {
          slide = $(slide);
          slide.css(
            'background-image',
            'url(' + slide.attr('data-background-image') + ')');
          slide.addClass('loaded');
        }
      });
    }
  },

  /**
   * @function
   * @param {Number} progress
   */
  setProgress: function (progress) {
    this.$overlayBody.find('.progress-inner')
      .css('width', Math.round(progress) + '%');
  },

  /**
   * @function
   */
  startTimeout: function () {
    clearTimeout(this.importTimeout);

    this.importTimeout = setTimeout((function () {
      SL.notify('Timed out while trying to import. Please try again.', 'negative');
      this.hideOverlay();
    }).bind(this), SL.config.IMPORT_SOCKET_TIMEOUT);
  },

  /**
   * @function
   */
  stopTimeout: function () {
    clearTimeout(this.importTimeout);
  },

  /**
   * @function
   * @param {Object} data
   */
  onSocketMessage: function (data) {
    if (data) {
      var action = data.type.split(':')[0],
        status   = data.type.split(':')[1];

      if (action === 'import') {
        if (status === 'complete') {
          this.enterFinishedState(data);
        } else if (status === 'error') {
          this.enterErrorState(data);
        } else {
          this.startTimeout();
          this.$overlayBody.find('.progress-text').text(data.message);
          this.setProgress(25 + 75 * data.progress);
        }
      }
    }
  }
});

SL('editor.components.sidebar').ImportReveal = Class.extend({
  /**
   * Constructor SL.editor.components.sidebar.ImportReveal Instance
   *
   * @function
   * @param {Object} panel
   */
  init: function (panel) {
    this.panel = panel;

    this.$domElement          = $('.sidebar-panel .import .import-from-reveal');
    this.$importInput         = this.$domElement.find('.import-input');
    this.$importStatus        = this.$domElement.find('.import-status');
    this.$importStatusText    = this.$domElement.find('.import-status .text');
    this.$importStatusIcon    = this.$domElement.find('.import-status .icon');
    this.$importStatusProceed = this.$domElement.find('.import-status .proceed');

    this.importCompleted = new signals.Signal();
    this.bind();
  },

  /**
   * @function
   */
  bind: function () {
    this.$importInput.on('input', this.onInputChange.bind(this));
    this.$importStatusProceed.on('click', this.onImportConfirmed.bind(this));
  },

  /**
   * @function
   */
  reset: function () {
    this.$importInput.val('');
    this.$importStatus.removeClass('visible');
  },

  /**
   * @function
   * @returns {*}
   */
  validate: function () {
    var $input, statusText, val = $.trim(this.$importInput.val());

    if (val.length > 2) {
      try {
        $input = $(val);
      } catch (err) {
        statusText = 'Failed to read HTML, make sure it\'s valid';
      }

      if ($input) {
        $input = $input.not('meta, script, link, style');
        $input.find('meta, script, link, style').remove();

        if ($input.is('.slides')) {
          $input = $('<div>').append($input);
        }

        if ($input.find('.slides>section').length === 0) {
          statusText = 'Couldn\'t find any sections inside of .slides';
        }

        if ($input.find('.slides').length === 0) {
          statusText = 'Couldn\'t find a .slides container';
        }
      }

      this.$importStatus.addClass('visible');

      if (!statusText) {
        var length = $input.find('.slides section').length;

        this.$importStatus.attr('data-state', 'success');
        this.$importStatusText
          .html('Ready to import <strong>' + length + '</strong> slides.');
        this.$importStatusIcon.removeClass('i-bolt').addClass('i-checkmark');

        return $input.find('.slides>section');
      }

      this.$importStatus.attr('data-state', 'error');
      this.$importStatusText.html(statusText);
      this.$importStatusIcon.removeClass('i-checkmark').addClass('i-bolt');
    } else {
      this.$importStatus.removeClass('visible');
    }

    return null;
  },

  /**
   * @function
   */
  onInputChange: function () {
    this.validate();
  },

  /**
   * @function
   * @param {Event} evt
   */
  onImportConfirmed: function (evt) {
    var slides = this.validate();

    if (slides && slides.length) {
      SL.prompt({
        anchor: $(evt.currentTarget),
        title:  SL.locale.get('SlideBar.reveal.confirm_title'),
        type:   'select',
        data: [{
          html: '<h3>Cancel</h3>'
        }, {
          html: '<h3>Import</h3>',
          selected: true,
          className: 'positive',
          callback: (function () {
            SL.editor.controllers.Markup.importSlides(slides, true);
            this.reset();
            this.importCompleted.dispatch();
          }).bind(this)
        }]
      });
    }
  }
});

SL('editor.components.sidebar').Import       = SL.editor.components.sidebar.Base.extend({
  /**
   * Constructor SL.editor.components.sidebar.Import Instance
   *
   * @function
   */
  init: function () {
    this.$domElement = $('.sidebar-panel .import');
    this._super();
  },

  /**
   * @function
   */
  setupFileImport: function () {
    if (this.importFile) {
      this.importFile.reset();
    } else {
      this.importFile = new SL.editor.components.sidebar.ImportFile(this);
      this.importFile.importCompleted.add(this.onImportCompleted.bind(this));
    }
  },

  /**
   * @function
   */
  setupRevealImport: function () {
    if (this.importReveal) {
      this.importReveal.reset();
    } else {
      this.importReveal = new SL.editor.components.sidebar.ImportReveal(this);
      this.importReveal.importCompleted.add(this.onImportCompleted.bind(this));
    }
  },

  /**
   * @function
   */
  open: function () {
    if (SL.view.isNewDeck()) {
      SL.view.save((function () {
        this.setupFileImport();
      }).bind(this));
    } else {
      this.setupFileImport();
    }

    this.setupRevealImport();
    this._super();
  },

  /**
   * @function
   */
  close: function () {
    this._super();
  },

  /**
   * @function
   */
  onImportCompleted: function () {
    this.close();
    this.onclose.dispatch();
  }
});

SL('editor.components.sidebar').Revisions    = SL.editor.components.sidebar.Base.extend({
  /**
   * Constructor SL.editor.components.sidebar.Revisions Instance
   *
   * @function
   */
  init: function () {
    this.$domElement  = $('.sidebar-panel .revisions');
    this.$listElement = this.$domElement.find('.version-list');
    this.$panelBody   = this.$domElement.find('.panel-body');

    this._super();
  },

  /**
   * @function
   */
  bind: function () {
    this._super();

    this.onPanelScroll = this.onPanelScroll.bind(this);
    this.onPanelScroll = $.debounce(this.onPanelScroll, 200);
  },

  /**
   * @function
   */
  reset: function () {
    this.loadedAllPages = false;
    this.loading        = false;
    this.page           = 1;

    this.$listElement.empty();
    this.$domElement.attr('data-state', 'loading');
  },

  /**
   * @function
   */
  open: function () {
    this.reset();

    clearTimeout(this.loadTimeout);
    this.loadTimeout = setTimeout(this.load.bind(this), 500);
    this.$panelBody.on('scroll', this.onPanelScroll);
    this._super();
  },

  /**
   * @function
   */
  close: function () {
    this._super();
    clearTimeout(this.loadTimeout);
    this.$panelBody.off('scroll', this.onPanelScroll);
  },

  /**
   * @function
   */
  load: function () {
    if (!(this.loading || this.loadedAllPages)) {
      this.loading = true;

      $.ajax({
        url: SL.config.AJAX_GET_DECK_VERSIONS(SLConfig.deck.id, this.page),
        data: {
          page: this.page
        },
        context: this
      }).done(function (data) {
        this.addVersions(data.result);
        this.layout();

        if (data.result.length === 0) {
          this.loadedAllPages = true;
        }
      }).fail(function () {
        SL.notify(SL.locale.get('Generic_Error'));
        this.$domElement.attr('data-state', 'error');
        this.layout();
      }).always(function () {
        this.loading = false;
        this.page   += 1;
      });
    }
  },

  /**
   * @function
   * @param {Object} versions
   */
  addVersions: function (versions) {
    versions.forEach(this.addVersion.bind(this));
    SL.view.parseTimes();

    if (this.$listElement.find('li').length > 0) {
      this.$domElement.attr('data-state', 'populated');
    } else {
      this.$domElement.attr('data-state', 'empty');
    }
  },

  /**
   * @function
   * @param {Object} version
   */
  addVersion: function (version) {
    var $li = $('<li>').appendTo(this.$listElement),
      $text = $('<span class="text">').appendTo($li);

    $text.append(window.moment(version.create_at).format('MMM DD, hh:mm a'));
    $text.append(' <time class="ago de-em" datetime="' + version.create_at + '"></time>');

    var $action = $('<div class="actions">').appendTo($li),
      $btn = $([
        '<button class="button outline restore" data-tooltip="Restore" data-tooltip-delay="500">',
          '<span class="icon i-undo"></span>',
        '</button>'].join('')).appendTo($action);

    $btn.on('click', this.onRestoreClicked.bind(this, version));

    var $previewBtn = $([
      '<a class="button outline preview" data-tooltip="Preview" data-tooltip-delay="500">',
        '<span class="icon i-eye"></span>',
      '</a>'].join('')).appendTo($action);

    $previewBtn.attr({
      href: SL.config.AJAX_PREVIEW_DECK_VERSION(
        SLConfig.deck.user.username,
        SLConfig.deck.slug || SLConfig.deck.id,
        version.content_uuid),
      target: '_blank'
    });
    $previewBtn.on(
      'click', this.onPreviewClicked.bind(this, version, $previewBtn));
  },

  /**
   * @function
   * @param {Object}               version
   * @param {*|jQuery|HTMLElement} $previewBtn
   * @param {Event}                evt
   */
  onPreviewClicked: function (version, $previewBtn, evt) {
    var url = $previewBtn.attr('href'),
      popup = SL.popup.open(SL.components.popup.Revision, {
        revisionURL:     url,
        revisionTimeAgo: window.moment(version.create_at).fromNow()
      });

    popup.restoreRequested.add(this.onRestoreClicked.bind(this, version));
    popup.externalRequested.add(this.onExternalClicked.bind(this, url));

    SL.analytics.trackEditor('Revision preview');
    evt.preventDefault();
  },

  /**
   * @function
   * @param {Object} version
   * @param {Event}  evt
   */
  onRestoreClicked: function (version, evt) {
    SL.prompt({
      anchor: $(evt.currentTarget),
      title:  SL.locale.get('SlideBar.revisions.confirm_title', {
        time: window.moment(version.create_at).fromNow()
      }),
      type:   'select',
      data: [{
        html: '<h3>Cancel</h3>'
      }, {
        html: '<h3>Restore</h3>',
        selected:  true,
        className: 'negative',
        callback:  this.onRestoreConfirmed.bind(this, version)
      }]
    });

    evt.preventDefault();
  },

  /**
   * @function
   * @param {Object} version
   */
  onRestoreConfirmed: function (version) {
    SL.analytics.trackEditor('Revision restore');
    SL.helpers.PageLoader.show({message: 'Restoring...'});

    $.ajax({
      type:    'post',
      url: SL.config.AJAX_RESTORE_DECK_VERSION(SLConfig.deck.id, version.id),
      data:    version,
      context: this
    }).done(function (data) {
      if (data && typeof data.slug === "string") {
        window.location =
          SL.routes.DECK_EDIT(
            SLConfig.deck.user.username,
            data.slug || SLConfig.deck.id);
      } else {
        window.location.reload();
      }
    }).fail(function () {
      SL.notify(SL.locale.get('Generic_Error'));
      this.layout();
      SL.helpers.PageLoader.hide();
    });
  },

  /**
   * @function
   * @param {String} url
   * @param {Event}  evt
   */
  onExternalClicked: function (url, evt) {
    window.open(url);
    evt.preventDefault();
  },

  /**
   * @function
   */
  onPanelScroll: function () {
    var scrollTop   = this.$panelBody.scrollTop(),
      scrollHeight  = this.$panelBody.prop('scrollHeight'),
      outerHeight   = this.$panelBody.outerHeight(),
      scrollPercent = scrollTop / (scrollHeight - outerHeight);

    if (scrollPercent > 0.8) {
      this.load();
    }
  }
});

SL('editor.components.sidebar').Settings     = SL.editor.components.sidebar.Base.extend({
  /**
   * Constructor SL.editor.components.sidebar.Settings Instance
   *
   * @function
   */
  init: function () {
    this.$domElement            = $('.sidebar-panel .settings');
    this.$rtlToggle             =
      this.$domElement.find('.sl-checkbox input[value="rtl"]');
    this.$loopToggle            =
      this.$domElement.find('.sl-checkbox input[value="should_loop"]');
    // this.$commentsEnabledToggle =
    //   this.$domElement.find('.sl-checkbox input[value="comments_enabled"]');
    // this.$forkingEnabledToggle  =
    //   this.$domElement.find('.sl-checkbox input[value="forking_enabled"]');
    // this.$shareNotesToggle =
    //   this.$domElement.find('.sl-checkbox input[value="share_notes"]');
    this.$titleInput            =
      this.$domElement.find('#deck-input-title');
    this.$descriptionInput      =
      this.$domElement.find('#deck-input-description');
    this.$slug                  =
      this.$domElement.find('.slug');
   // this.$slugInput             =
      this.$domElement.find('#deck-input-slug');
    this.$slugPrefix            =
      this.$domElement.find('.slug .text-prefix');
    this.$autoSlideInput        =
      this.$domElement.find('#deck-input-autoslide');

    this.renderAutoSlideOptions();

    this._super();
  },

  /**
   * @function
   */
  renderAutoSlideOptions: function () {
    var optionsStr = '<option value="0">关闭</option>';

    SL.config.AUTO_SLIDE_OPTIONS.forEach(function (option) {
      optionsStr += [
        '<option value="' + 1000 * option + '">',
          option,
        ' seconds</option>'].join('');
    });

    this.$autoSlideInput.html(optionsStr);
  },

  /**
   * @function
   */
  bind: function () {
    this._super();

    this.$domElement.find('.sl-checkbox input')
      .on('change', this.onToggleChange.bind(this));
    // this.$titleInput.on('input', this.onTitleInput.bind(this));
    // this.$slugInput.on('input', this.onSlugInput.bind(this));
    // this.$slugInput.on('focus', this.onSlugFocus.bind(this));
    // this.$slugInput.on('blur', this.onSlugBlur.bind(this));
    this.$descriptionInput.on('keypress', this.onDescriptionKeyPress.bind(this));
  },

  /**
   * @function
   */
  open: function () {
    this._super();

    this.buffer();
    this.updateSelection();

    this.$titleInput
      .val(SL.util.unescapeHTMLEntities(this.config.deck.title || ''));
    // this.$slugInput.val(this.config.deck.slug);
    this.$descriptionInput
      .val(SL.util.unescapeHTMLEntities(this.config.deck.description || ''));
    this.$autoSlideInput.val(this.config.deck.auto_slide_interval || 0);
    this.$slugPrefix
      .text(window.location.host + '/' + SLConfig.current_user.username + '/');
    // this.$slugInput
    //   .css(
    //     'padding-left',
    //     this.$slugPrefix.position().left + this.$slugPrefix.width());
  },

  /**
   * @function
   */
  close: function () {
    this._super();
  },

  /**
   * @function
   * @returns {boolean}
   */
  save: function () {
    var title     = this.$titleInput.val(),
      //slug        = this.$slugInput.val(),
      description = this.$descriptionInput.val();

      if (title) {
        // if (slug) {
        this._super();

        SLConfig.deck.title = title;

        if (description) {
          SLConfig.deck.description = description.replace(/\n/g, ' ');
        } else {
          SLConfig.deck.description = '';
        }

       // SLConfig.deck.slug                = slug;
        SLConfig.deck.rtl                 = this.$rtlToggle.is(':checked');
        SLConfig.deck.should_loop         = this.$loopToggle.is(':checked');
        // SLConfig.deck.comments_enabled    =
        //   this.$commentsEnabledToggle.is(':checked');
        // SLConfig.deck.forking_enabled     =
        //   this.$forkingEnabledToggle.is(':checked');
        // SLConfig.deck.share_notes         = this.$shareNotesToggle.is(':checked');
        SLConfig.deck.auto_slide_interval =
          parseInt(this.$autoSlideInput.val(), 10) || 0;
        SLConfig.deck.dirty               = true;

        SL.analytics.trackEditor('Deck.edit: Setting saved');
        $('html').toggleClass('rtl', SLConfig.deck.rtl);

        return true;
      // } else {
      //   SL.notify(SL.locale.get('SlideBar.settings.save_title_err'), 'negative');
      //   return false;
      // }
    } else {
      SL.notify(SL.locale.get('SlideBar.settings.save_title_err'), 'negative');
      return false;
    }
  },

  /**
   * @function
   */
  updateSelection: function () {
    this.$rtlToggle.prop('checked', this.config.deck.rtl);
    this.$loopToggle.prop('checked', this.config.deck.should_loop);
    //this.$commentsEnabledToggle.prop('checked', this.config.deck.comments_enabled);
    //this.$forkingEnabledToggle.prop('checked', this.config.deck.forking_enabled);
    //this.$shareNotesToggle.prop('checked', this.config.deck.share_notes);
  },

  /**
   * @function
   */
  applySelection: function () {
    window.Reveal.configure({
      rtl:  this.$rtlToggle.is(':checked'),
      loop: this.$loopToggle.is(':checked')
    });
  },

  /**
   * @function
   */
  generateSlug: function () {
    if (this.deckIsPrivate() && this.slugIsUnchanged() || this.slugWasManuallyCleared) {
      var title = this.$titleInput.val();
        //slug    = SL.util.string.slug(title);

      this.$slugInput.val(slug);
    }
  },

  /**
   * @function
   * @returns {boolean}
   */
  deckIsPrivate: function () {
    return SLConfig.deck.visibility === SL.models.Deck.VISIBILITY_SELF;
  },

  /**
   * @function
   * @returns {boolean}
   */
  slugIsUnchanged: function () {
    var slug    = SLConfig.deck.slug || '',
      titleSlug = SL.util.string.slug(SLConfig.deck.title) || '';

    return slug === titleSlug;
  },

  /**
   * @function
   */
  onToggleChange: function () {
    this.applySelection();
  },

  /**
   * @function
   */
  onTitleInput: function () {
    this.generateSlug();
  },

  /**
   * @function
   * @param {Event} evt
   */
  onDescriptionKeyPress: function (evt) {
    if (evt.keyCode === 13) {
      return false;
    }
  },

  /**
   * @function
   */
  onSlugInput: function () {
    this.slugWasManuallyCleared = (this.$slugInput.val() === '');
  },

  /**
   * @function
   */
  onSlugFocus: function () {
    if (!this.deckIsPrivate()) {
      SL.tooltip.show(
        'Changing the URL of your deck will break existing links to it.', {
        anchor:    this.$slugInput,
        alignment: 'r',
        maxwidth:  220
      });
    }
  },

  /**
   * @function
   */
  onSlugBlur: function () {
    SL.tooltip.hide();
    this.$slugInput.val(SL.util.string.slug(this.$slugInput.val()));
  }
});

SL('editor.components.sidebar').Style        = SL.editor.components.sidebar.Base.extend({
  /**
   * Constructor SL.editor.components.sidebar.Style Instance
   *
   * @function
   */
  init: function () {
    this.$domElement = $('.sidebar-panel .style');
    this._super();
  },

  /**
   * @function
   */
  bind: function () {
    this._super();
    this.$domElement.find('.edit-style')
      .on('click', this.onAdvancedStylesCLicked.bind(this));
  },

  /**
   * @function
   */
  scroll: function () {
    this.$domElement.find('.panel-body').scrollTop(0);
    $('.page-wrapper').scrollTop(0);
  },

  /**
   * @function
   */
  open: function () {
    this._super();

    if (this.themeoptions) {
      this.themeoptions.populate(SL.models.Theme.fromDeck(SLConfig.deck));
    } else {
      this.themeoptions = new SL.components.ThemeOptions({
        center:       false,
        rollingLinks: false,
        fonts:     SL.config.THEME_FONTS,
        colors:    SL.config.THEME_COLORS,
        themes:    SL.current_user.getThemes(),
        model:     SL.models.Theme.fromDeck(SLConfig.deck),
        container: this.$domElement.find('.panel-body')
      });

      this.themeoptions.changed.add(this.onThemeOptionsChanged.bind(this));
      SL.fonts.loadAll();
    }

    this.scroll();
    this.layout();
  },

  /**
   * @function
   */
  close: function () {
    this._super();
  },

  /**
   * @function
   */
  revert: function () {
    this._super();

    SL.helpers.ThemeController.paint(SL.view.getCurrentTheme(), {
      center: false,
      js:     false
    });
  },

  /**
   * @function
   * @returns {boolean}
   */
  save: function () {
    var currentTheme = SL.view.getCurrentTheme(),
      theme = this.themeoptions.getTheme(),
      isId = currentTheme.get('id') === theme.get('id'),
      isJs = (currentTheme.get('js') || '') === (theme.get('js') || '');

    if (isId || isJs) {
      this._super();

      this.saveData();
      return true;
    } else {
      this.promptReload();
      return false;
    }
  },

  /**
   * @function
   */
  saveData: function () {
    var theme = this.themeoptions.getTheme();

    SLConfig.deck.dirty                 = true;
    SLConfig.deck.theme_id              = theme.get('id');
    SLConfig.deck.theme_font            = theme.get('font');
    SLConfig.deck.theme_color           = theme.get('color');
    SLConfig.deck.center                = theme.get('center');
    SLConfig.deck.rolling_links         = theme.get('rolling_links');
    SLConfig.deck.transition            = theme.get('transition');
    SLConfig.deck.background_transition = theme.get('background_transition');

    window.Reveal.configure({
      center:               false,
      rolling_links:        SLConfig.deck.rolling_links,
      transition:           SLConfig.deck.transition,
      backgroundTransition: SLConfig.deck.background_transition
    });

    SL.editor.controllers.Thumbnail.invalidate();
    SL.editor.controllers.Contrast.sync();

    SL.view.onThemeChanged();
  },

  /**
   * @function
   */
  promptReload: function () {
    SL.prompt({
      anchor:    this.$domElement.find('.save'),
      title:     SL.locale.get('SlideBar.style.reload_title'),
      alignment: 't',
      type:      'select',
      data: [{
        html:    '<h3>Cancel</h3>'
      }, {
        html:    '<h3>Continue</h3>',
        className: 'positive',
        callback: this.saveAndReload.bind(this)
      }]
    });
  },

  /**
   * @function
   */
  saveAndReload: function () {
    this.saveData();

    SL.view.save(function () {
      window.location.reload();
    });

    SL.prompt({
      anchor:    this.$domElement.find('.save'),
      title:     SL.locale.get('SlideBar.style.save_title') +
        '<div class="spinner centered-horizontally"></div>',
      alignment: 't',
      optional:  false,
      options:   []
    });

    SL.util.html.generateSpinners();
  },

  /**
   * @function
   */
  onAdvancedStylesCLicked: function () {
    SL.analytics.trackEditor('Open CSS editor');
    SL.editor.controllers.Mode.change('css');
  },

  /**
   * @function
   */
  onThemeOptionsChanged: function () {
    this.layout();
    SL.editor.controllers.Grid.refresh();
  }
});


/*!
 * project name: SlideStudio
 * name:         slideOptions.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/20
 */

'use strict';

SL('editor.components').SlideOptions = Class.extend({
  /**
   * Constructor SL.editor.components.Sidebar Instance
   *
   * @function
   * @param {Editor|Object|*} editor -The Editor Instance
   * @param {Object}          options
   */
  init: function (editor, options) {
    this.editor = editor;
    this.options = $.extend({
      removeSlide:     true,
      backgroundColor: true,
      backgroundImage: true,
      customClasses:   true,
      fragment:        true,
      notes:           true,
      html:            true
    }, options);

    this.render();
    this.bind();
  },

  /**
   * @function
   */
  render: function () {
    this.$domElement  = $('<div class="slide-options"></div>')
      .appendTo($('.projector'));
    this.$listElement = $('<ul></ul>').appendTo(this.$domElement);

    this.renderOptions();
  },

  /**
   * @function
   * @param {Object} options
   */
  configure: function (options) {
    this.options = $.extend(this.options, options);
    this.renderOptions();
  },

  /**
   * @function
   */
  renderOptions: function () {
    if (this.$removeSlideElement) {
      this.$removeSlideElement.remove();
    }

    if (this.$backgroundColorElement) {
      this.$backgroundColorElement.remove();
    }

    if (this.$backgroundImageElement) {
      this.$backgroundImageElement.remove();
    }

    if (this.$backgroundImageMenu) {
      this.$backgroundImageMenu.remove();
    }

    if (this.$customClassesElement) {
      this.$customClassesElement.remove();
    }

    if (this.$fragmentElement) {
      this.$fragmentElement.remove();
    }

    if (this.$notesElement) {
      this.$notesElement.remove();
    }

    if (this.$htmlElement) {
      this.$htmlElement.remove();
    }

    if (this.options.removeSlide) {
      this.$removeSlideElement =
        this.renderOption(
          'remove-slide', 'i-trash-stroke', SL.locale.get('SlideOpts.remove_tip'));
      this.$removeSlideElement
        .on('vclick', this.onRemoveSlideClicked.bind(this));
    }

    if (this.options.backgroundColor) {
      this.$backgroundColorElement =
        this.renderOption(
          'background', 'i-droplet', SL.locale.get('SlideOpts.bk_clr_tip'));
      this.$backgroundColorElement
        .on('vclick', this.onBackgroundColorClicked.bind(this));
    }

    if (this.options.backgroundImage) {
      this.$backgroundImageElement =
        this.renderOption(
          'background-image', 'i-image', SL.locale.get('SlideOpts.bk_tip'));

      this.renderBackgroundImageMenu();

      this.$backgroundImageElement
        .on('vclick', this.onBackgroundImageClicked.bind(this));
      this.$backgroundImageMenu.find('.background-size')
        .on('change', this.onBackgroundImageSizeChanged.bind(this));
      this.$backgroundImageMenu.find('.remove-background')
        .on('click', this.onBackgroundImageRemoveClicked.bind(this));
    }

    if (this.options.customClasses) {
      this.$customClassesElement =
        this.renderOption(
          'custom-classes', 'i-star', SL.locale.get('SlideOpts.class_tip'));
      this.$customClassesElement
        .on('vclick', this.onCustomClassesClicked.bind(this));

      this.syncCustomClasses();
    }

    if (this.options.notes) {
      this.$notesElement =
        this.renderOption(
          'notes', 'i-book-alt2', SL.locale.get('SlideOpts.note_tip'));
      this.$notesElement.on('vclick', this.onNotesClicked.bind(this));
    }
  },

  /**
   * @function
   * @param {String} classStr
   * @param {String} icon
   * @param {String} tooptip
   * @returns {*|jQuery|HTMLElement}
   */
  renderOption: function (classStr, icon, tooptip) {
    var $options = $('<li><span class="icon ' + icon + '"></span></li>');

    $options.attr({
      'class':                  classStr,
      'data-tooltip':           tooptip,
      'data-tooltip-alignment': 'l'
    });
    $options.appendTo(this.$listElement);

    return $options;
  },

  /**
   * @function
   */
  renderBackgroundImageMenu: function () {
    this.$backgroundImageMenu =
      $('<div class="background-image-menu">')
        .appendTo(this.$domElement);
    this.$backgroundImageInner =
      $('<div class="inner"></div>')
        .appendTo(this.$backgroundImageMenu);

    var $progress =
      $('<div class="upload-progress"></div>')
        .appendTo(this.$backgroundImageInner);
    $progress.append('<span class="spinner centered"></span>');
    $progress.append([
      '<span class="label">',
        SL.locale.get('SlideOpts.uploading'),
      '</span>'].join(''));

    SL.util.html.generateSpinners();

    var $output = $('<div class="upload-output"></div>')
      .appendTo(this.$backgroundImageInner);
    $output.append('<div class="thumbnail"></div>');

    var $imgOptions =
      $('<div class="background-image-options"></div>').appendTo($output);
    $imgOptions.append([
      '<select class="sl-select white background-size">',
        '<option value="cover">' + SL.locale.get('SlideOpts.stretch') + '</option>',
        '<option value="contain">' + SL.locale.get('SlideOpts.fit') + '</option>',
        '<option value="initial">' + SL.locale.get('SlideOpts.original') + '</option>',
      '</select>'].join(''));
    $imgOptions.append([
      '<button class="button remove-background">',
        SL.locale.get('Remove'),
      '</button>'].join(''));
  },

  /**
   * @function
   */
  bind: function () {
    this.onDocumentMouseDown = this.onDocumentMouseDown.bind(this);
    $(document).on('mousedown touchstart', this.onDocumentMouseDown);
  },

  /**
   * @function
   */
  collapse: function () {
    this.hideOpenPanels();
  },

  /**
   * @function
   */
  hideOpenPanels: function () {
    if (!!this.$backgroundColorMenu) {
      this.hideBackgroundColorMenu();
    }

    if (this.$backgroundImageMenu) {
      this.hideBackgroundImageMenu();
    }
  },

  /**
   * @function
   * @returns {boolean}
   */
  hasOpenPanel: function () {
    return !!this.$backgroundColorMenu && this.$backgroundColorMenu.hasClass('show') ||
      !!this.$backgroundImageMenu && this.$backgroundImageMenu.hasClass('show');
  },

  /**
   * @function
   */
  showOverflowWarning: function () {
    if (!(this.$overflowWarning ||
      SL.editor.controllers.Capabilities.isTouchEditor())) {
      this.$overflowWarning = $([
        '<div class="overflow-warning">' +
          '<span class="icon i-info"></span>' +
        '</div>'].join(''));
      this.$overflowWarning.attr({
        'class':        'overflow-warning',
        'data-tooltip': SL.locale.get('SlideOpts.overflow_warning_tip'),
        'data-tooltip-maxwidth':  300,
        'data-tooltip-alignment': 'l'
      });
    }

    if (this.$overflowWarning.parent().length === 0) {
      this.$overflowWarning.appendTo(this.$domElement);
    }
  },

  /**
   * @function
   */
  hideOverflowWarning: function () {
    if (this.$overflowWarning) {
      this.$overflowWarning.remove();
    }
  },

  /**
   * @function
   */
  syncRemoveSlide: function () {
    if (this.$removeSlideElement) {
      this.$removeSlideElement.toggleClass(
        'disabled', $('.reveal .slides section').length < 2);
    }
  },

  /**
   * @function
   */
  syncCustomClasses: function () {
    var theme = this.editor.getCurrentTheme();

    if (theme) {
      var css = SL.util.string.getCustomClassesFromLESS(theme.get('less'));
      this.$customClassesElement.toggleClass('disabled', css.length === 0);
    }
  },

  /**
   * @function
   */
  syncBackgroundImageMenu: function () {
    var $currentSlide = $(window.Reveal.getCurrentSlide()),
      bkImg      = $currentSlide.attr('data-background-image'),
      bkSize     = $currentSlide.attr('data-background-size'),
      $thumbnail =
        this.$backgroundImageMenu.find('.upload-output .thumbnail'),
      $bkSize    =
        this.$backgroundImageMenu.find('.upload-output .background-size');

    if (typeof bkImg === "string" && bkImg.length) {
      $thumbnail.css({
        'background-image':  'url("' + bkImg + '")',
        'background-repeat': 'no-repeat',
        'background-size':   'cover'
      });

      $bkSize.val(bkSize || 'cover');

      this.$backgroundImageMenu.attr('data-state', 'uploaded');
      this.$backgroundImageMenu.addClass('show');
    } else if (this.backgroundImageModel) {
      $thumbnail.css('background-image', 'none');
      this.$backgroundImageMenu.attr('data-state', 'uploading');
      this.$backgroundImageMenu.addClass('show');
    } else {
      $thumbnail.css('background-image', 'none');
      this.$backgroundImageMenu.attr('data-state', '');
      this.$backgroundImageMenu.removeClass('show');
    }
  },

  /**
   * @function
   */

  triggerNotes: function () {
    if (!this.notesPrompt) {
      SL.util.deck.generateIdentifiers();

      var id      = $(window.Reveal.getCurrentSlide()).attr('data-id'),
        maxLength = SL.config.SPEAKER_NOTES_MAXLENGTH;

      this.notesPrompt = SL.prompt({
        anchor:       this.$notesElement,
        alignment:    'l',
        title:        SL.locale.get('SlideOpts.note_title'),
        type:         'input',
        confirmLabel: SL.locale.get('Save'),
        data: {
          value:       SLConfig.deck.notes[id],
          placeholder: SL.locale.get('SlideOpts.max_note', {max: maxLength}),
          multiline:            true,
          maxlength:            maxLength,
          confirmBeforeDiscard: true
        }
      });
      this.notesPrompt.confirmed.add(function (note) {
        SLConfig.deck.notes[id] = note;
        SLConfig.deck.dirty     = true;
        SL.analytics.trackEditor('Saved notes');
      });
      this.notesPrompt.destroyed.add((function () {
        this.notesPrompt = null;
      }).bind(this));
    }
  },

  /**
   * @function
   */
  triggerCustomClasses: function () {
    if (!this.customClassesPrompt) {
      var theme = this.editor.getCurrentTheme();

      if (theme) {
        var css = SL.util.string.getCustomClassesFromLESS(theme.get('less'));

        if (css.length) {
          var $currentSlide = $(window.Reveal.getCurrentSlide()),
            data = css.map(function (classStr) {
              return {
                value:    classStr,
                selected: $currentSlide.hasClass(classStr),
                callback: function (classStr) {
                  $currentSlide.toggleClass(classStr);
                  window.Reveal.sync();
                }
              };
            });

          this.customClassesPrompt = SL.prompt({
            anchor: this.$customClassesElement,
            alignment:   'l',
            title:       SL.locale.get('SlideOpts.class_title'),
            type:        'list',
            data:        data,
            multiselect: true,
            optional:    true
          });
          this.customClassesPrompt.destroyed.add((function () {
            this.customClassesPrompt = null;
          }).bind(this));
        }
      }
    }
  },

  /**
   * @function
   */
  triggerBackgroundImageBrowser: function () {
    var $currentSlide = Reveal.getCurrentSlide(),
      indices         = Reveal.getIndices($currentSlide),
      popup = SL.popup.open(SL.editor.components.medialibrary.MediaLibrary, {
        select: SL.models.Media.IMAGE
      });

    popup.selected.addOnce((function (model) {
      this.backgroundImageModel = model;
      this.syncBackgroundImageMenu();

      if (model.isUploaded()) {
        this.onBackgroundImageUploadSuccess($currentSlide, indices);
      } else {
        model.uploadCompleted.add((function () {
          this.onBackgroundImageUploadSuccess($currentSlide, indices);
        }).bind(this));
        model.uploadFailed.add(this.onBackgroundImageUploadError.bind(this));
      }
    }).bind(this));
  },

  /**
   * @function
   */
  hideBackgroundColorMenu: function () {
    SL.view.colorpicker.hide();
  },

  /**
   * @function
   */
  hideBackgroundImageMenu: function () {
    this.$backgroundImageMenu.removeClass('show');
  },

  /**
   * @function
   * @param {String} clr
   */
  setBackgroundColor: function (clr) {
    Reveal.getCurrentSlide().setAttribute('data-background-color', clr);
    Reveal.sync();

    SL.editor.controllers.Contrast.sync();
  },

  /**
   * @function
   */
  clearBackgroundColor: function () {
    Reveal.getCurrentSlide().removeAttribute('data-background-color');
    Reveal.sync();

    SL.editor.controllers.Contrast.sync();
  },

  /**
   * @function
   * @param {Event} evt
   */
  onRemoveSlideClicked: function (evt) {
    SL.editor.controllers.Blocks.blur();
    SL.prompt({
      anchor:    $(evt.currentTarget),
      title:     SL.locale.get('SlideOpts.remove_slide_title'),
      alignment: 'l',
      type:      'select',
      data: [{
        html: '<h3>' + SL.locale.get('Cancel') + '</h3>'
      }, {
        html: '<h3>' + SL.locale.get('Delete') + '</h3>',
        selected:   true,
        className: 'negative',
        callback: (function () {
          SL.editor.controllers.Markup.removeCurrentSlide();
        }).bind(this)
      }]
    });

    evt.preventDefault();
  },

  /**
   * @function
   * @param {Event} evt
   */
  onBackgroundColorClicked: function (evt) {
    evt.preventDefault();
    this.hideBackgroundImageMenu();

    var options = {
        anchor:         this.$backgroundColorElement,
        alignment:      'l',
        alpha:          false,
        changeCallback: this.setBackgroundColor.bind(this),
        resetCallback:  this.clearBackgroundColor.bind(this)
      },
      $currentSlide = window.Reveal.getCurrentSlide();

    if ($currentSlide.hasAttribute('data-background-color')) {
      options.color = $currentSlide.getAttribute('data-background-color');
    }

    SL.view.colorpicker.toggle(options);
    SL.analytics.trackEditor('Toggle background color menu');
  },

  /**
   * @function
   * @param {Event} evt
   */
  onBackgroundImageClicked: function (evt) {
    evt.preventDefault();

    this.syncBackgroundImageMenu();
    this.hideBackgroundColorMenu();

    var conHeight = 144, height = 36;

    this.$backgroundImageMenu.addClass('immediate');
    this.$backgroundImageMenu.css(
      'top',
      this.$backgroundImageElement.position().top -
        (conHeight - height) / 2);

    setTimeout((function () {
      this.$backgroundImageMenu.removeClass('immediate');
    }).bind(this), 1);

    if (this.$backgroundImageMenu.attr('data-state') === '') {
      this.triggerBackgroundImageBrowser();
    }

    SL.analytics.trackEditor('Toggle background image menu');
  },

  /**
   * @function
   * @param {Event} evt
   */
  onBackgroundImageRemoveClicked: function (evt) {
    Reveal.getCurrentSlide().removeAttribute('data-background-image');
    Reveal.sync();

    this.syncBackgroundImageMenu();
    SL.analytics.trackEditor('Remove background image');

    evt.preventDefault();
  },

  /**
   * @function
   */
  onBackgroundImageSizeChanged: function () {
    var $size = this.$backgroundImageMenu.find('.background-size');

    Reveal.getCurrentSlide().setAttribute('data-background-size', $size.val());
    Reveal.sync();

    this.syncBackgroundImageMenu();
  },

  /**
   * @function
   * @param {*|jQuery|HTMLElement} $currentSlide
   * @param {Object}               indices
   */
  onBackgroundImageUploadSuccess: function ($currentSlide, indices) {
    $currentSlide.setAttribute(
      'data-background-image', this.backgroundImageModel.get('url'));

    Reveal.sync();

    if (indices && indices.h === 0 && indices.v === 0) {
      SL.editor.controllers.Thumbnail.generate();
    }

    this.backgroundImageModel = null;
    this.syncBackgroundImageMenu();
  },

  /**
   * @function
   */
  onBackgroundImageUploadError: function () {
    this.backgroundImageModel = null;
    this.syncBackgroundImageMenu();
  },

  /**
   * @function
   * @param {Event} evt
   */
  onCustomClassesClicked: function (evt) {
    evt.preventDefault();
    this.triggerCustomClasses();
  },

 /**
   * @function
   * @param {Event} evt
   */
  onNotesClicked: function (evt) {
    evt.preventDefault();
    this.triggerNotes();
  },

  /**
   * @function
   * @param {Event} evt
   */
  onDocumentMouseDown: function (evt) {
    var $target = $(evt.target);

    if ($target.parents('.slide-options, .sl-popup').length === 0) {
      this.collapse();
    }
  }
});


/*!
 * project name: SlideStudio
 * name:         toolbars.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/20
 */

'use strict';

SL('editor.components').Toolbars = Class.extend({
  /**
   * Constructor SL.editor.components.Toolbars Instance
   *
   * @function
   * @param {Editor|Object|*} editor -The Editor Instance
   */
  init: function (editor) {
    this.editor = editor;
    this.stack  = [];

    this.render();
    this.show();

    this.push(new SL.editor.components.toolbars.Add());
  },

  /**
   * @function
   */
  render: function () {
    this.$domElement      = $('<div class="toolbars">')
      .appendTo(document.body);
    this.$innerElement    = $('<div class="toolbars-inner">')
      .appendTo(this.$domElement);
    this.$scrollerElement = $('<div class="toolbars-scroller">')
      .appendTo(this.$innerElement);
    // this.$footerElement   = $('<div class="toolbars-footer"></div>')
    //   .appendTo(this.$domElement);

    // if (!SL.current_user.isPro() && !SL.current_user.isEnterprise()) {
    //   this.$footerElement.append([
    //       '<a class="promotion-link upgrade-button" ',
    //         'data-tooltip="You\'re using Slides Free.<br>',
    //         'Click to learn more about our Pro features." ',
    //         'href="/pricing" target="_blank">Free</a>'].join(''));
    // }

    // if (!SL.editor.controllers.Capabilities.isTouchEditor()) {
    //   this.$footerElement.append([
    //     '<div class="option editor-settings" data-tooltip="Editor settings">',
    //       '<span class="icon i-equalizer"></span>',
    //     '</div>'].join(''));
    //   this.$footerElement.find('.option.editor-settings').on('click', this.onSettingsClicked);
    // }
  },

  /**
   * @function
   */
  show: function () {
    this.$domElement.addClass('visible');
  },

  /**
   * @function
   */
  hide: function () {
    this.$domElement.removeClass('visible');
  },

  /**
   * @function
   * @param {*|jQuery|HTMLElement} toolbar
   */
  push: function (toolbar) {
    this.stack.push(toolbar);
    toolbar.appendTo(this.$scrollerElement);
    this.layout();
  },

  /**
   * @function
   */
  pop: function () {
    if (this.stack.length > 1) {
      this.stack.pop().destroyAfter(1000);
    }

    this.layout();
  },

  /**
   * @function
   */
  clear: function () {
    for (; this.stack.length > 1;) {
      this.stack.pop().destroyAfter(1000);
    }

    this.layout();
  },

  /**
   * @function
   */
  sync: function () {
    this.stack.forEach(function (toolbar) {
      toolbar.sync();
    });
  },

  /**
   * @function
   */
  layout: function () {
    for (var t = 0, len = this.stack.length; t < len; t += 1) {
      var toolbar = this.stack[t], left = 0;

      toolbar.move(left, null);
      left += toolbar.measure().width;

      if (len - 1 > t) {
        toolbar.collapse();
      }
    }

    var tb = this.get(), measure = tb.measure();

    this.$domElement.find('.toolbar').removeClass('visible');
    tb.$domElement.addClass('visible');

    var transform = 'translateX(' + -Math.round(measure.x) + 'px)';

    this.$scrollerElement.css({
      '-webkit-transform': transform,
      '-moz-transform':    transform,
      '-ms-transform':     transform,
      transform:           transform
    });
  },

  /**
   * @function
   * @returns {{x: *, y: *, width: *, height: *}}
   */
  getToolbarMeasurements: function () {
    var position = this.$innerElement.position(),
      measure = {
        x:      position.left,
        y:      position.top,
        width:  this.$innerElement.width(),
        height: this.$innerElement.height()
      };

    measure.bottom = measure.y + measure.height;
    measure.right  = measure.x + measure.width;

    return measure;
  },

  /**
   * @function
   * @returns {*}
   */
  hasOpenPanel: function () {
    return this.stack.some(function (tb) {
      return tb.hasOpenPanel();
    });
  },

  /**
   * @function
   */
  collapse: function () {
    this.stack.forEach(function (tb) {
      tb.collapse();
    });
  },

  /**
   * @function
   * @param {Event} evt
   */
  onSettingsClicked: function (evt) {
    this.settingsPrompt = SL.prompt({
      anchor: evt.currentTarget,
      type:      'custom',
      title:     '编辑设置',
      className: 'editor-settings',
      html: [
        '<div class="editor-option sl-checkbox outline white">',
          '<input id="editor-settings-grid" type="checkbox">',
          '<label for="editor-settings-grid" ' +
            'data-tooltip="Display a grid behind the slide to help with alignment." ' +
            'data-tooltip-delay="500" data-tooltip-alignment="r" ' +
            'data-tooltip-maxwidth="220">网格</label>',
        '</div>',
        '<div class="editor-option sl-checkbox outline white">',
          '<input id="editor-settings-snap" type="checkbox">',
          '<label for="editor-settings-snap" ' +
            'data-tooltip="Snap dragged blocks to the grid, slide edges and other blocks." ' +
            'data-tooltip-delay="500" data-tooltip-alignment="r" ' +
            'data-tooltip-maxwidth="220">快照</label>',
        '</div>',
        '<div class="editor-option sl-checkbox outline white">',
          '<input id="editor-settings-developer-mode" type="checkbox">',
          '<label for="editor-settings-developer-mode" ' +
            'data-tooltip="Turn on developer-friendly features:' +
            '<br>- Per slide HTML editor.<br>' +
            '- Access to full deck HTML, for exporting to reveal.js.<br>' +
            '- Add class names to any focused block. Makes it easy to target ' +
            'content with custom CSS." data-tooltip-delay="500" ' +
            'data-tooltip-alignment="r" ' +
            'data-tooltip-maxwidth="340">开发模式</label>',
        '</div>'].join('')
    });

    var $grid = this.settingsPrompt.getDOMElement().find('#editor-settings-grid');

    $grid.prop('checked', SL.current_user.settings.get('editor_grid'));
    $grid.on('change', function (evt) {
      SL.current_user.settings.set('editor_grid', evt.currentTarget.checked);
      SL.current_user.settings.save(['editor_grid']);

      SL.editor.controllers.Grid.refresh();
      SL.analytics.trackEditor('Toggle Grid');
    });

    var $snap = this.settingsPrompt.getDOMElement().find('#editor-settings-snap');

    $snap.prop('checked', SL.current_user.settings.get('editor_snap'));
    $snap.on('change', function (evt) {
      SL.current_user.settings.set('editor_snap', evt.currentTarget.checked);
      SL.current_user.settings.save(['editor_snap']);

      SL.analytics.trackEditor('Toggle Snap');
    });

    var $mode = this.settingsPrompt.getDOMElement().find('#editor-settings-developer-mode');

    $mode.prop('checked', SL.current_user.settings.get('developer_mode'));
    $mode.on('change', function (evt) {
      SL.current_user.settings.set('developer_mode', evt.currentTarget.checked);
      SL.current_user.settings.save(['developer_mode']);

      SL.view.slideOptions.configure({html: evt.currentTarget.checked});
      SL.analytics.trackEditor('Toggle Developer Mode');
    });
  },

  /**
   * @function
   * @param {Number} index
   * @returns {*}
   */
  get: function (index) {
    return this.stack[this.stack.length - 1 + (index || 0)];
  }
});


SL('editor.components.toolbars').Base         = Class.extend({
  /**
   * Constructor SL.editor.components.toolbars.Base Instance
   *
   * @function
   */
  init: function () {
    this.render();
  },

  /**
   * function
   */
  render: function () {
    this.$domElement  = $('<div class="toolbar">');
    this.$listElement = $('<div class="toolbar-list">').appendTo(this.$domElement);
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
  collapse: function () {
    this.getAllOptions().forEach(function (options) {
      if (typeof options.panel === "object") {
        options.panel.hide();
      }
    });
  },

  /**
   * @function
   */
  sync: function () {
    this.getAllOptions().forEach(function (options) {
      if (typeof options.sync === "function") {
        options.sync();
      }
    });
  },

  /**
   * @function
   * @param {Number} left
   * @param {Number} top
   */
  move: function (left, top) {
    this.$domElement.css({left: left, top: top});
  },

  /**
   * @function
   * @returns {{x: *, y: *, width: *, height: *}}
   */
  measure: function () {
    var position = this.$domElement.position();

    return {
      x:      position.left,
      y:      position.top,
      width:  this.$domElement.outerWidth(),
      height: this.$domElement.outerHeight()
    };
  },

  /**
   * @function
   * @returns {*}
   */
  hasOpenPanel: function () {
    return this.getAllOptions().some(function (options) {
      return !(typeof options.panel !== "object" ||
        !options.panel.isVisible());
    });
  },

  /**
   * @function
   * @returns {Array}
   */
  getAllOptions: function () {
    var options = [];

    if (typeof this.options === "object" && this.options.length) {
      options = options.concat(this.options);
      this.options.forEach(function (opt) {
        if (typeof opt.options === "object" && opt.options.length) {
          options = options.concat(opt.options);
        }
      });
    }

    return options;
  },

  /**
   * @function
   * @param {Number} delay
   */
  destroyAfter: function (delay) {
    this.collapse();
    clearTimeout(this.destroyTimeout);

    if (typeof delay === "number") {
      this.destroyTimeout = setTimeout(this.destroy.bind(this), delay);
    }

  },

  /**
   * @function
   */
  destroy: function () {
    this.$domElement.remove();
  }
});

SL('editor.components.toolbars').AddSnippet   = SL.editor.components.toolbars.Base.extend({
  /**
   * Constructor SL.editor.components.toolbars.AddSnippet Instance
   *
   * @function
   */
  init: function () {
    this._super();
  },

  /**
   * @function
   */
  render: function () {
    this._super();
    this.$domElement.attr('data-type', 'add');
    this.sync();
  },

  /**
   * @function
   */
  sync: function () {
    this._super();

    var theme = SL.view.getCurrentTheme();

    if (theme) {
      var snippets = theme.get('snippets');

      if (snippets && !snippets.isEmpty()) {
        snippets.forEach((function (snippet) {
          var $opt = $('<div class="toolbar-add-snippet-option">');

          $opt.text(snippet.get('title'));
          $opt.appendTo(this.$listElement);
          $opt.on('vclick', this.onSnippetClicked.bind(this, snippet));
        }).bind(this));
      }
    }
  },

  /**
   * @function
   * @param {Object} slide
   * @param {String} content
   */
  insert: function (slide, content) {
    SL.editor.controllers.Blocks.add({
      type:      'snippet',
      slide:     slide,
      afterInit: function (slide) {
        slide.setCustomHTML(content);
        slide.resizeToFitContent();
      }
    });
  },

  /**
   * @function
   * @param {Object} snippet
   */
  onSnippetClicked: function (snippet) {
    var $slide = $(window.Reveal.getCurrentSlide());

    if (snippet.templateHasVariables()) {
      var popup = SL.popup.open(SL.components.popup.InsertSnippet, {
        snippet: snippet
      });

      popup.snippetInserted.add((function (snippet) {
        this.insert($slide, snippet);
      }).bind(this));
    } else {
      var template = snippet.get('template')
        .replace(SL.models.ThemeSnippet.TEMPLATE_SELECTION_TAG, '');

      this.insert($slide, template);
    }
  }
});

SL('editor.components.toolbars').Add          = SL.editor.components.toolbars.Base.extend({
  /**
   * Constructor SL.editor.components.toolbars.Add Instance
   *
   * @function
   */
  init: function () {
    this._super();
  },

  /**
   * @function
   */
  render: function () {
    this._super();

    this.$domElement.attr('data-type', 'add');

    SL.config.BLOCKS.forEach((function (block) {
      if (!block.hidden) {
        var $optBtn = $([
          '<div class="toolbar-add-block-option" data-block-type="' + block.type + '">',
            '<span class="toolbar-add-block-option-icon icon i-' + block.icon + '"></span>',
            '<span class="toolbar-add-block-option-label">' + block.label + '</span>',
          '</div>'].join(''));

        this.bindOption($optBtn, block);

        $optBtn.appendTo(this.$listElement);
      }
    }).bind(this));

    this.renderSnippets();
  },

  /**
   * @function
   */
  renderSnippets: function () {
    this.$snippetsOptions = $([
      '<div class="toolbar-add-block-option">',
        '<span class="toolbar-add-block-option-icon icon i-document-alt-stroke"></span>',
        '<span class="toolbar-add-block-option-label">Snippet</span>',
      '</div>'].join(''));
    this.$snippetsOptions.on('vclick', (function () {
      SL.view.toolbars.push(new SL.editor.components.toolbars.AddSnippet());
    }).bind(this));
  },

  /**
   * @function
   */
  sync: function () {
    this._super();

    var theme = SL.view.getCurrentTheme();

    if (theme && theme.get('snippets') && !theme.get('snippets').isEmpty()) {
      this.$snippetsOptions.appendTo(this.$listElement);
    } else {
      this.$snippetsOptions.detach();
    }
  },

  /**
   * @function
   * @param {*|jQuery|HTMLElement} $optBtn
   * @param {Object} block
   */
  bindOption: function ($optBtn, block) {
    function optBtnClk() {
      if (!isMouseMove) {
        SL.editor.controllers.Blocks.add({
          type:         block.type,
          blockOptions: {insertedFromToolbar: true}
        });

        SL.analytics.trackEditor('Insert block', block.type);
      }
    }

    function mouseDown(evt) {
      isMouseDown = true;
      isMouseMove = false;
      mouseDownX  = evt.clientX;

      $(document).on('mousemove', mouseMove);
      $(document).on('mouseup', mouseUp);

      evt.preventDefault();
    }

    function mouseMove(evt) {
      if (isMouseDown && !isMouseMove && evt.clientX - mouseDownX > 10) {
        isMouseMove = true;

        var newBlock = SL.editor.controllers.Blocks.add({
            type:   block.type,
            silent: true,
            center: false
          }),
          offset = $('.reveal .slides').offset(),
          measure = newBlock.measure();

        newBlock.move(
          evt.clientX - offset.left - measure.width / 2,
          evt.clientY - offset.top - measure.height / 2);
        newBlock.onMouseDown(evt);

        SL.analytics.trackEditor('Insert block via drag', block.type);
      }

      evt.preventDefault();
    }

    function mouseUp() {
      $(document).off('mousemove', mouseMove);
      $(document).off('mouseup', mouseUp);

      isMouseDown = false;
      isMouseMove = false;
    }

    var mouseDownX = 0, isMouseDown = false, isMouseMove = false;

    $optBtn.on('vclick', optBtnClk);

    if (!SL.editor.controllers.Capabilities.isTouchEditor()) {
      $optBtn.on('mousedown', mouseDown);
    }
  }
});

SL('editor.components.toolbars').EditMultiple = SL.editor.components.toolbars.Base.extend({
  /**
   * Constructor SL.editor.components.toolbars.EditMultiple Instance
   *
   * @function
   */
  init: function () {
    this.options = [];
    this._super();
  },

  /**
   * @function
   */
  render: function () {
    this._super();
    this.$domElement.attr('data-type', 'edit-multiple');

    [
      SL.editor.components.toolbars.options.BlockAlignHorizontal,
      SL.editor.components.toolbars.options.BlockAlignVertical,
      SL.editor.components.toolbars.options.BlockDepth,
      SL.editor.components.toolbars.options.BlockActions
    ].forEach(this.renderOption.bind(this));
  },

  /**
   * @function
   * @param {ConstructionFunction} CreateOpt
   */
  renderOption: function (CreateOpt) {
    var opt =
      new CreateOpt(SL.editor.controllers.Blocks.getFocusedBlocks()[0]);
    opt.appendTo(this.$listElement);
    this.options.push(opt);
  },

  /**
   * @function
   */
  destroy: function () {
    for (; this.options.length;) {
      this.options.pop().destroy();
    }

    this._super();
  }
});

SL('editor.components.toolbars').Edit         = SL.editor.components.toolbars.Base.extend({
  /**
   * Constructor SL.editor.components.toolbars.Edit Instance
   *
   * @function
   * @param {Object} block
   */
  init: function (block) {
    this.block   = block;
    this.options = [];
    this._super();
  },

  /**
   * @function
   */
  render: function () {
    this._super();

    this.$domElement.attr('data-type', 'edit');
    this.block.getToolbarOptions().forEach(this.renderOption.bind(this));

    if (SL.current_user.isPro() && SL.view.isDeveloperMode()) {
      this.renderOption(SL.editor.components.toolbars.options.ClassName);
    }
  },

  /**
   * @function
   * @param {ConstructionFunction} CreateOpt
   */
  renderOption: function (CreateOpt) {
    var opt = new CreateOpt(this.block);

    opt.appendTo(this.$listElement);

    if (opt.changed) {
      opt.changed.add(this.sync.bind(this));
    }

    this.options.push(opt);
  },

  /**
   * @function
   */
  appendTo: function () {
    this._super.apply(this, arguments);
    this.sync();
  },

  /**
   * @function
   */
  destroy: function () {
    for (; this.options.length;) {
      this.options.pop().destroy();
    }

    this._super();
  }
});


SL('editor.components.toolbars.groups').Base      = Class.extend({
  /**
   * Constructor SL.editor.components.toolbars.groups.Base Instance
   *
   * @function
   * @param {Object} block
   * @param {Object} options
   */
  init: function (block, options) {
    this.block  = block;
    this.config = $.extend({
      label:     'Group',
      items:      [],
      expandable: true
    }, options);
    this.options = [];

    this.render();
    this.bind();
  },

  /**
   * @function
   */
  render: function () {
    this.$domElement = $('<div class="toolbar-option toolbar-group">');

    if (this.config.type) {
      this.$domElement.attr('data-group-type', this.config.type);
    }

    if (this.config.expandable) {
      this.$triggerElement = $('<div class="toolbar-group-trigger">')
        .appendTo(this.$domElement);
      this.$triggerElement.append([
        '<span class="label">',
          this.config.label,
        '</span>'].join(''));
      this.$triggerElement.append([
        '<span class="checkbox icon i-checkmark">',
        '</span>'].join(''));
      this.$optionsElement = $('<div class="toolbar-group-options">')
        .appendTo(this.$domElement);
      this.$optionsInnerElement = $('<div class="toolbar-group-options-inner">')
        .appendTo(this.$optionsElement);
    } else {
      this.$optionsInnerElement = $('<div class="toolbar-group-inner">')
        .appendTo(this.$domElement);
    }

    this.config.items.forEach(this.renderOption.bind(this));
  },

  /**
   * @function
   * @param {ConstructionFunction} Creater
   */
  renderOption: function (Creater) {
    var opt = new Creater(this.block);
    opt.appendTo(this.$optionsInnerElement);

    this.options.push(opt);
  },

  /**
   * @function
   */
  bind: function () {
    this.$domElement.find('.toolbar-group-trigger').on('vclick', this.onClicked.bind(this));
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
  sync: function () {
    this.expand();
  },

  /**
   * @function
   */
  trigger: function () {},

  /**
   * @function
   */
  expand: function () {
    if (this.config.expandable) {
      this.$domElement.addClass('expanded');
      this.$optionsElement
        .height(this.$optionsInnerElement.prop('scrollHeight') + 2);
    }

    this.options.forEach(function (opt) {
      if (typeof opt.readFromBlock === "function") {
        opt.readFromBlock();
      }
    });
  },

  /**
   * @function
   */
  collapse: function () {
    this.$domElement.removeClass('expanded');
    this.$optionsElement.height(0);
  },

  /**
   * @function
   * @returns {*}
   */
  isExpanded: function () {
    return this.$domElement.hasClass('expanded');
  },

  /**
   * @function
   * @param {Event} evt
   */
  onClicked: function (evt) {
    evt.preventDefault();
    this.trigger();
  },

  /**
   * @function
   */
  destroy: function () {
    for (; this.options.length;) {
      this.options.pop().destroy();
    }

    this.$domElement.remove();
  }
});

SL('editor.components.toolbars.groups').BorderCSS = SL.editor.components.toolbars.groups.Base.extend({
  /**
   * Constructor SL.editor.components.toolbars.groups.BorderCSS Instance
   *
   * @function
   * @param {Object} block
   * @param {Object} options
   */
  init: function (block, options) {
    this._super(block, $.extend({
      type:  'border-css',
      label: '边框',
      items: [
        SL.editor.components.toolbars.options.BorderStyle,
        SL.editor.components.toolbars.options.BorderWidth,
        SL.editor.components.toolbars.options.BorderRadius,
        SL.editor.components.toolbars.options.BorderColor
      ]
    }, options));
  },

  /**
   * @function
   */
  sync: function () {
    var style = this.block.get('style.border-style');

    if (style && style !== 'none') {
      this.expand();
    } else {
      this.collapse();
    }
  },

  /**
   * @function
   */
  trigger: function () {
    if (this.block.isset('style.border-style')) {
      this.block.unset('style.border-style');
      this.block.unset('style.border-radius');
    } else {
      this.block.set('style.border-style', 'solid');

      if (!this.block.isset('style.border-width')) {
        this.block.set('style.border-width', 1);
      }

      if (!this.block.isset('style.border-color')) {
        this.block.set('style.border-color', '#000');
      }
    }

    this.sync();
  }
});

SL('editor.components.toolbars.groups').BorderSVG = SL.editor.components.toolbars.groups.Base.extend({
  /**
   * Constructor SL.editor.components.toolbars.groups.BorderSVG Instance
   *
   * @function
   * @param {Object} block
   * @param {Object} options
   */
  init: function (block, options) {
    this._super(block, $.extend({
      type:  'border-svg',
      label: 'Border',
      items: [
        SL.editor.components.toolbars.options.ShapeStrokeWidth,
        SL.editor.components.toolbars.options.ShapeStrokeColor
      ]
    }, options));
  },

  /**
   * @function
   */
  sync: function () {
    if (this.block.supportsStroke()) {
      this.$domElement.show();

      if (this.block.hasStroke()) {
        this.expand();
        this.options.forEach(function (opt) {
          opt.readFromBlock();
        });
      } else {
        this.collapse();
      }
    } else {
      this.$domElement.hide();
    }
  },

  /**
   * @function
   */
  trigger: function () {
    this.block.toggleStroke();
    this.sync();
  }
});

SL('editor.components.toolbars.groups').Link      = SL.editor.components.toolbars.groups.Base.extend({
  /**
   * Constructor SL.editor.components.toolbars.groups.Link Instance
   *
   * @function
   * @param {Object} block
   * @param {Object} options
   */
  init: function (block, options) {
    this._super(block, $.extend({
      type:  'link',
      label: '链接',
      items: [
        SL.editor.components.toolbars.options.LinkURL
      ]
    }, options));
  },

  /**
   * @function
   */
  sync: function () {
    if (this.block.isLinked()) {
      this.expand();
    } else {
      this.collapse();
    }
  },

  /**
   * @function
   */
  trigger: function () {
    this.block.setLinkURL(this.block.isLinked() ? null : '');

    this.sync();

    if (this.isExpanded() &&
      !SL.editor.controllers.Capabilities.isTouchEditor() &&
      this.options && this.options[0] &&
      typeof this.options[0].focus === "function") {
      setTimeout((function () {
        this.options[0].focus();
      }).bind(this), 200);
    }
  }
});

SL('editor.components.toolbars.groups').TableSize = SL.editor.components.toolbars.groups.Base.extend({
  init: function (block, config) {
    this._super(block, $.extend({
      type:      'table-size',
      expandable: false,
      items: [
        SL.editor.components.toolbars.options.TableCols,
        SL.editor.components.toolbars.options.TableRows
      ]
    }, config));

    this.options[0].$domElement.after('<div class="cross">x</div>');

    this.setupBackfill();
    this.setupPreview();
  },
  sync: function () {
    this._super();
    this.refreshPreview();
  },
  setupBackfill: function () {
    this.options.forEach((function (opt) {
      opt.changeStarted.add(this.refreshBackfill.bind(this));
      opt.changeEnded.add(this.refreshBackfill.bind(this));
    }).bind(this));
  },
  refreshBackfill: function () {
    var opts = this.options.some((function (opt) {
      return opt.isChanging();
    }).bind(this));

    if (opts) {
      this.block.enableBackfill();
    } else {
      this.block.disableBackfill();
    }
  },
  setupPreview: function () {
    this.$canvasElement = $('<canvas class="table-preview"></canvas>').appendTo(this.$domElement);
    this.canvas = this.$canvasElement.get(0);
    this.canvasContext = this.canvas.getContext("2d");

    this.refreshPreview = this.refreshPreview.bind(this);

    this.block.tableSizeChanged.add(this.refreshPreview);
    this.block.tableHeaderChanged.add(this.refreshPreview);

    this.options.forEach((function (opt) {
      opt.changed.add(this.refreshPreview);
    }).bind(this));
  },
  refreshPreview: function () {
    var width = Math.round(this.$domElement.width()),
      height  = Math.round(0.8 * width);
    this.canvas.style.width  = width + 'px';
    this.canvas.style.height = height + 'px';

    width  *= 2;
    height *= 2;

    this.canvas.width  = width;
    this.canvas.height = height;

    this.canvasContext.clearRect(0, 0, width, height);

    var cols = this.block.get('attribute.data-table-cols'),
      rows   = this.block.get('attribute.data-table-rows'),
      header = this.block.get('attribute.data-table-has-header'),
      border = 4,
      perWidth  = width / cols,
      perHeight = height / rows;

    for (var i = 0; i < cols; i += 1) {
      for (var j = 0; j < rows; j += 1) {
        if (header && j === 0) {
          this.canvasContext.fillStyle = '#555';
        } else {
          this.canvasContext.fillStyle = '#444';
        }

        this.canvasContext.fillRect(
          i * perWidth + border / 2,
          j * perHeight + border / 2,
          perWidth - border,
          perHeight - border);
      }
    }
  },
  destroy: function () {
    if (this.block.tableSizeChanged) {
      this.block.tableSizeChanged.remove(this.refreshPreview);
    }

    this.options.forEach((function (opt) {
      opt.changed.remove(this.refreshPreview);
    }).bind(this));
    this._super();
  }
});


SL('editor.components.toolbars.options').Base     = Class.extend({
  /**
   * Constructor SL.editor.components.toolbars.options.Base Instance
   *
   * @function
   * @param {Object} block
   * @param {Object} config
   */
  init: function (block, config) {
    this.block    = block;
    this.config   = config || {};
    this.property = this.getPropertySettings();

    this.render();
    this.bind();
  },

  /**
   * @function
   */
  render: function () {
    this.$domElement = $('<div class="toolbar-option">');

    if (this.config.type) {
      this.$domElement.attr('data-option-type', this.config.type);
    }

    if (this.config.tooltip) {
      this.$domElement.attr({
        'data-tooltip':          this.config.tooltip,
        'data-tooltip-delay':    1000,
        'data-tooltip-maxwidth': 200
      });
    }

    if (this.config.label) {
      this.$domElement.append([
        '<h4 class="toolbar-option-label">',
          this.config.label,
        '</h4>'].join(''));

      if (this.config.helpTooltip) {
        var tooltip = '<div class="toolbar-option-help">';

        if (this.config.helpTooltipLink) {
          tooltip =
            '<a class="toolbar-option-help" href="' +
              this.config.helpTooltipLink +
            '" target="_blank">';
        }

        tooltip = $(tooltip);

        tooltip.attr({
          'data-tooltip':           this.config.helpTooltip,
          'data-tooltip-alignment': 'r',
          'data-tooltip-maxwidth':  240
        });
        tooltip.html('?');
        tooltip.appendTo(this.$domElement.find('.toolbar-option-label'));
      }
    }

  },

  /**
   * @function
   */
  bind: function () {
    if (this.config.shortcut) {
      window.Mousetrap.bind(this.config.shortcut, (function (evt) {
        evt.preventDefault();
        this.trigger();
      }).bind(this));
    }

    this.$domElement.on('vclick', this.onClicked.bind(this));
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
  destroy: function () {
    this.$domElement.remove();
  },

  /**
   * @function
   * @returns {*}
   */
  getPropertySettings: function () {
    if (this.block && typeof this.config.property === "string") {
      return this.block.getPropertySettings(this.config.property);
    } else {
      return null;
    }
  },

  /**
   * @function
   * @param {Event} evt
   */
  onClicked: function (evt) {
    if (!$(evt.target).is('.toolbar-option-help')) {
      evt.preventDefault();
    }
  }
});

SL('editor.components.toolbars.options').Value    = SL.editor.components.toolbars.options.Base.extend({
  /**
   * Constructor SL.editor.components.toolbars.options.Value Instance
   *
   * @function
   * @param {Object} block
   * @param {Object} config
   */
  init: function (block, config) {
    this._super(block, config);
    this.changed = new signals.Signal();
    this.value   = this.getDefaultValue();
  },

  /**
   * @function
   * @param {*|jQuery|HTMLElement} parent
   */
  appendTo: function (parent) {
    this._super(parent);
    this.readFromBlock();
  },

  /**
   * @function
   */
  readFromBlock: function () {
    this.setValue(this.block.get(this.config.property));
  },

  /**
   * @function
   */
  writeToBlock: function () {
    this.block.set(this.config.property, this.getValue());
  },

  /**
   * @function
   * @param {String|Object|*} val
   * @param {boolean}         isWriteToBlock
   */
  setValue: function (val, isWriteToBlock) {
    this.value = val;

    if (isWriteToBlock) {
      this.writeToBlock();
      this.changed.dispatch(this.value);
    }
  },

  /**
   * @function
   * @returns {*}
   */
  getValue: function () {
    return this.value;
  },

  /**
   * @function
   * @returns {*}
   */
  getDefaultValue: function () {
    return this.block.getPropertyDefault(this.config.property);
  },

  /**
   * @function
   * @returns {*}
   */
  getUnit: function () {
    return this.property.unit ? this.property.unit : '';
  },

  /**
   * @function
   */
  destroy: function () {
    this.changed.dispose();
    this._super();
  }
});

SL('editor.components.toolbars.options').Button   = SL.editor.components.toolbars.options.Base.extend({
  /**
   * Constructor SL.editor.components.toolbars.options.Button Instance
   *
   * @function
   * @param {Object} block
   * @param {Object} config
   */
  init: function (block, config) {
    this._super(block, config);
  },

  /**
   * @function
   */
  render: function () {
    this._super();
    this.$domElement.addClass('toolbar-button');

    if (this.config.title || this.config.icon) {
      this.$domElement.addClass('has-title');
      this.$titleElement = $('<div class="toolbar-option-title vcenter">')
          .appendTo(this.$domElement);

      if (this.config.title) {
        this.$titleElement.html([
          '<span class="title vcenter-target">',
            this.config.title,
          '</span>'].join(''));
      } else if (this.config.icon) {
        this.$domElement.addClass('is-icon');
        this.$titleElement.html([
          '<span class="icon i-' + this.config.icon + ' vcenter-target">',
          '</span>'].join(''));

        if (this.config.activeIcon) {
          this.$domElement.addClass('has-active-state');
          this.$activeElement = $('<div class="toolbar-option-title vcenter active">')
              .appendTo(this.$domElement);
          this.$activeElement.html([
            '<span class="icon i-' + this.config.activeIcon + ' vcenter-target">',
            '</span>'].join(''));
        }
      }
    }
  }
});

SL('editor.components.toolbars.options').Checkbox = SL.editor.components.toolbars.options.Value.extend({
  /**
   * Constructor SL.editor.components.toolbars.options.Checkbox Instance
   *
   * @function
   * @param {Object} block
   * @param {Object} config
   */
  init: function (block, config) {
    this._super(block, $.extend({
      type: 'checkbox'
    }, config));
  },

  /**
   * @function
   */
  render: function () {
    this._super();
    this.$domElement.addClass('toolbar-checkbox');
    this.$checkboxElement = $('<span class="checkbox icon i-checkmark">');
    this.$checkboxElement.appendTo(this.$domElement);
  },

  /**
   * @function
   * @param {String|Object|*} val
   * @param {boolean}         isWriteToBlock
   */
  setValue: function (val, isWriteToBlock) {
    this.$domElement.toggleClass('checked', val);
    this._super(val, isWriteToBlock);
  },

  /**
   * @function
   * @returns {*|String}
   */
  getValue: function () {
    return this.$domElement.hasClass('checked');
  },

  /**
   * @function
   * @param {Event} evt
   */
  onClicked: function (evt) {
    this._super(evt);
    this.setValue(!this.getValue(), true);
  }
});

SL('editor.components.toolbars.options').Color    = SL.editor.components.toolbars.options.Value.extend({
  /**
   * Constructor SL.editor.components.toolbars.options.Color Instance
   *
   * @function
   * @param {Object} block
   * @param {Object} config
   */
  init: function (block, config) {
    this._super(block, $.extend({
      type: 'color',
      alpha: false
    }, config));
  },

  /**
   * @function
   */
  render: function () {
    this._super();

    this.$domElement.addClass('toolbar-color');

    this.$triggerElement = $('<div class="toolbar-color-trigger">');
    this.$triggerElement.appendTo(this.$domElement);

    this.$triggerInnerElement = $('<div class="toolbar-color-trigger-inner">');
    this.$triggerInnerElement.appendTo(this.$triggerElement);

    this.$resetElement = $('<div class="toolbar-color-reset icon i-undo" ' +
      'data-tooltip="Use default color" data-tooltip-delay="500">');
    this.$resetElement.appendTo(this.$triggerElement);
  },

  /**
   * @function
   */
  bind: function () {
    this._super();
    this.$triggerInnerElement.on('vclick', this.onTriggerClicked.bind(this));
    this.$resetElement.on('vclick', this.onResetClicked.bind(this));
  },

  /**
   * @function
   */
  readFromBlock: function () {
    this._super();
    this.syncTriggerUI();
  },

  /**
   * @function
   * @param {String|Object|*} val
   * @param {boolean}         isWriteToBlock
   */
  setValue: function (val, isWriteToBlock) {
    this._super(val, isWriteToBlock);
    this.syncTriggerUI();
  },

  /**
   * @function
   */
  syncTriggerUI: function () {
    var value = this.getTriggerColor();

    this.$triggerElement.toggleClass(
      'transparent', tinycolor(this.value).getAlpha() < 1);
    this.$triggerInnerElement.css('background-color', value);
  },

  /**
   * @function
   * @returns {*}
   */
  getTriggerColor: function () {
    return this.value;
  },

  /**
   * @function
   * @returns {{
   *     anchor: (*|jQuery),
   *     alignment: string,
   *     alpha: *,
   *     color: *,
   *     changeCallback: *,
   *     resetCallback: (function(this:*))
   *   }}
   */
  getColorpickerConfig: function () {
    return {
      anchor:         this.$triggerElement,
      alignment:      'r',
      alpha:          this.config.alpha,
      color:          this.getValue(),
      changeCallback: this.setValue.bind(this),
      resetCallback:  this.onResetClicked.bind(this)
    };
  },

  /**
   * @function
   */
  onPanelShown: function () {
    this.readFromBlock();
    this.$domElement.addClass('is-active');
  },

  /**
   * @function
   */
  onPanelHidden: function () {
    this.pickerWrapper.spectrum('saveCurrentSelection');
    this.$domElement.removeClass('is-active');
  },

  /**
   * @function
   */
  onTriggerClicked: function () {
    SL.view.colorpicker.toggle(this.getColorpickerConfig());
  },

  /**
   * @function
   */
  onResetClicked: function () {
    this.setValue(this.getDefaultValue() || '', true);
    this.readFromBlock();

    SL.view.colorpicker.hide();
  },

  /**
   * @function
   */
  destroy: function () {
    this._super();
  }
});

SL('editor.components.toolbars.options').Multi    = SL.editor.components.toolbars.options.Base.extend({
  /**
   * Constructor SL.editor.components.toolbars.options.Multi Instance
   *
   * @function
   * @param {Object} block
   * @param {Object} config
   */
  init: function (block, config) {
    this._super(block, $.extend({
      type:  'multi',
      items: []
    }, config));
  },

  /**
   * @function
   */
  render: function () {
    this._super();

    this.$domElement.addClass('toolbar-multi');
    this.$domElement.attr('data-number-of-items', this.config.items.length);
    this.$innerElement = $('<div class="toolbar-multi-inner">')
      .appendTo(this.$domElement);

    this.config.items.forEach((function (item) {
      var $item = $([
        '<div class="toolbar-multi-item" data-value="' + item.value + '">',
          item.icon ?
            '<span class="icon i-' + item.icon + '"></span>' :
            item.title,
        '</div>'].join(''));

      if (item.tooltip) {
        $item.attr('data-tooltip', item.tooltip);
      }

      $item.appendTo(this.$innerElement);
    }).bind(this));
  },

  /**
   * @function
   */
  bind: function () {
    this._super();

    this.$domElement
      .find('.toolbar-multi-item')
      .on('vclick', this.onListItemClicked.bind(this));
  },

  /**
   * @function
   */
  trigger: function () {},

  /**
   * @function
   * @param {Event} evt
   */
  onListItemClicked: function (evt) {
    var val = $(evt.currentTarget).attr('data-value');

    if (val) {
      this.trigger(val);
    }
  }
});

SL('editor.components.toolbars.options').Radio    = SL.editor.components.toolbars.options.Value.extend({
  /**
   * Constructor SL.editor.components.toolbars.options.Radio Instance
   *
   * @function
   * @param {Object} block
   * @param {Object} config
   */
  init: function (block, config) {
    this._super(block, $.extend({
      type:  'radio',
      items: []
    }, config));
  },

  /**
   * @function
   */
  render: function () {
    this._super();

    this.$domElement.addClass('toolbar-radio');
    this.$domElement.attr('data-number-of-items', this.config.items.length);
    this.$innerElement = $('<div class="toolbar-radio-inner">')
      .appendTo(this.$domElement);

    this.config.items.forEach((function (item) {
      this.$innerElement.append([
        '<div class="toolbar-radio-item" data-value="' + item.value + '">',
          item.icon ?
            '<span class="icon i-' + item.icon + '"></span>' :
            item.title,
        '</div>'].join(''));
    }).bind(this));
  },

  /**
   * @function
   */
  bind: function () {
    this._super();
    this.$domElement.find('.toolbar-radio-item')
      .on('vclick', this.onListItemClicked.bind(this));
  },

  /**
   * @function
   * @param {String|Object|*} val
   * @param {boolean}         isWriteToBlock
   */
  setValue: function (val, isWriteToBlock) {
    if (this.hasValue(val)) {
      this.$domElement.find('.toolbar-radio-item').removeClass('selected');
      this.$domElement
        .find('.toolbar-radio-item[data-value="' + val + '"]')
        .first().addClass('selected');

      this._super(val, isWriteToBlock);
    }
  },

  /**
   * @function
   * @param {String|Object|*} val
   * @returns {*|Array}
   */
  hasValue: function (val) {
    return this.config.items.some(function (item) {
      return item.value === val;
    });
  },

  /**
   * @function
   * @param {Event} evt
   */
  onListItemClicked: function (evt) {
    var val = $(evt.currentTarget).attr('data-value');

    if (val) {
      this.setValue(val, true);
    }
  }
});

SL('editor.components.toolbars.options').Range    = SL.editor.components.toolbars.options.Value.extend({
  /**
   * Constructor SL.editor.components.toolbars.options.Range Instance
   *
   * @function
   * @param {Object} block
   * @param {Object} config
   */
  init: function (block, config) {
    this._super(block, $.extend({
      type: 'range'
    }, config));
  },

  /**
   * @function
   */
  render: function () {
    this._super();

    this.$domElement.addClass('toolbar-range');
    this.$rangeElement = $('<div class="range">');
    this.$rangeElement.appendTo(this.$domElement);
    this.$rangeProgressElement = $('<div class="range-progress">')
      .appendTo(this.$rangeElement);
    this.$rangeNumericElement = $('<div class="range-numeric">')
      .appendTo(this.$rangeElement);
  },

  /**
   * @function
   */
  bind: function () {
    this._super();

    this.changed     = new signals.Signal();

    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp   = this.onMouseUp.bind(this);

    this.$rangeElement.on('vmousedown', this.onMouseDown);
  },

  /**
   * @function
   * @param {String|Object|*} val
   * @param {boolean}         isWriteToBlock
   */
  setValue: function (val, isWriteToBlock) {
    val = Math.max(
      Math.min(val, this.property.maxValue), this.property.minValue);

    this.$rangeProgressElement.css('width', this.valueToPercent(val) + '%');

    this._super(val, isWriteToBlock);

    this.$rangeNumericElement.text(
      this.getValue().toFixed(this.property.decimals) + this.getUnit());
  },

  /**
   * @function
   * @returns {number}
   */
  getValue: function () {
    var width  = this.$rangeProgressElement.get(0).style.width,
      val      = this.percentToValue(parseInt(width, 10)),
      decimals = Math.pow(10, this.property.decimals);

    return Math.round(val * decimals) / decimals;
  },

  /**
   * @function
   * @param {Number} val
   * @returns {number}
   */
  valueToPercent: function (val) {
    var percent =
      (val - this.property.minValue) /
      (this.property.maxValue - this.property.minValue) * 100;

    return Math.max(Math.min(percent, 100), 0);
  },

  /**
   * @function
   * @param {Number} percent
   * @returns {number}
   */
  percentToValue: function (percent) {
    var scope = this.property.maxValue - this.property.minValue;
    return this.property.minValue + percent / 100 * scope;
  },

  /**
   * @function
   * @param {Event} evt
   */
  onMouseDown: function (evt) {
    evt.preventDefault();

    $(document).on('vmousemove', this.onMouseMove);
    $(document).on('vmouseup', this.onMouseUp);

    this.onMouseMove(evt);

    this.$rangeElement.addClass('is-scrubbing');
  },

  /**
   * @function
   * @param {Event} evt
   */
  onMouseMove: function (evt) {
    var pos = evt.clientX - this.$rangeElement.offset().left;

    this.setValue(
      this.percentToValue(pos / this.$rangeElement.width() * 100), true);
    this.writeToBlock();

    this.changed.dispatch(this.getValue());
  },

  /**
   * @function
   */
  onMouseUp: function () {
    $(document).off('vmousemove', this.onMouseMove);
    $(document).off('vmouseup', this.onMouseUp);

    this.$rangeElement.removeClass('is-scrubbing');
  }
});

SL('editor.components.toolbars.options').Select   = SL.editor.components.toolbars.options.Value.extend({
  /**
   * Constructor SL.editor.components.toolbars.options.Select Instance
   *
   * @function
   * @param {Object} block
   * @param {Object} config
   */
  init: function (block, config) {
    this._super(block, $.extend({
      type:          'select',
      panelType:     'select',
      panelWidth:    'auto',
      panelHeight:   'auto',
      panelMaxHeight: 300,
      value:          0,
      items:          []
    }, config));

    this.keySearchString  = '';
    this.keySearchTimeout = -1;
  },

  /**
   * @function
   */
  render: function () {
    this._super();

    this.$domElement.addClass('toolbar-select');
    this.$triggerElement = $('<div class="toolbar-select-trigger">');
    this.$triggerElement.appendTo(this.$domElement);
  },

  /**
   * @function
   */
  renderPanel: function () {
    this.panel = new SL.editor.components.toolbars.util.Panel({
      type:      this.config.panelType,
      anchor:    this.$triggerElement,
      keydown:   this.onKeyDown.bind(this),
      maxHeight: this.config.panelMaxHeight,
      width:     this.config.panelWidth,
      height:    this.config.panelHeight
    });
    this.panel.shown.add(this.onPanelShown.bind(this));

    this.config.items.forEach(this.renderItem.bind(this));
    this.getListElements().on('vclick', this.onListItemClicked.bind(this));
  },

  /**
   * @function
   * @param {Object} item
   */
  renderItem: function (item) {
    this.panel.$contentElement.append([
      '<div class="toolbar-select-item" data-value="' + item.value + '">',
        (item.title || item.value),
      '</div>'].join(''));
  },

  /**
   * @function
   * @param {String|Object|*} val
   * @param {boolean}         isWriteToBlock
   */
  setValue: function (val, isWriteToBlock) {
    if (this.hasValue(val)) {
      this._super(val, isWriteToBlock);

      this.displaySelectedValue();
      this.getListElements().removeClass('selected');
      this.getListElements()
        .filter('[data-value="' + this.value + '"]')
        .first().addClass('selected');
    }

    if (isWriteToBlock && this.panel) {
      this.panel.hide();
    }
  },

  /**
   * @function
   * @param {String|Object|*} val
   * @returns {*}
   */
  hasValue: function (val) {
    return this.config.items.some(function (item) {
      return item.value === val;
    });
  },

  /**
   * @function
   */
  displaySelectedValue: function () {
    this.$triggerElement.text(this.getTitleByValue(this.value));
  },

  /**
   * @function
   */
  clearFocus: function () {
    this.getListElements().removeClass('focused');
  },

  /**
   * @function
   */
  focusDefault: function () {
    var $elements = this.getListElements(),
      $focused    = $elements.filter('.focused'),
      $selected   = $elements.filter('.selected');

    if ($focused.length === 0) {
      if ($focused.length) {
        $selected.addClass('focused');
      } else {
        $elements.first().addClass('focused');
      }
    }
  },

  /**
   * @function
   * @param item
   */
  focusItem: function (item) {
    if (item && item.length) {
      this.getListElements().removeClass('focused');
      item.addClass('focused');
    }

    this.scrollIntoView();
  },

  /**
   * @function
   * @param {Number|*} step
   */
  focusStep: function (step) {
    this.focusDefault();

    var $focused = this.getListElements().filter('.focused');

    this.focusItem(step < 0 ? $focused.prev() : $focused.next());
    this.scrollIntoView();
  },

  /**
   * @function
   * @param {String} title
   */
  focusByTitle: function (title) {
    var $eles = this.getListElements().filter(function (index, item) {
      return item.textContent.toLowerCase().indexOf(title.toLowerCase()) === 0;
    });

    if ($eles.length) {
      this.focusItem($eles.first());
    }
  },

  /**
   * @function
   */
  scrollIntoView: function () {
    var $elements = this.getListElements(),
      $focused    = $elements.filter('.focused'),
      $selected   = $elements.filter('.selected');

    if ($focused.length) {
      SL.util.dom.scrollIntoViewIfNeeded($focused.get(0));
    } else if ($selected.length) {
      SL.util.dom.scrollIntoViewIfNeeded($selected.get(0));
    }
  },

  /**
   * @function
   * @param {String|Object|*} val
   * @returns {*|String}
   */
  getTitleByValue: function (val) {
    var title = null;

    this.config.items.forEach(function (item) {
      if (item.value === val) {
        title = item.title;
      }
    });

    return title;
  },

  /**
   * @function
   * @returns {*}
   */
  getDefaultValue: function () {
    return this.config.items[0].value;
  },

  /**
   * @function
   * @returns {*|jQuery|HTMLELement}
   */
  getListElements: function () {
    if (this.panel) {
      return this.panel.$contentElement.find('.toolbar-select-item');
    } else {
      return $();
    }
  },

  /**
   * @function
   * @param {Event} evt
   */
  onListItemClicked: function (evt) {
    var val = $(evt.currentTarget).attr('data-value');

    if (val) {
      this.setValue(val, true);
    }
  },

  /**
   * @function
   */
  onPanelShown: function () {
    this.getListElements().removeClass('selected');
    this.getListElements()
      .filter('[data-value="' + this.getValue() + '"]')
      .first().addClass('selected');

    this.scrollIntoView();
    this.clearFocus();
  },

  /**
   * @function
   * @param {Event} evt
   */
  onClicked: function (evt) {
    this._super(evt);

    if (this.panel) {
      this.panel.toggle();
    } else {
      this.renderPanel();
      this.panel.show();
    }
  },

  /**
   * @function
   * @param {Event} evt
   * @returns {boolean}
   */
  onKeyDown: function (evt) {
    if (evt.keyCode === 38 || evt.keyCode === 9 && evt.shiftKey) {
      this.focusStep(-1);
    } else if (evt.keyCode === 40 || evt.keyCode === 9) {
      this.focusStep(1);
    } else if (evt.keyCode === 13) {
      var val =
        this.getListElements().filter('.focused').attr('data-value');

      if (val) {
        this.setValue(val, true);
      }
    } else if (evt.keyCode === 27) {
      this.panel.hide();
    } else {
      var keyCodeStr = String.fromCharCode(evt.keyCode);

      if (keyCodeStr.match(/[A-Z0-9#\+]/i)) {
        clearTimeout(this.keySearchTimeout);

        this.keySearchTimeout = setTimeout(function () {
          this.keySearchString = '';
        }.bind(this), 500);

        this.keySearchString += keyCodeStr;
        this.focusByTitle(this.keySearchString);
      }
    }

    return false;
  },

  /**
   * @function
   */
  destroy: function () {
    if (this.panel) {
      this.panel.destroy();
      this.panel = null;
    }

    this._super();
  }
});

SL('editor.components.toolbars.options').Stepper  = SL.editor.components.toolbars.options.Value.extend({
  /**
   * Constructor SL.editor.components.toolbars.options.Stepper Instance
   *
   * @function
   * @param {Object} block
   * @param {Object} config
   */
  init: function (block, config) {
    this._super(block, $.extend({
      type: 'stepper'
    }, config));

    this.valueRange = this.property.maxValue - this.property.minValue;
    this.stepSize   = this.valueRange < 1 ? this.valueRange / 200 : 1;

    if (!!this.property.stepSize) {
      this.stepSize = this.property.stepSize;
    }

    this.changing       = false;
    this.mouseDownValue = 0;
    this.mouseDownX     = 0;
  },

  /**
   *  @function
   */
  render: function () {
    this._super();

    this.$domElement.addClass('toolbar-stepper');
    this.$stepperElement = $('<div class="stepper">');
    this.$stepperElement.appendTo(this.$domElement);
    this.$numberInput =
      $('<input type="text" class="stepper-number">').appendTo(this.$stepperElement);
  },

  /**
   *  @function
   */
  bind: function () {
    this._super();

    this.changed = new window.signals.Signal();

    this.changeStarted = new signals.Signal();
    this.changeEnded   = new signals.Signal();

    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp   = this.onMouseUp.bind(this);

    this.$stepperElement.on('vmousedown', this.onMouseDown);
    this.$numberInput.on('input', this.onInput.bind(this));
    this.$numberInput.on('keydown', this.onInputKeyDown.bind(this));
    this.$numberInput.on('focus', this.onInputFocused.bind(this));
    this.$numberInput.on('blur', this.onInputBlurred.bind(this));
  },

  /**
   * @function
   * @param {String|Object|*} val
   * @param {boolean}         isWriteToBlock
   * @param {boolean}         isSyncToInput
   */
  setValue: function (val, isWriteToBlock, isSyncToInput) {
    this.value = Math.max(
      Math.min(val, this.property.maxValue),
      this.property.minValue);
    this.value = this.roundValue(this.value);

    if (!isSyncToInput) {
      var unit = this.property.unit && !this.property.unitHidden ?
        this.property.unit : '';
      this.$numberInput.val(this.value + unit);
    }

    this._super(this.value, isWriteToBlock);
  },

  /**
   * @function
   * @param {String|Object|*} val
   * @returns {number}
   */
  roundValue: function (val) {
    var decimals = Math.pow(10, this.property.decimals);
    return Math.round(val * decimals) / decimals;
  },

  /**
   * @function
   * @returns {boolean}
   */
  isChanging: function () {
    return this.changing;
  },

  /**
   * @function
   */
  onChangeStart: function () {
    if (!this.isChanging()) {
      this.changing = true;
      this.changeStarted.dispatch();
    }
  },

  /**
   * @function
   */
  onChangeEnd: function () {
    this.changing = false;
    if (this.isChanging()) {
      this.changing = false;
      this.changeEnded.dispatch();
    }
  },

  /**
   * @function
   * @param {Event} evt
   */
  onMouseDown: function (evt) {
    if (!this.$numberInput.is(':focus')) {
      evt.preventDefault();
    }

    $(document).on('vmousemove', this.onMouseMove);
    $(document).on('vmouseup', this.onMouseUp);

    this.mouseDownX     = evt.clientX;
    this.mouseDownValue = this.getValue();

    this.onChangeStart();
  },

  /**
   * @function
   * @param {Event} evt
   */
  onMouseMove: function (evt) {
    this.$stepperElement.addClass('is-scrubbing');

    var offset = evt.clientX - this.mouseDownX;

    if (this.stepSize === 1 && this.valueRange < 15) {
      offset *= 0.25;
    } else if (this.stepSize === 1 && this.valueRange < 30) {
      offset *= 0.5;
    }

    this.setValue(this.mouseDownValue + offset * this.stepSize, true);
    this.writeToBlock();
    this.changed.dispatch(this.getValue());
  },

  /**
   * @function
   * @param {Event} evt
   */
  onMouseUp: function (evt) {
    $(document).off('vmousemove', this.onMouseMove);
    $(document).off('vmouseup', this.onMouseUp);

    if (this.$stepperElement.hasClass('is-scrubbing') === false) {
      this.onClick(evt);
    } else {
      this.onChangeEnd();
    }

    this.$stepperElement.removeClass('is-scrubbing');
  },

  /**
   * @function
   */
  onClick: function () {
    this.$numberInput.focus();
  },

  /**
   * @function
   */
  onInput: function () {
    this.setValue(parseFloat(this.$numberInput.val()), true, true);
    this.writeToBlock();
  },

  /**
   * @function
   * @param {Event} evt
   */
  onInputKeyDown: function (evt) {
    var stepSize = 0;

    if (evt.keyCode === 38) {
      stepSize = this.stepSize;
    } else if (evt.keyCode === 40) {
      stepSize = -this.stepSize;
    }

    if (stepSize) {
      if (evt.shiftKey) {
        stepSize *= 10;
      }

      this.setValue(this.getValue() + stepSize, true);
      this.writeToBlock();

      evt.preventDefault();
    }
  },

  /**
   * @function
   */
  onInputFocused: function () {
    this.onChangeStart();
  },

  /**
   * @function
   */
  onInputBlurred: function () {
    this.onChangeEnd();
    this.setValue(this.getValue(), true);
  },
  destroy : function () {
    this.changeStarted.dispose();
    this.changeEnded.dispose();
    this._super();
  }
});

SL('editor.components.toolbars.options').Text     = SL.editor.components.toolbars.options.Value.extend({
  /**
   * Constructor SL.editor.components.toolbars.options.Text Instance
   *
   * @function
   * @param {Object} block
   * @param {Object} config
   */
  init: function (block, config) {
    this._super(block, $.extend({
      type:        'text',
      multiline:   false,
      expandable:  false,
      maxlength:   255,
      placeholder: ''
    }, config));
  },

  /**
   * @function
   */
  render: function () {
    this._super();

    this.$domElement.addClass('toolbar-text');

    if (this.config.multiline) {
      this.$inputElement = $('<textarea></textarea>');

      if (this.config.expandable) {
        this.$expandElement =
          $('<div class="expand-button icon i-fullscreen"></div>');
        this.$expandElement.appendTo(this.$domElement);
      }
    } else {
      this.$inputElement = $('<input />');
    }

    this.$inputElement.attr({
      'class':     'toolbar-text-input',
      maxlength:   this.config.maxlength,
      placeholder: this.config.placeholder
    });
    this.$inputElement.appendTo(this.$domElement);
  },

  /**
   * @function
   */
  bind: function () {
    this._super();

    this.$inputElement.on('input', this.onInputChange.bind(this));

    if (this.$expandElement) {
      this.$expandElement.on('vclick', this.onExpandClicked.bind(this));
    }
  },

  /**
   * @function
   */
  focus: function () {
    this.$inputElement.focus();
  },

  /**
   * @function
   */
  expand: function () {
    if (!this.editor) {
      this.editor = new SL.components.TextEditor({
        type: 'code',
        value: this.getValue()
      });
      this.editor.saved.add((function (val) {
        this.setValue(val);
        this.writeToBlock();
        this.editor = null;
      }).bind(this));
      this.editor.canceled.add((function () {
        this.editor = null;
      }).bind(this));
    }
  },

  /**
   * @function
   */
  destroy: function () {
    if (this.editor) {
      this.editor.destroy();
      this.editor = null;
    }

    this._super();
  },

  /**
   * @function
   * @param {String|Object|*} val
   */
  setValue: function (val) {
    this.$inputElement.val(val);
    this._super(val);
  },

  /**
   * @function
   * @returns {*}
   */
  getValue: function () {
    return this.$inputElement.val();
  },

  /**
   * function
   */
  onInputChange: function () {
    this.writeToBlock();
  },

  /**
   * @function
   */
  onExpandClicked: function () {
    this.expand();
  }
});

SL('editor.components.toolbars.options').Toggle   = SL.editor.components.toolbars.options.Value.extend({
  /**
   * Constructor SL.editor.components.toolbars.options.Toggle Instance
   *
   * @function
   * @param {Object} block
   * @param {Object} config
   */
  init: function (block, config) {
    this._super(block, config);
  },

  /**
   * @function
   */
  render: function () {
    this._super();
    this.$domElement.addClass('toolbar-toggle');
  },

  /**
   * @function
   */
  bind: function () {
    this._super();
  },

  /**
   * @function
   * @param {String|Object|*} val
   * @param {boolean}         isWriteToBlock
   */
  setValue: function (val, isWriteToBlock) {
    this.$domElement.attr('data-value', val);
    this._super(val, isWriteToBlock);
  },

  /**
   * @function
   * @param {Event} evt
   */
  onClicked: function (evt) {
    evt.preventDefault();
    this.setValue(!this.getValue(), true);
  }
});

SL('editor.components.toolbars.options').Back     = SL.editor.components.toolbars.options.Base.extend({
  /**
   * Constructor SL.editor.components.toolbars.options.Back Instance
   *
   * @function
   * @param {Object} block
   * @param {Object} config
   */
  init: function (block, config) {
    this._super(block, $.extend({
      type:    'back',
      icon:    'arrow-up',
      tooltip: 'Go back'
    }, config));
  },

  /**
   * @function
   * @param {Event} evt
   */
  onClicked: function (evt) {
    this._super(evt);
    SL.view.toolbars.pop();
  }
});

SL('editor.components.toolbars.options').BackgroundColor      = SL.editor.components.toolbars.options.Color.extend({
  /**
   * Constructor SL.editor.components.toolbars.options.BackgroundColor Instance
   *
   * @function
   * @param {Object} block
   * @param {Object} config
   */
  init: function (block, config) {
    this._super(block, $.extend({
      type:     'background-color',
      label:    '背景颜色',
      property: 'style.background-color',
      alpha: true
    }, config));
  },

  /**
   * @function
   * @returns {*|Object}
   */
  getColorpickerConfig: function () {
    var config = this._super.apply(this, arguments),
      clr = window.tinycolor(this.getValue()).toRgb();

    if (clr.r === 0 && clr.g === 0 && clr.b === 0 && clr.a === 0) {
      config.color = '#000000';
    }

    return config;
  }
});

SL('editor.components.toolbars.options').BlockActions         = SL.editor.components.toolbars.options.Multi.extend({
  /**
   * Constructor SL.editor.components.toolbars.options.BlockActions Instance
   *
   * @function
   * @param {Object} block
   * @param {Object} config
   */
  init: function (block, config) {
    var items = [{
      value: 'duplicate', icon: 'new-window', tooltip: '复制'
    }, {
      value: 'delete', icon: 'trash-fill', tooltip: '删除'
    }];

    if (block &&
      block.options.horizontalResizing &&
      block.options.verticalResizing) {
      items.unshift({
        value:   'expand',
        icon:    'fullscreen',
        tooltip: '满屏'
      });
    }

    if (block && block.hasPlugin(SL.editor.blocks.plugin.HTML)) {
      items.unshift({
        value:   'html',
        icon:    'file-xml',
        tooltip: '编辑 HTML'
      });
    }

    this._super(block, $.extend({
      type:  'block-actions',
      label: '操作',
      items: items
    }, config));

  },

  /**
   * @function
   * @param {String|*} action
   */
  trigger: function (action) {
    var blocks = SL.editor.controllers.Blocks.getFocusedBlocks();

    if (action === 'html') {
      blocks[0].editHTML();
      SL.analytics.trackEditor('Toolbar: Edit HTML');
    } else if (action === 'expand') {
      blocks.forEach(function (block) {
        block.resize({
          width:  SL.config.SLIDE_WIDTH,
          height: SL.config.SLIDE_HEIGHT
        });
        block.moveToCenter();
      });

      SL.analytics.trackEditor('Toolbar: Expand block');
    } else if (action === 'duplicate') {
      SL.editor.controllers.Blocks.copy();
      SL.editor.controllers.Blocks.paste();

      SL.analytics.trackEditor('Toolbar: Duplicate block');
    } else if (action === 'delete') {
      blocks.forEach(function (block) {
        block.destroy();
      });

      SL.analytics.trackEditor('Toolbar: Delete block');
    }
  }
});

SL('editor.components.toolbars.options').BlockAlignHorizontal = SL.editor.components.toolbars.options.Multi.extend({
  /**
   * Constructor SL.editor.components.toolbars.options.BlockAlignHorizontal Instance
   *
   * @function
   * @param {Object} block
   * @param {Object} config
   */
  init: function (block, config) {
    this._super(block, $.extend({
      type: 'block-align-horizontal',
      label: 'Alignment',
      items: [{
        value: 'left', icon: 'alignleftedges'
      }, {
        value: 'horizontal-center', icon: 'alignhorizontalcenters'
      }, {
        value: 'right', icon: 'alignrightedges'
      }]
    }, config));
  },

  /**
   * @function
   * @param {String|*} alignment
   */
  trigger: function (alignment) {
    this._super(alignment);

    SL.editor.controllers.Blocks.align(
      SL.editor.controllers.Blocks.getFocusedBlocks(), alignment);
  }
});

SL('editor.components.toolbars.options').BlockAlignVertical   = SL.editor.components.toolbars.options.Multi.extend({
  /**
   * Constructor SL.editor.components.toolbars.options.BlockAlignVertical Instance
   *
   * @function
   * @param {Object} block
   * @param {Object} config
   */
  init: function (block, config) {
    this._super(block, $.extend({
      type: 'block-align-vertical',
      items: [{
        value: 'top', icon: 'aligntopedges'
      }, {
        value: 'vertical-center', icon: 'alignverticalcenters'
      }, {
        value: 'bottom', icon: 'alignbottomedges'
      }]
    }, config));
  },

  /**
   * @function
   * @param {String|*} alignment
   */
  trigger: function (alignment) {
    this._super(alignment);

    SL.editor.controllers.Blocks.align(
      SL.editor.controllers.Blocks.getFocusedBlocks(), alignment);
  }
});

SL('editor.components.toolbars.options').BlockDepth     = SL.editor.components.toolbars.options.Multi.extend({
  /**
   * Constructor SL.editor.components.toolbars.options.BlockDepth Instance
   *
   * @function
   * @param {Object} block
   * @param {Object} config
   */
  init: function (block, config) {
    this._super(block, $.extend({
      type:  'block-depth',
      label: '深度',
      items: [{
        value: 'back', icon: 'arrow-down', tooltip: '移动到后面'
      }, {
        value: 'front', icon: 'arrow-up', tooltip: '移动到前面'
      }]
    }, config));
  },

  /**
   * @function
   * @param {String|*} alignment
   */
  trigger: function (action) {
    if (action === 'front') {
      SL.editor.controllers.Blocks.moveBlocksToDepth(
        SL.editor.controllers.Blocks.getFocusedBlocks(), 1e4);
    } else if (action === 'back') {
      SL.editor.controllers.Blocks.moveBlocksToDepth(
        SL.editor.controllers.Blocks.getFocusedBlocks(), 0);
    }
  }
});

SL('editor.components.toolbars.options').BorderColor    = SL.editor.components.toolbars.options.Color.extend({
  /**
   * Constructor SL.editor.components.toolbars.options.BorderColor Instance
   *
   * @function
   * @param {Object} block
   * @param {Object} config
   */
  init: function (block, config) {
    this._super(block, $.extend({
      type:     'border-color',
      label:    '颜色',
      property: 'style.border-color'
    }, config));
  }
});

SL('editor.components.toolbars.options').BorderRadius   = SL.editor.components.toolbars.options.Stepper.extend({
  /**
   * Constructor SL.editor.components.toolbars.options.BorderRadius Instance
   *
   * @function
   * @param {Object} block
   * @param {Object} config
   */
  init: function (block, config) {
    this._super(block, $.extend({
      type:     'border-radius',
      label:    '半径',
      property: 'style.border-radius'
    }, config));
  }
});

SL('editor.components.toolbars.options').BorderStyle    = SL.editor.components.toolbars.options.Select.extend({
  /**
   * Constructor SL.editor.components.toolbars.options.BorderStyle Instance
   *
   * @function
   * @param {Object} block
   * @param {Object} config
   */
  init: function (block, config) {
    this._super(block, $.extend({
      type:     'border-style',
      label:    '样式',
      property: 'style.border-style',
      items:    block.getPropertySettings('style.border-style').options
    }, config));
  }
});

SL('editor.components.toolbars.options').BorderWidth    = SL.editor.components.toolbars.options.Stepper.extend({
  /**
   * Constructor SL.editor.components.toolbars.options.BorderWidth Instance
   *
   * @function
   * @param {Object} block
   * @param {Object} config
   */
  init: function (block, config) {
    this._super(block, $.extend({
      type:     'border-width',
      label:    '宽度',
      property: 'style.border-width'
    }, config));
  }
});


SL('editor.components.toolbars.options').Divider        = SL.editor.components.toolbars.options.Base.extend({
  /**
   * Constructor SL.editor.components.toolbars.options.Divider Instance
   *
   * @function
   * @param {Object} block
   * @param {Object} config
   */
  init: function (block, config) {
    this._super(block, $.extend({
      type: 'divider'
    }, config));

    this.$domElement.addClass('toolbar-divider');
  }
});

SL('editor.components.toolbars.options').HTML           = SL.editor.components.toolbars.options.Button.extend({
  /**
   * Constructor SL.editor.components.toolbars.options.HTML Instance
   *
   * @function
   * @param {Object} block
   * @param {Object} config
   */
  init: function (block, config) {
    this._super(block, $.extend({
      title:    'Edit HTML',
      property: 'html.value'
    }, config));
  },

  /**
   * @function
   * @param {Event} evt
   */
  onClicked: function (evt) {
    this._super(evt);
    this.block.editHTML();
  }
});

SL('editor.components.toolbars.options').IframeAutoplay = SL.editor.components.toolbars.options.Checkbox.extend({
  /**
   * Constructor SL.editor.components.toolbars.options.IframeAutoplay Instance
   *
   * @function
   * @param {Object} block
   * @param {Object} config
   */
  init: function (block, config) {
    this._super(block, $.extend({
      type:     'iframe-autoplay',
      label:    'Autoplay',
      property: 'iframe.autoplay'
    }, config));

    this.updateVisibility();
  },

  /**
   * @function
   */
  bind: function () {
    this._super();

    if (this.block) {
      this.updateVisibility = this.updateVisibility.bind(this);
      this.block.iframeSourceChanged.add(this.updateVisibility);
    }
  },

  /**
   * @function
   * @param {String|Object|*} val
   * @param {boolean}         isWriteToBlock
   */
  setValue: function (val, isWriteToBlock) {
    this._super(val, isWriteToBlock);
  },

  /**
   * @function
   */
  updateVisibility: function () {
    var src = this.block.get('iframe.src');

    if (src &&
      (/^.*(youtube\.com\/embed\/)/.test(src) ||
      /^.*(player\.vimeo.com\/)/.test(src))) {
      this.$domElement.show();
    } else {
      this.$domElement.hide();
    }
  },

  /**
   * @function
   */
  destroy: function () {
    if (this.block && !this.block.destroyed) {
      this.block.iframeSourceChanged.remove(this.updateVisibility);
    }

    this._super();
  }
});

SL('editor.components.toolbars.options').IframeSRC      = SL.editor.components.toolbars.options.Text.extend({
  /**
   * Constructor SL.editor.components.toolbars.options.IframeSRC Instance
   *
   * @function
   * @param {Object} block
   * @param {Object} config
   */
  init: function (block, config) {
    this._super(block, $.extend({
      type:        'iframe-src',
      label:       'Iframe 来源',
      property:    'iframe.src',
      placeholder: 'URL or <iframe>...',
      multiline:   true,
      maxlength:   2000
    }, config));
  },

  /**
   * @function
   */
  bind: function () {
    this._super();

    if (this.block) {
      this.onEditingRequested = this.onEditingRequested.bind(this);
      this.block.editingRequested.add(this.onEditingRequested);
    }
  },

  /**
   * @function
   */
  destroy: function () {
    if (this.block) {
      this.block.editingRequested.remove(this.onEditingRequested);
    }

    this._super();
  },

  /**
   * @function
   */
  writeToBlock: function () {
    var val = this.getValue().trim();

    if (SL.util.string.URL_REGEX.test(val)) {
      this.block.set(this.config.property, val);
    } else {
      this.block.set(this.config.property, '');
    }
  },

  /**
   * @function
   */
  onInputChange: function () {
    var val = this.getValue();

    if (/<iframe/gi.test(val)) {
      try {
        this.setValue($(val).attr('src'));
      } catch (err) {}
    }

    this.writeToBlock();
  },

  /**
   * @function
   */
  onEditingRequested: function () {
    this.focus();
  }
});

SL('editor.components.toolbars.options').ImageInlineSVG = SL.editor.components.toolbars.options.Checkbox.extend({
  /**
   * Constructor SL.editor.components.toolbars.options.ImageInlineSVG Instance
   *
   * @function
   * @param {Object} block
   * @param {Object} config
   */
  init: function (block, config) {
    this._super(block, $.extend({
      type:     'image-inline-svg',
      label:    'Inline SVG',
      property: 'attribute.data-inline-svg'
    }, config));

    this.sync = this.sync.bind(this);
    block.imageURLChanged.add(this.sync);
  },

  /**
   * @function
   */
  sync: function () {
    if (this.block.isSVG()) {
      this.$domElement.show();
    } else {
      this.$domElement.hide();
    }
  },

  /**
   * @function
   */
  destroy: function () {
    if (this.block.imageURLChanged) {
      this.block.imageURLChanged.remove(this.sync);
    }

    this._super();
  }
});

SL('editor.components.toolbars.options').Image          = SL.editor.components.toolbars.options.Base.extend({
  /**
   * Constructor SL.editor.components.toolbars.options.Image Instance
   *
   * @function
   * @param {Object} block
   * @param {Object} config
   */
  init: function (block, config) {
    this._super(block, $.extend({
      type: 'image',
      labe: '图片'
    }, config));

    this.syncUI();
  },

  /**
   * @function
   */
  render: function () {
    this._super();

    this.$domElement.addClass('toolbar-image');
    this.$innerElement = $('<div class="toolbar-image-inner">')
      .appendTo(this.$domElement);
    this.$placeholderElement = $('<div class="toolbar-image-placeholder">')
      .appendTo(this.$innerElement);
    this.$labelElement = $('<div class="toolbar-image-label">Select</div>')
      .appendTo(this.$innerElement);
    this.$urlElement = $('<div class="toolbar-image-url icon i-link"></div>')
      .appendTo(this.$innerElement);
    this.$spinnerElement = $([
      '<div class="toolbar-image-progress">',
        '<span class="spinner centered"></span>',
      '</div>'].join('')).appendTo(this.$innerElement);
  },

  /**
   * @function
   */
  bind: function () {
    this._super();

    this.onMediaLibrarySelection = this.onMediaLibrarySelection.bind(this);
    this.syncUI                  = this.syncUI.bind(this);

    this.block.imageStateChanged.add(this.syncUI);

    this.$innerElement.on('vclick', (function (evt) {
      if ($(evt.target).closest('.toolbar-image-url').length === 0) {
        var popup =
          SL.popup.open(SL.editor.components.medialibrary.MediaLibrary, {
            select: SL.models.Media.IMAGE
          });
        popup.selected.addOnce(this.onMediaLibrarySelection);
      } else {
        this.onEditURLClicked(evt);
      }
    }).bind(this));
  },

  /**
   * @function
   */
  syncUI: function () {
    if (this.block.hasImage()) {
      var src = this.block.get('image.src');

      this.$innerElement.css('background-image', 'url(' + src + ')', '');
      this.$placeholderElement.hide();
      this.$urlElement.toggle(src.search(SL.config.S3_HOST) !== 0);
    } else {
      this.$innerElement.css('background-image', '');
      this.$placeholderElement.show();
      this.$urlElement.show();
    }

    if (this.block.isLoading() || this.block.isUploading()) {
      this.$spinnerElement.show();
      SL.util.html.generateSpinners();
    } else {
      this.$spinnerElement.hide();
    }
  },

  /**
   * @function
   * @param {Event} evt
   */
  onEditURLClicked: function (evt) {
    evt.preventDefault();

    var prompt = SL.prompt({
      anchor:        this.$urlElement,
      title:         'Image URL',
      type:          'input',
      confirmLabel:  'Save',
      alignment:     'r',
      data: {
        value:       this.block.get('image.src'),
        placeholder: 'http://...',
        width:       400
      }
    });
    prompt.confirmed.add((function (src) {
      this.block.set('image.src', src);
      this.syncUI();
    }).bind(this));
  },

  /**
   * @function
   * @param {Object} media
   */
  onMediaLibrarySelection: function (media) {
    this.block.setImageModel(media);
    this.syncUI();
  },

  /**
   * @function
   */
  destroy: function () {
    if (this.block.imageStateChanged) {
      this.block.imageStateChanged.remove(this.syncUI);
    }

    this._super();
  }
});

SL('editor.components.toolbars.options').LetterSpacing  = SL.editor.components.toolbars.options.Stepper.extend({
  /**
   * Constructor SL.editor.components.toolbars.options.LetterSpacing Instance
   *
   * @function
   * @param {Object} block
   * @param {Object} config
   */
  init: function (block, config) {
    this._super(block, $.extend({
      type:     'letter-spacing',
      label:    '字间距',
      property: 'style.letter-spacing'
    }, config));
  }
});

SL('editor.components.toolbars.options').LineHeight     = SL.editor.components.toolbars.options.Stepper.extend({
  /**
   * Constructor SL.editor.components.toolbars.options.LineHeight Instance
   *
   * @function
   * @param {Object} block
   * @param {Object} config
   */
  init: function (block, config) {
    this._super(block, $.extend({
      type:     'line-height',
      label:    '行高',
      property: 'style.line-height'
    }, config));
  }
});

SL('editor.components.toolbars.options').LinkURL        = SL.editor.components.toolbars.options.Text.extend({
  /**
   * Constructor SL.editor.components.toolbars.options.LinkURL Instance
   *
   * @function
   * @param {Object} block
   * @param {Object} config
   */
  init: function (block, config) {
    this._super(block, $.extend({
      type:        'link-url',
      property:    'link.href',
      placeholder: 'http://'
    }, config));
  },

  /**
   * @function
   */
  writeToBlock: function () {
    var val = this.getValue().trim();

    if (SL.util.string.URL_REGEX.test(val) || /^#\/\d/.test(val)) {
      this.block.set(this.config.property, val);
    } else {
      this.block.set(this.config.property, '');
    }
  }
});


SL('editor.components.toolbars.options').Opacity          = SL.editor.components.toolbars.options.Range.extend({
  /**
   * Constructor SL.editor.components.toolbars.options.Opacity Instance
   *
   * @function
   * @param {Object} block
   * @param {Object} config
   */
  init: function (block, config) {
    this._super(block, $.extend({
      type:     'opacity',
      label:    '透明度',
      property: 'style.opacity'
    }, config));
  }
});

SL('editor.components.toolbars.options').Padding          = SL.editor.components.toolbars.options.Stepper.extend({
  /**
   * Constructor SL.editor.components.toolbars.options.Padding Instance
   *
   * @function
   * @param {Object} block
   * @param {Object} config
   */
  init: function (block, config) {
    this._super(block, $.extend({
      type:     'padding',
      label:    '内边距',
      property: 'style.padding'
    }, config));
  },

  /**
   * @function
   */
  syncPaddingHint: function () {
    if (this.isChanging()) {
      this.block.showPaddingHint();
    } else {
      this.block.hidePaddingHint();
    }
  },

  /**
   * @function
   */
  writeToBlock: function () {
    this._super.apply(this, arguments);
    this.syncPaddingHint();
  },

  /**
   * @function
   */
  onMouseMove: function () {
    this._super.apply(this, arguments);
    this.syncPaddingHint();
  },

  /**
   * @function
   */
  onMouseUp: function () {
    this._super.apply(this, arguments);
    this.syncPaddingHint();
  },

  /**
   * @function
   */
  onInputFocused: function () {
    this._super.apply(this, arguments);
    this.syncPaddingHint();
  },

  /**
   * @function
   */
  onInputBlurred: function () {
    this._super.apply(this, arguments);
    this.syncPaddingHint();
  }
});

SL('editor.components.toolbars.options').ShapeFillColor   = SL.editor.components.toolbars.options.Color.extend({
  init: function (block, config) {
    this._super(block, $.extend({
      type:     'shape-fill-color',
      label:    '颜色',
      property: 'attribute.data-shape-fill-color',
      alpha:    true
    }, config));
  }
});

SL('editor.components.toolbars.options').ShapeStretch     = SL.editor.components.toolbars.options.Checkbox.extend({
  init: function (block, config) {
    this._super(block, $.extend({
      type:     'shape-stretch',
      label:    '拉伸填充',
      property: 'attribute.data-shape-stretch'
    }, config));
  }
});

SL('editor.components.toolbars.options').ShapeStrokeColor = SL.editor.components.toolbars.options.Color.extend({
  init: function (block, config) {
    this._super(block, $.extend({
      type:     'shape-stroke-color',
      label:    '颜色',
      property: 'attribute.data-shape-stroke-color'
    }, config));
  }
});

SL('editor.components.toolbars.options').ShapeStrokeWidth = SL.editor.components.toolbars.options.Stepper.extend({
  init: function (block, config) {
    this._super(block, $.extend({
      type:     'shape-stroke-width',
      label:    '宽度',
      property: 'attribute.data-shape-stroke-width'
    }, config));
  }
});

SL('editor.components.toolbars.options').ShapeType        = SL.editor.components.toolbars.options.Select.extend({
  init: function (block, config) {
    this._super(block, $.extend({
      type:           'shape-type',
      panelType:      'shape-type',
      panelWidth:     246,
      panelMaxHeight: 430,
      label:    '图形',
      property: 'attribute.data-shape-type',
      items:    block.getPropertySettings('attribute.data-shape-type').options
    }, config));
  },
  renderPanel: function () {
    this._super.apply(this, arguments);

    this.renderAttribution();
  },
  renderItem: function (item) {
    var width = 32, height = 32,
      svg = document.createElementNS(SL.util.svg.NAMESPACE, 'svg');

    svg.setAttribute('xmlns', SL.util.svg.NAMESPACE);
    svg.setAttribute('version', '1.1');
    svg.setAttribute('width', width + 'px');
    svg.setAttribute('height', height + 'px');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid');

    var shape = SL.editor.blocks.Shape.shapeFromType(item.value);

    shape.setAttribute('fill', '#333333');
    svg.appendChild(shape);

    var $item =
      $('<div class="toolbar-select-item" data-value="' + item.value + '">');

    $item.append(svg);
    $item.appendTo(this.panel.$contentElement);

    var box = SL.util.svg.boundingBox(shape);

    svg.setAttribute(
      'viewBox', [
        Math.round(box.x) || 0,
        Math.round(box.y) || 0,
        Math.round(box.width) || 32,
        Math.round(box.height) || 32
      ].join(' '));
  },
  renderAttribution: function () {
    var $attr = $('<div class="toolbar-select-attribution">');

    $attr.html(
      '<a href="/about#credits" target="_blank">Icons from IcoMoon</a>');
    $attr.appendTo(this.panel.$contentElement);
  },
  displaySelectedValue: function () {
    var width = 32, height = 32,
      svg = document.createElementNS(SL.util.svg.NAMESPACE, 'svg');

    svg.setAttribute('xmlns', SL.util.svg.NAMESPACE);
    svg.setAttribute('version', '1.1');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid');

    var shape =
      SL.editor.blocks.Shape.shapeFromType(this.value, width, height);

    shape.setAttribute('fill', '#fff');
    svg.appendChild(shape);

    this.$triggerElement.find('svg').remove();
    this.$triggerElement.append(svg);

    var box = SL.util.svg.boundingBox(shape);

    svg.setAttribute(
      'viewBox', [
        Math.round(box.x) || 0,
        Math.round(box.y) || 0,
        Math.round(box.width) || 32,
        Math.round(box.height) || 32
      ].join(' '));
  }
});

SL('editor.components.toolbars.options').TextAlign        = SL.editor.components.toolbars.options.Radio.extend({
  init: function (block, config) {
    this._super(block, $.extend({
      type:     'text-align',
      label:    '文本对齐',
      property: 'style.text-align',
      items:    block.getPropertySettings('style.text-align').options
    }, config));
  }
});

SL('editor.components.toolbars.options').TextColor        = SL.editor.components.toolbars.options.Color.extend({
  init: function (block, config) {
    this._super(block, $.extend({
      type:     'text-color',
      label:    '文字颜色',
      property: 'style.color'
    }, config));
  }
});

SL('editor.components.toolbars.options').TextSize         = SL.editor.components.toolbars.options.Stepper.extend({
  init: function (block, config) {
    this._super(block, $.extend({
      type:     'text-size',
      label:    '文字大小',
      property: 'style.font-size'
    }, config));
  }
});

SL('editor.components.toolbars.options').TableCols        = SL.editor.components.toolbars.options.Stepper.extend({
  init: function (block, config) {
    this._super(block, $.extend({
      type:     'table-cols',
      label:    '列',
      property: 'attribute.data-table-cols'
    }, config));

    this.onTableSizeChanged = this.onTableSizeChanged.bind(this);
    block.tableSizeChanged.add(this.onTableSizeChanged);
  },
  onTableSizeChanged: function () {
    this.readFromBlock();
  },
  destroy: function () {
    if (this.block.tableSizeChanged) {
      this.block.tableSizeChanged.remove(this.onTableSizeChanged);
    }

    this._super();
  }
});

SL('editor.components.toolbars.options').TableRows        = SL.editor.components.toolbars.options.Stepper.extend({
  init: function (block, config) {
    this._super(block, $.extend({
      type:     'table-rows',
      label:    '行',
      property: 'attribute.data-table-rows'
    }, config));

    this.onTableSizeChanged = this.onTableSizeChanged.bind(this);
    block.tableSizeChanged.add(this.onTableSizeChanged)
  },
  onTableSizeChanged: function () {
    this.readFromBlock();
  },
  destroy: function () {
    if (this.block.tableSizeChanged) {
      this.block.tableSizeChanged.remove(this.onTableSizeChanged);
    }

    this._super();
  }
});

SL('editor.components.toolbars.options').TableHasHeader   = SL.editor.components.toolbars.options.Checkbox.extend({
  init: function (block, config) {
    this._super(block, $.extend({
      type:     'table-has-header',
      label:    '头',
      property: 'attribute.data-table-has-header',
      tooltip:  'Turn the first row into a header.'
    }, config));
  }
});

SL('editor.components.toolbars.options').TablePadding     = SL.editor.components.toolbars.options.Stepper.extend({
  init: function (block, config) {
    this._super(block, $.extend({
      type:     'table-padding',
      label:    '单元格填充',
      property: 'attribute.data-table-padding'
    }, config));
  }
});

SL('editor.components.toolbars.options').TableBorderWidth = SL.editor.components.toolbars.options.Stepper.extend({
  init: function (block, config) {
    this._super(block, $.extend({
      type:     'table-border-width',
      label:    '边框宽度',
      property: 'attribute.data-table-border-width'
    }, config));
  }
});

SL('editor.components.toolbars.options').TableBorderColor = SL.editor.components.toolbars.options.Color.extend({
  init: function (block, config) {
    this._super(block, $.extend({
      type:     'table-border-color',
      label:    '边框颜色',
      property: 'attribute.data-table-border-color',
      alpha:    true
    }, config));
  },
  getTriggerColor: function () {
    return this.block.getTableBorderColor();
  }
});


SL('editor.components.toolbars.util').Panel        = Class.extend({
  /**
   * Constructor SL.editor.components.toolbars.options.Padding Instance
   *
   * @function
   * @param {Object} options
   */
  init: function (options) {
    this.options = $.extend({
      width:     'auto',
      height:    'auto',
      maxHeight: 'none',
      keydown:   false,
      offsetX:   0,
      offsetY:   0
    }, options);

    this.render();
    this.bind();

    SL.editor.components.toolbars.util.Panel.INSTANCES.push(this);
  },

  /**
   * @function
   */
  render: function () {
    this.$domElement = $('<div class="toolbar-panel">');
    this.$contentElement = $('<div class="toolbar-panel-content">')
      .appendTo(this.$domElement);
    this.$arrowElement = $('<div class="toolbar-panel-arrow">')
      .appendTo(this.$domElement);

    this.$contentElement.css({
      width:     this.options.width,
      height:    this.options.height,
      maxHeight: this.options.maxHeight
    });
    this.$domElement.attr(
      'data-anchor-alignment',
      this.options.anchorAlignment);

    if (typeof this.options.type === "string") {
      this.$domElement.attr('data-panel-type', this.options.type);
    }

    if (typeof this.options.height === "number") {
      this.$domElement.css('overflow', 'auto');
    }
  },

  /**
   * @function
   */
  bind: function () {
    this.shown  = new signals.Signal();
    this.hidden = new signals.Signal();

    this.isVisible       = this.isVisible.bind(this);
    this.onDocumentClick = this.onDocumentClick.bind(this);
  },

  /**
   * @function
   */
  show: function () {
    SL.editor.components.toolbars.util.Panel.INSTANCES.forEach(function (instance) {
      if (instance !== this && instance.isVisible()) {
        instance.hide();
      }
    });

    this.$domElement.appendTo(SL.view.toolbars.$domElement);
    this.layout();
    this.shown.dispatch();

    if (typeof this.options.keydown === "function") {
      SL.keyboard.keyDown(this.options.keydown);
    }

    $(document).on('click', this.onDocumentClick);
  },

  /**
   * @function
   */
  hide: function () {
    this.$domElement.detach();
    this.hidden.dispatch();
    SL.keyboard.release(this.options.keydown);
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
   */
  layout: function () {
    if (this.options.anchor && this.options.width === 'auto') {
      this.$domElement.width(this.options.anchor.outerWidth());
    }

    if (this.options.anchor) {
      var wHeight   = window.innerHeight,
        domHeight   = this.$domElement.outerHeight(),
        offset      = this.options.anchor.offset(),
        outerWidth  = this.options.anchor.outerWidth(),
        outerHeight = this.options.anchor.outerHeight(),
        minTop      = 6,
        top         = offset.top + this.options.offsetY,
        left        = offset.left - this.$domElement.parent().offset().left;

      left += this.options.offsetX + outerWidth;
      top = Math.max(top, minTop);
      top = Math.min(top, wHeight - domHeight - minTop);

      this.$domElement.css({left: left, top: top});
      this.$arrowElement.css({top: offset.top - top + outerHeight / 2});
    }
  },

  /**
   * @function
   * @returns {*|jQuery}
   */
  getContentElement: function () {
    return this.$contentElement;
  },

  /**
   * @function
   * @param {Event} evt
   */
  onDocumentClick: function (evt) {
    var $target = $(evt.target);

    if ($target.closest(this.options.anchor).length === 0 &&
      $target.closest(this.$domElement).length === 0) {
      this.hide();
    }
  },

  /**
   * @function
   */
  destroy: function () {
    $(document).off('click', this.onDocumentClick);

    var instanceLen =
      SL.editor.components.toolbars.util.Panel.INSTANCES.length;

    for (var e = 0; e < instanceLen; e += 1) {
      if (SL.editor.components.toolbars.util.Panel.INSTANCES[e] === this) {
        SL.editor.components.toolbars.util.Panel.INSTANCES.splice(e, 1);
      }
    }

    SL.keyboard.release(this.options.keydown);
    this.shown.dispose();
    this.hidden.dispose();
    this.$domElement.remove();
  }
});

//点击旁边添加标注
SL('editor.components.toolbars.options').Section   =  SL.editor.components.toolbars.options.Value.extend({

  init: function (block, config) {
    this._super(block, $.extend({
      type: 'section',
      alpha: false
    }, config));
  },

  render: function () {
    this._super();
    this.$domElement.addClass('toolbar-sectionEdit');
  },

  bind: function () {
    this._super();
    this.$domElement.on('vclick', this.onTriggerClicked.bind(this));
  },

  //添加编辑页面
  onTriggerClicked: function () {
    var id = this.block.getSectionId();
    var annotated= this.block.getAnnotated();
    console.log(annotated);
    SL.popup.open(SL.editor.components.sectionLibrary.addAnnotated,
      {
        'id': id,
        'annotated': annotated
      });
  },

});

//切片库编辑
SL('editor.components.toolbars.options').SectionToEdit   = SL.editor.components.toolbars.options.Section.extend({
  init: function (block, config) {
    this._super(block, $.extend({
      type:     'section-edit',
      label:    '添加标注',
      property: 'style.section-edit'
    }, config));
  }
});

SL.editor.components.toolbars.util.Panel.INSTANCES = [];


/*!
 * project name: SlideStudio
 * name:         api.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/18
 */

'use strict';

SL('editor.controllers').API = {
  /**
   * Fork Deck Or Clone Deck
   *
   * @function
   */
  forkDeck: function () {
    SL.helpers.PageLoader.show({message: 'Duplicating...'});

    $.ajax({
      type:   'POST',
      url:     SL.config.AJAX_FORK_DECK(SLConfig.deck.id),
      context: this
    }).done(function (data) {
      if (data && data.deck && typeof data.deck.slug === "string") {
        window.location =
          SL.routes.DECK_EDIT(
            SL.current_user.get('username'),
            data.deck.slug);
      } else {
        SL.helpers.PageLoader.hide();
        SL.notify(SL.locale.get('Generic_Error'), 'negative');
      }
    }).fail(function () {
      SL.helpers.PageLoader.hide();
      SL.notify(SL.locale.get('Generic_Error'), 'negative');
    });
  },

  /**
   * Delete Deck
   *
   * @function
   */
  deleteDeck: function () {
    SL.prompt({
      title: SL.locale.get('API.title'),
      type:  'select',
      data: [{
        html: '<h3>' + SL.locale.get('Cancel') + '</h3>'
      }, {
        html: '<h3>' + SL.locale.get('API.delete') + '</h3>',
        selected: true,
        className: 'negative',
        callback: (function () {
          SL.helpers.PageLoader.show({message: 'Deleting...'});

          $.ajax({
            type: 'DELETE',
            url:   SL.config.AJAX_UPDATE_DECK(SLConfig.deck.id),
            data: {},
            context: this
          }).done(function () {
            window.location = SL.current_user.getProfileURL();
          }).fail(function () {
            SL.notify(SL.locale.get('Generic_Error'), 'negative');
            SL.helpers.PageLoader.hide();
          });
        }).bind(this)
      }]
    });
  }
};


/*!
 * project name: SlideStudio
 * name:         blocks.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/18
 */

'use strict';

SL('editor.controllers').Blocks = {
  /**
   * Constructor SL.editor.controllers.Blocks Instance
   *
   * @function
   * @param {Editor|Object|*} editor -The Editor Instance
   */
  init: function (editor) {
    this.editor          = editor;
    this.clipboard       = [];
    this.clipboardAction = null;
    this.focusChanged    = new window.signals.Signal();

    this.bind();
  },

  /**
   * Bind Event
   *
   * @function
   */
  bind: function () {
    this.onDocumentMouseDown    = this.onDocumentMouseDown.bind(this);
    this.onDocumentMouseMove    = this.onDocumentMouseMove.bind(this);
    this.onDocumentMouseUp      = this.onDocumentMouseUp.bind(this);
    this.onDocumentKeyDown      = this.onDocumentKeyDown.bind(this);
    this.onTextEditingTouchMove = this.onTextEditingTouchMove.bind(this);
    this.onTextEditingTouchEnd  = this.onTextEditingTouchEnd.bind(this);

    $(document).on('vmousedown', this.onDocumentMouseDown);
    $(document).on('keydown', this.onDocumentKeyDown);
  },

  /**
   * Sync
   *
   * @function
   * @param {HTMLElement} slide -The Current Slide Element
   */
  sync: function (slide) {
    slide = slide || window.Reveal.getCurrentSlide();

    $(slide).find('.sl-block').each((function (index, item) {
      item = $(item);

      if (!item.data('block-instance')) {
        this.add({
          type:    item.attr('data-block-type'),
          element: item
        });
      }
    }).bind(this));
  },

  /**
   * Add
   *
   * @function
   * @param {Object|*} block
   * @returns {*} blockInstance
   */
  add: function (block) {
    if (typeof block.slide === "undefined") {
      block.slide = window.Reveal.getCurrentSlide();
    }

    if (typeof block.silent === "undefined") {
      block.silent = false;
    }

    if (typeof block.center === "undefined") {
      block.center = true;
    }

    var blockModel = SL.config.BLOCKS.getByProperties({type: block.type});

    if (blockModel) {
      var blockInstance = null;

      if (block.element) {
        blockInstance = new SL.editor.blocks[blockModel.factory]({
          element: block.element
        });
        block.element.data('block-instance', blockInstance);

        if (block.element.parent().length === 0) {
          blockInstance.appendTo(block.slide);
        }
      } else {
        blockInstance =
          new SL.editor.blocks[blockModel.factory](block.blockOptions);
        blockInstance.appendTo(block.slide);
        blockInstance.setDefaults();

        if (block.afterInit && typeof block.afterInit === "function") {
          block.afterInit(blockInstance);
        }

        if (block.width) {
          blockInstance.resize({width: block.width});
        }

        if (block.height) {
          blockInstance.resize({height: block.height});
        }

        this.place(blockInstance, {
          skipIntro: block.silent,
          center:    block.center
        });

        if (typeof block.x === "number" || typeof block.y === "number") {
          blockInstance.move(block.x, block.y);
        }

        if (!block.silent) {
          SL.editor.controllers.Blocks.focus(blockInstance);
        }
      }

      if (blockInstance.hasID() === false) {
        blockInstance.setID(this.generateID(blockInstance));
      }

      blockInstance.removed.add(function () {
        if (blockInstance.isFocused()) {
          SL.editor.controllers.Blocks.blur();
        }
      });

      return blockInstance;
    }
  },

  /**
   * Generate Block Id
   *
   * @function
   * @param {Object} block -Block Data
   * @returns {String|*} Id String
   */
  generateID: function (block) {
    this.uniqueBlockCount =
      this.uniqueBlockCount ? this.uniqueBlockCount + 1 : 1;

    return window.CryptoJS.MD5(
      'block-' + block.type + '-' + this.uniqueBlockCount + '-' +
      Date.now() + '-' + Math.round(1e9 * Math.random())).toString();
  },

  /**
   * Place
   *
   * @function
   * @param {Object} instance -The Type Block Instance
   * @param {Object} options  -The Place Options
   */
  place: function (instance, options) {
    options = options || {};

    SL.editor.controllers.Blocks.moveBlocksToDepth(
      [instance], Number.MAX_VALUE);

    if (options.center) {
      instance.moveToCenter();
    }

    if (!options.skipIntro) {
      instance.runIntro();
    }
  },

  /**
   * Focus Block
   *
   * @function
   * @param {HTMLElement} element -Block Element
   * @param {boolean}     isFocus -Is Focus Block Element
   * @param {boolean}     toggle  -Focus Toggle
   */
  focus: function (element, isFocus, toggle) {
    if (typeof isFocus === "undefined") {
      isFocus = false;
    }

    if (typeof toggle === "undefined") {
      toggle = true;
    }

    if (element && element.nodeName) {
      element = $(element).data('block-instance');
    }

    if (element && typeof element.focus === "function") {
      if (isFocus) {
        if (element.isFocused()) {
          if (element.isFocused() && toggle) {
            element.blur();
          }
        } else {
          element.focus();
        }
      } else {
        if (!element.isFocused()) {
          this.blur();
          element.focus();
        }
      }

      this.afterFocusChange();
    }
  },

  /**
   * Blur Block
   *
   * @function
   * @param {HTMLElement} blocks -Block Element
   */
  blur: function (blocks) {
    (blocks || this.getFocusedBlocks()).forEach(function (block) {
      block.blur();
    });

    this.afterFocusChange();
  },

  /**
   * Blur Blocks By Slide
   *
   * @function
   * @param {HTMLElement} slideElement -Slide Element
   */
  blurBlocksBySlide: function (slideElement) {
    $(slideElement).find('.sl-block').each(function () {
      var block = $(this).data('block-instance');

      if (block) {
        block.blur();
      }
    });

    this.afterFocusChange();
  },

  /**
   * After Focus Change
   *
   * @function
   */
  afterFocusChange: function () {
    var focusedBlocks = this.getFocusedBlocks();

    if (focusedBlocks.length === 1 &&
      focusedBlocks[0].getToolbarOptions().length) {
      if (this.editor.toolbars.get().block !== focusedBlocks[0]) {
        this.editor.toolbars.push(
          new SL.editor.components.toolbars.Edit(focusedBlocks[0]));
      }
    } else if (focusedBlocks.length > 1) {
      if (!(this.editor.toolbars.get() instanceof
        SL.editor.components.toolbars.EditMultiple)) {
        this.editor.toolbars.clear();
        this.editor.toolbars.push(
          new SL.editor.components.toolbars.EditMultiple());
      }
    } else {
      this.editor.toolbars.clear();
    }

    this.focusChanged.dispatch();
  },

  /**
   * After Block Text Input
   *
   * @function
   */
  afterBlockTextInput: function () {
    $('.reveal-viewport').scrollLeft(0).scrollTop(0);
  },

  /**
   * Copy Block
   *
   * @function
   */
  copy: function () {
    this.clipboardAction = 'copy';

    var focusedBlocks    = this.getFocusedBlocks();

    if (focusedBlocks.length) {
      this.clipboard.length = 0;

      focusedBlocks.forEach((function (block) {
        this.clipboard.push({
          block:        block,
          measurements: block.measure()
        });
      }).bind(this));

      SL.analytics.trackEditor('Copy block');
    }
  },

  /**
   * Cut Block
   *
   * @function
   */
  cut: function () {
    this.clipboardAction = 'cut';

    var focusedBlocks    = this.getFocusedBlocks();

    if (focusedBlocks.length) {
      this.clipboard.length = 0;

      focusedBlocks.forEach((function (block) {
        this.clipboard.push({
          block:        block,
          measurements: block.measure()
        });

        block.blur();
        block.detach();
      }).bind(this));

      SL.editor.controllers.Blocks.blur();
      SL.analytics.trackEditor('Cut block');
    }
  },

  /**
   * Paste Block
   *
   * @function
   */
  paste: function () {
    var offset     = 15,
      currentSlide = $(window.Reveal.getCurrentSlide());

    if (this.clipboard.length && currentSlide.length) {
      this.blur();

      var blockAry = [];

      this.clipboard.forEach((function (item) {
        var element    = item.block.$domElement.clone(),
          measurements = JSON.parse(JSON.stringify(item.measurements));

        element.removeAttr('data-block-id');
        element.find('>.editing-ui').remove();

        if (this.clipboardAction === 'copy') {
          for (; this.getBlocksByMeasurements(measurements).length;) {
            measurements.x += offset;
            measurements.y += offset;

            if (measurements.right) {
              measurements.right += offset;
            }

            if (measurements.bottom) {
              measurements.bottom += offset;
            }
          }
        }

        var block = this.add({
          type:    element.attr('data-block-type'),
          element: element
        });

        block.move(measurements.x, measurements.y);
        this.focus(block, true);

        blockAry.push(block);
      }).bind(this));

      blockAry.sort(function (blockA, blockB) {
        return blockA.get('style.z-index') - blockB.get('style.z-index');
      });

      blockAry.forEach(function (item) {
        SL.editor.controllers.Blocks.moveBlocksToDepth([item], Number.MAX_VALUE);
      });

      window.Reveal.sync();

      SL.analytics.trackEditor('Paste block');
    }
  },

  /**
   * Get Clipboard Data
   *
   * @function
   * @returns {string|string|Array}
   */
  getClipboard: function () {
    return this.clipboard;
  },

  /**
   * Align Blocks
   *
   * @function
   * @param {Array}  blocks    -Block Array
   * @param {String} alignment -Alignment Type
   */
  align: function (blocks, alignment) {
    var bounds = this.getCombinedBounds(blocks);

    if (alignment === 'left') {
      blocks.forEach(function (block) {
        block.move(bounds.x);
      });
    } else if (alignment === 'horizontal-center') {
      blocks.forEach(function (block) {
        block.move(bounds.x + (bounds.width - block.measure().width) / 2);
      });
    } else if (alignment === 'right') {
      blocks.forEach(function (block) {
        block.move(bounds.right - block.measure().width);
      });
    } else if (alignment === 'top') {
      blocks.forEach(function (block) {
        block.move(null, bounds.y);
      });
    } else if (alignment === 'vertical-center') {
      blocks.forEach(function (block) {
        block.move(null, bounds.y + (bounds.height - block.measure().height) / 2);
      });
    } else if (alignment === 'bottom') {
      blocks.forEach(function (block) {
        block.move(null, bounds.bottom - block.measure().height);
      });
    }
  },

  /**
   * Discover Block Pairs
   *
   * @function
   */
  discoverBlockPairs: function () {
    var currentBlocks = this.getCurrentBlocks(),
      adjacentBlocks  =
        SL.editor.controllers.Blocks.getAdjacentBlocks(currentBlocks);

    currentBlocks.forEach(function (block) {
      block.unpair();
    });

    adjacentBlocks.forEach(function (block) {
      if (!(block.relationship !== 'bottom' ||
        block.blockA.type !== 'text' &&
        block.blockA.type !== 'html')) {
        block.blockA.pair(block.blockB, 'bottom');
      }
    });
  },

  /**
   * Move Blocks To Depth
   *
   * @function
   * @param {Array}  blocks -Block Array
   * @param {Number} index  -Block Array z-Index
   */
  moveBlocksToDepth: function (blocks, index) {
    var currentBlocks = this.getCurrentBlocks();

    currentBlocks.sort(function (blockA, blockB) {
      return blockA.get('style.z-index') - blockB.get('style.z-index');
    });

    var defaultIndex = 10;

    index = Math.min(
      Math.max(index, 0),
      currentBlocks.length + defaultIndex);

    currentBlocks.forEach(function (block) {
      if (defaultIndex === index) {
        defaultIndex += 1;
      }

      block.set('style.z-index', defaultIndex);
      defaultIndex += 1;
    });

    blocks.forEach(function (block) {
      block.set('style.z-index', index);
    });
  },

  /**
   * Get Combined Bounds
   *
   * @function
   * @param {Array} blocks -Block Array
   * @returns {{x: Number, y: Number, right: number, bottom: number}}
   */
  getCombinedBounds: function (blocks) {
    var bounds = {
      x:      Number.MAX_VALUE,
      y:      Number.MAX_VALUE,
      right:  0,
      bottom: 0
    };

    blocks.forEach((function (block) {
      var measure = block.measure();

      bounds.x      = Math.min(bounds.x, measure.x);
      bounds.y      = Math.min(bounds.y, measure.y);
      bounds.right  = Math.max(bounds.right, measure.right);
      bounds.bottom = Math.max(bounds.bottom, measure.bottom);
    }).bind(this));

    bounds.width  = bounds.right - bounds.x;
    bounds.height = bounds.bottom - bounds.y;

    return bounds;
  },

  /**
   * Get Focused Blocks
   *
   * @function
   * @returns {Array} Blocks
   */
  getFocusedBlocks: function () {
    var ary = [];

    this.getCurrentBlocks().forEach(function (block) {
      if (block.isFocused()) {
        ary.push(block);
      }
    });

    return ary;
  },

  /**
   * Get Current Blocks
   *
   * @function
   * @returns {Array} Blocks
   */
  getCurrentBlocks: function () {
    SL.editor.controllers.Blocks.sync();

    var ary = [];

    $(window.Reveal.getCurrentSlide()).find('.sl-block').each(function () {
      var blockInstance = $(this).data('block-instance');

      if (blockInstance) {
        ary.push(blockInstance);
      }
    });

    return ary;
  },

  /**
   * Get Blocks By Measurements
   *
   * @function
   * @param {Array|*} measurements -The Special Measurements
   * @returns {Array} Blocks
   */
  getBlocksByMeasurements: function (measurements) {
    var ary = [];

    this.getCurrentBlocks().forEach(function (block) {
      var measure = block.measure(), have = true;

      for (var measurement in measurements) {
        if (measurements.hasOwnProperty(measurement) &&
          measurements[measurement] !== measure[measurement]) {
          have = false;
        }
      }

      if (have) {
        ary.push(block);
      }
    });

    return ary;
  },

  /**
   * Get Adjacent Block To Current Block
   *
   * @function
   * @param {Block} blocks -To Adjacent Block
   * @returns {Array} The Adjacent Block Array
   */
  getAdjacentBlocks: function (blocks) {
    blocks = blocks || this.getCurrentBlocks();

    var ary = [];

    blocks.forEach(function (block) {
      ary = ary.concat(
        SL.editor.controllers.Blocks.getAdjacentBlocksTo(block, blocks));
    });

    return ary;
  },

  /**
   * Get Adjacent Block To blockA
   *
   * @function
   * @param {Block} blockA -The Block A
   * @param {Block} blockB -The Block B
   * @returns {Array} The Adjacent Block Array
   */
  getAdjacentBlocksTo: function (blockA, blockB) {
    var distance = 4, ary = [],
      blocks     = blockB || this.getCurrentBlocks(),
      measure    = blockA.measure();


    blocks.forEach(function (block) {
      var currentMeasure = block.measure(),
        intersection = SL.util.trig.intersection(measure, currentMeasure);

      if (intersection.height > 0) {
        if (Math.abs(measure.x - currentMeasure.right) < distance) {
          ary.push({
            relationship: 'left',
            blockA: blockA,
            blockB: block
          });
        } else if (Math.abs(measure.right - currentMeasure.x) < distance) {
          ary.push({
            relationship: 'right',
            blockA: blockA,
            blockB: block
          });
        }
      }

      if (intersection.width > 0) {
        if (Math.abs(measure.y - currentMeasure.bottom) < distance) {
          ary.push({
            relationship: 'top',
            blockA: blockA,
            blockB: block
          });
        } else if (Math.abs(measure.bottom - currentMeasure.y) < distance) {
          ary.push({
            relationship: 'bottom',
            blockA: blockA,
            blockB: block
          });
        }
      }
    });

    return ary;
  },

  /**
   * @function
   * @param {Event} evt
   */
  onDocumentMouseDown: function (evt) {
    if (SL.view.isEditing() === false) {
      return true;
    }

    var isReveal       = $(evt.target).closest('.reveal').length > 0,
      isRevealControls = $(evt.target).closest('.reveal .controls').length > 0,
      isBlock          = $(evt.target).closest('.sl-block').length > 0,
      isToolbar        = $(evt.target).closest('.toolbars').length > 0;

    if (!isReveal || isBlock || isRevealControls) {
      if (isToolbar) {
        this.getFocusedBlocks().forEach(function (block) {
          if (typeof block.disableEditing === "function") {
            block.disableEditing();
          }
        });
      }
    } else {
      if (SL.editor.controllers.Capabilities.isTouchEditor()) {
        var blocks = this.getFocusedBlocks().some(function (block) {
          return block.isEditingText();
        });

        if (blocks) {
          this.touchMouseStart = {
            x: evt.clientX,
            y: evt.clientY
          };

          this.touchMouseMoved = false;

          $(document).on('vmousemove', this.onTextEditingTouchMove);
          $(document).on('vmouseup', this.onTextEditingTouchEnd);

          return true;
        }
      }

      if (!evt.shiftKey) {
        SL.editor.controllers.Blocks.blur();
        $(document.activeElement).blur();
      }

      evt.preventDefault();

      SL.editor.controllers.Selection.start(evt.clientX, evt.clientY);

      $(document).on('vmousemove', this.onDocumentMouseMove);
      $(document).on('vmouseup', this.onDocumentMouseUp);
    }
  },

  /**
   * @function
   * @param {Event} evt
   */
  onDocumentMouseMove: function (evt) {
    SL.editor.controllers.Selection.sync(evt.clientX, evt.clientY);
  },

  /**
   * @function
   */
  onDocumentMouseUp: function () {
    SL.editor.controllers.Selection.stop();

    $(document).off('vmousemove', this.onDocumentMouseMove);
    $(document).off('vmouseup', this.onDocumentMouseUp);
  },

  /**
   * @function
   * @param {Event} evt
   */
  onTextEditingTouchMove: function (evt) {
    if (evt.clientX !== this.touchMouseStart.x ||
      evt.clientY !== this.touchMouseStart.y) {
      this.touchMouseMoved = true;
    }
  },

  /**
   * @function
   */
  onTextEditingTouchEnd: function () {
    if (!this.touchMouseMoved) {
      SL.editor.controllers.Blocks.blur();
    }

    $(document).off('vmousemove', this.onTextEditingTouchMove);
    $(document).off('vmouseup', this.onTextEditingTouchEnd);
  },

  /**
   * @function
   * @param {Event} evt
   */
  onDocumentKeyDown: function (evt) {
    if (SL.view.isEditing() === false) {
      return true;
    }

    if (SL.util.isTypingEvent(evt)) {
      return true;
    }

    var isExpanded = this.editor.sidebar.isExpanded();

    if (!isExpanded) {
      var ctrlKey = evt.metaKey || evt.ctrlKey,
        focusedBlocks = this.getFocusedBlocks();

      if (evt.keyCode === 37 ||
        evt.keyCode === 38 ||
        evt.keyCode === 39 ||
        evt.keyCode === 40 && focusedBlocks.length) {
        var offset = evt.shiftKey ? 10 : 1,
          x = 0, y = 0;

        switch (evt.keyCode) {
          case 37:
            x = -offset;
            break;
          case 39:
            x = offset;
            break;
          case 38:
            y = -offset;
            break;
          case 40:
            y = offset;
            break;
        }

        focusedBlocks.forEach(function (block) {
          block.move(x, y, {
            isOffset: true
          });
        });
      } else {
        if (evt.keyCode !== 8 && evt.keyCode !== 46 || !focusedBlocks.length) {
          if (ctrlKey && !evt.shiftKey && evt.keyCode === 65) {
            this.getCurrentBlocks().forEach(function (block) {
              SL.editor.controllers.Blocks.focus(block, true, false);
            });

            evt.preventDefault();
          } else if (ctrlKey && !evt.shiftKey && evt.keyCode === 67 && focusedBlocks.length) {
            SL.editor.controllers.Blocks.copy();
            evt.preventDefault();
          } else if (ctrlKey && !evt.shiftKey && evt.keyCode === 88 && focusedBlocks.length) {
            SL.editor.controllers.Blocks.cut();
            evt.preventDefault();
          } else if (ctrlKey && !evt.shiftKey && evt.keyCode === 86 &&
            SL.editor.controllers.Blocks.getClipboard().length > 0) {
            SL.editor.controllers.Blocks.paste();
            evt.preventDefault();
          }
        } else {
          focusedBlocks.forEach(function (block) {
            block.destroy();
          });

          evt.preventDefault();
        }
      }
    }
  }
};


/*!
 * project name: SlideStudio
 * name:         capabilities.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/19
 */

'use strict';

SL('editor.controllers').Capabilities = {
  TOUCH_EDITOR:       false,
  TOUCH_EDITOR_SMALL: false,

  /**
   * Constructor SL.editor.controllers.Capabilities Instance
   *
   * @function
   * @returns {boolean}
   */
  init: function () {
    if (SL.util.device.supportedByEditor()) {
      SL.editor.controllers.Capabilities.TOUCH_EDITOR       =
        /ipad|iphone|ipod|android/gi.test(navigator.userAgent) &&
        !!('ontouchstart' in window);
      SL.editor.controllers.Capabilities.TOUCH_EDITOR_SMALL =
        SL.editor.controllers.Capabilities.TOUCH_EDITOR &&
        window.innerWidth > 0 && window.innerWidth < 1000;

      if (SL.editor.controllers.Capabilities.TOUCH_EDITOR) {
        $('html').addClass('touch-editor');

        if (SL.editor.controllers.Capabilities.TOUCH_EDITOR_SMALL) {
          $('html').addClass('touch-editor-small');
        }
      }

      return true;
    } else {
      $(document.body).append([
        '<div class="not-supported">',
          '<h2>Not Supported</h2>',
          '<p>',
            'The Slides editor doesn\'t currently support the ',
            'browser you\'re using. Please consider changing to a ',
            'different browser, such as ' +
            '<a href="https://www.google.com/chrome">Google Chrome</a> or ',
            '<a href="https://www.mozilla.org/firefox/">Firefox</a>.',
          '</p>',
          '<a class="skip" href="#">Continue anyway</a>',
        '</div>'].join(''));

      $('.not-supported .skip').on('click', function () {
        $('.not-supported').remove();
      });

      return false;
    }
  },

  /**
   * Is Supported Touch
   *
   * @function
   * @returns {boolean} True is supported, False or not.
   */
  isTouchEditor: function () {
    return SL.editor.controllers.Capabilities.TOUCH_EDITOR;
  },

  /**
   * Is Touch Editor Small
   *
   * @function
   * @returns {boolean} True is supported, False or not.
   */
  isTouchEditorSmall: function () {
    return SL.editor.controllers.Capabilities.TOUCH_EDITOR_SMALL;
  }
};


/*!
 * project name: SlideStudio
 * name:         contrast.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/19
 */

'use strict';

SL('editor.controllers').Contrast = {
  /**
   * Constructor SL.editor.controllers.Contrast Instance
   *
   * @function
   */
  init: function () {
    this.contrast = -1;

    this.sync     = this.sync.bind(this);

    this.bind();
    this.sync();
  },

  /**
   * Bind Event
   *
   * @function
   */
  bind: function () {
    this.changed = new signals.Signal();

    window.Reveal.addEventListener('ready', this.sync);
    window.Reveal.addEventListener('slidechanged', (function () {
      setTimeout(this.sync, 1);
    }).bind(this));
  },

  /**
   * Sync Contrast
   *
   * @function
   */
  sync: function () {
    var bkContrast = SL.util.deck.getBackgroundContrast();

    if (bkContrast !== this.contrast) {
      this.contrast = bkContrast;
      $('html').attr('data-deck-contrast', Math.round(10 * bkContrast));
      this.changed.dispatch(this.contrast);
    }
  },

  /**
   * Get Background Contrast
   *
   * @function
   * @returns {colorFunctions.contrast|Function|f.contrast|number|*|bkContrast}
   */
  get: function () {
    if (this.contrast === -1) {
      this.sync();
    }

    return this.contrast;
  }
};


/*!
 * project name: SlideStudio
 * name:         grid.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/19
 */

'use strict';

SL('editor.controllers').Grid = {
  /**
   * Constructor SL.editor.controllers.Grid Instance
   *
   * @function
   */
  init: function () {
    this.color = 'rgba(150, 150, 150, 0.2)';

    this.paint = this.paint.bind(this);

    this.bind();
    this.render();

    setTimeout(function () {
      SL.editor.controllers.Grid.show();
    }, 1);
  },

  /**
   * Render Grid Container Element
   *
   * @function
   */
  render: function () {
    this.$domElement    = $('<div class="sl-block-grid">');
    this.$canvasElement =
      $('<canvas class="sl-block-grid-inner">')
        .appendTo(this.$domElement);
  },

  /**
   * Bind Event
   *
   * @function
   */
  bind: function () {
    SL.editor.controllers.Contrast.changed.add(this.onContrastChange.bind(this));
  },

  /**
   * Show Grid
   *
   * @function
   */
  show: function () {
    if (this.isEnabled()) {
      this.$domElement.appendTo($('.projector .reveal'));
      this.setContrast(SL.editor.controllers.Contrast.get());

      this.paint();

      $(window).on('resize', this.paint);
    }
  },

  /**
   * Hide Grid
   *
   * @function
   */
  hide: function () {
    this.$domElement.remove();
    $(window).off('resize', this.paint);
  },

  /**
   * Paint Grid
   *
   * @function
   */
  paint: function () {
    var bounds = SL.util.getRevealSlideBounds(
        SL.editor.controllers.Markup.getCurrentSlide(), true),
      width       = bounds.width, height = bounds.height,
      rows        = this.getRows(), cols = this.getCols(),
      colDistance = Math.round(width / cols),
      rowDistance = Math.round(height / rows),
      size = SL.view.getSlideSize({
        scaled: true
      }),
      left = (window.innerWidth - SL.view.getSidebarWidth() - size.width) / 2,
      top  = (window.innerHeight - size.height) / 2;

    this.$canvasElement.css({
      left: Math.max(left, 10),
      top:  Math.max(top, 10)
    });

    this.$canvasElement.attr({
      width:  width,
      height: height
    });

    var context = this.$canvasElement.get(0).getContext('2d');
    context.clearRect(0, 0, width, height);

    for (var d = 1; d < cols; d += 1) {
      context.fillStyle = this.color;
      context.fillRect(Math.floor(d * colDistance), 0, 1, height);
    }

    for (var u = 1; u < rows; u +=1) {
      context.fillStyle = this.color;
      context.fillRect(0, Math.floor(u * rowDistance), width, 1);
    }
  },

  /**
   * Refresh Grid
   *
   * @function
   */
  refresh: function () {
    if (this.isEnabled()) {
      this.show();
    } else {
      this.hide();
    }
  },

  /**
   * Get Grid Rows
   *
   * @function
   * @returns {number}
   */
  getRows: function () {
    return 10;
  },

  /**
   * Get Grid Cols
   *
   * @function
   * @returns {number}
   */
  getCols: function () {
    return 12;
  },

  /**
   * Set Contrast Grid
   *
   * @function
   * @param {Number} contrast -The Grid of Contrast
   */
  setContrast: function (contrast) {
    this.color = 0.15 > contrast ?
      'rgba(255, 255, 255, 0.10)' : 0.45 > contrast ?
      'rgba(255, 255, 255, 0.15)' : 0.85 > contrast ?
      'rgba(255, 255, 255, 0.20)' :
      'rgba(150, 150, 150, 0.20)';
  },

  /**
   * Is Enabled Grid
   *
   * @function
   * @returns {*|boolean}
   */
  isEnabled: function () {
    if (SL.editor.controllers.Capabilities.isTouchEditor()) {
      return false;
    } else {
      return SL.current_user.settings.get('editor_grid');
    }
  },

  /**
   * @function
   * @param {Number} contrast -The Grid of Contrast
   */
  onContrastChange: function (contrast) {
    this.setContrast(contrast);

    if (this.isEnabled()) {
      this.paint();
    }
  }
};


/*!
 * project name: SlideStudio
 * name:         guides.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/19
 */

'use strict';

SL('editor.controllers').Guides = {
  /**
   * Constructor SL.editor.controllers.Guides Instance
   *
   * @function
   */
  init: function () {
    this.guides = {h: [], v: []};
    this.render();
  },

  /**
   * @function
   */
  render: function () {
    this.$domElement = $('<div class="sl-block-guides editing-ui">');
  },

  /**
   * @function
   * @param {Array}  targetBlocks
   * @param {Object} options
   */
  start: function (targetBlocks, options) {
    if (this.isEnabled() !== false) {
      this.slideBounds   = SL.view.getSlideSize();
      this.slideBounds.x = 0;
      this.slideBounds.y = 0;

      this.$domElement.appendTo(SL.editor.controllers.Markup.getCurrentSlide());
      this.allBlocks    = SL.editor.controllers.Blocks.getCurrentBlocks();
      this.targetBlocks = targetBlocks;
      this.gridLines    = [];

      if (SL.editor.controllers.Grid.isEnabled()) {
        var cols = SL.editor.controllers.Grid.getCols(),
          rows   = SL.editor.controllers.Grid.getRows(),
          colNum = this.slideBounds.width / cols,
          rowNum = this.slideBounds.height / rows;

        for (var s = 1; s < cols; s += 1) {
          this.gridLines.push(this.getCenterEdge({
            x:      s * colNum,
            y:      0,
            width:  0,
            height: this.slideBounds.height
          }, 'grid-col-' + s, 'horizontal'));
        }

        for (var a = 1; a < rows; a += 1) {
          this.gridLines.push(this.getCenterEdge({
            x:      0,
            y:      a * rowNum,
            width:  this.slideBounds.width,
            height: 0
          }, 'grid-row-' + a, 'vertical'));
        }
      }

      var bounds = SL.editor.controllers.Blocks.getCombinedBounds(this.targetBlocks);

      this.targetBlocks.forEach(function (block) {
        var measure = block.measure();

        block._guideOffsetX = measure.x - bounds.x;
        block._guideOffsetY = measure.y - bounds.y;
      });

      this.options = $.extend({
        snap:      true,
        action:    'move',
        threshold: 6
      }, options);
    }
  },

  /**
   * @function
   */
  stop: function () {
    this.$domElement.remove();
    this.clearGuideElements();
    this.targetBlocks = [];
  },

  /**
   * @function
   */
  sync: function () {
    if (this.isEnabled() !== false && this.targetBlocks.length) {
      if (this.options.snap) {
        this.findGuides(this.options.threshold);
        this.enforceGuides();
        this.findGuides(1);
        this.renderGuides();
      } else {
        this.findGuides(this.options.threshold);
        this.renderGuides();
      }
    }
  },

  /**
   * @function
   * @param {Number} defaultDistance
   */
  findGuides: function (defaultDistance) {
    this.guides.h.length = 0;
    this.guides.v.length = 0;

    var combinedBounds =
        SL.editor.controllers.Blocks.getCombinedBounds(this.targetBlocks),
      edges =
        this.getEdges(
          combinedBounds,
          'target-bounds',
          'resize' === this.options.action);

    this.allBlocks.forEach((function (block) {
      if (this.targetBlocks.indexOf(block) === -1) {
        this.compareEdges(
          edges,
          this.getEdges(block.measure(), block.getID()),
          defaultDistance);
      }
    }).bind(this));

    this.gridLines.forEach((function (bounds) {
      this.compareEdges(edges, bounds, defaultDistance);
    }).bind(this));

    this.compareEdges(
      edges,
      this.getEdges(this.slideBounds, 'slide-bounds'),
      defaultDistance);

    this.guides.h.sort(function (h1, h2) {
      return h1.distance - h2.distance;
    });

    this.guides.v.sort(function (v1, v2) {
      return v1.distance - v2.distance;
    });
  },

  /**
   * @function
   * @param {{h: *[], v: *[]}} edgesA
   * @param {{h: *[], v: *[]}} edgesB
   * @param {Number} defaultDistance
   */
  compareEdges: function (edgesA, edgesB, defaultDistance) {
    var distance = 0;

    edgesA.h.forEach((function (edgeAh) {
      edgesB.h.forEach((function (edgeBh) {
        distance = Math.abs(edgeAh.x - edgeBh.x);

        if (defaultDistance > distance) {
          this.guides.h.push({
            distance:    distance,
            targetEdge:  edgeAh,
            compareEdge: edgeBh
          });
        }
      }).bind(this));
    }).bind(this));

    edgesA.v.forEach((function (edgeAv) {
      edgesB.v.forEach((function (edgeBv) {
        distance = Math.abs(edgeAv.y - edgeBv.y);

        if (defaultDistance > distance) {
          this.guides.v.push({
            distance:    distance,
            targetEdge:  edgeAv,
            compareEdge: edgeBv
          });
        }
      }).bind(this));
    }).bind(this));
  },

  /**
   * @function
   */
  enforceGuides: function () {
    if (this.options.action === 'resize') {
      var targetBlock = this.targetBlocks[0];

      if (targetBlock.transform.isResizingCentered()) {
        return;
      }

      var filterObj = {n: 0, e: 0, s: 0, w: 0, hc: 0, vc: 0};

      this.guides.h = this.guides.h.filter(function (guideH) {
        filterObj[guideH.targetEdge.direction] += 1;
        return filterObj[guideH.targetEdge.direction] === 1;
      });

      this.guides.v = this.guides.v.filter(function (guideV) {
        filterObj[guideV.targetEdge.direction] += 1;
        return filterObj[guideV.targetEdge.direction] === 1;
      });

      this.guides.h.forEach((function (guideH) {
        if (/w|e/.test(this.options.direction) &&
          this.options.direction.indexOf(guideH.targetEdge.direction) > -1) {
          if (/w/.test(guideH.targetEdge.direction)) {
            targetBlock.resize({
              left:      guideH.compareEdge.x,
              direction: guideH.targetEdge.direction
            });
          } else if (/e/.test(guideH.targetEdge.direction)) {
            targetBlock.resize({
              right:     guideH.compareEdge.x,
              direction: guideH.targetEdge.direction});
          }
        }
      }).bind(this));

      this.guides.v.forEach((function (guideV) {
        if (/n|s/.test(this.options.direction) &&
          this.options.direction.indexOf(guideV.targetEdge.direction) > -1) {
          if (/n/.test(guideV.targetEdge.direction)) {
            targetBlock.resize({
              top:       guideV.compareEdge.y,
              direction: guideV.targetEdge.direction
            });
          } else if (/s/.test(guideV.targetEdge.direction)) {
            targetBlock.resize({
              bottom:    guideV.compareEdge.y,
              direction: guideV.targetEdge.direction
            });
          }
        }
      }).bind(this));
    } else {
      this.guides.h.splice(1);
      this.guides.v.splice(1);

      this.guides.h.forEach((function (guideH) {
        this.targetBlocks.forEach((function (block) {
          block.move(guideH.compareEdge.x +
            guideH.targetEdge.offset + block._guideOffsetX);
        }).bind(this));
      }).bind(this));

      this.guides.v.forEach((function (guideV) {
        this.targetBlocks.forEach((function (block) {
          block.move(
            null,
            guideV.compareEdge.y +
              guideV.targetEdge.offset + block._guideOffsetY);
        }).bind(this));
      }).bind(this));
    }
  },

  /**
   * @function
   */
  renderGuides: function () {
    var ary = [],
      bounds =
        SL.editor.controllers.Blocks.getCombinedBounds(this.targetBlocks);

    this.guides.h.forEach((function (guideH) {
      ary.push(this.renderGuide(guideH, bounds));
    }).bind(this));

    this.guides.v.forEach((function (guideV) {
      ary.push(this.renderGuide(guideV, bounds));
    }).bind(this));

    this.clearGuideElements(ary);
  },

  /**
   * @function
   * @param {Object} guide
   * @param {Object} bounds
   * @returns {*}
   */
  renderGuide: function (guide, bounds) {
    var direction = 0,
      targetEdge  = guide.targetEdge,
      compareEdge = guide.compareEdge,
      $guide      = $('[data-guide-id="' + compareEdge.id + '"]');

    if ($guide.length === 0) {
      $guide = $('<div data-guide-id="' + compareEdge.id + '">').appendTo(this.$domElement);

      setTimeout(function () {
        $guide.addClass('show');
      }, 1);
    }

    var margin = {
      top: Math.min(compareEdge.bounds.y, bounds.y),
      right: Math.max(
        compareEdge.bounds.x + compareEdge.bounds.width,
        bounds.x + bounds.width),
      bottom: Math.max(
        compareEdge.bounds.y + compareEdge.bounds.height,
        bounds.y + bounds.height),
      left: Math.min(compareEdge.bounds.x, bounds.x)
    };

    if (typeof compareEdge.y === "number") {
      direction = targetEdge.direction === 's' ? -1 : 0;

      $guide.addClass('guide-h');
      $guide.css({
        top:   Math.floor(compareEdge.y + direction),
        left:  margin.left,
        width: margin.right - margin.left
      });
    } else {
      direction = targetEdge.direction === 'e' ? -1 : 0;

      $guide.addClass('guide-v');
      $guide.css({
        left:   Math.floor(compareEdge.x + direction),
        top:    margin.top,
        height: margin.bottom - margin.top
      });
    }

    return compareEdge.id;
  },

  /**
   * @function
   * @param {Object}        bounds
   * @param {String|Number} id
   * @param {boolean}       isResize
   * @returns {{h: *[], v: *[]}}
   */
  getEdges: function (bounds, id, isResize) {
    var guides = {
      h: [{
        id:        id + '-h1',
        bounds:    bounds, x: bounds.x,
        offset:    0,
        direction: 'w'
      }, {
        id:        id + '-h2',
        bounds:    bounds,
        x:         bounds.x + bounds.width / 2,
        offset:    -bounds.width / 2,
        direction: 'hc'
      }, {
        id:        id + '-h3',
        bounds:    bounds,
        x:         bounds.x + bounds.width,
        offset:    -bounds.width,
        direction: 'e'
      }],
      v: [{
        id:        id + '-v1',
        bounds:    bounds,
        y:         bounds.y,
        offset:    0,
        direction: 'n'
      }, {
        id:        id + '-v2',
        bounds:    bounds,
        y:         bounds.y + bounds.height / 2,
        offset:    -bounds.height / 2,
        direction: 'vc'
      }, {
        id: id + '-v3',
        bounds:    bounds,
        y:         bounds.y + bounds.height,
        offset:    -bounds.height,
        direction: 's'
      }]
    };

    if (isResize === true) {
      guides.h.splice(1, 1);
      guides.v.splice(1, 1);
    }

    return guides;
  },

  /**
   * @function
   * @param {Object}          bounds
   * @param {String|Number|*} direction
   * @param {String}          isVertical
   * @returns {{h: Array, v: Array}}
   */
  getCenterEdge: function (bounds, direction, vertical) {
    var edge = {h: [], v: []};

    if (vertical === 'vertical') {
      edge.v.push({
        id:        direction + '-v2',
        bounds:    bounds,
        y:         bounds.y + bounds.height / 2,
        offset:    -bounds.height / 2,
        direction: direction
      });
    } else {
      edge.h.push({
        id:        direction + '-h2',
        bounds:    bounds,
        x:         bounds.x + bounds.width / 2,
        offset:    -bounds.width / 2,
        direction: direction
      });
    }

    return edge;
  },

  /**
   * @function
   * @param {Array} guides
   */
  clearGuideElements: function (guides) {
    var $guides = this.$domElement.find('.guide-v, .guide-h');

    if (guides && guides.length) {
      $guides = $guides.filter(function (index, element) {
        return guides.indexOf(element.getAttribute('data-guide-id')) === -1;
      });
    }

    $guides.remove();
  },

  /**
   * @function
   * @returns {boolean}
   */
  isEnabled: function () {
    if (SL.editor.controllers.Capabilities.isTouchEditor()) {
      return true;
    } else {
      SL.current_user.settings.get('editor_snap');
    }
  }
};


/*!
 * project name: SlideStudio
 * name:         history.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/19
 */

'use strict';

SL('editor.controllers').History = {
  MAX_SIZE:      100,
  MAX_FREQUENCY: 1500,
  MODE_RESTING:  1,
  MODE_UNDOING:  2,
  MODE_REDOING:  3,

  /**
   * Constructor SL.editor.controllers.History Instance
   *
   * @function
   */
  init: function () {
    this.past   = [];
    this.future = [];

    this.mode   = SL.editor.controllers.History.MODE_RESTING;

    this.lastPushTime = -1;

    this.changed = new signals.Signal();
    this.undid   = new signals.Signal();
    this.redid   = new signals.Signal();
  },

  /**
   * @function
   * @param {Object} data
   * @param {Object} options
   */
  push: function (data, options) {
    options = options || {};

    var now = Date.now();

    if (now - this.lastPushTime >
      SL.editor.controllers.History.MAX_FREQUENCY || options.skipTimeLimit) {
      this.lastPushTime = Date.now();

      var historyItem = {
        data:    data,
        indices: Reveal.getIndices()
      };

      historyItem.focusedBlocks =
        SL.editor.controllers.Blocks
          .getFocusedBlocks()
          .map(function (block) {
            return block.getID();
          });

      var mode = SL.editor.controllers.Mode.get();

      if (mode) {
        historyItem.mode = mode.id;
      }

      var past = this.past[this.past.length - 1],
        future = this.future[this.future.length - 1];

      if (!(past && historyItem.data === past.data ||
        future && historyItem.data === future.data)) {
        if (this.future.length) {
          this.past.push(this.future.pop());
        }

        this.future.length = 0;
        this.past.push(historyItem);
        this.mode = SL.editor.controllers.History.MODE_RESTING;
        this.changed.dispatch();
      }

      for (; this.past.length > SL.editor.controllers.History.MAX_SIZE;) {
        this.past.shift();
      }
    }
  },

  /**
   * @function
   * @param {Object} options
   * @returns {*|T}
   */
  undo: function (options) {
    options = options || {};

    var historyItem = this.past.pop();

    if (historyItem &&
      this.mode !== SL.editor.controllers.History.MODE_UNDOING) {
      this.future.push(historyItem);
      historyItem = this.past.pop();
    }

    if (historyItem) {
      this.mode = SL.editor.controllers.History.MODE_UNDOING;
      this.future.push(historyItem);
      this.lastPushTime = Date.now();

      if (options.ignoreMode) {
        historyItem = JSON.parse(JSON.stringify(historyItem));
        historyItem.mode = null;
      }

      this.undid.dispatch(historyItem);
      this.changed.dispatch();
    }

    return historyItem;
  },

  /**
   * @function
   * @param {Object} options
   * @returns {*|T}
   */
  redo: function (options) {
    options = options || {};

    var historyItem = this.future.pop();

    if (historyItem &&
      this.mode !== SL.editor.controllers.History.MODE_REDOING) {
      this.past.push(historyItem);
      historyItem = this.future.pop();
    }

    if (historyItem) {
      this.mode = SL.editor.controllers.History.MODE_REDOING;
      this.past.push(historyItem);
      this.lastPushTime = Date.now();

      if (options.ignoreMode) {
        historyItem = JSON.parse(JSON.stringify(historyItem));
        historyItem.mode = null;
      }

      this.redid.dispatch(historyItem);
      this.changed.dispatch();
    }

    return historyItem;
  },

  /**
   * @function
   * @returns {boolean|*}
   */
  canUndo: function () {
    return this.past.length > 1 ||
      this.past.length === 1 &&
      this.deckHasChanged();
  },

  /**
   * @function
   * @returns {boolean}
   */
  canRedo: function () {
    return this.future.length > 0;
  },

  /**
   * @function
   * @returns {boolean}
   */
  deckHasChanged: function () {
    return this.past[this.past.length - 1].data !==
      SL.editor.controllers.Serialize.getDeckAsString();
  }
};


/*!
 * project name: SlideStudio
 * name:         markup.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/19
 */

'use strict';

SL('editor.controllers').Markup = {
  /**
   * Constructor SL.editor.controllers.History Instance
   *
   * @function
   * @param {Editor|Object|*} editor -The Editor Instance
   */
  init: function (editor) {
    this.editor = editor;
  },

  /**
   * @function
   * @returns {*|jQuery|HTMLElement}
   */
  getCurrentSlide: function () {
    return $(Reveal.getCurrentSlide());
  },

  /**
   * @function
   * @returns {*|jQuery|HTMLElement}
   */
  getCurrentHorizontalSlide: function () {
    var slide = $(Reveal.getCurrentSlide());

    if (slide.parent('section.stack').length) {
      slide = slide.parent('section.stack');
    }

    return slide;
  },

  /**
   * @function
   * @returns {*|jQuery|HTMLElement}
   */
  getFocusedSlide: function () {
    return $('.reveal .slides .present[contenteditable]:focus');
  },

  /**
   * @function
   * @param slideStr
   * @returns {*}
   */
  addHorizontalSlide: function (slideStr) {
    slideStr = slideStr || '<section></section>';

    var classStr = SLConfig.deck.rtl ? 'past' : 'future',
      $slide = $(slideStr);

    if ($slide.is('section')) {
      SL.editor.controllers.Blocks.blur();
      $slide.addClass(classStr);
      $slide.insertAfter(this.getCurrentHorizontalSlide());

      Reveal.slide();
      Reveal.sync();

      SL.editor.controllers.Blocks.sync();

      if (SLConfig.deck.rtl) {
        setTimeout(Reveal.navigateLeft, 1);
      } else {
        setTimeout(Reveal.navigateRight, 1);
      }

      SL.data.templates.layoutTemplate($slide);
      this.afterSlideAddedOrRemovedChanged();

      return $slide;
    } else {
      return void 0;
    }
  },

  /**
   * @function
   * @param slideStr
   * @returns {*}
   */
  addVerticalSlide: function (slideStr) {
    slideStr = slideStr || '<section></section>';

    var $horSlide = this.getCurrentHorizontalSlide();

    if (!$horSlide.hasClass('stack')) {
      $horSlide = $horSlide.wrap('<section class="present">').parent();
      $horSlide.addClass('stack');
    }

    var $slide = $(slideStr);

    if ($slide.is('section')) {
      var indices = Reveal.getIndices();

      SL.editor.controllers.Blocks.blur();
      $slide.addClass('future');

      var $present = $horSlide.find('section.present');

      if ($present.length) {
        $slide.insertAfter($present);
      } else {
        $horSlide.append($slide);
      }

      Reveal.slide(indices.h, indices.v);

      SL.editor.controllers.Blocks.sync();

      this.editor.navigateToSlide($slide.get(0));
      this.editor.navigateToSlide($slide.get(0));

      Reveal.sync();

      SL.data.templates.layoutTemplate($slide);
      this.afterSlideAddedOrRemovedChanged();

      return $slide;
    } else {
      return void 0;
    }
  },

  /**
   * @function
   * @param {String} slideStr
   * @returns {*}
   */
  replaceCurrentSlide: function (slideStr) {
    slideStr = slideStr || '<section></section>';

    var $slide = $(slideStr),
      currentSlide = SL.editor.controllers.Markup.getCurrentSlide();

    if ($slide.is('section')) {
      $slide.addClass('present');
      currentSlide.replaceWith($slide);

      Reveal.slide();
      Reveal.sync();

      SL.editor.controllers.Blocks.sync();
      SL.data.templates.layoutTemplate($slide);

      return $slide;
    } else {
      return void 0;
    }
  },

  /**
   * @function
   * @param {*|jQuery|HTMLElement} $prev
   * @param {*|jQuery|HTMLElement} $current
   */
  mergeHorizontalSlides: function ($prev, $current) {
    if ($prev.length && $current.length) {
      var stack = $prev.wrap('<section class="present">').parent();
      stack.addClass('stack');
      stack.append($current);

      SL.editor.controllers.Blocks.sync();
      Reveal.sync();
    }
  },

  /**
   * @function
   */
  unwrapEmptyStacks: function () {
    $('.reveal .slides section.stack').each(function () {
      var $stack = $(this);

      if ($stack.find('>section').length === 1) {
        $stack.find('>section').first().unwrap();
      }
    });
  },

  /**
   * @function
   */
  removeCurrentSlide: function () {
    var indices = Reveal.getIndices();

    if ($('.reveal .slides .present .present').remove().length > 0 &&
      $('.reveal .slides .present>section').length === 1) {
      $('.reveal .slides .present>section:eq(0)').unwrap();
    } else if ($('.reveal .slides>section').length > 1) {
      $('.reveal .slides>.present').remove();
    }

    Reveal.slide(indices.h, indices.v);
    Reveal.sync();

    this.afterSlideAddedOrRemovedChanged();

    SL.analytics.trackEditor('Remove slide');
  },

  /**
   * @function
   * @param {String} htmlStr
   */
  writeHTMLToCurrentSlide: function (htmlStr) {
    Reveal.getCurrentSlide().innerHTML = htmlStr;

    SL.util.html.trimCode(Reveal.getCurrentSlide());
    SL.editor.controllers.Blocks.sync();
    SL.editor.controllers.Blocks.discoverBlockPairs();
  },

  /**
   * @function
   * @param {*|jQuery|HTMLElement} $str
   * @param {boolean} isEmpty
   */
  importSlides: function ($str, isEmpty) {
    $str = $($str);

    if ($str && $str.length) {
      var $slides = $('.reveal .slides');

      if (isEmpty) {
        $slides.empty();
      }

      $str.each((function (index, item) {
        this.importSlide(item, $slides);
      }).bind(this));

      Reveal.sync();
      Reveal.slide(0, 0);

      SL.editor.controllers.Blocks.sync();
      this.afterSlideAddedOrRemovedChanged();
    }
  },

  /**
   * @function
   * @param {*|jQuery|HTMLElement} $item
   * @param {*|jQuery|HTMLElement} $slides
   */
  importSlide: function ($item, $slides) {
    $item   = $($item);
    $slides = $($slides);
    $slides.append($item);
    $item.css('display', 'block');

    if ($item.find('>section').length) {
      $item.find('>section').each((function (index, item) {
        this.importSlide(item, $item);
      }).bind(this));
    } else {
      var $ary = [], positions = [];

      $item.children().each(function () {
        var $element = $(this);

        if ($element.is('.sl-block')) {
          $ary.push($element.remove().prop('outerHTML'));
        } else if ($element.css('position') === 'absolute') {
          var position = $element.position(),
            obj = {
              width: $element.outerWidth(),
              x:     position.left,
              y:     position.top
            };

          $element.css({
            position: 'relative',
            top:    '',
            right:  '',
            bottom: '',
            left:   ''
          });

          obj.html = $element.prop('outerHTML');
          positions.push(obj);
          $element.remove();
        }
      });

      positions.push({
        html:  $item.html(),
        width: SL.config.SLIDE_WIDTH
      });
      $item.empty();

      positions.forEach(function (pos) {
        if (pos.html.trim().length > 0) {
          SL.editor.controllers.Blocks.add({
            type:   'text',
            slide:  $item,
            silent: true,
            width:  pos.width,
            x:      pos.x,
            y:      pos.y,
            afterInit: function (block) {
              block.setCustomHTML(pos.html);
            }
          });
        }
      });

      $ary.forEach(function (item) {
        $item.append(item);
      });
    }

    $item.css('display', '');
    SL.util.deck.generateIdentifiers($item);

    var id = $item.attr('data-id'), notes = $item.find('aside.notes');

    if (notes.length) {
      var noteStr =
        notes.text().trim().substr(0, SL.config.SPEAKER_NOTES_MAXLENGTH);

      if (noteStr && noteStr.length > 1) {
        SLConfig.deck.notes[id] = noteStr;
        notes.remove();
      }
    }
  },

  /**
   * @function
   */
  afterSlideAddedOrRemovedChanged: function () {
    SL.view.slideOptions.syncRemoveSlide();
  }
};


/*!
 * project name: SlideStudio
 * name:         media.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/19
 */

'use strict';

SL('editor.controllers').Media = {
  /**
   * Constructor SL.editor.controllers.Media Instance
   *
   * @function
   */
  init: function () {
    this.setupDragAndDrop();
    this.setupPasteFromClipboard();
  },

  /**
   * @function
   */
  canDragAndDrop: function () {
    return !SL.popup.isOpen(SL.editor.components.medialibrary.MediaLibrary);
  },

  /**
   * @function
   */
  setupDragAndDrop: function () {
    var $instructions = $([
      '<div class="drag-and-drop-instructions">',
        '<div class="inner">', 'Drop to insert media', '</div>',
      '</div>'].join(''));

    SL.draganddrop.subscribe({
      onDragOver: (function () {
        $instructions.appendTo(document.body);
      }).bind(this),
      onDragOut: (function () {
        $instructions.remove();
      }).bind(this),
      onDrop: (function (evt) {
        $instructions.remove();

        var media =
          new SL.models.Media(
            null,
            null,
            evt.originalEvent.dataTransfer.files[0]);
        media.upload();

        var block = SL.editor.controllers.Blocks.add({
          type: 'image',
          slide: $(SL.editor.controllers.Markup.getCurrentSlide())
        });

        block.setImageModel(media);
      }).bind(this)
    });
  },

  /**
   * @function
   */
  setupPasteFromClipboard: function () {
    $(document).on('paste', function () {
      setTimeout(function () {
        $('img[src^=webkit-fake-url]').remove();
      }, 1);
    });
    $(document).pasteImageReader((function (options) {
      if (options && options.file && options.dataURL) {
        this.uploadImageBlob(options.file, 'pasted-from-clipboard.png');
      }
    }).bind(this));
  },

  /**
   * @function
   */
  uploadImageBlob: function (file, fileName) {
    if (file && fileName && file.type.match(/image.*/)) {
      var media = new SL.models.Media(null, null, file, fileName);
      media.upload();

      var block = SL.editor.controllers.Blocks.add({
        type: 'image',
        slide: $(SL.editor.controllers.Markup.getCurrentSlide())
      });

      block.setImageModel(media);
    }
  }
};


/*!
 * project name: SlideStudio
 * name:         migration.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/19
 */

'use strict';

SL('editor.controllers').Migration = {
  /**
   * Constructor SL.editor.controllers.Migration Instance
   *
   * @function
   */
  init: function () {
    this.migrateEditorSettings();
  },

  /**
   * Migrate Editor Setting
   *
   * @function
   */
  migrateEditorSettings: function () {
    var snap  = 'editorSnap', grid = 'editorGrid',
      gridVal = SL.settings.getValue(grid),
      snapVal = SL.settings.getValue(snap);

    if (typeof gridVal === "boolean" || typeof snapVal === "boolean") {
      SL.settings.removeValue([grid, snap]);

      SL.current_user.settings.set('editor_grid', gridVal);
      SL.current_user.settings.set('editor_snap', snapVal);
      SL.current_user.settings.save(['editor_grid', 'editor_snap']);
    }
  }
};


/*!
 * project name: SlideStudio
 * name:         mode.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/19
 */

'use strict';

SL('editor.controllers').Mode = {
  /**
   * Constructor SL.editor.controllers.Mode Instance
   *
   * @function
   * @param {Editor|Object|*}   editor -The Editor Instance
   * @param {Object|Instance|*} modes
   */
  init: function (editor, modes) {
    this.editor = editor;
    this.modes  = modes;

    this.modeActivated   = new signals.Signal();
    this.modeDeactivated = new signals.Signal();

    for (var mode in this.modes) {
      this.modes[mode].activated.add(this.onModeActivated.bind(this, mode));
      this.modes[mode].deactivated.add(this.onModeDeactivated.bind(this, mode));
    }
  },

  /**
   * @function
   */
  clear: function () {
    var mode = this.get($('html').attr('data-mode'));

    if (mode && mode.isActive()) {
      mode.deactivate();
    }
  },

  /**
   * @function
   * @param {String|*} type
   */
  change: function (type) {
    this.clear();

    var mode = this.get(type);

    if (mode) {
      mode.activate();
    }
  },

  /**
   * @function
   * @param {String|*} type
   */
  toggle: function (type) {
    var mode = this.get(type);

    if (mode && mode.isActive()) {
      mode.deactivate();
    } else if (mode) {
      var typeStr = $('html').attr('data-mode');

      if (typeStr && typeStr !== type) {
        var currentMode = this.get(typeStr);

        if (currentMode && currentMode.isActive()) {
          currentMode.deactivate();
        }
      }

      mode.activate();
    }
  },

  /**
   * @function
   * @param {Object|Instance|*} modes
   */
  onModeActivated: function (mode) {
    this.modeActivated.dispatch(mode);
  },

  /**
   * @function
   * @param {Object|Instance|*} modes
   */
  onModeDeactivated: function (mode) {
    this.modeDeactivated.dispatch(mode);
  },

  /**
   * @function
   * @param {String|*} type
   * @returns {*}
   */
  get: function (type) {
    if (!type) {
      type = $('html').attr('data-mode');
    }

    if (this.modes[type]) {
      return this.modes[type];
    } else {
      return null;
    }
  }
};


/*!
 * project name: SlideStudio
 * name:         onboarding.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/19
 */

'use strict';

SL('editor.controllers').Onboarding = {
  step0: {
    forwards: function () {
      var msg = '<h3>迎接新的幻灯片</h3><p>单击 <b>下一步</b>快速访问幻灯片编辑器</p>';

      this.tutorial.message(msg, {
        anchor:     $('.sl-tutorial-controls-inner'),
        alignment: 't',
        maxWidth:   450
      });
    }
  },
  step1: {
    forwards: function () {
      var str = '';

      if (SL.current_user.isPro() || SL.current_user.isEnterprise()) {
        str = '<h3>顶级选项</h3><p>设置 <b>演示标题，隐私，主题和安排幻灯片</b>从这里。您还可以管理导入和导出</p>';
      } else {
        str = '<h3>顶级选项</h3><p>设置 <b>演讲标题，隐私，主题，并从这里安排幻灯片</b></p>';
      }

      this.tutorial.cutout($('.sidebar'));
      this.tutorial.message(str, {
        anchor:     $('.sidebar'),
        alignment: 'r'
      });
    },
    backwards: function () {
      this.tutorial.clearCutout();
      this.tutorial.clearMessage();
    }
  },
  step2: {
    forwards: function () {
      var str = '<h3>添加新内容</h3><p>点击其中任何一个<b>内容块</b>将其添加到当前幻灯片</p>';

      this.tutorial.cutout($('.toolbars'));
      this.tutorial.message(str, {
        anchor:     $('.toolbars'),
        alignment: 'r'
      });
    },
    backwards: function () {
      this.tutorial.clearCutout();
      this.tutorial.clearMessage();
    }
  },
  step3: {
    forwards: function () {
      var str = '<h3>例如文本块</h3><p>单击以进行对焦或双击以编辑文本</p>';

      this.tutorial.cutout($('.sl-block'));
      this.tutorial.message(str, {
        anchor:     $('.sl-block'),
        alignment: 'b'
      });
    },
    backwards: function () {
      this.tutorial.clearCutout();
      this.tutorial.clearMessage();
    }
  },
  step4: {
    forwards: function () {
      var str = '<h3>块选项</h3><p>所选块的选项. 对于文本块来说，包括 <b>对齐方式, 颜色, 大小</b> 等.</p>';

      this.tutorial.cutout($('.toolbars'));
      this.tutorial.message(str, {
        anchor:     $('.toolbars'),
        alignment: 'r'
      });

      SL.editor.controllers.Blocks
        .focus(SL.editor.controllers.Blocks.getCurrentBlocks()[0]);
    },
    backwards: function () {
      this.tutorial.clearCutout();
      this.tutorial.clearMessage();
      SL.editor.controllers.Blocks.blur();
    }
  },
  step5: {
    forwards: function () {
      var str = '<h3>幻灯片选项</h3><p>当前幻灯片的选项, 例如 <b>背景颜色/图像和删除等</b>.</p>';

      SL.editor.controllers.Blocks.blur();

      this.tutorial.cutout($('.slide-options'), {padding: 4});
      this.tutorial.message(str, {
        anchor:     $('.slide-options'),
        alignment: 'l'
      });
    },
    backwards: function () {
      this.tutorial.clearCutout();
      this.tutorial.clearMessage();
    }
  },
  step6: {
    forwards: function () {
      var str = '<h3>添加幻灯片</h3><p>点击加号按钮添加新幻灯片.</p>';;

      this.tutorial.cutout($('.add-horizontal-slide'), {padding: 4});
      this.tutorial.message(str, {
        anchor:     $('.add-horizontal-slide'),
        alignment: 'l'
      });
    },
    backwards: function () {
      this.tutorial.clearCutout();
      this.tutorial.clearMessage();
    }
  },
  step7: {
    forwards: function () {
      var str = '<h3>选择一个模板</h3><p>添加新幻灯片时，您可以从模板中进行选择。您可以在“用户”选项卡中保存自己的模板</p>';

      $('.add-horizontal-slide').click();
      $('.sl-templates').css('background', 'transparent');

      this.tutorial.cutout($('.sl-templates-inner'));
      this.tutorial.message(str, {
        anchor:     $('.sl-templates-inner'),
        alignment: 'l'
      });
    },
    backwards: function () {
      var $templates = $('.sl-templates');

      if ($templates.length) {
        $templates.css('background', '');
        $templates.data('instance').hide();
      }

      this.tutorial.clearCutout();
      this.tutorial.clearMessage();
    }
  },

  /**
   * Constructor SL.editor.controllers.Onboarding Instance
   *
   * @function
   * @param {Editor|Object|*} editor -The Editor Instance
   */
  init: function (editor) {
    this.onTutorialSkipped  = this.onTutorialSkipped.bind(this);
    this.onTutorialFinished = this.onTutorialFinished.bind(this);

    if (SL.util.getQuery().tutorial) {
      this.start();
    } else {
      if (!(SL.current_user.get('editor_tutorial_completed') ||
      !editor.isNewDeck() ||
      SL.util.device.IS_PHONE ||
      SL.util.device.IS_TABLET)) {
        this.start();
      }
    }
  },

  /**
   * @function
   */
  start: function () {
    this.tutorial = new SL.components.Tutorial({
      context: this,
      steps: [
        this.step0,
        this.step1,
        this.step2,
        this.step3,
        this.step4,
        this.step5,
        this.step6,
        this.step7
      ]
    });

    this.tutorial.skipped.add(this.onTutorialSkipped.bind(this));
    this.tutorial.finished.add(this.onTutorialFinished.bind(this));

    this.tutorial.step(0);
  },

  /**
   * @function
   */
  stop: function () {
    $.ajax({
      url:     SL.config.AJAX_UPDATE_USER,
      type:    'PUT',
      context: this,
      data: {
        user: {
          editor_tutorial_completed: true
        }
      }
    });

    this.tutorial.destroy();
  },

  /**
   * @function
   */
  onTutorialSkipped: function () {
    this.stop();
    SL.analytics.trackEditor('Onboarding skipped');
  },

  /**
   * @function
   */
  onTutorialFinished: function () {
    var $templates = $('.sl-templates');

    if ($templates.length && $templates.data('instance')) {
      $templates.css('background', '');
      $templates.data('instance').hide();
    }

    this.stop();

    SL.analytics.trackEditor('Onboarding finished');
  }
};


/*!
 * project name: SlideStudio
 * name:         selection.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/19
 */

'use strict';

SL('editor.controllers').Selection = {
  /**
   * Constructor SL.editor.controllers.Selection Instance
   *
   * @function
   */
  init: function () {
    this.$domElement = $('<div class="sl-block-selection editing-ui">');
  },

  /**
   * @function
   * @param {Number} clientX
   * @param {Number} clientY
   */
  start: function (clientX, clientY) {
    var $projector = $('.projector');

    this.$domElement.appendTo($projector);

    var offset = $projector.offset();

    this.offsetX = -offset.left;
    this.offsetY = -offset.top;
    this.startX  = clientX + this.offsetX;
    this.startY  = clientY + this.offsetY;

    var currentSlide = SL.editor.controllers.Markup.getCurrentSlide();

    this.slideBounds = SL.util.getRevealSlideBounds(currentSlide, true);
    this.sync(clientX, clientY);
  },

  /**
   * @function
   */
  stop: function () {
    this.$domElement.remove();
  },

  /**
   * @function
   * @param {Number} clientX
   * @param {Number} clientY
   */
  sync: function (clientX, clientY) {
    var bounds = {
      width:  clientX + this.offsetX - this.startX,
      height: clientY + this.offsetY - this.startY
    };

    bounds.x = this.startX + Math.min(bounds.width, 0);
    bounds.y = this.startY + Math.min(bounds.height, 0);
    bounds.width  = Math.abs(bounds.width);
    bounds.height = Math.abs(bounds.height);

    this.$domElement.css({
      left:   bounds.x,
      top:    bounds.y,
      width:  bounds.width,
      height: bounds.height
    });

    bounds.x      -= this.slideBounds.x;
    bounds.y      -= this.slideBounds.y;
    bounds.x      *= SL.util.getRevealCounterScale();
    bounds.y      *= SL.util.getRevealCounterScale();
    bounds.width  *= SL.util.getRevealCounterScale();
    bounds.height *= SL.util.getRevealCounterScale();

    SL.editor.controllers.Blocks.getCurrentBlocks()
      .forEach((function (block) {
        if (SL.util.trig.intersects(block.measure(), bounds)) {
          SL.editor.controllers.Blocks.focus(block, true, false);
        } else {
          SL.editor.controllers.Blocks.blur([block]);
        }
      }).bind(this));
  }
};


/*!
 * project name: SlideStudio
 * name:         serialize.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/19
 */

'use strict';

SL('editor.controllers').Serialize = {
  /**
   * @function
   * @param {Object} options
   * @returns {*|string}
   */
  getDeckAsString: function (options) {
    var slideStr =
        SL.util.html.muteSources($('.reveal .slides').html()),
      $div       = $('<div>').html(slideStr);

    $div.find('>.backgrounds').remove();
    $div.find('section').each((function (index, element) {
      this.formatSlideForSave(element, options);
    }).bind(this));

    var htmlStr = SL.util.html.unmuteSources($div.html());

    return SL.util.string.trim(htmlStr);
  },

  /**
   * @function
   * @param {*|jQuery|HTMLElement} element
   * @param {Object}               options
   * @returns {*|string}
   */
  getSlideAsString: function (element, options) {
    options = $.extend({
      inner: false
    }, options);
    element = $(element);

    if (element.find('section').length) {
      element = element.find('section').first();
    }

    var html = SL.util.html.muteSources(element.prop('outerHTML'));
    element  = $(html);

    this.formatSlideForSave(element, options);

    var str = element.prop(options.inner ? 'innerHTML' : 'outerHTML'),
      htmlStr = SL.util.html.unmuteSources(str);

    return htmlStr;
  },

  /**
   * @function
   * @param {Object} options
   * @returns {*|string}
   */
  getFirstSlideAsString: function (options) {
    return this.getSlideAsString(
      $('.reveal .slides section').first(), options);
  },

  /**
   * @function
   * @param {*|jQuery|HTMLElement} slideElement
   * @param {Object}               options
   * @returns {*|jQuery|HTMLElement}
   */
  formatSlideForSave: function (slideElement, options) {
    options = $.extend({
      exclude:                null,
      templatize:             false,
      removeSlideIds:         false,
      removeBlockIds:         false,
      removeTextPlaceholders: false,
      lazy: true
    }, options);

    slideElement = $(slideElement);

    if (options.templatize || options.removeSlideIds) {
      slideElement.removeAttr('data-id');
    }

    if (options.templatize || options.removeBlockIds) {
      slideElement.find('[data-block-id]').removeAttr('data-block-id');
    }

    if (options.removeTextPlaceholders) {
      slideElement.find('[data-placeholder-tag]')
        .removeAttr('data-placeholder-tag');
      slideElement.find('[data-placeholder-text]')
        .removeAttr('data-placeholder-text');
    }

    if (options.exclude) {
      slideElement.find(options.exclude).remove();
    }

    SL.util.html.removeAttributes(slideElement, function (word) {
      return /(style|contenteditable|hidden|aria-hidden|data\-index\-.|data\-previous\-indexv)/gi.test(word);
    });
    SL.util.html.trimCode(slideElement);

    slideElement.removeClass('past present future disabled overflowing');

    if (slideElement.attr('class') === '') {
      slideElement.get(0).removeAttribute('class');
    }

    slideElement.find('.fragment').removeClass('visible');

    if (options.lazy) {
      slideElement.find('iframe[' +
        SL.util.html.ATTR_SRC_SILENCED +
        '], img[' +
        SL.util.html.ATTR_SRC_SILENCED + ']').each(function () {
        this.setAttribute(
          'data-src',
          this.getAttribute(SL.util.html.ATTR_SRC_SILENCED));
        this.removeAttribute(SL.util.html.ATTR_SRC_SILENCED);
      });
    }

    slideElement.find('.navigate-up, .navigate-right, .navigate-down, .navigate-left, .navigate-next, .navigate-prev').removeClass('enabled');
    slideElement.find('.editing-ui').remove();

    slideElement.find('*:not(iframe)').contents().each(function () {
      if (this.nodeType === 8) {
        $(this).remove();
      }
    });

    slideElement.find('a[data-cke-saved-href]').each(function () {
      this.removeAttribute('data-cke-saved-href');
    });

    slideElement.find('.sl-block, .sl-block-content')
      .each(function (index, element) {
        element = $(element);

        SL.util.html.removeClasses(element, function (word) {
          return /(is\-focused|is\-editing|visible|is\-text\-overflowing|^cke_)/gi.test(word);
        });
        SL.util.html.removeAttributes(element, function (word) {
          return /(contenteditable|tabindex|spellcheck|role|title|aria\-.)/gi.test(word);
        });
      });

    return slideElement;
  }
};


/*!
 * project name: SlideStudio
 * name:         session.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/19
 */

'use strict';

SL('editor.controllers').Session = {
  /**
   * Constructor SL.editor.controllers.Session Instance
   *
   * @function
   */
  init: function () {
    this.hasLoggedOut  = false;
    this.loginInterval = setInterval(
      this.checkLogin.bind(this), SL.config.LOGIN_STATUS_INTERVAL);
  },

  /**
   * @function
   * @param {*} session
   */
  checkLogin: function (session) {
    if (SL.view.hasUnsavedChanges() &&
      !SL.popup.isOpen(SL.components.popup.SessionExpired) || session) {
      $.get(SL.config.AJAX_CHECK_STATUS).done((function (data) {
        if (data && data.user_signed_in) {
          this.onLoggedIn();
        } else {
          this.onLoggedOut();
        }
      }).bind(this));
    }
  },

  /**
   * @function
   */
  onLoggedIn: function () {
    if (this.hasLoggedOut) {
      this.hasLoggedOut = false;
      SL.popup.close(SL.components.popup.SessionExpired);
    }
  },

  /**
   * @function
   */
  onLoggedOut: function () {
    if (!(SL.editor.controllers.Mode.get('arrange').isActive() ||
      this.hasLoggedOut)) {
      this.hasLoggedOut = true;
      SL.popup.open(SL.components.popup.SessionExpired);
    }
  }
};


/*!
 * project name: SlideStudio
 * name:         stream.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/19
 */

'use strict';

SL('editor.controllers').Stream = {
  /**
   * @function
   */
  connect: function () {
    if (!this.stream) {
      this.stream = new SL.helpers.StreamEditor({
        deckID: SLConfig.deck.id
      });
      this.stream.connect();
    }
  },

  /**
   * @function
   * @returns {*}
   */
  get: function () {
    if (!this.stream) {
      this.connect();
    }

    return this.stream;
  }
};


/*!
 * project name: SlideStudio
 * name:         thumbnail.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/19
 */

'use strict';

SL('editor.controllers').Thumbnail = {
  /**
   * Constructor SL.editor.controllers.Thumbnail Instance
   *
   * @function
   */
  init: function () {
    this.invalidated = false;
  },

  /**
   * @function
   */
  generate: function () {
    $.ajax({
      type: 'POST',
      url:   SL.config.AJAX_THUMBNAIL_DECK(SLConfig.deck.id)
    });

    this.invalidated = false;
  },

  /**
   * @function
   */
  invalidate: function () {
    this.invalidated = true;
  },

  /**
   * @function
   * @returns {boolean}
   */
  isInvalidated: function () {
    return this.invalidated;
  }
};


/*!
 * project name: SlideStudio
 * name:         url.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/19
 */

'use strict';

SL('editor.controllers').URL = {
  /**
   * Constructor SL.editor.controllers.URL Instance
   *
   * @function
   */
  init: function () {
    setTimeout(this.read.bind(this), 1);
  },

  /**
   * @function
   */
  read: function () {
    var query = SL.util.getQuery();

    if (query.panel) {
      SL.view.sidebar.open(query.panel);
    }
  },

  /**
   * @function
   */
  write: function () {
    if (window.history &&
      typeof window.history.replaceState === "function") {
      window.history.replaceState(
        null,
        SLConfig.deck.title,
        SL.routes.DECK_EDIT(
          SLConfig.deck.user.username,
          SLConfig.deck.slug));
    }
  }
};


/*!
 * project name: SlideStudio
 * name:         base.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/18
 */

'use strict';

SL('editor.modes').Base = Class.extend({
  /**
   * @function
   * @param {Editor|Object|*} editor
   * @param {String|*} id
   */
  init: function (editor, id) {
    this.id     = id;
    this.editor = editor;
    this.active = false;

    this.activated   = new window.signals.Signal();
    this.deactivated = new window.signals.Signal();

    this.onSlideChanged = this.onSlideChanged.bind(this);

    this.render();
    this.bind();
  },

  /**
   * @function
   */
  bind: function () {},

  /**
   * @function
   */
  render: function () {},

  /**
   * @function
   */
  activate: function () {
    this.active = true;

    $('html').attr('data-mode', this.id)
      .addClass('hide-projector-overlays');

    if (this.deactivateOnSlideChange) {
      window.Reveal
        .addEventListener('slidechanged', this.onSlideChanged);
    }

    this.activated.dispatch();
  },

  /**
   * @function
   */
  deactivate: function () {
    this.active = false;

    $('html').removeAttr('data-mode')
      .removeClass('hide-projector-overlays');

    if (this.deactivateOnSlideChange) {
      window.Reveal
        .removeEventListener('slidechanged', this.onSlideChanged);
    }

    this.deactivated.dispatch();
  },

  /**
   * @function
   */
  toggle: function () {
    if (this.isActive()) {
      this.deactivate();
    } else {
      this.activate();
    }
  },

  /**
   * @function
   * @returns {*|boolean}
   */
  isActive: function () {
    return this.active;
  },

  /**
   * @function
   * @returns {*|String|Number}
   */
  getID: function () {
    return this.id;
  },

  /**
   * @function
   */
  onSlideChanged: function () {
    this.deactivate();
  }
});


/*!
 * project name: SlideStudio
 * name:         arrange.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/18
 */

'use strict';

SL('editor.modes').Arrange = SL.editor.modes.Base.extend({
  /**
   * Constructor SL.editor.modes.Arrange Instance
   *
   * @function
   * @param {Editor|Object|*} editor -The Editor Instance
   */
  init: function (editor) {
    this._super(editor, 'arrange');
  },

  /**
   * Bind Event
   *
   * @function
   */
  bind: function () {
    window.Reveal.addEventListener(
      'overviewshown',
      this.onRevealOverviewShown.bind(this));
    window.Reveal.addEventListener(
      'overviewhidden',
      this.onRevealOverviewHidden.bind(this));
  },

  /**
   * Activate
   *
   * @function
   * @param {boolean} enable
   */
  activate: function (enable) {
    this.active = true;

    if (!enable) {
      window.Reveal.toggleOverview(true);
    }

    this.editor.disableEditing();
    this.editor.sidebar.updateArrangeButton('arranging');

    var arrangeCtrlStr = [
      '<div class="arrange-controls editing-ui">',
        '<div class="arrange-control move-left i-arrow-left-alt1"></div>',
        '<div class="arrange-control move-right i-arrow-right-alt1"></div>',
        '<div class="arrange-control move-up i-arrow-up-alt1"></div>',
        '<div class="arrange-control move-down i-arrow-down-alt1"></div>',
        '<div class="arrange-control merge-left i-previous" data-tooltip-delay="500"></div>',
        '<div class="arrange-control merge-right i-next" data-tooltip-delay="500"></div>',
      '</div>'].join('');

    $('.reveal .slides section:not(.stack)')
      .append(arrangeCtrlStr).addClass('disabled');
    $('.reveal .slides section.stack')
      .each(function (index, item) {
      if ($(item).find('.present').length === 0) {
        $(item).find('section').first().addClass('present');
      }
    });
    $('.reveal .slides section .arrange-controls')
      .on('click', this.onControlsClicked.bind(this));
    $('.reveal .slides section .move-left')
      .on('click', this.onMoveSlideLeft.bind(this));
    $('.reveal .slides section .move-right')
      .on('click', this.onMoveSlideRight.bind(this));
    $('.reveal .slides section .move-up')
      .on('click', this.onMoveSlideUp.bind(this));
    $('.reveal .slides section .move-down')
      .on('click', this.onMoveSlideDown.bind(this));
    $('.reveal .slides section .merge-left')
      .on('click', this.onMergeLeft.bind(this));
    $('.reveal .slides section .merge-right')
      .on('click', this.onMergeRight.bind(this));

    this.syncControls();
    $(document.activeElement).blur();

    SL.analytics.trackEditor('Arrange mode');

    this._super();
  },

  /**
   * Deactivate
   *
   * @function
   * @param {boolean} enable
   */
  deactivate: function (enable) {
    this.active = false;

    if (!enable) {
      window.Reveal.toggleOverview(false);
    }

    this.editor.enableEditing();
    this.editor.sidebar.updateArrangeButton();

    $('.reveal .slides section:not(.stack)').removeClass('disabled');
    $('.reveal .slides section .arrange-controls').remove();

    this._super();
  },

  /**
   * @function
   */
  syncControls: function () {},

  /**
   * @function
   */
  onRevealOverviewShown: function () {
    if (!this.isActive()) {
      SL.editor.controllers.Mode.clear();
      this.activate(true);
    }
  },

  /**
   * @function
   */
  onRevealOverviewHidden: function () {
    if (this.isActive()) {
      this.deactivate(true);
    }
  },

  /**
   * @function
   * @param {Event} evt
   */
  onControlsClicked: function (evt) {
    if ($(evt.target).hasClass('arrange-controls')) {
      $(evt.target).parent('section')
        .removeClass('disabled').trigger('click');
    }
  },

  /**
   * @function
   * @param {Event} evt
   */
  onMoveSlideLeft: function (evt) {
    var $firstSection = $(evt.target).parents('section').first();

    if ($firstSection.parents('section.stack').length) {
      $firstSection = $firstSection.parents('section.stack');
    }

    var $prev = $firstSection.prev();

    if ($firstSection.length && $prev.length) {
      $firstSection.after($prev);

      window.Reveal.sync();
      window.Reveal.slide($firstSection.index());

      this.syncControls();
    }
  },

  /**
   * @function
   * @param {Event} evt
   */
  onMoveSlideRight: function (evt) {
    var $firstSection = $(evt.target).parents('section').first();

    if ($firstSection.parents('section.stack').length) {
      $firstSection = $firstSection.parents('section.stack');
    }

    var $next = $firstSection.next();

    if ($firstSection.length && $next.length) {
      $firstSection.before($next);

      window.Reveal.sync();
      window.Reveal.slide($firstSection.index());

      this.syncControls();
    }
  },

  /**
   * @function
   * @param {Event} evt
   */
  onMoveSlideUp: function (evt) {
    var $firstSection = $(evt.target).parents('section').first(),
      $prev = $firstSection.prev();

    if ($firstSection.length && $prev.length) {
      $firstSection.after($prev);

      window.Reveal.sync();
      window.Reveal.slide(
          $firstSection.parents('section.stack').index(),
          $firstSection.index());

      this.syncControls();
    }
  },

  /**
   * @function
   * @param {Event} evt
   */
  onMoveSlideDown: function (evt) {
    var $firstSection = $(evt.target).parents('section').first(),
      $next = $firstSection.next();

    if ($firstSection.length && $next.length) {
      $firstSection.before($next);

      window.Reveal.sync();
      window.Reveal.slide(
        $firstSection.parents('section.stack').index(),
        $firstSection.index());

      this.syncControls();
    }
  },

  /**
   * @function
   * @param {Event} evt
   */
  onMergeLeft: function (evt) {
    var $firstSection = $(evt.target).parents('section').first(),
      $prev = $firstSection.prev();

    if ($firstSection.parents('section.stack').prev().length) {
      $prev = $firstSection.parents('section.stack').prev();
    }

    if ($firstSection.length) {
      if ($firstSection.parents('section.stack').length) {
        $firstSection.insertBefore($firstSection.parents('section.stack'));
      } else if ($prev.is('section.stack')) {
        $prev.prepend($firstSection);
      } else {
        SL.editor.controllers .Markup
          .mergeHorizontalSlides($prev, $firstSection);
      }

      SL.editor.controllers.Markup.unwrapEmptyStacks();

      var indices = window.Reveal.getIndices($firstSection.get(0));

      window.Reveal.sync();
      window.Reveal.slide(indices.h, indices.v);

      this.syncControls();
    }
  },

  /**
   * @function
   * @param {Event} evt
   */
  onMergeRight: function (evt) {
    var $firstSection = $(evt.target).parents('section').first(),
      $next = $firstSection.next();

    if ($firstSection.parents('section.stack').next().length) {
      $next = $firstSection.parents('section.stack').next();
    }

    if ($firstSection.length) {
      if ($firstSection.parents('section.stack').length) {
        $firstSection.insertAfter($firstSection.parents('section.stack'));
      } else if ($next.is('section.stack')) {
        $next.prepend($firstSection);
      } else {
        SL.editor.controllers.Markup.mergeHorizontalSlides($next, $firstSection);
      }

      SL.editor.controllers.Markup.unwrapEmptyStacks();

      var indices = window.Reveal.getIndices($firstSection.get(0));

      window.Reveal.sync();
      window.Reveal.slide(indices.h, indices.v);

      this.syncControls();
    }
  }
});


/*!
 * project name: SlideStudio
 * name:         css.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/18
 */

'use strict';

SL('editor.modes').CSS = SL.editor.modes.Base.extend({
  /**
   * Constructor SL.editor.modes.CSS Instance
   *
   * @function
   * @param {Editor|Object|*} editor -The Editor Instance
   */
  init: function (editor) {
    this.$userCSSInput  = $('#user-css-input');
    this.$userCSSOutput = $('#user-css-output');

    this.parseTimeout = -1;

    if (this.$userCSSInput.length) {
      SLConfig.deck.css_input = this.$userCSSInput.html() || '';
    }

    if (this.$userCSSOutput.length) {
      SLConfig.deck.css_output = this.$userCSSOutput.html() || '';
    }

    this._super(editor, 'css');
  },

  /**
   * Render Css
   *
   * @function
   */
  render: function () {
    this.$domElement = $('<div class="css-editor">').appendTo(document.body);

    this.$headerElemenet = $('<header>').appendTo(this.$domElement);
    this.$headerElemenet.append('<p>Enter custom styles using LESS or plain CSS. All selectors are prefixed with .reveal on save. <a href="http://#/knowledgebase/articles/253052-css-editor-pro-" target="_blank">Find out more and see examples.</a></p>');

    this.$contentsElement =
      $('<div class="contents">').appendTo(this.$domElement);
    this.$contentsElement
      .append('<div id="ace-less" class="editor"></div>');

    this.$errorElement =
      $('<div class="error">').appendTo(this.$contentsElement);

    this.$footerElement =
      $('<footer>').appendTo(this.$domElement);
    this.$cancelButton =
      $([
        '<button class="button cancel negative grey xl">',
          SL.locale.get('Cancel'),
        '</button>'].join(''))
        .appendTo(this.$footerElement);
    this.$saveButton =
      $([
        '<button class="button save positive xl">',
          SL.locale.get('OK'),
        '</button>'].join(''))
        .appendTo(this.$footerElement);
  },

  /**
   * Render ACE Editor
   *
   * @function
   */
  renderEditor: function () {
    if (!this.cssEditor) {
      try {
        this.cssEditor = window.ace.edit('ace-less');
        this.cssEditor.setTheme('ace/theme/monokai');
        this.cssEditor.setDisplayIndentGuides(true);
        this.cssEditor.setShowPrintMargin(false);
        this.cssEditor.getSession().setMode('ace/mode/less');
      } catch (err) {
        console.log('An error occurred while initializing the Ace editor.');
      }

      this.cssEditor.env.editor
        .on('change', this.onInputChange.bind(this));
    }
  },

  /**
   * Bind Event
   *
   * @function
   */
  bind: function () {
    this.$cancelButton.on('click', this.onCancelClicked.bind(this));
    this.$saveButton.on('click', this.onSaveClicked.bind(this));
  },

  /**
   * Activate
   *
   * @function
   */
  activate: function () {
    this.renderEditor();

    this.editor.disableEditing();
    this.editor.sidebar.close(true);

    this.$domElement.addClass('visible');

    this.savedCSSInput   = SLConfig.deck.css_input;
    this.savedCSSOutput  = SLConfig.deck.css_output;
    this.currentCSSInput = SLConfig.deck.css_input;

    this.$errorElement.text('').removeClass('visible');
    this.cssEditor.env.document.setValue(SLConfig.deck.css_input);
    this.cssEditor.focus();

    window.Reveal.configure({minScale: 0.4});
    setTimeout(window.Reveal.layout, 1);

    this._super();
  },

  /**
   * Deactivate
   *
   * @function
   */
  deactivate: function () {
    this.editor.enableEditing();
    this.$domElement.removeClass('visible');

    this._super();
  },

  /**
   * Save And Close
   *
   * @function
   */
  saveAndClose: function () {
    this.compile((function (cssStr) {
      SLConfig.deck.css_input  = this.cssEditor.env.document.getValue();
      SLConfig.deck.css_output = cssStr;
      SLConfig.deck.dirty      = true;

      SL.editor.controllers.Thumbnail.generate();
      this.deactivate();
    }).bind(this), (function () {
      SL.notify('Please fix all errors before saving.', 'negative');
    }).bind(this));
  },

  /**
   * Compile
   *
   * @function
   * @param {Function} successCb -Success Callback
   * @param {Function} failCb    -Fail Callback
   */
  compile: function (successCb, failCb) {
    if (!this.cssParser) {
      this.cssParser = new window.less.Parser();
    }

    var cssStr = this.cssEditor.env.document.getValue();

    this.cssParser.parse('.reveal { ' + cssStr + ' }', (function (err, tree) {
      if (err) {
        this.$errorElement.addClass('visible');
        this.$errorElement.html(err.message);

        if (failCb) {
          failCb.call(null, err);
        }

        this.cssParser = new window.less.Parser();
      } else {
        this.$errorElement.removeClass('visible');

        var css = tree.toCSS(), str = '';
        css = css.replace(
          /@import url\(["'\s]*(http:|https:)?\/\/(.*)\);?/gi,
          function (word) {
            str += word + '\n';
            return '';
          });

        css = str + css;
        this.$userCSSOutput.html(css);

        if (successCb) {
          successCb.call(null, css);
        }
      }
    }).bind(this));

    this.currentCSSInput = cssStr;
  },

  /**
   * Discard
   *
   * @function
   */
  discard: function () {
    SLConfig.deck.css_input  = this.savedCSSInput;
    SLConfig.deck.css_output = this.savedCSSOutput;

    this.$userCSSOutput.html(SLConfig.deck.css_output || '');
  },

  /**
   * @function
   */
  onInputChange: function () {
    clearTimeout(this.parseTimeout);
    this.parseTimeout = setTimeout(this.compile.bind(this), 500);
  },

  /**
   * @function
   * @param {Event} evt
   */
  onCancelClicked: function (evt) {
    if (this.currentCSSInput !== this.savedCSSInput) {
      SL.prompt({
        anchor: $(evt.currentTarget),
        title:     'You will lose all unsaved changes.',
        alignment: 't',
        type:      'select',
        data: [{
          html: '<h3>Cancel</h3>'
        }, {
          html: '<h3>Continue</h3>',
          className: 'negative',
          callback: (function () {
            this.discard();
            this.deactivate();
          }).bind(this)
        }]
      });
    } else {
      this.discard();
      this.deactivate();
    }
  },

  /**
   * @function
   */
  onSaveClicked: function () {
    this.saveAndClose();
  }
});


/*!
 * project name: SlideStudio
 * name:         fragment.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/18
 */

'use strict';

SL('editor.modes').Fragment = SL.editor.modes.Base.extend({
  /**
   * Constructor SL.editor.modes.Fragment Instance
   *
   * @function
   * @param {Editor|Object|*} editor -The Editor Instance
   */
  init: function (editor) {
    this._super(editor, 'fragment');

    this.deactivateOnSlideChange = true;
    this.onFragmentMouseDown     = this.onFragmentMouseDown.bind(this);
  },

  /**
   * Render Fragment View
   *
   * @function
   */
  render: function () {
    this._super();

    this.$toolbar = $([
      '<div class="mode-toolbar mode-toolbar-fragment">',
        '<div class="inner">',
          '<p class="description">',
            'Click on elements to turn them into <u data-tooltip="Fragments are invisible until stepped through when you present. Preview to see them in action. The numbers that appear on top of each fragment indicate the order they will appear in." data-tooltip-alignment="b" data-tooltip-maxwidth="355">fragments</u>.',
          '</p>',
          '<button class="button grey done">',
            'Done',
          '</button>',
        '</div>',
      '</div>'].join('')).appendTo($('.projector'));
  },

  /**
   * Bind Event
   *
   * @function
   */
  bind: function () {
    this._super();

    this.$toolbar.find('.done').on('vclick', this.deactivate.bind(this));
  },

  /**
   * Activate
   *
   * @function
   */
  activate: function () {
    if (!this.isActive()) {
      var $currentSlide = $(window.Reveal.getCurrentSlide()),
        isTouchEditor   = SL.editor.controllers.Capabilities.isTouchEditor();

      this.$overlays =
        $('<div class="fragment-overlay editing-ui">').appendTo($currentSlide);

      $currentSlide.find('.sl-block-content').each((function (index, item) {
        item = $(item);

        var isImgVideoIframe = item.is('img, video, iframe');

        if (!(item.hasClass('editing-ui') ||
          item.get(0).innerHTML === '' &&
          !isImgVideoIframe ||
          item.children().length === 1 &&
          item.children().first().is('br') &&
          !/\w/i.test(item.text()))) {
          var $li = item.find('>ul>li, >ol>li');

          if ($li.length > 0) {
            item = item.add($li);
          }

          item.each((function (index, item) {
            var $overlays = $([
              '<div class="editing-ui fragment-overlay-item">',
                '<div class="inner">',
                  '<div class="controls-item move-down icon i-arrow-down"></div>',
                  '<div class="controls-item index" data-tooltip="',
                    'This number represents the order in which the fragment will appear relative to other fragments.',
                    '" data-tooltip-alignment="r" data-tooltip-delay="500" data-tooltip-maxwidth="230">',
                  '</div>',
                  '<div class="controls-item move-up icon i-arrow-up"></div>',
                '</div>',
              '</div>'].join(''));
            $overlays.data('target-element', $(item));

            if (isTouchEditor) {
              $overlays.addClass('show-without-hover');
            }

            this.$overlays.append($overlays);
          }).bind(this));
        }
      }).bind(this));

      this.$overlays.find('.fragment-overlay-item')
        .on('vmousedown', this.onFragmentMouseDown);

      this.editor.disableEditing();
      this.editor.slideOptions.collapse();

      this.syncOverlays();

      SL.analytics.trackEditor('Fragment mode');

      this._super();
    }
  },

  /**
   * Deactivate
   *
   * @function
   */
  deactivate: function () {
    if (this.isActive()) {
      this.$overlays.find('.fragment-overlay-item').off();
      this.$overlays.off().remove();
      this.$overlays = null;

      this.editor.enableEditing();

      this._super();
    }
  },

  /**
   * Sync Overlays
   *
   * @function
   */
  syncOverlays: function () {
    this.$overlays.find('.fragment-overlay-item').each(function (index, item) {
      item = $(item);

      var $target   = item.data('target-element'),
        offset      = SL.util.getRevealElementOffset($target, true),
        zIndex      = $target.css('z-index'),
        $blockFirst = $target.parents('.sl-block-content').first();

      if ($blockFirst.length) {
        zIndex = $blockFirst.css('z-index');
      }

      item.css({
        left:   offset.x,
        top:    offset.y,
        width:  $target.outerWidth(true),
        height: $target.outerHeight(true),
        zIndex: zIndex
      });

      item.toggleClass('is-active', $target.hasClass('fragment'));
      item.toggleClass('is-hidden', $target.parents('.fragment').length > 0);

      var $index = item.find('.index');

      if ($index.length) {
        $index.html($target.attr('data-fragment-index'));
      }
    });

    var $currentSlide = $(window.Reveal.getCurrentSlide());

    this.$overlays.attr(
      'data-fragments-total',
      $currentSlide.find('.fragment').length);
  },

  /**
   * Toggle Fragment
   *
   * @function
   * @param {HTMLElement|*} $fragment
   */
  toggleFragment: function ($fragment) {
    if ($fragment.hasClass('fragment')) {
      $fragment.removeClass('fragment').removeAttr('data-fragment-index');
    } else {
      $fragment.addClass('fragment');
      $fragment.find('.fragment').removeClass('fragment')
        .removeAttr('data-fragment-index');
      $fragment.parents('.fragment').removeClass('fragment')
        .removeAttr('data-fragment-index');
    }

    window.Reveal.sync();
    this.syncOverlays();
  },

  /**
   * Change Fragment Index
   *
   * @function
   * @param {HTMLElement|*} $fragment
   * @param {Number}        newIndex
   */
  changeFragmentIndex: function ($fragment, newIndex) {
    var $overlayItem = this.$overlays.find('.fragment-overlay-item'),
      index = parseInt($fragment.attr('data-fragment-index'), 10);

    if (isNaN(index)) {
      index = 0;
    }

    index += newIndex;
    index = Math.max(Math.min(index, $overlayItem.length + 1), 0);

    $fragment.attr('data-fragment-index', index);

    this.syncOverlays();
  },

  /**
   * Flatten Fragment Indices
   *
   * @function
   */
  flattenFragmentIndices: function () {
    var $overlayItem = this.$overlays.find('.fragment-overlay-item');

    $overlayItem.sort(function (aItem, bItem) {
      var aIndex = parseInt(aItem.getAttribute('data-fragment-index'), 10),
        bIndex = parseInt(bItem.getAttribute('data-fragment-index'), 10);

      if (isNaN(aIndex)) {
        aIndex = -1;
      }

      if (isNaN(bIndex)) {
        bIndex = -1;
      }

       return aIndex - bIndex;
    });
    $overlayItem.each((function (index, item) {
      $(item).data('target-element')
        .attr('data-fragment-index', index);
    }).bind(this));
  },

  /**
   * @function
   * @param {Event} evt
   */
  onFragmentMouseDown: function (evt) {
    var $currentTarget = $(evt.currentTarget),
      targetElement = $currentTarget.data('target-element');

    if ($(evt.target).closest('.move-up').length) {
      this.changeFragmentIndex(targetElement, 1);
    } else if ($(evt.target).closest('.move-down').length) {
      this.changeFragmentIndex(targetElement, -1);
    } else if (targetElement && targetElement.length) {
      this.toggleFragment(targetElement);
    }

    return false;
  }
});


/*!
 * project name: SlideStudio
 * name:         preview.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/18
 */

'use strict';

SL('editor.modes').Preview = SL.editor.modes.Base.extend({
  /**
   * Constructor SL.editor.modes.Preview Instance
   *
   * @function
   * @param {Editor|Object|*} editor -The Editor Instance
   */
  init: function (editor) {
    this._super(editor, 'preview');

    $('.preview-controls-external').on('click', function () {
      SL.analytics.trackEditor('Open external preview');
    });
  },

  /**
   * Activate
   *
   * @function
   */
  activate: function () {
    if (window.Reveal.isOverview()) {
      window.Reveal.toggleOverview(false);
    }

    this.editor.disableEditing();
    this.editor.sidebar.close();

    SL.analytics.trackEditor('Preview mode');

    this._super();

    window.Reveal.configure({
      progress:  true,
      overview:  false,
      touch:     true,
      fragments: true,
      center:    false,
      autoSlide: SLConfig.deck.auto_slide_interval || 0
    });

    var indices = window.Reveal.getIndices();

    window.Reveal.slide(indices.h, indices.v, -1);

    $(document.activeElement).blur();

    if (typeof SLConfig.deck.slug === "string" &&
      SLConfig.deck.slug.length > 0) {
      $('.preview-controls-external').show()
        .attr(
          'href',
          SL.routes.DECK_LIVE(
            SLConfig.deck.user.username,
            SLConfig.deck.slug));
    } else {
      $('.preview-controls-external').hide();
    }
  },

  /**
   * Deactivate
   *
   * @function
   */
  deactivate: function () {
    this.editor.syncPageBackground();
    this.editor.enableEditing();

    this._super();

    window.Reveal.configure({
      progress:  false,
      overview:  true,
      touch:     false,
      center:    false,
      fragments: false,
      autoSlide: 0
    });

    SL.util.layoutReveal(500);
  }
});


/*!
 * project name: SlideStudio
 * name:         editor.js
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2015/8/20
 */

'use strict';

SL('editor').Editor = SL.views.Base.extend({
  /**
   * Constructor SL.editor.Editor Instance
   *
   * @function
   */
  init: function () {
    this._super();

    SL.editor.controllers.Capabilities.init();

    SLConfig.deck.theme_font  =
      SLConfig.deck.theme_font || SL.config.DEFAULT_THEME_FONT;
    SLConfig.deck.theme_color =
      SLConfig.deck.theme_color || SL.config.DEFAULT_THEME_COLOR;
    SLConfig.deck.transition  =
      SLConfig.deck.transition || SL.config.DEFAULT_THEME_TRANSITION;
    SLConfig.deck.background_transition =
      SLConfig.deck.background_transition || SL.config.DEFAULT_THEME_BACKGROUND_TRANSITION;
    SLConfig.deck.visibility  =
      SLConfig.deck.visibility || SL.models.Deck.VISIBILITY_ALL;

    this.$addHorizontalSlideButton = $('.add-horizontal-slide');
    this.$addVerticalSlideButton   = $('.add-vertical-slide');
    this.$previewControlsExit      = $('.preview-controls-exit');

    this.flags = {
      editing: true,
      saving:  false,
      unsaved: false,
      newDeck: !SLConfig.deck.id
    };

    if (this.isNewDeck() && SL.current_user.hasDefaultTheme()) {
      SLConfig.deck.theme_id = SL.current_user.getDefaultTheme().get('id');
    }

    this.savedDeck = JSON.parse(JSON.stringify(SLConfig.deck));

    // Load theme
    var theme = SL.current_user.getThemes().getByProperties({
      id: SLConfig.deck.theme_id
    });

    if (theme) {
      SL.helpers.PageLoader.show();
      theme.load().always(this.setup.bind(this));
    } else {
      this.setup();
    }
  },

  /**
   * @function
   */
  setup: function () {
    if (SL.fonts.isReady()) {
      SL.helpers.PageLoader.hide();
    } else {
      SL.helpers.PageLoader.show();
      SL.fonts.ready.add(SL.helpers.PageLoader.hide);
    }

    SL.keyboard.keyDown(this.onDocumentKeyDown.bind(this));

    this.setupControllers();
    this.setupComponents();
    this.setupReveal();
    this.setupTheme();
    this.setupWYSIWYG();
    this.setupDefaultContent();

    this.preloadWYSIWYG();

    this.changeInterval = setInterval(
      this.checkChanges.bind(this), SL.config.UNSAVED_CHANGES_INTERVAL);
    this.saveInterval = setInterval(
      this.checkAutoSave.bind(this), SL.config.AUTOSAVE_INTERVAL);

    $('html').toggleClass('is-new', this.isNewDeck());
    $('html').toggleClass('rtl', SLConfig.deck.rtl);

    this.bind();
    this.layout();
    this.enableEditing();

    $('html').addClass('editor-loaded-successfully');

    setTimeout((function () {
      SLConfig.deck.data  = SL.editor.controllers.Serialize.getDeckAsString();
      this.firstSlideData = SL.editor.controllers.Serialize.getFirstSlideAsString();

      this.toolbars.sync();
    }).bind(this), 1);
  },

  /**
   * @function
   */
  setupControllers: function () {
    SL.editor.controllers.Onboarding.init(this);
    SL.editor.controllers.Contrast.init(this);
    SL.editor.controllers.Blocks.init(this);
    SL.editor.controllers.Media.init(this);
    SL.editor.controllers.History.init(this);
    SL.editor.controllers.Markup.init(this);
    SL.editor.controllers.Migration.init(this);
    SL.editor.controllers.Session.init(this);
    SL.editor.controllers.Selection.init(this);
    SL.editor.controllers.Guides.init(this);
    SL.editor.controllers.Grid.init(this);
    SL.editor.controllers.URL.init(this);
    SL.editor.controllers.Mode.init(this, {
      css:      new SL.editor.modes.CSS(this),
      arrange:  new SL.editor.modes.Arrange(this),
      preview:  new SL.editor.modes.Preview(this),
      fragment: new SL.editor.modes.Fragment(this)
    });

    SL.editor.controllers.Mode.modeActivated.add((function () {
      SL.editor.controllers.Blocks.blur();
    }).bind(this));
    SL.editor.controllers.Mode.modeDeactivated.add((function () {
      var minScale = 1;

      if (SL.editor.controllers.Capabilities.isTouchEditor()) {
        minScale = 0.4;
      }

      window.Reveal.configure({
        minScale: minScale
      });

      setTimeout(window.Reveal.layout, 1);

      this.layout();

      SL.editor.controllers.Grid.refresh();
    }).bind(this));
  },

  /**
   * @function
   */
  setupComponents: function () {
    this.sidebar      = new SL.editor.components.Sidebar();
    this.toolbars     = new SL.editor.components.Toolbars(this);
    this.colorpicker  = new SL.editor.components.Colorpicker();
    this.slideOptions = new SL.editor.components.SlideOptions(this, {
      // html:     this.isDeveloperMode(),
      // fragment: !SL.editor.controllers.Capabilities.isTouchEditorSmall()
    });

    this.slideOptions.syncRemoveSlide();

    this.templates    = new SL.components.Templates();
  },

  /**
   * @function
   */
  setupReveal: function () {
    var options = {
      width: 1170, // TODO: size
      height: 650, // TODO: size
      controls:     true,
      progress:     false,
      history:      false,
      center:       false,
      touch:        false,
      fragments:    false,
      help:         false,
      pause:        false,
      mouseWheel:   false,
      rollingLinks: false,
      margin:       0.16,
      minScale:     1,
      maxScale:     1,
      keyboard: {
        27: null,
        70: null
      },
      keyboardCondition: (function () {
        return SL.editor.controllers.Mode.get('preview').isActive() ||
          SL.editor.controllers.Blocks.getFocusedBlocks().length === 0 &&
          !this.sidebar.isExpanded();
      }).bind(this),
      rtl:                  SLConfig.deck.rtl,
      loop:                 SLConfig.deck.should_loop,
      transition:           SLConfig.deck.transition,
      backgroundTransition: SLConfig.deck.background_transition
    };

    if (SL.editor.controllers.Capabilities.isTouchEditor()) {
      options.margin   = 0.05;
      options.minScale = 0.4;
    }

    if (SL.editor.controllers.Capabilities.isTouchEditorSmall()) {
      options.margin = 0.12;
    }

    window.Reveal.initialize(options);
    window.Reveal.addEventListener('ready', (function () {
      this.$addHorizontalSlideButton.addClass('show');
      this.$addVerticalSlideButton.addClass('show');

      SL.editor.controllers.Blocks.sync();
      SL.editor.controllers.Blocks.discoverBlockPairs();
    }).bind(this));
    window.Reveal.addEventListener('slidechanged', (function (evt) {
      if (evt.previousSlide) {
        SL.editor.controllers.Blocks.blurBlocksBySlide(evt.previousSlide);
      }

      SL.editor.controllers.Blocks.sync();
      SL.editor.controllers.Blocks.discoverBlockPairs();
      this.checkOverflow();
    }).bind(this));
  },

  /**
   * @function
   */
  setupTheme: function () {
    var theme = SL.current_user.getThemes().getByProperties({
      id: SLConfig.deck.theme_id
    });

    if (theme) {
      SLConfig.deck.transition           = theme.get('transition');
      SLConfig.deck.backgroundTransition = theme.get('background_transition');
    } else {
      theme = SL.models.Theme.fromDeck(SLConfig.deck);
    }

    SL.helpers.ThemeController.paint(theme, {center: false});
    this.syncPageBackground();
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

        SL.view.layout();
        setTimeout(SL.view.layout.bind(SL.view), 1);
      }, null, null, 9);
    });

    window.CKEDITOR.disableAutoInline              = true;
    window.CKEDITOR.config.floatSpaceDockedOffsetY = 1;
    window.CKEDITOR.config.title                   = false;
  },

  /**
   * @function
   */
  preloadWYSIWYG: function () {
    var $p = $('<p>').hide().appendTo(document.body),
      editor = window.CKEDITOR.inline($p.get(0));

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
   * @function
   */
  setupDefaultContent: function () {
    if (this.isNewDeck()) {
      SL.editor.controllers.Markup
        .replaceCurrentSlide(SL.data.templates.getNewDeckTemplate().get('html'));
    }
  },

  /**
   * @function
   */
  bind: function () {
    $(window).on('keyup', this.onWindowKeyUp.bind(this));
    $(window).on('beforeunload', this.onWindowBeforeUnload.bind(this));
    $(window).on('resize', this.onWindowResize.bind(this));

    this.$addHorizontalSlideButton
      .on('vclick', this.onAddHorizontalSlideClicked.bind(this));
    this.$addVerticalSlideButton
      .on('vclick', this.onAddVerticalSlideClicked.bind(this));
    this.$previewControlsExit
      .on('vclick', this.onExitPreviewClicked.bind(this));

    this.sidebar.saveClicked.add(this.save.bind(this));
    this.sidebar.previewClicked.add(this.onEnterPreviewClicked.bind(this));

    this.onUndoOrRedo = this.onUndoOrRedo.bind(this);

    SL.editor.controllers.History.undid.add(this.onUndoOrRedo);
    SL.editor.controllers.History.redid.add(this.onUndoOrRedo);
  },

  /**
   * @function
   */
  layout: function () {
    var slideSize = this.getSlideSize({scaled: true}),
      width       = window.innerWidth - this.getSidebarWidth(),
      height      = window.innerHeight,
      position    = {
        left:       (width + slideSize.width) / 2,
        top:        (height - slideSize.height) / 2,
        marginLeft: 0,
        marginTop:  0
      };

    position.left = Math.min(position.left, width - this.slideOptions.$domElement.width());
    position.top  = Math.max(position.top, 0);

    this.slideOptions.$domElement.css(position);

    var reveal = $('.reveal').get(0);

    if (reveal && reveal.scrollTop !== 0 || reveal.scrollLeft !== 0) {
      reveal.scrollTop  = 0;
      reveal.scrollLeft = 0;
    }
  },

  /**
   * @function
   */
  checkChanges: function () {
    if (!this.isSaving()) {
      var deckStr = SL.editor.controllers.Serialize.getDeckAsString();

      if (!SL.pointer.isDown()) {
        SL.editor.controllers.History.push(deckStr);
      }

      var changed = deckStr !== SLConfig.deck.data,
        dirty     = SLConfig.deck.dirty;

      this.flags.unsaved = changed || dirty;

      if (this.hasUnsavedChanges()) {
        this.sidebar.updateSaveButton('disabled', SL.locale.get('Editor.clk_save_tip'));
      } else {
        this.sidebar.updateSaveButton('disabled is-saved', SL.locale.get('Editor.changed_save_tip'));
      }
    }

    this.checkOverflow();
  },

  /**
   * @function
   */
  checkAutoSave: function () {
    if (this.hasUnsavedChanges() && !SL.pointer.isDown()) {
      this.save();
    }
  },

  /**
   * @function
   */
  checkOverflow: function () {
    var offset = 0,
      bounds   = SL.editor.controllers.Blocks
        .getCombinedBounds(SL.editor.controllers.Blocks.getCurrentBlocks());

    if (bounds.y < -offset || bounds.x < -offset ||
      bounds.right > SL.config.SLIDE_WIDTH + offset ||
      bounds.bottom > SL.config.SLIDE_HEIGHT + offset) {
      SL.editor.controllers.Markup.getCurrentSlide().addClass('overflowing');
      this.slideOptions.showOverflowWarning();
    } else {
      SL.editor.controllers.Markup.getCurrentSlide().removeClass('overflowing');
      this.slideOptions.hideOverflowWarning();
    }
  },

  /**
   * @function
   * @param {Object|String|*} deckData
   */
  save: function (deckData) {
    if (!this.isSaving()) {
      this.flags.saving = true;
      this.sidebar.updateSaveButton('disabled is-saving', SL.locale.get('Editor.saving_tip'));

      if (this.isNewDeck()) {
        this.createDeck(deckData);
      } else {
        this.updateDeck(deckData);
      }
    }
  },

  /**
   * @function
   * @param {String} dataStr
   * @returns {{
   *     deck: {
   *       title: (*|String),
   *       description: (*|String),
   *       data: (*|String),
   *       css_input: *,
   *       css_output: *,
   *       comments_enabled: *,
   *       forking_enabled: *,
   *       auto_slide_interval: *,
   *       transition: (*|string),
   *       background_transition: (*|string|string),
   *       theme_font: (*|string),
   *       theme_color: (*|string),
   *       should_loop: *, rtl: *,
   *       notes,
   *       rolling_links: boolean,
   *       center: boolean
   *     },
   *     version: (Document.VERSION|String|string|number|string|string|*)
   *   }}
   */
  getSaveData: function (dataStr) {
    var data = {
      deck: {
        catalogId: 2,
        courseId: 1,
        title:
          SL.util.unescapeHTMLEntities((SLConfig.deck.title || '')
            .substr(0, SL.config.DECK_TITLE_MAXLENGTH)),
        description:           SL.util.unescapeHTMLEntities(SLConfig.deck.description),
        data:                  SL.util.string.trim(dataStr),
        css_input:             SLConfig.deck.css_input,
        css_output:            SLConfig.deck.css_output,
        comments_enabled:      SLConfig.deck.comments_enabled,
        forking_enabled:       SLConfig.deck.forking_enabled,
        auto_slide_interval:   SLConfig.deck.auto_slide_interval,
        transition:            SLConfig.deck.transition,
        background_transition: SLConfig.deck.background_transition,
        theme_font:            SLConfig.deck.theme_font,
        theme_color:           SLConfig.deck.theme_color,
        should_loop:           SLConfig.deck.should_loop,
        rtl:                   SLConfig.deck.rtl,
        share_notes:           SLConfig.deck.share_notes,
        speakerNotes:          JSON.stringify(SLConfig.deck.notes),
        rolling_links:         false,
        center:                false
      },
      version:                 SL.editor.Editor.VERSION
    };

    if (SLConfig.deck.slug !== this.savedDeck.slug) {
      data.deck.custom_slug = SLConfig.deck.slug;
    }

    if (SL.current_user.hasThemes()) {
      data.deck.theme_id = SLConfig.deck.theme_id;
    }

    return data;
  },

  /**
   * @function
   * @param {Object} deckData
   */
  createDeck: function (deckData) {
    var deckDataStr = SL.editor.controllers.Serialize.getDeckAsString(),
      title = SLConfig.deck.title;

    if (!title) {
      var currentTile = $(window.Reveal.getSlide(0)).find('h1').text().trim();

      if (currentTile && /^(untitled|title\stext)$/gi.test(currentTile) === false) {
        SLConfig.deck.title = currentTile.substr(0, SL.config.DECK_TITLE_MAXLENGTH);
      }
    }

    $.ajax({
      type:    'POST',
      url:     SL.config.AJAX_CREATE_DECK(SLConfig.current_user.username),
      context: this,
      data:    this.getSaveData(deckDataStr)
    }).done(function (data) {
      $.extend(SLConfig.deck, data);

      SLConfig.deck.data  = deckDataStr;
      SLConfig.deck.dirty = false;

      $('html').removeClass('is-new');

      this.flags.newDeck = false;

      //SL.editor.controllers.URL.write();
      SL.editor.controllers.Thumbnail.generate();

      this.onSaveSuccess(deckData, data);
    }).fail(function (jqXHR) {
      this.onSaveError(deckData, jqXHR);
    }).always(function () {
      this.onSaveFinished(deckData);
    });
  },

  /**
   * @function
   * @param {Object} deckData
   */
  updateDeck: function (deckData) {
    var deckStr = SL.editor.controllers.Serialize.getDeckAsString(),
      deckId    = this.savedDeck ? this.savedDeck.id : SLConfig.deck.id;
    $.ajax({
      type:    'PUT',
      url:     SL.config.AJAX_UPDATE_DECK(deckId),
      context: this,
      data:    this.getSaveData(deckStr)
    }).done(function (data) {
      if (data && data.deck && data.deck.slug) {
        SLConfig.deck.slug = data.deck.slug;
        //SL.editor.controllers.URL.write();
      }

      SLConfig.deck.data  = deckStr;
      SLConfig.deck.dirty = false;

      var firstSlideStr = SL.editor.controllers.Serialize.getFirstSlideAsString();

      if (this.firstSlideData !== firstSlideStr ||
        SL.editor.controllers.Thumbnail.isInvalidated()) {
        this.firstSlideData = firstSlideStr;
        SL.editor.controllers.Thumbnail.generate();
      }

      this.onSaveSuccess(deckData, data);
    }).fail(function (jqXHR) {
      this.onSaveError(deckData, jqXHR);
    }).always(function () {
      this.onSaveFinished(deckData);
    });
  },

  /**
   * @function
   * @param {Object} deckData
   * @param {Object} dataObj
   */
  onSaveSuccess: function (deckData, dataObj) {
    this.savedDeck = JSON.parse(JSON.stringify(SLConfig.deck));

    if (dataObj && dataObj.deck &&
      dataObj.deck.sanitize_messages &&
      dataObj.deck.sanitize_messages.length) {
      SL.notify(dataObj.deck.sanitize_messages[0], 'negative');
    }

    if (deckData) {
      deckData.apply(null, [true]);
    }
  },

  /**
   * @function
   * @param {Object}          deckData
   * @param {HTMLXMLResponse} jqXHR
   */
  onSaveError: function (deckData, jqXHR) {
    if (jqXHR.status === 401) {
      SL.editor.controllers.Session.checkLogin();
    }

    SL.notify(SL.locale.get('Editor.deck_save_err'), 'negative');

    if (deckData) {
      deckData.apply(null, [false]);
    }
  },

  /**
   * @function
   */
  onSaveFinished: function () {
    this.flags.saving = false;

    this.checkChanges();

    $('html').addClass('editor-saved-successfully');
  },

  /**
   * @function
   * @param {boolean} isNew
   * @returns {boolean}
   */
  saveVisibility: function (isNew) {
    if (this.isNewDeck()) {
      this.save(this.saveVisibility.bind(this, isNew));
      return false;
    }

    $.ajax({
      type:    'POST',
      url:     SL.config.AJAX_PUBLISH_DECK(SLConfig.deck.id),
      context: this,
      data: {
        visibility: SLConfig.deck.visibility
      }
    }).done(function (data) {
      $('html').attr('data-visibility', SLConfig.deck.visibility);

      if (data.deck.visibility === SL.models.Deck.VISIBILITY_SELF) {
        SL.notify(SL.locale.get('Deck_Visibility_Changed_Self'));
      } else if (data.deck.visibility === SL.models.Deck.VISIBILITY_TEAM) {
        SL.notify(SL.locale.get('Deck_Visibility_Changed_Team'));
      } else if (data.deck.visibility === SL.models.Deck.VISIBILITY_ALL) {
        SL.notify(SL.locale.get('Deck_Visibility_Changed_All'));
      }

      this.sidebar.updatePublishButton();
    }).fail(function () {
      this.sidebar.updatePublishButton();
      SL.notify(SL.locale.get('Deck_Visibility_Changed_Err'), 'negative');
    });
  },

  /**
   * @function
   * @param {Number} index
   */
  navigateToSlide: function (index) {
    if (index) {
      var indices = window.Reveal.getIndices(index);

      setTimeout(function () {
        window.Reveal.slide(indices.h, indices.v);
      }, 1);
    }
  },

  /**
   * @function
   */
  enableEditing: function () {
    this.flags.editing = true;
    $('html').addClass('is-editing');
  },

  /**
   * @function
   */
  disableEditing: function () {
    this.flags.editing = false;
    $('html').removeClass('is-editing');
  },

  /**
   * @function
   */
  syncPageBackground: function () {
    $('html, body').css('background-color', SL.util.deck.getBackgroundColor());
  },

  /**
   * @function
   * @returns {*}
   */
  getCurrentTheme: function () {
    var theme = SL.current_user.getThemes().getByProperties({
      id: SLConfig.deck.theme_id
    });

    if (!theme) {
      theme = SL.models.Theme.fromDeck(SLConfig.deck);
    }

    return theme;
  },

  /**
   * @function
   * @param {Object} options
   * @returns {{width: number, height: number}}
   */
  getSlideSize: function (options) {
    var config = window.Reveal.getConfig(), scale = 1;

    if (options && options.scaled) {
      scale = window.Reveal.getScale();
    }

    return {
      width:  config.width * scale,
      height: config.height * scale
    };
  },

  /**
   * @function
   * @returns {number}
   */
  getSidebarWidth: function () {
    return 240;
  },

  /**
   * @function
   * @returns {*|boolean}
   */
  isDeveloperMode: function () {
    return SL.current_user.settings.get('developer_mode') &&
      !SL.editor.controllers.Capabilities.isTouchEditor();
  },

  /**
   * @function
   * @returns {boolean|string|string}
   */
  isEditing: function () {
    return this.flags.editing;
  },

  /**
   * @function
   * @returns {boolean}
   */
  isSaving: function () {
    return this.flags.saving;
  },

  /**
   * @function
   * @returns {*|boolean}
   */
  isNewDeck: function () {
    return this.flags.newDeck;
  },

  /**
   * @function
   * @returns {boolean|*}
   */
  hasUnsavedChanges: function () {
    return this.flags.unsaved;
  },

  /**
   * @function
   */
  onThemeChanged: function () {
    this.toolbars.sync();
    this.slideOptions.syncCustomClasses();
    this.syncPageBackground();
  },

  /**
   * @function
   */
  onUserInput: function () {
    clearInterval(this.saveInterval);
    this.saveInterval = setInterval(
      this.checkAutoSave.bind(this),
      SL.config.AUTOSAVE_INTERVAL);
  },

  /**
   * @function
   * @param {Event} evt
   */
  onAddHorizontalSlideClicked: function (evt) {
    evt.preventDefault();

    if (evt.shiftKey) {
      SL.editor.controllers.Markup.addHorizontalSlide();
    } else {
      this.templates.show({
        anchor:    this.$addHorizontalSlideButton,
        alignment: SLConfig.deck.rtl ? 'l' : 'r',
        callback: function (html) {
          SL.editor.controllers.Markup.addHorizontalSlide(html);
        }
      });
    }
  },

  /**
   * @function
   * @param {Event} evt
   */
  onAddVerticalSlideClicked: function (evt) {
    evt.preventDefault();

    if (evt.shiftKey) {
      SL.editor.controllers.Markup.addVerticalSlide();
    } else {
      this.templates.show({
        anchor:    this.$addVerticalSlideButton,
        alignment: 'b',
        callback: function (html) {
          SL.editor.controllers.Markup.addVerticalSlide(html);
        }
      });
    }
  },

  /**
   * @function
   */
  onEnterPreviewClicked: function () {
    SL.editor.controllers.Mode.change('preview');
  },

  /**
   * @function
   * @param {Event} evt
   */
  onExitPreviewClicked: function (evt) {
    evt.preventDefault();
    SL.editor.controllers.Mode.clear();
  },

  /**
   * @function
   */
  onWindowKeyUp: function () {
    this.onUserInput();
  },

  /**
   * @function
   * @param {String} evt
   */
  onDocumentKeyDown: function (evt) {
    if (evt.keyCode === 27) {
      var $focus = $('input:focus, textarea:focus, [contenteditable]:focus'),
        currentSlide = $(window.Reveal.getCurrentSlide()),
        mode         = SL.editor.controllers.Mode.get();

      if (mode && mode.isActive() && mode.getID() === 'css') {
        return false;
      }

      if (SL.popup.isOpen()) {
        return false;
      }

      if ($focus && $focus.length) {
        $focus.blur();
      } else if (this.sidebar.isExpanded()) {
        this.sidebar.close();
      } else if (this.colorpicker.isVisible()) {
        this.colorpicker.hide();
      } else if (this.slideOptions.hasOpenPanel()) {
        this.slideOptions.collapse();
      } else if (this.toolbars.hasOpenPanel()) {
        this.toolbars.collapse();
      } else if (SL.editor.controllers.Blocks.getFocusedBlocks().length) {
        SL.editor.controllers.Blocks.blur();
      } else if (mode && mode.isActive() &&
        /(absolute|fragment|preview)/gi.test(mode.getID())) {
        mode.deactivate();

        if (/(absolute|fragment)/gi.test(mode.getID())) {
          currentSlide.focus();
        }
      } else {
        window.Reveal.toggleOverview();
      }
    } else {
      if (SL.util.isTypingEvent(evt)) {
        return true;
      }

      var isExpanded = this.sidebar.isExpanded(),
        isCtrl       = evt.metaKey || evt.ctrlKey;

      if (evt.keyCode === 8) {
        evt.preventDefault();
      } else if (isCtrl && evt.keyCode === 83) {
        if (this.hasUnsavedChanges()) {
          this.save();
        }

        evt.preventDefault();
      } else if (!isExpanded && isCtrl && evt.keyCode === 89) {
        SL.editor.controllers.History.redo();
        evt.preventDefault();
      } else if (!isExpanded && isCtrl && evt.shiftKey && evt.keyCode === 90) {
        SL.editor.controllers.History.redo();
        evt.preventDefault();
      } else if (!isExpanded && isCtrl && evt.keyCode === 90) {
        SL.editor.controllers.History.undo();
        evt.preventDefault();
      } else if (isExpanded || !isCtrl || evt.shiftKey || evt.keyCode !== 70) {
        if (!isExpanded && evt.shiftKey && evt.altKey && evt.keyCode === 70) {
          SL.editor.controllers.Mode.toggle('fragment');
          evt.preventDefault();
        } else if (!isExpanded && evt.shiftKey && evt.altKey && evt.keyCode === 78) {
          this.slideOptions.triggerNotes();
          evt.preventDefault();
        } else if (!isExpanded && evt.shiftKey && evt.altKey && evt.keyCode === 72) {
          this.slideOptions.triggerHTML();
          evt.preventDefault();
        }
      } else {
        SL.editor.controllers.Mode.toggle('preview');
        evt.preventDefault();
      }
    }

    return true;
  },

  /**
   * @function
   * @returns {*}
   */
  onWindowBeforeUnload: function () {
    if (this.hasUnsavedChanges()) {
      return SL.locale.get('Editor.leave_unsaved_deck');
    } else {
      return void 0;
    }
  },

  /**
   * @function
   */
  onWindowResize: function () {
    window.Reveal.layout();
    this.layout();
  },

  /**
   * @function
   * @param {Object} history
   */
  onUndoOrRedo: function (history) {
    SL.util.skipCSSTransitions($('html'), 100);

    SL.editor.controllers.Mode.clear();
    SL.editor.controllers.Blocks.blur();

    $('.reveal .slides').html(history.data);

    window.Reveal.sync();
    window.Reveal.slide(history.indices.h, history.indices.v);

    this.slideOptions.syncRemoveSlide();
    SL.editor.controllers.Blocks.sync();

    var mode = SL.editor.controllers.Mode.get(history.mode);

    if (mode) {
      mode.activate();
    } else if (history.focusedBlocks && history.focusedBlocks.length) {
      SL.editor.controllers.Blocks
        .getCurrentBlocks().forEach(function (currentBlock) {
          history.focusedBlocks.forEach(function (block) {
            if (currentBlock.getID() === block) {
              SL.editor.controllers.Blocks.focus(currentBlock, true);
            }
          });
        });
    }
  }
});

SL('editor').Editor.VERSION = 2;

