import React from "react";
import { MasterDetailDataGrid } from "./master-detail";

const userColumns = [
    { field: "name", headerName: "Name", width: 200 },
    { field: "username", headerName: "Username", width: 130 },
    { field: "email", headerName: "Email", width: 200 },
    { field: "companyName", headerName: "Company", width: 200 }
];

// Detail tables column definitions
const columnsConfig = {
    0: [
        { field: "id", headerName: "ID", width: 70 },
        { field: "title", headerName: "Title", width: 300 },
        { field: "body", headerName: "Content", width: 500 }
    ],
    1: [
        { field: "id", headerName: "ID", width: 70 },
        { field: "name", headerName: "Name", width: 200 },
        { field: "email", headerName: "Email", width: 200 },
        { field: "body", headerName: "Comment", width: 500 }
    ],
    2: [
        { field: "id", headerName: "ID", width: 70 },
        { field: "title", headerName: "Title", width: 500 }
    ]
};

// Define relation mappings for the detail panels
const createRelationMappings = (rowId) => {
    console.log('Creating relation mappings for rowId:', rowId);
    return {
        0: { endpoint: `users/${rowId}/posts`, idField: 'id' },
        1: { endpoint: `posts/${rowId}/comments`, idField: 'id' },
        2: { endpoint: `users/${rowId}/albums`, idField: 'id' }
    };
};

const mapUserRow = (user) => ({
    id: user.id,
    name: user.name || '',
    username: user.username || '',
    email: user.email || '',
    companyName: user.company?.name || ''
});

/**
 * Example implementation of the MasterDetailDataGrid
 */
const CustomerGrid = () => {
    return (
        <MasterDetailDataGrid
            title="Customer Information"
            apiBaseUrl="https://jsonplaceholder.typicode.com"
            masterEndpoint="users"
            masterColumns={userColumns}
            mapMasterRow={mapUserRow}
            getRowId={(row) => row.id}
            relationMappings={createRelationMappings}
            detailTabLabels={['Posts', 'Comments', 'Albums']}
            detailColumnsConfig={columnsConfig}
            defaultPageSize={5}
        />
    );
};

export default CustomerGrid;
