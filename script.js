class BackgroundImage {
  constructor() {
    this.uniforms = {
      resolution: {
        type: 'v2',
        value: new THREE.Vector2(window.innerWidth, window.innerHeight) },

      imageResolution: {
        type: 'v2',
        value: new THREE.Vector2(2048, 1356) },

      texture: {
        type: 't',
        value: null } };


    this.obj = null;
  }
  init(src, callback) {
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = '*';
    loader.load(
    src, tex => {
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      this.uniforms.texture.value = tex;
      this.obj = this.createObj();
      callback();
    });
  }
  createObj() {
    return new THREE.Mesh(
    new THREE.PlaneBufferGeometry(2, 2),
    new THREE.RawShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: `attribute vec3 position;
          attribute vec2 uv;

          varying vec2 vUv;

          void main(void) {
            vUv = uv;
            gl_Position = vec4(position, 1.0);
          }
        `,
      fragmentShader: `precision highp float;

          uniform vec2 resolution;
          uniform vec2 imageResolution;
          uniform sampler2D texture;

          varying vec2 vUv;

          void main(void) {
            vec2 ratio = vec2(
                min((resolution.x / resolution.y) / (imageResolution.x / imageResolution.y), 1.0),
                min((resolution.y / resolution.x) / (imageResolution.y / imageResolution.x), 1.0)
              );

            vec2 uv = vec2(
                vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
                vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
              );
            gl_FragColor = texture2D(texture, uv);
          }
        ` }));


  }
  resize() {
    this.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
  }}


