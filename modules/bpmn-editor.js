/*
 * The following is taken from min-dash
 */
var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

/**
 * Convenience wrapper for `Object.assign`.
 *
 * @param {Object} target
 * @param {...Object} others
 *
 * @return {Object} the target
 */
function assign(target) {
  for (var _len = arguments.length, others = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    others[_key - 1] = arguments[_key];
  }

  return _extends.apply(undefined, [target].concat(others));
}

var nativeToString = Object.prototype.toString;

function isNumber(obj) {
  return nativeToString.call(obj) === '[object Number]';
}

/**
 * Debounce fn, calling it only once if
 * the given time elapsed between calls.
 *
 * @param  {Function} fn
 * @param  {Number} timeout
 *
 * @return {Function} debounced function
 */
function debounce(fn, timeout) {
  var timer;

  var lastArgs;
  var lastThis;

  var lastNow;

  function fire() {

    var now = Date.now();

    var scheduledDiff = lastNow + timeout - now;

    if (scheduledDiff > 0) {
      return schedule(scheduledDiff);
    }

    fn.apply(lastThis, lastArgs);

    timer = lastNow = lastArgs = lastThis = undefined;
  }

  function schedule(timeout) {
    timer = setTimeout(fire, timeout);
  }

  return function () {

    lastNow = Date.now();

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    lastArgs = args;
    lastThis = this;

    // ensure an execution is scheduled
    if (!timer) {
      schedule(timeout);
    }
  };
}

/*
 * The following is taken from the "align-to-origin" bpmn.io module
 */
var DEFAULT_OPTIONS = {
  offset: {
    x: 150,
    y: 75
  },
  tolerance: 50,
  alignOnSave: true
};

var HIGHER_PRIORITY = 1250;


/**
 * Moves diagram contents to the origin + offset,
 * optionally upon diagram save.
 *
 * @param {Object} config
 * @param {didi.Injector} injector
 * @param {EventBus} eventBus
 * @param {CommandStack} commandStack
 * @param {Canvas} canvas
 * @param {Modeling} modeling
 */
function AlignToOrigin(config, injector, eventBus, commandStack, canvas, modeling) {

  /**
   * Return actual config with defaults applied.
   */
  function applyDefaults(config) {

    var c = assign({}, DEFAULT_OPTIONS, config || {});

    if (isNumber(c.offset)) {
      c.offset = {
        x: c.offset,
        y: c.offset
      };
    }

    return c;
  }

  config = applyDefaults(config);

  /**
   * Compute adjustment given the specified diagram origin.
   *
   * @param {Point} origin
   *
   * @return {Point} adjustment
   */
  function computeAdjustment(origin, config) {

    var offset = config.offset,
        tolerance = config.tolerance;

    var adjustment = {};

    [ 'x', 'y' ].forEach(function(axis) {

      var delta = -origin[axis] + offset[axis];

      adjustment[axis] = Math.abs(delta) < tolerance ? 0 : delta;
    });

    return adjustment;
  }


  /**
   * Align the diagram content to the origin.
   *
   * @param {Object} options
   */
  function align() {

    var bounds = canvas.viewbox().inner;

    var elements = canvas.getRootElement().children;

    var delta = computeAdjustment(bounds, config);

    if (delta.x === 0 && delta.y === 0) {
      return;
    }

    commandStack.execute('elements.alignToOrigin', {
      elements: elements,
      delta: delta
    });
  }


  /**
   * Setup align on save functionality
   */
  function bindOnSave() {
    // nested editors expose _parent to access the
    // save responsible entity
    var parent = injector.get('_parent', false);

    var localEvents = eventBus;

    var parentEvents = parent && parent._eventBus;

    (parentEvents || localEvents).on('saveXML.start', HIGHER_PRIORITY, align);

    if (parentEvents) {

      // unregister for saveXML.start
      localEvents.on('diagram.destroy', function() {
        parentEvents.off('saveXML.start', align);
      });
    }
  }


  /**
   * Create a function that compensates the element movement
   * by moving applying the delta in the given direction.
   */
  function movementCompensator(direction) {

    /**
     * Handler to executed
     */
    return function(context) {

      // adjust canvas after the commandstack got changed
      eventBus.once('commandStack.changed', function() {

        var delta = context.delta;
        var scale = canvas.viewbox().scale;

        canvas.scroll({
          dx: direction * delta.x * scale,
          dy: direction * delta.y * scale
        });
      });
    };
  }

  // command registration

  /**
   * A command handler that compensates the element movement
   * by applying the inverse move operation on the canvas.
   */
  commandStack.register('elements.alignToOrigin', {

    preExecute: function(context) {
      var delta = context.delta,
          elements = context.elements;

      modeling.moveElements(elements, delta);
    },

    execute: movementCompensator(-1),
    revert: movementCompensator(1)
  });

  // setup

  if (config.alignOnSave) {
    bindOnSave();
  }

  // API

  this.align = align;
  this.computeAdjustment = computeAdjustment;

  // internal debugging purposes
  this._config = config;
}

