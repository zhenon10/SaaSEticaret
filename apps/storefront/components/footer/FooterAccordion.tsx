'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
export interface FooterAccordionSection {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface Props {
  sections: FooterAccordionSection[];
}

function AccordionPanel({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/10">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-3 text-left text-sm font-semibold text-white"
      >
        {title}
        <ChevronDown className={`h-4 w-4 text-white/70 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  );
}

export function FooterLinkList({ links }: { links: { label: string; href: string }[] }) {
  return (
    <ul className="space-y-2 text-sm text-white/75">
      {links.map((l) => (
        <li key={`${l.label}-${l.href}`}>
          <Link href={l.href} className="transition-colors hover:text-white">
            {l.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function FooterAccordion({ sections }: Props) {
  return (
    <div className="lg:hidden">
      {sections.map((s, i) => (
        <AccordionPanel key={s.id} title={s.title} defaultOpen={i === 0}>
          {s.content}
        </AccordionPanel>
      ))}
    </div>
  );
}
