interface ExchangeRateData {
  base: string;
  date: string;
  rates: Record<string, number>;
  timestamp: number;
}

interface CacheEntry {
  data: ExchangeRateData;
  lastUpdated: number;
}

class ExchangeRateService {
  private cache: CacheEntry | null = null;
  private readonly CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
  private readonly API_BASE_URL = 'https://api.exchangeratesapi.io/v1/latest';
  private readonly CACHE_KEY = 'exchange_rates_cache';
  
  private async fetchExchangeRates(): Promise<ExchangeRateData> {
    const apiKey = process.env.NEXT_PUBLIC_RATE_API_KEY;
    if (!apiKey) {
      throw new Error('RATE_API_KEY not found in environment variables');
    }

    const url = `${this.API_BASE_URL}?access_key=${apiKey}&base=EUR&symbols=USD,GBP,JPY,CAD,AUD,CHF,CNY,SEK,NZD,MXN,SGD,HKD,NOK,TRY,RUB,INR,BRL,ZAR,KRW,PLN,VND,THB,MYR,IDR,PHP,BND,KHR,LAK,MMK,TWD,DKK`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rates: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`API Error: ${data.error?.info || 'Unknown error'}`);
    }

    return {
      base: data.base,
      date: data.date,
      rates: data.rates,
      timestamp: Date.now()
    };
  }

  private loadCacheFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.CACHE_KEY);
      if (stored) {
        this.cache = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load cache from localStorage:', error);
    }
  }

  private saveCacheToStorage(): void {
    try {
      if (this.cache) {
        localStorage.setItem(this.CACHE_KEY, JSON.stringify(this.cache));
      }
    } catch (error) {
      console.warn('Failed to save cache to localStorage:', error);
    }
  }

  private isCacheValid(): boolean {
    if (!this.cache) {
      this.loadCacheFromStorage();
    }
    
    if (!this.cache) return false;
    
    const now = Date.now();
    const cacheAge = now - this.cache.lastUpdated;
    
    return cacheAge < this.CACHE_DURATION;
  }

  async getExchangeRates(): Promise<ExchangeRateData> {
    if (this.isCacheValid()) {
      return this.cache!.data;
    }

    try {
      const data = await this.fetchExchangeRates();
      this.cache = {
        data,
        lastUpdated: Date.now()
      };
      this.saveCacheToStorage();
      return data;
    } catch (error) {
      // If fetch fails and we have cached data, return it
      if (this.cache) {
        console.warn('Failed to fetch new rates, using cached data:', error);
        return this.cache.data;
      }
      throw error;
    }
  }

  async convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const rates = await this.getExchangeRates();
    
    // If base currency is EUR
    if (fromCurrency === 'EUR') {
      const toRate = rates.rates[toCurrency];
      if (!toRate) {
        throw new Error(`Exchange rate not found for ${toCurrency}`);
      }
      return amount * toRate;
    }
    
    if (toCurrency === 'EUR') {
      const fromRate = rates.rates[fromCurrency];
      if (!fromRate) {
        throw new Error(`Exchange rate not found for ${fromCurrency}`);
      }
      return amount / fromRate;
    }

    // For non-EUR conversions: USD → JPY = (EUR → JPY) ÷ (EUR → USD)
    const fromRate = rates.rates[fromCurrency];
    const toRate = rates.rates[toCurrency];
    
    if (!fromRate || !toRate) {
      throw new Error(`Exchange rates not found for ${fromCurrency} or ${toCurrency}`);
    }
    
    // Convert to EUR first, then to target currency
    const eurAmount = amount / fromRate;
    return eurAmount * toRate;
  }

  async getSupportedCurrencies(): Promise<string[]> {
    const rates = await this.getExchangeRates();
    return ['EUR', ...Object.keys(rates.rates)];
  }

  getCacheInfo(): { isValid: boolean; lastUpdated: number | null; nextUpdate: number | null } {
    if (!this.cache) {
      this.loadCacheFromStorage();
    }
    
    if (!this.cache) {
      return { isValid: false, lastUpdated: null, nextUpdate: null };
    }
    
    const isValid = this.isCacheValid();
    const nextUpdate = this.cache.lastUpdated + this.CACHE_DURATION;
    
    return {
      isValid,
      lastUpdated: this.cache.lastUpdated,
      nextUpdate
    };
  }
}

export const exchangeRateService = new ExchangeRateService();
export type { ExchangeRateData };