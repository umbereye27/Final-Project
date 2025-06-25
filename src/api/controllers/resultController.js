const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const Result = require('../models/Result');
const User = require('../models/User');

// Your existing getResultsByDateRange function

const generatePDFReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const userId = req.user.id;

        if (!startDate) {
            return res.status(400).json({
                success: false,
                message: "Start date is required."
            });
        }

        // Create date filter
        const dateFilter = {};
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        dateFilter.createdAt = { $gte: start };

        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            dateFilter.createdAt.$lte = end;
        } else {
            // If no end date, use the same day as end date
            const sameDay = new Date(startDate);
            sameDay.setHours(23, 59, 59, 999);
            dateFilter.createdAt.$lte = sameDay;
        }

        // Get results for the date range
        const results = await Result.find(dateFilter)
            .populate('user', 'username email role')
            .sort({ createdAt: -1 })
            .limit(1000); // Limit to 1000 results for PDF

        if (!results || results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No results found for the specified date range."
            });
        }

        // Get user stats
        const totalUsers = await User.countDocuments();
        const adminCount = await User.countDocuments({ role: 'admin' });
        const userCount = await User.countDocuments({ role: 'user' });
        const adminPercentage = Math.round((adminCount / totalUsers) * 100) || 0;
        const userPercentage = Math.round((userCount / totalUsers) * 100) || 0;

        // Get user info for sending email
        const user = await User.findById(userId);
        if (!user || !user.email) {
            return res.status(404).json({
                success: false,
                message: "User email not found."
            });
        }

        // Create PDF document
        const doc = new PDFDocument({ margin: 50 });
        const filename = `results-report-${startDate}-to-${endDate || startDate}.pdf`;
        const filePath = path.join(__dirname, '../../temp', filename);
        
        // Ensure temp directory exists
        if (!fs.existsSync(path.join(__dirname, '../../temp'))) {
            fs.mkdirSync(path.join(__dirname, '../../temp'), { recursive: true });
        }
        
        // Pipe PDF to file
        doc.pipe(fs.createWriteStream(filePath));

        // Add title
        doc.fontSize(25).text('Skin Lesion Detection Results Report', { align: 'center' });
        doc.moveDown();

        // Add date range
        doc.fontSize(14).text(`Date Range: ${new Date(startDate).toLocaleDateString()} to ${endDate ? new Date(endDate).toLocaleDateString() : new Date(startDate).toLocaleDateString()}`);
        doc.moveDown();

        // Add timestamp
        doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`);
        doc.moveDown();

        // Add user stats
        doc.fontSize(16).text('User Statistics:');
        doc.fontSize(12).text(`Total Users: ${totalUsers}`);
        doc.text(`Admin Users: ${adminCount} (${adminPercentage}%)`);
        doc.text(`Regular Users: ${userCount} (${userPercentage}%)`);
        doc.moveDown();

        // Add results summary
        doc.fontSize(16).text('Results Summary:');
        doc.fontSize(12).text(`Total Results: ${results.length}`);
        
        // Group by prediction
        const predictionGroups = {};
        results.forEach(result => {
            if (!predictionGroups[result.prediction]) {
                predictionGroups[result.prediction] = 0;
            }
            predictionGroups[result.prediction]++;
        });
        
        // Add prediction breakdown
        doc.moveDown();
        doc.fontSize(14).text('Prediction Breakdown:');
        Object.keys(predictionGroups).forEach(prediction => {
            const percentage = Math.round((predictionGroups[prediction] / results.length) * 100);
            doc.fontSize(12).text(`${prediction}: ${predictionGroups[prediction]} (${percentage}%)`);
        });
        doc.moveDown();

        // Add results table
        doc.fontSize(16).text('Detailed Results:');
        doc.moveDown();

        // Table headers
        const tableTop = doc.y;
        const tableHeaders = ['Date', 'Prediction', 'Confidence', 'User'];
        const columnWidth = (doc.page.width - 100) / tableHeaders.length;
        
        // Draw headers
        doc.fontSize(12);
        doc.font('Helvetica-Bold');
        tableHeaders.forEach((header, i) => {
            doc.text(header, 50 + (i * columnWidth), tableTop, { width: columnWidth, align: 'left' });
        });
        doc.moveDown();
        doc.font('Helvetica');

        // Draw rows
        let rowTop = doc.y;
        results.slice(0, 100).forEach((result, i) => { // Limit to first 100 for table display
            // Check if we need a new page
            if (rowTop > doc.page.height - 100) {
                doc.addPage();
                rowTop = 50;
                
                // Redraw headers on new page
                doc.font('Helvetica-Bold');
                tableHeaders.forEach((header, i) => {
                    doc.text(header, 50 + (i * columnWidth), rowTop, { width: columnWidth, align: 'left' });
                });
                doc.moveDown();
                doc.font('Helvetica');
                rowTop = doc.y;
            }
            
            // Format date
            const date = new Date(result.createdAt).toLocaleDateString();
            
            // Draw row
            doc.text(date, 50, rowTop, { width: columnWidth, align: 'left' });
            doc.text(result.prediction, 50 + columnWidth, rowTop, { width: columnWidth, align: 'left' });
            doc.text(`${result.confidence.toFixed(2)}%`, 50 + (2 * columnWidth), rowTop, { width: columnWidth, align: 'left' });
            doc.text(result.user ? result.user.username : 'Unknown', 50 + (3 * columnWidth), rowTop, { width: columnWidth, align: 'left' });
            
            doc.moveDown();
            rowTop = doc.y;
        });

        // Add note if there are more results
        if (results.length > 100) {
            doc.moveDown();
            doc.fontSize(10).text(`Note: This report shows only the first 100 of ${results.length} total results.`, { italic: true });
        }

        // Finalize PDF
        doc.end();

        // Wait for PDF to be created
        setTimeout(async () => {
            try {
                // Create email transporter
                const transporter = nodemailer.createTransport({
                    service: 'gmail', // or your email service
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS
                    }
                });

                // Send email with PDF attachment
                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: user.email,
                    subject: 'Skin Lesion Detection Results Report',
                    text: `Please find attached your results report for the period ${new Date(startDate).toLocaleDateString()} to ${endDate ? new Date(endDate).toLocaleDateString() : new Date(startDate).toLocaleDateString()}.`,
                    attachments: [
                        {
                            filename: filename,
                            path: filePath
                        }
                    ]
                });

                // Clean up file after sending
                fs.unlinkSync(filePath);

                res.status(200).json({
                    success: true,
                    message: `PDF report generated and sent to ${user.email}`
                });
            } catch (emailError) {
                console.error('Error sending email:', emailError);
                res.status(500).json({
                    success: false,
                    message: 'Failed to send PDF report email',
                    error: emailError.message
                });
            }
        }, 2000); // Wait 2 seconds for PDF to be created

    } catch (error) {
        console.error('Error generating PDF report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate PDF report',
            error: error.message
        });
    }
};

module.exports = {
    getResultsByDateRange,
    generatePDFReport,
    // Include your other controller functions here
};