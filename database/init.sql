CREATE TABLE IF NOT EXISTS properties (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id),
    customer_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO properties (title, city, price)
SELECT 'Modern Apartment', 'Chicago', 2200
WHERE NOT EXISTS (SELECT 1 FROM properties);

INSERT INTO properties (title, city, price)
SELECT 'Luxury Condo', 'Schaumburg', 2800
WHERE NOT EXISTS (
    SELECT 1 FROM properties WHERE title = 'Luxury Condo'
);
