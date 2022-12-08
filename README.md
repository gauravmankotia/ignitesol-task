Below is the TREE structure of the repo:

.
├── ./README.md
├── ./app.js -> APIs and routing
├── ./bin 
│   └── ./bin/www -> code which start the express server
├── ./data.js -> fetch data from mysql and store in json file
├── ./data -> used for storing data in json file fetched from mysql
├── ./db
│   ├── ./db/mongo.js -> mongodb connection module
│   ├── ./db/mysql.js -> mysql connection module
│   └── ./db/schema.js -> mongo schema
├── ./gutendex.sql -> mysql dump file received in email
├── ./mongo_store.js -> store data fetched from mysql to mongodb
├── ./package-lock.json
├── ./package.json
├── ./public
│   ├── ./public/images
│   ├── ./public/javascripts
│   └── ./public/stylesheets
│       └── ./public/stylesheets/style.css
└── ./views

I started working on the task at 9am on 6th Dec.
As my tech stack does not include Mysql or any other RDBMS, I have never worked using it in after 2017, hence, on 6the Dec, I tried to setup MySQL server, search few free mysql hosting services, encountered many techincal issues, finally used AWS RDS micro instance, dealed with connectivity issues with DBMS, resolved them, got user privileages related errors while importing the data and finally I copied all the SQL and manually pasted in workbench editor, executed it and stored the data into mysql database named sitedb and it was done around 4PM in the evening.

After that, I needed to figure out fetching of data and for that I had remember the JOINS concept but wasn't sure, I tried implementing it and was finally able to get the desired output if the search was performed using book_id. I tried to implement the search variations using filters but as I do not have much knowledge about it I was unable to get the desired results instead the database server would just connection timeout on each call.

As the task was give and I wanted to do it, I started the implementation using in-memory to show logical skills and mongodb to show database skills, I figured out the schema and their relations and accordingly I wrote a script named data.js, its only work is to fetch the data from mysql one by one using book_id and store the response in json file insdie data folder. 
You can run it using the command "node data.js starting_book_id end_book_id"
eg: To fetch all the books between 1-1000 book_id, run "node data.js 1 1000"
Total number of books in mysql was 54859 and to fetch them I executed this data.js script multiple times with different starting_book_id and ending_book_id in multiple terminal tabs.
eg: node data.js 1 1000
node data.js 1001 2000
node data.js 2001 3000
node data.js 3001 4000
node data.js 4001 5000 
and so on ....

After around 6 hours the whole mysql database records fetching was completed and available in ./data folder.

To store the data into mongodb, I wrote the script mongo_store.js which traverse all the files, get their data and store it in a single array and then using that array store the data into mongodb. Once the data was stored in mongodb, I created 3 endpoints, details about them are below:
/search -> perform search operation using in-memory data loaded during the server startup and custom partial dynamic search logic and giving response according to all the search variations mentioned in the task based on filter paramter sequence.

/search-mysql -> performing search operation using mysqldb but supports only 1 search variation and its using book_id

/search-mongo -> performing search operation using mongodb and giving response according to all the search variations mentioned in the task.

The in-memory search implementation was completed yesterday around 3PM and after that I started the mongodb search implementation which was completed today morning at 8AM. 
When testing the mongodb search implementation I found this small error related to author_id due to which either the author was "Sanchez, Nellie Van de Grift" in response or it was null, so I cross checked the both the database and schemas and found that in mySQL SQL statement there was a small error related to author_id mapping which then I rectified and once again I have to fetch all the data from MYSQL and update the new data in mongodb which again cost me around 6 hours, total unique books in mongodb records are 53855 and thats the reason why I am submitting the task this late.

Search Example: 

Search using in-memory (search via book_id is supported using only single book_id, rest multi-filter, multi-value supported): 

/search?title=right,two&language=hn,en&topic=1783
response:[
    {
        "id": 2,
        "title": "The United States Bill of Rights: The Ten Original Amendments to the Constitution of the United States",
        "author": {
            "id": 1,
            "name": "Jefferson, Thomas",
            "birth_year": 1743,
            "death_year": 1826
        },
        "language": "en",
        "subject": "United States -- History -- Revolution, 1775-1783 -- Sources",
        "bookshelf": "Politics",
        "download": {
            "mime-type": "text/plain",
            "url": "http://www.gutenberg.org/ebooks/1.txt.utf-8"
        },
        "download_count": 161
    }
]


/search?book_id=3&title=right,two&language=hn,en&topic=1783
Response: Book not found for specified topic 1783.

/search?book_id=3&title=add&language=hn,en
Response: {
    "id": 3,
    "title": "John F. Kennedy's Inaugural Address",
    "author": {
        "id": 2,
        "name": "United States",
        "birth_year": null,
        "death_year": null
    },
    "language": "en",
    "subject": "Civil rights -- United States -- Sources",
    "bookshelf": "American Revolutionary War",
    "download": {
        "mime-type": "application/epub+zip",
        "url": "http://www.gutenberg.org/ebooks/2.epub.noimages"
    },
    "download_count": 50
}

