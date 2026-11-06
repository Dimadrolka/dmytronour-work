/* /services and the service pages: header glass, outreach attribution, brief form. */
(() => {
  // Navigation works without JS; close the mobile menu after choosing a destination.
  document.querySelectorAll('.sv-menu').forEach((menu) => {
    menu.addEventListener('click', (event) => {
      if (event.target.closest('a')) menu.open = false;
    });
    menu.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        menu.open = false;
        menu.querySelector('summary').focus();
      }
    });
  });

  // A link from a service page keeps the payment choices on that same service.
  const paymentList = document.querySelector('[data-payment-list]');
  const paymentService = new URLSearchParams(location.search).get('service');
  const paymentNames = { websites: 'website', automations: 'automation', apps: 'app or tool', videos: 'video' };
  if (paymentList && Object.hasOwn(paymentNames, paymentService)) {
    const website = paymentService === 'websites';
    paymentList.querySelectorAll('[data-payment-service]').forEach((row) => {
      row.hidden = row.dataset.paymentService !== (website ? 'websites' : 'custom');
    });
    const title = document.querySelector('[data-payment-title]');
    title.textContent = 'Pay for your ';
    const subject = document.createElement('em');
    subject.textContent = `${paymentNames[paymentService]}.`;
    title.append(subject);
    document.querySelector('[data-payment-prompt]').textContent = 'Want to review the offer?';
    if (!website) {
      paymentList.querySelector('[data-payment-service="custom"] b').textContent = `Your ${paymentNames[paymentService]}`;
      paymentList.querySelector('[data-payment-service="custom"] small').textContent = 'Enter the deposit or amount from your agreed proposal.';
    }
    const back = document.querySelector('[data-payment-back]');
    back.href = `/${paymentService}#${website ? 'prices' : 'pricing'}`;
    back.textContent = `Back to ${website ? 'website packages' : paymentNames[paymentService] + ' pricing'}`;
  }

  const header = document.querySelector("[data-header]");
  if (header) {
    // Glass only; the header never hides on scroll.
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // Loops load and play only while on screen, and not at all with reduced motion.
  const loops = document.querySelectorAll("video[data-loop]");
  if (loops.length && "IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) target.play().catch(() => {});
        else target.pause();
      });
    }, { threshold: 0.25 });
    loops.forEach((v) => io.observe(v));
  }

  // Remember where the visitor came from, so a lead shows which outreach link brought it.
  const KEY = "dn-source";
  const readSource = () => {
    try { return JSON.parse(sessionStorage.getItem(KEY)) || null; } catch (e) { return null; }
  };
  // The first page of the visit counts, unless a newer outreach link was opened since.
  const params = new URLSearchParams(location.search);
  const TAGS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "ref"];
  const tagged = TAGS.some((k) => params.get(k));
  let source = readSource();
  if (!source || tagged) {
    source = { landing: location.pathname };
    if (document.referrer) source.referrer = document.referrer;
    TAGS.forEach((k) => { if (params.get(k)) source[k] = params.get(k); });
    try { sessionStorage.setItem(KEY, JSON.stringify(source)); } catch (e) {}
  }

  // A visitor from my email (?ref=, ?for= or utm_medium=email) sees one line that connects the page to that email.
  // ?for=Company names them; the text is set as text, never as HTML.
  const hello = document.querySelector("[data-hello]");
  const fromEmail = params.get("ref") || params.get("for") || params.get("utm_medium") === "email";
  if (hello && fromEmail) {
    const who = (params.get("for") || "").replace(/[^\p{L}\p{N} &.,'’-]/gu, "").trim().slice(0, 60);
    const slot = hello.querySelector("[data-hello-who]");
    if (who && slot) slot.textContent = ` for ${who}`;
    hello.hidden = false;
  }

  // Hours calculator on /automations: the visitor's numbers, half of it automated.
  const calc = document.querySelector("[data-calc]");
  if (calc) {
    const num = (name) => Math.max(0, Number(calc.elements[name].value) || 0);
    const euro = (n) => `€${Math.round(n).toLocaleString("en-GB")}`;
    const total = calc.querySelector("[data-calc-total]");
    const back = calc.querySelector("[data-calc-back]");
    const update = () => {
      const year = num("hours") * num("people") * num("rate") * 46;
      total.textContent = `${euro(year)} a year`;
      back.textContent = euro(year / 2);
    };
    calc.addEventListener("input", update);
    calc.addEventListener("submit", (event) => event.preventDefault());
    update();
  }

  const form = document.querySelector("[data-brief]");
  if (!form) return;

  // "Choose this package" links start the brief with the package already named.
  document.querySelectorAll("[data-pick]").forEach((link) => {
    link.addEventListener("click", () => {
      const box = form.elements.message;
      const line = `Package: ${link.dataset.pick}.`;
      if (!box.value.trim()) box.value = `${line}\n`;
      else if (!box.value.startsWith("Package:")) box.value = `${line}\n${box.value}`;
      else box.value = box.value.replace(/^Package:[^\n]*/, line);
    });
  });
  const status = form.querySelector("[data-brief-status]");
  const button = form.querySelector("button[type=submit]");
  const label = button.querySelector("[data-label]");
  const idle = label.textContent;

  const showError = (message, withMail) => {
    status.hidden = false;
    status.className = "sv-status is-error";
    status.textContent = message;
    if (withMail) {
      const d = new FormData(form);
      const body = `${d.get("company")}\n\n${d.get("message")}`;
      const a = document.createElement("a");
      a.href = `mailto:hello@dmytronour.work?subject=${encodeURIComponent("Project brief")}&body=${encodeURIComponent(body)}`;
      a.textContent = "hello@dmytronour.work";
      status.append(" ", a);
    }
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    status.hidden = true;
    form.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
    button.disabled = true;
    label.textContent = "Sending…";
    const d = new FormData(form);
    let focusAfter = button;
    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(20000),
        body: JSON.stringify({
          company: d.get("company"),
          email: d.get("email"),
          message: d.get("message"),
          service: d.get("service"),
          fax: d.get("fax"),
          source,
        }),
      });
      if (response.ok) {
        const done = document.createElement("div");
        done.className = "sv-done";
        done.setAttribute("role", "status");
        done.tabIndex = -1;
        done.innerHTML = "<h3>Got it. Thank you.</h3><p>I'll read it myself and reply to the email you gave within one working day, with a practical first step and, where I can, a price.</p>";
        form.replaceWith(done);
        done.focus({ preventScroll: true });
        return;
      }
      if (response.status === 400) {
        const { fields = [] } = await response.json().catch(() => ({}));
        const names = { company: "your website or company", email: "a valid email", message: "what you'd like to improve" };
        const list = fields.map((f) => names[f] || f).join(", ");
        showError(list ? `Please check ${list}.` : "Please check the fields above.", false);
        fields.forEach((f) => form.elements[f] && form.elements[f].setAttribute("aria-invalid", "true"));
        focusAfter = form.elements[fields[0]] || button;
      } else {
        showError("That didn't send on my side. Your text is still here. Please try again, or email me at", true);
      }
    } catch (e) {
      showError("That didn't send: the connection dropped. Your text is still here. Please try again, or email me at", true);
    }
    button.disabled = false;
    label.textContent = idle;
    focusAfter.focus();
  });
})();
