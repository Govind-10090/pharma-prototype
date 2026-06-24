// ===== KIRTI PHARMA — medicines.js =====
// Full medicine catalogue — 58 products

// Category → product image mapping
const CAT_IMAGES = {
  'Fever & Pain':          'images/med_fever_pain.png',
  'Antibiotics':           'images/med_antibiotics.png',
  'Gastro':                'images/med_gastro.png',
  'Chronic Care':          'images/med_chronic.png',
  'Vitamins & Supplements':'images/med_vitamins.png',
  'Skincare':              'images/med_skincare.png',
  'Baby Care':             'images/med_baby_care.png',
  'ENT':                   'images/med_ent.png',
  'Cardiac':               'images/med_chronic.png',
  'Diabetes':              'images/med_chronic.png',
};

const DEFAULT_MEDICINES = [

  // ── FEVER & PAIN ──────────────────────────────────────
  { id: 1, name: 'Crocin 650mg', salt: 'Paracetamol 650mg', brand: 'GSK', category: 'Fever & Pain', price: 32, mrp: 38, stock: 48, packSize: 15, packUnit: 'tablets', prescription_required: false, chronic: false, imageColor: '#FEE2E2', icon: '💊' },
  { id: 2, name: 'Dolo 650', salt: 'Paracetamol 650mg', brand: 'Micro Labs', category: 'Fever & Pain', price: 28, mrp: 34, stock: 60, packSize: 15, packUnit: 'tablets', prescription_required: false, chronic: false, imageColor: '#FEE2E2', icon: '💊' },
  { id: 3, name: 'Combiflam', salt: 'Ibuprofen 400mg + Paracetamol 325mg', brand: 'Sanofi', category: 'Fever & Pain', price: 42, mrp: 50, stock: 35, packSize: 20, packUnit: 'tablets', prescription_required: false, chronic: false, imageColor: '#FEE2E2', icon: '💊' },
  { id: 4, name: 'Brufen 400mg', salt: 'Ibuprofen 400mg', brand: 'Abbott', category: 'Fever & Pain', price: 38, mrp: 45, stock: 22, packSize: 15, packUnit: 'tablets', prescription_required: false, chronic: false, imageColor: '#FEE2E2', icon: '💊' },
  { id: 5, name: 'Nimulid 100mg', salt: 'Nimesulide 100mg', brand: 'Panacea Biotech', category: 'Fever & Pain', price: 55, mrp: 65, stock: 18, packSize: 10, packUnit: 'tablets', prescription_required: false, chronic: false, imageColor: '#FEE2E2', icon: '💊' },
  { id: 6, name: 'Voveran 50mg', salt: 'Diclofenac Sodium 50mg', brand: 'Novartis', category: 'Fever & Pain', price: 48, mrp: 58, stock: 14, packSize: 10, packUnit: 'tablets', prescription_required: false, chronic: false, imageColor: '#FEE2E2', icon: '💊' },
  { id: 7, name: 'Sumo', salt: 'Nimesulide 100mg + Paracetamol 325mg', brand: 'Mankind', category: 'Fever & Pain', price: 35, mrp: 42, stock: 30, packSize: 10, packUnit: 'tablets', prescription_required: false, chronic: false, imageColor: '#FEE2E2', icon: '💊' },
  { id: 8, name: 'Zerodol-P', salt: 'Aceclofenac 100mg + Paracetamol 325mg', brand: 'Ipca', category: 'Fever & Pain', price: 62, mrp: 75, stock: 20, packSize: 10, packUnit: 'tablets', prescription_required: false, chronic: false, imageColor: '#FEE2E2', icon: '💊' },

  // ── ANTIBIOTICS ───────────────────────────────────────
  { id: 9, name: 'Azithral 500mg', salt: 'Azithromycin 500mg', brand: 'Alembic', category: 'Antibiotics', price: 89, mrp: 105, stock: 15, packSize: 5, packUnit: 'tablets', prescription_required: true, chronic: false, imageColor: '#FEF3C7', icon: '💊' },
  { id: 10, name: 'Augmentin 625', salt: 'Amoxicillin 500mg + Clavulanic Acid 125mg', brand: 'GSK', category: 'Antibiotics', price: 198, mrp: 235, stock: 10, packSize: 10, packUnit: 'tablets', prescription_required: true, chronic: false, imageColor: '#FEF3C7', icon: '💊' },
  { id: 11, name: 'Cifran 500', salt: 'Ciprofloxacin 500mg', brand: 'Sun Pharma', category: 'Antibiotics', price: 78, mrp: 92, stock: 18, packSize: 10, packUnit: 'tablets', prescription_required: true, chronic: false, imageColor: '#FEF3C7', icon: '💊' },
  { id: 12, name: 'Mox 500', salt: 'Amoxicillin 500mg', brand: 'Ranbaxy', category: 'Antibiotics', price: 65, mrp: 78, stock: 25, packSize: 10, packUnit: 'tablets', prescription_required: true, chronic: false, imageColor: '#FEF3C7', icon: '💊' },
  { id: 13, name: 'Taxim-O 200', salt: 'Cefixime 200mg', brand: 'Alkem', category: 'Antibiotics', price: 145, mrp: 172, stock: 12, packSize: 10, packUnit: 'tablets', prescription_required: true, chronic: false, imageColor: '#FEF3C7', icon: '💊' },
  { id: 14, name: 'Zenflox 200', salt: 'Ofloxacin 200mg', brand: 'Mankind', category: 'Antibiotics', price: 58, mrp: 68, stock: 20, packSize: 10, packUnit: 'tablets', prescription_required: true, chronic: false, imageColor: '#FEF3C7', icon: '💊' },
  { id: 15, name: 'Clavam 625', salt: 'Amoxicillin 500mg + Clavulanic Acid 125mg', brand: 'Alkem', category: 'Antibiotics', price: 188, mrp: 224, stock: 8, packSize: 10, packUnit: 'tablets', prescription_required: true, chronic: false, imageColor: '#FEF3C7', icon: '💊' },
  { id: 16, name: 'Metrogyl 400', salt: 'Metronidazole 400mg', brand: 'JB Chem', category: 'Antibiotics', price: 42, mrp: 50, stock: 32, packSize: 15, packUnit: 'tablets', prescription_required: true, chronic: false, imageColor: '#FEF3C7', icon: '💊' },

  // ── GASTRO ────────────────────────────────────────────
  { id: 17, name: 'Pantoprazole 40mg', salt: 'Pantoprazole 40mg', brand: 'Sun Pharma', category: 'Gastro', price: 58, mrp: 68, stock: 40, packSize: 15, packUnit: 'tablets', prescription_required: false, chronic: false, imageColor: '#D1FAE5', icon: '💊' },
  { id: 18, name: 'Pan-D', salt: 'Pantoprazole 40mg + Domperidone 10mg', brand: 'Alkem', category: 'Gastro', price: 72, mrp: 86, stock: 35, packSize: 15, packUnit: 'tablets', prescription_required: false, chronic: false, imageColor: '#D1FAE5', icon: '💊' },
  { id: 19, name: 'Razo 20mg', salt: 'Rabeprazole 20mg', brand: 'Sun Pharma', category: 'Gastro', price: 85, mrp: 100, stock: 28, packSize: 15, packUnit: 'tablets', prescription_required: false, chronic: false, imageColor: '#D1FAE5', icon: '💊' },
  { id: 20, name: 'Rantac 150', salt: 'Ranitidine 150mg', brand: 'JB Chem', category: 'Gastro', price: 38, mrp: 46, stock: 0, packSize: 15, packUnit: 'tablets', prescription_required: false, chronic: false, imageColor: '#D1FAE5', icon: '💊' },
  { id: 21, name: 'Cremaffin', salt: 'Liquid Paraffin + Milk of Magnesia', brand: 'Abbott', category: 'Gastro', price: 128, mrp: 152, stock: 15, packSize: 225, packUnit: 'ml', prescription_required: false, chronic: false, imageColor: '#D1FAE5', icon: '🍶' },
  { id: 22, name: 'Digene', salt: 'Magnesium Hydroxide + Aluminium Hydroxide', brand: 'Abbott', category: 'Gastro', price: 55, mrp: 65, stock: 50, packSize: 10, packUnit: 'tablets', prescription_required: false, chronic: false, imageColor: '#D1FAE5', icon: '💊' },
  { id: 23, name: 'Ondansetron 4mg', salt: 'Ondansetron 4mg', brand: 'Cipla', category: 'Gastro', price: 45, mrp: 54, stock: 22, packSize: 10, packUnit: 'tablets', prescription_required: false, chronic: false, imageColor: '#D1FAE5', icon: '💊' },
  { id: 24, name: 'Nexpro 40', salt: 'Esomeprazole 40mg', brand: 'Torrent', category: 'Gastro', price: 92, mrp: 110, stock: 18, packSize: 15, packUnit: 'tablets', prescription_required: false, chronic: false, imageColor: '#D1FAE5', icon: '💊' },

  // ── CHRONIC CARE ──────────────────────────────────────
  { id: 25, name: 'Metformin 500mg', salt: 'Metformin HCl 500mg', brand: 'USV', category: 'Chronic Care', price: 42, mrp: 52, stock: 60, packSize: 20, packUnit: 'tablets', prescription_required: true, chronic: true, imageColor: '#EDE9FE', icon: '💊' },
  { id: 26, name: 'Glycomet GP1', salt: 'Metformin 500mg + Glimepiride 1mg', brand: 'USV', category: 'Chronic Care', price: 78, mrp: 94, stock: 45, packSize: 15, packUnit: 'tablets', prescription_required: true, chronic: true, imageColor: '#EDE9FE', icon: '💊' },
  { id: 27, name: 'Telma 40', salt: 'Telmisartan 40mg', brand: 'Glenmark', category: 'Chronic Care', price: 112, mrp: 135, stock: 38, packSize: 15, packUnit: 'tablets', prescription_required: true, chronic: true, imageColor: '#EDE9FE', icon: '💊' },
  { id: 28, name: 'Amlodipine 5mg', salt: 'Amlodipine Besylate 5mg', brand: 'Cipla', category: 'Chronic Care', price: 68, mrp: 82, stock: 55, packSize: 15, packUnit: 'tablets', prescription_required: true, chronic: true, imageColor: '#EDE9FE', icon: '💊' },
  { id: 29, name: 'Atorva 10mg', salt: 'Atorvastatin 10mg', brand: 'Zydus', category: 'Chronic Care', price: 95, mrp: 115, stock: 42, packSize: 15, packUnit: 'tablets', prescription_required: true, chronic: true, imageColor: '#EDE9FE', icon: '💊' },
  { id: 30, name: 'Ecosprin 75mg', salt: 'Aspirin 75mg', brand: 'USV', category: 'Chronic Care', price: 28, mrp: 34, stock: 70, packSize: 14, packUnit: 'tablets', prescription_required: true, chronic: true, imageColor: '#EDE9FE', icon: '💊' },
  { id: 31, name: 'Thyronorm 50mcg', salt: 'Levothyroxine Sodium 50mcg', brand: 'Abbott', category: 'Chronic Care', price: 88, mrp: 105, stock: 30, packSize: 120, packUnit: 'tablets', prescription_required: true, chronic: true, imageColor: '#EDE9FE', icon: '💊' },
  { id: 32, name: 'Januvia 50mg', salt: 'Sitagliptin 50mg', brand: 'MSD', category: 'Chronic Care', price: 345, mrp: 415, stock: 12, packSize: 14, packUnit: 'tablets', prescription_required: true, chronic: true, imageColor: '#EDE9FE', icon: '💊' },
  { id: 33, name: 'Losartan 50mg', salt: 'Losartan Potassium 50mg', brand: 'Mankind', category: 'Chronic Care', price: 72, mrp: 88, stock: 35, packSize: 15, packUnit: 'tablets', prescription_required: true, chronic: true, imageColor: '#EDE9FE', icon: '💊' },
  { id: 34, name: 'Deplatt 75', salt: 'Clopidogrel 75mg', brand: 'Torrent', category: 'Chronic Care', price: 85, mrp: 102, stock: 28, packSize: 15, packUnit: 'tablets', prescription_required: true, chronic: true, imageColor: '#EDE9FE', icon: '💊' },

  // ── VITAMINS & SUPPLEMENTS ────────────────────────────
  { id: 35, name: 'Vitamin D3 60K', salt: 'Cholecalciferol 60000IU', brand: 'Mankind', category: 'Vitamins & Supplements', price: 145, mrp: 175, stock: 40, packSize: 4, packUnit: 'capsules', prescription_required: false, chronic: false, imageColor: '#FFF7ED', icon: '💊' },
  { id: 36, name: 'Shelcal 500', salt: 'Calcium Carbonate 1250mg + Vitamin D3 250IU', brand: 'Torrent', category: 'Vitamins & Supplements', price: 198, mrp: 238, stock: 35, packSize: 30, packUnit: 'tablets', prescription_required: false, chronic: false, imageColor: '#FFF7ED', icon: '💊' },
  { id: 37, name: 'Becosules', salt: 'Vitamin B-Complex + Vitamin C', brand: 'Pfizer', category: 'Vitamins & Supplements', price: 82, mrp: 98, stock: 55, packSize: 20, packUnit: 'capsules', prescription_required: false, chronic: false, imageColor: '#FFF7ED', icon: '💊' },
  { id: 38, name: 'Zincovit', salt: 'Multivitamin + Zinc + Antioxidants', brand: 'Apex', category: 'Vitamins & Supplements', price: 165, mrp: 198, stock: 28, packSize: 15, packUnit: 'tablets', prescription_required: false, chronic: false, imageColor: '#FFF7ED', icon: '💊' },
  { id: 39, name: 'Neurobion Forte', salt: 'Vitamin B1 + B6 + B12', brand: 'Merck', category: 'Vitamins & Supplements', price: 45, mrp: 55, stock: 65, packSize: 30, packUnit: 'tablets', prescription_required: false, chronic: false, imageColor: '#FFF7ED', icon: '💊' },
  { id: 40, name: 'Limcee 500mg', salt: 'Ascorbic Acid 500mg', brand: 'Abbott', category: 'Vitamins & Supplements', price: 38, mrp: 46, stock: 48, packSize: 15, packUnit: 'tablets', prescription_required: false, chronic: false, imageColor: '#FFF7ED', icon: '💊' },
  { id: 41, name: 'Evion 400', salt: 'Vitamin E 400mg', brand: 'Merck', category: 'Vitamins & Supplements', price: 58, mrp: 70, stock: 40, packSize: 30, packUnit: 'capsules', prescription_required: false, chronic: false, imageColor: '#FFF7ED', icon: '💊' },
  { id: 42, name: 'Revital H', salt: 'Multivitamin + Minerals + Ginseng', brand: 'Sun Pharma', category: 'Vitamins & Supplements', price: 285, mrp: 342, stock: 18, packSize: 30, packUnit: 'capsules', prescription_required: false, chronic: false, imageColor: '#FFF7ED', icon: '💊' },

  // ── SKINCARE ──────────────────────────────────────────
  { id: 43, name: 'Betadine Cream', salt: 'Povidone Iodine 5%', brand: 'Win Medicare', category: 'Skincare', price: 88, mrp: 105, stock: 20, packSize: 25, packUnit: 'gm', prescription_required: false, chronic: false, imageColor: '#FECDD3', icon: '🧴' },
  { id: 44, name: 'Soframycin', salt: 'Framycetin Sulphate 1%', brand: 'Sanofi', category: 'Skincare', price: 78, mrp: 92, stock: 25, packSize: 25, packUnit: 'gm', prescription_required: false, chronic: false, imageColor: '#FECDD3', icon: '🧴' },
  { id: 45, name: 'Fucidin Cream', salt: 'Fusidic Acid 2%', brand: 'Leo Pharma', category: 'Skincare', price: 148, mrp: 178, stock: 14, packSize: 15, packUnit: 'gm', prescription_required: false, chronic: false, imageColor: '#FECDD3', icon: '🧴' },
  { id: 46, name: 'Candid Cream', salt: 'Clotrimazole 1%', brand: 'Glenmark', category: 'Skincare', price: 72, mrp: 86, stock: 22, packSize: 30, packUnit: 'gm', prescription_required: false, chronic: false, imageColor: '#FECDD3', icon: '🧴' },
  { id: 47, name: 'Fourderm', salt: 'Clotrimazole + Beclomethasone + Neomycin', brand: 'Mankind', category: 'Skincare', price: 95, mrp: 114, stock: 0, packSize: 30, packUnit: 'gm', prescription_required: false, chronic: false, imageColor: '#FECDD3', icon: '🧴' },
  { id: 48, name: 'Mometasone Cream', salt: 'Mometasone Furoate 0.1%', brand: 'Sun Pharma', category: 'Skincare', price: 112, mrp: 135, stock: 16, packSize: 15, packUnit: 'gm', prescription_required: false, chronic: false, imageColor: '#FECDD3', icon: '🧴' },

  // ── BABY CARE ─────────────────────────────────────────
  { id: 49, name: 'Calpol 250 Syrup', salt: 'Paracetamol 250mg/5ml', brand: 'GSK', category: 'Baby Care', price: 65, mrp: 78, stock: 22, packSize: 100, packUnit: 'ml', prescription_required: false, chronic: false, imageColor: '#E0F2FE', icon: '🍶' },
  { id: 50, name: 'Colicaid Drops', salt: 'Simethicone 40mg/0.6ml', brand: 'Meyer', category: 'Baby Care', price: 88, mrp: 105, stock: 15, packSize: 15, packUnit: 'ml', prescription_required: false, chronic: false, imageColor: '#E0F2FE', icon: '🍶' },
  { id: 51, name: 'Zinetac Syrup', salt: 'Ranitidine 75mg/5ml', brand: 'GSK', category: 'Baby Care', price: 72, mrp: 86, stock: 12, packSize: 60, packUnit: 'ml', prescription_required: false, chronic: false, imageColor: '#E0F2FE', icon: '🍶' },
  { id: 52, name: 'Bonnisan', salt: 'Dill Oil + Fennel Oil (Herbal)', brand: 'Himalaya', category: 'Baby Care', price: 145, mrp: 174, stock: 18, packSize: 120, packUnit: 'ml', prescription_required: false, chronic: false, imageColor: '#E0F2FE', icon: '🍶' },
  { id: 53, name: 'T-Minic Syrup', salt: 'Triprolidine + Pseudoephedrine', brand: 'GSK', category: 'Baby Care', price: 82, mrp: 98, stock: 0, packSize: 60, packUnit: 'ml', prescription_required: false, chronic: false, imageColor: '#E0F2FE', icon: '🍶' },

  // ── ENT ───────────────────────────────────────────────
  { id: 54, name: 'Allegra 120mg', salt: 'Fexofenadine 120mg', brand: 'Sanofi', category: 'ENT', price: 112, mrp: 134, stock: 0, packSize: 10, packUnit: 'tablets', prescription_required: false, chronic: false, imageColor: '#F0FDF4', icon: '💊' },
  { id: 55, name: 'Cetirizine 10mg', salt: 'Cetirizine Hydrochloride 10mg', brand: 'Cipla', category: 'ENT', price: 28, mrp: 34, stock: 70, packSize: 10, packUnit: 'tablets', prescription_required: false, chronic: false, imageColor: '#F0FDF4', icon: '💊' },
  { id: 56, name: 'Montair LC', salt: 'Montelukast 10mg + Levocetirizine 5mg', brand: 'Cipla', category: 'ENT', price: 145, mrp: 174, stock: 25, packSize: 10, packUnit: 'tablets', prescription_required: false, chronic: false, imageColor: '#F0FDF4', icon: '💊' },
  { id: 57, name: 'Sinarest', salt: 'Paracetamol 500mg + Chlorpheniramine 2mg + PE 10mg', brand: 'Centaur', category: 'ENT', price: 48, mrp: 58, stock: 38, packSize: 10, packUnit: 'tablets', prescription_required: false, chronic: false, imageColor: '#F0FDF4', icon: '💊' },
  { id: 58, name: 'Otrivin Nasal', salt: 'Xylometazoline 0.1%', brand: 'Novartis', category: 'ENT', price: 88, mrp: 105, stock: 20, packSize: 10, packUnit: 'ml', prescription_required: false, chronic: false, imageColor: '#F0FDF4', icon: '🧴' },

];

let MEDICINES = [];
if (localStorage.getItem('kirti_medicines')) {
  try {
    MEDICINES = JSON.parse(localStorage.getItem('kirti_medicines'));
  } catch (e) {
    MEDICINES = DEFAULT_MEDICINES;
  }
} else {
  MEDICINES = DEFAULT_MEDICINES;
  localStorage.setItem('kirti_medicines', JSON.stringify(MEDICINES));
}

function saveMedicinesToStorage() {
  localStorage.setItem('kirti_medicines', JSON.stringify(MEDICINES));
}

// Export for module usage or global
if (typeof module !== 'undefined') module.exports = { MEDICINES, saveMedicinesToStorage };
