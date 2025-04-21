const cron = require('node-cron');
const jobsController = require('../controllers/jobs.controller');

const settingApiKeyStatusUpdate = () => {
    cron.schedule('0 * * * *', async () => {
        await jobsController.settingApiKeyStatusUpdate();
    });
}

module.exports = settingApiKeyStatusUpdate;