import Area from '../app/models/Area.js';

const getParkingAreasTemplate = (businessId) => [
  {
    businessId: businessId,
    businessPhoneNumber: '0291234567', // landline in NSW (02)
    name: 'Sydney Central Parking',
    capability: 120,
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
    businessId: businessId,
    businessPhoneNumber: '0412567890', // mobile (04)
    name: 'Darling Harbour Car Park',
    capability: 80,
    price: { car: 12.5, motorbike: 6.0, bicycle: 2.5 },
    location: {
      address: '50 Harbour St',
      suburb: 'Darling Harbour',
      city: 'Sydney',
      state: 'NSW',
      postcode: '2000',
    },
    policy: 'Flat rate applies after 6 pm; no refunds.',
  },
  {
    businessId: businessId,
    businessPhoneNumber: '0287654321', // landline in NSW (02)
    name: 'Surry Hills Bike & Ride',
    capability: 40,
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
    businessId: businessId,
    businessPhoneNumber: '0419876543', // mobile (04)
    name: 'Ultimo Evening Parking',
    capability: 60,
    price: { car: 8.0, motorbike: 4.0, bicycle: 2.0 },
    location: {
      address: '77 Quarry Rd',
      suburb: 'Ultimo',
      city: 'Sydney',
      state: 'NSW',
      postcode: '2007',
    },
    policy: 'Evening rates (after 5 pm) only; no weekend access.',
  },
  {
    businessId: businessId,
    businessPhoneNumber: '0298765432', // landline in NSW (02)
    name: 'Chippendale Multi‑Deck',
    capability: 150,
    price: { car: 18.0, motorbike: 9.0, bicycle: 4.0 },
    location: {
      address: '25 Abercrombie St',
      suburb: 'Chippendale',
      city: 'Sydney',
      state: 'NSW',
      postcode: '2008',
    },
    policy: 'Permit holders only between 8 am–6 pm; pay‑and‑display otherwise.',
  },
];

const parkingAreaImport = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    if (!businessId) {
      return res.status(400).json({ 
        status: 400,
        message: 'Business ID not found in token' 
      });
    }
  
    const parkingAreas = getParkingAreasTemplate(businessId);
    const insertedData = await Area.insertMany(parkingAreas);
    
    return res.status(201).json({
      status: 201,
      message: `Successfully imported ${insertedData.length} parking areas`,
      data: insertedData
    });
  } catch (error) {
    return res.status(500).json({ 
      status: 500,
      message: 'Error importing parking areas',
      error: error.message 
    });
  }
};

export default parkingAreaImport;
