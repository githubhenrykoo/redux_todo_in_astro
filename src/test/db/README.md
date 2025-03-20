# Test Database Directory

This directory contains SQLite database files used for testing purposes. 

These databases are automatically created and managed by the test suite. They are used to verify the integration between Redux and SQLite persistence layer.

Notes:
- Database files in this directory should not be committed to version control
- Test databases are automatically created and populated during test runs
- Each test file may create its own database file with a unique name
