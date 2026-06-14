import { TDBillDetails } from './types';

export function numberToWords(num: number): string {
    if (num === 0) return 'Zero';
    num = Math.floor(Math.abs(num));

    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const formatTens = (n: number) => {
        if (n < 20) return a[n];
        return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : ' ');
    };

    const convert = (n: number) => {
        if (n < 100) return formatTens(n);
        if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 !== 0 ? 'and ' + formatTens(n % 100) : '');
        if (n < 100000) return convert(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 !== 0 ? convert(n % 1000) : '');
        if (n < 10000000) return convert(Math.floor(n / 100000)) + 'Lakh ' + (n % 100000 !== 0 ? convert(n % 100000) : '');
        return convert(Math.floor(n / 10000000)) + 'Crore ' + (n % 10000000 !== 0 ? convert(n % 10000000) : '');
    };

    return convert(num).trim() + ' Only';
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function downloadCSV(bill: TDBillDetails) {
  const headers = ['SR NO', 'ACCOUNT NO', 'PR NO', 'NAME OF DEPOSITOR', 'DEPOSIT AMOUNT', 'TERM OF DEPOSIT', 'RATE OF INCENTIVE', 'INCENTIVE AMOUNT'];
  
  const rows = bill.entries.map((entry, index) => [
    index + 1,
    `"${entry.accountNo}"`,
    `"${entry.prNo}"`,
    `"${entry.depositorName}"`,
    entry.depositAmount,
    `"${entry.termOfDeposit}"`,
    entry.rateOfIncentive,
    entry.incentiveAmount
  ]);
  
  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `TD_Commission_Bill_${bill.month}_${bill.year}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
