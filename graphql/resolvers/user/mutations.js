const { GraphQLError } = require('graphql')
const {getDriver} = require('../../../common/driver')
const userMutations = {
    createUser: async (_, { createUserInput }, context) => {
        try {
            const ogm = context.ogm
            const User = ogm.model('User')
            const user = await User.create({
                input: {
                    ...createUserInput,
                    userRole: {
                        connect: {
                            where: {
                                node: {
                                    _id_IN: createUserInput.userRole
                                }
                            }
                        }
                    }
                }
            })
            const createdUser = await User.find({
                where: {
                    _id: user?.users?.[0]?._id
                },
                selectionSet: `{
                    _id
                    firstName
                    lastName
                    email
                    userRole {
                        _id
                        role
                    }
                    createdAt
                    updatedAt
                }`
            })
            return createdUser?.[0]
        } catch (error) {
            throw new GraphQLError(typeof error === 'string' ? error : error.message)
        }
    },
    updateUser: async (_, { updateUserInput }, context) => {
        let driver = getDriver();
        let session = driver.session();
        const tx = await session.beginTransaction()
        try {
            const ogm = context.ogm
            const User = ogm.model('User')
            const _id = updateUserInput._id
            delete updateUserInput._id
            const user =await User.update({
                where: {
                    _id: _id
                }, update: {
                    ...updateUserInput,
                }, context: {
                    executionContext: tx
                }
            })
            console.log(user?.users[0])
            let updatedUser = await User.find({
                where: {
                    _id: _id
                },
                selectionSet:`{
                    _id
                    firstName
                    lastName
                    email
                    userRole {
                        _id
                        role
                    }
                    createdAt
                    updatedAt
                }`
            })
            console.log(updatedUser[0])
            await tx.commit();
            updatedUser = await User.find({
                where: {
                    _id: _id
                },
                selectionSet: `{
                    _id
                    firstName
                    lastName
                    email
                    userRole {
                        _id
                        role
                    }
                    createdAt
                    updatedAt
                }`
            })
            console.log(updatedUser[0])
            return updatedUser?.[0]
        } catch (error) {
            console.log(error)
            if (tx) await tx.rollback();
            throw new GraphQLError(typeof error === 'string' ? error : error.message)
        }
    }
}

module.exports = userMutations;