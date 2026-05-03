import {
  Shirt, Layers, Zap, Wind, Snowflake, Tag, Scissors, Gem, Crown, Watch,
  Glasses, Baby, Footprints, Sparkles, ShoppingBag, Package, Box,
  Cpu, Smartphone, Headphones, Camera, Tv, Gamepad2, Monitor,
  Home, Sofa, Lamp, UtensilsCrossed, Coffee, BookOpen, Palette,
  Dumbbell, Bike, Tent, Heart, Sun, Leaf, Gift, Star, Flame, Car,
  type LucideIcon,
} from 'lucide-react';

interface CategoryVisual {
  Icon: LucideIcon;
  bg: string;
  fg: string;
}

// ── Keyword → visual mapping ─────────────────────────────────────────────────
// Her öğe: [aranacak kelimeler[], ikon, arka plan rengi, ikon rengi]
type Rule = [string[], LucideIcon, string, string];

const RULES: Rule[] = [
  // ── Giyim / Moda ────────────────────────────────────────────────────────
  [['gömlek', 'gomlek', 'shirt', 'bluz'],                      Shirt,         'bg-sky-50',     'text-sky-600'],
  [['ceket', 'blazer', 'jacket'],                               Scissors,      'bg-indigo-50',  'text-indigo-600'],
  [['eşofman', 'esofman', 'tracksuit', 'spor'],                Zap,           'bg-green-50',   'text-green-600'],
  [['jean', 'kot', 'denim'],                                    Tag,           'bg-blue-50',    'text-blue-600'],
  [['kaban', 'palto', 'overcoat'],                              Wind,          'bg-slate-50',   'text-slate-600'],
  [['mont', 'parka', 'puffer', 'kışlık'],                      Snowflake,     'bg-cyan-50',    'text-cyan-600'],
  [['pantolon', 'trouser', 'slacks'],                           Layers,        'bg-violet-50',  'text-violet-600'],
  [['alt giyim', 'altgiyim', 'underwear', 'iç giyim'],         Sparkles,      'bg-rose-50',    'text-rose-500'],
  [['etek', 'skirt'],                                           Crown,         'bg-pink-50',    'text-pink-500'],
  [['elbise', 'dress'],                                         Heart,         'bg-fuchsia-50', 'text-fuchsia-500'],
  [['ayakkabı', 'ayakkabi', 'bot', 'sneaker', 'shoe'],         Footprints,    'bg-amber-50',   'text-amber-600'],
  [['çanta', 'canta', 'bag', 'çantası'],                       ShoppingBag,   'bg-orange-50',  'text-orange-500'],
  [['aksesuar', 'accessory', 'kemer', 'şapka', 'sapka'],       Gem,           'bg-yellow-50',  'text-yellow-600'],
  [['saat', 'watch'],                                           Watch,         'bg-teal-50',    'text-teal-600'],
  [['gözlük', 'gozluk', 'glasses', 'güneş gözlüğü'],          Glasses,       'bg-lime-50',    'text-lime-600'],
  [['çocuk', 'cocuk', 'bebek', 'kids', 'baby'],                Baby,          'bg-pink-50',    'text-pink-400'],
  // ── Teknoloji ────────────────────────────────────────────────────────────
  [['telefon', 'phone', 'mobil', 'smartphone'],                 Smartphone,    'bg-blue-50',    'text-blue-600'],
  [['bilgisayar', 'laptop', 'computer', 'pc'],                  Monitor,       'bg-indigo-50',  'text-indigo-600'],
  [['tablet'],                                                   Cpu,           'bg-violet-50',  'text-violet-600'],
  [['kulaklık', 'kulaklik', 'headphone', 'ses'],                Headphones,    'bg-purple-50',  'text-purple-600'],
  [['kamera', 'fotoğraf', 'camera'],                            Camera,        'bg-slate-50',   'text-slate-600'],
  [['tv', 'televizyon', 'ekran'],                               Tv,            'bg-gray-50',    'text-gray-600'],
  [['oyun', 'gaming', 'console', 'gamepad'],                    Gamepad2,      'bg-green-50',   'text-green-600'],
  // ── Ev & Yaşam ───────────────────────────────────────────────────────────
  [['mobilya', 'furniture', 'koltuk', 'sofa'],                  Sofa,          'bg-orange-50',  'text-orange-600'],
  [['aydınlatma', 'lamba', 'lamp', 'lighting'],                 Lamp,          'bg-yellow-50',  'text-yellow-600'],
  [['mutfak', 'kitchen', 'yemek'],                              UtensilsCrossed,'bg-red-50',    'text-red-500'],
  [['ev', 'home', 'yaşam', 'decoration'],                       Home,          'bg-teal-50',    'text-teal-600'],
  [['kahve', 'coffee', 'çay'],                                   Coffee,        'bg-amber-50',   'text-amber-700'],
  // ── Spor & Outdoor ───────────────────────────────────────────────────────
  [['spor', 'sport', 'fitness', 'gym'],                         Dumbbell,      'bg-emerald-50', 'text-emerald-600'],
  [['bisiklet', 'bike', 'cycling'],                             Bike,          'bg-lime-50',    'text-lime-600'],
  [['kamp', 'outdoor', 'doğa', 'hiking'],                       Tent,          'bg-green-50',   'text-green-700'],
  // ── Diğer ────────────────────────────────────────────────────────────────
  [['kitap', 'book', 'eğitim'],                                  BookOpen,      'bg-sky-50',     'text-sky-600'],
  [['sanat', 'hobi', 'art', 'hobby'],                           Palette,       'bg-fuchsia-50', 'text-fuchsia-600'],
  [['araç', 'araba', 'oto', 'car'],                             Car,           'bg-slate-50',   'text-slate-600'],
  [['tatil', 'seyahat', 'travel'],                              Sun,           'bg-yellow-50',  'text-yellow-500'],
  [['bahçe', 'garden', 'bitki'],                                Leaf,          'bg-green-50',   'text-green-600'],
  [['hediye', 'gift'],                                           Gift,          'bg-rose-50',    'text-rose-500'],
  [['kozmetik', 'güzellik', 'beauty', 'makyaj'],                Sparkles,      'bg-pink-50',    'text-pink-500'],
];

