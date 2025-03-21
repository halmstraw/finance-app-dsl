// Test script for the finance-app.finapp sample

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate the app.js file
console.log('Generating app.js from finance-app.finapp...');
try {
  await execAsync('cd .. && node bin/cli.js examples/finance-app.finapp');
  console.log('Generated app.js successfully');
  
  // Now run the tests
  console.log('\nRunning validation tests for finance models...');
  
  // Create a temporary test script
  const testScript = `
    // Load the generated code
    ${fs.readFileSync(path.join(__dirname, '../generated/app.js'), 'utf8')}
    
    // ---------- Test Account validation ----------
    console.log('\\n=== Testing Account validation ===');
    
    // Valid account
    const validAccount = new Account({
      id: 'acc123',
      name: 'Checking Account',
      balance: 1500.75,
      type: 'checking',
      currency: 'USD',
      isActive: true,
      lastUpdated: new Date()
    });
    
    const validAccountErrors = validAccount.validate();
    console.log('Valid Account errors:', validAccountErrors);
    
    // Invalid account
    const invalidAccount = new Account({
      // Missing ID
      name: 'Invalid Account',
      balance: 'one thousand', // Invalid type
      type: 'bitcoin', // Invalid enum
      isActive: 'yes', // Invalid type
      lastUpdated: 'yesterday' // Invalid date
    });
    
    const invalidAccountErrors = invalidAccount.validate();
    console.log('Invalid Account errors:', invalidAccountErrors);
    
    // ---------- Test Transaction validation ----------
    console.log('\\n=== Testing Transaction validation ===');
    
    // Valid transaction
    const validTransaction = new Transaction({
      id: 'tx456',
      accountId: 'acc123',
      amount: -45.99,
      description: 'Grocery shopping',
      date: new Date(),
      category: 'Food',
      isIncome: false,
      notes: 'Weekly groceries',
      tags: 'food,groceries,weekly'
    });
    
    const validTransactionErrors = validTransaction.validate();
    console.log('Valid Transaction errors:', validTransactionErrors);
    
    // Invalid transaction
    const invalidTransaction = new Transaction({
      id: 'tx789',
      // Missing accountId
      amount: 'fifty', // Invalid type
      // Missing description
      // Missing date
      category: true, // Invalid type
      isIncome: 'no' // Invalid type
    });
    
    const invalidTransactionErrors = invalidTransaction.validate();
    console.log('Invalid Transaction errors:', invalidTransactionErrors);
    
    // ---------- Test Category validation ----------
    console.log('\\n=== Testing Category validation ===');
    
    // Valid category
    const validCategory = new Category({
      id: 'cat001',
      name: 'Groceries',
      color: '#FF5733',
      icon: 'shopping_cart',
      isSystem: false
    });
    
    const validCategoryErrors = validCategory.validate();
    console.log('Valid Category errors:', validCategoryErrors);
    
    // Invalid category
    const invalidCategory = new Category({
      // Missing id
      // Missing name
      color: 123, // Invalid type
      icon: ['icon1', 'icon2'], // Invalid type
      isSystem: 'true' // Invalid type
    });
    
    const invalidCategoryErrors = invalidCategory.validate();
    console.log('Invalid Category errors:', invalidCategoryErrors);
    
    // Test using models together
    console.log('\\n=== Testing model relationships ===');
    
    // Create a category, account, and transaction that reference each other
    const groceryCategory = new Category({
      id: 'grocery',
      name: 'Groceries'
    });
    
    const checkingAccount = new Account({
      id: 'checking1',
      name: 'Main Checking',
      balance: 2540.33,
      type: 'checking'
    });
    
    const groceryTransaction = new Transaction({
      id: 'tx-grocery-1',
      accountId: checkingAccount.id,
      amount: -78.65,
      description: 'Weekly grocery run',
      date: new Date(),
      category: groceryCategory.id
    });
    
    console.log('Transaction refers to valid account ID:', groceryTransaction.accountId === checkingAccount.id);
    console.log('Transaction refers to valid category ID:', groceryTransaction.category === groceryCategory.id);
  `;
  
  // Write to a temp file
  const tempFile = path.join(__dirname, 'temp-finance-test.cjs');
  fs.writeFileSync(tempFile, testScript);
  
  // Run the test
  const { stdout } = await execAsync(`node ${tempFile}`);
  console.log(stdout);
  
  // Clean up
  fs.unlinkSync(tempFile);
  
} catch (error) {
  console.error('Error:', error.message);
  if (error.stdout) console.log(error.stdout);
  if (error.stderr) console.error(error.stderr);
} 