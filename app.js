var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var db = require('./db/mysql').connect();
var m_books = require('./db/schema');
var _ = require('underscore');
var createError = require('http-errors');

console.log('mysql database status:', db.threadId);

const fs = require('fs');
const { filter } = require('underscore');
var books = [];
fs.readdirSync('./data').forEach(file => {
    let tmp = require(`./data/${file}`);
    books = [...books, ...tmp]
});

console.log('Total books loaded in memory:',books.length);

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
    console.log('\n\n\nurl: ' + req.originalUrl, '\tmethod:', req.method, '\tContent-Type:', req.get('Content-Type'), '\tdata:', JSON.stringify(req.params), JSON.stringify(req.query), JSON.stringify(req.body), '\tsession:', JSON.stringify(req.session), JSON.stringify(req.cookies), JSON.stringify(req.signedCookies));
    next();
});

app.get('/search-mysql', (req, res, next) => {
    let query = `SELECT 
        book.gutenberg_id as book_id, 
        book.download_count as book_download_count, 
        book.title as book_title,
        shelf.bookshelf_id as book_shelf_id,
        bbook.book_id as bbook_id,
        bbook.author_id as bauthor_id,
        author.id as author_id, 
        author.name as author_name, 
        author.death_year as author_death_year,
        author.birth_year as author_birth_year,
        lang.id as language_id,
        bookshelf.name as book_shelf_name,
        subjects.name as subject_name,
        book_format.mime_type as mime_type,
        book_format.url as url,
        book_lang.code as lang_code
    FROM sitedb.books_book as book
    LEFT JOIN sitedb.books_book_authors as bbook ON bbook.book_id = book.gutenberg_id
    LEFT JOIN sitedb.books_author as author ON author.id=bbook.author_id
    LEFT JOIN sitedb.books_book_bookshelves as shelf ON shelf.book_id = book.gutenberg_id
    LEFT JOIN sitedb.books_book_languages as lang ON lang.book_id = book.gutenberg_id
    LEFT JOIN sitedb.books_bookshelf as bookshelf ON bookshelf.id = shelf.bookshelf_id
    LEFT JOIN sitedb.books_book_subjects as sub ON sub.book_id = book.gutenberg_id
    LEFT JOIN sitedb.books_subject as subjects ON subjects.id = sub.subject_id
    LEFT JOIN sitedb.books_format as book_format ON book_format.book_id = book.gutenberg_id
    LEFT JOIN sitedb.books_language as book_lang ON book_lang.id = lang.language_id
    where book.gutenberg_id=${req.query.book_id}
    GROUP BY book.gutenberg_id
    ORDER BY book.download_count DESC 
    LIMIT 25 OFFSET ${req.query.page ? parseInt(req.query.page * 25) : 0}`;
    console.log('query:', query);
    db.query(query, function (error, results, fields) {
        if (error) {
            console.error('error:', error);
            return next(error);
        };
        console.log('result:', results)
        let tmp = JSON.parse(JSON.stringify(results));
        res.status(200).json(tmp.map(t => {
            return {
                id: t.book_id,
                title: t.book_title,
                author: {
                    id: t.author_id,
                    name: t.author_name,
                    birth_year: t.author_birth_year,
                    death_year: t.author_death_year
                },
                genre: '',
                language: t.lang_code,
                subject: t.subject_name,
                bookshelf: t.book_shelf_name,
                download: {
                    'mime-type': t.mime_type,
                    url: t.url
                },
                download_count: t.book_download_count
            }
        }));
    });
})

app.get('/search',(req,res,next)=>{
    let tmp_book = null;
    if(req.query.book_id){
        let index = books.findIndex(book=>{return book.id==parseInt(req.query.book_id)});
        if(index<0){
            return next(createError(404,`Book not found for specified bookId ${req.query.book_id}.`));
        }else{
            tmp_book=books[index];
        }
        console.log(tmp_book);
        if(req.query.lang){
            if(tmp_book['language']!=req.query.lang.toLowerCase()){
                return next(createError(404,`Book not found for specified language ${req.query.lang}.`));
            }
        }
        if(req.query.mime){
            if(tmp_book.download['mime-type']!=req.query.mime.toLowerCase()){
                return next(createError(404,`Book not found for specified mime-type ${req.query.mime}.`));
            }
        }
        if(req.query.topic){
            let re= new RegExp(req.query.topic,'gi');
            if(!tmp_book.subject.match(re) && !tmp_book.bookshelf.match(re)){
                return next(createError(404,`Book not found for specified topic ${req.query.topic}.`));
            }
        }
        if(req.query.author){
            if(!tmp_book.author.name.match(new RegExp(req.query.author,'gi'))){
                return next(createError(404,`Book not found for specified author ${req.query.author}.`));
            }
        }
        if(req.query.title){
            if(!tmp_book.title.match(new RegExp(req.query.title,'gi'))){
                return next(createError(404,`Book not found for specified title ${req.query.title}.`));
            }
        }
        res.status(200).json(tmp_book);
    }else{
        tmp_book = [];
        Object.keys(req.query).forEach((k,i)=>{
            tmp_book = filterBook(i==0?books:tmp_book,k,req.query[k].split(','))
        });
        tmp_book?.sort((a, b) => (a.download_count > b.download_count ? -1 : 1))
        res.status(200).json(tmp_book);
    }
})

