(function () {
  "use strict";

  var WA_NUMBER = "56993145696";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Año del pie de página
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ------------------------------------------------------------ cabecera
  var topbar = document.getElementById("topbar");
  function onScroll() {
    if (topbar) topbar.classList.toggle("is-solid", window.scrollY > 40);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ------------------------------------------------------------ menú móvil
  var menuBtn = document.getElementById("menuBtn");
  var drawer = document.getElementById("drawer");
  function setMenu(open) {
    if (!menuBtn || !drawer) return;
    drawer.hidden = !open;
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    menuBtn.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    document.body.style.overflow = open ? "hidden" : "";
    if (topbar && open) topbar.classList.add("is-solid");
    else onScroll();
  }
  if (menuBtn && drawer) {
    menuBtn.addEventListener("click", function () {
      setMenu(drawer.hidden);
    });
    drawer.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !drawer.hidden) setMenu(false);
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 960 && !drawer.hidden) setMenu(false);
    });
  }

  // ------------------------------------------- menú: sección que se está viendo
  if ("IntersectionObserver" in window) {
    var links = document.querySelectorAll(".links a[href^='#']");
    var map = {
      actividades: "actividades", yate: "actividades", raquero: "actividades",
      hansa: "actividades", pesca: "actividades",
      capella: "capella", embarcaciones: "embarcaciones",
      clima: "clima", preguntas: "preguntas", contacto: "contacto",
    };
    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var key = map[entry.target.id];
          links.forEach(function (a) {
            a.classList.toggle("is-active", a.getAttribute("href") === "#" + key);
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) spy.observe(el);
    });
  }

  // ------------------------------------------------------------ mapa del viento
  var windWrap = document.getElementById("windWrap");
  var windCover = document.getElementById("windCover");
  if (windWrap && windCover) {
    windCover.addEventListener("click", function () {
      windWrap.classList.add("is-active");
    });
  }

  // ------------------------------------------------------------ video de portada
  var heroVideo = document.querySelector(".hero-video");
  if (heroVideo && reduceMotion) {
    heroVideo.removeAttribute("autoplay");
    heroVideo.pause();
  }

  // ---------------------------- botones que preseleccionan la actividad en el formulario
  var select = document.getElementById("contact-activity-page");
  document.addEventListener("click", function (e) {
    var trigger = e.target.closest("[data-actividad]");
    if (trigger && select) select.value = trigger.getAttribute("data-actividad");
  });

  // ------------------------------------------------------------ formulario → WhatsApp
  var form = document.getElementById("contact-form-page");
  if (form) {
    var dateInput = form.elements.namedItem("date");
    if (dateInput) {
      var now = new Date();
      var pad = function (n) { return String(n).padStart(2, "0"); };
      dateInput.min = now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate());
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!form.reportValidity()) return;

      var val = function (name) { return form.elements.namedItem(name).value.trim(); };
      var sel = form.elements.namedItem("activity");
      var activity = sel.value ? sel.options[sel.selectedIndex].text : "";
      var date = val("date");
      var dateText = "";
      if (date) {
        dateText = new Date(date + "T12:00:00").toLocaleDateString("es-CL", {
          weekday: "long", day: "numeric", month: "long",
        });
      }

      var lines = ["Hola, soy " + val("name") + "."];
      if (activity) lines.push("Me interesa: " + activity + ".");
      lines.push("Participantes: " + val("people") + ".");
      if (dateText) lines.push("Fecha preferida: " + dateText + ".");
      if (val("message")) lines.push("", val("message"));

      var url = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(lines.join("\n"));
      var win = window.open(url, "_blank");
      var status = document.getElementById("contact-status-page");
      if (status) {
        if (win) {
          win.opener = null;
          status.textContent = "Se abrió WhatsApp. Revisa el mensaje y presiona enviar.";
          form.reset();
        } else {
          status.textContent = "Abriendo WhatsApp…";
          window.location.assign(url);
        }
      }
    });
  }
})();
