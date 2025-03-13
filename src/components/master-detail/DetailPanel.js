import React, { useState, useEffect, useCallback, useRef } from "react";
import { Box, Tab, Tabs } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import axios from 'axios';
import TabPanel from "./TabPanel";

/**
 * Detail panel component for displaying related data in tabs
 */
const DetailPanel = ({ 
    rowId, 
    activeTab: parentActiveTab = 0,
    onTabChange,
    apiBaseUrl = 'https://jsonplaceholder.typicode.com',
    relationMappings = {},
    tabLabels = ['Posts', 'Comments', 'Albums'],
    columnsConfig = {
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
    }
}) => {
    const [detailPaginationModel, setDetailPaginationModel] = useState({
        pageSize: 5,
        page: 0
    });
    const [detailSortModel, setDetailSortModel] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [detailRows, setDetailRows] = useState([]);
    const [detailTotalCount, setDetailTotalCount] = useState(0);
    const [activeTab, setActiveTab] = useState(parentActiveTab || 0);
    
    // Store the current request ID to prevent duplicate calls
    const currentRequestRef = useRef('');
    const requestCountRef = useRef(0);

    // Handle parent component tab changes
    useEffect(() => {
        if (parentActiveTab !== undefined) {
            setActiveTab(parentActiveTab);
        }
    }, [parentActiveTab]);
    
    // Add logging when the component mounts and for props
    useEffect(() => {
        console.log('DetailPanel mounted/updated with props:', {
            rowId,
            activeTab,
            relationMappings,
            tabLabels
        });
        
        // Check if relationMappings is properly configured
        if (!relationMappings || Object.keys(relationMappings).length === 0) {
            console.error('relationMappings is empty or not provided properly');
        } else {
            console.log('Using relationMappings:', relationMappings);
        }
    }, [rowId, activeTab, relationMappings, tabLabels]);
    
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
                const relation = relationMappings[activeTab];
                if (!relation) {
                    console.error(`No relation configuration found for tab ${activeTab}`, relationMappings);
                    setIsLoading(false);
                    setDetailRows([]);
                    setDetailTotalCount(0);
                    return;
                }
                
                // Check if the endpoint is properly defined
                if (!relation.endpoint) {
                    console.error(`No endpoint defined for tab ${activeTab}`, relation);
                    setIsLoading(false);
                    setDetailRows([]);
                    setDetailTotalCount(0);
                    return;
                }
                
                const endpoint = `${apiBaseUrl}/${relation.endpoint}`;
                
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
    }, [rowId, activeTab, detailPaginationModel.page, detailPaginationModel.pageSize, detailSortModel, apiBaseUrl, relationMappings]);
    
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
        setActiveTab(newValue);
        
        if (onTabChange) {
            onTabChange(newValue, rowId);
        }
        
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
                {tabLabels.map((label, index) => (
                    <Tab key={index} label={label} />
                ))}
            </Tabs>

            {tabLabels.map((label, index) => (
                <TabPanel key={index} value={activeTab} index={index}>
                    <DataGrid
                        rows={detailRows}
                        columns={columnsConfig[index] || []}
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
            ))}
        </Box>
    );
};

export default DetailPanel; 