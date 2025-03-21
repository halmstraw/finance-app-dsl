// Test script for model validation in the generated code
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// First, ensure our app.js is generated
console.log('Generating app code from banking-app.finapp...');
exec('node ../bin/cli.js banking-app.finapp', { cwd: __dirname }, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error generating code: ${error.message}`);
    return;
  }
  
  console.log('Code generation output:', stdout);
  
  // Load the generated code
  console.log('Loading generated code...');
  const generatedAppPath = path.resolve(__dirname, '../generated/app.js');
  
  // Create test environment to run the code
  const testCode = `
    // Import the generated code
    ${fs.readFileSync(generatedAppPath, 'utf8')}
    
    // Test validation on valid User
    console.log('\\n--- Testing valid User ---');
    const validUser = new User({
      id: '123',
      username: 'johndoe',
      email: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '+1-555-123-4567',
      createdAt: new Date(),
      isActive: true
    });
    
    const validUserErrors = validUser.validate();
    console.log('Valid User validation errors:', validUserErrors);
    console.log('Valid User is valid:', validUserErrors.length === 0);
    
    // Test validation on invalid User
    console.log('\\n--- Testing invalid User ---');
    const invalidUser = new User({
      id: '123',
      // Missing required username
      email: 'not-an-email',
      firstName: 'John',
      // Missing required lastName
      phoneNumber: '123', // Invalid phone
      isActive: 'yes' // Wrong type
    });
    
    const invalidUserErrors = invalidUser.validate();
    console.log('Invalid User validation errors:', invalidUserErrors);
    console.log('Invalid User is valid:', invalidUserErrors.length === 0);
    
    // Test validation on valid BankAccount
    console.log('\\n--- Testing valid BankAccount ---');
    const validAccount = new BankAccount({
      id: 'acc123',
      userId: 'user123',
      accountNumber: 'AC1000123',
      accountType: 'savings',
      balance: 1500.50,
      currency: 'USD',
      openedDate: new Date(),
      isActive: true
    });
    
    const validAccountErrors = validAccount.validate();
    console.log('Valid Account validation errors:', validAccountErrors);
    console.log('Valid Account is valid:', validAccountErrors.length === 0);
    
    // Test validation on invalid BankAccount
    console.log('\\n--- Testing invalid BankAccount ---');
    const invalidAccount = new BankAccount({
      id: 'acc123',
      userId: 'user123',
      accountNumber: 'AC1000123',
      accountType: 'premium', // Invalid enum value
      balance: 'lots', // Invalid type
      currency: 'USD',
      // Missing required openedDate
      isActive: true
    });
    
    const invalidAccountErrors = invalidAccount.validate();
    console.log('Invalid Account validation errors:', invalidAccountErrors);
    console.log('Invalid Account is valid:', invalidAccountErrors.length === 0);
    
    // Test validation on valid Transaction
    console.log('\\n--- Testing valid Transaction ---');
    const validTransaction = new Transaction({
      id: 'tx123',
      accountId: 'acc123',
      amount: 500.00,
      type: 'deposit',
      description: 'Salary deposit',
      date: new Date(),
      category: 'income',
      reference: 'REF123'
    });
    
    const validTransactionErrors = validTransaction.validate();
    console.log('Valid Transaction validation errors:', validTransactionErrors);
    console.log('Valid Transaction is valid:', validTransactionErrors.length === 0);
    
    // Test validation on invalid Transaction
    console.log('\\n--- Testing invalid Transaction ---');
    const invalidTransaction = new Transaction({
      id: 'tx123',
      // Missing required accountId
      amount: -500, // Valid negative amount
      type: 'refund', // Invalid enum value
      description: 'Test transaction',
      // Missing required date
      category: true // Wrong type
    });
    
    const invalidTransactionErrors = invalidTransaction.validate();
    console.log('Invalid Transaction validation errors:', invalidTransactionErrors);
    console.log('Invalid Transaction is valid:', invalidTransactionErrors.length === 0);
  `;
  
  // Write test code to a temporary file
  const testFilePath = path.resolve(__dirname, 'temp-validation-test.cjs');
  fs.writeFileSync(testFilePath, testCode);
  
  // Run test code (use .cjs extension for CommonJS)
  console.log('Running validation tests...');
  exec(`node ${testFilePath}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error running tests: ${error.message}`);
      console.error(stderr);
      return;
    }
    
    console.log(stdout);
    
    // Clean up temp file
    fs.unlinkSync(testFilePath);
    console.log('Tests completed and temporary files cleaned up.');
  });
}); 