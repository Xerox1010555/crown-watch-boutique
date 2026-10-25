/* ═══════════════════════════════════════════════════════════════
   CROWN & CO. — APPLICATION
   1. Utilities & capability detection
   2. Data (models, options, boutiques, testimonials, i18n)
   3. State, currency, storage
   4. UI: i18n renderer, collection, configurator, cart, forms
   5. Motion: cursor, magnetic, reveals, smooth scroll, nav
   6. 3D: engine, procedural watch builder, choreography
   7. Master loop & init
   ═══════════════════════════════════════════════════════════════ */
(function(){
'use strict';
/* ─────────────────────────────────────────────────────────────
   1. UTILITIES & CAPABILITIES
   ───────────────────────────────────────────────────────────── */
const $  = (s, c) => (c || document).querySelector(s);
const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const clamp01 = v => clamp(v, 0, 1);
const lerp = (a, b, t) => a + (b - a) * t;
const damp = (a, b, l, dt) => lerp(a, b, 1 - Math.exp(-l * dt));
const smoothstep = t => t * t * (3 - 2 * t);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const isCoarse = window.matchMedia('(hover: none), (pointer: coarse)').matches;
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasGSAP = typeof window.gsap === 'object' && window.gsap !== null;
const hasST = hasGSAP && typeof window.ScrollTrigger === 'object';
const hasTHREE = typeof window.THREE === 'object' && window.THREE !== null;
if (hasST) gsap.registerPlugin(ScrollTrigger);
if (!hasGSAP) document.documentElement.classList.add('no-anim');
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

/* Safe localStorage (file:// / private mode can throw) */
const store = {
  get(key, fallback){
    try { const v = localStorage.getItem('cc:' + key); return v === null ? fallback : JSON.parse(v); }
    catch (e) { return fallback; }
  },
  set(key, value){
    try { localStorage.setItem('cc:' + key, JSON.stringify(value)); } catch (e) { /* unavailable */ }
  }
};

/* ─────────────────────────────────────────────────────────────
   2. DATA
   ───────────────────────────────────────────────────────────── */
const DIALS = {
  black:     { hex:'#0d0e11', sun:1, price:0,   name:{en:'Noir',      ar:'أسود'} },
  green:     { hex:'#0a3d2c', sun:1, price:250, name:{en:'Vert',      ar:'أخضر'} },
  blue:      { hex:'#0f2f5e', sun:1, price:250, name:{en:'Bleu',      ar:'أزرق'} },
  champagne: { hex:'#d8c290', sun:1, price:450, name:{en:'Champagne', ar:'شمبانيا'} },
  ivory:     { hex:'#ece5d4', sun:0, price:350, name:{en:'Ivoire',    ar:'عاجي'} }
};
const BEZELS = {
  steel:   { price:0,    name:{en:'Polished Steel',  ar:'فولاذ مصقول'} },
  ceramic: { price:400,  name:{en:'Black Ceramic',   ar:'سيراميك أسود'} },
  fluted:  { price:1200, name:{en:'Fluted Gold',     ar:'ذهب محزّز'} }
};
const BRACELETS = {
  steel:   { price:0,    name:{en:'Oystersteel', ar:'فولاذ أوستر'} },
  twotone: { price:2600, name:{en:'Two-tone',    ar:'ثنائي المعدن'} },
  gold:    { price:5200, name:{en:'18 ct Gold',  ar:'ذهب 18 قيراط'} }
};
const STYLES = {
  oyster:  { price:0,   name:{en:'Oyster',   ar:'أويستر'} },
  jubilee: { price:300, name:{en:'Jubilee',  ar:'جوبيلي'} }
};
const CURRENCIES = {
  USD: { rate:1,      label:'USD' },
  EGP: { rate:48.60,  label:'EGP' },
  AED: { rate:3.6725, label:'AED' },
  SAR: { rate:3.7500, label:'SAR' }
};

/* GMT hand locks to real Geneva time (Europe/Zurich) regardless of the viewer's clock;
   DST-safe via Intl timezone math at boot, with the legacy +3 fallback kept. */
let GMT_DELTA_H = 3;
(function initGmtDelta(){
  try {
    const d = new Date();
    const gp = new Intl.DateTimeFormat('en-GB', { timeZone:'Europe/Zurich', hour12:false, hour:'2-digit', minute:'2-digit' }).formatToParts(d);
    const gh = +((gp.find(p => p.type === 'hour') || {}).value);
    const gm = +((gp.find(p => p.type === 'minute') || {}).value) || 0;
    if (isNaN(gh)) return;
    let delta = (gh + gm / 60) - (d.getHours() + d.getMinutes() / 60) + 36;
    delta = ((delta % 24) + 24) % 24;
    if (delta > 12) delta -= 24;
    GMT_DELTA_H = delta;
  } catch (e) { /* offline or unsupported → keep legacy +3 */ }
})();

const MODELS = {
  submariner: {
    name:  { en:'Submariner',           ar:'صب مارين' },
    word:  { en:'SUBMARINER',           ar:'صب مارين' },
    ref:   '124060', price: 11250, size: '41 mm',
    dial: 'black', bezelKind: 'dive', bezelMat: 'ceramic',
    bracelet: 'steel', style: 'oyster', accent: 'steel',
    dot: '#0d0e11',
    desc: { en:'The reference diver\'s watch since 1953 — unidirectional Cerachrom bezel, waterproof to 300 metres.',
            ar:'ساعة الغوص المرجعية منذ عام ١٩٥٣ — إطار سيراكروم أحادي الاتجاه ومقاومة للماء حتى ٣٠٠ متر.' },
    chips: [ {en:'Oystersteel',ar:'فولاذ أوستر'}, {en:'Cerachrom',ar:'سيراكروم'}, {en:'300 m',ar:'300 م'} ]
  },
  daytona: {
    name:  { en:'Cosmograph Daytona',   ar:'كوزموغراف دايتونا' },
    word:  { en:'DAYTONA',              ar:'دايتونا' },
    ref:   '126500LN', price: 15900, size: '40 mm',
    dial: 'ivory', bezelKind: 'tachymeter', bezelMat: 'steel',
    bracelet: 'steel', style: 'oyster', accent: 'steel',
    dot: '#ece5d4',
    desc: { en:'Born for endurance racing — panda tri-compax dial and a tachymetric scale to 400 units per hour.',
            ar:'وُلدت لسباقات التحمل — مينا «باندا» بثلاث عدادات فرعية ومقياس سرعة حتى ٤٠٠ وحدة في الساعة.' },
    chips: [ {en:'Chronograph',ar:'كرونوغراف'}, {en:'Panda dial',ar:'مينا باندا'}, {en:'4 Hz',ar:'4 هرتز'} ]
  },
  datejust: {
    name:  { en:'Datejust 41',          ar:'ديت جست 41' },
    word:  { en:'DATEJUST',             ar:'ديت جست' },
    ref:   '126234', price: 9850, size: '41 mm',
    dial: 'champagne', bezelKind: 'fluted', bezelMat: 'fluted',
    bracelet: 'twotone', style: 'jubilee', accent: 'gold',
    dot: '#d8c290',
    desc: { en:'The classic of classics — fluted bezel, cyclops lens over the date, and the supple Jubilee bracelet.',
            ar:'الكلاسيكية فوق الكلاسيكيات — إطار محزّز وعدسة سيكلوب فوق التاريخ وسوار جوبيلي فاخر.' },
    chips: [ {en:'Fluted bezel',ar:'إطار محزّز'}, {en:'Jubilee',ar:'جوبيلي'}, {en:'Cyclops',ar:'سيكلوب'} ]
  },
  gmt: {
    name:  { en:'GMT-Master II',        ar:'جي إم تي ماستر II' },
    word:  { en:'GMT-MASTER',           ar:'جي إم تي' },
    ref:   '126710BLRO', price: 11700, size: '40 mm',
    dial: 'black', bezelKind: 'pepsi', bezelMat: 'ceramic',
    bracelet: 'steel', style: 'oyster', accent: 'steel',
    dot: '#12315e',
    desc: { en:'The legendary «Pepsi» — a 24-hour bidirectional bezel tracking a second time zone at a glance.',
            ar:'الأسطورية «بيبسي» — إطار ٢٤ ساعة ثنائي الاتجاه يتتبّع منطقة زمنية ثانية بنظرة واحدة.' },
    chips: [ {en:'24 h bezel',ar:'إطار 24 ساعة'}, {en:'Pepsi',ar:'بيبسي'}, {en:'Two zones',ar:'توقيتان'} ]
  }
};
const MODEL_ORDER = ['submariner', 'daytona', 'datejust', 'gmt'];

const TESTIMONIALS = [
  { who:{en:'Isabelle Marchand',ar:'إيزابيل مارشان'}, city:{en:'Geneva',ar:'جنيف'}, watch:'Datejust 41',
    q:{en:'“The boutique felt like a private atelier. Champagne, quiet light, and the watch turned in my hands for an hour before a word about price.”',
       ar:'«كانت البوتيك وكأنها مشغل خاص. شمبانيا وضوء هادئ، وأمضيت ساعة أُدارس الساعة في يدي قبل أن تُذكر كلمة واحدة عن السعر.»'} },
  { who:{en:'Omar Al-Rashid',ar:'عمر الراشد'}, city:{en:'Dubai',ar:'دبي'}, watch:'Submariner',
    q:{en:'“I configured my Submariner in the 3D atelier at midnight, and collected it — adjusted, polished, engraved — the next evening.”',
       ar:'«صمّمت ساعتي صب مارين في الأتيليه ثلاثي الأبعاد منتصف الليل، واستلمتها في المساء التالي مضبوطة ومصقولة ومنقوشة.»'} },
  { who:{en:'Layla Hassan',ar:'ليلى حسن'}, city:{en:'Cairo',ar:'القاهرة'}, watch:'GMT-Master II',
    q:{en:'“Two time zones, one on each wrist now — my husband and I chose the Pepsi together. Service worthy of the crown.”',
       ar:'«توقيتان وزوجان — اخترنا أنا وزوجي «بيبسي» معًا. خدمة تليق بالتاج.»'} }
];

const BOUTIQUES = [
  { city:{en:'Geneva',ar:'جنيف'}, tag:{en:'Flagship',ar:'البوتيك الرئيسي'},
    addr:{en:'Rue du Rhône 45, 1204',ar:'شارع دو رون 45، 1204'},
    hours:{en:'Mon–Sat · 10:00–19:00',ar:'الاثنين–السبت · 10:00–19:00'},
    phone:'+41 22 000 00 01', map:'Geneva Rue du Rhone 45' },
  { city:{en:'Dubai',ar:'دبي'}, tag:{en:'UAE',ar:'الإمارات'},
    addr:{en:'The Dubai Mall, Ground Floor',ar:'دبي مول، الطابق الأرضي'},
    hours:{en:'Daily · 10:00–22:00',ar:'يوميًا · 10:00–22:00'},
    phone:'+971 4 000 0002', map:'Dubai Mall' },
  { city:{en:'Riyadh',ar:'الرياض'}, tag:{en:'KSA',ar:'السعودية'},
    addr:{en:'Kingdom Centre, Level 2',ar:'مركز المملكة، الطابق الثاني'},
    hours:{en:'Sun–Thu · 10:00–22:00',ar:'الأحد–الخميس · 10:00–22:00'},
    phone:'+966 11 000 0003', map:'Kingdom Centre Riyadh' },
  { city:{en:'Cairo',ar:'القاهرة'}, tag:{en:'Egypt',ar:'مصر'},
    addr:{en:'First Mall, Gezira, Zamalek',ar:'فيرست مول، الجزيرة، الزمالك'},
    hours:{en:'Daily · 10:00–22:00',ar:'يوميًا · 10:00–22:00'},
    phone:'+20 2 0000 0004', map:'First Mall Cairo' }
];

/* ─────────────────────────────────────────────────────────────
   3. I18N DICTIONARY
   ───────────────────────────────────────────────────────────── */
const I18N = {
en: {
  'a11y.skip':'Skip to content',
  'pre.tag':'CROWN & CO. · AUTHORIZED BOUTIQUE',
  'gl.fallback':'3D display is unavailable on this device — exploring the boutique in classic view.',
  'nav.boutique':'Rolex Authorized Boutique','nav.collection':'Collection','nav.configurator':'Configurator',
  'nav.craft':'Craft','nav.boutiques':'Boutiques',
  'hero.eyebrow':'Crown & Co. · Rolex Authorized Boutique',
  'hero.titleA':'Time,','hero.titleB':'Perfected.',
  'hero.sub':'An atelier of Oystersteel, 18 ct gold and in-house calibres. Explore the world\u2019s most coveted timepieces — rendered live, in three dimensions.',
  'hero.cta1':'Explore the Collection','hero.cta2':'Book an Appointment',
  'hero.metaCities':'Geneva · Dubai · Riyadh · Cairo','hero.metaEst':'Since 1948','hero.scroll':'Scroll to discover',
  'story1.kicker':'The Bezel','story1.title':'A Signature Cut in Light',
  'story1.body':'Sixty-four facets machined into precious metal at a precise 45° angle. The fluted bezel catches light like a prism — and crowns every dial in the collection.',
  'story1.chip':'18 ct gold · 64 facets',
  'story2.kicker':'The Calibre','story2.title':'The Heart That Never Rests',
  'story2.body':'Beneath the dial, the manufacture calibre beats at 28,800 vibrations per hour — Chronergy escapement, seventy hours of reserve, certified to −2/+2 seconds a day.',
  'story2.chip':'−2/+2 sec · Superlative Chronometer',
  'story3.kicker':'The Oyster Case','story3.title':'Engineered for the Deep',
  'story3.body':'A monobloc middle case, Triplock crown and hermetically screwed caseback — sealed like a vault around the movement, waterproof to three hundred metres.',
  'story3.chip':'Waterproof 300 m',
  'col.kicker':'The Collection','col.titleA':'Four Icons,','col.titleB':'One Crown',
  'col.sub':'Select a reference to restyle the atelier. Every watch is modelled live — feel the light move across the bezel as you browse.',
  'col.hint':'Drag to rotate · Hover a card to preview','col.add':'Add','col.view':'View','col.ref':'Reference',
  'cfg.kicker':'The Configurator','cfg.titleA':'Commission','cfg.titleB':'Yours',
  'cfg.sub':'Dial, bezel, bracelet — every choice is rendered live on the watch above and priced instantly.',
  'cfg.gDial':'Dial','cfg.gBezel':'Bezel','cfg.gBracelet':'Bracelet','cfg.gStyle':'Style',
  'cfg.yourPrice':'Your configuration','cfg.add':'Add to Cart','cfg.reset':'Reset',
  'cfg.hint':'Drag to rotate · Changes apply live',
  'cfg.lineBase':'Base reference','cfg.lineDial':'Dial','cfg.lineBezel':'Bezel','cfg.lineBracelet':'Bracelet','cfg.lineStyle':'Bracelet style',
  'craft.kicker':'Craftsmanship','craft.titleA':'The Superlative','craft.titleB':'Standard',
  'craft.c1':'Waterproof depth','craft.c2':'Power reserve','craft.c3':'Jewels in calibre','craft.c4':'International warranty',
  'craft.p1':'Every timepiece that leaves our atelier carries the green seal — a promise that it has survived a battery of tests far beyond the industry norm, twice certified for precision on the wrist.',
  'craft.p2':'Cases are forged from a single block of Oystersteel, a grade 904L alloy exclusive to the manufacture. Bezels are cut, fluted and set by hand. Movements are assembled, regulated and disassembled again — then assembled once more, to perfection.',
  'craft.p3':'The result is a chronometer certified to −2/+2 seconds per day — a tolerance roughly twice as strict as the official standard for a certified chronometer.',
  'craft.q':'“A watch does not merely keep time. It keeps a promise made to the second, for generations.”',
  'craft.qBy':'— The Master Atelier, Geneva',
  'craft.f1t':'Fluted Bezel','craft.f1p':'Sixty-four facets cut at 45° in 18 ct gold, polished to a mirror by a single artisan.',
  'craft.f2t':'Chronergy Escapement','craft.f2p':'A patented high-efficiency escapement, tolerant to magnetic fields up to 15,000 gauss.',
  'craft.f3t':'Oystersteel Case','craft.f3p':'A monobloc middle case forged from 904L alloy, screw-down back and Triplock crown.',
  'craft.f4t':'Jubilee Bracelet','craft.f4p':'Five solid links, assembled by hand since 1945 — supple as silk, unbreakable as oath.',
  't.kicker':'Word of Mouth','t.titleA':'Kept by','t.titleB':'Collectors','t.watch':'Acquired',
  'b.kicker':'Boutiques','b.titleA':'Visit the','b.titleB':'Atelier',
  'b.sub':'Private viewings by appointment. Our advisors speak English, Arabic and French.',
  'b.addr':'Address','b.hours':'Hours','b.phone':'Telephone','b.dir':'Get directions',
  'nl.kicker':'The Private List','nl.titleA':'First to','nl.titleB':'Know',
  'nl.sub':'New references, private viewings and boutique evenings — a quiet letter, four times a year.',
  'nl.emailLabel':'Email address','nl.button':'Subscribe',
  'nl.error':'Please enter a valid email address.','nl.success':'Welcome to the private list. Your invitation is on its way.',
  'nl.privacy':'No noise, no resale of your address. Unsubscribe with one click.',
  'f.blurb':'An independent family maison since 1948, guarding the art of horology across four cities and three generations.',
  'f.colTitle1':'Collection','f.colTitle2':'Services','f.colTitle3':'Contact',
  'f.s1':'Commission a watch','f.s2':'Care & servicing','f.s3':'Warranty','f.s4':'Private appointments',
  'f.hours':'Sun–Thu · 10:00–22:00','f.rights':'All rights reserved.',
  'f.disclaimer':'Concept demonstration. Not affiliated with Rolex SA.','f.top':'Back to top',
  'cart.title':'Your Selection','cart.emptyTitle':'Nothing chosen yet',
  'cart.emptySub':'Explore the collection and commission the watch that keeps your time.',
  'cart.browse':'Browse the Collection','cart.subtotal':'Subtotal',
  'cart.taxNote':'Taxes and insured delivery calculated by the concierge.','cart.checkout':'Proceed to Checkout',
  'cart.qtyMinus':'Decrease quantity','cart.qtyPlus':'Increase quantity','cart.remove':'Remove',
  'co.title':'Checkout','co.note':'A concierge will call to confirm payment and delivery. No card is charged in this demo.',
  'co.name':'Full name','co.email':'Email','co.phone':'Phone','co.city':'City','co.address':'Delivery address',
  'co.errName':'Please tell us your name.','co.errEmail':'A valid email is required.','co.errPhone':'Please enter a phone number.',
  'co.errCity':'Please enter your city.','co.errAddress':'Please enter a delivery address.',
  'co.back':'Back','co.place':'Place Order',
  'ok.title':'Order Reserved','ok.body':'Our concierge will contact you within one business day to arrange payment and delivery.',
  'ok.continue':'Continue Browsing',
  'toast.added':'Added to your selection','toast.removed':'Removed from your selection','toast.subscribed':'Subscribed','toast.reset':'Configuration reset','toast.soon':'Official social profiles are coming soon.','story.heading':'The story, in three chapters'
},
ar: {
  'a11y.skip':'تخطَّ إلى المحتوى',
  'pre.tag':'كراون آند كو · بوتيك معتمد',
  'gl.fallback':'عرض الأبعاد الثلاثية غير متاح على هذا الجهاز — نستعرض البوتيك بالوضع الكلاسيكي.',
  'nav.boutique':'بوتيك معتمد لرولكس','nav.collection':'المجموعة','nav.configurator':'التخصيص',
  'nav.craft':'الحِرفة','nav.boutiques':'البوتيكات',
  'hero.eyebrow':'كراون آند كو · بوتيك معتمد لرولكس',
  'hero.titleA':'الزمنُ،','hero.titleB':'بإتقانٍ مطلق.',
  'hero.sub':'أتيليه من فولاذ الأويستر والذهب عيار ١٨ قيراطًا وحركات المصنع. اكتشف أكثر ساعات العالم مرغوبًا — معروضة حيّةً بثلاثة أبعاد.',
  'hero.cta1':'استكشف المجموعة','hero.cta2':'احجز موعدًا',
  'hero.metaCities':'جنيف · دبي · الرياض · القاهرة','hero.metaEst':'منذ عام ١٩٤٨','hero.scroll':'مرِّر لتكتشف',
  'story1.kicker':'الإطار','story1.title':'توقيعٌ محفورٌ في الضوء',
  'story1.body':'أربعةٌ وستون شريحة تُشكَّل في المعدن النفيس بزاوية ٤٥ درجة بدقةٍ مطلقة. الإطار المحزّز يلتقط الضوء كالمنشور — ويتوّج كل مينا في المجموعة.',
  'story1.chip':'ذهب ١٨ قيراطًا · ٦٤ شريحة',
  'story2.kicker':'الحركة','story2.title':'قلبٌ لا يعرف الراحة',
  'story2.body':'تحت المينا، تنبض حركة المصنع بوتيرة ٢٨٨٨٠ اهتزازة في الساعة — مِزلاج كرونرجي، واحتياطي طاقة لسبعين ساعة، ومعتمدة بدقة −٢/+٢ ثانية يوميًا.',
  'story2.chip':'−٢/+٢ ثانية · كرونومتر فائق',
  'story3.kicker':'علبة الأويستر','story3.title':'هندسةٌ لأعماق البحار',
  'story3.body':'علبة وسط من قطعة واحدة، وتاج ترايبلك، وغطاء محكم كالخزنة حول الحركة — مقاومة للماء حتى عمق ثلاثمئة متر.',
  'story3.chip':'مقاومة للماء ٣٠٠ متر',
  'col.kicker':'المجموعة','col.titleA':'أربعُ أيقونات،','col.titleB':'تاجٌ واحد',
  'col.sub':'اختر مرجعًا لإعادة تصميم الأتيليه. كل ساعة تُنمذج حيّةً — وشاهد الضوء ينساب على الإطار أثناء تصفّحك.',
  'col.hint':'اسحب للتدوير · مرّر على البطاقة للمعاينة','col.add':'أضف','col.view':'عرض','col.ref':'المرجع',
  'cfg.kicker':'التخصيص','cfg.titleA':'اطلب','cfg.titleB':'ساعتك',
  'cfg.sub':'المينا والإطار والسوار — كل اختيار يُعرض حيًّا على الساعة أعلاه ويُسعَّر فورًا.',
  'cfg.gDial':'المينا','cfg.gBezel':'الإطار','cfg.gBracelet':'السوار','cfg.gStyle':'الطراز',
  'cfg.yourPrice':'تشكيلتك الخاصة','cfg.add':'أضف إلى السلة','cfg.reset':'إعادة ضبط',
  'cfg.hint':'اسحب للتدوير · التعديلات تُطبَّق فورًا',
  'cfg.lineBase':'المرجع الأساسي','cfg.lineDial':'المينا','cfg.lineBezel':'الإطار','cfg.lineBracelet':'السوار','cfg.lineStyle':'طراز السوار',
  'craft.kicker':'الحِرفة','craft.titleA':'المعيار','craft.titleB':'الفائق',
  'craft.c1':'عمق مقاومة الماء','craft.c2':'احتياطي الطاقة','craft.c3':'جواهر الحركة','craft.c4':'الضمان الدولي',
  'craft.p1':'كل ساعة تغادر أتيليهنا تحمل الختم الأخضر — وعدٌ بأنها اجتازت سلسلة اختبارات تتجاوز معايير الصناعة بمراحل، ومعتمدة مرتين لدقتها على المعصم.',
  'craft.p2':'العلب تُصبّ من قطعة واحدة من فولاذ الأويستر، سبيكة ٩٠٤L الحصرية للمصنع. الإطارات تُقطع وتُحزَّز وتُرصَّ يدويًا. الحركات تُجمَّع وتُضبط ثم تُفكَّك من جديد — ثم تُجمَّع مرة أخيرة، إلى الكمال.',
  'craft.p3':'النتيجة كرونومتر معتمد بدقة −٢/+٢ ثانية في اليوم — تسامحٌ أشد بمرتين تقريبًا من المعيار الرسمي للكرونومتر المعتمد.',
  'craft.q':'«الساعة لا تحفظ الوقت فحسب، بل تحفظ وعدًا مضبوطًا إلى الثانية، لأجيال.»',
  'craft.qBy':'— أستاذ الأتيليه، جنيف',
  'craft.f1t':'الإطار المحزّز','craft.f1p':'أربعٌ وستون شريحة تُقطع بزاوية ٤٥ درجة من ذهب ١٨ قيراطًا، ويصقلها حرفيٌّ واحد حتى المرآة.',
  'craft.f2t':'مِزلاج كرونرجي','craft.f2p':'مِزلاج عالي الكفاءة حاصل على براءة اختراع، يتحمل مجالات مغناطيسية حتى ١٥٠٠٠ غاوس.',
  'craft.f3t':'علبة الأويستر','craft.f3p':'علبة وسط من قطعة واحدة من سبيكة ٩٠٤L، بغطاء ملولب وتاج ترايبلك.',
  'craft.f4t':'سوار الجوبيلي','craft.f4p':'خمسة وصلات مصمتة تُجمَّع يدويًا منذ عام ١٩٤٥ — ناعم كالحرير، متين كالقسم.',
  't.kicker':'شهادات','t.titleA':'على معاصم','t.titleB':'الجامعين','t.watch':'اقتنى',
  'b.kicker':'البوتيكات','b.titleA':'زُر','b.titleB':'الأتيليه',
  'b.sub':'معاينات خاصة بموعد مسبق. مستشارونا يتحدثون العربية والإنجليزية والفرنسية.',
  'b.addr':'العنوان','b.hours':'الدوام','b.phone':'الهاتف','b.dir':'احصل على الاتجاهات',
  'nl.kicker':'القائمة الخاصة','nl.titleA':'الأولى','nl.titleB':'بالأخبار',
  'nl.sub':'مراجع جديدة ومعاينات خاصة وأمسيات البوتيك — رسالة هادئة، أربع مرات في العام.',
  'nl.emailLabel':'البريد الإلكتروني','nl.button':'اشترك',
  'nl.error':'يرجى إدخال بريد إلكتروني صحيح.','nl.success':'أهلًا بك في القائمة الخاصة. دعوتك في طريقها إليك.',
  'nl.privacy':'بلا إزعاج، وبلا مشاركة بريدك مع أي طرف. إلغاء الاشتراك بنقرة واحدة.',
  'f.blurb':'دار عائلية مستقلة منذ عام ١٩٤٨، تحرس فن الساعات عبر أربع مدن وثلاثة أجيال.',
  'f.colTitle1':'المجموعة','f.colTitle2':'الخدمات','f.colTitle3':'تواصل',
  'f.s1':'اطلب ساعة مخصصة','f.s2':'العناية والصيانة','f.s3':'الضمان','f.s4':'مواعيد خاصة',
  'f.hours':'الأحد–الخميس · 10:00–22:00','f.rights':'جميع الحقوق محفوظة.',
  'f.disclaimer':'نموذج تجريبي. لا يتبع شركة رولكس.','f.top':'إلى الأعلى',
  'cart.title':'مختاراتك','cart.emptyTitle':'لم تختر شيئًا بعد',
  'cart.emptySub':'استكشف المجموعة واطلب الساعة التي تحفظ وقتك.',
  'cart.browse':'تصفَّح المجموعة','cart.subtotal':'الإجمالي',
  'cart.taxNote':'تُحسب الضرائب والتوصيل المؤمَّن مع المستشار.','cart.checkout':'إتمام الطلب',
  'cart.qtyMinus':'إنقاص الكمية','cart.qtyPlus':'زيادة الكمية','cart.remove':'حذف',
  'co.title':'إتمام الطلب','co.note':'سيتصل بك المستشار لتأكيد الدفع والتسليم. لا تُخصم أي مبالغ في هذا النموذج.',
  'co.name':'الاسم الكامل','co.email':'البريد الإلكتروني','co.phone':'الهاتف','co.city':'المدينة','co.address':'عنوان التسليم',
  'co.errName':'يرجى إدخال اسمك.','co.errEmail':'البريد الإلكتروني غير صحيح.','co.errPhone':'يرجى إدخال رقم هاتف.',
  'co.errCity':'يرجى إدخال المدينة.','co.errAddress':'يرجى إدخال عنوان التسليم.',
  'co.back':'رجوع','co.place':'تأكيد الطلب',
  'ok.title':'تم حجز طلبك','ok.body':'سيتواصل معك مستشارنا خلال يوم عمل لترتيب الدفع والتسليم.',
  'ok.continue':'مواصلة التصفح',
  'toast.added':'أُضيف إلى مختاراتك','toast.removed':'أُزيل من مختاراتك','toast.subscribed':'تم الاشتراك','toast.reset':'أُعيد ضبط التخصيص','toast.soon':'ستتوفر حساباتنا الرسمية قريبًا.','story.heading':'القصة في ثلاثة فصول'
}
};

/* ─────────────────────────────────────────────────────────────
   4. STATE / CURRENCY / PRICING
   ───────────────────────────────────────────────────────────── */
const state = {
  lang: store.get('lang', (navigator.language || 'en').toLowerCase().startsWith('ar') ? 'ar' : 'en'),
  currency: store.get('currency', 'USD'),
  model: 'submariner',
  cfg: modelDefaults('submariner'), /* derived: matches collection card pricing ($11,250) */
  cart: store.get('cart', []),
  cartOpen: false, cartView: 'cart', menuOpen: false, booting: true
};
const t = key => (I18N[state.lang] && I18N[state.lang][key]) || I18N.en[key] || key;
const tx = pair => (pair && (pair[state.lang] || pair.en)) || '';
let fmtFn = null, fmtKey = '';
const fmt = usd => {
  const c = CURRENCIES[state.currency] || CURRENCIES.USD;
  const key = state.lang + ':' + state.currency;
  if (fmtKey !== key){
    fmtKey = key;
    try {
      fmtFn = new Intl.NumberFormat(state.lang === 'ar' ? 'ar-EG' : 'en-US',
        { style:'currency', currency: state.currency, maximumFractionDigits: 0 });
    } catch (e) { fmtFn = null; }
  }
  const n = Math.round(usd * c.rate);
  if (fmtFn) { try { return fmtFn.format(n); } catch (e) { fmtFn = null; } }
  return n + ' ' + c.label;
};
function modelDefaults(id){
  const m = MODELS[id];
  return { dial: m.dial, bezel: m.bezelMat, bracelet: m.bracelet, style: m.style };
}
function priceOf(modelId, cfg){
  const m = MODELS[modelId], d = modelDefaults(modelId);
  return m.price
       + (DIALS[cfg.dial].price        - DIALS[d.dial].price)
       + (BEZELS[cfg.bezel].price      - BEZELS[d.bezel].price)
       + (BRACELETS[cfg.bracelet].price - BRACELETS[d.bracelet].price)
       + (STYLES[cfg.style].price      - STYLES[d.style].price);
}
function cfgSummary(modelId, cfg){
  const m = MODELS[modelId];
  return [tx(m.name), tx(DIALS[cfg.dial].name), tx(BEZELS[cfg.bezel].name),
          tx(BRACELETS[cfg.bracelet].name), tx(STYLES[cfg.style].name)].join(' · ');
}

/* ─────────────────────────────────────────────────────────────
   5. TOAST
   ───────────────────────────────────────────────────────────── */
let toastTimer = null;
/* Social placeholders resolve to an honest toast instead of jumping the page */
document.addEventListener('click', e => {
  const so = e.target && e.target.closest && e.target.closest('[data-soon]');
  if (so){ e.preventDefault(); toast('toast.soon'); }
});
/* Dynamic copyright year */
(function(){
  const y = document.querySelector('[data-year]');
  if (y) y.textContent = new Date().getFullYear();
})();
function toast(key){
  const el = $('#toast'); if (!el) return;
  $('#toast-msg').textContent = t(key);
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

/* ─────────────────────────────────────────────────────────────
   6. I18N APPLY + DYNAMIC RENDERERS
   ───────────────────────────────────────────────────────────── */
function applyLang(){
  const html = document.documentElement;
  html.lang = state.lang;
  html.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
  $$('[data-i18n]').forEach(el => { el.textContent = t(el.getAttribute('data-i18n')); });
  const langLabels = $$('.lang-btn');
  langLabels.forEach(b => { b.textContent = state.lang === 'en' ? 'ع' : 'EN'; });
  renderCollection(); renderTestimonials(); renderBoutiques();
  renderConfigurator(); renderCart();
  updateGiantWord(true);
}
function setLang(lang){
  if (lang === state.lang) return;
  state.lang = lang; store.set('lang', lang);
  applyLang(); requestAnimationFrame(() => { measureAll(); if (hasST) ScrollTrigger.refresh(); setSpacer(); });
}

function renderCollection(){
  const list = $('#col-list'); if (!list) return;
  list.innerHTML = MODEL_ORDER.map(id => {
    const m = MODELS[id];
    return `
    <article class="wcard ${id === state.model ? 'active' : ''}" data-model="${id}" tabindex="0"
             role="button" aria-pressed="${id === state.model}" aria-label="${esc(tx(m.name))} — ${fmt(m.price)}">
      <div class="wcard-top">
        <span class="wcard-ref">${t('col.ref')} ${m.ref}</span>
        <span class="wcard-dim">${m.size}</span>
      </div>
      <h3 class="wcard-name"><span class="dot" style="background:${m.dot};color:${m.dot}"></span>${esc(tx(m.name))}</h3>
      <p class="wcard-desc">${esc(tx(m.desc))}</p>
      <div class="wcard-specs">${m.chips.map(c => `<span class="chip-tag">${esc(tx(c))}</span>`).join('')}</div>
      <div class="wcard-foot">
        <div class="wcard-price"><small>${t('cfg.yourPrice')}</small><span class="p">${fmt(m.price)}</span></div>
        <div class="wcard-actions">
          <button class="mini-btn" data-view="${id}" aria-label="${esc(tx(m.name))}">${t('col.view')}</button>
          <button class="mini-btn solid" data-add="${id}" aria-label="${esc(tx(m.name))} — ${t('col.add')}">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5 v14 M5 12 h14"/></svg>${t('col.add')}
          </button>
        </div>
      </div>
    </article>`;
  }).join('');
  $$('.wcard', list).forEach(card => {
    const id = card.getAttribute('data-model');
    card.addEventListener('click', () => selectModel(id));
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectModel(id); } });
    card.addEventListener('mouseenter', () => { if (!isCoarse) previewModel(id); });
    card.addEventListener('mouseleave', () => { if (!isCoarse) previewModel(state.model); });
  });
  $$('[data-view]', list).forEach(b => b.addEventListener('click', e => { e.stopPropagation(); selectModel(b.getAttribute('data-view')); }));
  $$('[data-add]',  list).forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    const id = b.getAttribute('data-add');
    if (id !== state.model) selectModel(id, true);
    addToCart(state.model, modelDefaults(id), 1);
  }));
}

