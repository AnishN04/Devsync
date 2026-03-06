const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: process.env.MAIL_PORT == 465,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});

const sendInvitationEmail = async (email, projectName, inviteLink) => {
    const mailOptions = {
        from: `"DevSync" <${process.env.MAIL_USER}>`,
        to: email,
        subject: `You've been invited to join ${projectName} on DevSync`,
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #4f46e5;">Welcome to DevSync!</h2>
                <p>Hello,</p>
                <p>You've been invited to collaborate on the project <strong>${projectName}</strong>.</p>
                <div style="margin: 30px 0;">
                    <a href="${inviteLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Accept Invitation</a>
                </div>
                <p style="color: #666; font-size: 14px;">If you didn't expect this invitation, you can safely ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="color: #999; font-size: 12px;">DevSync — Real-time Collaboration for Developers</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

module.exports = { sendInvitationEmail };
