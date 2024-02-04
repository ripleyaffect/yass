export class PingPongTexture {
  ping: GPUTexture;
  pong: GPUTexture;

  constructor(texture: GPUTexture, device: GPUDevice) {
    this.ping = texture;
    this.pong = device.createTexture({
      size: {
        width: texture.width,
        height: texture.height,
      },
      format: texture.format,
      usage: texture.usage,
    });
  }

  get width() {
    return this.ping.width;
  }

  get height() {
    return this.ping.height;
  }

  swap() {
    [this.ping, this.pong] = [this.pong, this.ping];
  }

  getInOut() {
    return {
      input: this.ping,
      output: this.pong,
    };
  }
}