function renderTestimonials(){
  const grid = $('#t-grid'); if (!grid) return;
  grid.innerHTML = TESTIMONIALS.map(x => `
    <figure class="t-card" data-reveal>
      <span class="stars" aria-hidden="true">★★★★★</span>
      <span class="sr-only">5 / 5</span>
      <blockquote class="t-quote">${esc(tx(x.q))}</blockquote>
      <figcaption class="t-who">
        <span class="t-avatar">${esc(tx(x.who).trim()[0])}</span>
        <span><b>${esc(tx(x.who))}</b><small>${esc(tx(x.city))} · ${t('t.watch')}: ${esc(x.watch)}</small></span>
      </figcaption>
    </figure>`).join('');
  observeReveals(grid);
}

function renderBoutiques(){
  const grid = $('#b-grid'); if (!grid) return;
  grid.innerHTML = BOUTIQUES.map(b => `
    <article class="b-card" data-reveal>
      <h3 class="b-city">${esc(tx(b.city))} <small>${esc(tx(b.tag))}</small></h3>
      <p class="b-line"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21 c 5 -5.5 7 -8.5 7 -11.5 a 7 7 0 1 0 -14 0 c 0 3 2 6 7 11.5 Z"/><circle cx="12" cy="9.5" r="2.5"/></svg><span>${esc(tx(b.addr))}</span></p>
      <p class="b-line"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7 v5 l3.5 2"/></svg><span>${esc(tx(b.hours))}</span></p>
      <p class="b-line"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5 h4 l1.5 4 -2 1.5 a 12 12 0 0 0 5 5 L15 13.5 l4 1.5 v4 a 2 2 0 0 1 -2 2 C 10 21 3 14 3 7 a 2 2 0 0 1 2 -2 Z"/></svg><span dir="ltr">${esc(b.phone)}</span></p>
      <a class="link-arrow b-link" href="https://maps.google.com/?q=${encodeURIComponent(b.map)}" target="_blank" rel="noopener">
        ${t('b.dir')}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12 h15 M13 6 l6 6 -6 6"/></svg>
      </a>
    </article>`).join('');
  observeReveals(grid);
}

