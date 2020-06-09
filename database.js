const sqlite3 = require('sqlite3').verbose();
var db;


function onConnect(){
    openDB();

    db.serialize(function() {
        db.each('SELECT PlaylistId as id, Name as name FROM guilds', function (err, row) {
            if (err)
                console.error(err.message);

            console.log(row.id + "\t" + row.name);
        });
    });

    closeDB();
}

function openDB(){
    // open the database
    db = new sqlite3.Database('./db/database.db', function (err) {
        if (err)
            console.error(err.message);

        console.log('Connected to the database.');
    });
}

function closeDB() {
    db.close(function (err) {
        if (err)
            console.error(err.message);

        console.log('Close the database connection.');
    });
}