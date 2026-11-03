(function () {
  "use strict";

  var WA_NUMBER = "56993145696";
  var prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  // Título de la pestaña por vista (también queda en el historial del navegador)
  var VIEWS = {
    home: "Valpo a Vela | Clases de vela y paseos a vela en Valparaíso",
    hansa: "Navegación en velero Hansa 303 | Valpo a Vela",
    yate: "Paseos en yate en Valparaíso | Valpo a Vela",
    pesca: "Salidas de pesca en Valparaíso | Valpo a Vela",
    raquero: "Clase práctica de vela en raquero | Valpo a Vela",
    embarcaciones: "Nuestras embarcaciones | Valpo a Vela",
    preguntas: "Preguntas frecuentes | Valpo a Vela",
  };
  // Anclas que viven dentro de vistas, en lugar de ser vistas por sí mismas.
  var SECTION_VIEWS = {
    filosofia: "home",
    actividades: "home",
    clima: "home",
    contacto: "home",
    "embarcacion-hansa": "embarcaciones",
    "embarcacion-yate": "embarcaciones",
    "embarcacion-pesca": "embarcaciones",
    "embarcacion-raquero": "embarcaciones",
    "embarcacion-apoyo": "embarcaciones",
  };

  var currentView = null;

  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---------------------------------------------------------------- vistas
  function showView(view) {
    var changed = view !== currentView;
    document.querySelectorAll(".page-view").forEach(function (el) {
      el.classList.toggle("active", el.id === "view-" + view);
    });
    document.title = VIEWS[view] || VIEWS.home;
    document.body.setAttribute("data-view", view);
    closeMobileMenu();

    if (changed && currentView !== null) {
      // Lleva el foco al contenido nuevo para quien navega con teclado o lector de pantalla
      var target = document.getElementById("view-" + view);
      if (target) {
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      }
    }
    currentView = view;
  }

  function route() {
    var id = "";
    try {
      id = decodeURIComponent(location.hash.replace(/^#/, ""));
    } catch (e) {
      id = "";
    }

    var view = "home";
    var section = null;
    if (id !== "home" && VIEWS[id]) {
      view = id;
    } else if (SECTION_VIEWS[id]) {
      view = SECTION_VIEWS[id];
      section = id;
    }

    showView(view);

    if (section) {
      // Espera a que la vista esté visible antes de desplazarse
      requestAnimationFrame(function () {
        var el = document.getElementById(section);
        if (el) {
          el.scrollIntoView({
            behavior: prefersReducedMotion ? "auto" : "smooth",
          });
        }
      });
    } else {
      window.scrollTo(0, 0);
    }
  }

  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  var hasInternalHashHistory = false;
  window.addEventListener("hashchange", function () {
    hasInternalHashHistory = true;
    route();
  });
  route();

  document.querySelectorAll(".activity-back").forEach(function (link) {
    link.addEventListener("click", function (event) {
      if (!hasInternalHashHistory) return;
      event.preventDefault();
      history.back();
    });
  });

  // ------------------------------------------------------------ menú móvil
  var menuBtn = document.getElementById("menuBtn");
  var mobileNav = document.getElementById("mobileNav");
  function setMenu(open) {
    if (!mobileNav || !menuBtn) return;
    mobileNav.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    menuBtn.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    menuBtn.textContent = open ? "✕" : "☰";
  }
  function closeMobileMenu() {
    setMenu(false);
  }
  if (menuBtn && mobileNav) {
    menuBtn.addEventListener("click", function () {
      setMenu(!mobileNav.classList.contains("open"));
    });
    mobileNav.querySelectorAll(".mobile-activities-toggle").forEach(function (toggle) {
      var submenu = document.getElementById(
        toggle.getAttribute("aria-controls")
      );
      if (!submenu) return;
      toggle.addEventListener("click", function () {
        var expanded = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", expanded ? "false" : "true");
        submenu.hidden = expanded;
      });
    });
    mobileNav.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeMobileMenu();
    });
    document.addEventListener("click", function (e) {
      if (!mobileNav.contains(e.target) && !menuBtn.contains(e.target)) {
        closeMobileMenu();
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMobileMenu();
    });
  }

  // ------------------------------- botones "Reservar" que preseleccionan actividad
  document.addEventListener("click", function (e) {
    var trigger = e.target.closest("[data-actividad]");
    if (!trigger) return;
    var select = document.getElementById("contact-activity-page");
    if (select) select.value = trigger.getAttribute("data-actividad");
  });

  // -------------------------------------------------------------- formulario
  var form = document.getElementById("contact-form-page");
  if (form) {
    var dateInput = form.elements.namedItem("date");
    if (dateInput) {
      var now = new Date();
      var pad = function (n) {
        return String(n).padStart(2, "0");
      };
      dateInput.min =
        now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate());
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!form.reportValidity()) return;

      var val = function (name) {
        return form.elements.namedItem(name).value.trim();
      };
      var select = form.elements.namedItem("activity");
      var activity = select.value
        ? select.options[select.selectedIndex].text
        : "";
      var date = val("date");
      var dateText = "";
      if (date) {
        dateText = new Date(date + "T12:00:00").toLocaleDateString("es-CL", {
          weekday: "long",
          day: "numeric",
          month: "long",
        });
      }

      var lines = ["Hola, soy " + val("name") + "."];
      if (activity) lines.push("Me interesa: " + activity + ".");
      lines.push("Participantes: " + val("people") + ".");
      if (dateText) lines.push("Fecha preferida: " + dateText + ".");
      if (val("message")) lines.push("", val("message"));

      var whatsappUrl =
        "https://wa.me/" +
        WA_NUMBER +
        "?text=" +
        encodeURIComponent(lines.join("\n"));
      var whatsappWindow = window.open(whatsappUrl, "_blank");
      var status = document.getElementById("contact-status-page");
      if (status) {
        status.replaceChildren();
        if (whatsappWindow) {
          whatsappWindow.opener = null;
          status.textContent =
            "Se abrió WhatsApp. Revisa el mensaje y presiona enviar.";
          form.reset();
        } else {
          status.textContent = "Abriendo WhatsApp…";
          window.location.assign(whatsappUrl);
        }
      }
    });
  }

  // ----------------------------------------------------- video del hero
  var heroVideo = document.querySelector(".hero-video");
  if (heroVideo && prefersReducedMotion) {
    heroVideo.removeAttribute("autoplay");
    heroVideo.pause();
  }
})();
