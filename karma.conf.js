module.exports = function(config) {
    config.set({
        frameworks: [ "jasmine", "karma-typescript" ],
        files: [
            "src/model/WorkBookParser.spec.ts",
            "src/model/WorkBookParser.ts"
        ],
        preprocessors: {
            "**/*.ts": [ "karma-typescript" ]
        },
        reporters: [ "dots", "karma-typescript" ],
        browsers: [ "Chrome", "ChromeHeadless" ],
        // Set this to false while debugging
        singleRun: true,
        karmaTypescriptConfig: {
            bundlerOptions: {
                entrypoints: /\.spec\.ts$/,
                sourceMap: true
            },
            compilerDelay: 3000,
            compilerOptions: {
                module: "commonjs"
            },
            coverageOptions: {
                // Set this to false while debugging
                instrumentation: true
            },
            reports: {
                lcovonly: {
                    directory: "coverage",
                    subdirectory: ".",
                    filename: "lcov.lcov"
                },
                html: {
                    directory: "coverage",
                    subdirectory: "."
                }
            },
            tsconfig: "./tsconfig.json"
        }
    });
};