AlignToOrigin.$inject = [
  'config.alignToOrigin',
  'injector',
  'eventBus',
  'commandStack',
  'canvas',
  'modeling'
];

var AlignToOriginModule = {
  __init__: [ 'alignToOrigin' ],
  alignToOrigin: [ 'type', AlignToOrigin ]
};

/*
 * Taken from the bpmn.io "replace-ids" module
 */

const ids = new Ids([ 32, 36, 1 ]);

function replaceIds(template) {
  return _replaceIds(template, ids);
}

var PATTERN = /\{\{[ ]*ID(?::([^ }]+))?[ ]*\}\}/g;

function _replaceIds(template, generator) {
  var next = wrapCaching(wrapGenerator(generator));

  return template.replace(PATTERN, function(_, name) {
    return next(name);
  });
}

// helpers ///////////////////////

function wrapCaching(next) {
  var cache = {};

  return function(name) {
    if (!name) {
      return next();
    }

    if (name in cache) {
      return cache[name];
    } else {
      return (cache[name] = next());
    }
  };
}

function wrapGenerator(generator) {
  if (typeof generator === 'function') {
    return generator;
  }

  if (typeof generator.next === 'function') {
    return function() {
      return generator.next();
    };
  }

  throw new Error('unsupported generator');
}

/*
 * Most of what's below, taken from the bpmn.io modeler demo
 */

function fileDownload(content, fileName, mimeType) {
  return download(
    'data:' + mimeType + ';charset=UTF-8,' + encodeURIComponent(content),
    fileName,
    mimeType
  );
}

// Ugly hack for ReferenceError problem. No idea why it happens, but TODO: we shouldn't keep this.
if (global === undefined) {
  var global = window;
}

/* global track */
global.track = global.track || function() {};

const container = $('#js-drop-zone');
const canvas = $('#canvas');

var modeler,
    config;

// does the diagram contain unsaved changes
var dirty = false;

function setDirty(newDirty) {
  dirty = newDirty;
}

function checkDirty() {
  if (dirty) {
    return 'This will discard changes you made to the current diagram.';
  }
}

/**
 * Ask for clearing changes (before reload)
 */
window.onbeforeunload = checkDirty;

/**
 * Respond to window resize
 */
window.onresize = debounce(function(e) {
  if (modeler) {
    modeler.get('canvas').resized();
  }
}, 300);

function Config() {
  var storage = window.localStorage || {};

  this.get = function(key) {
    return storage[key];
  };

  this.set = function(key, value) {
    storage[key] = value;
  };
}

var states = [ 'error', 'loading', 'loaded', 'shown', 'intro', 'animate', 'preload' ];

function setStatus(status) {
  $(document.body).removeClass(states.join(' ')).addClass(status);

  setTimeout(function() {
    $(document.body).addClass('animate');
  }, 0);
}

function setError(err) {
  setStatus('error');

  container.find('.error .error-log').val(err.message);

  console.error(err);
}

function showWarnings(warnings) {

  var show = warnings && warnings.length;

  toggleVisible(widgets['import-warnings-alert'], show);

  if (!show) {
    return;
  }

  console.warn('imported with warnings');

  var messages = '';

  warnings.forEach(function(w) {
    console.log(w);
    messages += (w.message + '\n\n');
  });

  var dialog = widgets['import-warnings-dialog'];

  dialog.find('.error-log').val(messages);
}

function toggleVisible(element, show) {
  element[show ? 'addClass' : 'removeClass']('open');
}

function openDialog(dialog) {

  var content = dialog.find('.content');

  toggleVisible(dialog, true);

  function stop(e) {
    e.stopPropagation();
  }

  function hide(e) {

    toggleVisible(dialog, false);

    dialog.off('click', hide);
    content.off('click', stop);
  }

  content.on('click', stop);
  dialog.on('click', hide);
}

config = new Config();

modeler = new BpmnJS({
  container: canvas,
  keyboard: { bindTo: document },
  additionalModules: [
    AlignToOriginModule
  ]
});

