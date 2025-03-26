# Complete Finance Tracker DSL Specification

## 1. Core Language Syntax

### Root Definition
```languim
(finance-tracker
  (version "1.0")
  (markets [us, uk, eu, asia])
  (base-journey
    (pages dashboard expense-entry expense-analysis)
    (validation expense-validation)
    (error-handling generic-errors)))
```

## 2. Full Page Definitions

### Dashboard Page
```languim
(page dashboard
  (layout
    (header 
      (title "Financial Overview")
      (slot savings-goal-banner (conditional)))
    
    (main
      (component monthly-summary
        (data-source budgets-api)
        (refresh-interval 24h)
        (transformers [
          (λ (data) (filter-current-month data))
          (λ (data) (calculate-percentages data))
        ]))
      
      (component expense-categories
        (visualization pie-chart)
        (data-source expenses-api)
        (filter (current-month))
        (action (view-breakdown (navigate expense-analysis))))
      
      (component recent-expenses
        (limit 5)
        (action (add-expense (navigate expense-entry)))
        (action (view-all (navigate expense-analysis)))))
    
    (footer
      (button add-expense (navigate expense-entry))
      (button view-reports (navigate expense-analysis)))))
```

### Expense Entry Page
```languim
(page expense-entry
  (form
    (field amount
      (type currency-input)
      (validation
        (required)
        (min 0.01)
        (market-rule decimal-format)))
    
    (field category
      (type category-selector)
      (options [
        (food "Food & Dining")
        (transport "Transportation")
        (housing "Housing & Utilities")
        (entertainment "Entertainment")
        (shopping "Shopping")
        (health "Health & Wellness")
        (other "Other")
      ])
      (validation (required)))
    
    (field date
      (type date-picker)
      (default (today))
      (validation
        (required)
        (date-range (past-year))))
      
    (field description
      (type text)
      (validation
        (max-length 100)
        (market-rule special-chars)))
    
    (field payment-method
      (type dropdown)
      (options (data-source payment-methods-api))
      (validation (required)))
  
  (actions
    (primary save 
      (validate-then
        (handler save-expense)
        (on-success (navigate dashboard))))
    (secondary cancel (navigate dashboard)))))
```

### Expense Analysis Page
```languim
(page expense-analysis
  (layout
    (header 
      (title "Expense Analysis")
      (filters
        (date-range
          (type period-selector)
          (options [week, month, quarter, year, custom])
          (default month))
        (category
          (type multi-selector)
          (options (data-source categories-api))
          (default all))))
          
    (main
      (component trend-chart
        (type line-chart)
        (data-source 
          (transform 
            (λ (filter-params)
              (pipe
                (get-expenses filter-params)
                (group-by (λ (expense) (date-format expense.date "YYYY-MM")))
                (map-values (λ (group) (sum (map (λ (expense) expense.amount) group))))))))
        (refresh-on-filter-change))
      
      (component category-breakdown
        (type stacked-bar-chart)
        (data-source 
          (transform 
            (λ (filter-params)
              (pipe 
                (get-expenses filter-params)
                (group-by (λ (expense) expense.category))
                (map-values (λ (group) (sum (map (λ (expense) expense.amount) group)))))))))
      
      (component expense-list
        (type data-table)
        (columns [date, description, category, amount])
        (sorting [date-desc])
        (pagination (page-size 20))
        (actions
          (edit (navigate expense-entry))
          (delete (confirm-dialog "Delete this expense?")))))
    
    (footer
      (button export-data (handler export-to-csv))
      (button add-expense (navigate expense-entry)))))
```

## 3. Business Logic Components

### Budget Rules
```scheme
(define-budget-rules
  (rule overspending-alert
    (condition (λ (category spending budget)
      (> spending (* budget 0.9))))
    (action
      (notification
        (title "Budget Alert")
        (content "You've spent 90% of your {{category}} budget")
        (action (view-budget (navigate budget-page))))))
  
  (rule savings-goal
    (condition (λ (saved goal)
      (>= saved (* goal 0.5))))
    (component
      (banner
        (title "Halfway There!")
        (content "You've reached 50% of your savings goal")
        (style success)))))
```

### Market Validation
```languim
(validation-rules
  (us
    (decimal-format
      (pattern "^\\d+(\\.\\d{1,2})?$")
      (error "Use format: 123.45"))
    (date-format "MM/DD/YYYY"))
  
  (eu
    (decimal-format
      (pattern "^\\d+,\\d{1,2}$")
      (error "Use format: 123,45")
      (transform (replace "," ".")))
    (date-format "DD.MM.YYYY"))
  
  (uk
    (decimal-format
      (pattern "^\\d+(\\.\\d{1,2})?$")
      (error "Use format: 123.45"))
    (date-format "DD/MM/YYYY"))
  
  (asia
    (decimal-format
      (pattern "^\\d+(\\.\\d{1,2})?$")
      (error "Use format: 123.45"))
    (date-format "YYYY/MM/DD")))
```

