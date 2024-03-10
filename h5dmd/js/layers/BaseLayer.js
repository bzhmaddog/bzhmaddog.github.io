import { OffscreenBuffer } from "../OffscreenBuffer.js";
import { Options } from "../Options.js";
import { ChangeAlphaRenderer } from "../renderers/ChangeAlphaRenderer.js";
var LayerType;
(function (LayerType) {
    LayerType[LayerType["Image"] = 0] = "Image";
    LayerType[LayerType["Canvas"] = 1] = "Canvas";
    LayerType[LayerType["Text"] = 2] = "Text";
    LayerType[LayerType["Video"] = 3] = "Video";
    LayerType[LayerType["Animation"] = 4] = "Animation";
    LayerType[LayerType["Sprites"] = 5] = "Sprites";
})(LayerType || (LayerType = {}));
class BaseLayer {
    _contentBuffer;
    _options;
    _id;
    _loaded = false;
    _outputBuffer;
    _layerType;
    _renderNextFrame;
    _loadedListener;
    _updatedListener;
    _availableRenderers;
    _defaultRenderQueue;
    _renderQueue;
    constructor(id, layerType, width, height, options, renderers, loadedListener, updatedListener) {
        this._layerType = layerType;
        this._id = id;
        this._contentBuffer = new OffscreenBuffer(width, height, true);
        this._outputBuffer = new OffscreenBuffer(width, height);
        this._loadedListener = loadedListener;
        this._updatedListener = updatedListener;
        this._defaultRenderQueue = [];
        this._renderQueue = [];
        this._availableRenderers = Object.assign({
            'opacity': new ChangeAlphaRenderer(width, height)
        }, renderers);
        this._options = new Options({ visible: true, groups: ['default'], opacity: 1, renderers: [] });
        Object.assign(this._options, options);
        this._renderNextFrame = function () { console.log(`Layer [${this._id}] : Rendering ended`); };
        let rendererPromises = [];
        // Build array of promises
        Object.keys(this._availableRenderers).forEach(id => {
            rendererPromises.push(this._availableRenderers[id].init());
        });
        Promise.all(rendererPromises).then(() => {
            console.log(`Layer[${id}] : Renderers init done`);
        });
        //console.log(`${id} : available renderers =>`, this._availableRenderers)
        //console.log(`${id} :`, this._options.get('renderers', []))
        if (this._options.get('renderers').length > 0) {
            // Build default render queue to save some time in renderFrame
            // Since this should not change after creation
            for (var i = 0; i < this._options.get('renderers').length; i++) {
                const r = this._options.get('renderers')[i];
                if (typeof this._availableRenderers[r] !== 'undefined') {
                    this._defaultRenderQueue.push({
                        id: r,
                        instance: this._availableRenderers[r]
                    });
                }
                else {
                    console.log(`Renderer "${r}" is not in the list of available renderers`);
                }
            }
            //console.log(`${id} :`, this._defaultRenderQueue)
        }
    }
    /**
     * Request rendering of layer frame
     */
    _requestAnimationFrame() {
        requestAnimationFrame(this._renderFrame.bind(this));
    }
    /**
     * Start rendering process
     */
    _renderFrame() {
        const that = this;
        // clone renderers array
        this._renderQueue = [...this._defaultRenderQueue] || [];
        // If opacity is below 1 add opacity renderer
        if (this._options.get('opacity') < 1) {
            this._renderQueue.push({
                id: 'opacity',
                instance: this._availableRenderers['opacity'],
                params: new Options({ opacity: parseFloat(this._options.get('opacity')) })
            });
        }
        // Get initial data from layer content
        var frameImageData = this._contentBuffer.context.getImageData(0, 0, this._outputBuffer.width, this._outputBuffer.height);
        // start renderers queue processing
        this._processRenderQueue(frameImageData);
    }
    /**
     * Process image data provided through current renderer in queue and call it self recursively until no more renderer in queue
     * @param {ImageData} frameImageData
     * @returns {ImageData} result data of the renderer
     */
    _processRenderQueue(frameImageData) {
        var that = this;
        // if there is a renderer in the queue then run render pass with this renderer
        if (this._renderQueue.length) {
            var renderer = this._renderQueue.shift(); // pop renderer from render queue
            //console.log(`${this.id} `, renderer)
            // Apply 'filter' to provided content with current renderer then process next renderer in queue
            renderer.instance.renderFrame(frameImageData, renderer.params).then((outputData) => {
                that._processRenderQueue(outputData);
            });
            // no more renderer in queue then draw final image and start queue process again	
        }
        else {
            // Erase current output buffer content
            that._outputBuffer.clear();
            // Put final frame data into output buffer and start process again (if needed)
            createImageBitmap(frameImageData).then(bitmap => {
                // Put final layer data in the output buffer
                that._outputBuffer.context.drawImage(bitmap, 0, 0);
                // request next frame rendering
                that._renderNextFrame();
            });
        }
    }
    /**
     * Layer is loaded : Start rendering and call the callback if needed
     * @param {boolean} startRenderingLoop
     */
    _layerLoaded(startRenderingLoop = false) {
        var that = this;
        this._loaded = true;
        console.log(`Layer [${this._id}] : Loaded`);
        // If no renderer in the queue then just render the frame data once
        if (this._defaultRenderQueue.length === 0 && this._options.get('opacity') === 1) {
            // Put content data in output buffer
            var frameImageData = this._contentBuffer.context.getImageData(0, 0, this._outputBuffer.width, this._outputBuffer.height);
            this._outputBuffer.clear();
            createImageBitmap(frameImageData).then(bitmap => {
                that._outputBuffer.context.drawImage(bitmap, 0, 0);
            });
        }
        // start rendering visible layers which have renderers
        if (this.isVisible() && (this.haveRenderer() || !!startRenderingLoop)) {
            this._renderNextFrame = this._requestAnimationFrame;
            this._requestAnimationFrame();
        }
        // Call callback if there is one
        if (typeof this._loadedListener === 'function') {
            this._loadedListener(this);
        }
    }
    /**
     * Enable/Disable antialiasing
     * TODO : Fix not working as expected
     * @param {boolean} enabled
     */
    _setAntialiasing(enabled) {
        this._outputBuffer.context.imageSmoothingEnabled = enabled;
    }
    /**
     * Return requested renderer instance
     * @param {string} id
     * @returns object
     */
    _getRendererInstance(id) {
        if (typeof this._availableRenderers[id] !== 'undefined') {
            return this._availableRenderers[id];
        }
        else {
            throw new Error("This renderer is not available");
        }
    }
    _logDebug(msg) {
        console.log(`Layer[${this.id}] : ` + msg);
    }
    _logWarning(msg) {
        console.warn(`Layer[${this.id}] : ` + msg);
    }
    _logError(msg) {
        console.error(`Layer[${this.id}] : ` + msg);
    }
    /**
     * Layer was updated
     */
    _layerUpdated() {
        console.log(`Layer [${this._id}] : Updated => ${this.haveRenderer()}`);
        // Re-render frame if needed
        if (!this.haveRenderer()) {
            this._renderFrame();
        }
        // Callback parent if available
        if (typeof this._updatedListener === 'function') {
            this._updatedListener(this);
        }
    }
    /**
     * Stop rendering of the layer
     */
    _stopRendering() {
        this._renderNextFrame = function () { console.log(`Rendering stopped : ${this._id}`); };
    }
    /**
     * Start rendering of the layer
     */
    _startRendering() {
        console.log(`Layer [${this._id}] : Start rendering`);
        this._renderNextFrame = this._requestAnimationFrame;
        this._requestAnimationFrame();
    }
    /**
     * Return if the layer have renderer in the queue
     * @returns boolean
     */
    haveRenderer() {
        return this._defaultRenderQueue.length > 0;
    }
    setVisibility(isVisible) {
        if (isVisible === this.isVisible()) {
            return;
        }
        this._options.set('visible', isVisible);
        // If layer become visible and have renderers then start the rendering loop
        if (isVisible && this.haveRenderer()) {
            this._renderNextFrame = this._requestAnimationFrame;
            this._requestAnimationFrame();
            // Otherwise stop the rendering loop
        }
        else {
            this._renderNextFrame = function () { console.log('End of rendering :' + this._id); };
        }
    }
    /* Toggle layer visibility and return the new state
    * @returns boolean
    */
    toggleVisibility() {
        const v = this._options.get('visible');
        this.setVisibility(!v);
        return !v;
    }
    isVisible() {
        return this._options.get('visible');
    }
    isLoaded() {
        return this._loaded;
    }
    destroy() {
        this._renderNextFrame = function () { console.log(`Destroying layer : ${this._id}`); };
    }
    get id() {
        return this._id;
    }
    /**
     * Get layer width
     */
    get width() {
        return this._outputBuffer.width;
    }
    /**
     * Get layer height
     */
    get height() {
        return this._outputBuffer.height;
    }
    /**
     * Get output canvas
     */
    get canvas() {
        return this._outputBuffer.canvas;
    }
    get layerType() {
        return this._layerType;
    }
    get groups() {
        return this._options.get('groups', ['default']);
    }
    get options() {
        return this._options;
    }
}
export { BaseLayer, LayerType };
//# sourceMappingURL=BaseLayer.js.map