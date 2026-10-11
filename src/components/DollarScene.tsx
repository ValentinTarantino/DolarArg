"use client";

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

/**
 * DollarScene — Símbolo "$" 3D con bordes wireframe verdes.
 *
 * - La geometría se genera con TextGeometry (fuente helvetiker local en /public/fonts).
 * - SOLO se renderizan los bordes: EdgesGeometry + LineSegments + LineBasicMaterial (#00FF00).
 * - La malla sólida NO se añade a la escena → interior completamente hueco.
 * - Canvas transparente (sin background en la escena; el CSS de .dollar-hero pone el fondo).
 * - Sin seguimiento de cursor: la cámara solo se mueve con OrbitControls (drag/zoom)
 *   y el modelo gira solo (autoRotate).
 * - Sin partículas ni elementos de fondo: solo el "$" wireframe.
 */
const DollarScene: React.FC<{ symbol?: string; color?: string }> = ({ symbol = '$', color = '#22c55e' }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const w = mount.clientWidth;
    const h = mount.clientHeight;

    // ── Renderer (transparente, sin color de fondo) ──────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); // alpha 0 → el fondo lo aporta el CSS
    mount.appendChild(renderer.domElement);

    // ── Escena & cámara ──────────────────────────────────────────
    // Sin scene.background: el interior del "$" se ve a través del canvas.
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, w / h, 0.1, 100);
    camera.position.set(0, 0.2, 6.3);
    camera.lookAt(0, 0, 0);
    const symbolGroup = new THREE.Group();
    scene.add(symbolGroup);
    let rotationStartsAt = Number.POSITIVE_INFINITY;

    // ── Iluminación ──────────────────────────────────────────────
    // LineBasicMaterial no responde a luces, pero se mantienen por
    // completitud del entorno (y por si se añade relleno más adelante).
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    const key = new THREE.DirectionalLight(0xffffff, 1.5);
    key.position.set(4, 5, 5);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0x85efac, 1.0);
    fill.position.set(-4, 2, -3);
    scene.add(fill);

    // ── Geometría del símbolo "$" (se construye al cargar la fuente)
    let disposed = false;

    const loader = new FontLoader();
    loader.load(
      '/fonts/helvetiker_regular.typeface.json',
      (font) => {
        if (disposed) return;
        rotationStartsAt = performance.now() + 450;

        const textOptions = {
          font,
          size: 1.3,
          depth: 0.3,
          curveSegments: 16,
          bevelEnabled: false,
        };

        if (symbol === 'CLP$' || symbol === 'UY$') {
          const chars = symbol === 'CLP$' ? [
            { char: 'C', color: '#B8443E' },
            { char: 'L', color: '#B8443E' },
            { char: 'P', color: '#B8443E' },
            { char: '$', color: '#22c55e' },
          ] : [
            { char: 'U', color: '#75AADB' },
            { char: 'Y', color: '#75AADB' },
            { char: '$', color: '#22c55e' },
          ];
          const glyphs = chars.map(({ char, color: glyphColor }) => {
            const glyph = new TextGeometry(char, textOptions);
            glyph.computeBoundingBox();
            return { glyph, bounds: glyph.boundingBox!, color: glyphColor, char };
          });
          const spacing = symbol === 'CLP$' ? 0.1 : 0.12;
          const totalWidth = glyphs.reduce((width, item) => width + item.bounds.max.x - item.bounds.min.x, 0) + spacing * (glyphs.length - 1);
          let x = -totalWidth / 2;

          glyphs.forEach(({ glyph, bounds, color: glyphColor }) => {
            const width = bounds.max.x - bounds.min.x;
            glyph.translate(x - bounds.min.x, -(bounds.max.y + bounds.min.y) / 2, -(bounds.max.z + bounds.min.z) / 2);
            const edges = new THREE.EdgesGeometry(glyph, 1);
            symbolGroup.add(new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: glyphColor })));
            glyph.dispose();
            x += width + spacing;
          });
        } else if (symbol === '₿') {
          symbolGroup.scale.setScalar(0.88);
          const orangeRing = new THREE.Mesh(
            new THREE.TorusGeometry(1.25, 0.075, 12, 96),
            new THREE.MeshBasicMaterial({ color: '#F7931A' })
          );
          symbolGroup.add(orangeRing);

          const bitcoin = new TextGeometry('B', { ...textOptions, size: 1.55, depth: 0.22 });
          bitcoin.computeBoundingBox();
          const bitcoinBounds = bitcoin.boundingBox!;
          const minX = bitcoinBounds.min.x;
          const maxX = bitcoinBounds.max.x;
          const maxY = bitcoinBounds.max.y;
          const minY = bitcoinBounds.min.y;
          const centerX = (minX + maxX) / 2;
          const centerY = (minY + maxY) / 2;
          bitcoin.translate(
            -centerX,
            -centerY,
            0.04 - (bitcoinBounds.max.z + bitcoinBounds.min.z) / 2
          );
          symbolGroup.add(new THREE.Mesh(bitcoin, new THREE.MeshBasicMaterial({
            color: '#ffffff',
            side: THREE.DoubleSide,
            polygonOffset: true,
            polygonOffsetFactor: 1,
            polygonOffsetUnits: 1,
          })));
          symbolGroup.add(new THREE.LineSegments(
            new THREE.EdgesGeometry(bitcoin, 1),
            new THREE.LineBasicMaterial({ color: '#ffffff' })
          ));
          bitcoin.dispose();

          // Reforzar el borde de las dos cavidades interiores de la B.
          font.generateShapes('B', 1.55).forEach((shape) => {
            shape.holes.forEach((hole) => {
              const innerEdge = hole.getPoints(24).map((point) => new THREE.Vector3(
                point.x - centerX,
                point.y - centerY,
                0.17
              ));
              symbolGroup.add(new THREE.LineLoop(
                new THREE.BufferGeometry().setFromPoints(innerEdge),
                new THREE.LineBasicMaterial({ color: '#ffffff' })
              ));
            });
          });

          // Dos trazos simples van dentro del asta izquierda y sobresalen apenas.
          const bitcoinWidth = maxX - minX;
          const stemX = [0.12, 0.27].map((fraction) => -bitcoinWidth / 2 + bitcoinWidth * fraction);
          stemX.forEach((x) => {
            const stem = new THREE.Mesh(
              new THREE.BoxGeometry(0.07, maxY - minY + 0.36, 0.16),
              new THREE.MeshBasicMaterial({ color: '#ffffff' })
            );
            stem.position.set(x, 0, 0.14);
            symbolGroup.add(stem);
          });
        } else if (symbol === '€') {
          const geometry = new TextGeometry('C', textOptions);
          geometry.computeBoundingBox();
          const bb = geometry.boundingBox!;
          geometry.translate(
            -(bb.max.x + bb.min.x) / 2,
            -(bb.max.y + bb.min.y) / 2,
            -(bb.max.z + bb.min.z) / 2
          );
          symbolGroup.add(new THREE.LineSegments(
            new THREE.EdgesGeometry(geometry, 1),
            new THREE.LineBasicMaterial({ color })
          ));
          geometry.dispose();

          // Las barras cruzan la C y sobresalen hacia la izquierda, como en el glifo €.
          [-0.13, 0.13].forEach((y) => {
            const bar = new THREE.BoxGeometry(0.95, 0.055, 0.3);
            const edges = new THREE.EdgesGeometry(bar, 1);
            const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color }));
            line.position.set(-0.25, y, 0);
            symbolGroup.add(line);
            bar.dispose();
          });
        } else {
          const geometry = new TextGeometry(symbol, textOptions);
          geometry.computeBoundingBox();
          const bb = geometry.boundingBox!;
          geometry.translate(
            -(bb.max.x + bb.min.x) / 2,
            -(bb.max.y + bb.min.y) / 2,
            -(bb.max.z + bb.min.z) / 2
          );

          const edges = new THREE.EdgesGeometry(geometry, 1);
          symbolGroup.add(new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color })));
          geometry.dispose();
        }

        // ── Interior transparente ────────────────────────────────
        // La malla sólida NO se renderiza: el "$" es hueco y se ve a
        // través de él. Alternativa (malla invisible para raycasting):
        //
        //   const fill = new THREE.Mesh(
        //     geometry,
        //     new THREE.MeshBasicMaterial({
        //       transparent: true,
        //       opacity: 0,       // invisible
        //       depthWrite: false, // no escribe en el depth buffer
        //     })
        //   );
        //   scene.add(fill);

      },
      undefined,
      () => {
        // Si falla la carga de la fuente, la escena queda vacía
        console.error('DollarScene: no se pudo cargar /fonts/helvetiker_regular.typeface.json');
      }
    );

    // ── Controles orbitales (rotación automática, sin interacción) ─
    // ── Resize ───────────────────────────────────────────────────
    const onResize = () => {
      const nw = mount.clientWidth;
      const nh = mount.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', onResize);

    // ── Bucle de animación ───────────────────────────────────────
    let raf: number;
    const animate = (timestamp: number) => {
      raf = requestAnimationFrame(animate);
      if (timestamp >= rotationStartsAt) {
        const elapsed = (timestamp - rotationStartsAt) / 1000;
        // Una vuelta lenta conserva la lectura sin detener el movimiento.
        symbolGroup.rotation.y = elapsed * 0.18;
        symbolGroup.position.y = Math.sin(elapsed * 1.1) * 0.055;
      }
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(animate);

    // ── Limpieza al desmontar ────────────────────────────────────
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      // Liberar geometrías y materiales de todos los objetos de la escena
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m) => m && m.dispose());
      });

      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [symbol, color]);

  return (
    <div
      ref={mountRef}
      style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
    />
  );
};

export default DollarScene;
