grammar FinanceAppDSL

// Entry point for the whole application definition
entry App:
    'app' name=ID '{'
        'name' ':' displayName=STRING
        'id' ':' appId=STRING
        'version' ':' version=STRING
        ('platforms' ':' '[' platforms+=Platform (',' platforms+=Platform)* ']')?
        ('theme' ':' theme=Theme)?
    '}'
    
    // Main sections of the app
    (models+=Model)*
    (screens+=Screen)*
    navigation=Navigation
    api=API
    (mockData=MockData)?
;

// Platform types
Platform:
    name=('ios' | 'android' | 'web')
;

// Theme definition
Theme:
    '{'
        'primaryColor' ':' primaryColor=STRING
        'secondaryColor' ':' secondaryColor=STRING
        'backgroundColor' ':' backgroundColor=STRING
        'textColor' ':' textColor=STRING
    '}'
;

// Model definition
Model:
    'model' name=ID '{'
        (properties+=Property)*
    '}'
;

// Property definition within a model
Property:
    name=ID ':' type=DataType (features+=PropertyFeature)*
;

// Features that can be applied to properties
PropertyFeature:
    RequiredFeature | DefaultValueFeature | EnumValuesFeature
;

// Required marker for properties
RequiredFeature:
    {infer RequiredFeature} 'required'
;

// Default value for properties
DefaultValueFeature:
    'default' ':' value=Value
;

// Enum values for string properties
EnumValuesFeature:
    'enum' ':' '[' values+=EnumValue (',' values+=EnumValue)* ']'
;

// Basic data types
DataType:
    name=('string' | 'number' | 'decimal' | 'boolean' | 'date' | 'array' | 'object')
    (isArray?='[]')?
;

// Enum value (can be either a string or identifier)
EnumValue:
    value=(ID | STRING)
;

// Value definition (different types of values)
Value:
    StringValue | NumberValue | BooleanValue | NullValue
;

// String value
StringValue:
    value=STRING
;

// Number value
NumberValue:
    value=NUMBER
;

// Boolean value
BooleanValue:
    value=('true' | 'false')
;

// Null value
NullValue:
    {infer NullValue} 'null'
;

// Screen definition
Screen:
    'screen' name=ID '{'
        'title' ':' title=STRING
        (isInitial?='initial')?
        (params=ScreenParams)?
        layout=Layout
    '}'
;

// Screen parameters
ScreenParams:
    'params' ':' '{'
        (parameters+=Parameter)*
    '}'
;

// Parameter definition
Parameter:
    name=ID ':' type=DataType (isRequired?='required')?
;

// Layout definition
Layout:
    'layout' ':' '{'
        'type' ':' type=LayoutType
        (components=ComponentList)?
        (fields=FormFieldList)?
        (actions=ActionList)?
        (submitButton=SubmitButton)?
        (cancelButton=CancelButton)?
    '}'
;

// Layout types
LayoutType:
    type=('stack' | 'form' | 'scroll' | 'tabs')
;

// List of components
ComponentList:
    'components' ':' '[' 
        (items+=Component) (',' items+=Component)*
    ']'
;

// Component definition
Component:
    '{'
        'type' ':' type=ComponentType
        (properties+=ComponentProperty)*
    '}'
;

// Component types
ComponentType:
    type=('header' | 'text' | 'button' | 'list' | 'accountSummaryCard' | 'accountCard' | 
          'balanceCard' | 'tabs' | 'chart' | 'divider')
;

// Component property
ComponentProperty:
    StringProperty | DataProperty | ActionProperty | PropertyMap | ItemsProperty
;

// String property
StringProperty:
    name=ID ':' value=STRING
;

// Data source property
DataProperty:
    'data' ':' value=DataPath
;

// Data path (can be simple ID or dot-path)
DataPath:
    {infer FQN} ID ('.' ID)*
;

// Fully qualified name (for data paths)
FQN returns string:
    ID ('.' ID)*
;

// Action property
ActionProperty:
    'actions' ':' '{' actions+=Action (',' actions+=Action)* '}'
;

// Property map
PropertyMap:
    'properties' ':' '{' properties+=StringProperty (',' properties+=StringProperty)* '}'
