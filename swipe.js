export function enableSwipe(card, { onLeft, onRight, threshold = 120 }) {
  let startX = 0;
  let dx = 0;
  let dragging = false;

  function down(e) {
    dragging = true;
    startX = e.clientX;
    dx = 0;
    card.style.transition = "none";
    card.setPointerCapture(e.pointerId);
  }

  function move(e) {
    if (!dragging) return;
    dx = e.clientX - startX;
    card.style.transform = `translateX(${dx}px) rotate(${dx / 8}deg)`;
  }

  function up() {
    if (!dragging) return;
    dragging = false;
    if (Math.abs(dx) < threshold) {
      card.style.transition = "transform .2s ease";
      card.style.transform = "";
      return;
    }
    const dir = dx > 0 ? 1 : -1;
    card.style.transition = "transform .3s ease, opacity .3s ease";
    card.style.transform = `translateX(${dir * 150}%) rotate(${dir * 20}deg)`;
    card.style.opacity = "0";
    card.addEventListener("transitionend", function end() {
      card.removeEventListener("transitionend", end);
      card.style.transition = "none";
      card.style.transform = "";
      card.style.opacity = "";
      (dir > 0 ? onRight : onLeft)();
    });
  }

  card.addEventListener("pointerdown", down);
  card.addEventListener("pointermove", move);
  card.addEventListener("pointerup", up);
  card.addEventListener("pointercancel", up);
}
