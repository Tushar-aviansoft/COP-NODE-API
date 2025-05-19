//  for General
const CarListingData = {
  popularCars: "Popular Cars",
  evCars: "EV Cars",
};
const carTypes = {
  hatchback: "Hatchback",
  sedan: "Sedan",
};
const CarStages = {
  upcoming: "Upcoming",
  launched: "Launched",
};
const ModelType = {
  ev: 1,
  nonEv: 0,
};

// for Index page
const Banners = {
  headBanner: "Head Banner",
  upcomingBanner: "Upcoming Banner",
  evBanner: "EV Banner",
};

// for City popup
const City = {
  popularCity: [
    "Surat",
    "Ahmedabad",
    "Mumbai",
    "Delhi",
    "Hyderabad",
    "Chennai",
    "Kolkata",
    "Bangalore",
  ],
};

const NewsWP = {
  'CITY_ID': 160,
}



// for spec and features
const SpecificationCategory = {
  specifications: "Specifications",
  safety: "Safety",
};
const Specification = {
  safety: "Safety",
  interior: "Interior",
  exterior: "Exterior",
};
const Features = {
  displacement: "Displacement",
  batteryCapacity: "Battery Capacity",
  drivingRange: "Range",
  evPower: "Power (EV)",
  power: "Power",
  fuel: "Type of Fuel",
  driveTrain: "Drivetrain",
  transmission: "Type of Transmission",
  fuelTankCapacity: "Fuel Tank Capacity",
  typeOfEngine: "Type of Engine",
  mileage: "Mileage",
  torque: "Torque",
  zeroToHundredKm: "0-100 km/h",
  topSpeed: "Top Speed",
  groundClearance: "Ground Clearance",
  bootSpace: "Boot Space",
  noOfAirbags: "No Of Airbags",
  motor: "Motor",
  batteryType: "Battery Type",
  followMeHomeHeadlamps: "Follow Me Home Headlamps",
  driverAirbag: "Driver Airbag",
  sunroof: "Sunroof",
  moonroof: "Moonroof",
  rainSensingWipers: "Rain Sensing Wipers",
  voiceCommands: "Voice Commands",
  cruiseControl: "Cruise Control",
  antiLockBrakingSystem: "Anti Lock Braking System",
  blindSpotMonitoring: "Blind Spot Monitoring",
  speedSensingAutoDoorLock: "Speed Sensing Auto Door Lock",
  hillDescentControl: "Hill Descent Control",
  crashSensor: "Crash Sensor",
  tyrePressureMonitor: "Tyre Pressure Monitor",
  parkingSensors: "Parking Sensors",
  climateControl: "Automatic Climate Control",
  highSpeedAlert: "High-Speed Alert",
  parkAssist: "Park Assist",
  hillAssist: "Hill Assist",
  brakeAssist: "Brake Assist",
  sosAssistance: "SOS Assistance",
  threeSixtyCamera: "360 Camera",
  rearCamera: "Rear Camera",
  laneWatchCamera: "Lane Watch Camera",
  laneChangeIndicator: "Lane Change Indicator",
  appleCarPlay: "Apple Car Play",
  androidAuto: "Android Auto",
  wirelessPhoneCharger: "Wireless Phone Charger",
  bluetoothConnectivity: "Bluetooth Connectivity",
};
const FeaturesDisplayName = {
  "Type of Fuel": "Fuel",
  "Type of Transmission": "Transmission",
  "Type of Engine": "Engine",
  "Power (EV)": "Power",
  "No Of Airbags": "Airbags",
  "Anti Lock Braking System": "ABS",
  "Child Safety Locks": "Child Safety",
  "Electronic Stability Control": "ECS",
  "Electronic Braking Distribution": "EBS",
  "Displacement": "Engine",
  "Range": "Driving Range",
};

// for car module
const KeyHighlightsDisplayName = {
  Specifications: "Key Specs",
  Safety: "Key Safety",
};
const similarVariantRange = {
  "200000-4500000": ["0", "200000"],
  "4500000-10000000": ["0", "400000"],
  "10000000-200000000": ["0", "1200000"],
};
const Description = [
  "Type of Transmission",
  "Mileage",
  "Range",
  "Power",
  "Power (EV)",
  "Type of Fuel",
  "Multifunction Steering Wheel",
  "Gearshift Paddles",
  "Cruise Control",
  "Active Noise Cancellation",
  "Bluetooth Connectivity",
  "Ambient Lighting",
  "Air Quality Control",
  "Cornering Head Lamps",
  "Integrated Antenna",
  "Rain Sensing Wipers",
  "No Of Airbags",
  "Parking Sensors",
  "Rear Camera",
  "Anti Lock Braking System",
  "Electronic Braking Distribution",
  "Electronic Stability Control",
  "Tyre Pressure Monitor",
  "Child Safety Locks",
  "Isofix Child Seat",
  "Blind Spot Monitoring",
  "Impact Sensing Auto Door Unlock",
];

