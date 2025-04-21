const fuelPriceCreateOrUpdate = require('./fuel-price-create-or-update');
const settingApiKeyStatusUpdate = require('./setting-api-key-status-update');
const updateTollFuelUserCount = require('./update-toll-fuel-user-count');
const sendBirthdayWishes = require('./send-birthday-wishes');
const sendAnniversaryWishes = require('./send-anniversary-wishes');

const initializeCrons = () => {
    fuelPriceCreateOrUpdate();
    settingApiKeyStatusUpdate();
    updateTollFuelUserCount();
    sendBirthdayWishes();
    sendAnniversaryWishes();
}

module.exports = initializeCrons;