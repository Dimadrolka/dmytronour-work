/* /websites — language switch, founding spots, contact links. Vanilla JS, no dependencies. */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const root = document.documentElement;
  const body = document.body;
  const EMAIL = "dmitri.nour@gmail.com";

  const copy = {
    el: {
      title: "Ιστοσελίδες για τοπικές επιχειρήσεις · Dmytro Nour",
      description: "Ιστοσελίδες για μαγαζιά στη Νέα Μάκρη, από 149 €. Τιμή πρώτου πελάτη για τις πέντε πρώτες επιχειρήσεις. Βλέπετε το site σας πριν πληρώσετε.",
      copied: "Το email αντιγράφηκε ✓",
      subjects: {
        general: "Ιστοσελίδα για την επιχείρησή μου",
        basic: "Ιστοσελίδα: πακέτο Βασικό (149 €)",
        booking: "Ιστοσελίδα: πακέτο Με ραντεβού (249 €)",
        stay: "Ιστοσελίδα για κατάλυμα (390–990 €)",
      },
    },
    en: {
      title: "Websites for local businesses · Dmytro Nour",
      description: "Websites for shops in Nea Makri, from 149 €. First-client prices for the first five businesses. You see your site before you pay.",
      copied: "Email copied ✓",
      subjects: {
        general: "A website for my business",
        basic: "Website: Starter package (149 €)",
        booking: "Website: With bookings package (249 €)",
        stay: "Website for rentals & hotels (390–990 €)",
      },
    },
  };

  const store = {
    get: (key) => { try { return localStorage.getItem(key); } catch { return null; } },
    set: (key, value) => { try { localStorage.setItem(key, value); } catch {} },
  };

  /* ---------- Language ---------- */
  const description = $('meta[name="description"]');
  const setLang = (lang) => {
    root.lang = lang;
    document.title = copy[lang].title;
    if (description) description.setAttribute("content", copy[lang].description);
    $$("[data-set-lang]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.setLang === lang)));
    $$("[data-mail]").forEach((link) => {
      link.href = `mailto:${EMAIL}?subject=${encodeURIComponent(copy[lang].subjects[link.dataset.mail])}`;
    });
  };
  $$("[data-set-lang]").forEach((button) =>
    button.addEventListener("click", () => {
      const lang = button.dataset.setLang;
      setLang(lang);
      store.set("ws-lang", lang);
      // Keep the choice in the address so a link sent on Viber opens in the same language.
      const url = new URL(window.location.href);
      if (lang === "en") url.searchParams.set("lang", "en");
      else url.searchParams.delete("lang");
      history.replaceState(null, "", url);
    })
  );
  setLang(root.lang === "en" ? "en" : "el");

  /* ---------- Founding spots: edit data-seats-taken on <body> ---------- */
  const total = Math.max(1, Number(body.dataset.seatsTotal) || 5);
  const taken = Math.min(total, Math.max(0, Number(body.dataset.seatsTaken) || 0));
  $$("[data-seats]").forEach((box) => {
    const dots = $(".ws-seats-dots", box);
    if (dots) dots.innerHTML = Array.from({ length: total }, (_, i) => `<i${i < taken ? ' class="is-taken"' : ""}></i>`).join("");
    $$("[data-seats-free]", box).forEach((el) => (el.textContent = total - taken));
    $$("[data-seats-all]", box).forEach((el) => (el.textContent = total));
  });

  /* ---------- Phone buttons appear once data-phone is filled in ---------- */
  const phone = (body.dataset.phone || "").replace(/\D/g, "");
  if (phone) {
    const hrefs = { tel: `tel:+${phone}`, wa: `https://wa.me/${phone}`, viber: `viber://chat?number=%2B${phone}` };
    $$("[data-phone-link]").forEach((link) => {
      link.href = hrefs[link.dataset.phoneLink];
      link.hidden = false;
    });
  }

  /* ---------- Header glass (never hides on scroll) ---------- */
  const header = $("[data-header]");
  if (header) {
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Reveal on scroll ---------- */
  const revealTargets = $$("[data-reveal]");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );
    revealTargets.forEach((el) => observer.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- Copy email, year ---------- */
  const toast = $("[data-toast]");
  let toastTimer = 0;
  $$("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.copy);
        if (!toast) return;
        toast.textContent = copy[root.lang === "en" ? "en" : "el"].copied;
        toast.classList.add("is-visible");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
      } catch {
        window.location.href = `mailto:${button.dataset.copy}`;
      }
    });
  });
  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
})();
