"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  type PackedCarton,
  type Dimensions,
} from "../truck-spec";

type TruckViewerProps = {
  container: Dimensions;
  box: Dimensions;
  cartons: PackedCarton[];
  fillPercent: number;
  playback: {
    direction: "load" | "unload";
    progress: number;
    playing: boolean;
  };
  timing: {
    loadApproachStart: number;
    loadDoorStart: number;
    unloadDoorEnd: number;
    unloadCartonsStart: number;
  };
};

function createCartonTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not create carton texture canvas.");

  context.fillStyle = "#c99a60";
  context.fillRect(0, 0, canvas.width, canvas.height);

  for (let x = 0; x < canvas.width; x += 4) {
    const shade = x % 16 === 0 ? 13 : 6;
    context.fillStyle = `rgba(83, 49, 20, ${shade / 1000})`;
    context.fillRect(x, 0, 1, canvas.height);
  }

  let seed = 41;
  for (let i = 0; i < 1600; i += 1) {
    seed = (seed * 16807) % 2147483647;
    const x = seed % canvas.width;
    seed = (seed * 16807) % 2147483647;
    const y = seed % canvas.height;
    const alpha = (seed % 10) / 100;
    context.fillStyle = `rgba(75, 47, 21, ${alpha})`;
    context.fillRect(x, y, 1 + (seed % 3), 1);
  }

  context.strokeStyle = "rgba(91, 61, 31, 0.22)";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(12, 0);
  context.lineTo(12, 256);
  context.moveTo(244, 0);
  context.lineTo(244, 256);
  context.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function createShippingLabel(index: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 160;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not create shipping label canvas.");

  const labels = [
    { title: "FRAGILE", subtitle: "HANDLE WITH CARE", accent: "#c74c35" },
    { title: "THIS SIDE UP", subtitle: "KEEP DRY", accent: "#365c72" },
    { title: "CARGO STUDIO", subtitle: "PACKED WITH CARE", accent: "#627247" },
    { title: "SHIPMENT", subtitle: "CHECK CONTENTS", accent: "#80562f" },
  ];
  const label = labels[index % labels.length];

  context.fillStyle = "#f4eedf";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = "#756b59";
  context.lineWidth = 4;
  context.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

  context.fillStyle = label.accent;
  context.fillRect(10, 10, 236, 28);
  context.fillStyle = "#fffaf0";
  context.font = "bold 16px Arial";
  context.fillText(label.title, 18, 30, 218);

  context.fillStyle = "#302a22";
  context.font = "bold 11px Arial";
  context.fillText(label.subtitle, 14, 58, 220);
  context.font = "10px Arial";
  context.fillText(`BOX  ${String(index + 1).padStart(4, "0")}`, 14, 76);
  context.fillText("KEEP IN A COOL, DRY PLACE", 14, 91, 220);

  const barcodeY = 103;
  let barX = 14;
  let barcodeSeed = 317 + index * 97;
  while (barX < 183) {
    barcodeSeed = (barcodeSeed * 16807) % 2147483647;
    const barWidth = barcodeSeed % 3 === 0 ? 3 : 1;
    context.fillStyle = "#25221e";
    context.fillRect(barX, barcodeY, barWidth, 34);
    barX += barWidth + 2;
  }
  context.fillStyle = label.accent;
  context.font = "bold 24px Arial";
  context.fillText(index % 2 === 0 ? "↑ ↑" : "↕", 195, 132);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function createWarehouseWorker(height: number) {
  const worker = new THREE.Group();
  const clothes = new THREE.MeshStandardMaterial({
    color: "#243348",
    roughness: 0.83,
  });
  const hiVis = new THREE.MeshStandardMaterial({
    color: "#d5d84c",
    roughness: 0.72,
  });
  const reflective = new THREE.MeshStandardMaterial({
    color: "#edf0ce",
    metalness: 0.1,
    roughness: 0.38,
  });
  const skin = new THREE.MeshStandardMaterial({
    color: "#bd8059",
    roughness: 0.86,
  });
  const helmet = new THREE.MeshStandardMaterial({
    color: "#ed9e33",
    roughness: 0.5,
  });
  const boots = new THREE.MeshStandardMaterial({
    color: "#22282c",
    roughness: 0.9,
  });

  const addCapsule = (
    parent: THREE.Group,
    radius: number,
    segmentLength: number,
    material: THREE.Material,
    position: THREE.Vector3,
  ) => {
    const mesh = new THREE.Mesh(
      new THREE.CapsuleGeometry(radius, segmentLength, 5, 8),
      material,
    );
    mesh.position.copy(position);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const addBox = (
    parent: THREE.Group,
    size: THREE.Vector3,
    material: THREE.Material,
    position: THREE.Vector3,
  ) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(size.x, size.y, size.z),
      material,
    );
    mesh.position.copy(position);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  };

  const scale = height;
  const legs = new THREE.Group();
  worker.add(legs);
  for (const side of [-1, 1]) {
    addCapsule(
      legs,
      scale * 0.067,
      scale * 0.16,
      clothes,
      new THREE.Vector3(side * scale * 0.09, scale * 0.2, 0),
    );
    addBox(
      legs,
      new THREE.Vector3(scale * 0.12, scale * 0.065, scale * 0.2),
      boots,
      new THREE.Vector3(side * scale * 0.09, scale * 0.035, -scale * 0.035),
    );
  }

  const torso = new THREE.Group();
  torso.position.y = scale * 0.42;
  worker.add(torso);
  addCapsule(
    torso,
    scale * 0.17,
    scale * 0.24,
    clothes,
    new THREE.Vector3(0, scale * 0.2, 0),
  );
  addCapsule(
    torso,
    scale * 0.145,
    scale * 0.21,
    hiVis,
    new THREE.Vector3(0, scale * 0.23, -scale * 0.015),
  );
  for (const side of [-1, 1]) {
    addBox(
      torso,
      new THREE.Vector3(scale * 0.035, scale * 0.38, scale * 0.025),
      reflective,
      new THREE.Vector3(side * scale * 0.09, scale * 0.23, -scale * 0.135),
    );
  }
  addBox(
    torso,
    new THREE.Vector3(scale * 0.25, scale * 0.035, scale * 0.025),
    reflective,
    new THREE.Vector3(0, scale * 0.15, -scale * 0.14),
  );

  const arms: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * scale * 0.19, scale * 0.35, 0);
    shoulder.rotation.z = side * 0.14;
    shoulder.rotation.x = 0;
    torso.add(shoulder);
    addCapsule(
      shoulder,
      scale * 0.057,
      scale * 0.2,
      hiVis,
      new THREE.Vector3(0, -scale * 0.13, 0),
    );
    addCapsule(
      shoulder,
      scale * 0.05,
      scale * 0.15,
      skin,
      new THREE.Vector3(0, -scale * 0.31, -scale * 0.01),
    );
    const hand = new THREE.Mesh(
      new THREE.SphereGeometry(scale * 0.052, 10, 8),
      boots,
    );
    hand.position.set(0, -scale * 0.42, -scale * 0.01);
    shoulder.add(hand);
    arms.push(shoulder);
  }

  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(scale * 0.045, scale * 0.05, scale * 0.08, 12),
    skin,
  );
  neck.position.set(0, scale * 0.39, 0);
  torso.add(neck);
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(scale * 0.105, 16, 12),
    skin,
  );
  head.position.set(0, scale * 0.48, 0);
  head.castShadow = true;
  torso.add(head);
  const brim = new THREE.Mesh(
    new THREE.CylinderGeometry(scale * 0.135, scale * 0.135, scale * 0.025, 16),
    helmet,
  );
  brim.position.set(0, scale * 0.55, 0);
  torso.add(brim);
  const helmetCap = new THREE.Mesh(
    new THREE.SphereGeometry(scale * 0.115, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    helmet,
  );
  helmetCap.position.set(0, scale * 0.56, 0);
  torso.add(helmetCap);
  worker.rotation.y = 0;

  return { group: worker, arms, legs, torso };
}

