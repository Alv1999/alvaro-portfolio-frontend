/* ================================================
   main.js — Portfolio Alvaro
   - Detecta entorno y fija API_BASE
   - Animaciones/AOS, preloader, barra de progreso
   - Envío del formulario a /api/contact
   - Efecto tilt y ripple
================================================ */

// ---------- Entorno (DEV vs PROD) ----------
const isLiveServer =
  location.host.startsWith("127.0.0.1:5500") ||
  location.host.startsWith("localhost:5500");

const isProd =
  location.hostname.endsWith("github.io") ||
  location.hostname.endsWith("tudominio.com"); // si después usás tu dominio

// En local (Live Server) forzamos 127.0.0.1:4000 para evitar problemas entre 127.0.0.1 y localhost
const API_BASE = isLiveServer
  ? "http://127.0.0.1:4000"
  : isProd
  ? "https://alvaro-portfolio-backend.onrender.com" // ✅ backend real en Render
  : "http://127.0.0.1:4000";

console.log("main.js cargado ✅  |  API_BASE:", API_BASE);

/* ================================================
   AOS (si está cargado por CDN)
================================================ */
if (window.AOS && typeof AOS.init === "function") {
  AOS.init({ once: true, duration: 700 });
}

/* ================================================
   Preloader
================================================ */
window.addEventListener("load", () => {
  const pre = document.getElementById("pre");
  if (pre) {
    pre.classList.add("fade-out");
    setTimeout(() => pre.remove(), 500);
  }
});

/* ================================================
   Barra de progreso + navbar scrolled
================================================ */
const bar = document.getElementById("bar");
const nav = document.getElementById("nav");
window.addEventListener("scroll", () => {
  const h = document.documentElement;
  const sc = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
  if (bar) bar.style.width = sc + "%";
  if (nav) nav.classList.toggle("scrolled", window.scrollY > 10);
});

/* ================================================
   Rotador de palabras
================================================ */
(() => {
  const words = [
    "Developer",
    "Frontend",
    "Freelancer",
    "Full-Stack",
    "Frontend",
    "Backend",
  ];
  const el = document.querySelector("#rotator .word");
  if (!el) return;
  let i = 0;
  const swap = () => {
    i = (i + 1) % words.length;
    el.animate(
      [
        { opacity: 1, transform: "translateY(0)" },
        { opacity: 0, transform: "translateY(-6px)" },
      ],
      { duration: 180, fill: "forwards" }
    ).finished.then(() => {
      el.textContent = words[i];
      el.animate(
        [
          { opacity: 0, transform: "translateY(6px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 220, fill: "forwards" }
      );
    });
  };
  setInterval(swap, 1800);
})();

/* ================================================
   Ripple en botones
================================================ */
document.querySelectorAll(".btn-ripple").forEach((btn) => {
  btn.addEventListener("pointerdown", (e) => {
    const r = btn.getBoundingClientRect();
    btn.style.setProperty("--x", e.clientX - r.left + "px");
    btn.style.setProperty("--y", e.clientY - r.top + "px");
  });
});

/* ================================================
   Habilidades: llenar barras
================================================ */
const bars = document.querySelectorAll(".progress-bar[data-target]");
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = parseInt(el.dataset.target, 10);
      let n = 0;
      el.classList.add("is-animating");
      const step = () => {
        n += 2;
        if (n > target) n = target;
        el.style.width = n + "%";
        el.textContent = n + "%";
        if (n < target) requestAnimationFrame(step);
        else el.classList.remove("is-animating");
      };
      requestAnimationFrame(step);
      io.unobserve(el);
    });
  },
  { threshold: 0.35 }
);
bars.forEach((b) => io.observe(b));

/* ================================================
   Formulario: validación y envío a /api/contact
================================================ */
(() => {
  const form =
    document.querySelector("#contact-form") ||
    document.getElementById("contactForm");
  if (!form) {
    console.warn("No se encontró el formulario (#contact-form / #contactForm)");
    return;
  }

  console.log("Enlazando submit del formulario de contacto ✅");

  const getVal = (sel, fallbackSel) => {
    const a = document.querySelector(sel);
    if (a && typeof a.value === "string") return a.value.trim();
    const b = fallbackSel ? document.querySelector(fallbackSel) : null;
    return b && typeof b.value === "string" ? b.value.trim() : "";
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!form.checkValidity()) {
      e.stopPropagation();
      form.classList.add("was-validated");
      return;
    }

    const nombre = getVal("#nombre", 'input[name="nombre"]');
    const email = getVal("#email", 'input[name="email"]');
    const telefono = getVal("#telefono", 'input[name="telefono"]');
    const mensaje = getVal("#mensaje", 'textarea[name="mensaje"]');
    const asunto = getVal('input[name="asunto"]'); // opcional

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.dataset.originalText = submitBtn.innerHTML;
      submitBtn.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin me-2"></i> Enviando…';
    }

    try {
      const resp = await fetch(`${API_BASE}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, telefono, mensaje, asunto }),
      });

      // Intenta parsear JSON aunque haya error HTTP (para ver mensaje del backend)
      let data = {};
      try {
        data = await resp.json();
      } catch (_) {}

      console.log("Respuesta API:", resp.status, data);

      if (resp.ok && data.ok) {
        alert("✅ ¡Gracias! Me pongo en contacto pronto.");
        form.reset();
        form.classList.remove("was-validated");
      } else {
        alert("❌ No se pudo enviar el mensaje. Revisá la consola.");
      }
    } catch (err) {
      console.error("Error llamando a la API:", err);
      alert("⚠️ Error de conexión con el servidor.");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML =
          submitBtn.dataset.originalText || "Enviar mensaje";
      }
      form.classList.add("was-validated");
    }
  });
})();

/* ================================================
   Efecto tilt 3D
================================================ */
document.querySelectorAll(".tilt").forEach((card) => {
  card.addEventListener("mousemove", (e) => {
    const r = card.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width - 0.5) * 10;
    const y = ((e.clientY - r.top) / r.height - 0.5) * -10;
    card.style.transform = `perspective(800px) rotateX(${y}deg) rotateY(${x}deg)`;
  });
  card.addEventListener("mouseleave", () => (card.style.transform = "none"));
});
