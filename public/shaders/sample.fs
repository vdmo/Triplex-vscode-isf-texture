/*{
  "DESCRIPTION": "A simple color gradient ISF shader",
  "CREDIT": "Example shader",
  "CATEGORIES": ["generator"],
  "INPUTS": [
    {
      "NAME": "speed",
      "TYPE": "float",
      "DEFAULT": 1.0,
      "MIN": 0.0,
      "MAX": 5.0
    },
    {
      "NAME": "colorA",
      "TYPE": "color",
      "DEFAULT": [1.0, 0.0, 0.0, 1.0]
    },
    {
      "NAME": "colorB",
      "TYPE": "color",
      "DEFAULT": [0.0, 0.0, 1.0, 1.0]
    }
  ]
}*/

// Explicitly declare uniforms that match the ISF metadata
uniform float speed;
uniform vec4 colorA;
uniform vec4 colorB;

void main() {
  // ISF shaders use isf_FragNormCoord which is provided by our converter
  vec2 uv = isf_FragNormCoord;
  
  // Create a moving gradient based on time
  float t = sin(time * speed) * 0.5 + 0.5;
  
  // Mix between two colors
  vec4 color = mix(vec4(colorA.rgb, 1.0), vec4(colorB.rgb, 1.0), t * uv.x + (1.0 - t) * uv.y);
  
  // Output the final color
  gl_FragColor = color;
}