const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const performanceController = require('../controllers/performanceController');

console.log("CONTROLLER CHECK:");
console.log(performanceController);
const router = express.Router();
router.get('/real', protect, performanceController.getRealMetrics); 
router.get('/workload', protect, performanceController.getBowlerWorkload); 
router.get('/workload-alerts', protect, performanceController.getWorkloadAlerts);
router.get('/', protect, performanceController.getPerformanceData); 
router.post('/', protect, performanceController.addPerformanceRecord);

module.exports = router;