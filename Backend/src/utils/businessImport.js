import businessSchema from '../app/models/businessSchema.js';

const businessDatas = [
  {
    name: 'Central Parking Pty Ltd',
    parkingArea: 10,
    created_at: Date.now(),
  },
  {
    name: 'Harbour View Parking Co',
    parkingArea: 5,
    created_at: Date.now(),
  },
  {
    name: 'Surry Hills Bike & Ride LLC',
    parkingArea: 5,
    created_at: Date.now(),
  },
];

const businessImport = async () => {
  try {
    const insertedData = await businessSchema.insertMany(businessDatas);
    console.log(`✅ Imported ${insertedData.length} business.`);
  } catch (error) {
    console.error('❌ Error importing business:', error);
  }
};

export default businessImport;
