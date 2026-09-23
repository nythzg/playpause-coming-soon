const motionButton = document.querySelector('.motion-toggle');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let manuallyPaused = false;

function syncMotion() {
  const paused = manuallyPaused || reducedMotion.matches || document.hidden;
  document.body.classList.toggle('is-paused', paused);
  motionButton.hidden = reducedMotion.matches;
  motionButton.setAttribute('aria-pressed', String(manuallyPaused));
  motionButton.setAttribute('aria-label', manuallyPaused ? 'Play animation' : 'Pause animation');
  motionButton.title = manuallyPaused ? 'Play animation' : 'Pause animation';
}

motionButton.addEventListener('click', () => {
  manuallyPaused = !manuallyPaused;
  syncMotion();
});
reducedMotion.addEventListener('change', syncMotion);
document.addEventListener('visibilitychange', syncMotion);
syncMotion();
