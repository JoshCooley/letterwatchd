export function enableSwipe(card) {
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
    card.style.transition = "transform .2s ease";
    card.style.transform = "";
  }

  card.addEventListener("pointerdown", down);
  card.addEventListener("pointermove", move);
  card.addEventListener("pointerup", up);
  card.addEventListener("pointercancel", up);
}
