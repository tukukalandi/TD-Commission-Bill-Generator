import { getAccessToken } from './firebase';
import { TDBillDetails } from './types';

export async function appendToSheet(spreadsheetId: string, bill: TDBillDetails) {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated for Google Sheets');
  
  // Format data for sheet
  // We'll flatten the entries and add BO/SO/HO/Date for each row
  const values: string[][] = [];
  
  bill.entries.forEach((entry, index) => {
    values.push([
      bill.bo,
      bill.so,
      bill.ho,
      bill.month,
      bill.year,
      bill.dateString,
      (index + 1).toString(),
      entry.accountNo,
      entry.prNo,
      entry.depositorName,
      entry.depositAmount.toString(),
      entry.termOfDeposit,
      entry.rateOfIncentive.toString(),
      entry.incentiveAmount.toString()
    ]);
  });
  
  // Try to append. It uses "Sheet1" by default, or auto-creates it if we specify the range A:N
  const range = 'Sheet1!A1:N';
  
  try {
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values
      })
    });
    
    if (!res.ok) {
      const errData = await res.json();
      // If "Sheet1" doesn't exist, we might get an error.
      if (errData.error?.message?.includes('Unable to parse range')) {
         throw new Error("Could not find 'Sheet1' in the provided spreadsheet. Please ensure there is a tab named 'Sheet1'.");
      }
      throw new Error(errData.error?.message || 'Failed to append to sheet');
    }
    
    return true;
  } catch (error) {
    console.error('Google Sheets Error:', error);
    throw error;
  }
}

export async function checkSheetAccess(spreadsheetId: string) {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated for Google Sheets');
  
  try {
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error?.message || 'Failed to access sheet');
    }
    
    // Add headers if sheet is empty maybe? We'll just assume they have headers or don't care it gets appended
    return true;
  } catch(error) {
    throw error;
  }
}