/* ─────────────────────────────────────────────────────────────
   7. CONFIGURATOR
   ───────────────────────────────────────────────────────────── */
function renderConfigurator(){
  const m = MODELS[state.model];
  /* dial swatches */
  const dWrap = $('#cfg-dial');
  if (dWrap){
    dWrap.innerHTML = Object.keys(DIALS).map(k => `
      <button class="sw" role="button" aria-pressed="${state.cfg.dial === k}" data-opt="dial" data-val="${k}"
              aria-label="${esc(tx(DIALS[k].name))}" title="${esc(tx(DIALS[k].name))}"><span style="--sw:${DIALS[k].hex}"></span></button>`).join('');
  }
  const pillRow = (sel, dict, opt) => {
    const w = $(sel); if (!w) return;
    w.innerHTML = Object.keys(dict).map(k => `
      <button class="pill" aria-pressed="${state.cfg[opt] === k}" data-opt="${opt}" data-val="${k}">
        ${esc(tx(dict[k].name))}${dict[k].price > 0 ? `<span style="opacity:.55"> +${fmt(dict[k].price)}</span>` : ''}
      </button>`).join('');
  };
  pillRow('#cfg-bezel', BEZELS, 'bezel');
  pillRow('#cfg-bracelet', BRACELETS, 'bracelet');
  pillRow('#cfg-style', STYLES, 'style');
  $$('[data-opt]').forEach(b => b.addEventListener('click', () => {
    const opt = b.getAttribute('data-opt'), val = b.getAttribute('data-val');
    if (state.cfg[opt] === val) return;
    state.cfg[opt] = val;
    applyConfigOption(opt, val);
  }));
  renderConfigSummary();
}
function renderConfigSummary(){
  const m = MODELS[state.model];
  $('#cfg-model-name').textContent = tx(m.name);
  $('#cfg-model-ref').textContent = 'Ref. ' + m.ref;
  $('#cfg-dial-name').textContent = tx(DIALS[state.cfg.dial].name);
  $('#cfg-bezel-name').textContent = tx(BEZELS[state.cfg.bezel].name);
  $('#cfg-bracelet-name').textContent = tx(BRACELETS[state.cfg.bracelet].name);
  $('#cfg-style-name').textContent = tx(STYLES[state.cfg.style].name);
  const rows = [
    ['cfg.lineBase', m.price],
    ['cfg.lineDial', DIALS[state.cfg.dial].price - DIALS[m.dial].price],
    ['cfg.lineBezel', BEZELS[state.cfg.bezel].price - BEZELS[m.bezelMat].price],
    ['cfg.lineBracelet', BRACELETS[state.cfg.bracelet].price - BRACELETS[m.bracelet].price],
    ['cfg.lineStyle', STYLES[state.cfg.style].price - STYLES[m.style].price]
  ];
  $('#cfg-lines').innerHTML = rows.map(([k, delta], idx) => `
    <div class="cfg-line"><span>${t(k)}</span><b>${idx === 0 ? fmt(delta) : (delta > 0 ? '+ ' + fmt(delta) : delta < 0 ? '− ' + fmt(-delta) : '—')}</b></div>`).join('');
  $('#cfg-price').textContent = fmt(priceOf(state.model, state.cfg));
}
$('#cfg-add').addEventListener('click', () => addToCart(state.model, { ...state.cfg }, 1));
$('#cfg-reset').addEventListener('click', () => {
  state.cfg = modelDefaults(state.model);
  renderConfigurator(); rebuildWatchSoft(); toast('toast.reset');
});

/* ─────────────────────────────────────────────────────────────
   8. CART & CHECKOUT
   ───────────────────────────────────────────────────────────── */
function saveCart(){ store.set('cart', state.cart); }
function cartCount(){ return state.cart.reduce((n, it) => n + it.qty, 0); }
function cartTotalUSD(){ return state.cart.reduce((n, it) => n + priceOf(it.model, it.cfg) * it.qty, 0); }
function addToCart(model, cfg, qty){
  const id = [model, cfg.dial, cfg.bezel, cfg.bracelet, cfg.style].join('|');
  const found = state.cart.find(it => it.id === id);
  if (found) found.qty += qty; else state.cart.push({ id, model, cfg: { ...cfg }, qty });
  saveCart(); renderCart(); toast('toast.added');
}
function renderCart(){
  const count = $('#cart-count');
  if (count){ count.textContent = cartCount(); count.setAttribute('data-zero', cartCount() ? '0' : '1'); }
  const items = $('#cart-items'), empty = $('#cart-empty'), foot = $('#cart-foot');
  if (!items) return;
  if (state.cartView === 'cart' && !state.cart.length){
    items.hidden = true; empty.hidden = false; foot.hidden = true; return;
  }
  empty.hidden = true; items.hidden = false; foot.hidden = state.cartView !== 'cart';
  items.innerHTML = state.cart.map((it, i) => {
    const m = MODELS[it.model];
    return `
    <div class="cd-item">
      <span class="cd-thumb" style="background:radial-gradient(circle at 35% 30%, rgba(255,255,255,.14), transparent 55%), ${DIALS[it.cfg.dial].hex}">${esc(tx(m.name)).trim()[0]}</span>
      <div class="cd-info">
        <b>${esc(tx(m.name))}</b>
        <small>${esc(cfgSummary(it.model, it.cfg))}</small>
        <div class="cd-qty">
          <button class="qbtn" data-q="-1" data-i="${i}" aria-label="${t('cart.qtyMinus')}"><svg viewBox="0 0 24 24"><path d="M5 12 h14"/></svg></button>
          <output aria-label="Qty">${it.qty}</output>
          <button class="qbtn" data-q="1" data-i="${i}" aria-label="${t('cart.qtyPlus')}"><svg viewBox="0 0 24 24"><path d="M12 5 v14 M5 12 h14"/></svg></button>
        </div>
      </div>
      <div class="cd-side">
        <span class="cd-price">${fmt(priceOf(it.model, it.cfg) * it.qty)}</span>
        <button class="cd-rm" data-rm="${i}">${t('cart.remove')}</button>
      </div>
    </div>`;
  }).join('');
  $('#cart-total').textContent = fmt(cartTotalUSD());
  $$('[data-q]', items).forEach(b => b.addEventListener('click', () => {
    const i = +b.getAttribute('data-i');
    state.cart[i].qty += +b.getAttribute('data-q');
    if (state.cart[i].qty <= 0){ state.cart.splice(i, 1); toast('toast.removed'); }
    saveCart(); renderCart();
  }));
  $$('[data-rm]', items).forEach(b => b.addEventListener('click', () => {
    state.cart.splice(+b.getAttribute('data-rm'), 1);
    saveCart(); renderCart(); toast('toast.removed');
  }));
}
function setCartView(view){
  state.cartView = view;
  $('#cart-view').hidden = view !== 'cart';
  $('#checkout-view').hidden = view !== 'checkout';
  $('#ok-view').hidden = view !== 'ok';
  renderCart();
}
function openCart(){
  state.cartOpen = true;
  setCartView('cart');
  $('#cart-drawer').classList.add('open');
  $('#cart-drawer').setAttribute('aria-hidden', 'false');
  $('#cart-overlay').classList.add('open');
  $('#cart-overlay').setAttribute('aria-hidden', 'false');
  $('#cart-close').focus();
}
function closeCart(){
  state.cartOpen = false;
  $('#cart-drawer').classList.remove('open');
  $('#cart-drawer').setAttribute('aria-hidden', 'true');
  $('#cart-overlay').classList.remove('open');
  $('#cart-overlay').setAttribute('aria-hidden', 'true');
  $('#cart-btn').focus();
}
$('#cart-btn').addEventListener('click', openCart);
$('#cart-close').addEventListener('click', closeCart);
$('#cart-overlay').addEventListener('click', closeCart);
$('#cart-browse').addEventListener('click', () => { closeCart(); scrollToSel('#collection'); });
$('#cart-checkout').addEventListener('click', () => setCartView('checkout'));
$('#co-back').addEventListener('click', () => setCartView('cart'));
$('#ok-continue').addEventListener('click', () => { closeCart(); setTimeout(() => setCartView('cart'), 650); });
$('#checkout-view').addEventListener('submit', e => {
  e.preventDefault();
  let ok = true;
  const check = (sel, test) => {
    const input = $(sel), field = input.closest('.field'), err = $('.fe', field);
    const good = test(input.value.trim());
    input.classList.toggle('err', !good); err.classList.toggle('show', !good);
    if (!good) ok = false;
  };
  check('#co-name', v => v.length > 1);
  check('#co-email', v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v));
  check('#co-phone', v => v.replace(/[^\d]/g, '').length >= 7);
  check('#co-city', v => v.length > 1);
  check('#co-address', v => v.length > 3);
  if (!ok) return;
  $('#ok-num').textContent = 'CC-' + Date.now().toString(36).toUpperCase().slice(-6);
  state.cart = []; saveCart(); renderCart();
  setCartView('ok');
});
/* Newsletter */
$('#nl-form').addEventListener('submit', e => {
  e.preventDefault();
  const input = $('#nl-email'), err = $('#nl-error'), ok = $('#nl-ok');
  const good = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());
  err.classList.toggle('show', !good);
  if (!good) return;
  ok.classList.add('show'); input.value = ''; input.blur();
  toast('toast.subscribed');
});

