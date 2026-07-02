import type { Booking, Invoice } from '@/types';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format';

/**
 * Builds a printable HTML invoice and triggers a download. A real backend
 * would return a generated PDF; here we produce a self-contained HTML file.
 */
export function downloadInvoice(booking: Booking, invoice: Invoice): void {
  const p = invoice.breakdown;
  const rows: [string, number][] = [
    ['Venue / package charge', p.venuePrice],
    ...(p.guestCharge > 0 ? ([['Per-guest charges', p.guestCharge]] as [string, number][]) : []),
    ...(p.discount > 0 ? ([['Discount', -p.discount]] as [string, number][]) : []),
    ['Service charge (5%)', p.serviceCharge],
    ['GST (18%)', p.tax],
  ];

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>Invoice ${invoice.number}</title>
<style>
  body { font-family: Inter, Arial, sans-serif; color: #1e293b; max-width: 720px; margin: 40px auto; padding: 0 24px; }
  .head { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #0f766e; padding-bottom:16px; }
  .brand { font-size:22px; font-weight:800; color:#0f766e; }
  h2 { font-size:14px; color:#64748b; text-transform:uppercase; letter-spacing:.05em; }
  table { width:100%; border-collapse:collapse; margin-top:24px; }
  td { padding:10px 0; border-bottom:1px solid #f1f5f9; }
  td.amt { text-align:right; font-variant-numeric:tabular-nums; }
  .total td { border-top:2px solid #0f766e; font-weight:700; font-size:18px; padding-top:14px; }
  .meta { margin-top:20px; font-size:14px; line-height:1.7; color:#475569; }
  .badge { display:inline-block; background:#ecfdf5; color:#047857; padding:4px 10px; border-radius:999px; font-size:12px; font-weight:600; }
  .muted { color:#94a3b8; font-size:12px; margin-top:40px; }
</style></head>
<body>
  <div class="head">
    <div><div class="brand">BookMyVenue</div><p style="color:#64748b;font-size:13px;">Tax Invoice</p></div>
    <div style="text-align:right;">
      <h2>Invoice</h2>
      <p style="font-weight:600;">${invoice.number}</p>
      <p style="font-size:13px;color:#64748b;">${formatDateTime(invoice.issuedAt)}</p>
    </div>
  </div>

  <div class="meta">
    <strong>${booking.venueName}</strong> — ${booking.venueCity}<br/>
    Booking reference: <strong>${booking.reference}</strong><br/>
    Event date: ${formatDate(booking.eventDate)} · ${booking.guestCount} guests · ${booking.packageName}<br/>
    Payment status: <span class="badge">${booking.paymentStatus.replace('_', ' ')}</span>
  </div>

  <table>
    ${rows
      .map(
        ([label, amount]) =>
          `<tr><td>${label}</td><td class="amt">${amount < 0 ? '– ' : ''}${formatCurrency(Math.abs(amount))}</td></tr>`,
      )
      .join('')}
    <tr class="total"><td>Total</td><td class="amt">${formatCurrency(p.total)}</td></tr>
    <tr><td>Amount paid</td><td class="amt">${formatCurrency(invoice.amountPaid)}</td></tr>
    ${invoice.amountDue > 0 ? `<tr><td>Balance due</td><td class="amt">${formatCurrency(invoice.amountDue)}</td></tr>` : ''}
  </table>

  <p class="muted">This is a system-generated invoice from BookMyVenue. For support, contact hello@bookmyvenue.app.</p>
</body></html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${invoice.number}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
