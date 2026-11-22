(function () {
  "use strict";

  var WA_NUMBER = "56993145696";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var mobileScroll = window.matchMedia("(max-width: 768px), (pointer: coarse)");
  document.documentElement.classList.add("js");

  var navigation = performance.getEntriesByType("navigation")[0];
  var isReload = navigation ? navigation.type === "reload"
    : performance.navigation && performance.navigation.type === 1;
  if (isReload) {
    var scrollRestoration = history.scrollRestoration;
    if (scrollRestoration) history.scrollRestoration = "manual";
    if (location.hash) {
      history.replaceState(history.state, "", location.pathname + location.search);
    }
    window.addEventListener("pageshow", function () {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      if (scrollRestoration) {
        setTimeout(function () { history.scrollRestoration = scrollRestoration; }, 0);
      }
    }, { once: true });
  }

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  // La barra del navegador móvil puede cambiar la altura sin mover las tarjetas.
  function onViewportWidthChange(callback) {
    var width = window.innerWidth;
    var contentWidth = document.documentElement.clientWidth;
    window.addEventListener("resize", function () {
      var nextContentWidth = document.documentElement.clientWidth;
      if (window.innerWidth === width && nextContentWidth === contentWidth) return;
      width = window.innerWidth;
      contentWidth = nextContentWidth;
      callback();
    });
  }

  var yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---------------------------------------------------------- video de portada
  var heroVideo = $(".hero-video");
  if (heroVideo && reduceMotion) {
    heroVideo.pause();
    heroVideo.removeAttribute("autoplay");
  } else if (heroVideo && "IntersectionObserver" in window) {
    heroVideo.removeAttribute("autoplay");
    new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        heroVideo.play().catch(function () {
          // El navegador puede bloquear la reproducción automática.
        });
      } else {
        heroVideo.pause();
      }
    }).observe(heroVideo);
  }

  // ---------------------------------------------------------- navegación
  var nav = $("#nav");
  var toggle = $("#navToggle");
  var drawer = $("#drawer");
  function setMenu(open) {
    if (!toggle || !drawer) return;
    drawer.hidden = !open;
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    document.body.style.overflow = open ? "hidden" : "";
  }
  if (toggle && drawer) {
    toggle.addEventListener("click", function () { setMenu(drawer.hidden); });
    drawer.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !drawer.hidden) setMenu(false); });
    window.addEventListener("resize", function () { if (window.innerWidth > 860 && !drawer.hidden) setMenu(false); });
  }

  document.addEventListener("click", function (event) {
    if (event.defaultPrevented || event.button !== 0 ||
        event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    var link = event.target.closest('a[href^="#"]');
    if (!link || link.target || link.hasAttribute("download")) return;
    var hash = link.hash;
    var target = hash && document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!target) return;
    event.preventDefault();
    if (location.hash !== hash) history.pushState(history.state, "", hash);
    if (target.tabIndex < 0 && !target.hasAttribute("tabindex")) {
      target.setAttribute("tabindex", "-1");
      target.addEventListener("blur", function () { target.removeAttribute("tabindex"); }, { once: true });
    }
    target.focus({ preventScroll: true });
    target.scrollIntoView({ behavior: reduceMotion ? "instant" : "smooth" });
  });

  // Sección activa en el menú
  if ("IntersectionObserver" in window) {
    var links = $$(".nav-links a[href^='#']");
    var map = { actividades: "actividades", capella: "capella", embarcaciones: "embarcaciones", clima: "clima", preguntas: "preguntas", contacto: "contacto" };
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle("is-active", a.getAttribute("href") === "#" + map[en.target.id]); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(map).forEach(function (id) { var el = document.getElementById(id); if (el) spy.observe(el); });
  }

  // ---------------------------------------------------------- aparición al desplazarse
  var rv = $$(".rv");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); obs.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    rv.forEach(function (el) { io.observe(el); });
  } else {
    rv.forEach(function (el) { el.classList.add("in"); });
  }

  // ---------------------------------------------------------- frase y efectos ligados al scroll
  var statement = $("#statementText");
  var words = [];
  var statementVisible = false;
  var statementLayoutDirty = true;
  var statementProgress;
  var wordOpacities = [];

  function prepareStatement() {
    statement.toggleAttribute("data-word-gradient", !mobileScroll.matches);
    statement.toggleAttribute("data-simple-gradient", mobileScroll.matches);
    if (!mobileScroll.matches && !words.length) {
      Array.from(statement.childNodes).forEach(function (node) {
        if (node.nodeType !== Node.TEXT_NODE) return;
        var fragment = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            fragment.appendChild(document.createTextNode(part));
            return;
          }
          var span = document.createElement("span");
          span.className = "w";
          span.textContent = part;
          fragment.appendChild(span);
          words.push(span);
        });
        node.replaceWith(fragment);
      });
    }
    statementProgress = undefined;
    invalidateStatementLayout();
  }

  function invalidateStatementLayout() {
    statementLayoutDirty = true;
    if (statementVisible) onScroll();
  }

  var backToTop = $(".back-to-top");
  var ticking = false;
  if (statement && !reduceMotion && "IntersectionObserver" in window) {
    prepareStatement();
    mobileScroll.addEventListener("change", prepareStatement);
    new IntersectionObserver(function (entries) {
      statementVisible = entries[entries.length - 1].isIntersecting;
      if (statementVisible) invalidateStatementLayout();
    }).observe(statement);
    onViewportWidthChange(invalidateStatementLayout);
    if ("ResizeObserver" in window) {
      new ResizeObserver(invalidateStatementLayout).observe(statement);
    }
    if (document.fonts) document.fonts.ready.then(invalidateStatementLayout);
  }

  function update() {
    ticking = false;
    var scrollY = window.scrollY;
    var bounds, progress, offsets;
    if (statementVisible) {
      var vh = window.innerHeight;
      bounds = statement.getBoundingClientRect();
      progress = clamp((vh * 0.9 - bounds.top) / (vh * 0.55 + bounds.height * 0.4), 0, 1);
      if (!mobileScroll.matches && statementLayoutDirty) {
        offsets = words.map(function (word) {
          return bounds.left - word.getBoundingClientRect().left;
        });
      }
    }

    if (nav) nav.classList.toggle("header-scrolled", scrollY > 10);
    if (backToTop) {
      var showBackToTop = scrollY > 320;
      var ariaHidden = showBackToTop ? "false" : "true";
      backToTop.classList.toggle("is-visible", showBackToTop);
      if (backToTop.getAttribute("aria-hidden") !== ariaHidden) {
        backToTop.setAttribute("aria-hidden", ariaHidden);
      }
    }
    if (!statementVisible) return;

    if (offsets) {
      statement.style.setProperty("--statement-gradient-width", bounds.width + "px");
      words.forEach(function (word, i) {
        word.style.setProperty("--statement-gradient-offset", offsets[i] + "px");
      });
      statementLayoutDirty = false;
    }

    var opacityProgress = mobileScroll.matches ? progress.toFixed(3) : progress;
    if (opacityProgress === statementProgress) return;
    statementProgress = opacityProgress;
    if (mobileScroll.matches) {
      statement.style.setProperty("--statement-opacity", opacityProgress);
    } else {
      words.forEach(function (word, i) {
        var start = i / words.length * 0.85;
        var opacity = clamp((progress - start) / 0.15, 0, 1).toFixed(3);
        if (opacity === wordOpacities[i]) return;
        wordOpacities[i] = opacity;
        word.style.setProperty("--wp", opacity);
      });
    }
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();

  // ---------------------------------------------------------- carrusel de destacados
  var track = $("#hlTrack");
  var dotsWrap = $("#hlDots");
  var playBtn = $("#hlPlay");
  if (track && dotsWrap) {
    var cards = $$(".hl-card", track);
    var dots = cards.map(function (c, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "hl-dot";
      b.setAttribute("role", "tab");
      b.setAttribute("aria-label", "Ir a la experiencia " + (i + 1));
      b.appendChild(document.createElement("i"));
      b.addEventListener("click", function () { goTo(i, true); });
      dotsWrap.appendChild(b);
      return b;
    });
    var index = 0;
    var playing = !reduceMotion && !mobileScroll.matches;
    var timer = null;
    var visible = !("IntersectionObserver" in window);
    var TIME = 6000;
    track.style.setProperty("--hl-time", TIME + "ms");
    dotsWrap.style.setProperty("--hl-time", TIME + "ms");

    function stride() {
      return cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : track.clientWidth;
    }
    function render() {
      dots.forEach(function (d, i) {
        d.classList.toggle("is-active", i === index);
        d.classList.toggle("is-playing", i === index && playing);
        d.setAttribute("aria-selected", i === index ? "true" : "false");
        d.style.setProperty("--hl-time", TIME + "ms");
      });
      if (playBtn) {
        playBtn.classList.toggle("is-paused", !playing);
        playBtn.setAttribute("aria-label", playing ? "Pausar reproducción automática" : "Reanudar reproducción automática");
      }
    }
    function schedule() {
      clearTimeout(timer);
      if (!playing || !visible) return;
      timer = setTimeout(function () { goTo((index + 1) % cards.length, false); }, TIME);
    }
    function goTo(i, user) {
      index = i;
      track.scrollTo({ left: cards[i].offsetLeft - cards[0].offsetLeft, behavior: reduceMotion ? "auto" : "smooth" });
      if (user) playing = false;
      render();
      schedule();
    }
    var scrollEnd;
    track.addEventListener("scroll", function () {
      clearTimeout(scrollEnd);
      scrollEnd = setTimeout(function () {
        var i = clamp(Math.round(track.scrollLeft / stride()), 0, cards.length - 1);
        if (i !== index) { index = i; render(); schedule(); }
      }, 90);
    }, { passive: true });
    ["pointerdown", "touchstart", "wheel"].forEach(function (ev) {
      track.addEventListener(ev, function () { if (playing) { playing = false; render(); clearTimeout(timer); } }, { passive: true });
    });
    if (playBtn) {
      playBtn.addEventListener("click", function () {
        playing = !playing;
        render();
        schedule();
      });
    }
    // Solo avanza solo cuando el carrusel está a la vista
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting;
        render();
        schedule();
      }, { threshold: 0.35 }).observe(track);
    }
    render();
    schedule();
  }

  // ---------------------------------------------------------- indicadores de tarjetas deslizables
  $$("[data-scroller]").forEach(function (sc) {
    var tr = $(".track", sc);
    var indicator = sc.nextElementSibling;
    if (!tr) return;
    var dotsWrap = $(".hl-dots", indicator);
    var play = $(".hl-play", indicator);
    var cards = Array.from(tr.children);
    var positions = [];
    var active = 0;
    var playing = false;
    var visible = !("IntersectionObserver" in window);
    var timer;
    var dots = cards.map(function (card, i) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.className = "hl-dot";
      dot.setAttribute("aria-label", "Ir a la posición " + (i + 1));
      dot.appendChild(document.createElement("i"));
      dot.addEventListener("click", function () {
        pause();
        goTo(i);
      });
      dotsWrap.appendChild(dot);
      return dot;
    });
    function goTo(i) {
      tr.scrollTo({ left: positions[i], behavior: reduceMotion ? "auto" : "smooth" });
    }
    function schedule() {
      clearTimeout(timer);
      state();
      if (playing && visible && positions.length > 1) {
        timer = setTimeout(function () {
          goTo((active + 1) % positions.length);
          schedule();
        }, 6000);
      }
    }
    function pause() {
      if (!playing) return;
      playing = false;
      schedule();
    }
    function state() {
      var left = tr.scrollLeft;
      active = 0;
      positions.forEach(function (position, i) {
        if (Math.abs(left - position) < Math.abs(left - positions[active])) active = i;
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === active);
        dot.classList.toggle("is-playing", i === active && playing && visible);
        if (i === active) dot.setAttribute("aria-current", "true");
        else dot.removeAttribute("aria-current");
      });
      play.classList.toggle("is-paused", !playing);
      play.setAttribute("aria-label", playing ? "Pausar reproducción automática" : "Iniciar reproducción automática");
    }
    function layout() {
      var max = tr.scrollWidth - tr.clientWidth;
      positions = [];
      cards.forEach(function (card) {
        var position = Math.min(card.offsetLeft - cards[0].offsetLeft, max);
        if (!positions.length || position - positions[positions.length - 1] > 1) {
          positions.push(position);
        }
      });
      dots.forEach(function (dot, i) { dot.hidden = i >= positions.length; });
      indicator.hidden = positions.length < 2;
      schedule();
    }
    play.addEventListener("click", function () {
      playing = !playing;
      schedule();
    });
    ["pointerdown", "touchstart", "wheel", "focusin"].forEach(function (event) {
      tr.addEventListener(event, pause, { passive: true });
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        schedule();
      }).observe(tr);
    }
    tr.addEventListener("scroll", state, { passive: true });
    onViewportWidthChange(layout);
    layout();
  });

  // ---------------------------------------------------------- detalles de actividades
  var activityModal = $("#activityModal");
  var activityModalTitle = $("#activityModalTitle");
  var activityModalContent = $("#activityModalContent");
  var activityModalClose = $(".activity-modal-close", activityModal);
  var activityModalScroll = $(".activity-modal-scroll", activityModal);
  var activityModalNavigation = $("#activity-modal-navigation");
  var activityTriggers = $$(".fcard-details[data-activity-modal]");
  var activityIndex = -1;
  var activityModalTrigger = null;
  var activityModalScrollY = 0;
  var activityModalBodyStyles = null;

  function lockPageScroll() {
    activityModalScrollY = window.scrollY;
    activityModalBodyStyles = {
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
      overflow: document.body.style.overflow
    };
    document.body.style.position = "fixed";
    document.body.style.top = "-" + activityModalScrollY + "px";
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";
  }

  function restorePageScroll() {
    if (!activityModalBodyStyles) return;
    document.body.style.position = activityModalBodyStyles.position;
    document.body.style.top = activityModalBodyStyles.top;
    document.body.style.left = activityModalBodyStyles.left;
    document.body.style.right = activityModalBodyStyles.right;
    document.body.style.width = activityModalBodyStyles.width;
    document.body.style.overflow = activityModalBodyStyles.overflow;
    activityModalBodyStyles = null;

    var scrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, activityModalScrollY);
    document.documentElement.style.scrollBehavior = scrollBehavior;
  }

  function closeActivityModal(restoreFocus) {
    if (!activityModal || !activityModal.open) return;
    activityModal.close();
    if (activityModalTrigger) activityModalTrigger.setAttribute("aria-expanded", "false");
    restorePageScroll();
    if (restoreFocus && activityModalTrigger) activityModalTrigger.focus({ preventScroll: true });
    activityModalTrigger = null;
    activityIndex = -1;
  }

  function showActivityDetails(index) {
    var trigger = activityTriggers[index];
    var template = document.getElementById(trigger.getAttribute("data-activity-modal"));
    if (!template || template.tagName !== "TEMPLATE") return false;

    var content = template.content.cloneNode(true);
    var navigation = activityModalNavigation.content.cloneNode(true);
    if (index === 0) $('[data-direction="-1"]', navigation).setAttribute("aria-label", "Volver a actividades");
    $('[data-direction="1"]', navigation).disabled = index === activityTriggers.length - 1;
    $(".activity-modal-actions", content).appendChild(navigation);
    activityModalTitle.textContent = template.getAttribute("data-title");
    activityModalContent.replaceChildren(content);
    activityIndex = index;
    activityModalScroll.scrollTop = 0;
    return true;
  }

  if (activityModal && activityModalTitle && activityModalContent && activityModalClose &&
      activityModalScroll && activityModalNavigation) {
    activityTriggers.forEach(function (trigger, index) {
      trigger.addEventListener("click", function () {
        if (activityModal.open) return;
        if (!showActivityDetails(index)) return;
        activityModalTrigger = trigger;
        lockPageScroll();
        activityModal.showModal();
        activityModalScroll.scrollTop = 0;
        trigger.setAttribute("aria-expanded", "true");
        activityModalClose.focus();
      });
    });

    activityModal.addEventListener("cancel", function (event) {
      event.preventDefault();
    });
    activityModalClose.addEventListener("click", function () { closeActivityModal(true); });
    activityModalContent.addEventListener("click", function (event) {
      var step = event.target.closest(".activity-modal-step");
      if (step) {
        var nextIndex = activityIndex + Number(step.dataset.direction);
        if (nextIndex < 0) closeActivityModal(true);
        else if (nextIndex < activityTriggers.length && showActivityDetails(nextIndex)) {
          activityModalClose.focus({ preventScroll: true });
        }
        return;
      }
      if (event.target.closest("a[href^='#']")) closeActivityModal(false);
    });
  }

  // ---------------------------------------------------------- mapas interactivos
  [["#windWrap", "#windCover"], ["#harborMapWrap", "#harborMapCover"]].forEach(function (selectors) {
    var wrap = $(selectors[0]);
    var cover = $(selectors[1]);
    if (!wrap || !cover) return;
    cover.addEventListener("click", function () {
      wrap.classList.add("is-active");
      if (wrap.id === "harborMapWrap") {
        var frame = $("iframe", wrap);
        frame.removeAttribute("tabindex");
        frame.focus({ preventScroll: true });
      }
    });
  });

  // ---------------------------------------------------------- botones que preseleccionan actividad
  var select = $("#contact-activity-page");
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-actividad]");
    if (t && select) select.value = t.getAttribute("data-actividad");
  });

  // ---------------------------------------------------------- formulario → WhatsApp
  var form = $("#contact-form-page");
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
        dateText = new Date(date + "T12:00:00").toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" });
      }
      var lines = ["Hola, soy " + val("name") + "."];
      if (activity) lines.push("Me interesa: " + activity + ".");
      lines.push("Participantes: " + val("people") + ".");
      if (dateText) lines.push("Fecha preferida: " + dateText + ".");
      if (val("message")) lines.push("", val("message"));
      var url = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(lines.join("\n"));
      var win = window.open(url, "_blank");
      var status = $("#contact-status-page");
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
