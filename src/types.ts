export interface TDAccountEntry {
  id: string;
  accountNo: string;
  prNo: string;
  depositorName: string;
  depositAmount: number | '';
  termOfDeposit: string;
  rateOfIncentive: number | '';
  incentiveAmount: number | '';
}

export interface TDBillDetails {
  id?: string;
  userId?: string;
  bo: string;
  so: string;
  ho: string;
  month: string;
  year: string;
  dateString: string;
  entries: TDAccountEntry[];
  createdAt?: number;
  status?: 'Pending' | 'Approved' | 'Rejected';
}
