/**
 * Three.js Background — Topographic Breathing Mesh
 * A dark wireframe plane deformed by Perlin noise,
 * moving slowly like it's breathing. Linear.app / Apple vibes.
 */
(function () {
    'use strict';

    const canvas = document.getElementById('three-canvas');
    if (!canvas) return;

    // ── Scene Setup ──
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 3.5, 5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x050505, 1);

    // ── Perlin Noise (Classic 3D) ──
    // Simplified permutation-based noise
    const perm = new Uint8Array(512);
    const grad3 = [[1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0], [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1], [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]];
    (function initPerm() {
        const p = [];
        for (let i = 0; i < 256; i++) p[i] = i;
        for (let i = 255; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[p[i], p[j]] = [p[j], p[i]]; }
        for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
    })();

    function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    function lerp(a, b, t) { return a + t * (b - a); }
    function dot3(g, x, y, z) { return g[0] * x + g[1] * y + g[2] * z; }

    function noise3D(x, y, z) {
        const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
        x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
        const u = fade(x), v = fade(y), w = fade(z);
        const A = perm[X] + Y, AA = perm[A] + Z, AB = perm[A + 1] + Z;
        const B = perm[X + 1] + Y, BA = perm[B] + Z, BB = perm[B + 1] + Z;
        return lerp(
            lerp(lerp(dot3(grad3[perm[AA] % 12], x, y, z), dot3(grad3[perm[BA] % 12], x - 1, y, z), u),
                lerp(dot3(grad3[perm[AB] % 12], x, y - 1, z), dot3(grad3[perm[BB] % 12], x - 1, y - 1, z), u), v),
            lerp(lerp(dot3(grad3[perm[AA + 1] % 12], x, y, z - 1), dot3(grad3[perm[BA + 1] % 12], x - 1, y, z - 1), u),
                lerp(dot3(grad3[perm[AB + 1] % 12], x, y - 1, z - 1), dot3(grad3[perm[BB + 1] % 12], x - 1, y - 1, z - 1), u), v), w);
    }

    // ── Mesh ──
    const segments = 80;
    const geo = new THREE.PlaneGeometry(12, 12, segments, segments);
    geo.rotateX(-Math.PI / 2.3);

    const mat = new THREE.ShaderMaterial({
        wireframe: true,
        transparent: true,
        uniforms: {
            uColor: { value: new THREE.Color(0x6366f1) },
            uOpacity: { value: 0.08 }
        },
        vertexShader: `
            varying float vElevation;
            void main() {
                vElevation = position.y;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 uColor;
            uniform float uOpacity;
            varying float vElevation;
            void main() {
                float alpha = uOpacity + smoothstep(0.0, 0.5, vElevation) * 0.07;
                gl_FragColor = vec4(uColor, alpha);
            }
        `
    });

    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    // ── Floating particles ──
    const particleCount = 60;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSpeeds = [];

    for (let i = 0; i < particleCount; i++) {
        particlePositions[i * 3] = (Math.random() - 0.5) * 10;
        particlePositions[i * 3 + 1] = Math.random() * 3;
        particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 10;
        particleSpeeds.push(0.002 + Math.random() * 0.005);
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMat = new THREE.PointsMaterial({
        size: 1.5,
        color: 0x6366f1,
        transparent: true,
        opacity: 0.2,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ── Mouse tracking ──
    let mouseX = 0, mouseY = 0;
    let targetMouseX = 0, targetMouseY = 0;

    document.addEventListener('mousemove', (e) => {
        targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    // ── Visibility API — pause when tab inactive ──
    let isActive = true;
    document.addEventListener('visibilitychange', () => {
        isActive = !document.hidden;
    });

    // ── Animate ──
    const positions = geo.attributes.position;
    const originalY = new Float32Array(positions.count);
    for (let i = 0; i < positions.count; i++) {
        originalY[i] = positions.getY(i);
    }

    let clock = 0;

    function animate() {
        requestAnimationFrame(animate);
        if (!isActive) return;

        clock += 0.004; // Very slow breathing

        // Smooth mouse
        mouseX += (targetMouseX - mouseX) * 0.03;
        mouseY += (targetMouseY - mouseY) * 0.03;

        // Deform mesh with Perlin noise
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const z = positions.getZ(i);
            const n = noise3D(x * 0.3 + clock, z * 0.3 + clock * 0.5, clock * 0.8);
            positions.setY(i, originalY[i] + n * 0.45);
        }
        positions.needsUpdate = true;

        // Subtle camera movement based on mouse
        camera.position.x += (mouseX * 0.3 - camera.position.x) * 0.02;
        camera.position.y += (3.5 - mouseY * 0.2 - camera.position.y) * 0.02;
        camera.lookAt(0, 0, 0);

        // Animate particles slowly upward
        const pp = particles.geometry.attributes.position;
        for (let i = 0; i < particleCount; i++) {
            let y = pp.getY(i);
            y += particleSpeeds[i];
            if (y > 4) {
                pp.setX(i, (Math.random() - 0.5) * 10);
                y = -0.5;
                pp.setZ(i, (Math.random() - 0.5) * 10);
            }
            pp.setY(i, y);
        }
        pp.needsUpdate = true;

        renderer.render(scene, camera);
    }

    animate();

    // ── Resize ──
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Expose for slide-based color shifting and theme
    window.threeBg = {
        setAccent(hex) {
            mat.uniforms.uColor.value.set(hex);
            particleMat.color.set(hex);
        },
        setTheme(theme) {
            if (theme === 'light') {
                renderer.setClearColor(0xfafaf9, 1);
                mat.uniforms.uColor.value.set(0x4f46e5);
                mat.uniforms.uOpacity.value = 0.12;
                particleMat.color.set(0x4f46e5);
                particleMat.opacity = 0.15;
                particleMat.blending = THREE.NormalBlending;
            } else {
                renderer.setClearColor(0x050505, 1);
                mat.uniforms.uColor.value.set(0x6366f1);
                mat.uniforms.uOpacity.value = 0.08;
                particleMat.color.set(0x6366f1);
                particleMat.opacity = 0.2;
                particleMat.blending = THREE.AdditiveBlending;
            }
            particleMat.needsUpdate = true;
        }
    };
})();
