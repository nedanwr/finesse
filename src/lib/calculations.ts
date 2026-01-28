export type GracePeriodType = "none" | "no_payment" | "interest_only";

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

export interface MortgageResult {
  monthlyPrincipalInterest: number;
  monthlyPropertyTax: number;
  monthlyInsurance: number;
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

export function calculateMortgage(
  homePrice: number,
  downPayment: number,
  annualRate: number,
  years: number,
  annualPropertyTax: number,
  annualInsurance: number
): MortgageResult {
  const loanAmount = homePrice - downPayment;
  const { monthlyPayment } = calculateLoanPayment(loanAmount, annualRate, years);
  const monthlyPropertyTax = annualPropertyTax / 12;
  const monthlyInsurance = annualInsurance / 12;

  return {
    monthlyPrincipalInterest: monthlyPayment,
    monthlyPropertyTax,
    monthlyInsurance,
    totalMonthly: monthlyPayment + monthlyPropertyTax + monthlyInsurance,
    loanAmount,
    totalCost: (monthlyPayment + monthlyPropertyTax + monthlyInsurance) * years * 12,
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
