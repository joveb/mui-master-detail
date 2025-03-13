import React, { useState, useEffect, useCallback, useRef } from "react";
import { DataGrid, GridRow } from "@mui/x-data-grid";
import { Box, IconButton, Paper, Tab, Tabs, Typography } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { alpha } from "@mui/material/styles";
import axios from 'axios';

// Define GRID_STYLES outside the component
const GRID_STYLES = {
    border: 'none',
    '& .MuiDataGrid-columnHeaders': {
        backgroundColor: '#f5f5f5',
        borderBottom: '2px solid #e0e0e0',
        '& .MuiDataGrid-columnHeader': {
            fontWeight: 'bold',
            color: '#1976d2',
        },
    },
    '& .MuiDataGrid-row': {
        '&:nth-of-type(even)': {
            backgroundColor: alpha('#1976d2', 0.04),
        },
        '&:hover': {
            backgroundColor: alpha('#1976d2', 0.08),
        },
        maxHeight: 'none !important',
    },
    '& .MuiDataGrid-cell': {
        borderBottom: '1px solid #e0e0e0',
    },
    '& .MuiDataGrid-virtualScroller': {
        overflow: 'visible !important',
    },
    '& .MuiDataGrid-footerContainer': {
        borderTop: '2px solid #e0e0e0',
    },
};

// TabPanel component declaration
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

