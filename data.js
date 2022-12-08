require('dotenv').config();
var db = require('./db/mysql').connect();
const args = process.argv.slice(2);
console.log('args:',args)
var counter = parseInt(args[0]);
var total = parseInt(args[1]);
var books = [];
var fs = require('fs');

// db.query('select count(*) from sitedb.books_book as total;', function (error, results, fields) {
//     if (error) {
//         console.error('error:', error);
//         process.exit(0);
//     };
//     console.log('result:', results[0]['count(*)'])
//     total = results[0]['count(*)'];
//     fetch();
// });

function fetch() {
    if (counter <= total) {
        db.query(`SELECT 
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
    where book.gutenberg_id=${counter}
    GROUP BY book.gutenberg_id
    ORDER BY book.download_count DESC 
    LIMIT 25 OFFSET 0`, function (error, results, fields) {
            if (error) {
                console.error('error:', error);
                process.exit(0);
            };
            let tmp = JSON.parse(JSON.stringify(results));
            if(tmp.length>0){
                tmp=tmp.map(t => {
                    return {
                        id: t.book_id,
                        title: t.book_title,
                        author: {
                            id: t.author_id,
                            name: t.author_name,
                            birth_year: t.author_birth_year,
                            death_year: t.author_death_year
                        },
                        language: t.lang_code,
                        subject: t.subject_name,
                        bookshelf: t.book_shelf_name,
                        download: {
                            'mime-type': t.mime_type,
                            url: t.url
                        },
                        download_count: t.book_download_count
                    }
                })
                console.log('fetched record:',counter,tmp[0].id);
                books.push(tmp[0]);
            }
            counter++;
            fetch();
        });
    } else {
        fs.writeFileSync(`./data/dump-${total}.json`,JSON.stringify(books),'utf-8')
        console.log('process completed');
        db.end();
        console.log('connection closed.');
    }
}
fetch();

// process.stdin.resume();

function exitHandler(options, exitCode) {
    db.end();
}

process.on('exit', exitHandler.bind(null, {
  cleanup: true
}));

process.on('SIGINT', exitHandler.bind(null, {
  exit: true
}));

process.on('SIGUSR1', exitHandler.bind(null, {
  exit: true
}));
process.on('SIGUSR2', exitHandler.bind(null, {
  exit: true
}));

process.on('uncaughtException', exitHandler.bind(null, {
  exit: true
}));