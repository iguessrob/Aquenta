using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;

namespace AquentaLibrary.Services
{
    public class TokenService
    {
        // In a real application, this should be stored securely (e.g., appsettings.json or Azure Key Vault)
        private static readonly string SecretKey = "AQUENTA_SECRET_KEY_FOR_TOKENS_2026!"; 
        
        public string GenerateResetToken(int userId, int expiryMinutes = 60)
        {
            var expiry = DateTime.UtcNow.AddMinutes(expiryMinutes);
            var payload = $"RESET|{userId}|{expiry:O}";
            return Encrypt(payload);
        }

        public string GenerateSessionToken(int userId, string role, int expiryHours = 24)
        {
            var expiry = DateTime.UtcNow.AddHours(expiryHours);
            var payload = $"SESSION|{userId}|{role}|{expiry:O}";
            return Encrypt(payload);
        }

        public (int UserId, string Role, bool IsValid) ValidateToken(string token)
        {
            try
            {
                var decrypted = Decrypt(token);
                var parts = decrypted.Split('|');
                
                if (parts[0] == "RESET")
                {
                    if (parts.Length != 3) return (0, string.Empty, false);
                    var userId = int.Parse(parts[1]);
                    var expiry = DateTime.Parse(parts[2]);
                    if (expiry < DateTime.UtcNow) return (0, string.Empty, false);
                    return (userId, string.Empty, true);
                }
                else if (parts[0] == "SESSION")
                {
                    if (parts.Length != 4) return (0, string.Empty, false);
                    var userId = int.Parse(parts[1]);
                    var role = parts[2];
                    var expiry = DateTime.Parse(parts[3]);
                    if (expiry < DateTime.UtcNow) return (0, string.Empty, false);
                    return (userId, role, true);
                }

                return (0, string.Empty, false);
            }
            catch
            {
                return (0, string.Empty, false);
            }
        }

        private string Encrypt(string plainText)
        {
            byte[] iv = new byte[16];
            byte[] array;

            using (Aes aes = Aes.Create())
            {
                aes.Key = GetKeyBytes();
                aes.IV = iv;

                ICryptoTransform encryptor = aes.CreateEncryptor(aes.Key, aes.IV);

                using (MemoryStream memoryStream = new MemoryStream())
                {
                    using (CryptoStream cryptoStream = new CryptoStream(memoryStream, encryptor, CryptoStreamMode.Write))
                    {
                        using (StreamWriter streamWriter = new StreamWriter(cryptoStream))
                        {
                            streamWriter.Write(plainText);
                        }
                        array = memoryStream.ToArray();
                    }
                }
            }

            return Convert.ToBase64String(array).Replace('+', '-').Replace('/', '_').Replace('=', '~'); // URL safe
        }

        private string Decrypt(string cipherText)
        {
            cipherText = cipherText.Replace('-', '+').Replace('_', '/').Replace('~', '='); // Restore base64
            byte[] iv = new byte[16];
            byte[] buffer = Convert.FromBase64String(cipherText);

            using (Aes aes = Aes.Create())
            {
                aes.Key = GetKeyBytes();
                aes.IV = iv;
                ICryptoTransform decryptor = aes.CreateDecryptor(aes.Key, aes.IV);

                using (MemoryStream memoryStream = new MemoryStream(buffer))
                {
                    using (CryptoStream cryptoStream = new CryptoStream(memoryStream, decryptor, CryptoStreamMode.Read))
                    {
                        using (StreamReader streamReader = new StreamReader(cryptoStream))
                        {
                            return streamReader.ReadToEnd();
                        }
                    }
                }
            }
        }

        private byte[] GetKeyBytes()
        {
            return SHA256.Create().ComputeHash(Encoding.UTF8.GetBytes(SecretKey));
        }
    }
}
