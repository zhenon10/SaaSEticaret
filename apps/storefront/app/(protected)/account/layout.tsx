import { api } from '@/lib/api';
import { AccountSidebar } from '@/components/AccountNav';

async function getUserName() {
  try {
    const user = await api.auth.me();
    if (user.firstName || user.lastName) {
      return `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
    }
    return user.email;
  } catch {
    return null;
  }
}

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const userName = await getUserName();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex gap-6">
        {/* Sidebar */}
        <aside className="w-64 shrink-0">
          {userName && (
            <div className="mb-4 rounded-xl border p-4 font-semibold text-sm">
              {userName}
            </div>
          )}
          <AccountSidebar />
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
