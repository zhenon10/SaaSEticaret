'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { ApiError } from '@saas/api-client';

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

export default function SettingsForm({ initialSettings }: Props) {
  const [values, setValues] = useState<Record<string, string>>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

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

  return (
    <div className="space-y-6">

      {/* ── Hero Banner ─────────────────────────────────── */}
      <Section
        title="🏷️ Hero Banner"
        description="Ana sayfanın üst bölümündeki büyük tanıtım alanı."
      >
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
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">1. Buton</p>
            <Field label="Metin">
              <input
                className={inputClass}
                value={get('hero.cta1.text')}
                onChange={(e) => set('hero.cta1.text', e.target.value)}
                placeholder="Alışverişe Başla"
              />
            </Field>
            <Field label="Link">
              <input
                className={inputClass}
                value={get('hero.cta1.href')}
                onChange={(e) => set('hero.cta1.href', e.target.value)}
                placeholder="/products"
              />
            </Field>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">2. Buton</p>
            <Field label="Metin">
              <input
                className={inputClass}
                value={get('hero.cta2.text')}
                onChange={(e) => set('hero.cta2.text', e.target.value)}
                placeholder="Öne Çıkanlar"
              />
            </Field>
            <Field label="Link">
              <input
                className={inputClass}
                value={get('hero.cta2.href')}
                onChange={(e) => set('hero.cta2.href', e.target.value)}
                placeholder="/products?featured=1"
              />
            </Field>
          </div>
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
