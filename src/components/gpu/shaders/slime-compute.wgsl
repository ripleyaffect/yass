
fn simplex2d(pos: vec2<f32>) -> f32 {
  let c = 0.211324865405187; // (3.0 - sqrt(3.0)) / 6.0;
  let i = floor(pos + dot(pos, vec2(c)));
  let x0 = pos - i + dot(i, vec2(c));
  let i1 = vec2<f32>(0.0, 0.0);
  let x1 = x0 - i1 + vec2<f32>(c);
  let i2 = vec2<f32>(1.0, 0.0);
  let x2 = x0 - i2 + vec2<f32>(2.0 * c);
  let i3 = vec2<f32>(0.0, 1.0);
  let x3 = x0 - i3 + vec2<f32>(3.0 * c);
  let n0 = max(0.5 - dot(x0, x0), 0.0);
  let n1 = max(0.5 - dot(x1, x1), 0.0);
  let n2 = max(0.5 - dot(x2, x2), 0.0);
  let n3 = max(0.5 - dot(x3, x3), 0.0);
  return 70.0 * (n0 * n0 * n0 * n0 * dot(x0, x0) + n1 * n1 * n1 * n1 * dot(x1, x1) + n2 * n2 * n2 * n2 * dot(x2, x2) + n3 * n3 * n3 * n3 * dot(x3, x3));
}



// MIT License. © Stefan Gustavson, Munrocket
//
fn permute4(x: vec4f) -> vec4f { return ((x * 34. + 1.) * x) % vec4f(289.); }
fn fade2(t: vec2f) -> vec2f { return t * t * t * (t * (t * 6. - 15.) + 10.); }

fn perlin2d(P: vec2f) -> f32 {
    var Pi: vec4f = floor(P.xyxy) + vec4f(0., 0., 1., 1.);
    let Pf = fract(P.xyxy) - vec4f(0., 0., 1., 1.);
    Pi = Pi % vec4f(289.); // To avoid truncation effects in permutation
    let ix = Pi.xzxz;
    let iy = Pi.yyww;
    let fx = Pf.xzxz;
    let fy = Pf.yyww;
    let i = permute4(permute4(ix) + iy);
    var gx: vec4f = 2. * fract(i * 0.0243902439) - 1.; // 1/41 = 0.024...
    let gy = abs(gx) - 0.5;
    let tx = floor(gx + 0.5);
    gx = gx - tx;
    var g00: vec2f = vec2f(gx.x, gy.x);
    var g10: vec2f = vec2f(gx.y, gy.y);
    var g01: vec2f = vec2f(gx.z, gy.z);
    var g11: vec2f = vec2f(gx.w, gy.w);
    let norm = 1.79284291400159 - 0.85373472095314 *
        vec4f(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11));
    g00 = g00 * norm.x;
    g01 = g01 * norm.y;
    g10 = g10 * norm.z;
    g11 = g11 * norm.w;
    let n00 = dot(g00, vec2f(fx.x, fy.x));
    let n10 = dot(g10, vec2f(fx.y, fy.y));
    let n01 = dot(g01, vec2f(fx.z, fy.z));
    let n11 = dot(g11, vec2f(fx.w, fy.w));
    let fade_xy = fade2(Pf.xy);
    let n_x = mix(vec2f(n00, n01), vec2f(n10, n11), vec2f(fade_xy.x));
    let n_xy = mix(n_x.x, n_x.y, fade_xy.y);
    return 2.3 * n_xy;
}

struct Agent {
  variant: vec4<f32>,
  position: vec2<f32>,
  velocity: vec2<f32>,
}

struct Config {
  speed: vec4<f32>,
  sampleDistance: vec4<f32>,
  sampleAngle: vec4<f32>,
  interactionsA: vec4<f32>,
  interactionsB: vec4<f32>,
  interactionsC: vec4<f32>,
};

const PI: f32 = 3.141592653589793;

const texSize = 1024;

fn samplePoint(uv: vec2<f32>, size: vec2<u32>) -> vec4<f32> {
  let pos = vec2<i32>(uv * vec2<f32>(f32(size.x), f32(size.y)));
  return textureLoad(inputTex, pos, 0);
}

