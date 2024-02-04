import { GPUState } from '~/components/gpu/types';

export abstract class ComputePass<TIn, TOut> {
  state: GPUState;

  constructor(state: GPUState) {
    this.state = state;
  }

  async run(input: TIn): Promise<TOut> {
    throw new Error('Not implemented');
  }
}
