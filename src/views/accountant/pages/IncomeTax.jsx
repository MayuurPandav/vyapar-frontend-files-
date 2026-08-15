import React, { useState, useEffect } from 'react';

const taxTranslations = {
  en: {
    title: "Income Tax Department",
    desc: "Perform tax projections, compare liabilities under Old vs. New Tax Regimes (FY 2025-26), apply deductions, and download tax summary sheets.",
    grossSalary: "Annual Gross Salary (Rs.)",
    otherIncome: "Income from Other Sources (Rs.)",
    deductionsHeader: "Deductions & Exemptions (Applicable to Old Regime)",
    sec80c: "Section 80C Deductions (e.g. PPF, LIC, ELSS) - Max Rs. 1,50,000",
    sec80d: "Section 80D Deductions (Health Insurance) - Max Rs. 25,000",
    hraExempt: "HRA / House Rent Allowance Exemption (Rs.)",
    calculateBtn: "Calculate Income Tax",
    comparisonTitle: "Tax Regime Liability Comparison",
    oldRegime: "Old Tax Regime",
    newRegime: "New Tax Regime (Recommended)",
    grossTotal: "Gross Total Income",
    totalDeductions: "Total Deductions & Exemptions",
    netTaxable: "Net Taxable Income",
    basicTax: "Basic Income Tax",
    rebate87a: "Section 87A Tax Rebate",
    educationCess: "Health & Education Cess (4%)",
    netTaxPayable: "Net Income Tax Payable",
    regimeRecommendation: "Regime Recommendation",
    saveText: "You will save **Rs. {savings}** by choosing the **{regime}**!",
    standardDeduction: "Standard Deduction",
    exportTaxBtn: "Export Tax Calculation",
    copysuccess: "Tax sheet data copied to clipboard!",
    slabsTitle: "Current Slab Structures Applied (FY26)",
    oldSlabs: "Old Regime Slabs: Nil up to 2.5L, 5% to 5L, 20% to 10L, 30% above. Rebate up to 5L.",
    newSlabs: "New Regime Slabs: Nil up to 3L, 5% to 7L, 10% to 10L, 15% to 12L, 20% to 15L, 30% above. Rebate up to 7L."
  },
  hi: {
    title: "आयकर विभाग (Income Tax)",
    desc: "कर अनुमान की गणना करें, पुरानी बनाम नई कर व्यवस्था (FY 2025-26) के तहत देनदारियों की तुलना करें, कटौती लागू करें और कर विवरण डाउनलोड करें।",
    grossSalary: "वार्षिक सकल वेतन (Rs.)",
    otherIncome: "अन्य स्रोतों से आय (Rs.)",
    deductionsHeader: "कटौती और छूट (पुरानी कर व्यवस्था के लिए लागू)",
    sec80c: "धारा 80C कटौती (जैसे PPF, LIC, ELSS) - अधिकतम Rs. 1,50,000",
    sec80d: "धारा 80D कटौती (स्वास्थ्य बीमा) - अधिकतम Rs. 25,000",
    hraExempt: "HRA / मकान किराया भत्ता छूट (Rs.)",
    calculateBtn: "आयकर की गणना करें",
    comparisonTitle: "कर व्यवस्था देनदारी तुलना",
    oldRegime: "पुरानी कर व्यवस्था",
    newRegime: "नई कर व्यवस्था (अनुशंसित)",
    grossTotal: "कुल सकल आय",
    totalDeductions: "कुल कटौती और छूट",
    netTaxable: "शुद्ध कर योग्य आय",
    basicTax: "मूल आयकर",
    rebate87a: "धारा 87A कर छूट",
    educationCess: "स्वास्थ्य और शिक्षा उपकर (4%)",
    netTaxPayable: "शुद्ध देय आयकर",
    regimeRecommendation: "कर व्यवस्था की सिफारिश",
    saveText: "आप **{regime}** चुनकर **Rs. {savings}** की बचत करेंगे!",
    standardDeduction: "मानक कटौती (Standard Deduction)",
    exportTaxBtn: "कर विवरण एक्सपोर्ट करें",
    copysuccess: "टैक्स शीट डेटा क्लिपबोर्ड पर कॉपी किया गया!",
    slabsTitle: "लागू वर्तमान स्लैब संरचनाएं (FY26)",
    oldSlabs: "पुरानी स्लैब: 2.5L तक शून्य, 5L तक 5%, 10L तक 20%, ऊपर 30%। 5L तक कर छूट।",
    newSlabs: "नई स्लैब: 3L तक शून्य, 7L तक 5%, 10L तक 10%, 12L तक 15%, 15L तक 20%, ऊपर 30%। 7L तक कर छूट।"
  },
  mr: {
    title: "आयकर विभाग (Income Tax)",
    desc: "कराचे अंदाज लावा, जुन्या विरुद्ध नवीन कर प्रणाली (FY 2025-26) अंतर्गत दायित्वांची तुलना करा, वजावट लागू करा आणि कराचा संक्षिप्त अहवाल डाउनलोड करा.",
    grossSalary: "वार्षिक एकूण पगार (Rs.)",
    otherIncome: "इतर स्त्रोतांकडून उत्पन्न (Rs.)",
    deductionsHeader: "वजावट आणि सवलती (जुन्या कर प्रणालीसाठी लागू)",
    sec80c: "कलम 80C वजावट (उदा. PPF, LIC, ELSS) - कमाल Rs. 1,50,000",
    sec80d: "कलम 80D वजावट (आरोग्य विमा) - कमाल Rs. 25,000",
    hraExempt: "HRA / घरभाडे भत्ता सवलत (Rs.)",
    calculateBtn: "आयकराची गणना करा",
    comparisonTitle: "कर प्रणाली दायित्व तुलना",
    oldRegime: "जुनी कर प्रणाली",
    newRegime: "नवीन कर प्रणाली (शिफारस केलेले)",
    grossTotal: "एकूण सकल उत्पन्न",
    totalDeductions: "एकूण वजावट आणि सवलती",
    netTaxable: "निव्वळ करपात्र उत्पन्न",
    basicTax: "मूलभूत आयकर",
    rebate87a: "कलम 87A कर सवलत",
    educationCess: "आरोग्य आणि शिक्षण उपकर (4%)",
    netTaxPayable: "निव्वळ देय आयकर",
    regimeRecommendation: "कर प्रणाली शिफारस",
    saveText: "तुम्ही **{regime}** निवडून **Rs. {savings}** वाचवाल!",
    standardDeduction: "प्रमाणित वजावट (Standard Deduction)",
    exportTaxBtn: "कर विवरण एक्सपोर्ट करा",
    copysuccess: "टैक्स शीट डेटा क्लिपबोर्डवर कॉपी केला!",
    slabsTitle: "सध्या लागू असलेली कर स्लॅब रचना (FY26)",
    oldSlabs: "जुनी रचना: 2.5L पर्यंत शून्य, 5L पर्यंत 5%, 10L पर्यंत 20%, त्यावर 30%. 5L पर्यंत कर सवलत.",
    newSlabs: "नवीन रचना: 3L पर्यंत शून्य, 7L पर्यंत 5%, 10L पर्यंत 10%, 12L पर्यंत 15%, 15L पर्यंत 20%, त्यावर 30%. 7L पर्यंत कर सवलत."
  }
};

