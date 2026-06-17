/* ==========================================================================
   5ive – events.js
   Lädt Veranstaltungen live aus Supabase.
   ========================================================================== */

const SUPABASE_URL      = "https://udsdjxdgkipwpyhtajpu.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_dPgoMpQWZOn0UdsRoFiOuA_X032iI50";

(function () {
  "use strict";

  const list     = document.getElementById("events-list");
  const skeleton = document.getElementById("events-skeleton");
  const stateEmpty = document.getElementById("events-empty");
  const stateError = document.getElementById("events-error");
  if (!list) return;

  function escapeHtml(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function setState(state) {
    if (skeleton)    skeleton.style.display    = state === "loading" ? "grid" : "none";
    if (stateEmpty)  stateEmpty.style.display  = state === "empty"   ? "block" : "none";
    if (stateError)  stateError.style.display  = state === "error"   ? "block" : "none";
    list.style.display = state === "ready" ? "grid" : "none";
  }

  /* SVG-Icons (inline, kein externe Abhängigkeit) */
  const iconPin = `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0 mt-0.5" style="color:var(--green)" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"/><circle cx="12" cy="11" r="2.5"/></svg>`;
  const iconCal = `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0 mt-0.5" style="color:var(--green)" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;

  function renderCard(ev, index) {
    const card = document.createElement("article");
    card.className = "event-card-v2 reveal p-6 md:p-8 flex flex-col gap-4";
    card.setAttribute("data-delay", String(index % 3));

    card.innerHTML = `
      <div>
        <h3 class="font-display font-bold text-xl text-ink">${escapeHtml(ev.city)}</h3>
        <div class="mt-4 space-y-2.5">
          <div class="flex items-start gap-2.5 text-sm" style="color:var(--ink-soft)">
            ${iconPin}
            <span class="leading-snug">${escapeHtml(ev.venue)}</span>
          </div>
          <div class="flex items-start gap-2.5 text-sm" style="color:var(--ink-soft)">
            ${iconCal}
            <span class="leading-snug">${escapeHtml(ev.date)}</span>
          </div>
        </div>
      </div>
      <div class="mt-auto pt-4 border-t" style="border-color:var(--cream)">
        <div class="text-[0.6rem] font-semibold uppercase tracking-widest mb-1" style="color:var(--green)">Veranstalter</div>
        <div class="text-xs font-medium" style="color:var(--ink-soft)">${escapeHtml(ev.organizer_name)}</div>
        <a href="mailto:${escapeHtml(ev.contact_info)}"
           class="text-xs font-semibold mt-1 inline-flex items-center gap-1 hover:underline"
           style="color:var(--green)">
          ${escapeHtml(ev.contact_info)}
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
        </a>
      </div>
    `;
    return card;
  }

  function revealNew(nodes) {
    if (!("IntersectionObserver" in window)) {
      nodes.forEach(function (n) { n.classList.add("is-visible"); });
      return;
    }
    const obs = new IntersectionObserver(function (entries, o) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); o.unobserve(e.target); }
      });
    }, { threshold: 0.1 });
    nodes.forEach(function (n) { obs.observe(n); });
  }

  async function loadEvents() {
    setState("loading");

    if (!window.supabase || !window.supabase.createClient) {
      setState("error");
      return;
    }

    try {
      const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const { data, error } = await client
        .from("events")
        .select("id, city, venue, date, organizer_name, contact_info")
        .order("id", { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        setState("empty");
        return;
      }

      list.innerHTML = "";
      const nodes = data.map(renderCard);
      nodes.forEach(function (n) { list.appendChild(n); });
      setState("ready");
      revealNew(nodes);
    } catch (err) {
      console.error("[5ive] Fehler beim Laden der Veranstaltungen:", err);
      setState("error");
    }
  }

  document.addEventListener("DOMContentLoaded", loadEvents);
})();
