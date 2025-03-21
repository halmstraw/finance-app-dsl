// Generated code for MyApp
// Version: 1.0
// App ID: com.example.myapp
// Platforms: ios, android

// Models
// Validation utility functions
const validators = {
    isString(value) {
        return typeof value === 'string';
    },
    isNumber(value) {
        return typeof value === 'number' && !isNaN(value);
    },
    isBoolean(value) {
        return typeof value === 'boolean';
    },
    isDate(value) {
        return value instanceof Date && !isNaN(value.getTime());
    },
    isEmail(value) {
        return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    },
    isPhoneNumber(value) {
        return typeof value === 'string' && /^\+?[\d\s-()]{7,}$/.test(value);
    },
    isDecimal(value) {
        return (typeof value === 'number' && !isNaN(value)) || 
               (typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value));
    },
    isInEnum(value, enumValues) {
        return enumValues.includes(value);
    }
};
class User {
    constructor(data = {}) {
        this.id = data.id !== undefined ? data.id : undefined;
        this.name = data.name !== undefined ? data.name : undefined;
    }

    validate() {
        const errors = [];
        if (this.id === undefined || this.id === null) {
            errors.push("id is required");
        }
        if (this.id !== undefined && this.id !== null) {
            if (!validators.isString(this.id)) {
                errors.push("id must be a string");
            }
        }
        if (this.name === undefined || this.name === null) {
            errors.push("name is required");
        }
        if (this.name !== undefined && this.name !== null) {
            if (!validators.isString(this.name)) {
                errors.push("name must be a string");
            }
        }
        return errors;
    }
}


// Screens
function renderHome(params = {}) {
    console.log("Rendering screen: Home");
    // Layout type: stack
    return { screen: "Home" };
}


// API
const API_BASE_URL = "https://api.example.com";

// Endpoint: getUsers
async function apigetUsers(params = {}) {
    const url = `${API_BASE_URL}/users`;
    const options = { method: "[object Object]" };
    try {
        const response = await fetch(url, options);
        return await response.json();
    } catch (error) {
        console.error("API error:", error);
        throw error;
    }
}

// App initialization
console.log("Initializing MyApp");
