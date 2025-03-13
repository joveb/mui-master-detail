// Mock data for the master grid
export const masterRows = [
    { id: 1, firstName: "John", lastName: "Doe", age: 35, city: "New York" },
    {
        id: 2,
        firstName: "Jane",
        lastName: "Smith",
        age: 28,
        city: "Los Angeles",
    },
    {
        id: 3,
        firstName: "Robert",
        lastName: "Johnson",
        age: 42,
        city: "Chicago",
    },
    {
        id: 4,
        firstName: "Emily",
        lastName: "Williams",
        age: 31,
        city: "Houston",
    },
];

// Mock detail data - in a real app, you would fetch this data when expanding a row
export const detailData = {
    1: {
        orders: [
            { id: 101, product: "Laptop", date: "2025-01-15", amount: 1200 },
            { id: 102, product: "Monitor", date: "2025-02-20", amount: 350 },
        ],
        activities: [
            {
                id: 201,
                type: "Call",
                description: "Follow-up call about services",
                date: "2025-02-10",
            },
            {
                id: 202,
                type: "Email",
                description: "Sent product catalog",
                date: "2025-02-15",
            },
        ],
        notes: [
            {
                id: 301,
                title: "Meeting notes",
                content: "Discussed upcoming project needs",
                createdBy: "Sales Rep",
            },
        ],
    },
    2: {
        orders: [
            { id: 103, product: "Smartphone", date: "2025-01-05", amount: 899 },
        ],
        activities: [
            {
                id: 203,
                type: "Meeting",
                description: "Initial consultation",
                date: "2024-12-20",
            },
        ],
        notes: [
            {
                id: 302,
                title: "Follow up",
                content: "Send proposal by end of week",
                createdBy: "Account Manager",
            },
            {
                id: 303,
                title: "Special requirements",
                content: "Needs custom configuration",
                createdBy: "Technical Advisor",
            },
        ],
    },
    3: {
        orders: [
            {
                id: 104,
                product: "Office Chairs",
                date: "2025-02-01",
                amount: 1250,
            },
            { id: 105, product: "Desk", date: "2025-02-01", amount: 450 },
            {
                id: 106,
                product: "Filing Cabinet",
                date: "2025-02-15",
                amount: 380,
            },
        ],
        activities: [
            {
                id: 204,
                type: "Site Visit",
                description: "Office space assessment",
                date: "2025-01-15",
            },
            {
                id: 205,
                type: "Call",
                description: "Finalized order details",
                date: "2025-01-25",
            },
        ],
        notes: [
            {
                id: 304,
                title: "Office renovation",
                content: "Complete redesign of workspace",
                createdBy: "Project Manager",
            },
        ],
    },
    4: {
        orders: [
            {
                id: 107,
                product: "Software License",
                date: "2025-03-01",
                amount: 299,
            },
        ],
        activities: [
            {
                id: 206,
                type: "Email",
                description: "License key delivery",
                date: "2025-03-01",
            },
            {
                id: 207,
                type: "Support",
                description: "Installation assistance",
                date: "2025-03-02",
            },
        ],
        notes: [
            {
                id: 305,
                title: "License renewal",
                content: "Set reminder for next year",
                createdBy: "Account Manager",
            },
        ],
    },
};