Search using MySQL (only search via singly book_id supported):
/search-mysql?book_id=3
Response: [
    {
        "id": 3,
        "title": "John F. Kennedy's Inaugural Address",
        "author": {
            "id": 2,
            "name": "United States",
            "birth_year": null,
            "death_year": null
        },
        "genre": "",
        "language": "en",
        "subject": "Civil rights -- United States -- Sources",
        "bookshelf": "American Revolutionary War",
        "download": {
            "mime-type": "application/epub+zip",
            "url": "http://www.gutenberg.org/ebooks/2.epub.noimages"
        },
        "download_count": 50
    }
]


Search using MongoDB (multiple filter, multiple value supported, all variations):

/search-mongo?author=van,mas&topic=ten&language=en&title=ten
Response: {
    "books": [
        {
            "author": {
                "id": 444,
                "name": "Dumas, Alexandre",
                "birth_year": 1802,
                "death_year": 1870
            },
            "download": {
                "mime-type": "text/plain",
                "url": "http://www.gutenberg.org/ebooks/3617.txt.utf-8"
            },
            "_id": "6391959d5655c6d25be80670",
            "id": 3617,
            "title": "Widger's Quotations from the Project Gutenberg Editions of Dumas' Celebrated Crimes",
            "language": "en",
            "subject": "Quotations",
            "bookshelf": "Project Gutenberg",
            "download_count": 8,
            "__v": 0,
            "createdAt": "2022-12-08T07:43:26.563Z",
            "updatedAt": "2022-12-08T07:43:26.563Z"
        },
        {
            "author": {
                "id": 10761,
                "name": "Boynton, Henry V. (Henry Van)",
                "birth_year": 1835,
                "death_year": 1905
            },
            "download": {
                "mime-type": "application/rdf+xml",
                "url": "http://www.gutenberg.org/ebooks/31783.rdf"
            },
            "_id": "6391959d5655c6d25be7e7d6",
            "id": 31783,
            "title": "Was General Thomas Slow at Nashville?: With a Description of the Greatest Cavalry Movement of the War and General James H. Wilson's Cavalry Operations in Tennessee, Alabama, and Georgia",
            "language": "en",
            "subject": "Nashville, Battle of, Nashville, Tenn., 1864",
            "bookshelf": "US Civil War",
            "download_count": 6,
            "__v": 0,
            "createdAt": "2022-12-08T07:43:26.483Z",
            "updatedAt": "2022-12-08T07:43:26.483Z"
        }
    ],
    "next_page": null
}


/search-mongo?mime=text/plain,application/json,application%2Frdf%2Bxml&author=van,mas&topic=ten&language=en&title=ten

Here, I want to highlight the paramater query having values: text/plain,application/json,application%2Frdf%2Bxml

The value application%2Frdf%2Bxml is properly paresed and expected result is sent in response.

Response: {
    "books": [
        {
            "author": {
                "id": 444,
                "name": "Dumas, Alexandre",
                "birth_year": 1802,
                "death_year": 1870
            },
            "download": {
                "mime-type": "text/plain",
                "url": "http://www.gutenberg.org/ebooks/3617.txt.utf-8"
            },
            "_id": "6391959d5655c6d25be80670",
            "id": 3617,
            "title": "Widger's Quotations from the Project Gutenberg Editions of Dumas' Celebrated Crimes",
            "language": "en",
            "subject": "Quotations",
            "bookshelf": "Project Gutenberg",
            "download_count": 8,
            "__v": 0,
            "createdAt": "2022-12-08T07:43:26.563Z",
            "updatedAt": "2022-12-08T07:43:26.563Z"
        },
        {
            "author": {
                "id": 10761,
                "name": "Boynton, Henry V. (Henry Van)",
                "birth_year": 1835,
                "death_year": 1905
            },
            "download": {
                "mime-type": "application/rdf+xml",
                "url": "http://www.gutenberg.org/ebooks/31783.rdf"
            },
            "_id": "6391959d5655c6d25be7e7d6",
            "id": 31783,
            "title": "Was General Thomas Slow at Nashville?: With a Description of the Greatest Cavalry Movement of the War and General James H. Wilson's Cavalry Operations in Tennessee, Alabama, and Georgia",
            "language": "en",
            "subject": "Nashville, Battle of, Nashville, Tenn., 1864",
            "bookshelf": "US Civil War",
            "download_count": 6,
            "__v": 0,
            "createdAt": "2022-12-08T07:43:26.483Z",
            "updatedAt": "2022-12-08T07:43:26.483Z"
        }
    ],
    "next_page": null
}

You will find the project hosted at the following ip address: 
Please prepend the ip address at the of the above mentioned url to test it.

Thanks & Regards.