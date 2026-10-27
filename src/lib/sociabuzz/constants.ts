export interface CountryInfo {
  currency: string;
  iso2: string;
}

export const SUPPORTED_COUNTRIES: Record<string, CountryInfo> = {
  // Southeast Asia
  Malaysia: { currency: 'MYR', iso2: 'MY' },
  Indonesia: { currency: 'IDR', iso2: 'ID' },
  Singapore: { currency: 'SGD', iso2: 'SG' },
  Philippines: { currency: 'PHP', iso2: 'PH' },
  Thailand: { currency: 'THB', iso2: 'TH' },

  // South Asia
  Pakistan: { currency: 'PKR', iso2: 'PK' },
  Bangladesh: { currency: 'BDT', iso2: 'BD' },
  'Sri Lanka': { currency: 'LKR', iso2: 'LK' },

  // Middle East
  'United Arab Emirates': { currency: 'AED', iso2: 'AE' },
  'Saudi Arabia': { currency: 'SAR', iso2: 'SA' },
  Qatar: { currency: 'QAR', iso2: 'QA' },

  // Africa
  Nigeria: { currency: 'NGN', iso2: 'NG' },
  'South Africa': { currency: 'ZAR', iso2: 'ZA' },

  // Europe
  'United Kingdom': { currency: 'GBP', iso2: 'GB' },
  Denmark: { currency: 'DKK', iso2: 'DK' },

  // Oceania
  Australia: { currency: 'AUD', iso2: 'AU' },
  'New Zealand': { currency: 'NZD', iso2: 'NZ' },

  // Americas
  'United States': { currency: 'USD', iso2: 'US' },
};

export function normalizeCountry(input?: string): { name: string; info: CountryInfo } {
  const name = (input || '').trim();
  if (!name) {
    return { name: 'Indonesia', info: SUPPORTED_COUNTRIES['Indonesia'] };
  }

  // Exact match
  if (SUPPORTED_COUNTRIES[name]) {
    return { name, info: SUPPORTED_COUNTRIES[name] };
  }

  // Case-insensitive / ISO2 match
  const lower = name.toLowerCase();
  for (const [cName, info] of Object.entries(SUPPORTED_COUNTRIES)) {
    if (cName.toLowerCase() === lower || info.iso2.toLowerCase() === lower) {
      return { name: cName, info };
    }
  }

  return { name: 'Indonesia', info: SUPPORTED_COUNTRIES['Indonesia'] };
}

export const GROUP_LABELS: Record<string, string> = {
  ewallet: 'E-Wallet',
  ewallet_id: 'E-Wallet',
  ewallet_all: 'E-Wallet',
  qris: 'QRIS',
  bank_transfer: 'Bank Transfer',
  bank_transfer_inter: 'Bank Transfer',
  direct_debit: 'Direct Debit',
  bank_redirect: 'Bank Redirect',
  retail_outlet: 'Retail Outlet',
  retail_outlet_ph: 'Retail Outlet',
  credit_card: 'Card',
  credit_card_stripe: 'Card',
  crypto: 'Crypto',
};
