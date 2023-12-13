chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {

});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "highlightText") {
        highlightSelectedText();
    }
    if (request.action === "highlightText" && request.text) {
        highlightTextInDocument(request.text);
    }
    if (request.action === "selectAnnotationText") {
        console.log(request.text);
    }
});

function highlightTextInDocument(text) {

    let body = document.body;
    let instance = new Mark(body);
    let settings = {
      "element": "span",
      "className": "lite-lingo-selected",
      "accuracy": "exactly",
      "separateWordSearch": false,
      "acrossElements": true,
    }

    instance.mark(text, settings);
    updateAria();


    // const textNodes = findTextNodes(document.body, text);
    // textNodes.forEach(node => {
    //     const range = document.createRange();
    //     range.selectNodeContents(node);

    //     const span = document.createElement('span');
    //     span.style.backgroundColor = 'yellow';
    //     span.style.color = 'black';
    //     range.surroundContents(span);

    //     range.detach();
    // });
}

function findTextNodes(node, searchText) {
    let nodes = [];
    const walker = document.createTreeWalker(
        node,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );

    let currentNode;
    while (currentNode = walker.nextNode()) {
        if (currentNode.nodeValue.includes(searchText)) {
            nodes.push(currentNode);
        }
    }
    return nodes;
}

function highlightSelectedText(annotations) {

    const selection = window.getSelection();
    // console.log(selection);

    let text = selection.toString();
    let body = document.body;
    let instance = new Mark(body);
    let settings = {
      "element": "span",
      "className": "lite-lingo-selected",
      "accuracy": "exactly",
      "separateWordSearch": false,
      "acrossElements": true,
    }

    instance.mark(text, settings);
    updateAria();

}

window.addEventListener("load", init);

async function init() {
  let currentURL = window.location.href;
  let annotations = await getURLAnnotations(currentURL);

  let originalTextSet = new Set();

  for (let annotation of annotations) {
    originalTextSet.add(annotation.originaltext);
  }

  let body = document.body;
  let instance = new Mark(body);
  let settings = {
    "element": "span",
    "className": "lite-lingo-selected",
    "accuracy": "complementary",
    "separateWordSearch": false,
    "acrossElements": true,
  }


  for (let originalText of originalTextSet) {
    // console.log(originalText);
    instance.mark(originalText, settings);
    // highlightTextInDocument(originalText);
  }

  updateAria();
}

function updateAria() {
    let allMarks = document.querySelectorAll(".lite-lingo-selected");

    console.log(allMarks);
    for (let mark of allMarks) {
        mark.setAttribute("aria-label", "Highlighted Lite Lingo Annotation");
    }
}

async function getURLAnnotations(currentURL) {
    let query = `http://localhost:3000/annotations?url=${encodeURIComponent(currentURL)}`
    let result = await fetch(query)
        .then(statusCheck)
        .then(resp => resp.json());
    return result;
}

/**
 * Return the response's result text if successful, otherwise
 * returns the rejected Promise result with an error status and corresponding text
 * @param {object} response - response to check for success/error
 * @return {object} - valid response if response was successful, otherwise rejected
 *                    Promise result
 */
async function statusCheck(response) {
    if (!response.ok) {
        throw new Error(await response.text());
    }
    return response;
}
// document.addEventListener('DOMContentLoaded', async function() {
//     let currentURL = window.location.href;
//     console.log("hi")
//     console.log(currentURL);
// });
