const cron = require('node-cron');
const jobsController = require('../controllers/jobs.controller');

const sendBirthdayWishes = () => {
    cron.schedule('0 0 * * *', async () => {
        await jobsController.sendBirthdayWishes();
    });
}

module.exports = sendBirthdayWishes;