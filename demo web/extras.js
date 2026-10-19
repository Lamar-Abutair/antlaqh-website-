/* الأسر المنتجة (تمرير عمودي مثل انستغرام + أقسام + بحث) + حاسبة التسعير */
(function () {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const norm = s => (s || "").toLocaleLowerCase("ar");

  /* ---------- Families feed ---------- */
  const chips = $("#chips"), find = $("#famSearch"), count = $("#famCount"),
        layout = $(".fam-layout");

  if (layout && chips && typeof FAMILIES !== "undefined") {
    // نحذف القديم (الباجر والـQR) ونحط مكانه الفيد
    layout.className = "reel-wrap";
    layout.innerHTML = `<div class="reel" id="reel" aria-live="polite"></div>`;
    const reel = $("#reel");
    // نافذة عرض الصورة كاملة
    const box = document.createElement("div");
    box.className = "lightbox"; box.hidden = true;
    box.innerHTML = '<button type="button" class="lb-x" aria-label="إغلاق">✕</button><img alt="">';
    document.body.append(box);
    const closeBox = () => { box.hidden = true; document.body.style.overflow = ""; };
    const openBox = (src, alt) => {
      const im = box.querySelector("img"); im.src = src; im.alt = alt || "";
      box.hidden = false; document.body.style.overflow = "hidden";
    };
    box.addEventListener("click", closeBox);
    document.addEventListener("keydown", e => { if (e.key === "Escape") closeBox(); });

    const liked = new Set();
    // Demo reviews are stored per visitor; public reviews require a database.
    const reviewKey = name => "antlaqh-reviews:" + name;
    const readReviews = name => {
      try {
        const saved = JSON.parse(localStorage.getItem(reviewKey(name)) || "[]");
        return Array.isArray(saved) ? saved.slice(0, 30) : [];
      } catch { return []; }
    };
    const safeText = text => String(text).replace(/[&<>"']/g, char =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
    const reviewsHTML = name => {
      const reviews = readReviews(name);
      const entries = reviews.map(r =>
        '<div class="review-item"><strong>' + "★".repeat(r.rating) + "☆".repeat(5-r.rating) +
        '</strong><p>' + safeText(r.text) + '</p></div>').join("");
      return '<section class="customer-reviews"><h3>تقييمات العملاء</h3>' +
        '<p class="review-note">التقييمات محفوظة على جهازك فقط حاليًا.</p>' +
        '<div class="review-list">' + (entries || '<p class="review-empty">كوني أول من يكتب تقييمًا لهذا المتجر.</p>') + '</div>' +
        '<form class="review-form"><label>تقييمك<select name="rating" required>' +
        '<option value="">اختاري عدد النجوم</option>' +
        [5,4,3,2,1].map(n => '<option value="' + n + '">' + "★".repeat(n) + ' (' + n + ')</option>').join("") +
        '</select></label><label>اكتبي رأيك<textarea name="review" required minlength="3" maxlength="500" rows="3" placeholder="كيف كانت تجربتك مع المتجر؟"></textarea></label>' +
        '<button type="submit">إرسال التقييم</button></form></section>';
    };

    let cat = "all", term = "";

    const art = f => "data:image/svg+xml," + encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${f.c1 || "#6B46B8"}"/><stop offset="1" stop-color="${f.c2 || "#C9A24B"}"/></linearGradient></defs><rect width="400" height="400" fill="url(#g)"/><text x="200" y="240" font-size="150" text-anchor="middle">${f.icon || "🛍️"}</text></svg>`);

    function renderChips() {
      const mk = (key, label, n) =>
        `<button type="button" class="chip" data-cat="${key}" aria-pressed="${cat === key}">${label} <small>${n}</small></button>`;
      chips.innerHTML = mk("all", "الكل", FAMILIES.length) +
        Object.entries(CATEGORIES).map(([k, v]) =>
          mk(k, v, FAMILIES.filter(f => f.cat === k).length)).join("");
    }

    const isVid = p => /\.(mp4|mov|m4v|webm)(\?|$)/i.test(p);
    const gallery = f => {
      const pics = (f.images && f.images.length ? f.images : [f.image]).filter(Boolean);
      const items = [...(f.video ? [[f.video, "video"]] : []), ...pics.map(p => [p, isVid(p) ? "video" : "img"])];
      const el = ([src, kind]) => kind === "video"
        ? `<video controls playsinline preload="metadata"><source src="${src}" type="${/\.webm/i.test(src) ? "video/webm" : "video/mp4"}"></video>`
        : `<img src="${src}" alt="منتجات ${f.name}" loading="lazy">`;
      if (!items.length) return `<img class="post-img" src="${art(f)}" alt="منتجات ${f.name}">`;
      if (items.length === 1 && items[0][1] === "img") return `<img class="post-img" src="${pics[0]}" alt="منتجات ${f.name}" loading="lazy">`;
      const nav = items.length > 1 ? `
        <button type="button" class="g-btn prev" data-dir="prev" aria-label="السابق">›</button>
        <button type="button" class="g-btn next" data-dir="next" aria-label="التالي">‹</button>
        <span class="count">1 / ${items.length}</span>` : "";
      return `<div class="gallery"><div class="slides">${items.map(el).join("")}</div>${nav}</div>`;
    };

    const postHTML = f => {
      const on = liked.has(f.name);
      return `
      <article class="post" data-name="${f.name}">
        <header class="post-head">
          <div><b>${f.name}</b><small>${f.handle || ""}</small></div>
          <span class="tag">${CATEGORIES[f.cat] || ""}</span>
        </header>
        ${gallery(f)}
        <div class="post-actions">
          <button type="button" class="act like${on ? " on" : ""}" aria-pressed="${on}" aria-label="إعجاب">${on ? "♥" : "♡"}</button>
          <button type="button" class="act share" aria-label="مشاركة">⤴</button>
        </div>
        <div class="post-body">
          <p><b>${f.name}</b> ${f.desc}</p>
          <a class="btn-link" href="${f.link}" target="_blank" rel="noopener">زيارة المتجر</a>
        </div>
        ${reviewsHTML(f.name)}
      </article>`;
    };

    function filter() {
      const list = FAMILIES.filter(f =>
        (cat === "all" || f.cat === cat) &&
        norm([f.name, f.handle, f.desc, CATEGORIES[f.cat], (f.tags || []).join(" ")].join(" ")).includes(norm(term)));
      count.textContent = term || cat !== "all" ? list.length + " نتيجة" : "";
      reel.innerHTML = list.length
        ? list.map(postHTML).join("")
        : `<p class="empty">ما لقينا أسرة مطابقة، جرّبي كلمة ثانية أو قسم آخر.</p>`;
      return list.length;
    }

    chips.addEventListener("click", e => {
      const b = e.target.closest(".chip"); if (!b) return;
      cat = b.dataset.cat; renderChips(); filter();
    });
    find.addEventListener("input", () => { term = find.value.trim(); filter(); });

    reel.addEventListener("click", e => {
      const post = e.target.closest(".post"); if (!post) return;
      const nav = e.target.closest(".g-btn");
      if (nav) {
        const sl = nav.parentElement.querySelector(".slides");
        const d = getComputedStyle(sl).direction === "rtl" ? -1 : 1;
        sl.scrollBy({ left: (nav.dataset.dir === "next" ? 1 : -1) * d * sl.clientWidth, behavior: "smooth" });
        return;
      }
      const pic = e.target.closest(".post-img, .slides img");
      if (pic) { openBox(pic.src, pic.alt); return; }
      const f = FAMILIES.find(x => x.name === post.dataset.name); if (!f) return;
      const like = e.target.closest(".like"), share = e.target.closest(".share");
      if (like) {
        liked.has(f.name) ? liked.delete(f.name) : liked.add(f.name);
        const on = liked.has(f.name);
        like.classList.toggle("on", on); like.setAttribute("aria-pressed", on);
        like.textContent = on ? "♥" : "♡";
      }
      if (share) {
        if (navigator.share) navigator.share({ title: f.name, url: f.link }).catch(() => {});
        else navigator.clipboard?.writeText(f.link).then(() => {
          share.textContent = "✓"; setTimeout(() => (share.textContent = "⤴"), 1500);
        });
      }
    });


    reel.addEventListener("submit", e => {
      const form = e.target.closest(".review-form");
      if (!form) return;
      e.preventDefault();
      const post = form.closest(".post");
      const rating = Number(form.elements.rating.value);
      const review = form.elements.review.value.trim();
      if (!post || !Number.isInteger(rating) || rating < 1 || rating > 5 || review.length < 3 || review.length > 500) return;
      const name = post.dataset.name;
      const reviews = readReviews(name);
      reviews.unshift({ rating, text: review });
      try {
        localStorage.setItem(reviewKey(name), JSON.stringify(reviews.slice(0, 30)));
        post.querySelector(".customer-reviews").outerHTML = reviewsHTML(name);
      } catch {
        alert("تعذّر حفظ التقييم على هذا الجهاز.");
      }
    });

    // عدّاد الصور 1 / 3
    reel.addEventListener("scroll", e => {
      const sl = e.target;
      if (!sl.classList || !sl.classList.contains("slides")) return;
      const k = Math.round(Math.abs(sl.scrollLeft) / sl.clientWidth);
      const c = sl.parentElement.querySelector(".count");
      if (c) c.textContent = (k + 1) + " / " + sl.children.length;
    }, true);

    // يستخدمها شريط البحث العلوي
    window.searchFamilies = t => {
      cat = "all"; term = t; find.value = t; renderChips();
      const n = filter();
      if (!n) { term = ""; find.value = ""; filter(); }
      return n;
    };

    renderChips(); filter();
  }

  /* ---------- Pricing calculator ---------- */
  const form = $("#priceForm");
  if (form) {
    const n = id => parseFloat($("#" + id).value) || 0;
    const r = x => (Math.round(x * 100) / 100).toLocaleString("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const calc = () => {
      const pieces = Math.max(n("pc"), 1);
      const total = n("mat") + n("pack") + n("oth") + n("hrs") * n("wage");
      const cost = total / pieces;
      const fee = Math.min(n("fee"), 90) / 100;
      const price = Math.ceil((cost * (1 + n("mar") / 100) / (1 - fee)) * 2) / 2;
      const profit = price * (1 - fee) - cost;
      $("#rTotal").textContent = r(total) + " ريال";
      $("#rCost").textContent = r(cost) + " ريال";
      $("#rPrice").textContent = r(price) + " ريال";
      $("#rProfit").textContent = r(profit) + " ريال";
      $("#rAll").textContent = r(profit * pieces) + " ريال";
    };
    form.addEventListener("input", calc);
    form.addEventListener("submit", e => e.preventDefault());
    calc();
  }
})();
