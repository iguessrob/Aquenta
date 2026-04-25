using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;

namespace AquentaLibrary.Services
{
    public class EmailService
    {
        // For testing, we will use the user's specified email.
        private const string TestRecipient = "mabilanganrob@gmail.com";

        public async Task<bool> SendPasswordResetEmail(string userEmail, string resetLink)
        {
            try
            {
                // In this specific task, the user wants the email to go to mabilanganrob@gmail.com
                string recipient = TestRecipient; 

                string subject = "AQUENTA - Password Reset Request";
                string body = $@"
                    <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;'>
                        <h2 style='color: #136A4D;'>Password Reset</h2>
                        <p>Hello,</p>
                        <p>We received a request to reset your password for your AQUENTA account. If you didn't make this request, you can safely ignore this email.</p>
                        <p>To reset your password, click the button below:</p>
                        <div style='text-align: center; margin: 30px 0;'>
                            <a href='{resetLink}' style='background-color: #136A4D; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;'>Reset Password</a>
                        </div>
                        <p>If the button doesn't work, copy and paste this link into your browser:</p>
                        <p style='word-break: break-all; color: #666;'>{resetLink}</p>
                        <hr style='border: 0; border-top: 1px solid #eee; margin: 20px 0;' />
                        <p style='font-size: 12px; color: #999;'>This link will expire in 1 hour.</p>
                        <p style='font-size: 12px; color: #999;'>&copy; 2026 AQUENTA Water Services</p>
                    </div>";

                // LOGGING FOR DEVELOPMENT (since we don't have SMTP credentials yet)
                Console.WriteLine("------------------------------------------");
                Console.WriteLine($"SENDING EMAIL TO: {recipient}");
                Console.WriteLine($"SUBJECT: {subject}");
                Console.WriteLine($"RESET LINK: {resetLink}");
                Console.WriteLine("------------------------------------------");

                // MOCK SMTP IMPLEMENTATION (Uncomment and configure when ready)
                /*
                using (var message = new MailMessage())
                {
                    message.To.Add(new MailAddress(recipient));
                    message.From = new MailAddress("noreply@aquenta.com", "AQUENTA Support");
                    message.Subject = subject;
                    message.Body = body;
                    message.IsBodyHtml = true;

                    using (var client = new SmtpClient("smtp.gmail.com", 587))
                    {
                        client.EnableSsl = true;
                        client.Credentials = new NetworkCredential("YOUR_EMAIL", "YOUR_APP_PASSWORD");
                        await client.SendMailAsync(message);
                    }
                }
                */

                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Email sending failed: {ex.Message}");
                return false;
            }
        }
    }
}
