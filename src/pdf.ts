import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TDBillDetails } from './types';
import { numberToWords } from './utils';

export function generatePDFDocument(bill: TDBillDetails) {
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

  let formattedDate = bill.dateString;
  if (bill.dateString && bill.dateString.includes('-')) {
    const [y, m, d] = bill.dateString.split('-');
    if (y && y.length === 4) {
      formattedDate = `${d}-${m}-${y}`;
    }
  }

  doc.setFontSize(10);
  doc.text(`For the Month Of: ${bill.month} ${bill.year}`, 14, 45);
  doc.text(`Dated: ${formattedDate}`, 196, 45, { align: 'right' });

  // Table
  const tableData = bill.entries.map((entry, index) => [
    index + 1,
    entry.accountNo,
    entry.prNo,
    entry.depositorName,
    entry.depositAmount,
    entry.termOfDeposit,
    entry.rateOfIncentive ? `${entry.rateOfIncentive}%` : '',
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
    styles: { fontSize: 9, cellPadding: 1.5, minCellHeight: 7 },
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
  
  let yPos = finalY + 8;
  if (yPos > 220) {
    doc.addPage();
    yPos = 20;
  }

  // Signatures & Certifications Area
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  
  doc.text('CERTIFIED THAT ALL THE ABOVE MENTIONED ACCOUNTS ARE OPENED AT BRANCH OFFICE AND NOT THROUGH ANY SAS AGENTS.', 14, yPos);
  yPos += 6;
  doc.text('CERTIFIED THAT INCENTIVE FOR ABOVE MENTIONED ACCOUNTS ARE NOT TAKEN EARLIER.', 14, yPos);
  yPos += 6;
  doc.text(`PLEASE GIVE THE ACCEPTANCE OF INCENTIVE AMOUNT RS :- ${totalIncentive}`, 14, yPos);
  yPos += 6;
  doc.text(`RUPEES (IN WORDS) :- ${totalIncentive > 0 ? numberToWords(totalIncentive).toUpperCase() : ''}`, 14, yPos);
  
  yPos += 12;
  doc.text('SIGNATURE OF BPM _____________________ BO', 196, yPos, { align: 'right' });
  
  yPos += 8;
  doc.text(`ACCEPTANCE GRANTED FOR THE AMOUNT OF RS :- ${totalIncentive}`, 14, yPos);
  yPos += 8;
  doc.text(`RUPEES (IN WORDS) :- ${totalIncentive > 0 ? numberToWords(totalIncentive).toUpperCase() : '____________________________________'}`, 14, yPos);
  doc.text('SIGNATURE OF SPM _____________________ SO', 196, yPos, { align: 'right' });
  
  yPos += 10;
  doc.text(`INCENTIVE AMOUNT OF RS :- ${totalIncentive}`, 14, yPos);
  yPos += 8;
  doc.text(`RECEIVED RUPEES (IN WORDS) :- ${totalIncentive > 0 ? numberToWords(totalIncentive).toUpperCase() : '___________________________'}`, 14, yPos);
  doc.text('SIGNATURE OF BPM _____________________ BO', 196, yPos, { align: 'right' });

  return doc;
}

export function downloadPDF(bill: TDBillDetails) {
  const doc = generatePDFDocument(bill);
  doc.save(`TD_Commission_Bill_${bill.month}_${bill.year}.pdf`);
}

export function getPDFBlobURL(bill: TDBillDetails): string {
  const doc = generatePDFDocument(bill);
  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
}