modeler.on('import.done', function(event) {
  var error = event.error,
      warnings = event.warnings;

  if (error) {
    setError(error);
  } else {
    // async scale to fit-viewport (prevents flickering)
    setTimeout(function() {
      modeler.get('canvas').zoom('fit-viewport');
      setStatus('shown');
    }, 0);
    setStatus('loaded');
  }

  showWarnings(warnings);
});

function openDiagram(xml) {
  var warning = checkDirty();

  if (warning && !window.confirm(warning)) {
    return;
  }

  setStatus('loading');

  modeler.importXML(xml, function(err) {
    if (err) {
      track('diagram', 'open', 'error');
    } else {
      track('diagram', 'open', 'success');
    }
  });
}

// modeler instance
/*var bpmnModeler = new BpmnJS({
  container: '#canvas',
  keyboard: {
    bindTo: window
  }
});*/

// access modeler components
/*var canvasService = modeler.get('canvas');
var overlaysService = modeler.get('overlays');
*/

var fileInput = $('<input type="file" />').appendTo(document.body).css({
  width: 1,
  height: 1,
  display: 'none',
  overflow: 'hidden'
}).on('change', function(e) {
  track('diagram', 'open-dialog');
  openFile(e.target.files[0], openDiagram);
});

var widgets = {};

function hideUndoAlert(e) {
  toggleVisible(widgets['undo-redo-alert'], false);

  if (config.set('hide-alert', 'yes')) {
    return;
  }
}

function updateUndoAlert() {
  if (config.get('hide-alert')) {
    return;
  }

  var commandStack = modeler.get('commandStack');

  var idx = commandStack._stackIdx;

  toggleVisible(widgets['undo-redo-alert'], idx >= 0);
}

function showEditingTools() {
  widgets['editing-tools'].show();
}

