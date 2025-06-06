import ParkingAreaSchema from '../app/models/ParkingAreaSchema.js';

const parkingAreas = [
  {
    business_id: '683d4188a0c9a9af6e5d547c',
    business_phone_number: '0291234567', // landline in NSW (02)
    name: 'Sydney Central Parking',
    maxSlot: 120,
    currentSlot: 0,
    price: { car: 15.0, motorbike: 7.0, bicycle: 3.0 },
    location: {
      address: '123 Pitt St',
      suburb: 'Sydney CBD',
      city: 'Sydney',
      state: 'NSW',
      postcode: '2000',
    },
    policy:
      'No overnight parking without prior approval; gates lock at midnight.',
  },
  {
    business_id: '683d4188a0c9a9af6e5d547c',
    business_phone_number: '0412567890', // mobile (04)
    name: 'Darling Harbour Car Park',
    maxSlot: 80,
    currentSlot: 0,
    price: { car: 12.5, motorbike: 6.0, bicycle: 2.5 },
    location: {
      address: '50 Harbour St',
      suburb: 'Darling Harbour',
      city: 'Sydney',
      state: 'NSW',
      postcode: '2000',
    },
    policy: 'Flat rate applies after 6 pm; no refunds.',
  },
  {
    business_id: '683d4188a0c9a9af6e5d547c',
    business_phone_number: '0287654321', // landline in NSW (02)
    name: 'Surry Hills Bike & Ride',
    maxSlot: 40,
    currentSlot: 0,
    price: { car: 10.0, motorbike: 5.0, bicycle: 1.0 },
    location: {
      address: '200 Bourke St',
      suburb: 'Surry Hills',
      city: 'Sydney',
      state: 'NSW',
      postcode: '2010',
    },
    policy:
      'Bicycle spaces first‑come, first‑served; car spaces pre‑booking only.',
  },
  {
    business_id: '683d4188a0c9a9af6e5d547c',
    business_phone_number: '0419876543', // mobile (04)
    name: 'Ultimo Evening Parking',
    maxSlot: 60,
    currentSlot: 0,
    price: { car: 8.0, motorbike: 4.0, bicycle: 2.0 },
    location: {
      address: '77 Quarry Rd',
      suburb: 'Ultimo',
      city: 'Sydney',
      state: 'NSW',
      postcode: '2007',
    },
    policy: 'Evening rates (after 5 pm) only; no weekend access.',
  },
  {
    business_id: '683d4188a0c9a9af6e5d547c',
    business_phone_number: '0298765432', // landline in NSW (02)
    name: 'Chippendale Multi‑Deck',
    maxSlot: 150,
    currentSlot: 0,
    price: { car: 18.0, motorbike: 9.0, bicycle: 4.0 },
    location: {
      address: '25 Abercrombie St',
      suburb: 'Chippendale',
      city: 'Sydney',
      state: 'NSW',
      postcode: '2008',
    },
    policy: 'Permit holders only between 8 am–6 pm; pay‑and‑display otherwise.',
  },
];

const parkingAreaImport = async () => {
  try {
    const insertedData = await ParkingAreaSchema.insertMany(parkingAreas);
    console.log(`✅ Imported ${insertedData.length} parking areas.`);
  } catch (error) {
    console.error('❌ Error importing parking areas:', error);
  }
};

export default parkingAreaImport;
