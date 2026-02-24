import { formatNgnFromKobo } from '../api/utils';
import type { OrderDistributionEntry } from './types';
import type { TopSellerEntry } from './types';

interface ReportPdfData {
  title: string;
  generatedAt: string;
  dateRange: { start: string; end: string };
  sales: { totalSales: number; totalOrders: number };
  earnings: { totalNet: number; totalGross: number; totalCommission: number };
  inventory: { totalProducts: number; totalQuantity: number; lowStockCount: number; outOfStockCount: number };
  orderDistribution: OrderDistributionEntry[];
  topSellers: TopSellerEntry[];
}

export async function exportReportPdf(data: ReportPdfData): Promise<void> {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);

  const doc = new jsPDF();
  const pageWidth = (doc as unknown as { internal: { pageSize: { getWidth: () => number } } }).internal.pageSize.getWidth();
  let y = 20;

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(data.title, 14, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${data.generatedAt}`, 14, y);
  doc.text(`Period: ${data.dateRange.start} — ${data.dateRange.end}`, 14, y + 6);
  y += 18;

  // Summary cards
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Summary', 14, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Sales: ${formatNgnFromKobo(data.sales.totalSales)} (${data.sales.totalOrders} orders)`, 14, y);
  y += 6;
  doc.text(
    `Earnings — Net: ${formatNgnFromKobo(data.earnings.totalNet)}, Gross: ${formatNgnFromKobo(data.earnings.totalGross)}, Commission: ${formatNgnFromKobo(data.earnings.totalCommission)}`,
    14,
    y
  );
  y += 6;
  doc.text(
    `Inventory — Products: ${data.inventory.totalProducts}, Units: ${data.inventory.totalQuantity.toLocaleString()}, Low stock: ${data.inventory.lowStockCount}, Out of stock: ${data.inventory.outOfStockCount}`,
    14,
    y
  );
  y += 14;

  // Order distribution
  doc.setFont('helvetica', 'bold');
  doc.text('Order distribution', 14, y);
  y += 6;

  autoTable(doc, {
    startY: y,
    head: [['Status', 'Count', 'Percentage']],
    body: data.orderDistribution.map((e) => [
      e.status.replace(/_/g, ' '),
      String(e.count),
      `${e.percentage.toFixed(1)}%`,
    ]),
    theme: 'plain',
    headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255] },
    styles: { fontSize: 9 },
  });
  const docWithTable = doc as unknown as { lastAutoTable?: { finalY: number } };
  y = (docWithTable.lastAutoTable?.finalY ?? y) + 12;

  // Top performing sellers
  if (data.topSellers.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('Top performing sellers', 14, y);
    y += 6;

    autoTable(doc, {
      startY: y,
      head: [['Seller', 'Revenue', 'Orders', 'Commission']],
      body: data.topSellers.map((s) => [
        s.sellerName,
        formatNgnFromKobo(s.revenue),
        String(s.orders),
        formatNgnFromKobo(s.commissionEarned),
      ]),
      theme: 'plain',
      headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255] },
      styles: { fontSize: 9 },
    });
  }

  doc.save(`report-${data.dateRange.start}-${data.dateRange.end}.pdf`);
}
