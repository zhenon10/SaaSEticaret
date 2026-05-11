'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { ApiError } from '@saas/api-client';

interface Props {
  currentEmail: string;
}

const inputClass =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border p-6 space-y-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </div>
  );
}

export default function AccountForm({ currentEmail }: Props) {
  const [email, setEmail]             = useState(currentEmail);
  const [emailStatus, setEmailStatus] = useState<{ ok?: boolean; msg: string } | null>(null);
  const [emailSaving, setEmailSaving] = useState(false);

  const [currentPw, setCurrentPw]   = useState('');
  const [newPw, setNewPw]           = useState('');
  const [newPw2, setNewPw2]         = useState('');
  const [pwStatus, setPwStatus]     = useState<{ ok?: boolean; msg: string } | null>(null);
  const [pwSaving, setPwSaving]     = useState(false);

  const handleEmailSave = async () => {
    setEmailStatus(null);
    setEmailSaving(true);
    try {
      await api.auth.changeEmail({ newEmail: email });
      setEmailStatus({ ok: true, msg: 'E-posta güncellendi. Bir sonraki girişte yeni adresinizi kullanın.' });
    } catch (e) {
      setEmailStatus({ ok: false, msg: e instanceof ApiError ? e.message : 'Güncelleme başarısız.' });
    } finally {
      setEmailSaving(false);
    }
  };

  const handlePasswordSave = async () => {
    setPwStatus(null);
    if (newPw.length < 8) {
      setPwStatus({ ok: false, msg: 'Yeni şifre en az 8 karakter olmalıdır.' });
      return;
    }
    if (newPw !== newPw2) {
      setPwStatus({ ok: false, msg: 'Yeni şifreler eşleşmiyor.' });
      return;
    }
    setPwSaving(true);
    try {
      await api.auth.changePassword({ currentPassword: currentPw, newPassword: newPw });
      setPwStatus({ ok: true, msg: 'Şifre güncellendi.' });
      setCurrentPw('');
      setNewPw('');
      setNewPw2('');
    } catch (e) {
      setPwStatus({ ok: false, msg: e instanceof ApiError ? e.message : 'Güncelleme başarısız.' });
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="space-y-6">

      <Section title="E-posta Adresi">
        <div className="space-y-1">
          <label className="text-sm font-medium">Yeni E-posta</label>
          <input
            type="email"
            className={inputClass}
            value={email}
            onChange={(e) => { setEmail(e.target.value); setEmailStatus(null); }}
          />
        </div>
        {emailStatus && (
          <p className={`rounded-md p-3 text-sm ${emailStatus.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-destructive/10 text-destructive'}`}>
            {emailStatus.msg}
          </p>
        )}
        <button
          onClick={handleEmailSave}
          disabled={emailSaving || !email || email === currentEmail}
          className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {emailSaving ? 'Kaydediliyor...' : 'E-postayı Güncelle'}
        </button>
      </Section>

      <Section title="Şifre Değiştir">
        <div className="space-y-1">
          <label className="text-sm font-medium">Mevcut Şifre</label>
          <input
            type="password"
            className={inputClass}
            value={currentPw}
            onChange={(e) => { setCurrentPw(e.target.value); setPwStatus(null); }}
            autoComplete="current-password"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Yeni Şifre</label>
          <input
            type="password"
            className={inputClass}
            value={newPw}
            onChange={(e) => { setNewPw(e.target.value); setPwStatus(null); }}
            autoComplete="new-password"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Yeni Şifre (Tekrar)</label>
          <input
            type="password"
            className={inputClass}
            value={newPw2}
            onChange={(e) => { setNewPw2(e.target.value); setPwStatus(null); }}
            autoComplete="new-password"
          />
        </div>
        {pwStatus && (
          <p className={`rounded-md p-3 text-sm ${pwStatus.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-destructive/10 text-destructive'}`}>
            {pwStatus.msg}
          </p>
        )}
        <button
          onClick={handlePasswordSave}
          disabled={pwSaving || !currentPw || !newPw || !newPw2}
          className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {pwSaving ? 'Kaydediliyor...' : 'Şifreyi Güncelle'}
        </button>
      </Section>

    </div>
  );
}
