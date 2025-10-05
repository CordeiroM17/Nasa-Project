  // Match scale from Simulation3D.jsx
  const PLANET_RADIUS_VISUAL = 20;
  const SCALE_VISUAL = 0.0005;
import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const earthMapURL  = "/textures/earthmap4k.jpg";
const earthBumpURL = "/textures/earthbump4k.jpg";
const earthSpecURL = "/textures/earthspec4k.jpg";
const moonMapURL   = "/textures/moonmap4k.jpg";
const moonBumpURL  = "/textures/moonbump4k.jpg";


export default function KeplerSimulation() {
  const canvasRef = useRef(null);

  useEffect(() => {
    let renderer, scene, camera, controls;
    let earth, moon, orbitLine;
    let aSlider, eSlider, iSlider, aValue, eValue, iValue;
    let initialCameraPos;
    let angle = 0;
    let orbitPoints;
    const segments = 128;

    function setupScene() {
      // Initialize scene first
      scene = new THREE.Scene();
      // Add improved star field background (reduce for performance)
      const starCount = 300;
      const starGeometry = new THREE.BufferGeometry();
      const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: true });
      const starVertices = [];
      const minStarDist = 120;
      for (let i = 0; i < starCount; i++) {
        let x, y, z, dist;
        do {
          x = (Math.random() - 0.5) * 1800;
          y = (Math.random() - 0.5) * 1800;
          z = (Math.random() - 0.5) * 1800;
          dist = Math.sqrt(x*x + y*y + z*z);
        } while (dist < minStarDist);
        starVertices.push(x, y, z);
      }
      starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
      const stars = new THREE.Points(starGeometry, starMaterial);
      scene.add(stars);
      // Camera settings copied from Simulation3D.jsx
      camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
      initialCameraPos = new THREE.Vector3(0, 30, 60);
      camera.position.copy(initialCameraPos);
      camera.lookAt(0, 0, 0);
      renderer = new THREE.WebGLRenderer({antialias:true});
      renderer.setSize(window.innerWidth, window.innerHeight * 0.8);
      if (canvasRef.current) {
        canvasRef.current.appendChild(renderer.domElement);
      }
      controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(0,0,0);
      controls.enablePan = false;
      controls.enableZoom = true;
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.update();
      const loader = new THREE.TextureLoader();
      const dirLight = new THREE.DirectionalLight(0xffffff,1);
      dirLight.position.set(10,10,10);
      scene.add(dirLight);
      scene.add(new THREE.AmbientLight(0x404040,0.5));
      const earthTexture  = loader.load(earthMapURL);
      const bumpTexture   = loader.load(earthBumpURL);
      const specTexture   = loader.load(earthSpecURL);
      const earthMaterial = new THREE.MeshPhongMaterial({
        map: earthTexture,
        bumpMap: bumpTexture,
        bumpScale: 0.05,
        specularMap: specTexture,
        specular: new THREE.Color('grey')
      });
      // Use correct scale for earth
      const earthGeometry = new THREE.SphereGeometry(PLANET_RADIUS_VISUAL, 64, 64);
      earth = new THREE.Mesh(earthGeometry, earthMaterial);
      scene.add(earth);

      // Atmosphere (copied from Simulation3D.jsx)
      const atmosphereGeometry = new THREE.SphereGeometry(PLANET_RADIUS_VISUAL * 1.08, 64, 64);
      const atmosphereMaterial = new THREE.ShaderMaterial({
        vertexShader: `
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vNormal;
          void main() {
            float intensity = pow(1.0 - dot(vNormal, vec3(0.0,0.0,1.0)), 3.0);
            gl_FragColor = vec4(0.3,0.9,1.0,0.35) * intensity;
          }
        `,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true,
      });
      const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
      scene.add(atmosphere);
      const moonTexture = loader.load(moonMapURL);
      const moonBump = loader.load(moonBumpURL);
      const moonMaterial = new THREE.MeshPhongMaterial({
        map: moonTexture,
        bumpMap: moonBump,
        bumpScale: 0.03
      });
  // Make moon larger for visibility
  const moonGeometry = new THREE.SphereGeometry(2.5, 32, 32);
  moon = new THREE.Mesh(moonGeometry, moonMaterial);
  scene.add(moon);
      orbitPoints = new Array(segments+1).fill(0).map(()=>new THREE.Vector3());
      orbitLine = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(orbitPoints),
        new THREE.LineBasicMaterial({color:0xffffff})
      );
      scene.add(orbitLine);
    }

    function updateOrbitGeometry(a,e,i){
      // Scale orbit to match planet size
      for(let j=0;j<=segments;j++){
        const theta=(j/segments)*2*Math.PI;
        const r = a*(1-e*e)/(1+e*Math.cos(theta)) * PLANET_RADIUS_VISUAL;
        const x = r*Math.cos(theta);
        const z = r*Math.sin(theta);
        orbitPoints[j].set(x,0,z);
      }
      orbitLine.geometry.setFromPoints(orbitPoints);
      orbitLine.rotation.x = THREE.MathUtils.degToRad(i);
    }

    function updateOrbit(){
      const a = aSlider ? parseFloat(aSlider.value) : 3;
      const e = eSlider ? parseFloat(eSlider.value) : 0;
      const i = iSlider ? parseFloat(iSlider.value) : 0;
      if(aValue) aValue.textContent = a;
      if(eValue) eValue.textContent = e;
      if(iValue) iValue.textContent = i;
      updateOrbitGeometry(a,e,i);
    }

    function animate(){
      requestAnimationFrame(animate);
      if (!renderer || !scene || !camera || !moon || !earth) {
        console.warn("[KeplerSimulation] animate: missing objects", {renderer, scene, camera, moon, earth});
        return;
      }
    const a = aSlider ? parseFloat(aSlider.value) : 3;
    const e = eSlider ? parseFloat(eSlider.value) : 0;
    const i = iSlider ? parseFloat(iSlider.value) : 0;
    const r = a*(1-e*e)/(1+e*Math.cos(angle)) * PLANET_RADIUS_VISUAL;
    let pos = new THREE.Vector3(r*Math.cos(angle),0,r*Math.sin(angle));
    pos.applyAxisAngle(new THREE.Vector3(1,0,0), THREE.MathUtils.degToRad(i));
    moon.position.copy(pos);
      earth.rotation.y += 0.0008;
      moon.rotation.y += 0.001;
      controls.update();
      renderer.render(scene,camera);
      angle += 0.02;
    }

    function setupUI() {
      aSlider = document.getElementById('aSlider');
      eSlider = document.getElementById('eSlider');
      iSlider = document.getElementById('iSlider');
      aValue = document.getElementById('aValue');
      eValue = document.getElementById('eValue');
      iValue = document.getElementById('iValue');
      if(aSlider) aSlider.addEventListener('input', updateOrbit);
      if(eSlider) eSlider.addEventListener('input', updateOrbit);
      if(iSlider) iSlider.addEventListener('input', updateOrbit);
      const resetCameraBtn = document.getElementById('resetCameraBtn');
      if(resetCameraBtn) resetCameraBtn.addEventListener('click', ()=>{
        camera.position.copy(initialCameraPos);
        controls.target.set(0,0,0);
        controls.update();
      });
      const resetOrbitBtn = document.getElementById('resetOrbitBtn');
      if(resetOrbitBtn) resetOrbitBtn.addEventListener('click', ()=>{
        if(aSlider) aSlider.value = 3;
        if(eSlider) eSlider.value = 0;
        if(iSlider) iSlider.value = 0;
        updateOrbit();
      });
    }

    function handleResize() {
      camera.aspect = window.innerWidth/window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight * 0.8);
    }

  console.log("[KeplerSimulation] Starting setup...");
  setupScene();
  setupUI();
  updateOrbit();
  animate();
  window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if(canvasRef.current && canvasRef.current.firstChild) {
        canvasRef.current.removeChild(canvasRef.current.firstChild);
      }
    };
  }, []);

  // Height of navbar (adjust if needed)
  // Remove marginTop and let parent Astro page handle spacing below navbar
  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      background: '#000',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
    }}>
  <div style={{ position: 'fixed', top: 96, right: 32, zIndex: 30, display: 'flex', gap: 12 }}>
        <button
          style={{
            background: 'var(--color-primary-200, #efefef)',
            color: 'var(--color-primary-400, #0a3143)',
            border: '2px solid var(--color-primary-100, #276e90)',
            borderRadius: 12,
            padding: '12px 24px',
            fontWeight: 700,
            fontSize: 16,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            cursor: 'pointer',
          }}
          onClick={() => { window.location.href = '/asteroid-simulation'; }}>
          2D
        </button>
        <button
          style={{
            background: 'var(--color-primary-200, #efefef)',
            color: 'var(--color-primary-400, #0a3143)',
            border: '2px solid var(--color-primary-100, #276e90)',
            borderRadius: 12,
            padding: '12px 24px',
            fontWeight: 700,
            fontSize: 16,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            cursor: 'pointer',
          }}
          onClick={() => { window.location.href = '/asteroid-simulation-3d'; }}>
          3D
        </button>
      </div>
      <div
        id="ui"
        style={{
          position: 'absolute',
          top: 24,
          left: 24,
          background: 'rgba(30, 41, 59, 0.92)',
          color: 'white',
          padding: '24px 28px',
          borderRadius: 16,
          zIndex: 10,
          boxShadow: '0 2px 16px rgba(0,0,0,0.12)',
          minWidth: 320,
          maxWidth: 380,
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        <label style={{ fontWeight: 700, marginBottom: 4 }}>Semieje mayor (a): <span id="aValue">3</span></label>
        <input type="range" id="aSlider" min="2" max="8" step="0.1" defaultValue="3" style={{ width: '100%', marginBottom: 8 }} />
        <label style={{ fontWeight: 700, marginBottom: 4 }}>Excentricidad (e): <span id="eValue">0</span></label>
        <input type="range" id="eSlider" min="-0.35" max="0.35" step="0.01" defaultValue="0" style={{ width: '100%', marginBottom: 8 }} />
        <label style={{ fontWeight: 700, marginBottom: 4 }}>Inclinación (i): <span id="iValue">0</span>°</label>
        <input type="range" id="iSlider" min="-90" max="90" step="1" defaultValue="0" style={{ width: '100%', marginBottom: 8 }} />
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button id="resetCameraBtn" style={{ flex: 1, background: '#2563eb', color: 'white', borderRadius: 8, padding: '10px 0', fontWeight: 700, fontSize: 16, border: 'none', cursor: 'pointer' }}>Reset Cámara</button>
          <button id="resetOrbitBtn" style={{ flex: 1, background: '#2563eb', color: 'white', borderRadius: 8, padding: '10px 0', fontWeight: 700, fontSize: 16, border: 'none', cursor: 'pointer' }}>Reset Órbita</button>
        </div>
      </div>
      <div ref={canvasRef} style={{
        width: '100vw',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
      }}></div>
    </div>
  );
}
