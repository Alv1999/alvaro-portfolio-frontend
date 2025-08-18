// js/main.js
// - Envía #contact-form a tu backend (dev: localhost:4000 / prod: Render)
// - Validación mínima + honeypot + timeout
// - Mensajes de estado para el usuario

console.log("main.js cargado ✅");

// ====== Config ======
const IS_DEV = ["localhost", "127.0.0.1"].includes(location.hostname);

// ⬇️ Cambiá SOLO si tu URL de Render es distinta
const API_BASE = IS_DEV
  ? "http://localhost:4000"
  : "https://alvaro-portfolio-backend.onrender.com"; // tu backend en Render

// Timeout de red (ms)
const REQUEST_TIMEOUT = 15000;

// ====== Utils ======
const isEmail = (s = "") => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s).trim());

function alertOK(msg = "¡Listo!") {
  alert(`✅ ${msg}`);
}
function alertError(msg = "Ocurrió un error") {
  alert(`⚠️ ${msg}`);
}

// ====== App ======
document.addEventListener("DOMContentLoaded", () => {
  if (window.AOS) AOS.init();

  const form = document.getElementById("contact-form");
  if (!form) {
    console.warn("No encontré #contact-form en el DOM");
    return;
  }

  // Honeypot: asegurate de tener <input type="text" id="website" name="website" style="display:none" tabindex="-1" autocomplete="off" />
  const honeypot = document.getElementById("website");

  const btn = form.querySelector('button[type="submit"]');
  const originalBtnText = btn ? btn.textContent : "";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = document.getElementById("nombre")?.value.trim() || "";
    const email = document.getElementById("email")?.value.trim() || "";
    const telefono = document.getElementById("telefono")?.value.trim() || "";
    const asunto = document.getElementById("asunto")?.value.trim() || "";
    const mensaje = document.getElementById("mensaje")?.value.trim() || "";
    const trap = honeypot?.value?.trim() || "";

    // Anti-bots
    if (trap) {
      console.warn("Honeypot activado, cancelando envío.");
      return;
    }

    // Validación mínima
    if (!nombre || !email || !mensaje) {
      return alertError("Completá nombre, e-mail y mensaje 🙏");
    }
    if (!isEmail(email)) {
      return alertError("Poné un e-mail válido 🙏");
    }

    // Estado UI
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Enviando…";
    }

    // Timeout
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT);

    try {
      const res = await fetch(`${API_BASE}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, telefono, asunto, mensaje }),
        signal: ctrl.signal,
      });

      let data = {};
      try {
        data = await res.json();
      } catch (_) {
        // si no hay JSON
      }

      console.log("Respuesta API:", res.status, data);

      if (res.ok && data?.ok) {
        alertOK("¡Gracias! Me pongo en contacto pronto.");
        form.reset();
      } else {
        const msg =
          data?.error ||
          `No se pudo enviar el mensaje (HTTP ${res.status}). Probá de nuevo.`;
        alertError(msg);
      }
    } catch (err) {
      console.error("Error de conexión:", err);
      if (err.name === "AbortError") {
        alertError(
          "El servidor tardó demasiado en responder. Intentá de nuevo."
        );
      } else {
        alertError("No me pude conectar con el servidor.");
      }
    } finally {
      clearTimeout(to);
      if (btn) {
        btn.disabled = false;
        btn.textContent = originalBtnText || "Enviar mensaje";
      }
    }
  });
});
