/* =========================================================
   انطلاقة — JavaScript
   ========================================================= */
"use strict";

const GOOGLE_CLIENT_ID =
  "701885546320-r5jns8fotg6bkt8mbovrde0dip5vvt8d.apps.googleusercontent.com";
const APPLY_EMAIL = "schoollof105@gmail.com";

const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const root = document.documentElement;

const MSG = {
  welcome: "أهلًا بك، ",
  signedIn: "تم تسجيل الدخول بنجاح",
  signInError: "تعذّر تسجيل الدخول. حاول مرة أخرى.",
  redirect: "جارٍ فتح تسجيل الدخول بحساب جوجل...",
  gsiBlocked: "لم يظهر تسجيل الدخول. تحقق من إعدادات المتصفح وحاول مجددًا.",
  gsiLoadError: "تعذّر تحميل خدمة تسجيل الدخول من جوجل.",
  noResults: "لم يتم العثور على نتائج مطابقة.",
  emptySearch: "اكتب كلمة للبحث أولًا.",
  required: "يرجى تعبئة الحقول المطلوبة (*).",
  mailOpening: "جارٍ فتح تطبيق البريد... لا تنسَ إرفاق 3 إلى 5 صور."
};

const status = $("#status");
const setStatus = text => { if (status) status.textContent = text; };

/* ---------- Google Sign-In ---------- */
function parseJwt(token) {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map(c => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function handleCredentialResponse(response) {
  const payload = response?.credential ? parseJwt(response.credential) : null;
  if (payload?.name) setStatus(MSG.welcome + payload.name);
  else if (response?.credential) setStatus(MSG.signedIn);
  else setStatus(MSG.signInError);
}

function initGoogleAuth() {
  if (!window.google?.accounts?.id) return false;
  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleCredentialResponse
  });
  return true;
}

function requestGoogleSignIn() {
  setStatus(MSG.redirect);
  if (!window.google?.accounts?.id) return setStatus(MSG.signInError);

  window.google.accounts.id.prompt(n => {
    if (n.isNotDisplayed?.() || n.isSkippedMoment?.()) setStatus(MSG.gsiBlocked);
  });
}

/* ---------- Theme toggle ---------- */
function initThemeToggle() {
  const btn = $("#theme");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const wasDark = root.dataset.theme === "dark";
    root.dataset.theme = wasDark ? "light" : "dark";
    btn.setAttribute("aria-label", wasDark ? "تفعيل الوضع الداكن" : "تفعيل الوضع الفاتح");
    btn.setAttribute("aria-pressed", String(!wasDark));
  });
}

/* ---------- Single-page navigation ---------- */
let navigateTo = () => {};

