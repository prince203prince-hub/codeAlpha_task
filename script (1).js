(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Theme (persisted, respects OS preference) ---------- */
  const root = document.documentElement;
  const themeBtn = $("#themeToggle");
  const saved = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const setTheme = (t) => {
    root.dataset.theme = t;
    themeBtn.textContent = t === "dark" ? "☀️" : "🌙";
    localStorage.setItem("theme", t);
  };
  setTheme(saved || (prefersDark ? "dark" : "light"));
  themeBtn.addEventListener("click", () =>
    setTheme(root.dataset.theme === "dark" ? "light" : "dark")
  );

  /* ---------- Mobile menu ---------- */
  const burger = $("#burger");
  const links = $("#navLinks");
  const toggleMenu = (open) => {
    links.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", open);
    burger.textContent = open ? "✕" : "☰";
  };
  burger.addEventListener("click", () => toggleMenu(!links.classList.contains("open")));
  $$("a", links).forEach((a) => a.addEventListener("click", () => toggleMenu(false)));

  /* ---------- Scroll: nav style, progress bar, back-to-top ---------- */
  const nav = $("#nav");
  const progress = $("#progress");
  const toTop = $("#toTop");
  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    nav.classList.toggle("scrolled", y > 20);
    progress.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
    toTop.classList.toggle("show", y > 600);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  /* ---------- Active nav link on scroll ---------- */
  const sections = $$("main section[id]");
  const navMap = Object.fromEntries($$("a", links).map((a) => [a.getAttribute("href").slice(1), a]));
  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          Object.values(navMap).forEach((a) => a.classList.remove("active"));
          navMap[e.target.id]?.classList.add("active");
        }
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sections.forEach((s) => spy.observe(s));

  /* ---------- Reveal on scroll (with stagger) + skill bars + counters ---------- */
  $$(".skills-grid .reveal, .projects-grid .reveal, .chips span").forEach((el, i) =>
    el.style.setProperty("--d", (i % 6) * 0.08 + "s")
  );

  const animateCount = (el) => {
    const target = +el.dataset.count;
    if (reduceMotion) { el.textContent = target; return; }
    const start = performance.now(), dur = 1200;
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        el.classList.add("in");
        $$(".bar i", el).forEach((b) => (b.style.width = b.dataset.level + "%"));
        $$("[data-count]", el).forEach(animateCount);
        io.unobserve(el);
      });
    },
    { threshold: 0.15 }
  );
  $$(".reveal").forEach((el) => io.observe(el));

  /* ---------- Typing effect ---------- */
  const typed = $("#typed");
  const roles = ["Web Developer", "Java Programmer", "Problem Solver", "Lifelong Learner"];
  if (reduceMotion) {
    typed.textContent = roles[0];
  } else {
    let r = 0, c = 0, del = false;
    const type = () => {
      const word = roles[r];
      typed.textContent = word.slice(0, c);
      if (!del && c === word.length) { del = true; return setTimeout(type, 1400); }
      if (del && c === 0) { del = false; r = (r + 1) % roles.length; }
      c += del ? -1 : 1;
      setTimeout(type, del ? 40 : 85);
    };
    type();
  }

  /* ---------- Project filter ---------- */
  const filters = $("#filters");
  filters.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    $$("button", filters).forEach((b) => b.classList.toggle("active", b === btn));
    const f = btn.dataset.filter;
    $$("#projects-grid .card").forEach((card) => {
      const show = f === "all" || card.dataset.cat === f;
      card.classList.toggle("hide", !show);
    });
  });

  /* ---------- Contact form ----------
     Works out of the box via mailto. To receive messages without opening an
     email app, replace FORM_ENDPOINT with a Formspree / Netlify Forms URL. */
  const FORM_ENDPOINT = ""; // e.g. "https://formspree.io/f/xxxxxxx"
  const TO_EMAIL = "muskansingh23039@gmail.com";
  const form = $("#contactForm");
  const note = $("#formNote");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    let ok = true;
    $$("input, textarea", form).forEach((f) => {
      const bad = !f.value.trim() || (f.type === "email" && !/^\S+@\S+\.\S+$/.test(f.value));
      f.classList.toggle("invalid", bad);
      if (bad) ok = false;
    });
    note.className = "form-note";
    if (!ok) { note.textContent = "Please fill in all fields correctly."; note.classList.add("err"); return; }

    if (FORM_ENDPOINT) {
      try {
        const res = await fetch(FORM_ENDPOINT, {
          method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error();
        note.textContent = "Thanks! Your message has been sent."; note.classList.add("ok");
        form.reset();
      } catch {
        note.textContent = "Something went wrong. Please email me directly."; note.classList.add("err");
      }
    } else {
      const body = encodeURIComponent(`${data.message}\n\n— ${data.name} (${data.email})`);
      window.location.href = `mailto:${TO_EMAIL}?subject=${encodeURIComponent("Portfolio enquiry from " + data.name)}&body=${body}`;
      note.textContent = "Opening your email app…"; note.classList.add("ok");
    }
  });

  /* ---------- Footer year ---------- */
  $("#year").textContent = new Date().getFullYear();
})();
