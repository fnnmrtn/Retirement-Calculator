// Retirement Calculator JavaScript

const calculator = function (params) {
  const {
    currAge,
    retireAge,
    investPM,
    initialInvestment,
    retireGoal,
    interestRate,
    currency = "USD",
    rateVariation = 0,
    compoundFrequency = "monthly",
  } = params;

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

  const compoundPeriods = {
    daily: 365,
    monthly: 12,
    quarterly: 4,
    yearly: 1,
  };

  // Validation
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

  // Variables
  const investmentTimeYears = retireAge - currAge;
  const investmentTimeMonths = investmentTimeYears * 12;
  const n = compoundPeriods[compoundFrequency];

  // Helper function to calculate savings for a given rate
  const calculateSavings = (rate) => {
    const periodicRate = rate / n;
    const totalPeriods = n * investmentTimeYears;

    // Future value of initial investment with compound interest
    const futureInitial =
      initialInvestment * Math.pow(1 + periodicRate, totalPeriods);

    // Future value of monthly contributions
    let futureContributions = 0;
    if (n === 12) {
      // Monthly compounding - simple case
      futureContributions =
        investPM *
        ((Math.pow(1 + periodicRate, totalPeriods) - 1) / periodicRate);
    } else {
      // For non-monthly compounding, calculate each monthly contribution separately
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

  return {
    symbol,
    baseScenario,
    lowScenario,
    highScenario,
    interestRate,
    rateVariation,
    compoundFrequency,
    n,
    retireGoal,
    investmentTimeYears,
    retireAge,
    currAge,
  };
};

// Utility function to format currency
function formatCurrency(amount, symbol) {
  return (
    symbol +
    amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

// Function to display results in the UI
function displayResults(results) {
  const {
    symbol,
    baseScenario,
    lowScenario,
    highScenario,
    interestRate,
    rateVariation,
    compoundFrequency,
    n,
    retireGoal,
    investmentTimeYears,
    retireAge,
    currAge,
  } = results;

  // Projection Results
  let projectionHTML = `
        <div class="result-item">
            <span class="result-label">Compounding Frequency</span>
            <span class="result-value neutral">${
              compoundFrequency.charAt(0).toUpperCase() +
              compoundFrequency.slice(1)
            } (${n}x/year)</span>
        </div>
    `;

  if (rateVariation > 0) {
    projectionHTML += `
            <div class="scenario-grid">
                <div class="scenario-card">
                    <div class="scenario-title">Conservative (${(
                      (interestRate - rateVariation) *
                      100
                    ).toFixed(1)}%)</div>
                    <div class="scenario-amount">${formatCurrency(
                      lowScenario,
                      symbol
                    )}</div>
                </div>
                <div class="scenario-card">
                    <div class="scenario-title">Base (${(
                      interestRate * 100
                    ).toFixed(1)}%)</div>
                    <div class="scenario-amount">${formatCurrency(
                      baseScenario,
                      symbol
                    )}</div>
                </div>
                <div class="scenario-card">
                    <div class="scenario-title">Optimistic (${(
                      (interestRate + rateVariation) *
                      100
                    ).toFixed(1)}%)</div>
                    <div class="scenario-amount">${formatCurrency(
                      highScenario,
                      symbol
                    )}</div>
                </div>
            </div>
        `;
  } else {
    projectionHTML += `
            <div class="result-item">
                <span class="result-label">Total at ${(
                  interestRate * 100
                ).toFixed(1)}%</span>
                <span class="result-value positive">${formatCurrency(
                  baseScenario,
                  symbol
                )}</span>
            </div>
        `;
  }

  document.getElementById("projectionResults").innerHTML = projectionHTML;

  // Goal Analysis
  let goalHTML = `
        <div class="result-item">
            <span class="result-label">Retirement Goal</span>
            <span class="result-value neutral">${formatCurrency(
              retireGoal,
              symbol
            )}</span>
        </div>
    `;

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
      const status = scenario.amount >= retireGoal;
      goalHTML += `
                <div class="result-item">
                    <span class="result-label">${scenario.name} Scenario</span>
                    <span class="result-value ${
                      status ? "positive" : "negative"
                    }">
                        ${status ? "🎯 +" : "⏳ -"}${formatCurrency(
        Math.abs(difference),
        symbol
      )}
                    </span>
                </div>
            `;
    });
  } else {
    const difference = retireGoal - baseScenario;
    const status = baseScenario >= retireGoal;
    goalHTML += `
            <div class="result-item">
                <span class="result-label">Goal Status</span>
                <span class="result-value ${status ? "positive" : "negative"}">
                    ${status ? "🎯 Surplus: " : "⏳ Needed: "}${formatCurrency(
      Math.abs(difference),
      symbol
    )}
                </span>
            </div>
        `;
  }

  document.getElementById("goalResults").innerHTML = goalHTML;

  // Income Analysis
  const lifeExpectancy = 85;
  const retirementYears = lifeExpectancy - retireAge;
  let incomeHTML = "";

  if (retirementYears > 0) {
    if (rateVariation > 0) {
      const conservativeAnnual = lowScenario / retirementYears;
      const conservativeMonthly = conservativeAnnual / 12;
      const optimisticAnnual = highScenario / retirementYears;
      const optimisticMonthly = optimisticAnnual / 12;

      incomeHTML = `
                <div class="result-item">
                    <span class="result-label">Annual Income Range</span>
                    <span class="result-value neutral">${formatCurrency(
                      conservativeAnnual,
                      symbol
                    )} - ${formatCurrency(optimisticAnnual, symbol)}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Monthly Income Range</span>
                    <span class="result-value neutral">${formatCurrency(
                      conservativeMonthly,
                      symbol
                    )} - ${formatCurrency(optimisticMonthly, symbol)}</span>
                </div>
            `;
    } else {
      const annualIncome = baseScenario / retirementYears;
      const monthlyIncome = annualIncome / 12;
      incomeHTML = `
                <div class="result-item">
                    <span class="result-label">Annual Income</span>
                    <span class="result-value positive">${formatCurrency(
                      annualIncome,
                      symbol
                    )}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Monthly Income</span>
                    <span class="result-value positive">${formatCurrency(
                      monthlyIncome,
                      symbol
                    )}</span>
                </div>
            `;
    }
  } else {
    incomeHTML = "<p>Life expectancy is not greater than retirement age.</p>";
  }

  document.getElementById("incomeResults").innerHTML = incomeHTML;

  // Inflation Info
  const inflationAdjusted = baseScenario * 0.5;
  document.getElementById("inflationInfo").innerHTML = `Your ${formatCurrency(
    baseScenario,
    symbol
  )} in ${investmentTimeYears} years might have the purchasing power of roughly ${formatCurrency(
    inflationAdjusted,
    symbol
  )} in today's money (assuming 2-3% annual inflation).`;

  // Show results
  document.getElementById("placeholder").classList.add("hidden");
  document.getElementById("results").classList.remove("hidden");
}

// Event listener for form submission
document
  .getElementById("calculatorForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    try {
      const params = {
        currAge: parseFloat(document.getElementById("currAge").value),
        retireAge: parseFloat(document.getElementById("retireAge").value),
        investPM: parseFloat(document.getElementById("investPM").value),
        initialInvestment: parseFloat(
          document.getElementById("initialInvestment").value
        ),
        retireGoal: parseFloat(document.getElementById("retireGoal").value),
        interestRate:
          parseFloat(document.getElementById("interestRate").value) / 100,
        currency: document.getElementById("currency").value,
        rateVariation:
          parseFloat(document.getElementById("rateVariation").value) / 100,
        compoundFrequency: document.getElementById("compoundFrequency").value,
      };

      const results = calculator(params);
      displayResults(results);
    } catch (error) {
      alert("Error: " + error.message);
    }
  });

// Calculate on page load with default values
window.addEventListener("load", function () {
  document.getElementById("calculatorForm").dispatchEvent(new Event("submit"));
});
