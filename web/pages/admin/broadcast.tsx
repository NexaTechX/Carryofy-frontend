import AdminLayout from '../../components/admin/AdminLayout';
import { AdminPageHeader } from '../../components/admin/ui';
import { BroadcastPage } from '../../components/broadcast/BroadcastPage';

export default function AdminBroadcastPage() {
  return (
    <AdminLayout>
      <AdminPageHeader
        title="Broadcast Center"
        subtitle="Send notifications and updates from one unified composer."
      />
      <BroadcastPage />
    </AdminLayout>
  );
}
