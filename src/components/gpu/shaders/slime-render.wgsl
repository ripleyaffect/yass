struct VertexOutput {
  @builtin(position) Position : vec4<f32>,
  @location(0) uv : vec2<f32>,
};

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

@vertex
fn vert(@builtin(vertex_index) VertexIndex : u32) -> VertexOutput {
  var output : VertexOutput;

  // Create a full screen quad by using the vertex index
  let x = f32((VertexIndex & 1u) << 2u) - 1.0;
  let y = f32((VertexIndex & 2u) << 1u) - 1.0;

  // Output the clip space position
  output.Position = vec4<f32>(x, y, 0.0, 1.0);

  // Calculate UV coordinates
  output.uv = vec2<f32>((x + 1.0) * 0.5, (y + 1.0) * 0.5);

  return output;
}

struct Colors {
  a: vec3<f32>,
  b: vec3<f32>,
  c: vec3<f32>,
};

@group(0) @binding(0) var texSampler: sampler;
@group(0) @binding(1) var tex: texture_2d<f32>;
@group(0) @binding(2) var<uniform> colors: Colors;

@fragment
fn frag(input : VertexOutput) -> @location(0) vec4<f32> {

  var color = textureSample(tex, texSampler, input.uv).rgb;

  // 9 sample blur, weighted in favor of the center pixel
  let blur = 1.0 / 1024.;
  color += color;
  color += textureSample(tex, texSampler, input.uv + vec2<f32>(blur, 0.0)).rgb;
  color += textureSample(tex, texSampler, input.uv + vec2<f32>(blur, blur)).rgb;
  color += textureSample(tex, texSampler, input.uv + vec2<f32>(0.0, blur)).rgb;
  color += textureSample(tex, texSampler, input.uv + vec2<f32>(-blur, blur)).rgb;
  color += textureSample(tex, texSampler, input.uv + vec2<f32>(-blur, 0.0)).rgb;
  color += textureSample(tex, texSampler, input.uv + vec2<f32>(-blur, -blur)).rgb;
  color += textureSample(tex, texSampler, input.uv + vec2<f32>(0.0, -blur)).rgb;
  color += textureSample(tex, texSampler, input.uv + vec2<f32>(blur, -blur)).rgb;
  color *= 0.1;

  // Blend the colors based on the amount of each variant
  var blendedColor = color.r * colors.a + color.g * colors.b + color.b * colors.c;


  return vec4<f32>(blendedColor, 1.0);
}
