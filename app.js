const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const Database = require("better-sqlite3");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 5000;


// =====================================
// DATABASE
// =====================================

const db = new Database("dj_website.db");

const schema = fs.readFileSync("schema.sql", "utf8");

db.exec(schema);


// =====================================
// MIDDLEWARE
// =====================================
app.use((req, res, next) => {
    res.header(
        "Access-Control-Allow-Origin",
        "https://deejaysourabh.netlify.app"
    );

    res.header(
        "Access-Control-Allow-Methods",
        "GET,POST,DELETE,OPTIONS"
    );

    res.header(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
    );

    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }

    next();
});
app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);


// =====================================
// ADMIN AUTHENTICATION
// =====================================

const adminTokens = new Set();


// =====================================
// ADMIN LOGIN
// =====================================

app.post(
    "/api/admin/login",
    (req, res) => {

        try {

            const {
                username,
                password
            } = req.body;


            // =====================================
            // ADMIN USERNAME & PASSWORD
            // =====================================

           const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (
    username === ADMIN_USERNAME &&
    password === ADMIN_PASSWORD
) {

                const token =
                    crypto
                        .randomBytes(32)
                        .toString("hex");


                adminTokens.add(token);


                return res.json({

                    success: true,

                    message:
                        "Login successful",

                    token:
                        token

                });

            }


            res.status(401).json({

                success: false,

                message:
                    "Invalid username or password"

            });

        }

        catch (error) {

            console.error(
                "LOGIN ERROR:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Login failed"

            });

        }

    }
);


// =====================================
// CHECK ADMIN TOKEN
// =====================================

function requireAdmin(
    req,
    res,
    next
) {

    const authorization =
        req.headers.authorization || "";


    const token =
        authorization.startsWith("Bearer ")
            ? authorization.substring(7)
            : "";


    if (
        !token ||
        !adminTokens.has(token)
    ) {

        return res.status(401).json({

            success: false,

            message:
                "Admin authentication required"

        });

    }


    next();

}


// =====================================
// ADMIN LOGOUT
// =====================================

app.post(
    "/api/admin/logout",
    requireAdmin,
    (req, res) => {

        const authorization =
            req.headers.authorization || "";


        const token =
            authorization.startsWith("Bearer ")
                ? authorization.substring(7)
                : "";


        adminTokens.delete(token);


        res.json({

            success: true,

            message:
                "Logged out successfully"

        });

    }
);


// =====================================
// UPLOAD FOLDERS
// =====================================

const audioFolder =
    path.join(
        __dirname,
        "uploads",
        "audio"
    );


const coverFolder =
    path.join(
        __dirname,
        "uploads",
        "covers"
    );


fs.mkdirSync(
    audioFolder,
    {
        recursive: true
    }
);


fs.mkdirSync(
    coverFolder,
    {
        recursive: true
    }
);


// =====================================
// MULTER
// =====================================

const storage =
    multer.diskStorage({

        destination:
            function (
                req,
                file,
                cb
            ) {

                if (
                    file.fieldname === "audio"
                ) {

                    cb(
                        null,
                        audioFolder
                    );

                }

                else if (
                    file.fieldname === "cover"
                ) {

                    cb(
                        null,
                        coverFolder
                    );

                }

                else {

                    cb(
                        new Error(
                            "Invalid upload field"
                        )
                    );

                }

            },


        filename:
            function (
                req,
                file,
                cb
            ) {

                const safeName =
                    file.originalname
                        .replace(
                            /\s+/g,
                            "-"
                        );


                const uniqueName =
                    Date.now() +
                    "-" +
                    safeName;


                cb(
                    null,
                    uniqueName
                );

            }

    });


const upload =
    multer({
        storage: storage
    });


// =====================================
// SERVE WEBSITE
// =====================================

app.use(
    express.static(
        __dirname
    )
);


// =====================================
// SERVE UPLOADED FILES
// =====================================

app.use(
    "/uploads",
    express.static(
        path.join(
            __dirname,
            "uploads"
        )
    )
);


// =====================================
// GET SONGS
// PUBLIC
// =====================================

app.get(
    "/api/songs",
    (req, res) => {

        try {

            const songs =
                db
                    .prepare(
                        `
                        SELECT *
                        FROM songs
                        ORDER BY id DESC
                        `
                    )
                    .all();


            res.json(
                songs
            );

        }

        catch (error) {

            console.error(
                "GET SONGS ERROR:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Failed to load songs"

            });

        }

    }
);


// =====================================
// ADD SONG
// ADMIN ONLY
// =====================================

