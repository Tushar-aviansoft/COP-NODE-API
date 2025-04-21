const cron = require('node-cron');
const jobsController = require('../controllers/jobs.controller');

const sendAnniversaryWishes = () => {
    cron.schedule('0 0 * * *', async () => {
        await jobsController.sendAnniversaryWishes();
    });
}

module.exports = sendAnniversaryWishes;