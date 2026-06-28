// Static reference data for the seller onboarding wizard.
// States -> LGAs map (subset covering the states offered in the wizard) and Nigerian banks
// with Paystack bank codes (used by the account-resolution step).

export const NIGERIA_STATES: string[] = [
  "Lagos",
  "Abuja (FCT)",
  "Rivers",
  "Oyo",
  "Kano",
  "Enugu",
  "Kaduna",
  "Ogun",
  "Anambra",
  "Delta",
];

export const NIGERIA_LGAS: Record<string, string[]> = {
  Lagos: [
    "Agege", "Ajeromi-Ifelodun", "Alimosho", "Amuwo-Odofin", "Apapa", "Badagry",
    "Epe", "Eti-Osa", "Ifako-Ijaiye", "Ikeja", "Ikorodu", "Kosofe",
    "Lagos Island", "Lagos Mainland", "Mushin", "Ojo", "Oshodi-Isolo",
    "Shomolu", "Surulere", "Ibeju-Lekki",
  ],
  "Abuja (FCT)": [
    "Abaji", "Bwari", "Gwagwalada", "Kuje", "Kwali", "Municipal Area Council (AMAC)",
  ],
  Rivers: [
    "Port Harcourt", "Obio-Akpor", "Okrika", "Eleme", "Ikwerre", "Emohua",
    "Oyigbo", "Tai", "Gokana", "Khana", "Bonny", "Degema",
  ],
  Oyo: [
    "Ibadan North", "Ibadan North-East", "Ibadan North-West", "Ibadan South-East",
    "Ibadan South-West", "Egbeda", "Akinyele", "Lagelu", "Ido", "Oluyole",
    "Ogbomosho North", "Ogbomosho South", "Oyo East", "Oyo West",
  ],
  Kano: [
    "Kano Municipal", "Fagge", "Dala", "Gwale", "Tarauni", "Nassarawa",
    "Kumbotso", "Ungogo", "Dawakin Tofa", "Gezawa",
  ],
  Enugu: [
    "Enugu East", "Enugu North", "Enugu South", "Nsukka", "Udi", "Oji River",
    "Igbo-Eze North", "Udenu", "Awgu",
  ],
  Kaduna: [
    "Kaduna North", "Kaduna South", "Chikun", "Igabi", "Zaria", "Sabon Gari",
    "Kajuru", "Giwa", "Kachia",
  ],
  Ogun: [
    "Abeokuta North", "Abeokuta South", "Ado-Odo/Ota", "Ijebu Ode", "Ijebu North",
    "Sagamu", "Ifo", "Ewekoro", "Obafemi Owode",
  ],
  Anambra: [
    "Awka North", "Awka South", "Onitsha North", "Onitsha South", "Nnewi North",
    "Nnewi South", "Idemili North", "Idemili South", "Ihiala",
  ],
  Delta: [
    "Warri South", "Warri North", "Warri South-West", "Uvwie", "Udu", "Sapele",
    "Oshimili South", "Oshimili North", "Ughelli North", "Ethiope East",
  ],
};

export interface NigerianBank {
  name: string;
  code: string;
}

// Common Nigerian banks with Paystack bank codes.
export const NIGERIAN_BANKS: NigerianBank[] = [
  { name: "Access Bank", code: "044" },
  { name: "Citibank Nigeria", code: "023" },
  { name: "Ecobank Nigeria", code: "050" },
  { name: "Fidelity Bank", code: "070" },
  { name: "First Bank of Nigeria", code: "011" },
  { name: "First City Monument Bank (FCMB)", code: "214" },
  { name: "Guaranty Trust Bank (GTBank)", code: "058" },
  { name: "Heritage Bank", code: "030" },
  { name: "Jaiz Bank", code: "301" },
  { name: "Keystone Bank", code: "082" },
  { name: "Kuda Microfinance Bank", code: "50211" },
  { name: "Moniepoint MFB", code: "50515" },
  { name: "OPay (Paycom)", code: "999992" },
  { name: "PalmPay", code: "999991" },
  { name: "Polaris Bank", code: "076" },
  { name: "Providus Bank", code: "101" },
  { name: "Stanbic IBTC Bank", code: "221" },
  { name: "Sterling Bank", code: "232" },
  { name: "Union Bank of Nigeria", code: "032" },
  { name: "United Bank for Africa (UBA)", code: "033" },
  { name: "Unity Bank", code: "215" },
  { name: "Wema Bank", code: "035" },
  { name: "Zenith Bank", code: "057" },
];
