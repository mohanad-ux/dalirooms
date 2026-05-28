import type { Config } from "@netlify/functions";
import { db } from "../../db/index.js";
import { siteSettings, translations } from "../../db/schema.js";
import { eq, and } from "drizzle-orm";

const DEFAULT_SETTINGS: Record<string, string> = {
  whatsapp_number: "306974819837",
  whatsapp_display: "+30 697 481 9837",
  room_price_base: "250",
  room_price_currency: "EUR",
};

const DEFAULT_TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    nav_home: "Home", nav_about: "About", nav_rooms: "Rooms", nav_amenities: "Amenities",
    nav_gallery: "Gallery", nav_location: "Location", nav_book_now: "Book Now",
    hero_title: "Experience Paradise at Dali rooms",
    hero_subtitle: "A sanctuary of bespoke luxury overlooking the infinite blue of the Ionian Sea.",
    hero_cta: "Book Your Stay",
    about_title: "The Art of Hospitality", about_subtitle: "A refined escape in Zakynthos",
    about_p1: "Immerse yourself in the unparalleled beauty of the Mediterranean. Dali rooms offers an exclusive retreat designed for those who seek perfection. Our meticulously crafted spaces blend contemporary luxury with the timeless charm of Greek island life.",
    about_p2: "Wake up to the gentle sound of the waves, indulge in world-class amenities, and let the breathtaking views of the Ionian Sea become the backdrop to your unforgettable memories. Here, every detail is tailored to your supreme comfort.",
    rooms_title: "Luxury Accommodations",
    rooms_subtitle: "Discover our exclusive selection of suites and villas, each presenting a perfect harmony of elegance, comfort, and panoramic vistas.",
    room_tag_premium: "Premium", room_tag_exclusive: "Exclusive", room_tag_signature: "Signature",
    room1_title: "Grand Luxury Suite",
    room1_desc: "An expansive sanctuary featuring designer furnishings, a king-size plush bed, and a private balcony capturing the majestic morning sun over the azure waters.",
    room2_title: "Executive Sea-View",
    room2_desc: "Elevate your stay in this executive space offering unparalleled privacy, featuring premium textures, state-of-the-art tech, and a spa-inspired ensuite bathroom.",
    room3_title: "Infinity Pool Oasis",
    room3_desc: "The crown jewel of Dali rooms. Step straight from your luxurious bedroom onto a pristine sun deck featuring a mesmerizing infinity plunge pool merging with the sea horizon.",
    room_book: "Book on Booking.com",
    amenities_title: "Premium Experiences",
    amenities_subtitle: "Beyond the refined elegance of your room, we invite you to indulge in a curated selection of world-class facilities designed for ultimate relaxation and joy.",
    amenity1_title: "Gastronomic Dining", amenity1_desc: "Savor exquisite Mediterranean flavors crafted by our award-winning executive chefs.",
    amenity2_title: "Private Yacht Tours", amenity2_desc: "Explore the hidden coves and pristine beaches of Zakynthos aboard our private yachts.",
    amenity3_title: "Infinity Lounge", amenity3_desc: "Sip signature cocktails as you witness the most magnificent sunsets over the Ionian Sea.",
    gallery_title: "Visual Journey", gallery_subtitle: "Glimpse into the exquisite aesthetics and atmosphere that await you at Dali rooms.",
    gallery_all: "All", gallery_rooms: "Rooms", gallery_facilities: "Facilities", gallery_views: "Views",
    contact_title: "Get in Touch",
    contact_desc: "Whether you're ready to secure your reservation or require bespoke arrangements for your stay, our dedicated concierge team is at your disposal.",
    contact_loc: "Our Location", contact_email_header: "Email Us", contact_phone_header: "WhatsApp / Phone",
    footer_cta_title: "Your Mediterranean Sanctuary Awaits",
    footer_cta_desc: "Experience the epitome of luxury and flawless hospitality on Zakynthos Island.",
    footer_cta_btn: "Secure Your Room via Booking.com",
    footer_brand_desc: "Elevating island hospitality to an art form. Join us in Zakynthos for a luxury experience defined by serenity, elegance, and infinite ocean vistas.",
    footer_links_header: "Quick Links", footer_contact_header: "Contact",
    footer_copyright: "&copy; 2026 Dali rooms Zakynthos. All Rights Reserved.",
    footer_privacy: "Privacy Policy", footer_terms: "Terms of Service",
    ai_widget_tooltip: "AI Concierge - Online", ai_widget_title: "AI Concierge",
    ai_welcome: "Welcome to Dali rooms! 🌟 I am your AI Virtual Concierge. How can I assist you today?"
  },
  de: {
    nav_home: "Startseite", nav_about: "Über uns", nav_rooms: "Zimmer", nav_amenities: "Annehmlichkeiten",
    nav_gallery: "Galerie", nav_location: "Lage", nav_book_now: "Jetzt Buchen",
    hero_title: "Erleben Sie das Paradies im Dali rooms",
    hero_subtitle: "Ein Zufluchtsort maßgeschneiderten Luxus mit Blick auf das unendliche Blau des Ionischen Meeres.",
    hero_cta: "Buchen Sie Ihren Aufenthalt",
    about_title: "Die Kunst der Gastfreundschaft", about_subtitle: "Ein erlesener Rückzugsort auf Zakynthos",
    about_p1: "Tauchen Sie ein in die unvergleichliche Schönheit des Mittelmeers. Dali rooms bietet einen exklusiven Rückzugsort für diejenigen, die Perfektion suchen. Unsere sorgfältig gestalteten Räume verbinden zeitgenössischen Luxus mit dem zeitlosen Charme des griechischen Insellebens.",
    about_p2: "Wachen Sie mit dem sanften Rauschen der Wellen auf, genießen Sie erstklassige Annehmlichkeiten und lassen Sie die atemberaubende Aussicht auf das Ionische Meer zur Kulisse Ihrer unvergesslichen Erinnerungen werden. Hier ist jedes Detail auf Ihren höchsten Komfort abgestimmt.",
    rooms_title: "Luxuriöse Unterkünfte",
    rooms_subtitle: "Entdecken Sie unsere exklusive Auswahl an Suiten und Villen, die jeweils eine perfekte Harmonie aus Eleganz, Komfort und Panoramablick bieten.",
    room_tag_premium: "Premium", room_tag_exclusive: "Exklusiv", room_tag_signature: "Signatur",
    room1_title: "Grand Luxury Suite",
    room1_desc: "Eine weitläufige Oase mit Designer-Möbeln, einem luxuriösen Kingsize-Bett und einem privaten Balkon, der die majestätische Morgensonne über dem azurblauen Wasser einfängt.",
    room2_title: "Executive Meerblick",
    room2_desc: "Erleben Sie einen gehobenen Aufenthalt in diesem exklusiven Bereich, der beispiellose Privatsphäre, erlesene Texturen, modernste Technologie und ein Spa-inspiriertes Badezimmer bietet.",
    room3_title: "Infinity-Pool-Oase",
    room3_desc: "Das Kronjuwel von Dali rooms. Treten Sie direkt von Ihrem luxuriösen Schlafzimmer auf ein makelloses Sonnendeck mit einem faszinierenden Infinity-Plunge-Pool, der mit dem Meereshorizont verschmilzt.",
    room_book: "Auf Booking.com buchen",
    amenities_title: "Premium-Erlebnisse",
    amenities_subtitle: "Über die raffinierte Eleganz Ihres Zimmers hinaus laden wir Sie ein, sich in einer erlesenen Auswahl an erstklassigen Einrichtungen zu entspannen und zu erholen.",
    amenity1_title: "Gourmet-Küche", amenity1_desc: "Genießen Sie exquisite mediterrane Köstlichkeiten, kreiert von unseren preisgekrönten Spitzenköchen.",
    amenity2_title: "Private Yachttouren", amenity2_desc: "Erkunden Sie die verborgenen Buchten und unberührten Strände von Zakynthos an Bord unserer privaten Yachten.",
    amenity3_title: "Infinity-Lounge", amenity3_desc: "Schlürfen Sie erstklassige Cocktails, während Sie die schönsten Sonnenuntergänge über dem Ionischen Meer erleben.",
    gallery_title: "Visuelle Reise", gallery_subtitle: "Werfen Sie einen Blick auf die exquisite Ästhetik und Atmosphäre, die Sie im Dali rooms erwarten.",
    gallery_all: "Alle", gallery_rooms: "Zimmer", gallery_facilities: "Einrichtungen", gallery_views: "Aussichten",
    contact_title: "Kontaktieren Sie Uns",
    contact_desc: "Ob Sie Ihre Reservierung sichern möchten oder maßgeschneiderte Arrangements für Ihren Aufenthalt wünschen, unser engagiertes Concierge-Team steht Ihnen gerne zur Verfügung.",
    contact_loc: "Unser Standort", contact_email_header: "Schreiben Sie uns", contact_phone_header: "WhatsApp / Telefon",
    footer_cta_title: "Ihr mediterraner Rückzugsort erwartet Sie",
    footer_cta_desc: "Erleben Sie den Inbegriff von Luxus und makelloser Gastfreundschaft auf der Insel Zakynthos.",
    footer_cta_btn: "Sichern Sie Ihr Zimmer über Booking.com",
    footer_brand_desc: "Inselgastfreundschaft als Kunstform. Erleben Sie mit uns auf Zakynthos ein Luxuserlebnis, das von Gelassenheit, Eleganz und unendlichem Meerblick geprägt ist.",
    footer_links_header: "Schnelllinks", footer_contact_header: "Kontakt",
    footer_copyright: "&copy; 2026 Dali rooms Zakynthos. Alle Rechte vorbehalten.",
    footer_privacy: "Datenschutz-Bestimmungen", footer_terms: "Nutzungsbedingungen",
    ai_widget_tooltip: "KI-Concierge - Online", ai_widget_title: "KI-Concierge",
    ai_welcome: "Willkommen im Dali rooms! 🌟 Ich bin Ihr virtueller KI-Concierge. Wie kann ich Ihnen heute helfen?"
  },
  zh: {
    nav_home: "首页", nav_about: "关于我们", nav_rooms: "尊贵客房", nav_amenities: "设施服务",
    nav_gallery: "精彩瞬间", nav_location: "地理位置", nav_book_now: "立即预订",
    hero_title: "在 Dali rooms 体验天堂般的享受",
    hero_subtitle: "坐拥伊奥尼亚海无尽蓝景，尊享量身定制的奢华避风港。",
    hero_cta: "预订您的住宿",
    about_title: "款待的艺术", about_subtitle: "扎金索斯岛的雅致奢华之旅",
    about_p1: "让自己沉浸在无与伦比的地中海美景中。Dali rooms 为追求完美的人士提供专属的奢华静修所。我们精心打造的空间将现代奢华与希腊海岛生活的永恒魅力融为一体。",
    about_p2: "在海浪的温柔吟唱中醒来，尽情享受世界一流的设施，让伊奥尼亚海令人窒息的美景成为您难忘回忆的背景。在这里，每一个细节都为您极致的舒适而量身定制。",
    rooms_title: "奢华下榻空间",
    rooms_subtitle: "探索我们精心挑选的尊贵套房与别墅，每一处都完美融合了高雅、舒适与全景视野。",
    room_tag_premium: "尊贵级", room_tag_exclusive: "专属级", room_tag_signature: "臻选级",
    room1_title: "豪华大套房",
    room1_desc: "宽敞舒适的静谧空间，配备设计师家具、豪华特大床以及私人阳台，将蔚蓝海面上的晨曦美景尽收眼底。",
    room2_title: "行政海景房",
    room2_desc: "在这里升华您的入住体验。提供无与伦比的私密性，配有高档质感装饰、前沿科技设施及水疗风独立卫浴。",
    room3_title: "无边泳池绿洲",
    room3_desc: "Dali rooms 的璀璨明珠。从奢华卧室直接步入阳光露台，尽享与海平线融为一体的迷人无边浸泡泳池。",
    room_book: "立即通过 Booking.com 预订",
    amenities_title: "尊享体验",
    amenities_subtitle: "除了雅致舒适的客房，我们还诚邀您体验一系列世界级的顶级设施，尽享极致放松与愉悦。",
    amenity1_title: "饕餮美食", amenity1_desc: "细细品味由我们屡获殊荣的行政主厨精心打造的精致地中海风味。",
    amenity2_title: "私人游艇巡游", amenity2_desc: "搭乘我们的私人游艇，探索扎金索斯岛隐秘的海湾和纯净的沙滩。",
    amenity3_title: "无边清凉酒吧", amenity3_desc: "伴着伊奥尼亚海上空最壮丽的日落落霞，啜饮我们为您精心调制的招牌鸡尾酒。",
    gallery_title: "精彩瞬间", gallery_subtitle: "尽情领略 Dali rooms 独一无二的设计美学与令人陶醉的奢华氛围。",
    gallery_all: "全部", gallery_rooms: "客房", gallery_facilities: "设施", gallery_views: "景观",
    contact_title: "联系我们",
    contact_desc: "无论您是准备即刻预订，还是需要为您的下榻行程进行专属定制，我们的礼宾团队都将全天候静候您的垂询。",
    contact_loc: "我们的位置", contact_email_header: "电子邮箱", contact_phone_header: "微信 / 电话",
    footer_cta_title: "地中海奢华避风港静候光临",
    footer_cta_desc: "在扎金索斯岛开启一段无可挑剔的尊贵奢华体验。",
    footer_cta_btn: "立即通过 Booking.com 锁定房源",
    footer_brand_desc: "将海岛款待服务升华为一门艺术。相约扎金索斯岛，开启一段由宁静、高雅和无边海景交织而成的奢华之旅。",
    footer_links_header: "快捷链接", footer_contact_header: "联络方式",
    footer_copyright: "&copy; 2026 Dali rooms Zakynthos. 版权所有。",
    footer_privacy: "隐私政策", footer_terms: "服务条款",
    ai_widget_tooltip: "AI 礼宾员 - 在线", ai_widget_title: "AI 礼宾员",
    ai_welcome: "欢迎光临 Dali rooms！🌟 我是您的 AI 虚拟礼宾。请问今天有什么可以帮您？"
  }
};

