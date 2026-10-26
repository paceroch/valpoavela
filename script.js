document.getElementById("year").textContent = new Date().getFullYear();

// Manejo de cambio de vistas
function showView(viewId) {
  const views = document.querySelectorAll('.page-view');
  views.forEach(view => {
    view.classList.remove('active');
  });

  const targetView = document.getElementById(`view-${viewId}`);
  if (targetView) {
    targetView.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// Navegación hacia secciones del Home
function navigateToSection(viewId, sectionId) {
  showView(viewId);
  setTimeout(() => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  }, 100);
}

// Menú móvil toggle
function toggleMobileMenu() {
  const mobileNav = document.getElementById("mobileNav");
  if (mobileNav) {
    mobileNav.classList.toggle("open");
  }
}

// Formulario de Contacto (Home / Principal)
const contactForm = document.getElementById("contact-form");
if (contactForm) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!(form instanceof HTMLFormElement) || !form.reportValidity()) return;
    const name = form.elements.namedItem("name").value.trim();
    const contact = form.elements.namedItem("contact").value.trim();
    const message = form.elements.namedItem("message").value.trim();
    const text = `Hola, soy ${name}.\nMi contacto: ${contact}\n\n${message}`;
    const whatsappUrl = `https://wa.me/56993145696?text=${encodeURIComponent(text)}`;
    const whatsappWindow = window.open(whatsappUrl, "_blank");
    const status = document.getElementById("contact-status");
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

// Formulario de Contacto (Página de Contacto)
const contactFormPage = document.getElementById("contact-form-page");
if (contactFormPage) {
  contactFormPage.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!(form instanceof HTMLFormElement) || !form.reportValidity()) return;
    const name = form.elements.namedItem("name").value.trim();
    const contact = form.elements.namedItem("contact").value.trim();
    const message = form.elements.namedItem("message").value.trim();
    const text = `Hola, soy ${name}.\nMi contacto: ${contact}\n\n${message}`;
    const whatsappUrl = `https://wa.me/56993145696?text=${encodeURIComponent(text)}`;
    const whatsappWindow = window.open(whatsappUrl, "_blank");
    const status = document.getElementById("contact-status-page");
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