
console.log('here');

/*
// temp to access from console
function getNodeByXPath(xpath) {
    return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}



IBRIK.xpath = (function() {
    var _MODULE = 'xpath';


    var _public = function() {
        return {
            'foo': foo
        };
    };

    return _public;

})();


IBRIK.highlight = (function() {

})();
*/

jQuery(function() {
    function log(thing) {
        console.log(thing);
    }

    function getDocumentHTML() {
        return $('html')[0].outerHTML;
    }

    function unhighlightAll() {
        $('.__ibrik_tnode_wrap').each(function(index) {
            var text = '';

            $(this).find('.__ibrik_tnode_chunk').each(function() {
                text += $(this).text();
            });

            console.log(text);

            console.log(this.parentNode);

            this.parentNode.replaceChild(document.createTextNode(text), this);
        });
    }

    function redrawHighlighting(xpaths) {
        // TODO: highlighting needs to replace the existing text node with <text node><span><text node> instead of
        // wrapping three spans with a parent span.
        unhighlightAll(); // TODO: unneeded - testing

        var nodes = [];

        for(var i = 0; i < xpaths.length; i++) {
            // TODO: handle xpath lookup failure
            nodes.push(getNodeByXPath(xpaths[i][0]));
        }

        for(var i = 0; i < xpaths.length; i++) {
            var node_def = xpaths[i];
            var node = nodes[i];

            var startOffset = node_def[1][0];
            var endOffset = node_def[1][1];

            var chunks = [0, startOffset, endOffset, node.nodeValue.length];
            var $replacement = $('<span class="__ibrik_tnode __ibrik_tnode_wrap"></span>');

            var j, k;
            for(j=0, k=1; k < chunks.length; j++, k++) {
                if(chunks[j] == chunks[k]) {
                    continue;
                }

                var textValue = node.nodeValue.substring(chunks[j], chunks[k]);
                if(chunks[j] == startOffset && chunks[k] == endOffset) {
                    $('<span class="__ibrik_tnode __ibrik_tnode_chunk __ibrik_tnode_chunk_hl" style="background-color:red;">'+textValue+'</span>').appendTo($replacement);
                } else {
                    $('<span class="__ibrik_tnode __ibrik_tnode_chunk">'+textValue+'</span>').appendTo($replacement);
                }
            }

            node.parentNode.replaceChild($replacement[0], node);
        }
    }

    $('html').mouseup(function() {
        selection = window.getSelection() || document.getSelection();
        //console.log(selection);

        if(selection.type == 'Range' && selection.rangeCount) {
            unhighlightAll();
            range = selection.getRangeAt(0);
            //console.log(range);

            //xpath = getElementXPath(range.endContainer);
            //log(xpath);
            var xpaths = getXPathsForRange(range);
            log(xpaths);

            selection.empty();
            redrawHighlighting(xpaths);
            range.collapse(true);


            //xpathResult = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            //log(xpathResult);
        }
    });

    function getNodeByXPath(xpath) {
        return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    }

    function getXPathsForRange(range) {
        var xpaths = [];

        var commonAncestorChildren = range.commonAncestorContainer.childNodes.length == 0 ?
            [range.commonAncestorContainer] : range.commonAncestorContainer.childNodes;

        (function iter(children) {
            for(var i = 0; i < children.length; i++) {
                var child = children[i];
                if(child.nodeType == Node.TEXT_NODE) {
                    var offsets = getNodeOffsetsInRange(child, range);
                    if(offsets) {
                        xpaths.push([getElementXPath(child), offsets]);
                    }
                }

                if(child.childNodes.length) {
                    iter(child.childNodes);
                }
            }
        })(commonAncestorChildren);

        return xpaths;
    }

    function getNodeOffsetsInRange(node, range) {
        if(range.startContainer == range.endContainer && node == range.startContainer) {
            return [range.startOffset, range.endOffset];
        } else if(node == range.endContainer) {
            return [0, range.endOffset]; // TODO: is Text.length accurate? What happens for Element.length?
        } else if(node == range.startContainer) {
            return [range.startOffset, node.length]; // TODO: is Text.length accurate? What happens for Element.length?
        } else if(range.isPointInRange(node, 0)) {
            return [0, node.length];
        }

        return false;
    }

    function recusivelyBuildXpathsForChildren(parent) {


    }

    /**
     * Gets an XPath for an element which describes its hierarchical location.
     * Courtesy Firebug 1.6 (https://code.google.com/p/fbug/source/browse/branches/firebug1.6/content/firebug/lib.js?spec=svn12950&r=8828#1332)
     */ 
    function getElementXPath(element) {
        if (element && element.id) {
            return '//*[@id="' + element.id + '"]';
        } else {
            return getElementTreeXPath(element);
        }
    }

    /**
     * Gets an XPath for an element which describes its hierarchical location.
     * Courtesy Firebug 1.6 (https://code.google.com/p/fbug/source/browse/branches/firebug1.6/content/firebug/lib.js?spec=svn12950&r=8828#1332);
     * modified to handle text nodes.
     */ 
    function getElementTreeXPath(element) {
        var paths = [];
        // Use nodeName (instead of localName) so namespace prefix is included (if any).
        for (; element && (element.nodeType == Node.ELEMENT_NODE || element.nodeType == Node.TEXT_NODE); element = element.parentNode)
        {
            // Don't include our own markup in the XPath selector
            if(element.classList && element.classList.contains('__ibrik_tnode')) {
                console.log('HERE');
                continue;
            }

            var index = 0; // N-th sibling of same type
            var index = 0; // N-th sibling of any type
            for (var sibling = element.previousSibling; sibling; sibling = sibling.previousSibling)
            {
                // Ignore document type declaration.
                if (sibling.nodeType == Node.DOCUMENT_TYPE_NODE)
                    continue;

                if (sibling.nodeName == element.nodeName)
                    ++index;
            }

            var tagName;
            if(element.nodeType == Node.ELEMENT_NODE) { // Element
                tagName = element.nodeName.toLowerCase();
            } else if(element.nodeType == Node.TEXT_NODE) { // Text
                tagName = 'text()';
            }

            
            //var pathIndex = (index ? "[" + (index+1) + "]" : ""); // TODO: returns 'text()' for first node
            var pathIndex = "[" + (index+1) + "]";
            paths.splice(0, 0, tagName + pathIndex);
        }

        return paths.length ? "/" + paths.join("/") : null;
    }


    // Given a Range object, highlight all text within that range.
    function highlightRange(startNodeXpath, startNodeOffset, endNodeXpath, endNodeOffset) {
        startNodeXpathResult = document.evaluate(startNodeXpath, document, null, XPathResult.ANY_TYPE, null);
        endNodeXpathResult = document.evaluate(endNodeXpath, document, null, XPathResult.ANY_TYPE, null);

        if(!startNodeXpathResult || !endNodeXpathResult) {
            // XPath lookup failure
            return false;
        }

        startNode = startNodeXpathResult.singleNodeValue();
        endNode = endNodeXpathResult.singleNodeValue();

        // Find deepest common ancestor of startNode and endNode
        // ...
    }
});
