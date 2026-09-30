// ===== KIRTI PHARMA — UNIFIED DATABASE ENGINE (db.js) =====
// Supports both Cloud MySQL (Remote/Online) and Embedded SQLite (Zero-Setup Local)
// Automatically creates tables, tracks stock, records sales, and seeds initial data

const path = require('path');
const fs = require('fs');

const DB_FILE = path.join(__dirname, '..', 'pharma.db');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const PRESCRIPTIONS_DIR = path.join(UPLOADS_DIR, 'prescriptions');
const MEDICINES_DIR = path.join(UPLOADS_DIR, 'medicines');

// Ensure upload folders exist
[UPLOADS_DIR, PRESCRIPTIONS_DIR, MEDICINES_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Category image mappings
const CAT_IMAGES = {
  'Fever & Pain': 'images/med_fever_pain.png',
  'Antibiotics': 'images/med_antibiotics.png',
  'Gastro': 'images/med_gastro.png',
  'Chronic Care': 'images/med_chronic.png',
  'Vitamins & Supplements': 'images/med_vitamins.png',
  'Skincare': 'images/med_skincare.png',
  'Baby Care': 'images/med_baby_care.png',
  'ENT': 'images/med_ent.png',
  'Cardiac': 'images/med_chronic.png',
  'Diabetes': 'images/med_chronic.png',
};

// Seed medicines with initial stock and sales data
const SEED_MEDICINES = [
  // Fever & Pain
  { id: 1, name: 'Crocin 650mg', salt: 'Paracetamol 650mg', brand: 'GSK', category: 'Fever & Pain', price: 32, mrp: 38, stock: 48, sold: 124, packSize: 15, packUnit: 'tablets', prescription_required: 0, chronic: 0, imageColor: '#FEE2E2', icon: '💊', image: 'images/med_fever_pain.png' },
  { id: 2, name: 'Dolo 650', salt: 'Paracetamol 650mg', brand: 'Micro Labs', category: 'Fever & Pain', price: 28, mrp: 34, stock: 60, sold: 185, packSize: 15, packUnit: 'tablets', prescription_required: 0, chronic: 0, imageColor: '#FEE2E2', icon: '💊', image: 'images/med_fever_pain.png' },
  { id: 3, name: 'Combiflam', salt: 'Ibuprofen 400mg + Paracetamol 325mg', brand: 'Sanofi', category: 'Fever & Pain', price: 42, mrp: 50, stock: 35, sold: 92, packSize: 20, packUnit: 'tablets', prescription_required: 0, chronic: 0, imageColor: '#FEE2E2', icon: '💊', image: 'images/med_fever_pain.png' },
  { id: 4, name: 'Brufen 400mg', salt: 'Ibuprofen 400mg', brand: 'Abbott', category: 'Fever & Pain', price: 38, mrp: 45, stock: 22, sold: 45, packSize: 15, packUnit: 'tablets', prescription_required: 0, chronic: 0, imageColor: '#FEE2E2', icon: '💊', image: 'images/med_fever_pain.png' },
  { id: 5, name: 'Nimulid 100mg', salt: 'Nimesulide 100mg', brand: 'Panacea Biotech', category: 'Fever & Pain', price: 55, mrp: 65, stock: 18, sold: 34, packSize: 10, packUnit: 'tablets', prescription_required: 0, chronic: 0, imageColor: '#FEE2E2', icon: '💊', image: 'images/med_fever_pain.png' },
  { id: 6, name: 'Voveran 50mg', salt: 'Diclofenac Sodium 50mg', brand: 'Novartis', category: 'Fever & Pain', price: 48, mrp: 58, stock: 14, sold: 61, packSize: 10, packUnit: 'tablets', prescription_required: 0, chronic: 0, imageColor: '#FEE2E2', icon: '💊', image: 'images/med_fever_pain.png' },
  { id: 7, name: 'Sumo', salt: 'Nimesulide 100mg + Paracetamol 325mg', brand: 'Mankind', category: 'Fever & Pain', price: 35, mrp: 42, stock: 30, sold: 78, packSize: 10, packUnit: 'tablets', prescription_required: 0, chronic: 0, imageColor: '#FEE2E2', icon: '💊', image: 'images/med_fever_pain.png' },
  { id: 8, name: 'Zerodol-P', salt: 'Aceclofenac 100mg + Paracetamol 325mg', brand: 'Ipca', category: 'Fever & Pain', price: 62, mrp: 75, stock: 20, sold: 88, packSize: 10, packUnit: 'tablets', prescription_required: 0, chronic: 0, imageColor: '#FEE2E2', icon: '💊', image: 'images/med_fever_pain.png' },

  // Antibiotics
  { id: 9, name: 'Azithral 500mg', salt: 'Azithromycin 500mg', brand: 'Alembic', category: 'Antibiotics', price: 89, mrp: 105, stock: 15, sold: 53, packSize: 5, packUnit: 'tablets', prescription_required: 1, chronic: 0, imageColor: '#FEF3C7', icon: '💊', image: 'images/med_antibiotics.png' },
  { id: 10, name: 'Augmentin 625', salt: 'Amoxicillin 500mg + Clavulanic Acid 125mg', brand: 'GSK', category: 'Antibiotics', price: 198, mrp: 235, stock: 10, sold: 40, packSize: 10, packUnit: 'tablets', prescription_required: 1, chronic: 0, imageColor: '#FEF3C7', icon: '💊', image: 'images/med_antibiotics.png' },
  { id: 11, name: 'Cifran 500', salt: 'Ciprofloxacin 500mg', brand: 'Sun Pharma', category: 'Antibiotics', price: 78, mrp: 92, stock: 18, sold: 31, packSize: 10, packUnit: 'tablets', prescription_required: 1, chronic: 0, imageColor: '#FEF3C7', icon: '💊', image: 'images/med_antibiotics.png' },
  { id: 12, name: 'Mox 500', salt: 'Amoxicillin 500mg', brand: 'Ranbaxy', category: 'Antibiotics', price: 65, mrp: 78, stock: 25, sold: 44, packSize: 10, packUnit: 'tablets', prescription_required: 1, chronic: 0, imageColor: '#FEF3C7', icon: '💊', image: 'images/med_antibiotics.png' },
  { id: 13, name: 'Taxim-O 200', salt: 'Cefixime 200mg', brand: 'Alkem', category: 'Antibiotics', price: 145, mrp: 172, stock: 12, sold: 29, packSize: 10, packUnit: 'tablets', prescription_required: 1, chronic: 0, imageColor: '#FEF3C7', icon: '💊', image: 'images/med_antibiotics.png' },
  { id: 14, name: 'Zenflox 200', salt: 'Ofloxacin 200mg', brand: 'Mankind', category: 'Antibiotics', price: 58, mrp: 68, stock: 20, sold: 37, packSize: 10, packUnit: 'tablets', prescription_required: 1, chronic: 0, imageColor: '#FEF3C7', icon: '💊', image: 'images/med_antibiotics.png' },
  { id: 15, name: 'Clavam 625', salt: 'Amoxicillin 500mg + Clavulanic Acid 125mg', brand: 'Alkem', category: 'Antibiotics', price: 188, mrp: 224, stock: 8, sold: 22, packSize: 10, packUnit: 'tablets', prescription_required: 1, chronic: 0, imageColor: '#FEF3C7', icon: '💊', image: 'images/med_antibiotics.png' },
  { id: 16, name: 'Metrogyl 400', salt: 'Metronidazole 400mg', brand: 'JB Chem', category: 'Antibiotics', price: 42, mrp: 50, stock: 32, sold: 58, packSize: 15, packUnit: 'tablets', prescription_required: 1, chronic: 0, imageColor: '#FEF3C7', icon: '💊', image: 'images/med_antibiotics.png' },

  // Gastro
  { id: 17, name: 'Pantoprazole 40mg', salt: 'Pantoprazole 40mg', brand: 'Sun Pharma', category: 'Gastro', price: 58, mrp: 68, stock: 40, sold: 110, packSize: 15, packUnit: 'tablets', prescription_required: 0, chronic: 0, imageColor: '#D1FAE5', icon: '💊', image: 'images/med_gastro.png' },
  { id: 18, name: 'Pan-D', salt: 'Pantoprazole 40mg + Domperidone 10mg', brand: 'Alkem', category: 'Gastro', price: 72, mrp: 86, stock: 35, sold: 95, packSize: 15, packUnit: 'tablets', prescription_required: 0, chronic: 0, imageColor: '#D1FAE5', icon: '💊', image: 'images/med_gastro.png' },
  { id: 19, name: 'Razo 20mg', salt: 'Rabeprazole 20mg', brand: 'Sun Pharma', category: 'Gastro', price: 85, mrp: 100, stock: 28, sold: 42, packSize: 15, packUnit: 'tablets', prescription_required: 0, chronic: 0, imageColor: '#D1FAE5', icon: '💊', image: 'images/med_gastro.png' },
  { id: 20, name: 'Rantac 150', salt: 'Ranitidine 150mg', brand: 'JB Chem', category: 'Gastro', price: 38, mrp: 46, stock: 0, sold: 76, packSize: 15, packUnit: 'tablets', prescription_required: 0, chronic: 0, imageColor: '#D1FAE5', icon: '💊', image: 'images/med_gastro.png' },
  { id: 21, name: 'Cremaffin', salt: 'Liquid Paraffin + Milk of Magnesia', brand: 'Abbott', category: 'Gastro', price: 128, mrp: 152, stock: 15, sold: 28, packSize: 225, packUnit: 'ml', prescription_required: 0, chronic: 0, imageColor: '#D1FAE5', icon: '🍶', image: 'images/med_gastro.png' },
  { id: 22, name: 'Digene', salt: 'Magnesium Hydroxide + Aluminium Hydroxide', brand: 'Abbott', category: 'Gastro', price: 55, mrp: 65, stock: 50, sold: 89, packSize: 10, packUnit: 'tablets', prescription_required: 0, chronic: 0, imageColor: '#D1FAE5', icon: '💊', image: 'images/med_gastro.png' },
  { id: 23, name: 'Ondansetron 4mg', salt: 'Ondansetron 4mg', brand: 'Cipla', category: 'Gastro', price: 45, mrp: 54, stock: 22, sold: 39, packSize: 10, packUnit: 'tablets', prescription_required: 0, chronic: 0, imageColor: '#D1FAE5', icon: '💊', image: 'images/med_gastro.png' },
  { id: 24, name: 'Nexpro 40', salt: 'Esomeprazole 40mg', brand: 'Torrent', category: 'Gastro', price: 92, mrp: 110, stock: 18, sold: 31, packSize: 15, packUnit: 'tablets', prescription_required: 0, chronic: 0, imageColor: '#D1FAE5', icon: '💊', image: 'images/med_gastro.png' },

  // Chronic Care
  { id: 25, name: 'Metformin 500mg', salt: 'Metformin HCl 500mg', brand: 'USV', category: 'Chronic Care', price: 42, mrp: 52, stock: 60, sold: 160, packSize: 20, packUnit: 'tablets', prescription_required: 1, chronic: 1, imageColor: '#EDE9FE', icon: '💊', image: 'images/med_chronic.png' },
  { id: 26, name: 'Glycomet GP1', salt: 'Metformin 500mg + Glimepiride 1mg', brand: 'USV', category: 'Chronic Care', price: 78, mrp: 94, stock: 45, sold: 130, packSize: 15, packUnit: 'tablets', prescription_required: 1, chronic: 1, imageColor: '#EDE9FE', icon: '💊', image: 'images/med_chronic.png' },
  { id: 27, name: 'Telma 40', salt: 'Telmisartan 40mg', brand: 'Glenmark', category: 'Chronic Care', price: 112, mrp: 135, stock: 38, sold: 115, packSize: 15, packUnit: 'tablets', prescription_required: 1, chronic: 1, imageColor: '#EDE9FE', icon: '💊', image: 'images/med_chronic.png' },
  { id: 28, name: 'Amlodipine 5mg', salt: 'Amlodipine Besylate 5mg', brand: 'Cipla', category: 'Chronic Care', price: 68, mrp: 82, stock: 55, sold: 142, packSize: 15, packUnit: 'tablets', prescription_required: 1, chronic: 1, imageColor: '#EDE9FE', icon: '💊', image: 'images/med_chronic.png' },
  { id: 29, name: 'Atorva 10mg', salt: 'Atorvastatin 10mg', brand: 'Zydus', category: 'Chronic Care', price: 95, mrp: 115, stock: 42, sold: 88, packSize: 15, packUnit: 'tablets', prescription_required: 1, chronic: 1, imageColor: '#EDE9FE', icon: '💊', image: 'images/med_chronic.png' },
  { id: 30, name: 'Ecosprin 75mg', salt: 'Aspirin 75mg', brand: 'USV', category: 'Chronic Care', price: 28, mrp: 34, stock: 70, sold: 175, packSize: 14, packUnit: 'tablets', prescription_required: 1, chronic: 1, imageColor: '#EDE9FE', icon: '💊', image: 'images/med_chronic.png' },
  { id: 31, name: 'Thyronorm 50mcg', salt: 'Levothyroxine Sodium 50mcg', brand: 'Abbott', category: 'Chronic Care', price: 88, mrp: 105, stock: 30, sold: 72, packSize: 120, packUnit: 'tablets', prescription_required: 1, chronic: 1, imageColor: '#EDE9FE', icon: '💊', image: 'images/med_chronic.png' },
  { id: 32, name: 'Januvia 50mg', salt: 'Sitagliptin 50mg', brand: 'MSD', category: 'Chronic Care', price: 345, mrp: 415, stock: 12, sold: 25, packSize: 14, packUnit: 'tablets', prescription_required: 1, chronic: 1, imageColor: '#EDE9FE', icon: '💊', image: 'images/med_chronic.png' },
  { id: 33, name: 'Losartan 50mg', salt: 'Losartan Potassium 50mg', brand: 'Mankind', category: 'Chronic Care', price: 72, mrp: 88, stock: 35, sold: 68, packSize: 15, packUnit: 'tablets', prescription_required: 1, chronic: 1, imageColor: '#EDE9FE', icon: '💊', image: 'images/med_chronic.png' },
  { id: 34, name: 'Deplatt 75', salt: 'Clopidogrel 75mg', brand: 'Torrent', category: 'Chronic Care', price: 85, mrp: 102, stock: 28, sold: 54, packSize: 15, packUnit: 'tablets', prescription_required: 1, chronic: 1, imageColor: '#EDE9FE', icon: '💊', image: 'images/med_chronic.png' },

  // Vitamins & Supplements
  { id: 35, name: 'Vitamin D3 60K', salt: 'Cholecalciferol 60000IU', brand: 'Mankind', category: 'Vitamins & Supplements', price: 145, mrp: 175, stock: 40, sold: 135, packSize: 4, packUnit: 'capsules', prescription_required: 0, chronic: 0, imageColor: '#FFF7ED', icon: '💊', image: 'images/med_vitamins.png' },
  { id: 36, name: 'Shelcal 500', salt: 'Calcium Carbonate 1250mg + Vitamin D3 250IU', brand: 'Torrent', category: 'Vitamins & Supplements', price: 198, mrp: 238, stock: 35, sold: 112, packSize: 30, packUnit: 'tablets', prescription_required: 0, chronic: 0, imageColor: '#FFF7ED', icon: '💊', image: 'images/med_vitamins.png' },
  { id: 37, name: 'Becosules', salt: 'Vitamin B-Complex + Vitamin C', brand: 'Pfizer', category: 'Vitamins & Supplements', price: 82, mrp: 98, stock: 55, sold: 165, packSize: 20, packUnit: 'capsules', prescription_required: 0, chronic: 0, imageColor: '#FFF7ED', icon: '💊', image: 'images/med_vitamins.png' },
  { id: 38, name: 'Zincovit', salt: 'Multivitamin + Zinc + Antioxidants', brand: 'Apex', category: 'Vitamins & Supplements', price: 165, mrp: 198, stock: 28, sold: 82, packSize: 15, packUnit: 'tablets', prescription_required: 0, chronic: 0, imageColor: '#FFF7ED', icon: '💊', image: 'images/med_vitamins.png' },
  { id: 39, name: 'Neurobion Forte', salt: 'Vitamin B1 + B6 + B12', brand: 'Merck', category: 'Vitamins & Supplements', price: 45, mrp: 55, stock: 65, sold: 140, packSize: 30, packUnit: 'tablets', prescription_required: 0, chronic: 0, imageColor: '#FFF7ED', icon: '💊', image: 'images/med_vitamins.png' },
  { id: 40, name: 'Limcee 500mg', salt: 'Ascorbic Acid 500mg', brand: 'Abbott', category: 'Vitamins & Supplements', price: 38, mrp: 46, stock: 48, sold: 190, packSize: 15, packUnit: 'tablets', prescription_required: 0, chronic: 0, imageColor: '#FFF7ED', icon: '💊', image: 'images/med_vitamins.png' },
  { id: 41, name: 'Evion 400', salt: 'Vitamin E 400mg', brand: 'Merck', category: 'Vitamins & Supplements', price: 58, mrp: 70, stock: 40, sold: 98, packSize: 30, packUnit: 'capsules', prescription_required: 0, chronic: 0, imageColor: '#FFF7ED', icon: '💊', image: 'images/med_vitamins.png' },
  { id: 42, name: 'Revital H', salt: 'Multivitamin + Minerals + Ginseng', brand: 'Sun Pharma', category: 'Vitamins & Supplements', price: 285, mrp: 342, stock: 18, sold: 45, packSize: 30, packUnit: 'capsules', prescription_required: 0, chronic: 0, imageColor: '#FFF7ED', icon: '💊', image: 'images/med_vitamins.png' },

  // Skincare
  { id: 43, name: 'Betadine Cream', salt: 'Povidone Iodine 5%', brand: 'Win Medicare', category: 'Skincare', price: 88, mrp: 105, stock: 20, sold: 62, packSize: 25, packUnit: 'gm', prescription_required: 0, chronic: 0, imageColor: '#FECDD3', icon: '🧴', image: 'images/med_skincare.png' },
  { id: 44, name: 'Soframycin', salt: 'Framycetin Sulphate 1%', brand: 'Sanofi', category: 'Skincare', price: 78, mrp: 92, stock: 25, sold: 74, packSize: 25, packUnit: 'gm', prescription_required: 0, chronic: 0, imageColor: '#FECDD3', icon: '🧴', image: 'images/med_skincare.png' },
  { id: 45, name: 'Fucidin Cream', salt: 'Fusidic Acid 2%', brand: 'Leo Pharma', category: 'Skincare', price: 148, mrp: 178, stock: 14, sold: 33, packSize: 15, packUnit: 'gm', prescription_required: 0, chronic: 0, imageColor: '#FECDD3', icon: '🧴', image: 'images/med_skincare.png' },
  { id: 46, name: 'Candid Cream', salt: 'Clotrimazole 1%', brand: 'Glenmark', category: 'Skincare', price: 72, mrp: 86, stock: 22, sold: 55, packSize: 30, packUnit: 'gm', prescription_required: 0, chronic: 0, imageColor: '#FECDD3', icon: '🧴', image: 'images/med_skincare.png' },
  { id: 47, name: 'Fourderm', salt: 'Clotrimazole + Beclomethasone + Neomycin', brand: 'Mankind', category: 'Skincare', price: 95, mrp: 114, stock: 0, sold: 80, packSize: 30, packUnit: 'gm', prescription_required: 0, chronic: 0, imageColor: '#FECDD3', icon: '🧴', image: 'images/med_skincare.png' },
  { id: 48, name: 'Mometasone Cream', salt: 'Mometasone Furoate 0.1%', brand: 'Sun Pharma', category: 'Skincare', price: 112, mrp: 135, stock: 16, sold: 29, packSize: 15, packUnit: 'gm', prescription_required: 0, chronic: 0, imageColor: '#FECDD3', icon: '🧴', image: 'images/med_skincare.png' },

  // Baby Care
  { id: 49, name: 'Calpol 250 Syrup', salt: 'Paracetamol 250mg/5ml', brand: 'GSK', category: 'Baby Care', price: 65, mrp: 78, stock: 22, sold: 51, packSize: 100, packUnit: 'ml', prescription_required: 0, chronic: 0, imageColor: '#E0F2FE', icon: '🍶', image: 'images/med_baby_care.png' },
  { id: 50, name: 'Colicaid Drops', salt: 'Simethicone 40mg/0.6ml', brand: 'Meyer', category: 'Baby Care', price: 88, mrp: 105, stock: 15, sold: 37, packSize: 15, packUnit: 'ml', prescription_required: 0, chronic: 0, imageColor: '#E0F2FE', icon: '🍶', image: 'images/med_baby_care.png' },
  { id: 51, name: 'Zinetac Syrup', salt: 'Ranitidine 75mg/5ml', brand: 'GSK', category: 'Baby Care', price: 72, mrp: 86, stock: 12, sold: 23, packSize: 60, packUnit: 'ml', prescription_required: 0, chronic: 0, imageColor: '#E0F2FE', icon: '🍶', image: 'images/med_baby_care.png' },
  { id: 52, name: 'Bonnisan', salt: 'Dill Oil + Fennel Oil (Herbal)', brand: 'Himalaya', category: 'Baby Care', price: 145, mrp: 174, stock: 18, sold: 48, packSize: 120, packUnit: 'ml', prescription_required: 0, chronic: 0, imageColor: '#E0F2FE', icon: '🍶', image: 'images/med_baby_care.png' },
  { id: 53, name: 'T-Minic Syrup', salt: 'Triprolidine + Pseudoephedrine', brand: 'GSK', category: 'Baby Care', price: 82, mrp: 98, stock: 0, sold: 42, packSize: 60, packUnit: 'ml', prescription_required: 0, chronic: 0, imageColor: '#E0F2FE', icon: '🍶', image: 'images/med_baby_care.png' },

  // ENT
  { id: 54, name: 'Allegra 120mg', salt: 'Fexofenadine 120mg', brand: 'Sanofi', category: 'ENT', price: 112, mrp: 134, stock: 0, sold: 67, packSize: 10, packUnit: 'tablets', prescription_required: 0, chronic: 0, imageColor: '#F0FDF4', icon: '💊', image: 'images/med_ent.png' },
  { id: 55, name: 'Cetirizine 10mg', salt: 'Cetirizine Hydrochloride 10mg', brand: 'Cipla', category: 'ENT', price: 28, mrp: 34, stock: 70, sold: 210, packSize: 10, packUnit: 'tablets', prescription_required: 0, chronic: 0, imageColor: '#F0FDF4', icon: '💊', image: 'images/med_ent.png' },
  { id: 56, name: 'Montair LC', salt: 'Montelukast 10mg + Levocetirizine 5mg', brand: 'Cipla', category: 'ENT', price: 145, mrp: 174, stock: 25, sold: 95, packSize: 10, packUnit: 'tablets', prescription_required: 0, chronic: 0, imageColor: '#F0FDF4', icon: '💊', image: 'images/med_ent.png' },
  { id: 57, name: 'Sinarest', salt: 'Paracetamol 500mg + Chlorpheniramine 2mg + PE 10mg', brand: 'Centaur', category: 'ENT', price: 48, mrp: 58, stock: 38, sold: 130, packSize: 10, packUnit: 'tablets', prescription_required: 0, chronic: 0, imageColor: '#F0FDF4', icon: '💊', image: 'images/med_ent.png' },
  { id: 58, name: 'Otrivin Nasal', salt: 'Xylometazoline 0.1%', brand: 'Novartis', category: 'ENT', price: 88, mrp: 105, stock: 20, sold: 52, packSize: 10, packUnit: 'ml', prescription_required: 0, chronic: 0, imageColor: '#F0FDF4', icon: '🧴', image: 'images/med_ent.png' },
];

const SEED_ORDERS = [
  {
    id: 'KP-2847',
    customerName: 'Kirti Customer',
    phone: '9876543210',
    date: 'Today',
    placed: '5:02 PM',
    status: 'preparing',
    paymentMethod: 'Google Pay (UPI)',
    paymentStatus: 'Paid',
    deliveryAddress: 'Flat 302, Sai Shraddha Apts, Ring Road, Gondia - 441614',
    items: JSON.stringify([
      { id: 1, name: 'Crocin 650mg', brand: 'GSK', qty: 2, price: 32, packUnit: 'tablets' },
      { id: 25, name: 'Metformin 500mg', brand: 'USV', qty: 1, price: 42, packUnit: 'tablets' },
      { id: 43, name: 'Betadine Cream', brand: 'Win Medicare', qty: 1, price: 88, packUnit: 'gm' }
    ]),
    subtotal: 194,
    deliveryFee: 30,
    total: 224,
    rider: JSON.stringify({
      id: 'rider-1',
      name: 'Rahul Kurmi',
      initials: 'RK',
      phone: '+919876543210',
      distance: '2.1 km',
      eta: '~18 mins'
    }),
    stages: JSON.stringify([
      { id: 'confirmed', label: 'Order Confirmed', time: '5:02 PM', status: 'done', icon: '✅' },
      { id: 'preparing', label: 'Being Prepared', time: 'In Progress', status: 'active', icon: '💊' },
      { id: 'delivery', label: 'Out for Delivery', time: 'Pending', status: 'pending', icon: '🛵' },
      { id: 'delivered', label: 'Delivered', time: 'Pending', status: 'pending', icon: '📦' }
    ]),
    estimatedDelivery: '5:24 PM'
  },
  {
    id: 'KP-2810',
    customerName: 'Kirti Customer',
    phone: '9876543210',
    date: '28 Sep 2026',
    placed: '11:20 AM',
    status: 'delivered',
    paymentMethod: 'PhonePe',
    paymentStatus: 'Paid',
    deliveryAddress: 'Shop No 4, Main Bazar, Gondia - 441601',
    items: JSON.stringify([
      { id: 2, name: 'Dolo 650', brand: 'Micro Labs', qty: 1, price: 28, packUnit: 'tablets' },
      { id: 36, name: 'Shelcal 500', brand: 'Torrent', qty: 1, price: 198, packUnit: 'tablets' },
      { id: 35, name: 'Vitamin D3 60K', brand: 'Mankind', qty: 1, price: 145, packUnit: 'capsules' }
    ]),
    subtotal: 371,
    deliveryFee: 30,
    total: 401,
    rider: JSON.stringify({
      id: 'rider-2',
      name: 'Amit Sharma',
      initials: 'AS',
      phone: '+919876543215',
      distance: '3.5 km',
      eta: '~25 mins'
    }),
    stages: JSON.stringify([
      { id: 'confirmed', label: 'Order Confirmed', time: '11:20 AM', status: 'done', icon: '✅' },
      { id: 'preparing', label: 'Being Prepared', time: '11:35 AM', status: 'done', icon: '✅' },
      { id: 'delivery', label: 'Out for Delivery', time: '12:05 PM', status: 'done', icon: '🛵' },
      { id: 'delivered', label: 'Delivered', time: '12:40 PM', status: 'done', icon: '📦' }
    ]),
    estimatedDelivery: '12:45 PM'
  }
];

const SEED_PRESCRIPTIONS = [
  {
    id: 1,
    patient: 'Meena Deshpande',
    initials: 'MD',
    phone: '+919876543211',
    source: 'App',
    status: 'Pending',
    color: '#7C3AED',
    time: '3:45 PM',
    date: 'Today',
    fileName: 'prescription-meena.jpg',
    fileUrl: 'images/med_fever_pain.png',
    notes: 'Please verify dosage before dispatch.'
  },
  {
    id: 2,
    patient: 'Suresh Bawane',
    initials: 'SB',
    phone: '+919876543212',
    source: 'WhatsApp',
    status: 'In Review',
    color: '#2563EB',
    time: '4:02 PM',
    date: 'Today',
    fileName: 'rx_whatsapp_suresh.png',
    fileUrl: 'images/med_chronic.png',
    notes: 'Monthly diabetes and blood pressure refills.'
  },
  {
    id: 3,
    patient: 'Priya Nagpure',
    initials: 'PN',
    phone: '+919876543213',
    source: 'App',
    status: 'Pending',
    color: '#DB2777',
    time: '4:28 PM',
    date: 'Today',
    fileName: 'priya_rx.pdf',
    fileUrl: 'images/med_antibiotics.png',
    notes: 'Prescribed by Dr. Kulkarni.'
  }
];

const SEED_USERS = [
  {
    id: 'user-chemist',
    name: 'Dr. Kirti Agrawal (Pharmacist)',
    phone: '9876540000',
    email: 'chemist@kirtipharma.com',
    role: 'admin',
    addresses: JSON.stringify([
      { id: 'addr-store', tag: 'Store', text: 'Kirti Medical Store, Near Bus Stand, Gondia - 441601', isDefault: true }
    ])
  },
  {
    id: 'user-customer',
    name: 'Kirti Customer',
    phone: '9876543210',
    email: 'customer@kirtipharma.com',
    role: 'customer',
    addresses: JSON.stringify([
      { id: 'addr-home', tag: 'Home', text: 'Flat 302, Sai Shraddha Apts, Ring Road, Gondia - 441614', isDefault: true }
    ])
  }
];

// Determine Database Driver: Cloud MySQL or Embedded SQLite
let isMySQL = false;
let mysqlPool = null;
let sqliteDb = null;

const shouldUseMySQL = (
  process.env.DB_TYPE === 'mysql' ||
  Boolean(process.env.DATABASE_URL) ||
  Boolean(process.env.DB_HOST)
);

if (shouldUseMySQL) {
  try {
    const mysql = require('mysql2/promise');
    if (process.env.DATABASE_URL) {
      mysqlPool = mysql.createPool(process.env.DATABASE_URL);
    } else {
      mysqlPool = mysql.createPool({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'kirti_pharma',
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });
    }
    isMySQL = true;
    console.log('[DATABASE] ☁️ Connected to Cloud MySQL Database!');
  } catch (err) {
    console.warn('[DATABASE] Cloud MySQL initialization error, falling back to SQLite:', err.message);
    isMySQL = false;
  }
}

if (!isMySQL) {
  try {
    const sqlite3 = require('sqlite3').verbose();
    sqliteDb = new sqlite3.Database(DB_FILE, (err) => {
      if (err) {
        console.error('Failed to open SQLite database:', err.message);
      } else {
        console.log(`[DATABASE] 📁 Connected to Embedded Database: ${DB_FILE}`);
      }
    });
  } catch (err) {
    // SQLite not available (e.g. Vercel serverless) — Supabase handles all DB operations
    console.warn('[DATABASE] SQLite unavailable (serverless env). Using Supabase cloud DB only.');
    sqliteDb = null;
  }
}

// Unified Query Wrappers for both MySQL and SQLite
async function query(sql, params = []) {
  if (isMySQL) {
    const [rows] = await mysqlPool.query(sql, params);
    return rows;
  }
  if (!sqliteDb) return []; // Supabase-only environment
  return new Promise((resolve, reject) => {
    sqliteDb.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function get(sql, params = []) {
  if (isMySQL) {
    const [rows] = await mysqlPool.query(sql, params);
    return rows[0] || null;
  }
  if (!sqliteDb) return null; // Supabase-only environment
  return new Promise((resolve, reject) => {
    sqliteDb.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function run(sql, params = []) {
  if (isMySQL) {
    const [result] = await mysqlPool.query(sql, params);
    return { lastID: result.insertId, changes: result.affectedRows };
  }
  if (!sqliteDb) return { lastID: null, changes: 0 }; // Supabase-only environment
  return new Promise((resolve, reject) => {
    sqliteDb.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

// Initialize tables and seed data automatically on startup
async function initDatabase() {
  // Skip local DB setup entirely when running in Supabase-only mode (e.g. Vercel)
  if (!isMySQL && !sqliteDb) {
    console.log('[DATABASE] ☁️ Supabase-only mode — skipping local DB initialization.');
    return;
  }

  if (isMySQL) {
    await run(`
      CREATE TABLE IF NOT EXISTS medicines (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        salt VARCHAR(255),
        brand VARCHAR(100),
        category VARCHAR(80),
        price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        mrp DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        stock INT NOT NULL DEFAULT 0,
        sold INT NOT NULL DEFAULT 0,
        packSize INT DEFAULT 10,
        packUnit VARCHAR(50) DEFAULT 'tablets',
        prescription_required TINYINT(1) DEFAULT 0,
        chronic TINYINT(1) DEFAULT 0,
        imageColor VARCHAR(20),
        icon VARCHAR(10),
        image VARCHAR(255),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(50) PRIMARY KEY,
        customerName VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        date VARCHAR(50),
        placed VARCHAR(50),
        status VARCHAR(50) DEFAULT 'confirmed',
        paymentMethod VARCHAR(50) DEFAULT 'UPI',
        paymentStatus VARCHAR(50) DEFAULT 'Paid',
        deliveryAddress TEXT,
        items LONGTEXT,
        subtotal DECIMAL(10,2) DEFAULT 0.00,
        deliveryFee DECIMAL(10,2) DEFAULT 0.00,
        total DECIMAL(10,2) DEFAULT 0.00,
        prescriptionId INT,
        notes TEXT,
        rider LONGTEXT,
        stages LONGTEXT,
        estimatedDelivery VARCHAR(50),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS prescriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patient VARCHAR(100) NOT NULL,
        initials VARCHAR(10) DEFAULT 'PT',
        phone VARCHAR(20),
        source VARCHAR(50) DEFAULT 'App',
        status VARCHAR(50) DEFAULT 'Pending',
        color VARCHAR(20),
        time VARCHAR(50),
        date VARCHAR(50) DEFAULT 'Today',
        fileName VARCHAR(255),
        fileUrl VARCHAR(255),
        notes TEXT,
        bill LONGTEXT,
        orderId VARCHAR(50),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) UNIQUE NOT NULL,
        email VARCHAR(100),
        role VARCHAR(20) DEFAULT 'customer',
        addresses LONGTEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  } else {
    await run(`
      CREATE TABLE IF NOT EXISTS medicines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        salt TEXT,
        brand TEXT,
        category TEXT,
        price REAL NOT NULL,
        mrp REAL NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0,
        sold INTEGER NOT NULL DEFAULT 0,
        packSize INTEGER DEFAULT 10,
        packUnit TEXT DEFAULT 'tablets',
        prescription_required INTEGER DEFAULT 0,
        chronic INTEGER DEFAULT 0,
        imageColor TEXT,
        icon TEXT,
        image TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        customerName TEXT,
        phone TEXT,
        date TEXT,
        placed TEXT,
        status TEXT DEFAULT 'confirmed',
        paymentMethod TEXT,
        paymentStatus TEXT,
        deliveryAddress TEXT,
        items TEXT,
        subtotal REAL,
        deliveryFee REAL,
        total REAL,
        prescriptionId INTEGER,
        notes TEXT,
        rider TEXT,
        stages TEXT,
        estimatedDelivery TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS prescriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient TEXT,
        initials TEXT,
        phone TEXT,
        source TEXT DEFAULT 'App',
        status TEXT DEFAULT 'Pending',
        color TEXT,
        time TEXT,
        date TEXT,
        fileName TEXT,
        fileUrl TEXT,
        notes TEXT,
        bill TEXT,
        orderId TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT,
        phone TEXT UNIQUE,
        email TEXT,
        role TEXT DEFAULT 'customer',
        addresses TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  // Seed medicines if empty
  const medCount = await get(`SELECT COUNT(*) as count FROM medicines`);
  if (!medCount || medCount.count === 0) {
    console.log('[DATABASE] Seeding 58 medicines into database...');
    for (const m of SEED_MEDICINES) {
      await run(`
        INSERT INTO medicines (id, name, salt, brand, category, price, mrp, stock, sold, packSize, packUnit, prescription_required, chronic, imageColor, icon, image)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [m.id, m.name, m.salt, m.brand, m.category, m.price, m.mrp, m.stock, m.sold, m.packSize, m.packUnit, m.prescription_required, m.chronic, m.imageColor, m.icon, m.image]);
    }
  }

  // Seed orders if empty
  const orderCount = await get(`SELECT COUNT(*) as count FROM orders`);
  if (!orderCount || orderCount.count === 0) {
    console.log('[DATABASE] Seeding initial orders into database...');
    for (const o of SEED_ORDERS) {
      await run(`
        INSERT INTO orders (id, customerName, phone, date, placed, status, paymentMethod, paymentStatus, deliveryAddress, items, subtotal, deliveryFee, total, rider, stages, estimatedDelivery)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [o.id, o.customerName, o.phone, o.date, o.placed, o.status, o.paymentMethod, o.paymentStatus, o.deliveryAddress, o.items, o.subtotal, o.deliveryFee, o.total, o.rider, o.stages, o.estimatedDelivery]);
    }
  }

  // Seed prescriptions if empty
  const rxCount = await get(`SELECT COUNT(*) as count FROM prescriptions`);
  if (!rxCount || rxCount.count === 0) {
    console.log('[DATABASE] Seeding initial prescriptions into database...');
    for (const p of SEED_PRESCRIPTIONS) {
      await run(`
        INSERT INTO prescriptions (id, patient, initials, phone, source, status, color, time, date, fileName, fileUrl, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [p.id, p.patient, p.initials, p.phone, p.source, p.status, p.color, p.time, p.date, p.fileName, p.fileUrl, p.notes]);
    }
  }

  // Seed users if empty
  const userCount = await get(`SELECT COUNT(*) as count FROM users`);
  if (!userCount || userCount.count === 0) {
    console.log('[DATABASE] Seeding demo users into database...');
    for (const u of SEED_USERS) {
      await run(`
        INSERT INTO users (id, name, phone, email, role, addresses)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [u.id, u.name, u.phone, u.email, u.role, u.addresses]);
    }
  }

  console.log('[DATABASE] Initialization complete! Live stock & sales tracking ready.');
}

initDatabase().catch(err => console.error('Database init error:', err));

module.exports = {
  query,
  get,
  run,
  CAT_IMAGES,
  isMySQL: () => isMySQL
};
