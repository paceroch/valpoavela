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
    yate: "Paseos en velero en Valparaíso | Valpo a Vela",
    pesca: "Salidas de pesca en Valparaíso | Valpo a Vela",
    raquero: "Clase práctica de vela en raquero | Valpo a Vela",
    embarcaciones: "Nuestras embarcaciones | Valpo a Vela",
    preguntas: "Preguntas frecuentes | Valpo a Vela",
    contacto: "Contacto | Valpo a Vela",
  };
  var ACTIVITY_VIEWS = ["yate", "raquero", "hansa", "pesca"];
  // Anclas que viven dentro de vistas, en lugar de ser vistas por sí mismas.
  var SECTION_VIEWS = {
    filosofia: "home",
    actividades: "home",
    clima: "home",
    "datos-zarpe": "home",
    "embarcacion-hansa": "embarcaciones",
    "embarcacion-yate": "embarcaciones",
    "embarcacion-pesca": "embarcaciones",
    "embarcacion-raquero": "embarcaciones",
    "embarcacion-apoyo": "embarcaciones",
  };

  var currentView = null;
  var activityNavigation = document.getElementById("activity-navigation");

  var yearEl = document.getElementById("year");
  var mobileYearEl = document.getElementById("mobileYear");
  var currentYear = new Date().getFullYear();
  if (yearEl) yearEl.textContent = currentYear;
  if (mobileYearEl) mobileYearEl.textContent = currentYear;

  // ---------------------------------------------------------------- vistas
  function showView(view) {
    var changed = view !== currentView;
    var isActivityView = ACTIVITY_VIEWS.indexOf(view) !== -1;
    if (isActivityView) {
      var main = document.querySelector("main");
      if (main) {
        [view]
          .concat(ACTIVITY_VIEWS.filter(function (activity) {
            return activity !== view;
          }))
          .forEach(function (activity) {
            var activityView = document.getElementById("view-" + activity);
            if (activityView) main.appendChild(activityView);
          });
      }
    }
    document.querySelectorAll(".page-view").forEach(function (el) {
      el.classList.toggle("active", el.id === "view-" + view);
    });
    if (activityNavigation) {
      var navigationTarget = isActivityView
        ? document.querySelector("#view-" + view + " .raquero-wrap")
        : document.querySelector("main");
      if (navigationTarget) navigationTarget.appendChild(activityNavigation);
      activityNavigation.querySelectorAll("a").forEach(function (link) {
        var isCurrent = link.getAttribute("href") === "#" + view;
        if (isCurrent) {
          link.setAttribute("aria-current", "page");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    }
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

  var windMapWrap = document.querySelector(".wind-map-wrap");
  var windMapCover = document.querySelector(".wind-map-cover");
  if (windMapWrap && windMapCover) {
    windMapCover.addEventListener("click", function () {
      windMapWrap.classList.add("is-active");
    });
  }

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

  // ---------------------------------------------- álbumes de fotos en carrusel continuo
  if (!prefersReducedMotion) {
    document.querySelectorAll(".carousel-track").forEach(function (track) {
      var slides = Array.prototype.slice.call(track.children);
      if (!slides.length) return;

      var group = document.createElement("div");
      group.className = "carousel-group";
      slides.forEach(function (slide) {
        group.appendChild(slide);
      });
      track.appendChild(group);

      var duplicate = group.cloneNode(true);
      duplicate.setAttribute("aria-hidden", "true");
      track.appendChild(duplicate);
      track.classList.add("is-infinite");
    });
  }

  // ----------------------------------------------------- detalles de movimiento y navegación
  var progress = document.createElement("div");
  progress.className = "scroll-progress";
  progress.setAttribute("aria-hidden", "true");
  document.body.appendChild(progress);

  var topbar = document.querySelector(".topbar");
  var topButton = document.createElement("button");
  topButton.className = "back-to-top";
  topButton.type = "button";
  topButton.setAttribute("aria-label", "Volver arriba");
  topButton.textContent = "↑";
  document.body.appendChild(topButton);
  topButton.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  });

  function updateScrollUI() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var percent = max > 0 ? (window.scrollY / max) * 100 : 0;
    progress.style.width = percent + "%";
    if (topbar) topbar.classList.toggle("is-scrolled", window.scrollY > 12);
    topButton.classList.toggle("visible", window.scrollY > 500);
  }
  window.addEventListener("scroll", updateScrollUI, { passive: true });
  window.addEventListener("resize", updateScrollUI);
  updateScrollUI();

  // Aparición suave de secciones y tarjetas al entrar en pantalla.
  if (!prefersReducedMotion && "IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });

    document.querySelectorAll(
      ".section-head, .story-copy, .story-images, .raquero-header, .incluye-item, .contact-form, .licencia-cta"
    ).forEach(function (el) {
      el.classList.add("js-reveal");
      revealObserver.observe(el);
    });
  }

  // ------------------------------------------ efectos al desplazarse (paralaje y menú activo)
  if (!prefersReducedMotion) {
    var heroEl = document.querySelector(".hero");
    var heroCopy = document.querySelector(".hero-content");
    var plx = document.querySelectorAll("[data-parallax]");
    var ticking = false;
    var fx = function () {
      ticking = false;
      var y = window.scrollY, vh = window.innerHeight;
      if (heroEl && y < vh * 1.2) {
        if (heroVideo) heroVideo.style.transform = "translate3d(0," + y * 0.22 + "px,0) scale(" + (1 + y / vh * 0.08) + ")";
        if (heroCopy) {
          heroCopy.style.opacity = Math.max(0, 1 - y / (vh * 0.65));
          heroCopy.style.transform = "translate3d(0," + y * 0.14 + "px,0)";
        }
      }
      plx.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        el.style.transform = "translate3d(0," + (r.top + r.height / 2 - vh / 2) * parseFloat(el.dataset.parallax) + "px,0)";
      });
    };
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(fx); }
    }, { passive: true });
    fx();
  }

  // Marca en el menú la sección que se está viendo
  if ("IntersectionObserver" in window) {
    var spyLinks = document.querySelectorAll('.navlinks a[href^="#"]');
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        spyLinks.forEach(function (a) {
          a.classList.toggle("is-active", a.getAttribute("href") === "#" + entry.target.id);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    ["filosofia", "actividades", "clima", "contacto"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) spy.observe(el);
    });
  }

})();
