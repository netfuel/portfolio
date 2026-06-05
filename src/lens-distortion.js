/**
 * Lens Barrel Distortion Effect
 * Creates a pronounced convex bulge effect using CSS transforms and filters
 */

export function initLensDistortion(hero) {
  if (!hero) return null;

  const rings = hero.querySelector('.hero__rings');
  if (!rings) return null;

  // Create chromatic aberration layers for color split
  const redGlow = document.createElement('div');
  redGlow.style.position = 'absolute';
  redGlow.style.top = '0';
  redGlow.style.left = '0';
  redGlow.style.width = '100%';
  redGlow.style.height = '100%';
  redGlow.style.pointerEvents = 'none';
  redGlow.style.zIndex = '2';
  redGlow.style.opacity = '0';
  hero.appendChild(redGlow);

  const blueGlow = document.createElement('div');
  blueGlow.style.position = 'absolute';
  blueGlow.style.top = '0';
  blueGlow.style.left = '0';
  blueGlow.style.width = '100%';
  blueGlow.style.height = '100%';
  blueGlow.style.pointerEvents = 'none';
  blueGlow.style.zIndex = '2';
  blueGlow.style.opacity = '0';
  hero.appendChild(blueGlow);

  const state = {
    distortionAmount: 0,
    redGlow,
    blueGlow,
  };

  return {
    setDistortion: (amount) => {
      amount = Math.max(0, Math.min(1, amount));
      state.distortionAmount = amount;

      // Barrel bulge effect: scale center more, create convex lens appearance
      const bulgeFactor = 1 + amount * 0.4; // Up to 40% scale increase
      const blurAmount = amount * 3;

      // Primary distortion: scale and blur to create glass lens effect
      rings.style.transform = `scale(${bulgeFactor})`;
      rings.style.filter = `blur(${blurAmount}px)`;

      // Create prominent red chromatic aberration on edges (right/top)
      const redOpacity = amount * 0.6;
      const redShift = amount * 30;
      redGlow.style.opacity = redOpacity.toString();
      redGlow.style.background = `
        radial-gradient(
          circle at calc(50% + ${redShift * 0.3}%) calc(50% - ${redShift * 0.3}%),
          rgba(255, 50, 80, ${amount * 0.8}) 0%,
          rgba(255, 100, 120, ${amount * 0.5}) 15%,
          rgba(255, 150, 150, ${amount * 0.2}) 30%,
          transparent 60%
        )
      `;
      redGlow.style.boxShadow = `
        0 0 ${amount * 80}px rgba(255, 60, 100, ${amount * 0.5}),
        inset 0 0 ${amount * 50}px rgba(255, 80, 120, ${amount * 0.3})
      `;

      // Create prominent blue chromatic aberration on opposite edges (left/bottom)
      const blueOpacity = amount * 0.6;
      const blueShift = amount * 30;
      blueGlow.style.opacity = blueOpacity.toString();
      blueGlow.style.background = `
        radial-gradient(
          circle at calc(50% - ${blueShift * 0.3}%) calc(50% + ${blueShift * 0.3}%),
          rgba(80, 120, 255, ${amount * 0.8}) 0%,
          rgba(120, 150, 255, ${amount * 0.5}) 15%,
          rgba(150, 180, 255, ${amount * 0.2}) 30%,
          transparent 60%
        )
      `;
      blueGlow.style.boxShadow = `
        0 0 ${amount * 80}px rgba(80, 120, 255, ${amount * 0.5}),
        inset 0 0 ${amount * 50}px rgba(100, 150, 255, ${amount * 0.3})
      `;
    },
    dispose: () => {
      redGlow.remove();
      blueGlow.remove();
    },
  };
}
