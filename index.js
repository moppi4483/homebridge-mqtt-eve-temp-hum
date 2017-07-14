var Service, Characteristic;
var mqtt    = require('mqtt');
var inherits = require('util').inherits;

var EveService = {};
var klimaService;


module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory("homebridge-mqtt-eve-temp-hum", "mqtt-eve-temp-hum", EVETempHum);


    EveService.KlimaService = function(displayName, subtype) {
        Service.call(this, displayName, 'E863F001-079E-48FF-8F27-9C2605A29F52', subtype);
        this.addCharacteristic(Characteristic.CurrentTemperature);
        this.addCharacteristic(Characteristic.CurrentRelativeHumidity);
        //this.addCharacteristic(CustomCharacteristic.AirPressure);
    };
    inherits(EveService.KlimaService, Service);
    
    EveService.Logging = function(displayName, subtype) {
        Service.call(this, displayName, 'E863F007-079E-48FF-8F27-9C2605A29F52', subtype);
        /*this.addCharacteristic(LegrandMyHome.E863F116);
        this.addCharacteristic(LegrandMyHome.E863F117);
        this.addCharacteristic(LegrandMyHome.E863F11C);
        this.addCharacteristic(LegrandMyHome.E863F121);*/
    };
    inherits(EveService.Logging, Service);
}


function EVETempHum(log, config) {
    this.log            = log;
    this.name           = config["name"];
    this.url            = config['url'];
    this.topicGet       = config['topicGet'];
    this.topicSet       = config['topicSet'];
    this.client_Id 		= 'mqttjs_' + Math.random().toString(16).substr(2, 8);7
    this.options        = {
        keepalive           : 10,
        clientId            : this.client_Id,
		protocolId          : 'MQTT',
        protocolVersion     : 4,
		clean               : true,
		reconnectPeriod     : 1000,
		connectTimeout      : 30 * 1000,
        max_temperature     : config["maxTemperature"] || 100,
        min_temperature     : config["minTemperature"] || -50,
        max_humidity        : config["maxHumidity"] || 100,
        min_humidity        : config["minHumidity"] || 0,
		username            : config["username"],
		password            : config["password"],
		will            : {
			topic       : 'WillMsg',
			payload     : 'Connection Closed abnormally..!',
			qos         : 0,
			retain      : false
		},
		rejectUnauthorized  : false
	};


    this.statusCmd      = "newData";

    this.informationService = new Service.AccessoryInformation();
	this.informationService
        .setCharacteristic(Characteristic.Manufacturer, "moppi4483")
        .setCharacteristic(Characteristic.Model, "Eigenbau")
        .setCharacteristic(Characteristic.SerialNumber, "0002");


    this.klimaService = new EveService.KlimaService(this.name);
    this.client  = mqtt.connect(this.url, this.options);

    this.loggingService = new EveService.Logging(this.name);

    var that = this;
    this.client.subscribe(this.topicGet);

    this.client.on('message', function (topic, message) 
    {
        // message is Buffer
        if (topic == that.topicGet) {
            that.log(that.name + " - New Message");
            data = JSON.parse(message);

            if (data === null) {return null}
    
            that.temperature = parseFloat(data.temperature);
            that.humidity = parseInt(data.humidity)

			that.log("Temperature: " + that.temperature + "; Humidity: " + that.humidity);
            that.klimaService.setCharacteristic(Characteristic.CurrentTemperature, that.temperature);
            that.klimaService.setCharacteristic(Characteristic.CurrentRelativeHumidity, that.humidity);
        }
    });

    this.klimaService
        .getCharacteristic(Characteristic.CurrentTemperature)
        .on('get', this.getState.bind(this));
    this.klimaService
        .getCharacteristic(Characteristic.CurrentTemperature)
        .setProps({minValue: this.options["min_temperature"]});
    this.klimaService
        .getCharacteristic(Characteristic.CurrentTemperature)
        .setProps({maxValue: this.options["max_temperature"]});
    this.klimaService
        .getCharacteristic(Characteristic.CurrentTemperature)
        .setProps({minStep: 0.1});
}

EVETempHum.prototype.getState = function(callback) {
    if (this.statusCmd !== undefined) {
    	this.client.publish(this.topicSet, this.statusCmd, this.publish_options);
    }
    callback(null, this.temperature);
}

EVETempHum.prototype.getServices = function() {
    return [this.informationService, this.klimaService, this.loggingService];
}