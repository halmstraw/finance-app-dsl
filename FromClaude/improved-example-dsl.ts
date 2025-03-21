// finance-app.finapp - Example DSL file for a personal finance app

app FinanceTracker {
    name: "Personal Finance Tracker"
    id: "com.example.financetracker"
    version: "1.0.0"
    platforms: [ios, android, web]
    theme: {
        primaryColor: "#007AFF"
        secondaryColor: "#5AC8FA"
        backgroundColor: "#F2F2F7"
        textColor: "#000000"
    }
}

// Data models
model Account {
    id: string required
    name: string required
    balance: decimal required
    type: string required enum: [checking, savings, credit, investment]
    currency: string default: "USD"
    isActive: boolean default: true
    lastUpdated: date
}

model Transaction {
    id: string required
    accountId: string required
    amount: decimal required
    description: string required
    date: date required
    category: string
    isIncome: boolean default: false
    notes: string
    tags: string[]
}

model Category {
    id: string required
    name: string required
    color: string
    icon: string
    isSystem: boolean default: false
}

// Screens
screen AccountSummary {
    title: "Accounts"
    initial
    
    layout: {
        type: stack
        components: [
            {
                type: header
                title: "Your Accounts"
            },
            {
                type: accountSummaryCard
                data: totalBalance
                properties: {
                    title: "Total Balance",
                    showCurrency: true
                }
            },
            {
                type: divider
            },
            {
                type: list
                data: accounts
                properties: {
                    itemType: "accountCard",
                    showBalance: true
                }
                actions: {
                    onTap: {
                        navigate: AccountDetail
                        params: {
                            accountId: "item.id"
                        }
                    }
                }
            },
            {
                type: button
                text: "Add Account"
                properties: {
                    style: "primary",
                    fullWidth: true
                }
                actions: {
                    onTap: {
                        navigate: AddAccount
                    }
                }
            }
        ]
    }
}

screen AccountDetail {
    title: "Account Details"
    params: {
        accountId: string required
    }
    
    layout: {
        type: stack
        components: [
            {
                type: header
                title: "{{account.name}}"
                subtitle: "{{account.type}}"
            },
            {
                type: balanceCard
                data: account.balance
                properties: {
                    showCurrency: true,
                    showChange: true
                }
            },
            {
                type: tabs
                items: [
                    {
                        type: text
                        title: "Transactions"
                        properties: {
                            data: transactions,
                            itemType: "transactionItem",
                            showDate: true,
                            showCategory: true
                        }
                        actions: {
                            onTap: {
                                navigate: TransactionDetail
                                params: {
                                    transactionId: "item.id"
                                }
                            }
                        }
                    },
                    {
                        type: chart
                        title: "Statistics"
                        properties: {
                            chartType: "pie",
                            data: "transactionsByCategory"
                        }
                    }
                ]
            },
            {
                type: button
                text: "Add Transaction"
                properties: {
                    style: "primary"
                }
                actions: {
                    onTap: {
                        navigate: AddTransaction
                        params: {
                            accountId: "account.id"
                        }
                    }
                }
            }
        ]
    }
}

screen AddTransaction {
    title: "Add Transaction"
    params: {
        accountId: string required
    }
    
    layout: {
        type: form
        submitButton: "Save"
        cancelButton: "Cancel"
        actions: {
            onSubmit: {
                api: createTransaction
                navigate: AccountDetail
                params: {
                    accountId: "params.accountId"
                }
            },
            onCancel: {
                navigate: AccountDetail
                params: {
                    accountId: "params.accountId"
                }
            }
        }
        fields: [
            {
                type: text
                name: description
                label: "Description"
                required
            },
            {
                type: number
                name: amount
                label: "Amount"
                required
                properties: {
                    decimalPlaces: 2,
                    currency: true
                }
            },
            {
                type: toggle
                name: isIncome
                label: "Is Income"
            },
            {
                type: select
                name: category
                label: "Category"
                options: {
                    data: categories
                    labelField: "name"
                    valueField: "id"
                }
            },
            {
                type: datePicker
                name: date
                label: "Date"
            }
        ]
    }
}

// App navigation
navigation: {
    type: tab
    items: [
        {
            title: "Accounts"
            icon: "wallet"
            screen: AccountSummary
        },
        {
            title: "Transactions"
            icon: "list"
            screen: AccountDetail
        },
        {
            title: "Budget"
            icon: "chart"
            screen: AccountSummary  // Placeholder until we have a Budget screen
        },
        {
            title: "Settings"
            icon: "gear"
            screen: AccountSummary  // Placeholder until we have a Settings screen
        }
    ]
}

// API configuration
api: {
    baseUrl: "https://api.example.com/v1"
    mock
    endpoints: [
        {
            id: getAccounts
            path: "/accounts"
            method: GET
            response: Account[]
        },
        {
            id: getAccount
            path: "/accounts/{accountId}"
            method: GET
            params: [
                {
                    name: accountId
                    type: string
                    required
                }
            ]
            response: Account
        },
        {
            id: getTransactions
            path: "/accounts/{accountId}/transactions"
            method: GET
            params: [
                {
                    name: accountId
                    type: string
                    required
                },
                {
                    name: startDate
                    type: date
                },
                {
                    name: endDate
                    type: date
                }
            ]
            response: Transaction[]
        },
        {
            id: createTransaction
            path: "/transactions"
            method: POST
            body: Transaction
            response: Transaction
        }
    ]
}

// Mock data for development
mockData: {
    accounts: [
        {
            id: "acc1"
            name: "Main Checking"
            balance: 2540.50
            type: "checking"
            currency: "USD"
            isActive: true
            lastUpdated: "2025-03-20"
        },
        {
            id: "acc2"
            name: "Savings"
            balance: 12750.75
            type: "savings"
            currency: "USD"
            isActive: true
            lastUpdated: "2025-03-19"
        },
        {
            id: "acc3"
            name: "Credit Card"
            balance: -450.25
            type: "credit"
            currency: "USD"
            isActive: true
            lastUpdated: "2025-03-18"
        }
    ],
    
    transactions: [
        {
            id: "t1"
            accountId: "acc1"
            amount: -45.50
            description: "Grocery Store"
            date: "2025-03-18"
            category: "Food"
            isIncome: false
        },
        {
            id: "t2"
            accountId: "acc1"
            amount: 1250.00
            description: "Salary"
            date: "2025-03-15"
            category: "Income"
            isIncome: true
        },
        {
            id: "t3"
            accountId: "acc1"
            amount: -75.00
            description: "Electric Bill"
            date: "2025-03-10"
            category: "Utilities"
            isIncome: false
        }
    ],
    
    categories: [
        {
            id: "cat1"
            name: "Food"
            color: "#FF9500"
            icon: "restaurant"
        },
        {
            id: "cat2"
            name: "Transport"
            color: "#5AC8FA"
            icon: "car"
        },
        {
            id: "cat3"
            name: "Utilities"
            color: "#FFCC00"
            icon: "bolt"
        },
        {
            id: "cat4"
            name: "Entertainment"
            color: "#FF2D55"
            icon: "film"
        },
        {
            id: "cat5"
            name: "Income"
            color: "#4CD964"
            icon: "wallet"
        }
    ]
}
