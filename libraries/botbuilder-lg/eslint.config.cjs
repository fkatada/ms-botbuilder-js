const onlyWarn = require("eslint-plugin-only-warn");
const sharedConfig = require("../../eslint.config.cjs")

module.exports = [
    ...sharedConfig,
    {
        ignores: ["**/generated/*"],
    },
    {
        plugins: {
            "only-warn": onlyWarn,
        },
    }];
