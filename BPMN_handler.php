<?php
  use MediaWiki\MediaWikiServices;

	global $wgBPMN;
	$wgBPMN_ = $wgBPMN;
	unset ($wgBPMN);

	global $wgBPMN;
	$wgBPMN        =[];
	$wgBPMN["class"]    = 'bpmn-container'.
						 (isset($wgBPMN_["class"]) ? ' '.$wgBPMN_["class"]  : '');
						 
	class BPMNHandler {
		public static function onBeforePageDisplay(OutputPage $out) {
			global $wgBPMN;
      
      // Adds the CSS and JS defined in extension.json for the ext.BPMNWiki module
      //   but only if it looks like a diagram has been included in the current page
			if (strpos($out->getHTML(),'var diagramXml') !== false) {
				$out->addModules('ext.BPMNWiki');
			}
      // TODO: Add a check to see if the WikiEditor extension is active
      $out->addModules('ext.BPMNWiki.WikiEditorToolbar');
		}

    // Adds the hook so the wikitext parser will call the function below when it meets the "<bpmn/>" tag
		static public function onParserFirstCallInit(Parser &$parser) {
			//$parser->setFunctionHook("bpmn", "BPMNHandler::parseBPMN");
			$parser->setHook('bpmn', "BPMNHandler::renderBPMNTag");
			
			return true;
		}
		
    // Do not render the content inside the "<bpmn/>" tag, instead store it in a javascript variable
    //   which the bpmn-display.js file will render in the inserted <canvas/>.
    //   Additionally, add a link to the BPMN editor for this diagram
    //   TODO: change the way this works (and is displayed) !
		static public function renderBPMNTag($input, array $args, Parser $parser, PPFrame $frame) {
			global $wgBPMN;
			
			$params = array_merge($wgBPMN, $args);
			$params["class"] = $wgBPMN["class"] .' '. $params["class"];
			$params["id"] = (isset($params["id"]) ? $params["id"] : 'canvas');
      
      $services = MediaWikiServices::getInstance();
      // Get path to "index.php" from server root
      $url = $services->getMainConfig()->get('Script');
      // Get path to the BPMNEditor Special Page
      $url = $url .'/'. $services->getSpecialPageFactory()->getPage('BPMNEditor')->getPageTitle();
      // Add the reference to the current page so the BPMNEditor knows what to load
      $url = $url .'/'. $parser->getTitle()->getNsText() .':'. rawurlencode($parser->getTitle()->getText());
			
			$output = "
<script>
  var diagramXml = '".json_encode($input)."';
</script>
<div id='canvas' style='height: 600px; clear: both; position: relative;'>
  <div class='bpmnwiki-edit'>
    <ul class='bpmnwiki-control-list bpmnwiki-horizontal'>
      <li class='bpmnwiki-control'>
        <button title='Edit diagram'>
          <a href='$url'><span class='icon-bpmnwiki-edit'></span></a>
        </button>
      </li>
    </ul>
  </div>
</div>
";
			return [$output, 'markerType' => 'nowiki'];
		}
	}
?>
