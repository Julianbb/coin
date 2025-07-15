
'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { exchangeRateService } from '@/lib/exchange-rates';


const formatNumber = (num: string | number): string => {
  if (!num || num === '') return '0';
  const numStr = typeof num === 'number' ? num.toString() : num;
  const [integer, decimal] = numStr.split('.');
  const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decimal ? `${formattedInteger}.${decimal}` : formattedInteger;
};

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷' },
  { code: 'AUD', name: 'Australian Dollar', symbol: '$', flag: '🇦🇺' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: '$', flag: '🇨🇦' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: '$', flag: '🇭🇰' },
  // Southeast Asian Currencies
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', flag: '🇻🇳' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: '$', flag: '🇸🇬' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', flag: '🇮🇩' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', flag: '🇵🇭' },
  { code: 'BND', name: 'Brunei Dollar', symbol: '$', flag: '🇧🇳' },
  { code: 'KHR', name: 'Cambodian Riel', symbol: '៛', flag: '🇰🇭' },
  { code: 'LAK', name: 'Lao Kip', symbol: '₭', flag: '🇱🇦' },
  { code: 'MMK', name: 'Myanmar Kyat', symbol: 'K', flag: '🇲🇲' },
  { code: 'TWD', name: 'New Taiwan Dollar', symbol: 'NT$', flag: '🇹🇼' },
  // Additional Popular Currencies
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', flag: '🇷🇺' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', flag: '🇲🇽' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', flag: '🇹🇷' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', flag: '🇳🇴' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', flag: '🇩🇰' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: '$', flag: '🇳🇿' },
];

