const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const books = new mongoose.Schema({
    "id": {
        "type": "Number"
    },
    "title": {
        "type": "String"
    },
    "author": {
        "id": {
            "type": "Number"
        },
        "name": {
            "type": "String"
        },
        "birth_year": {
            "type": "Number"
        },
        "death_year": {
            "type": "Number"
        }
    },
    "language": {
        "type": "String"
    },
    "subject": {
        "type": "String"
    },
    "bookshelf": {
        "type": "String"
    },
    "download": {
        "mime-type": {
            "type": "String"
        },
        "url": {
            "type": "String"
        }
    },
    "download_count": {
        "type": "Number"
    }
}, {
    timestamps: true
});
books.plugin(mongoosePaginate);
module.exports = mongoose.model('books', books);