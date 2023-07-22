const { ApolloServer } = require('@apollo/server');
const { ApolloServerPluginDrainHttpServer } = require("@apollo/server/plugin/drainHttpServer");
const { expressMiddleware } = require('@apollo/server/express4');
const express = require("express");
const { OGM } = require("@neo4j/graphql-ogm");
const cors = require('cors')
const { Neo4jGraphQL, Neo4jGraphQLSubscriptionsSingleInstancePlugin } = require("@neo4j/graphql");

const { createServer } = require("http");
const { WebSocketServer } = require("ws");
const { useServer } = require("graphql-ws/lib/use/ws");

const { typeDefs } = require('./graphql/schema')
const { resolvers } = require('./graphql/resolvers')

const { getDriver } = require('./common/driver')
var bodyParser = require('body-parser')

const driver = getDriver()
const subscriptionsPlugin = new Neo4jGraphQLSubscriptionsSingleInstancePlugin();

const ogm = new OGM({
  typeDefs, driver,
  plugins: { subscriptions: subscriptionsPlugin }
});

const neoSchema = new Neo4jGraphQL({
  typeDefs, resolvers, driver,
  plugins: {
    subscriptions: subscriptionsPlugin,
  },
});

(async function () {
  const schema = await neoSchema.getSchema();
  await ogm.init()

  await neoSchema.assertIndexesAndConstraints({ options: { create: true } });
  const app = express();
  const httpServer = createServer(app);
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/graphql",
  });
  const serverCleanup = useServer({ schema }, wsServer);
  const server = new ApolloServer({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
  });
  await server.start();

  app.use(
    '/graphql',
    bodyParser.json(),
    cors(),
    expressMiddleware(server, {
      context: async ({ req }) => { 
        let user = null; // replace with your custom auth logic here, if required
        return {
          ogm,
          jwt: user
        }
      },
    }),
  );
  const PORT = process.env.PORT || 4000;
  await new Promise((resolve) => httpServer.listen({ port: PORT }, resolve));
  console.log(`🚀 Server ready at http://localhost:${PORT}/`);
  app.get('/health', (req, res) => {
    res.status(200).send('Okay!');
  });
})()