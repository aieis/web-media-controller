'use strict';

/* global BaseConnector */

chrome.runtime.sendMessage({ command: 'show-page-action' });

class Connector extends BaseConnector {
    constructor(properties) {
        super(properties);
        this.injectScript('vendor/underscore-min.js');
        this.injectScript('content/vk-dom-inject.js');
        this.statusId = 0;

        window.addEventListener('message', (event) => {
            if (event.data.sender !== 'vkpc-player') {
                return;
            }

            const newTrackInfo = _.deepMap(event.data.trackInfo, _.unescape);

            if (newTrackInfo && !_.isEqual(newTrackInfo, this.lastTrackInfo)) {
                this.onNewTrack(newTrackInfo);
            }

            if (['play', 'progress', 'pause', 'stop'].includes(event.data.type)) {
                this.sendMessage({
                    command: event.data.type,
                    argument: event.data.currentTime,
                });
            } else if (event.data.type === 'volume') {
                this.sendMessage({
                    command: event.data.type,
                    argument: event.data.volume,
                });
            }
        });
    }

    onMessage(message, sendResponse) {
        if (message.command === 'reload') {
            this.sendMessage({ command: 'load' });
            this.setProperties(this.properties);
            if (this.trackInfo) {
                this.onNewTrack(this.trackInfo);
            }
        }
        if (message.command === 'get-playback-status') {
            const currentId = this.statusId++;
            window.addEventListener('message', function sendPlaybackStatus(event) {
                if (event.data.sender !== 'vkpc-player') {
                    return;
                }
                if (event.data.type !== 'get-playback-status') {
                    return;
                }
                if (event.data.id === currentId) {
                    window.removeEventListener('message', sendPlaybackStatus);
                    sendResponse(event.data.status);
                }
            });
            window.postMessage(_(message).extendOwn({
                sender: 'vkpc-proxy',
                id: currentId
            }), '*');
            return true;
        }
        window.postMessage(_(message).extendOwn({ sender: 'vkpc-proxy' }), '*');
    }
}

const connector = new Connector({
    'can-control': true,
    'can-go-next': true,
    'can-go-previous': true,
    'can-play': true,
    'can-pause': true,
    'can-seek': true,
});