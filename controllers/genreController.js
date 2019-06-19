var Genre = require('../models/genre');
var Book = require('../models/book');
var async = require('async');
const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

//Display list of all Genre
exports.genre_list = function(req, res, next) {
    
    Genre.find()
      .sort([['name', 'ascending']])
      .exec(function (err, list_genres) {
        if (err) { return next(err); }
        //Successful, so render
        res.render('genre_list', { title: 'Genre List', genre_list: list_genres });
    });
};

//Display detail page for a specific genre.
exports.genre_detail = function(req, res, next) {
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id)
              .exec(callback);
        },
        
        genre_books: function(callback) {
            Book.find({ 'genre': req.params.id })
              .exec(callback);
        },
        
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.genre==null) { // No results.
            var err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }
        //Successful, so render
        res.render('genre_detail', { title: 'Genre Detail', genre: results.genre, genre_books: results.genre_books });
    });
};

//Display create form for genre on GET
exports.genre_create_get = function(req, res, next) {
    res.render('genre_form', { title: 'Create Genre' });
};

//Handle create form for genre on POST
exports.genre_create_post = [
    
    //Validate that the name field is not empty
    body('name', 'Genre name required').isLength({ min: 1 }).trim(),
    
    //Sanitize (escape) the name field
    sanitizeBody('name').escape(),
    
    //Process request after validation and sanitization.
    (req, res, next) => {
        
        //Extract the validation errors from the request.
        const errors = validationResult(req);
        
        //Create a genre object with escaped and trimmed data
        var genre = new Genre(
            { name: req.body.name }
        );
        
        if (!errors.isEmpty()) {
            // There are errors. Render the form again with sanitized values/error messages.
            res.render('genre_form', { title: 'Create Genre', genre: genre, errors: errors.array()});
            return;
        }
        else {
            // Data from form is valid.
            // Check if genre with same name already exists.
            Genre.findOne({ 'name': req.body.name })
              .exec( function(err, found_genre) {
                if (err) { return next(err); }
                
                if (found_genre) {
                    //Genre exists, redirect to its detail page.
                    res.redirect(found_genre.url);
                }
                else {
                    genre.save(function (err) {
                        if (err) { return next(err); }
                        //Genre saved. Redirect to genre URl
                        res.redirect(genre.url);
                    });
                }
            });
        }
    }
];

//Display delete form for genre on GET
exports.genre_delete_get = function(req, res, next) {
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id).exec(callback);
        },
        genre_books: function(callback) {
            Book.find({ 'genre': req.params.id }).exec(callback);
        }
    }, function(err, results) {
        if (err) {return next(err); }
        if (results.genre==null) {
            res.redirect('/catalog/genres');
        }
        //Successful, so render the form
        res.render('genre_delete', { title: 'Delete Genre', genre: results.genre, genre_books: results.genre_books });
        
    })
};

//Handle delete form for genre on POST
exports.genre_delete_post = function(req, res, next) {
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.body.genreid).exec(callback);
        },
        genre_books: function(callback) {
            Book.find({ 'genre': req.body.genreid }).exec(callback);
        }
    }, function(err, results) {
        if (err) {return next(err); }
        //Success
        if (results.genre_books.length > 0) {
            //There are books in the genre. So render the page as the GET route
            res.render('genre_delete', { title: 'Delete Genre', genre: results.genre, genre_books: results.genre_books });
            return;
        }
        else {
            // No books are present, so delete the requested genre ID
            Genre.findByIdAndRemove(req.body.genreid, function deleteGenre(err) {
                if (err) {return next(err); }
                // Successfully delete, so redirect to the list of genres.
                res.redirect('/catalog/genres');
            })
        }
    });
};

//Display Update form for genre on GET
exports.genre_update_get = function(req, res, next) {
    Genre.findById(req.params.id)
    .exec(function (err, genre) {
        if (err) { return next(err); }
        //Sucess, so render the update form
        res.render('genre_form', { title: 'Update Genre', genre: genre });
    })
};

//Handle Update form for genre on POST
exports.genre_update_post = [
    //Validate the fields
    body('name', 'Genre name must be specified').isLength({ min: 1 }).trim(),
    
    //Sanitize the fields
    sanitizeBody('name').escape(),
    
    //Process the request
    (req, res, next) => {
        //Extract the validation errors from the request
        const errors = validationResult(req);
        
        //Create the genre records along with the id
        var genre = new Genre({
            name: req.body.name,
            _id: req.params.id
        });
        
        //Check if there are any errors
        if (!errors.isEmpty()) {
            //There are errors, so render the form again with the sanitized values
            res.render('genre_form', { title: 'Update Genre', genre: genre, errors: errors.array() });
            return;
        }
        else {
            //Data is valid and hence it can be updated
            Genre.findByIdAndUpdate(req.params.id, genre, {}, function(err, thegenre) {
                if (err) { return next(err); }
                //No error, so update successful, so redirect to the genre detail page
                res.redirect(thegenre.url);
            });
        }
    }
];