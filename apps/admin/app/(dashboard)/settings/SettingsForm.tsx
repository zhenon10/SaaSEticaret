'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { ApiError } from '@saas/api-client';
import { Plus, Trash2 } from 'lucide-react';

interface Props {
  initialSettings: Record<string, string>;
}

const inputClass =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

const textareaClass =
  'flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none';

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

type NavLink     = { label: string; href: string };
type HeroButton  = { text: string; href: string; variant: 'solid' | 'outline' };
type FooterLink  = { label: string; href: string };
type FooterColumn = { title: string; links: FooterLink[] };

function parseJson<T>(raw: string | undefined, fallback: T): T {
  try {
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as T;
  } catch { /* ignore */ }
  return fallback;
}

const parseNavLinks    = (r?: string) => parseJson<NavLink[]>(r, []);
const parseHeroButtons = (r?: string) => parseJson<HeroButton[]>(r, []);

export default function SettingsForm({ initialSettings }: Props) {
  const [values, setValues] = useState<Record<string, string>>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const navLinks = parseNavLinks(values['nav.links']);

  const setNavLinks = (links: NavLink[]) => {
    setValues((prev) => ({ ...prev, 'nav.links': JSON.stringify(links) }));
    setSuccess(false);
  };

  const updateNavLink = (i: number, field: keyof NavLink, val: string) => {
    const next = navLinks.map((l, idx) => idx === i ? { ...l, [field]: val } : l);
    setNavLinks(next);
  };

  const addNavLink = () => setNavLinks([...navLinks, { label: '', href: '/products' }]);
  const removeNavLink = (i: number) => setNavLinks(navLinks.filter((_, idx) => idx !== i));

  const heroButtons = parseHeroButtons(values['hero.buttons']);
  const setHeroButtons = (btns: HeroButton[]) => {
    setValues((prev) => ({ ...prev, 'hero.buttons': JSON.stringify(btns) }));
    setSuccess(false);
  };
  const updateHeroButton = (i: number, field: keyof HeroButton, val: string) => {
    setHeroButtons(heroButtons.map((b, idx) => idx === i ? { ...b, [field]: val } : b));
  };
  const addHeroButton    = () => setHeroButtons([...heroButtons, { text: '', href: '/products', variant: 'solid' }]);
  const removeHeroButton = (i: number) => setHeroButtons(heroButtons.filter((_, idx) => idx !== i));

  // Footer columns
  const footerColumns = parseJson<FooterColumn[]>(values['footer.columns'], []);
  const setFooterColumns = (cols: FooterColumn[]) => {
    setValues((prev) => ({ ...prev, 'footer.columns': JSON.stringify(cols) }));
    setSuccess(false);
  };
  const updateColTitle = (ci: number, title: string) =>
    setFooterColumns(footerColumns.map((c, i) => i === ci ? { ...c, title } : c));
  const addColumn    = () => setFooterColumns([...footerColumns, { title: '', links: [] }]);
  const removeColumn = (ci: number) => setFooterColumns(footerColumns.filter((_, i) => i !== ci));
  const updateColLink = (ci: number, li: number, field: keyof FooterLink, val: string) =>
    setFooterColumns(footerColumns.map((c, i) => i !== ci ? c : {
      ...c,
      links: c.links.map((l, j) => j === li ? { ...l, [field]: val } : l),
    }));
  const addColLink    = (ci: number) =>
    setFooterColumns(footerColumns.map((c, i) => i !== ci ? c : { ...c, links: [...c.links, { label: '', href: '/' }] }));
  const removeColLink = (ci: number, li: number) =>
    setFooterColumns(footerColumns.map((c, i) => i !== ci ? c : { ...c, links: c.links.filter((_, j) => j !== li) }));

  // Footer legal links
  const footerLegal = parseJson<FooterLink[]>(values['footer.legal'], []);
  const setFooterLegal = (links: FooterLink[]) => {
    setValues((prev) => ({ ...prev, 'footer.legal': JSON.stringify(links) }));
    setSuccess(false);
  };
  const updateLegal = (i: number, field: keyof FooterLink, val: string) =>
    setFooterLegal(footerLegal.map((l, j) => j === i ? { ...l, [field]: val } : l));
  const addLegal    = () => setFooterLegal([...footerLegal, { label: '', href: '/' }]);
  const removeLegal = (i: number) => setFooterLegal(footerLegal.filter((_, j) => j !== i));

  const set = (key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
    setSuccess(false);
  };

  const get = (key: string, fallback = '') => values[key] ?? fallback;

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      await api.settings.update(values);
      setSuccess(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Kayıt başarısız oldu.');
    } finally {
      setSaving(false);
    }
  };

  const primaryHex = get('store.color.primary', '#f97316');

  return (
    <div className="space-y-6">

      {/* ── Mağaza Görünümü ──────────────────────────────── */}
      <Section
        title="🎨 Mağaza Görünümü"
        description="Header'da görünen mağaza ismi ve sitenin genel renk teması."
      >
        <Field label="Mağaza İsmi" hint='Header logo alanında ve sayfa başlığında görünür.'>
          <input
            className={inputClass}
            value={get('store.name')}
            onChange={(e) => set('store.name', e.target.value)}
            placeholder="mağaza"
          />
        </Field>
        <Field label="Ana Renk" hint="Butonlar, linkler, vurgular ve navigasyon için kullanılır.">
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={primaryHex}
              onChange={(e) => set('store.color.primary', e.target.value)}
              className="h-9 w-14 cursor-pointer rounded border border-input bg-transparent p-0.5"
            />
            <span
              className="rounded-md px-3 py-1 text-sm font-medium text-white shadow"
              style={{ backgroundColor: primaryHex }}
            >
              Buton Örneği
            </span>
            <span className="font-mono text-sm text-muted-foreground">{primaryHex}</span>
          </div>
        </Field>
      </Section>

      {/* ── Hero Banner ─────────────────────────────────── */}
      <Section
        title="🏷️ Hero Banner"
        description="Ana sayfanın üst bölümündeki büyük tanıtım alanı."
      >
        <Field label="Arka Plan Görseli (URL)" hint="Boş bırakılırsa renkli gradient kullanılır.">
          <input
            className={inputClass}
            value={get('hero.image')}
            onChange={(e) => set('hero.image', e.target.value)}
            placeholder="https://example.com/banner.jpg"
          />
          {get('hero.image') && (
            <div className="mt-2 h-28 w-full overflow-hidden rounded-md border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={get('hero.image')} alt="Hero önizleme" className="h-full w-full object-cover" />
            </div>
          )}
        </Field>
        <Field label="Üst Etiket (küçük metin)" hint='Örn: "Yeni Sezon Koleksiyonu"'>
          <input
            className={inputClass}
            value={get('hero.badge')}
            onChange={(e) => set('hero.badge', e.target.value)}
            placeholder="Yeni Sezon Koleksiyonu"
          />
        </Field>
        <Field label="Başlık">
          <input
            className={inputClass}
            value={get('hero.title')}
            onChange={(e) => set('hero.title', e.target.value)}
            placeholder="Trendleri Yakala"
          />
        </Field>
        <Field label="Alt Başlık">
          <input
            className={inputClass}
            value={get('hero.subtitle')}
            onChange={(e) => set('hero.subtitle', e.target.value)}
            placeholder="Binlerce ürün, uygun fiyatlarla kapınıza kadar"
          />
        </Field>
        <div className="space-y-2">
          <p className="text-sm font-medium">Butonlar</p>
          {heroButtons.map((btn, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                className={inputClass}
                value={btn.text}
                onChange={(e) => updateHeroButton(i, 'text', e.target.value)}
                placeholder="Buton Metni"
              />
              <input
                className={inputClass}
                value={btn.href}
                onChange={(e) => updateHeroButton(i, 'href', e.target.value)}
                placeholder="/products"
              />
              <select
                className="flex h-9 rounded-md border border-input bg-transparent px-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={btn.variant}
                onChange={(e) => updateHeroButton(i, 'variant', e.target.value)}
              >
                <option value="solid">Dolu</option>
                <option value="outline">Çerçeveli</option>
              </select>
              <button
                type="button"
                onClick={() => removeHeroButton(i)}
                className="shrink-0 text-gray-400 hover:text-destructive transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addHeroButton}
            className="flex items-center gap-1.5 rounded-md border border-dashed border-gray-300 px-3 py-1.5 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <Plus className="h-4 w-4" />
            Buton Ekle
          </button>
        </div>
      </Section>

      {/* ── Announcement Bar ────────────────────────────── */}
      <Section
        title="📢 Duyuru Çubuğu"
        description="Sitenin en üstünde görünen ince duyuru bandı."
      >
        <Field label="">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              className="h-4 w-4 rounded"
              checked={get('announcement.enabled') === 'true'}
              onChange={(e) => set('announcement.enabled', e.target.checked ? 'true' : 'false')}
            />
            <span className="text-sm font-medium">Duyuru çubuğunu göster</span>
          </label>
        </Field>
        <Field label="Duyuru Metni" hint="Emoji kullanabilirsiniz.">
          <input
            className={inputClass}
            value={get('announcement.text')}
            onChange={(e) => set('announcement.text', e.target.value)}
            placeholder="🚀 Ücretsiz kargo 150 TL ve üzeri siparişlerde geçerlidir!"
            disabled={get('announcement.enabled') !== 'true'}
          />
        </Field>
      </Section>

      {/* ── Campaign Cards ──────────────────────────────── */}
      <Section
        title="🎁 Kampanya Kartları"
        description='Ana sayfadaki "Ücretsiz Kargo / Kolay İade / Güvenli Ödeme" kartları.'
      >
        {[
          { key: 'shipping', label: 'Kargo Kartı', icon: '🚚' },
          { key: 'return',   label: 'İade Kartı',  icon: '↩️' },
          { key: 'payment',  label: 'Ödeme Kartı', icon: '🔒' },
        ].map(({ key, label, icon }) => (
          <div key={key} className="grid gap-3 sm:grid-cols-2">
            <Field label={`${icon} ${label} — Başlık`}>
              <input
                className={inputClass}
                value={get(`campaign.${key}.title`)}
                onChange={(e) => set(`campaign.${key}.title`, e.target.value)}
              />
            </Field>
            <Field label="Alt Metin">
              <input
                className={inputClass}
                value={get(`campaign.${key}.subtitle`)}
                onChange={(e) => set(`campaign.${key}.subtitle`, e.target.value)}
              />
            </Field>
          </div>
        ))}
      </Section>

      {/* ── Footer ──────────────────────────────────────── */}
      <Section
        title="🦶 Footer"
        description="Sitenin alt bölümündeki marka açıklaması, link kolonları, iletişim ve hukuki linkler."
      >
        {/* Brand description */}
        <Field label="Marka Açıklaması">
          <textarea
            rows={2}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            value={get('footer.description')}
            onChange={(e) => set('footer.description', e.target.value)}
            placeholder="Türkiye'nin güvenilir online alışveriş platformu."
          />
        </Field>

        {/* Contact */}
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="📧 E-posta">
            <input className={inputClass} value={get('footer.contact.email')} onChange={(e) => set('footer.contact.email', e.target.value)} placeholder="destek@magaza.com" />
          </Field>
          <Field label="📞 Telefon">
            <input className={inputClass} value={get('footer.contact.phone')} onChange={(e) => set('footer.contact.phone', e.target.value)} placeholder="0850 000 00 00" />
          </Field>
          <Field label="🕐 Çalışma Saatleri">
            <input className={inputClass} value={get('footer.contact.hours')} onChange={(e) => set('footer.contact.hours', e.target.value)} placeholder="Hafta içi 09:00 – 18:00" />
          </Field>
        </div>

        {/* Link columns */}
        <div className="space-y-4">
          <p className="text-sm font-medium">Link Kolonları</p>
          {footerColumns.map((col, ci) => (
            <div key={ci} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  className={inputClass}
                  value={col.title}
                  onChange={(e) => updateColTitle(ci, e.target.value)}
                  placeholder="Kolon Başlığı"
                />
                <button type="button" onClick={() => removeColumn(ci)} className="shrink-0 text-gray-400 hover:text-destructive transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2 pl-2">
                {col.links.map((link, li) => (
                  <div key={li} className="flex items-center gap-2">
                    <input className={inputClass} value={link.label} onChange={(e) => updateColLink(ci, li, 'label', e.target.value)} placeholder="Link Adı" />
                    <input className={inputClass} value={link.href}  onChange={(e) => updateColLink(ci, li, 'href',  e.target.value)} placeholder="/products" />
                    <button type="button" onClick={() => removeColLink(ci, li)} className="shrink-0 text-gray-400 hover:text-destructive transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => addColLink(ci)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                  <Plus className="h-3 w-3" /> Link Ekle
                </button>
              </div>
            </div>
          ))}
          <button type="button" onClick={addColumn} className="flex items-center gap-1.5 rounded-md border border-dashed border-gray-300 px-3 py-1.5 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
            <Plus className="h-4 w-4" /> Kolon Ekle
          </button>
        </div>

        {/* Legal links */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Hukuki Linkler (Alt Çubuk)</p>
          {footerLegal.map((l, i) => (
            <div key={i} className="flex items-center gap-2">
              <input className={inputClass} value={l.label} onChange={(e) => updateLegal(i, 'label', e.target.value)} placeholder="Gizlilik Politikası" />
              <input className={inputClass} value={l.href}  onChange={(e) => updateLegal(i, 'href',  e.target.value)} placeholder="/privacy" />
              <button type="button" onClick={() => removeLegal(i)} className="shrink-0 text-gray-400 hover:text-destructive transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button type="button" onClick={addLegal} className="flex items-center gap-1.5 rounded-md border border-dashed border-gray-300 px-3 py-1.5 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
            <Plus className="h-4 w-4" /> Link Ekle
          </button>
        </div>

        {/* Copyright */}
        <Field label="Telif Metni" hint={`© ${new Date().getFullYear()} {mağaza adı}. {bu metin} şeklinde görünür.`}>
          <input className={inputClass} value={get('footer.copyright')} onChange={(e) => set('footer.copyright', e.target.value)} placeholder="Tüm hakları saklıdır." />
        </Field>
      </Section>

      {/* ── Kargo Ayarları ──────────────────────────────── */}
      <Section
        title="🚚 Kargo Ayarları"
        description="Kargo ücreti ve ücretsiz kargo eşiği. Sepet tutarı eşiğe ulaşınca kargo ücretsiz olur."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Kargo Ücreti (₺)" hint="Eşiğin altındaki siparişlere eklenir.">
            <input
              type="number"
              step="0.01"
              min="0"
              className={inputClass}
              value={get('shipping.fee', '49.90')}
              onChange={(e) => set('shipping.fee', e.target.value)}
              placeholder="49.90"
            />
          </Field>
          <Field label="Ücretsiz Kargo Limiti (₺)" hint="Bu tutara ulaşan sepetlerde kargo ücretsiz. 0 girilirse hiç ücretsiz olmaz.">
            <input
              type="number"
              step="0.01"
              min="0"
              className={inputClass}
              value={get('shipping.free_threshold', '500.00')}
              onChange={(e) => set('shipping.free_threshold', e.target.value)}
              placeholder="500.00"
            />
          </Field>
        </div>
        <div className="rounded-md bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          Mevcut ayar: <strong>{get('shipping.free_threshold', '500') === '0' ? 'Hiçbir zaman ücretsiz' : `${get('shipping.free_threshold', '500')} ₺ ve üzeri ücretsiz`}</strong>, altında <strong>{get('shipping.fee', '49.90')} ₺</strong> kargo ücreti uygulanır.
        </div>
      </Section>

      {/* ── Nav Links ───────────────────────────────────── */}
      <Section
        title="🔗 Navigasyon Linkleri"
        description="Header'daki kategori navigasyon çubuğunun linkleri. Sıralama ekrandaki sıraya göre belirlenir."
      >
        <div className="space-y-2">
          {navLinks.map((link, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                className={inputClass}
                value={link.label}
                onChange={(e) => updateNavLink(i, 'label', e.target.value)}
                placeholder="Link Adı"
              />
              <input
                className={inputClass}
                value={link.href}
                onChange={(e) => updateNavLink(i, 'href', e.target.value)}
                placeholder="/products"
              />
              <button
                type="button"
                onClick={() => removeNavLink(i)}
                className="shrink-0 text-gray-400 hover:text-destructive transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addNavLink}
          className="flex items-center gap-1.5 rounded-md border border-dashed border-gray-300 px-3 py-1.5 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          <Plus className="h-4 w-4" />
          Link Ekle
        </button>
      </Section>

      {/* ── Save ────────────────────────────────────────── */}
      {error && (
        <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
      )}
      {success && (
        <p className="rounded-md bg-green-50 p-3 text-sm text-green-700 border border-green-200">
          ✓ Ayarlar kaydedildi.
        </p>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>
    </div>
  );
}
