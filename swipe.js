const THRESHOLD = 120;         // px of drag before a swipe commits vs snaps back
const TILT = 8;                // drag tilt: rotation in deg is dx / TILT (lower = more tilt)
const PEEK_FADE = 2.5;         // next card reaches full opacity over THRESHOLD * PEEK_FADE px
const FLING_SECONDS = 0.7;     // fling-off duration (higher = slower)
const FLING_REACH = 1;         // how far the card flings, in viewport widths
const FLING_LIFT = 0.15;       // upward drift while flinging, in viewport heights
const FLING_SPIN = 50;         // extra degrees the card spins as it flings off
const PEEK_FLING_SECONDS = 0.5; // how long the next card takes to fade fully in during a fling
const SNAP_SECONDS = 0.2;      // snap-back duration when a drag is released short of THRESHOLD

export function enableSwipe(card, { peek, onLeft, onRight }) {
  const watch = card.querySelector(".stamp.watch");
  const skip = card.querySelector(".stamp.skip");

  let startX = 0;
  let dx = 0;
  let dragging = false;

  function down(e) {
    dragging = true;
    startX = e.clientX;
    dx = 0;
    card.style.transition = "none";
    peek.style.transition = "none";
    watch.style.transition = "none";
    skip.style.transition = "none";
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
      return;
    }
    const dir = dx > 0 ? 1 : -1;
    const x = dir * innerWidth * FLING_REACH;
    const y = -innerHeight * FLING_LIFT;
    const rot = dx / TILT + dir * FLING_SPIN;
    card.style.transition = `transform ${FLING_SECONDS}s ease-out, opacity ${FLING_SECONDS}s ease-out`;
    card.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg)`;
    card.style.opacity = "0";
    peek.style.transition = `opacity ${PEEK_FLING_SECONDS}s ease`;
    peek.style.opacity = "1";
    card.addEventListener("transitionend", function end() {
      card.removeEventListener("transitionend", end);
      card.style.transition = "none";
      card.style.transform = "";
      card.style.opacity = "";
      watch.style.opacity = "0";
      skip.style.opacity = "0";
      (dir > 0 ? onRight : onLeft)();
    });
  }

  card.addEventListener("pointerdown", down);
  card.addEventListener("pointermove", move);
  card.addEventListener("pointerup", up);
  card.addEventListener("pointercancel", up);
}
