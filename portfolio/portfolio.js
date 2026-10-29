/* /portfolio — muted wall autoplay, open-with-sound, version switchers. */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Header glass after the first few pixels (never hides on scroll).
  const header = $("[data-header]");
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 12);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // Wall: loops play only while visible, and not at all with reduced motion.
  const loops = $$("[data-wall] video");
  if (!calm && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) target.play().catch(() => {});
        else target.pause();
      });
    }, { threshold: 0.25 });
    loops.forEach((v) => io.observe(v));
  }
  // Tally light on the monitor that is live.
  loops.forEach((v) => {
    const unit = v.closest(".pf-unit");
    v.addEventListener("playing", () => unit.classList.add("is-live"));
    v.addEventListener("pause", () => unit.classList.remove("is-live"));
  });

  // Players show a poster and one play button; browser controls appear once started.
  const start = (video) => {
    video.closest(".pf-player").classList.add("is-started");
    video.controls = true;
    video.muted = false;
    video.play().catch(() => {});
  };
  $$(".pf-play").forEach((btn) => btn.addEventListener("click", () => {
    const video = $("video", btn.parentElement);
    start(video);
    video.focus({ preventScroll: true });
  }));

  // Only one ad with sound at a time.
  const players = $$("[data-case] video");
  players.forEach((v) => v.addEventListener("play", () => {
    players.forEach((o) => { if (o !== v) o.pause(); });
  }));

  // An ad scrolled out of view stops instead of talking off-screen.
  if ("IntersectionObserver" in window) {
    const away = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => { if (!isIntersecting) target.pause(); });
    }, { threshold: 0.15 });
    players.forEach((v) => away.observe(v));
  }

  // Tapping a phone on the wall jumps to its case and starts it with sound.
  $$("[data-open]").forEach((link) => link.addEventListener("click", (e) => {
    const box = document.getElementById(link.dataset.open);
    const video = box && $("video", box);
    if (!video) return;
    e.preventDefault();
    $$(".pf-case.is-target").forEach((c) => c.classList.remove("is-target"));
    box.classList.add("is-target");
    box.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "center" });
    history.replaceState(null, "", "#" + box.id);
    start(video);
  }));

  // Version switchers (hooks, cutdowns, formats).
  $$(".pf-variants").forEach((group) => {
    const box = group.closest("[data-case]");
    const frame = $(".pf-player", box);
    const video = $("video", frame);
    group.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-src]");
      if (!btn || btn.getAttribute("aria-pressed") === "true") return;
      const wasPlaying = !video.paused;
      $$("button", group).forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      if (btn.dataset.shape) {
        const screen = btn.dataset.shape === "screen";
        frame.classList.toggle("pf-screen", screen);
        frame.classList.toggle("pf-phone", !screen);
        box.dataset.shape = btn.dataset.shape;
      }
      video.poster = btn.dataset.poster;
      video.src = btn.dataset.src;
      if (wasPlaying) video.play().catch(() => {});
    });
  });
})();
