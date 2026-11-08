// Monthly end-of-month withdrawals after returns. Never round intermediate values.
export function portfolioDrawdown(principal, annualReturn, monthlyWithdrawal, years) {
  let balance = principal, cumulativeWithdrawals = 0, depletionMonth = null;
  const points = [{ month: 0, balance, cumulativeWithdrawals, actualWithdrawal: 0 }];
  for (let month = 1; month <= years * 12; month++) {
    const available = balance * (1 + annualReturn / 12);
    const actualWithdrawal = Math.min(monthlyWithdrawal, available);
    balance = Math.max(0, available - actualWithdrawal);
    cumulativeWithdrawals += actualWithdrawal;
    if (balance === 0 && monthlyWithdrawal > 0 && depletionMonth === null) depletionMonth = month;
    points.push({ month, balance, cumulativeWithdrawals, actualWithdrawal });
  }
  return { points, endingBalance: balance, totalWithdrawn: cumulativeWithdrawals, depletionMonth };
}
