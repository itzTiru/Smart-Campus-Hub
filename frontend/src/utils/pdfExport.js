import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// SLIIT brand colors
const SLIIT_BLUE = [0, 56, 101];       // #003865
const SLIIT_DARK = [33, 37, 41];       // #212529
const HEADER_BG = [0, 56, 101];
const ROW_ALT = [245, 247, 250];

// Status color map for PDF text
const STATUS_COLORS = {
  PENDING: [180, 140, 0],
  APPROVED: [22, 128, 57],
  REJECTED: [185, 28, 28],
  CANCELLED: [107, 114, 128],
  OPEN: [37, 99, 235],
  ASSIGNED: [67, 56, 202],
  WORKING_ON: [180, 140, 0],
  DECLINED: [225, 29, 72],
  IN_PROGRESS: [180, 140, 0],
  RESOLVED: [22, 128, 57],
  CLOSED: [107, 114, 128],
};

const PRIORITY_COLORS = {
  LOW: [22, 128, 57],
  MEDIUM: [180, 140, 0],
  HIGH: [234, 88, 12],
  CRITICAL: [185, 28, 28],
};

const formatDateTime = (dt) => {
  if (!dt) return '---';
  const d = new Date(dt);
  return d.toLocaleString('en-LK', {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
};

const formatDateOnly = (dt) => {
  if (!dt) return '---';
  const d = new Date(dt);
  return d.toLocaleDateString('en-LK', {
    year: 'numeric', month: 'short', day: '2-digit',
  });
};

/**
 * Draw the shared professional header on the PDF.
 */
function drawHeader(doc, title, filters) {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Blue header bar
  doc.setFillColor(...SLIIT_BLUE);
  doc.rect(0, 0, pageWidth, 38, 'F');

  // Main title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('Smart Campus Operations Hub', 14, 16);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(200, 215, 230);
  doc.text('IT3030 - Programming Applications & Frameworks', 14, 24);

  // SLIIT label on right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('SLIIT', pageWidth - 14, 16, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Sri Lanka Institute of Information Technology', pageWidth - 14, 23, { align: 'right' });

  // Report title area
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...SLIIT_DARK);
  doc.text(title, 14, 50);

  // Generated date
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  const now = new Date().toLocaleString('en-LK', {
    year: 'numeric', month: 'long', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
  doc.text(`Generated: ${now}`, 14, 57);

  // Filter info
  if (filters && filters.length > 0) {
    const filterStr = 'Filters: ' + filters.join(' | ');
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text(filterStr, 14, 63);
  }

  return filters && filters.length > 0 ? 68 : 63;
}

/**
 * Add page numbers to every page.
 */
function addPageNumbers(doc) {
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - 14, pageHeight - 10,
      { align: 'right' }
    );
    doc.text(
      'Smart Campus Operations Hub',
      14, pageHeight - 10
    );
  }
}

// ======================================================================
// Booking Report
// ======================================================================

export function generateBookingReport(bookings, filters = {}) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Build filter labels
  const filterLabels = [];
  if (filters.status) filterLabels.push(`Status: ${filters.status}`);
  if (filters.viewAll !== undefined) filterLabels.push(filters.viewAll ? 'Scope: All Bookings' : 'Scope: My Bookings');

  const startY = drawHeader(doc, 'Booking Report', filterLabels);

  // Table data
  const tableData = bookings.map((b, i) => [
    i + 1,
    b.id?.substring(0, 8) || '---',
    b.resource?.name || '---',
    b.user?.name || '---',
    formatDateTime(b.startTime),
    formatDateTime(b.endTime),
    (b.purpose || '---').substring(0, 40),
    b.status || '---',
    b.expectedAttendees ?? '---',
  ]);

  autoTable(doc, {
    startY: startY + 2,
    head: [['#', 'ID', 'Resource', 'User', 'Start Time', 'End Time', 'Purpose', 'Status', 'Attendees']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      lineColor: [220, 220, 220],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: HEADER_BG,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: ROW_ALT },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 20, font: 'courier' },
      2: { cellWidth: 32 },
      3: { cellWidth: 28 },
      4: { cellWidth: 38 },
      5: { cellWidth: 38 },
      6: { cellWidth: 50 },
      7: { cellWidth: 22, halign: 'center' },
      8: { cellWidth: 18, halign: 'center' },
    },
    didParseCell: (data) => {
      // Color-code status column
      if (data.section === 'body' && data.column.index === 7) {
        const status = data.cell.raw;
        if (STATUS_COLORS[status]) {
          data.cell.styles.textColor = STATUS_COLORS[status];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    margin: { left: 14, right: 14 },
  });

  // Summary stats
  const finalY = doc.lastAutoTable.finalY + 8;
  const counts = {
    total: bookings.length,
    APPROVED: 0, PENDING: 0, REJECTED: 0, CANCELLED: 0,
  };
  bookings.forEach((b) => { if (counts[b.status] !== undefined) counts[b.status]++; });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...SLIIT_DARK);
  doc.text('Summary', 14, finalY);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  const summaryItems = [
    { label: 'Total Bookings', value: counts.total, color: SLIIT_DARK },
    { label: 'Approved', value: counts.APPROVED, color: STATUS_COLORS.APPROVED },
    { label: 'Pending', value: counts.PENDING, color: STATUS_COLORS.PENDING },
    { label: 'Rejected', value: counts.REJECTED, color: STATUS_COLORS.REJECTED },
    { label: 'Cancelled', value: counts.CANCELLED, color: STATUS_COLORS.CANCELLED },
  ];

  let xPos = 14;
  summaryItems.forEach((item) => {
    doc.setTextColor(...item.color);
    doc.setFont('helvetica', 'bold');
    doc.text(`${item.value}`, xPos, finalY + 7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text(` ${item.label}`, xPos + doc.getTextWidth(`${item.value}`), finalY + 7);
    xPos += doc.getTextWidth(`${item.value} ${item.label}`) + 12;
  });

  addPageNumbers(doc);
  doc.save('booking-report.pdf');
}

// ======================================================================
// Ticket Report
// ======================================================================

export function generateTicketReport(tickets, filters = {}) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Build filter labels
  const filterLabels = [];
  if (filters.status) filterLabels.push(`Status: ${filters.status}`);
  if (filters.priority) filterLabels.push(`Priority: ${filters.priority}`);
  if (filters.category) filterLabels.push(`Category: ${filters.category}`);

  const startY = drawHeader(doc, 'Ticket Report', filterLabels);

  // Table data
  const tableData = tickets.map((t, i) => [
    i + 1,
    t.id?.substring(0, 8) || '---',
    (t.title || '---').substring(0, 45),
    t.category || '---',
    t.priority || '---',
    t.status || '---',
    t.reporter?.name || '---',
    t.location || '---',
    formatDateOnly(t.createdAt),
  ]);

  autoTable(doc, {
    startY: startY + 2,
    head: [['#', 'ID', 'Title', 'Category', 'Priority', 'Status', 'Reporter', 'Location', 'Created']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      lineColor: [220, 220, 220],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: HEADER_BG,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: ROW_ALT },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 20, font: 'courier' },
      2: { cellWidth: 55 },
      3: { cellWidth: 25 },
      4: { cellWidth: 22, halign: 'center' },
      5: { cellWidth: 24, halign: 'center' },
      6: { cellWidth: 30 },
      7: { cellWidth: 35 },
      8: { cellWidth: 28 },
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        // Color-code priority column
        if (data.column.index === 4) {
          const priority = data.cell.raw;
          if (PRIORITY_COLORS[priority]) {
            data.cell.styles.textColor = PRIORITY_COLORS[priority];
            data.cell.styles.fontStyle = 'bold';
          }
        }
        // Color-code status column
        if (data.column.index === 5) {
          const status = data.cell.raw;
          if (STATUS_COLORS[status]) {
            data.cell.styles.textColor = STATUS_COLORS[status];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    },
    margin: { left: 14, right: 14 },
  });

  // Summary stats
  const finalY = doc.lastAutoTable.finalY + 8;

  // Count by status
  const statusCounts = {
    OPEN: 0,
    ASSIGNED: 0,
    WORKING_ON: 0,
    DECLINED: 0,
    IN_PROGRESS: 0,
    RESOLVED: 0,
    CLOSED: 0,
    REJECTED: 0,
  };
  const priorityCounts = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
  tickets.forEach((t) => {
    if (statusCounts[t.status] !== undefined) statusCounts[t.status]++;
    if (priorityCounts[t.priority] !== undefined) priorityCounts[t.priority]++;
  });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...SLIIT_DARK);
  doc.text('Summary by Status', 14, finalY);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  const statusItems = [
    { label: 'Total', value: tickets.length, color: SLIIT_DARK },
    { label: 'Open', value: statusCounts.OPEN, color: STATUS_COLORS.OPEN },
    { label: 'Assigned', value: statusCounts.ASSIGNED, color: STATUS_COLORS.ASSIGNED },
    { label: 'Working On', value: statusCounts.WORKING_ON, color: STATUS_COLORS.WORKING_ON },
    { label: 'Declined', value: statusCounts.DECLINED, color: STATUS_COLORS.DECLINED },
    { label: 'In Progress', value: statusCounts.IN_PROGRESS, color: STATUS_COLORS.IN_PROGRESS },
    { label: 'Resolved', value: statusCounts.RESOLVED, color: STATUS_COLORS.RESOLVED },
    { label: 'Closed', value: statusCounts.CLOSED, color: STATUS_COLORS.CLOSED },
    { label: 'Rejected', value: statusCounts.REJECTED, color: STATUS_COLORS.REJECTED },
  ];

  let xPos = 14;
  statusItems.forEach((item) => {
    doc.setTextColor(...item.color);
    doc.setFont('helvetica', 'bold');
    doc.text(`${item.value}`, xPos, finalY + 7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text(` ${item.label}`, xPos + doc.getTextWidth(`${item.value}`), finalY + 7);
    xPos += doc.getTextWidth(`${item.value} ${item.label}`) + 10;
  });

  // Priority summary
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...SLIIT_DARK);
  doc.text('Summary by Priority', 14, finalY + 15);

  doc.setFontSize(9);
  const priorityItems = [
    { label: 'Low', value: priorityCounts.LOW, color: PRIORITY_COLORS.LOW },
    { label: 'Medium', value: priorityCounts.MEDIUM, color: PRIORITY_COLORS.MEDIUM },
    { label: 'High', value: priorityCounts.HIGH, color: PRIORITY_COLORS.HIGH },
    { label: 'Critical', value: priorityCounts.CRITICAL, color: PRIORITY_COLORS.CRITICAL },
  ];

  xPos = 14;
  priorityItems.forEach((item) => {
    doc.setTextColor(...item.color);
    doc.setFont('helvetica', 'bold');
    doc.text(`${item.value}`, xPos, finalY + 22);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text(` ${item.label}`, xPos + doc.getTextWidth(`${item.value}`), finalY + 22);
    xPos += doc.getTextWidth(`${item.value} ${item.label}`) + 12;
  });

  addPageNumbers(doc);
  doc.save('ticket-report.pdf');
}
