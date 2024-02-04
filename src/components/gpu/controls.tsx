import { SimulationConfig, VariantConfig } from '~/components/gpu/types';
import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { Label } from '~/components/ui/label';
import { Slider } from '~/components/ui/slider';
import { LockClosedIcon } from '@radix-ui/react-icons';
import { Lock, Unlock } from 'lucide-react';
import { Input } from '~/components/ui/input';
import { Colord } from 'colord';

export const SimulationControls = ({
  config,
  onConfigChange,
}: {
  config: SimulationConfig;
  onConfigChange: (config: SimulationConfig) => void;
}) => {
  const [currentTab, setCurrentTab] = useState<keyof SimulationConfig>('variantA');

  return (
    <div className="w-[300px]">
      <div className="flex items-center justify-around h-12">
        <Button
          size="icon"
          onClick={() => setCurrentTab('variantA')}
          variant={currentTab === 'variantA' ? 'default' : 'secondary'}
        >
          A
        </Button>
        <Button
          size="icon"
          onClick={() => setCurrentTab('variantB')}
          variant={currentTab === 'variantB' ? 'default' : 'secondary'}
        >
          B
        </Button>
        <Button
          size="icon"
          onClick={() => setCurrentTab('variantC')}
          variant={currentTab === 'variantC' ? 'default' : 'secondary'}
        >
          C
        </Button>
      </div>

      <div className="mb-2">
        <VariantControls
          config={config[currentTab]}
          setConfig={(newConfig) => onConfigChange({ ...config, [currentTab]: newConfig })}
        />
      </div>
      <Button className="w-full" onClick={() => {
        onConfigChange({
          variantA: getRandomVariantConfig(config.variantA),
          variantB: getRandomVariantConfig(config.variantB),
          variantC: getRandomVariantConfig(config.variantC),
        });
      }}>
        Randomize All
      </Button>
    </div>
  );
}

const VariantControls = ({
  config,
  setConfig,
}: {
  config: VariantConfig,
  setConfig: (config: VariantConfig) => void,
}) => {
  return (
    <>
      <div>
        <Label>Color</Label>
        <Input
          type="color"
          value={config.color.toHex()}
          onChange={(e) => setConfig({ ...config, color: new Colord(e.target.value) })}
        />
      </div>
      <div className="mb-2">
        <Label>Sample Angle</Label>
        <Slider
          className="mt-2"
          min={0}
          max={Math.PI}
          step={0.001}
          value={[config.sampleAngle]}
          onValueChange={([value]) => setConfig({ ...config, sampleAngle: value })}
        />
      </div>
      <div className="mb-2">
        <Label>Sample Distance</Label>
        <Slider
          className="mt-2"
          min={0}
          max={20}
          step={0.1}
          value={[config.sampleDistance]}
          onValueChange={([value]) => setConfig({ ...config, sampleDistance: value })}
        />
      </div>
      <div className="mb-4">
        <Label>Speed</Label>
        <Slider
          className="mt-2"
          min={0}
          max={10}
          step={0.01}
          value={[config.speed]}
          onValueChange={([value]) => setConfig({ ...config, speed: value })}
        />
      </div>
      <div>
        <div className="flex flex-col">
          <div className="flex items-center mb-2">
            <div className="w-10">
              <Button
                className="p-0 h-fit"
                variant="ghost"
                onClick={() => setConfig({ ...config, interactionsLocked: !config.interactionsLocked })}
              >
                {config.interactionsLocked ? <Lock size={15} /> : <Unlock size={15} />}
              </Button>
            </div>
            <div className="flex-1 flex justify-between">
              <Label>Repelled</Label>
              <Label>None</Label>
              <Label>Attracted</Label>
            </div>
          </div>
          <div className="flex mb-2">
            <Label className="w-12">A</Label>
            <Slider
              min={-1}
              max={1}
              step={0.1}
              value={[config.interactions.a]}
              onValueChange={([value]) => setConfig({ ...config, interactions: { ...config.interactions, a: value } })}
            />
          </div>
          <div className="flex mb-2">
            <Label className="w-12">B</Label>
            <Slider
              min={-1}
              max={1}
              step={0.1}
              value={[config.interactions.b]}
              onValueChange={([value]) => setConfig({ ...config, interactions: { ...config.interactions, b: value } })}
            />
          </div>
          <div className="flex mb-2">
            <Label className="w-12">C</Label>
            <Slider
              min={-1}
              max={1}
              step={0.1}
              value={[config.interactions.c]}
              onValueChange={([value]) => setConfig({ ...config, interactions: { ...config.interactions, c: value } })}
            />
          </div>
          {/* Alpha mask not yet supported */}
          {/*<div className="flex mb-2">*/}
          {/*  <Label className="w-12">Alpha</Label>*/}
          {/*  <Slider*/}
          {/*    min={-1}*/}
          {/*    max={1}*/}
          {/*    step={0.1}*/}
          {/*    value={[config.interactions.alpha]}*/}
          {/*    onValueChange={([value]) => setConfig({*/}
          {/*      ...config,*/}
          {/*      interactions: { ...config.interactions, alpha: value }*/}
          {/*    })}*/}
          {/*  />*/}
          {/*</div>*/}
        </div>
      </div>
      <Button className="w-full" variant="secondary" onClick={() => setConfig(getRandomVariantConfig(config))}>
        Randomize Variant
      </Button>
    </>
  )
}

const getRandomVariantConfig = (config: VariantConfig): VariantConfig => ({
  ...config,
  sampleAngle: Math.random() * Math.PI,
  sampleDistance: Math.random() * 20,
  speed: Math.random() * 10,
  interactions: config.interactionsLocked ? config.interactions : {
    a: Math.random() * 2 - 1,
    b: Math.random() * 2 - 1,
    c: Math.random() * 2 - 1,
    alpha: Math.random() * 2 - 1,
  }
})
