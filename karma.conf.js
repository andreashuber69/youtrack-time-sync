module.exports = function(config) {
    config.set({
        frameworks: [ "jasmine", "karma-typescript" ],
        files: [
            { pattern: "src/**/*.spec.ts" }
        ],
        preprocessors: {
            "**/*.ts": [ "karma-typescript" ]
        },
        reporters: [ "dots", "karma-typescript" ],
        browsers: [ "Chrome" ],
        singleRun: true,
        karmaTypescriptConfig: {
            tsconfig: "./tsconfig.json"
        }
    });
};
