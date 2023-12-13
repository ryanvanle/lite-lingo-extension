window.addEventListener('load', init)

let tab;

// chrome.runtime.sendMessage({ request: "getSelectedAnnotationText" }, function(response) {
//   if (response && response.text) {
//     console.log("Selected annotation text:", response.text);
//   }
// });

async function init() {
  addEventlistenerToDisclaimer();
  addEventListenerToViewDisclaimer();
  addEventListenerToAllTrans();
  addEventListenerToEditPlain();
  addEventListenerToAllTransBackBtn();
  addEventListenerToEditBackBtn();
}

document.addEventListener('DOMContentLoaded', async function() {
  tab = await getCurrentTab();
  // highlightAnnotationsOnPage();
  // let annotations = await getCurrentTabAnnotations(tab);
  // console.log(annotations);
  // highlightBasedOnAnnotations(annotations);

  addEventlistenerToDisclaimer();
  addEventListenerToViewDisclaimer();
  addEventListenerToAllTrans();
  addEventListenerToEditPlain();
  addEventListenerToAllTransBackBtn();
  addEventListenerToEditBackBtn();
  addEventListenerToAllTransBackBtn2();

  id("edit-plain-btn").disabled = true;
  chrome.runtime.sendMessage({ request: "getSelectedText" }, async function(response) {
    if (response && response.option == "explain") {
      if (response && response.text) {
        id("edit-plain-btn").disabled = false;
        displayOriginalText(response.text);

        // addLoadingScreen();

        let container = id("translated-text");
        container.innerHTML = "";
        let loader = gen("div");
        loader.classList.add("loader-text");
        container.append(loader);

        let explanation = await fetchExplanation(response.text);

        qs(".loader-text").remove();
        // removeLoadingScreen();

        if (explanation[0] != null) {
          console.log(explanation);
          displayMessage(explanation[0]);
          addResponseToDatabase(tab, response.text, explanation[0], true);
        } else {
          displayMessage(explanation[1]);
        }
      } else {
        id("edit-plain-btn").disabled = true;
        displayMessage('No text selected.');
      }

    } else if (response && response.option == "select") {

      if (response && response.text) {
        let annotations = await getCurrentTabAnnotations(tab);
        let inputText = response.text;

        let result = containsOriginalText(annotations, inputText);
        console.log("result", result);
        if (result[0]) {
          let allScreens = qsa("body > section");
          for (let screen of allScreens) {
            console.log(screen);
            if (screen.id === "all-translation-menu-screen-2") {
              screen.classList.remove("hidden");
            } else {
              screen.classList.add("hidden");
            }
          }
          displayAnnotations(result[1], annotations);
        }
      }

    }
  });

});

function containsOriginalText(annotations, inputText) {
  for (let annotation of annotations) {
    let originalText = annotation.originaltext;
    if (originalText.includes(inputText) && (20 >= Math.abs(originalText.length - inputText.length))) return [true, annotation.originaltext];
  }
  return [false, null];
};

async function highlightAnnotationsOnPage() {
  const annotations = await getCurrentTabAnnotations(tab);
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      annotations.forEach(annotation => {
          chrome.tabs.sendMessage(tabs[0].id, {
              action: "highlightText",
              text: annotation.originaltext
          });
      });
  });
}

function addLoadingScreen() {
  id("translated-text").innerHTML = "";
  id("loading-container").classList.add("loading");
}

