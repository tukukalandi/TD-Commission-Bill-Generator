import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TDBillDetails } from './types';
import { numberToWords } from './utils';

export function downloadPDF(bill: TDBillDetails) {
  const doc = new jsPDF();
  
  const totalDeposit = bill.entries.reduce((sum, e) => sum + (Number(e.depositAmount) || 0), 0);
  const totalIncentive = bill.entries.reduce((sum, e) => sum + (Number(e.incentiveAmount) || 0), 0);
  
  // Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('DEPARTMENT OF POST INDIA', 105, 15, { align: 'center' });
  
  // Office Details
  doc.setFontSize(10);
  doc.text(`BO: ${bill.bo}`, 14, 25);
  doc.text(`SO: ${bill.so}`, 105, 25, { align: 'center' });
  doc.text(`HO: ${bill.ho}`, 196, 25, { align: 'right' });
  
  doc.setFontSize(14);
  doc.text('TD COMMISSION BPM INCENTIVE BILL', 105, 35, { align: 'center' });
  doc.setLineWidth(0.5);
  doc.line(60, 36, 150, 36);

  doc.setFontSize(10);
  doc.text(`For the Month Of: ${bill.month} ${bill.year}`, 14, 45);
  doc.text(`Dated: ${bill.dateString}`, 196, 45, { align: 'right' });

  // Table
  const tableData = bill.entries.map((entry, index) => [
    index + 1,
    entry.accountNo,
    entry.prNo,
    entry.depositorName,
    entry.depositAmount,
    entry.termOfDeposit,
    entry.rateOfIncentive,
    entry.incentiveAmount
  ]);
  
  // Pad table to 20 rows if needed
  const emptyRowsCount = Math.max(0, 20 - bill.entries.length);
  for (let i = 0; i < emptyRowsCount; i++) {
    tableData.push(['', '', '', '', '', '', '', '']);
  }
  
  tableData.push([
    '', '', '', 'TOTAL',
    totalDeposit > 0 ? totalDeposit.toString() : '',
    '', '',
    totalIncentive > 0 ? totalIncentive.toString() : ''
  ]);

  autoTable(doc, {
    startY: 50,
    head: [['SR NO', 'ACCOUNT NO', 'PR NO', 'NAME OF DEPOSITOR', 'DEPOSIT AMOUNT', 'TERM OF DEPOSIT', 'RATE OF INCENTIVE', 'INCENTIVE AMOUNT']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.5, fontStyle: 'bold' },
    bodyStyles: { textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.5 },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      4: { halign: 'center' },
      5: { halign: 'center' },
      6: { halign: 'center' },
      7: { halign: 'center' }
    },
    didParseCell: function(data) {
       if (data.row.index === tableData.length - 1) {
           data.cell.styles.fontStyle = 'bold';
       }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY || 150;
  
  let yPos = finalY + 10;
  // Signatures & Certifications Area
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  
  doc.text('Certified that all the above mentioned accounts are opened at Branch Office and not through any SAS agents.', 14, yPos);
  yPos += 7;
  doc.text('Certified that incentive for above mentioned accounts are not taken earlier.', 14, yPos);
  yPos += 7;
  doc.text(`Please give the acceptance of incentive amount RS :- ${totalIncentive}`, 14, yPos);
  yPos += 7;
  doc.text(`Rupees (In Words) :- ${totalIncentive > 0 ? numberToWords(totalIncentive).toUpperCase() : ''}`, 14, yPos);
  
  yPos += 15;
  doc.text('Signature of BPM _____________________ BO', 196, yPos, { align: 'right' });
  
  yPos += 10;
  doc.text('Acceptance granted for the amount of RS :-', 14, yPos);
  yPos += 10;
  doc.text('Rupees (In Words) :- ____________________________________', 14, yPos);
  doc.text('Signature of SPM _____________________ SO', 196, yPos, { align: 'right' });
  
  yPos += 12;
  doc.text('Incentive amount of RS :-', 14, yPos);
  yPos += 10;
  doc.text('Received Rupees (In Words) :- ___________________________', 14, yPos);
  doc.text('Signature of BPM _____________________ BO', 196, yPos, { align: 'right' });

  doc.save(`TD_Commission_Bill_${bill.month}_${bill.year}.pdf`);
}
