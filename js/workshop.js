/* ==========================================================================
   5ive – workshop.js
   Kennenlern-Workshop: Termine, Pop-up (Startseite), Hinweiskasten
   (Veranstalten) und Anmeldeformular (workshop.html).

   Alles, was sich bei neuen Terminen ändert, steht in WORKSHOP.
   Ist der letzte Termin gestartet, verschwinden Pop-up und Hinweis von selbst.
   ========================================================================== */

(function () {
  "use strict";

  const WORKSHOP = {
    termine: [
      { id: "2027-01-07", tag: "Donnerstag", datum: "7. Januar 2027",  zeit: "19:30–21:30 Uhr", start: "2027-01-07T19:30:00+01:00" },
      { id: "2027-01-26", tag: "Dienstag",   datum: "26. Januar 2027", zeit: "19:30–21:30 Uhr", start: "2027-01-26T19:30:00+01:00" },
    ],
    anmeldeseite: "workshop.html",
    /* Neuer Schlüssel = Pop-up erscheint auch bei Besuchern wieder, die es schon geschlossen haben. */
    popupKey: "5ive-workshop-popup-2027-01",
    popupVerzoegerungMs: 700,
    empfaenger: "kontakt@5ive.info",
    emailjs: {
      publicKey:  "KKapd401j0aB2uiBp",
      serviceId:  "service_q0f56e1",
      /* Vorerst das bestehende Template der Veranstalter-Anfrage.
         Für eine eigene Vorlage hier die neue Template-ID eintragen. */
      templateId: "template_s16pbwx",
    },
  };

  /* Lokale Vorschau: kein Captcha, kein echter Mailversand. */
  const LOKAL = ["localhost", "127.0.0.1", "[::1]", ""].includes(window.location.hostname);

  function offeneTermine() {
    const jetzt = Date.now();
    return WORKSHOP.termine.filter(function (t) { return Date.parse(t.start) > jetzt; });
  }

  function terminText(t) {
    return t.tag + ", " + t.datum + ", " + t.zeit;
  }

  const ICON_KALENDER =
    '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
  const ICON_CHECK =
    '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>';
  const ICON_SCHLIESSEN =
    '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M6 6l12 12M18 6L6 18"/></svg>';

  function terminListeHtml(termine) {
    return termine.map(function (t) {
      return (
        '<li class="ws-termin">' +
          '<span class="ws-termin__icon">' + ICON_KALENDER + "</span>" +
          '<span><strong class="ws-termin__datum">' + t.tag + ", " + t.datum + "</strong>" +
          '<span class="ws-termin__zeit">' + t.zeit + "</span></span>" +
        "</li>"
      );
    }).join("");
  }

  /* ---------------------------------------------------------------------- */
  /* 1. Terminlisten + Hinweiskasten                                          */
  /* ---------------------------------------------------------------------- */
  function initTerminListen(termine) {
    document.querySelectorAll("[data-ws-termine]").forEach(function (el) {
      el.innerHTML = terminListeHtml(termine);
    });
    document.querySelectorAll("[data-ws-hinweis]").forEach(function (el) {
      el.hidden = termine.length === 0;
    });
  }

  /* ---------------------------------------------------------------------- */
  /* 2. Pop-up (nur auf Seiten mit <body data-ws-popup>)                      */
  /* ---------------------------------------------------------------------- */
  function popupSchonGeschlossen() {
    try { return window.localStorage.getItem(WORKSHOP.popupKey) === "1"; } catch (e) { return false; }
  }
  function merkePopupGeschlossen() {
    try { window.localStorage.setItem(WORKSHOP.popupKey, "1"); } catch (e) {}
  }

  function initPopup(termine) {
    if (!document.body.hasAttribute("data-ws-popup")) return;
    if (termine.length === 0 || popupSchonGeschlossen()) return;

    const popup = document.createElement("div");
    popup.className = "ws-popup";
    popup.setAttribute("role", "dialog");
    popup.setAttribute("aria-modal", "true");
    popup.setAttribute("aria-labelledby", "ws-popup-titel");
    popup.innerHTML =
      '<div class="ws-popup__backdrop" data-ws-schliessen></div>' +
      '<div class="ws-popup__panel">' +
        '<button type="button" class="ws-popup__close" data-ws-schliessen aria-label="Hinweis schließen">' + ICON_SCHLIESSEN + "</button>" +
        '<p class="ws-popup__kicker">Online-Workshop im Januar</p>' +
        '<h2 id="ws-popup-titel" class="ws-popup__titel">Lerne 5ive kennen</h2>' +
        '<p class="ws-popup__text">Du kannst dir vorstellen, 5ive auch bei dir vor Ort anzubieten? ' +
          "In zwei Stunden geben wir dir online via Zoom einen Einblick in Idee, Konzept und Ablauf. Kostenlos und unverbindlich.</p>" +
        '<ul class="ws-termine">' + terminListeHtml(termine) + "</ul>" +
        '<div class="ws-popup__aktionen">' +
          '<a href="' + WORKSHOP.anmeldeseite + '" class="btn btn-primary" data-ws-anmelden>Jetzt Termin auswählen und anmelden</a>' +
          '<button type="button" class="ws-popup__spaeter" data-ws-schliessen>Später</button>' +
        "</div>" +
      "</div>";

    let vorherFokus = null;

    function schliessen() {
      merkePopupGeschlossen();
      popup.classList.remove("is-open");
      document.documentElement.classList.remove("ws-popup-offen");
      document.removeEventListener("keydown", onKey);
      window.setTimeout(function () { popup.remove(); }, 350);
      if (vorherFokus && typeof vorherFokus.focus === "function") vorherFokus.focus();
    }

    function onKey(e) {
      if (e.key === "Escape") { schliessen(); return; }
      if (e.key !== "Tab") return;
      /* Fokus im Dialog halten */
      const fokussierbar = popup.querySelectorAll("a[href], button");
      const erstes = fokussierbar[0];
      const letztes = fokussierbar[fokussierbar.length - 1];
      if (e.shiftKey && document.activeElement === erstes) { e.preventDefault(); letztes.focus(); }
      else if (!e.shiftKey && document.activeElement === letztes) { e.preventDefault(); erstes.focus(); }
    }

    popup.addEventListener("click", function (e) {
      if (e.target.closest("[data-ws-schliessen]")) schliessen();
      else if (e.target.closest("[data-ws-anmelden]")) merkePopupGeschlossen();
    });

    window.setTimeout(function () {
      vorherFokus = document.activeElement;
      document.body.appendChild(popup);
      document.documentElement.classList.add("ws-popup-offen");
      /* Reflow, damit die Einblend-Transition greift */
      void popup.offsetWidth;
      popup.classList.add("is-open");
      document.addEventListener("keydown", onKey);
      const cta = popup.querySelector("[data-ws-anmelden]");
      if (cta) cta.focus({ preventScroll: true });
    }, WORKSHOP.popupVerzoegerungMs);
  }

  /* ---------------------------------------------------------------------- */
  /* 3. Anmeldeformular                                                       */
  /* ---------------------------------------------------------------------- */
  function initFormular(termine) {
    const form = document.getElementById("workshop-form");
    if (!form) return;

    const auswahl     = document.getElementById("ws-termin-auswahl");
    const feedback    = document.getElementById("ws-feedback");
    const submitBtn   = document.getElementById("ws-submit");
    const submitLabel = document.getElementById("ws-submit-label");
    const spinner     = document.getElementById("ws-spinner");
    const erfolg      = document.getElementById("workshop-erfolg");
    const keineTermine = document.getElementById("workshop-keine-termine");
    const captchaBox  = form.querySelector(".h-captcha");
    const lokalHinweis = document.getElementById("ws-lokal-hinweis");

    if (termine.length === 0) {
      form.hidden = true;
      if (keineTermine) keineTermine.hidden = false;
      return;
    }

    auswahl.innerHTML = termine.map(function (t, i) {
      return (
        '<label class="termin-option">' +
          '<input type="radio" name="termin" value="' + t.id + '"' + (i === 0 ? " required" : "") + " />" +
          '<span class="termin-card">' +
            '<span class="termin-card__check">' + ICON_CHECK + "</span>" +
            '<span class="termin-card__tag">' + t.tag + "</span>" +
            '<span class="termin-card__datum">' + t.datum + "</span>" +
            '<span class="termin-card__zeit">' + t.zeit + "</span>" +
          "</span>" +
        "</label>"
      );
    }).join("");

    if (LOKAL) {
      if (captchaBox) captchaBox.hidden = true;
      if (lokalHinweis) lokalHinweis.hidden = false;
    }

    const emailjsBereit = !LOKAL && !!window.emailjs;
    if (emailjsBereit) {
      try { window.emailjs.init({ publicKey: WORKSHOP.emailjs.publicKey }); } catch (e) {}
    }

    function zeigeFehler(text) {
      feedback.className =
        "form-feedback is-visible mt-6 rounded-2xl border px-5 py-4 text-base font-medium bg-red-50 text-red-700 border-red-200";
      feedback.textContent = text;
      feedback.setAttribute("role", "alert");
    }
    function versteckeFehler() {
      feedback.classList.remove("is-visible");
      feedback.textContent = "";
    }

    function setLaden(laden) {
      submitBtn.disabled = laden;
      submitBtn.classList.toggle("opacity-70", laden);
      submitBtn.classList.toggle("cursor-not-allowed", laden);
      spinner.style.display = laden ? "block" : "none";
      submitLabel.textContent = laden ? "Wird gesendet …" : "Jetzt anmelden";
    }

    function captchaToken() {
      if (window.hcaptcha && typeof window.hcaptcha.getResponse === "function") {
        try { return window.hcaptcha.getResponse(); } catch (e) { return ""; }
      }
      return "";
    }
    function captchaReset() {
      if (window.hcaptcha && typeof window.hcaptcha.reset === "function") {
        try { window.hcaptcha.reset(); } catch (e) {}
      }
    }

    function zeigeErfolg(termin, email) {
      form.hidden = true;
      erfolg.hidden = false;
      erfolg.querySelector("[data-ws-erfolg-termin]").textContent = terminText(termin);
      erfolg.querySelector("[data-ws-erfolg-email]").textContent = email;
      const titel = erfolg.querySelector("h2");
      if (titel) { titel.setAttribute("tabindex", "-1"); titel.focus({ preventScroll: true }); }
      erfolg.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      versteckeFehler();

      const gewaehlt = form.querySelector('input[name="termin"]:checked');
      const termin = gewaehlt
        ? termine.find(function (t) { return t.id === gewaehlt.value; })
        : null;

      const daten = {
        email:     form.email.value.trim(),
        vorname:   form.vorname.value.trim(),
        nachname:  form.nachname.value.trim(),
        einsatz:   form.einsatz.value.trim(),
        anmerkung: form.anmerkung.value.trim(),
      };

      if (!termin) { zeigeFehler("Bitte wähle einen der Termine aus."); return; }
      if (!daten.email || !daten.vorname || !daten.nachname) {
        zeigeFehler("Bitte fülle E-Mail, Vorname und Nachname aus.");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(daten.email)) {
        zeigeFehler("Bitte gib eine gültige E-Mail-Adresse ein.");
        return;
      }
      if (!form.einwilligung.checked) {
        zeigeFehler("Bitte stimme der Verarbeitung deiner Angaben zu.");
        return;
      }

      const token = LOKAL ? "" : captchaToken();
      if (!LOKAL && window.hcaptcha && !token) {
        zeigeFehler("Bitte bestätige, dass du kein Roboter bist.");
        return;
      }

      setLaden(true);

      if (LOKAL) {
        window.setTimeout(function () { setLaden(false); zeigeErfolg(termin, daten.email); }, 700);
        return;
      }

      if (!emailjsBereit) {
        setLaden(false);
        zeigeFehler("Die Anmeldung ist gerade nicht möglich. Bitte schreib uns direkt an " + WORKSHOP.empfaenger + ".");
        return;
      }

      const name = daten.vorname + " " + daten.nachname;
      const nachricht = [
        "Anmeldung zum Kennenlern-Workshop",
        "",
        "Termin: " + terminText(termin),
        "Name: " + name,
        "E-Mail: " + daten.email,
        "",
        "Wo soll 5ive eingesetzt werden?",
        daten.einsatz || "(keine Angabe)",
        "",
        "Fragen, Wünsche, Anmerkungen:",
        daten.anmerkung || "(keine Angabe)",
      ].join("\n");

      try {
        await window.emailjs.send(WORKSHOP.emailjs.serviceId, WORKSHOP.emailjs.templateId, {
          /* Felder des bestehenden Templates (Veranstalter-Anfrage) */
          from_name:  name,
          from_email: daten.email,
          reply_to:   daten.email,
          city:       "Kennenlern-Workshop – " + terminText(termin),
          message:    nachricht,
          to_email:   WORKSHOP.empfaenger,
          /* Einzelfelder für eine eigene Workshop-Vorlage */
          termin:     terminText(termin),
          vorname:    daten.vorname,
          nachname:   daten.nachname,
          einsatzort: daten.einsatz,
          anmerkung:  daten.anmerkung,
          "h-captcha-response": token,
        });
        setLaden(false);
        zeigeErfolg(termin, daten.email);
      } catch (err) {
        console.error("[5ive] Workshop-Anmeldung fehlgeschlagen:", err);
        setLaden(false);
        captchaReset();
        zeigeFehler(
          "Da ist leider etwas schiefgelaufen. Bitte versuche es noch einmal oder schreib uns direkt an " +
          WORKSHOP.empfaenger + "."
        );
      }
    });
  }

  /* ---------------------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", function () {
    const termine = offeneTermine();
    initTerminListen(termine);
    initPopup(termine);
    initFormular(termine);
  });
})();