/* ─────────────────────────────────────────────────────────────
   9. LANGUAGE & CURRENCY SWITCHES
   ───────────────────────────────────────────────────────────── */
$('#lang-btn').addEventListener('click', () => setLang(state.lang === 'en' ? 'ar' : 'en'));
$('#lang-btn-menu').addEventListener('click', () => setLang(state.lang === 'en' ? 'ar' : 'en'));
$$('.currency').forEach(sel => sel.addEventListener('change', () => {
  state.currency = sel.value; store.set('currency', state.currency);
  $$('.currency').forEach(s => { s.value = state.currency; });
  renderCollection(); renderConfigSummary(); renderCart();
}));
/* ─────────────────────────────────────────────────────────────
   10. MOTION — split text, reveals, counters
   ───────────────────────────────────────────────────────────── */
function splitEl(el){
  const text = (el.textContent || '').trim();
  if (!text) return;
  const words = text.split(/\s+/);
  el.innerHTML = words.map((w, i) =>
    `<span class="w"><span class="wi" style="--d:${(i * 0.06).toFixed(3)}s">${esc(w)}</span></span>`).join(' ');
}
$$('[data-split]').forEach(splitEl);

let revealIO = null, counterIO = null;
function startReveals(){
  if (prefersReduced || !('IntersectionObserver' in window)){
    $$('[data-reveal],[data-split]').forEach(el => el.classList.add('in'));
    $$('[data-count]').forEach(el => { el.textContent = el.getAttribute('data-count'); });
    return;
  }
  revealIO = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting){ en.target.classList.add('in'); revealIO.unobserve(en.target); } });
  }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
  $$('[data-reveal],[data-split]').forEach(el => revealIO.observe(el));
  counterIO = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      counterIO.unobserve(en.target);
      const el = en.target, end = +el.getAttribute('data-count'), t0 = performance.now(), dur = 1500;
      (function step(now){
        const p = clamp01((now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(end * e);
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    });
  }, { threshold: 0.5 });
  $$('[data-count]').forEach(el => counterIO.observe(el));
}
/* Post-boot re-renders (e.g. language switch) must also be revealed — fixes cards
   staying invisible below the fold after any runtime re-render. */
function observeReveals(scope){
  if (!scope || !revealIO) return;
  $$('[data-reveal],[data-split]', scope).forEach(el => revealIO.observe(el));
  if (counterIO) $$('[data-count]', scope).forEach(el => counterIO.observe(el));
}

/* ─────────────────────────────────────────────────────────────
   11. NAV / MENU / ANCHORS
   ───────────────────────────────────────────────────────────── */
const navEl = $('#nav'), burgerEl = $('#burger'), menuEl = $('#menu');
function initNav(){
  let lastY = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    navEl.classList.toggle('scrolled', y > 30);
    if (!state.menuOpen){
      if (y > 500 && y > lastY + 6) navEl.classList.add('hidden-up');
      else if (y < lastY - 4) navEl.classList.remove('hidden-up');
    }
    lastY = y;
  }, { passive: true });
}
function setMenu(open){
  state.menuOpen = open;
  burgerEl.setAttribute('aria-expanded', open ? 'true' : 'false');
  menuEl.classList.toggle('open', open);
  document.body.style.overflow = open ? 'hidden' : '';
}
burgerEl.addEventListener('click', () => setMenu(!state.menuOpen));
$$('[data-menu-close]').forEach(a => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (state.cartOpen) closeCart();
  else if (state.menuOpen) setMenu(false);
});
function scrollToSel(sel, offset){
  const el = $(sel); if (!el) return;
  const target = clamp(el.offsetTop + (offset || 0), 0, 999999);
  if (S.on && hasGSAP){
    const o = { y: window.scrollY };
    gsap.to(o, { y: target, duration: 1.25, ease: 'power3.inOut',
      onUpdate(){ window.scrollTo(0, o.y); } });
  } else {
    window.scrollTo({ top: target, behavior: prefersReduced ? 'auto' : 'smooth' });
  }
}
function initAnchors(){
  $$('[data-anchor]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    const sel = a.getAttribute('data-anchor');
    const model = a.getAttribute('data-model-link');
    if (model && model !== state.model) selectModel(model, true);
    setMenu(false);
    scrollToSel(sel === '#hero' ? 0 : sel);
  }));
}
function navStep(){
  if (!M.colTop) return;
  const y = S.y + window.innerHeight * 0.4;
  const map = [['collection', M.colTop, M.cfgTop], ['configurator', M.cfgTop, M.craftTop], ['craft', M.craftTop, M.testTop], ['boutiques', M.boutTop, 1e9]];
  $$('.nav-links a').forEach(a => {
    const id = a.getAttribute('data-nav');
    const seg = map.find(s => s[0] === id);
    a.classList.toggle('active', !!(seg && y >= seg[1] && y < seg[2]));
  });
}

/* ─────────────────────────────────────────────────────────────
   12. SMOOTH SCROLL (Lenis-style inertia) + LAYOUT METRICS
   ───────────────────────────────────────────────────────────── */
const page = $('#page'), spacer = $('#scroll-spacer');
const S = { on: false, y: 0, t: 0 };
function initSmooth(){
  if (prefersReduced || isCoarse || !hasGSAP) return;
  document.documentElement.classList.add('smooth');
  S.on = true; S.t = window.scrollY || 0; S.y = S.t;
  setSpacer();
  window.addEventListener('scroll', () => { S.t = window.scrollY; }, { passive: true });
}
function setSpacer(){
  if (!S.on) return;
  const h = page.getBoundingClientRect().height;
  spacer.style.height = Math.ceil(h) + 'px';
}
const M = { heroTop: 0, storyTop: 0, storyH: 1, colTop: 0, cfgTop: 0, craftTop: 0, testTop: 0, boutTop: 0 };
function measureAll(){
  const vh = window.innerHeight;
  M.vh = vh;
  const ids = { storyTop: '#story', colTop: '#collection', cfgTop: '#configurator', craftTop: '#craft', testTop: '#testimonials', boutTop: '#boutiques' };
  Object.keys(ids).forEach(k => { const el = $(ids[k]); if (el) M[k] = el.offsetTop; });
  const st = $('#story'); if (st) M.storyH = st.offsetHeight;
  M.storyEnd = M.storyTop + M.storyH;
  setSpacer();
}
let roTimer = null;
if ('ResizeObserver' in window){
  new ResizeObserver(() => {
    clearTimeout(roTimer);
    roTimer = setTimeout(() => {
      measureAll();
      if (S.on){ S.y = S.t = window.scrollY; page.style.transform = `translate3d(0,${-S.y}px,0)`; }
      if (hasST) ScrollTrigger.refresh();
    }, 160);
  }).observe(page);
}
window.addEventListener('resize', () => {
  clearTimeout(roTimer);
  roTimer = setTimeout(() => {
    measureAll();
    if (gl.ok){
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight, false);
    }
    if (S.on){ S.y = S.t = window.scrollY; page.style.transform = `translate3d(0,${-S.y}px,0)`; }
    if (hasST) ScrollTrigger.refresh();
  }, 180);
});
function smoothStep(dt){
  if (!S.on){ S.y = window.scrollY; return; }
  S.y += (S.t - S.y) * (1 - Math.exp(-7.5 * dt));
  if (Math.abs(S.t - S.y) < 0.06) S.y = S.t;
  page.style.transform = `translate3d(0,${(-S.y).toFixed(2)}px,0)`;
  if (hasST) ScrollTrigger.update();
}

/* ─────────────────────────────────────────────────────────────
   13. CURSOR + MAGNETIC BUTTONS
   ───────────────────────────────────────────────────────────── */
const cur = { x: innerWidth / 2, y: innerHeight / 2, rx: innerWidth / 2, ry: innerHeight / 2, on: false };
const curDot = $('#cur-dot'), curRing = $('#cur-ring');
function initCursor(){
  if (isCoarse || prefersReduced) return;
  cur.on = true;
  document.documentElement.classList.add('cur-on');
  window.addEventListener('pointermove', e => { cur.x = e.clientX; cur.y = e.clientY; }, { passive: true });
  const HOVER = 'a,button,.wcard,.sw,.pill,input,select,label';
  document.addEventListener('pointerover', e => {
    if (e.target.closest && e.target.closest(HOVER)) curRing.classList.add('is-hover');
  });
  document.addEventListener('pointerout', e => {
    if (e.target.closest && e.target.closest(HOVER)) curRing.classList.remove('is-hover');
  });
}
function cursorStep(dt){
  if (!cur.on) return;
  cur.rx = damp(cur.rx, cur.x, 14, dt); cur.ry = damp(cur.ry, cur.y, 14, dt);
  curDot.style.transform = `translate(${cur.x - 2.5}px,${cur.y - 2.5}px)`;
  const half = curRing.offsetWidth / 2;
  curRing.style.transform = `translate(${cur.rx - half}px,${cur.ry - half}px)`;
}
function initMagnetic(){
  if (isCoarse || prefersReduced) return;
  $$('.magnetic').forEach(btn => {
    btn.addEventListener('pointermove', e => {
      const r = btn.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
      const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
      if (hasGSAP) gsap.to(btn, { x: dx * 12, y: dy * 8, duration: 0.5, ease: 'power3.out' });
      else btn.style.transform = `translate(${dx * 12}px,${dy * 8}px)`;
    });
    btn.addEventListener('pointerleave', () => {
      if (hasGSAP) gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1,0.4)' });
      else btn.style.transform = '';
    });
  });
}

/* ─────────────────────────────────────────────────────────────
   14. 3D ENGINE — renderer, environment, lights, particles
   ───────────────────────────────────────────────────────────── */
const TAU = Math.PI * 2;
const gl = { ok: false, failed: false, ready: false, paused: false, time: 0, zoom: 1, zoomT: 1 };
let renderer = null, scene = null, camera = null, ANISO = 4;
let watchRoot = null, morphGroup = null, particles = null, particleMat = null, keyLight = null;
const matCache = {}, texCache = {}, geoCache = {};
let watch = null;              /* current build */
let previewId = null;          /* hover preview model */
let switching = false;

function mat(key, make){
  if (!matCache[key]){ matCache[key] = make(); matCache[key].userData.shared = true; }
  return matCache[key];
}
function geo(key, make){
  if (!geoCache[key]){ geoCache[key] = make(); geoCache[key].userData = { shared: true }; }
  return geoCache[key];
}
function cTex(key, w, h, draw){
  if (texCache[key]) return texCache[key];
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const tx = new THREE.CanvasTexture(c);
  tx.encoding = THREE.sRGBEncoding;
  tx.anisotropy = ANISO;
  texCache[key] = tx;
  return tx;
}
/* letter-spaced centered text on a canvas */
function spacedText(ctx, text, cx, cy, spacing){
  const chars = [...text];
  const widths = chars.map(ch => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
  let x = cx - total / 2;
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  chars.forEach((ch, i) => { ctx.fillText(ch, x, cy); x += widths[i] + spacing; });
}
/* stylized crown emblem */
function drawCrown(ctx, cx, cy, s, color){
  ctx.save();
  ctx.translate(cx, cy); ctx.scale(s / 40, s / 40); ctx.translate(-20, -17);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(4, 24); ctx.lineTo(7, 10); ctx.lineTo(14.5, 18); ctx.lineTo(20, 5);
  ctx.lineTo(25.5, 18); ctx.lineTo(33, 10); ctx.lineTo(36, 24); ctx.closePath(); ctx.fill();
  ctx.fillRect(6, 26.5, 28, 3.2);
  ctx.fillRect(8.5, 31.5, 23, 2.2);
  ctx.beginPath(); ctx.arc(7, 8.4, 1.7, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(20, 3.4, 1.7, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(33, 8.4, 1.7, 0, TAU); ctx.fill();
  ctx.restore();
}
function brushedTex(){
  return cTex('brushed', 256, 256, (ctx) => {
    ctx.fillStyle = '#8a8a8a'; ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2600; i++){
      const y = Math.random() * 256, x = Math.random() * 256, l = 20 + Math.random() * 90;
      const g = 100 + Math.random() * 90 | 0;
      ctx.strokeStyle = `rgba(${g},${g},${g},.16)`;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + l, y + (Math.random() - .5) * 1.4); ctx.stroke();
    }
  });
}

/* — environment map: procedural studio room — */
function buildEnvironment(){
  const env = new THREE.Scene();
  const room = new THREE.Mesh(
    new THREE.BoxGeometry(64, 44, 64),
    new THREE.MeshBasicMaterial({ color: 0x14151a, side: THREE.BackSide })
  );
  env.add(room);
  const panel = (w, h, color, intensity, pos) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity) })
    );
    m.position.copy(pos); m.lookAt(0, 0, 0); env.add(m);
  };
  panel(26, 15, 0xffffff, 5.2, new THREE.Vector3(0, 20, 14));    /* key softbox */
  panel(9, 34, 0xdfe9ff, 3.0, new THREE.Vector3(-27, 8, 6));     /* cool strip */
  panel(9, 34, 0xffd9a6, 2.4, new THREE.Vector3(27, 6, 4));      /* warm strip */
  panel(30, 7, 0xc9a961, 1.1, new THREE.Vector3(0, -19, 10));    /* gold floor bounce */
  panel(22, 22, 0x0d5e3c, 0.8, new THREE.Vector3(0, 6, -28));    /* green back wash */
  panel(14, 10, 0xffffff, 2.2, new THREE.Vector3(0, 4, 30));     /* front fill */
  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromScene(env, 0.32);
  pmrem.dispose();
  room.geometry.dispose(); room.material.dispose();
  env.traverse(o => { if (o.isMesh && o !== room){ o.geometry.dispose(); o.material.dispose(); } });
  return rt.texture;
}

