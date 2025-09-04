/* ================================================
   main.js — Portfolio Alvaro (Revisado y robusto)
   - Entorno/API_BASE inteligente
   - AOS con prefers-reduced-motion
   - Preloader
   - Barra de progreso + navbar .scrolled (rAF throttle)
   - Rotador opcional (#rotator .word)
   - Ripple en botones (pointer + touch)
   - Habilidades con IntersectionObserver (fallback)
   - Formulario: validación, honeypot y POST a /api/contact
   - Efecto tilt con rAF y reduce-motion
   - Auto-cerrar menú móvil y ScrollSpy Bootstrap
================================================ */

/* ------------------------ Entorno (DEV vs PROD) ------------------------- */
// Soporta cualquier puerto de Live Server
const isLiveServer =
  location.hostname === "127.0.0.1" || location.hostname === "localhost";

const isProd =
  location.hostname.endsWith("github.io") ||
  location.hostname.endsWith("tudominio.com"); // cambiá cuando tengas dominio

// En prod, USA TU BACKEND REAL EN RENDER
const API_BASE = isLiveServer
  ? "http://127.0.0.1:4000"
  : isProd
  ? "https://alvaro-portfolio-backend.onrender.com" // <— fijo y correcto
  : "http://127.0.0.1:4000";

console.log("main.js ✅ | API_BASE:", API_BASE);

/* ---------------------------- Utilidades base --------------------------- */
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
const clamp = (n, min, max) => Math.min(Math.max(n, min), max);
const prefersReduce =
  window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

/* ================================ AOS =================================== */
if (window.AOS && typeof AOS.init === "function") {
  AOS.init({
    once: true,
    duration: 700,
    easing: "ease-out",
    offset: 60,
    disable: () => prefersReduce, // respeta reduce-motion
  });
}

/* ============================== Preloader =============================== */
window.addEventListener("load", () => {
  const pre = document.getElementById("pre");
  if (!pre) return;

  // ⏱ Mantener splash visible al menos 10 segundos (bajá este valor si molesta en dev)
  const MIN_TIME = 10000;

  setTimeout(() => {
    pre.classList.add("fade-out");
    setTimeout(() => pre.remove(), 700); // animación extra de fade
  }, MIN_TIME);
});

/* =================== Barra de progreso + navbar scrolled ================= */
const bar = $("#bar");
const nav = $("#nav");

const updateProgressAndNav = () => {
  const h = document.documentElement;
  const sc = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
  if (bar) bar.style.width = sc + "%";
  if (nav) nav.classList.toggle("scrolled", window.scrollY > 10);
};

// Throttle con rAF
let ticking = false;
const onScroll = () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      updateProgressAndNav();
      ticking = false;
    });
    ticking = true;
  }
};
window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener(
  "resize",
  () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateProgressAndNav();
        ticking = false;
      });
      ticking = true;
    }
  },
  { passive: true }
);

