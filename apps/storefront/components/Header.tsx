import Link from 'next/link';
import { cookies } from 'next/headers';
import { ShoppingCart, User } from 'lucide-react';

export default async function Header() {
  const cookieStore = await cookies();
  const isLoggedIn = !!cookieStore.get('st_at')?.value;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold text-primary">
          Mağaza
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/products" className="text-muted-foreground hover:text-foreground transition-colors">
            Ürünler
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/cart" className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted">
            <ShoppingCart className="h-5 w-5" />
          </Link>
          {isLoggedIn ? (
            <Link href="/account/orders" className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted">
              <User className="h-5 w-5" />
            </Link>
          ) : (
            <Link href="/login" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90">
              Giriş Yap
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
