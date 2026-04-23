CREATE TABLE IF NOT EXISTS health_logs (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  status VARCHAR(50) NOT NULL, -- e.g., 'feeling_well', 'need_help'
  heart_rate INT,
  blood_pressure VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
