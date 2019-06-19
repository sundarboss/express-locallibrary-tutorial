var BookInstance = require('../models/bookinstance');
var Book = require('../models/book');

var async = require('async');

const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

//Display list of all BookInstances
exports.bookinstance_list = function(req, res) {
    BookInstance.find()
      .populate('book')
      .exec(function (err, list_bookinstances) {
        if (err) { return next(err); }
        //Successfull, so render
        res.render('bookinstance_list', { title: 'Copies of Books', bookinstance_list: list_bookinstances });
    });
};

//Display detail page for a specific bookinstance.
exports.bookinstance_detail = function(req, res, next) {
    
    BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function (err, bookinstance) {
        if (err) { return next(err); }
        if (bookinstance==null) {
            var err = new Error('No Book Instance Copy Found');
            err.status = 404;
            return next(err);
        }
        //Successful, so render
        res.render('bookinstance_detail', { title: 'Book:', bookinstance: bookinstance });
    })
};

//Display create form for bookinstance on GET
exports.bookinstance_create_get = function(req, res, next) {
    Book.find({},'title')
    .exec(function (err, books) {
        if (err) { return next(err); }
        //Successful, so render
        res.render('bookinstance_form', { title: 'Create Book Copy', book_list: books });
    });
};

//Handle create form for bookinstance on POST
exports.bookinstance_create_post = [
    //Validate the fields
    body('book', 'Book must be specified').isLength({ min: 1 }).trim(),
    body('imprint', 'Imprint must be specified').isLength({ min: 1 }).trim(),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),
    
    //Sanitize fields.
    sanitizeBody('book').escape(),
    sanitizeBody('imprint').escape(),
    sanitizeBody('status').escape(),
    sanitizeBody('due_back').escape(),
    
    //Process the request after validating and sanitizing
    (req, res, next) => {
        // Get the validations errors from the request
        const errors = validationResult(req);
        
        //Create a bookinstance object with the escaped and trimmed data
        var bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back
        });
        
        if (!errors.isEmpty()) {
            //There are errors. Render the form again with the sanitized data and error messages
            Book.find({},'title')
            .exec(function (err, books) {
                if (err) {return next(err); }
                res.render('bookinstance_form', { title: 'Create Booky Copy', book_list: books, errors: errors.array() });
            });
            return;        
        }
        else {
            //Data is valid and hence it can be saved
            bookinstance.save(function (err) {
                if (err) { return next(err); }
                res.redirect(bookinstance.url);
            });
        }
    }
];

//Display delete form for bookinstance on GET
exports.bookinstance_delete_get = function(req, res, next) {
    BookInstance.findById(req.params.id)
    .exec(function (err, bookinstance) {
        if (err) { return next(err); }
        // Sucess, so render
        res.render('bookinstance_delete', { title: 'Delete Book Copy', book_instance: bookinstance });
    })
};

//Handle delete form for bookinstance on POST
exports.bookinstance_delete_post = function(req, res, next) {
    BookInstance.findById(req.body.bookinstanceid)
    .exec(function (err, bookinstance) {
        if (err) { return next(err); }
        //Success, so delete the record
        BookInstance.findByIdAndRemove(req.body.bookinstanceid, function deleteBookInstance(err) {
            if (err) { return next(err); }
            res.redirect('/catalog/bookinstances');
        })
    });
};

//Display Update form for bookinstance on GET
exports.bookinstance_update_get = function(req, res, next) {
    async.parallel({
        bookinstance: function(callback) {
            BookInstance.findById(req.params.id).exec(callback)
        },
        books: function(callback) {
            Book.find({},'title').exec(callback)
        }
    }, function(err, results) {
        if (err) { return next(err); }
        // Success, so render the update form
        res.render('bookinstance_form', { title: 'Update Book Copy', bookinstance: results.bookinstance, book_list: results.books });
    })
};

//Handle Update form for bookinstance on POST
exports.bookinstance_update_post = [
    //Validate the fields
    body('book', 'Book name must be specified').isLength({ min: 1 }).trim(),
    body('imprint', 'Imprint must be provided').isLength({ min: 1 }).trim(),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),
    
    //Sanitize the fields
    sanitizeBody('book').escape(),
    sanitizeBody('imprint').escape(),
    sanitizeBody('status').escape(),
    sanitizeBody('due_back').escape(),
    
    //Process the request
    (req, res, next) => {
        //Extract the validation errors from the request
        const errors = validationResult(req);
        
        var bookinstance = new BookInstance(
        {
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
            _id: req.params.id
        });
        
        if(!errors.isEmpty()) {
            //There are errors, so render the form again
            Book.find({},'title')
            .exec(function(err, books) {
                if (err) { return next(err); }
                res.render('bookinstance_form', { title: 'Update Book Copy', bookinstance: bookinstance, book_list: books, errors: errors.array() });
            });
            return;
        }
        else {
            //Data is valid and hence can be updated
            BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}, function(err, thebookinstance) {
                if (err) { return next(err); }
                //Success, so redirect to the detail page
                res.redirect(thebookinstance.url);
            });
        }
    }
];