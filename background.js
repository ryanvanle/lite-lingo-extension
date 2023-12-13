
let selectedText = '';
let currentOption = "";

chrome.runtime.onInstalled.addListener(function () {
  chrome.contextMenus.create({
    id: "explainText",
    title: "Explain this text",
    contexts: ["selection"],
  });
  chrome.contextMenus.create({
    id: "selectText",
    title: "Select this annotation",
    contexts: ["selection"],
  });
});

chrome.contextMenus.onClicked.addListener(function (info, tab) {
  if (info.menuItemId === "explainText") {
    selectedText = info.selectionText;
    currentOption = "explain";
    chrome.tabs.sendMessage(tab.id, { action: "highlightText" });
  }
});

let selectedAnnotationText = '';

chrome.contextMenus.onClicked.addListener(function (info, tab) {
  if (info.menuItemId === "selectText") {
    selectedText = info.selectionText;
    // If the popup is open, send the message
    currentOption = "select";
    chrome.runtime.sendMessage({ action: "selectedAnnotation", text: selectedText });
  }
});

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.request === "getSelectedAnnotationText") {
    sendResponse({ text: selectedAnnotationText });
  }
});


chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.request === "getSelectedText") {
    sendResponse({ text: selectedText, option: currentOption });
  }
});
