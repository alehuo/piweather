CREATE TABLE data (
  id SERIAL PRIMARY KEY,
  unixtimestamp INTEGER,
  temperature DECIMAL,
  humidity DECIMAL,
  pressure DECIMAL
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email varchar(255)
);
