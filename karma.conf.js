module.exports = function(config){
    config.set({
        basePath: '',
        frameworks: ['mocha','chai'],
        files: [
            'meas/**/*.js',
            'meas/**/*.spec.js'
        ],
        exclude: [
            '**/*.swp'
        ],
        preprocessors: {
            'meas/**/*.js': ['babel','coverage'],
            'meas/**/*.spec.js': ['babel']
        },

        reporters: ['mocha','coverage'],
        coverageReporter: {
            type : 'html',
            dir : 'coverage/'
        },
        port: 3001,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: false,
        browsers: ['Chrome'],
        singleRun: true,
        concurrency: Infinity
    });
}