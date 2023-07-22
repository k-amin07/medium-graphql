const neo4j = require("neo4j-driver");
const env = process.env.NODE_ENV || "development";
const config = require('../config/neo4j.json')[env]

let driver = null

const getDriver = () => {
    if (!driver || !driver?.session()) {
        driver = neo4j.driver(
            config.host,
            neo4j.auth.basic(config.username, config.password),
        )
    }
    return driver
}

module.exports = { getDriver }