export default function IncomeTax() {
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'en');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  
  const [inputs, setInputs] = useState({
    grossSalary: 850000,
    otherIncome: 50000,
    sec80c: 120000,
    sec80d: 15000,
    hraExempt: 40000
  });

  const [results, setResults] = useState({
    grossTotal: 0,
    old: {
      standardDeduction: 50000,
      deductions: 0,
      taxableIncome: 0,
      basicTax: 0,
      rebate: 0,
      cess: 0,
      payable: 0
    },
    newRegime: {
      standardDeduction: 75000,
      deductions: 0,
      taxableIncome: 0,
      basicTax: 0,
      rebate: 0,
      cess: 0,
      payable: 0
    },
    savings: 0,
    bestRegime: ""
  });

  const [toast, setToast] = useState(null);

  const t = taxTranslations[lang] || taxTranslations.en;
  const isDark = theme === 'dark';

  useEffect(() => {
    const handleLangChange = () => setLang(localStorage.getItem('lang') || 'en');
    const handleThemeChange = () => setTheme(localStorage.getItem('theme') || 'light');
    window.addEventListener('languageChange', handleLangChange);
    window.addEventListener('themeChange', handleThemeChange);
    return () => {
      window.removeEventListener('languageChange', handleLangChange);
      window.removeEventListener('themeChange', handleThemeChange);
    };
  }, []);

  // Compute tax on mount or when inputs change
  useEffect(() => {
    calculateTaxes();
  }, [inputs, lang]);

  const handleInputChange = (field, value) => {
    const numVal = Math.max(0, parseInt(value) || 0);
    setInputs(prev => ({
      ...prev,
      [field]: numVal
    }));
  };

  const calculateOldRegimeTax = (taxableIncome) => {
    if (taxableIncome <= 0) return 0;
    
    // Rebate check under Section 87A (Rebate of up to Rs. 12,500 if income is <= 5,00,000)
    if (taxableIncome <= 500000) {
      return 0; // Fully rebated
    }

    let tax = 0;
    
    // Slab 1: Up to 2,50,000 -> Nil
    // Slab 2: 2,50,001 to 5,00,000 -> 5%
    if (taxableIncome > 250000) {
      tax += Math.min(250000, taxableIncome - 250000) * 0.05;
    }
    // Slab 3: 5,00,001 to 10,00,000 -> 20%
    if (taxableIncome > 500000) {
      tax += Math.min(500000, taxableIncome - 500000) * 0.20;
    }
    // Slab 4: Above 10,00,000 -> 30%
    if (taxableIncome > 100000) {
      tax += Math.max(0, taxableIncome - 1000000) * 0.30;
    }

    return tax;
  };

  const calculateNewRegimeTax = (taxableIncome) => {
    if (taxableIncome <= 0) return 0;

    // Rebate check under Section 87A (Rebate if income is <= 7,00,000)
    if (taxableIncome <= 700000) {
      return 0; // Fully rebated
    }

    let tax = 0;

    // Slab 1: Up to 3,00,000 -> Nil
    // Slab 2: 3,00,001 to 7,00,000 -> 5%
    if (taxableIncome > 300000) {
      tax += Math.min(400000, taxableIncome - 300000) * 0.05;
    }
    // Slab 3: 7,00,001 to 10,00,000 -> 10%
    if (taxableIncome > 700000) {
      tax += Math.min(300000, taxableIncome - 700000) * 0.10;
    }
    // Slab 4: 10,00,001 to 12,00,000 -> 15%
    if (taxableIncome > 1000000) {
      tax += Math.min(200000, taxableIncome - 1000000) * 0.15;
    }
    // Slab 5: 12,00,001 to 15,00,000 -> 20%
    if (taxableIncome > 1200000) {
      tax += Math.min(300000, taxableIncome - 1200000) * 0.20;
    }
    // Slab 6: Above 15,00,000 -> 30%
    if (taxableIncome > 1500000) {
      tax += Math.max(0, taxableIncome - 1500000) * 0.30;
    }

    return tax;
  };

  const calculateTaxes = () => {
    const grossTotal = inputs.grossSalary + inputs.otherIncome;

    // OLD REGIME CALCULATIONS
    const oldStdDeduction = 50000;
    const limited80C = Math.min(150000, inputs.sec80c);
    const limited80D = Math.min(250000, inputs.sec80d);
    const oldTotalDeductions = oldStdDeduction + limited80C + limited80D + inputs.hraExempt;
    const oldTaxableIncome = Math.max(0, grossTotal - oldTotalDeductions);
    const oldBasicTax = calculateOldRegimeTax(oldTaxableIncome);
    const oldRebate = (oldTaxableIncome <= 500000) ? oldBasicTax : 0;
    const oldTaxAfterRebate = Math.max(0, oldBasicTax - oldRebate);
    const oldCess = Math.round(oldTaxAfterRebate * 0.04);
    const oldPayable = oldTaxAfterRebate + oldCess;

    // NEW REGIME CALCULATIONS
    const newStdDeduction = 75000;
    const newTotalDeductions = newStdDeduction; // New Regime allows zero standard item exemptions except Standard deduction
    const newTaxableIncome = Math.max(0, grossTotal - newTotalDeductions);
    const newBasicTax = calculateNewRegimeTax(newTaxableIncome);
    const newRebate = (newTaxableIncome <= 700000) ? newBasicTax : 0;
    const newTaxAfterRebate = Math.max(0, newBasicTax - newRebate);
    const newCess = Math.round(newTaxAfterRebate * 0.04);
    const newPayable = newTaxAfterRebate + newCess;

    // Savings & Recommendations
    const savings = Math.abs(oldPayable - newPayable);
    let bestRegime = "";
    if (newPayable < oldPayable) {
      bestRegime = lang === 'hi' ? "नई कर व्यवस्था" : lang === 'mr' ? "नवीन कर प्रणाली" : "New Tax Regime";
    } else if (oldPayable < newPayable) {
      bestRegime = lang === 'hi' ? "पुरानी कर व्यवस्था" : lang === 'mr' ? "जुनी कर प्रणाली" : "Old Tax Regime";
    } else {
      bestRegime = lang === 'hi' ? "दोनों सामान हैं" : lang === 'mr' ? "दोन्ही समान आहेत" : "Either Regime";
    }

    setResults({
      grossTotal,
      old: {
        standardDeduction: oldStdDeduction,
        deductions: oldTotalDeductions - oldStdDeduction,
        taxableIncome: oldTaxableIncome,
        basicTax: oldBasicTax,
        rebate: oldRebate,
        cess: oldCess,
        payable: oldPayable
      },
      newRegime: {
        standardDeduction: newStdDeduction,
        deductions: 0,
        taxableIncome: newTaxableIncome,
        basicTax: newBasicTax,
        rebate: newRebate,
        cess: newCess,
        payable: newPayable
      },
      savings,
      bestRegime
    });
  };

  const handleExportData = () => {
    const csvContent = [
      `Metric,Old Tax Regime (Rs.),New Tax Regime (Rs.)`,
      `Gross Total Income,${results.grossTotal},${results.grossTotal}`,
      `Standard Deduction,${results.old.standardDeduction},${results.newRegime.standardDeduction}`,
      `Deductions & Exemptions,${results.old.deductions},${results.newRegime.deductions}`,
      `Net Taxable Income,${results.old.taxableIncome},${results.newRegime.taxableIncome}`,
      `Basic Tax calculated,${results.old.basicTax},${results.newRegime.basicTax}`,
      `Section 87A Rebate,${results.old.rebate},${results.newRegime.rebate}`,
      `Cess (4%),${results.old.cess},${results.newRegime.cess}`,
      `Net Tax Payable,${results.old.payable},${results.newRegime.payable}`,
      `Savings,${results.savings}`
    ].join('\n');

    navigator.clipboard.writeText(csvContent);
    showToast(t.copysuccess, 'success');
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className={`p-8 min-h-screen ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} transition-colors duration-300 font-sans`}>
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-fadeIn">
          <div className="flex items-center gap-3 px-6 py-3.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl shadow-xl text-sm font-black uppercase tracking-wider">
            <span className="h-2 w-2 rounded-full bg-current"></span>
            {toast.message}
          </div>
        </div>
      )}

      {/* Page Header */}
      <header className="mb-8 border-b pb-6 border-slate-200/60 dark:border-slate-800/40">
        <span className="text-[10px] font-black tracking-widest text-blue-600 dark:text-blue-400 block mb-1 uppercase">FY 2025-26 | TAX CALCULATOR</span>
        <h1 className="text-4xl font-black tracking-tight">{t.title}</h1>
        <p className="text-slate-400 font-semibold mt-1 max-w-3xl">{t.desc}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Form: Inputs */}
        <div className="card lg:col-span-5 flex flex-col gap-6">
          <h3 className="text-lg font-black uppercase tracking-wider pb-2 border-b border-slate-150/40 dark:border-slate-800">Tax Income Inputs</h3>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">{t.grossSalary}</label>
            <input 
              type="number" 
              value={inputs.grossSalary}
              onChange={(e) => handleInputChange('grossSalary', e.target.value)}
              className="fi"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">{t.otherIncome}</label>
            <input 
              type="number" 
              value={inputs.otherIncome}
              onChange={(e) => handleInputChange('otherIncome', e.target.value)}
              className="fi"
            />
          </div>

          <div className="flex flex-col gap-4 border-t border-slate-150/40 dark:border-slate-800 pt-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">{t.deductionsHeader}</h4>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.sec80c}</label>
              <input 
                type="number" 
                value={inputs.sec80c}
                onChange={(e) => handleInputChange('sec80c', e.target.value)}
                className="fi"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.sec80d}</label>
              <input 
                type="number" 
                value={inputs.sec80d}
                onChange={(e) => handleInputChange('sec80d', e.target.value)}
                className="fi"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.hraExempt}</label>
              <input 
                type="number" 
                value={inputs.hraExempt}
                onChange={(e) => handleInputChange('hraExempt', e.target.value)}
                className="fi"
              />
            </div>
          </div>
        </div>

        {/* Right Output Comparison Card */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Recommendation Banner */}
          <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-3xl shadow-md">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-200">{t.regimeRecommendation}</h3>
            <p className="text-xl font-black mt-2 font-sans tracking-tight">
              {results.savings > 0 ? (
                <span>{t.saveText.replace('{savings}', results.savings.toLocaleString()).replace('{regime}', results.bestRegime)}</span>
              ) : (
                <span>Both tax regimes incur the exact same liability!</span>
              )}
            </p>
          </div>

          {/* Comparison Spreadsheet Table */}
          <div className="card flex flex-col gap-6" style={{ padding: 0 }}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-150/40 dark:border-slate-800" style={{ padding: '20px 24px 12px 24px' }}>
              <h3 className="text-lg font-black uppercase tracking-wider">{t.comparisonTitle}</h3>
              
              <button 
                onClick={handleExportData}
                className="btn btn--primary btn--sm"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                {t.exportTaxBtn}
              </button>
            </div>

            <div className="overflow-x-auto scrollbar-none">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Tax Parameter</th>
                    <th style={{ textAlign: 'right' }}>{t.oldRegime}</th>
                    <th style={{ textAlign: 'right' }}>{t.newRegime}</th>
                  </tr>
                </thead>
                <tbody className="font-mono font-bold">
                  <tr>
                    <td className="text-slate-500 font-sans">{t.grossTotal}</td>
                    <td style={{ textAlign: 'right' }}>Rs. {results.grossTotal.toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }} className="text-blue-600 dark:text-blue-400">Rs. {results.grossTotal.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="text-slate-500 font-sans">{t.standardDeduction}</td>
                    <td style={{ textAlign: 'right' }} className="text-rose-500">- Rs. {results.old.standardDeduction.toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }} className="text-rose-500">- Rs. {results.newRegime.standardDeduction.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="text-slate-500 font-sans">{t.totalDeductions}</td>
                    <td style={{ textAlign: 'right' }} className="text-rose-500">- Rs. {results.old.deductions.toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }} className="text-rose-500">- Rs. {results.newRegime.deductions.toLocaleString()}</td>
                  </tr>
                  <tr className={isDark ? 'bg-slate-950/30 text-white' : 'bg-slate-50/50 text-slate-800'}>
                    <td className="font-sans font-black uppercase tracking-wider">{t.netTaxable}</td>
                    <td style={{ textAlign: 'right' }} className="font-black text-sm">Rs. {results.old.taxableIncome.toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }} className="text-blue-600 dark:text-blue-400 font-black text-sm">Rs. {results.newRegime.taxableIncome.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="text-slate-500 font-sans">{t.basicTax}</td>
                    <td style={{ textAlign: 'right' }}>Rs. {results.old.basicTax.toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }}>Rs. {results.newRegime.basicTax.toLocaleString()}</td>
                  </tr>
                  { (results.old.rebate > 0 || results.newRegime.rebate > 0) && (
                    <tr>
                      <td className="text-slate-500 font-sans">{t.rebate87a}</td>
                      <td style={{ textAlign: 'right' }} className="text-emerald-500">- Rs. {results.old.rebate.toLocaleString()}</td>
                      <td style={{ textAlign: 'right' }} className="text-emerald-500">- Rs. {results.newRegime.rebate.toLocaleString()}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="text-slate-500 font-sans">{t.educationCess}</td>
                    <td style={{ textAlign: 'right' }}>Rs. {results.old.cess.toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }}>Rs. {results.newRegime.cess.toLocaleString()}</td>
                  </tr>
                  <tr className="border-t-2" style={{ borderTopWidth: '2px', borderTopStyle: 'solid' }}>
                    <td className="font-sans font-extrabold text-sm uppercase tracking-wider">{t.netTaxPayable}</td>
                    <td style={{ textAlign: 'right' }} className="text-rose-500 text-base font-black">Rs. {results.old.payable.toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }} className="text-emerald-500 text-base font-black">Rs. {results.newRegime.payable.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Slabs Explainer */}
          <div className="card" style={{ fontSize: '12px', fontWeight: 600 }}>
            <h4 className="text-xs font-black uppercase tracking-wider mb-3 text-slate-400">{t.slabsTitle}</h4>
            <ul className="space-y-2 list-disc list-inside text-slate-500 dark:text-slate-400">
              <li>{t.newSlabs}</li>
              <li>{t.oldSlabs}</li>
            </ul>
          </div>

        </div>

      </div>
    </div>
  );
}
