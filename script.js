(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.add("js");

  var navigation = performance.getEntriesByType("navigation")[0];
  var isReload = navigation ? navigation.type === "reload"
    : performance.navigation && performance.navigation.type === 1;
  var isActivityPage = document.body.classList.contains("activity-page");
  function scrollToPageStart() {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }
  if (isActivityPage) {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    var isHistoryTraversal = navigation ? navigation.type === "back_forward"
      : performance.navigation && performance.navigation.type === 2;
    window.addEventListener("pageshow", function (event) {
      if (event.persisted || isHistoryTraversal) scrollToPageStart();
    });
  }
  if (isReload) {
    var scrollRestoration = history.scrollRestoration;
    if (scrollRestoration) history.scrollRestoration = "manual";
    if (location.hash) {
      history.replaceState(history.state, "", location.pathname + location.search);
    }
    window.addEventListener("pageshow", function () {
      scrollToPageStart();
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

  // ---------------------------------------------------------- texto que se ilumina palabra por palabra
  var wordGradients = new Map();
  var visibleGradients = new Set();
  if (!reduceMotion) {
    var gradientObserver = "IntersectionObserver" in window
      ? new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var gradient = wordGradients.get(entry.target);
          if (entry.isIntersecting) {
            visibleGradients.add(gradient);
          } else {
            visibleGradients.delete(gradient);
            updateWordGradient(gradient, entry.boundingClientRect.top < 0 ? 1 : 0);
          }
        });
        onScroll();
      })
      : null;
    var gradientResizeObserver = "ResizeObserver" in window
      ? new ResizeObserver(function (entries) {
        entries.forEach(function (entry) {
          layoutWordGradient(wordGradients.get(entry.target));
        });
        onScroll();
      })
      : null;

    $$("#statementText, h2.grad, .activity-page h1.grad").forEach(function (element) {
      var words = [];
      Array.from(element.childNodes).forEach(function (node) {
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
      if (!words.length) return;

      var gradient = { element: element, words: words, opacities: [] };
      wordGradients.set(element, gradient);
      element.setAttribute("data-word-gradient", "");
      layoutWordGradient(gradient);
      if (gradientObserver) gradientObserver.observe(element);
      else visibleGradients.add(gradient);
      if (gradientResizeObserver) gradientResizeObserver.observe(element);
    });

    function layoutWordGradients() { wordGradients.forEach(layoutWordGradient); }
    onViewportWidthChange(layoutWordGradients);
    if (document.fonts) document.fonts.ready.then(layoutWordGradients);
  }

  function layoutWordGradient(gradient) {
    var bounds = gradient.element.getBoundingClientRect();
    var offsets = gradient.words.map(function (word) {
      return bounds.left - word.getBoundingClientRect().left;
    });
    // Todas las palabras muestran un recorte del mismo degradado horizontal.
    gradient.element.style.setProperty("--word-gradient-width", bounds.width + "px");
    gradient.words.forEach(function (word, i) {
      word.style.setProperty("--word-gradient-offset", offsets[i] + "px");
    });
  }

  function updateWordGradient(gradient, progress) {
    if (gradient.progress === progress) return;
    gradient.progress = progress;
    gradient.words.forEach(function (word, i) {
      var start = i / gradient.words.length * 0.85;
      var opacity = clamp((progress - start) / 0.15, 0, 1).toFixed(3);
      if (opacity === gradient.opacities[i]) return;
      gradient.opacities[i] = opacity;
      word.style.setProperty("--wp", opacity);
    });
  }

  // ---------------------------------------------------------- efectos ligados al scroll
  var backToTop = $(".back-to-top");
  var ticking = false;
  function update() {
    ticking = false;
    var scrollY = window.scrollY;
    var vh = window.innerHeight;
    var gradientPositions = Array.from(visibleGradients, function (gradient) {
      var bounds = gradient.element.getBoundingClientRect();
      var progress = clamp((vh * 0.9 - bounds.top) / (vh * 0.55 + bounds.height * 0.4), 0, 1);
      return { gradient: gradient, progress: progress };
    });

    if (nav) nav.classList.toggle("header-scrolled", scrollY > 10);
    if (backToTop) {
      var showBackToTop = scrollY > 320;
      var ariaHidden = showBackToTop ? "false" : "true";
      backToTop.classList.toggle("is-visible", showBackToTop);
      if (backToTop.getAttribute("aria-hidden") !== ariaHidden) {
        backToTop.setAttribute("aria-hidden", ariaHidden);
      }
    }

    gradientPositions.forEach(function (position) {
      updateWordGradient(position.gradient, position.progress);
    });
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();

  function observeCarouselScroll(track, onStart, onEnd) {
    var scrolling = false;
    var settleTimer;
    var hasScrollEnd = "onscrollend" in track;
    function settle() {
      if (!scrolling) return;
      scrolling = false;
      onEnd();
    }

    track.addEventListener("scroll", function () {
      if (!scrolling) {
        scrolling = true;
        onStart();
      }
      if (!hasScrollEnd) {
        clearTimeout(settleTimer);
        settleTimer = setTimeout(settle, 180);
      }
    }, { passive: true });
    if (hasScrollEnd) track.addEventListener("scrollend", settle);
    return function () { return scrolling; };
  }

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
    var playing = !reduceMotion && !window.matchMedia("(max-width: 860px), (pointer: coarse)").matches;
    var visible = !("IntersectionObserver" in window);
    var timer = null;
    var TIME = 6000;
    track.style.setProperty("--hl-time", TIME + "ms");
    dotsWrap.style.setProperty("--hl-time", TIME + "ms");

    function stride() {
      return cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : track.clientWidth;
    }
    function render() {
      dots.forEach(function (d, i) {
        d.classList.toggle("is-active", i === index);
        d.classList.toggle("is-playing", i === index && playing && visible);
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
      if (!playing || !visible || isScrolling()) return;
      timer = setTimeout(function () { goTo((index + 1) % cards.length, false); }, TIME);
    }
    function goTo(i, user) {
      index = i;
      track.scrollTo({ left: cards[i].offsetLeft - cards[0].offsetLeft, behavior: reduceMotion ? "auto" : "smooth" });
      if (user) playing = false;
      render();
      schedule();
    }
    var isScrolling = observeCarouselScroll(track, function () {
      clearTimeout(timer);
    }, function () {
      index = clamp(Math.round(track.scrollLeft / stride()), 0, cards.length - 1);
      render();
      schedule();
    });
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
    var renderedActive = -1;
    var renderedPlaying;
    var renderedVisible;
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
      if (playing && visible && !isScrolling() && positions.length > 1) {
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
      if (active === renderedActive && playing === renderedPlaying && visible === renderedVisible) return;
      renderedActive = active;
      renderedPlaying = playing;
      renderedVisible = visible;
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
    var isScrolling = observeCarouselScroll(tr, function () {
      clearTimeout(timer);
    }, function () {
      schedule();
    });
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

  function openActivityModal(trigger, link) {
    if (activityModal.open || !showActivityDetails(activityTriggers.indexOf(trigger))) return;
    if (link) {
      if (location.hash !== link.hash) history.pushState(history.state, "", link.hash);
      trigger.closest(".fcard").scrollIntoView({
        behavior: "instant",
        block: "start",
        inline: "center"
      });
      trigger.focus({ preventScroll: true });
    }
    activityModalTrigger = trigger;
    lockPageScroll();
    activityModal.showModal();
    activityModalScroll.scrollTop = 0;
    activityModalClose.focus({ preventScroll: true });
  }

  if (activityModal && activityModalTitle && activityModalContent && activityModalClose &&
      activityModalScroll && activityModalNavigation) {
    $$("#hlTrack a[data-open-activity]").forEach(function (link) {
      var card = document.getElementById(link.hash.slice(1));
      var trigger = card && $(".fcard-details[data-activity-modal]", card);
      if (!trigger || activityTriggers.indexOf(trigger) === -1) return;
      link.setAttribute("aria-haspopup", "dialog");
      link.addEventListener("click", function (event) {
        if (event.defaultPrevented || event.button !== 0 ||
            event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
        event.preventDefault();
        openActivityModal(trigger, link);
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

  // ---------------------------------------------------------- historial de las fichas
  var activityBack = $("[data-activity-back]");
  if (activityBack) {
    activityBack.addEventListener("click", function (event) {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
      var canGoBack = window.navigation ? window.navigation.canGoBack : history.length > 1;
      if (!canGoBack) return;
      event.preventDefault();
      history.back();
    });
  }

  // ---------------------------------------------------------- mapa del viento
  var windWrap = $("#windWrap");
  var windCover = $("#windCover");
  if (windWrap && windCover) {
    windCover.addEventListener("click", function () { windWrap.classList.add("is-active"); });
  }

  // ---------------------------------------------------------- botones que preseleccionan actividad
  var select = $("#contact-activity-page");
  if (select) {
    var requestedActivity = new URLSearchParams(location.search).get("actividad");
    if (requestedActivity && Array.from(select.options).some(function (option) {
      return option.value === requestedActivity;
    })) {
      select.value = requestedActivity;
    }
    document.addEventListener("click", function (e) {
      var link = e.target.closest("[data-actividad]");
      if (link) select.value = link.getAttribute("data-actividad");
    });
  }

  // ---------------------------------------------------------- formulario → Formspree
  var form = $("#contact-form-page");
  if (form) {
    var dateInput = form.elements.namedItem("date");
    if (dateInput) {
      var now = new Date();
      var pad = function (n) { return String(n).padStart(2, "0"); };
      dateInput.min = now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate());
    }
    var submitButton = form.querySelector('button[type="submit"]');
    var status = $("#contact-status-page");

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      if (submitButton.disabled || !form.reportValidity()) return;

      var data = new FormData(form);
      var activity = form.elements.namedItem("activity");
      data.set("activity", activity.options[activity.selectedIndex].text.trim());
      submitButton.disabled = true;
      status.textContent = "Enviando mensaje…";

      try {
        var response = await fetch(form.action, {
          method: form.method,
          headers: { Accept: "application/json" },
          body: data,
        });
        if (!response.ok) {
          status.textContent = "No pudimos enviar tu mensaje. Revisa los datos e inténtalo de nuevo.";
          return;
        }

        form.reset();
        status.textContent = "Tu mensaje se envió con éxito.";
      } catch (error) {
        status.textContent = "No pudimos conectar con el servicio de envío. Inténtalo de nuevo.";
      } finally {
        submitButton.disabled = false;
      }
    });
  }
})();
