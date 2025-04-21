const cron = require('node-cron');
const jobsController = require('../controllers/jobs.controller');

const fuelPriceCreateOrUpdate = () => {
    cron.schedule('0 6 * * *', async () => {
        await jobsController.fuelPriceCreateOrUpdate();
    });
}

module.exports = fuelPriceCreateOrUpdate;