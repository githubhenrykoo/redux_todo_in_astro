CREATE TABLE test_table (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  value INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO test_table (name, value) VALUES 
('test1', 100),
('test2', 200),
('test3', 300);

SELECT * FROM test_table WHERE value > 150;