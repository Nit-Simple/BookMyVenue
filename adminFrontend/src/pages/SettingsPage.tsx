import { Bell, Globe, Info, Moon, Sun } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, Badge, Button, Select, Checkbox } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';

export default function SettingsPage() {
  const { theme, toggle } = useTheme();

  return (
    <>
      <PageHeader title="Settings" description="Manage your portal preferences." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Theme — functional */}
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            {theme === 'dark' ? <Moon className="h-4 w-4 text-brand-600" /> : <Sun className="h-4 w-4 text-brand-600" />}
            <h3 className="text-sm font-semibold text-slate-900">Appearance</h3>
          </div>
          <p className="mb-4 text-sm text-slate-500">
            Switch between light and dark mode. Dark-mode architecture is enabled platform-wide.
          </p>
          <Button variant="outline" onClick={toggle} leftIcon={theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}>
            Switch to {theme === 'dark' ? 'light' : 'dark'} mode
          </Button>
        </Card>

        {/* Notifications — placeholder */}
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-brand-600" />
              <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
            </div>
            <Badge variant="neutral">Coming soon</Badge>
          </div>
          <div className="space-y-3 opacity-60">
            <Checkbox checked onChange={() => {}} label="Email me on new venue registrations" />
            <Checkbox checked={false} onChange={() => {}} label="Email me on weekly summaries" />
          </div>
        </Card>

        {/* Language — placeholder */}
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-brand-600" />
              <h3 className="text-sm font-semibold text-slate-900">Language</h3>
            </div>
            <Badge variant="neutral">Coming soon</Badge>
          </div>
          <Select
            disabled
            value="en"
            onChange={() => {}}
            options={[{ value: 'en', label: 'English' }]}
          />
        </Card>

        {/* About */}
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Info className="h-4 w-4 text-brand-600" />
            <h3 className="text-sm font-semibold text-slate-900">About</h3>
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Application</dt>
              <dd className="font-medium text-slate-900">BookMyVenue Admin</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Version</dt>
              <dd className="font-medium text-slate-900">1.0.0</dd>
            </div>
          </dl>
        </Card>
      </div>
    </>
  );
}
