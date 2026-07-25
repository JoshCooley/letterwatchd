const THRESHOLD = 120;         // px of drag before a swipe commits vs snaps back
const TILT = 8;                // drag tilt: rotation in deg is dx / TILT (lower = more tilt)
const PEEK_FADE = 2.5;         // next card reaches full opacity over THRESHOLD * PEEK_FADE px
const FLING_SECONDS = 0.7;     // fling-off duration (higher = slower)
const FLING_REACH = 1;         // how far the card flings, in viewport widths
const FLING_LIFT = 0.15;       // upward drift while flinging, in viewport heights
const FLING_SPIN = 50;         // extra degrees the card spins as it flings off
const PEEK_FLING_SECONDS = 0.5; // how long the next card takes to fade fully in during a fling
const SNAP_SECONDS = 0.2;      // snap-back duration when a drag is released short of THRESHOLD
const GLOW_MAX = 0.4;          // peak opacity of the edge glow

export function enableSwipe(card, { peek, onLeft, onRight }) {
  const watch = card.querySelector(".stamp.watch");
  const skip = card.querySelector(".stamp.skip");
  const glowLeft = document.querySelector(".glow.left");
  const glowRight = document.querySelector(".glow.right");

  let startX = 0;
  let dx = 0;
  let dragging = false;
  let finishFling = null;

  function down(e) {
    if (finishFling) finishFling();
    dragging = true;
    startX = e.clientX;
    dx = 0;
    card.style.transition = "none";
    peek.style.transition = "none";
    watch.style.transition = "none";
    skip.style.transition = "none";
    glowLeft.style.transition = "none";
    glowRight.style.transition = "none";
    card.setPointerCapture(e.pointerId);
  }

  function move(e) {
    if (!dragging) return;
    dx = e.clientX - startX;
    card.style.transform = `translateX(${dx}px) rotate(${dx / TILT}deg)`;
    peek.style.opacity = Math.min(Math.abs(dx) / (THRESHOLD * PEEK_FADE), 1);
    const stamp = Math.min(Math.abs(dx) / THRESHOLD, 1);
    watch.style.opacity = dx > 0 ? stamp : 0;
    skip.style.opacity = dx > 0 ? 0 : stamp;
    glowRight.style.opacity = dx > 0 ? stamp * GLOW_MAX : 0;
    glowLeft.style.opacity = dx > 0 ? 0 : stamp * GLOW_MAX;
  }

  function fadeGlows(seconds) {
    glowLeft.style.transition = `opacity ${seconds}s ease`;
    glowRight.style.transition = `opacity ${seconds}s ease`;
    glowLeft.style.opacity = "0";
    glowRight.style.opacity = "0";
  }

  function fling(dir) {
    if (finishFling) finishFling();
    watch.style.transition = "none";
    skip.style.transition = "none";
    watch.style.opacity = dir > 0 ? "1" : "0";
    skip.style.opacity = dir > 0 ? "0" : "1";
    card.style.transition = `transform ${FLING_SECONDS}s ease-out, opacity ${FLING_SECONDS}s ease-out`;
    card.style.transform = `translate(${dir * innerWidth * FLING_REACH}px, ${-innerHeight * FLING_LIFT}px) rotate(${dx / TILT + dir * FLING_SPIN}deg)`;
    card.style.opacity = "0";
    peek.style.transition = `opacity ${PEEK_FLING_SECONDS}s ease`;
    peek.style.opacity = "1";
    const glow = dir > 0 ? glowRight : glowLeft;
    const otherGlow = dir > 0 ? glowLeft : glowRight;
    otherGlow.style.transition = `opacity ${FLING_SECONDS}s ease`;
    otherGlow.style.opacity = "0";
    glow.style.transition = "none";
    glow.style.opacity = GLOW_MAX;
    void glow.offsetWidth; // reflow so the glow fades from full even on a key/button fling
    glow.style.transition = `opacity ${FLING_SECONDS}s ease`;
    glow.style.opacity = "0";
    function finish() {
      card.removeEventListener("transitionend", finish);
      finishFling = null;
      card.style.transition = "none";
      card.style.transform = "";
      card.style.opacity = "";
      watch.style.opacity = "0";
      skip.style.opacity = "0";
      (dir > 0 ? onRight : onLeft)();
    }
    finishFling = finish;
    card.addEventListener("transitionend", finish);
  }

  function up() {
    if (!dragging) return;
    dragging = false;
    if (Math.abs(dx) < THRESHOLD) {
      card.style.transition = `transform ${SNAP_SECONDS}s ease`;
      card.style.transform = "";
      peek.style.transition = `opacity ${SNAP_SECONDS}s ease`;
      peek.style.opacity = "0";
      watch.style.transition = `opacity ${SNAP_SECONDS}s ease`;
      skip.style.transition = `opacity ${SNAP_SECONDS}s ease`;
      watch.style.opacity = "0";
      skip.style.opacity = "0";
      fadeGlows(SNAP_SECONDS);
      return;
    }
    fling(dx > 0 ? 1 : -1);
  }

  card.addEventListener("pointerdown", down);
  card.addEventListener("pointermove", move);
  card.addEventListener("pointerup", up);
  card.addEventListener("pointercancel", up);

  return {
    left: () => { dx = 0; fling(-1); },
    right: () => { dx = 0; fling(1); },
  };
}