const filterBook = (books,ffilter,values) => {
    books = books.filter(book=>{
        let valid = false;
        if(ffilter=='mime'){
            for(let k in values){
                valid = valid || book.download['mime-type'] == values[k].toLowerCase();
            }
        }else if(ffilter=='author'){
                book.author.name = book.author.name || '';
                for(let k in values){
                    valid = valid || book.author.name.match(new RegExp(values[k].toLowerCase(),'gi'));
                }
        }else if(ffilter=='topic'){
                book.subject = book.subject || '';
                books.bookshelf = books.bookshelf || '';
                for(let k in values){
                    valid = valid || (book.subject.match(new RegExp(values[k].toLowerCase(),'gi')) || books.bookshelf.match(new RegExp(values[k].toLowerCase(),'gi')));
                }
        }else{
                book[ffilter] = book[ffilter] || '';
                for(let k in values){
                    valid = valid || book[ffilter].match(new RegExp(values[k].toLowerCase(),'gi'));
                }
        }
        return valid;
    })
    return books;
}

app.get('/search-mongo',(req,res,next)=>{
    let filters = req.query;
    let query={};
    Object.keys(req.query).forEach(k=>{
        if(k=='topic'){
            query['$or']=[];
            req.query.topic=req.query.topic.split(',');
            query['$or']=req.query.topic.flatMap(v=>{
                return [{subject:{ "$regex": v, "$options": "i" }},
                    {bookshelf:{ "$regex": v, "$options": "i" }}]
            })
        }else{
            if(k!='page'){
                if(!query['$and']){
                    query['$and']=[];
                }
                if(k=='mime'){
                    req.query.mime=req.query.mime.split(',');
                    query['$and'].push({'$or':req.query.mime.map(v=>{
                        return {'download.mime-type':v}
                    })})
                    // query['$and'].push({'download.mime-type':req.query.mime})
                }else if(k=='author'){
                    req.query.author=req.query.author.split(',');
                    query['$and'].push({'$or':req.query.author.map(v=>{
                        return {'author.name':{ "$regex": v, "$options": "i" }}
                    })})
                    // query['$and'].push({'author.name':{ "$regex": req.query.author, "$options": "i" }})
                }else if(k=='title'){
                    req.query.title=req.query.title.split(',');
                    query['$and'].push({'$or':req.query.title.map(v=>{
                        return {'title':{ "$regex": v, "$options": "i" }}
                    })})
                    // query['$and'].push({title:{ "$regex": req.query.title, "$options": "i" }})
                }else if(k=='book_id'){
                    req.query.book_id=req.query.book_id.split(',');
                    query['$and'].push({'$or':req.query.book_id.map(v=>{
                        return {'id':parseInt(v)}
                    })})
                    // query['$and'].push({[k]:parseInt(req.query[k])});
                }else{
                    req.query[k]=req.query[k].split(',');
                    query['$and'].push({'$or':req.query[k].map(v=>{
                        return {[k]:{ "$regex": v, "$options": "i" }}
                    })})
                    // query['$and'].push({[k]:req.query[k]});
                }
            }
        }
    });
    console.log('query:',JSON.stringify(query));
    m_books.paginate(query,{
        page: req.query.page?parseInt(req.query.page):1,
        limit: 25,
        sort: { download_count: -1 },
        customLabels: {
            totalDocs: 'itemCount',
            docs: 'itemsList',
            limit: 'perPage',
            page: 'currentPage',
            nextPage: 'next',
            prevPage: 'prev',
            totalPages: 'pageCount',
            pagingCounter: 'slNo',
            meta: 'paginator',
          },
      }).then(bk=>{
        if(!bk){
            throw createError(404,'Book not found for given filter criteria.');
        }else if(bk.itemsList.length==0){
            throw createError(404,'Book not found for given filter criteria.');
        }else{
            res.status(200).json({books:bk.itemsList,next_page:bk.paginator.next});
        }
    }).catch(err=>{
        return next(err);
    })
});

const mongoFormatter = (field,values) =>{
    values = values.split(',');
    let tmp
    for(let i in values){

    }
}

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    console.error(Date.now() + '\terror:', err.name, err.message, err);
    err.status = (err.status || 500);
    res.status(err.status).send(err.status == 500 ? 'Internal server error, please try again later.' : err.message);
});

process.on('SIGTERM', () => {
    console.info('SIGTERM signal received.');
});

module.exports = app;
