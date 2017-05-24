'use strict';

function sendToConnector(propertyNames) {
    window.postMessage(({ sender: 'wmc-page-notifier', propertyNames }), '*');
}

function addConnectorListener(command, callback, { oneShot = false } = {}) {
    function listener({ data }) {
        if (data.sender !== 'wmc-connector-command') return;
        if (data.command !== command) return;
        if (oneShot) {
            window.removeEventListener('message', listener);
        }
        callback(data.argument);
    }
    window.addEventListener('message', listener);
}

function listenCommands(commands) {
    for (let [command, callback] of commands) {
        addConnectorListener(command, callback);
    }
}

function addGetter(property, func) {
    function sendResponse({data}) {
        if (data.sender   !== 'wmc-connector-getter' ||
            data.property !== property               )
        {
            return;
        }
        Promise.resolve(func())
            .then(value => {
                window.postMessage({
                    sender: 'wmc-page-getter',
                    property: data.property,
                    id: data.id,
                    response: value,
                }, '*');
            });
    }
    window.addEventListener('message', sendResponse);
}