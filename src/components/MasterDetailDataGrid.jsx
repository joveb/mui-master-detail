import React, { useState } from "react";
import { DataGrid, GridRow } from "@mui/x-data-grid";
import { Box, IconButton, Paper, Tab, Tabs, Typography, TextField, Stack } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { styled } from "@mui/material/styles";
import { masterRows, detailData } from "../data/mockData";

// Styled components for the detail view
const DetailContainer = styled(Box)(({ theme }) => ({
    padding: theme.spacing(2),
    backgroundColor: theme.palette.grey[50],
    borderBottom: `1px solid ${theme.palette.divider}`,
    width: "100%",
}));

const TabPanel = (props) => {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`detail-tabpanel-${index}`}
            aria-labelledby={`detail-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
        </div>
    );
};

// Master detail component
const MasterDetailDataGrid = () => {
    const [expandedRows, setExpandedRows] = useState({});
    const [tabValues, setTabValues] = useState({});
    const [filters, setFilters] = useState({
        firstName: '',
        lastName: '',
        age: '',
        city: ''
    });

    // Filter the master rows based on the filter values
    const filteredRows = masterRows.filter(row => {
        return (
            row.firstName.toLowerCase().includes(filters.firstName.toLowerCase()) &&
            row.lastName.toLowerCase().includes(filters.lastName.toLowerCase()) &&
            (filters.age === '' || row.age.toString().includes(filters.age)) &&
            row.city.toLowerCase().includes(filters.city.toLowerCase())
        );
    });

    // Master grid columns
    const masterColumns = [
        {
            field: "expand",
            headerName: "",
            width: 50,
            sortable: false,
            filterable: false,
            renderCell: (params) => {
                const isExpanded = expandedRows[params.row.id] || false;
                return (
                    <IconButton
                        aria-label="expand row"
                        size="small"
                        onClick={() => {
                            setExpandedRows((prev) => ({
                                ...prev,
                                [params.row.id]: !isExpanded,
                            }));
                            if (!tabValues[params.row.id]) {
                                setTabValues((prev) => ({
                                    ...prev,
                                    [params.row.id]: 0,
                                }));
                            }
                        }}
                    >
                        {isExpanded ? (
                            <KeyboardArrowUpIcon />
                        ) : (
                            <KeyboardArrowDownIcon />
                        )}
                    </IconButton>
                );
            },
        },
        { field: "id", headerName: "ID", width: 70 },
        { field: "firstName", headerName: "First Name", width: 130 },
        { field: "lastName", headerName: "Last Name", width: 130 },
        { field: "age", headerName: "Age", type: "number", width: 90 },
        { field: "city", headerName: "City", width: 150 },
    ];

    // Detail columns for each tab
    const ordersColumns = [
        { field: "id", headerName: "Order ID", width: 100 },
        { field: "product", headerName: "Product", width: 200 },
        { field: "date", headerName: "Date", width: 150 },
        { field: "amount", headerName: "Amount", type: "number", width: 120 },
    ];

    const activitiesColumns = [
        { field: "id", headerName: "Activity ID", width: 100 },
        { field: "type", headerName: "Type", width: 150 },
        { field: "description", headerName: "Description", width: 300 },
        { field: "date", headerName: "Date", width: 150 },
    ];

    const notesColumns = [
        { field: "id", headerName: "Note ID", width: 100 },
        { field: "title", headerName: "Title", width: 200 },
        { field: "content", headerName: "Content", width: 350 },
        { field: "createdBy", headerName: "Created By", width: 150 },
    ];

    const DetailPanel = ({ rowId }) => {
        const rowDetailData = detailData[rowId] || {
            orders: [],
            activities: [],
            notes: [],
        };
        const activeTab = tabValues[rowId] || 0;

        const handleTabChange = (event, newValue) => {
            setTabValues((prev) => ({
                ...prev,
                [rowId]: newValue,
            }));
        };

        return (
            <Box sx={{ width: '100%', p: 2 }}>
                <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        aria-label="detail tabs"
                    >
                        <Tab label="Orders" />
                        <Tab label="Activities" />
                        <Tab label="Notes" />
                    </Tabs>
                </Box>

                <TabPanel value={activeTab} index={0}>
                    <Typography variant="h6" gutterBottom component="div">
                        Orders
                    </Typography>
                    <Box sx={{ height: 300, width: "100%" }}>
                        <DataGrid
                            rows={rowDetailData.orders}
                            columns={ordersColumns}
                            pageSize={5}
                            rowsPerPageOptions={[5]}
                            disableSelectionOnClick
                            hideFooter
                        />
                    </Box>
                </TabPanel>

                <TabPanel value={activeTab} index={1}>
                    <Typography variant="h6" gutterBottom component="div">
                        Activities
                    </Typography>
                    <Box sx={{ height: 300, width: "100%" }}>
                        <DataGrid
                            rows={rowDetailData.activities}
                            columns={activitiesColumns}
                            pageSize={5}
                            rowsPerPageOptions={[5]}
                            disableSelectionOnClick
                            hideFooter
                        />
                    </Box>
                </TabPanel>

                <TabPanel value={activeTab} index={2}>
                    <Typography variant="h6" gutterBottom component="div">
                        Notes
                    </Typography>
                    <Box sx={{ height: 300, width: "100%" }}>
                        <DataGrid
                            rows={rowDetailData.notes}
                            columns={notesColumns}
                            pageSize={5}
                            rowsPerPageOptions={[5]}
                            disableSelectionOnClick
                            hideFooter
                        />
                    </Box>
                </TabPanel>
            </Box>
        );
    };

    // Create the rows with detail panels
    const rows = filteredRows.reduce((acc, row) => {
        acc.push(row);
        if (expandedRows[row.id]) {
            acc.push({
                id: `detail-${row.id}`,
                isDetail: true,
                parentId: row.id,
            });
        }
        return acc;
    }, []);

    const handleFilterChange = (field) => (event) => {
        setFilters(prev => ({
            ...prev,
            [field]: event.target.value
        }));
    };

    return (
        <Paper sx={{ width: "100%", overflow: "hidden" }}>
            <Typography variant="h5" component="h1" sx={{ p: 2 }}>
                Customer Information
            </Typography>

            {/* External Filters */}
            <Box sx={{ p: 2 }}>
                <Stack 
                    direction="row" 
                    spacing={2} 
                    sx={{ mb: 2 }}
                >
                    <TextField
                        label="First Name"
                        variant="outlined"
                        size="small"
                        value={filters.firstName}
                        onChange={handleFilterChange('firstName')}
                    />
                    <TextField
                        label="Last Name"
                        variant="outlined"
                        size="small"
                        value={filters.lastName}
                        onChange={handleFilterChange('lastName')}
                    />
                    <TextField
                        label="Age"
                        variant="outlined"
                        size="small"
                        type="number"
                        value={filters.age}
                        onChange={handleFilterChange('age')}
                    />
                    <TextField
                        label="City"
                        variant="outlined"
                        size="small"
                        value={filters.city}
                        onChange={handleFilterChange('city')}
                    />
                </Stack>
            </Box>

            {/* DataGrid */}
            <Box sx={{ width: "100%" }}>
                <DataGrid
                    rows={rows}
                    columns={masterColumns.map(col => ({
                        ...col,
                        filterable: false
                    }))}
                    pageSize={10}
                    rowsPerPageOptions={[10]}
                    disableSelectionOnClick
                    getRowHeight={({ id }) => {
                        if (id.toString().startsWith('detail-')) {
                            return 450;
                        }
                        return 52;
                    }}
                    slots={{
                        row: (props) => {
                            if (props.row.isDetail) {
                                return (
                                    <div 
                                        style={{ 
                                            gridColumn: '1/-1',
                                            width: '100%',
                                            height: '100%'
                                        }}
                                    >
                                        <DetailPanel rowId={props.row.parentId} />
                                    </div>
                                );
                            }
                            return <GridRow {...props} />;
                        }
                    }}
                    sx={{
                        '& .MuiDataGrid-row': {
                            maxHeight: 'none !important',
                        },
                        '& .MuiDataGrid-virtualScroller': {
                            overflow: 'visible !important',
                        }
                    }}
                    disableColumnFilter
                />
            </Box>
        </Paper>
    );
};

export default MasterDetailDataGrid;
