CREATE TABLE IF NOT EXISTS "website" (
  url TEXT,
  originalText TEXT,
  annotation TEXT,
  ranking INT,
  ai INT
);

INSERT INTO website (url, originalText, annotation, ranking, ai) VALUES ('test1', 'test2', 'test3', 9, 1)