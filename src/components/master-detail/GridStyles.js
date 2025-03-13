import { alpha } from "@mui/material/styles";

// Shared grid styles
export const GRID_STYLES = {
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