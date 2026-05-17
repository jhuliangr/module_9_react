export default /* glsl */ `
  uniform float uTime;
  uniform sampler2D uNoiseTxt;

  void main() {
    float t = uTime * 0.5;

    // moving with the time
    vec2 nUv1 = uv * 3.0 + vec2(t * 0.3, -t);
    float n1 = texture2D(uNoiseTxt, nUv1).r;

    float displacement = (n1 - 0.5) * 0.58;

    // making the vertex to go outside of the sphere
    vec3 displaced = position + normal * displacement;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`;
