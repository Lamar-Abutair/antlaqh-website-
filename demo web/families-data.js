/* =========================================================
   ✏️ هذا الملف الوحيد اللي تعدلين فيه
   ========================================================= */

/* ---------- 1) الأقسام ----------
   الشكل:  مفتاح: "اسم القسم",
   المفتاح بالإنجليزي بدون مسافات، واسم القسم هو اللي يظهر للزوار.
   لإضافة قسم جديد: أضيفي سطر جديد (لا تنسين الفاصلة , في آخر السطر). */
const CATEGORIES = {
  projects: "مشاريع وتصاميم",
  sweets:   "حلويات ومعجنات",
  flowers:  "ورد وهدايا",
  sewing:   "خياطة و صناعات يدوية",
  skincare: "منتجات العناية بالبشرة",

};

/* ---------- 2) المتاجر ----------
   انسخي أي كتلة من { إلى }, والصقيها بعدها وغيّري الكلام.

   name   = اسم المتجر
   handle = اسم الحساب (اختياري، اتركيه "" إذا ما تبينه)
   cat    = مفتاح القسم من الأعلى (مثل flowers)
   desc   = الوصف
   link   = رابط زر "زيارة المتجر"
   images = الصور والفيديوهات، حطيها كلها هنا بأي ترتيب.
            الفيديوهات (mp4 أو mov) تتعرف تلقائيًا وتظهر كفيديو.
   tags   = كلمات تساعد البحث (اختياري)                     */
const FAMILIES = [
  {
    name: "تصاميم بلومي",
    handle: "bloomy designs",
    cat: "projects",
    desc: "مو مجرد تصاميم… عالم من الإبداع والتقنية! ✨ من فيديوهات وأنيميشن بالذكاء الاصطناعي، وتصميم وتطوير المواقع الإلكترونية، والألعاب والأنشطة التفاعلية، وتجارب الواقع المعزز (AR) والقصص التفاعلية (H5P)، إلى العروض التقديمية الاحترافية، وبكجات التخرج والسينورز المتكاملة (عروض، ألعاب، إعلانات، توزيعات وملفات)، نحوّل أفكارك إلى أعمال تخطف الأنظار! 💗\n\n💌 وعندك فكرة مختلفة؟ مهما كانت فكرتك، شاركينا إياها وخلّي علينا نحوّلها إلى واقع بلمسة إبداعية تميزك! ✨",
    link: "https://api.whatsapp.com/send?phone=9660500838531",
    images: ["photos/bloomy store photos/01.jpeg","photos/bloomy store photos/bloomy_video_2_13s.mp4","photos/bloomy store photos/02.jpeg","photos/bloomy store photos/girls presentation.png","photos/bloomy store photos/09.jpeg","photos/bloomy store photos/03.jpeg","photos/bloomy store photos/675416612_1792429185320009.mp4","photos/bloomy store photos/05.jpeg","photos/bloomy store photos/08.jpeg","photos/bloomy store photos/06.jpeg"],
    tags: ["تصاميم", "مشاريع"]
  },
  {
    name: "كوكيز سارونه",
    handle: "Cooki_saroona89",
    cat: "sweets",
    desc:"أنواع الكوكيز",
    link: "https://www.instagram.com/cooki_saroona89?stkn=MWt0aHBldnMwazYyZA%3D%3D&utm_source=qr",
    images: ["photos/saroona/1saroona.jpeg", "photos/saroona/2saroona.jpeg", "photos/saroona/3saroona.mp4", "photos/saroona/4saroona.mp4"],
    tags: ["اكل", "كوكيز", "حلويات"]
  },
  {
    name: "حلاويز",
    handle: "Halawiz",
    cat: "sweets",
    desc: `أهلًا بكم في متجري «حلاويز» 🤎

  متجري يقدم تشكيلة لذيذة ومتنوعة من الحلويات، مثل الكوكيز الميني، والكوكيز الكلاسيك، وكوكيز دبل شوكولاتة،وبودنق الكوكيز， وكعكة الكوكيز بأشكالها المختلفة مثل القلب والدائرة， بالإضافة إلى حلا ترافل مانجو وكيكة دولتشي. 🍪🍰✨`,
    link: "https://www.instagram.com/halawiz.sa/",
    images: ["photos/Halawiz/1hala.jpeg", "photos/Halawiz/2hala.jpeg", "photos/Halawiz/3hala.jpeg", "photos/Halawiz/4hala.jpeg", "photos/Halawiz/5hala.jpeg"],
    tags: ["اكل", "كوكيز", "حلويات"]
  },
  {
    name: "متجر صناعة الصابون والسكراب والكريمات",
    handle: "hayafahadsosorakan@gmail.com",
    cat: "skincare",
    desc: "صابون وسكراب وكريم ترطيب" ,
    link: "https://api.whatsapp.com/send?phone=9660508863120",
    images: ["photos/idk/1d.jpeg", "photos/idk/2d.jpeg", "photos/idk/3d.png", "photos/idk/4d.jpeg", "photos/idk/5d.jpeg", "photos/idk/6d.jpeg"],
    tags: ["بشرة", "منتجات العناية بالبشرة"]
  },
  {
    name: "جوجو كاندي",
    handle: "JoJo candy",
    cat: "sweets",
    desc: "حلويات",
    link: "https://api.whatsapp.com/send?phone=9660501823741",
    tags: ["اكل", "كوكيز", "حلويات"]
  },
  {
    name: "نورة | رسامة",
    handle: "ART BY NORAH",
    cat: "projects",
    desc: "شغلها يتمركز حول فنونها بالرسم خصوصًا الرقمي او الطباعه، مثل كروت دعوات الزواج وغيرها من مناسبات",
    link: "https://www.tiktok.com/@artbynorah9?_r=1&_t=ZS-9ATGHdM6vIu",
    images: ["photos/norah/n1.jpeg", "photos/norah/n2.jpeg", "photos/norah/n3.jpeg", "photos/norah/n4.jpeg", "photos/norah/n5.jpeg"],
    tags: ["تصاميم", "مشاريع"]
  },
  {
    name: "متجر سعاد",
    handle: "Suad.store15",
    cat: "sewing",
    desc: "فن الكروشيه وتشكيل الشمع وتصميم الجورنال",
    link: "https://api.whatsapp.com/send?phone=9660506098383",
    images: ["photos/suad/1s.jpeg", "photos/suad/2s.jpeg", "photos/suad/3s.jpeg", "photos/suad/4s.jpeg", "photos/suad/5s.jpeg"],
    tags: ["صناعة", "خياطة", "كروشيه"]
  },
  {
    name: "سايوري ارت🎨",
    handle: "🎨Sayori Art",
    cat: "sewing",
    desc: "صنع ورسم فواصل كتب مخصوصه لأجلك بكل حب💗",
    link: "https://www.instagram.com/sa.y0rii?obrf=dWs5dmxjaWI3cXF1",
    images: ["photos/sayori/1y.jpg", "photos/sayori/2y.jpeg", "photos/sayori/3y.jpeg", "photos/sayori/4y.jpeg", "photos/sayori/5y.jpeg","photos/sayori/6y.jpeg", "photos/sayori/7y.jpeg"],
    tags: ["صناعة", "رسم", "فواصل كتب"]
  }
];
