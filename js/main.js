/* ==========================================================================
   5ive – main.js (Vorschlag3)
   Globale Interaktionen: Mobile-Nav, Scroll-Reveal, aktiver Nav-Link,
   Video-Fallback, Header-Schatten, TopicShowcase, Hero-Fragen-Rotation.
   ========================================================================== */

(function () {
  "use strict";

  /* ---------------------------------------------------------------------- */
  /* 1. Mobile-Navigation                                                     */
  /* ---------------------------------------------------------------------- */
  function initNav() {
    const toggle = document.querySelector("[data-nav-toggle]");
    const menu   = document.querySelector("[data-mobile-menu]");
    if (!toggle || !menu) return;

    toggle.addEventListener("click", function () {
      const open = menu.classList.toggle("is-open");
      toggle.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        menu.classList.remove("is-open");
        toggle.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------------------------------------------------------------------- */
  /* 2. Aktiven Nav-Link markieren                                            */
  /* ---------------------------------------------------------------------- */
  function initActiveLink() {
    const path = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll("[data-nav-link]").forEach(function (link) {
      const href = link.getAttribute("href");
      if (href === path || (path === "" && href === "index.html")) {
        link.classList.add("is-active");
      }
    });
  }

  /* ---------------------------------------------------------------------- */
  /* 3. Scroll-Reveal via IntersectionObserver                               */
  /* ---------------------------------------------------------------------- */
  function initReveal() {
    const els = document.querySelectorAll(".reveal");
    if (!els.length) return;

    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    const observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    els.forEach(function (el) { observer.observe(el); });
  }

  /* ---------------------------------------------------------------------- */
  /* 4. Header-Schatten beim Scrollen                                         */
  /* ---------------------------------------------------------------------- */
  function initHeaderShadow() {
    const header = document.querySelector("[data-header]");
    if (!header) return;
    const onScroll = function () {
      if (window.scrollY > 12) {
        header.classList.add("shadow-md", "bg-white/95");
        header.classList.remove("bg-white/70");
      } else {
        header.classList.remove("shadow-md", "bg-white/95");
        header.classList.add("bg-white/70");
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------------------------------------------------------------------- */
  /* 5. Video-Fallback                                                        */
  /* ---------------------------------------------------------------------- */
  function initVideoFallback() {
    document.querySelectorAll("[data-video]").forEach(function (video) {
      function showFallback() {
        const fb = video.parentElement.querySelector(".video-fallback");
        if (fb) {
          video.style.display = "none";
          fb.style.display = "flex";
        }
      }
      video.addEventListener("error", showFallback);
      video.querySelectorAll("source").forEach(function (src) {
        src.addEventListener("error", function () { showFallback.call(video); });
      });
    });
  }

  /* ---------------------------------------------------------------------- */
  /* 6. Aktuelles Jahr im Footer                                              */
  /* ---------------------------------------------------------------------- */
  function initYear() {
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  /* ---------------------------------------------------------------------- */
  /* 7. Hero-Frage rotieren                                                   */
  /* ---------------------------------------------------------------------- */
  function initHeroRotation() {
    const el = document.getElementById("hero-question");
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const questions = [
      "Was macht mein Leben reich?",
      "Gibt es mehr als das, was ich sehe?",
      "Kann ich wirklich frei sein?",
      "Wer bin ich wirklich?",
      "Wie lebe ich, dass Leben gelingt?",
    ];
    let i = 0;

    setInterval(function () {
      el.style.opacity = "0";
      setTimeout(function () {
        i = (i + 1) % questions.length;
        el.textContent = questions[i];
        el.style.opacity = "1";
      }, 500);
    }, 4200);
  }

  /* ---------------------------------------------------------------------- */
  /* 8. Topic Showcase (interaktiver Themenzyklus)                            */
  /* ---------------------------------------------------------------------- */
  function initTopicShowcase() {
    const buttons = document.querySelectorAll("[data-topic]");
    const panels  = document.querySelectorAll("[data-topic-panel]");
    if (!buttons.length || !panels.length) return;

    function activate(id) {
      buttons.forEach(function (btn) {
        btn.classList.toggle("topic-btn--active", btn.getAttribute("data-topic") === id);
      });
      panels.forEach(function (panel) {
        const match = panel.getAttribute("data-topic-panel") === id;
        panel.classList.toggle("is-active", match);
      });
    }

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        activate(btn.getAttribute("data-topic"));
      });
    });

    // Ersten Eintrag vorauswählen
    if (buttons[0]) activate(buttons[0].getAttribute("data-topic"));
  }

  /* ---------------------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initActiveLink();
    initReveal();
    initHeaderShadow();
    initVideoFallback();
    initYear();
    initHeroRotation();
    initTopicShowcase();
  });
})();
