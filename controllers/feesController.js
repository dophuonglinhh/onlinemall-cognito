const Fee = require("../models/fees");

// Display list of all fees.
exports.fees_list = async function(req, res) {
    try {
        const fees = await Fee.find({});
        res.render('fees', { title: 'Fees', fees: fees, isAdmin: req.session.user && req.session.user.account_type === 'admin' });
    } catch (err) {
        res.render('error', { error: err });
    }
};

// Display Fee create form on GET.
exports.fees_create_get = function(req, res) {
    res.render('fee_form', { title: 'Create Fee', fee: null });
};

// Handle Fee create on POST.
exports.fees_create_post = async function(req, res) {
    try {
        const { name, type, description, amount } = req.body;
        
        // Validate required fields
        if (!name || !type || !description || !amount) {
            return res.render('fee_form', { 
                title: 'Create Fee', 
                fee: null, 
                error: 'All fields are required.' 
            });
        }
        
        const newFee = new Fee({
            name: name.trim(),
            type: type.trim(),
            description: description.trim(),
            amount: amount.trim()
        });
        
        await newFee.save();
        console.log('New fee created:', newFee);
        res.redirect('/fees');
    } catch (err) {
        console.error('Error creating fee:', err);
        res.render('fee_form', { 
            title: 'Create Fee', 
            fee: null, 
            error: 'Failed to create fee. Please try again.' 
        });
    }
};

// Display Fee update form on GET.
exports.fees_update_get = async function(req, res) {
    try {
        const fee = await Fee.findById(req.params.id);
        res.render('fee_form', { title: 'Edit Fee', fee: fee });
    } catch (err) {
        res.render('error', { error: err });
    }
};

// Handle Fee update on POST.
exports.fees_update_post = async function(req, res) {
    try {
        const { name, type, description, amount } = req.body;
        
        // Validate required fields
        if (!name || !type || !description || !amount) {
            const fee = await Fee.findById(req.params.id);
            return res.render('fee_form', { 
                title: 'Edit Fee', 
                fee: fee, 
                error: 'All fields are required.' 
            });
        }
        
        const updatedFee = await Fee.findByIdAndUpdate(
            req.params.id, 
            {
                name: name.trim(),
                type: type.trim(),
                description: description.trim(),
                amount: amount.trim()
            }, 
            { new: true }
        );
        
        console.log('Fee updated:', updatedFee);
        res.redirect('/fees');
    } catch (err) {
        console.error('Error updating fee:', err);
        try {
            const fee = await Fee.findById(req.params.id);
            res.render('fee_form', { 
                title: 'Edit Fee', 
                fee: fee, 
                error: 'Failed to update fee. Please try again.' 
            });
        } catch (fetchErr) {
            res.render('error', { error: err });
        }
    }
};

// Display detail page for a specific Fee.
exports.fees_detail = async function(req, res) {
    try {
        const fee = await Fee.findById(req.params.id);
        if (!fee) {
            return res.render('error', { error: { message: 'Fee not found' } });
        }
        res.render('fee_detail', { title: 'Fee Detail', fee: fee });
    } catch (err) {
        console.error('Error fetching fee details:', err);
        res.render('error', { error: err });
    }
};

// Handle Fee delete on POST.
exports.fees_delete_post = async function(req, res) {
    try {
        const deletedFee = await Fee.findByIdAndDelete(req.params.id);
        if (!deletedFee) {
            return res.render('error', { error: { message: 'Fee not found' } });
        }
        console.log('Fee deleted:', deletedFee);
        res.redirect('/fees');
    } catch (err) {
        console.error('Error deleting fee:', err);
        res.render('error', { error: err });
    }
};
