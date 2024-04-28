import { BaseLayer, LayerType } from "./BaseLayer.js";
import { Options } from "../Options.js";
var VideoState;
(function (VideoState) {
    VideoState[VideoState["STOPPED"] = 0] = "STOPPED";
    VideoState[VideoState["PAUSED"] = 1] = "PAUSED";
    VideoState[VideoState["PLAYING"] = 2] = "PLAYING";
})(VideoState || (VideoState = {}));
class VideoLayer extends BaseLayer {
    _video;
    _onPlayListener;
    _onPauseListener;
    _onStopListener;
    __renderNextFrame;
    _internalAction;
    _state = VideoState.STOPPED;
    constructor(id, width, height, options, renderers, loadedListener, updatedListener, playListener, pauseListener, stopListener) {
        const layerOptions = new Options({ loop: false, autoplay: false, pauseOnHide: true, stopOnHide: false }).merge(options);
        super(id, LayerType.Video, width, height, layerOptions, renderers, loadedListener, updatedListener);
        this._onPlayListener = playListener;
        this._onPauseListener = pauseListener;
        this._onStopListener = stopListener;
        this.__renderNextFrame = function () { };
        if (this._options.get('stopOnHide') === true) {
            this._options.set('pauseOnHide', false);
        }
        // If layer is hidden at creation but autplay was set to true then hack variable
        // to play the video when the layer is shown
        if (this._options.get('autoplay') === true && this._options.get('visible') === false) {
            this._internalAction = true;
        }
        setTimeout(this._layerLoaded.bind(this), 1);
    }
    _onVideoError(error) {
        console.error(error);
    }
    _onVideoLoaded() {
        this._contentBuffer.context.drawImage(this._video, 0, 0, this._options.get('width'), this._options.get('height'));
        if (this._options.get('autoplay') && this._options.get('visible')) {
            this.play();
        }
        this._layerUpdated();
    }
    _onVideoPlayed() {
        this.__renderNextFrame = this._requestRenderNextFrame;
        this._requestRenderNextFrame();
        if (typeof this._onPlayListener === 'function') {
            this._onPlayListener(this);
        }
    }
    _onVideoPaused() {
        this.__renderNextFrame = function () { console.log('End of video rendering'); };
        this._stopRendering();
        if (typeof this._onPauseListener === 'function') {
            this._onPauseListener(this);
        }
    }
    __renderFrame() {
        this._contentBuffer.clear();
        this._contentBuffer.context.drawImage(this._video, 0, 0, this._options.get('width'), this._options.get('height'));
        this.__renderNextFrame(this);
    }
    _requestRenderNextFrame() {
        requestAnimationFrame(this.__renderFrame.bind(this));
    }
    _play() {
        // If the layer is not visible do not start playing the video to save resources
        if (!this.isVisible) {
            console.error(`Layer[${this.id}] is not visible`);
            return;
        }
        // If video is already playing do nothing
        if (this._state === VideoState.PLAYING) {
            this._logWarning("Video is already beeing played");
            return;
        }
        this._state = VideoState.PLAYING;
        this._internalAction = false;
        this.__renderNextFrame = this._requestRenderNextFrame;
        this._requestRenderNextFrame();
        this._video.play();
        this._startRendering();
    }
    _pause(isInternal = false) {
        if (this._video === undefined) {
            this._logWarning("Video is not set");
            return;
        }
        if (this._state !== VideoState.PLAYING) {
            this._logWarning("Video is not beeing played");
            return;
        }
        this._internalAction = isInternal;
        this._state = VideoState.PAUSED;
        this._video.pause();
        this.__renderNextFrame = function () {
            "End of video rendering";
        };
    }
    _stop(isInternal = false) {
        if (this._video === undefined) {
            this._logWarning("Video is not set");
            return;
        }
        if (this._state !== VideoState.PLAYING) {
            this._logWarning("Video was not beeing played");
        }
        this._internalAction = isInternal;
        this._state = VideoState.STOPPED;
        this._video.pause();
        this._video.currentTime = 0;
        this.__renderNextFrame = function () {
            "End of video rendering";
        };
    }
    /**
     * Override default setVisibility to pause/resume the video if needed
     * @param isVisible boolean
     */
    setVisibility(isVisible) {
        if (isVisible === this.isVisible()) {
            return;
        }
        super.setVisibility(isVisible);
        if (!isVisible && this._state === VideoState.PLAYING && (this._options.get('stopOnHide') || this._options.get('pausepOnHide'))) {
            if (this._options.get('stopOnHide')) {
                this._stop(true);
            }
            else if (this._options.get('pauseOnHide')) {
                this._pause(true);
            }
        }
        if (isVisible && this._state !== VideoState.PLAYING && this._internalAction) {
            this._play();
        }
    }
    /**
     * Load a media in the video element
     */
    setVideo(video) {
        this._video = video;
        this._video.loop = this._options.get('loop');
        this._video.addEventListener('play', this._onVideoPlayed.bind(this));
        this._video.addEventListener('pause', this._onVideoPaused.bind(this));
        // Video is already loaded
        this._onVideoLoaded();
    }
    loadVideo(src) {
        // create a video element (not attached to the dom)
        this._video = document.createElement('video');
        // set the dimensions
        this._video.width = this._options.get('width') || this.width;
        this._video.height = this._options.get('height') || this.height;
        this._video.loop = this._options.get('loop') || false;
        // Bind loaded event of the video to publish an event so the client 
        // can do whatever it want (example: play the video) 
        this._video.addEventListener('play', this._onVideoPlayed.bind(this));
        this._video.addEventListener('pause', this._onVideoPaused.bind(this));
        this._video.addEventListener('loadeddata', this._onVideoLoaded.bind(this));
        this._video.addEventListener('error', this._onVideoError.bind(this));
        this._video.src = src;
    }
    play() {
        this._play();
    }
    pause() {
        this._pause();
    }
    stop() {
        this._stop();
    }
    isPlaying() {
        return this._state === VideoState.PLAYING;
    }
}
export { VideoLayer };
//# sourceMappingURL=VideoLayer.js.map