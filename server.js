const pg = require('pg');
const express = require('express');
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/acme_notes_categories_db');
const port = process.env.PORT || 3000;
const app = express();

app.use(express.json());
app.use(require('morgan')('dev'));

// GET api/categories -- READ
app.get('/api/categories', async (req, res, next) => {
    try {
        const SQL = `
            SELECT * from categories; 
        `;
        const response = await client.query(SQL);
        res.send(response.rows);
    } catch (error) {
        next("There was an error", error);
    }
})

// GET api/notes -- READ
app.get('/api/notes', async (req, res, next) => {
    try {
        const SQL = `
            SELECT * from notes ORDER BY created_at DESC;
        `;
        const response = await client.query(SQL);
        res.send(response.rows);
    } catch (error) {
        next("There was an error", error);
    }
})

// POST api/notes -- CREATE
app.post('/api/notes', async (req, res, next) => {
    try {
        const SQL = `
            INSERT INTO notes(txt, category_id)
            VALUES($1, $2)
            RETURNING *
        `;
        const response = await client.query(SQL, [req.body.txt, req.body.category_id]);
        res.send(response.rows[0]);
    } catch (error) {
        next("There was an error", error);
    }
})

// PUT api/notes/:id -- UPDATE
app.put('/api/notes/:id', async (req, res, next) => {
    try {
        const SQL = `
            UPDATE notes
            SET txt=$1, ranking=$2, category_id=$3, updated_at=now()
            WHERE id=$4 RETURNING *
        `;
        const response = await client.query(SQL, [req.body.txt, req.body.ranking, req.body.category_id, req.params.id]);
        res.send(response.rows[0]);
    } catch (error) {
        next("There was an error", error);
    }
})

// DELETE api/notes/:id -- DELETE
app.delete('/api/notes/:id', async (req, res, next) => {
    try {
        const SQL = `
            DELETE from notes WHERE id=$1
        `;
        const response = await client.query(SQL, [req.params.id]);
        res.sendStatus(204);
    } catch (error) {
        next("There was an error", error);
    }
})

const init = async () => {
    await client.connect();
    console.log("Connected to database");
    let SQL = `
        DROP TABLE IF EXISTS notes;
        DROP TABLE IF EXISTS categories;
        CREATE TABLE categories(
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL
        );
        CREATE TABLE notes(
            id SERIAL PRIMARY KEY,
            txt VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT now(),
            updated_at TIMESTAMP DEFAULT now(),
            ranking INTEGER DEFAULT 3 NOT NULL,
            category_id INTEGER REFERENCES categories(id) NOT NULL
        );
    `;
    await client.query(SQL);
    console.log("Tables created");
    SQL = `
        INSERT INTO categories(name) VALUES ('SQL')
        INSERT INTO categories(name) VALUES ('Express')
        INSERT INTO notes(txt, ranking, category_id) VALUES ('Learn SQL', 5, (SELECT id FROM categories WHERE name='Express));
        INSERT INTO notes(txt, ranking, category_id) VALUES ('Write SQL queries', 4, (SELECT id FROM categories WHERE name='SQL'));
    `;
    await client.query(SQL);
    console.log("Data seeded");
    app.listen(port, () => console.log(`Listening on port ${port}`));
}

init();
