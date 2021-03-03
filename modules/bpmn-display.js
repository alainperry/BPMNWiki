// viewer instance
var bpmnViewer = new BpmnJS({
  container: '#canvas'
});

// overlays service
var overlays = bpmnViewer.get('overlays');

// canvas service
var canvas = bpmnViewer.get('canvas');

// event bus
var eventBus = bpmnViewer.get('eventBus');

// element registry
var elementRegistry = bpmnViewer.get('elementRegistry');

/**
 * Open diagram in a viewer instance.
 *
 * @param {String} bpmnXML diagram to display
 */
function openDiagram(bpmnXML) {
  // import diagram
  bpmnViewer.importXML(bpmnXML, function(err) {
    if (err) {
      return console.error('could not import BPMN 2.0 diagram', err);
    }
    // zoom to fit full viewport
    canvas.zoom('fit-viewport', 'auto');
  });
}

// Overwrite scroll function of canvas
canvas.__proto__.scroll = function(delta) {
  var matrix = this._viewport.getCTM();
  window.scrollBy(-delta.dx, -delta.dy);
  return { x: matrix.e, y: matrix.f };
}

// Do open
openDiagram(diagramXml);

// Retrieve human readable page name (unnormalized title) including namespace
var pageName = mw.config.get('wgCanonicalNamespace') + ':' + mw.config.get('wgTitle');

// Wait for the BPMN diagram to be fully loaded
eventBus.on('import.done', function (e) {
  // Iterate through every element in the diagram and store a ref for all those we're interested in
  var elements = elementRegistry.filter(function(element) {
    var type = element.businessObject.$type;
    // Only keep tasks, events and gateways
    return type.match(/bpmn:\w*Task/) || type.match(/bpmn:\w*Process/) || type.match(/bpmn:\w*Event/) || type.match(/bpmn:\w*Gateway/) ? element : null;
  });
  
  // For the bunch of these elements, ask the wiki if they have a page
  $.ajax({
    url: mw.util.wikiScript('api'),
    data: {
      action: 'query',
      titles: elements.map(function(e) {
        return pageName +'/'+ e.businessObject.name;
      }).join('|'),
      format: 'json'
    },
    type: 'GET',
    success: function(data) {
      var pages = data.query.pages;
      
      elements.forEach(function (e, idx) {
        // Initial assumption: page is missing
        var missing = true;
        for (i in pages) { // Pages being an Object (not an Array), this is the way to iterate
          var p = pages[i];
          // Test if the info returned for the current page has a "missing" property
          if (pageName +'/'+ e.businessObject.name == p.title && p.missing == undefined) {
            // If the element has an associated page in the wiki, add the corresponding CSS class to its shape
            canvas.addMarker(e.id, 'page-exists');
            // And flag it as non-missing before reaching the code below
            missing = false;
          }
        }
        if (missing) {
          // If the element doesn't have a page in the wiki, add the corresponding CSS class to its shape
          canvas.addMarker(e.id, 'page-missing');
        }
      });
    }
  });
  
  // An element of the diagram has been clicked !
  eventBus.on('element.click', function(e) {
      console.dir(e.element.businessObject);
    // If the clicked element has been marked (via CSS) as having a page, just add its label to the current URL and load that
    if (canvas.hasMarker(e.element, 'page-exists')) {
      window.location.href = window.location.href +'/'+ e.element.businessObject.name.replace(/\?$/, '%3f');
    } else { // If it's been marked as missing, redirect to the adequate Page:Forms form for creating that page
      var form;
      var type = e.element.businessObject.$type;
      if (type.match(/bpmn:\w*Task/)) {
        form = 'Activité';
      } else if (type.match(/bpmn:\w*Process/)) {
        form = 'Processus';
      } else if (type.match(/bpmn:\w*Event/)) {
        form = 'Événement';
      } else if (type.match(/bpmn:\w*Gateway/)) {
        form = 'Passerelle';
      }
      // ... but only if the element is of a supported type and has a label
      if (form !== undefined && e.element.businessObject.name !== undefined) {
        var url = mw.config.get('wgServer'); // scheme + hostname + port component
        url += mw.config.get('wgScript'); // full path to index.php
        url += '/Special:FormEdit'; // path to the FormEdit special page
        url += '/'+ form; // name of the form to use for page creation
        url += '/'+ encodeURIComponent(pageName).replace('%2F', '/'); // first part of the name of the page to be created, equals to the current page's name
        url += '/'+ encodeURIComponent(e.element.businessObject.name); // second part of the name of the page to be created, based on the clicked component's label
        url += '?'+ form +'[Processus]='+ pageName; // query string used to pre-fill the "process" field based on the current page's title
        window.location.href = url; // let's go !
      }
    }
  });
});