function removeLoadingScreen() {
  id("loading-container").classList.remove("loading");
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function addEventlistenerToDisclaimer() {
  document.querySelector('#disclaimer-continue').addEventListener('click', () => {
    const disclaimer =  document.querySelector('#disclaimer-screen');
    const mainScreen = document.querySelector('#main-screen');
    disclaimer.classList.add('hidden');
    mainScreen.classList.remove('hidden');
  });
}

function addEventListenerToViewDisclaimer() {
  document.querySelector('#show-disclaimer-btn').addEventListener('click', () => {
    const mainScreen = document.querySelector('#main-screen');
    const disclaimer =  document.querySelector('#disclaimer-screen');
    mainScreen.classList.add('hidden');
    disclaimer.classList.remove('hidden');
  });
}

function addEventListenerToAllTrans() {
  document.querySelector('#all-trans-btn').addEventListener('click', () => {
    const mainScreen = document.querySelector('#main-screen');
    const allTrans =  document.querySelector('#all-translation-menu-screen');
    mainScreen.classList.add('hidden');
    allTrans.classList.remove('hidden');
    generateViewTranslations(tab);
  });
}

function addEventListenerToAllTransBackBtn() {
  document.querySelector('#all-trans-go-back-btn').addEventListener('click', () => {
    const mainScreen = document.querySelector('#main-screen');
    const allTrans =  document.querySelector('#all-translation-menu-screen');
    mainScreen.classList.remove('hidden');
    allTrans.classList.add('hidden');
  });
}

function addEventListenerToAllTransBackBtn2() {
  document.querySelector('#all-trans-2-go-back-btn').addEventListener('click', () => {
    // const mainScreen = document.querySelector('#main-screen');
    const allTrans =  document.querySelector('#all-translation-menu-screen');
    const allTrans2 =  document.querySelector('#all-translation-menu-screen-2');
    allTrans.classList.remove('hidden');
    allTrans2.classList.add('hidden');
  });
}

function addEventListenerToEditPlain() {
  document.querySelector('#edit-plain-btn').addEventListener('click', () => {
    const mainScreen = document.querySelector('#main-screen');
    const editScreen =  document.querySelector('#edit-screen');
    let originalText = id("original-text").textContent;
    let translatedText = displayToOriginalFormat(id("translated-text").innerHTML);
    id("edit-original-text").textContent = originalText;
    id("edit-text").value = translatedText;
    mainScreen.classList.add('hidden');
    editScreen.classList.remove('hidden');

    displayEditScreen(originalText, translatedText)
  });
}

function addEventListenerToEditBackBtn() {
  document.querySelector('#edit-go-back-btn').addEventListener('click', () => {
    const allTrans2 =  document.querySelector('#all-translation-menu-screen-2');
    const editscreen =  document.querySelector('#edit-screen');
    allTrans2.classList.remove('hidden');
    editscreen.classList.add('hidden');
  });
}

function displayOriginalText(text) {
  document.getElementById('original-text').textContent = text;
}

async function fetchExplanation(text) {
  try {
    let response = await fetch('http://localhost:3000/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text })
    }).then(statusCheck)
    .then(function (resp) {return resp.text()})
    .catch(function (error) {console.log(error);});


    let i = 0;
    let maxIterations = 2;

    while (response.length == 0 && i < maxIterations) {
      response = await fetch('http://localhost:3000/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text })
      }).then(statusCheck)
      .then(function (resp) {return resp.text()})
      .catch(function (error) {console.log(error);});
      i++;
    }

    return [response, null];
  } catch (error) {
    console.error('Error:', error);
    return [null, 'Failed to fetch explanation. Server responded with an error.'];
  }
}

async function addResponseToDatabase(tab, originalText, translatedText, isAi) {

  let currentUrl = tab.url;

  let aiToValue = 0;
  if (isAi) aiToValue = 1;

  let params = {
    "url": currentUrl,
    "originalText": originalText,
    "annotation": translatedText,
    "ai": aiToValue
  }

  await fetch('http://localhost:3000/annotations/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  })
  .then(statusCheck)
  .then(function () {
    console.log("success");
  })
  .catch(function(error) {
    console.error(error);
  });
}

async function getCurrentTabAnnotations(tab) {
  let currentURL = tab.url;

  console.log(currentURL);
  let queryURL = `http://localhost:3000/annotations?url=${encodeURIComponent(currentURL)}`
  let result = await fetch(queryURL)
    .then(statusCheck)
    .then(resp => resp.json())
    .catch(function (error) {
      console.log(error)
    });
  return result;
}

async function getCurrentTab() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  // `tab` will either be a `tabs.Tab` instance or `undefined`.
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

function createExplanationSection(translation, section) {
  let childCount = 0;

  if (section) {
    childCount = section.children.length;
  }

  var section = document.createElement('section');
  section.className = 'translation-menu-card';

  var paragraph1 = document.createElement('p');
  paragraph1.textContent = childCount + 1;

  var paragraph2 = document.createElement('p');
  paragraph2.textContent = translation;

  section.appendChild(paragraph1);
  section.appendChild(paragraph2);
  section.setAttribute('aria-label', 'menuItem');
  return section;
}

async function generateViewTranslations(tab) {
  let container = qs('.translation-menu-container');
  container.innerHTML = "";

  let loader = gen("div");
  loader.classList.add("loader-translation");
  container.append(loader);
  let annotations = await getCurrentTabAnnotations(tab);

  let originalTextSet = new Set();

  annotations.sort(function (a, b) {
    return a.ai - b.ai;
  });


  qs(".loader-translation").remove();

  if (annotations.length == 0) {
    let p = gen("p");
    p.textContent = "No annotations found on the page!";
    p.id = "zero-results";
    container.append(p);
  }

  for (let annotation of annotations) {
    if (originalTextSet.has(annotation.originaltext)) continue;
    let card = createExplanationSection(annotation.originaltext, container);
    card.addEventListener("click", function() {
      displayAnnotations(annotation.originaltext, annotations);
    });
    container.append(card);
    originalTextSet.add(annotation.originaltext);
  }
}

function displayAnnotations(originalText, annotations) {

  console.log(originalText, annotations)
  const allTrans =  document.querySelector('#all-translation-menu-screen');
  const allTrans2 =  document.querySelector('#all-translation-menu-screen-2');
  allTrans.classList.add('hidden');
  allTrans2.classList.remove('hidden');

  let container = qs(".translation-menu-container-2");
  container.innerHTML = "";

  let translations = [];

  let pTag = qs("#original-text-bubble section p");
  if (originalText.length > 100) {
    pTag.style["padding-top"] = "1rem";

  } if (originalText.length > 50) {
    pTag.style["padding-top"] = "0.75rem";
  } else {
    pTag.style["padding-top"] = "0";

  }
  pTag.textContent = originalText;

  for (let currentAnnotation of annotations) {
    if (currentAnnotation.originaltext == originalText) {
      let obj = {
        originalText: currentAnnotation.originaltext,
        annotation: currentAnnotation.annotation
      }
      translations.push(obj);
    }
  }

  for (let translation of translations) {
    let card = createExplanationSection(translation.annotation, container);
    card.addEventListener("click", function () {
      displayEditScreen(translation.originalText, translation.annotation);
    });
    container.append(card);
  }
}

function displayEditScreen(originalText, editText) {
  const allTrans2 =  document.querySelector('#all-translation-menu-screen-2');
  const editScreen = document.querySelector('#edit-screen');
  allTrans2.classList.add('hidden');
  editScreen.classList.remove('hidden');

  id("edit-original-text").textContent = originalText;
  id("edit-text").value = editText;
  let revert = id("revert");
  clearAllEventListeners(revert);
  let submit = id("submit");
  clearAllEventListeners(submit);


  id("revert").addEventListener("click", function() {
    id("edit-text").value = editText;
  });

  id("submit").addEventListener("click", function() {
    submitEdit(originalText, id("edit-text"));
  });
}

async function submitEdit(originalText, container) {
  let newAnnotation = container.value;
  let isAi = 0;
  let queryURL = `http://localhost:3000/annotations/add`

  let params = {
    "url": tab.url,
    "annotation": newAnnotation,
    "originalText": originalText,
    "ai": isAi
  }

  await fetch(queryURL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  })
  .then(statusCheck)
  .then(function () {
    switchBackToMain(originalText, newAnnotation);
  })
  .catch(function(error) {
    console.error(error);
  });
}

