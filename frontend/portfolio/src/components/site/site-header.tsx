import Link from "next/link";

const NAV = [
  { href: "/profile", label: "소개" },
  { href: "/projects", label: "프로젝트" },
  { href: "/blog", label: "블로그" },
];

export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between px-4">
        <Link href="/" className="font-semibold">
          Portfolio
        </Link>
        <nav className="flex gap-5 text-sm">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="text-muted-foreground hover:text-foreground">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