const MasterDetailDataGrid = () => {
    const [expandedRows, setExpandedRows] = useState({});
    const [tabValues, setTabValues] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [users, setUsers] = useState([]);
    const [totalRows, setTotalRows] = useState(0);
    const [paginationModel, setPaginationModel] = useState({
        pageSize: 5,
        page: 0
    });
    
    // Add sort model for master table
    const [sortModel, setSortModel] = useState([]);

    // Add request tracking refs for master table
    const masterRequestIdRef = useRef('');
    const masterRequestCountRef = useRef(0);

    // Add column definitions for detail tables
    const postsColumns = [
        { field: "id", headerName: "ID", width: 70 },
        { field: "title", headerName: "Title", width: 300 },
        { field: "body", headerName: "Content", width: 500 }
    ];

    const commentsColumns = [
        { field: "id", headerName: "ID", width: 70 },
        { field: "name", headerName: "Name", width: 200 },
        { field: "email", headerName: "Email", width: 200 },
        { field: "body", headerName: "Comment", width: 500 }
    ];

    const albumsColumns = [
        { field: "id", headerName: "ID", width: 70 },
        { field: "title", headerName: "Title", width: 500 }
    ];

    const fetchUsers = useCallback(async () => {
        // Create a unique request ID for this master request that includes sorting
        const sortParam = sortModel.length > 0 
            ? `${sortModel[0].field}-${sortModel[0].sort}` 
            : 'default';
        const requestId = `master-${paginationModel.page}-${paginationModel.pageSize}-${sortParam}-${++masterRequestCountRef.current}`;
        
        // Skip if this exact request is already in progress
        if (masterRequestIdRef.current === requestId) {
            console.log(`Skipping duplicate master request: ${requestId}`);
            return;
        }
        
        // Set the current request ID
        masterRequestIdRef.current = requestId;
        
        let isCancelled = false;
        
        try {
            setLoading(true);
            console.log(`Starting master fetch #${masterRequestCountRef.current} for page ${paginationModel.page}, sort: ${sortParam}`);
            
            const params = new URLSearchParams({
                _page: paginationModel.page + 1,
                _limit: paginationModel.pageSize
            });

            // Add sorting parameters if available
            if (sortModel.length > 0) {
                params.append('_sort', sortModel[0].field);
                params.append('_order', sortModel[0].sort === 'asc' ? 'asc' : 'desc');
            }

            // Add a small delay to prevent rapid consecutive requests
            await new Promise(resolve => setTimeout(resolve, 50));
            
            // Only proceed if this request is still the current one
            if (isCancelled || masterRequestIdRef.current !== requestId) {
                console.log(`Master request ${requestId} cancelled or superseded`);
                return;
            }
            
            console.log(`Making master API call to users?${params} [${requestId}]`);
            const response = await axios.get(
                `https://jsonplaceholder.typicode.com/users?${params}`
            );
            
            // Only update state if this is still the current request
            if (isCancelled || masterRequestIdRef.current !== requestId) {
                return;
            }
            
            const totalCount = parseInt(response.headers['x-total-count'] || '0');
            
            setUsers(response.data.map(user => ({
                id: user.id,
                name: user.name || '',
                username: user.username || '',
                email: user.email || '',
                companyName: user.company?.name || ''
            })));
            setTotalRows(totalCount);
            console.log(`Master data updated with ${response.data.length} users for ${requestId}`);
        } catch (err) {
            console.error(`Error fetching users for ${requestId}:`, err);
            if (!isCancelled && masterRequestIdRef.current === requestId) {
                setError('Failed to fetch users');
            }
        } finally {
            if (!isCancelled && masterRequestIdRef.current === requestId) {
                setLoading(false);
                console.log(`Finished master loading for ${requestId}`);
            }
        }
        
        return () => {
            isCancelled = true;
            console.log(`Cleaning up master request ${requestId}`);
        };
    }, [paginationModel.page, paginationModel.pageSize, sortModel]);

    // Initial load and pagination changes
    useEffect(() => {
        const cleanupFn = fetchUsers();
        return () => {
            if (cleanupFn && typeof cleanupFn === 'function') {
                cleanupFn();
            }
        };
    }, [fetchUsers]); // fetchUsers is memoized with useCallback, so this is safe

    const DetailPanel = ({ rowId }) => {
        const [detailPaginationModel, setDetailPaginationModel] = useState({
            pageSize: 5,
            page: 0
        });
        const [detailSortModel, setDetailSortModel] = useState([]);
        const [isLoading, setIsLoading] = useState(false);
        const [detailRows, setDetailRows] = useState([]);
        const [detailTotalCount, setDetailTotalCount] = useState(0);
        const activeTab = tabValues[rowId] || 0;
        
        // Store the current request ID to prevent duplicate calls
        const currentRequestRef = useRef('');
        const requestCountRef = useRef(0);
        
        // Fetch data on mount, tab change, or pagination change
        useEffect(() => {
            // Create a unique request ID that includes sorting
            const sortParam = detailSortModel.length > 0 
                ? `${detailSortModel[0].field}-${detailSortModel[0].sort}` 
                : 'default';
            const requestId = `${rowId}-${activeTab}-${detailPaginationModel.page}-${detailPaginationModel.pageSize}-${sortParam}-${++requestCountRef.current}`;
            let isCancelled = false;
            
            // Skip if this exact request is already in progress
            if (currentRequestRef.current === requestId) {
                console.log(`Skipping duplicate request: ${requestId}`);
                return;
            }
            
            // Set the current request ID
            currentRequestRef.current = requestId;
            
            const fetchDetailData = async () => {
                if (isCancelled) return;
                
                setIsLoading(true);
                console.log(`Starting fetch #${requestCountRef.current} for row ${rowId}, tab ${activeTab}, page ${detailPaginationModel.page}, sort: ${sortParam}`);
                
                try {
                    let endpoint;
                    switch (activeTab) {
                        case 0:
                            endpoint = `https://jsonplaceholder.typicode.com/users/${rowId}/posts`;
                            break;
                        case 1:
                            endpoint = `https://jsonplaceholder.typicode.com/posts/${rowId}/comments`;
                            break;
                        case 2:
                            endpoint = `https://jsonplaceholder.typicode.com/users/${rowId}/albums`;
                            break;
                        default:
                            setIsLoading(false);
                            return;
                    }
                    
                    const params = new URLSearchParams({
                        _page: detailPaginationModel.page + 1,
                        _limit: detailPaginationModel.pageSize
                    });
                    
                    // Add sorting parameters if available
                    if (detailSortModel.length > 0) {
                        params.append('_sort', detailSortModel[0].field);
                        params.append('_order', detailSortModel[0].sort === 'asc' ? 'asc' : 'desc');
                    }
                    
                    // Add a delay to prevent rapid multiple fetches
                    await new Promise(resolve => setTimeout(resolve, 50));
                    
                    // Only proceed if this request is still the current one
                    if (isCancelled || currentRequestRef.current !== requestId) {
                        console.log(`Request ${requestId} cancelled or superseded`);
                        return;
                    }
                    
                    console.log(`Making API call to ${endpoint}?${params} [${requestId}]`);
                    const response = await axios.get(`${endpoint}?${params}`);
                    console.log(`API response received for ${requestId}:`, response.data);
                    
                    if (!isCancelled && currentRequestRef.current === requestId) {
                        const totalCount = parseInt(response.headers['x-total-count'] || '0');
                        setDetailRows(response.data);
                        setDetailTotalCount(totalCount);
                        console.log(`Set ${response.data.length} rows with total count ${totalCount} for ${requestId}`);
                    }
                } catch (error) {
                    console.error(`Error fetching detail data for ${requestId}:`, error);
                    if (!isCancelled && currentRequestRef.current === requestId) {
                        setDetailRows([]);
                        setDetailTotalCount(0);
                    }
                } finally {
                    if (!isCancelled && currentRequestRef.current === requestId) {
                        setIsLoading(false);
                        console.log(`Finished loading for ${requestId}`);
                    }
                }
            };
            
            fetchDetailData();
            
            return () => {
                isCancelled = true;
                console.log(`Cleaning up effect for ${requestId}`);
            };
        }, [rowId, activeTab, detailPaginationModel.page, detailPaginationModel.pageSize, detailSortModel]); // Added detailSortModel as dependency
        
        const handlePaginationModelChange = useCallback((newModel) => {
            console.log('Pagination model changed:', newModel);
            setDetailPaginationModel(newModel);
        }, []);

        const handleSortModelChange = useCallback((newModel) => {
            console.log('Sort model changed:', newModel);
            setDetailSortModel(newModel);
        }, []);

        const handleTabChange = (event, newValue) => {
            console.log('Tab changed to:', newValue);
            setTabValues(prev => ({
                ...prev,
                [rowId]: newValue
            }));
            setDetailPaginationModel({
                pageSize: 5,
                page: 0
            });
            setDetailSortModel([]);
        };
        
        console.log('Rendering DetailPanel', { 
            rowId, 
            activeTab, 
            isLoading, 
            rowCount: detailRows.length,
            paginationModel: detailPaginationModel,
            sortModel: detailSortModel,
            requestCount: requestCountRef.current
        });

        return (
            <Box sx={{ width: '100%', p: 2 }}>
                <Tabs value={activeTab} onChange={handleTabChange}>
                    <Tab label="Posts" />
                    <Tab label="Comments" />
                    <Tab label="Albums" />
                </Tabs>

                <TabPanel value={activeTab} index={0}>
                    <DataGrid
                        rows={detailRows}
                        columns={postsColumns}
                        paginationModel={detailPaginationModel}
                        onPaginationModelChange={handlePaginationModelChange}
                        sortModel={detailSortModel}
                        onSortModelChange={handleSortModelChange}
                        pageSizeOptions={[5, 10, 15]}
                        paginationMode="server"
                        sortingMode="server"
                        rowCount={detailTotalCount}
                        loading={isLoading}
                        autoHeight
                        disableColumnFilter
                        disableColumnMenu
                    />
                </TabPanel>

                <TabPanel value={activeTab} index={1}>
                    <DataGrid
                        rows={detailRows}
                        columns={commentsColumns}
                        paginationModel={detailPaginationModel}
                        onPaginationModelChange={handlePaginationModelChange}
                        sortModel={detailSortModel}
                        onSortModelChange={handleSortModelChange}
                        pageSizeOptions={[5, 10, 15]}
                        paginationMode="server"
                        sortingMode="server"
                        rowCount={detailTotalCount}
                        loading={isLoading}
                        autoHeight
                        disableColumnFilter
                        disableColumnMenu
                    />
                </TabPanel>

                <TabPanel value={activeTab} index={2}>
                    <DataGrid
                        rows={detailRows}
                        columns={albumsColumns}
                        paginationModel={detailPaginationModel}
                        onPaginationModelChange={handlePaginationModelChange}
                        sortModel={detailSortModel}
                        onSortModelChange={handleSortModelChange}
                        pageSizeOptions={[5, 10, 15]}
                        paginationMode="server"
                        sortingMode="server"
                        rowCount={detailTotalCount}
                        loading={isLoading}
                        autoHeight
                        disableColumnFilter
                        disableColumnMenu
                    />
                </TabPanel>
            </Box>
        );
    };

    const masterColumns = [
        {
            field: "expand",
            headerName: "",
            width: 50,
            renderCell: (params) => (
                <IconButton
                    onClick={() => {
                        setExpandedRows(prev => ({
                            ...prev,
                            [params.id]: !prev[params.id]
                        }));
                    }}
                >
                    {expandedRows[params.id] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                </IconButton>
            )
        },
        { field: "name", headerName: "Name", width: 200 },
        { field: "username", headerName: "Username", width: 130 },
        { field: "email", headerName: "Email", width: 200 },
        { field: "companyName", headerName: "Company", width: 200 }
    ];

    const rows = React.useMemo(() => {
        const result = [];
        users.forEach(user => {
            result.push(user);
            if (expandedRows[user.id]) {
                result.push({
                    id: `detail-${user.id}`,
                    isDetail: true,
                    parentId: user.id
                });
            }
        });
        return result;
    }, [users, expandedRows]);

    // Handle master table pagination changes
    const handleMasterPaginationModelChange = useCallback((newModel) => {
        console.log('Master pagination model changed:', newModel);
        setPaginationModel(newModel);
    }, []);

    // Handle master table sort model changes
    const handleSortModelChange = useCallback((newModel) => {
        console.log('Master sort model changed:', newModel);
        setSortModel(newModel);
        // Reset expanded rows when sorting to avoid showing wrong details
        setExpandedRows({});
    }, []);

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <Paper sx={{ width: "100%", overflow: "hidden" }}>
            <Typography variant="h5" component="h1" sx={{ p: 2 }}>
                Customer Information
            </Typography>

            <Box sx={{ width: "100%" }}>
                <DataGrid
                    rows={rows}
                    columns={masterColumns}
                    loading={loading}
                    paginationModel={paginationModel}
                    onPaginationModelChange={handleMasterPaginationModelChange}
                    sortModel={sortModel}
                    onSortModelChange={handleSortModelChange}
                    pageSizeOptions={[5, 10, 15]}
                    paginationMode="server"
                    sortingMode="server"
                    rowCount={totalRows}
                    disableColumnFilter
                    autoHeight
                    getRowHeight={({ id }) => {
                        if (String(id).startsWith('detail-')) {
                            return 400;
                        }
                        return 52;
                    }}
                    slots={{
                        row: (props) => {
                            if (props.row.isDetail) {
                                return <DetailPanel rowId={props.row.parentId} />;
                            }
                            return <GridRow {...props} />;
                        }
                    }}
                    sx={GRID_STYLES}
                />
            </Box>
        </Paper>
    );
};

export default MasterDetailDataGrid;
