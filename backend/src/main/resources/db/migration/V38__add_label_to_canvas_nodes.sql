-- V38: Add label column to canvas_nodes
ALTER TABLE canvas_nodes ADD COLUMN IF NOT EXISTS label VARCHAR(255);