function initRouter() {
  const links = $$(".nav a[data-page]");
  const pages = $$(".page-view");
  if (!links.length || !pages.length) return;

  navigateTo = (pageId, { scroll = true } = {}) => {
    const target = document.getElementById(pageId);
    const active = target?.classList.contains("page-view")
      ? target
      : document.getElementById("page-home");

    pages.forEach(p => {
      const on = p === active;
      p.classList.toggle("active", on);
      p.hidden = !on;
    });

    links.forEach(a => {
      if (a.dataset.page === active.id) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });

    if (scroll) window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // يدعم صفحات مو موجودة في القائمة مثل #learn
  const pageFromHash = () => {
    const hash = location.hash.slice(1);
    const link = links.find(a => a.getAttribute("href") === "#" + hash);
    if (link) return link.dataset.page;
    return document.getElementById("page-" + hash) ? "page-" + hash : "page-home";
  };

  const go = (pageId, hash) => {
    navigateTo(pageId);
    if (hash && location.hash !== hash) history.pushState({ pageId }, "", hash);
  };

  links.forEach(a =>
    a.addEventListener("click", e => {
      e.preventDefault();
      go(a.dataset.page, a.getAttribute("href"));
    })
  );

  // أي رابط فيه data-go="اسم_الصفحة" يفتح الصفحة (مثل البانر وزر التقديم)
  $$("[data-go]").forEach(a =>
    a.addEventListener("click", e => {
      e.preventDefault();
      go("page-" + a.dataset.go, "#" + a.dataset.go);
    })
  );

  $(".brand")?.addEventListener("click", e => {
    e.preventDefault();
    go("page-home", "#home");
  });

  window.addEventListener("popstate", () => navigateTo(pageFromHash(), { scroll: false }));
  navigateTo(pageFromHash(), { scroll: false });
}

/* ---------- Search ---------- */
function initSearch() {
  const form = $(".search");
  const input = $("#q");
  if (!form || !input) return;

  form.addEventListener("submit", e => {
    e.preventDefault();
    const query = input.value.trim().toLocaleLowerCase("ar");

    if (!query) {
      navigateTo("page-home");
      setStatus(MSG.emptySearch);
      input.focus();
      return;
    }

    // أولًا: ابحث في الأسر المنتجة (الأقسام والمتاجر)
    const hits = window.searchFamilies?.(input.value.trim()) ?? 0;
    if (hits) {
      $('.nav a[data-page="page-about"]').click();
      setStatus(`تم العثور على ${hits} نتيجة في الأسر المنتجة`);
      return;
    }

    const match = $$(".page-view").find(p =>
      p.textContent.toLocaleLowerCase("ar").includes(query)
    );

    if (!match) {
      navigateTo("page-home");
      setStatus(MSG.noResults);
      return;
    }

    const link = $$(".nav a[data-page]").find(a => a.dataset.page === match.id);
    if (link) {
      link.click();
      setStatus(`تم العثور على نتائج في: ${link.textContent.trim()}`);
    } else {
      navigateTo(match.id);
      setStatus("تم العثور على نتائج");
    }
  });
}

/* ---------- Apply form (opens mail app) ---------- */
function initApplyForm() {
  const form = $("#applyForm");
  const note = $("#applyStatus");
  if (!form) return;

  const val = id => $("#" + id, form).value.trim();
  const say = (text, isError = false) => {
    note.textContent = text;
    note.classList.toggle("error", isError);
  };

  $$("input, textarea", form).forEach(el =>
    el.addEventListener("input", () => el.classList.remove("invalid"))
  );

  form.addEventListener("submit", e => {
    e.preventDefault();

    const required = ["storeAr", "contact"];
    const missing = required.filter(id => !val(id));
    required.forEach(id => $("#" + id, form).classList.toggle("invalid", missing.includes(id)));

    if (missing.length) {
      say(MSG.required, true);
      $("#" + missing[0], form).focus();
      return;
    }

    const subject = encodeURIComponent("بيانات متجر جديد");
    const body = encodeURIComponent(
      `اسم المتجر بالعربي: ${val("storeAr")}\n` +
      `Store Name in English: ${val("storeEn")}\n` +
      `رابط الحساب / رقم التواصل: ${val("contact")}\n\n` +
      `وصف المبيعات:\n${val("description")}\n\n` +
      `--------------------\n` +
      `(تذكير: يرجى إرفاق 3 إلى 5 صور للمشروع مع هذه الرسالة)`
    );

    say(MSG.mailOpening);
    window.location.href = `mailto:${APPLY_EMAIL}?subject=${subject}&body=${body}`;
  });
}

/* ---------- Header shadow on scroll ---------- */
function initHeaderShadow() {
  const header = $(".top");
  if (!header) return;
  const update = () => header.classList.toggle("scrolled", window.scrollY > 8);
  window.addEventListener("scroll", update, { passive: true });
  update();
}

/* ---------- Init ---------- */
function init() {
  initThemeToggle();
  initRouter();
  initSearch();
  initApplyForm();
  initHeaderShadow();

  $("#ms")?.addEventListener("click", requestGoogleSignIn);

  if (!initGoogleAuth()) {
    const gsi = $('script[src*="accounts.google.com/gsi/client"]');
    gsi?.addEventListener("load", initGoogleAuth, { once: true });
    gsi?.addEventListener("error", () => setStatus(MSG.gsiLoadError), { once: true });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
