import { useEffect, useState } from "react";
import Product from "./Product";
import "./App.css";

function App() {
  const [productBenchmarks, setProductBenchmarks] = useState([]);
  const [exchangeRates, setExchangeRates] = useState([]);
  const [groupedByProvider, setGroupedByProvider] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE_URL = "https://substantive.pythonanywhere.com";
  const API_KEY = "590e3e17b6a26a8fcda726e2a91520e476e2c894";

  useEffect(() => {
    getProductBenchmarks();
    getExchangeRates();
  }, []);

  // Function to get product benchmarks
  const getProductBenchmarks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/product_benchmarks`, {
        headers: {
          "auth-key": API_KEY,
        },
      });

      if (!response.ok) {
        setError("Error fetching product benchmarks...");
        console.log(
          `Error fetching product benchmarks, status: ${response.status}`
        );
        return;
      }

      const json = await response.json();
      setProductBenchmarks(json.product_benchmarks);
      setError(null);
    } catch (error) {
      console.log(`Another unexpected error, ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to get exchange rates
  const getExchangeRates = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/exchange_rates`, {
        headers: {
          "auth-key": API_KEY,
        },
      });

      if (!response.ok) {
        setError("Error fetching exchange rates...");
        console.log(
          `Error fetching exchange rates, status: ${response.status}`
        );
        return;
      }

      const json = await response.json();
      setExchangeRates(json.exchange_rates);
      setError(null);
    } catch (error) {
      console.log(`Another unexpected error, ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // get exchange rate for currencies
  const getExchangeRateForCurrency = (fromCurrencyId, year) => {
    const rate = exchangeRates.find(
      (rate) => rate.from_currency_id === fromCurrencyId && rate.year === year
    );
    return rate ? rate.exchange_rate : 1;
  };

  // convert rate amounts to euros
  const convertRateToEuros = () => {
    return productBenchmarks.map((productBenchmark) => {
      const year = new Date(productBenchmark.start_date).getFullYear();
      const exchangeRate = getExchangeRateForCurrency(
        productBenchmark.currency.id,
        year
      );

      const benchmarkInEuros = productBenchmark.benchmark * exchangeRate;
      const paymentInEuros = productBenchmark.payment * exchangeRate;
      return {
        ...productBenchmark,
        benchmark: benchmarkInEuros,
        payment: paymentInEuros,
      };
    });
  };

  // Group product benchmarks by provider
  const groupByProvider = () => {
    return convertRateToEuros().reduce((acc, benchmark) => {
      const { provider_name, product_name } = benchmark;
      if (!acc[provider_name]) {
        acc[provider_name] = {};
      }
      if (!acc[provider_name][product_name]) {
        acc[provider_name][product_name] = [];
      }
      acc[provider_name][product_name].push(benchmark);
      return acc;
    }, {});
  };

  // Recalculate grouped data after productBenchmarks or exchangeRates change
  useEffect(() => {
    if (productBenchmarks.length && exchangeRates.length) {
      const groupedData = groupByProvider();
      setGroupedByProvider(groupedData);
    }
  }, [productBenchmarks, exchangeRates]);

  // Calculate total payments, benchmarks, and difference for each provider
  const calculateTotalsByProvider = () => {
    const groupedData = groupByProvider();
    const totals = {};

    Object.keys(groupedData).forEach((provider) => {
      let totalPayments = 0;
      let totalBenchmarks = 0;

      Object.values(groupedData[provider]).forEach((products) => {
        products.forEach((product) => {
          const payment = parseFloat(product.payment);
          const benchmark = parseFloat(product.benchmark);
          totalPayments += payment;
          totalBenchmarks += benchmark;
        });
      });

      totals[provider] = {
        totalPayments: totalPayments.toFixed(2),
        totalBenchmarks: totalBenchmarks.toFixed(2),
        totalDifference: (totalPayments - totalBenchmarks).toFixed(2),
      };
    });

    return totals;
  };

  const providerTotals = calculateTotalsByProvider();

  return (
    <div className="App">
      <h2>Provider and product payments vs benchmarks analysis</h2>
      <div>
        {loading && <span>loading...</span>}
        {error && <span>error...</span>}
        <ul>
          {!loading &&
            !error &&
            Object.keys(groupedByProvider).map((provider, index) => (
              <li key={index} className="provider-group">
                <div className="provider-group-header">
                  <h3>Provider: {provider}</h3>
                  <p>
                    Total Payment: {providerTotals[provider].totalPayments}{" "}
                    Euros
                  </p>
                  <p>
                    Total Benchmark: {providerTotals[provider].totalBenchmarks}{" "}
                    Euros
                  </p>
                  <p>
                    Total Difference (Payment - Benchmark):{" "}
                    {providerTotals[provider].totalDifference} Euros
                  </p>
                </div>

                <ul className="product-list">
                  {/* Render a chart for each product grouped by same provider */}
                  {Object.keys(groupedByProvider[provider]).map(
                    (product, subIndex) => (
                      <li key={subIndex} className="product">
                        <Product
                          product={groupedByProvider[provider][product]}
                        />
                      </li>
                    )
                  )}
                </ul>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