/* =========================== Rotador de palabras =========================
   (Seguro: sólo corre si existe #rotator .word; tu HTML actual puede no usarlo)
--------------------------------------------------------------------------- */
(() => {
  const el = document.querySelector("#rotator .word");
  if (!el) return;
  const words = [
    "Developer",
    "Frontend",
    "Freelancer",
    "Full-Stack",
    "Frontend",
    "Backend",
  ];
  let i = 0;
  const swap = () => {
    el.animate(
      [
        { opacity: 1, transform: "translateY(0)" },
        { opacity: 0, transform: "translateY(-6px)" },
      ],
      { duration: 180, fill: "forwards" }
    ).finished.then(() => {
      i = (i + 1) % words.length;
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
  const id = setInterval(swap, 1800);
  // Limpieza si cambian de página con PJAX/etc
  window.addEventListener("beforeunload", () => clearInterval(id));
})();

/* =============================== Ripple ================================= */
$$(".btn-ripple").forEach((btn) => {
  const setRipple = (e) => {
    const r = btn.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    btn.style.setProperty("--x", clientX - r.left + "px");
    btn.style.setProperty("--y", clientY - r.top + "px");
  };
  btn.addEventListener("pointerdown", setRipple, { passive: true });
  // Fallbacks por si el UA no mapea pointer events
  btn.addEventListener("mousedown", setRipple);
  btn.addEventListener("touchstart", setRipple, { passive: true });
});

/* ========================== Habilidades (bars) ========================== */
(() => {
  const bars = $$(".progress-bar[data-target]");
  if (!bars.length) return;

  const animateBar = (el) => {
    const target = clamp(parseInt(el.dataset.target, 10) || 0, 0, 100);
    let n = 0;
    el.classList.add("is-animating");
    const step = () => {
      n = Math.min(n + 2, target);
      el.style.width = n + "%";
      el.textContent = n + "%";
      if (n < target) requestAnimationFrame(step);
      else setTimeout(() => el.classList.remove("is-animating"), 300);
    };
    requestAnimationFrame(step);
  };

  if (!("IntersectionObserver" in window) || prefersReduce) {
    // Fallback o reduce-motion: fijar a target sin animación progresiva
    bars.forEach((el) => {
      const target = clamp(parseInt(el.dataset.target, 10) || 0, 0, 100);
      el.style.width = target + "%";
      el.textContent = target + "%";
    });
    return;
  }

  const io = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          animateBar(e.target);
          obs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.35 }
  );

  bars.forEach((b) => io.observe(b));
})();

/* ====================== Formulario: validación + POST ==================== */
(() => {
  const form = $("#contact-form") || $("#contactForm");
  if (!form) {
    console.warn("No se encontró el formulario (#contact-form / #contactForm)");
    return;
  }
  console.log("Form contacto ✅ enlazado");

  const getVal = (sel, fallbackSel) => {
    const a = $(sel);
    if (a && typeof a.value === "string") return a.value.trim();
    const b = fallbackSel ? $(fallbackSel) : null;
    return b && typeof b.value === "string" ? b.value.trim() : "";
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Honeypot anti-spam
    const hp = $("#website");
    if (hp && hp.value) {
      console.warn("Honeypot activado. Abortando envío.");
      return;
    }

    if (!form.checkValidity()) {
      e.stopPropagation();
      form.classList.add("was-validated");
      return;
    }

    const nombre = getVal("#nombre", 'input[name="nombre"]');
    const email = getVal("#email", 'input[name="email"]');
    const telefono = getVal("#telefono", 'input[name="telefono"]');
    const mensaje = getVal("#mensaje", 'textarea[name="mensaje"]');
    const asunto = getVal("#asunto", 'input[name="asunto"]'); // opcional

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.dataset.originalText = submitBtn.innerHTML;
      submitBtn.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin me-2"></i> Enviando…';
    }

    try {
      // 👇 AQUÍ FALTABAN BACKTICKS (corregido)
      const resp = await fetch(`${API_BASE}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, telefono, mensaje, asunto }),
      });

      let data = {};
      try {
        data = await resp.json();
      } catch {}

      console.log("Respuesta API:", resp.status, data);

      if (resp.ok && (data.ok === true || data.status === "ok")) {
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

/* ============================ Efecto tilt 3D ============================= */
(() => {
  const cards = $$(".tilt");
  if (!cards.length) return;

  const applyTilt = (card, e) => {
    const r = card.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width - 0.5) * 10;
    const y = ((e.clientY - r.top) / r.height - 0.5) * -10;
    // 👇 AQUÍ FALTABAN BACKTICKS (corregido)
    card.style.transform = `perspective(800px) rotateX(${y}deg) rotateY(${x}deg)`;
  };

  cards.forEach((card) => {
    if (prefersReduce) return; // respeta reduce-motion
    let raf = null;
    const onMove = (e) => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => applyTilt(card, e));
    };
    card.addEventListener("mousemove", onMove);
    card.addEventListener("mouseleave", () => {
      card.style.transform = "none";
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    });
  });
})();

/* ================== Auto-cerrar menú móvil + ScrollSpy =================== */
(() => {
  const menu = $("#menu");
  if (!menu) return;

  // Auto-cerrar al clickear cualquier link del menú
  $$(".nav-link", menu).forEach((link) => {
    link.addEventListener("click", () => {
      const Collapse = window.bootstrap?.Collapse;
      if (Collapse && menu.classList.contains("show")) {
        const inst = Collapse.getOrCreateInstance(menu, { toggle: false });
        inst.hide();
      }
    });
  });

  // ScrollSpy (si Bootstrap está disponible)
  try {
    const ScrollSpy = window.bootstrap?.ScrollSpy;
    if (ScrollSpy) {
      ScrollSpy.getOrCreateInstance(document.body, {
        target: "#menu",
        offset: 80,
      });
    }
  } catch (e) {
    console.warn("ScrollSpy no disponible:", e);
  }
})();

/* ============================== Init inmediato =========================== */
(() => {
  // Inicializa estado visual al cargar
  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    requestAnimationFrame(updateProgressAndNav);
  } else {
    document.addEventListener("DOMContentLoaded", () =>
      requestAnimationFrame(updateProgressAndNav)
    );
  }
})();
