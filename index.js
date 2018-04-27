module.exports = (homebridge) => {
    const { EVETempHumAccessory } = require('./lib/Accessory')(homebridge);
    homebridge.registerAccessory("homebridge-mqtt-eve-temp-hum", "mqtt-eve-temp-hum", EVETempHumAccessory);
};