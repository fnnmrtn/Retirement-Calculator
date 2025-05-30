"use strict";

const calculator = function (
  currAge,
  retireAge,
  investPM,
  initialInvestment,
  retireGoal,
  interestRate,
  currency = "GBP", // default
  rateVariation = 0 // variation range (e.g., 0.01 = ±1%)
) {
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

    // VARIABLES
    const investmentTimeMonths = (retireAge - currAge) * 12;

    // Helper function to calculate savings for a given rate
    const calculateSavings = (rate) => {
      const monthlyRate = rate / 12;
      const futureInitial =
        initialInvestment * Math.pow(1 + monthlyRate, investmentTimeMonths);
      const futureContributions =
        investPM *
        ((Math.pow(1 + monthlyRate, investmentTimeMonths) - 1) / monthlyRate);
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
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }
};

// Examples with rate variation
console.log("=== USD Example with ±1% Rate Variation ===");
calculator(25, 65, 500, 1000, 500000, 0.07, "USD", 0.01);

console.log("\n=== EUR Example with ±2% Rate Variation ===");
calculator(30, 60, 300, 5000, 200000, 0.05, "EUR", 0.02);

console.log("\n=== GBP Example with No Variation (Original) ===");
calculator(20, 60, 50, 100, 50000, 0.03, "GBP", 0);

console.log("\n=== GBP Example with ±0.5% Rate Variation ===");
calculator(20, 60, 50, 100, 50000, 0.03, "GBP", 0.005);