// for car module and compare cars
const variantFeatures = [
  "Displacement",
  "Type of Fuel",
  "Type of Transmission",
  "Mileage",
  "Battery Capacity",
  "Power (EV)",
  "Range",
  "Charging Time (AC)",
];

//for advance search
const Interior = [
  "Multifunction Steering Wheel",
  "Cruise Control",
  "Engine Start/Stop Button",
  "KeyLess Entry",
  "Automatic Climate Control",
  "Ventilated Seats Front",
  "Ventilated Seats Rear",
  "Electric Adjustable Seats",
  "Wireless Phone Charger",
  "360 Camera",
  "Android Auto",
  "Apple Car Play",
  "Bluetooth Connectivity",
  "Ambient Lighting",
  "Automatic Headlamps",
  "Instrument Cluster",
  "Heads Up Display",
];
const Exterior = [
  "LED DRLs",
  "Sunroof",
  "Moonroof",
  "Convertible Top",
  "Chrome Grille",
  "Chrome Garnish",
  "Alloy Wheels",
  "Rain Sensing Wipers",
];
const BudgetList = {
  "200000 to 1000000": "2 to 10 Lakh",
  "1000000 to 2500000": "10 to 25 Lakh",
  "2500000 to 5000000": "25 to 50 Lakh",
  "5000000 to 10000000": "50L to 1 Cr",
  "10000000 to 200000000": "1Cr +",
};
const MIN_PRICE = 200000;
const MAX_PRICE = 200000000;
const launchMonthList = [3, 6, 9, 12];

// for Login
const API_URL = {
  send_otp: "https://www.textguru.in/api/v22.0/"
  // send_otp: "https://control.msg91.com/api/v5/otp?otp_length=6&otp_expiry=10",
  // verify_otp: "https://control.msg91.com/api/v5/otp/verify",
  // resend_otp: "https://control.msg91.com/api/v5/otp/retry",
};


// for Book test drive
const TestDriveStatus = {
  CANCELLED: 0,
  INPROGRESS: 1,
  COMPLETED: 2,
};
const SerialNumber = {
  TEST_DRIVE_TYPE: "test_drive",
  TEST_DRIVE_PREFIX: "BT",
};

// for Services
const Services = {
  carLoan: "L",
  carInsurance: "I",
};

// for FAQs
const FeaturesArrayForFaq = [
  'Multifunction Steering Wheel',
  'Gearshift Paddles',
  'Cruise Control',
  'Active Noise Cancellation',
  'Bluetooth Connectivity',
  'Ambient Lighting',
  'Air Quality Control',
  'Cornering Head Lamps',
  'Integrated Antenna',
  'Rain Sensing Wipers'
];
const SafetyArrayForFaq = [
  'No Of Airbags',
  'Parking Sensors',
  'Rear Camera',
  'Anti Lock Braking System',
  'Electronic Braking Distribution',
  'Electronic Stability Control',
  'Tyre Pressure Monitor',
  'Child Safety Locks',
  'Isofix Child Seat',
  'Blind Spot Monitoring',
  'Impact Sensing Auto Door Unlock'
];
const FAQsFeatures = [
  "Displacement",
  "Type of Engine",
  "Mileage",
  "No Of Airbags",
  "Range",
  "Battery Capacity",
  "Power",
  "Power (EV)",
  "Torque",
  "Ground Clearance",
  "Boot Space",
  "Fuel Tank Capacity",
  "Battery Type",
  "Sunroof",
  "Moonroof",
  "Automatic Climate Control",
  "Rear Camera",
  "Rain Sensing Wipers",
  "Voice Commands",
  "Cruise Control",
  "Anti Lock Braking System",
  "Blind Spot Monitoring",
  "Speed Sensing Auto Door Lock",
  "Hill Descent Control",
  "Crash Sensor",
  "Tyre Pressure Monitor",
  "Parking Sensors",
  "High-Speed Alert",
  "Park Assist",
  "Hill Assist",
  "Brake Assist",
  "SOS Assistance",
  "360 Camera",
  "Lane Watch Camera",
  "Lane Change Indicator",
  "Apple Car Play",
  "Android Auto",
  "Wireless Phone Charger",
  "Bluetooth Connectivity",
  "Top Speed",
  "0-100 km/h"
];

