-- Seed roles on startup (only if not exists)
INSERT IGNORE INTO roles (id, name, description) VALUES (1, 'USER', 'Regular campus user');
INSERT IGNORE INTO roles (id, name, description) VALUES (2, 'ADMIN', 'System administrator');
INSERT IGNORE INTO roles (id, name, description) VALUES (3, 'TECHNICIAN', 'Maintenance technician');
INSERT IGNORE INTO roles (id, name, description) VALUES (4, 'MANAGER', 'Department manager');
