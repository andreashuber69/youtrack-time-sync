module.exports = function(config) {
    config.set({
        frameworks: [ "jasmine", "karma-typescript" ],
        files: [
            { pattern: "src/model/**/*.ts" }
        ],
        preprocessors: {
            "**/*.ts": [ "karma-typescript" ]
        },
        reporters: [ "dots", "karma-typescript" ],
        browsers: [ "Chrome" ],

        // Set this to false while debugging
        singleRun: true,

        karmaTypescriptConfig: {
            bundlerOptions: {
                sourceMap: true
            },
            compilerOptions: {
                module: "commonjs"
            },
            coverageOptions: {
                // Set this to false while debugging
                instrumentation: true
            },
            tsconfig: "./tsconfig.json"
        }
    });
};
