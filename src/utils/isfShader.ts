import { useEffect, useState } from 'react';
import * as THREE from 'three';

// Interface for ISF metadata
interface ISFMetadata {
  DESCRIPTION?: string;
  CREDIT?: string;
  CATEGORIES?: string[];
  INPUTS?: {
    NAME: string;
    TYPE: string;
    DEFAULT?: any;
    MIN?: number;
    MAX?: number;
  }[];
  PASSES?: {
    TARGET: string;
    PERSISTENT?: boolean;
    WIDTH?: string | number;
    HEIGHT?: string | number;
    FLOAT?: boolean;
  }[];
}

// Parse ISF shader to extract metadata and shader code
export function parseISF(source: string): { metadata: ISFMetadata; fragmentShader: string } {
  // ISF shaders start with JSON metadata between /* */ comments
  const metadataMatch = source.match(/\/\*\s*?(\{[\s\S]*?\})\s*?\*\//);
  
  if (!metadataMatch) {
    throw new Error('Invalid ISF shader: Missing metadata');
  }
  
  try {
    const metadata = JSON.parse(metadataMatch[1]) as ISFMetadata;
    // Remove the metadata comment to get the actual shader code
    const fragmentShader = source.replace(/\/\*\s*?(\{[\s\S]*?\})\s*?\*\//, '');
    
    return { metadata, fragmentShader };
  } catch (error) {
    throw new Error(`Failed to parse ISF metadata: ${error}`);
  }
}

// Load ISF shader from a URL
export async function loadISFShader(url: string): Promise<{ metadata: ISFMetadata; fragmentShader: string }> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ISF shader: ${response.statusText}`);
  }
  
  const source = await response.text();
  return parseISF(source);
}

// Hook to load and use ISF shader
export function useISFShader(url: string) {
  const [shader, setShader] = useState<{ metadata: ISFMetadata; fragmentShader: string } | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    async function fetchShader() {
      try {
        const result = await loadISFShader(url);
        if (isMounted) {
          setShader(result);
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

  return { shader, error, loading };
}

// Create a basic vertex shader for use with ISF fragment shaders
export const basicVertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// Convert ISF shader to a format compatible with Three.js
export function convertISFToThreeShader(fragmentShader: string): string {
  // Extract metadata from the shader
  const metadataMatch = fragmentShader.match(/\/\*\s*?(\{[\s\S]*?\})\s*?\*\//);
  let uniformDeclarations = '';
  
  if (metadataMatch) {
    try {
      const metadata = JSON.parse(metadataMatch[1]) as ISFMetadata;
      
      // Generate uniform declarations from metadata
      if (metadata.INPUTS) {
        uniformDeclarations = metadata.INPUTS.map(input => {
          const name = input.NAME;
          
          switch (input.TYPE) {
            case 'float':
              return `uniform float ${name};`;
            case 'bool':
              return `uniform bool ${name};`;
            case 'int':
              return `uniform int ${name};`;
            case 'color':
              return `uniform vec4 ${name};`;
            case 'point2d':
              return `uniform vec2 ${name};`;
            case 'point3d':
              return `uniform vec3 ${name};`;
            case 'image':
              return `uniform sampler2D ${name};`;
            default:
              return `uniform float ${name}; // Unknown type: ${input.TYPE}`;
          }
        }).join('\n');
      }
    } catch (error) {
      console.error('Failed to parse ISF metadata:', error);
    }
  }
  
  // Check if the shader already has a main function
  const hasMainFunction = /void\s+main\s*\(\s*\)/.test(fragmentShader);
  
  // Add necessary uniforms and functions that ISF shaders expect
  let preamble = `
// Three.js compatible version of ISF shader
uniform float time;
uniform vec2 resolution;
uniform sampler2D inputImage;

// ISF specific uniforms from metadata
${uniformDeclarations}

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

  if (hasMainFunction) {
    // If the shader already has a main function, just add the preamble and
    // insert the isf_FragNormCoord assignment at the beginning of main
    return preamble + fragmentShader.replace(
      /(void\s+main\s*\(\s*\)\s*\{)/,
      '$1\n  isf_FragNormCoord = vUv;\n'
    );
  } else {
    // If no main function, wrap the shader code in one
    return preamble + `
void main() {
  isf_FragNormCoord = vUv;
  
  ${fragmentShader}
}
`;
  }
}