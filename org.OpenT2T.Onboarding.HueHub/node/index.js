'use strict';

var hue = require("node-hue-api");
var HueApi = require("node-hue-api").HueApi;
var readline = require('readline');
var inquirer = require('inquirer');

var upnpErr = function(err) {
    console.log(err);
};

var exit = function(err) {
    process.exit(0);
};

var getLights = function(ipaddr, userId, callback) {
    var lightAddresses = [];
    var api = new HueApi(ipaddr, userId);
    api.lights(function(err, result) {
        if (err)
            console.log(err);
        else {
            for (var light of result.lights) {
                var lightAddress = {
                    "hueAddress": ipaddr,
                    "userId": userId,
                    "uniqueId": light.uniqueId
                };

                console.log('light ' + light.id + ' = ' + JSON.stringify(lightAddress));

                lightAddresses.push(lightAddresses);
            }
            callback(lightAddresses);
            return;
        }
    });
};

// module exports, implementing the schema
module.exports = {

    onboard: function(name, successCallback, errorCallback) {
        console.log('Onboarding device : ' + name);

        // Step 1: find a Hue bridge
        hue.nupnpSearch(function(upnpErr, result) {
            var hueBridgeInfo = result[0];
            var ipaddr = hueBridgeInfo.ipaddress;
            console.log("Found Hue bridge at " + ipaddr);

            // Step 2: get a user Id
            console.log("Important! Press and hold the button on the top of the Hue.")
            var readline = require('readline');
            var rl = readline.createInterface(process.stdin, process.stdout);
            rl.setPrompt('Now hit the return key while still holding the button on the Hue...');
            rl.prompt();
            rl.on('line', function(line) {
                var hueapi = new HueApi();
                hueapi.createUser(ipaddr, function(err, userId) {
                    if (err) {
                        if (errorCallback) {
                            errorCallback('Create User Error', JSON.stringify(err));
                            return;
                        }
                    } else {
                        console.log("Created User: %s", userId);

                        // Step 3: get the lights attached to the Hue
                        getLights(ipaddr, userId, function(lights) {

                            if (!!lights && lights.length > 0) {
                                var choices = lights.map(function(light) {
                                    return JSON.stringify(light);
                                });

                                // ask the user to select a light
                                inquirer.prompt([
                                    {
                                        type: "list",
                                        name: "selectedLight",
                                        message: "Which light do you want to onboard?",
                                        choices: choices
                                    }
                                ], function(answers) {

                                    // all done. Now we have all the parameters we needed.
                                    var selectedLight = JSON.parse(answers.selectedLight);

                                    if (successCallback) {
                                        successCallback(selectedLight.hueAddress, selectedLight.userId, selectedLight.uniqueId, 'All done. Happy coding!');
                                        return;
                                    }
                                });

                            } else {
                                if (errorCallback) {
                                    errorCallback('NotFound', 'No devices found.');
                                    return;
                                }
                            }

                            successCallback(lights);
                        });
                    }
                });
            });
        });
    }
};
