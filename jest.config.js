module.exports = {
    roots: [
        "<rootDir>/components",
        "<rootDir>/pages",
        "<rootDir>/src"
    ],
    testMatch: [
        "**/*.test.ts"
    ],
    transform: {
        "\\.ts$": "ts-jest"
    },
}
