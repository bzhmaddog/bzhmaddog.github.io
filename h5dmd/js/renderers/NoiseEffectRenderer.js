var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { OffscreenBuffer } from "../OffscreenBuffer.js";
import { LayerRenderer } from "./LayerRenderer.js";
class NoiseEffectRenderer extends LayerRenderer {
    /**
     * https://robson.plus/white-noise-image-generator/
     * @param {number} width
     * @param {number} height
     */
    constructor(width, height, duration, images) {
        super("NoiseEffectRenderer", width, height);
        this._nbFrames = images.length;
        this._frameDuration = duration / this._nbFrames;
        this._noises = [];
        if (!Array.isArray(images)) {
            throw new TypeError("An array of images filename is expected as third argument");
        }
        const that = this;
        // Temporary buffer to draw noise image and get data array from it
        this._tmpBuffer = new OffscreenBuffer(width, height, true);
        var promises = images.map(url => fetch(url));
        Promise
            .all(promises)
            .then(responses => Promise.all(responses.map(res => res.blob())))
            .then(blobs => Promise.all(blobs.map(blob => createImageBitmap(blob))))
            .then(bitmaps => Promise.all(bitmaps.map(bitmap => this._getImageData(bitmap))))
            .then(bitmaps => {
            this._noises = bitmaps;
            console.log('Noises images loaded');
        });
    }
    /**
     * Fetch image from server
     * @param {string} src
     * @returns
     */
    _loadNoise(src) {
        return __awaiter(this, void 0, void 0, function* () {
            let response = yield fetch(src);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            else {
                return yield response.blob();
            }
        });
    }
    init() {
        const that = this;
        return new Promise(resolve => {
            navigator.gpu.requestAdapter().then(adapter => {
                that._adapter = adapter;
                adapter.requestDevice().then(device => {
                    that._device = device;
                    that._shaderModule = device.createShaderModule({
                        code: `
                            struct Image {
                                rgba: array<u32>
                            }
                            @group(0) @binding(0) var<storage,read> noisePixels: Image;
                            @group(0) @binding(1) var<storage,read> inputPixels: Image;
                            @group(0) @binding(2) var<storage,read_write> outputPixels: Image;

                            @compute
                            @workgroup_size(1)
                            fn main (@builtin(global_invocation_id) global_id: vec3<u32>) {
                                let index : u32 = global_id.x + global_id.y * ${that._width}u;

                                var pixel : u32 = inputPixels.rgba[index];
                                var noise : u32 = noisePixels.rgba[index];
                                
                                let a : u32 = (pixel >> 24u) & 255u;
                                let r : u32 = (pixel >> 16u) & 255u;
                                let g : u32 = (pixel >> 8u) & 255u;
                                let b : u32 = (pixel & 255u);
                                //pixel = a << 24u | r << 16u | g << 8u | b;
               
                                if ( r > 200u && g > 200u && b > 200u ) {
                                //if ( pixel == 4294967295u ) {

                                    let na : u32 = (noise >> 24u) & 255u;
                                    let nr : u32 = (noise >> 16u) & 255u;
                                    let ng : u32 = (noise >> 8u) & 255u;
                                    let nb : u32 = (noise & 255u);
    
                                    // if finding a dark pixel on the noise buffer for this index
                                    // then alter the current pixel color (white-> blue)
                                    if ( nr < 200u && ng < 200u && nb < 200u) {
                                        pixel = pixel - 10100u;
                                    }
                                }

                                outputPixels.rgba[index] = pixel;
                                //outputPixels.rgba[index] = noise;
                            }
                        `
                    });
                    console.log('ScoreEffectRenderer:init()');
                    if (typeof that._shaderModule.compilationInfo === 'function') {
                        that._shaderModule.compilationInfo().then(i => {
                            if (i.messages.length > 0) {
                                console.warn("ScoreEffectRenderer:compilationInfo() ", i.messages);
                            }
                        });
                    }
                    that.renderFrame = that._doRendering;
                    resolve();
                });
            });
        });
    }
    /**
     * Apply filter to provided ImageData object then return altered data
     * @param {ImageData} frameData
     * @returns {ImageData}
     */
    _doRendering(frameData) {
        const that = this;
        const gpuNoiseBuffer = this._device.createBuffer({
            mappedAtCreation: true,
            size: this._bufferByteLength,
            usage: GPUBufferUsage.STORAGE
        });
        const gpuInputBuffer = this._device.createBuffer({
            mappedAtCreation: true,
            size: this._bufferByteLength,
            usage: GPUBufferUsage.STORAGE
        });
        const gpuTempBuffer = this._device.createBuffer({
            size: this._bufferByteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
        });
        const gpuOutputBuffer = this._device.createBuffer({
            size: this._bufferByteLength,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
        });
        const bindGroupLayout = this._device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "read-only-storage"
                    }
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "read-only-storage"
                    }
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "storage"
                    }
                }
            ]
        });
        const bindGroup = this._device.createBindGroup({
            layout: bindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: gpuNoiseBuffer
                    }
                },
                {
                    binding: 1,
                    resource: {
                        buffer: gpuInputBuffer
                    }
                },
                {
                    binding: 2,
                    resource: {
                        buffer: gpuTempBuffer
                    }
                }
            ]
        });
        const computePipeline = this._device.createComputePipeline({
            layout: this._device.createPipelineLayout({
                bindGroupLayouts: [bindGroupLayout]
            }),
            compute: {
                module: this._shaderModule,
                entryPoint: "main"
            }
        });
        return new Promise(resolve => {
            var now = window.performance.now();
            if (!this._startTime) {
                this._startTime = now;
            }
            var position = now - this._startTime;
            var frameIndex = Math.floor(position / this._frameDuration);
            // Loop back to the first image
            if (frameIndex >= this._nbFrames) {
                this._startTime = null;
                frameIndex = 0;
            }
            new Uint8Array(gpuNoiseBuffer.getMappedRange()).set(new Uint8Array(this._noises[frameIndex]));
            gpuNoiseBuffer.unmap();
            // Put original image data in the input buffer (257x78)
            new Uint8Array(gpuInputBuffer.getMappedRange()).set(new Uint8Array(frameData.data));
            gpuInputBuffer.unmap();
            const commandEncoder = that._device.createCommandEncoder();
            const passEncoder = commandEncoder.beginComputePass();
            passEncoder.setPipeline(computePipeline);
            passEncoder.setBindGroup(0, bindGroup);
            passEncoder.dispatchWorkgroups(that._width, that._height);
            passEncoder.end();
            commandEncoder.copyBufferToBuffer(gpuTempBuffer, 0, gpuOutputBuffer, 0, that._bufferByteLength);
            that._device.queue.submit([commandEncoder.finish()]);
            // Render DMD output
            gpuOutputBuffer.mapAsync(GPUMapMode.READ).then(() => {
                // Grab data from output buffer
                const pixelsBuffer = new Uint8Array(gpuOutputBuffer.getMappedRange());
                // Generate Image data usable by a canvas
                const imageData = new ImageData(new Uint8ClampedArray(pixelsBuffer), that._width, that._height);
                // return to caller
                resolve(imageData);
            });
        });
    }
    /**
     * Draw a bitmap in an offscreen buffer then grab the data
     * @param {ImageBitmap} bitmap
     * @returns Promise<Uint8ClampedArray>
     */
    _getImageData(bitmap) {
        var that = this;
        return new Promise(resolve => {
            that._tmpBuffer.context.drawImage(bitmap, 0, 0);
            resolve(that._tmpBuffer.context.getImageData(0, 0, that._width, that._height).data);
        });
    }
}
export { NoiseEffectRenderer };
//# sourceMappingURL=NoiseEffectRenderer.js.map