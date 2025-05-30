"use strict";

const calculator = function (params) {
  const {
    currAge,
    retireAge,
    investPM,
    initialInvestment,
    retireGoal,
    interestRate,
    currency = "GBP", // default
    rateVariation = 0, // variation range (e.g., 0.01 = ±1%)
    compoundFrequency = "monthly",
  } = params; // new parameter: "daily", "monthly", "quarterly", "yearly"}

  try {
    const currencySymbols = {
      GBP: "£",
      USD: "$",
      EUR: "€",
      JPY: "¥",
      CAD: "C$",
      AUD: "A$",
      CHF: "CHF ",
      SEK: "kr",
      NOK: "kr",
      DKK: "kr",
    };

    const symbol = currencySymbols[currency] || currency + " ";

    // Compound frequency mapping
    const compoundPeriods = {
      daily: 365,
      monthly: 12,
      quarterly: 4,
      yearly: 1,
    };

    // VALIDATION
    const inputs = [
      currAge,
      retireAge,
      investPM,
      initialInvestment,
      retireGoal,
      interestRate,
    ];
    if (inputs.some((i) => typeof i !== "number" || isNaN(i) || i < 0)) {
      throw new Error("All inputs must be positive numbers.");
    }

    if (currAge >= retireAge) {
      throw new Error("Retirement age must be greater than current age.");
    }

    if (retireAge > 116 || currAge < 12) {
      throw new Error("Double check your age.");
    }

    if (interestRate > 0.2) {
      throw new Error("Double check your interest rate");
    }

    if (rateVariation < 0 || rateVariation > interestRate) {
      throw new Error(
        "Rate variation must be positive and not exceed the base interest rate"
      );
    }

    if (!compoundPeriods.hasOwnProperty(compoundFrequency)) {
      throw new Error(
        "Compound frequency must be 'daily', 'monthly', 'quarterly', or 'yearly'"
      );
    }

    // VARIABLES
    const investmentTimeYears = retireAge - currAge;
    const investmentTimeMonths = investmentTimeYears * 12;
    const n = compoundPeriods[compoundFrequency]; // compounds per year

    // Helper function to calculate savings for a given rate
    const calculateSavings = (rate) => {
      const periodicRate = rate / n; // rate per compounding period
      const totalPeriods = n * investmentTimeYears; // total number of compounding periods

      // Future value of initial investment with compound interest
      const futureInitial =
        initialInvestment * Math.pow(1 + periodicRate, totalPeriods);

      // Future value of monthly contributions
      // We need to account for the fact that contributions are monthly but compounding may be different
      let futureContributions = 0;

      if (n === 12) {
        // Monthly compounding - simple case
        futureContributions =
          investPM *
          ((Math.pow(1 + periodicRate, totalPeriods) - 1) / periodicRate);
      } else {
        // For non-monthly compounding, we calculate each monthly contribution separately
        for (let month = 0; month < investmentTimeMonths; month++) {
          const remainingYears = (investmentTimeMonths - month) / 12;
          const remainingPeriods = n * remainingYears;
          futureContributions +=
            investPM * Math.pow(1 + periodicRate, remainingPeriods);
        }
      }

      return futureInitial + futureContributions;
    };

    // Calculate scenarios
    const baseScenario = calculateSavings(interestRate);
    const lowScenario =
      rateVariation > 0 ? calculateSavings(interestRate - rateVariation) : null;
    const highScenario =
      rateVariation > 0 ? calculateSavings(interestRate + rateVariation) : null;

    // OUTPUT
    console.log(`\n=== RETIREMENT CALCULATOR RESULTS ===`);
    console.log(
      `Compounding Frequency: ${
        compoundFrequency.charAt(0).toUpperCase() + compoundFrequency.slice(1)
      } (${n} times per year)`
    );

    if (rateVariation > 0) {
      console.log(
        `Interest Rate Range: ${((interestRate - rateVariation) * 100).toFixed(
          1
        )}% - ${((interestRate + rateVariation) * 100).toFixed(1)}%`
      );
      console.log(
        `Base Rate (${(interestRate * 100).toFixed(
          1
        )}%): ${symbol}${baseScenario.toFixed(2)}`
      );
      console.log(
        `Conservative (${((interestRate - rateVariation) * 100).toFixed(
          1
        )}%): ${symbol}${lowScenario.toFixed(2)}`
      );
      console.log(
        `Optimistic (${((interestRate + rateVariation) * 100).toFixed(
          1
        )}%): ${symbol}${highScenario.toFixed(2)}`
      );

      const difference = highScenario - lowScenario;
      console.log(`Potential Variation: ${symbol}${difference.toFixed(2)}`);
    } else {
      console.log(
        `Total saved at ${(interestRate * 100).toFixed(
          1
        )}%: ${symbol}${baseScenario.toFixed(2)}`
      );
    }

    // Goal analysis
    console.log(`\n=== GOAL ANALYSIS ===`);
    console.log(`Retirement Goal: ${symbol}${retireGoal.toFixed(2)}`);

    if (rateVariation > 0) {
      const scenarios = [
        {
          name: "Conservative",
          amount: lowScenario,
          rate: interestRate - rateVariation,
        },
        { name: "Base", amount: baseScenario, rate: interestRate },
        {
          name: "Optimistic",
          amount: highScenario,
          rate: interestRate + rateVariation,
        },
      ];

      scenarios.forEach((scenario) => {
        const difference = retireGoal - scenario.amount;
        if (scenario.amount < retireGoal) {
          console.log(
            `${scenario.name} (${(scenario.rate * 100).toFixed(
              1
            )}%): ⏳ Short by ${symbol}${difference.toFixed(2)}`
          );
        } else {
          console.log(
            `${scenario.name} (${(scenario.rate * 100).toFixed(
              1
            )}%): 🎯 Exceeds goal by ${symbol}${(-difference).toFixed(2)}`
          );
        }
      });
    } else {
      const difference = retireGoal - baseScenario;
      if (baseScenario < retireGoal) {
        console.log(
          `⏳ You still need ${symbol}${difference.toFixed(
            2
          )} to reach your goal`
        );
      } else {
        console.log(
          `🎯 You've met your goal! Surplus: ${symbol}${(-difference).toFixed(
            2
          )}`
        );
      }
    }

    // Retirement income analysis
    console.log(`\n=== RETIREMENT INCOME ANALYSIS ===`);
    const lifeExpectancy = 85;
    const retirementYears = lifeExpectancy - retireAge;

    if (retirementYears <= 0) {
      console.log("Life expectancy is not greater than retirement age.");
    } else {
      if (rateVariation > 0) {
        const conservativeAnnual = lowScenario / retirementYears;
        const conservativeMonthly = conservativeAnnual / 12;
        const optimisticAnnual = highScenario / retirementYears;
        const optimisticMonthly = optimisticAnnual / 12;

        console.log(
          `Annual Income Range: ${symbol}${conservativeAnnual.toFixed(
            2
          )} - ${symbol}${optimisticAnnual.toFixed(2)}`
        );
        console.log(
          `Monthly Income Range: ${symbol}${conservativeMonthly.toFixed(
            2
          )} - ${symbol}${optimisticMonthly.toFixed(2)}`
        );
      } else {
        const annualIncome = baseScenario / retirementYears;
        const monthlyIncome = annualIncome / 12;
        console.log(`Annual Income: ${symbol}${annualIncome.toFixed(2)}`);
        console.log(`Monthly Income: ${symbol}${monthlyIncome.toFixed(2)}`);
      }
    }
    console.log(
      `\n📊 Inflation Rule of Thumb: \nYour ${symbol}${baseScenario.toFixed(
        2
      )} in ${
        retireAge - currAge
      } years might have the purchasing power of roughly ${symbol}${(
        baseScenario * 0.5
      ).toFixed(2)} in today's money (assuming 2-3% annual inflation).`
    );
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }
};

