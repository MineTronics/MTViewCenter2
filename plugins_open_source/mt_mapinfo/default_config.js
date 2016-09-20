module.exports = {
    appConfig: {
        plugin: {
            title: 'MAP.TITLE',
            description: 'MAP.DESC',
            version: 2.0,
            pluginDeps: ['mt_vis'],
            tab: {
                title: 'MAP.TITLE',
                content: '<mapinfo></mapinfo>'
            }
        },
        configDefaults: {
            default_map_id: null,
            fallback_map_location: 'static/mapinfo.json',
            mt_mapinfo_autostart: true,
            allow_extrapolating: false,
            allow_map_exporting_as_json: false
        }
    },
    commonDeps: [
        'jquery.soap'
    ],
    paths: {
        'jquery.soap': '<%= bower_components %>/jquery.soap/jquery.soap'
    },
    shim: {
        'jquery.soap': {
            deps: ['jquery']
        }
    }
};

