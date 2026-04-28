namespace AquentaAPI.Models.DTOs
{
    /// <summary>
    /// Data Transfer Object for User responses.
    /// Prevents sensitive fields (password hash, IsDeleted, CreatedAt) from being exposed to the client.
    /// </summary>
    public class UserDto
    {
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string UserRole { get; set; } = string.Empty;
    }
}
