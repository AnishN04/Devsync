const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: process.env.MAIL_PORT == 465, // true for 465, false for other ports
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});

const sendInvitationEmail = async (email, orgName, role, token) => {
    const inviteUrl = `${process.env.CLIENT_URL}/invitations/accept/${token}`;
    
    const mailOptions = {
        from: `"DevSync" <${process.env.MAIL_USER}>`,
        to: email,
        subject: `Invitation to join ${orgName} on DevSync`,
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #4f46e5;">You've been invited!</h2>
                <p>Hello,</p>
                <p>You have been invited to join <strong>${orgName}</strong> as a <strong>${role}</strong> on DevSync.</p>
                <p>Click the button below to accept the invitation and join the team:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${inviteUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Accept Invitation</a>
                </div>
                <p style="color: #666; font-size: 12px;">If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="color: #666; font-size: 12px;">${inviteUrl}</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="color: #999; font-size: 10px;">This invitation will expire in 7 days.</p>
            </div>
        `,
    };

    return transporter.sendMail(mailOptions);
};

module.exports = {
    sendInvitationEmail,
};