## 4. Error Handling System

### API Errors
```languim
(error-handling
  (api-errors
    (401 (action (show-login-modal)))
    (403 (action (navigate permission-denied)))
    (404 (action (show-message "Data not found")))
    (500 (action (retry-strategy
                   (attempts 3)
                   (backoff exponential 1000)
                   (fallback cached-data)))))
  
  (network-errors
    (offline 
      (component offline-banner
        (message "You're offline. Changes will sync when connection is restored")
        (storage local-storage)))
    (timeout 
      (component retry-button
        (message "Request timed out")
        (retry-count 3)))))
```

## 5. Composition System

### User Preference Variants
```languim
(variant dark-theme
  (extends base-journey)
  (overrides
    (theme
      (colors
        (background "#121212")
        (text "#FFFFFF")
        (primary "#BB86FC")
        (secondary "#03DAC6")
        (error "#CF6679")))
    
    (components
      (chart-palette [
        "#BB86FC", "#03DAC6", "#CF6679", 
        "#FFAB91", "#80DEEA", "#B39DDB"
      ]))))
```

### Market Variant
```languim
(variant eu-market
  (extends base-journey)
  (overrides
    (validation (use eu-rules))
    (currency-symbol "€")
    (currency-position before)
    (date-format "DD.MM.YYYY")
    (components
      (category-selector
        (add-option vat-tracker)))))
```

## 6. State Machine Definition

```languim
(state-machine
  (states
    (dashboard
      (on add-expense (transition expense-entry))
      (on view-reports (transition expense-analysis)))
    
    (expense-entry
      (on save 
        (validate-then 
          (call-api
            (on-success (transition dashboard))
            (on-failure (show-errors)))))
      (on cancel (transition dashboard)))
    
    (expense-analysis
      (on filter-change (update-data))
      (on export (download-csv))
      (on add-expense (transition expense-entry)))))
```

## 7. Generated Artifacts

### React Component Structure
```javascript
// Dashboard.js
function Dashboard() {
  const { budgetRules, marketConfig } = useContext(AppContext);
  const { data, loading, error } = useExpenseData();
  
  // Apply functional transformations
  const summarizedData = useMemo(() => {
    if (!data) return null;
    return pipe(
      filterCurrentMonth,
      calculatePercentages
    )(data);
  }, [data]);
  
  return (
    <PageLayout>
      {budgetRules.savingsGoalMet && <SavingsGoalBanner />}
      <MonthlySummary data={summarizedData} />
      <ExpenseCategories />
      <RecentExpenses />
    </PageLayout>
  );
}
```

### Validation Hook
```typescript
// useValidation.ts
function useValidation(rules: ValidationRules, marketRules: MarketRules) {
  return (values: Record<string, any>) => {
    // Combine base rules with market-specific rules
    const combinedRules = mergeDeep(rules, marketRules);
    
    // Apply validation functionally
    return pipe(
      Object.entries,
      map(([field, value]) => validateField(field, value, combinedRules)),
      filter(Boolean)
    )(values);
  };
}

// Pure validation function
function validateField(field: string, value: any, rules: ValidationRules) {
  const fieldRules = rules[field];
  if (!fieldRules) return null;
  
  // Apply each rule in sequence
  for (const rule of fieldRules) {
    const result = rule.validate(value);
    if (!result.valid) {
      return { field, error: result.error };
    }
  }
  
  return null;
}
```

## 8. Full Example Composition

```languim
(deployable-tracker
  (base base-journey)
  (variants
    (compose dark-theme (when (user.preference "dark")))
    (compose eu-market (when (user.country in [fr, de, it, es])))
    (experiment analytics-dashboard 
      (page expense-analysis (use enhanced-charts))
      (distribution 50%))))
```

## Implementation Notes

### File Structure
```
/journeys
  /finance-tracker
    base.journey.fintrack
    variants/
      dark-theme.fintrack
      eu-market.fintrack
  /validation
    rules.fintrack
```

### Code Generation
```bash
fintrack-compiler compile finance-tracker.fintrack \
  --target react \
  --output src/journeys/finance-tracker
```

### Runtime Requirements
- Market configuration loader
- Budget rule evaluator
- State machine interpreter
- Functional data transformation pipeline 