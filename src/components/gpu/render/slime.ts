import { GPUState, SimulationConfig } from '~/components/gpu/types';

import slimeRenderShader from '../shaders/slime-render.wgsl';

export const runSlimeRender = async (
  state: GPUState,
  texture: GPUTexture,
  config: SimulationConfig
) => {
  const { device } = state;
  const { variantA, variantB, variantC } = config;

  const shaderModule = device.createShaderModule({
    code: slimeRenderShader.module.code,
  });

  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.FRAGMENT,
        sampler: {
          type: 'filtering',
        },
      },
      {
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        texture: {
          sampleType: 'float',
        },
      },
      {
        binding: 2,
        visibility: GPUShaderStage.FRAGMENT,
        buffer: {
          type: 'uniform',
        },
      },
    ],
  } as const);

  const pipeline = device.createRenderPipeline({
    layout: device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout],
    }),
    vertex: {
      module: shaderModule,
      entryPoint: 'vert',
      // no vertex buffers
    },
    primitive: {
      topology: 'triangle-strip',
      // other primitive settings if necessary
    },
    fragment: {
      module: shaderModule,
      entryPoint: 'frag',
      targets: [
        {
          format: 'bgra8unorm',
        },
      ],
    },
    // ... other pipeline settings ...
  } as const);

  const renderPassDescriptor = {
    colorAttachments: [
      {
        view: state.context.getCurrentTexture().createView(),
        clearValue: { r: 0, g: 0, b: 0, a: 1 },
        loadOp: 'clear',
        storeOp: 'store',
      },
    ],
  } as const;

  const colorsBuffer = device.createBuffer({
    size: 3 * 4 * 4,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const colorsA = variantA.color.rgba;
  const colorsB = variantB.color.rgba;
  const colorsC = variantC.color.rgba;

  const colorsData = new Float32Array([
    colorsA.r / 255, colorsA.g / 255, colorsA.b / 255, 0,
    colorsB.r / 255, colorsB.g / 255, colorsB.b / 255, 0,
    colorsC.r / 255, colorsC.g / 255, colorsC.b / 255, 0,
  ]);
  device.queue.writeBuffer(
    colorsBuffer,
    0,
    colorsData.buffer,
    colorsData.byteOffset,
    colorsData.byteLength
  );

  const sampler = device.createSampler();
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: sampler,
      },
      {
        binding: 1,
        resource: texture.createView(),
      },
      {
        binding: 2,
        resource: {
          buffer: colorsBuffer,
        },
      }
    ],
  });

  const commandEncoder = device.createCommandEncoder({
    label: 'Slime Render Encoder',
  });

  const pass = commandEncoder.beginRenderPass(renderPassDescriptor);
  pass.setPipeline(pipeline);
  pass.setBindGroup(0, bindGroup);
  pass.draw(4);
  pass.end();

  const commandBuffer = commandEncoder.finish();
  device.queue.submit([commandBuffer]);
};
