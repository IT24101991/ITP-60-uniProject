export const LOCATION_DATA = {
    'Western Province': {
        'Colombo District': ['Colombo National Hospital', 'National Blood Center'],
        'Gampaha District': ['Gampaha District Hospital', 'Ragama Teaching Hospital'],
        'Kalutara District': ['Kalutara General Hospital']
    },
    'Central Province': {
        'Kandy District': ['Kandy General Hospital'],
        'Matale District': ['Matale District General Hospital'],
        'Nuwara Eliya District': ['Nuwara Eliya District General Hospital']
    },
    'Southern Province': {
        'Galle District': ['Galle Teaching Hospital'],
        'Matara District': ['Matara District General Hospital'],
        'Hambantota District': ['Hambantota District General Hospital']
    },
    'Northern Province': {
        'Jaffna District': ['Jaffna Teaching Hospital'],
        'Kilinochchi District': ['Kilinochchi District Hospital'],
        'Mannar District': ['Mannar Base Hospital'],
        'Mullaitivu District': ['Mullaitivu District Hospital'],
        'Vavuniya District': ['Vavuniya District General Hospital']
    },
    'Eastern Province': {
        'Trincomalee District': ['Trincomalee District General Hospital'],
        'Batticaloa District': ['Batticaloa Teaching Hospital'],
        'Ampara District': ['Ampara General Hospital']
    },
    'North Western Province': {
        'Kurunegala District': ['Kurunegala Teaching Hospital'],
        'Puttalam District': ['Puttalam Base Hospital']
    },
    'North Central Province': {
        'Anuradhapura District': ['Anuradhapura Teaching Hospital'],
        'Polonnaruwa District': ['Polonnaruwa District General Hospital']
    },
    'Uva Province': {
        'Badulla District': ['Badulla Teaching Hospital'],
        'Monaragala District': ['Monaragala District Hospital']
    },
    'Sabaragamuwa Province': {
        'Ratnapura District': ['Ratnapura Teaching Hospital'],
        'Kegalle District': ['Kegalle District General Hospital']
    }
};

export const PROVINCES = Object.keys(LOCATION_DATA);

export const getDistrictsByProvince = (province) =>
    Object.keys(LOCATION_DATA[province] || {});

export const getHospitalsByProvinceAndDistrict = (province, district) =>
    LOCATION_DATA[province]?.[district] || [];

export const getDefaultLocationSelection = () => {
    const province = PROVINCES[0];
    const district = getDistrictsByProvince(province)[0];
    const nearestHospital = getHospitalsByProvinceAndDistrict(province, district)[0] || '';
    return { province, district, nearestHospital };
};
