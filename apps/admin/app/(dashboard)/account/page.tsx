import type { Metadata } from 'next';
import { getServerApi } from '@/lib/server-api';
import AccountForm from '@/components/AccountForm';

export const metadata: Metadata = { title: 'Hesap Ayarları' };

export default async function AccountPage() {
  const api = await getServerApi();
  let email = '';
  try {
    const me = await api.auth.me();
    email = me.email ?? '';
  } catch {
    // devam et
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Hesap Ayarları</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Giriş bilgilerinizi buradan güncelleyebilirsiniz.
        </p>
      </div>
      <AccountForm currentEmail={email} />
    </div>
  );
}
