const express = require('express');
const router = express.Router();
const shortid = require('shortid');
const Url = require('../models/url');
const QRCode = require('qrcode');

// Create short URL
router.post('/shorten', async(req, res) => {
    try {
        const { originalUrl, note } = req.body;
        const userId = req.user.id;

        // Check if URL already exists for this user
        const existingUrl = await Url.findOne({ originalUrl, userId });
        if (existingUrl) {
            return res.json(existingUrl);
        }

        // Generate short URL
        const shortUrl = shortid.generate();

        // Qrcode
        let baseUrl = process.env.BASE_URL || 'http://localhost:3000';

        baseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
        console.log("Using base URL for QR code:", baseUrl);
        const qrCodeImage = await QRCode.toDataURL(`${baseUrl}/${shortUrl}`);

        // Create new URL document
        const url = new Url({
            originalUrl,
            shortUrl,
            userId,
            qrCode: qrCodeImage,
            note: note ? { content: note, author: userId } : undefined
        });

        await url.save();
        res.status(201).json(url);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all URLs for a user
router.get('/my-urls', async(req, res) => {
    try {
        const userId = req.user.id;
        const urls = await Url.find({ userId }).sort({ createdAt: -1 });
        res.status(200).json(urls);
    } catch (error) {
        console.error("Error fetching URLs:", error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get a single URL by shortUrl
router.get('/url/:shortUrl', async(req, res) => {
    try {
        const userId = req.user.id;
        const url = await Url.findOne({ shortUrl: req.params.shortUrl, userId });

        if (!url) {
            return res.status(404).json({ error: 'URL not found' });
        }

        res.status(200).json(url);
    } catch (error) {
        console.error("Error fetching URL:", error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update a URL
router.put('/:shortUrl', async(req, res) => {
    try {
        const userId = req.user.id;
        const { originalUrl, shortUrl, generateQRCode } = req.body;

        const url = await Url.findOne({ shortUrl: req.params.shortUrl, userId });

        if (!url) {
            return res.status(404).json({ error: 'URL not found' });
        }

        let updated = false;

        // Only update shortUrl if it's provided in the request
        if (shortUrl) {
            // Check if the new shortUrl is already taken
            const existingUrl = await Url.findOne({ shortUrl, _id: { $ne: url._id } });
            if (existingUrl) {
                return res.status(409).json({ error: 'Short URL already taken' });
            }

            console.log(`Updating shortUrl from ${url.shortUrl} to ${shortUrl}`);
            url.shortUrl = shortUrl;
            updated = true;
        }

        // Only update originalUrl if it's provided in the request
        if (originalUrl) {
            console.log(`Updating originalUrl from ${url.originalUrl} to ${originalUrl}`);
            url.originalUrl = originalUrl;
            updated = true;
        }

        // Only regenerate QR code if requested or if shortUrl/originalUrl changed
        if ((updated && (originalUrl || shortUrl)) || generateQRCode === true) {
            let baseUrl = process.env.BASE_URL || "http://localhost:3001";

            baseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
            console.log("Using base URL for QR code update:", baseUrl);

            const fullUrl = `${baseUrl}/${url.shortUrl}`;
            console.log("Generating new QR code for:", fullUrl);
            url.qrCode = await QRCode.toDataURL(fullUrl);
            updated = true;
        }

        if (updated) {
            url.markModified("originalUrl");
            url.markModified("shortUrl");
            url.markModified("qrCode");

            console.log("Saving URL updates...");
            const savedUrl = await url.save();
            console.log("URL after save:", savedUrl);

            const verifiedUrl = await Url.findById(url._id);
            console.log("URL verified from database after save:", verifiedUrl);

            return res.status(200).json(verifiedUrl);
        } else {
            console.log("No changes detected, returning original URL");
            return res.status(200).json(url);
        }

    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete a URL
router.delete('/:shortUrl', async(req, res) => {
    try {
        const userId = req.user.id;
        const url = await Url.findOne({ shortUrl: req.params.shortUrl, userId });

        if (!url) {
            return res.status(404).json({ error: 'URL not found' });
        }

        await url.deleteOne();
        res.json({ message: 'URL deleted successfully' });
    } catch (error) {
        console.error("Error deleting URL:", error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Redirect to original URL
router.get('/:shortUrl', async(req, res) => {
    try {
        const { shortUrl } = req.params;

        const url = await Url.findOne({ shortUrl });

        if (!url) {
            return res.status(404).json({ error: 'URL not found' });
        }

        // Increment clicks
        url.clicks += 1;
        await url.save();

        // Redirect to original URL
        let redirectUrl = url.originalUrl;
        if (!redirectUrl.startsWith("http://") &&
            !redirectUrl.startsWith("https://")
        ) {
            redirectUrl = "https://" + redirectUrl;
            console.log("Added https:// protocol. New redirect URL:", redirectUrl);
        }
        res.redirect(redirectUrl);
    } catch (error) {
        console.error("Error redirecting:", error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Note CRUD Operations

// Create/Update note for a URL
router.post('/:shortUrl/note', async(req, res) => {
    try {
        const userId = req.user.id;
        const { content } = req.body;

        // Find the URL by shortUrl without modifying it
        const url = await Url.findOne({ shortUrl: req.params.shortUrl, userId });
        if (!url) {
            return res.status(404).json({ error: 'URL not found' });
        }

        // Create a new note object
        const newNote = {
            content,
            author: userId
        };

        // Update only the note field
        await Url.updateOne({ _id: url._id }, { $set: { note: newNote } });

        // Fetch the updated URL to return
        const updatedUrl = await Url.findById(url._id);
        res.json(updatedUrl);
    } catch (error) {
        console.error("Error creating note:", error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update note for a URL
router.put('/:shortUrl/note', async(req, res) => {
    try {
        const userId = req.user.id;
        const { content } = req.body;

        // Find the URL by shortUrl without modifying it
        const url = await Url.findOne({ shortUrl: req.params.shortUrl, userId });
        if (!url) {
            return res.status(404).json({ error: 'URL not found' });
        }

        if (!url.note) {
            return res.status(404).json({ error: 'Note not found' });
        }

        // Update only the note content
        await Url.updateOne({ _id: url._id }, { $set: { 'note.content': content } });

        // Fetch the updated URL to return
        const updatedUrl = await Url.findById(url._id);
        res.json(updatedUrl);
    } catch (error) {
        console.error("Error updating note:", error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete note from a URL
router.delete('/:shortUrl/note', async(req, res) => {
    try {
        const userId = req.user.id;

        // Find the URL by shortUrl without modifying it
        const url = await Url.findOne({ shortUrl: req.params.shortUrl, userId });
        if (!url) {
            return res.status(404).json({ error: 'URL not found' });
        }

        // Remove only the note field
        await Url.updateOne({ _id: url._id }, { $unset: { note: "" } });

        res.json({ message: 'Note deleted successfully' });
    } catch (error) {
        console.error("Error deleting note:", error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;