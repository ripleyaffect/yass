import { GPUState, SimulationConfig, VariantConfig } from '~/components/gpu/types';

import slimeComputeShader from '../shaders/slime-compute.wgsl';

import { ComputePass } from './pass';
import { PingPongTexture } from '~/components/gpu/util';

type PassInput = {
  agentData: Float32Array,
  pingPongTex: PingPongTexture,
  config: SimulationConfig,
};

type PassOutput = {
  agentData: Float32Array,
  pingPongTex: PingPongTexture,
};

export class SlimeComputePass extends ComputePass<PassInput, PassOutput> {
  async run(input: PassInput) {
    const { device } = this.state;

    const { pingPongTex, config } = input;

    const textures = pingPongTex.getInOut();

    const pipeline = this.createPipeline();

    // The size of the buffer is the number of agents * 4 bytes
    const bufferSize = input.agentData.length * 4;
    // Present in module.table.exports[0].func.attrs[1] as `workgroup_size(\d+)`

    const workgroupSize = 64;

    const agentBuffers = this.createAgentBuffers(bufferSize);

    const configBuffer = device.createBuffer({
      size: 4 * 6 * 4, // 6 vec4<f32>, each with 3 floats and an extra 4 bytes for alignment
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const configData = new Float32Array([
      config.variantA.speed,
      config.variantB.speed,
      config.variantC.speed,
      0,
      config.variantA.sampleDistance,
      config.variantB.sampleDistance,
      config.variantC.sampleDistance,
      0,
      config.variantA.sampleAngle,
      config.variantB.sampleAngle,
      config.variantC.sampleAngle,
      0,
      // A Interactions
      config.variantA.interactions.a,
      config.variantB.interactions.a,
      config.variantC.interactions.a,
      0,
      // B Interactions
      config.variantA.interactions.b,
      config.variantB.interactions.b,
      config.variantC.interactions.b,
      0,
      // C Interactions
      config.variantA.interactions.c,
      config.variantB.interactions.c,
      config.variantC.interactions.c,
      0,
    ]);
    device.queue.writeBuffer(
      configBuffer,
      0,
      configData.buffer,
      configData.byteOffset,
      configData.byteLength
    );

    // Create a command encoder to encode the commands for the GPU
    const commandEncoder = device.createCommandEncoder();

    // Create a bind group for the agents buffer
    const bindGroup = this.createBindGroup(
      pipeline,
      agentBuffers.work,
      textures.input,
      textures.output,
      configBuffer,
    );

    // Create a compute pass
    const pass = commandEncoder.beginComputePass();
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.dispatchWorkgroups(Math.ceil(input.agentData.length / workgroupSize));
    pass.end();

    // Copy all agents to the staging buffer
    commandEncoder.copyBufferToBuffer(
      agentBuffers.work, 0,
      agentBuffers.staging, 0,
      bufferSize
    );

    const commandBuffer = commandEncoder.finish();

    device.queue.writeBuffer(agentBuffers.work, 0, input.agentData);

    device.queue.submit([commandBuffer]);

    // Wait for our buffer to be mapped
    await agentBuffers.staging.mapAsync(GPUMapMode.READ);

    // Read the data from the staging buffer
    const bufferData = agentBuffers.staging.getMappedRange().slice(0);
    let agentData = new Float32Array(bufferData);

    // Unmap the buffer
    agentBuffers.staging.unmap();

    return {
      agentData,
      pingPongTex,
    };
  }

  createPipeline() {
    return this.state.device.createComputePipeline({
      layout: this.state.device.createPipelineLayout({
        bindGroupLayouts: [this.createBindGroupLayout()],
      }),
      compute: {
        module: this.createShaderModule(),
        entryPoint: 'cs',
      },
    });
  }

  createShaderModule() {
    return this.state.device.createShaderModule({
      code: slimeComputeShader.module.code,
    });
  }

  createBindGroupLayout() {
    return this.state.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.COMPUTE,
          texture: {
            sampleType: 'float',
          }
        },
        {
          binding: 1,
          visibility: GPUShaderStage.COMPUTE,
          buffer: {
            type: 'storage',
          },
        },
        {
          binding: 2,
          visibility: GPUShaderStage.COMPUTE,
          storageTexture: {
            access: 'write-only',
            format: 'rgba8unorm',
          }
        },
        {
          binding: 3,
          visibility: GPUShaderStage.COMPUTE,
          buffer: {
            type: 'uniform',
          },
        },
      ],
    } as const)
  }

  createAgentBuffers(bufferSize: number) {
    const work = this.state.device.createBuffer({
      size: bufferSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    });

    // Create a staging buffer to copy the agents to
    const staging = this.state.device.createBuffer({
      size: bufferSize,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });

    return { work, staging };
  }

  createBindGroup(
    pipeline: GPUComputePipeline,
    agentBuffer: GPUBuffer,
    inputTexture: GPUTexture,
    outputTexture: GPUTexture,
    configBuffer: GPUBuffer,
  ) {
    return this.state.device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: inputTexture.createView(),
        },
        {
          binding: 1,
          resource: {
            buffer: agentBuffer,
          },
        },
        {
          binding: 2,
          resource: outputTexture.createView(),
        },
        {
          binding: 3,
          resource: {
            buffer: configBuffer,
          },
        },
      ],
    });
  }
}
