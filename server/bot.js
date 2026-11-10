'use strict';
/* Campus マルシェ — bot students for testing chat.
   Each demo student has a personality: which languages they speak, whether they accept
   price offers, where and when they like to meet. They reply like a real student would.
   No AI service is used: replies come from simple rules, so it works offline and for free. */

const PERSONAS = {
  u_mai: {
    name: 'まいまい', speaks: ['ja', 'en'], minRatio: 0.8, time: '12:15',
    place: { ja: '学術情報館の入口', en: 'the library (学術情報館) entrance' },
  },
  u_yuki: {
    // Her bio says "no price negotiation", so she politely refuses offers. Japanese only.
    name: 'ゆきだるま', speaks: ['ja'], minRatio: null, time: '16:30',
    place: { ja: '正門', en: '正門 (the main gate)' },
  },
  u_leo: {
    // Croissant: English first, simple Japanese if you write in Japanese.
    name: 'Croissant', speaks: ['en', 'ja'], minRatio: 0.7, time: '13:00',
    place: { ja: '生協の前', en: 'in front of the co-op (生協)' }, simpleJa: true,
  },
};

const isJa = (s) => /[぀-ヿ一-鿿]/.test(s || '');
const yen = (n) => '¥' + Number(n || 0).toLocaleString('ja-JP');
const pick = (a) => a[Math.floor(Math.random() * a.length)];

// Reply in the language the student wrote in, if the bot speaks it
function replyLang(p, text, uiLang) {
  const want = text ? (isJa(text) ? 'ja' : 'en') : uiLang || 'ja';
  return p.speaks.includes(want) ? want : p.speaks[0];
}

