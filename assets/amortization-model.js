export function loanPayment(principal, annualRate, years) {
  const rate = annualRate / 1200, count = years * 12;
  return rate === 0 ? principal / count : principal * rate / -Math.expm1(-count * Math.log1p(rate));
}

export function amortizeLoan(principal, annualRate, years) {
  const rate = annualRate / 1200, count = years * 12;
  const payment = loanPayment(principal, annualRate, years);
  let balance = principal, cumulativeInterest = 0;
  let yearPrincipal = 0, yearInterest = 0;
  const monthly = [];
  const annual = [{ year: 0, balance, cumulativePrincipal: 0, principal: 0, interest: 0, payments: 0 }];
  for (let month = 1; month <= count; month++) {
    const interest = balance * rate;
    // Clear the remaining principal on the final payment; the adjustment is
    // floating-point residue, not an intermediate currency rounding step.
    const paidPrincipal = month === count ? balance : Math.min(balance, Math.max(0, payment - interest));
    balance = Math.max(0, balance - paidPrincipal);
    cumulativeInterest += interest;
    yearPrincipal += paidPrincipal;
    yearInterest += interest;
    monthly.push({ month, principal: paidPrincipal, interest, payment: paidPrincipal + interest, balance, cumulativePrincipal: principal - balance, cumulativeInterest });
    if (month % 12 === 0) {
      annual.push({ year: month / 12, balance, cumulativePrincipal: principal - balance, principal: yearPrincipal, interest: yearInterest, payments: yearPrincipal + yearInterest });
      yearPrincipal = 0; yearInterest = 0;
    }
  }
  const totalRepaid = rate === 0 ? principal : payment * count;
  return { payment, totalRepaid, totalInterest: totalRepaid - principal, monthly, annual };
}
