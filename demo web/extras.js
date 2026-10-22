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
    const likeTotals = new Map();
    let visitorId;
    try {
      visitorId = localStorage.getItem("antlaqh:visitor-id");
      if (!visitorId || !/^[0-9a-f-]{36}$/i.test(visitorId)) {
        visitorId = crypto.randomUUID();
        localStorage.setItem("antlaqh:visitor-id",visitorId);
      }
    } catch { visitorId = null; }
    const likeKey = name => "antlaqh:liked:" + encodeURIComponent(name);
    const hasLiked = name => {
      try { return localStorage.getItem(likeKey(name)) === "1"; }
      catch { return liked.has(name); }
    };
    // Public reviews via Supabase REST API. Only a publishable/anon key belongs in config.
    const config = window.ANTLAQH_SUPABASE || {};
    const supabaseReady = /^https:\/\/[^/]+\.supabase\.co\/?$/.test(config.url || "") &&
      typeof config.anonKey === "string" && config.anonKey.length > 10;
    const reviewCache = new Map();
    const safeText = value => String(value).replace(/[&<>"']/g, char =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
    const api = (path, options = {}) => fetch(config.url.replace(/\/$/, "") + "/rest/v1/" + path, {
      ...options,
      headers: { apikey: config.anonKey, Authorization: "Bearer " + config.anonKey,
        "Content-Type": "application/json", ...options.headers }
    }).then(async response => {
      if (!response.ok) throw new Error("Supabase request failed: " + response.status);
      const body = await response.text(); return body ? JSON.parse(body) : null;
    });
    const limitKey = name => "antlaqh:review-count:v1:" + encodeURIComponent(name);
    const reviewCount = name => { try { return Math.max(0, Number(localStorage.getItem(limitKey(name))) || 0); } catch { return 3; } };
    const saveCount = (name,count) => { try { localStorage.setItem(limitKey(name),String(count)); return true; } catch { return false; } };
    const limitMessage = "لقد وصلت إلى الحد الأقصى للتعليقات (3 تعليقات لهذا المتجر).";
    const loadLikeTotals = async () => {
      if (!supabaseReady) return;
      try {
        const rows = await api("store_like_totals?select=business_name,like_count");
        for (const row of rows) likeTotals.set(row.business_name,Number(row.like_count)||0);
        document.querySelectorAll("#reel .post").forEach(post => {
          const count=post.querySelector(".like-count");
          if(count)count.textContent=String(likeTotals.get(post.dataset.name)||0);
        });
      } catch(error) { console.error("Unable to load like totals",error); }
    };
    const reviewItem = r => '<div class="review-item"><strong>' + safeText(r.customer_name) + '</strong> <span class="review-stars">' + "★".repeat(r.rating) + "☆".repeat(5-r.rating) + '</span><p>' + safeText(r.comment) + '</p></div>';
    const reviewsHTML = name => {
      const reviews = reviewCache.get(name) || [];
      if (!reviews.length) return '<section class="customer-reviews" aria-label="تقييمات العملاء"></section>';
      const first = reviewItem(reviews[0]);
      
      return '<section class="customer-reviews" aria-label="تقييمات العملاء"><div class="review-list">'+first+'</div>' +
        (reviews.length>1 ? '<button type="button" class="review-more-open">إظهار المزيد ('+(reviews.length-1)+') ⌄</button>' : '') + '</section>';
    };
    const popupHTML = name => {
      const form = supabaseReady ? '<form class="review-form"><label>اسمك<input name="customer_name" type="text" required minlength="2" maxlength="60" autocomplete="name" placeholder="اكتبي اسمك"></label><label>تقييمك<select name="rating" required><option value="">اختاري عدد النجوم</option>' +
        [5,4,3,2,1].map(n=>'<option value="'+n+'">'+ "★".repeat(n) +' ('+n+')</option>').join("") +
        '</select></label><label>تعليقك (اختياري)<textarea name="review" maxlength="500" rows="3" placeholder="كيف كانت تجربتك مع المتجر؟"></textarea></label><button type="submit">إرسال التقييم</button><p class="review-status" role="status" aria-live="polite"></p></form>' : '<p class="review-note">التقييمات غير متاحة مؤقتًا.</p>';
      return '<div class="review-dialog-backdrop"><section class="review-dialog" role="dialog" aria-modal="true" aria-label="أضف تعليقًا"><header><h3>أضف تعليقًا</h3><button type="button" class="review-close" aria-label="إغلاق">✕</button></header><div class="review-dialog-compose">'+form+'</div></section></div>';
    };
    const allReviewsHTML = name => {
      const reviews = reviewCache.get(name) || [];
      return '<div class="review-dialog-backdrop"><section class="review-dialog" role="dialog" aria-modal="true" aria-label="تعليقات '+safeText(name)+'"><header><h3>تعليقات '+safeText(name)+'</h3><button type="button" class="review-close" aria-label="إغلاق">✕</button></header><div class="review-dialog-list">'+reviews.map(reviewItem).join("")+'</div></section></div>';
    };
    const showAllReviews = name => {
      dismissReview();
      document.body.insertAdjacentHTML("beforeend",allReviewsHTML(name));
      document.body.classList.add("reviews-modal-open");
      document.querySelector(".review-close")?.focus();
    };
    const dismissReview = () => {
      const dialog = document.querySelector(".review-dialog-backdrop");
      if (dialog) dialog.remove();
      document.body.classList.remove("reviews-modal-open");
    };
    const showReview = name => {
      dismissReview();
      document.body.insertAdjacentHTML("beforeend",popupHTML(name));
      document.querySelector(".review-dialog").dataset.businessName=name;
      document.body.classList.add("reviews-modal-open");
      if (reviewCount(name)>=3) { const form=document.querySelector(".review-dialog .review-form"); if(form){form.querySelector('[type="submit"]').disabled=true;form.querySelector(".review-status").textContent=limitMessage;} }
      document.querySelector(".review-close")?.focus();
    };
    document.addEventListener("click",e=>{
      if (e.target.matches(".review-dialog-backdrop, .review-close")) dismissReview();
    });
    document.addEventListener("keydown",e=>{if(e.key==="Escape")dismissReview();});
    const refreshReviews = async () => {
      if (!supabaseReady) return;
      try {
        const records = await api("reviews?select=business_name,customer_name,rating,comment&approved=eq.true&order=created_at.desc&limit=500");
        reviewCache.clear();
        for (const review of records) {
          if (!reviewCache.has(review.business_name)) reviewCache.set(review.business_name, []);
          reviewCache.get(review.business_name).push(review);
        }
        document.querySelectorAll("#reel .post").forEach(post => {
          const section = post.querySelector(".customer-reviews");
          if (section && !section.querySelector(".review-form :focus")) section.outerHTML = reviewsHTML(post.dataset.name);
        });
      } catch (error) { console.error("Unable to load reviews", error); }
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

    const isVid = p => /\\.(mp4|mov|m4v|webm)(\\?|$)/i.test(p);
    const gallery = f => {
      const pics = (f.images && f.images.length ? f.images : [f.image]).filter(Boolean);
      const hasVideo = Boolean(f.video) || pics.some(isVid);
      if (hasVideo) {
        const items = [...(f.video ? [[f.video, "video"]] : []), ...pics.map(p => [p, isVid(p) ? "video" : "img"])];
        const el = ([src, kind]) => kind === "video"
          ? `<video controls playsinline preload="metadata"><source src="${src}" type="${/\\.webm/i.test(src) ? "video/webm" : "video/mp4"}"></video>`
          : `<img src="${src}" alt="منتجات ${f.name}" loading="lazy">`;
        return `<div class="gallery"><div class="slides">${items.map(el).join("")}</div>${items.length > 1 ? `<button type="button" class="g-btn prev" data-dir="prev" aria-label="السابق">›</button><button type="button" class="g-btn next" data-dir="next" aria-label="التالي">‹</button><span class="count">1 / ${items.length}</span>` : ""}</div>`;
      }
      if (f.name !== "تصاميم بلومي") {
        if (!pics.length) return `<img class="post-img" src="${art(f)}" alt="منتجات ${f.name}">`;
        if (pics.length === 1) return `<img class="post-img" src="${pics[0]}" alt="منتجات ${f.name}" loading="lazy">`;
        return `<div class="gallery"><div class="slides">${pics.map(src=>`<img src="${src}" alt="منتجات ${f.name}" loading="lazy">`).join("")}</div><button type="button" class="g-btn prev" data-dir="prev" aria-label="السابق">›</button><button type="button" class="g-btn next" data-dir="next" aria-label="التالي">‹</button><span class="count">1 / ${pics.length}</span></div>`;
      }
      if (!pics.length) return `<img class="post-img" src="${art(f)}" alt="منتجات ${f.name}">`;
      if (pics.length === 1) return `<img class="post-img" src="${pics[0]}" alt="منتجات ${f.name}" loading="lazy">`;
      return `<div class="gallery fade-gallery" data-current="0"><div class="slides">${pics.map((src,i)=>isVid(src)
        ? `<video src="${src}" muted autoplay playsinline preload="metadata" class="${i===0?"active":""}" aria-hidden="${i!==0}"></video>`
        : `<img src="${src}" alt="منتجات ${f.name} - الصورة ${i+1}" loading="lazy" class="${i===0?"active":""}" aria-hidden="${i!==0}">`).join("")}</div><button type="button" class="g-btn prev" data-dir="prev" aria-label="السابق">›</button><button type="button" class="g-btn next" data-dir="next" aria-label="التالي">‹</button><span class="count">1 / ${pics.length}</span></div>`;
    };
    const showFade = (g, index) => {
      const items = [...g.querySelectorAll(".slides > img, .slides > video")];
      if (!items.length) return;
      const i = ((index % items.length) + items.length) % items.length;
      items.forEach((item,n) => {
        item.classList.toggle("active",n===i);
        item.setAttribute("aria-hidden",String(n!==i));
        if (item.tagName === "VIDEO") {
          if(n!==i) { item.pause(); item.currentTime=0; }
          else { item.currentTime=0; item.play().catch(()=>{}); }
        }
      });
      g.dataset.current=String(i);
      g.dataset.nextAt=String(Date.now()+(items[i].tagName==="VIDEO"?13000:3000));
      g.querySelector(".count").textContent=`${i+1} / ${items.length}`;
    };
    setInterval(() => {
      if (document.hidden || !box.hidden) return;
      reel.querySelectorAll(".fade-gallery").forEach(g => {
        if (Date.now() < Number(g.dataset.pauseUntil||0)) return;
        if (!g.dataset.nextAt) { g.dataset.nextAt=String(Date.now()+3000); return; }
        if (Date.now() >= Number(g.dataset.nextAt)) showFade(g,Number(g.dataset.current||0)+1);
      });
    },250);
    reel.addEventListener("touchstart", e => {
      const g=e.target.closest(".fade-gallery");
      if(g) g.dataset.touchX=String(e.touches[0].clientX);
    },{passive:true});
    reel.addEventListener("touchend", e => {
      const g=e.target.closest(".fade-gallery");
      if(!g || !g.dataset.touchX) return;
      const dx=e.changedTouches[0].clientX-Number(g.dataset.touchX);
      delete g.dataset.touchX;
      if(Math.abs(dx)<40)return;
      showFade(g,Number(g.dataset.current||0)+(dx>0?1:-1));
      g.dataset.pauseUntil=String(Date.now()+9000);
    },{passive:true});

    const postHTML = f => {
      const on = hasLiked(f.name);
      return `
      <article class="post" data-name="${f.name}">
        <header class="post-head">
          <div><b>${f.name}</b><small>${f.handle || ""}</small></div>
          <span class="tag">${CATEGORIES[f.cat] || ""}</span>
        </header>
        ${gallery(f)}
        <div class="post-actions">
          <button type="button" class="act like${on ? " on" : ""}" aria-pressed="${on}" aria-label="إعجاب">${on ? "♥" : "♡"}</button><span class="like-count" aria-label="عدد الإعجابات">${likeTotals.get(f.name) || 0}</span>
          <button type="button" class="act share" aria-label="مشاركة">⤴</button>
        </div>
        <div class="post-body">
          <p><b>${f.name}</b> ${f.desc}</p>
          <div class="store-buttons"><a class="btn-link" href="${f.link}" target="_blank" rel="noopener">زيارة المتجر</a><button type="button" class="btn-link store-comment-btn review-open">أضف تعليقًا</button></div>
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

    reel.addEventListener("click", async e => {
      const post = e.target.closest(".post"); if (!post) return;
      if (e.target.closest(".review-open")) { showReview(post.dataset.name); return; }
      if (e.target.closest(".review-more-open")) { showAllReviews(post.dataset.name); return; }
      const nav = e.target.closest(".g-btn");
      if (nav) {
        const fade=nav.closest(".fade-gallery");
        if(fade){
          showFade(fade,Number(fade.dataset.current||0)+(nav.dataset.dir==="next"?1:-1));
          fade.dataset.pauseUntil=String(Date.now()+9000);
          return;
        }
        const sl = nav.parentElement.querySelector(".slides");
        const d = getComputedStyle(sl).direction === "rtl" ? -1 : 1;
        sl.scrollBy({ left: (nav.dataset.dir === "next" ? 1 : -1) * d * sl.clientWidth, behavior: "smooth" });
        return;
      }
      const pic = e.target.closest(".post-img, .slides img.active, .gallery:not(.fade-gallery) .slides img");
      if (pic) { openBox(pic.src, pic.alt); return; }
      const f = FAMILIES.find(x => x.name === post.dataset.name); if (!f) return;
      const like = e.target.closest(".like"), share = e.target.closest(".share");
      if (like) {
        if (!supabaseReady || !visitorId || like.disabled) return;
        const previous=hasLiked(f.name),next=!previous;
        like.disabled=true;
        try {
          const total=await api("rpc/toggle_store_like",{method:"POST",body:JSON.stringify({p_business_name:f.name,p_visitor_id:visitorId,p_like:next})});
          if(next)liked.add(f.name);else liked.delete(f.name);
          try { localStorage.setItem(likeKey(f.name),next?"1":"0"); } catch {}
          like.classList.toggle("on",next);
          like.setAttribute("aria-pressed",String(next));
          like.textContent=next?"♥":"♡";
          likeTotals.set(f.name,Number(total)||0);
          const count=post.querySelector(".like-count");
          if(count)count.textContent=String(likeTotals.get(f.name));
        } catch(error) { console.error("Unable to save like",error); }
        finally {like.disabled=false;}
      }
      if (share) {
        if (navigator.share) navigator.share({ title: f.name, url: f.link }).catch(() => {});
        else navigator.clipboard?.writeText(f.link).then(() => {
          share.textContent = "✓"; setTimeout(() => (share.textContent = "⤴"), 1500);
        });
      }
    });


    document.addEventListener("submit",async e=>{
      const form=e.target.closest(".review-dialog .review-form");
      if(!form || !supabaseReady)return;
      e.preventDefault();
      const name=document.querySelector(".review-dialog")?.dataset.businessName;
      const customerName=form.elements.customer_name.value.trim();
      const rating=Number(form.elements.rating.value);
      const comment=form.elements.review.value.trim();
      if(!name || customerName.length<2 || customerName.length>60 || !Number.isInteger(rating) || rating<1 || rating>5 || comment.length>500)return;
      const button=form.querySelector('[type="submit"]'),status=form.querySelector(".review-status");
      if(reviewCount(name)>=3){button.disabled=true;status.textContent=limitMessage;return;}
      button.disabled=true;status.textContent="جارٍ إرسال التقييم...";
      try{
        await api("reviews",{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify({business_name:name,customer_name:customerName,rating,comment})});
        const count=reviewCount(name)+1;
        const saved=saveCount(name,count);
        form.reset();status.textContent=saved?(count>=3?"تم إرسال تقييمك بنجاح ✓ "+limitMessage:"تم إرسال تقييمك بنجاح ✓ (المتبقي: "+(3-count)+")"):"تم إرسال تقييمك، لكن تعذّر حفظ عداد التعليقات.";
        if(count>=3||!saved)button.disabled=true;
        await refreshReviews();
      }catch(error){console.error(error);status.textContent="تعذّر تأكيد إرسال التقييم. تحققي من ظهوره قبل إعادة المحاولة.";}
      finally{if(reviewCount(name)<3)button.disabled=false;}
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

    renderChips(); filter(); refreshReviews(); loadLikeTotals();
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