export default function TruckViewer({
  container,
  box,
  cartons,
  fillPercent,
  playback,
  timing,
}: TruckViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const playbackRef = useRef(playback);

  useEffect(() => {
    playbackRef.current = playback;
  }, [playback]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = container.width;
    const length = container.length;
    const height = container.height;
    const boxWidth = box.width;
    const boxLength = box.length;
    const boxHeight = box.height;
    const boxCount = cartons.length;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#101a25");

    const largestDimension = Math.max(width, length, height);
    const rampLength = Math.max(height * 1.45, boxLength * 6);
    const sceneExtent = Math.max(
      largestDimension,
      length + rampLength * 0.45 + boxLength * 1.5,
    );
    const sceneScale = sceneExtent / largestDimension;
    const camera = new THREE.PerspectiveCamera(
      38,
      1,
      0.1,
      sceneExtent * 8,
    );
    camera.position.set(
      largestDimension * 1.2 * sceneScale,
      largestDimension * 0.95 * sceneScale,
      largestDimension * 1.4 * sceneScale,
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, height * 0.15, rampLength * 0.2);
    controls.minDistance = sceneExtent * 0.7;
    controls.maxDistance = sceneExtent * 4.8;
    controls.maxPolarAngle = Math.PI * 0.49;

    scene.add(new THREE.HemisphereLight("#d8eaff", "#26313c", 2.2));

    const keyLight = new THREE.DirectionalLight("#fff1d2", 3);
    keyLight.position.set(-width, height * 2.75, length * 0.5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.left = -sceneExtent * 2;
    keyLight.shadow.camera.right = sceneExtent * 2;
    keyLight.shadow.camera.top = sceneExtent * 2;
    keyLight.shadow.camera.bottom = -sceneExtent * 2;
    keyLight.shadow.camera.far = sceneExtent * 8;
    keyLight.shadow.camera.updateProjectionMatrix();
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight("#83c9e8", 1.8);
    fillLight.position.set(width * 1.5, height * 1.25, -length * 0.9);
    scene.add(fillLight);

    const truck = new THREE.Group();
    scene.add(truck);

    const materials = {
      frame: new THREE.MeshStandardMaterial({
        color: "#92a7b3",
        metalness: 0.72,
        roughness: 0.34,
      }),
      chassis: new THREE.MeshStandardMaterial({
        color: "#334553",
        metalness: 0.48,
        roughness: 0.5,
      }),
      cab: new THREE.MeshStandardMaterial({
        color: "#f0a34a",
        metalness: 0.25,
        roughness: 0.38,
      }),
      glass: new THREE.MeshStandardMaterial({
        color: "#75b5c5",
        metalness: 0.2,
        roughness: 0.2,
      }),
      tire: new THREE.MeshStandardMaterial({
        color: "#171d22",
        roughness: 0.9,
      }),
      hub: new THREE.MeshStandardMaterial({
        color: "#bdcbd0",
        metalness: 0.75,
        roughness: 0.3,
      }),
    };

    const addBox = (
      width: number,
      height: number,
      depth: number,
      x: number,
      y: number,
      z: number,
      material: THREE.Material,
    ) => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        material,
      );
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      truck.add(mesh);
      return mesh;
    };

    const beam = Math.max(0.5, Math.min(boxWidth, boxLength, boxHeight) * 0.3);
    const floorThickness = Math.max(0.5, height * 0.025);
    const chassisThickness = Math.max(1, height * 0.1);
    const halfWidth = width / 2;
    const halfLength = length / 2;

    addBox(
      width + beam * 4,
      chassisThickness,
      length + beam * 4,
      0,
      -floorThickness - chassisThickness / 2,
      0,
      materials.chassis,
    );
    addBox(width, floorThickness, length, 0, -floorThickness / 2, 0, materials.frame);

    for (const x of [-halfWidth, halfWidth]) {
      for (const z of [-halfLength, halfLength]) {
        addBox(beam, height + beam, beam, x, height / 2, z, materials.frame);
      }
      addBox(beam, beam, length, x, beam / 2, 0, materials.frame);
      addBox(beam, beam, length, x, height - beam / 2, 0, materials.frame);
    }

    for (const z of [-halfLength, halfLength]) {
      if (z < 0) {
        addBox(width, beam, beam, 0, beam / 2, z, materials.frame);
      }
      addBox(width, beam, beam, 0, height - beam / 2, z, materials.frame);
    }

    const doorMaterial = new THREE.MeshStandardMaterial({
      color: "#354954",
      metalness: 0.38,
      roughness: 0.56,
    });
    const doorBraceMaterial = new THREE.MeshStandardMaterial({
      color: "#9babb0",
      metalness: 0.72,
      roughness: 0.34,
    });
    const doorWidth = width / 2 - beam * 0.65;
    const doorHeight = height - beam * 1.6;
    const doorThickness = Math.max(beam * 0.45, 0.4);
    const leftDoor = new THREE.Group();
    const rightDoor = new THREE.Group();
    leftDoor.position.set(-halfWidth, height / 2, halfLength + beam * 0.55);
    rightDoor.position.set(halfWidth, height / 2, halfLength + beam * 0.55);
    truck.add(leftDoor, rightDoor);

    const addDoorLeaf = (door: THREE.Group, side: -1 | 1) => {
      const leaf = new THREE.Group();
      leaf.position.x = side * doorWidth / 2;
      door.add(leaf);
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(doorWidth, doorHeight, doorThickness),
        doorMaterial,
      );
      panel.castShadow = true;
      panel.receiveShadow = true;
      leaf.add(panel);
      for (const y of [-doorHeight * 0.42, 0, doorHeight * 0.42]) {
        const brace = new THREE.Mesh(
          new THREE.BoxGeometry(doorWidth * 0.9, beam * 0.32, doorThickness * 1.15),
          doorBraceMaterial,
        );
        brace.position.set(0, y, doorThickness * 0.12);
        brace.castShadow = true;
        leaf.add(brace);
      }

      const lockBar = new THREE.Mesh(
        new THREE.CylinderGeometry(beam * 0.11, beam * 0.11, doorHeight * 0.82, 10),
        doorBraceMaterial,
      );
      lockBar.position.set(-side * doorWidth * 0.32, 0, doorThickness * 0.72);
      leaf.add(lockBar);
      for (const y of [-doorHeight * 0.26, doorHeight * 0.26]) {
        const handle = new THREE.Mesh(
          new THREE.BoxGeometry(doorWidth * 0.18, beam * 0.16, beam * 0.18),
          materials.hub,
        );
        handle.position.set(-side * doorWidth * 0.32, y, doorThickness * 0.78);
        leaf.add(handle);
      }
    };
    addDoorLeaf(leftDoor, 1);
    addDoorLeaf(rightDoor, -1);

    const sealGroup = new THREE.Group();
    const sealMaterial = new THREE.MeshStandardMaterial({
      color: "#cf5540",
      roughness: 0.52,
      metalness: 0.12,
    });
    const sealStrap = new THREE.Mesh(
      new THREE.BoxGeometry(doorWidth * 0.66, beam * 0.14, beam * 0.11),
      sealMaterial,
    );
    sealStrap.position.z = doorThickness * 0.78;
    sealGroup.add(sealStrap);
    const sealTag = new THREE.Mesh(
      new THREE.BoxGeometry(beam * 0.44, beam * 0.62, beam * 0.16),
      sealMaterial,
    );
    sealTag.position.set(0, -beam * 0.34, doorThickness);
    sealGroup.add(sealTag);
    const sealCanvas = document.createElement("canvas");
    sealCanvas.width = 256;
    sealCanvas.height = 128;
    const sealContext = sealCanvas.getContext("2d");
    if (!sealContext) throw new Error("Could not create security seal label.");
    sealContext.fillStyle = "#f4ead6";
    sealContext.fillRect(0, 0, sealCanvas.width, sealCanvas.height);
    sealContext.fillStyle = "#9c382c";
    sealContext.fillRect(0, 0, sealCanvas.width, 32);
    sealContext.fillStyle = "#fff8eb";
    sealContext.font = "bold 21px Arial";
    sealContext.fillText("CARGO CONTROL", 12, 23);
    sealContext.fillStyle = "#3e342a";
    sealContext.font = "bold 28px Arial";
    sealContext.fillText("QC · SEALED", 12, 74);
    sealContext.font = "15px Arial";
    sealContext.fillText("DO NOT BREAK", 12, 105);
    const sealTexture = new THREE.CanvasTexture(sealCanvas);
    sealTexture.colorSpace = THREE.SRGBColorSpace;
    const sealLabel = new THREE.Mesh(
      new THREE.PlaneGeometry(beam * 0.38, beam * 0.22),
      new THREE.MeshBasicMaterial({
        map: sealTexture,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    );
    sealLabel.position.set(0, -beam * 0.34, doorThickness * 1.7);
    sealGroup.add(sealLabel);
    sealGroup.position.set(
      0,
      height * 0.52,
      halfLength + beam * 0.55,
    );
    truck.add(sealGroup);

    const latchGroup = new THREE.Group();
    const latch = new THREE.Mesh(
      new THREE.TorusGeometry(beam * 0.23, beam * 0.06, 8, 16),
      materials.hub,
    );
    latch.position.z = doorThickness * 0.9;
    latchGroup.add(latch);
    const latchBody = new THREE.Mesh(
      new THREE.BoxGeometry(beam * 0.32, beam * 0.26, beam * 0.12),
      sealMaterial,
    );
    latchBody.position.set(0, -beam * 0.22, doorThickness * 0.88);
    latchGroup.add(latchBody);
    latchGroup.position.set(
      0,
      height * 0.52,
      halfLength + beam * 0.55,
    );
    truck.add(latchGroup);

    const cartonTexture = createCartonTexture();
    const boxGeometry = new THREE.BoxGeometry(
      boxWidth * 0.975,
      boxHeight * 0.975,
      boxLength * 0.975,
    );
    const boxMaterial = new THREE.MeshStandardMaterial({
      map: cartonTexture,
      color: "#e8d0a6",
      roughness: 0.9,
      metalness: 0,
    });
    const boxes = new THREE.InstancedMesh(
      boxGeometry,
      boxMaterial,
      boxCount,
    );
    boxes.castShadow = true;
    boxes.receiveShadow = true;
    const tapeThickness = Math.max(0.03, Math.min(boxWidth, boxHeight, boxLength) * 0.012);
    const tapeMaterial = new THREE.MeshStandardMaterial({
      color: "#d8b77c",
      roughness: 0.82,
    });
    const tapeGeometry = new THREE.BoxGeometry(
      boxWidth * 0.14,
      tapeThickness,
      boxLength * 0.92,
    );
    const tape = new THREE.InstancedMesh(tapeGeometry, tapeMaterial, boxCount);
    const labelTextures = Array.from({ length: 4 }, (_, index) =>
      createShippingLabel(index),
    );
    const labelGeometry = new THREE.PlaneGeometry(
      boxLength * 0.58,
      boxHeight * 0.38,
    );
    const topLabelGeometry = new THREE.PlaneGeometry(
      boxWidth * 0.58,
      boxLength * 0.38,
    );
    const labelMaterials = labelTextures.map(
      (texture) =>
        new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.DoubleSide,
          toneMapped: false,
        }),
    );
    const sideLabels = labelMaterials.map((material, variant) => {
      const instanceCount = Math.ceil(
        (boxCount - variant) / labelMaterials.length,
      );
      return new THREE.InstancedMesh(
        labelGeometry,
        material,
        instanceCount,
      );
    });
    const topLabels = labelMaterials.map((material, variant) => {
      const instanceCount = Math.ceil(
        (boxCount - variant) / labelMaterials.length,
      );
      return new THREE.InstancedMesh(
        topLabelGeometry,
        material,
        instanceCount,
      );
    });
    const instance = new THREE.Object3D();
    const color = new THREE.Color();
    const targets: THREE.Vector3[] = [];
    const labelSlots = new Array<number>(boxCount);
    const labelVariants = new Array<number>(boxCount);
    for (let index = 0; index < boxCount; index += 1) {
      const carton = cartons[index];
      const target = new THREE.Vector3(
        carton.position.x,
        carton.position.y,
        carton.position.z,
      );
      const cartonScale = new THREE.Vector3(
        carton.dimensions.width / boxWidth,
        carton.dimensions.height / boxHeight,
        carton.dimensions.length / boxLength,
      );
      targets.push(target);
      instance.position.copy(target);
      instance.scale.copy(cartonScale);
      instance.updateMatrix();
      boxes.setMatrixAt(index, instance.matrix);
      color.setHSL(
        0.09 + ((index * 17) % 17) / 1000,
        0.42,
        0.59 + (index % 4) * 0.025,
      );
      boxes.setColorAt(index, color);

      const labelVariant = index % labelMaterials.length;
      const labelSlot = Math.floor(index / labelMaterials.length);
      labelVariants[index] = labelVariant;
      labelSlots[index] = labelSlot;

      instance.scale.set(
        carton.dimensions.length / boxLength,
        carton.dimensions.height / boxHeight,
        1,
      );
      instance.position.set(
        target.x + carton.dimensions.width / 2 + tapeThickness,
        target.y,
        target.z,
      );
      instance.rotation.set(0, Math.PI / 2, 0);
      instance.updateMatrix();
      sideLabels[labelVariant].setMatrixAt(labelSlot, instance.matrix);

      instance.scale.set(
        carton.dimensions.width / boxWidth,
        carton.dimensions.length / boxLength,
        1,
      );
      instance.position.set(
        target.x,
        target.y + carton.dimensions.height / 2 + tapeThickness,
        target.z,
      );
      instance.rotation.set(-Math.PI / 2, 0, 0);
      instance.updateMatrix();
      topLabels[labelVariant].setMatrixAt(labelSlot, instance.matrix);

      instance.scale.set(
        carton.dimensions.width / boxWidth,
        1,
        carton.dimensions.length / boxLength,
      );
      instance.position.set(
        target.x,
        target.y + carton.dimensions.height / 2 + tapeThickness / 2,
        target.z,
      );
      instance.rotation.set(0, 0, 0);
      instance.updateMatrix();
      tape.setMatrixAt(index, instance.matrix);
    }
    truck.add(boxes);
    truck.add(tape);
    sideLabels.forEach((labels) => truck.add(labels));
    topLabels.forEach((labels) => truck.add(labels));

    const wheelRadius = Math.max(2, Math.min(width, height, length) * 0.11);
    const wheelY = -floorThickness - chassisThickness - wheelRadius;
    const groundY = wheelY - wheelRadius;
    const conveyorLength = rampLength;
    const outfeedLength = boxLength * 3;
    const conveyorWidth = Math.min(width * 0.46, boxWidth * 2.8);
    const conveyorHeight = Math.max(0.7, boxHeight * 0.09);
    const conveyorEntryZ = halfLength + beam;
    const conveyorZ = conveyorEntryZ + conveyorLength / 2;
    const rampRise = -groundY;
    const rampAngle = Math.atan2(rampRise, conveyorLength);
    const conveyorBase = addBox(
      conveyorWidth,
      conveyorHeight,
      conveyorLength,
      0,
      -rampRise / 2 - conveyorHeight / 2,
      conveyorZ,
      materials.chassis,
    );
    conveyorBase.rotation.x = rampAngle;
    const rollerRadius = Math.max(0.35, conveyorHeight * 0.24);
    const rollers: THREE.Mesh[] = [];
    for (let roller = 0; roller <= 12; roller += 1) {
      const rampProgress = roller / 12;
      const rollerMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(rollerRadius, rollerRadius, conveyorWidth, 12),
        materials.hub,
      );
      rollerMesh.rotation.z = Math.PI / 2;
      rollerMesh.position.set(
        0,
        -rampProgress * rampRise - rollerRadius,
        conveyorEntryZ + rampProgress * conveyorLength,
      );
      truck.add(rollerMesh);
      rollers.push(rollerMesh);
    }
    addBox(
      conveyorWidth,
      conveyorHeight,
      outfeedLength,
      0,
      groundY - conveyorHeight / 2,
      conveyorEntryZ + conveyorLength + outfeedLength / 2,
      materials.chassis,
    );
    for (let roller = 0; roller < 4; roller += 1) {
      const rollerMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(rollerRadius, rollerRadius, conveyorWidth, 12),
        materials.hub,
      );
      rollerMesh.rotation.z = Math.PI / 2;
      rollerMesh.position.set(
        0,
        groundY - rollerRadius,
        conveyorEntryZ +
          conveyorLength +
          ((roller + 0.5) * outfeedLength) / 4,
      );
      truck.add(rollerMesh);
      rollers.push(rollerMesh);
    }

    const warehouseFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(largestDimension * 3.4, largestDimension * 3.4),
      new THREE.MeshStandardMaterial({ color: "#293943", roughness: 0.94 }),
    );
    warehouseFloor.rotation.x = -Math.PI / 2;
    warehouseFloor.position.y = groundY - 0.1;
    warehouseFloor.receiveShadow = true;
    scene.add(warehouseFloor);

    const floorStripeMaterial = new THREE.MeshStandardMaterial({
      color: "#d8aa59",
      roughness: 0.75,
    });
    const floorMarkings = new THREE.Group();
    scene.add(floorMarkings);
    const stripeWidth = Math.max(0.7, beam * 0.65);
    const stripeLength = length + conveyorLength + outfeedLength + boxLength * 2;
    for (const x of [
      -halfWidth - beam * 3,
      halfWidth + beam * 3,
    ]) {
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(stripeWidth, 0.08, stripeLength),
        floorStripeMaterial,
      );
      stripe.position.set(
        x,
        groundY,
        conveyorZ,
      );
      floorMarkings.add(stripe);
    }

    const workerHeight = Math.min(height * 0.82, boxHeight * 5.2);
    const workerLaneX = conveyorWidth / 2 + workerHeight * 0.42;
    const walkwayMaterial = new THREE.MeshStandardMaterial({
      color: "#465659",
      metalness: 0.38,
      roughness: 0.67,
    });
    const walkway = new THREE.Mesh(
      new THREE.BoxGeometry(workerHeight * 0.58, beam * 1.8, conveyorLength),
      walkwayMaterial,
    );
    walkway.position.set(
      workerLaneX,
      -rampRise / 2 - beam * 0.18,
      conveyorZ,
    );
    walkway.rotation.x = rampAngle;
    walkway.castShadow = true;
    walkway.receiveShadow = true;
    scene.add(walkway);

    const walkwayEdgeMaterial = new THREE.MeshStandardMaterial({
      color: "#d8aa59",
      roughness: 0.7,
    });
    for (const side of [-1, 1]) {
      const edge = new THREE.Mesh(
        new THREE.BoxGeometry(beam * 0.65, beam * 0.6, conveyorLength),
        walkwayEdgeMaterial,
      );
      edge.position.set(
        workerLaneX + side * workerHeight * 0.25,
        -rampRise / 2 + beam * 0.2,
        conveyorZ,
      );
      edge.rotation.x = rampAngle;
      edge.castShadow = true;
      scene.add(edge);
    }

    const warehouseWorker = createWarehouseWorker(workerHeight);
    scene.add(warehouseWorker.group);

    const bollardMaterial = new THREE.MeshStandardMaterial({
      color: "#e5a645",
      roughness: 0.6,
    });
    const bollardRadius = Math.max(0.6, beam * 0.55);
    for (const x of [-1, 1]) {
      const bollard = new THREE.Mesh(
        new THREE.CylinderGeometry(
          bollardRadius,
          bollardRadius,
          height * 0.42,
          16,
        ),
        bollardMaterial,
      );
      bollard.position.set(
        x * (halfWidth + beam * 3.4),
        groundY + height * 0.21,
        halfLength + beam * 2,
      );
      bollard.castShadow = true;
      scene.add(bollard);
    }

    const rampSurfaceY = (z: number) =>
      -THREE.MathUtils.clamp(
        (z - conveyorEntryZ) / conveyorLength,
        0,
        1,
      ) * rampRise;
    const source = new THREE.Vector3();
    const carryDepth = workerHeight * 0.32;
    const carryHeight = workerHeight * 0.42;
    const heldOffset = new THREE.Vector3(0, carryHeight, -carryDepth);
    const heroCarton = new THREE.Group();
    const heroBody = new THREE.Mesh(
      new THREE.BoxGeometry(
        boxWidth * 0.975,
        boxHeight * 0.975,
        boxLength * 0.975,
      ),
      boxMaterial,
    );
    heroBody.castShadow = true;
    heroBody.receiveShadow = true;
    heroCarton.add(heroBody);
    const heroTape = new THREE.Mesh(
      new THREE.BoxGeometry(
        boxWidth * 0.14,
        tapeThickness,
        boxLength * 0.92,
      ),
      tapeMaterial,
    );
    heroTape.position.y = boxHeight / 2 + tapeThickness / 2;
    heroCarton.add(heroTape);
    const heroLabel = new THREE.Mesh(
      new THREE.PlaneGeometry(boxLength * 0.58, boxHeight * 0.38),
      new THREE.MeshBasicMaterial({
        map: labelTextures[0],
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    );
    heroLabel.position.set(boxWidth / 2 + 0.02, 0, 0);
    heroLabel.rotation.y = Math.PI / 2;
    heroCarton.add(heroLabel);
    scene.add(heroCarton);

    const heldPosition = new THREE.Vector3();
    const worldUp = new THREE.Vector3(0, 1, 0);
    const originRoot = new THREE.Vector3();
    const endRoot = new THREE.Vector3();
    const doorRoot = new THREE.Vector3(
      0,
      groundY,
      halfLength + beam * 3,
    );
    const travelDirection = new THREE.Vector3();
    const destinationCarton = new THREE.Vector3();
    const originCarton = new THREE.Vector3();
    const updateCargo = (
      direction: "load" | "unload",
      progress: number,
    ) => {
      const boundedProgress = THREE.MathUtils.clamp(progress, 0, 1);
      const cargoProgress =
        direction === "load"
          ? THREE.MathUtils.clamp(
              boundedProgress / timing.loadApproachStart,
              0,
              1,
            )
          : THREE.MathUtils.clamp(
              (boundedProgress - timing.unloadCartonsStart) /
                (1 - timing.unloadCartonsStart),
              0,
              1,
            );
      const doorClosure =
        direction === "load"
          ? THREE.MathUtils.smoothstep(
              boundedProgress,
              timing.loadDoorStart,
              1,
            )
          : 1 -
            THREE.MathUtils.smoothstep(
              boundedProgress,
              0,
              timing.unloadDoorEnd,
            );
      const doorOpen = 1 - doorClosure;
      leftDoor.rotation.y = -doorOpen * Math.PI * 0.48;
      rightDoor.rotation.y = doorOpen * Math.PI * 0.48;
      sealGroup.visible =
        direction === "load"
          ? boundedProgress >= 0.99
          : boundedProgress <= 0.005;
      latchGroup.visible = doorClosure >= 0.96;
      latchGroup.rotation.z = -doorOpen * Math.PI * 0.36;

      const handlingCycles = Math.max(1, boxCount);
      const cyclePosition = cargoProgress * handlingCycles;
      const cycleIndex = Math.min(
        handlingCycles - 1,
        Math.floor(cyclePosition),
      );
      const phase =
        cargoProgress >= 1 ? 1 : cyclePosition - cycleIndex;
      const completedCount = Math.min(
        boxCount,
        Math.floor(cargoProgress * handlingCycles),
      );
      const activeTargetIndex =
        direction === "load"
          ? Math.min(
              boxCount - 1,
              completedCount,
            )
          : Math.max(
              0,
              boxCount - completedCount - 1,
            );
      const target = targets[activeTargetIndex];
      const activeCarton = cartons[activeTargetIndex];
      source.set(
        0,
        groundY + activeCarton.dimensions.height / 2,
        conveyorEntryZ +
          conveyorLength -
          activeCarton.dimensions.length * 0.62,
      );
      originCarton.copy(direction === "load" ? source : target);
      destinationCarton.copy(direction === "load" ? target : source);
      travelDirection.subVectors(destinationCarton, originCarton);
      travelDirection.y = 0;
      if (travelDirection.lengthSq() < 0.0001) {
        travelDirection.set(0, 0, -1);
      }
      travelDirection.normalize();
      const travelYaw = Math.atan2(-travelDirection.x, -travelDirection.z);
      originRoot
        .copy(originCarton)
        .addScaledVector(travelDirection, -carryDepth);
      originRoot.y = rampSurfaceY(originRoot.z);
      endRoot
        .copy(destinationCarton)
        .addScaledVector(travelDirection, -carryDepth);
      endRoot.y = rampSurfaceY(endRoot.z);

      const smooth = (value: number) => {
        const clamped = THREE.MathUtils.clamp(value, 0, 1);
        return clamped * clamped * (3 - 2 * clamped);
      };
      let carryProgress = 0;
      if (phase >= 0.16 && phase < 0.72) {
        carryProgress = smooth((phase - 0.16) / 0.56);
        warehouseWorker.group.position.lerpVectors(
          originRoot,
          endRoot,
          carryProgress,
        );
      } else if (phase >= 0.72 && phase < 0.88) {
        warehouseWorker.group.position.copy(endRoot);
      } else if (phase >= 0.88) {
        if (cargoProgress >= 1 && direction === "unload") {
          warehouseWorker.group.position.copy(endRoot);
        } else {
          warehouseWorker.group.position.lerpVectors(
            endRoot,
            originRoot,
            smooth((phase - 0.88) / 0.12),
          );
        }
      } else {
        warehouseWorker.group.position.copy(originRoot);
      }
      warehouseWorker.group.position.y = rampSurfaceY(
        warehouseWorker.group.position.z,
      );
      const atDoorControls =
        direction === "load"
          ? boundedProgress >= timing.loadDoorStart
          : boundedProgress <= timing.unloadDoorEnd;
      if (atDoorControls) {
        warehouseWorker.group.position.copy(doorRoot);
      } else if (
        direction === "load" &&
        boundedProgress >= timing.loadApproachStart
      ) {
        warehouseWorker.group.position.lerpVectors(
          originRoot,
          doorRoot,
          THREE.MathUtils.smoothstep(
            boundedProgress,
            timing.loadApproachStart,
            timing.loadDoorStart,
          ),
        );
      } else if (
        direction === "unload" &&
        boundedProgress <= timing.unloadCartonsStart
      ) {
        warehouseWorker.group.position.lerpVectors(
          doorRoot,
          originRoot,
          THREE.MathUtils.smoothstep(
            boundedProgress,
            timing.unloadDoorEnd,
            timing.unloadCartonsStart,
          ),
        );
      }
      warehouseWorker.group.rotation.set(
        0,
        atDoorControls
          ? 0
          : phase >= 0.88 && !(cargoProgress >= 1 && direction === "unload")
            ? travelYaw + Math.PI
            : travelYaw,
        0,
      );

      const reach =
        phase < 0.16
          ? smooth(phase / 0.16) * 0.15
          : phase < 0.3
            ? 0.15 + smooth((phase - 0.16) / 0.14) * 0.9
            : phase < 0.72
              ? 1.05
              : phase < 0.88
                ? 1.05 - smooth((phase - 0.72) / 0.16) * 0.9
                : 0;
      const crouch =
        phase < 0.16
          ? smooth(phase / 0.16)
          : phase < 0.3
            ? 1 - smooth((phase - 0.16) / 0.14)
            : phase >= 0.72 && phase < 0.88
              ? smooth((phase - 0.72) / 0.16)
              : 0;
      const doorWorkProgress =
        direction === "load"
          ? THREE.MathUtils.clamp(
              (boundedProgress - timing.loadDoorStart) /
                (1 - timing.loadDoorStart),
              0,
              1,
            )
          : 1 -
            THREE.MathUtils.clamp(
              boundedProgress / timing.unloadDoorEnd,
              0,
              1,
            );
      const doorReach = atDoorControls
        ? smooth(doorWorkProgress) * (1 - smooth(doorWorkProgress - 0.35))
        : 0;
      warehouseWorker.torso.position.y =
        workerHeight * (0.42 - crouch * 0.08 - doorReach * 0.035);
      warehouseWorker.torso.rotation.x = -crouch * 0.22 - doorReach * 0.12;
      warehouseWorker.arms.forEach((arm, armIndex) => {
        const side = armIndex === 0 ? -1 : 1;
        const armReach = atDoorControls ? doorReach : reach;
        arm.rotation.x = atDoorControls ? doorReach * 0.8 : reach;
        arm.rotation.z = side * (0.58 - 0.44 * Math.min(1, armReach));
      });
      warehouseWorker.legs.rotation.x =
        (phase >= 0.3 && phase < 0.72) || phase >= 0.88
          ? Math.sin((carryProgress + phase) * Math.PI * 8) * 0.1
          : 0;
      heldPosition.copy(heldOffset);
      warehouseWorker.group.localToWorld(heldPosition);
      heroCarton.visible =
        cargoProgress < 1 &&
        (direction === "unload" || phase < 0.88) &&
        !(direction === "unload" && boundedProgress < 0.18);
      heroCarton.scale.set(
        activeCarton.dimensions.width / boxWidth,
        activeCarton.dimensions.height / boxHeight,
        activeCarton.dimensions.length / boxLength,
      );
      heroLabel.scale.set(
        (activeCarton.dimensions.length / boxLength) /
          (activeCarton.dimensions.width / boxWidth),
        1,
        1,
      );
      if (phase < 0.16) {
        heroCarton.position.copy(originCarton);
      } else if (phase < 0.3) {
        const liftProgress = smooth((phase - 0.16) / 0.14);
        heroCarton.position.lerpVectors(
          originCarton,
          heldPosition,
          liftProgress,
        );
      } else if (phase < 0.72) {
        heroCarton.position.copy(heldPosition);
      } else if (phase < 0.88) {
        const placementProgress = smooth((phase - 0.72) / 0.16);
        heldPosition.copy(heldOffset).applyAxisAngle(worldUp, travelYaw);
        warehouseWorker.group.localToWorld(heldPosition);
        heroCarton.position.lerpVectors(
          heldPosition,
          destinationCarton,
          placementProgress,
        );
      } else if (direction === "unload") {
        heroCarton.position.copy(source);
        heroCarton.position.z +=
          THREE.MathUtils.smoothstep(phase, 0.88, 1) * outfeedLength;
      }
      heroCarton.rotation.y = 0;

      for (let boxIndex = 0; boxIndex < boxCount; boxIndex += 1) {
        const visibility =
          direction === "load"
            ? Number(boxIndex < completedCount)
            : Number(boxIndex < boxCount - completedCount);
        const boxTarget = targets[boxIndex];
        const carton = cartons[boxIndex];
        const widthScale = carton.dimensions.width / boxWidth;
        const heightScale = carton.dimensions.height / boxHeight;
        const lengthScale = carton.dimensions.length / boxLength;
        const displayVisibility =
          boxIndex === activeTargetIndex && heroCarton.visible
            ? 0
            : visibility;
        const visibilityScale = Math.max(0.001, displayVisibility);
        const hidden = displayVisibility <= 0.001;
        instance.position.copy(boxTarget);
        if (hidden) instance.position.y = -largestDimension * 10;
        instance.scale.set(widthScale, heightScale, lengthScale);
        instance.scale.multiplyScalar(visibilityScale);
        instance.rotation.set(0, 0, 0);
        instance.updateMatrix();
        boxes.setMatrixAt(boxIndex, instance.matrix);

        instance.position.set(
          boxTarget.x,
          boxTarget.y + carton.dimensions.height / 2 + tapeThickness / 2,
          boxTarget.z,
        );
        if (hidden) instance.position.y = -largestDimension * 10;
        instance.scale.set(widthScale, 1, lengthScale);
        instance.scale.multiplyScalar(visibilityScale);
        instance.updateMatrix();
        tape.setMatrixAt(boxIndex, instance.matrix);

        const variant = labelVariants[boxIndex];
        const slot = labelSlots[boxIndex];
        instance.position.set(
          boxTarget.x + carton.dimensions.width / 2 + tapeThickness,
          boxTarget.y,
          boxTarget.z,
        );
        if (hidden) instance.position.y = -largestDimension * 10;
        instance.rotation.set(0, Math.PI / 2, 0);
        instance.scale.set(lengthScale, heightScale, 1);
        instance.scale.multiplyScalar(visibilityScale);
        instance.updateMatrix();
        sideLabels[variant].setMatrixAt(slot, instance.matrix);

        instance.position.set(
          boxTarget.x,
          boxTarget.y + carton.dimensions.height / 2 + tapeThickness,
          boxTarget.z,
        );
        if (hidden) instance.position.y = -largestDimension * 10;
        instance.rotation.set(-Math.PI / 2, 0, 0);
        instance.scale.set(widthScale, lengthScale, 1);
        instance.scale.multiplyScalar(visibilityScale);
        instance.updateMatrix();
        topLabels[variant].setMatrixAt(slot, instance.matrix);
      }

      boxes.instanceMatrix.needsUpdate = true;
      tape.instanceMatrix.needsUpdate = true;
      sideLabels.forEach((labels) => {
        labels.instanceMatrix.needsUpdate = true;
      });
      topLabels.forEach((labels) => {
        labels.instanceMatrix.needsUpdate = true;
      });
      if (boxes.instanceColor) boxes.instanceColor.needsUpdate = true;
    };

    updateCargo(playbackRef.current.direction, playbackRef.current.progress);

    const wheelWidth = wheelRadius * 0.82;
    const wheelZ = [-length * 0.32, -length * 0.19, length * 0.29];

    const addWheel = (x: number, z: number) => {
      const tire = new THREE.Mesh(
        new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 24),
        materials.tire,
      );
      tire.rotation.z = Math.PI / 2;
      tire.position.set(x, wheelY, z);
      truck.add(tire);

      const hub = new THREE.Mesh(
        new THREE.CylinderGeometry(wheelRadius * 0.46, wheelRadius * 0.46, wheelWidth + 0.5, 20),
        materials.hub,
      );
      hub.rotation.z = Math.PI / 2;
      hub.position.copy(tire.position);
      truck.add(hub);
    };

    for (const x of [-halfWidth - wheelWidth / 2, halfWidth + wheelWidth / 2]) {
      for (const z of wheelZ) {
        addWheel(x, z);
      }
    }

    const cabWidth = width * 0.78;
    const cabLength = Math.min(length * 0.24, width * 0.72);
    const cabHeight = Math.min(height * 0.62, cabLength * 0.9);
    const cabZ = -halfLength - cabLength / 2 - beam;
    addBox(cabWidth, cabHeight, cabLength, 0, cabHeight / 2, cabZ, materials.cab);
    addBox(
      cabWidth * 0.82,
      cabHeight * 0.43,
      beam,
      0,
      cabHeight * 0.76,
      cabZ - cabLength / 2 - beam / 2,
      materials.glass,
    );
    addBox(
      cabWidth,
      floorThickness * 2.5,
      cabLength + beam * 2,
      0,
      -floorThickness,
      cabZ,
      materials.chassis,
    );
    addBox(
      beam * 2,
      height * 0.1,
      beam,
      -cabWidth * 0.37,
      height * 0.05,
      cabZ - cabLength / 2 - beam / 2,
      materials.hub,
    );
    addBox(
      beam * 2,
      height * 0.1,
      beam,
      cabWidth * 0.37,
      height * 0.05,
      cabZ - cabLength / 2 - beam / 2,
      materials.hub,
    );

    const resizeRenderer = () => {
      const { width, height } = mount.getBoundingClientRect();
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    const resizeObserver = new ResizeObserver(resizeRenderer);
    resizeObserver.observe(mount);
    resizeRenderer();

    let frameId = 0;
    let lastDirection: "load" | "unload" | null = null;
    let lastProgress = -1;
    const render = () => {
      const currentPlayback = playbackRef.current;
      if (
        currentPlayback.direction !== lastDirection ||
        Math.abs(currentPlayback.progress - lastProgress) > 0.000001
      ) {
        updateCargo(currentPlayback.direction, currentPlayback.progress);
        if (lastDirection === currentPlayback.direction && lastProgress >= 0) {
          const progressDelta = currentPlayback.progress - lastProgress;
          rollers.forEach((roller) => {
            roller.rotation.x +=
              progressDelta *
              Math.PI *
              12 *
              (currentPlayback.direction === "load" ? 1 : -1);
          });
        }
        lastDirection = currentPlayback.direction;
        lastProgress = currentPlayback.progress;
      }
      controls.update();
      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(render);
    };
    render();

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      controls.dispose();
      cartonTexture.dispose();
      labelTextures.forEach((texture) => texture.dispose());
      warehouseWorker.group.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [
    box.height,
    box.length,
    box.width,
    cartons,
    container.height,
    container.length,
    container.width,
    timing,
  ]);

  return (
    <div
      ref={mountRef}
      className="scene-canvas"
      role="img"
      aria-label={`Interactive 3D loading bay with a ${fillPercent}% shipment, shipping conveyor, and warehouse worker handling mixed cartons based on ${box.width} by ${box.length} by ${box.height} base dimensions`}
    />
  );
}
