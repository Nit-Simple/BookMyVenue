import { Bell, Globe, Lock, Palette, ShieldCheck, UserCog } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, Badge } from '@/components/ui';

/**
 * Placeholder Settings page — modular, ready for future sections. Each card is a
 * self-contained slot so real settings can be dropped in without restructuring.
 * TODO(backend): no settings/preferences endpoints exist yet.
 */
const SECTIONS = [
  { icon: UserCog, title: 'Account', desc: 'Manage your login email and password.' },
  { icon: Bell, title: 'Notifications', desc: 'Choose which alerts you receive.' },
  { icon: Palette, title: 'Appearance', desc: 'Theme and display preferences (dark mode ready).' },
  { icon: Globe, title: 'Localization', desc: 'Currency, timezone and language.' },
  { icon: Lock, title: 'Security', desc: 'Sessions, devices and 2FA.' },
  { icon: ShieldCheck, title: 'Payouts & Compliance', desc: 'Bank details and tax information.' },
];

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Configure your account and venue preferences." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map(({ icon: Icon, title, desc }) => (
          <Card key={title} className="p-5">
            <div className="flex items-start justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Icon className="h-5 w-5" />
              </span>
              <Badge variant="neutral">Coming soon</Badge>
            </div>
            <h3 className="mt-4 text-sm font-semibold text-slate-900">{title}</h3>
            <p className="mt-1 text-sm text-slate-500">{desc}</p>
          </Card>
        ))}
      </div>
    </>
  );
}
