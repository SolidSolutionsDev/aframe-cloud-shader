import * as dat from "dat.gui";

const uniforms = {
    opacity: 1,
    colorIntensity: 1,
    shadowIntensity: 0.2,
    saturation: 0,
    speedX: 1,
    speedY: 1,
};

const gui = new dat.GUI();
gui.add(uniforms, "opacity");
gui.add(uniforms, "colorIntensity");
gui.add(uniforms, "shadowIntensity");
gui.add(uniforms, "saturation");
gui.add(uniforms, "speedX");
gui.add(uniforms, "speedX");

AFRAME.registerShader("flat-cloud", {
    schema: {
        opacity: { type: "number", is: "uniform", default: uniforms.opacity },

        colorIntensity: {
            type: "number",
            is: "uniform",
            default: uniforms.colorIntensity,
        },
        shadowIntensity: {
            type: "number",
            is: "uniform",
            default: uniforms.shadowIntensity,
        },

        saturation: {
            type: "number",
            is: "uniform",
            default: uniforms.saturation,
        },

        speedX: {
            type: "number",
            is: "uniform",
            default: uniforms.speedX,
        },
        speedY: {
            type: "number",
            is: "uniform",
            default: uniforms.speedY,
        },

        time: { type: "time", is: "uniform" },
    },

    raw: false,

    vertexShader: /* glsl */ `
        varying vec3 vColor;
        varying vec3 vWorldPosition;
        void main() {
            vColor = color;
            vec4 worldPosition = modelViewMatrix * vec4( position, 1.0 );
            vWorldPosition = position;
            gl_Position = projectionMatrix * worldPosition;
        }
        `,
    fragmentShader: /* glsl */ `
        precision mediump float;

        uniform float opacity;
        uniform float colorIntensity;
        uniform float shadowIntensity;
        uniform float saturation;
        uniform float speedX;
        uniform float speedY;
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
            
            float _time = time * 0.0005;
            vec2 panner = ( 1.0 * _time * vec2( 10.0 * speedX,10.0 * speedY ) + positionScaled);

            float v4SimpleNoise = SimpleNoise( panner );

            vec4 v4Noise = vec4(map(v4SimpleNoise,0.,1.,1. - shadowIntensity,1.));

            vec4 vColorOriginal = vec4(vColor,0.0);
            vec4 vColorIntensity = (vec4(vColor,0.0) * colorIntensity );
            vec4 vColorIntensityAndSaturation = mix(vColorIntensity,( vColorOriginal * vColorIntensity ),saturation);

            vec4 vColorIntensityAndSaturationClamped = ( clamp( vColorIntensityAndSaturation, 0.0, 1.0 ));
            vec4 vMixedColorWithNoise = mix(vColorIntensityAndSaturationClamped,( (v4Noise) * vColorIntensityAndSaturationClamped ),1.0);
            
            
            vec4 finalColor = ( clamp( vMixedColorWithNoise, 0.0, 1.0 ));
            return finalColor.xyz;
        }

        void main() {
            vec3 cloudColor = cloudColor();
            gl_FragColor = vec4(cloudColor, opacity);
        }
    `,
});

AFRAME.registerComponent("uniform-updater", {
    tick: function () {
        this.el.components.material.material.uniforms.colorIntensity.value =
            uniforms.colorIntensity;

        this.el.components.material.material.uniforms.shadowIntensity.value =
            uniforms.shadowIntensity;

        this.el.components.material.material.uniforms.saturation.value =
            uniforms.saturation;

        this.el.components.material.material.uniforms.speedX.value =
            uniforms.speedX;

        this.el.components.material.material.uniforms.speedY.value =
            uniforms.speedY;
    },
});
