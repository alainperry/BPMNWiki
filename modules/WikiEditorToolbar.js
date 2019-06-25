var customizeToolbar = function () {
  $('#wpTextbox1,#pf_free_text').wikiEditor('addToToolbar', {
    section: 'advanced',
    group: 'insert',
    tools: {
      "bpmn": {
        label: 'BPMN',
        type: 'button',
        filters: [ 'body.ns-2200' ],
        /*icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAFXSURBVEhLtZVNSgQxEEYb3Ik3UDei4BkUvJreYcA7+At6EcFzqKizUhf6vXRK0tUV0j3MPHiQ7kyqMlWh02X25a38zN7JIzmX8+yAPfkqv+WDfMzjF7krPQu51Q8HEPg3O0hyI7/kSXrqOZUkuUpPQwjAJnbSU08ZfJRkKdm5hyAf/XC0GJ8k/z4KbqYk1JxgnqkJLop3XuZSQykHZTHOJO9ovIeFvkRRkhQcOC3WZBbij3yTB9JTa3KZ5D+4wWmhoZTkXbLzQzkXAo+Cl1BT3Ajb8jnLeBWsRCOoKUfVfsA4qnOLaoJLaZMm7+Zia6s0f1Bh8gZtci6TS7xqAljHIWkSHnPbdc0p+PvkXh7LRBS0tAXB+dT4dXxq0r/xE94W7Dxah9w14URpC+6TaB2mz300Udpi4wloaLQO05UbTZS24LTQUL+Oxq+lycBJoqF2n1xLBe+6P+554mT9KCfUAAAAAElFTkSuQmCC',*/
        action: {
          type: 'encapsulate',
          options: {
            pre: "<bpmn>\r\n",
            peri: "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\r\n<bpmn2:definitions xmlns:xsi=\"http:\/\/www.w3.org\/2001\/XMLSchema-instance\" xmlns:bpmn2=\"http:\/\/www.omg.org\/spec\/BPMN\/20100524\/MODEL\" xmlns:bpmndi=\"http:\/\/www.omg.org\/spec\/BPMN\/20100524\/DI\" xmlns:dc=\"http:\/\/www.omg.org\/spec\/DD\/20100524\/DC\" xmlns:di=\"http:\/\/www.omg.org\/spec\/DD\/20100524\/DI\" xsi:schemaLocation=\"http:\/\/www.omg.org\/spec\/BPMN\/20100524\/MODEL BPMN20.xsd\" id=\"sample-diagram\" targetNamespace=\"http:\/\/bpmn.io\/schema\/bpmn\">\r\n  <bpmn2:process id=\"Process_1\" isExecutable=\"false\">\r\n    <bpmn2:startEvent id=\"StartEvent_1\"\/>\r\n  <\/bpmn2:process>\r\n  <bpmndi:BPMNDiagram id=\"BPMNDiagram_1\">\r\n    <bpmndi:BPMNPlane id=\"BPMNPlane_1\" bpmnElement=\"Process_1\">\r\n      <bpmndi:BPMNShape id=\"_BPMNShape_StartEvent_2\" bpmnElement=\"StartEvent_1\">\r\n        <dc:Bounds height=\"36.0\" width=\"36.0\" x=\"412.0\" y=\"240.0\"\/>\r\n      <\/bpmndi:BPMNShape>\r\n    <\/bpmndi:BPMNPlane>\r\n  <\/bpmndi:BPMNDiagram>\r\n<\/bpmn2:definitions>",
            post: "\r\n</bpmn>"
          }
        }
      }
    }
  });
};

/* Check if view is in edit mode and that the required modules are available. Then, customize the toolbar … */
if (['edit', 'formedit', 'submit', 'view'].indexOf(mw.config.get('wgAction')) !== -1) {
  mw.loader.using('user.options').then(function() {
    if (mw.user.options.get('usebetatoolbar') == 1) {
      $.when(mw.loader.using('ext.wikiEditor'), $.ready).then(customizeToolbar);
    }
  });
}
