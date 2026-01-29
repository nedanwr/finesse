export type GracePeriodType = "none" | "no_payment" | "interest_only";

export interface AmortizationRow {
  period: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  totalPrincipal: number;
  totalInterest: number;
}

export function generateAmortizationSchedule(
  principal: number,
  annualRate: number,
  years: number,
  periodType: "monthly" | "yearly" = "yearly"
): AmortizationRow[] {
  if (principal <= 0 || years <= 0) return [];

  const monthlyRate = annualRate / 100 / 12;
  const numPayments = years * 12;

  // Calculate monthly payment
  let monthlyPayment: number;
  if (monthlyRate === 0) {
    monthlyPayment = principal / numPayments;
  } else {
    monthlyPayment =
      (principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
      (Math.pow(1 + monthlyRate, numPayments) - 1);
  }

  const schedule: AmortizationRow[] = [];
  let balance = principal;
  let totalPrincipal = 0;
  let totalInterest = 0;

  if (periodType === "monthly") {
    for (let month = 1; month <= numPayments; month++) {
      const interest = balance * monthlyRate;
      const principalPaid = monthlyPayment - interest;
      balance = Math.max(0, balance - principalPaid);
      totalPrincipal += principalPaid;
      totalInterest += interest;

      schedule.push({
        period: month,
        payment: monthlyPayment,
        principal: principalPaid,
        interest,
        balance,
        totalPrincipal,
        totalInterest,
      });
    }
  } else {
    // Yearly summary
    for (let year = 1; year <= years; year++) {
      let yearlyPrincipal = 0;
      let yearlyInterest = 0;
      let yearlyPayment = 0;

      for (let month = 1; month <= 12; month++) {
        const interest = balance * monthlyRate;
        const principalPaid = monthlyPayment - interest;
        balance = Math.max(0, balance - principalPaid);
        yearlyPrincipal += principalPaid;
        yearlyInterest += interest;
        yearlyPayment += monthlyPayment;
        totalPrincipal += principalPaid;
        totalInterest += interest;
      }

      schedule.push({
        period: year,
        payment: yearlyPayment,
        principal: yearlyPrincipal,
        interest: yearlyInterest,
        balance,
        totalPrincipal,
        totalInterest,
      });
    }
  }

  return schedule;
}

export interface InvestmentGrowthRow {
  year: number;
  contributions: number;
  interest: number;
  balance: number;
}

export function generateInvestmentSchedule(
  initial: number,
  monthly: number,
  annualRate: number,
  years: number
): InvestmentGrowthRow[] {
  const schedule: InvestmentGrowthRow[] = [];
  const monthlyRate = annualRate / 100 / 12;

  let balance = initial;
  let totalContributions = initial;

  // Add year 0 (starting point)
  schedule.push({
    year: 0,
    contributions: initial,
    interest: 0,
    balance: initial,
  });

  for (let year = 1; year <= years; year++) {
    let yearlyInterest = 0;

    for (let month = 1; month <= 12; month++) {
      const interest = balance * monthlyRate;
      balance += interest + monthly;
      yearlyInterest += interest;
      totalContributions += monthly;
    }

    schedule.push({
      year,
      contributions: totalContributions,
      interest: balance - totalContributions,
      balance,
    });
  }

  return schedule;
}

export interface LoanResult {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
}

export interface LoanWithGraceResult extends LoanResult {
  gracePayment: number;
  principalAfterGrace: number;
  graceInterest: number;
}

export interface BalloonLoanResult {
  monthlyPayment: number;
  balloonPayment: number;
  totalPayment: number;
  totalInterest: number;
}

export interface BulletLoanResult {
  monthlyPayment: number;
  finalPayment: number;
  totalPayment: number;
  totalInterest: number;
}

export interface MortgageResult {
  monthlyPrincipalInterest: number;
  monthlyPropertyTax: number;
  monthlyInsurance: number;
  monthlyHoa: number;
  totalMonthly: number;
  loanAmount: number;
  totalCost: number;
}

export interface InvestmentResult {
  futureValue: number;
  totalContributions: number;
  totalInterest: number;
}

export function calculateLoanPayment(
  principal: number,
  annualRate: number,
  years: number
): LoanResult {
  if (principal <= 0 || years <= 0) {
    return { monthlyPayment: 0, totalPayment: 0, totalInterest: 0 };
  }

  const monthlyRate = annualRate / 100 / 12;
  const numPayments = years * 12;

  if (monthlyRate === 0) {
    const monthlyPayment = principal / numPayments;
    return {
      monthlyPayment,
      totalPayment: principal,
      totalInterest: 0,
    };
  }

  const monthlyPayment =
    (principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
    (Math.pow(1 + monthlyRate, numPayments) - 1);

  const totalPayment = monthlyPayment * numPayments;
  const totalInterest = totalPayment - principal;

  return { monthlyPayment, totalPayment, totalInterest };
}

export function calculateLoanWithGracePeriod(
  principal: number,
  annualRate: number,
  years: number,
  gracePeriodMonths: number,
  gracePeriodType: GracePeriodType
): LoanWithGraceResult {
  if (principal <= 0 || years <= 0) {
    return {
      monthlyPayment: 0,
      gracePayment: 0,
      totalPayment: 0,
      totalInterest: 0,
      principalAfterGrace: 0,
      graceInterest: 0,
    };
  }

  const monthlyRate = annualRate / 100 / 12;
  const monthlyInterest = principal * monthlyRate;

  if (gracePeriodType === "none" || gracePeriodMonths === 0) {
    const result = calculateLoanPayment(principal, annualRate, years);
    return {
      ...result,
      gracePayment: 0,
      principalAfterGrace: principal,
      graceInterest: 0,
    };
  }

  let principalAfterGrace = principal;
  let gracePayment = 0;
  let totalGracePayments = 0;
  let graceInterest = 0;

  if (gracePeriodType === "no_payment") {
    principalAfterGrace = principal * Math.pow(1 + monthlyRate, gracePeriodMonths);
    graceInterest = principalAfterGrace - principal;
    gracePayment = 0;
    totalGracePayments = 0;
  } else if (gracePeriodType === "interest_only") {
    gracePayment = monthlyInterest;
    totalGracePayments = gracePayment * gracePeriodMonths;
    graceInterest = totalGracePayments;
    principalAfterGrace = principal;
  }

  const numPayments = years * 12;
  let monthlyPayment = 0;
  let totalRegularPayments = 0;

  if (monthlyRate === 0) {
    monthlyPayment = principalAfterGrace / numPayments;
    totalRegularPayments = principalAfterGrace;
  } else {
    monthlyPayment =
      (principalAfterGrace * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
      (Math.pow(1 + monthlyRate, numPayments) - 1);
    totalRegularPayments = monthlyPayment * numPayments;
  }

  const totalPayment = totalGracePayments + totalRegularPayments;
  const totalInterest = totalPayment - principal;

  return {
    monthlyPayment,
    gracePayment,
    totalPayment,
    totalInterest,
    principalAfterGrace,
    graceInterest,
  };
}

export function calculateBalloonLoan(
  principal: number,
  annualRate: number,
  years: number
): BalloonLoanResult {
  if (principal <= 0 || years <= 0) {
    return {
      monthlyPayment: 0,
      balloonPayment: 0,
      totalPayment: 0,
      totalInterest: 0,
    };
  }

  const monthlyRate = annualRate / 100 / 12;
  const numMonths = years * 12;

  // Interest-only payments during the term
  const monthlyPayment = principal * monthlyRate;
  const totalInterestPayments = monthlyPayment * numMonths;

  // Principal paid at maturity
  const balloonPayment = principal;

  const totalPayment = totalInterestPayments + balloonPayment;
  const totalInterest = totalInterestPayments;

  return {
    monthlyPayment,
    balloonPayment,
    totalPayment,
    totalInterest,
  };
}

export function calculateBulletLoan(
  principal: number,
  annualRate: number,
  years: number
): BulletLoanResult {
  if (principal <= 0 || years <= 0) {
    return {
      monthlyPayment: 0,
      finalPayment: 0,
      totalPayment: 0,
      totalInterest: 0,
    };
  }

  const monthlyRate = annualRate / 100 / 12;
  const numMonths = years * 12;

  // No monthly payments
  const monthlyPayment = 0;

  // Interest compounds, full amount due at maturity
  const finalPayment = principal * Math.pow(1 + monthlyRate, numMonths);
  const totalInterest = finalPayment - principal;

  return {
    monthlyPayment,
    finalPayment,
    totalPayment: finalPayment,
    totalInterest,
  };
}

export function calculateMortgage(
  homePrice: number,
  downPayment: number,
  annualRate: number,
  years: number,
  annualPropertyTax: number,
  annualInsurance: number,
  monthlyHoa: number = 0
): MortgageResult {
  const loanAmount = homePrice - downPayment;
  const { monthlyPayment } = calculateLoanPayment(loanAmount, annualRate, years);
  const monthlyPropertyTax = annualPropertyTax / 12;
  const monthlyInsurance = annualInsurance / 12;

  const totalMonthly = monthlyPayment + monthlyPropertyTax + monthlyInsurance + monthlyHoa;

  return {
    monthlyPrincipalInterest: monthlyPayment,
    monthlyPropertyTax,
    monthlyInsurance,
    monthlyHoa,
    totalMonthly,
    loanAmount,
    totalCost: totalMonthly * years * 12,
  };
}

export function calculateInvestment(
  initial: number,
  monthly: number,
  annualRate: number,
  years: number
): InvestmentResult {
  const monthlyRate = annualRate / 100 / 12;
  const numMonths = years * 12;

  const fvInitial = initial * Math.pow(1 + monthlyRate, numMonths);

  let fvContributions = 0;
  if (monthlyRate > 0) {
    fvContributions =
      monthly * ((Math.pow(1 + monthlyRate, numMonths) - 1) / monthlyRate);
  } else {
    fvContributions = monthly * numMonths;
  }

  const futureValue = fvInitial + fvContributions;
  const totalContributions = initial + monthly * numMonths;
  const totalInterest = futureValue - totalContributions;

  return { futureValue, totalContributions, totalInterest };
}