app.post(
    "/api/songs",
    requireAdmin,
    upload.fields([

        {
            name: "audio",
            maxCount: 1
        },

        {
            name: "cover",
            maxCount: 1
        }

    ]),
    (req, res) => {

        try {

            const {
                title,
                genre,
                description
            } = req.body;


            if (!title) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Song title is required"

                });

            }


            if (
                !req.files ||
                !req.files.audio ||
                !req.files.audio[0]
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Audio file is required"

                });

            }


            const audioFile =
                "/uploads/audio/" +
                req.files.audio[0].filename;


            let coverImage = null;


            if (
                req.files.cover &&
                req.files.cover[0]
            ) {

                coverImage =
                    "/uploads/covers/" +
                    req.files.cover[0].filename;

            }


            const result =
                db
                    .prepare(
                        `
                        INSERT INTO songs

                        (
                            title,
                            genre,
                            description,
                            audio_file,
                            cover_image
                        )

                        VALUES (?, ?, ?, ?, ?)
                        `
                    )
                    .run(

                        title,

                        genre || "",

                        description || "",

                        audioFile,

                        coverImage

                    );


            res.json({

                success: true,

                message:
                    "Song added successfully",

                id:
                    result.lastInsertRowid

            });

        }

        catch (error) {

            console.error(
                "ADD SONG ERROR:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Failed to add song"

            });

        }

    }
);


// =====================================
// DELETE SONG
// ADMIN ONLY
// =====================================

app.delete(
    "/api/songs/:id",
    requireAdmin,
    (req, res) => {

        try {

            const song =
                db
                    .prepare(
                        `
                        SELECT *
                        FROM songs
                        WHERE id = ?
                        `
                    )
                    .get(
                        req.params.id
                    );


            if (!song) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Song not found"

                });

            }


            db
                .prepare(
                    `
                    DELETE FROM songs
                    WHERE id = ?
                    `
                )
                .run(
                    req.params.id
                );


            res.json({

                success: true,

                message:
                    "Song deleted successfully"

            });

        }

        catch (error) {

            console.error(
                "DELETE SONG ERROR:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Failed to delete song"

            });

        }

    }
);


// =====================================
// BOOKINGS
// =====================================


// =====================================
// SUBMIT BOOKING
// PUBLIC
// =====================================

app.post(
    "/api/bookings",
    (req, res) => {

        try {

            const {
                mandal,
                name,
                phone,
                details
            } = req.body;


            if (
                !name ||
                !phone
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Name and phone are required"

                });

            }


            const result =
                db
                    .prepare(
                        `
                        INSERT INTO bookings

                        (
                            client_name,
                            email,
                            phone,
                            song_name,
                            requirements
                        )

                        VALUES (?, ?, ?, ?, ?)
                        `
                    )
                    .run(

                        name,

                        "",

                        phone,

                        mandal ||
                            "Mandal Song Booking",

                        details ||
                            ""

                    );


            res.json({

                success: true,

                message:
                    "Booking request submitted successfully",

                id:
                    result.lastInsertRowid

            });

        }

        catch (error) {

            console.error(
                "BOOKING ERROR:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Failed to submit booking"

            });

        }

    }
);


// =====================================
// GET BOOKINGS
// ADMIN ONLY
// =====================================

app.get(
    "/api/bookings",
    requireAdmin,
    (req, res) => {

        try {

            const bookings =
                db
                    .prepare(
                        `
                        SELECT *
                        FROM bookings
                        ORDER BY id DESC
                        `
                    )
                    .all();


            res.json(
                bookings
            );

        }

        catch (error) {

            console.error(
                "GET BOOKINGS ERROR:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Failed to load bookings"

            });

        }

    }
);


// =====================================
// DELETE BOOKING
// ADMIN ONLY
// =====================================

app.delete(
    "/api/bookings/:id",
    requireAdmin,
    (req, res) => {

        try {

            const booking =
                db
                    .prepare(
                        `
                        SELECT *
                        FROM bookings
                        WHERE id = ?
                        `
                    )
                    .get(
                        req.params.id
                    );


            if (!booking) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Booking not found"

                });

            }


            db
                .prepare(
                    `
                    DELETE FROM bookings
                    WHERE id = ?
                    `
                )
                .run(
                    req.params.id
                );


            res.json({

                success: true,

                message:
                    "Booking deleted successfully"

            });

        }

        catch (error) {

            console.error(
                "DELETE BOOKING ERROR:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Failed to delete booking"

            });

        }

    }
);


// =====================================
// TEST API
// =====================================

app.get(
    "/api/test",
    (req, res) => {

        res.json({

            success: true,

            message:
                "DJ website backend is working!"

        });

    }
);


// =====================================
// START SERVER
// =====================================

app.listen(
    PORT,
    () => {

        console.log(
            `Server running at http://localhost:${PORT}`
        );

    }
);
