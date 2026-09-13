/* ============================================================
   Three.js GLTF Viewer — Real-time 3D visualization of the
   Metric Spatial Contract (B-Rep solids from the CAD engine).
   
   Synchronized with the BOQ ledger in real time.
============================================================ */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { MetricSpatialContract, Room } from '../lib/spatial-bridge.ts';
import { layoutToMeshData } from '../lib/spatial-bridge.ts';

const MM_TO_M = 0.001; // Convert millimetres to metres for Three.js

export interface ViewerOptions {
  canvas: HTMLCanvasElement;
  enableControls?: boolean;
  autoRotate?: boolean;
  backgroundColor?: THREE.ColorRepresentation;
}

export interface RoomMesh {
  roomId: string;
  mesh: THREE.Group;
  floorArea: number;
  volume: number;
}

export class SpatialViewer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls | null = null;
  private canvas: HTMLCanvasElement;
  private autoRotate: boolean;
  private animateId: number | null = null;
  private roomMeshes: Map<string, RoomMesh> = new Map();
  private boqLedger: Map<string, { quantity: number; rate: number; total: number }> = new Map();
  private gltfLoader: GLTFLoader;

  constructor(options: ViewerOptions) {
    this.canvas = options.canvas;
    this.autoRotate = options.autoRotate ?? false;
    this.gltfLoader = new GLTFLoader();

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(options.backgroundColor ?? 0x1a1a1a);

    // Camera
    const width = this.canvas.clientWidth || 800;
    const height = this.canvas.clientHeight || 600;
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.01, 10000);
    this.camera.position.set(10, 8, 12);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;

    // Controls
    if (options.enableControls) {
      this.controls = new OrbitControls(this.camera, this.canvas);
      this.controls.enableDamping = true;
    }

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    this.scene.add(dirLight);

    // Grid
    const gridHelper = new THREE.GridHelper(50, 100, 0x333333, 0x222222);
    this.scene.add(gridHelper);

    // Handle resize
    window.addEventListener('resize', this._onResize.bind(this));
  }

  private _onResize(): void {
    const width = this.canvas.clientWidth || 800;
    const height = this.canvas.clientHeight || 600;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Load a GLB file from the CAD engine.
   * @param url URL or path to .glb file
   * @param roomId Optional room ID to associate with this mesh
   */
  async loadGLB(url: string, roomId?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf) => {
          const group = gltf.scene;
          group.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              if (child.material) {
                child.material = new THREE.MeshStandardMaterial({
                  color: child.material.color || 0x888888,
                  metalness: 0.1,
                  roughness: 0.7,
                });
              }
            }
          });
          this.scene.add(group);
          
          if (roomId) {
            this.roomMeshes.set(roomId, {
              roomId,
              mesh: group,
              floorArea: 0,
              volume: 0,
            });
          }
          resolve();
        },
        undefined,
        (error) => reject(error)
      );
    });
  }

  /**
   * Build room meshes from a spatial contract (no GLB needed).
   */
  buildFromContract(contract: MetricSpatialContract): void {
    for (const room of contract.rooms) {
      this._createRoomMesh(room);
    }
  }

  /**
   * Build room meshes from a Planex layout input.
   */
  buildFromLayout(layout: {
    widthM: number;
    heightM: number;
    rooms: Array<{
      name: string;
      x: number; y: number;
      w: number; h: number;
      ceilingHeight?: number;
    }>;
  }): void {
    const { contract, rooms } = layoutToMeshData(layout);
    
    for (const roomData of rooms) {
      this._createRoomFromMesh(roomData);
    }
  }

  private _createRoomFromMesh(roomData: {
    id: string;
    name?: string;
    kind?: string;
    polygon: [number, number][];
    ceilingHeightMm: number;
    floorElevationMm: number;
  }): void {
    const polygon = roomData.polygon;
    const height = roomData.ceilingHeightMm * MM_TO_M;
    
    // Floor shape
    const shape = new THREE.Shape();
    const poly = [...polygon];
    
    // Sort points to go CCW for proper shape
    if (this._signedArea(poly) < 0) {
      poly.reverse();
    }
    
    shape.moveTo(poly[0][0] * MM_TO_M, poly[0][1] * MM_TO_M);
    for (let i = 1; i < poly.length; i++) {
      shape.lineTo(poly[i][0] * MM_TO_M, poly[i][1] * MM_TO_M);
    }
    
    // Extrude to create 3D room
    const extrudeGeometry = new THREE.ExtrudeGeometry(shape, {
      depth: height,
      bevelEnabled: false,
    });
    extrudeGeometry.rotateX(-Math.PI / 2); // Lay flat
    
    const material = new THREE.MeshStandardMaterial({
      color: this._roomColor(roomData.kind || 'other'),
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    
    const floor = new THREE.Mesh(extrudeGeometry, material);
    floor.receiveShadow = true;
    
    // Wall edges
    const edgesGeometry = new THREE.EdgesGeometry(extrudeGeometry);
    const edgesMaterial = new THREE.LineBasicMaterial({
      color: 0x333333,
      transparent: true,
      opacity: 0.5,
    });
    const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
    
    // Ceiling wireframe
    const ceilingGeometry = new THREE.ShapeGeometry(shape);
    ceilingGeometry.rotateX(-Math.PI / 2);
    ceilingGeometry.translate(0, height, 0);
    const ceilingMaterial = new THREE.LineBasicMaterial({
      color: 0x666666,
      transparent: true,
      opacity: 0.4,
    });
    const ceiling = new THREE.LineLoop(ceilingGeometry, ceilingMaterial);
    
    const group = new THREE.Group();
    group.add(floor);
    group.add(edges);
    group.add(ceiling);
    
    // Room label
    const labelDiv = this._createRoomLabel(roomData.name || roomData.id, roomData.kind);
    // Position label at room centroid
    const centroid = this._polygonCentroid(polygon.map(p => [p[0] * MM_TO_M, p[1] * MM_TO_M]));
    
    this.scene.add(group);
    
    this.roomMeshes.set(roomData.id, {
      roomId: roomData.id,
      mesh: group,
      floorArea: this._polygonArea(polygon),
      volume: this._polygonArea(polygon) * (height / MM_TO_M) * MM_TO_M, // mm³
    });
  }

  private _createRoomMesh(room: Room): void {
    const polygon = room.boundary_polygon;
    const height = room.ceiling_height_mm * MM_TO_M;
    
    const shape = new THREE.Shape();
    const poly = [...polygon];
    
    if (this._signedArea(poly) < 0) {
      poly.reverse();
    }
    
    shape.moveTo(poly[0][0] * MM_TO_M, poly[0][1] * MM_TO_M);
    for (let i = 1; i < poly.length; i++) {
      shape.lineTo(poly[i][0] * MM_TO_M, poly[i][1] * MM_TO_M);
    }
    
    const extrudeGeometry = new THREE.ExtrudeGeometry(shape, {
      depth: height,
      bevelEnabled: false,
    });
    extrudeGeometry.rotateX(-Math.PI / 2);
    
    const material = new THREE.MeshStandardMaterial({
      color: this._roomColor(room.kind || 'other'),
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
    });
    
    const mesh = new THREE.Mesh(extrudeGeometry, material);
    mesh.receiveShadow = true;
    
    const group = new THREE.Group();
    group.add(mesh);
    this.scene.add(group);
    
    this.roomMeshes.set(room.id, {
      roomId: room.id,
      mesh: group,
      floorArea: this._polygonArea(polygon),
      volume: this._polygonArea(polygon) * room.ceiling_height_mm,
    });
  }

  private _roomColor(kind: string): number {
    const colors: Record<string, number> = {
      living: 0x8B4513,
      dining: 0xCD853F,
      kitchen: 0xDEB887,
      bedroom: 0x87CEEB,
      kids: 0xFFB6C1,
      guest: 0xDDA0DD,
      study: 0x98FB98,
      bath: 0x87CEEB,
      foyer: 0xF0E68C,
      pooja: 0xFFDAA5,
      balcony: 0x98FB98,
      utility: 0xD3D3D3,
      other: 0xB0C4DE,
    };
    return colors[kind] || colors.other;
  }

  private _createRoomLabel(name: string, kind?: string): HTMLElement | null {
    // This would create a CSS2DRenderer label in a full implementation
    return null;
  }

  private _polygonArea(poly: [number, number][]): number {
    if (poly.length < 3) return 0;
    let area = 0;
    for (let i = 0; i < poly.length; i++) {
      const j = (i + 1) % poly.length;
      area += poly[i][0] * poly[j][1];
      area -= poly[j][0] * poly[i][1];
    }
    return Math.abs(area) / 2;
  }

  private _signedArea(poly: [number, number][]): number {
    let area = 0;
    for (let i = 0; i < poly.length; i++) {
      const j = (i + 1) % poly.length;
      area += poly[i][0] * poly[j][1];
      area -= poly[j][0] * poly[i][1];
    }
    return area / 2;
  }

  private _polygonCentroid(poly: [number, number][]): [number, number] {
    let cx = 0, cy = 0, a = 0;
    for (let i = 0; i < poly.length; i++) {
      const j = (i + 1) % poly.length;
      const cross = poly[i][0] * poly[j][1] - poly[j][0] * poly[i][1];
      a += cross;
      cx += (poly[i][0] + poly[j][0]) * cross;
      cy += (poly[i][1] + poly[j][1]) * cross;
    }
    a *= 0.5;
    return [cx / (6 * a), cy / (6 * a)];
  }

  /**
   * Update the BOQ ledger for synchronized pricing display.
   */
  updateBOQ(roomId: string, data: { quantity: number; rate: number; total: number }): void {
    this.boqLedger.set(roomId, data);
    this._updateRoomMaterial(roomId, data);
  }

  private _updateRoomMaterial(roomId: string, data: { quantity: number; rate: number; total: number }): void {
    const mesh = this.roomMeshes.get(roomId);
    if (!mesh) return;

    // Color-code by price per unit area: green (low) → yellow → red (high)
    const pricePerSqM = data.total / (data.quantity || 1);
    const color = this._priceHeatmap(pricePerSqM);

    mesh.mesh.traverse((child) => {
      if (child.isMesh && child.material instanceof THREE.MeshStandardMaterial) {
        if ((child.material as any).originalColor !== undefined) {
          child.material.color.setHex((child.material as any).originalColor);
        } else {
          (child.material as any).originalColor = child.material.color.getHex();
        }
        child.material.color.setHex(color);
        child.material.needsUpdate = true;
      }
    });
  }

  private _priceHeatmap(price: number): number {
    // Green (low) → yellow → red (high)
    if (price < 500) return 0x22c55e;     // green-500
    if (price < 1000) return 0x84cc16;    // lime-500
    if (price < 2000) return 0xf59e0b;    // amber-500
    if (price < 5000) return 0xf97316;    // orange-500
    return 0xef4444;                       // red-500
  }

  /**
   * Highlight a specific room.
   */
  highlightRoom(roomId: string, highlight: boolean = true): void {
    const mesh = this.roomMeshes.get(roomId);
    if (!mesh) return;

    mesh.mesh.traverse((child) => {
      if (child.isMesh) {
        const mat = child.material as THREE.MeshStandardMaterial;
        if (highlight) {
          mat.emissive?.setHex(0x333300);
          mat.opacity = 0.5;
        } else {
          mat.emissive?.setHex(0x000000);
          mat.opacity = 0.25;
        }
      }
    });
  }

  /**
   * Animate the viewer.
   */
  animate(): void {
    if (this.animateId !== null) return;
    this._render();
  }

  private _render(): void {
    this.animateId = requestAnimationFrame(this._render.bind(this));

    if (this.autoRotate) {
      this.scene.rotation.y += 0.001;
    }

    if (this.controls) {
      this.controls.update();
    }

    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Stop animation loop.
   */
  stop(): void {
    if (this.animateId !== null) {
      cancelAnimationFrame(this.animateId);
      this.animateId = null;
    }
  }

  /**
   * Clear all room meshes from the scene.
   */
  clear(): void {
    for (const [, meshData] of this.roomMeshes) {
      this.scene.remove(meshData.mesh);
    }
    this.roomMeshes.clear();
    this.boqLedger.clear();
  }

  /**
   * Get the renderer's canvas.
   */
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  /**
   * Resize the viewer manually.
   */
  resize(width?: number, height?: number): void {
    const w = width || this.canvas.clientWidth || 800;
    const h = height || this.canvas.clientHeight || 600;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
}
