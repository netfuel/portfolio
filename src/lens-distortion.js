/**
 * Lens Distortion Effect with Chromatic Aberration
 * Uses CSS blur, contrast, and color overlays for dramatic lens effect
 */

export function initLensDistortion(hero) {
  if (!hero) return null;

  // Get or create a distortion wrapper for the rings
  const rings = hero.querySelector('.hero__rings');
  if (!rings) return null;

  // Create overlay divs for RGB split and glow effect
  const redOverlay = document.createElement('div');
  redOverlay.style.position = 'absolute';
  redOverlay.style.top = '0';
  redOverlay.style.left = '0';
  redOverlay.style.width = '100%';
  redOverlay.style.height = '100%';
  redOverlay.style.pointerEvents = 'none';
  redOverlay.style.zIndex = '2';
  redOverlay.style.opacity = '0';
  hero.appendChild(redOverlay);

  const blueOverlay = document.createElement('div');
  blueOverlay.style.position = 'absolute';
  blueOverlay.style.top = '0';
  blueOverlay.style.left = '0';
  blueOverlay.style.width = '100%';
  blueOverlay.style.height = '100%';
  blueOverlay.style.pointerEvents = 'none';
  blueOverlay.style.zIndex = '2';
  blueOverlay.style.opacity = '0';
  hero.appendChild(blueOverlay);

  // Chromatic aberration wrapper - creates the RGB split
  const chromaticLayer = document.createElement('div');
  chromaticLayer.style.position = 'absolute';
  chromaticLayer.style.top = '0';
  chromaticLayer.style.left = '0';
  chromaticLayer.style.width = '100%';
  chromaticLayer.style.height = '100%';
  chromaticLayer.style.pointerEvents = 'none';
  chromaticLayer.style.zIndex = '2';
  chromaticLayer.style.opacity = '0';
  chromaticLayer.style.mixBlendMode = 'lighten';
  hero.appendChild(chromaticLayer);

  const state = {
    distortionAmount: 0,
  };

  return {
    setDistortion: (amount) => {
      amount = Math.max(0, Math.min(1, amount));
      state.distortionAmount = amount;

      // Barrel distortion via CSS blur and scale on rings
      const blurAmount = amount * 6;
      const scaleFactor = 1 + amount * 0.2;
      rings.style.filter = `blur(${blurAmount}px) brightness(${0.85 + amount * 0.15})`;
      rings.style.transform = `scale(${scaleFactor})`;

      // Dramatic red chromatic glow on right/top
      const shiftAmount = amount * 40;
      redOverlay.style.opacity = (amount * 0.55).toString();
      redOverlay.style.background = `
        radial-gradient(
          ellipse at calc(50% + ${shiftAmount * 0.5}px) calc(50% - ${shiftAmount * 0.4}px),
          rgba(255, 40, 40, ${amount * 0.8}) 0%,
          rgba(255, 80, 80, ${amount * 0.5}) 20%,
          rgba(255, 120, 120, ${amount * 0.2}) 40%,
          transparent 70%
        )
      `;
      redOverlay.style.boxShadow = `
        inset ${shiftAmount}px ${-shiftAmount * 0.6}px ${shiftAmount * 1.2}px rgba(255, 60, 60, ${amount * 0.4}),
        0 0 ${amount * 60}px rgba(255, 60, 60, ${amount * 0.25})
      `;

      // Dramatic blue chromatic glow on left/bottom
      blueOverlay.style.opacity = (amount * 0.55).toString();
      blueOverlay.style.background = `
        radial-gradient(
          ellipse at calc(50% - ${shiftAmount * 0.5}px) calc(50% + ${shiftAmount * 0.4}px),
          rgba(40, 100, 255, ${amount * 0.8}) 0%,
          rgba(80, 130, 255, ${amount * 0.5}) 20%,
          rgba(120, 160, 255, ${amount * 0.2}) 40%,
          transparent 70%
        )
      `;
      blueOverlay.style.boxShadow = `
        inset ${-shiftAmount}px ${shiftAmount * 0.6}px ${shiftAmount * 1.2}px rgba(60, 100, 255, ${amount * 0.4}),
        0 0 ${amount * 60}px rgba(60, 100, 255, ${amount * 0.25})
      `;

      // Additional chromatic fringing at edges
      chromaticLayer.style.opacity = (amount * 0.6).toString();
      chromaticLayer.style.borderTop = `${Math.max(0, amount * 10)}px solid rgba(255, 60, 60, ${amount * 0.3})`;
      chromaticLayer.style.borderRight = `${Math.max(0, amount * 10)}px solid rgba(60, 100, 255, ${amount * 0.3})`;
      chromaticLayer.style.boxShadow = `
        0 0 ${amount * 80}px rgba(255, 60, 60, ${amount * 0.25}),
        0 0 ${amount * 60}px rgba(60, 100, 255, ${amount * 0.25}),
        inset 0 0 ${amount * 40}px rgba(255, 100, 100, ${amount * 0.15}),
        inset 0 0 ${amount * 40}px rgba(100, 150, 255, ${amount * 0.15})
      `;
    },
    dispose: () => {
      redOverlay.remove();
      blueOverlay.remove();
      chromaticLayer.remove();
    },
  };
}
