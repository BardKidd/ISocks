export const mockSearchResponse = {
  bestMatches: [
    {
      '1. symbol': 'AAPL',
      '2. name': 'Apple Inc.',
      '3. type': 'Equity',
      '4. region': 'United States',
      '5. marketOpen': '09:30',
      '6. marketClose': '16:00',
      '7. timezone': 'UTC-04',
      '8. currency': 'USD',
      '9. matchScore': '1.0000',
    },
    {
      '1. symbol': 'APPL',
      '2. name': 'Appleton Partners Inc.',
      '3. type': 'Equity',
      '4. region': 'United States',
      '5. marketOpen': '09:30',
      '6. marketClose': '16:00',
      '7. timezone': 'UTC-04',
      '8. currency': 'USD',
      '9. matchScore': '0.8000',
    },
  ],
};

export const mockDailyResponse = {
  'Meta Data': {
    '1. Information': 'Daily Prices (open, high, low, close) and Volumes',
    '2. Symbol': 'AAPL',
    '3. Last Refreshed': '2024-01-15',
    '4. Output Size': 'Compact',
    '5. Time Zone': 'US/Eastern',
  },
  'Time Series (Daily)': {
    '2024-01-15': {
      '1. open': '185.92',
      '2. high': '186.40',
      '3. low': '183.43',
      '4. close': '185.85',
      '5. volume': '47471600',
    },
    '2024-01-12': {
      '1. open': '187.13',
      '2. high': '189.11',
      '3. low': '185.83',
      '4. close': '186.29',
      '5. volume': '54010000',
    },
  },
};

export const mockQuoteResponse = {
  'Global Quote': {
    '01. symbol': 'AAPL',
    '02. open': '185.92',
    '03. high': '186.40',
    '04. low': '183.43',
    '05. price': '185.85',
    '06. volume': '47471600',
    '07. latest trading day': '2024-01-15',
    '08. previous close': '186.29',
    '09. change': '-0.44',
    '10. change percent': '-0.2362%',
  },
};

export const mockHttpService = {
  get: jest.fn(),
};
