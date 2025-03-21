# Finance App DSL

A domain-specific language (DSL) for creating financial applications.

## Overview

This project provides a DSL built with Langium that allows you to describe financial applications in a declarative way. The DSL supports defining:

- Models with properties and validations
- Screens and layouts
- Navigation
- API definitions
- Mock data

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/finance-app-dsl.git
cd finance-app-dsl

# Install dependencies
npm install

# Build the project
npm run build

# Link the CLI for local use
npm link
```

## Using the DSL

Create a `.finapp` file like the example below:

```
app MyApp {
    name: "My App"
    id: "com.example.myapp"
    version: "1.0"
    platforms: [ios, android]
}

model User {
    id: string required
    name: string required
}

screen Home {
    title: "Home"
    initial
    layout: {
        type: stack
        components: [
            {
                type: header
                title: "Welcome"
            }
        ]
    }
}

navigation: {
    type: tab
    items: [
        {
            title: "Home"
            icon: "home"
            screen: Home
        }
    ]
}

api: {
    baseUrl: "https://api.example.com"
    endpoints: [
        {
            id: getUsers
            path: "/users"
            method: GET
            response: User[]
        }
    ]
}
```

## CLI Usage

The package includes a CLI tool that can process `.finapp` files:

```bash
# Generate code from a .finapp file
finance-app-cli generate path/to/your/file.finapp
```

This will create JavaScript code in the `generated` directory based on your DSL file.

## Development

### Building the Project

```bash
npm run build
```

### Generating the Language Services

```bash
npm run langium:generate
```

### Running Tests

```bash
npm test
```

## License

MIT 