INSERT INTO colleges (id, name, code, logo_url, address, website) VALUES
  ('11111111-1111-1111-1111-111111111111', 'North Valley Institute of Technology', 'NVIT', '/uploads/college-logo.png', '12 Campus Drive, Bengaluru', 'https://nvit.edu')
ON CONFLICT (code) DO NOTHING;

INSERT INTO roles (name) VALUES
  ('admin'), ('faculty'), ('student')
ON CONFLICT (name) DO NOTHING;
