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
        console.log(`Error fetching product benchmarks, status: ${response.status}`);
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
        console.log(`Error fetching exchange rates, status: ${response.status}`);
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

  const getExchangeRateForCurrency = (fromCurrencyId, year) => {
    const rate = exchangeRates.find(
      (rate) => rate.from_currency_id === fromCurrencyId && rate.year === year
    );
    return rate ? rate.exchange_rate : 1;
  };

  const convertRateToEuros = () => {
    return productBenchmarks.map((productBenchmark) => {
      const year = new Date(productBenchmark.start_date).getFullYear();
      const exchangeRate = getExchangeRateForCurrency(productBenchmark.currency.id, year);

      const benchmarkInEuros = productBenchmark.benchmark * exchangeRate;
      const paymentInEuros = productBenchmark.payment * exchangeRate;
      return {
        ...productBenchmark,
        benchmark: `${benchmarkInEuros.toFixed(2)} euros`,
        payment: `${paymentInEuros.toFixed(2)} euros`,
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

  // Calculate total benchmark difference for each provider
  const calculateDifferenceByProvider = () => {
    const groupedData = groupByProvider();
    const differences = {};

    Object.keys(groupedData).forEach((provider) => {
      let totalDifference = 0;

      Object.values(groupedData[provider]).forEach((products) => {
        products.forEach((product) => {
          const payment = parseFloat(product.payment);
          const benchmark = parseFloat(product.benchmark);
          totalDifference += payment - benchmark; // Difference per product
        });
      });

      differences[provider] = totalDifference.toFixed(2); // Store total difference for each provider
    });

    return differences;
  };

  const providerDifferences = calculateDifferenceByProvider();

  return (
    <div className="App">
      <h2>Provider payments vs benchmarks analyses</h2>
      <div>
        {loading && <span>loading...</span>}
        {error && <span>error...</span>}
        <ul>
          {!loading && !error && Object.keys(groupedByProvider).map((provider, index) => (
            <li key={index} className="provider-group">
              <h3>Provider: {provider}</h3>
              <p>Total benchmark difference (benchmark minus payment): {providerDifferences[provider]} Euros</p>
              <ul className="product-list">
                {Object.keys(groupedByProvider[provider]).map((product, subIndex) => (
                  <li key={subIndex} className="product">
                    <Product product={groupedByProvider[provider][product]} />
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
