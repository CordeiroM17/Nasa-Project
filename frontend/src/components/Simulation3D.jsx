
import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const EARTH_COLOR_MAP = "/textures/earthmap4k.jpg";
const EARTH_BUMP_MAP = "/textures/earthbump4k.jpg";
const EARTH_SPEC_MAP = "/textures/earthspec4k.jpg";
const CRATER_TEXTURE_URL = "/textures/crater.png";
const SKYBOX_TEXTURE_URL = "/textures/skybox.jpg";

const styles = {
  panel: {
    position: "absolute",
    left: 24,
    top: 24,
    background: "var(--color-borders-100, #F7F4ED)",
    color: "var(--color-primary-400, #0a3143)",
    padding: 24,
    fontFamily: "sans-serif",
    borderRadius: 16,
    zIndex: 10,
    boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
    border: "2px solid var(--color-primary-100, #276e90)",
    minWidth: 260,
    maxWidth: 340,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  label: {
    fontWeight: 600,
    marginBottom: 4,
    color: "var(--color-primary-400, #0a3143)",
  },
  input: {
    borderRadius: 8,
    border: "1px solid var(--color-primary-100, #276e90)",
    padding: "6px 10px",
    fontSize: 16,
    marginBottom: 8,
    background: "var(--color-primary-200, #efefef)",
    color: "var(--color-primary-400, #0a3143)",
    outline: "none",
  },
  button: {
    background: "var(--color-primary-100, #276e90)",
    color: "var(--color-primary-200, #efefef)",
    border: "1px solid var(--color-primary-400, #0a3143)",
    borderRadius: 8,
    padding: "10px 0",
    fontWeight: 700,
    fontSize: 16,
    marginBottom: 8,
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    transition: "background 0.2s",
  },
  info: {
    marginTop: 12,
    background: "var(--color-primary-300, #cecfc9)",
    color: "var(--color-primary-500, #0c1421)",
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    fontWeight: 500,
    minHeight: 40,
  },
};

export default function Simulation3D({ latitude, longitude }) {
  const canvasRef = useRef(null);
  const infoRef = useRef(null);
  const latRef = useRef(null);
  const lonRef = useRef(null);
  const lastCoords = useRef({ lat: null, lon: null });
  const shootMeteorRef = useRef(null);

  useEffect(() => {
    const meteors = [];
    const PLANET_RADIUS_VISUAL = 20;
    const PLANET_RADIUS_REAL = 6371000;
    const SCALE_VISUAL = 0.0005;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      canvas.offsetWidth / canvas.offsetHeight,
      0.1,
      1000
    );
    camera.position.set(0, 30, 60);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.minDistance = 22;
    controls.maxDistance = 200;

    scene.add(new THREE.AmbientLight(0x888888));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(50, 50, 50);
    scene.add(directionalLight);

    const loader = new THREE.TextureLoader();
    const colorMap = loader.load(EARTH_COLOR_MAP);
    const bumpMap = loader.load(EARTH_BUMP_MAP);
    const specMap = loader.load(EARTH_SPEC_MAP);

    const planetMaterial = new THREE.MeshPhongMaterial({
      map: colorMap,
      bumpMap: bumpMap,
      bumpScale: 0.5,
      specularMap: specMap,
      specular: new THREE.Color("grey"),
    });
    const planetGeometry = new THREE.SphereGeometry(PLANET_RADIUS_VISUAL, 64, 64);
    const planet = new THREE.Mesh(planetGeometry, planetMaterial);
    scene.add(planet);

    const atmosphereGeometry = new THREE.SphereGeometry(
      PLANET_RADIUS_VISUAL * 1.08,
      64,
      64
    );
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

    // Fondo negro puro
    renderer.setClearColor(0x000000, 1);

    // Añadir estrellas
    const starCount = 400;
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 1.2 });
    const starVertices = [];
    for (let i = 0; i < starCount; i++) {
      let x, y, z, dist;
      const minStarDist = 120;
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

  // Meteorito
  class MeteorScientific {
    constructor(position, mass, type) {
      this.mass = mass;
      this.type = type;
      this.mesh = new THREE.Mesh(
        new THREE.SphereGeometry(this.getRadiusVisual(), 16, 16),
        new THREE.MeshPhongMaterial({ color: this.getColor() })
      );
      this.mesh.position.copy(position);
      scene.add(this.mesh);

      this.trailPositions = [];
      this.trailGeometry = new THREE.BufferGeometry();
      this.trailMaterial = new THREE.PointsMaterial({ color: 0xff6600, size: 0.3 });
      this.trail = new THREE.Points(this.trailGeometry, this.trailMaterial);
      scene.add(this.trail);

      this.velocity = new THREE.Vector3(0, -this.getImpactVelocityVisual(), 0);
    }
    getRadiusVisual() {
      const density = this.type === "rock" ? 3000 : 7800;
      const r = Math.cbrt((3 * this.mass) / (4 * Math.PI * density));
      return r * SCALE_VISUAL;
    }
    getColor() {
      return this.type === "rock" ? 0x888888 : 0xaaaaaa;
    }
    getImpactVelocityVisual() {
      const g = 9.81;
      const h = 100000;
      const v0 = 11000;
      return Math.sqrt(v0 * v0 + 2 * g * h) * SCALE_VISUAL;
    }
    update(delta) {
      this.mesh.position.add(this.velocity.clone().multiplyScalar(delta));
      this.trailPositions.push(this.mesh.position.clone());
      if (this.trailPositions.length > 30) this.trailPositions.shift();
      const positions = [];
      this.trailPositions.forEach((p) => positions.push(p.x, p.y, p.z));
      this.trail.geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(positions, 3)
      );
      this.trail.geometry.needsUpdate = true;
    }
    checkImpact() {
      const distance = this.mesh.position.distanceTo(planet.position);
      return distance <= PLANET_RADIUS_VISUAL;
    }
    calculateImpact() {
      const v_mag = this.velocity.length() * (PLANET_RADIUS_REAL / PLANET_RADIUS_VISUAL);
      const E = 0.5 * this.mass * Math.pow(v_mag, 2);
      const craterDiameterReal = 1.3 * Math.cbrt(this.mass / 2500) * Math.pow(v_mag, 0.44);
      const craterDiameterVisual = craterDiameterReal * SCALE_VISUAL;
      return { energy: E, craterDiameterReal, craterDiameterVisual };
    }
    destroy() {
      scene.remove(this.mesh);
      scene.remove(this.trail);
    }
  }

  // Helper: Convert 3D point on sphere to lat/lon
  function vector3ToLatLon(vec, radius) {
    const x = vec.x, y = vec.y, z = vec.z;
    const lat = 90 - (Math.acos(y / radius) * 180 / Math.PI);
  const lon = -Math.atan2(z, x) * 180 / Math.PI;
  return { lat, lon };
  }

  // Click event: set lat/lon inputs when clicking on planet
  function handleCanvasClick(event) {
    const rect = canvas.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(planet);
    if (intersects.length > 0) {
      const point = intersects[0].point;
      const coords = vector3ToLatLon(point, PLANET_RADIUS_VISUAL);
      if (latRef.current) latRef.current.value = coords.lat.toFixed(4);
      if (lonRef.current) lonRef.current.value = coords.lon.toFixed(4);
    }
  }
// ...existing code...

    function applyGravity(meteor, delta) {
      const dir = planet.position.clone().sub(meteor.mesh.position).normalize();
      meteor.velocity.add(dir.multiplyScalar(10 * delta));
    }

    function createImpactEffect(position, craterDiameter, impactData) {
      const normal = position.clone().sub(planet.position).normalize();
      const craterPos = planet.position.clone().add(normal.clone().multiplyScalar(PLANET_RADIUS_VISUAL));
      const craterTex = CRATER_TEXTURE_URL ? loader.load(CRATER_TEXTURE_URL) : null;
      const craterMat = new THREE.MeshBasicMaterial({
        map: craterTex,
        side: THREE.DoubleSide,
        transparent: true,
        alphaTest: 0.1,
      });
      const craterGeom = new THREE.CircleGeometry(craterDiameter / 2, 32);
      craterGeom.rotateX(-Math.PI / 2);
      const crater = new THREE.Mesh(craterGeom, craterMat);
      crater.position.copy(craterPos);
      crater.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
      scene.add(crater);

      const geom = new THREE.SphereGeometry(0.5, 8, 8);
      const mat = new THREE.MeshBasicMaterial({ color: 0xff6600 });
      const impact = new THREE.Mesh(geom, mat);
      impact.position.copy(craterPos);
      scene.add(impact);

      let scale = 0.5,
        maxScale = 5;
      function expand() {
        scale += 0.5;
        impact.scale.set(scale, scale, scale);
        if (scale < maxScale) requestAnimationFrame(expand);
        else scene.remove(impact);
      }
      expand();

      if (infoRef.current) {
        infoRef.current.innerHTML = `
          <b>Impacto!</b><br>
          Energía: ${impactData.energy.toExponential(2)} J<br>
          Cráter: ${impactData.craterDiameterReal.toFixed(2)} m
        `;
      }
    }

  function shootMeteor() {
    const spawnRadius = PLANET_RADIUS_VISUAL + 50; // lejos del planeta
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);

    const x = spawnRadius * Math.sin(phi) * Math.cos(theta);
    const y = spawnRadius * Math.cos(phi);
    const z = spawnRadius * Math.sin(phi) * Math.sin(theta);

    const mass = Math.random() * 5000 + 1000;
    const type = Math.random() > 0.5 ? "rock" : "metal";
    const meteor = new MeteorScientific(new THREE.Vector3(x, y, z), mass, type);

    // Dirección hacia el centro de la Tierra
    const dir = planet.position.clone().sub(meteor.mesh.position).normalize();
    meteor.velocity = dir.multiplyScalar(meteor.getImpactVelocityVisual());

    meteors.push(meteor);
    }

    // Store shootMeteor in ref for external access
    shootMeteorRef.current = shootMeteor;

    function latLonToVector3(lat, lon, radius) {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      const x = -radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);
      return new THREE.Vector3(x, y, z);
    }

    function shootMeteorAt(lat, lon) {
      const targetPos = latLonToVector3(lat, lon, PLANET_RADIUS_VISUAL);
      const startPos = targetPos.clone().normalize().multiplyScalar(PLANET_RADIUS_VISUAL + 50);
      const mass = Math.random() * 5000 + 1000;
      const type = Math.random() > 0.5 ? "rock" : "metal";
      const meteor = new MeteorScientific(startPos, mass, type);
      const dir = targetPos.clone().sub(startPos).normalize();
      meteor.velocity = dir.multiplyScalar(meteor.getImpactVelocityVisual());
      meteors.push(meteor);
    }

    // Automatic meteor shot when props change
    if (typeof latitude === "number" && typeof longitude === "number") {
      if (
        lastCoords.current.lat !== latitude ||
        lastCoords.current.lon !== longitude
      ) {
        shootMeteorAt(latitude, longitude);
        lastCoords.current = { lat: latitude, lon: longitude };
      }
    }

    function handleShootMeteor() {
      shootMeteor();
    }

    function handleShootCoords() {
      const lat = parseFloat(latRef.current.value);
      const lon = parseFloat(lonRef.current.value);
      if (!isNaN(lat) && !isNaN(lon)) shootMeteorAt(lat, lon);
    }

    if (canvas) {
      // Attach event listeners to buttons
      const shootBtn = document.getElementById("shootMeteor");
      const shootCoordsBtn = document.getElementById("shootMeteorCoords");
      if (shootBtn) shootBtn.onclick = handleShootMeteor;
      if (shootCoordsBtn) shootCoordsBtn.onclick = handleShootCoords;
    }

    const clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();
      for (let i = meteors.length - 1; i >= 0; i--) {
        const meteor = meteors[i];
        applyGravity(meteor, delta);
        meteor.update(delta);
        if (meteor.checkImpact()) {
          const impactData = meteor.calculateImpact();
          createImpactEffect(meteor.mesh.position, impactData.craterDiameterVisual, impactData);
          meteor.destroy();
          meteors.splice(i, 1);
        }
      }
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    function handleResize() {
      camera.aspect = canvas.offsetWidth / canvas.offsetHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
    }
    window.addEventListener("resize", handleResize);
    canvas.addEventListener("click", handleCanvasClick);
    return () => {
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("click", handleCanvasClick);
      renderer.dispose();
    };
  }, []);

  function handleRandomMeteorite() {
    // Dispara un meteorito aleatorio usando la ref
    if (shootMeteorRef.current) {
      shootMeteorRef.current();
    }
  }

  return (
    <div style={{ width: "100vw", height: "80vh", position: "relative", margin: 0, padding: 0, boxSizing: 'border-box' }}>
      <div style={{ position: "absolute", top: 24, right: 32, zIndex: 20, display: "flex", gap: 12 }}>
        <button
          style={{
            background: "var(--color-primary-200, #efefef)",
            color: "var(--color-primary-400, #0a3143)",
            border: "2px solid var(--color-primary-100, #276e90)",
            borderRadius: 12,
            padding: "12px 24px",
            fontWeight: 700,
            fontSize: 16,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            cursor: "pointer",
          }}
          onClick={() => { window.location.href = "/kepler-orbit"; }}>
          Kepler
        </button>
        <button
          style={{
            background: "var(--color-primary-200, #efefef)",
            color: "var(--color-primary-400, #0a3143)",
            border: "2px solid var(--color-primary-100, #276e90)",
            borderRadius: 12,
            padding: "12px 24px",
            fontWeight: 700,
            fontSize: 16,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            cursor: "pointer",
          }}
          onClick={() => { window.location.href = "/asteroid-simulation"; }}>
          2D
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
        <label style={{ fontWeight: 700, marginBottom: 4 }}>Latitud:</label>
        <input
          ref={latRef}
          id="latInput"
          type="number"
          placeholder="Ej: 40.71"
          step="0.01"
          style={{ width: '100%', marginBottom: 8, borderRadius: 8, border: 'none', padding: '8px', fontSize: 16 }}
        />
        <label style={{ fontWeight: 700, marginBottom: 4 }}>Longitud:</label>
        <input
          ref={lonRef}
          id="lonInput"
          type="number"
          placeholder="Ej: -74.00"
          step="0.01"
          style={{ width: '100%', marginBottom: 8, borderRadius: 8, border: 'none', padding: '8px', fontSize: 16 }}
        />
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button style={{ flex: 1, background: '#2563eb', color: 'white', borderRadius: 8, padding: '10px 0', fontWeight: 700, fontSize: 16, border: 'none', cursor: 'pointer' }} onClick={handleRandomMeteorite}>
            Disparar meteorito aleatorio
          </button>
          <button id="shootMeteorCoords" style={{ flex: 1, background: '#2563eb', color: 'white', borderRadius: 8, padding: '10px 0', fontWeight: 700, fontSize: 16, border: 'none', cursor: 'pointer' }}>
            Disparar a coordenadas
          </button>
        </div>
        <div ref={infoRef} id="impactInfo" style={{ marginTop: 12, background: 'rgba(255,255,255,0.08)', color: 'white', borderRadius: 8, padding: 10, fontSize: 15, fontWeight: 500, minHeight: 40 }}></div>
      </div>
      <canvas
        ref={canvasRef}
        id="three-canvas"
        style={{ position: "absolute", top: 0, left: 0, width: "100vw", height: "80vh", zIndex: 0, display: "block", margin: 0, padding: 0, boxSizing: 'border-box' }}
      ></canvas>
    </div>
  );
}
