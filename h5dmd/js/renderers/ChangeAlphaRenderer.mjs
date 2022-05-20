class ChangeAlphaRenderer {

    #adapter;
    #device;
    #width;
    #height;
    #shaderModule;
    #bufferByteLength;
    renderFrame;

    /**
     * @param {*} _width 
     * @param {*} _height 
     */

    constructor(_width, _height) {
        this.#device;
        this.#adapter;
        this.#shaderModule;
        this.#width = _width;
        this.#height = _height;
        this.#bufferByteLength = _width * _height * 4;
        this.renderFrame = this.#doNothing;
    }

    init() {
        const that = this;

        return new Promise(resolve => {

            navigator.gpu.requestAdapter().then( adapter => {
                that.#adapter = adapter;
            
                adapter.requestDevice().then( device => {
                    that.#device = device;

                    that.#shaderModule = device.createShaderModule({
                        code: `
                            [[block]] struct UBO {
                                opacity: f32;
                            };
                            [[block]] struct Image {
                                rgba: array<u32>;
                            };

                            fn f2u(f: f32) -> u32 {
                                return u32(ceil(f));
                            }

                            [[group(0), binding(0)]] var<storage,read> inputPixels: Image;
                            [[group(0), binding(1)]] var<storage,write> outputPixels: Image;
                            [[group(0), binding(2)]] var<uniform> uniforms : UBO;                            
                            [[stage(compute), workgroup_size(1)]]
                            fn main ([[builtin(global_invocation_id)]] global_id: vec3<u32>) {
                                let index : u32 = global_id.x + global_id.y * ${that.#width}u;
                                let pixelColor : u32 = inputPixels.rgba[index];
                                let opacity : f32 = uniforms.opacity;

                                
                                var a : u32 = (pixelColor >> 24u) & 255u;
                                let b : u32 = (pixelColor >> 16u) & 255u;
                                let g : u32 = (pixelColor >> 8u) & 255u;
                                let r : u32 = (pixelColor & 255u);

                                var aa = f2u(floor(f32(a) * opacity));

                                // Hack : Todo find why floor not working (0 * anything) should give 0
                                if (opacity == 0f) {
                                    aa = 0u;
                                }
               
                                outputPixels.rgba[index] = aa << 24u | b << 16u | g << 8u | r;
                            }
                        `
                    });

                    console.log('ChangeAlphaRenderer:init()');

                    that.#shaderModule.compilationInfo().then(i => {

                        if (i.messages.length > 0 ) {
                            console.warn("ChangeAlphaRenderer:compilationInfo() ", i.messages);
                        }
                    });

                    that.renderFrame = that.#doRendering;
                    resolve();
                });    
            });
       });
    
    }

    /**
     * Do nothing (place holder until init is done to prevent having to have a if() in #doRendering)
     * @param {ImageData} frameData 
     * @returns {ImageData}
     */
    #doNothing(frameData) {
        console.log("Init not done cannot apply filter");
        return new Promise(resolve =>{
            resolve(frameData);
        });        
    }

    /**
     * Apply filter to provided data then return altered data
     * @param {ImageData} frameData 
     * @param {float} opacity 
     * @returns {ImageData}
     */
    #doRendering(frameData, opacity) {

        var o = opacity || 1;

        const that = this;

        const UBOBuffer = this.#device.createBuffer({
            size: 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const gpuInputBuffer = this.#device.createBuffer({
            mappedAtCreation: true,
            size: this.#bufferByteLength,
            usage: GPUBufferUsage.STORAGE
        });
    
        const gpuTempBuffer = this.#device.createBuffer({
            size: this.#bufferByteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
        });
    
        const gpuOutputBuffer = this.#device.createBuffer({
            size: this.#bufferByteLength,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
        });
    
        const bindGroupLayout = this.#device.createBindGroupLayout({
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
                        type: "storage"
                    }
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                      type: "uniform",
                    }
                }
            ]
        });
    
        const bindGroup = this.#device.createBindGroup({
            layout: bindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: gpuInputBuffer
                    }
                },
                {
                    binding: 1,
                    resource: {
                        buffer: gpuTempBuffer
                    }
                },
                {
                    binding: 2, 
                    resource: {
                      buffer: UBOBuffer
                    }
                }
            ]
        });

        const computePipeline =this.#device.createComputePipeline({
            layout: this.#device.createPipelineLayout({
                bindGroupLayouts: [bindGroupLayout]
            }),
            compute: {
                module: this.#shaderModule,
                entryPoint: "main"
            }
        });        


        return new Promise( resolve => {

            // Put original image data in the input buffer (257x78)
            new Uint8Array(gpuInputBuffer.getMappedRange()).set(new Uint8Array(frameData));
            gpuInputBuffer.unmap();

            // Write values to uniform buffer object
            const uniformData = [o];
            const uniformTypedArray = new Float32Array(uniformData);

            this.#device.queue.writeBuffer(UBOBuffer, 0, uniformTypedArray.buffer);            
    
            const commandEncoder = that.#device.createCommandEncoder();
            const passEncoder = commandEncoder.beginComputePass();

            passEncoder.setPipeline(computePipeline);
            passEncoder.setBindGroup(0, bindGroup);
            passEncoder.dispatchWorkgroups(that.#width, that.#height);
            passEncoder.end();

            commandEncoder.copyBufferToBuffer(gpuTempBuffer, 0, gpuOutputBuffer, 0, that.#bufferByteLength);
    
            that.#device.queue.submit([commandEncoder.finish()]);
    
            // Render DMD output
            gpuOutputBuffer.mapAsync(GPUMapMode.READ).then( () => {
    
                // Grab data from output buffer
                const pixelsBuffer = new Uint8Array(gpuOutputBuffer.getMappedRange());

                // Generate Image data usable by a canvas
                const imageData = new ImageData(new Uint8ClampedArray(pixelsBuffer), that.#width, that.#height);

                // return to caller
                resolve(imageData);
            });
        });
	}
}

export { ChangeAlphaRenderer }