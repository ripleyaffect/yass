import { GPUState } from '~/components/gpu/types';

import slimeDissolveShader from '../shaders/slime-dissolve.wgsl';

import { ComputePass } from './pass';
import { PingPongTexture } from '~/components/gpu/util';

type PassInput = {
  pingPongTex: PingPongTexture,
};

type PassOutput = {
  pingPongTex: PingPongTexture,
};

export class DissolveComputePass extends ComputePass<PassInput, PassOutput> {
  async run(input: PassInput) {
    const { device } = this.state;
    const { pingPongTex } = input;

    const textures = pingPongTex.getInOut();

    const pipeline = this.createPipeline();

    // Create a command encoder to encode the commands for the GPU
    const commandEncoder = device.createCommandEncoder();

    // Present in module.table.exports[0].func.attrs[1] as `workgroup_size(\d+)`
    const workgroupSize = 64;

    // Create a bind group for the agents buffer
    const bindGroup = this.createBindGroup(
      pipeline,
      textures.input,
      textures.output,
    );

    // Create a compute pass
    const pass = commandEncoder.beginComputePass();
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);

    pass.dispatchWorkgroups(Math.ceil(pingPongTex.width * pingPongTex.height / workgroupSize));
    pass.end();

    const commandBuffer = commandEncoder.finish();

    device.queue.submit([commandBuffer]);

    await device.queue.onSubmittedWorkDone();

    return input;
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
      code: slimeDissolveShader.module.code,
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
          },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.COMPUTE,
          storageTexture: {
            access: 'write-only',
            format: 'rgba8unorm',
          }
        }
      ],
    } as const)
  }

  createBindGroup(
    pipeline: GPUComputePipeline,
    inputTex: GPUTexture,
    outputTex: GPUTexture,
  ) {
    return this.state.device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: inputTex.createView(),
        },
        {
          binding: 1,
          resource: outputTex.createView(),
        }
      ],
    });
  }
}
