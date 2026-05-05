import Sidebar from '@/components/Sidebar';

export const dynamic = 'force-dynamic';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
