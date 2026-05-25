'use client';

import FooterAccordion, { FooterLinkList } from '@/components/footer/FooterAccordion';
import FooterContact from '@/components/footer/FooterContact';
import FooterNewsletter from '@/components/footer/FooterNewsletter';
import type { FooterColumn } from '@/lib/footer';

type Props = {
  columns: FooterColumn[];
  email: string;
  phone: string;
  phoneDigits: string;
  hours: string;
  address: string;
  whatsappEnabled: boolean;
  newsletterEnabled: boolean;
  storeName: string;
};

export default function FooterMobile({
  columns,
  email,
  phone,
  phoneDigits,
  hours,
  address,
  whatsappEnabled,
  newsletterEnabled,
  storeName,
}: Props) {
  const sections = [
    ...columns.map((col, i) => ({
      id: `col-${i}`,
      title: col.title,
      content: <FooterLinkList links={col.links} />,
    })),
    {
      id: 'contact',
      title: 'İletişim',
      content: (
        <FooterContact
          email={email}
          phone={phone}
          phoneDigits={phoneDigits}
          hours={hours}
          address={address}
          whatsappEnabled={whatsappEnabled}
          compact
        />
      ),
    },
    ...(newsletterEnabled
      ? [{ id: 'newsletter', title: 'Bülten', content: <FooterNewsletter storeName={storeName} /> }]
      : []),
  ];

  return <FooterAccordion sections={sections} />;
}
