const cron = require('node-cron');
const jobsController = require('../controllers/jobs.controller');

const updateTollFuelUserCount = () => {
    cron.schedule('0 * * * *', async () => {
        await jobsController.updateTollFuelUserCount();
    });
}

module.exports = updateTollFuelUserCount;