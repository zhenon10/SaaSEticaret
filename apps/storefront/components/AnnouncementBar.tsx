import { api } from '@/lib/api';

export default async function AnnouncementBar() {
  try {
    const settings = await api.settings.getAll();
    if (settings['announcement.enabled'] !== 'true') return null;
    const text = settings['announcement.text'];
    if (!text) return null;
    return (
      <div className="bg-primary px-4 py-2 text-center text-sm font-medium text-white">
        {text}
      </div>
    );
  } catch {
    return null;
  }
}