class PostEffect {
  constructor(texture) {
    this.uniforms = {
      time: {
        type: 'f',
        value: 0 },

      resolution: {
        type: 'v2',
        value: new THREE.Vector2(window.innerWidth, window.innerHeight) },

      texture: {
        type: 't',
        value: texture } };


    this.obj = this.createObj();
  }
  createObj() {
    return new THREE.Mesh(
    new THREE.PlaneBufferGeometry(2, 2),
    new THREE.RawShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: `attribute vec3 position;
          attribute vec2 uv;
          
          varying vec2 vUv;
          
          void main() {
            vUv = uv;
            gl_Position = vec4(position, 1.0);
          }
        `,
      fragmentShader: `precision highp float;
        
          uniform float time;
          uniform vec2 resolution;
          uniform sampler2D texture;
          
          varying vec2 vUv;
          
          float random(vec2 c){
            return fract(sin(dot(c.xy ,vec2(12.9898,78.233))) * 43758.5453);
          }

          //
          // Description : Array and textureless GLSL 2D/3D/4D simplex
          //               noise functions.
          //      Author : Ian McEwan, Ashima Arts.
          //  Maintainer : ijm
          //     Lastmod : 20110822 (ijm)
          //     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
          //               Distributed under the MIT License. See LICENSE file.
          //               https://github.com/ashima/webgl-noise
          //

          vec3 mod289(vec3 x) {
            return x - floor(x * (1.0 / 289.0)) * 289.0;
          }

          vec4 mod289(vec4 x) {
            return x - floor(x * (1.0 / 289.0)) * 289.0;
          }

          vec4 permute(vec4 x) {
               return mod289(((x*34.0)+1.0)*x);
          }

          vec4 taylorInvSqrt(vec4 r)
          {
            return 1.79284291400159 - 0.85373472095314 * r;
          }

          float snoise3(vec3 v)
            {
            const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
            const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

          // First corner
            vec3 i  = floor(v + dot(v, C.yyy) );
            vec3 x0 =   v - i + dot(i, C.xxx) ;

          // Other corners
            vec3 g = step(x0.yzx, x0.xyz);
            vec3 l = 1.0 - g;
            vec3 i1 = min( g.xyz, l.zxy );
            vec3 i2 = max( g.xyz, l.zxy );

            //   x0 = x0 - 0.0 + 0.0 * C.xxx;
            //   x1 = x0 - i1  + 1.0 * C.xxx;
            //   x2 = x0 - i2  + 2.0 * C.xxx;
            //   x3 = x0 - 1.0 + 3.0 * C.xxx;
            vec3 x1 = x0 - i1 + C.xxx;
            vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
            vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

          // Permutations
            i = mod289(i);
            vec4 p = permute( permute( permute(
                       i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                     + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                     + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

          // Gradients: 7x7 points over a square, mapped onto an octahedron.
          // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
            float n_ = 0.142857142857; // 1.0/7.0
            vec3  ns = n_ * D.wyz - D.xzx;

            vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

            vec4 x_ = floor(j * ns.z);
            vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

            vec4 x = x_ *ns.x + ns.yyyy;
            vec4 y = y_ *ns.x + ns.yyyy;
            vec4 h = 1.0 - abs(x) - abs(y);

            vec4 b0 = vec4( x.xy, y.xy );
            vec4 b1 = vec4( x.zw, y.zw );

            //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
            //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
            vec4 s0 = floor(b0)*2.0 + 1.0;
            vec4 s1 = floor(b1)*2.0 + 1.0;
            vec4 sh = -step(h, vec4(0.0));

            vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
            vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

            vec3 p0 = vec3(a0.xy,h.x);
            vec3 p1 = vec3(a0.zw,h.y);
            vec3 p2 = vec3(a1.xy,h.z);
            vec3 p3 = vec3(a1.zw,h.w);

          //Normalise gradients
            vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
            p0 *= norm.x;
            p1 *= norm.y;
            p2 *= norm.z;
            p3 *= norm.w;

          // Mix final noise value
            vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
            m = m * m;
            return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                          dot(p2,x2), dot(p3,x3) ) );
            }
                    
          const float interval = 3.0;
          
          void main(void){
            float strength = smoothstep(interval * 0.5, interval, interval - mod(time, interval));
            vec2 shake = vec2(strength * 8.0 + 0.5) * vec2(
              random(vec2(time)) * 2.0 - 1.0,
              random(vec2(time * 2.0)) * 2.0 - 1.0
            ) / resolution;
          
            float y = vUv.y * resolution.y;
            float rgbWave = (
                snoise3(vec3(0.0, y * 0.01, time * 400.0)) * (2.0 + strength * 32.0)
                * snoise3(vec3(0.0, y * 0.02, time * 200.0)) * (1.0 + strength * 4.0)
                + step(0.9995, sin(y * 0.005 + time * 1.6)) * 12.0
                + step(0.9999, sin(y * 0.005 + time * 2.0)) * -18.0
              ) / resolution.x;
            float rgbDiff = (6.0 + sin(time * 500.0 + vUv.y * 40.0) * (20.0 * strength + 1.0)) / resolution.x;
            float rgbUvX = vUv.x + rgbWave;
            float r = texture2D(texture, vec2(rgbUvX + rgbDiff, vUv.y) + shake).r;
            float g = texture2D(texture, vec2(rgbUvX, vUv.y) + shake).g;
            float b = texture2D(texture, vec2(rgbUvX - rgbDiff, vUv.y) + shake).b;
          
            float whiteNoise = (random(vUv + mod(time, 10.0)) * 2.0 - 1.0) * (0.15 + strength * 0.15);
          
            float bnTime = floor(time * 20.0) * 200.0;
            float noiseX = step((snoise3(vec3(0.0, vUv.x * 3.0, bnTime)) + 1.0) / 2.0, 0.12 + strength * 0.3);
            float noiseY = step((snoise3(vec3(0.0, vUv.y * 3.0, bnTime)) + 1.0) / 2.0, 0.12 + strength * 0.3);
            float bnMask = noiseX * noiseY;
            float bnUvX = vUv.x + sin(bnTime) * 0.2 + rgbWave;
            float bnR = texture2D(texture, vec2(bnUvX + rgbDiff, vUv.y)).r * bnMask;
            float bnG = texture2D(texture, vec2(bnUvX, vUv.y)).g * bnMask;
            float bnB = texture2D(texture, vec2(bnUvX - rgbDiff, vUv.y)).b * bnMask;
            vec4 blockNoise = vec4(bnR, bnG, bnB, 1.0);
          
            float bnTime2 = floor(time * 25.0) * 300.0;
            float noiseX2 = step((snoise3(vec3(0.0, vUv.x * 2.0, bnTime2)) + 1.0) / 2.0, 0.12 + strength * 0.5);
            float noiseY2 = step((snoise3(vec3(0.0, vUv.y * 8.0, bnTime2)) + 1.0) / 2.0, 0.12 + strength * 0.3);
            float bnMask2 = noiseX2 * noiseY2;
            float bnR2 = texture2D(texture, vec2(bnUvX + rgbDiff, vUv.y)).r * bnMask2;
            float bnG2 = texture2D(texture, vec2(bnUvX, vUv.y)).g * bnMask2;
            float bnB2 = texture2D(texture, vec2(bnUvX - rgbDiff, vUv.y)).b * bnMask2;
            vec4 blockNoise2 = vec4(bnR2, bnG2, bnB2, 1.0);
          
            float waveNoise = (sin(vUv.y * 1200.0) + 1.0) / 2.0 * (0.15 + strength * 0.2);
          
            gl_FragColor = vec4(r, g, b, 1.0) * (1.0 - bnMask - bnMask2) + (whiteNoise + blockNoise + blockNoise2 - waveNoise);
          }
        ` }));


  }
  render(time) {
    this.uniforms.time.value += time;
  }
  resize() {
    this.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
  }}


