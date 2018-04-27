const { MQTTClient } = require('./MQTTClient');

let Service;
let Characteristic;
let FakeGatoHistoryService;
let homebridgeAPI;

class EVETempHumAccessory {
    constructor(log, config) {
      this.log = log;
      this.config = config;
      this.displayName = config.name;
  
      this.latestTemperature = undefined;
      this.latestHumidity = undefined;
  
      this.lastUpdatedAt = undefined;
      this.fakeGatoEnabled = config.fakeGatoEnabled || false;
  
      this.informationService = this.getInformationService();
      this.temperatureService = this.getTemperatureService();
      this.humidityService = this.getHumidityService();
      this.fakeGatoHistoryService = this.getFakeGatoHistoryService();
  
      this.mqtt = new MQTTClient(this.config);
      this.mqtt.on('temperatureChange', (temperature) => {
        this.log.debug(`[${this.displayName}] Temperature: ${temperature}C`);
        this.temperature = temperature;
      });
      this.mqtt.on('humidityChange', (humidity) => {
        this.log.debug(`[${this.displayName}] Humidity: ${humidity}%`);
        this.humidity = humidity;
      });
      this.mqtt.on('error', (error) => {
        this.log.error(error);
      });
      this.mqtt.on('connected', () => {
        this.log.debug('Initialized accessory');
      });
    }

    set temperature(newValue) {
      this.latestTemperature = newValue;
      this.lastUpdatedAt = Date.now();
      this.temperatureService
        .getCharacteristic(Characteristic.CurrentTemperature)
        .updateValue(newValue);
      this.addFakeGatoHistoryEntry();
    }
  
    get temperature() {
      if (this.hasTimedOut()) {
        return undefined;
      }
      return this.latestTemperature;
    }
  
    set humidity(newValue) {
      this.latestHumidity = newValue;
      this.lastUpdatedAt = Date.now();
      this.humidityService
        .getCharacteristic(Characteristic.CurrentRelativeHumidity)
        .updateValue(newValue);
      this.addFakeGatoHistoryEntry();
    }
  
    get humidity() {
      if (this.hasTimedOut()) {
        return undefined;
      }
      return this.latestHumidity;
    }
  
    get temperatureName() {
      return this.config.temperatureName || 'Temperature';
    }
  
    get humidityName() {
      return this.config.humidityName || 'Humidity';
    }
    get serialNumber() {
      return this.config.address != null ? this.config.address.replace(/:/g, '') : undefined;
    }
  
    get lastUpdatedISO8601() {
      return new Date(this.lastUpdatedAt).toISOString();
    }
  
    get fakeGatoStoragePath() {
      return this.config.fakeGatoStoragePath || homebridgeAPI.user.storagePath();
    }
  
    hasTimedOut() {
      if (this.timeout === 0) {
        return false;
      }
      if (this.lastUpdatedAt == null) {
        return false;
      }
      const timeoutMilliseconds = 1000 * 60 * this.timeout;
      const timedOut = this.lastUpdatedAt <= (Date.now() - timeoutMilliseconds);
      if (timedOut) {
        this.log.warn(`[${this.config.address}] Timed out, last update: ${this.lastUpdatedISO8601}`);
      }
      return timedOut;
    }
  
    addFakeGatoHistoryEntry() {
      if (!this.fakeGatoEnabled || (this.temperature == null || this.humidity == null)) {
        return;
      }
      this.fakeGatoHistoryService.addEntry({
        time: new Date().getTime() / 1000,
        temp: this.temperature,
        humidity: this.humidity,
      });
    }
  
    getFakeGatoHistoryService() {
      if (!this.fakeGatoEnabled) {
        return undefined;
      }
      const serialNumber = this.serialNumber || this.constructor.name;
      const filename = `fakegato-history_${serialNumber}.json`;
      const path = this.fakeGatoStoragePath;
      return new FakeGatoHistoryService('room', this, { filename, path, storage: 'fs' });
    }
  
    getInformationService() {
      const accessoryInformation = new Service.AccessoryInformation()
        .setCharacteristic(Characteristic.Manufacturer, 'moppi4483')
        .setCharacteristic(Characteristic.Model, 'EveRoom-Eigenbau')
        .setCharacteristic(Characteristic.FirmwareRevision, "1.0");
      if (this.serialNumber != null) {
        accessoryInformation.setCharacteristic(Characteristic.SerialNumber, this.serialNumber);
      }
      return accessoryInformation;
    }
  
    onCharacteristicGetValue(callback, value) {
      if (value == null) {
        callback(new Error('Undefined characteristic value'));
      } else {
        callback(null, value);
      }
    }
  
    getTemperatureService() {
      const temperatureService = new Service.TemperatureSensor(this.temperatureName);
      temperatureService
        .getCharacteristic(Characteristic.CurrentTemperature)
        .on('get', callback => this.onCharacteristicGetValue(callback, this.temperature));
      temperatureService
        .getCharacteristic(Characteristic.CurrentTemperature)
        .setProps({ minValue: -50 });
      temperatureService
        .getCharacteristic(Characteristic.CurrentTemperature)
        .setProps({ maxValue: 100 });
      return temperatureService;
    }
  
    getHumidityService() {
      const humidityService = new Service.HumiditySensor(this.humidityName);
      humidityService
        .getCharacteristic(Characteristic.CurrentRelativeHumidity)
        .on('get', callback => this.onCharacteristicGetValue(callback, this.humidity));
      return humidityService;
    }
  
    getServices() {
      const services = [
        this.informationService,
        this.temperatureService,
        this.humidityService,
        this.fakeGatoHistoryService,
      ];
      return services.filter(Boolean);
    }
  }


  module.exports = (homebridge) => {
    FakeGatoHistoryService = require('fakegato-history')(homebridge);
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridgeAPI = homebridge;
    return { EVETempHumAccessory };
  };