// for SEO
seoPages = {
  home: "home",
  carModule: "car-module",
  advancedSearch: "advanced-search",
  knowYourBestCar: "know-your-best-car",
  allBrands: "all-brands",
  comparePage: "compare-page",
  upcomingCars: "upcoming-cars",
  evCars: "ev-cars",
  evChargingStation: "ev-charging-station",
  serviceStation: "service-station",
  fuelStation: "fuel-station",
  carLoan: "car-loan",
  carInsurance: "car-insurance",
  emiCalculator: "emi-calculator",
  exclusiveOffer: "exculsive-offer",
  warningLights: "warning-lights",
  newsUpdate: "news-update",
  blogs: "blogs",
  importedCars: "imported-cars",
  aboutUs: "about-us",
  faqs: "faqs",
  privacyPolicy: "privacy-policy",
  termsAndConditions: "terms-conditions",
  disclaimer: "disclaimer",
  blogDetail: "blog-detail",
  blogDetailCarCare: "blog-detail-carcare",
  bookATestDrive: "book-test-drive",
  tollCalculator: "toll-calculator",
  fuelCalculator: "fuel-calculator",
  comingSoon: "coming-soon",
  carServiceStation: "car-service-station",
  dealership: "dealership",
  bToBInquiry: "b2b-inquiry",
  newLaunchedCars: "newly-launched-cars"
};
seoPagesArray = [
  "home",
  "car-module",
  "advanced-search",
  "know-your-best-car",
  "all-brands",
  "compare-page",
  "upcoming-cars",
  "ev-cars",
  "ev-charging-station",
  "service-station",
  "fuel-station",
  "car-loan",
  "car-insurance",
  "emi-calculator",
  "exculsive-offer",
  "warning-lights",
  "news-update",
  "blogs",
  "imported-cars",
  "about-us",
  "faqs",
  "privacy-policy",
  "terms-conditions",
  "disclaimer",
  "blog-detail",
  "blog-detail-carcare",
  "book-test-drive",
  "toll-calculator",
  "fuel-calculator",
  "coming-soon",
  "car-service-station",
  "dealership",
  "b2b-inquiry",
  "newly-launched-cars"
];
const seoType = {
  brandType: "1",
  modelType: "2",
  variantType: "3",
  pageType: "4"
};




const predefinedFeatures = {
  engineTransmissionFuel: {
    type: 'spec_name',
    values: ["Engine", "Transmission", "Fuel"]
  },
  infotainment_System: {
    type: 'features_name',
    values: [
      "Touch Screen", "Touch Screen Size", "Instrument Cluster",
      "Navigation System", "Heads Up Display", "Android Auto",
      "Apple Car Play", "Mirror Link", "Speakers Front",
      "Speakers Rear", "No. of Speakers", "USB And Auxiliary Input",
      "Ambient Lighting"
    ]
  },
  connectivity_Features: {
    type: 'features_name',
    values: [
      "Bluetooth Connectivity", "Wifi Connectivity",
      "Wireless Phone Charger", "USB Charger",
      "Accessory Power Outlet", "Voice Commands",
      "Digital Odometer", "Electronic Multi Tripmeter",
      "Digital Clock", "Outside Temperature Display"
    ]
  },
  safety_And_Driver_Assistance: {
    type: 'features_name',
    values: [
      "No Of Airbags", "Anti Lock Braking System",
      "Electronic Stability Control", "Tyre Pressure Monitor",
      "Hill Assist", "Rear Camera", "Blind Spot Monitoring",
      "Lane Watch Camera", "Parking Sensors", "360 Camera"
    ]
  },
  innovative_Features: {
    type: 'features_name',
    values: [
      "Active Noise Cancellation", "Engine Auto Start/Stop",
      "Gear Shift Indicator", "KeyLess Entry", "Key Trunk Opening",
      "Key Fuel Lid Opening", "Key Engine Start/Stop",
      "Automatic Headlamps", "Follow Me Home Headlamps",
      "Compass", "Cabin Lamps", "Powered Boot",
      "Handsfree Tailgate", "Rear Refrigerator",
      "Frameless Doors", "Soft Close Doors"
    ]
  },
  warrantyFeatures: {
    type: 'features_name',
    values: [
      "Warranty (Years)", "Warranty (Kilometers)"
    ]
  }
};

const DefaultCity = {
  surat : "160"
}

module.exports = {
  Banners,
  Features,
  CarListingData,
  City,
  CarStages,
  ModelType,
  SpecificationCategory,
  Specification,
  FeaturesDisplayName,
  KeyHighlightsDisplayName,
  Description,
  variantFeatures,
  similarVariantRange,
  carTypes,
  Exterior,
  Interior,
  BudgetList,
  MIN_PRICE,
  MAX_PRICE,
  API_URL,
  launchMonthList,
  TestDriveStatus,
  SerialNumber,
  Services,
  FeaturesArrayForFaq,
  SafetyArrayForFaq,
  FAQsFeatures,
  seoPages,
  seoPagesArray,
  seoType,
  predefinedFeatures,
  NewsWP,
  DefaultCity
};
