import AdminLayout from '../../components/admin/AdminLayout';
import { AdminPageHeader } from '../../components/admin/ui';
import { BroadcastPage } from '../../components/broadcast/BroadcastPage';

export default function AdminBroadcastPage() {
  return (
    <AdminLayout>
      <div className="admin-page-shell max-w-7xl space-y-6">
        <AdminPageHeader
          title="Broadcast Center"
          subtitle="Send notifications and updates from one unified composer."
        />
        <BroadcastPage />
      </div>
    </AdminLayout>
  );
}
