import type { Metadata } from 'next';
import { getServerApi } from '@/lib/server-api';
import SettingsForm from './SettingsForm';

export const metadata: Metadata = { title: 'Site Ayarları' };

export default async function SettingsPage() {
  const api = await getServerApi();
  let settings: Record<string, string> = {};
  try {
    settings = await api.settings.getAll();
  } catch {
    // graceful degradation
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Site Ayarları</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Storefront'ta görünen içerikleri buradan yönetin.
        </p>
      </div>
      <SettingsForm initialSettings={settings} />
    </div>
  );
}
