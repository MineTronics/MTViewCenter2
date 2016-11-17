/**
 * This is a monkey patch to allow AMD configuration of additional libraries
 * for testing without messing with existing grunt-requirejs config.
 * This could be solved by for example having separate requirejs config files for
 * development and for production, but I've decided to keep configuration in one
 * place (config.js), load it as node module, merge it with configuration in
 * Gruntfile.js and use it with grunt templates.
 * If you want to get rid of this module update the grunt config 'requirejs' entry,
 * the targets section. Both for dev and prod environments it uses the same
 * 3rd party libraries.
 */
console.log('\nChanging requirejs config - see vc2_core/test/requirejs_test_config.js\n'
    + 'Adding path and shim for angular-mock');
require.config({
    paths: {
        'angular-mocks': '../../../bower_components/angular-mocks/angular-mocks'
    },
    shim: {
        'angular-mocks': {
            deps: ['angular']
        }
    }
});