function initGL(){
  if (!hasTHREE) { gl.failed = true; }
  if (!gl.failed){
    try {
      const canvas = $('#gl');
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isCoarse ? 1.5 : 2));
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.12;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      gl.ok = true;
    } catch (e) { gl.failed = true; gl.ok = false; }
  }
  if (gl.failed){
    document.documentElement.classList.add('no-gl');
    return;
  }
  ANISO = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(34, window.innerWidth / window.innerHeight, 0.1, 400);
  camera.position.set(0, 1.5, 76);
  scene.environment = buildEnvironment();

  /* 3-point studio lighting */
  keyLight = new THREE.SpotLight(0xfff1dc, 2.4, 0, 0.55, 0.65, 1);
  keyLight.position.set(26, 32, 40);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(isCoarse ? 512 : 1024, isCoarse ? 512 : 1024);
  keyLight.shadow.bias = -0.0002;
  keyLight.shadow.normalBias = 0.02;
  scene.add(keyLight);
  scene.add(keyLight.target);
  const fill = new THREE.DirectionalLight(0xbdd2ff, 0.55); fill.position.set(-32, 12, 24); scene.add(fill);
  const rim = new THREE.SpotLight(0xe7c987, 1.5, 0, 0.7, 0.8, 1); rim.position.set(-16, 18, -36); scene.add(rim); scene.add(rim.target);
  scene.add(new THREE.AmbientLight(0x3c4148, 0.5));

  /* gold particle dust */
  const N = isCoarse ? 160 : 340;
  const posArr = new Float32Array(N * 3), sArr = new Float32Array(N), phArr = new Float32Array(N), spArr = new Float32Array(N);
  for (let i = 0; i < N; i++){
    posArr[i * 3] = (Math.random() - 0.5) * 72;
    posArr[i * 3 + 1] = (Math.random() - 0.5) * 48;
    posArr[i * 3 + 2] = -14 + Math.random() * 52;
    sArr[i] = 6 + Math.random() * 14;
    phArr[i] = Math.random() * TAU;
    spArr[i] = 0.25 + Math.random() * 0.8;
  }
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
  pg.setAttribute('aScale', new THREE.BufferAttribute(sArr, 1));
  pg.setAttribute('aPhase', new THREE.BufferAttribute(phArr, 1));
  pg.setAttribute('aSpeed', new THREE.BufferAttribute(spArr, 1));
  particleMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 } },
    vertexShader: `
      attribute float aScale; attribute float aPhase; attribute float aSpeed;
      uniform float uTime; varying float vA;
      void main(){
        vec3 p = position;
        p.y = mod(p.y + uTime * aSpeed * 1.6 + 24.0, 48.0) - 24.0;
        p.x += sin(uTime * 0.25 + aPhase) * 1.2;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = clamp(aScale * (150.0 / -mv.z), 1.0, 20.0);
        vA = 0.3 + 0.7 * (0.5 + 0.5 * sin(uTime * (0.5 + aSpeed) + aPhase * 6.0));
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform float uOpacity; varying float vA;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.05, d) * vA * uOpacity;
        if (a < 0.004) discard;
        vec3 col = mix(vec3(0.66, 0.53, 0.29), vec3(1.0, 0.92, 0.68), vA);
        gl_FragColor = vec4(col, a);
      }`
  });
  particles = new THREE.Points(pg, particleMat);
  scene.add(particles);

  watchRoot = new THREE.Group();
  morphGroup = new THREE.Group();
  watchRoot.add(morphGroup);
  scene.add(watchRoot);

  /* build the watch once fonts are ready so dial typography renders crisp */
  whenFontsReady(() => {
    if (!gl.ok) return;
    rebuildWatch();
    renderer.render(scene, camera);   /* first frame — marks GL ready */
    gl.ready = true;
    boot.glDone = true;
  });
}

/* ─────────────────────────────────────────────────────────────
   15. PROCEDURAL WATCH BUILDER
   ───────────────────────────────────────────────────────────── */
const MATS = {
  steel: () => mat('steel', () => new THREE.MeshPhysicalMaterial({
    color: 0xd2d6db, metalness: 1, roughness: 0.16, envMapIntensity: 1.2, clearcoat: 0.25, clearcoatRoughness: 0.3 })),
  steelBrushed: () => mat('steelBr', () => new THREE.MeshPhysicalMaterial({
    color: 0xb4bac1, metalness: 1, roughness: 0.42, envMapIntensity: 1.0, roughnessMap: brushedTex() })),
  gold: () => mat('gold', () => new THREE.MeshPhysicalMaterial({
    color: 0xd9b56c, metalness: 1, roughness: 0.17, envMapIntensity: 1.25, clearcoat: 0.3, clearcoatRoughness: 0.25 })),
  goldBrushed: () => mat('goldBr', () => new THREE.MeshPhysicalMaterial({
    color: 0xc7a25e, metalness: 1, roughness: 0.4, envMapIntensity: 1.05, roughnessMap: brushedTex() })),
  ceramic: () => mat('ceramic', () => new THREE.MeshPhysicalMaterial({
    color: 0x0b0c10, metalness: 0.35, roughness: 0.07, envMapIntensity: 1.5, clearcoat: 1, clearcoatRoughness: 0.06 })),
  ceramicBlue: () => mat('cerBlue', () => new THREE.MeshPhysicalMaterial({
    color: 0x0d2c55, metalness: 0.35, roughness: 0.07, envMapIntensity: 1.5, clearcoat: 1, clearcoatRoughness: 0.06 })),
  ceramicRed: () => mat('cerRed', () => new THREE.MeshPhysicalMaterial({
    color: 0x8e1f1c, metalness: 0.35, roughness: 0.07, envMapIntensity: 1.5, clearcoat: 1, clearcoatRoughness: 0.06 })),
  lume: () => mat('lume', () => new THREE.MeshStandardMaterial({
    color: 0xe9f4df, emissive: 0xbcdca4, emissiveIntensity: 0.32, roughness: 0.5, metalness: 0 })),
  ruby: () => mat('ruby', () => new THREE.MeshPhysicalMaterial({
    color: 0xa41623, metalness: 0.1, roughness: 0.15, clearcoat: 1, envMapIntensity: 1.6 })),
  glass: () => mat('glass', () => new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: 0.03, transmission: 1, thickness: 0.28,
    ior: 1.52, envMapIntensity: 1.25, clearcoat: 1, clearcoatRoughness: 0.05 })),
  paintWhite: () => mat('paintW', () => new THREE.MeshBasicMaterial({ color: 0xf2efe6, toneMapped: false })),
  red: () => mat('red', () => new THREE.MeshPhysicalMaterial({
    color: 0xc73b2b, metalness: 0.65, roughness: 0.3, envMapIntensity: 1.1 })),
  rhodium: () => mat('rhodium', () => new THREE.MeshPhysicalMaterial({
    color: 0xc2c6cc, metalness: 1, roughness: 0.3, envMapIntensity: 1.05 }))
};