;

// Items property
ItemsProperty:
    'items' ':' '[' items+=Component (',' items+=Component)* ']'
;

// Form fields list
FormFieldList:
    'fields' ':' '[' 
        (fields+=FormField) (',' fields+=FormField)*
    ']'
;

// Form field
FormField:
    '{'
        'type' ':' type=FormFieldType
        'name' ':' name=ID
        'label' ':' label=STRING
        (isRequired?='required')?
        (properties=PropertyMap)?
        (options=FieldOptions)?
    '}'
;

// Form field types
FormFieldType:
    type=('text' | 'number' | 'toggle' | 'select' | 'datePicker')
;

// Field options
FieldOptions:
    'options' ':' '{' 
        (dataSource=DataProperty)?
        (labelField=StringProperty)?
        (valueField=StringProperty)?
    '}'
;

// Submit button
SubmitButton:
    'submitButton' ':' label=STRING
;

// Cancel button
CancelButton:
    'cancelButton' ':' label=STRING
;

// Action list
ActionList:
    'actions' ':' '{' actions+=Action (',' actions+=Action)* '}'
;

// Action definition
Action:
    name=ID ':' (navigationAction=NavigationAction | apiAction=APIAction)
;

// Navigation action
NavigationAction:
    '{'
        'navigate' ':' target=ID
        (params=ActionParams)?
    '}'
;

// API action
APIAction:
    '{'
        'api' ':' endpoint=ID
        (successAction=NavigationAction)?
    '}'
;

// Action parameters
ActionParams:
    'params' ':' '{' parameters+=StringProperty (',' parameters+=StringProperty)* '}'
;

// Navigation definition
Navigation:
    'navigation' ':' '{'
        'type' ':' type=NavigationType
        'items' ':' '[' items+=NavItem (',' items+=NavItem)* ']'
    '}'
;

// Navigation types
NavigationType:
    type=('tab' | 'drawer' | 'stack')
;

// Navigation item
NavItem:
    '{'
        'title' ':' title=STRING
        (icon=IconProperty)?
        'screen' ':' screen=[Screen:ID]
    '}'
;

// Icon property
IconProperty:
    'icon' ':' icon=STRING
;

// API definition
API:
    'api' ':' '{'
        'baseUrl' ':' baseUrl=STRING
        (isMock?='mock')?
        'endpoints' ':' '[' endpoints+=Endpoint (',' endpoints+=Endpoint)* ']'
    '}'
;

// API endpoint
Endpoint:
    '{'
        'id' ':' id=ID
        'path' ':' path=STRING
        'method' ':' method=HTTPMethod
        (params=APIParams)?
        (body=APIBody)?
        'response' ':' response=ResponseTypeRef
    '}'
;

// HTTP methods
HTTPMethod:
    method=('GET' | 'POST' | 'PUT' | 'DELETE')
;

// API parameters
APIParams:
    'params' ':' '[' parameters+=APIParameter (',' parameters+=APIParameter)* ']'
;

// API parameter
APIParameter:
    '{'
        'name' ':' name=ID
        'type' ':' type=DataType
        (isRequired?='required')?
    '}'
;

// API body
APIBody:
    'body' ':' modelRef=[Model:ID]
;

// Response type
ResponseTypeRef:
    type=ID (isArray?='[]')?
;

// Mock data
MockData:
    'mockData' ':' '{'
        (sections+=MockDataSection)*
    '}'
;

// Mock data section
MockDataSection:
    name=ID ':' '[' items+=MockDataItem (',' items+=MockDataItem)* ']'
;

// Mock data item
MockDataItem:
    '{'
        (properties+=MockProperty)*
    '}'
;

// Mock property
MockProperty:
    name=ID ':' value=Value
;

// These are the terminal rules required by Langium
terminal ID: /[_a-zA-Z][\w_]*/;
terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;
terminal NUMBER: /-?[0-9]+(\.[0-9]+)?/;
terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
terminal SL_COMMENT: /\/\/[^\n\r]*/;
terminal WS: /\s+/;
terminal ANY_OTHER: /./;