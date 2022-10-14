async function checkAdminPermission(barongPool, role, section, method) {
    let permission = [{permissionCount: -1}];
    try {
        permission = await barongPool.query(`SELECT COUNT(*) as permissionCount from permissions where role='${role}' and action='ACCEPT' and verb='${method}' and path='graphql/${section}';`);
        console.log(permission[0][0]);
        
    } catch(err) {
        // console.log('ERROR QUERY', `SELECT COUNT(*) as permissionCount from permissions where role = "${role}" and action = "ACCEPT" and verb="${method}" and path="graphql/${section}";`); 
        console.log('ERROR CHECK', err);
    }
    return permission;
}

module.exports = checkAdminPermission;