// Fallback paleti — kategori ismine göre deterministik seçim
const FALLBACKS: [LucideIcon, string, string][] = [
  [Star,     'bg-yellow-50',  'text-yellow-500'],
  [Package,  'bg-blue-50',    'text-blue-500'],
  [Box,      'bg-violet-50',  'text-violet-500'],
  [Flame,    'bg-orange-50',  'text-orange-500'],
  [Gem,      'bg-pink-50',    'text-pink-500'],
  [Zap,      'bg-green-50',   'text-green-500'],
  [Crown,    'bg-indigo-50',  'text-indigo-500'],
  [Heart,    'bg-rose-50',    'text-rose-500'],
  [Sparkles, 'bg-cyan-50',    'text-cyan-500'],
  [Sun,      'bg-amber-50',   'text-amber-500'],
  [Leaf,     'bg-emerald-50', 'text-emerald-500'],
  [Wind,     'bg-slate-50',   'text-slate-500'],
];

function simpleHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xffffffff;
  return Math.abs(h);
}

export function getCategoryVisual(name: string, slug: string): CategoryVisual {
  const lower = (name + ' ' + slug).toLowerCase();

  for (const [keywords, Icon, bg, fg] of RULES) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return { Icon, bg, fg };
    }
  }

  // Deterministik fallback
  const idx = simpleHash(slug || name) % FALLBACKS.length;
  const [Icon, bg, fg] = FALLBACKS[idx];
  return { Icon, bg, fg };
}
