const { userMutations } = require('./user')
const resolvers = {
    Mutation: {
        ...userMutations
    }
}

module.exports = {resolvers};
