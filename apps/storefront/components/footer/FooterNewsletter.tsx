'use client';

import { useState } from 'react';
import { Mail } from 'lucide-react';

interface Props {
  storeName: string;
}

export default function FooterNewsletter({ storeName }: Props) {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setMsg('Teşekkürler! Kampanya e-postaları yakında bu adrese gönderilecek.');
    setEmail('');
  };

  return (
    <div>
      <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-white">
        <Mail className="h-4 w-4" />
        Bülten
      </h4>
      <p className="mb-3 text-sm text-white/70">
        {storeName} kampanya ve yeni koleksiyonlarından haberdar olun.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-posta adresiniz"
          className="min-w-0 flex-1 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-white/40 focus:outline-none"
        />
        <button
          type="submit"
          className="shrink-0 rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 transition-colors hover:bg-white/90"
        >
          Abone Ol
        </button>
      </form>
      {msg && <p className="mt-2 text-xs text-white/80">{msg}</p>}
    </div>
  );
}
