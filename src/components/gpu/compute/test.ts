import { GPUState } from '~/components/gpu/types';

import testComputeShader from '../shaders/test-compute.wgsl';

const { module: { code } } = testComputeShader;

console.log(testComputeShader);

export const runTestCompute = async (state: GPUState) => {
  const { device } = state;

  const shaderModule = device.createShaderModule({
    code,
  });

  // Create a bind group layout for the output buffer
  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type: 'storage' as 'storage',
        },
      },
    ],
  });

  const pipeline = device.createComputePipeline({
    layout: device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout],
    }),
    compute: {
      module: shaderModule,
      entryPoint: 'main',
    },
  });

  const bufferSize = 1000;

  // Create a buffer to store the output.
  // We need to be able to read from it, so we use the STORAGE usage.
  // We also need to copy the data to the staging buffer, so we use the COPY_SRC usage.
  const output = device.createBuffer({
    size: bufferSize,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
  });

  // Create a staging buffer to copy the output to
  // We need to be able to read from it, so we use the MAP_READ usage.
  // We also need to copy the data from the output buffer, so we use the COPY_DST usage.
  const stagingBuffer = device.createBuffer({
    size: bufferSize,
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
  });

  // Create a bind group for the output buffer
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: output,
        },
      },
    ],
  });

  const commandEncoder = device.createCommandEncoder();

  const passEncoder = commandEncoder.beginComputePass();
  passEncoder.setPipeline(pipeline);

  // Set the bind group for the output buffer
  passEncoder.setBindGroup(0, bindGroup);

  passEncoder.dispatchWorkgroups(Math.ceil(bufferSize / 64));
  passEncoder.end();

  // Copy the output buffer to the staging buffer
  // We use the command encoder, as the pass is only for dispatching compute work
  commandEncoder.copyBufferToBuffer(
    output, 0,
    stagingBuffer, 0,
    bufferSize,
  );

  const commandBuffer = commandEncoder.finish();

  // Do the thing
  device.queue.submit([commandBuffer]);

  // Read the data from the staging buffer
  await stagingBuffer.mapAsync(GPUMapMode.READ, 0, bufferSize);
  const copyArrayBuffer = stagingBuffer.getMappedRange(0, bufferSize);
  const data = copyArrayBuffer.slice(0);

  // Clean up
  stagingBuffer.unmap();

  return new Uint32Array(data);
};
