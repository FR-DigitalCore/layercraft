"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

/**
 * Aperçu STL client-only. Doit être importé via `next/dynamic` avec `ssr: false` :
 * Three.js touche à `window` dès l'initialisation du renderer.
 */
export default function StlViewer({ url }: { url: string }) {
  const conteneur = useRef<HTMLDivElement>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(true);
  const [dimensions, setDimensions] = useState<string | null>(null);

  useEffect(() => {
    const hote = conteneur.current;
    if (!hote) return;

    let annule = false;
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      45,
      hote.clientWidth / hote.clientHeight,
      0.1,
      5000,
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(hote.clientWidth, hote.clientHeight);
    hote.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x333333, 1.6));
    const directionnelle = new THREE.DirectionalLight(0xffffff, 1.5);
    directionnelle.position.set(1, 1.4, 1);
    scene.add(directionnelle);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;

    let geometrie: THREE.BufferGeometry | null = null;
    let materiau: THREE.Material | null = null;

    new STLLoader().load(
      url,
      (geo) => {
        if (annule) return;
        geometrie = geo;
        geo.center();
        geo.computeVertexNormals();

        materiau = new THREE.MeshStandardMaterial({
          color: 0xff6b2b,
          metalness: 0.1,
          roughness: 0.65,
          flatShading: false,
        });
        scene.add(new THREE.Mesh(geo, materiau));

        // Cadrage automatique sur la boîte englobante
        geo.computeBoundingBox();
        const boite = geo.boundingBox!;
        const taille = boite.getSize(new THREE.Vector3());
        const plusGrand = Math.max(taille.x, taille.y, taille.z) || 1;
        const distance = plusGrand / (2 * Math.tan((Math.PI * camera.fov) / 360));

        camera.position.set(distance * 0.9, distance * 0.7, distance * 1.1);
        camera.near = plusGrand / 100;
        camera.far = plusGrand * 100;
        camera.updateProjectionMatrix();
        controls.target.set(0, 0, 0);
        controls.update();

        setDimensions(
          `${taille.x.toFixed(1)} × ${taille.y.toFixed(1)} × ${taille.z.toFixed(1)} mm`,
        );
        setChargement(false);
      },
      undefined,
      () => {
        if (annule) return;
        setErreur("Aperçu 3D indisponible pour ce fichier.");
        setChargement(false);
      },
    );

    let frame = 0;
    const boucle = () => {
      frame = requestAnimationFrame(boucle);
      controls.update();
      renderer.render(scene, camera);
    };
    boucle();

    const observer = new ResizeObserver(() => {
      if (!hote.clientWidth || !hote.clientHeight) return;
      camera.aspect = hote.clientWidth / hote.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(hote.clientWidth, hote.clientHeight);
    });
    observer.observe(hote);

    return () => {
      annule = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      geometrie?.dispose();
      materiau?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [url]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-surface-haut">
      <div ref={conteneur} className="h-72 w-full" />

      {chargement && !erreur && (
        <p className="absolute inset-0 flex items-center justify-center text-sm text-muted">
          Chargement de l&apos;aperçu…
        </p>
      )}
      {erreur && (
        <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-muted">
          {erreur}
        </p>
      )}
      {dimensions && (
        <p className="absolute bottom-2 left-3 text-xs text-muted">
          Encombrement : {dimensions}
        </p>
      )}
    </div>
  );
}
