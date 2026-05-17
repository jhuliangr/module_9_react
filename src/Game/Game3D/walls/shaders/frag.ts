export default /* glsl */ `

  uniform float uTime;
  uniform sampler2D uInput;
  uniform sampler2D uNoiseTxt;
  uniform vec2 uResolution;

  varying vec2 vUv;

  void main() {
    vec2 screenUv = gl_FragCoord.xy / uResolution;
    float time = uTime * 0.4;

    float strenght = pow(1.0 - vUv.y, 3.0);

    float noise = texture2D(uNoiseTxt, vUv * 4.0 + vec2(time * 0.2, -time)).r;
    noise = (noise * 2.0) - 1.0;

    vec2 distortedUv = screenUv + noise * 0.15 * strenght;

    gl_FragColor = texture2D(uInput, distortedUv);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
