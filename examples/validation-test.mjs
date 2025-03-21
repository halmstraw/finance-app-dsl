// Simple validation test for the generated app.js

// First, run generator
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// First, ensure we have the app.js generated
console.log('Generating app.js...');
try {
  await execAsync('cd .. && node bin/cli.js examples/banking-app.finapp');
  console.log('Generated app.js successfully');
  
  // Now run the tests
  console.log('\nRunning validation tests...');
  
  // Create a temporary test script
  const testScript = `
    // Load the whole app.js content
    ${fs.readFileSync(path.join(__dirname, '../generated/app.js'), 'utf8')}
    
    // ---------- Test User validation ----------
    console.log('\\n=== Testing User validation ===');
    
    // Valid user
    const user1 = new User({
      id: 'user1',
      username: 'johndoe',
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '+1234567890',
      createdAt: new Date(),
      isActive: true
    });
    
    const user1Errors = user1.validate();
    console.log('Valid user errors:', user1Errors);
    
    // Invalid user
    const user2 = new User({
      // Missing required id
      username: 123, // Wrong type
      email: 'not-an-email', // Invalid format
      // Missing firstName
      lastName: 'Smith',
      createdAt: 'yesterday', // Invalid date
      isActive: 'yes' // Wrong type
    });
    
    const user2Errors = user2.validate();
    console.log('Invalid user errors:', user2Errors);
    
    // ---------- Test BankAccount validation ----------
    console.log('\\n=== Testing BankAccount validation ===');
    
    // Valid account
    const account1 = new BankAccount({
      id: 'acc1',
      userId: 'user1',
      accountNumber: 'ACC12345',
      accountType: 'savings', // Valid enum
      balance: 1000.50,
      currency: 'USD',
      openedDate: new Date(),
      isActive: true
    });
    
    const account1Errors = account1.validate();
    console.log('Valid account errors:', account1Errors);
    
    // Invalid account
    const account2 = new BankAccount({
      id: 'acc2',
      // Missing userId
      accountNumber: 'ACC67890',
      accountType: 'crypto', // Invalid enum
      balance: 'a lot', // Wrong type
      currency: 'USD',
      // Missing openedDate
      isActive: 'active' // Wrong type
    });
    
    const account2Errors = account2.validate();
    console.log('Invalid account errors:', account2Errors);
    
    // ---------- Test Transaction validation ----------
    console.log('\\n=== Testing Transaction validation ===');
    
    // Valid transaction
    const tx1 = new Transaction({
      id: 'tx1',
      accountId: 'acc1',
      amount: 500,
      type: 'deposit',
      description: 'Salary payment',
      date: new Date(),
      category: 'income',
      reference: 'REF123'
    });
    
    const tx1Errors = tx1.validate();
    console.log('Valid transaction errors:', tx1Errors);
    
    // Invalid transaction
    const tx2 = new Transaction({
      id: 'tx2',
      // Missing accountId
      amount: 'five hundred', // Wrong type
      type: 'refund', // Invalid enum
      // Missing date
      category: true // Wrong type
    });
    
    const tx2Errors = tx2.validate();
    console.log('Invalid transaction errors:', tx2Errors);
  `;
  
  // Write to a temp file
  const tempFile = path.join(__dirname, 'temp-test.cjs');
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