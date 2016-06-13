/**
 * Registers grunt task to handle http authentication.
 *
 * Authentication is delegated to 'passport' node module, configured to use
 * custom local strategy. This strategy consumes MTUserCenter.Login SOAP service
 * to authenticate user.
 *
 * Because of possible initialization problems (glassfish vs node), the SOAP
 * client is lazy created as soon as there is an authentication request and
 * MTUserCenter.Login wsdl is available.
 *
 * Created passport instance is saved under 'express.all.options.passport' in
 * gruntconfig.
 * 
 * Custom task to asynchronously and lazy initialize soap client used
 * for authentication. Requests for restricted resources are aborted
 * if the authentication service is not available or client can't be
 * initialized - please check grunt output for information then.
 * 
 * @param {Grunt instance} grunt Passed grunt instance
 */

module.exports = function (grunt) {
    'use strict';
    grunt.config('mt_auth', {
        options: {
            loginWSDL: '<%= loginServiceWSDL %>'
        }
    });

    grunt.registerTask('mt_auth', 'Configure passport module for express authentication', function () {
        var options = this.options(),
            loginWSDL = options.loginWSDL,
            soap = require('soap'),
            soapClient,
            passport = require('passport'),
            LocalStrategy = require('passport-local').Strategy;

        /**
         * Retrieve the SOAP login client asyncronously. The client is lazy
         * initiated in case LoginService is not available yet at runtime.
         * @param {type} callback
         * @returns {undefined}
         */
        function getLoginClient(callback) {
            if (!soapClient) {
                soap.createClient(loginWSDL, function (err, client) {
                    if (err) {
                        grunt.log.error('SOAP Client configuration error.' + err);
                    } else {
                        grunt.log.writeln('SOAP Client configured successfully.');
                        soapClient = client;
                    }
                    callback(err, client);
                });
            } else {
                callback(null, soapClient);
            }
        }

        /**
         * Checks if object has no defined properties
         * @param {type} obj
         * @returns {Boolean}
         */
        function isEmpty(obj) {
            var prop;
            for (prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    return false;
                }
            }
            return true;
        }

        /**
         * Performs authentication using SOAP LoginService
         * @param {type} username
         * @param {type} password
         * @param {type} client
         * @param {type} done
         * @returns {undefined}
         */
        function authenticate(username, password, client, done) {
            /*
             * node-soap doesn't set the tns namespace on login method
             * thus body is created manualy rather then using
             * login({username: username, password:password}, fun)
             */
            var msg = '<tns:login>' +
                        '<username>' + username + '</username>' +
                        '<password>' + password + '</password>' +
                    '</tns:login>';

            client.login(msg, function (err, result) {
                if (err) {
                    done(null, false, { message: err.toString() });
                }
                if (!result || isEmpty(result.return)) {
                    done(null, false, { message: "Wrong login or password" });
                }
                done(null, {username: username});
            });
        }

        //Define custom local strategy
        passport.use(new LocalStrategy(
            function (username, password, done) {
                getLoginClient(function (err, client) {
                    if (err) {
                        //Login service is unavailable
                        done(err);
                    } else {
                        authenticate(username, password, client, done);
                    }
                });
            }
        ));

        // Serialized and deserialized methods when got from session
        passport.serializeUser(function (user, done) {
            done(null, user);
        });

        passport.deserializeUser(function (user, done) {
            done(null, user);
        });

        grunt.log.writeln('Configured passport module');
        grunt.config.set('mt_auth.options.passport', passport);
//        grunt.config.set('express.all.options.passport', passport);
    });
};



