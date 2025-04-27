import BusinessSchema from '../app/models/BusinessSchema.js';

const businessDatas = [
  {
    name: 'Central Parking Pty Ltd',
    parkingAmount: 120,
    created_at: Date.now(),
  },
  {
    name: 'Harbour View Parking Co',
    parkingAmount: 80,
    created_at: Date.now(),
  },
  {
    name: 'Surry Hills Bike & Ride LLC',
    parkingAmount: 40,
    created_at: Date.now(),
  },
];

const businessImport = async () => {
  try {
    const insertedData = await BusinessSchema.insertMany(businessDatas);
    console.log(`✅ Imported ${insertedData.length} business.`);
  } catch (error) {
    console.error('❌ Error importing business:', error);
  }
};

export default businessImport;
