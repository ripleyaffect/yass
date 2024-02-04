@group(0) @binding(0)
var inputTex: texture_2d<f32>;

@group(0) @binding(1)
var outputTex: texture_storage_2d<rgba8unorm, write>;

const WORKGROUP_SIZE: u32 = 64;

const evaporate: f32 = 1.;
const evaporationFactor: f32 = .05;

@compute @workgroup_size(WORKGROUP_SIZE)
fn cs(
  @builtin(global_invocation_id)
  gid: vec3<u32>,

  @builtin(local_invocation_id)
  lid: vec3<u32>,
) {
  let x = gid.x % 1024;
  let y = gid.x / 1024;

  let pos = vec2<u32>(x, y);

  // Blur surrounding pixels
  var v = textureLoad(inputTex, pos, 0);
  v += textureLoad(inputTex, vec2<i32>(i32(x) - 1, i32(y)), 0);
  v += textureLoad(inputTex, vec2<i32>(i32(x) + 1, i32(y)), 0);
  v += textureLoad(inputTex, vec2<i32>(i32(x), i32(y) - 1), 0);
  v += textureLoad(inputTex, vec2<i32>(i32(x), i32(y) + 1), 0);
  v /= 5.0;

  if (false) {
    v -= evaporationFactor;
  } else {
    v *= (1.0 - evaporationFactor);
  }

  textureStore(outputTex, pos, vec4<f32>(v.rgb, 1.0));
}
