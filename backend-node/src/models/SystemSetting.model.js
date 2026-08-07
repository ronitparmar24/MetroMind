const mongoose = require('mongoose');

const systemSettingSchema = new mongoose.Schema({
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  maxWalletBalance: {
    type: Number,
    default: 10000
  },
  ticketCancellationWindow: {
    type: Number,
    default: 30
  },
  supportEmailAlerts: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('SystemSetting', systemSettingSchema);
