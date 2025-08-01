import Area from '../app/models/Area.js';

const getParkingAreasTemplate = (businessId) => [
  {
    businessId: businessId,
    businessPhoneNumber: '0291234567', // landline in NSW (02)
    name: 'Sydney Central Parking',
    capacity: 120,
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
    capacity: 80,
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
    capacity: 40,
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
    capacity: 60,
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
    capacity: 150,
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
