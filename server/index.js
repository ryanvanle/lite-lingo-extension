"use strict";
import OpenAI from 'openai';
import express from 'express';
import multer from 'multer';
import pg from 'pg'

const app = express();
const openai = new OpenAI({
  apiKey: "" // provide your own key!
});

const prompt = "You are a plain language assistant. Please Read this text and synthesize the following:\n Can you convert this text into plain text while ensuring that all information is retained?\n If there are any technical or jargon-heavy terms, provide plain language explanations for better understanding. Also, Provide expanded explanations for any acronyms or abbreviations present in the text.\n Make sure you use simple words, positive language, present tense and active voice. Use transition words and format paragraphs and sentences to be short. Use bullet points only when needed.\n Start the plain text summary with the header ‘AI: plain text summary begin’ new line, and end it with ‘AI: plain text summary end’.\n It is very important to make sure you use simple words, positive language, present tense and active voice. Use transition words and format paragraphs and sentences to be short. Use bullet points when necessary."

app.use(express.urlencoded({extended: true}));
app.use(multer().none());
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.post('/generate', async function (req, res) {
  try {
    let text = req.body.text;
    // console.log(text);
    const completion = await openai.chat.completions.create({
      messages: [{role: "system", content: prompt}, { role: "user", content: text}],
      model: "gpt-3.5-turbo",
    });

    let result = completion.choices[0].message.content;
    let array = result.split("\n");
    array.pop(); // "AI: plain text summary end"
    array.pop(); // ""
    array.shift() // AI: plain text summary begin
    array.shift() // ""

    let processedResult = array.join("\n");
    res.send(processedResult);
  } catch (error) {
    console.error(error); // Log the full error for debugging
    res.status(500).send('An internal server error occurred');
  }
});

app.get('/annotations', async function (req, res) {
  try {
    let url = req.query.url;
    let db = await getDBConnection();
    let result = await db.query("SELECT * FROM website WHERE url = $1", [url]);
    db.end();
    res.json(result.rows);
  } catch (error) {
    res.type("text");
    res.status(500).send(error)
  }
});

app.post('/annotations/add', async function (req, res) {
  try {
    let url = req.body.url;
    let annotation = req.body.annotation;
    let originalText = req.body.originalText;
    let ai = req.body.ai;
    let ranking = 0; // default ranking

    if (!checkDuplicateOriginalAndAnnotation(originalText, annotation)) {
      res.type("text");
      return res.status(400).send("Duplicate annotation with original text");
    }

    let db = await getDBConnection();
    let query = "INSERT INTO website (url, originalText, annotation, ranking, ai) VALUES ($1, $2, $3, $4, $5)";
    let wildcardArray = [url, originalText, annotation, ranking, ai];

    await db.query(query, wildcardArray);
    db.end();

    res.type("text");
    return res.status(200).send("Successfully added annotation");
  } catch (error) {
    res.type("text");
    return res.status(500).send(error)
  }
});

app.post('/annotation/update', async function (req, res) {
  try {
    let url = req.body.url;
    let originalAnnotation = req.body.originalAnnotation
    let newAnnotation = req.body.newAnnotation;
    let originalText = req.body.originalText;
    let ranking = 0; // default ranking

    if (!checkDuplicateOriginalAndAnnotation(originalText, annotation)) {
      res.type("text");
      res.status(400).send("Annotation does not exist");
    }

    let db = await getDBConnection();
    let query = "UPDATE website SET annotation = $1, ai = $2, ranking = $3 WHERE url = $4 AND annotation = $5";
    let wildcardArray = [newAnnotation, 0, ranking, url, originalAnnotation];

    await db.query(query, wildcardArray);
    db.end();

    res.type("text");
    res.status(200).send("Successfully modified annotation");
  } catch (error) {
    res.type("text");
    res.status(500).send(error)
  }
});


app.post('/incrementRanking', async function (req, res) {
  try {
    let url = req.body.url;
    let annotation = req.body.annotation
    let originalText = req.body.originalText;
    let data = getAnnotations(annotation, originalText);

    if (data.length == 0) {
      res.type("text");
      res.status(404).send("Annotation, originalText key not found / does not exist");
    }

    let newRanking = data[0].ranking + 1; // must be size one
    let db = await getDBConnection();
    let query = "UPDATE website SET ranking = $1, WHERE url = $2 AND annotation = $3";
    let wildcardArray = [newRanking, url, originalAnnotation];

    await db.query(query, wildcardArray);
    db.end();
    res.type("text");
    res.status(200).send("" + newRanking);

  } catch (error) {
    res.type("text");
    res.status(500).send(error)
  }
});

async function checkDuplicateOriginalAndAnnotation(originalText, annotation) {
  try {
    let db = await getDBConnection();
    let query = "SELECT * FROM website WHERE originalText = $1 AND annotation = $2";
    let result = await db.query(query, [originalText, annotation]);
    db.end();

    console.log(result.rows, result.rows.length);

    return result.rows.length == 0;
  } catch (error) {
    console.log(error);
    return false; // idk how to do this properly lol
  }
}

async function getAnnotations(originalText, annotation) {
  try {
    let db = await getDBConnection();
    let query = "SELECT * FROM website WHERE originalText = $1 AND annotation = $2";
    let result = await db.query(query, [originalText, annotation]);
    db.end();
    return result.rows;
  } catch (error) {
    return [];
  }
}

/**
 * Establishes a database connection to the database and returns the database object.
 * @returns {Object} - The database object for the connection.
 */
async function getDBConnection() {
  const db = new pg.Client({
    user: "postgres",
    password: "password",
    host: "localhost",
    database: "", // username here
    connectionString: "postgres://{username}@localhost:5432/{username}", // put username here
    port: 5432,
    ssl: {
      rejectUnauthorized: false
    }
  })
  db.connect();
  return db;
}

app.use(express.static("public"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
