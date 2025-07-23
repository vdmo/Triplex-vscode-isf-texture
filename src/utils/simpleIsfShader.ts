import { useEffect, useState } from 'react';
import * as THREE from 'three';

// Basic vertex shader for use with ISF fragment shaders
export const basicVertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// Simple hook to load shader text
export function useShaderText(url: string) {
  const [shaderText, setShaderText] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    async function fetchShader() {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to load shader: ${response.statusText}`);
        }
        
        const text = await response.text();
        if (isMounted) {
          setShaderText(text);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      }
    }

    fetchShader();
    
    return () => {
      isMounted = false;
    };
  }, [url]);

  return { shaderText, error, loading };
}

// Prepare ISF shader for use with Three.js
export function prepareShaderForThree(shaderText: string): string {
  // Add necessary uniforms and functions that ISF shaders expect
  const preamble = `
// Three.js compatible version of ISF shader
uniform float time;
uniform vec2 resolution;
uniform sampler2D inputImage;

// ISF specific uniforms and functions
#define PASSINDEX 0
#define PI 3.14159265359

// Convert Three.js vUv to ISF's isf_FragNormCoord
varying vec2 vUv;
vec2 isf_FragNormCoord;

// ISF utility functions
vec4 RGBA(float r, float g, float b, float a) {
  return vec4(r, g, b, a);
}

vec4 RGBA(float r, float g, float b) {
  return vec4(r, g, b, 1.0);
}

vec4 RGBA(float v) {
  return vec4(v, v, v, 1.0);
}
`;

  // Remove metadata comment if present
  const shaderWithoutMetadata = shaderText.replace(/\/\*\s*?(\{[\s\S]*?\})\s*?\*\//, '');
  
  // Check if the shader already has a main function
  const hasMainFunction = /void\s+main\s*\(\s*\)/.test(shaderWithoutMetadata);
  
  if (hasMainFunction) {
    // If the shader already has a main function, just add the preamble and
    // insert the isf_FragNormCoord assignment at the beginning of main
    return preamble + shaderWithoutMetadata.replace(
      /(void\s+main\s*\(\s*\)\s*\{)/,
      '$1\n  isf_FragNormCoord = vUv;\n'
    );
  } else {
    // If no main function, wrap the shader code in one
    return preamble + `
void main() {
  isf_FragNormCoord = vUv;
  
  ${shaderWithoutMetadata}
}
`;
  }
}