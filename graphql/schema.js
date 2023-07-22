const { join } = require("path");
const { readdirSync, readFileSync } = require("fs");

const gqlFiles = readdirSync(join(__dirname, "./typedefs"));

let typeDefs = "";

gqlFiles.forEach((file) => {
    typeDefs += readFileSync(join(__dirname, "../graphql/typedefs", file), {
        encoding: "utf8",
    });
    typeDefs += '\n'
});

module.exports = { typeDefs };