fn rotateVector(v: vec2<f32>, angleRadians: f32) -> vec2<f32> {
  let cosAngle = cos(angleRadians);
  let sinAngle = sin(angleRadians);

  // Counter-Clockwise rotation
  let rotatedCCW = vec2<f32>(
    v.x * cosAngle - v.y * sinAngle,
    v.x * sinAngle + v.y * cosAngle
  );

  // Clockwise rotation
  let rotatedCW = vec2<f32>(
    v.x * cosAngle + v.y * sinAngle,
    -v.x * sinAngle + v.y * cosAngle
  );

  // Return the vector you need
  return rotatedCCW; // or rotatedCW depending on what you need
}

fn getNextVelocity(
  agent: Agent,
  size: vec2<u32>,
  config: Config
) -> vec2<f32> {
  // Sample at three points:
  // 1. Forward and to the left
  // 2. Directly forward
  // 3. Forward and to the right

  // Calculate forward direction (normalized velocity)
  // Calculate the forward direction (normalized)
  let forwardDir = normalize(agent.velocity);

  let sampleAngle = dot(agent.variant, config.sampleAngle);

  // Calculate the left and right directions
  let leftDir = rotateVector(forwardDir, sampleAngle);
  let rightDir = rotateVector(forwardDir, -sampleAngle);

  let sampleDistance = dot(agent.variant, config.sampleDistance);
  let uvDist = sampleDistance / f32(size.x);

  // Sample the three points
  let forwardSample = samplePoint(agent.position + forwardDir * uvDist, size);
  let leftSample = samplePoint(agent.position + leftDir * uvDist, size);
  let rightSample = samplePoint(agent.position + rightDir * uvDist, size);

  let interactionMask = vec4<f32>(
    dot(agent.variant, config.interactionsA),
    dot(agent.variant, config.interactionsB),
    dot(agent.variant, config.interactionsC),
    0.0
  );

  let forwardPull = dot(forwardSample, interactionMask);
  let leftPull = dot(leftSample, interactionMask);
  let rightPull = dot(rightSample, interactionMask);

  // Find the new direction
  // TODO weight this off the variant's interaction config
  var newDirection = (
    forwardDir * forwardPull +
    leftDir * leftPull +
    rightDir * rightPull
  );

  // Keep the direction from getting too small
  newDirection = mix(
    forwardDir,
    newDirection,
    smoothstep(0., 0.1, length(newDirection))
  );

//  let value = perlin2d(agent.position * 1000.0);
//  var newVelocity = rotateVector(newDirection, value / 10.0);

  let newVelocity = normalize(newDirection);

  // Add some noise to the velocity

//  // Bounce off the edges
//  if (highestSamplePos.x < 0.0 || highestSamplePos.x > 1.0 || highestSamplePos.y < 0.0 || highestSamplePos.y > 1.0) {
//     newVelocity *= -1.0;
//  }

  return newVelocity;
}


@group(0) @binding(0)
var inputTex: texture_2d<f32>;

@group(0) @binding(1)
var<storage, read_write> agents: array<Agent>;

@group(0) @binding(2)
var outputTex: texture_storage_2d<rgba8unorm, write>;

@group(0) @binding(3)
var<uniform> config: Config;

@compute @workgroup_size(64)
fn cs(
  @builtin(global_invocation_id)
  gid: vec3<u32>,

  @builtin(local_invocation_id)
  lid: vec3<u32>,
) {
  let agent = agents[gid.x];

  // Deposit the agent position into the texture
  let size = textureDimensions(outputTex);
  let texel = floor(vec2<f32>(f32(size.x), f32(size.y)) * agent.position);
  var texelValue = samplePoint(agent.position, size);
  texelValue += agent.variant;

  textureStore(
    outputTex,
    vec2<i32>(i32(texel.x), i32(texel.y)),
    clamp(texelValue * agent.variant, vec4(0.0), vec4(1.0))
  );

  var velocity = getNextVelocity(agent, size, config);
  let speed = dot(agent.variant, config.speed);
  let position = fract(agent.position + velocity / f32(size.x) * speed);

  // Write the agent back to the buffer
  agents[gid.x].position = position;
  agents[gid.x].velocity = velocity;
}
