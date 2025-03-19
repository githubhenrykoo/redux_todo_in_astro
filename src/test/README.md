# Testing the Card System

This directory contains tests for the MCard system, including unit tests for individual components and integration tests for the complete system.

## Test Files

- `mcard.test.js` - Unit tests for the MCard class
- `g_time.test.js` - Unit tests for the GTime class
- `card-collection.test.js` - Unit tests for the CardCollection class
- `sqlite_engine.test.js` - Unit tests for the SQLiteEngine class
- `integration.test.js` - Integration tests for the entire card system

## Running Tests

### Running Individual Tests

To run an individual test file, use the following command:

```bash
npm test <test-file-name>
```

For example:

```bash
npm test integration.test.js
```

### Running All Tests

To run all tests, use the following command:

```bash
npm run test:all
```

This will execute the `run_all_tests.sh` script, which runs all the test files in sequence.

## Test Database

The integration tests use a fixed database file (`test_cards.db`) located in this directory. This ensures that all tests use the same database configuration. The database is reset before each test to ensure a clean state.

## Test Coverage

To generate a test coverage report, use the following command:

```bash
npm test -- --coverage
```

This will create a coverage report in the `coverage` directory.
