<?php
class SpecialBPMNEditor extends SpecialPage {
	function __construct() {
		parent::__construct( 'BPMNEditor' );
	}

	function execute( $par ) {
		//$request = $this->getRequest();
		$output = $this->getOutput();
		$this->setHeaders();

		# Get request data from, e.g.
		//$param = $request->getText( 'param' );
    
    $output->addModules('ext.BPMNWikiSpecial');

		# Do stuff
    $newbpmn = '<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xsi:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd" id="sample-diagram" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn2:process id="Process_1" isExecutable="false">
    <bpmn2:startEvent id="StartEvent_1"/>
  </bpmn2:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds height="36.0" width="36.0" x="412.0" y="240.0"/>
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn2:definitions>';
    $newbpmn = json_encode($newbpmn);
		$out = "<script>var newbpmn = ". $newbpmn .";</script>";
    $out .= "<div id='js-drop-zone'>";
    $out .= "<div id='canvas' style='height: 800px; clear: both;'></div>";
    $out .= "</div>";
    $out .= '
<div class="io-import-export">
  <ul class="io-import io-control io-control-list io-horizontal">
    <li>
      <button title="save BPMN diagram inside its original wiki article" jsaction="click:bpmn.saveWiki">
        <span class="icon-bpmnwiki-save"></span>
      </button>
    </li>
    <li class="vr" style="margin-left: 2px"></li>
    <li>
      <button title="open BPMN diagram from local file system" jsaction="click:bio.openLocal">
        <span class="icon-bpmnwiki-open"></span>
      </button>
    </li>
    <li class="vr" style="margin-left: 2px"></li>
    <li>
      <button title="create new BPMN diagram" jsaction="click:bio.createNew">
        <span class="icon-bpmnwiki-plus-circled"></span>
      </button>
    </li>
  </ul>
  <ul class="io-export io-control io-control-list io-horizontal">
    <li>
      <a target="_blank" href="" class="download" title="download BPMN diagram" jswidget="downloadDiagram" data-track="diagram:download-bpmn">
        <span class="icon-bpmnwiki-download"></span>
      </a>
    </li>
    <li>
      <a target="_blank" href="" class="download" title="download as SVG image" jswidget="downloadSVG" data-track="diagram:download-svg">
        <span class="icon-bpmnwiki-file-image"></span>
      </a>
    </li>
  </ul>
</div>';
    $out .= '
<div class="io-alerts">
  <div class="io-control alert" jswidget="import-warnings-alert">
    <a href="" class="close" aria-hidden="true" jsaction="click:bio.clearImportDetails">×</a>
    Diagram may not render correctly due to import warnings.
    <a href="" jsaction="click:bio.showImportDetails">Show details</a>.
  </div>
  <div class="io-control alert" jswidget="undo-redo-alert">
    You edited the diagram.
    <a href="" jsaction="click:bio.undo">Undo last change</a>.
    <a href="" class="close" aria-hidden="true" jsaction="click:bio.hideUndoAlert">×</a>
  </div>
</div>';
    $out .= '
<div class="io-editing-tools" jswidget="editing-tools" style="display: block;">
  <ul class="io-control-list io-horizontal">
    <li class="io-control">
      <button title="Toggle keyboard shortcuts overlay" jsaction="click:bio.showKeyboard">
        <span class="icon-bpmnwiki-keyboard"> </span>
      </button>
    </li>
    <li class="io-control">
      <button title="Toggle Fullscreen" jsaction="click:bio.toggleFullscreen">
        <span class="icon-bpmnwiki-fullscreen"> </span>
      </button>
    </li>
  </ul>
</div>';
    $out .= '
<div class="io-zoom-controls">
  <ul class="io-zoom-reset io-control io-control-list">
    <li>
      <button title="reset zoom" jsaction="click:bio.zoomReset">
        <span class="icon-bpmnwiki-resize"></span>
      </button>
    </li>
  </ul>
  <ul class="io-zoom io-control io-control-list">
    <li>
      <button title="zoom in" jsaction="click:bio.zoomIn">
        <span class="icon-bpmnwiki-plus"></span>
      </button>
    </li>
    <li>
      <hr>
    </li>
    <li>
      <button href="" title="zoom out" jsaction="click:bio.zoomOut">
        <span class="icon-bpmnwiki-minus"></span>
      </button>
    </li>
  </ul>
</div>';
    $out .= '
<div class="io-dialog import-warnings" jswidget="import-warnings-dialog">
  <div class="content">
    <h1>Import Warnings</h1>
    <p>
      One or more problems have been identified when trying to import the BPMN 2.0 diagram:
    </p>
    <p>
      <textarea class="error-log"></textarea>
    </p><p>
    </p><p>
      This may have been caused by malformed input data.
      As a result the diagram may not render correctly.
    </p>
  </div>
</div>';
    $out .= '
<div class="io-dialog keybindings-dialog" jswidget="keybindings-dialog">
  <div class="content bindings-mac">
    <h1>Keyboard Shortcuts</h1>
    <table>
      <tbody>
        <tr>
          <td>Undo</td>
          <td class="binding">⌘ + Z</td>
        </tr>
        <tr>
          <td>Redo</td>
          <td class="binding">⌘ + ⇧ + Z</td>
        </tr>
        <tr>
          <td>Select All</td>
          <td class="binding">⌘ + A</td>
        </tr>
        <tr>
          <td>Scrolling (Vertical)</td>
          <td class="binding">⌥ + Scrolling</td>
        </tr>
        <tr>
          <td>Scrolling (Horizontal)</td>
          <td class="binding">⌥ + ⇧ + Scrolling</td>
        </tr>
        <tr>
          <td>Direct Editing</td>
          <td class="binding">E</td>
        </tr>
        <tr>
          <td>Hand Tool</td>
          <td class="binding">H</td>
        </tr>
        <tr>
          <td>Lasso Tool</td>
          <td class="binding">L</td>
        </tr>
        <tr>
          <td>Space Tool</td>
          <td class="binding">S</td>
        </tr>
      </tbody>
    </table>
  </div>
  <div class="content bindings-default">
    <h1>Keyboard Shortcuts</h1>
    <table>
      <tbody>
        <tr>
          <td>Undo</td>
          <td class="binding"><code>ctrl + Z</code></td>
        </tr>
        <tr>
          <td>Redo</td>
          <td class="binding"><code>ctrl + ⇧ + Z</code></td>
        </tr>
        <tr>
          <td>Select All</td>
          <td class="binding"><code>ctrl + A</code></td>
        </tr>
        <tr>
          <td>Scrolling (Vertical)</td>
          <td class="binding"><code>ctrl + Scrolling</code></td>
        </tr>
        <tr>
          <td>Scrolling (Horizontal)</td>
          <td class="binding"><code>ctrl + ⇧ + Scrolling</code></td>
        </tr>
        <tr>
          <td>Direct Editing</td>
          <td class="binding"><code>E</code></td>
        </tr>
        <tr>
          <td>Hand Tool</td>
          <td class="binding"><code>H</code></td>
        </tr>
        <tr>
          <td>Lasso Tool</td>
          <td class="binding"><code>L</code></td>
        </tr>
        <tr>
          <td>Space Tool</td>
          <td class="binding"><code>S</code></td>
        </tr>
      </tbody>
    </table>
  </div>
</div>';
		$output->addHtml( $out );
	}
}