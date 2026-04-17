import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendVerificationEmail = async (email: string, token: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/api/auth/verify?token=${token}`;

    const mailOptions = {
        from: `"PsychoHealth" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Xác thực tài khoản PsychoHealth của bạn',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; borderRadius: 10px;">
                <h2 style="color: #6366f1; textAlign: center;">Chào mừng bạn đến với PsychoHealth!</h2>
                <p>Cảm ơn bạn đã đăng ký tài khoản. Vui lòng nhấn vào nút bên dưới để xác thực địa chỉ email của mình:</p>
                <div style="textAlign: center; margin: 30px 0;">
                    <a href="${verificationUrl}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                        Xác thực tài khoản
                    </a>
                </div>
                <p>Hoặc sao chép liên kết này vào trình duyệt của bạn:</p>
                <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 12px; color: #999; textAlign: center;">Đây là email tự động, vui lòng không trả lời email này.</p>
            </div>
        `,
    };

    return transporter.sendMail(mailOptions);
};

export const sendAppointmentNotificationEmail = async (expertEmail: string, appointmentDetails: any) => {
    const mailOptions = {
        from: `"PsychoHealth" <${process.env.EMAIL_USER}>`,
        to: expertEmail,
        subject: 'Thông báo: Có lịch hẹn tư vấn mới',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; borderRadius: 10px;">
                <h2 style="color: #6366f1;">Bạn có lịch hẹn mới!</h2>
                <p>Xin chào chuyên gia,</p>
                <p>Một bệnh nhân vừa đặt lịch hẹn tư vấn với bạn. Dưới đây là thông tin chi tiết:</p>
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Ngày giờ:</strong> ${new Date(appointmentDetails.time).toLocaleString('vi-VN')}</p>
                    <p><strong>Hình thức:</strong> ${appointmentDetails.type === 'online' ? 'Trực tuyến (Video Call)' : 'Trực tiếp tại phòng khám'}</p>
                    <p><strong>Bệnh nhân:</strong> ${appointmentDetails.userName}</p>
                </div>
                <p>Vui lòng đăng nhập vào hệ thống để xác nhận hoặc quản lý lịch hẹn.</p>
                <div style="textAlign: center; margin: 30px 0;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/appointments" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                        Quản lý lịch hẹn
                    </a>
                </div>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 12px; color: #999; textAlign: center;">© 2026 PsychoHealth Team</p>
            </div>
        `,
    };

    return transporter.sendMail(mailOptions);
};

export const sendAppointmentConfirmationEmail = async (patientEmail: string, appointmentDetails: any) => {
    const mailOptions = {
        from: `"PsychoHealth" <${process.env.EMAIL_USER}>`,
        to: patientEmail,
        subject: 'Xác nhận: Lịch hẹn của bạn đã được chấp nhận',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; borderRadius: 10px;">
                <h2 style="color: #22c55e;">Lịch hẹn đã được xác nhận!</h2>
                <p>Xin chào ${appointmentDetails.userName},</p>
                <p>Chuyên gia <b>${appointmentDetails.expertName}</b> đã xác nhận lịch hẹn tư vấn với bạn.</p>
                <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
                    <p><strong>Ngày giờ:</strong> ${new Date(appointmentDetails.time).toLocaleString('vi-VN')}</p>
                    <p><strong>Hình thức:</strong> ${appointmentDetails.type === 'online' ? 'Trực tuyến (Video Call)' : 'Trực tiếp tại phòng khám'}</p>
                    <p><strong>Chuyên gia:</strong> ${appointmentDetails.expertName}</p>
                </div>
                ${appointmentDetails.type === 'online' ? '<p><i>* Bạn có thể truy cập vào hệ thống vào đúng khung giờ trên để bắt đầu cuộc gọi video.</i></p>' : ''}
                <p>Cảm ơn bạn đã tin tưởng dịch vụ của chúng tôi.</p>
                <div style="textAlign: center; margin: 30px 0;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/appointments" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                        Xem chi tiết lịch hẹn
                    </a>
                </div>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 12px; color: #999; textAlign: center;">© 2026 PsychoHealth Team</p>
            </div>
        `,
    };

    return transporter.sendMail(mailOptions);
};
