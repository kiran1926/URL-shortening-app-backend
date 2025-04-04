const mongoose = require('mongoose');
const shortid = require('shortid');

const noteSchema = new mongoose.Schema({

    content: {
        type: String,
        required: false,
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
},
{
  timestamps: true, 
}
);

const urlSchema = new mongoose.Schema({
    originalUrl: {
        type: String,
        required: true,
        trim: true
    },
    shortUrl: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    clicks: {
        type: Number,
        default: 0
    },
    qrCode: {
        type: String,
        required: false
    },
    note: {
        type: noteSchema,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Generate short URL before saving
urlSchema.pre('save', async function(next) {
    if (!this.isModified('shortUrl')) {
        this.shortUrl = shortid.generate();
    }
    next();
});

module.exports = mongoose.model('Url', urlSchema); 