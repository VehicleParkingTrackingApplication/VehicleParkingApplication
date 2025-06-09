import Business from '../app/models/Business.js';

const businessDatas = [
  {
    name: 'Central Parking Pty Ltd',
    parkingArea: 10,
    createdAt: Date.now(),
  },
  {
    name: 'Harbour View Parking Co',
    parkingArea: 5,
    createdAt: Date.now(),
  },
  {
    name: 'Surry Hills Bike & Ride LLC',
    parkingArea: 5,
    createdAt: Date.now(),
  },
];

const businessImport = async () => {
  try {
    const insertedData = await Business.insertMany(businessDatas);
    console.log(`✅ Imported ${insertedData.length} business.`);
  } catch (error) {
    console.error('❌ Error importing business:', error);
  }
};

export default businessImport;
