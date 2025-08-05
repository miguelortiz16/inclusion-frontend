import { useState, useEffect } from 'react';

interface CurrencyResponse {
  usdRate: number;
  currency: string;
}

export const useCurrencyRate = (email: string | null) => {
  const [currencyData, setCurrencyData] = useState<CurrencyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrencyRate = async () => {
      if (!email) return;
      
      setLoading(true);
      try {
        const response = await fetch(`https://planbackend.us-east-1.elasticbeanstalk.com/api/v1/currency/user-rate?email=${encodeURIComponent(email)}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/vnd.api+json',
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch currency rate');
        }

        const data = await response.json();
        setCurrencyData(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch currency rate');
        setCurrencyData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrencyRate();
  }, [email]);

  const convertToLocalCurrency = (usdAmount: number): string | null => {
    if (!currencyData?.usdRate) return null;
    const localAmount = usdAmount * currencyData.usdRate;
    return Math.round(localAmount).toString();
  };

  return {
    currencyData,
    loading,
    error,
    convertToLocalCurrency
  };
}; 