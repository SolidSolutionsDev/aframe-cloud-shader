
AFRAME.registerShader('flat-cloud', {
    // The schema declares any parameters for the shader.
    schema: {
        // Where relevant, it is customary to support color.
        // The A-Frame schema uses `type:'color'`, so it will parse string values like 'white' or 'red.
        // `is:'uniform'` tells A-Frame this should appear as uniform value in the shader(s).
        // It is customary to support opacity, for fading in and out.
        opacity: { type: 'number', is: 'uniform', default: 1.0 },
        intensity: { type: 'number', is: 'uniform', default: 1.0 },
        saturation: { type: 'number', is: 'uniform', default: 0.0 },
        time: { type: 'time', is: 'uniform' },
    },

    // Setting raw to true uses THREE.RawShaderMaterial instead of ShaderMaterial,
    // so your shader strings are used as-is, for advanced shader usage.
    // Here, we want the usual prefixes with GLSL constants etc.,
    // so we set it to false.
    // (Which is also the default, so we could have omitted it).
    raw: false,

    // Here, we're going to use the default vertex shader by omitting vertexShader.
    // But note that if your fragment shader cares about texture coordinates,
    // the vertex shader should set varying values to use in the fragment shader. 

    // Since almost every WebVR-capable browser supports ES6,
    // define our fragment shader as a multi-line string.
    vertexShader:
        `
        varying vec3 vColor;
        varying vec3 vWorldPosition;
        void main() {
            vColor = color;
            vec4 worldPosition = modelViewMatrix * vec4( position, 1.0 );
            vWorldPosition = position;
            gl_Position = projectionMatrix * worldPosition;
        }
        `,
    fragmentShader:
        `
        // Use medium precision.
        precision mediump float;

        // This receives the opacity value from the schema, which becomes a number.
        uniform float opacity;
        uniform float intensity;
        uniform float saturation;
        uniform float time;

        varying vec3 vColor;
        varying vec3 vWorldPosition;


        float noise_randomValue(vec2 uv) { return fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453); }
        float noise_interpolate(float a, float b, float t) { return (1.0 - t) * a + (t * b); }
        float valueNoise(vec2 uv) {
            vec2 i = floor(uv);
            vec2 f = fract(uv);
            f = f * f * (3.0 - 2.0 * f);
            uv = abs(fract(uv) - 0.5);
            vec2 c0 = i + vec2(0.0, 0.0);
            vec2 c1 = i + vec2(1.0, 0.0);
            vec2 c2 = i + vec2(0.0, 1.0);
            vec2 c3 = i + vec2(1.0, 1.0);
            float r0 = noise_randomValue(c0);
            float r1 = noise_randomValue(c1);
            float r2 = noise_randomValue(c2);
            float r3 = noise_randomValue(c3);
            float bottomOfGrid = noise_interpolate(r0, r1, f.x);
            float topOfGrid = noise_interpolate(r2, r3, f.x);
            float t = noise_interpolate(bottomOfGrid, topOfGrid, f.y);
            return t;
        }

        float SimpleNoise(vec2 UV) {
            float t = 0.0;
            float freq = pow(2.0, 0.0);
            float amp = pow(0.5, 3.0 - 0.0);
            t += valueNoise(UV / freq) * amp;
            freq = pow(2.0, float(1));
            amp = pow(0.5, float(3 - 1));
            t += valueNoise(UV / freq) * amp;
            freq = pow(2.0, float(2));
            amp = pow(0.5, float(3 - 2));
            t += valueNoise(UV / freq) * amp;
            return t;
        }

        float map(float value, float min1, float max1, float min2, float max2) {
            return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
        }

        vec3 cloudColor() {
            
            float positionScale = 0.001;
            vec2 positionScaled = (vec2(vWorldPosition.x *positionScale, vWorldPosition.z*positionScale));
            
            //Append - speed is the 10,10
            float _time = time * 0.0005;
            vec2 panner = ( 1.0 * _time * vec2( 10.0,10.0 ) + positionScaled);

            // Panner + Scale (0.1) + Texture Sample (SimpleNoise)
            float v4SimpleNoise = SimpleNoise( panner );

            // RGBA
            vec4 v4Noise = vec4(map(v4SimpleNoise,0.,1.,.8,1.));
            //vec4 v4Noise = vec4(v4SimpleNoise);
            
            // v4Noise is source

            // Blend Operations
            vec4 vColorOriginal = vec4(vColor,0.0);
            vec4 vColorIntensity = (vec4(vColor,0.0) * intensity );
            vec4 vColorIntensityAndSaturation = mix(vColorIntensity,( vColorOriginal * vColorIntensity ),saturation);

            vec4 vColorIntensityAndSaturationClamped = ( clamp( vColorIntensityAndSaturation, 0.0, 1.0 ));
            vec4 vMixedColorWithNoise = mix(vColorIntensityAndSaturationClamped,( (v4Noise) * vColorIntensityAndSaturationClamped ),1.0);
            
            
            vec4 finalColor = ( clamp( vMixedColorWithNoise, 0.0, 1.0 ));
            return finalColor.xyz;
        }

        // This is the shader program.
        // A fragment shader can set the color via gl_FragColor,
        // or decline to draw anything via discard.
        void main() {
            // Note that this shader doesn't use texture coordinates.
            // Set the RGB portion to our color,
            // and the alpha portion to our opacity.
            vec3 cloudColor = cloudColor();
            gl_FragColor = vec4(cloudColor, opacity);
        }
    `
});