export default async (req: Request) => {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const allSettings = await db.select().from(siteSettings);
  const allTranslations = await db.select().from(translations);

  let settingsMap: Record<string, string>;
  let translationsMap: Record<string, Record<string, string>>;

  if (allSettings.length === 0) {
    settingsMap = DEFAULT_SETTINGS;
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      await db.insert(siteSettings).values({ settingKey: key, settingValue: value });
    }
  } else {
    settingsMap = {};
    for (const s of allSettings) {
      settingsMap[s.settingKey] = s.settingValue;
    }
  }

  if (allTranslations.length === 0) {
    translationsMap = DEFAULT_TRANSLATIONS;
    for (const [lang, entries] of Object.entries(DEFAULT_TRANSLATIONS)) {
      for (const [key, value] of Object.entries(entries)) {
        await db.insert(translations).values({ lang, translationKey: key, translationValue: value });
      }
    }
  } else {
    translationsMap = {};
    for (const row of allTranslations) {
      if (!translationsMap[row.lang]) translationsMap[row.lang] = {};
      translationsMap[row.lang][row.translationKey] = row.translationValue;
    }
  }

  return Response.json({
    settings: settingsMap,
    translations: translationsMap,
  }, {
    headers: { "Cache-Control": "public, max-age=60" },
  });
};

export const config: Config = {
  path: "/api/site-config",
};
