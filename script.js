document.getElementById("year").textContent = new Date().getFullYear();

const weatherStatus = document.getElementById("weather-status");
const forecast = document.getElementById("forecast");
const weatherDescriptions = {
  0: ["Despejado", "☀️"],
  1: ["Mayormente despejado", "🌤️"],
  2: ["Parcialmente nublado", "⛅"],
  3: ["Nublado", "☁️"],
  45: ["Niebla", "🌫️"],
  48: ["Niebla con escarcha", "🌫️"],
  51: ["Llovizna ligera", "🌦️"],
  53: ["Llovizna", "🌦️"],
  55: ["Llovizna intensa", "🌧️"],
  56: ["Llovizna helada ligera", "🌧️"],
  57: ["Llovizna helada intensa", "🌧️"],
  61: ["Lluvia ligera", "🌦️"],
  63: ["Lluvia", "🌧️"],
  65: ["Lluvia intensa", "🌧️"],
  66: ["Lluvia helada ligera", "🌧️"],
  67: ["Lluvia helada intensa", "🌧️"],
  71: ["Nieve ligera", "🌨️"],
  73: ["Nieve", "🌨️"],
  75: ["Nieve intensa", "❄️"],
  77: ["Granizo pequeño", "🌨️"],
  80: ["Chubascos ligeros", "🌦️"],
  81: ["Chubascos", "🌧️"],
  82: ["Chubascos intensos", "🌧️"],
  85: ["Chubascos de nieve", "🌨️"],
  86: ["Chubascos de nieve intensos", "🌨️"],
  95: ["Tormenta", "⛈️"],
  96: ["Tormenta con granizo", "⛈️"],
  99: ["Tormenta intensa con granizo", "⛈️"],
};


document.getElementById("contact-form").addEventListener("submit", (event) => {
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
});
