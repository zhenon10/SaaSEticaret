export default function Footer() {
  return (
    <footer className="border-t py-8 text-center text-sm text-muted-foreground">
      <div className="container mx-auto px-4">
        <p>© {new Date().getFullYear()} Mağaza. Tüm hakları saklıdır.</p>
      </div>
    </footer>
  );
}
