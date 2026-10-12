import { jsPDF } from 'jspdf';
import { MealRecord, BillingSummary } from '../types';

export function generateTiffinRecordPDF(
  meals: MealRecord[],
  billing: BillingSummary,
  options?: {
    studentName?: string;
    messName?: string;
  }
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 36;
  const contentWidth = pageWidth - margin * 2;

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(20, 20, 20);

  const formatDateDisplay = (isoStr: string) => {
    try {
      const parts = isoStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      }
      return isoStr;
    } catch {
      return isoStr;
    }
  };

  const startFormatted = formatDateDisplay(billing.periodStart);
  const endFormatted = formatDateDisplay(billing.periodEnd);
  const titleText = `Tiffin Record - ${startFormatted} to ${endFormatted}`;
  doc.text(titleText, pageWidth / 2, 45, { align: 'center' });

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(90, 90, 90);
  const subtitle = `2 tiffins scheduled per day (Lunch + Dinner) | Cost per tiffin: Rs. ${billing.costPerTiffin} | Only dates through ${endFormatted} are counted`;
  doc.text(subtitle, pageWidth / 2, 60, { align: 'center' });

  // Optional Student / Mess banner
  if (options?.studentName || options?.messName) {
    doc.setFontSize(8);
    doc.setTextColor(110, 110, 110);
    const extraInfo = [
      options.studentName ? `Aspirant: ${options.studentName}` : '',
      options.messName ? `Mess: ${options.messName}` : '',
    ]
      .filter(Boolean)
      .join('  •  ');
    doc.text(extraInfo, pageWidth / 2, 72, { align: 'center' });
  }

  // Table Coordinates
  let startY = options?.studentName || options?.messName ? 84 : 76;
  const rowHeight = 17;
  const colWidths = [105, 100, 75, 75, 75, 93];
  // Total = 523, matches contentWidth ~ 523 (595 - 72)

  // Header background
  doc.setFillColor(242, 244, 247);
  doc.rect(margin, startY, contentWidth, rowHeight, 'F');
  doc.setDrawColor(210, 215, 220);
  doc.setLineWidth(0.5);
  doc.rect(margin, startY, contentWidth, rowHeight, 'S');

  // Header Texts
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(40, 40, 40);

  const headers = ['Date', 'Day', 'Lunch', 'Dinner', 'Received', 'Daily Cost'];
  let currentX = margin;
  headers.forEach((h, idx) => {
    const align = idx >= 2 ? 'center' : 'left';
    const textX = idx >= 2 ? currentX + colWidths[idx] / 2 : currentX + 8;
    doc.text(h, textX, startY + 11.5, { align: align as any });
    currentX += colWidths[idx];
  });

  // Table Body Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  let currentY = startY + rowHeight;

  meals.forEach((m, rowIndex) => {
    // If running out of room, handle gracefully
    if (currentY + rowHeight > pageHeight - 110) {
      doc.addPage();
      currentY = margin;
    }

    // Row alternating background
    if (rowIndex % 2 === 1) {
      doc.setFillColor(250, 250, 252);
      doc.rect(margin, currentY, contentWidth, rowHeight, 'F');
    }

    // Border line
    doc.setDrawColor(228, 231, 235);
    doc.line(margin, currentY + rowHeight, margin + contentWidth, currentY + rowHeight);

    let cellX = margin;

    // Date
    doc.setTextColor(40, 40, 40);
    const dateFormatted = new Date(m.date + 'T00:00:00').toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    doc.text(dateFormatted, cellX + 8, currentY + 11.5);
    cellX += colWidths[0];

    // Day
    doc.text(m.dayName, cellX + 8, currentY + 11.5);
    cellX += colWidths[1];

    // Lunch tick
    if (m.lunchReceived) {
      doc.setTextColor(22, 101, 52); // green checkmark
      doc.text('✓', cellX + colWidths[2] / 2, currentY + 11.5, { align: 'center' });
    }
    cellX += colWidths[2];

    // Dinner tick
    if (m.dinnerReceived) {
      doc.setTextColor(22, 101, 52); // green checkmark
      doc.text('✓', cellX + colWidths[3] / 2, currentY + 11.5, { align: 'center' });
    }
    cellX += colWidths[3];

    // Received Count
    doc.setTextColor(50, 50, 50);
    doc.text(String(m.totalReceived), cellX + colWidths[4] / 2, currentY + 11.5, { align: 'center' });
    cellX += colWidths[4];

    // Daily Cost
    doc.text(`Rs. ${m.dailyCost}`, cellX + colWidths[5] / 2, currentY + 11.5, { align: 'center' });

    currentY += rowHeight;
  });

  // Outer border of table
  doc.setDrawColor(200, 205, 210);
  doc.setLineWidth(0.6);
  doc.rect(margin, startY, contentWidth, currentY - startY, 'S');

  // Summary Box below table
  const summaryBoxY = currentY + 6;
  const summaryHeight = 36;
  doc.setFillColor(248, 249, 251);
  doc.rect(margin, summaryBoxY, contentWidth, summaryHeight, 'F');
  doc.rect(margin, summaryBoxY, contentWidth, summaryHeight, 'S');

  // Grid lines in summary box
  doc.setDrawColor(218, 222, 228);
  doc.line(margin, summaryBoxY + 18, margin + contentWidth, summaryBoxY + 18);
  const thirdWidth = contentWidth / 3;
  doc.line(margin + thirdWidth, summaryBoxY, margin + thirdWidth, summaryBoxY + summaryHeight);
  doc.line(margin + thirdWidth * 2, summaryBoxY, margin + thirdWidth * 2, summaryBoxY + summaryHeight);

  // Summary Row 1
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);

  // Col 1
  doc.text('Scheduled tiffins', margin + 10, summaryBoxY + 12);
  doc.setFont('helvetica', 'bold');
  doc.text(String(billing.scheduledTiffins), margin + thirdWidth - 14, summaryBoxY + 12, { align: 'right' });

  // Col 2
  doc.setFont('helvetica', 'normal');
  doc.text('Tiffins missed', margin + thirdWidth + 10, summaryBoxY + 12);
  doc.setFont('helvetica', 'bold');
  doc.text(String(billing.missedTiffins), margin + thirdWidth * 2 - 14, summaryBoxY + 12, { align: 'right' });

  // Col 3
  doc.setFont('helvetica', 'normal');
  doc.text('Tiffins received', margin + thirdWidth * 2 + 10, summaryBoxY + 12);
  doc.setFont('helvetica', 'bold');
  doc.text(String(billing.receivedTiffins), margin + contentWidth - 14, summaryBoxY + 12, { align: 'right' });

  // Summary Row 2
  doc.setFont('helvetica', 'normal');
  doc.text('Cost per tiffin', margin + 10, summaryBoxY + 30);
  doc.setFont('helvetica', 'bold');
  doc.text(`Rs. ${billing.costPerTiffin}`, margin + thirdWidth - 14, summaryBoxY + 30, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.text('Total cost', margin + thirdWidth + 10, summaryBoxY + 30);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 83, 45); // emerald dark
  doc.text(`Rs. ${billing.totalCost.toLocaleString('en-IN')}`, margin + thirdWidth * 2 - 14, summaryBoxY + 30, { align: 'right' });

  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'normal');
  doc.text('Days covered', margin + thirdWidth * 2 + 10, summaryBoxY + 30);
  doc.setFont('helvetica', 'bold');
  doc.text(String(billing.daysCovered), margin + contentWidth - 14, summaryBoxY + 30, { align: 'right' });

  // Legend
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  const legendY = summaryBoxY + summaryHeight + 14;
  doc.text(
    `Legend: ✓ = tiffin received; blank = tiffin not received. Partial days are marked with one ✓. ${endFormatted} is included in this calculation.`,
    margin,
    legendY
  );

  // Bottom Footer
  doc.setFontSize(7);
  doc.setTextColor(140, 140, 140);
  doc.text('Tiffin Record | Calculation based on user-provided attendance', pageWidth / 2, pageHeight - 20, {
    align: 'center',
  });

  doc.save(`Tiffin_Record_${billing.periodStart}_to_${billing.periodEnd}.pdf`);
}
