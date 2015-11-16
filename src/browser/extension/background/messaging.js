import { onConnect, onMessage, sendToTab } from 'crossmessaging';
import { MENU_DEVTOOLS } from '../../../app/constants/ContextMenus.js';
let connections = {};

function sendNAMessage(port) {
  port.postMessage({
    na: true,
    source: 'redux-page'
  });
}

onConnect(() => ({
  payload: window.store.liftedStore.getState(),
  source: 'redux-page'
}), {}, connections, window.store, sendNAMessage);

// Receive message from content script and relay to the devTools page
function messaging(request, sender) {
  const tabId = sender.tab ? sender.tab.id : sender.id;
  if (tabId) {
    if (request.type === 'PAGE_UNLOADED') {
      if (connections[ tabId ]) sendNAMessage(connections[ tabId ]);
      return true;
    }
    if (request.payload) store.liftedStore.setState(request.payload);
    if (request.init) {
      store.id = tabId;
      if (typeof tabId === 'number') {
        chrome.contextMenus.update(MENU_DEVTOOLS, {documentUrlPatterns: [sender.url], enabled: true});
        chrome.pageAction.show(tabId);
      }
    }
    if (tabId in connections) {
      connections[ tabId ].postMessage(request);
    }
  }
  return true;
}

onMessage(messaging);
chrome.runtime.onMessageExternal.addListener(messaging);

export function toContentScript(action) {
  if (store.id in connections) {
    connections[ store.id ].postMessage({action: action});
  } else {
    sendToTab(store.id, {action: action});
  }
}