function tomorrowAt(hhmm) {
  const d = new Date(Date.now() + 24 * 3600e3);
  const [h, m] = hhmm.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(h)}:${pad(m)}`;
}

const INTENTS = [
  ['thanks', /ありがと|thank|thx|merci|助かり|感謝/i],
  ['price', /安く|値下げ|まけ|負け|discount|cheaper|lower|price|値段|いくら|ディスカウント/i],
  ['where', /どこ|where|場所|place|meet at/i],
  ['when', /いつ|when|today|今日|明日|tomorrow|何時|時間|afternoon|morning|lunch|昼|放課後|after class|weekend|週末/i],
  ['condition', /状態|condition|work|動|傷|使え|broken|clean|きれい|汚れ|scratch/i],
  ['available', /still|available|まだ|あります|残って|売れ|空いて|ある\?|ある？/i],
  ['yes', /^(yes|yeah|yep|sure|ok|okay|of course|はい|ええ|うん|大丈夫|いいですよ|もちろん)/i],
  ['greet', /^(hi|hello|hey|こんにちは|こんばんは|はじめまして|どうも|お疲れ)/i],
];
const intentOf = (text) => (INTENTS.find(([, re]) => re.test(text || '')) || ['other'])[0];

// Lines per language. {place} {time} {price} {title} get filled in.
const LINES = {
  seller: {
    available: { ja: ['はい、まだありますよ！いつ受け取りに来られますか？', 'まだあります！都合のいい日はありますか？'], en: ["Yes, it's still available! When could you pick it up?", 'Still here! When works for you?'] },
    greet: { ja: ['こんにちは！ご連絡ありがとうございます。まだありますよ。'], en: ['Hi! Thanks for your message. It\'s still available.'] },
    priceOk: { ja: ['{price}までなら下げられますよ。「価格を提案」から送ってください！'], en: ['I could go down to {price}. Send it with "Offer a price"!'] },
    priceNo: { ja: ['すみません、値下げは考えていません。'], en: ["Sorry, I'm not lowering the price."] },
    priceFree: { ja: ['無料なので、そのまま受け取ってください！'], en: ["It's free, so just come and take it!"] },
    where: { ja: ['{place}はどうですか？'], en: ['How about {place}?'] },
    when: { ja: ['明日の{time}はどうですか？提案を送りますね。'], en: ["How about tomorrow at {time}? I'll send you a proposal."] },
    condition: { ja: ['説明に書いたとおりで、普通に使えます。気になるところは会ったときに確認してくださいね。'], en: ["It's as described and works fine. Feel free to check it when we meet!"] },
    thanks: { ja: ['こちらこそ、ありがとうございます！'], en: ['Thank you too!'] },
    other: { ja: ['なるほど！ほかに気になることがあれば聞いてください。', '了解です！'], en: ['Got it! Let me know if you have any other questions.', 'Sounds good!'] },
    offerYes: { ja: ['その値段で大丈夫です！'], en: ['That price works for me!'] },
    offerCounter: { ja: ['うーん、{price}ならどうですか？'], en: ['Hmm, how about {price}?'] },
    meetYes: { ja: ['OKです！その時間に行きますね。'], en: ['Works for me! See you then.'] },
    accepted: { ja: ['ありがとうございます！当日よろしくお願いします。'], en: ['Great, see you then!'] },
    declined: { ja: ['わかりました！都合のいい時間を提案してもらえますか？'], en: ['No problem! Could you suggest a time that works for you?'] },
    handed: { ja: ['ありがとうございました！大切に使ってください。'], en: ['Thank you! Hope it serves you well.'] },
  },
  buyer: {
    yes: { ja: ['よかった！明日受け取れますか？提案を送りますね。'], en: ["Great! Could I pick it up tomorrow? I'll send a proposal."] },
    available: { ja: ['よかった！明日受け取れますか？提案を送りますね。'], en: ["Great! Could I pick it up tomorrow? I'll send a proposal."] },
    where: { ja: ['{place}はどうですか？'], en: ['How about {place}?'] },
    when: { ja: ['明日の{time}はどうですか？提案を送りますね。'], en: ["How about tomorrow at {time}? I'll send a proposal."] },
    price: { ja: ['{price}だとうれしいです…！提案を送ってみますね。'], en: ["Would {price} be OK? I'll send an offer."] },
    condition: { ja: ['ありがとうございます、安心しました！'], en: ['Thanks, good to know!'] },
    thanks: { ja: ['こちらこそ！'], en: ['Thank you!'] },
    greet: { ja: ['こんにちは！よろしくお願いします。'], en: ['Hi! Nice to meet you.'] },
    other: { ja: ['わかりました！', '了解です！'], en: ['Got it!', 'Okay!'] },
    meetYes: { ja: ['OKです！よろしくお願いします。'], en: ['Perfect, see you then!'] },
    accepted: { ja: ['ありがとうございます！'], en: ['Thanks!'] },
    declined: { ja: ['わかりました。都合のいい時間を教えてください！'], en: ['No worries, when would suit you?'] },
    offerYes: { ja: ['ありがとうございます！'], en: ['Thank you so much!'] },
    offerNo: { ja: ['わかりました、元の値段で大丈夫です！'], en: ["Okay, the original price is fine!"] },
    handed: { ja: ['ありがとうございました！大切に使います。'], en: ['Thanks a lot! I\'ll take good care of it.'] },
    interest: { ja: ['はじめまして！「{title}」に興味があります。まだありますか？'], en: ['Hi! I\'m interested in your "{title}". Is it still available?'] },
  },
};

function line(role, key, lang, vars) {
  const set = LINES[role][key] || LINES[role].other;
  let s = pick(set[lang] || set.en);
  for (const [k, v] of Object.entries(vars)) s = s.split('{' + k + '}').join(v);
  return s;
}

/* Decide what the bot does. Returns a list of steps, e.g.
   [{ say: 'はい、まだありますよ！' }, { action: 'propose-meetup', when, place }] */
function respond(req) {
  const p = PERSONAS[req.botId];
  if (!p) return [];
  const role = req.role; // the bot's role: 'seller' or 'buyer'
  const lang = replyLang(p, req.kind === 'text' ? req.text : '', req.uiLang);
  const l = req.listing || {};
  const price = l.type === 'free' ? 0 : Number(l.price || 0);
  const counter = p.minRatio ? Math.ceil((price * p.minRatio) / 100) * 100 : price;
  const vars = { place: p.place[lang] || p.place.en, time: p.time, title: l.title || '', price: yen(counter) };
  const st = req.state || {};
  const propose = () => (st.hasMeetup || st.outcome ? [] : [{ action: 'propose-meetup', when: tomorrowAt(p.time), place: p.place[lang] || p.place.en }]);
  const say = (key, extra = {}) => ({ say: line(role, key, lang, { ...vars, ...extra }) });

  switch (req.kind) {
    case 'meetup': return [{ action: 'accept-meetup' }, say('meetYes')];
    case 'accepted': return [say('accepted')];
    case 'declined': return [say('declined')];
    case 'handed': return [say('handed')];
    case 'offer-accepted': return [say('offerYes')];
    case 'offer-declined': return [say('offerNo')];
    case 'offer': {
      if (role !== 'seller') return [];
      if (!p.minRatio) return [{ action: 'decline-offer' }, say('priceNo')];
      if (req.amount >= price * p.minRatio) return [{ action: 'accept-offer' }, say('offerYes')];
      return [{ action: 'decline-offer' }, say('offerCounter')];
    }
    case 'interest': return [say('interest')];
    default: break;
  }

  const intent = intentOf(req.text);
  if (role === 'seller') {
    if (intent === 'price') return [price === 0 ? say('priceFree') : p.minRatio ? say('priceOk') : say('priceNo')];
    if (intent === 'when') return [say('when'), ...propose()];
    if (intent === 'yes') return [say('when'), ...propose()];
    return [say(LINES.seller[intent] ? intent : 'other')];
  }
  // bot is the buyer
  if (intent === 'yes' || intent === 'available' || intent === 'when') return [say(intent === 'when' ? 'when' : 'yes'), ...propose()];
  if (intent === 'price' && price > 0 && p.minRatio && !st.agreedPrice) return [say('price'), { action: 'offer', amount: counter }];
  return [say(LINES.buyer[intent] ? intent : 'other')];
}

// Which bot gets interested when the student posts something
function interestedBot(sellerId, campus, bots) {
  const options = (bots || []).filter((b) => b.id !== sellerId && PERSONAS[b.id] && (!campus || b.campus === campus));
  return options.length ? pick(options) : null;
}

module.exports = { respond, interestedBot, PERSONAS };
