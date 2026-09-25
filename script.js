/* Dmytro Nour — portfolio interactions. Vanilla JS, no dependencies. */
(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const numberFormat = new Intl.NumberFormat("en-US");

  /* ---------- One rAF-batched scroll loop for everything scroll-linked ---------- */
  const scrollers = [];
  let ticking = false;
  const runScrollers = () => {
    ticking = false;
    const vh = window.innerHeight;
    scrollers.forEach((fn) => fn(vh));
  };
  const requestScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(runScrollers);
    }
  };
  window.addEventListener("scroll", requestScroll, { passive: true });
  window.addEventListener("resize", requestScroll);

  /* ---------- The thread that runs through the page ---------- */
  const progress = $(".thread-progress");
  if (progress) {
    scrollers.push(() => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.setProperty("--p", max > 0 ? (window.scrollY / max).toFixed(4) : 0);
    });
  }

  /* ---------- Year & Athens clock ---------- */
  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
  const clocks = $$("[data-clock]");
  if (clocks.length) {
    const clockFormat = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Athens" });
    const tick = () => {
      const time = clockFormat.format(new Date());
      clocks.forEach((el) => (el.textContent = time));
    };
    tick();
    setInterval(tick, 15000);
  }

  /* ---------- Header: stays put, turns to glass once the page moves ---------- */
  const header = $("[data-header]");
  const menu = $("[data-menu]");
  const menuToggle = $("[data-menu-toggle]");
  const menuIsOpen = () => menuToggle && menuToggle.getAttribute("aria-expanded") === "true";
  if (header) {
    scrollers.push(() => header.classList.toggle("is-scrolled", window.scrollY > 12));
  }

  if (menu && menuToggle) {
    const setMenu = (open) => {
      menuToggle.setAttribute("aria-expanded", String(open));
      menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      menu.hidden = !open;
      document.documentElement.style.overflow = open ? "hidden" : "";
    };
    menuToggle.addEventListener("click", () => setMenu(!menuIsOpen()));
    $$("a", menu).forEach((link) => link.addEventListener("click", () => setMenu(false)));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menuIsOpen()) {
        setMenu(false);
        menuToggle.focus();
      }
    });
    window.matchMedia("(min-width: 981px)").addEventListener("change", () => setMenu(false));
  }

  // Highlight the nav link of the section in view.
  const navLinks = $$(".site-nav a");
  if (navLinks.length && "IntersectionObserver" in window) {
    const byId = new Map(navLinks.map((a) => [a.getAttribute("href").slice(1), a]));
    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const link = byId.get(entry.target.id) || null;
          navLinks.forEach((a) => a.classList.toggle("is-current", a === link));
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    byId.forEach((_, id) => {
      const section = document.getElementById(id);
      if (section) navObserver.observe(section);
    });
    // Sections without a nav link (hero, contact) clear the highlight.
    ["top", "contact"].forEach((id) => {
      const section = document.getElementById(id);
      if (section) navObserver.observe(section);
    });
  }

  /* ---------- Data bars (real commit counts) ---------- */
  $$("[data-bars]").forEach((box) => {
    const values = box.dataset.bars.split(",").map(Number);
    const max = Math.max(...values);
    box.innerHTML = values
      .map((v, i) => `<i style="--h:${(v / max).toFixed(3)};--i:${i}" title="${v} commit${v === 1 ? "" : "s"}"></i>`)
      .join("");
  });

  /* ---------- Reveal on scroll + count-up ---------- */
  const countUp = (el) => {
    const target = Number(el.dataset.count);
    if (reduceMotion || !target) return;
    const start = performance.now();
    const duration = 1600;
    const step = (now) => {
      const t = clamp((now - start) / duration, 0, 1);
      el.textContent = numberFormat.format(Math.round(target * easeOutExpo(t)));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const revealTargets = $$("[data-reveal]");
  if ("IntersectionObserver" in window) {
    if (!reduceMotion) $$("[data-count]").forEach((el) => (el.textContent = "0"));
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          $$("[data-count]", entry.target).forEach(countUp);
          revealObserver.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );
    revealTargets.forEach((el) => revealObserver.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- The hoop: a portrait woven from one continuous thread ---------- */
  const hoop = $("[data-hoop]");
  const weave = { total: 0, drawn: 0 };
  if (hoop) {
    const paper = $(".hoop-paper", hoop);
    const canvas = $(".hoop-canvas", hoop);
    const needle = $(".hoop-needle", hoop);
    const ctx = canvas.getContext("2d");
    const nctx = needle.getContext("2d");
    const counter = $("[data-weave-count]");
    const notes = $$(".note", hoop);
    const reweaveBtn = $("[data-reweave]");
    const photoBtn = $("[data-photo]");
    const DURATION = 7200;

    let seq = null;
    let pins = [];
    let size = 0;
    let dpr = 1;
    let raf = 0;
    let startTime = 0;
    let started = false;

    const layout = () => {
      // Layout width, not the transformed rect: the hoop scales in on load.
      size = canvas.offsetWidth;
      if (!size || !seq) return false;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const px = Math.round(size * dpr);
      canvas.width = canvas.height = needle.width = needle.height = px;
      const c = px / 2;
      const r = c - 1.2 * dpr;
      const count = weave.pinCount;
      pins = Array.from({ length: count }, (_, i) => {
        const a = (2 * Math.PI * i) / count - Math.PI / 2;
        return [c + r * Math.cos(a), c + r * Math.sin(a)];
      });
      return true;
    };

    const inkStyle = () => {
      // Keep the tone constant across sizes: smaller hoop, lighter thread.
      const k = clamp(size / 560, 0.5, 1.15);
      ctx.lineWidth = 0.6 * dpr;
      ctx.strokeStyle = `rgba(22, 24, 21, ${(0.13 * k).toFixed(3)})`;
    };

    const drawPins = () => {
      ctx.fillStyle = "rgba(70, 56, 34, .55)";
      const radius = 0.85 * dpr;
      pins.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    // Each pass is stroked on its own so the alpha builds up like real thread.
    const drawRange = (from, to) => {
      inkStyle();
      for (let i = from; i < to; i++) {
        const a = pins[seq[i]];
        const b = pins[seq[i + 1]];
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
        ctx.stroke();
      }
    };

    const redraw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawPins();
      drawRange(0, weave.drawn);
    };

    const drawNeedle = (i) => {
      nctx.clearRect(0, 0, needle.width, needle.height);
      if (i <= 0 || i >= weave.total) return;
      const tail = Math.max(0, i - 4);
      for (let k = tail; k < i; k++) {
        const a = pins[seq[k]];
        const b = pins[seq[k + 1]];
        nctx.strokeStyle = `rgba(92, 122, 14, ${((k - tail + 1) / (i - tail)).toFixed(2)})`;
        nctx.lineWidth = 1.5 * dpr;
        nctx.beginPath();
        nctx.moveTo(a[0], a[1]);
        nctx.lineTo(b[0], b[1]);
        nctx.stroke();
      }
      const [x, y] = pins[seq[i]];
      nctx.fillStyle = "#141614";
      nctx.beginPath();
      nctx.arc(x, y, 4 * dpr, 0, Math.PI * 2);
      nctx.fill();
      nctx.fillStyle = "#d6f26b";
      nctx.beginPath();
      nctx.arc(x, y, 2.4 * dpr, 0, Math.PI * 2);
      nctx.fill();
    };

    const updateMeta = () => {
      if (counter) counter.textContent = numberFormat.format(weave.drawn);
      const progress = weave.drawn / weave.total;
      notes.forEach((note) => note.classList.toggle("is-on", progress >= Number(note.dataset.at)));
    };

    // Slow start so you can watch the needle, then accelerate into the finish.
    const segmentsAt = (t) => {
      if (t < 0.14) return Math.round(lerp(0, 48, t / 0.14));
      return Math.round(lerp(48, weave.total, easeInOut((t - 0.14) / 0.86)));
    };

    const finish = () => {
      weave.drawn = weave.total;
      drawNeedle(-1);
      updateMeta();
      hoop.classList.add("is-done");
    };

    const frame = (now) => {
      if (!startTime) startTime = now;
      const t = clamp((now - startTime) / DURATION, 0, 1);
      const target = segmentsAt(t);
      if (target > weave.drawn) {
        drawRange(weave.drawn, target);
        weave.drawn = target;
      }
      drawNeedle(weave.drawn);
      updateMeta();
      if (t < 1) raf = requestAnimationFrame(frame);
      else finish();
    };

    const play = () => {
      cancelAnimationFrame(raf);
      hoop.classList.remove("is-done");
      weave.drawn = 0;
      startTime = 0;
      redraw();
      updateMeta();
      if (reduceMotion) {
        drawRange(0, weave.total);
        finish();
        return;
      }
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (started || !seq || !layout()) return;
      started = true;
      play();
    };

    fetch("assets/weave.json")
      .then((response) => response.json())
      .then((data) => {
        seq = data.seq;
        weave.pinCount = data.pins;
        weave.total = seq.length - 1;
        const io = new IntersectionObserver(
          (entries) => {
            if (entries.some((e) => e.isIntersecting)) {
              io.disconnect();
              setTimeout(start, reduceMotion ? 0 : 650);
            }
          },
          { threshold: 0.3 }
        );
        io.observe(hoop);
      })
      .catch(() => {
        // Without the thread data we still show a real portrait.
        paper.classList.add("is-photo");
        hoop.classList.add("is-done");
      });

    if ("ResizeObserver" in window) {
      let lastSize = 0;
      new ResizeObserver(() => {
        const next = canvas.offsetWidth;
        if (!started || Math.abs(next - lastSize) < 1) return;
        lastSize = next;
        if (layout()) {
          redraw();
          drawNeedle(weave.drawn < weave.total ? weave.drawn : -1);
        }
      }).observe(canvas);
    }

    if (reweaveBtn) reweaveBtn.addEventListener("click", () => started && play());

    // Photo lens (desktop) and a photo toggle (everyone).
    let photoMode = false;
    if (finePointer) {
      paper.addEventListener("pointermove", (event) => {
        if (photoMode) return;
        const rect = paper.getBoundingClientRect();
        paper.style.setProperty("--lx", `${event.clientX - rect.left}px`);
        paper.style.setProperty("--ly", `${event.clientY - rect.top}px`);
        paper.classList.add("is-lens");
      });
      paper.addEventListener("pointerleave", () => paper.classList.remove("is-lens"));
    }
    if (photoBtn) {
      photoBtn.addEventListener("click", () => {
        photoMode = !photoMode;
        paper.style.removeProperty("--lx");
        paper.style.removeProperty("--ly");
        paper.classList.remove("is-lens");
        paper.classList.toggle("is-photo", photoMode);
        photoBtn.setAttribute("aria-pressed", String(photoMode));
        photoBtn.textContent = photoMode ? "Show thread" : "Show photo";
      });
    }
  }

  /* ---------- Hero: coloured threads from "the best" feeding the hoop ---------- */
  const heroCanvas = $(".hero-threads");
  const hero = $(".hero");
  if (heroCanvas && hero && hoop && !reduceMotion) {
    const ctx = heroCanvas.getContext("2d");
    const palette = ["214,242,107", "167,139,250", "255,178,91", "103,212,241", "255,130,102", "237,234,224"];
    const threads = palette.map((rgb, i) => ({ rgb, seed: i * 1.93 + 0.4, push: [0, 0], pushTo: [0, 0] }));
    const mouse = { x: -9999, y: -9999 };
    let W = 0;
    let H = 0;
    let dpr = 1;
    let center = [0, 0];
    let radius = 0;
    let raf = 0;
    let visible = true;

    const measure = () => {
      const r = hero.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width;
      H = r.height;
      heroCanvas.width = Math.round(W * dpr);
      heroCanvas.height = Math.round(H * dpr);
      const h = hoop.getBoundingClientRect();
      center = [h.left - r.left + h.width / 2, h.top - r.top + h.height / 2];
      radius = h.width / 2;
    };

    const bezier = (t, p0, p1, p2, p3) => {
      const u = 1 - t;
      return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
    };

    const draw = (time) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const narrow = W < 981;
      threads.forEach((thread, i) => {
        const wobble = time * 0.00022;
        // Enter the hoop's left rim from the bottom-left corner, low and out of the copy's way.
        const sx = -30;
        const sy = narrow ? center[1] - radius * 0.1 + i * radius * 0.14 : H * 0.94 + i * 10;
        const angle = Math.PI * (narrow ? 0.86 + i * 0.05 : 1.12 - i * 0.048);
        const ex = center[0] + Math.cos(angle) * radius * 0.97;
        const ey = center[1] + Math.sin(angle) * radius * 0.97;
        let c1x = narrow ? lerp(sx, ex, 0.35) : lerp(sx, ex, 0.55);
        let c1y = (narrow ? sy - 30 : H * 0.97) + Math.sin(wobble * 1.3 + thread.seed) * 22;
        let c2x = ex - radius * (narrow ? 0.55 : 0.42);
        let c2y = ey + Math.cos(wobble + thread.seed * 1.7) * 36 + (narrow ? 20 : radius * 0.1);

        // Threads lean away from the cursor, like strings under a hand.
        const mx = (c1x + c2x) / 2;
        const my = (c1y + c2y) / 2;
        const dx = mx - mouse.x;
        const dy = my - mouse.y;
        const dist = Math.hypot(dx, dy);
        const force = dist < 220 ? (220 - dist) / 220 : 0;
        thread.pushTo = [(dx / (dist || 1)) * force * 70, (dy / (dist || 1)) * force * 70];
        thread.push[0] = lerp(thread.push[0], thread.pushTo[0], 0.08);
        thread.push[1] = lerp(thread.push[1], thread.pushTo[1], 0.08);
        c1x += thread.push[0];
        c1y += thread.push[1];
        c2x += thread.push[0] * 0.6;
        c2y += thread.push[1] * 0.6;

        const gradient = ctx.createLinearGradient(sx, sy, ex, ey);
        gradient.addColorStop(0, `rgba(${thread.rgb},0)`);
        gradient.addColorStop(narrow ? 0.3 : 0.6, `rgba(${thread.rgb},0)`);
        gradient.addColorStop(0.8, `rgba(${thread.rgb},.3)`);
        gradient.addColorStop(1, `rgba(${thread.rgb},.8)`);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.bezierCurveTo(c1x, c1y, c2x, c2y, ex, ey);
        ctx.stroke();

        // A bead of light travelling into the hoop.
        const t = 0.5 + ((time * 0.00006 + i / threads.length) % 1) * 0.5;
        const bx = bezier(t, sx, c1x, c2x, ex);
        const by = bezier(t, sy, c1y, c2y, ey);
        const glow = Math.sin((t - 0.5) * 2 * Math.PI);
        ctx.fillStyle = `rgba(${thread.rgb},${(0.9 * glow).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(bx, by, 1.8 + glow, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const loop = (time) => {
      draw(time);
      raf = visible ? requestAnimationFrame(loop) : 0;
    };

    measure();
    raf = requestAnimationFrame(loop);
    window.addEventListener("resize", () => measure());
    const hoopWrap = hoop.closest(".hoop-wrap");
    if (hoopWrap) hoopWrap.addEventListener("animationend", measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    hero.addEventListener("pointermove", (event) => {
      const r = hero.getBoundingClientRect();
      mouse.x = event.clientX - r.left;
      mouse.y = event.clientY - r.top;
    });
    hero.addEventListener("pointerleave", () => {
      mouse.x = mouse.y = -9999;
    });
    new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(loop);
    }).observe(hero);
  }

  /* ---------- Method: the loom (scroll-driven) ---------- */
  const loom = $("[data-loom]");
  const loomSvg = $("[data-loom-svg]");
  if (loom && loomSvg) {
    const NS = "http://www.w3.org/2000/svg";
    const make = (tag, attrs, parent = loomSvg) => {
      const node = document.createElementNS(NS, tag);
      Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
      parent.appendChild(node);
      return node;
    };
    // What CreatorZen borrowed (see the receipt below), plus the one thread nobody had.
    const sources = [
      ["Duolingo", "mascot + streaks", "#ff8266"],
      ["vidIQ", "why this idea", "#a78bfa"],
      ["Later", "content pillars", "#ffb25b"],
      ["Typefully", "your own voice", "#67d4f1"],
      ["Predis.ai", "idea → ready post", "#edeae0"],
      ["Captions", "script → camera", "#7aa2ff"],
      ["My thread", "energy-aware", "#d6f26b"],
    ];
    const MINE = sources.length - 1;
    const SX = 206;
    const KX = 452;
    const KY = 280;
    const BX = 596;

    const sourceGroups = [];
    const threadPaths = [];
    const braidPaths = [];

    sources.forEach(([name, take, color], i) => {
      const y = 46 + i * 78;
      const mine = i === MINE;
      const g = make("g", { class: mine ? "lm-src is-mine" : "lm-src" });
      make("text", { x: SX - 22, y: y - 3, "text-anchor": "end", class: "lm-name" }, g).textContent = name;
      make("text", { x: SX - 22, y: y + 14, "text-anchor": "end", class: "lm-take" }, g).textContent = take;
      if (mine) make("circle", { cx: SX, cy: y, r: 15, class: "lm-src-halo", stroke: color }, g);
      make("circle", { cx: SX, cy: y, r: 9, class: "lm-src-dot", stroke: color }, g);
      make("circle", { cx: SX, cy: y, r: 3.5, class: "lm-src-core", fill: color }, g);
      sourceGroups.push(g);

      const d = `M${SX + 9} ${y} C ${SX + 110} ${y}, ${KX - 120} ${KY}, ${KX} ${KY}`;
      const glow = make("path", { d, class: mine ? "lm-glow is-mine" : "lm-glow", stroke: color });
      const path = make("path", { d, class: mine ? "lm-thread is-mine" : "lm-thread", stroke: color });
      threadPaths.push([path, glow]);

      // Braid: every strand swings around the axis with its own phase.
      const pts = [];
      for (let x = KX; x <= BX; x += 3) {
        const u = (x - KX) / (BX - KX);
        const envelope = Math.sin(Math.PI * Math.min(1, u * 1.15)) * 0.85 + 0.15;
        const yy = KY + Math.sin((x - KX) / 46 * Math.PI * 2 + (i * Math.PI * 2) / sources.length) * 15 * envelope;
        pts.push(`${x.toFixed(1)} ${yy.toFixed(1)}`);
      }
      braidPaths.push(make("path", { d: `M${pts.join(" L")}`, class: mine ? "lm-braid is-mine" : "lm-braid", stroke: color }));
    });
    // Keep my strand on top of the braid.
    loomSvg.appendChild(braidPaths[MINE]);

    const knot = make("circle", { cx: KX, cy: KY, r: 5, class: "lm-knot" });

    const card = make("g", { class: "lm-card" });
    make("rect", { x: 600, y: 166, width: 156, height: 228, rx: 18, class: "lm-card-bg" }, card);
    const badge = make("g", { class: "lm-badge" }, card);
    make("rect", { x: 616, y: 184, width: 74, height: 22, rx: 11 }, badge);
    make("text", { x: 653, y: 199, "text-anchor": "middle" }, badge).textContent = "SHIPPED";
    make("text", { x: 616, y: 240, class: "lm-card-title" }, card).textContent = "CreatorZen";
    make("text", { x: 616, y: 260, class: "lm-card-sub" }, card).textContent = "5,000+ downloads";
    make("image", { href: "assets/zenny.webp", x: 630, y: 272, width: 104, height: 104, class: "lm-zenny" }, card);

    const setDash = (path) => {
      const len = path.getTotalLength();
      path.style.strokeDasharray = `${len} ${len}`;
      path.dataset.len = len;
      return len;
    };
    threadPaths.forEach(([p, g]) => {
      setDash(p);
      setDash(g);
    });
    braidPaths.forEach(setDash);

    const steps = $$(".loom-steps li", loom);
    const progressBar = $(".loom-progress", loom);
    const reveal = (g, t) => {
      g.style.opacity = t;
      g.style.transform = `translateX(${(1 - t) * -14}px)`;
    };
    const dash = (path, t) => (path.style.strokeDashoffset = path.dataset.len * (1 - t));
    const draw = (p) => {
      // 01 study: the six products appear. 02 pull: their threads run to the knot.
      sourceGroups.forEach((g, i) => {
        if (i !== MINE) reveal(g, clamp((p - i * 0.024) / 0.07, 0, 1));
      });
      threadPaths.forEach(([path, glow], i) => {
        if (i === MINE) return;
        const t = easeInOut(clamp((p - 0.18 - i * 0.02) / 0.18, 0, 1));
        dash(path, t);
        dash(glow, t);
      });
      const k = clamp((p - 0.36) / 0.05, 0, 1);
      knot.style.opacity = k;
      knot.setAttribute("r", 3 + 3 * k);
      // 03 add the missing thread: mine, drawn on its own beat.
      reveal(sourceGroups[MINE], clamp((p - 0.42) / 0.06, 0, 1));
      const m = easeInOut(clamp((p - 0.46) / 0.12, 0, 1));
      dash(threadPaths[MINE][0], m);
      dash(threadPaths[MINE][1], m);
      loom.classList.toggle("is-mine", p > 0.42);
      // 04 weave and ship.
      const b = easeInOut(clamp((p - 0.6) / 0.18, 0, 1));
      braidPaths.forEach((path) => dash(path, b));
      const c = easeOutExpo(clamp((p - 0.76) / 0.1, 0, 1));
      card.style.opacity = c;
      card.style.transform = `translateX(${(1 - c) * 16}px)`;
      loom.classList.toggle("is-shipped", p > 0.82);
      const active = p < 0.18 ? 0 : p < 0.42 ? 1 : p < 0.6 ? 2 : 3;
      steps.forEach((li, i) => li.classList.toggle("is-active", i === active));
      if (progressBar) progressBar.style.setProperty("--p", p.toFixed(3));
    };

    if (reduceMotion) {
      draw(1);
      steps.forEach((li) => li.classList.add("is-active"));
    } else {
      scrollers.push((vh) => {
        const rect = loom.getBoundingClientRect();
        const distance = rect.height - vh;
        draw(distance > 0 ? clamp(-rect.top / distance, 0, 1) : 1);
      });
    }
  }

  /* ---------- Where I fit: accessible tabs ---------- */
  $$("[data-tabs]").forEach((root) => {
    const tabs = $$('[role="tab"]', root);
    const select = (tab, focus) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
      tab.scrollIntoView({ block: "nearest", inline: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
    };
    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => select(tab, false));
      tab.addEventListener("keydown", (event) => {
        const keys = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: tabs.length - 1 };
        if (!(event.key in keys)) return;
        event.preventDefault();
        select(tabs[(keys[event.key] + tabs.length) % tabs.length], true);
      });
    });
  });

  /* ---------- Manifesto: words light up as you read ---------- */
  const manifesto = $("[data-manifesto]");
  if (manifesto) {
    const walker = document.createTreeWalker(manifesto, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    textNodes.forEach((node) => {
      const isKey = node.parentElement && node.parentElement.tagName === "EM";
      const fragment = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          fragment.appendChild(document.createTextNode(part));
        } else {
          const span = document.createElement("span");
          span.className = isKey ? "w is-key" : "w";
          span.textContent = part;
          fragment.appendChild(span);
        }
      });
      node.replaceWith(fragment);
    });
    const words = $$(".w", manifesto);
    if (reduceMotion) {
      words.forEach((w) => w.classList.add("is-lit"));
    } else {
      scrollers.push((vh) => {
        const rect = manifesto.getBoundingClientRect();
        const start = vh * 0.82;
        const end = vh * 0.38 - rect.height;
        const p = clamp((start - rect.top) / (start - end), 0, 1);
        const lit = Math.round(p * words.length);
        words.forEach((w, i) => w.classList.toggle("is-lit", i < lit));
      });
    }
  }

  /* ---------- Story: the flight path ---------- */
  const flight = $("[data-flight]");
  if (flight) {
    const svg = $(".flight-svg", flight);
    const done = $(".flight-done", flight);
    const plane = $(".flight-plane", flight);
    const stops = $$(".flight-stops li", flight);
    const length = done.getTotalLength();
    done.style.strokeDasharray = `${length} ${length}`;
    const update = (vh) => {
      const svgVisible = svg.getBoundingClientRect().width > 0;
      if (!svgVisible) {
        stops.forEach((li) => li.classList.toggle("is-reached", reduceMotion || li.getBoundingClientRect().top < vh * 0.72));
        return;
      }
      const rect = flight.getBoundingClientRect();
      const p = reduceMotion ? 1 : clamp((vh * 0.88 - rect.top) / (vh * 0.62), 0, 1);
      done.style.strokeDashoffset = length * (1 - p);
      const sx = svg.clientWidth / 1200;
      const sy = svg.clientHeight / 170;
      const at = done.getPointAtLength(length * p);
      const ahead = done.getPointAtLength(Math.min(length, length * p + 2));
      const behind = done.getPointAtLength(Math.max(0, length * p - 2));
      const angle = (Math.atan2((ahead.y - behind.y) * sy, (ahead.x - behind.x) * sx) * 180) / Math.PI;
      plane.style.transform = `translate(${at.x * sx}px, ${at.y * sy}px) rotate(${angle + 90}deg)`;
      const xFraction = at.x / 1200;
      stops.forEach((li, i) => li.classList.toggle("is-reached", xFraction >= i / stops.length + 0.015));
    };
    scrollers.push(update);
  }

  /* ---------- Boarding pass barcode ---------- */
  const barcode = $("[data-barcode]");
  if (barcode) {
    let seed = 7;
    const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    barcode.innerHTML = Array.from({ length: 30 }, () => `<i style="--w:${(1 + random() * 3.2).toFixed(1)}px"></i>`).join("");
  }

  /* ---------- Copy email ---------- */
  const toast = $("[data-toast]");
  let toastTimer = 0;
  const showToast = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
  };
  $$("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const value = button.dataset.copy;
      try {
        await navigator.clipboard.writeText(value);
        showToast("Email copied — talk soon ✓");
      } catch {
        window.location.href = `mailto:${value}`;
      }
    });
  });

  /* ---------- Pointer niceties: spotlight, magnetic buttons, tilt ---------- */
  if (finePointer && !reduceMotion) {
    const spotlight = $(".spotlight");
    if (spotlight) {
      window.addEventListener(
        "pointermove",
        (event) => {
          spotlight.style.setProperty("--sx", `${event.clientX}px`);
          spotlight.style.setProperty("--sy", `${event.clientY}px`);
          spotlight.classList.add("is-on");
        },
        { passive: true }
      );
      document.documentElement.addEventListener("pointerleave", () => spotlight.classList.remove("is-on"));
    }

    $$("[data-magnetic]").forEach((el) => {
      el.addEventListener("pointermove", (event) => {
        const r = el.getBoundingClientRect();
        const x = event.clientX - r.left - r.width / 2;
        const y = event.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${(x * 0.22).toFixed(1)}px, ${(y * 0.34).toFixed(1)}px)`;
      });
      el.addEventListener("pointerleave", () => (el.style.transform = ""));
    });

    $$("[data-tilt]").forEach((el) => {
      const host = el.closest(".case, .pass-wrap") || el;
      host.addEventListener("pointermove", (event) => {
        const r = el.getBoundingClientRect();
        const px = (event.clientX - r.left) / r.width - 0.5;
        const py = (event.clientY - r.top) / r.height - 0.5;
        el.style.transform = `rotateY(${(px * 9).toFixed(2)}deg) rotateX(${(-py * 9).toFixed(2)}deg)`;
        el.style.setProperty("--shine", `${(100 - (px + 0.5) * 100).toFixed(1)}%`);
      });
      host.addEventListener("pointerleave", () => {
        el.style.transform = "";
        el.style.removeProperty("--shine");
      });
    });
  }

  requestScroll();
})();
