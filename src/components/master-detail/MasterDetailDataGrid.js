import React, { useState, useEffect, useCallback, useRef } from "react";
import { DataGrid, GridRow } from "@mui/x-data-grid";
import { Box, IconButton, Paper, Typography } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import axios from 'axios';
import { GRID_STYLES } from './GridStyles';
import DetailPanel from './DetailPanel';

/**
 * MasterDetailDataGrid component - A reusable grid that displays a master table with expandable detail views
 */
const MasterDetailDataGrid = ({
    title = "Master Detail View",
    apiBaseUrl = 'https://jsonplaceholder.typicode.com',
    masterEndpoint = 'users',
    getRowId = (row) => row.id,
    mapMasterRow = (row) => row, // Optional transformation function
    masterColumns = [],
    defaultPageSize = 5,
    relationMappings,
    detailTabLabels,
    detailColumnsConfig,
    expandIconPosition = 'start', // 'start' or 'end' or 'none'
    onMasterRowClick,
    onDetailTabChange,
    detailRowHeight = 400
}) => {
    const [expandedRows, setExpandedRows] = useState({});
    const [tabValues, setTabValues] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [masterData, setMasterData] = useState([]);
    const [totalRows, setTotalRows] = useState(0);
    const [paginationModel, setPaginationModel] = useState({
        pageSize: defaultPageSize,
        page: 0
    });
    
    // Add sort model for master table
    const [sortModel, setSortModel] = useState([]);

    // Add request tracking refs for master table
    const masterRequestIdRef = useRef('');
    const masterRequestCountRef = useRef(0);

    // Calculate complete master columns with optional expand button
    const completeMasterColumns = React.useMemo(() => {
        const expandColumn = {
            field: "expand",
            headerName: "",
            width: 50,
            renderCell: (params) => (
                <IconButton
                    onClick={(event) => {
                        event.stopPropagation();
                        setExpandedRows(prev => ({
                            ...prev,
                            [params.id]: !prev[params.id]
                        }));
                    }}
                >
                    {expandedRows[params.id] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                </IconButton>
            )
        };

        if (expandIconPosition === 'none') {
            return masterColumns;
        }
        
        return expandIconPosition === 'start' 
            ? [expandColumn, ...masterColumns]
            : [...masterColumns, expandColumn];
    }, [masterColumns, expandedRows, expandIconPosition]);

    const fetchMasterData = useCallback(async () => {
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
            
            console.log(`Making master API call to ${masterEndpoint}?${params} [${requestId}]`);
            const response = await axios.get(
                `${apiBaseUrl}/${masterEndpoint}?${params}`
            );
            
            // Only update state if this is still the current request
            if (isCancelled || masterRequestIdRef.current !== requestId) {
                return;
            }
            
            const totalCount = parseInt(response.headers['x-total-count'] || '0');
            
            // Map the response data using the provided mapping function
            const mappedData = response.data.map(row => mapMasterRow(row));
            
            setMasterData(mappedData);
            setTotalRows(totalCount);
            console.log(`Master data updated with ${mappedData.length} rows for ${requestId}`);
        } catch (err) {
            console.error(`Error fetching master data for ${requestId}:`, err);
            if (!isCancelled && masterRequestIdRef.current === requestId) {
                setError('Failed to fetch data');
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
    }, [paginationModel.page, paginationModel.pageSize, sortModel, apiBaseUrl, masterEndpoint, mapMasterRow]);

    // Initial load and pagination changes
    useEffect(() => {
        const cleanupFn = fetchMasterData();
        return () => {
            if (cleanupFn && typeof cleanupFn === 'function') {
                cleanupFn();
            }
        };
    }, [fetchMasterData]);

    // Prepare rows with detail panels
    const rows = React.useMemo(() => {
        const result = [];
        masterData.forEach(row => {
            const rowId = getRowId(row);
            result.push(row);
            if (expandedRows[rowId]) {
                result.push({
                    id: `detail-${rowId}`,
                    isDetail: true,
                    parentId: rowId
                });
            }
        });
        return result;
    }, [masterData, expandedRows, getRowId]);

    // Handle master table pagination changes
    const handlePaginationModelChange = useCallback((newModel) => {
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

    // Handle tab changes in the detail panel
    const handleDetailTabChange = useCallback((tabIndex, rowId) => {
        setTabValues(prev => ({
            ...prev,
            [rowId]: tabIndex
        }));
        
        if (onDetailTabChange) {
            onDetailTabChange(tabIndex, rowId);
        }
    }, [onDetailTabChange]);

    // Handle row click if provided
    const handleRowClick = useCallback((params) => {
        if (onMasterRowClick) {
            onMasterRowClick(params);
        }
        
        // Default behavior is to toggle expanded state
        if (!params.row.isDetail && expandIconPosition === 'none') {
            setExpandedRows(prev => ({
                ...prev,
                [params.id]: !prev[params.id]
            }));
        }
    }, [onMasterRowClick, expandIconPosition]);

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <Paper sx={{ width: "100%", overflow: "hidden" }}>
            {title && (
                <Typography variant="h5" component="h1" sx={{ p: 2 }}>
                    {title}
                </Typography>
            )}

            <Box sx={{ width: "100%" }}>
                <DataGrid
                    rows={rows}
                    columns={completeMasterColumns}
                    loading={loading}
                    paginationModel={paginationModel}
                    onPaginationModelChange={handlePaginationModelChange}
                    sortModel={sortModel}
                    onSortModelChange={handleSortModelChange}
                    pageSizeOptions={[5, 10, 15]}
                    paginationMode="server"
                    sortingMode="server"
                    rowCount={totalRows}
                    disableColumnFilter
                    autoHeight
                    onRowClick={handleRowClick}
                    getRowHeight={({ id }) => {
                        if (String(id).startsWith('detail-')) {
                            return detailRowHeight;
                        }
                        return 52; // Default row height
                    }}
                    slots={{
                        row: (props) => {
                            if (props.row.isDetail) {
                                const rowId = props.row.parentId;
                                // If relationMappings is a function, call it with the rowId
                                const mappings = typeof relationMappings === 'function' 
                                    ? relationMappings(rowId)
                                    : relationMappings;
                                
                                return (
                                    <DetailPanel 
                                        rowId={rowId}
                                        activeTab={tabValues[rowId] || 0}
                                        onTabChange={handleDetailTabChange}
                                        apiBaseUrl={apiBaseUrl}
                                        relationMappings={mappings}
                                        tabLabels={detailTabLabels}
                                        columnsConfig={detailColumnsConfig}
                                    />
                                );
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