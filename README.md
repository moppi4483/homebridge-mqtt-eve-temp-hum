# homebridge-mqtt-eve-temp-hum
An homebridge plugin that create an HomeKit Temperature und Humidity Accessory mapped on MQTT topics.
This Accessory optimized for usage with EVE including History-Support.

# Installation
Follow the instruction in [homebridge](https://www.npmjs.com/package/homebridge) for the homebridge server installation.
The plugin is published through [NPM](https://www.npmjs.com/package/homebridge-mqtt-eve-temp-hum) and should be installed "globally" by typing:

    sudo npm install -g --unsafe-perm homebridge-mqtt-eve-temp-hum

# Information
This Plugin based on [homebridge-mi-hygrothermograph](https://github.com/hannseman/homebridge-mi-hygrothermograph)

# Release notes
VERSION 1.1.0
+ updated README

VERSION 1.0.6
+ minor fixes

VERSION 1.0.0
+ whole redesign
+ fakegato-Support

VERSION 0.1.2
+ Bugfixes

VERSION 0.1.0
+ Initial Release

# Configuration
Remember to configure the plugin in config.json in your home directory inside the .homebridge directory. Configuration parameters:

    "accessory"         : "mqtt-eve-temp-hum",
    "name"              : "PUT THE NAME OF YOUR SWITCH HERE",
    "url"               : "PUT URL OF THE BROKER HERE",
    "username"          : "OPTIONALLY PUT USERNAME OF THE BROKER HERE",
    "password"          : "OPTIONALLY PUT PASSWORD OF THE BROKER HERE",
    "topic"             : "PUT THE MQTT TOPIC FOR GETTING THE DATA OF THE ACCESSORY HERE",
    "fakeGatoEnabled"   : true / false,
    "serialNumber"      : "Serialnumber"

Look for a sample config in [config.json example](https://github.com/moppi4483/homebridge-mqtt-eve-temp-hum/blob/master/config.json)

# Important
The datastructure of the topic is: {"temperature":"value", "humidity":"value"}
If you are using multiple accessories with historical data, you need to set a unique serialNumber in the config-file.