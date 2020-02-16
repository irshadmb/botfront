import { upsertRolesData, getRolesData, deleteRolesData } from '../mongo/rolesData';

export default {
    Query: {
        getRolesData: async () => {
            const rolesData = await getRolesData();
            const meteorRoles = await Meteor.roles.find({}).fetch();
            rolesData.forEach((roleData, index) => {
                rolesData[index] = roleData.toObject();
                const correspondingMeteorRole = meteorRoles.find(
                    role => role._id === roleData.name,
                );
                if (!correspondingMeteorRole) {
                    deleteRolesData(roleData);
                } else {
                    rolesData[index].children = correspondingMeteorRole.children.map(
                        children => children._id,
                    );
                }
            });
            return rolesData;
        },
    },
    Mutation: {
        upsertRolesData: (_parent, args) => upsertRolesData(args),
        deleteRolesData: (_parent, args) => deleteRolesData(args),
    },
};
