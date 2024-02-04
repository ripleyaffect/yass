'use client';

import { useCallback, useEffect, useRef, useLayoutEffect, useState } from 'react';

import { GPUState, SimulationConfig, VariantConfig } from './types';
import { Button } from '~/components/ui/button';
import { DissolveComputePass, SlimeComputePass } from './compute';
import { runSlimeRender } from '~/components/gpu/render/slime';
import { PingPongTexture } from '~/components/gpu/util';
import { StepForward } from 'lucide-react';
import { SimulationControls } from '~/components/gpu/controls';
import { Colord } from 'colord';

const getInitialAgentData = (size: number, speedScale: number = 0.001) => {
  // We have 4 floats per agent (p(x, y), v(x, y))
  // They are aligned in 16 byte chunks, so no padding is needed
  let data = new Float32Array(size * 8);
  let variant = 0;
  for (let i = 0; i < size; i++) {
    const idx = i * 8;

    if (variant === 0) {
      data[idx] = 1.0;
      data[idx + 1] = 0.0;
      data[idx + 2] = 0.0;
    }
    else if (variant === 1) {
      data[idx] = 0.0;
      data[idx + 1] = 1.0;
      data[idx + 2] = 0.0;
    }
    else if (variant === 2) {
      data[idx] = 0.0;
      data[idx + 1] = 0.0;
      data[idx + 2] = 1.0;
    }

    // Alignment
    data[idx + 3] = 0.0;

    data[idx + 4] = Math.random();
    data[idx + 5] = Math.random();
    data[idx + 6] = Math.random() * speedScale * (Math.random() > 0.5 ? 1 : -1);
    data[idx + 7] = Math.random() * speedScale * (Math.random() > 0.5 ? 1 : -1);
    variant = (variant + 1) % 3;
  }

  return data;
}

const TEXTURE_SIZE = 1024;

const defaultVariantConfig: VariantConfig = {
  color: new Colord('#ff0000'),
  sampleAngle: Math.PI / 4,
  sampleDistance: 5,
  speed: 0.01,
  interactions: {
    a: 1,
    b: 0,
    c: 0,
    alpha: 0,
  },
  interactionsLocked: true,
}

const defaultConfig: SimulationConfig = {
  variantA: {
    ...defaultVariantConfig,
  },
  variantB: {
    ...defaultVariantConfig,
    color: new Colord('#00ff00'),
    interactions: {
      a: 0,
      b: 1,
      c: 0,
      alpha: 0,
    },
  },
  variantC: {
    ...defaultVariantConfig,
    color: new Colord('#0000ff'),
    interactions: {
      a: 0,
      b: 0,
      c: 1,
      alpha: 0,
    },
  },
};

export const GpuCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null!);

  const [isRunning, setIsRunning] = useState(false);
  const [gpuState, setGpuState] = useState<GPUState | null>(null);
  const [agentData, setAgentData] = useState<Float32Array>(getInitialAgentData(200000));
  const [pingPongTex, setPingPongTex] = useState<PingPongTexture | null>(null);
  const [config, setConfig] = useState<SimulationConfig>(defaultConfig);

  const onRender = useCallback(async () => {
    if (!canvasRef.current) return;

    if (!gpuState) {
      const context = canvasRef.current.getContext('webgpu');

      if (!context) {
        console.error('WebGPU not supported');
        return;
      }

      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        console.error('Failed to get GPU adapter');
        return;
      }

      const device = await adapter.requestDevice();
      const format = navigator.gpu.getPreferredCanvasFormat();

      context.configure({ device, format, });

      console.log(context);

      setGpuState({
        context,
        device,
        format,
      });

      const pheromoneTexture = device.createTexture({
        size: [TEXTURE_SIZE, TEXTURE_SIZE],
        format: 'rgba8unorm',
        usage:
          GPUTextureUsage.TEXTURE_BINDING |
          GPUTextureUsage.STORAGE_BINDING |
          GPUTextureUsage.COPY_SRC |
          GPUTextureUsage.COPY_DST,
      });

      const ppTex = new PingPongTexture(pheromoneTexture, device);

      setPingPongTex(ppTex);

      return;
    }
  }, [gpuState]);

  useLayoutEffect(() => {
    const handleResize = () => {
      // Resize your canvas and update any necessary resources
    };

    window.addEventListener('resize', handleResize);
    onRender();

    return () => {
      window.removeEventListener('resize', handleResize);
      // Clean up any resources like GPU buffers here
    };
  }, [onRender]);

  const dissolve = async () => {
    if (!gpuState || !pingPongTex) return;

    await new DissolveComputePass(gpuState).run({
      pingPongTex,
    });
  };

  const simulate = async () => {
    if (!gpuState || !pingPongTex) return null;

    console.log(agentData.length);

    return await new SlimeComputePass(gpuState).run({
      agentData,
      pingPongTex,
      config,
    });
  }

  const step = async () => {
    if (!gpuState || !pingPongTex) return;

    await dissolve();
    const result = await simulate();

    pingPongTex.swap();

    setAgentData(result!.agentData);
  }

  useEffect(() => {
    if (!pingPongTex) return;
    runSlimeRender(gpuState!, pingPongTex.ping!, config);
    if (!isRunning) return;
    step();
  }, [agentData]);

  const onClick = () => {
    setIsRunning(!isRunning);
    step();
  }

  return (
    <div className="flex">
      <div className="w-[300px] mr-4">
        <div className="flex items-center justify-center bg-secondary p-2 mt-4 rounded uppercase font-semibold text-lg">
          Y.A.S.S.
        </div>
        <div className="flex items-center my-4">
          <Button className="flex-1 mr-2" onClick={onClick}>{isRunning ? 'Pause' : 'Play'}</Button>
          <Button size="icon" onClick={step}><StepForward size={15} /></Button>
        </div>
        <SimulationControls config={config} onConfigChange={setConfig} />
      </div>
      <canvas
        ref={canvasRef}
        className="aspect-square"
        width={Math.min(window.innerHeight, window.innerWidth)}
        height={Math.min(window.innerHeight, window.innerWidth)}
      />
    </div>
  );
};