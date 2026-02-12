const Product = require('../models/Product');
const Seller = require('../models/Seller');
const SubCategory = require('../models/SubCategory');


// 🌟 Helper: இமேஜ் மற்றும் வீடியோ லிங்க்குகளை முழுமையான URL ஆக மாற்ற
const formatProductMedia = (product, req) => {
    const baseUrl = `${req.protocol}://${req.get('host')}/uploads/`;
    // Mongoose ஆப்ஜெக்ட்டை சுத்தமான JSON ஆக மாற்றுதல்
    const doc = product.toObject ? product.toObject() : product;

    return {
        ...doc,
        images: (doc.images || []).map(img => 
            (img && img.startsWith('http')) ? img : baseUrl + img
        ),
        video: doc.video ? 
            (doc.video.startsWith('http') ? doc.video : baseUrl + doc.video) 
            : ""
    };
};

exports.createProduct = async (req, res) => {
    try {
        // 1. Get Seller ID from Token (req.user.id) or Request Body (for testing)
        const sellerId = req.user?.id || req.body.seller;

        if (!sellerId) {
            return res.status(400).json({ success: false, message: "Seller ID is missing in token or body" });
        }

        // 2. Validate Seller
        const seller = await Seller.findById(sellerId);
        
        // 💡 DEBUG LOG: Check this in your terminal to see which ID is being sent
        console.log("Attempting to create product for Seller ID:", sellerId);

        if (!seller) {
            return res.status(404).json({ 
                success: false, 
                message: "Seller not found. Ensure your User ID is registered as a Seller.",
                receivedId: sellerId 
            });
        }

        // 3. Validate SubCategory
        const subCat = await SubCategory.findById(req.body.subCategory);
        if (!subCat) return res.status(400).json({ success: false, message: "Invalid SubCategory ID" });

        const taxRate = subCat.gstRate || subCat.gstPercentage || 0;

        // 4. Media Handling
        const images = req.files && req.files['images'] ? req.files['images'].map(f => f.filename) : [];
        const video = req.files && req.files['video'] ? req.files['video'][0].filename : "";

        // 5. Discount Calculation
        const discount = req.body.mrp > req.body.price 
            ? Math.round(((req.body.mrp - req.body.price) / req.body.mrp) * 100) 
            : 0;

        // 6. Save Product
        const product = new Product({
            ...req.body,
            hsnCode: subCat.hsnCode, 
            gstPercentage: taxRate,
            discountPercentage: discount,
            images,
            video,
            seller: seller._id,
            variants: req.body.variants ? (typeof req.body.variants === 'string' ? JSON.parse(req.body.variants) : req.body.variants) : [] 
        });

        await product.save();
        res.status(201).json({ success: true, data: product });

    } catch (err) { 
        console.error("Create Product Error:", err);
        res.status(400).json({ success: false, error: err.message }); 
    }
};

