import { KeyRound, Mail, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, Avatar, Badge, Button, Input } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  OPERATIONS_ADMIN: 'Operations Admin',
  SUPPORT_ADMIN: 'Support Admin',
  READ_ONLY: 'Read Only',
};

export default function ProfilePage() {
  const { user } = useAuth();
  const { adminRole, permissions } = usePermissions();

  return (
    <>
      <PageHeader title="Profile" description="Your administrator account." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="flex flex-col items-center p-6 text-center">
          <Avatar name={user?.email ?? 'Admin'} size={72} />
          <h3 className="mt-4 text-base font-bold text-slate-900">{user?.email?.split('@')[0] ?? 'Administrator'}</h3>
          <p className="text-sm text-slate-500">{user?.email ?? '—'}</p>
          <Badge variant="brand" className="mt-3">
            {ROLE_LABEL[adminRole]}
          </Badge>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          <Card className="p-5">
            <h3 className="mb-4 text-sm font-semibold text-slate-900">Account</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Email" value={user?.email ?? ''} leftIcon={<Mail className="h-4 w-4" />} disabled />
              <Input label="Role" value={ROLE_LABEL[adminRole]} leftIcon={<ShieldCheck className="h-4 w-4" />} disabled />
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Change password</h3>
              <Badge variant="neutral">Coming soon</Badge>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="New password" type="password" placeholder="••••••••" disabled />
              <Input label="Confirm password" type="password" placeholder="••••••••" disabled />
            </div>
            <Button className="mt-4" disabled leftIcon={<KeyRound className="h-4 w-4" />}>
              Update password
            </Button>
            <p className="mt-2 text-xs text-slate-400">
              TODO(backend): no change-password endpoint yet.
            </p>
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Permissions</h3>
            <div className="flex flex-wrap gap-2">
              {permissions.map((p) => (
                <Badge key={p} variant="info">
                  {p}
                </Badge>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
