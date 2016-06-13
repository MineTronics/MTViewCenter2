module.exports = {
    appConfig: {
        plugin: {
            autostart: true,
            title: 'VIS.TITLE',
            description: 'VIS.DESC',
            version: 2.0,
            tab: {
                fullscreen: true,
                title: 'VIS.TITLE',
                content: '<mt-scene></mt-scene>'
            }
        },
        configDefaults: {
            drawing_primitive: true,
            visualisation_autostart: true,
            camera_default_eye_vector: '0,0,-30',
            camera_default_lookAt_vector: '0,0,0',
            camera_default_up_vector: '0,1,0',
            camera_default_view_name: 'VIS.CAMERA.TOP'
        }
    },
    filesToCopy: [
        {
            cwd: './bower_components/scenejs/api/latest/plugins',
            expand: true,
            src: '**/*',
            nonull: true,
            dest: '<%= buildDir %>/vc2/static/scenejs_plugins'
        }
    ],
    paths: {
        scenejs: '<%= bower_components %>/scenejs/api/latest/scenejs',
        stats: '<%= bower_components %>/scenejs/examples/libs/stats.min',
        glmat: '<%= bower_components %>/scenejs/api/latest/plugins/lib/gl-matrix-min'
    },
    shim: {
        scenejs: {
            exports: "SceneJS"
        },
        stats: {
            exports: 'Stats'
        }
    }
};