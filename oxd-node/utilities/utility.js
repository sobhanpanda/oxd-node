var net = require('net');
var httpRequest = require('request');

/**
 * Function for oxd-server socket manipulation
 * @param {int} port - OXD port number for oxd-server
 * @param {int} host - URL of the oxd-server
 * @param {object} params - List of parameters to request oxd-server command
 * @param {string} command - OXD Command name
 * @returns {function} callback - Callback response function
 */
function oxdSocketRequest(port, host, params, command, callback) {
  // OXD data
  var data = {
    command: command,
    params: params
  };

  // Create socket object
  var client = new net.Socket();

  // Initiate a connection on a given socket.
  client.connect(port, host, function () {
    data = JSON.stringify(data);
    console.log('Connected', 'Request : ' + data);
    try {
      if (data.length > 0 && data.length <= 100) {
        console.log('Send data : ' + ('00' + data.length + data));
        client.write(('00' + data.length + data));
      }
      else if (data.length > 100 && data.length < 1000) {
        console.log('Send data : ' + ('0' + data.length + data));
        client.write(('0' + data.length + data));
      }
    } catch (err) {
      console.log('Send data error:' + err);
    }
  });

  // Emitted when data is received
  client.on('data', function (req) {
    var data = req.toString();
    console.log('Response : ' + data);
    callback(data.substring(4, data.length));
    client.end(); // kill client after server's response
  });

  // Emitted when an error occurs. The 'close' event will be called directly following this event.
  client.on('error', function (err) {
    console.log('Error: ' + err);
    callback(err);
    client.end(); // kill client after server's response
  });

  // Emitted when the server closes.
  client.on('close', function () {
    console.log('Connection closed');
  });
}

/**
 *
 * @param {string} url - URL of oxd-https-extension with particular command request
 * @param {object} params - List of parameters to request oxd-server command
 * @returns {function} callback - Callback response function
 */
function oxdHttpRequest(url, params, callback) {

  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; //This line is to over come self signed certificate request issue, in real time this should be removed

  // oxd-https-extension request
  var options = {
    url: url,
    body: params,
    json: true
  };

  // Set protection_access_token in header
  if (params.protection_access_token != null) {
    options['headers'] = {
      Authorization: 'Bearer ' + params.protection_access_token
    };
  }

  console.log('Request :' + JSON.stringify(options));

  // http request
  httpRequest.post(options, function (error, response, body) {
    if (!!error) {
      console.log('Error: ' + error);
      callback(JSON.stringify(error));
    }

    if (!error && response.statusCode == 200) {
      console.log('Request :' + JSON.stringify(body));
      callback(JSON.stringify(body));
    }

    console.log('Fail Request :' + JSON.stringify(body));
    callback(JSON.stringify(body));
  });
}

module.exports = {
  oxdSocketRequest: oxdSocketRequest,
  oxdHttpRequest: oxdHttpRequest
};