export default function Page() {
  const [fromCurrency, setFromCurrency] = useState('EUR');
  const [toCurrency, setToCurrency] = useState('USD');
  const [amount, setAmount] = useState('');
  const [convertedAmount, setConvertedAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [fromSheetOpen, setFromSheetOpen] = useState(false);
  const [toSheetOpen, setToSheetOpen] = useState(false);
  const [fromSearch, setFromSearch] = useState('');
  const [toSearch, setToSearch] = useState('');
  const [favoriteCurrencies, setFavoriteCurrencies] = useState<string[]>([]);

  // Load saved data from localStorage on component mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favoriteCurrencies');
    if (savedFavorites) {
      setFavoriteCurrencies(JSON.parse(savedFavorites));
    }

    const savedFromCurrency = localStorage.getItem('fromCurrency');
    const savedToCurrency = localStorage.getItem('toCurrency');
    if (savedFromCurrency) {
      setFromCurrency(savedFromCurrency);
    }
    if (savedToCurrency) {
      setToCurrency(savedToCurrency);
    }
  }, []);

  // Save favorites to localStorage whenever favorites change
  useEffect(() => {
    localStorage.setItem('favoriteCurrencies', JSON.stringify(favoriteCurrencies));
  }, [favoriteCurrencies]);

  // Save currency selections to localStorage
  useEffect(() => {
    localStorage.setItem('fromCurrency', fromCurrency);
  }, [fromCurrency]);

  useEffect(() => {
    localStorage.setItem('toCurrency', toCurrency);
  }, [toCurrency]);

  

  useEffect(() => {
    const fetchExchangeRates = async () => {
      setLoading(true);
      try {
        const data = await exchangeRateService.getExchangeRates();
        setLastUpdated(new Date(data.timestamp).toLocaleTimeString());
      } catch (error: unknown) {
        if (error instanceof Error) {
          toast.error(`Fetch failed: ${error.message}`);
        } else {
          toast.error('An unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchExchangeRates();
  }, [fromCurrency]);


  const handleNumberInput = (num: string) => {
    if (num === '.' && amount.includes('.')) return;
    if (amount.length >= 10) return;
    setAmount(prev => prev + num);
  };

  const handleDelete = () => {
    setAmount(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setAmount('');
    setConvertedAmount('');
  };

  const handleSwap = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
    setAmount(convertedAmount);
  };

  const [currentRate, setCurrentRate] = useState(0);

  useEffect(() => {
    const updateRateAndConvert = async () => {
      if (fromCurrency && toCurrency) {
        try {
          const rate = await exchangeRateService.convertCurrency(1, fromCurrency, toCurrency);
          setCurrentRate(rate);
          
          // Convert amount if present
          if (amount && parseFloat(amount) > 0) {
            const result = rate * parseFloat(amount);
            setConvertedAmount(result.toFixed(2));
          } else {
            setConvertedAmount('');
          }
        } catch (error) {
          console.error('Conversion error:', error);
          setCurrentRate(0);
          setConvertedAmount('');
        }
      }
    };

    updateRateAndConvert();
  }, [amount, fromCurrency, toCurrency]);

  const toggleFavorite = (currencyCode: string) => {
    setFavoriteCurrencies(prev =>
      prev.includes(currencyCode)
        ? prev.filter(code => code !== currencyCode)
        : [...prev, currencyCode]
    );
  };

  const sortCurrenciesByFavorites = (currencies: typeof CURRENCIES) => {
    const favorites = currencies.filter(currency => favoriteCurrencies.includes(currency.code));
    const nonFavorites = currencies.filter(currency => !favoriteCurrencies.includes(currency.code));
    return [...favorites, ...nonFavorites];
  };

  const filteredFromCurrencies = sortCurrenciesByFavorites(
    CURRENCIES.filter(currency =>
      currency.code.toLowerCase().includes(fromSearch.toLowerCase()) ||
      currency.name.toLowerCase().includes(fromSearch.toLowerCase())
    )
  );

  const filteredToCurrencies = sortCurrenciesByFavorites(
    CURRENCIES.filter(currency =>
      currency.code.toLowerCase().includes(toSearch.toLowerCase()) ||
      currency.name.toLowerCase().includes(toSearch.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">

        {/* Currency Selection */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          {/* Exchange Rate Display */}
          <div className="text-center mb-4">
            <div className="text-sm text-gray-600 mb-1">
              Exchange Rate
              {loading ? (
                <span className="ml-2">• Updating rates...</span>
              ) : (
                <span className="ml-2">• Last updated: {lastUpdated}</span>
              )}
            </div>
            <div className="text-lg font-semibold text-gray-800">
              1 {fromCurrency} = {currentRate.toFixed(4)} {toCurrency}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* From Currency */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
              <Sheet open={fromSheetOpen} onOpenChange={(open) => {
                setFromSheetOpen(open);
                if (!open) setFromSearch('');
              }}>
                <SheetTrigger asChild>
                  <button className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{CURRENCIES.find(c => c.code === fromCurrency)?.flag}</span>
                      <span>{CURRENCIES.find(c => c.code === fromCurrency)?.symbol} {fromCurrency} - {CURRENCIES.find(c => c.code === fromCurrency)?.name}</span>
                    </div>
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="p-6">
                  <SheetHeader>
                    <SheetTitle>Select From Currency</SheetTitle>
                    <SheetDescription>Choose the currency you want to convert from.</SheetDescription>
                  </SheetHeader>
                  <div className="mt-6">
                    <input
                      type="text"
                      placeholder="Search currencies..."
                      value={fromSearch}
                      onChange={(e) => setFromSearch(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
                    />
                  </div>
                  <div className="max-h-[calc(100vh-320px)] overflow-y-auto space-y-3">
                    {filteredFromCurrencies.map(currency => (
                      <div
                        key={currency.code}
                        className={`w-full p-3 rounded-lg border transition-colors flex items-center justify-between ${
                          currency.code === fromCurrency
                            ? 'bg-blue-50 border-blue-500 text-blue-700'
                            : 'bg-white border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <button
                          onClick={() => {
                            setFromCurrency(currency.code);
                            setFromSheetOpen(false);
                          }}
                          className="flex-1 text-left"
                        >
                          <div className="font-medium flex items-center gap-2">
                            <span className="text-lg">{currency.flag}</span>
                            {favoriteCurrencies.includes(currency.code) && (
                              <span className="text-yellow-500">★</span>
                            )}
                            {currency.symbol} {currency.code}
                          </div>
                          <div className="text-sm text-gray-600">{currency.name}</div>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(currency.code);
                          }}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <span className={`text-lg ${
                            favoriteCurrencies.includes(currency.code) 
                              ? 'text-yellow-500' 
                              : 'text-gray-300'
                          }`}>
                            {favoriteCurrencies.includes(currency.code) ? '★' : '☆'}
                          </span>
                        </button>
                      </div>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Swap Button */}
            <div className="flex items-end pb-2">
              <button
                onClick={handleSwap}
                className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </button>
            </div>

            {/* To Currency */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
              <Sheet open={toSheetOpen} onOpenChange={(open) => {
                setToSheetOpen(open);
                if (!open) setToSearch('');
              }}>
                <SheetTrigger asChild>
                  <button className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{CURRENCIES.find(c => c.code === toCurrency)?.flag}</span>
                      <span>{CURRENCIES.find(c => c.code === toCurrency)?.symbol} {toCurrency} - {CURRENCIES.find(c => c.code === toCurrency)?.name}</span>
                    </div>
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="p-6">
                  <SheetHeader>
                    <SheetTitle>Select To Currency</SheetTitle>
                    <SheetDescription>Choose the currency you want to convert to.</SheetDescription>
                  </SheetHeader>
                  <div className="mt-6">
                    <input
                      type="text"
                      placeholder="Search currencies..."
                      value={toSearch}
                      onChange={(e) => setToSearch(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
                    />
                  </div>
                  <div className="max-h-[calc(100vh-320px)] overflow-y-auto space-y-3">
                    {filteredToCurrencies.map(currency => (
                      <div
                        key={currency.code}
                        className={`w-full p-3 rounded-lg border transition-colors flex items-center justify-between ${
                          currency.code === toCurrency
                            ? 'bg-blue-50 border-blue-500 text-blue-700'
                            : 'bg-white border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <button
                          onClick={() => {
                            setToCurrency(currency.code);
                            setToSheetOpen(false);
                          }}
                          className="flex-1 text-left"
                        >
                          <div className="font-medium flex items-center gap-2">
                            <span className="text-lg">{currency.flag}</span>
                            {favoriteCurrencies.includes(currency.code) && (
                              <span className="text-yellow-500">★</span>
                            )}
                            {currency.symbol} {currency.code}
                          </div>
                          <div className="text-sm text-gray-600">{currency.name}</div>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(currency.code);
                          }}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <span className={`text-lg ${
                            favoriteCurrencies.includes(currency.code) 
                              ? 'text-yellow-500' 
                              : 'text-gray-300'
                          }`}>
                            {favoriteCurrencies.includes(currency.code) ? '★' : '☆'}
                          </span>
                        </button>
                      </div>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        {/* Amount Display */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount ({fromCurrency})</label>
              <div className="text-3xl font-bold text-gray-800 min-h-[1.5em] p-2 bg-gray-50 rounded-lg">
                {formatNumber(amount)}
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Converted ({toCurrency})</label>
              <div className="text-3xl font-bold text-blue-600 min-h-[1.5em] p-2 bg-blue-50 rounded-lg">
                {formatNumber(convertedAmount)}
              </div>
            </div>
          </div>
        </div>

        {/* Virtual Keyboard */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="grid grid-cols-3 gap-3">
            {/* Number buttons */}
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                onClick={() => handleNumberInput(num.toString())}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xl font-semibold py-4 rounded-lg transition-colors active:bg-gray-300"
              >
                {num}
              </button>
            ))}
            
            {/* Bottom row */}
            <button
              onClick={() => handleNumberInput('.')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xl font-semibold py-4 rounded-lg transition-colors active:bg-gray-300"
            >
              .
            </button>
            
            <button
              onClick={() => handleNumberInput('0')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xl font-semibold py-4 rounded-lg transition-colors active:bg-gray-300"
            >
              0
            </button>
            
            <button
              onClick={handleDelete}
              className="bg-red-100 hover:bg-red-200 text-red-600 text-xl font-semibold py-4 rounded-lg transition-colors active:bg-red-300"
            >
              ⌫
            </button>
          </div>
          
          {/* Clear button */}
          <button
            onClick={handleClear}
            className="w-full mt-3 bg-red-500 hover:bg-red-600 text-white text-lg font-semibold py-4 rounded-lg transition-colors active:bg-red-700"
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
}