// // Examples with different compound frequencies
// console.log("=== USD Example with Daily Compounding ===");
// calculator(25, 65, 500, 1000, 500000, 0.07, "USD", 0.01, "daily");

// console.log("\n=== EUR Example with Quarterly Compounding ===");
// calculator(30, 60, 300, 5000, 200000, 0.05, "EUR", 0.02, "quarterly");

// console.log("\n=== GBP Example with Yearly Compounding ===");
// calculator(20, 60, 50, 100, 50000, 0.03, "GBP", 0, "yearly");

// console.log("\n=== GBP Example with Monthly Compounding (Default) ===");
// calculator(20, 60, 50, 100, 50000, 0.03, "GBP", 0.005, "monthly");

calculator({
  currAge: 25,
  retireAge: 65,
  investPM: 500,
  initialInvestment: 1000,
  retireGoal: 500000,
  interestRate: 0.07,
  currency: "USD",
  rateVariation: 0.01,
  compoundFrequency: "daily",
});

console.log("\n=== EUR Example with Quarterly Compounding ===");
calculator({
  currAge: 30,
  retireAge: 60,
  investPM: 300,
  initialInvestment: 5000,
  retireGoal: 200000,
  interestRate: 0.05,
  currency: "EUR",
  rateVariation: 0.02,
  compoundFrequency: "quarterly",
});
