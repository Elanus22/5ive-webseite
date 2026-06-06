/* ==========================================================================
   5ive – form.js
   Kontaktformular für Veranstalter ("Starten").
   Versand via EmailJS, Spamschutz via hCaptcha.
   Ziel-E-Mail: barbaralei@hotmail.com (im EmailJS-Template hinterlegen)
   ========================================================================== */

const EMAILJS_PUBLIC_KEY  = "EMAILJS_PUBLIC_KEY";    // TODO: vor Launch ersetzen
const EMAILJS_SERVICE_ID  = "EMAILJS_SERVICE_ID";    // TODO: vor Launch ersetzen
const EMAILJS_TEMPLATE_ID = "EMAILJS_TEMPLATE_ID";  // TODO: vor Launch ersetzen

(function () {
  "use strict";

  const form       = document.getElementById("starten-form");
  if (!form) return;

  const feedback    = document.getElementById("form-feedback");
  const submitBtn   = document.getElementById("form-submit");
  const submitLabel = document.getElementById("form-submit-label");
  const spinner     = document.getElementById("form-spinner");

  const emailjsReady =
    window.emailjs &&
    !EMAILJS_PUBLIC_KEY.includes("EMAILJS_PUBLIC_KEY");

  if (emailjsReady) {
    try { window.emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY }); } catch (e) {}
  }

  function showFeedback(type, message) {
    if (!feedback) return;
    const styles = {
      success: "bg-green/15 text-green-deep border-green/40",
      error:   "bg-red-50 text-red-700 border-red-200",
    };
    feedback.className =
      "form-feedback is-visible mt-6 rounded-2xl border px-5 py-4 text-base font-medium " +
      (styles[type] || styles.error);
    feedback.textContent = message;
    feedback.setAttribute("role", type === "error" ? "alert" : "status");
  }

  function hideFeedback() {
    if (feedback) feedback.classList.remove("is-visible");
  }

  function setLoading(loading) {
    if (!submitBtn) return;
    submitBtn.disabled = loading;
    submitBtn.classList.toggle("opacity-70", loading);
    submitBtn.classList.toggle("cursor-not-allowed", loading);
    if (spinner)     spinner.style.display = loading ? "block" : "none";
    if (submitLabel) submitLabel.textContent = loading ? "Wird gesendet …" : "Nachricht senden";
  }

  function getCaptchaToken() {
    if (window.hcaptcha && typeof window.hcaptcha.getResponse === "function") {
      try { return window.hcaptcha.getResponse(); } catch (e) { return ""; }
    }
    const field = form.querySelector('textarea[name="h-captcha-response"]');
    return field ? field.value : "";
  }

  function resetCaptcha() {
    if (window.hcaptcha && typeof window.hcaptcha.reset === "function") {
      try { window.hcaptcha.reset(); } catch (e) {}
    }
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    hideFeedback();

    const data = {
      name:     form.name.value.trim(),
      email:    form.email.value.trim(),
      city:     form.city.value.trim(),
      message:  form.message.value.trim(),
      to_email: "barbaralei@hotmail.com",
    };

    if (!data.name || !data.email || !data.city) {
      showFeedback("error", "Bitte fülle Name, E-Mail und Stadt aus.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      showFeedback("error", "Bitte gib eine gültige E-Mail-Adresse ein.");
      return;
    }

    const captchaActive = !!document.querySelector(".h-captcha");
    const token = getCaptchaToken();
    if (captchaActive && window.hcaptcha && !token) {
      showFeedback("error", "Bitte bestätige, dass du kein Roboter bist.");
      return;
    }

    setLoading(true);

    if (!emailjsReady) {
      setTimeout(function () {
        setLoading(false);
        showFeedback(
          "success",
          "Danke! Deine Anfrage wurde erfasst. Wir melden uns bald bei dir. (Demo-Modus – EmailJS vor Launch konfigurieren.)"
        );
        form.reset();
        resetCaptcha();
      }, 800);
      return;
    }

    try {
      await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        from_name:             data.name,
        from_email:            data.email,
        reply_to:              data.email,
        city:                  data.city,
        message:               data.message || "(keine Nachricht angegeben)",
        to_email:              data.to_email,
        "h-captcha-response":  token,
      });
      setLoading(false);
      showFeedback("success", "Vielen Dank! Deine Anfrage ist angekommen. Wir melden uns bald.");
      form.reset();
      resetCaptcha();
    } catch (err) {
      setLoading(false);
      showFeedback(
        "error",
        "Da ist leider etwas schiefgelaufen. Bitte versuche es später erneut oder schreib direkt an barbaralei@hotmail.com."
      );
      resetCaptcha();
    }
  });
})();