function switchBackToMain(originalText, newAnnotation) {
  const edit = document.querySelector('#edit-screen');
  const mainScreen = document.querySelector('#main-screen');

  id("original-text").textContent = originalText;
  id("translated-text").innerHTML = originalToDisplayFormat(newAnnotation);

  edit.classList.add('hidden');
  mainScreen.classList.remove('hidden');
}

function displayExplanation(aiText) {
  document.getElementById('translated-text').innerHTML = originalToDisplayFormat(aiText);
}

function displayMessage(message) {
  document.getElementById('translated-text').innerHTML = originalToDisplayFormat(message);
}

 /**
   * Clears all the event listeners for the element given.
   * @param {HTMLElement} element - any HTMLElement
   */
function clearAllEventListeners(element) {
  let oldElement = element
  let newElement = oldElement.cloneNode(true);
  oldElement.parentNode.replaceChild(newElement, oldElement);
}

function displayToOriginalFormat(text) {
  let copyText = text;
  let result = copyText.replaceAll("<br>", "\n");
  return result;
}

function originalToDisplayFormat(text) {
  let copyText = text;
  let result = copyText.replaceAll(/(\r\n|\r|\n)/g, "<br>");
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

  /** ------------------------------ Helper Functions  ------------------------------ */
  /**
 * Note: You may use these in your code, but remember that your code should not have
 * unused functions. Remove this comment in your own code.
 */

  /**
 * Returns the element that has the ID attribute with the specified value.
 * @param {string} idName - element ID
 * @returns {object} DOM object associated with id.
 */
  function id(idName) {
    return document.getElementById(idName);
  }

  /**
 * Returns the first element that matches the given CSS selector.
 * @param {string} selector - CSS query selector.
 * @returns {object} The first DOM object matching the query.
 */
  function qs(selector) {
    return document.querySelector(selector);
  }

  /**
 * Returns the array of elements that match the given CSS selector.
 * @param {string} selector - CSS query selector
 * @returns {object[]} array of DOM objects matching the query.
 */
  function qsa(selector) {
    return document.querySelectorAll(selector);
  }

  /**
 * Returns a new element with the given tag name.
 * @param {string} tagName - HTML tag name for new DOM element.
 * @returns {object} New DOM object for given HTML tag.
 */
  function gen(tagName) {
    return document.createElement(tagName);
  }

  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === "selectedAnnotation") {
      console.log("Selected annotation text:", message.text);
    }
  });