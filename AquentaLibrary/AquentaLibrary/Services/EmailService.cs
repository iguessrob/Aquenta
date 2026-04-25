using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace AquentaLibrary.Services
{
    public class EmailService
    {
        private readonly IConfiguration _configuration;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task<bool> SendPasswordResetEmail(string adminEmail, string userName, string accountNumber, string resetLink)
        {
            try
            {
                var smtpSettings = _configuration.GetSection("SmtpSettings");
                string host = smtpSettings["Host"] ?? "smtp.gmail.com";
                int port = int.Parse(smtpSettings["Port"] ?? "587");
                string senderEmail = smtpSettings["SenderEmail"] ?? "";
                string senderName = smtpSettings["SenderName"] ?? "AQUENTA Support";
                string password = smtpSettings["Password"] ?? "";

                string subject = "AQUENTA - Password Reset Request from User";
                string body = $@"
                    <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;'>
                        <h2 style='color: #136A4D;'>User Password Reset Request</h2>
                        <p>Hello Admin,</p>
                        <p>The following user has requested a password reset:</p>
                        <div style='background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 20px 0;'>
                            <p><strong>Name:</strong> {userName}</p>
                            <p><strong>Account Number:</strong> {accountNumber}</p>
                        </div>
                        <p>As the administrator, you are the only one who can reset this password. Please click the button below to set a new password for this user:</p>
                        <div style='text-align: center; margin: 30px 0;'>
                            <a href='{resetLink}' style='background-color: #136A4D; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;'>Reset User's Password</a>
                        </div>
                        <p>If the button doesn't work, copy and paste this link into your browser:</p>
                        <p style='word-break: break-all; color: #666;'>{resetLink}</p>
                        <hr style='border: 0; border-top: 1px solid #eee; margin: 20px 0;' />
                        <p style='font-size: 12px; color: #999;'>&copy; 2026 AQUENTA Water Services</p>
                    </div>";

                // LOGGING FOR DEVELOPMENT
                Console.WriteLine("------------------------------------------");
                Console.WriteLine($"SENDING ADMIN NOTIFICATION TO: {adminEmail}");
                Console.WriteLine($"USER REQUESTING: {userName} ({accountNumber})");
                Console.WriteLine($"USING SENDER: {senderEmail}");
                Console.WriteLine("------------------------------------------");

                using (var message = new MailMessage())
                {
                    message.To.Add(new MailAddress(adminEmail));
                    message.From = new MailAddress(senderEmail, senderName);
                    message.Subject = subject;
                    message.Body = body;
                    message.IsBodyHtml = true;

                    using (var client = new SmtpClient(host, port))
                    {
                        client.EnableSsl = true;
                        client.Credentials = new NetworkCredential(senderEmail, password);
                        await client.SendMailAsync(message);
                    }
                }

                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Email sending failed: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner Error: {ex.InnerException.Message}");
                }
                return false;
            }
        }

        public async Task<bool> SendContactInquiryEmail(string adminEmail, string userName, string userEmail, string contactNumber, string accountNumber, string subject, string message)
        {
            try
            {
                var smtpSettings = _configuration.GetSection("SmtpSettings");
                string host = smtpSettings["Host"] ?? "smtp.gmail.com";
                int port = int.Parse(smtpSettings["Port"] ?? "587");
                string senderEmail = smtpSettings["SenderEmail"] ?? "";
                string senderName = smtpSettings["SenderName"] ?? "AQUENTA Support";
                string password = smtpSettings["Password"] ?? "";

                string emailSubject = $"AQUENTA - New Contact Inquiry: {subject}";
                string body = $@"
                    <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;'>
                        <h2 style='color: #136A4D;'>New Inquiry Received</h2>
                        <p>Hello Admin,</p>
                        <p>A new inquiry has been submitted via the website contact form:</p>
                        <div style='background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 20px 0;'>
                            <p><strong>Name:</strong> {userName}</p>
                            <p><strong>Email:</strong> {userEmail}</p>
                            <p><strong>Contact #:</strong> {contactNumber}</p>
                            <p><strong>Account #:</strong> {accountNumber ?? "N/A"}</p>
                            <p><strong>Subject:</strong> {subject}</p>
                        </div>
                        <p><strong>Message:</strong></p>
                        <div style='background-color: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 4px;'>
                            {message.Replace("\n", "<br/>")}
                        </div>
                        <hr style='border: 0; border-top: 1px solid #eee; margin: 20px 0;' />
                        <p style='font-size: 12px; color: #999;'>&copy; 2026 AQUENTA Water Services</p>
                    </div>";

                using (var mailMessage = new MailMessage())
                {
                    mailMessage.To.Add(new MailAddress(adminEmail));
                    mailMessage.From = new MailAddress(senderEmail, senderName);
                    mailMessage.Subject = emailSubject;
                    mailMessage.Body = body;
                    mailMessage.IsBodyHtml = true;

                    using (var client = new SmtpClient(host, port))
                    {
                        client.EnableSsl = true;
                        client.Credentials = new NetworkCredential(senderEmail, password);
                        await client.SendMailAsync(mailMessage);
                    }
                }

                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Contact inquiry email failed: {ex.Message}");
                return false;
            }
        }
        public async Task<bool> SendPasswordResetConfirmationEmail(string userEmail, string userName, string defaultPassword)
        {
            try
            {
                var smtpSettings = _configuration.GetSection("SmtpSettings");
                string host = smtpSettings["Host"] ?? "smtp.gmail.com";
                int port = int.Parse(smtpSettings["Port"] ?? "587");
                string senderEmail = smtpSettings["SenderEmail"] ?? "";
                string senderName = smtpSettings["SenderName"] ?? "AQUENTA Support";
                string password = smtpSettings["Password"] ?? "";

                string emailSubject = "AQUENTA - Password Reset Successful";
                string body = $@"
                    <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;'>
                        <h2 style='color: #136A4D;'>Password Reset Successful</h2>
                        <p>Hello {userName},</p>
                        <p>Your password has been successfully reset by the administrator.</p>
                        <div style='background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 20px 0;'>
                            <p><strong>Your new default password is:</strong> <span style='font-family: monospace; font-size: 1.2em; color: #136A4D;'>{defaultPassword}</span></p>
                        </div>
                        <p>For security reasons, we recommend that you log in and change this password immediately in your profile settings.</p>
                        <div style='text-align: center; margin: 30px 0;'>
                            <a href='https://aquenta-coop.com/auth' style='background-color: #136A4D; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;'>Log In Now</a>
                        </div>
                        <hr style='border: 0; border-top: 1px solid #eee; margin: 20px 0;' />
                        <p style='font-size: 12px; color: #999;'>&copy; 2026 AQUENTA Water Services</p>
                    </div>";

                using (var mailMessage = new MailMessage())
                {
                    mailMessage.To.Add(new MailAddress(userEmail));
                    mailMessage.From = new MailAddress(senderEmail, senderName);
                    mailMessage.Subject = emailSubject;
                    mailMessage.Body = body;
                    mailMessage.IsBodyHtml = true;

                    using (var client = new SmtpClient(host, port))
                    {
                        client.EnableSsl = true;
                        client.Credentials = new NetworkCredential(senderEmail, password);
                        await client.SendMailAsync(mailMessage);
                    }
                }

                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Reset confirmation email failed: {ex.Message}");
                return false;
            }
        }
    }
}