class ConsoleSignature {
  constructor() {
    this.message = `created by yoichi kobayashi`;
    this.url = `http://www.tplh.net`;
    this.show();
  }
  show() {
    if (navigator.userAgent.toLowerCase().indexOf('chrome') > -1) {
      const args = [
      `\n%c ${this.message} %c%c ${this.url} \n\n`,
      'color: #fff; background: #222; padding:3px 0;',
      'padding:3px 1px;',
      'color: #fff; background: #47c; padding:3px 0;'];

      console.log.apply(console, args);
    } else if (window.console) {
      console.log(`${this.message} ${this.url}`);
    }
  }}


const debounce = (callback, duration) => {
  var timer;
  return function (event) {
    clearTimeout(timer);
    timer = setTimeout(function () {
      callback(event);
    }, duration);
  };
};

const canvas = document.getElementById('canvas-webgl');
const renderer = new THREE.WebGLRenderer({
  antialias: false,
  canvas: canvas });

const renderBack1 = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
const scene = new THREE.Scene();
const sceneBack = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const cameraBack = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
const clock = new THREE.Clock();

//
// process for this sketch.
//

const bgImg = new BackgroundImage();
const postEffect = new PostEffect(renderBack1.texture);
const consoleSignature = new ConsoleSignature();

//
// common process
//
const resizeWindow = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  cameraBack.aspect = window.innerWidth / window.innerHeight;
  cameraBack.updateProjectionMatrix();
  bgImg.resize();
  postEffect.resize();
  renderBack1.setSize(window.innerWidth, window.innerHeight);
  renderer.setSize(window.innerWidth, window.innerHeight);
};
const render = () => {
  const time = clock.getDelta();
  renderer.render(sceneBack, cameraBack, renderBack1);
  postEffect.render(time);
  renderer.render(scene, camera);
};
const renderLoop = () => {
  render();
  requestAnimationFrame(renderLoop);
};

const on = () => {
  window.addEventListener('resize', debounce(() => {
    resizeWindow();
  }), 1000);
};

const init = () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x111111, 1.0);
  cameraBack.position.set(0, 0, 100);
  cameraBack.lookAt(new THREE.Vector3());

  bgImg.init('data:image/jpeg;base64,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', () => {
    sceneBack.add(bgImg.obj);
    scene.add(postEffect.obj);
  });

  on();
  resizeWindow();
  renderLoop();
};
init();