// --- 🌟 GET ALL PRODUCTS (Optimized for Large Scale) ---
exports.getAllProducts = async (req, res) => {
    try {
        // 1. Get page and limit from query, default to page 1, limit 20
        const { category, subCategory, search, page = 1, limit = 20 } = req.query;
        
        let query = { isArchived: { $ne: true } };
        if (category) query.category = category;
        if (subCategory) query.subCategory = subCategory;
        if (search) query.name = { $regex: search, $options: "i" };

        // 2. Calculate how many items to skip
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // 3. Use .lean() to get plain JS objects instead of heavy Mongoose documents
        const products = await Product.find(query)
            .populate("category subCategory", "name image")
            .populate("seller", "shopName name address")
            .sort({ createdAt: -1 })
            .skip(skip)   // Skip previous pages
            .limit(parseInt(limit)) // Only fetch 20
            .lean(); 

        const baseUrl = `${req.protocol}://${req.get('host')}/uploads/`;
        
        const data = products.map(p => ({
            ...p,
            images: p.images ? p.images.map(img => 
                (img && img.startsWith('http')) ? img : baseUrl + img
            ) : [],
            video: p.video ? (p.video.startsWith('http') ? p.video : baseUrl + p.video) : ""
        }));

        res.status(200).json({ 
            success: true, 
            count: data.length,
            currentPage: Number(page),
            data 
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// --- 🌟 3. GET PRODUCT BY ID ---
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category subCategory')
            .populate('seller', 'name shopName phone address');

        if (!product) return res.status(404).json({ success: false, message: "Product not found" });

        const data = formatProductMedia(product, req);
        res.status(200).json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getMyProducts = async (req, res) => {
    try {
        // 1. Check matching with Step 1 (req.user.id)
        if (!req.user || !req.user.id) {
            return res.status(401).json({ success: false, message: "Seller ID missing in token" });
        }

        // 2. Query matching the field name
        const products = await Product.find({ 
            seller: req.user.id, 
            isArchived: { $ne: true } 
        }).populate('category subCategory').lean();

        // 3. Image URL Fix (Avoiding double domains)
        const baseUrl = `${req.protocol}://${req.get('host')}/uploads/products/`;

        const data = products.map(p => ({
            ...p,
            images: p.images ? p.images.map(img => 
                (img && (img.startsWith('http') || img.includes('zhopingo.in'))) 
                ? img 
                : baseUrl + img
            ) : []
        }));

        res.json({ success: true, count: data.length, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
// --- 🌟 5. UPDATE & DELETE ---
exports.updateProduct = async (req, res) => {
    try {
        const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, data: updated });
    } catch (err) { res.status(400).json({ success: false, error: err.message }); }
};

exports.deleteProduct = async (req, res) => {
    try {
        // 1. முதலில் அந்த தயாரிப்பைக் கண்டறியவும்
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // 2. இமேஜ்களை சர்வரில் இருந்து நீக்குதல்
        if (product.images && product.images.length > 0) {
            product.images.forEach(imgName => {
                // உங்கள் multerConfig படி பாத்: public/uploads/
                const imagePath = path.join(__dirname, '../public/uploads/', imgName);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath); // ஃபைலை டெலீட் செய்யும்
                }
            });
        }

        // 3. வீடியோவை சர்வரில் இருந்து நீக்குதல்
        if (product.video) {
            const videoPath = path.join(__dirname, '../public/uploads/', product.video);
            if (fs.existsSync(videoPath)) {
                fs.unlinkSync(videoPath); // வீடியோவை டெலீட் செய்யும்
            }
        }

        // 4. இப்போது டேட்டாபேஸில் இருந்து நீக்கவும் (முழுமையாக நீக்க Delete பயன்படுத்தவும்)
        await Product.findByIdAndDelete(req.params.id);

        res.json({ success: true, message: "Product and its media files deleted successfully!" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};exports.getSimilarProducts = async (req, res) => {
    try {
        const { id } = req.params; // தற்போது பார்க்கும் தயாரிப்பின் ID
        const { category } = req.query; // URL-ல் வரும் Category ID

        // ஐடி செக் செய்தல்
        if (!category || category === 'undefined') {
            return res.status(400).json({ success: false, message: "Valid Category ID is required" });
        }

        // 🌟 லாஜிக்: அதே பிரிவில் இருக்க வேண்டும், ஆனால் அதே தயாரிப்பாக இருக்கக்கூடாது
        const similarProducts = await Product.find({
            category: category,
            _id: { $ne: id }, // $ne = Not Equal (தற்போதைய தயாரிப்பைத் தவிர்க்க)
            isArchived: { $ne: true }
        })
        .limit(6) // 6 தயாரிப்புகள் போதும்
        .populate('category subCategory', 'name')
        .lean();

        const baseUrl = `${req.protocol}://${req.get('host')}/uploads/`;
        
        // இமேஜ் URL-களைச் சேர்த்தல்
        const data = similarProducts.map(p => ({
            ...p,
            images: p.images ? p.images.map(img => 
                (img && img.startsWith('http')) ? img : baseUrl + img
            ) : []
        }));

        res.json({
            success: true,
            count: data.length,
            data: data
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};


// const Product = require('../models/Product');
// const Seller = require('../models/Seller');
// const SubCategory = require('../models/SubCategory');

// // 🌟 1. CREATE PRODUCT (With Inheritance & Media)
// exports.createProduct = async (req, res) => {
//     try {
//         // 🌟 லாகின் செய்யாமல் டெஸ்ட் செய்யும்போது செல்லர் ஐடியை பாடியில் இருந்து எடுக்கும் வசதி
//         const sellerId = req.user?.id || req.body.seller; 
//         const seller = await Seller.findById(sellerId);
//         if (!seller) return res.status(404).json({ success: false, message: "Seller not found" });

//         const subCat = await SubCategory.findById(req.body.subCategory);
//         if (!subCat) return res.status(400).json({ success: false, message: "Invalid SubCategory" });

//         // 🌟 செக்: சப்-கேட்டகரியில் gstRate அல்லது gstPercentage எது இருந்தாலும் அதை எடுக்கும்படி மாற்றுங்கள்
//         const taxRate = subCat.gstRate || subCat.gstPercentage;
        
//         if (!taxRate) {
//             return res.status(400).json({ 
//                 success: false, 
//                 message: "Selected SubCategory does not have a GST rate. Please check HSN Master." 
//             });
//         }

//         const images = req.files['images'] ? req.files['images'].map(f => f.filename) : [];
//         const video = req.files['video'] ? req.files['video'][0].filename : "";

//         const discount = req.body.mrp > req.body.price 
//             ? Math.round(((req.body.mrp - req.body.price) / req.body.mrp) * 100) 
//             : 0;

//         const product = new Product({
//             ...req.body,
//             hsnCode: subCat.hsnCode, 
//             gstPercentage: taxRate, // 🌟 இப்போது இது காலியாக இருக்காது
//             discountPercentage: discount,
//             images,
//             video,
//             seller: seller._id,
//             variants: req.body.variants ? JSON.parse(req.body.variants) : [] 
//         });

//         await product.save();
//         res.status(201).json({ success: true, data: product });
//     } catch (err) { 
//         res.status(400).json({ success: false, error: err.message }); 
//     }
// };
// // 🌟 GET ALL PRODUCTS (Customer View)
// // 🌟 2. GET ALL PRODUCTS (முழுமையான 5000+ தயாரிப்புகளை எடுக்கும்)
// exports.getAllProducts = async (req, res) => {
//     try {
//         const { category, subCategory, search } = req.query;
        
//         // 🌟 திருத்தம்: isArchived 'true' இல்லாத அனைத்தையும் எடுக்கும் (சீட் டேட்டாவையும் சேர்த்து)
//         let query = { isArchived: { $ne: true } }; 

//         if (category) query.category = category;
//         if (subCategory) query.subCategory = subCategory;
//         if (search) query.name = { $regex: search, $options: 'i' };

//         const products = await Product.find(query)
//             .populate('category subCategory', 'name image')
//             .populate('seller', 'shopName name address')
//             .sort({ createdAt: -1 });

//         const baseUrl = `${req.protocol}://${req.get('host')}/uploads/`;
        
//         const data = products.map(p => {
//             const doc = p._doc;
//             return {
//                 ...doc,
//                 images: doc.images ? doc.images.map(img => formatMediaUrl(img, baseUrl)) : [],
//                 video: formatMediaUrl(doc.video, baseUrl)
//             };
//         });

//         res.json({ success: true, count: data.length, data: data });
//     } catch (err) { res.status(500).json({ success: false, error: err.message }); }
// };

// // 🌟 3. GET PRODUCT BY ID (Detailed View)
// exports.getProductById = async (req, res) => {
//     try {
//         const product = await Product.findById(req.params.id)
//             .populate('category subCategory')
//             .populate('seller', 'name shopName phone address fssaiNumber');

//         if (!product) return res.status(404).json({ success: false, message: "Product not found" });

//         const baseUrl = `${req.protocol}://${req.get('host')}/uploads/`;
//         const updatedProduct = {
//             ...product._doc,
//             images: product.images ? product.images.map(img => formatMediaUrl(img, baseUrl)) : [],
//             video: formatMediaUrl(product.video, baseUrl)
//         };

//         res.status(200).json({ success: true, data: updatedProduct });
//     } catch (err) { res.status(500).json({ success: false, error: err.message }); }
// };

// // 🌟 4. GET MY PRODUCTS (Seller Dashboard)
// exports.getMyProducts = async (req, res) => {
//     try {
//         const products = await Product.find({ seller: req.user.id, isArchived: { $ne: true } })
//             .populate('category subCategory');
//         res.json({ success: true, data: products });
//     } catch (err) { res.status(500).json({ success: false, error: err.message }); }
// };

// // 🌟 5. GET SIMILAR PRODUCTS (ரேண்டம் தயாரிப்புகளுடன்)
// exports.getSimilarProducts = async (req, res) => {
//     try {
//         const { category } = req.query;
//         let query = { isArchived: { $ne: true }, _id: { $ne: req.params.id } };

//         // கேட்டகிரி இருந்தால் அதே கேட்டகிரி, இல்லையென்றால் ரேண்டம் தயாரிப்புகள்
//         if (category) query.category = category;

//         const products = await Product.find(query).limit(10).sort({ createdAt: -1 });

//         const baseUrl = `${req.protocol}://${req.get('host')}/uploads/`;
//         const data = products.map(p => ({
//             ...p._doc,
//             images: p.images ? p.images.map(img => formatMediaUrl(img, baseUrl)) : []
//         }));

//         res.json({ success: true, data });
//     } catch (err) { res.status(500).json({ success: false, error: err.message }); }
// };

// // 🌟 6. UPDATE & ARCHIVE (CRUD)
// exports.updateProduct = async (req, res) => {
//     try {
//         const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
//         res.json({ success: true, data: updated });
//     } catch (err) { res.status(400).json({ success: false, error: err.message }); }
// };

// exports.deleteProduct = async (req, res) => {
//     try {
//         await Product.findByIdAndUpdate(req.params.id, { isArchived: true });
//         res.json({ success: true, message: "Product Archived successfully" });
//     } catch (err) { res.status(500).json({ success: false, error: err.message }); }
// };

// // 🌟 7. RATE PRODUCT
// exports.rateProduct = async (req, res) => {
//     try {
//         const { rating, comment } = req.body;
//         const product = await Product.findById(req.params.id);
        
//         product.ratings.push({ userId: req.user.id, rating, comment });
//         const total = product.ratings.reduce((acc, curr) => acc + curr.rating, 0);
//         product.averageRating = (total / product.ratings.length).toFixed(1);

//         await product.save();
//         res.json({ success: true, averageRating: product.averageRating });
//     } catch (err) { res.status(500).json({ error: err.message }); }
// };// const express = require('express');
// const router = express.Router();
// const productCtrl = require('../controllers/productController');
// const { protect } = require('../middleware/authMiddleware');
// const upload = require('../middleware/multerConfig'); 

// // Public Routes (Customer App)
// router.get('/all', productCtrl.getAllProducts);
// router.get('/detail/:id', productCtrl.getProductById);
// router.get('/similar/:id', productCtrl.getSimilarProducts);

// // Protected Routes (Seller Dashboard)
// router.get('/my-products', protect, productCtrl.getMyProducts);
// router.post('/add', protect, upload.fields([
//     { name: 'images', maxCount: 5 },
//     { name: 'video', maxCount: 1 }
// ]), productCtrl.createProduct);

// router.put('/update/:id', protect, productCtrl.updateProduct);
// router.delete('/delete/:id', protect, productCtrl.deleteProduct);

// // User Interaction
// router.post('/rate/:id', protect, productCtrl.rateProduct);

// module.exports = router;


// const express = require('express');
// const router = express.Router();
// const productCtrl = require('../controllers/productController');
// const { protect } = require('../middleware/authMiddleware');
// const { upload, processImages } = require('../middleware/multerConfig');

// // 🔓 பொதுவான ரூட்கள் (Customer)
// router.get('/all', productCtrl.getAllProducts);
// router.get('/detail/:id', productCtrl.getProductById);

// // 🔒 பாதுகாக்கப்பட்ட ரூட்கள் (Seller)
// router.get('/my-products', protect, productCtrl.getMyProducts);

// // 🌟 மல்டிபிள் இமேஜ் அப்லோடு வசதியுடன் கூடிய ஆட் ரூட்
// router.post('/add', protect, upload.fields([
//     { name: 'images', maxCount: 5 },
//     { name: 'video', maxCount: 1 }
// ]), productCtrl.createProduct);

// router.put('/update/:id', protect, productCtrl.updateProduct);
// router.delete('/delete/:id', protect, productCtrl.deleteProduct);
// // router.get('/similar/:id', productCtrl.getSimilarProducts);

// module.exports = router;




const express = require('express');
const router = express.Router();
const productCtrl = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');

// 🌟 UPDATE THIS IMPORT: Use curly braces to get both upload and processImages
const { upload, processImages } = require('../middleware/multerConfig'); 

router.get('/all', productCtrl.getAllProducts);
router.get('/detail/:id', productCtrl.getProductById);
router.get('/my-products', protect, productCtrl.getMyProducts);

// 🌟 UPDATE THIS ROUTE: Add processImages after upload.fields
router.post('/add', protect, upload.fields([
    { name: 'images', maxCount: 5 },
    { name: 'video', maxCount: 1 }
]), processImages, productCtrl.createProduct); // 🌟 Added processImages here

router.put('/update/:id', protect, productCtrl.updateProduct);
router.delete('/delete/:id', protect, productCtrl.deleteProduct);
// router.post('/rate/:id', protect, productCtrl.rateProduct);
router.get('/similar/:id', productCtrl.getSimilarProducts);

module.exports = router;