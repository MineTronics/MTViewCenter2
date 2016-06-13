/**
 * Starts express server
 * 
 * @param grunt
 *
 * @type type
 */

module.exports = function (grunt) {
    'use strict';

    if (!grunt.config('express')) {
        grunt.config('express', {
            options: {
                mtcenterUrl: '<%= appConfig.configDefaults.mtcenter_url %>',
                port: '<%= serverPort %>',
                cache: '<%= serverCache %>'
            },
            prod: {
                options: {
                    appDir: '<%= distDir %>/vc2'
                }
            },
            dev: {
                options: {
                    appDir: '<%= buildDir %>/vc2'
                }
            },
            all: {
                app: undefined,
                getServer: undefined
            }
        });
    }

    grunt.registerMultiTask('express', 'Start an express web server.', function () {
        var authDisabled, express, app, passport, bodyParser, CORSMiddleware,
            server, httpProxy, proxy, favicon, options;
        options = this.options();
        authDisabled = grunt.option('no_auth');
        bodyParser = require("body-parser");
        httpProxy = require('http-proxy');
        proxy = httpProxy.createProxyServer();

        /*
         * Setting express application
         */
        express = require('express');
        app = express();
        grunt.config('express.all.app', app);
        /*
         * Set jade template engine
         */
        app.set('views', options.appDir + '/views');
        app.set('view engine', 'jade');
        app.locals.pretty = true;

        passport = grunt.config.get('mt_auth.options.passport');

//        authMiddleware = function (req, res, next) {
//            if (!req.isAuthenticated()) {
//                res.sendStatus(401);
//            } else {
//                next();
//            }
//        };
//        if (authDisabled) {
//            grunt.log.writeln('Running server without authentication. Any request is treated as \'admin\' user has authenticated.');
//            authMiddleware = function (req, res, next) {
//                next();
//            };
//        }
        CORSMiddleware = function (req, res, next) {
            //No-cache headers
            if (!options.cache) {
                res.setHeader('cache-control', 'max-age=0');
                res.setHeader('cache-control', 'no-cache');
                res.setHeader('expires', '0');
                res.setHeader('expires', 'Tue, 01 Jan 1980 1:00:00 GMT');
                res.setHeader('pragma', 'no-cache');
            }

            //CORS support
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            res.setHeader('Access-Control-Allow-Credentials', 'false');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS ');
            next();
        };

        /*
         * Setting middleware
         */
        app.use([
            require('cookie-parser')(),
            require('body-parser').json(),
            require('express-session')({
                secret: 'mtexpress',
                resave: false,
                saveUninitialized: false
            }),
            passport.initialize(),
            passport.session(),

            //Live reload of assets in browser
            require('connect-livereload')(),
            CORSMiddleware
        ]);

        /*
         * Specifing site files and authentication for restricted resources
         */
        favicon = require('serve-favicon');
        app.use(favicon(options.appDir + '/static/img/mt/favicon.ico'));

        /*
        * set up proxy for WebServices with the prefix /ws/
        * the WS service requests will be directed to localhost
        */
        app.post('/ws/:serviceName/:endpointName', function (req, res) {
            proxy.web(req, res, {
                ignorePath: true,
                target: options.mtcenterUrl + req.params.serviceName + '/' + req.params.endpointName
            }, function (e) {
                var proxyError = {
                    msg: 'Proxy error when sending WebService request',
                    mtcenterUrl: options.mtcenterUrl,
                    webService: req.params.serviceName,
                    endpoint: req.params.endpointName,
                    target: options.mtcenterUrl + req.params.serviceName + '/' + req.params.endpointName,
                    thrownErorr: e
                };
                console.log(proxyError);
                res.status(500).send(proxyError);
            });
        });
        proxy.on('proxyReq', function (proxyReq, req, res, options) {
            proxyReq.path = proxyReq.path.slice(0, -1);
            //console.log('proxyReq.path', proxyReq.path);
        });
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: true }));

        //Redirect requests coming from jquery-ui
        app.use('/static/css/images', express.static(options.appDir + '/static/img/mt'));

        app.use('/', express.static(options.appDir));
        app.get('/', function (req, res) {
            res.render('index');
        });

        if (authDisabled) {
            app.post('/login', function (req, res) {
                res.send('admin');
            });
            app.post('/logout', function (req, res) {
                res.send(200);
            });
            app.get('/loggedin', function (req, res) {
                res.send('admin');
            });
        } else {
            app.post('/login', passport.authenticate('local'), function (req, res) {
                res.send(req.user);
            });
            app.post('/logout', function (req, res) {
                req.logOut();
                res.send(200);
            });
            app.get('/loggedin', function (req, res) {
                res.send(req.isAuthenticated() ? req.user : '0');
            });
        }

        /*
         * Start listening on provided port
         */
        server = app.listen(options.port, function () {

            var host = server.address().address,
                port = server.address().port;

            //Set getter for server reference
            //Reference can't be set directly in grunt config file, becuase it
            //doesn't allow to store there objects with circular references, like
            //the http server instance does.
            grunt.config('express.all.getServer', function () {
                return server;
            });
            grunt.log.writeln('Express server listening at http://%s:%s', host, port);
            grunt.log.writeln('Serving application files from ' + options.appDir);
            grunt.log.writeln('Additional server tasks running: ' + grunt.config('serverTasks'));
            grunt.log.writeln('Authentication is ' + (authDisabled ? 'disabled'.red : 'enabled'.green));
        });
    });
};