/* — dial texture (one big CanvasTexture per model+dial) — */
function dialTexture(modelId, dialKey){
  return cTex('dial:' + modelId + ':' + dialKey, 1024, 1024, (ctx) => {
    const m = MODELS[modelId], d = DIALS[dialKey];
    const light = dialKey === 'champagne' || dialKey === 'ivory';
    const ink = light ? '#2b2416' : '#ece7d9';
    const inkDim = light ? 'rgba(43,36,22,.55)' : 'rgba(236,231,217,.55)';
    ctx.fillStyle = d.hex; ctx.fillRect(0, 0, 1024, 1024);
    /* sunburst rays */
    ctx.save(); ctx.translate(512, 512);
    for (let i = 0; i < 540; i++){
      const a = (i / 540) * TAU;
      ctx.strokeStyle = `rgba(255,255,255,${(i % 2 ? 0.030 : 0.012) * (d.sun ? 1 : 0.3)})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * 46, Math.sin(a) * 46);
      ctx.lineTo(Math.cos(a) * 512, Math.sin(a) * 512); ctx.stroke();
    }
    ctx.restore();
    /* vignette */
    const vg = ctx.createRadialGradient(512, 512, 200, 512, 512, 512);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(0.82, 'rgba(0,0,0,0.06)'); vg.addColorStop(1, 'rgba(0,0,0,0.42)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, 1024, 1024);
    /* minute track */
    ctx.save(); ctx.translate(512, 512);
    for (let i = 0; i < 60; i++){
      const a = (i / 60) * TAU, major = i % 5 === 0;
      ctx.strokeStyle = major ? ink : inkDim;
      ctx.lineWidth = major ? 4 : 2;
      const r0 = major ? 420 : 430, r1 = 448;
      ctx.beginPath();
      ctx.moveTo(Math.sin(a) * r0, -Math.cos(a) * r0);
      ctx.lineTo(Math.sin(a) * r1, -Math.cos(a) * r1);
      ctx.stroke();
    }
    ctx.restore();
    /* brand */
    const accent = light ? '#8a6d2f' : '#c9a961';
    drawCrown(ctx, 512, 336, 46, light ? '#6d551f' : '#d9c084');
    ctx.fillStyle = ink; ctx.font = '600 27px Inter, Cairo, sans-serif';
    spacedText(ctx, modelId === 'daytona' ? 'ROLEX COSMOGRAPH' : 'OYSTER PERPETUAL', 512, 398, 7);
    ctx.font = '600 36px Inter, Cairo, sans-serif';
    spacedText(ctx, { submariner: 'SUBMARINER', daytona: 'DAYTONA', datejust: 'DATEJUST 41', gmt: 'GMT-MASTER II' }[modelId], 512, 442, 8);
    /* chronometer lines */
    ctx.fillStyle = inkDim; ctx.font = '500 21px Inter, Cairo, sans-serif';
    spacedText(ctx, 'SUPERLATIVE CHRONOMETER', 512, 678, 6);
    spacedText(ctx, 'OFFICIALLY CERTIFIED', 512, 706, 6);
    if (modelId === 'submariner'){
      ctx.fillStyle = ink; ctx.font = '700 26px Inter, Cairo, sans-serif';
      spacedText(ctx, '300 m = 1000 ft', 512, 756, 4);
    }
    /* date window */
    if (m.date !== false && modelId !== 'daytona'){
      const dx = 512 + 298, dy = 512;
      ctx.fillStyle = light ? '#fdfcf7' : '#f4f1e8';
      ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 3;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(dx - 44, dy - 33, 88, 66, 7);
      else ctx.rect(dx - 44, dy - 33, 88, 66);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#171512'; ctx.font = '700 47px Inter, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(new Date().getDate()), dx, dy + 3);
      ctx.strokeStyle = accent; ctx.lineWidth = 2.5;
      ctx.strokeRect(dx - 48, dy - 37, 96, 74);
    }
    /* chronograph subdials */
    if (modelId === 'daytona'){
      const subs = [[512 + 235, 512], [512, 512 + 235], [512 - 235, 512]];
      const subFill = light ? '#15161b' : '#e9e4d6';
      const subInk = light ? '#cfd3da' : '#33302a';
      subs.forEach(([sx, sy]) => {
        ctx.save(); ctx.translate(sx, sy);
        ctx.fillStyle = subFill; ctx.beginPath(); ctx.arc(0, 0, 118, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 3;
        for (let r = 30; r <= 105; r += 25){
          ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
        }
        for (let i = 0; i < 60; i++){
          const a = (i / 60) * TAU, maj = i % 5 === 0;
          ctx.strokeStyle = subInk; ctx.lineWidth = maj ? 3 : 1.4;
          ctx.beginPath();
          ctx.moveTo(Math.sin(a) * (maj ? 98 : 105), -Math.cos(a) * (maj ? 98 : 105));
          ctx.lineTo(Math.sin(a) * 112, -Math.cos(a) * 112);
          ctx.stroke();
        }
        ctx.restore();
      });
    }
  });
}
function numTex(text){
  return cTex('num:' + text, 128, 64, (ctx) => {
    ctx.clearRect(0, 0, 128, 64);
    ctx.fillStyle = '#f3f0e7';
    ctx.font = '700 38px Inter, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, 64, 34);
  });
}
function movementTexture(){
  return cTex('mov', 1024, 1024, (ctx) => {
    ctx.fillStyle = '#9c8c60'; ctx.fillRect(0, 0, 1024, 1024);
    ctx.save(); ctx.translate(512, 512); ctx.rotate(-0.35);
    for (let i = -7; i <= 7; i++){
      const g = ctx.createLinearGradient(i * 76, 0, i * 76 + 76, 0);
      g.addColorStop(0, 'rgba(255,255,255,.16)');
      g.addColorStop(0.5, 'rgba(255,255,255,.02)');
      g.addColorStop(1, 'rgba(0,0,0,.14)');
      ctx.fillStyle = g;
      ctx.fillRect(i * 76 - 800, -800, 76, 1600);
    }
    ctx.restore();
    const vg = ctx.createRadialGradient(512, 512, 300, 512, 512, 512);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.35)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, 1024, 1024);
    ctx.strokeStyle = 'rgba(60,50,25,.5)'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(512, 512, 470, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.arc(512, 512, 430, 0, TAU); ctx.stroke();
    /* jewels */
    [[512, 512], [300, 400], [700, 430], [420, 720], [650, 690]].forEach(([jx, jy]) => {
      ctx.fillStyle = '#8e1622';
      ctx.beginPath(); ctx.arc(jx, jy, 13, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(jx, jy, 19, 0, TAU); ctx.stroke();
    });
    /* screws */
    [[350, 560], [600, 320], [560, 800]].forEach(([jx, jy]) => {
      ctx.fillStyle = '#b6b9bd';
      ctx.beginPath(); ctx.arc(jx, jy, 15, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#5a5c60'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(jx - 9, jy); ctx.lineTo(jx + 9, jy); ctx.stroke();
    });
    ctx.fillStyle = 'rgba(40,32,14,.85)';
    ctx.font = '600 30px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    spacedText(ctx, 'CALIBRE 3235', 512, 890, 8);
    spacedText(ctx, 'SWISS MADE', 512, 940, 10);
  });
}
function casebackTexture(){
  return cTex('back', 512, 512, (ctx) => {
    ctx.fillStyle = '#3a3d42'; ctx.fillRect(0, 0, 512, 512);
    const vg = ctx.createRadialGradient(256, 256, 60, 256, 256, 256);
    vg.addColorStop(0, 'rgba(255,255,255,.08)'); vg.addColorStop(1, 'rgba(0,0,0,.45)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, 512, 512);
    for (let r = 70; r < 250; r += 16){
      ctx.strokeStyle = 'rgba(0,0,0,.28)'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(256, 256, r, 0, TAU); ctx.stroke();
    }
    drawCrown(ctx, 256, 256, 64, '#c9a961');
    /* circular engraved text */
    const label = '• ROLEX • GENEVA • SWISS MADE • OYSTER ';
    ctx.save(); ctx.translate(256, 256);
    ctx.font = '700 26px Inter, sans-serif';
    ctx.fillStyle = 'rgba(220,215,200,.65)';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const R = 218;
    for (let i = 0; i < label.length; i++){
      const a = (i / label.length) * TAU;
      ctx.save();
      ctx.rotate(a);
      ctx.translate(0, -R);
      ctx.fillText(label[i], 0, 0);
      ctx.restore();
    }
    ctx.restore();
  });
}

/* — small geometry helpers — */
function roundedRectShape(w, h, r){
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
function gearShape(r, teeth){
  const s = new THREE.Shape();
  const step = TAU / teeth;
  for (let i = 0; i < teeth; i++){
    const a0 = i * step, a1 = a0 + step * 0.4, a2 = a0 + step * 0.5, a3 = a0 + step * 0.9;
    const ro = r, ri = r * 0.78;
    if (i === 0) s.moveTo(Math.cos(a0) * ri, Math.sin(a0) * ri);
    s.lineTo(Math.cos(a1) * ri, Math.sin(a1) * ri);
    s.lineTo(Math.cos(a1) * ro, Math.sin(a1) * ro);
    s.lineTo(Math.cos(a3) * ro, Math.sin(a3) * ro);
    s.lineTo(Math.cos(a3) * ri, Math.sin(a3) * ri);
    s.lineTo(Math.cos(a3 + step * 0.1) * ri, Math.sin(a3 + step * 0.1) * ri);
  }
  s.closePath();
  const hole = new THREE.Path(); hole.absarc(0, 0, r * 0.22, 0, TAU, true);
  s.holes.push(hole);
  return s;
}
function latheMesh(points, segments, material, phiStart, phiLength){
  const g = new THREE.LatheGeometry(
    points.map(p => new THREE.Vector2(p[0], p[1])), segments, phiStart || 0, phiLength || TAU);
  const mesh = new THREE.Mesh(g, material);
  mesh.rotation.x = Math.PI / 2;      /* lathe axis Y → watch axis Z */
  return mesh;
}

/* — complete watch — */
function buildWatchFull(modelId, cfg){
  const m = MODELS[modelId];
  const root = new THREE.Group();
  const caseGold = cfg.bracelet === 'gold';
  const accentIsGold = caseGold || m.accent === 'gold';
  const caseMat = caseGold ? MATS.gold() : MATS.steel();
  const accentMat = accentIsGold ? MATS.gold() : MATS.steel();
  const groups = {};
  ['case', 'bezel', 'crystal', 'dial', 'hands', 'movement', 'caseback', 'bracelet'].forEach(k => {
    groups[k] = new THREE.Group(); root.add(groups[k]);
  });

  /* CASE — open monobloc tube */
  const caseBody = latheMesh(
    [[6.4, -3.8], [9.2, -2.7], [10.15, -1.15], [10.15, 1.15], [9.5, 2.1], [8.78, 2.55], [6.4, 2.55]],
    128, caseMat);
  caseBody.material.side = THREE.DoubleSide;
  groups.case.add(caseBody);

  /* lugs */
  const lugGeo = geo('lug', () => new THREE.ExtrudeGeometry(
    roundedRectShape(2.35, 4.5, 0.7),
    { depth: 1.6, bevelEnabled: true, bevelThickness: 0.22, bevelSize: 0.22, bevelSegments: 2, steps: 1 }));
  [[-5.4, 11.1, -0.1], [5.4, 11.1, -0.1], [-5.4, -11.1, 0.1], [5.4, -11.1, 0.1]].forEach(([x, y, tilt]) => {
    const lug = new THREE.Mesh(lugGeo, caseMat);
    lug.position.set(x, y, -0.85);
    lug.rotation.x = Math.PI / 2 + tilt * 3;
    lug.rotation.y = Math.PI / 2;
    groups.case.add(lug);
  });

  /* crown + guards */
  const crown = new THREE.Group();
  const crownBody = new THREE.Mesh(geo('crownB', () => new THREE.CylinderGeometry(1.02, 1.02, 1.1, 24)), caseMat);
  crownBody.rotation.z = Math.PI / 2; crown.add(crownBody);
  const crownCap = new THREE.Mesh(geo('crownC', () => new THREE.SphereGeometry(0.78, 20, 14)), caseMat);
  crownCap.position.x = 0.62; crownCap.scale.set(0.55, 1, 1); crown.add(crownCap);
  const ridgeGeo = geo('crownR', () => new THREE.BoxGeometry(1.05, 0.24, 0.3));
  for (let i = 0; i < 14; i++){
    const a = (i / 14) * TAU;
    const ridge = new THREE.Mesh(ridgeGeo, caseMat);
    ridge.position.set(0, Math.cos(a) * 1.02, Math.sin(a) * 1.02);
    ridge.rotation.x = -a;
    crown.add(ridge);
  }
  crown.position.set(10.65, 0, 0.1);
  groups.case.add(crown);
  const guardGeo = geo('guard', () => new THREE.SphereGeometry(1.25, 18, 14));
  [-1, 1].forEach(sy => {
    const guard = new THREE.Mesh(guardGeo, caseMat);
    guard.position.set(9.75, sy * 1.85, 0.1);
    guard.scale.set(1.05, 0.72, 1.3);
    groups.case.add(guard);
  });

  /* DIAL */
  const dialMat = mat('dialM:' + modelId + ':' + cfg.dial, () => new THREE.MeshPhysicalMaterial({
    map: dialTexture(modelId, cfg.dial), roughness: 0.5, metalness: 0.08, clearcoat: 0.6, clearcoatRoughness: 0.25,
    envMapIntensity: 0.7
  }));
  dialMat.map = dialTexture(modelId, cfg.dial);
  const dial = new THREE.Mesh(geo('dialDisc', () => new THREE.CircleGeometry(8.02, 96)), dialMat);
  dial.position.z = 1.85;
  groups.dial.add(dial);
  const dialBase = new THREE.Mesh(geo('dialBase', () => new THREE.CircleGeometry(8.02, 64)),
    mat('dialBaseM', () => new THREE.MeshStandardMaterial({ color: 0x51545a, metalness: 0.8, roughness: 0.5 })));
  dialBase.position.z = 1.7; dialBase.rotation.y = Math.PI;
  groups.dial.add(dialBase);
  const rehaut = latheMesh([[7.85, 1.78], [8.25, 2.56]], 96, caseMat);
  groups.dial.add(rehaut);

  /* indices */
  const markerLayout = {
    submariner: { 12: 'triangle', 3: null, 6: 'dot', 9: 'dot' },
    daytona:    { 12: 'double', 3: null, 6: null, 9: null },
    datejust:   { 12: 'double' },
    gmt:        { 12: 'triangle', 3: null }
  }[modelId];
  const batonGeo = geo('baton', () => new THREE.BoxGeometry(0.6, 1.45, 0.34));
  const lumeGeo = geo('lumeB', () => new THREE.BoxGeometry(0.34, 1.1, 0.14));
  const dotGeo = geo('dotIdx', () => new THREE.CylinderGeometry(0.34, 0.34, 0.3, 20));
  const triGeo = geo('triIdx', () => new THREE.ExtrudeGeometry((() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0.72); s.lineTo(-0.72, -0.5); s.lineTo(0.72, -0.5); s.closePath(); return s;
  })(), { depth: 0.3, bevelEnabled: false }));
  const ringMat = accentMat;
  for (let h = 0; h < 12; h++){
    const kind = markerLayout[h] === undefined ? 'baton' : markerLayout[h];
    if (!kind) continue;
    const a = (h / 12) * TAU;
    const px = Math.sin(a) * 6.2, py = Math.cos(a) * 6.2;
    const mk = new THREE.Group();
    mk.position.set(px, py, 1.95);
    mk.rotation.z = -a;
    if (kind === 'baton'){
      const b = new THREE.Mesh(batonGeo, ringMat); mk.add(b);
      const l = new THREE.Mesh(lumeGeo, MATS.lume()); l.position.z = 0.21; mk.add(l);
    } else if (kind === 'double'){
      [-0.42, 0.42].forEach(off => {
        const b = new THREE.Mesh(batonGeo, ringMat); b.scale.x = 0.85; b.position.x = off; mk.add(b);
        const l = new THREE.Mesh(lumeGeo, MATS.lume()); l.scale.x = 0.8; l.position.set(off, 0, 0.21); mk.add(l);
      });
    } else if (kind === 'dot'){
      const dt = new THREE.Mesh(dotGeo, ringMat); dt.rotation.x = Math.PI / 2; mk.add(dt);
      const l = new THREE.Mesh(dotGeo, MATS.lume()); l.rotation.x = Math.PI / 2; l.scale.set(0.62, 1, 0.5); l.position.z = 0.12; mk.add(l);
    } else if (kind === 'triangle'){
      const tr = new THREE.Mesh(triGeo, ringMat); mk.add(tr);
      const pearl = new THREE.Mesh(dotGeo, MATS.lume());
      pearl.rotation.x = Math.PI / 2; pearl.scale.set(0.45, 0.45, 0.4); pearl.position.set(0, 0.78, 0.05);
      mk.add(pearl);
    }
    groups.dial.add(mk);
  }

  /* BEZEL */
  const bezelOpt = cfg.bezel;
  const bezelBase = bezelOpt === 'fluted' ? MATS.gold() : (bezelOpt === 'steel' ? MATS.steel() : MATS.ceramic());
  const bezelProfile = [[6.9, 2.5], [8.55, 2.5], [8.62, 2.86], [8.5, 3.28], [8.05, 3.6], [7.2, 3.62], [6.9, 3.18]];
  if (modelId === 'gmt' && bezelOpt !== 'fluted' && bezelOpt !== 'steel'){
    /* Pepsi two-half ceramic */
    const blue = latheMesh(bezelProfile, 64, MATS.ceramicBlue(), Math.PI / 2, Math.PI);
    const red = latheMesh(bezelProfile, 64, MATS.ceramicRed(), -Math.PI / 2, Math.PI);
    groups.bezel.add(blue, red);
  } else if (modelId === 'gmt' && bezelOpt === 'steel'){
    groups.bezel.add(latheMesh(bezelProfile, 128, MATS.steel()));
  } else {
    const ring = latheMesh(bezelProfile, 128, bezelBase);
    ring.material.side = THREE.DoubleSide;
    groups.bezel.add(ring);
  }
  /* fluting teeth */
  if (bezelOpt === 'fluted'){
    const teeth = new THREE.InstancedMesh(
      geo('tooth', () => new THREE.BoxGeometry(0.52, 1.0, 0.98)), MATS.gold(), 64);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 64; i++){
      const th = (i / 64) * TAU;
      dummy.position.set(Math.sin(th) * 7.86, Math.cos(th) * 7.86, 3.16);
      dummy.rotation.set(0, 0, th);
      dummy.rotateX(0.785);
      dummy.updateMatrix();
      teeth.setMatrixAt(i, dummy.matrix);
    }
    teeth.instanceMatrix.needsUpdate = true;
    groups.bezel.add(teeth);
  }
  /* bezel markers per model shape */
  const bezMetal = bezelOpt === 'fluted' ? MATS.gold() : MATS.steel();
  const addPlate = (text, a, r, z, scale) => {
    const g = new THREE.PlaneGeometry(0.62 * text.length + 0.45, 1.02);
    const mesh = new THREE.Mesh(g, mat('plate:' + text, () => new THREE.MeshBasicMaterial({
      map: numTex(text), transparent: true, toneMapped: false, depthWrite: false })));
    mesh.position.set(Math.sin(a) * r, Math.cos(a) * r, z);
    mesh.rotation.z = -a;
    if (scale) mesh.scale.setScalar(scale);
    groups.bezel.add(mesh);
  };
  if (modelId === 'submariner' || modelId === 'gmt'){
    const labels = modelId === 'submariner'
      ? [[10, 60], [20, 120], [30, 180], [40, 240], [50, 300]]
      : [[24, 0], [2, 30], [4, 60], [6, 90], [8, 120], [10, 150], [12, 180], [14, 210], [16, 240], [18, 270], [20, 300], [22, 330]];
    labels.forEach(([lb, deg]) => addPlate(String(lb), (deg / 360) * TAU, modelId === 'submariner' ? 7.62 : 7.66, 3.42, modelId === 'submariner' ? 0.86 : 1));
    /* small lume dots between numerals */
    const dotC = geo('bDot', () => new THREE.CylinderGeometry(0.15, 0.15, 0.12, 12));
    const stepDeg = modelId === 'submariner' ? 30 : 15;
    for (let deg = stepDeg; deg < 360; deg += stepDeg){
      const isNumeral = labels.some(([, d]) => d === deg) || (modelId === 'submariner' && deg === 0);
      if (isNumeral) continue;
      const a = (deg / 360) * TAU;
      const dot = new THREE.Mesh(dotC, MATS.lume());
      dot.rotation.x = Math.PI / 2;
      dot.position.set(Math.sin(a) * 7.62, Math.cos(a) * 7.62, 3.5);
      groups.bezel.add(dot);
    }
    if (modelId === 'submariner'){
      const tri = new THREE.Mesh(triGeo, bezMetal);
      tri.position.set(0, 7.55, 3.32); tri.scale.setScalar(0.95);
      groups.bezel.add(tri);
      const pearl = new THREE.Mesh(dotGeo, MATS.lume());
      pearl.rotation.x = Math.PI / 2; pearl.scale.set(0.4, 0.4, 0.4);
      pearl.position.set(0, 8.15, 3.4);
      groups.bezel.add(pearl);
    }
  } else if (modelId === 'daytona'){
    /* tachymeter ticks */
    const minor = new THREE.InstancedMesh(geo('tickMin', () => new THREE.BoxGeometry(0.1, 0.5, 0.16)), bezMetal, 48);
    const major = new THREE.InstancedMesh(geo('tickMaj', () => new THREE.BoxGeometry(0.16, 0.85, 0.18)), bezMetal, 12);
    const dm = new THREE.Object3D();
    let im = 0, IM = 0;
    for (let deg = 0; deg < 360; deg += 5){
      const a = (deg / 360) * TAU, maj = deg % 30 === 0;
      dm.position.set(Math.sin(a) * 7.85, Math.cos(a) * 7.85, 3.42);
      dm.rotation.set(0, 0, -a);
      dm.updateMatrix();
      if (maj) major.setMatrixAt(IM++, dm.matrix);
      else minor.setMatrixAt(im++, dm.matrix);
    }
    minor.instanceMatrix.needsUpdate = true;
    major.instanceMatrix.needsUpdate = true;
    groups.bezel.add(minor, major);
  }

  /* CRYSTAL + cyclops */
  const crystal = latheMesh(
    [[0.01, 0], [2.8, 0.06], [5.4, 0.2], [7.15, 0.44], [7.95, 0.74], [8.14, 0.92], [8.2, 0.6]],
    96, MATS.glass());
  crystal.position.z = 2.56;
  groups.crystal.add(crystal);
  if (modelId !== 'daytona'){
    const cyclops = new THREE.Mesh(geo('cyc', () => new THREE.SphereGeometry(1.28, 24, 16, 0, TAU, 0, 1.02)), MATS.glass());
    cyclops.scale.set(1.35, 0.72, 0.5);
    cyclops.position.set(4.72, 0, 2.98);
    cyclops.rotation.x = Math.PI / 2;
    groups.crystal.add(cyclops);
  }

  /* HANDS */
  const handMetal = accentMat;
  const mkHand = (len, wid, z, tailLen) => {
    const g = new THREE.Group();
    const stem = new THREE.Mesh(new THREE.BoxGeometry(wid, len, 0.2), handMetal);
    stem.position.y = len / 2 - tailLen;
    g.add(stem);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(wid * 1.15, tailLen * 2 + 0.6, 0.2), handMetal);
    tail.position.y = -tailLen - 0.1;
    g.add(tail);
    g.position.z = z;
    return g;
  };
  const hourG = new THREE.Group();
  const hourStem = new THREE.Mesh(geo('hStem', () => new THREE.BoxGeometry(0.92, 3.1, 0.22)), handMetal);
  hourStem.position.y = 2.0; hourG.add(hourStem);
  const merRing = new THREE.Mesh(geo('merR', () => new THREE.TorusGeometry(0.92, 0.17, 12, 36)), handMetal);
  merRing.position.y = 4.5; hourG.add(merRing);
  const merLume = new THREE.Mesh(geo('merL', () => new THREE.CylinderGeometry(0.7, 0.7, 0.1, 24)), MATS.lume());
  merLume.rotation.x = Math.PI / 2; merLume.position.y = 4.5; hourG.add(merLume);
  for (let i = 0; i < 3; i++){
    const a = (i / 3) * TAU + Math.PI / 6;
    const spoke = new THREE.Mesh(geo('hSpk', () => new THREE.BoxGeometry(0.15, 0.92, 0.12)), handMetal);
    spoke.position.set(Math.sin(a) * 0.48, 4.5 + Math.cos(a) * 0.48, 0);
    spoke.rotation.z = -a;
    hourG.add(spoke);
  }
  const hourTail = new THREE.Mesh(geo('hTail', () => new THREE.BoxGeometry(1.05, 1.4, 0.22)), handMetal);
  hourTail.position.y = -0.55; hourG.add(hourTail);
  hourG.position.z = 2.02;
  groups.hands.add(hourG);

  const minuteG = mkHand(6.35, 0.68, 2.18, 1.0);
  const minLume = new THREE.Mesh(geo('mLume', () => new THREE.BoxGeometry(0.36, 2.5, 0.1)), MATS.lume());
  minLume.position.set(0, 4.9, 0.14); minuteG.add(minLume);
  groups.hands.add(minuteG);

  const secondG = mkHand(7.0, 0.2, 2.34, 1.5);
  const cw = new THREE.Mesh(geo('secCW', () => new THREE.CylinderGeometry(0.5, 0.5, 0.16, 20)), handMetal);
  cw.rotation.x = Math.PI / 2; cw.position.y = -1.35; secondG.add(cw);
  const secLume = new THREE.Mesh(geo('sLume', () => new THREE.BoxGeometry(0.26, 0.85, 0.1)), MATS.lume());
  secLume.position.set(0, 5.9, 0.12); secondG.add(secLume);
  groups.hands.add(secondG);

  let gmtG = null;
  if (modelId === 'gmt'){
    gmtG = mkHand(5.3, 0.44, 1.96, 1.2);
    gmtG.traverse(o => { if (o.isMesh) o.material = MATS.red(); });
    const arrow = new THREE.Mesh(geo('gmtArrow', () => {
      const s = new THREE.Shape();
      s.moveTo(0, 1.05); s.lineTo(-0.55, -0.35); s.lineTo(0.55, -0.35); s.closePath();
      return new THREE.ExtrudeGeometry(s, { depth: 0.16, bevelEnabled: false });
    }), MATS.red());
    arrow.position.set(0, 5.85, 0);
    gmtG.add(arrow);
    groups.hands.add(gmtG);
  }
  /* subdial hands (Daytona) */
  const subHands = [];
  if (modelId === 'daytona'){
    [[512 + 235, 512], [512, 512 + 235], [512 - 235, 512]].forEach(([sx, sy]) => {
      const sh = new THREE.Group();
      const needle = new THREE.Mesh(geo('subN', () => new THREE.BoxGeometry(0.16, 1.9, 0.1)), handMetal);
      needle.position.y = 0.75; sh.add(needle);
      const pin = new THREE.Mesh(geo('subP', () => new THREE.CylinderGeometry(0.16, 0.16, 0.14, 12)), handMetal);
      pin.rotation.x = Math.PI / 2; sh.add(pin);
      sh.position.set((sx - 512) / 512 * 8.02, -(sy - 512) / 512 * 8.02, 1.98);
      groups.hands.add(sh);
      subHands.push(sh);
    });
  }
  /* center cap */
  const cap = new THREE.Mesh(geo('cap', () => new THREE.CylinderGeometry(0.42, 0.5, 0.3, 24)), handMetal);
  cap.rotation.x = Math.PI / 2; cap.position.z = 2.42;
  groups.hands.add(cap);

  /* MOVEMENT (revealed in exploded view) */
  const movPlate = new THREE.Mesh(geo('movP', () => new THREE.CircleGeometry(7.55, 72)),
    mat('movM', () => new THREE.MeshStandardMaterial({ map: movementTexture(), metalness: 0.55, roughness: 0.42 })));
  movPlate.position.z = -2.1;
  groups.movement.add(movPlate);
  const bridge = new THREE.Mesh(geo('bridge', () => new THREE.ExtrudeGeometry(
    roundedRectShape(5.6, 3.1, 0.7), { depth: 0.34, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 1 })), MATS.rhodium());
  bridge.position.set(-1.4, 2.1, -1.85); bridge.rotation.z = 0.16;
  groups.movement.add(bridge);
  const gear1 = new THREE.Mesh(geo('gear1', () => new THREE.ExtrudeGeometry(gearShape(1.5, 14), { depth: 0.3, bevelEnabled: false })), MATS.gold());
  gear1.position.set(2.6, -1.3, -1.72);
  const gear2 = new THREE.Mesh(geo('gear2', () => new THREE.ExtrudeGeometry(gearShape(0.95, 10), { depth: 0.3, bevelEnabled: false })), MATS.rhodium());
  gear2.position.set(0.4, -3.2, -1.68);
  groups.movement.add(gear1, gear2);
  const balance = new THREE.Group();
  const balRim = new THREE.Mesh(geo('balRim', () => new THREE.TorusGeometry(1.45, 0.17, 12, 40)), MATS.rhodium());
  balance.add(balRim);
  [-0.6, 0.6].forEach(off => {
    const spokeB = new THREE.Mesh(geo('balSp', () => new THREE.BoxGeometry(0.16, 2.9, 0.14)), MATS.rhodium());
    spokeB.position.x = off; balance.add(spokeB);
  });
  const balPin = new THREE.Mesh(geo('balPin', () => new THREE.CylinderGeometry(0.22, 0.22, 0.5, 12)), MATS.ruby());
  balPin.rotation.x = Math.PI / 2; balance.add(balPin);
  balance.position.set(-2.9, -2.5, -1.5);
  groups.movement.add(balance);
  [[2.6, -1.3], [0.4, -3.2], [-2.9, -2.5], [3.4, 2.4]].forEach(([jx, jy]) => {
    const jewel = new THREE.Mesh(geo('jewel', () => new THREE.SphereGeometry(0.19, 12, 10)), MATS.ruby());
    jewel.position.set(jx, jy, -1.4);
    groups.movement.add(jewel);
  });
  const rotor = new THREE.Mesh(geo('rotor', () => new THREE.CircleGeometry(6.8, 48, 0, Math.PI)), MATS.gold());
  rotor.rotation.y = Math.PI;
  rotor.position.z = -2.75;
  groups.movement.add(rotor);

  /* CASEBACK */
  const backRing = latheMesh(
    [[0.01, -4.32], [2.8, -4.32], [5.6, -4.24], [7.7, -4.02], [8.85, -3.7], [9.05, -3.45]], 128, caseMat);
  groups.caseback.add(backRing);
  const backFace = new THREE.Mesh(geo('backF', () => new THREE.CircleGeometry(8.85, 72)),
    mat('backM', () => new THREE.MeshStandardMaterial({ map: casebackTexture(), metalness: 0.85, roughness: 0.35 })));
  const bt = casebackTexture();
  bt.wrapS = THREE.RepeatWrapping; bt.repeat.x = -1;
  backFace.material.map = bt;
  backFace.rotation.y = Math.PI;
  backFace.position.z = -4.36;
  groups.caseback.add(backFace);

  /* BRACELET — instanced links along a wrist curve */
  const armTop = [[0, 12.15, 0.6], [0, 14.6, -2.2], [0, 16.6, -6.6], [0, 16.2, -11.6],
                  [0, 13.9, -15.9], [0, 10.2, -18.9], [0, 5.6, -20.6], [0, 0.9, -21.2]];
  const armBot = armTop.map(p => [p[0], -p[1], p[2]]);
  const styleRows = cfg.style === 'jubilee'
    ? [{ w: 1.05, th: 1.35, r: 0.42 }, { w: 1.45, th: 1.35, r: 0.45 }, { w: 2.35, th: 1.6, r: 0.7, center: true }, { w: 1.45, th: 1.35, r: 0.45 }, { w: 1.05, th: 1.35, r: 0.42 }]
    : [{ w: 2.52, th: 1.45, r: 0.4 }, { w: 3.3, th: 1.68, r: 0.45, center: true }, { w: 2.52, th: 1.45, r: 0.4 }];
  const outerMat = caseGold ? MATS.goldBrushed() : MATS.steelBrushed();
  const centerMat = cfg.bracelet === 'twotone' ? MATS.gold() : (caseGold ? MATS.gold() : MATS.steel());
  const linkLen = 2.3;
  for (const armPts of [armTop, armBot]){
    const curve = new THREE.CatmullRomCurve3(armPts.map(p => new THREE.Vector3(p[0], p[1], p[2])));
    const len = curve.getLength();
    const n = Math.max(3, Math.floor(len / 2.62));
    const dummies = [];
    for (let i = 0; i <= n; i++){
      const tt = i / n;
      const p = curve.getPointAt(clamp01(tt * 0.985 + 0.008));
      const tan = curve.getTangentAt(clamp01(tt * 0.985 + 0.008));
      const d = new THREE.Object3D();
      d.position.copy(p);
      d.lookAt(p.clone().add(tan));
      const taper = 1 - 0.26 * tt;
      d.scale.set(taper, 1, 1);
      d.updateMatrix();
      dummies.push(d.matrix);
    }
    styleRows.forEach((row, ri) => {
      const rowKey = `link:${cfg.style}:${ri}:${caseGold ? 'g' : cfg.bracelet === 'twotone' ? 'tt' : 's'}`;
      const rowGeo = geo(rowKey, () => new THREE.ExtrudeGeometry(
        roundedRectShape(row.w, row.th, row.r),
        { depth: linkLen - 0.3, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.1, bevelSegments: 2 }));
      const im = new THREE.InstancedMesh(rowGeo, row.center ? centerMat : outerMat, dummies.length);
      const dummy2 = new THREE.Object3D();
      dummies.forEach((mtx, k) => {
        dummy2.matrix.copy(mtx);
        dummy2.matrix.decompose(dummy2.position, dummy2.quaternion, dummy2.scale);
        dummy2.position.x = (ri - (styleRows.length - 1) / 2) * ((styleRows.length === 3) ? 2.86 : 1.32);
        dummy2.updateMatrix();
        im.setMatrixAt(k, dummy2.matrix);
      });
      im.instanceMatrix.needsUpdate = true;
      groups.bracelet.add(im);
    });
  }

  /* shadows */
  root.traverse(o => {
    if (o.isMesh){
      o.castShadow = !(o.material === MATS.glass() || o.material.transparent);
      o.receiveShadow = true;
    }
  });
  groups.crystal.traverse(o => { o.castShadow = false; });

  return {
    root, groups,
    refs: { bezel: groups.bezel, crystal: groups.crystal, dial: groups.dial, hands: groups.hands,
            movement: groups.movement, caseback: groups.caseback,
            hour: hourG, minute: minuteG, second: secondG, gmt: gmtG, subs: subHands,
            balance, gear1, gear2, rotor },
    cfg: { model: modelId, ...cfg }
  };
}

function disposeWatch(){
  if (!watch) return;
  watch.root.traverse(o => {
    if (o.isMesh || o.isInstancedMesh){
      if (o.geometry && !(o.geometry.userData && o.geometry.userData.shared)) o.geometry.dispose();
    }
  });
  morphGroup.remove(watch.root);
  watch = null;
}
function rebuildWatch(){
  if (!gl.ok) return;
  disposeWatch();
  const id = previewId || state.model;
  const cfg = previewId ? modelDefaults(previewId) : { ...state.cfg };
  watch = buildWatchFull(id, cfg);
  morphGroup.add(watch.root);
}

/* ─────────────────────────────────────────────────────────────
   16. MODEL SWITCHING + CHOREOGRAPHY
   ───────────────────────────────────────────────────────────── */
function updateGiantWord(instant){
  const el = $('#giant-word'); if (!el) return;
  const word = tx(MODELS[previewId || state.model].word);
  const swap = () => { el.textContent = word; el.classList.remove('swap'); };
  if (instant || prefersReduced){ el.textContent = word; return; }
  el.classList.add('swap');
  setTimeout(swap, 420);
}
function morphSwap(rebuild, durIn, durOut){
  if (!gl.ok || switching){ rebuild && rebuild(); return; }
  switching = true;
  const done = () => { switching = false; };
  if (!hasGSAP || prefersReduced){ rebuild && rebuild(); done(); return; }
  gsap.timeline({ onComplete: done })
    .to(morphGroup.scale, { x: 0.001, y: 0.001, z: 0.001, duration: durIn, ease: 'power3.in' })
    .to(morphGroup.rotation, { y: '+=1.1', duration: durIn, ease: 'power3.in' }, 0)
    .add(() => { rebuild && rebuild(); })
    .to(morphGroup.scale, { x: 1, y: 1, z: 1, duration: durOut, ease: 'back.out(1.4)' })
    .to(morphGroup.rotation, { y: 0, duration: durOut, ease: 'power3.out' }, '<');
}
function selectModel(id, silent){
  if (id === state.model){ if (!silent) scrollToSel('#collection'); return; }
  state.model = id;
  state.cfg = modelDefaults(id);
  previewId = null;
  renderCollection(); renderConfigurator(); updateGiantWord();
  morphSwap(rebuildWatch, 0.42, 0.85);
  if (!silent) scrollToSel('#collection');
}
function previewModel(id){
  if (!gl.ok || switching || id === previewId) return;
  if (id !== state.model && JSON.stringify(state.cfg) !== JSON.stringify(modelDefaults(state.model))) return;
  if (id === state.model && previewId === null) return;
  previewId = id === state.model ? null : id;
  updateGiantWord();
  morphSwap(rebuildWatch, 0.3, 0.55);
}
function rebuildWatchSoft(){
  if (!gl.ok) return;
  if (!hasGSAP || prefersReduced){ rebuildWatch(); return; }
  gsap.timeline()
    .to(morphGroup.scale, { x: 0.9, y: 0.9, z: 0.9, duration: 0.18, ease: 'power2.in' })
    .add(() => rebuildWatch())
    .to(morphGroup.scale, { x: 1, y: 1, z: 1, duration: 0.5, ease: 'back.out(2)' });
}
function applyConfigOption(opt, val){
  state.cfg[opt] = val;
  renderConfigurator();
  rebuildWatchSoft();
}

/* camera path across the story */
const CAM_PATH = [
  { p: 0.00, pos: [0, 1.5, 76],   look: [0, 0.5, 0],   ex: 0,    rot: [0, 0, 0] },
  { p: 0.10, pos: [0, 3, 73],     look: [0, 0.5, 0],   ex: 0,    rot: [0, 0.55, 0] },
  { p: 0.30, pos: [30, 10, 44],   look: [3, 1.5, 1],   ex: 0,    rot: [0.06, -0.78, 0] },
  { p: 0.48, pos: [38, 6, 12],    look: [0, 0.5, 0],   ex: 0.55, rot: [0.05, -1.4, 0] },
  { p: 0.66, pos: [6, 22, -42],   look: [0, 0.5, -2],  ex: 1,    rot: [0.16, -2.9, 0] },
  { p: 0.82, pos: [-30, 10, -6],  look: [0, 0.5, 0],   ex: 0.3,  rot: [0.08, 2.9, 0] },
  { p: 1.00, pos: [0, 1.5, 76],   look: [0, 0.5, 0],   ex: 0,    rot: [0, 0.0, 0] }
];
const camState = { pos: new THREE.Vector3(0, 1.5, 76), look: new THREE.Vector3(0, 0.5, 0), ex: 0, rotY: 0, rotX: 0 };
function samplePath(p){
  let i = 0;
  while (i < CAM_PATH.length - 2 && p > CAM_PATH[i + 1].p) i++;
  const a = CAM_PATH[i], b = CAM_PATH[i + 1];
  let tt = clamp01((p - a.p) / (b.p - a.p));
  tt = smoothstep(tt);
  return {
    pos: [lerp(a.pos[0], b.pos[0], tt), lerp(a.pos[1], b.pos[1], tt), lerp(a.pos[2], b.pos[2], tt)],
    look: [lerp(a.look[0], b.look[0], tt), lerp(a.look[1], b.look[1], tt), lerp(a.look[2], b.look[2], tt)],
    ex: lerp(a.ex, b.ex, tt),
    rotY: lerp(a.rot[1], b.rot[1], tt),
    rotX: lerp(a.rot[0], b.rot[0], tt)
  };
}

/* section-driven watch placement */
function bandState(y){
  const rtl = document.documentElement.dir === 'rtl' ? -1 : 1;
  const mob = window.innerWidth < 1024;
  const hero    = mob ? { x: 0, y: 7.5, s: 0.72 } : { x: 0, y: 4, s: 1.02 };
  const storyC  = mob ? { x: 0, y: 0,  s: 0.8 }  : { x: 0, y: 1.5, s: 1 };
  const colS    = mob ? { x: 0, y: 6,  s: 0.58 } : { x: rtl * 16.5, y: -1, s: 0.8 };
  const cfgS    = mob ? { x: 0, y: 6.5, s: 0.62 } : { x: rtl * 15, y: -2, s: 0.92 };
  const vh = M.vh || window.innerHeight;
  const anchors = [
    { y: -1e9, st: hero },
    { y: M.storyTop - vh * 0.7, st: storyC },
    { y: M.colTop - vh * 0.55, st: storyC },
    { y: M.colTop + vh * 0.25, st: colS },
    { y: M.cfgTop - vh * 0.45, st: colS },
    { y: M.cfgTop + vh * 0.3, st: cfgS },
    { y: 1e9, st: cfgS }
  ];
  let i = 0;
  while (i < anchors.length - 2 && y > anchors[i + 1].y) i++;
  const A = anchors[i], B = anchors[i + 1];
  const span = B.y - A.y;
  const tt = span > 0 ? smoothstep(clamp01((y - A.y) / span)) : 1;
  return { x: lerp(A.st.x, B.st.x, tt), y: lerp(A.st.y, B.st.y, tt), s: lerp(A.st.s, B.st.s, tt) };
}

/* pointer interaction — parallax + drag rotate + pinch zoom */
const pointer = { mx: 0, my: 0, smx: 0, smy: 0, dragging: false, lastX: 0, userRotY: 0, pinch: 0 };
function initStages(){
  window.addEventListener('pointermove', e => {
    pointer.mx = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.my = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });
  $$('[data-tilt-stage]').forEach(stage => {
    stage.style.touchAction = 'pan-y';
    let pid = null, startX = 0, moved = 0;
    stage.addEventListener('pointerdown', e => {
      if (e.target.closest && e.target.closest('a,button,input,select')) return;
      pid = e.pointerId; startX = e.clientX; moved = 0; pointer.lastX = e.clientX;
      pointer.dragging = true;
    });
    stage.addEventListener('pointermove', e => {
      if (!pointer.dragging || e.pointerId !== pid) return;
      const dx = e.clientX - pointer.lastX;
      pointer.lastX = e.clientX; moved += Math.abs(dx);
      pointer.userRotY += dx * 0.006;
    });
    const end = () => { if (pointer.dragging){ pointer.dragging = false; pid = null; } };
    stage.addEventListener('pointerup', end);
    stage.addEventListener('pointercancel', end);
    stage.addEventListener('pointerleave', end);
    /* pinch to zoom (two fingers) */
    stage.addEventListener('touchstart', e => {
      if (e.touches.length === 2){
        pointer.pinch = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY);
      }
    }, { passive: true });
    stage.addEventListener('touchmove', e => {
      if (e.touches.length === 2 && pointer.pinch > 0){
        e.preventDefault();
        const d = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY);
        gl.zoomT = clamp(gl.zoomT * (d / pointer.pinch), 0.62, 1.55);
        pointer.pinch = d;
      }
    }, { passive: false });
    stage.addEventListener('touchend', () => { pointer.pinch = 0; }, { passive: true });
  });
}

/* ─────────────────────────────────────────────────────────────
   17. MASTER LOOP + INIT + PRELOADER
   ───────────────────────────────────────────────────────────── */
const boot = { fonts: false, load: false, glDone: false, min: false, loaderDone: false };
document.fonts && document.fonts.ready.then(() => { boot.fonts = true; });
setTimeout(() => { boot.fonts = true; }, 3000);
window.addEventListener('load', () => { boot.load = true; });
setTimeout(() => { boot.load = true; }, 4000);

document.addEventListener('visibilitychange', () => { gl.paused = document.hidden; });

function glUpdate(dt, time){
  const y = S.y;
  const vh = M.vh || window.innerHeight;

  /* story progress → camera flight + explode factor */
  const spRaw = (y - (M.storyTop - vh * 0.8)) / Math.max(1, (M.storyH - vh * 0.25));
  const sp = clamp01(spRaw);
  const k = samplePath(sp);
  camState.pos.x = damp(camState.pos.x, k.pos[0], 3.2, dt);
  camState.pos.y = damp(camState.pos.y, k.pos[1], 3.2, dt);
  camState.pos.z = damp(camState.pos.z, k.pos[2], 3.2, dt);
  camState.look.x = damp(camState.look.x, k.look[0], 3.2, dt);
  camState.look.y = damp(camState.look.y, k.look[1], 3.2, dt);
  camState.look.z = damp(camState.look.z, k.look[2], 3.2, dt);
  camState.ex = damp(camState.ex, prefersReduced ? 0 : k.ex, 3, dt);
  camState.rotY = damp(camState.rotY, prefersReduced ? 0 : k.rotY, 3, dt);
  camState.rotX = damp(camState.rotX, prefersReduced ? 0 : k.rotX, 3, dt);
  camera.position.copy(camState.pos);
  camera.lookAt(camState.look);

  if (watch){
    const r = watch.refs;
    /* exploded view */
    r.bezel.position.z = camState.ex * 9;
    r.crystal.position.z = camState.ex * 15;
    r.dial.position.z = camState.ex * 5.5;
    r.hands.position.z = camState.ex * 7.5;
    r.movement.position.z = -camState.ex * 7;
    r.caseback.position.z = -camState.ex * 13;
    /* bezel rotates while chapter 1 zooms in */
    const bezelSpin = smoothstep(clamp01((sp - 0.08) / 0.24)) * -0.85;
    r.bezel.rotation.z = bezelSpin;

    /* real time hands */
    const d = new Date();
    const sec = d.getSeconds() + d.getMilliseconds() / 1000;
    const min = d.getMinutes() + sec / 60;
    const hr = (d.getHours() % 12) + min / 60;
    r.second.rotation.z = -(sec / 60) * TAU;
    r.minute.rotation.z = -(min / 60) * TAU;
    r.hour.rotation.z = -(hr / 12) * TAU;
    if (r.gmt) r.gmt.rotation.z = -((((d.getHours() % 24) + GMT_DELTA_H + 48) % 24 + min / 60) / 24) * TAU;
    if (r.subs.length === 3){
      r.subs[2].rotation.z = -(sec / 60) * TAU;              /* running seconds at 9 */
      r.subs[0].rotation.z = -((min % 30) / 30) * TAU;       /* 30-min at 3 */
      r.subs[1].rotation.z = -(hr / 12) * TAU;               /* 12-hour at 6 */
    }
    /* living movement */
    r.balance.rotation.z = Math.sin(time * 9) * 1.15;
    r.gear1.rotation.z = time * 0.35;
    r.gear2.rotation.z = -time * 0.6;
    r.rotor.rotation.z = -time * 0.4;
  }

  /* watch placement band + idle motion */
  pointer.smx = damp(pointer.smx, pointer.mx, 5, dt);
  pointer.smy = damp(pointer.smy, pointer.my, 5, dt);
  if (!pointer.dragging) pointer.userRotY *= Math.exp(-dt * 0.9);
  gl.zoom = damp(gl.zoom, gl.zoomT, 6, dt);
  const band = bandState(y);
  watchRoot.position.x = damp(watchRoot.position.x, band.x, 4.2, dt);
  watchRoot.position.y = damp(watchRoot.position.y, band.y, 4.2, dt);
  const idleY = prefersReduced ? 0 : Math.sin(time * 0.22) * 0.14;
  const idleX = prefersReduced ? 0 : Math.cos(time * 0.17) * 0.045;
  watchRoot.rotation.y = camState.rotY + idleY + pointer.smx * 0.15 + pointer.userRotY;
  watchRoot.rotation.x = camState.rotX + idleX - pointer.smy * 0.1;
  const targetScale = band.s * gl.zoom;
  watchRoot.scale.setScalar(damp(watchRoot.scale.x, targetScale, 4.2, dt));

  /* lights breathe subtly */
  if (keyLight){
    keyLight.position.x = 26 + Math.sin(time * 0.21) * 9;
    keyLight.position.y = 32 + Math.cos(time * 0.17) * 5;
  }

  /* gold dust: prominent in hero, fading through story */
  if (particleMat){
    particleMat.uniforms.uTime.value = time;
    const heroFade = 1 - clamp01(y / (vh * 1.35));
    const target = prefersReduced ? 0.25 * heroFade : 0.85 * heroFade + 0.06;
    particleMat.uniforms.uOpacity.value = damp(particleMat.uniforms.uOpacity.value, target, 3, dt);
  }
}

let lastFrame = performance.now();
function frame(now){
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;
  smoothStep(dt);
  cursorStep(dt);
  if (!state.booting) navStep();
  if (gl.ok && gl.ready && !gl.paused){
    const vh = M.vh || window.innerHeight;
    const inZone = S.y < (M.craftTop || 1e9) - vh * 0.15;
    $('#gl').classList.toggle('off', !inZone);
    if (inZone){
      gl.time += dt;
      glUpdate(dt, gl.time);
      renderer.render(scene, camera);
    }
  }
}

/* preloader */
const ldPct = $('#ld-pct'), loaderEl = $('#loader');
let fontsSettled = false;
function whenFontsReady(cb){
  if (fontsSettled){ cb(); return; }
  let fired = false;
  const once = () => { if (!fired){ fired = true; fontsSettled = true; cb(); } };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(once);
  else once();
  setTimeout(once, 2600);
}
let ldShown = 0;
function loaderLoop(){
  if (boot.loaderDone) return;
  const target = 5 + (boot.fonts ? 25 : 0) + (boot.load ? 15 : 0) + (boot.glDone ? 40 : 0) + (boot.min ? 15 : 0);
  ldShown = lerp(ldShown, Math.min(target, 100), 0.08);
  if (ldShown > 99.2 && target >= 100) ldShown = 100;
  ldPct.textContent = Math.round(ldShown);
  loaderEl.setAttribute('aria-valuenow', Math.round(ldShown));
  if (ldShown >= 100 && target >= 100){ finishLoader(); return; }
  requestAnimationFrame(loaderLoop);
}
function finishLoader(){
  boot.loaderDone = true;
  state.booting = false;
  measureAll();
  loaderEl.classList.add('done');
  setTimeout(() => { loaderEl.style.display = 'none'; }, 1300);
  startReveals();
  initChapterScrub();
  if (gl.ok && hasGSAP && !prefersReduced){
    morphGroup.scale.setScalar(0.001);
    gsap.to(morphGroup.scale, { x: 1, y: 1, z: 1, duration: 1.5, ease: 'power3.out', delay: 0.25 });
    gsap.from(morphGroup.rotation, { y: -1.4, duration: 1.8, ease: 'power3.out', delay: 0.25 });
    if (particleMat) gsap.fromTo(particleMat.uniforms.uOpacity, { value: 0 }, { value: 0.85, duration: 2.2, delay: 0.5 });
  }
  if (hasST) ScrollTrigger.refresh();
}
function initChapterScrub(){
  if (!hasST || prefersReduced) return;
  $$('.chapter').forEach(ch => {
    const inner = $('.ch-inner', ch);
    if (!inner) return;
    gsap.timeline({
      scrollTrigger: { trigger: ch, start: 'top 85%', end: 'bottom 15%', scrub: 0.6 }
    })
    .fromTo(inner, { y: 70, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: 'none' }, 0)
    .to(inner, { y: -60, opacity: 0, duration: 0.3, ease: 'none' }, 0.72);
  });
}

/* boot */
window.scrollTo(0, 0);
applyLang();
$$('.currency').forEach(s => { s.value = state.currency; });
initNav();
initSmooth();
initAnchors();
initCursor();
initMagnetic();
initStages();
measureAll();
initGL();
if (!gl.ok) boot.glDone = true;
requestAnimationFrame(frame);
requestAnimationFrame(loaderLoop);
setTimeout(() => { boot.min = true; }, 1900);
/* late safety: mark GL done if it somehow never rendered */
setTimeout(() => { if (!gl.ready) boot.glDone = true; }, 6000);

})();
