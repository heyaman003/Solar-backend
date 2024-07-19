const nodemailer = require('nodemailer');
const dns = require('dns');
const { promisify } = require('util');

const resolveMx = promisify(dns.resolveMx);

async function verifyEmail(email) {
    const domain = email.split('@')[1];

    try {
        const mxRecords = await resolveMx(domain);
        if (mxRecords.length === 0) {
            throw new Error('No MX records found for domain.');
        }

        mxRecords.sort((a, b) => a.priority - b.priority);

        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'heyaman329@gmail.com', // replace with your email
                pass: '@Helloaman003'   // replace with your email password
            }
        });

        let result = await transporter.verify();

        if (result) {
            return await new Promise((resolve, reject) => {
                transporter.sendMail({
                    from: 'heyaman329@gmail.com',
                    to: email,
                    subject: 'Test Email',
                    text: 'Thankyou',
                }, (err, info) => {
                    if (err) {
                        if (err.responseCode === 550 || err.responseCode === 551) {
                            // 550/551 are typical response codes for invalid email addresses
                            resolve(false);
                        } else {
                            reject(err);
                        }
                    } else {
                        resolve(true);
                    }
                });
            });
        }
    } catch (error) {
        console.error('Verification failed:', error);
        return false;
    }
}

(async () => {
    const email = 'example@example.com';
    const isValid = await verifyEmail(email);
    console.log(`Email ${email} is ${isValid ? 'valid' : 'invalid'}`);
})();
