const EventEmitter = require('events');
const mqtt = require('mqtt');

export default class MQTTClient extends EventEmitter {
    constructor(config) {
      super()
      this.mqtt = mqtt.connect(config.url, {
        keepalive: 10,
        clientId: 'mqttjs_'.concat(Math.random().toString(16).substr(2, 8)),
        protocolId: 'MQTT',
        protocolVersion: 4,
        clean: true,
        reconnectPeriod: 1000,
        connectTimeout: 30 * 1000,
        will: {
          topic: 'WillMsg',
          payload: 'Connection Closed abnormally..!',
          qos: 0,
          retain: false,
        },
        username: config.username,
        password: config.password,
        rejectUnauthorized: false,
      })
  
      this.mqtt.on('connect', () => {
        this.emit('connected')
        this.mqtt.subscribe(config.topic)
      })
  
      this.mqttClient.on('message', (topic, message) => {
        const mqttData = JSON.parse(message)
        if (mqttData === null) return
        
        const temperature = parseFloat(mqttData.temperature);
        const humidity = parseInt(mqttData.humidity);

        this.emit('temperatureChange', temperature)
        this.emit('humidityChange', humidity)
      })
    }
  }