function toggleFullScreen(element) {

  if (!document.fullscreenElement &&
      !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {

    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen();
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
      element.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();

    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  }
}

function undo(e) {
  modeler.get('commandStack').undo();
}

function createDiagram() {
  var warning = checkDirty();

  if (warning && !window.confirm(warning)) {
    return;
  }

  var diagramXML = replaceIds(newbpmn);

  modeler.importXML(diagramXML, function(err, warnings) {

    if (err) {
      track('diagram', 'create', 'error');
    } else {
      track('diagram', 'create', 'success');

      // select start event so people can continue to do stuff
      modeler.get('selection').select(
        modeler.get('elementRegistry').get('StartEvent_1')
      );
    }
  });
}

// Save to wiki page
function saveWiki() {
  // Get the editor page title (including the diagram's page title that follows the "Special:BPMNEditor/")
  var pageTitle = mw.config.get('wgTitle');
  // Only retain the diagram's page title
  pageTitle = pageTitle.substring(mw.config.get('wgCanonicalSpecialPageName').length + 1);
  // Get the page's existing wikitext from the wm api
  $.ajax({
    url: mw.util.wikiScript('api'),
    data: {
      action: 'parse',
      page: pageTitle,
      prop: 'wikitext',
      format: 'json'
    },
    type: 'GET',
    success: function(data) {
      // Split the page contents around the <bpmn/> tags
      var oldSections = data.parse.wikitext['*'].split(/\n*<\/?bpmn>\n*/);
      var newSections = oldSections.slice();
      // Get the new diagram's XML
      modeler.saveXML({format: true}, function(err, xml) {
        if (err) {
          alert('An error occured while saving the diagram to its corresponding wiki article');
          return console.error(err);
        }
        if (newSections.length != 3) {
          alert('Target wiki article does not have exactly one BPMN diagram. This is unsupported with the editor at the moment.');
          return console.error('Unsupported wiki article (no diagram or more than one).');
        } else {
          newSections[1] = xml;
          newSections.splice(1, 0, '<bpmn>');
          newSections.splice(3, 0, '</bpmn>');
        }
        /*console.dir(oldSections);
        console.dir(newSections.join('\n'));*/
        $.ajax({
          url: mw.util.wikiScript('api'),
          data: {
            action: 'edit',
            title: pageTitle,
            text: newSections.join('\n'),
            notminor: true,
            watchlist: 'nochange',
            contentmodel: 'wikitext',
            format: 'json',
            token: mw.user.tokens.get('editToken')
          },
          type: 'POST',
          success: function(data) {
            if (data.edit.result == 'Success') {
              alert('Diagram saved in '+ pageTitle +' article.');
            } else {
              console.error(data);
            }
          }
        });
      });
    }
  });
}

var actions = {
  'bio.toggleFullscreen': function() {
    var elem = document.querySelector('html');
    toggleFullScreen(elem);
  },
  'bio.createNew': createDiagram,
  'bpmn.saveWiki': saveWiki,
  'bio.openLocal': function() {
    var input = $(fileInput);

    // clear input so that previously selected file can be reopened
    input.val('');
    input.trigger('click');
  },
  'bio.zoomReset': function() {
    modeler.get('zoomScroll').reset();
  },
  'bio.zoomIn': function(e) {
    modeler.get('zoomScroll').stepZoom(1);
  },
  'bio.zoomOut': function(e) {
    modeler.get('zoomScroll').stepZoom(-1);
  },
  'bio.showKeyboard': function(e) {

    var dialog = widgets['keybindings-dialog'];

    var platform = navigator.platform;

    if (/Mac/.test(platform)) {
      dialog.find('.bindings-default').remove();
    } else {
      dialog.find('.bindings-mac').remove();
    }

    openDialog(dialog);
  },
  'bio.showAbout': function(e) {
    openDialog(widgets['about-dialog']);
  },
  'bio.undo': undo,
  'bio.hideUndoAlert': hideUndoAlert,
  'bio.clearImportDetails': function(e) {
    showWarnings(null);
  },
  'bio.showImportDetails': function(e) {
    openDialog(widgets['import-warnings-dialog']);
  }
};

$(function() {
  // initialize existing widgets defined in
  // <div jswidget="nameOfWidget" />
  //
  // after this step we can use a widget via
  // widgets['nameOfWidget']
  $('[jswidget]').each(function() {
    var element = $(this),
        jswidget = element.attr('jswidget');

    widgets[jswidget] = element;
  });

  // attach all the actions defined via
  // <div jsaction="event:actionName" />

  function parseActionAttr(element) {

    var match = $(element).attr('jsaction').split(/:(.+$)/, 2);

    return {
      event: match[0], // click
      name: match[1] // bio.fooBar
    };
  }

  function actionListener(event) {
    var jsaction = parseActionAttr($(this));

    var name = jsaction.name,
        action = actions[name];

    if (!action) {
      throw new Error('no action <' + name + '> defined');
    }

    event.preventDefault();

    action(event);
  }


  var delegates = {};

  $('[jsaction]').each(function() {
    var jsaction = parseActionAttr($(this));
    var event = jsaction.event;

    if (!delegates[event]) {
      $(document.body).on(event, '[jsaction]', actionListener);
      delegates[event] = true;
    }

    var name = jsaction.name,
        handler = actions[name];

    if (!handler) {
      throw new Error('no action <' + name + '> defined');
    }
  });

  $(widgets['downloadDiagram']).click(function(e) {
    e.preventDefault();

    saveDiagram(function(err, xml) {
      fileDownload(xml, 'diagram.bpmn', 'application/xml');

      setDirty(false);
    });
  });

  $(widgets['downloadSVG']).click(function(e) {
    e.preventDefault();

    saveSVG(function(err, svg) {

      if (err) {
        return console.error(err);
      }

      fileDownload(svg, 'diagram.svg', 'image/svg+xml');
    });
  });

  function modelUpdate() {
    setDirty(true);
    updateUndoAlert();
  }

  function importSuccess() {
    setDirty(false);

    updateUndoAlert();
    showEditingTools();
  }

  modeler.on('commandStack.changed', modelUpdate);
  modeler.on('import.done', function(event) {
    if (!event.error) {
      importSuccess();
    }
  });
});


if (mw.config.get('wgCanonicalSpecialPageName') == 'BPMNEditor') {
  // Get the current page's name and split it based on its slashes ('/')
  var queryparts = mw.config.get('wgPageName').split('/');
  // Check if a page has indeed been requested
  if (queryparts.length > 1) {
    // Remove the SpecialPage name from the array
    queryparts.shift();
    $.ajax({
      url: mw.util.wikiScript('api'), // Retrieve this mediawiki's API URL
      data: {
        action: 'parse',
        page: queryparts.join('/'), // Get the wikitext of the requested page (rebuild a string from the remaining parts of the array)
        prop: 'wikitext',
        format: 'json'
      },
      type: 'GET',
      success: function(data) {
        if (data && data.error) {
          console.dir(data);
        } else {
          // Get the content between the <bpmn/> tags
          var content = data.parse.wikitext['*'].split(/<\/?bpmn>/);
          if (content.length > 1) {
            var wikibpmn = content[1].trim();
          }
          // Build the diagram based on that content, or a new diagram if there's none
          openDiagram(wikibpmn ? wikibpmn : newbpmn);
        }
      }
    });
  } else {
    // No page name was provided, so open the default new diagram
    openDiagram(newbpmn);
  }
}

modeler.on('element.changed', function(event) {
  //console.dir(event);
});